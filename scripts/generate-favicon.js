#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const outPath = path.join(process.cwd(), 'public', 'favicon.ico')

// We'll look for specific PNG files named by size: icon-16x16.png, icon-32x32.png, icon-48x48.png
const sizes = [16, 32, 48]
const pngFiles = sizes.map(s => path.join(process.cwd(), 'public', 'icons', `icon-${s}x${s}.png`))

// Validate files exist and read them
const images = pngFiles.map(p => {
  if (!fs.existsSync(p)) {
    console.error('Expected PNG for ICO entry not found:', p)
    process.exit(2)
  }
  const b = fs.readFileSync(p)
  return { path: p, buf: b, len: b.length }
})

const count = images.length

// ICO header: reserved (2 bytes), type (2 bytes: 1=icon), count (2 bytes)
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(count, 4)

// Directory entries (16 bytes each)
const dirs = []
let offset = 6 + 16 * count // header + all dir entries

for (let i = 0; i < count; i++) {
  const s = sizes[i]
  const img = images[i]
  const dir = Buffer.alloc(16)
  // width & height: 1 byte each (0 means 256)
  dir.writeUInt8(s > 255 ? 0 : s, 0)
  dir.writeUInt8(s > 255 ? 0 : s, 1)
  dir.writeUInt8(0, 2) // color palette
  dir.writeUInt8(0, 3) // reserved
  dir.writeUInt16LE(1, 4) // color planes (set to 1)
  dir.writeUInt16LE(32, 6) // bits per pixel (32 for PNG)
  dir.writeUInt32LE(img.len, 8) // size of image data
  dir.writeUInt32LE(offset, 12) // offset of image data
  dirs.push(dir)
  offset += img.len
}

const out = Buffer.concat([header, ...dirs, ...images.map(i => i.buf)])
fs.writeFileSync(outPath, out)
console.log('Wrote', outPath, 'size=', out.length, 'entries=', count)
