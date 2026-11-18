import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ConsoleLayout } from '../layouts/ConsoleLayout'
import { RequireAuth } from '../components/RequireAuth'
import { accountChildren } from './account'
import { billingChildren } from './billing'
import { supportChildren } from './support'
import { adminChildren } from './admin'
const InstancesPage = lazy(() => import('../pages/console/InstancesPage').then((m) => ({ default: m.InstancesPage })))
const InstanceDetailPage = lazy(() => import('../pages/console/InstanceDetailPage').then((m) => ({ default: m.InstanceDetailPage })))
const CreateInstancePage = lazy(() => import('../pages/console/CreateInstancePage').then((m) => ({ default: m.CreateInstancePage })))
const BackupsPage = lazy(() => import('../pages/console/BackupsPage').then((m) => ({ default: m.BackupsPage })))

/** The one and only `/console` layout route; every console page is a child. */
export const consoleRoutes: RouteObject[] = [
  {
    path: '/console',
    element: <RequireAuth><ConsoleLayout /></RequireAuth>,
    children: [
      { index: true, element: <InstancesPage /> },
      { path: 'instances/new', element: <CreateInstancePage /> },
      { path: 'instances/:id', element: <InstanceDetailPage /> },
      { path: 'backups', element: <BackupsPage /> },
      ...billingChildren,
      ...accountChildren,
      ...supportChildren,
      ...adminChildren,
    ],
  },
]
