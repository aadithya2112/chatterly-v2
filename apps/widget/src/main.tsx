import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import styles from './index.css?inline'
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

    // Inject styles
    const styleSheet = document.createElement('style')
    styleSheet.textContent = styles
    shadow.appendChild(styleSheet)
    
    // Create mount point inside shadow DOM
    const mountPoint = document.createElement('div')
    mountPoint.id = 'chatterly-root'
    shadow.appendChild(mountPoint)

    // Get config from script tag
    const scriptTag = document.currentScript || document.querySelector('script[data-widget-id]')
    const widgetId = scriptTag?.getAttribute('data-widget-id')
    const publicKey = scriptTag?.getAttribute('data-public-key')
    const apiUrl = scriptTag?.getAttribute('data-api-url')

    if (!widgetId || !publicKey) {
      console.warn('Chatterly Widget: Missing widget-id or public-key')
    }

    createRoot(mountPoint).render(
      <StrictMode>
        <App widgetId={widgetId} publicKey={publicKey} apiUrl={apiUrl} />
      </StrictMode>,
    )
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  new ChatterlyWidget()
}
