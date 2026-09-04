// Static prototype content. Keep this module free of UI/runtime dependencies so it
// can be reused by every route in the Pages build.

// Dynamic values should be loaded through this seam; bundled pages provide the
// JSON fallback while production can replace it with the API response.
export const contentApi = {
  async get(path, fallback) {
    if (typeof window === 'undefined' || !window.fetch) return fallback
    try {
      const response = await window.fetch(path, { headers: { Accept: 'application/json' } })
      if (!response.ok) return fallback
      return await response.json()
    } catch { return fallback }
  },
  async post(path, payload, fallback = null) {
    if (typeof window === 'undefined' || !window.fetch) return fallback
    try {
      const response = await window.fetch(path, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) return fallback
      return await response.json()
    } catch { return fallback }
  },
}

export const navItems = [
  { id: 'lobby', label: 'nav.lobby', icon: 'home', href: 'lobby.html' },
  { id: 'games', label: 'nav.games', icon: 'gamepad', href: 'games.html' },
  {
    id: 'events',
    label: 'nav.events',
    icon: 'gift',
    href: 'events.html',
    badge: true,
  },
  { id: 'store', label: 'nav.store', icon: 'store', href: 'store.html' },
  { id: 'profile', label: 'nav.profile', icon: 'user', href: 'profile.html' },
]

export const balances = {
  coins: 52860,
  gems: 84,
  coinsLabel: '52,860',
  gemsLabel: '84',
}

export const gameCategories = [
  { id: 'all', label: 'games.categoryAll' },
  { id: 'slots', label: 'games.tagSlots' },
  { id: 'casual', label: 'games.tagCasual' },
  { id: 'realtime', label: 'games.tagLive' },
]

export const games = [
  {
    id: 'golden-pharaoh',
    name: 'Golden Pharaoh',
    category: 'slots realtime',
    tags: ['slots', 'realtime'],
    popular: true,
    categoryLabel: 'Slots · 实时',
    players: '2,481',
    heat: 96,
    badges: ['JACKPOT', 'HEAT'],
    status: 'ready',
    cover: 'golden-pharaoh-v2.png',
  },
  {
    id: 'ocean-777',
    name: 'Ocean 777',
    category: 'slots',
    tags: ['slots'],
    popular: false,
    categoryLabel: 'Slots',
    players: '—',
    heat: 0,
    badges: ['HOT'],
    status: 'maintenance',
    cover: 'ocean-777-v2.png',
  },
  {
    id: 'fruit-party',
    name: 'Fruit Party',
    category: 'slots',
    tags: ['slots'],
    popular: true,
    categoryLabel: 'Slots',
    players: '1,905',
    heat: 91,
    badges: ['TREND', 'HEAT'],
    status: 'ready',
    cover: 'fruit-party-v2.png',
  },
  {
    id: 'wild-west-deluxe',
    name: 'Wild West Deluxe',
    category: 'slots',
    tags: ['slots'],
    popular: false,
    categoryLabel: 'Slots',
    players: '—',
    heat: 0,
    badges: ['NEW'],
    status: 'upcoming',
    cover: 'wild-west-deluxe-v2.png',
  },
  {
    id: 'fish-hunter',
    name: 'Fish Hunter',
    category: 'casual realtime',
    tags: ['casual', 'realtime'],
    popular: true,
    categoryLabel: '休闲 · 实时',
    players: '842',
    heat: 84,
    badges: ['LIVE', 'HEAT'],
    status: 'ready',
    cover: 'fish-hunter-v2.png',
  },
  {
    id: 'bubble-pop',
    name: 'Bubble Pop',
    category: 'casual',
    tags: ['casual'],
    popular: true,
    categoryLabel: '休闲',
    players: '765',
    heat: 81,
    badges: ['HOT', 'HEAT'],
    status: 'ready',
    cover: 'bubble-pop-v2.png',
  },
  {
    id: 'dice-merge',
    name: 'Dice Merge',
    category: 'casual',
    tags: ['casual'],
    popular: false,
    categoryLabel: '休闲',
    players: '532',
    heat: 77,
    badges: ['NEW', 'HEAT'],
    status: 'ready',
    cover: 'dice-merge-v2.png',
  },
  {
    id: 'mini-golf-rush',
    name: 'Mini Golf Rush',
    category: 'casual',
    tags: ['casual'],
    popular: false,
    categoryLabel: '休闲',
    players: '—',
    heat: 0,
    badges: ['FUN'],
    status: 'unavailable',
    cover: 'mini-golf-rush-v2.png',
  },
]

// Shared prototype feed for live-room entry points. Keep fields close to the
// eventual API shape so the Games page, game details and banner can reuse it.
export const liveRooms = [
  {
    id: 'room-golden-042',
    gameId: 'golden-pharaoh',
    roomType: 'family',
    title: '黄金家族 · 今晚冲榜',
    host: 'NovaRay',
    viewers: 1284,
    seats: { occupied: 8, total: 13 },
    gameStatus: 'live',
    status: 'live',
    tags: ['家族厅', '冲榜中'],
    cover: 'golden-pharaoh-v2.png',
  },
  {
    id: 'room-fruit-118',
    gameId: 'fruit-party',
    roomType: 'party',
    title: '水果派对 · 13 人开黑',
    host: 'MintCat',
    viewers: 916,
    seats: { occupied: 11, total: 13 },
    gameStatus: 'live',
    status: 'live',
    tags: ['派对房', '麦位 2 空'],
    cover: 'fruit-party-v2.png',
  },
  {
    id: 'room-fish-307',
    gameId: 'fish-hunter',
    roomType: 'solo',
    title: '深海挑战 · 一起捕鱼',
    host: 'BlueFin',
    viewers: 642,
    seats: { occupied: 1, total: 1 },
    gameStatus: 'live',
    status: 'live',
    tags: ['单人游戏房', '实时'],
    cover: 'fish-hunter-v2.png',
  },
  {
    id: 'room-bubble-509',
    gameId: 'bubble-pop',
    roomType: 'party',
    title: '泡泡欢乐局 · 等你上麦',
    host: 'CloudNine',
    viewers: 388,
    seats: { occupied: 13, total: 13 },
    gameStatus: 'live',
    status: 'restricted',
    restriction: '麦位已满',
    tags: ['派对房', '麦位已满'],
    cover: 'bubble-pop-v2.png',
  },
  {
    id: 'room-ocean-611',
    gameId: 'ocean-777',
    roomType: 'solo',
    title: '海底寻宝 · 房间维护中',
    host: 'OceanPilot',
    viewers: 0,
    seats: { occupied: 0, total: 1 },
    gameStatus: 'maintenance',
    status: 'maintenance',
    restriction: '游戏维护中',
    tags: ['单人游戏房', '维护中'],
    cover: 'ocean-777-v2.png',
  },
  {
    id: 'room-dice-204',
    gameId: 'dice-merge',
    roomType: 'solo',
    title: '骰子轻松局 · 刚刚结束',
    host: 'DiceMomo',
    viewers: 0,
    seats: { occupied: 1, total: 1 },
    gameStatus: 'ended',
    status: 'ended',
    restriction: '直播已结束',
    tags: ['单人游戏房', '已结束'],
    cover: 'dice-merge-v2.png',
  },
]

export const recentGames = [games[0], games[2], games[4]].map(
  (game, index) => ({
    ...game,
    recent: ['lobby.playedJustNow', 'lobby.playedSample1', 'lobby.playedSample2'][index],
  }),
)

export const banners = [
  {
    title: '幸运旋转狂欢季',
    subtitle: '今日免费机会，开启幸运好时光。',
    badge: '每日免费旋转',
    cta: '查看转盘',
    accent: 'orange',
  },
  {
    title: '经典老虎机周挑战',
    subtitle: '经典老虎机主题，随时开启轻松一局。',
    badge: '老虎机精选',
    cta: '浏览老虎机',
    accent: 'cyan',
  },
  {
    title: '休闲轻松局',
    subtitle: '短节奏游戏目录，随时浏览。',
    badge: '休闲精选',
    cta: '浏览休闲游戏',
    accent: 'green',
  },
]

export const tournaments = [
  {
    id: 'slot-rank',
    title: 'Slot 冲榜赛',
    mode: '经典三轴 · 最高有效分数',
    status: '报名中',
    prize: '500,000 金币',
    fee: '2,000 金币',
    registered: 186,
    capacity: 240,
    progress: 78,
    online: 92,
    waiting: 94,
    eliminated: 0,
    requirement: 'Lv.5 · 近 7 日完成 3 局 Slot',
    settlement: '今日 22:30 · 前 20 名分奖',
    icon: 'trophy',
  },
  {
    id: 'jackpot',
    title: 'Jackpot 争夺赛',
    mode: '五轴连线 · Jackpot 命中优先',
    status: '记录待补足',
    prize: '1,200,000 金币',
    fee: '8,000 金币',
    registered: 96,
    capacity: 128,
    progress: 75,
    online: 0,
    waiting: 96,
    eliminated: 0,
    requirement: 'Lv.10 · 近 7 日完成 10 局指定 Slot',
    settlement: '今日 23:15 · 前 10 名分奖',
    icon: 'jackpot',
  },
  {
    id: 'casual',
    title: '休闲积分挑战',
    mode: '多游戏累计 · 有效积分总和',
    status: '候补开放',
    prize: '80,000 金币',
    fee: '12 宝石',
    registered: 80,
    capacity: 80,
    progress: 100,
    online: 0,
    waiting: 80,
    waitlist: 7,
    eliminated: 0,
    requirement: 'Lv.3 · 完成任意 5 局休闲游戏',
    settlement: '明日 18:00 · 前 30 名分奖',
    icon: 'gamepad',
  },
]

// Rewards are numbers, not pre-joined sentences: the day label and the reward
// line are assembled per language at render time.
export const checkinDays = [
  { day: 'D1', coins: 800, gems: 0, state: 'claimed' },
  { day: 'D2', coins: 1200, gems: 0, state: 'missed' },
  { day: 'D3', coins: 2000, gems: 5, state: 'today' },
  { day: 'D4', coins: 2400, gems: 0, state: 'locked' },
  { day: 'D5', coins: 3000, gems: 0, state: 'locked' },
  { day: 'D6', coins: 3600, gems: 8, state: 'locked' },
  { day: 'D7', coins: 8800, gems: 20, state: 'locked', grand: true },
]

export const dailyMissions = [
  {
    id: 'spin-100',
    title: 'events.missionSpin100',
    current: 100,
    total: 100,
    status: 'events.statusDone',
    coinReward: 1500,
    gemReward: 3,
  },
  {
    id: 'casual-5',
    title: 'events.missionCasual5',
    current: 3,
    total: 5,
    status: 'events.statusActive',
    coinReward: 1000,
    gemReward: 2,
  },
  {
    id: 'free-spin',
    title: 'events.missionFreeSpin',
    current: 0,
    total: 1,
    status: 'events.statusNotStarted',
    coinReward: 2000,
    gemReward: 5,
  },
  {
    id: 'share-win',
    title: 'events.missionShareWin',
    current: 0,
    total: 1,
    status: 'events.statusExpired',
    coinReward: 500,
    gemReward: 1,
    expired: true,
  },
]

export const coinPacks = [
  {
    id: 'coin-6',
    coins: 6000,
    discountPercent: 8,
    tag: 'store.tagFirstBuy',
    gemBonus: 2,
  },
  {
    id: 'coin-30',
    coins: 30000,
    discountPercent: 18,
    tag: 'store.tagPopular',
    gemBonus: 10,
  },
  {
    id: 'coin-68',
    coins: 68000,
    discountPercent: 28,
    tag: 'store.tagRecommended',
    gemBonus: 25,
    recommended: true,
  },
  {
    id: 'coin-128',
    coins: 128000,
    discountPercent: 40,
    tag: 'store.tagValue',
    gemBonus: 50,
  },
]

export const profileStats = [
  { label: 'profile.statSpins', value: '12,480 次' },
  { label: '最高单次金币增加', value: '+88,800' },
  { label: 'profile.statStreak', value: '17 局' },
  { label: '本周金币净变化', value: '+12,640', positive: true },
]

export const achievements = [
  {
    id: 'hundred-spins',
    title: '百转达人',
    description: '累计完成 100 次旋转 · 称号“节奏玩家”',
    current: 100,
    total: 100,
    unlocked: true,
    icon: 'medal',
  },
  {
    id: 'jackpot-hunter',
    title: 'Jackpot 猎手',
    description: '累计命中 10 次 Jackpot · 奖励 30 宝石',
    current: 6,
    total: 10,
    icon: 'jackpot',
  },
  {
    id: 'casual-king',
    title: '休闲王者',
    description: '在 3 款休闲游戏进入周榜前 20 · 称号奖励',
    current: 2,
    total: 3,
    icon: 'trophy',
  },
]


export const profile = {
  name: 'NovaPlayer',
  id: 'JL-2048',
  level: 11,
  avatar: 'NP',
}

// Compatibility aliases for components migrated from the first prototype.
export const tabs = navItems
export const heroBanners = banners
export const missionSeed = dailyMissions
export const profileSecurity = [
  { label: '异常登录检测', value: '近 30 天无异常', status: '安全' },
]
