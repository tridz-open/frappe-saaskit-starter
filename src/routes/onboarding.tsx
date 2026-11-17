import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RequireAuth } from '../components/RequireAuth'
import { AuthLayout } from '../layouts/AuthLayout'
const Onboarding = lazy(() => import('../pages/onboarding/Onboarding').then((m) => ({ default: m.Onboarding })))

export const onboardingRoutes: RouteObject[] = [
  { element: <AuthLayout variant="focus" />, children: [{ path: '/onboarding', element: <RequireAuth><Onboarding /></RequireAuth> }] },
]
