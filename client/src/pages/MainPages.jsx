import SectionHeader from '../components/ui/SectionHeader';
import ProgressBar from '../components/ui/ProgressBar';
import SpriteIcon from '../components/SpriteIcon';

export function LobbyPage({
  currentHero,
  heroIndex,
  heroSlides,
  quickActions,
  categories,
  activeCategory,
  setActiveCategory,
  filteredGames,
  announcements,
  leaderboard,
  openDetail,
}) {
  return (
    <div className="page-stack">
      <section className="surface-card hero-panel" style={{ '--hero-accent': currentHero.accent }}>
        <div className="hero-copy">
          <span className="hero-badge">{currentHero.badge}</span>
          <h1>{currentHero.title}</h1>
          <p>{currentHero.subtitle}</p>
          <div className="hero-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => openDetail('game', { gameId: currentHero.gameId })}
            >
              立即开玩
            </button>
            <button type="button" className="ghost-btn" onClick={() => openDetail('benefits')}>
              福利中心
            </button>
          </div>
          <div className="hero-dots" aria-hidden="true">
            {heroSlides.map((item, index) => (
              <span key={item.id} className={index === heroIndex ? 'hero-dot active' : 'hero-dot'} />
            ))}
          </div>
        </div>

        <div className="hero-showcase">
          <div className="hero-art">
            <SpriteIcon name={currentHero.cover} size={116} />
          </div>
          <div className="hero-meter">
            <span>实时奖池</span>
            <strong>{filteredGames.find((game) => game.id === currentHero.gameId)?.jackpot ?? '8.88M'}</strong>
            <p>高热房同时开放</p>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <article className="surface-card stat-card">
          <SpriteIcon name="jackpot" size={30} />
          <div>
            <span>当前大奖池</span>
            <strong>23.6M</strong>
          </div>
        </article>
        <article className="surface-card stat-card">
          <SpriteIcon name="trophy" size={30} />
          <div>
            <span>赛事在线</span>
            <strong>1,862</strong>
          </div>
        </article>
        <article className="surface-card stat-card">
          <SpriteIcon name="gift" size={30} />
          <div>
            <span>福利待领取</span>
            <strong>3 项</strong>
          </div>
        </article>
      </section>

      <section className="surface-card">
        <SectionHeader title="快捷入口" desc="围绕当前大厅结构整理的高频入口" />
        <div className="feature-grid">
          {quickActions.map((action) => (
            <button
              type="button"
              key={action.id}
              className="feature-card"
              onClick={() => openDetail(action.detail)}
            >
              <SpriteIcon name={action.sprite} size={38} />
              <div>
                <h3>{action.title}</h3>
                <p>{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <SectionHeader
          title="游戏大厅"
          desc="统一改成精灵图驱动的游戏卡片与详情流"
          action="公告速递"
          onAction={() => openDetail('notice')}
        />
        <div className="chip-row">
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
          {filteredGames.map((game) => (
            <button
              type="button"
              key={game.id}
              className="game-card"
              onClick={() => openDetail('game', { gameId: game.id })}
            >
              <div className="game-art">
                <span className="game-tag">{game.tag}</span>
                <SpriteIcon name={game.cover} size={80} />
              </div>
              <div className="game-body">
                <div className="game-title-row">
                  <h3>{game.name}</h3>
                  <span>{game.category}</span>
                </div>
                <p>{game.summary}</p>
                <div className="game-meta">
                  <strong>{game.players} 在线</strong>
                  <span>热度 {game.heat}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card split-layout">
        <div>
          <SectionHeader title="公告流" desc="版本、活动、奖池和系统播报" />
          <div className="stack-list">
            {announcements.slice(0, 3).map((item) => (
              <article className="stack-item" key={item.title}>
                <span className="item-tag">{item.tag}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="今日赢家榜" desc="大厅中实时展示的高分榜单" />
          <div className="leaderboard-list">
            {leaderboard.map((item, index) => (
              <article className="leaderboard-item" key={item.name}>
                <span className="rank-pill">#{index + 1}</span>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.note}</p>
                </div>
                <strong>{item.score}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ArenaPage({ tournaments, arenaPopulation, globalRules, openDetail }) {
  return (
    <div className="page-stack">
      <section className="surface-card headline-card">
        <div>
          <p className="eyebrow">Arena Center</p>
          <h1>赛事大厅</h1>
          <p>补齐赛事一级页与赛事详情页，支持从报名到规则查看的完整闭环。</p>
        </div>
        <button type="button" className="ghost-btn dark" onClick={() => openDetail('arenaRules')}>
          查看通用规则
        </button>
      </section>

      <section className="surface-card">
        <SectionHeader title="赛事总览" desc="全站人员分布和报名热度" />
        <div className="population-grid">
          {arenaPopulation.map((item) => (
            <article className="population-card" key={item.label}>
              <div className="population-head">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <ProgressBar value={item.ratio} />
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <SectionHeader title="赛事列表" desc="每张卡片都对应独立二级详情页" />
        <div className="tournament-grid">
          {tournaments.map((card) => (
            <article className="tournament-card" key={card.id}>
              <div className="tournament-top">
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.subtitle}</p>
                </div>
                <span className="prize-pill">{card.prize}</span>
              </div>
              <div className="mini-rows">
                <span>报名费 {card.entryFee}</span>
                <span>{card.capacity}</span>
              </div>
              <ProgressBar value={card.progress} />
              <p className="summary-text">{card.summary}</p>
              <button
                type="button"
                className="primary-btn slim"
                onClick={() => openDetail('tournament', { tournamentId: card.id })}
              >
                查看赛事详情
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <SectionHeader title="赛事规则摘要" desc="一级页只展示摘要，完整规则放入二级页" />
        <ul className="rule-list">
          {globalRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function EventsPage({ eventCards, missions, openDetail, activityCoins }) {
  return (
    <div className="page-stack">
      <section className="surface-card headline-card">
        <div>
          <p className="eyebrow">Events Hub</p>
          <h1>活动中心</h1>
          <p>将签到、转盘、任务和邀请拆成完整的活动子页面，而不再停留在弹层。</p>
        </div>
      </section>

      <section className="surface-card">
        <SectionHeader title="活动入口" desc="四张主卡直达四个二级页面" />
        <div className="event-grid">
          {eventCards.map((item) => (
            <button
              type="button"
              key={item.id}
              className="event-card"
              onClick={() => openDetail(item.detail)}
            >
              <SpriteIcon name={item.sprite} size={54} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card split-layout">
        <div>
          <SectionHeader title="本周活动币进度" desc="用来驱动活动页和商城的联动" />
          <div className="stack-list">
            <article className="stack-item compact">
              <span className="item-tag">进度</span>
              <div>
                <h3>活动币累计 {activityCoins}</h3>
                <p>距离换取高级入场券还差 80。</p>
              </div>
            </article>
            <article className="stack-item compact">
              <span className="item-tag">提醒</span>
              <div>
                <h3>幸运转盘剩余 3 次</h3>
                <p>建议先转盘再做日常任务，提高活动币效率。</p>
              </div>
            </article>
          </div>
        </div>

        <div className="mission-preview">
          <SectionHeader title="任务预览" desc="未完成任务会直接在二级页领取" />
          {missions.map((mission) => {
            const progress = Math.round((mission.progress / mission.total) * 100);
            return (
              <article className="mission-row" key={mission.id}>
                <div>
                  <h3>{mission.title}</h3>
                  <p>
                    奖励 {mission.coinReward} 金币 + {mission.tokenReward} 活动币
                  </p>
                </div>
                <div className="mission-progress">
                  <ProgressBar value={progress} />
                  <span>
                    {mission.progress}/{mission.total}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function StorePage({ coinPacks, openDetail }) {
  return (
    <div className="page-stack">
      <section className="surface-card headline-card">
        <div>
          <p className="eyebrow">Store</p>
          <h1>商城中心</h1>
          <p>将礼包、月卡、兑换码中心分别拆成单独页面，支持直接开发支付与兑换流。</p>
        </div>
      </section>

      <section className="surface-card">
        <SectionHeader title="金币礼包" desc="礼包详情页包含价格结构与购买说明" />
        <div className="pack-grid">
          {coinPacks.map((pack) => (
            <article className="pack-card" key={pack.id}>
              <span className="pack-tag">{pack.tag}</span>
              <SpriteIcon name="coin" size={44} />
              <h3>{pack.coin}</h3>
              <p>金币</p>
              <strong>{pack.bonus}</strong>
              <span>赠送 {pack.tokenBonus} 活动币</span>
              <button
                type="button"
                className="primary-btn slim"
                onClick={() => openDetail('pack', { packId: pack.id })}
              >
                进入礼包详情
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card split-layout">
        <article className="vip-panel">
          <div>
            <p className="eyebrow">VIP Card</p>
            <h3>月度特权卡</h3>
            <p>每天 1,000 金币 + 12 活动币 + 2 次免费旋转。</p>
          </div>
          <button type="button" className="ghost-btn dark" onClick={() => openDetail('vipCard')}>
            查看月卡详情
          </button>
        </article>

        <article className="redeem-teaser">
          <div>
            <p className="eyebrow">Redeem</p>
            <h3>兑换码中心</h3>
            <p>补齐输入、校验、历史记录和说明页。</p>
          </div>
          <button type="button" className="ghost-btn dark" onClick={() => openDetail('redeemCenter')}>
            进入兑换中心
          </button>
        </article>
      </section>
    </div>
  );
}

export function ProfilePage({ coins, activityCoins, profileRecords, securityStatus, openDetail, formatNumber }) {
  return (
    <div className="page-stack">
      <section className="surface-card profile-hero">
        <div className="profile-head">
          <div className="avatar-shell">
            <SpriteIcon name="profile" size={52} />
          </div>
          <div>
            <h1>NovaPlayer</h1>
            <p>ID 98271631 · Slot 与休闲双线玩家</p>
          </div>
        </div>
        <div className="profile-stats">
          <article>
            <span>总旋转</span>
            <strong>12,480</strong>
          </article>
          <article>
            <span>最高单次中奖</span>
            <strong>88,800</strong>
          </article>
          <article>
            <span>本周收益</span>
            <strong>+12,640</strong>
          </article>
          <article>
            <span>连续胜利</span>
            <strong>9</strong>
          </article>
        </div>
      </section>

      <section className="surface-card">
        <SectionHeader title="资产总览" desc="账单、收支和分布全部拆到资产二级页" action="查看资产页" onAction={() => openDetail('wallet')} />
        <div className="asset-grid">
          <article>
            <span>金币余额</span>
            <strong>{formatNumber(coins)}</strong>
            <p>主大厅、赛事、玩法房间统一使用。</p>
          </article>
          <article>
            <span>活动币余额</span>
            <strong>{formatNumber(activityCoins)}</strong>
            <p>可换入场券、外观和特权道具。</p>
          </article>
          <article>
            <span>今日净收益</span>
            <strong>+4,680</strong>
            <p>来自 26 局 Slot 与 8 局休闲。</p>
          </article>
        </div>
      </section>

      <section className="surface-card split-layout">
        <div>
          <SectionHeader title="最近战绩" desc="完整列表单独做成二级页" action="全部记录" onAction={() => openDetail('records')} />
          <div className="record-list">
            {profileRecords.slice(0, 3).map((record) => (
              <article className="record-item" key={record.id}>
                <div>
                  <h3>{record.game}</h3>
                  <p>
                    {record.type} · {record.time}
                  </p>
                </div>
                <div className="record-change">
                  <strong className={record.coin >= 0 ? 'positive' : 'negative'}>
                    {record.coin >= 0 ? '+' : ''}
                    {formatNumber(record.coin)} 金币
                  </strong>
                  <span>+{record.token} 活动币</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="安全中心" desc="设备、风险与保护开关" action="安全详情" onAction={() => openDetail('security')} />
          <div className="stack-list">
            {securityStatus.slice(0, 3).map((item) => (
              <article className="stack-item compact" key={item.label}>
                <span className="item-tag">{item.status}</span>
                <div>
                  <h3>{item.label}</h3>
                  <p>{item.value}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
