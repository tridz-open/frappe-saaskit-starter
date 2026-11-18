import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { Footer } from '../components/Footer'
import { AppToasts } from '../components/AppToasts'
import { useSaas } from '../app/context'
import type { InternalNavItem, NavItem } from '../config/site'
import { CtaButton } from '../lib/CtaButton'
import { useSignupCta } from '../lib/cta'
import { isExternal, navKey as itemKey, NavAnchor } from '../lib/nav'

const css = `
[data-header="public"] { padding: 0; gap: 0; }
[data-header="public"] > [data-slot="header-inner"] { width: 100%; max-width: var(--container-max); margin-inline: auto; padding-inline: var(--space-6); min-height: var(--header-height); display: flex; align-items: center; gap: var(--space-6); }
[data-header="public"] [data-slot="brand"] { flex: none; }
[data-slot="public-nav"] { display: flex; align-items: center; gap: var(--space-1); flex: 1; min-width: 0; }
[data-slot="public-nav"] ul { display: flex; align-items: center; gap: var(--space-1); list-style: none; margin: 0; padding: 0; }
[data-slot="public-nav"] ul:last-child { margin-inline-start: auto; }
[data-slot="public-nav"] a:not([data-slot="button"]) { display: inline-flex; align-items: center; white-space: nowrap; color: var(--color-muted-fg); text-decoration: none; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: var(--weight-medium); }
[data-slot="public-nav"] a:not([data-slot="button"]):hover, [data-slot="public-nav"] a[aria-current="page"] { color: var(--color-fg); background: var(--color-muted); }
[data-slot="public-nav"] a:focus-visible, [data-slot="menu-toggle"]:focus-visible, [data-slot="menu-sheet"] a:focus-visible { outline: 2px solid var(--color-ring, currentColor); outline-offset: 2px; }
[data-slot="public-nav"] a[data-cta], [data-slot="header-cta"] { white-space: nowrap; }
[data-slot="menu-toggle"], [data-slot="header-cta"], [data-slot="menu-sheet"] { display: none; }
[data-slot="menu-toggle"] { width: 2.25rem; height: 2.25rem; align-items: center; justify-content: center; border: 1px solid var(--color-border); background: transparent; color: var(--color-fg); border-radius: var(--radius-md); cursor: pointer; }
@media (max-width: 639px) {
  [data-header="public"] > [data-slot="header-inner"] { padding-inline: var(--space-4); gap: var(--space-3); }
  [data-slot="public-nav"] { display: none; }
  [data-slot="header-cta"] { display: inline-flex; margin-inline-start: auto; }
  [data-slot="menu-toggle"] { display: inline-flex; }
  [data-slot="menu-sheet"]:not([hidden]) { display: flex; flex-direction: column; position: absolute; inset-inline: 0; top: 100%; padding: var(--space-2) var(--space-4) var(--space-4); background: var(--color-bg); border-bottom: 1px solid var(--color-border); box-shadow: var(--shadow-md, 0 8px 24px rgb(0 0 0 / .08)); }
  [data-slot="menu-sheet"] a { display: block; padding: var(--space-3) var(--space-2); color: var(--color-fg); text-decoration: none; font-size: var(--text-base); border-bottom: 1px solid var(--color-border); }
  [data-slot="menu-sheet"] a:last-child { border-bottom: 0; }
}
`

// Hash/anchor links point inside a page, so they are never the "current" route.
const isAnchor = (to: string) => to.includes('#')

export function PublicLayout() {
  const { site } = useSaas()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const toggleRef = useRef<HTMLButtonElement>(null)
  // Close the mobile menu on navigation (adjust state during render rather than in an effect).
  const navKey = loc.pathname + loc.hash
  const [prevNav, setPrevNav] = useState(navKey)
  if (prevNav !== navKey) { setPrevNav(navKey); setOpen(false) }
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const signupItem = site.nav.find((n): n is InternalNavItem => n.to === '/signup') ?? null
  const signupCta = useSignupCta()
  const cta = signupItem ? signupCta.primary(signupItem.label) : null
  const links = site.nav.filter((n) => n !== signupItem)
  const renderLink = (n: NavItem) =>
    isExternal(n) ? <NavAnchor item={n} /> : isAnchor(n.to) ? <Link to={n.to}>{n.label}</Link> : <NavLink to={n.to} end>{n.label}</NavLink>

  return (
    <>
      <style>{css}</style>
      <a href="#main">{site.labels.skip}</a>
      <header data-slot="app-header" data-header="public">
        <div data-slot="header-inner">
          <Brand />
          <nav data-slot="public-nav" aria-label={site.labels.mainNav}>
            <ul>{links.filter((n) => n.to !== '/login').map((n) => <li key={itemKey(n)}>{renderLink(n)}</li>)}</ul>
            <ul>
              {links.filter((n) => n.to === '/login').map((n) => <li key={itemKey(n)}>{renderLink(n)}</li>)}
              {cta && <li><CtaButton data-variant="solid" data-size="sm" target={cta} /></li>}
            </ul>
          </nav>
          {cta && <span data-slot="header-cta"><CtaButton data-variant="solid" data-size="sm" target={cta} /></span>}
          <button ref={toggleRef} type="button" data-slot="menu-toggle" aria-expanded={open} aria-controls="public-menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((v) => !v)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M3 5.5h12M3 12.5h12" />}
            </svg>
          </button>
        </div>
        <div id="public-menu" data-slot="menu-sheet" hidden={!open}>
          {links.map((n) => <NavAnchor key={itemKey(n)} item={n} />)}
        </div>
      </header>
      <main id="main"><Outlet /></main>
      <Footer />
      <AppToasts />
    </>
  )
}
