import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../icons.jsx'
import { games, gameCategories } from '../data.js'
import liteContent from '../data/liteContent.json'
import { rankings as aggregateWinnerRankings } from '../engagement/model.js'
import { missionEventOptions, transitions, columns, createInitialStore, ledgerSourceLabel, ledgerStatusLabel, translationLocales, translationNamespace, CONTINENT_NAMES } from './adminSchema.js'
import { continents, countryContinent, countriesOf, countryName } from '../data/regions.js'
import {
  formatReward, coinPackPriceUsd, wheelBalanced, prizeLabel, validateWheel, validateCheckin, validateMissions, validateCoinPack,
  validateMonthlyPass, validateChestOffer, validateTranslations, nextVersionTag, validateNickname, nextLedgerId, diffSummary, moduleLabels,
  getSlice, setSlice, draftDiffers, resetDraftToLive, applyRelease, snapshotDiff, isConfigModule, validateSnapshot, WHEEL_SLOTS,
  normalizeRegion, regionByContinent, regionSummary, validateRegion, REGION_ALL, REGION_CUSTOM,
} from './adminRules.js'

const navGroups = [
  { title: '运营概览', items: [['dashboard', '运营概览', 'gauge'], ['todo', '待处理事项', 'bell'], ['publish', '发布审核', 'play'], ['audit', '操作日志', 'clock']] },
  { title: '游戏运营', items: [['games', '游戏管理', 'gamepad'], ['versions', '游戏版本发布', 'bolt'], ['wins', '赢家与动态', 'trophy']] },
  { title: '活动中心', items: [['activities', '活动管理', 'gift'], ['checkin', '签到活动', 'calendar'], ['wheel', '幸运转盘', 'refresh'], ['missions', '每日任务', 'flag']] },
  { title: '商品与权益', items: [['store', '商品与权益', 'store'], ['orders', '订单管理', 'wallet'], ['ledger', '钱包流水', 'coin']] },
  { title: '玩家', items: [['players', '玩家管理', 'user']] },
  { title: '内容与语言', items: [['translations', '多语言内容', 'globe']] },
  { title: '系统管理', items: [['adminUsers', '权限与账号', 'lock']] },
]

const pageMeta = {
  wins: ['赢家与动态', '今日赢家榜和最近中奖、中奖弹幕共用唯一中奖事件 ID；公开金额为累计中奖金币，不是净收益。'],
  dashboard: ['运营概览', '实时掌握大厅、游戏、活动与商城运行情况。'],
  todo: ['待处理事项', '需要运营、审核或财务跟进的事项。'],
  publish: ['发布审核', '统一管理草稿、测试验证、审核发布与回滚。'],
  audit: ['操作日志', '所有后台配置与人工操作的可追溯记录。'],
  games: ['游戏管理', '维护游戏目录、运行状态、推荐位与老虎机参数。'],
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
  activities: { label: '创建活动', title: '创建活动配置草稿', icon: 'gift', fields: ['活动名称', '活动类型', '适用人群', '奖励预算'] },
  checkin: { label: '创建签到活动', title: '创建签到活动', icon: 'calendar', fields: ['活动名称', '签到周期', '每日奖励', '最终大奖'] },
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
  wins: ['榜单按业务日累计中奖金币；最近中奖按时间倒序，同一事件只展示一次。所有我也要玩入口按 gameId 进入游戏说明。', '隐藏某条事件会同时把它从榜单聚合与前台弹幕中移除；暂停游戏、撤销事件或隐私变更须同时影响列表与弹幕。'],
  publish: ['带快照的发布任务在"通过并发布"时会用快照覆盖生效版本，"驳回"丢弃来源模块的草稿，"回滚"恢复上一个生效版本；不带快照的历史任务只变更状态。', '版本链路：草稿 → 自动检查 → 测试验证 → 待审核 → 灰度/全量 → 已发布。'],
  activities: ['活动配置保存为草稿；发布前校验活动周期、预算、资格范围与奖励库存。', '活动壳的状态与签到/转盘/任务子模块的配置版本目前各自独立（二期联动）。'],
  checkin: ['签到奖励按自然日发放；编辑只改草稿，保存后进入发布审核，通过后才覆盖生效版本。', '缺席补签规则明确为不支持；大奖固定在最后一天。'],
  wheel: ['转盘概率总和必须为 100%，奖项固定 8 格（与前台一致）；开奖结果由服务端记录，前端不直接决定奖励。', '保存草稿会生成新的草稿版本号并进入发布审核；审核通过时会再次校验后才覆盖生效版本。'],
  missions: ['任务进度由服务端事件汇总；领取接口需使用幂等键，避免重复发放。', '任务结束后仅可查看记录，不能修改历史奖励或目标值；上下线同样走草稿与发布审核。'],
  store: ['金币礼包与月度特权卡通过宿主支付桥接完成购买；明日宝箱按次直接从钱包扣款，不生成订单记录。', '明日宝箱报价版本变更会使旧客户端报价失效（409 stale）；三类商品的变更都先进草稿，审核通过后才生效。'],
  orders: ['订单仅覆盖金币礼包与月度特权卡的宿主支付流程。', '状态链路：待支付 → 处理中 → 已支付/失败；已支付后可能进入退款处理中 → 已退款；异常订单需人工介入并写入操作日志。'],
  ledger: ['流水来源与前台一致，固定为 chest_purchase / chest_reward / game_reward / game_cost / checkin / task 六类；后台人工调整使用 manual_adjust，前台流水枚举需在联调时补充该来源。', '既有流水不可编辑；人工调整以追加一条"处理中"流水的方式写入，财务确认入账后才变为成功。'],
  translations: ['这里管理的是玩家在大厅里看到的文字，不是后台界面。英文是所有语言的兜底，必须保持完整；某个语言缺翻译时，玩家会看到英文而不是空白或键名。', '带占位符的文案（例如 {coins}）在各语言里必须保留同样的占位符，否则保存会被拦截。改动进入草稿，经发布审核通过后才对玩家生效。'],
  players: ['玩家资产、等级与最近战绩以宿主/服务端上下文为准；隐私偏好由玩家自己设置，后台只读展示默认值。', '账号状态变更（活动限制、封禁、待复核、解除）一律需要填写原因并写入操作日志。'],
}

// Which admin page owns each config module, for "查看来源配置".
const moduleToPage = (moduleId) => {
  if (!moduleId) return null
  if (String(moduleId).startsWith('games:')) return 'games'
  return { translations: 'translations', wheel: 'wheel', checkin: 'checkin', missions: 'missions', coinPacks: 'store', monthlyPass: 'store', chestOffer: 'store', versions: 'versions', test: 'versions', production: 'versions' }[moduleId] || null
}

const tagLabel = { slots: 'Slots', casual: '休闲', realtime: '实时' }
const categoryLabelFor = (tags) => tags.map((t) => tagLabel[t] || t).join(' · ')
const gameName = (id) => games.find((g) => g.id === id)?.name || id
const PAGE_SIZE = 20

function exportCsv(name, headers, rows) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
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
  if (field.readOnly) return <strong>{Array.isArray(value) ? (value.join(' / ') || '—') : (value === '' || value === null || value === undefined ? '—' : String(value))}</strong>
  if (field.type === 'toggle') return <button type="button" disabled={field.disabled} className={`toggle-switch ${value ? 'is-on' : ''}`} onClick={() => onChange(!value)} aria-pressed={!!value} aria-label={field.label}><i /></button>
  if (field.type === 'select') return <select className="ladder-input" value={value} onChange={(event) => onChange(event.target.value)}>{field.options.map((option) => (Array.isArray(option) ? <option key={option[0]} value={option[0]}>{option[1]}</option> : <option key={option} value={option}>{option}</option>))}</select>
  if (field.type === 'textarea') return <textarea className="ladder-input" value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} />
  if (field.type === 'region') return <RegionPicker value={value} onChange={onChange} label={field.label} />
  if (field.type === 'checks') return <div className="check-group">{field.options.map(([optionValue, optionLabel]) => <label key={optionValue}><input type="checkbox" checked={(value || []).includes(optionValue)} onChange={(event) => onChange(event.target.checked ? [...(value || []), optionValue] : (value || []).filter((v) => v !== optionValue))} />{optionLabel}</label>)}</div>
  if (field.type === 'number') return <input className="ladder-input" type="number" min={field.min} max={field.max} step={field.step} disabled={field.disabled} value={value ?? 0} onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))} />
  return <input className="ladder-input" value={value ?? ''} disabled={field.disabled} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />
}

// Large snapshots (a whole game catalogue) would drown the reviewer, so unchanged rows collapse by default.
function DiffSection({ diff }) {
  const changed = diff.filter((row) => row.changed)
  const [showAll, setShowAll] = useState(diff.length <= 15)
  const visible = showAll ? diff : changed
  return <div className="drawer-section"><h3>配置差异 {diff.length > 0 && <small>{changed.length} 项改动 / 共 {diff.length} 项</small>}</h3>
    {diff.length === 0 ? <p className="audit-item"><Icon name="eye" /><span>该任务没有附带配置快照，仅变更任务状态</span></p>
      : <>
        {!changed.length && <p className="audit-item"><Icon name="eye" /><span>快照与当前生效版本一致，没有字段差异</span></p>}
        {visible.length > 0 && <div className="diff-table">{visible.map((row) => <div key={row.key} className={`diff-row ${row.changed ? 'is-changed' : ''}`}><span className="diff-label">{row.label}{row.added && <em className="diff-tag added">新增</em>}{row.removed && <em className="diff-tag removed">移除</em>}</span><span className="diff-before">{row.before}</span><span className="diff-arrow">→</span><span className="diff-after">{row.after}</span></div>)}</div>}
        {diff.length > changed.length && <button className="admin-link diff-toggle" onClick={() => setShowAll((value) => !value)}>{showAll ? '仅显示改动项' : `显示未改动的 ${diff.length - changed.length} 项`}</button>}
      </>}
  </div>
}

function RecordDrawer({ descriptor, onClose }) {
  const [draft, setDraft] = useState(() => (descriptor ? Object.fromEntries(descriptor.fields.map((f) => [f.key, f.value])) : {}))
  const [reasonFor, setReasonFor] = useState(null)
  const [reasonText, setReasonText] = useState('')
  if (!descriptor) return null
  const setField = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const dirty = !!descriptor.onSave && descriptor.fields.some((f) => !f.readOnly && JSON.stringify(draft[f.key]) !== JSON.stringify(f.value))
  const errors = descriptor.validate ? descriptor.validate(draft) : []
  const runAction = (action) => {
    if (action.requireReason && reasonFor !== action.label) { setReasonFor(action.label); setReasonText(''); return }
    action.run(action.requireReason ? reasonText : undefined)
    setReasonFor(null)
    if (!action.keepOpen) onClose()
  }
  const hint = typeof descriptor.hint === 'function' ? descriptor.hint(draft) : descriptor.hint
  return <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="admin-drawer">
      <div className="drawer-head"><div><span className="eyebrow">{descriptor.eyebrow}</span><h2>{descriptor.title}</h2></div><button className="icon-button" onClick={onClose}><Icon name="close" /></button></div>
      <div className="drawer-body">
        {descriptor.status && <div className="drawer-field"><span>状态</span><Status>{descriptor.status}</Status></div>}
        {descriptor.fields.map((field) => <div className="drawer-field" key={field.key}><span>{field.label}</span><FieldEditor field={field} value={field.readOnly ? field.value : draft[field.key]} onChange={(value) => setField(field.key, value)} /></div>)}
        {hint && <div className="admin-config-note"><Icon name="shield" /><div><strong>说明</strong><span>{hint}</span></div></div>}
        {errors.length > 0 && <div className="admin-config-note danger"><Icon name="bolt" /><div><strong>无法保存</strong><span>{errors.join('；')}</span></div></div>}
        {descriptor.diff && <DiffSection diff={descriptor.diff} />}
        {descriptor.lifecycle && <div className="drawer-section"><h3>状态流转</h3><div className="state-line">{descriptor.lifecycle.steps.map((step, index) => <span key={step} style={{ display: 'contents' }}>{index > 0 && <i />}<span className={`state-node ${step === descriptor.status ? 'active' : descriptor.lifecycle.steps.indexOf(descriptor.status) > index ? 'done' : ''}`}>{step}</span></span>)}</div>{descriptor.lifecycle.branch && <p className="branch-note"><Icon name="bolt" />{descriptor.lifecycle.branch}</p>}</div>}
        {descriptor.actions && descriptor.actions.length > 0 && <div className="drawer-section"><h3>操作</h3><div className="drawer-actions">{descriptor.actions.map((action) => <button key={action.label} className={`admin-btn ${action.tone === 'warning' ? 'warning' : action.tone === 'danger' ? 'danger' : action.tone === 'primary' ? 'primary' : 'subtle'}`} onClick={() => runAction(action)}>{action.label}</button>)}</div>
          {reasonFor && <div className="reason-box"><textarea placeholder={descriptor.actions.find((a) => a.label === reasonFor)?.reasonLabel || `「${reasonFor}」需要填写原因，用于操作日志留痕`} value={reasonText} onChange={(event) => setReasonText(event.target.value)} /><div><button className="admin-btn subtle" onClick={() => setReasonFor(null)}>取消</button><button className="admin-btn primary" disabled={!reasonText.trim()} onClick={() => runAction(descriptor.actions.find((a) => a.label === reasonFor))}>确认{reasonFor}</button></div></div>}
        </div>}
        <div className="drawer-section"><h3>最近操作</h3>{descriptor.history && descriptor.history.length ? descriptor.history.slice(0, 8).map((entry) => <p className="audit-item" key={entry.id}><Icon name="clock" /><span>{entry.actor} · {entry.action}<small>{entry.time} · {entry.result}{entry.before || entry.after ? <span className="diff-pair">{entry.before || '—'} → {entry.after || '—'}</span> : null}</small></span></p>) : <p className="audit-item"><Icon name="eye" /><span>暂无操作记录</span></p>}</div>
      </div>
      <div className="drawer-foot">{descriptor.onSave ? <><button className="admin-btn subtle" onClick={onClose}>取消</button><button className="admin-btn primary" disabled={!dirty || errors.length > 0} onClick={() => { descriptor.onSave(draft); onClose() }}>{descriptor.saveLabel || '保存草稿'}</button></> : <button className="admin-btn primary" onClick={onClose}>完成</button>}</div>
    </aside>
  </div>
}

function ConfigBadge({ store, moduleId, versionText, onDiscard }) {
  const pending = store.publish.find((p) => p.sourceModule === moduleId && p.status === '待审核')
  const differs = draftDiffers(store, moduleId)
  const tone = pending ? 'is-pending' : differs ? 'is-dirty' : ''
  const state = pending ? '待审核' : differs ? '草稿有未保存变更' : '与生效版本一致'
  const detail = pending ? `已提交「${pending.name}」等待审核；审核通过后才覆盖生效版本，前台在此之前仍使用当前生效版本。` : differs ? '编辑只修改草稿，前台以生效版本为准；点击保存后进入发布审核。' : '所有已保存的变更都已发布。'
  return <div className={`config-badge ${tone}`}><Icon name={pending ? 'clock' : differs ? 'flag' : 'shield'} /><span><strong>{versionText ? `当前生效 ${versionText} · ` : ''}{state}</strong><small>{detail}</small></span>{(differs || pending) && onDiscard && <button className="admin-btn subtle" onClick={onDiscard}>放弃草稿</button>}</div>
}

// ---- shared audit / publish-queue helpers, bound to the AdminApp store setter ----
const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
function makeJournal(setStore) {
  const logAudit = (entry) => setStore((store) => ({ ...store, audit: [{ id: `audit-${stamp()}`, logId: `#${Math.random().toString(16).slice(2, 6)}`, actor: '运营管理员', result: '成功', time: '刚刚', before: '', after: '', targetModule: '', targetId: '', ...entry }, ...store.audit] }))
  const addTodo = (entry) => setStore((store) => ({ ...store, todo: [{ id: `todo-${stamp()}`, title: '', source: '', priority: '中', status: '待处理', time: '刚刚', owner: '运营一组', publishId: '', link: null, claimedBy: '', resolution: '', ...entry }, ...store.todo] }))
  const queuePublish = (entry) => {
    const id = `publish-${stamp()}`
    setStore((store) => {
      const superseded = store.publish.filter((p) => entry.sourceModule && p.sourceModule === entry.sourceModule && p.status === '待审核').map((p) => p.id)
      return {
        ...store,
        publish: [{ id, name: '', type: '', scope: '生产环境', status: '待审核', owner: '运营管理员', time: '刚刚', sourceModule: '', sourceId: '', snapshot: null, note: '', ...entry }, ...store.publish.map((p) => (superseded.includes(p.id) ? { ...p, status: '已作废', time: '刚刚' } : p))],
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
  </>
}

const gameFieldLabels = [['name', '游戏名称'], ['tags', '分类标签'], ['badges', '角标'], ['status', '运行状态'], ['popular', '大厅热门推荐'], ['region', '可用地区'], ['description', '游戏简介'], ['cover', '封面资源'], ['sortWeight', '排序权重'], ['maintenanceNote', '维护公告文案'], ['launchAt', '预计上线时间'], ['heat', '热度值'], ['winRate', '中奖率'], ['rtp', 'RTP'], ['winRange', '中奖金额范围'], ['maxMultiplier', '最大赔率'], ['minBet', '最小投注'], ['paylines', '赔付线数'], ['volatility', '波动性']]
const gameDraftFields = gameFieldLabels.filter(([key]) => key !== 'status' && key !== 'maintenanceNote')

// Every configurable field for a game, grouped the way an operator thinks about them.
function gameFormSections(draft) {
  const slots = (draft.tags || []).includes('slots')
  return [
    { title: '基础信息', fields: [
      { key: 'name', label: '游戏名称' },
      { key: 'gameId', label: '游戏 ID', readOnly: true, note: '接入后不可修改，前台以此标识跳转' },
      { key: 'tags', label: '分类标签', type: 'checks', options: [['slots', 'Slots'], ['casual', '休闲'], ['realtime', '实时']], full: true },
      { key: 'badges', label: '角标（英文逗号分隔）', placeholder: 'JACKPOT, 热度 96' },
      { key: 'cover', label: '封面资源', note: '资源上传接口待联调，当前仅记录文件名' },
      { key: 'region', label: '可用地区', type: 'region', full: true, note: '白名单：只有勾选的国家/地区能看到并进入这款游戏' },
      { key: 'sortWeight', label: '排序权重', type: 'number', note: '数值越小越靠前；目录页拖拽会覆盖该顺序' },
      { key: 'description', label: '游戏简介', type: 'textarea', full: true, note: '显示在前台「游戏说明」弹窗正文' },
    ] },
    { title: '运行状态', tone: 'warning', note: '运行状态与维护公告是紧急操作：保存后直接改写生效版本并写入日志，不经发布审核。', fields: [
      { key: 'status', label: '运行状态', type: 'select', options: ['正常可玩', '维护中', '即将上线', '暂不可用'] },
      { key: 'maintenanceNote', label: '维护公告文案', placeholder: '仅在「维护中」状态下展示给玩家', disabled: draft.status !== '维护中' },
      { key: 'launchAt', label: '预计上线时间', placeholder: '仅在「即将上线」状态下展示', disabled: draft.status !== '即将上线' },
    ] },
    { title: '大厅展示', fields: [
      { key: 'popular', label: '大厅热门推荐', type: 'toggle' },
      { key: 'heat', label: '热度值（0–100）', type: 'number', min: 0, max: 100 },
      { key: 'players', label: '在线人数', readOnly: true, note: '由实时统计服务写入，后台不可修改' },
    ] },
    ...(slots ? [{ title: 'Slots 玩法参数', note: '前四项显示在前台「游戏说明」弹窗；后三项前台尚未接入，留空即可。', fields: [
      { key: 'winRate', label: '中奖率', placeholder: '例如 4.8%' },
      { key: 'rtp', label: 'RTP', placeholder: '例如 96.12%' },
      { key: 'winRange', label: '中奖金额范围', placeholder: '例如 20–500,000 金币' },
      { key: 'maxMultiplier', label: '最大赔率', placeholder: '例如 x5,000' },
      { key: 'minBet', label: '最小投注', placeholder: '前台未接入', pending: true },
      { key: 'paylines', label: '赔付线数', placeholder: '前台未接入', pending: true },
      { key: 'volatility', label: '波动性', placeholder: '前台未接入', pending: true },
    ] }] : []),
  ]
}

function validateGameDraft(draft) {
  const errors = []
  if (!String(draft.name || '').trim()) errors.push('游戏名称不能为空')
  if (!(draft.tags || []).length) errors.push('至少选择一个分类标签')
  const heat = Number(draft.heat)
  if (!(Number.isFinite(heat) && heat >= 0 && heat <= 100)) errors.push('热度值必须是 0–100 的数字')
  if (!(Number(draft.sortWeight) > 0)) errors.push('排序权重必须大于 0')
  if (draft.status === '维护中' && !String(draft.maintenanceNote || '').trim()) errors.push('维护中状态必须填写维护公告文案')
  if (draft.status === '即将上线' && !String(draft.launchAt || '').trim()) errors.push('即将上线状态必须填写预计上线时间')
  errors.push(...validateRegion(draft.region))
  return errors
}

function GameEditModal({ record, store, update, journal, environment, onClose }) {
  const [draft, setDraft] = useState(() => ({ ...record, badges: record.badges.join(', ') }))
  const setField = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const sections = gameFormSections(draft)
  const errors = validateGameDraft(draft)
  const normalized = { ...draft, badges: String(draft.badges).split(',').map((x) => x.trim()).filter(Boolean), categoryLabel: categoryLabelFor(draft.tags), heat: Number(draft.heat), sortWeight: Number(draft.sortWeight) }
  const statusChanged = normalized.status !== record.status || normalized.maintenanceNote !== record.maintenanceNote
  const draftChanged = gameDraftFields.some(([key]) => JSON.stringify(normalized[key]) !== JSON.stringify(record[key]))
  const history = store.audit.filter((a) => a.targetModule === 'games' && a.targetId === record.id)
  const moduleId = `games:${environment}`
  const save = () => {
    const nextList = store.games[environment].map((g) => (g.id === record.id ? normalized : g))
    update('games', (byEnv) => ({ ...byEnv, [environment]: byEnv[environment].map((g) => (g.id === record.id ? normalized : g)) }))
    if (statusChanged) {
      journal.transform((live) => ({ ...live, live: { ...live.live, games: { ...live.live.games, [environment]: live.live.games[environment].map((g) => (g.id === record.id ? { ...g, status: normalized.status, maintenanceNote: normalized.maintenanceNote } : g)) } } }))
      journal.logAudit({ action: '变更游戏运行状态（直接生效）', target: normalized.name, targetModule: 'games', targetId: record.id, before: `${record.status}${record.maintenanceNote ? ` · ${record.maintenanceNote}` : ''}`, after: `${normalized.status}${normalized.maintenanceNote ? ` · ${normalized.maintenanceNote}` : ''}` })
      if (normalized.status === '维护中' && record.status !== '维护中') journal.addTodo({ title: `${normalized.name} 进入维护`, source: '游戏运营', priority: '高', link: { page: 'games', focusId: record.id, label: `打开 ${normalized.name} 游戏配置` } })
      if (record.status === '维护中' && normalized.status !== '维护中') {
        journal.transform((live) => ({ ...live, todo: live.todo.map((t) => (t.status !== '已解决' && t.link?.page === 'games' && t.link.focusId === record.id ? { ...t, status: '已解决', resolution: `${normalized.name} 已恢复为${normalized.status}，事项自动关闭`, time: '刚刚' } : t)) }))
      }
    }
    if (draftChanged) {
      journal.logAudit({ action: '编辑游戏配置（草稿）', target: normalized.name, targetModule: 'games', targetId: record.id, after: diffSummary(record, normalized, gameDraftFields) })
      journal.queuePublish({ name: `${normalized.name} 配置更新`, type: '游戏配置', scope: environment === 'production' ? '生产环境' : '测试环境', sourceModule: moduleId, sourceId: record.id, snapshot: { games: nextList }, todoSource: '游戏运营' })
    }
    onClose()
  }
  return <Modal wide eyebrow={`游戏配置 · ${environment === 'production' ? '生产环境' : '测试环境'}`} title={record.name} subtitle={`${record.gameId} · 当前生效状态 ${store.live.games[environment].find((g) => g.id === record.id)?.status || '—'}`} onClose={onClose}
    footer={<><span className="modal-foot-note">{statusChanged && draftChanged ? '状态立即生效，其余字段进入草稿并提交审核' : statusChanged ? '运行状态变更保存后立即生效' : draftChanged ? '保存后进入草稿，需发布审核通过才生效' : '尚未修改任何字段'}</span><button className="admin-btn subtle" onClick={onClose}>取消</button><button className="admin-btn primary" disabled={errors.length > 0 || (!statusChanged && !draftChanged)} onClick={save}>保存</button></>}>
    <div className="game-form">
      {sections.map((section) => <fieldset key={section.title} className={section.tone === 'warning' ? 'is-warning' : ''}>
        <legend>{section.title}</legend>
        {section.note && <p className="fieldset-note">{section.note}</p>}
        <div className="form-grid">{section.fields.map((field) => <label key={field.key} className={field.full || field.type === 'textarea' ? 'full' : ''}>
          {field.label}{field.pending && <em className="sample-tag">前台未接入</em>}
          <FieldEditor field={field} value={draft[field.key]} onChange={(value) => setField(field.key, value)} />
          {field.note && <small className="field-note">{field.note}</small>}
        </label>)}</div>
      </fieldset>)}
      {errors.length > 0 && <div className="admin-config-note danger"><Icon name="bolt" /><div><strong>无法保存</strong><span>{errors.join('；')}</span></div></div>}
      <fieldset><legend>最近操作</legend>{history.length ? history.slice(0, 6).map((entry) => <p className="audit-item" key={entry.id}><Icon name="clock" /><span>{entry.actor} · {entry.action}<small>{entry.time} · {entry.result}{entry.before || entry.after ? <span className="diff-pair">{entry.before || '—'} → {entry.after || '—'}</span> : null}</small></span></p>) : <p className="audit-item"><Icon name="eye" /><span>暂无操作记录</span></p>}</fieldset>
    </div>
  </Modal>
}

function GameCatalogPage({ environment, store, update, journal, intent }) {
  const items = store.games[environment]
  const moduleId = `games:${environment}`
  const [dragging, setDragging] = useState(null)
  const [view, setView] = useState('table')
  const moveItem = (targetId) => {
    if (!dragging || dragging === targetId) return
    update('games', (byEnv) => {
      const current = byEnv[environment]
      const from = current.findIndex((item) => item.id === dragging)
      const to = current.findIndex((item) => item.id === targetId)
      if (from < 0 || to < 0) return byEnv
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return { ...byEnv, [environment]: next }
    })
  }
  const togglePopular = (id) => update('games', (byEnv) => ({ ...byEnv, [environment]: byEnv[environment].map((item) => (item.id === id ? { ...item, popular: !item.popular } : item)) }))
  const differs = draftDiffers(store, moduleId)
  const saveDraft = () => {
    const label = moduleLabels[moduleId]
    journal.logAudit({ action: '保存游戏目录草稿', target: label, targetModule: 'games', targetId: environment, before: store.live.games[environment].map((g) => `${g.name}${g.popular ? '★' : ''}`).join('，'), after: items.map((g) => `${g.name}${g.popular ? '★' : ''}`).join('，') })
    journal.queuePublish({ name: `${label}排序/推荐更新`, type: '游戏配置', scope: environment === 'production' ? '生产环境' : '测试环境', sourceModule: moduleId, sourceId: environment, snapshot: { games: items }, todoSource: '游戏运营' })
  }
  const [editingId, setEditingId] = useState(intent?.focusId && items.some((game) => game.id === intent.focusId) ? intent.focusId : null)
  const openDetail = (game) => setEditingId(game.id)
  const editing = editingId ? items.find((game) => game.id === editingId) : null
  const regionText = (game) => regionSummary(game.region, countryContinent, continents.map((c) => c.code), (code) => CONTINENT_NAMES[code] ?? code)
  const headers = ['排序', '游戏名称', '游戏 ID', '分类', '状态', '可用地区', '在线人数', '热度', '大厅热门推荐']
  return <>
    <ConfigBadge store={store} moduleId={moduleId} onDiscard={() => journal.discardDraft(moduleId)} />
    <section className="admin-card catalog-summary"><div><span>当前环境</span><strong>{environment === 'production' ? '生产环境' : '测试环境'}</strong><small>草稿与生效版本按环境分开保存</small></div><div><span>目录游戏</span><strong>{items.length} 款</strong><small>草稿中正常可玩 {items.filter((item) => item.status === '正常可玩').length} 款</small></div><div><span>草稿状态</span><strong>{differs ? '有未发布变更' : '已同步'}</strong><small>{differs ? '保存后进入发布审核' : '与生效版本一致'}</small></div></section>
    <div className="drag-hint">分类统计（当前草稿）：{gameCategories.filter((c) => c.id !== 'all').map((c) => `${c.label} ${items.filter((g) => g.tags.includes(c.id)).length} 款`).join(' · ')}</div>
    <div className="catalog-toolbar"><div className="view-toggle"><button className={view === 'table' ? 'is-active' : ''} onClick={() => setView('table')}>表格视图</button><button className={view === 'cards' ? 'is-active' : ''} onClick={() => setView('cards')}>卡片视图</button></div><span className="drag-hint"><Icon name="flag" />拖拽调整排序，开关切换大厅热门推荐，点击行编辑详情</span>{differs && <button className="admin-btn primary" onClick={saveDraft}>保存草稿并提交审核</button>}</div>
    {view === 'table' ? <section className="admin-card table-card"><div className="table-top"><div><strong>游戏目录</strong><span>按 {environment === 'production' ? '生产' : '测试'} 环境排序</span></div><div className="table-actions"><button className="admin-btn subtle" disabled title="批量导入依赖资源服务，待联调">导入目录（待联调）</button><button className="admin-btn subtle" onClick={() => exportCsv(`游戏目录-${environment}`, headers, items.map((g, i) => [i + 1, g.name, g.gameId, g.categoryLabel, g.status, regionText(g), g.players, g.heat, g.popular ? '是' : '否']))}>导出 CSV</button></div></div><div className="table-wrap"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}<th>操作</th></tr></thead><tbody>{items.map((game, index) => <tr key={game.id} draggable onDragStart={() => setDragging(game.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(game.id)} onDragEnd={() => setDragging(null)} className={dragging === game.id ? 'is-dragging' : ''} onClick={() => openDetail(game)}><td><span className="drag-handle" aria-label="拖拽排序">⋮⋮</span><b className="sort-number">{index + 1}</b></td><td><span className="game-name-cell"><span className={`game-thumb thumb-${index % 4}`} /><strong>{game.name}</strong></span></td><td>{game.gameId}</td><td>{game.categoryLabel}</td><td><Status>{game.status}</Status></td><td><span className={`region-cell ${normalizeRegion(game.region).mode === 'all' ? '' : 'is-limited'}`}>{regionText(game)}</span></td><td>{game.players}</td><td><span className="heat-bar"><i style={{ width: `${game.heat}%` }} /></span><small>{game.heat || '—'}</small></td><td><button className={`toggle-switch ${game.popular ? 'is-on' : ''}`} onClick={(event) => { event.stopPropagation(); togglePopular(game.id) }} aria-pressed={game.popular} aria-label="大厅热门推荐"><i /></button></td><td><button className="row-action" onClick={(event) => { event.stopPropagation(); openDetail(game) }}>编辑</button></td></tr>)}</tbody></table></div></section> : <section className="catalog-cards">{items.map((game, index) => <article draggable key={game.id} onDragStart={() => setDragging(game.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(game.id)} onDragEnd={() => setDragging(null)} className={`game-admin-card ${dragging === game.id ? 'is-dragging' : ''}`}><span className={`game-cover cover-${index % 4}`}><b>{index + 1}</b><i>⋮⋮</i></span><div><div className="game-card-top"><Status>{game.status}</Status><small>热度 {game.heat || '—'}</small></div><h3>{game.name}</h3><p>{game.categoryLabel}</p><span>{game.players} 在线 · {game.popular ? '已推荐' : '未推荐'}</span></div><button className="row-action" onClick={() => openDetail(game)}>编辑</button></article>)}</section>}
    {editing && <GameEditModal key={editing.id} record={editing} store={store} update={update} journal={journal} environment={environment} onClose={() => setEditingId(null)} />}
  </>
}

function buildCreateRecord(page, values, note) {
  const id = `${page}-new-${stamp()}`
  if (page === 'publish') return { id, name: `${values[0]} ${values[1]}`.trim(), type: '系统配置', scope: values[3] || values[2], status: '待审核', owner: '运营管理员', time: '刚刚', sourceModule: '', sourceId: '', snapshot: null, note }
  if (page === 'activities') return { id, name: values[0], type: values[1], period: '待定', status: '草稿', participants: '—', owner: '产品组', note }
  if (page === 'checkin') return { id, name: values[0], period: values[1], participants: '—', status: '草稿', budget: values[2], owner: '产品组', note }
  if (page === 'wheel') return { id, name: values[0], prizeCount: `${values[2]} 个奖项`, freeSpins: values[1], status: '草稿', probabilityState: '概率未配置', version: values[3], note }
  if (page === 'adminUsers') return { id, name: values[0], email: values[1], role: values[2], status: '待激活', scope: values[3], lastLogin: '从未登录', mfa: false, note }
  return { id, name: values[0], note }
}

const splitBundle = (bundle) => { const match = String(bundle).match(/^(.*)\s(v[\d.]+)$/); return match ? [match[1], match[2]] : [bundle, 'v1.0.0'] }

function describeGeneric(page, record, store, { update, journal }) {
  const cols = columns[page]
  const label0 = record[cols[0][0]]
  const pageTransitions = transitions[page]?.[record.status] || []
  const history = store.audit.filter((a) => a.targetModule === page && a.targetId === record.id)
  const actions = pageTransitions.map(([label, nextStatus, opts = {}]) => ({
    label, tone: nextStatus && statusClass(nextStatus) === 'danger' ? 'danger' : opts.requireReason ? 'warning' : opts.decision === 'approve' ? 'primary' : 'subtle', requireReason: !!opts.requireReason,
    run: (reason) => {
      if (page === 'publish' && opts.decision) { journal.transform((s) => applyRelease(s, record, opts.decision, reason, { seq: Date.now() })); return }
      if (!opts.logOnly) update(page, (list) => list.map((r) => (r.id === record.id ? { ...r, status: nextStatus, ...(opts.metric ? { metric: opts.metric } : {}), time: '刚刚' } : r)))
      journal.logAudit({ action: label, target: label0, targetModule: page, targetId: record.id, before: record.status, after: opts.logOnly ? record.status : nextStatus, result: opts.resultLabel || (reason ? `成功 · 原因：${reason}` : '成功') })
      if (opts.effect === 'createVersion') {
        const [game, version] = splitBundle(record.bundle)
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
    if (page === 'publish') fields.push({ key: 'sourceModule', label: '来源模块', value: moduleLabels[record.sourceModule] || (record.sourceModule ? pageMeta[record.sourceModule]?.[0] : '') || '—', readOnly: true }, { key: 'snapshot', label: '配置快照', value: record.snapshot ? '有 · 审核通过后覆盖生效版本' : '无 · 仅变更任务状态', readOnly: true }, { key: 'note', label: '发布说明', value: record.note || '—', readOnly: true })
    const diff = page === 'publish' && record.snapshot && isConfigModule(record.sourceModule) ? snapshotDiff(record.sourceModule, getSlice(store.live, record.sourceModule), record.snapshot) : page === 'publish' ? [] : null
    const sourcePage = page === 'publish' ? moduleToPage(record.sourceModule) : null
    const allActions = sourcePage && navigate ? [...actions, { label: '查看来源配置', tone: 'subtle', run: () => navigate(sourcePage) }] : actions
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
    const values = action.fields.map((f) => formValues[f].trim())
    const record = buildCreateRecord(page, values, formValues.note || '')
    update(page, (list) => [record, ...list])
    journal.logAudit({ action: action.label, target: record[cols[0][0]], targetModule: page, targetId: record.id, after: values.join(' / '), result: formValues.note ? `成功 · 备注：${formValues.note}` : '成功' })
    setShowForm(false); setFormValues({})
  }
  return <>
    {configurationNotes[page] && <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes[page][0]}</span><small>{configurationNotes[page][1]}</small></div></div>}
    <div className="admin-toolbar"><div className="admin-search"><Icon name="eye" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPageIndex(0) }} placeholder={`搜索${meta[0]}...`} /></div><select value={filter} onChange={(event) => { setFilter(event.target.value); setPageIndex(0) }}><option>全部状态</option>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select>{action && <button className="admin-btn primary" onClick={() => setShowForm(true)}><Icon name={action.icon} />{action.label}</button>}</div>
    <section className="admin-card table-card"><div className="table-top"><div><strong>{meta[0]}列表</strong><span>共 {filteredRows.length} 条</span></div><div className="table-actions"><button className="admin-btn subtle" onClick={() => exportCsv(meta[0], labels, filteredRows.map((row) => cols.map(([key]) => row[key])))}>导出 CSV</button></div></div><div className="table-wrap"><table><thead><tr>{labels.map((label) => <th key={label}>{label}</th>)}<th>操作</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} onClick={() => openRow(row)}>{cols.map(([key]) => <td key={key}>{statusValues.includes(row[key]) ? <Status>{row[key]}</Status> : <span>{row[key]}</span>}</td>)}<td><button className="row-action" onClick={(event) => { event.stopPropagation(); openRow(row) }}>查看详情</button></td></tr>)}</tbody></table>{!filteredRows.length && <div className="empty-state"><Icon name="eye" /><strong>没有匹配数据</strong><p>请调整搜索关键词或筛选条件。</p></div>}</div><Pager page={pageIndex} total={filteredRows.length} onChange={setPageIndex} /></section>
    {showForm && action && <Modal eyebrow="配置草稿" title={action.title} onClose={() => setShowForm(false)} footer={<><button className="admin-btn subtle" onClick={() => setShowForm(false)}>取消</button><button className="admin-btn primary" disabled={!formComplete} onClick={submitCreate}>保存草稿</button></>}><div className="form-grid">{action.fields.map((f) => <label key={f}>{f}<input value={formValues[f] || ''} onChange={(event) => setFormValues((v) => ({ ...v, [f]: event.target.value }))} placeholder={`请输入${f}（必填）`} /></label>)}<label className="full">备注<textarea value={formValues.note || ''} onChange={(event) => setFormValues((v) => ({ ...v, note: event.target.value }))} placeholder="填写配置说明、目标人群和发布备注，会写入操作日志" /></label></div></Modal>}
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
    <div className="admin-config-note"><Icon name="shield" /><div><strong>事项状态的含义</strong><span>待处理 = 尚无人认领；处理中 = 已认领，认领人显示在负责人列；已解决 = 已填写处理结论并关闭。</span><small>「去处理」跳转到该事项对应的对象（游戏、发布任务、订单或玩家）。关联发布任务被通过或驳回、游戏从维护中恢复运行时，对应事项会自动关闭，无需手动标记。</small></div></div>
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

function VersionWorkflowPage({ page, onOpen, store, update, journal }) {
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
      ? { id: `uploads-${stamp()}`, recordId: `UP-${stamp().slice(0, 8)}`, bundle: `${form.game} ${form.version.trim()}`, file: form.fileName, status: '检查中', uploader: '运营管理员', time: '刚刚' }
      : page === 'versions' ? { id: `versions-${stamp()}`, game: form.game, version: `${form.version.trim()} · ${form.build.trim()}`, production: '—', status: '待审核', scope: '生产环境', time: '刚刚' }
        : { id: `${page}-${stamp()}`, version: `${form.game} ${form.version.trim()}`, build: form.build.trim(), env: page === 'test' ? '测试环境' : '生产环境', status: page === 'test' ? '测试中' : '待审核', metric: page === 'test' ? '待 QA 验证' : '待审核', time: '刚刚' }
    update(page, (list) => [record, ...list])
    journal.logAudit({ action: action.label, target: record.bundle || `${record.game || record.version}`, targetModule: page, targetId: record.id, after: `${form.game} ${form.version.trim()} / ${form.build.trim()}`, result: form.note ? `成功 · 发布说明：${form.note}` : '成功' })
    if (page === 'versions' || page === 'production') journal.queuePublish({ name: `${form.game} ${form.version.trim()} 生产发布`, type: '游戏版本', scope: '生产环境', sourceModule: page, sourceId: record.id, note: form.note, todoSource: '游戏运营' })
    setShowUpload(false)
  }
  const openRow = (record) => {
    const { label0, history, actions } = describeGeneric(page, record, store, { update, journal })
    onOpen({ id: `${page}-${record.id}`, eyebrow: `${pageMeta[page][0]}详情`, title: label0, status: record.status, history, actions, fields: columns[page].filter(([key]) => key !== 'status').map(([key, label]) => ({ key, label, value: record[key], readOnly: true })) })
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
    {showUpload && <Modal eyebrow="版本发布流程" title={action.title} onClose={() => setShowUpload(false)} footer={<><button className="admin-btn subtle" onClick={() => setShowUpload(false)}>取消</button><button className="admin-btn primary" disabled={!formComplete} onClick={save}>{isUpload ? '开始上传并检查' : '保存发布任务'}</button></>}><div className="form-grid"><label>选择游戏<select value={form.game} onChange={(event) => setForm((f) => ({ ...f, game: event.target.value }))}>{games.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}</select></label><label>版本号（必填）<input value={form.version} onChange={(event) => setForm((f) => ({ ...f, version: event.target.value }))} placeholder="例如 v2.5.0" /></label><label>构建号（必填）<input value={form.build} onChange={(event) => setForm((f) => ({ ...f, build: event.target.value }))} placeholder="例如 build 9930" /></label>{isUpload ? <label>上传版本包（必填）<input type="file" onChange={(event) => setForm((f) => ({ ...f, fileName: event.target.files?.[0] ? `${event.target.files[0].name} · ${(event.target.files[0].size / 1048576).toFixed(1)} MB` : '' }))} /></label> : <label>发布说明<input value={form.note} onChange={(event) => setForm((f) => ({ ...f, note: event.target.value }))} placeholder="变更范围与回滚计划" /></label>}<label className="full upload-check"><span>上传后的自动检查（待联调）</span><small>文件完整性 · 入口文件 · 资源类型 · 版本号 · 路径安全，由服务端执行；原型中由操作员在记录上手动标记校验结果</small>{form.fileName && <em>{form.fileName}</em>}</label></div></Modal>}
  </>
}

function GameVersionCenterPage({ onOpen, store, update, journal }) {
  const [tab, setTab] = useState('versions')
  const tabs = [['versions', '版本记录'], ['uploads', '上传记录'], ['test', '测试环境'], ['production', '生产环境']]
  return <>
    <div className="catalog-toolbar"><div className="view-toggle">{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div></div>
    <VersionWorkflowPage key={tab} page={tab} onOpen={onOpen} store={store} update={update} journal={journal} />
  </>
}

function ReleaseCenterPage({ onOpen, store, update, journal, navigate }) {
  const pending = store.publish.filter((p) => p.status === '待审核').length
  const testing = store.test.filter((t) => t.status === '测试中').length
  const graying = store.publish.filter((p) => p.status === '灰度 20%' || p.status === '进行中').length
  const published = store.publish.filter((p) => p.status === '已发布').length
  return <>
    <div className="release-metrics"><div><span>待审核</span><strong>{pending}</strong><small>需要人工判定</small></div><div><span>测试中</span><strong>{testing}</strong><small>需要 QA 验证</small></div><div><span>灰度发布</span><strong>{graying}</strong><small>当前进行中</small></div><div><span>生产发布</span><strong>{published}</strong><small>累计已发布</small></div></div>
    <section className="admin-card release-guide"><div className="card-heading"><div><h2>发布任务流程</h2><p>带快照的任务：通过 = 覆盖生效版本；驳回 = 丢弃来源草稿；回滚 = 恢复上一生效版本。</p></div><span className="release-safety"><Icon name="shield" />生产发布需审批</span></div><div className="release-guide-steps"><div className="is-done"><b>1</b><span>创建任务</span><small>模块保存草稿</small></div><i /><div className="is-done"><b>2</b><span>自动检查</span><small>通过时再次校验快照</small></div><i /><div className="is-active"><b>3</b><span>审核判定</span><small>通过 / 灰度 / 驳回</small></div><i /><div><b>4</b><span>已发布</span><small>可暂停或回滚</small></div></div></section>
    <GenericPage page="publish" onOpen={onOpen} store={store} update={update} journal={journal} navigate={navigate} />
    <section className="admin-card release-history"><div className="card-heading"><div><h2>版本健康度 <em className="sample-tag">示例数据</em></h2><p>发布后的实时质量观察，监控接口待联调</p></div><button className="admin-link" disabled title="监控平台待联调">查看监控（待联调）</button></div><div className="health-grid"><div><span>启动成功率</span><strong>99.6%</strong><em>↑ 0.8%</em></div><div><span>资源加载失败</span><strong>0.12%</strong><em>↓ 0.04%</em></div><div><span>累计回滚</span><strong>{store.publish.filter((p) => p.status === '已回滚').length}</strong><em>来自发布审核记录</em></div></div></section>
  </>
}

const roleFieldLabels = [['menuScope', '菜单范围'], ['actions', '可执行操作'], ['prodPermission', '生产权限']]
function describeRole(record, store, { update, journal }) {
  return {
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

function WinsPage({ store, update, journal }) {
  const [tab, setTab] = useState('rank')
  const rankings = useMemo(() => aggregateWinnerRankings(store.winEvents.filter((e) => e.visible)), [store.winEvents])
  const events = store.winEvents
  const chestAll = [...store.chestOpenings].sort((a, b) => b.rewardCoins - a.rewardCoins || a.id.localeCompare(b.id))
  const chestVisible = chestAll.filter((c) => c.visible).slice(0, store.winsConfig.chestLimit).map((c) => c.id)
  const toggleWin = (id) => { const item = events.find((e) => e.id === id); update('winEvents', (list) => list.map((e) => (e.id === id ? { ...e, visible: !e.visible } : e))); journal.logAudit({ action: item.visible ? '隐藏中奖事件' : '恢复展示中奖事件', target: `${item.name} · ${gameName(item.gameId)} · ${item.coins.toLocaleString('en-US')} 金币`, targetModule: 'wins', targetId: id, before: item.visible ? '已展示' : '已隐藏', after: item.visible ? '已隐藏' : '已展示' }) }
  const toggleChest = (id) => { const item = store.chestOpenings.find((c) => c.id === id); update('chestOpenings', (list) => list.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))); journal.logAudit({ action: item.visible ? '隐藏开箱事件' : '恢复展示开箱事件', target: `${item.name} · ${item.rewardCoins.toLocaleString('en-US')} 金币`, targetModule: 'wins', targetId: id, before: item.visible ? '已展示' : '已隐藏', after: item.visible ? '已隐藏' : '已展示' }) }
  const setLimit = (key, max) => (event) => update('winsConfig', (config) => ({ ...config, [key]: Math.min(max, Math.max(1, Number(event.target.value) || 1)) }))
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>{configurationNotes.wins[0]}</strong><span>{configurationNotes.wins[1]}</span></div></div>
    <div className="catalog-toolbar"><div className="view-toggle"><button className={tab === 'rank' ? 'is-active' : ''} onClick={() => setTab('rank')}>大厅赢家榜与最近中奖</button><button className={tab === 'chest' ? 'is-active' : ''} onClick={() => setTab('chest')}>明日宝箱幸运榜单</button></div><span className="drag-hint">已隐藏 {events.filter((e) => !e.visible).length + store.chestOpenings.filter((c) => !c.visible).length} 条事件</span></div>
    {tab === 'rank' ? <>
      <section className="admin-card table-card"><div className="table-top"><div><strong>今日赢家榜</strong><span>按累计中奖金币排序，代表游戏取最近一次事件，仅统计已展示事件</span></div><label className="environment-select"><span>展示上限（前台固定 10）</span><input type="number" min="1" max="10" value={store.winsConfig.rankLimit} onChange={setLimit('rankLimit', 10)} style={{ width: 44, border: 0 }} /></label></div><div className="table-wrap"><table><thead><tr><th>排名</th><th>玩家昵称</th><th>代表游戏</th><th>累计中奖金币</th><th>展示状态</th></tr></thead><tbody>{rankings.slice(0, store.winsConfig.rankLimit).map((r, i) => <tr key={r.playerId}><td>{i + 1}</td><td>{r.name}</td><td>{gameName(r.gameId)}</td><td>{r.coins.toLocaleString('en-US')}</td><td><Status>已展示</Status></td></tr>)}</tbody></table>{!rankings.length && <div className="empty-state"><Icon name="eye" /><strong>没有可展示的事件</strong></div>}</div></section>
      <section className="admin-card table-card"><div className="table-top"><div><strong>最近中奖</strong><span>按事件时间倒序，事件 ID 唯一去重；关闭展示会同时影响榜单聚合与前台弹幕</span></div></div><div className="table-wrap"><table><thead><tr><th>事件 ID</th><th>玩家昵称</th><th>游戏</th><th>中奖金币</th><th>展示状态</th></tr></thead><tbody>{events.map((e) => <tr key={e.id} className={e.visible ? '' : 'is-hidden-row'}><td>{e.id}</td><td>{e.name}</td><td>{gameName(e.gameId)}</td><td>{e.coins.toLocaleString('en-US')}</td><td><button className={`toggle-switch ${e.visible ? 'is-on' : ''}`} onClick={() => toggleWin(e.id)} aria-pressed={e.visible} aria-label="展示状态"><i /></button></td></tr>)}</tbody></table></div></section>
    </> : <section className="admin-card table-card"><div className="table-top"><div><strong>明日宝箱幸运榜单</strong><span>按奖励金币降序，最多 5 条进入前台榜单；隐藏的事件保留在此可恢复</span></div><label className="environment-select"><span>展示上限（前台固定 5）</span><input type="number" min="1" max="5" value={store.winsConfig.chestLimit} onChange={setLimit('chestLimit', 5)} style={{ width: 44, border: 0 }} /></label></div><div className="table-wrap"><table><thead><tr><th>榜单位次</th><th>玩家昵称</th><th>中奖金币</th><th>展示状态</th></tr></thead><tbody>{chestAll.map((c) => <tr key={c.id} className={c.visible ? '' : 'is-hidden-row'}><td>{chestVisible.includes(c.id) ? chestVisible.indexOf(c.id) + 1 : '—'}</td><td>{c.name}</td><td>{c.rewardCoins.toLocaleString('en-US')}</td><td><button className={`toggle-switch ${c.visible ? 'is-on' : ''}`} onClick={() => toggleChest(c.id)} aria-pressed={c.visible} aria-label="展示状态"><i /></button></td></tr>)}</tbody></table></div></section>}
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

// ---- shared config editors ------------------------------------------------
// Used by both the dedicated config pages and the activity modal, so the two can never drift apart.
const checkinStateLabel = { claimed: '已领取', missed: '漏签', today: '今日可领', locked: '未解锁' }
const checkinStepClass = { claimed: 'done', today: 'active', missed: 'missed', locked: '' }

function CheckinLadderEditor({ days, onChange }) {
  const updateDay = (index, patch) => onChange(days.map((d, i) => (i === index ? { ...d, ...patch, reward: formatReward(patch.coins ?? d.coins, patch.gems ?? d.gems) } : d)))
  const steps = []
  days.forEach((d, i) => {
    if (i > 0) steps.push(<i key={`line-${i}`} />)
    steps.push(<div key={d.day} className={`workflow-step ${checkinStepClass[d.state]}`}><b>{i + 1}</b><span>{d.day.split(' ')[0]}{d.grand ? ' · 大奖' : ''}</span></div>)
  })
  return <>
    <div className="workflow-strip">{steps}</div>
    <div className="table-wrap"><table><thead><tr><th>天数</th><th>金币</th><th>宝石</th><th>大奖</th><th>示例玩家进度（非配置）</th></tr></thead><tbody>{days.map((d, i) => <tr key={d.day}>
      <td>{d.day}</td>
      <td><input className="ladder-input" type="number" min="0" value={d.coins} onChange={(event) => updateDay(i, { coins: Number(event.target.value) || 0 })} /></td>
      <td><input className="ladder-input" type="number" min="0" value={d.gems} onChange={(event) => updateDay(i, { gems: Number(event.target.value) || 0 })} /></td>
      <td><button className={`toggle-switch ${d.grand ? 'is-on' : ''}`} onClick={() => updateDay(i, { grand: !d.grand })} aria-pressed={!!d.grand} aria-label="大奖"><i /></button></td>
      <td><Status>{checkinStateLabel[d.state]}</Status></td>
    </tr>)}</tbody></table></div>
  </>
}

function WheelPrizeEditor({ prizes, freeSpins, onChange }) {
  const emit = (patch) => onChange({ prizes, freeSpins, ...patch })
  const updatePrize = (id, patch) => emit({ prizes: prizes.map((p) => (p.id === id ? { ...p, ...patch, label: prizeLabel(patch.kind ?? p.kind, patch.amount ?? p.amount) } : p)) })
  const total = prizes.reduce((sum, p) => sum + (Number(p.probability) || 0), 0)
  return <>
    <div className={`admin-config-note ${wheelBalanced(prizes) ? '' : 'danger'}`}><Icon name={wheelBalanced(prizes) ? 'shield' : 'bolt'} /><div><strong>概率总和：{total}%{wheelBalanced(prizes) ? '' : '（必须为 100%）'}</strong><span>前台固定 {WHEEL_SLOTS} 格，当前 {prizes.length} 格；概率必须是 0–100 的整数。</span></div></div>
    <div className="prize-list">{prizes.map((p, index) => <div className="prize-row wide" key={p.id}>
      <span className="prize-index">第 {index + 1} 格</span>
      <select className="ladder-input" value={p.kind} onChange={(event) => updatePrize(p.id, { kind: event.target.value })}><option value="coins">金币</option><option value="gems">宝石</option><option value="freeSpin">免费旋转</option></select>
      <input className="ladder-input" type="number" min="1" value={p.amount} onChange={(event) => updatePrize(p.id, { amount: Number(event.target.value) || 0 })} />
      <input type="number" min="0" max="100" step="1" value={p.probability} onChange={(event) => updatePrize(p.id, { probability: Math.max(0, Math.min(100, Math.round(Number(event.target.value) || 0))) })} />
      <span className="pct">概率 %</span>
      <button className="admin-btn subtle" onClick={() => emit({ prizes: prizes.filter((x) => x.id !== p.id) })}>删除</button>
    </div>)}</div>
    <div className="editor-actions">
      <button className="admin-btn subtle" disabled={prizes.length >= WHEEL_SLOTS} onClick={() => emit({ prizes: [...prizes, { id: `prize-${stamp()}`, label: '100 金币', kind: 'coins', amount: 100, probability: 0 }] })}><Icon name="gift" />新增奖项（上限 {WHEEL_SLOTS} 格）</button>
      <label className="inline-field">每日免费次数<input className="ladder-input" type="number" min="0" step="1" value={freeSpins} onChange={(event) => emit({ freeSpins: Math.max(0, Math.round(Number(event.target.value) || 0)) })} /></label>
    </div>
  </>
}

function MissionListEditor({ missions, removableIds, onChange }) {
  const updateMission = (id, patch) => onChange(missions.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  return <>
    <div className="editor-actions"><button className="admin-btn subtle" onClick={() => onChange([{ id: `mission-${stamp()}`, name: '', event: missionEventOptions[0], target: 1, coinReward: 500, gemReward: 1, cycle: '每日', status: '生效中', expired: false }, ...missions])}><Icon name="flag" />新建任务</button></div>
    <div className="table-wrap"><table><thead><tr><th>任务名称</th><th>目标事件</th><th>目标值</th><th>状态</th><th>金币奖励</th><th>宝石奖励</th><th>刷新周期</th><th>操作</th></tr></thead><tbody>{missions.map((m) => <tr key={m.id}>{m.expired
      ? <><td>{m.name}</td><td>{m.event}</td><td>{m.target}</td><td><Status>{m.status}</Status></td><td>{m.coinReward}</td><td>{m.gemReward}</td><td>{m.cycle}</td><td>—</td></>
      : <>
        <td><input className="ladder-input" value={m.name} placeholder="任务名称（必填）" onChange={(event) => updateMission(m.id, { name: event.target.value })} /></td>
        <td><select className="ladder-input" value={m.event} onChange={(event) => updateMission(m.id, { event: event.target.value })}>{missionEventOptions.map((o) => <option key={o}>{o}</option>)}</select></td>
        <td><input className="ladder-input" type="number" min="1" step="1" value={m.target} onChange={(event) => updateMission(m.id, { target: Math.max(1, Math.round(Number(event.target.value) || 1)) })} /></td>
        <td><Status>{m.status}</Status></td>
        <td><input className="ladder-input" type="number" min="0" value={m.coinReward} onChange={(event) => updateMission(m.id, { coinReward: Math.max(0, Number(event.target.value) || 0) })} /></td>
        <td><input className="ladder-input" type="number" min="0" value={m.gemReward} onChange={(event) => updateMission(m.id, { gemReward: Math.max(0, Number(event.target.value) || 0) })} /></td>
        <td>每日</td>
        <td><button className="row-action" onClick={() => updateMission(m.id, { status: m.status === '生效中' ? '已下线' : '生效中' })}>{m.status === '生效中' ? '下线' : '上线'}</button>{!removableIds.includes(m.id) && <button className="row-action" onClick={() => onChange(missions.filter((x) => x.id !== m.id))}>移除</button>}</td>
      </>}</tr>)}</tbody></table></div>
  </>
}

function CheckinPage({ onOpen, store, update, journal, navigate }) {
  const days = store.checkinDays
  const errors = validateCheckin(days)
  const differs = draftDiffers(store, 'checkin')
  const sum = (list, key) => list.reduce((total, d) => total + d[key], 0)
  const saveDraft = () => {
    journal.logAudit({ action: '保存签到奖励草稿', target: '七日签到 · 秋日版', targetModule: 'checkin', targetId: 'ladder', before: store.live.checkinDays.map((d) => d.reward).join(' / '), after: days.map((d) => d.reward).join(' / ') })
    journal.queuePublish({ name: '七日签到 · 秋日版奖励调整', type: '活动版本', scope: '生产环境', sourceModule: 'checkin', sourceId: 'ladder', snapshot: getSlice(store, 'checkin'), todoSource: '活动中心' })
  }
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes.checkin[0]}</span><small>{configurationNotes.checkin[1]}</small></div></div>
    <ConfigBadge store={store} moduleId="checkin" onDiscard={() => journal.discardDraft('checkin')} />
    <section className="admin-card"><div className="card-heading"><div><h2>本期签到奖励梯度（草稿）</h2><p>七日签到 · 秋日版 · 生效版本满签总额 {sum(store.live.checkinDays, 'coins').toLocaleString('en-US')} 金币 / {sum(store.live.checkinDays, 'gems')} 宝石；草稿 {sum(days, 'coins').toLocaleString('en-US')} 金币 / {sum(days, 'gems')} 宝石</p></div>{differs && <button className="admin-btn primary" disabled={errors.length > 0} onClick={saveDraft}>保存草稿并提交审核</button>}</div>
      {errors.length > 0 && <div className="admin-config-note danger"><Icon name="bolt" /><div><strong>无法保存</strong><span>{errors.join('；')}</span></div></div>}
      <CheckinLadderEditor days={days} onChange={(next) => update('checkinDays', () => next)} />
    </section>
    <GenericPage page="checkin" onOpen={onOpen} store={store} update={update} journal={journal} navigate={navigate} />
  </>
}

function WheelPage({ onOpen, store, update, journal, navigate }) {
  const live = store.live
  const errors = validateWheel({ prizes: store.wheelPrizes, freeSpins: store.wheelFreeSpins })
  const differs = draftDiffers(store, 'wheel')
  const saveDraft = () => {
    const nextVersion = live.wheelVersion + 1
    update('wheelVersion', () => nextVersion)
    journal.logAudit({ action: '保存幸运转盘草稿', target: '幸运旋转狂欢季 · 主转盘', targetModule: 'wheel', targetId: 'main', before: `v${live.wheelVersion} 概率 [${live.wheelPrizes.map((p) => p.probability).join(',')}] 免费 ${live.wheelFreeSpins}`, after: `v${nextVersion} 概率 [${store.wheelPrizes.map((p) => p.probability).join(',')}] 免费 ${store.wheelFreeSpins}` })
    journal.queuePublish({ name: `幸运旋转狂欢季 · 主转盘 v${nextVersion}`, type: '活动版本', scope: '生产环境', sourceModule: 'wheel', sourceId: 'main', snapshot: { ...getSlice(store, 'wheel'), wheelVersion: nextVersion }, todoSource: '活动中心' })
  }
  const wheelRows = store.wheel.map((row, index) => (index === 0 ? { ...row, prizeCount: `${live.wheelPrizes.length} 个奖项`, freeSpins: `${live.wheelFreeSpins} 次 / 日`, probabilityState: wheelBalanced(live.wheelPrizes) ? '概率已校验' : '概率未通过', version: `v${live.wheelVersion}` } : row))
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes.wheel[0]}</span><small>{configurationNotes.wheel[1]}</small></div></div>
    <ConfigBadge store={store} moduleId="wheel" versionText={`v${live.wheelVersion}`} onDiscard={() => journal.discardDraft('wheel')} />
    <section className="admin-card"><div className="card-heading"><div><h2>幸运旋转狂欢季 · 主转盘（草稿）</h2><p>{store.wheelPrizes.length} / {WHEEL_SLOTS} 个奖项 · 每日 {store.wheelFreeSpins} 次免费 · 生效版本 v{live.wheelVersion}{differs ? ` → 保存后将生成 v${live.wheelVersion + 1}` : ''}</p></div>{differs && <button className="admin-btn primary" disabled={errors.length > 0} onClick={saveDraft}>保存草稿并提交审核</button>}</div>
      {errors.length > 0 && <div className="admin-config-note danger"><Icon name="bolt" /><div><strong>无法保存</strong><span>{errors.join('；')}</span></div></div>}
      <WheelPrizeEditor prizes={store.wheelPrizes} freeSpins={store.wheelFreeSpins} onChange={({ prizes, freeSpins }) => { update('wheelPrizes', () => prizes); update('wheelFreeSpins', () => freeSpins) }} />
      <p className="editor-hint">版本号在保存时按生效版本自动 +1，不可手工输入。</p>
    </section>
    <GenericPage page="wheel" onOpen={onOpen} store={{ ...store, wheel: wheelRows }} update={update} journal={journal} navigate={navigate} />
  </>
}

function MissionsPage({ store, update, journal }) {
  const missions = store.missions
  const errors = validateMissions(missions)
  const differs = draftDiffers(store, 'missions')
  const summary = (list) => list.filter((m) => !m.expired).map((m) => `${m.name}(${m.target}/${m.coinReward}/${m.gemReward}/${m.status})`).join('，')
  const saveDraft = () => {
    journal.logAudit({ action: '保存每日任务草稿', target: '每日任务列表', targetModule: 'missions', targetId: 'all', before: summary(store.live.missions), after: summary(missions) })
    journal.queuePublish({ name: '每日任务配置更新', type: '活动版本', scope: '生产环境', sourceModule: 'missions', sourceId: 'all', snapshot: getSlice(store, 'missions'), todoSource: '活动中心' })
  }
  const expectedCount = liteContent.events.dailyMissionCount
  const activeCount = missions.filter((m) => m.status === '生效中').length
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes.missions[0]}</span><small>{configurationNotes.missions[1]}</small></div></div>
    <ConfigBadge store={store} moduleId="missions" onDiscard={() => journal.discardDraft('missions')} />
    {activeCount !== expectedCount && <div className="admin-config-note danger"><Icon name="bolt" /><div><strong>生效任务数与配置基线不一致</strong><span>当前草稿生效 {activeCount} 个，基线为 {expectedCount} 个（liteContent.events.dailyMissionCount）。</span></div></div>}
    {errors.length > 0 && <div className="admin-config-note danger"><Icon name="bolt" /><div><strong>无法保存</strong><span>{errors.join('；')}</span></div></div>}
    <section className="admin-card table-card"><div className="table-top"><div><strong>每日任务列表（草稿）</strong><span>共 {missions.length} 条 · 已过期任务不可编辑</span></div>{differs && <button className="admin-btn primary" disabled={errors.length > 0} onClick={saveDraft}>保存草稿并提交审核</button>}</div>
      <MissionListEditor missions={missions} removableIds={store.live.missions.map((m) => m.id)} onChange={(next) => update('missions', () => next)} />
    </section>
  </>
}

// ---- 多语言内容 -----------------------------------------------------------
// 管理的是玩家侧文案；后台界面本身是中文，不参与翻译。
const SOURCE_LOCALE = 'zh-Hans'
const FALLBACK = 'en'

function placeholdersOf(text) {
  return [...String(text ?? '').matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')
}

function TranslationEditor({ entryKey, entry, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({ ...entry }))
  const errors = validateTranslations({ [entryKey]: draft })
  const dirty = translationLocales.some(({ code }) => (draft[code] ?? '') !== (entry[code] ?? ''))
  const source = draft[FALLBACK] ?? ''
  return <Modal wide eyebrow="玩家侧文案" title={entryKey} subtitle={`共 ${translationLocales.length} 种语言 · 英文为兜底，缺翻译时玩家看到英文`} onClose={onClose}
    footer={<><span className="modal-foot-note">{dirty ? '保存后进入草稿，需发布审核通过才对玩家生效' : '尚未修改'}</span><button className="admin-btn subtle" onClick={onClose}>取消</button><button className="admin-btn primary" disabled={!dirty || errors.length > 0} onClick={() => { onSave(draft); onClose() }}>保存</button></>}>
    <div className="game-form">
      <fieldset><legend>源文案</legend><p className="fieldset-note">中文与英文是这条文案的基准。英文不能为空，其他语言以它为兜底。</p>
        <div className="translation-rows">
          {[SOURCE_LOCALE, FALLBACK].map((code) => {
            const meta = translationLocales.find((l) => l.code === code)
            return <label className="translation-row is-source" key={code}>
              <span className="translation-locale">{meta?.nativeName}<small>{code}</small></span>
              <textarea value={draft[code] ?? ''} dir={meta?.dir} onChange={(event) => setDraft((d) => ({ ...d, [code]: event.target.value }))} />
            </label>
          })}
        </div>
      </fieldset>
      <fieldset><legend>其他语言</legend><p className="fieldset-note">留空表示尚未翻译，玩家会看到英文。占位符必须与英文一致{source.includes('{') ? `（本条含 ${placeholdersOf(source).split(',').map((p) => `{${p}}`).join(' ')}）` : ''}。</p>
        <div className="translation-rows">
          {translationLocales.filter(({ code }) => code !== SOURCE_LOCALE && code !== FALLBACK).map(({ code, nativeName, dir }) => {
            const value = draft[code] ?? ''
            const mismatch = value.trim() && placeholdersOf(value) !== placeholdersOf(source)
            return <label className={`translation-row ${value.trim() ? '' : 'is-empty'} ${mismatch ? 'is-bad' : ''}`} key={code}>
              <span className="translation-locale">{nativeName}<small>{code}</small></span>
              <textarea value={value} dir={dir} placeholder="未翻译 · 玩家看到英文" onChange={(event) => setDraft((d) => ({ ...d, [code]: event.target.value }))} />
            </label>
          })}
        </div>
      </fieldset>
      {errors.length > 0 && <div className="admin-config-note danger"><Icon name="bolt" /><div><strong>无法保存</strong><span>{errors.join('；')}</span></div></div>}
    </div>
  </Modal>
}

function TranslationsPage({ store, update, journal }) {
  const entries = store.translations
  const keys = useMemo(() => Object.keys(entries).sort(), [entries])
  const [namespace, setNamespace] = useState('all')
  const [locale, setLocale] = useState('zh-Hant')
  const [onlyMissing, setOnlyMissing] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null)

  const namespaces = useMemo(() => [...new Set(keys.map(translationNamespace))].sort(), [keys])
  const coverage = useMemo(() => translationLocales.map(({ code, nativeName }) => {
    const done = keys.filter((key) => String(entries[key][code] ?? '').trim()).length
    return { code, nativeName, done, total: keys.length, percent: keys.length ? Math.round((done / keys.length) * 100) : 0 }
  }), [entries, keys])

  const filtered = keys.filter((key) => {
    if (namespace !== 'all' && translationNamespace(key) !== namespace) return false
    if (onlyMissing && String(entries[key][locale] ?? '').trim()) return false
    if (query && !`${key} ${entries[key][SOURCE_LOCALE] ?? ''} ${entries[key][FALLBACK] ?? ''}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const differs = draftDiffers(store, 'translations')
  const errors = validateTranslations(entries)
  const activeMeta = translationLocales.find((l) => l.code === locale)

  const saveEntry = (key) => (next) => {
    const before = entries[key]
    update('translations', (current) => ({ ...current, [key]: next }))
    const changed = translationLocales.filter(({ code }) => (next[code] ?? '') !== (before[code] ?? '')).map(({ code }) => code)
    journal.logAudit({ action: '编辑玩家侧文案（草稿）', target: key, targetModule: 'translations', targetId: key,
      before: changed.map((c) => `${c}=${before[c] || '空'}`).join('；'), after: changed.map((c) => `${c}=${next[c] || '空'}`).join('；') })
  }
  const saveDraft = () => {
    const done = coverage.filter((c) => c.done > 0).length
    journal.logAudit({ action: '保存多语言内容草稿', target: '玩家侧文案', targetModule: 'translations', targetId: 'all',
      before: `${keys.length} 键`, after: `${keys.length} 键 · ${done}/${translationLocales.length} 种语言有翻译` })
    journal.queuePublish({ name: '玩家侧文案更新', type: '内容版本', scope: '生产环境', sourceModule: 'translations', sourceId: 'all', snapshot: getSlice(store, 'translations'), todoSource: '内容与语言' })
  }
  const exportCurrent = () => exportCsv(`玩家侧文案-${locale}`, ['键', '命名空间', '简体中文', '英文', activeMeta?.nativeName ?? locale],
    filtered.map((key) => [key, translationNamespace(key), entries[key][SOURCE_LOCALE] ?? '', entries[key][FALLBACK] ?? '', entries[key][locale] ?? '']))

  const importCsv = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '').replace(/^\ufeff/, '')
      // 解析导出的同一种格式：键在第 1 列，目标语言在最后一列
      const rows = text.split(/\r?\n/).filter(Boolean).slice(1)
      const parse = (line) => line.match(/("(?:[^"]|"")*"|[^,]*)/g)?.filter((_, i) => i % 2 === 0)
        .map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"')) ?? []
      let applied = 0, skipped = 0
      const next = { ...entries }
      rows.forEach((line) => {
        const cells = parse(line)
        const key = cells[0]
        const value = cells[cells.length - 1] ?? ''
        if (!key || !Object.hasOwn(next, key)) { skipped += 1; return }
        if ((next[key][locale] ?? '') === value) return
        next[key] = { ...next[key], [locale]: value }
        applied += 1
      })
      update('translations', () => next)
      journal.logAudit({ action: '导入翻译', target: `${activeMeta?.nativeName ?? locale}（${locale}）`, targetModule: 'translations', targetId: locale,
        after: `更新 ${applied} 条`, result: skipped ? `成功 · 跳过 ${skipped} 条未知键` : '成功' })
    }
    reader.readAsText(file)
  }

  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes.translations[0]}</span><small>{configurationNotes.translations[1]}</small></div></div>
    <ConfigBadge store={store} moduleId="translations" onDiscard={() => journal.discardDraft('translations')} />
    <section className="admin-card"><div className="card-heading"><div><h2>翻译覆盖率</h2><p>共 {keys.length} 条玩家侧文案 · {translationLocales.length} 种语言。英文必须保持 100%，它是所有语言的兜底。</p></div>{differs && <button className="admin-btn primary" disabled={errors.length > 0} onClick={saveDraft}>保存草稿并提交审核</button>}</div>
      {errors.length > 0 && <div className="admin-config-note danger"><Icon name="bolt" /><div><strong>无法保存</strong><span>{errors.slice(0, 4).join('；')}{errors.length > 4 ? ` 等 ${errors.length} 项` : ''}</span></div></div>}
      <div className="coverage-grid">{coverage.map((row) => <button className={`coverage-cell ${row.code === locale ? 'is-active' : ''}`} key={row.code} onClick={() => { setLocale(row.code); setPage(0) }}>
        <span className="coverage-name">{row.nativeName}<small>{row.code}</small></span>
        <span className="coverage-bar"><i style={{ width: `${row.percent}%` }} className={row.percent === 100 ? 'is-full' : row.percent === 0 ? 'is-none' : ''} /></span>
        <span className="coverage-value">{row.percent}%<small>{row.done}/{row.total}</small></span>
      </button>)}</div>
    </section>
    <div className="admin-toolbar">
      <div className="admin-search"><Icon name="eye" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder="搜索键名或中英文文案..." /></div>
      <select value={namespace} onChange={(event) => { setNamespace(event.target.value); setPage(0) }}><option value="all">全部命名空间</option>{namespaces.map((ns) => <option key={ns} value={ns}>{ns}（{keys.filter((k) => translationNamespace(k) === ns).length}）</option>)}</select>
      <select value={locale} onChange={(event) => { setLocale(event.target.value); setPage(0) }}>{translationLocales.map(({ code, nativeName }) => <option key={code} value={code}>{nativeName}</option>)}</select>
      <button className={`admin-btn ${onlyMissing ? 'primary' : 'subtle'}`} onClick={() => { setOnlyMissing((v) => !v); setPage(0) }}><Icon name="filter" />只看未翻译</button>
    </div>
    <section className="admin-card table-card">
      <div className="table-top"><div><strong>文案列表</strong><span>共 {filtered.length} 条 · 当前对照语言：{activeMeta?.nativeName}</span></div>
        <div className="table-actions">
          <label className="admin-btn subtle import-label">导入 {activeMeta?.nativeName} CSV<input type="file" accept=".csv,text/csv" onChange={(event) => { const f = event.target.files?.[0]; if (f) importCsv(f); event.target.value = '' }} /></label>
          <button className="admin-btn subtle" onClick={exportCurrent}>导出 CSV</button>
        </div>
      </div>
      <div className="table-wrap"><table><thead><tr><th>键</th><th>简体中文</th><th>英文</th><th>{activeMeta?.nativeName}</th><th>覆盖</th><th>操作</th></tr></thead><tbody>
        {visible.map((key) => {
          const entry = entries[key]
          const done = translationLocales.filter(({ code }) => String(entry[code] ?? '').trim()).length
          return <tr key={key} onClick={() => setEditing(key)}>
            <td><code className="translation-key">{key}</code></td>
            <td>{entry[SOURCE_LOCALE]}</td>
            <td>{entry[FALLBACK]}</td>
            <td dir={activeMeta?.dir}>{String(entry[locale] ?? '').trim() || <em className="sample-tag">未翻译</em>}</td>
            <td>{done}/{translationLocales.length}</td>
            <td><button className="row-action" onClick={(event) => { event.stopPropagation(); setEditing(key) }}>编辑全部语言</button></td>
          </tr>
        })}
      </tbody></table>{!filtered.length && <div className="empty-state"><Icon name="eye" /><strong>没有匹配的文案</strong><p>调整命名空间、搜索词或取消「只看未翻译」。</p></div>}</div>
      <Pager page={page} total={filtered.length} onChange={setPage} />
    </section>
    {editing && <TranslationEditor key={editing} entryKey={editing} entry={entries[editing]} onSave={saveEntry(editing)} onClose={() => setEditing(null)} />}
  </>
}

// ---- activity centre ------------------------------------------------------
// Each activity type owns a different reward config, so the modal swaps its editor by type.
const activityTypeMeta = {
  '转盘': { moduleId: 'wheel', title: '转盘奖项与概率', note: '奖项固定 8 格，概率总和必须为 100%；保存后版本号按生效版本自动 +1。' },
  '签到': { moduleId: 'checkin', title: '签到奖励梯度', note: '按自然日发放，大奖固定在最后一天；不支持补签。' },
  '任务': { moduleId: 'missions', title: '任务列表与奖励', note: '任务进度由服务端事件汇总，领取需幂等键；已过期任务不可编辑。' },
}

function ActivityModal({ record, store, update, journal, onClose }) {
  const meta = activityTypeMeta[record.type]
  const moduleId = meta?.moduleId
  const [shell, setShell] = useState({ name: record.name, period: record.period, audience: record.audience || '全部玩家', budget: record.budget || '—', owner: record.owner, region: normalizeRegion(record.region) })
  const [config, setConfig] = useState(() => (moduleId ? getSlice(store, moduleId) : null))
  const configErrors = moduleId ? validateSnapshot(moduleId, config) : []
  const shellErrors = [...(!String(shell.name).trim() ? ['活动名称不能为空'] : []), ...(!String(shell.period).trim() ? ['活动周期不能为空'] : []), ...validateRegion(shell.region, '投放地区')]
  const errors = [...shellErrors, ...configErrors]
  const shellChanged = ['name', 'period', 'audience', 'budget', 'owner'].some((key) => shell[key] !== (record[key] ?? (key === 'audience' ? '全部玩家' : key === 'budget' ? '—' : '')))
    || JSON.stringify(shell.region) !== JSON.stringify(normalizeRegion(record.region))
  const configChanged = moduleId ? JSON.stringify(config) !== JSON.stringify(getSlice(store.live, moduleId)) : false
  const history = store.audit.filter((a) => (a.targetModule === 'activities' && a.targetId === record.id) || (moduleId && a.targetModule === moduleId))
  const save = () => {
    if (shellChanged) {
      update('activities', (list) => list.map((a) => (a.id === record.id ? { ...a, ...shell } : a)))
      journal.logAudit({ action: '编辑活动信息', target: shell.name, targetModule: 'activities', targetId: record.id, after: diffSummary(record, { ...record, ...shell }, [['name', '活动名称'], ['period', '活动周期'], ['audience', '适用人群'], ['budget', '奖励预算'], ['owner', '负责人'], ['region', '投放地区']]) })
    }
    if (configChanged && moduleId) {
      const snapshot = moduleId === 'wheel' ? { ...config, wheelVersion: store.live.wheelVersion + 1 } : config
      journal.transform((live) => setSlice(live, moduleId, snapshot))
      journal.logAudit({ action: `保存${meta.title}草稿`, target: shell.name, targetModule: moduleId, targetId: record.id, before: '生效版本', after: `活动「${shell.name}」内提交` })
      journal.queuePublish({ name: `${shell.name} · ${meta.title}调整`, type: '活动版本', scope: '生产环境', sourceModule: moduleId, sourceId: record.id, snapshot, todoSource: '活动中心' })
    }
    onClose()
  }
  return <Modal wide eyebrow={`活动配置 · ${record.type}`} title={record.name} subtitle={`${record.status} · 参与人数 ${record.participants} · 配置模块：${meta ? moduleLabels[moduleId] : '无关联配置模块'}`} onClose={onClose}
    footer={<><span className="modal-foot-note">{configChanged && shellChanged ? '活动信息立即保存，奖励配置进入草稿并提交审核' : configChanged ? '奖励配置保存后进入草稿，需审核通过才生效' : shellChanged ? '活动信息保存后立即生效' : '尚未修改任何字段'}</span><button className="admin-btn subtle" onClick={onClose}>取消</button><button className="admin-btn primary" disabled={errors.length > 0 || (!shellChanged && !configChanged)} onClick={save}>保存</button></>}>
    <div className="game-form">
      <fieldset><legend>活动信息</legend><div className="form-grid">
        <label>活动名称<input className="ladder-input" value={shell.name} onChange={(event) => setShell((v) => ({ ...v, name: event.target.value }))} /></label>
        <label>活动类型<input className="ladder-input" value={record.type} readOnly /><small className="field-note">类型决定奖励配置形态，创建后不可更改</small></label>
        <label>活动周期<input className="ladder-input" value={shell.period} onChange={(event) => setShell((v) => ({ ...v, period: event.target.value }))} /></label>
        <label>适用人群<select className="ladder-input" value={shell.audience} onChange={(event) => setShell((v) => ({ ...v, audience: event.target.value }))}>{['全部玩家', '新用户（注册 7 日内）', '活跃玩家', '付费玩家', '流失召回'].map((o) => <option key={o}>{o}</option>)}</select></label>
        <label>奖励预算<input className="ladder-input" value={shell.budget} onChange={(event) => setShell((v) => ({ ...v, budget: event.target.value }))} /></label>
        <label>负责人<input className="ladder-input" value={shell.owner} onChange={(event) => setShell((v) => ({ ...v, owner: event.target.value }))} /></label>
        <label className="full">投放地区<RegionPicker value={shell.region} onChange={(region) => setShell((v) => ({ ...v, region }))} label="投放地区" /><small className="field-note">白名单：只有勾选的国家/地区能看到并参与这个活动；与「适用人群」是两个独立维度</small></label>
        <label>当前状态<input className="ladder-input" value={record.status} readOnly /><small className="field-note">状态通过列表页的操作流转（提交审核 / 暂停 / 结束）</small></label>
        <label>参与人数<input className="ladder-input" value={record.participants} readOnly /><small className="field-note">由统计服务写入，后台只读</small></label>
      </div></fieldset>
      {meta ? <fieldset><legend>{meta.title}</legend><p className="fieldset-note">{meta.note}该配置与「{moduleLabels[moduleId]}」子页面共用同一份草稿，两处修改等价。</p>
        {record.type === '签到' && <CheckinLadderEditor days={config.checkinDays} onChange={(days) => setConfig({ checkinDays: days })} />}
        {record.type === '转盘' && <WheelPrizeEditor prizes={config.wheelPrizes} freeSpins={config.wheelFreeSpins} onChange={({ prizes, freeSpins }) => setConfig((c) => ({ ...c, wheelPrizes: prizes, wheelFreeSpins: freeSpins }))} />}
        {record.type === '任务' && <MissionListEditor missions={config.missions} removableIds={store.live.missions.map((m) => m.id)} onChange={(missions) => setConfig({ missions })} />}
      </fieldset> : <fieldset><legend>奖励配置</legend><p className="fieldset-note">该活动类型尚未定义奖励配置形态，仅可维护活动信息。</p></fieldset>}
      {errors.length > 0 && <div className="admin-config-note danger"><Icon name="bolt" /><div><strong>无法保存</strong><span>{errors.join('；')}</span></div></div>}
      <fieldset><legend>最近操作</legend>{history.length ? history.slice(0, 6).map((entry) => <p className="audit-item" key={entry.id}><Icon name="clock" /><span>{entry.actor} · {entry.action}<small>{entry.time} · {entry.result}</small></span></p>) : <p className="audit-item"><Icon name="eye" /><span>暂无操作记录</span></p>}</fieldset>
    </div>
  </Modal>
}

function ActivitiesPage({ onOpen, store, update, journal, navigate }) {
  const [editingId, setEditingId] = useState(null)
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
        { key: 'module', label: '关联配置模块', value: activityTypeMeta[record.type] ? moduleLabels[activityTypeMeta[record.type].moduleId] : '无', readOnly: true },
      ],
      hint: '「编辑活动配置」打开该活动类型专属的配置弹窗；状态流转（提交审核 / 暂停 / 结束）在此处操作。',
    })} />
    {editing && <ActivityModal key={editing.id} record={editing} store={store} update={update} journal={journal} onClose={() => setEditingId(null)} />}
  </>
}

function ActivityTypeLegend() {
  return <div className="activity-legend">{Object.entries(activityTypeMeta).map(([type, meta]) => <div key={type}><strong>{type}类活动</strong><span>配置项：{meta.title}</span><small>{meta.note}</small></div>)}</div>
}

const packFieldLabels = [['coins', '金币数'], ['discountPercent', '折扣'], ['gemBonus', '赠送宝石'], ['tag', '标签'], ['recommended', '推荐款']]

function describeCoinPack(pack, store, { update, journal }) {
  return {
    id: `coinpack-${pack.id}`, eyebrow: '金币礼包详情（草稿）', title: `${pack.coins.toLocaleString('en-US')} 金币礼包`, status: pack.status,
    history: store.audit.filter((a) => a.targetModule === 'store' && a.targetId === pack.id),
    fields: [
      { key: 'coins', label: '金币数', value: pack.coins, type: 'number', min: 1, step: 1000 },
      { key: 'discountPercent', label: '折扣 %', value: pack.discountPercent, type: 'number', min: 0, max: 90 },
      { key: 'gemBonus', label: '赠送宝石', value: pack.gemBonus, type: 'number', min: 0 },
      { key: 'tag', label: '标签', value: pack.tag || '', type: 'select', options: [['首充', '首充'], ['热门', '热门'], ['推荐', '推荐'], ['超值', '超值'], ['', '不显示标签']] },
      { key: 'recommended', label: '设为推荐款 ★（唯一）', value: !!pack.recommended, type: 'toggle' },
      { key: 'sku', label: 'SKU', value: pack.id, readOnly: true },
    ],
    validate: validateCoinPack,
    hint: (draft) => `售价按 1 USD = 10,000 金币自动计算，当前为 ${coinPackPriceUsd({ ...pack, ...draft })}；生效版本为 ${coinPackPriceUsd(store.live.coinPacks.find((p) => p.id === pack.id) || pack)}。`,
    onSave: (draft) => {
      const nextList = store.coinPacks.map((p) => (p.id === pack.id ? { ...p, ...draft } : (draft.recommended ? { ...p, recommended: false } : p)))
      update('coinPacks', () => nextList)
      const label = `${Number(draft.coins).toLocaleString('en-US')} 金币礼包`
      journal.logAudit({ action: '编辑金币礼包（草稿）', target: label, targetModule: 'store', targetId: pack.id, after: diffSummary(pack, { ...pack, ...draft }, packFieldLabels) })
      journal.queuePublish({ name: `${label}配置更新`, type: '商城配置', scope: '生产环境', sourceModule: 'coinPacks', sourceId: pack.id, snapshot: { coinPacks: nextList }, todoSource: '商城与经济' })
    },
    saveLabel: '保存草稿并提交审核',
  }
}

function ProductsPage({ onOpen, store, update, journal }) {
  const packLabels = ['商品名称', 'SKU', '折扣', '售价', '赠送宝石', '标签', '状态']
  const [showChestForm, setShowChestForm] = useState(false)
  const [showPassForm, setShowPassForm] = useState(false)
  const [chestDraft, setChestDraft] = useState(store.chestOffer)
  const [passDraft, setPassDraft] = useState(store.monthlyPass)
  const chestErrors = validateChestOffer(chestDraft)
  const passErrors = validateMonthlyPass(passDraft)
  const openChestForm = () => { setChestDraft({ ...store.chestOffer, note: '' }); setShowChestForm(true) }
  const saveChestForm = () => {
    const version = chestDraft.version === store.live.chestOffer.version ? nextVersionTag(chestDraft.version) : chestDraft.version
    const next = { ...store.chestOffer, version, priceCoins: chestDraft.priceCoins, maxRewardCoins: chestDraft.maxRewardCoins }
    update('chestOffer', () => next)
    journal.logAudit({ action: '调整明日宝箱报价（草稿）', target: next.productId, targetModule: 'store', targetId: 'chest', before: `${store.live.chestOffer.version} · ${store.live.chestOffer.priceCoins} 金币 · 上限 ${store.live.chestOffer.maxRewardCoins}`, after: `${version} · ${next.priceCoins} 金币 · 上限 ${next.maxRewardCoins}`, result: chestDraft.note ? `成功 · 说明：${chestDraft.note}` : '成功' })
    journal.queuePublish({ name: `明日宝箱报价 ${version}`, type: '商城配置', scope: '生产环境', sourceModule: 'chestOffer', sourceId: 'chest', snapshot: { chestOffer: next }, note: chestDraft.note, todoSource: '商城与经济' })
    setShowChestForm(false)
  }
  const openPassForm = () => { setPassDraft(store.monthlyPass); setShowPassForm(true) }
  const savePassForm = () => {
    update('monthlyPass', () => passDraft)
    journal.logAudit({ action: '编辑月度特权卡（草稿）', target: store.monthlyPass.title, targetModule: 'store', targetId: 'pass', after: diffSummary(store.monthlyPass, passDraft, [['priceUsdCents', '价格(美分)'], ['dailyCoins', '每日金币'], ['dailyGems', '每日宝石'], ['validDays', '有效天数']]) })
    journal.queuePublish({ name: '月度特权卡配置更新', type: '商城配置', scope: '生产环境', sourceModule: 'monthlyPass', sourceId: 'pass', snapshot: { monthlyPass: passDraft }, todoSource: '商城与经济' })
    setShowPassForm(false)
  }
  const openPack = (p) => onOpen(describeCoinPack(p, store, { update, journal }))
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes.store[0]}</span><small>{configurationNotes.store[1]}</small></div></div>
    <ConfigBadge store={store} moduleId="coinPacks" onDiscard={() => journal.discardDraft('coinPacks')} />
    <section className="admin-card table-card"><div className="table-top"><div><strong>金币礼包（草稿）</strong><span>共 {store.coinPacks.length} 档 · 1 USD = 10,000 金币 · 点击行编辑</span></div></div><div className="table-wrap"><table><thead><tr>{packLabels.map((l) => <th key={l}>{l}</th>)}<th>操作</th></tr></thead><tbody>{store.coinPacks.map((p) => <tr key={p.id} onClick={() => openPack(p)}><td>{p.coins.toLocaleString('en-US')} 金币礼包{p.recommended ? ' ★' : ''}</td><td>{p.id}</td><td>{p.discountPercent}%</td><td>{coinPackPriceUsd(p)}</td><td>{p.gemBonus} 宝石</td><td>{p.tag || '—'}</td><td><Status>{p.status}</Status></td><td><button className="row-action" onClick={(event) => { event.stopPropagation(); openPack(p) }}>编辑</button></td></tr>)}</tbody></table></div></section>
    <ConfigBadge store={store} moduleId="monthlyPass" onDiscard={() => journal.discardDraft('monthlyPass')} />
    <section className="admin-card"><div className="card-heading"><div><h2>月度特权卡（草稿）</h2><p>{store.monthlyPass.title} · SKU monthly-pass · 生效版本 ${(store.live.monthlyPass.priceUsdCents / 100).toFixed(2)} / {store.live.monthlyPass.dailyCoins} 金币 / {store.live.monthlyPass.dailyGems} 宝石 / {store.live.monthlyPass.validDays} 天</p></div><button className="admin-btn primary" onClick={openPassForm}><Icon name="gear" />编辑</button></div><div className="summary-grid"><div><span>价格</span><strong>${(store.monthlyPass.priceUsdCents / 100).toFixed(2)}</strong><small>不自动续费</small></div><div><span>每日金币</span><strong>{store.monthlyPass.dailyCoins.toLocaleString('en-US')}</strong><small>需每日主动领取</small></div><div><span>每日宝石</span><strong>{store.monthlyPass.dailyGems}</strong><small>当日未领取不补发</small></div><div><span>有效天数</span><strong>{store.monthlyPass.validDays} 天</strong><small>状态：{store.monthlyPass.status}</small></div></div></section>
    <ConfigBadge store={store} moduleId="chestOffer" versionText={store.live.chestOffer.version} onDiscard={() => journal.discardDraft('chestOffer')} />
    <section className="admin-card"><div className="card-heading"><div><h2>明日宝箱 · 报价配置（草稿）</h2><p>{store.chestOffer.productId}</p></div><button className="admin-btn primary" onClick={openChestForm}><Icon name="gear" />调整报价</button></div><div className="summary-grid"><div><span>报价版本</span><strong>{store.chestOffer.version}</strong><small>版本号变更会使旧客户端报价失效（409）</small></div><div><span>购买价格</span><strong>{store.chestOffer.priceCoins} 金币</strong><small>每业务日限购 1 个</small></div><div><span>可能奖励上限</span><strong>{store.chestOffer.maxRewardCoins} 金币</strong><small>0 金币为合法开奖结果</small></div><div><span>解锁 / 截止</span><strong>次日 00:00</strong><small>Asia/Shanghai · 解锁后 24 小时截止（服务端固定规则）</small></div></div><div className="environment-note"><Icon name="shield" /><span><strong>购买资格与幂等键（服务端规则，只读）</strong><small>当日完成一局有效游戏后可购买；购买键为 chest-purchase-业务日；开启键为 chest-open-宝箱ID。开奖、钱包流水与状态变更需原子提交。</small></span></div></section>
    {showChestForm && <Modal eyebrow="商品配置草稿" title="调整明日宝箱报价" onClose={() => setShowChestForm(false)} footer={<><button className="admin-btn subtle" onClick={() => setShowChestForm(false)}>取消</button><button className="admin-btn primary" disabled={chestErrors.length > 0} onClick={saveChestForm}>保存草稿并提交审核</button></>}><div className="form-grid"><label>报价版本号（与生效版本相同时自动递增为 {nextVersionTag(store.live.chestOffer.version)}）<input value={chestDraft.version} onChange={(event) => setChestDraft((d) => ({ ...d, version: event.target.value }))} /></label><label>购买价格（金币，&gt;0）<input type="number" min="1" value={chestDraft.priceCoins} onChange={(event) => setChestDraft((d) => ({ ...d, priceCoins: Number(event.target.value) || 0 }))} /></label><label>可能奖励上限（金币，&gt;0）<input type="number" min="1" value={chestDraft.maxRewardCoins} onChange={(event) => setChestDraft((d) => ({ ...d, maxRewardCoins: Number(event.target.value) || 0 }))} /></label><label className="full">变更说明（写入操作日志与发布任务）<textarea value={chestDraft.note || ''} placeholder="填写调整原因、生效时间与回滚计划" onChange={(event) => setChestDraft((d) => ({ ...d, note: event.target.value }))} /></label>{chestErrors.length > 0 && <div className="full admin-config-note danger"><Icon name="bolt" /><div><strong>无法保存</strong><span>{chestErrors.join('；')}</span></div></div>}</div></Modal>}
    {showPassForm && <Modal eyebrow="商品配置草稿" title="编辑月度特权卡" onClose={() => setShowPassForm(false)} footer={<><button className="admin-btn subtle" onClick={() => setShowPassForm(false)}>取消</button><button className="admin-btn primary" disabled={passErrors.length > 0} onClick={savePassForm}>保存草稿并提交审核</button></>}><div className="form-grid"><label>价格（美分）<input type="number" min="1" value={passDraft.priceUsdCents} onChange={(event) => setPassDraft((d) => ({ ...d, priceUsdCents: Number(event.target.value) || 0 }))} /></label><label>每日金币<input type="number" min="1" value={passDraft.dailyCoins} onChange={(event) => setPassDraft((d) => ({ ...d, dailyCoins: Number(event.target.value) || 0 }))} /></label><label>每日宝石<input type="number" min="1" value={passDraft.dailyGems} onChange={(event) => setPassDraft((d) => ({ ...d, dailyGems: Number(event.target.value) || 0 }))} /></label><label>有效天数<input type="number" min="1" value={passDraft.validDays} onChange={(event) => setPassDraft((d) => ({ ...d, validDays: Number(event.target.value) || 0 }))} /></label>{passErrors.length > 0 && <div className="full admin-config-note danger"><Icon name="bolt" /><div><strong>无法保存</strong><span>{passErrors.join('；')}</span></div></div>}</div></Modal>}
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
    id: `ledger-${record.id}`, eyebrow: '流水详情（只读）', title: record.id, status: ledgerStatusLabel[record.status] || record.status, actions,
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
  const [store, setStore] = useState(() => createInitialStore())
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
  const adjustValid = adjustForm.reason.trim() && Number(adjustForm.amount) !== 0
  const submitAdjust = () => {
    const player = store.players.find((p) => p.name === adjustForm.player)
    const record = { id: nextLedgerId(store.ledger), player: adjustForm.player, playerId: player?.playerId || '—', currency: adjustForm.currency, amount: Number(adjustForm.amount), source: 'manual_adjust', status: 'processing', time: '刚刚', balanceBefore: null, balanceAfter: null, ref: '人工调整' }
    update('ledger', (list) => [record, ...list])
    journal.logAudit({ action: '人工调整钱包流水', target: `${adjustForm.player} · ${record.amount > 0 ? '+' : ''}${record.amount} ${adjustForm.currency === 'coins' ? '金币' : '宝石'}`, targetModule: 'ledger', targetId: record.id, after: record.id, result: `处理中 · 原因：${adjustForm.reason.trim()}` })
    journal.addTodo({ title: `${adjustForm.player} 人工调整流水 ${record.id} 待财务复核`, source: '商城与经济', priority: '中', owner: '财务组' })
    setShowAdjust(false)
    setAdjustForm({ player: 'NovaPlayer', currency: 'coins', amount: 0, reason: '' })
  }
  const pageKey = `${activePage}-${intent?.stamp || ''}`
  const renderContent = () => {
    const common = { onOpen, store, update, journal, navigate }
    if (activePage === 'dashboard') return <Dashboard onNavigate={navigate} store={store} environment={environment} />
    if (activePage === 'todo') return <TodoPage key={pageKey} store={store} update={update} journal={journal} navigate={navigate} onOpen={onOpen} />
    if (activePage === 'games') return <GameCatalogPage key={`${environment}-${intent?.stamp || ''}`} environment={environment} intent={intent} store={store} update={update} journal={journal} />
    if (activePage === 'versions') return <GameVersionCenterPage {...common} />
    if (activePage === 'publish') return <ReleaseCenterPage {...common} />
    if (activePage === 'adminUsers') return <AdminUsersPage {...common} />
    if (activePage === 'wins') return <WinsPage store={store} update={update} journal={journal} />
    if (activePage === 'checkin') return <CheckinPage {...common} />
    if (activePage === 'wheel') return <WheelPage {...common} />
    if (activePage === 'missions') return <MissionsPage store={store} update={update} journal={journal} />
    if (activePage === 'activities') return <ActivitiesPage key={pageKey} {...common} />
    if (activePage === 'translations') return <TranslationsPage key={pageKey} store={store} update={update} journal={journal} />
    if (activePage === 'store') return <ProductsPage {...common} />
    if (activePage === 'orders') return <GenericPage key={pageKey} page="orders" describe={describeOrder} {...common} intent={intent} />
    if (activePage === 'players') return <PlayersCenterPage key={pageKey} {...common} navigate={navigate} intent={intent} />
    if (activePage === 'ledger') return <LedgerPage key={pageKey} {...common} onAdjust={() => setShowAdjust(true)} intent={intent} />
    return <GenericPage key={pageKey} page={activePage} {...common} intent={intent} />
  }
  return <div className="admin-shell">
    <aside className={`admin-sidebar ${mobileNav ? 'is-open' : ''}`}><div className="admin-brand"><span className="admin-brand-mark">J</span><span><strong>Joyloop</strong><small>运营后台原型</small></span><button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><Icon name="close" /></button></div><div className="env-chip"><span className="env-dot" />{environment === 'production' ? '生产环境' : '测试环境'} <small>v0.6.0</small></div><nav>{navGroups.map((group) => <div className="nav-group" key={group.title}><span className="nav-group-title">{group.title}</span>{group.items.map(([id, label, icon]) => <button key={id} className={activePage === id ? 'is-active' : ''} onClick={() => navigate(id)}><Icon name={icon} /><span>{label}</span>{id === 'todo' && <b>{store.todo.filter((t) => t.status !== '已解决').length}</b>}{id === 'publish' && store.publish.some((p) => p.status === '待审核') && <b>{store.publish.filter((p) => p.status === '待审核').length}</b>}</button>)}</div>)}</nav><a className="back-to-lobby" href="./index.html"><Icon name="chevronLeft" />返回大厅原型首页</a></aside>
    <div className="admin-main"><header className="admin-header"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)}><Icon name="flag" /></button><div className="crumb"><span>Joyloop 后台</span><Icon name="chevronRight" /><strong>{meta[0]}</strong></div><div className="header-actions"><label className="environment-select"><span>环境（当前只影响游戏目录）</span><select value={environment} onChange={(event) => setEnvironment(event.target.value)}><option value="test">测试环境</option><option value="production">生产环境</option></select></label><div className="global-search"><Icon name="eye" /><input value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runGlobalSearch()} placeholder="搜索玩家 / 订单号 / 流水号，回车跳转" /></div><button className="header-icon" title="待处理事项" onClick={() => navigate('todo')}><Icon name="bell" />{store.todo.some((t) => t.status !== '已解决') && <i />}</button><button className="header-icon" title="权限与账号" onClick={() => navigate('adminUsers')}><Icon name="gear" /></button><span className="admin-avatar">OP</span><span className="operator-name">运营管理员</span></div></header><div className="admin-tabs"><button className="tab active">{meta[0]} {activePage !== 'dashboard' && <span onClick={() => navigate('dashboard')} title="关闭并返回概览"><Icon name="close" /></span>}</button>{activePage !== 'dashboard' && <button className="tab" onClick={() => navigate('dashboard')}>运营概览</button>}</div><main className="admin-content"><div className="page-title"><div><span className="eyebrow">{activePage === 'dashboard' ? 'OPERATIONS OVERVIEW' : 'JOYLOOP ADMIN CONSOLE'}</span><h1>{meta[0]}</h1><p>{meta[1]}</p></div></div>{renderContent()}</main></div>
    <RecordDrawer key={openRecord?.id || 'none'} descriptor={openRecord} onClose={() => setDrawerSource(null)} />
    {showAdjust && <Modal eyebrow="钱包流水" title="人工调整流水（追加一条处理中流水）" onClose={() => setShowAdjust(false)} footer={<><button className="admin-btn subtle" onClick={() => setShowAdjust(false)}>取消</button><button className="admin-btn primary" disabled={!adjustValid} onClick={submitAdjust}>提交调整</button></>}><div className="form-grid"><label>玩家<select value={adjustForm.player} onChange={(event) => setAdjustForm((f) => ({ ...f, player: event.target.value }))}>{store.players.map((p) => <option key={p.id} value={p.name}>{p.name} · {p.playerId}</option>)}</select></label><label>币种<select value={adjustForm.currency} onChange={(event) => setAdjustForm((f) => ({ ...f, currency: event.target.value }))}><option value="coins">金币</option><option value="gems">宝石</option></select></label><label>金额（不能为 0，可为负数）<input type="number" value={adjustForm.amount} onChange={(event) => setAdjustForm((f) => ({ ...f, amount: Number(event.target.value) || 0 }))} /></label><label className="full">原因（必填）<textarea value={adjustForm.reason} onChange={(event) => setAdjustForm((f) => ({ ...f, reason: event.target.value }))} placeholder="填写调整原因，将写入操作日志并生成财务复核待办；财务确认入账后流水才变为成功" /></label></div></Modal>}
  </div>
}

export default AdminApp
