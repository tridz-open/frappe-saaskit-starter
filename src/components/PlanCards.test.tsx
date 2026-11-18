import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PlanRadioCards } from './PlanCards'
import type { Plan } from '../data/types'

const plans: Plan[] = [
  { id: 'a', name: 'A', price: 10, interval: 'month', features: ['one'] },
  { id: 'b', name: 'B', price: 20, interval: 'month', features: ['two'], recommended: true },
  { id: 'c', name: 'C', price: 30, interval: 'month', features: ['three'] },
]
const base = { plans, value: 'a', onChange: () => {}, currency: 'USD', labels: { group: 'Plans', recommended: 'Recommended', perMonth: '/mo', perYear: '/yr' } }
const badges = () => document.querySelectorAll('[data-part="badge"]')

afterEach(cleanup)

describe('PlanRadioCards', () => {
  it('defaults to the recommended plan, the built-in label and the feature list', () => {
    render(<PlanRadioCards {...base} />)
    expect(badges()).toHaveLength(1)
    expect(screen.getByRole('radio', { name: 'B' }).querySelector('[data-part="badge"]')?.textContent).toBe('Recommended')
    expect(screen.getByText('one')).toBeTruthy()
  })
  it('highlightPlanId moves the badge; null removes it', () => {
    const { rerender } = render(<PlanRadioCards {...base} highlightPlanId="c" />)
    expect(screen.getByRole('radio', { name: 'C' }).querySelector('[data-part="badge"]')).not.toBeNull()
    expect(screen.getByRole('radio', { name: 'B' }).querySelector('[data-part="badge"]')).toBeNull()
    rerender(<PlanRadioCards {...base} highlightPlanId={null} />)
    expect(badges()).toHaveLength(0)
  })
  it('badgeLabel accepts a string or a function', () => {
    const { rerender } = render(<PlanRadioCards {...base} badgeLabel="Best value" />)
    expect(badges()[0].textContent).toBe('Best value')
    rerender(<PlanRadioCards {...base} badgeLabel={(p) => `Pick ${p.name}`} />)
    expect(badges()[0].textContent).toBe('Pick B')
  })
  it('renderPlanFeatures replaces the feature list', () => {
    render(<PlanRadioCards {...base} renderPlanFeatures={(p) => <p>custom {p.id}</p>} />)
    expect(screen.getByText('custom a')).toBeTruthy()
    expect(screen.queryByText('one')).toBeNull()
  })
})
