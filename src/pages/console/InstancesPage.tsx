import { Link } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { PageHeader, Card, CardBody, Table, THead, TBody, Tr, Th, Td, EmptyState, Skeleton, Stack, Alert } from '../../components/primitives'
import { useT } from '../../i18n'
import { useToast } from '../../app/context'
import { useInstances } from '../../data'
import { InstanceStatusBanner, StatusBadge } from './StatusBanner'
import { hostOf, srOnly } from './format'

const COPY_ICON = <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5v-2a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.500 3.500V9A1.5 1.5 0 0 0 4 10.500h1.500" /></svg>

export function InstancesPage() {
  const t = useT()
  const toast = useToast()
  const { instances, loading, error, refresh } = useInstances()
  const live = instances.filter((i) => i.status === 'running')
  const setting = instances.filter((i) => i.status === 'provisioning')
  const add = (solid: boolean) => <Button data-variant={solid ? 'solid' : undefined} data-testid="create-instance" render={<Link to="/console/instances/new" />}>{t('console.instances.create')}</Button>
  // One clear primary action: open the app when there is exactly one live site, otherwise add one.
  const actions = live.length === 1
    ? <>{add(false)}<Button data-variant="solid" data-testid="open-primary" render={<a href={live[0].url} target="_blank" rel="noreferrer" />}>{t('console.instances.open')}</Button></>
    : add(true)
  return (
    <>
      <InstanceStatusBanner instances={instances} />
      <PageHeader title={t('console.instances.title')} actions={instances.length ? actions : undefined} />
      {loading ? <Card><CardBody><div role="status"><Stack><Skeleton height="1rem" /><Skeleton height="1rem" /><Skeleton height="1rem" /><span className="muted">{t('common.loading')}</span></Stack></div></CardBody></Card>
        : error ? <Alert tone="danger">{t('console.instances.loadError')} <Button type="button" onClick={() => void refresh()}>{t('console.retry')}</Button></Alert>
        : instances.length === 0 ? <EmptyState title={t('console.instances.empty')} description={t('console.instances.emptyHelp')} action={add(true)} /> : (
        <Stack>
          {setting.length > 0 && <Alert tone="neutral" role="status" data-testid="setting-up"><strong>{t('console.instances.settingUp')}</strong> {t('console.instances.settingUpHelp')} {t('console.instances.firstRun')}</Alert>}
          <Card><Table>
            <THead><Tr><Th scope="col">{t('console.col.name')}</Th><Th scope="col">{t('console.col.status')}</Th><Th scope="col">{t('console.col.url')}</Th><Th scope="col"><span style={srOnly}>{t('console.backups.actions')}</span></Th></Tr></THead>
            <TBody>{instances.map((i) => (
              <Tr key={i.id} data-testid="instance-row" data-instance-name={i.name}>
                <Th scope="row"><Link to={`/console/instances/${i.id}`}>{i.name}</Link></Th>
                <Td><StatusBadge status={i.status} /></Td>
                <Td>
                  {i.url ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', maxWidth: '100%' }}>
                      <a href={i.url} target="_blank" rel="noreferrer" style={{ overflowWrap: 'anywhere' }}>{hostOf(i.url)}</a>
                      <Button type="button" data-variant="ghost" aria-label={t('console.copyUrl')} title={t('console.copyUrl')} onClick={() => { void navigator.clipboard?.writeText(i.url).then(() => toast(t('console.copied'), { description: hostOf(i.url) })).catch(() => undefined) }}>{COPY_ICON}</Button>
                    </span>
                  ) : <span className="muted">—</span>}
                </Td>
                <Td>{i.status === 'running' && i.url ? <Button render={<a href={i.url} target="_blank" rel="noreferrer" aria-label={t('console.openUrl', { name: i.name })} />}>{t('console.instances.open')}</Button> : <Button data-variant="ghost" render={<Link to={`/console/instances/${i.id}`} />}>{t('console.detail.overview')}</Button>}</Td>
              </Tr>
            ))}</TBody>
          </Table></Card>
        </Stack>
      )}
    </>
  )
}
