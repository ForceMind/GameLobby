// Used only by the restored openExit modal's explicit confirmation action.
export function createExitAction({ hasHost, closeHost, navigate }) {
  let pending = false
  return async () => {
    if (pending) return { status: 'pending' }
    pending = true
    try {
      if (hasHost()) return await closeHost()
      navigate()
      return { status: 'completed' }
    } catch { return { status: 'failed' } }
    finally { pending = false }
  }
}
