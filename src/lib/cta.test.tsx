import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { setDataAdapter } from '../data'
import { signupOpen, requestAccessHref } from './cta'
import { Landing } from '../pages/public/Landing'
import { Pricing } from '../pages/public/Pricing'
import { PublicLayout } from '../layouts/PublicLayout'
import { SaasProvider, defaultToaster } from '../app/context'
import { site as base, type Site } from '../config/site'
import type { PublicConfig } from '../data/types'

const OPEN: PublicConfig = { publicSignup: true, signupMode: 'open', loaded: true }
const mount = (ui: React.ReactNode, cfg: PublicConfig, over: Partial<Site> = {}) => {
  setDataAdapter({ usePublicConfig: () => cfg })
  return render(<SaasProvider value={{ site: { ...base, ...over }, slots: {}, toast: defaultToaster }}><MemoryRouter>{ui}</MemoryRouter></SaasProvider>)
}
afterEach(() => { cleanup(); setDataAdapter({ usePublicConfig: () => OPEN }) })

describe('signupOpen', () => {
  it('is open only when the server says so', () => {
    expect(signupOpen(OPEN)).toBe(true)
    expect(signupOpen({ publicSignup: true, loaded: true })).toBe(true)
    expect(signupOpen({ publicSignup: false, signupMode: 'invite', loaded: true })).toBe(false)
    expect(signupOpen({ publicSignup: true, signupMode: 'closed', loaded: true })).toBe(false)
    expect(signupOpen({ publicSignup: false, loaded: false })).toBe(false)
    expect(signupOpen(null)).toBe(false)
  })
})

describe('requestAccessHref', () => {
  it('falls back to a mailto of the support email with the subject', () => {
    expect(requestAccessHref({ requestAccessUrl: '', supportEmail: 'help@x.test' }, 'Request access: Pro')).toBe('mailto:help@x.test?subject=Request%20access%3A%20Pro')
  })
  it('uses a configured URL as is, and adds a subject to a bare mailto', () => {
    expect(requestAccessHref({ requestAccessUrl: 'https://x.test/waitlist', supportEmail: 'a@b.c' }, 's')).toBe('https://x.test/waitlist')
    expect(requestAccessHref({ requestAccessUrl: 'mailto:sales@x.test', supportEmail: 'a@b.c' }, 'hi there')).toBe('mailto:sales@x.test?subject=hi%20there')
  })
})

describe('open mode', () => {
  it('Landing shows Get started -> /signup', () => {
    mount(<Landing />, OPEN)
    const links = screen.getAllByRole('link', { name: 'Get started' })
    expect(links[0].getAttribute('href')).toBe('/signup')
    expect(screen.queryByText('Request access')).toBeNull()
  })
  it('Pricing plan buttons go to checkout', async () => {
    mount(<Pricing />, OPEN)
    const l = (await screen.findAllByRole('link', { name: /^Choose / }))[0]
    expect(l.getAttribute('href')).toMatch(/^\/checkout\?plan=/)
  })
  it('header keeps the Sign up CTA', () => {
    mount(<PublicLayout />, OPEN)
    expect(screen.getAllByRole('link', { name: 'Sign up' })[0].getAttribute('href')).toBe('/signup')
  })
})

describe('invite mode', () => {
  const CLOSED: PublicConfig = { publicSignup: false, signupMode: 'invite', loaded: true }
  it('Landing shows Request access mailto', () => {
    mount(<Landing />, CLOSED, { supportEmail: 'help@x.test' })
    expect(screen.queryByRole('link', { name: 'Get started' })).toBeNull()
    expect(screen.getAllByRole('link', { name: 'Request access' })[0].getAttribute('href')).toBe('mailto:help@x.test?subject=Request%20access')
  })
  it('Pricing buttons honour requestAccessUrl', async () => {
    mount(<Pricing />, CLOSED, { requestAccessUrl: 'https://x.test/access' })
    const links = await screen.findAllByRole('link', { name: 'Request access' })
    expect(links[0].getAttribute('href')).toBe('https://x.test/access')
    expect(screen.queryByRole('link', { name: /^Choose / })).toBeNull()
  })
  it('header CTA becomes Request access', () => {
    mount(<PublicLayout />, CLOSED, { supportEmail: 'help@x.test' })
    expect(screen.queryByRole('link', { name: 'Sign up' })).toBeNull()
    expect(screen.getAllByRole('link', { name: 'Request access' })[0].getAttribute('href')).toContain('mailto:help@x.test')
  })
  it('unknown config (still loading) is closed', () => {
    mount(<Landing />, { publicSignup: false, loaded: false })
    expect(screen.getAllByRole('link', { name: 'Request access' }).length).toBeGreaterThan(0)
  })
})
