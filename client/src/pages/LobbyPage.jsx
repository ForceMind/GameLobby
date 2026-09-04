import { Icon } from '../icons.jsx'
import { SectionHeader } from '../ui.jsx'
import { GameCatalog, RecentGames } from '../GameCatalog.jsx'
import { useLocale } from '../useLocale.js'
import { useH5 } from '../h5/useH5.js'
import '../h5/compactLobby.css'
import WinnersPanel from '../components/WinnersPanel.jsx'

export default function LobbyPage({
  openModal,
  toast,
  showFullEntryHint,
  privacySettings = { shareRecentGames: true },
  onPlayWin,
}) {
  const { t, href } = useLocale()
  const { mode } = useH5()
  return (
    <div className="lobby-page compact-lobby">
      {mode !== 'half' && <RecentGames openModal={openModal} toast={toast} recentVisibility={privacySettings.shareRecentGames} />}

      <div className="page-layout lobby-games-row">
        <GameCatalog variant="popular" openModal={openModal} toast={toast} />
        {mode !== 'half' && <aside className="lobby-winners-restored"><WinnersPanel onPlay={onPlayWin} /></aside>}
      </div>


      {mode === 'half' && <RecentGames openModal={openModal} toast={toast} recentVisibility={privacySettings.shareRecentGames} />}
      {mode === 'half' && <button className="winners-compact-entry" onClick={() => openModal({ title: t('wins.title'), body: <WinnersPanel onPlay={onPlayWin} />, confirmLabel: t('common.close'), cancelLabel: null })}>{t('wins.open')} <Icon name="chevronRight" /></button>}
      <section className="section lobby-quick-actions">
        <SectionHeader
          title={t('lobby.quickActionsTitle')}
          description={t('lobby.quickActionsHint')}
        />
        <div className="quick-grid">
          {[
            ['bolt', 'events.wheelPrizeFreeSpin', 'lobby.quickWheelDetail', 'events.html#wheel', 'common.badgeNew'],
            [
              'jackpot',
              'common.jackpot',
              'lobby.quickJackpotDetail',
              'games.html?category=slots#game-catalog',
              null,
            ],
            ['gift', 'events.missionsTitle', 'lobby.quickMissionsDetail', 'events.html#tasks', 'lobby.quickMissionsBadge'],
            ['clock', 'lobby.quickRecordsTitle', 'lobby.quickRecordsDetail', 'profile.html#records', null],
          ].map(([icon, title, detail, destination, badge]) => (
            <a className="quick-card card" href={href(destination)} key={title}>
              <span className="quick-mark">
                <Icon name={icon} />
              </span>
              <span>
                <strong>{t(title)}</strong>
                <small>{t(detail)}</small>
              </span>
              {badge && <span className="pill">{t(badge)}</span>}
            </a>
          ))}
        </div>
      </section>
      <button
        className="compact-fullscreen-entry"
        type="button"
        onClick={showFullEntryHint}
      >
        <span>{t('common.fullEntry')}</span>
        <Icon name="chevronRight" />
      </button>
    </div>
  )
}
