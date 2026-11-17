import { expect, type Page } from '@playwright/test'

export async function login(page: Page, email = 'demo@example.com') {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('secret123')
  await page.locator('form').getByRole('button', { name: /log in|sign in/i }).click()
  await expect(page).toHaveURL(/\/console$/)
}
