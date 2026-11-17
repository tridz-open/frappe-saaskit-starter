import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('login lands on console', async ({ page }) => {
  await login(page)
  await expect(page.getByTestId('instance-row').first()).toBeVisible()
})

test('unauthenticated console redirects to login', async ({ page }) => {
  await page.goto('/console')
  await expect(page).toHaveURL(/\/login/)
})

test('logout via account menu returns to login', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: /account menu/i }).click()
  await page.getByRole('menuitem', { name: /log ?out|sign out/i }).click()
  await expect(page).toHaveURL(/\/login/, { timeout: 3000 })
})
