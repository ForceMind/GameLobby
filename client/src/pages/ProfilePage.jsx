import { useState } from 'react'
import { Icon } from '../icons.jsx'
import { SectionHeader } from '../ui.jsx'
import { useLocale } from '../useLocale.js'
import { useH5 } from '../h5/useH5.js'
import '../h5/profileCompact.css'
import WalletLedger from '../components/WalletLedger.jsx'
import ProfileSettings from '../components/ProfileSettings.jsx'

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
export default function ProfilePage({
  openModal,
  toast,
  openWallet,
}) {
  const { t } = useLocale()
  const { account: profile, wallet: balances } = useH5()
  const copyProfileId = async () => {
    try {
      await navigator.clipboard.writeText(profile.id)
      toast(t('profile.idCopied'))
    } catch {
      toast(t('profile.idCopyFallback'))
    }
  }
  const openSettings = () => openModal({ title: t('settings.title'), body: <ProfileSettings />, confirmLabel: t('common.close'), cancelLabel: null })
  const openLedger = () => openModal({ title: t('ledger.allRecords'), body: <WalletLedger full />, confirmLabel: t('common.close'), cancelLabel: null })
  // "全部战绩" is the same transaction history, pre-filtered to game entries.
  const openRecords = () =>
    openModal({
      title: t('ledger.recentGames'),
      subtitle: t('ledger.recentGamesHint'),
      body: <WalletLedger full kind="game" emptyLabel="ledger.noGames" />,
      confirmLabel: t('common.close'),
      cancelLabel: null,
    })
  return (
    <div className="profile-page compact-profile">
      <section className="page-head">
        <p className="eyebrow">{t('PROFILE · ACCOUNT')}</p>
        <h1>{t('profile.title')}</h1>
        <p>{t('profile.subtitle')}</p>
      </section>
      <section className="profile-hero card">
        <AccountAvatar
          key={`${profile.id}:${profile.avatar}`}
          account={profile}
        />
        <div className="profile-copy">
          <span className="pill">{t('profile.accountType')}</span>
          <h2>{profile.name}</h2>
          <button
            className="profile-id-action"
            type="button"
            onClick={copyProfileId}
          >
            {t('profile.idLabel', { id: profile.id })} <Icon name="copy" />
          </button>
        </div>
        <div className="profile-hero-summary">
          <strong>{t('profile.level', { level: profile.level })}</strong>
          <span>{t('profile.accountType')}</span>
        </div>
        <button type="button" className="btn btn-secondary profile-settings-entry" onClick={openSettings} aria-haspopup="dialog"><Icon name="gear" />{t('settings.title')}</button>
      </section>
      <div className="page-layout profile-layout profile-layout-lite">
        <div>
          <section className="section">
            <SectionHeader
              title={t('profile.balancesTitle')}
              description={t('profile.balancesHint')}
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
                  <span>{t('ledger.coins')}</span>
                  <strong>{balances.coinsLabel}</strong>
                  <p>{t('profile.coinsUsage')}</p>
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
                  <span>{t('ledger.gems')}</span>
                  <strong>{balances.gemsLabel}</strong>
                  <p>{t('profile.gemsUsage')}</p>
                </div>
              </button>
            </div>
          </section>
          <WalletLedger
            kind="reward"
            title="ledger.rewardsTitle"
            description="ledger.rewardsHint"
            emptyLabel="ledger.noRewards"
            onShowAll={openLedger}
          />
          <section className="section profile-records" id="records">
            <WalletLedger
              kind="game"
              title="ledger.recentGames"
              description="ledger.recentGamesHint"
              emptyLabel="ledger.noGames"
              actionLabel="ledger.allGames"
              onShowAll={openRecords}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
