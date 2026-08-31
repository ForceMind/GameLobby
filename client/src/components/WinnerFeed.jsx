import { useMemo } from 'react'
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
        {visibleUpdates.slice(0, 4).map((update, itemIndex) => (
          <span
            className="winner-danmaku-item"
            key={`${update.name}-${update.game}`}
            style={{ '--danmaku-row': itemIndex, '--danmaku-delay': `${itemIndex * 2.8}s` }}
          >
            <strong>{t(update.name)}</strong>
            <span>{t('在 {game} 赢得', { game: t(update.game) })}</span>
            <b>{update.coins} {t('金币')}</b>
            <a className="winner-danmaku-play" href={href('games.html')}>{t('我也要玩')}</a>
          </span>
        ))}
      </div>
    </aside>
  )
}
