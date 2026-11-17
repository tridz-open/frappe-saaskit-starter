# E2E (Playwright, fixtures adapter)

Run: `npm run e2e` (starts `npm run dev` on :5173 in fixture mode, or reuses a server already on that port).
First time: `npx playwright install chromium`.

Fixture data lives in memory; a full page reload resets it, so tests navigate in-app after login.
`layout-shots.spec.ts` writes screenshots to `e2e/screenshots/` (only with `SHOTS=1`).
