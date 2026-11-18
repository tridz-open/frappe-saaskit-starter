import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { setDataAdapter } from '../../data'
import type { AdminTenant, BetaEntry, User } from '../../data/types'
import { AdminTenantsPage } from './AdminTenantsPage'
import { AdminBetaPage, isValidEntry, parseEntries } from './AdminBetaPage'
import { SaasProvider, defaultToaster } from '../../app/context'
import { site } from '../../config/site'

const admin: User = { id: 'a', email: 'a@x.test', name: 'A', emailVerified: true, onboarded: true, roles: ['SaaS Admin'] }
const customer: User = { ...admin, roles: ['Customer'] }
const asUser = (user: User | null, loading = false) => setDataAdapter({ useAuth: (() => ({ user, loading })) as never })
const mount = (ui: React.ReactNode) => render(<SaasProvider value={{ site, slots: {}, toast: defaultToaster }}><MemoryRouter>{ui}</MemoryRouter></SaasProvider>)
const base = { loading: false, error: false, forbidden: false, refresh: () => {} }
const tenant: AdminTenant = { id: 't1', slug: 'acme', url: 'https://acme.example.test', status: 'active', planId: 'pro', createdAt: '2026-01-02T00:00:00Z' }
const beta = (over: object = {}) => ({ entries: [] as BetaEntry[], signupMode: 'invite', ...base, add: vi.fn(async () => ({ added: [], alreadyListed: [], invitesSent: [], invitesFailed: [], skippedDomains: [] })), remove: vi.fn(async () => {}), resend: vi.fn(async () => {}), ...over })
afterEach(cleanup)

describe('admin nav', () => {
  it('default adminNav routes to both pages', () => {
    expect(site.adminNav.map((n) => n.to)).toEqual(['/console/admin/tenants', '/console/admin/beta'])
  })
})

describe('AdminTenantsPage', () => {
  it('forbids non-admins without calling the data hook', () => {
    const hook = vi.fn(() => ({ tenants: [], ...base }))
    asUser(customer); setDataAdapter({ useAdminTenants: hook as never })
    mount(<AdminTenantsPage />)
    expect(screen.getByTestId('admin-forbidden')).toBeTruthy()
    expect(hook).not.toHaveBeenCalled()
  })
  it('shows loading, then rows', () => {
    asUser(admin); setDataAdapter({ useAdminTenants: (() => ({ tenants: [], ...base, loading: true })) as never })
    mount(<AdminTenantsPage />)
    expect(screen.getByRole('status').textContent).toContain('Loading')
    cleanup()
    setDataAdapter({ useAdminTenants: (() => ({ tenants: [tenant], ...base })) as never })
    mount(<AdminTenantsPage />)
    expect(screen.getByTestId('tenant-row').textContent).toContain('acme.example.test')
  })
  it('shows the empty state', () => {
    asUser(admin); setDataAdapter({ useAdminTenants: (() => ({ tenants: [], ...base })) as never })
    mount(<AdminTenantsPage />)
    expect(screen.getByText('No tenants yet')).toBeTruthy()
  })
  it('shows an error with retry', () => {
    const refresh = vi.fn()
    asUser(admin); setDataAdapter({ useAdminTenants: (() => ({ tenants: [], ...base, error: true, refresh })) as never })
    mount(<AdminTenantsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refresh).toHaveBeenCalled()
  })
  it('shows forbidden when the server answers 403', () => {
    asUser(admin); setDataAdapter({ useAdminTenants: (() => ({ tenants: [], ...base, forbidden: true })) as never })
    mount(<AdminTenantsPage />)
    expect(screen.getByTestId('admin-forbidden')).toBeTruthy()
  })
})

describe('AdminBetaPage', () => {
  it('forbids non-admins', () => {
    asUser(customer); setDataAdapter({ useAdminBetaAccess: (() => beta()) as never })
    mount(<AdminBetaPage />)
    expect(screen.getByTestId('admin-forbidden')).toBeTruthy()
  })
  it('loading, error, forbidden and empty states', () => {
    asUser(admin)
    for (const [over, text] of [[{ loading: true }, 'Loading'], [{ error: true }, 'We could not load this page.'], [{ forbidden: true }, 'Admin access required.'], [{}, 'Nobody is on the list yet']] as const) {
      setDataAdapter({ useAdminBetaAccess: (() => beta(over)) as never })
      mount(<AdminBetaPage />)
      expect(screen.getByText(text, { exact: false })).toBeTruthy()
      cleanup()
    }
  })
  it('lists entries and removes / resends', async () => {
    const h = beta({ entries: [{ pattern: 'ada@x.test', kind: 'email', note: 'Pilot', invitedAt: null, accountExists: true, verified: true, hasTenant: false }, { pattern: '@x.org', kind: 'domain', note: null, invitedAt: null, accountExists: null, verified: null, hasTenant: null }] })
    asUser(admin); setDataAdapter({ useAdminBetaAccess: (() => h) as never })
    mount(<AdminBetaPage />)
    expect(screen.getAllByTestId('beta-row')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Resend invite' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Resend invite' }))
    await waitFor(() => expect(h.resend).toHaveBeenCalledWith('ada@x.test'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    await waitFor(() => expect(h.remove).toHaveBeenCalledWith('@x.org'))
  })
  it('validates and adds entries', async () => {
    const h = beta({ add: vi.fn(async () => ({ added: ['b@x.test'], alreadyListed: [], invitesSent: [], invitesFailed: [], skippedDomains: [] })) })
    asUser(admin); setDataAdapter({ useAdminBetaAccess: (() => h) as never })
    mount(<AdminBetaPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByTestId('admin-msg').textContent).toContain('at least one')
    fireEvent.input(screen.getByLabelText('Emails or @domains'), { target: { value: 'nope' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByTestId('admin-msg').textContent).toContain('not valid')
    fireEvent.input(screen.getByLabelText('Emails or @domains'), { target: { value: 'B@x.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(h.add).toHaveBeenCalledWith(['b@x.test'], false, ''))
    await waitFor(() => expect(screen.getByTestId('admin-msg').textContent).toContain('Added 1'))
  })
  it('reports a failed add', async () => {
    const h = beta({ add: vi.fn(async () => { throw new Error('boom') }) })
    asUser(admin); setDataAdapter({ useAdminBetaAccess: (() => h) as never })
    mount(<AdminBetaPage />)
    fireEvent.input(screen.getByLabelText('Emails or @domains'), { target: { value: 'b@x.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(screen.getByTestId('admin-msg').textContent).toBe('boom'))
  })
})

describe('entry parsing', () => {
  it('splits, lowercases and dedupes', () => { expect(parseEntries('A@x.test, a@x.test;\n@X.org')).toEqual(['a@x.test', '@x.org']) })
  it('validates emails and domains', () => { expect(isValidEntry('@x.org')).toBe(true); expect(isValidEntry('a@x.org')).toBe(true); expect(isValidEntry('x.org')).toBe(false) })
})
