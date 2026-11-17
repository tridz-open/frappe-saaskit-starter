import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('verify-email confirms via token', async ({ page }) => {
  await page.goto('/verify-email?token=abc')
  await expect(page.getByText('Your email is verified.')).toBeVisible()
  await expect(page.getByRole('link', { name: /continue setup/i })).toBeVisible()
})

test('verify-email confirms via ?key= from the email link', async ({ page }) => {
  await page.goto('/verify-email?key=abc')
  await expect(page.getByText('Your email is verified.')).toBeVisible()
})

test('verify-email without token shows check-inbox state with resend', async ({ page }) => {
  await login(page)
  await page.goto('/verify-email')
  await expect(page.getByText(/check your inbox/i)).toBeVisible()
  await page.getByTestId('resend-verification').click()
  await expect(page.getByTestId('resent')).toBeVisible()
})

test('accept-invite without token explains the link is incomplete', async ({ page }) => {
  await page.goto('/accept-invite')
  await expect(page.getByText(/incomplete/i)).toBeVisible()
})

test('accept-invite logged out asks to log in', async ({ page }) => {
  await page.goto('/accept-invite?token=t1')
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible()
})
