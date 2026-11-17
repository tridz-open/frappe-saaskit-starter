import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { useSaas, useSlots } from '../../app/context'
import { useT } from '../../i18n'
import { Card, Grid, Section } from '../../components/primitives'

const svg = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false } as const

const icons: ReactNode[] = [
  // zap
  <svg key="zap" {...svg}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>,
  // shield-check
  <svg key="shield" {...svg}><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>,
  // users
  <svg key="users" {...svg}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.3c2 .7 3.5 2.5 3.5 5.7" /></svg>,
]

export function Landing() {
  const t = useT()
  const { site } = useSaas()
  const { LandingHero } = useSlots()
  return (
    <>
      {LandingHero ? <LandingHero /> : (
        <section aria-labelledby="hero" data-slot="hero">
          <h1 id="hero">{site.name}</h1>
          <p data-slot="lead">{site.tagline}</p>
          <div data-slot="row">
            <Button data-variant="solid" data-size="lg" render={<Link to="/signup" />}>{t('landing.cta')}</Button>
            <Button data-size="lg" render={<Link to="/pricing" />}>{t('landing.seePricing')}</Button>
          </div>
        </section>
      )}
      <Section aria-labelledby="features" title={<span id="features">{t('landing.featuresTitle')}</span>} align="center">
        <Grid min="15rem">
          {[1, 2, 3].map((n) => (
            <Card key={n}>
              <span data-slot="feature-icon" aria-hidden="true">{icons[n - 1]}</span>
              <h3>{t(`landing.feature${n}.title`)}</h3>
              <p className="muted">{t(`landing.feature${n}.body`)}</p>
            </Card>
          ))}
        </Grid>
      </Section>
      <section data-slot="cta" aria-labelledby="cta-title" style={{ paddingBlock: 'var(--space-12)', marginBlockEnd: 'var(--space-12)' }}>
        <h2 id="cta-title">{t('landing.closingTitle')}</h2>
        <p className="muted" style={{ margin: 0 }}>{t('landing.closingBody')}</p>
        <div data-slot="row" style={{ justifyContent: 'center' }}>
          <Button data-variant="solid" data-size="lg" render={<Link to="/signup" />}>{t('landing.cta')}</Button>
          <Button data-size="lg" render={<Link to="/pricing" />}>{t('landing.seePricing')}</Button>
        </div>
      </section>
    </>
  )
}
