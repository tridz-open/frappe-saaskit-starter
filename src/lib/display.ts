// Customer-facing display helpers: dates, money, friendly labels, error references.
// Pages import from here so raw backend values (ISO strings, enums, error text) never reach customers.
import { t } from '../i18n'

const LOCALE = 'en-IN'

/** "17 Nov 2026". Returns '' for empty/unparseable input (never the raw value). */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d).replace(/\bSept\b/, 'Sep')
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${formatDate(d)}, ${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(d)}`
}

/** Currency with 2 decimals only when the amount has a fractional part. */
export function money(amount: number, currency: string, locale = LOCALE): string {
  const whole = Number.isInteger(amount)
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(amount)
}

const STATUS = ['active', 'trialing', 'past_due', 'suspended', 'canceled', 'paid', 'open', 'draft', 'void', 'uncollectible', 'failed', 'pending', 'refunded']
/** Friendly label for a raw status enum; unknown values become "Unknown" rather than leaking the enum. */
export function statusLabel(status: string): string {
  return STATUS.includes(status) ? t(`billing.statusLabel.${status}`) : t('billing.statusLabel.unknown')
}

export function intervalLabel(interval: string): string {
  return interval === 'year' || interval === 'month' ? t(`billing.interval.${interval}`) : interval
}

/** Short reference a customer can quote to support: last 6 characters of an id, uppercased. */
export function shortRef(id: string | null | undefined): string {
  const s = String(id ?? '').replace(/[^a-zA-Z0-9]/g, '')
  return s ? s.slice(-6).toUpperCase() : ''
}

/** Logs the raw error for developers and returns the translated friendly message key's text. Never returns e.message. */
export function friendlyError(e: unknown, key: string, vars?: Record<string, string | number>): string {
  if (typeof console !== 'undefined') console.error('[saas-starter]', e)
  return t(key, vars)
}

/** Base-36 timestamp used as a fallback support reference (kept out of components so render stays pure). */
export const nowRef = (): string => Date.now().toString(36)
export const currentYear = (): number => new Date().getFullYear()
