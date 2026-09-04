import { useEffect, useRef, useState } from 'react'
import { Icon } from '../icons.jsx'
import { useLocale } from '../useLocale.js'
import { locales } from '../locales/registry.js'
import '../styles/languagePicker.css'

// Every language is listed under its own name — a player looking for Português
// should not have to know the Chinese or English word for it. The list comes from
// the locale registry, so adding a language never means editing this component.
const shortLabel = (code) => code.split('-')[0].toUpperCase()

export default function LanguagePicker({ compact = false }) {
  const { t, locale, setLocale } = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const selected = locales.find((entry) => entry.code === locale) ?? locales[0]

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div className={`language-picker ${compact ? 'is-compact' : ''}`} ref={rootRef}>
      <button
        className="language-picker-trigger"
        type="button"
        aria-label={t('settings.language')}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{compact ? shortLabel(selected.code) : selected.nativeName}</span>
        <Icon name="chevronRight" />
      </button>
      {open && (
        <div
          className="language-picker-menu"
          role="listbox"
          aria-label={t('settings.language')}
        >
          {locales.map((entry) => (
            <button
              className={entry.code === locale ? 'is-selected' : ''}
              type="button"
              role="option"
              lang={entry.bcp47}
              dir={entry.dir}
              aria-selected={entry.code === locale}
              key={entry.code}
              onClick={() => {
                setLocale(entry.code)
                setOpen(false)
              }}
            >
              <span>{entry.nativeName}</span>
              {entry.code === locale && (
                <span className="language-picker-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
