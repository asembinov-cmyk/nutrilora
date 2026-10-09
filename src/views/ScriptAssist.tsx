import { useEffect, useState } from 'react'
import { useStore } from '../store'
import type { Language, Video } from '../types'

type Platform = 'tiktok' | 'instagram'
type Seconds = 15 | 30 | 60

async function ownerToken(): Promise<string | null> {
  const { getSupabase: loadClient } = await import('../lib/supabase')
  const supabase = loadClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export function ScriptAssist({ video, live }: { video: Video; live: boolean }) {
  const { dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState<Language>(video.language)
  const [platform, setPlatform] = useState<Platform>('tiktok')
  const [seconds, setSeconds] = useState<Seconds>(30)
  const [topic, setTopic] = useState(video.title)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [lastScript, setLastScript] = useState('')

  useEffect(() => {
    setOpen(false)
    setLanguage(video.language)
    setPlatform('tiktok')
    setSeconds(30)
    setTopic(video.title)
    setError('')
    setLastScript('')
    setPending(false)
  }, [video.id, video.language, video.title])

  async function generate() {
    if (video.published || pending) return
    if (lastScript && video.script !== lastScript) {
      const replace = window.confirm('Заменить отредактированный сценарий новым?')
      if (!replace) return
    }
    setError('')
    setPending(true)
    try {
      const token = live ? await ownerToken() : null
      if (live && !token) {
        setError('Войдите как владелец, чтобы создать сценарий.')
        return
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ language, platform, topic: topic.trim(), seconds }),
      })
      const text = await response.text()
      let payload: { error?: string; script?: string; language?: Language }
      try {
        payload = JSON.parse(text) as { error?: string; script?: string; language?: Language }
      } catch {
        setError('Сервер генерации не отвечает. Проверьте, что функция /api/generate развёрнута.')
        return
      }
      if (!response.ok || !payload.script) {
        setError(payload.error || 'Сценарий не собрался. Попробуйте ещё раз.')
        return
      }
      setLastScript(payload.script)
      dispatch({
        type: 'update-script',
        id: video.id,
        script: payload.script,
        language: payload.language ?? language,
      })
    } catch {
      setError('Нет связи с сервером генерации. Попробуйте ещё раз.')
    } finally {
      setPending(false)
    }
  }

  function save() {
    dispatch({ type: 'update-script', id: video.id, script: video.script, language })
    dispatch({
      type: 'notice',
      text: live ? 'Сценарий записан в базу.' : 'Сценарий оставлен в этом сеансе. На сервере он не сохраняется.',
    })
  }

  async function copy() {
    if (!video.script.trim()) {
      dispatch({ type: 'notice', text: 'В сценарии пока пусто.' })
      return
    }
    try {
      await navigator.clipboard.writeText(video.script)
      dispatch({ type: 'notice', text: 'Сценарий скопирован.' })
    } catch {
      dispatch({ type: 'notice', text: 'Не удалось скопировать. Выделите текст в поле сценария.' })
    }
  }

  return (
    <div className="assist">
      {!open ? (
        <button type="button" className="btn btn--primary" disabled={video.published} onClick={() => setOpen(true)}>
          ✨ Создать сценарий с ИИ
        </button>
      ) : (
        <div className="stack">
          <div className="form-grid">
            <div className="field">
              <span className="field__label">Язык</span>
              <div className="seg" role="group" aria-label="Язык сценария">
                <button
                  type="button"
                  className={language === 'ru' ? 'seg__btn is-active' : 'seg__btn'}
                  onClick={() => setLanguage('ru')}
                >
                  Русский
                </button>
                <button
                  type="button"
                  className={language === 'kk' ? 'seg__btn is-active' : 'seg__btn'}
                  onClick={() => setLanguage('kk')}
                >
                  Казахский
                </button>
              </div>
            </div>
            <div className="field">
              <span className="field__label">Платформа</span>
              <div className="seg" role="group" aria-label="Платформа">
                <button
                  type="button"
                  className={platform === 'tiktok' ? 'seg__btn is-active' : 'seg__btn'}
                  onClick={() => setPlatform('tiktok')}
                >
                  TikTok
                </button>
                <button
                  type="button"
                  className={platform === 'instagram' ? 'seg__btn is-active' : 'seg__btn'}
                  onClick={() => setPlatform('instagram')}
                >
                  Instagram
                </button>
              </div>
            </div>
            <div className="field">
              <span className="field__label">Длительность</span>
              <div className="seg" role="group" aria-label="Длительность ролика">
                {([15, 30, 60] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={seconds === value ? 'seg__btn is-active' : 'seg__btn'}
                    onClick={() => setSeconds(value)}
                  >
                    {value} с
                  </button>
                ))}
              </div>
            </div>
          </div>
          <label className="field">
            <span className="field__label">Тема ролика</span>
            <input
              className="control"
              value={topic}
              maxLength={400}
              lang={language === 'kk' ? 'kk' : 'ru'}
              onChange={(event) => setTopic(event.target.value)}
            />
          </label>
          {error && (
            <p className="notice-inline" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <button type="button" className="btn btn--primary" disabled={pending || video.published || topic.trim().length < 8} onClick={() => void generate()}>
              {pending ? 'Пишем сценарий…' : lastScript ? 'Перегенерировать' : '✨ Создать сценарий с ИИ'}
            </button>
            <button type="button" className="btn btn--ghost" disabled={pending} onClick={save}>
              Сохранить
            </button>
            <button type="button" className="btn btn--ghost" disabled={pending} onClick={() => void copy()}>
              Копировать
            </button>
          </div>
          <p className="hint">Запрос идёт в OpenAI через сервер. Ключ в браузер не попадает и в чат его присылать не нужно.</p>
        </div>
      )}
      {video.published && <p className="hint">Опубликованный ролик для чтения: новый сценарий не создаётся.</p>}
    </div>
  )
}
