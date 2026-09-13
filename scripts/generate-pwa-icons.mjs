#!/usr/bin/env node
// Regenerate every PWA icon from public/icons/icon.svg (or a PNG passed as argv[2]).
//   npx -y -p sharp@0.33 node scripts/generate-pwa-icons.mjs [source.svg|png]
// Rebranding = replace the source image, run this, deploy hosting.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
let sharp
try { sharp = require('sharp') } catch {
  console.error('sharp not installed. Run: npx -y -p sharp@0.33 node scripts/generate-pwa-icons.mjs')
  process.exit(1)
}

const out = path.resolve('public/icons')
const src = readFileSync(process.argv[2] || path.join(out, 'icon.svg'))
const BG = process.env.PWA_ICON_BG || '#0d9488'

await sharp(src).resize(192, 192).png().toFile(path.join(out, 'icon-192.png'))
await sharp(src).resize(512, 512).png().toFile(path.join(out, 'icon-512.png'))
await sharp(src).resize(180, 180).png().toFile(path.join(out, 'apple-touch-icon.png'))
const inner = await sharp(src).resize(410, 410).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: BG } })
  .composite([{ input: inner, gravity: 'centre' }]).png()
  .toFile(path.join(out, 'maskable-512.png'))
console.log('PWA icons written to', out)
