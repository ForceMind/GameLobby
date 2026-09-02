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

  const buyMonthlyPass = () => {
    if (purchaseLock.current) return
    const product = liteContent.products.monthlyPass
    openModal({
      title: t('月度特权卡'),
      subtitle: t('美元价格 {price}', { price: formatUsdCents(product.priceUsdCents) }),
      body: <div className="purchase-summary"><div><span>{t('每日金币')}</span><strong>{formatNumber(product.dailyCoins)}</strong></div><div><span>{t('每日宝石')}</span><strong>+{product.dailyGems}</strong></div><div><span>{t('有效天数')}</span><strong>{product.validDays}</strong></div><p>{t('每日奖励需当天领取，过期不补发。')}</p></div>,
      confirmLabel: t('确认购买'),
      onConfirm: async () => {
        if (purchaseLock.current) return
        purchaseLock.current = true
        setPendingSku('monthly-pass')
        toast(t('正在处理购买请求…'))
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
          toast(t('购买成功'))
        } else if (result?.status === 'cancelled') toast(t('购买已取消'))
        else toast(t('暂时无法完成购买，请稍后重试'))
      },
    })
  }

  return (
    <div className="store-page compact-store">
      <section className="page-head">
        <p className="eyebrow">STORE · SECURE CHECKOUT</p>
        <h1>{t('金币商城')}</h1>
        <p>{t('选择金币数量并确认购买。')}</p>
      </section>
      <TomorrowChest engagement={engagement} openModal={openModal} />
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
            description={t('连续 30 天，每天领取专属奖励')}
            action={<span className="status">{t('可购买')}</span>}
          />
          <article className="membership-card card">
            <span className="pill">MONTHLY PASS</span>
            <h2>{t('每天都有明确到账的轻量权益')}</h2>
            <p>{t('每天领取固定权益。')}</p>
            <div className="benefit-grid">
              <div>
                <strong>2,000</strong>
                <span>{t('每日金币')}</span>
              </div>
              <div>
                <strong>1</strong>
                <span>{t('每日宝石')}</span>
              </div>
              <div>
                <strong>30</strong>
                <span>{t('有效天数')}</span>
              </div>
            </div>
            <div className="section-footer">
              <span className="pill">{t('有效期：30 天')}</span>
              <button
                className="btn btn-secondary"
                type="button"
                disabled={Boolean(pendingSku)}
                onClick={buyMonthlyPass}
              >
                {pendingSku === 'monthly-pass' ? t('购买处理中') : t('购买月卡')}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() =>
                  openModal({
                    title: t('月度特权卡'),
                    subtitle: t('权益详情'),
                    body: (
                      <p>
                        {t('每日领取 2,000 金币和 1 宝石，有效期 30 天。每日奖励需当天领取，过期不补发。')}
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
            <SectionHeader title={t('购买记录')} description={t('最近完成的购买')} />
            <div className="record-list card">
              {receipts.length ? receipts.map((receipt) => (
                <div key={receipt.id}><strong>{t(receipt.titleKey, receipt.titleValues)}</strong><span>{t(receipt.detailKey, receipt.detailValues)}</span></div>
              )) : <p className="empty-state">{t('暂无购买记录')}</p>}
            </div>
          </section>
        </aside>
      </div>
      <div className="compact-store-links" aria-label={t('更多商城内容')}>
        <button type="button" onClick={showFullEntryHint}>
          <span>{t('月度特权卡')}</span>
          <Icon name="chevronRight" />
        </button>
        <button type="button" onClick={showFullEntryHint}>
          <span>{t('购买记录')}</span>
          <Icon name="chevronRight" />
        </button>
      </div>
    </div>
  )
}
