// The single source of truth for which player-facing languages exist.
// Adding a language means adding one row here and one catalogue file next to it —
// nothing else in the app hardcodes a locale. The admin console itself stays Chinese
// and is deliberately not translated; this registry describes the player lobby only.
//
// nativeName is written out rather than derived from Intl.DisplayNames at runtime so
// the picker reads identically across browsers and Node versions. bcp47 is what gets
// handed to Intl for number and date formatting.
export const locales = [
  { code: 'zh-Hans', bcp47: 'zh-Hans-CN', nativeName: '简体中文', dir: 'ltr' },
  { code: 'zh-Hant', bcp47: 'zh-Hant-TW', nativeName: '繁體中文', dir: 'ltr' },
  { code: 'en', bcp47: 'en-US', nativeName: 'English', dir: 'ltr' },
  { code: 'es', bcp47: 'es-ES', nativeName: 'Español', dir: 'ltr' },
  { code: 'pt-BR', bcp47: 'pt-BR', nativeName: 'Português (Brasil)', dir: 'ltr' },
  { code: 'fr', bcp47: 'fr-FR', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', bcp47: 'de-DE', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'it', bcp47: 'it-IT', nativeName: 'Italiano', dir: 'ltr' },
  { code: 'ru', bcp47: 'ru-RU', nativeName: 'Русский', dir: 'ltr' },
  { code: 'ja', bcp47: 'ja-JP', nativeName: '日本語', dir: 'ltr' },
  { code: 'ko', bcp47: 'ko-KR', nativeName: '한국어', dir: 'ltr' },
  { code: 'ar', bcp47: 'ar-SA', nativeName: 'العربية', dir: 'rtl', latinDigits: true },
  { code: 'hi', bcp47: 'hi-IN', nativeName: 'हिन्दी', dir: 'ltr', latinDigits: true },
  { code: 'id', bcp47: 'id-ID', nativeName: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'th', bcp47: 'th-TH', nativeName: 'ไทย', dir: 'ltr' },
  { code: 'vi', bcp47: 'vi-VN', nativeName: 'Tiếng Việt', dir: 'ltr' },
  { code: 'tr', bcp47: 'tr-TR', nativeName: 'Türkçe', dir: 'ltr' },
  { code: 'pl', bcp47: 'pl-PL', nativeName: 'Polski', dir: 'ltr' },
  { code: 'nl', bcp47: 'nl-NL', nativeName: 'Nederlands', dir: 'ltr' },
  { code: 'ms', bcp47: 'ms-MY', nativeName: 'Bahasa Melayu', dir: 'ltr' },
  { code: 'fil', bcp47: 'fil-PH', nativeName: 'Filipino', dir: 'ltr' },
  { code: 'bn', bcp47: 'bn-BD', nativeName: 'বাংলা', dir: 'ltr', latinDigits: true },
  { code: 'fa', bcp47: 'fa-IR', nativeName: 'فارسی', dir: 'rtl', latinDigits: true, gregorian: true },
  { code: 'uk', bcp47: 'uk-UA', nativeName: 'Українська', dir: 'ltr' },
]

export const DEFAULT_LOCALE = 'zh-Hans'
// Untranslated keys fall back through this before showing the key itself.
export const FALLBACK_LOCALE = 'en'

export const supportedLocales = locales.map((entry) => entry.code)
export const localeMeta = Object.fromEntries(locales.map((entry) => [entry.code, entry]))

// Older links and stored preferences used bare 'zh'/'en'; keep them working.
const aliases = {
  zh: 'zh-Hans',
  'zh-cn': 'zh-Hans',
  'zh-sg': 'zh-Hans',
  'zh-hans': 'zh-Hans',
  'zh-tw': 'zh-Hant',
  'zh-hk': 'zh-Hant',
  'zh-mo': 'zh-Hant',
  'zh-hant': 'zh-Hant',
  pt: 'pt-BR',
  'pt-pt': 'pt-BR',
  tl: 'fil',
  in: 'id',
  iw: 'he',
}

// Accepts a bare code, a regional variant (en-GB), a legacy alias (zh) or junk.
// Returns a supported locale code, or null when nothing matches.
export function normalizeLocale(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  const raw = value.trim()
  const lower = raw.toLowerCase()
  if (aliases[lower] && localeMeta[aliases[lower]]) return aliases[lower]
  const exact = supportedLocales.find((code) => code.toLowerCase() === lower)
  if (exact) return exact
  // en-GB -> en, es-MX -> es, but never pt-PT -> pt (pt is not supported on its own)
  const base = lower.split('-')[0]
  if (aliases[base] && localeMeta[aliases[base]]) return aliases[base]
  return supportedLocales.find((code) => code.toLowerCase() === base) ?? null
}

export function isRtl(code) {
  return localeMeta[code]?.dir === 'rtl'
}

// The tag handed to Intl. Locales that would otherwise render Arabic-Indic or
// Devanagari digits are pinned to latin digits, because balances and prices are
// compared against the host app's own numerals.
export function intlTag(code) {
  const entry = localeMeta[code]
  if (!entry) return localeMeta[FALLBACK_LOCALE].bcp47
  let tag = entry.bcp47
  if (entry.latinDigits) tag += '-u-nu-latn'
  if (entry.gregorian) tag += (entry.latinDigits ? '-ca-gregory' : '-u-ca-gregory')
  return tag
}
