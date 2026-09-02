import { useMemo, useState } from 'react'
import { Icon } from '../icons.jsx'
import { games, gameCategories, checkinDays, dailyMissions, coinPacks } from '../data.js'
import liteContent from '../data/liteContent.json'
import engagementPreview from '../data/engagementPreview.json' with { type: 'json' }
import { rankings as aggregateWinnerRankings } from '../engagement/model.js'

const navGroups = [
  { title: '运营概览', items: [['dashboard', '运营概览', 'gauge'], ['todo', '待处理事项', 'bell'], ['publish', '发布审核', 'play'], ['audit', '操作日志', 'clock']] },
  { title: '游戏运营', items: [['games', '游戏管理', 'gamepad'], ['versions', '游戏版本发布', 'bolt'], ['wins', '赢家与动态', 'trophy']] },
  { title: '活动中心', items: [['activities', '活动管理', 'gift'], ['checkin', '签到活动', 'calendar'], ['wheel', '幸运转盘', 'refresh'], ['missions', '每日任务', 'flag']] },
  { title: '商品与权益', items: [['store', '商品与权益', 'store'], ['orders', '订单管理', 'wallet'], ['ledger', '钱包流水', 'coin']] },
  { title: '玩家', items: [['players', '玩家管理', 'user']] },
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
  players: ['玩家管理', '查询玩家资料、资产、偏好设置和账号状态。'],
  adminUsers: ['权限与账号', '管理后台账号、角色范围与生产环境操作权限。'],
}

const actionConfig = {
  publish: { label: '新建发布任务', title: '创建发布任务', icon: 'play', fields: ['发布对象', '对象版本', '目标环境', '发布范围'] },
  versions: { label: '发起生产发布', title: '发起生产发布', icon: 'bolt', fields: ['选择版本', '发布范围', '灰度比例', '回滚版本'] },
  activities: { label: '创建活动', title: '创建活动配置草稿', icon: 'gift', fields: ['活动名称', '活动类型', '适用人群', '奖励预算'] },
  checkin: { label: '创建签到活动', title: '创建签到活动', icon: 'calendar', fields: ['活动名称', '签到周期', '每日奖励', '最终大奖'] },
  wheel: { label: '新建转盘', title: '创建幸运转盘', icon: 'refresh', fields: ['转盘名称', '免费次数', '奖项数量', '概率版本'] },
  missions: { label: '新建任务', title: '创建每日任务', icon: 'flag', fields: ['任务名称', '目标事件', '目标值', '奖励内容'] },
}

const statusLabel = { ready: '正常可玩', maintenance: '维护中', upcoming: '即将上线', unavailable: '暂不可用' }

const gameCatalog = games.map((g) => ({ id: g.id, name: g.name, category: g.categoryLabel, tags: g.tags, badges: g.badges, status: statusLabel[g.status] || g.status, players: g.players, heat: g.heat, popular: g.popular }))

const gameStatusSummary = games.reduce((acc, g) => { acc.total += 1; acc[g.status] = (acc[g.status] || 0) + 1; return acc }, { total: 0 })
const pct = (n) => Math.round((n / gameStatusSummary.total) * 1000) / 10

const missionEventLabel = { 'spin-100': '旋转次数', 'casual-5': '休闲游戏局数', 'free-spin': '触发 Free Spin', 'share-win': '分享中奖事件' }
const missionRows = dailyMissions.map((m) => [m.title, missionEventLabel[m.id] || m.id, String(m.total), m.expired ? '已过期' : '生效中', `+${m.coinReward.toLocaleString('en-US')} 金币 + ${m.gemReward} 宝石`, m.expired ? '历史' : '每日'])

const wheelPrizeSeed = [
  { label: '800 金币', probability: 22 },
  { label: '2 宝石', probability: 15 },
  { label: '1,200 金币', probability: 15 },
  { label: '1 次免费旋转', probability: 10 },
  { label: '300 金币', probability: 20 },
  { label: '5 宝石', probability: 6 },
  { label: '2,000 金币', probability: 8 },
  { label: '500 金币', probability: 4 },
]

const initialRows = {
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
    ['七日签到 · 秋日版等待发布审核', '活动中心', '中', '待审核', '28 分钟前', '审核组'],
    ['2 笔退款订单待财务确认', '商城与经济', '中', '处理中', '1 小时前', '财务组'],
  ],
  publish: [
    ['幸运旋转狂欢季 v3', '活动版本', '灰度 20%', '进行中', '运营一组', '10 分钟前'],
    ['Fish Hunter 封面更新', '游戏配置', '全量', '已发布', '产品组', '昨天 18:20'],
    ['七日签到 · 秋日版 v2', '活动版本', '生产环境', '待审核', '运营二组', '昨天 17:05'],
  ],
  audit: [
    ['#8f2c', '运营一组', '调整幸运转盘概率配置', '幸运旋转狂欢季 · 主转盘', '成功', '今天 14:36'],
    ['#8f2a', '运营一组', '修改转盘奖励库存', '幸运旋转狂欢季', '成功', '今天 14:32'],
    ['#8e90', '财务组', '提交退款审核', '订单 JL-2026-090099', '成功', '今天 13:05'],
    ['#8d71', '系统', 'Ocean 777 自动进入维护', '游戏状态', '成功', '今天 12:48'],
  ],
  checkin: [
    ['七日签到 · 秋日版', '7 天', '18,420', '进行中', '总预算 6,800,000', '运营二组'],
    ['新用户首周签到', '7 天', '6,820', '已结束', '总预算 1,200,000', '增长组'],
  ],
  wheel: [
    ['幸运旋转狂欢季 · 主转盘', '8 个奖项', '3 次 / 日', '进行中', '概率已校验', '版本 v3'],
    ['新手免费转盘', '6 个奖项', '1 次 / 账号', '草稿', '概率未配置', '产品组'],
  ],
  missions: missionRows,
  ledger: [
    ['#WL-90101', 'NovaPlayer', '+2 宝石', '任务奖励', '成功', '今天 14:50'],
    ['#WL-90100', 'NovaPlayer', '+2 宝石', '签到奖励', '成功', '今天 14:40'],
    ['#WL-90099', 'NovaPlayer', '+60 金币', '签到奖励', '成功', '今天 14:40'],
    ['#WL-90098', 'NovaPlayer', '-800 金币', '游戏消耗', '成功', '今天 14:30'],
    ['#WL-90097', 'NovaPlayer', '+3,600 金币', '游戏派奖', '成功', '今天 14:20'],
    ['#WL-90096', 'NovaPlayer', '-500 金币', '购买明日宝箱', '成功', '今天 14:15'],
    ['#WL-90095', 'NovaPlayer', '+2,400 金币', '明日宝箱开奖', '成功', '今天 14:16'],
    ['#WL-90080', 'MintCat', '-500 金币', '购买明日宝箱', '处理中', '昨天 20:10'],
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

const statusClass = (value) => {
  if (['进行中', '已完成', '正常', '生效中', '已发布', '启用', '成功', '已解决', '测试通过', '校验通过', '已展示', '已结算', '正常可玩', '已支付', '已领取'].includes(value)) return 'success'
  if (['维护中', '待审核', '退款处理中', '候补开放', '待复核', '草稿', '待处理', '处理中', '结算待开始', '灰度 20%', '测试中', '检查中', '待激活', '待支付', '即将上线', '今日可领', '活动限制'].includes(value)) return 'warning'
  if (['已下架', '已封禁', '支付失败', '异常', '已作废', '上传失败', '失败', '漏签', '暂不可用'].includes(value)) return 'danger'
  return 'neutral'
}

const statusValues = ['正常可玩', '维护中', '即将上线', '暂不可用', '进行中', '草稿', '待审核', '候补开放', '待处理', '处理中', '结算待开始', '生效中', '已发布', '启用', '成功', '已解决', '已结束', '已作废', '测试通过', '测试中', '校验通过', '检查中', '上传失败', '已展示', '已结算', '待激活', '待支付', '已支付', '失败', '退款处理中', '已退款', '异常', '已领取', '漏签', '今日可领', '正常', '活动限制', '待复核']

const configurationNotes = {
  wins: ['榜单按业务日累计中奖金币；最近中奖按时间倒序，同一事件只展示一次。所有我也要玩入口按 gameId 进入游戏说明。', '生产应读取经过公开展示授权和脱敏的服务端事件；暂停游戏、撤销事件或隐私变更须同时影响列表与弹幕。'],
  publish: ['发布审核采用版本快照，生产环境变更必须经过审核并保留可回滚版本。', '版本链路：草稿 → 自动检查 → 测试验证 → 待审核 → 灰度/全量 → 已发布。'],
  activities: ['活动配置保存为草稿；发布前校验活动周期、预算、资格范围与奖励库存。', '已发布版本不可直接覆盖，变更会生成新版本并写入操作日志。'],
  checkin: ['签到奖励按自然日发放；奖励配置变更仅对新版本生效，已领取记录不可重放。', '发布前请确认周期、时区、奖励预算和最终大奖均已审核；缺席补签规则明确为不支持。'],
  wheel: ['转盘概率总和必须为 100%；开奖结果由服务端记录，前端不直接决定奖励。', '概率、库存和次数变更均需新建版本并经审核后生效。'],
  missions: ['任务进度由服务端事件汇总；领取接口需使用幂等键，避免重复发放。', '任务结束后仅可查看记录，不能修改历史奖励或目标值。'],
  store: ['金币礼包与月度特权卡通过宿主支付桥接完成购买；明日宝箱按次直接从钱包扣款，不生成订单记录。', '明日宝箱报价版本变更会使旧客户端报价失效（409 stale）；开奖与发奖需关联唯一宝箱 ID、幂等键与钱包流水。'],
  orders: ['订单仅覆盖金币礼包与月度特权卡的宿主支付流程。', '状态链路：待支付 → 处理中 → 已支付/失败；已支付后可能进入退款处理中 → 已退款；异常订单需人工介入并写入操作日志。'],
  ledger: ['流水来源固定为 chest_purchase / chest_reward / game_reward / game_cost / checkin / task 六类，未识别来源前台展示为「未知」。', '每笔流水应有变动前后余额配对；历史记录缺失时展示「暂无数据」，不得由前端推算填充。'],
  players: ['玩家资产、等级与最近战绩以宿主/服务端上下文为准；隐私偏好（中奖弹幕、分享中奖、好友可见最近游戏）默认全部开启。', '账号状态变更（活动限制、封禁、待复核）需写入操作日志并保留操作人与原因。'],
}

function Status({ children }) {
  return <span className={`admin-status ${statusClass(children)}`}><i />{children}</span>
}

function MetricCard({ label, value, trend, icon, tone = '' }) {
  return <article className={`admin-metric ${tone}`}><span className="metric-icon"><Icon name={icon} /></span><div><small>{label}</small><strong>{value}</strong><em>{trend}</em></div></article>
}

function Dashboard({ onNavigate }) {
  return <>
    <div className="admin-metrics">
      <MetricCard label="今日活跃用户" value="28,460" trend="↑ 12.8% 较昨日" icon="users" tone="blue" />
      <MetricCard label="当前在线人数" value="4,812" trend="实时 · 过去 5 分钟" icon="gauge" tone="violet" />
      <MetricCard label="正常可玩游戏" value={`${gameStatusSummary.ready || 0} / ${gameStatusSummary.total}`} trend={`${gameStatusSummary.maintenance || 0} 款维护 · ${gameStatusSummary.upcoming || 0} 款即将上线 · ${gameStatusSummary.unavailable || 0} 款暂不可用`} icon="gamepad" tone="green" />
      <MetricCard label="待处理事项" value={String(initialRows.todo.length)} trend={`${initialRows.todo.filter((row) => row[2] === '高').length} 项高优先级`} icon="bell" tone="orange" />
    </div>
    <div className="admin-dashboard-grid">
      <section className="admin-card status-overview"><div className="card-heading"><div><h2>平台运行概况</h2><p>当前数据权限范围内的实时状态</p></div><button className="admin-link" onClick={() => onNavigate('games')}>查看游戏管理 <Icon name="chevronRight" /></button></div><div className="distribution">
        <div><span>正常可玩</span><strong>{gameStatusSummary.ready || 0} 款 <small>{pct(gameStatusSummary.ready || 0)}%</small></strong><b><i style={{ width: `${pct(gameStatusSummary.ready || 0)}%` }} /></b></div>
        <div><span>维护中</span><strong>{gameStatusSummary.maintenance || 0} 款 <small>{pct(gameStatusSummary.maintenance || 0)}%</small></strong><b className="orange"><i style={{ width: `${pct(gameStatusSummary.maintenance || 0)}%` }} /></b></div>
        <div><span>即将上线</span><strong>{gameStatusSummary.upcoming || 0} 款 <small>{pct(gameStatusSummary.upcoming || 0)}%</small></strong><b className="gray"><i style={{ width: `${pct(gameStatusSummary.upcoming || 0)}%` }} /></b></div>
        <div><span>暂不可用</span><strong>{gameStatusSummary.unavailable || 0} 款 <small>{pct(gameStatusSummary.unavailable || 0)}%</small></strong><b className="gray"><i style={{ width: `${pct(gameStatusSummary.unavailable || 0)}%` }} /></b></div>
      </div></section>
      <section className="admin-card quick-stats"><div className="card-heading"><div><h2>今日业务摘要</h2><p>截至 2026-09-01 15:00 · 数据约延迟 5 分钟</p></div><Icon name="clock" /></div><div className="summary-grid"><div><span>签到完成人数</span><strong>18,420</strong><small>完成率 64.8%</small></div><div><span>转盘参与次数</span><strong>32,610</strong><small>免费次数用完率 71.2%</small></div><div><span>任务达成次数</span><strong>9,680</strong><small>达成率 58.4%</small></div><div><span>商城成交金额</span><strong>$12,480</strong><small>支付成功率 98.2%</small></div></div></section>
    </div>
    <div className="admin-dashboard-grid lower">
      <section className="admin-card"><div className="card-heading"><div><h2>待处理事项</h2><p>需要运营或审核跟进的事项</p></div><button className="admin-link" onClick={() => onNavigate('todo')}>全部事项 <Icon name="chevronRight" /></button></div><div className="todo-list"><button onClick={() => onNavigate('games')}><span className="todo-dot danger" /><span><strong>Ocean 777 维护超过 2 小时</strong><small>游戏运营 · 12 分钟前</small></span><Icon name="chevronRight" /></button><button onClick={() => onNavigate('activities')}><span className="todo-dot warning" /><span><strong>七日签到秋日版等待发布审核</strong><small>活动中心 · 28 分钟前</small></span><Icon name="chevronRight" /></button><button onClick={() => onNavigate('orders')}><span className="todo-dot blue" /><span><strong>2 笔退款订单待财务确认</strong><small>订单管理 · 1 小时前</small></span><Icon name="chevronRight" /></button></div></section>
      <section className="admin-card release-card"><div className="card-heading"><div><h2>最近发布</h2><p>配置版本和发布状态</p></div><button className="admin-link" onClick={() => onNavigate('publish')}>发布中心 <Icon name="chevronRight" /></button></div><div className="release-row"><span className="release-icon"><Icon name="gift" /></span><span><strong>幸运旋转狂欢季 v3</strong><small>灰度 20% · 运营一组 · 10 分钟前</small></span><Status>进行中</Status></div><div className="release-row"><span className="release-icon"><Icon name="gamepad" /></span><span><strong>Fish Hunter 封面更新</strong><small>全量发布 · 产品组 · 昨天 18:20</small></span><Status>已发布</Status></div></section>
    </div>
  </>
}

function GameCatalogPage({ onOpen, environment }) {
  const [items, setItems] = useState(gameCatalog)
  const [dragging, setDragging] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [view, setView] = useState('table')
  const moveItem = (targetId) => {
    if (!dragging || dragging === targetId) return
    setItems((current) => {
      const from = current.findIndex((item) => item.id === dragging)
      const to = current.findIndex((item) => item.id === targetId)
      if (from < 0 || to < 0) return current
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setDirty(true)
  }
  const togglePopular = (id) => { setItems((current) => current.map((item) => (item.id === id ? { ...item, popular: !item.popular } : item))); setDirty(true) }
  const openDetail = (game) => {
    const extra = liteContent.gameDetails[game.id] || {}
    const isSlots = (game.tags || []).includes('slots')
    const drawerLabels = ['游戏名称', '游戏 ID', '分类', '角标', '状态', '在线人数', '热门推荐', ...(isSlots ? ['胜率', 'RTP', '中奖区间', '最高倍数'] : [])]
    const drawerRow = [game.name, game.id, game.category, (game.badges || []).join(' / ') || '—', game.status, game.players, game.popular ? '是' : '否', ...(isSlots ? [extra.winRate || '—', extra.rtp || '—', extra.winRange || '—', extra.maxMultiplier || '—'] : [])]
    onOpen(drawerRow, drawerLabels)
  }
  return <>
    <section className="admin-card catalog-summary"><div><span>当前环境</span><strong>{environment === 'production' ? '生产环境' : '测试环境'}</strong><small>排序草稿只影响当前环境</small></div><div><span>目录游戏</span><strong>{items.length} 款</strong><small>正常可玩 {items.filter((item) => item.status === '正常可玩').length} 款</small></div><div><span>排序状态</span><strong>{dirty ? '未保存' : '已同步'}</strong><small>{dirty ? '保存后生成排序版本' : '最近同步 5 分钟前'}</small></div></section>
    <div className="drag-hint">分类筛选（前台一致）：{gameCategories.filter((c) => c.id !== 'all').map((c) => `${c.label} ${games.filter((g) => g.tags.includes(c.id)).length} 款`).join(' · ')}</div>
    <div className="catalog-toolbar"><div className="view-toggle"><button className={view === 'table' ? 'is-active' : ''} onClick={() => setView('table')}>表格视图</button><button className={view === 'cards' ? 'is-active' : ''} onClick={() => setView('cards')}>卡片视图</button></div><span className="drag-hint"><Icon name="flag" />拖拽行或卡片调整排序，点击开关切换大厅热门推荐</span>{dirty && <button className="admin-btn primary" onClick={() => setDirty(false)}>保存排序草稿</button>}</div>
    {view === 'table' ? <section className="admin-card table-card"><div className="table-top"><div><strong>游戏目录</strong><span>按 {environment === 'production' ? '生产' : '测试'} 环境排序</span></div><button className="admin-btn subtle">导入目录</button></div><div className="table-wrap"><table><thead><tr><th>排序</th><th>游戏名称</th><th>游戏 ID</th><th>分类</th><th>状态</th><th>在线人数</th><th>热度</th><th>大厅热门推荐</th><th>操作</th></tr></thead><tbody>{items.map((game, index) => <tr key={game.id} draggable onDragStart={() => setDragging(game.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(game.id)} onDragEnd={() => setDragging(null)} className={dragging === game.id ? 'is-dragging' : ''}><td><span className="drag-handle" aria-label="拖拽排序">⋮⋮</span><b className="sort-number">{index + 1}</b></td><td><span className="game-name-cell"><span className={`game-thumb thumb-${index % 4}`} /><strong>{game.name}</strong></span></td><td>{game.id}</td><td>{game.category}</td><td><Status>{game.status}</Status></td><td>{game.players}</td><td><span className="heat-bar"><i style={{ width: `${game.heat}%` }} /></span><small>{game.heat || '—'}</small></td><td><button className={`toggle-switch ${game.popular ? 'is-on' : ''}`} onClick={(event) => { event.stopPropagation(); togglePopular(game.id) }} aria-pressed={game.popular} aria-label="大厅热门推荐"><i /></button></td><td><button className="row-action" onClick={() => openDetail(game)}>查看详情</button></td></tr>)}</tbody></table></div></section> : <section className="catalog-cards">{items.map((game, index) => <article draggable key={game.id} onDragStart={() => setDragging(game.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(game.id)} onDragEnd={() => setDragging(null)} className={`game-admin-card ${dragging === game.id ? 'is-dragging' : ''}`}><span className={`game-cover cover-${index % 4}`}><b>{index + 1}</b><i>⋮⋮</i></span><div><div className="game-card-top"><Status>{game.status}</Status><small>热度 {game.heat || '—'}</small></div><h3>{game.name}</h3><p>{game.category}</p><span>{game.players} 在线 · {game.popular ? '已推荐' : '未推荐'}</span></div><button className="row-action" onClick={() => openDetail(game)}>详情</button></article>)}</section>}
  </>
}

function VersionWorkflowPage({ page, onOpen }) {
  const [rows, setRows] = useState(initialRows[page] || [])
  const [showUpload, setShowUpload] = useState(false)
  const [fileName, setFileName] = useState('')
  const isUpload = page === 'uploads'
  const labels = isUpload ? ['记录 ID', '版本包', '文件信息', '校验状态', '上传人', '时间'] : page === 'versions' ? ['游戏名称', '版本号', '当前生产', '版本状态', '发布范围', '更新时间'] : ['版本', '构建号/范围', '环境', '状态', '质量指标', '更新时间']
  const action = isUpload ? { label: '上传新版本', title: '上传游戏版本', icon: 'bolt', fields: ['选择游戏', '版本号', '构建号', '上传版本包'] } : page === 'versions' ? actionConfig.versions : page === 'test' ? { label: '发布到测试环境', title: '发布到测试环境', icon: 'shield', fields: ['选择版本', '测试地址', '测试账号', '测试说明'] } : { label: '发起生产发布', title: '发起生产发布', fields: ['选择版本', '发布范围', '灰度比例', '回滚版本'] }
  const openUpload = () => { setFileName(''); setShowUpload(true) }
  const save = () => { setRows((current) => [...current, isUpload ? [`UP-NEW-${current.length + 1}`, '待上传的游戏版本', fileName || 'ZIP · 待选择', '检查中', '当前操作员', '刚刚'] : ['待发布新版本', 'build-demo', page === 'test' ? '测试环境' : '生产环境', '待审核', '待测试验证', '刚刚']]); setShowUpload(false) }
  const scopeIsEnv = page === 'test' || page === 'production'
  const scopeLabel = page === 'test' ? '测试环境' : page === 'production' ? '生产环境' : '全部环境'
  const scopeNote = page === 'test' ? '测试环境允许反复部署，不产生真实订单和资产变化。' : page === 'production' ? '生产操作需要发布权限和审批，发布前必须存在可回滚版本。' : '版本记录与上传记录跨环境展示，具体发布范围以每条记录的发布范围字段为准，与页面右上角的环境切换无关。'
  return <>
    <div className="workflow-strip"><div className="workflow-step done"><b>1</b><span>上传版本</span></div><i /><div className="workflow-step active"><b>2</b><span>自动检查</span></div><i /><div className="workflow-step"><b>3</b><span>测试环境</span></div><i /><div className="workflow-step"><b>4</b><span>审核发布</span></div><i /><div className="workflow-step"><b>5</b><span>生产环境</span></div></div>
    <div className="environment-note"><Icon name="shield" /><span><strong>当前查看：{scopeLabel}</strong><small>{scopeNote}</small></span></div>
    <div className="admin-toolbar"><div className="admin-search"><Icon name="eye" /><input placeholder={`搜索${pageMeta[page][0]}...`} /></div><button className="admin-btn primary" onClick={openUpload}><Icon name={action.icon || 'play'} />{action.label}</button></div>
    <section className="admin-card table-card"><div className="table-top"><div><strong>{pageMeta[page][0]}列表</strong><span>{scopeIsEnv ? `当前环境：${scopeLabel}` : '跨环境记录'}</span></div><button className="admin-btn subtle">导出记录</button></div><div className="table-wrap"><table><thead><tr>{labels.map((label) => <th key={label}>{label}</th>)}<th>操作</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`} onClick={() => onOpen(row, labels)}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{statusValues.includes(cell) ? <Status>{cell}</Status> : <span>{cell}</span>}</td>)}<td><button className="row-action" onClick={(event) => { event.stopPropagation(); onOpen(row, labels) }}>查看详情</button></td></tr>)}</tbody></table></div></section>
    {showUpload && <div className="admin-overlay" onMouseDown={(event) => event.target === event.currentTarget && setShowUpload(false)}><div className="admin-modal"><div className="modal-head"><div><span className="eyebrow">版本发布流程</span><h2>{action.title}</h2></div><button className="icon-button" onClick={() => setShowUpload(false)}><Icon name="close" /></button></div><div className="form-grid"><label>{action.fields[0]}<input placeholder={`请选择${action.fields[0]}`} /></label><label>{action.fields[1]}<input placeholder={`请输入${action.fields[1]}`} /></label><label>{action.fields[2]}<input placeholder={`请输入${action.fields[2]}`} /></label><label>{action.fields[3]}<input type={isUpload ? 'file' : 'text'} onChange={(event) => isUpload && setFileName(event.target.files?.[0]?.name || '')} /></label><label className="full upload-check"><span>上传前自动检查</span><small>文件完整性 · 入口文件 · 资源类型 · 版本号 · 路径安全</small>{fileName && <em>{fileName}</em>}</label><label className="full">发布说明<textarea placeholder="填写版本变化、影响范围、测试说明和回滚计划" /></label></div><div className="modal-foot"><button className="admin-btn subtle" onClick={() => setShowUpload(false)}>取消</button><button className="admin-btn primary" onClick={save}>{isUpload ? '开始上传并检查' : '保存发布任务'}</button></div></div></div>}
  </>
}

function GameVersionCenterPage({ onOpen }) {
  const [tab, setTab] = useState('versions')
  const tabs = [['versions', '版本记录'], ['uploads', '上传记录'], ['test', '测试环境'], ['production', '生产环境']]
  return <>
    <div className="catalog-toolbar"><div className="view-toggle">{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div></div>
    <VersionWorkflowPage key={tab} page={tab} onOpen={onOpen} />
  </>
}

function ReleaseCenterPage({ onOpen }) {
  return <>
    <div className="release-metrics"><div><span>待审核</span><strong>3</strong><small>2 个游戏版本 · 1 个活动</small></div><div><span>测试中</span><strong>2</strong><small>需要 QA 验证</small></div><div><span>灰度发布</span><strong>1</strong><small>当前覆盖 20%</small></div><div><span>生产发布</span><strong>8</strong><small>过去 30 天</small></div></div>
    <section className="admin-card release-guide"><div className="card-heading"><div><h2>发布任务流程</h2><p>发布中心只管理发布任务，不创建"发布中心"本身。</p></div><span className="release-safety"><Icon name="shield" />生产发布需审批</span></div><div className="release-guide-steps"><div className="is-done"><b>1</b><span>创建任务</span><small>选择对象和版本</small></div><i /><div className="is-done"><b>2</b><span>自动检查</span><small>资源与版本校验</small></div><i /><div className="is-active"><b>3</b><span>测试验证</span><small>QA 标记结果</small></div><i /><div><b>4</b><span>审核发布</span><small>灰度或生产</small></div></div></section>
    <GenericPage page="publish" onOpen={onOpen} />
    <section className="admin-card release-history"><div className="card-heading"><div><h2>版本健康度</h2><p>发布后的实时质量观察</p></div><button className="admin-link">查看监控 <Icon name="chevronRight" /></button></div><div className="health-grid"><div><span>启动成功率</span><strong>99.6%</strong><em>↑ 0.8%</em></div><div><span>资源加载失败</span><strong>0.12%</strong><em>↓ 0.04%</em></div><div><span>异常回滚</span><strong>0</strong><em>过去 7 天</em></div></div></section>
  </>
}

function AdminUsersPage({ onOpen }) {
  const permissions = [['活动运营', '活动 / 内容', '创建、编辑、测试发布', '生产只读'], ['游戏运营', '游戏 / 版本', '上传、排序、测试发布', '生产需审批'], ['财务人员', '商城 / 订单 / 流水', '查询、退款、对账', '生产可操作'], ['审核人员', '审批中心', '审核、驳回、查看差异', '不可直接发布']]
  return <><section className="admin-card permission-summary"><div><span>后台账号</span><strong>{initialRows.adminUsers.length}</strong><small>启用 {initialRows.adminUsers.filter((row) => row[3] === '启用').length} · 待激活 {initialRows.adminUsers.filter((row) => row[3] === '待激活').length}</small></div><div><span>角色数量</span><strong>{permissions.length}</strong><small>全部为自定义角色</small></div><div><span>MFA 覆盖率</span><strong>94%</strong><small>1 个账号需处理</small></div><div><span>生产权限</span><strong>2</strong><small>均已配置审批</small></div></section><section className="admin-card permission-matrix"><div className="card-heading"><div><h2>角色权限摘要</h2><p>菜单权限、操作权限和环境权限分开控制。</p></div><button className="admin-link" onClick={() => onOpen(permissions[0], ['角色', '菜单范围', '可执行操作', '生产权限'])}>查看权限详情 <Icon name="chevronRight" /></button></div><div className="permission-table"><div className="permission-row permission-head"><span>角色</span><span>菜单范围</span><span>操作权限</span><span>生产权限</span></div>{permissions.map((row) => <button className="permission-row" key={row[0]} onClick={() => onOpen(row, ['角色', '菜单范围', '可执行操作', '生产权限'])}>{row.map((value) => <span key={value}>{value}</span>)}</button>)}</div></section><GenericPage page="adminUsers" onOpen={onOpen} /></>
}

function gameName(id) { return games.find((g) => g.id === id)?.name || id }

function WinsPage() {
  const [tab, setTab] = useState('rank')
  const [rankLimit, setRankLimit] = useState(10)
  const [chestLimit, setChestLimit] = useState(5)
  const rankings = useMemo(() => aggregateWinnerRankings(engagementPreview.wins), [])
  const events = engagementPreview.wins
  const chestRanking = engagementPreview.chestOpenings
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>{configurationNotes.wins[0]}</strong><span>{configurationNotes.wins[1]}</span></div></div>
    <div className="catalog-toolbar"><div className="view-toggle"><button className={tab === 'rank' ? 'is-active' : ''} onClick={() => setTab('rank')}>大厅赢家榜与最近中奖</button><button className={tab === 'chest' ? 'is-active' : ''} onClick={() => setTab('chest')}>明日宝箱幸运榜单</button></div></div>
    {tab === 'rank' ? <>
      <section className="admin-card table-card"><div className="table-top"><div><strong>今日赢家榜</strong><span>按累计中奖金币排序，代表游戏取最近一次事件</span></div><label className="environment-select"><span>展示上限</span><input type="number" min="1" max="10" value={rankLimit} onChange={(event) => setRankLimit(Math.min(10, Math.max(1, Number(event.target.value) || 1)))} style={{ width: 44, border: 0 }} /></label></div><div className="table-wrap"><table><thead><tr><th>排名</th><th>玩家昵称</th><th>代表游戏</th><th>累计中奖金币</th><th>展示状态</th></tr></thead><tbody>{rankings.slice(0, rankLimit).map((r, i) => <tr key={r.playerId}><td>{i + 1}</td><td>{r.name}</td><td>{gameName(r.gameId)}</td><td>{r.coins.toLocaleString('en-US')}</td><td><Status>已展示</Status></td></tr>)}</tbody></table></div></section>
      <section className="admin-card table-card"><div className="table-top"><div><strong>最近中奖</strong><span>按事件时间倒序，事件 ID 唯一去重</span></div></div><div className="table-wrap"><table><thead><tr><th>事件 ID</th><th>玩家昵称</th><th>游戏</th><th>中奖金币</th><th>展示状态</th></tr></thead><tbody>{events.map((e) => <tr key={e.id}><td>{e.id}</td><td>{e.name}</td><td>{gameName(e.gameId)}</td><td>{e.coins.toLocaleString('en-US')}</td><td><Status>已展示</Status></td></tr>)}</tbody></table></div></section>
    </> : <section className="admin-card table-card"><div className="table-top"><div><strong>明日宝箱幸运榜单</strong><span>今日已确认正金币开箱事件，最多 5 条，同额按开启时间早优先</span></div><label className="environment-select"><span>展示上限</span><input type="number" min="1" max="5" value={chestLimit} onChange={(event) => setChestLimit(Math.min(5, Math.max(1, Number(event.target.value) || 1)))} style={{ width: 44, border: 0 }} /></label></div><div className="table-wrap"><table><thead><tr><th>排名</th><th>玩家昵称</th><th>中奖金币</th><th>展示状态</th></tr></thead><tbody>{chestRanking.slice(0, chestLimit).map((c, i) => <tr key={c.id}><td>{i + 1}</td><td>{c.name}</td><td>{c.rewardCoins.toLocaleString('en-US')}</td><td><Status>已展示</Status></td></tr>)}</tbody></table></div></section>}
  </>
}

function CheckinPage({ onOpen }) {
  const [days, setDays] = useState(checkinDays.map((d) => ({ ...d })))
  const [dirty, setDirty] = useState(false)
  const stateLabel = { claimed: '已领取', missed: '漏签', today: '今日可领', locked: '未解锁' }
  const stateStepClass = { claimed: 'done', today: 'active', missed: 'missed', locked: '' }
  const updateReward = (index, value) => { setDays((current) => current.map((d, i) => (i === index ? { ...d, reward: value } : d))); setDirty(true) }
  const stepEls = []
  days.forEach((d, i) => {
    if (i > 0) stepEls.push(<i key={`line-${i}`} />)
    stepEls.push(<div key={d.day} className={`workflow-step ${stateStepClass[d.state]}`}><b>{i + 1}</b><span>{d.day.split(' ')[0]}{d.grand ? ' · 大奖' : ''}</span></div>)
  })
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes.checkin[0]}</span><small>{configurationNotes.checkin[1]}</small></div></div>
    <section className="admin-card"><div className="card-heading"><div><h2>本期签到奖励梯度</h2><p>七日签到 · 秋日版 · 当前生效版本</p></div>{dirty && <button className="admin-btn primary" onClick={() => setDirty(false)}>保存奖励草稿</button>}</div>
      <div className="workflow-strip">{stepEls}</div>
      <div className="table-wrap"><table><thead><tr><th>天数</th><th>奖励文案</th><th>状态</th></tr></thead><tbody>{days.map((d, i) => <tr key={d.day}><td>{d.day}</td><td><input className="ladder-input" value={d.reward} onChange={(event) => updateReward(i, event.target.value)} /></td><td><Status>{stateLabel[d.state]}</Status></td></tr>)}</tbody></table></div>
    </section>
    <GenericPage page="checkin" onOpen={onOpen} />
  </>
}

function WheelPage({ onOpen }) {
  const [prizes, setPrizes] = useState(wheelPrizeSeed)
  const [freeSpins, setFreeSpins] = useState(liteContent.events.wheelFreeSpins)
  const [version, setVersion] = useState('v3')
  const total = prizes.reduce((sum, p) => sum + (Number(p.probability) || 0), 0)
  const updateProb = (index, value) => setPrizes((current) => current.map((p, i) => (i === index ? { ...p, probability: value } : p)))
  const balanced = Math.round(total * 10) / 10 === 100
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes.wheel[0]}</span><small>{configurationNotes.wheel[1]}</small></div></div>
    <section className="admin-card"><div className="card-heading"><div><h2>幸运旋转狂欢季 · 主转盘</h2><p>8 个奖项 · 每日 {freeSpins} 次免费 · 版本 {version}</p></div></div>
      <div className={`admin-config-note ${balanced ? '' : 'danger'}`}><Icon name={balanced ? 'shield' : 'bolt'} /><div><strong>概率总和：{total}%</strong><span>{balanced ? '已通过校验，可提交发布。' : '概率总和必须为 100% 才能发布，请调整奖项概率。'}</span></div></div>
      <div className="prize-list">{prizes.map((p, i) => <div className="prize-row" key={p.label}><span>{p.label}</span><input type="number" min="0" max="100" value={p.probability} onChange={(event) => updateProb(i, event.target.value)} /><span className="pct">概率 %</span></div>)}</div>
    </section>
    <section className="admin-card"><div className="card-heading"><div><h2>转盘参数</h2><p>免费次数与版本号，变更后需生成新版本并审核发布。</p></div></div><div className="form-grid"><label>每日免费次数<input type="number" min="0" value={freeSpins} onChange={(event) => setFreeSpins(Number(event.target.value) || 0)} /></label><label>转盘版本号<input value={version} onChange={(event) => setVersion(event.target.value)} /></label></div></section>
    <GenericPage page="wheel" onOpen={onOpen} />
  </>
}

function ProductsPage({ onOpen }) {
  const packLabels = ['商品名称', 'SKU', '折扣', '赠送宝石', '标签', '状态']
  const [showChestForm, setShowChestForm] = useState(false)
  const [chestVersion, setChestVersion] = useState(engagementPreview.offer.version)
  const [chestPrice, setChestPrice] = useState(engagementPreview.offer.priceCoins)
  const [chestMax, setChestMax] = useState(engagementPreview.offer.maxRewardCoins)
  const [draftVersion, setDraftVersion] = useState(chestVersion)
  const [draftPrice, setDraftPrice] = useState(chestPrice)
  const [draftMax, setDraftMax] = useState(chestMax)
  const pass = liteContent.products.monthlyPass
  const openChestForm = () => { setDraftVersion(chestVersion); setDraftPrice(chestPrice); setDraftMax(chestMax); setShowChestForm(true) }
  const saveChestForm = () => { setChestVersion(draftVersion); setChestPrice(draftPrice); setChestMax(draftMax); setShowChestForm(false) }
  const openPack = (p) => onOpen([`${p.coins.toLocaleString('en-US')} 金币礼包`, p.id, `${p.discountPercent}%`, `${p.gemBonus} 宝石`, p.tag, '生效中'], packLabels)
  return <>
    <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes.store[0]}</span><small>{configurationNotes.store[1]}</small></div></div>
    <section className="admin-card table-card"><div className="table-top"><div><strong>金币礼包</strong><span>共 {coinPacks.length} 档 · 1 USD = 10,000 金币</span></div></div><div className="table-wrap"><table><thead><tr>{packLabels.map((l) => <th key={l}>{l}</th>)}<th>操作</th></tr></thead><tbody>{coinPacks.map((p) => <tr key={p.id} onClick={() => openPack(p)}><td>{p.coins.toLocaleString('en-US')} 金币礼包{p.recommended ? ' ★' : ''}</td><td>{p.id}</td><td>{p.discountPercent}%</td><td>{p.gemBonus} 宝石</td><td>{p.tag}</td><td><Status>生效中</Status></td><td><button className="row-action" onClick={(event) => { event.stopPropagation(); openPack(p) }}>查看详情</button></td></tr>)}</tbody></table></div></section>
    <section className="admin-card"><div className="card-heading"><div><h2>月度特权卡</h2><p>{pass.title} · SKU monthly-pass</p></div><button className="admin-link" onClick={() => onOpen(['月度特权卡', 'monthly-pass', `$${(pass.priceUsdCents / 100).toFixed(2)}`, `${pass.dailyCoins} 金币/日`, `${pass.dailyGems} 宝石/日`, `${pass.validDays} 天`], ['商品名称', 'SKU', '价格', '每日金币', '每日宝石', '有效天数'])}>查看详情 <Icon name="chevronRight" /></button></div><div className="summary-grid"><div><span>价格</span><strong>${(pass.priceUsdCents / 100).toFixed(2)}</strong><small>不自动续费</small></div><div><span>每日金币</span><strong>{pass.dailyCoins.toLocaleString('en-US')}</strong><small>需每日主动领取</small></div><div><span>每日宝石</span><strong>{pass.dailyGems}</strong><small>当日未领取不补发</small></div><div><span>有效天数</span><strong>{pass.validDays} 天</strong><small>状态：生效中</small></div></div></section>
    <section className="admin-card"><div className="card-heading"><div><h2>明日宝箱 · 报价配置</h2><p>{liteContent.products.tomorrowChest.productId}</p></div><button className="admin-btn primary" onClick={openChestForm}><Icon name="gear" />调整报价</button></div><div className="summary-grid"><div><span>报价版本</span><strong>{chestVersion}</strong><small>版本号变更会使旧客户端报价失效（409）</small></div><div><span>购买价格</span><strong>{chestPrice} 金币</strong><small>每业务日限购 1 个</small></div><div><span>可能奖励上限</span><strong>{chestMax} 金币</strong><small>0 金币为合法开奖结果</small></div><div><span>解锁 / 截止</span><strong>次日 00:00</strong><small>Asia/Shanghai · 解锁后 24 小时截止</small></div></div><div className="environment-note"><Icon name="shield" /><span><strong>幂等键规则</strong><small>购买键为 chest-purchase-业务日；开启键为 chest-open-宝箱ID。开奖、钱包流水与状态变更需原子提交。</small></span></div></section>
    {showChestForm && <div className="admin-overlay" onMouseDown={(event) => event.target === event.currentTarget && setShowChestForm(false)}><div className="admin-modal"><div className="modal-head"><div><span className="eyebrow">商品配置草稿</span><h2>调整明日宝箱报价</h2></div><button className="icon-button" onClick={() => setShowChestForm(false)}><Icon name="close" /></button></div><div className="form-grid"><label>报价版本号<input value={draftVersion} onChange={(event) => setDraftVersion(event.target.value)} /></label><label>购买价格（金币）<input type="number" value={draftPrice} onChange={(event) => setDraftPrice(Number(event.target.value) || 0)} /></label><label>可能奖励上限（金币）<input type="number" value={draftMax} onChange={(event) => setDraftMax(Number(event.target.value) || 0)} /></label><label className="full">变更说明<textarea placeholder="填写调整原因、生效时间与回滚计划" /></label></div><div className="modal-foot"><button className="admin-btn subtle" onClick={() => setShowChestForm(false)}>取消</button><button className="admin-btn primary" onClick={saveChestForm}>保存并生成新版本</button></div></div></div>}
  </>
}

function GenericPage({ page, onOpen }) {
  const rows = initialRows[page]
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('全部状态')
  const [showForm, setShowForm] = useState(false)
  const meta = pageMeta[page]
  const action = actionConfig[page]
  const filteredRows = useMemo(() => (rows || []).filter((row) => `${row.join(' ')}`.toLowerCase().includes(query.toLowerCase()) && (filter === '全部状态' || row.includes(filter))), [rows, query, filter])
  const labels = {
    games: ['游戏名称', '游戏 ID', '分类', '状态', '在线人数', '地区'],
    activities: ['活动名称', '类型', '活动周期', '状态', '参与人数', '负责人'],
    orders: ['订单号', '玩家', '商品', '金额', '状态', '时间'],
    players: ['昵称', '玩家 ID', '等级', '金币余额', '宝石余额', '账号状态', '最近活跃'],
    todo: ['事项', '来源模块', '优先级', '状态', '更新时间', '负责人'],
    publish: ['版本名称', '对象类型', '发布范围', '状态', '负责人', '更新时间'],
    audit: ['日志 ID', '操作人', '操作类型', '对象', '结果', '时间'],
    checkin: ['活动名称', '周期', '参与人数', '状态', '奖励预算', '负责人'],
    wheel: ['转盘名称', '奖项数量', '免费次数', '状态', '概率校验', '版本'],
    missions: ['任务名称', '目标事件', '目标值', '状态', '奖励', '刷新周期'],
    ledger: ['流水 ID', '玩家', '变动金额', '来源', '状态', '时间'],
    adminUsers: ['姓名', '账号', '角色', '状态', '权限范围', '最近登录'],
  }[page] || ['名称', '标识', '类型', '状态', '数据', '更新时间']
  const statusOptions = [...new Set((rows || []).flatMap((row) => row.filter((cell) => statusValues.includes(cell))))]
  return <>
    {configurationNotes[page] && <div className="admin-config-note"><Icon name="shield" /><div><strong>生产配置提示</strong><span>{configurationNotes[page][0]}</span><small>{configurationNotes[page][1]}</small></div></div>}
    <div className="admin-toolbar"><div className="admin-search"><Icon name="eye" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`搜索${meta[0]}...`} /></div><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>全部状态</option>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select>{action && <button className="admin-btn primary" onClick={() => setShowForm(true)}><Icon name={action.icon} />{action.label}</button>}</div>
    <section className="admin-card table-card"><div className="table-top"><div><strong>{meta[0]}列表</strong><span>共 {filteredRows.length} 条</span></div><div className="table-actions"><button className="admin-btn subtle"><Icon name="filter" />筛选</button><button className="admin-btn subtle">导出</button></div></div><div className="table-wrap"><table><thead><tr>{labels.map((label) => <th key={label}>{label}</th>)}<th>操作</th></tr></thead><tbody>{filteredRows.map((row, index) => <tr key={`${row[0]}-${index}`} onClick={() => onOpen(row, labels)}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{statusValues.includes(cell) ? <Status>{cell}</Status> : <span>{cell}</span>}</td>)}<td><button className="row-action" onClick={(event) => { event.stopPropagation(); onOpen(row, labels) }}>查看详情</button></td></tr>)}</tbody></table>{!filteredRows.length && <div className="empty-state"><Icon name="eye" /><strong>没有匹配数据</strong><p>请调整搜索关键词或筛选条件。</p></div>}</div><div className="table-footer"><span>每页 20 条</span><span>第 1 / 1 页</span></div></section>
    {showForm && action && <div className="admin-overlay" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><div className="admin-modal"><div className="modal-head"><div><span className="eyebrow">配置草稿</span><h2>{action.title}</h2></div><button className="icon-button" onClick={() => setShowForm(false)}><Icon name="close" /></button></div><div className="form-grid"><label>{action.fields[0]}<input placeholder={`请输入${action.fields[0]}`} /></label><label>{action.fields[1]}<select><option>请选择{action.fields[1]}</option><option>运营活动</option><option>内容配置</option><option>系统配置</option></select></label><label>{action.fields[2]}<input placeholder={`请输入${action.fields[2]}`} /></label><label>{action.fields[3]}<input placeholder={`请输入${action.fields[3]}`} /></label><label className="full">备注<textarea placeholder="填写配置说明、目标人群和发布备注" /></label></div><div className="modal-foot"><button className="admin-btn subtle" onClick={() => setShowForm(false)}>取消</button><button className="admin-btn primary" onClick={() => setShowForm(false)}>保存草稿</button></div></div></div>}
  </>
}

function DetailDrawer({ row, labels, onClose }) {
  if (!row) return null
  return <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="admin-drawer"><div className="drawer-head"><div><span className="eyebrow">详情与操作</span><h2>{row[0]}</h2></div><button className="icon-button" onClick={onClose}><Icon name="close" /></button></div><div className="drawer-body">{row.map((value, index) => <div className="drawer-field" key={`${labels[index]}-${value}`}><span>{labels[index]}</span><strong>{value}</strong></div>)}<div className="drawer-section"><h3>状态流转</h3><div className="state-line"><span className="state-node done">草稿</span><i /><span className="state-node active">审核中</span><i /><span className="state-node">已发布</span></div></div><div className="drawer-section"><h3>最近操作</h3><p className="audit-item"><Icon name="clock" /><span>运营一组提交了配置变更<small>今天 14:32 · request #8f2a</small></span></p><p className="audit-item"><Icon name="user" /><span>产品组创建了初始草稿<small>昨天 18:20 · request #7e91</small></span></p></div></div><div className="drawer-foot"><button className="admin-btn subtle">查看审计</button><button className="admin-btn warning">提交审核</button><button className="admin-btn primary" onClick={onClose}>完成</button></div></aside></div>
}

function AdminApp() {
  const [activePage, setActivePage] = useState('dashboard')
  const [openRow, setOpenRow] = useState(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [environment, setEnvironment] = useState('test')
  const meta = pageMeta[activePage]
  const navigate = (page) => { setActivePage(page); setMobileNav(false); window.scrollTo({ top: 0, behavior: 'instant' }) }
  const renderContent = () => {
    const onOpen = (row, labels) => setOpenRow({ row, labels })
    if (activePage === 'dashboard') return <Dashboard onNavigate={navigate} />
    if (activePage === 'games') return <GameCatalogPage key={environment} environment={environment} onOpen={onOpen} />
    if (activePage === 'versions') return <GameVersionCenterPage onOpen={onOpen} />
    if (activePage === 'publish') return <ReleaseCenterPage onOpen={onOpen} />
    if (activePage === 'adminUsers') return <AdminUsersPage onOpen={onOpen} />
    if (activePage === 'wins') return <WinsPage />
    if (activePage === 'checkin') return <CheckinPage onOpen={onOpen} />
    if (activePage === 'wheel') return <WheelPage onOpen={onOpen} />
    if (activePage === 'store') return <ProductsPage onOpen={onOpen} />
    return <GenericPage key={activePage} page={activePage} onOpen={onOpen} />
  }
  return <div className="admin-shell">
    <aside className={`admin-sidebar ${mobileNav ? 'is-open' : ''}`}><div className="admin-brand"><span className="admin-brand-mark">J</span><span><strong>Joyloop</strong><small>运营后台原型</small></span><button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><Icon name="close" /></button></div><div className="env-chip"><span className="env-dot" />{environment === 'production' ? '生产环境' : '测试环境'} <small>v0.4.0</small></div><nav>{navGroups.map((group) => <div className="nav-group" key={group.title}><span className="nav-group-title">{group.title}</span>{group.items.map(([id, label, icon]) => <button key={id} className={activePage === id ? 'is-active' : ''} onClick={() => navigate(id)}><Icon name={icon} /><span>{label}</span>{id === 'todo' && <b>{initialRows.todo.length}</b>}</button>)}</div>)}</nav><a className="back-to-lobby" href="./index.html"><Icon name="chevronLeft" />返回大厅原型首页</a></aside>
    <div className="admin-main"><header className="admin-header"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)}><Icon name="flag" /></button><div className="crumb"><span>Joyloop 后台</span><Icon name="chevronRight" /><strong>{meta[0]}</strong></div><div className="header-actions"><label className="environment-select"><span>环境</span><select value={environment} onChange={(event) => setEnvironment(event.target.value)}><option value="test">测试环境</option><option value="production">生产环境</option></select></label><div className="global-search"><Icon name="eye" /><input placeholder="搜索功能、玩家或订单" /></div><button className="header-icon"><Icon name="bell" /><i /></button><button className="header-icon"><Icon name="gear" /></button><span className="admin-avatar">OP</span><span className="operator-name">运营管理员</span></div></header><div className="admin-tabs"><button className="tab active">{meta[0]} <Icon name="close" /></button><button className="tab" onClick={() => navigate('dashboard')}>运营概览</button></div><main className="admin-content"><div className="page-title"><div><span className="eyebrow">{activePage === 'dashboard' ? 'OPERATIONS OVERVIEW' : 'JOYLOOP ADMIN CONSOLE'}</span><h1>{meta[0]}</h1><p>{meta[1]}</p></div></div>{renderContent()}</main></div><DetailDrawer row={openRow?.row} labels={openRow?.labels} onClose={() => setOpenRow(null)} />
  </div>
}

export default AdminApp
