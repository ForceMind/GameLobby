import { useEffect, useMemo, useState } from 'react';
import {
  FaBell,
  FaBolt,
  FaCalendarAlt,
  FaCheck,
  FaChevronRight,
  FaClock,
  FaCoins,
  FaEnvelope,
  FaFilter,
  FaFire,
  FaGift,
  FaHeadset,
  FaHistory,
  FaHome,
  FaInfoCircle,
  FaMedal,
  FaPlay,
  FaShieldAlt,
  FaShoppingBag,
  FaTicketAlt,
  FaTimes,
  FaTrophy,
  FaUser,
  FaUsers,
  FaWallet,
} from 'react-icons/fa';
import './App.css';
import './styles/mobile.css';
import './styles/desktop.css';
import { httpClient, playerStore, socketClient, WS_EVENTS } from './server';

// UI labels are centralized here so later API-provided copy or extra locales
// can be added without touching every render branch.
const messages = {
  en: {
    lobby: 'Lobby',
    tournaments: 'Tournaments',
    events: 'Events',
    shop: 'Shop',
    me: 'Me',
    all: 'ALL',
    popular: 'Popular',
    slots: 'Slots',
    casual: 'Casual',
    fishing: 'Fishing',
    allGames: 'All Games',
    featured: 'FEATURED',
    coinsTab: 'COINS',
    vip: 'VIP',
    exchange: 'EXCHANGE',
    coins: 'Coins',
    eventCoins: 'Event Coins',
    notifications: 'Notifications',
    language: '\u4e2d\u6587',
    languageSetting: 'Language',
    english: 'English',
    chinese: 'Chinese',
    back: 'Back',
    jackpot: 'JACKPOT',
    jackpotDetail: 'Jackpot Detail',
    totalJackpot: 'Total Jackpot',
    popularGames: 'POPULAR GAMES',
    viewAll: 'View all',
    dailyBonus: 'Daily Bonus',
    luckyWheel: 'Lucky Wheel',
    dailyTasks: 'Daily Tasks',
    dailyRewards: 'DAILY REWARDS',
    dailyRewardsHint: 'Sign in daily to get free rewards',
    checkInRules: 'Check-in Rules',
    makeUpCheckIn: 'Make-up Check-in',
    makeUpCost: 'Spend coins to recover missed rewards.',
    claimed: 'Claimed',
    available: 'Available',
    winnerBoard: 'WINNER BOARD',
    fullRanking: 'Full Ranking',
    history: 'History',
    gameHistory: 'Game History',
    tournamentSubtitle: 'Compete and win huge rewards!',
    ongoing: 'ONGOING',
    upcoming: 'UPCOMING',
    filter: 'Filter',
    endsIn: 'Ends in',
    prizePool: 'Prize Pool',
    players: 'Players',
    capacity: 'Capacity',
    payout: 'Payout',
    yourRank: 'Your Rank',
    details: 'DETAILS',
    tournamentDetails: 'TOURNAMENT DETAILS',
    fullDetail: 'Full detail',
    rules: 'Rules',
    participants: 'Participants',
    active: 'Active',
    waiting: 'Waiting',
    eliminated: 'Eliminated',
    staff: 'Staff',
    rewardTiers: 'Reward Tiers',
    allowedGames: 'Allowed Games',
    joinTournament: 'Join Tournament',
    howToPlay: 'HOW TO PLAY',
    playSlots: 'Play any slots to earn points',
    climbLeaderboard: 'Climb the leaderboard',
    winRewards: 'Win amazing rewards!',
    eventsSubtitle: 'Join events and win big rewards!',
    allEvents: 'ALL EVENTS',
    limitedTime: 'LIMITED TIME',
    daily: 'DAILY',
    weekly: 'WEEKLY',
    viewDetails: 'VIEW DETAILS',
    eventFilter: 'Filter',
    yourPoints: 'Your Points',
    yourProgress: 'Your Progress',
    reward: 'Reward',
    leaderboard: 'LEADERBOARD',
    dontMiss: "Don't miss out!",
    eventCallout: 'Participate in events to earn points and climb the leaderboard!',
    shopSubtitle: 'Get coins, items and exclusive deals!',
    welcomePack: 'WELCOME PACK',
    specialOffer: 'A special offer for you!',
    items: 'ITEMS',
    deals: 'DEALS',
    value: 'VALUE',
    level: 'Level',
    totalSpins: 'Total Spins',
    biggestWin: 'Biggest Win',
    winStreak: 'Win Streak',
    wallet: 'Wallet',
    myGifts: 'My Gifts',
    messages: 'Messages',
    security: 'Security',
    support: 'Support',
    myAssets: 'My Assets',
    assetDetails: 'Asset Details',
    goldCoins: 'Gold Coins',
    ticketBonusBalance: 'Ticket Bonus Balance',
    bonusBalance: 'Bonus Balance',
    myProgress: 'My Progress',
    achievements: 'Achievements',
    settings: 'Settings',
    notificationsSetting: 'Notifications',
    vipMembership: 'VIP Membership',
    vipPurchased: 'Purchased',
    vipNotPurchased: 'Not Purchased',
    vipRules: 'VIP Rules',
    jackpotSlots: 'Jackpot Slots',
    packageList: 'Package List',
    profileDetail: 'Profile Detail',
    profileSecondaryPage: 'Profile secondary page',
    vipBenefits: 'VIP Benefits',
    currentLevel: 'Current Level',
    benefits: 'Benefits',
    assetSnapshot: 'Asset Snapshot',
    balanceSource: 'Balance source',
    assetSourceText: 'Balances are returned by the wallet API and can be overridden in local data config.',
    bonusSources: 'Bonus Sources',
    dailyBonusTicket: 'Daily Bonus Ticket',
    luckyWheelTicket: 'Lucky Wheel Ticket',
    eventMissionTicket: 'Event Mission Ticket',
    playNow: 'Play Now',
    moreGames: 'More Games',
    features: 'Features',
    gameRules: 'Game Rules',
    purchase: 'Purchase',
    moreProducts: 'More Products',
    missions: 'Missions',
    milestones: 'Milestones',
    claimAvailableReward: 'Claim Available Reward',
    currentLanguage: 'Current Language',
    enabled: 'Enabled',
    notSet: 'Not set',
    memberStatus: 'Member Status',
    vipRuleIntro: 'VIP membership unlocks extra rewards, priority support, and exclusive room access.',
    vipBenefitPriority: 'Priority support queue',
    vipBenefitEvent: 'Extra event coin missions',
    vipBenefitRoom: 'Exclusive tournament rooms',
    dailyRule1: 'Check in once per server day.',
    dailyRule2: 'Day 7 includes the highest weekly reward.',
    dailyRule3: 'Missed days can be recovered with a coin make-up.',
    makeUpNow: 'Make Up Now',
    recentWinners: 'Recent Winners',
    seed: 'Seed',
    allPackages: 'All Packages',
    coinsProducts: 'Coin Products',
    itemsProducts: 'Item Products',
    dealProducts: 'Deal Packages',
    activeFilter: 'Active Filter',
    noData: 'No data',
    exchangeHint: 'Event coins can be exchanged for coins after the wallet API is connected.',
    startsIn: 'Starts in',
    eventRank: 'Event Rank',
    eventFlow: 'Activity Flow',
    completeActivities: 'Complete tasks',
    earnEventPoints: 'Earn event points',
    settleRankRewards: 'Rank rewards after settlement',
    rankRewards: 'Rank Rewards',
    completeMission: 'Complete',
    redeemCode: 'Redeem Code',
    enterRedeemCode: 'Enter code',
    redeemNow: 'Redeem Now',
    redeemSuccess: 'Redeem success',
    feedback: 'Feedback',
    feedbackTitle: 'Title',
    feedbackContent: 'Content',
    submitFeedback: 'Submit Feedback',
    feedbackHistory: 'Feedback History',
    assetSummary: 'Asset Summary',
    transactionRecords: 'Transaction Records',
    vipGrowth: 'VIP Growth',
    dailyGrowth: 'Daily Growth',
    growthDecay: 'Expired Decay',
    expiresIn: 'Expires in',
    claimVipReward: 'Claim Reward',
    vipLevel: 'VIP Level',
    locked: 'Locked',
    claimedStatus: 'Claimed',
    availableStatus: 'Available',
    allAssets: 'All assets',
    gameReadyText: 'Launch URL is reserved for the real game server. Current build can open it once url is configured.',
  },
  zh: {
    lobby: '\u5927\u5385',
    tournaments: '\u8d5b\u4e8b',
    events: '\u6d3b\u52a8',
    shop: '\u5546\u57ce',
    me: '\u6211\u7684',
    all: '\u5168\u90e8',
    popular: '\u70ed\u95e8',
    slots: 'Slot',
    casual: '\u4f11\u95f2',
    fishing: '\u6355\u9c7c',
    allGames: '\u5168\u90e8\u6e38\u620f',
    featured: '\u7cbe\u9009',
    coinsTab: '\u91d1\u5e01',
    vip: 'VIP',
    exchange: '\u5151\u6362',
    coins: '\u91d1\u5e01',
    eventCoins: '\u6d3b\u52a8\u5e01',
    notifications: '\u901a\u77e5',
    language: 'EN',
    languageSetting: '\u8bed\u8a00',
    english: '\u82f1\u6587',
    chinese: '\u4e2d\u6587',
    back: '\u8fd4\u56de',
    jackpot: '\u5956\u6c60',
    jackpotDetail: '\u5956\u6c60\u8be6\u60c5',
    totalJackpot: '\u603b\u5956\u6c60',
    popularGames: '\u70ed\u95e8\u6e38\u620f',
    viewAll: '\u67e5\u770b\u5168\u90e8',
    dailyBonus: '\u6bcf\u65e5\u5956\u52b1',
    luckyWheel: '\u5e78\u8fd0\u8f6c\u76d8',
    dailyTasks: '\u6bcf\u65e5\u4efb\u52a1',
    dailyRewards: '\u6bcf\u65e5\u5956\u52b1',
    dailyRewardsHint: '\u6bcf\u65e5\u767b\u5f55\u9886\u53d6\u514d\u8d39\u5956\u52b1',
    checkInRules: '\u7b7e\u5230\u89c4\u5219',
    makeUpCheckIn: '\u8865\u7b7e',
    makeUpCost: '\u53ef\u82b1\u8d39\u91d1\u5e01\u8865\u9886\u9519\u8fc7\u7684\u5956\u52b1\u3002',
    claimed: '\u5df2\u9886\u53d6',
    available: '\u53ef\u9886\u53d6',
    winnerBoard: '\u8d62\u5bb6\u699c',
    fullRanking: '\u5b8c\u6574\u6392\u884c\u699c',
    history: '\u5386\u53f2',
    gameHistory: '\u6e38\u620f\u8bb0\u5f55',
    tournamentSubtitle: '\u53c2\u4e0e\u8d5b\u4e8b\uff0c\u8d62\u53d6\u5927\u5956\uff01',
    ongoing: '\u8fdb\u884c\u4e2d',
    upcoming: '\u5373\u5c06\u5f00\u59cb',
    filter: '\u7b5b\u9009',
    endsIn: '\u5269\u4f59',
    prizePool: '\u5956\u6c60',
    players: '\u4eba\u6570',
    capacity: '\u5bb9\u91cf',
    payout: '\u6d3e\u5956',
    yourRank: '\u6211\u7684\u6392\u540d',
    details: '\u8be6\u60c5',
    tournamentDetails: '\u8d5b\u4e8b\u8be6\u60c5',
    fullDetail: '\u5b8c\u6574\u8be6\u60c5',
    rules: '\u89c4\u5219',
    participants: '\u4eba\u5458\u60c5\u51b5',
    active: '\u53c2\u8d5b\u4e2d',
    waiting: '\u7b49\u5f85\u4e2d',
    eliminated: '\u5df2\u6dd8\u6c70',
    staff: '\u5de5\u4f5c\u4eba\u5458',
    rewardTiers: '\u5956\u52b1\u6863\u4f4d',
    allowedGames: '\u53ef\u53c2\u8d5b\u6e38\u620f',
    joinTournament: '\u52a0\u5165\u8d5b\u4e8b',
    howToPlay: '\u73a9\u6cd5\u8bf4\u660e',
    playSlots: '\u6e38\u73a9 Slot \u83b7\u5f97\u79ef\u5206',
    climbLeaderboard: '\u63d0\u5347\u6392\u884c\u699c\u540d\u6b21',
    winRewards: '\u8d62\u53d6\u5956\u52b1',
    eventsSubtitle: '\u53c2\u52a0\u6d3b\u52a8\uff0c\u8d62\u53d6\u4e30\u539a\u5956\u52b1\uff01',
    allEvents: '\u5168\u90e8\u6d3b\u52a8',
    limitedTime: '\u9650\u65f6',
    daily: '\u6bcf\u65e5',
    weekly: '\u6bcf\u5468',
    viewDetails: '\u67e5\u770b\u8be6\u60c5',
    eventFilter: '\u7b5b\u9009',
    yourPoints: '\u6211\u7684\u79ef\u5206',
    yourProgress: '\u6211\u7684\u8fdb\u5ea6',
    reward: '\u5956\u52b1',
    leaderboard: '\u6392\u884c\u699c',
    dontMiss: '\u4e0d\u8981\u9519\u8fc7\uff01',
    eventCallout: '\u53c2\u4e0e\u6d3b\u52a8\u83b7\u53d6\u79ef\u5206\uff0c\u51b2\u51fb\u6392\u884c\u699c\uff01',
    shopSubtitle: '\u83b7\u53d6\u91d1\u5e01\u3001\u9053\u5177\u548c\u4e13\u5c5e\u793c\u5305\uff01',
    welcomePack: '\u6b22\u8fce\u793c\u5305',
    specialOffer: '\u4e3a\u4f60\u51c6\u5907\u7684\u7279\u522b\u4f18\u60e0\uff01',
    items: '\u9053\u5177',
    deals: '\u793c\u5305',
    value: '\u4ef7\u503c',
    level: '\u7b49\u7ea7',
    totalSpins: '\u603b\u65cb\u8f6c',
    biggestWin: '\u6700\u9ad8\u8d62\u5956',
    winStreak: '\u8fde\u80dc',
    wallet: '\u94b1\u5305',
    myGifts: '\u6211\u7684\u793c\u7269',
    messages: '\u6d88\u606f',
    security: '\u5b89\u5168',
    support: '\u5ba2\u670d',
    myAssets: '\u6211\u7684\u8d44\u4ea7',
    assetDetails: '\u8d44\u4ea7\u660e\u7ec6',
    goldCoins: '\u91d1\u5e01',
    ticketBonusBalance: '\u5238\u5956\u52b1\u4f59\u989d',
    bonusBalance: '\u5956\u52b1\u4f59\u989d',
    myProgress: '\u6211\u7684\u8fdb\u5ea6',
    achievements: '\u6210\u5c31',
    settings: '\u8bbe\u7f6e',
    notificationsSetting: '\u901a\u77e5',
    vipMembership: 'VIP \u4f1a\u5458',
    vipPurchased: '\u5df2\u8d2d\u4e70',
    vipNotPurchased: '\u672a\u8d2d\u4e70',
    vipRules: 'VIP \u89c4\u7ae0',
    jackpotSlots: '\u5927\u5956 Slot \u6e38\u620f',
    packageList: '\u793c\u5305\u5217\u8868',
    profileDetail: '\u4e2a\u4eba\u8be6\u60c5',
    profileSecondaryPage: '\u4e2a\u4eba\u4e2d\u5fc3\u4e8c\u7ea7\u9875',
    vipBenefits: 'VIP \u6743\u76ca',
    currentLevel: '\u5f53\u524d\u7b49\u7ea7',
    benefits: '\u6743\u76ca',
    assetSnapshot: '\u8d44\u4ea7\u6982\u89c8',
    balanceSource: '\u4f59\u989d\u6765\u6e90',
    assetSourceText: '\u4f59\u989d\u7531\u94b1\u5305 API \u8fd4\u56de\uff0c\u672c\u5730\u6570\u636e\u53ef\u901a\u8fc7\u914d\u7f6e\u8986\u76d6\u3002',
    bonusSources: '\u5956\u52b1\u6765\u6e90',
    dailyBonusTicket: '\u6bcf\u65e5\u5956\u52b1\u5238',
    luckyWheelTicket: '\u5e78\u8fd0\u8f6c\u76d8\u5238',
    eventMissionTicket: '\u6d3b\u52a8\u4efb\u52a1\u5238',
    playNow: '\u7acb\u5373\u5f00\u59cb',
    moreGames: '\u66f4\u591a\u6e38\u620f',
    features: '\u7279\u6027',
    gameRules: '\u6e38\u620f\u89c4\u5219',
    purchase: '\u8d2d\u4e70',
    moreProducts: '\u66f4\u591a\u5546\u54c1',
    missions: '\u4efb\u52a1',
    milestones: '\u91cc\u7a0b\u7891',
    claimAvailableReward: '\u9886\u53d6\u53ef\u7528\u5956\u52b1',
    currentLanguage: '\u5f53\u524d\u8bed\u8a00',
    enabled: '\u5df2\u5f00\u542f',
    notSet: '\u672a\u8bbe\u7f6e',
    memberStatus: '\u4f1a\u5458\u72b6\u6001',
    vipRuleIntro: 'VIP \u4f1a\u5458\u53ef\u89e3\u9501\u989d\u5916\u5956\u52b1\u3001\u4f18\u5148\u5ba2\u670d\u548c\u4e13\u5c5e\u623f\u95f4\u6743\u9650\u3002',
    vipBenefitPriority: '\u4f18\u5148\u5ba2\u670d\u961f\u5217',
    vipBenefitEvent: '\u989d\u5916\u6d3b\u52a8\u5e01\u4efb\u52a1',
    vipBenefitRoom: '\u4e13\u5c5e\u8d5b\u4e8b\u623f\u95f4',
    dailyRule1: '\u6bcf\u4e2a\u670d\u52a1\u5668\u65e5\u53ef\u7b7e\u5230\u4e00\u6b21\u3002',
    dailyRule2: '\u7b2c 7 \u5929\u5305\u542b\u6bcf\u5468\u6700\u9ad8\u5956\u52b1\u3002',
    dailyRule3: '\u9519\u8fc7\u7684\u5929\u6570\u53ef\u82b1\u8d39\u91d1\u5e01\u8865\u7b7e\u3002',
    makeUpNow: '\u7acb\u5373\u8865\u7b7e',
    recentWinners: '\u6700\u8fd1\u83b7\u5956',
    seed: '\u521d\u59cb\u5956\u6c60',
    allPackages: '\u5168\u90e8\u793c\u5305',
    coinsProducts: '\u91d1\u5e01\u5546\u54c1',
    itemsProducts: '\u9053\u5177\u5546\u54c1',
    dealProducts: '\u793c\u5305\u5546\u54c1',
    activeFilter: '\u5f53\u524d\u7b5b\u9009',
    noData: '\u6682\u65e0\u6570\u636e',
    exchangeHint: '\u6d3b\u52a8\u5e01\u53ef\u5728\u94b1\u5305 API \u63a5\u5165\u540e\u5151\u6362\u91d1\u5e01\u3002',
    startsIn: '\u8ddd\u5f00\u59cb',
    eventRank: '\u6d3b\u52a8\u6392\u540d',
    eventFlow: '\u6d3b\u52a8\u6d41\u7a0b',
    completeActivities: '\u5b8c\u6210\u4efb\u52a1',
    earnEventPoints: '\u83b7\u5f97\u79ef\u5206',
    settleRankRewards: '\u6309\u6392\u540d\u7ed3\u7b97',
    rankRewards: '\u6392\u540d\u5956\u52b1',
    completeMission: '\u5b8c\u6210',
    redeemCode: '\u5151\u6362\u7801',
    enterRedeemCode: '\u8f93\u5165\u5151\u6362\u7801',
    redeemNow: '\u7acb\u5373\u5151\u6362',
    redeemSuccess: '\u5151\u6362\u6210\u529f',
    feedback: '\u610f\u89c1\u53cd\u9988',
    feedbackTitle: '\u6807\u9898',
    feedbackContent: '\u5185\u5bb9',
    submitFeedback: '\u63d0\u4ea4\u53cd\u9988',
    feedbackHistory: '\u53cd\u9988\u8bb0\u5f55',
    assetSummary: '\u8d44\u4ea7\u6c47\u603b',
    transactionRecords: '\u6d41\u6c34\u8bb0\u5f55',
    vipGrowth: 'VIP \u6210\u957f\u503c',
    dailyGrowth: '\u6bcf\u65e5\u6210\u957f',
    growthDecay: '\u8fc7\u671f\u8870\u51cf',
    expiresIn: '\u5230\u671f\u5269\u4f59',
    claimVipReward: '\u9886\u53d6\u5956\u52b1',
    vipLevel: 'VIP \u7b49\u7ea7',
    locked: '\u672a\u89e3\u9501',
    claimedStatus: '\u5df2\u9886',
    availableStatus: '\u53ef\u9886',
    allAssets: '\u5168\u90e8\u8d44\u4ea7',
    gameReadyText: '\u771f\u5b9e\u6e38\u620f\u542f\u52a8\u5730\u5740\u5df2\u9884\u7559\uff0c\u914d\u7f6e url \u540e\u53ef\u76f4\u63a5\u6253\u5f00\u3002',
  },
};
function readInitialLocale() {
  if (typeof window === 'undefined') return 'en';
  const params = new URLSearchParams(window.location.search);
  const queryLocale = params.get('lang');
  const storedLocale = window.localStorage.getItem('cocogames.lang');
  const browserLocale = window.navigator?.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  return ['zh', 'en'].includes(queryLocale) ? queryLocale : storedLocale || browserLocale;
}

const tabs = [
  { id: 'lobby', labelKey: 'lobby', icon: FaHome },
  { id: 'tournaments', labelKey: 'tournaments', icon: FaTrophy },
  { id: 'events', labelKey: 'events', icon: FaCalendarAlt },
  { id: 'shop', labelKey: 'shop', icon: FaShoppingBag },
  { id: 'me', labelKey: 'me', icon: FaUser },
];

const configTextTranslations = {
  zh: {
    'Eligible games: all Slot games.': '可参赛游戏：全部 Slot 游戏。',
    'Score: 1 point per 100 net coins won.': '计分：每赢得 100 金币净收益获得 1 分。',
    'Top 100 receive rewards after audit.': '前 100 名审核后发放奖励。',
    'Active membership grants daily growth.': '会员有效时每天累计成长值。',
    'When membership expires, growth decreases by decayPerDay each server day.': '会员过期后，每个服务器日按配置衰减成长值。',
    'A VIP level can claim its configured reward once per day.': '每个 VIP 等级奖励每天可领取一次。',
    'Expired membership loses growth each server day.': '会员过期后，每个服务器日会扣减成长值。',
    'Each level reward can be claimed once per day.': '每个等级奖励每天只能领取一次。',
    'Event points come from Slots, Casual games, and tournament missions.': '活动积分来自 Slot、休闲游戏和赛事任务。',
    'Milestone rewards can be claimed once.': '里程碑奖励只能领取一次。',
    'Unclaimed rewards expire when the event ends.': '未领取奖励会在活动结束后过期。',
    'Eligible games: all Slots and selected Casual games.': '可参与游戏：全部 Slot 和指定休闲游戏。',
    'Score: 1 point for every 100 net coins won.': '计分：每赢得 100 金币净收益获得 1 分。',
    'Ranking: higher score wins; ties use earliest score time.': '排名：积分越高排名越高，同分按最早达成时间排序。',
    'Rewards: paid after audit within 24 hours after the event ends.': '奖励：结束后 24 小时内审核并发放。',
    'Score by net coins won in Fish Hunter.': '按 Fish Hunter 净赢金币计分。',
    'Boss fish grants bonus points.': '击败 Boss 鱼可获得额外积分。',
    'Every 100 coins net win equals 1 point.': '每 100 金币净收益等于 1 分。',
    'Free spin wins count.': '免费旋转收益也计入积分。',
    'Lightning bonus doubles points.': '闪电奖励可获得双倍积分。',
    'Minimum 20 spins required.': '至少完成 20 次旋转才可上榜。',
    'Rookie-only event.': '仅限新手玩家参与。',
    'Treasure bonus grants 50 extra points.': '宝藏奖励额外获得 50 积分。',
    'Applies to all game categories.': '适用于所有游戏分类。',
    'Reward is paid in coins.': '奖励以金币发放。',
    'Resets daily at 00:00 server time.': '每日服务器时间 00:00 重置。',
    'Only Slot rounds count.': '仅 Slot 对局计入进度。',
    'Auto-spin rounds are valid.': '自动旋转对局有效。',
    'Only first launch per game counts.': '每款游戏仅首次启动计入。',
    'Daily coins': '每日金币',
    'Event coin task +1': '活动币任务 +1',
    'VIP tournament rooms': 'VIP 赛事房间',
    'Faster feedback queue': '反馈优先处理',
    'Higher daily reward': '更高每日奖励',
    'Exclusive activity tasks': '专属活动任务',
    'Growth protection': '成长值保护',
  },
};

const fallbackGames = [
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

const fallbackData = {
  user: {
    uid: '98271631',
    nickname: 'NovaPlayer',
    avatar: '',
    level: 28,
    xp: 12650,
    nextXp: 20000,
    vip: 'GOLD',
  },
  wallet: { coins: 228680, eventCoins: 420, bonusBalance: 4680 },
  jackpot: {
    total: 88888,
    seed: 50000,
    trigger: 'Any Slot jackpot symbol combination',
    latestWinners: [
      { name: 'ReelMaster', amount: 128800, game: '777 Deluxe' },
      { name: 'LuckyBean', amount: 106420, game: 'Pharaoh' },
      { name: 'FishHero', amount: 87500, game: 'Fish Hunter' },
    ],
  },
  hero: {
    label: 'NEW',
    title: 'CYBERPUNK CITY',
    subtitle: 'Enter the cyber world',
    cta: 'Play Now',
    image: 'https://games-web.coconut.tv/icon/cyberpunk.png',
  },
  games: fallbackGames,
  vip: {
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
    rules: ['Active membership grants daily growth.', 'Expired membership loses growth each server day.', 'Each level reward can be claimed once per day.'],
  },
  dailyRewards: [
    { day: 'DAY 1', label: 'Collected', amount: 'OK', coins: 500, collected: true },
    { day: 'DAY 2', label: '1,000', amount: '1,000', coins: 1000 },
    { day: 'DAY 3', label: '2,000', amount: '2,000', coins: 2000 },
    { day: 'DAY 4', label: '3,000', amount: '3,000', coins: 3000 },
    { day: 'DAY 5', label: '5,000', amount: '5,000', coins: 5000 },
    { day: 'DAY 6', label: '8,000', amount: '8,000', coins: 8000 },
    { day: 'DAY 7', label: '10,000', amount: '10,000', coins: 10000, eventCoins: 20, premium: true },
  ],
  leaderboard: [
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
  ],
  tournaments: [
    {
      id: 'mega-ways',
      title: 'MEGA WAYS TOURNAMENT',
      tag: 'MEGA',
      featured: true,
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
    { id: 'fish-cup', title: 'FISH HUNTER CUP', tag: 'HOT', prizePool: 30000, players: 856, capacity: 1500, endsIn: '01:15:30', image: 'https://games-web.coconut.tv/icon/fish.png', allowedGames: ['Fish Hunter'], rules: ['Score by net coins won in Fish Hunter.', 'Boss fish grants bonus points.'], roster: { active: 856, waiting: 88, eliminated: 31, staff: 6 }, rewardTiers: [{ rank: '1-20', reward: '5,000 Coins' }, { rank: '21-100', reward: '1,000 Coins' }] },
    { id: '777-cup', title: '777 DELUXE TOURNAMENT', tag: 'EASY', prizePool: 10000, players: 642, capacity: 1000, endsIn: '03:15:30', image: 'https://games-web.coconut.tv/icon/777.png', allowedGames: ['777 Deluxe'], rules: ['Every 100 coins net win equals 1 point.', 'Free spin wins count.'], roster: { active: 642, waiting: 40, eliminated: 12, staff: 5 }, rewardTiers: [{ rank: '1-50', reward: '2,000 Coins' }] },
    { id: 'zeus-cup', title: 'ZEUS CHALLENGE', tag: 'NORMAL', prizePool: 25000, players: 1102, capacity: 1800, endsIn: '05:15:30', image: 'https://games-web.coconut.tv/icon/zeus.png', allowedGames: ['Fury of Zeus'], rules: ['Lightning bonus doubles points.', 'Minimum 20 spins required.'], roster: { active: 1102, waiting: 95, eliminated: 48, staff: 8 }, rewardTiers: [{ rank: '1-10', reward: '8,000 Coins' }, { rank: '11-80', reward: '1,500 Coins' }] },
    { id: 'pirates-bounty', title: 'PIRATES BOUNTY', tag: 'ROOKIE', prizePool: 5000, players: 523, capacity: 800, endsIn: '07:15:30', image: 'https://games-web.coconut.tv/icon/pirate.png', allowedGames: ['Pirates'], rules: ['Rookie-only event.', 'Treasure bonus grants 50 extra points.'], roster: { active: 523, waiting: 22, eliminated: 9, staff: 4 }, rewardTiers: [{ rank: '1-30', reward: '800 Coins' }] },
  ],
  events: [
    {
      id: 'summer-splash',
      type: 'LIMITED TIME',
      title: 'SUMMER SPLASH',
      desc: 'Complete missions and earn points to win milestone rewards.',
      progress: 12680,
      target: 25000,
      reward: 'Grand Chest',
      icon: 'Splash',
      endsIn: '06d 14h 25m',
      featured: true,
      missions: [
        { title: 'Play 30 Slot rounds', progress: 18, target: 30, reward: '2,000 Coins' },
        { title: 'Win 3 Casual matches', progress: 1, target: 3, reward: '20 Event Coins' },
        { title: 'Join 1 tournament', progress: 1, target: 1, reward: 'Lucky Wheel Ticket' },
      ],
      milestones: [
        { points: 3000, reward: 'Coins x1,000', claimed: true },
        { points: 8000, reward: 'Event Coins x20', claimed: true },
        { points: 15000, reward: 'Blue Chest', claimed: false },
        { points: 25000, reward: 'Gold Chest', claimed: false },
      ],
      rules: ['Event points come from Slots, Casual games, and tournament missions.', 'Milestone rewards can be claimed once.', 'Unclaimed rewards expire when the event ends.'],
    },
    { id: 'weekend-boost', type: 'WEEKLY', title: 'WEEKEND BOOST', desc: 'Earn more points this weekend!', progress: 6200, target: 10000, reward: '5,000 Coins', icon: 'Rocket', endsIn: '2d 14h', missions: [{ title: 'Play 50 rounds', progress: 31, target: 50, reward: '5,000 Coins' }], milestones: [{ points: 10000, reward: '5,000 Coins', claimed: false }], rules: ['Applies to all game categories.', 'Reward is paid in coins.'] },
    { id: 'daily-spin', type: 'DAILY', title: 'DAILY SPIN', desc: 'Spin every day to win bonus coins and items.', progress: 1, target: 1, reward: 'COMPLETED', icon: 'Wheel', endsIn: '14h 25m', completed: true, missions: [{ title: 'Spin once today', progress: 1, target: 1, reward: 'Wheel Ticket' }], milestones: [{ points: 1, reward: 'Wheel Ticket', claimed: true }], rules: ['Resets daily at 00:00 server time.'] },
    { id: 'slot-master', type: 'CHALLENGE', title: 'SLOT MASTER', desc: 'Play slots and reach the target to win big!', progress: 35, target: 100, reward: '50 Event Coins', icon: 'Slot', endsIn: '4d 14h', missions: [{ title: 'Complete 100 Slot spins', progress: 35, target: 100, reward: '50 Event Coins' }], milestones: [{ points: 100, reward: '50 Event Coins', claimed: false }], rules: ['Only Slot rounds count.', 'Auto-spin rounds are valid.'] },
    { id: 'new-game', type: 'SPECIAL', title: 'NEW GAME LAUNCH', desc: 'Try new games and get exclusive rewards!', progress: 2, target: 5, reward: 'Gift Box', icon: 'Game', endsIn: '07d 14h', missions: [{ title: 'Try 5 different games', progress: 2, target: 5, reward: 'Gift Box' }], milestones: [{ points: 5, reward: 'Gift Box', claimed: false }], rules: ['Only first launch per game counts.'] },
  ],
  shop: {
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
  },
  wheel: {
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
  },
  profile: {
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
  },
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function coinAmount(value, t) {
  // Account balances, jackpots, tournaments, and rewards are game coins, not USD.
  return `${formatNumber(value)} ${t('coins')}`;
}

function progressPercent(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, (Number(value || 0) / Number(total)) * 100));
}

function normalizeGame(game, index) {
  const type = Number(game.type ?? 0);
  const slotNames = ['777', 'Pharaoh', 'Pirates', 'Buffalo', 'Zeus', 'Vegas', 'Slot', 'Tiger', 'Fruit'];
  const category = game.category || (type === 1 || /fish/i.test(game.name) ? 'Casual' : 'Slots');
  const label = game.label || (index === 0 ? 'HOT' : index === 1 ? 'NEW' : '');
  const heat = game.heat ?? Math.max(72, 99 - index * 4);
  const players = game.players ?? Math.max(600, 2100 - index * 130);
  return {
    ...game,
    id: game.id ?? `game-${index}`,
    name: game.name || slotNames[index % slotNames.length],
    category,
    label,
    heat,
    players,
    icon: game.icon || game.image || fallbackGames[index % fallbackGames.length].icon,
    url: game.url || '',
  };
}

function compactObject(object) {
  return Object.fromEntries(Object.entries(object || {}).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

function mergeLobbyData(base, patch) {
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    user: { ...base.user, ...compactObject(patch.user) },
    wallet: { ...base.wallet, ...compactObject(patch.wallet) },
    jackpot: { ...base.jackpot, ...compactObject(patch.jackpot) },
    hero: { ...base.hero, ...compactObject(patch.hero) },
    games: patch.games?.length ? patch.games.map(normalizeGame) : base.games,
    tournaments: patch.tournaments?.length ? patch.tournaments : base.tournaments,
    events: patch.events?.length ? patch.events : base.events,
    dailyRewards: patch.dailyRewards?.length ? patch.dailyRewards : base.dailyRewards,
    leaderboard: patch.leaderboard?.length ? patch.leaderboard : base.leaderboard,
    shop: { ...base.shop, ...(patch.shop || {}) },
    wheel: { ...base.wheel, ...(patch.wheel || {}) },
    vip: { ...base.vip, ...(patch.vip || {}) },
    profile: { ...base.profile, ...(patch.profile || {}) },
  };
}

function normalizeRemoteLobbyData(payload) {
  const source = payload?.data || payload || {};
  const user = source.user || source.player || source.profile || {};
  const wallet = source.wallet || source.balance || {};
  const games = source.games || source.gameList || source.list || [];

  return {
    user: {
      uid: user.uid || user.id || user.userId,
      nickname: user.nickname || user.name || user.nick,
      avatar: user.avatar || user.headImg || user.photo,
      level: user.level,
      xp: user.xp,
      nextXp: user.nextXp,
      vip: user.vip,
    },
    wallet: {
      coins: wallet.coins ?? wallet.goldCoins ?? user.token ?? source.token,
      eventCoins: wallet.eventCoins ?? wallet.activityCoins ?? wallet.eventCoin,
      bonusBalance: wallet.bonusBalance ?? wallet.bonus,
    },
    games: Array.isArray(games) ? games : [],
  };
}

function tournamentDetails(tournament) {
  return {
    rules: tournament?.rules?.length
      ? tournament.rules
      : [
        'Eligible games: all Slots and selected Casual games.',
        'Score: 1 point for every 100 net coins won.',
        'Ranking: higher score wins; ties use earliest score time.',
        'Rewards: paid after audit within 24 hours after the event ends.',
      ],
    roster: tournament?.roster || {
      active: tournament?.players || 0,
      waiting: Math.max(0, Math.floor((tournament?.capacity || 0) * 0.08)),
      eliminated: Math.max(0, Math.floor((tournament?.players || 0) * 0.05)),
      staff: 8,
    },
    rewardTiers: tournament?.rewardTiers || [{ rank: 'Top 100', reward: 'Coins reward' }],
    allowedGames: tournament?.allowedGames || ['All Slot games'],
    schedule: tournament?.schedule || { start: 'Now', end: tournament?.endsIn || 'TBD', payout: 'Within 24h' },
  };
}

function artVariant(value = '') {
  const text = String(value).toLowerCase();
  if (/fish|shark|hunter/.test(text)) return 'art-ocean';
  if (/777|slot|deluxe|vegas/.test(text)) return 'art-neon';
  if (/pharaoh|zeus|buffalo|pirate|ancient/.test(text)) return 'art-gold';
  if (/dice|casual|merge|rocket/.test(text)) return 'art-play';
  if (/cyber|space|heist|mega|tournament/.test(text)) return 'art-cyber';
  return 'art-ocean';
}

function shortArtLabel(value = 'GAME') {
  const text = String(value).trim().toUpperCase();
  if (!text) return 'GAME';
  if (text.includes('777')) return '777';
  if (text.includes('FISH')) return 'FISH';
  if (text.includes('ZEUS')) return 'ZEUS';
  if (text.includes('DICE')) return 'DICE';
  if (text.includes('PHARAOH')) return 'KING';
  if (text.includes('PIRATE')) return 'SEA';
  if (text.includes('BUFFALO')) return 'BUFF';
  if (text.includes('CYBER')) return 'CYBER';
  if (text.includes('SPACE')) return 'SPACE';
  const words = text.split(/\s+/).filter(Boolean);
  return words.length > 1 ? words.map((word) => word[0]).join('').slice(0, 5) : text.slice(0, 5);
}

function GameArt({ item, className = '' }) {
  const title = item?.title || item?.name || item?.category || 'Game';
  return (
    <div className={`art-tile ${artVariant(`${title} ${item?.category || ''}`)} ${className}`} aria-label={title}>
      <span>{shortArtLabel(title)}</span>
    </div>
  );
}

function EventGlyph({ value = '' }) {
  const text = String(value).toLowerCase();
  if (/rocket|boost/.test(text)) return <FaBolt />;
  if (/wheel|spin/.test(text)) return <FaTicketAlt />;
  if (/slot|challenge/.test(text)) return <FaFire />;
  if (/game|launch/.test(text)) return <FaPlay />;
  if (/splash|gift|event/.test(text)) return <FaGift />;
  return <FaCalendarAlt />;
}

function EventArt({ value, className = '' }) {
  return (
    <span className={`event-thumb thumb-art ${artVariant(value)} ${className}`}>
      <EventGlyph value={value} />
      <small>{shortArtLabel(value)}</small>
    </span>
  );
}

function ProductArt({ product, className = '' }) {
  const source = `${product?.productType || ''} ${product?.icon || ''} ${product?.title || ''}`;
  const Icon = /wheel|spin|ticket/i.test(source) ? FaTicketAlt
    : /boost|mega/i.test(source) ? FaBolt
      : /deal|pack|gift/i.test(source) ? FaGift
        : /item|shop/i.test(source) ? FaShoppingBag
          : FaCoins;
  return (
    <div className={`product-art ${artVariant(source)} ${className}`}>
      <Icon />
      <small>{shortArtLabel(product?.title || product?.icon || product?.productType || 'Coin')}</small>
    </div>
  );
}

function TopBar({ user, wallet, onWallet, onNotice, t }) {
  return (
    <header className="topbar">
      <div className="player">
        {user.avatar ? <img className="avatar" src={user.avatar} alt={user.nickname} /> : <div className="avatar">C</div>}
        <div>
          <strong>cocogames</strong>
          <span>{user.nickname} - ID: {user.uid}</span>
        </div>
      </div>
      <div className="wallets">
        {/* Keep balances in the top-right area on both phone and desktop. */}
        <button className="wallet-pill" type="button" title={t('coins')} onClick={() => onWallet('wallet')}>
          <span className="coin-icon"><FaCoins /></span>
          <strong>{formatNumber(wallet.coins)}</strong>
          <span className="wallet-add">+</span>
        </button>
        <button className="wallet-pill" type="button" title={t('eventCoins')} onClick={() => onWallet('assets')}>
          <span className="event-icon">EC</span>
          <strong>{formatNumber(wallet.eventCoins)}</strong>
          <span className="wallet-add">+</span>
        </button>
        <button className="icon-button" type="button" aria-label={t('notifications')} onClick={onNotice}>
          <FaBell />
        </button>
      </div>
    </header>
  );
}

function BottomNav({ activeTab, onChange, t }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button key={tab.id} type="button" className={activeTab === tab.id ? 'nav active' : 'nav'} onClick={() => onChange(tab.id)}>
            <Icon />
            <span>{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SectionTitle({ icon, title, action, onAction }) {
  return (
    <div className="section-title">
      <h2>
        {icon}
        {title}
      </h2>
      {action && (
        <button type="button" onClick={onAction}>
          {action} <FaChevronRight />
        </button>
      )}
    </div>
  );
}

function DetailSheet({ title, subtitle, children, onClose, className = '' }) {
  return (
    <div className="detail-overlay" role="dialog" aria-modal="true">
      <section className={`detail-panel ${className}`}>
        <header className="detail-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="detail-close" onClick={onClose} aria-label="Close detail">
            <FaTimes />
          </button>
        </header>
        <div className="detail-body">{children}</div>
      </section>
    </div>
  );
}

function SecondaryPage({ title, subtitle, children, onBack, t }) {
  return (
    <div className="screen secondary-page">
      <header className="secondary-header">
        <button type="button" onClick={onBack}><FaChevronRight /> {t('back')}</button>
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
      {children}
    </div>
  );
}

function AdminDashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [activeCollection, setActiveCollection] = useState('games');
  const [editorText, setEditorText] = useState('');
  const [status, setStatus] = useState('Loading admin data...');

  useEffect(() => {
    async function loadAdminData() {
      try {
        const response = await fetch('/api/admin/snapshot');
        const data = await response.json();
        setSnapshot(data);
        const first = data.collections?.includes('games') ? 'games' : data.collections?.[0];
        setActiveCollection(first);
        setEditorText(JSON.stringify(data.data?.[first], null, 2));
        setStatus('Admin data loaded');
      } catch (error) {
        setStatus(`Admin API failed: ${error.message}`);
      }
    }
    loadAdminData();
  }, []);

  const selectCollection = (collection) => {
    setActiveCollection(collection);
    setEditorText(JSON.stringify(snapshot?.data?.[collection], null, 2));
    setStatus(`Editing ${collection}`);
  };

  const saveCollection = async () => {
    try {
      const parsed = JSON.parse(editorText);
      const response = await fetch(`/api/admin/collections/${activeCollection}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsed }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setSnapshot((prev) => ({
        ...prev,
        data: { ...prev.data, [activeCollection]: result.data },
      }));
      setStatus(`${activeCollection} saved in server memory. Update server/mockData.js for permanent changes.`);
    } catch (error) {
      setStatus(`Save failed: ${error.message}`);
    }
  };

  const resetData = async () => {
    const response = await fetch('/api/admin/reset', { method: 'POST' });
    const result = await response.json();
    setSnapshot({
      collections: Object.keys(result.data || {}).filter((key) => key !== 'configMeta'),
      data: result.data,
    });
    setEditorText(JSON.stringify(result.data?.[activeCollection], null, 2));
    setStatus('Server memory reset from mockData.js');
  };

  const endpointRows = [
    ['Lobby Bootstrap', 'GET', '/api/lobby/bootstrap', 'Full frontend bootstrap data'],
    ['Games', 'GET', '/api/games, /api/games/:id', 'Slots and Casual game catalog'],
    ['Tournaments', 'GET/POST', '/api/tournaments, /api/tournaments/:id/join', 'Rules, roster, tiers, join'],
    ['Events', 'GET/POST', '/api/events, /api/events/:id/missions/:missionId/complete, /api/events/:id/ranking', 'Mission progress, event points, ranking rewards'],
    ['Wallet/Profile', 'GET/POST', '/api/user/balance, /api/profile/:section, /api/profile/feedback', 'Coins, eventCoins, assets, history, achievements, settings, feedback, VIP'],
    ['VIP', 'GET/POST', '/api/profile/vip, /api/profile/vip/reward', 'Membership growth, decay rules, level rewards'],
    ['Jackpot', 'GET', '/api/jackpot, /api/jackpot/slots', 'Progressive jackpot and eligible Slot games'],
    ['Daily Rewards', 'GET/POST', '/api/daily-rewards, /api/daily-rewards/makeup', 'Seven-day check-in and paid make-up'],
    ['Shop', 'GET/POST', '/api/shop/products, /api/shop/purchase, /api/redeem', 'Product catalog, purchase, redeem code'],
    ['Admin', 'GET/PUT', '/api/admin/snapshot, /api/admin/collections/:name', 'Mock configuration editing'],
  ];

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <strong>cocogames Admin</strong>
        <span>Mock and API console</span>
        <a href="/">Back to Lobby</a>
        <button type="button" onClick={resetData}>Reset Memory Data</button>
      </aside>
      <main className="admin-main">
        <section className="admin-card admin-hero">
          <div>
            <h1>后台管理</h1>
            <p>用于本地配置游戏、赛事、活动、钱包、商城和个人中心数据。当前保存写入 Node 内存，永久配置请同步修改 server/mockData.js。</p>
          </div>
          <span>{status}</span>
        </section>
        <section className="admin-card">
          <h2>运营模块</h2>
          <div className="admin-endpoints admin-operation-grid">
            {[
              ['游戏大厅', 'games / hero / jackpot', '管理 Banner、热门游戏、大奖 Slot 入口'],
              ['赛事运营', 'tournaments', '配置进行中/即将开始、规则、人员和奖励'],
              ['活动运营', 'events', '配置任务积分、排行榜和排名奖励'],
              ['商城运营', 'shop / redeemCodes', '配置商品、道具、礼包和兑换码'],
              ['用户运营', 'profile / vip / wallet', '查看资产流水、反馈、VIP 成长和奖励'],
            ].map(([title, collection, desc]) => (
              <article key={title}>
                <strong>{title}</strong>
                <code>{collection}</code>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="admin-card">
          <h2>数据模块</h2>
          <div className="admin-tabs">
            {(snapshot?.collections || []).map((collection) => (
              <button key={collection} type="button" className={activeCollection === collection ? 'active' : ''} onClick={() => selectCollection(collection)}>
                {collection}
              </button>
            ))}
          </div>
          <textarea value={editorText} onChange={(event) => setEditorText(event.target.value)} spellCheck="false" />
          <div className="admin-actions">
            <button type="button" onClick={saveCollection}>保存当前模块</button>
            <button type="button" onClick={() => selectCollection(activeCollection)}>撤销未保存修改</button>
          </div>
        </section>
        <section className="admin-card">
          <h2>接口结构</h2>
          <div className="admin-endpoints">
            {endpointRows.map(([module, method, path, desc]) => (
              <article key={module}>
                <strong>{module}</strong>
                <span>{method}</span>
                <code>{path}</code>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const adminMode = params.get('admin') === '1';
  const initialTab = tabs.some((tab) => tab.id === params.get('tab')) ? params.get('tab') : 'lobby';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tournamentTab, setTournamentTab] = useState('ongoing');
  const [activeEventFilter, setActiveEventFilter] = useState('ALL EVENTS');
  const [activeShopFilter, setActiveShopFilter] = useState('FEATURED');
  const [lobbyData, setLobbyData] = useState(fallbackData);
  const [toast, setToast] = useState('');
  const [gameFrameUrl, setGameFrameUrl] = useState('');
  const [serviceMode, setServiceMode] = useState('fallback');
  const [detailView, setDetailView] = useState(null);
  const [subPage, setSubPage] = useState(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [feedbackForm, setFeedbackForm] = useState({ title: '', content: '' });
  const [locale, setLocale] = useState(readInitialLocale);
  const t = useMemo(() => (key) => messages[locale]?.[key] || messages.en[key] || key, [locale]);
  const tc = useMemo(() => (value) => configTextTranslations[locale]?.[value] || value, [locale]);

  const switchLocale = () => {
    const nextLocale = locale === 'zh' ? 'en' : 'zh';
    setLocale(nextLocale);
    window.localStorage.setItem('cocogames.lang', nextLocale);
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (httpClient.shouldPreferRemote?.()) {
        try {
          await httpClient.fetchLobbyData();
          if (mounted) {
            setServiceMode('existing-server-ws');
          }
          return;
        } catch (error) {
          console.warn('[cocogames] real server bootstrap failed, using local fallback:', error);
          if (mounted) setServiceMode('remote-fallback');
        }
      }

      try {
        const response = await fetch('/api/lobby/bootstrap');
        if (response.ok) {
          const data = await response.json();
          if (mounted) {
            setLobbyData((prev) => mergeLobbyData(prev, data));
            setServiceMode('local-api');
          }
          return;
        }
      } catch {
        // Vite-only development can run without the local backend.
      }

      try {
        const remoteData = await Promise.race([
          httpClient.initReq(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('existing server timeout')), 2200)),
        ]);
        if (mounted) {
          setLobbyData((prev) => mergeLobbyData(prev, normalizeRemoteLobbyData(remoteData)));
          setServiceMode('existing-server');
        }
      } catch {
        if (mounted) setServiceMode('fallback');
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const offUser = playerStore.on('userUpdate', (user) => {
      setLobbyData((prev) => mergeLobbyData(prev, {
        user: {
          uid: user.uid || prev.user.uid,
          nickname: user.nickname || prev.user.nickname,
          avatar: user.avatar || prev.user.avatar,
        },
        wallet: { coins: user.token || prev.wallet.coins },
      }));
    });
    const offGames = playerStore.on('gameListUpdate', (gameList) => {
      if (gameList?.length) {
        setLobbyData((prev) => mergeLobbyData(prev, { games: gameList }));
      }
    });
    const offApns = socketClient.on(WS_EVENTS.APNS_UPDATE, (apns) => {
      if (apns?.length) {
        setLobbyData((prev) => ({
          ...prev,
          leaderboard: apns.slice(0, 4).map((item) => ({ name: item.nickname, score: item.amount })),
        }));
      }
    });
    return () => {
      offUser();
      offGames();
      offApns();
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onMessage = (event) => {
      const { type, data } = event.data || {};
      if (type === 'gameExit') setGameFrameUrl('');
      if (type === 'balanceUpdate') {
        setLobbyData((prev) => mergeLobbyData(prev, { wallet: data }));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const categoryFilters = useMemo(() => [
    { id: 'HOT', labelKey: 'popular' },
    { id: 'Slots', labelKey: 'slots' },
    { id: 'Casual', labelKey: 'casual' },
    { id: 'Fishing', labelKey: 'fishing' },
  ], []);
  const [activeCategory, setActiveCategory] = useState('HOT');
  const games = useMemo(() => {
    if (activeCategory === 'HOT') {
      return [...lobbyData.games].sort((a, b) => Number(b.heat || 0) - Number(a.heat || 0));
    }
    if (activeCategory === 'Fishing') {
      return lobbyData.games.filter((game) => /fish|fishing|hunter/i.test(`${game.name} ${game.category} ${(game.tags || []).join(' ')}`));
    }
    return lobbyData.games.filter((game) => game.category === activeCategory);
  }, [activeCategory, lobbyData.games]);

  const shopProducts = useMemo(() => [
    ...lobbyData.shop.coins.map((item) => ({ ...item, productType: 'coins' })),
    ...lobbyData.shop.items.map((item) => ({ ...item, productType: 'items' })),
    ...lobbyData.shop.deals.map((item) => ({ ...item, productType: 'deals' })),
  ], [lobbyData.shop]);

  const updateWallet = (coinsDelta = 0, eventDelta = 0) => {
    setLobbyData((prev) => mergeLobbyData(prev, {
      wallet: {
        coins: prev.wallet.coins + coinsDelta,
        eventCoins: Math.max(0, prev.wallet.eventCoins + eventDelta),
      },
    }));
  };

  const openDetail = (type, id = null) => setDetailView({ type, id });
  const closeDetail = () => setDetailView(null);
  const openSubPage = (type, id = null) => {
    closeDetail();
    setSubPage({ type, id });
  };
  const closeSubPage = () => setSubPage(null);

  const playGame = (game) => {
    if (game.url) {
      setGameFrameUrl(game.url);
      closeDetail();
      return;
    }
    setToast(`${game.name} is ready for server URL binding`);
  };

  const claimEvent = async (event) => {
    try {
      const response = await fetch(`/api/events/${event.id}/claim`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
      setLobbyData((prev) => mergeLobbyData(prev, {
        wallet: result.wallet,
        events: prev.events.map((item) => (item.id === event.id ? result.event : item)),
        profile: { ...prev.profile, transactions: result.transaction ? [result.transaction, ...(prev.profile.transactions || [])] : prev.profile.transactions },
      }));
      setToast(`${event.title} ${t('claimed')}`);
    } catch {
      updateWallet(5000, 0);
      setToast(`${event.title} ${t('claimed')}`);
    }
  };

  const completeEventMission = async (event, mission) => {
    try {
      const missionId = encodeURIComponent(mission.id || mission.title);
      const response = await fetch(`/api/events/${event.id}/missions/${missionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
      setLobbyData((prev) => mergeLobbyData(prev, {
        events: prev.events.map((item) => (item.id === event.id ? result.event : item)),
      }));
      setToast(`+${formatNumber(result.pointGain)} ${t('yourPoints')}`);
    } catch (error) {
      setToast(error.message || t('noData'));
    }
  };

  const purchaseProduct = async (product) => {
    try {
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
      setLobbyData((prev) => mergeLobbyData(prev, {
        wallet: result.wallet,
        profile: { ...prev.profile, transactions: result.transaction ? [result.transaction, ...(prev.profile.transactions || [])] : prev.profile.transactions },
      }));
      setToast(`${product.title || product.id} ${t('claimed')}`);
    } catch {
      const coins = Number(product.coins || 0);
      const eventCoins = Number(product.eventCoins || 0) - Number(product.cost || 0);
      updateWallet(coins, eventCoins);
      setToast(`${product.title || product.id} ${t('claimed')}`);
    }
  };

  const redeemGiftCode = async () => {
    const code = redeemCode.trim();
    if (!code) {
      setToast(t('enterRedeemCode'));
      return;
    }
    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
      setLobbyData((prev) => mergeLobbyData(prev, {
        wallet: result.wallet,
        profile: { ...prev.profile, transactions: result.transaction ? [result.transaction, ...(prev.profile.transactions || [])] : prev.profile.transactions },
      }));
      setRedeemCode('');
      setToast(t('redeemSuccess'));
    } catch (error) {
      setToast(error.message || t('noData'));
    }
  };

  const submitFeedback = async () => {
    if (!feedbackForm.title.trim() || !feedbackForm.content.trim()) {
      setToast(t('feedbackContent'));
      return;
    }
    try {
      const response = await fetch('/api/profile/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
      setLobbyData((prev) => mergeLobbyData(prev, {
        profile: { ...prev.profile, feedbacks: result.feedbacks },
      }));
      setFeedbackForm({ title: '', content: '' });
      setToast(t('submitFeedback'));
    } catch (error) {
      setToast(error.message || t('noData'));
    }
  };

  const claimVipReward = async (level) => {
    try {
      const response = await fetch('/api/profile/vip/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
      setLobbyData((prev) => mergeLobbyData(prev, {
        wallet: result.wallet,
        vip: result.vip,
        profile: { ...prev.profile, transactions: result.transaction ? [result.transaction, ...(prev.profile.transactions || [])] : prev.profile.transactions },
      }));
      setToast(t('claimVipReward'));
    } catch (error) {
      setToast(error.message || t('noData'));
    }
  };

  const makeUpDailyReward = async () => {
    try {
      const response = await fetch('/api/daily-rewards/makeup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost: 1000 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
      setLobbyData((prev) => mergeLobbyData(prev, {
        wallet: result.wallet,
        dailyRewards: result.reward
          ? prev.dailyRewards.map((item) => (item.day === result.reward.day ? result.reward : item))
          : prev.dailyRewards,
        profile: { ...prev.profile, transactions: result.transaction ? [result.transaction, ...(prev.profile.transactions || [])] : prev.profile.transactions },
      }));
      setToast(t('makeUpCheckIn'));
    } catch (error) {
      setToast(error.message || t('noData'));
    }
  };

  const jumpShopSection = (filter) => {
    setActiveShopFilter(filter);
    const targetMap = {
      FEATURED: 'shop-hero',
      COINS: 'shop-section-coins',
      ITEMS: 'shop-section-items',
      DEALS: 'shop-section-deals',
      VIP: 'shop-section-vip',
      EXCHANGE: 'shop-section-exchange',
    };
    const target = document.getElementById(targetMap[filter]);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else setToast(`${t(filter === 'VIP' ? 'vipMembership' : 'exchange')} ready for API binding`);
  };

  const cycleEventFilter = () => {
    const filters = ['ALL EVENTS', 'LIMITED TIME', 'DAILY', 'WEEKLY'];
    const next = filters[(filters.indexOf(activeEventFilter) + 1) % filters.length];
    setActiveEventFilter(next);
    setToast(`${t('activeFilter')}: ${t({
      'ALL EVENTS': 'allEvents',
      'LIMITED TIME': 'limitedTime',
      DAILY: 'daily',
      WEEKLY: 'weekly',
    }[next])}`);
  };

  const renderLobby = () => (
    <div className="screen lobby-screen">
      <div className="hero-row">
        <section className="feature-banner">
          <div>
            <span>{lobbyData.hero.label}</span>
            <h1>{lobbyData.hero.title}</h1>
            <p>{lobbyData.hero.subtitle}</p>
            <button type="button" onClick={() => openDetail('game', lobbyData.games[0]?.id)}>
              <FaPlay /> {lobbyData.hero.cta}
            </button>
          </div>
          <GameArt item={{ title: lobbyData.hero.title, category: 'hero cyber' }} className="hero-art" />
        </section>
        <button className="jackpot-card" type="button" onClick={() => openSubPage('jackpot')}>
          <h2>{t('jackpot')}</h2>
          <p>{t('totalJackpot')}</p>
          <strong>{coinAmount(lobbyData.jackpot.total, t)}</strong>
          <div className="treasure">Chest</div>
        </button>
      </div>

      <section className="shortcut-bar">
        {[
          ['dailyBonus', FaGift, 'dailyRewards'],
          ['luckyWheel', FaTicketAlt, 'wheel'],
          ['tournaments', FaTrophy, 'tournaments'],
          ['dailyTasks', FaCheck, 'events'],
          ['shop', FaShoppingBag, 'shop'],
        ].map(([labelKey, Icon, target]) => (
          <button key={labelKey} type="button" onClick={() => {
            if (target === 'tournaments' || target === 'events' || target === 'shop') setActiveTab(target);
            else if (target === 'dailyRewards') openSubPage('dailyRewards');
            else openDetail(target);
          }}>
            <span><Icon /></span>
            {t(labelKey)}
          </button>
        ))}
      </section>

      <section className="panel">
        <SectionTitle icon={<FaFire />} title={t('popularGames')} action={t('viewAll')} onAction={() => openSubPage('gamesList')} />
        <div className="category-tabs">
          {categoryFilters.map((category) => (
            <button key={category.id} type="button" className={activeCategory === category.id ? 'active' : ''} onClick={() => setActiveCategory(category.id)}>
              {t(category.labelKey)}
            </button>
          ))}
        </div>
        <div className="game-grid">
          {games.slice(0, 8).map((game) => (
            <button className="game-card" key={game.id} type="button" onClick={() => openDetail('game', game.id)}>
              {game.label && <span className="game-badge">{game.label}</span>}
              <GameArt item={game} className="game-art" />
              <strong>{game.name}</strong>
              <small><FaUsers /> {Number(game.players).toLocaleString()}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="dashboard-row">
        <section className="panel rewards-panel">
          <SectionTitle title={t('dailyRewards')} action={t('viewAll')} onAction={() => openSubPage('dailyRewards')} />
          <p>{t('dailyRewardsHint')}</p>
          <div className="reward-strip">
            {lobbyData.dailyRewards.map((reward) => (
              <button key={reward.day} type="button" className={reward.premium ? 'premium' : ''} onClick={() => openSubPage('dailyRewards')}>
                <span>{reward.day}</span>
                <strong>{reward.collected ? <FaCheck /> : reward.label}</strong>
              </button>
            ))}
          </div>
        </section>
        <section className="panel board-panel">
          <SectionTitle title={t('winnerBoard')} action={t('viewAll')} onAction={() => openSubPage('leaderboard')} />
          {lobbyData.leaderboard.slice(0, 4).map((item, index) => (
            <div className="winner-row" key={item.name}>
              <span>{index + 1}</span>
              <strong>{item.name}</strong>
              <em>{coinAmount(item.score, t)}</em>
            </div>
          ))}
        </section>
      </div>
    </div>
  );

  const renderTournaments = () => {
    const visibleTournaments = lobbyData.tournaments.filter((item) => (tournamentTab === 'upcoming' ? item.status === 'upcoming' : item.status !== 'upcoming'));
    const featured = visibleTournaments.find((item) => item.featured) || visibleTournaments[0] || lobbyData.tournaments[0];
    const rest = visibleTournaments.filter((item) => item.id !== featured?.id);
    const detail = tournamentDetails(featured);
    const timeLabel = featured?.status === 'upcoming' ? t('startsIn') : t('endsIn');
    const timeValue = featured?.status === 'upcoming' ? featured.startsIn : featured.endsIn;
    return (
      <div className="screen">
        <div className="page-heading">
          <span><FaTrophy /></span>
          <div>
            <h1>{t('tournaments')}</h1>
            <p>{t('tournamentSubtitle')}</p>
          </div>
          <button type="button" onClick={() => openSubPage('profileSection', 'history')}>{t('history')} <FaChevronRight /></button>
        </div>
        <div className="toolbar">
          <div className="segmented">
            <button className={tournamentTab === 'ongoing' ? 'active' : ''} type="button" onClick={() => setTournamentTab('ongoing')}>{t('ongoing')}</button>
            <button className={tournamentTab === 'upcoming' ? 'active' : ''} type="button" onClick={() => setTournamentTab('upcoming')}>{t('upcoming')}</button>
          </div>
        </div>
        {featured && <section className="tournament-hero">
          <div>
            <span>{featured.tag}</span>
            <h2>{featured.title}</h2>
            <p><FaClock /> {timeLabel} <strong>{timeValue}</strong></p>
            <small>{t('prizePool')}</small>
            <strong>{coinAmount(featured.prizePool, t)}</strong>
          </div>
          <GameArt item={{ title: featured.title, category: 'tournament' }} className="tournament-art" />
          <footer>
            <span><FaUsers /> {t('players')} <strong>{formatNumber(featured.players)} / {formatNumber(featured.capacity)}</strong></span>
            <span><FaMedal /> {t('yourRank')} <strong>#{featured.rank || '--'}</strong></span>
            <button type="button" onClick={() => openSubPage('tournament', featured.id)}>{t('details')}</button>
          </footer>
        </section>}
        <section className="panel tournament-detail">
          <SectionTitle title={t('tournamentDetails')} action={t('fullDetail')} onAction={() => openSubPage('tournament', featured?.id)} />
          <div className="detail-grid">
            <article>
              <h3>{t('rules')}</h3>
              <ol>
                {detail.rules.map((rule) => <li key={rule}>{tc(rule)}</li>)}
              </ol>
            </article>
            <article>
              <h3>{t('participants')}</h3>
              <div className="roster-grid">
                <span><strong>{formatNumber(detail.roster.active)}</strong>{t('active')}</span>
                <span><strong>{formatNumber(detail.roster.waiting)}</strong>{t('waiting')}</span>
                <span><strong>{formatNumber(detail.roster.eliminated)}</strong>{t('eliminated')}</span>
                <span><strong>{formatNumber(detail.roster.staff)}</strong>{t('staff')}</span>
              </div>
            </article>
          </div>
        </section>
        <section className="panel tournament-list">
          {rest.map((item) => (
            <button key={item.id} type="button" onClick={() => openSubPage('tournament', item.id)}>
              <GameArt item={{ title: item.title, category: 'tournament' }} className="list-art" />
              <div className="tournament-item-main"><span>{item.tag}</span><strong>{item.title}</strong><small>{t('prizePool')}</small><em>{coinAmount(item.prizePool, t)}</em></div>
              <div className="tournament-item-meta"><small>{t('players')}</small><strong>{formatNumber(item.players)} / {formatNumber(item.capacity)}</strong></div>
              <div className="tournament-item-time"><small>{item.status === 'upcoming' ? t('startsIn') : t('endsIn')}</small><em>{item.status === 'upcoming' ? item.startsIn : item.endsIn}</em></div>
              <FaChevronRight />
            </button>
          ))}
          {!rest.length && <div className="data-row"><strong>{t('noData')}</strong><small>{tournamentTab === 'upcoming' ? t('upcoming') : t('ongoing')}</small></div>}
        </section>
        <section className="how-to">
          <h2><FaInfoCircle /> {t('howToPlay')}</h2>
          <div>
            <article><span><FaTrophy /></span><p>{t('playSlots')}</p></article>
            <FaChevronRight className="step-arrow" />
            <article><span><FaMedal /></span><p>{t('climbLeaderboard')}</p></article>
            <FaChevronRight className="step-arrow" />
            <article><span><FaGift /></span><p>{t('winRewards')}</p></article>
          </div>
        </section>
      </div>
    );
  };

  const renderEvents = () => {
    const featuredEvent = lobbyData.events.find((event) => event.featured) || lobbyData.events[0];
    const filtered = activeEventFilter === 'ALL EVENTS'
      ? lobbyData.events.filter((event) => !event.featured)
      : lobbyData.events.filter((event) => event.type === activeEventFilter);
    return (
      <div className="screen">
        <div className="page-heading event-heading">
          <span><FaCalendarAlt /></span>
          <div><h1>{t('events')}</h1><p>{t('eventsSubtitle')}</p></div>
          <div className="gift-illustration"><FaGift /></div>
        </div>
        <section className="event-hero event-hero-compact">
          <div><span>HOT</span><h2>{featuredEvent.title}</h2><p>{featuredEvent.desc}</p><small><FaClock /> {t('endsIn')} <b>{featuredEvent.endsIn}</b></small></div>
          <div className="event-progress-card event-rank-card">
            <span><small>{t('yourPoints')}</small><strong>{formatNumber(featuredEvent.progress)}</strong></span>
            <span><small>{t('eventRank')}</small><strong>#{featuredEvent.rank || '--'}</strong></span>
            <div className="mini-progress"><i><b style={{ width: `${progressPercent(featuredEvent.progress, featuredEvent.target)}%` }} /></i><small>{formatNumber(featuredEvent.progress)} / {formatNumber(featuredEvent.target)}</small></div>
            <button type="button" onClick={() => openSubPage('event', featuredEvent.id)}>{t('viewDetails')}</button>
          </div>
        </section>
        <section className="how-to compact-flow">
          <h2><FaInfoCircle /> {t('eventFlow')}</h2>
          <div>
            <article><span><FaCheck /></span><p>{t('completeActivities')}</p></article>
            <article><span><FaFire /></span><p>{t('earnEventPoints')}</p></article>
            <article><span><FaTrophy /></span><p>{t('settleRankRewards')}</p></article>
          </div>
        </section>
        <div className="chip-row event-filter-row">
          {[
            ['ALL EVENTS', 'allEvents'],
            ['LIMITED TIME', 'limitedTime'],
            ['DAILY', 'daily'],
            ['WEEKLY', 'weekly'],
          ].map(([filter, labelKey]) => <button key={filter} className={activeEventFilter === filter ? 'active' : ''} type="button" onClick={() => setActiveEventFilter(filter)}>{t(labelKey)}</button>)}
          <button className="event-filter-action" type="button" onClick={cycleEventFilter}><FaFilter /> {t('filter')}</button>
        </div>
        <section className="event-list">
          {filtered.map((event) => (
            <button key={event.id} type="button" onClick={() => openSubPage('event', event.id)}>
              <EventArt value={event.icon || event.title} />
              <div><span>{event.type}</span><strong>{event.title}</strong><p>{event.desc}</p><small><FaClock /> {t('endsIn')} {event.endsIn}</small></div>
              <div className="event-progress"><small>{t('yourPoints')} · #{event.rank || '--'}</small><strong>{formatNumber(event.progress)} / {formatNumber(event.target)}</strong><i><b style={{ width: `${progressPercent(event.progress, event.target)}%` }} /></i></div>
              <em>{event.completed ? <FaCheck /> : event.reward}</em>
              <FaChevronRight />
            </button>
          ))}
        </section>
        <section className="event-callout"><span><FaTrophy /></span><div><h3>{t('dontMiss')}</h3><p>{t('eventCallout')}</p></div><button type="button" onClick={() => openSubPage('event', featuredEvent.id)}>{t('leaderboard')}</button></section>
      </div>
    );
  };

  const renderShop = () => (
    <div className="screen">
      <div className="page-heading shop-heading"><span><FaShoppingBag /></span><div><h1>{t('shop')}</h1><p>{t('shopSubtitle')}</p></div></div>
      <section id="shop-hero" className="shop-hero"><div><h2>{t('welcomePack')}</h2><p>{t('specialOffer')}</p><span><FaClock /> 23h 59m 42s</span></div><strong>300%<small>{t('value')}</small></strong><button type="button" onClick={() => openDetail('product', 'd1')}>$4.99</button></section>
      <div className="chip-row shop-tabs">{[
        ['FEATURED', 'featured'],
        ['COINS', 'coinsTab'],
        ['ITEMS', 'items'],
        ['DEALS', 'deals'],
        ['VIP', 'vip'],
        ['EXCHANGE', 'exchange'],
      ].map(([filter, labelKey]) => <button key={filter} className={activeShopFilter === filter ? 'active' : ''} type="button" onClick={() => jumpShopSection(filter)}>{t(labelKey)}</button>)}</div>
      <section id="shop-section-coins" className="panel shop-section">
        <SectionTitle title={t('coinsTab')} action={t('viewAll')} onAction={() => openSubPage('shopList', 'coins')} />
        <div className="shop-grid coins-grid">
          {lobbyData.shop.coins.map((pack) => (
            <button key={pack.id} type="button" className={pack.best ? 'best' : ''} onClick={() => openDetail('product', pack.id)}>
              <strong>{formatNumber(pack.coins)}</strong><span>{t('coins')}</span><ProductArt product={{ ...pack, productType: 'coins' }} className="compact-art" /><em>{pack.bonus}</em><b>{pack.price}</b>
            </button>
          ))}
        </div>
      </section>
      <section id="shop-section-items" className="panel shop-section">
        <SectionTitle title={t('items')} action={t('viewAll')} onAction={() => openSubPage('shopList', 'items')} />
        <div className="shop-grid item-grid">
          {lobbyData.shop.items.map((item) => (
            <button key={item.id} type="button" onClick={() => openDetail('product', item.id)}>
              <ProductArt product={{ ...item, productType: 'items' }} className="compact-art" /><strong>{item.title}</strong><span>{item.qty}</span><b>EC {item.cost}</b>
            </button>
          ))}
        </div>
      </section>
      <section id="shop-section-deals" className="panel shop-section">
        <SectionTitle title={t('deals')} action={t('viewAll')} onAction={() => openSubPage('shopList', 'deals')} />
        <div className="deal-grid">
          {lobbyData.shop.deals.map((deal) => (
            <button key={deal.id} type="button" onClick={() => openDetail('product', deal.id)}>
              <span>{deal.tag}</span><strong>{deal.title}</strong><p>{t('coins')} {formatNumber(deal.coins)} EC {formatNumber(deal.eventCoins)}</p><b>{deal.price}</b>
            </button>
          ))}
        </div>
      </section>
      <section id="shop-section-vip" className="panel shop-info-card">
        <SectionTitle title={t('vipMembership')} action={t('viewDetails')} onAction={() => openSubPage('profileSection', 'vip')} />
        <p>{t('vipRuleIntro')}</p>
      </section>
      <section id="shop-section-exchange" className="panel shop-info-card redeem-card">
        <SectionTitle title={t('redeemCode')} action={t('assetDetails')} onAction={() => openSubPage('profileSection', 'assets')} />
        <p>{t('exchangeHint')}</p>
        <div className="redeem-form">
          <input value={redeemCode} onChange={(event) => setRedeemCode(event.target.value.toUpperCase())} placeholder={t('enterRedeemCode')} />
          <button type="button" onClick={redeemGiftCode}>{t('redeemNow')}</button>
        </div>
      </section>
    </div>
  );

  const renderMe = () => (
    <div className="screen">
      <section className="profile-card">
        <button className="vip-status-card" type="button" onClick={() => openSubPage('profileSection', 'vip')}>
          <span><FaMedal /> {t('vipMembership')}</span>
          <strong>{lobbyData.vip?.currentLevel || lobbyData.user.vip || t('vipNotPurchased')}</strong>
          <small>{t('vipGrowth')} {formatNumber(lobbyData.vip?.growth)} / {formatNumber(lobbyData.vip?.nextGrowth)}</small>
          <i><b style={{ width: `${progressPercent(lobbyData.vip?.growth, lobbyData.vip?.nextGrowth)}%` }} /></i>
          <em>{lobbyData.vip?.active ? t('vipPurchased') : t('vipNotPurchased')} · {t('expiresIn')} {lobbyData.vip?.expiresIn || '--'}</em>
          <FaChevronRight />
        </button>
        <div className="profile-stat">
          <h2>{t('level')} {lobbyData.user.level}</h2>
          <span>{Math.round(progressPercent(lobbyData.user.xp, lobbyData.user.nextXp))}%</span>
          <i><b style={{ width: `${progressPercent(lobbyData.user.xp, lobbyData.user.nextXp)}%` }} /></i>
          <p>{formatNumber(lobbyData.user.xp)} / {formatNumber(lobbyData.user.nextXp)} XP</p>
          <div><span><FaTrophy /><strong>{formatNumber(lobbyData.profile.totalSpins)}</strong><small>{t('totalSpins')}</small></span><span><FaMedal /><strong>{formatNumber(lobbyData.profile.biggestWin)}</strong><small>{t('biggestWin')}</small></span><span><FaCalendarAlt /><strong>{lobbyData.profile.winStreak}</strong><small>{t('winStreak')}</small></span></div>
        </div>
      </section>
      <section className="profile-actions">
        {[
          ['wallet', 'wallet', FaWallet],
          ['gifts', 'myGifts', FaGift],
          ['messages', 'messages', FaEnvelope],
          ['support', 'support', FaHeadset],
        ].map(([key, labelKey, Icon]) => <button key={key} type="button" onClick={() => openSubPage('profileSection', key)}><Icon /> {t(labelKey)}<FaChevronRight /></button>)}
      </section>
      <section className="panel assets-panel">
        <SectionTitle title={t('myAssets')} action={t('assetDetails')} onAction={() => openSubPage('profileSection', 'assets')} />
        <button className="asset-summary-row" type="button" onClick={() => openSubPage('profileSection', 'assets')}>
          <span><FaWallet /></span>
          <div><strong>{t('assetSummary')}</strong><small>{t('goldCoins')} {formatNumber(lobbyData.wallet.coins)} · {t('eventCoins')} {formatNumber(lobbyData.wallet.eventCoins)}</small></div>
          <em>{formatNumber(lobbyData.wallet.coins + lobbyData.wallet.eventCoins)}</em>
          <FaChevronRight />
        </button>
        <button type="button" onClick={() => openSubPage('profileSection', 'bonus')}>{t('ticketBonusBalance')} <strong>{formatNumber(lobbyData.wallet.bonusBalance)}</strong><FaChevronRight /></button>
      </section>
      <section className="panel progress-panel">
        <SectionTitle title={t('myProgress')} action={t('viewAll')} onAction={() => openSubPage('profileSection', 'achievements')} />
        <div className="progress-cards">
          {lobbyData.profile.achievements.map((ach) => (
            <button key={ach.title} type="button" onClick={() => openSubPage('achievement', ach.title)}>
              <span><FaMedal /></span><h3>{ach.title}</h3><p>{ach.desc}</p><i><b style={{ width: `${progressPercent(ach.value, ach.total)}%` }} /></i><small>{formatNumber(ach.value)} / {formatNumber(ach.total)}</small><strong>{t('reward')} {ach.reward}</strong>
            </button>
          ))}
        </div>
      </section>
      <section className="profile-menu">
        {[
          ['history', 'gameHistory', FaHistory],
          ['achievements', 'achievements', FaMedal],
          ['settings', 'settings', FaShieldAlt],
        ].map(([key, labelKey, Icon]) => <button key={key} type="button" onClick={() => openSubPage('profileSection', key)}><Icon /> {t(labelKey)}<FaChevronRight /></button>)}
      </section>
    </div>
  );

  const renderSubPage = () => {
    if (!subPage) return null;

    if (subPage.type === 'gamesList') {
      const title = activeCategory === 'HOT'
        ? t('popularGames')
        : t(categoryFilters.find((item) => item.id === activeCategory)?.labelKey || 'allGames');
      return (
        <SecondaryPage title={title} subtitle={t('allGames')} onBack={closeSubPage} t={t}>
          <div className="category-tabs subpage-tabs">
            {categoryFilters.map((category) => (
              <button key={category.id} type="button" className={activeCategory === category.id ? 'active' : ''} onClick={() => setActiveCategory(category.id)}>
                {t(category.labelKey)}
              </button>
            ))}
          </div>
          <div className="secondary-grid all-games-grid page-game-grid">
            {games.map((game) => (
              <button key={game.id} type="button" onClick={() => openDetail('game', game.id)}>
                <GameArt item={game} className="secondary-art" />
                <strong>{game.name}</strong>
                <small>{game.category} - {formatNumber(game.players)} {t('players')}</small>
              </button>
            ))}
          </div>
        </SecondaryPage>
      );
    }

    if (subPage.type === 'jackpot') {
      const jackpotGames = lobbyData.games.filter((game) => game.category === 'Slots' && /jackpot|vault|top wins/i.test(`${game.tags?.join(' ')} ${game.features?.join(' ')} ${game.rules?.join(' ')}`));
      const slots = jackpotGames.length ? jackpotGames : lobbyData.games.filter((game) => game.category === 'Slots');
      return (
        <SecondaryPage title={t('jackpotDetail')} subtitle={lobbyData.jackpot.trigger} onBack={closeSubPage} t={t}>
          <section className="panel jackpot-detail-card">
            <strong className="big-number">{coinAmount(lobbyData.jackpot.total, t)}</strong>
            <div className="stat-grid">
              <span><strong>{formatNumber(lobbyData.jackpot.seed)}</strong>{t('seed')}</span>
              <span><strong>{lobbyData.jackpot.latestWinners?.length || 0}</strong>{t('recentWinners')}</span>
            </div>
          </section>
          <section className="panel">
            <SectionTitle title={t('jackpotSlots')} />
            <div className="secondary-grid all-games-grid page-game-grid">
              {slots.map((game) => (
                <button key={game.id} type="button" onClick={() => openDetail('game', game.id)}>
                  <GameArt item={game} className="secondary-art" />
                  <strong>{game.name}</strong>
                  <small>{coinAmount(game.maxBet || lobbyData.jackpot.total, t)}</small>
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <SectionTitle title={t('recentWinners')} />
            <div className="data-list">{(lobbyData.jackpot.latestWinners || []).map((item) => <div className="data-row" key={`${item.name}-${item.game}`}><strong>{item.name}</strong><small>{item.game} - {coinAmount(item.amount, t)}</small></div>)}</div>
          </section>
        </SecondaryPage>
      );
    }

    if (subPage.type === 'dailyRewards') {
      return (
        <SecondaryPage title={t('dailyRewards')} subtitle={t('dailyRewardsHint')} onBack={closeSubPage} t={t}>
          <section className="panel daily-reward-page">
            <div className="reward-table reward-table-seven">
              {lobbyData.dailyRewards.map((reward) => (
                <button key={reward.day} type="button" className={reward.premium ? 'premium' : ''} onClick={() => {
                  updateWallet(Number(reward.coins || 0), Number(reward.eventCoins || 0));
                  setToast(`${reward.day} ${t('claimed')}`);
                }}>
                  <strong>{reward.day}</strong>
                  <span>{reward.amount}</span>
                  <small>{reward.collected ? t('claimed') : t('available')}</small>
                </button>
              ))}
            </div>
          </section>
          <section className="panel detail-columns">
            <article>
              <h3>{t('checkInRules')}</h3>
              <p><FaInfoCircle /> {t('dailyRule1')}</p>
              <p><FaInfoCircle /> {t('dailyRule2')}</p>
              <p><FaInfoCircle /> {t('dailyRule3')}</p>
            </article>
            <article>
              <h3>{t('makeUpCheckIn')}</h3>
              <p>{t('makeUpCost')}</p>
              <button className="inline-action" type="button" onClick={makeUpDailyReward}>{t('makeUpNow')}</button>
            </article>
          </section>
        </SecondaryPage>
      );
    }

    if (subPage.type === 'leaderboard') {
      return (
        <SecondaryPage title={t('fullRanking')} subtitle={t('winnerBoard')} onBack={closeSubPage} t={t}>
          <section className="panel data-list ranking-list">
            {lobbyData.leaderboard.map((item, index) => <div className="data-row" key={`${item.name}-${index}`}><strong>#{index + 1} {item.name}</strong><small>{coinAmount(item.score, t)}</small></div>)}
          </section>
        </SecondaryPage>
      );
    }

    if (subPage.type === 'tournament') {
      const tournament = lobbyData.tournaments.find((item) => item.id === subPage.id) || lobbyData.tournaments[0];
      const detail = tournamentDetails(tournament);
      const timeLabel = tournament.status === 'upcoming' ? t('startsIn') : t('endsIn');
      const timeValue = tournament.status === 'upcoming' ? tournament.startsIn : tournament.endsIn;
      return (
        <SecondaryPage title={tournament.title} subtitle={`${tournament.tag} - ${timeLabel} ${timeValue}`} onBack={closeSubPage} t={t}>
          <section className="panel tournament-subpage-head tournament-compact-detail">
            <GameArt item={{ title: tournament.title, category: 'tournament' }} className="detail-art" />
            <div>
              <strong className="big-number">{coinAmount(tournament.prizePool, t)}</strong>
              <div className="stat-grid">
                <span><strong>{formatNumber(tournament.players)}</strong>{t('players')}</span>
                <span><strong>{formatNumber(tournament.capacity)}</strong>{t('capacity')}</span>
                <span><strong>#{tournament.rank || '--'}</strong>{t('yourRank')}</span>
                <span><strong>{detail.schedule.payout}</strong>{t('payout')}</span>
              </div>
            </div>
          </section>
          <section className="panel detail-columns">
            <article><h3>{t('rules')}</h3><ol>{detail.rules.map((rule) => <li key={rule}>{tc(rule)}</li>)}</ol></article>
            <article><h3>{t('participants')}</h3><div className="roster-grid"><span><strong>{formatNumber(detail.roster.active)}</strong>{t('active')}</span><span><strong>{formatNumber(detail.roster.waiting)}</strong>{t('waiting')}</span><span><strong>{formatNumber(detail.roster.eliminated)}</strong>{t('eliminated')}</span><span><strong>{formatNumber(detail.roster.staff)}</strong>{t('staff')}</span></div></article>
          </section>
          <section className="panel detail-columns">
            <article><h3>{t('rewardTiers')}</h3>{detail.rewardTiers.map((tier) => <p key={tier.rank}><FaTrophy /> Rank {tier.rank}: {tier.reward}</p>)}</article>
            <article><h3>{t('allowedGames')}</h3><div className="pill-list">{detail.allowedGames.map((game) => <span key={game}>{game}</span>)}</div></article>
          </section>
          <section className="how-to compact-flow">
            <h2><FaInfoCircle /> {t('howToPlay')}</h2>
            <div>
              <article><span><FaPlay /></span><p>{t('playSlots')}</p></article>
              <article><span><FaMedal /></span><p>{t('climbLeaderboard')}</p></article>
              <article><span><FaGift /></span><p>{t('winRewards')}</p></article>
            </div>
          </section>
          <div className="detail-actions"><button type="button" onClick={() => setToast(`Joined ${tournament.title}`)}>{tournament.status === 'upcoming' ? t('upcoming') : t('joinTournament')}</button></div>
        </SecondaryPage>
      );
    }

    if (subPage.type === 'event') {
      const event = lobbyData.events.find((item) => item.id === subPage.id) || lobbyData.events[0];
      return (
        <SecondaryPage title={event.title} subtitle={`${event.type} - ${t('endsIn')} ${event.endsIn}`} onBack={closeSubPage} t={t}>
          <section className="panel event-subpage-head event-compact-detail">
            <EventArt value={event.icon || event.title} className="detail-event-art" />
            <div>
              <p>{event.desc}</p>
              <div className="mini-progress"><i><b style={{ width: `${progressPercent(event.progress, event.target)}%` }} /></i><small>{formatNumber(event.progress)} / {formatNumber(event.target)}</small></div>
              <div className="event-rank-inline"><span>{t('yourPoints')} <b>{formatNumber(event.progress)}</b></span><span>{t('eventRank')} <b>#{event.rank || '--'}</b></span></div>
            </div>
          </section>
          <section className="how-to compact-flow">
            <h2><FaInfoCircle /> {t('eventFlow')}</h2>
            <div>
              <article><span><FaCheck /></span><p>{t('completeActivities')}</p></article>
              <article><span><FaFire /></span><p>{t('earnEventPoints')}</p></article>
              <article><span><FaTrophy /></span><p>{t('settleRankRewards')}</p></article>
            </div>
          </section>
          <section className="panel detail-columns event-detail-grid">
            <article><h3>{t('missions')}</h3>{(event.missions || []).map((mission) => <div className="data-row mission-row" key={mission.id || mission.title}><strong>{mission.title}</strong><small>{formatNumber(mission.progress)} / {formatNumber(mission.target)} · +{formatNumber(mission.points || 0)} {t('yourPoints')} · {mission.reward}</small><i><b style={{ width: `${progressPercent(mission.progress, mission.target)}%` }} /></i><button type="button" onClick={() => completeEventMission(event, mission)}>{t('completeMission')}</button></div>)}</article>
            <article><h3>{t('rankRewards')}</h3>{(event.rankRewards || []).map((tier) => <p key={tier.rank}><FaTrophy /> Rank {tier.rank}: {tier.reward}</p>)}</article>
          </section>
          <section className="panel detail-columns">
            <article><h3>{t('milestones')}</h3>{(event.milestones || []).map((milestone) => <p key={milestone.points}><FaGift /> {formatNumber(milestone.points)} pts: {milestone.reward} {milestone.claimed ? `(${t('claimed')})` : ''}</p>)}</article>
            <article><h3>{t('leaderboard')}</h3>{(event.leaderboard || []).slice(0, 5).map((item, index) => <p key={`${item.name}-${index}`} className={item.current ? 'current-rank' : ''}>#{index + 1} {item.name}: {formatNumber(item.points)}</p>)}</article>
          </section>
          <article className="panel detail-card"><h3>{t('rules')}</h3>{(event.rules || []).map((rule) => <p key={rule}><FaInfoCircle /> {tc(rule)}</p>)}</article>
          <div className="detail-actions"><button type="button" onClick={() => claimEvent(event)}>{t('claimAvailableReward')}</button></div>
        </SecondaryPage>
      );
    }

    if (subPage.type === 'shopList') {
      const group = subPage.id || 'coins';
      const list = lobbyData.shop[group] || shopProducts;
      const titles = { coins: t('coinsProducts'), items: t('itemsProducts'), deals: t('dealProducts') };
      return (
        <SecondaryPage title={titles[group] || t('allPackages')} subtitle={t('packageList')} onBack={closeSubPage} t={t}>
          <div className={group === 'deals' ? 'deal-grid shop-list-page' : 'shop-grid shop-list-page'}>
            {list.map((item) => (
              <button key={item.id} type="button" className={item.best ? 'best' : ''} onClick={() => openDetail('product', item.id)}>
                <ProductArt product={{ ...item, productType: group }} className="compact-art" />
                <strong>{item.title || item.id}</strong>
                <span>{item.price || `EC ${item.cost}`}</span>
                <small>{item.desc || item.bonus || item.tag}</small>
              </button>
            ))}
          </div>
        </SecondaryPage>
      );
    }

    if (subPage.type === 'achievement') {
      const ach = lobbyData.profile.achievements.find((item) => item.title === subPage.id) || lobbyData.profile.achievements[0];
      return (
        <SecondaryPage title={ach.title} subtitle={ach.desc} onBack={closeSubPage} t={t}>
          <section className="panel">
            <div className="mini-progress"><i style={{ width: `${progressPercent(ach.value, ach.total)}%` }} /><small>{formatNumber(ach.value)} / {formatNumber(ach.total)}</small></div>
            <div className="detail-card"><h3>{t('reward')}</h3><p>{ach.reward}</p></div>
          </section>
        </SecondaryPage>
      );
    }

    if (subPage.type === 'profileSection') {
      const key = subPage.id;
      const titles = {
        wallet: t('wallet'),
        assets: t('assetDetails'),
        bonus: t('ticketBonusBalance'),
        gifts: t('myGifts'),
        messages: t('messages'),
        security: t('security'),
        support: t('support'),
        history: t('gameHistory'),
        achievements: t('achievements'),
        settings: t('settings'),
        vip: t('vipBenefits'),
      };
      const walletStats = (
        <div className="stat-grid">
          <span><strong>{formatNumber(lobbyData.wallet.coins)}</strong>{t('goldCoins')}</span>
          <span><strong>{formatNumber(lobbyData.wallet.eventCoins)}</strong>{t('eventCoins')}</span>
          <span><strong>{formatNumber(lobbyData.wallet.bonusBalance)}</strong>{t('bonusBalance')}</span>
        </div>
      );
      return (
        <SecondaryPage title={titles[key] || t('profileDetail')} subtitle={t('profileSecondaryPage')} onBack={closeSubPage} t={t}>
          {key === 'wallet' && (
            <section className="panel">
              {walletStats}
              <div className="data-list">{lobbyData.profile.transactions.map((item) => <div className="data-row" key={item.id}><strong>{item.title}</strong><small>{item.amount} - {item.time}</small></div>)}</div>
            </section>
          )}
          {key === 'assets' && (
            <>
              <article className="panel detail-card asset-detail-compact"><h3>{t('assetSnapshot')}</h3>{walletStats}</article>
              <section className="panel data-list">
                <SectionTitle title={t('transactionRecords')} />
                {(lobbyData.profile.transactions || []).map((item) => <div className="data-row" key={item.id}><strong>{item.title}</strong><small>{item.amount} - {item.time}</small></div>)}
              </section>
            </>
          )}
          {key === 'bonus' && (
            <section className="panel">
              <article className="detail-card bonus-balance-card"><h3>{t('ticketBonusBalance')}</h3><strong className="big-number">{formatNumber(lobbyData.wallet.bonusBalance)}</strong></article>
              <div className="data-list">
                {[
                  [t('dailyBonusTicket'), 1800, '+120'],
                  [t('luckyWheelTicket'), 1400, '+80'],
                  [t('eventMissionTicket'), 1480, '+240'],
                ].map(([title, amount, change]) => <div className="data-row" key={title}><strong>{title}</strong><small>{formatNumber(amount)} - {change}</small></div>)}
              </div>
            </section>
          )}
          {key === 'gifts' && <section className="panel data-list">{lobbyData.profile.gifts.map((item) => <div className="data-row" key={item.id}><strong>{item.title}</strong><small>{item.reward} - {item.status}</small></div>)}</section>}
          {key === 'messages' && <section className="panel data-list">{lobbyData.profile.messages.map((item) => <div className="data-row" key={item.id}><strong>{item.title}</strong><small>{item.text}</small></div>)}</section>}
          {key === 'support' && (
            <>
              <section className="panel feedback-form">
                <h3>{t('feedback')}</h3>
                <input value={feedbackForm.title} onChange={(event) => setFeedbackForm((prev) => ({ ...prev, title: event.target.value }))} placeholder={t('feedbackTitle')} />
                <textarea value={feedbackForm.content} onChange={(event) => setFeedbackForm((prev) => ({ ...prev, content: event.target.value }))} placeholder={t('feedbackContent')} />
                <button type="button" onClick={submitFeedback}>{t('submitFeedback')}</button>
              </section>
              <section className="panel data-list">
                <SectionTitle title={t('feedbackHistory')} />
                {(lobbyData.profile.feedbacks || []).map((item) => <div className="data-row" key={item.id}><strong>{item.title}</strong><small>{item.status} - {item.time}</small><p>{item.content}</p></div>)}
              </section>
            </>
          )}
          {key === 'history' && <section className="panel data-list">{lobbyData.profile.history.map((item) => <div className="data-row" key={`${item.game}-${item.time}`}><strong>{item.game}</strong><small>{item.result} - {item.time}</small></div>)}</section>}
          {key === 'achievements' && <section className="panel progress-cards achievement-page">{lobbyData.profile.achievements.map((item) => <button key={item.title} type="button" onClick={() => openSubPage('achievement', item.title)}><span><FaMedal /></span><h3>{item.title}</h3><p>{item.desc}</p><i><b style={{ width: `${progressPercent(item.value, item.total)}%` }} /></i><small>{formatNumber(item.value)} / {formatNumber(item.total)}</small><strong>{t('reward')} {item.reward}</strong></button>)}</section>}
          {key === 'settings' && (
            <section className="panel settings-list">
              <button type="button" onClick={switchLocale}>
                <span><FaShieldAlt /> {t('languageSetting')}</span>
                <strong>{locale === 'zh' ? t('chinese') : t('english')}</strong>
              </button>
              <div className="data-row"><strong>{t('notificationsSetting')}</strong><small>{t('enabled')}</small></div>
            </section>
          )}
          {key === 'vip' && (
            <section className="panel vip-detail">
              <div className="vip-summary">
                <strong>{lobbyData.vip?.currentLevel || lobbyData.user.vip || t('vipNotPurchased')}</strong>
                <span>{t('vipGrowth')} {formatNumber(lobbyData.vip?.growth)} / {formatNumber(lobbyData.vip?.nextGrowth)}</span>
                <i><b style={{ width: `${progressPercent(lobbyData.vip?.growth, lobbyData.vip?.nextGrowth)}%` }} /></i>
                <small>{t('dailyGrowth')} +{formatNumber(lobbyData.vip?.dailyGrowth)} · {t('growthDecay')} -{formatNumber(lobbyData.vip?.decayPerDay)} · {t('expiresIn')} {lobbyData.vip?.expiresIn}</small>
              </div>
              <article className="detail-card"><h3>{t('vipRules')}</h3>{(lobbyData.vip?.rules || [t('vipRuleIntro')]).map((rule) => <p key={rule}><FaInfoCircle /> {tc(rule)}</p>)}</article>
              <div className="vip-level-grid">
                {(lobbyData.vip?.levels || []).map((level) => (
                  <article key={level.level}>
                    <h3>{level.level}</h3>
                    <small>{t('vipGrowth')} {formatNumber(level.needGrowth)}</small>
                    <p>{(level.benefits || []).map(tc).join(' · ')}</p>
                    <strong>{level.dailyReward?.coins ? coinAmount(level.dailyReward.coins, t) : ''} {level.dailyReward?.eventCoins ? `+ ${formatNumber(level.dailyReward.eventCoins)} ${t('eventCoins')}` : ''}</strong>
                    <button type="button" disabled={level.status !== 'available'} onClick={() => claimVipReward(level.level)}>{level.status === 'available' ? t('claimVipReward') : level.status === 'claimed' ? t('claimedStatus') : t('locked')}</button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </SecondaryPage>
      );
    }

    return null;
  };

  const renderDetailContent = () => {
    if (!detailView) return null;

    if (detailView.type === 'game') {
      const game = lobbyData.games.find((item) => String(item.id) === String(detailView.id)) || lobbyData.games[0];
      return (
        <DetailSheet title={game.name} subtitle={`${game.category} - Heat ${game.heat}`} onClose={closeDetail} className="game-detail-panel">
          <div className="detail-hero game-detail-compact">
            <GameArt item={game} className="detail-art" />
            <div>
              <div className="pill-list">{(game.tags || [game.category]).map((tag) => <span key={tag}>{tag}</span>)}</div>
              <p>{t('gameReadyText')}</p>
              <div className="stat-grid compact-stat-grid">
                <span><strong>{game.rtp || 'TBD'}</strong>RTP</span>
                <span><strong>{game.volatility || 'TBD'}</strong>Volatility</span>
                <span><strong>{formatNumber(game.minBet)}</strong>Min Bet</span>
                <span><strong>{formatNumber(game.maxBet)}</strong>Max Bet</span>
              </div>
              <div className="detail-actions compact-actions"><button type="button" onClick={() => playGame(game)}><FaPlay /> {t('playNow')}</button><button type="button" onClick={() => openSubPage('gamesList')}>{t('moreGames')}</button></div>
            </div>
          </div>
          <div className="detail-columns compact-rule-columns">
            <article><h3>{t('features')}</h3>{(game.features || []).map((item) => <p key={item}><FaBolt /> {item}</p>)}</article>
            <article><h3>{t('gameRules')}</h3>{(game.rules || []).map((item) => <p key={item}><FaInfoCircle /> {item}</p>)}</article>
          </div>
        </DetailSheet>
      );
    }

    if (detailView.type === 'gamesList') {
      return (
        <DetailSheet title={t('allGames')} subtitle="Slots and Casual game catalog" onClose={closeDetail}>
          <div className="secondary-grid all-games-grid">
            {lobbyData.games.map((game) => (
              <button key={game.id} type="button" onClick={() => openDetail('game', game.id)}>
                <GameArt item={game} className="secondary-art" />
                <strong>{game.name}</strong>
                <small>{game.category} - {formatNumber(game.players)} players</small>
              </button>
            ))}
          </div>
        </DetailSheet>
      );
    }

    if (detailView.type === 'tournament') {
      const tournament = lobbyData.tournaments.find((item) => item.id === detailView.id) || lobbyData.tournaments[0];
      const detail = tournamentDetails(tournament);
      return (
        <DetailSheet title={tournament.title} subtitle={`${tournament.tag} - ${t('endsIn')} ${tournament.endsIn}`} onClose={closeDetail}>
          <div className="detail-hero">
            <GameArt item={{ title: tournament.title, category: 'tournament' }} className="detail-art" />
            <div>
              <strong className="big-number">{coinAmount(tournament.prizePool, t)}</strong>
              <div className="stat-grid">
                <span><strong>{formatNumber(tournament.players)}</strong>{t('players')}</span>
                <span><strong>{formatNumber(tournament.capacity)}</strong>{t('capacity')}</span>
                <span><strong>#{tournament.rank || '--'}</strong>{t('yourRank')}</span>
                <span><strong>{detail.schedule.payout}</strong>{t('payout')}</span>
              </div>
            </div>
          </div>
          <div className="detail-columns">
            <article><h3>{t('rules')}</h3><ol>{detail.rules.map((rule) => <li key={rule}>{tc(rule)}</li>)}</ol></article>
            <article><h3>{t('participants')}</h3><div className="roster-grid"><span><strong>{formatNumber(detail.roster.active)}</strong>{t('active')}</span><span><strong>{formatNumber(detail.roster.waiting)}</strong>{t('waiting')}</span><span><strong>{formatNumber(detail.roster.eliminated)}</strong>{t('eliminated')}</span><span><strong>{formatNumber(detail.roster.staff)}</strong>{t('staff')}</span></div></article>
          </div>
          <div className="detail-columns">
            <article><h3>{t('rewardTiers')}</h3>{detail.rewardTiers.map((tier) => <p key={tier.rank}><FaTrophy /> Rank {tier.rank}: {tier.reward}</p>)}</article>
            <article><h3>{t('allowedGames')}</h3><div className="pill-list">{detail.allowedGames.map((game) => <span key={game}>{game}</span>)}</div></article>
          </div>
          <div className="detail-actions"><button type="button" onClick={() => setToast(`Joined ${tournament.title}`)}>{t('joinTournament')}</button></div>
        </DetailSheet>
      );
    }

    if (detailView.type === 'event') {
      const event = lobbyData.events.find((item) => item.id === detailView.id) || lobbyData.events[0];
      return (
        <DetailSheet title={event.title} subtitle={`${event.type} - Ends in ${event.endsIn}`} onClose={closeDetail}>
          <div className="event-detail-head">
            <EventArt value={event.icon || event.title} className="detail-event-art" />
            <div><p>{event.desc}</p><div className="mini-progress"><i style={{ width: `${progressPercent(event.progress, event.target)}%` }} /><small>{formatNumber(event.progress)} / {formatNumber(event.target)}</small></div></div>
          </div>
          <div className="detail-columns">
            <article><h3>Missions</h3>{(event.missions || []).map((mission) => <div className="data-row" key={mission.title}><strong>{mission.title}</strong><small>{formatNumber(mission.progress)} / {formatNumber(mission.target)} - {mission.reward}</small><i><b style={{ width: `${progressPercent(mission.progress, mission.target)}%` }} /></i></div>)}</article>
            <article><h3>Milestones</h3>{(event.milestones || []).map((milestone) => <p key={milestone.points}><FaGift /> {formatNumber(milestone.points)} pts: {milestone.reward} {milestone.claimed ? '(claimed)' : ''}</p>)}</article>
          </div>
          <article className="detail-card"><h3>{t('rules')}</h3>{(event.rules || []).map((rule) => <p key={rule}><FaInfoCircle /> {tc(rule)}</p>)}</article>
          <div className="detail-actions"><button type="button" onClick={() => claimEvent(event)}>Claim Available Reward</button></div>
        </DetailSheet>
      );
    }

    if (detailView.type === 'product') {
      const product = shopProducts.find((item) => item.id === detailView.id) || shopProducts[0];
      return (
        <DetailSheet title={product.title || product.id} subtitle={product.productType?.toUpperCase()} onClose={closeDetail}>
          <div className="product-detail">
            <ProductArt product={product} />
            <div>
              <p>{product.desc}</p>
              <strong className="big-number">{product.price || `EC ${product.cost}`}</strong>
              <div className="pill-list">{(product.includes || []).map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          </div>
          <div className="detail-actions"><button type="button" onClick={() => purchaseProduct(product)}>{t('purchase')}</button><button type="button" onClick={() => openSubPage('shopList', product.productType)}>{t('moreProducts')}</button></div>
        </DetailSheet>
      );
    }

    if (detailView.type === 'shopList') {
      const group = detailView.id || 'coins';
      const list = lobbyData.shop[group] || shopProducts;
      return (
        <DetailSheet title={`${group.toUpperCase()} Products`} subtitle="Configurable shop data" onClose={closeDetail}>
          <div className="secondary-grid">
            {list.map((item) => (
              <button key={item.id} type="button" onClick={() => openDetail('product', item.id)}>
                <strong>{item.title || item.id}</strong>
                <small>{item.price || `EC ${item.cost}`}</small>
                <span>{item.desc || item.bonus || item.tag}</span>
              </button>
            ))}
          </div>
        </DetailSheet>
      );
    }

    if (detailView.type === 'dailyRewards') {
      return (
        <DetailSheet title="Daily Rewards" subtitle="Configurable seven-day reward chain" onClose={closeDetail}>
          <div className="reward-table">
            {lobbyData.dailyRewards.map((reward) => (
              <button key={reward.day} type="button" onClick={() => {
                updateWallet(Number(reward.coins || 0), Number(reward.eventCoins || 0));
                setToast(`${reward.day} reward claimed`);
              }}>
                <strong>{reward.day}</strong>
                <span>{reward.amount}</span>
                <small>{reward.collected ? 'Collected' : 'Available'}</small>
              </button>
            ))}
          </div>
        </DetailSheet>
      );
    }

    if (detailView.type === 'wheel') {
      return (
        <DetailSheet title={lobbyData.wheel.title} subtitle={`Free spins: ${lobbyData.wheel.freeSpins} - Reset in ${lobbyData.wheel.resetIn}`} onClose={closeDetail}>
          <div className="wheel-detail">
            <div className="wheel-art"><FaTicketAlt /></div>
            <div className="reward-table">
              {lobbyData.wheel.segments.map((segment) => <button key={segment.label} type="button"><strong>{segment.label}</strong><small>Chance {segment.chance}</small></button>)}
            </div>
          </div>
          <div className="detail-actions"><button type="button" onClick={() => { updateWallet(188, 0); setToast('Wheel reward +188 coins'); }}>Spin Now</button></div>
        </DetailSheet>
      );
    }

    if (detailView.type === 'leaderboard') {
      return (
        <DetailSheet title={t('winnerBoard')} subtitle="Live ranking data" onClose={closeDetail}>
          <div className="data-list">
            {lobbyData.leaderboard.map((item, index) => <div className="data-row" key={item.name}><strong>#{index + 1} {item.name}</strong><small>{coinAmount(item.score, t)}</small></div>)}
          </div>
        </DetailSheet>
      );
    }

    if (detailView.type === 'jackpot') {
      return (
        <DetailSheet title={t('jackpotDetail')} subtitle={lobbyData.jackpot.trigger} onClose={closeDetail}>
          <strong className="big-number">{coinAmount(lobbyData.jackpot.total, t)}</strong>
          <div className="stat-grid"><span><strong>{formatNumber(lobbyData.jackpot.seed)}</strong>Seed</span><span><strong>{lobbyData.jackpot.latestWinners?.length || 0}</strong>Recent Winners</span></div>
          <div className="data-list">{(lobbyData.jackpot.latestWinners || []).map((item) => <div className="data-row" key={`${item.name}-${item.game}`}><strong>{item.name}</strong><small>{item.game} - {coinAmount(item.amount, t)}</small></div>)}</div>
        </DetailSheet>
      );
    }

    if (detailView.type === 'achievement') {
      const ach = lobbyData.profile.achievements.find((item) => item.title === detailView.id) || lobbyData.profile.achievements[0];
      return (
        <DetailSheet title={ach.title} subtitle={ach.desc} onClose={closeDetail}>
          <div className="mini-progress"><i style={{ width: `${progressPercent(ach.value, ach.total)}%` }} /><small>{formatNumber(ach.value)} / {formatNumber(ach.total)}</small></div>
          <div className="detail-card"><h3>Reward</h3><p>{ach.reward}</p></div>
        </DetailSheet>
      );
    }

    if (detailView.type === 'profileSection') {
      const key = detailView.id;
      const titles = {
        wallet: t('wallet'),
        assets: t('assetDetails'),
        bonus: t('ticketBonusBalance'),
        gifts: t('myGifts'),
        messages: t('messages'),
        security: t('security'),
        support: t('support'),
        history: t('gameHistory'),
        achievements: t('achievements'),
        settings: t('settings'),
        vip: t('vipBenefits'),
      };
      const walletStats = (
        <div className="stat-grid">
          <span><strong>{formatNumber(lobbyData.wallet.coins)}</strong>{t('goldCoins')}</span>
          <span><strong>{formatNumber(lobbyData.wallet.eventCoins)}</strong>{t('eventCoins')}</span>
          <span><strong>{formatNumber(lobbyData.wallet.bonusBalance)}</strong>{t('bonusBalance')}</span>
        </div>
      );
      return (
        <DetailSheet title={titles[key] || t('profileDetail')} subtitle={t('profileSecondaryPage')} onClose={closeDetail}>
          {key === 'wallet' && (
            <>
              {walletStats}
              <div className="data-list">{lobbyData.profile.transactions.map((item) => <div className="data-row" key={item.id}><strong>{item.title}</strong><small>{item.amount} - {item.time}</small></div>)}</div>
            </>
          )}
          {key === 'assets' && (
            <>
              <article className="detail-card">
                <h3>{t('assetSnapshot')}</h3>
                {walletStats}
              </article>
              <article className="detail-card">
                <h3>{t('balanceSource')}</h3>
                <p>{t('assetSourceText')}</p>
              </article>
            </>
          )}
          {key === 'bonus' && (
            <>
              <article className="detail-card bonus-balance-card">
                <h3>{t('ticketBonusBalance')}</h3>
                <strong className="big-number">{formatNumber(lobbyData.wallet.bonusBalance)}</strong>
              </article>
              <div className="data-list">
                {[
                  [t('dailyBonusTicket'), 1800, '+120'],
                  [t('luckyWheelTicket'), 1400, '+80'],
                  [t('eventMissionTicket'), 1480, '+240'],
                ].map(([title, amount, change]) => (
                  <div className="data-row" key={title}>
                    <strong>{title}</strong>
                    <small>{formatNumber(amount)} - {change}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          {key === 'gifts' && <div className="data-list">{lobbyData.profile.gifts.map((item) => <div className="data-row" key={item.id}><strong>{item.title}</strong><small>{item.reward} - {item.status}</small></div>)}</div>}
          {key === 'messages' && <div className="data-list">{lobbyData.profile.messages.map((item) => <div className="data-row" key={item.id}><strong>{item.title}</strong><small>{item.text}</small></div>)}</div>}
          {key === 'security' && <div className="data-list">{lobbyData.profile.security.map((item) => <div className="data-row" key={item.title}><strong>{item.title}</strong><small>{item.status}</small></div>)}</div>}
          {key === 'support' && <div className="data-list">{lobbyData.profile.support.map((item) => <div className="data-row" key={item.title}><strong>{item.title}</strong><small>{item.status}</small></div>)}</div>}
          {key === 'history' && <div className="data-list">{lobbyData.profile.history.map((item) => <div className="data-row" key={`${item.game}-${item.time}`}><strong>{item.game}</strong><small>{item.result} - {item.time}</small></div>)}</div>}
          {key === 'settings' && <div className="data-list">{lobbyData.profile.settings.map((item) => <div className="data-row" key={item.title}><strong>{item.title}</strong><small>{item.value}</small></div>)}</div>}
          {key === 'achievements' && <div className="data-list">{lobbyData.profile.achievements.map((item) => <div className="data-row" key={item.title}><strong>{item.title}</strong><small>{formatNumber(item.value)} / {formatNumber(item.total)} - {item.reward}</small></div>)}</div>}
          {key === 'vip' && <div className="detail-columns"><article><h3>{t('benefits')}</h3><p>Priority support</p><p>Extra event coin tasks</p><p>Exclusive tournament rooms</p></article><article><h3>{t('currentLevel')}</h3><strong className="big-number">{lobbyData.user.vip}</strong></article></div>}
        </DetailSheet>
      );
    }

    return null;
  };

  const currentScreen = subPage ? renderSubPage() : {
    lobby: renderLobby,
    tournaments: renderTournaments,
    events: renderEvents,
    shop: renderShop,
    me: renderMe,
  }[activeTab]();

  if (adminMode) return <AdminDashboard />;

  return (
    <div className="app-root">
      <div className="app-shell">
        <TopBar user={lobbyData.user} wallet={lobbyData.wallet} t={t} onWallet={(type) => openSubPage('profileSection', type)} onNotice={() => openSubPage('profileSection', 'messages')} />
        <main>{currentScreen}</main>
        <BottomNav activeTab={activeTab} t={t} onChange={(tab) => { setActiveTab(tab); closeDetail(); closeSubPage(); }} />
      </div>
      <div className="service-pill">{serviceMode}</div>
      {renderDetailContent()}
      {gameFrameUrl && (
        <div className="game-frame-overlay">
          <button type="button" className="lobby-btn" onClick={() => setGameFrameUrl('')}>Lobby</button>
          <iframe src={gameFrameUrl} title="Game" className="game-frame" allow="fullscreen" />
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;

