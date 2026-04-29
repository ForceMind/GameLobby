export const user = {
  uid: '98271631',
  nickname: 'NovaPlayer',
  avatar: '',
  level: 28,
  xp: 12650,
  nextXp: 20000,
  vip: 'GOLD',
};

export const wallet = {
  coins: 228680,
  eventCoins: 420,
  bonusBalance: 4680,
};

export const vip = {
  active: true,
  currentLevel: 'GOLD',
  growth: 2680,
  nextGrowth: 5000,
  dailyGrowth: 120,
  decayPerDay: 80,
  expiresIn: '18d 04h',
  levels: [
    { level: 'SILVER', needGrowth: 1000, dailyReward: { coins: 1000 }, status: 'claimed', benefits: ['Daily coins', 'Event coin task +1'] },
    { level: 'GOLD', needGrowth: 2500, dailyReward: { coins: 3000, eventCoins: 20 }, status: 'available', benefits: ['Daily coins', 'VIP tournament rooms', 'Faster feedback queue'] },
    { level: 'PLATINUM', needGrowth: 5000, dailyReward: { coins: 6000, eventCoins: 50 }, status: 'locked', benefits: ['Higher daily reward', 'Exclusive activity tasks', 'Growth protection'] },
  ],
  rules: [
    'Active membership grants daily growth.',
    'When membership expires, growth decreases by decayPerDay each server day.',
    'A VIP level can claim its configured reward once per day.',
  ],
};

export const jackpot = {
  total: 88888,
  seed: 50000,
  trigger: 'Any Slot jackpot symbol combination',
  latestWinners: [
    { name: 'ReelMaster', amount: 128800, game: '777 Deluxe' },
    { name: 'LuckyBean', amount: 106420, game: 'Pharaoh' },
    { name: 'FishHero', amount: 87500, game: 'Fish Hunter' },
  ],
};

export const hero = {
  label: 'NEW',
  title: 'CYBERPUNK CITY',
  subtitle: 'Enter the cyber world',
  cta: 'Play Now',
  image: 'https://games-web.coconut.tv/icon/cyberpunk.png',
};

export const games = [
  {
    id: 1026,
    name: 'Fish Hunter',
    category: 'Casual',
    label: 'HOT',
    players: 2100,
    heat: 98,
    icon: 'https://games-web.coconut.tv/icon/fish.png',
    url: '',
    rtp: '97.1%',
    volatility: 'Medium',
    minBet: 100,
    maxBet: 10000,
    tags: ['Casual', 'Arcade', 'Team Bonus'],
    features: ['Boss fish bonus', 'Room jackpot', 'Auto cannon'],
    rules: ['Choose cannon power before firing.', 'Rewards are settled in coins.', 'Event points count during active events.'],
  },
  {
    id: 1024,
    name: '777 Deluxe',
    category: 'Slots',
    label: 'NEW',
    players: 1800,
    heat: 96,
    icon: 'https://games-web.coconut.tv/icon/777.png',
    url: '',
    rtp: '96.8%',
    volatility: 'High',
    minBet: 50,
    maxBet: 50000,
    tags: ['Slots', 'Jackpot', 'Free Spin'],
    features: ['Free spins', 'Wild reels', 'Progressive jackpot'],
    rules: ['Spin any line to score tournament points.', 'Bonus rounds use the same coin balance.', 'Disconnected rounds can be restored by game id.'],
  },
  { id: 1010, name: 'Pharaoh', category: 'Slots', label: '', players: 1400, heat: 92, icon: 'https://games-web.coconut.tv/icon/pharaoh.png', url: '', rtp: '96.2%', volatility: 'Medium', minBet: 80, maxBet: 30000, tags: ['Slots', 'Ancient'], features: ['Mystery symbols', 'Golden scatter'], rules: ['Line wins pay left to right.', 'Scatter unlocks bonus chamber.'] },
  { id: 1013, name: 'Pirates', category: 'Slots', label: '', players: 1100, heat: 90, icon: 'https://games-web.coconut.tv/icon/pirate.png', url: '', rtp: '96.5%', volatility: 'High', minBet: 100, maxBet: 40000, tags: ['Slots', 'Adventure'], features: ['Treasure bonus', 'Expanding wild'], rules: ['Collect maps to enter treasure mode.', 'Top wins count for jackpot board.'] },
  { id: 1011, name: 'Buffalo', category: 'Slots', label: '', players: 1200, heat: 88, icon: 'https://games-web.coconut.tv/icon/buffalo.png', url: '', rtp: '95.9%', volatility: 'Medium', minBet: 50, maxBet: 30000, tags: ['Slots', 'Classic'], features: ['Stacked wilds', 'Herd multiplier'], rules: ['Multiplier resets after bonus ends.', 'All wins settle in coins.'] },
  { id: 1017, name: 'Fury of Zeus', category: 'Slots', label: '', players: 1000, heat: 86, icon: 'https://games-web.coconut.tv/icon/zeus.png', url: '', rtp: '96.7%', volatility: 'High', minBet: 100, maxBet: 50000, tags: ['Slots', 'Myth'], features: ['Lightning wilds', 'God mode'], rules: ['Lightning symbols trigger respins.', 'Tournament score uses net win.'] },
  { id: 1028, name: 'Dice Merge', category: 'Casual', label: '', players: 858, heat: 82, icon: 'https://games-web.coconut.tv/icon/dice.png', url: '', rtp: 'Skill', volatility: 'Low', minBet: 20, maxBet: 5000, tags: ['Casual', 'Puzzle'], features: ['Combo chain', 'Daily challenge'], rules: ['Merge dice to complete targets.', 'Combos grant event points.'] },
  { id: 1031, name: 'Space Heist', category: 'Slots', label: '', players: 982, heat: 84, icon: 'https://games-web.coconut.tv/icon/space.png', url: '', rtp: '96.4%', volatility: 'High', minBet: 100, maxBet: 60000, tags: ['Slots', 'Sci-Fi'], features: ['Heist meter', 'Vault jackpot'], rules: ['Fill the meter to open vault mode.', 'Vault rewards settle in coins.'] },
];

export const tournaments = [
  {
    id: 'mega-ways',
    title: 'MEGA WAYS TOURNAMENT',
    tag: 'MEGA',
    featured: true,
    status: 'ongoing',
    prizePool: 88888,
    players: 1228,
    capacity: 2000,
    endsIn: '02:45:16',
    rank: 12,
    image: 'https://games-web.coconut.tv/icon/slots.png',
    rules: ['Eligible games: all Slot games.', 'Score: 1 point per 100 net coins won.', 'Top 100 receive rewards after audit.'],
    roster: { active: 1228, waiting: 212, eliminated: 84, staff: 12 },
    allowedGames: ['777 Deluxe', 'Pharaoh', 'Pirates', 'Fury of Zeus'],
    rewardTiers: [
      { rank: '1', reward: '30,000 Coins + 300 Event Coins' },
      { rank: '2-10', reward: '10,000 Coins' },
      { rank: '11-100', reward: '2,000 Coins' },
    ],
    schedule: { start: '2026-04-28 10:00', end: '2026-04-28 22:00', payout: 'Within 24h' },
  },
  { id: 'fish-cup', title: 'FISH HUNTER CUP', tag: 'HOT', status: 'ongoing', prizePool: 30000, players: 856, capacity: 1500, endsIn: '01:15:30', image: 'https://games-web.coconut.tv/icon/fish.png', allowedGames: ['Fish Hunter'], rules: ['Score by net coins won in Fish Hunter.', 'Boss fish grants bonus points.'], roster: { active: 856, waiting: 88, eliminated: 31, staff: 6 }, rewardTiers: [{ rank: '1-20', reward: '5,000 Coins' }, { rank: '21-100', reward: '1,000 Coins' }] },
  { id: '777-cup', title: '777 DELUXE TOURNAMENT', tag: 'EASY', status: 'ongoing', prizePool: 10000, players: 642, capacity: 1000, endsIn: '03:15:30', image: 'https://games-web.coconut.tv/icon/777.png', allowedGames: ['777 Deluxe'], rules: ['Every 100 coins net win equals 1 point.', 'Free spin wins count.'], roster: { active: 642, waiting: 40, eliminated: 12, staff: 5 }, rewardTiers: [{ rank: '1-50', reward: '2,000 Coins' }] },
  { id: 'zeus-cup', title: 'ZEUS CHALLENGE', tag: 'NORMAL', status: 'ongoing', prizePool: 25000, players: 1102, capacity: 1800, endsIn: '05:15:30', image: 'https://games-web.coconut.tv/icon/zeus.png', allowedGames: ['Fury of Zeus'], rules: ['Lightning bonus doubles points.', 'Minimum 20 spins required.'], roster: { active: 1102, waiting: 95, eliminated: 48, staff: 8 }, rewardTiers: [{ rank: '1-10', reward: '8,000 Coins' }, { rank: '11-80', reward: '1,500 Coins' }] },
  { id: 'pirates-bounty', title: 'PIRATES BOUNTY', tag: 'ROOKIE', status: 'ongoing', prizePool: 5000, players: 523, capacity: 800, endsIn: '07:15:30', image: 'https://games-web.coconut.tv/icon/pirate.png', allowedGames: ['Pirates'], rules: ['Rookie-only event.', 'Treasure bonus grants 50 extra points.'], roster: { active: 523, waiting: 22, eliminated: 9, staff: 4 }, rewardTiers: [{ rank: '1-30', reward: '800 Coins' }] },
  { id: 'night-spins', title: 'NIGHT SPINS OPEN', tag: 'UPCOMING', status: 'upcoming', prizePool: 18000, players: 0, capacity: 1200, startsIn: '09:30:00', image: 'https://games-web.coconut.tv/icon/space.png', allowedGames: ['Space Heist', '777 Deluxe'], rules: ['Registration opens before start.', 'Only Slot games count after the timer starts.'], roster: { active: 0, waiting: 318, eliminated: 0, staff: 5 }, rewardTiers: [{ rank: '1-30', reward: '3,000 Coins' }], schedule: { start: '2026-04-29 21:00', end: '2026-04-29 23:00', payout: 'Within 24h' } },
  { id: 'casual-week', title: 'CASUAL WEEKLY QUALIFIER', tag: 'SOON', status: 'upcoming', prizePool: 12000, players: 0, capacity: 900, startsIn: '1d 04h', image: 'https://games-web.coconut.tv/icon/dice.png', allowedGames: ['Fish Hunter', 'Dice Merge'], rules: ['Casual games only.', 'Mission points are counted after event start.'], roster: { active: 0, waiting: 146, eliminated: 0, staff: 4 }, rewardTiers: [{ rank: '1-50', reward: '1,500 Coins + 20 Event Coins' }], schedule: { start: '2026-04-30 12:00', end: '2026-05-02 12:00', payout: 'Within 24h' } },
];

export const events = [
  {
    id: 'summer-splash',
    type: 'LIMITED TIME',
    title: 'SUMMER SPLASH',
    desc: 'Complete missions and earn points to win milestone rewards.',
    progress: 12680,
    target: 25000,
    rank: 12,
    pointsLabel: 'Event Points',
    reward: 'Grand Chest',
    icon: 'Splash',
    endsIn: '06d 14h 25m',
    featured: true,
    missions: [
      { id: 'slot-30', title: 'Play 30 Slot rounds', progress: 18, target: 30, points: 1200, reward: '2,000 Coins' },
      { id: 'casual-3', title: 'Win 3 Casual matches', progress: 1, target: 3, points: 900, reward: '20 Event Coins' },
      { id: 'join-1', title: 'Join 1 tournament', progress: 1, target: 1, points: 600, reward: 'Lucky Wheel Ticket' },
    ],
    milestones: [
      { points: 3000, reward: 'Coins x1,000', claimed: true },
      { points: 8000, reward: 'Event Coins x20', claimed: true },
      { points: 15000, reward: 'Blue Chest', claimed: false },
      { points: 25000, reward: 'Gold Chest', claimed: false },
    ],
    leaderboard: [
      { name: 'CocoAce', points: 18800 },
      { name: 'ReelMaster', points: 16640 },
      { name: 'NovaPlayer', points: 12680, current: true },
      { name: 'FishHero', points: 11240 },
    ],
    rankRewards: [
      { rank: '1', reward: '50,000 Coins + Gold Chest' },
      { rank: '2-10', reward: '20,000 Coins + 200 Event Coins' },
      { rank: '11-50', reward: '8,000 Coins' },
    ],
    rules: ['Event points come from Slots, Casual games, and tournament missions.', 'Milestone rewards can be claimed once.', 'Unclaimed rewards expire when the event ends.'],
  },
  { id: 'weekend-boost', type: 'WEEKLY', title: 'WEEKEND BOOST', desc: 'Earn more points this weekend!', progress: 6200, target: 10000, rank: 46, reward: '5,000 Coins', icon: 'Rocket', endsIn: '2d 14h', missions: [{ id: 'round-50', title: 'Play 50 rounds', progress: 31, target: 50, points: 800, reward: '5,000 Coins' }], milestones: [{ points: 10000, reward: '5,000 Coins', claimed: false }], leaderboard: [{ name: 'LuckyBean', points: 9800 }, { name: 'NovaPlayer', points: 6200, current: true }], rankRewards: [{ rank: '1-20', reward: '8,000 Coins' }, { rank: '21-100', reward: '2,000 Coins' }], rules: ['Applies to all game categories.', 'Reward is paid in coins.'] },
  { id: 'daily-spin', type: 'DAILY', title: 'DAILY SPIN', desc: 'Spin every day to win bonus coins and items.', progress: 1, target: 1, rank: 1, reward: 'COMPLETED', icon: 'Wheel', endsIn: '14h 25m', completed: true, missions: [{ id: 'spin-1', title: 'Spin once today', progress: 1, target: 1, points: 100, reward: 'Wheel Ticket' }], milestones: [{ points: 1, reward: 'Wheel Ticket', claimed: true }], leaderboard: [{ name: 'NovaPlayer', points: 1, current: true }], rankRewards: [{ rank: 'All completed', reward: 'Wheel Ticket' }], rules: ['Resets daily at 00:00 server time.'] },
  { id: 'slot-master', type: 'CHALLENGE', title: 'SLOT MASTER', desc: 'Play slots and reach the target to win big!', progress: 35, target: 100, rank: 68, reward: '50 Event Coins', icon: 'Slot', endsIn: '4d 14h', missions: [{ id: 'slot-100', title: 'Complete 100 Slot spins', progress: 35, target: 100, points: 1500, reward: '50 Event Coins' }], milestones: [{ points: 100, reward: '50 Event Coins', claimed: false }], leaderboard: [{ name: 'SpinKing', points: 92 }, { name: 'NovaPlayer', points: 35, current: true }], rankRewards: [{ rank: '1-50', reward: '100 Event Coins' }, { rank: '51-200', reward: '30 Event Coins' }], rules: ['Only Slot rounds count.', 'Auto-spin rounds are valid.'] },
  { id: 'new-game', type: 'SPECIAL', title: 'NEW GAME LAUNCH', desc: 'Try new games and get exclusive rewards!', progress: 2, target: 5, rank: 104, reward: 'Gift Box', icon: 'Game', endsIn: '07d 14h', missions: [{ id: 'try-5', title: 'Try 5 different games', progress: 2, target: 5, points: 500, reward: 'Gift Box' }], milestones: [{ points: 5, reward: 'Gift Box', claimed: false }], leaderboard: [{ name: 'PalmWin', points: 5 }, { name: 'NovaPlayer', points: 2, current: true }], rankRewards: [{ rank: 'All completed', reward: 'Gift Box' }], rules: ['Only first launch per game counts.'] },
];

export const shop = {
  coins: [
    { id: 'c1', title: 'Starter Coins', coins: 30000, bonus: '+10%', price: '$1.99', desc: 'Entry coin pack for casual sessions.', includes: ['30,000 Coins', '10% bonus'] },
    { id: 'c2', title: 'Treasure Coins', coins: 80000, bonus: '+20%', price: '$4.99', desc: 'Balanced pack for tournament practice.', includes: ['80,000 Coins', '20% bonus'] },
    { id: 'c3', title: 'Vault Coins', coins: 200000, bonus: '+30%', price: '$9.99', best: true, desc: 'Best value pack for Slots.', includes: ['200,000 Coins', '30% bonus'] },
    { id: 'c4', title: 'Whale Cart', coins: 500000, bonus: '+50%', price: '$19.99', desc: 'Large pack for high roller play.', includes: ['500,000 Coins', '50% bonus'] },
  ],
  items: [
    { id: 'i1', title: 'Daily Spin', qty: 'x1', cost: 20, icon: 'Wheel', desc: 'Grants one extra daily wheel spin.', includes: ['Wheel Ticket x1'] },
    { id: 'i2', title: 'Lucky Wheel', qty: 'x1', cost: 30, icon: 'Wheel', desc: 'Spin the lucky wheel for coin rewards.', includes: ['Lucky Wheel Ticket x1'] },
    { id: 'i3', title: 'Mega Spin', qty: 'x1', cost: 50, icon: 'Boost', desc: 'Higher reward wheel ticket.', includes: ['Mega Spin Ticket x1'] },
    { id: 'i4', title: 'Coin Boost (1h)', qty: 'x1', cost: 25, icon: 'Boost', desc: 'Adds 10% more coin rewards for one hour.', includes: ['Coin Boost x1'] },
  ],
  deals: [
    { id: 'd1', title: 'Starter Pack', coins: 120000, eventCoins: 300, price: '$4.99', tag: 'HOT', desc: 'Starter bundle for new players.', includes: ['120,000 Coins', '300 Event Coins'] },
    { id: 'd2', title: 'Pro Pack', coins: 300000, eventCoins: 800, price: '$9.99', tag: 'POPULAR', desc: 'Balanced bundle for active players.', includes: ['300,000 Coins', '800 Event Coins'] },
    { id: 'd3', title: 'Legend Pack', coins: 1000000, eventCoins: 2500, price: '$19.99', tag: 'BEST VALUE', desc: 'Largest bundle for tournaments.', includes: ['1,000,000 Coins', '2,500 Event Coins'] },
  ],
};

export const dailyRewards = [
  { day: 'DAY 1', label: 'Collected', amount: 'OK', coins: 500, collected: true },
  { day: 'DAY 2', label: '1,000', amount: '1,000', coins: 1000 },
  { day: 'DAY 3', label: '2,000', amount: '2,000', coins: 2000 },
  { day: 'DAY 4', label: '3,000', amount: '3,000', coins: 3000 },
  { day: 'DAY 5', label: '5,000', amount: '5,000', coins: 5000 },
  { day: 'DAY 6', label: '8,000', amount: '8,000', coins: 8000 },
  { day: 'DAY 7', label: '10,000', amount: '10,000', coins: 10000, eventCoins: 20, premium: true },
];

export const wheel = {
  title: 'Lucky Wheel',
  freeSpins: 1,
  resetIn: '14h 25m',
  segments: [
    { label: '500 Coins', coins: 500, chance: '32%' },
    { label: '1,000 Coins', coins: 1000, chance: '24%' },
    { label: '20 Event Coins', eventCoins: 20, chance: '16%' },
    { label: 'Mega Spin', item: 'Mega Spin', chance: '8%' },
    { label: '10,000 Coins', coins: 10000, chance: '2%' },
  ],
};

export const leaderboard = [
  { name: 'ReelMaster', score: 128800 },
  { name: 'LuckyBean', score: 106420 },
  { name: 'SpinKing', score: 98880 },
  { name: 'FishHero', score: 87500 },
  { name: 'CocoAce', score: 81240 },
  { name: 'SlotFox', score: 76600 },
  { name: 'PalmWin', score: 72880 },
  { name: 'BlueWhale', score: 68420 },
  { name: 'JackpotMia', score: 65110 },
  { name: 'LuckyRay', score: 60480 },
];

export const profile = {
  totalSpins: 12480,
  biggestWin: 88800,
  winStreak: 9,
  bonusBalance: 4680,
  achievements: [
    { title: 'Slot Master', desc: 'Spin 1,000 times', value: 820, total: 1000, reward: '5,000 Coins' },
    { title: 'Jackpot Hunter', desc: 'Win 20 Jackpots', value: 12, total: 20, reward: '50 Event Coins' },
    { title: 'High Roller', desc: 'Bet a total of 1M coins', value: 650000, total: 1000000, reward: '10,000 Coins' },
  ],
  transactions: [
    { id: 'tx1', title: 'Daily reward', amount: '+1,000 Coins', time: 'Today 09:30' },
    { id: 'tx2', title: 'Wheel item purchase', amount: '-20 Event Coins', time: 'Yesterday 18:12' },
    { id: 'tx3', title: 'Tournament reward', amount: '+5,000 Coins', time: '2026-04-27 21:00' },
  ],
  gifts: [
    { id: 'g1', title: 'Welcome Gift', status: 'Claimed', reward: '1,000 Coins' },
    { id: 'g2', title: 'Weekend Gift', status: 'Available', reward: '20 Event Coins' },
  ],
  messages: [
    { id: 'm1', title: 'Tournament payout completed', text: 'Mega Ways rewards have been sent.' },
    { id: 'm2', title: 'New event online', text: 'Summer Splash is now available.' },
  ],
  security: [
    { title: 'Login protection', status: 'Enabled' },
    { title: 'Payment password', status: 'Not set' },
  ],
  support: [
    { title: 'Feedback center', status: 'Open' },
    { title: 'Response target', status: 'Within 24h' },
  ],
  feedbacks: [
    { id: 'fb1', title: 'Shop layout suggestion', content: 'Make mobile cards denser.', status: 'open', time: '2026-04-28 14:20' },
  ],
  settings: [
    { title: 'Language', value: 'English' },
    { title: 'Notifications', value: 'Enabled' },
  ],
  history: [
    { game: '777 Deluxe', result: '+8,200 Coins', time: 'Today 10:12' },
    { game: 'Fish Hunter', result: '+2,100 Coins', time: 'Today 09:48' },
    { game: 'Dice Merge', result: '-300 Coins', time: 'Yesterday 22:04' },
  ],
};

export const redeemCodes = [
  { code: 'COCO2026', active: true, maxUses: 999, used: 0, reward: { coins: 2026 }, desc: 'Launch gift code' },
  { code: 'VIPDAY', active: true, maxUses: 30, used: 0, reward: { coins: 5000, eventCoins: 50 }, desc: 'VIP day reward' },
  { code: 'SLOTMASTER', active: true, maxUses: 100, used: 0, reward: { eventCoins: 30 }, desc: 'Slot event item reward' },
];

export const configMeta = {
  dataFile: 'server/mockData.js',
  currencyFields: ['coins', 'eventCoins'],
  editableCollections: ['games', 'tournaments', 'events', 'shop', 'dailyRewards', 'wheel', 'profile', 'leaderboard', 'vip', 'redeemCodes'],
};

export function bootstrap() {
  return {
    user,
    wallet,
    jackpot,
    hero,
    games,
    tournaments,
    events,
    shop,
    vip,
    profile,
    dailyRewards,
    wheel,
    leaderboard,
    redeemCodes,
    configMeta,
  };
}
