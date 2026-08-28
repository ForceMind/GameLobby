import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './App.css'
import { navItems } from './data.js'
import { Icon } from './icons.jsx'
import { Modal } from './ui.jsx'
import { useLocale } from './useLocale.js'
import { useH5 } from './h5/useH5.js'
import EntryGate from './h5/EntryGate.jsx'
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
import { useNavigation } from './useNavigation.js'
import { headerBack } from './navigation.js'

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
  const { mode, closeLobby, canCloseLobby, wallet: balances } = useH5()
  const back = headerBack(page, canCloseLobby)
  return (
    <header className="app-header">
      <div className="header-inner">
        {back.href ? (
          <a
            className="exit-button"
            href={href(back.href)}
            aria-label={t(back.label)}
          >
            <Icon name="chevronLeft" />
            <span>{t(back.label)}</span>
          </a>
        ) : (
          <button
            className="exit-button"
            type="button"
            onClick={closeLobby}
            aria-label={t('退出大厅')}
          >
            <Icon name="chevronLeft" />
            <span>{t('退出大厅')}</span>
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
                <strong>
                  {formatWalletLabel(balances[currency], mode === 'half')}
                </strong>
              </span>
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const { t, locale, href } = useLocale()
  const { mode, game, closeGame, account } = useH5()
  const { page, url: routeUrl, action: navigationAction } = useNavigation()
  const mainRef = useRef(null)
  const scrollPositions = useRef(new Map())
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
    const clearOverlays = () => {
      scrollPositions.current.set(routeUrl, mainRef.current?.scrollTop ?? 0)
      setModal(null)
      setToastMessage(null)
    }
    window.addEventListener('joyloop:navigate', clearOverlays)
    return () => window.removeEventListener('joyloop:navigate', clearOverlays)
  }, [routeUrl])

  useLayoutEffect(() => {
    const main = mainRef.current
    if (!main) return
    main.scrollTo({
      top: navigationAction === 'pop' ? scrollPositions.current.get(routeUrl) ?? 0 : 0,
      behavior: 'instant',
    })
    if (navigationAction !== 'load') main.focus({ preventScroll: true })
  }, [routeUrl, navigationAction])

  useEffect(() => {
    toastLocale.current = locale
  }, [locale])
  useEffect(() => {
    const scrollToHash = () => {
      try {
        const id = decodeURIComponent(window.location.hash.slice(1))
        const target = id && document.getElementById(id)
        if (target) {
          target.scrollIntoView({ block: 'start', behavior: 'instant' })
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
  }, [routeUrl])
  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const openWallet = (currency) =>
    setModal({
      title: t(currency === 'coins' ? '金币' : '宝石'),
      body: <WalletDetails currency={currency} />,
      actions: (
        <>
          <a className="btn btn-secondary" href={href('events.html')}>
            {t('获得')}
          </a>
          <a className="btn btn-primary" href={href('store.html')}>
            {t('充值')}
          </a>
        </>
      ),
    })

  const showFullEntryHint = () => toast(t('请从全屏入口查看完整内容。'))

  const renderPage = () => {
    const props = { openModal: setModal, toast, openWallet, showFullEntryHint }
    const catalogKey = new URL(routeUrl).searchParams.get('category') ?? ''
    if (page === 'games') return <GamesPage key={catalogKey} {...props} />
    if (page === 'tournaments') return <TournamentsPage {...props} />
    if (page === 'events') return <EventsPage {...props} />
    if (page === 'store') return <StorePage {...props} />
    if (page === 'profile') return <ProfilePage key={account.id} {...props} />
    return <LobbyPage key={catalogKey} {...props} />
  }

  if (page === 'welcome') return <EntryGate />

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
            <main className="page-shell" id="main" ref={mainRef} tabIndex={-1}>
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
