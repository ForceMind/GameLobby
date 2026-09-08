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

function validNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null
}

function validGender(value) {
  return value === 'male' || value === 'female' ? value : null
}

function pickString(source, fallback, key) {
  return validString(source?.[key]) ?? validString(fallback?.[key])
}

function pickBalance(source, fallback, key) {
  return validBalance(source?.[key]) ?? validBalance(fallback?.[key]) ?? 0
}

function pickGateBalance(source, fallback, key) {
  if (hasOwn(source, key)) return validBalance(source[key]) ?? 0
  return validBalance(fallback[key]) ?? 0
}

function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key)
}

// Gate-critical fields are cleared by explicitly invalid input instead of
// reviving a previous value. Omitting a field still supports same-account events.
function pickStrictAccountValue(source, fallback, key, validate) {
  if (hasOwn(source, key)) return validate(source[key])
  return validate(fallback[key])
}

// The host tells us which language the player has chosen in the native app. It is
// validated against the supported set here rather than trusted verbatim, so a host
// cannot push the lobby into a locale that has no catalogue.
function validLocale(value) {
  return normalizeLocale(validString(value))
}

/**
 * Normalize a partial host context, retaining only the public H5 contract.
 * Non-gate display values can use fallback data. Gate-critical values use an
 * explicit-invalid-is-cleared rule so stale eligibility cannot be retained.
 */
export function normalizeHostContext(input = {}, fallback = {}) {
  const source = isRecord(input) ? input : {}
  const previous = isRecord(fallback) ? fallback : {}
  const sourceAccount = isRecord(source.account) ? source.account : {}
  const untrustedPreviousAccount = isRecord(previous.account) ? previous.account : {}
  const sourceId = validString(sourceAccount.id)
  const previousId = validString(untrustedPreviousAccount.id)
  const accountChanged = sourceId !== null && sourceId !== previousId
  const previousAccount = accountChanged ? {} : untrustedPreviousAccount
  const sourceWallet = isRecord(source.wallet) ? source.wallet : {}
  const previousWallet = accountChanged || !isRecord(previous.wallet) ? {} : previous.wallet

  const account = {}
  for (const key of ACCOUNT_FIELDS) {
    const value = pickString(sourceAccount, previousAccount, key)
    if (value !== null) account[key] = value
  }
  const level = pickStrictAccountValue(
    sourceAccount,
    previousAccount,
    'level',
    validLevel,
  )
  if (level !== null) account.level = level

  const gender = pickStrictAccountValue(
    sourceAccount,
    previousAccount,
    'gender',
    validGender,
  )
  if (gender !== null) account.gender = gender
  for (const key of ['wealthLevel', 'charmLevel']) {
    const value = pickStrictAccountValue(
      sourceAccount,
      previousAccount,
      key,
      validNonNegativeInteger,
    )
    if (value !== null) account[key] = value
  }
  const familyId = pickStrictAccountValue(
    sourceAccount,
    previousAccount,
    'familyId',
    validString,
  )
  if (familyId !== null) account.familyId = familyId

  const coins = pickGateBalance(sourceWallet, previousWallet, 'coins')
  const gems = pickBalance(sourceWallet, previousWallet, 'gems')
  const locale = validLocale(source.locale) ?? validLocale(previous.locale)
  // ISO 3166-1 alpha-2, decided by the host from its own signals; the lobby never
  // guesses a player's country from the browser.
  const rawCountry = validString(source.country) ?? validString(previous.country)
  const country = rawCountry && /^[A-Za-z]{2}$/.test(rawCountry) ? rawCountry.toUpperCase() : null

  return {
    account,
    ...(locale ? { locale } : {}),
    ...(country ? { country } : {}),
    wallet: {
      coins,
      gems,
      coinsLabel: coins.toLocaleString('en-US'),
      gemsLabel: gems.toLocaleString('en-US'),
    },
  }
}
