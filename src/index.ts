import '@ui-sdk/core/web.css'
import './styles/foundation.css'
import { Suspense, createElement, useEffect, type ComponentType } from 'react'
import { RouterProvider, createBrowserRouter, type RouteObject } from 'react-router-dom'
import type { OnboardingField } from './data/types'
import { site as baseSite, type SiteConfig } from './config/site'
import { DataProvider, loadDataAdapter, loadSaaskitAdapter, setDataAdapter, type DataAdapter, type DataOverrides } from './data'
import { routes as defaultRoutes } from './routes'
import { SaasProvider, defaultToaster, type SaasSlots } from './app/context'

export { SaasContext, SaasProvider, useSaas, useSlots, useToast } from './app/context'
export type { SaasSlots, SaasContextValue, Toaster } from './app/context'
export type { SiteConfig } from './config/site'

export * from './components/primitives'

export { setDataAdapter, loadDataAdapter, loadSaaskitAdapter }
export type { DataAdapter, DataOverrides }
export type { OnboardingField } from './data/types'

export type CreateSaasAppOptions = {
  site?: SiteConfig
  /** CSS custom properties applied to :root, e.g. { '--color-accent': '#0a7' } */
  theme?: Record<string, string>
  routes?: {
    /** Replace the route with this path (matched at any depth; a leading '/' is optional). */
    override?: Record<string, Partial<RouteObject>>
    /** Extra top-level routes, inserted before the catch-all. */
    extra?: RouteObject[]
  }
  data?: DataOverrides
  slots?: SaasSlots
  /** Extra onboarding fields (recipe signup schema). Collected values are sent as `recipe_fields` on checkout. Overrides the API template schema. */
  onboardingFields?: OnboardingField[]
}

const norm = (p?: string) => (p ?? '').replace(/^\/+|\/+$/g, '')

function applyOverrides(list: RouteObject[], over: Record<string, Partial<RouteObject>>, base = ''): RouteObject[] {
  return list.map((r) => {
    const full = r.path ? [base, norm(r.path)].filter(Boolean).join('/') : base
    const hit = r.path ? Object.entries(over).find(([k]) => norm(k) === full) : undefined
    const next = hit ? ({ ...r, ...hit[1] } as RouteObject) : r
    return next.children ? ({ ...next, children: applyOverrides(next.children, over, full) } as RouteObject) : next
  })
}

export function createSaasApp(opts: CreateSaasAppOptions = {}) {
  const { site: siteOpts, theme, routes: ro, data, slots = {}, onboardingFields } = opts
  if (onboardingFields) baseSite.onboardingFields = onboardingFields
  // Mutate the shared site object so i18n and every module reading config/site sees the overrides.
  if (siteOpts) {
    const { labels, ...rest } = siteOpts
    Object.assign(baseSite, rest)
    if (labels) Object.assign(baseSite.labels, labels)
  }
  let routes = ro?.override ? applyOverrides(defaultRoutes, ro.override) : [...defaultRoutes]
  if (ro?.extra?.length) routes = [...routes.slice(0, -1), ...ro.extra, routes[routes.length - 1]]
  // Select the data adapter at runtime, before the first render (hooks must stay stable).
  if (data) setDataAdapter(data)
  const router = createBrowserRouter(routes)
  const value = { site: baseSite, slots, toast: defaultToaster, data }

  const App: ComponentType = () => {
    useEffect(() => {
      if (!theme) return
      const root = document.documentElement
      for (const [k, v] of Object.entries(theme)) root.style.setProperty(k, v)
      return () => { for (const k of Object.keys(theme)) root.style.removeProperty(k) }
    }, [])
    // children passed as a prop: this is a .ts file and SaasProvider's props type requires it.
    // oxlint-disable-next-line react/no-children-prop
    return createElement(SaasProvider, { value, children: createElement(DataProvider, null, createElement(Suspense, { fallback: null }, createElement(RouterProvider, { router }))) })
  }
  return { App, router, routes }
}
