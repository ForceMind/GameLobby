import { GameCatalog } from '../GameCatalog.jsx'
import { useLocale } from '../useLocale.js'
import '../h5/compactLobby.css'

export default function GamesPage({ openModal, toast, showFullEntryHint }) {
  const { t } = useLocale()
  return (
    <div className="games-page compact-games">
      <section className="page-head">
        <p className="eyebrow">GAME LIBRARY</p>
        <h1>{t('games.allTitle')}</h1>
        <p>
          {t('games.allSubtitle', {
            count: 8,
          })}
        </p>
      </section>
      <GameCatalog variant="library" openModal={openModal} toast={toast} />
      <button
        className="compact-fullscreen-entry"
        type="button"
        onClick={showFullEntryHint}
      >
        <span>{t('common.fullEntry')}</span>
      </button>
    </div>
  )
}
