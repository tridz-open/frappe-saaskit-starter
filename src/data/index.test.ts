import { describe, expect, it } from 'vitest'
import { setDataAdapter, invoicePdfUrl } from './index'
import { invoicePdfUrl as fixturePdf } from './fixtureHooks'

describe('data adapter', () => {
  it('serves the bundled sample PDF in fixture mode', () => {
    expect(invoicePdfUrl('inv1')).toBe('/sample-invoice.pdf')
    expect(fixturePdf('x')).toBe('/sample-invoice.pdf')
  })
  it('merges overrides over the current adapter and ignores undefined values', () => {
    setDataAdapter({ invoicePdfUrl: (id: string) => `/custom/${id}`, useAuth: undefined })
    expect(invoicePdfUrl('9')).toBe('/custom/9')
  })
})
