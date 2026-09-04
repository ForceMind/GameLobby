import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  localeMeta,
  normalizeLocale,
  supportedLocales,
} from './locales/registry.js'
import messages from './locales/index.js'
import legacyEnglish, { legacyChinese } from './locales/legacy.js'

export { supportedLocales, DEFAULT_LOCALE, FALLBACK_LOCALE }
// Re-exported for the guards that still audit the pre-migration catalogues.
export { default as englishMessages, catalogs, legacyChinese } from './locales/legacy.js'
export { locales, localeMeta, isRtl, intlTag, normalizeLocale } from './locales/registry.js'

// Every lookup that falls through to the key itself lands here, so a missing
// translation is a reportable event rather than silently shipping a raw key.
// LocaleProvider installs a dev-mode console reporter; production can install a
// telemetry one. Nothing is reported twice for the same locale+key.
const missSeen = new Set()
let missHandler = null

export function setMissingTranslationHandler(handler) {
  missHandler = typeof handler === 'function' ? handler : null
}

export function resetMissingTranslations() {
  missSeen.clear()
}

function reportMiss(locale, key, resolvedFrom) {
  const id = `${locale} ${key}`
  if (missSeen.has(id)) return
  missSeen.add(id)
  if (missHandler) missHandler({ locale, key, resolvedFrom })
}

const interpolate = (template, values) =>
  template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  )

// Resolution order: the player's language, then English, then the legacy
// Chinese-source catalogue that still backs the screens not yet migrated, then
// the key itself. Only the first hop counts as a real translation.
export function translate(locale, key, values = {}) {
  if (typeof key !== 'string') return key
  const primary = messages[locale]
  if (primary && Object.hasOwn(primary, key)) return interpolate(primary[key], values)

  const fallback = messages[FALLBACK_LOCALE]
  if (fallback && Object.hasOwn(fallback, key)) {
    reportMiss(locale, key, FALLBACK_LOCALE)
    return interpolate(fallback[key], values)
  }

  // Legacy screens still call t() with Chinese source text as the key. Chinese
  // locales render that text as-is; English has a translation table for it.
  if (locale === 'en' && Object.hasOwn(legacyEnglish, key)) {
    reportMiss(locale, key, 'legacy')
    return interpolate(legacyEnglish[key], values)
  }
  if (locale.startsWith('zh') && Object.hasOwn(legacyChinese, key)) {
    reportMiss(locale, key, 'legacy')
    return interpolate(legacyChinese[key], values)
  }
  reportMiss(locale, key, 'key')
  return interpolate(key, values)
}

export function createTranslator(locale) {
  const active = normalizeLocale(locale) ?? DEFAULT_LOCALE
  return (key, values = {}) => translate(active, key, values)
}

// URL parameter wins, then the host app's language, then what the player chose
// last, then the browser's own preference, then the default.
export function resolveLocale(search = '', savedLocale = null, hostLocale = null, navigatorLanguages = []) {
  const requested = new URLSearchParams(search).get('lang')
  const candidates = [requested, hostLocale, savedLocale, ...navigatorLanguages]
  for (const candidate of candidates) {
    const match = normalizeLocale(candidate)
    if (match) return match
  }
  return DEFAULT_LOCALE
}

// Coverage of the player-facing catalogue, for the admin translation module and
// for the build guard. Counted against the English catalogue, which is complete.
export function translationCoverage() {
  const keys = Object.keys(messages[FALLBACK_LOCALE] ?? {})
  return supportedLocales.map((code) => {
    const catalogue = messages[code] ?? {}
    const missing = keys.filter((key) => !Object.hasOwn(catalogue, key) || catalogue[key] === '')
    return {
      locale: code,
      nativeName: localeMeta[code]?.nativeName ?? code,
      total: keys.length,
      translated: keys.length - missing.length,
      missing,
    }
  })
}

export function localizedHref(value, locale, displayMode) {
  if (!value || value.startsWith('#') || /^(?:[a-z]+:|\/\/)/i.test(value))
    return value
  const hashIndex = value.indexOf('#')
  const target = hashIndex < 0 ? value : value.slice(0, hashIndex)
  const hash = hashIndex < 0 ? '' : value.slice(hashIndex)
  const queryIndex = target.indexOf('?')
  const pathname = queryIndex < 0 ? target : target.slice(0, queryIndex)
  const query = new URLSearchParams(
    queryIndex < 0 ? '' : target.slice(queryIndex + 1),
  )
  query.set('lang', normalizeLocale(locale) ?? DEFAULT_LOCALE)
  // Business navigation keeps its layout; the independent entry omits this argument.
  if (['half', 'full'].includes(displayMode)) {
    query.set('mode', displayMode)
  }
  return `${pathname}?${query.toString()}${hash}`
}
