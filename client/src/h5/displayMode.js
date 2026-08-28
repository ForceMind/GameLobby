/**
 * Serialize display-mode requests sent to the native host.
 *
 * Native display changes cannot be cancelled from the page.  Keeping one
 * request in flight and replacing only the unsent request prevents a rapid
 * half/full toggle from issuing competing operations while retaining the
 * latest user intent.
 */
export function createDisplayModeDispatcher(send) {
  let revision = 0
  let inFlight = false
  let queued = null

  const pump = () => {
    if (inFlight || !queued) return

    const current = queued
    queued = null
    inFlight = true

    Promise.resolve()
      .then(() => send(current.payload))
      .then(
        (result) => {
          inFlight = false
          current.resolve(result)
          pump()
        },
        () => {
          inFlight = false
          current.resolve({ status: 'failed' })
          pump()
        },
      )
  }

  return {
    request(payload = {}) {
      const requestPayload = { ...payload, revision: ++revision }
      const promise = new Promise((resolve) => {
        if (queued) queued.resolve({ status: 'cancelled', code: 'superseded' })
        queued = { payload: requestPayload, resolve }
      })
      pump()
      return promise
    },

    cancelPending() {
      if (!queued) return
      queued.resolve({ status: 'cancelled', code: 'cancelled' })
      queued = null
    },
  }
}
