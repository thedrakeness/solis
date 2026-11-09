import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { PhoneOnly, useLargeScreen } from './components/PhoneOnly'

// Tablets and computers get a note to use a phone, and never load the app
function Root() {
  return useLargeScreen() ? <PhoneOnly /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
