import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Skeleton } from '../../components/primitives'
import { useAuth } from '../../data'
import { useSaas } from '../../app/context'
import { useT } from '../../i18n'

export const isAdmin = (roles: string[] | undefined, adminRole: string) => !!roles?.includes(adminRole)

export function Forbidden() {
  const t = useT()
  return <Alert tone="danger" data-testid="admin-forbidden">{t('admin.forbidden')} <Link to="/console">{t('admin.forbidden.back')}</Link></Alert>
}

/** Renders children only for users holding `site.adminRole`. The data hooks live in the children, so non-admins never hit admin endpoints. */
export function AdminGate({ children }: { children: ReactNode }) {
  const t = useT()
  const { user, loading } = useAuth()
  const { site } = useSaas()
  if (loading) return <div role="status"><Skeleton height="2rem" /><p className="muted">{t('admin.loading')}</p></div>
  if (!isAdmin(user?.roles, site.adminRole)) return <Forbidden />
  return <>{children}</>
}

/** Loading / error / forbidden states shared by the admin lists. Returns null when the data can be shown. */
export function AdminStatus({ loading, error, forbidden, refresh }: { loading: boolean; error: boolean; forbidden: boolean; refresh: () => void }) {
  const t = useT()
  if (forbidden) return <Forbidden />
  if (loading) return <div role="status"><Skeleton height="1rem" /><p className="muted">{t('admin.loading')}</p></div>
  if (error) return <Alert tone="danger">{t('admin.error')} <button type="button" onClick={refresh}>{t('admin.retry')}</button></Alert>
  return null
}
