import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../data'
import { Button } from '@ui-sdk/react/button'
import { useT } from '../../i18n'

type State = 'working' | 'done' | 'failed' | 'waiting'

export function VerifyEmail() {
  const t = useT(); const { user, verifyEmail, resendVerification } = useAuth()
  const [params] = useSearchParams()
  // The email link carries `?key=`; older links used `?token=`.
  const token = params.get('key') ?? params.get('token') ?? ''
  const [state, setState] = useState<State>(token ? 'working' : 'waiting')
  const [resend, setResend] = useState<'idle' | 'busy' | 'sent' | 'failed'>('idle')
  const [wait, setWait] = useState(0)
  useEffect(() => {
    if (!token) return
    verifyEmail(token).then(() => setState('done'), () => setState('failed'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])
  useEffect(() => { if (wait <= 0) return; const id = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(id) }, [wait])
  async function doResend() {
    setResend('busy')
    try { await resendVerification(); setResend('sent'); setWait(60) } catch { setResend('failed') }
  }
  const message = state === 'failed' ? t('auth.verify.failed')
    : state === 'waiting' ? (user?.email ? t('auth.verify.noTokenEmail', { email: user.email }) : t('auth.verify.noToken'))
    : t(`auth.verify.${state}`)
  return (
    <section aria-labelledby="v-title">
      <h1 id="v-title">{state === 'done' ? t('auth.verify.doneTitle') : t('auth.verify.title')}</h1>
      {state === 'failed' ? <p role="alert" style={{ color: 'var(--color-danger, #b42318)' }}>{message}</p> : <p role="status">{message}</p>}
      {state === 'done' && <Button data-variant="solid" render={<Link to="/onboarding" />}>{t('auth.verify.continueSetup')}</Button>}
      {(state === 'failed' || state === 'waiting') && (user
        ? <Button type="button" data-testid="resend-verification" disabled={resend === 'busy' || wait > 0} onClick={() => void doResend()}>{wait > 0 ? t('auth.verify.resendIn', { s: wait }) : t('auth.verify.resend')}</Button>
        : <p className="muted">{t('auth.verify.needLogin')}</p>)}
      {resend === 'sent' && <p role="status" data-testid="resent">{t('auth.verify.resent')}</p>}
      {resend === 'failed' && <p role="alert" style={{ color: 'var(--color-danger, #b42318)' }}>{t('auth.verify.resendFailed')}</p>}
      {state !== 'done' && !user && <Button render={<Link to="/login" state={{ from: `/verify-email${token ? `?key=${encodeURIComponent(token)}` : ''}` }} />}>{t('auth.login')}</Button>}
    </section>
  )
}
