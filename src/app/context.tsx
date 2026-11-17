import { createContext, useContext, type ComponentType, type ReactNode } from 'react'
import { createToaster } from '@ui-sdk/react/toast'
import { site as defaultSite, type Site } from '../config/site'

export type Toaster = ReturnType<typeof createToaster>
export type SaasSlots = {
  Logo?: ComponentType
  Footer?: ComponentType
  LandingHero?: ComponentType
  [name: string]: ComponentType | undefined
}
export type SaasContextValue = { site: Site; slots: SaasSlots; toast: Toaster; data?: import("../data").DataOverrides }

export const defaultToaster: Toaster = createToaster()
export const SaasContext = createContext<SaasContextValue>({ site: defaultSite, slots: {}, toast: defaultToaster })
export const useSaas = () => useContext(SaasContext)
export const useSlots = () => useSaas().slots
export const useToast = () => useSaas().toast

export function SaasProvider({ value, children }: { value: SaasContextValue; children: ReactNode }) {
  return <SaasContext.Provider value={value}>{children}</SaasContext.Provider>
}
