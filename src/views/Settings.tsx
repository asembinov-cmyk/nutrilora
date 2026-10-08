import { useState } from 'react'
import { FLOW_STEPS, INTEGRATIONS } from '../data'

const STATUS_LABEL = {
  disconnected: 'Не подключено',
} as const

export function Settings() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Настройки интеграций</h1>
          <p className="page-lead">
            Supabase, n8n, ElevenLabs, HeyGen и Creatomate. Сейчас у каждого сервиса статус «не подключено».
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
          return (
            <article key={item.id} className="card integration">
              <div className="card__head">
                <h2 className="card__title">{item.name}</h2>
                <span className="status">
                  <span className="status__dot" aria-hidden="true" />
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
              <p>{item.purpose}</p>
              <ul className="fake-fields">
                {item.fields.map((field) => (
                  <li key={field} className="fake-field">
                    <span>{field}</span>
                    <span className="fake-field__value">Следующий этап</span>
                  </li>
                ))}
              </ul>
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
                  На этом этапе подключение недоступно. Ключ не запрашивается и не сохраняется. Следующим шагом свяжем{' '}
                  {item.name} с контент-заводом и только после проверки покажем статус «Подключено».
                </p>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
