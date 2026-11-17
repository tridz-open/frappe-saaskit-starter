/** Display formatting for the console: dates as "17 Nov 2026", sizes with units, never raw ISO strings. */
const LOCALE = 'en-GB'
const parse = (v: string | number | Date | null | undefined) => { if (v === null || v === undefined || v === '') return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d }

export function formatDay(v: string | number | Date | null | undefined): string {
  const d = parse(v); if (!d) return '—'
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}
export function formatWhen(v: string | number | Date | null | undefined): string {
  const d = parse(v); if (!d) return '—'
  const day = d.toDateString() === new Date().toDateString() ? 'Today' : formatDay(d)
  return `${day}, ${new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit', hour12: true }).format(d)}`
}
/** KB / MB / GB with one decimal. Unknown -> em dash. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !(bytes >= 0)) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let n = bytes / 1024; let i = 0
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(1)} ${units[i]}`
}
export const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

/** Visually hidden but readable by assistive tech (the foundation stylesheet has no .sr-only). */
export const srOnly = { position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 } as const
