// Public view-model only. No loss amounts or internal reward calculation inputs.
export function businessDay(now) {
  return new Date(now + 8 * 3600000).toISOString().slice(0, 10)
}

export function nextOpening(now) {
  return Date.parse(`${businessDay(now)}T00:00:00+08:00`) + 86400000
}

export function chestState(chest, now) {
  if (chest.status === 'opened') return 'opened'
  if (now >= chest.expiresAt) return 'expired'
  return now >= chest.unlockAt ? 'ready' : 'waiting'
}

export function rankings(events) {
  const byPlayer = new Map()
  const seen = new Set()
  for (const event of events) {
    if (seen.has(event.id) || !Number.isSafeInteger(event.coins) || event.coins < 0) continue
    seen.add(event.id)
    const previous = byPlayer.get(event.playerId)
    byPlayer.set(event.playerId, previous
      ? { ...previous, coins: previous.coins + event.coins }
      : { ...event })
  }
  return [...byPlayer.values()].sort((a, b) => b.coins - a.coins || a.playerId.localeCompare(b.playerId))
    .map((record, index) => ({ ...record, rank: index + 1 }))
}

export function chestSnapshot(state, now, offer) {
  const day = businessDay(now)
  const unlockAt = nextOpening(now)
  return {
    source: 'preview', serverTime: now, timeZone: 'Asia/Shanghai',
    offer: { ...offer, day, unlockAt, expiresAt: unlockAt + 86400000 },
    eligible: state.completedDays.includes(day), walletCoins: state.walletCoins,
    chests: state.chests.map(chest => ({ ...chest, state: chestState(chest, now) })),
  }
}

export function chestOpeningRankings(openings, now) {
  const seen = new Set()
  return openings.filter(item => {
    if (seen.has(item.id) || !Number.isSafeInteger(item.rewardCoins) || item.rewardCoins <= 0 ||
      !Number.isFinite(item.openedAt) || item.openedAt > now || businessDay(item.openedAt) !== businessDay(now)) return false
    seen.add(item.id)
    return true
  }).sort((a, b) => b.rewardCoins - a.rewardCoins || a.openedAt - b.openedAt || a.id.localeCompare(b.id))
    .slice(0, 5).map((item, index) => ({ ...item, rank: index + 1 }))
}

export function buyChest(state, now, offer, request) {
  const day = businessDay(now)
  const existing = state.chests.find(chest => chest.purchaseDay === request.day)
  if (existing) return state
  if (request.day !== day || request.offerVersion !== offer.version) throw new Error('stale')
  if (!state.completedDays.includes(day)) throw new Error('ineligible')
  if (state.walletCoins < offer.priceCoins) throw new Error('balance')
  const id = `chest-${day}`
  const unlockAt = nextOpening(now)
  return { ...state, walletCoins: state.walletCoins - offer.priceCoins,
    chests: [...state.chests, { id, purchaseDay: day, unlockAt, expiresAt: unlockAt + 86400000,
      status: 'waiting', rewardCoins: null, maxRewardCoins: offer.maxRewardCoins, priceCoins: offer.priceCoins, offerVersion: offer.version }],
    ledger: [...state.ledger, { id: `purchase-${id}`, chestId: id, coins: -offer.priceCoins, at: now, currency: 'coins', source: 'chest_purchase', status: 'completed', balanceBefore: state.walletCoins, balanceAfter: state.walletCoins - offer.priceCoins }],
  }
}

export function openChest(state, now, id, confirmedRewardCoins) {
  const chest = state.chests.find(item => item.id === id)
  if (!chest) throw new Error('missing')
  if (chest.status === 'opened') return state
  if (chestState(chest, now) !== 'ready') throw new Error('not-ready')
  if (!Number.isSafeInteger(confirmedRewardCoins) || confirmedRewardCoins < 0 || confirmedRewardCoins > chest.maxRewardCoins) throw new Error('invalid-reward')
  return { ...state, walletCoins: state.walletCoins + confirmedRewardCoins,
    chests: state.chests.map(item => item.id === id
      ? { ...item, status: 'opened', rewardCoins: confirmedRewardCoins, openedAt: now } : item),
    ledger: [...state.ledger, { id: `reward-${id}`, chestId: id, coins: confirmedRewardCoins, at: now, currency: 'coins', source: 'chest_reward', status: 'completed', balanceBefore: state.walletCoins, balanceAfter: state.walletCoins + confirmedRewardCoins }],
  }
}
