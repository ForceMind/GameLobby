import { useState } from 'react'
import { Icon } from '../icons.jsx'
import { useLocale } from '../useLocale.js'
import { useH5 } from './useH5.js'

export default function EntryGate() {
  const { t, locale, setLocale } = useLocale()
  const { mode, setMode, enterLobby, closeLobby } = useH5()
  const [agreed, setAgreed] = useState(false)
  return (
    <div className="h5-entry-stage">
      <section className="entry-card" aria-labelledby="entry-title">
        <div className="entry-brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <strong>Joyloop</strong>
          <label className="entry-language">
            <span className="sr-only">{t('界面语言')}</span>
            <select
              aria-label={t('界面语言')}
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
            >
              <option value="zh">{t('简中')}</option>
              <option value="en">EN</option>
            </select>
          </label>
        </div>
        <p className="eyebrow">PLAY ON THE BRIGHT SIDE</p>
        <h1 id="entry-title">{t('进入游戏大厅前')}</h1>
        <p className="entry-intro">
          {t('请先阅读以下说明，再选择喜欢的打开方式。')}
        </p>
        <ul className="entry-notes">
          <li>
            <Icon name="user" />
            <span>{t('使用当前 App 账号进入，无需重复登录。')}</span>
          </li>
          <li>
            <Icon name="coin" />
            <span>{t('金币与宝石用于游戏和活动，操作前请核对数量。')}</span>
          </li>
          <li>
            <Icon name="gamepad" />
            <span>{t('游戏将全屏打开，结束后可以返回当前大厅。')}</span>
          </li>
        </ul>
        <fieldset className="entry-modes">
          <legend>{t('大厅打开方式')}</legend>
          <label className={mode === 'half' ? 'is-selected' : ''}>
            <input
              type="radio"
              name="lobby-mode"
              value="half"
              checked={mode === 'half'}
              onChange={() => setMode('half')}
            />
            <strong>{t('半屏大厅')}</strong>
            <small>{t('1:1 方形窗口')}</small>
          </label>
          <label className={mode === 'full' ? 'is-selected' : ''}>
            <input
              type="radio"
              name="lobby-mode"
              value="full"
              checked={mode === 'full'}
              onChange={() => setMode('full')}
            />
            <strong>{t('全屏大厅')}</strong>
            <small>{t('使用完整屏幕')}</small>
          </label>
        </fieldset>
        <label className="entry-consent">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
          />
          <span>{t('我已阅读并同意以上说明')}</span>
        </label>
        <button
          className="btn btn-primary entry-enter"
          type="button"
          disabled={!agreed}
          onClick={enterLobby}
        >
          {t('同意并进入')}
        </button>
        <button
          className="btn btn-ghost entry-cancel"
          type="button"
          onClick={closeLobby}
        >
          {t('返回 App')}
        </button>
      </section>
    </div>
  )
}
