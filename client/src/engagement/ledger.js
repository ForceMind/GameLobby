export function normalizeLedger(entries) {
  return entries.map(row => ({
    id: row.id,
    currency: row.currency ?? 'coins',
    amount: row.amount ?? row.coins,
    source: row.source ?? (row.id.startsWith('purchase-') ? 'chest_purchase' : 'chest_reward'),
    createdAt: row.createdAt ?? row.at,
    status: row.status ?? 'completed',
    balanceBefore: Number.isSafeInteger(row.balanceBefore) ? row.balanceBefore : null,
    balanceAfter: Number.isSafeInteger(row.balanceAfter) ? row.balanceAfter : null,
  })).filter(row => Number.isSafeInteger(row.amount) && ['coins', 'gems'].includes(row.currency) && Number.isFinite(row.createdAt))
    .sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id))
}

export function filterLedger(entries, currency = 'all', direction = 'all') {
  return entries.filter(row => (currency === 'all' || row.currency === currency) &&
    (direction === 'all' || (direction === 'income' ? row.amount > 0 : row.amount < 0)))
}
