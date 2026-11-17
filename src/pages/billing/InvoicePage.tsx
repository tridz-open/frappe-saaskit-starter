import { useParams } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { useInvoicePdf, useInvoices } from '../../data'
import { useT } from '../../i18n'
import { Alert, Card, CardBody, CardHeader, DescriptionList, PageHeader, Skeleton, Stack, Table, TBody, Td, Th, THead, Tr } from '../../components/primitives'
import { BackLink, StatusBadge } from './common'
import { formatDate, money } from '../../lib/display'

function PdfLink({ id }: { id: string }) {
  const t = useT()
  const { url, loading } = useInvoicePdf(id)
  return <Button data-variant="solid" render={<a href={url} download />} disabled={loading} data-testid="invoice-pdf-link">{t('billing.invoice.download')}</Button>
}

export default function InvoicePage() {
  const t = useT()
  const { id = '' } = useParams()
  const { loading, get } = useInvoices()
  const inv = get(id)
  if (loading) return (
    <Stack role="status">
      <Skeleton width="40%" height="2rem" />
      <Skeleton height="8rem" />
      <p>{t('billing.loading')}</p>
    </Stack>
  )
  if (!inv) return <Stack><BackLink /><Alert tone="danger" role="alert">{t('billing.invoice.notFound')}</Alert></Stack>
  const date = formatDate(inv.date)
  const hasLines = inv.lines.length > 0
  const statusText = inv.status === 'paid' && date ? t('billing.invoice.paidOn', { date }) : null
  return (
    <article aria-labelledby="inv-h" data-testid={`invoice-row-${inv.id}`}>
      <BackLink />
      <PageHeader
        title={<span id="inv-h">{inv.number ? t('billing.invoice.title', { number: inv.number }) : t('billing.invoice.pending')}</span>}
        description={<><StatusBadge status={inv.status} /> {statusText ?? (date ? `${t('billing.invoice.issued')} ${date}` : '')}</>}
        actions={<PdfLink id={inv.id} />}
      />
      <Stack>
        <Card>
          <CardHeader><h2>{t('billing.invoice.description')}</h2></CardHeader>
          <CardBody>
            {hasLines && (
              <Table>
                <THead><Tr><Th scope="col">{t('billing.invoice.description')}</Th><Th scope="col">{t('billing.col.amount')}</Th></Tr></THead>
                <TBody>{inv.lines.map((l, i) => <Tr key={i} data-testid="invoice-line"><Td>{l.description}</Td><Td>{money(l.amount, inv.currency)}</Td></Tr>)}</TBody>
              </Table>
            )}
            <DescriptionList items={[
              ...(date ? [[t('billing.invoice.issued'), date] as [string, React.ReactNode]] : []),
              [t('billing.col.status'), <StatusBadge key="status" status={inv.status} />],
              [inv.status === 'open' ? t('billing.invoice.amountDue') : t('billing.invoice.total'), <strong key="amount">{money(inv.amount, inv.currency)}</strong>],
            ]} />
          </CardBody>
        </Card>
      </Stack>
    </article>
  )
}
