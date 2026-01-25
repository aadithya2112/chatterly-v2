import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ChatterlyWidget {
  constructor() {
    this.init()
  }

  init() {
    // Check if already initialized
    if (document.getElementById('chatterly-widget-container')) return

    // Create container
    const container = document.createElement('div')
    container.id = 'chatterly-widget-container'
    document.body.appendChild(container)

    // Create shadow root for style isolation
    const shadow = container.attachShadow({ mode: 'open' })
    
    // Create mount point inside shadow DOM
    const mountPoint = document.createElement('div')
    mountPoint.id = 'chatterly-root'
    shadow.appendChild(mountPoint)

    // Inject styles manually if needed, or rely on vite-plugin-css-injected-by-js
    // Note: vite-plugin-css-injected-by-js injects into document.head by default.
    // To support Shadow DOM, we might need to manually move styles or use a different approach later.
    // For now, let's render.

    // Get config from script tag
    const scriptTag = document.currentScript || document.querySelector('script[data-widget-id]')
    const widgetId = scriptTag?.getAttribute('data-widget-id')
    const publicKey = scriptTag?.getAttribute('data-public-key')

    if (!widgetId || !publicKey) {
      console.warn('Chatterly Widget: Missing widget-id or public-key')
    }

    createRoot(mountPoint).render(
      <StrictMode>
        <App widgetId={widgetId} publicKey={publicKey} />
      </StrictMode>,
    )
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  new ChatterlyWidget()
}
