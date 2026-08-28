import { useLocale } from '../useLocale.js'
import { useH5 } from './useH5.js'
import { recentRecords } from '../data.js'
import { formatNumber } from '../format.js'
import { Icon } from '../icons.jsx'
import './wallet.css'

export default function WalletDetails({ currency }) {
  const { t } = useLocale()
  const { wallet } = useH5()
  const isCoins = currency === 'coins'
  const records = recentRecords.filter((record) => record[currency] !== 0)
  return (
    <div className="wallet-details">
      <div className={'wallet-summary ' + (isCoins ? 'is-coins' : 'is-gems')}>
        <span className={'asset-symbol ' + (isCoins ? 'coin' : 'gem')}>
          <Icon name={isCoins ? 'coin' : 'gem'} />
        </span>
        <span>
          <small>{t('当前余额')}</small>
          <strong>{formatNumber(wallet[currency])}</strong>
        </span>
      </div>
      <h3>{t('最近变动')}</h3>
      <ul className="wallet-history">
        {records.map((record) => (
          <li key={record.id}>
            <span>
              <strong>{record.game}</strong>
              <small>{t(record.time)}</small>
            </span>
            <b className={record[currency] > 0 ? 'positive' : 'negative'}>
              {record[currency] > 0 ? '+' : ''}
              {formatNumber(record[currency])}
            </b>
          </li>
        ))}
      </ul>
    </div>
  )
}
