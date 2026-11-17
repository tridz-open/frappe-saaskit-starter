import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { useT } from '../../i18n'
import { useSaas } from '../../app/context'
import { Card, CardBody, CardFooter, CardHeader } from '../../components/primitives/Card'
import { Stack } from '../../components/primitives/Layout'

function useFocus() {
  return (el: HTMLHeadingElement | null) => { el?.focus() }
}

export function CheckoutSuccessPage() {
  const t = useT()
  const focus = useFocus()
  const [q] = useSearchParams()
  const tenant = q.get('tenant') ?? q.get('instance')
  return (
    <Stack style={{ maxWidth: '32rem', marginInline: 'auto' }}>
      <Card aria-labelledby="co-ok" role="region">
        <CardHeader><h1 id="co-ok" ref={focus} tabIndex={-1}>{t('checkout.success.title')}</h1></CardHeader>
        <CardBody><p data-slot="lead">{t('checkout.success.body')}</p></CardBody>
        <CardFooter>
          {tenant && <Button data-variant="solid" render={<Link to={`/provisioning/${encodeURIComponent(tenant)}`} />}>{t('checkout.success.cta')}</Button>}
          <Button data-variant={tenant ? undefined : 'solid'} render={<Link to="/console" />}>{t('checkout.success.account')}</Button>
        </CardFooter>
      </Card>
    </Stack>
  )
}

export function CheckoutCancelPage() {
  const t = useT()
  const focus = useFocus()
  const { site } = useSaas()
  const [q] = useSearchParams()
  const plan = q.get('plan'), instance = q.get('instance')
  const retry = plan ? `/checkout?plan=${encodeURIComponent(plan)}${instance ? `&instance=${encodeURIComponent(instance)}` : ''}` : '/pricing'
  return (
    <Stack style={{ maxWidth: '32rem', marginInline: 'auto' }}>
      <Card aria-labelledby="co-cancel" role="region">
        <CardHeader><h1 id="co-cancel" ref={focus} tabIndex={-1}>{t('checkout.cancel.title')}</h1></CardHeader>
        <CardBody>
          <p data-slot="lead">{t('checkout.cancel.body')}</p>
          <p className="muted"><a href={`mailto:${site.supportEmail}`}>{t('checkout.cancel.help', { support: site.supportEmail })}</a></p>
        </CardBody>
        <CardFooter><Button data-variant="solid" render={<Link to={retry} />}>{t('checkout.cancel.retry')}</Button></CardFooter>
      </Card>
    </Stack>
  )
}
