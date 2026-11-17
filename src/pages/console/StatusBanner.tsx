import { Link } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { Alert, Badge } from '../../components/primitives'
import { useT } from '../../i18n'
import type { Instance } from '../../data/types'

const TONE: Partial<Record<Instance['status'], 'success' | 'warning' | 'danger' | 'neutral'>> = { running: 'success', suspended: 'warning', past_due: 'warning', failed: 'danger', pending_removal: 'warning' }

/** Status as text plus a leading dot (never colour alone). */
export function StatusBadge({ status }: { status: Instance['status'] }) {
  const t = useT()
  return <Badge data-status={status} tone={TONE[status]}><span aria-hidden="true">● </span>{t(`console.status.${status}`)}</Badge>
}

/** One banner for every site that needs attention, one button. */
export function InstanceStatusBanner({ instances }: { instances: Instance[] }) {
  const t = useT()
  const bad = instances.filter((i) => i.status === 'suspended' || i.status === 'past_due' || i.status === 'failed')
  if (!bad.length) return null
  const payment = bad.some((i) => i.status !== 'failed')
  const key = (s: Instance['status']) => (s === 'suspended' ? 'console.banner.suspended' : s === 'failed' ? 'console.banner.failed' : 'console.banner.pastDue')
  return (
    <Alert tone="warning" data-testid="status-banner">
      {bad.map((i) => <p key={i.id}>{t(key(i.status), { name: i.name })}</p>)}
      <Button data-variant="solid" render={<Link to={payment ? '/console/billing' : '/console/support'} />}>{payment ? t('console.banner.fix') : t('console.banner.help')}</Button>
    </Alert>
  )
}
