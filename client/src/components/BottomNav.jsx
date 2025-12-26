import './BottomNav.css';
import { FaHome, FaCalendarAlt, FaClipboardList, FaUser } from 'react-icons/fa';

const BottomNav = ({ activeTab, onTabChange, t }) => {
  const tabs = [
    { id: 'lobby', label: t.lobby, icon: <FaHome /> },
    { id: 'activities', label: t.activities, icon: <FaCalendarAlt /> },
    { id: 'tasks', label: t.tasks, icon: <FaClipboardList /> },
    { id: 'profile', label: t.profile, icon: <FaUser /> },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
