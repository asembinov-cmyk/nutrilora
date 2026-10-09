import { useState } from 'react'
import { FLOW_STEPS, INTEGRATIONS } from '../data'
import { useStore } from '../store'

const STATUS_LABEL = {
  disconnected: 'Не подключено',
} as const

export function Settings() {
  const { state } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const live = state.mode === 'live'

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Настройки интеграций</h1>
          <p className="page-lead">
            {live
              ? 'Сессия Supabase открыта. n8n, ElevenLabs, HeyGen и Creatomate остаются неподключёнными.'
              : 'Supabase, n8n, ElevenLabs, HeyGen и Creatomate. Сейчас у каждого сервиса статус «не подключено».'}
          </p>
        </div>
      </header>

      <section className="card">
        <div className="card__head">
          <h2 className="card__title">Будущая линия</h2>
          <p className="card__lead">Так сервисы встанут в цепочку на следующем этапе. Сейчас шаги только обозначены.</p>
        </div>
        <ol className="flow">
          {FLOW_STEPS.map((step, index) => (
            <li key={step} className="flow__item">
              <span className="flow__step">{step}</span>
              {index < FLOW_STEPS.length - 1 && <span className="flow__arrow" aria-hidden="true">→</span>}
            </li>
          ))}
        </ol>
        <p className="hint">Статус «Подключено» появится после реальной проверки соединения.</p>
      </section>

      <div className="integrations">
        {INTEGRATIONS.map((item) => {
          const opened = openId === item.id
          const session = live && item.id === 'supabase'
          return (
            <article key={item.id} className="card integration">
              <div className="card__head">
                <h2 className="card__title">{item.name}</h2>
                <span className={session ? 'status is-on' : 'status'}>
                  <span className="status__dot" aria-hidden="true" />
                  {session ? 'Сессия владельца' : STATUS_LABEL[item.status]}
                </span>
              </div>
              <p>{item.purpose}</p>
              {session ? (
                <ul className="fake-fields">
                  <li className="fake-field">
                    <span>Сессия</span>
                    <span className="fake-field__value">{state.email}</span>
                  </li>
                  <li className="fake-field">
                    <span>Ключ service_role</span>
                    <span className="fake-field__value">Не используется</span>
                  </li>
                </ul>
              ) : (
                <ul className="fake-fields">
                  {item.fields.map((field) => (
                    <li key={field} className="fake-field">
                      <span>{field}</span>
                      <span className="fake-field__value">Следующий этап</span>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="btn btn--ghost"
                aria-expanded={opened}
                onClick={() => setOpenId(opened ? null : item.id)}
              >
                Как подключим
              </button>
              {opened && (
                <p className="notice-inline">
                  {session
                    ? 'Панель входит публичным ключом и сессией владельца. Секретный ключ service_role в браузер не попадает и в чат его присылать не нужно.'
                    : `На этом этапе ${item.name} не подключён. Ключ не запрашивается и не сохраняется. Статус «Подключено» появится только после реальной проверки.`}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
