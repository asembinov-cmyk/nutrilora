import { DemoMark } from '../components'
import { useStore } from '../store'
import { DemoImportCard, NewAccountForm } from './LibraryForms'
import type { Video } from '../types'
import {
  activeIssue,
  DEMO_TODAY,
  formatDay,
  formatMoney,
  formatNumber,
  plural,
  STAGE_LABEL,
  STAGE_ORDER,
  videoCost,
} from '../utils'

export function Overview() {
  const { state, dispatch, accountOf } = useStore()
  const { videos, accounts, role } = state
  const live = state.mode === 'live'
  const ready = videos.filter((video) => video.stage === 'ready')
  const published = videos.filter((video) => video.published)
  const issues = videos.filter(activeIssue)
  const spend = videos.reduce((sum, video) => sum + videoCost(video.cost), 0)
  const voice = videos.reduce((sum, video) => sum + (video.cost?.voice ?? 0), 0)
  const avatar = videos.reduce((sum, video) => sum + (video.cost?.avatar ?? 0), 0)
  const assembly = videos.reduce((sum, video) => sum + (video.cost?.assembly ?? 0), 0)
  const charged = videos.filter((video) => videoCost(video.cost) > 0)
  const average = charged.length ? Math.round(spend / charged.length) : 0
  const todayPlan = accounts.reduce((sum, account) => sum + account.perDay, 0)
  const todaySlots = videos.filter((video) => video.scheduledAt === DEMO_TODAY).length
  const unscheduled = ready.filter((video) => !video.scheduledAt)
  const review = videos.filter((video) => video.stage === 'review')
  const returned = videos.filter((video) => video.stage === 'script' && video.notes.length > 0)
  const recent = [...published].sort((a, b) => (b.scheduledAt ?? '').localeCompare(a.scheduledAt ?? ''))

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Обзор</h1>
          <p className="page-lead">
            {live
              ? `Готовые ролики, публикации, расходы и ошибки. Дата панели — ${formatDay(DEMO_TODAY)}.`
              : `Готовые ролики, публикации, расходы и ошибки на демо-дату ${formatDay(DEMO_TODAY)}. Цифры считаются по библиотеке этого сеанса.`}
          </p>
        </div>
      </header>

      {live && state.status === 'error' && accounts.length === 0 && (
        <section className="card">
          <h2 className="card__title">Библиотека не прочиталась</h2>
          <p className="hint">Проверьте, что вход выполнен, и обновите данные из базы.</p>
        </section>
      )}
      <DemoImportCard />
      {live && accounts.length === 0 && state.status === 'ready' && <NewAccountForm />}

      <section className="kpis" aria-label="Сводные показатели">
        <Kpi
          label="Готовые ролики"
          value={formatNumber(ready.length)}
          hint={live ? 'Этап «Готово»' : 'Сняты и собраны в демо-библиотеке'}
        />
        <Kpi
          label="Публикации"
          value={formatNumber(published.length)}
          hint={live ? 'Отметки в календаре, без кабинета TikTok' : 'Отметки в демо-календаре, без кабинета TikTok'}
        />
        <Kpi label="Расходы" value={formatMoney(spend)} hint="Оценка производства, платежей нет" />
        <Kpi
          label="Ошибки"
          value={formatNumber(issues.length)}
          hint={live ? 'Отметки на роликах, не сбои внешних сервисов' : 'Учебные отметки, не боевые сбои'}
        />
      </section>

      <section className="card">
        <div className="card__head">
          <h2 className="card__title">Линия производства</h2>
          <p className="card__lead">Темы → сценарии → генерация → проверка → готово</p>
        </div>
        <div className="pipeline">
          {STAGE_ORDER.map((stage, index) => {
            const count = videos.filter((video) => video.stage === stage).length
            return (
              <button
                key={stage}
                type="button"
                className="station"
                onClick={() => dispatch({ type: 'focus-stage', stage })}
              >
                <span className="station__index">0{index + 1}</span>
                <span className="station__count num">{count}</span>
                <span className="station__label">{STAGE_LABEL[stage]}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="split">
        <section className="card">
          {role === 'owner' && (
            <>
              <div className="card__head">
                <h2 className="card__title">Сегодня для владельца</h2>
                <DemoMark />
              </div>
              <dl className="facts">
                <div>
                  <dt>Средняя стоимость ролика</dt>
                  <dd className="num">{charged.length ? formatMoney(average) : '—'}</dd>
                </div>
                <div>
                  <dt>В оценке</dt>
                  <dd>
                    {charged.length} {plural(charged.length, 'ролик', 'ролика', 'роликов')}
                  </dd>
                </div>
                <div>
                  <dt>Готово и без даты</dt>
                  <dd>{unscheduled.length}</dd>
                </div>
              </dl>
              <CostBar voice={voice} avatar={avatar} assembly={assembly} />
              <ul className="plain-list">
                {unscheduled.map((video) => (
                  <li key={video.id}>
                    <button type="button" className="list-btn" onClick={() => dispatch({ type: 'open-video', id: video.id })}>
                      <span>{video.title}</span>
                      <span className="muted">Поставить в календарь</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {role === 'editor' && (
            <>
              <div className="card__head">
                <h2 className="card__title">Сегодня для редактора</h2>
                <DemoMark />
              </div>
              <h3 className="subhead">На проверке</h3>
              <VideoLinks videos={review} empty="Очередь проверки пуста." />
              <h3 className="subhead">Вернулись в сценарии</h3>
              <VideoLinks videos={returned} empty="Комментариев к сценариям нет." />
            </>
          )}
          {role === 'operator' && (
            <>
              <div className="card__head">
                <h2 className="card__title">Сегодня для оператора</h2>
                <DemoMark />
              </div>
              <p className="hint">
                План сети на {formatDay(DEMO_TODAY)}: {todayPlan}{' '}
                {plural(todayPlan, 'ролик', 'ролика', 'роликов')}. В календаре: {todaySlots}.
              </p>
              <ul className="plain-list">
                {accounts.map((account) => {
                  const fact = videos.filter(
                    (video) => video.accountId === account.id && video.scheduledAt === DEMO_TODAY,
                  ).length
                  const gap = account.perDay - fact
                  const status = gap > 0 ? `свободно ${gap}` : gap < 0 ? `сверх плана ${-gap}` : 'план закрыт'
                  return (
                    <li key={account.id}>
                      <button
                        type="button"
                        className="list-btn"
                        onClick={() => dispatch({ type: 'focus-account', accountId: account.id })}
                      >
                        <span>{account.handle}</span>
                        <span className="muted">
                          план {account.perDay} · в календаре {fact} · {status}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'show-day', day: DEMO_TODAY })}>
                Открыть сегодняшний календарь
              </button>
            </>
          )}
        </section>

        <section className="card">
          <div className="card__head">
            <h2 className="card__title">Ошибки</h2>
            <DemoMark />
          </div>
          {issues.length === 0 ? (
            <p className="empty">{live ? 'Активных отметок нет.' : 'Активных учебных отметок нет.'}</p>
          ) : (
            <ul className="error-list">
              {issues.map((video) => (
                <li key={video.id} className="error-item">
                  <div>
                    <strong>{video.issue?.title}</strong>
                    <p>
                      {video.title} · {accountOf(video.accountId).handle}
                    </p>
                    <p className="muted">{video.issue?.detail}</p>
                  </div>
                  <div className="error-item__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'open-video', id: video.id })}>
                      Открыть
                    </button>
                    <button type="button" className="btn btn--warn" onClick={() => dispatch({ type: 'dismiss-issue', id: video.id })}>
                      Снять отметку
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card__head">
          <h2 className="card__title">Последние публикации</h2>
          <button type="button" className="text-btn" onClick={() => dispatch({ type: 'section', section: 'analytics' })}>
            Вся аналитика
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Ролик</th>
                <th>Аккаунт</th>
                <th>Просмотры</th>
                <th>Стоимость</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((video) => (
                <tr key={video.id}>
                  <td>{video.scheduledAt ? formatDay(video.scheduledAt) : '—'}</td>
                  <td>
                    <button type="button" className="text-btn" onClick={() => dispatch({ type: 'open-video', id: video.id })}>
                      {video.title}
                    </button>
                  </td>
                  <td>{accountOf(video.accountId).handle}</td>
                  <td className="num">{video.stats ? formatNumber(video.stats.views) : 'нет данных'}</td>
                  <td className="num">{formatMoney(videoCost(video.cost))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="kpi">
      <div className="kpi__top">
        <h2 className="kpi__label">{label}</h2>
        <DemoMark />
      </div>
      <p className="kpi__value num">{value}</p>
      <p className="kpi__hint">{hint}</p>
    </article>
  )
}

function CostBar({ voice, avatar, assembly }: { voice: number; avatar: number; assembly: number }) {
  const total = voice + avatar + assembly
  if (!total) return null
  return (
    <div className="costbar">
      <div
        className="costbar__track"
        style={{ gridTemplateColumns: `${voice}fr ${avatar}fr ${assembly}fr` }}
        aria-hidden="true"
      >
        <span className="costbar__voice" />
        <span className="costbar__avatar" />
        <span className="costbar__assembly" />
      </div>
      <ul className="legend">
        <li>
          <span className="swatch swatch--voice" />
          Озвучка {formatMoney(voice)}
        </li>
        <li>
          <span className="swatch swatch--avatar" />
          Аватар {formatMoney(avatar)}
        </li>
        <li>
          <span className="swatch swatch--assembly" />
          Сборка {formatMoney(assembly)}
        </li>
      </ul>
    </div>
  )
}

function VideoLinks({ videos, empty }: { videos: Video[]; empty: string }) {
  const { dispatch } = useStore()
  if (videos.length === 0) return <p className="empty">{empty}</p>
  return (
    <ul className="plain-list">
      {videos.map((video) => (
        <li key={video.id}>
          <button type="button" className="list-btn" onClick={() => dispatch({ type: 'open-video', id: video.id })}>
            <span>{video.title}</span>
            <span className="muted">{video.notes.at(-1) ?? 'Открыть в редакторе'}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
