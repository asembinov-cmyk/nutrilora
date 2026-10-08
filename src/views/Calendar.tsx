import { LangChip } from '../components'
import { useStore } from '../store'
import {
  activeIssue,
  cx,
  DEMO_TODAY,
  formatDay,
  formatDayLong,
  formatMonth,
  monthGrid,
  plural,
} from '../utils'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function Calendar() {
  const { state, dispatch, accountOf } = useStore()
  const cells = monthGrid(state.year, state.month)
  const selected = state.videos.filter((video) => video.scheduledAt === state.selectedDay)
  const monthCount = state.videos.filter((video) => {
    if (!video.scheduledAt) return false
    const [year, month] = video.scheduledAt.split('-').map(Number)
    return year === state.year && month - 1 === state.month
  }).length

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Календарь публикаций</h1>
          <p className="page-lead">
            {state.mode === 'live'
              ? 'Слоты из базы. Отметка «опубликовано» остаётся на этой панели и не уходит в TikTok.'
              : 'Слоты демо-библиотеки. Отметка «опубликовано» остаётся на этой панели и не уходит в TikTok.'}
          </p>
        </div>
      </header>

      <div className="calendar-layout">
        <section className="card cal">
          <div className="cal__head">
            <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'shift-month', delta: -1 })}>
              Предыдущий
            </button>
            <div>
              <h2 className="card__title">{formatMonth(state.year, state.month)}</h2>
              <p className="hint">
                {monthCount} {plural(monthCount, 'слот', 'слота', 'слотов')} в этом месяце
              </p>
            </div>
            <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'shift-month', delta: 1 })}>
              Следующий
            </button>
          </div>
          <div className="cal__week">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="cal__grid">
            {cells.map((iso, index) => {
              if (!iso) return <span key={`empty-${index}`} className="cal-day cal-day--empty" />
              const day = Number(iso.slice(-2))
              const items = state.videos.filter((video) => video.scheduledAt === iso)
              const hasIssue = items.some(activeIssue)
              return (
                <button
                  key={iso}
                  type="button"
                  className={cx(
                    'cal-day',
                    iso === state.selectedDay && 'is-selected',
                    iso === DEMO_TODAY && 'is-today',
                  )}
                  aria-pressed={iso === state.selectedDay}
                  aria-label={`${formatDay(iso)}, ${items.length} ${plural(items.length, 'ролик', 'ролика', 'роликов')}`}
                  onClick={() => dispatch({ type: 'select-day', day: iso })}
                >
                  <span className="cal-day__num">
                    {day}
                    {hasIssue && <span className="cal-day__dot" aria-hidden="true" />}
                  </span>
                  <span className="cal-day__pills">
                    {items.slice(0, 2).map((video) => (
                      <span key={video.id} className={video.language === 'kk' ? 'cal-pill cal-pill--kk' : 'cal-pill'}>
                        {video.title}
                      </span>
                    ))}
                    {items.length > 2 && <span className="muted">ещё {items.length - 2}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="card day-panel">
          <h2 className="card__title">{formatDayLong(state.selectedDay)}</h2>
          {state.selectedDay === DEMO_TODAY && (
            <p className={state.mode === 'live' ? 'chip chip--ru' : 'chip chip--demo'}>
              {state.mode === 'live' ? 'Сегодня' : 'Демо-сегодня'}
            </p>
          )}
          {selected.length === 0 ? (
            <p className="empty">На этот день слотов нет. Готовый ролик ставится из редактора.</p>
          ) : (
            <ul className="day-list">
              {selected.map((video) => {
                const account = accountOf(video.accountId)
                return (
                  <li key={video.id} className="day-item">
                    <div className="vcard__meta">
                      <LangChip language={video.language} />
                      {video.published ? (
                        <span className="chip chip--neutral">Опубликован</span>
                      ) : (
                        <span className="chip chip--neutral">Ждёт отметки</span>
                      )}
                      {activeIssue(video) && <span className="chip chip--bad">Ошибка</span>}
                    </div>
                    <h3>{video.title}</h3>
                    <p className="muted">
                      {account.handle} · {account.niche}
                    </p>
                    {activeIssue(video) && <p className="hint">Сначала снимите учебную ошибку в редакторе.</p>}
                    <div className="actions">
                      <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'open-video', id: video.id })}>
                        В редактор
                      </button>
                      {!video.published && (
                        <button
                          type="button"
                          className="btn btn--ghost"
                          disabled={video.stage !== 'ready' || activeIssue(video)}
                          onClick={() => dispatch({ type: 'publish', id: video.id })}
                        >
                          Отметить опубликованным
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
