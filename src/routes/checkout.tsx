import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RequireAuth } from '../components/RequireAuth'
import { AuthLayout } from '../layouts/AuthLayout'
const CheckoutPage = lazy(() => import('../pages/checkout/CheckoutPage'))
const CheckoutSuccessPage = lazy(() => import('../pages/checkout/CheckoutResultPage').then((m) => ({ default: m.CheckoutSuccessPage })))
const CheckoutCancelPage = lazy(() => import('../pages/checkout/CheckoutResultPage').then((m) => ({ default: m.CheckoutCancelPage })))
const ProvisioningPage = lazy(() => import('../pages/provisioning/ProvisioningPage'))

export const checkoutRoutes: RouteObject[] = [
  {
    element: <AuthLayout variant="focus" />,
    children: [
      { path: '/checkout', element: <RequireAuth><CheckoutPage /></RequireAuth> },
      { path: '/checkout/success', element: <RequireAuth><CheckoutSuccessPage /></RequireAuth> },
      { path: '/checkout/cancel', element: <RequireAuth><CheckoutCancelPage /></RequireAuth> },
      { path: '/provisioning/:tenant', element: <RequireAuth><ProvisioningPage /></RequireAuth> },
    ],
  },
]
