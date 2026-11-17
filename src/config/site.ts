import type { OnboardingField, Plan } from '../data/types'

export const site = {
  name: 'Your SaaS',
  logo: 'Your SaaS', // text or image URL
  tagline: 'Short tagline goes here',
  supportEmail: 'support@example.com', // placeholder: the Support page hides it until a real address is set
  currency: 'USD',
  defaultLocale: 'en',
  nav: [
    { label: 'Pricing', to: '/pricing' },
    { label: 'Log in', to: '/login' },
    { label: 'Sign up', to: '/signup' },
  ],
  consoleNav: [
    { label: 'Workspaces', to: '/console' },
    { label: 'Backups', to: '/console/backups' },
    { label: 'Billing', to: '/console/billing' },
    { label: 'Team', to: '/console/team' },
    { label: 'Account', to: '/console/account' },
    { label: 'Help and support', to: '/console/support' },
  ],
  /** Extra sidebar group for operators: shown only to users holding `adminRole`. */
  adminNav: [] as { label: string; to: string }[],
  adminRole: 'SaaS Admin',
  plans: [
    { id: 'starter', name: 'Starter', price: 10, interval: 'month' as const, features: ['1 instance', 'Daily backups'] },
    { id: 'pro', name: 'Pro', price: 30, interval: 'month' as const, features: ['5 instances', 'Daily backups', 'Priority support'] },
    { id: 'business', name: 'Business', price: 90, interval: 'month' as const, features: ['Unlimited instances', 'Hourly backups', 'SLA'] },
   ] as Plan[],
  labels: {
    skip: 'Skip to content',
    loading: 'Loading...',
    mainNav: 'Main',
    consoleNav: 'Main menu',
    notifications: 'Notifications',
    accountMenu: 'Account menu',
    logout: 'Log out',
    account: 'Account',
    billing: 'Billing',
    billingAlert: 'Subscription {status}.',
    toasts: 'Notifications',
  },
  legalLinks: [
    { label: 'Terms', to: '/terms' },
    { label: 'Privacy', to: '/privacy' },
  ],
  /** Domain that workspace addresses live under (`<slug>.<siteDomain>`). The API public config `site_domain` wins; null shows no suffix. */
  siteDomain: null as string | null,
  /** Per-site copy overrides keyed by i18n message key, e.g. { 'onboarding.urlLabel': 'Your Acme address' }. */
  copy: {} as Record<string, string>,
  /** Extra onboarding fields sent to checkout as `recipe_fields`. Empty = read from the API template signup_schema. */
  onboardingFields: [] as OnboardingField[],
}
export type Site = typeof site
export type SiteConfig = Partial<Omit<Site, 'labels'>> & { labels?: Partial<Site['labels']> }
