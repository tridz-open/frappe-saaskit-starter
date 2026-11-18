import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setDataAdapter } from '../../data'
import { useCapabilities as fixtureCapabilities } from '../../data/fixtureHooks'
import { LIVE_CAPABILITIES } from '../../data/liveMapping'
import type { Instance } from '../../data/types'
import { InstanceDetailPage } from './InstanceDetailPage'

const inst: Instance = { id: 'i1', name: 'acme', url: 'https://acme.example.test', status: 'running', planId: 'pro', createdAt: '2026-01-01T00:00:00Z' }
const api = { instances: [inst], loading: false, error: false, refresh: async () => {}, get: async () => inst }
const mount = (caps: typeof LIVE_CAPABILITIES) => {
  setDataAdapter({ useCapabilities: () => caps, useInstances: (() => api) as never })
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/console/instances/i1']}>
        <Routes><Route path="/console/instances/:id" element={<InstanceDetailPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
afterEach(cleanup)

describe('Make a copy button follows the duplicate capability', () => {
  it('is hidden in live mode', async () => {
    mount(LIVE_CAPABILITIES)
    await waitFor(() => expect(screen.getByTestId('open-primary')).toBeTruthy())
    expect(screen.queryByRole('button', { name: 'Make a copy' })).toBeNull()
  })
  it('is shown in fixture mode', async () => {
    mount(fixtureCapabilities())
    expect(await screen.findByRole('button', { name: 'Make a copy' })).toBeTruthy()
  })
})
