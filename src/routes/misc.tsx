import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { PublicLayout } from '../layouts/PublicLayout'
const Legal = lazy(() => import('../pages/public/Legal').then((m) => ({ default: m.Legal })))
const ErrorPage = lazy(() => import('../pages/public/ErrorPage').then((m) => ({ default: m.ErrorPage })))

export const miscRoutes: RouteObject[] = [
  { element: <PublicLayout />, children: [
    { path: '/terms', element: <Legal kind="terms" /> },
    { path: '/privacy', element: <Legal kind="privacy" /> },
    { path: '*', element: <ErrorPage kind="notFound" /> },
  ] },
]
