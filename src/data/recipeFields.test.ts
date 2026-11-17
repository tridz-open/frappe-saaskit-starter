import { describe, expect, it } from 'vitest'
import { fieldsFromSchema, stashRecipeFields, takeRecipeFields } from './recipeFields'

describe('recipeFields', () => {
  it('maps a signup schema to onboarding fields and drops invalid entries', () => {
    const out = fieldsFromSchema({ fields: [{ name: 'a', label: 'A' }, { name: 1 }, null] })
    expect(out).toEqual([{ name: 'a', label: 'A' }])
  })
  it('returns [] for a missing schema', () => {
    expect(fieldsFromSchema(undefined)).toEqual([])
    expect(fieldsFromSchema({})).toEqual([])
  })
  it('round-trips stashed values through sessionStorage', () => {
    stashRecipeFields({ company: 'Acme' })
    expect(takeRecipeFields()).toEqual({ company: 'Acme' })
  })
  it('returns undefined when nothing is stashed', () => {
    sessionStorage.clear()
    expect(takeRecipeFields()).toBeUndefined()
  })
})
