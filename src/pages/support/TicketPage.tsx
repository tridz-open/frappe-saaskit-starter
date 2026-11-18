import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { Field, FieldLabel } from '@ui-sdk/react/field'
import { Textarea } from '@ui-sdk/react/textarea'
import { useTickets } from '../../data'
import { useT } from '../../i18n'
import { Alert, Badge, Card, CardBody, CardFooter, CardHeader, PageHeader, Skeleton, Stack } from '../../components/primitives'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { formatWhen } from '../console/format'

export function TicketPage() {
  const t = useT()
  const { id = '' } = useParams()
  const { get, loading, reply, close } = useTickets()
  const [confirmClose, setConfirmClose] = useState(false)
  const [body, setBody] = useState('')
  const [error, setError] = useState(false)
  const ticket = get(id)
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(false)
    try { await reply(id, body); setBody('') } catch { setError(true) }
  }
  if (loading) return <div role="status"><Skeleton height="1.5rem" /><p>{t('common.loading')}</p></div>
  return (
    <section>
      <p><Link to="/console/support">{t('support.back')}</Link></p>
      {!ticket ? <Alert tone="danger">{t('support.notFound')}</Alert> : (
        <>
          <PageHeader experimental title={ticket.subject} description={<>{t('support.status')}: <Badge tone={ticket.status === 'closed' ? 'neutral' : ticket.status === 'pending' ? 'warning' : 'success'}>{t(`support.status.${ticket.status}`)}</Badge></>} />
          <Stack>
          <ol aria-label={t('support.conversation')} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-3)' }}>
            {ticket.messages.map((m, i) => {
              const mine = m.from === 'you'
              return (
                <li key={i} style={{ justifySelf: mine ? 'end' : 'start', maxWidth: 'min(100%, 36rem)' }}>
                  <article><Card style={mine ? { background: 'color-mix(in oklab, var(--color-primary, currentColor) 8%, var(--color-bg))' } : undefined}><CardBody>
                    <strong>{mine ? t('support.you') : t('support.staff')}</strong> <time className="muted" dateTime={m.at}>{formatWhen(m.at)}</time><p style={{ whiteSpace: 'pre-wrap' }}>{m.body}</p>
                  </CardBody></Card></article>
                </li>
              )
            })}
          </ol>
          {ticket.status !== 'closed' && (
            <form onSubmit={(e) => void submit(e)}>
              <Card>
                <CardHeader><h2>{t('support.reply')}</h2></CardHeader>
                <CardBody>
                  <Field name="body"><FieldLabel>{t('support.reply')}</FieldLabel><Textarea required value={body} onValueChange={setBody} /></Field>
                  {error && <Alert tone="danger">{t('support.replyFailed')}</Alert>}
                </CardBody>
                <CardFooter>
                  <Button type="button" data-variant="ghost" data-testid="close-ticket" onClick={() => setConfirmClose(true)}>{t('support.close')}</Button>
                  <Button type="submit" data-variant="solid">{t('support.send')}</Button>
                </CardFooter>
              </Card>
            </form>
          )}
          </Stack>
          <ConfirmDialog open={confirmClose} title={t('support.close.title')} description={t('support.close.text')} confirmLabel={t('support.close')} onClose={() => setConfirmClose(false)} onConfirm={() => void close(id)} />
        </>
      )}
    </section>
  )
}
