import { useMemo } from 'react'
import { Icon } from '../icons.jsx'
import { useLocale } from '../useLocale.js'
import { useH5 } from '../h5/useH5.js'
import '../styles/winnerFeed.css'

const winnerUpdates = [
  { name: 'NovaRay', game: 'Golden Pharaoh', coins: '+268,800' },
  { name: 'MintCat', game: 'Fruit Party', coins: '+98,600' },
  { name: 'NovaPlayer', game: 'Fish Hunter', coins: '+12,480' },
  { name: 'BlueFin', game: 'Bubble Pop', coins: '+65,200' },
]

export default function WinnerFeed({ privacy, href }) {
  const { t } = useLocale()
  const { account } = useH5()
  const visibleUpdates = useMemo(
    () => winnerUpdates.filter((item) => item.name !== account.name || privacy.allowSendWins),
    [account.name, privacy.allowSendWins],
  )

  if (!privacy.receiveWinNotifications || !visibleUpdates.length) return null
  return (
    <aside className="winner-danmaku" aria-label={t('全局获胜动态')}>
      <div className="winner-danmaku-track" aria-live="polite">
        {visibleUpdates.map((update, itemIndex) => (
          <span
            className="winner-danmaku-item"
            key={`${update.name}-${update.game}`}
            style={{ '--danmaku-delay': `${itemIndex * 3.2}s` }}
          >
            <strong>{t(update.name)}</strong>
            <span>{t('在 {game} 赢得', { game: t(update.game) })}</span>
            <b>{update.coins} {t('金币')}</b>
          </span>
        ))}
      </div>
      <div className="winner-danmaku-toolbar">
        <span className="winner-danmaku-label"><Icon name="trophy" />{t('获胜动态')}</span>
        <span className="winner-danmaku-audience"><Icon name="users" />{t(privacy.shareRecentGames ? '好友可见' : '仅自己可见')}</span>
        <a className="winner-danmaku-settings" href={href('profile.html#settings')}>{t('隐私设置')} <Icon name="chevronRight" /></a>
      </div>
    </aside>
  )
}
