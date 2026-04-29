import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadLobbyProto } from './proto/index.js'

// 页面打开时加载 lobby.proto
loadLobbyProto()
    .then(() => {
        console.log('[App] Proto loaded, rendering app...');
    })
    .catch(err => {
        console.error('[App] Failed to load proto:', err);
    });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
