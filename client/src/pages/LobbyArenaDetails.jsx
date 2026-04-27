import DetailHeader from '../components/ui/DetailHeader';
import SectionHeader from '../components/ui/SectionHeader';
import ProgressBar from '../components/ui/ProgressBar';
import SpriteIcon from '../components/SpriteIcon';

export function BenefitsDetail({ eventCards, benefitTimeline, coins, activityCoins, openMainTab, openDetail, formatNumber }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="福利中心"
        desc="从现有页面结构里抽离出的统一福利枢纽，负责分发活动入口。"
        badge="Benefits"
        onBack={() => openMainTab('lobby')}
      />

      <section className="surface-card">
        <SectionHeader title="福利地图" desc="所有福利入口都已拆成可开发的二级页" />
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
          <SectionHeader title="今日福利时段" desc="适合后续接活动编排后台" />
          <div className="timeline-list">
            {benefitTimeline.map((item) => (
              <article className="timeline-item" key={item.time}>
                <span>{item.time}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="当前可领资源" desc="与大厅头部资产强关联" />
          <div className="resource-cards">
            <article className="resource-card">
              <SpriteIcon name="coin" size={36} />
              <div>
                <strong>{formatNumber(coins)}</strong>
                <span>金币总额</span>
              </div>
            </article>
            <article className="resource-card">
              <SpriteIcon name="token" size={36} />
              <div>
                <strong>{formatNumber(activityCoins)}</strong>
                <span>活动币总额</span>
              </div>
            </article>
            <article className="resource-card">
              <SpriteIcon name="gift" size={36} />
              <div>
                <strong>3</strong>
                <span>待领取福利</span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

export function NoticeDetail({ announcements, openMainTab }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="公告速递"
        desc="替代顶部提示弹窗，改为完整公告列表页。"
        badge="Notice"
        onBack={() => openMainTab('lobby')}
      />

      <section className="surface-card">
        <SectionHeader title="系统公告" desc="可以直接接公告配置和版本发布" />
        <div className="notice-list">
          {announcements.map((item) => (
            <article className="notice-card" key={item.title}>
              <div className="notice-head">
                <span className="item-tag">{item.tag}</span>
                <small>今天更新</small>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function GameDetail({ game, openMainTab, openDetail, showToast }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title={game.name}
        desc={game.summary}
        badge={game.category}
        onBack={() => openMainTab('lobby')}
      />

      <section className="surface-card detail-hero-card">
        <div className="detail-hero-grid">
          <div className="poster-shell">
            <SpriteIcon name={game.cover} size={124} />
          </div>

          <div className="detail-meta">
            <div className="metric-grid">
              <article>
                <span>RTP</span>
                <strong>{game.rtp}</strong>
              </article>
              <article>
                <span>实时在线</span>
                <strong>{game.players}</strong>
              </article>
              <article>
                <span>大奖池</span>
                <strong>{game.jackpot}</strong>
              </article>
              <article>
                <span>起转门槛</span>
                <strong>{game.entry}</strong>
              </article>
            </div>

            <div className="perk-row">
              {game.perks.map((perk) => (
                <span className="perk-chip" key={perk}>
                  {perk}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card">
        <SectionHeader title="房间等级" desc="后续可直接接房间列表接口" />
        <div className="room-grid">
          {game.rooms.map((room) => (
            <article className="room-card" key={room.name}>
              <h3>{room.name}</h3>
              <p>{room.desc}</p>
              <span>{room.occupancy}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card detail-actions-card">
        <div>
          <h3>进入房间</h3>
          <p>UI 和数据结构已经拆好，可直接接入真实玩法入口。</p>
        </div>
        <div className="button-row">
          <button type="button" className="ghost-btn dark" onClick={() => openDetail('wallet')}>
            查看资产
          </button>
          <button type="button" className="primary-btn" onClick={() => showToast(`正在进入 ${game.name}`)}>
            立即开始
          </button>
        </div>
      </section>
    </div>
  );
}

export function ArenaRulesDetail({ globalRules, openMainTab }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="赛事通用规则"
        desc="一级页展示摘要，规则全文独立成页，避免信息挤压。"
        badge="Rules"
        onBack={() => openMainTab('arena')}
      />

      <section className="surface-card split-layout">
        <div>
          <SectionHeader title="核心规则" desc="报名、结算和异常处理" />
          <ul className="rule-list">
            {globalRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHeader title="今日赛事时段" desc="固定时段演示，可接后台配置" />
          <div className="timeline-list">
            <article className="timeline-item">
              <span>13:00</span>
              <div>
                <h3>经典 Slot 冲榜场</h3>
                <p>适合中高波动局玩家。</p>
              </div>
            </article>
            <article className="timeline-item">
              <span>17:30</span>
              <div>
                <h3>休闲积分赛</h3>
                <p>捕鱼、消除与小型竞技房共用。</p>
              </div>
            </article>
            <article className="timeline-item">
              <span>21:00</span>
              <div>
                <h3>Jackpot 决胜局</h3>
                <p>大奖时段，适合高投入玩家。</p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

export function TournamentDetail({ tournament, openMainTab, showToast }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title={tournament.title}
        desc={tournament.summary}
        badge={tournament.subtitle}
        onBack={() => openMainTab('arena')}
      />

      <section className="surface-card">
        <div className="detail-summary-row">
          <article className="summary-card">
            <span>报名费</span>
            <strong>{tournament.entryFee}</strong>
          </article>
          <article className="summary-card">
            <span>奖金池</span>
            <strong>{tournament.prize}</strong>
          </article>
          <article className="summary-card">
            <span>结算时间</span>
            <strong>{tournament.settlement}</strong>
          </article>
        </div>

        <div className="progress-head">
          <span>报名情况 {tournament.capacity}</span>
          <strong>{tournament.progress}%</strong>
        </div>
        <ProgressBar value={tournament.progress} />
      </section>

      <section className="surface-card split-layout">
        <div>
          <SectionHeader title="赛事奖励" desc="直接用于详情页奖池展示" />
          <ul className="rule-list">
            {tournament.rewards.map((reward) => (
              <li key={reward}>{reward}</li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHeader title="当前人员情况" desc="用于赛事运营和玩家预期管理" />
          <div className="roster-grid">
            {tournament.roster.map((item) => (
              <article className="roster-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-card detail-actions-card">
        <div>
          <h3>规则说明</h3>
          <ul className="rule-list">
            {tournament.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
        <button type="button" className="primary-btn" onClick={() => showToast(`已报名 ${tournament.title}`)}>
          立即报名
        </button>
      </section>
    </div>
  );
}
