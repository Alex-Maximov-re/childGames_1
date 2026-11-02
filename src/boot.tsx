import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import '@fontsource/nunito/cyrillic-600.css'
import '@fontsource/nunito/cyrillic-700.css'
import '@fontsource/nunito/cyrillic-800.css'
import '@fontsource/shantell-sans/latin-700.css'
import '@fontsource/shantell-sans/cyrillic-700.css'
import { App } from './App'
import { PlatformProvider } from './platform'
import { SaveProvider } from './save'
import { setStorageScope } from './storage'
import type { Platform } from './types'
import './styles.css'

export function boot(platform: Platform): void {
  setStorageScope(platform)
  const root = document.getElementById('root')
  if (!root) throw new Error('Root element is missing')
  createRoot(root).render(
    <StrictMode>
      <PlatformProvider platform={platform}>
        <SaveProvider>
          <App />
        </SaveProvider>
      </PlatformProvider>
    </StrictMode>,
  )
}
