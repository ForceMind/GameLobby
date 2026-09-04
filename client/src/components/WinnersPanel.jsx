import { useContext, useState } from 'react'
import { GameArtwork } from '../ui.jsx'
import { games } from '../data.js'
import { useLocale } from '../useLocale.js'
import { EngagementContext } from '../engagement/useEngagement.js'
import '../styles/engagement.css'

export default function WinnersPanel({ onPlay }) {
  const engagement = useContext(EngagementContext)
  const { t, locale } = useLocale()
  const [tab, setTab] = useState('rank')
  const [page, setPage] = useState(0)
  const data = engagement.winners
  const rows = data ? tab === 'rank' ? data.rankings : data.events : []
  const pages = Math.max(1, Math.ceil(rows.length / 5))
  const current = Math.min(page, pages - 1)
  const select = value => { setTab(value); setPage(0) }
  const clock = value => new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: data.timeZone }).format(new Date(value))
  return <section className="winners-panel card">
    <div className="winners-tabs" role="tablist" aria-label={t('wins.title')}>{['rank','recent'].map(value => <button key={value} type="button" role="tab" id={`winners-tab-${value}`} aria-controls="winners-panel-content" aria-selected={tab === value} tabIndex={tab === value ? 0 : -1}
      onClick={() => select(value)} onKeyDown={event => { if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'rank' : event.key === 'End' ? 'recent' : tab === 'rank' ? 'recent' : 'rank'; select(next); event.currentTarget.parentElement.querySelector(`#winners-tab-${next}`)?.focus() } }}>{t(`wins.${value}`)}</button>)}</div>
    <div id="winners-panel-content" role="tabpanel" aria-labelledby={`winners-tab-${tab}`}>
      <p className="winners-caption">{t(tab === 'rank' ? 'wins.scope' : 'wins.feedScope')}</p>
      {engagement.errors.winners ? <p role="alert">{t(engagement.errors.winners)} <button onClick={() => engagement.refresh('winners')}>{t('common.retry')}</button></p>
        : !data ? <p role="status">{t('common.loading')}</p> : !rows.length ? <p className="winners-empty">{t('wins.empty')}</p> : <ol className="winners-records">{rows.slice(current * 5, current * 5 + 5).map(record => {
          const game = games.find(item => item.id === record.gameId)
          return <li key={tab === 'rank' ? record.playerId : record.id}>
            <span className="winners-position">{tab === 'rank' ? record.rank : <span className="winners-avatar">{Array.from(record.name)[0]}</span>}</span>
            <div className="winner-person"><strong>{record.name}</strong><span>{tab === 'rank' ? t('wins.rankNumber', { rank: record.rank }) : clock(record.occurredAt)}</span><b>+{record.coins.toLocaleString(locale)} {t('ledger.coins')}</b>
              {game && <small className="winner-game"><GameArtwork game={game} compact />{game.name}</small>}</div>
            <button type="button" className="winner-play" onClick={() => onPlay(record.gameId)}>{t('wins.play')}</button>
          </li>
        })}</ol>}
      {data && <><div className="winners-pagination"><button onClick={() => setPage(current - 1)} disabled={current === 0}>{t('wins.previous')}</button><span>{t('wins.page',{ page: current + 1, pages })}</span><button onClick={() => setPage(current + 1)} disabled={current + 1 >= pages}>{t('wins.next')}</button></div>
        {tab === 'rank' && <div className="winners-self"><strong>{t('wins.my')}</strong><span>{data.myRank ? t('wins.rankNumber', { rank: data.myRank.rank }) : t('wins.unranked')}</span>{data.myRank && <small>{t('wins.myTotal', { coins: data.myRank.coins.toLocaleString(locale) })}</small>}</div>}
        <small className="winners-updated">{t('wins.updated',{time: clock(data.serverTime)})}</small></>}
    </div>
  </section>
}
