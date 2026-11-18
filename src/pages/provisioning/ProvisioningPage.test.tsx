import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setDataAdapter } from '../../data'
import type { ProvisioningState } from '../../data/types'
import ProvisioningPage, { type ProvisioningPageProps } from './ProvisioningPage'

const state = (p: Partial<ProvisioningState>): ProvisioningState => ({ loading: false, status: 'active', progress: 100, steps: [], url: 'https://acme.example.test', error: null, ...p })
const mount = (s: ProvisioningState, props: ProvisioningPageProps = {}) => {
  setDataAdapter({ useProvisioning: () => s })
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/provisioning/acme']}>
        <Routes><Route path="/provisioning/:tenant" element={<ProvisioningPage {...props} />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
afterEach(cleanup)

describe('ProvisioningPage readyAction', () => {
  it('shows the default Open link when no readyAction is given', () => {
    mount(state({}))
    expect(screen.getByRole('link', { name: 'Open my workspace' }).getAttribute('href')).toBe('https://acme.example.test')
  })
  it('replaces the Open link with a node', () => {
    mount(state({}), { readyAction: <button>Sign in</button> })
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Open my workspace' })).toBeNull()
  })
  it('calls a function with the state, and still renders when there is no url', () => {
    mount(state({ url: undefined }), { readyAction: (s) => <span>ready {s.status}</span> })
    expect(screen.getByText('ready active')).toBeTruthy()
  })
  it('is not shown while provisioning', () => {
    mount(state({ status: 'provisioning', progress: 40, url: undefined }), { readyAction: <button>Sign in</button> })
    expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull()
  })
})
