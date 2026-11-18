import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type * as T from './types'
import { db, delay, uid, now, scenario, saveSessionUser } from './fixtures'

// generic list loader with refresh
function useAsync<V>(fn: () => V, init: V) {
  const [data, setData] = useState<V>(init)
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => { setData(await delay(fn())); setLoading(false) }, [fn])
  // Deliberate sync with an external system (the fixture store): initial load + reload when fn changes.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, refresh }
}
const planFn = () => db.plans
const subFn = () => db.subscription
const instFn = () => db.instances.filter((i) => i.status !== 'removed')
const bkFn = () => db.backups
const invFn = () => db.invoices
const pmFn = () => db.paymentMethods
const useFn = () => db.usage
const sesFn = () => db.sessions
const tokFn = () => db.tokens
const memFn = () => db.members
const invtFn = () => db.invites
const notFn = () => db.notifications
const tkFn = () => db.tickets

// shared auth store so every useAuth() consumer (RequireAuth, layouts, Logout) sees the same state
let authState: { user: T.User | null; loading: boolean } = { user: db.user, loading: false }
const authListeners = new Set<() => void>()
const setAuth = (user: T.User | null) => { db.user = user; saveSessionUser(user); authState = { user, loading: false }; authListeners.forEach((l) => l()) }
const subscribeAuth = (l: () => void) => { authListeners.add(l); return () => { authListeners.delete(l) } }
const getAuth = () => authState
const authActions = {
  async login(email: string, _password: string) { await delay(0); setAuth({ id: 'u1', email, name: email.split('@')[0], emailVerified: true, onboarded: true }) },
  async signup(input: { name: string; email: string; password: string; inviteToken?: string }) {
    await delay(0)
    if (scenario === 'invite_only' && !input.inviteToken) throw Object.assign(new Error('Invite required'), { code: 'invite_required' })
    setAuth({ id: 'u1', email: input.email, name: input.name, emailVerified: false, onboarded: false }) },
  async logout() { await delay(0); setAuth(null) },
  async forgotPassword(_email: string) { await delay(true) },
  async resetPassword(_token: string, _password: string) { await delay(true) },
  async resendVerification() { await delay(0) },
  async verifyEmail(_token: string) { await delay(0); setAuth(db.user ? { ...db.user, emailVerified: true } : null) },
}
export function useAuth() {
  const { user, loading } = useSyncExternalStore(subscribeAuth, getAuth, getAuth)
  return { user, loading, ...authActions }
}
export function usePlans() { const { data, loading } = useAsync(planFn, [] as T.Plan[]); return { plans: data, loading } }
export function useSubscription() {
  const { data, loading, refresh } = useAsync(subFn, db.subscription)
  return { subscription: data, loading, async changePlan(planId: string) { db.subscription.planId = planId; await refresh() }, async cancel() { db.subscription.status = 'canceled'; await refresh() } }
}
/** Recipe signup schema as onboarding fields. Fixtures have none; the saaskit adapter reads it from the templates endpoint. */
export function useSignupFields(): T.OnboardingField[] { return [] }
/** Public site domain for workspace addresses. Fixtures have none (the site config value is the fallback). */
export function useSiteDomain(): string | null { return null }
/** Fixture mode: signup is always open. */
export function usePublicConfig(): T.PublicConfig { return { publicSignup: true, signupMode: 'open', loaded: true } }
/** Fixture availability: everything is free except 'taken' and 'demo'. */
export function useSlugAvailability(slug: string): { data?: T.SlugCheck; isFetching: boolean } {
  const [data, setData] = useState<T.SlugCheck | undefined>()
  useEffect(() => {
    if (!slug) return
    const id = setTimeout(() => {
      const taken = slug === 'taken' || slug === 'demo'
      setData({ slug, available: !taken, reason: taken ? 'taken' : null, message: taken ? 'That address is taken.' : '', suggestion: taken ? `${slug}-2` : null })
    }, 250)
    return () => clearTimeout(id)
  }, [slug])
  return { data: slug ? data : undefined, isFetching: !!slug && data?.slug !== slug }
}
export function useCheckout() {
  return {
    async start(planId: string, _opts?: { slug?: string; recipeFields?: Record<string, string> }): Promise<T.CheckoutStart> {
      await delay(0)
      const id = uid('i'); const jobId = uid('job')
      db.instances.push({ id, name: `workspace-${id.split('_')[1]}`, url: `https://workspace-${id.split('_')[1]}.example.com`, status: 'provisioning', planId, createdAt: now() })
      db.jobs[jobId] = { id: jobId, status: 'running', progress: 0, step: 'queued', instanceId: id }
      return { sessionId: uid('cs'), planId, jobId, url: `/provisioning/${jobId}` }
    },
    async payInPage(_s: T.CheckoutStart): Promise<{ tenant?: string }> { throw new Error('In-page payment is not available in fixture mode') },
  }
}
export function useInstances() {
  const { data, loading, refresh } = useAsync(instFn, [] as T.Instance[])
  return {
    instances: data, loading, refresh, error: false,
    async get(id: string) { return delay(db.instances.find((i) => i.id === id) ?? null) },
    async create(input: { name: string; planId: string }) {
      const id = uid('i'); const jobId = uid('job')
      db.instances.push({ id, name: input.name, url: `https://${input.name}.example.com`, status: 'provisioning', planId: input.planId, createdAt: now() })
      db.jobs[jobId] = { id: jobId, status: 'running', progress: 0, step: 'queued', instanceId: id }
      await refresh(); return { id, jobId }
    },
    async duplicate(id: string) { const s = db.instances.find((i) => i.id === id); if (s) db.instances.push({ ...s, id: uid('i'), name: `${s.name}-copy`, createdAt: now() }); await refresh() },
    async remove(id: string, _confirmSlug?: string) { const s = db.instances.find((i) => i.id === id); if (s) { s.status = 'pending_removal'; s.pendingApproval = true } await refresh() },
    async approveRemoval(id: string) { const s = db.instances.find((i) => i.id === id); if (s) { s.status = 'removed'; s.pendingApproval = false } await refresh() },
    async cancelRemoval(id: string) { const s = db.instances.find((i) => i.id === id); if (s) { s.status = 'running'; s.pendingApproval = false } await refresh() },
  }
}
export function useProvisioningJob(jobId: string) {
  const [job, setJob] = useState<T.Job | null>(null)
  useEffect(() => {
    const steps = ['queued', 'creating site', 'installing apps', 'done']
    const tick = setInterval(() => {
      const j = db.jobs[jobId]; if (!j) return
      if (j.status === 'running' && scenario === 'provision_failed' && j.progress >= 68) { j.status = 'failed'; j.step = 'installing apps' }
      else if (j.status === 'running') {
        j.progress = Math.min(100, j.progress + 34); j.step = steps[Math.min(3, Math.floor(j.progress / 34))]
        if (j.progress >= 100) { j.status = 'success'; const i = db.instances.find((x) => x.id === j.instanceId); if (i) i.status = 'running' }
      }
      setJob({ ...j })
    }, 700)
    return () => clearInterval(tick)
  }, [jobId])
  return { job }
}
const humanize = (n: string) => { const x = n.replace(/[_-]+/g, ' ').trim(); return x.charAt(0).toUpperCase() + x.slice(1) }
/** Resolves a tenant slug / instance id / job id to provisioning progress. */
export function useProvisioning(ref: string): T.ProvisioningState {
  const inst = db.instances.find((i) => i.name === ref || i.id === ref)
  const jobId = db.jobs[ref] ? ref : Object.values(db.jobs).find((j) => inst && j.instanceId === inst.id)?.id ?? ref
  const { job } = useProvisioningJob(jobId)
  const names = ['queued', 'creating site', 'installing apps', 'done']
  if (!job) return { loading: false, status: 'waiting', progress: 0, steps: names.map((name) => ({ name, label: humanize(name), state: 'upcoming' as const })) }
  const cur = Math.max(0, names.indexOf(job.step))
  const status = job.status === 'success' ? 'active' : job.status === 'failed' ? 'failed' : 'provisioning'
  const steps = names.map((name, i) => ({ name, label: humanize(name), state: (status === 'active' || i < cur ? 'done' : i === cur ? (status === 'failed' ? 'failed' : 'current') : 'upcoming') as T.ProvisioningStep['state'] }))
  const target = db.instances.find((i) => i.id === job.instanceId)
  return { loading: false, status, progress: job.progress, steps, url: status === 'active' ? target?.url : undefined, error: status === 'failed' ? 'We could not finish setting up your workspace. Please retry, or contact support if it keeps happening.' : null }
}
export function useBackups(instanceId?: string) {
  const { data, loading, refresh } = useAsync(bkFn, [] as T.Backup[])
  return {
    backups: instanceId ? data.filter((b) => b.instanceId === instanceId) : data, loading, error: false,
    async create(iid: string) { db.backups.push({ id: uid('b'), instanceId: iid, createdAt: now(), sizeMb: 100, sizeBytes: 104857600, kind: 'manual', status: 'ready' }); await refresh() },
    async restore(_iid: string, _backupId: string) { return delay({ approvalRequest: uid('apr'), status: 'pending_approval' as const }) },
    async download(_iid: string, _backupId: string) { /* no file in fixture mode (capability backupDownload is false) */ },
  }
}
export function useInvoices() {
  const { data, loading } = useAsync(invFn, [] as T.Invoice[])
  return { invoices: data, loading, get: (id: string) => data.find((i) => i.id === id) ?? null }
}
export function usePaymentMethods() {
  const { data, loading } = useAsync(pmFn, [] as T.PaymentMethod[])
  return { methods: data, loading, portalUrl: '#billing-portal', async openPortal() { return delay({ url: '#billing-portal' }) } }
}
export function useUsage() { const { data, loading } = useAsync(useFn, [] as T.UsageMetric[]); return { metrics: data, loading } }
export function useSessions() {
  const { data, loading, refresh } = useAsync(sesFn, [] as T.Session[])
  return { sessions: data, loading, async revoke(id: string) { db.sessions = db.sessions.filter((s) => s.id !== id); await refresh() } }
}
export function useApiTokens() {
  const { data, loading, refresh } = useAsync(tokFn, [] as T.ApiToken[])
  return {
    tokens: data, loading,
    async create(name: string) { const t = { id: uid('tok'), name, prefix: 'sk_', createdAt: now(), secret: `sk_${uid('s')}` }; db.tokens.push({ ...t, secret: undefined }); await refresh(); return t },
    async revoke(id: string) { db.tokens = db.tokens.filter((t) => t.id !== id); await refresh() },
  }
}
export function useTeam() {
  const m = useAsync(memFn, [] as T.Member[]); const i = useAsync(invtFn, [] as T.Invite[])
  return {
    members: m.data, invites: i.data, loading: m.loading, ready: true,
    roles: ['owner', 'admin', 'member'] as T.Role[],
    async invite(email: string, role: T.Role) { db.invites.push({ id: uid('inv'), email, role, sentAt: now() }); await i.refresh() },
    async revokeInvite(id: string) { db.invites = db.invites.filter((x) => x.id !== id); await i.refresh() },
    async setRole(id: string, role: T.Role) { const x = db.members.find((y) => y.id === id); if (x) x.role = role; await m.refresh() },
    async removeMember(id: string) { db.members = db.members.filter((y) => y.id !== id); await m.refresh() },
  }
}
export function useNotifications() {
  const { data, loading, refresh } = useAsync(notFn, [] as T.Notification[])
  return { notifications: data, unread: data.filter((n) => !n.read).length, loading, async markRead(id: string) { const n = db.notifications.find((x) => x.id === id); if (n) n.read = true; await refresh() }, async markAllRead() { db.notifications.forEach((n) => (n.read = true)); await refresh() } }
}
export function useTickets() {
  const { data, loading, refresh } = useAsync(tkFn, [] as T.Ticket[])
  return {
    tickets: data, loading, get: (id: string) => data.find((t) => t.id === id) ?? null,
    async create(subject: string, body: string) { db.tickets.push({ id: uid('t'), subject, status: 'open', createdAt: now(), messages: [{ from: 'you', body, at: now() }] }); await refresh() },
    async close(id: string) { const t = db.tickets.find((x) => x.id === id); if (t) t.status = 'closed'; await refresh() },
    async reply(id: string, body: string) { db.tickets.find((t) => t.id === id)?.messages.push({ from: 'you', body, at: now() }); await refresh() },
  }
}

// --- profile + invoice PDF -------------------------------------------------
export function useUpdateProfile() {
  return {
    async update(input: { name?: string; email?: string }) {
      if (!db.user) throw new Error('not signed in')
      db.user = { ...db.user, ...input }
      return delay(db.user)
    },
    async changePassword(current: string, _next: string) {
      if (current === 'wrong') throw Object.assign(new Error('Invalid current password'), { code: 'invalid_password' })
      await delay(true)
    },
  }
}
/** Fixture invoice PDF: a bundled sample (the demo has no real documents). */
export const invoicePdfUrl = (_invoiceId: string) => '/sample-invoice.pdf'
/** Fixture stand-in for accepting a team invite: resolves after a short delay. */
export function useAcceptInvite(): (token: string) => Promise<void> {
  return async () => { await new Promise((r) => setTimeout(r, 50)) }
}
export function useInvoicePdf(invoiceId: string) { return { url: invoicePdfUrl(invoiceId), loading: false } }

/** Fixture mode demos every feature except real backup downloads (there is no file to serve). */
export function useCapabilities(): T.Capabilities {
  return { sessions: true, notifications: true, usage: true, apiTokens: true, backupDownload: false, cancelDeletion: true, emailVerification: true }
}
