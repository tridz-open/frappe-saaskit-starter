import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../data'
import { useSaas } from '../app/context'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const { site } = useSaas()
  const loc = useLocation()
  if (loading) return <p role="status">{site.labels.loading}</p>
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  return <>{children}</>
}
