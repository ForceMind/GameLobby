import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LocaleProvider from './LocaleProvider.jsx'
import H5Provider from './h5/H5Provider.jsx'
import NavigationProvider from './NavigationProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NavigationProvider>
      <LocaleProvider>
        <H5Provider>
          <App />
        </H5Provider>
      </LocaleProvider>
    </NavigationProvider>
  </StrictMode>,
)
