import { useState } from 'react'
import { DemoMark } from '../components'
import { useStore } from '../store'
import type { Video } from '../types'
import { formatMoney, formatNumber, reactionCount, STAGE_LABEL, videoCost } from '../utils'

export function Analytics() {
  const { state, accountOf } = useStore()
  const [accountId, setAccountId] = useState('all')
  const scoped = state.videos.filter((video) => accountId === 'all' || video.accountId === accountId)
  const withStats = scoped.filter((video) => video.stats)
  const views = withStats.reduce((sum, video) => sum + (video.stats?.views ?? 0), 0)
  const reactions = withStats.reduce((sum, video) => sum + reactionCount(video.stats), 0)
  const charged = scoped.filter((video) => videoCost(video.cost) > 0)
  const spend = charged.reduce((sum, video) => sum + videoCost(video.cost), 0)
  const average = charged.length ? Math.round(spend / charged.length) : 0
  const maxViews = Math.max(1, ...withStats.map((video) => video.stats?.views ?? 0))

  const rows = [...scoped].sort((a, b) => (b.stats?.views ?? -1) - (a.stats?.views ?? -1))

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Аналитика</h1>
          <p className="page-lead">
            {state.mode === 'live'
              ? 'Просмотры, реакции и стоимость ролика по сохранённым публикациям. Живой кабинет TikTok не подключён.'
              : 'Просмотры, реакции и стоимость ролика. Срез учебный: 2–7 октября 2026 для уже отмеченных публикаций.'}
          </p>
        </div>
        <DemoMark />
      </header>

      <div className="filters">
        <label className="field field--inline">
          <span className="field__label">Аккаунт</span>
          <select className="control" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            <option value="all">Все аккаунты</option>
            {state.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.handle}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="kpis">
        <article className="kpi">
          <div className="kpi__top">
            <h2 className="kpi__label">Просмотры</h2>
            <DemoMark />
          </div>
          <p className="kpi__value num">{formatNumber(views)}</p>
          <p className="kpi__hint">
            {withStats.length === 0 ? 'В этом срезе публикаций с просмотрами нет' : 'Сумма по отмеченным публикациям'}
          </p>
        </article>
        <article className="kpi">
          <div className="kpi__top">
            <h2 className="kpi__label">Реакции</h2>
            <DemoMark />
          </div>
          <p className="kpi__value num">{formatNumber(reactions)}</p>
          <p className="kpi__hint">Лайки, комментарии и репосты вместе</p>
        </article>
        <article className="kpi">
          <div className="kpi__top">
            <h2 className="kpi__label">Стоимость ролика</h2>
            <DemoMark />
          </div>
          <p className="kpi__value num">{charged.length ? formatMoney(average) : '—'}</p>
          <p className="kpi__hint">Средняя демо-оценка по роликам с расходом</p>
        </article>
      </section>

      <section className="card">
        <div className="card__head">
          <h2 className="card__title">Просмотры по роликам</h2>
        </div>
        {withStats.length === 0 ? (
          <p className="empty">У выбранного аккаунта в демо-срезе нет опубликованных роликов с просмотрами.</p>
        ) : (
          <ul className="bars">
            {withStats
              .slice()
              .sort((a, b) => (b.stats?.views ?? 0) - (a.stats?.views ?? 0))
              .map((video) => (
                <li key={video.id} className="bar">
                  <span className="bar__label">{video.title}</span>
                  <span className="bar__track">
                    <span className="bar__fill" style={{ width: `${((video.stats?.views ?? 0) / maxViews) * 100}%` }} />
                  </span>
                  <span className="bar__value num">{formatNumber(video.stats?.views ?? 0)}</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card__head">
          <h2 className="card__title">Стоимость и отклик</h2>
          <p className="card__lead">Реакции в таблице: лайки · комментарии · репосты</p>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ролик</th>
                <th>Аккаунт</th>
                <th>Статус</th>
                <th>Просмотры</th>
                <th>Реакции</th>
                <th>Стоимость</th>
                <th>₸ / 1000 просмотров</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((video) => (
                <AnalyticsRow key={video.id} video={video} handle={accountOf(video.accountId).handle} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote">
          Просмотры новых отметок публикации не подставляются: кабинет TikTok не подключён. Стоимость — оценка озвучки,
          аватара и сборки, а не проведённый платёж.
        </p>
      </section>
    </div>
  )
}

function AnalyticsRow({ video, handle }: { video: Video; handle: string }) {
  const cost = videoCost(video.cost)
  const views = video.stats?.views
  const perThousand = views && cost ? Math.round((cost / views) * 1000) : null
  const reactions = video.stats ? reactionCount(video.stats) : null
  return (
    <tr>
      <td>{video.title}</td>
      <td>{handle}</td>
      <td>{video.published ? 'Опубликован' : STAGE_LABEL[video.stage]}</td>
      <td className="num">{views === undefined ? '—' : formatNumber(views)}</td>
      <td className="num">
        {reactions === null || !video.stats ? (
          '—'
        ) : (
          <>
            {formatNumber(reactions)}
            <span className="reaction-split">
              {formatNumber(video.stats.likes)} · {formatNumber(video.stats.comments)} · {formatNumber(video.stats.shares)}
            </span>
          </>
        )}
      </td>
      <td className="num">{cost ? formatMoney(cost) : 'не списано'}</td>
      <td className="num">{perThousand === null ? '—' : formatMoney(perThousand)}</td>
    </tr>
  )
}
