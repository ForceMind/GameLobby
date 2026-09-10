// Session-only workflow rules. These never call payment or deployment services.
export const ledgerTransitions = {
  processing: [
    ['模拟确认入账', 'completed'],
    ['模拟驳回调整', 'failed', { requireReason: true }],
  ],
}

export const canReviewAdjustment = (record) => record?.source === 'manual_adjust' && record.status === 'processing'

export function reviewAdjustment(store, id, status, reason = '', seq = Date.now()) {
  const record = store.ledger.find((row) => row.id === id)
  if (!canReviewAdjustment(record) || !['completed', 'failed'].includes(status)) return { error: '该记录不是待复核的人工调整，不能操作', store }
  if (status === 'failed' && !reason.trim()) return { error: '驳回调整必须填写原因', store }
  const action = status === 'completed' ? '模拟确认入账' : '模拟驳回调整'
  return { store: {
    ...store,
    ledger: store.ledger.map((row) => row.id === id ? { ...row, status, time: '刚刚', simulated: true } : row),
    todo: store.todo.map((todo) => todo.link?.page === 'ledger' && todo.link.focusId === id ? { ...todo, status: '已解决', resolution: `${action}；未操作真实资产`, time: '刚刚' } : todo),
    audit: [{ id: `audit-adjust-${seq}`, logId: `#${seq}`, actor: '运营管理员', action, target: id, targetModule: 'ledger', targetId: id, before: record.status, after: status, result: `模拟完成 · 未修改余额${reason ? ` · ${reason.trim()}` : ''}`, time: '刚刚' }, ...store.audit],
  } }
}

export const isVersionRelease = (entry) => ['versions', 'test', 'production'].includes(entry?.sourceModule)
const gameName = (row) => {
  const game = typeof row?.game === 'string' ? row.game.trim() : ''
  return game || null
}
export function versionReleaseKey(store, entry) {
  const source = store[entry.sourceModule]?.find((row) => row.id === entry.sourceId)
  const game = gameName(source)
  return game ? `version:${game}` : null
}

// One review decision drives its source record and the simulated production view.
// Keep only the affected game's previous values; rollback must not touch other games.
export function syncVersionRelease(store, entry, decision) {
  const source = store[entry.sourceModule]?.find((row) => row.id === entry.sourceId)
  if (!source) return store
  const game = gameName(source)
  if (!game) return store
  const matchesGame = (row) => gameName(row) === game
  const currentEntry = store.publish.find((row) => row.id === entry.id) || entry
  const currentProduction = store.production?.find((row) => matchesGame(row) && row.id !== (entry.sourceModule === 'production' ? source.id : null))
  const prior = currentEntry.previousVersionState || {
    source: { ...source }, production: currentProduction ? { ...currentProduction } : null,
    pointers: (store.versions || []).filter(matchesGame).map((row) => ({ id: row.id, production: row.production })),
  }
  const status = { approve: '已发布', gray: '灰度 20%', pause: '已暂停', resume: '已发布', reject: '测试通过', rollback: '已回滚', resubmit: '待审核' }[decision]
  if (!status) return store
  let next = {
    ...store,
    [entry.sourceModule]: store[entry.sourceModule].map((row) => row.id === source.id ? { ...row, status, simulated: true, time: '刚刚', ...(entry.sourceModule === 'test' ? { metric: `模拟审核：${status}` } : {}) } : row),
  }
  if (['approve', 'gray', 'resume', 'pause'].includes(decision)) {
    const version = entry.sourceModule === 'versions' ? `${game} ${source.version}` : source.version
    const production = { id: entry.sourceModule === 'production' ? source.id : currentProduction?.id || `production-${entry.id}`, game, version, build: source.build || source.scope || '原型会话', env: '生产环境（模拟）', status, metric: '仅会话状态，未部署真实游戏', simulated: true, time: '刚刚' }
    next.production = [production, ...(next.production || []).filter((row) => !matchesGame(row))]
    next.versions = (next.versions || []).map((row) => matchesGame(row) ? { ...row, production: `模拟 ${version}`, time: '刚刚' } : row)
    next.publish = next.publish.map((row) => row.id === entry.id ? { ...row, previousVersionState: prior } : row)
  }
  if (decision === 'rollback') {
    next.production = [...(prior.production ? [prior.production] : []), ...(next.production || []).filter((row) => !matchesGame(row))]
    next.versions = (next.versions || []).map((row) => {
      const saved = prior.pointers.find((pointer) => pointer.id === row.id)
      return saved ? { ...row, production: saved.production } : row
    })
  }
  return next
}
