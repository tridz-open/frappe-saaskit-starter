import { expect, test } from '@playwright/test'
import { login } from './helpers'

const shot = async (p: import('@playwright/test').Page, n: string) => { if (process.env.SHOTS) await p.screenshot({ path: `e2e/screenshots/${n}.png`, fullPage: true }) }

test('console layout is structural', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await login(page)
  const nav = page.locator('[data-slot="sidebar"]')
  await expect(nav).toBeVisible()
  const nb = await nav.boundingBox(); const mb = await page.locator('main').boundingBox()
  expect(nb!.x + nb!.width).toBeLessThanOrEqual(mb!.x + 1)
  await shot(page, 'console-after')
  await page.getByTestId('instance-row').first().getByRole('link').first().click()
  await shot(page, 'instance-detail-after')
  await page.getByRole('link', { name: /^billing$/i }).first().click()
  await shot(page, 'billing-after')
  await page.setViewportSize({ width: 390, height: 800 })
  await expect(nav).toBeHidden()
  await page.locator('[data-slot="sidebar-toggle"]').click()
  await expect(nav).toBeVisible()
  await shot(page, 'console-mobile-after')
})
