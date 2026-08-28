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
  const rate = Number(pack.bonus.replace(/[+%]/g, '')) / 100
  const bonusCoins = Math.round(pack.coins * rate)
  return {
    baseCoins: pack.coins,
    bonusCoins,
    totalCoins: pack.coins + bonusCoins,
    gems: pack.gemBonus,
  }
}

export function validateDemoCode(value) {
  const normalized = value.trim().toUpperCase()
  if (!normalized) return { type: 'error', message: '请输入兑换码。' }
  if (normalized === 'JOY-DEMO')
    return {
      type: 'success',
      message: '校验成功：演示奖励包可用（未真实兑换）。',
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
