/** Workspace address helpers. Final form: 3-32 chars, a-z 0-9 and dashes, starts with a letter, no trailing dash. */
export const SLUG_RE = /^[a-z][a-z0-9-]{2,30}[a-z0-9]$/

/** Full slugify, used to suggest an address from a company name. */
export function slugify(input: string): string {
  return input.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^[^a-z]+/, '').slice(0, 32).replace(/-+$/, '')
}

/** Light normalisation while the user types: keeps a trailing dash so "spice-" can become "spice-route". */
export function normalizeTyping(input: string): string {
  return input.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').replace(/^[^a-z]+/, '').slice(0, 32)
}
