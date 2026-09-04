// Pure rules for the admin console prototype: validation, draft/live snapshots and release decisions.
// No React and no data imports, so `node --test` can exercise it directly.
import { isValidNickname } from '../demoModel.js'

export const WHEEL_SLOTS = 8

export function parseReward(text) {
  const coinsMatch = String(text).match(/([\d,]+)\s*金币/)
  const gemsMatch = String(text).match(/([\d,]+)\s*宝石/)
  return {
    coins: coinsMatch ? Number(coinsMatch[1].replace(/,/g, '')) : 0,
    gems: gemsMatch ? Number(gemsMatch[1].replace(/,/g, '')) : 0,
  }
}

export function formatReward(coins, gems) {
  const parts = []
  if (coins) parts.push(`${Number(coins).toLocaleString('en-US')} 金币`)
  if (gems) parts.push(`${Number(gems).toLocaleString('en-US')} 宝石`)
  return parts.join(' · ') || '0 金币'
}

export function prizeLabel(kind, amount) {
  if (kind === 'freeSpin') return `${amount} 次免费旋转`
  return `${Number(amount).toLocaleString('en-US')} ${kind === 'gems' ? '宝石' : '金币'}`
}

export function coinPackPriceUsd(pack) {
  const price = (Number(pack.coins) / 10000) * (1 - Number(pack.discountPercent) / 100)
  return `$${price.toFixed(2)}`
}

export function wheelBalanced(prizes) {
  if (!prizes.length) return false
  if (!prizes.every((p) => Number.isFinite(Number(p.probability)) && Number(p.probability) >= 0 && Number(p.probability) <= 100)) return false
  return Math.round(prizes.reduce((sum, p) => sum + Number(p.probability), 0) * 10) / 10 === 100
}

export function validateWheel({ prizes, freeSpins }) {
  const errors = []
  if (prizes.length !== WHEEL_SLOTS) errors.push(`前台转盘固定 ${WHEEL_SLOTS} 格，当前 ${prizes.length} 个奖项`)
  prizes.forEach((p, i) => {
    if (!(Number(p.amount) > 0)) errors.push(`第 ${i + 1} 项奖励数量必须大于 0`)
    const prob = Number(p.probability)
    if (!Number.isInteger(prob) || prob < 0 || prob > 100) errors.push(`第 ${i + 1} 项概率必须是 0–100 的整数`)
  })
  if (!wheelBalanced(prizes)) errors.push('概率总和必须为 100%')
  if (!(Number.isInteger(Number(freeSpins)) && Number(freeSpins) >= 0)) errors.push('每日免费次数必须是非负整数')
  return errors
}

export function validateCheckin(days) {
  const errors = []
  days.forEach((d, i) => { if (!(Number(d.coins) >= 0) || !(Number(d.gems) >= 0)) errors.push(`第 ${i + 1} 天奖励不能为负数`) })
  const grand = days.filter((d) => d.grand).length
  if (grand !== 1) errors.push('必须且只能有一天标记为大奖')
  else if (!days[days.length - 1].grand) errors.push('大奖应设置在最后一天')
  return errors
}

export function validateMissions(list) {
  const errors = []
  list.filter((m) => !m.expired).forEach((m) => {
    const name = String(m.name || '').trim()
    if (!name) errors.push('任务名称不能为空')
    if (!(Number.isInteger(Number(m.target)) && Number(m.target) >= 1)) errors.push(`「${name || '未命名'}」目标值必须是 ≥1 的整数`)
    if (!(Number(m.coinReward) >= 0) || !(Number(m.gemReward) >= 0)) errors.push(`「${name || '未命名'}」奖励不能为负数`)
  })
  return errors
}

export function validateCoinPack(draft) {
  const errors = []
  if (!(Number.isInteger(Number(draft.coins)) && Number(draft.coins) > 0)) errors.push('金币数必须是正整数')
  if (!(Number(draft.discountPercent) >= 0 && Number(draft.discountPercent) <= 90)) errors.push('折扣必须在 0–90% 之间')
  if (!(Number(draft.gemBonus) >= 0)) errors.push('赠送宝石不能为负数')
  return errors
}

export function validateMonthlyPass(draft) {
  const errors = []
  ;[['priceUsdCents', '价格'], ['dailyCoins', '每日金币'], ['dailyGems', '每日宝石'], ['validDays', '有效天数']].forEach(([key, label]) => {
    if (!(Number(draft[key]) > 0)) errors.push(`${label}必须大于 0`)
  })
  return errors
}

export function validateChestOffer(draft) {
  const errors = []
  if (!String(draft.version || '').trim()) errors.push('报价版本号不能为空')
  if (!(Number(draft.priceCoins) > 0)) errors.push('购买价格必须大于 0')
  if (!(Number(draft.maxRewardCoins) > 0)) errors.push('可能奖励上限必须大于 0')
  return errors
}

export function nextVersionTag(version) {
  const match = String(version).match(/^(.*)-r(\d+)$/)
  return match ? `${match[1]}-r${Number(match[2]) + 1}` : `${version}-r2`
}

export function validateNickname(value) {
  return isValidNickname(value) ? [] : ['昵称需为 2–20 个字符']
}

export function nextLedgerId(ledger) {
  const max = ledger.reduce((acc, row) => {
    const match = String(row.id).match(/^#WL-(\d+)$/)
    return match ? Math.max(acc, Number(match[1])) : acc
  }, 90000)
  return `#WL-${max + 1}`
}

const formatValue = (value) => (Array.isArray(value) ? value.join('/') : (value === '' || value === null || value === undefined ? '—' : String(value)))

export function diffSummary(before, after, fields) {
  return fields
    .filter(([key]) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map(([key, label]) => `${label}: ${formatValue(before[key])} → ${formatValue(after[key])}`)
    .join('；')
}

// ---- draft/live snapshots -------------------------------------------------
// moduleId: wheel | checkin | missions | coinPacks | monthlyPass | chestOffer | games:test | games:production
export const moduleKeys = {
  translations: ['translations'],
  wheel: ['wheelPrizes', 'wheelFreeSpins', 'wheelVersion'],
  checkin: ['checkinDays'],
  missions: ['missions'],
  coinPacks: ['coinPacks'],
  monthlyPass: ['monthlyPass'],
  chestOffer: ['chestOffer'],
}

export const moduleLabels = {
  translations: '多语言内容',
  wheel: '幸运转盘', checkin: '签到奖励梯度', missions: '每日任务', coinPacks: '金币礼包', monthlyPass: '月度特权卡', chestOffer: '明日宝箱报价',
  'games:test': '游戏目录 · 测试环境', 'games:production': '游戏目录 · 生产环境',
}

export function isConfigModule(moduleId) {
  return !!moduleKeys[moduleId] || String(moduleId || '').startsWith('games:')
}

const clone = (value) => JSON.parse(JSON.stringify(value))

export function getSlice(container, moduleId) {
  if (moduleId.startsWith('games:')) {
    const env = moduleId.split(':')[1]
    return { games: clone(container.games[env]) }
  }
  return Object.fromEntries(moduleKeys[moduleId].map((key) => [key, clone(container[key])]))
}

export function setSlice(container, moduleId, slice) {
  if (moduleId.startsWith('games:')) {
    const env = moduleId.split(':')[1]
    return { ...container, games: { ...container.games, [env]: clone(slice.games) } }
  }
  return { ...container, ...clone(slice) }
}

export function draftDiffers(store, moduleId) {
  return JSON.stringify(getSlice(store, moduleId)) !== JSON.stringify(getSlice(store.live, moduleId))
}

export function resetDraftToLive(store, moduleId) {
  return setSlice(store, moduleId, getSlice(store.live, moduleId))
}

// Player-facing copy: English is the fallback every other language falls back to,
// so it must be complete, and a translation must keep the placeholders its source has.
export function validateTranslations(entries) {
  const errors = []
  const placeholders = (text) => [...String(text ?? '').matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')
  Object.entries(entries).forEach(([key, byLocale]) => {
    const source = byLocale.en
    if (!String(source ?? '').trim()) errors.push(`「${key}」缺少英文，英文是所有语言的兜底，不能为空`)
    Object.entries(byLocale).forEach(([locale, text]) => {
      if (locale === 'en' || !String(text ?? '').trim()) return
      if (placeholders(text) !== placeholders(source)) {
        errors.push(`「${key}」的 ${locale} 占位符与英文不一致`)
      }
    })
  })
  return errors
}

export function validateSnapshot(moduleId, slice) {
  if (moduleId === 'translations') return validateTranslations(slice.translations)
  if (moduleId === 'wheel') return validateWheel({ prizes: slice.wheelPrizes, freeSpins: slice.wheelFreeSpins })
  if (moduleId === 'checkin') return validateCheckin(slice.checkinDays)
  if (moduleId === 'missions') return validateMissions(slice.missions)
  if (moduleId === 'coinPacks') return slice.coinPacks.flatMap(validateCoinPack)
  if (moduleId === 'monthlyPass') return validateMonthlyPass(slice.monthlyPass)
  if (moduleId === 'chestOffer') return validateChestOffer(slice.chestOffer)
  return []
}

export const releaseDecisions = {
  approve: { status: '已发布', action: '通过并发布' },
  gray: { status: '灰度 20%', action: '灰度发布' },
  reject: { status: '已驳回', action: '驳回' },
  rollback: { status: '已回滚', action: '回滚' },
  pause: { status: '已暂停', action: '暂停' },
  resume: { status: '已发布', action: '恢复发布' },
  resubmit: { status: '待审核', action: '重新提交' },
}

// Applies a 发布审核 decision to the whole store. Pure: returns a new store.
export function applyRelease(store, entry, decision, reason, meta = {}) {
  const spec = releaseDecisions[decision]
  if (!spec) return store
  const time = meta.time || '刚刚'
  const seq = meta.seq ?? 0
  const audit = (patch) => ({
    id: `audit-${seq}-${entry.id}-${decision}`, logId: `#${seq.toString(16).slice(-4).padStart(4, '0')}`, actor: meta.actor || '运营管理员', time,
    targetModule: 'publish', targetId: entry.id, target: entry.name, action: spec.action, before: entry.status, after: spec.status,
    result: reason ? `成功 · 原因：${reason}` : '成功', ...patch,
  })
  const moduleId = entry.sourceModule
  const hasSnapshot = isConfigModule(moduleId) && !!entry.snapshot
  let next = store
  if ((decision === 'approve' || decision === 'gray') && hasSnapshot) {
    const errors = validateSnapshot(moduleId, entry.snapshot)
    if (errors.length) return { ...store, audit: [audit({ after: entry.status, result: `失败 · ${errors.join('；')}` }), ...store.audit] }
    if (entry.status !== '灰度 20%') {
      const previous = getSlice(store.live, moduleId)
      next = { ...next, live: setSlice(store.live, moduleId, entry.snapshot), liveHistory: { ...store.liveHistory, [moduleId]: [previous, ...(store.liveHistory[moduleId] || [])].slice(0, 10) } }
      next = setSlice(next, moduleId, entry.snapshot)
    }
  }
  if (decision === 'reject' && hasSnapshot) next = resetDraftToLive(next, moduleId)
  if (decision === 'rollback' && hasSnapshot) {
    const history = store.liveHistory[moduleId] || []
    if (!history.length) return { ...store, audit: [audit({ after: entry.status, result: '失败 · 没有可回滚的历史版本' }), ...store.audit] }
    const [previous, ...rest] = history
    next = { ...next, live: setSlice(next.live, moduleId, previous), liveHistory: { ...next.liveHistory, [moduleId]: rest } }
    next = setSlice(next, moduleId, previous)
  }
  next = { ...next, publish: next.publish.map((p) => (p.id === entry.id ? { ...p, status: spec.status, time } : p)) }
  if (['approve', 'reject', 'rollback'].includes(decision)) next = { ...next, todo: next.todo.map((t) => (t.publishId === entry.id ? { ...t, status: '已解决', time } : t)) }
  return { ...next, audit: [audit({}), ...next.audit] }
}

// ---- snapshot diff ---------------------------------------------------------
const cell = (value) => (Array.isArray(value) ? (value.join(' / ') || '无') : (value === '' || value === null || value === undefined ? '—' : String(value)))
const yesNo = (value) => (value ? '是' : '否')
// Every per-game field the editor can change, so a config update diff is not summarised away.
const gameDiffFields = [
  ['name', '游戏名称'], ['status', '运行状态'], ['categoryLabel', '分类'], ['tags', '标签'], ['badges', '角标'],
  ['popular', '大厅推荐', yesNo], ['heat', '热度值'], ['sortWeight', '排序权重'], ['region', '可用地区'], ['cover', '封面资源'],
  ['description', '游戏简介'], ['maintenanceNote', '维护公告'], ['launchAt', '预计上线时间'],
  ['winRate', '中奖率'], ['rtp', 'RTP'], ['winRange', '中奖金额范围'], ['maxMultiplier', '最大赔率'],
  ['minBet', '最小投注'], ['paylines', '赔付线数'], ['volatility', '波动性'],
]

// Rows are [stableKey, label, value] so a rename shows as a changed value, not as remove + add.
function snapshotRows(moduleId, slice) {
  if (!slice) return []
  if (moduleId === 'wheel') {
    const rows = [['freeSpins', '每日免费次数', `${slice.wheelFreeSpins} 次 / 日`], ['version', '配置版本', `v${slice.wheelVersion}`]]
    slice.wheelPrizes.forEach((p, i) => rows.push([`slot-${i}`, `第 ${i + 1} 格`, `${prizeLabel(p.kind, p.amount)} · ${p.probability}%`]))
    rows.push(['sum', '概率总和', `${slice.wheelPrizes.reduce((sum, p) => sum + Number(p.probability), 0)}%`])
    return rows
  }
  if (moduleId === 'checkin') return slice.checkinDays.map((d, i) => [`day-${i}`, d.day, `${Number(d.coins).toLocaleString('en-US')} 金币 · ${d.gems} 宝石${d.grand ? ' · 大奖' : ''}`])
  if (moduleId === 'missions') return slice.missions.map((m) => [`mission-${m.id}`, m.name || m.id, `目标 ${m.target} · ${m.coinReward} 金币 · ${m.gemReward} 宝石 · ${m.status}`])
  if (moduleId === 'coinPacks') return slice.coinPacks.map((p) => [`pack-${p.id}`, `${Number(p.coins).toLocaleString('en-US')} 金币礼包`, `${coinPackPriceUsd(p)} · 折扣 ${p.discountPercent}% · 赠 ${p.gemBonus} 宝石 · 标签 ${p.tag || '无'}${p.recommended ? ' · 推荐款' : ''}`])
  if (moduleId === 'monthlyPass') {
    const m = slice.monthlyPass
    return [['price', '价格', `$${(m.priceUsdCents / 100).toFixed(2)}`], ['coins', '每日金币', Number(m.dailyCoins).toLocaleString('en-US')], ['gems', '每日宝石', String(m.dailyGems)], ['days', '有效天数', `${m.validDays} 天`]]
  }
  if (moduleId === 'chestOffer') {
    const c = slice.chestOffer
    return [['version', '报价版本', c.version], ['price', '购买价格', `${c.priceCoins} 金币`], ['max', '可能奖励上限', `${c.maxRewardCoins} 金币`]]
  }
  if (moduleId === 'translations') {
    return Object.entries(slice.translations).flatMap(([key, byLocale]) =>
      Object.entries(byLocale).map(([locale, text]) => [`${key}|${locale}`, `${key} · ${locale}`, cell(text)]))
  }
  if (String(moduleId).startsWith('games:')) {
    const rows = [['order', '目录排序', slice.games.map((g) => g.name).join(' → ')]]
    slice.games.forEach((g) => {
      gameDiffFields.forEach(([key, label, format]) => {
        rows.push([`game-${g.gameId}-${key}`, `${g.name} · ${label}`, format ? format(g[key]) : cell(g[key])])
      })
    })
    return rows
  }
  return []
}

// Field-level comparison between the live version and a pending snapshot, for the review screen.
export function snapshotDiff(moduleId, before, after) {
  const toMap = (rows) => new Map(rows.map(([key, label, value]) => [key, { label, value }]))
  const a = toMap(snapshotRows(moduleId, before))
  const b = toMap(snapshotRows(moduleId, after))
  return [...new Set([...a.keys(), ...b.keys()])].map((key) => {
    const before_ = a.get(key)
    const after_ = b.get(key)
    return {
      key, label: (after_ || before_).label,
      before: before_ ? before_.value : '—',
      after: after_ ? after_.value : '—',
      changed: !before_ || !after_ || before_.value !== after_.value,
      added: !before_, removed: !after_,
    }
  })
}
