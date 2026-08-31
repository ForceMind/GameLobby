import { useState } from 'react'
import { Icon } from '../icons.jsx'
import { Progress, SectionHeader } from '../ui.jsx'
import { useLocale } from '../useLocale.js'
import '../styles/socialActivities.css'

const familyTasks = [
  { id: 'round', icon: 'gamepad', title: '完成 1 局游戏', detail: '任意游戏 · 今日', progress: 1, total: 1, reward: '+20 能量', claimable: true },
  { id: 'invite', icon: 'users', title: '邀请 2 位家族成员', detail: '已有 1 位参与', progress: 1, total: 2, reward: '+30 能量', claimable: false },
  { id: 'party', icon: 'gift', title: '在派对房送出 1 个宝箱', detail: '家族成员共同完成', progress: 0, total: 1, reward: '+15 能量', claimable: false },
]

const familyRanks = [
  { rank: 1, name: '星河家族', members: '32 人参与', score: '8,460', tone: 'gold' },
  { rank: 2, name: 'Moonlight', members: '27 人参与', score: '7,920', tone: 'silver' },
  { rank: 3, name: '快乐玩家', members: '19 人参与', score: '6,840', tone: 'bronze' },
]

const partyRooms = [
  { id: 'room-1', name: '今晚一起 Fruit Party', host: 'Mia小鹿', viewers: '126', seats: '8/13', accent: 'violet', tag: '家族同屏' },
  { id: 'room-2', name: 'Fish Hunter · 轻松局', host: '阿布队长', viewers: '84', seats: '5/13', accent: 'cyan', tag: '可上麦' },
  { id: 'room-3', name: '新手友好 · 一起玩', host: 'Nana', viewers: '52', seats: '3/13', accent: 'green', tag: '新房' },
]

function FamilyPanel({ onChest, onLeaderboard, claimed }) {
  const { t } = useLocale()
  const energy = claimed ? 86 : 72
  return (
    <div className="social-panel family-panel">
      <div className="social-panel-main">
        <div className="family-identity">
          <span className="family-avatar"><Icon name="users" /></span>
          <div>
            <span className="eyebrow">{t('本周家族挑战')}</span>
            <h3>{t('星河家族')}</h3>
            <p>{t('本周已有 24 位成员参与游戏')}</p>
          </div>
          <span className="pill pill-success"><span className="status-dot" />{t('进行中')}</span>
        </div>
        <div className="energy-block">
          <div className="row-between"><strong>{t('家族能量')}</strong><strong className="energy-value">{energy}<small>/100</small></strong></div>
          <Progress value={energy} label={t('家族能量进度')} />
          <div className="energy-meta"><span>{t('再完成 2 个任务即可开启宝箱')}</span><span>{t('今日 23:59 刷新')}</span></div>
        </div>
        <div className="social-actions">
          <button className="btn btn-primary" type="button" onClick={onChest}><Icon name="gift" />{t('查看家族宝箱')}</button>
          <button className="btn btn-secondary" type="button" onClick={onLeaderboard}>{t('查看排行榜')} <Icon name="chevronRight" /></button>
        </div>
      </div>
      <div className="family-rank-card">
        <div className="row-between"><span className="mini-label">{t('家族周榜')}</span><span className="pill pill-accent">{t('第 2 名')}</span></div>
        <strong>7,920 <small>{t('有效分')}</small></strong>
        <div className="rank-delta"><Icon name="bolt" />{t('距离第 1 名还差 540 分')}</div>
        <div className="rank-avatars" aria-label={t('参与成员')}><span>林</span><span>米</span><span>七</span><span>+21</span></div>
      </div>
    </div>
  )
}

function FamilyTasks({ onClaim, claimed }) {
  const { t } = useLocale()
  return (
    <div className="social-task-list">
      {familyTasks.map((task) => {
        const done = task.id === 'round' && claimed
        const current = done ? task.total : task.progress
        return (
          <div className={`social-task ${done ? 'is-claimed' : ''}`} key={task.id}>
            <span className="social-task-icon"><Icon name={task.icon} /></span>
            <div className="social-task-copy"><strong>{t(task.title)}</strong><small>{t(task.detail)}</small><Progress value={(current / task.total) * 100} label={t(task.title)} /></div>
            <div className="social-task-reward"><span>{t(task.reward)}</span>{done ? <span className="task-done">{t('已领取')}</span> : task.claimable ? <button className="text-action" type="button" onClick={onClaim}>{t('领取')}</button> : <small>{current}/{task.total}</small>}</div>
          </div>
        )
      })}
    </div>
  )
}

function PartyPanel({ onJoin }) {
  const { t } = useLocale()
  return (
    <div className="social-panel party-panel">
      <div className="party-intro"><div><span className="eyebrow">{t('HOT ROOMS')}</span><h3>{t('派对同屏房')}</h3><p>{t('和房间里的朋友一起玩，最多 13 人上麦')}</p></div><span className="live-indicator"><span className="status-dot" />{t('24 个房间在线')}</span></div>
      <div className="party-room-list">
        {partyRooms.map((room) => <button className="party-room" type="button" key={room.id} onClick={() => onJoin(room)}><span className={`room-art room-art-${room.accent}`}><Icon name="gamepad" /><span className="room-live">LIVE</span></span><span className="party-room-copy"><strong>{t(room.name)}</strong><small>{t(room.host)} · {room.viewers} 人围观</small><span className="room-meta"><span className="pill pill-light">{t(room.tag)}</span><span><Icon name="users" /> {room.seats}</span></span></span><Icon name="chevronRight" /></button>)}
      </div>
    </div>
  )
}

export default function SocialActivities({ openModal, toast }) {
  const { t } = useLocale()
  const [tab, setTab] = useState('family')
  const [claimed, setClaimed] = useState(false)
  const showChest = () => openModal({ title: t('家族宝箱'), subtitle: t('由家族成员共同积攒能量，奖励每日刷新。'), body: <div className="chest-modal"><div className="chest-visual"><Icon name="gift" /></div><strong>{t('距离开启还差 14 点能量')}</strong><Progress value={86} label={t('家族宝箱开启进度')} /><p>{t('完成家族任务、参与派对同屏房，都可以为家族增加能量。')}</p></div>, confirmLabel: t('去完成任务'), onConfirm: () => setTab('family') })
  const showLeaderboard = () => openModal({ title: t('家族游戏排行榜'), subtitle: t('本周有效分 · 每小时更新'), body: <div className="leaderboard-modal">{familyRanks.map((item) => <div className="leaderboard-row" key={item.name}><span className={`leaderboard-rank ${item.tone}`}>{item.rank}</span><span><strong>{t(item.name)}</strong><small>{t(item.members)}</small></span><strong>{item.score}<small>{t('分')}</small></strong></div>)}</div>, confirmLabel: t('知道了') })
  const showRoom = (room) => openModal({ kicker: t('派对同屏房'), title: t(room.name), subtitle: t('房主 {host} · {viewers} 人在线', { host: room.host, viewers: room.viewers }), body: <div className="room-modal"><div className={`room-modal-art room-art-${room.accent}`}><Icon name="gamepad" /></div><p>{t('进入后可观看当前对局，也可以申请上麦参与。')}</p><div className="safety-strip"><Icon name="clock" /><span><strong>{t('今日社交游戏时长')}</strong><small>{t('已使用 28 / 45 分钟，适度游戏更尽兴')}</small></span><span className="status">{t('护栏提醒')}</span></div></div>, confirmLabel: t('进入房间'), onConfirm: () => toast(t('已打开派对房预览，原型不连接真实房间。')) })
  return (
    <section className="section social-activities" aria-labelledby="social-activities-title">
      <SectionHeader title={t('家族 / 派对活动')} description={t('和熟悉的人一起玩，奖励与进度一起积累。')} action={<span className="social-time-guard"><Icon name="clock" />{t('今日 28 / 45 分钟')}</span>} titleId="social-activities-title" />
      <div className="social-tabs" role="tablist" aria-label={t('社交活动类型')}><button type="button" role="tab" aria-selected={tab === 'family'} className={tab === 'family' ? 'is-active' : ''} onClick={() => setTab('family')}><Icon name="users" />{t('家族活动')}<span>{t('能量 72%')}</span></button><button type="button" role="tab" aria-selected={tab === 'party'} className={tab === 'party' ? 'is-active' : ''} onClick={() => setTab('party')}><Icon name="gamepad" />{t('派对房')}<span>{t('24 个在线')}</span></button></div>
      {tab === 'family' ? <><FamilyPanel onChest={showChest} onLeaderboard={showLeaderboard} claimed={claimed} /><div className="social-tasks-wrap"><div className="row-between social-subhead"><div><strong>{t('今日家族任务')}</strong><small>{t('完成任务，为家族宝箱充能')}</small></div><span className="pill">{claimed ? '2/3' : '1/3'} {t('已完成')}</span></div><FamilyTasks onClaim={() => { setClaimed(true); toast(t('已领取 20 点家族能量')) }} claimed={claimed} /></div></> : <PartyPanel onJoin={showRoom} />}
    </section>
  )
}
