import { useRef, type KeyboardEvent } from 'react'
import type { Plan } from '../data/types'

/** Price in the plan's own (charged) currency, e.g. ₹5,200. Whole amounts drop the decimals. */
export function planMoney(p: Pick<Plan, 'price' | 'currency'>, fallbackCurrency: string, locale?: string) {
  const currency = (p.currency || fallbackCurrency).toUpperCase()
  const loc = locale && locale !== 'en' ? locale : currency === 'INR' ? 'en-IN' : 'en'
  const whole = Number.isInteger(p.price)
  return new Intl.NumberFormat(loc, { style: 'currency', currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(p.price)
}

/** The plan to nudge toward: the one the plan data marks recommended, else the middle of three or more, else none. */
export function recommendedPlanId(plans: Plan[]): string | undefined {
  return plans.find((p) => p.recommended)?.id ?? (plans.length > 2 ? plans[Math.floor(plans.length / 2)]?.id : undefined)
}

export const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ flex: 'none', marginTop: '0.2em', color: 'var(--color-primary)' }}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)

const CSS = `
[data-slot="plan-cards"]{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:var(--space-4);align-items:stretch}
[data-slot="plan-card"]{position:relative;display:flex;flex-direction:column;gap:var(--space-3);padding:var(--space-5);border:1px solid var(--color-border);border-radius:calc(var(--radius-lg) + 4px);background:var(--color-bg);cursor:pointer;text-align:start;transition:border-color .15s,box-shadow .15s,transform .15s;outline:none}
[data-slot="plan-card"]:hover{border-color:color-mix(in oklab,var(--color-primary) 45%,var(--color-border))}
[data-slot="plan-card"][data-recommended]{border-color:color-mix(in oklab,var(--color-primary) 55%,var(--color-border));box-shadow:0 8px 24px -12px color-mix(in oklab,var(--color-primary) 45%,transparent)}
[data-slot="plan-card"][aria-checked="true"]{border-color:var(--color-primary);box-shadow:0 0 0 1px var(--color-primary),0 8px 24px -12px color-mix(in oklab,var(--color-primary) 45%,transparent);background:color-mix(in oklab,var(--color-primary) 3%,var(--color-bg))}
[data-slot="plan-card"]:focus-visible{box-shadow:0 0 0 2px var(--color-bg),0 0 0 4px var(--color-primary)}
[data-slot="plan-card"] [data-part="head"]{display:flex;align-items:center;justify-content:space-between;gap:var(--space-2)}
[data-slot="plan-card"] [data-part="name"]{font-weight:var(--weight-semibold,600);font-size:var(--text-lg,1.125rem)}
[data-slot="plan-card"] [data-part="dot"]{flex:none;width:18px;height:18px;border-radius:999px;border:1.5px solid var(--color-border);display:grid;place-items:center;background:var(--color-bg)}
[data-slot="plan-card"][aria-checked="true"] [data-part="dot"]{border-color:var(--color-primary);background:var(--color-primary)}
[data-slot="plan-card"][aria-checked="true"] [data-part="dot"]::after{content:"";width:6px;height:6px;border-radius:999px;background:var(--color-primary-fg,#fff)}
[data-slot="plan-card"] [data-part="badge"]{position:absolute;top:-0.7rem;left:var(--space-5);font-size:var(--text-xs,0.75rem);font-weight:var(--weight-medium,500);line-height:1;padding:0.35rem 0.6rem;border-radius:999px;background:var(--color-primary);color:var(--color-primary-fg,#fff)}
[data-slot="plan-card"] [data-part="who"]{margin:0;font-size:var(--text-sm);color:var(--color-muted-fg)}
[data-slot="plan-card"] [data-part="price"]{margin:0;display:flex;align-items:baseline;gap:var(--space-1,4px)}
[data-slot="plan-card"] [data-part="amount"]{font-size:1.75rem;font-weight:var(--weight-semibold,600);letter-spacing:-0.02em;font-variant-numeric:tabular-nums}
[data-slot="plan-card"] [data-part="per"]{font-size:var(--text-sm);color:var(--color-muted-fg)}
[data-slot="plan-card"] ul{list-style:none;padding:var(--space-3) 0 0;margin:0;border-top:1px solid var(--color-border);display:flex;flex-direction:column;gap:var(--space-2);font-size:var(--text-sm)}
[data-slot="plan-card"] li{display:flex;gap:var(--space-2);margin:0}
@media (prefers-reduced-motion:no-preference){[data-slot="plan-card"][data-recommended]{transform:translateY(-2px)}}
`

type Props = {
  plans: Plan[]
  value: string
  onChange: (id: string) => void
  currency: string
  locale?: string
  labels: { group: string; recommended: string; perMonth: string; perYear: string }
  invalid?: boolean
}

/** Accessible radio-card group (WAI-ARIA radio group: roving tabindex, arrow keys, Space to select). */
export function PlanRadioCards({ plans, value, onChange, currency, locale, labels, invalid }: Props) {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const rec = recommendedPlanId(plans)
  const selected = plans.findIndex((p) => p.id === value)
  const tabbable = selected >= 0 ? selected : 0
  const move = (i: number) => { const n = (i + plans.length) % plans.length; onChange(plans[n].id); refs.current[n]?.focus() }
  const onKey = (i: number) => (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(i + 1) }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(i - 1) }
    else if (e.key === ' ') { e.preventDefault(); onChange(plans[i].id) }
  }
  return (
    <>
      <style>{CSS}</style>
      <div role="radiogroup" aria-label={labels.group} aria-invalid={invalid || undefined} data-slot="plan-cards">
        {plans.map((p, i) => {
          const checked = p.id === value
          const isRec = p.id === rec
          const nameId = `plan-${p.id}-name`
          return (
            <div key={p.id} ref={(el) => { refs.current[i] = el }} role="radio" aria-checked={checked} aria-labelledby={nameId}
              aria-describedby={`plan-${p.id}-desc`} tabIndex={i === tabbable ? 0 : -1} data-slot="plan-card" data-recommended={isRec ? '' : undefined}
              onClick={() => onChange(p.id)} onKeyDown={onKey(i)}>
              {isRec && <span data-part="badge">{labels.recommended}</span>}
              <div data-part="head"><span id={nameId} data-part="name">{p.name}</span><span data-part="dot" aria-hidden="true" /></div>
              <div id={`plan-${p.id}-desc`} style={{ display: 'contents' }}>
                {p.description && <p data-part="who">{p.description}</p>}
                <p data-part="price"><span data-part="amount">{planMoney(p, currency, locale)}</span><span data-part="per">{p.interval === 'year' ? labels.perYear : labels.perMonth}</span></p>
                {p.features.length > 0 && <ul>{p.features.map((f) => <li key={f}><Check />{f}</li>)}</ul>}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
