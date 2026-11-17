import type { OnboardingField } from './types'

const KEY = 'saas.recipeFields'
/** Handoff from onboarding to checkout. Kept out of the URL so emails do not land in history or logs. */
export function stashRecipeFields(v: Record<string, string>) {
  try { sessionStorage.setItem(KEY, JSON.stringify(v)) } catch { /* storage unavailable */ }
}
export function takeRecipeFields(): Record<string, string> | undefined {
  try { const r = sessionStorage.getItem(KEY); const o = r ? JSON.parse(r) : null; return o && typeof o === 'object' && Object.keys(o).length ? o : undefined } catch { return undefined }
}
/** Maps a recipe signup_schema (`{fields:[...]}`) to onboarding fields. */
export function fieldsFromSchema(schema: unknown): OnboardingField[] {
  const f = (schema as { fields?: unknown[] } | null | undefined)?.fields
  if (!Array.isArray(f)) return []
  return f.filter((x): x is OnboardingField => !!x && typeof (x as OnboardingField).name === 'string' && typeof (x as OnboardingField).label === 'string')
}
