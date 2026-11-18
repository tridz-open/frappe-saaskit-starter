import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { betaAccessApi, BetaApiError, resetCsrf } from './betaAccessApi'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => { resetCsrf(); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
afterEach(() => vi.unstubAllGlobals())

describe('betaAccessApi', () => {
  it('lists without CSRF and maps snake_case rows', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { message: { signup_mode: 'allowlist', patterns: [{ pattern: 'a@x.test', kind: 'email', note: null, invited_at: null, account_exists: true, verified: false, has_tenant: false }] } }))
    const r = await betaAccessApi.list()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/method/saas_core.api.v1.admin.beta_access.list')
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe('GET')
    expect(r.signupMode).toBe('allowlist')
    expect(r.entries[0]).toMatchObject({ pattern: 'a@x.test', accountExists: true, verified: false })
  })
  it('POSTs with a CSRF token fetched from /me', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { message: { csrf_token: 'tok' } }))
    fetchMock.mockResolvedValueOnce(json(200, { message: { added: ['a@x.test'], already_listed: [], invites_sent: [], invites_failed: [], skipped_domains: [] } }))
    const r = await betaAccessApi.add(['a@x.test'], true, 'n')
    expect(r.added).toEqual(['a@x.test'])
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(url).toContain('admin.beta_access.add')
    expect((init.headers as Record<string, string>)['X-Frappe-CSRF-Token']).toBe('tok')
    expect(JSON.parse(init.body as string)).toEqual({ entries: ['a@x.test'], send_invite: true, note: 'n' })
  })
  it('throws BetaApiError with the status on 403', async () => {
    fetchMock.mockResolvedValueOnce(json(403, { error: { code: 'forbidden', message: 'no' } }))
    await expect(betaAccessApi.list()).rejects.toMatchObject({ status: 403, code: 'forbidden' })
    fetchMock.mockRejectedValueOnce(new TypeError('x'))
    await expect(betaAccessApi.list()).rejects.toBeInstanceOf(BetaApiError)
  })
  it('retries a POST once after a stale-CSRF 403', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { message: { csrf_token: 'old' } }))
    fetchMock.mockResolvedValueOnce(json(403, {}))
    fetchMock.mockResolvedValueOnce(json(200, { message: { csrf_token: 'new' } }))
    fetchMock.mockResolvedValueOnce(json(200, { message: { removed: 'a@x.test' } }))
    await expect(betaAccessApi.remove('a@x.test')).resolves.toEqual({ removed: 'a@x.test' })
    expect((fetchMock.mock.calls[3][1] as RequestInit).headers).toMatchObject({ 'X-Frappe-CSRF-Token': 'new' })
  })
})
