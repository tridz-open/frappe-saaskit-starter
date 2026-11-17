import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@ui-sdk/react/tabs'
import { Button } from '@ui-sdk/react/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@ui-sdk/react/field'
import { Input } from '@ui-sdk/react/input'
import { useApiTokens, useAuth, useCapabilities, useSessions, useUpdateProfile } from '../../data'
import { useToast } from '../../app/context'
import { useT } from '../../i18n'
import { SettingRow } from '../billing/common'
import { formatDay, formatWhen, srOnly } from '../console/format'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Badge, Card, CardBody, CardDescription, CardFooter, CardHeader, Alert, EmptyState, PageHeader, Skeleton, Stack, Table, TBody, Td, Th, THead, Tr } from '../../components/primitives'

function Profile() {
  const t = useT()
  const toast = useToast()
  const { user, loading, resendVerification } = useAuth()
  const caps = useCapabilities()
  const { update } = useUpdateProfile()
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState<string | null>(null)
  if (loading || !user) return <div role="status"><Skeleton height="1.5rem" /><p>{t('common.loading')}</p></div>
  const current = name ?? user.name
  const dirty = current.trim() !== user.name && current.trim() !== ''
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    try { await update({ name: current.trim() }); setName(null); toast.success(t('account.profile.saved')) }
    catch (err) { toast.error(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader><h2>{t('account.tab.profile')}</h2><CardDescription>{t('account.profile.help')}</CardDescription></CardHeader>
        <CardBody>
          <Stack>
            <Field name="name"><FieldLabel>{t('account.profile.name')}</FieldLabel><Input required value={current} onValueChange={(v) => setName(String(v))} autoComplete="name" /><FieldError /></Field>
            <Field name="email">
              <FieldLabel>{t('account.profile.email')}</FieldLabel>
              <Input type="email" value={user.email} readOnly autoComplete="email" />
              <FieldDescription>{t('account.profile.emailHelp')} <Link to="/console/support?subject=Change%20my%20sign-in%20email">{t('account.profile.emailChange')}</Link></FieldDescription>
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Badge tone={user.emailVerified ? 'success' : 'warning'}>{user.emailVerified ? t('account.profile.verified') : t('account.profile.unverified')}</Badge>
              {!user.emailVerified && caps.emailVerification && <Button type="button" onClick={() => void resendVerification().then(() => toast.success(t('account.profile.resent'))).catch((err: unknown) => toast.error(err instanceof Error ? err.message : String(err)))}>{t('account.profile.resend')}</Button>}
            </div>
          </Stack>
        </CardBody>
        <CardFooter><Button type="submit" data-variant="solid" disabled={busy || !dirty}>{t('account.profile.save')}</Button></CardFooter>
      </Card>
    </form>
  )
}

function Password() {
  const t = useT()
  const toast = useToast()
  const { changePassword } = useUpdateProfile()
  const [mismatch, setMismatch] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [failed, setFailed] = useState(false)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const type = show ? 'text' : 'password'
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    setWrong(false); setFailed(false)
    if (f.get('next') !== f.get('confirm')) { setMismatch(true); return }
    setMismatch(false); setBusy(true)
    try {
      await changePassword(String(f.get('current')), String(f.get('next')))
      toast.success(t('account.password.done'))
      form.reset()
    } catch (err) {
      const code = (err as { code?: string; status?: number } | null)
      if (code?.code === 'invalid_password' || code?.status === 400 || code?.status === 401 || code?.status === 403) setWrong(true); else setFailed(true)
    } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader><h2>{t('account.tab.password')}</h2><CardDescription>{t('account.password.help')}</CardDescription></CardHeader>
        <CardBody>
          <SettingRow title={t('account.password.save')} description={t('account.password.rules')}>
            <Field name="current" invalid={wrong ? true : undefined}><FieldLabel>{t('account.password.current')}</FieldLabel><Input type={type} required autoComplete="current-password" onValueChange={() => setWrong(false)} /><FieldError match={wrong}>{t('account.password.wrong')}</FieldError></Field>
            <Field name="next"><FieldLabel>{t('account.password.new')}</FieldLabel><Input type={type} required minLength={8} autoComplete="new-password" /><FieldDescription>{t('account.password.rules')}</FieldDescription><FieldError /></Field>
            <Field name="confirm" invalid={mismatch ? true : undefined}>
              <FieldLabel>{t('account.password.confirm')}</FieldLabel>
              <Input type={type} required autoComplete="new-password" onValueChange={() => setMismatch(false)} />
              <FieldError>{() => t('account.password.mismatch')}</FieldError>
            </Field>
            <label><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> {t('account.password.show')}</label>
            {failed && <Alert tone="danger">{t('account.password.error')}</Alert>}
          </SettingRow>
        </CardBody>
        <CardFooter><Button type="submit" data-variant="solid" disabled={busy}>{t('account.password.save')}</Button></CardFooter>
      </Card>
    </form>
  )
}

function Sessions() {
  const t = useT()
  const { sessions, loading, revoke } = useSessions()
  const [target, setTarget] = useState<string | null>(null)
  if (loading) return <div role="status"><Skeleton height="1.5rem" /><p>{t('common.loading')}</p></div>
  return (
    <Card>
      <CardHeader><h2>{t('account.tab.sessions')}</h2><CardDescription>{t('account.sessions.help')}</CardDescription></CardHeader>
      {!sessions.length ? <EmptyState title={t('account.sessions.empty')} description={t('account.sessions.emptyHelp')} /> : (
        <Table>
          <THead><Tr>
            <Th scope="col">{t('account.sessions.device')}</Th><Th scope="col">{t('account.sessions.ip')}</Th>
            <Th scope="col">{t('account.sessions.lastActive')}</Th><Th scope="col"><span style={srOnly}>{t('account.sessions.revoke')}</span></Th>
          </Tr></THead>
          <TBody>{sessions.map((s) => (
            <Tr key={s.id}>
              <Td>{s.device}</Td><Td>{s.ip}</Td><Td>{formatWhen(s.lastActive)}</Td>
              <Td>{s.current ? <Badge tone="success">{t('account.sessions.current')}</Badge> : <Button data-variant="ghost" onClick={() => setTarget(s.id)}>{t('account.sessions.revoke')}</Button>}</Td>
            </Tr>
          ))}</TBody>
        </Table>
      )}
      <ConfirmDialog open={!!target} title={t('account.sessions.revoke.title')} description={t('account.sessions.revoke.text')} confirmLabel={t('account.sessions.revoke')} onClose={() => setTarget(null)} onConfirm={() => { if (target) void revoke(target) }} />
    </Card>
  )
}

function Tokens() {
  const t = useT()
  const { tokens, loading, create, revoke } = useApiTokens()
  const [secret, setSecret] = useState<string | null>(null)
  const [rv, setRv] = useState<{ id: string; name: string } | null>(null)
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const tok = await create(String(new FormData(form).get('name')))
    setSecret(tok.secret ?? null)
    form.reset()
  }
  return (
    <Stack>
      <form onSubmit={submit}>
        <Card>
          <CardHeader><h2>{t('account.tab.tokens')}</h2><CardDescription>{t('account.tokens.help')}</CardDescription></CardHeader>
          <CardBody>
            <Field name="name"><FieldLabel>{t('account.tokens.name')}</FieldLabel><Input required placeholder={t('account.tokens.placeholder')} /><FieldError /></Field>
          </CardBody>
          <CardFooter><Button type="submit" data-variant="solid">{t('account.tokens.create')}</Button></CardFooter>
        </Card>
      </form>
      {secret && <Alert tone="success">{t('account.tokens.secret')} <code>{secret}</code></Alert>}
      <Card>
        {loading ? <CardBody><div role="status"><Skeleton height="1.5rem" /><p>{t('common.loading')}</p></div></CardBody> : !tokens.length ? <EmptyState title={t('account.tokens.empty')} description={t('account.tokens.emptyHelp')} /> : (
          <Table>
            <THead><Tr>
              <Th scope="col">{t('account.tokens.name')}</Th><Th scope="col">{t('account.tokens.created')}</Th><Th scope="col"><span style={srOnly}>{t('account.tokens.revoke')}</span></Th>
            </Tr></THead>
            <TBody>{tokens.map((k) => (
              <Tr key={k.id}>
                <Td>{k.name} <code>{k.prefix}…</code></Td><Td>{formatDay(k.createdAt)}</Td>
                <Td><Button data-variant="ghost" style={{ color: 'var(--color-destructive)' }} onClick={() => setRv({ id: k.id, name: k.name })}>{t('account.tokens.revoke')}</Button></Td>
              </Tr>
            ))}</TBody>
          </Table>
        )}
      </Card>
      <ConfirmDialog open={!!rv} destructive title={t('account.tokens.revoke.title', { name: rv?.name ?? '' })} description={t('account.tokens.revoke.text')} confirmLabel={t('account.tokens.revoke')} onClose={() => setRv(null)} onConfirm={() => { if (rv) void revoke(rv.id) }} />
    </Stack>
  )
}

export function AccountPage() {
  const t = useT()
  const caps = useCapabilities()
  const ticket = `/console/support?subject=${encodeURIComponent(t('account.danger.subject'))}&body=${encodeURIComponent(t('account.danger.body'))}`
  return (
    <div>
      <PageHeader title={t('account.title')} />
      <Stack>
        <Tabs defaultValue="profile">
          <TabsList aria-label={t('account.tabs')}>
            <TabsTab value="profile">{t('account.tab.profile')}</TabsTab>
            <TabsTab value="password">{t('account.tab.password')}</TabsTab>
            {caps.sessions && <TabsTab value="sessions">{t('account.tab.sessions')}</TabsTab>}
            {caps.apiTokens && <TabsTab value="tokens">{t('account.tab.tokens')}</TabsTab>}
          </TabsList>
          <TabsPanel value="profile"><Profile /></TabsPanel>
          <TabsPanel value="password"><Password /></TabsPanel>
          {caps.sessions && <TabsPanel value="sessions"><Sessions /></TabsPanel>}
          {caps.apiTokens && <TabsPanel value="tokens"><Tokens /></TabsPanel>}
        </Tabs>
        <Card aria-labelledby="account-danger" style={{ borderColor: 'color-mix(in oklab, var(--color-destructive) 35%, var(--color-border))' }}>
          <CardHeader><h2 id="account-danger">{t('account.danger.title')}</h2><CardDescription>{t('account.danger.text')}</CardDescription></CardHeader>
          <CardFooter><Button data-variant="ghost" style={{ color: 'var(--color-destructive)' }} data-testid="request-account-deletion" render={<Link to={ticket} />}>{t('account.danger.action')}</Button></CardFooter>
        </Card>
      </Stack>
    </div>
  )
}
