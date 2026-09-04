// Seed data, column definitions and status-transition tables for the admin console prototype.
// Everything here is in-memory sample data: no persistence, no real service calls.
import { games as gamesData, checkinDays as checkinDaysData, dailyMissions, coinPacks as coinPacksData } from '../data.js'
import liteContent from '../data/liteContent.json'
import engagementPreview from '../data/engagementPreview.json' with { type: 'json' }
import { parseReward } from './adminRules.js'

export const statusLabel = { ready: '正常可玩', maintenance: '维护中', upcoming: '即将上线', unavailable: '暂不可用' }

export const missionEventLabel = { 'spin-100': '旋转次数', 'casual-5': '休闲游戏局数', 'free-spin': '触发 Free Spin', 'share-win': '分享中奖事件' }
export const missionEventOptions = ['旋转次数', '休闲游戏局数', '触发 Free Spin', '分享中奖事件', '完成游戏局数', '登录并领取签到']

// Matches the front-end's WalletLedger source set; manual_adjust is admin-only until the front-end enum is extended.
export const ledgerSourceLabel = { chest_purchase: '购买明日宝箱', chest_reward: '明日宝箱开奖', game_reward: '游戏派奖', game_cost: '游戏消耗', checkin: '签到奖励', task: '任务奖励', manual_adjust: '人工调整' }
export const ledgerStatusLabel = { completed: '成功', processing: '处理中', failed: '失败' }

// transitions[module][currentStatus] = [[actionLabel, nextStatus, opts?], ...]
// opts.requireReason -> the action needs a written reason; opts.logOnly -> writes audit but keeps status;
// opts.decision -> handled by applyRelease (publish page); opts.effect -> cross-module side effect in AdminApp;
// opts.metric -> also rewrites the row's 质量指标 text; opts.resultLabel -> audit result text override.
export const transitions = {
  orders: {
    '待支付': [['取消订单', '已取消']],
    '处理中': [['标记异常', '异常']],
    '已支付': [['发起退款', '退款处理中', { requireReason: true }], ['标记拒付异常', '异常', { requireReason: true }]],
    '退款处理中': [['确认退款完成', '已退款'], ['驳回退款', '已支付', { requireReason: true }]],
    '失败': [['标记异常', '异常']],
    '异常': [['人工确认已支付', '已支付', { requireReason: true }], ['人工标记失败', '失败', { requireReason: true }]],
  },
  players: {
    '正常': [['设为活动限制', '活动限制', { requireReason: true }], ['标记待复核', '待复核', { requireReason: true }], ['封禁账号', '已封禁', { requireReason: true }]],
    '活动限制': [['解除限制', '正常', { requireReason: true }]],
    '待复核': [['复核通过', '正常', { requireReason: true }], ['封禁账号', '已封禁', { requireReason: true }]],
    '已封禁': [['解封账号', '正常', { requireReason: true }]],
  },
  todo: {
    '待处理': [['开始处理', '处理中']],
    '待审核': [['开始处理', '处理中']],
    '处理中': [['标记已解决', '已解决']],
  },
  publish: {
    '待审核': [['通过并发布', '已发布', { decision: 'approve' }], ['灰度发布', '灰度 20%', { decision: 'gray' }], ['驳回', '已驳回', { requireReason: true, decision: 'reject' }]],
    '灰度 20%': [['扩大到全量', '已发布', { decision: 'approve' }], ['暂停', '已暂停', { decision: 'pause' }], ['回滚', '已回滚', { requireReason: true, decision: 'rollback' }]],
    '进行中': [['扩大到全量', '已发布', { decision: 'approve' }], ['暂停', '已暂停', { decision: 'pause' }], ['回滚', '已回滚', { requireReason: true, decision: 'rollback' }]],
    '已发布': [['暂停', '已暂停', { decision: 'pause' }], ['回滚', '已回滚', { requireReason: true, decision: 'rollback' }]],
    '已暂停': [['恢复发布', '已发布', { decision: 'resume' }], ['回滚', '已回滚', { requireReason: true, decision: 'rollback' }]],
    '已驳回': [['重新提交', '待审核', { decision: 'resubmit' }]],
  },
  adminUsers: {
    '启用': [['停用账号', '已停用', { requireReason: true }]],
    '已停用': [['启用账号', '启用']],
    '待激活': [['重发激活邮件', '待激活', { logOnly: true, resultLabel: '待联调 · 已记录发送请求，邮件服务未接入' }], ['停用账号', '已停用']],
  },
  activities: {
    '草稿': [['提交审核', '待审核']],
    '待审核': [['通过并发布', '进行中'], ['驳回', '草稿', { requireReason: true }]],
    '进行中': [['暂停', '已暂停'], ['结束', '已结束']],
    '已暂停': [['恢复', '进行中'], ['结束', '已结束']],
    '已结束': [['归档', '已归档']],
  },
  versions: {
    '上传失败': [['重新上传', '检查中']],
    '检查中': [['标记检查通过', '测试通过']],
    '测试通过': [['提交生产发布', '待审核', { effect: 'submitProduction' }]],
    '待审核': [['通过并发布', '已发布'], ['驳回', '测试通过', { requireReason: true }]],
    '已发布': [['回滚到上一版本', '已回滚', { requireReason: true }]],
  },
  uploads: {
    '检查中': [['标记校验通过', '校验通过']],
    '校验通过': [['生成版本记录', '已生成版本', { effect: 'createVersion' }]],
    '上传失败': [['重新上传', '检查中']],
  },
  test: {
    '测试中': [['标记测试通过', '测试通过', { metric: 'QA 验证通过' }], ['标记测试失败', '测试失败', { requireReason: true, metric: '测试未通过' }]],
    '测试通过': [['提交生产发布', '已提交生产', { effect: 'submitProduction', metric: '已提交生产发布' }]],
    '测试失败': [['重新测试', '测试中', { metric: '待 QA 验证' }]],
  },
  production: {
    '维护中': [['恢复运行', '已发布', { metric: '运行正常' }]],
    '已发布': [['进入维护', '维护中', { requireReason: true, metric: '维护中，暂停对外服务' }]],
  },
  ledger: {
    '处理中': [['确认入账', '成功'], ['驳回调整', '失败', { requireReason: true }]],
  },
}

export const columns = {
  orders: [['id', '订单号'], ['player', '玩家'], ['product', '商品'], ['amount', '金额'], ['status', '状态'], ['time', '时间']],
  players: [['name', '昵称'], ['playerId', '玩家 ID'], ['level', '等级'], ['coins', '金币余额'], ['gems', '宝石余额'], ['status', '账号状态'], ['lastActive', '最近活跃']],
  todo: [['title', '事项'], ['source', '来源模块'], ['priority', '优先级'], ['status', '状态'], ['time', '更新时间'], ['owner', '负责人']],
  publish: [['name', '版本名称'], ['type', '对象类型'], ['scope', '发布范围'], ['status', '状态'], ['owner', '负责人'], ['time', '更新时间']],
  audit: [['logId', '日志 ID'], ['actor', '操作人'], ['action', '操作类型'], ['target', '对象'], ['result', '结果'], ['time', '时间']],
  activities: [['name', '活动名称'], ['type', '类型'], ['period', '活动周期'], ['status', '状态'], ['participants', '参与人数'], ['owner', '负责人']],
  checkin: [['name', '活动名称'], ['period', '周期'], ['participants', '参与人数'], ['status', '状态'], ['budget', '奖励预算'], ['owner', '负责人']],
  wheel: [['name', '转盘名称'], ['prizeCount', '奖项数量'], ['freeSpins', '免费次数'], ['status', '状态'], ['probabilityState', '概率校验'], ['version', '版本']],
  ledger: [['id', '流水 ID'], ['player', '玩家'], ['amount', '变动金额'], ['source', '来源'], ['status', '状态'], ['time', '时间']],
  adminUsers: [['name', '姓名'], ['email', '账号'], ['role', '角色'], ['status', '状态'], ['scope', '权限范围'], ['lastLogin', '最近登录']],
  versions: [['game', '游戏名称'], ['version', '版本号'], ['production', '当前生产'], ['status', '版本状态'], ['scope', '发布范围'], ['time', '更新时间']],
  uploads: [['recordId', '记录 ID'], ['bundle', '版本包'], ['file', '文件信息'], ['status', '校验状态'], ['uploader', '上传人'], ['time', '时间']],
  test: [['version', '版本'], ['build', '构建号/范围'], ['env', '环境'], ['status', '状态'], ['metric', '质量指标'], ['time', '更新时间']],
  production: [['version', '版本'], ['build', '构建号/范围'], ['env', '环境'], ['status', '状态'], ['metric', '质量指标'], ['time', '更新时间']],
  rewardClaims: [['id', '领取 ID'], ['player', '玩家'], ['source', '来源'], ['title', '奖励项目'], ['reward', '奖励'], ['status', '状态'], ['time', '时间']],
  entitlements: [['player', '玩家'], ['status', '月卡状态'], ['activatedAt', '生效时间'], ['expiresAt', '到期时间'], ['todayClaimed', '当日领取'], ['claimedDays', '累计领取天数']],
  chestRecords: [['id', '宝箱 ID'], ['player', '玩家'], ['purchaseDay', '购买日'], ['status', '状态'], ['rewardCoins', '奖励金币'], ['offerVersion', '报价版本'], ['openedAt', '开启时间']],
}

function zip(rows, page) {
  const cols = columns[page]
  return rows.map((row, index) => {
    const record = { id: `${page}-${index}` }
    cols.forEach(([key], i) => { record[key] = row[i] })
    return record
  })
}

const rawRows = {
  activities: [
    ['幸运旋转狂欢季', '转盘', '2026-08-20 — 2026-09-20', '进行中', '24,680', '运营一组'],
    ['七日签到 · 秋日版', '签到', '2026-08-01 — 2026-09-30', '进行中', '18,420', '运营二组'],
    ['每日任务 3.1', '任务', '每日刷新', '草稿', '—', '产品组'],
  ],
  orders: [
    ['JL-2026-090101', 'NovaPlayer', '68,000 金币礼包', '$4.90', '已支付', '今天 14:42'],
    ['JL-2026-090099', 'MintCat', '30,000 金币礼包', '$2.46', '退款处理中', '今天 13:05'],
    ['JL-2026-090095', 'CloudNine', '月度特权卡', '$9.90', '待支付', '今天 12:20'],
    ['JL-2026-090088', 'BlueFin', '6,000 金币礼包', '$0.55', '处理中', '今天 11:40'],
    ['JL-2026-090081', 'NovaPlayer', '128,000 金币礼包', '$7.68', '失败', '今天 10:15'],
    ['JL-2026-083120', 'MintCat', '月度特权卡', '$9.90', '已退款', '昨天 20:05'],
    ['JL-2026-083098', 'CloudNine', '68,000 金币礼包', '$4.90', '异常', '昨天 18:32'],
  ],
  players: [
    ['NovaPlayer', 'JL-2048', 'Lv.11', '52,860', '84', '正常', '今天 14:42'],
    ['MintCat', 'JL-1002', 'Lv.18', '128,420', '210', '正常', '今天 14:35'],
    ['BlueFin', 'JL-1003', 'Lv.7', '8,200', '42', '活动限制', '昨天 22:10'],
    ['CloudNine', 'JL-1004', 'Lv.24', '680,000', '960', '待复核', '昨天 21:58'],
  ],
  todo: [
    ['Ocean 777 维护超过 2 小时', '游戏运营', '高', '待处理', '12 分钟前', '运营一组'],
    ['七日签到 · 秋日版 v2 等待发布审核', '活动中心', '中', '待审核', '28 分钟前', '审核组'],
    ['2 笔退款订单待财务确认', '商城与经济', '中', '处理中', '1 小时前', '财务组'],
    ['CloudNine 账号待复核（大额余额异动）', '玩家', '高', '待处理', '2 小时前', '风控组'],
  ],
  publish: [
    ['幸运旋转狂欢季 v3', '活动版本', '灰度 20%', '进行中', '运营一组', '10 分钟前'],
    ['Fish Hunter 配置更新', '游戏配置', '全量', '已发布', '产品组', '昨天 18:20'],
    ['七日签到 · 秋日版 v2', '活动版本', '生产环境', '待审核', '运营二组', '昨天 17:05'],
  ],
  audit: [
    ['#8f2c', '运营一组', '调整幸运转盘概率配置', '幸运旋转狂欢季 · 主转盘', '成功', '今天 14:36'],
    ['#8f2a', '运营一组', '修改转盘奖项配置', '幸运旋转狂欢季 · 主转盘', '成功', '今天 14:32'],
    ['#8e90', '财务组', '发起退款', 'JL-2026-090099', '成功 · 原因：玩家申请', '今天 13:05'],
    ['#8d71', '系统', '游戏自动进入维护', 'Ocean 777', '成功', '今天 12:48'],
  ],
  checkin: [
    ['七日签到 · 秋日版', '7 天', '18,420', '进行中', '总预算 6,800,000', '运营二组'],
    ['新用户首周签到', '7 天', '6,820', '已结束', '总预算 1,200,000', '增长组'],
  ],
  wheel: [
    ['幸运旋转狂欢季 · 主转盘', '8 个奖项', '3 次 / 日', '进行中', '概率已校验', 'v3'],
    ['新手免费转盘', '6 个奖项', '1 次 / 账号', '草稿', '概率未配置', 'v1'],
  ],
  versions: [
    ['Golden Pharaoh', 'v2.4.1 · build 9821', '生产 v2.3.8', '测试通过', '全区', '今天 14:20'],
    ['Fruit Party', 'v1.8.0 · build 7710', '生产 v1.7.6', '待审核', '灰度 20%', '今天 13:46'],
    ['Ocean 777', 'v3.0.0 · build 6412', '生产 v2.9.4', '上传失败', '—', '昨天 19:08'],
  ],
  uploads: [
    ['UP-20260901-019', 'Golden Pharaoh v2.4.1', 'ZIP · 18.4 MB', '校验通过', '运营一组', '今天 14:18'],
    ['UP-20260901-017', 'Fruit Party v1.8.0', 'ZIP · 12.7 MB', '检查中', '产品组', '今天 13:44'],
    ['UP-20260831-088', 'Ocean 777 v3.0.0', 'ZIP · 22.1 MB', '上传失败', '研发组', '昨天 19:08'],
  ],
  test: [
    ['Golden Pharaoh v2.4.1', 'build 9821', '测试环境', '测试通过', '启动成功率 99.8%', '今天 14:25'],
    ['Fruit Party v1.8.0', 'build 7710', '测试环境', '测试中', '待 QA 验证', '今天 13:52'],
  ],
  production: [
    ['Golden Pharaoh v2.3.8', '全区', '生产环境', '已发布', '启动成功率 99.6%', '昨天 18:20'],
    ['Fruit Party v1.7.6', '全区', '生产环境', '已发布', '启动成功率 99.4%', '8 月 28 日'],
    ['Ocean 777 v2.9.4', '全区', '生产环境', '维护中', '维护超过 2 小时', '今天 12:48'],
  ],
  adminUsers: [
    ['林舟', 'linzhou@joyloop.dev', '活动运营', '启用', '测试 + 生产只读', '今天 14:05'],
    ['周岚', 'lan.zhou@joyloop.dev', '财务人员', '启用', '生产', '今天 12:18'],
    ['陈默', 'chenmo@joyloop.dev', '审核人员', '待激活', '测试', '昨天 17:40'],
  ],
}

const auditTargets = [
  { targetModule: 'wheel', targetId: 'main', before: '概率 [22,15,15,10,20,6,8,4]', after: '概率 [22,15,15,10,20,6,8,4]' },
  { targetModule: 'wheel', targetId: 'main', before: '', after: '' },
  { targetModule: 'orders', targetId: 'JL-2026-090099', before: '已支付', after: '退款处理中' },
  { targetModule: 'games', targetId: 'ocean-777', before: '正常可玩', after: '维护中' },
]

export const roleSeed = [
  { id: 'role-campaign-ops', role: '活动运营', menuScope: ['活动中心'], actions: ['创建', '编辑', '测试发布'], prodPermission: '生产只读' },
  { id: 'role-game-ops', role: '游戏运营', menuScope: ['游戏运营'], actions: ['上传', '排序', '测试发布'], prodPermission: '生产需审批' },
  { id: 'role-finance', role: '财务人员', menuScope: ['商品与权益'], actions: ['查询', '退款', '对账'], prodPermission: '生产可操作' },
  { id: 'role-review', role: '审核人员', menuScope: ['运营概览'], actions: ['审核', '驳回', '查看差异'], prodPermission: '不可直接发布' },
]

export const wheelPrizeSeed = [
  { id: 'prize-1', label: '800 金币', kind: 'coins', amount: 800, probability: 22 },
  { id: 'prize-2', label: '2 宝石', kind: 'gems', amount: 2, probability: 15 },
  { id: 'prize-3', label: '1,200 金币', kind: 'coins', amount: 1200, probability: 15 },
  { id: 'prize-4', label: '1 次免费旋转', kind: 'freeSpin', amount: 1, probability: 10 },
  { id: 'prize-5', label: '300 金币', kind: 'coins', amount: 300, probability: 20 },
  { id: 'prize-6', label: '5 宝石', kind: 'gems', amount: 5, probability: 6 },
  { id: 'prize-7', label: '2,000 金币', kind: 'coins', amount: 2000, probability: 8 },
  { id: 'prize-8', label: '500 金币', kind: 'coins', amount: 500, probability: 4 },
]

// Wallet ledger: NovaPlayer rows come straight from engagementPreview.walletLedger (with real before/after balances);
// the chest rows and MintCat row are prototype samples that keep the same field shape.
const previewLedgerTimes = { 10: '今天 14:50', 20: '今天 14:40', 30: '今天 14:30', 40: '今天 14:20' }
const ledgerSeed = () => {
  const preview = [...engagementPreview.walletLedger].sort((a, b) => b.minutesAgo - a.minutesAgo)
  const fromPreview = preview.map((row, index) => ({
    id: `#WL-${90101 + index}`, player: 'NovaPlayer', playerId: 'JL-2048', currency: row.currency, amount: row.amount, source: row.source,
    status: row.status, time: previewLedgerTimes[row.minutesAgo] || '今天', balanceBefore: row.balanceBefore, balanceAfter: row.balanceAfter, ref: '',
  }))
  const extra = [
    { id: '#WL-90106', player: 'NovaPlayer', playerId: 'JL-2048', currency: 'coins', amount: 2400, source: 'chest_reward', status: 'processing', time: '今天 00:05', balanceBefore: null, balanceAfter: null, ref: 'chest-2026-09-03' },
    { id: '#WL-90100', player: 'NovaPlayer', playerId: 'JL-2048', currency: 'coins', amount: -500, source: 'chest_purchase', status: 'completed', time: '昨天 20:12', balanceBefore: 50500, balanceAfter: 50000, ref: 'chest-2026-09-03' },
    { id: '#WL-90099', player: 'MintCat', playerId: 'JL-1002', currency: 'coins', amount: -500, source: 'chest_purchase', status: 'completed', time: '昨天 20:10', balanceBefore: 128920, balanceAfter: 128420, ref: 'chest-2026-09-03-mintcat' },
  ]
  return [extra[0], ...fromPreview.reverse(), extra[1], extra[2]]
}

const rewardClaimSeed = [
  { id: 'RC-0106', player: 'NovaPlayer', playerId: 'JL-2048', source: '明日宝箱', title: '2026-09-03 宝箱开奖', reward: '+2,400 金币', status: '发放中', time: '今天 00:05', idempotencyKey: 'chest-open-chest-2026-09-03', ledgerId: '#WL-90106' },
  { id: 'RC-0105', player: 'NovaPlayer', playerId: 'JL-2048', source: '每日任务', title: '累计旋转 100 次', reward: '+2 宝石', status: '已发放', time: '今天 14:50', idempotencyKey: 'task-claim-spin-100-2026-09-04', ledgerId: '#WL-90105' },
  { id: 'RC-0104', player: 'NovaPlayer', playerId: 'JL-2048', source: '七日签到', title: 'D3 每日签到', reward: '+60 金币 · 2 宝石', status: '已发放', time: '今天 14:40', idempotencyKey: 'checkin-claim-2026-09-04', ledgerId: '#WL-90103 / #WL-90104' },
  { id: 'RC-0103', player: 'MintCat', playerId: 'JL-1002', source: '幸运转盘', title: '第 2 次免费旋转', reward: '+800 金币', status: '已发放', time: '今天 13:20', idempotencyKey: 'wheel-spin-2026-09-04-2', ledgerId: '待联调（前台流水枚举暂无转盘来源）' },
  { id: 'RC-0102', player: 'CloudNine', playerId: 'JL-1004', source: '每日任务', title: '完成 5 局休闲游戏', reward: '+1,000 金币 · 2 宝石', status: '发放失败', time: '昨天 23:40', idempotencyKey: 'task-claim-casual-5-2026-09-03', ledgerId: '—' },
  { id: 'RC-0101', player: 'BlueFin', playerId: 'JL-1003', source: '七日签到', title: 'D1 每日签到', reward: '+800 金币', status: '已发放', time: '昨天 21:10', idempotencyKey: 'checkin-claim-2026-09-03', ledgerId: '—' },
]

const entitlementSeed = [
  { id: 'ent-JL-2048', player: 'NovaPlayer', playerId: 'JL-2048', status: '未开通', activatedAt: '—', expiresAt: '—', todayClaimed: '—', claimedDays: 0 },
  { id: 'ent-JL-1002', player: 'MintCat', playerId: 'JL-1002', status: '生效中', activatedAt: '2026-08-15', expiresAt: '2026-09-14', todayClaimed: '已领取', claimedDays: 20 },
  { id: 'ent-JL-1003', player: 'BlueFin', playerId: 'JL-1003', status: '已到期', activatedAt: '2026-07-01', expiresAt: '2026-07-31', todayClaimed: '—', claimedDays: 27 },
  { id: 'ent-JL-1004', player: 'CloudNine', playerId: 'JL-1004', status: '生效中', activatedAt: '2026-08-30', expiresAt: '2026-09-29', todayClaimed: '未领取', claimedDays: 4 },
]

const chestRecordSeed = () => [
  { id: 'chest-2026-09-03', player: 'NovaPlayer', playerId: 'JL-2048', purchaseDay: '2026-09-03', status: '待开启', rewardCoins: null, offerVersion: engagementPreview.offer.version, unlockAt: '2026-09-04 00:00', expiresAt: '2026-09-05 00:00', openedAt: '—' },
  ...engagementPreview.chestOpenings.map((item, index) => ({
    id: `chest-2026-09-02-${item.playerId}`, player: item.name, playerId: item.playerId, purchaseDay: '2026-09-02', status: '已开启', rewardCoins: item.rewardCoins,
    offerVersion: engagementPreview.offer.version, unlockAt: '2026-09-03 00:00', expiresAt: '2026-09-04 00:00', openedAt: `2026-09-03 0${7 + index}:1${index}`,
  })),
  { id: 'chest-2026-09-01-JL-1006', player: 'OceanPilot', playerId: 'JL-1006', purchaseDay: '2026-09-01', status: '已过期', rewardCoins: null, offerVersion: engagementPreview.offer.version, unlockAt: '2026-09-02 00:00', expiresAt: '2026-09-03 00:00', openedAt: '—' },
]

export function createInitialStore() {
  const gameRecords = () => gamesData.map((g, index) => ({
    id: g.id, name: g.name, gameId: g.id, categoryLabel: g.categoryLabel, tags: [...g.tags], badges: [...g.badges],
    status: statusLabel[g.status] || g.status, players: g.players, heat: g.heat, popular: g.popular, region: '全区',
    cover: g.cover, sortWeight: (index + 1) * 10,
    maintenanceNote: g.status === 'maintenance' ? '服务端例行维护中，预计 2 小时内恢复。' : '',
    launchAt: g.status === 'upcoming' ? '2026-09-15 10:00' : '',
    description: liteContent.gameDetails?.[g.id]?.descriptionKey || '',
    winRate: liteContent.gameDetails?.[g.id]?.winRate || '', rtp: liteContent.gameDetails?.[g.id]?.rtp || '',
    winRange: liteContent.gameDetails?.[g.id]?.winRange || '', maxMultiplier: liteContent.gameDetails?.[g.id]?.maxMultiplier || '',
    // Standard slot parameters the current front-end does not read yet; kept empty rather than filled with invented values.
    minBet: '', paylines: '', volatility: '',
  }))
  const config = {
    games: { test: gameRecords(), production: gameRecords() },
    checkinDays: checkinDaysData.map((d) => { const { coins, gems } = parseReward(d.reward); return { ...d, coins, gems, grand: !!d.grand } }),
    wheelPrizes: wheelPrizeSeed.map((p) => ({ ...p })),
    wheelFreeSpins: liteContent.events.wheelFreeSpins,
    wheelVersion: 3,
    missions: dailyMissions.map((m) => ({
      id: m.id, name: m.title, event: missionEventLabel[m.id] || m.id, target: m.total,
      coinReward: m.coinReward, gemReward: m.gemReward, cycle: m.expired ? '历史' : '每日',
      status: m.expired ? '已过期' : '生效中', expired: !!m.expired,
    })),
    coinPacks: coinPacksData.map((p) => ({ ...p, status: '生效中' })),
    monthlyPass: { ...liteContent.products.monthlyPass, status: '生效中' },
    chestOffer: { ...engagementPreview.offer, productId: liteContent.products.tomorrowChest.productId },
  }
  const publish = zip(rawRows.publish, 'publish').map((p) => ({ ...p, sourceModule: '', sourceId: '', snapshot: null }))
  // Each todo carries the object it is about, so "去处理" lands on that record instead of only flipping a label.
  const todoLinks = [
    { page: 'games', focusId: 'ocean-777', label: '打开 Ocean 777 游戏配置' },
    { page: 'publish', focusId: publish[2].id, label: '打开发布审核任务' },
    { page: 'orders', query: '退款处理中', label: '查看退款处理中的订单' },
    { page: 'players', tab: 'players', query: 'CloudNine', label: '打开 CloudNine 玩家档案' },
  ]
  const todo = zip(rawRows.todo, 'todo').map((t, i) => ({ ...t, publishId: i === 1 ? publish[2].id : '', link: todoLinks[i] || null, claimedBy: t.status === '处理中' ? t.owner : '', resolution: '' }))
  return {
    ...JSON.parse(JSON.stringify(config)),
    live: JSON.parse(JSON.stringify(config)),
    liveHistory: {},
    activities: zip(rawRows.activities, 'activities'),
    orders: zip(rawRows.orders, 'orders'),
    players: zip(rawRows.players, 'players'),
    todo,
    publish,
    audit: zip(rawRows.audit, 'audit').map((r, i) => ({ ...r, ...auditTargets[i] })),
    checkin: zip(rawRows.checkin, 'checkin'),
    wheel: zip(rawRows.wheel, 'wheel'),
    ledger: ledgerSeed(),
    versions: zip(rawRows.versions, 'versions'),
    uploads: zip(rawRows.uploads, 'uploads'),
    test: zip(rawRows.test, 'test'),
    production: zip(rawRows.production, 'production'),
    adminUsers: zip(rawRows.adminUsers, 'adminUsers').map((r) => ({ ...r, mfa: r.status !== '待激活' })),
    roles: roleSeed.map((r) => ({ ...r })),
    winEvents: engagementPreview.wins.map((e) => ({ ...e, visible: true })),
    chestOpenings: engagementPreview.chestOpenings.map((c) => ({ ...c, visible: true })),
    winsConfig: { rankLimit: 10, chestLimit: 5 },
    rewardClaims: rewardClaimSeed.map((r) => ({ ...r })),
    entitlements: entitlementSeed.map((r) => ({ ...r })),
    chestRecords: chestRecordSeed(),
  }
}
