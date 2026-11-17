import { Link } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { usePlans, useAuth } from '../../data'
import { useSaas } from '../../app/context'
import { useT } from '../../i18n'
import { planMoney, recommendedPlanId } from '../../components/PlanCards'
import { Badge, Card, CardBody, CardFooter, CardHeader, Grid, Skeleton } from '../../components/primitives'

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ flex: 'none', alignSelf: 'center', color: 'var(--color-fg)' }}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)

export function Pricing() {
  const t = useT()
  const { site } = useSaas()
  const { plans, loading } = usePlans()
  const { user } = useAuth()
  const featured = recommendedPlanId(plans)
  return (
    <>
      <div data-slot="section-header" data-align="center" style={{ marginBlock: 'var(--space-8) var(--space-12)' }}>
        <h1>{t('pricing.title')}</h1>
        <p data-slot="lead">{t('pricing.subtitle')}</p>
      </div>
      {loading ? <div role="status"><Skeleton height="16rem" /><span className="muted">{t('common.loading')}</span></div> : plans.length === 0 ? <p role="alert" style={{ textAlign: 'center' }}>{t('pricing.empty')} <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a></p> : (
        <Grid min="16rem" role="list">
          {plans.map((p, i) => {
            const prev = i > 0 ? plans[i - 1] : undefined
            const inherited = prev ? new Set(prev.features) : new Set<string>()
            const shown = prev ? p.features.filter((f) => !inherited.has(f)) : p.features
            const extendsPrev = !!prev
            const popular = p.id === featured
            return (
              <Card key={p.id} role="listitem" data-highlighted={popular ? '' : undefined}>
                <CardHeader>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', height: '1.75rem', width: '100%' }}>
                    <h2>{p.name}</h2>
                    {popular && <Badge style={{ lineHeight: 1.25, color: 'var(--color-primary)', background: 'color-mix(in oklab, var(--color-primary) 10%, var(--color-bg))', borderColor: 'color-mix(in oklab, var(--color-primary) 30%, transparent)' }}>{t('pricing.popular')}</Badge>}
                  </div>
                </CardHeader>
                <CardBody>
                  {p.description && <p className="muted" style={{ marginBlock: '0 var(--space-3)', fontSize: 'var(--text-sm)' }}>{p.description}</p>}
                  <p data-slot="price" style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                    <span>{planMoney(p, site.currency, site.defaultLocale)}</span>
                    <small style={{ font: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-normal)', color: 'var(--color-muted-fg)', letterSpacing: 0 }}>{t(p.interval === 'year' ? 'pricing.perYear' : 'pricing.perMonth')}</small>
                  </p>
                  {extendsPrev && prev && <p className="muted" style={{ marginBlock: 'var(--space-4) var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{t('pricing.everythingIn', { plan: prev.name })}</p>}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBlockStart: extendsPrev ? 0 : 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {shown.map((f) => <li key={f} style={{ display: 'flex', gap: 'var(--space-2)', margin: 0 }}><Check />{f}</li>)}
                  </ul>
                </CardBody>
                <CardFooter>
                  <Button data-variant={popular ? 'solid' : undefined} style={{ width: '100%' }} render={<Link to={`/checkout?plan=${encodeURIComponent(p.id)}`} />}>{t('pricing.choose', { plan: p.name })}</Button>
                </CardFooter>
              </Card>
            )
          })}
        </Grid>
      )}
      {!loading && plans.length > 0 && (
        <div style={{ maxWidth: '42rem', marginInline: 'auto', marginBlockStart: 'var(--space-8)', textAlign: 'center' }}>
          <p className="muted" style={{ margin: 0 }}>{t('pricing.taxNote')}</p>
          <h2 style={{ fontSize: 'var(--text-lg, 1.125rem)', marginBlock: 'var(--space-4) var(--space-2)' }}>{t('pricing.afterTitle')}</h2>
          <p className="muted" style={{ margin: 0 }}>{user ? t('pricing.afterBody').replace(/ You need an account to continue\.$/, '') : t('pricing.afterBody')}</p>
        </div>
      )}
    </>
  )
}
