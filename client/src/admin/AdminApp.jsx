import CategoryManager from './CategoryManager.jsx'
import GameContentDialog from './GameContentDialog.jsx'
import { DEFAULT_CATEGORIES, GAME_TYPES } from '../catalogDefaults.js'
import { categoryText, gameContentKeys, validateCategories, isCatalogModule } from '../catalogConfig.js'
import { readCatalogPublication, restoreCatalogPublication, writeCatalogPublication } from '../catalogPreview.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../icons.jsx'
import { games } from '../data.js'
import liteContent from '../data/liteContent.json'
import { appVersion } from '../version.js'
import EditDialog from './EditDialog.jsx'
import { canReviewAdjustment, reviewAdjustment, isVersionRelease, versionReleaseKey } from './workflowRules.js'
import ActivityRewardDialog from './ActivityRewardDialog.jsx'
import { CheckinLadderEditor, WheelPrizeEditor, MissionListEditor, CheckinPreview, WheelPreview, MissionsPreview } from './ActivityEditors.jsx'
import { ChestOfferEditDialog, MonthlyPassEditDialog } from './ProductEditDialogs.jsx'
import TranslationEditor from './TranslationEditDialog.jsx'
import { buildTranslationFile, serializeTranslationFile, previewTranslationImport, applyTranslationImport } from './translationTransfer.js'
import { createTranslationReviews, needsTranslationReview, updateTranslationReviews, translationReviewErrors } from './translationReview.js'
import { rankings as aggregateWinnerRankings } from '../engagement/model.js'
import { transitions, columns, createInitialStore, ledgerSourceLabel, ledgerStatusLabel, translationLocales, translationNamespace, CONTINENT_NAMES } from './adminSchema.js'
import { continents, countryContinent, countriesOf, countryName } from '../data/regions.js'
import { PHASES, phaseOf } from '../data/phases.js'
import {
  coinPackPriceUsd, wheelBalanced, validateCoinPack,
  validateMonthlyPass, validateChestOffer, validateTranslations, nextVersionTag, validateNickname, nextLedgerId, diffSummary, moduleLabels, moduleLabel,
  getSlice, setSlice, draftDiffers, resetDraftToLive, applyRelease, snapshotDiff, isConfigModule, validateSnapshot, validateGameConfig, releaseDecisionErrors, WHEEL_SLOTS,
  normalizeRegion, regionByContinent, regionSummary, validateRegion, REGION_ALL, REGION_CUSTOM, activityTypeMeta, settledActivityRegion, applyActivityState, validateActivityInfo,
} from './adminRules.js'

const navGroups = [
  { title: '运营概览', items: [['dashboard', '运营概览', 'gauge'], ['todo', '待处理事项', 'bell'], ['publish', '发布审核', 'play'], ['audit', '操作日志', 'clock']] },
  { title: '游戏运营', items: [['games', '游戏管理', 'gamepad'], ['categories', '游戏分类', 'flag'], ['versions', '游戏版本发布', 'bolt'], ['wins', '赢家与动态', 'trophy']] },
  { title: '活动中心', items: [['activities', '活动管理', 'gift'], ['checkin', '签到活动', 'calendar'], ['wheel', '幸运转盘', 'refresh'], ['missions', '每日任务', 'flag']] },
  { title: '商品与权益', items: [['store', '商品与权益', 'store'], ['orders', '订单管理', 'wallet'], ['ledger', '钱包流水', 'coin']] },
  { title: '玩家', items: [['players', '玩家管理', 'user']] },
  { title: '内容与语言', items: [['translations', '多语言内容', 'globe']] },
  { title: '系统管理', items: [['adminUsers', '权限与账号', 'lock']] },
]

const pageMeta = {
  categories: ['游戏分类', '维护大厅筛选分类的名称、语言、顺序和启用状态。分类不改变游戏类型。'],
  wins: ['赢家与动态', '只读查看今日赢家榜、最近中奖与宝箱幸运榜；榜单的管理在另一套系统，本后台不提供增删改。'],
  dashboard: ['运营概览', '实时掌握大厅、游戏、活动与商城运行情况。'],
  todo: ['待处理事项', '需要运营、审核或财务跟进的事项。'],
  publish: ['发布审核', '统一管理草稿、测试验证、审核发布与回滚。'],
  audit: ['操作日志', '所有后台配置与人工操作的可追溯记录。'],
  games: ['游戏管理', '维护游戏目录、展示分类、游戏说明和详情属性。运行状态通过独立操作管理。'],
  versions: ['游戏版本发布', '管理游戏客户端版本的上传、自动检查、测试环境验证与生产发布流程。'],
  uploads: ['上传记录', '游戏版本包上传与校验记录。'],
  test: ['测试环境', '测试环境部署与质量验证记录。'],
  production: ['生产环境', '生产环境发布与运行质量记录。'],
  activities: ['活动管理', '统一管理签到、幸运转盘和每日任务。'],
  checkin: ['签到活动', '配置周期签到和每日奖励。'],
  wheel: ['幸运转盘', '管理奖项、概率、次数和版本。'],
  missions: ['每日任务', '配置目标事件、进度和任务奖励。'],
  store: ['商品与权益', '管理金币礼包、月度特权卡和明日宝箱报价。'],
  orders: ['订单管理', '查询支付、到账、退款和拒付状态。'],
  ledger: ['钱包流水', '追踪金币、宝石的来源、消耗和人工调整。'],
  players: ['玩家管理', '查询玩家资料、资产、奖励领取、月卡权益、宝箱记录和账号状态。'],
  adminUsers: ['权限与账号', '管理后台账号、角色范围与生产环境操作权限。'],
  translations: ['多语言内容', '配置玩家侧大厅的全部文案与游戏说明，覆盖 24 种语言。后台自身界面为中文，不在此范围内。'],
}

const actionConfig = {
  publish: { label: '新建发布任务', title: '创建发布任务', icon: 'play', fields: ['发布对象', '对象版本', '目标环境', '发布范围'] },
  versions: { label: '发起生产发布', title: '发起生产发布', icon: 'bolt' },
  activities: { label: '创建活动', title: '创建活动配置草稿', icon: 'gift', fields: ['活动名称', '活动类型', '活动周期', '适用人群', '奖励预算'] },
  checkin: { label: '创建签到活动', title: '创建签到活动', icon: 'calendar', fields: ['活动名称', '签到周期', '奖励预算', '负责人'] },
  wheel: { label: '新建转盘', title: '创建幸运转盘', icon: 'refresh', fields: ['转盘名称', '免费次数', '奖项数量', '概率版本'] },
  adminUsers: { label: '新增账号', title: '新增后台账号', icon: 'user', fields: ['姓名', '账号邮箱', '角色', '权限范围'] },
}

const statusClass = (value) => {
  if (['进行中', '已完成', '正常', '生效中', '已发布', '启用', '成功', '已解决', '测试通过', '校验通过', '已展示', '已结算', '正常可玩', '已支付', '已领取', '已发放', '已开启', '已生成版本'].includes(value)) return 'success'
  if (['维护中', '待审核', '退款处理中', '候补开放', '待复核', '草稿', '待处理', '处理中', '结算待开始', '灰度 20%', '测试中', '检查中', '待激活', '待支付', '即将上线', '今日可领', '活动限制', '已暂停', '发放中', '待开启', '已提交生产'].includes(value)) return 'warning'
  if (['已下架', '已封禁', '支付失败', '异常', '已作废', '上传失败', '失败', '漏签', '暂不可用', '已驳回', '已回滚', '发放失败', '测试失败', '已过期'].includes(value)) return 'danger'
  return 'neutral'
}

const statusValues = ['正常可玩', '维护中', '即将上线', '暂不可用', '进行中', '草稿', '待审核', '候补开放', '待处理', '处理中', '结算待开始', '生效中', '已发布', '启用', '成功', '已解决', '已结束', '已作废', '测试通过', '测试中', '测试失败', '校验通过', '检查中', '上传失败', '已展示', '已结算', '待激活', '待支付', '已支付', '失败', '退款处理中', '已退款', '异常', '已领取', '漏签', '今日可领', '正常', '活动限制', '待复核', '已取消', '已归档', '已停用', '已暂停', '已驳回', '已回滚', '已封禁', '已发放', '发放中', '发放失败', '未开通', '已到期', '待开启', '已开启', '已过期', '已生成版本', '已提交生产', '灰度 20%']

const configurationNotes = {
  wins: ['榜单按业务日累计中奖金币；最近中奖按时间倒序，同一事件只展示一次。公开金额是累计中奖金币，不是净收益。', '榜单聚合、最近中奖与前台中奖弹幕共用同一份中奖事件，三者必须一致。事件的隐藏、撤销与隐私处理由风控与内容审核系统负责，本后台只读。'],
  publish: ['带快照的发布任务在"通过并发布"时会用快照覆盖生效版本，"驳回"丢弃来源模块的草稿，"回滚"恢复上一个生效版本；不带快照的历史任务只变更状态。', '版本链路：草稿 → 自动检查 → 测试验证 → 待审核 → 灰度/全量 → 已发布。'],
  activities: ['活动配置保存为草稿；发布前校验活动周期、预算、资格范围与奖励库存。', '活动壳的状态与签到/转盘/任务子模块的配置版本目前各自独立（二期联动）。'],
  checkin: ['签到奖励按自然日发放；编辑只改草稿，保存后进入发布审核，通过后才覆盖生效版本。', '缺席补签规则明确为不支持；大奖固定在最后一天。'],
  wheel: ['转盘概率总和必须为 100%，奖项固定 8 格（与前台一致）；开奖结果由服务端记录，前端不直接决定奖励。', '保存草稿会生成新的草稿版本号并进入发布审核；审核通过时会再次校验后才覆盖生效版本。'],
  missions: ['任务进度由服务端事件汇总；领取接口需使用幂等键，避免重复发放。', '任务结束后仅可查看记录，不能修改历史奖励或目标值；上下线同样走草稿与发布审核。'],
  store: ['金币礼包与月度特权卡通过宿主支付桥接完成购买；明日宝箱按次直接从钱包扣款，不生成订单记录。', '明日宝箱报价版本变更会使旧客户端报价失效（409 stale）；三类商品的变更都先进草稿，审核通过后才生效。'],
  orders: ['订单仅覆盖金币礼包与月度特权卡的宿主支付流程。', '状态链路：待支付 → 处理中 → 已支付/失败；已支付后可能进入退款处理中 → 已退款；异常订单需人工介入并写入操作日志。'],
  ledger: ['流水来源与前台一致，固定为 chest_purchase / chest_reward / game_reward / game_cost / checkin / task 六类；后台人工调整使用 manual_adjust，前台流水枚举需在联调时补充该来源。', '系统生成流水只读；仅人工调整支持模拟确认/驳回，完成后自动关闭关联待办。模拟不修改余额，不代表真实入账。'],
  translations: ['这里维护玩家侧文案。简体中文是原文，英文是参考与兜底；其他语言缺失时使用英文。原文或英文变化后，相关已有译文必须复核。', '草稿、导入结果及审核历史保存在当前会话，刷新重置。已审核游戏说明保存在本浏览器，可通过目录预览查看；其他玩家文案仍使用应用内语言文件。请导出文件保留草稿。'],
  players: ['玩家资产、等级与最近战绩以宿主/服务端上下文为准；隐私偏好由玩家自己设置，后台只读展示默认值。', '账号状态变更（活动限制、封禁、待复核、解除）一律需要填写原因并写入操作日志。'],
}

// Which admin page owns each config module, for "查看来源配置".
const moduleToPage = (moduleId) => {
  if (!moduleId) return null
  if (String(moduleId).startsWith('games:')) return 'games'
  if (String(moduleId).startsWith('activityRegion:')) return 'activities'
  return { categories: 'categories', translations: 'translations', wheel: 'wheel', checkin: 'checkin', missions: 'missions', coinPacks: 'store', monthlyPass: 'store', chestOffer: 'store', versions: 'versions', test: 'versions', production: 'versions' }[moduleId] || null
}

const activityRegionId = (moduleId) => String(moduleId).slice('activityRegion:'.length)

function PhaseTag({ moduleId, size = 'sm' }) {
  const phase = phaseOf(moduleId)
  const meta = PHASES[phase]
  return <em className={`phase-tag is-phase-${phase} ${size === 'lg' ? 'is-lg' : ''}`} title={`${meta.label}：${meta.name}`}>{meta.label}</em>
}

const categoryLabelFor = (tags, categories = DEFAULT_CATEGORIES) => tags.map((id) => categoryText(categories.find((category) => category.id === id)) || id).join(' · ')
const gameName = (id) => games.find((g) => g.id === id)?.name || id
const PAGE_SIZE = 20

function exportCsv(name, headers, rows) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
  downloadCsv(name, `\uFEFF${csv}`)
}

function downloadCsv(name, csv) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function Status({ children }) {
  return <span className={`admin-status ${statusClass(children)}`}><i />{children}</span>
}

function MetricCard({ label, value, trend, icon, tone = '', sample = false }) {
  return <article className={`admin-metric ${tone}`}><span className="metric-icon"><Icon name={icon} /></span><div><small>{label}{sample && <em className="sample-tag">示例数据</em>}</small><strong>{value}</strong><em>{trend}</em></div></article>
}

function Modal({ eyebrow, title, subtitle, wide = false, onClose, footer, children }) {
  return <div className="admin-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className={`admin-modal ${wide ? 'is-wide' : ''}`}><div className="modal-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{subtitle && <p className="modal-subtitle">{subtitle}</p>}</div><button className="icon-button" onClick={onClose}><Icon name="close" /></button></div>{children}<div className="modal-foot">{footer}</div></div></div>
}

function Pager({ page, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  return <div className="table-footer"><span>共 {total} 条 · 每页 {PAGE_SIZE} 条</span><span className="pager"><button className="admin-btn subtle" disabled={current === 0} onClick={() => onChange(current - 1)}>上一页</button><span>第 {current + 1} / {pages} 页</span><button className="admin-btn subtle" disabled={current + 1 >= pages} onClick={() => onChange(current + 1)}>下一页</button></span></div>
}

function FieldEditor({ field, value, onChange }) {
  if (field.readOnly) return <strong>{displayFieldValue(field, value)}</strong>
  if (field.type === 'toggle') return <button type="button" disabled={field.disabled} className={`toggle-switch ${value ? 'is-on' : ''}`} onClick={() => onChange(!value)} aria-pressed={!!value} aria-label={field.label}><i /></button>
  if (field.type === 'select') return <select className="ladder-input" value={value} onChange={(event) => onChange(event.target.value)}>{field.options.map((option) => (Array.isArray(option) ? <option key={option[0]} value={option[0]}>{option[1]}</option> : <option key={option} value={option}>{option}</option>))}</select>
  if (field.type === 'textarea') return <textarea className="ladder-input" value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} />
  if (field.type === 'region') return <RegionPicker value={value} onChange={onChange} label={field.label} />
  if (field.type === 'checks') return <div className="check-group">{field.options.map(([optionValue, optionLabel]) => <label key={optionValue}><input type="checkbox" checked={(value || []).includes(optionValue)} onChange={(event) => onChange(event.target.checked ? [...(value || []), optionValue] : (value || []).filter((v) => v !== optionValue))} />{optionLabel}</label>)}</div>
  if (field.type === 'number') return <input className="ladder-input" type="number" min={field.min} max={field.max} step={field.step} disabled={field.disabled} value={value ?? 0} onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))} />
  return <input className="ladder-input" value={value ?? ''} disabled={field.disabled} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />
}

function displayFieldValue(field, value) {
  if (value === '' || value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (field.type === 'region') return regionSummary(value, countryContinent, continents.map((c) => c.code), (code) => CONTINENT_NAMES[code] ?? code)
  const labelOf = (entry) => field.options?.find((option) => Array.isArray(option) && option[0] === entry)?.[1] ?? entry
  return Array.isArray(value) ? value.map(labelOf).join(' / ') || '无' : String(labelOf(value))
}

function PreviewVersionSwitch({ value, onChange, hasDraft }) {
  const active = hasDraft ? value : 'live'
  return <div className="preview-switch" aria-label="预览版本">
    <button type="button" className={active === 'live' ? 'is-active' : ''} aria-pressed={active === 'live'} onClick={() => onChange('live')}>生效预览</button>
    <button type="button" className={active === 'draft' ? 'is-active' : ''} aria-pressed={active === 'draft'} disabled={!hasDraft} onClick={() => onChange('draft')}>草稿预览</button>
    <span className="preview-dirty">{active === 'draft' ? '草稿效果 · 尚未发布' : '当前生效版本 · 只读'}</span>
  </div>
}

function publishNote(store, moduleId) {
  const pending = store.publish.find((entry) => entry.sourceModule === moduleId && entry.status === '待审核')
  return pending ? `保存会替换待审核任务「${pending.name}」，包含本模块已保存的草稿；审核通过后才生效。` : '保存后生成草稿并提交审核，当前生效版本不变。'
}

function ChangePreview({ before, after, fields }) {
  const changed = fields.filter((field) => JSON.stringify(before[field.key]) !== JSON.stringify(after[field.key]))
  return <div className="editor-preview"><h3>本次修改</h3>{changed.length ? <div className="diff-table">{changed.map((field) => <div className="diff-row is-changed" key={field.key}><span className="diff-label">{field.label}</span><span className="diff-before">{displayFieldValue(field, before[field.key])}</span><span className="diff-arrow">→</span><span className="diff-after">{displayFieldValue(field, after[field.key])}</span></div>)}</div> : <p>尚未修改任何字段。</p>}</div>
}

function DescriptorEditModal({ descriptor, onClose, onSaved }) {
  const [initial] = useState(() => structuredClone(Object.fromEntries(descriptor.fields.map((f) => [f.key, f.value]))))
  const [draft, setDraft] = useState(() => structuredClone(initial))
  const editable = descriptor.fields.filter((field) => !field.readOnly && !field.disabled)
  const dirty = editable.some((field) => JSON.stringify(draft[field.key]) !== JSON.stringify(initial[field.key]))
  const errors = descriptor.validate?.(draft) || []
  const groups = descriptor.editSections || [{ id: 'settings', label: '资料编辑', keys: editable.map((field) => field.key) }]
  const hint = typeof descriptor.hint === 'function' ? descriptor.hint(draft) : descriptor.hint
  const tabs = groups.map((group, index) => ({ ...group, errors: index === 0 ? errors : [], content: <div className="form-grid">{descriptor.fields.filter((field) => group.keys.includes(field.key)).map((field) => <label key={field.key} className={field.type === 'checks' ? 'full' : ''}>{field.label}<FieldEditor field={field} value={draft[field.key]} onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))} /></label>)}</div> }))
  tabs.push({ id: 'changes', label: '变更预览', content: <><ChangePreview before={initial} after={draft} fields={editable} />{hint && <p className="editor-hint">{hint}</p>}</> })
  return <EditDialog title={`编辑 · ${descriptor.title}`} eyebrow={descriptor.eyebrow} tabs={tabs} dirty={dirty} onClose={onClose} onSave={() => { if (!dirty || errors.length) return; descriptor.onSave(draft); onSaved() }} saveLabel={descriptor.saveLabel || '保存'} footNote={descriptor.saveLabel?.includes('审核') ? '保存为草稿并提交审核，当前生效版本不变。' : '本项保存后立即生效并记录操作日志。'} />
}

// Large snapshots (a whole game catalogue) would drown the reviewer, so unchanged rows collapse by default.
function DiffSection({ diff }) {
  const changed = diff.filter((row) => row.changed)
  const [showAll, setShowAll] = useState(diff.length <= 15)
  const visible = showAll ? diff : changed
  return <div className="drawer-section"><h3>配置差异 {diff.length > 0 && <small>{changed.length} 项改动 / 共 {diff.length} 项</small>}</h3>
    {diff.length === 0 ? <p className="audit-item"><Icon name="eye" /><span>该任务没有配置快照；历史示例仅变更状态，游戏版本任务同步来源记录与模拟生产视图，不执行真实部署</span></p>
      : <>
        {!changed.length && <p className="audit-item"><Icon name="eye" /><span>快照与当前生效版本一致，没有字段差异</span></p>}
        {visible.length > 0 && <div className="diff-table">{visible.map((row) => <div key={row.key} className={`diff-row ${row.changed ? 'is-changed' : ''}`}><span className="diff-label">{row.label}{row.added && <em className="diff-tag added">新增</em>}{row.removed && <em className="diff-tag removed">移除</em>}</span><span className="diff-before">{row.before}</span><span className="diff-arrow">→</span><span className="diff-after">{row.after}</span></div>)}</div>}
        {diff.length > changed.length && <button className="admin-link diff-toggle" onClick={() => setShowAll((value) => !value)}>{showAll ? '仅显示改动项' : `显示未改动的 ${diff.length - changed.length} 项`}</button>}
      </>}
  </div>
}

function RecordDrawer({ descriptor, onClose }) {
  const [editing, setEditing] = useState(false)
  const [reasonFor, setReasonFor] = useState(null)
  const [reasonText, setReasonText] = useState('')
  const [actionError, setActionError] = useState('')
  if (!descriptor) return null
  if (editing) return <DescriptorEditModal descriptor={descriptor} onClose={() => setEditing(false)} onSaved={onClose} />
  const runAction = (action) => {
    if ((action.requireReason || action.confirm) && reasonFor !== action.label) { setReasonFor(action.label); setReasonText(''); setActionError(''); return }
    const result = action.run(action.requireReason ? reasonText : undefined)
    if (result?.error) { setActionError(result.error); return }
    setActionError('')
    setReasonFor(null)
    if (!action.keepOpen) onClose()
  }
  const hint = typeof descriptor.hint === 'function' ? descriptor.hint(Object.fromEntries(descriptor.fields.map((field) => [field.key, field.value]))) : descriptor.hint
  return <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="admin-drawer">
      <div className="drawer-head"><div><span className="eyebrow">{descriptor.eyebrow}</span><h2>{descriptor.title}</h2></div><button className="icon-button" onClick={onClose}><Icon name="close" /></button></div>
      <div className="drawer-body">
        {descriptor.status && <div className="drawer-field"><span>状态</span><Status>{descriptor.status}</Status></div>}
        {descriptor.fields.map((field) => <div className="drawer-field" key={field.key}><span>{field.label}</span><FieldEditor field={{ ...field, readOnly: true }} value={field.value} /></div>)}
        {hint && <div className="admin-config-note"><Icon name="shield" /><div><strong>说明</strong><span>{hint}</span></div></div>}
        {descriptor.diff && <DiffSection diff={descriptor.diff} />}
        {descriptor.lifecycle && <div className="drawer-section"><h3>状态流转</h3><div className="state-line">{descriptor.lifecycle.steps.map((step, index) => <span key={step} style={{ display: 'contents' }}>{index > 0 && <i />}<span className={`state-node ${step === descriptor.status ? 'active' : descriptor.lifecycle.steps.indexOf(descriptor.status) > index ? 'done' : ''}`}>{step}</span></span>)}</div>{descriptor.lifecycle.branch && <p className="branch-note"><Icon name="bolt" />{descriptor.lifecycle.branch}</p>}</div>}
        {descriptor.actions && descriptor.actions.length > 0 && <div className="drawer-section"><h3>操作</h3><div className="drawer-actions">{descriptor.actions.map((action) => <button key={action.label} className={`admin-btn ${action.tone === 'warning' ? 'warning' : action.tone === 'danger' ? 'danger' : action.tone === 'primary' ? 'primary' : 'subtle'}`} onClick={() => runAction(action)}>{action.label}</button>)}</div>
          {reasonFor && <div className="reason-box"><p>确认对「{descriptor.title}」执行「{reasonFor}」？</p>{actionError&&<p role="alert">{actionError}</p>}{descriptor.actions.find((action)=>action.label===reasonFor)?.requireReason && <textarea placeholder={descriptor.actions.find((a) => a.label === reasonFor)?.reasonLabel || `「${reasonFor}」需要填写原因，用于操作日志留痕`} value={reasonText} onChange={(event) => setReasonText(event.target.value)} />}<div><button className="admin-btn subtle" onClick={() => setReasonFor(null)}>取消</button><button className="admin-btn primary" disabled={descriptor.actions.find((action)=>action.label===reasonFor)?.requireReason && !reasonText.trim()} onClick={() => runAction(descriptor.actions.find((a) => a.label === reasonFor))}>确认{reasonFor}</button></div></div>}
        </div>}
        <div className="drawer-section"><h3>最近操作</h3>{descriptor.history && descriptor.history.length ? descriptor.history.slice(0, 8).map((entry) => <p className="audit-item" key={entry.id}><Icon name="clock" /><span>{entry.actor} · {entry.action}<small>{entry.time} · {entry.result}{entry.before || entry.after ? <span className="diff-pair">{entry.before || '—'} → {entry.after || '—'}</span> : null}</small></span></p>) : <p className="audit-item"><Icon name="eye" /><span>暂无操作记录</span></p>}</div>
      </div>
      <div className="drawer-foot"><button className="admin-btn subtle" onClick={onClose}>关闭</button>{descriptor.onSave && <button className="admin-btn primary" onClick={() => setEditing(true)}>{descriptor.editLabel || '编辑'}</button>}</div>
    </aside>
  </div>
}

function ConfigBadge({ store, moduleId, versionText, onDiscard, onResubmit }) {
  const [discarding, setDiscarding] = useState(false)
  const pending = store.publish.find((p) => p.sourceModule === moduleId && p.status === '待审核')
  const differs = draftDiffers(store, moduleId)
  const stale = pending && Object.hasOwn(pending, 'baseReleaseId') && pending.baseReleaseId !== (store.activeReleaseIds?.[moduleId] ?? null)
  const newerDraft = pending?.snapshot && snapshotDiff(moduleId, pending.snapshot, getSlice(store, moduleId)).some((row) => row.changed)
  const state = pending ? newerDraft ? '已有待审核版本 · 另有新草稿' : '草稿已保存 · 待审核' : differs ? '草稿已保存 · 尚未提交审核' : moduleId === 'translations' ? '与会话对照版本一致' : '与生效版本一致'
  const detail = moduleId === 'translations' ? `游戏说明审核后进入同浏览器的目录预览；其他文案仅更新会话基线，不更新真实服务。${newerDraft ? '新草稿尚未包含在待审核任务内。' : ''}` : pending ? `「${pending.name}」等待审核，玩家仍使用生效版本。${newerDraft ? '新的草稿尚未包含在该审核任务内。' : ''}` : differs ? '页面可查看草稿效果，提交并审核通过后才生效。' : '当前没有未发布的配置变更。'
  return <><div className={`config-badge ${pending ? 'is-pending' : differs ? 'is-dirty' : ''}`}><Icon name={pending ? 'clock' : differs ? 'flag' : 'shield'} /><span><strong>{versionText ? `当前生效 ${versionText} · ` : ''}{state}</strong><small>{detail}{stale && ' 审核基线已变化，当前草稿已保留，请重新提交。'}</small></span>{stale && onResubmit && <button className="admin-btn primary" onClick={onResubmit}>重新提交草稿</button>}{(differs || pending) && onDiscard && <button className="admin-btn subtle" onClick={() => setDiscarding(true)}>放弃草稿</button>}</div>
    {discarding && <Modal title="放弃已保存草稿？" eyebrow="配置操作" onClose={() => setDiscarding(false)} footer={<><button className="admin-btn subtle" onClick={() => setDiscarding(false)}>取消</button><button className="admin-btn warning" onClick={() => { onDiscard(); setDiscarding(false) }}>确认放弃</button></>}><p className="editor-preview">将恢复为当前生效配置，并作废本模块待审核任务；生效版本不受影响。</p></Modal>}
  </>
}

// ---- shared audit / publish-queue helpers, bound to the AdminApp store setter ----
const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
function makeJournal(setStore) {
  const logAudit = (entry) => setStore((store) => ({ ...store, audit: [{ id: `audit-${stamp()}`, logId: `#${Math.random().toString(16).slice(2, 6)}`, actor: '运营管理员', result: '成功', time: '刚刚', before: '', after: '', targetModule: '', targetId: '', ...entry }, ...store.audit] }))
  const addTodo = (entry) => setStore((store) => ({ ...store, todo: [{ id: `todo-${stamp()}`, title: '', source: '', priority: '中', status: '待处理', time: '刚刚', owner: '运营一组', publishId: '', link: null, claimedBy: '', resolution: '', ...entry }, ...store.todo] }))
  const queuePublish = (entry) => {
    const id = `publish-${stamp()}`
    setStore((store) => {
      const releaseBase = isVersionRelease(entry) ? { baseReleaseId: store.activeReleaseIds?.[versionReleaseKey(store, entry)] || null } : isCatalogModule(entry.sourceModule) ? { baseReleaseId: store.activeReleaseIds?.[entry.sourceModule] || null } : {}
      const superseded = store.publish.filter((p) => entry.sourceModule && p.sourceModule === entry.sourceModule && (!isVersionRelease(entry) || p.sourceId === entry.sourceId) && p.status === '待审核').map((p) => p.id)
      return {
        ...store,
        publish: [{ id, name: '', type: '', scope: '生产环境', status: '待审核', owner: '运营管理员', time: '刚刚', sourceModule: '', sourceId: '', snapshot: null, note: '', ...entry, ...releaseBase }, ...store.publish.map((p) => (superseded.includes(p.id) ? { ...p, status: '已作废', time: '刚刚' } : p))],
        todo: [{ id: `todo-${stamp()}`, title: `${entry.name} 等待发布审核`, source: entry.todoSource || '发布审核', priority: '中', status: '待审核', time: '刚刚', owner: '审核组', publishId: id, link: { page: 'publish', focusId: id, label: '打开发布审核任务' }, claimedBy: '', resolution: '' }, ...store.todo.map((t) => (superseded.includes(t.publishId) ? { ...t, status: '已解决', resolution: t.resolution || '关联配置已被新草稿取代，自动关闭' } : t))],
      }
    })
    return id
  }
  const discardDraft = (moduleId) => setStore((store) => {
    const superseded = store.publish.filter((p) => p.sourceModule === moduleId && p.status === '待审核').map((p) => p.id)
    const next = resetDraftToLive(store, moduleId)
    return {
      ...next,
      publish: next.publish.map((p) => (superseded.includes(p.id) ? { ...p, status: '已作废', time: '刚刚' } : p)),
      todo: next.todo.map((t) => (superseded.includes(t.publishId) ? { ...t, status: '已解决' } : t)),
      audit: [{ id: `audit-${stamp()}`, logId: `#${Math.random().toString(16).slice(2, 6)}`, actor: '运营管理员', result: '成功', time: '刚刚', before: '', after: '', action: '放弃草稿', target: moduleLabels[moduleId] || moduleId, targetModule: moduleId, targetId: moduleId }, ...next.audit],
    }
  })
  const transform = (fn) => setStore(fn)
  return { logAudit, addTodo, queuePublish, discardDraft, transform }
}

function Dashboard({ onNavigate, store, environment }) {
  const liveGames = store.live.games[environment]
  const summary = liveGames.reduce((acc, g) => { acc.total += 1; acc[g.status] = (acc[g.status] || 0) + 1; return acc }, { total: 0 })
  const pct = (n) => (summary.total ? Math.round((n / summary.total) * 1000) / 10 : 0)
  const rows = [['正常可玩', ''], ['维护中', 'orange'], ['即将上线', 'gray'], ['暂不可用', 'gray']]
  const openTodo = store.todo.filter((t) => t.status !== '已解决')
  const pendingTodo = openTodo.slice(0, 3)
  const recentPublish = store.publish.slice(0, 2)
  return <>
    <div className="admin-metrics">
      <MetricCard label="今日活跃用户" value="28,460" trend="↑ 12.8% 较昨日（示例快照）" icon="users" tone="blue" sample />
      <MetricCard label="当前在线人数" value="4,812" trend="实时接口待联调（示例快照）" icon="gauge" tone="violet" sample />
      <MetricCard label={`正常可玩游戏 · ${environment === 'production' ? '生产' : '测试'}生效版本`} value={`${summary['正常可玩'] || 0} / ${summary.total}`} trend={`${summary['维护中'] || 0} 款维护 · ${summary['即将上线'] || 0} 款即将上线 · ${summary['暂不可用'] || 0} 款暂不可用`} icon="gamepad" tone="green" />
      <MetricCard label="待处理事项" value={String(openTodo.length)} trend={`${openTodo.filter((t) => t.priority === '高').length} 项高优先级`} icon="bell" tone="orange" />
    </div>
    <div className="admin-dashboard-grid">
      <section className="admin-card status-overview"><div className="card-heading"><div><h2>平台运行概况</h2><p>按当前环境的生效版本统计</p></div><button className="admin-link" onClick={() => onNavigate('games')}>查看游戏管理 <Icon name="chevronRight" /></button></div><div className="distribution">
        {rows.map(([label, tone]) => <div key={label}><span>{label}</span><strong>{summary[label] || 0} 款 <small>{pct(summary[label] || 0)}%</small></strong><b className={tone}><i style={{ width: `${pct(summary[label] || 0)}%` }} /></b></div>)}
      </div></section>
      <section className="admin-card quick-stats"><div className="card-heading"><div><h2>今日业务摘要 <em className="sample-tag">示例数据</em></h2><p>示例快照 · 真实统计接口待联调</p></div><Icon name="clock" /></div><div className="summary-grid"><div><span>签到完成人数</span><strong>18,420</strong><small>完成率 64.8%</small></div><div><span>转盘参与次数</span><strong>32,610</strong><small>免费次数用完率 71.2%</small></div><div><span>任务达成次数</span><strong>9,680</strong><small>达成率 58.4%</small></div><div><span>商城成交金额</span><strong>$12,480</strong><small>支付成功率 98.2%</small></div></div></section>
    </div>
    <div className="admin-dashboard-grid lower">
      <section className="admin-card"><div className="card-heading"><div><h2>待处理事项</h2><p>需要运营或审核跟进的事项</p></div><button className="admin-link" onClick={() => onNavigate('todo')}>全部事项 <Icon name="chevronRight" /></button></div><div className="todo-list">{pendingTodo.length ? pendingTodo.map((t) => <button key={t.id} onClick={() => onNavigate('todo')}><span className={`todo-dot ${t.priority === '高' ? 'danger' : t.priority === '中' ? 'warning' : ''}`} /><span><strong>{t.title}</strong><small>{t.source} · {t.time}</small></span><Icon name="chevronRight" /></button>) : <p className="audit-item"><Icon name="eye" /><span>暂无待处理事项</span></p>}</div></section>
      <section className="admin-card release-card"><div className="card-heading"><div><h2>最近发布</h2><p>配置版本和发布状态</p></div><button className="admin-link" onClick={() => onNavigate('publish')}>发布中心 <Icon name="chevronRight" /></button></div>{recentPublish.length ? recentPublish.map((p) => <div className="release-row" key={p.id}><span className="release-icon"><Icon name="gift" /></span><span><strong>{p.name}</strong><small>{p.scope} · {p.owner} · {p.time}</small></span><Status>{p.status}</Status></div>) : <p className="audit-item"><Icon name="eye" /><span>暂无发布记录</span></p>}</section>
    </div>
    <PhasePlan onNavigate={onNavigate} />
  </>
}

// 后台原型是一次性铺满的，但交付要分三期。这张卡片让评审的人一眼看出
// 哪些模块属于一期，哪些是后面才做的，不必逐页点开确认。
function PhasePlan({ onNavigate }) {
  const allItems = navGroups.flatMap((group) => group.items)
  return <section className="admin-card phase-plan">
    <div className="card-heading"><div><h2>交付分期</h2><p>原型里所有模块都能点，但交付分三期；侧边栏和每页标题上的标签就是这里的分期</p></div></div>
    <div className="phase-plan-grid">
      {[1, 2, 3].map((phase) => <div className={`phase-plan-col is-phase-${phase}`} key={phase}>
        <div className="phase-plan-head"><em className={`phase-tag is-phase-${phase} is-lg`}>{PHASES[phase].label}</em><strong>{PHASES[phase].name}</strong></div>
        <p>{PHASES[phase].summary}</p>
        <div className="phase-plan-modules">
          {allItems.filter(([id]) => phaseOf(id) === phase).map(([id, label, icon]) => <button key={id} onClick={() => onNavigate(id)}><Icon name={icon} />{label}</button>)}
        </div>
      </div>)}
    </div>
  </section>
}

const gameFieldLabels = [['name', '游戏名称'], ['gameType', '游戏类型'], ['tags', '展示分类'], ['badges', '角标'], ['status', '运行状态'], ['popular', '大厅热门推荐'], ['region', '可用地区'], ['wealthLevel', '财富等级门槛'], ['charmLevel', '魅力等级门槛'], ['minBalance', '账户余额门槛'], ['playLevel', '可玩等级门槛'], ['genders', '允许性别'], ['familyOnly', '家族专属'], ['promoTag', '运营标签'], ['cover', '封面资源'], ['sortWeight', '排序权重'], ['maintenanceNote', '维护公告文案'], ['launchAt', '预计上线时间'], ['heat', '热度值'], ['winRate', '中奖率'], ['rtp', 'RTP'], ['winRangeMin', '中奖金额下限'], ['winRangeMax', '中奖金额上限'], ['maxMultiplier', '最大赔率']]
const gameDraftFields = gameFieldLabels.filter(([key]) => key !== 'status' && key !== 'maintenanceNote')

// Every configurable field for a game, grouped the way an operator thinks about them.
// Description text is owned by the 多语言内容 module, not by this record, so it is
// shown read-only here with a jump link rather than as an editable field.
function gameFormSections(draft, categories = DEFAULT_CATEGORIES) {
  const slots = draft.gameType === 'slots'
  return [
    { title: '基础信息', fields: [
      { key: 'name', label: '游戏名称' },
      { key: 'gameId', label: '游戏 ID', readOnly: true, note: '接入后不可修改，前台以此标识跳转' },
      { key: 'gameType', label: '游戏类型', type: 'select', options: GAME_TYPES, note: '游戏类型决定详情属性，不随大厅分类改变。' },
      { key: 'tags', label: '展示分类', type: 'checks', options: categories.filter((category) => category.enabled).map((category) => [category.id, categoryText(category)]), full: true, note: '选项来自已发布的游戏分类，可同时关联多个分类。' },
      { key: 'badges', label: '角标（英文逗号分隔）', placeholder: 'JACKPOT, 热度 96' },
      { key: 'cover', label: '封面资源', note: '资源上传接口待联调，当前仅记录文件名' },
      { key: 'region', label: '可用地区', type: 'region', full: true, note: '白名单：只有勾选的国家/地区能看到并进入这款游戏' },
      { key: 'sortWeight', label: '排序权重', type: 'number', note: '数值越小越靠前；目录设置中的排序会覆盖该顺序' },
      { key: 'launchAt', label: '预计上线时间', note: '上线计划走草稿审核；进入即将上线状态前需先发布有效时间' },
    ] },
    { title: '进入门槛', note: '填 0 为不限。门槛不满足时游戏仍展示但锁定，与地区限制的隐藏规则不同。演示账号已接入这些字段；真实宿主未提供某项时会挡住对应玩家，本后台无法识别所有真实宿主能力。', fields: [
      { key: 'wealthLevel', label: '财富等级门槛', type: 'number', min: 0 },
      { key: 'charmLevel', label: '魅力等级门槛', type: 'number', min: 0 },
      { key: 'minBalance', label: '账户余额门槛（金币）', type: 'number', min: 0 },
      { key: 'playLevel', label: '可玩等级门槛', type: 'number', min: 0 },
      { key: 'genders', label: '允许性别', type: 'checks', options: [['male', '男'], ['female', '女']], full: true },
      { key: 'familyOnly', label: '家族专属', type: 'toggle', note: '开启后仅有家族归属的玩家可进入' },
    ] },
    { title: '大厅展示', fields: [
      { key: 'popular', label: '大厅热门推荐', type: 'toggle' },
      { key: 'promoTag', label: '运营标签', type: 'select', options: [['none', '无标签'], ['club', 'Club'], ['hot', 'Hot'], ['new', 'New']], note: '用于大厅卡片运营位；分类标签决定筛选归属，角标是自由文本，三者分别维护。' },
      { key: 'heat', label: '热度值（0–100）', type: 'number', min: 0, max: 100 },
      { key: 'players', label: '在线人数', readOnly: true, note: '由实时统计服务写入，后台不可修改' },
    ] },
    ...(slots ? [{ title: '详情展示属性', note: '仅用于玩家查看游戏信息，不控制游戏引擎的概率、赔率或结算。玩法和规则在游戏说明中维护。', fields: [
      { key: 'winRate', label: '中奖率', placeholder: '例如 4.8%' },
      { key: 'rtp', label: 'RTP', placeholder: '例如 96.12%' },
      { key: 'winRangeMin', label: '中奖金额下限', type: 'number', min: 0, placeholder: '例如 20' },
      { key: 'winRangeMax', label: '中奖金额上限', type: 'number', min: 0, placeholder: '例如 500000' },
      { key: 'maxMultiplier', label: '最大赔率', placeholder: '例如 x5,000' },
    ] }] : []),
  ]
}

function GameEditModal({ record, store, update, journal, environment, onClose, onSaved, onEditContent }) {
  const [initial] = useState(() => structuredClone(record))
  const [draft, setDraft] = useState(() => ({ ...structuredClone(initial), badges: initial.badges.join(', ') }))
  const normalized = { ...draft, badges: String(draft.badges).split(',').map((x) => x.trim()).filter(Boolean), categoryLabel: categoryLabelFor(draft.tags, store.live.categories), heat: Number(draft.heat), sortWeight: Number(draft.sortWeight) }
  for (const key of ['wealthLevel', 'charmLevel', 'minBalance', 'playLevel']) if (normalized[key] === '') normalized[key] = 0
  const dirty = gameDraftFields.some(([key]) => JSON.stringify(normalized[key]) !== JSON.stringify(initial[key]))
  const errors = validateGameConfig(normalized)
  const sections = gameFormSections(draft, store.live.categories)
  const moduleId = `games:${environment}`
  const nextList = store.games[environment].map((g) => g.id === record.id ? { ...g, ...Object.fromEntries(gameDraftFields.map(([key]) => [key, normalized[key]])), categoryLabel: normalized.categoryLabel } : g)
  const save = () => {
    if (!dirty || errors.length) return
    update('games', (byEnv) => ({ ...byEnv, [environment]: nextList }))
    journal.logAudit({ action: '编辑游戏配置（草稿）', target: normalized.name, targetModule: 'games', targetId: record.id, after: diffSummary(initial, normalized, gameDraftFields) })
    journal.queuePublish({ name: `${normalized.name} 配置更新`, type: '游戏配置', scope: environment === 'production' ? '生产环境' : '测试环境', sourceModule: moduleId, sourceId: record.id, snapshot: { games: nextList }, todoSource: '游戏运营' })
    onSaved()
  }
  const matchedErrors = new Set()
  const tabs = sections.map((section, index) => {
    const sectionErrors = errors.filter((error) => section.fields.some((field) => error.includes(field.label.split(/[（(]/)[0])))
    sectionErrors.forEach((error) => matchedErrors.add(error))
    return { id: `game-${index}`, label: section.title, errors: sectionErrors, content: <div className="game-form"><p className="fieldset-note">{section.note}</p><div className="form-grid">{section.fields.map((field) => <label key={field.key} className={field.full || field.type === 'translationLink' ? 'full' : ''}>
      {field.label}{field.pending && <em className="sample-tag">前台未接入</em>}
      <FieldEditor field={field} value={draft[field.key]} onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))} />
      {field.note && <small className="field-note">{field.note}</small>}{field.type === 'translationLink' && dirty && <small className="field-note">先保存或放弃当前修改，再前往多语言内容。</small>}
    </label>)}</div></div> }
  })
  tabs[0].errors.push(...errors.filter((error) => !matchedErrors.has(error)))
  tabs.splice(1, 0, { id: 'content', label: '游戏说明', content: <div className="editor-preview"><p>简介、玩法说明和规则说明按游戏维护多语言，文案与详情数值分别审核。</p><p style={{ whiteSpace: 'pre-wrap' }}>{store.translations[gameContentKeys(record).description]?.['zh-Hans'] || '尚未填写简介'}</p><button type="button" className="admin-btn primary" disabled={dirty} onClick={() => { onClose(); onEditContent(record) }}>编辑多语言游戏说明</button>{dirty && <p>请先保存或放弃当前配置修改。</p>}</div> })
  tabs.push({ id: 'changes', label: '变更预览', content: <><p className="editor-hint">这里列出本次提交后，整个目录草稿与当前生效版本的差异。运行状态与维护公告不由本弹窗修改。</p><DiffSection diff={snapshotDiff(moduleId, getSlice(store.live, moduleId), { games: nextList })} /></> })
  return <EditDialog title={`编辑游戏 · ${record.name}`} eyebrow={`游戏配置 · ${environment === 'production' ? '生产环境' : '测试环境'}`} subtitle={`${record.gameId} · 运行状态通过独立操作调整`} tabs={tabs} dirty={dirty} onClose={onClose} onSave={save} footNote={publishNote(store, moduleId)} />
}

function GameRuntimeModal({ record, store, journal, environment, onClose }) {
  const [initial] = useState(() => ({ status: record.status, maintenanceNote: record.maintenanceNote || '' }))
  const [draft, setDraft] = useState(initial)
  const dirty = JSON.stringify(initial) !== JSON.stringify(draft)
  const errors = []
  if (draft.status === '维护中' && !draft.maintenanceNote.trim()) errors.push('进入维护中必须填写维护公告')
  if (draft.status === '即将上线' && !String(record.launchAt || '').trim()) errors.push('请先编辑并发布预计上线时间，再切换为即将上线')
  const fields = [{ key: 'status', label: '运行状态' }, { key: 'maintenanceNote', label: '维护公告' }]
  const save = () => {
    if (!dirty || errors.length) return
    journal.transform((current) => {
      const apply = (list) => list.map((g) => g.id === record.id ? { ...g, ...draft } : g)
      return { ...current, games: { ...current.games, [environment]: apply(current.games[environment]) }, live: { ...current.live, games: { ...current.live.games, [environment]: apply(current.live.games[environment]) } } }
    })
    journal.logAudit({ action: '变更游戏运行状态（直接生效）', target: record.name, targetModule: 'games', targetId: record.id, before: `${initial.status} · ${initial.maintenanceNote}`, after: `${draft.status} · ${draft.maintenanceNote}` })
    if (draft.status === '维护中' && initial.status !== '维护中') journal.addTodo({ title: `${record.name} 进入维护`, source: '游戏运营', priority: '高', link: { page: 'games', focusId: record.id, label: `查看 ${record.name} 游戏配置` } })
    if (initial.status === '维护中' && draft.status !== '维护中') journal.transform((current) => ({ ...current, todo: current.todo.map((t) => t.status !== '已解决' && t.link?.page === 'games' && t.link.focusId === record.id ? { ...t, status: '已解决', resolution: `${record.name} 已切换为${draft.status}`, time: '刚刚' } : t) }))
    onClose()
  }
  return <EditDialog title={`运行操作 · ${record.name}`} eyebrow="立即生效的运行控制" dirty={dirty} onClose={onClose} onSave={save} saveLabel="确认立即生效" footNote="只修改运行状态和维护公告，不发布或覆盖配置草稿。" tabs={[
    { id: 'runtime', label: '运行状态', errors, content: <div className="form-grid"><label>运行状态<select value={draft.status} onChange={(event) => setDraft((v) => ({ ...v, status: event.target.value }))}>{['正常可玩','维护中','即将上线','暂不可用'].map((status) => <option key={status}>{status}</option>)}</select></label><label className="full">维护公告<textarea value={draft.maintenanceNote} onChange={(event) => setDraft((v) => ({ ...v, maintenanceNote: event.target.value }))} /></label><p className="full editor-hint">当前已发布的预计上线时间：{record.launchAt || '未配置'}。{store.publish.some((p) => p.sourceModule === `games:${environment}` && p.status === '待审核') ? '当前另有配置待审核，本操作不替换该任务。' : ''}</p></div> },
    { id: 'impact', label: '操作影响', content: <><ChangePreview before={initial} after={draft} fields={fields} /><p className="editor-hint">确认后立即影响游戏可玩状态，并记录操作日志；配置审核及回滚不会覆盖此运行状态。</p></> },
  ]} />
}

function GameDirectoryModal({ store, update, journal, environment, onClose, onSaved }) {
  const [initial] = useState(() => structuredClone(store.games[environment]))
  const [items, setItems] = useState(() => structuredClone(initial))
  const [dragging, setDragging] = useState(null)
  const dirty = JSON.stringify(items) !== JSON.stringify(initial)
  const moduleId = `games:${environment}`
  const move = (id, targetIndex) => setItems((current) => {
    const index = current.findIndex((game) => game.id === id)
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length || index === targetIndex) return current
    const next = [...current]; const [game] = next.splice(index, 1); next.splice(targetIndex, 0, game)
    return next.map((item, i) => ({ ...item, sortWeight: (i + 1) * 10 }))
  })
  const save = () => {
    if (!dirty) return
    update('games', (byEnv) => ({ ...byEnv, [environment]: items }))
    journal.logAudit({ action: '保存游戏目录草稿', target: moduleLabels[moduleId], targetModule: 'games', targetId: environment, before: initial.map((g) => `${g.name}${g.popular ? '★' : ''}`).join('，'), after: items.map((g) => `${g.name}${g.popular ? '★' : ''}`).join('，') })
    journal.queuePublish({ name: `${moduleLabels[moduleId]}排序/推荐更新`, type: '游戏配置', scope: environment === 'production' ? '生产环境' : '测试环境', sourceModule: moduleId, sourceId: environment, snapshot: { games: items }, todoSource: '游戏运营' })
    onSaved()
  }
  return <EditDialog title="编辑游戏目录" eyebrow={moduleLabels[moduleId]} dirty={dirty} onClose={onClose} onSave={save} footNote={publishNote(store, moduleId)} tabs={[
    { id: 'order', label: '排序', content: <div className="editor-preview"><p>拖拽或使用上移、下移调整顺序，保存前不会改变页面目录。</p>{items.map((game, index) => <div className="directory-edit-row" key={game.id} draggable onDragStart={() => setDragging(game.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragging) move(dragging, index); setDragging(null) }} onDragEnd={() => setDragging(null)}><span>{index + 1}</span><strong>{game.name}</strong><button className="admin-btn subtle" disabled={index === 0} onClick={() => move(game.id, index - 1)} aria-label={`上移 ${game.name}`}>上移</button><button className="admin-btn subtle" disabled={index === items.length - 1} onClick={() => move(game.id, index + 1)} aria-label={`下移 ${game.name}`}>下移</button></div>)}</div> },
    { id: 'popular', label: '热门推荐', content: <div className="editor-preview">{items.map((game) => <label className="directory-edit-row" key={game.id}><input type="checkbox" checked={game.popular} onChange={(event) => setItems((current) => current.map((item) => item.id === game.id ? { ...item, popular: event.target.checked } : item))} /><span>{game.name}</span></label>)}</div> },
    { id: 'changes', label: '变更预览', content: <DiffSection diff={snapshotDiff(moduleId, getSlice(store.live, moduleId), { games: items })} /> },
  ]} />
}

function resubmitCatalogDraft(store, moduleId, journal) {
  journal.queuePublish({ name: `${moduleLabel(moduleId)}重新提交`, type: '配置更新', scope: '原型目录', sourceModule: moduleId, snapshot: getSlice(store, moduleId) })
  journal.logAudit({ action: '重新提交配置草稿', target: moduleLabel(moduleId), targetModule: moduleId, targetId: moduleId, after: '已按当前生效基线创建新的审核任务' })
}

function GameCatalogPage({ environment, store, update, journal, intent, navigate, onOpen }) {
  const moduleId = `games:${environment}`
  const differs = draftDiffers(store, moduleId)
  const [preview, setPreview] = useState('live')
  const [view, setView] = useState('table')
  const [editingId, setEditingId] = useState(intent?.focusId || null)
  const [runtimeId, setRuntimeId] = useState(null)
  const [directory, setDirectory] = useState(false)
  const [contentId, setContentId] = useState(null)
  const [contentFeedback, setContentFeedback] = useState('')
  const categoryDefinitions = store.live.categories
  const items = (preview === 'draft' && differs ? store.games[environment] : store.live.games[environment]).map((game) => ({ ...game, categoryLabel: categoryLabelFor(game.tags, categoryDefinitions) }))
  const edit = (game) => setEditingId(game.id)
  const saved = () => { setEditingId(null); setDirectory(false); setPreview('draft') }
  const regionText = (game) => regionSummary(game.region, countryContinent, continents.map((c) => c.code), (code) => CONTINENT_NAMES[code] ?? code)
  const gateText = (game) => {
    const parts = [['wealthLevel','财富'],['charmLevel','魅力'],['minBalance','余额'],['playLevel','可玩']].filter(([key]) => Number(game[key]) > 0).map(([key,label]) => `${label} ${game[key]}`)
    if (game.genders?.length === 1) parts.push(`性别 ${game.genders[0] === 'male' ? '男' : '女'}`)
    if (game.familyOnly) parts.push('家族成员')
    return parts.join(' · ') || '无门槛'
  }
  const promoLabel = (tag) => ({ club:'Club',hot:'Hot',new:'New' })[tag]
  const headers = ['排序','游戏名称','游戏 ID','分类','状态','可用地区','进入门槛','家族专属','在线人数','热度','大厅热门推荐']
  const showDetails = (game) => onOpen({ id: `game-view-${game.id}`, title: game.name, eyebrow: preview === 'draft' && differs ? '游戏详情 · 草稿预览' : '游戏详情 · 生效预览', status: game.status, fields: gameFieldLabels.map(([key,label]) => ({ ...gameFormSections(game, categoryDefinitions).flatMap((section) => section.fields).find((field) => field.key === key), key,label,value:game[key],readOnly:true})), history:store.audit.filter((entry)=>entry.targetModule==='games'&&entry.targetId===game.id), actions:[{label:'编辑配置',tone:'primary',run:()=>edit(game)},{label:'游戏说明',tone:'primary',run:()=>setContentId(game.id)},{label:'运行操作',tone:'warning',run:()=>setRuntimeId(game.id)}] })
  const contentGame = store.games[environment].find((game) => game.id === contentId)
  const saveContent = (entries, reviews) => {
    const errors = validateTranslations(entries)
    if (errors.length) return { error: errors.join('；') }
    journal.transform((current) => ({ ...current, translations: entries, translationReviews: reviews }))
    journal.logAudit({ action: '保存游戏说明草稿', target: contentGame.name, targetModule: 'translations', targetId: contentGame.gameId, after: Object.values(gameContentKeys(contentGame)).join('、') })
    setContentFeedback(`${contentGame.name} 说明已保存为草稿，完成译文复核后提交文案审核。`)
  }
  const editing = store.games[environment].find((game) => game.id === editingId)
  const runtime = store.live.games[environment].find((game) => game.id === runtimeId)
  return <>
    <ConfigBadge store={store} moduleId={moduleId} onDiscard={() => journal.discardDraft(moduleId)} onResubmit={() => resubmitCatalogDraft(store, moduleId, journal)} />
    <div className="catalog-toolbar"><button className="admin-btn subtle" onClick={() => navigate('categories')}>管理游戏分类</button><button className="admin-btn subtle" onClick={() => navigate('translations', { query: 'games.' })}>游戏文案审核</button><a className="admin-btn subtle" target="_blank" rel="noopener noreferrer" href={`games.html?catalogPreview=1&catalogEnv=${environment}`}>预览已发布游戏目录</a></div>
    {contentFeedback && <p role="status">{contentFeedback}</p>}
    <section className="admin-card catalog-summary"><div><span>当前环境</span><strong>{environment === 'production' ? '生产环境' : '测试环境'}</strong><small>草稿与生效版本按环境独立</small></div><div><span>目录游戏</span><strong>{items.length} 款</strong><small>当前预览正常可玩 {items.filter((game) => game.status === '正常可玩').length} 款 · 页面只读</small></div><div><span>当前预览</span><strong>{preview === 'draft' && differs ? '草稿 · 未发布' : '生效版本'}</strong><small>运行操作始终基于最新生效状态</small></div></section>
    <PreviewVersionSwitch value={preview} onChange={setPreview} hasDraft={differs} />
    <div className="drag-hint">分类统计：{categoryDefinitions.filter((category) => category.enabled).map((category) => `${categoryText(category)} ${items.filter((game) => game.tags.includes(category.id)).length} 款`).join(' · ')}</div>
    <div className="catalog-toolbar"><div className="view-toggle"><button onClick={()=>setView('table')} className={view==='table'?'is-active':''}>表格视图</button><button onClick={()=>setView('cards')} className={view==='cards'?'is-active':''}>卡片视图</button></div><button className="admin-btn primary" onClick={()=>setDirectory(true)}>编辑目录排序与推荐</button></div>
    {view === 'table' ? <section className="admin-card table-card"><div className="table-top"><strong>游戏目录</strong><button className="admin-btn subtle" onClick={()=>exportCsv(`游戏目录-${environment}`,headers,items.map((g,i)=>[i+1,g.name,g.gameId,`${g.categoryLabel}${promoLabel(g.promoTag) ? ` · ${promoLabel(g.promoTag)}` : ''}`,g.status,regionText(g),gateText(g),g.familyOnly?'是':'否',g.players,g.heat,g.popular?'是':'否']))}>导出 CSV</button></div><div className="table-wrap"><table className="editor-action-table"><thead><tr>{headers.map((label)=><th key={label}>{label}</th>)}<th className="fixed-actions">操作</th></tr></thead><tbody>{items.map((game,index)=><tr key={game.id} onClick={()=>showDetails(game)}><td>{index+1}</td><td><span className="game-name-cell"><span className={`game-thumb thumb-${index % 4}`} /><strong>{game.name}</strong></span></td><td>{game.gameId}</td><td>{game.categoryLabel}{promoLabel(game.promoTag)&&<em className="promo-tag">{promoLabel(game.promoTag)}</em>}</td><td><Status>{game.status}</Status></td><td>{regionText(game)}</td><td>{gateText(game)}</td><td>{game.familyOnly?'是':'否'}</td><td>{game.players}</td><td><span className="heat-bar"><i style={{width:`${game.heat}%`}} /></span><small>{game.heat || '—'}</small></td><td>{game.popular?'是':'否'}</td><td className="fixed-actions"><div className="row-action-group"><button className="admin-btn subtle" onClick={(event)=>{event.stopPropagation();showDetails(game)}}>查看</button><button className="admin-btn primary" onClick={(event)=>{event.stopPropagation();edit(game)}}>编辑</button><button className="admin-btn subtle" onClick={(event)=>{event.stopPropagation();setContentId(game.id)}}>说明</button></div></td></tr>)}</tbody></table></div></section> : <section className="catalog-cards">{items.map((game,index)=><article className="game-admin-card" key={game.id}><span className={`game-cover cover-${index%4}`}><b>{index+1}</b></span><div><Status>{game.status}</Status><h3>{game.name}</h3><p>{game.categoryLabel} · {promoLabel(game.promoTag)}</p><span>{game.players} 在线 · {gateText(game)} · {game.popular?'已推荐':'未推荐'}</span></div><div className="row-action-group"><button className="admin-btn subtle" onClick={()=>showDetails(game)}>查看</button><button className="admin-btn primary" onClick={()=>edit(game)}>编辑</button><button className="admin-btn subtle" onClick={()=>setContentId(game.id)}>说明</button></div></article>)}</section>}
    {editing&&<GameEditModal key={editing.id} record={editing} store={store} update={update} journal={journal} environment={environment} navigate={navigate} onClose={()=>setEditingId(null)} onSaved={saved} onEditContent={(game) => setContentId(game.id)} />}
    {contentGame && <GameContentDialog game={contentGame} entries={store.translations} reviews={store.translationReviews} onSave={saveContent} onClose={() => setContentId(null)} />}
    {runtime&&<GameRuntimeModal key={runtime.id} record={runtime} store={store} journal={journal} environment={environment} onClose={()=>setRuntimeId(null)} />}
    {directory&&<GameDirectoryModal store={store} update={update} journal={journal} environment={environment} onClose={()=>setDirectory(false)} onSaved={saved} />}
  </>
}

function buildCreateRecord(page, values, note) {
  const id = `${page}-new-${stamp()}`
  if (page === 'publish') return { id, name: `${values[0]} ${values[1]}`.trim(), type: '系统配置', scope: values[3] || values[2], status: '待审核', owner: '运营管理员', time: '刚刚', sourceModule: '', sourceId: '', snapshot: null, note }
  if (page === 'activities') return { id, name: values[0], type: values[1], period: values[2], status: '草稿', participants: '—', owner: '产品组', audience: values[3], budget: values[4], region: {mode:'all',countries:[]}, note }
  if (page === 'checkin') return { id, name: values[0], period: values[1], participants: '—', status: '草稿', budget: values[2], owner: values[3], note }
  if (page === 'wheel') return { id, name: values[0], prizeCount: `${values[2]} 个奖项`, freeSpins: values[1], status: '草稿', probabilityState: '概率未配置', version: values[3], note }
  if (page === 'adminUsers') return { id, name: values[0], email: values[1], role: values[2], status: '待激活', scope: values[3], lastLogin: '从未登录', mfa: false, note }
  return { id, name: values[0], note }
}

const splitBundle = (bundle) => { const match = String(bundle).match(/^(.*)\s(v[\d.]+)$/); return match ? [match[1], match[2]] : [bundle, 'v1.0.0'] }

function describeGeneric(page, record, store, { update, journal }) {
  const cols = columns[page]
  const label0 = record[cols[0][0]]
  const pageTransitions = page === 'ledger' && !canReviewAdjustment(record) ? [] : transitions[page]?.[record.status] || []
  const history = store.audit.filter((a) => a.targetModule === page && a.targetId === record.id)
  const actions = pageTransitions.filter(([, , opts = {}]) => !(page === 'publish' && isCatalogModule(record.sourceModule) && ['gray', 'pause', 'resume'].includes(opts.decision))).map(([label, nextStatus, opts = {}]) => ({
    label: page === 'publish' && (record.sourceModule === 'translations' || isVersionRelease(record)) ? `模拟 · ${label}` : label, confirm: true, tone: nextStatus && statusClass(nextStatus) === 'danger' ? 'danger' : opts.requireReason ? 'warning' : opts.decision === 'approve' ? 'primary' : 'subtle', requireReason: !!opts.requireReason,
    run: (reason) => {
      if (page === 'ledger') {
        const checked = reviewAdjustment(store, record.id, nextStatus, reason)
        if (checked.error) return { error: checked.error }
        journal.transform((current) => reviewAdjustment(current, record.id, nextStatus, reason).store)
        return
      }
      if (page === 'publish' && opts.decision) {
        const errors = releaseDecisionErrors(store, record, opts.decision)
        journal.transform((current)=>applyRelease(current,record,opts.decision,reason,{seq:Date.now()}))
        return errors.length ? {error:errors.join('；')} : undefined
      }
      if (!opts.logOnly && page === 'activities') {
        const result = applyActivityState(store,record.id,nextStatus)
        if (!result.ok) { journal.logAudit({action:label,target:record.name,targetModule:'activities',targetId:record.id,result:`失败 · ${result.error}`});return {error:result.error} }
        journal.transform((current)=>applyActivityState(current,record.id,nextStatus).store)
      } else if (!opts.logOnly) update(page, (list) => list.map((r) => (r.id === record.id ? { ...r, status: nextStatus, ...(opts.metric ? { metric: opts.metric } : {}), time: '刚刚' } : r)))
      journal.logAudit({ action: label, target: label0, targetModule: page, targetId: record.id, before: record.status, after: opts.logOnly ? record.status : nextStatus, result: opts.resultLabel || (reason ? `成功 · 原因：${reason}` : '成功') })
      if (opts.effect === 'createVersion') {
        const [game, version] = record.game && record.version ? [record.game, record.version] : splitBundle(record.bundle)
        update('versions', (list) => [{ id: `versions-${stamp()}`, game, version: `${version} · ${record.file}`, production: '—', status: '检查中', scope: '待定', time: '刚刚' }, ...list])
      }
      if (opts.effect === 'submitProduction') journal.queuePublish({ name: `${record.version || record.game} 生产发布`, type: '游戏版本', scope: '生产环境', sourceModule: page, sourceId: record.id, todoSource: '游戏运营' })
    },
  }))
  return { cols, label0, history, actions }
}

function GenericPage({ page, onOpen, store, update, journal, intent, describe, navigate }) {
  const rows = store[page]
  const [query, setQuery] = useState(intent?.query || '')
  const [filter, setFilter] = useState('全部状态')
  const [pageIndex, setPageIndex] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [formValues, setFormValues] = useState({})
  const meta = pageMeta[page]
  const action = actionConfig[page]
  const cols = columns[page]
  const labels = cols.map(([, label]) => label)
  const filteredRows = useMemo(() => (rows || []).filter((row) => cols.some(([key]) => `${row[key]}`.toLowerCase().includes(query.toLowerCase())) && (filter === '全部状态' || row.status === filter)), [rows, query, filter, cols])
  const statusOptions = [...new Set((rows || []).map((row) => row.status).filter(Boolean))]
  const visibleRows = filteredRows.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE)
  const openRow = (record) => {
    if (describe) return onOpen(describe(record, store, { update, journal }))
    const { label0, history, actions } = describeGeneric(page, record, store, { update, journal })
    const fields = cols.filter(([key]) => key !== 'status').map(([key, label]) => ({ key, label, value: record[key], readOnly: true }))
    if (page === 'audit') fields.push({ key: 'targetModule', label: '对象模块', value: moduleLabels[record.targetModule] || pageMeta[record.targetModule]?.[0] || record.targetModule || '—', readOnly: true }, { key: 'before', label: '变更前', value: record.before || '—', readOnly: true }, { key: 'after', label: '变更后', value: record.after || '—', readOnly: true })
    if (page === 'publish') fields.push({ key: 'sourceModule', label: '来源模块', value: moduleLabel(record.sourceModule) || (record.sourceModule ? pageMeta[record.sourceModule]?.[0] : '') || '—', readOnly: true }, { key: 'snapshot', label: '配置快照', value: record.snapshot ? record.sourceModule === 'translations' ? '有 · 游戏说明同步目录预览，其他文案仅更新会话基线' : '有 · 审核通过后覆盖生效版本' : isVersionRelease(record) ? '无 · 同步来源版本与模拟生产视图，不执行真实部署' : '无 · 仅变更任务状态', readOnly: true }, { key: 'note', label: '发布说明', value: record.note || '—', readOnly: true })
    const diff = page === 'publish' && record.snapshot && isConfigModule(record.sourceModule) ? snapshotDiff(record.sourceModule, getSlice(store.live, record.sourceModule), record.snapshot) : page === 'publish' ? [] : null
    const sourcePage = page === 'publish' ? moduleToPage(record.sourceModule) : null
    const sourceIntent = String(record.sourceModule).startsWith('activityRegion:') ? { focusId: activityRegionId(record.sourceModule) } : null
    const allActions = sourcePage && navigate ? [...actions, { label: '查看来源配置', tone: 'subtle', run: () => navigate(sourcePage, sourceIntent) }] : actions
    onOpen({ id: `${page}-${record.id}`, eyebrow: `${meta[0]}详情`, title: label0, status: record.status, history, actions: allActions, fields, diff })
  }
  useEffect(() => {
    if (!intent?.focusId) return
    const target = (rows || []).find((row) => row.id === intent.focusId)
    if (target) openRow(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount: opens the record a todo linked to
  }, [])
  const formComplete = action && action.fields.every((f) => String(formValues[f] || '').trim())
  const submitCreate = () => {
    if (!formComplete) return
    const values = action.fields.map((f) => formValues[f].trim())
    const record = buildCreateRecord(page, values, formValues.note || '')
    if (page==='activities') journal.transform((current)=>({...current,activities:[record,...current.activities],live:{...current.live,activities:[structuredClone(record),...current.live.activities]}}))
    else update(page, (list) => [record, ...list])
    journal.logAudit({ action: action.label, target: record[cols[0][0]], targetModule: page, targetId: record.id, after: values.join(' / '), result: formValues.note ? `成功 · 备注：${formValues.note}` : '成功' })
    setShowForm(false); setFormValues({})
  }
  return <>
    {configurationNotes[page] && <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes[page][0]}</span><small>{configurationNotes[page][1]}</small></div></div>}
    <div className="admin-toolbar"><div className="admin-search"><Icon name="eye" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPageIndex(0) }} placeholder={`搜索${meta[0]}...`} /></div><select value={filter} onChange={(event) => { setFilter(event.target.value); setPageIndex(0) }}><option>全部状态</option>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select>{action && <button className="admin-btn primary" onClick={() => { setFormValues({}); setShowForm(true) }}><Icon name={action.icon} />{action.label}</button>}</div>
    <section className="admin-card table-card"><div className="table-top"><div><strong>{meta[0]}列表</strong><span>共 {filteredRows.length} 条</span></div><div className="table-actions"><button className="admin-btn subtle" onClick={() => exportCsv(meta[0], labels, filteredRows.map((row) => cols.map(([key]) => row[key])))}>导出 CSV</button></div></div><div className="table-wrap"><table><thead><tr>{labels.map((label) => <th key={label}>{label}</th>)}<th>操作</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} onClick={() => openRow(row)}>{cols.map(([key]) => <td key={key}>{statusValues.includes(row[key]) ? <Status>{page === 'publish' && (row.sourceModule === 'translations' || isVersionRelease(row)) && key === 'status' ? `模拟 · ${row[key]}` : row[key]}</Status> : <span>{row[key]}</span>}</td>)}<td><button className="row-action" onClick={(event) => { event.stopPropagation(); openRow(row) }}>查看详情</button></td></tr>)}</tbody></table>{!filteredRows.length && <div className="empty-state"><Icon name="eye" /><strong>没有匹配数据</strong><p>请调整搜索关键词或筛选条件。</p></div>}</div><Pager page={pageIndex} total={filteredRows.length} onChange={setPageIndex} /></section>
    {showForm && action && <EditDialog eyebrow="新建记录" title={action.title} onClose={() => setShowForm(false)} dirty={Object.values(formValues).some((value) => String(value).trim())} onSave={submitCreate} saveDisabled={!formComplete} saveLabel="保存记录" footNote={['activities','checkin','wheel'].includes(page)?'先建立活动记录；奖励配置仍在对应编辑窗口维护，不会自动创建新的奖励模块。':'保存记录并写入操作日志。'} tabs={[
      {id:'basic',label:'基本信息',content:<div className="form-grid">{action.fields.slice(0,2).map((field)=><label key={field}>{field}{field==='活动类型'?<select value={formValues[field]||''} onChange={(event)=>setFormValues((current)=>({...current,[field]:event.target.value}))}><option value="">请选择类型</option>{Object.keys(activityTypeMeta).map((type)=><option key={type}>{type}</option>)}</select>:<input value={formValues[field]||''} onChange={(event)=>setFormValues((current)=>({...current,[field]:event.target.value}))} placeholder={`请输入${field}（必填）`}/>}</label>)}</div>},
      {id:'configuration',label:page==='adminUsers'?'角色与范围':'配置内容',content:<div className="form-grid">{action.fields.slice(2).map((field)=><label key={field}>{field}{field==='活动类型'?<select value={formValues[field]||''} onChange={(event)=>setFormValues((current)=>({...current,[field]:event.target.value}))}><option value="">请选择类型</option>{Object.keys(activityTypeMeta).map((type)=><option key={type}>{type}</option>)}</select>:<input value={formValues[field]||''} onChange={(event)=>setFormValues((current)=>({...current,[field]:event.target.value}))} placeholder={`请输入${field}（必填）`}/>}</label>)}</div>},
      {id:'review',label:'提交预览',content:<><div className="editor-preview">{action.fields.map((field)=><p key={field}><strong>{field}：</strong>{formValues[field]||'未填写'}</p>)}</div><div className="form-grid"><label className="full">备注<textarea value={formValues.note||''} onChange={(event)=>setFormValues((current)=>({...current,note:event.target.value}))}/></label></div></>},
    ]}/>}
  </>
}

const versionSteps = [['上传版本', 1], ['自动检查', 2], ['测试环境', 3], ['审核发布', 4], ['生产环境', 5]]
const versionActiveStep = { uploads: 2, versions: 4, test: 3, production: 5 }

const OPERATOR = '运营管理员'
const todoPriorityRank = { '高': 0, '中': 1, '低': 2 }
const todoFilters = [['all', '全部'], ['mine', '我的待办'], ['open', '未关闭'], ['待处理', '待处理'], ['处理中', '处理中'], ['已解决', '已解决']]

// A todo is only useful if it can take you to the thing that needs doing, so every record carries a link target.
function describeTodo(record, store, { update, journal, navigate }) {
  const actions = []
  if (record.link) actions.push({ label: record.link.label || '去处理', tone: 'primary', run: () => navigate(record.link.page, { tab: record.link.tab, query: record.link.query, focusId: record.link.focusId }) })
  if (record.status === '待处理' || record.status === '待审核') actions.push({
    label: '认领并开始处理', keepOpen: true,
    run: () => {
      update('todo', (list) => list.map((t) => (t.id === record.id ? { ...t, status: '处理中', claimedBy: OPERATOR, owner: OPERATOR, time: '刚刚' } : t)))
      journal.logAudit({ action: '认领待办', target: record.title, targetModule: 'todo', targetId: record.id, before: record.status, after: '处理中' })
    },
  })
  if (record.status === '处理中') actions.push({
    label: '标记已解决', tone: 'warning', requireReason: true, reasonLabel: '填写处理结论（例如「已恢复运行」「已确认退款」），写入操作日志后关闭该事项',
    run: (reason) => {
      update('todo', (list) => list.map((t) => (t.id === record.id ? { ...t, status: '已解决', resolution: reason, time: '刚刚' } : t)))
      journal.logAudit({ action: '关闭待办', target: record.title, targetModule: 'todo', targetId: record.id, before: record.status, after: '已解决', result: `成功 · 处理结论：${reason}` })
    },
  })
  if (record.status !== '已解决' && !record.link) actions.push({
    label: '转交他人', tone: 'subtle', requireReason: true, reasonLabel: '填写接手的组或人，例如「财务组」', keepOpen: true,
    run: (reason) => {
      update('todo', (list) => list.map((t) => (t.id === record.id ? { ...t, owner: reason, claimedBy: '', status: '待处理', time: '刚刚' } : t)))
      journal.logAudit({ action: '转交待办', target: record.title, targetModule: 'todo', targetId: record.id, before: record.owner, after: reason })
    },
  })
  const linkedPublish = record.publishId ? store.publish.find((p) => p.id === record.publishId) : null
  return {
    id: `todo-${record.id}`, eyebrow: '待处理事项', title: record.title, status: record.status, actions,
    history: store.audit.filter((a) => a.targetModule === 'todo' && a.targetId === record.id),
    fields: [
      { key: 'source', label: '来源模块', value: record.source, readOnly: true },
      { key: 'priority', label: '优先级', value: record.priority, readOnly: true },
      { key: 'owner', label: '负责人', value: record.owner, readOnly: true },
      { key: 'claimedBy', label: '认领人', value: record.claimedBy || '尚未认领', readOnly: true },
      { key: 'time', label: '更新时间', value: record.time, readOnly: true },
      { key: 'target', label: '处理对象', value: record.link ? record.link.label : '无直接关联对象，需人工判断后处理', readOnly: true },
      { key: 'linked', label: '关联发布任务', value: linkedPublish ? `${linkedPublish.name} · ${linkedPublish.status}` : '—', readOnly: true },
      { key: 'resolution', label: '处理结论', value: record.resolution || '—', readOnly: true },
    ],
    hint: record.status === '已解决'
      ? '该事项已关闭，仅可查看；如需重新跟进，请在来源模块新建事项。'
      : '「去处理」直接跳到需要操作的对象；认领后事项归到你名下，处理完回到本页填写处理结论关闭。关联发布任务通过或驳回、游戏恢复运行时，事项会自动关闭。',
  }
}

function TodoPage({ store, update, journal, navigate, onOpen }) {
  const [filter, setFilter] = useState('open')
  const [query, setQuery] = useState('')
  const rows = store.todo
  const counts = {
    all: rows.length, mine: rows.filter((t) => t.owner === OPERATOR && t.status !== '已解决').length,
    open: rows.filter((t) => t.status !== '已解决').length,
    '待处理': rows.filter((t) => t.status === '待处理' || t.status === '待审核').length,
    '处理中': rows.filter((t) => t.status === '处理中').length,
    '已解决': rows.filter((t) => t.status === '已解决').length,
  }
  const filtered = rows
    .filter((t) => (filter === 'all' ? true : filter === 'mine' ? t.owner === OPERATOR && t.status !== '已解决' : filter === 'open' ? t.status !== '已解决' : filter === '待处理' ? (t.status === '待处理' || t.status === '待审核') : t.status === filter))
    .filter((t) => `${t.title} ${t.source} ${t.owner}`.toLowerCase().includes(query.toLowerCase()))
    .slice()
    .sort((a, b) => (todoPriorityRank[a.priority] ?? 3) - (todoPriorityRank[b.priority] ?? 3))
  const goHandle = (record) => record.link && navigate(record.link.page, { tab: record.link.tab, query: record.link.query, focusId: record.link.focusId })
  const open = (record) => onOpen((live) => { const fresh = live.todo.find((t) => t.id === record.id); return fresh ? describeTodo(fresh, live, { update, journal, navigate }) : null })
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>事项状态的含义</strong><span>待处理 = 尚无人认领；待审核 = 等待关联配置审核；处理中 = 已认领，认领人显示在负责人列；已解决 = 人工填写结论或关联流程自动完成。</span><small>「去处理」跳转到关联的游戏、发布任务、订单、玩家或人工调整流水。发布通过或驳回、游戏恢复运行、人工调整模拟复核完成时，对应事项会自动关闭。</small></div></div>
    <div className="todo-filter-bar">{todoFilters.map(([id, label]) => <button key={id} className={filter === id ? 'is-active' : ''} onClick={() => setFilter(id)}>{label}<b>{counts[id]}</b></button>)}</div>
    <div className="admin-toolbar"><div className="admin-search"><Icon name="eye" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索事项、来源模块或负责人..." /></div></div>
    <section className="admin-card table-card"><div className="table-top"><div><strong>事项列表</strong><span>共 {filtered.length} 条 · 按优先级排序</span></div><button className="admin-btn subtle" onClick={() => exportCsv('待处理事项', ['事项', '来源模块', '优先级', '状态', '负责人', '更新时间', '处理结论'], filtered.map((t) => [t.title, t.source, t.priority, t.status, t.owner, t.time, t.resolution || '']))}>导出 CSV</button></div>
      <div className="table-wrap"><table><thead><tr><th>优先级</th><th>事项</th><th>来源模块</th><th>状态</th><th>负责人</th><th>更新时间</th><th>操作</th></tr></thead><tbody>{filtered.map((t) => <tr key={t.id} onClick={() => open(t)} className={t.status === '已解决' ? 'is-hidden-row' : ''}>
        <td><span className={`todo-dot ${t.priority === '高' ? 'danger' : t.priority === '中' ? 'warning' : ''}`} />{t.priority}</td>
        <td><strong>{t.title}</strong>{t.resolution && <small className="todo-resolution">结论：{t.resolution}</small>}</td>
        <td>{t.source}</td><td><Status>{t.status}</Status></td><td>{t.owner}{t.claimedBy && t.claimedBy !== t.owner ? ` · ${t.claimedBy}` : ''}</td><td>{t.time}</td>
        <td><span className="row-action-group">{t.link && t.status !== '已解决' && <button className="row-action strong" onClick={(event) => { event.stopPropagation(); goHandle(t) }}>去处理</button>}<button className="row-action" onClick={(event) => { event.stopPropagation(); open(t) }}>详情</button></span></td>
      </tr>)}</tbody></table>{!filtered.length && <div className="empty-state"><Icon name="eye" /><strong>没有符合条件的事项</strong><p>切换筛选条件或清空搜索关键词。</p></div>}</div>
    </section>
  </>
}

function VersionWorkflowPage({ page, onOpen, store, update, journal, navigate }) {
  const rows = store[page] || []
  const [query, setQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ game: games[0]?.name || '', version: '', build: '', fileName: '', note: '' })
  const isUpload = page === 'uploads'
  const labels = columns[page].map(([, label]) => label)
  const action = isUpload ? { label: '上传新版本', title: '上传游戏版本', icon: 'bolt' } : page === 'versions' ? actionConfig.versions : page === 'test' ? { label: '发布到测试环境', title: '发布到测试环境', icon: 'shield' } : { label: '发起生产发布', title: '发起生产发布', icon: 'bolt' }
  const openUpload = () => { setForm({ game: games[0]?.name || '', version: '', build: '', fileName: '', note: '' }); setShowUpload(true) }
  const formComplete = form.version.trim() && form.build.trim() && (!isUpload || form.fileName)
  const save = () => {
    const record = isUpload
      ? { id: `uploads-${stamp()}`, recordId: `UP-${stamp().slice(0, 8)}`, game: form.game, version: form.version.trim(), bundle: `${form.game} ${form.version.trim()}`, file: form.fileName, status: '检查中', uploader: '运营管理员', time: '刚刚' }
      : page === 'versions' ? { id: `versions-${stamp()}`, game: form.game, version: `${form.version.trim()} · ${form.build.trim()}`, production: '—', status: '待审核', scope: '生产环境', time: '刚刚' }
        : { id: `${page}-${stamp()}`, game: form.game, version: `${form.game} ${form.version.trim()}`, build: form.build.trim(), env: page === 'test' ? '测试环境' : '生产环境', status: page === 'test' ? '测试中' : '待审核', metric: page === 'test' ? '待 QA 验证' : '待审核', time: '刚刚' }
    update(page, (list) => [record, ...list])
    journal.logAudit({ action: action.label, target: record.bundle || `${record.game || record.version}`, targetModule: page, targetId: record.id, after: `${form.game} ${form.version.trim()} / ${form.build.trim()}`, result: form.note ? `成功 · 发布说明：${form.note}` : '成功' })
    if (page === 'versions' || page === 'production') journal.queuePublish({ name: `${form.game} ${form.version.trim()} 生产发布`, type: '游戏版本', scope: '生产环境', sourceModule: page, sourceId: record.id, note: form.note, todoSource: '游戏运营' })
    setShowUpload(false)
  }
  const openRow = (record) => {
    const { label0, history, actions } = describeGeneric(page, record, store, { update, journal })
    const release = store.publish.find((item) => item.sourceModule === page && item.sourceId === record.id && item.status !== '已作废')
    if (release) actions.push({ label: '查看统一发布审核', run: () => navigate('publish', { focusId: release.id }) })
    else if (page === 'versions' && record.status === '待审核') actions.push({ label: '创建模拟审核任务', run: () => journal.queuePublish({ name: `${record.game} ${record.version} 生产发布（模拟）`, type: '游戏版本', scope: '原型会话', sourceModule: page, sourceId: record.id, todoSource: '游戏运营' }) })
    onOpen({ id: `${page}-${record.id}`, eyebrow: `${pageMeta[page][0]}详情（模拟，未部署）`, title: label0, status: record.status, history, actions, fields: columns[page].filter(([key]) => key !== 'status').map(([key, label]) => ({ key, label, value: record[key], readOnly: true })) })
  }
  const filtered = rows.filter((row) => columns[page].some(([key]) => `${row[key]}`.toLowerCase().includes(query.toLowerCase())))
  const scopeIsEnv = page === 'test' || page === 'production'
  const scopeLabel = page === 'test' ? '测试环境' : page === 'production' ? '生产环境' : '全部环境'
  const scopeNote = page === 'test' ? '测试环境允许反复部署，不产生真实订单和资产变化。' : page === 'production' ? '生产操作需要发布权限和审批，发布前必须存在可回滚版本。' : '版本记录与上传记录跨环境展示，具体发布范围以每条记录的发布范围字段为准，与页面右上角的环境切换无关。'
  const active = versionActiveStep[page]
  return <>
    <div className="workflow-strip">{versionSteps.map(([label, step], index) => <span key={label} style={{ display: 'contents' }}>{index > 0 && <i />}<div className={`workflow-step ${step < active ? 'done' : step === active ? 'active' : ''}`}><b>{step}</b><span>{label}</span></div></span>)}</div>
    <div className="environment-note"><Icon name="shield" /><span><strong>当前查看：{scopeLabel}</strong><small>{scopeNote}</small></span></div>
    <div className="admin-toolbar"><div className="admin-search"><Icon name="eye" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`搜索${pageMeta[page][0]}...`} /></div><button className="admin-btn primary" onClick={openUpload}><Icon name={action.icon || 'play'} />{action.label}</button></div>
    <section className="admin-card table-card"><div className="table-top"><div><strong>{pageMeta[page][0]}列表</strong><span>{scopeIsEnv ? `当前环境：${scopeLabel}` : '跨环境记录'} · 共 {filtered.length} 条</span></div><button className="admin-btn subtle" onClick={() => exportCsv(pageMeta[page][0], labels, filtered.map((row) => columns[page].map(([key]) => row[key])))}>导出 CSV</button></div><div className="table-wrap"><table><thead><tr>{labels.map((label) => <th key={label}>{label}</th>)}<th>操作</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} onClick={() => openRow(row)}>{columns[page].map(([key]) => <td key={key}>{statusValues.includes(row[key]) ? <Status>{row[key]}</Status> : <span>{row[key]}</span>}</td>)}<td><button className="row-action" onClick={(event) => { event.stopPropagation(); openRow(row) }}>查看详情</button></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state"><Icon name="eye" /><strong>没有匹配数据</strong><p>请调整搜索关键词。</p></div>}</div></section>
    {showUpload && <EditDialog eyebrow="版本发布流程" title={action.title} onClose={()=>setShowUpload(false)} dirty={Boolean(form.version||form.build||form.fileName||form.note||form.game!==games[0]?.name)} onSave={save} saveDisabled={!formComplete} saveLabel={isUpload?'记录上传并进入检查':'保存发布任务'} footNote="原型只记录版本任务，实际上传及自动检查服务尚未接入。" tabs={[
      {id:'version',label:'版本信息',content:<div className="form-grid"><label>选择游戏<select value={form.game} onChange={(event)=>setForm((current)=>({...current,game:event.target.value}))}>{games.map((game)=><option key={game.id} value={game.name}>{game.name}</option>)}</select></label><label>版本号（必填）<input value={form.version} onChange={(event)=>setForm((current)=>({...current,version:event.target.value}))}/></label><label>构建号（必填）<input value={form.build} onChange={(event)=>setForm((current)=>({...current,build:event.target.value}))}/></label></div>},
      {id:'delivery',label:isUpload?'文件与说明':'发布说明',content:<div className="form-grid">{isUpload&&<label className="full">上传版本包（必填）<input type="file" onChange={(event)=>setForm((current)=>({...current,fileName:event.target.files?.[0]?`${event.target.files[0].name} · ${(event.target.files[0].size/1048576).toFixed(1)} MB`:''}))}/></label>}<label className="full">发布说明<textarea value={form.note} onChange={(event)=>setForm((current)=>({...current,note:event.target.value}))}/></label></div>},
      {id:'review',label:'检查与预览',content:<div className="editor-preview"><p>{form.game} · {form.version||'未填写版本'} · {form.build||'未填写构建号'}</p><p>{form.fileName}</p><p>文件完整性、入口文件、资源类型、版本号及路径安全应由服务端校验；原型由操作员在记录上手动标记结果。</p></div>},
    ]}/>}
  </>
}

function GameVersionCenterPage({ onOpen, store, update, journal, navigate }) {
  const [tab, setTab] = useState('versions')
  const tabs = [['versions', '版本记录'], ['uploads', '上传记录'], ['test', '测试环境'], ['production', '生产环境']]
  return <>
    <div className="catalog-toolbar"><div className="view-toggle">{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div></div>
    <p className="editor-hint">版本审核统一在发布审核中操作；本页仅同步原型状态，上传、部署和生产流量均未接入。</p><VersionWorkflowPage key={tab} page={tab} onOpen={onOpen} store={store} update={update} journal={journal} navigate={navigate} />
  </>
}

function ReleaseCenterPage({ onOpen, store, update, journal, navigate, intent }) {
  const pending = store.publish.filter((p) => p.status === '待审核').length
  const testing = store.test.filter((t) => t.status === '测试中').length
  const graying = store.publish.filter((p) => p.sourceModule !== 'translations' && (p.status === '灰度 20%' || p.status === '进行中')).length
  const published = store.publish.filter((p) => p.sourceModule !== 'translations' && p.status === '已发布').length
  return <>
    <div className="release-metrics"><div><span>待审核</span><strong>{pending}</strong><small>需要人工判定</small></div><div><span>测试中</span><strong>{testing}</strong><small>需要 QA 验证</small></div><div><span>灰度发布</span><strong>{graying}</strong><small>不含文案模拟审核</small></div><div><span>生产发布</span><strong>{published}</strong><small>不含文案模拟审核</small></div></div>
    <section className="admin-card release-guide"><div className="card-heading"><div><h2>发布任务流程</h2><p>带快照的任务：通过 = 覆盖生效版本；驳回 = 丢弃来源草稿；回滚 = 恢复上一生效版本。</p></div><span className="release-safety"><Icon name="shield" />生产发布需审批</span></div><div className="release-guide-steps"><div className="is-done"><b>1</b><span>创建任务</span><small>模块保存草稿</small></div><i /><div className="is-done"><b>2</b><span>自动检查</span><small>通过时再次校验快照</small></div><i /><div className="is-active"><b>3</b><span>审核判定</span><small>通过 / 灰度 / 驳回</small></div><i /><div><b>4</b><span>已发布</span><small>可暂停或回滚</small></div></div></section>
    <GenericPage page="publish" onOpen={onOpen} store={store} update={update} journal={journal} navigate={navigate} intent={intent} />
    <section className="admin-card release-history"><div className="card-heading"><div><h2>版本健康度 <em className="sample-tag">示例数据</em></h2><p>发布后的实时质量观察，监控接口待联调</p></div><button className="admin-link" disabled title="监控平台待联调">查看监控（待联调）</button></div><div className="health-grid"><div><span>启动成功率</span><strong>99.6%</strong><em>↑ 0.8%</em></div><div><span>资源加载失败</span><strong>0.12%</strong><em>↓ 0.04%</em></div><div><span>累计回滚</span><strong>{store.publish.filter((p) => p.status === '已回滚').length}</strong><em>来自发布审核记录</em></div></div></section>
  </>
}

const roleFieldLabels = [['menuScope', '菜单范围'], ['actions', '可执行操作'], ['prodPermission', '生产权限']]
function describeRole(record, store, { update, journal }) {
  return {
    editSections: [{id:'menus',label:'菜单范围',keys:['role','menuScope']},{id:'actions',label:'操作权限',keys:['actions']},{id:'environment',label:'生产权限',keys:['prodPermission']}],
    id: `roles-${record.id}`, eyebrow: '角色权限详情', title: record.role,
    history: store.audit.filter((a) => a.targetModule === 'roles' && a.targetId === record.id),
    fields: [
      { key: 'menuScope', label: '菜单范围', value: record.menuScope, type: 'checks', options: navGroups.map((g) => [g.title, g.title]) },
      { key: 'actions', label: '可执行操作', value: record.actions, type: 'checks', options: ['创建', '编辑', '测试发布', '上传', '排序', '审核', '驳回', '退款', '对账', '查看差异'].map((v) => [v, v]) },
      { key: 'prodPermission', label: '生产权限', value: record.prodPermission, type: 'select', options: ['生产只读', '生产需审批', '生产可操作', '不可直接发布'] },
    ],
    validate: (draft) => (!(draft.menuScope || []).length ? ['至少保留一个菜单范围'] : []),
    onSave: (draft) => { update('roles', (list) => list.map((r) => (r.id === record.id ? { ...r, ...draft } : r))); journal.logAudit({ action: '编辑角色权限', target: record.role, targetModule: 'roles', targetId: record.id, after: diffSummary(record, draft, roleFieldLabels) }) },
    saveLabel: '保存权限',
  }
}

function AdminUsersPage({ onOpen, store, update, journal, navigate }) {
  const openRoleRow = (record) => onOpen(describeRole(record, store, { update, journal }))
  return <><section className="admin-card permission-summary"><div><span>后台账号</span><strong>{store.adminUsers.length}</strong><small>启用 {store.adminUsers.filter((row) => row.status === '启用').length} · 待激活 {store.adminUsers.filter((row) => row.status === '待激活').length}</small></div><div><span>角色数量</span><strong>{store.roles.length}</strong><small>全部为自定义角色</small></div><div><span>MFA 覆盖率</span><strong>{Math.round((store.adminUsers.filter((u) => u.mfa).length / store.adminUsers.length) * 100)}%</strong><small>{store.adminUsers.filter((u) => !u.mfa).length} 个账号需处理</small></div><div><span>生产可操作角色</span><strong>{store.roles.filter((r) => r.prodPermission === '生产可操作').length}</strong><small>权限拦截待二期接入</small></div></section><section className="admin-card permission-matrix"><div className="card-heading"><div><h2>角色权限摘要</h2><p>菜单权限、操作权限和环境权限分开控制，点击任意角色可编辑。</p></div></div><div className="permission-table"><div className="permission-row permission-head"><span>角色</span><span>菜单范围</span><span>操作权限</span><span>生产权限</span></div>{store.roles.map((row) => <button className="permission-row" key={row.id} onClick={() => openRoleRow(row)}><span>{row.role}</span><span>{row.menuScope.join(' / ')}</span><span>{row.actions.join('、')}</span><span>{row.prodPermission}</span></button>)}</div></section><GenericPage page="adminUsers" onOpen={onOpen} store={store} update={update} journal={journal} navigate={navigate} /></>
}

function WinsPage({ store }) {
  const [tab, setTab] = useState('rank')
  const rankings = useMemo(() => aggregateWinnerRankings(store.winEvents), [store.winEvents])
  const events = store.winEvents
  const chest = [...store.chestOpenings].sort((a, b) => b.rewardCoins - a.rewardCoins || a.id.localeCompare(b.id))
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>本页只读</strong><span>{configurationNotes.wins[0]}</span><small>{configurationNotes.wins[1]}</small></div></div>
    <div className="readonly-banner"><Icon name="lock" /><div><strong>榜单数据由风控与内容审核系统管理，本后台不提供隐藏、置顶或调整名次的操作。</strong><span>这里用于核对前台展示结果：某条中奖若需下架，请在对应系统处理，处理后本页与前台会一起变化。</span></div><span className="readonly-meta">数据来源：中奖事件服务 · 更新于刚刚</span></div>
    <div className="catalog-toolbar"><div className="view-toggle"><button className={tab === 'rank' ? 'is-active' : ''} onClick={() => setTab('rank')}>大厅赢家榜与最近中奖</button><button className={tab === 'chest' ? 'is-active' : ''} onClick={() => setTab('chest')}>明日宝箱幸运榜单</button></div><span className="drag-hint"><Icon name="eye" />共 {events.length} 条中奖事件 · {chest.length} 条开箱事件</span></div>
    {tab === 'rank' ? <>
      <section className="admin-card table-card"><div className="table-top"><div><strong>今日赢家榜</strong><span>按累计中奖金币排序，代表游戏取最近一次事件；前台固定展示前 10 名</span></div><button className="admin-btn subtle" onClick={() => exportCsv('今日赢家榜', ['排名', '玩家昵称', '代表游戏', '累计中奖金币'], rankings.slice(0, 10).map((r, i) => [i + 1, r.name, gameName(r.gameId), r.coins]))}>导出 CSV</button></div><div className="table-wrap"><table><thead><tr><th>排名</th><th>玩家昵称</th><th>代表游戏</th><th>累计中奖金币</th></tr></thead><tbody>{rankings.slice(0, 10).map((r, i) => <tr key={r.playerId}><td>{i + 1}</td><td>{r.name}</td><td>{gameName(r.gameId)}</td><td>{r.coins.toLocaleString('en-US')}</td></tr>)}</tbody></table>{!rankings.length && <div className="empty-state"><Icon name="eye" /><strong>今日暂无中奖事件</strong></div>}</div></section>
      <section className="admin-card table-card"><div className="table-top"><div><strong>最近中奖</strong><span>按事件时间倒序，事件 ID 唯一；榜单聚合、最近中奖与前台弹幕共用这一份事件</span></div><button className="admin-btn subtle" onClick={() => exportCsv('最近中奖', ['事件 ID', '玩家昵称', '游戏', '中奖金币'], events.map((e) => [e.id, e.name, gameName(e.gameId), e.coins]))}>导出 CSV</button></div><div className="table-wrap"><table><thead><tr><th>事件 ID</th><th>玩家昵称</th><th>游戏</th><th>中奖金币</th></tr></thead><tbody>{events.map((e) => <tr key={e.id}><td>{e.id}</td><td>{e.name}</td><td>{gameName(e.gameId)}</td><td>{e.coins.toLocaleString('en-US')}</td></tr>)}</tbody></table></div></section>
    </> : <section className="admin-card table-card"><div className="table-top"><div><strong>明日宝箱幸运榜单</strong><span>按奖励金币降序；前台固定展示前 5 名</span></div><button className="admin-btn subtle" onClick={() => exportCsv('宝箱幸运榜', ['位次', '玩家昵称', '中奖金币'], chest.map((c, i) => [i + 1, c.name, c.rewardCoins]))}>导出 CSV</button></div><div className="table-wrap"><table><thead><tr><th>榜单位次</th><th>玩家昵称</th><th>中奖金币</th><th>是否进入前台榜单</th></tr></thead><tbody>{chest.map((c, i) => <tr key={c.id}><td>{i + 1}</td><td>{c.name}</td><td>{c.rewardCoins.toLocaleString('en-US')}</td><td>{i < 5 ? <Status>已展示</Status> : <span className="admin-status neutral"><i />未进入前 5</span>}</td></tr>)}</tbody></table></div></section>}
  </>
}

// ---- geographic scope picker ----------------------------------------------
// Continent first, then drill into countries. A continent row is tri-state: all,
// some, or none. Selecting a continent selects every country in it; unticking a
// few countries afterwards is how "the whole continent except these" is expressed.
function RegionPicker({ value, onChange, label = '可用地区' }) {
  const scope = normalizeRegion(value)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('')
  const groups = regionByContinent(scope, countryContinent, continents.map((c) => c.code))
  const nameOf = (code) => countryName(code, 'zh-Hans')
  const continentLabel = (code) => CONTINENT_NAMES[code] ?? code

  const setCountries = (next) => onChange({ mode: REGION_CUSTOM, countries: [...new Set(next)].sort() })
  const toggleContinent = (group) => {
    const all = countriesOf(group.continent)
    const base = scope.mode === REGION_ALL ? [] : scope.countries
    setCountries(group.state === 'all' ? base.filter((c) => !all.includes(c)) : [...base, ...all])
  }
  const toggleCountry = (code) => {
    const base = scope.mode === REGION_ALL ? [] : scope.countries
    setCountries(base.includes(code) ? base.filter((c) => c !== code) : [...base, code])
  }

  return <div className="region-picker">
    <div className="region-mode">
      <button type="button" className={scope.mode === REGION_ALL ? 'is-active' : ''} onClick={() => onChange({ mode: REGION_ALL, countries: [] })}>全球开放</button>
      <button type="button" className={scope.mode === REGION_CUSTOM ? 'is-active' : ''} onClick={() => onChange({ mode: REGION_CUSTOM, countries: scope.countries })}>指定国家/地区</button>
      <span className="region-summary">{regionSummary(scope, countryContinent, continents.map((c) => c.code), continentLabel)}</span>
    </div>
    {scope.mode === REGION_CUSTOM && <>
      <div className="region-search"><Icon name="eye" /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="搜索国家/地区名称或代码..." /></div>
      <div className="region-continents">{groups.map((group) => {
        const all = countriesOf(group.continent)
        const shown = filter
          ? all.filter((c) => `${nameOf(c)} ${c}`.toLowerCase().includes(filter.toLowerCase()))
          : all
        if (filter && !shown.length) return null
        const open = expanded === group.continent || (filter && shown.length)
        return <div className={`region-continent state-${group.state}`} key={group.continent}>
          <div className="region-continent-head">
            <button type="button" className="region-check" onClick={() => toggleContinent(group)} aria-label={`全选或取消${continentLabel(group.continent)}`}>
              {group.state === 'all' ? '✓' : group.state === 'some' ? '–' : ''}
            </button>
            <button type="button" className="region-continent-name" onClick={() => setExpanded(open && !filter ? null : group.continent)}>
              {continentLabel(group.continent)}
              <small>{group.selected.length} / {group.total}</small>
              <Icon name={open ? 'chevronLeft' : 'chevronRight'} />
            </button>
          </div>
          {open && <div className="region-countries">{shown.map((code) => <label key={code} className={scope.countries.includes(code) ? 'is-on' : ''}>
            <input type="checkbox" checked={scope.countries.includes(code)} onChange={() => toggleCountry(code)} />
            <span>{nameOf(code)}</span><small>{code}</small>
          </label>)}</div>}
        </div>
      })}</div>
      <p className="region-hint">未勾选的国家/地区一律不开放——这是白名单，不是黑名单。「整个洲除某几国」的做法是先勾选该洲，再取消那几个国家。{label}留空会导致所有玩家都看不到，保存时会被拦截。</p>
    </>}
  </div>
}

function RewardConfigPage({ moduleId, onOpen, store, update, journal, navigate }) {
  const [editing, setEditing] = useState(false)
  const [preview, setPreview] = useState('live')
  const differs = draftDiffers(store, moduleId)
  const config = getSlice(preview === 'draft' && differs ? store : store.live, moduleId)
  const labels = { checkin: '签到奖励', wheel: '幸运转盘', missions: '每日任务' }
  const save = (snapshot) => {
    if (validateSnapshot(moduleId, snapshot).length) return
    const before = getSlice(store, moduleId)
    journal.transform((current) => setSlice(current, moduleId, snapshot))
    journal.logAudit({ action: `保存${labels[moduleId]}草稿`, target: labels[moduleId], targetModule: moduleId, targetId: moduleId, after: snapshotDiff(moduleId, before, snapshot).filter((row) => row.changed).map((row) => `${row.label}: ${row.before} → ${row.after}`).join('；') })
    journal.queuePublish({ name: `${labels[moduleId]}配置更新${moduleId === 'wheel' ? ` v${snapshot.wheelVersion}` : ''}`, type: '活动版本', scope: '生产环境', sourceModule: moduleId, sourceId: moduleId === 'wheel' ? 'main' : moduleId === 'checkin' ? 'ladder' : 'all', snapshot, todoSource: '活动中心' })
    setEditing(false); setPreview('draft')
  }
  const wheelRows = store.wheel.map((row,index) => index === 0 ? { ...row, prizeCount: `${store.live.wheelPrizes.length} 个奖项`, freeSpins: `${store.live.wheelFreeSpins} 次 / 日`, version: `v${store.live.wheelVersion}`, probabilityState: wheelBalanced(store.live.wheelPrizes) ? '概率已校验' : '概率未通过' } : row)
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>配置规则</strong><span>{configurationNotes[moduleId][0]}</span><small>{configurationNotes[moduleId][1]}</small></div></div>
    <ConfigBadge store={store} moduleId={moduleId} onDiscard={() => journal.discardDraft(moduleId)} />
    <section className="admin-card"><div className="card-heading"><div><h2>{labels[moduleId]}</h2><p>页面仅预览。点击编辑，在弹窗内修改和检查效果。</p></div><button className="admin-btn primary" onClick={() => setEditing(true)}>编辑{labels[moduleId]}</button></div>
      <PreviewVersionSwitch value={preview} onChange={setPreview} hasDraft={differs} />
      {moduleId === 'checkin' && <CheckinPreview days={config.checkinDays} />}
      {moduleId === 'wheel' && <WheelPreview prizes={config.wheelPrizes} freeSpins={config.wheelFreeSpins} />}
      {moduleId === 'missions' && <><MissionsPreview missions={config.missions} />{config.missions.filter((item) => item.status === '生效中').length !== liteContent.events.dailyMissionCount && <p className="editor-hint">当前预览的生效任务数量与基线 {liteContent.events.dailyMissionCount} 个不同，请在编辑时核对。</p>}</>}
    </section>
    {moduleId !== 'missions' && <GenericPage page={moduleId} onOpen={onOpen} store={moduleId === 'wheel' ? {...store,wheel:wheelRows} : store} update={update} journal={journal} navigate={navigate} />}
    {editing && <ActivityRewardDialog moduleId={moduleId} store={store} onSave={save} onClose={() => setEditing(false)} />}
  </>
}
function CheckinPage(props) { return <RewardConfigPage {...props} moduleId="checkin" /> }
function WheelPage(props) { return <RewardConfigPage {...props} moduleId="wheel" /> }
function MissionsPage(props) { return <RewardConfigPage {...props} moduleId="missions" /> }

// ---- 多语言内容 -----------------------------------------------------------
// 管理的是玩家侧文案；后台界面本身是中文，不参与翻译。
const SOURCE_LOCALE = 'zh-Hans'
const FALLBACK = 'en'

function TranslationsPage({ store, journal, intent }) {
  const entries = store.translations
  const reviews = store.translationReviews
  const liveEntries = store.live.translations
  const keys = useMemo(() => Object.keys(entries).sort(), [entries])
  const [namespace, setNamespace] = useState('all')
  const [locale, setLocale] = useState('zh-Hant')
  const [statusFilter, setStatusFilter] = useState('all')
  const [onlyChanged, setOnlyChanged] = useState(false)
  const [query, setQuery] = useState(intent?.query || '')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(intent?.query && entries[intent.query] ? intent.query : null)
  const [importPreview, setImportPreview] = useState(null)
  const [importPage, setImportPage] = useState(0)
  const [reading, setReading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [confirmReviewed, setConfirmReviewed] = useState(false)
  const readSequence = useRef(0)
  useEffect(() => () => { readSequence.current += 1 }, [])
  const needsReview = (key, code = locale) => needsTranslationReview(entries[key], reviews?.[key], code)
  const namespaces = useMemo(() => [...new Set(keys.map(translationNamespace))].sort(), [keys])
  const coverage = useMemo(() => translationLocales.map(({ code, nativeName }) => {
    const done = keys.filter((key) => String(entries[key][code] ?? '').trim()).length
    const pending = keys.filter((key) => needsTranslationReview(entries[key], reviews?.[key], code)).length
    return { code, nativeName, done, pending, total: keys.length, percent: keys.length ? Math.round((done / keys.length) * 100) : 0 }
  }), [entries, reviews, keys])
  const isChanged = (key) => JSON.stringify(entries[key]) !== JSON.stringify(liveEntries[key]) || JSON.stringify(reviews?.[key]) !== JSON.stringify(store.live.translationReviews?.[key])
  const filtered = keys.filter((key) => {
    if (namespace !== 'all' && translationNamespace(key) !== namespace) return false
    if (statusFilter === 'missing' && String(entries[key][locale] ?? '').trim()) return false
    if (statusFilter === 'review' && !needsReview(key)) return false
    if (onlyChanged && !isChanged(key)) return false
    if (query && !`${key} ${entries[key][SOURCE_LOCALE] ?? ''} ${entries[key][FALLBACK] ?? ''} ${entries[key][locale] ?? ''}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })
  const pageIndex = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1))
  const visible = filtered.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE)
  const differs = draftDiffers(store, 'translations')
  const errors = validateTranslations(entries)
  const reviewErrors = translationReviewErrors(entries, reviews)
  const activeMeta = translationLocales.find((l) => l.code === locale)
  const displayLocales = [...new Set([SOURCE_LOCALE, FALLBACK, locale])].map((code) => translationLocales.find((l) => l.code === code))
  const selectLocale = (value) => { setLocale(value); setPage(0); setFeedback(null) }
  const saveEntry = (key) => (next, confirmed = []) => {
    journal.transform((current) => {
      const nextEntries = { ...current.translations, [key]: next }
      return { ...current, translations: nextEntries, translationReviews: updateTranslationReviews(current.translationReviews, current.translations, nextEntries, { [key]: confirmed }) }
    })
    const changed = translationLocales.filter(({ code }) => (next[code] ?? '') !== (entries[key][code] ?? '')).map(({ code }) => code)
    journal.logAudit({ action: '编辑或复核文案（会话草稿）', target: key, targetModule: 'translations', targetId: key,
      before: changed.map((c) => `${c}=${entries[key][c] || '空'}`).join('；'), after: `${changed.map((c) => `${c}=${next[c] || '空'}`).join('；')}${confirmed.length ? `；确认复核：${confirmed.join('、')}` : ''}` })
    setFeedback({ message: '已保存到会话草稿。可继续翻译或导出保留成果；刷新页面会重置。' })
  }
  const saveDraft = () => {
    if (errors.length || reviewErrors.length) return
    journal.logAudit({ action: '提交文案模拟审核', target: '玩家侧文案', targetModule: 'translations', targetId: 'all', after: `${keys.length} 条文案，含复核状态` })
    journal.queuePublish({ name: '玩家侧文案更新（模拟）', type: '内容版本', scope: '原型会话', sourceModule: 'translations', sourceId: 'all', snapshot: getSlice(store, 'translations'), todoSource: '内容与语言' })
    setFeedback({ message: '已提交模拟审核，可前往「发布审核」查看具体差异。游戏说明通过审核后可在同浏览器的目录预览查看，不更新真实服务。' })
  }
  const exportCurrent = () => {
    const file = buildTranslationFile(entries, filtered, locale)
    downloadCsv(`玩家侧文案-${locale}-${filtered.length}条`, serializeTranslationFile(file))
    setFeedback({ message: `已发起导出 ${activeMeta.nativeName}（${locale}）共 ${filtered.length} 条，包含所有匹配页。只改文件中的「操作」与「译文」，其余列保留。` })
  }
  const prepareImport = async (file) => {
    const sequence = ++readSequence.current
    const targetLocale = locale
    setFeedback(null)
    if (file.size > 4 * 1024 * 1024) { setFeedback({ error: true, message: '文件超过 4 MB，请按命名空间分批导入。' }); return }
    setReading(true)
    try {
      const text = await file.text()
      if (sequence !== readSequence.current) return
      const preview = previewTranslationImport(text, entries, targetLocale)
      setImportPreview({ ...preview, fileName: file.name, targetLocale })
      setConfirmReviewed(false)
      setImportPage(0)
    } catch {
      if (sequence === readSequence.current) setFeedback({ error: true, message: '无法读取文件，请重新选择 UTF-8 CSV 文件。' })
    } finally {
      if (sequence === readSequence.current) setReading(false)
    }
  }
  const reviewedRows = importPreview?.rows.filter((row) => ['changed', 'unchanged'].includes(row.status) && String(row.after ?? '').trim()) ?? []
  const pendingConfirmations = reviewedRows.filter((row) => needsReview(row.key, importPreview.targetLocale))
  const commitImport = () => {
    if (!importPreview || importPreview.errors.length || importPreview.targetLocale !== locale || (pendingConfirmations.length && !confirmReviewed)) return
    const result = applyTranslationImport(entries, importPreview, importPreview.targetLocale)
    if (result.errors.length) {
      setImportPreview({ ...importPreview, errors: result.errors })
      return
    }
    const confirmed = Object.fromEntries(reviewedRows.map((row) => [row.key, [importPreview.targetLocale]]))
    journal.transform((current) => {
      const checked = applyTranslationImport(current.translations, importPreview, importPreview.targetLocale)
      if (checked.errors.length) return current
      return { ...current, translations: checked.entries, translationReviews: updateTranslationReviews(current.translationReviews, current.translations, checked.entries, confirmed) }
    })
    journal.logAudit({ action: '导入翻译（会话草稿）', target: `${activeMeta.nativeName}（${locale}）`, targetModule: 'translations', targetId: locale,
      after: `更新 ${importPreview.counts.changed} 条；复核 ${pendingConfirmations.length} 条；跳过 ${importPreview.counts.skipped} 条` })
    setFeedback({ message: `导入完成：更新 ${importPreview.counts.changed} 条、复核 ${pendingConfirmations.length} 条、跳过 ${importPreview.counts.skipped} 条。仅写入会话草稿，可导出保留成果。` })
    setImportPreview(null)
  }

  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>文案管理 · 原型会话</strong><span>{configurationNotes.translations[0]}</span><small>{configurationNotes.translations[1]}</small></div></div>
    <details className="admin-card translation-guide"><summary>翻译工作流程与文件填写说明</summary>
      <ol><li>选择目标语言与文案范围：全部、未翻译或待复核；可按命名空间与关键词缩小范围。</li><li>导出当前筛选结果，交给译者。只改「操作」与「译文」：操作填「填写」；留空译文会跳过。需要删除已有译文时，将操作改成「清空」并留空译文。</li><li>导回同一语言，查看每条新旧文案及校验结果。键、语言、版本冲突或占位符错误会阻止整批导入；请修正文件或重新导出。</li><li>导入仅更新会话草稿。完成待复核文案后提交模拟审核；当前不连接玩家端发布，刷新前请导出保留工作成果。</li></ol>
      <p>简体中文用于维护原文；英文同时承担兜底，不能为空。原文或英文改变会让相关已有译文进入待复核。新版文件带基准快照，旧五列 CSV 请重新导出并迁移译文。</p>
    </details>
    <ConfigBadge store={store} moduleId="translations" onDiscard={() => journal.discardDraft('translations')} />
    {feedback && <div className={`admin-config-note${feedback.error ? ' danger' : ''}`} role={feedback.error ? 'alert' : 'status'}><Icon name={feedback.error ? 'bolt' : 'shield'} /><div><span>{feedback.message}</span></div></div>}
    <section className="admin-card"><div className="card-heading"><div><h2>翻译覆盖率</h2><p>共 {keys.length} 条文案 · {translationLocales.length} 种语言。百分比表示已填写；待复核单独计数。</p></div>{differs && <button className="admin-btn primary" disabled={errors.length > 0 || reviewErrors.length > 0} onClick={saveDraft}>提交模拟审核</button>}</div>
      {errors.length > 0 && <div className="admin-config-note danger"><Icon name="bolt" /><div><strong>文案校验未通过</strong><span>{errors.slice(0, 4).join('；')}{errors.length > 4 ? ` 等 ${errors.length} 项` : ''}</span></div></div>}
      {reviewErrors.length > 0 && <p className="editor-hint">还有 {reviewErrors.length} 条译文待复核，完成后才能提交模拟审核。选择带待复核数量的语言，再筛选「待复核」。</p>}
      <div className="coverage-grid">{coverage.map((row) => <button className={`coverage-cell ${row.code === locale ? 'is-active' : ''}`} key={row.code} onClick={() => selectLocale(row.code)}>
        <span className="coverage-name">{row.nativeName}<small>{row.code}{row.pending ? ` · ${row.pending} 条待复核` : ''}</small></span>
        <span className="coverage-bar"><i style={{ width: `${row.percent}%` }} className={row.percent === 100 ? 'is-full' : row.percent === 0 ? 'is-none' : ''} /></span>
        <span className="coverage-value">{row.percent}%<small>{row.done}/{row.total}</small></span>
      </button>)}</div>
    </section>
    <div className="admin-toolbar">
      <div className="admin-search"><Icon name="eye" /><input aria-label="搜索文案" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder="搜索键名、原文或译文..." /></div>
      <select aria-label="文案范围" value={namespace} onChange={(event) => { setNamespace(event.target.value); setPage(0) }}><option value="all">全部命名空间</option>{namespaces.map((ns) => <option key={ns} value={ns}>{ns}（{keys.filter((k) => translationNamespace(k) === ns).length}）</option>)}</select>
      <select aria-label="当前编辑语言" value={locale} onChange={(event) => selectLocale(event.target.value)}>{translationLocales.map(({ code, nativeName }) => <option key={code} value={code}>{nativeName}（{code}）{code === SOURCE_LOCALE ? ' · 原文' : ''}</option>)}</select>
      <select aria-label="翻译状态" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(0) }}><option value="all">全部文案</option><option value="missing">未翻译</option><option value="review">待复核</option></select>
      <button className={`admin-btn ${onlyChanged ? 'primary' : 'subtle'}`} aria-pressed={onlyChanged} onClick={() => { setOnlyChanged((v) => !v); setPage(0) }}><Icon name="clock" />只看已改动</button>
    </div>
    <section className="admin-card table-card translation-card">
      <div className="table-top"><div><strong>{locale === SOURCE_LOCALE ? '原文维护' : '译文维护'}</strong><span>当前编辑：{activeMeta.nativeName}（{locale}） · 筛选共 {filtered.length} 条</span></div>
        <div className="table-actions">
          <label className={`admin-btn subtle import-label${reading ? ' is-reading' : ''}`}>{reading ? '读取中…' : `导入 ${activeMeta.nativeName} CSV`}<input aria-label={`导入 ${activeMeta.nativeName} CSV`} disabled={reading} type="file" accept=".csv,text/csv" onChange={(event) => { const f = event.target.files?.[0]; if (f) prepareImport(f); event.target.value = '' }} /></label>
          <button className="admin-btn subtle" disabled={!filtered.length} onClick={exportCurrent}>导出当前筛选（{filtered.length} 条）</button>
        </div>
      </div>
      <div className="table-wrap"><table className="translation-table"><thead><tr><th>文案键</th>{displayLocales.map((meta) => <th key={meta.code}>{meta.nativeName}<small>{meta.code === SOURCE_LOCALE ? '原文' : meta.code === FALLBACK ? '参考 / 兜底' : '译文'}{meta.code === locale ? ' · 当前编辑' : ''}</small></th>)}<th>当前语言状态</th><th>操作</th></tr></thead><tbody>
        {visible.map((key) => {
          const entry = entries[key]
          return <tr key={key} className={isChanged(key) ? 'is-changed-row' : ''}>
            <td><code className="translation-key">{key}</code>{isChanged(key) && <em className="sample-tag is-dirty">已改动</em>}</td>
            {displayLocales.map((meta) => <td key={meta.code} dir={meta.dir}>{String(entry[meta.code] ?? '').trim() ? entry[meta.code] : <em className="sample-tag">未填写</em>}</td>)}
            <td>{!String(entry[locale] ?? '').trim() ? '未翻译' : needsReview(key) ? <em className="sample-tag is-dirty">待复核</em> : locale === SOURCE_LOCALE ? '原文' : '已复核'}</td>
            <td><button className="row-action" onClick={() => setEditing(key)}>{needsReview(key) ? '编辑 / 复核' : locale === SOURCE_LOCALE ? '编辑原文' : '编辑译文'}</button></td>
          </tr>
        })}
      </tbody></table>{!filtered.length && <div className="empty-state"><Icon name="eye" /><strong>没有匹配的文案</strong><p>调整搜索与筛选条件。</p></div>}</div>
      <Pager page={pageIndex} total={filtered.length} onChange={setPage} />
    </section>
    {editing && <TranslationEditor key={editing} entryKey={editing} entry={entries[editing]} review={reviews?.[editing]} locale={locale} onSave={saveEntry(editing)} onClose={() => setEditing(null)} />}
    {importPreview && <EditDialog eyebrow="翻译文件回传" title={`导入 ${importPreview.fileName}`} subtitle={`目标语言：${importPreview.targetLocale} · 确认前不会写入草稿`} dirty={false} allowUnchangedSave onClose={() => setImportPreview(null)} onSave={commitImport} saveLabel="确认导入会话草稿"
      saveDisabled={importPreview.errors.length > 0 || importPreview.targetLocale !== locale || (!importPreview.counts.changed && !pendingConfirmations.length) || (pendingConfirmations.length > 0 && !confirmReviewed)}
      footNote="任一错误都会阻止整批导入；空白默认跳过。确认时再次核对原文与已有译文。"
      tabs={[{ id: 'preview', label: '逐条预览', content: <div className="import-preview">
        {importPreview.targetLocale !== locale && <p role="alert">当前语言已切换，请取消并在正确语言下重新导入。</p>}
        <div className="import-summary"><div><strong>{importPreview.counts.changed}</strong><span>条将更新</span></div><div><strong>{importPreview.counts.unchanged}</strong><span>条内容相同</span></div><div><strong>{importPreview.counts.skipped}</strong><span>条跳过</span></div></div>
        {importPreview.errors.length > 0 && <div className="translation-import-errors" role="alert"><strong>校验未通过，整批不会导入（共 {importPreview.errors.length} 项，最多显示前 20 项）</strong><ul>{importPreview.errors.slice(0, 20).map((error, index) => <li key={index}>{error}</li>)}</ul></div>}
        {pendingConfirmations.length > 0 && <label className="import-confirm-check"><input type="checkbox" checked={confirmReviewed} onChange={(event) => setConfirmReviewed(event.target.checked)} />我已核对当前原文与参考文案，确认文件中的 {pendingConfirmations.length} 条待复核译文适用（含内容未改变的译文）。</label>}
        <div className="table-wrap"><table className="translation-table import-diff"><thead><tr><th>文件记录 / 键</th><th>原有内容</th><th>回传内容</th><th>处理结果</th></tr></thead><tbody>{importPreview.rows.slice(importPage * PAGE_SIZE, (importPage + 1) * PAGE_SIZE).map((row, index) => <tr key={index}><td>{row.rowNumber}<br /><code>{row.key}</code></td><td>{row.before || '空'}</td><td>{row.after || '空'}</td><td>{row.message}</td></tr>)}</tbody></table></div>
        <Pager page={importPage} total={importPreview.rows.length} onChange={setImportPage} />
      </div> }]} />}
  </>
}

// ---- activity centre ------------------------------------------------------
// Each activity type owns a different reward config, so the modal swaps its editor by type.
function ActivityModal({ record, store, journal, onClose }) {
  const meta = activityTypeMeta[record.type]
  const moduleId = meta?.moduleId
  const [initial] = useState(() => ({ shell: { name: record.name, period: record.period, audience: record.audience || '全部玩家', budget: record.budget || '—', owner: record.owner || '' }, region: normalizeRegion(record.region), config: moduleId ? structuredClone(getSlice(store,moduleId)) : null }))
  const [shell, setShell] = useState(() => ({...initial.shell}))
  const [regionDraft, setRegionDraft] = useState(() => structuredClone(initial.region))
  const [config, setConfig] = useState(() => structuredClone(initial.config))
  const shellChanged = JSON.stringify(shell) !== JSON.stringify(initial.shell)
  const regionChanged = JSON.stringify(regionDraft) !== JSON.stringify(initial.region)
  const configChanged = JSON.stringify(config) !== JSON.stringify(initial.config)
  const dirty = shellChanged || regionChanged || configChanged
  const regionErrors = validateRegion(regionDraft,'投放地区')
  const configErrors = moduleId ? validateSnapshot(moduleId,config) : []
  const shellErrors = validateActivityInfo(shell)
  const errors = [...shellErrors,...regionErrors,...configErrors]
  const shellFields = [['name','活动名称'],['period','活动周期'],['audience','适用人群'],['budget','奖励预算'],['owner','负责人']]
  const regionModule = `activityRegion:${record.id}`
  const save = () => {
    if (!dirty || errors.length) return
    if (shellChanged) {
      journal.transform((current) => { const apply=(list)=>list.map((item)=>item.id===record.id?{...item,...shell}:item); return {...current,activities:apply(current.activities),live:{...current.live,activities:apply(current.live.activities)}} })
      journal.logAudit({action:'编辑活动信息',target:shell.name,targetModule:'activities',targetId:record.id,after:diffSummary(initial.shell,shell,shellFields)})
    }
    if (regionChanged) {
      journal.transform((current)=>setSlice(current,regionModule,{region:regionDraft}))
      journal.logAudit({action:'保存活动投放地区草稿',target:shell.name,targetModule:regionModule,targetId:record.id,after:displayFieldValue({type:'region'},regionDraft)})
      journal.queuePublish({name:`${shell.name} · 投放地区调整`,type:'活动版本',scope:'生产环境',sourceModule:regionModule,sourceId:record.id,snapshot:{region:regionDraft},todoSource:'活动中心'})
    }
    if (configChanged && moduleId) {
      const snapshot=moduleId==='wheel'?{...config,wheelVersion:store.live.wheelVersion+1}:config
      journal.transform((current)=>setSlice(current,moduleId,snapshot))
      journal.logAudit({action:`保存${meta.title}草稿`,target:shell.name,targetModule:moduleId,targetId:record.id,after:`从活动「${shell.name}」提交共享奖励配置`})
      journal.queuePublish({name:`${shell.name} · ${meta.title}调整`,type:'活动版本',scope:'生产环境',sourceModule:moduleId,sourceId:record.id,snapshot,todoSource:'活动中心'})
    }
    onClose()
  }
  const tabs=[
    {id:'information',label:'活动信息',errors:shellErrors,content:<div className="form-grid">{shellFields.map(([key,label])=><label key={key}>{label}{key==='audience'?<select value={shell[key]} onChange={(event)=>setShell((current)=>({...current,[key]:event.target.value}))}>{['全部玩家','新用户（注册 7 日内）','活跃玩家','付费玩家','流失召回'].map((value)=><option key={value}>{value}</option>)}</select>:<input value={shell[key]} onChange={(event)=>setShell((current)=>({...current,[key]:event.target.value}))}/>}</label>)}<p className="full editor-hint">类型：{record.type} · 状态：{record.status} · 参与人数：{record.participants}。生命周期状态通过详情里的操作调整；活动元信息保存后立即更新。</p></div>},
    {id:'region',label:'投放地区',errors:regionErrors,content:<div className="editor-preview"><RegionPicker value={regionDraft} onChange={setRegionDraft} label="投放地区"/><p>此地区只属于当前活动记录；修改后提交审核。同类型其他活动的地区不会一同改变。</p><p>当前生效地区：{displayFieldValue({type:'region'},store.live.activities.find((item)=>item.id===record.id)?.region)}</p></div>},
  ]
  const sharedNote=<p className="editor-hint">奖励配置与「{moduleLabels[moduleId]}」页面共享整个模块，不是当前活动独占。{moduleId&&publishNote(store,moduleId)}</p>
  if(moduleId==='checkin')tabs.push({id:'rewards',label:'奖励梯度',errors:configErrors,content:<>{sharedNote}<CheckinLadderEditor days={config.checkinDays} onChange={(checkinDays)=>setConfig((current)=>({...current,checkinDays}))}/></>})
  if(moduleId==='wheel') {
    const change=({prizes,freeSpins})=>setConfig((current)=>({...current,wheelPrizes:prizes,wheelFreeSpins:freeSpins}))
    tabs.push({id:'prizes',label:'奖项配置',errors:configErrors.filter((error)=>!error.includes('概率')&&!error.includes('免费')),content:<>{sharedNote}<WheelPrizeEditor section="prizes" prizes={config.wheelPrizes} freeSpins={config.wheelFreeSpins} onChange={change}/></>},{id:'rules',label:'概率与次数',errors:configErrors.filter((error)=>error.includes('概率')||error.includes('免费')),content:<WheelPrizeEditor section="rules" prizes={config.wheelPrizes} freeSpins={config.wheelFreeSpins} onChange={change}/>})
  }
  if(moduleId==='missions') {
    const change=(missions)=>setConfig((current)=>({...current,missions}))
    tabs.push({id:'tasks',label:'任务信息',errors:configErrors.filter((error)=>!error.includes('奖励')),content:<>{sharedNote}<MissionListEditor section="details" missions={config.missions} removableIds={store.live.missions.map((m)=>m.id)} onChange={change}/></>},{id:'rewards',label:'奖励与状态',errors:configErrors.filter((error)=>error.includes('奖励')),content:<MissionListEditor section="rewards" missions={config.missions} removableIds={store.live.missions.map((m)=>m.id)} onChange={change}/>})
  }
  tabs.push({id:'preview',label:'效果与变更',content:<><ChangePreview before={initial.shell} after={shell} fields={shellFields.map(([key,label])=>({key,label}))}/>{regionChanged&&<ChangePreview before={{region:initial.region}} after={{region:regionDraft}} fields={[{key:'region',label:'投放地区',type:'region'}]}/>} {moduleId==='checkin'&&<CheckinPreview days={config.checkinDays}/>} {moduleId==='wheel'&&<WheelPreview prizes={config.wheelPrizes} freeSpins={config.wheelFreeSpins}/>} {moduleId==='missions'&&<MissionsPreview missions={config.missions}/>} {configChanged&&<DiffSection diff={snapshotDiff(moduleId,initial.config,config)}/>}</>})
  const hasReview=regionChanged||configChanged
  return <EditDialog title={`编辑活动 · ${record.name}`} eyebrow={`${record.type}活动`} subtitle="每个标签属于当前活动的不同配置类型；切换不会丢失修改。" tabs={tabs} errors={errors} dirty={dirty} onClose={onClose} onSave={save} saveLabel={hasReview?'保存并提交配置审核':'保存活动信息'} footNote={hasReview?`${shellChanged?'活动信息立即保存；':''}奖励或投放地区提交审核后生效。`:'仅活动信息保存后直接更新并记录日志。'}/>
}

function ActivitiesPage({ onOpen, store, update, journal, navigate, intent }) {
  const [editingId, setEditingId] = useState(intent?.focusId && store.activities.some((a) => a.id === intent.focusId) ? intent.focusId : null)
  const editing = editingId ? store.activities.find((a) => a.id === editingId) : null
  return <>
    <ActivityTypeLegend />
    <GenericPage page="activities" onOpen={onOpen} store={store} update={update} journal={journal} navigate={navigate} describe={(record) => ({
      id: `activities-${record.id}`, eyebrow: '活动详情', title: record.name, status: record.status,
      history: store.audit.filter((a) => a.targetModule === 'activities' && a.targetId === record.id),
      actions: [
        { label: '编辑活动配置', tone: 'primary', run: () => setEditingId(record.id) },
        ...describeGeneric('activities', record, store, { update, journal }).actions,
      ],
      fields: [
        { key: 'type', label: '活动类型', value: record.type, readOnly: true },
        { key: 'period', label: '活动周期', value: record.period, readOnly: true },
        { key: 'audience', label: '适用人群', value: record.audience || '全部玩家', readOnly: true },
        { key: 'budget', label: '奖励预算', value: record.budget || '—', readOnly: true },
        { key: 'participants', label: '参与人数', value: record.participants, readOnly: true },
        { key: 'owner', label: '负责人', value: record.owner, readOnly: true },
        { key: 'module', label: '关联奖励配置模块', value: activityTypeMeta[record.type] ? moduleLabels[activityTypeMeta[record.type].moduleId] : '无', readOnly: true },
        { key: 'region', label: '投放地区（本记录）', value: regionSummary(record.region, countryContinent, continents.map((c) => c.code), (code) => CONTINENT_NAMES[code] ?? code), readOnly: true },
        { key: 'regionEffective', label: '是否为该类型当前生效地区', value: record.status === '进行中'
          ? '是 · 状态为「进行中」，玩家看到的就是这份地区'
          : `否 · 当前生效地区来自${record.type}类活动里状态为「进行中」的那一条（${regionSummary(settledActivityRegion(store.live.activities, record.type), countryContinent, continents.map((c) => c.code), (code) => CONTINENT_NAMES[code] ?? code)}）`, readOnly: true },
      ],
      hint: '「编辑活动配置」打开该活动类型专属的配置弹窗，投放地区也在其中维护；每条活动记录的地区各自独立、各自走草稿审核，互不影响。只有状态为「进行中」的那条记录，其地区才会真正影响玩家。',
    })} />
    {editing && <ActivityModal key={editing.id} record={editing} store={store} update={update} journal={journal} onClose={() => setEditingId(null)} />}
  </>
}

function ActivityTypeLegend() {
  return <div className="activity-legend">{Object.entries(activityTypeMeta).map(([type, meta]) => <div key={type}><strong>{type}类活动</strong><span>配置项：{meta.title}</span><small>{meta.note}</small></div>)}</div>
}

const packTagOptions = [['store.tagFirstBuy','首充'],['store.tagPopular','热门'],['store.tagRecommended','推荐'],['store.tagValue','超值'],['','不显示标签']]
const packTagText = (value) => packTagOptions.find(([key])=>key===value)?.[1] || value || '—'

const packFieldLabels = [['coins', '金币数'], ['discountPercent', '折扣'], ['gemBonus', '赠送宝石'], ['tag', '标签'], ['recommended', '推荐款']]

function describeCoinPack(pack, store, { update, journal }) {
  return {
    editSections: [{id:'pricing',label:'商品与定价',keys:['sku','coins','discountPercent','gemBonus']},{id:'display',label:'营销展示',keys:['tag','recommended']}],
    id: `coinpack-${pack.id}`, eyebrow: '金币礼包详情（草稿）', title: `${pack.coins.toLocaleString('en-US')} 金币礼包`, status: pack.status,
    history: store.audit.filter((a) => a.targetModule === 'store' && a.targetId === pack.id),
    fields: [
      { key: 'coins', label: '金币数', value: pack.coins, type: 'number', min: 1, step: 1000 },
      { key: 'discountPercent', label: '折扣 %', value: pack.discountPercent, type: 'number', min: 0, max: 90 },
      { key: 'gemBonus', label: '赠送宝石', value: pack.gemBonus, type: 'number', min: 0 },
      { key: 'tag', label: '标签', value: pack.tag || '', type: 'select', options: packTagOptions },
      { key: 'recommended', label: '设为推荐款 ★（唯一）', value: !!pack.recommended, type: 'toggle' },
      { key: 'sku', label: 'SKU', value: pack.id, readOnly: true },
    ],
    validate: validateCoinPack,
    hint: (draft) => `售价按 1 USD = 10,000 金币自动计算，当前为 ${coinPackPriceUsd({ ...pack, ...draft })}；生效版本为 ${coinPackPriceUsd(store.live.coinPacks.find((p) => p.id === pack.id) || pack)}。${draft.recommended ? `设为推荐后，${store.coinPacks.filter((item)=>item.id!==pack.id&&item.recommended).map((item)=>`${item.coins}金币礼包`).join('、')||'没有其他推荐款'}${store.coinPacks.some((item)=>item.id!==pack.id&&item.recommended)?'将取消推荐。':''}` : ''}`,
    onSave: (draft) => {
      const nextList = store.coinPacks.map((p) => (p.id === pack.id ? { ...p, ...draft } : (draft.recommended ? { ...p, recommended: false } : p)))
      update('coinPacks', () => nextList)
      const label = `${Number(draft.coins).toLocaleString('en-US')} 金币礼包`
      journal.logAudit({ action: '编辑金币礼包（草稿）', target: label, targetModule: 'store', targetId: pack.id, after: diffSummary(pack, { ...pack, ...draft }, packFieldLabels) + (draft.recommended ? `；同步取消其他推荐款：${store.coinPacks.filter((item)=>item.id!==pack.id&&item.recommended).map((item)=>item.id).join('、')||'无'}` : '') })
      journal.queuePublish({ name: `${label}配置更新`, type: '商城配置', scope: '生产环境', sourceModule: 'coinPacks', sourceId: pack.id, snapshot: { coinPacks: nextList }, todoSource: '商城与经济' })
    },
    saveLabel: '保存草稿并提交审核',
  }
}

function ProductsPage({ onOpen, store, update, journal }) {
  const packLabels = ['商品名称', 'SKU', '折扣', '售价', '赠送宝石', '标签', '状态']
  const [showChestForm, setShowChestForm] = useState(false)
  const [showPassForm, setShowPassForm] = useState(false)
  const [preview, setPreview] = useState('live')
  const [packEditing, setPackEditing] = useState(null)
  const hasDraft = ['coinPacks','monthlyPass','chestOffer'].some((id) => draftDiffers(store,id))
  const shown = preview === 'draft' && hasDraft ? store : store.live
  const openChestForm = () => setShowChestForm(true)
  const saveChestForm = (chestDraft) => {
    if (validateChestOffer(chestDraft).length) return
    const version = chestDraft.version === store.live.chestOffer.version ? nextVersionTag(chestDraft.version) : chestDraft.version
    const next = { ...store.chestOffer, version, priceCoins: chestDraft.priceCoins, maxRewardCoins: chestDraft.maxRewardCoins }
    update('chestOffer', () => next)
    journal.logAudit({ action: '调整明日宝箱报价（草稿）', target: next.productId, targetModule: 'store', targetId: 'chest', before: `${store.live.chestOffer.version} · ${store.live.chestOffer.priceCoins} 金币 · 上限 ${store.live.chestOffer.maxRewardCoins}`, after: `${version} · ${next.priceCoins} 金币 · 上限 ${next.maxRewardCoins}`, result: chestDraft.note ? `成功 · 说明：${chestDraft.note}` : '成功' })
    journal.queuePublish({ name: `明日宝箱报价 ${version}`, type: '商城配置', scope: '生产环境', sourceModule: 'chestOffer', sourceId: 'chest', snapshot: { chestOffer: next }, note: chestDraft.note, todoSource: '商城与经济' })
    setShowChestForm(false); setPreview('draft')
  }
  const openPassForm = () => setShowPassForm(true)
  const savePassForm = (passDraft) => {
    if (validateMonthlyPass(passDraft).length) return
    update('monthlyPass', () => passDraft)
    journal.logAudit({ action: '编辑月度特权卡（草稿）', target: store.monthlyPass.title, targetModule: 'store', targetId: 'pass', after: diffSummary(store.monthlyPass, passDraft, [['priceUsdCents', '价格(美分)'], ['dailyCoins', '每日金币'], ['dailyGems', '每日宝石'], ['validDays', '有效天数']]) })
    journal.queuePublish({ name: '月度特权卡配置更新', type: '商城配置', scope: '生产环境', sourceModule: 'monthlyPass', sourceId: 'pass', snapshot: { monthlyPass: passDraft }, todoSource: '商城与经济' })
    setShowPassForm(false); setPreview('draft')
  }
  const openPack = (p) => { const descriptor=describeCoinPack(p,store,{update,journal}); onOpen({...descriptor,onSave:undefined,actions:[{label:'编辑礼包',tone:'primary',run:()=>setPackEditing(p.id)}]}) }
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes.store[0]}</span><small>{configurationNotes.store[1]}</small></div></div>
    <PreviewVersionSwitch value={preview} onChange={setPreview} hasDraft={hasDraft} />
    <ConfigBadge store={store} moduleId="coinPacks" onDiscard={() => journal.discardDraft('coinPacks')} />
    <section className="admin-card table-card"><div className="table-top"><div><strong>金币礼包预览</strong><span>共 {shown.coinPacks.length} 档 · 1 USD = 10,000 金币 · 点击行查看，编辑使用操作按钮</span></div></div><div className="table-wrap"><table><thead><tr>{packLabels.map((l) => <th key={l}>{l}</th>)}<th>操作</th></tr></thead><tbody>{shown.coinPacks.map((p) => <tr key={p.id} onClick={() => openPack(p)}><td>{p.coins.toLocaleString('en-US')} 金币礼包{p.recommended ? ' ★' : ''}</td><td>{p.id}</td><td>{p.discountPercent}%</td><td>{coinPackPriceUsd(p)}</td><td>{p.gemBonus} 宝石</td><td>{packTagText(p.tag)}</td><td><Status>{p.status}</Status></td><td><button className="row-action" onClick={(event) => { event.stopPropagation(); setPackEditing(p.id) }}>编辑</button></td></tr>)}</tbody></table></div></section>
    <ConfigBadge store={store} moduleId="monthlyPass" onDiscard={() => journal.discardDraft('monthlyPass')} />
    <section className="admin-card"><div className="card-heading"><div><h2>月度特权卡预览</h2><p>{shown.monthlyPass.title} · SKU monthly-pass · 生效版本 ${(store.live.monthlyPass.priceUsdCents / 100).toFixed(2)} / {store.live.monthlyPass.dailyCoins} 金币 / {store.live.monthlyPass.dailyGems} 宝石 / {store.live.monthlyPass.validDays} 天</p></div><button className="admin-btn primary" onClick={openPassForm}><Icon name="gear" />编辑</button></div><div className="summary-grid"><div><span>价格</span><strong>${(shown.monthlyPass.priceUsdCents / 100).toFixed(2)}</strong><small>不自动续费</small></div><div><span>每日金币</span><strong>{shown.monthlyPass.dailyCoins.toLocaleString('en-US')}</strong><small>需每日主动领取</small></div><div><span>每日宝石</span><strong>{shown.monthlyPass.dailyGems}</strong><small>当日未领取不补发</small></div><div><span>有效天数</span><strong>{shown.monthlyPass.validDays} 天</strong><small>状态：{shown.monthlyPass.status}</small></div></div></section>
    <ConfigBadge store={store} moduleId="chestOffer" versionText={store.live.chestOffer.version} onDiscard={() => journal.discardDraft('chestOffer')} />
    <section className="admin-card"><div className="card-heading"><div><h2>明日宝箱 · 报价预览</h2><p>{shown.chestOffer.productId}</p></div><button className="admin-btn primary" onClick={openChestForm}><Icon name="gear" />调整报价</button></div><div className="summary-grid"><div><span>报价版本</span><strong>{shown.chestOffer.version}</strong><small>版本号变更会使旧客户端报价失效（409）</small></div><div><span>购买价格</span><strong>{shown.chestOffer.priceCoins} 金币</strong><small>每业务日限购 1 个</small></div><div><span>可能奖励上限</span><strong>{shown.chestOffer.maxRewardCoins} 金币</strong><small>0 金币为合法开奖结果</small></div><div><span>解锁 / 截止</span><strong>次日 00:00</strong><small>Asia/Shanghai · 解锁后 24 小时截止（服务端固定规则）</small></div></div><div className="environment-note"><Icon name="shield" /><span><strong>购买资格与幂等键（服务端规则，只读）</strong><small>当日完成一局有效游戏后可购买；购买键为 chest-purchase-业务日；开启键为 chest-open-宝箱ID。开奖、钱包流水与状态变更需原子提交。</small></span></div></section>
    {packEditing && <DescriptorEditModal descriptor={describeCoinPack(store.coinPacks.find((pack)=>pack.id===packEditing),store,{update,journal})} onClose={()=>setPackEditing(null)} onSaved={()=>{setPackEditing(null);setPreview('draft')}} />}
    {showChestForm && <ChestOfferEditDialog initial={store.chestOffer} live={store.live.chestOffer} onSave={saveChestForm} onClose={()=>setShowChestForm(false)} />}
    {showPassForm && <MonthlyPassEditDialog initial={store.monthlyPass} live={store.live.monthlyPass} onSave={savePassForm} onClose={()=>setShowPassForm(false)} />}
  </>
}

function describeOrder(record, store, { update, journal }) {
  const { actions } = describeGeneric('orders', record, store, { update, journal })
  return {
    id: `orders-${record.id}`, eyebrow: '订单详情', title: record.id, status: record.status, actions,
    history: store.audit.filter((a) => a.targetModule === 'orders' && a.targetId === record.id),
    lifecycle: { steps: ['待支付', '处理中', '已支付', '退款处理中', '已退款'], branch: '失败 / 异常 / 已取消为分支状态；异常订单需人工介入' },
    fields: [
      { key: 'player', label: '玩家', value: record.player, readOnly: true },
      { key: 'product', label: '商品', value: record.product, readOnly: true },
      { key: 'amount', label: '金额', value: record.amount, readOnly: true },
      { key: 'time', label: '时间', value: record.time, readOnly: true },
      { key: 'requestId', label: 'request_id / idempotency_key', value: '待联调（由宿主与服务端生成）', readOnly: true },
    ],
  }
}

function describePlayer(record, store, { update, journal, navigate }) {
  const pageTransitions = transitions.players[record.status] || []
  const actions = pageTransitions.map(([label, nextStatus, opts = {}]) => ({
    label, tone: statusClass(nextStatus) === 'danger' ? 'danger' : 'warning', requireReason: !!opts.requireReason,
    run: (reason) => { update('players', (list) => list.map((p) => (p.id === record.id ? { ...p, status: nextStatus } : p))); journal.logAudit({ action: label, target: record.name, targetModule: 'players', targetId: record.id, before: record.status, after: nextStatus, result: reason ? `成功 · 原因：${reason}` : '成功' }) },
  }))
  actions.push(
    { label: '查看钱包流水', run: () => navigate('ledger', { query: record.name }) },
    { label: '查看奖励领取', run: () => navigate('players', { tab: 'rewardClaims', query: record.name }) },
    { label: '查看月卡权益', run: () => navigate('players', { tab: 'entitlements', query: record.name }) },
    { label: '查看宝箱记录', run: () => navigate('players', { tab: 'chestRecords', query: record.name }) },
  )
  const entitlement = store.entitlements.find((e) => e.playerId === record.playerId)
  return {
    editLabel: '编辑昵称', editSections: [{id:'profile',label:'昵称',keys:['playerId','name']}],
    id: `players-${record.id}`, eyebrow: '玩家详情', title: record.name, status: record.status, actions,
    history: store.audit.filter((a) => a.targetModule === 'players' && a.targetId === record.id),
    fields: [
      { key: 'name', label: '昵称（2–20 字）', value: record.name },
      { key: 'playerId', label: '玩家 ID', value: record.playerId, readOnly: true },
      { key: 'level', label: '等级', value: record.level, readOnly: true },
      { key: 'coins', label: '金币余额', value: record.coins, readOnly: true },
      { key: 'gems', label: '宝石余额', value: record.gems, readOnly: true },
      { key: 'lastActive', label: '最近活跃', value: record.lastActive, readOnly: true },
      { key: 'pass', label: '月卡权益', value: entitlement ? `${entitlement.status}${entitlement.expiresAt !== '—' ? ` · 到期 ${entitlement.expiresAt}` : ''}` : '未开通', readOnly: true },
      { key: 'receiveWinNotifications', label: '中奖弹幕（玩家自设，默认开）', value: true, type: 'toggle', disabled: true },
      { key: 'allowSendWins', label: '分享中奖（玩家自设，默认开）', value: true, type: 'toggle', disabled: true },
      { key: 'shareRecentGames', label: '好友可见最近游戏（玩家自设，默认开）', value: true, type: 'toggle', disabled: true },
    ],
    validate: (draft) => validateNickname(draft.name),
    onSave: (draft) => { update('players', (list) => list.map((p) => (p.id === record.id ? { ...p, name: draft.name.trim() } : p))); journal.logAudit({ action: '编辑玩家昵称', target: draft.name.trim(), targetModule: 'players', targetId: record.id, before: record.name, after: draft.name.trim() }) },
    saveLabel: '保存昵称', hint: '资产、等级与最近活跃以宿主/服务端上下文为准，后台不可直接改写；三项隐私偏好展示的是玩家未修改时的默认值，真实值需服务端返回。',
  }
}

function describeLedgerEntry(record, store, { update, journal }) {
  const { actions } = describeGeneric('ledger', record, store, { update, journal })
  return {
    id: `ledger-${record.id}`, eyebrow: record.source === 'manual_adjust' ? '人工调整复核（模拟）' : '流水详情（只读）', hint: record.source === 'manual_adjust' ? '确认或驳回仅更新后台会话状态并关闭关联待办，不改变余额，也不代表真实资产入账。' : undefined, title: record.id, status: ledgerStatusLabel[record.status] || record.status, actions,
    history: store.audit.filter((a) => a.targetModule === 'ledger' && a.targetId === record.id),
    fields: [
      { key: 'player', label: '玩家', value: `${record.player} · ${record.playerId || '—'}`, readOnly: true },
      { key: 'amount', label: '变动金额', value: `${record.amount > 0 ? '+' : ''}${record.amount.toLocaleString('en-US')} ${record.currency === 'coins' ? '金币' : '宝石'}`, readOnly: true },
      { key: 'source', label: '来源', value: `${ledgerSourceLabel[record.source] || '未知'} (${record.source})`, readOnly: true },
      { key: 'time', label: '时间', value: record.time, readOnly: true },
      { key: 'balanceBefore', label: '变动前余额', value: record.balanceBefore === null ? '暂无数据' : record.balanceBefore.toLocaleString('en-US'), readOnly: true },
      { key: 'balanceAfter', label: '变动后余额', value: record.balanceAfter === null ? '暂无数据' : record.balanceAfter.toLocaleString('en-US'), readOnly: true },
      { key: 'ref', label: '关联对象', value: record.ref || '—', readOnly: true },
    ],
  }
}

const playerTabs = [['players', '玩家列表'], ['rewardClaims', '奖励领取记录'], ['entitlements', '月卡权益'], ['chestRecords', '宝箱记录']]

function PlayersCenterPage({ onOpen, store, update, journal, navigate, intent }) {
  const [tab, setTab] = useState(intent?.tab || 'players')
  const [query, setQuery] = useState(intent?.query || '')
  const [filter, setFilter] = useState('全部状态')
  const [pageIndex, setPageIndex] = useState(0)
  const cols = columns[tab]
  const rows = store[tab]
  const filtered = useMemo(() => rows.filter((row) => cols.some(([key]) => `${row[key]}`.toLowerCase().includes(query.toLowerCase())) && (filter === '全部状态' || row.status === filter)), [rows, cols, query, filter])
  const statusOptions = [...new Set(rows.map((row) => row.status).filter(Boolean))]
  const visibleRows = filtered.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE)
  const switchTab = (id) => { setTab(id); setFilter('全部状态'); setPageIndex(0) }
  const openRow = (record) => {
    if (tab === 'players') return onOpen(describePlayer(record, store, { update, journal, navigate }))
    const fields = cols.map(([key, label]) => ({ key, label, value: typeof record[key] === 'number' ? record[key].toLocaleString('en-US') : (record[key] ?? '—'), readOnly: true }))
    if (tab === 'rewardClaims') fields.push({ key: 'idempotencyKey', label: '幂等键', value: record.idempotencyKey, readOnly: true }, { key: 'ledgerId', label: '关联流水', value: record.ledgerId, readOnly: true })
    if (tab === 'entitlements') fields.push({ key: 'daily', label: '每日权益（生效版本）', value: `${store.live.monthlyPass.dailyCoins} 金币 + ${store.live.monthlyPass.dailyGems} 宝石`, readOnly: true })
    if (tab === 'chestRecords') fields.push({ key: 'unlockAt', label: '可开启时间', value: record.unlockAt, readOnly: true }, { key: 'expiresAt', label: '截止时间', value: record.expiresAt, readOnly: true })
    onOpen({ id: `${tab}-${record.id}`, eyebrow: `${playerTabs.find(([id]) => id === tab)[1]} · 只读`, title: record.title || record.player, status: record.status, fields, history: [], hint: '该记录由服务端生成，后台只读；发放失败需通过任务/签到接口重试，宝箱由服务端按业务日结算。' })
  }
  return <>
    {configurationNotes.players && <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes.players[0]}</span><small>{configurationNotes.players[1]}</small></div></div>}
    <div className="catalog-toolbar"><div className="view-toggle">{playerTabs.map(([id, label]) => <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => switchTab(id)}>{label}</button>)}</div></div>
    <div className="admin-toolbar"><div className="admin-search"><Icon name="eye" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPageIndex(0) }} placeholder="按玩家昵称 / ID / 项目搜索..." /></div><select value={filter} onChange={(event) => { setFilter(event.target.value); setPageIndex(0) }}><option>全部状态</option>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
    <section className="admin-card table-card"><div className="table-top"><div><strong>{playerTabs.find(([id]) => id === tab)[1]}</strong><span>共 {filtered.length} 条 · {tab === 'players' ? '点击行查看详情与可执行操作' : '服务端记录，只读'}</span></div><button className="admin-btn subtle" onClick={() => exportCsv(playerTabs.find(([id]) => id === tab)[1], cols.map(([, l]) => l), filtered.map((row) => cols.map(([key]) => row[key])))}>导出 CSV</button></div><div className="table-wrap"><table><thead><tr>{cols.map(([, label]) => <th key={label}>{label}</th>)}<th>操作</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} onClick={() => openRow(row)}>{cols.map(([key]) => <td key={key}>{statusValues.includes(row[key]) ? <Status>{row[key]}</Status> : <span>{typeof row[key] === 'number' ? row[key].toLocaleString('en-US') : (row[key] ?? '—')}</span>}</td>)}<td><button className="row-action" onClick={(event) => { event.stopPropagation(); openRow(row) }}>查看详情</button></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state"><Icon name="eye" /><strong>没有匹配数据</strong><p>请调整搜索关键词或筛选条件。</p></div>}</div><Pager page={pageIndex} total={filtered.length} onChange={setPageIndex} /></section>
  </>
}

function LedgerPage({ onOpen, store, update, journal, onAdjust, intent }) {
  const [query, setQuery] = useState(intent?.query || '')
  const [currency, setCurrency] = useState('all')
  const [direction, setDirection] = useState('all')
  const [pageIndex, setPageIndex] = useState(0)
  const filtered = store.ledger.filter((row) => {
    if (query && !`${row.id} ${row.player} ${row.playerId} ${ledgerSourceLabel[row.source] || ''} ${row.ref}`.toLowerCase().includes(query.toLowerCase())) return false
    if (currency !== 'all' && row.currency !== currency) return false
    if (direction === 'income' && row.amount < 0) return false
    if (direction === 'expense' && row.amount >= 0) return false
    return true
  })
  useEffect(() => {
    const target = store.ledger.find((row) => row.id === intent?.focusId)
    if (target) onOpen(describeLedgerEntry(target, store, { update, journal }))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open the linked record once on navigation
  }, [])
  const visibleRows = filtered.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE)
  const amountText = (row) => `${row.amount > 0 ? '+' : ''}${row.amount.toLocaleString('en-US')} ${row.currency === 'coins' ? '金币' : '宝石'}`
  const headers = ['流水 ID', '玩家', '变动金额', '来源', '状态', '时间']
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes.ledger[0]}</span><small>{configurationNotes.ledger[1]}</small></div></div>
    <div className="admin-toolbar"><div className="admin-search"><Icon name="eye" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPageIndex(0) }} placeholder="搜索流水 ID / 玩家 / 来源 / 关联对象..." /></div><select value={currency} onChange={(event) => { setCurrency(event.target.value); setPageIndex(0) }}><option value="all">全部币种</option><option value="coins">金币</option><option value="gems">宝石</option></select><select value={direction} onChange={(event) => { setDirection(event.target.value); setPageIndex(0) }}><option value="all">全部方向</option><option value="income">收入</option><option value="expense">支出</option></select><button className="admin-btn primary" onClick={onAdjust}><Icon name="gear" />人工调整</button></div>
    <section className="admin-card table-card"><div className="table-top"><div><strong>钱包流水列表</strong><span>共 {filtered.length} 条 · 既有流水只读</span></div><button className="admin-btn subtle" onClick={() => exportCsv('钱包流水', headers, filtered.map((row) => [row.id, row.player, amountText(row), ledgerSourceLabel[row.source] || row.source, ledgerStatusLabel[row.status] || row.status, row.time]))}>导出 CSV</button></div><div className="table-wrap"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}<th>操作</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} onClick={() => onOpen(describeLedgerEntry(row, store, { update, journal }))}><td>{row.id}</td><td>{row.player}</td><td>{amountText(row)}</td><td>{ledgerSourceLabel[row.source] || '未知'}{row.source === 'manual_adjust' && <small className="inline-note"> 前台枚举待联调</small>}</td><td><Status>{ledgerStatusLabel[row.status] || row.status}</Status></td><td>{row.time}</td><td><button className="row-action" onClick={(event) => { event.stopPropagation(); onOpen(describeLedgerEntry(row, store, { update, journal })) }}>查看详情</button></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state"><Icon name="eye" /><strong>没有匹配数据</strong><p>请调整搜索关键词或筛选条件。</p></div>}</div><Pager page={pageIndex} total={filtered.length} onChange={setPageIndex} /></section>
  </>
}

function AdminApp() {
  const [store, setStore] = useState(() => {
    const restored = restoreCatalogPublication(createInitialStore(), readCatalogPublication())
    return { ...restored, translationReviews: createTranslationReviews(restored.translations), live: { ...restored.live, translationReviews: createTranslationReviews(restored.live.translations) } }
  })
  const [catalogSyncError, setCatalogSyncError] = useState('')
  useEffect(() => {
    const result = writeCatalogPublication(store.live)
    const timer = setTimeout(() => setCatalogSyncError(result.error || ''), 0)
    return () => clearTimeout(timer)
  }, [store.live])
  const [activePage, setActivePage] = useState('dashboard')
  const [intent, setIntent] = useState(null)
  const [drawerSource, setDrawerSource] = useState(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [environment, setEnvironment] = useState('test')
  const [showAdjust, setShowAdjust] = useState(false)
  const [globalQuery, setGlobalQuery] = useState('')
  const [adjustForm, setAdjustForm] = useState({ player: 'NovaPlayer', currency: 'coins', amount: 0, reason: '' })
  const journal = useMemo(() => makeJournal(setStore), [])
  const update = (moduleKey, updater) => setStore((current) => ({ ...current, [moduleKey]: typeof updater === 'function' ? updater(current[moduleKey]) : updater }))
  const meta = pageMeta[activePage]
  const navigate = (page, nextIntent = null) => { setActivePage(page); setIntent(nextIntent ? { ...nextIntent, stamp: stamp() } : null); setMobileNav(false); setDrawerSource(null); window.scrollTo({ top: 0, behavior: 'instant' }) }
  // Accepts a descriptor, or a builder (store) => descriptor for drawers that must track live store changes.
  const onOpen = (descriptorOrBuilder) => setDrawerSource(() => (typeof descriptorOrBuilder === 'function' ? descriptorOrBuilder : () => descriptorOrBuilder))
  const openRecord = drawerSource ? drawerSource(store) : null
  const runGlobalSearch = () => {
    const q = globalQuery.trim()
    if (!q) return
    if (/^JL-\d{4}-\d+$/i.test(q)) navigate('orders', { query: q })
    else if (/^#?WL-/i.test(q)) navigate('ledger', { query: q })
    else navigate('players', { tab: 'players', query: q })
  }
  const adjustValid = adjustForm.reason.trim() && Number.isSafeInteger(Number(adjustForm.amount)) && Number(adjustForm.amount) !== 0 && store.players.some((player)=>player.name===adjustForm.player)
  const submitAdjust = () => {
    if (!adjustValid) return
    const player = store.players.find((p) => p.name === adjustForm.player)
    const record = { id: nextLedgerId(store.ledger), player: adjustForm.player, playerId: player?.playerId || '—', currency: adjustForm.currency, amount: Number(adjustForm.amount), source: 'manual_adjust', status: 'processing', time: '刚刚', balanceBefore: null, balanceAfter: null, ref: '人工调整' }
    update('ledger', (list) => [record, ...list])
    journal.logAudit({ action: '人工调整钱包流水', target: `${adjustForm.player} · ${record.amount > 0 ? '+' : ''}${record.amount} ${adjustForm.currency === 'coins' ? '金币' : '宝石'}`, targetModule: 'ledger', targetId: record.id, after: record.id, result: `处理中 · 原因：${adjustForm.reason.trim()}` })
    journal.addTodo({ title: `${adjustForm.player} 人工调整流水 ${record.id} 待财务复核`, source: '商城与经济', priority: '中', owner: '财务组', link: { page: 'ledger', focusId: record.id, query: record.id, label: `复核人工调整 ${record.id}` } })
    setShowAdjust(false)
    setAdjustForm({ player: 'NovaPlayer', currency: 'coins', amount: 0, reason: '' })
  }
  const pageKey = `${activePage}-${intent?.stamp || ''}`
  const renderContent = () => {
    const common = { onOpen, store, update, journal, navigate }
    if (activePage === 'dashboard') return <Dashboard onNavigate={navigate} store={store} environment={environment} />
    if (activePage === 'todo') return <TodoPage key={pageKey} store={store} update={update} journal={journal} navigate={navigate} onOpen={onOpen} />
    if (activePage === 'categories') return <><ConfigBadge store={store} moduleId="categories" onDiscard={() => journal.discardDraft('categories')} onResubmit={() => resubmitCatalogDraft(store, 'categories', journal)} /><CategoryManager categories={store.categories} liveCategories={store.live.categories} games={[...Object.values(store.games).flat(), ...Object.values(store.live.games).flat()]} onSave={(categories) => { const errors = validateCategories(categories, [...Object.values(store.games).flat(), ...Object.values(store.live.games).flat()]); if (errors.length) return { error: errors.join('；') }; update('categories', categories); journal.queuePublish({ name: '游戏分类更新', type: '分类配置', scope: '原型目录', sourceModule: 'categories', snapshot: { categories } }); journal.logAudit({ action: '保存游戏分类草稿', target: '游戏分类', targetModule: 'categories', targetId: 'categories', after: categories.map((category) => `${category.id}：${categoryText(category)}`).join('；') }) }} /></>
    if (activePage === 'games') return <GameCatalogPage key={`${environment}-${intent?.stamp || ''}`} environment={environment} intent={intent} store={store} update={update} journal={journal} navigate={navigate} onOpen={onOpen} />
    if (activePage === 'versions') return <GameVersionCenterPage {...common} />
    if (activePage === 'publish') return <ReleaseCenterPage key={pageKey} {...common} intent={intent} />
    if (activePage === 'adminUsers') return <AdminUsersPage {...common} />
    if (activePage === 'wins') return <WinsPage store={store} />
    if (activePage === 'checkin') return <CheckinPage {...common} />
    if (activePage === 'wheel') return <WheelPage {...common} />
    if (activePage === 'missions') return <MissionsPage store={store} update={update} journal={journal} />
    if (activePage === 'activities') return <ActivitiesPage key={pageKey} {...common} intent={intent} />
    if (activePage === 'translations') return <TranslationsPage key={pageKey} store={store} journal={journal} intent={intent} />
    if (activePage === 'store') return <ProductsPage {...common} />
    if (activePage === 'orders') return <GenericPage key={pageKey} page="orders" describe={describeOrder} {...common} intent={intent} />
    if (activePage === 'players') return <PlayersCenterPage key={pageKey} {...common} navigate={navigate} intent={intent} />
    if (activePage === 'ledger') return <LedgerPage key={pageKey} {...common} onAdjust={() => { setAdjustForm({player:store.players[0]?.name||'',currency:'coins',amount:0,reason:''});setShowAdjust(true) }} intent={intent} />
    return <GenericPage key={pageKey} page={activePage} {...common} intent={intent} />
  }
  return <div className="admin-shell">
    <aside className={`admin-sidebar ${mobileNav ? 'is-open' : ''}`}><div className="admin-brand"><span className="admin-brand-mark">J</span><span><strong>Joyloop</strong><small>运营后台原型</small></span><button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><Icon name="close" /></button></div><div className="env-chip"><span className="env-dot" />{environment === 'production' ? '生产环境' : '测试环境'} <small>v{appVersion}</small></div><nav>{navGroups.map((group) => <div className="nav-group" key={group.title}><span className="nav-group-title">{group.title}</span>{group.items.map(([id, label, icon]) => <button key={id} className={activePage === id ? 'is-active' : ''} onClick={() => navigate(id)}><Icon name={icon} /><span>{label}</span><PhaseTag moduleId={id} />{id === 'todo' && <b>{store.todo.filter((t) => t.status !== '已解决').length}</b>}{id === 'publish' && store.publish.some((p) => p.status === '待审核') && <b>{store.publish.filter((p) => p.status === '待审核').length}</b>}</button>)}</div>)}</nav><a className="back-to-lobby" href="./index.html"><Icon name="chevronLeft" />返回大厅原型首页</a></aside>
    <div className="admin-main"><header className="admin-header"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)}><Icon name="flag" /></button><div className="crumb"><span>Joyloop 后台</span><Icon name="chevronRight" /><strong>{meta[0]}</strong></div><div className="header-actions"><label className="environment-select"><span>环境（当前只影响游戏目录）</span><select value={environment} onChange={(event) => setEnvironment(event.target.value)}><option value="test">测试环境</option><option value="production">生产环境</option></select></label><div className="global-search"><Icon name="eye" /><input value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runGlobalSearch()} placeholder="搜索玩家 / 订单号 / 流水号，回车跳转" /></div><button className="header-icon" title="待处理事项" onClick={() => navigate('todo')}><Icon name="bell" />{store.todo.some((t) => t.status !== '已解决') && <i />}</button><button className="header-icon" title="权限与账号" onClick={() => navigate('adminUsers')}><Icon name="gear" /></button><span className="admin-avatar">OP</span><span className="operator-name">运营管理员</span></div></header><div className="admin-tabs"><button className="tab active">{meta[0]} {activePage !== 'dashboard' && <span onClick={() => navigate('dashboard')} title="关闭并返回概览"><Icon name="close" /></span>}</button>{activePage !== 'dashboard' && <button className="tab" onClick={() => navigate('dashboard')}>运营概览</button>}</div><main className="admin-content"><div className="page-title"><div><span className="eyebrow">{activePage === 'dashboard' ? 'OPERATIONS OVERVIEW' : 'JOYLOOP ADMIN CONSOLE'}</span><h1>{meta[0]}<PhaseTag moduleId={activePage} size="lg" /></h1><p>{meta[1]}</p>{phaseOf(activePage) > 1 && <p className="phase-note">{PHASES[phaseOf(activePage)].label}功能 · {PHASES[phaseOf(activePage)].name}：本页在原型里已经可以操作，但排期在{PHASES[phaseOf(activePage)].label}，一期不交付。{PHASES[phaseOf(activePage)].summary}</p>}</div></div>{catalogSyncError && <p role="alert">{catalogSyncError}</p>}<p className="editor-hint">分类与游戏说明审核后可在同浏览器的目录预览中查看；仅展示内容保存在本浏览器，草稿和审核历史刷新重置。真实宿主不使用此预览。</p>{renderContent()}</main></div>
    <RecordDrawer key={openRecord?.id || 'none'} descriptor={openRecord} onClose={() => setDrawerSource(null)} />
    {showAdjust && <EditDialog eyebrow="钱包流水 · 操作确认" title="人工调整流水" dirty={Boolean(adjustForm.amount || adjustForm.reason || adjustForm.currency!=='coins' || adjustForm.player!==(store.players[0]?.name||''))} onClose={()=>{setShowAdjust(false);setAdjustForm({player:store.players[0]?.name||'',currency:'coins',amount:0,reason:''})}} onSave={submitAdjust} saveLabel="提交待复核流水" saveDisabled={!adjustValid} footNote="仅追加处理中流水并生成财务待办，不直接修改玩家余额。" tabs={[
      {id:'amount',label:'对象与金额',content:<div className="form-grid"><label>玩家<select value={adjustForm.player} onChange={(event)=>setAdjustForm((current)=>({...current,player:event.target.value}))}>{store.players.map((player)=><option key={player.id} value={player.name}>{player.name} · {player.playerId}</option>)}</select></label><label>币种<select value={adjustForm.currency} onChange={(event)=>setAdjustForm((current)=>({...current,currency:event.target.value}))}><option value="coins">金币</option><option value="gems">宝石</option></select></label><label>调整金额（非零整数，可为负数）<input type="number" step="1" value={adjustForm.amount} onChange={(event)=>setAdjustForm((current)=>({...current,amount:event.target.value}))}/></label></div>},
      {id:'review',label:'原因与复核',content:<><div className="editor-preview"><p>玩家：{adjustForm.player}</p><p>调整：{adjustForm.amount||0} {adjustForm.currency==='coins'?'金币':'宝石'}</p><p>状态：提交后为处理中，财务确认后才记为成功。</p></div><div className="form-grid"><label className="full">原因（必填）<textarea value={adjustForm.reason} onChange={(event)=>setAdjustForm((current)=>({...current,reason:event.target.value}))}/></label></div></>},
    ]}/>}
  </div>
}

export default AdminApp
