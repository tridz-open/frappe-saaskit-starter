// Pure mappers for the live adapter, kept free of SDK imports so they are unit-testable.
import type * as T from './types'

/** The `Me` fields the starter reads. `email_verified` is not in the vendored SDK 0.1.0-alpha.1 types yet. */
export type MeLike = { user: string; email: string; full_name?: string; roles?: string[]; email_verified?: boolean }

/**
 * Maps the SDK `Me` to the starter user. `email_verified` is read defensively: saas_core always sends it
 * (api/v1/auth.py), so a missing value means an older server and counts as unverified, never verified.
 * TODO(sdk 0.1.0-alpha.2): drop the MeLike cast and read the typed `Me.email_verified` after the re-vendor.
 */
export function toUser(me: MeLike): T.User {
  return { id: me.user, email: me.email, name: me.full_name ?? me.email, emailVerified: me.email_verified ?? false, onboarded: true, roles: me.roles }
}

/** What the live API can really serve. Anything false is hidden in the UI rather than faked. */
export const LIVE_CAPABILITIES: T.Capabilities = {
  sessions: false, notifications: false, backupDownload: false, cancelDeletion: false,
  // backupDownload is false: the fcctl download link returned 500 live (no offsite config).
  apiTokens: true, // useApiTokens is implemented against saas_core api/v1/api_tokens
  emailVerification: true, // Me.email_verified + request/confirm email verification
}
