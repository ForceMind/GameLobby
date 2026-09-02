import { useContext, useState } from 'react'
import { EngagementContext } from '../engagement/useEngagement.js'
import { useLocale } from '../useLocale.js'

export default function ProfileSettings() {
  const { t } = useLocale()
  const { preferences, settingsBusy, updatePreference, errors, refresh } = useContext(EngagementContext)
  const [saved, setSaved] = useState(false)
  if (!preferences) return <div><p role="status">{t(errors.preferences || 'common.loading')}</p>{errors.preferences && <button className="btn btn-secondary" onClick={() => refresh('preferences')}>{t('common.retry')}</button>}</div>
  const toggle = async key => { setSaved(false); setSaved(await updatePreference(key)) }
  return <div className="profile-settings-dialog">
    <div className="settings-list card">{[
      ['receiveWinNotifications', 'settings.danmaku'],
      ['allowSendWins', 'settings.publish'],
      ['shareRecentGames', 'settings.recentGames'],
    ].map(([key, label]) => <button key={key} type="button" role="switch" aria-label={t(label)} aria-checked={preferences[key]} disabled={settingsBusy} onClick={() => toggle(key)}>
      <span><strong>{t(label)}</strong><small>{t(preferences[key] ? 'settings.on' : 'settings.off')}</small></span>
      <span className={`switch ${preferences[key] ? 'is-on' : ''}`} aria-hidden="true"><i /></span>
    </button>)}</div>
    <p className="settings-help">{t('settings.danmakuHelp')}</p>
    {errors.settings ? <p className="form-error" role="alert">{t(errors.settings)}</p> : <p role="status">{settingsBusy ? t('settings.saving') : saved ? t('settings.saved') : ''}</p>}
  </div>
}
