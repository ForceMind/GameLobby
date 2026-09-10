import { useMemo } from 'react'
import { GameArtwork } from './ui.jsx'
import { Icon } from './icons.jsx'
import { useLocale } from './useLocale.js'
import { useH5 } from './h5/useH5.js'
import { gameGate, openInCountry } from './demoModel.js'
import { gameGateText } from './gameGateText.js'
import { gameContentKeys } from './catalogConfig.js'
import liteContent from './data/liteContent.json'
import { usePublishedCatalog } from './usePublishedCatalog.js'

function translatedContent(translations, key, locale) {
  const entry = translations?.[key]
  if (!entry) return ''
  const localized = String(entry[locale] ?? '').trim()
  return localized || String(entry.en ?? '').trim()
}

function ContentSection({ title, text }) {
  if (!text) return null
  return <section className="game-details-content">
    <h4>{title}</h4>
    <p style={{ whiteSpace: 'pre-line' }}>{text}</p>
  </section>
}

export function GameDetailsBody({ game }) {
  const { t, format, locale } = useLocale()
  const player = useH5()
  const { games = [], translations = {} } = usePublishedCatalog()
  const currentGame = useMemo(
    () => games.find((candidate) => candidate.id === game.id) ?? game,
    [games, game],
  )
  const gate = gameGate(currentGame, player)
  const inCountry = openInCountry(currentGame, player.country)
  const ready = currentGame.status === 'ready'
  const baselineDetails = liteContent.gameDetails?.[currentGame.id] ?? {}
  const details = { ...baselineDetails, ...(currentGame.details ?? {}) }
  const contentKeys = gameContentKeys(currentGame)
  const description = translatedContent(translations, contentKeys.description, locale)
    || t(contentKeys.description)
  const instructions = translatedContent(translations, contentKeys.instructions, locale)
  const rules = translatedContent(translations, contentKeys.rules, locale)

  return <div className="game-details-modal">
    <div className="game-details-hero">
      <GameArtwork game={currentGame} />
      <div>
        <h3>{currentGame.name}</h3>
        <p style={{ whiteSpace: 'pre-line' }}>{description}</p>
        {!ready && <strong className="game-details-status">{t('games.unavailable')}</strong>}
      </div>
    </div>
    {currentGame.gameType === 'slots' && <div className="game-details-stats" aria-label={t('games.slotStatsLabel')}>
      <div><span>{t('games.winRate')}</span><strong>{details.winRate ?? '—'}</strong></div>
      <div><span>RTP</span><strong>{details.rtp ?? '—'}</strong></div>
      <div><span>{t('games.winRange')}</span><strong>{details.winRangeMin != null ? t('games.winRangeValue', { min: format.number(details.winRangeMin), max: format.number(details.winRangeMax) }) : '—'}</strong></div>
      <div><span>{t('games.maxMultiplier')}</span><strong>{details.maxMultiplier ?? '—'}</strong></div>
    </div>}
    {instructions && <ContentSection title={t('games.instructionsTitle')} text={instructions} />}
    {rules && <ContentSection title={t('games.rulesTitle')} text={rules} />}
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
  const { games = [] } = usePublishedCatalog()
  const currentGame = useMemo(
    () => games.find((candidate) => candidate.id === game.id) ?? game,
    [games, game],
  )
  const canStart = currentGame.status === 'ready' && openInCountry(currentGame, player.country) && gameGate(currentGame, player).ok
  return <>
    <button className="btn btn-secondary" type="button" onClick={onClose}>{t('games.backToBrowsing')}</button>
    <button className="btn btn-primary" type="button" disabled={!canStart} onClick={() => {
      if (player.openGame(currentGame)) onClose()
    }}>{t('games.play')}</button>
  </>
}
