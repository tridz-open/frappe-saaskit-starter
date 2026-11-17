import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { useSaas } from '../../app/context'
import { useT } from '../../i18n'
import { Row, Stack } from '../../components/primitives/Layout'

export function ErrorPage({ kind }: { kind: 'notFound' | 'server' | 'maintenance' }) {
  const t = useT()
  const h1 = useRef<HTMLHeadingElement>(null)
  useEffect(() => { h1.current?.focus() }, [])
  const { site } = useSaas()
  const title = { notFound: 'errors.notFound', server: 'errors.serverTitle', maintenance: 'errors.maintenanceTitle' }[kind]
  const body = { notFound: 'errors.notFoundBody', server: 'errors.serverBody', maintenance: 'errors.maintenanceBody' }[kind]
  const code = { notFound: '404', server: '500', maintenance: '503' }[kind]
  return (
    <section role={kind === 'notFound' ? undefined : 'alert'}>
      <Stack style={{ maxWidth: '32rem', marginInline: 'auto', textAlign: 'center', alignItems: 'center', paddingBlock: 'var(--space-12)' }}>
        <p aria-hidden="true" style={{ margin: 0, fontSize: 'clamp(4rem, 14vw, 7rem)', fontWeight: 'var(--weight-bold)', letterSpacing: '-0.05em', lineHeight: 1, color: 'var(--color-border)' }}>{code}</p>
        <h1 ref={h1} tabIndex={-1}>{t(title)}</h1>
        <p data-slot="lead">{t(body)}</p>
        <Row style={{ justifyContent: 'center' }}>
          {kind === 'server' && <Button data-variant="solid" data-size="lg" onClick={() => window.location.reload()}>{t('errors.retry')}</Button>}
          {kind !== 'maintenance' && <Button data-variant="solid" data-size="lg" render={<Link to="/" />}>{t('errors.home')}</Button>}
          <Button data-size="lg" render={<a href={`mailto:${site.supportEmail}`} />}>{t('errors.contact')}</Button>
        </Row>
      </Stack>
    </section>
  )
}
