import { useState } from 'react'
import { games } from '../data.js'
import { GameArtwork, SectionHeader } from '../ui.jsx'
import { Icon } from '../icons.jsx'
import { useLocale } from '../useLocale.js'
import { useH5 } from '../h5/useH5.js'
import '../styles/latestWins.css'

// Static preview data mirrors the shape of the eventual recent-wins feed.
const latestWins = [
  { id: 'win-001', name: 'NovaRay', avatar: 'N', color: 'violet', minutes: 1, gameId: 'golden-pharaoh', coins: 268800, friends: 12 },
  { id: 'win-002', name: 'MintCat', avatar: 'M', color: 'coral', minutes: 3, gameId: 'fruit-party', coins: 98600, friends: 8 },
  { id: 'win-003', name: 'BlueFin', avatar: 'B', color: 'blue', minutes: 5, gameId: 'fish-hunter', coins: 65200, friends: 5 },
  { id: 'win-004', name: 'CloudNine', avatar: 'C', color: 'gold', minutes: 8, gameId: 'bubble-pop', coins: 42900, friends: 3 },
  { id: 'win-005', name: 'DiceMomo', avatar: 'D', color: 'green', minutes: 11, gameId: 'dice-merge', coins: 18600, friends: 4 },
  { id: 'win-006', name: 'OceanPilot', avatar: 'O', color: 'cyan', minutes: 14, gameId: 'golden-pharaoh', coins: 12480, friends: 2 },
]

function formatCoins(value) {
  return value.toLocaleString('en-US')
}

export default function LatestWins({ openModal, toast }) {
  const { t } = useLocale()
  const { openGame } = useH5()
  const [showAll, setShowAll] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [records, setRecords] = useState(latestWins)
  const visibleRecords = showAll ? records : records.slice(0, 5)

  const openWin = (record) => {
    const game = games.find((item) => item.id === record.gameId)
    if (!game) return
    if (game.status === 'ready') {
      openGame(game)
      return
    }
    openModal?.({
      title: t(game.name),
      subtitle: t('游戏暂不可用'),
      body: <p>{t('该游戏当前无法进入，请稍后再试。')}</p>,
      confirmLabel: t('知道了'),
      cancelLabel: null,
    })
  }

  const refresh = () => {
    if (refreshing) return
    setRefreshing(true)
    window.setTimeout(() => {
      setRecords((current) => [...current.slice(1), current[0]])
      setRefreshing(false)
      toast?.(t('中奖记录已更新'))
    }, 420)
  }

  const listContent = (() => {
    if (refreshing) {
      return (
        <div className="latest-wins-loading" role="status">
          <span>{t('加载中')}</span>
          <i /><i /><i />
        </div>
      )
    }
    if (!records.length) {
      return (
        <div className="latest-wins-empty">
          <Icon name="gift" />
          <strong>{t('暂时没有最新中奖')}</strong>
          <p>{t('有新的中奖记录后，会显示在这里。')}</p>
        </div>
      )
    }
    return visibleRecords.map((record) => {
      const game = games.find((item) => item.id === record.gameId)
      return (
        <article className="latest-win-card" key={record.id}>
          <span className={`latest-win-avatar avatar-${record.color}`} aria-hidden="true">{record.avatar}</span>
          <div className="latest-win-main">
            <div className="latest-win-author">
              <strong>{record.name}</strong>
              <time>{t('{minutes} 分钟前', { minutes: record.minutes })}</time>
            </div>
            <p>{t('玩 {game} 并赢了', { game: t(game?.name ?? record.gameId) })} <b>🪙 {formatCoins(record.coins)}</b></p>
            <button className="latest-win-game" type="button" onClick={() => openWin(record)} aria-label={t('打开 {game}', { game: t(game?.name ?? record.gameId) })}>
              <GameArtwork game={game ?? games[0]} compact />
              <span>
                <strong>{t(game?.name ?? record.gameId)}</strong>
                <small><Icon name="users" /> {t('{count} 位好友在玩', { count: record.friends })}</small>
              </span>
              <Icon name="chevronRight" />
            </button>
          </div>
          <button className="latest-win-play btn btn-secondary" type="button" onClick={() => openWin(record)} aria-label={t('玩 {game}', { game: t(game?.name ?? record.gameId) })}>{t('我也要玩')}</button>
        </article>
      )
    })
  })()

  const showAllModal = () => {
    if (!openModal) {
      setShowAll(true)
      return
    }
    openModal({
      title: t('最新中奖'),
      subtitle: t('最近的中奖记录'),
      body: <div className="latest-wins-modal-list">{records.map((record) => {
        const game = games.find((item) => item.id === record.gameId)
        return <p key={record.id}><strong>{record.name}</strong><span>{t(game?.name ?? record.gameId)}</span><b>🪙 {formatCoins(record.coins)}</b></p>
      })}</div>,
      confirmLabel: t('关闭'),
      cancelLabel: null,
    })
  }

  return (
    <section className="section latest-wins" id="latest-wins" aria-labelledby="latest-wins-title">
      <SectionHeader
        title={t('最新中奖')}
        titleId="latest-wins-title"
        description={t('看看大家刚刚赢了什么')}
        action={<button className="icon-btn latest-wins-refresh" type="button" onClick={refresh} disabled={refreshing} aria-label={t('刷新中奖记录')}><Icon name="refresh" /></button>}
      />
      <div className={`latest-wins-list ${refreshing ? 'is-refreshing' : ''}`} aria-live="polite" aria-busy={refreshing}>
        {listContent}
      </div>
      {records.length > 5 && <button className="latest-wins-more text-action" type="button" onClick={showAllModal}>{t('查看全部中奖记录')} <Icon name="chevronRight" /></button>}
    </section>
  )
}
