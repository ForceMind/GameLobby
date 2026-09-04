import { Icon } from '../icons.jsx'
import { games, liveRooms } from '../data.js'
import { GameArtwork } from '../ui.jsx'
import { useLocale } from '../useLocale.js'
import { openLiveRoom } from '../h5/liveRoomBridge.js'
import '../styles/liveRoomsTeaser.css'

const roomTypeLabels = {
  family: '家族厅',
  party: '派对房',
  solo: '单人游戏房',
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

export default function LiveRoomsTeaser({ href, toast }) {
  const { t } = useLocale()
  const activeRooms = liveRooms
    .filter((room) => room.status === 'live')
    .sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id))
    .slice(0, 3)

  const enterRoom = (room) => {
    const result = openLiveRoom({
      roomId: room.id,
      gameId: room.gameId,
      entry: 'live_teaser',
    })
    const message = result?.preview
      ? t('已打开 {name} 的房间预览', { name: room.title })
      : result?.status === 'failed'
        ? t('play.liveRoomFailed')
        : t('正在进入 {name}', { name: room.title })
    toast?.(message)
  }

  return (
    <section className="section live-rooms-teaser" aria-labelledby="live-teaser-title">
      <div className="live-teaser-head">
        <div className="live-teaser-heading">
          <span className="live-teaser-icon"><Icon name="play" /></span>
          <div className="live-teaser-copy">
            <span className="eyebrow">LIVE ROOMS</span>
            <h2 id="live-teaser-title">{t('正在直播')}</h2>
            <p>{t('{count} 个房间正在玩游戏，进房一起玩。', { count: liveRooms.filter((room) => room.status === 'live').length })}</p>
          </div>
        </div>
        <a className="text-action live-teaser-all" href={href('games.html?from=game_center&entry=hot_rooms#live-rooms')}>
          {t('查看全部房间')} <Icon name="chevronRight" />
        </a>
      </div>
      <div className="live-teaser-rooms" role="list" aria-label={t('直播中的房间')}>
        {activeRooms.map((room) => {
          const game = games.find((item) => item.id === room.gameId)
          return (
            <article className="live-teaser-room card" role="listitem" key={room.id}>
              <div className="live-teaser-room-art">
                {game ? <GameArtwork game={game} compact /> : <Icon name="play" />}
                <span className="live-teaser-live"><i />{t('直播中')}</span>
              </div>
              <div className="live-teaser-room-body">
                <div className="live-teaser-room-title">
                  <strong>{room.title}</strong>
                  <span>{formatNumber(room.viewers)} {t('人在线')}</span>
                </div>
                <p>{room.host} · {t(game?.name ?? room.gameId)} · {t(roomTypeLabels[room.roomType])}</p>
                <button className="btn btn-primary live-teaser-enter" type="button" onClick={() => enterRoom(room)}>
                  {t('进入房间')} <Icon name="chevronRight" />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
