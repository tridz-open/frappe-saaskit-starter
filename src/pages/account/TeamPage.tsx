import { useState, type FormEvent } from 'react'
import { Button } from '@ui-sdk/react/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@ui-sdk/react/field'
import { Input } from '@ui-sdk/react/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui-sdk/react/select'
import { useTeam } from '../../data'
import type { Role } from '../../data'
import { useT } from '../../i18n'
import { useToast } from '../../app/context'
import { Alert, Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, Skeleton, Stack, Table, TBody, Td, Th, THead, Tr } from '../../components/primitives'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { formatDay, srOnly } from '../console/format'

export function TeamPage() {
  const t = useT()
  const toast = useToast()
  const team = useTeam()
  const [rm, setRm] = useState<{ id: string; name: string } | null>(null)
  const [rv, setRv] = useState<{ id: string; email: string } | null>(null)
  const [promote, setPromote] = useState<{ id: string; name: string } | null>(null)
  const [inviteError, setInviteError] = useState('')
  const [role, setRole] = useState<Role>('member')
  const roleItems = team.roles.map((r) => ({ value: r, label: t(`team.role.${r}`) }))
  const roleSelect = (name: string, value: Role, onChange: (r: Role) => void, label = t('team.role')) => (
    <Select name={name} aria-label={label} items={roleItems} value={value} onValueChange={(v) => onChange(String(v) as Role)} disabled={!team.ready}>
      <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>
        {team.roles.map((r) => <SelectItem key={r} value={r}><span style={{ display: 'grid' }}><span>{t(`team.role.${r}`)}</span><small className="muted">{t(`team.role.${r}.help`)}</small></span></SelectItem>)}
      </SelectContent>
    </Select>
  )
  async function changeRole(id: string, name: string, r: Role) {
    try { await team.setRole(id, r); toast(t('team.roleChanged', { name, role: t(`team.role.${r}`) })) }
    catch { toast.error(t('team.roleChangeFailed')) }
  }
  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = String(new FormData(form).get('email')).trim()
    setInviteError('')
    if ([...team.invites, ...team.members].some((x) => x.email.toLowerCase() === email.toLowerCase())) { setInviteError(t('team.invite.exists', { email })); return }
    try { await team.invite(email, role); toast.success(t('team.invite.sent', { email })); form.reset() }
    catch (err) { setInviteError(t('team.invite.failed', { reason: err instanceof Error ? err.message : '' }).trim()) }
  }
  return (
    <div>
      <PageHeader experimental title={t('team.title')} description={t('team.intro')} />
      <Stack>
      {!team.loading && !team.ready && <Alert tone="neutral" role="status">{t('team.notLive')}</Alert>}
      <section aria-labelledby="team-members">
        <Card>
          <CardHeader><h2 id="team-members">{t('team.members')}</h2></CardHeader>
          {team.loading ? <CardBody><div role="status"><Skeleton height="1.5rem" /><p>{t('common.loading')}</p></div></CardBody> : !team.members.length ? <EmptyState title={t('team.empty')} /> : (
            <Table>
              <THead><Tr>
                <Th scope="col">{t('team.name')}</Th><Th scope="col">{t('team.email')}</Th>
                <Th scope="col">{t('team.role')}</Th><Th scope="col"><span style={srOnly}>{t('team.actions')}</span></Th>
              </Tr></THead>
              <TBody>{team.members.map((m) => (
                <Tr key={m.id}>
                  <Td>{m.name}</Td><Td>{m.email}</Td>
                  <Td>{m.role === 'owner' ? <><Badge>{t('team.role.owner')}</Badge> <small className="muted">{t('team.owner.locked')}</small></> : roleSelect(`role-${m.id}`, m.role, (r) => (r === 'owner' ? setPromote({ id: m.id, name: m.name }) : void changeRole(m.id, m.name, r)))}</Td>
                  <Td>{m.role !== 'owner' && <Button data-variant="ghost" style={{ color: 'var(--color-destructive)' }} data-testid="remove-member" onClick={() => setRm({ id: m.id, name: m.name })}>{t('team.remove')}</Button>}</Td>
                </Tr>
              ))}</TBody>
            </Table>
          )}
        </Card>
      </section>
      <section aria-labelledby="team-invite">
        <form onSubmit={(e) => void invite(e)}>
          <Card>
            <CardHeader><h2 id="team-invite">{t('team.invite.title')}</h2></CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
                <Field name="email" style={{ flex: '1 1 16rem' }}><FieldLabel>{t('team.invite.email')}</FieldLabel><Input type="email" required disabled={!team.ready} placeholder={t('team.invite.placeholder')} onValueChange={() => setInviteError('')} /><FieldError /></Field>
                <Field name="role" style={{ flex: '0 1 12rem' }}><FieldLabel>{t('team.role')}</FieldLabel>{roleSelect('role', role, setRole)}</Field>
                <Button type="submit" data-variant="solid" disabled={!team.ready}>{t('team.invite.send')}</Button>
              </div>
              {inviteError && <Alert tone="danger">{inviteError}</Alert>}
              <FieldDescription>{t('team.invite.hint')} {t(`team.role.${role}.help`)}</FieldDescription>
            </CardBody>
          </Card>
        </form>
      </section>
      <section aria-labelledby="team-invites">
        <Card>
          <CardHeader><h2 id="team-invites">{t('team.invites')}</h2></CardHeader>
          {!team.invites.length ? <EmptyState title={t('team.invite.empty')} description={t('team.invite.emptyHelp')} /> : (
            <Table>
              <THead><Tr>
                <Th scope="col">{t('team.email')}</Th><Th scope="col">{t('team.role')}</Th><Th scope="col">{t('team.sentAt')}</Th>
                <Th scope="col"><span style={srOnly}>{t('team.invite.revoke')}</span></Th>
              </Tr></THead>
              <TBody>{team.invites.map((i) => (
                <Tr key={i.id}>
                  <Td>{i.email}</Td><Td><Badge>{t(`team.role.${i.role}`)}</Badge></Td><Td>{formatDay(i.sentAt)}</Td>
                  <Td><Button data-variant="ghost" data-testid="revoke-invite" onClick={() => setRv({ id: i.id, email: i.email })}>{t('team.invite.revoke')}</Button></Td>
                </Tr>
              ))}</TBody>
            </Table>
          )}
        </Card>
      </section>
      </Stack>
      <ConfirmDialog open={!!rm} destructive title={t('team.remove.title')} description={t('team.remove.text', { name: rm?.name ?? '' })} confirmLabel={t('team.remove.confirm', { name: rm?.name ?? '' })} onClose={() => setRm(null)} onConfirm={() => { if (rm) void team.removeMember(rm.id).then(() => toast(t('team.removed', { name: rm.name }))) }} />
      <ConfirmDialog open={!!rv} title={t('team.invite.revoke.title')} description={t('team.invite.revoke.text', { email: rv?.email ?? '' })} confirmLabel={t('team.invite.revoke')} onClose={() => setRv(null)} onConfirm={() => { if (rv) void team.revokeInvite(rv.id) }} />
      <ConfirmDialog open={!!promote} title={t('team.promote.title', { name: promote?.name ?? '' })} description={t('team.promote.text')} confirmLabel={t('team.promote.confirm')} onClose={() => setPromote(null)} onConfirm={() => { if (promote) void changeRole(promote.id, promote.name, 'owner') }} />
    </div>
  )
}
