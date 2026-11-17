import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createSaasApp, loadDataAdapter } from './index'

await loadDataAdapter()
const { App } = createSaasApp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
