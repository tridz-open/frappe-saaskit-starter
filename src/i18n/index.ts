import { en } from './en'
import { site } from '../config/site'

const dicts: Record<string, Record<string, string>> = { en }

export function t(key: string, vars?: Record<string, string | number>): string {
  const d = dicts[site.defaultLocale] ?? en
  let s = site.copy?.[key] ?? d[key] ?? en[key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}
export function useT() { return t }
