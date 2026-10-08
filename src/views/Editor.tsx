import { useEffect, useState } from 'react'
import { DemoMark, LangChip, StageChip } from '../components'
import { useStore } from '../store'
import { activeIssue, DEMO_TODAY, formatDay, STAGE_LABEL, STAGE_ORDER } from '../utils'

const CHECKS = [
  { id: 'facts', label: 'Факты сверены с источниками на экране' },
  { id: 'lang', label: 'Язык сценария совпадает с языком аккаунта' },
  { id: 'med', label: 'Нет обещаний вылечить или заменить врача' },
  { id: 'cta', label: 'Финал спокойный, без давления и крайних советов' },
]

export function Editor() {
  const { state, dispatch, selected } = useStore()
  const video = selected
  const account = video ? (state.accounts.find((item) => item.id === video.accountId) ?? null) : null
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [reviseOpen, setReviseOpen] = useState(false)
  const [note, setNote] = useState('')
  const [slot, setSlot] = useState(video?.scheduledAt ?? DEMO_TODAY)
  const live = state.mode === 'live'

  useEffect(() => {
    if (!video) return
    setChecks({})
    setReviseOpen(false)
    setNote('')
    setSlot(video.scheduledAt ?? DEMO_TODAY)
  }, [video?.id, video?.scheduledAt])

  if (!video || !account) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">Редактор</h1>
            <p className="page-lead">Сначала выберите ролик или добавьте тему.</p>
          </div>
        </header>
        <section className="card">
          <p className="empty">В библиотеке нет ролика для правки.</p>
          <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'section', section: 'production' })}>
            К производству
          </button>
        </section>
      </div>
    )
  }

  const checked = CHECKS.every((item) => checks[item.id])
  const issueOpen = activeIssue(video)
  const blockers: string[] = []
  if (video.stage !== 'review') blockers.push('Согласование доступно на этапе «Проверка».')
  if (issueOpen) blockers.push('Сначала разберите ошибку.')
  if (!checked) blockers.push('Отметьте четыре пункта проверки.')

  const advanceLabel =
    video.stage === 'topic'
      ? 'Передать в сценарии'
      : video.stage === 'script'
        ? 'Отправить на генерацию'
        : video.stage === 'generation'
          ? 'Отметить готовым к проверке'
          : null

  const lines = video.script
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Редактор</h1>
          <p className="page-lead">
            {live
              ? 'Сценарий, источники и предпросмотр. Решение записывается в базу, видеофайл не создаётся.'
              : 'Сценарий, источники и предпросмотр. Решение остаётся в демо-линии.'}
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'section', section: 'production' })}>
          К производству
        </button>
      </header>

      <div className="editor-toolbar">
        <label className="field field--inline">
          <span className="field__label">Ролик</span>
          <select
            className="control"
            value={video.id}
            onChange={(event) => dispatch({ type: 'open-video', id: event.target.value })}
          >
            {STAGE_ORDER.map((stage) => (
              <optgroup key={stage} label={STAGE_LABEL[stage]}>
                {state.videos
                  .filter((item) => item.stage === stage)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="vcard__meta">
          <StageChip stage={video.stage} />
          <LangChip language={video.language} />
          <span className="chip chip--neutral">{account.handle}</span>
          <DemoMark />
        </div>
      </div>

      <div className="editor-layout">
        <div className="stack">
          <section className="card">
            <div className="card__head">
              <h2 className="card__title">{video.title}</h2>
              <span className="muted">{video.script.length} знаков</span>
            </div>
            <label className="field">
              <span className="field__label">Сценарий</span>
              <textarea
                className="script"
                lang={video.language === 'kk' ? 'kk' : 'ru'}
                value={video.script}
                readOnly={video.published}
                onChange={(event) =>
                  dispatch({ type: 'update-script', id: video.id, script: event.target.value })
                }
              />
            </label>
            <p className="hint">Ориентир короткого ролика — до 700 знаков. Оценка длительности {video.duration}.</p>
            {video.published && (
              <p className="hint">{live ? 'Опубликованный ролик открыт для чтения.' : 'Опубликованный демо-ролик открыт для чтения.'}</p>
            )}
          </section>

          {video.gloss && (
            <section className="card gloss">
              <h2 className="card__title">Учебный подстрочник</h2>
              <p className="hint">Для редактора. В ролик попадает казахский текст выше, не этот перевод.</p>
              <p className="gloss__text">{video.gloss}</p>
            </section>
          )}

          {video.notes.length > 0 && (
            <section className="card">
              <h2 className="card__title">Комментарии на доработку</h2>
              <ol className="notes">
                {video.notes.map((item, index) => (
                  <li key={`${video.id}-${index}`}>{item}</li>
                ))}
              </ol>
            </section>
          )}

          <section className="card">
            <h2 className="card__title">Источники</h2>
            <ul className="sources">
              {video.sources.map((source) => (
                <li key={source.title} className="source">
                  <strong>{source.title}</strong>
                  <p>{source.note}</p>
                </li>
              ))}
            </ul>
          </section>

          {issueOpen && video.issue && (
            <section className="card card--alert">
              <h2 className="card__title">{video.issue.title}</h2>
              <p>{video.issue.detail}</p>
              <button type="button" className="btn btn--warn" onClick={() => dispatch({ type: 'dismiss-issue', id: video.id })}>
                {live ? 'Снять отметку' : 'Снять учебную отметку'}
              </button>
            </section>
          )}
        </div>

        <aside className="stack">
          <section className="card preview-card">
            <div className="card__head">
              <h2 className="card__title">Предпросмотр</h2>
              <DemoMark />
            </div>
            <div className="phone">
              <div className="phone__top">
                <span>Nutrilora</span>
                <span>{video.duration}</span>
              </div>
              <p className="phone__badge">Превью без файла</p>
              <div className="phone__sub">
                {lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <button
                type="button"
                className="phone__play"
                onClick={() =>
                  dispatch({
                    type: 'notice',
                    text: 'Файла видео нет. Превью показывает текст сценария. HeyGen и Creatomate не подключены.',
                  })
                }
              >
                Файл видео не подключён
              </button>
              <p className="phone__foot">
                {account.handle} · {video.language === 'kk' ? 'қазақша' : 'русский'}
              </p>
            </div>
            <p className="hint">HeyGen и Creatomate не подключены, поэтому ролик нельзя воспроизвести.</p>
          </section>

          <section className="card">
            <h2 className="card__title">Решение</h2>
            <ul className="checks">
              {CHECKS.map((item) => (
                <li key={item.id}>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(checks[item.id])}
                      onChange={(event) => setChecks((current) => ({ ...current, [item.id]: event.target.checked }))}
                    />
                    <span>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            {advanceLabel && (
              <button
                type="button"
                className="btn btn--ghost btn--block"
                disabled={issueOpen}
                onClick={() => dispatch({ type: 'advance', id: video.id })}
              >
                {advanceLabel}
              </button>
            )}
            <div className="actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={blockers.length > 0}
                onClick={() => dispatch({ type: 'approve', id: video.id })}
              >
                Согласовать
              </button>
              <button
                type="button"
                className="btn btn--warn"
                disabled={video.published || video.stage === 'topic'}
                onClick={() => setReviseOpen((open) => !open)}
              >
                На доработку
              </button>
            </div>
            {blockers.length > 0 && (
              <ul className="hint-list">
                {blockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {reviseOpen && (
              <div className="revise">
                <label className="field">
                  <span className="field__label">Что исправить</span>
                  <textarea
                    className="script script--short"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Коротко и по делу, минимум 8 символов"
                  />
                </label>
                <button
                  type="button"
                  className="btn btn--warn"
                  disabled={note.trim().length < 8}
                  onClick={() => {
                    dispatch({ type: 'revise', id: video.id, note })
                    setReviseOpen(false)
                    setNote('')
                  }}
                >
                  Вернуть в сценарии
                </button>
              </div>
            )}
            <p className="hint">
              {live ? 'Переход не вызывает HeyGen и Creatomate и не создаёт видеофайл.' : 'Демо-переход не вызывает API и не создаёт видеофайл.'}
            </p>
          </section>

          <section className="card">
            <h2 className="card__title">Слот публикации</h2>
            {video.stage !== 'ready' && <p className="hint">Слот ставится после этапа «Готово».</p>}
            {video.stage === 'ready' && video.published && video.scheduledAt && (
              <p>
                {live ? 'Опубликован' : 'Опубликован в демо-календаре'} {formatDay(video.scheduledAt)}.
              </p>
            )}
            {video.stage === 'ready' && !video.published && (
              <>
                <label className="field">
                  <span className="field__label">Дата слота</span>
                  <input className="control" type="date" value={slot} onChange={(event) => setSlot(event.target.value)} />
                </label>
                <div className="actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={!slot}
                    onClick={() => dispatch({ type: 'schedule', id: video.id, date: slot })}
                  >
                    Поставить в календарь
                  </button>
                  {video.scheduledAt && (
                    <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'unschedule', id: video.id })}>
                      Убрать слот
                    </button>
                  )}
                </div>
                {video.scheduledAt && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--block"
                    onClick={() => dispatch({ type: 'show-day', day: video.scheduledAt! })}
                  >
                    Показать {formatDay(video.scheduledAt)} в календаре
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--ghost btn--block"
                  disabled={!video.scheduledAt || issueOpen}
                  onClick={() => dispatch({ type: 'publish', id: video.id })}
                >
                  Отметить опубликованным
                </button>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
