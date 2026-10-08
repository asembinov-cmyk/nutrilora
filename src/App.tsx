import { useEffect } from 'react'
import { Icon, type IconName } from './components'
import { useStore } from './store'
import type { Role, Section } from './types'
import { activeIssue, DEMO_TODAY, formatDayLong, ROLE_LABEL, SECTION_LABEL } from './utils'
import { Accounts } from './views/Accounts'
import { Analytics } from './views/Analytics'
import { Calendar } from './views/Calendar'
import { Editor } from './views/Editor'
import { Overview } from './views/Overview'
import { Production } from './views/Production'
import { Settings } from './views/Settings'

const NAV: Array<{ id: Section; label: string; icon: IconName }> = [
  { id: 'overview', label: 'Обзор', icon: 'grid' },
  { id: 'accounts', label: 'Аккаунты', icon: 'users' },
  { id: 'production', label: 'Производство', icon: 'flow' },
  { id: 'editor', label: 'Редактор', icon: 'pen' },
  { id: 'calendar', label: 'Календарь', icon: 'calendar' },
  { id: 'analytics', label: 'Аналитика', icon: 'chart' },
  { id: 'settings', label: 'Настройки', icon: 'sliders' },
]

const VIEWS = {
  overview: Overview,
  accounts: Accounts,
  production: Production,
  editor: Editor,
  calendar: Calendar,
  analytics: Analytics,
  settings: Settings,
}

export function App() {
  const { state, dispatch, reload, signOut } = useStore()

  useEffect(() => {
    document.title = `${SECTION_LABEL[state.section]} · Контент-завод Nutrilora`
  }, [state.section])

  const reviewCount = state.videos.filter((video) => video.stage === 'review').length
  const issueCount = state.videos.filter(activeIssue).length
  const View = VIEWS[state.section]

  return (
    <div className="app">
      <a className="skip" href="#content">
        К содержанию
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <Icon name="leaf" />
          </span>
          <span>
            <span className="brand__name">Nutrilora</span>
            <span className="brand__sub">Контент-завод</span>
          </span>
        </div>
        <nav className="nav" aria-label="Разделы">
          {NAV.map((item) => {
            const badge = item.id === 'overview' ? issueCount : item.id === 'editor' ? reviewCount : 0
            const active = state.section === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={active ? 'nav__btn is-active' : 'nav__btn'}
                aria-current={active ? 'page' : undefined}
                onClick={() =>
                  dispatch(
                    item.id === 'production'
                      ? { type: 'production-home' }
                      : { type: 'section', section: item.id },
                  )
                }
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {badge > 0 && <span className="nav__badge">{badge}</span>}
              </button>
            )
          })}
        </nav>
        <div className="sidebar__foot">
          {state.mode === 'demo' ? (
            <>
              <p className="hint">Этап 1 · учебный срез. Обновление страницы вернёт исходные данные.</p>
              <button type="button" className="btn btn--ghost btn--block" onClick={() => dispatch({ type: 'reset' })}>
                Сбросить сеанс
              </button>
            </>
          ) : (
            <>
              <p className="hint">{state.email}</p>
              <button type="button" className="btn btn--ghost btn--block" onClick={() => reload()}>
                Обновить из базы
              </button>
              <button type="button" className="btn btn--ghost btn--block" onClick={() => signOut()}>
                Выйти
              </button>
            </>
          )}
        </div>
      </aside>
      <div className="main">
        <div className="sticky-head">
          {state.mode === 'demo' ? (
            <div className="banner" role="status">
              <span className="chip chip--demo">Демонстрационные данные</span>
              <p>Цифры, ролики и статусы учебные. API и реальные видео пока не подключены.</p>
            </div>
          ) : (
            <div className="banner banner--live" role="status">
              <span className="chip chip--ru">{state.status === 'loading' ? 'Загрузка' : 'База владельца'}</span>
              <p>
                {state.status === 'loading'
                  ? 'Читаем аккаунты, ролики и календарь.'
                  : 'Данные читаются из Supabase. HeyGen, ElevenLabs, n8n и Creatomate не подключены.'}
              </p>
            </div>
          )}
          <header className="topbar">
            <p className="topbar__date">{formatDayLong(DEMO_TODAY)}</p>
            <div className="role" role="group" aria-label="Роль на панели">
              {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  className={state.role === role ? 'seg__btn is-active' : 'seg__btn'}
                  aria-pressed={state.role === role}
                  onClick={() => dispatch({ type: 'role', role })}
                >
                  {ROLE_LABEL[role]}
                </button>
              ))}
            </div>
          </header>
        </div>
        <main className="wrap" id="content">
          <View />
        </main>
      </div>
      {state.notice && (
        <div className="toast" role="status">
          {state.notice.text}
        </div>
      )}
    </div>
  )
}
