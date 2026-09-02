import { useContext, useEffect, useId, useState } from 'react'
import { EngagementContext } from '../engagement/useEngagement.js'
import { chestState } from '../engagement/model.js'
import { useLocale } from '../useLocale.js'

export default function ChestHelpDialog() {
  const { t, locale } = useLocale()
  const { chest: data, errors, refresh } = useContext(EngagementContext)
  const [activeTab, setActiveTab] = useState('records')
  const [tick, setTick] = useState(Date.now)
  const id = useId()
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const now = data ? data.serverTime + Math.max(0, tick - data.receivedAt) : tick
  const time = value => new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: data?.timeZone ?? 'Asia/Shanghai',
  }).format(new Date(value))
  const tabs = ['records', 'instructions']
  const keydown = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : activeTab === 'records' ? 1 : 0
    setActiveTab(tabs[next])
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus()
  }
  return <div className="chest-help">
    <div className="chest-help-tabs" role="tablist" aria-label={t('chest.helpTitle')}>
      {tabs.map(key => <button type="button" key={key} id={`${id}-${key}`} role="tab"
        aria-selected={activeTab === key} aria-controls={`${id}-panel-${key}`}
        tabIndex={activeTab === key ? 0 : -1} onKeyDown={keydown} onClick={() => setActiveTab(key)}>
        {t(`chest.${key}`)}
      </button>)}
    </div>
    <section id={`${id}-panel-records`} role="tabpanel" aria-labelledby={`${id}-records`} hidden={activeTab !== 'records'}>
      {errors.chest ? <p role="alert">{t(errors.chest)} <button className="text-action" type="button" onClick={() => refresh('chest')}>{t('common.retry')}</button></p>
        : !data ? <p role="status">{t('common.loading')}</p>
          : !data.chests.length ? <p className="chest-history-empty">{t('chest.noHistory')}</p>
            : <ol className="chest-history-list">{[...data.chests].sort((a, b) => b.unlockAt - a.unlockAt || a.id.localeCompare(b.id)).map(item => {
              const state = chestState(item, now)
              const statusKey = state === 'opened' ? item.rewardCoins > 0 ? 'chest.reward' : 'chest.zero'
                : state === 'expired' ? 'chest.expired' : state === 'ready' ? 'chest.ready' : 'chest.wait'
              return <li key={item.id}>
                <div className="chest-record-heading"><strong>{t(statusKey, { coins: (item.rewardCoins ?? 0).toLocaleString(locale) })}</strong>
                  {state === 'opened' && item.rewardCoins > 0 && <span>{t('chest.received')}</span>}</div>
                <dl>
                  <div><dt>{t('chest.purchasedOn')}</dt><dd>{item.purchaseDay}</dd></div>
                  <div><dt>{t('chest.unlock')}</dt><dd>{time(item.unlockAt)}</dd></div>
                  <div><dt>{t('chest.expires')}</dt><dd>{time(item.expiresAt)}</dd></div>
                </dl>
              </li>
            })}</ol>}
      {data && <small className="chest-history-zone">{data.timeZone}</small>}
    </section>
    <section id={`${id}-panel-instructions`} role="tabpanel" aria-labelledby={`${id}-instructions`} hidden={activeTab !== 'instructions'}>
      <ol className="chest-rules">{['chest.rulePlay', 'chest.ruleTime', 'chest.ruleReward', 'chest.ruleOnce'].map(key => <li key={key}>{t(key)}</li>)}</ol>
    </section>
  </div>
}
