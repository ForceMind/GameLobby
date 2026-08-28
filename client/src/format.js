export const formatNumber = (value) =>
  new Intl.NumberFormat('zh-CN').format(value)

export const formatWalletLabel = (value, compact = false) =>
  value < (compact ? 1000 : 100000)
    ? new Intl.NumberFormat('en-US').format(value)
    : new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value)

export const formatUsdCents = (cents) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100)
