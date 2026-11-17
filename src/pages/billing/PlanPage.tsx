import {
  AlertDialog, AlertDialogBackdrop, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from '@ui-sdk/react/alert-dialog'
import { useState } from 'react'
import { usePlans, useSubscription } from '../../data'
import { useT } from '../../i18n'
import { useSaas } from '../../app/context'
import { Alert, Badge, Card, CardBody, CardDescription, CardFooter, CardHeader, Grid, PageHeader, Skeleton, Stack } from '../../components/primitives'
import { formatDate, friendlyError, intervalLabel, money, shortRef } from '../../lib/display'

export default function PlanPage() {
  const t = useT()
  const { site } = useSaas()
  const { plans, loading } = usePlans()
  const { subscription, changePlan } = useSubscription()
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const current = plans.find((p) => p.id === subscription.planId)
  if (loading) return (
    <Stack role="status">
      <Skeleton width="30%" height="2rem" />
      <Grid min="16rem"><Skeleton height="14rem" /><Skeleton height="14rem" /><Skeleton height="14rem" /></Grid>
      <p>{t('billing.plan.loading')}</p>
    </Stack>
  )
  const apply = async (id: string, name: string) => {
    setBusy(true); setDone(null); setError(null)
    try { await changePlan(id); setDone(name) }
    catch (e) { setError(friendlyError(e, 'billing.plan.error', { support: site.supportEmail, ref: shortRef(id) })) }
    finally { setBusy(false) }
  }
  const renews = formatDate(subscription.renewsAt)
  const resub = subscription.status === 'canceled'
  return (
    <section aria-labelledby="plan-h">
      <PageHeader
        title={<span id="plan-h">{t('billing.plan.title')}</span>}
        description={current ? (renews ? t('billing.plan.renewsDesc', { name: current.name, date: renews }) : `${t('billing.plan.current')}: ${current.name}`) : undefined}
      />
      <Stack>
        <div aria-live="polite">
          {done && <Alert role="status" tone="success">{t('billing.plan.changed', { name: done })}</Alert>}
          {error && <Alert role="alert" tone="danger">{error}</Alert>}
        </div>
        <Grid min="16rem">
          {plans.map((p) => {
            const isCurrent = p.id === subscription.planId
            const down = !!current && p.price < current.price
            const label = t(resub ? 'billing.plan.resubscribe' : down ? 'billing.plan.downgrade' : 'billing.plan.upgrade', { name: p.name })
            const lost = down && current ? current.features.filter((f) => !p.features.includes(f)) : []
            const body = down
              ? t('billing.plan.confirmDowngrade', { name: p.name, lost: lost.length ? t('billing.plan.lost', { features: lost.join(', ') }) : '' })
              : t('billing.plan.confirmUpgrade', { name: p.name })
            return (
              <Card key={p.id} data-testid={`plan-${p.id}`} data-current={isCurrent ? '' : undefined}>
                <CardHeader>
                  <h2>{p.name}</h2>
                  {isCurrent && <Badge tone="success">{t('billing.plan.currentBadge')}</Badge>}
                  <CardDescription>{`${t('billing.plan.price', { price: money(p.price, site.currency), interval: intervalLabel(p.interval) })} (${t('billing.plan.gst')})`}</CardDescription>
                </CardHeader>
                <CardBody>
                  <ul data-slot="check-list">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                </CardBody>
                {!isCurrent && (
                  <CardFooter>
                    <AlertDialog onOpenChange={(open, d) => { if (!open && d.returnValue === 'confirm') void apply(p.id, p.name) }}>
                      <AlertDialogTrigger data-variant={down ? undefined : 'solid'} disabled={busy}>{label}</AlertDialogTrigger>
                      <AlertDialogBackdrop />
                      <AlertDialogContent>
                        <AlertDialogTitle>{label}</AlertDialogTitle>
                        <AlertDialogDescription>{body}</AlertDialogDescription>
                        <AlertDialogClose>{t('billing.plan.keep')}</AlertDialogClose>
                        <AlertDialogClose data-variant="solid" value="confirm" data-testid="plan-confirm">{t(down ? 'billing.plan.confirmDowngradeBtn' : 'billing.plan.confirmUpgradeBtn')}</AlertDialogClose>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                )}
              </Card>
            )
          })}
        </Grid>
      </Stack>
    </section>
  )
}
