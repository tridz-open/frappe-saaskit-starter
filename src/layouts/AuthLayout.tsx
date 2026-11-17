import { Link, Outlet } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { AppToasts } from '../components/AppToasts'
import { useSaas } from '../app/context'

const css = `
[data-layout] > header[data-slot="app-header"] { justify-content: center; }
[data-layout] > main { display: grid; place-items: center; align-content: center; padding-top: var(--space-10); padding-bottom: var(--space-10); }
[data-layout] > main > * { width: 100%; }
body footer[data-slot="auth-footer"] { display: flex; justify-content: center; gap: var(--space-4); padding: var(--space-6) var(--space-4); max-width: none; font-size: var(--text-sm); }
[data-slot="auth-footer"] a { color: var(--color-muted-fg); text-decoration: none; }
[data-slot="auth-footer"] a:hover { color: var(--color-fg); text-decoration: underline; text-underline-offset: 3px; }
[data-slot="auth-footer"] a:focus-visible { outline: 2px solid var(--color-ring, currentColor); outline-offset: 2px; border-radius: var(--radius-sm, 4px); }
`

export function AuthLayout({ variant = 'auth' }: { variant?: 'auth' | 'focus' } = {}) {
  const { site } = useSaas()
  return (
    <div data-layout={variant} style={{ display: 'contents' }}>
      <style>{css}</style>
      <a href="#main">{site.labels.skip}</a>
      <header data-slot="app-header"><Brand /></header>
      <main id="main"><Outlet /></main>
      <footer data-slot="auth-footer" aria-label={site.name}>
        {site.legalLinks.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}
      </footer>
      <AppToasts />
    </div>
  )
}
