import { useState } from 'react';
import { FaArrowLeft, FaGift, FaCalendarAlt, FaCog, FaUserFriends, FaCopy, FaCheck } from 'react-icons/fa';
import './Activities.css';

// Sub-components for each activity type
const WeekendParty = ({ t }) => (
  <div className="activity-detail-content weekend-party">
    <div className="activity-header">
      <FaGift className="activity-icon" />
      <h2>{t.weekendTitle}</h2>
    </div>
    <div className="activity-body">
      <p className="highlight-text">{t.weekendRule}</p>
      <div className="timer-badge">02:15:30</div>
      <div className="event-list">
        <div className="event-item">
            <div className="event-icon">💎</div>
            <div className="event-info">
                <h4>{t.event1}</h4>
                <p>{t.event1Desc}</p>
            </div>
        </div>
        <div className="event-item">
            <div className="event-icon">📅</div>
            <div className="event-info">
                <h4>{t.event2}</h4>
                <p>{t.event2Desc}</p>
            </div>
        </div>
      </div>
      <button className="action-btn glow-effect">{t.rechargeNow}</button>
    </div>
  </div>
);

const DailyCheckin = ({ t }) => {
  const [checkedDays, setCheckedDays] = useState([true, true, false, false, false, false, false]);
  
  return (
    <div className="activity-detail-content daily-checkin">
      <h2>{t.checkinTitle}</h2>
      <div className="checkin-grid">
        {checkedDays.map((checked, i) => (
          <div key={i} className={`checkin-day ${checked ? 'checked' : ''} ${i === 6 ? 'day-7' : ''}`}>
            <div className="day-label">{t.checkinDay.replace('{day}', i + 1)}</div>
            <div className="reward-icon">
                {i === 6 ? <FaGift /> : '💰'}
            </div>
            {checked && <div className="check-mark"><FaCheck /></div>}
          </div>
        ))}
      </div>
      <div className="gift-pack-list">
        <div className="gift-pack">
            <div className="pack-icon">🎁</div>
            <div className="pack-info">
                <h4>{t.giftPack1}</h4>
                <p>{t.giftPack1Desc}</p>
            </div>
            <button className="pack-btn">Claim</button>
        </div>
      </div>
      <button className="action-btn" disabled={checkedDays[2]}>{checkedDays[2] ? t.claimed : t.claim}</button>
    </div>
  );
};

const LuckyWheel = ({ t }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    const newRotation = rotation + 1800 + Math.random() * 360; // 5+ spins
    setRotation(newRotation);
    setTimeout(() => setSpinning(false), 5000);
  };

  return (
    <div className="activity-detail-content lucky-wheel">
      <div className="wheel-container">
        <div className="wheel-pointer">▼</div>
        <div className="wheel" style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none' }}>
            {/* Simple CSS sections representation */}
            {[...Array(8)].map((_, i) => (
                <div key={i} className="wheel-section" style={{ transform: `rotate(${i * 45}deg)` }}>
                    <span className="prize-text">{i % 2 === 0 ? '💰' : '🎁'}</span>
                </div>
            ))}
        </div>
        <div className="wheel-center" onClick={spin}>
            {t.spinWheel}
        </div>
      </div>
      <div className="prizes-list">
        <h3>{t.luckyWheelDesc}</h3>
      </div>
    </div>
  );
};

const InviteFriends = ({ t }) => {
  const [copied, setCopied] = useState(false);
  const inviteCode = "ABC123XY";

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="activity-detail-content invite-friends">
      <h2>{t.inviteTitle}</h2>
      <div className="invite-card">
        <p>{t.inviteRule}</p>
        <div className="code-box">
            <span>{t.myCode}:</span>
            <strong className="code-text">{inviteCode}</strong>
            <button onClick={handleCopy} className="copy-btn">
                {copied ? <FaCheck /> : <FaCopy />} {t.copy}
            </button>
        </div>
      </div>
      <div className="referrals-section">
        <h3>{t.referrals} (0)</h3>
        <div className="empty-state">{t.inviteFriendsDesc}</div>
      </div>
      <button className="action-btn share-btn">{t.inviteFriends}</button>
    </div>
  );
};

const ActivityDetailView = ({ t, activityId, onBack }) => {
    const renderContent = () => {
        switch(activityId) {
            case 'weekendParty': return <WeekendParty t={t} />;
            case 'dailyCheckin': return <DailyCheckin t={t} />;
            case 'luckyWheel': return <LuckyWheel t={t} />;
            case 'inviteFriends': return <InviteFriends t={t} />;
            default: return <div>Not Found</div>;
        }
    };

    return (
        <div className="activity-detail-view">
            <div className="nav-header">
                <button onClick={onBack} className="back-btn">
                    <FaArrowLeft /> {t.back}
                </button>
            </div>
            {renderContent()}
        </div>
    );
};

export default ActivityDetailView;
