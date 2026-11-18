import { useEffect, useState, type ComponentProps, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, usePlans, useSignupFields, useSiteDomain, useSlugAvailability, type OnboardingField } from '../../data'
import { stashRecipeFields } from '../../data/recipeFields'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui-sdk/react/select'
import { Button } from '@ui-sdk/react/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@ui-sdk/react/field'
import { Input } from '@ui-sdk/react/input'
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack } from '@ui-sdk/react/progress'
import { PlanRadioCards, recommendedPlanId } from '../../components/PlanCards'
import { Card, CardBody, CardFooter, CardHeader } from '../../components/primitives/Card'
import { Row, Stack } from '../../components/primitives/Layout'
import { useT } from '../../i18n'
import { site } from '../../config/site'
import { SLUG_RE, normalizeTyping, slugify } from '../../data/slug'

// Signup already asks for the name, so onboarding starts at the workspace step (internal steps 2..3).
const FIRST = 2
const TOTAL = 3
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function useDebounced<T>(value: T, ms: number) {
  const [d, setD] = useState(value)
  useEffect(() => { const id = setTimeout(() => setD(value), ms); return () => clearTimeout(id) }, [value, ms])
  return d
}

export type OnboardingProps = {
  /** Forwarded to the plan step's `PlanRadioCards`: `highlightPlanId`, `renderPlanFeatures`, `badgeLabel`. */
  planCards?: Pick<ComponentProps<typeof PlanRadioCards>, 'highlightPlanId' | 'renderPlanFeatures' | 'badgeLabel'>
}

export function Onboarding({ planCards }: OnboardingProps = {}) {
  const t = useT(); const nav = useNavigate(); const { plans } = usePlans(); const { user } = useAuth(); const apiFields = useSignupFields()
  const fields: OnboardingField[] = site.onboardingFields.length ? site.onboardingFields : apiFields
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [step, setStep] = useState(FIRST)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [urlTouched, setUrlTouched] = useState(false)
  const domain = useSiteDomain() ?? site.siteDomain
  const [v, setV] = useState({ name: '', company: '', instance: '', plan: site.plans[0]?.id ?? '' })
  const set = (k: keyof typeof v) => (val: string) => { setV((p) => ({ ...p, [k]: val })); setErrors((p) => (p[k] ? { ...p, [k]: '' } : p)) }
  // The URL follows the company name until the user edits it themselves.
  const setCompany = (x: string) => { setV((p) => ({ ...p, company: x, instance: urlTouched ? p.instance : slugify(x) })); setErrors((p) => ({ ...p, company: '', ...(urlTouched ? {} : { instance: '' }) })) }
  const setUrl = (x: string) => { setUrlTouched(true); set('instance')(normalizeTyping(x)) }
  const slug = v.instance.replace(/-+$/, '')
  const slugOk = SLUG_RE.test(slug)
  const debounced = useDebounced(slugOk ? slug : '', 400)
  const check = useSlugAvailability(debounced)
  // A failed check must not trap the user: the address is validated again when the site is created.
  const checkFailed = slugOk && debounced === slug && !check.isFetching && !!(check as { isError?: boolean }).isError
  const settled = slugOk && debounced === slug && !check.isFetching && check.data?.slug === slug
  const status: 'idle' | 'invalid' | 'checking' | 'unknown' | 'available' | 'unavailable' =
    !slug ? 'idle' : !slugOk ? 'invalid' : checkFailed ? 'unknown' : !settled ? 'checking' : check.data!.available ? 'available' : 'unavailable'
  const urlError = errors.instance || (status === 'invalid' && urlTouched ? t('onboarding.urlInvalid') : '') || (status === 'unavailable' ? (check.data!.message || t('onboarding.urlUnavailable')) : '')

  const defaultOf = (f: OnboardingField) => {
    const src = f.defaultFrom === 'company' ? v.company : f.defaultFrom === 'instance' ? v.instance : f.defaultFrom === 'name' ? (v.name || user?.name) : f.defaultFrom === 'email' ? user?.email : undefined
    return src?.trim() ? src : (f.default ?? '')
  }
  // A field follows its default source until the user edits it.
  const valueOf = (f: OnboardingField) => extra[f.name] ?? defaultOf(f)
  const fieldOk = (f: OnboardingField) => { const x = valueOf(f).trim(); return x ? (f.type !== 'email' || EMAIL.test(x)) : !f.required }

  function next(e: FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (step === 2) {
      if (!v.company.trim()) errs.company = t('onboarding.companyRequired')
      if (!slug) errs.instance = t('onboarding.urlRequired')
      else if (!slugOk) errs.instance = t('onboarding.urlInvalid')
      else if (status === 'checking') errs.instance = t('onboarding.urlWait')
      else if (status === 'unavailable') errs.instance = check.data!.message || t('onboarding.urlUnavailable')
      for (const f of fields) if (!fieldOk(f)) errs[f.name] = valueOf(f).trim() ? t('onboarding.invalid', { label: f.label.toLowerCase() }) : t('onboarding.fieldRequired', { label: f.label })
    }
    if (step === 3 && !plan) errs.plan = t('onboarding.planRequired')
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    if (step < TOTAL) setStep(step + 1)
    else {
      const rf = Object.fromEntries(fields.map((f) => [f.name, valueOf(f).trim()]).filter(([, x]) => x))
      stashRecipeFields(rf)
      nav(`/checkout?plan=${encodeURIComponent(plan)}&instance=${encodeURIComponent(slug)}`)
    }
  }
  const heading = [t('onboarding.profile'), t('onboarding.company'), t('onboarding.plan')][step - 1]
  const list = plans.length ? plans : site.plans
  // Pre-select the recommended plan (else the first) once plans are known; never keep an id that is not offered.
  const plan = list.length && !list.some((p) => p.id === v.plan) ? (recommendedPlanId(list) ?? list[0].id) : v.plan
  const tax = t('onboarding.planTax')

  return (
    <main>
      <Stack style={{ maxWidth: step === 3 ? '48rem' : '32rem', marginInline: 'auto' }}>
        <h1>{t('onboarding.title')}</h1>
        <Progress value={((step - FIRST + 1) / (TOTAL - FIRST + 1)) * 100}>
          <ProgressLabel>{t('onboarding.step', { n: step - FIRST + 1, total: TOTAL - FIRST + 1 })}</ProgressLabel>
          <ProgressTrack><ProgressIndicator /></ProgressTrack>
        </Progress>
        <Card>
          <form onSubmit={next} noValidate aria-label={t('onboarding.steps')}>
            <CardHeader><h2>{heading}</h2></CardHeader>
            <CardBody>
              <Stack>
        {step === 1 && (<>
          <Field name="name" invalid={!!errors.name}><FieldLabel>{t('onboarding.name')}</FieldLabel>
            <Input value={v.name} onValueChange={(x: string) => set('name')(x)} autoComplete="name" aria-invalid={!!errors.name} required />
            {errors.name && <FieldError match>{errors.name}</FieldError>}</Field>
        </>)}
        {step === 2 && (<>
          <Field name="company" invalid={!!errors.company}><FieldLabel>{t('onboarding.companyName')}</FieldLabel>
            <Input value={v.company} onValueChange={setCompany} autoComplete="organization" aria-invalid={!!errors.company} required />
            {errors.company && <FieldError match>{errors.company}</FieldError>}</Field>
          <Field name="instance" invalid={!!urlError}><FieldLabel>{t('onboarding.urlLabel')}</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 'var(--space-2)' }}>
              <Input value={v.instance} onValueChange={setUrl} onBlur={() => set('instance')(v.instance.replace(/-+$/, ''))} aria-invalid={!!urlError} aria-describedby="instance-status instance-help" aria-label={t('onboarding.urlLabel')}
                autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="your-company" style={{ flex: 1, minWidth: 0 }} required />
              {domain && <span aria-hidden="true" style={{ alignSelf: 'center', color: 'var(--color-text-muted, inherit)', whiteSpace: 'nowrap' }}>.{domain}</span>}
            </div>
            <div id="instance-status" aria-live="polite" style={{ minHeight: '1.5em', fontSize: '0.875em' }}>
              {status === 'checking' && <span>{t('onboarding.urlChecking')}</span>}
              {status === 'unknown' && <span>{t('onboarding.urlCheckFailed')}</span>}
              {status === 'available' && !urlError && <span style={{ color: 'var(--color-success, green)' }}>✓ {t('onboarding.urlAvailable')}</span>}
              {urlError && <FieldError match>{urlError}</FieldError>}
              {status === 'unavailable' && check.data?.suggestion && (
                <> <Button type="button" onClick={() => { setUrlTouched(true); set('instance')(check.data!.suggestion!) }}>{t('onboarding.urlUse', { slug: check.data.suggestion })}</Button></>
              )}
            </div>
            {domain && slugOk && <p style={{ margin: 0, fontSize: '0.875em' }}>{t('onboarding.urlPreview', { url: `https://${slug}.${domain}` })}</p>}
            <FieldDescription id="instance-help">{t('onboarding.urlHelp')}</FieldDescription></Field>
          {fields.some((f) => !f.hidden) && (
            <fieldset aria-label={t('onboarding.details')} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 'var(--space-4)', paddingTop: 'var(--space-5)', marginTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)' }}>
              {fields.filter((f) => !f.hidden).map((f) => (
                <Field key={f.name} name={f.name} invalid={!!errors[f.name]}><FieldLabel>{f.label}</FieldLabel>
                  {f.type === 'select' ? (
                    <Select items={(f.options ?? []).map((o) => ({ value: o.value, label: o.label }))} value={valueOf(f)} onValueChange={(x) => x && setExtra((p) => ({ ...p, [f.name]: String(x) }))}>
                      <SelectTrigger><SelectValue placeholder={t('onboarding.selectPlaceholder')} /></SelectTrigger>
                      <SelectContent>{(f.options ?? []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Input value={valueOf(f)} type={f.type === 'email' ? 'email' : 'text'} maxLength={f.max} required={f.required}
                      autoComplete={f.type === 'email' ? 'email' : 'off'} aria-invalid={!!errors[f.name]} onValueChange={(x: string) => { setExtra((p) => ({ ...p, [f.name]: x })); setErrors((p) => ({ ...p, [f.name]: '' })) }} />
                  )}
                  {errors[f.name] && <FieldError match>{errors[f.name]}</FieldError>}
                  {f.help && <FieldDescription>{f.help}</FieldDescription>}
                </Field>
              ))}
            </fieldset>
          )}
        </>)}
        {step === 3 && (<>
          <p className="muted" style={{ margin: 0 }}>{t('onboarding.planLead')}</p>
          <div style={{ paddingBlock: 'var(--space-3) var(--space-2)' }}>
            <PlanRadioCards plans={list} value={plan} onChange={set('plan')} currency={site.currency} invalid={!!errors.plan} {...planCards}
              labels={{ group: t('onboarding.plan'), recommended: t('onboarding.planRecommended'), perMonth: t('onboarding.planPerMonth'), perYear: t('onboarding.planPerYear') }} />
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{tax}</p>
          <section aria-labelledby="plan-next" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
            <h3 id="plan-next" style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold, 600)' }}>{t('onboarding.planNextTitle')}</h3>
            <ol style={{ margin: 0, paddingInlineStart: '1.25rem', display: 'grid', gap: 'var(--space-1, 4px)', fontSize: 'var(--text-sm)', color: 'var(--color-muted-fg)' }}>
              <li>{t('onboarding.planNext1')}</li><li>{t('onboarding.planNext2')}</li><li>{t('onboarding.planNext3')}</li>
            </ol>
          </section>
        </>)}
                {errors.plan && <Field invalid><FieldError match>{errors.plan}</FieldError></Field>}
              </Stack>
            </CardBody>
            <CardFooter>
              <Row>
                {step > FIRST && <Button type="button" onClick={() => setStep(step - 1)}>{t('onboarding.back')}</Button>}
                <Button type="submit" data-variant="solid">{step < TOTAL ? t('onboarding.next') : t('onboarding.finish')}</Button>
              </Row>
            </CardFooter>
          </form>
        </Card>
      </Stack>
    </main>
  )
}
