// Single swap point. The default adapter is chosen by VITE_DATA_ADAPTER (fixtures unless 'saaskit').
// The exports below are STABLE wrapper hooks that delegate to a module-level current adapter, so
// `setDataAdapter()` (called by createSaasApp({ data })) can swap/override hooks at runtime.
// The adapter must be fixed before the first render so every wrapper keeps calling the same hooks.
import { createElement, type ComponentType, type ReactNode } from 'react'
import * as fx from './fixtureHooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export * from './types'
export { scenario, type Scenario } from './fixtures'

type Hooks = typeof fx
/** Hook surface plus an optional provider (the saaskit adapter supplies one). */
export type DataAdapter = Hooks & { DataProvider: ComponentType<{ children?: ReactNode }> }

// Fixture mode still mounts a QueryClientProvider so pages can use react-query hooks in both modes.
const fixtureClient = new QueryClient()
const FixtureProvider = ({ children }: { children?: ReactNode }) => createElement(QueryClientProvider, { client: fixtureClient }, children)
let current: DataAdapter = { ...fx, DataProvider: FixtureProvider }

/** Load the live adapter lazily so fixture builds never need the SDK packages. */
export const loadSaaskitAdapter = async (): Promise<DataAdapter> => (await import('./saaskit')) as unknown as DataAdapter

/** Select the default adapter from VITE_DATA_ADAPTER. Await this before the first render. */
export async function loadDataAdapter() {
  if (import.meta.env?.VITE_DATA_ADAPTER === 'saaskit') current = { ...(await loadSaaskitAdapter()) }
}

/** Typed, partial hook overrides: any subset of the data hooks (plus an optional provider). */
export type DataOverrides = Partial<DataAdapter>

/** Merge a (partial) adapter over the current one. Call before the first render. */
export function setDataAdapter(a: DataOverrides) {
  const defined = Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined))
  current = { ...current, ...defined } as DataAdapter
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = <K extends keyof Hooks>(k: K): Hooks[K] => ((...args: any[]) => (current[k] as any)(...args)) as Hooks[K]

export const DataProvider: DataAdapter['DataProvider'] = ({ children }) => createElement(current.DataProvider, null, children)
export const useAuth = w('useAuth')
export const usePlans = w('usePlans')
export const useSubscription = w('useSubscription')
export const useCheckout = w('useCheckout')
export const useInstances = w('useInstances')
export const useProvisioningJob = w('useProvisioningJob')
export const useProvisioning = w('useProvisioning')
export const useBackups = w('useBackups')
export const useInvoices = w('useInvoices')
export const usePaymentMethods = w('usePaymentMethods')
export const useUsage = w('useUsage')
export const useSessions = w('useSessions')
export const useApiTokens = w('useApiTokens')
export const useTeam = w('useTeam')
export const useNotifications = w('useNotifications')
export const useTickets = w('useTickets')
export const useUpdateProfile = w('useUpdateProfile')
export const useInvoicePdf = w('useInvoicePdf')
export const invoicePdfUrl = w('invoicePdfUrl')
export const useSignupFields = w('useSignupFields')
export const useSiteDomain = w('useSiteDomain')
export const usePublicConfig = w('usePublicConfig')
export const useSlugAvailability = w('useSlugAvailability')
export const useCapabilities = w('useCapabilities')
export const useAcceptInvite = w('useAcceptInvite')
