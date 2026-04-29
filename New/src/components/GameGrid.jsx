import './GameGrid.css';
import { 
  FaFish, FaDice, FaDragon, FaRocket, 
  FaLandmark, FaSkullCrossbones, FaHippo, FaBolt 
} from 'react-icons/fa';

const GameGrid = () => {
  const games = [
    { id: 1, title: 'Shark Hunter', icon: <FaFish />, bgClass: 'bg-shark', hot: true },
    { id: 2, title: '777 Deluxe', icon: <FaDice />, bgClass: 'bg-slots', hot: true },
    { id: 3, title: 'Dragon Era', icon: <FaDragon />, bgClass: 'bg-dragon', hot: true },
    { id: 4, title: 'Space Heist', icon: <FaRocket />, bgClass: 'bg-space', hot: false },
    { id: 5, title: 'Pharaoh', icon: <FaLandmark />, bgClass: 'bg-pharaoh', hot: true },
    { id: 6, title: 'Pirates', icon: <FaSkullCrossbones />, bgClass: 'bg-pirate', hot: true },
    { id: 7, title: 'Buffalo', icon: <FaHippo />, bgClass: 'bg-buffalo', hot: true },
    { id: 8, title: 'Fury of Zeus', icon: <FaBolt />, bgClass: 'bg-zeus', hot: false },
  ];

  return (
    <main className="game-lobby">
      <div className="games-grid">
        {games.map((game) => (
          <div key={game.id} className="game-card">
            <div className={`game-image ${game.bgClass}`}>
              {game.hot && <span className="hot-badge">HOT</span>}
              <div className="game-icon">{game.icon}</div>
            </div>
            <div className="game-title">{game.title}</div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default GameGrid;
