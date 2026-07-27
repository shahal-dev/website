#!/usr/bin/env node
/**
 * Turn one uploaded astrophoto into the three versions the gallery expects.
 *
 *   pnpm photo <source-image> <ObjectName> [--title "Andromeda Galaxy"]
 *
 * Produces public/photos/<ObjectName>/:
 *   thumb.webp     400 px wide   — grid tiles
 *   medium.webp   1600 px wide   — page + carousel
 *   full.jpg      full resolution — "view full size"
 *   metadata.json  dimensions, byte sizes, capture EXIF when present
 *
 * Extra frames for the same object go in numbered slots:
 *   pnpm photo second-frame.tif M31 --slot 2   →  public/photos/M31/2/{thumb,medium,full}
 *
 * A professional comparison frame (Hubble, JWST, a survey) goes in as:
 *   pnpm photo hubble-m31.jpg M31 --reference    →  public/photos/M31/reference.webp
 */
import { existsSync } from 'node:fs'
import { mkdir, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const THUMB_WIDTH = 400
const MEDIUM_WIDTH = 1600

function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        flags[key] = next
        i++
      } else {
        flags[key] = true
      }
    } else {
      positional.push(arg)
    }
  }
  return { positional, flags }
}

const { positional, flags } = parseArgs(process.argv.slice(2))
const [source, objectName] = positional

if (!source || !objectName) {
  console.error('Usage: pnpm photo <source-image> <ObjectName> [--title "..."] [--slot 2]')
  process.exit(1)
}

if (!existsSync(source)) {
  console.error(`Source image not found: ${source}`)
  process.exit(1)
}

const slug = objectName.trim().replace(/\s+/g, '-')
const outDir = path.join(
  process.cwd(),
  'public/photos',
  slug,
  flags.slot ? String(flags.slot) : ''
)

await mkdir(outDir, { recursive: true })

const image = sharp(source, { limitInputPixels: false })
const meta = await image.metadata()

// Pull the handful of EXIF fields worth showing; astro frames often carry none.
let exif = {}
try {
  if (meta.exif) {
    const { default: exifReader } = await import('exif-reader')
    const parsed = exifReader(meta.exif)
    exif = {
      camera: [parsed?.Image?.Make, parsed?.Image?.Model].filter(Boolean).join(' ') || undefined,
      lens: parsed?.Photo?.LensModel,
      iso: parsed?.Photo?.ISOSpeedRatings,
      exposure: parsed?.Photo?.ExposureTime,
      aperture: parsed?.Photo?.FNumber,
      focalLength: parsed?.Photo?.FocalLength,
      takenAt: parsed?.Photo?.DateTimeOriginal
    }
    for (const key of Object.keys(exif)) if (exif[key] === undefined) delete exif[key]
  }
} catch {
  // exif-reader is optional — carry on without it.
}

// --reference writes a single reference.webp instead (Hubble/JWST/survey frame
// used by the comparison slider), so it never lands in the carousel.
const targets = flags.reference
  ? [{ name: 'reference.webp', width: MEDIUM_WIDTH, fn: img => img.webp({ quality: 82 }) }]
  : [
      { name: 'thumb.webp', width: THUMB_WIDTH, fn: img => img.webp({ quality: 78 }) },
      { name: 'medium.webp', width: MEDIUM_WIDTH, fn: img => img.webp({ quality: 82 }) },
      { name: 'full.jpg', width: null, fn: img => img.jpeg({ quality: 92, mozjpeg: true }) }
    ]

const written = {}

for (const target of targets) {
  const out = path.join(outDir, target.name)
  let pipeline = sharp(source, { limitInputPixels: false }).rotate()
  if (target.width) {
    pipeline = pipeline.resize({ width: target.width, withoutEnlargement: true })
  }
  const info = await target.fn(pipeline).toFile(out)
  const { size } = await stat(out)
  written[target.name] = { width: info.width, height: info.height, bytes: size }
  console.log(`  ${target.name.padEnd(12)} ${info.width}×${info.height}  ${(size / 1024).toFixed(0)} kB`)
}

const publicPath = `/photos/${slug}${flags.slot ? `/${flags.slot}` : ''}`

if (flags.reference) {
  console.log(`\n✔ reference frame → public${publicPath}/reference.webp`)
  console.log('  Add to the entry\'s frontmatter:')
  console.log(`  reference:\n    src: ${publicPath}/reference.webp\n    label: Hubble\n    credit: "NASA/ESA ..."`)
  process.exit(0)
}

const metadata = {
  object: objectName,
  title: flags.title || objectName,
  slug,
  source: path.basename(source),
  processedAt: new Date().toISOString(),
  original: { width: meta.width, height: meta.height, format: meta.format },
  versions: {
    thumb: { src: `${publicPath}/thumb.webp`, ...written['thumb.webp'] },
    medium: { src: `${publicPath}/medium.webp`, ...written['medium.webp'] },
    full: { src: `${publicPath}/full.jpg`, ...written['full.jpg'] }
  },
  ...(Object.keys(exif).length ? { exif } : {})
}

await writeFile(path.join(outDir, 'metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`)

console.log(`\n✔ ${objectName} → public${publicPath}`)
console.log(`  Reference it in a gallery entry as:  medium: ${publicPath}/medium.webp`)
