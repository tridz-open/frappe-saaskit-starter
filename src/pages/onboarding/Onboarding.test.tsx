import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Onboarding } from './Onboarding'
import type { SlugCheck } from '../../data/types'

afterEach(cleanup)
const mount = (p: Parameters<typeof Onboarding>[0]) => render(<MemoryRouter><Onboarding {...p} /></MemoryRouter>)

describe('Onboarding checkSlug', () => {
  it('uses the supplied checker instead of the adapter and shows its message', async () => {
    const r: SlugCheck = { slug: 'admin', available: false, reason: 'reserved', message: 'That name is reserved.', suggestion: null }
    const checkSlug = vi.fn(async (_s: string, _signal: AbortSignal) => r)
    mount({ checkSlug })
    fireEvent.input(screen.getByLabelText('Company name', { exact: false }), { target: { value: 'admin' } })
    await waitFor(() => expect(checkSlug).toHaveBeenCalled(), { timeout: 2000 })
    expect(checkSlug.mock.calls[0][0]).toBe('admin')
    await waitFor(() => expect(screen.getByText('That name is reserved.')).toBeTruthy())
  })
  it('keeps the adapter check (fixture "taken") when no checker is given', async () => {
    mount({})
    fireEvent.input(screen.getByLabelText('Company name', { exact: false }), { target: { value: 'taken' } })
    await waitFor(() => expect(screen.getByText('That address is taken.')).toBeTruthy(), { timeout: 2000 })
  })
})
