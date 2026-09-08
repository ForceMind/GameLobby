import { useLocale } from './useLocale.js'
import { useCategoryLabel } from './useCategoryLabel.js'
import { GameDetailsBody, GameDetailsActions } from './GameDetails.jsx'

export default function useGameDetails(openModal) {
  const { t } = useLocale()
  const categoryLabel = useCategoryLabel()
  return (game) => {
    // Stored modal elements subscribe here so host updates refresh an open
    // dialog's requirements and start button instead of retaining a snapshot.
    openModal({
      title: game.name, kicker: t('games.detailsKicker'), subtitle: categoryLabel(game),
      body: <GameDetailsBody game={game} />,
      actions: <GameDetailsActions game={game} onClose={() => openModal(null)} />,
    })
  }
}
