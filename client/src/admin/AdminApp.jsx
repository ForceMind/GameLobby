import { useMemo, useState } from 'react'
import { Icon } from '../icons.jsx'

const navGroups = [
  { title: '运营概览', items: [['dashboard', '仪表盘', 'gauge'], ['todo', '待处理事项', 'bell'], ['publish', '发布中心', 'play'], ['audit', '操作日志', 'clock']] },
  { title: '游戏运营', items: [['games', '游戏列表', 'gamepad'], ['versions', '游戏版本', 'refresh'], ['uploads', '上传记录', 'store'], ['test', '测试环境', 'flag'], ['production', '生产环境', 'shield'], ['categories', '分类与标签', 'star'], ['recommend', '推荐位与排序', 'trophy'], ['rooms', '直播房间', 'users']] },
  { title: '活动中心', items: [['activities', '活动列表', 'gift'], ['checkin', '签到活动', 'calendar'], ['wheel', '幸运转盘', 'refresh'], ['missions', '每日任务', 'flag'], ['family', '家族活动', 'users'], ['wins', '中奖动态', 'jackpot']] },
  { title: '赛事管理', items: [['tournaments', '赛事列表', 'trophy'], ['settlements', '报名与结算', 'wallet']] },
  { title: '商城与经济', items: [['store', '商品配置', 'store'], ['orders', '订单管理', 'wallet'], ['ledger', '钱包流水', 'coin'], ['redeem', '兑换码', 'gift']] },
  { title: '玩家与客服', items: [['players', '玩家管理', 'user'], ['tickets', '客服工单', 'phone']] },
  { title: '数据与风控', items: [['analytics', '数据分析', 'gauge'], ['risk', '风控审核', 'shield'], ['settings', '系统参数', 'gear'], ['adminUsers', '后台用户', 'user'], ['roles', '角色与权限', 'users']] },
]

const pageMeta = {
  dashboard: ['仪表盘', '实时掌握大厅、活动、赛事和商城运行情况。'],
  todo: ['待处理事项', '需要运营、审核或财务跟进的事项。'],
  publish: ['发布中心', '统一管理草稿、灰度、生效和回滚。'],
  audit: ['操作日志', '所有后台配置与人工操作的可追溯记录。'],
  games: ['游戏列表', '维护真实游戏目录、状态、权限和推荐关系。'],
  versions: ['游戏版本', '管理游戏前端版本、构建号和发布状态。'],
  uploads: ['上传记录', '查看版本包上传、校验和资源检查结果。'],
  test: ['测试环境', '发布到测试环境并记录测试结果。'],
  production: ['生产环境', '管理生产版本、灰度比例和回滚。'],
  categories: ['分类与标签', '管理 Slots、休闲、实时等前台筛选项。'],
  recommend: ['推荐位与排序', '配置大厅 Banner、热门游戏和拖拽排序。'],
  rooms: ['直播房间', '实时查看房间状态、主播和推荐策略。'],
  activities: ['活动列表', '管理签到、转盘、任务、家族和派对活动。'],
  checkin: ['签到活动', '配置周期签到和每日奖励。'],
  wheel: ['幸运转盘', '管理奖项、次数、概率和库存。'],
  missions: ['每日任务', '配置目标事件、进度和任务奖励。'],
  family: ['家族活动', '管理家族赛季、能量、宝箱和排行榜。'],
  wins: ['中奖动态', '配置赢家榜、最新中奖和隐私脱敏规则。'],
  tournaments: ['赛事列表', '管理赛事赛制、报名、奖池和资格。'],
  settlements: ['报名与结算', '监控参赛名单、排名、发奖和异常。'],
  store: ['商品配置', '管理金币礼包、保险箱和月度特权卡。'],
  orders: ['订单管理', '查询支付、到账、退款和拒付状态。'],
  ledger: ['钱包流水', '追踪金币、宝石的来源、消耗和人工调整。'],
  redeem: ['兑换码', '批量生成、限制、作废和查看兑换码。'],
  players: ['玩家管理', '查询玩家资料、资产、记录和账号状态。'],
  tickets: ['客服工单', '处理玩家申诉、退款和奖励问题。'],
  analytics: ['数据分析', '查看用户、游戏、活动、赛事和商城指标。'],
  risk: ['风控审核', '处理异常账号、交易、中奖和高风险变更。'],
  settings: ['系统参数', '区域、通知、语言和基础运行参数。'],
  adminUsers: ['后台用户', '管理运营、审核、财务和客服账号。'],
  roles: ['角色与权限', '配置菜单、操作、环境和数据范围权限。'],
}

const actionConfig = {
  publish: { label: '新建发布任务', title: '创建发布任务', icon: 'play', fields: ['发布对象', '对象版本', '目标环境', '发布范围'] },
  games: { label: '添加游戏', title: '添加游戏', icon: 'gamepad', fields: ['游戏名称', '游戏 ID', '游戏分类', '支持地区'] },
  versions: { label: '上传新版本', title: '上传游戏版本', icon: 'store', fields: ['选择游戏', '版本号', '构建号', '上传版本包'] },
  activities: { label: '创建活动', title: '创建活动', icon: 'gift', fields: ['活动名称', '活动类型', '适用人群', '奖励预算'] },
  checkin: { label: '创建签到活动', title: '创建签到活动', icon: 'calendar', fields: ['活动名称', '签到周期', '每日奖励', '最终大奖'] },
  wheel: { label: '新建转盘', title: '创建幸运转盘', icon: 'refresh', fields: ['转盘名称', '免费次数', '奖项数量', '概率版本'] },
  missions: { label: '新建任务', title: '创建每日任务', icon: 'flag', fields: ['任务名称', '目标事件', '目标值', '奖励内容'] },
  family: { label: '创建家族赛季', title: '创建家族赛季', icon: 'users', fields: ['赛季名称', '活动周期', '能量门槛', '宝箱奖励'] },
  tournaments: { label: '创建赛事', title: '创建赛事', icon: 'trophy', fields: ['赛事名称', '关联游戏', '报名费', '奖池'] },
  store: { label: '新建商品', title: '创建商品', icon: 'store', fields: ['商品名称', 'SKU', '价格', '赠送权益'] },
  redeem: { label: '生成兑换码', title: '生成兑换码批次', icon: 'gift', fields: ['兑换码批次', '奖励内容', '生成数量', '有效期'] },
  analytics: { label: '创建报表', title: '创建数据报表', icon: 'gauge', fields: ['报表名称', '统计类型', '数据范围', '刷新周期'] },
  adminUsers: { label: '新增后台用户', title: '新增后台用户', icon: 'user', fields: ['姓名', '登录账号', '角色', '数据范围'] },
  roles: { label: '新建角色', title: '创建角色', icon: 'users', fields: ['角色名称', '角色类型', '菜单权限', '数据范围'] },
}

const initialRows = {
  games: [
    ['Golden Pharaoh', 'golden-pharaoh', 'Slots · 实时', '正常运行', '2,481', '全区'],
    ['Ocean 777', 'ocean-777', 'Slots', '维护中', '—', '全区'],
    ['Fruit Party', 'fruit-party', 'Slots', '正常运行', '1,905', '全区'],
    ['Wild West Deluxe', 'wild-west-deluxe', 'Slots', '即将上线', '—', '灰度'],
    ['Fish Hunter', 'fish-hunter', '休闲 · 实时', '正常运行', '842', '全区'],
  ],
  activities: [
    ['幸运旋转狂欢季', '转盘', '2026-08-20 — 2026-09-20', '进行中', '24,680', '运营一组'],
    ['七日签到 · 秋日版', '签到', '2026-08-01 — 2026-09-30', '进行中', '18,420', '运营二组'],
    ['每日任务 3.1', '任务', '每日刷新', '草稿', '—', '产品组'],
    ['家族周挑战', '家族', '2026-08-29 — 2026-09-04', '待审核', '8,126', '社交组'],
  ],
  tournaments: [
    ['Slot 冲榜赛', 'slot-rank', '500,000 金币', '报名中', '186 / 240', '今日 22:30'],
    ['Jackpot 争夺赛', 'jackpot', '1,200,000 金币', '记录待补足', '96 / 128', '今日 23:15'],
    ['休闲积分挑战', 'casual', '80,000 金币', '候补开放', '80 / 80', '明日 18:00'],
  ],
  rooms: [
    ['黄金家族 · 今晚冲榜', 'NovaRay', 'Golden Pharaoh', '家族厅', '直播中', '1,284'],
    ['水果派对 · 13 人开黑', 'MintCat', 'Fruit Party', '派对房', '直播中', '916'],
    ['泡泡欢乐局 · 等你上麦', 'CloudNine', 'Bubble Pop', '派对房', '麦位已满', '388'],
    ['海底寻宝 · 房间维护中', 'OceanPilot', 'Ocean 777', '单人游戏房', '维护中', '0'],
  ],
  orders: [
    ['JL-2026-090101', 'NovaPlayer', '68,000 金币', '$4.90', '支付成功', '今天 14:42'],
    ['JL-2026-090099', 'MintCat', '30,000 金币', '$2.46', '退款处理中', '今天 13:05'],
    ['JL-2026-090082', 'BlueFin', '破产保险箱', '500 金币', '已完成', '今天 11:12'],
  ],
  players: [
    ['NovaPlayer', 'JL-2048', 'Lv.11', '52,860', '正常', '今天 14:42'],
    ['MintCat', 'JL-1188', 'Lv.18', '128,420', '正常', '今天 14:35'],
    ['BlueFin', 'JL-3307', 'Lv.7', '8,200', '活动限制', '昨天 22:10'],
    ['CloudNine', 'JL-0509', 'Lv.24', '680,000', '待复核', '昨天 21:58'],
  ],
  todo: [
    ['Ocean 777 维护超过 2 小时', '游戏运营', '高', '待处理', '12 分钟前', '运营一组'],
    ['家族周挑战等待发布审核', '活动中心', '中', '待审核', '28 分钟前', '审核组'],
    ['2 笔退款订单待财务确认', '商城与经济', '中', '处理中', '1 小时前', '财务组'],
  ],
  publish: [
    ['幸运旋转狂欢季 v3', '活动版本', '灰度 20%', '进行中', '运营一组', '10 分钟前'],
    ['Fish Hunter 封面更新', '游戏配置', '全量', '已发布', '产品组', '昨天 18:20'],
    ['家族周挑战 v1', '活动版本', '生产环境', '待审核', '社交组', '昨天 17:05'],
  ],
  audit: [
    ['#8f2a', '运营一组', '修改转盘奖励库存', '幸运旋转狂欢季', '成功', '今天 14:32'],
    ['#8e90', '财务组', '提交退款审核', '订单 JL-2026-090099', '成功', '今天 13:05'],
    ['#8d71', '系统', 'Ocean 777 自动进入维护', '游戏状态', '成功', '今天 12:48'],
  ],
  categories: [
    ['Slots', 'slots', 'Slots', '启用', '8 款游戏', '今天 10:00'],
    ['休闲', 'casual', '休闲', '启用', '4 款游戏', '今天 10:00'],
    ['实时', 'realtime', '实时', '启用', '3 款游戏', '昨天 18:20'],
  ],
  recommend: [
    ['大厅 Banner 1', '幸运旋转狂欢季', 'Banner', '生效中', '优先级 100', '9 月 20 日'],
    ['热门游戏首位', 'Golden Pharaoh', '游戏卡片', '生效中', '优先级 90', '长期'],
    ['直播快速入口', '黄金家族 · 今晚冲榜', '直播房间', '待审核', '优先级 80', '今天 23:59'],
  ],
  checkin: [
    ['七日签到 · 秋日版', '7 天', '18,420', '进行中', '总预算 6,800,000', '运营二组'],
    ['新用户首周签到', '7 天', '6,820', '已结束', '总预算 1,200,000', '增长组'],
  ],
  wheel: [
    ['幸运旋转狂欢季 · 主转盘', '8 个奖项', '3 次 / 日', '进行中', '库存 82%', '版本 v3'],
    ['新手免费转盘', '6 个奖项', '1 次 / 账号', '草稿', '库存未设置', '产品组'],
  ],
  missions: [
    ['累计旋转 100 次', '旋转次数', '100', '生效中', '+1,500 金币 + 3 宝石', '每日'],
    ['完成 5 局休闲游戏', '游戏局数', '5', '生效中', '+1,000 金币 + 2 宝石', '每日'],
    ['分享一次中奖记录', '分享事件', '1', '已过期', '+500 金币 + 1 宝石', '历史'],
  ],
  family: [
    ['家族周挑战', '2026-W35', '72 / 100 能量', '进行中', '24 个家族', '今日 23:59'],
    ['家族宝箱 · 夏日季', '2026-W31', '已结算', '已结束', '奖励 3,200,000 金币', '已归档'],
  ],
  wins: [
    ['NovaRay', 'Golden Pharaoh', '+268,800 金币', '已展示', '12 位好友在玩', '1 分钟前'],
    ['MintCat', 'Fruit Party', '+98,600 金币', '已展示', '8 位好友在玩', '3 分钟前'],
    ['CloudNine', 'Bubble Pop', '+42,900 金币', '待审核', '3 位好友在玩', '8 分钟前'],
  ],
  settlements: [
    ['Slot 冲榜赛', '186 人', '92 在线', '结算待开始', '前 20 名分奖', '今日 22:30'],
    ['经典 Slot 冲榜场', '240 人', '—', '已结算', '奖励已发放', '今天 13:00'],
    ['休闲积分挑战', '80 + 7 候补', '—', '候补开放', '前 30 名分奖', '明日 18:00'],
  ],
  store: [
    ['68,000 金币礼包', 'coin-68', '$4.90', '生效中', '赠 25 宝石', '推荐'],
    ['破产保险箱', 'vault-monthly', '500 金币', '生效中', '按日统计净损', '活动权益'],
    ['月度特权卡', 'monthly-pass', '$9.90', '即将开放', '30 天权益', '会员'],
  ],
  ledger: [
    ['#WL-900128', 'NovaPlayer', '+2,000 金币', 'D3 每日签到', '成功', '今天 14:43'],
    ['#WL-900127', 'NovaPlayer', '-500 金币', '购买破产保险箱', '成功', '今天 14:40'],
    ['#WL-900121', 'CloudNine', '+42,900 金币', '中奖结算', '待复核', '今天 14:32'],
  ],
  redeem: [
    ['JOY-AUTUMN-2026', '秋日活动批次', '金币 + 宝石', '生效中', '已兑换 1,280 / 5,000', '9 月 30 日'],
    ['JOY-VIP-TRIAL', 'VIP 体验批次', '月卡 3 天', '已作废', '已兑换 820 / 1,000', '已结束'],
  ],
  tickets: [
    ['TK-20481', 'NovaPlayer', '奖励未到账', '待处理', '高', '客服一组'],
    ['TK-20472', 'MintCat', '订单退款', '处理中', '中', '财务组'],
    ['TK-20460', 'BlueFin', '活动资格申诉', '已解决', '低', '客服二组'],
  ],
  analytics: [
    ['大厅 → 游戏启动', '转化漏斗', '28,460 UV', '正常', '启动率 42.8%', '今日'],
    ['幸运转盘活动', '活动分析', '24,680 参与', '正常', '领取率 64.8%', '今日'],
    ['商城支付', '收入分析', '$12,480', '正常', '成功率 98.2%', '今日'],
  ],
  risk: [
    ['RSK-8812', 'CloudNine', '异常中奖频次', '待复核', '高', '今天 14:32'],
    ['RSK-8807', 'JL-3307', '批量任务行为', '处理中', '中', '今天 13:18'],
    ['RSK-8790', '订单批次', '支付拒付', '已解决', '高', '昨天 20:11'],
  ],
  settings: [
    ['运营管理员', 'admin-001', '角色与账号', '启用', '最近登录 10 分钟前', '权限管理'],
    ['生产环境', 'prod-cn', '区域配置', '启用', 'Asia/Shanghai', '系统参数'],
    ['获胜弹幕通知', 'notify-win', '通知模板', '启用', '中英文', '内容中心'],
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
  roles: [
    ['超级管理员', 'super-admin', '全部菜单', '启用', '全部环境', '系统内置'],
    ['活动运营', 'campaign-ops', '活动 / 内容', '启用', '测试 + 生产只读', '自定义'],
    ['财务人员', 'finance', '商城 / 订单 / 流水', '启用', '生产', '自定义'],
  ],
}

const statusClass = (value) => {
  if (['正常运行', '进行中', '直播中', '支付成功', '已完成', '正常', '生效中', '已发布', '启用', '成功', '已解决', '测试通过', '校验通过', '已展示', '已结算'].includes(value)) return 'success'
  if (['维护中', '待审核', '退款处理中', '候补开放', '待复核', '草稿', '待处理', '处理中', '结算待开始', '灰度 20%', '测试中', '检查中', '待激活'].includes(value)) return 'warning'
  if (['已下架', '已封禁', '支付失败', '异常', '已作废', '上传失败'].includes(value)) return 'danger'
  return 'neutral'
}

const statusValues = ['正常运行', '维护中', '即将上线', '进行中', '草稿', '待审核', '候补开放', '直播中', '麦位已满', '支付成功', '退款处理中', '已完成', '正常', '活动限制', '待复核', '待处理', '处理中', '结算待开始', '生效中', '已发布', '启用', '成功', '已解决', '已结束', '已作废', '灰度 20%', '测试通过', '测试中', '校验通过', '检查中', '上传失败', '已展示', '已结算', '待激活']

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
      <MetricCard label="正常运行游戏" value="5 / 8" trend="2 款维护 · 1 款灰度" icon="gamepad" tone="green" />
      <MetricCard label="待处理事项" value="12" trend="3 项高优先级" icon="bell" tone="orange" />
    </div>
    <div className="admin-dashboard-grid">
      <section className="admin-card status-overview"><div className="card-heading"><div><h2>平台运行概况</h2><p>当前数据权限范围内的实时状态</p></div><button className="admin-link" onClick={() => onNavigate('games')}>查看游戏管理 <Icon name="chevronRight" /></button></div><div className="distribution"><div><span>正常运行</span><strong>5 款 <small>62.5%</small></strong><b><i style={{ width: '62.5%' }} /></b></div><div><span>维护中</span><strong>2 款 <small>25%</small></strong><b className="orange"><i style={{ width: '25%' }} /></b></div><div><span>灰度/即将上线</span><strong>1 款 <small>12.5%</small></strong><b className="gray"><i style={{ width: '12.5%' }} /></b></div></div></section>
      <section className="admin-card quick-stats"><div className="card-heading"><div><h2>今日业务摘要</h2><p>截至 2026-09-01 15:00</p></div><Icon name="clock" /></div><div className="summary-grid"><div><span>活动参与</span><strong>18,240</strong><small>完成率 64.8%</small></div><div><span>赛事报名</span><strong>362</strong><small>候补 7 人</small></div><div><span>直播进房</span><strong>9,680</strong><small>平均停留 12m</small></div><div><span>充值金额</span><strong>$12,480</strong><small>支付成功率 98.2%</small></div></div></section>
    </div>
    <div className="admin-dashboard-grid lower">
      <section className="admin-card"><div className="card-heading"><div><h2>待处理事项</h2><p>需要运营或审核跟进的事项</p></div><button className="admin-link" onClick={() => onNavigate('todo')}>全部事项 <Icon name="chevronRight" /></button></div><div className="todo-list"><button onClick={() => onNavigate('games')}><span className="todo-dot danger" /><span><strong>Ocean 777 维护超过 2 小时</strong><small>游戏运营 · 12 分钟前</small></span><Icon name="chevronRight" /></button><button onClick={() => onNavigate('activities')}><span className="todo-dot warning" /><span><strong>家族周挑战等待发布审核</strong><small>活动中心 · 28 分钟前</small></span><Icon name="chevronRight" /></button><button onClick={() => onNavigate('orders')}><span className="todo-dot blue" /><span><strong>2 笔退款订单待财务确认</strong><small>商城与经济 · 1 小时前</small></span><Icon name="chevronRight" /></button></div></section>
      <section className="admin-card release-card"><div className="card-heading"><div><h2>最近发布</h2><p>配置版本和发布状态</p></div><button className="admin-link" onClick={() => onNavigate('publish')}>发布中心 <Icon name="chevronRight" /></button></div><div className="release-row"><span className="release-icon"><Icon name="gift" /></span><span><strong>幸运旋转狂欢季 v3</strong><small>灰度 20% · 运营一组 · 10 分钟前</small></span><Status>进行中</Status></div><div className="release-row"><span className="release-icon"><Icon name="gamepad" /></span><span><strong>Fish Hunter 封面更新</strong><small>全量发布 · 产品组 · 昨天 18:20</small></span><Status>正常运行</Status></div></section>
    </div>
  </>
}

const gameCatalog = [
  { id: 'golden-pharaoh', name: 'Golden Pharaoh', category: 'Slots · 实时', version: 'v2.3.8', status: '正常运行', players: '2,481', heat: 96 },
  { id: 'fruit-party', name: 'Fruit Party', category: 'Slots', version: 'v1.7.6', status: '正常运行', players: '1,905', heat: 91 },
  { id: 'fish-hunter', name: 'Fish Hunter', category: '休闲 · 实时', version: 'v2.1.0', status: '正常运行', players: '842', heat: 84 },
  { id: 'bubble-pop', name: 'Bubble Pop', category: '休闲', version: 'v1.4.2', status: '正常运行', players: '765', heat: 81 },
  { id: 'ocean-777', name: 'Ocean 777', category: 'Slots', version: 'v2.9.4', status: '维护中', players: '—', heat: 0 },
  { id: 'wild-west-deluxe', name: 'Wild West Deluxe', category: 'Slots', version: 'v0.9.0', status: '即将上线', players: '—', heat: 0 },
]

function GameCatalogPage({ onOpen, environment }) {
  const [items, setItems] = useState(gameCatalog)
  const [dragging, setDragging] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [view, setView] = useState('table')
  const labels = ['游戏名称', '游戏 ID', '分类', '当前版本', '状态', '在线人数']
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
  const openDetail = (game) => onOpen([game.name, game.id, game.category, game.version, game.status, game.players], labels)
  return <>
    <section className="admin-card catalog-summary"><div><span>当前环境</span><strong>{environment === 'production' ? '生产环境' : '测试环境'}</strong><small>排序草稿只影响当前环境</small></div><div><span>目录游戏</span><strong>{items.length} 款</strong><small>正常运行 {items.filter((item) => item.status === '正常运行').length} 款</small></div><div><span>排序状态</span><strong>{dirty ? '未保存' : '已同步'}</strong><small>{dirty ? '保存后生成排序版本' : '最近同步 5 分钟前'}</small></div></section>
    <div className="catalog-toolbar"><div className="view-toggle"><button className={view === 'table' ? 'is-active' : ''} onClick={() => setView('table')}>表格视图</button><button className={view === 'cards' ? 'is-active' : ''} onClick={() => setView('cards')}>卡片视图</button></div><span className="drag-hint"><Icon name="flag" />拖拽行或卡片调整排序</span>{dirty && <button className="admin-btn primary" onClick={() => setDirty(false)}>保存排序草稿</button>}</div>
    {view === 'table' ? <section className="admin-card table-card"><div className="table-top"><div><strong>游戏目录</strong><span>按 {environment === 'production' ? '生产' : '测试'} 环境排序</span></div><button className="admin-btn subtle">导入目录</button></div><div className="table-wrap"><table className="catalog-table"><thead><tr><th>排序</th>{labels.map((label) => <th key={label}>{label}</th>)}<th>热度</th><th>操作</th></tr></thead><tbody>{items.map((game, index) => <tr key={game.id} draggable onDragStart={() => setDragging(game.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(game.id)} onDragEnd={() => setDragging(null)} className={dragging === game.id ? 'is-dragging' : ''}><td><span className="drag-handle" aria-label="拖拽排序">⋮⋮</span><b className="sort-number">{index + 1}</b></td><td><span className="game-name-cell"><span className={`game-thumb thumb-${index % 4}`} /><strong>{game.name}</strong></span></td><td>{game.id}</td><td>{game.category}</td><td>{game.version}</td><td><Status>{game.status}</Status></td><td>{game.players}</td><td><span className="heat-bar"><i style={{ width: `${game.heat}%` }} /></span><small>{game.heat || '—'}</small></td><td><button className="row-action" onClick={() => openDetail(game)}>查看详情</button></td></tr>)}</tbody></table></div></section> : <section className="catalog-cards">{items.map((game, index) => <article draggable key={game.id} onDragStart={() => setDragging(game.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(game.id)} onDragEnd={() => setDragging(null)} className={`game-admin-card ${dragging === game.id ? 'is-dragging' : ''}`}><span className={`game-cover cover-${index % 4}`}><b>{index + 1}</b><i>⋮⋮</i></span><div><div className="game-card-top"><Status>{game.status}</Status><small>热度 {game.heat || '—'}</small></div><h3>{game.name}</h3><p>{game.category} · {game.version}</p><span>{game.players} 在线</span></div><button className="row-action" onClick={() => openDetail(game)}>详情</button></article>)}</section>}
  </>
}

function VersionWorkflowPage({ page, onOpen, environment }) {
  const [rows, setRows] = useState(initialRows[page] || [])
  const [showUpload, setShowUpload] = useState(false)
  const [fileName, setFileName] = useState('')
  const isUpload = page === 'uploads'
  const labels = isUpload ? ['记录 ID', '版本包', '文件信息', '校验状态', '上传人', '时间'] : page === 'versions' ? ['游戏名称', '版本号', '当前生产', '版本状态', '发布范围', '更新时间'] : ['版本', '构建号/范围', '环境', '状态', '质量指标', '更新时间']
  const action = isUpload ? { label: '上传新版本', title: '上传游戏版本', fields: ['选择游戏', '版本号', '构建号', '上传版本包'] } : page === 'versions' ? actionConfig.versions : page === 'test' ? { label: '发布到测试环境', title: '发布到测试环境', fields: ['选择版本', '测试地址', '测试账号', '测试说明'] } : { label: '发起生产发布', title: '发起生产发布', fields: ['选择版本', '发布范围', '灰度比例', '回滚版本'] }
  const openUpload = () => { setFileName(''); setShowUpload(true) }
  const save = () => { setRows((current) => [...current, isUpload ? [`UP-NEW-${current.length + 1}`, '待上传的游戏版本', fileName || 'ZIP · 待选择', '检查中', '当前操作员', '刚刚'] : ['待发布新版本', 'build-demo', environment === 'production' ? '生产环境' : '测试环境', '待审核', '待测试验证', '刚刚']]); setShowUpload(false) }
  return <>
    <div className="workflow-strip"><div className="workflow-step done"><b>1</b><span>上传版本</span></div><i /><div className="workflow-step active"><b>2</b><span>自动检查</span></div><i /><div className="workflow-step"><b>3</b><span>测试环境</span></div><i /><div className="workflow-step"><b>4</b><span>审核发布</span></div><i /><div className="workflow-step"><b>5</b><span>生产环境</span></div></div>
    <div className="environment-note"><Icon name="shield" /><span><strong>当前查看：{environment === 'production' ? '生产环境' : '测试环境'}</strong><small>{environment === 'production' ? '生产操作需要发布权限和审批，发布前必须存在可回滚版本。' : '测试环境允许反复部署，不产生真实订单和资产变化。'}</small></span></div>
    <div className="admin-toolbar"><div className="admin-search"><Icon name="eye" /><input placeholder={`搜索${pageMeta[page][0]}...`} /></div><button className="admin-btn primary" onClick={openUpload}><Icon name={action.icon || 'play'} />{action.label}</button></div>
    <section className="admin-card table-card"><div className="table-top"><div><strong>{pageMeta[page][0]}列表</strong><span>当前环境：{environment === 'production' ? '生产' : '测试'}</span></div><button className="admin-btn subtle">导出记录</button></div><div className="table-wrap"><table><thead><tr>{labels.map((label) => <th key={label}>{label}</th>)}<th>操作</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`} onClick={() => onOpen(row, labels)}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{statusValues.includes(cell) ? <Status>{cell}</Status> : <span>{cell}</span>}</td>)}<td><button className="row-action" onClick={(event) => { event.stopPropagation(); onOpen(row, labels) }}>查看详情</button></td></tr>)}</tbody></table></div></section>
    {showUpload && <div className="admin-overlay" onMouseDown={(event) => event.target === event.currentTarget && setShowUpload(false)}><div className="admin-modal"><div className="modal-head"><div><span className="eyebrow">版本发布流程</span><h2>{action.title}</h2></div><button className="icon-button" onClick={() => setShowUpload(false)}><Icon name="close" /></button></div><div className="form-grid"><label>{action.fields[0]}<input placeholder={`请选择${action.fields[0]}`} /></label><label>{action.fields[1]}<input placeholder={`请输入${action.fields[1]}`} /></label><label>{action.fields[2]}<input placeholder={`请输入${action.fields[2]}`} /></label><label>{action.fields[3]}<input type={isUpload ? 'file' : 'text'} onChange={(event) => isUpload && setFileName(event.target.files?.[0]?.name || '')} /></label><label className="full upload-check"><span>上传前自动检查</span><small>文件完整性 · 入口文件 · 资源类型 · 版本号 · 路径安全</small>{fileName && <em>{fileName}</em>}</label><label className="full">发布说明<textarea placeholder="填写版本变化、影响范围、测试说明和回滚计划" /></label></div><div className="modal-foot"><button className="admin-btn subtle" onClick={() => setShowUpload(false)}>取消</button><button className="admin-btn primary" onClick={save}>{isUpload ? '开始上传并检查' : '保存发布任务'}</button></div></div></div>}
  </>
}

function ReleaseCenterPage({ onOpen }) {
  return <>
    <div className="release-metrics"><div><span>待审核</span><strong>3</strong><small>2 个游戏版本 · 1 个活动</small></div><div><span>测试中</span><strong>2</strong><small>需要 QA 验证</small></div><div><span>灰度发布</span><strong>1</strong><small>当前覆盖 20%</small></div><div><span>生产发布</span><strong>8</strong><small>过去 30 天</small></div></div>
    <section className="admin-card release-guide"><div className="card-heading"><div><h2>发布任务流程</h2><p>发布中心只管理发布任务，不创建“发布中心”本身。</p></div><span className="release-safety"><Icon name="shield" />生产发布需审批</span></div><div className="release-guide-steps"><div className="is-done"><b>1</b><span>创建任务</span><small>选择对象和版本</small></div><i /><div className="is-done"><b>2</b><span>自动检查</span><small>资源与版本校验</small></div><i /><div className="is-active"><b>3</b><span>测试验证</span><small>QA 标记结果</small></div><i /><div><b>4</b><span>审核发布</span><small>灰度或生产</small></div></div></section>
    <GenericPage page="publish" onOpen={onOpen} />
    <section className="admin-card release-history"><div className="card-heading"><div><h2>版本健康度</h2><p>发布后的实时质量观察</p></div><button className="admin-link">查看监控 <Icon name="chevronRight" /></button></div><div className="health-grid"><div><span>启动成功率</span><strong>99.6%</strong><em>↑ 0.8%</em></div><div><span>资源加载失败</span><strong>0.12%</strong><em>↓ 0.04%</em></div><div><span>异常回滚</span><strong>0</strong><em>过去 7 天</em></div></div></section>
  </>
}

function AdminUsersPage({ onOpen }) {
  const permissions = [['活动运营', '活动 / 内容', '创建、编辑、测试发布', '生产只读'], ['游戏运营', '游戏 / 版本', '上传、排序、测试发布', '生产需审批'], ['财务人员', '商城 / 订单 / 流水', '查询、退款、对账', '生产可操作'], ['审核人员', '审批中心', '审核、驳回、查看差异', '不可直接发布']]
  return <><section className="admin-card permission-summary"><div><span>后台账号</span><strong>18</strong><small>启用 16 · 待激活 2</small></div><div><span>角色数量</span><strong>7</strong><small>3 个自定义角色</small></div><div><span>MFA 覆盖率</span><strong>94%</strong><small>1 个账号需处理</small></div><div><span>生产权限</span><strong>5</strong><small>均已配置审批</small></div></section><section className="admin-card permission-matrix"><div className="card-heading"><div><h2>角色权限摘要</h2><p>菜单权限、操作权限和环境权限分开控制。</p></div><button className="admin-link" onClick={() => onOpen(permissions[0], ['角色', '菜单范围', '可执行操作', '生产权限'])}>查看权限详情 <Icon name="chevronRight" /></button></div><div className="permission-table"><div className="permission-row permission-head"><span>角色</span><span>菜单范围</span><span>操作权限</span><span>生产权限</span></div>{permissions.map((row) => <button className="permission-row" key={row[0]} onClick={() => onOpen(row, ['角色', '菜单范围', '可执行操作', '生产权限'])}>{row.map((value) => <span key={value}>{value}</span>)}</button>)}</div></section><GenericPage page="adminUsers" onOpen={onOpen} /></>
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
    tournaments: ['赛事名称', '赛事 ID', '奖池', '状态', '报名人数', '结算时间'],
    rooms: ['房间名称', '主播', '关联游戏', '房间类型', '状态', '在线人数'],
    orders: ['订单号', '玩家', '商品', '金额', '状态', '时间'],
    players: ['昵称', '玩家 ID', '等级', '金币余额', '账号状态', '最近活跃'],
    todo: ['事项', '来源模块', '优先级', '状态', '更新时间', '负责人'],
    publish: ['版本名称', '对象类型', '发布范围', '状态', '负责人', '更新时间'],
    audit: ['日志 ID', '操作人', '操作类型', '对象', '结果', '时间'],
    categories: ['分类名称', '分类 ID', '前台标签', '状态', '关联游戏', '更新时间'],
    recommend: ['推荐位', '推荐内容', '展示类型', '状态', '优先级', '结束时间'],
    checkin: ['活动名称', '周期', '参与人数', '状态', '奖励预算', '负责人'],
    wheel: ['转盘名称', '奖项数量', '免费次数', '状态', '库存', '版本'],
    missions: ['任务名称', '目标事件', '目标值', '状态', '奖励', '刷新周期'],
    family: ['活动名称', '赛季', '当前进度', '状态', '参与范围', '结算时间'],
    wins: ['玩家', '游戏', '中奖金额', '展示状态', '好友同玩', '发生时间'],
    settlements: ['赛事名称', '报名人数', '当前在线', '结算状态', '奖励规则', '结算时间'],
    store: ['商品名称', 'SKU', '价格', '状态', '权益/赠送', '商品标签'],
    ledger: ['流水 ID', '玩家', '变动金额', '来源', '状态', '时间'],
    redeem: ['兑换码批次', '渠道/活动', '奖励内容', '状态', '兑换进度', '有效期'],
    tickets: ['工单号', '玩家', '问题类型', '处理状态', '优先级', '处理人'],
    analytics: ['报表名称', '报表类型', '核心数据', '状态', '关键指标', '统计周期'],
    risk: ['风险事件', '对象', '风险类型', '处理状态', '风险等级', '时间'],
    settings: ['配置名称', '配置 ID', '配置类型', '状态', '当前值', '所属模块'],
    versions: ['游戏名称', '版本号', '当前生产', '版本状态', '发布范围', '更新时间'],
    uploads: ['记录 ID', '版本包', '文件信息', '校验状态', '上传人', '时间'],
    test: ['版本', '构建号', '环境', '测试状态', '质量指标', '更新时间'],
    production: ['版本', '发布范围', '环境', '发布状态', '质量指标', '更新时间'],
    adminUsers: ['姓名', '登录账号', '角色', '账号状态', '环境权限', '最近登录'],
    roles: ['角色名称', '角色 ID', '菜单范围', '状态', '环境范围', '来源'],
  }[page] || ['名称', '标识', '类型', '状态', '数据', '更新时间']
  const statusOptions = [...new Set((rows || []).flatMap((row) => row.filter((cell) => statusValues.includes(cell))))]
  return <>
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
  const workflowPages = ['versions', 'uploads', 'test', 'production']
  const renderContent = () => {
    if (activePage === 'dashboard') return <Dashboard onNavigate={navigate} />
    if (activePage === 'games') return <GameCatalogPage environment={environment} onOpen={(row, labels) => setOpenRow({ row, labels })} />
    if (activePage === 'publish') return <ReleaseCenterPage onOpen={(row, labels) => setOpenRow({ row, labels })} />
    if (activePage === 'adminUsers') return <AdminUsersPage onOpen={(row, labels) => setOpenRow({ row, labels })} />
    if (workflowPages.includes(activePage)) return <VersionWorkflowPage page={activePage} environment={environment} onOpen={(row, labels) => setOpenRow({ row, labels })} />
    return <GenericPage page={activePage} onOpen={(row, labels) => setOpenRow({ row, labels })} />
  }
  return <div className="admin-shell">
    <aside className={`admin-sidebar ${mobileNav ? 'is-open' : ''}`}><div className="admin-brand"><span className="admin-brand-mark">J</span><span><strong>Joyloop</strong><small>运营后台原型</small></span><button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><Icon name="close" /></button></div><div className="env-chip"><span className="env-dot" />{environment === 'production' ? '生产环境' : '测试环境'} <small>v0.3.1</small></div><nav>{navGroups.map((group) => <div className="nav-group" key={group.title}><span className="nav-group-title">{group.title}</span>{group.items.map(([id, label, icon]) => <button key={id} className={activePage === id ? 'is-active' : ''} onClick={() => navigate(id)}><Icon name={icon} /><span>{label}</span>{id === 'todo' && <b>12</b>}</button>)}</div>)}</nav><a className="back-to-lobby" href="./index.html"><Icon name="chevronLeft" />返回大厅原型首页</a></aside>
    <div className="admin-main"><header className="admin-header"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)}><Icon name="flag" /></button><div className="crumb"><span>Joyloop 后台</span><Icon name="chevronRight" /><strong>{meta[0]}</strong></div><div className="header-actions"><label className="environment-select"><span>环境</span><select value={environment} onChange={(event) => setEnvironment(event.target.value)}><option value="test">测试环境</option><option value="production">生产环境</option></select></label><div className="global-search"><Icon name="eye" /><input placeholder="搜索功能、玩家或订单" /></div><button className="header-icon"><Icon name="bell" /><i /></button><button className="header-icon"><Icon name="gear" /></button><span className="admin-avatar">OP</span><span className="operator-name">运营管理员</span></div></header><div className="admin-tabs"><button className="tab active">{meta[0]} <Icon name="close" /></button><button className="tab" onClick={() => navigate('dashboard')}>仪表盘</button></div><main className="admin-content"><div className="page-title"><div><span className="eyebrow">{activePage === 'dashboard' ? 'OPERATIONS OVERVIEW' : 'JOYLOOP ADMIN CONSOLE'}</span><h1>{meta[0]}</h1><p>{meta[1]}</p></div></div>{renderContent()}</main></div><DetailDrawer row={openRow?.row} labels={openRow?.labels} onClose={() => setOpenRow(null)} />
  </div>
}

export default AdminApp
