import { FaArrowLeft, FaTrophy, FaMedal, FaLock } from 'react-icons/fa';

const Achievements = ({ t, onBack }) => {
  const achievements = [
    { id: 'firstWin', icon: <FaTrophy />, progress: 1, total: 1, completed: true },
    { id: 'highRoller', icon: <FaMedal />, progress: 45000, total: 100000, completed: false },
    { id: 'social', icon: <FaUserFriends />, progress: 3, total: 10, completed: false },
    { id: 'checkin', icon: <FaCalendarAlt />, progress: 12, total: 30, completed: false },
  ];

  // Helper icons import
  // Re-using icons from react-icons/fa as placeholders if needed, 
  // but we can map specific icons inside the map loop or passed prop.
  // For simplicity using conditional rendering or generic icons.
  
  return (
    <div style={{ padding: '20px', color: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', marginRight: '10px' }}>
                <FaArrowLeft />
            </button>
            <h2 style={{ color: '#ffd700', margin: 0 }}>{t.achievements}</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
            {achievements.map((ach, i) => (
                <div key={i} style={{ 
                    background: ach.completed ? 'linear-gradient(90deg, rgba(0,230,118,0.1), rgba(0,0,0,0))' : 'rgba(255,255,255,0.05)', 
                    padding: '15px', 
                    borderRadius: '10px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    border: ach.completed ? '1px solid #00e676' : '1px solid transparent'
                }}>
                    <div style={{ 
                        fontSize: '2rem', 
                        color: ach.completed ? '#ffd700' : '#666', 
                        marginRight: '15px',
                        width: '50px',
                        textAlign: 'center'
                    }}>
                        {ach.completed ? ach.icon : <FaLock />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <div style={{ fontWeight: 'bold', color: ach.completed ? '#fff' : '#aaa' }}>{t[`ach_${ach.id}`]}</div>
                            <div style={{ fontSize: '0.8rem', color: ach.completed ? '#00e676' : '#888' }}>
                                {ach.completed ? t.completed : `${ach.progress} / ${ach.total}`}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>{t[`ach_${ach.id}_desc`]}</div>
                        
                        {!ach.completed && (
                            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${(ach.progress / ach.total) * 100}%`, background: '#ffd700', height: '100%' }}></div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

// Missing imports fix
import { FaUserFriends, FaCalendarAlt } from 'react-icons/fa';

export default Achievements;
