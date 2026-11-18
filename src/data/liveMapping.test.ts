import { describe, expect, it } from 'vitest'
import { LIVE_CAPABILITIES, toUser } from './liveMapping'

const me = { user: 'u@x.test', email: 'u@x.test', full_name: 'U', roles: ['Customer'] }

describe('toUser', () => {
  it('takes emailVerified from Me.email_verified', () => {
    expect(toUser({ ...me, email_verified: false }).emailVerified).toBe(false)
    expect(toUser({ ...me, email_verified: true }).emailVerified).toBe(true)
  })
  it('defaults to unverified when the field is absent', () => {
    expect(toUser(me).emailVerified).toBe(false)
  })
  it('maps the rest of the profile', () => {
    expect(toUser({ user: 'a', email: 'a@x.test' })).toMatchObject({ id: 'a', name: 'a@x.test', onboarded: true })
    expect(toUser(me)).toMatchObject({ id: 'u@x.test', name: 'U', roles: ['Customer'] })
  })
})

describe('live capabilities', () => {
  it('enables email verification and api tokens, keeps unbacked features off', () => {
    expect(LIVE_CAPABILITIES.emailVerification).toBe(true)
    expect(LIVE_CAPABILITIES.apiTokens).toBe(true)
    expect(LIVE_CAPABILITIES.sessions).toBe(false)
    expect(LIVE_CAPABILITIES.notifications).toBe(false)
  })
})
