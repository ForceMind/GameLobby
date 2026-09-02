import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from '../useLocale.js'
import { useH5 } from '../h5/useH5.js'
import { games } from '../data.js'
import '../styles/winnerFeed.css'

export default function WinnerFeed({ privacy, onPlay, events = [], paused = false }) {
  const { t, locale } = useLocale()
  const { account, mode } = useH5()
  const [rows, setRows] = useState([])
  const [stopped, setStopped] = useState(false)
  const seen = useRef(new Set())
  const rowsRef = useRef(rows)
  useEffect(() => { rowsRef.current = rows }, [rows])
  const filtered = useMemo(() => events.filter(item => item.playerId !== account.id || privacy.allowSendWins), [events, account.id, privacy.allowSendWins])
  useEffect(() => {
    if (!privacy.receiveWinNotifications) {
      events.forEach(item => seen.current.add(item.id))
      while (seen.current.size > 1000) seen.current.delete(seen.current.values().next().value)
      rowsRef.current = []
      const clear = setTimeout(() => setRows([]), 0)
      return () => clearTimeout(clear)
    }
    if (paused || stopped) return undefined
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const emit = () => {
      if (document.hidden || reduced.matches) return
      const previous = rowsRef.current
      const maxRows = mode === 'half' ? 2 : 4
      if (previous.length >= maxRows) return
      const next = filtered.find(item => !seen.current.has(item.id))
      if (!next) return
      seen.current.add(next.id)
      if (seen.current.size > 1000) seen.current.delete(seen.current.values().next().value)
      const lane = Array.from({length: maxRows}, (_, index) => index).find(index => !previous.some(item => item.lane === index))
      const nextRows = [...previous, {...next, lane}]
      rowsRef.current = nextRows
      setRows(nextRows)
    }
    const initial = setTimeout(emit, 1200)
    const interval = setInterval(emit, 7500)
    return () => { clearTimeout(initial); clearInterval(interval) }
  }, [events, filtered, mode, paused, privacy.receiveWinNotifications, stopped])
  if (paused || !privacy.receiveWinNotifications || !filtered.length) return null
  return <aside className={`winner-danmaku ${stopped ? 'is-paused' : ''}`} aria-label={t('全局获胜动态')}>
    <button className="winner-feed-control" onClick={() => setStopped(value => !value)} aria-label={t(stopped ? 'wins.resume' : 'wins.pause')}>{stopped ? '▶' : 'Ⅱ'}</button>
    <div className="winner-danmaku-track">{rows.filter(item => filtered.some(event => event.id === item.id)).map(item => {
      const game = games.find(entry => entry.id === item.gameId)
      return <span className="winner-danmaku-item" key={item.id} style={{'--danmaku-row':item.lane}}
        onAnimationEnd={() => setRows(previous => previous.filter(row => row.id !== item.id))}>
        <strong>{item.name}</strong><span>{t('wins.event',{game:game?.name ?? item.gameId, coins:item.coins.toLocaleString(locale)})}</span>
        <button className="winner-danmaku-play" onClick={() => onPlay(item.gameId)}>{t('wins.play')}</button>
      </span>
    })}</div>
  </aside>
}
