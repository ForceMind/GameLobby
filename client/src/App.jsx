import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { balances, navItems } from './data.js'
import { Icon } from './icons.jsx'
import { Modal } from './ui.jsx'
import EventsPage from './pages/EventsPage.jsx'
import GamesPage from './pages/GamesPage.jsx'
import LobbyPage from './pages/LobbyPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import StorePage from './pages/StorePage.jsx'
import TournamentsPage from './pages/TournamentsPage.jsx'
import { useLocale } from './useLocale.js'

function AppHeader({ page, onExit }) {
  const { t, href } = useLocale()
  const navPage = page === 'games' ? 'lobby' : page
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
            onClick={onExit}
            aria-label={t('退出演示')}
          >
            <Icon name="chevronLeft" />
            <span>{t('退出演示')}</span>
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
        <nav className="desktop-nav" aria-label={t('主导航')}>
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
              {t(item.label)}
              {item.badge && <span className="nav-notice" aria-hidden="true" />}
            </a>
          ))}
        </nav>
        <div className="asset-cluster" aria-label={t('演示资产余额')}>
          <div
            className="asset-chip"
            aria-label={t('金币余额：{value}', { value: balances.coinsLabel })}
          >
            <span className="asset-symbol coin">
              <Icon name="coin" />
            </span>
            <span>
              <small>{t('金币')}</small>
              <strong>{balances.coinsLabel}</strong>
            </span>
          </div>
          <div
            className="asset-chip"
            aria-label={t('宝石余额：{value}', { value: balances.gemsLabel })}
          >
            <span className="asset-symbol gem">
              <Icon name="gem" />
            </span>
            <span>
              <small>{t('宝石')}</small>
              <strong>{balances.gemsLabel}</strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

function BottomNav({ page }) {
  const { t, href } = useLocale()
  const navPage = page === 'games' ? 'lobby' : page
  return (
    <nav className="bottom-nav" aria-label={t('主导航')}>
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
          {item.badge && <span className="nav-notice" aria-hidden="true" />}
          <Icon name={item.icon} />
          <span>{t(item.label)}</span>
        </a>
      ))}
    </nav>
  )
}

function DemoBar() {
  const { t, locale, setLocale } = useLocale()
  return (
    <div className="demo-bar" role="status">
      <Icon name="bolt" />
      <span>
        <strong>{t('静态演示模式')}</strong> ·{' '}
        {t('购买、报名与奖励仅作演示，不产生真实交易。')}
      </span>
      <label className="locale-select">
        <span className="sr-only">{t('界面语言')}</span>
        <Icon name="globe" />
        <select
          aria-label={t('界面语言')}
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
        >
          <option value="zh">{t('简中')}</option>
          <option value="en">EN</option>
        </select>
      </label>
    </div>
  )
}

function App() {
  const { t, locale } = useLocale()
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
  const [exited, setExited] = useState(false)
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
        // A malformed external hash must not prevent the page from rendering.
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

  const openExit = () =>
    setModal({
      title: t('退出 Joyloop 演示？'),
      subtitle: t('此操作只结束当前页面演示'),
      body: (
        <p>
          {t(
            '不会关闭浏览器、退出真实账号或更改服务器数据。你可以随时重新进入。',
          )}
        </p>
      ),
      confirmLabel: t('退出演示'),
      onConfirm: () => setExited(true),
    })

  const renderPage = () => {
    if (page === 'tournaments')
      return <TournamentsPage openModal={setModal} toast={toast} />
    if (page === 'events')
      return <EventsPage openModal={setModal} toast={toast} />
    if (page === 'games')
      return <GamesPage openModal={setModal} toast={toast} />
    if (page === 'store')
      return <StorePage openModal={setModal} toast={toast} />
    if (page === 'profile')
      return <ProfilePage openModal={setModal} toast={toast} />
    return <LobbyPage openModal={setModal} toast={toast} />
  }

  return (
    <div className="app-root">
      <div className="app-surface" inert={modal ? true : undefined}>
        <a className="skip-link" href="#main">
          {t('跳到主要内容')}
        </a>
        <div className="background-orbs" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {!exited && <AppHeader page={page} onExit={openExit} />}
        <DemoBar />
        <main className="page-shell" id="main">
          {exited ? (
            <section className="exit-state card">
              <Icon name="gamepad" />
              <h1>{t('演示已退出')}</h1>
              <p>{t('没有产生真实交易或账号变更。')}</p>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setExited(false)}
              >
                {t('重新进入演示')}
              </button>
            </section>
          ) : (
            renderPage()
          )}
        </main>
        {!exited && <BottomNav page={page} />}
      </div>
      {toastMessage && toastMessage.locale === locale && (
        <div className="toast" role="status">
          <Icon name="star" />
          {toastMessage.text}
        </div>
      )}
      <Modal modal={modal} onClose={closeModal} />
    </div>
  )
}

export default App
