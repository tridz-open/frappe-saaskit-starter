import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('invite revoke asks for confirmation', async ({ page }) => {
  await login(page)
  await page.locator('a[href="/console/team"]').first().click()
  await page.locator('input[name="email"]').fill('new@example.com')
  await page.locator('form').filter({ has: page.locator('input[name="email"]') }).getByRole('button').last().click()
  const btns = page.getByTestId('revoke-invite')
  await expect(btns).toHaveCount(1)
  await btns.first().click()
  await page.getByTestId('confirm-cancel').click()
  await expect(btns).toHaveCount(1)
  await btns.first().click()
  await page.getByTestId('confirm-ok').click()
  await expect(btns).toHaveCount(0)
})

test('ticket close asks for confirmation', async ({ page }) => {
  await login(page)
  await page.getByRole('link', { name: /support/i }).first().click()
  await page.locator('a[href^="/console/support/"]').first().click()
  await expect(page.getByTestId('close-ticket')).toBeVisible()
  await page.getByTestId('close-ticket').click()
  await page.getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('close-ticket')).toBeVisible()
  await page.getByTestId('close-ticket').click()
  await page.getByTestId('confirm-ok').click()
  await expect(page.getByTestId('close-ticket')).toHaveCount(0)
})
