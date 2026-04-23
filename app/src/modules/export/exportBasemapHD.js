// HD basemap export via direct tile download and canvas composition.
//
// Two separate concerns — keep them distinct:
//   A) TILE ZOOM: which zoom level to fetch tiles at. Higher = more geographic detail.
//   B) OUTPUT SIZE: final PNG pixel dimensions. Always set to targetWidth × targetHeight.
//
// "maxQuality" mode maximises (A) independently of (B). Tiles are fetched at the
// highest zoom where the tile count stays below MAX_TILES. The resulting canvas
// is then scaled up to the requested output size, yielding a large, sharp PNG.
//
// Algorithm:
//   1. Choose tile zoom (driven by maxQuality or targetWidth/targetHeight).
//   2. Compute exact pixel extent of the bounds in global tile space at that zoom.
//   3. Determine the tile grid covering those pixels.
//   4. Download all tiles in parallel (failed tiles leave a blank square).
//   5. Stitch tiles onto a scratch canvas.
//   6. Crop to the exact geographic bounds → intermediate canvas at tile resolution.
//   7. (exportBasemapHDPng only) Scale intermediate canvas to targetWidth × targetHeight.

import { getExportFrame } from './exportFrame'
import { waitNextFrame, downloadBlob } from './utils'

const TILE_SIZE = 256

// Maximum number of tiles fetched per export.
// Primary constraint in maxQuality mode: limits network + memory load.
// 4000 tiles × 256 px × 4 bytes ≈ 1 GB raw — browsers handle this fine in parallel loads
// because only decoded images are kept, not all simultaneously.
const MAX_TILES = 4000

// Hard cap for the intermediate stitch canvas (before output scaling).
// 500 Mpx = 22 360 × 22 360 px. Far larger than any realistic stitch canvas.
const MAX_STITCH_PIXELS = 500e6

// --- Projection helpers (Web Mercator / EPSG:3857) ---

function lngToPixelX(lng, z) {
  return (TILE_SIZE * 2 ** z * (lng + 180)) / 360
}

function latToPixelY(lat, z) {
  const rad = (lat * Math.PI) / 180
  return (TILE_SIZE * 2 ** z * (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI)) / 2
}

// Mercator Y scale factor (zoom-independent). Used to derive zoom from targetHeight.
// height(z) = TILE_SIZE * 2^z * mercSpan / (2π)  →  z = log2(targetH * 2π / (TILE_SIZE * mercSpan))
function mercFactor(lat) {
  const rad = (lat * Math.PI) / 180
  return Math.log(Math.tan(rad) + 1 / Math.cos(rad))
}

// --- Tile URL helpers ---

function buildTileUrl(template, z, x, y, subdomains) {
  const sArr =
    Array.isArray(subdomains) && subdomains.length > 0
      ? subdomains
      : typeof subdomains === 'string' && subdomains.length > 0
        ? subdomains.split('')
        : ['']
  const s = sArr[(x + y) % sArr.length]
  return template
    .replace('{z}', z)
    .replace('{x}', x)
    .replace('{y}', y)
    .replace('{s}', s)
    .replace('{r}', '')
}

function loadTile(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null) // blank square on error — export continues
    img.src = url
  })
}

// Tile count for a given zoom and geographic extent.
function tileCountAtZoom(west, east, north, south, z) {
  const txMin = Math.floor(lngToPixelX(west, z) / TILE_SIZE)
  const txMax = Math.ceil(lngToPixelX(east, z) / TILE_SIZE) - 1
  const tyMin = Math.floor(latToPixelY(north, z) / TILE_SIZE)
  const tyMax = Math.ceil(latToPixelY(south, z) / TILE_SIZE) - 1
  return (txMax - txMin + 1) * (tyMax - tyMin + 1)
}

// --- Core tile-stitch function ---

/**
 * Downloads XYZ tiles covering `bounds` and returns an HTMLCanvasElement cropped
 * to the exact geographic extent at the chosen tile zoom.
 *
 * NOTE: This returns the canvas at TILE ZOOM resolution (intermediate).
 * For the final user-facing PNG, call exportBasemapHDPng() which scales to targetWidth×targetHeight.
 *
 * @param {L.LatLngBounds} bounds    Geographic extent (Leaflet LatLngBounds).
 * @param {object}         basemap   Catalog entry — must have type:'xyz', url, subdomains, maxZoom.
 * @param {object|number}  [options]
 *   options.targetWidth  {number}   Desired final PNG width (default 10000). Used to pick zoom when
 *                                   maxQuality is false.
 *   options.targetHeight {number}   Optional desired final PNG height. Constrains zoom if specified.
 *   options.maxQuality   {boolean}  Use the highest zoom where tileCount ≤ MAX_TILES, ignoring
 *                                   targetWidth/targetHeight for zoom selection.
 * @returns {Promise<{canvas, width, height, zoom}>} Intermediate canvas at tile resolution.
 */
export async function buildBasemapHDCanvas(bounds, basemap, options = {}) {
  if (!basemap || basemap.type !== 'xyz') {
    throw new Error('HD basemap export only supports XYZ tile sources')
  }

  // Backward compat: raw number treated as targetWidth.
  const { targetWidth = 10000, targetHeight = null, maxQuality = false, manualZoom = null } =
    typeof options === 'number' ? { targetWidth: options } : options

  const west = bounds.getWest()
  const east = bounds.getEast()
  const north = bounds.getNorth()
  const south = bounds.getSouth()

  const providerMaxZoom = basemap.maxZoom ?? 19

  // --- A) Bounds and B) Viewing zoom are both captured upstream in getExportFrame().
  // --- C) Export zoom is chosen here, independently of B.
  let zoom
  let zoomIsManual = false

  if (manualZoom != null) {
    // MANUAL mode: user specifies the exact tile zoom.
    // The export zoom is fully independent of the current map viewing zoom.
    // Reject immediately if it exceeds the provider's max — do not silently reduce.
    const requested = Math.round(manualZoom)
    if (requested > providerMaxZoom) {
      throw new Error(
        `El zoom manual (${requested}) supera el màxim del proveïdor de teseles (${providerMaxZoom}). ` +
          `Introdueix un valor ≤ ${providerMaxZoom}.`,
      )
    }
    zoom = Math.max(requested, 1)
    zoomIsManual = true
  } else if (maxQuality) {
    // AUTO mode: highest zoom where tileCount ≤ MAX_TILES.
    // Depends only on the bounds extent, not on the viewing zoom.
    zoom = providerMaxZoom
    while (zoom > 1 && tileCountAtZoom(west, east, north, south, zoom) > MAX_TILES) {
      zoom--
    }
  } else {
    // DIMENSION mode: zoom derived from requested output width/height.
    // NOTE: this path IS indirectly sensitive to the viewing zoom because
    // east-west changes when you zoom in/out. Prefer maxQuality or manualZoom
    // for zoom-independent exports.
    const zFromWidth = Math.log2((targetWidth * 360) / (TILE_SIZE * (east - west)))
    let zRaw = zFromWidth
    if (targetHeight != null) {
      const mercSpan = mercFactor(north) - mercFactor(south)
      const zFromHeight = Math.log2((targetHeight * 2 * Math.PI) / (TILE_SIZE * mercSpan))
      zRaw = Math.min(zFromWidth, zFromHeight) // use the more constraining dimension
    }
    zoom = Math.min(Math.floor(zRaw), providerMaxZoom)
    zoom = Math.max(zoom, 1)
  }

  // Exact pixel bounds in global tile space at the chosen zoom.
  const xPixelMin = lngToPixelX(west, zoom)
  const xPixelMax = lngToPixelX(east, zoom)
  const yPixelMin = latToPixelY(north, zoom) // north = smaller y (top-left origin)
  const yPixelMax = latToPixelY(south, zoom)

  const hdWidth = Math.round(xPixelMax - xPixelMin)
  const hdHeight = Math.round(yPixelMax - yPixelMin)

  // Tile grid covering the pixel bounds.
  const xTileMin = Math.floor(xPixelMin / TILE_SIZE)
  const xTileMax = Math.ceil(xPixelMax / TILE_SIZE) - 1
  const yTileMin = Math.floor(yPixelMin / TILE_SIZE)
  const yTileMax = Math.ceil(yPixelMax / TILE_SIZE) - 1
  const tileCount = (xTileMax - xTileMin + 1) * (yTileMax - yTileMin + 1)

  // Safety checks. maxQuality loop already ensures tileCount ≤ MAX_TILES.
  if (tileCount > MAX_TILES) {
    if (zoomIsManual) {
      throw new Error(
        `El zoom ${zoom} requeriria ${tileCount} tiles per a l'enquadre actual (màxim ${MAX_TILES}). ` +
          `Redueix el zoom manual o redueix l'àrea visible al mapa.`,
      )
    }
    throw new Error(
      `L'exportació requeriria ${tileCount} tiles (màxim ${MAX_TILES}). ` +
        `Redueix l'enquadre visible o activa "màxima qualitat" per triar el zoom automàticament.`,
    )
  }
  const stitchW = (xTileMax - xTileMin + 1) * TILE_SIZE
  const stitchH = (yTileMax - yTileMin + 1) * TILE_SIZE
  if (stitchW * stitchH > MAX_STITCH_PIXELS) {
    throw new Error(
      `Canvas de composició massa gran (${stitchW}×${stitchH} px, zoom ${zoom}). ` +
        `Prova amb un zoom menor.`,
    )
  }

  // Pixel offset of the geographic bounds within the stitched tile canvas.
  const offsetX = Math.round(xPixelMin - xTileMin * TILE_SIZE)
  const offsetY = Math.round(yPixelMin - yTileMin * TILE_SIZE)

  // Download all tiles in parallel.
  const { subdomains = null } = basemap
  const tilePromises = []
  for (let ty = yTileMin; ty <= yTileMax; ty++) {
    for (let tx = xTileMin; tx <= xTileMax; tx++) {
      const url = buildTileUrl(basemap.url, zoom, tx, ty, subdomains)
      tilePromises.push(loadTile(url).then((img) => ({ img, tx, ty })))
    }
  }
  const tiles = await Promise.all(tilePromises)

  // Stitch tiles onto a scratch canvas.
  const stitchCanvas = document.createElement('canvas')
  stitchCanvas.width = stitchW
  stitchCanvas.height = stitchH
  const stitchCtx = stitchCanvas.getContext('2d')
  for (const { img, tx, ty } of tiles) {
    if (!img) continue
    stitchCtx.drawImage(img, (tx - xTileMin) * TILE_SIZE, (ty - yTileMin) * TILE_SIZE)
  }

  // Crop stitched canvas to the exact geographic bounds at tile zoom.
  const hdCanvas = document.createElement('canvas')
  hdCanvas.width = hdWidth
  hdCanvas.height = hdHeight
  hdCanvas.getContext('2d').drawImage(stitchCanvas, offsetX, offsetY, hdWidth, hdHeight, 0, 0, hdWidth, hdHeight)

  return { canvas: hdCanvas, width: hdWidth, height: hdHeight, zoom }
}

// --- Standalone PNG export ---

/**
 * Exports the current visible basemap as a standalone HD PNG file.
 *
 * Flow:
 *   1. Reset bearing (getBounds() must return the screen-aligned bbox).
 *   2. buildBasemapHDCanvas → intermediate canvas at tile zoom resolution.
 *   3. Scale to targetWidth × targetHeight → final output canvas.
 *   4. Encode as PNG and download.
 *
 * The tile zoom is chosen independently of the output size:
 *   - maxQuality=true  → highest zoom where tileCount ≤ MAX_TILES (see buildBasemapHDCanvas).
 *   - maxQuality=false → zoom that fits the output dimensions naturally.
 * Either way, the final PNG is always exactly targetWidth × targetHeight pixels.
 *
 * @param {L.Map}   map
 * @param {object}  basemap
 * @param {object}  [options]
 *   options.targetWidth  {number}   Final PNG width in px (default 10000).
 *   options.targetHeight {number}   Final PNG height in px (optional; derived proportionally if omitted).
 *   options.maxQuality   {boolean}  Use highest safe tile zoom.
 */
export async function exportBasemapHDPng(map, basemap, options = {}) {
  if (!basemap || basemap.type !== 'xyz') {
    throw new Error('HD export only supports XYZ tile basemaps')
  }

  const { targetWidth = 10000, targetHeight = null, maxQuality = false } =
    typeof options === 'number' ? { targetWidth: options } : options

  // Reset bearing so getBounds() returns the screen-aligned bbox.
  const originalBearing = typeof map.getBearing === 'function' ? map.getBearing() : 0
  if (originalBearing !== 0 && typeof map.setBearing === 'function') {
    map.setBearing(0)
    await waitNextFrame()
    await waitNextFrame()
  }

  const frame = getExportFrame(map)

  if (originalBearing !== 0 && typeof map.setBearing === 'function') {
    map.setBearing(originalBearing)
  }

  // Step 1: Get intermediate canvas at tile zoom.
  const { canvas: tileCanvas, zoom } = await buildBasemapHDCanvas(frame.bounds, basemap, {
    targetWidth,
    targetHeight,
    maxQuality,
  })

  // Step 2: Scale to requested output dimensions.
  // Output height: use targetHeight if provided, otherwise derive proportionally.
  const outW = targetWidth
  const outH = targetHeight ?? Math.round(outW * tileCanvas.height / tileCanvas.width)

  const outCanvas = document.createElement('canvas')
  outCanvas.width = outW
  outCanvas.height = outH
  const outCtx = outCanvas.getContext('2d')
  // imageSmoothingQuality: 'high' uses bicubic-quality downscaling/upscaling.
  outCtx.imageSmoothingEnabled = true
  outCtx.imageSmoothingQuality = 'high'
  outCtx.drawImage(tileCanvas, 0, 0, outW, outH)

  // Step 3: Encode and download.
  let blob
  try {
    blob = await new Promise((resolve, reject) =>
      outCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas buit — comprova la consola'))),
        'image/png',
      ),
    )
  } catch (e) {
    if (e.name === 'SecurityError') {
      throw new Error(
        'El proveïdor de teseles no permet exportació des del navegador (restricció CORS). ' +
          'Prova amb un altre basemap.',
      )
    }
    throw e
  }

  const fileName = `basemap-hd-z${zoom}-${outW}x${outH}.png`
  downloadBlob(blob, fileName)
}
