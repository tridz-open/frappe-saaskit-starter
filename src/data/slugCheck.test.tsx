import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCustomSlugCheck } from './slugCheck'
import type { SlugCheck } from './types'

const ok = (slug: string): SlugCheck => ({ slug, available: true, reason: null, message: '', suggestion: null })

describe('useCustomSlugCheck', () => {
  it('does nothing without a slug or checker', () => {
    const fn = vi.fn()
    expect(renderHook(() => useCustomSlugCheck('', fn)).result.current).toEqual({ data: undefined, isFetching: false, isError: false })
    expect(renderHook(() => useCustomSlugCheck('abc')).result.current.isFetching).toBe(false)
    expect(fn).not.toHaveBeenCalled()
  })
  it('reports fetching, then the result', async () => {
    const fn = vi.fn(async (s: string) => ok(s))
    const { result } = renderHook(() => useCustomSlugCheck('acme', fn))
    expect(result.current.isFetching).toBe(true)
    await waitFor(() => expect(result.current.data?.slug).toBe('acme'))
    expect(result.current.isFetching).toBe(false)
  })
  it('passes reserved/taken results through untouched', async () => {
    const r: SlugCheck = { slug: 'admin', available: false, reason: 'reserved', message: 'Reserved', suggestion: 'admin-2' }
    const { result } = renderHook(() => useCustomSlugCheck('admin', async () => r))
    await waitFor(() => expect(result.current.data).toEqual(r))
  })
  it('flags a rejected check as an error without data', async () => {
    const { result } = renderHook(() => useCustomSlugCheck('acme', () => Promise.reject(new Error('x'))))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
  it('aborts and ignores a stale response when the slug changes', async () => {
    let resolveFirst!: (v: SlugCheck) => void
    const signals: AbortSignal[] = []
    const fn = (s: string, signal: AbortSignal) => { signals.push(signal); return s === 'one' ? new Promise<SlugCheck>((r) => { resolveFirst = r }) : Promise.resolve(ok(s)) }
    let slug = 'one'
    const { result, rerender } = renderHook(() => useCustomSlugCheck(slug, fn))
    slug = 'two'
    rerender()
    expect(signals[0].aborted).toBe(true)
    await waitFor(() => expect(result.current.data?.slug).toBe('two'))
    resolveFirst(ok('one')); await new Promise((r) => setTimeout(r, 20))
    expect(result.current.data?.slug).toBe('two')
  })
})
