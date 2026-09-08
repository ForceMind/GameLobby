export function isValidNickname(value) {
  if (typeof value !== 'string') return false
  const length = Array.from(value.trim()).length
  return length >= 2 && length <= 20
}

// A whitelist is a whitelist: no scope at all means open everywhere, and a
// country that was never selected is closed rather than open by default. When
// the host has not told the lobby which country the player is in, a scoped item
// fails CLOSED rather than open — an unknown location must not be treated as
// automatic access, or the whitelist offers no real guarantee. Items with no
// scope at all are unaffected either way, since they were never restricted.
export function regionAllows(scope, country) {
  if (!scope || typeof scope !== 'object' || scope.mode !== 'custom') return true
  if (!country) return false
  return Array.isArray(scope.countries) && scope.countries.includes(country)
}

// Games outside the player's country are removed from the catalogue entirely
// rather than shown as locked — a title a player cannot legally be offered should
// not be advertised to them.
export function openInCountry(game, country) {
  return regionAllows(game.region, country)
}

const GENDERS = ['male', 'female']

function positiveThreshold(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : null
}

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null
}

function validPlayLevel(value) {
  return Number.isInteger(value) && value >= 1 && value <= 999 ? value : null
}

function validBalance(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null
}

function validGender(value) {
  return GENDERS.includes(value) ? value : null
}

function validFamilyId(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function gatedGenders(value) {
  if (!Array.isArray(value)) return []
  const selected = new Set(value.filter((gender) => GENDERS.includes(gender)))
  return selected.size === GENDERS.length ? [] : [...selected]
}

/**
 * Checks player-facing entry requirements. Configuration that is unset or zero
 * imposes no restriction; absent player data remains closed for active rules.
 */
export function gameGate(game = {}, player = {}) {
  const gameRecord = game && typeof game === 'object' ? game : {}
  const account = player && player.account !== null && typeof player.account === 'object'
    ? player.account
    : {}
  const wallet = player && player.wallet !== null && typeof player.wallet === 'object'
    ? player.wallet
    : {}
  const reasons = []
  const numericRules = [
    ['wealthLevel', positiveThreshold(gameRecord.wealthLevel), nonNegativeInteger(account.wealthLevel)],
    ['charmLevel', positiveThreshold(gameRecord.charmLevel), nonNegativeInteger(account.charmLevel)],
    ['minBalance', positiveThreshold(gameRecord.minBalance), validBalance(wallet.coins)],
    ['playLevel', positiveThreshold(gameRecord.playLevel), validPlayLevel(account.level)],
  ]

  for (const [key, need, have] of numericRules) {
    if (need !== null && (have === null || have < need)) {
      reasons.push({ key, need, have })
    }
  }

  const genders = gatedGenders(gameRecord.genders)
  if (genders.length > 0) {
    const have = validGender(account.gender)
    if (have === null || !genders.includes(have)) {
      reasons.push({ key: 'genders', need: gameRecord.genders, have })
    }
  }

  if (gameRecord.familyOnly === true) {
    const have = validFamilyId(account.familyId)
    if (have === null) reasons.push({ key: 'familyOnly', need: true, have })
  }

  return { ok: reasons.length === 0, reasons }
}

export function filterGames(
  catalog,
  category,
  onlyReady = false,
  onlyRealtime = false,
  country = null,
) {
  return catalog.filter((game) => {
    const categories = game.tags ?? game.category.split(' ')
    const matchesCategory =
      category === 'all' ||
      (category === 'popular' ? game.popular : categories.includes(category))
    return (
      matchesCategory &&
      openInCountry(game, country) &&
      (!onlyReady || game.status === 'ready') &&
      (!onlyRealtime || categories.includes('realtime'))
    )
  })
}

export function packSummary(pack) {
  const baseCents = Math.round(pack.coins / 100)
  const priceCents = Math.round(
    (baseCents * (100 - Number(pack.discountPercent || 0))) / 100,
  )
  return {
    baseCoins: pack.coins,
    totalCoins: pack.coins,
    gems: pack.gemBonus,
    baseCents,
    priceCents,
    discountPercent: Number(pack.discountPercent || 0),
  }
}

export function validateDemoCode(value) {
  const normalized = value.trim().toUpperCase()
  if (!normalized) return { type: 'error', message: '请输入兑换码。' }
  if (normalized === 'JOY-DEMO')
    return {
      type: 'success',
      message: '兑换码有效。',
    }
  if (normalized === 'USED-DEMO')
    return { type: 'error', message: '此兑换码已被使用。' }
  if (normalized === 'OLD-DEMO')
    return { type: 'error', message: '此兑换码已过期。' }
  return { type: 'error', message: '未找到该兑换码，请核对字符。' }
}

export function nextWheelAngle(currentAngle, prizeIndex, segments = 8) {
  const target = (360 - prizeIndex * (360 / segments)) % 360
  return currentAngle + 1440 + ((target - (currentAngle % 360) + 360) % 360)
}
