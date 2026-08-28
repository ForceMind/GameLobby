import { useEffect, useRef, useState } from 'react'
import { checkinDays, dailyMissions } from '../data.js'
import { Progress, SectionHeader } from '../ui.jsx'
import { formatNumber } from '../format.js'
import { nextWheelAngle } from '../demoModel.js'
import { Icon } from '../icons.jsx'
import { useLocale } from '../useLocale.js'

const wheelPrizes = [
  '800 金币',
  '2 宝石',
  '1,200 金币',
  '1 次免费旋转',
  '300 金币',
  '5 宝石',
  '2,000 金币',
  '500 金币',
]
const missionTitles = {
  '累计旋转 100 次': '累计旋转 100 次',
  '完成 5 局休闲游戏': '完成 5 局休闲游戏',
  '触发 1 次 Free Spin': '触发 1 次免费旋转',
  分享一次中奖记录: '分享一次中奖记录',
}

export default function EventsPage({ openModal, toast }) {
  const { t, href } = useLocale()
  const latestTranslation = useRef(t)
  useEffect(() => {
    latestTranslation.current = t
  }, [t])
  const [checkinClaimed, setCheckinClaimed] = useState(false)
  const [wheelCount, setWheelCount] = useState(3)
  const [wheelSpinning, setWheelSpinning] = useState(false)
  const [wheelAngle, setWheelAngle] = useState(0)
  const [claimedTasks, setClaimedTasks] = useState(() => new Set())
  const [rewardHistory, setRewardHistory] = useState([])
  const [wheelAnnouncement, setWheelAnnouncement] = useState({
    key: '今日有 3 次免费旋转机会。',
  })
  const spinTimer = useRef(null)
  const spinLocked = useRef(false)
  useEffect(() => () => window.clearTimeout(spinTimer.current), [])
  const claimableTasks = dailyMissions.filter(
    (m) => m.current >= m.total && !m.expired && !claimedTasks.has(m.id),
  ).length
  const claimable = (checkinClaimed ? 0 : 1) + claimableTasks
  const recordReward = (sourceKey, rewardKey, rewardValues) =>
    setRewardHistory((current) => [
      { id: current.length + 1, sourceKey, rewardKey, rewardValues },
      ...current,
    ])
  const showRewardHistory = () =>
    openModal({
      title: t('演示奖励记录'),
      subtitle: t('仅本页会话 · 刷新后清空 · 未真实到账'),
      body: rewardHistory.length ? (
        <ol className="reward-history">
          {rewardHistory.map((record) => (
            <li key={record.id}>
              <strong>{t(record.sourceKey)}</strong>
              <span>{t(record.rewardKey, record.rewardValues)}</span>
              <small>{t('已记录 · 静态演示')}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p>
          {t('暂无演示记录。领取签到、任务奖励或完成转盘后，可在这里查看。')}
        </p>
      ),
      cancelLabel: null,
      confirmLabel: t('关闭记录'),
    })
  const claimCheckin = () => {
    if (checkinClaimed) return
    setCheckinClaimed(true)
    recordReward('D3 每日签到', '2,000 金币 + 5 宝石')
    toast(t('已演示领取今日签到奖励，记录可在本页查看'))
  }
  const spinWheel = () => {
    if (spinLocked.current || wheelCount <= 0) return
    spinLocked.current = true
    const prizeIndex = [0, 1, 3][3 - wheelCount]
    setWheelSpinning(true)
    setWheelAnnouncement({ key: '正在抽取，请等待结果。' })
    setWheelAngle((angle) => nextWheelAngle(angle, prizeIndex))
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches
      ? 120
      : 1800
    spinTimer.current = window.setTimeout(() => {
      const remaining = wheelCount - 1
      const prize = wheelPrizes[prizeIndex]
      setWheelCount(remaining)
      setWheelSpinning(false)
      spinLocked.current = false
      setWheelAnnouncement({
        key: '本次结果：{prize}；剩余 {count} 次。未真实到账。',
        values: { prize, count: remaining },
      })
      recordReward('幸运转盘', prize)
      const translate = latestTranslation.current
      toast(
        translate('演示抽取结果：{prize}（未真实到账）', {
          prize: translate(prize),
        }),
      )
    }, duration)
  }
  const claimTask = (mission) => {
    if (
      mission.expired ||
      mission.current < mission.total ||
      claimedTasks.has(mission.id)
    )
      return
    setClaimedTasks((current) => new Set([...current, mission.id]))
    const values = {
      coins: formatNumber(mission.coinReward),
      gems: mission.gemReward,
    }
    recordReward(
      missionTitles[mission.title] || mission.title,
      '{coins} 金币 + {gems} 宝石',
      values,
    )
    toast(
      t('已演示领取：{reward}', {
        reward: t('{coins} 金币 + {gems} 宝石', values),
      }),
    )
  }
  return (
    <>
      <section className="page-head">
        <p className="eyebrow">REWARDS · DAILY PLAY</p>
        <h1>{t('活动中心')}</h1>
        <p>{t('今天能领什么、还差多少、奖励是否到账，都在这里清晰可追踪。')}</p>
      </section>
      <section
        className="event-page-state card"
        role="status"
        aria-live="polite"
        hidden={claimable > 0}
      >
        <Icon name="gift" />
        <p>
          {t(
            '今日可领取的签到与任务奖励已处理，可在演示记录中查看。未产生真实到账。',
          )}
        </p>
      </section>
      <section
        className="event-overview card"
        aria-labelledby="event-overview-title"
      >
        <div>
          <span className="event-day-kicker">{t('今日总览 · 00:00 刷新')}</span>
          <h2 id="event-overview-title">
            <span className="number-accent">{claimable}</span>{' '}
            {t('项奖励待领取')}
          </h2>
          <p>{t('先领取已完成项目，不会影响其他任务进度。')}</p>
        </div>
        <nav className="overview-stats" aria-label={t('今日活动快捷入口')}>
          <a className="overview-shortcut" href="#checkin">
            <span>{t('七日签到')}</span>
            <strong>
              {checkinClaimed ? t('今日已领取') : t('今日待领取')}
            </strong>
            <small>{t('+2,000 金币 · +5 宝石')}</small>
          </a>
          <a className="overview-shortcut" href="#wheel">
            <span>{t('幸运转盘')}</span>
            <strong>{t('{count} 次可抽', { count: wheelCount })}</strong>
            <small>{t('演示次数仅在本页有效')}</small>
          </a>
          <a className="overview-shortcut" href="#tasks">
            <span>{t('每日任务')}</span>
            <strong>{t('{count} 项待领取', { count: claimableTasks })}</strong>
            <small>{t('00:00 按服务端刷新')}</small>
          </a>
        </nav>
      </section>
      <section className="section" id="checkin" aria-labelledby="checkin-title">
        <SectionHeader
          title={t('七日签到')}
          titleId="checkin-title"
          description={t('按日领取奖励，大奖资格待正式规则确认')}
          action={
            <span className="status">
              {checkinClaimed ? t('D3 已领取') : t('D3 可领取')}
            </span>
          }
        />
        <div className="card section-card">
          <div
            className="checkin-grid"
            role="list"
            aria-label={t('七日签到奖励')}
          >
            {checkinDays.map((day) => {
              const state =
                day.state === 'today' && checkinClaimed ? 'claimed' : day.state
              return (
                <div
                  className={`checkin-day state-${state} ${day.grand ? 'is-grand' : ''}`}
                  key={day.day}
                  role="listitem"
                >
                  <strong>{t(day.day)}</strong>
                  <span>{t(day.reward)}</span>
                  <small>
                    {state === 'claimed'
                      ? t('已领取')
                      : state === 'missed'
                        ? t('漏签')
                        : state === 'today'
                          ? t('可领取')
                          : day.grand
                            ? t('规则待确认')
                            : t('尚未解锁')}
                  </small>
                </div>
              )
            })}
          </div>
          <div className="section-footer">
            <div className="checkin-note">
              <p>{t('漏签后的大奖资格尚待确认，当前仅演示当天奖励领取。')}</p>
              <button
                className="text-action"
                type="button"
                onClick={() =>
                  openModal({
                    title: t('签到规则说明'),
                    subtitle: t('规则待确认项'),
                    body: (
                      <p>
                        {t(
                          '原型同时展示 D2 漏签与 D3 可领，但尚未说明漏签是否影响第七日大奖。本版保留当天领取的状态演示，不模拟补签、连续天数重置或大奖解锁。',
                        )}
                      </p>
                    ),
                    confirmLabel: t('知道了'),
                    cancelLabel: null,
                  })
                }
              >
                {t('查看签到规则')} <Icon name="chevronRight" />
              </button>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              disabled={checkinClaimed}
              onClick={claimCheckin}
            >
              {checkinClaimed ? t('今日已领取') : t('领取今日奖励')}
            </button>
          </div>
        </div>
      </section>
      <div className="activity-layout">
        <section className="section" id="wheel" aria-labelledby="wheel-title">
          <SectionHeader
            title={t('幸运转盘')}
            titleId="wheel-title"
            description={t('结果确认完成前不会消耗下一次机会')}
            action={
              <span className="pill">
                {t('今日剩余 {count} 次', { count: wheelCount })}
              </span>
            }
          />
          <p
            className="sr-only"
            id="wheel-live"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {t(wheelAnnouncement.key, {
              ...wheelAnnouncement.values,
              prize: wheelAnnouncement.values?.prize
                ? t(wheelAnnouncement.values.prize)
                : '',
            })}
          </p>
          <div className="wheel-card card">
            <p className="sr-only" id="wheel-prizes">
              {t(
                '转盘奖励包括 800、1,200、2,000、300 和 500 金币，2 或 5 宝石，以及 1 次免费旋转。静态演示结果不代表中奖概率。',
              )}
            </p>
            <div className="wheel-wrap" aria-busy={wheelSpinning}>
              <div
                className={`wheel ${wheelSpinning ? 'is-spinning' : ''}`}
                style={{ transform: `rotate(${wheelAngle}deg)` }}
                aria-hidden="true"
              >
                {wheelPrizes.map((prize, index) => (
                  <span style={{ '--prize-index': index }} key={prize}>
                    <b>
                      {prize === '1 次免费旋转' ? '×1' : prize.split(' ')[0]}
                    </b>
                    <small>
                      {prize === '1 次免费旋转'
                        ? t('免费旋转')
                        : t(prize.split(' ')[1])}
                    </small>
                  </span>
                ))}
              </div>
              <span className="wheel-pointer" aria-hidden="true" />
              <button
                className="wheel-button"
                type="button"
                aria-describedby="wheel-prizes wheel-live"
                disabled={wheelSpinning || wheelCount === 0}
                onClick={spinWheel}
              >
                {wheelSpinning
                  ? t('抽取中')
                  : wheelCount
                    ? t('免费旋转')
                    : t('今日已用完')}
              </button>
            </div>
            <div className="section-footer compact">
              <button
                className="text-action reward-history-action"
                type="button"
                disabled={wheelSpinning}
                onClick={showRewardHistory}
              >
                <Icon name="clock" />
                {t('查看演示奖励记录')}
              </button>
              <small>{t('固定演示结果 · 支持减少动态')}</small>
            </div>
          </div>
        </section>
        <section className="section" id="tasks" aria-labelledby="tasks-title">
          <SectionHeader
            title={t('每日任务')}
            titleId="tasks-title"
            description={t('每日 00:00 按服务端时间刷新')}
          />
          <div className="task-list">
            {dailyMissions.map((mission) => {
              const done = claimedTasks.has(mission.id)
              const complete = mission.current >= mission.total
              const value = Math.round((mission.current / mission.total) * 100)
              const title = t(missionTitles[mission.title] || mission.title)
              return (
                <article
                  className={`task-card card ${complete && !mission.expired ? 'is-claimable' : ''}`}
                  key={mission.id}
                >
                  <div className="task-copy">
                    <div className="row-between">
                      <h3>{title}</h3>
                      <span
                        className={`pill ${mission.expired ? 'pill-danger' : complete ? 'pill-success' : ''}`}
                      >
                        {done ? t('已领取') : t(mission.status)}
                      </span>
                    </div>
                    <p>
                      {mission.expired
                        ? t('活动窗口已结束')
                        : t('{current} / {total}{unit}', {
                            current: mission.current,
                            total: mission.total,
                            unit: mission.id === 'casual-5' ? t('局') : t('次'),
                          })}
                    </p>
                    <Progress
                      value={value}
                      label={t('{title}进度', { title })}
                    />
                    <div className="reward-chips">
                      <span>
                        +{formatNumber(mission.coinReward)} {t('金币')}
                      </span>
                      <span>
                        +{mission.gemReward} {t('宝石')}
                      </span>
                    </div>
                  </div>
                  {complete && !mission.expired ? (
                    <button
                      className="btn btn-secondary task-claim-action"
                      type="button"
                      disabled={done}
                      onClick={() => claimTask(mission)}
                    >
                      {done ? t('已领取') : t('领取奖励')}
                    </button>
                  ) : mission.expired ? (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      disabled
                    >
                      {t('已过期')}
                    </button>
                  ) : (
                    <a
                      className="btn btn-secondary"
                      href={href(
                        mission.id === 'casual-5'
                          ? 'games.html?category=casual#game-catalog'
                          : 'games.html?category=slots#game-catalog',
                      )}
                    >
                      {t('查看对应游戏')}
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
