import { useState } from 'react'
import { useLocale } from '../useLocale.js'
import { Icon } from '../icons.jsx'
import LanguagePicker from '../components/LanguagePicker.jsx'
import './entry.css'

export default function EntryGate() {
  const { t, locale, setLocale, href } = useLocale()
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
          <strong>Joyloop</strong>
          <div className="prototype-entry-language"><LanguagePicker locale={locale} onChange={setLocale} compact /></div>
        </div>
        <p className="eyebrow">{t('原型评审')}</p>
        <h1 id="prototype-title">{t('Joyloop 游戏大厅')}</h1>
        <p className="prototype-entry-intro">
          {t('用于评审页面设计、主要交互与全屏／半屏体验。')}
        </p>
        <ul className="prototype-entry-notes">
          <li>
            <Icon name="gamepad" />
            <span>
              <strong>{t('展示范围')}</strong>
              {t('大厅、游戏目录、赛事、活动、商城与个人中心。')}
            </span>
          </li>
          <li>
            <Icon name="bolt" />
            <span>
              <strong>{t('交互范围')}</strong>
              {t('可体验页面导航、资产浮窗、购买确认及游戏加载与退出。')}
            </span>
          </li>
          <li>
            <Icon name="eye" />
            <span>
              <strong>{t('数据说明')}</strong>
              {t(
                '当前使用预设数据，用于评审视觉与流程，不代表真实账户或交易。',
              )}
            </span>
          </li>
        </ul>
        <fieldset className="prototype-entry-modes">
          <legend>{t('选择预览方式')}</legend>
          <label className={mode === 'full' ? 'is-selected' : ''}>
            <input
              type="radio"
              name="display-mode"
              value="full"
              checked={mode === 'full'}
              onChange={() => setMode('full')}
            />
            <strong>{t('全屏预览')}</strong>
            <small>{t('完整页面与交互')}</small>
          </label>
          <label className={mode === 'half' ? 'is-selected' : ''}>
            <input
              type="radio"
              name="display-mode"
              value="half"
              checked={mode === 'half'}
              onChange={() => setMode('half')}
            />
            <strong>{t('半屏预览')}</strong>
            <small>{t('1:1 游戏优先布局')}</small>
          </label>
        </fieldset>
        <button
          className="btn btn-primary prototype-enter"
          type="button"
          onClick={() =>
            window.location.assign(href('lobby.html?mode=' + mode))
          }
        >
          {t('进入原型')}
        </button>
      </section>
    </main>
  )
}
