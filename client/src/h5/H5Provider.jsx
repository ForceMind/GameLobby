import { useCallback, useEffect, useRef, useState } from 'react'
import { H5Context } from './useH5.js'
import { readEntryState } from './model.js'
import { requestHost } from './hostBridge.js'
import { createDisplayModeDispatcher } from './displayMode.js'
import { normalizeHostContext } from './hostContext.js'
import { profile, balances, games } from '../data.js'
import { gameGate, openInCountry } from '../demoModel.js'

export default function H5Provider({ children }) {
  const [displayMode] = useState(() =>
    createDisplayModeDispatcher((payload) =>
      requestHost('setDisplayMode', payload),
    ),
  )
  useEffect(() => () => displayMode.cancelPending(), [displayMode])
  const [hostContext, setHostContext] = useState(() =>
    normalizeHostContext(window.JoyloopHost?.context, window.JoyloopHost ? {} : {
      account: profile,
      wallet: balances,
    }),
  )
  const latestContext = useRef(hostContext)
  useEffect(() => {
    const updateContext = (event) => {
      const next = normalizeHostContext(event.detail, latestContext.current)
      latestContext.current = next
      setHostContext(next)
    }
    window.addEventListener('joyloop:context', updateContext)
    return () => window.removeEventListener('joyloop:context', updateContext)
  }, [])
  const [entry] = useState(() => {
    return readEntryState(
      null,
      document.body.dataset.page === 'welcome'
        ? 'full'
        : new URLSearchParams(window.location.search).get('mode'),
    )
  })
  const [game, setGame] = useState(null)
  const activeGame = useRef(false)
  const launchTrigger = useRef(null)
  const returnMode = useRef(entry.mode)

  useEffect(() => {
    if (!activeGame.current) {
      displayMode.request({
        mode: entry.mode,
        aspectRatio: null,
        reason: 'lobby',
      })
    }
  }, [entry.mode, displayMode])

  const closeLobby = () => {
    displayMode.cancelPending()
    return requestHost('closeLobby')
  }

  const openGame = (selected) => {
    const configured = games.find((item) => item.id === selected?.id)
    const player = latestContext.current
    // UI callbacks may outlive their context or omit a check. Recheck the current
    // player against the catalogue record so stale dialogs and caller overrides
    // cannot bypass either region restrictions or entry requirements.
    if (!configured || activeGame.current || configured.status !== 'ready' ||
      !openInCountry(configured, player.country ?? null) || !gameGate(configured, player).ok) return false
    activeGame.current = true
    launchTrigger.current = document.activeElement
    returnMode.current = entry.mode
    displayMode.request({
      mode: 'full',
      reason: 'game',
      gameId: configured.id,
    })
    setGame(configured)
    return true
  }

  const closeGame = useCallback(() => {
    activeGame.current = false
    setGame(null)
    displayMode.request({
      mode: returnMode.current,
      aspectRatio: null,
      reason: 'return-to-lobby',
    })
    window.requestAnimationFrame(() =>
      launchTrigger.current?.focus?.({ preventScroll: true }),
    )
  }, [displayMode])

  return (
    <H5Context.Provider
      value={{
        mode: entry.mode,
        canCloseLobby: typeof window.JoyloopHost?.request === 'function',
        closeLobby,
        game,
        openGame,
        closeGame,
        account: hostContext.account,
        wallet: hostContext.wallet,
        // Unknown countries cannot access games with a region whitelist.
        country: hostContext.country ?? null,
      }}
    >
      {children}
    </H5Context.Provider>
  )
}
