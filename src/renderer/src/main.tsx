import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { setupRendererLogger } from './utils/rendererLogger'
import { ErrorBoundary } from './components/layout/ErrorBoundary'

setupRendererLogger();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
