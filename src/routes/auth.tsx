import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
const Login = lazy(() => import('../pages/auth/Login').then((m) => ({ default: m.Login })))
const Signup = lazy(() => import('../pages/auth/Signup').then((m) => ({ default: m.Signup })))
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })))
const VerifyEmail = lazy(() => import('../pages/auth/VerifyEmail').then((m) => ({ default: m.VerifyEmail })))
const AcceptInvite = lazy(() => import('../pages/auth/AcceptInvite').then((m) => ({ default: m.AcceptInvite })))
const Logout = lazy(() => import('../pages/auth/Logout').then((m) => ({ default: m.Logout })))

export const authRoutes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/verify-email', element: <VerifyEmail /> },
      { path: '/accept-invite', element: <AcceptInvite /> },
      { path: '/logout', element: <Logout /> },
    ],
  },
]
