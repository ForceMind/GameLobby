import { useMemo, useState } from 'react'
import { Icon } from './icons.jsx'
import { gameCategories, games, recentGames } from './data.js'
import { GameArtwork, SectionHeader } from './ui.jsx'
import { filterGames } from './demoModel.js'
import { useLocale } from './useLocale.js'
import { useH5 } from './h5/useH5.js'

function gameStatusCopy(status) {
  return (
    {
      maintenance: '正在维护，当前无法进入。',
      upcoming: '即将上线，可以先记下它。',
      unavailable: '当前不可用，请稍后再试。',
    }[status] ?? '状态暂不可用，请稍后查看。'
  )
}

function openGameDetails(game, openModal, t, openGame) {
  const isReady = game.status === 'ready'
  if (isReady) {
    openGame(game)
    return
  }
  openModal({
    title: game.name,
    kicker: t(game.categoryLabel),
    subtitle: t('游戏暂不可用'),
    body: (
      <div className="game-preview">
        <GameArtwork game={game} />
        <div>
          <h3>{t(gameStatusCopy(game.status))}</h3>
          <p>{t('请稍后再来，或选择其他游戏。')}</p>
        </div>
      </div>
    ),
    confirmLabel: t('返回浏览'),
    cancelLabel: null,
  })
}

function GameCard({ game, openModal }) {
  const { t } = useLocale()
  const { openGame } = useH5()
  const badgeLabels = {
    HOT: '热门',
    TREND: '流行',
    NEW: '新游',
    FUN: '趣味',
    JACKPOT: '累积大奖',
  }
  return (
    <button
      className={`game-card card game-status-${game.status}`}
      type="button"
      onClick={() => openGameDetails(game, openModal, t, openGame)}
    >
      <span className="game-cover">
        <GameArtwork game={game} />
        <span className="badge-row">
          {game.badges.map((badge) => (
            <span className="pill" key={badge}>
              {badge.startsWith('热度 ')
                ? t('热度 {value}', { value: game.heat })
                : t(badgeLabels[badge] ?? badge)}
            </span>
          ))}
        </span>
        {game.status !== 'ready' && (
          <span className="game-state">
            {t(
              game.status === 'maintenance'
                ? '维护中'
                : game.status === 'upcoming'
                  ? '即将上线'
                  : '暂不可用',
            )}
          </span>
        )}
      </span>
      <span className="game-body">
        <strong>{game.name}</strong>
        <span>
          <span>{t(game.categoryLabel)}</span>
          <span title={t('在线人数；破折号表示暂未开放。')}>
            <Icon name="users" /> {game.players}
          </span>
        </span>
      </span>
    </button>
  )
}

export function RecentGames({ openModal, recentVisibility = true }) {
  const { t } = useLocale()
  const { openGame } = useH5()
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
          <h1 id="recent-title">{t('最近在玩')}</h1>
          <p id="recent-games-hint">
            {t('滑动或用方向键浏览，点击开始游戏。')}
          </p>
        </div>
        <span className="recent-visibility"><Icon name="users" />{t(recentVisibility ? '好友可见' : '仅自己可见')}</span>
      </div>
      <div
        className="recent-list"
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="region"
        aria-label={t('最近玩过的游戏')}
        aria-keyshortcuts="ArrowLeft ArrowRight"
        aria-describedby="recent-games-hint"
      >
        {recentGames.map((game) => (
          <button
            className="recent-card card"
            type="button"
            key={game.id}
            onClick={() => openGameDetails(game, openModal, t, openGame)}
          >
            <GameArtwork game={game} compact />
            <span className="recent-copy">
              <strong>{game.name}</strong>
              <small>{t(game.categoryLabel)}</small>
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
        { id: 'popular', label: '热门' },
        ...gameCategories.filter((item) => item.id !== 'all'),
      ]
    : gameCategories
  const visibleGames = useMemo(() => {
    const filtered = filterGames(games, category, onlyReady, onlyRealtime)
    return popular && category === 'popular' ? filtered.slice(0, 4) : filtered
  }, [category, onlyReady, onlyRealtime, popular])
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
        title={t(popular ? '热门游戏' : '游戏目录')}
        titleId={popular ? 'popular-games-title' : 'game-catalog-title'}
        description={t(
          popular
            ? '热门游戏，为你精选'
            : '选择游戏，即可开始；未开放的游戏可查看状态。',
        )}
        action={
          popular ? (
            <a className="text-action" href={href('games.html')}>
              {t('全部游戏')} <Icon name="chevronRight" />
            </a>
          ) : (
            <button
              className={`icon-btn ${advanced || onlyReady || onlyRealtime ? 'is-active' : ''}`}
              type="button"
              aria-label={t('筛选更多条件')}
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
        <div className="filter-row" role="group" aria-label={t('游戏分类')}>
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
            aria-label={t('更多筛选')}
            hidden={!advanced}
          >
            <label>
              <input
                type="checkbox"
                checked={onlyReady}
                onChange={(event) => setOnlyReady(event.target.checked)}
              />
              {t('仅可进入')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={onlyRealtime}
                onChange={(event) => setOnlyRealtime(event.target.checked)}
              />
              {t('仅实时')}
            </label>
            <button
              className="text-action"
              type="button"
              onClick={clearFilters}
            >
              {t('清除筛选')}
            </button>
          </div>
        )}
      </div>
      {!popular && (
        <p className="catalog-count" role="status">
          {t('显示 {count} / {total} 款', {
            count: visibleGames.length,
            total: games.length,
          })}
          {onlyReady && <> · {t('仅可进入')}</>}
          {onlyRealtime && <> · {t('仅实时')}</>}
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
          <h3>{t('没有匹配的游戏')}</h3>
          <p>{t('调整筛选条件后再试。')}</p>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={clearFilters}
          >
            {t('清除筛选')}
          </button>
        </div>
      )}
    </section>
  )
}
