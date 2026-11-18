import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
const AdminTenantsPage = lazy(() => import('../pages/admin/AdminTenantsPage').then((m) => ({ default: m.AdminTenantsPage })))
const AdminBetaPage = lazy(() => import('../pages/admin/AdminBetaPage').then((m) => ({ default: m.AdminBetaPage })))

/** Children of the single `/console` layout route. Each page checks `site.adminRole` itself (forbidden state for everyone else). */
export const adminChildren: RouteObject[] = [
  { path: 'admin/tenants', element: <AdminTenantsPage /> },
  { path: 'admin/beta', element: <AdminBetaPage /> },
]
