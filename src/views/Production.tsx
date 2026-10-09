import { LangChip, StageChip } from '../components'
import { useFilteredVideos, useStore } from '../store'
import type { Language } from '../types'
import { cx, excerpt, STAGE_LABEL, STAGE_ORDER } from '../utils'
import { NewTopicForm } from './LibraryForms'

export function Production() {
  const { state, dispatch } = useStore()
  const filtered = useFilteredVideos()
  const { productionFilter, accounts } = state
  const focused = productionFilter.stage !== 'all'

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Производство</h1>
          <p className="page-lead">
            {state.mode === 'live'
              ? 'Темы → сценарии → генерация → проверка → готово. Карточка открывает редактор. HeyGen и Creatomate не вызываются.'
              : 'Темы → сценарии → генерация → проверка → готово. Карточка открывает редактор. Переход по линии — демо, внешние сервисы не вызываются.'}
          </p>
        </div>
      </header>

      <NewTopicForm />

      <div className="filters">
        <label className="field field--inline">
          <span className="sr-only">Поиск ролика</span>
          <input
            className="control search"
            type="search"
            placeholder="Название или аккаунт"
            value={productionFilter.query}
            onChange={(event) => dispatch({ type: 'set-filter', patch: { query: event.target.value } })}
          />
        </label>
        <label className="field field--inline">
          <span className="sr-only">Аккаунт</span>
          <select
            className="control"
            value={productionFilter.accountId}
            onChange={(event) => dispatch({ type: 'set-filter', patch: { accountId: event.target.value } })}
          >
            <option value="all">Все аккаунты</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.handle}
              </option>
            ))}
          </select>
        </label>
        <div className="seg" role="group" aria-label="Язык ролика">
          <LangButton value="all" label="Все" />
          <LangButton value="ru" label="Русский" />
          <LangButton value="kk" label="Казахский" />
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'production-home' })}>
          Сбросить фильтр
        </button>
      </div>

      <div className="board">
        {STAGE_ORDER.map((stage) => {
          const cards = filtered.filter((video) => video.stage === stage)
          return (
            <section key={stage} className={cx('column', focused && productionFilter.stage !== stage && 'is-dim')}>
              <header className="column__head">
                <h2>{STAGE_LABEL[stage]}</h2>
                <span className="column__count num">{cards.length}</span>
              </header>
              <div className="column__body">
                {cards.length === 0 && <p className="empty">Нет роликов</p>}
                {cards.map((video) => {
                  const account = accounts.find((item) => item.id === video.accountId)
                  return (
                    <button
                      key={video.id}
                      type="button"
                      className="vcard"
                      onClick={() => dispatch({ type: 'open-video', id: video.id })}
                    >
                      <span className="vcard__title">{video.title}</span>
                      <span className="vcard__meta">
                        <LangChip language={video.language} />
                        {video.issue && !video.issue.dismissed && <span className="chip chip--bad">Ошибка</span>}
                        {video.published && <span className="chip chip--neutral">Опубликован</span>}
                      </span>
                      <span className="vcard__excerpt">{excerpt(video.script)}</span>
                      <span className="vcard__foot">
                        <StageChip stage={stage} />
                        <span className="muted">{account?.handle}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function LangButton({ value, label }: { value: Language | 'all'; label: string }) {
  const { state, dispatch } = useStore()
  const active = state.productionFilter.language === value
  return (
    <button
      type="button"
      className={active ? 'seg__btn is-active' : 'seg__btn'}
      aria-pressed={active}
      onClick={() => dispatch({ type: 'set-filter', patch: { language: value } })}
    >
      {label}
    </button>
  )
}
