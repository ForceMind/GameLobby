import { useEffect, useRef, useState } from 'react'
import { Icon } from '../icons.jsx'
import { coinPacks } from '../data.js'
import { SectionHeader } from '../ui.jsx'
import { formatNumber, formatUsdCents } from '../format.js'
import { packSummary, validateDemoCode } from '../demoModel.js'
import { useLocale } from '../useLocale.js'
import { requestHost } from '../h5/hostBridge.js'
import '../h5/storeCompact.css'
import '../styles/recoveryVault.css'

const vaultRefreshOptions = ['12:00', '18:00', '21:00', '23:00']
const recoveryRanks = [
  ['NovaRay', '+6,240'],
  ['MintCat', '+4,880'],
  ['BlueFin', '+3,600'],
]

function VaultSettingsPanel({ initialTime, locked, onSelect }) {
  const { t } = useLocale()
  const [selectedTime, setSelectedTime] = useState(initialTime)
  const [changed, setChanged] = useState(false)
  return (
    <div className="vault-settings-panel">
      <p>{t('购买后可设置每日统计时间，次日净损会在统计后约 3 小时进入保险箱。')}</p>
      <div className="vault-setting-field">
        <span>{t('每日刷新时间')}</span>
        <div className="vault-time-options" role="listbox" aria-label={t('选择每日刷新时间')}>
          {vaultRefreshOptions.map((time) => (
            <button key={time} type="button" role="option" aria-selected={time === selectedTime} disabled={locked || changed} onClick={() => { setSelectedTime(time); setChanged(true); onSelect(time) }}>{time}</button>
          ))}
        </div>
        {(locked || changed) && <small>{t('本月已调整 1 次，下月可再次修改')}</small>}
      </div>
      <div className="vault-settings-rule"><strong>{t('查看规则')}</strong><p>{t('是否命中和返还比例按活动概率计算，结果将在结算后展示。')}</p></div>
    </div>
  )
}

export default function StorePage({
  openModal,
  toast,
  showFullEntryHint = () => {},
}) {
  const { t } = useLocale()
  const [code, setCode] = useState('')
  const [codeState, setCodeState] = useState({ type: '', message: '' })
  const [validatedCode, setValidatedCode] = useState('')
  const [receipts, setReceipts] = useState([])
  const [redeemed, setRedeemed] = useState(false)
  const [pendingSku, setPendingSku] = useState(null)
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const [vaultRefreshTime, setVaultRefreshTime] = useState('18:00')
  const [vaultTimeChanged, setVaultTimeChanged] = useState(false)
  const [vaultPurchased, setVaultPurchased] = useState(false)
  const purchaseLock = useRef(false)
  const alive = useRef(true)
  const latestTranslation = useRef(t)
  useEffect(() => {
    latestTranslation.current = t
  }, [t])
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const buyPack = (pack) => {
    if (purchaseLock.current) return
    const summary = packSummary(pack)
    openModal({
      title: t('{coins} 金币礼包', { coins: formatNumber(pack.coins) }),
      kicker: t(pack.tag),
      subtitle: t('美元价格 {price}', {
        price: formatUsdCents(summary.priceCents),
      }),
      body: (
        <div className="purchase-summary">
          <div>
            <span>{t('金币数量')}</span>
            <strong>{formatNumber(summary.totalCoins)}</strong>
          </div>
          <div>
            <span>{t('宝石赠礼')}</span>
            <strong>+{formatNumber(summary.gems)}</strong>
          </div>
          <div>
            <span>{t('原价')}</span>
            <strong className="product-old-price">
              {formatUsdCents(summary.baseCents)}
            </strong>
          </div>
          <div>
            <span>{t('折扣价')}</span>
            <strong>{formatUsdCents(summary.priceCents)}</strong>
          </div>
          <p>
            {t('已优惠 {discount}%', {
              discount: summary.discountPercent,
            })}
          </p>
        </div>
      ),
      confirmLabel: t('确认购买'),
      onConfirm: async () => {
        if (purchaseLock.current) return
        purchaseLock.current = true
        setPendingSku(pack.id)
        setPurchaseMessage('正在处理购买请求…')
        toast(t('正在处理购买请求…'))
        let result
        try {
          result = await requestHost('purchase', {
            sku: pack.id,
            currency: 'USD',
            priceCents: summary.priceCents,
            coins: summary.totalCoins,
            gems: summary.gems,
          })
        } catch {
          result = { status: 'failed' }
        }
        if (!alive.current) return
        const translate = latestTranslation.current
        if (result?.code === 'timeout') {
          setPurchaseMessage('购买结果仍在确认，请返回 App 查看。')
          toast(translate('购买结果仍在确认，请返回 App 查看。'))
          return
        }
        setPendingSku(null)
        purchaseLock.current = false
        if (result?.status === 'completed') {
          setReceipts((current) => [
            {
              id: current.length + 1,
              titleKey: '{coins} 金币礼包',
              titleValues: { coins: formatNumber(pack.coins) },
              detailKey: '已购买 {total} 金币 · 赠送 {gems} 宝石 · {price}',
              detailValues: {
                total: formatNumber(summary.totalCoins),
                gems: summary.gems,
                price: formatUsdCents(summary.priceCents),
              },
            },
            ...current,
          ])
          setPurchaseMessage('购买成功')
          toast(translate('购买成功'))
        } else if (result?.status === 'cancelled') {
          setPurchaseMessage('购买已取消')
          toast(translate('购买已取消'))
        } else {
          setPurchaseMessage('暂时无法完成购买，请稍后重试')
          toast(translate('暂时无法完成购买，请稍后重试'))
        }
      },
    })
  }

  const redeem = (event) => {
    event.preventDefault()
    const result = validateDemoCode(code)
    const normalized = code.trim().toUpperCase()
    if (redeemed && normalized === 'JOY-DEMO') {
      setValidatedCode('')
      setCodeState({ type: 'error', message: '此兑换码已使用。' })
      return
    }
    setValidatedCode(result.type === 'success' ? normalized : '')
    setCodeState({
      type: result.type,
      message: !normalized
        ? '请输入兑换码。'
        : result.type === 'success'
          ? '校验成功，可以兑换。'
          : result.message,
    })
  }
  const redeemCode = () => {
    if (validatedCode !== 'JOY-DEMO' || redeemed) return
    setRedeemed(true)
    setValidatedCode('')
    setCodeState({ type: 'success', message: '兑换成功。' })
    setReceipts((current) => [
      {
        id: current.length + 1,
        titleKey: '兑换成功',
        detailKey: '兑换码已使用一次。',
      },
      ...current,
    ])
  }
  const openVaultSettings = () => openModal({ title: t('保险箱设置'), subtitle: t('刷新时间与活动规则'), body: <VaultSettingsPanel initialTime={vaultRefreshTime} locked={vaultTimeChanged} onSelect={(time) => { setVaultRefreshTime(time); setVaultTimeChanged(true); toast(t('刷新时间已设置，下月可再次调整')) }} />, confirmLabel: t('完成'), cancelLabel: null })
  const openVaultPurchase = () => openModal({ title: t('购买破产保险箱'), subtitle: t('500 金币 / 天'), body: <div className="vault-rule-modal"><p>{t('购买后可参与次日净损返还，是否命中和返还比例按活动概率计算。')}</p><p>{t('支付 500 金币后立即生效，有效期至本月结束。')}</p></div>, confirmLabel: t('确认购买'), onConfirm: () => { setVaultPurchased(true); toast(t('破产保险箱已生效，等待次日结算')) } })

  return (
    <div className="store-page compact-store">
      <section className="page-head">
        <p className="eyebrow">STORE · SECURE CHECKOUT</p>
        <h1>{t('金币商城')}</h1>
        <p>{t('选择金币数量并确认购买。')}</p>
      </section>
      <section className={`recovery-vault card ${vaultPurchased ? 'is-purchased' : 'is-locked'}`}>
        <div className="vault-heading">
          <span className="vault-icon"><Icon name="lock" /></span>
          <div><span className="eyebrow">{t('昨日结算 · 活动权益')}</span><h2>{t('破产保险箱')}</h2><p>{t(vaultPurchased ? '已生效：预计可恢复 1,760–7,040 金币。本月有效；每日按刷新时间统计，约 3 小时后更新。' : '昨日净损有机会返还一部分金币；购买后立即生效，本月有效。每日按刷新时间统计，约 3 小时后更新。')}</p></div>
          <div className="vault-heading-actions"><span className={`status ${vaultPurchased ? '' : 'vault-status-locked'}`}><span className="status-dot" />{t(vaultPurchased ? '已生效 · 等待结算' : '待购买')}</span><button className="icon-btn vault-settings-button" type="button" aria-label={t('保险箱设置')} disabled={!vaultPurchased} onClick={openVaultSettings}><Icon name="gear" /></button></div>
        </div>
        <div className="vault-stats">
          <div><span>{t('昨日净损')}</span><strong className="negative">-8,800</strong><small>{t('金币')}</small></div>
          <div><span>{t(vaultPurchased ? '返还状态' : '预计可返还')}</span><strong>{vaultPurchased ? t('等待抽取') : '1,760–7,040'}</strong><small>{t(vaultPurchased ? '按活动规则结算' : '金币')}</small></div>
          <div><span>{t('预计刷新')}</span><strong>{vaultPurchased ? `${vaultRefreshTime} + 3h` : t('购买后设置')}</strong><small>{t('统计后到账')}</small></div>
        </div>
        {!vaultPurchased && <div className="vault-explainer"><strong>{t('购买后，昨日净损可获得金币返还')}</strong><p>{t('每天按你设置的时间统计前一天净损，约 3 小时后更新结果；命中后按活动规则返还金币。')}</p><div className="vault-explainer-steps"><span><b>1</b>{t('购买保险箱')}</span><span><b>2</b>{t('设置每日刷新时间')}</span><span><b>3</b>{t('等待结算结果')}</span></div></div>}
        <div className="vault-footer">
          <div className="vault-probability"><span>{t(vaultPurchased ? '今日权益已生效，等待结算结果' : '购买后可参与次日返还')}</span></div>
          <div className="vault-actions">
            <button className={`btn ${vaultPurchased ? 'btn-secondary' : 'btn-primary'}`} type="button" disabled={vaultPurchased} onClick={openVaultPurchase}>{t(vaultPurchased ? '已生效' : '购买保险箱 · 500 金币')}</button>
          </div>
        </div>
        <div className="recovery-leaderboard"><div className="row-between"><strong>{t('恢复排行榜')}</strong><span className="pill">{t('本周')}</span></div>{recoveryRanks.map(([name, coins], index) => <div className="recovery-rank-row" key={name}><span>{index + 1}</span><strong>{t(name)}</strong><b>{coins} {t('金币')}</b></div>)}</div>
      </section>
      {purchaseMessage && (
        <p className="purchase-status" role="status">
          {t(purchaseMessage)}
        </p>
      )}
      <section className="section">
        <SectionHeader
          title={t('金币礼包')}
          description={t('每档金币数量固定，折扣独立计算')}
          action={<span className="pill">{t('USD')}</span>}
        />
        <div className="product-grid">
          {coinPacks.map((pack) => {
            const summary = packSummary(pack)
            return (
              <article
                className={`product-card card ${pack.recommended ? 'is-recommended' : ''}`}
                key={pack.id}
              >
                <span className="pill">{t(pack.tag)}</span>
                <span className="product-icon">
                  <Icon name="coin" />
                </span>
                <div className="product-amount">
                  <strong>{formatNumber(pack.coins)}</strong>
                  <span>{t('金币')}</span>
                </div>
                <p>{t('另赠 {gems} 宝石', { gems: pack.gemBonus })}</p>
                <p className="product-discount">
                  {t('优惠 {discount}%', { discount: summary.discountPercent })}
                </p>
                <div className="product-price">
                  <span>{t('购买价格')}</span>
                  <strong>{formatUsdCents(summary.priceCents)}</strong>
                  <del>{formatUsdCents(summary.baseCents)}</del>
                </div>
                <button
                  className={`btn ${pack.recommended ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  disabled={Boolean(pendingSku)}
                  onClick={() => buyPack(pack)}
                >
                  {pendingSku === pack.id ? t('购买处理中') : t('购买礼包')}
                </button>
              </article>
            )
          })}
        </div>
        <p className="fine-print">
          <Icon name="shield" />
          {t('1 美元 = 10,000 金币')}
        </p>
      </section>
      {receipts.length > 0 && (
        <section className="section store-receipts">
          <SectionHeader
            title={t('购买记录')}
            description={t('最近完成的购买与兑换')}
          />
          <div className="detail-list">
            {receipts.map((receipt) => (
              <div key={receipt.id}>
                <strong>{t(receipt.titleKey, receipt.titleValues)}</strong>
                <span>{t(receipt.detailKey, receipt.detailValues)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="page-layout">
        <section className="section">
          <SectionHeader
            title={t('月度特权卡')}
            description={t('每日金币、宝石和免费旋转')}
            action={<span className="status">{t('即将开放')}</span>}
          />
          <article className="membership-card card">
            <span className="pill">MONTHLY PASS</span>
            <h2>{t('每天都有明确到账的轻量权益')}</h2>
            <p>{t('每天领取固定权益。')}</p>
            <div className="benefit-grid">
              <div>
                <strong>1,000</strong>
                <span>{t('每日金币')}</span>
              </div>
              <div>
                <strong>12</strong>
                <span>{t('每日宝石')}</span>
              </div>
              <div>
                <strong>2 {t('次')}</strong>
                <span>{t('每日免费旋转')}</span>
              </div>
            </div>
            <div className="section-footer">
              <span className="pill">{t('有效期：30 天')}</span>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() =>
                  openModal({
                    title: t('月度特权卡'),
                    subtitle: t('权益详情'),
                    body: (
                      <p>
                        {t('每日领取 1,000 金币、12 宝石和 2 次免费旋转。')}
                      </p>
                    ),
                    confirmLabel: t('知道了'),
                    cancelLabel: null,
                  })
                }
              >
                {t('查看内容详情')}
              </button>
            </div>
          </article>
        </section>
        <aside className="side-rail">
          <section className="section">
            <SectionHeader
              title={t('兑换码中心')}
              description={t('输入兑换码并先校验')}
            />
            <form className="code-form card" onSubmit={redeem} noValidate>
              <label htmlFor="redemption-code">{t('兑换码')}</label>
              <div className="field-row">
                <input
                  id="redemption-code"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value)
                    setCodeState({ type: '', message: '' })
                    setValidatedCode('')
                  }}
                  placeholder={t('输入运营发放的兑换码')}
                  autoComplete="off"
                  aria-invalid={codeState.type === 'error'}
                />
                <button className="btn btn-secondary" type="submit">
                  {t('校验')}
                </button>
              </div>
              {validatedCode === 'JOY-DEMO' && !redeemed && (
                <button
                  className="btn btn-primary purchase-confirm"
                  type="button"
                  onClick={redeemCode}
                >
                  {t('确认兑换')}
                </button>
              )}
              <p
                className={
                  codeState.message
                    ? `form-feedback is-${codeState.type}`
                    : 'sr-only'
                }
                role="status"
                aria-live="polite"
              >
                {t(codeState.message)}
              </p>
            </form>
          </section>
        </aside>
      </div>
      <div className="compact-store-links" aria-label={t('更多商城内容')}>
        <button type="button" onClick={showFullEntryHint}>
          <span>{t('月度特权卡')}</span>
          <Icon name="chevronRight" />
        </button>
        <button type="button" onClick={showFullEntryHint}>
          <span>{t('兑换码中心')}</span>
          <Icon name="chevronRight" />
        </button>
      </div>
    </div>
  )
}
