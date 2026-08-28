import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { navItems } from './data.js'
import { Icon } from './icons.jsx'
import { Modal } from './ui.jsx'
import { useLocale } from './useLocale.js'
import { useH5 } from './h5/useH5.js'
import EntryGate from './h5/EntryGate.jsx'
import GameSession from './h5/GameSession.jsx'
import EventsPage from './pages/EventsPage.jsx'
import GamesPage from './pages/GamesPage.jsx'
import LobbyPage from './pages/LobbyPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import StorePage from './pages/StorePage.jsx'
import TournamentsPage from './pages/TournamentsPage.jsx'
import './h5/h5.css'
import { formatWalletLabel } from './format.js'

function MainNav({ page, mobile = false }) {
  const { t, href } = useLocale()
  const navPage = page === 'games' ? 'lobby' : page
  return (
    <nav
      className={mobile ? 'bottom-nav' : 'desktop-nav'}
      aria-label={t('主导航')}
    >
      {navItems.map((item) => (
        <a
          key={item.id}
          className={navPage === item.id ? 'is-active' : ''}
          href={href(item.href)}
          aria-label={
            item.badge
              ? t('{label}，有新活动', { label: t(item.label) })
              : t(item.label)
          }
          aria-current={
            navPage === item.id
              ? page === 'games'
                ? 'location'
                : 'page'
              : undefined
          }
        >
          <Icon name={item.icon} />
          <span>{t(item.label)}</span>
          {item.badge && <span className="nav-notice" aria-hidden="true" />}
        </a>
      ))}
    </nav>
  )
}

function AppHeader({ page, openModal }) {
  const { t, href } = useLocale()
  const { mode, setMode, closeLobby, wallet: balances } = useH5()
  const showGems = () =>
    openModal({
      title: t('宝石'),
      subtitle: t('当前余额：{value}', { value: balances.gemsLabel }),
      body: (
        <div className="wallet-detail">
          <span className="asset-symbol gem">
            <Icon name="gem" />
          </span>
          <p>
            {t('宝石可用于指定活动与赛事，也可以从签到、任务和礼包中获取。')}
          </p>
          <a className="btn btn-primary" href={href('events.html#tasks')}>
            {t('获取宝石')}
          </a>
          <a className="btn btn-secondary" href={href('store.html')}>
            {t('查看礼包')}
          </a>
        </div>
      ),
      confirmLabel: t('关闭'),
      cancelLabel: null,
    })
  return (
    <header className="app-header">
      <div className="header-inner">
        {page === 'games' ? (
          <a
            className="exit-button"
            href={href('lobby.html')}
            aria-label={t('返回大厅')}
          >
            <Icon name="chevronLeft" />
            <span>{t('返回大厅')}</span>
          </a>
        ) : (
          <button
            className="exit-button"
            type="button"
            onClick={closeLobby}
            aria-label={t('返回 App')}
          >
            <Icon name="chevronLeft" />
            <span>{t('返回 App')}</span>
          </button>
        )}
        <a
          className="brand"
          href={href('lobby.html')}
          aria-label={t('Joyloop 大厅')}
        >
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span className="brand-copy">
            <strong>Joyloop</strong>
            <small>Play on the bright side.</small>
          </span>
        </a>
        <MainNav page={page} />
        <div className="asset-cluster" aria-label={t('资产余额')}>
          <a
            className="asset-chip asset-chip-action"
            href={href('store.html')}
            aria-label={t('金币余额：{value}，点击购买', {
              value: balances.coinsLabel,
            })}
          >
            <span className="asset-symbol coin">
              <Icon name="coin" />
            </span>
            <span>
              <small>{t('金币')}</small>
              <strong>{formatWalletLabel(balances.coins)}</strong>
            </span>
            <span className="asset-add" aria-hidden="true">
              +
            </span>
          </a>
          <button
            className="asset-chip asset-chip-action"
            type="button"
            onClick={showGems}
            aria-label={t('宝石余额：{value}，查看获取方式', {
              value: balances.gemsLabel,
            })}
          >
            <span className="asset-symbol gem">
              <Icon name="gem" />
            </span>
            <span>
              <small>{t('宝石')}</small>
              <strong>{formatWalletLabel(balances.gems)}</strong>
            </span>
            <span className="asset-add" aria-hidden="true">
              +
            </span>
          </button>
        </div>
        <button
          className="icon-btn lobby-mode-button"
          type="button"
          onClick={() => setMode(mode === 'half' ? 'full' : 'half')}
          aria-label={t(mode === 'half' ? '全屏打开大厅' : '切换半屏大厅')}
          title={t(mode === 'half' ? '全屏打开大厅' : '切换半屏大厅')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d={
                mode === 'half'
                  ? 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5'
                  : 'M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5'
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default function App() {
  const { t, locale } = useLocale()
  const { accepted, mode, game, closeGame, account } = useH5()
  const documentPage = document.body.dataset.page
  const page = [
    'lobby',
    'games',
    'tournaments',
    'events',
    'store',
    'profile',
  ].includes(documentPage)
    ? documentPage
    : 'lobby'
  const [modal, setModal] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const toastLocale = useRef(locale)
  const closeModal = useCallback(() => setModal(null), [])
  const toast = useCallback(
    (message) =>
      setToastMessage({ text: message, locale: toastLocale.current }),
    [],
  )

  useEffect(() => {
    toastLocale.current = locale
  }, [locale])
  useEffect(() => {
    if (!accepted) return undefined
    const scrollToHash = () => {
      try {
        const id = decodeURIComponent(window.location.hash.slice(1))
        const target = id && document.getElementById(id)
        if (target) {
          target.scrollIntoView({ block: 'start', behavior: 'auto' })
          target.tabIndex = -1
          target.focus({ preventScroll: true })
        }
      } catch {
        /* Malformed anchors do not block the lobby. */
      }
    }
    const frame = window.requestAnimationFrame(scrollToHash)
    window.addEventListener('hashchange', scrollToHash)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', scrollToHash)
    }
  }, [accepted])
  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const renderPage = () => {
    const props = { openModal: setModal, toast }
    if (page === 'games') return <GamesPage {...props} />
    if (page === 'tournaments') return <TournamentsPage {...props} />
    if (page === 'events') return <EventsPage {...props} />
    if (page === 'store') return <StorePage {...props} />
    if (page === 'profile') return <ProfilePage key={account.id} {...props} />
    return <LobbyPage {...props} />
  }

  if (!accepted) return <EntryGate />

  return (
    <div className="h5-stage">
      <div className={`h5-lobby is-${mode}`} data-display-mode={mode}>
        <div className="app-root">
          <div className="app-surface" inert={modal || game ? true : undefined}>
            <a className="skip-link" href="#main">
              {t('跳到主要内容')}
            </a>
            <div className="background-orbs" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <AppHeader page={page} openModal={setModal} />
            <main className="page-shell" id="main">
              {renderPage()}
            </main>
            <MainNav page={page} mobile />
          </div>
          {toastMessage && toastMessage.locale === locale && (
            <div className="toast" role="status">
              <Icon name="star" />
              {toastMessage.text}
            </div>
          )}
          <Modal modal={modal} onClose={closeModal} />
        </div>
      </div>
      {game && <GameSession key={game.id} game={game} onClose={closeGame} />}
    </div>
  )
}
