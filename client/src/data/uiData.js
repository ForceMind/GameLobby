export const tabs = [
  { id: 'lobby', label: '大厅', sprite: 'home' },
  { id: 'arena', label: '赛事', sprite: 'arena' },
  { id: 'events', label: '活动', sprite: 'events' },
  { id: 'store', label: '商城', sprite: 'store' },
  { id: 'profile', label: '我的', sprite: 'profile' },
];

export const heroSlides = [
  {
    id: 'pharaoh',
    title: 'Golden Pharaoh 狂欢夜',
    subtitle: '主奖池 8,880,000 金币，今夜加开 Jackpot 加速轨道。',
    badge: '今晚 21:30 双倍掉落',
    cover: 'goldenPharaoh',
    gameId: 'golden-pharaoh',
    accent: '#ffb347',
  },
  {
    id: 'ocean',
    title: 'Ocean 777 海域大奖',
    subtitle: '三档房间实时滚动派奖，低门槛也能冲上榜。',
    badge: '新手房额外返票',
    cover: 'ocean777',
    gameId: 'ocean-777',
    accent: '#1fb9ff',
  },
  {
    id: 'casual',
    title: '轻休闲补给站',
    subtitle: 'Bubble、Dice、Mini Golf 联动任务同时开放。',
    badge: '完成 3 局送 12 活动币',
    cover: 'bubblePop',
    gameId: 'bubble-pop',
    accent: '#27d39d',
  },
];

export const games = [
  {
    id: 'golden-pharaoh',
    name: 'Golden Pharaoh',
    category: 'Slots',
    cover: 'goldenPharaoh',
    players: '4.8k',
    heat: 99,
    tag: 'JACKPOT',
    rtp: '96.2%',
    jackpot: '8.88M',
    entry: '20 金币起转',
    summary: '高波动三卷轴 Slot，适合追求大奖爆发感的玩家。',
    perks: ['免费旋转可叠加乘区', '夜间双倍奖池', '支持三档房间切换'],
    rooms: [
      { name: '新手房', desc: '20 - 100 金币 / 局', occupancy: '低风险' },
      { name: '高手房', desc: '100 - 500 金币 / 局', occupancy: '高回报' },
      { name: '至尊房', desc: '500 金币以上 / 局', occupancy: '冲榜专用' },
    ],
  },
  {
    id: 'ocean-777',
    name: 'Ocean 777',
    category: 'Slots',
    cover: 'ocean777',
    players: '4.1k',
    heat: 96,
    tag: 'HOT',
    rtp: '95.8%',
    jackpot: '6.42M',
    entry: '10 金币起转',
    summary: '海域主题高频奖励房，节奏快，适合日常冲任务。',
    perks: ['高频中小奖掉落', '新手房返票', '赛事积分加权'],
    rooms: [
      { name: '暖场房', desc: '10 - 60 金币 / 局', occupancy: '节奏平稳' },
      { name: '标准房', desc: '60 - 240 金币 / 局', occupancy: '收益均衡' },
      { name: '冲浪房', desc: '240 金币以上 / 局', occupancy: '活动加权' },
    ],
  },
  {
    id: 'fruit-party',
    name: 'Fruit Party',
    category: 'Slots',
    cover: 'fruitParty',
    players: '3.6k',
    heat: 92,
    tag: 'TREND',
    rtp: '95.6%',
    jackpot: '4.18M',
    entry: '15 金币起转',
    summary: '糖果水果主题 Slot，适合做日常和连续转任务。',
    perks: ['中等奖励密度高', '签到卡任务专属加成', '周榜统计覆盖'],
    rooms: [
      { name: '果园房', desc: '15 - 80 金币 / 局', occupancy: '轻松刷进度' },
      { name: '派对房', desc: '80 - 280 金币 / 局', occupancy: '推荐房间' },
      { name: '狂欢房', desc: '280 金币以上 / 局', occupancy: '热度最高' },
    ],
  },
  {
    id: 'wild-west',
    name: 'Wild West Deluxe',
    category: 'Slots',
    cover: 'wildWest',
    players: '2.8k',
    heat: 89,
    tag: 'NEW',
    rtp: '96.0%',
    jackpot: '3.76M',
    entry: '20 金币起转',
    summary: '西部追击主题 Slot，带赏金乘区和高波动连击。',
    perks: ['赏金星级叠加', '赛事积分爆发', '高阶房掉率提升'],
    rooms: [
      { name: '边境房', desc: '20 - 100 金币 / 局', occupancy: '适合熟悉玩法' },
      { name: '赏金房', desc: '100 - 360 金币 / 局', occupancy: '追求爆发' },
      { name: '冠军房', desc: '360 金币以上 / 局', occupancy: '榜单热门' },
    ],
  },
  {
    id: 'fish-hunter',
    name: 'Fish Hunter',
    category: '休闲',
    cover: 'fishHunter',
    players: '2.3k',
    heat: 87,
    tag: 'FUN',
    rtp: '94.9%',
    jackpot: '1.24M',
    entry: '5 金币 / 局',
    summary: '轻度捕鱼竞技房，适合完成活动币日常与休闲挑战。',
    perks: ['局时短', '任务完成快', '活动币产出稳定'],
    rooms: [
      { name: '海滩区', desc: '5 - 30 金币 / 局', occupancy: '休闲娱乐' },
      { name: '港口区', desc: '30 - 100 金币 / 局', occupancy: '奖励均衡' },
      { name: '深海区', desc: '100 金币以上 / 局', occupancy: '高收益' },
    ],
  },
  {
    id: 'bubble-pop',
    name: 'Bubble Pop',
    category: '休闲',
    cover: 'bubblePop',
    players: '1.8k',
    heat: 84,
    tag: 'EASY',
    rtp: '95.3%',
    jackpot: '820k',
    entry: '4 金币 / 局',
    summary: '消除与爆珠结合的快节奏休闲局，适合碎片时间。',
    perks: ['节奏快', '签到加分', '连续胜利有倍数'],
    rooms: [
      { name: '标准区', desc: '4 - 20 金币 / 局', occupancy: '轻松入门' },
      { name: '进阶区', desc: '20 - 80 金币 / 局', occupancy: '冲任务推荐' },
      { name: '联动区', desc: '80 金币以上 / 局', occupancy: '赛事加权' },
    ],
  },
  {
    id: 'dice-merge',
    name: 'Dice Merge',
    category: '休闲',
    cover: 'diceMerge',
    players: '1.6k',
    heat: 81,
    tag: 'RELAX',
    rtp: '94.8%',
    jackpot: '690k',
    entry: '3 金币 / 局',
    summary: '合成骰子玩法，偏策略节奏，适合稳定攒资源。',
    perks: ['稳定收益', '任务兼容', '低波动'],
    rooms: [
      { name: '轻松区', desc: '3 - 18 金币 / 局', occupancy: '舒适刷局' },
      { name: '策略区', desc: '18 - 60 金币 / 局', occupancy: '推荐' },
      { name: '竞速区', desc: '60 金币以上 / 局', occupancy: '高手局' },
    ],
  },
  {
    id: 'mini-golf',
    name: 'Mini Golf Rush',
    category: '休闲',
    cover: 'miniGolf',
    players: '1.2k',
    heat: 79,
    tag: 'COZY',
    rtp: '94.5%',
    jackpot: '540k',
    entry: '6 金币 / 局',
    summary: '短局推杆玩法，适合收尾补任务和活动币。',
    perks: ['上手快', '赛事补分', '支持双人房'],
    rooms: [
      { name: '练习果岭', desc: '6 - 20 金币 / 局', occupancy: '新手向' },
      { name: '竞速果岭', desc: '20 - 60 金币 / 局', occupancy: '常驻热门' },
      { name: '冠军果岭', desc: '60 金币以上 / 局', occupancy: '对抗更强' },
    ],
  },
];

export const quickActions = [
  { id: 'benefits', title: '福利中心', desc: '签到、转盘、限时礼包', sprite: 'gift', detail: 'benefits' },
  { id: 'notice', title: '公告速递', desc: '版本、活动与奖池播报', sprite: 'bell', detail: 'notice' },
  { id: 'missions', title: '任务中心', desc: '每日任务与成长进度', sprite: 'mission', detail: 'missionCenter' },
  { id: 'wallet', title: '资产概览', desc: '金币、活动币和账单', sprite: 'wallet', detail: 'wallet' },
];

export const leaderboard = [
  { name: 'ReelMaster', note: 'Golden Pharaoh 连中 6 次', score: '128,800' },
  { name: 'LuckyBean', note: 'Ocean 777 触发双 Jackpot', score: '106,420' },
  { name: 'SpinKing', note: 'Wild West 冲榜三连胜', score: '98,880' },
  { name: 'FishHero', note: 'Fish Hunter 休闲连胜 9 局', score: '87,500' },
];

export const announcements = [
  { title: '周末热力赛今晚 21:30 开启', body: 'Slot 冲榜赛开启双倍积分，报名费 2,000 金币。', tag: '赛事' },
  { title: 'Ocean 777 新手房返票加开', body: '今日在海域新手房完成 20 局可额外返还 30% 入场券。', tag: '活动' },
  { title: '签到奖励上调', body: '第 7 日签到由 588 金币提升至 888 金币，并附赠 6 活动币。', tag: '福利' },
  { title: '风控系统升级完成', body: '异常登录检测策略已更新，近 30 天内无风险登录。', tag: '系统' },
];

export const tournaments = [
  {
    id: 'slot-ladder',
    title: 'Slot 冲榜赛',
    subtitle: 'Mega Ways 模式',
    prize: '￥ 88,888',
    entryFee: '2,000 金币',
    progress: 56,
    capacity: '1,122 / 2,000',
    settlement: '22:10 统一结算',
    summary: '按净收益排名，单局收益越高加权越高。',
    rules: ['每 50 次有效旋转计 1 局，单次最低 20 金币。', '仅统计当日 00:00 - 22:00 净收益。', '中途退出保留已得积分。'],
    rewards: ['第 1 名：68,000 金币 + 180 活动币', '第 2-10 名：8,000 金币 + 60 活动币', '第 11-100 名：2,000 金币 + 20 活动币'],
    roster: [
      { label: '已报名', value: '1,122' },
      { label: '在线中', value: '846' },
      { label: '候补中', value: '138' },
      { label: '已淘汰', value: '92' },
    ],
  },
  {
    id: 'jackpot-cup',
    title: 'Jackpot 争夺赛',
    subtitle: 'Progressive Slot',
    prize: '￥ 28,000',
    entryFee: '1,500 金币',
    progress: 62,
    capacity: '932 / 1,500',
    settlement: '21:40 统一结算',
    summary: '触发 Jackpot 可获得额外积分乘区。',
    rules: ['单局最高积分按净赢金币分段计算。', '若积分相同，按完成局数少者优先。', '活动票可抵扣 10% 报名费。'],
    rewards: ['第 1 名：28,000 金币 + 120 活动币', '第 2-20 名：3,000 金币 + 36 活动币', '参与奖：300 金币 + 6 活动币'],
    roster: [
      { label: '已报名', value: '932' },
      { label: '在线中', value: '664' },
      { label: '候补中', value: '120' },
      { label: '已淘汰', value: '58' },
    ],
  },
  {
    id: 'casual-cup',
    title: '休闲积分挑战',
    subtitle: '捕鱼 + 消除',
    prize: '￥ 12,000',
    entryFee: '800 金币',
    progress: 61,
    capacity: '488 / 800',
    settlement: '20:30 统一结算',
    summary: '休闲专区指定游戏局数统计有效。',
    rules: ['每局胜利 +3 分，失败 +1 分。', '连胜可获得额外乘区。', '检测异常脚本将直接取消资格。'],
    rewards: ['第 1 名：12,000 金币 + 80 活动币', '第 2-30 名：1,200 金币 + 18 活动币', '参与奖：150 金币 + 3 活动币'],
    roster: [
      { label: '已报名', value: '488' },
      { label: '在线中', value: '352' },
      { label: '候补中', value: '84' },
      { label: '已淘汰', value: '26' },
    ],
  },
];

export const globalRules = [
  '所有赛事均使用金币报名，活动币仅用于活动商店兑换。',
  '同一账号每日最多报名 3 场赛事。',
  '网络中断超过 3 分钟按最后有效局结算。',
  '赛果以服务器记录为准，最终解释权归赛事中心。',
];

export const arenaPopulation = [
  { label: '当前在线参赛', value: '1,862', ratio: 93 },
  { label: '已报名待开赛', value: '342', ratio: 42 },
  { label: '候补队列', value: '118', ratio: 28 },
  { label: '风控裁判席位', value: '24', ratio: 12 },
];

export const eventCards = [
  { id: 'checkin', title: '七日签到', desc: '连续签到领金币和 Free Spin', sprite: 'calendar', detail: 'checkin' },
  { id: 'wheel', title: '幸运转盘', desc: '每日 3 次免费机会', sprite: 'bolt', detail: 'wheel' },
  { id: 'mission', title: '任务中心', desc: '完成任务累计活动币', sprite: 'mission', detail: 'missionCenter' },
  { id: 'invite', title: '邀请俱乐部', desc: '拉新返利和团队奖励', sprite: 'gift', detail: 'inviteClub' },
];

export const missionSeed = [
  { id: 'm1', title: '累计旋转 100 次', progress: 68, total: 100, coinReward: 300, tokenReward: 4 },
  { id: 'm2', title: '完成 5 局休闲游戏', progress: 3, total: 5, coinReward: 200, tokenReward: 6 },
  { id: 'm3', title: '触发 1 次 Free Spin', progress: 1, total: 1, coinReward: 500, tokenReward: 8 },
  { id: 'm4', title: '分享一次中奖记录', progress: 0, total: 1, coinReward: 120, tokenReward: 3 },
];

export const coinPacks = [
  { id: 'p1', coin: '6,000', bonus: '+8%', price: '￥6', tag: '首充', tokenBonus: 2 },
  { id: 'p2', coin: '30,000', bonus: '+18%', price: '￥30', tag: '热门', tokenBonus: 10 },
  { id: 'p3', coin: '68,000', bonus: '+28%', price: '￥68', tag: '超值', tokenBonus: 25 },
  { id: 'p4', coin: '128,000', bonus: '+40%', price: '￥128', tag: '推荐', tokenBonus: 50 },
];

export const packBenefits = [
  '支持主大厅、赛事、活动商店统一消耗。',
  '购买礼包可同步获得活动币，可用于换票和限定外观。',
  '热门礼包默认附带赛事报名券折扣资格。',
];

export const profileRecords = [
  { id: 'r1', game: 'Golden Pharaoh', type: 'Slots', coin: 12600, token: 6, time: '今天 20:18' },
  { id: 'r2', game: 'Fish Hunter', type: '休闲', coin: -1200, token: 1, time: '今天 18:52' },
  { id: 'r3', game: 'Ocean 777', type: 'Slots', coin: 8800, token: 4, time: '今天 16:10' },
  { id: 'r4', game: 'Bubble Pop', type: '休闲', coin: 900, token: 2, time: '今天 14:36' },
  { id: 'r5', game: 'Wild West Deluxe', type: 'Slots', coin: -3600, token: 0, time: '今天 12:28' },
];

export const securityStatus = [
  { label: '手机号绑定', value: '138****6651', status: '已完成' },
  { label: '登录保护', value: '设备验证已开启', status: '已开启' },
  { label: '支付密码', value: '已设置，7 天前更新', status: '正常' },
  { label: '异常登录检测', value: '近 30 天无风险', status: '安全' },
];

export const devices = [
  { name: 'iPhone 15 Pro', meta: '上海 · 今天 20:26', status: '当前设备' },
  { name: 'Chrome / Windows', meta: '上海 · 今天 18:03', status: '已验证' },
  { name: 'iPad Mini', meta: '杭州 · 3 天前', status: '低风险' },
];

export const inviteTiers = [
  { title: '邀请 1 人', reward: '300 金币 + 6 活动币' },
  { title: '邀请 5 人', reward: '2,000 金币 + 30 活动币' },
  { title: '邀请 20 人', reward: '专属称号 + 120 活动币' },
];

export const walletBreakdown = [
  { label: 'Slots 消耗', value: 64 },
  { label: '休闲房消耗', value: 22 },
  { label: '赛事报名', value: 10 },
  { label: '其他功能', value: 4 },
];

export const benefitTimeline = [
  { time: '10:00', title: '签到窗口重置', desc: '第 1 次签到与签到补领开放。' },
  { time: '18:00', title: '幸运转盘刷新', desc: '每日免费 3 次机会重置。' },
  { time: '21:30', title: '大奖时段', desc: 'Golden Pharaoh 进入双倍奖池时间。' },
];
