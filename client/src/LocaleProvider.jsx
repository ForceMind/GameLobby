import { useEffect, useMemo, useState } from 'react'
import {
  createTranslator,
  isRtl,
  localeMeta,
  localizedHref,
  normalizeLocale,
  resolveLocale,
  setMissingTranslationHandler,
  supportedLocales,
} from './i18n.js'
import { createFormatters } from './format.js'
import { LocaleContext } from './useLocale.js'
import { useNavigation } from './useNavigation.js'
import { normalizeHostContext } from './h5/hostContext.js'

const pageTitles = {
  welcome: 'prototype.pageTitle',
  lobby: 'nav.lobby',
  games: 'games.allTitle',
  tournaments: 'Slot 赛事',
  events: 'events.title',
  store: 'store.title',
  profile: 'profile.title',
  docs: 'docs.pageTitle',
}

const STORAGE_KEY = 'joyloop.locale'

// This provider sits outside H5Provider, so it reads the host's language from the
// same window surface H5Provider does rather than through React context.
function readHostLocale() {
  try {
    return normalizeHostContext(window.JoyloopHost?.context).locale ?? null
  } catch {
    return null
  }
}

function readStoredLocale() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Private mode can disable storage; the URL still carries the choice.
    return null
  }
}

function browserLanguages() {
  if (typeof navigator === 'undefined') return []
  return navigator.languages?.length ? [...navigator.languages] : [navigator.language].filter(Boolean)
}

// A missing translation must never ship silently. In development it is loud; in
// production it stays a single grouped warning so the fallback text still renders.
if (import.meta.env?.DEV) {
  setMissingTranslationHandler(({ locale, key, resolvedFrom }) => {
    const detail = resolvedFrom === 'key' ? 'no translation anywhere, rendering the key itself' : `fell back to ${resolvedFrom}`
    console.warn(`[i18n] missing ${locale} translation for "${key}" — ${detail}`)
  })
}

export default function LocaleProvider({ children }) {
  const { page } = useNavigation()
  const [savedLocale, updateLocale] = useState(() =>
    resolveLocale(window.location.search, readStoredLocale(), readHostLocale(), browserLanguages()),
  )
  const [hostLocale, setHostLocale] = useState(readHostLocale)
  const locale = resolveLocale(window.location.search, savedLocale, hostLocale, browserLanguages())
  const t = useMemo(() => createTranslator(locale), [locale])
  const format = useMemo(() => createFormatters(locale), [locale])

  // The host can change language while the lobby is open.
  useEffect(() => {
    const onContext = (event) => {
      const next = normalizeHostContext(event.detail).locale
      if (next) setHostLocale(next)
    }
    window.addEventListener('joyloop:context', onContext)
    return () => window.removeEventListener('joyloop:context', onContext)
  }, [])

  const setLocale = (next) => {
    const target = normalizeLocale(next)
    if (!target) return
    updateLocale(target)
    try {
      window.localStorage.setItem(STORAGE_KEY, target)
    } catch {
      /* URL still preserves the selected language. */
    }
    const url = new URL(window.location.href)
    url.searchParams.set('lang', target)
    window.history.replaceState(null, '', url)
    window.dispatchEvent(new Event('joyloop:navigate'))
  }

  useEffect(() => {
    const meta = localeMeta[locale]
    document.documentElement.lang = meta?.bcp47 ?? locale
    document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr'
    document.documentElement.dataset.locale = locale
    document.body.dataset.page = page
    document.title = `${t(pageTitles[page] ?? 'nav.lobby')} · Joyloop`
    const description = document.querySelector('meta[name="description"]')
    if (description)
      description.content = t(
        page === 'welcome' ? 'prototype.metaDescription' : 'lobby.metaDescription',
      )
  }, [locale, t, page])

  const value = {
    t,
    format,
    locale,
    localeMeta: localeMeta[locale],
    supportedLocales,
    isRtl: isRtl(locale),
    setLocale,
    href: (value) =>
      localizedHref(
        value,
        locale,
        page === 'welcome'
          ? undefined
          : new URLSearchParams(window.location.search).get('mode') === 'half'
            ? 'half'
            : 'full',
      ),
  }
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}
