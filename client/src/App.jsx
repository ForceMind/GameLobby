import { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import GameGrid from './components/GameGrid';
import HUD from './components/HUD';
import translations from './i18n';
import './App.css';
import { FaCog, FaArrowLeft, FaGift, FaUserFriends, FaVideo, FaCalendarAlt, FaTrophy, FaChevronRight } from 'react-icons/fa';
import ActivityDetailView from './components/Activities';
import VIPSystem from './components/VIPSystem';
import Achievements from './components/Achievements';

// Placeholder Views for new tabs
const ActivityView = ({ t, onActivityClick }) => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2 style={{ color: '#ffd700', marginBottom: '15px' }}>{t.activities}</h2>
    <div onClick={() => onActivityClick('weekendParty')} style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer' }}>
      <h3>{t.weekendParty}</h3>
      <p style={{ fontSize: '0.8rem', color: '#ccc' }}>{t.weekendPartyDesc}</p>
    </div>
    <div onClick={() => onActivityClick('dailyCheckin')} style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer' }}>
      <h3>{t.dailyCheckin}</h3>
      <p style={{ fontSize: '0.8rem', color: '#ccc' }}>{t.dailyCheckinDesc}</p>
    </div>
    <div onClick={() => onActivityClick('luckyWheel')} style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer' }}>
      <h3>{t.luckyWheel}</h3>
      <p style={{ fontSize: '0.8rem', color: '#ccc' }}>{t.luckyWheelDesc}</p>
    </div>
    <div onClick={() => onActivityClick('inviteFriends')} style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px', cursor: 'pointer' }}>
      <h3>{t.inviteFriends}</h3>
      <p style={{ fontSize: '0.8rem', color: '#ccc' }}>{t.inviteFriendsDesc}</p>
    </div>
  </div>
);

const TaskView = ({ t }) => (
  <div style={{ padding: '20px' }}>
    <h2 style={{ color: '#ffd700', marginBottom: '15px', textAlign: 'center' }}>{t.dailyTasks}</h2>
    <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
      {[
        { title: t.spin, progress: '20/50', status: t.inProgress, rewardValue: '100' },
        { title: t.win, progress: '1000/1000', status: t.completed, rewardValue: '500' },
        { title: t.playRounds, progress: '5/10', status: t.inProgress, rewardValue: '200' },
        { title: t.rechargeTask, progress: '0/100', status: t.notStarted, rewardValue: '1000' },
        { title: t.watchAds, progress: '1/5', status: t.inProgress, rewardValue: '50' },
        { title: t.invite3, progress: '0/3', status: t.notStarted, rewardValue: '5000' },
        { title: t.share, progress: '0/1', status: t.notStarted, rewardValue: '100' }
      ].map((task, i) => (
        <li key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>{task.title}</div>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>{task.progress}</div>
            <div style={{ fontSize: '0.8rem', color: '#ffd700', marginTop: '4px' }}>
                <FaGift style={{ marginRight: '4px' }} />
                {t.reward}: {task.rewardValue} {t.coin}
            </div>
          </div>
          <span style={{ 
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: '0.8rem',
            background: task.status === t.completed ? '#00e676' : '#444',
            color: task.status === t.completed ? '#000' : '#fff'
          }}>
            {task.status}
          </span>
        </li>
      ))}
    </ul>

    <h2 style={{ color: '#ff9100', marginBottom: '15px', textAlign: 'center', marginTop: '30px' }}>{t.ladderTasks}</h2>
    <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
            { title: t.ladderBronze, progress: '5000/5000', status: t.completed, rewardValue: '10k' },
            { title: t.ladderSilver, progress: '12000/50000', status: t.inProgress, rewardValue: '100k' },
            { title: t.ladderGold, progress: '0/500000', status: t.notStarted, rewardValue: '1M' }
        ].map((task, i) => (
            <li key={i} style={{ 
                background: 'linear-gradient(90deg, rgba(255,215,0,0.1), rgba(0,0,0,0.3))', 
                padding: '15px', 
                borderRadius: '8px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderLeft: '4px solid #ffd700'
            }}>
                <div>
                    <div style={{ fontWeight: 'bold', color: '#ffd700' }}>{task.title}</div>
                    <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', margin: '5px 0' }}>{task.progress}</div>
                    <div style={{ fontSize: '0.8rem', color: '#fff', marginTop: '4px' }}>
                        <FaTrophy style={{ marginRight: '4px', color: '#ffd700' }} />
                        {t.reward}: {task.rewardValue} {t.coin}
                    </div>
                </div>
                <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    background: task.status === t.completed ? '#00e676' : '#444',
                    color: task.status === t.completed ? '#000' : '#fff'
                }}>
                    {task.status}
                </span>
            </li>
        ))}
    </ul>
  </div>
);

const ProfileView = ({ t, onSettingsClick, onVIPClick, onAchievementsClick }) => (
  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', position: 'relative' }}>
    <button 
        onClick={onSettingsClick}
        style={{
            position: 'absolute',
            top: '0',
            right: '10px',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '1.5rem',
            cursor: 'pointer',
            zIndex: 10,
            padding: '10px'
        }}
    >
        <FaCog />
    </button>

    <div style={{ 
      width: '80px', height: '80px', borderRadius: '50%', 
      border: '3px solid #ffd700', overflow: 'hidden' 
    }}>
      <img src="https://ui-avatars.com/api/?name=User&background=random&size=128" alt="User" style={{ width: '100%' }} />
    </div>
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem' }}>Guest_001</h2>
      <div 
        onClick={onVIPClick}
        style={{ 
          background: 'linear-gradient(90deg, #ffd700, #ff8c00)', 
          color: '#000', padding: '5px 15px', borderRadius: '15px',
          fontWeight: 'bold', fontSize: '0.9rem', marginTop: '5px', display: 'inline-block',
          cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        }}
      >
        {t.vip} 2 <FaChevronRight style={{ fontSize: '0.7rem', verticalAlign: 'middle' }} />
      </div>
    </div>
    
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{t.totalWinnings}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffd700' }}>5,000,000</div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{t.playTime}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>12h 30m</div>
      </div>
    </div>

    {/* Achievements Section */}
    <div style={{ width: '100%', marginTop: '5px' }} onClick={onAchievementsClick}>
        <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '15px', 
            borderRadius: '10px', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
        }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaTrophy style={{ color: '#ffd700', marginRight: '10px', fontSize: '1.2rem' }} />
                <div>
                    <div style={{ fontWeight: 'bold' }}>{t.achievements}</div>
                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '2px', display: 'flex', gap: '5px' }}>
                        <span style={{ color: '#00e676' }}>✔ {t.ach_firstWin}</span>
                        <span style={{ color: '#00e676' }}>✔ {t.ach_social}</span>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#aaa', fontSize: '0.9rem' }}>
                <span style={{ marginRight: '5px' }}>2/4</span>
                <FaChevronRight />
            </div>
        </div>
    </div>

    {/* Game Records Section */}
    <div style={{ width: '100%', marginTop: '10px' }}>
        <h3 style={{ color: '#ffd700', marginBottom: '10px', fontSize: '1rem' }}>{t.gameRecords}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
                { game: 'Shark Hunter', profit: 1200 },
                { game: '777 Deluxe', profit: -200 },
                { game: 'Dragon Era', profit: 5000 }
            ].map((record, i) => (
                <div key={i} style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '10px', 
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem'
                }}>
                    <div>
                        <div style={{ fontWeight: 'bold', color: '#fff' }}>{record.game}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: record.profit > 0 ? '#00e676' : '#ff3d00', fontWeight: 'bold' }}>
                            {record.profit > 0 ? '+' : ''}{record.profit}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  </div>
);

const SettingsView = ({ t, onLangChange, currentLang, jackpotNotif, toggleJackpotNotif, onBack }) => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', marginRight: '10px' }}>
              <FaArrowLeft />
          </button>
          <h2 style={{ color: '#ffd700', margin: 0 }}>{t.settings}</h2>
      </div>
      
      {/* Language Selector */}
      <div style={{ width: '100%', marginBottom: '20px' }}>
        <h3 style={{ color: '#ffd700', marginBottom: '10px', fontSize: '1rem' }}>{t.language}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
          {['en', 'zh', 'es', 'pt', 'fil'].map(lang => (
            <button 
              key={lang}
              onClick={() => onLangChange(lang)}
              style={{
                padding: '8px 0',
                background: currentLang === lang ? '#ffd700' : 'rgba(255,255,255,0.1)',
                color: currentLang === lang ? '#000' : '#fff',
                border: '1px solid #ffd700',
                borderRadius: '5px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Jackpot Notification Toggle */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px' }}>
        <span style={{ color: '#fff', fontSize: '1rem' }}>{t.jackpotNotification}</span>
        <button 
            onClick={toggleJackpotNotif}
            style={{
                background: jackpotNotif ? '#00e676' : '#444',
                color: jackpotNotif ? '#000' : '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold'
            }}
        >
            {jackpotNotif ? t.on : t.off}
        </button>
      </div>
    </div>
);

// Simple Modal Component
const Modal = ({ isOpen, onClose, title, content, t }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(3px)'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: 'linear-gradient(180deg, #311b92, #4527a0)',
        padding: '25px', borderRadius: '15px', width: '90%', maxWidth: '400px',
        textAlign: 'center', border: '2px solid #ffd700', position: 'relative',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <span onClick={onClose} style={{
          position: 'absolute', top: '10px', right: '15px', fontSize: '1.5rem',
          cursor: 'pointer', color: '#aaa'
        }}>&times;</span>
        <h2 style={{ marginBottom: '15px', color: '#ffd700' }}>{title}</h2>
        <div style={{ marginBottom: '20px', lineHeight: '1.5' }}>{content}</div>
        <button onClick={onClose} style={{
          background: 'linear-gradient(180deg, #ff9100, #ff6d00)',
          border: 'none', padding: '10px 30px', borderRadius: '20px',
          color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
        }}>{t.ok}</button>
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('lobby');
  const [balance, setBalance] = useState(177553);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', content: '' });
  const [lang, setLang] = useState('en');
  const [jackpotNotif, setJackpotNotif] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  const t = translations[lang];

  const showModal = (title, content) => {
    setModalState({ isOpen: true, title, content });
  };

  const handleRecharge = () => {
    const amount = 10000;
    setBalance(prev => prev + amount);
    showModal(t.rechargeSuccess, t.rechargeMsg.replace('{amount}', amount.toLocaleString()));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'lobby':
        return (
          <>
            <HUD 
              t={t}
              onGiftClick={() => showModal(t.limitedGift, <div>{t.giftMsg}</div>)}
              onEventClick={() => showModal(t.rechargeRebate, <div>{t.rebateMsg}</div>)}
            />
            <GameGrid />
          </>
        );
      case 'activities': 
        if (selectedActivity) {
            return <ActivityDetailView t={t} activityId={selectedActivity} onBack={() => setSelectedActivity(null)} />;
        }
        return <ActivityView t={t} onActivityClick={setSelectedActivity} />;
      case 'tasks': return <TaskView t={t} />;
      case 'profile': return <ProfileView t={t} onSettingsClick={() => setActiveTab('settings')} onVIPClick={() => setActiveTab('vip')} onAchievementsClick={() => setActiveTab('achievements')} />;
      case 'settings': return <SettingsView t={t} onLangChange={setLang} currentLang={lang} jackpotNotif={jackpotNotif} toggleJackpotNotif={() => setJackpotNotif(!jackpotNotif)} onBack={() => setActiveTab('profile')} />;
      case 'vip': return <VIPSystem t={t} onBack={() => setActiveTab('profile')} />;
      case 'achievements': return <Achievements t={t} onBack={() => setActiveTab('profile')} />;
      default: return <GameGrid />;
    }
  };

  return (
    <div className="app-container">
      <Header balance={balance} onRecharge={handleRecharge} t={t} />
      
      {renderContent()}

      {activeTab !== 'settings' && activeTab !== 'vip' && activeTab !== 'achievements' && !selectedActivity && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} t={t} />}
      
      <Modal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        content={modalState.content}
        t={t}
      />
    </div>
  );
}

export default App;
