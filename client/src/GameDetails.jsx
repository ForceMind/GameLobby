import { GameArtwork } from './ui.jsx'
import { Icon } from './icons.jsx'
import { useLocale } from './useLocale.js'
import { useH5 } from './h5/useH5.js'
import { gameGate, openInCountry } from './demoModel.js'
import { gameGateText } from './gameGateText.js'
import liteContent from './data/liteContent.json'

export function GameDetailsBody({ game }) {
  const { t, format } = useLocale()
  const player = useH5()
  const gate = gameGate(game, player)
  const inCountry = openInCountry(game, player.country)
  const ready = game.status === 'ready'
  const details = liteContent.gameDetails?.[game.id] ?? {}
  return <div className="game-details-modal">
    <div className="game-details-hero"><GameArtwork game={game} /><div><h3>{game.name}</h3><p>{t(details.descriptionKey ?? 'games.noDescription')}</p>{!ready && <strong className="game-details-status">{t('games.unavailable')}</strong>}</div></div>
    {game.tags?.includes('slots') && <div className="game-details-stats" aria-label={t('games.slotStatsLabel')}>
      <div><span>{t('games.winRate')}</span><strong>{details.winRate ?? '—'}</strong></div><div><span>RTP</span><strong>{details.rtp ?? '—'}</strong></div>
      <div><span>{t('games.winRange')}</span><strong>{details.winRangeMin != null ? t('games.winRangeValue', { min: format.number(details.winRangeMin), max: format.number(details.winRangeMax) }) : '—'}</strong></div><div><span>{t('games.maxMultiplier')}</span><strong>{details.maxMultiplier ?? '—'}</strong></div>
    </div>}
    {!gate.ok && <div className="game-gate-details" role="status">
      <strong><Icon name="lock" />{t('games.gateRequirements')}</strong>
      <ul>{gate.reasons.map((reason) => <li key={reason.key}>{gameGateText(reason, t, format)}</li>)}</ul>
    </div>}
    {!inCountry && <p className="game-details-hint" role="status">{t('games.gateRegionUnavailable')}</p>}
    {!ready && <p className="game-details-hint">{t('games.unavailableHint')}</p>}
  </div>
}

export function GameDetailsActions({ game, onClose }) {
  const { t } = useLocale()
  const player = useH5()
  const canStart = game.status === 'ready' && openInCountry(game, player.country) && gameGate(game, player).ok
  return <>
    <button className="btn btn-secondary" type="button" onClick={onClose}>{t('games.backToBrowsing')}</button>
    <button className="btn btn-primary" type="button" disabled={!canStart} onClick={() => {
      if (player.openGame(game)) onClose()
    }}>{t('games.play')}</button>
  </>
}

