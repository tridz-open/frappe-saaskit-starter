import { Link } from 'react-router-dom'
import { useSaas } from '../app/context'
import { currentYear } from '../lib/display'

const css = `
footer [data-slot="footer-inner"] { padding-block: var(--space-8); }
footer [data-slot="footer-inner"] > span { color: var(--color-muted-fg); }
footer nav { flex-wrap: wrap; row-gap: var(--space-2); }
footer a { color: var(--color-muted-fg); }
footer a:hover { color: var(--color-fg); text-decoration: underline; text-underline-offset: 3px; }
footer a:focus-visible { outline: 2px solid var(--color-ring, currentColor); outline-offset: 2px; border-radius: var(--radius-sm, 4px); }
@media (max-width: 639px) { footer [data-slot="footer-inner"] { flex-direction: column; align-items: flex-start; padding-inline: var(--space-4); } }
`

export function DefaultFooter() {
  const { site } = useSaas()
  return (
    <footer>
      <style>{css}</style>
      <div data-slot="footer-inner">
        <span>© {currentYear()} {site.name}</span>
        <nav aria-label={site.name}>
          {site.legalLinks.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
        </nav>
      </div>
    </footer>
  )
}
export function Footer() {
  const { slots } = useSaas()
  const Custom = slots.Footer
  return Custom ? <Custom /> : <DefaultFooter />
}
