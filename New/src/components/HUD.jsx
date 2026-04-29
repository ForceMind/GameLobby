import './HUD.css';
import { FaGift, FaGem } from 'react-icons/fa';

const HUD = ({ onGiftClick, onEventClick, t }) => {
  return (
    <>
      <div className="hud-left">
        <button className="hud-btn" onClick={onGiftClick}>
          <div className="icon-container gift-glow">
            <FaGift />
          </div>
          <span>{t.gift}</span>
        </button>
      </div>
      
      <div className="hud-right">
        <button className="hud-btn" onClick={onEventClick}>
          <div className="icon-container event-glow">
            <FaGem />
          </div>
          <span>{t.rechargeEvent}</span>
        </button>
      </div>
    </>
  );
};

export default HUD;
