import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { captureTokenFromHash } from './lib/api'
import { normalizeInitialUrl } from './lib/router'
import { applyStoredTheme } from './lib/theme'

applyStoredTheme()
captureTokenFromHash() // must run before the URL is normalized: it reads #token=...
normalizeInitialUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
