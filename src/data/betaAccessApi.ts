// Beta-access admin endpoints. The vendored SDK client (0.1.0-alpha.1) has no `admin.beta_access` methods,
// so this ONE module calls the whitelisted saas_core endpoints directly (cookie auth + CSRF, like the SDK).
// TODO(sdk 0.1.0-alpha.2): replace the body of `betaAccessApi` with `client.admin.betaAccess.*`; nothing else changes.
import type * as T from './types'

const BASE = ((import.meta.env?.VITE_SAAS_API_URL as string | undefined) ?? '').replace(/\/+$/, '')
const root = () => `${BASE}/api/method/saas_core.api.v1.`

export class BetaApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) { super(message || code); this.status = status; this.code = code }
}

type Raw = { message?: unknown; error?: { code?: string; message?: string }; exc_type?: string } | undefined
let csrf: string | undefined
/** Test hook: forget the cached token. */
export const resetCsrf = () => { csrf = undefined }

async function readBody(res: Response): Promise<Raw> {
  const text = await res.text().catch(() => '')
  try { return text ? (JSON.parse(text) as Raw) : undefined } catch { return undefined }
}
async function ensureCsrf() {
  if (csrf) return
  const w = (typeof window !== 'undefined' ? (window as { csrf_token?: string }).csrf_token : undefined)
  if (w && !w.includes('{{')) { csrf = w; return }
  const res = await fetch(`${root()}me`, { credentials: 'include', headers: { Accept: 'application/json' } })
  const b = (await readBody(res)) as { message?: { csrf_token?: string }; csrf_token?: string } | undefined
  csrf = b?.message?.csrf_token ?? b?.csrf_token
}

/** Generic GET/POST against `saas_core.api.v1.<name>` with CSRF on POST (one retry on a stale token). */
export async function call<R>(name: string, method: 'GET' | 'POST', payload?: Record<string, unknown>, retried = false): Promise<R> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (method === 'POST') { await ensureCsrf(); headers['Content-Type'] = 'application/json'; if (csrf) headers['X-Frappe-CSRF-Token'] = csrf }
  let res: Response
  try { res = await fetch(root() + name, { method, headers, credentials: 'include', body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined }) }
  catch { throw new BetaApiError(0, 'network', 'Network error') }
  const b = await readBody(res)
  if (res.ok) return (b && typeof b === 'object' && 'message' in b ? b.message : b) as R
  if (res.status === 403 && method === 'POST' && !retried && !b?.error?.code) { csrf = undefined; return call<R>(name, method, payload, true) }
  throw new BetaApiError(res.status, b?.error?.code ?? 'error', b?.error?.message ?? '')
}

type RawEntry = { pattern: string; kind: 'email' | 'domain'; note: string | null; invited_at: string | null; account_exists: boolean | null; verified: boolean | null; has_tenant: boolean | null }
type RawList = { signup_mode: string; patterns: RawEntry[] }
type RawAdd = { added: string[]; already_listed: string[]; invites_sent: string[]; invites_failed: string[]; skipped_domains: string[] }

export const betaAccessApi = {
  async list(): Promise<{ signupMode: string; entries: T.BetaEntry[] }> {
    const r = await call<RawList>('admin.beta_access.list', 'GET')
    return { signupMode: r.signup_mode, entries: (r.patterns ?? []).map((p) => ({ pattern: p.pattern, kind: p.kind, note: p.note, invitedAt: p.invited_at, accountExists: p.account_exists, verified: p.verified, hasTenant: p.has_tenant })) }
  },
  async add(entries: string[], sendInvite: boolean, note?: string): Promise<T.BetaAddResult> {
    const r = await call<RawAdd>('admin.beta_access.add', 'POST', { entries, send_invite: sendInvite, note: note || undefined })
    return { added: r.added, alreadyListed: r.already_listed, invitesSent: r.invites_sent, invitesFailed: r.invites_failed, skippedDomains: r.skipped_domains }
  },
  remove: (pattern: string) => call<{ removed: string }>('admin.beta_access.remove', 'POST', { pattern }),
  resend: (email: string) => call<{ email: string; sent: boolean }>('admin.beta_access.resend', 'POST', { email }),
}
