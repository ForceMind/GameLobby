import { GameCatalog } from '../GameCatalog.jsx'
import { useLocale } from '../useLocale.js'
import LiveRooms from '../components/LiveRooms.jsx'
import '../h5/compactLobby.css'

export default function GamesPage({ openModal, toast, showFullEntryHint }) {
  const { t } = useLocale()
  return (
    <div className="games-page compact-games">
      <section className="page-head">
        <p className="eyebrow">GAME LIBRARY</p>
        <h1>{t('全部游戏')}</h1>
        <p>
          {t('浏览全部 {count} 款游戏，按类型和实时状态快速筛选。', {
            count: 8,
          })}
        </p>
      </section>
      <LiveRooms openModal={openModal} toast={toast} />
      <GameCatalog variant="library" openModal={openModal} toast={toast} />
      <button
        className="compact-fullscreen-entry"
        type="button"
        onClick={showFullEntryHint}
      >
        <span>{t('更多内容')}</span>
      </button>
    </div>
  )
}
