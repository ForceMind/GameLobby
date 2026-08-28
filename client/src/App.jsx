import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { navItems } from './data.js'
import { Icon } from './icons.jsx'
import { Modal } from './ui.jsx'
import { useLocale } from './useLocale.js'
import { useH5 } from './h5/useH5.js'
import WalletDetails from './h5/WalletDetails.jsx'
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

function AppHeader({ page, openWallet }) {
  const { t, href } = useLocale()
  const { closeLobby, canCloseLobby, wallet: balances } = useH5()
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
        ) : canCloseLobby ? (
          <button
            className="exit-button"
            type="button"
            onClick={closeLobby}
            aria-label={t('退出大厅')}
          >
            <Icon name="chevronLeft" />
            <span>{t('退出大厅')}</span>
          </button>
        ) : null}
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
          {['coins', 'gems'].map((currency) => (
            <button
              key={currency}
              className="asset-chip asset-chip-action"
              type="button"
              aria-haspopup="dialog"
              onClick={() => openWallet(currency)}
              aria-label={t(
                currency === 'coins'
                  ? '金币余额：{value}'
                  : '宝石余额：{value}',
                {
                  value:
                    balances[currency === 'coins' ? 'coinsLabel' : 'gemsLabel'],
                },
              )}
            >
              <span
                className={
                  'asset-symbol ' + (currency === 'coins' ? 'coin' : 'gem')
                }
              >
                <Icon name={currency === 'coins' ? 'coin' : 'gem'} />
              </span>
              <span>
                <small>{t(currency === 'coins' ? '金币' : '宝石')}</small>
                <strong>{formatWalletLabel(balances[currency])}</strong>
              </span>
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const { t, locale } = useLocale()
  const { mode, game, closeGame, account } = useH5()
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
  }, [])
  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const openWallet = (currency) =>
    setModal({
      title: t(currency === 'coins' ? '金币' : '宝石'),
      body: <WalletDetails currency={currency} />,
      confirmLabel: t('关闭'),
      cancelLabel: null,
    })

  const renderPage = () => {
    const props = { openModal: setModal, toast, openWallet }
    if (page === 'games') return <GamesPage {...props} />
    if (page === 'tournaments') return <TournamentsPage {...props} />
    if (page === 'events') return <EventsPage {...props} />
    if (page === 'store') return <StorePage {...props} />
    if (page === 'profile') return <ProfilePage key={account.id} {...props} />
    return <LobbyPage {...props} />
  }

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
            <AppHeader page={page} openWallet={openWallet} />
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
