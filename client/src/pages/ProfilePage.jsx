import { useState } from 'react'
import { Icon } from '../icons.jsx'
import {
  achievements,
  profileSecurity,
  profileStats,
  recentRecords,
} from '../data.js'
import { Progress, SectionHeader } from '../ui.jsx'
import { formatNumber } from '../format.js'
import { useLocale } from '../useLocale.js'
import { useH5 } from '../h5/useH5.js'
import { isValidNickname } from '../demoModel.js'

function AccountAvatar({ account }) {
  const [failed, setFailed] = useState(false)
  const imageUrl =
    typeof account.avatar === 'string' &&
    /^(https:\/\/|\/(?!\/))/.test(account.avatar)
      ? account.avatar
      : null
  const initials =
    imageUrl || account.avatar?.length > 4
      ? Array.from(account.name).slice(0, 2).join('')
      : account.avatar
  return (
    <div className="avatar" aria-hidden="true">
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  )
}
function ProfileEditor({ initialName, onSave }) {
  const { t } = useLocale()
  const [draft, setDraft] = useState(initialName)
  const [error, setError] = useState(false)
  const save = (event) => {
    event.preventDefault()
    const value = draft.trim()
    if (!isValidNickname(value)) {
      setError(true)
      return
    }
    onSave(value)
  }
  return (
    <form className="profile-editor" onSubmit={save} noValidate>
      <label className="form-field">
        <span>{t('昵称')}</span>
        <input
          value={draft}
          maxLength={40}
          onChange={(event) => {
            setDraft(event.target.value)
            setError(false)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing)
              save(event)
          }}
          aria-invalid={error}
          aria-describedby={error ? 'profile-name-error' : undefined}
        />
      </label>
      <p id="profile-name-error" className="form-error" role="alert">
        {error ? t('昵称长度需为 2–20 个字符') : ''}
      </p>
      <button className="btn btn-primary" type="submit">
        {t('保存')}
      </button>
    </form>
  )
}

export default function ProfilePage({ openModal, toast, openWallet }) {
  const { t, locale, setLocale } = useLocale()
  const { account: profile, wallet: balances } = useH5()
  const [settings, setSettings] = useState({
    sound: true,
    vibration: false,
    autoplay: false,
  })
  const [editedName, setDisplayName] = useState(null)
  const displayName = editedName ?? profile.name
  const unlockedCount = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length
  const copyProfileId = async () => {
    try {
      await navigator.clipboard.writeText(profile.id)
      toast(t('ID 已复制'))
    } catch {
      toast(t('请长按 ID 复制'))
    }
  }
  const toggleSetting = (key, label) => {
    const next = !settings[key]
    setSettings((current) => ({ ...current, [key]: next }))
    toast(
      t('设置状态更新 {label} {state}', {
        label: t(label),
        state: t(next ? '已开启' : '已关闭'),
      }),
    )
  }
  const openEditor = () => {
    const save = (value) => {
      setDisplayName(value)
      toast(t('昵称已更新'))
      openModal(null)
    }
    openModal({
      title: t('编辑资料'),
      subtitle: t('编辑你的游戏昵称'),
      body: <ProfileEditor initialName={displayName} onSave={save} />,
      confirmLabel: t('关闭'),
      cancelLabel: null,
    })
  }
  const openRecords = () =>
    openModal({
      title: t('最近战绩详情'),
      subtitle: t('查看最近的游戏与赛事记录。'),
      body: (
        <div className="detail-list">
          {recentRecords.map((record) => (
            <div key={`${record.id}-${record.time}`}>
              <strong>{record.game}</strong>
              <span>
                {t(record.type)} · {t(record.time)}
              </span>
              <b className={record.coins >= 0 ? 'positive' : 'negative'}>
                {t(
                  record.coins >= 0
                    ? '收益记录 {coins} {currency} {gems}'
                    : '损失记录 {coins} {currency} {gems}',
                  {
                    coins: `${record.coins >= 0 ? '+' : ''}${formatNumber(record.coins)}`,
                    currency: t('金币'),
                    gems: record.gems
                      ? t('，奖励 {value} {currency}', {
                          value: `+${record.gems}`,
                          currency: t('宝石'),
                        })
                      : '',
                  },
                )}
              </b>
            </div>
          ))}
        </div>
      ),
      confirmLabel: t('关闭'),
      cancelLabel: null,
      onConfirm: () => {},
    })
  const openSecurity = (item) =>
    openModal({
      title: t('安全详情'),
      subtitle: t('请在 App 账号设置中管理安全信息。'),
      body: (
        <div className="detail-list">
          <div>
            <strong>{t(item.label)}</strong>
            <span>{t(item.value)}</span>
            <b>{t(item.status === '管理' ? '查看' : item.status)}</b>
          </div>
        </div>
      ),
      confirmLabel: t('知道了'),
      cancelLabel: null,
      onConfirm: () => {},
    })
  const openLanguage = () =>
    openModal({
      title: t('语言设置'),
      subtitle: t(locale === 'en' ? '当前语言：英文' : '当前语言：简体中文'),
      body: (
        <label className="form-field">
          <span>{t('语言')}</span>
          <select
            value={locale}
            onChange={(event) => {
              setLocale(event.target.value)
              openModal(null)
            }}
          >
            <option value="zh">{t('简体中文')}</option>
            <option value="en">{t('英文')}</option>
          </select>
        </label>
      ),
      confirmLabel: t('关闭'),
      cancelLabel: null,
      onConfirm: () => {},
    })
  return (
    <>
      <section className="page-head">
        <p className="eyebrow">{t('PROFILE · ACCOUNT')}</p>
        <h1>{t('我的')}</h1>
        <p>{t('资产、记录、成就与账号安全集中管理。')}</p>
      </section>
      <section className="profile-hero card">
        <AccountAvatar
          key={`${profile.id}:${profile.avatar}`}
          account={profile}
        />
        <div className="profile-copy">
          <span className="pill">{t('App 账号')}</span>
          <h2>{displayName}</h2>
          <button
            className="profile-id-action"
            type="button"
            onClick={copyProfileId}
          >
            {t('Joyloop ID · {id}', { id: profile.id })} <Icon name="copy" />
          </button>
        </div>
        <div className="profile-hero-summary">
          <strong>{t('Lv. {level}', { level: profile.level })}</strong>
          <span>{t('{count}/3 成就已解锁', { count: unlockedCount })}</span>
        </div>
        <div className="profile-hero-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={openEditor}
          >
            {t('编辑资料')}
          </button>
        </div>
      </section>
      <section className="section">
        <SectionHeader
          title={t('本周概览')}
          description={t('按周一 00:00 至当前时间统计')}
        />
        <div className="profile-stat-grid">
          {profileStats.map((stat) => (
            <article className="stat-card card" key={stat.label}>
              <span>{t(stat.label)}</span>
              <strong className={stat.positive ? 'positive' : ''}>
                {t(stat.value)}
              </strong>
            </article>
          ))}
        </div>
      </section>
      <div className="page-layout profile-layout">
        <div>
          <section className="section">
            <SectionHeader
              title={t('资产总览')}
              description={t('用于游戏、赛事与活动')}
            />
            <div className="asset-overview">
              <button
                className="card asset-card-link"
                type="button"
                onClick={() => openWallet('coins')}
                aria-haspopup="dialog"
              >
                <span className="asset-symbol coin">
                  <Icon name="coin" />
                </span>
                <div>
                  <span>{t('金币')}</span>
                  <strong>{balances.coinsLabel}</strong>
                  <p>{t('可用于开放的游戏与赛事')}</p>
                </div>
              </button>
              <button
                className="card asset-card-link"
                type="button"
                onClick={() => openWallet('gems')}
                aria-haspopup="dialog"
              >
                <span className="asset-symbol gem">
                  <Icon name="gem" />
                </span>
                <div>
                  <span>{t('宝石')}</span>
                  <strong>{balances.gemsLabel}</strong>
                  <p>{t('可用于指定赛事与活动')}</p>
                </div>
              </button>
            </div>
          </section>
          <section className="section">
            <SectionHeader
              title={t('成就进度')}
              description={t('完成条件后由服务端确认解锁')}
            />
            <div className="achievement-list">
              {achievements.map((achievement) => {
                const value = Math.round(
                  (achievement.current / achievement.total) * 100,
                )
                return (
                  <article className="achievement card" key={achievement.id}>
                    <span className="feature-icon">
                      <Icon name={achievement.icon} />
                    </span>
                    <div>
                      <div className="row-between">
                        <h3>{t(achievement.title)}</h3>
                        <span
                          className={`pill ${achievement.unlocked ? 'pill-success' : ''}`}
                        >
                          {achievement.unlocked
                            ? t('已解锁')
                            : `${achievement.current} / ${achievement.total}`}
                        </span>
                      </div>
                      <p>{t(achievement.description)}</p>
                      <Progress
                        value={value}
                        label={t('{title}进度', {
                          title: t(achievement.title),
                        })}
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
          <section className="section" id="records">
            <SectionHeader
              title={t('最近战绩')}
              description={t('最近五条游戏与赛事记录')}
              action={
                <button
                  className="text-action"
                  type="button"
                  onClick={openRecords}
                >
                  {t('全部战绩')} <Icon name="chevronRight" />
                </button>
              }
            />
            <div className="record-list card">
              {recentRecords.map((record) => (
                <div className="record-row" key={`${record.id}-${record.time}`}>
                  <span className="record-icon">
                    <Icon
                      name={record.type === 'Slots' ? 'jackpot' : 'gamepad'}
                    />
                  </span>
                  <span>
                    <strong>{record.game}</strong>
                    <small>
                      {t(record.type)} · {t(record.time)}
                    </small>
                  </span>
                  <span className={record.coins >= 0 ? 'positive' : 'negative'}>
                    <strong>
                      {record.coins >= 0 ? '+' : ''}
                      {formatNumber(record.coins)}
                    </strong>
                    <small>
                      {record.gems ? `+${record.gems} ${t('宝石')}` : t('金币')}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="side-rail">
          <section className="section">
            <SectionHeader
              title={t('账号安全')}
              description={t('账号安全由 App 管理')}
            />
            <div className="security-list card">
              {profileSecurity.map((item, index) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => openSecurity(item)}
                  aria-label={t('{label}，{status}', {
                    label: t(item.label),
                    status: t(item.status === '管理' ? '查看' : item.status),
                  })}
                >
                  <span className="list-icon">
                    <Icon
                      name={
                        index === 0 ? 'phone' : index === 1 ? 'shield' : 'lock'
                      }
                    />
                  </span>
                  <span>
                    <strong>{t(item.label)}</strong>
                    <small>{t(item.value)}</small>
                  </span>
                  <span>
                    {t(item.status === '管理' ? '查看' : item.status)}{' '}
                    <Icon name="chevronRight" />
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="section">
            <SectionHeader
              title={t('设置')}
              description={t('按你的习惯设置游戏体验')}
            />
            <div className="settings-list card">
              {[
                ['sound', '音效', 'gamepad'],
                ['vibration', '震动反馈', 'bolt'],
                ['autoplay', '自动旋转', 'refresh'],
              ].map(([key, label, icon]) => (
                <button
                  type="button"
                  key={key}
                  role="switch"
                  aria-checked={settings[key]}
                  onClick={() => toggleSetting(key, label)}
                >
                  <span className="list-icon">
                    <Icon name={icon} />
                  </span>
                  <span>
                    <strong>{t(label)}</strong>
                    <small>{t(settings[key] ? '已开启' : '已关闭')}</small>
                  </span>
                  <span
                    className={`switch ${settings[key] ? 'is-on' : ''}`}
                    aria-hidden="true"
                  >
                    <i />
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={openLanguage}
                aria-label={t('语言')}
              >
                <span className="list-icon">
                  <Icon name="globe" />
                </span>
                <span>
                  <strong>{t('语言')}</strong>
                  <small>{t(locale === 'en' ? '英文' : '简体中文')}</small>
                </span>
                <Icon name="chevronRight" />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
