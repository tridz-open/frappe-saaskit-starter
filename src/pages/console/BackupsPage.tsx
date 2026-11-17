import { useState } from 'react'
import { Button } from '@ui-sdk/react/button'
import { Field, FieldLabel } from '@ui-sdk/react/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui-sdk/react/select'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { PageHeader, Card, CardBody, Alert, Badge, Table, THead, TBody, Tr, Th, Td, EmptyState, Skeleton, Stack, Row } from '../../components/primitives'
import { useT } from '../../i18n'
import { useToast } from '../../app/context'
import { useBackups, useCapabilities, useInstances } from '../../data'
import { formatBytes, formatWhen, srOnly } from './format'

export function BackupsPage() {
  const t = useT()
  const toast = useToast()
  const { backups, loading, error, create, restore, download } = useBackups()
  const caps = useCapabilities()
  const { instances, loading: instLoading } = useInstances()
  const live = instances.filter((i) => i.status === 'running')
  const [iid, setIid] = useState('')
  const [rb, setRb] = useState<{ id: string; instanceId: string; createdAt: string } | null>(null)
  const [requested, setRequested] = useState<Record<string, true>>({})
  const [restoreError, setRestoreError] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const sel = iid || live[0]?.id || ''
  const nameOf = (id: string) => instances.find((i) => i.id === id)?.name ?? ''
  const anyRequested = Object.keys(requested).length > 0
  async function dl(b: { id: string; instanceId: string }) {
    setBusy(b.id)
    try { await download(b.instanceId, b.id) } catch { toast.error(t('console.backups.downloadError')) } finally { setBusy(null) }
  }
  return (
    <>
      <PageHeader title={t('console.backups.title')} description={t('console.backups.intro')}
        actions={live.length ? <form onSubmit={(e) => { e.preventDefault(); if (sel) void create(sel).then(() => toast(t('console.backups.started'), { description: t('console.backups.startedHelp') })).catch((err: unknown) => toast.error(err instanceof Error ? err.message : String(err))) }} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
          {live.length > 1 && <Field><FieldLabel>{t('console.backups.instance')}</FieldLabel>
            <Select items={live.map((i) => ({ value: i.id, label: i.name }))} value={sel} onValueChange={(v) => v && setIid(String(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{live.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
            </Select></Field>}
          <Button type="submit" data-variant="solid" disabled={!sel} data-testid="create-backup">{t('console.backups.now')}</Button>
        </form> : undefined} />
      {anyRequested && <Alert tone="warning" role="status" data-testid="restore-pending">{t('console.backups.restore.requested')}</Alert>}
      {loading || instLoading ? <Card><CardBody><div role="status"><Stack><Skeleton height="1rem" /><Skeleton height="1rem" /><Skeleton height="1rem" /><span className="muted">{t('common.loading')}</span></Stack></div></CardBody></Card>
        : error ? <Alert tone="danger">{t('console.backups.loadError')}</Alert>
        : !live.length && !backups.length ? <EmptyState title={t('console.backups.empty')} description={t('console.backups.firstRun')} />
        : backups.length === 0 ? <EmptyState title={t('console.backups.empty')} description={t('console.backups.emptyHelp')} /> : (
        <Card><Table>
          <THead><Tr>{live.length > 1 && <Th scope="col">{t('console.backups.instance')}</Th>}<Th scope="col">{t('console.backups.date')}</Th><Th scope="col">{t('console.backups.type')}</Th><Th scope="col">{t('console.backups.size')}</Th><Th scope="col">{t('console.col.status')}</Th><Th scope="col"><span style={srOnly}>{t('console.backups.actions')}</span></Th></Tr></THead>
          <TBody>{backups.map((b) => (
            <Tr key={b.id} data-testid="backup-row">
              {live.length > 1 && <Td>{nameOf(b.instanceId)}</Td>}
              <Td>{formatWhen(b.createdAt)}</Td>
              <Td>{b.kind ? t(`console.backups.kind.${b.kind}`) : '—'}</Td>
              <Td>{b.sizeBytes !== undefined ? formatBytes(b.sizeBytes) : formatBytes(b.sizeMb * 1048576)}</Td>
              <Td>{requested[b.id] ? <Badge tone="warning">{t('console.backups.restore.rowStatus')}</Badge> : <Badge data-status={b.status}>{t(`console.backups.status.${b.status}`)}</Badge>}</Td>
              <Td><Row>
                {caps.backupDownload && <Button type="button" data-variant="ghost" data-testid="download-backup" disabled={b.status !== 'ready' || busy === b.id} onClick={() => void dl(b)}>{busy === b.id ? t('console.backups.downloading') : t('console.backups.download')}</Button>}
                <Button type="button" data-variant="ghost" data-testid="restore-backup" disabled={b.status !== 'ready' || !!requested[b.id]} onClick={() => { setRestoreError(false); setRb({ id: b.id, instanceId: b.instanceId, createdAt: b.createdAt }) }}>{t('console.backups.restore')}</Button>
              </Row></Td>
            </Tr>
          ))}</TBody>
        </Table></Card>
      )}
      {restoreError && <Alert tone="danger">{t('console.backups.restore.error')}</Alert>}
      <ConfirmDialog open={!!rb} destructive title={t('console.backups.restore.title', { name: rb ? (nameOf(rb.instanceId) || t('console.backups.instance')) : '', when: rb ? formatWhen(rb.createdAt) : '' })} description={t('console.backups.restore.text')}
        confirmLabel={t('console.backups.restore.confirm')} cancelLabel={t('console.backups.restore.keep')} onClose={() => setRb(null)}
        onConfirm={() => { if (rb) void restore(rb.instanceId, rb.id).then(() => setRequested((r) => ({ ...r, [rb.id]: true }))).catch(() => setRestoreError(true)) }} />
    </>
  )
}
