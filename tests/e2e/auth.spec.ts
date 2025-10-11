import { test } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001'

test('save auth storage state', async ({ page, request }) => {
  // programmatic login using seeded instructor
  const res = await request.post(`${BASE}/api/auth/login`, { data: { email: 'instructor@example.com', password: 'instructor123' } })
  if (!res.ok()) throw new Error('Login failed during auth setup')

  const sc = res.headers()['set-cookie'] || ''
  const match = sc.match(/auth-token=([^;]+);/) || sc.match(/auth-token=([^;]+)/)
  if (!match) throw new Error('Auth cookie not found')
  const cookieVal = match[1]

  const { hostname } = new URL(BASE)
  await page.context().addCookies([{ name: 'auth-token', value: cookieVal, domain: hostname, path: '/', httpOnly: true, sameSite: 'Lax' }])
  await page.context().storageState({ path: 'tests/e2e/storageState.json' })
})
