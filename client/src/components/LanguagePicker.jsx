import { useEffect, useRef, useState } from 'react'
import { Icon } from '../icons.jsx'
import { useLocale } from '../useLocale.js'
import '../styles/languagePicker.css'

export default function LanguagePicker({ locale, onChange, compact = false }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const options = [
    { value: 'zh', label: t('简体中文'), compactLabel: t('简中') },
    { value: 'en', label: t('英文'), compactLabel: 'EN' },
  ]
  const selected = options.find((option) => option.value === locale) ?? options[0]

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
        aria-label={t('界面语言')}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{compact ? selected.compactLabel : selected.label}</span>
        <Icon name="chevronRight" />
      </button>
      {open && (
        <div className="language-picker-menu" role="listbox" aria-label={t('界面语言')}>
          {options.map((option) => (
            <button
              className={option.value === locale ? 'is-selected' : ''}
              type="button"
              role="option"
              aria-selected={option.value === locale}
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              <span>{option.label}</span>
              {option.value === locale && <span className="language-picker-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
