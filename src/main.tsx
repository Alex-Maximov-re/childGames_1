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
import { SaveProvider } from './save'
import { App } from './App'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element is missing')

createRoot(root).render(
  <StrictMode>
    <SaveProvider>
      <App />
    </SaveProvider>
  </StrictMode>,
)
