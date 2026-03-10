import { useEffect, useMemo, useState } from 'react';
import {
  FaBell,
  FaBolt,
  FaCalendarCheck,
  FaChevronRight,
  FaCrown,
  FaFire,
  FaFlag,
  FaGamepad,
  FaGift,
  FaHistory,
  FaHome,
  FaMedal,
  FaPlayCircle,
  FaRocket,
  FaShoppingBag,
  FaStar,
  FaTrophy,
  FaUser,
  FaUsers,
  FaWallet,
} from 'react-icons/fa';
import './App.css';

const tabs = [
  { id: 'lobby', label: '大厅', icon: FaHome },
  { id: 'arena', label: '赛事', icon: FaTrophy },
  { id: 'events', label: '活动', icon: FaCalendarCheck },
  { id: 'store', label: '商城', icon: FaShoppingBag },
  { id: 'profile', label: '我的', icon: FaUser },
];

const heroBanners = [
  {
    title: 'Lucky Spin 狂欢季',
    subtitle: '主奖池 8,880,000 金币',
    badge: '限时 Free Spin x20',
    cta: '立即开转',
    accent: 'var(--accent-orange)',
  },
  {
    title: 'Classic Slot 周挑战',
    subtitle: '经典三轴和五轴 Slot 同台冲榜',
    badge: 'Jackpot 双倍时段',
    cta: '去玩 Slot',
    accent: 'var(--accent-cyan)',
  },
  {
    title: '休闲轻松局',
    subtitle: '捕鱼、消除、跑酷，轻松拿奖励',
    badge: '放松专区上线',
    cta: '马上体验',
    accent: 'var(--accent-green)',
  },
];

const games = [
  { id: 'golden-pharaoh', name: 'Golden Pharaoh', category: 'Slots', players: '4.8k', heat: 99, label: 'JACKPOT' },
  { id: 'ocean-777', name: 'Ocean 777', category: 'Slots', players: '3.9k', heat: 96, label: 'HOT' },
  { id: 'fruit-party', name: 'Fruit Party', category: 'Slots', players: '3.2k', heat: 93, label: 'TREND' },
  { id: 'wild-west', name: 'Wild West Deluxe', category: 'Slots', players: '2.6k', heat: 90, label: 'NEW' },
  { id: 'fish-hunter', name: 'Fish Hunter', category: '休闲', players: '2.1k', heat: 88, label: 'FUN' },
  { id: 'bubble-pop', name: 'Bubble Pop', category: '休闲', players: '1.7k', heat: 84, label: 'EASY' },
  { id: 'dice-merge', name: 'Dice Merge', category: '休闲', players: '1.4k', heat: 82, label: 'RELAX' },
  { id: 'mini-golf', name: 'Mini Golf Rush', category: '休闲', players: '1.1k', heat: 80, label: 'COZY' },
];

const quickActions = [
  { id: 'freespin', title: '免费旋转', sub: '领取今日 Free Spin', icon: FaGift },
  { id: 'jackpot', title: 'Jackpot 池', sub: '查看实时大奖金额', icon: FaBolt },
  { id: 'mission', title: '新手任务', sub: '完成任务加速成长', icon: FaFlag },
  { id: 'history', title: '最近中奖', sub: '查看最近 20 条记录', icon: FaHistory },
];

const arenaCards = [
  {
    id: 'slot-ladder',
    title: 'Slot 冲榜赛',
    mode: 'Mega Ways 模式',
    prize: '￥ 88,888',
    team: '1,122 / 2,000 名玩家',
    progress: 56,
    entryFee: '2,000 金币',
    requirement: '账号等级 >= 5',
    settlement: '每晚 22:10 统一结算',
    rules: [
      '每 50 次有效旋转记 1 局，单次旋转最低 20 金币。',
      '仅统计当日 00:00 - 22:00 的净收益作为赛事积分。',
      '中途退出保留已得积分，重新进入不重置。'
    ],
    personnel: [
      { label: '已报名', value: '1,122' },
      { label: '在线中', value: '846' },
      { label: '等待中', value: '138' },
      { label: '已淘汰', value: '92' }
    ],
    rewards: [
      '第 1 名：68,000 金币 + 180 活动币',
      '第 2-10 名：8,000 金币 + 60 活动币',
      '第 11-100 名：2,000 金币 + 20 活动币'
    ],
  },
  {
    id: 'jackpot-cup',
    title: 'Jackpot 争夺赛',
    mode: 'Progressive Slot',
    prize: '￥ 28,000',
    team: '932 / 1,500 名玩家',
    progress: 62,
    entryFee: '1,500 金币',
    requirement: '近 3 天内有 1 次 Slot 记录',
    settlement: '每晚 21:40 统一结算',
    rules: [
      '赛事期间触发 Jackpot 可获得额外积分加成。',
      '单局最高积分按净赢金币分段计算，上限 10,000 分。',
      '若积分相同，按完成局数较少者排名更高。'
    ],
    personnel: [
      { label: '已报名', value: '932' },
      { label: '在线中', value: '664' },
      { label: '等待中', value: '120' },
      { label: '已淘汰', value: '58' }
    ],
    rewards: [
      '第 1 名：28,000 金币 + 120 活动币',
      '第 2-20 名：3,000 金币 + 36 活动币',
      '参与奖：300 金币 + 6 活动币'
    ],
  },
  {
    id: 'casual-cup',
    title: '休闲积分挑战',
    mode: '捕鱼 + 消除',
    prize: '￥ 12,000',
    team: '488 / 800 名玩家',
    progress: 61,
    entryFee: '800 金币',
    requirement: '账号等级 >= 3',
    settlement: '每晚 20:30 统一结算',
    rules: [
      '仅统计休闲专区指定游戏，不计入 Slot 局数。',
      '每局胜利 +3 分，失败 +1 分，连胜有额外乘区。',
      '禁止代打与脚本操作，检测异常将取消资格。'
    ],
    personnel: [
      { label: '已报名', value: '488' },
      { label: '在线中', value: '352' },
      { label: '等待中', value: '84' },
      { label: '已淘汰', value: '26' }
    ],
    rewards: [
      '第 1 名：12,000 金币 + 80 活动币',
      '第 2-30 名：1,200 金币 + 18 活动币',
      '参与奖：150 金币 + 3 活动币'
    ],
  },
];

const arenaGlobalRules = [
  '所有赛事均使用金币报名，活动币仅用于活动商店兑换。',
  '每日同一账号最多报名 3 场赛事，重复报名将自动退回手续费后拒绝。',
  '若网络中断超过 3 分钟，系统将以中断前最后一局成绩结算。',
  '赛果以服务器记录为准，最终解释权归 cocogames 赛事中心。'
];

const arenaPopulation = [
  { label: '当前在线参赛', value: 1862, ratio: 93 },
  { label: '已报名待开赛', value: 342, ratio: 42 },
  { label: '候补队列', value: 118, ratio: 28 },
  { label: '裁判与风控席位', value: 24, ratio: 12 }
];

const missionSeed = [
  { id: 'm1', title: '累计旋转 100 次', progress: 68, total: 100, coinReward: 300, tokenReward: 4 },
  { id: 'm2', title: '完成 5 局休闲游戏', progress: 3, total: 5, coinReward: 200, tokenReward: 6 },
  { id: 'm3', title: '触发 1 次 Free Spin', progress: 1, total: 1, coinReward: 500, tokenReward: 8 },
  { id: 'm4', title: '分享一次中奖记录', progress: 0, total: 1, coinReward: 120, tokenReward: 3 },
];

const coinPacks = [
  { id: 'p1', coin: '6,000', bonus: '+8%', price: '￥6', tag: '首充', tokenBonus: 2 },
  { id: 'p2', coin: '30,000', bonus: '+18%', price: '￥30', tag: '热门', tokenBonus: 10 },
  { id: 'p3', coin: '68,000', bonus: '+28%', price: '￥68', tag: '超值', tokenBonus: 25 },
  { id: 'p4', coin: '128,000', bonus: '+40%', price: '￥128', tag: '推荐', tokenBonus: 50 },
];

const leaderboard = [
  { name: 'ReelMaster', score: 128800, streak: '最高连中 6 次' },
  { name: 'LuckyBean', score: 106420, streak: '最高连中 5 次' },
  { name: 'SpinKing', score: 98880, streak: '触发 3 次 Jackpot' },
  { name: 'FishHero', score: 87500, streak: '休闲连胜 9 局' },
];

const profileRecords = [
  { id: 'r1', game: 'Golden Pharaoh', type: 'Slots', coin: 12600, token: 6, time: '今天 20:18' },
  { id: 'r2', game: 'Fish Hunter', type: '休闲', coin: -1200, token: 1, time: '今天 18:52' },
  { id: 'r3', game: 'Ocean 777', type: 'Slots', coin: 8800, token: 4, time: '今天 16:10' },
  { id: 'r4', game: 'Bubble Pop', type: '休闲', coin: 900, token: 2, time: '今天 14:36' },
  { id: 'r5', game: 'Wild West Deluxe', type: 'Slots', coin: -3600, token: 0, time: '今天 12:28' },
];

const profileSecurity = [
  { label: '手机号绑定', value: '138****6651', status: '已完成' },
  { label: '登录保护', value: '设备验证已开启', status: '已开启' },
  { label: '支付密码', value: '已设置，7 天前更新', status: '正常' },
  { label: '异常登录检测', value: '近 30 天无风险', status: '安全' },
];

function App() {
  const [activeTab, setActiveTab] = useState('lobby');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [coins, setCoins] = useState(228680);
  const [activityCoins, setActivityCoins] = useState(420);
  const [toast, setToast] = useState('');
  const [pickedDays, setPickedDays] = useState([true, true, false, false, false, false, false]);
  const [missions, setMissions] = useState(missionSeed);
  const [spinAngle, setSpinAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = setTimeout(() => setToast(''), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(() => ['全部', ...new Set(games.map((item) => item.category))], []);

  const displayGames = useMemo(() => {
    if (activeCategory === '全部') {
      return games;
    }
    return games.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const currentBanner = heroBanners[bannerIndex];
  const renderRewardText = (coinReward, tokenReward) => `${coinReward} 金币 + ${tokenReward} 活动币`;

  const claimDay = (index) => {
    if (pickedDays[index]) {
      return;
    }
    const next = [...pickedDays];
    next[index] = true;
    setPickedDays(next);
    const coinGain = index === 6 ? 588 : 188;
    const tokenGain = index === 6 ? 6 : 1;
    setCoins((prev) => prev + coinGain);
    setActivityCoins((prev) => prev + tokenGain);
    setToast(`签到成功 +${coinGain} 金币 +${tokenGain} 活动币`);
  };

  const claimMission = (id) => {
    const mission = missions.find((item) => item.id === id);
    if (!mission || mission.progress < mission.total) {
      setToast('任务未完成');
      return;
    }
    const coinGain = mission.coinReward ?? 0;
    const tokenGain = mission.tokenReward ?? 0;
    setCoins((prev) => prev + coinGain);
    setActivityCoins((prev) => prev + tokenGain);
    setMissions((prev) => prev.filter((item) => item.id !== id));
    setToast(`任务奖励 +${coinGain} 金币 +${tokenGain} 活动币`);
  };

  const spinLuckyWheel = () => {
    if (isSpinning) {
      return;
    }
    setIsSpinning(true);
    const delta = 1800 + Math.floor(Math.random() * 360);
    setSpinAngle((prev) => prev + delta);
    window.setTimeout(() => {
      setIsSpinning(false);
      const reward = [
        { coin: 188, token: 0 },
        { coin: 388, token: 2 },
        { coin: 588, token: 4 },
        { coin: 888, token: 8 },
      ][Math.floor(Math.random() * 4)];
      setCoins((prev) => prev + reward.coin);
      setActivityCoins((prev) => prev + reward.token);
      setToast(`转盘奖励 +${reward.coin} 金币 +${reward.token} 活动币`);
    }, 3600);
  };

  const buyPack = (pack) => {
    const amount = Number(pack.coin.replaceAll(',', ''));
    const bonusRate = Number(pack.bonus.replace('+', '').replace('%', '')) / 100;
    const total = Math.round(amount * (1 + bonusRate));
    const tokenBonus = pack.tokenBonus ?? 0;
    setCoins((prev) => prev + total);
    setActivityCoins((prev) => prev + tokenBonus);
    setToast(`充值到账 ${total.toLocaleString()} 金币 +${tokenBonus} 活动币`);
  };

  const launchGame = (game) => {
    setSelectedGame(game);
  };

  const renderSectionHeader = (title, desc, action = '查看更多') => (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      <button className="text-action" type="button">
        {action}
        <FaChevronRight />
      </button>
    </div>
  );

  const renderLobby = () => (
    <div className="page-stack">
      <section className="hero-card" style={{ '--hero-accent': currentBanner.accent }}>
        <span className="hero-badge">{currentBanner.badge}</span>
        <h1>{currentBanner.title}</h1>
        <p>{currentBanner.subtitle}</p>
        <div className="hero-actions">
          <button type="button" className="btn-primary">
            <FaPlayCircle />
            {currentBanner.cta}
          </button>
          <button type="button" className="btn-glass">
            <FaGift />
            福利中心
          </button>
        </div>
        <div className="hero-dots" aria-hidden="true">
          {heroBanners.map((_, index) => (
            <span key={index} className={index === bannerIndex ? 'dot active' : 'dot'} />
          ))}
        </div>
      </section>

      <section className="card-shell quick-panel">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              type="button"
              key={action.id}
              className="quick-action"
              style={{ animationDelay: `${index * 90}ms` }}
              onClick={() => setToast(`${action.title} 已打开`)}
            >
              <div className="quick-icon">
                <Icon />
              </div>
              <div>
                <h3>{action.title}</h3>
                <p>{action.sub}</p>
              </div>
            </button>
          );
        })}
      </section>

      <section className="card-shell">
        {renderSectionHeader('热门 Slot 与休闲', '主打 Slot，补充轻量休闲游戏，支持即点即玩')}
        <div className="category-row">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={category === activeCategory ? 'chip active' : 'chip'}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="game-grid">
          {displayGames.map((game, index) => (
            <button
              type="button"
              key={game.id}
              className="game-card"
              style={{ animationDelay: `${120 + index * 70}ms` }}
              onClick={() => launchGame(game)}
            >
              <div className="game-thumb" aria-hidden="true">
                <span>{game.label}</span>
                <FaGamepad />
              </div>
              <div className="game-meta">
                <h3>{game.name}</h3>
                <p>{game.category}</p>
                <div className="game-row">
                  <span>
                    <FaUsers /> {game.players}
                  </span>
                  <span>
                    <FaFire /> {game.heat}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="card-shell">
        {renderSectionHeader('今日赢家榜', 'Slot 与休闲游戏实时赢币排行', '完整榜单')}
        <div className="leaderboard-list">
          {leaderboard.map((item, idx) => (
            <div className="leaderboard-item" key={item.name}>
              <div className="rank-badge">#{idx + 1}</div>
              <div>
                <h3>{item.name}</h3>
                <p>{item.streak}</p>
              </div>
              <strong>{item.score}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderArena = () => (
    <div className="page-stack">
      <section className="card-shell headline-shell">
        <h2>Slot 赛事</h2>
        <p>规则透明、人数可见，所有赛事按统一结算标准发奖。</p>
      </section>

      <section className="card-shell arena-policy-shell">
        {renderSectionHeader('赛事通用规则', '报名前请先确认规则和结算时间', '完整规则')}
        <ul className="arena-list">
          {arenaGlobalRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      {arenaCards.map((card, index) => (
        <section className="card-shell arena-card" key={card.id} style={{ animationDelay: `${index * 100}ms` }}>
          <div className="arena-head">
            <div>
              <h3>{card.title}</h3>
              <p>{card.mode}</p>
            </div>
            <span className="arena-prize">
              <FaMedal /> {card.prize}
            </span>
          </div>
          <div className="arena-meta-grid">
            <article className="arena-metric">
              <span>报名费</span>
              <strong>{card.entryFee}</strong>
            </article>
            <article className="arena-metric">
              <span>参赛要求</span>
              <strong>{card.requirement}</strong>
            </article>
            <article className="arena-metric">
              <span>结算时间</span>
              <strong>{card.settlement}</strong>
            </article>
          </div>
          <div className="arena-progress-label">
            <span>{card.team}</span>
            <span>{card.progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-value" style={{ width: `${card.progress}%` }} />
          </div>
          <div className="arena-detail-grid">
            <article className="arena-block">
              <h4>规则说明</h4>
              <ul className="arena-list">
                {card.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </article>
            <article className="arena-block">
              <h4>人员情况</h4>
              <div className="roster-grid">
                {card.personnel.map((info) => (
                  <div className="roster-item" key={info.label}>
                    <span>{info.label}</span>
                    <strong>{info.value}</strong>
                  </div>
                ))}
              </div>
            </article>
            <article className="arena-block">
              <h4>奖励发放</h4>
              <ul className="arena-list reward-list">
                {card.rewards.map((reward) => (
                  <li key={reward}>{reward}</li>
                ))}
              </ul>
            </article>
          </div>
          <button type="button" className="btn-primary" onClick={() => setToast(`已报名 ${card.title}`)}>
            <FaFlag />
            报名参赛
          </button>
        </section>
      ))}

      <section className="card-shell timeline-shell">
        <h3>今日赛事时段</h3>
        <div className="timeline-item">
          <span>13:00</span>
          <p>经典 Slot 冲榜场</p>
        </div>
        <div className="timeline-item">
          <span>17:30</span>
          <p>休闲积分赛</p>
        </div>
        <div className="timeline-item">
          <span>21:00</span>
          <p>Jackpot 决胜局</p>
        </div>
      </section>

      <section className="card-shell population-shell">
        <h3>全站参赛人员情况</h3>
        <div className="population-list">
          {arenaPopulation.map((item) => (
            <article className="population-item" key={item.label}>
              <div className="population-head">
                <span>{item.label}</span>
                <strong>{item.value.toLocaleString()}</strong>
              </div>
              <div className="progress-track">
                <div className="progress-value" style={{ width: `${item.ratio}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderEvents = () => (
    <div className="page-stack">
      <section className="card-shell split-shell">
        <div>
          <h2>7 日签到</h2>
          <p>连续签到可领取 Free Spin 和金币。</p>
          <div className="checkin-grid">
            {pickedDays.map((picked, index) => (
              <button
                type="button"
                key={index}
                className={picked ? 'checkin-day done' : 'checkin-day'}
                onClick={() => claimDay(index)}
              >
                <span>D{index + 1}</span>
                <strong>{picked ? '已领' : '领取'}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card-shell split-shell">
        <div>
          <h2>幸运转盘</h2>
          <p>每日 3 次免费机会，转中最高奖励 888 金币。</p>
          <div className="wheel-wrap">
            <div
              className={isSpinning ? 'wheel spinning' : 'wheel'}
              style={{ transform: `rotate(${spinAngle}deg)` }}
              aria-hidden="true"
            >
              <span>188</span>
              <span>388</span>
              <span>588</span>
              <span>888</span>
            </div>
            <button type="button" className="wheel-btn" onClick={spinLuckyWheel}>
              <FaBolt /> 抽取
            </button>
          </div>
        </div>
      </section>

      <section className="card-shell">
        {renderSectionHeader('每日任务', '完成 Slot 与休闲任务，快速积累资源')}
        <div className="mission-list">
          {missions.map((mission) => {
            const percent = Math.round((mission.progress / mission.total) * 100);
            return (
              <article className="mission-item" key={mission.id}>
                <div>
                  <h3>{mission.title}</h3>
                  <p>{renderRewardText(mission.coinReward, mission.tokenReward)}</p>
                </div>
                <div className="mission-track">
                  <div className="progress-track">
                    <div className="progress-value" style={{ width: `${percent}%` }} />
                  </div>
                  <span>
                    {mission.progress}/{mission.total}
                  </span>
                </div>
                <button type="button" className="btn-glass" onClick={() => claimMission(mission.id)}>
                  领取
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderStore = () => (
    <div className="page-stack">
      <section className="card-shell headline-shell">
        <h2>Slot 金币商城</h2>
        <p>专为 Slot 与休闲局准备的金币礼包，到账更快。</p>
      </section>

      <section className="card-shell">
        <div className="pack-grid">
          {coinPacks.map((pack, index) => (
            <article className="pack-card" key={pack.id} style={{ animationDelay: `${index * 80}ms` }}>
              <span className="pack-tag">{pack.tag}</span>
              <h3>{pack.coin}</h3>
              <p>金币</p>
              <p>送 {pack.tokenBonus} 活动币</p>
              <strong>{pack.bonus}</strong>
              <button type="button" className="btn-primary" onClick={() => buyPack(pack)}>
                <FaWallet /> {pack.price}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="card-shell vip-shell">
        <div>
          <h3>Slot 月度特权卡</h3>
          <p>每天 1,000 金币 + 12 活动币 + 2 次免费旋转</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setActivityCoins((prev) => prev + 120);
            setToast('已开通月卡，赠送 120 活动币');
          }}
        >
          <FaCrown /> 立即开通
        </button>
      </section>

      <section className="card-shell exchange-shell">
        <h3>兑换码中心</h3>
        <div className="exchange-row">
          <input placeholder="输入兑换码" />
          <button type="button" className="btn-glass" onClick={() => setToast('兑换码已提交')}>
            兑换
          </button>
        </div>
      </section>
    </div>
  );

  const renderProfile = () => (
    <div className="page-stack">
      <section className="card-shell profile-hero">
        <div className="profile-top">
          <div className="avatar-ring">N</div>
          <div>
            <h2>NovaPlayer</h2>
            <p>ID: 98271631</p>
          </div>
        </div>
        <div className="stats-grid">
          <article>
            <span>总旋转</span>
            <strong>12,480</strong>
          </article>
          <article>
            <span>最高单次中奖</span>
            <strong>88,800</strong>
          </article>
          <article>
            <span>连中记录</span>
            <strong>9</strong>
          </article>
          <article>
            <span>本周收益</span>
            <strong>+12,640</strong>
          </article>
        </div>
      </section>

      <section className="card-shell">
        {renderSectionHeader('资产总览', '仅使用金币与活动币', '账单明细')}
        <div className="asset-grid">
          <article>
            <span>金币余额</span>
            <strong>{coins.toLocaleString()}</strong>
            <p>可用于 Slot 与休闲游戏内消耗</p>
          </article>
          <article>
            <span>活动币余额</span>
            <strong>{activityCoins.toLocaleString()}</strong>
            <p>可在活动商店兑换入场券与外观</p>
          </article>
          <article>
            <span>今日金币净收益</span>
            <strong>+4,680</strong>
            <p>来自 26 局 Slot 与 8 局休闲</p>
          </article>
          <article>
            <span>今日活动币获得</span>
            <strong>+18</strong>
            <p>来源：任务、签到、转盘</p>
          </article>
        </div>
      </section>

      <section className="card-shell">
        {renderSectionHeader('成就进度', '解锁 Slot 与休闲成就可获得稀有称号')}
        <div className="achievement-list">
          <article>
            <div>
              <h3>百转达人</h3>
              <p>累计完成 1,000 次旋转</p>
            </div>
            <span>82%</span>
          </article>
          <article>
            <div>
              <h3>Jackpot 猎手</h3>
              <p>累计触发 20 次 Jackpot</p>
            </div>
            <span>48%</span>
          </article>
          <article>
            <div>
              <h3>休闲王者</h3>
              <p>在休闲游戏中获胜 100 局</p>
            </div>
            <span>61%</span>
          </article>
        </div>
      </section>

      <section className="card-shell">
        {renderSectionHeader('最近战绩', '展示最近 5 局金币与活动币变化', '更多记录')}
        <div className="record-list">
          {profileRecords.map((record) => (
            <article className="record-item" key={record.id}>
              <div>
                <h3>{record.game}</h3>
                <p>
                  {record.type} · {record.time}
                </p>
              </div>
              <div className="record-change">
                <strong className={record.coin >= 0 ? 'record-up' : 'record-down'}>
                  {record.coin >= 0 ? '+' : ''}
                  {record.coin.toLocaleString()} 金币
                </strong>
                <span>+{record.token} 活动币</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card-shell">
        {renderSectionHeader('账号与安全', '设备、支付、登录保护状态', '安全中心')}
        <div className="account-list">
          {profileSecurity.map((item) => (
            <article className="account-item" key={item.label}>
              <div>
                <h3>{item.label}</h3>
                <p>{item.value}</p>
              </div>
              <span>{item.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="card-shell settings-list">
        <button type="button" onClick={() => setToast('音效设置已更新')}>
          <FaBell /> 音效与震动
          <FaChevronRight />
        </button>
        <button type="button" onClick={() => setToast('自动旋转设置已更新')}>
          <FaBolt /> 自动旋转设置
          <FaChevronRight />
        </button>
        <button type="button" onClick={() => setToast('奖励中心已打开')}>
          <FaStar /> 奖励中心
          <FaChevronRight />
        </button>
      </section>
    </div>
  );

  const renderCurrentTab = () => {
    if (activeTab === 'arena') {
      return renderArena();
    }
    if (activeTab === 'events') {
      return renderEvents();
    }
    if (activeTab === 'store') {
      return renderStore();
    }
    if (activeTab === 'profile') {
      return renderProfile();
    }
    return renderLobby();
  };

  return (
    <div className="app-root">
      <div className="bg-layer" aria-hidden="true" />

      <header className="top-bar">
        <div className="brand">
          <div className="logo-dot" />
          <div>
            <strong>cocogames</strong>
            <span>slot & casual lobby</span>
          </div>
        </div>
        <div className="wallet-box">
          <div>
            <span>金币</span>
            <strong>{coins.toLocaleString()}</strong>
          </div>
          <div>
            <span>活动币</span>
            <strong>{activityCoins.toLocaleString()}</strong>
          </div>
        </div>
      </header>

      <main className="content-shell">{renderCurrentTab()}</main>

      <nav className="bottom-nav" aria-label="主导航">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              className={activeTab === tab.id ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {selectedGame && (
        <div className="modal-mask" onClick={() => setSelectedGame(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedGame.name}</h3>
              <button type="button" onClick={() => setSelectedGame(null)}>
                关闭
              </button>
            </div>
            <p>{selectedGame.category} | 实时在线 {selectedGame.players}</p>
            <div className="modal-preview" aria-hidden="true">
              <FaRocket />
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setToast(`正在进入 ${selectedGame.name}`);
                setSelectedGame(null);
              }}
            >
              <FaPlayCircle /> 立即开始
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
