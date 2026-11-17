import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@ui-sdk/react/field'
import { Input } from '@ui-sdk/react/input'
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from '@ui-sdk/react/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui-sdk/react/select'
import { PageHeader, Card, CardBody, CardFooter, Alert, Skeleton, Stack } from '../../components/primitives'
import { useT } from '../../i18n'
import { useToast } from '../../app/context'
import { useInstances, usePlans, useProvisioning, useSiteDomain, useSlugAvailability } from '../../data'
import { SLUG_RE, normalizeTyping } from '../../data/slug'
import { site } from '../../config/site'

function Provisioning({ slug }: { slug: string }) {
  const t = useT()
  const toast = useToast()
  const p = useProvisioning(slug)
  const notified = useRef(false)
  const done = p.status === 'active'
  useEffect(() => { if (done && !notified.current) { notified.current = true; toast(t('console.create.done', { name: slug })) } }, [done, toast, t, slug])
  const current = p.steps.find((s) => s.state === 'current') ?? p.steps.find((s) => s.state === 'upcoming')
  return (
    <>
      <PageHeader title={t('console.create.provisioning')} />
      <Card><CardBody><Stack>
        {p.status === 'failed' ? (
          <Alert tone="danger">{t('console.create.failed')} <Link to="/console/support">{t('console.create.failedLink')}</Link></Alert>
        ) : (<>
          <div role="status">{done ? t('console.create.done', { name: slug }) : current?.label ?? <><Skeleton height="1rem" />{t('common.loading')}</>}</div>
          <Progress value={p.progress}>
            <ProgressLabel>{t('console.create.provisioning')}</ProgressLabel>
            <ProgressValue />
            <ProgressTrack><ProgressIndicator /></ProgressTrack>
          </Progress>
          {!done && <p className="muted">{t('console.create.eta')}</p>}
        </>)}
      </Stack></CardBody>
      {done && <CardFooter>
        <Button data-variant="solid" data-testid="view-instance" render={<a href={p.url} target="_blank" rel="noreferrer" />}>{t('console.create.open')}</Button>
        <Button data-variant="ghost" render={<Link to="/console" />}>{t('console.create.dashboard')}</Button>
      </CardFooter>}</Card>
    </>
  )
}

function useDebounced<T>(value: T, ms: number) {
  const [d, setD] = useState(value)
  useEffect(() => { const id = setTimeout(() => setD(value), ms); return () => clearTimeout(id) }, [value, ms])
  return d
}

export function CreateInstancePage() {
  const t = useT()
  const nav = useNavigate()
  const { create } = useInstances()
  const { plans } = usePlans()
  const domain = useSiteDomain() ?? site.siteDomain
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)
  const [planId, setPlanId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [started, setStarted] = useState<{ id: string; jobId: string } | null>(null)
  const slug = name.replace(/-+$/, '')
  const slugOk = SLUG_RE.test(slug)
  const debounced = useDebounced(slugOk ? slug : '', 400)
  const check = useSlugAvailability(debounced)
  const settled = slugOk && debounced === slug && !check.isFetching && check.data?.slug === slug
  const status: 'idle' | 'invalid' | 'checking' | 'available' | 'unavailable' = !slug ? 'idle' : !slugOk ? 'invalid' : !settled ? 'checking' : check.data!.available ? 'available' : 'unavailable'
  const urlError = (status === 'invalid' && touched ? t('onboarding.urlInvalid') : '') || (status === 'unavailable' ? (check.data!.message || t('onboarding.urlUnavailable')) : '')
  const plan = planId || plans[0]?.id || ''
  const money = (n: number) => new Intl.NumberFormat(site.defaultLocale, { style: 'currency', currency: site.currency, maximumFractionDigits: 0 }).format(n)
  if (started) return <Provisioning slug={slug} />
  async function submit(e: FormEvent) {
    e.preventDefault(); setTouched(true); setError('')
    if (status !== 'available') return
    setBusy(true)
    try { setStarted(await create({ name: slug, planId: plan })) }
    catch (err) { setError(t('console.create.error', { reason: err instanceof Error ? err.message : '' }).trim()); setBusy(false) }
  }
  return (
    <>
      <PageHeader title={t('console.create.title')} />
      <Card><form onSubmit={(e) => void submit(e)} noValidate>
        <CardBody><Stack>
        <Field invalid={!!urlError}>
          <FieldLabel>{t('onboarding.urlLabel')}</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 'var(--space-2)' }}>
            <Input name="name" value={name} onValueChange={(v) => setName(normalizeTyping(String(v)))} onBlur={() => { setTouched(true); setName((n) => n.replace(/-+$/, '')) }} aria-invalid={!!urlError} aria-describedby="create-status create-help"
              autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="your-name" style={{ flex: 1, minWidth: 0 }} required data-testid="instance-name" />
            {domain && <span aria-hidden="true" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>.{domain}</span>}
          </div>
          <div id="create-status" aria-live="polite" style={{ minHeight: '1.5em', fontSize: '0.875em' }}>
            {status === 'checking' && <span>{t('onboarding.urlChecking')}</span>}
            {status === 'available' && <span style={{ color: 'var(--color-success, green)' }}>✓ {t('onboarding.urlAvailable')}</span>}
            {urlError && <FieldError match>{urlError}</FieldError>}
            {status === 'unavailable' && check.data?.suggestion && <> <Button type="button" onClick={() => setName(check.data!.suggestion!)}>{t('onboarding.urlUse', { slug: check.data.suggestion })}</Button></>}
          </div>
          {domain && slugOk && <p style={{ margin: 0, fontSize: '0.875em' }}>{t('onboarding.urlPreview', { url: `https://${slug}.${domain}` })}</p>}
          <FieldDescription id="create-help">{t('onboarding.urlHelp')}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>{t('console.create.plan')}</FieldLabel>
          <Select items={plans.map((p) => ({ value: p.id, label: t('console.create.planOption', { name: p.name, price: money(p.price), interval: p.interval }) }))} value={plan} onValueChange={(v) => v && setPlanId(String(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{t('console.create.planOption', { name: p.name, price: money(p.price), interval: p.interval })}</SelectItem>)}</SelectContent>
          </Select>
          <FieldDescription>{t('console.create.planNote')}</FieldDescription>
        </Field>
        {error && <Alert tone="danger">{error}</Alert>}
        </Stack></CardBody>
        <CardFooter>
          <Button type="button" data-variant="ghost" onClick={() => nav('/console')}>{t('console.create.cancel')}</Button>
          <Button type="submit" data-variant="solid" disabled={busy || status === 'checking' || status === 'unavailable'} data-testid="create-submit">{busy ? t('console.create.creating') : t('console.create.submit')}</Button>
        </CardFooter>
      </form></Card>
    </>
  )
}
