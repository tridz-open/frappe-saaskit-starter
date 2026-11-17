import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('create, duplicate, delete a workspace', async ({ page }) => {
  await login(page)
  await page.getByTestId('open-primary').waitFor()
  await page.getByTestId('create-instance').click()
  await page.getByTestId('instance-name').fill('acme-one')
  await expect(page.getByText('Available')).toBeVisible()
  await page.getByTestId('create-submit').click()
  await expect(page.getByTestId('view-instance')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('link', { name: 'Go to dashboard' }).click()
  const rowOf = (n: string) => page.locator(`[data-testid="instance-row"][data-instance-name="${n}"]`)
  await expect(rowOf('acme-one')).toHaveCount(1)

  // duplicate: explained and confirmed, from the detail page
  await rowOf('acme-one').getByRole('link', { name: 'acme-one', exact: true }).click()
  await page.getByTestId('duplicate-instance').click()
  await expect(page.getByText(/separate workspace/i)).toBeVisible()
  await page.getByTestId('confirm-ok').click()
  await expect(rowOf('acme-one-copy')).toHaveCount(1)

  // delete: lives in the danger zone, type-to-confirm
  await rowOf('acme-one').getByRole('link', { name: 'acme-one', exact: true }).click()
  await page.getByTestId('delete-instance').click()
  const confirm = page.getByTestId('delete-confirm')
  await expect(confirm).toBeDisabled()
  await page.getByTestId('delete-confirm-input').fill('wrong-name')
  await expect(confirm).toBeDisabled()
  await page.getByTestId('delete-confirm-input').fill('acme-one')
  await expect(confirm).toBeEnabled()
  await confirm.click()
  await expect(page.getByText(/Deletion requested/i).first()).toBeVisible()
})
