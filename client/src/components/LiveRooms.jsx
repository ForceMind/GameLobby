import { useMemo, useState } from 'react'
import { Icon } from '../icons.jsx'
import { games, liveRooms } from '../data.js'
import { SectionHeader, GameArtwork } from '../ui.jsx'
import { useLocale } from '../useLocale.js'
import { openLiveRoom } from '../h5/liveRoomBridge.js'
import '../styles/liveRooms.css'

const filters = [
  { id: 'all', label: '全部' },
  { id: 'family', label: '家族厅' },
  { id: 'party', label: '派对房' },
  { id: 'solo', label: '单人游戏房' },
]

const typeLabels = {
  family: '家族厅',
  party: '派对房',
  solo: '单人游戏房',
}

const statusLabels = {
  restricted: '麦位已满',
  maintenance: '游戏维护中',
  ended: '直播已结束',
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function RoomPreview({ room }) {
  const { t } = useLocale()
  const game = games.find((item) => item.id === room.gameId)
  return (
    <div className="live-room-preview">
      <div className="live-room-preview-art">
        {game ? <GameArtwork game={game} /> : <Icon name="play" />}
      </div>
      <div>
        <span className="pill live-pill">LIVE</span>
        <h3>{room.title}</h3>
        <p>
          {room.host} · {game?.name ?? room.gameId}
        </p>
        <small>
          {formatNumber(room.viewers)} {t('人在线')} · {room.seats.occupied}/
          {room.seats.total} {t('麦位')}
        </small>
      </div>
    </div>
  )
}

export function LiveRooms({ openModal, toast, loading = false }) {
  const { t } = useLocale()
  const [activeFilter, setActiveFilter] = useState('all')
  const visibleRooms = useMemo(() => {
    const filtered = activeFilter === 'all'
      ? liveRooms
      : liveRooms.filter((room) => room.roomType === activeFilter)
    return [...filtered].sort((a, b) => {
      const statusRank = (status) => (status === 'live' ? 0 : 1)
      return statusRank(a.status) - statusRank(b.status) || b.viewers - a.viewers || a.id.localeCompare(b.id)
    })
  }, [activeFilter])

  const handleRoomClick = (room) => {
    if (room.status !== 'live') return
    openModal?.({
      title: t('进入直播间'),
      kicker: t(typeLabels[room.roomType]),
      subtitle: t('房间预览 · 即将进入'),
      body: <RoomPreview room={room} />,
      confirmLabel: t('进入房间'),
      cancelLabel: t('继续浏览'),
      onConfirm: () => {
        const result = openLiveRoom({
          roomId: room.id,
          gameId: room.gameId,
          entry: 'hot_rooms',
        })
        toast?.(t(result?.preview ? '已打开直播间预览' : result?.status === 'failed' ? '进入房间失败，请稍后再试' : '正在打开 {name}', { name: room.title }))
      },
    })
  }

  return (
    <section className="section live-rooms" id="live-rooms" aria-labelledby="live-rooms-title">
      <SectionHeader
        title={t('Hot Live Rooms')}
        titleId="live-rooms-title"
        description={t('正在玩游戏的房间，进房一起玩')}
        action={<span className="live-rooms-status"><i /> {t('实时更新')}</span>}
      />
      <div className="live-room-filters" role="group" aria-label={t('直播房间分类')}>
        {filters.map((filter) => (
          <button
            className={`filter-chip ${activeFilter === filter.id ? 'is-active' : ''}`}
            type="button"
            key={filter.id}
            aria-pressed={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            {t(filter.label)}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="live-room-grid" aria-busy="true" aria-label={t('加载中')}>
          {[1, 2, 3].map((item) => <div className="live-room-skeleton card" key={item} />)}
        </div>
      ) : visibleRooms.length ? (
        <div className="live-room-grid" role="list">
          {visibleRooms.map((room) => {
            const game = games.find((item) => item.id === room.gameId)
            const unavailable = room.status !== 'live'
            return (
              <article className={`live-room-card card ${unavailable ? 'is-unavailable' : ''}`} role="listitem" key={room.id}>
                <div className="live-room-cover">
                  {game && <GameArtwork game={game} compact />}
                  <span className={`live-room-state ${unavailable ? 'is-muted' : ''}`}>
                    {unavailable ? t(statusLabels[room.status]) : <><i /> {t('直播中')}</>}
                  </span>
                  <span className="live-room-type">{t(typeLabels[room.roomType])}</span>
                </div>
                <div className="live-room-body">
                  <div className="live-room-heading">
                    <div>
                      <h3>{room.title}</h3>
                      <p>{room.host} · {game?.name ?? room.gameId}</p>
                    </div>
                    <strong className="live-room-viewers"><Icon name="users" /> {formatNumber(room.viewers)}</strong>
                  </div>
                  <div className="live-room-meta">
                    <span>{room.seats.occupied}/{room.seats.total} {t('麦位')}</span>
                    {room.tags.slice(1).map((tag) => <span key={tag}>{t(tag)}</span>)}
                  </div>
                  <button className="btn btn-primary live-room-enter" type="button" disabled={unavailable} onClick={() => handleRoomClick(room)}>
                    {t(unavailable ? statusLabels[room.status] : '进入房间')} {!unavailable && <Icon name="chevronRight" />}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state card live-room-empty">
          <Icon name="play" />
          <h3>{t('暂时没有符合条件的房间')}</h3>
          <p>{t('换个分类试试，热门房间会实时更新。')}</p>
        </div>
      )}
    </section>
  )
}

export default LiveRooms
