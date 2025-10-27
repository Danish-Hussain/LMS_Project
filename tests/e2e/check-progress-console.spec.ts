import { test } from '@playwright/test'

test('capture console for /progress', async ({ page }) => {
  const logs: string[] = []
  page.on('console', (msg) => {
    const text = `${msg.type()}: ${msg.text()}`
    logs.push(text)
    console.log(text)
  })

  await page.goto('http://127.0.0.1:3003/progress', { waitUntil: 'networkidle' })
  // wait a bit for client scripts to run
  await page.waitForTimeout(1500)

  // fail if the React key warning is present
  const warning = logs.find(l => l.includes('Each child in a list should have a unique'))
  if (warning) {
    console.log('FOUND_WARNING:', warning)
    throw new Error('React key warning detected: ' + warning)
  }

  console.log('No React key warning detected in console')
})