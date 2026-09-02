import common from './locales/common.js'
import profileTournaments from './locales/profileTournaments.js'
import eventsStore from './locales/eventsStore.js'
import h5Product from './locales/h5Product.js'
import storeProduct from './locales/storeProduct.js'
import profileProduct from './locales/profileProduct.js'
import activitiesProduct from './locales/activitiesProduct.js'
import entryProduct from './locales/entryProduct.js'
import compactProduct from './locales/compactProduct.js'
import compactAccountStore from './locales/compactAccountStore.js'
import engagementMessages from './data/engagementMessages.json' with { type: 'json' }

export const catalogs = {
  common,
  profileTournaments,
  eventsStore,
  h5Product,
  storeProduct,
  profileProduct,
  activitiesProduct,
  entryProduct,
  compactProduct,
  compactAccountStore,
}
// Shared terminology wins if a page-specific catalog repeats a common label.
export const englishMessages = {
  ...profileTournaments,
  ...eventsStore,
  ...common,
  ...storeProduct,
  ...profileProduct,
  ...activitiesProduct,
  ...h5Product,
  ...entryProduct,
  ...compactProduct,
  ...compactAccountStore,
}
export const supportedLocales = ['zh', 'en']

const chineseTerms = {
  Slots: '老虎机',
  'Slots · 实时': '老虎机 · 实时',
  'Slot 赛事': '老虎机赛事',
  'Slot 冲榜赛': '老虎机冲榜赛',
  'Jackpot 争夺赛': '累积大奖争夺赛',
  'Jackpot 猎手': '大奖猎手',
  'Lucky Spin 狂欢季': '幸运旋转狂欢季',
  'Classic Slot 周挑战': '经典老虎机周挑战',
  'Free Spin': '免费旋转',
}

export function resolveLocale(search = '', savedLocale = 'zh') {
  const requested = new URLSearchParams(search).get('lang')
  return supportedLocales.includes(requested)
    ? requested
    : supportedLocales.includes(savedLocale)
      ? savedLocale
      : 'zh'
}

export function createTranslator(locale) {
  return (source, values = {}) => {
    if (typeof source !== 'string') return source
    const template = engagementMessages[locale]?.[source] ?? (
      locale === 'en'
        ? (englishMessages[source] ?? source)
        : (chineseTerms[source] ?? source))
    return template.replace(/\{(\w+)\}/g, (match, key) =>
      Object.hasOwn(values, key) ? String(values[key]) : match,
    )
  }
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
  query.set('lang', supportedLocales.includes(locale) ? locale : 'zh')
  // Business navigation keeps its layout; the independent entry omits this argument.
  if (['half', 'full'].includes(displayMode)) {
    query.set('mode', displayMode)
  }
  return `${pathname}?${query.toString()}${hash}`
}
