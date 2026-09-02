import { useEffect, useState } from 'react'
import { Icon } from '../icons.jsx'
import { useLocale } from '../useLocale.js'
import { businessDay, chestState } from '../engagement/model.js'
import '../styles/engagement.css'
import '../styles/chestRecords.css'
import ChestHelpDialog from './ChestHelpDialog.jsx'
import ChestLeaderboard from './ChestLeaderboard.jsx'

export default function TomorrowChest({ engagement, openModal }) {
  const { t, locale, href } = useLocale()
  const { chest: data, busy, errors, refresh, transact } = engagement
  const [tick, setTick] = useState(Date.now)
  useEffect(() => { const timer = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const now = data ? data.serverTime + Math.max(0, tick - data.receivedAt) : tick
  useEffect(() => {
    if (data && businessDay(now) !== data.offer.day) refresh('chest')
  }, [data, now, refresh])
  const coins = value => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'zh-CN').format(value)
  const time = value => new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: data?.timeZone ?? 'Asia/Shanghai',
  }).format(new Date(value))
  const openRecords = () => openModal({ title: t('chest.helpTitle'),
    body: <ChestHelpDialog />,
    confirmLabel: t('common.close'), cancelLabel: null })
  if (!data) return <section className="tomorrow-chest card"><div className="chest-top"><h2>{t('chest.title')}</h2><button className="text-action" type="button" aria-haspopup="dialog" onClick={openRecords}>{t('chest.records')}</button></div><p role="status">{t(errors.chest || 'common.loading')}</p>{errors.chest && <button className="btn btn-secondary" onClick={() => refresh('chest')}>{t('common.retry')}</button>}<ChestLeaderboard engagement={engagement} /></section>
  const today = data.chests.find(item => item.purchaseDay === data.offer.day)
  const ready = data.chests.filter(item => chestState(item, now) === 'ready')
  const openedToday = data.chests.filter(item => item.status === 'opened' && item.openedAt && businessDay(item.openedAt) === businessDay(now))
  const remaining = today ? Math.max(0, Math.ceil((today.unlockAt - now) / 1000)) : 0
  const countdown = [Math.floor(remaining / 3600), Math.floor(remaining % 3600 / 60), remaining % 60].map(n => String(n).padStart(2, '0')).join(':')
  const purchase = () => openModal({
    title: t('chest.purchaseTitle'), subtitle: t('chest.single'),
    body: <div className="chest-confirm"><dl>
      <div><dt>{t('chest.price')}</dt><dd>{coins(data.offer.priceCoins)} {t('金币')}</dd></div>
      <div><dt>{t('chest.unlock')}</dt><dd>{time(data.offer.unlockAt)}</dd></div>
      <div><dt>{t('chest.expires')}</dt><dd>{time(data.offer.expiresAt)}</dd></div>
    </dl><small>{data.timeZone}</small><p>{t('chest.confirmInfo')}</p></div>,
    confirmLabel: t('chest.confirm'), cancelLabel: t('common.cancel'),
    onConfirm: () => transact('buy', { day: data.offer.day, offerVersion: data.offer.version }),
  })
  return <section className="tomorrow-chest card" aria-labelledby="chest-title">
    <div className="chest-top"><span className="chest-tag">{t('chest.tag')}</span><button className="text-action" type="button" aria-haspopup="dialog" onClick={openRecords}><Icon name="clock" /> {t('chest.records')} <Icon name="chevronRight" /></button></div>
    <div className="chest-feature"><div className={`chest-visual ${ready.length ? 'is-ready' : ''}`} aria-hidden="true"><Icon name="gift" /><span>✦</span></div>
      <div><h2 id="chest-title">{t('chest.title')}</h2><p className="chest-headline">{t('chest.headline')}</p>
        <strong className="chest-reward">{t('chest.max', { coins: coins(data.offer.maxRewardCoins) })}</strong>
        <p>{t('chest.explain')}</p></div></div>
    <ol className="chest-steps"><li><b>1</b>{t('chest.play')}</li><li><b>2</b>{t('chest.purchaseTitle')}</li><li><b>3</b>{t('chest.wait')}</li></ol>
    {ready.map(item => <div className="chest-ready" key={item.id}><div><strong>{t('chest.ready')}</strong><small>{t('chest.expires')} · {time(item.expiresAt)} ({data.timeZone})</small></div><button className="btn btn-primary" disabled={Boolean(busy)} onClick={() => transact('open', item.id)}>{t(busy === 'open' ? 'chest.opening' : 'chest.open')}</button></div>)}
    {openedToday.map(item => <div className="chest-ready" role="status" key={item.id}><div><strong>{t(item.rewardCoins > 0 ? 'chest.reward' : 'chest.zero', {coins: coins(item.rewardCoins)})}</strong><small>{t(item.rewardCoins > 0 ? 'chest.received' : 'chest.opened')}</small></div><Icon name="gift" /></div>)}
    <div className="chest-purchase"><div><strong>{t(today ? 'chest.purchased' : data.eligible ? 'chest.eligible' : 'chest.locked')}</strong>
      <small>{today && chestState(today, now) === 'waiting' ? t('chest.countdown', { time: countdown }) : t('chest.single')}</small></div>
      {today ? <span className="chest-confirmed"><Icon name="clock" />{time(today.unlockAt)}</span>
        : data.eligible ? <button className="btn btn-primary" disabled={Boolean(busy) || Boolean(errors.chest)} onClick={purchase}>{t(busy === 'buy' ? 'chest.pending' : 'chest.buy', { coins: coins(data.offer.priceCoins) })}</button>
          : <a className="btn btn-primary" href={href('games.html')}>{t('chest.play')}</a>}
    </div>
    {(errors.action || errors.chest) && <p className="chest-error" role="alert">{t(errors.action || errors.chest)} <button className="text-action" onClick={() => refresh('chest')}>{t('chest.refresh')}</button></p>}
    <ChestLeaderboard engagement={engagement} />
  </section>
}
