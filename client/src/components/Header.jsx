import './Header.css';
import { FaCoins, FaSignOutAlt } from 'react-icons/fa';

const Header = ({ balance, onRecharge, t }) => {
  return (
    <header className="header">
      <div className="user-info">
        <div className="avatar">
          <img src="https://ui-avatars.com/api/?name=User&background=random" alt="Avatar" />
        </div>
        <div className="user-details">
          <span className="username">Guest_001</span>
          <div className="vip-badge">{t.vip} 2</div>
        </div>
      </div>
      
      <div className="wallet-info">
        <div className="balance-pill">
          <FaCoins className="coin-icon" />
          <span id="user-balance">{balance.toLocaleString()}</span>
          <button className="btn-buy" onClick={onRecharge}>{t.buy}</button>
        </div>
        <button className="btn-exit"><FaSignOutAlt /></button>
      </div>
    </header>
  );
};

export default Header;
