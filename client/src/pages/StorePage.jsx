import { useState } from 'react'
import { Icon } from '../icons.jsx'
import { coinPacks } from '../data.js'
import { SectionHeader } from '../ui.jsx'
import { formatNumber } from '../format.js'
import { packSummary, validateDemoCode } from '../demoModel.js'
import { useLocale } from '../useLocale.js'

export default function StorePage({ openModal, toast }) {
  const { t } = useLocale()
  const [code, setCode] = useState('')
  const [codeState, setCodeState] = useState({ type: '', message: '' })
  const [validatedCode, setValidatedCode] = useState('')
  const [receipts, setReceipts] = useState([])
  const [redeemed, setRedeemed] = useState(false)
  const choosePack = (pack) => {
    const summary = packSummary(pack)
    openModal({
      title: t('{coins} 金币礼包', { coins: formatNumber(pack.coins) }),
      kicker: t(pack.tag),
      subtitle: t('支付金额 ￥{price}', { price: pack.price }),
      body: (
        <div className="checkout-summary">
          <div>
            <span>{t('基础金币')}</span>
            <strong>{formatNumber(summary.baseCoins)}</strong>
          </div>
          <div>
            <span>{t('加赠金币（{bonus}）', { bonus: pack.bonus })}</span>
            <strong>{formatNumber(summary.bonusCoins)}</strong>
          </div>
          <div>
            <span>{t('合计金币')}</span>
            <strong>{formatNumber(summary.totalCoins)}</strong>
          </div>
          <p>
            {t('额外赠送 {gems} 宝石 · 支付金额 ￥{price}', {
              gems: summary.gems,
              price: pack.price,
            })}
          </p>
          <p>{t('这是静态网页演示，确认按钮不会支付，也不会改变真实余额。')}</p>
        </div>
      ),
      confirmLabel: t('确认演示（不支付）'),
      onConfirm: () => {
        setReceipts((current) => [
          {
            id: current.length + 1,
            titleKey: '{coins} 金币礼包',
            titleValues: { coins: formatNumber(pack.coins) },
            detailKey: '合计 {total} 金币 · 赠送 {gems} 宝石 · ￥{price}',
            detailValues: {
              total: formatNumber(summary.totalCoins),
              gems: summary.gems,
              price: pack.price,
            },
          },
          ...current,
        ])
        toast(t('礼包演示确认完成，未产生订单或扣款。'))
      },
    })
  }
  const redeem = (event) => {
    event.preventDefault()
    const result = validateDemoCode(code)
    const normalized = code.trim().toUpperCase()
    if (redeemed && normalized === 'JOY-DEMO') {
      setValidatedCode('')
      setCodeState({ type: 'error', message: '此兑换码已在本页演示中使用。' })
      return
    }
    setValidatedCode(result.type === 'success' ? normalized : '')
    if (!normalized) setCodeState({ type: 'error', message: '请输入兑换码。' })
    else if (normalized === 'USED-DEMO')
      setCodeState({ type: 'error', message: '此兑换码已被使用。' })
    else if (normalized === 'OLD-DEMO')
      setCodeState({ type: 'error', message: '此兑换码已过期。' })
    else if (result.type === 'success')
      setCodeState({
        type: 'success',
        message: '校验成功：点击“演示兑换”完成一次本页兑换（未真实兑换）。',
      })
    else
      setCodeState({
        type: 'error',
        message: '未找到该兑换码，请核对字符。',
      })
  }
  const redeemDemoCode = () => {
    if (validatedCode !== 'JOY-DEMO') return
    if (redeemed) {
      setCodeState({
        type: 'error',
        message: '此兑换码已在本页演示中使用。',
      })
      return
    }
    setRedeemed(true)
    setValidatedCode('')
    setCodeState({
      type: 'success',
      message: '演示兑换成功：未真实兑换，也未改变真实余额。',
    })
    setReceipts((current) => [
      {
        id: current.length + 1,
        titleKey: '兑换码演示结果',
        detailKey:
          'JOY-DEMO 已兑换一次；未显示未知奖励数量，也未改变真实余额。',
      },
      ...current,
    ])
  }
  return (
    <>
      <section className="page-head">
        <p className="eyebrow">STORE · SAFE CHECKOUT</p>
        <h1>{t('金币商城')}</h1>
        <p>{t('核对礼包数量与价格，体验确认流程；不会触发真实支付。')}</p>
      </section>
      <section className="safety-strip card">
        <span className="feature-icon">
          <Icon name="shield" />
        </span>
        <div>
          <strong>{t('购买保障')}</strong>
          <p>
            {t('金额与到账内容会在确认页再次展示；本静态版不会请求真实支付。')}
          </p>
        </div>
        <span className="status">
          <span className="status-dot" />
          {t('演示安全')}
        </span>
      </section>
      <section className="section">
        <SectionHeader
          title={t('金币礼包')}
          description={t('不同档位包含独立加成与宝石赠礼')}
          action={<span className="pill">{t('人民币计价演示')}</span>}
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
                  <span>{t('基础金币')}</span>
                </div>
                <p className="product-bonus">
                  {t('加赠 {coins} 金币（{bonus}）', {
                    coins: formatNumber(summary.bonusCoins),
                    bonus: pack.bonus,
                  })}
                </p>
                <p>
                  {t('合计 {total} 金币 · 另赠 {gems} 宝石', {
                    total: formatNumber(summary.totalCoins),
                    gems: pack.gemBonus,
                  })}
                </p>
                <div className="product-price">
                  <span>{t('支付金额')}</span>
                  <strong>{t('￥{price}', { price: pack.price })}</strong>
                </div>
                <button
                  className={`btn ${pack.recommended ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  onClick={() => choosePack(pack)}
                >
                  {pack.recommended ? t('选择推荐礼包') : t('选择此礼包')}
                </button>
              </article>
            )
          })}
        </div>
        <p className="fine-print">
          <Icon name="shield" />
          {t('到账数量以确认页为准；本页确认按钮不支付。')}
        </p>
      </section>
      {receipts.length > 0 && (
        <section
          className="section demo-receipts"
          aria-labelledby="demo-receipts-title"
        >
          <SectionHeader
            title={t('本页演示记录')}
            titleId="demo-receipts-title"
            description={t('仅保留在当前页面会话，不是订单或余额记录')}
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
            description={t('此处仅展示权益，暂未开放真实开通')}
            action={<span className="status">{t('未开通')}</span>}
          />
          <article className="membership-card card">
            <span className="pill">MONTHLY PASS</span>
            <h2>{t('每天都有明确到账的轻量权益')}</h2>
            <p>{t('当前仅展示权益结构，不开放真实开通、续费或扣款。')}</p>
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
              <span className="pill">{t('展示有效期：30 天')}</span>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() =>
                  openModal({
                    title: t('月度特权卡'),
                    subtitle: t('展示说明'),
                    body: (
                      <p>
                        {t(
                          '本卡当前仅作界面展示，真实开通、续费、退款与漏领规则尚未开放。',
                        )}
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
              description={t('输入后先校验，再进行一次本页演示兑换')}
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
                  aria-describedby={
                    codeState.message ? 'code-help code-feedback' : 'code-help'
                  }
                />
                <button className="btn btn-secondary" type="submit">
                  {t('校验')}
                </button>
              </div>
              {validatedCode === 'JOY-DEMO' && !redeemed && (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={redeemDemoCode}
                >
                  {t('演示兑换')}
                </button>
              )}
              <small id="code-help">
                {t('体验码：JOY-DEMO；USED-DEMO / OLD-DEMO 可查看异常状态。')}
              </small>
              <p
                id="code-feedback"
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
    </>
  )
}
