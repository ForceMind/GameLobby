import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import './App.css'
import { navItems, games } from './data.js'
import { openInCountry } from './demoModel.js'
import { Icon } from './icons.jsx'
import { Modal } from './ui.jsx'
import { useLocale } from './useLocale.js'
import LanguagePicker from './components/LanguagePicker.jsx'
import { useH5 } from './h5/useH5.js'
import EntryGate from './h5/EntryGate.jsx'
import WalletDetails from './h5/WalletDetails.jsx'
import GameSession from './h5/GameSession.jsx'
import EventsPage from './pages/EventsPage.jsx'
import GamesPage from './pages/GamesPage.jsx'
import LobbyPage from './pages/LobbyPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import StorePage from './pages/StorePage.jsx'
import './h5/h5.css'
import { formatWalletLabel } from './format.js'
import { useNavigation } from './useNavigation.js'
import { headerBack } from './navigation.js'
import { appVersion } from './version.js'
import DocsPage from './pages/DocsPage.jsx'
import WinnerFeed from './components/WinnerFeed.jsx'
import useGameDetails from './useGameDetails.jsx'
import { EngagementContext, useEngagement } from './engagement/useEngagement.js'
import { createExitAction } from './h5/exitAction.js'

const loadingPrivacySettings = {
  receiveWinNotifications: false,
  allowSendWins: true,
  shareRecentGames: true,
}

function MainNav({ page, mobile = false }) {
  const { t, href } = useLocale()
  const navPage = page
  return (
    <nav
      className={mobile ? 'bottom-nav' : 'desktop-nav'}
      aria-label={t('nav.main')}
    >
      {navItems.map((item) => (
        <a
          key={item.id}
          className={navPage === item.id ? 'is-active' : ''}
          href={href(item.href)}
          aria-label={
            item.badge
              ? t('nav.itemNew', { label: t(item.label) })
              : t(item.label)
          }
          aria-current={
            navPage === item.id
              ? 'page'
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

function AppHeader({ page, openWallet, onExit }) {
  const { t, href } = useLocale()
  const { mode, canCloseLobby, wallet: balances } = useH5()
  const back = headerBack(page, canCloseLobby)
  return (
    <header className="app-header">
      <div className="header-inner">
        {page !== 'lobby' ? (
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
            onClick={onExit}
            aria-label={t('nav.exitLobby')}
          >
            <Icon name="chevronLeft" />
            <span>{t('nav.exitLobby')}</span>
          </button>
        )}
        <a
          className="brand"
          href={href('lobby.html')}
          aria-label={t('nav.brandHome')}
        >
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span className="brand-copy">
            <strong>Joyloop</strong>
            <small>{t('nav.tagline')}</small>
            <small className="brand-version">v{appVersion}</small>
          </span>
        </a>
        <MainNav page={page} />
        <div className="asset-cluster" aria-label={t('nav.balances')}>
          {['coins', 'gems'].map((currency) => (
            <button
              key={currency}
              className="asset-chip asset-chip-action"
              type="button"
              aria-haspopup="dialog"
              onClick={() => openWallet(currency)}
              aria-label={t(
                currency === 'coins'
                  ? 'ledger.coinsBalanceLabel'
                  : 'ledger.gemsBalanceLabel',
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
                <small>{t(currency === 'coins' ? 'ledger.coins' : 'ledger.gems')}</small>
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

function PrototypeLanguageSwitcher({ source, mode }) {
  const { t } = useLocale()
  return (
    <aside className={`prototype-language-float is-${mode}`} aria-label={t('settings.language')}>
      <span>{t('settings.language')}</span>
      {source === 'preview' && <small>{t('preview.source')}</small>}
      <LanguagePicker compact={mode === 'half'} />
    </aside>
  )
}

const PHONE_RATIO_STORAGE_KEY = 'joyloop-phone-ratio'
const phoneRatioOptions = ['auto', '18:9', '21:9']

function readStoredPhoneRatio() {
  try {
    const stored = window.localStorage.getItem(PHONE_RATIO_STORAGE_KEY)
    return phoneRatioOptions.includes(stored) ? stored : 'auto'
  } catch {
    return 'auto'
  }
}

// Desktop-preview-only control: switches the simulated phone in h5.css
// between a content-fitted height ("auto", driven by --phone-auto-height
// below) and the two real-phone ratios players actually see. Hidden by CSS
// on a real phone and in half mode — there's no frame ratio to switch there.
function PhoneFrameSwitcher({ mode }) {
  const { t } = useLocale()
  const [ratio, setRatio] = useState(readStoredPhoneRatio)
  useEffect(() => {
    document.documentElement.dataset.phoneRatio = ratio
    try {
      window.localStorage.setItem(PHONE_RATIO_STORAGE_KEY, ratio)
    } catch {
      // Private browsing or a full storage quota — the choice just won't
      // survive a reload, which is fine for a review-only control.
    }
  }, [ratio])
  if (mode !== 'full') return null
  return (
    <aside className="phone-ratio-float" aria-label={t('preview.phoneFrame')}>
      <span>{t('preview.phoneFrame')}</span>
      <nav>
        {phoneRatioOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={option === ratio ? 'is-active' : ''}
            aria-pressed={option === ratio}
            onClick={() => setRatio(option)}
          >
            {option === 'auto' ? t('preview.phoneFrameAuto') : option}
          </button>
        ))}
      </nav>
    </aside>
  )
}

// Measures how tall this page's content actually wants to be — header +
// content + bottom nav — and writes it to --phone-auto-height (read by the
// "auto" ratio rule in h5.css) so the desktop phone frame fits the page
// instead of leaving empty space below it or clipping it. Re-measures
// whenever the content's natural size changes (tab switches, expanding
// content, a page navigation) or the window is resized.
function usePhoneFrameAutoHeight(contentRef) {
  useEffect(() => {
    const content = contentRef.current
    if (!content) return undefined
    const surface = content.closest('.app-surface')
    const update = () => {
      const chrome =
        (surface?.querySelector('.app-header')?.offsetHeight ?? 0) +
        (surface?.querySelector('.bottom-nav')?.offsetHeight ?? 0)
      const available = window.innerHeight - 64
      const desired = Math.min(content.scrollHeight + chrome, available)
      document.documentElement.style.setProperty('--phone-auto-height', `${Math.max(480, Math.round(desired))}px`)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(content)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  })
}

export default function App() {
  const { t, locale, href } = useLocale()
  const { mode, game, closeGame, closeLobby, account, country } = useH5()
  const { page, url: routeUrl, action: navigationAction } = useNavigation()
  const mainRef = useRef(null)
  usePhoneFrameAutoHeight(mainRef)
  const scrollPositions = useRef(new Map())
  const [modal, setModal] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const engagement = useEngagement(account.id)
  const privacySettings = engagement.preferences ?? loadingPrivacySettings
  const [exitAction] = useState(() => createExitAction({
    hasHost: () => typeof window.JoyloopHost?.request === 'function',
    closeHost: () => closeLobby(),
    navigate: () => {
      const current = new URL(window.location.href)
      const destination = new URL('index.html', current)
      for (const key of ['lang', 'mode']) if (current.searchParams.has(key)) destination.searchParams.set(key, current.searchParams.get(key))
      window.location.assign(destination.href)
    },
  }))
  const showGameDetails = useGameDetails(setModal)
  const playWin = (id) => {
    const selected = games.find(item => item.id === id)
    // A win event about a game outside the player's region must not become a way
    // to reach that game's launch button — same rule as the catalogue filter.
    if (selected && openInCountry(selected, country)) showGameDetails(selected)
    else toast(t('wins.status'))
  }
  const toastLocale = useRef(locale)
  const closeModal = useCallback(() => setModal(null), [])
  const toast = useCallback(
    (message) =>
      setToastMessage({ text: message, locale: toastLocale.current }),
    [],
  )

  // Restore the openExit -> existing Modal -> confirmed action flow from 50c8b32.
  // H5 integration in 70c5e0a bypassed it; only the final action now targets the host/entry.
  const openExit = () => setModal({
    title: t('exit.title'), body: <p>{t('exit.body')}</p>,
    confirmLabel: t('exit.confirm'), cancelLabel: t('exit.stay'),
    onConfirm: async () => {
      toast(t('exit.pending'))
      const result = await exitAction()
      if (!['completed', 'pending', 'cancelled'].includes(result?.status)) toast(t('exit.failed'))
    },
  })

  const requestClose = useEffectEvent(() => {
    if (game) closeGame()
    else if (modal) closeModal()
    else openExit()
  })
  useEffect(() => {
    window.addEventListener('joyloop:request-close', requestClose)
    return () => window.removeEventListener('joyloop:request-close', requestClose)
  }, [])

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
      title: t(currency === 'coins' ? 'ledger.coins' : 'ledger.gems'),
      body: <WalletDetails currency={currency} />,
      actions: (
        <>
          <a className="btn btn-secondary" href={href('events.html')}>
            {t('ledger.getMore')}
          </a>
          <a className="btn btn-primary" href={href('store.html')}>
            {t('ledger.topUp')}
          </a>
        </>
      ),
    })

  const showFullEntryHint = () => toast(t('common.fullEntryHint'))

  const renderPage = () => {
    const props = {
      openModal: setModal,
      toast,
      openWallet,
      showFullEntryHint,
      privacySettings,
      engagement,
      onPlayWin: playWin,
    }
    const catalogKey = new URL(routeUrl).searchParams.get('category') ?? ''
    if (page === 'games') return <GamesPage key={catalogKey} {...props} />
    if (page === 'events') return <EventsPage {...props} />
    if (page === 'store') return <StorePage {...props} />
    if (page === 'profile') return <ProfilePage key={account.id} {...props} />
    return <LobbyPage key={catalogKey} {...props} />
  }

  if (page === 'welcome') return <EntryGate />
  if (page === 'docs') return <DocsPage />

  return (
    <EngagementContext.Provider value={engagement}><div className="h5-stage">
      <div className={`h5-lobby is-${mode}`} data-display-mode={mode}>
        <div className="app-root">
          <div className="app-surface" inert={modal || game ? true : undefined}>
            <a className="skip-link" href="#main">
              {t('common.skipToContent')}
            </a>
            <div className="background-orbs" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <AppHeader page={page} openWallet={openWallet} onExit={openExit} />
            <main className="page-shell" id="main" ref={mainRef} tabIndex={-1}>
              {renderPage()}
            </main>
            <MainNav page={page} mobile />
          </div>
          <WinnerFeed privacy={privacySettings} onPlay={playWin} events={engagement.winners?.events} paused={Boolean(modal || game)} />
          {toastMessage && toastMessage.locale === locale && (
            <div className="toast" role="status">
              <Icon name="star" />
              {toastMessage.text}
            </div>
          )}
          <Modal modal={modal} onClose={closeModal} />
        </div>
      </div>
      {!game && !modal && <PrototypeLanguageSwitcher source={engagement.source} mode={mode} />}
      {!game && !modal && <PhoneFrameSwitcher mode={mode} />}
      {game && <GameSession key={game.id} game={game} onClose={closeGame} onRoundComplete={engagement.completeRound} />}
    </div></EngagementContext.Provider>
  )
}
