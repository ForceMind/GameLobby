import { useId, useState } from 'react'
import { useLocale } from '../useLocale.js'
import { Icon } from '../icons.jsx'

export default function ChestLeaderboard({ engagement }) {
  const { t, locale } = useLocale()
  const { chestLeaderboard: data, errors, refresh } = engagement
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const toggle = () => {
    setExpanded(value => !value)
    if (!expanded) refresh('chestLeaderboard')
  }
  return <section className="chest-leaderboard" aria-labelledby={`${id}-title`}>
    <h3 className="chest-leaderboard-heading" id={`${id}-title`}>
      <button className="chest-ranking-switch" type="button" aria-expanded={expanded} aria-controls={`${id}-panel`} onClick={toggle}>
        <span>{t('chest.openingRank')}</span><span className="chest-ranking-arrow" aria-hidden="true"><Icon name="chevronRight" /></span>
      </button>
    </h3>
    <div id={`${id}-panel`} className="chest-ranking-panel" hidden={!expanded}>
      {expanded && <><p className="chest-ranking-scope">{t('chest.rankScope')}</p>
    {errors.chestLeaderboard ? <p role="alert">{t(errors.chestLeaderboard)} <button type="button" className="text-action" onClick={() => refresh('chestLeaderboard')}>{t('common.retry')}</button></p>
      : !data ? <p role="status">{t('common.loading')}</p>
        : !data.entries.length ? <p className="chest-ranking-empty">{t('chest.rankEmpty')}</p>
          : <ol className="chest-leaderboard-list">{data.entries.map(item => <li key={item.id}>
            <span className="chest-rank-number">{item.rank}</span>
            <div><strong title={item.name}>{item.isSelf ? t('chest.rankSelf') : item.name}</strong>
              <span>{t('chest.rankReward', { coins: item.rewardCoins.toLocaleString(locale) })}</span></div>
          </li>)}</ol>}</>}
    </div>
  </section>
}
