import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Button } from '@ui-sdk/react/button'
import { Field, FieldError, FieldLabel } from '@ui-sdk/react/field'
import { Input } from '@ui-sdk/react/input'
import { useT } from '../../i18n'

export type Field = {
  name: string
  label: string
  type: string
  autoComplete?: string
  /** Minimum length, validated per field (signup / reset only). */
  minLength?: number
  /** Short helper shown under the field while it is valid. */
  hint?: string
  /** Full message when the field is empty (falls back to the generic "Enter your {field}."). */
  requiredMsg?: string
  /** Extra control rendered on the label row (e.g. "Forgot password?"). */
  labelAction?: ReactNode
}

/** Server error code -> i18n key. Unknown codes fall back to the generic message with a support hint. */
const ERROR_KEYS: Record<string, string> = {
  unauthorized: 'auth.err.unauthorized',
  conflict: 'auth.err.conflict',
  rate_limited: 'auth.err.rateLimited',
  signup_disabled: 'auth.err.signupDisabled',
  invalid_token: 'auth.err.invalidToken',
  email_unverified: 'auth.err.emailUnverified',
  not_found: 'auth.err.notFound',
}

/** Turn a thrown SDK error into a customer-facing message. `overrides` are keyed by server code. */
export function authErrorMessage(t: (k: string, p?: Record<string, string | number>) => string, e: unknown, overrides?: Record<string, string>): { code: string; message: string } {
  const err = e as { code?: string; name?: string; status?: number; message?: string; fieldErrors?: Record<string, string> } | null
  const code = err?.code ?? ''
  if (code && overrides?.[code]) return { code, message: overrides[code] }
  if (err?.name === 'NetworkError' || err instanceof TypeError) return { code: 'network', message: t('auth.err.network') }
  if (code === 'validation_error') {
    // Password-policy and similar messages come from the server verbatim.
    const first = err?.fieldErrors ? Object.values(err.fieldErrors).find(Boolean) : ''
    return { code, message: first || err?.message || t('auth.error') }
  }
  if (code && ERROR_KEYS[code]) return { code, message: t(ERROR_KEYS[code]) }
  if (err?.status && err.status >= 500) return { code: 'server', message: t('auth.err.server') }
  return { code: code || 'unknown', message: t('auth.error') }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const toggleStyle: CSSProperties = {
  position: 'absolute', insetBlock: 0, insetInlineEnd: 'var(--space-2)', margin: 'auto 0',
  height: 'fit-content', padding: 'var(--space-1) var(--space-2)', border: 0, background: 'transparent',
  color: 'var(--color-muted-fg)', font: 'inherit', fontSize: 'var(--text-sm)', cursor: 'pointer',
  borderRadius: 'var(--radius-sm)',
}

import { ExperimentalBadge } from '../../components/primitives'
export function AuthForm({ title, fields, submitLabel, busyLabel, onSubmit, footer, done, doneTitle, consent, lead, errorMessages, notice, experimental }: {
  title: string
  fields: Field[]
  submitLabel: string
  busyLabel?: string
  onSubmit: (v: Record<string, string>) => Promise<void>
  footer?: ReactNode
  done?: ReactNode
  /** Replaces the page title once `done` is shown. */
  doneTitle?: string
  consent?: ReactNode
  lead?: string
  experimental?: boolean
  /** Per-form overrides of server error messages, keyed by error code. */
  errorMessages?: Record<string, string>
  /** One-line notice above the form (e.g. "You've been signed out."). */
  notice?: string
}) {
  const t = useT()
  const uid = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const errRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => { if (error) errRef.current?.focus() }, [error])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [shown, setShown] = useState<Record<string, boolean>>({})

  function check(f: Field, value: string): string {
    if (!value) return f.requiredMsg ?? t('auth.required', { field: f.label.toLowerCase() })
    if (f.type === 'email' && !EMAIL_RE.test(value)) return t('auth.emailInvalid')
    if (f.minLength && value.length < f.minLength) return t('auth.passwordShort', { min: String(f.minLength) })
    return ''
  }
  function clear(name: string) {
    setError(''); setErrorCode('')
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev))
  }

  function blur(f: Field, value: string) {
    const trimmed = value.trim()
    if (!trimmed) return // empty fields are only flagged on submit
    const msg = check(f, trimmed)
    setErrors((prev) => (prev[f.name] === msg ? prev : { ...prev, [f.name]: msg }))
  }

  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const v: Record<string, string> = {}
    const next: Record<string, string> = {}
    for (const f of fields) {
      v[f.name] = String(fd.get(f.name) ?? '').trim()
      const msg = check(f, v[f.name])
      if (msg) next[f.name] = msg
    }
    setErrors(next)
    const first = fields.find((f) => next[f.name])
    if (first) {
      setError('')
      const el = formRef.current?.elements.namedItem(first.name)
      if (el instanceof HTMLElement) el.focus()
      return
    }
    setError(''); setBusy(true)
    try { await onSubmit(v) } catch (e) {
      const r = authErrorMessage(t, e, errorMessages)
      setErrorCode(r.code); setError(r.message)
    } finally { setBusy(false) }
  }

  return (
    <section aria-labelledby="auth-title">
      {experimental && <p><ExperimentalBadge /></p>}
      <h1 id="auth-title">{done && doneTitle ? doneTitle : title}</h1>
      {lead && !done && <p data-slot="lead">{lead}</p>}
      {notice && !done && <p role="status" className="muted" style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{notice}</p>}
      {done ? <div role="status">{done}</div> : (
        <form ref={formRef} onSubmit={handle} noValidate>
          {error && <p ref={errRef} tabIndex={-1} role="alert" style={{ color: 'var(--color-danger, #b42318)', fontSize: 'var(--text-sm)', margin: 0, outlineOffset: 2 }}>{error}</p>}
          {fields.map((f) => {
            const msg = errors[f.name]
            const isPassword = f.type === 'password'
            const visible = !!shown[f.name]
            const errId = `${uid}-${f.name}-err`
            const hintId = `${uid}-${f.name}-hint`
            const describedBy = msg ? errId : f.hint ? hintId : undefined
            const credInvalid = isPassword && errorCode === 'unauthorized'
            const input = (
              <Input
                type={isPassword && visible ? 'text' : f.type}
                autoComplete={f.autoComplete}
                aria-required="true"
                aria-invalid={msg || credInvalid ? true : undefined}
                aria-describedby={describedBy}
                style={isPassword ? { paddingInlineEnd: '4.5rem' } : undefined}
                onValueChange={() => clear(f.name)}
                onBlur={(e: { currentTarget: HTMLInputElement }) => blur(f, e.currentTarget.value)}
              />
            )
            return (
              <Field key={f.name} name={f.name} invalid={msg ? true : undefined}>
                {f.labelAction
                  ? <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--space-2)' }}><FieldLabel>{f.label}</FieldLabel><small>{f.labelAction}</small></div>
                  : <FieldLabel>{f.label}</FieldLabel>}
                {isPassword ? (
                  <div style={{ position: 'relative' }}>
                    {input}
                    <button type="button" style={toggleStyle} aria-pressed={visible} aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
                      onClick={() => setShown((s) => ({ ...s, [f.name]: !s[f.name] }))}>
                      {visible ? t('auth.hide') : t('auth.show')}
                    </button>
                  </div>
                ) : input}
                {msg
                  ? <FieldError id={errId}>{msg}</FieldError>
                  : f.hint && <small id={hintId} style={{ color: 'var(--color-muted-fg)', fontSize: 'var(--text-sm)' }}>{f.hint}</small>}
              </Field>
            )
          })}
          <Button type="submit" data-variant="solid" disabled={busy} aria-busy={busy || undefined}>{busy ? (busyLabel ?? t('auth.working')) : submitLabel}</Button>
          {consent && <small data-slot="consent" style={{ display: 'block', color: 'var(--color-muted-fg)', fontSize: 'var(--text-xs, var(--text-sm))', textAlign: 'center', lineHeight: 1.5 }}>{consent}</small>}
        </form>
      )}
      {footer && <div data-slot="auth-links" style={{ marginBlockStart: 'var(--space-4)' }}>{footer}</div>}
    </section>
  )
}
