import { usePublicConfig } from '../data'
import { useSaas } from '../app/context'
import { useT } from '../i18n'
import type { PublicConfig } from '../data/types'
import type { Site } from '../config/site'

export interface CtaTarget { label: string; to: string; external: boolean }

/** Signup is open only when the server says so. Unknown (loading, failed) is treated as closed, matching the /signup gate. */
export const signupOpen = (cfg: Partial<PublicConfig> | null | undefined): boolean =>
  cfg?.publicSignup === true && cfg.signupMode !== 'closed' && cfg.signupMode !== 'invite'

/** Request-access target: `site.requestAccessUrl` when set (mailto: or URL), else a mailto to the support address. A plan name goes into the mailto subject. */
export function requestAccessHref(site: Pick<Site, 'requestAccessUrl' | 'supportEmail'>, subject: string): string {
  const url = site.requestAccessUrl?.trim()
  if (url) return /^mailto:/i.test(url) && !url.includes('?') ? `${url}?subject=${encodeURIComponent(subject)}` : url
  return `mailto:${site.supportEmail}?subject=${encodeURIComponent(subject)}`
}

/** Signup CTAs that follow the server's signup mode: "Get started" -> /signup when open, else "Request access". */
export function useSignupCta() {
  const { site } = useSaas()
  const t = useT()
  const open = signupOpen(usePublicConfig())
  const access = (plan?: string) => requestAccessHref(site, plan ? t('auth.requestAccessPlan', { plan }) : t('auth.requestAccess'))
  return {
    open,
    /** Primary CTA. `openLabel` is the label used when signup is open. */
    primary(openLabel: string, plan?: string): CtaTarget {
      return open ? { label: openLabel, to: '/signup', external: false } : { label: t('auth.requestAccess'), to: access(plan), external: true }
    },
    /** Pricing plan button: checkout when open, else Request access carrying the plan name. */
    plan(planId: string, planName: string, openLabel: string): CtaTarget {
      return open ? { label: openLabel, to: `/checkout?plan=${encodeURIComponent(planId)}`, external: false } : { label: t('auth.requestAccess'), to: access(planName), external: true }
    },
  }
}
