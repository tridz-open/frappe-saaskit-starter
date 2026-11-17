import { useEffect, useState } from 'react'
import { useAuth } from '../../data'
import { useT } from '../../i18n'
import { Button } from '@ui-sdk/react/button'
import { AuthForm } from './AuthForm'
import { AuthLink, AuthLinks } from './AuthLink'

export function ForgotPassword() {
  const t = useT(); const { forgotPassword } = useAuth(); const [sentTo, setSentTo] = useState('')
  const [wait, setWait] = useState(0)
  useEffect(() => { if (wait <= 0) return; const id = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(id) }, [wait])
  async function resend() { try { await forgotPassword(sentTo) } catch { /* neutral */ } setWait(30) }
  return (
    <AuthForm title={t('auth.forgot.title')} doneTitle={t('auth.forgot.sentTitle')} submitLabel={t('auth.forgot.send')} busyLabel={t('auth.forgot.busy')} lead={t('auth.forgot.lead')}
      done={sentTo ? <><p>{t('auth.forgot.sent', { email: sentTo })}</p>
        <Button type="button" disabled={wait > 0} onClick={() => void resend()}>{wait > 0 ? t('auth.forgot.resendIn', { s: wait }) : t('auth.forgot.resend')}</Button></> : null}
      fields={[{ name: 'email', label: t('auth.email'), type: 'email', autoComplete: 'email', requiredMsg: t('auth.email.required') }]}
      onSubmit={async (v) => { await forgotPassword(v.email); setSentTo(v.email); setWait(30) }}
      footer={<AuthLinks><AuthLink to="/login">{t('auth.backToLogin')}</AuthLink></AuthLinks>} />
  )
}
