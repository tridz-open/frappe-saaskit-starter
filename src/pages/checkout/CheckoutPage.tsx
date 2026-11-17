import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { Card, CardBody, CardFooter, CardHeader } from '../../components/primitives/Card'
import { Alert } from '../../components/primitives/Alert'
import { Stack } from '../../components/primitives/Layout'
import { useSaas } from '../../app/context'
import { useT } from '../../i18n'
import { useCheckout, usePlans, useAuth, useSiteDomain, CheckoutDismissed } from '../../data'
import { Skeleton } from '../../components/primitives'
import { money, shortRef, friendlyError, nowRef } from '../../lib/display'

const css = `
.co-wrap{max-width:32rem;margin-inline:auto;padding-block:var(--space-8) var(--space-12)}
.co-steps{margin-bottom:var(--space-2)!important;display:flex;align-items:center;gap:var(--space-3);list-style:none;margin:0;padding:0;font-size:var(--text-sm);color:var(--color-muted-fg)}
.co-steps li{display:flex;align-items:center;gap:var(--space-2);white-space:nowrap}
.co-steps li+li::before{content:"";width:1.5rem;height:1px;background:var(--color-border);margin-right:var(--space-1)}
.co-steps .dot{display:grid;place-items:center;width:1.375rem;height:1.375rem;border-radius:var(--radius-full);border:1px solid var(--color-border);font-size:var(--text-xs);font-variant-numeric:tabular-nums}
.co-steps [aria-current="step"]{color:var(--color-fg);font-weight:600}
.co-steps [aria-current="step"] .dot{background:var(--color-primary);border-color:var(--color-primary);color:var(--color-primary-fg)}
.co-steps .done .dot{background:var(--color-success);border-color:var(--color-success);color:var(--color-bg)}
.co-rows{margin:0;display:grid!important;grid-template-columns:1fr!important;gap:var(--space-3)}
.co-rows>div{display:flex!important;flex-direction:row!important;border:0;padding:0;justify-content:space-between;gap:var(--space-4);align-items:baseline;grid-template-columns:none}
.co-rows dt,.co-rows dd{border:0!important;padding:0!important;min-height:0;width:auto}
.co-rows dt{flex:1;color:var(--color-muted-fg);font-size:var(--text-sm)}
.co-rows dd{margin:0;text-align:right;font-weight:500}
.co-rows>.co-total{border-top:1px solid var(--color-border);padding-top:var(--space-4);margin-top:var(--space-1)}
.co-total dd{font-size:var(--text-xl);font-weight:600;font-variant-numeric:tabular-nums}
.co-total small{font-size:var(--text-sm);font-weight:400;color:var(--color-muted-fg)}
.co-note{margin:0;font-size:var(--text-sm);color:var(--color-muted-fg);line-height:1.5}
.co-cta{width:100%}
.co-links{display:flex;justify-content:space-between;gap:var(--space-4);flex-wrap:wrap;font-size:var(--text-sm)}
.co-next{margin:0;padding-left:1.25rem;display:grid;gap:var(--space-1);font-size:var(--text-sm);color:var(--color-muted-fg);line-height:1.5}
.co-next-h{margin:var(--space-2) 0 0;font-size:var(--text-sm);font-weight:600}
@media (max-width:30rem){.co-steps{gap:var(--space-2)}.co-steps li+li::before{width:.75rem}}
`

export default function CheckoutPage() {
  const t = useT()
  const nav = useNavigate()
  const { site } = useSaas()
  const { user } = useAuth()
  const domain = useSiteDomain() ?? site.siteDomain
  const [params] = useSearchParams()
  const { plans, loading } = usePlans()
  const checkout = useCheckout()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)
  const planId = params.get('plan')
  const instance = params.get('instance')
  const plan = plans.find((p) => p.id === planId)
  const support = site.supportEmail
  const slug = (instance ?? '').trim()
  const address = slug ? `${slug}${domain ? `.${domain}` : ''}` : ''
  const email = user?.email ?? ''

  useEffect(() => { if (error || cancelled) alertRef.current?.focus() }, [error, cancelled])

  // No address chosen: send the customer back to the onboarding address step instead of inventing one.
  if (!instance && planId) return <Navigate to={`/onboarding?step=2&plan=${encodeURIComponent(planId)}`} replace />

  async function pay() {
    if (!plan) return
    setBusy(true); setError(null); setCancelled(false)
    let ref = shortRef(nowRef())
    try {
      const s = await checkout.start(plan.id, { slug })
      ref = shortRef(s.sessionId) || ref
      if (s.provider === 'razorpay') {
        const r = await checkout.payInPage(s)
        setConfirming(true)
        nav(`/provisioning/${r.tenant ?? s.tenant ?? ''}`)
      } else if (s.paymentMocked) {
        nav(`/provisioning/${s.tenant ?? s.jobId ?? ''}`)
      } else if (s.url) {
        if (s.url.startsWith('/')) nav(s.url)
        else window.location.assign(s.url)
      } else {
        throw new Error('no checkout url')
      }
    } catch (e) {
      if (e instanceof CheckoutDismissed) setCancelled(true)
      else {
        const declined = e instanceof Error && /declin|payment failed|card/i.test(e.message)
        setError(friendlyError(e, declined ? 'checkout.declined' : 'checkout.error', { support, ref }))
      }
      setBusy(false)
    }
  }

  const steps = [
    { k: 'plan', cls: 'done', mark: '\u2713' },
    { k: 'payment', cls: '', mark: '2', current: true },
    { k: 'setup', cls: '', mark: '3' },
  ]
  const back = `/onboarding?step=2${planId ? `&plan=${encodeURIComponent(planId)}` : ''}`
  const pricing = `/pricing${instance ? `?instance=${encodeURIComponent(instance)}` : ''}`

  return (
    <Stack className="co-wrap" aria-labelledby="co" role="region" gap="var(--space-6)">
      <style>{css}</style>
      <ol className="co-steps" aria-label={t('checkout.steps')}>
        {steps.map((s) => (
          <li key={s.k} className={s.cls} aria-current={s.current ? 'step' : undefined}>
            <span className="dot" aria-hidden="true">{s.mark}</span>{t(`checkout.step.${s.k}`)}
          </li>
        ))}
      </ol>
      <h1 id="co" style={{ margin: 0 }}>{t('checkout.title')}</h1>
      <div aria-live="polite" ref={alertRef} tabIndex={-1} style={{ outline: 'none' }}>
        {cancelled && <Alert tone="neutral" role="status">{t('checkout.dismissed', { support })}</Alert>}
        {error && <Alert tone="danger" role="alert">{error}</Alert>}
      </div>
      <Card>
        <CardHeader><h2 id="sum" style={{ margin: 0 }}>{t('checkout.summary')}</h2></CardHeader>
        <CardBody>
          {loading ? (
            <Stack role="status" gap="var(--space-3)"><Skeleton height="1.5rem" /><Skeleton height="1.5rem" /><span className="co-note">{t('checkout.loading')}</span></Stack>
          ) : plan ? (
            <Stack gap="var(--space-4)">
              <dl className="co-rows">
                <div><dt>{t('checkout.plan')}</dt><dd>{plan.name}</dd></div>
                <div><dt>{t('checkout.billing')}</dt><dd>{t(plan.interval === 'year' ? 'checkout.billing.year' : 'checkout.billing.month')}</dd></div>
                {address && <div><dt>{t('checkout.address')}</dt><dd>{address}</dd></div>}
                {email && <div><dt>{t('checkout.account')}</dt><dd>{email}</dd></div>}
                <div className="co-total"><dt>{t('checkout.total')}</dt><dd>{money(plan.price, site.currency)} <small>{t(plan.interval === 'year' ? 'checkout.perYear' : 'checkout.perMonth')}</small></dd></div>
              </dl>
              <p className="co-note">{t('checkout.tax')}</p>
              <p className="co-note">{t('checkout.cancelAnytime')}</p>
            </Stack>
          ) : (
            <Stack gap="var(--space-4)">
              <p className="co-note">{planId ? t('checkout.planGone') : t('checkout.noPlan')}</p>
              <Button data-variant="solid" render={<Link to="/pricing" />}>{planId ? t('checkout.seePlans') : t('checkout.choosePlan')}</Button>
            </Stack>
          )}
        </CardBody>
        {plan && (
          <CardFooter>
            <Stack gap="var(--space-3)" style={{ width: '100%' }}>
              <Button className="co-cta" data-variant="solid" onClick={pay} disabled={busy}>{confirming ? t('checkout.confirming') : busy ? t('checkout.redirecting') : cancelled || error ? t('checkout.retry') : t('checkout.pay')}</Button>
              <p className="co-next-h">{t('checkout.next.title')}</p>
              <ol className="co-next">
                <li>{t('checkout.next.1')}</li>
                <li>{t('checkout.next.2')}</li>
                <li>{email ? t('checkout.next.3', { email }) : t('checkout.next.3.noemail')}</li>
              </ol>
              <p className="co-note">{t('checkout.receipt')}</p>
            </Stack>
          </CardFooter>
        )}
      </Card>
      {plan && (
        <div className="co-links">
          <span><Link to={back} aria-disabled={busy}>{t('checkout.back')}</Link> {'\u00b7'} <Link to={pricing} aria-disabled={busy}>{t('checkout.changePlan')}</Link></span>
          <a href={`mailto:${support}`}>{t('checkout.help', { support })}</a>
        </div>
      )}
    </Stack>
  )
}
