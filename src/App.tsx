import { createSaasApp } from './index'

// Default demo app: swap options here (site, theme, routes, slots, data).
const app = createSaasApp()
export const { router, routes } = app
export default app.App
