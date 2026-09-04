// Boundary for data supplied by the native Joyloop host.  Keep this module
// free of browser/React dependencies so it can be exercised independently.
import { normalizeLocale } from '../locales/registry.js'

const MAX_STRING_LENGTH = 240

const ACCOUNT_FIELDS = ['id', 'name', 'avatar']

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validString(value) {
  if (typeof value !== 'string') return null
  const result = value.trim()
  return result.length > 0 && result.length <= MAX_STRING_LENGTH ? result : null
}

function validBalance(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null
}

function validLevel(value) {
  return Number.isInteger(value) && value >= 1 && value <= 999 ? value : null
}

function pickString(source, fallback, key) {
  return validString(source?.[key]) ?? validString(fallback?.[key])
}

function pickBalance(source, fallback, key) {
  return validBalance(source?.[key]) ?? validBalance(fallback?.[key]) ?? 0
}

// The host tells us which language the player has chosen in the native app. It is
// validated against the supported set here rather than trusted verbatim, so a host
// cannot push the lobby into a locale that has no catalogue.
function validLocale(value) {
  return normalizeLocale(validString(value))
}

/**
 * Normalize a partial host context, retaining only the public H5 contract.
 * Values missing or invalid in input are taken from fallback.  Derived labels
 * are always generated here so a host cannot inject a misleading display.
 */
export function normalizeHostContext(input = {}, fallback = {}) {
  const source = isRecord(input) ? input : {}
  const previous = isRecord(fallback) ? fallback : {}
  const sourceAccount = isRecord(source.account) ? source.account : {}
  const previousAccount = isRecord(previous.account) ? previous.account : {}
  const sourceWallet = isRecord(source.wallet) ? source.wallet : {}
  const previousWallet = isRecord(previous.wallet) ? previous.wallet : {}

  const account = {}
  for (const key of ACCOUNT_FIELDS) {
    const value = pickString(sourceAccount, previousAccount, key)
    if (value !== null) account[key] = value
  }
  const level =
    validLevel(sourceAccount.level) ?? validLevel(previousAccount.level)
  if (level !== null) account.level = level

  const coins = pickBalance(sourceWallet, previousWallet, 'coins')
  const gems = pickBalance(sourceWallet, previousWallet, 'gems')
  const locale = validLocale(source.locale) ?? validLocale(previous.locale)

  return {
    account,
    ...(locale ? { locale } : {}),
    wallet: {
      coins,
      gems,
      coinsLabel: coins.toLocaleString('en-US'),
      gemsLabel: gems.toLocaleString('en-US'),
    },
  }
}
