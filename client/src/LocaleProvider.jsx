import { useEffect, useMemo, useState } from 'react'
import {
  createTranslator,
  localizedHref,
  resolveLocale,
  supportedLocales,
} from './i18n.js'
import { LocaleContext } from './useLocale.js'

const pageTitles = {
  lobby: '大厅',
  games: '全部游戏',
  tournaments: 'Slot 赛事',
  events: '活动中心',
  store: '金币商城',
  profile: '我的',
}

export default function LocaleProvider({ children }) {
  const [locale, updateLocale] = useState(() => {
    let saved = 'zh'
    try {
      saved = window.localStorage.getItem('joyloop.locale') || 'zh'
    } catch {
      /* Private mode can disable storage. */
    }
    return resolveLocale(window.location.search, saved)
  })
  const t = useMemo(() => createTranslator(locale), [locale])

  const setLocale = (next) => {
    if (!supportedLocales.includes(next)) return
    updateLocale(next)
    try {
      window.localStorage.setItem('joyloop.locale', next)
    } catch {
      /* URL still preserves the selected language. */
    }
    const url = new URL(window.location.href)
    url.searchParams.set('lang', next)
    window.history.replaceState(null, '', url)
  }

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    document.documentElement.dataset.locale = locale
    document.title = `${t(pageTitles[document.body.dataset.page] ?? '大厅')} · Joyloop`
    const description = document.querySelector('meta[name="description"]')
    if (description)
      description.content = t('Joyloop 游戏大厅静态交互演示，不涉及真实交易。')
  }, [locale, t])

  const value = {
    t,
    locale,
    setLocale,
    href: (value) => localizedHref(value, locale),
  }
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}
