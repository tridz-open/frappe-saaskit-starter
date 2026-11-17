import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('invoice list and pdf link', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: /account menu/i }).click()
  await page.getByRole('menuitem', { name: /billing/i }).click()
  await page.getByRole('tab', { name: /invoices/i }).click()
  await expect(page.getByTestId('invoice-row-inv1')).toBeVisible()
  await expect(page.getByTestId('invoice-pdf-inv1')).toHaveAttribute('href', '/sample-invoice.pdf')
  await page.getByTestId('invoice-row-inv1').getByRole('link', { name: /view/i }).click()
  await expect(page.getByTestId('invoice-line')).toHaveCount(1)
  await expect(page.getByTestId('invoice-pdf-link')).toHaveAttribute('href', '/sample-invoice.pdf')
})
