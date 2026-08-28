import { GameCatalog } from '../GameCatalog.jsx'
import { useLocale } from '../useLocale.js'
import '../h5/compactLobby.css'

export default function GamesPage({ openModal, toast }) {
  const { t, href } = useLocale()
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
      <GameCatalog variant="library" openModal={openModal} toast={toast} />
      <a
        className="compact-fullscreen-entry"
        href={href('games.html?mode=full')}
      >
        <span>{t('全屏查看更多')}</span>
      </a>
    </div>
  )
}
