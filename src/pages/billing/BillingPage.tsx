import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@ui-sdk/react/tabs'
import {
  AlertDialog, AlertDialogBackdrop, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from '@ui-sdk/react/alert-dialog'
import { invoicePdfUrl, useInvoices, usePaymentMethods, usePlans, useSubscription } from '../../data'
import { useT } from '../../i18n'
import { Alert, Badge, Card, CardBody, CardDescription, CardHeader, DescriptionList, EmptyState, PageHeader, Row, Skeleton, Stack, Table, TBody, Td, Th, THead, Tr } from '../../components/primitives'
import { StatusBadge } from './common'
import { useSaas } from '../../app/context'
import { formatDate, friendlyError, intervalLabel, money, shortRef, nowRef } from '../../lib/display'

export default function BillingPage() {
  const t = useT()
  const { site } = useSaas()
  const support = site.supportEmail
  const { subscription, cancel } = useSubscription()
  const { plans } = usePlans()
  const plan = plans.find((p) => p.id === subscription.planId)
  const { methods, portalUrl } = usePaymentMethods()
  const { invoices, loading } = useInvoices()
  const [params, setParams] = useSearchParams()
  const tab = ['subscription', 'methods', 'invoices'].includes(params.get('tab') ?? '') ? params.get('tab')! : 'subscription'
  const [result, setResult] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const date = formatDate(subscription.renewsAt)
  const status = subscription.status
  const dateLabel = status === 'canceled' ? 'billing.accessUntil' : status === 'past_due' ? 'billing.overdueSince' : 'billing.renews'

  async function doCancel() {
    setBusy(true); setResult(null)
    try {
      await cancel()
      setResult({ tone: 'success', text: date ? t('billing.cancelDone', { date }) : t('billing.cancelDone.nodate') })
    } catch (e) {
      setResult({ tone: 'danger', text: friendlyError(e, 'billing.cancelError', { support, ref: shortRef(subscription.planId) || shortRef(nowRef()) }) })
    } finally { setBusy(false) }
  }
  const methodLabel = (m: { brand: string; last4: string }) => {
    const brand = m.brand ? m.brand.charAt(0).toUpperCase() + m.brand.slice(1) : ''
    return m.last4 ? `${brand ? `${brand} ` : ''}ending ${m.last4}` : brand
  }
  return (
    <>
      <PageHeader title={t('billing.overview.title')} description={t('billing.overview.description', { support })} />
      <Tabs value={tab} onValueChange={(v) => setParams(v === 'subscription' ? {} : { tab: String(v) }, { replace: true })}>
        <TabsList aria-label={t('billing.overview.title')}>
          <TabsTab value="subscription">{t('billing.subscription')}</TabsTab>
          <TabsTab value="methods">{t('billing.paymentMethods')}</TabsTab>
          <TabsTab value="invoices">{t('billing.invoices')}</TabsTab>
        </TabsList>
        <TabsPanel value="subscription">
          <div aria-live="polite">{result && <Alert tone={result.tone} role={result.tone === 'danger' ? 'alert' : 'status'} data-testid="cancel-result" style={{ marginBottom: 'var(--space-4)' }}>{result.text}</Alert>}</div>
          {status === 'past_due' && <Alert tone="danger" role="alert" style={{ marginBottom: 'var(--space-4)' }}>{t('billing.pastDue')} <Link to="/console/billing?tab=methods">{t('billing.pastDueCta')}</Link></Alert>}
          {status === 'canceled' && <Alert tone="neutral" role="status" style={{ marginBottom: 'var(--space-4)' }}>{t('billing.canceledNote')}</Alert>}
          <Card aria-labelledby="sub-h">
            <CardHeader><h2 id="sub-h">{t('billing.subscription')}</h2></CardHeader>
            <CardBody>
              <DescriptionList items={[
                ...(plan ? [[t('billing.plan.current'), <span key="plan"><strong>{plan.name}</strong> <span className="muted">{t('billing.plan.price', { price: money(plan.price, site.currency), interval: intervalLabel(plan.interval) })} ({t('billing.plan.gst')})</span></span>] as [string, React.ReactNode]] : []),
                [t('billing.status'), <StatusBadge key="status" status={status} />],
                ...(date ? [[t(dateLabel), date] as [string, React.ReactNode]] : []),
              ]} />
              <Row>
                <Button data-variant="solid" render={<Link to="/console/plan" />}>{status === 'canceled' ? t('billing.resubscribe') : t('billing.changePlan')}</Button>
              </Row>
            </CardBody>
          </Card>
          {status !== 'canceled' && (
            <Card aria-labelledby="danger-h" style={{ marginTop: 'var(--space-6)' }}>
              <CardHeader><h2 id="danger-h">{t('billing.danger')}</h2><CardDescription>{t('billing.danger.text')}</CardDescription></CardHeader>
              <CardBody>
                <div>
                  <AlertDialog onOpenChange={(open, details) => { if (!open && details.returnValue === 'confirm') void doCancel() }}>
                    <AlertDialogTrigger data-variant="ghost" data-testid="cancel-subscription" disabled={busy} style={{ color: 'var(--color-destructive)' }}>{t('billing.cancelSub')}</AlertDialogTrigger>
                    <AlertDialogBackdrop />
                    <AlertDialogContent>
                      <AlertDialogTitle>{t('billing.cancelSub')}</AlertDialogTitle>
                      <AlertDialogDescription>{date ? t('billing.cancelConfirm', { date }) : t('billing.cancelConfirm.nodate')}</AlertDialogDescription>
                      <AlertDialogClose>{t('billing.cancelKeep')}</AlertDialogClose>
                      <AlertDialogClose data-variant="destructive" value="confirm" data-testid="cancel-confirm">{t('billing.cancelYes')}</AlertDialogClose>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardBody>
            </Card>
          )}
        </TabsPanel>
        <TabsPanel value="methods">
          <Card aria-labelledby="pm-h">
            <CardHeader><h2 id="pm-h">{t('billing.paymentMethods')}</h2></CardHeader>
            <CardBody>
              {methods.length === 0 ? <EmptyState role="status" title={t('billing.noMethods')} description={t('billing.noMethods.help')} /> : (
                <Stack>{methods.map((m) => (
                  <Row key={m.id}>{methodLabel(m)} {m.isDefault && <Badge>{t('billing.default')}</Badge>}</Row>
                ))}</Stack>
              )}
              {portalUrl && <div><Button render={<a href={portalUrl} />}>{t('billing.manageMethods')}</Button><p className="muted">{t('billing.manageMethods.hint')}</p></div>}
            </CardBody>
          </Card>
        </TabsPanel>
        <TabsPanel value="invoices">
          <Card aria-labelledby="inv-h">
            <CardHeader><h2 id="inv-h">{t('billing.invoices')}</h2></CardHeader>
            {loading ? (
              <CardBody role="status">
                <Skeleton height="2rem" /><Skeleton height="2rem" /><Skeleton height="2rem" />
                <p>{t('billing.loading')}</p>
              </CardBody>
            ) : invoices.length === 0 ? (
              <CardBody><EmptyState role="status" title={t('billing.noInvoices')} description={t('billing.noInvoices.help')} /></CardBody>
            ) : (
              <Table>
                <THead><Tr>
                  <Th scope="col">{t('billing.col.number')}</Th><Th scope="col">{t('billing.col.date')}</Th>
                  <Th scope="col">{t('billing.col.amount')}</Th><Th scope="col">{t('billing.col.status')}</Th>
                  <Th scope="col"><span className="sr-only">{t('billing.col.actions')}</span></Th>
                </Tr></THead>
                <TBody>{invoices.map((i) => (
                  <Tr key={i.id} data-testid={`invoice-row-${i.id}`}>
                    <Td>{i.number || t('billing.invoice.pending')}</Td><Td>{formatDate(i.date)}</Td>
                    <Td>{money(i.amount, i.currency)}</Td><Td><StatusBadge status={i.status} /></Td>
                    <Td>
                      <Row>
                        <Button data-variant="ghost" aria-label={t('billing.viewNum', { number: i.number || i.id })} render={<Link to={`/console/billing/invoices/${i.id}`} />}>{t('billing.view')}</Button>
                        <Button data-variant="ghost" aria-label={t('billing.downloadNum', { number: i.number || i.id })} render={<a href={invoicePdfUrl(i.id)} download />} data-testid={`invoice-pdf-${i.id}`}>{t('billing.invoice.download')}</Button>
                      </Row>
                    </Td>
                  </Tr>
                ))}</TBody>
              </Table>
            )}
          </Card>
        </TabsPanel>
      </Tabs>
    </>
  )
}
