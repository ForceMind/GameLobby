const supportedActions = new Set(['setDisplayMode', 'closeLobby', 'purchase'])
let requestSequence = 0

export async function requestHost(action, payload = {}, options = {}) {
  if (!supportedActions.has(action))
    return { status: 'failed', code: 'unsupported-action' }
  if (
    action === 'purchase' &&
    (payload.currency !== 'USD' ||
      !payload.sku ||
      !Number.isInteger(payload.priceCents) ||
      payload.priceCents <= 0)
  ) {
    return { status: 'failed', code: 'invalid-purchase' }
  }
  const target =
    options.target ?? (typeof window === 'undefined' ? null : window)
  const host = options.host ?? target?.JoyloopHost
  const requestId =
    options.requestId ??
    target?.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${(++requestSequence).toString(36)}`
  const request = { version: 1, requestId, action, payload }
  if (typeof host?.request !== 'function') {
    if (target?.dispatchEvent && typeof target.CustomEvent === 'function') {
      target.dispatchEvent(
        new target.CustomEvent('joyloop:request', { detail: request }),
      )
    }
    return { status: 'unavailable' }
  }

  let timer
  try {
    const result = await Promise.race([
      Promise.resolve().then(() => host.request(request)),
      new Promise((resolve) => {
        timer = setTimeout(
          () => resolve({ status: 'failed', code: 'timeout' }),
          options.timeoutMs ?? 12000,
        )
      }),
    ])
    const status = ['completed', 'cancelled', 'failed', 'unavailable'].includes(
      result?.status,
    )
      ? result.status
      : 'failed'
    return {
      status,
      ...(result?.code === 'timeout' ? { code: 'timeout' } : {}),
    }
  } catch {
    return { status: 'failed' }
  } finally {
    clearTimeout(timer)
  }
}
