import { useMemo, useState } from 'react'
import { Icon } from './icons.jsx'
import { gameCategories, games, recentGames } from './data.js'
import useGameDetails from './useGameDetails.jsx'
import { GameArtwork, SectionHeader } from './ui.jsx'
import { filterGames } from './demoModel.js'
import { useLocale } from './useLocale.js'
import { useH5 } from './h5/useH5.js'
import { useCategoryLabel } from './useCategoryLabel.js'

function GameCard({ game, openModal }) {
  const { t } = useLocale()
  const categoryLabel = useCategoryLabel()
  const showGameDetails = useGameDetails(openModal)
  const badgeLabels = {
    HOT: 'games.badgeHot',
    TREND: 'games.badgeTrend',
    NEW: 'games.badgeNew',
    FUN: 'games.badgeFun',
    JACKPOT: 'common.jackpot',
    LIVE: 'games.tagLive',
  }
  return (
    <button
      className={`game-card card game-status-${game.status}`}
      type="button"
      onClick={() => showGameDetails(game)}
    >
      <span className="game-cover">
        <GameArtwork game={game} />
        <span className="badge-row">
          {game.badges.map((badge) => (
            <span className="pill" key={badge}>
              {badge === 'HEAT'
                ? t('games.popularityBadge', { value: game.heat })
                : t(badgeLabels[badge] ?? badge)}
            </span>
          ))}
        </span>
        {game.status !== 'ready' && (
          <span className="game-state">
            {t(
              game.status === 'maintenance'
                ? 'games.statusMaintenance'
                : game.status === 'upcoming'
                  ? 'games.statusUpcoming'
                  : 'games.statusUnavailable',
            )}
          </span>
        )}
      </span>
      <span className="game-body">
        <strong>{game.name}</strong>
        <span>
          <span>{categoryLabel(game)}</span>
          <span title={t('games.playersHint')}>
            <Icon name="users" /> {game.players}
          </span>
        </span>
      </span>
    </button>
  )
}

export function RecentGames({ openModal, recentVisibility = true }) {
  const { t } = useLocale()
  const categoryLabel = useCategoryLabel()
  const showGameDetails = useGameDetails(openModal)
  const onKeyDown = (event) => {
    if (
      event.target !== event.currentTarget ||
      (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
    )
      return
    event.preventDefault()
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    event.currentTarget.scrollBy({
      left: event.key === 'ArrowRight' ? 280 : -280,
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }
  return (
    <section className="section lobby-recent" aria-labelledby="recent-title">
      <div className="section-head">
        <div>
          <p className="eyebrow">WELCOME BACK</p>
          <h1 id="recent-title">{t('lobby.recentTitle')}</h1>
          <p id="recent-games-hint">
            {t('lobby.recentHint')}
          </p>
        </div>
        <span className="recent-visibility"><Icon name="users" />{t(recentVisibility ? 'lobby.recentVisibleToFriends' : 'lobby.recentVisibleToSelf')}</span>
      </div>
      <div
        className="recent-list"
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="region"
        aria-label={t('lobby.recentListLabel')}
        aria-keyshortcuts="ArrowLeft ArrowRight"
        aria-describedby="recent-games-hint"
      >
        {recentGames.map((game) => (
          <button
            className="recent-card card"
            type="button"
            key={game.id}
            onClick={() => showGameDetails(game)}
          >
            <GameArtwork game={game} compact />
            <span className="recent-copy">
              <strong>{game.name}</strong>
              <small>{categoryLabel(game)}</small>
              <span>{t(game.recent)}</span>
            </span>
            <Icon name="chevronRight" />
          </button>
        ))}
      </div>
    </section>
  )
}

export function GameCatalog({ variant = 'library', openModal }) {
  const { country } = useH5()
  const { t, href } = useLocale()
  const popular = variant === 'popular'
  const [category, updateCategory] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get(
      'category',
    )
    const allowed = popular
      ? ['popular', 'slots', 'casual', 'realtime']
      : ['all', 'slots', 'casual', 'realtime']
    return allowed.includes(requested) ? requested : popular ? 'popular' : 'all'
  })
  const setCategory = (value) => {
    updateCategory(value)
    const url = new URL(window.location.href)
    url.searchParams.set('category', value)
    window.history.replaceState(null, '', url)
  }
  const [advanced, setAdvanced] = useState(false)
  const [onlyReady, setOnlyReady] = useState(false)
  const [onlyRealtime, setOnlyRealtime] = useState(false)
  const categoryItems = popular
    ? [
        { id: 'popular', label: 'lobby.filterPopular' },
        ...gameCategories.filter((item) => item.id !== 'all'),
      ]
    : gameCategories
  const visibleGames = useMemo(() => {
    const filtered = filterGames(games, category, onlyReady, onlyRealtime, country)
    return popular && category === 'popular' ? filtered.slice(0, 4) : filtered
  }, [category, onlyReady, onlyRealtime, popular, country])
  const clearFilters = () => {
    setCategory(popular ? 'popular' : 'all')
    setOnlyReady(false)
    setOnlyRealtime(false)
  }

  return (
    <section
      className="section"
      id={popular ? 'games' : 'game-catalog'}
      aria-labelledby={popular ? 'popular-games-title' : 'game-catalog-title'}
    >
      <SectionHeader
        title={t(popular ? 'lobby.popularTitle' : 'games.libraryTitle')}
        titleId={popular ? 'popular-games-title' : 'game-catalog-title'}
        description={t(
          popular
            ? 'lobby.popularHint'
            : 'games.libraryHint',
        )}
        action={
          popular ? (
            <a className="text-action" href={href('games.html')}>
              {t('games.allTitle')} <Icon name="chevronRight" />
            </a>
          ) : (
            <button
              className={`icon-btn ${advanced || onlyReady || onlyRealtime ? 'is-active' : ''}`}
              type="button"
              aria-label={t('games.filterToggleLabel')}
              aria-controls="catalog-advanced-filters"
              aria-expanded={advanced}
              onClick={() => setAdvanced((value) => !value)}
            >
              <Icon name="filter" />
            </button>
          )
        }
      />
      <div className="catalog-filters">
        <div className="filter-row" role="group" aria-label={t('games.categoriesLabel')}>
          {categoryItems.map((item) => (
            <button
              key={item.id}
              className={`filter-chip ${category === item.id ? 'is-active' : ''}`}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        {!popular && (
          <div
            className="filter-toggle"
            id="catalog-advanced-filters"
            role="group"
            aria-label={t('games.filterAdvancedLabel')}
            hidden={!advanced}
          >
            <label>
              <input
                type="checkbox"
                checked={onlyReady}
                onChange={(event) => setOnlyReady(event.target.checked)}
              />
              {t('games.filterAvailable')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={onlyRealtime}
                onChange={(event) => setOnlyRealtime(event.target.checked)}
              />
              {t('games.filterLive')}
            </label>
            <button
              className="text-action"
              type="button"
              onClick={clearFilters}
            >
              {t('games.clearFilters')}
            </button>
          </div>
        )}
      </div>
      {!popular && (
        <p className="catalog-count" role="status">
          {t('games.resultCount', {
            count: visibleGames.length,
            total: games.length,
          })}
          {onlyReady && <> · {t('games.filterAvailable')}</>}
          {onlyRealtime && <> · {t('games.filterLive')}</>}
        </p>
      )}
      {visibleGames.length ? (
        <div className="catalog-results game-grid">
          {visibleGames.map((game) => (
            <GameCard game={game} key={game.id} openModal={openModal} />
          ))}
        </div>
      ) : (
        <div className="empty-state card">
          <Icon name="filter" />
          <h3>{t('games.emptyTitle')}</h3>
          <p>{t('games.emptyHint')}</p>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={clearFilters}
          >
            {t('games.clearFilters')}
          </button>
        </div>
      )}
    </section>
  )
}
