import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
const PlanPage = lazy(() => import('../pages/billing/PlanPage'))
const BillingPage = lazy(() => import('../pages/billing/BillingPage'))
const InvoicePage = lazy(() => import('../pages/billing/InvoicePage'))

/** Children of the single `/console` layout route (composed in console.tsx). */
export const billingChildren: RouteObject[] = [
  { path: 'plan', element: <PlanPage /> },
  { path: 'billing', element: <BillingPage /> },
  { path: 'billing/invoices/:id', element: <InvoicePage /> },
]

/** Top-level routes: none. Billing pages live under the shared console layout. */
export const billingRoutes: RouteObject[] = []
