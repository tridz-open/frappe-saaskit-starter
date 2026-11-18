import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '@ui-sdk/react/button'
import { Field, FieldDescription, FieldLabel } from '@ui-sdk/react/field'
import { Input } from '@ui-sdk/react/input'
import { Textarea } from '@ui-sdk/react/textarea'
import { useAdminBetaAccess } from '../../data'
import type { BetaAddResult, BetaEntry } from '../../data/types'
import { useT } from '../../i18n'
import { Alert, Badge, Card, CardBody, CardFooter, CardHeader, EmptyState, PageHeader, Stack, Table, TBody, Td, Th, THead, Tr } from '../../components/primitives'
import { AdminGate, AdminStatus } from './AdminGate'

/** Splits on newlines, commas and semicolons; lowercases; drops blanks and duplicates. */
export const parseEntries = (text: string): string[] => [...new Set(text.split(/[\n,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean))]
export const isValidEntry = (e: string) => /^@[a-z0-9.-]+\.[a-z]{2,}$/.test(e) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
type Msg = { tone: 'success' | 'danger'; text: string }
const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message && e.message !== 'error' ? e.message : fallback)

function Beta() {
  const t = useT()
  const { entries, signupMode, loading, error, forbidden, refresh, add, remove, resend } = useAdminBetaAccess()
  const [text, setText] = useState(''); const [note, setNote] = useState(''); const [invite, setInvite] = useState(false)
  const [msg, setMsg] = useState<Msg | null>(null); const [rowMsg, setRowMsg] = useState<Msg | null>(null)
  const [busy, setBusy] = useState<string | null>(null); const [adding, setAdding] = useState(false)
  const sorted = useMemo(() => [...entries].sort((a, b) => a.pattern.localeCompare(b.pattern)), [entries])
  const status = AdminStatus({ loading, error, forbidden, refresh })

  const summary = (r: BetaAddResult) => [
    r.added.length ? t('admin.beta.added', { count: r.added.length }) : '',
    r.alreadyListed.length ? t('admin.beta.already', { count: r.alreadyListed.length }) : '',
    r.invitesSent.length ? t('admin.beta.invitesSent', { count: r.invitesSent.length }) : '',
    r.invitesFailed.length ? t('admin.beta.invitesFailed', { count: r.invitesFailed.length }) : '',
  ].filter(Boolean).join(' ')
  async function submit(e: FormEvent) {
    e.preventDefault(); setMsg(null)
    const list = parseEntries(text)
    if (!list.length) { setMsg({ tone: 'danger', text: t('admin.beta.noEntries') }); return }
    const bad = list.filter((p) => !isValidEntry(p))
    if (bad.length) { setMsg({ tone: 'danger', text: t('admin.beta.invalid', { entries: bad.join(', ') }) }); return }
    setAdding(true)
    try { const r = await add(list, invite, note.trim()); setMsg({ tone: r.invitesFailed.length ? 'danger' : 'success', text: summary(r) }); setText(''); setNote('') }
    catch (err) { setMsg({ tone: 'danger', text: errMsg(err, t('admin.beta.addError')) }) } finally { setAdding(false) }
  }
  async function act(key: string, run: () => Promise<void>, ok: string, fail: string) {
    setBusy(key); setRowMsg(null)
    try { await run(); setRowMsg({ tone: 'success', text: ok }) } catch (err) { setRowMsg({ tone: 'danger', text: errMsg(err, fail) }) } finally { setBusy(null) }
  }
  const account = (r: BetaEntry) => r.kind === 'domain' ? t('admin.beta.account.domain') : !r.accountExists ? t('admin.beta.account.none') : (r.verified ? t('admin.beta.account.verified') : t('admin.beta.account.unverified')) + (r.hasTenant ? ` · ${t('admin.beta.account.tenant')}` : '')

  return (
    <section aria-labelledby="admin-beta-h">
      <PageHeader experimental title={<span id="admin-beta-h">{t('admin.beta.title')}</span>} description={t('admin.beta.lead', { mode: signupMode || '-' })} />
      <Stack>
        {status ?? (
          <>
            <form onSubmit={(e) => void submit(e)} aria-label={t('admin.beta.form')}>
              <Card>
                <CardHeader><h2>{t('admin.beta.form')}</h2></CardHeader>
                <CardBody>
                  <Field><FieldLabel>{t('admin.beta.entries')}</FieldLabel><Textarea value={text} onValueChange={(v) => setText(String(v))} rows={3} /><FieldDescription>{t('admin.beta.entriesHelp')}</FieldDescription></Field>
                  <Field><FieldLabel>{t('admin.beta.note')}</FieldLabel><Input value={note} onValueChange={(v) => setNote(String(v))} /></Field>
                  <label style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}><input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} />{t('admin.beta.invite')}</label>
                  {msg && <Alert tone={msg.tone} role="status" data-testid="admin-msg">{msg.text}</Alert>}
                </CardBody>
                <CardFooter><Button type="submit" data-variant="solid" disabled={adding}>{t('admin.beta.add')}</Button></CardFooter>
              </Card>
            </form>
            {rowMsg && <Alert tone={rowMsg.tone} role="status">{rowMsg.text}</Alert>}
            {sorted.length === 0 ? <EmptyState title={t('admin.beta.empty')} description={t('admin.beta.emptyHelp')} /> : (
              <Card><Table>
                <THead><Tr><Th scope="col">{t('admin.beta.col.entry')}</Th><Th scope="col">{t('admin.beta.col.note')}</Th><Th scope="col">{t('admin.beta.col.account')}</Th><Th scope="col">{t('admin.beta.col.actions')}</Th></Tr></THead>
                <TBody>
                  {sorted.map((r) => (
                    <Tr key={r.pattern} data-testid="beta-row">
                      <Th scope="row">{r.pattern} <Badge tone="neutral">{r.kind}</Badge></Th>
                      <Td>{r.note ?? ''}</Td>
                      <Td>{account(r)}</Td>
                      <Td>
                        {r.kind === 'email' && <Button type="button" data-variant="ghost" disabled={busy === r.pattern} onClick={() => void act(r.pattern, () => resend(r.pattern), t('admin.beta.resent', { email: r.pattern }), t('admin.beta.resendError'))}>{t('admin.beta.resend')}</Button>}
                        <Button type="button" data-variant="ghost" disabled={busy === r.pattern} onClick={() => void act(r.pattern, () => remove(r.pattern), t('admin.beta.removed', { pattern: r.pattern }), t('admin.beta.removeError'))}>{t('admin.beta.remove')}</Button>
                      </Td>
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

export function AdminBetaPage() { return <AdminGate><Beta /></AdminGate> }
