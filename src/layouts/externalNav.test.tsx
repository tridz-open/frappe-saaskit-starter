import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PublicLayout } from './PublicLayout'
import { ConsoleLayout } from './ConsoleLayout'
import { Brand } from '../components/Brand'
import { SaasProvider, defaultToaster } from '../app/context'
import { site as base, type Site } from '../config/site'

const mount = (ui: React.ReactNode, over: Partial<Site> = {}) =>
  render(<SaasProvider value={{ site: { ...base, ...over }, slots: {}, toast: defaultToaster }}><MemoryRouter>{ui}</MemoryRouter></SaasProvider>)
afterEach(cleanup)
beforeAll(() => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
})

describe('external nav items', () => {
  it('public nav: renders a plain anchor, with noopener when newTab', () => {
    mount(<PublicLayout />, { nav: [...base.nav, { label: 'Docs', href: 'https://docs.example.test/', newTab: true }, { label: 'Blog', href: 'https://blog.example.test/' }] })
    const docs = screen.getAllByRole('link', { name: 'Docs' })[0]
    expect(docs.getAttribute('href')).toBe('https://docs.example.test/')
    expect(docs.getAttribute('target')).toBe('_blank')
    expect(docs.getAttribute('rel')).toBe('noopener noreferrer')
    const blog = screen.getAllByRole('link', { name: 'Blog' })[0]
    expect(blog.getAttribute('target')).toBeNull()
  })
  it('public nav: internal links are unchanged', () => {
    mount(<PublicLayout />)
    expect(screen.getAllByRole('link', { name: 'Pricing' })[0].getAttribute('href')).toBe('/pricing')
  })
  it('console nav: external item lands in the "More" group as an anchor', () => {
    mount(<ConsoleLayout />, { consoleNav: [...base.consoleNav, { label: 'Docs', href: 'https://docs.example.test/', newTab: true }] })
    const a = screen.getAllByRole('link', { name: 'Docs' })[0]
    expect(a.getAttribute('href')).toBe('https://docs.example.test/')
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('aria-current')).toBeNull()
  })
})

describe('logoHref', () => {
  it('defaults to a router link to /', () => {
    mount(<Brand />)
    expect(screen.getByRole('link').getAttribute('href')).toBe('/')
  })
  it('links to an external URL when set', () => {
    mount(<Brand />, { logoHref: 'https://www.example.test/' })
    expect(screen.getByRole('link').getAttribute('href')).toBe('https://www.example.test/')
  })
})
