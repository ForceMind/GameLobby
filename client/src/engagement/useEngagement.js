import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { createEngagementService } from './service.js'

export const EngagementContext = createContext(null)

export function useEngagement(accountId) {
  const [service] = useState(createEngagementService)
  const [chest, setChest] = useState(null)
  const [winners, setWinners] = useState(null)
  const [chestLeaderboard, setChestLeaderboard] = useState(null)
  const [ledger, setLedger] = useState(null)
  const [preferences, setPreferences] = useState(null)
  const [settingsBusy, setSettingsBusy] = useState(false)
  const preferencesLock = useRef(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState('')
  const lock = useRef(false)
  const currentAccount = useRef(accountId)
  const requestSequence = useRef({ chest: 0, winners: 0, chestLeaderboard: 0, ledger: 0, preferences: 0 })
  useEffect(() => { currentAccount.current = accountId }, [accountId])
  const refresh = useCallback(async (kind) => {
    const sequence = ++requestSequence.current[kind]
    try {
      const data = await service[kind](accountId)
      if (currentAccount.current !== accountId || sequence !== requestSequence.current[kind]) return
      if (kind === 'chest') {
        setChest({ ...data, receivedAt: Date.now() })
        if (Number.isSafeInteger(data.walletCoins)) window.dispatchEvent(new CustomEvent('joyloop:context', { detail: { wallet: { coins: data.walletCoins } } }))
      }
      else if (kind === 'chestLeaderboard') setChestLeaderboard(data)
      else if (kind === 'ledger') setLedger(data)
      else if (kind === 'preferences') setPreferences(data.preferences)
      else setWinners(data)
      setErrors(value => ({ ...value, [kind]: '' }))
    } catch { if (currentAccount.current === accountId) setErrors(value => ({ ...value, [kind]: 'common.error' })) }
  }, [accountId, service])
  useEffect(() => {
    const timer = setTimeout(() => { setChest(null); setWinners(null); setChestLeaderboard(null); setLedger(null); setPreferences(null); refresh('chest'); refresh('winners'); refresh('chestLeaderboard'); refresh('ledger'); refresh('preferences') }, 0)
    const poll = setInterval(() => { if (!document.hidden) { refresh('chest'); refresh('winners'); refresh('chestLeaderboard'); refresh('ledger') } }, 30000)
    const visible = () => { if (!document.hidden) { refresh('chest'); refresh('winners'); refresh('chestLeaderboard'); refresh('ledger') } }
    document.addEventListener('visibilitychange', visible)
    return () => { clearTimeout(timer); clearInterval(poll); document.removeEventListener('visibilitychange', visible) }
  }, [refresh])
  const transact = async (operation, value) => {
    if (lock.current) return
    lock.current = true
    setBusy(operation)
    try {
      const data = await service[operation](accountId, value)
      if (!data || !Array.isArray(data.chests) || !Number.isSafeInteger(data.walletCoins)) throw new Error('confirming')
      if (currentAccount.current !== accountId) return
      setChest({ ...data, receivedAt: Date.now() })
      requestSequence.current.chest += 1
      window.dispatchEvent(new CustomEvent('joyloop:context', { detail: { wallet: { coins: data.walletCoins } } }))
      setErrors(current => ({ ...current, action: '' }))
      if (operation === 'open') await refresh('chestLeaderboard')
      await refresh('ledger')
    } catch (error) {
      const key = ['balance', 'stale', 'confirming'].includes(error.message) ? `chest.${error.message}` : 'common.error'
      setErrors(current => ({ ...current, action: key }))
      await refresh('chest')
    } finally { lock.current = false; setBusy('') }
  }
  const completeRound = async () => {
    try { await service.completeRound(accountId); await refresh('chest') }
    catch { setErrors(value => ({ ...value, chest: 'common.error' })) }
  }
  const updatePreference = async key => {
    if (!preferences || !Object.hasOwn(preferences, key) || preferencesLock.current) return false
    preferencesLock.current = true
    setSettingsBusy(true)
    const previous = preferences
    const next = { ...previous, [key]: !previous[key] }
    setPreferences(next)
    try {
      const data = await service.savePreferences(accountId, next)
      if (currentAccount.current !== accountId) return false
      setPreferences(data.preferences)
      setErrors(value => ({ ...value, settings: '' }))
      return true
    } catch {
      if (currentAccount.current === accountId) {
        setPreferences(previous)
        setErrors(value => ({ ...value, settings: 'settings.failed' }))
      }
      return false
    } finally { preferencesLock.current = false; setSettingsBusy(false) }
  }
  return { source: service.source, chest, winners, chestLeaderboard, ledger, preferences, settingsBusy, updatePreference, errors, busy, refresh, transact, completeRound }
}
