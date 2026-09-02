import { GameArtwork } from './ui.jsx'
import { useLocale } from './useLocale.js'
import { useH5 } from './h5/useH5.js'
import liteContent from './data/liteContent.json'

export default function useGameDetails(openModal) {
  const { t } = useLocale()
  const { openGame } = useH5()
  return (game) => {
    const ready = game.status === 'ready'
    const details = liteContent.gameDetails?.[game.id] ?? {}
    openModal({ title: game.name, kicker: t('游戏说明'), subtitle: t(game.categoryLabel),
      body: <div className="game-details-modal"><div className="game-details-hero"><GameArtwork game={game} /><div><h3>{game.name}</h3><p>{t(details.descriptionKey ?? '暂无游戏说明')}</p>{!ready && <strong className="game-details-status">{t('游戏暂不可用')}</strong>}</div></div>
        {game.tags?.includes('slots') && <div className="game-details-stats" aria-label={t('Slots 基础参数')}>
          <div><span>{t('中奖率')}</span><strong>{details.winRate ?? '—'}</strong></div><div><span>RTP</span><strong>{details.rtp ?? '—'}</strong></div>
          <div><span>{t('中奖金额范围')}</span><strong>{t(details.winRange ?? '—')}</strong></div><div><span>{t('最大赔率')}</span><strong>{details.maxMultiplier ?? '—'}</strong></div>
        </div>}{!ready && <p className="game-details-hint">{t('请稍后再来，或选择其他游戏。')}</p>}</div>,
      confirmLabel: t(ready ? '开始游戏' : '返回浏览'), cancelLabel: ready ? t('取消') : null,
      onConfirm: ready ? () => openGame(game) : undefined,
    })
  }
}
