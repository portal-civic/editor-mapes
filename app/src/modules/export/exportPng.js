import { waitNextFrame, downloadBlob } from './utils'
import { waitForTiles, drawTiles, drawCanvasLayers, drawMarkerLayers } from './drawLayers'
import { drawLegend, drawLegendColumn, drawLegendBar } from './drawLegend'
import { drawTitle } from './drawTitle'
import { drawNorthArrow } from './drawNorth'
import { drawScaleBar } from './drawScale'
import { normalizeLegendLayout } from '../legend/legendLayout'

// Compute the height needed for a bottom legend bar based on entries and layout.
function computeBarHeight(legendEntries, layout) {
  const { fontSize = 11, padding: pad = 12 } = layout
  const rowH = Math.max(22, fontSize * 2.1)
  const titleH = Math.max(16, fontSize * 1.9)
  let maxRows = 0
  for (const entry of legendEntries) {
    const extra = entry.rows.length > 1 ? 1 : 0 // title row
    maxRows = Math.max(maxRows, entry.rows.length + extra)
  }
  return pad * 2 + maxRows * rowH + (maxRows > 0 ? titleH : 0)
}

export async function exportMapAsPNG({
  map,
  fileName = 'editor-mapes.png',
  // Pre-computed legend entries from App.jsx (already filtered by language/viewport)
  legendEntries = [],
  // Layout configuration
  legendLayout = null,
  title = '',
}) {
  if (!map) throw new Error('Leaflet map instance is required')

  await new Promise((resolve) => map.whenReady(resolve))

  // Temporarily reset bearing so tile capture works correctly.
  const originalBearing = typeof map.getBearing === 'function' ? map.getBearing() : 0
  if (originalBearing !== 0 && typeof map.setBearing === 'function') {
    map.setBearing(0)
    await waitNextFrame()
    await waitNextFrame()
  }

  map.invalidateSize({ animate: false, pan: false })
  const center = map.getCenter()
  const zoom = map.getZoom()
  map.setView(center, zoom, { animate: false })

  await waitNextFrame()
  await waitNextFrame()

  const mapContainer = map.getContainer()
  const containerRect = mapContainer.getBoundingClientRect()
  const mapW = Math.round(containerRect.width)
  const mapH = Math.round(containerRect.height)

  if (!mapW || !mapH) throw new Error('Map container has invalid size')

  await waitForTiles(mapContainer)
  await waitNextFrame()

  // ── Stage 1: Capture map into a temporary canvas ──────────────────────────
  const mapCanvas = document.createElement('canvas')
  mapCanvas.width = mapW
  mapCanvas.height = mapH
  const mapCtx = mapCanvas.getContext('2d')
  if (!mapCtx) throw new Error('Failed to acquire canvas context')

  drawTiles(mapCtx, mapContainer, containerRect)
  drawCanvasLayers(mapCtx, mapContainer, containerRect)
  await drawMarkerLayers(mapCtx, mapContainer)

  // ── Stage 2: Compose final export canvas ─────────────────────────────────
  const layout = normalizeLegendLayout(legendLayout)
  const pos = layout.position
  const entries = pos === 'none' ? [] : legendEntries

  let exportW = mapW
  let exportH = mapH
  let mapOffsetX = 0
  let mapOffsetY = 0
  let legendColW = 0
  let legendBarH = 0

  if (pos === 'right') {
    legendColW = layout.width
    exportW = mapW + legendColW
  } else if (pos === 'left') {
    legendColW = layout.width
    exportW = mapW + legendColW
    mapOffsetX = legendColW
  } else if (pos === 'bottom') {
    legendBarH = computeBarHeight(entries, layout)
    exportH = mapH + legendBarH
  }

  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = exportW
  exportCanvas.height = exportH
  const ctx = exportCanvas.getContext('2d')
  if (!ctx) throw new Error('Failed to acquire export canvas context')

  // White base
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, exportW, exportH)

  // Draw map
  ctx.drawImage(mapCanvas, mapOffsetX, mapOffsetY)

  // Draw legend
  if (entries.length > 0) {
    if (pos === 'right') {
      drawLegendColumn(ctx, mapW, 0, legendColW, mapH, entries, layout)
    } else if (pos === 'left') {
      drawLegendColumn(ctx, 0, 0, legendColW, mapH, entries, layout)
    } else if (pos === 'bottom') {
      drawLegendBar(ctx, 0, mapH, exportW, legendBarH, entries, layout)
    } else {
      // 'inside': overlay on bottom-right of map area
      drawLegend(ctx, mapOffsetX + mapW, mapH, entries, layout)
    }
  }

  // Map overlays (title, north arrow, scale bar) — positioned relative to map area
  ctx.save()
  ctx.translate(mapOffsetX, mapOffsetY)
  drawTitle(ctx, mapW, title)
  drawNorthArrow(ctx, mapW)
  drawScaleBar(ctx, map, mapH)
  ctx.restore()

  const pngBlob = await new Promise((resolve) =>
    exportCanvas.toBlob((blob) => resolve(blob), 'image/png'),
  )
  if (!pngBlob) throw new Error('Failed to create PNG blob')

  // Restore original bearing
  if (originalBearing !== 0 && typeof map.setBearing === 'function') {
    map.setBearing(originalBearing)
  }

  downloadBlob(pngBlob, fileName)
}
