import { GameArtwork } from './ui.jsx'
import { useLocale } from './useLocale.js'
import { useCategoryLabel } from './useCategoryLabel.js'
import { useH5 } from './h5/useH5.js'
import liteContent from './data/liteContent.json'

export default function useGameDetails(openModal) {
  const { t } = useLocale()
  const categoryLabel = useCategoryLabel()
  const { openGame } = useH5()
  return (game) => {
    const ready = game.status === 'ready'
    const details = liteContent.gameDetails?.[game.id] ?? {}
    openModal({ title: game.name, kicker: t('games.detailsKicker'), subtitle: categoryLabel(game),
      body: <div className="game-details-modal"><div className="game-details-hero"><GameArtwork game={game} /><div><h3>{game.name}</h3><p>{t(details.descriptionKey ?? 'games.noDescription')}</p>{!ready && <strong className="game-details-status">{t('games.unavailable')}</strong>}</div></div>
        {game.tags?.includes('slots') && <div className="game-details-stats" aria-label={t('games.slotStatsLabel')}>
          <div><span>{t('games.winRate')}</span><strong>{details.winRate ?? '—'}</strong></div><div><span>RTP</span><strong>{details.rtp ?? '—'}</strong></div>
          <div><span>{t('games.winRange')}</span><strong>{t(details.winRange ?? '—')}</strong></div><div><span>{t('games.maxMultiplier')}</span><strong>{details.maxMultiplier ?? '—'}</strong></div>
        </div>}{!ready && <p className="game-details-hint">{t('games.unavailableHint')}</p>}</div>,
      confirmLabel: t(ready ? 'games.play' : 'games.backToBrowsing'), cancelLabel: ready ? t('common.cancel') : null,
      onConfirm: ready ? () => openGame(game) : undefined,
    })
  }
}
