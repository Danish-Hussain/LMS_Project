#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const validatorPath = path.join(__dirname, '..', '.next', 'types', 'validator.ts')
if (!fs.existsSync(validatorPath)) {
  console.error('validator.ts not found at', validatorPath)
  process.exit(1)
}

const content = fs.readFileSync(validatorPath, 'utf8')
const importRegex = /typeof import\(("|')(.+?)\1\)/g
const matches = new Set()
let m
while ((m = importRegex.exec(content))) {
  matches.add(m[2])
}

const repoRoot = path.join(__dirname, '..')
for (const imp of matches) {
  // Only handle imports that point into ../../src or ../../pages
  if (!imp.includes('../../src') && !imp.includes('../../pages')) continue

  // Normalize to a filesystem path relative to repo root
  // Example imp: "../../src/app/account/change-password/page.js"
  const rel = imp.replace(/^(\.\.\/)+/, '')
  const fsPath = path.join(repoRoot, rel)

  // If import ends with .js, create a .d.ts next to the original TSX/TS file under src
  if (fsPath.endsWith('.js')) {
    const targetDts = fsPath + '.d.ts'
    // Ensure directory exists
    const dir = path.dirname(targetDts)
    fs.mkdirSync(dir, { recursive: true })

    // Determine content based on file type
    let stub = ''
    if (fsPath.endsWith('/route.js')) {
      stub = `// Auto-generated stub for ${imp}\nexport const GET: any\nexport const POST: any\nexport const PUT: any\nexport const PATCH: any\nexport const DELETE: any\nexport const HEAD: any\nexport const OPTIONS: any\nexport default undefined as any\n`
    } else if (fsPath.endsWith('/page.js')) {
      stub = `// Auto-generated stub for ${imp}\nconst _default: any\nexport default _default\n`
    } else {
      stub = `// Auto-generated stub for ${imp}\nconst _default: any\nexport default _default\n`
    }

    // Write file only if missing or different
    let write = true
    if (fs.existsSync(targetDts)) {
      const existing = fs.readFileSync(targetDts, 'utf8')
      if (existing === stub) write = false
    }
    if (write) {
      fs.writeFileSync(targetDts, stub, 'utf8')
      console.log('Wrote', targetDts)
    }
  }
}

console.log('Done generating .js.d.ts stubs')
