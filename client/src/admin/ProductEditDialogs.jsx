import { useState } from 'react'
import EditDialog from './EditDialog.jsx'
import { nextVersionTag, validateChestOffer, validateMonthlyPass } from './adminRules.js'

const clone = (value) => JSON.parse(JSON.stringify(value ?? {}))

function numberChange(setDraft, key) {
  return (event) => {
    const value = event.target.value
    setDraft((current) => ({ ...current, [key]: value === '' ? '' : Number(value) }))
  }
}

function displayValue(value, suffix = '') {
  if (value === '' || value === undefined || value === null) return '未填写'
  return `${value}${suffix}`
}

function ChangePreview({ rows, note, liveNote }) {
  return <>
    {liveNote && <p className="editor-hint">{liveNote}</p>}
    <div className="diff-table">{rows.map((row) => <div className={`diff-row${row.before === row.after ? '' : ' is-changed'}`} key={row.label}>
      <span className="diff-label">{row.label}</span><span className="diff-before">{row.before}</span><span className="diff-arrow">→</span><span className="diff-after">{row.after}</span>
    </div>)}</div>
    {note !== undefined && <label className="inline-field" style={{ alignItems: 'flex-start', display: 'grid', gap: 6, marginTop: 14 }}>
      <span>变更说明（写入操作日志与发布任务）</span>
      <textarea className="ladder-input" value={note.value || ''} placeholder="填写调整原因、生效时间与回滚计划" aria-label="明日宝箱变更说明" onChange={note.onChange} />
    </label>}
  </>
}

function ChestOfferEditDialog({ initial, live, onSave, onClose }) {
  const [openedInitial] = useState(() => clone(initial))
  const [draft, setDraft] = useState(() => clone(initial))
  const dirty = JSON.stringify(draft) !== JSON.stringify(openedInitial)
  const errors = validateChestOffer(draft)
  const isLiveVersion = String(draft.version ?? '') === String(live?.version ?? '')
  const priceErrors = errors.filter((error) => error.includes('版本') || error.includes('购买价格'))
  const rewardErrors = errors.filter((error) => error.includes('奖励'))
  const updateField = (key) => (event) => setDraft((current) => ({ ...current, [key]: event.target.value }))
  const tabs = [
    {
      id: 'price', label: '报价与版本', errors: priceErrors, content: <div className="form-grid">
        <label>报价版本号<input value={draft.version ?? ''} aria-label="明日宝箱报价版本号" onChange={updateField('version')} /></label>
        <label>购买价格（金币，&gt;0）<input type="number" min="1" value={draft.priceCoins ?? ''} aria-label="明日宝箱购买价格" onChange={numberChange(setDraft, 'priceCoins')} /></label>
        <div className="full admin-config-note"><div><strong>草稿版本处理</strong><span>{isLiveVersion ? `当前版本与生效版本相同；保存时将由页面处理为 ${nextVersionTag(live?.version ?? draft.version)}，这里不会提前改写版本号。` : '自定义版本号会随草稿一并保存，并在审核通过后由发布流程生效。'}</span></div></div>
      </div>,
    },
    {
      id: 'reward', label: '奖励边界', errors: rewardErrors, content: <div className="form-grid">
        <label>可能奖励上限（金币，&gt;0）<input type="number" min="1" value={draft.maxRewardCoins ?? ''} aria-label="明日宝箱可能奖励上限" onChange={numberChange(setDraft, 'maxRewardCoins')} /></label>
        <div className="full admin-config-note"><div><strong>服务端规则（只读）</strong><span>每业务日限购 1 个；当日完成一局有效游戏后才可购买。0 金币为合法开奖结果，开奖、钱包流水和状态变更必须原子提交。</span><small>购买键为 chest-purchase-业务日；开启键为 chest-open-宝箱ID。客户端不能修改资格、限购或幂等规则。</small></div></div>
      </div>,
    },
    {
      id: 'preview', label: '变更预览', content: <ChangePreview
        liveNote={`生效报价：${displayValue(live?.version)} · ${displayValue(live?.priceCoins, ' 金币')} · 奖励上限 ${displayValue(live?.maxRewardCoins, ' 金币')}。保存只更新草稿，审核通过后才覆盖生效报价。`}
        rows={[
          { label: '报价版本', before: displayValue(openedInitial.version), after: displayValue(draft.version) },
          { label: '购买价格', before: displayValue(openedInitial.priceCoins, ' 金币'), after: displayValue(draft.priceCoins, ' 金币') },
          { label: '可能奖励上限', before: displayValue(openedInitial.maxRewardCoins, ' 金币'), after: displayValue(draft.maxRewardCoins, ' 金币') },
        ]}
        note={{ value: draft.note, onChange: updateField('note') }}
      />,
    },
  ]

  return <EditDialog
    eyebrow="商品配置草稿"
    title="调整明日宝箱报价"
    subtitle="保存后仅更新报价草稿，并提交审核；玩家当前看到的报价不变。"
    tabs={tabs}
    dirty={dirty}
    onClose={onClose}
    onSave={() => onSave?.(clone(draft))}
    saveLabel="保存草稿并提交审核"
    footNote="切换标签会保留当前修改；关闭或取消不会写入商城草稿。"
  />
}

function MonthlyPassEditDialog({ initial, live, onSave, onClose }) {
  const [openedInitial] = useState(() => clone(initial))
  const [draft, setDraft] = useState(() => clone(initial))
  const dirty = JSON.stringify(draft) !== JSON.stringify(openedInitial)
  const errors = validateMonthlyPass(draft)
  const priceErrors = errors.filter((error) => error.includes('价格') || error.includes('有效天数'))
  const benefitErrors = errors.filter((error) => error.includes('每日'))
  const tabs = [
    {
      id: 'price', label: '价格与周期', errors: priceErrors, content: <div className="form-grid">
        <label>价格（美分，&gt;0）<input type="number" min="1" value={draft.priceUsdCents ?? ''} aria-label="月度特权卡价格美分" onChange={numberChange(setDraft, 'priceUsdCents')} /></label>
        <label>有效天数（&gt;0）<input type="number" min="1" value={draft.validDays ?? ''} aria-label="月度特权卡有效天数" onChange={numberChange(setDraft, 'validDays')} /></label>
        <div className="full admin-config-note"><div><strong>支付与续费规则</strong><span>月度特权卡不自动续费。支付完成后立即生效，有效期按配置天数计算。</span></div></div>
      </div>,
    },
    {
      id: 'benefits', label: '每日权益', errors: benefitErrors, content: <div className="form-grid">
        <label>每日金币（&gt;0）<input type="number" min="1" value={draft.dailyCoins ?? ''} aria-label="月度特权卡每日金币" onChange={numberChange(setDraft, 'dailyCoins')} /></label>
        <label>每日宝石（&gt;0）<input type="number" min="1" value={draft.dailyGems ?? ''} aria-label="月度特权卡每日宝石" onChange={numberChange(setDraft, 'dailyGems')} /></label>
        <div className="full admin-config-note"><div><strong>领取规则</strong><span>玩家需要每日主动领取；当日未领取不补发。权益领取由服务端记录，页面仅编辑草稿配置。</span></div></div>
      </div>,
    },
    {
      id: 'preview', label: '效果预览', content: <ChangePreview
        liveNote={`生效权益：$${(Number(live?.priceUsdCents) / 100).toFixed(2)} / ${displayValue(live?.dailyCoins, ' 金币')} / ${displayValue(live?.dailyGems, ' 宝石')} / ${displayValue(live?.validDays, ' 天')}。`}
        rows={[
          { label: '价格', before: `$${(Number(openedInitial.priceUsdCents) / 100).toFixed(2)}`, after: `$${(Number(draft.priceUsdCents) / 100).toFixed(2)}` },
          { label: '有效天数', before: displayValue(openedInitial.validDays, ' 天'), after: displayValue(draft.validDays, ' 天') },
          { label: '每日金币', before: displayValue(openedInitial.dailyCoins, ' 金币'), after: displayValue(draft.dailyCoins, ' 金币') },
          { label: '每日宝石', before: displayValue(openedInitial.dailyGems, ' 宝石'), after: displayValue(draft.dailyGems, ' 宝石') },
        ]}
      />,
    },
  ]

  return <EditDialog
    eyebrow="商品配置草稿"
    title="编辑月度特权卡"
    subtitle="保存后仅更新月度特权卡草稿，并提交审核；已生效权益不受影响。"
    tabs={tabs}
    dirty={dirty}
    onClose={onClose}
    onSave={() => onSave?.(clone(draft))}
    saveLabel="保存草稿并提交审核"
    footNote="月卡不自动续费；切换标签会保留当前修改，关闭不会写入商城草稿。"
  />
}

export { ChestOfferEditDialog, MonthlyPassEditDialog }
