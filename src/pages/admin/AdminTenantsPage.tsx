import { useMemo, useState } from 'react'
import { Field, FieldLabel } from '@ui-sdk/react/field'
import { Input } from '@ui-sdk/react/input'
import { useAdminTenants } from '../../data'
import { useT } from '../../i18n'
import { Badge, Card, EmptyState, PageHeader, Stack, Table, TBody, Td, Th, THead, Tr, type Tone } from '../../components/primitives'
import { formatDay, hostOf } from '../console/format'
import { AdminGate, AdminStatus } from './AdminGate'

const TONE: Record<string, Tone> = { active: 'success', provisioning: 'neutral', pending: 'neutral', suspended: 'warning', failed: 'danger', terminating: 'warning', terminated: 'neutral' }
const titleCase = (s: string) => s.replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

function Tenants() {
  const t = useT()
  const { tenants, loading, error, forbidden, refresh } = useAdminTenants()
  const [q, setQ] = useState('')
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...tenants].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter((x) => !needle || `${x.slug} ${x.url} ${x.planId}`.toLowerCase().includes(needle))
  }, [tenants, q])
  const status = AdminStatus({ loading, error, forbidden, refresh })
  return (
    <section aria-labelledby="admin-tenants-h">
      <PageHeader experimental title={<span id="admin-tenants-h">{t('admin.tenants.title')}</span>} description={t('admin.tenants.lead')} />
      <Stack>
        {status ?? (
          <>
            <Field><FieldLabel>{t('admin.search')}</FieldLabel><Input type="search" value={q} onValueChange={(v) => setQ(String(v))} placeholder={t('admin.tenants.searchHint')} /></Field>
            {rows.length === 0 ? <EmptyState title={q ? t('admin.tenants.noMatch') : t('admin.tenants.empty')} description={q ? undefined : t('admin.tenants.emptyHelp')} /> : (
              <Card><Table>
                <THead><Tr><Th scope="col">{t('admin.tenants.col.address')}</Th><Th scope="col">{t('admin.tenants.col.plan')}</Th><Th scope="col">{t('admin.tenants.col.status')}</Th><Th scope="col">{t('admin.tenants.col.created')}</Th></Tr></THead>
                <TBody>
                  {rows.map((x) => (
                    <Tr key={x.id} data-testid="tenant-row">
                      <Th scope="row">{x.url ? <a href={x.url} target="_blank" rel="noreferrer">{hostOf(x.url)}</a> : x.slug}</Th>
                      <Td>{titleCase(x.planId)}</Td>
                      <Td><Badge tone={TONE[x.status] ?? 'neutral'}>{titleCase(x.status)}</Badge></Td>
                      <Td>{formatDay(x.createdAt)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table></Card>
            )}
          </>
        )}
      </Stack>
    </section>
  )
}

export function AdminTenantsPage() { return <AdminGate><Tenants /></AdminGate> }
