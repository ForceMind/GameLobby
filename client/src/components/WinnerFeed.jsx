import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from '../useLocale.js'
import { useH5 } from '../h5/useH5.js'
import { games } from '../data.js'
import '../styles/winnerFeed.css'

const winnerUpdates = [
  { name: 'NovaRay', game: 'Golden Pharaoh', gameId: 'golden-pharaoh', coins: '+268,800' },
  { name: 'MintCat', game: 'Fruit Party', gameId: 'fruit-party', coins: '+98,600' },
  { name: 'NovaPlayer', game: 'Fish Hunter', gameId: 'fish-hunter', coins: '+12,480' },
  { name: 'BlueFin', game: 'Bubble Pop', gameId: 'bubble-pop', coins: '+65,200' },
]

const randomBetween = (min, max) => Math.round(min + Math.random() * (max - min))

export default function WinnerFeed({ privacy, onOpenGame }) {
  const { t } = useLocale()
  const { account } = useH5()
  const [rows, setRows] = useState(() => Array.from({ length: 4 }, () => null))
  const queueRef = useRef([])
  const nextIndexRef = useRef(0)
  const sequenceRef = useRef(0)
  const rowTimersRef = useRef(new Map())
  const visibleUpdates = useMemo(
    () => winnerUpdates.filter((item) => item.name !== account.name || privacy.allowSendWins),
    [account.name, privacy.allowSendWins],
  )

  useEffect(() => {
    if (!privacy.receiveWinNotifications || !visibleUpdates.length) return undefined
    let scheduleTimer
    const emit = () => {
      const update = visibleUpdates[nextIndexRef.current % visibleUpdates.length]
      nextIndexRef.current += 1
      const item = { ...update, id: sequenceRef.current += 1, durationMs: randomBetween(8200, 11200) }
      setRows((current) => {
        const next = [...current]
        const emptyRow = next.findIndex((row) => row === null)
        if (emptyRow >= 0) next[emptyRow] = item
        else queueRef.current.push(item)
        return next
      })
      scheduleTimer = window.setTimeout(emit, randomBetween(6800, 10400))
    }
    scheduleTimer = window.setTimeout(emit, randomBetween(1200, 2200))
    return () => window.clearTimeout(scheduleTimer)
  }, [privacy.receiveWinNotifications, visibleUpdates])

  useEffect(() => {
    rows.forEach((row) => {
      if (!row || rowTimersRef.current.has(row.id)) return
      const timer = window.setTimeout(() => {
        rowTimersRef.current.delete(row.id)
        setRows((current) => {
          const rowIndex = current.findIndex((entry) => entry?.id === row.id)
          if (rowIndex < 0) return current
          const next = [...current]
          next[rowIndex] = queueRef.current.shift() ?? null
          return next
        })
      }, row.durationMs)
      rowTimersRef.current.set(row.id, timer)
    })
  }, [rows])

  useEffect(() => () => {
    rowTimersRef.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  if (!privacy.receiveWinNotifications || !visibleUpdates.length) return null
  return (
    <aside className="winner-danmaku" aria-label={t('全局获胜动态')}>
      <div className="winner-danmaku-track" aria-live="polite">
        {rows.map((update, itemIndex) => update && visibleUpdates.some((item) => item.gameId === update.gameId) && (
          <span
            className="winner-danmaku-item"
            key={update.id}
            style={{ '--danmaku-row': itemIndex, '--danmaku-duration': `${update.durationMs}ms` }}
          >
            <strong>{t(update.name)}</strong>
            <span>{t('在 {game} 赢得', { game: t(update.game) })}</span>
            <b>{update.coins} {t('金币')}</b>
            <button className="winner-danmaku-play" type="button" onClick={() => { const game = games.find((item) => item.id === update.gameId); if (game) onOpenGame(game) }}>{t('我也要玩')}</button>
          </span>
        ))}
      </div>
    </aside>
  )
}
