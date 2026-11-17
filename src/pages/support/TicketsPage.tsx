import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { Field, FieldDescription, FieldLabel } from '@ui-sdk/react/field'
import { Input } from '@ui-sdk/react/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui-sdk/react/select'
import { Textarea } from '@ui-sdk/react/textarea'
import { useTickets } from '../../data'
import { useT } from '../../i18n'
import { useToast } from '../../app/context'
import { Alert, Badge, Card, CardBody, CardFooter, CardHeader, PageHeader, Skeleton, Stack, Table, TBody, Td, Th, THead, Tr } from '../../components/primitives'
import { formatDay } from '../console/format'
import { site } from '../../config/site'

const TOPICS = ['billing', 'backup', 'domain', 'broken', 'other'] as const
/** A real address only: empty or the example.com placeholder is hidden. */
export const realSupportEmail = (e: string | undefined) => (e && !/@example\.(com|org|net)$/i.test(e) ? e : '')

export function TicketsPage() {
  const t = useT()
  const toast = useToast()
  const [params] = useSearchParams()
  const { tickets, loading, create } = useTickets()
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>('other')
  const [subject, setSubject] = useState(params.get('subject') ?? '')
  const [body, setBody] = useState(params.get('body') ?? '')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const email = realSupportEmail(site.supportEmail)
  useEffect(() => { if (params.get('subject')) formRef.current?.scrollIntoView?.({ block: 'start' }) }, [params])
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(false); setBusy(true)
    try {
      await create(topic === 'other' ? subject : `[${t(`support.topic.${topic}`)}] ${subject}`, body)
      setSubject(''); setBody('')
      toast.success(t('support.sent'), { description: t('support.sentHelp') })
    } catch { setError(true) } finally { setBusy(false) }
  }
  const last = (k: (typeof tickets)[number]) => k.messages[k.messages.length - 1]?.at || k.createdAt
  const first = !loading && tickets.length === 0
  const form = (
    <form onSubmit={(e) => void submit(e)} ref={formRef} id="new-request">
      <Card>
        <CardHeader><h2>{t('support.new')}</h2></CardHeader>
        <CardBody>
          <Field name="topic"><FieldLabel>{t('support.topic')}</FieldLabel>
            <Select value={topic} items={TOPICS.map((x) => ({ value: x, label: t(`support.topic.${x}`) }))} onValueChange={(v) => setTopic(String(v) as (typeof TOPICS)[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TOPICS.map((x) => <SelectItem key={x} value={x}>{t(`support.topic.${x}`)}</SelectItem>)}</SelectContent>
            </Select></Field>
          <Field name="subject"><FieldLabel>{t('support.subject')}</FieldLabel><Input required placeholder={t('support.subjectPlaceholder')} value={subject} onValueChange={setSubject} /></Field>
          <Field name="message"><FieldLabel>{t('support.message')}</FieldLabel><Textarea required value={body} onValueChange={setBody} /><FieldDescription>{t('support.messageHelp')}</FieldDescription></Field>
          {error && <Alert tone="danger">{t('support.sendFailed')}</Alert>}
        </CardBody>
        <CardFooter><Button type="submit" data-variant="solid" disabled={busy}>{t('support.submit')}</Button></CardFooter>
      </Card>
    </form>
  )
  return (
    <section aria-labelledby="support-h">
      <PageHeader title={<span id="support-h">{t('support.title')}</span>} description={email ? t('support.contact', { email }) : undefined}
        actions={first ? undefined : <Button data-variant="solid" onClick={() => formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })}>{t('support.newCta')}</Button>} />
      <Stack>
        {first && form}
        {!first && <Card>
          {loading ? <CardBody><div role="status"><Skeleton height="1.5rem" /><p>{t('common.loading')}</p></div></CardBody> : (
            <Table>
              <THead><Tr><Th scope="col">{t('support.subject')}</Th><Th scope="col">{t('support.status')}</Th><Th scope="col">{t('support.col.updated')}</Th></Tr></THead>
              <TBody>
                {tickets.map((k) => (
                  <Tr key={k.id}>
                    <Td><Link to={`/console/support/${k.id}`}>{k.subject}</Link></Td>
                    <Td><Badge tone={k.status === 'closed' ? 'neutral' : k.status === 'pending' ? 'warning' : 'success'}>{t(`support.status.${k.status}`)}</Badge></Td>
                    <Td>{formatDay(last(k))}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>}
        {!first && form}
      </Stack>
    </section>
  )
}
