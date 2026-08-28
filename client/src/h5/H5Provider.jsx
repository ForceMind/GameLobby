import { useCallback, useEffect, useRef, useState } from 'react'
import { H5Context } from './useH5.js'
import { readEntryState } from './model.js'
import { requestHost } from './hostBridge.js'
import { createDisplayModeDispatcher } from './displayMode.js'
import { normalizeHostContext } from './hostContext.js'
import { profile, balances } from '../data.js'

export default function H5Provider({ children }) {
  const [displayMode] = useState(() =>
    createDisplayModeDispatcher((payload) =>
      requestHost('setDisplayMode', payload),
    ),
  )
  useEffect(() => () => displayMode.cancelPending(), [displayMode])
  const [hostContext, setHostContext] = useState(() =>
    normalizeHostContext(window.JoyloopHost?.context, {
      account: profile,
      wallet: balances,
    }),
  )
  useEffect(() => {
    const updateContext = (event) =>
      setHostContext((previous) => normalizeHostContext(event.detail, previous))
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
        aspectRatio: entry.mode === 'half' ? 1 : null,
        reason: 'lobby',
      })
    }
  }, [entry.mode, displayMode])

  const closeLobby = () => {
    displayMode.cancelPending()
    requestHost('closeLobby')
  }

  const openGame = (selected) => {
    if (activeGame.current || selected.status !== 'ready') return
    activeGame.current = true
    launchTrigger.current = document.activeElement
    returnMode.current = entry.mode
    displayMode.request({
      mode: 'full',
      reason: 'game',
      gameId: selected.id,
    })
    setGame(selected)
  }

  const closeGame = useCallback(() => {
    activeGame.current = false
    setGame(null)
    displayMode.request({
      mode: returnMode.current,
      aspectRatio: returnMode.current === 'half' ? 1 : null,
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
      }}
    >
      {children}
    </H5Context.Provider>
  )
}
