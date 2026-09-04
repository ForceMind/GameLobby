import { useEffect, useRef, useState } from 'react'
import { checkinDays, dailyMissions } from '../data.js'
import liteContent from '../data/liteContent.json'
import { Progress, SectionHeader } from '../ui.jsx'
import { formatNumber } from '../format.js'
import { nextWheelAngle } from '../demoModel.js'
import { Icon } from '../icons.jsx'
import { useLocale } from '../useLocale.js'
import '../h5/eventsCompact.css'

// Structured so each language renders its own sentence. These eight slots still
// mirror the admin's wheel configuration by hand; wiring them to the published
// config is tracked separately.
const wheelPrizes = [
  { kind: 'coins', amount: 800 },
  { kind: 'gems', amount: 2 },
  { kind: 'coins', amount: 1200 },
  { kind: 'freeSpin', amount: 1 },
  { kind: 'coins', amount: 300 },
  { kind: 'gems', amount: 5 },
  { kind: 'coins', amount: 2000 },
  { kind: 'coins', amount: 500 },
]
const PRIZE_KEYS = { coins: 'events.prizeCoins', gems: 'events.prizeGems', freeSpin: 'events.prizeFreeSpin' }
const missionTitles = {
  '累计旋转 100 次': '累计旋转 100 次',
  '完成 5 局休闲游戏': '完成 5 局休闲游戏',
  '触发 1 次 Free Spin': '触发 1 次免费旋转',
  分享一次中奖记录: '分享一次中奖记录',
}

export default function EventsPage({ openModal, toast, showFullEntryHint }) {
  const { t, href, format } = useLocale()
  const latestTranslation = useRef(t)
  useEffect(() => {
    latestTranslation.current = t
  }, [t])
  const [checkinClaimed, setCheckinClaimed] = useState(false)
  const [wheelCount, setWheelCount] = useState(liteContent.events.wheelFreeSpins)
  const [wheelSpinning, setWheelSpinning] = useState(false)
  const [wheelAngle, setWheelAngle] = useState(0)
  const [claimedTasks, setClaimedTasks] = useState(() => new Set())
  const [rewardHistory, setRewardHistory] = useState([])
  const [wheelAnnouncement, setWheelAnnouncement] = useState({
    key: 'events.wheelIntro',
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
      title: t('events.historyTitle'),
      subtitle: t('events.historySubtitle'),
      body: rewardHistory.length ? (
        <ol className="reward-history">
          {rewardHistory.map((record) => (
            <li key={record.id}>
              <strong>{t(record.sourceKey)}</strong>
              <span>{t(record.rewardKey, record.rewardValues)}</span>
              <small>{t('events.historyRecorded')}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p>{t('events.historyEmpty')}</p>
      ),
      cancelLabel: null,
      confirmLabel: t('events.historyClose'),
    })
  const claimCheckin = () => {
    if (checkinClaimed) return
    setCheckinClaimed(true)
    recordReward('events.historyCheckinD3', 'events.historyCheckinReward')
    toast(t('events.checkinClaimToast'))
  }
  const spinWheel = () => {
    if (spinLocked.current || wheelCount <= 0) return
    spinLocked.current = true
    const prizeIndex = [0, 1, 3][3 - wheelCount]
    setWheelSpinning(true)
    setWheelAnnouncement({ key: 'events.wheelSpinningStatus' })
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
      const translate = latestTranslation.current
      const prizeLabel = translate(PRIZE_KEYS[prize.kind], { amount: prize.amount })
      setWheelAnnouncement({
        key: 'events.wheelResultStatus',
        values: { prize: prizeLabel, count: remaining },
      })
      recordReward('events.wheelTitle', prizeLabel)
      toast(translate('events.wheelResultToast', { prize: prizeLabel }))
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
      'events.rewardCoinsPlusGems',
      values,
    )
    toast(
      t('events.claimedToast', {
        reward: t('events.missionRewardValue', values),
      }),
    )
  }
  const isHalf =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mode') === 'half'
  if (isHalf) {
    return (
      <div className="events-compact">
        <section className="events-compact-head">
          <div>
            <span className="eyebrow">{t('events.title')}</span>
            <h1>{t('events.compactTitle')}</h1>
          </div>
          <strong className="events-compact-count">{claimable}</strong>
          <span>{t('events.readyToClaimSuffixShort')}</span>
        </section>
        <section
          className="events-compact-card card"
          aria-labelledby="compact-checkin-title"
        >
          <div className="events-compact-row">
            <div>
              <h2 id="compact-checkin-title">{t('events.checkinTodayTitle')}</h2>
              <p>{t('events.checkinRewardValue')}</p>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              disabled={checkinClaimed}
              onClick={claimCheckin}
            >
              {checkinClaimed ? t('events.claimed') : t('events.claim')}
            </button>
          </div>
        </section>
        <section
          className="events-compact-card card"
          aria-labelledby="compact-wheel-title"
        >
          <div className="events-compact-row">
            <div>
              <h2 id="compact-wheel-title">{t('events.wheelTitle')}</h2>
              <p>{t('events.wheelSpinsLeft', { count: wheelCount })}</p>
            </div>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={wheelSpinning || wheelCount === 0}
              onClick={spinWheel}
            >
              {wheelSpinning
                ? t('events.wheelSpinning')
                : wheelCount
                  ? t('events.wheelSpinAction')
                  : t('events.wheelSpinsUsedUp')}
            </button>
          </div>
          <button
            className="text-action"
            type="button"
            disabled={wheelSpinning}
            onClick={showRewardHistory}
          >
            <Icon name="clock" /> {t('events.historyAction')}
          </button>
        </section>
        <section
          className="events-compact-card card"
          aria-labelledby="compact-tasks-title"
        >
          <div className="events-compact-row">
            <h2 id="compact-tasks-title">{t('events.missionsTitle')}</h2>
            <span className="status">
              {t('events.readyToClaimCount', { count: claimableTasks })}
            </span>
          </div>
          <div className="events-compact-tasks">
            {dailyMissions.slice(0, 2).map((mission) => {
              const done = claimedTasks.has(mission.id)
              const complete =
                mission.current >= mission.total && !mission.expired
              return (
                <div className="events-compact-task" key={mission.id}>
                  <span>
                    {t(missionTitles[mission.title] || mission.title)}
                  </span>
                  <small>
                    {mission.current}/{mission.total}
                  </small>
                  {complete && (
                    <button
                      className="text-action"
                      type="button"
                      disabled={done}
                      onClick={() => claimTask(mission)}
                    >
                      {done ? t('events.claimed') : t('events.claim')}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <button
            className="text-action"
            type="button"
            onClick={showFullEntryHint}
          >
            {t('events.moreMissions')}
          </button>
        </section>
      </div>
    )
  }
  return (
    <>
      <section className="page-head">
        <p className="eyebrow">REWARDS · DAILY PLAY</p>
        <h1>{t('events.title')}</h1>
        <p>{t('events.subtitle')}</p>
      </section>
      <section
        className="event-page-state card"
        role="status"
        aria-live="polite"
        hidden={claimable > 0}
      >
        <Icon name="gift" />
        <p>{t('events.allClaimedToday')}</p>
      </section>
      <section
        className="event-overview card"
        aria-labelledby="event-overview-title"
      >
        <div>
          <span className="event-day-kicker">{t('events.overviewKicker')}</span>
          <h2 id="event-overview-title">
            <span className="number-accent">{claimable}</span>{' '}
            {t('events.readyToClaimSuffix')}
          </h2>
          <p>{t('events.overviewHint')}</p>
        </div>
        <nav className="overview-stats" aria-label={t('events.overviewShortcutsLabel')}>
          <a className="overview-shortcut" href="#checkin">
            <span>{t('events.checkinTitle')}</span>
            <strong>
              {checkinClaimed ? t('events.checkinClaimedToday') : t('events.checkinReadyToday')}
            </strong>
            <small>{t('events.checkinRewardSummary')}</small>
          </a>
          <a className="overview-shortcut" href="#wheel">
            <span>{t('events.wheelTitle')}</span>
            <strong>{t('events.wheelSpinsAvailable', { count: wheelCount })}</strong>
            <small>{t('events.wheelDailyChances')}</small>
          </a>
          <a className="overview-shortcut" href="#tasks">
            <span>{t('events.missionsTitle')}</span>
            <strong>{t('events.readyToClaimCount', { count: claimableTasks })}</strong>
            <small>{t('events.missionsResetShort')}</small>
          </a>
        </nav>
      </section>
      <section className="section" id="checkin" aria-labelledby="checkin-title">
        <SectionHeader
          title={t('events.checkinTitle')}
          titleId="checkin-title"
          description={t('events.checkinDescription')}
          action={
            <span className="status">
              {checkinClaimed ? t('events.checkinHeaderClaimed') : t('events.checkinHeaderReady')}
            </span>
          }
        />
        <div className="card section-card">
          <div
            className="checkin-grid"
            role="list"
            aria-label={t('events.checkinGridLabel')}
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
                  <strong>
                    {day.day}
                    {day.state === 'today' && ` · ${t('events.dayToday')}`}
                    {day.grand && ` · ${t('events.dayGrand')}`}
                  </strong>
                  <span>
                    {day.gems
                      ? t('events.rewardCoinsGems', { coins: format.number(day.coins), gems: day.gems })
                      : t('events.rewardCoins', { coins: format.number(day.coins) })}
                  </span>
                  <small>
                    {state === 'claimed'
                      ? t('events.claimed')
                      : state === 'missed'
                        ? t('events.checkinDayStateMissed')
                        : state === 'today'
                          ? t('events.checkinDayReady')
                          : t('events.checkinDayStateLocked')}
                  </small>
                </div>
              )
            })}
          </div>
          <div className="section-footer">
            <div className="checkin-note">
              <p>{t('events.checkinNote')}</p>
              <button
                className="text-action"
                type="button"
                onClick={() =>
                  openModal({
                    title: t('events.checkinRulesTitle'),
                    subtitle: t('events.checkinRulesSubtitle'),
                    body: (
                      <p>
                        {t(
                          'events.checkinRule',
                        )}
                      </p>
                    ),
                    confirmLabel: t('common.gotIt'),
                    cancelLabel: null,
                  })
                }
              >
                {t('events.checkinRulesAction')} <Icon name="chevronRight" />
              </button>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              disabled={checkinClaimed}
              onClick={claimCheckin}
            >
              {checkinClaimed ? t('events.checkinClaimedToday') : t('events.checkinClaimToday')}
            </button>
          </div>
        </div>
      </section>
      <div className="activity-layout">
        <section className="section" id="wheel" aria-labelledby="wheel-title">
          <SectionHeader
            title={t('events.wheelTitle')}
            titleId="wheel-title"
            description={t('events.wheelLockHint')}
            action={
              <span className="pill">
                {t('events.wheelSpinsLeftToday', { count: wheelCount })}
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
            {t(wheelAnnouncement.key, wheelAnnouncement.values ?? {})}
          </p>
          <div className="wheel-card card">
            <p className="sr-only" id="wheel-prizes">
              {t(
                'events.wheelPrizesSrOnly',
              )}
            </p>
            <div className="wheel-wrap" aria-busy={wheelSpinning}>
              <div
                className={`wheel ${wheelSpinning ? 'is-spinning' : ''}`}
                style={{ transform: `rotate(${wheelAngle}deg)` }}
                aria-hidden="true"
              >
                {wheelPrizes.map((prize, index) => (
                  <span style={{ '--prize-index': index }} key={`${prize.kind}-${prize.amount}-${index}`}>
                    <b>
                      {prize.kind === 'freeSpin'
                        ? `×${prize.amount}`
                        : format.number(prize.amount)}
                    </b>
                    <small>
                      {prize.kind === 'freeSpin'
                        ? t('events.wheelPrizeFreeSpin')
                        : t(prize.kind === 'gems' ? 'ledger.gems' : 'ledger.coins')}
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
                  ? t('events.wheelSpinning')
                  : wheelCount
                    ? t('events.wheelSpinAction')
                    : t('events.wheelSpinsUsedUp')}
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
                {t('events.historyAction')}
              </button>
              <small>{t('events.wheelResultHint')}</small>
            </div>
          </div>
        </section>
        <section className="section" id="tasks" aria-labelledby="tasks-title">
          <SectionHeader
            title={t('events.missionsTitle')}
            titleId="tasks-title"
            description={t('events.missionsResetHint')}
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
                        {done ? t('events.claimed') : t(mission.status)}
                      </span>
                    </div>
                    <p>
                      {mission.expired
                        ? t('events.missionWindowEnded')
                        : t('events.missionProgressValue', {
                            current: mission.current,
                            total: mission.total,
                            unit: mission.id === 'casual-5' ? t('events.unitGames') : t('events.unitSpins'),
                          })}
                    </p>
                    <Progress
                      value={value}
                      label={t('events.missionProgressLabel', { title })}
                    />
                    <div className="reward-chips">
                      <span>
                        +{formatNumber(mission.coinReward)} {t('ledger.coins')}
                      </span>
                      <span>
                        +{mission.gemReward} {t('ledger.gems')}
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
                      {done ? t('events.claimed') : t('events.claimReward')}
                    </button>
                  ) : mission.expired ? (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      disabled
                    >
                      {t('events.missionExpired')}
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
                      {t('events.missionGoToGames')}
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
