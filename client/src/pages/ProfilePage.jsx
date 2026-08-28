import { useState } from 'react'
import { Icon } from '../icons.jsx'
import {
  achievements,
  balances,
  profile,
  profileSecurity,
  profileStats,
  recentRecords,
} from '../data.js'
import { Progress, SectionHeader } from '../ui.jsx'
import { formatNumber } from '../format.js'
import { useLocale } from '../useLocale.js'
import { isValidNickname } from '../demoModel.js'

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

export default function ProfilePage({ openModal, toast }) {
  const { t, locale, setLocale } = useLocale()
  const [settings, setSettings] = useState({
    sound: true,
    vibration: false,
    autoplay: false,
  })
  const [displayName, setDisplayName] = useState(profile.name)
  const [signedIn, setSignedIn] = useState(true)
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
      toast(t('昵称已更新（仅本地演示）'))
      openModal(null)
    }
    openModal({
      title: t('编辑资料'),
      subtitle: t('当前变更只保存在本页'),
      body: <ProfileEditor initialName={displayName} onSave={save} />,
      confirmLabel: t('关闭'),
      cancelLabel: null,
    })
  }
  const openRecords = () =>
    openModal({
      title: t('最近战绩详情'),
      subtitle: t('以下为本页全部演示记录。'),
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
      subtitle: t('只读演示：不会修改密码或绑定信息。'),
      body: (
        <div className="detail-list">
          <div>
            <strong>{t(item.label)}</strong>
            <span>{t(item.value)}</span>
            <b>{t(item.status)}</b>
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
        <div className="avatar" aria-hidden="true">
          {signedIn ? profile.avatar : '?'}
        </div>
        <div className="profile-copy">
          <span className="pill">
            {signedIn
              ? t('等级 {level}', { level: profile.level })
              : t('访客模式')}
          </span>
          <h2>{signedIn ? displayName : t('访客模式')}</h2>
          <p>
            {signedIn
              ? t('Joyloop ID · {id}', { id: profile.id })
              : t('当前未登录，资料与资产仅为演示内容。')}
          </p>
        </div>
        <div className="profile-actions">
          {signedIn ? (
            <>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={openEditor}
              >
                {t('编辑资料')}
              </button>
              <button
                className="btn btn-ghost danger-text"
                type="button"
                onClick={() =>
                  openModal({
                    title: t('退出当前账号？'),
                    subtitle: t('静态演示不会清除任何登录状态'),
                    body: (
                      <p>
                        {t('正式版本需要在退出前处理未结算游戏与本地缓存。')}
                      </p>
                    ),
                    confirmLabel: t('演示退出'),
                    onConfirm: () => {
                      setSignedIn(false)
                      toast(t('已完成退出流程演示'))
                    },
                  })
                }
              >
                {t('退出登录')}
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setSignedIn(true)
                toast(t('已恢复演示账号'))
              }}
            >
              {t('恢复演示账号')}
            </button>
          )}
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
              description={t('静态演示余额，不代表真实账户资产')}
            />
            <div className="asset-overview">
              <article className="card">
                <span className="asset-symbol coin">
                  <Icon name="coin" />
                </span>
                <div>
                  <span>{t('金币')}</span>
                  <strong>{balances.coinsLabel}</strong>
                  <p>{t('可用于开放的游戏与赛事')}</p>
                </div>
              </article>
              <article className="card">
                <span className="asset-symbol gem">
                  <Icon name="gem" />
                </span>
                <div>
                  <span>{t('宝石')}</span>
                  <strong>{balances.gemsLabel}</strong>
                  <p>{t('可用于指定赛事与活动')}</p>
                </div>
              </article>
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
              description={t('仅展示最近五条演示记录')}
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
              description={t('关键操作需二次确认')}
            />
            <div className="security-list card">
              {profileSecurity.map((item, index) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => openSecurity(item)}
                  aria-label={t('{label}，{status}', {
                    label: t(item.label),
                    status: t(item.status),
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
                    {t(item.status)} <Icon name="chevronRight" />
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="section">
            <SectionHeader
              title={t('设置')}
              description={t('当前变更只保存在本页')}
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
