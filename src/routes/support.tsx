import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
const NotificationsPage = lazy(() => import('../pages/support/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const TicketsPage = lazy(() => import('../pages/support/TicketsPage').then((m) => ({ default: m.TicketsPage })))
const TicketPage = lazy(() => import('../pages/support/TicketPage').then((m) => ({ default: m.TicketPage })))

/** Children of the single `/console` layout route (composed in console.tsx). */
export const supportChildren: RouteObject[] = [
  { path: 'notifications', element: <NotificationsPage /> },
  { path: 'support', element: <TicketsPage /> },
  { path: 'support/:id', element: <TicketPage /> },
]

/** Top-level routes: none. Support pages live under the shared console layout. */
export const supportRoutes: RouteObject[] = []
