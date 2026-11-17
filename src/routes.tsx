import { createBrowserRouter } from 'react-router-dom'
import { publicRoutes } from './routes/public'
import { authRoutes } from './routes/auth'
import { onboardingRoutes } from './routes/onboarding'
import { checkoutRoutes } from './routes/checkout'
import { consoleRoutes } from './routes/console'
import { billingRoutes } from './routes/billing'
import { accountRoutes } from './routes/account'
import { supportRoutes } from './routes/support'
import { miscRoutes } from './routes/misc'

// misc last: contains the catch-all 404.
// billing/account/support routes are children of /console: workers append there via consoleChildren.
export const routes = [
  ...publicRoutes, ...authRoutes, ...onboardingRoutes, ...checkoutRoutes,
  ...consoleRoutes, ...billingRoutes, ...accountRoutes, ...supportRoutes, ...miscRoutes,
]
export const router = createBrowserRouter(routes)
