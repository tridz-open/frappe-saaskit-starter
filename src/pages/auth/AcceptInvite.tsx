import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { useAcceptInvite, useAuth } from '../../data'
import { useT } from '../../i18n'
import { Row } from '../../components/primitives/Layout'

/** Landing page for `<console_url>/accept-invite?token=...` links from team invite emails. */
export function AcceptInvite() {
  const t = useT(); const { user, loading } = useAuth(); const loc = useLocation()
  const token = useSearchParams()[0].get('token') ?? ''
  const accept = useAcceptInvite()
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState('')
  const back = { from: `${loc.pathname}${loc.search}` }
  async function go() {
    setState('busy'); setError('')
    try { await accept(token); setState('done') } catch (e) {
      const err = e as { code?: string; status?: number; fieldErrors?: Record<string, string> }
      setState('idle')
      setError(err.code === 'conflict' ? t('auth.invite.accept.already')
        : err.fieldErrors?.token === 'expired' ? t('auth.invite.accept.expired')
        : err.code === 'not_found' ? t('auth.invite.accept.notFound')
        : err.code === 'rate_limited' ? t('auth.err.rateLimited') : t('auth.error'))
    }
  }
  return (
    <section aria-labelledby="inv-title">
      <h1 id="inv-title">{state === 'done' ? t('auth.invite.accept.doneTitle') : t('auth.invite.accept.title')}</h1>
      {!token ? <p role="alert" style={{ color: 'var(--color-danger, #b42318)' }}>{t('auth.invite.accept.noToken')}</p>
        : state === 'done' ? <><p role="status">{t('auth.invite.accept.done')}</p><Button data-variant="solid" render={<Link to="/console" />}>{t('auth.invite.accept.open')}</Button></>
        : loading ? <p role="status">{t('auth.working')}</p>
        : !user ? <>
            <p data-slot="lead">{t('auth.invite.accept.loginLead')}</p>
            <Row>
              <Button data-variant="solid" render={<Link to="/login" state={back} />}>{t('auth.login')}</Button>
              <Button render={<Link to={`/signup`} state={back} />}>{t('auth.invite.accept.signup')}</Button>
            </Row>
          </> : <>
            <p data-slot="lead">{t('auth.invite.accept.lead')}</p>
            {error && <p role="alert" style={{ color: 'var(--color-danger, #b42318)' }}>{error}</p>}
            <Button data-variant="solid" disabled={state === 'busy'} aria-busy={state === 'busy' || undefined} onClick={() => void go()}>{state === 'busy' ? t('auth.invite.accept.busy') : t('auth.invite.accept.button')}</Button>
          </>}
    </section>
  )
}
