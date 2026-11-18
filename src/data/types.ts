export type User = { id: string; email: string; name: string; emailVerified: boolean; onboarded: boolean; roles?: string[] }
/** `price` is in major units of `currency` (the currency actually charged). `recommended` marks the plan to nudge toward. */
export type Plan = { id: string; name: string; price: number; interval: 'month' | 'year'; features: string[]; currency?: string; description?: string; recommended?: boolean }
export type Subscription = { planId: string; status: 'active' | 'past_due' | 'suspended' | 'canceled'; renewsAt: string }
export type InstanceStatus = 'provisioning' | 'running' | 'suspended' | 'past_due' | 'pending_removal' | 'removed' | 'failed'
export type Instance = { id: string; name: string; url: string; status: InstanceStatus; planId: string; createdAt: string; pendingApproval?: boolean }
export type Job = { id: string; status: 'queued' | 'running' | 'success' | 'failed'; progress: number; step: string; instanceId?: string }
export type Backup = { id: string; instanceId: string; createdAt: string; sizeMb: number; /** Exact size when the API reports it. */ sizeBytes?: number; kind?: 'automatic' | 'manual'; status: 'ready' | 'running' | 'failed' }
/** Which optional features the active data adapter can really serve. UI hides what is false (never shows invented data). */
/** Public (unauthenticated) config. `loaded` is false until the server answered; treat unknown as closed. */
export type PublicConfig = { publicSignup: boolean; signupMode?: string; loaded: boolean }
export type Capabilities = { sessions: boolean; notifications: boolean; usage: boolean; apiTokens: boolean; backupDownload: boolean; cancelDeletion: boolean; emailVerification: boolean }
export type Invoice = { id: string; number: string; date: string; amount: number; currency: string; status: 'paid' | 'open' | 'void'; lines: { description: string; amount: number }[] }
export type PaymentMethod = { id: string; brand: string; last4: string; isDefault: boolean }
export type UsageMetric = { key: string; label: string; used: number; limit: number; unit: string }
export type Session = { id: string; device: string; ip: string; lastActive: string; current: boolean }
export type ApiToken = { id: string; name: string; prefix: string; createdAt: string; secret?: string }
export type Role = 'owner' | 'admin' | 'member'
export type Member = { id: string; name: string; email: string; role: Role }
export type Invite = { id: string; email: string; role: Role; sentAt: string }
export type Notification = { id: string; title: string; body: string; createdAt: string; read: boolean }
export type Ticket = { id: string; subject: string; status: 'open' | 'pending' | 'closed'; createdAt: string; messages: { from: string; body: string; at: string }[] }
export type CheckoutStart = { sessionId: string; planId: string; url: string; jobId?: string; tenant?: string; paymentMocked?: boolean; provider?: string; session?: unknown }
/** Thrown when the user closes the in-page payment modal without paying. */
export class CheckoutDismissed extends Error { constructor() { super('dismissed'); this.name = 'CheckoutDismissed' } }
/** Provisioning progress for a tenant slug (or, in fixtures, a job id). */
export type ProvisioningStep = { name: string; label: string; state: 'done' | 'current' | 'upcoming' | 'failed' }
export type ProvisioningState = {
  loading: boolean
  status: 'waiting' | 'provisioning' | 'active' | 'failed'
  /** 0-100 */
  progress: number
  steps: ProvisioningStep[]
  url?: string
  error?: string | null
}
/** One extra onboarding field, typically derived from a recipe `signup_schema`. Collected values go to checkout as `recipe_fields`. */
export type OnboardingField = {
  name: string
  label: string
  type?: 'text' | 'email' | 'select'
  required?: boolean
  help?: string
  max?: number
  options?: { value: string; label: string }[]
  /** Static default. */
  default?: string
  /** Default taken from another onboarding answer or the signed-in user; follows that value until the user edits the field. */
  defaultFrom?: 'company' | 'instance' | 'name' | 'email'
  /** Sent with the signup but not shown (value comes from `default`/`defaultFrom`). */
  hidden?: boolean
}

export type SlugCheck = { slug: string; available: boolean; reason: null | 'invalid' | 'reserved' | 'taken'; message: string; suggestion: string | null }
