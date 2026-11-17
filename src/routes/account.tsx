import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
const AccountPage = lazy(() => import('../pages/account/AccountPage').then((m) => ({ default: m.AccountPage })))
const TeamPage = lazy(() => import('../pages/account/TeamPage').then((m) => ({ default: m.TeamPage })))

/** Children of the single `/console` layout route (composed in console.tsx). */
export const accountChildren: RouteObject[] = [
  { path: 'account', element: <AccountPage /> },
  { path: 'team', element: <TeamPage /> },
]

/** Top-level routes: none. Account pages live under the shared console layout. */
export const accountRoutes: RouteObject[] = []
