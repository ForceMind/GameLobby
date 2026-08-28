export function isValidNickname(value) {
  if (typeof value !== 'string') return false
  const length = Array.from(value.trim()).length
  return length >= 2 && length <= 20
}

export function filterGames(
  catalog,
  category,
  onlyReady = false,
  onlyRealtime = false,
) {
  return catalog.filter((game) => {
    const categories = game.tags ?? game.category.split(' ')
    const matchesCategory =
      category === 'all' ||
      (category === 'popular' ? game.popular : categories.includes(category))
    return (
      matchesCategory &&
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
