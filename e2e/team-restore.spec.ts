import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('team member remove with a second fixture member', async ({ page }) => {
  await login(page)
  await page.locator('a[href="/console/team"]').first().click()
  await expect(page.getByText('second@example.com')).toBeVisible()
  await page.getByTestId('remove-member').click()
  await page.getByTestId('confirm-ok').click()
  await expect(page.getByText('second@example.com')).toHaveCount(0)
  await expect(page.getByText('demo@example.com')).toBeVisible()
})

test('restore backup shows pending approval', async ({ page }) => {
  await login(page)
  await page.locator('a[href="/console/backups"]').first().click()
  await page.getByTestId('restore-backup').first().click()
  await page.getByTestId('confirm-ok').click()
  await expect(page.getByTestId('restore-pending')).toBeVisible()
})

test('sidebar aria-current follows the route', async ({ page }) => {
  await login(page)
  const nav = page.getByRole('navigation', { name: 'Main menu' })
  for (const [href, label] of [['/console/billing', 'Billing'], ['/console/team', 'Team']]) {
    await nav.locator(`a[href="${href}"]`).click()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
    await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1)
    await expect(nav.locator('a[aria-current="page"]')).toHaveText(label)
  }
})
