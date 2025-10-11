import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

test.use({ storageState: 'tests/e2e/storageState.json' })

test('session page shows seeded content and edit links work', async ({ page }) => {
  // seeded IDs from prisma/seed.ts
  const batchId = 'sample-batch'

  // navigate to sessions page with storageState (authenticated)
  await page.goto(`${BASE}/batches/${batchId}/sessions`)
  await expect(page).toHaveURL(new RegExp(`/batches/${batchId}/sessions`))

  // expect seeded session titles to appear
  await expect(page.locator('text=Getting Started')).toHaveCount(1)
  await expect(page.locator('text=Basic Concepts')).toHaveCount(1)

  // click edit on first session and ensure it navigates to edit page
  const editLinks = page.locator('a[href*="/sessions/"][href$="/edit"]')
  if (await editLinks.count() > 0) {
    await editLinks.first().click()
    await expect(page).toHaveURL(/\/batches\/.+\/sessions\/.+\/edit$/)
  }
})
