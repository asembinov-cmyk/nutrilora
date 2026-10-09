import assert from 'node:assert/strict'
import { test } from 'node:test'
import { completeGenerate, composeScript, parseGenerateBody, runGenerate } from './generate.ts'

const topic = 'Что поесть после тренировки, если нет времени готовить'

test('rejects a topic that is too short', () => {
  const parsed = parseGenerateBody({ language: 'ru', platform: 'tiktok', topic: 'еда', seconds: 30 })
  assert.equal('error' in parsed, true)
})

test('accepts a normal request', () => {
  const parsed = parseGenerateBody({ language: 'kk', platform: 'instagram', topic, seconds: 15 })
  assert.deepEqual(parsed, { language: 'kk', platform: 'instagram', topic, seconds: 15 })
})

test('compose keeps at most the supplied hashtags and skips an empty mention', () => {
  const script = composeScript({
    hook: 'После зала хочется есть сразу.',
    body: 'Соберите тарелку из того, что уже есть дома.',
    facts: ['Белок помогает дотерпеть до ужина.', 'Сладкий батончик не обязателен.'],
    mention: '',
    cta: 'Сохраните, если узнали свой вечер.',
    caption: 'Обычный ужин после тренировки.',
    hashtags: ['#nutrilora', '#еда'],
  })
  assert.match(script, /Начало/)
  assert.doesNotMatch(script, /Nutrilora\n/)
  assert.match(script, /#nutrilora #еда/)
})

test('anonymous request does not call OpenAI', async () => {
  let called = false
  const result = await runGenerate(
    { method: 'POST', headers: {}, body: { language: 'ru', platform: 'tiktok', topic, seconds: 30 } },
    { OPENAI_API_KEY: 'sk-test-not-real' },
    async () => {
      called = true
      return new Response('no')
    },
  )
  assert.equal(called, false)
  assert.equal(result.status, 401)
  assert.match(result.json.error ?? '', /владелец/)
})

test('missing OpenAI key is reported only after the owner is known', async () => {
  const result = await completeGenerate(
    { language: 'ru', platform: 'tiktok', topic, seconds: 60 },
    {},
  )
  assert.equal(result.status, 503)
  assert.match(result.json.error ?? '', /OPENAI_API_KEY/)
  assert.equal(JSON.stringify(result.json).includes('sk-'), false)
})

test('a successful model response becomes an editable script and hides the key', async () => {
  const result = await completeGenerate(
    { language: 'ru', platform: 'tiktok', topic, seconds: 30 },
    { OPENAI_API_KEY: 'sk-test-not-real' },
    async (_url, init) => {
      const headers = new Headers(init?.headers)
      assert.equal(headers.get('authorization'), 'Bearer sk-test-not-real')
      const body = JSON.parse(String(init?.body))
      assert.equal(JSON.stringify(body).includes('sk-test-not-real'), false)
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                hook: 'После зала холодильник кажется единственным планом.',
                body: 'Не обязательно заказывать доставку. Рис, яйцо и огурец уже закрывают голод.',
                facts: ['Тёплая еда сытнее холодного перекуса.', 'Вода рядом помогает не перепутать жажду с голодом.'],
                mention: 'В Nutrilora как раз про такие обычные тарелки, без подвига на кухне.',
                cta: 'Сохраните на вечер после тренировки.',
                caption: 'Простой ужин, когда готовить уже не хочется.',
                hashtags: ['еда', '#nutrilora', '#спорт', 'еда', '#лишнее', '#ещё', '#много'],
              }),
            },
          },
        ],
      })
    },
  )
  assert.equal(result.status, 200)
  assert.match(result.json.script ?? '', /После зала/)
  assert.match(result.json.script ?? '', /#еда #nutrilora #спорт #лишнее #ещё/)
  assert.equal((result.json.script ?? '').includes('#много'), false)
  assert.equal(JSON.stringify(result.json).includes('sk-test-not-real'), false)
})

test('OpenAI error text is not returned to the browser', async () => {
  const result = await completeGenerate(
    { language: 'ru', platform: 'instagram', topic, seconds: 15 },
    { OPENAI_API_KEY: 'sk-test-not-real' },
    async () => new Response('Incorrect API key provided: sk-test-not-real', { status: 401 }),
  )
  assert.equal(result.status, 502)
  assert.equal(JSON.stringify(result.json).includes('sk-test-not-real'), false)
  assert.match(result.json.error ?? '', /OPENAI_API_KEY/)
})
