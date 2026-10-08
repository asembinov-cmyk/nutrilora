import { useState } from 'react'
import { DemoMark, LangChip } from '../components'
import { useStore } from '../store'
import type { Account, Language } from '../types'
import { DEMO_TODAY, formatDay, plural } from '../utils'

export function Accounts() {
  const { state } = useStore()
  const [languages, setLanguages] = useState<Language | 'all'>('all')

  const visible = state.accounts.filter((account) => languages === 'all' || account.language === languages)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Аккаунты TikTok</h1>
          <p className="page-lead">
            Ниша, язык и план роликов в день. Изменения живут только в этом сеансе и не уходят в кабинеты.
          </p>
        </div>
        <DemoMark />
      </header>

      <div className="filters">
        <div className="seg" role="tablist" aria-label="Фильтр по языку">
          <FilterChip current={languages} value="all" label="Все языки" onPick={setLanguages} />
          <FilterChip current={languages} value="ru" label="Русский" onPick={setLanguages} />
          <FilterChip current={languages} value="kk" label="Казахский" onPick={setLanguages} />
        </div>
      </div>

      <div className="account-grid">
        {visible.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
      {visible.length === 0 && <p className="empty">Нет аккаунтов с выбранным языком.</p>}

      <p className="footnote">
        Подписчики и живой статус кабинета появятся после подключения TikTok. Сейчас на {formatDay(DEMO_TODAY)} план
        сравнивается только с демо-календарём.
      </p>
    </div>
  )
}

function FilterChip({
  current,
  value,
  label,
  onPick,
}: {
  current: Language | 'all'
  value: Language | 'all'
  label: string
  onPick: (value: Language | 'all') => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={current === value}
      className={current === value ? 'seg__btn is-active' : 'seg__btn'}
      onClick={() => onPick(value)}
    >
      {label}
    </button>
  )
}

function AccountCard({ account }: { account: Account }) {
  const { state, dispatch } = useStore()
  const today = state.videos.filter((video) => video.accountId === account.id && video.scheduledAt === DEMO_TODAY).length
  const inLine = state.videos.filter((video) => video.accountId === account.id).length

  return (
    <article className="card account-card">
      <div className="card__head">
        <div>
          <h2 className="card__title">{account.name}</h2>
          <p className="handle">{account.handle}</p>
        </div>
        <LangChip language={account.language} />
      </div>

      <label className="field">
        <span className="field__label">Ниша</span>
        <input
          className="control"
          value={account.niche}
          lang={account.language === 'kk' ? 'kk' : 'ru'}
          onChange={(event) =>
            dispatch({ type: 'update-account', id: account.id, patch: { niche: event.target.value } })
          }
        />
      </label>

      <div className="field">
        <span className="field__label">Язык новых роликов</span>
        <div className="seg" role="group" aria-label={`Язык аккаунта ${account.handle}`}>
          <button
            type="button"
            className={account.language === 'ru' ? 'seg__btn is-active' : 'seg__btn'}
            onClick={() => dispatch({ type: 'update-account', id: account.id, patch: { language: 'ru' } })}
          >
            Русский
          </button>
          <button
            type="button"
            className={account.language === 'kk' ? 'seg__btn is-active' : 'seg__btn'}
            onClick={() => dispatch({ type: 'update-account', id: account.id, patch: { language: 'kk' } })}
          >
            Казахский
          </button>
        </div>
        <p className="hint">Уже созданные ролики язык не меняют.</p>
      </div>

      <div className="field">
        <span className="field__label">План роликов в день</span>
        <div className="stepper">
          <button
            type="button"
            className="btn btn--ghost"
            aria-label="Меньше роликов в день"
            disabled={account.perDay <= 0}
            onClick={() =>
              dispatch({ type: 'update-account', id: account.id, patch: { perDay: account.perDay - 1 } })
            }
          >
            −
          </button>
          <span className="stepper__value num">
            {account.perDay === 0
              ? 'Пауза'
              : `${account.perDay} ${plural(account.perDay, 'ролик', 'ролика', 'роликов')}`}
          </span>
          <button
            type="button"
            className="btn btn--ghost"
            aria-label="Больше роликов в день"
            disabled={account.perDay >= 6}
            onClick={() =>
              dispatch({ type: 'update-account', id: account.id, patch: { perDay: account.perDay + 1 } })
            }
          >
            +
          </button>
        </div>
      </div>

      <dl className="facts facts--compact">
        <div>
          <dt>В календаре сегодня</dt>
          <dd className="num">
            {today} из {account.perDay}
          </dd>
        </div>
        <div>
          <dt>Роликов в библиотеке</dt>
          <dd className="num">{inLine}</dd>
        </div>
      </dl>

      <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'focus-account', accountId: account.id })}>
        Ролики аккаунта
      </button>
    </article>
  )
}
