import { execFile } from 'child_process'
import { promisify } from 'util'
import { readFile, writeFile, mkdir, access } from 'fs/promises'
import { createHash } from 'crypto'
import { tmpdir } from 'os'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { normalizeOverturePlace } from '../utils/normalizeOverturePlace.js'
import { bboxToString } from '../utils/bbox.js'

const execFileAsync = promisify(execFile)

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = resolve(__dirname, '../cache/overture')

// Cache TTL in ms (24 hours)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true })
}

function cacheKey(bbox, minConfidence) {
  const str = `${bboxToString(bbox)}:${minConfidence ?? ''}`
  return createHash('sha1').update(str).digest('hex').slice(0, 16)
}

async function readCacheEntry(key) {
  const path = join(CACHE_DIR, `${key}.json`)
  try {
    await access(path)
    const raw = await readFile(path, 'utf8')
    const entry = JSON.parse(raw)
    if (Date.now() - entry.savedAt < CACHE_TTL_MS) {
      console.log(`[cache] HIT ${key}`)
      return entry.pois
    }
    console.log(`[cache] STALE ${key}`)
  } catch {
    // Cache miss
  }
  return null
}

async function writeCacheEntry(key, pois) {
  const path = join(CACHE_DIR, `${key}.json`)
  await writeFile(path, JSON.stringify({ savedAt: Date.now(), pois }), 'utf8')
  console.log(`[cache] SAVED ${key} (${pois.length} POIs)`)
}

/**
 * Fetch Overture Places within a bbox using the overturemaps CLI.
 *
 * @param {{ bbox: number[], limit: number, minConfidence: number|null }} opts
 * @returns {Promise<object[]>} Normalised POI objects
 */
export async function getOverturePlacesByBbox({ bbox, limit = 5000, minConfidence = null }) {
  await ensureCacheDir()

  const key = cacheKey(bbox, minConfidence)
  const cached = await readCacheEntry(key)
  if (cached) return cached.slice(0, limit)

  const bboxStr = bboxToString(bbox)
  const tempFile = join(tmpdir(), `overture-${key}.geojson`)

  console.log(`[overture] Downloading places for bbox ${bboxStr}`)

  try {
    await execFileAsync('overturemaps', [
      'download',
      `--bbox=${bboxStr}`,
      '-f', 'geojson',
      '--type=place',
      '-o', tempFile,
    ], {
      timeout: 120_000,
      maxBuffer: 200 * 1024 * 1024, // 200 MB
    })
  } catch (err) {
    const msg = err.stderr ?? err.message ?? String(err)
    console.error('[overture] CLI error:', msg)
    throw Object.assign(
      new Error(`overturemaps CLI failed: ${msg.slice(0, 300)}`),
      { status: 502 },
    )
  }

  let geojson
  try {
    const raw = await readFile(tempFile, 'utf8')
    geojson = JSON.parse(raw)
  } catch (err) {
    throw Object.assign(
      new Error(`Failed to read overturemaps output: ${err.message}`),
      { status: 502 },
    )
  }

  const features = Array.isArray(geojson)
    ? geojson // overturemaps CLI may output a bare array
    : (geojson?.features ?? [])

  console.log(`[overture] ${features.length} raw features`)

  let pois = features
    .map((f, i) => normalizeOverturePlace(f, i))
    .filter(Boolean)

  if (minConfidence != null) {
    pois = pois.filter((p) => p.confidence == null || p.confidence >= minConfidence)
  }

  await writeCacheEntry(key, pois)

  return pois.slice(0, limit)
}
