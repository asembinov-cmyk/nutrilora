import { useState } from 'react'
import { useStore } from '../store'
import type { Language } from '../types'

export function NewAccountForm() {
  const { createAccount, busy, state } = useStore()
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [niche, setNiche] = useState('')
  const [language, setLanguage] = useState<Language>('ru')
  const [perDay, setPerDay] = useState(1)
  const [error, setError] = useState('')

  if (state.mode !== 'live') return null

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault()
        setError('')
        void createAccount({ name, handle, niche, language, perDay }).then((message) => {
          if (message) {
            setError(message)
            return
          }
          setName('')
          setHandle('')
          setNiche('')
        })
      }}
    >
      <h2 className="card__title">Новый аккаунт</h2>
      <p className="hint">Строка появится в вашей базе. Кабинет TikTok при этом не создаётся.</p>
      <div className="form-grid">
        <label className="field">
          <span className="field__label">Название</span>
          <input className="control" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="field">
          <span className="field__label">@handle</span>
          <input
            className="control"
            value={handle}
            placeholder="@nutrilora.kz"
            onChange={(event) => setHandle(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Ниша</span>
          <input className="control" value={niche} onChange={(event) => setNiche(event.target.value)} />
        </label>
      </div>
      <div className="field">
        <span className="field__label">Язык</span>
        <div className="seg" role="group" aria-label="Язык нового аккаунта">
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
        <span className="field__label">План роликов в день</span>
        <div className="stepper">
          <button type="button" className="btn btn--ghost" disabled={perDay <= 0} onClick={() => setPerDay((value) => value - 1)}>
            −
          </button>
          <span className="stepper__value num">{perDay === 0 ? 'Пауза' : perDay}</span>
          <button type="button" className="btn btn--ghost" disabled={perDay >= 6} onClick={() => setPerDay((value) => value + 1)}>
            +
          </button>
        </div>
      </div>
      {error && (
        <p className="notice-inline" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--primary" disabled={busy}>
        Записать аккаунт
      </button>
    </form>
  )
}

export function NewTopicForm() {
  const { createTopic, busy, state, dispatch } = useStore()
  const [accountId, setAccountId] = useState(state.accounts[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState<Language>(state.accounts[0]?.language ?? 'ru')
  const [error, setError] = useState('')

  if (state.mode !== 'live') return null
  if (state.accounts.length === 0) {
    return (
      <section className="card">
        <h2 className="card__title">Новая тема</h2>
        <p className="hint">Сначала запишите аккаунт TikTok.</p>
        <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'section', section: 'accounts' })}>
          К аккаунтам
        </button>
      </section>
    )
  }

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault()
        setError('')
        void createTopic({ accountId, title, language }).then((message) => {
          if (message) setError(message)
          else setTitle('')
        })
      }}
    >
      <h2 className="card__title">Новая тема</h2>
      <div className="form-grid">
        <label className="field">
          <span className="field__label">Аккаунт</span>
          <select
            className="control"
            value={accountId}
            onChange={(event) => {
              const nextId = event.target.value
              setAccountId(nextId)
              const account = state.accounts.find((item) => item.id === nextId)
              if (account) setLanguage(account.language)
            }}
          >
            {state.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.handle}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Название</span>
          <input className="control" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
      </div>
      <div className="field">
        <span className="field__label">Язык ролика</span>
        <div className="seg" role="group" aria-label="Язык новой темы">
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
      {error && (
        <p className="notice-inline" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--primary" disabled={busy}>
        Добавить тему
      </button>
    </form>
  )
}

export function DemoImportCard() {
  const { importDemo, busy, state } = useStore()
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')
  const empty = state.accounts.length === 0 && state.videos.length === 0

  if (state.mode !== 'live' || state.status !== 'ready' || !empty) return null

  return (
    <section className="card">
      <h2 className="card__title">База пока пустая</h2>
      <p>
        Можно записать учебную библиотеку: те же демо-аккаунты и ролики, но с новыми идентификаторами. Просмотры,
        расходы и ошибки в ней демонстрационные, это не статистика TikTok.
      </p>
      {error && (
        <p className="notice-inline" role="alert">
          {error}
        </p>
      )}
      {confirm ? (
        <div className="actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={() => {
              setError('')
              void importDemo().then((message) => {
                if (message) setError(message)
              })
            }}
          >
            Записать учебную библиотеку
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setConfirm(false)}>
            Отмена
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn--ghost" onClick={() => setConfirm(true)}>
          Загрузить учебную библиотеку
        </button>
      )}
    </section>
  )
}
