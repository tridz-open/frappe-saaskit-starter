import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../data'
import { useT } from '../../i18n'
import { useSaas } from '../../app/context'
import { Button } from '@ui-sdk/react/button'
import { Row, Stack } from '../../components/primitives/Layout'
import { AuthForm } from './AuthForm'
import { AuthLink, AuthLinks } from './AuthLink'

export const GATE_CODES = ['signup_disabled', 'not_allowlisted', 'invite_required'] as const
export type GateCode = (typeof GATE_CODES)[number]

export function gateCodeOf(e: unknown): GateCode | null {
  const code = (e as { code?: string } | null)?.code
  return GATE_CODES.includes(code as GateCode) ? (code as GateCode) : null
}

export function InviteOnly({ code, email }: { code: GateCode; email: string }) {
  const t = useT()
  return (
    <section aria-labelledby="invite-only-title">
      <Stack style={{ maxWidth: '32rem', marginInline: 'auto', textAlign: 'center', alignItems: 'center', paddingBlock: 'var(--space-12)', gap: 'var(--space-4)' }}>
        <span aria-hidden="true" data-slot="feature-icon" style={{ width: '3rem', height: '3rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        </span>
        <small style={{ color: 'var(--color-muted-fg)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 'var(--text-xs, var(--text-sm))' }}>{t('auth.invite.eyebrow')}</small>
        <h1 id="invite-only-title" style={{ margin: 0 }}>{t('auth.invite.title')}</h1>
        <p data-slot="lead" role="status" style={{ margin: 0 }}>{t(`auth.invite.${code}`)}</p>
        <Row style={{ justifyContent: 'center' }}>
          <Button data-variant="solid" render={<a href={`mailto:${email}?subject=${encodeURIComponent(t('auth.invite.request'))}`} />}>{t('auth.invite.request')}</Button>
          <Button render={<Link to="/login" />}>{t('auth.login')}</Button>
        </Row>
        <small style={{ color: 'var(--color-muted-fg)' }}>{t('auth.invite.hint')}</small>
        <small style={{ color: 'var(--color-muted-fg)' }}>{t('auth.invite.emailUs', { email })}</small>
      </Stack>
    </section>
  )
}

export function Signup() {
  const t = useT(); const { signup } = useAuth(); const nav = useNavigate()
  const { site } = useSaas()
  const [params] = useSearchParams()
  const invite = params.get('invite') ?? undefined
  const [gate, setGate] = useState<GateCode | null>(null)
  const [checkEmail, setCheckEmail] = useState('')
  const { resendVerification } = useAuth()
  const [resent, setResent] = useState(false)
  if (gate) return <InviteOnly code={gate} email={site.supportEmail} />
  return (
    <AuthForm title={t('auth.signup.title')} doneTitle={t('auth.signup.checkTitle')} submitLabel={t('auth.signup.submit')} busyLabel={t('auth.signup.busy')} lead={t('auth.signup.lead')}
      done={checkEmail ? <>
        <p>{t('auth.signup.checkBody', { email: checkEmail })}</p>
        <Row>
          <Button data-variant="solid" onClick={() => nav('/onboarding')}>{t('auth.verify.continueSetup')}</Button>
          <Button type="button" onClick={() => void resendVerification().then(() => setResent(true), () => setResent(false))}>{t('auth.verify.resend')}</Button>
        </Row>
        {resent && <p role="status">{t('auth.verify.resent')}</p>}
      </> : null}
      consent={<>{t('auth.consent.prefix')} <Link to="/terms" target="_blank" rel="noopener">{t('auth.terms')}</Link> {t('auth.consent.and')} <Link to="/privacy" target="_blank" rel="noopener">{t('auth.privacy')}</Link>.</>}
      fields={[
        { name: 'name', label: t('auth.name'), type: 'text', autoComplete: 'name', requiredMsg: t('auth.name.required') },
        { name: 'email', label: t('auth.email'), type: 'email', autoComplete: 'email', requiredMsg: t('auth.email.required') },
        { name: 'password', label: t('auth.password'), type: 'password', autoComplete: 'new-password', minLength: 8, requiredMsg: t('auth.password.required'), hint: t('auth.signup.rules', { min: 8 }) },
      ]}
      onSubmit={async (v) => {
        try { await signup({ name: v.name, email: v.email, password: v.password, inviteToken: invite }) } catch (e) {
          const g = gateCodeOf(e)
          if (g) { setGate(g); return }
          throw e
        }
        // Checkout requires a verified email, so show a "check your inbox" step before onboarding.
        setCheckEmail(v.email)
      }}
      footer={<AuthLinks><span>{t('auth.haveAccount')} <AuthLink to="/login">{t('auth.login')}</AuthLink></span></AuthLinks>} />
  )
}
