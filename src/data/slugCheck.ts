import { useEffect, useState } from 'react'
import type { SlugCheck } from './types'

/** Async availability check supplied by the host app, e.g. a call to its own API. Reject to signal "could not check". */
export type CheckSlug = (slug: string, signal: AbortSignal) => Promise<SlugCheck>

type Result = { data?: SlugCheck; isFetching: boolean; isError: boolean }

/**
 * Runs a host-supplied `checkSlug` for a non-empty slug. Stale responses are dropped and in-flight
 * calls are aborted when the slug changes. With no `checkSlug` or an empty slug it does nothing.
 */
export function useCustomSlugCheck(slug: string, checkSlug?: CheckSlug): Result {
  const [state, setState] = useState<{ slug: string; data?: SlugCheck; error?: boolean }>({ slug: '' })
  useEffect(() => {
    if (!slug || !checkSlug) return
    const ctl = new AbortController()
    checkSlug(slug, ctl.signal).then(
      (data) => { if (!ctl.signal.aborted) setState({ slug, data }) },
      () => { if (!ctl.signal.aborted) setState({ slug, error: true }) },
    )
    return () => ctl.abort()
  }, [slug, checkSlug])
  const settled = !!slug && state.slug === slug
  return {
    data: settled ? state.data : undefined,
    isFetching: !!slug && !!checkSlug && !settled,
    isError: settled && !!state.error,
  }
}
