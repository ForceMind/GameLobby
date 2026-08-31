import { Icon } from '../icons.jsx'
import { games, liveRooms } from '../data.js'
import { useLocale } from '../useLocale.js'
import '../styles/liveRoomsTeaser.css'

export default function LiveRoomsTeaser({ href }) {
  const { t } = useLocale()
  const activeRooms = liveRooms.filter((room) => room.status === 'live')
  return (
    <section className="section live-rooms-teaser" aria-labelledby="live-teaser-title">
      <div className="live-teaser-card card">
        <span className="live-teaser-icon"><Icon name="play" /></span>
        <div className="live-teaser-copy">
          <span className="eyebrow">LIVE ROOMS</span>
          <h2 id="live-teaser-title">{t('正在直播')}</h2>
          <p>{t('{count} 个房间正在玩游戏，进房一起玩。', { count: activeRooms.length })}</p>
        </div>
        <div className="live-teaser-games" aria-label={t('直播中的游戏')}>
          {activeRooms.slice(0, 3).map((room) => {
            const game = games.find((item) => item.id === room.gameId)
            return <span className="live-teaser-game" key={room.id}><i />{t(game?.name ?? room.gameId)}</span>
          })}
        </div>
        <a className="btn btn-primary live-teaser-cta" href={href('games.html?from=game_center&entry=hot_rooms#live-rooms')}>
          {t('查看直播房间')} <Icon name="chevronRight" />
        </a>
      </div>
    </section>
  )
}
