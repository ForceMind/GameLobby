import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'
import LocaleProvider from '../src/LocaleProvider.jsx'
import H5Provider from '../src/h5/H5Provider.jsx'
import NavigationProvider from '../src/NavigationProvider.jsx'
import { useH5 } from '../src/h5/useH5.js'
import { games } from '../src/data.js'
import { gameGate } from '../src/demoModel.js'
import '../src/index.css'

// Dev-only entry, excluded from Vite's release inputs. It calls the public
// provider API without adding test controls or globals to the shipped app.
if (new URLSearchParams(window.location.search).get('host') === 'missing') {
  window.JoyloopHost = { context: { account: { id: 'qa-missing' } } }
}
if (new URLSearchParams(window.location.search).get('gates') === 'all') {
  Object.assign(games[0], { wealthLevel: 5, charmLevel: 3, minBalance: 60000, playLevel: 12, genders: ['female'], familyOnly: true })
}

export function GateControls() {
  const player = useH5()
  const savedOpen = useRef(player.openGame)
  const [context, setContext] = useState('{"account":{"wealthLevel":5},"country":"CN"}')
  const [result, setResult] = useState('idle')
  const [launchRequests, setLaunchRequests] = useState([])
  useEffect(() => {
    const capture = (event) => {
      if (event.detail.payload?.reason === 'game') setLaunchRequests((requests) => [...requests, event.detail.payload.gameId])
    }
    window.addEventListener('joyloop:request', capture)
    return () => window.removeEventListener('joyloop:request', capture)
  }, [])
  const dispatch = (detail) => window.dispatchEvent(new CustomEvent('joyloop:context', { detail }))
  const direct = (id) => setResult(savedOpen.current({ id, status: 'ready', wealthLevel: 0, familyOnly: false }) ? 'started' : 'blocked')
  return <aside aria-label="Acceptance controls" style={{ position: 'fixed', zIndex: 10000, left: 8, top: 8, width: 290, padding: 12, background: '#fff', color: '#182235', fontSize: 13, border: '1px solid #ddd', maxHeight: '95vh', overflow: 'auto' }}>
    <strong>Development acceptance fixture</strong>
    <label style={{ display: 'block' }}>Host context JSON<textarea value={context} onChange={(event) => setContext(event.target.value)} style={{ width: '100%', height: 100 }} /></label>
    <button onClick={() => { try { dispatch(JSON.parse(context)); setResult('context applied') } catch (error) { setResult(error.message) } }}>Apply context</button>
    <button onClick={() => direct('golden-pharaoh')}>Direct Golden launch</button>
    <button onClick={() => direct('fish-hunter')}>Direct Fish launch</button>
    <button onClick={() => { dispatch({ account: { familyId: null } }); direct('fish-hunter') }}>Remove family and launch immediately</button>
    <button onClick={() => { player.closeGame(); setResult('closed') }}>Close session</button>
    <pre data-testid="gate-probe" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify({ result, account: player.account, coins: player.wallet.coins, country: player.country, game: player.game?.id ?? null, launchRequests, gate: gameGate(games[0], player) }, null, 2)}</pre>
  </aside>
}

createRoot(document.getElementById('root')).render(
  <NavigationProvider><LocaleProvider><H5Provider><GateControls /><App /></H5Provider></LocaleProvider></NavigationProvider>,
)
