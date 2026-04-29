import { FaArrowLeft, FaCrown, FaGem, FaStar } from 'react-icons/fa';

const VIPSystem = ({ t, onBack }) => {
  const currentLevel = 2;
  const progress = 75; // 75% to next level

  return (
    <div style={{ padding: '20px', color: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', marginRight: '10px' }}>
                <FaArrowLeft />
            </button>
            <h2 style={{ color: '#ffd700', margin: 0 }}>{t.vipPrivileges}</h2>
        </div>

        <div style={{ 
            background: 'linear-gradient(135deg, #1a237e, #311b92)', 
            padding: '20px', 
            borderRadius: '15px',
            border: '2px solid #ffd700',
            textAlign: 'center',
            marginBottom: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}>
            <div style={{ fontSize: '3rem', color: '#ffd700', marginBottom: '10px' }}>
                <FaCrown />
            </div>
            <h1 style={{ margin: '0 0 5px 0' }}>VIP {currentLevel}</h1>
            <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '15px' }}>{t.currentLevel}</div>
            
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${progress}%`, background: '#00e676', height: '100%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '5px', color: '#ccc' }}>
                <span>VIP {currentLevel}</span>
                <span>{progress}/100</span>
                <span>VIP {currentLevel + 1}</span>
            </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
            <h3 style={{ color: '#ffd700', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>{t.benefits}</h3>
            
            {[
                { icon: <FaGem />, title: "Daily Login Bonus", desc: "Get 500 coins daily" },
                { icon: <FaStar />, title: "Rebate Bonus", desc: "1% extra rebate on recharges" },
                { icon: <FaCrown />, title: "Exclusive Avatar", desc: "Unlock special VIP avatars" }
            ].map((benefit, i) => (
                <div key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '15px', 
                    borderRadius: '10px',
                    marginBottom: '10px'
                }}>
                    <div style={{ fontSize: '1.5rem', color: '#ffd700', marginRight: '15px' }}>{benefit.icon}</div>
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{benefit.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{benefit.desc}</div>
                    </div>
                </div>
            ))}

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px', marginTop: '20px', fontSize: '0.9rem', color: '#aaa', lineHeight: '1.5' }}>
                {t.vipRules}
            </div>
        </div>
    </div>
  );
};

export default VIPSystem;
