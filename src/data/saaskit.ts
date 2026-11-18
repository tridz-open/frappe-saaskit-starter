// Adapter backed by @frappe-saaskit/react (typed against the saas-kit contract).
// Same hook surface as fixtureHooks. Anything the contract does not provide is either
// fixture-backed (payment methods, usage, sessions, tokens, team, notifications) or a documented no-op / throw.
import { createElement, type ReactNode } from 'react'
import { createClient, type Tenant, type Plan as KPlan, type Invoice as KInvoice, type Job as KJob, type SupportTicket as KTicket } from '@frappe-saaskit/client'
import * as K from '@frappe-saaskit/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type * as T from './types'
import { CheckoutDismissed } from './types'
import { fieldsFromSchema, takeRecipeFields } from './recipeFields'
import { site } from '../config/site'
import { betaAccessApi } from './betaAccessApi'
import { LIVE_CAPABILITIES, toUser, type MeLike } from './liveMapping'

const BASE = (import.meta.env?.VITE_SAAS_API_URL as string | undefined) ?? ''
export const client = createClient({ baseUrl: BASE, auth: { type: 'cookie' } })

export function DataProvider({ children }: { children?: ReactNode }) {
  return createElement(K.SaasProvider, { client }, children)
}

const slugify = (n: string) => n.toLowerCase().replace(/[^a-z0-9-]/g, '-')

const tenantStatus = (s: Tenant['status']): T.InstanceStatus =>
  s === 'active' ? 'running' : s === 'terminating' ? 'pending_removal' : s === 'suspended' ? 'suspended' : s === 'failed' ? 'failed' : 'provisioning'
// Instance.id = Tenant.name (the contract id); Instance.name = slug.
const toInstance = (t: Tenant): T.Instance => ({ id: t.name, name: t.slug, url: t.url ?? '', status: tenantStatus(t.status), planId: t.plan, createdAt: t.created_at ?? '' })
// The monthly price in the site's preferred currency, else the first monthly price, else the first price.
// useCheckout().start sends this same currency so the amount shown is the amount charged.
const pickPrice = (p: KPlan) => {
  const month = p.prices.filter((x) => x.interval === 'month')
  const pref = String(site.currency ?? '').toUpperCase()
  return month.find((x) => x.currency?.toUpperCase() === pref) ?? month[0] ?? p.prices[0]
}
const toPlan = (p: KPlan): T.Plan => {
  const price = pickPrice(p)
  const rec = (p.limits ?? {})['recommended']
  return { id: p.code, name: p.title, price: (price?.amount ?? 0) / 100, interval: price?.interval ?? 'month', features: p.features ?? [],
    currency: price?.currency?.toUpperCase(), description: p.description || undefined, recommended: rec === true || rec === 1 || rec === '1' }
}
const toInvoice = (i: KInvoice): T.Invoice => ({
  id: i.name, number: i.number ?? i.name, date: i.issued_at ?? '', amount: i.total.amount / 100, currency: i.total.currency,
  status: i.status === 'paid' ? 'paid' : i.status === 'void' || i.status === 'refunded' ? 'void' : 'open', lines: [],
})
const jobStatus = (s: KJob['state']): T.Job['status'] =>
  s === 'succeeded' ? 'success' : s === 'pending' ? 'queued' : s === 'dispatching' || s === 'submitted' || s === 'running' ? 'running' : 'failed'
const toTicket = (t: KTicket): T.Ticket => ({
  id: t.name, subject: t.subject, status: t.status === 'resolved' ? 'closed' : t.status, createdAt: t.created_at ?? '',
  messages: (t.replies ?? []).map((r) => ({ from: r.from_staff ? 'support' : 'you', body: r.body ?? '', at: r.at ?? '' })),
})

export function useAuth() {
  const q = K.useMe(); const qc = useQueryClient()
  const login = K.useLogin(); const signup = K.useSignup(); const logout = K.useLogout()
  const forgot = K.useRequestPasswordReset(); const reset = K.useConfirmPasswordReset()
  const reqVerify = K.useRequestEmailVerification(); const confirmEmail = K.useConfirmEmail()
  const user: T.User | null = q.data ? toUser(q.data as MeLike) : null
  return {
    user, loading: q.isLoading,
    async login(email: string, password: string) { await login.mutateAsync({ email, password }) },
    async signup(input: { name: string; email: string; password: string; inviteToken?: string }) { await signup.mutateAsync({ email: input.email, password: input.password, full_name: input.name, ...(input.inviteToken ? { invite_token: input.inviteToken } : {}) }) },
    async logout() { await logout.mutateAsync(); qc.setQueryData(K.saasKeys.me(), null) },
    async forgotPassword(email: string) { await forgot.mutateAsync(email) },
    async resetPassword(token: string, password: string) { await reset.mutateAsync({ key: token, new_password: password }) },
    async verifyEmail(token: string) { await confirmEmail.mutateAsync(token) },
    async resendVerification() { await reqVerify.mutateAsync() },
  }
}
export function usePlans() { const q = K.usePlans(); return { plans: (q.data ?? []).map(toPlan), loading: q.isLoading } }
export function useSubscription() {
  // The contract scopes subscriptions to a tenant: use the first active tenant.
  const tq = K.useTenants()
  const tenant = (tq.data ?? []).find((t) => t.status === 'active')
  const q = K.useSubscription(tenant?.name ?? '')
  const change = K.useChangePlan(); const cancel = K.useCancelSubscription()
  const s = q.data
  const subscription: T.Subscription = {
    planId: s?.plan ?? tenant?.plan ?? '',
    status: s?.status === 'canceled' ? 'canceled' : s?.status === 'past_due' ? 'past_due' : 'active',
    renewsAt: s?.period_end ?? '',
  }
  return {
    subscription, loading: tq.isLoading || q.isLoading,
    async changePlan(planId: string) { if (!tenant) throw new Error('No active tenant'); await change.mutateAsync({ id: tenant.name, plan: planId }) },
    async cancel() { if (!tenant) throw new Error('No active tenant'); await cancel.mutateAsync({ tenantId: tenant.name }) },
  }
}
/** Recipe signup fields from the first template that declares a signup_schema. */
export function useSignupFields(): T.OnboardingField[] {
  const q = K.useTemplates()
  for (const t of q.data ?? []) { const f = fieldsFromSchema((t as { signup_schema?: unknown }).signup_schema); if (f.length) return f }
  return []
}
/** Public site domain (`<slug>.<site_domain>`), from the SDK public config. */
export function useSiteDomain(): string | null { return K.usePublicConfig().data?.site_domain ?? null }
/** Signup gate from the public config. `signup_mode` is not in the vendored SDK types yet, so it is read defensively. */
export function usePublicConfig(): T.PublicConfig {
  const q = K.usePublicConfig(); const d = q.data as { public_signup?: boolean; signup_mode?: string } | undefined
  return { publicSignup: d?.public_signup === true, signupMode: d?.signup_mode, loaded: !!d }
}
/** Live address check against the SDK slug-availability endpoint. */
export function useSlugAvailability(slug: string): { data?: T.SlugCheck; isFetching: boolean; isError?: boolean } {
  const q = K.useSlugAvailability(slug)
  return { data: q.data, isFetching: q.isFetching, isError: q.isError }
}
export function useCheckout() {
  const m = K.useCheckout()
  const qc = useQueryClient()
  const rzp = K.useRazorpayCheckout()
  return {
    async start(planId: string, opts?: { slug?: string; recipeFields?: Record<string, string> }): Promise<T.CheckoutStart> {
      const recipe_fields = opts?.recipeFields ?? takeRecipeFields()
      const origin = window.location.origin
      if (!opts?.slug) throw new Error('missing_address') // checkout redirects to onboarding before this; never invent an address
      const slug = slugify(opts.slug)
      const plans = qc.getQueryData<KPlan[]>(K.saasKeys.plans()) ?? (await client.plans.list().catch(() => [] as KPlan[]))
      const kp = plans.find((p) => p.code === planId)
      const currency = kp ? pickPrice(kp)?.currency : undefined
      const r = await m.mutateAsync({ plan: planId, slug, interval: 'month', ...(currency ? { currency } : {}), ...(recipe_fields ? { recipe_fields } : {}), success_url: `${origin}/console`, cancel_url: `${origin}/pricing` })
      return { sessionId: r.session_id, planId, url: r.url ?? '', tenant: r.tenant, paymentMocked: !!r.payment_mocked, provider: r.client_payload?.provider, session: r }
    },
    /** Opens the Razorpay modal for a session returned by start(); resolves to the tenant on success. */
    async payInPage(start: T.CheckoutStart): Promise<{ tenant?: string }> {
      if (!start.session) throw new Error('No checkout session')
      try {
        const res = await rzp.open(start.session as Parameters<typeof rzp.open>[0])
        return { tenant: res.tenant ?? start.tenant }
      } catch (e) {
        if (e instanceof Error && e.message === 'dismissed') throw new CheckoutDismissed()
        throw e
      }
    },
  }
}
function notSupported(what: string) { return new Error(`${what} is not supported by the live saas_core API`) }
export function useInstances() {
  const q = K.useTenants(); const cr = K.useCreateTenant(); const dup = K.useDuplicateTenant(); const del = K.useRequestDeleteTenant()
  const instances = (q.data ?? []).map(toInstance)
  return {
    instances, loading: q.isLoading, error: q.isError, refresh: () => q.refetch(),
    async get(id: string) { return instances.find((i) => i.id === id) ?? null },
    async create(input: { name: string; planId: string }) { const r = await cr.mutateAsync({ slug: slugify(input.name), plan: input.planId }); return { id: r.tenant.name, jobId: r.job.name } },
    async duplicate(id: string) { const s = instances.find((i) => i.id === id); if (s) await dup.mutateAsync({ id, slug: slugify(`${s.name}-copy`) }) },
    async remove(id: string, confirmSlug?: string) { await del.mutateAsync({ id, confirm_slug: confirmSlug ?? instances.find((i) => i.id === id)?.name ?? id }) },
    // Removal approval is a backend workflow not exposed by the contract: fail loudly instead of pretending to succeed.
    async approveRemoval(_id: string): Promise<void> { throw notSupported('approveRemoval') },
    async cancelRemoval(_id: string): Promise<void> { throw notSupported('cancelRemoval') },
  }
}
export function useProvisioningJob(jobId: string) {
  const j = K.useJob(jobId).data
  const step = j?.steps?.find((s) => s.state === 'running') ?? j?.steps?.[j.steps.length - 1]
  const job: T.Job | null = j ? { id: j.name, status: jobStatus(j.state), progress: j.state === 'succeeded' ? 100 : j.progress ?? 0, step: step?.name ?? j.state, instanceId: j.tenant } : null
  return { job }
}
const humanize = (n: string) => { const x = n.replace(/[_-]+/g, ' ').trim(); return x.charAt(0).toUpperCase() + x.slice(1) }
const DEFAULT_STEPS = ['Reserving your workspace', 'Creating your site', 'Installing apps', 'Finishing up']
/** Resolves a tenant slug -> active provisioning job (tenant.active_job) and exposes step-level progress.
 *  active_job is cleared once the job ends, so we fall back to the tenant's latest job. */
export function useProvisioning(slug: string): T.ProvisioningState {
  const tq = useQuery<Tenant>({
    queryKey: K.saasKeys.tenant(slug), queryFn: () => client.tenants.get(slug), enabled: !!slug,
    refetchInterval: (q) => { const s = q.state.data?.status; return s === 'active' || s === 'failed' ? false : 2000 },
  })
  const tenant = tq.data
  const jobsQ = K.useJobs(slug)
  const latest = [...(jobsQ.data ?? [])].filter((j) => j.kind === 'provision').sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))[0]
  const jobId = tenant?.active_job ?? latest?.name ?? ''
  const jq = K.useJob(jobId).data
  const status: T.ProvisioningState['status'] = !tenant ? 'waiting' : tenant.status === 'active' ? 'active' : tenant.status === 'failed' || jq?.state === 'failed' ? 'failed' : 'provisioning'
  const raw = jq?.steps?.length ? [...jq.steps].sort((a, b) => a.seq - b.seq) : null
  const steps: T.ProvisioningStep[] = raw
    ? raw.map((s) => ({ name: s.name, label: humanize(s.name), state: status === 'active' || s.state === 'succeeded' ? 'done' : s.state === 'failed' ? 'failed' : s.state === 'running' ? 'current' : 'upcoming' }))
    : DEFAULT_STEPS.map((label, i) => ({ name: label, label, state: status === 'active' ? 'done' : i === 0 && status === 'provisioning' ? 'current' : 'upcoming' }))
  const progress = status === 'active' ? 100 : Math.round(Math.min(1, Math.max(0, jq?.progress ?? 0)) * 100)
  return { loading: tq.isLoading, status, progress, steps, url: status === 'active' ? tenant?.url ?? undefined : undefined, error: status === 'failed' ? jq?.error ?? null : null }
}
export function useBackups(instanceId?: string) {
  // One list per live site, merged. The contract lists backups per tenant, so fetch for every active one.
  const tq = K.useTenants()
  const ids = instanceId ? [instanceId] : (tq.data ?? []).filter((t) => t.status === 'active').map((t) => t.name)
  const cr = K.useCreateBackup(); const rs = K.useRestoreBackup()
  const q = useQuery<T.Backup[]>({
    queryKey: ['saas', 'backups-all', ids.join(',')],
    enabled: ids.length > 0,
    refetchInterval: 15_000,
    queryFn: async () => (await Promise.all(ids.map(async (id) => (await client.backups.list(id)).map((b): T.Backup => ({
      id: b.name, instanceId: id, createdAt: b.created_at, sizeMb: Math.round((b.size_bytes ?? 0) / 1048576), sizeBytes: b.size_bytes ?? undefined,
      kind: b.kind === 'on_demand' ? 'manual' : 'automatic', status: 'ready',
    }))))).flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  })
  return {
    backups: q.data ?? [], loading: tq.isLoading || (ids.length > 0 && q.isLoading), error: q.isError,
    async create(iid: string) { await cr.mutateAsync(iid); void q.refetch() },
    /** Approval-gated: resolves to a pending approval, not a job. */
    async restore(iid: string, backupId: string): Promise<{ approvalRequest: string; status: 'pending_approval' }> {
      const r = await rs.mutateAsync({ tenantId: iid, backup: backupId }); return { approvalRequest: r.approval_request, status: r.status }
    },
    /** Fetches a short-lived signed link for the database backup and downloads it. */
    async download(iid: string, backupId: string) {
      const link = await client.backups.downloadLink(iid, backupId, 'database')
      const a = document.createElement('a'); a.href = link.url; a.rel = 'noreferrer'; a.download = ''; document.body.appendChild(a); a.click(); a.remove()
    },
  }
}
export function useInvoices() {
  const q = K.useInvoices(); const invoices = (q.data ?? []).map(toInvoice)
  return { invoices, loading: q.isLoading, get: (id: string) => invoices.find((i) => i.id === id) ?? null }
}
export function useTickets() {
  const q = K.useSupportTickets(); const cr = K.useCreateSupportTicket(); const rp = K.useReplyToTicket(); const cl = K.useCloseTicket()
  const tickets = (q.data ?? []).map(toTicket)
  return {
    tickets, loading: q.isLoading, get: (id: string) => tickets.find((t) => t.id === id) ?? null,
    async create(subject: string, body: string) { await cr.mutateAsync({ subject, body }) },
    async reply(id: string, body: string) { await rp.mutateAsync({ ticket: id, body }) },
    async close(id: string) { await cl.mutateAsync(id) },
  }
}

// Not covered by the contract: payment methods stay fixture-backed (billing pages own that).
/** The API cannot list saved cards (the gateway stores them); never show fixture cards to customers. */
export function usePaymentMethods() {
  const portal = K.usePaymentMethodsPortalLink()
  return { methods: [] as T.PaymentMethod[], loading: false, portalUrl: undefined as string | undefined,
    async openPortal() { return portal.mutateAsync({ return_url: window.location.href }) } }
}
// Usage, sessions and notifications have NO backend endpoint. Customers must never see invented numbers,
// so these return honest empty data (the UI hides the sections via useCapabilities()).
export function useUsage() { return { metrics: [] as T.UsageMetric[], loading: false } }
export function useSessions() { return { sessions: [] as T.Session[], loading: false, async revoke(_id: string): Promise<void> { throw notSupported('sessions.revoke') } } }
export function useNotifications() {
  return { notifications: [] as T.Notification[], unread: 0, loading: false, async markRead(_id: string): Promise<void> { throw notSupported('notifications.markRead') }, async markAllRead(): Promise<void> { throw notSupported('notifications.markAllRead') } }
}
/** What the live API can really serve. Anything false is hidden in the UI rather than faked. */
export function useCapabilities(): T.Capabilities {
  return LIVE_CAPABILITIES
}

export function useUpdateProfile() {
  const m = K.useUpdateProfile()
  return {
    // The contract only accepts full_name; the account email is read-only in the UI (changed via support).
    async update(input: { name?: string; email?: string }) { await m.mutateAsync({ full_name: input.name }) },
    /** Real password change: the profile endpoint verifies the current password server-side. */
    async changePassword(current: string, next: string) { await m.mutateAsync({ current_password: current, new_password: next }) },
  }
}
// Tokens are user-level; the secret is only returned by create().
export function useApiTokens() {
  const q = K.useApiTokens(); const cr = K.useCreateApiToken(); const rv = K.useRevokeApiToken()
  const tokens: T.ApiToken[] = (q.data ?? []).map((k) => ({ id: k.name, name: k.label, prefix: k.prefix ?? '', createdAt: k.created_at }))
  return {
    tokens, loading: q.isLoading,
    async create(name: string) { const r = await cr.mutateAsync({ label: name }); return { id: r.token.name, name: r.token.label, prefix: r.token.prefix ?? '', createdAt: r.token.created_at, secret: r.secret } },
    async revoke(id: string) { await rv.mutateAsync(id) },
  }
}
// Team is tenant-scoped: uses the first active tenant.
export function useTeam() {
  const tq = K.useTenants(); const tid = (tq.data ?? []).find((t) => t.status === 'active')?.name ?? ''
  const q = K.useTeamMembers(tid)
  const inv = K.useInviteMember(); const rvi = K.useRevokeInvite(); const ch = K.useChangeMemberRole(); const rm = K.useRemoveMember()
  const list = q.data ?? []
  return {
    members: list.filter((m) => m.status === 'active').map((m): T.Member => ({ id: m.name, name: m.full_name ?? m.email, email: m.email, role: m.role as T.Role })),
    invites: list.filter((m) => m.status === 'invited').map((m): T.Invite => ({ id: m.name, email: m.email, role: m.role as T.Role, sentAt: m.invited_at ?? '' })),
    loading: tq.isLoading || q.isLoading, ready: !!tid,
    roles: ['owner', 'admin', 'member'] as T.Role[],
    async invite(email: string, role: T.Role) { await inv.mutateAsync({ tenantId: tid, email, role: role as never }) },
    async revokeInvite(id: string) { await rvi.mutateAsync({ tenantId: tid, invite: id }) },
    async setRole(id: string, role: T.Role) { await ch.mutateAsync({ tenantId: tid, member: id, role: role as never }) },
    async removeMember(id: string) { await rm.mutateAsync({ tenantId: tid, member: id }) },
  }
}
/** Link to the saas_core invoice PDF endpoint (cookie auth). `download()` fetches the Blob through the client instead. */
export const invoicePdfUrl = (invoiceId: string) => `${BASE}/api/method/saas_core.api.v1.invoices.pdf?invoice=${encodeURIComponent(invoiceId)}`
export function useInvoicePdf(invoiceId: string) {
  const m = K.useInvoicePdf()
  return { url: invoicePdfUrl(invoiceId), loading: m.isPending, download: () => m.mutateAsync(invoiceId) }
}

/** Accept a team invite token (wraps the SDK mutation). */
export function useAcceptInvite(): (token: string) => Promise<void> {
  const m = K.useAcceptInvite()
  return async (token) => { await m.mutateAsync(token) }
}

// --- Admin (operators only; the server answers 403 to everyone else) ---
const isForbidden = (e: unknown) => (e as { status?: number } | null)?.status === 403
export function useAdminTenants(): { tenants: T.AdminTenant[] } & T.AdminListState {
  const q = K.useAdminTenants()
  const tenants = (q.data ?? []).map((t): T.AdminTenant => ({ id: t.name, slug: t.slug, url: t.url ?? '', status: t.status, planId: t.plan, createdAt: t.created_at ?? '' }))
  return { tenants, loading: q.isLoading, error: q.isError && !isForbidden(q.error), forbidden: isForbidden(q.error), refresh: () => void q.refetch() }
}
export function useAdminBetaAccess() {
  const qc = useQueryClient()
  const KEY = ['saas', 'admin', 'beta-access']
  const q = useQuery({ queryKey: KEY, queryFn: betaAccessApi.list, retry: (n, e) => !isForbidden(e) && n < 2 })
  const done = async <R,>(p: Promise<R>) => { const r = await p; await qc.invalidateQueries({ queryKey: KEY }); return r }
  return {
    entries: q.data?.entries ?? [], signupMode: q.data?.signupMode ?? '', loading: q.isLoading, error: q.isError && !isForbidden(q.error), forbidden: isForbidden(q.error),
    refresh: () => void q.refetch(),
    add: (entries: string[], sendInvite: boolean, note?: string) => done(betaAccessApi.add(entries, sendInvite, note)),
    async remove(pattern: string) { await done(betaAccessApi.remove(pattern)) },
    async resend(email: string) { await done(betaAccessApi.resend(email)) },
  }
}
