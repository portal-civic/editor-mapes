import { waitNextFrame, downloadBlob } from './utils'
import { waitForTiles, drawTiles, drawCanvasLayers, drawMarkerLayers } from './drawLayers'
import { drawLegend } from './drawLegend'
import { buildLegendEntries } from '../legend/buildLegendEntries'
import { drawTitle } from './drawTitle'
import { drawNorthArrow } from './drawNorth'
import { drawScaleBar } from './drawScale'

export async function exportMapAsPNG({
  map,
  fileName = 'editor-mapes.png',
  legendLayers = [],
  title = '',
  showLegend = true,
}) {
  if (!map) throw new Error('Leaflet map instance is required')

  await new Promise((resolve) => map.whenReady(resolve))

  // Temporarily reset bearing to 0 so tile/canvas capture works correctly.
  // leaflet-rotate applies rotation via CSS transforms; the pixel-capture
  // approach reads getBoundingClientRect() positions which are already
  // rotated in screen space, causing cropping and misalignment.
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
  const width = Math.round(containerRect.width)
  const height = Math.round(containerRect.height)

  if (!width || !height) throw new Error('Map container has invalid size')

  await waitForTiles(mapContainer)
  await waitNextFrame()

  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = width
  exportCanvas.height = height
  const ctx = exportCanvas.getContext('2d')
  if (!ctx) throw new Error('Failed to acquire canvas context')

  drawTiles(ctx, mapContainer, containerRect)
  drawCanvasLayers(ctx, mapContainer, containerRect)
  await drawMarkerLayers(ctx, mapContainer)
  if (showLegend) drawLegend(ctx, width, height, buildLegendEntries(legendLayers))
  drawTitle(ctx, width, title)
  drawNorthArrow(ctx, width)
  drawScaleBar(ctx, map, height)

  const pngBlob = await new Promise((resolve) =>
    exportCanvas.toBlob((blob) => resolve(blob), 'image/png'),
  )
  if (!pngBlob) throw new Error('Failed to create PNG blob')

  // Restore original bearing after capture.
  if (originalBearing !== 0 && typeof map.setBearing === 'function') {
    map.setBearing(originalBearing)
  }

  downloadBlob(pngBlob, fileName)
}
