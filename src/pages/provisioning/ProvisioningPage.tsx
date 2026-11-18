import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@ui-sdk/react/button'
import { Card, CardBody, CardFooter, CardHeader } from '../../components/primitives/Card'
import { Alert } from '../../components/primitives/Alert'
import { Stack } from '../../components/primitives/Layout'
import { useT } from '../../i18n'
import { useProvisioning, useAuth, useSiteDomain } from '../../data'
import { useSaas } from '../../app/context'
import { shortRef } from '../../lib/display'
import type { ProvisioningState } from '../../data/types'

const css = `
.pv-wrap{max-width:32rem;margin-inline:auto;padding-block:var(--space-8) var(--space-12)}
.pv-eyebrow{margin:0;font-size:var(--text-sm);color:var(--color-muted-fg)}
.pv-bar[data-indeterminate]>span{width:35%!important;animation:pv-slide 1.4s ease-in-out infinite}
@keyframes pv-slide{from{margin-left:-35%}to{margin-left:100%}}
@media (prefers-reduced-motion:reduce){.pv-bar[data-indeterminate]>span{animation:none;width:100%!important;opacity:.4}}
.pv-meta{display:flex;justify-content:space-between;font-size:var(--text-sm);color:var(--color-muted-fg);font-variant-numeric:tabular-nums}
.pv-bar{height:.375rem;border-radius:var(--radius-full);background:var(--color-muted);overflow:hidden}
.pv-bar>span{display:block;height:100%;background:var(--color-primary);border-radius:inherit;transition:width .4s ease}
.pv-bar[data-s="failed"]>span{background:var(--color-destructive)}
.pv-bar[data-s="active"]>span{background:var(--color-success)}
.pv-steps{list-style:none;margin:0;padding:0;display:grid}
.pv-steps li{position:relative;display:flex;gap:var(--space-3);align-items:center;padding-block:var(--space-3);color:var(--color-muted-fg)}
.pv-steps li:not(:last-child)::after{content:"";position:absolute;left:.6875rem;top:calc(50% + .75rem);bottom:calc(-50% + .75rem);width:1px;background:var(--color-border)}
.pv-steps li[data-s="done"]:not(:last-child)::after{background:var(--color-success)}
.pv-steps li[data-s="current"],.pv-steps li[data-s="failed"]{color:var(--color-fg);font-weight:600}
.pv-steps li[data-s="done"]{color:var(--color-fg)}
.pv-ico{flex:none;width:1.375rem;height:1.375rem;display:grid;place-items:center}
.pv-ico svg{width:100%;height:100%}
.pv-spin{animation:pv-rot 1s linear infinite;transform-origin:center}
@keyframes pv-rot{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.pv-spin{animation:none}.pv-bar>span{transition:none}}
.pv-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.pv-actions{display:flex;flex-wrap:wrap;gap:var(--space-3)}
@media (max-width:30rem){.pv-actions>*{flex:1 1 100%}}
`

type S = 'done' | 'current' | 'upcoming' | 'failed'
function Icon({ s }: { s: S }) {
  const c = { fill: 'none', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24', 'aria-hidden': true }
  if (s === 'done') return <svg {...c}><circle cx="12" cy="12" r="10" fill="var(--color-success)" stroke="none" /><path d="m7.5 12.5 3 3 6-6.5" stroke="var(--color-bg)" /></svg>
  if (s === 'failed') return <svg {...c}><circle cx="12" cy="12" r="10" fill="var(--color-destructive)" stroke="none" /><path d="m8.5 8.5 7 7m0-7-7 7" stroke="var(--color-bg)" /></svg>
  if (s === 'current') return <svg {...c}><circle cx="12" cy="12" r="9" stroke="var(--color-border)" strokeWidth="2.5" /><path className="pv-spin" d="M12 3a9 9 0 0 1 9 9" stroke="var(--color-primary)" strokeWidth="2.5" /></svg>
  return <svg {...c}><circle cx="12" cy="12" r="9" stroke="var(--color-border)" strokeWidth="2" /></svg>
}

function useRefresh() {
  const qc = useQueryClient()
  return async () => { await qc.invalidateQueries() }
}

export type ProvisioningPageProps = {
  /**
   * Primary action shown once provisioning is active, e.g. a sign-in-to-the-new-site button.
   * Replaces the default "Open" link (which is shown only when the state has a `url`). A function
   * receives the live state. Omitted: the default behaviour.
   */
  readyAction?: ReactNode | ((state: ProvisioningState) => ReactNode)
}

/** Route param is the tenant slug (a job id is also accepted by the fixture adapter). */
export default function ProvisioningPage({ readyAction }: ProvisioningPageProps = {}) {
  const t = useT()
  const { site } = useSaas()
  const { user } = useAuth()
  const domain = useSiteDomain() ?? site.siteDomain
  const { tenant = '' } = useParams()
  const p = useProvisioning(tenant)
  const refresh = useRefresh()
  const [checking, setChecking] = useState(false)
  const [checked, setChecked] = useState(false)
  const [slow, setSlow] = useState(false)
  const h1 = useRef<HTMLHeadingElement>(null)
  const waiting = p.status === 'waiting'
  const running = p.status === 'provisioning'
  const support = site.supportEmail
  const ref = shortRef(tenant)
  const email = user?.email
  const paused = p.status === 'failed' && /suspend/i.test(p.error ?? '')
  useEffect(() => {
    if (!(running || waiting)) return
    const id = setTimeout(() => setSlow(true), 10 * 60 * 1000)
    return () => { clearTimeout(id); setSlow(false) }
  }, [running, waiting])
  useEffect(() => { if (p.status === 'active' || p.status === 'failed') h1.current?.focus() }, [p.status])

  // Customer-facing stages derived from overall progress; backend step names are never shown.
  const total = p.steps.length || 1
  const doneCount = p.steps.filter((s) => s.state === 'done').length
  const stage = p.status === 'active' ? 4 : Math.min(3, 1 + Math.floor((doneCount / total) * 3))
  const keys = ['paid', 'site', 'install', 'final']
  const stages = keys.map((k, i) => ({
    key: k,
    label: t(`provisioning.step.${k}`, { product: site.name }),
    state: (i === 0 || i < stage ? 'done' : i === stage ? (p.status === 'failed' ? 'failed' : 'current') : 'upcoming') as S,
  }))
  const pct = p.status === 'active' ? 100 : Math.round(p.progress)
  const cur = stages.find((s) => s.state === 'current')
  const announce = p.status === 'active' ? t('provisioning.announce.done') : p.status === 'failed' ? t('provisioning.announce.failed') : cur ? t('provisioning.announce.step', { step: cur.label }) : ''
  const title = p.status === 'active' ? t('provisioning.ready') : paused ? t('provisioning.suspendedTitle') : p.status === 'failed' ? t('provisioning.failedTitle') : t('provisioning.title')
  const address = p.url ? p.url.replace(/^https?:\/\//, '') : tenant && domain ? `${tenant}.${domain}` : ''
  const mail = `mailto:${support}?subject=${encodeURIComponent(t('provisioning.supportSubject', { ref }))}`

  async function check() {
    setChecking(true); setChecked(false)
    try { await refresh() } finally { setChecking(false); setChecked(true) }
  }

  return (
    <Stack className="pv-wrap" gap="var(--space-6)">
      <style>{css}</style>
      <Card aria-labelledby="pv" role="region">
        <CardHeader>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <h1 id="pv" ref={h1} tabIndex={-1} style={{ margin: 0, outline: 'none' }}>{title}</h1>
          {address && <p className="pv-eyebrow">{address}</p>}
          {(running || waiting) && <p style={{ margin: 0 }}>{t('provisioning.subtitle')} {email ? t('provisioning.closeEmail', { email }) : t('provisioning.close')}</p>}
          </div>
        </CardHeader>
        <CardBody>
          {waiting ? <p role="status">{t('provisioning.waiting')}</p> : (
            <Stack gap="var(--space-5)">
              <div>
                <div className="pv-bar" data-s={p.status} data-indeterminate={running && pct === 0 ? '' : undefined} role="progressbar" aria-label={t('provisioning.progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${cur?.label ?? title}, ${pct}%`}>
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
              <ol className="pv-steps" aria-label={t('provisioning.title')}>
                {stages.map((s) => (
                  <li key={s.key} data-s={s.state} aria-current={s.state === 'current' ? 'step' : undefined}>
                    <span className="pv-ico"><Icon s={s.state} /></span>
                    <span>{s.label}<span className="pv-sr"> {'\u2014'} {t(`provisioning.stepState.${s.state}`)}</span></span>
                  </li>
                ))}
              </ol>
              <div aria-live="polite" role="status">
                <span className="pv-sr">{announce}</span>
                {p.status === 'active' && <Alert tone="success" role="status">{t('provisioning.readyFull')}</Alert>}
                {checked && running && !slow && <p className="muted">{t('provisioning.refreshed')}</p>}
                {slow && running && <Alert tone="neutral" role="status">{t('provisioning.slow', { support, ref })}</Alert>}
              </div>
              {p.status === 'failed' && (
                <Alert tone="danger" role="alert">
                  <strong>{paused ? t('provisioning.suspendedTitle') : t('provisioning.failedTitle')}</strong>
                  <div>{t(paused ? 'provisioning.suspendedBody' : 'provisioning.failedBody', { support, ref })}</div>
                </Alert>
              )}
            </Stack>
          )}
        </CardBody>
        {!waiting && (
          <CardFooter>
            <div className="pv-actions">
              {p.status === 'active' && readyAction != null && (typeof readyAction === 'function' ? readyAction(p) : readyAction)}
              {p.status === 'active' && readyAction == null && p.url && <Button data-variant="solid" render={<a href={p.url} />}>{t('provisioning.open')}</Button>}
              {p.status === 'failed' && <Button data-variant="solid" render={<a href={mail} />}>{t('provisioning.support')}</Button>}
              {p.status !== 'active' && <Button onClick={check} disabled={checking}>{t('provisioning.retry')}</Button>}
              <Button data-variant={p.status === 'active' && !p.url && readyAction == null ? 'solid' : undefined} render={<Link to="/console" />}>{p.status === 'active' ? t('provisioning.console') : t('provisioning.leave')}</Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </Stack>
  )
}
