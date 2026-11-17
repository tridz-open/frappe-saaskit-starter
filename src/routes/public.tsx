import type { RouteObject } from 'react-router-dom'
import { PublicLayout } from '../layouts/PublicLayout'
import { Landing } from '../pages/public/Landing'
import { Pricing } from '../pages/public/Pricing'

export const publicRoutes: RouteObject[] = [
  { element: <PublicLayout />, children: [
    { path: '/', element: <Landing /> },
    { path: '/pricing', element: <Pricing /> },
  ] },
]
