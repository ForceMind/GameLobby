// Pure rules for the admin console prototype: validation, draft/live snapshots and release decisions.
// No React and no data imports, so `node --test` can exercise it directly.
import { needsTranslationReview, translationReviewErrors } from './translationReview.js'
import { isValidNickname } from '../demoModel.js'

export const WHEEL_SLOTS = 8

export function validateActivityInfo(record) {
  const errors = []
  for (const [key, label] of [['name','活动名称'],['period','活动周期'],['audience','适用人群'],['budget','奖励预算']]) {
    const value = String(record?.[key] ?? '').trim()
    if (!value || value === '待定' || value === '—') errors.push(`请填写有效的${label}`)
  }
  return errors
}

// Lifecycle changes must not publish a pending per-record region draft.
export function applyActivityState(store, id, status) {
  const record = store.activities.find((item) => item.id === id)
  const live = store.live.activities.find((item) => item.id === id)
  if (!record || !live) return { ok: false, error: '活动缺少有效基线，请核对活动记录', store }
  if (status === '待审核' || status === '进行中') {
    const errors = [...validateActivityInfo(record), ...validateRegion(live.region, '生效投放地区')]
    if (errors.length) return { ok: false, error: errors.join('；'), store }
  }
  if (status === '进行中' && store.live.activities.some((item) => item.id !== id && item.type === record.type && item.status === '进行中')) {
    return { ok: false, error: '同类型已有进行中活动，请先暂停该活动再发布新的活动', store }
  }
  const update = (list) => list.map((item) => item.id === id ? { ...item, status, time: '刚刚' } : item)
  return { ok: true, store: { ...store, activities: update(store.activities), live: { ...store.live, activities: update(store.live.activities) } } }
}

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
  translations: ['translations', 'translationReviews'],
  wheel: ['wheelPrizes', 'wheelFreeSpins', 'wheelVersion'],
  checkin: ['checkinDays'],
  missions: ['missions'],
  coinPacks: ['coinPacks'],
  monthlyPass: ['monthlyPass'],
  chestOffer: ['chestOffer'],
}

// Which activity type a "转盘/签到/任务"-typed activity maps onto: which reward
// module it shares a draft with. Region is NOT here — every activity record has
// its own, independent of type (see the activityRegion: module and
// settledActivityRegion below).
export const activityTypeMeta = {
  '转盘': { moduleId: 'wheel', title: '转盘奖项与概率', note: '奖项固定 8 格，概率总和必须为 100%；保存后版本号按生效版本自动 +1。' },
  '签到': { moduleId: 'checkin', title: '签到奖励梯度', note: '按自然日发放，大奖固定在最后一天；不支持补签。' },
  '任务': { moduleId: 'missions', title: '任务列表与奖励', note: '任务进度由服务端事件汇总，领取需幂等键；已过期任务不可编辑。' },
}

export const moduleLabels = {
  translations: '多语言内容',
  wheel: '幸运转盘', checkin: '签到奖励梯度', missions: '每日任务', coinPacks: '金币礼包', monthlyPass: '月度特权卡', chestOffer: '明日宝箱报价',
  'games:test': '游戏目录 · 测试环境', 'games:production': '游戏目录 · 生产环境',
}

export function isConfigModule(moduleId) {
  return !!moduleKeys[moduleId] || String(moduleId || '').startsWith('games:') || String(moduleId || '').startsWith('activityRegion:')
}

// moduleLabels only has static keys; activityRegion:<id> is per-activity and not
// enumerable in advance, so it gets a generic label here instead of a name-specific
// one — the review task's own title already names the activity.
export function moduleLabel(moduleId) {
  if (!moduleId) return undefined
  if (String(moduleId).startsWith('activityRegion:')) return '活动投放地区'
  return moduleLabels[moduleId]
}

const clone = (value) => JSON.parse(JSON.stringify(value))

// An activity's own region lives on its own record, addressed by id, exactly like
// a game's region lives on its own record addressed by gameId — the same
// per-record-not-per-type governance, using the same games:<env> style prefix.
const activityRegionId = (moduleId) => moduleId.slice('activityRegion:'.length)

export function getSlice(container, moduleId) {
  if (moduleId.startsWith('games:')) {
    const env = moduleId.split(':')[1]
    return { games: clone(container.games[env]) }
  }
  if (moduleId.startsWith('activityRegion:')) {
    const id = activityRegionId(moduleId)
    const activity = container.activities.find((a) => a.id === id)
    return { region: clone(activity ? activity.region : { mode: 'all', countries: [] }) }
  }
  return Object.fromEntries(moduleKeys[moduleId].map((key) => [key, clone(container[key])]))
}

export function setSlice(container, moduleId, slice) {
  if (moduleId.startsWith('games:')) {
    const env = moduleId.split(':')[1]
    return { ...container, games: { ...container.games, [env]: clone(slice.games) } }
  }
  if (moduleId.startsWith('activityRegion:')) {
    const id = activityRegionId(moduleId)
    return { ...container, activities: container.activities.map((a) => (a.id === id ? { ...a, region: clone(slice.region) } : a)) }
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
    const original = byLocale['zh-Hans']
    const source = byLocale.en
    if (!String(original ?? '').trim()) errors.push(`「${key}」缺少简体中文原文，不能为空`)
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

const gameGateNumbers = [['wealthLevel', '财富等级'], ['charmLevel', '魅力等级'], ['minBalance', '账户余额'], ['playLevel', '可玩等级']]
const gameGenderValues = ['male', 'female']
const promoTagValues = ['none', 'club', 'hot', 'new']

// Old published game snapshots did not carry gate fields. Missing values remain
// unrestricted so a reviewer can still approve or roll back those snapshots.
export function validateGameGates(game) {
  const errors = []
  gameGateNumbers.forEach(([key, label]) => {
    const value = game?.[key]
    if (value === undefined || value === null || value === '') return
    if (!(typeof value === 'number' && Number.isFinite(value) && value >= 0)) errors.push(`${label}门槛必须是大于等于 0 的数字`)
  })
  if (game?.genders !== undefined) {
    if (!Array.isArray(game.genders) || game.genders.length === 0) errors.push('允许性别至少选择一项')
    else if (game.genders.some((gender) => !gameGenderValues.includes(gender))) errors.push('允许性别只能选择男或女')
  }
  if (game?.familyOnly !== undefined && typeof game.familyOnly !== 'boolean') errors.push('家族专属必须是开关值')
  if (game?.promoTag !== undefined && !promoTagValues.includes(game.promoTag)) errors.push('运营标签无效')
  return errors
}

export function validateSnapshot(moduleId, slice) {
  if (moduleId === 'translations') return [...validateTranslations(slice.translations), ...translationReviewErrors(slice.translations, slice.translationReviews)]
  if (moduleId === 'wheel') return validateWheel({ prizes: slice.wheelPrizes, freeSpins: slice.wheelFreeSpins })
  if (moduleId === 'checkin') return validateCheckin(slice.checkinDays)
  if (moduleId === 'missions') return validateMissions(slice.missions)
  if (moduleId === 'coinPacks') return slice.coinPacks.flatMap(validateCoinPack)
  if (moduleId === 'monthlyPass') return validateMonthlyPass(slice.monthlyPass)
  if (moduleId === 'chestOffer') return validateChestOffer(slice.chestOffer)
  if (String(moduleId).startsWith('activityRegion:')) return validateRegion(slice.region, '投放地区')
  if (String(moduleId).startsWith('games:')) {
    if (!Array.isArray(slice?.games)) return ['游戏目录快照无效']
    return slice.games.flatMap(validateGameGates)
  }
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

const gameRecordIds = (game) => [game?.gameId, game?.id].filter((value) => typeof value === 'string' && value)

// Game status and maintenance copy are emergency controls. A reviewed catalogue
// snapshot must never roll either field back to the value it had when queued.
function mergeGameSnapshotWithLive(liveSlice, snapshot) {
  if (!Array.isArray(liveSlice?.games) || !Array.isArray(snapshot?.games)) return snapshot
  const liveById = new Map()
  liveSlice.games.forEach((game) => gameRecordIds(game).forEach((id) => liveById.set(id, game)))
  return {
    ...snapshot,
    games: snapshot.games.map((game) => {
      const live = gameRecordIds(game).map((id) => liveById.get(id)).find(Boolean)
      if (!live) return game
      return {
        ...game,
        ...(Object.hasOwn(live, 'status') ? { status: live.status } : {}),
        ...(Object.hasOwn(live, 'maintenanceNote') ? { maintenanceNote: live.maintenanceNote } : {}),
      }
    }),
  }
}

// Applies a 发布审核 decision to the whole store. Pure: returns a new store.
export function applyRelease(store, entry, decision, reason, meta = {}) {
  const spec = releaseDecisions[decision]
  if (!spec) return store
  const time = meta.time || '刚刚'
  const seq = meta.seq ?? 0
  const audit = (patch) => ({
    id: `audit-${seq}-${entry.id}-${decision}`, logId: `#${seq.toString(16).slice(-4).padStart(4, '0')}`, actor: meta.actor || '运营管理员', time,
    targetModule: 'publish', targetId: entry.id, target: entry.name, action: entry.sourceModule === 'translations' ? `模拟 · ${spec.action}` : spec.action, before: entry.status, after: spec.status,
    result: reason ? `成功 · 原因：${reason}` : '成功', ...patch,
  })
  const moduleId = entry.sourceModule
  const hasSnapshot = isConfigModule(moduleId) && !!entry.snapshot
  const isTranslations = moduleId === 'translations'
  // A review may arrive after an editor has continued working on a newer draft.
  // The historical snapshot still becomes the live baseline, while that newer
  // draft and its independent review metadata must remain available for follow-up.
  const hasNewerTranslationDraft = isTranslations && JSON.stringify(getSlice(store, moduleId)) !== JSON.stringify(entry.snapshot)
  let next = store
  if ((decision === 'approve' || decision === 'gray') && hasSnapshot) {
    const errors = validateSnapshot(moduleId, entry.snapshot)
    if (errors.length) return { ...store, audit: [audit({ after: entry.status, result: `失败 · ${errors.join('；')}` }), ...store.audit] }
    if (entry.status !== '灰度 20%') {
      const previous = getSlice(store.live, moduleId)
      const applied = String(moduleId).startsWith('games:') ? mergeGameSnapshotWithLive(previous, entry.snapshot) : entry.snapshot
      next = { ...next, live: setSlice(store.live, moduleId, applied), liveHistory: { ...store.liveHistory, [moduleId]: [previous, ...(store.liveHistory[moduleId] || [])].slice(0, 10) } }
      if (!hasNewerTranslationDraft) next = setSlice(next, moduleId, applied)
    }
  }
  if (decision === 'reject' && hasSnapshot && !hasNewerTranslationDraft) next = resetDraftToLive(next, moduleId)
  if (decision === 'rollback' && hasSnapshot) {
    const history = store.liveHistory[moduleId] || []
    if (!history.length) return { ...store, audit: [audit({ after: entry.status, result: '失败 · 没有可回滚的历史版本' }), ...store.audit] }
    const [previous, ...rest] = history
    const restored = String(moduleId).startsWith('games:') ? mergeGameSnapshotWithLive(getSlice(next.live, moduleId), previous) : previous
    next = { ...next, live: setSlice(next.live, moduleId, restored), liveHistory: { ...next.liveHistory, [moduleId]: rest } }
    const hasNewerDraftThanLive = isTranslations && JSON.stringify(getSlice(store, moduleId)) !== JSON.stringify(getSlice(store.live, moduleId))
    if (!hasNewerDraftThanLive) next = setSlice(next, moduleId, restored)
  }
  next = { ...next, publish: next.publish.map((p) => (p.id === entry.id ? { ...p, status: spec.status, time } : p)) }
  if (['approve', 'reject', 'rollback'].includes(decision)) next = { ...next, todo: next.todo.map((t) => (t.publishId === entry.id ? { ...t, status: '已解决', time } : t)) }
  return { ...next, audit: [audit({}), ...next.audit] }
}

// ---- snapshot diff ---------------------------------------------------------
const cell = (value) => (Array.isArray(value) ? (value.join(' / ') || '无') : (value === '' || value === null || value === undefined ? '—' : String(value)))
const yesNo = (value) => (value ? '是' : '否')
// Every per-game field the editor can change, so a config update diff is not summarised away.
const regionCell = (value) => {
  const scope = normalizeRegion(value)
  return scope.mode === 'all' ? '全球开放' : `${scope.countries.length} 个国家/地区：${scope.countries.join(' ')}`
}

// 'description' is not here: game copy now lives in the translations module and shows
// up in ITS OWN diff, keyed per language, instead of being summarised into one string here.
const gameDiffFields = [
  ['name', '游戏名称'], ['status', '运行状态'], ['categoryLabel', '分类'], ['tags', '标签'], ['badges', '角标'],
  ['popular', '大厅推荐', yesNo], ['heat', '热度值'], ['sortWeight', '排序权重'], ['cover', '封面资源'],
  ['maintenanceNote', '维护公告'], ['launchAt', '预计上线时间'], ['region', '可用地区', regionCell],
  ['wealthLevel', '财富等级门槛'], ['charmLevel', '魅力等级门槛'], ['minBalance', '账户余额门槛'], ['playLevel', '可玩等级门槛'],
  ['genders', '允许性别', (value) => Array.isArray(value) ? (value.map((gender) => ({ male: '男', female: '女' })[gender] || gender).join(' / ') || '无') : '不限'],
  ['familyOnly', '家族专属', yesNo], ['promoTag', '运营标签', (value) => ({ none: '无标签', club: 'Club', hot: 'Hot', new: 'New' })[value] || '无标签'],
  ['winRate', '中奖率'], ['rtp', 'RTP'], ['winRangeMin', '中奖金额下限'], ['winRangeMax', '中奖金额上限'], ['maxMultiplier', '最大赔率'],
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
      Object.entries(byLocale).map(([locale, text]) => [`${key}|${locale}`, `${key} · ${locale}`, cell(text) + (slice.translationReviews && locale !== 'zh-Hans' && String(text ?? '').trim() ? needsTranslationReview(byLocale, slice.translationReviews[key], locale) ? ' · 待复核' : ' · 已复核' : '')]))
  }
  if (String(moduleId).startsWith('activityRegion:')) return [['region', '投放地区', regionCell(slice.region)]]
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
  const effectiveAfter = String(moduleId).startsWith('games:') ? mergeGameSnapshotWithLive(before, after) : after
  const b = toMap(snapshotRows(moduleId, effectiveAfter))
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

// ---- geographic scope ------------------------------------------------------
// A scope is either the whole world or an explicit include-list of countries.
// An include-list is the safer default for a regulated product: a country that
// nobody has thought about is closed, not open. "A whole continent except three
// countries" is expressed by selecting the continent and then deselecting those
// three, which is why the stored value is the resolved country list rather than
// a continent list with exceptions.
export const REGION_ALL = 'all'
export const REGION_CUSTOM = 'custom'

export function normalizeRegion(value) {
  if (value && typeof value === 'object' && Array.isArray(value.countries)) {
    const mode = value.mode === REGION_CUSTOM ? REGION_CUSTOM : REGION_ALL
    return { mode, countries: mode === REGION_CUSTOM ? [...new Set(value.countries)].sort() : [] }
  }
  // Everything before the geographic model was one free-text string; '全区' and
  // anything unrecognised mean "open everywhere".
  return { mode: REGION_ALL, countries: [] }
}

export function regionOpensIn(region, country) {
  const scope = normalizeRegion(region)
  return scope.mode === REGION_ALL || scope.countries.includes(country)
}

export function validateRegion(region, label = '可用地区') {
  const scope = normalizeRegion(region)
  if (scope.mode === REGION_CUSTOM && scope.countries.length === 0) {
    return [`${label}：选择了「指定国家/地区」但一个都没有勾选，这会导致所有玩家都看不到`]
  }
  return []
}

// Groups an include-list by continent so both the editor and the audit trail can
// say "亚洲 51 国" instead of listing 51 codes.
export function regionByContinent(region, countryContinent, continentCodes) {
  const scope = normalizeRegion(region)
  return continentCodes.map((code) => {
    const all = Object.keys(countryContinent).filter((c) => countryContinent[c] === code)
    const selected = scope.mode === REGION_ALL ? all : all.filter((c) => scope.countries.includes(c))
    return { continent: code, total: all.length, selected, state: selected.length === 0 ? 'none' : selected.length === all.length ? 'all' : 'some' }
  })
}

// Short human summary for tables, audit entries and publish diffs.
export function regionSummary(region, countryContinent, continentCodes, continentName = (c) => c) {
  const scope = normalizeRegion(region)
  if (scope.mode === REGION_ALL) return '全球开放'
  const groups = regionByContinent(scope, countryContinent, continentCodes).filter((g) => g.selected.length)
  if (!groups.length) return '未选择任何国家/地区'
  const parts = groups.map((g) =>
    g.state === 'all' ? `${continentName(g.continent)}全境` : `${continentName(g.continent)} ${g.selected.length} 个`)
  return `${scope.countries.length} 个国家/地区 · ${parts.join('、')}`
}

// A type (转盘/签到/任务) can have several activity records, each with its own
// region — but only one of them is ever "进行中" at a time, and that is the one
// actually reachable by players of that type. Computed on demand from live
// records rather than stored anywhere, so it cannot drift out of sync with
// which record is actually 进行中.
export function settledActivityRegion(activities, type) {
  const live = (activities || []).find((a) => a.type === type && a.status === '进行中')
  return live ? normalizeRegion(live.region) : { mode: REGION_ALL, countries: [] }
}
