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
          title={t('快捷入口')}
          description={t('奖励、游戏与记录一触即达')}
        />
        <div className="quick-grid">
          {[
            ['bolt', '免费旋转', '今日剩余 3 次', 'events.html#wheel', '新'],
            [
              'jackpot',
              '累积大奖',
              '浏览老虎机',
              'games.html?category=slots#game-catalog',
              null,
            ],
            ['gift', '每日任务', '查看每日进度', 'events.html#tasks', '任务'],
            ['clock', '最近战绩', '查看最近记录', 'profile.html#records', null],
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
        <span>{t('更多内容')}</span>
        <Icon name="chevronRight" />
      </button>
    </div>
  )
}
