import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { useSubscription } from '../../data'
import { useT } from '../../i18n'
import { Badge } from '../../components/primitives'
import { statusLabel } from '../../lib/display'
export { money, formatDate, formatDateTime } from '../../lib/display'
export function BackLink() {
  const t = useT()
  return <div><Button data-variant="ghost" render={<Link to="/console/billing?tab=invoices" />}>{t('billing.invoice.back')}</Button></div>
}
export function StatusBadge({ status }: { status: string }) {
  return <Badge data-status={status}>{statusLabel(status)}</Badge>
}
/** Stripe-style settings row: label + help on the left, controls on the right. Stacks on narrow screens. */
export function SettingRow({ title, description, children }: { title: ReactNode; description?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))', gap: 'var(--space-4) var(--space-8)', alignItems: 'start' }}>
      <div>
        <p style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>{title}</p>
        {description ? <p className="muted" style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-sm)' }}>{description}</p> : null}
      </div>
      <div data-slot="stack">{children}</div>
    </div>
  )
}
export { useSubscription }
