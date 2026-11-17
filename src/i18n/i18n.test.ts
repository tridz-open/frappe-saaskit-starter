import { afterEach, describe, expect, it } from 'vitest'
import { t } from './index'
import { site } from '../config/site'

afterEach(() => { site.copy = {} })

describe('t()', () => {
  it('interpolates variables', () => {
    expect(t('legal.terms.body', { email: 'a@b.co' })).toContain('a@b.co')
  })
  it('lets site.copy override a key', () => {
    site.copy = { 'legal.terms.title': 'Custom terms' }
    expect(t('legal.terms.title')).toBe('Custom terms')
  })
  it('falls back to the key when unknown', () => {
    expect(t('nope.missing')).toBe('nope.missing')
  })
  it('ships no gateway-specific default copy', () => {
    expect(t('checkout.next.1').toLowerCase()).not.toContain('razorpay')
  })
})
