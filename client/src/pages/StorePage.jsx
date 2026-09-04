import { useEffect, useRef, useState } from 'react'
import { Icon } from '../icons.jsx'
import { coinPacks } from '../data.js'
import liteContent from '../data/liteContent.json'
import { SectionHeader } from '../ui.jsx'
import { formatNumber, formatUsdCents } from '../format.js'
import { packSummary } from '../demoModel.js'
import { useLocale } from '../useLocale.js'
import { requestHost } from '../h5/hostBridge.js'
import '../h5/storeCompact.css'
import TomorrowChest from '../components/TomorrowChest.jsx'

export default function StorePage({
  engagement,
  openModal,
  toast,
  showFullEntryHint = () => {},
}) {
  const { t } = useLocale()
  const [receipts, setReceipts] = useState([])
  const [pendingSku, setPendingSku] = useState(null)
  const [purchaseMessage, setPurchaseMessage] = useState('')
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
      title: t('store.coinPackTitle', { coins: formatNumber(pack.coins) }),
      kicker: t(pack.tag),
      subtitle: t('store.priceUsd', {
        price: formatUsdCents(summary.priceCents),
      }),
      body: (
        <div className="purchase-summary">
          <div>
            <span>{t('store.coinAmount')}</span>
            <strong>{formatNumber(summary.totalCoins)}</strong>
          </div>
          <div>
            <span>{t('store.bonusGemsLabel')}</span>
            <strong>+{formatNumber(summary.gems)}</strong>
          </div>
          <div>
            <span>{t('store.originalPrice')}</span>
            <strong className="product-old-price">
              {formatUsdCents(summary.baseCents)}
            </strong>
          </div>
          <div>
            <span>{t('store.discountedPrice')}</span>
            <strong>{formatUsdCents(summary.priceCents)}</strong>
          </div>
          <p>
            {t('store.discountApplied', {
              discount: summary.discountPercent,
            })}
          </p>
        </div>
      ),
      confirmLabel: t('chest.confirm'),
      onConfirm: async () => {
        if (purchaseLock.current) return
        purchaseLock.current = true
        setPendingSku(pack.id)
        setPurchaseMessage('正在处理购买请求…')
        toast(t('store.purchaseProcessingToast'))
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

  const buyMonthlyPass = () => {
    if (purchaseLock.current) return
    const product = liteContent.products.monthlyPass
    openModal({
      title: t('store.monthlyPassTitle'),
      subtitle: t('store.priceUsd', { price: formatUsdCents(product.priceUsdCents) }),
      body: <div className="purchase-summary"><div><span>{t('store.passDailyCoins')}</span><strong>{formatNumber(product.dailyCoins)}</strong></div><div><span>{t('store.passDailyGems')}</span><strong>+{product.dailyGems}</strong></div><div><span>{t('store.validDays')}</span><strong>{product.validDays}</strong></div><p>{t('store.passDailyClaimNote')}</p></div>,
      confirmLabel: t('chest.confirm'),
      onConfirm: async () => {
        if (purchaseLock.current) return
        purchaseLock.current = true
        setPendingSku('monthly-pass')
        toast(t('store.purchaseProcessingToast'))
        const result = await requestHost('purchase', {
          sku: 'monthly-pass',
          currency: 'USD',
          priceCents: product.priceUsdCents,
          coins: product.dailyCoins,
          gems: product.dailyGems,
        })
        if (!alive.current) return
        setPendingSku(null)
        purchaseLock.current = false
        if (result?.status === 'completed') {
          setReceipts((current) => [{ id: current.length + 1, titleKey: '月度特权卡', detailKey: '已购买月卡 · 每日 {coins} 金币 + {gems} 宝石 · 有效 {days} 天', detailValues: { coins: formatNumber(product.dailyCoins), gems: product.dailyGems, days: product.validDays } }, ...current])
          toast(t('store.purchaseSuccess'))
        } else if (result?.status === 'cancelled') toast(t('store.purchaseCancelled'))
        else toast(t('store.purchaseFailed'))
      },
    })
  }

  return (
    <div className="store-page compact-store">
      <section className="page-head">
        <p className="eyebrow">STORE · SECURE CHECKOUT</p>
        <h1>{t('store.title')}</h1>
        <p>{t('store.subtitle')}</p>
      </section>
      <TomorrowChest engagement={engagement} openModal={openModal} />
      {purchaseMessage && (
        <p className="purchase-status" role="status">
          {t(purchaseMessage)}
        </p>
      )}
      <section className="section">
        <SectionHeader
          title={t('store.coinPacksTitle')}
          description={t('store.coinPacksHint')}
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
                  <span>{t('ledger.coins')}</span>
                </div>
                <p>{t('store.bonusGems', { gems: pack.gemBonus })}</p>
                <p className="product-discount">
                  {t('store.discountBadge', { discount: summary.discountPercent })}
                </p>
                <div className="product-price">
                  <span>{t('chest.price')}</span>
                  <strong>{formatUsdCents(summary.priceCents)}</strong>
                  <del>{formatUsdCents(summary.baseCents)}</del>
                </div>
                <button
                  className={`btn ${pack.recommended ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  disabled={Boolean(pendingSku)}
                  onClick={() => buyPack(pack)}
                >
                  {pendingSku === pack.id ? t('store.purchasePending') : t('store.buyCoinPack')}
                </button>
              </article>
            )
          })}
        </div>
        <p className="fine-print">
          <Icon name="shield" />
          {t('store.coinRate')}
        </p>
      </section>
      {receipts.length > 0 && (
        <section className="section store-receipts">
          <SectionHeader
            title={t('store.purchaseHistoryTitle')}
            description={t('store.purchaseHistoryHintFull')}
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
            title={t('store.monthlyPassTitle')}
            description={t('store.passHint')}
            action={<span className="status">{t('store.passStatusAvailable')}</span>}
          />
          <article className="membership-card card">
            <span className="pill">MONTHLY PASS</span>
            <h2>{t('store.passHeadline')}</h2>
            <p>{t('store.passSubhead')}</p>
            <div className="benefit-grid">
              <div>
                <strong>2,000</strong>
                <span>{t('store.passDailyCoins')}</span>
              </div>
              <div>
                <strong>1</strong>
                <span>{t('store.passDailyGems')}</span>
              </div>
              <div>
                <strong>30</strong>
                <span>{t('store.validDays')}</span>
              </div>
            </div>
            <div className="section-footer">
              <span className="pill">{t('store.validityBadge')}</span>
              <button
                className="btn btn-secondary"
                type="button"
                disabled={Boolean(pendingSku)}
                onClick={buyMonthlyPass}
              >
                {pendingSku === 'monthly-pass' ? t('store.purchasePending') : t('store.buyMonthlyPass')}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() =>
                  openModal({
                    title: t('store.monthlyPassTitle'),
                    subtitle: t('store.benefitDetailsTitle'),
                    body: (
                      <p>
                        {t('store.passBenefitsBody')}
                      </p>
                    ),
                    confirmLabel: t('common.gotIt'),
                    cancelLabel: null,
                  })
                }
              >
                {t('store.benefitDetailsAction')}
              </button>
            </div>
          </article>
        </section>
        <aside className="side-rail">
          <section className="section">
            <SectionHeader title={t('store.purchaseHistoryTitle')} description={t('store.purchaseHistoryHint')} />
            <div className="record-list card">
              {receipts.length ? receipts.map((receipt) => (
                <div key={receipt.id}><strong>{t(receipt.titleKey, receipt.titleValues)}</strong><span>{t(receipt.detailKey, receipt.detailValues)}</span></div>
              )) : <p className="empty-state">{t('store.purchaseHistoryEmpty')}</p>}
            </div>
          </section>
        </aside>
      </div>
      <div className="compact-store-links" aria-label={t('store.moreLinksLabel')}>
        <button type="button" onClick={showFullEntryHint}>
          <span>{t('store.monthlyPassTitle')}</span>
          <Icon name="chevronRight" />
        </button>
        <button type="button" onClick={showFullEntryHint}>
          <span>{t('store.purchaseHistoryTitle')}</span>
          <Icon name="chevronRight" />
        </button>
      </div>
    </div>
  )
}
