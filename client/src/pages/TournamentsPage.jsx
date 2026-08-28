import { useState } from 'react'
import { Icon } from '../icons.jsx'
import { tournaments } from '../data.js'
import { Progress, SectionHeader } from '../ui.jsx'
import { useLocale } from '../useLocale.js'

const timeline = [
  ['13:00', '经典 Slot 冲榜场', '已结束 · 结算完成'],
  ['17:30', '休闲积分赛', '报名中 · 剩余名额 12'],
  ['21:00', 'Jackpot 决胜局', '即将开始 · 已报名 96 人'],
  ['22:30', 'Slot 冲榜赛', '等待中 · 开赛前 10 分钟入场'],
]
const population = [
  ['当前在线参赛', '1,284', 68],
  ['已报名待开赛', '642', 44],
  ['候补队列', '37', 18],
  ['裁判与风控席位', '8 / 10', 80],
]
const ruleRows = [
  ['coin', '报名货币', '赛事卡明确标注金币或宝石，确认前再次核对。'],
  ['calendar', '次数限制', '每类赛事每日最多报名 3 次，以服务端记录为准。'],
  ['wifiOff', '网络中断', '已完成局数保留，未提交局不计分，不自动补分。'],
  ['medal', '结算依据', '以截止时的有效分数、服务端时间与风控复核结果为准。'],
]

export default function TournamentsPage({ openModal, toast }) {
  const { t } = useLocale()
  const [entries, setEntries] = useState({})
  const openRules = (tournament = null) =>
    openModal({
      title: tournament
        ? `${t(tournament.title)} · ${t('详细规则')}`
        : t('赛事通用规则'),
      subtitle: t('所有报名与候补操作仅为本地演示，不会扣除金币或宝石。'),
      body: (
        <div className="detail-list">
          {(tournament
            ? [
                ['要求', tournament.requirement],
                ['结算', tournament.settlement],
              ]
            : ruleRows.map(([, title, copy]) => [title, copy])
          ).map(([title, copy]) => (
            <div key={title}>
              <strong>{t(title)}</strong>
              <span>{t(copy)}</span>
            </div>
          ))}
          <div>
            <strong>{t('计分')}</strong>
            <span>{t('未知计分规则：等待服务端规则接入。')}</span>
          </div>
          <div>
            <strong>{t('退款')}</strong>
            <span>{t('未知退款规则：等待服务端规则接入。')}</span>
          </div>
        </div>
      ),
      confirmLabel: t('知道了'),
      cancelLabel: null,
      onConfirm: () => {},
    })
  const openTournament = (tournament) => {
    const full = tournament.id === 'casual'
    const eligible = tournament.id === 'slot-rank'
    const current = entries[tournament.id]
    openModal({
      title: t(tournament.title),
      kicker: t(tournament.status),
      subtitle: t('{prize} · {fee}', {
        prize: t(tournament.prize),
        fee: t(tournament.fee),
      }),
      body: (
        <div className="modal-copy-list">
          <p>
            <strong>{t('参赛要求')}</strong>
            {t(tournament.requirement)}
          </p>
          <p>
            <strong>{t('结算时间')}</strong>
            {t(tournament.settlement)}
          </p>
          <p>
            {current
              ? t(
                  current === 'waitlist'
                    ? '已在候补（演示）'
                    : '已报名（演示）',
                )
              : eligible
                ? t('资格检查通过。静态演示不会扣除报名费。')
                : full
                  ? t('当前正赛名额已满，可加入候补队列。')
                  : t('近 7 日指定游戏记录不足，暂不能报名。')}
          </p>
        </div>
      ),
      confirmLabel: current
        ? t('知道了')
        : eligible
          ? t('确认演示报名')
          : full
            ? t('加入演示候补')
            : t('知道了'),
      cancelLabel: current || (!eligible && !full) ? null : t('取消'),
      onConfirm: () => {
        if (current) return
        if (eligible || full) {
          setEntries((old) => ({
            ...old,
            [tournament.id]: full ? 'waitlist' : 'entered',
          }))
          toast(t('报名状态已更新'))
        } else toast(t('条件说明已查看'))
      },
    })
  }
  return (
    <>
      <section className="page-head">
        <p className="eyebrow">{t('赛事 · LIVE EVENTS')}</p>
        <h1>{t('赛事')}</h1>
        <p>{t('浏览赛事规则与报名状态示例，不进行真实报名或结算。')}</p>
      </section>
      <section className="section">
        <details className="rules card">
          <summary>
            <span>
              <Icon name="shield" />
              {t('赛事通用规则')}
            </span>
            <Icon name="chevronRight" />
          </summary>
          <div className="rule-grid">
            {ruleRows.map(([icon, title, copy]) => (
              <div className="rule-item" key={title}>
                <Icon name={icon} />
                <span>
                  <strong>{t('{label}：', { label: t(title) })}</strong>
                  {t(copy)}
                </span>
              </div>
            ))}
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => openRules()}
            >
              {t('查看完整规则')}
            </button>
          </div>
        </details>
      </section>
      <section className="section">
        <SectionHeader
          title={t('赛事列表')}
          description={t('报名资格与名额分别展示，按卡片状态操作')}
          action={<span className="status">{t('3 场赛事')}</span>}
        />
        <div className="tournament-grid">
          {tournaments.map((tournament) => {
            const entered = entries[tournament.id]
            const waitlist = tournament.waitlist
              ? t('，候补 {value}', { value: tournament.waitlist })
              : ''
            return (
              <article className="tournament-card card" key={tournament.id}>
                <div className="title-row">
                  <div>
                    <span className="pill">{t(tournament.status)}</span>
                    <h3>{t(tournament.title)}</h3>
                    <p>{t(tournament.mode)}</p>
                  </div>
                  <span className="feature-icon">
                    <Icon name={tournament.icon} />
                  </span>
                </div>
                <div className="metric-grid two">
                  <div>
                    <span>{t('奖池')}</span>
                    <strong>{t(tournament.prize)}</strong>
                  </div>
                  <div>
                    <span>{t('报名费')}</span>
                    <strong>{t(tournament.fee)}</strong>
                  </div>
                </div>
                <div className="progress-block">
                  <div className="progress-label">
                    <span>
                      {t(
                        '报名人数 {registered} / {capacity} {unit} {waitlist}',
                        {
                          registered: tournament.registered,
                          capacity: tournament.capacity,
                          unit: t('人'),
                          waitlist,
                        },
                      )}
                    </span>
                    <strong>
                      {tournament.progress === 100
                        ? t('已满')
                        : `${tournament.progress}%`}
                    </strong>
                  </div>
                  <Progress
                    value={tournament.progress}
                    label={t('报名进度 {title}', {
                      title: t(tournament.title),
                    })}
                  />
                </div>
                <div className="tournament-stats">
                  <div>
                    <strong>{tournament.registered}</strong>
                    <span>{t('已报名')}</span>
                  </div>
                  <div>
                    <strong>{tournament.online}</strong>
                    <span>{t('在线中')}</span>
                  </div>
                  <div>
                    <strong>{tournament.waiting}</strong>
                    <span>{t('等待中')}</span>
                  </div>
                  <div>
                    <strong>
                      {tournament.waitlist || tournament.eliminated}
                    </strong>
                    <span>{t(tournament.waitlist ? '候补中' : '已淘汰')}</span>
                  </div>
                </div>
                <div className="reward-line">
                  <p>
                    <strong>{t('{label}：', { label: t('要求') })}</strong>
                    {t(tournament.requirement)}
                  </p>
                  <p>
                    <strong>{t('{label}：', { label: t('结算') })}</strong>
                    {t(tournament.settlement)}
                  </p>
                </div>
                <div className="card-actions">
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => openRules(tournament)}
                  >
                    {t('详细规则')}
                  </button>
                  <button
                    disabled={Boolean(entered)}
                    className={
                      tournament.id === 'slot-rank'
                        ? 'btn btn-primary'
                        : 'btn btn-secondary'
                    }
                    type="button"
                    onClick={() => openTournament(tournament)}
                  >
                    {entered
                      ? t(
                          entered === 'waitlist'
                            ? '已在候补（演示）'
                            : '已报名（演示）',
                        )
                      : t(
                          tournament.id === 'slot-rank'
                            ? '报名参赛'
                            : tournament.id === 'casual'
                              ? '加入候补'
                              : '查看缺少条件',
                        )}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
      <div className="page-layout">
        <section className="section">
          <SectionHeader
            title={t('今日赛事时间线')}
            description={t('状态随服务端时间推进')}
            action={<Icon name="clock" />}
          />
          <div className="timeline card">
            {timeline.map(([time, title, copy], index) => (
              <div
                className={`timeline-item ${index === 1 ? 'is-current' : ''}`}
                key={`${time}-${title}`}
              >
                <time>{time}</time>
                <span className="timeline-dot" />
                <span>
                  <strong>{t(title)}</strong>
                  <small>{t(copy)}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
        <aside className="side-rail">
          <section className="section">
            <SectionHeader
              title={t('全站参赛情况')}
              description={t('演示容量与队列')}
            />
            <div className="population-grid">
              {population.map(([label, value, progress]) => (
                <div className="stat-card card" key={label}>
                  <span>{t(label)}</span>
                  <strong>{value}</strong>
                  <Progress
                    value={progress}
                    label={`${t(label)}${t('容量')}`}
                  />
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
