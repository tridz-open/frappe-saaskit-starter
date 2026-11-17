import type * as T from './types'
import { site } from '../config/site'

export const delay = <V,>(v: V, ms = 150): Promise<V> => new Promise((r) => setTimeout(() => r(structuredClone(v)), ms))
let n = 100
export const uid = (p = 'id') => `${p}_${++n}`
const now = () => new Date().toISOString()

export type Scenario = 'default' | 'invite_only' | 'empty' | 'past_due' | 'provision_failed'
const SCENARIOS: Scenario[] = ['default', 'invite_only', 'empty', 'past_due', 'provision_failed']
const store = (): Storage | null => { try { return window.sessionStorage } catch { return null } }
function readScenario(): Scenario {
  const ok = (v: unknown): v is Scenario => SCENARIOS.includes(v as Scenario)
  try {
    const q = new URLSearchParams(window.location.search)
    const v = q.get('scenario') ?? q.get('fixture')
    if (v) { if (ok(v)) { try { store()?.setItem('saas.fixture.scenario', v) } catch { /* ignore */ } return v } }
  } catch { /* no window */ }
  try { const v = store()?.getItem('saas.fixture.scenario'); if (ok(v)) return v } catch { /* ignore */ }
  const env = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_FIXTURE_SCENARIO
  return ok(env) ? env : 'default'
}
/** Active fixture scenario: ?scenario=|?fixture= (persisted per tab), else VITE_FIXTURE_SCENARIO, else default. */
export const scenario: Scenario = readScenario()

const SESSION_KEY = 'saas.fixture.user'
export function loadSessionUser(): T.User | null {
  try { const raw = store()?.getItem(SESSION_KEY); return raw ? (JSON.parse(raw) as T.User) : null } catch { return null }
}
export function saveSessionUser(u: T.User | null) {
  try { if (u) store()?.setItem(SESSION_KEY, JSON.stringify(u)); else store()?.removeItem(SESSION_KEY) } catch { /* ignore */ }
}

export const db = {
  user: loadSessionUser(),
  plans: site.plans as T.Plan[],
  subscription: { planId: 'pro', status: 'active', renewsAt: '2030-01-01' } as T.Subscription,
  instances: [
    { id: 'i1', name: 'demo', url: 'https://demo.example.com', status: 'running', planId: 'pro', createdAt: '2025-01-01' },
  ] as T.Instance[],
  jobs: {} as Record<string, T.Job>,
  backups: [{ id: 'b1', instanceId: 'i1', createdAt: '2025-01-02', sizeMb: 120, sizeBytes: 125829120, kind: 'automatic', status: 'ready' }] as T.Backup[],
  invoices: [
    { id: 'inv1', number: 'INV-0001', date: '2025-01-01', amount: 30, currency: site.currency, status: 'paid', lines: [{ description: 'Pro plan', amount: 30 }] },
  ] as T.Invoice[],
  paymentMethods: [{ id: 'pm1', brand: 'Visa', last4: '4242', isDefault: true }] as T.PaymentMethod[],
  usage: [
    { key: 'storage', label: 'Storage', used: 2, limit: 10, unit: 'GB' },
    { key: 'users', label: 'Users', used: 3, limit: 10, unit: '' },
  ] as T.UsageMetric[],
  sessions: [{ id: 's1', device: 'Browser', ip: '127.0.0.1', lastActive: now(), current: true }] as T.Session[],
  tokens: [] as T.ApiToken[],
  members: [{ id: 'm1', name: 'Demo User', email: 'demo@example.com', role: 'owner' }, { id: 'm2', name: 'Second Member', email: 'second@example.com', role: 'member' }] as T.Member[],
  invites: [] as T.Invite[],
  notifications: [{ id: 'n1', title: 'Welcome', body: 'Your account is ready.', createdAt: now(), read: false }] as T.Notification[],
  tickets: [{ id: 't1', subject: 'Sample ticket', status: 'open', createdAt: now(), messages: [{ from: 'you', body: 'Hello', at: now() }] }] as T.Ticket[],
}
export { now }

if (scenario === 'empty') {
  db.instances = []; db.backups = []; db.invoices = []; db.tokens = []; db.invites = []
  db.notifications = []; db.tickets = []; db.usage = db.usage.map((u) => ({ ...u, used: 0 }))
  db.members = db.members.slice(0, 1)
}
if (scenario === 'past_due') {
  db.subscription = { ...db.subscription, status: 'past_due' }
  db.instances = db.instances.map((i) => ({ ...i, status: 'past_due' as const }))
  db.invoices = [...db.invoices, { id: 'inv2', number: 'INV-0002', date: '2025-02-01', amount: 30, currency: site.currency, status: 'open', lines: [{ description: 'Pro plan', amount: 30 }] }]
}
