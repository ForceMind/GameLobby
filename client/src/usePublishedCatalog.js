import { useMemo, useSyncExternalStore } from 'react'
import { CATALOG_STORAGE_KEY, CATALOG_EVENT, parseCatalogPublication, playerCatalog, catalogPreviewSelection } from './catalogPreview.js'

const SESSION_KEY = 'joyloop.catalog.preview.selection'
function selection() {
  if (typeof window === 'undefined' || window.JoyloopHost || import.meta.env?.VITE_ENGAGEMENT_SOURCE === 'server') return null
  try {
    const query = new URLSearchParams(window.location.search)
    const selected = catalogPreviewSelection({ search: window.location.search, saved: window.sessionStorage.getItem(SESSION_KEY), hasHost: Boolean(window.JoyloopHost), source: import.meta.env?.VITE_ENGAGEMENT_SOURCE })
    if (query.get('catalogPreview') === '0') window.sessionStorage.removeItem(SESSION_KEY)
    else if (query.get('catalogPreview') === '1' && selected) window.sessionStorage.setItem(SESSION_KEY, selected)
    return selected
  } catch { return null }
}
function snapshot() {
  const env = selection()
  if (!env) return ''
  try { return `${env}\n${window.localStorage.getItem(CATALOG_STORAGE_KEY) || ''}` } catch { return '' }
}
function subscribe(notify) {
  const stored = (event) => { if (event.key === CATALOG_STORAGE_KEY || event.key === null) notify() }
  window.addEventListener('storage', stored)
  window.addEventListener(CATALOG_EVENT, notify)
  window.addEventListener('joyloop:context', notify)
  return () => { window.removeEventListener('storage', stored); window.removeEventListener(CATALOG_EVENT, notify); window.removeEventListener('joyloop:context', notify) }
}
export function usePublishedCatalog() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '')
  return useMemo(() => {
    const split = raw.indexOf('\n')
    const env = split < 0 ? 'test' : raw.slice(0, split)
    const publication = split < 0 ? null : parseCatalogPublication(raw.slice(split + 1))
    return { ...playerCatalog(publication, env), previewEnabled: Boolean(raw), environment: env }
  }, [raw])
}
