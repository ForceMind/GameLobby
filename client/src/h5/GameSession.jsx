import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../icons.jsx'
import GameIllustration from '../GameIllustration.jsx'
import { useLocale } from '../useLocale.js'
import { liveRooms } from '../data.js'
import { loadingProgress } from './model.js'
import { openLiveRoom } from './liveRoomBridge.js'
import '../styles/liveEntry.css'

const reelSymbols = ['gem', 'coin', 'star', 'jackpot', 'bolt']

export default function GameSession({ game, onClose }) {
  const { t, locale } = useLocale()
  const liveRoom = liveRooms.find(
    (room) =>
      (room.gameId === game.id || room.game === game.id) &&
      (room.status ?? 'live') === 'live',
  )
  const [phase, setPhase] = useState('loading')
  const [progress, setProgress] = useState(0)
  const [rounds, setRounds] = useState(0)
  const [score, setScore] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState(['gem', 'star', 'coin'])
  const [clearedBubbles, setClearedBubbles] = useState([])
  const [liveRoomState, setLiveRoomState] = useState('idle')
  const backRef = useRef(null)
  const closeRef = useRef(null)
  const playTimer = useRef(null)
  const playLock = useRef(false)
  const slotGame = game.category.includes('slots')

  useEffect(() => {
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches
      ? 700
      : 2200
    const start = performance.now()
    const interval = window.setInterval(
      () => setProgress(loadingProgress(performance.now() - start, duration)),
      70,
    )
    const finish = window.setTimeout(() => {
      window.clearInterval(interval)
      setProgress(100)
      setPhase('playing')
    }, duration)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(finish)
      window.clearTimeout(playTimer.current)
    }
  }, [])

  useEffect(() => {
    const target = phase === 'loading' ? backRef.current : closeRef.current
    target?.focus()
  }, [phase])

  useEffect(() => {
    const keydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key === 'Tab') {
        const controls = Array.from(
          document.querySelectorAll('.game-session button:not([disabled])'),
        )
        const first = controls[0]
        const last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [onClose])

  const spin = () => {
    if (playLock.current) return
    playLock.current = true
    setSpinning(true)
    playTimer.current = window.setTimeout(
      () => {
        setReels(
          [0, 1, 2].map(
            (offset) => reelSymbols[(rounds + offset) % reelSymbols.length],
          ),
        )
        setRounds((value) => value + 1)
        setScore((value) => value + 120)
        setSpinning(false)
        playLock.current = false
      },
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 650,
    )
  }

  const popBubble = (index) => {
    if (clearedBubbles.includes(index)) return
    setClearedBubbles((current) => [...current, index])
    setScore((value) => value + 20)
  }

  const findLiveRoom = async () => {
    if (!liveRoom || liveRoomState === 'opening') return
    setLiveRoomState('opening')
    const result = await openLiveRoom({
      roomId: liveRoom.id,
      gameId: liveRoom.gameId ?? game.id,
      entry: 'game_detail',
      mode: new URLSearchParams(window.location.search).get('mode') ?? 'full',
      lang: locale,
    })
    setLiveRoomState(result?.status === 'failed' ? 'failed' : 'opened')
  }

  return createPortal(
    <section
      className={`game-session game-theme-${game.id}`}
      role="dialog"
      aria-modal="true"
      aria-label={t('游戏：{name}', { name: game.name })}
      data-game-phase={phase}
    >
      <div className="game-session-glow" aria-hidden="true" />
      {phase === 'loading' ? (
        <>
          <button
            ref={backRef}
            className="game-loading-back"
            type="button"
            onClick={onClose}
            aria-label={t('返回大厅')}
          >
            <Icon name="chevronLeft" />
            Lobby
          </button>
          <div className="game-loading-content">
            <div className={`game-loading-art game-art-${game.id}`}>
              <GameIllustration id={game.id} />
            </div>
            <span className="game-kicker">JOYLOOP GAMES</span>
            <h1>{game.name}</h1>
            <p>{t('正在加载游戏')}</p>
            <div
              className="game-loading-progress"
              role="progressbar"
              aria-label={t('游戏加载进度')}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={progress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <strong className="game-loading-percent">{progress}%</strong>
          </div>
        </>
      ) : (
        <>
          <button
            ref={closeRef}
            className="game-close"
            type="button"
            onClick={onClose}
            aria-label={t('关闭游戏')}
          >
            <Icon name="close" />
          </button>
          <div className="game-play-heading">
            <span className="game-kicker">JOYLOOP GAMES</span>
            <h1>{game.name}</h1>
            <button
              className="game-live-room-action"
              type="button"
              onClick={findLiveRoom}
              disabled={!liveRoom || liveRoomState === 'opening'}
              aria-describedby="game-live-room-status"
            >
              <span className="live-dot" aria-hidden="true" />
              {t(liveRoomState === 'opening' ? '正在进入房间' : '找房间一起玩')}
              {!liveRoom && <small>{t('暂无匹配房间')}</small>}
            </button>
            <span className="sr-only" id="game-live-room-status" role="status" aria-live="polite">
              {liveRoomState === 'failed' ? t('进入房间失败，请稍后再试') : liveRoomState === 'opened' ? t('已打开直播间预览') : ''}
            </span>
          </div>
          <div className="game-scoreboard">
            <span>
              {t('得分')}
              <strong>{score.toLocaleString('en-US')}</strong>
            </span>
            {slotGame && (
              <span>
                {t('局数')}
                <strong>{rounds}</strong>
              </span>
            )}
          </div>
          {slotGame ? (
            <div
              className={`game-reels ${spinning ? 'is-spinning' : ''}`}
              aria-label={t('游戏转轴')}
            >
              {reels.map((symbol, index) => (
                <div className="game-reel" key={index}>
                  <Icon name={symbol} />
                </div>
              ))}
            </div>
          ) : (
            <div className="game-bubble-board" aria-label={t('游戏区域')}>
              {Array.from({ length: 12 }, (_, index) => (
                <button
                  className={`play-bubble bubble-${index % 4} ${clearedBubbles.includes(index) ? 'is-cleared' : ''}`}
                  key={index}
                  type="button"
                  disabled={clearedBubbles.includes(index)}
                  aria-label={t('点击气泡 {number}', { number: index + 1 })}
                  onClick={() => popBubble(index)}
                >
                  <span />
                </button>
              ))}
            </div>
          )}
          <div className="game-play-actions">
            {slotGame ? (
              <button
                className="game-play-button"
                type="button"
                disabled={spinning}
                onClick={spin}
              >
                <Icon name="play" />
                {t(spinning ? '旋转中' : '开始旋转')}
              </button>
            ) : (
              <button
                className="game-play-button"
                type="button"
                onClick={() => {
                  setClearedBubbles([])
                  setScore(0)
                }}
              >
                <Icon name="refresh" />
                {t('再来一局')}
              </button>
            )}
            <p role="status" aria-live="polite">
              {t(slotGame ? '好运，就在下一转。' : '点击气泡，挑战更高分。')}
            </p>
          </div>
        </>
      )}
    </section>,
    document.body,
  )
}
