import DetailHeader from '../components/ui/DetailHeader';
import SectionHeader from '../components/ui/SectionHeader';
import ProgressBar from '../components/ui/ProgressBar';
import SpriteIcon from '../components/SpriteIcon';

export function CheckinDetail({ pickedDays, claimDay, openMainTab }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="七日签到"
        desc="签到从模块化卡片升级为完整的签到子页面。"
        badge="Check-in"
        onBack={() => openMainTab('events')}
      />

      <section className="surface-card">
        <SectionHeader title="签到日历" desc="点击未领取日期即可直接领取" />
        <div className="checkin-grid">
          {pickedDays.map((picked, index) => (
            <button
              type="button"
              key={`day-${index}`}
              className={picked ? 'checkin-card done' : 'checkin-card'}
              onClick={() => claimDay(index)}
            >
              <span>D{index + 1}</span>
              <strong>{picked ? '已领取' : '领取'}</strong>
              <small>{index === 6 ? '888 金币 / 6 活动币' : '188 金币 / 1 活动币'}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function WheelDetail({ wheelAngle, isSpinning, spinWheel, openMainTab }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="幸运转盘"
        desc="完整二级页包含转盘主体、奖励图例和规则区域。"
        badge="Wheel"
        onBack={() => openMainTab('events')}
      />

      <section className="surface-card split-layout wheel-layout">
        <div className="wheel-stage">
          <div className="wheel-shell">
            <div className="wheel-pointer" aria-hidden="true" />
            <div
              className={isSpinning ? 'wheel-disc spinning' : 'wheel-disc'}
              style={{ transform: `rotate(${wheelAngle}deg)` }}
              aria-hidden="true"
            >
              <span className="p1">188</span>
              <span className="p2">388</span>
              <span className="p3">588</span>
              <span className="p4">888</span>
            </div>
          </div>
          <button type="button" className="primary-btn" onClick={spinWheel}>
            立即抽取
          </button>
        </div>

        <div>
          <SectionHeader title="奖励图例" desc="转盘与规则拆开，避免信息混杂" />
          <ul className="rule-list">
            <li>每日免费机会 3 次，00:00 自动刷新。</li>
            <li>奖励包括金币和活动币，统一计入顶部资产栏。</li>
            <li>活动期间转盘结果可额外累计节日积分。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export function MissionDetail({ missions, claimMission, openMainTab }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="任务中心"
        desc="将活动页里的任务列表独立出来，后续接任务系统更清晰。"
        badge="Mission"
        onBack={() => openMainTab('events')}
      />

      <section className="surface-card">
        <SectionHeader title="每日任务" desc="完成后直接领取，不再使用弹窗提示" />
        <div className="mission-list">
          {missions.length ? (
            missions.map((mission) => {
              const progress = Math.round((mission.progress / mission.total) * 100);
              const complete = mission.progress >= mission.total;
              return (
                <article className="mission-card" key={mission.id}>
                  <div>
                    <h3>{mission.title}</h3>
                    <p>
                      奖励 {mission.coinReward} 金币 + {mission.tokenReward} 活动币
                    </p>
                  </div>
                  <div className="mission-card-foot">
                    <div className="mission-progress">
                      <ProgressBar value={progress} />
                      <span>
                        {mission.progress}/{mission.total}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={complete ? 'primary-btn slim' : 'ghost-btn dark slim'}
                      onClick={() => claimMission(mission.id)}
                    >
                      {complete ? '领取奖励' : '未完成'}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-state">今日任务已全部领取，等待次日重置。</div>
          )}
        </div>
      </section>
    </div>
  );
}

export function InviteDetail({ inviteTiers, copyInviteCode, openMainTab }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="邀请俱乐部"
        desc="围绕拉新返利、邀请码与阶梯奖励补齐独立页面。"
        badge="Invite"
        onBack={() => openMainTab('events')}
      />

      <section className="surface-card split-layout">
        <div>
          <SectionHeader title="我的邀请码" desc="支持复制和分享" />
          <article className="invite-card">
            <div>
              <span>邀请码</span>
              <strong>COCO-2026</strong>
              <p>新用户完成首充后即可为你结算返利。</p>
            </div>
            <button type="button" className="primary-btn slim" onClick={copyInviteCode}>
              复制邀请码
            </button>
          </article>
        </div>

        <div>
          <SectionHeader title="阶梯奖励" desc="可直接接邀请后台配置" />
          <div className="stack-list">
            {inviteTiers.map((item) => (
              <article className="stack-item compact" key={item.title}>
                <span className="item-tag">阶段</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.reward}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function PackDetail({ pack, packBenefits, buyPack, openMainTab, openDetail }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title={`${pack.coin} 金币礼包`}
        desc="礼包详情页已拆出，后续可直接接支付和订单接口。"
        badge={pack.tag}
        onBack={() => openMainTab('store')}
      />

      <section className="surface-card split-layout">
        <div className="purchase-card">
          <SpriteIcon name="coin" size={58} />
          <h3>{pack.coin}</h3>
          <p>金币 + {pack.bonus} 赠送比例</p>
          <strong>{pack.price}</strong>
        </div>

        <div>
          <SectionHeader title="礼包说明" desc="统一的商城支付前说明区域" />
          <ul className="rule-list">
            {packBenefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="button-row">
            <button type="button" className="ghost-btn dark" onClick={() => openDetail('vipCard')}>
              查看月卡
            </button>
            <button type="button" className="primary-btn" onClick={() => buyPack(pack)}>
              购买礼包
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function VipDetail({ activateVip, openMainTab }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="月度特权卡"
        desc="商城内的月卡二级页，用于承接权益说明与购买。"
        badge="VIP"
        onBack={() => openMainTab('store')}
      />

      <section className="surface-card split-layout">
        <div className="purchase-card vip-theme">
          <SpriteIcon name="crown" size={60} />
          <h3>￥30 / 30 天</h3>
          <p>每日补给与活动币返还</p>
          <strong>适合长期玩家</strong>
        </div>

        <div>
          <SectionHeader title="月卡权益" desc="与顶部资产及活动页联动" />
          <ul className="rule-list">
            <li>每天 1,000 金币自动发放。</li>
            <li>每天 12 活动币自动到账。</li>
            <li>每日额外获得 2 次免费转盘机会。</li>
            <li>赛事报名享受 5% 手续费折扣。</li>
          </ul>
          <button type="button" className="primary-btn" onClick={activateVip}>
            立即开通
          </button>
        </div>
      </section>
    </div>
  );
}

export function RedeemDetail({ redeemCode, setRedeemCode, handleRedeem, openMainTab }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="兑换码中心"
        desc="商城兑换功能独立成页，便于后续接校验接口和历史记录。"
        badge="Redeem"
        onBack={() => openMainTab('store')}
      />

      <section className="surface-card split-layout">
        <div>
          <SectionHeader title="输入兑换码" desc="演示完整兑换交互结构" />
          <div className="redeem-box">
            <input
              value={redeemCode}
              onChange={(event) => setRedeemCode(event.target.value)}
              placeholder="输入兑换码"
            />
            <button type="button" className="primary-btn slim" onClick={handleRedeem}>
              立即兑换
            </button>
          </div>
        </div>

        <div>
          <SectionHeader title="最近兑换记录" desc="用于承接运营发码活动" />
          <div className="stack-list">
            <article className="stack-item compact">
              <span className="item-tag">成功</span>
              <div>
                <h3>SPRING-777</h3>
                <p>获得 300 金币 + 8 活动币</p>
              </div>
            </article>
            <article className="stack-item compact">
              <span className="item-tag">规则</span>
              <div>
                <h3>兑换说明</h3>
                <p>每个兑换码每个账号限领一次，到账可能延迟 5 秒。</p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

export function WalletDetail({ coins, activityCoins, walletBreakdown, openMainTab, formatNumber }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="资产中心"
        desc="个人中心中的资产模块已经拆成独立页面。"
        badge="Wallet"
        onBack={() => openMainTab('profile')}
      />

      <section className="surface-card split-layout">
        <div>
          <SectionHeader title="资产总览" desc="顶部余额与账单页面保持一致" />
          <div className="resource-cards">
            <article className="resource-card">
              <SpriteIcon name="coin" size={36} />
              <div>
                <strong>{formatNumber(coins)}</strong>
                <span>金币余额</span>
              </div>
            </article>
            <article className="resource-card">
              <SpriteIcon name="token" size={36} />
              <div>
                <strong>{formatNumber(activityCoins)}</strong>
                <span>活动币余额</span>
              </div>
            </article>
            <article className="resource-card">
              <SpriteIcon name="wallet" size={36} />
              <div>
                <strong>+4,680</strong>
                <span>今日净收益</span>
              </div>
            </article>
          </div>
        </div>

        <div>
          <SectionHeader title="消耗结构" desc="接真实账单时可复用同一组件" />
          <div className="distribution-list">
            {walletBreakdown.map((item) => (
              <article className="distribution-item" key={item.label}>
                <div className="population-head">
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <ProgressBar value={item.value} />
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function RecordsDetail({ profileRecords, openMainTab, formatNumber }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="全部战绩"
        desc="战绩模块已从个人中心拆成独立页面。"
        badge="History"
        onBack={() => openMainTab('profile')}
      />

      <section className="surface-card">
        <SectionHeader title="最近 5 局记录" desc="正负收益、活动币和时间统一展示" />
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
                <strong className={record.coin >= 0 ? 'positive' : 'negative'}>
                  {record.coin >= 0 ? '+' : ''}
                  {formatNumber(record.coin)} 金币
                </strong>
                <span>+{record.token} 活动币</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function SecurityDetail({ securityStatus, devices, openMainTab }) {
  return (
    <div className="detail-stack">
      <DetailHeader
        title="安全中心"
        desc="账号绑定、登录设备和风控状态都已经落成独立页面。"
        badge="Security"
        onBack={() => openMainTab('profile')}
      />

      <section className="surface-card split-layout">
        <div>
          <SectionHeader title="保护状态" desc="后续可以接开关和状态接口" />
          <div className="stack-list">
            {securityStatus.map((item) => (
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

        <div>
          <SectionHeader title="登录设备" desc="可扩展为设备管理与下线功能" />
          <div className="stack-list">
            {devices.map((device) => (
              <article className="stack-item compact" key={device.name}>
                <span className="item-tag">{device.status}</span>
                <div>
                  <h3>{device.name}</h3>
                  <p>{device.meta}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
