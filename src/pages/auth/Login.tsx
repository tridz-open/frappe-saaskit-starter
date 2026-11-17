import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../data'
import { useT } from '../../i18n'
import { AuthForm } from './AuthForm'
import { AuthLink, AuthLinks } from './AuthLink'

export function Login() {
  const t = useT(); const { login } = useAuth(); const nav = useNavigate()
  const state = useLocation().state as { from?: string; signedOut?: boolean } | null
  const from = state?.from ?? '/console'
  return (
    <AuthForm title={t('auth.login.title')} submitLabel={t('auth.login')} busyLabel={t('auth.login.busy')} lead={t('auth.login.lead')}
      notice={state?.signedOut ? t('auth.signedOut') : undefined}
      fields={[
        { name: 'email', label: t('auth.email'), type: 'email', autoComplete: 'email', requiredMsg: t('auth.email.required') },
        { name: 'password', label: t('auth.password'), type: 'password', autoComplete: 'current-password', requiredMsg: t('auth.password.required'),
          labelAction: <AuthLink to="/forgot-password">{t('auth.forgotLink')}</AuthLink> },
      ]}
      onSubmit={async (v) => { await login(v.email, v.password); nav(from, { replace: true }) }}
      footer={<AuthLinks><span>{t('auth.noAccount')} <AuthLink to="/signup">{t('auth.signup')}</AuthLink></span></AuthLinks>} />
  )
}
