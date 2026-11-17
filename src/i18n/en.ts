import landing from './messages/landing'
import pricing from './messages/pricing'
import auth from './messages/auth'
import onboarding from './messages/onboarding'
import checkout from './messages/checkout'
import console from './messages/console'
import billing from './messages/billing'
import account from './messages/account'
import team from './messages/team'
import notifications from './messages/notifications'
import support from './messages/support'
import settings from './messages/settings'
import errors from './messages/errors'
import legal from './messages/legal'

export const en: Record<string, string> = {
  'landing.title': 'Welcome',
  'pricing.title': 'Pricing',
  'auth.login': 'Log in',
  'errors.notFound': 'Page not found',
  'common.loading': 'Loading...',
  'hello': 'Hello {name}',
  ...landing,
  ...pricing,
  ...auth,
  ...onboarding,
  ...checkout,
  ...console,
  ...billing,
  ...account,
  ...team,
  ...notifications,
  ...support,
  ...settings,
  ...errors,
  ...legal,
}
