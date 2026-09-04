import { useLocale } from '../useLocale.js'
import { useH5 } from './useH5.js'
import WalletLedger from '../components/WalletLedger.jsx'
import { formatNumber } from '../format.js'
import { Icon } from '../icons.jsx'
import './wallet.css'

export default function WalletDetails({ currency }) {
  const { t } = useLocale()
  const { wallet } = useH5()
  const isCoins = currency === 'coins'
  return (
    <div className="wallet-details">
      <div className={'wallet-summary ' + (isCoins ? 'is-coins' : 'is-gems')}>
        <span className={'asset-symbol ' + (isCoins ? 'coin' : 'gem')}>
          <Icon name={isCoins ? 'coin' : 'gem'} />
        </span>
        <span>
          <small>{t('ledger.balance')}</small>
          <strong>{formatNumber(wallet[currency])}</strong>
        </span>
      </div>
      <h3>{t('ledger.recentChanges')}</h3>
      <WalletLedger currency={currency} key={currency} />
    </div>
  )
}
