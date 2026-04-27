import { waitNextFrame, downloadBlob } from './utils'
import { waitForTiles, drawTiles, drawCanvasLayers, drawMarkerLayers } from './drawLayers'
import { drawLegend, drawLegendColumn, drawLegendBar } from './drawLegend'
import { drawTitle, drawTitleBlock, TITLE_BAR_H } from './drawTitle'
import { drawNorthArrow } from './drawNorth'
import { drawScaleBar } from './drawScale'
import { normalizeLegendLayout } from '../legend/legendLayout'

// Compute the height needed for a bottom legend bar based on entries and layout.
function computeBarHeight(legendEntries, layout) {
  const { fontSize = 11, padding: pad = 12 } = layout
  const rowH = Math.max(22, fontSize * 2.2)
  const titleH = Math.max(18, fontSize * 1.8)
  let maxRows = 0
  for (const entry of legendEntries) {
    const extra = entry.rows.length > 1 ? 1 : 0
    maxRows = Math.max(maxRows, entry.rows.length + extra)
  }
  return pad * 2 + maxRows * rowH + (maxRows > 0 ? titleH : 0)
}

export async function exportMapAsPNG({
  map,
  fileName = 'editor-mapes.png',
  legendEntries = [],
  legendLayout = null,
  title = '',
}) {
  if (!map) throw new Error('Leaflet map instance is required')

  await new Promise((resolve) => map.whenReady(resolve))

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

  // ── Preload web fonts so canvas ctx.font renders correctly ────────────────
  const layout = normalizeLegendLayout(legendLayout)
  const fontFamilyRaw = layout.fontFamily || 'Inter, sans-serif'
  // Extract the first named font family (strip quotes, commas, generics)
  const fontFamilyName = fontFamilyRaw.split(',')[0].replace(/['"]/g, '').trim()
  const isWebFont = !['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'].includes(fontFamilyName)
  if (isWebFont && typeof document !== 'undefined' && document.fonts) {
    await Promise.allSettled([
      document.fonts.load(`400 ${layout.fontSize}px "${fontFamilyName}"`),
      document.fonts.load(`500 ${layout.fontSize}px "${fontFamilyName}"`),
      document.fonts.load(`500 ${layout.titleFontSize}px "${fontFamilyName}"`),
    ])
  }

  // ── Stage 1: Capture map into a temporary canvas ──────────────────────────
  const mapCanvas = document.createElement('canvas')
  mapCanvas.width = mapW
  mapCanvas.height = mapH
  const mapCtx = mapCanvas.getContext('2d')
  if (!mapCtx) throw new Error('Failed to acquire canvas context')

  drawTiles(mapCtx, mapContainer, containerRect)
  drawCanvasLayers(mapCtx, mapContainer, containerRect)
  await drawMarkerLayers(mapCtx, mapContainer)

  // ── Stage 2: Compute export layout ───────────────────────────────────────
  // (layout already computed above for font preloading)
  const pos = layout.position
  const entries = pos === 'none' ? [] : legendEntries

  const margin = layout.margin ?? 0
  const hasTitle = Boolean(title && title.trim())
  // titlePosition only applies when there is an actual title
  const titlePos = hasTitle ? (layout.titlePosition ?? 'floating') : 'floating'

  // 'above-legend' only makes sense with a column legend; otherwise fall back to 'above-map'
  const effectiveTitlePos = (titlePos === 'above-legend' && pos !== 'right' && pos !== 'left')
    ? 'above-map'
    : titlePos

  // Height reserved for an integrated title strip above the map area
  const aboveMapTitleH = effectiveTitlePos === 'above-map' ? TITLE_BAR_H : 0
  // Height reserved inside the legend column for the title
  const aboveLegendTitleH = effectiveTitlePos === 'above-legend' ? TITLE_BAR_H : 0

  let legendColW = 0
  let legendBarH = 0

  if (pos === 'right' || pos === 'left') {
    legendColW = layout.width
  } else if (pos === 'bottom') {
    legendBarH = computeBarHeight(entries, layout)
  }

  const exportW = margin + (pos === 'left' ? legendColW : 0) + mapW + (pos === 'right' ? legendColW : 0) + margin
  const exportH = margin + aboveMapTitleH + mapH + legendBarH + margin

  const mapOffsetX = margin + (pos === 'left' ? legendColW : 0)
  const mapOffsetY = margin + aboveMapTitleH

  // Legend column geometry
  const legendColX = pos === 'right' ? mapOffsetX + mapW : margin
  const legendColY = margin
  const legendColH = exportH - margin * 2

  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = exportW
  exportCanvas.height = exportH
  const ctx = exportCanvas.getContext('2d')
  if (!ctx) throw new Error('Failed to acquire export canvas context')

  // White base (covers margins)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, exportW, exportH)

  // ── Integrated title strip (above-map) ───────────────────────────────────
  if (effectiveTitlePos === 'above-map' && hasTitle) {
    const stripW = exportW - margin * 2
    drawTitleBlock(ctx, margin, margin, stripW, TITLE_BAR_H, title, layout.fontFamily)
  }

  // Draw map
  ctx.drawImage(mapCanvas, mapOffsetX, mapOffsetY)

  // ── Legend ───────────────────────────────────────────────────────────────
  if (entries.length > 0) {
    if (pos === 'right' || pos === 'left') {
      // Title-in-legend: draw title block at top of column, then legend below
      if (effectiveTitlePos === 'above-legend' && hasTitle) {
        drawTitleBlock(ctx, legendColX, legendColY, legendColW, aboveLegendTitleH, title, layout.fontFamily)
      }
      drawLegendColumn(
        ctx,
        legendColX,
        legendColY + aboveLegendTitleH,
        legendColW,
        legendColH - aboveLegendTitleH,
        entries,
        layout,
      )
    } else if (pos === 'bottom') {
      drawLegendBar(ctx, margin, mapOffsetY + mapH, exportW - margin * 2, legendBarH, entries, layout)
    } else {
      // 'inside': floating overlay on the map
      drawLegend(ctx, mapOffsetX + mapW, mapOffsetY + mapH, entries, layout)
    }
  }

  // ── Map overlays (floating title, north arrow, scale bar) ────────────────
  ctx.save()
  ctx.translate(mapOffsetX, mapOffsetY)
  if (effectiveTitlePos === 'floating') {
    drawTitle(ctx, mapW, title, layout.fontFamily)
  }
  drawNorthArrow(ctx, mapW)
  drawScaleBar(ctx, map, mapH)
  ctx.restore()

  const pngBlob = await new Promise((resolve) =>
    exportCanvas.toBlob((blob) => resolve(blob), 'image/png'),
  )
  if (!pngBlob) throw new Error('Failed to create PNG blob')

  if (originalBearing !== 0 && typeof map.setBearing === 'function') {
    map.setBearing(originalBearing)
  }

  downloadBlob(pngBlob, fileName)
}
