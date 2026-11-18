import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../data'
import { useT } from '../../i18n'
import { Button } from '@ui-sdk/react/button'
import { Link } from 'react-router-dom'
import { AuthForm } from './AuthForm'
import { AuthLink, AuthLinks } from './AuthLink'

import { ExperimentalBadge } from '../../components/primitives'
export function ResetPassword() {
  const t = useT(); const { resetPassword } = useAuth(); const [done, setDone] = useState(false)
  const [params] = useSearchParams()
  const token = params.get('token') ?? params.get('key') ?? ''
  if (!token && !done) {
    return (
      <section aria-labelledby="auth-title">
        <p><ExperimentalBadge /></p>
        <h1 id="auth-title">{t('auth.reset.title')}</h1>
        <p role="alert" style={{ color: 'var(--color-danger, #b42318)' }}>{t('auth.reset.missing')}</p>
        <Button data-variant="solid" render={<Link to="/forgot-password" />}>{t('auth.reset.newLink')}</Button>
      </section>
    )
  }
  return (
    <AuthForm experimental title={t('auth.reset.title')} doneTitle={t('auth.reset.doneTitle')} submitLabel={t('auth.reset.submit')} busyLabel={t('auth.reset.busy')}
      done={done ? <><p>{t('auth.reset.done')}</p><Button data-variant="solid" render={<Link to="/login" />}>{t('auth.reset.loginNow')}</Button></> : null}
      errorMessages={{ invalid_token: t('auth.reset.missing') }}
      fields={[{ name: 'password', label: t('auth.newPassword'), type: 'password', autoComplete: 'new-password', minLength: 8, requiredMsg: t('auth.newPassword.required'), hint: t('auth.passwordHint', { min: 8 }) }]}
      onSubmit={async (v) => { await resetPassword(token, v.password); setDone(true) }}
      footer={done ? undefined : <AuthLinks><AuthLink to="/forgot-password">{t('auth.reset.newLink')}</AuthLink><AuthLink to="/login">{t('auth.backToLogin')}</AuthLink></AuthLinks>} />
  )
}
