import { intlTag } from './locales/registry.js'

// The wallet chip keeps a single K/M compact style across every language: it sits
// beside the host app's own balance, and 52.9K has to line up with what the host shows.
// Everything else below follows the player's language.
export const formatWalletLabel = (value, compact = false) =>
  value < (compact ? 1000 : 100000)
    ? new Intl.NumberFormat('en-US').format(value)
    : new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value)

// Locale-bound formatters. LocaleProvider builds these once per locale and hands
// them down, so no call site has to know which language is active.
export function createFormatters(locale) {
  const tag = intlTag(locale)
  const number = new Intl.NumberFormat(tag)
  // narrowSymbol keeps the bare "$" in every language instead of letting some
  // locales expand it to "US$"; the lobby only ever prices in USD.
  const usd = new Intl.NumberFormat(tag, {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
  })
  return {
    locale,
    intlTag: tag,
    number: (value) => number.format(value),
    usdCents: (cents) => usd.format(cents / 100),
    walletLabel: formatWalletLabel,
    dateTime: (value, options = {}, timeZone = 'Asia/Shanghai') =>
      new Intl.DateTimeFormat(tag, { timeZone, ...options }).format(new Date(value)),
    clock: (value, timeZone = 'Asia/Shanghai') =>
      new Intl.DateTimeFormat(tag, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone,
      }).format(new Date(value)),
    shortDateTime: (value, timeZone = 'Asia/Shanghai') =>
      new Intl.DateTimeFormat(tag, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone,
      }).format(new Date(value)),
  }
}

// Kept for the handful of call sites that format outside a React tree.
// Prefer the formatters from useLocale() inside components.
export const formatNumber = (value, locale = 'zh-Hans') =>
  new Intl.NumberFormat(intlTag(locale)).format(value)

export const formatUsdCents = (cents, locale = 'zh-Hans') =>
  new Intl.NumberFormat(intlTag(locale), {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
  }).format(cents / 100)
