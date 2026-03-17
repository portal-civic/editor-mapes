import { waitNextFrame, downloadBlob } from './utils'
import { waitForTiles, drawTiles } from './drawLayers'
import { getExportFrame } from './exportFrame'
import { buildPointLayerSVG, buildLayerSVG } from './exportSVG'
import { buildBasemapHDCanvas } from './exportBasemapHD'

// Exports a basemap-only PNG and a point layer SVG that share the exact same
// geographic bounds and pixel dimensions, so they align perfectly when
// imported as separate layers in Affinity Designer / Illustrator.
export async function exportHybridPointLayer(map, layer) {
  if (!map || !layer || layer.geometryType !== 'point') {
    throw new Error('Requires a map instance and a point layer')
  }

  // Settle the map so bounds and container size are stable.
  await new Promise((resolve) => map.whenReady(resolve))
  map.invalidateSize({ animate: false, pan: false })
  map.setView(map.getCenter(), map.getZoom(), { animate: false })
  await waitNextFrame()
  await waitNextFrame()

  // Single source of truth for the export extent.
  const frame = getExportFrame(map)
  const { bounds, width, height } = frame
  if (!width || !height) throw new Error('Map container has invalid size')

  // --- Basemap PNG (tiles only, no vector overlays or decorations) ---
  const mapContainer = map.getContainer()
  const containerRect = mapContainer.getBoundingClientRect()
  await waitForTiles(mapContainer)
  await waitNextFrame()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to acquire canvas context')

  drawTiles(ctx, mapContainer, containerRect)

  const pngBlob = await new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), 'image/png'),
  )
  if (!pngBlob) throw new Error('Failed to create basemap PNG blob')

  // --- Point layer SVG with the same frame ---
  const svgContent = buildPointLayerSVG(layer, bounds, width, height)
  if (!svgContent) throw new Error('Failed to build SVG content')
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })

  // --- Download both files ---
  const safeName = (layer.name || 'capa').replace(/[^\w\-]/g, '_')
  downloadBlob(pngBlob, 'basemap.png')
  // Small delay so browsers don't suppress the second download.
  await new Promise((resolve) => setTimeout(resolve, 150))
  downloadBlob(svgBlob, `${safeName}.svg`)
}

// Exports basemap PNG + one SVG per visible compatible layer, all sharing the
// same export frame so files align perfectly when stacked in Affinity.
//
// When `basemap` is provided (XYZ type), the basemap PNG is generated at high
// resolution by downloading and stitching tiles directly (≈10000 px wide).
// The SVGs are also generated at that HD resolution so all files align.
//
// When `basemap` is null/absent, falls back to screen-resolution tile capture.
export async function exportAllVisibleLayers(map, layers, basemap = null) {
  const COMPATIBLE = new Set(['point', 'line', 'polygon'])
  const visibleLayers = layers.filter((l) => l.visible && COMPATIBLE.has(l.geometryType))
  if (visibleLayers.length === 0) return

  // Settle the map.
  await new Promise((resolve) => map.whenReady(resolve))
  map.invalidateSize({ animate: false, pan: false })
  map.setView(map.getCenter(), map.getZoom(), { animate: false })
  await waitNextFrame()
  await waitNextFrame()

  // Geographic bounds — shared by basemap PNG and all SVGs.
  const frame = getExportFrame(map)
  const { bounds, width: screenWidth, height: screenHeight } = frame
  if (!screenWidth || !screenHeight) throw new Error('Map container has invalid size')

  let basemapPngBlob
  let svgWidth
  let svgHeight

  if (basemap?.type === 'xyz') {
    // HD path: download and stitch tiles at ≈10000 px wide.
    const { canvas: hdCanvas, width: hdW, height: hdH } = await buildBasemapHDCanvas(
      bounds,
      basemap,
    )
    svgWidth = hdW
    svgHeight = hdH
    basemapPngBlob = await new Promise((resolve) =>
      hdCanvas.toBlob((blob) => resolve(blob), 'image/png'),
    )
  } else {
    // Fallback: capture tiles already rendered on screen.
    const mapContainer = map.getContainer()
    const containerRect = mapContainer.getBoundingClientRect()
    await waitForTiles(mapContainer)
    await waitNextFrame()

    const canvas = document.createElement('canvas')
    canvas.width = screenWidth
    canvas.height = screenHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to acquire canvas context')
    drawTiles(ctx, mapContainer, containerRect)

    svgWidth = screenWidth
    svgHeight = screenHeight
    basemapPngBlob = await new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob), 'image/png'),
    )
  }

  if (!basemapPngBlob) throw new Error('Failed to create basemap PNG blob')
  downloadBlob(basemapPngBlob, 'basemap.png')

  // One SVG per visible compatible layer.
  // SVG dimensions match the basemap PNG so both files align in Affinity.
  for (const layer of visibleLayers) {
    await new Promise((resolve) => setTimeout(resolve, 150))
    const svgContent = buildLayerSVG(layer, bounds, svgWidth, svgHeight)
    if (!svgContent) continue
    const safeName = (layer.name || 'capa').replace(/[^\w\-]/g, '_')
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
    downloadBlob(svgBlob, `${safeName}.svg`)
  }
}
