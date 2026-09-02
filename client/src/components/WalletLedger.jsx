import { useContext, useState } from 'react'
import { EngagementContext } from '../engagement/useEngagement.js'
import { filterLedger } from '../engagement/ledger.js'
import { useLocale } from '../useLocale.js'
import '../styles/walletLedger.css'

const sources = new Set(['chest_purchase','chest_reward','game_reward','game_cost','checkin','task'])

export default function WalletLedger({ full = false, currency = 'all', onShowAll }) {
  const { t, locale } = useLocale()
  const { ledger, errors, refresh } = useContext(EngagementContext)
  const [selectedCurrency, setCurrency] = useState(currency)
  const [direction, setDirection] = useState('all')
  const [page, setPage] = useState(0)
  const entries = filterLedger(ledger?.entries ?? [], selectedCurrency, direction)
  const pageSize = full ? 20 : 5
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const visible = full ? entries.slice(currentPage * pageSize, (currentPage + 1) * pageSize) : entries.slice(0,5)
  const amount = value => new Intl.NumberFormat(locale).format(value)
  const date = value => new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'zh-CN', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:ledger?.timeZone ?? 'Asia/Shanghai'}).format(new Date(value))
  return <section className={`wallet-ledger ${full ? 'is-full' : ''}`}>
    {onShowAll && <div className="section-head"><div><h2>{t('ledger.title')}</h2><p>{t('ledger.recent')}</p></div><button className="text-action" onClick={onShowAll}>{t('ledger.allRecords')}</button></div>}
    {full && <div className="ledger-filters"><label>{t('ledger.currency')}<select value={selectedCurrency} onChange={event => {setCurrency(event.target.value);setPage(0)}}>{['all','coins','gems'].map(value=><option key={value} value={value}>{t(`ledger.${value}`)}</option>)}</select></label><label>{t('ledger.direction')}<select value={direction} onChange={event=>{setDirection(event.target.value);setPage(0)}}>{['all','income','expense'].map(value=><option key={value} value={value}>{t(`ledger.${value}`)}</option>)}</select></label></div>}
    {errors.ledger ? <p role="alert">{t(errors.ledger)} <button className="text-action" onClick={()=>refresh('ledger')}>{t('common.retry')}</button></p>
      : !ledger ? <p role="status">{t('common.loading')}</p>
        : !visible.length ? <p className="ledger-empty">{t(ledger.entries.length ? 'ledger.noMatch' : 'ledger.empty')}</p>
          : <ol className="ledger-entries">{visible.map(row=><li key={row.id}>
            <div className="ledger-row"><div><strong>{t(`ledger.${sources.has(row.source) ? row.source : 'unknown'}`)}</strong><time>{date(row.createdAt)}</time></div><div className="ledger-amount"><b className={row.amount > 0 ? 'positive' : row.amount < 0 ? 'negative' : ''}>{row.amount > 0 ? '+' : ''}{amount(row.amount)} {t(`ledger.${row.currency}`)}</b><small>{t(`ledger.${['completed','processing','failed'].includes(row.status) ? row.status : 'processing'}`)}</small></div></div>
            {full && <details><summary>{t('ledger.details')}</summary><dl><div><dt>{t('ledger.id')}</dt><dd>{row.id}</dd></div><div><dt>{t('ledger.before')}</dt><dd>{row.balanceBefore === null ? t('ledger.unavailable') : amount(row.balanceBefore)}</dd></div><div><dt>{t('ledger.after')}</dt><dd>{row.balanceAfter === null ? t('ledger.unavailable') : amount(row.balanceAfter)}</dd></div></dl></details>}
          </li>)}</ol>}
    {full && ledger && !errors.ledger && <div className="winners-pagination"><button disabled={currentPage === 0} onClick={()=>setPage(currentPage-1)}>{t('wins.previous')}</button><span>{t('wins.page',{page:currentPage+1,pages:totalPages})}</span><button disabled={currentPage+1>=totalPages} onClick={()=>setPage(currentPage+1)}>{t('wins.next')}</button></div>}
  </section>
}
