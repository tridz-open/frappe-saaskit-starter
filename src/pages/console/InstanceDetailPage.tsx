import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@ui-sdk/react/tabs'
import { PageHeader, Card, CardHeader, CardBody, CardFooter, Alert, DescriptionList, Skeleton, Stack } from '../../components/primitives'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useT } from '../../i18n'
import { useToast } from '../../app/context'
import { useCapabilities, useInstances } from '../../data'
import type { Instance } from '../../data/types'
import { InstanceStatusBanner, StatusBadge } from './StatusBanner'
import { DeleteDialog } from './DeleteDialog'
import { formatDay, hostOf } from './format'

export function InstanceDetailPage() {
  const t = useT()
  const toast = useToast()
  const { id = '' } = useParams()
  const nav = useNavigate()
  const api = useInstances()
  const caps = useCapabilities()
  const [inst, setInst] = useState<Instance | null | undefined>(undefined)
  const [target, setTarget] = useState<Instance | null>(null)
  const [copy, setCopy] = useState(false)
  useEffect(() => { void api.get(id).then((i) => setInst(i ? { ...i } : null)) }, [id, api.instances]) // eslint-disable-line react-hooks/exhaustive-deps
  if (api.error && inst === undefined) return <Alert tone="danger">{t('console.instances.loadError')} <Button type="button" onClick={() => void api.refresh()}>{t('console.retry')}</Button></Alert>
  if (inst === undefined) return <div role="status"><Stack><Skeleton height="2rem" /><Skeleton height="1rem" /><span className="muted">{t('common.loading')}</span></Stack></div>
  if (!inst) return <><PageHeader title={t('console.detail.notFound')} description={t('console.detail.notFoundHelp')} /><Button data-variant="solid" render={<Link to="/console" />}>{t('console.detail.back')}</Button></>
  const pending = inst.pendingApproval || inst.status === 'pending_removal'
  const host = hostOf(inst.url)
  const live = inst.status === 'running' && !!inst.url
  return (
    <>
      <nav aria-label="Breadcrumb" className="muted"><Link to="/console">{t('console.instances.title')}</Link> / <span aria-current="page">{inst.name}</span></nav>
      <PageHeader title={<>{inst.name} <StatusBadge status={inst.status} /></>} actions={live ? <Button data-variant="solid" data-testid="open-primary" render={<a href={inst.url} target="_blank" rel="noreferrer" />}>{t('console.detail.open')}</Button> : undefined} />
      <InstanceStatusBanner instances={[inst]} />
      <Tabs defaultValue="overview">
        <TabsList aria-label={t('console.detail.sections')}>
          <TabsTab value="overview">{t('console.detail.overview')}</TabsTab>
          <TabsTab value="domain">{t('console.detail.domain')}</TabsTab>
        </TabsList>
        <TabsPanel value="overview">
          <Stack>
            <Card>
              <CardHeader><h2>{t('console.detail.overview')}</h2></CardHeader>
              <CardBody>
                <DescriptionList items={[
                  [t('console.col.status'), <StatusBadge key="status" status={inst.status} />],
                  [t('console.col.url'), host ? <a href={inst.url} target="_blank" rel="noreferrer">{host}</a> : '—'],
                  [t('console.detail.created'), formatDay(inst.createdAt)],
                ]} />
              </CardBody>
              {live && <CardFooter><Button type="button" data-variant="ghost" data-testid="duplicate-instance" onClick={() => setCopy(true)}>{t('console.detail.duplicate')}</Button></CardFooter>}
            </Card>
            <Card aria-labelledby="danger-h" style={{ borderColor: 'color-mix(in oklab, var(--color-destructive) 35%, var(--color-border))' }}>
              <CardHeader><h2 id="danger-h">{t('console.detail.danger')}</h2></CardHeader>
              <CardBody>
                <p><strong>{t('console.detail.dangerTitle')}</strong></p>
                {pending ? (
                  <Alert tone="warning" role="status">{t('console.detail.pending')} {caps.cancelDeletion ? null : <>{t('console.detail.pendingHelp')} <Link to="/console/support">{t('console.detail.contactSupport')}</Link></>}</Alert>
                ) : (
                  <p className="muted">{t('console.detail.dangerText', { name: inst.name })} <Link to="/console/backups">{t('console.detail.dangerBackups')}</Link></p>
                )}
              </CardBody>
              <CardFooter>
                {pending ? (caps.cancelDeletion ? <Button type="button" data-testid="cancel-removal" onClick={() => void api.cancelRemoval(inst.id)}>{t('console.detail.cancelRemoval')}</Button> : null)
                  : <Button type="button" data-variant="destructive" data-testid="delete-instance" onClick={() => setTarget(inst)}>{t('console.detail.deleteButton')}</Button>}
              </CardFooter>
            </Card>
          </Stack>
        </TabsPanel>
        <TabsPanel value="domain">
          <Card>
            <CardHeader><h2>{t('console.detail.domain')}</h2></CardHeader>
            <CardBody><p>{t('console.detail.domainHelp', { host })}</p></CardBody>
            <CardFooter><Button data-variant="solid" render={<Link to={`/console/support?subject=${encodeURIComponent(t('console.detail.domainTicket', { host }))}`} />}>{t('console.detail.domainRequest')}</Button></CardFooter>
          </Card>
        </TabsPanel>
      </Tabs>
      <ConfirmDialog open={copy} title={t('console.detail.duplicateTitle', { name: inst.name })} description={t('console.detail.duplicateText')} confirmLabel={t('console.detail.duplicateConfirm')} onClose={() => setCopy(false)}
        onConfirm={() => void api.duplicate(inst.id).then(() => { toast(t('console.detail.duplicated', { name: inst.name })); nav('/console') }).catch((e: unknown) => toast.error(e instanceof Error ? e.message : String(e)))} />
      <DeleteDialog target={target} onClose={() => setTarget(null)} onConfirm={(i) => api.remove(i.id, i.name).then(() => { toast(t('console.instances.deleted', { name: i.name })) })} />
    </>
  )
}
