import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../data'
import { useT } from '../../i18n'

export function Logout() {
  const t = useT(); const { user, loading, logout } = useAuth(); const nav = useNavigate()
  useEffect(() => {
    if (!loading && user) logout().then(() => nav('/login', { replace: true, state: { signedOut: true } }), () => nav('/login', { replace: true, state: { signedOut: true } }))
  }, [loading, user, logout, nav])
  if (!loading && !user) return <Navigate to="/login" replace state={{ signedOut: true }} />
  return <p role="status" aria-live="polite">{t('auth.logout.working')}</p>
}
