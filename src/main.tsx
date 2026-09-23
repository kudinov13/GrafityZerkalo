import { Component, StrictMode } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    document.documentElement.classList.remove('app-ready')
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

const revealFallback = () => {
  if (!document.getElementById('root')?.childElementCount) {
    document.documentElement.classList.remove('app-ready')
  }
}

window.addEventListener('error', revealFallback)
window.addEventListener('unhandledrejection', revealFallback)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
