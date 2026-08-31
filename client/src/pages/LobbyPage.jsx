import { useEffect, useState } from 'react'
import { Icon } from '../icons.jsx'
import { banners } from '../data.js'
import { SectionHeader } from '../ui.jsx'
import { GameCatalog, RecentGames } from '../GameCatalog.jsx'
import { useLocale } from '../useLocale.js'
import { useH5 } from '../h5/useH5.js'
import SocialActivities from '../components/SocialActivities.jsx'
import '../h5/compactLobby.css'

const winnerRows = [
  ['NovaRay', '累积大奖 · Golden Pharaoh', '+268,800'],
  ['MintCat', '连续 12 局获奖', '+98,600'],
  ['BlueFin', '休闲挑战 · Fish Hunter', '+65,200'],
  ['CloudNine', '连续 8 局获奖', '+42,900'],
]

export default function LobbyPage({
  openModal,
  toast,
  showFullEntryHint,
  privacySettings = { shareRecentGames: true },
}) {
  const { t, href } = useLocale()
  const { mode } = useH5()
  const [bannerIndex, setBannerIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)

  useEffect(() => {
    if (
      mode === 'half' ||
      paused ||
      interacting ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return undefined
    const timer = window.setInterval(
      () => setBannerIndex((current) => (current + 1) % banners.length),
      5600,
    )
    return () => window.clearInterval(timer)
  }, [mode, paused, interacting])

  const banner = banners[bannerIndex]
  const renderWinners = () => (
    <div className="winner-list card">
      {winnerRows.map(([name, detail, prize], index) => (
        <div className="winner-row" key={name}>
          <span className="rank">{index + 1}</span>
          <span>
            <strong>{name}</strong>
            <small>{t(detail)}</small>
          </span>
          <strong className="positive">{prize}</strong>
        </div>
      ))}
    </div>
  )

  return (
    <div className="lobby-page compact-lobby">
      {mode !== 'half' && <RecentGames openModal={openModal} toast={toast} recentVisibility={privacySettings.shareRecentGames} />}

      <div className="page-layout lobby-games-row">
        <GameCatalog variant="popular" openModal={openModal} toast={toast} />

        <aside className="side-rail lobby-winners">
          <section className="section">
            <SectionHeader
              title={t('今日赢家榜')}
              description={t('今日游戏高光')}
              action={
                <button
                  className="text-action"
                  type="button"
                  onClick={() =>
                    openModal({
                      title: t('今日赢家榜'),
                      subtitle: t('今日精彩表现'),
                      body: renderWinners(),
                      confirmLabel: t('关闭'),
                      cancelLabel: null,
                    })
                  }
                >
                  {t('查看榜单')} <Icon name="chevronRight" />
                </button>
              }
            />
            {renderWinners()}
          </section>
        </aside>
      </div>

      {mode !== 'half' && <SocialActivities openModal={openModal} toast={toast} />}

      {mode === 'half' && <RecentGames openModal={openModal} toast={toast} recentVisibility={privacySettings.shareRecentGames} />}

      <section className="section lobby-promotions" aria-label={t('精选活动')}>
        <div
          className={`banner card banner-${banner.accent}`}
          role="region"
          aria-roledescription={t('轮播')}
          aria-label={t('精选活动')}
          onMouseEnter={() => setInteracting(true)}
          onMouseLeave={() => setInteracting(false)}
          onFocusCapture={() => setInteracting(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setInteracting(false)
          }}
        >
          <div
            className="banner-copy"
            id="featured-banner-content"
            aria-live={paused ? 'polite' : 'off'}
          >
            <span className="pill pill-light">{t(banner.badge)}</span>
            <h2>{t(banner.title)}</h2>
            <p>{t(banner.subtitle)}</p>
            {bannerIndex === 0 && (
              <strong className="banner-number">
                8,880,000 <small>{t('金币奖池')}</small>
              </strong>
            )}
          </div>
          <div className="banner-actions">
            <a
              className="btn btn-light"
              href={href(
                bannerIndex === 0
                  ? 'events.html#wheel'
                  : `games.html?category=${bannerIndex === 1 ? 'slots' : 'casual'}#game-catalog`,
              )}
            >
              {t(banner.cta)}
            </a>
            <a className="btn btn-ghost-light" href={href('events.html')}>
              {t('活动中心')}
            </a>
          </div>
          <div className="banner-controls" aria-label={t('活动轮播控制')}>
            {banners.map((item, index) => (
              <button
                key={item.title}
                type="button"
                className={index === bannerIndex ? 'is-active' : ''}
                aria-label={t('显示第 {number} 张活动', { number: index + 1 })}
                aria-controls="featured-banner-content"
                aria-pressed={index === bannerIndex}
                onClick={() => setBannerIndex(index)}
              />
            ))}
            <button
              className="pause-button"
              type="button"
              aria-pressed={paused}
              aria-label={t(paused ? '继续自动轮播' : '暂停自动轮播')}
              onClick={() => setPaused((value) => !value)}
            >
              {t(paused ? '继续' : '暂停')}
            </button>
          </div>
        </div>
      </section>

      <section className="section lobby-quick-actions">
        <SectionHeader
          title={t('快捷入口')}
          description={t('奖励、游戏与记录一触即达')}
        />
        <div className="quick-grid">
          {[
            ['bolt', '免费旋转', '今日剩余 3 次', 'events.html#wheel', '新'],
            [
              'jackpot',
              '累积大奖',
              '浏览老虎机',
              'games.html?category=slots#game-catalog',
              null,
            ],
            ['gift', '每日任务', '查看每日进度', 'events.html#tasks', '任务'],
            ['clock', '最近战绩', '查看最近记录', 'profile.html#records', null],
          ].map(([icon, title, detail, destination, badge]) => (
            <a className="quick-card card" href={href(destination)} key={title}>
              <span className="quick-mark">
                <Icon name={icon} />
              </span>
              <span>
                <strong>{t(title)}</strong>
                <small>{t(detail)}</small>
              </span>
              {badge && <span className="pill">{t(badge)}</span>}
            </a>
          ))}
        </div>
      </section>
      <button
        className="compact-fullscreen-entry"
        type="button"
        onClick={showFullEntryHint}
      >
        <span>{t('更多内容')}</span>
        <Icon name="chevronRight" />
      </button>
    </div>
  )
}
