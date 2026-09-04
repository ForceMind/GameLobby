import { useState } from 'react'
import { useLocale } from '../useLocale.js'
import { Icon } from '../icons.jsx'
import { appVersion } from '../version.js'
import './entry.css'

export default function EntryGate() {
  const { t, href } = useLocale()
  const [mode, setMode] = useState('full')
  return (
    <main className="prototype-entry">
      <section
        className="prototype-entry-card"
        aria-labelledby="prototype-title"
      >
        <div className="prototype-entry-brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span className="prototype-entry-brand-copy"><strong>Joyloop</strong><small>v{appVersion}</small></span>
        </div>
        <p className="eyebrow">{t('prototype.eyebrow')}</p>
        <h1 id="prototype-title">{t('prototype.title')}</h1>
        <p className="prototype-entry-intro">
          {t('prototype.intro')}
        </p>
        <a className="prototype-doc-link" href={href('docs.html')}><Icon name="calendar" />{t('prototype.docsLink')} <Icon name="chevronRight" /></a>
        <a className="prototype-admin-link" href="./admin.html"><Icon name="gauge" />{t('prototype.adminLink')} <Icon name="chevronRight" /></a>
        <ul className="prototype-entry-notes">
          <li>
            <Icon name="gamepad" />
            <span>
              <strong>{t('prototype.screensTitle')}</strong>
              {t('prototype.screensBody')}
            </span>
          </li>
          <li>
            <Icon name="bolt" />
            <span>
              <strong>{t('prototype.interactionsTitle')}</strong>
              {t('prototype.interactionsBody')}
            </span>
          </li>
          <li>
            <Icon name="eye" />
            <span>
              <strong>{t('prototype.dataTitle')}</strong>
              {t(
                '当前使用预设数据，用于评审视觉与流程，不代表真实账户或交易。',
              )}
            </span>
          </li>
        </ul>
        <fieldset className="prototype-entry-modes">
          <legend>{t('prototype.modeLegend')}</legend>
          <label className={mode === 'full' ? 'is-selected' : ''}>
            <input
              type="radio"
              name="display-mode"
              value="full"
              checked={mode === 'full'}
              onChange={() => setMode('full')}
            />
            <strong>{t('prototype.modeFull')}</strong>
            <small>{t('prototype.modeFullHint')}</small>
          </label>
          <label className={mode === 'half' ? 'is-selected' : ''}>
            <input
              type="radio"
              name="display-mode"
              value="half"
              checked={mode === 'half'}
              onChange={() => setMode('half')}
            />
            <strong>{t('prototype.modeCompact')}</strong>
            <small>{t('prototype.modeCompactHint')}</small>
          </label>
        </fieldset>
        <button
          className="btn btn-primary prototype-enter"
          type="button"
          onClick={() =>
            window.location.assign(href('lobby.html?mode=' + mode))
          }
        >
          {t('prototype.enter')}
        </button>
      </section>
    </main>
  )
}
