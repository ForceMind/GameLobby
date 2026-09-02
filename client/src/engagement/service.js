import preview from '../data/engagementPreview.json' with { type: 'json' }
import { businessDay, nextOpening, chestSnapshot, buyChest, openChest, rankings, chestOpeningRankings } from './model.js'
import { normalizeLedger } from './ledger.js'
import { defaultPreferences, normalizePreferences, readPreferences, writePreferences } from './preferences.js'

export function createPreviewService({ storage, now = Date.now, scenario = 'default' }) {
  let feedAnchor = now()
  const keyFor = (id) => `joyloop.preview.engagement.v1:${scenario}:${id}`
  const read = (id) => {
    const saved = storage.getItem(keyFor(id))
    if (saved) return JSON.parse(saved)
    const time = now()
    const yesterday = time - 86400000
    const unlocked = nextOpening(yesterday)
    return {
      walletCoins: scenario === 'low-balance' ? 100 : preview.initialCoins,
      completedDays: scenario === 'eligible' ? [businessDay(time)] : [],
      chests: ['ready', 'zero', 'expired'].includes(scenario) ? [{
        id: `chest-${businessDay(yesterday)}`, purchaseDay: businessDay(yesterday),
        unlockAt: unlocked, expiresAt: scenario === 'expired' ? time - 1 : unlocked + 86400000,
        status: 'waiting', rewardCoins: null, maxRewardCoins: preview.offer.maxRewardCoins, priceCoins: preview.offer.priceCoins, offerVersion: preview.offer.version,
      }] : [], ledger: ['empty', 'low-balance'].includes(scenario) ? [] : preview.walletLedger.map(row => ({ ...row, createdAt: time - row.minutesAgo * 60000 })),
    }
  }
  const save = (id, state) => storage.setItem(keyFor(id), JSON.stringify(state))
  const mutate = async (id, fn) => {
    const run = () => { const state = fn(read(id)); save(id, state); return chestSnapshot(state, now(), preview.offer) }
    // Browser cross-tab serialization for the preview adapter only; production requires DB transactions.
    if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(keyFor(id), run)
    return run()
  }
  return {
    source: 'preview',
    async preferences(id) { return { serverTime: now(), preferences: readPreferences(storage, id) } },
    async savePreferences(id, value) { return { serverTime: now(), preferences: writePreferences(storage, id, value) } },
    async ledger(id) { return { source: 'preview', serverTime: now(), timeZone: preview.timeZone, entries: normalizeLedger(read(id).ledger) } },
    async chest(id) { return chestSnapshot(read(id), now(), preview.offer) },
    async completeRound(id) {
      return mutate(id, state => ({ ...state, completedDays: [...new Set([...state.completedDays, businessDay(now())])] }))
    },
    async buy(id, request) { return mutate(id, state => buyChest(state, now(), preview.offer, request)) },
    async open(id, chestId) { return mutate(id, state => openChest(state, now(), chestId, scenario === 'zero' ? 0 : preview.rewardCoins)) },
    async chestLeaderboard(id) {
      const time = now()
      if (businessDay(time) !== businessDay(feedAnchor)) feedAnchor = time
      const dayStart = nextOpening(time) - 86400000
      const publicOpenings = scenario === 'empty' ? [] : preview.chestOpenings.map((item, index) => ({
        ...item, id: `${businessDay(time)}-${item.id}`, isSelf: false,
        openedAt: Math.max(dayStart, feedAnchor - (index + 1) * 60000),
      }))
      const ownOpenings = read(id).chests.filter(item => item.status === 'opened').map(item => ({
        id: `${id}:${item.id}`, playerId: id, name: id, isSelf: true,
        rewardCoins: item.rewardCoins, openedAt: item.openedAt,
      }))
      return { source: 'preview', serverTime: time, timeZone: preview.timeZone,
        entries: chestOpeningRankings([...publicOpenings, ...ownOpenings], time) }
    },
    async winners(id) {
      const time = now()
      if (businessDay(time) !== businessDay(feedAnchor)) feedAnchor = time
      const dayStart = nextOpening(time) - 86400000
      const events = scenario === 'empty' ? [] : preview.wins.map((win, i) => ({
        ...win, id: `${businessDay(time)}-${win.id}`, occurredAt: Math.max(dayStart, feedAnchor - (i + 1) * 60000),
      }))
      const ordered = rankings(events)
      return { source: 'preview', serverTime: time, timeZone: preview.timeZone,
        events, rankings: ordered.slice(0, 10), myRank: ordered.find(row => row.playerId === id) ?? null }
    },
  }
}

async function request(path, body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(`/api/v1/${path}`, {
      method: body ? 'POST' : 'GET', credentials: 'same-origin', signal: controller.signal,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (!response.ok) throw new Error(response.status === 409 ? 'stale' : 'service')
    const envelope = await response.json()
    const data = envelope.data
    if (!data || !Number.isFinite(data.serverTime)) throw new Error('invalid-response')
    return data
  } catch (error) {
    if (body && !['stale', 'balance', 'ineligible'].includes(error.message)) throw new Error('confirming')
    throw error
  } finally { clearTimeout(timer) }
}

export function createEngagementService() {
  const useServer = import.meta.env?.VITE_ENGAGEMENT_SOURCE === 'server' || typeof window.JoyloopHost?.request === 'function'
  if (useServer) return {
    source: 'server',
    async preferences() {
      const data = await request('preferences')
      if (!data.preferences || Object.keys(defaultPreferences).some(key => typeof data.preferences[key] !== 'boolean')) throw new Error('invalid-response')
      return { ...data, preferences: normalizePreferences(data.preferences) }
    },
    async savePreferences(_id, value) {
      const data = await request('preferences', { preferences: normalizePreferences(value) })
      if (!data.preferences || Object.keys(defaultPreferences).some(key => typeof data.preferences[key] !== 'boolean')) throw new Error('invalid-response')
      return { ...data, preferences: normalizePreferences(data.preferences) }
    },
    async ledger() {
      const data = await request('wallet/ledger')
      if (!Array.isArray(data.entries) || data.entries.some(row => typeof row.id !== 'string' || !Number.isSafeInteger(row.amount) || !['coins','gems'].includes(row.currency) || !Number.isFinite(row.createdAt))) throw new Error('invalid-response')
      return { ...data, entries: normalizeLedger(data.entries) }
    },
    async chest() {
      const data = await request('chest/status')
      if (!Array.isArray(data.chests) || !data.offer?.version || typeof data.eligible !== 'boolean') throw new Error('invalid-response')
      return data
    },
    async winners() {
      const data = await request('winners/today')
      if (!Array.isArray(data.events) || !Array.isArray(data.rankings)) throw new Error('invalid-response')
      return data
    },
    async chestLeaderboard() {
      const data = await request('chest/leaderboard')
      if (!Array.isArray(data.entries) || data.entries.length > 5 || data.entries.some((item, index) =>
        typeof item.id !== 'string' || typeof item.name !== 'string' || item.rank !== index + 1 ||
        !Number.isSafeInteger(item.rewardCoins) || item.rewardCoins <= 0)) throw new Error('invalid-response')
      return data
    },
    buy: (_id, quote) => request('chest/purchases', { ...quote, idempotencyKey: `chest-purchase-${quote.day}` }),
    open: (_id, chestId) => request('chest/open', { chestId, idempotencyKey: `chest-open-${chestId}` }),
    completeRound: () => Promise.resolve(null), // Only signed server game events establish production eligibility.
  }
  return createPreviewService({ storage: { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) },
    scenario: new URLSearchParams(window.location.search).get('reviewScenario') ?? 'default' })
}
