import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'

/** Plain inline text link for auth-page footers and label rows (never a pill Button). */
export function AuthLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} style={{ color: 'var(--color-primary, inherit)', textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 0, padding: 0, font: 'inherit', ...props.style }} />
}

/** Footer row: wraps onto a second line only when narrow. */
export function AuthLinks({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-sm)' }}>{children}</div>
}
