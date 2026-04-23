// Simple print-quality PDF export: HD raster basemap + real vector layers.
//
// Page sizing strategy:
//   The PDF page uses frame.width × frame.height (screen pixels as PDF points).
//   This guarantees the page aspect ratio exactly matches the editor viewport.
//   jsPDF orientation is set explicitly (landscape/portrait) so it never swaps
//   the dimensions automatically.
//
//   The HD basemap canvas (higher resolution than screen) is embedded as a JPEG
//   and scaled to fill the page exactly. The SVG vector layers are built at the
//   same frame dimensions so coordinates map 1:1 to the PDF page.

import { jsPDF } from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'
import { buildBasemapHDCanvas } from './exportBasemapHD'
import { buildLayerSVG } from './exportSVG'
import { getExportFrame, projectToPixel } from './exportFrame'
import { waitNextFrame, downloadBlob } from './utils'

const COMPATIBLE = new Set(['point', 'line', 'polygon'])

function getOuterRings(latlngs) {
  const isMulti = Array.isArray(latlngs?.[0]?.[0]?.[0])
  if (isMulti) return latlngs.map((rings) => rings[0])
  const isRingFormat = Array.isArray(latlngs?.[0]?.[0])
  if (isRingFormat) return [latlngs[0]]
  return [latlngs]
}

function buildMaskSVG(focusMask, layers, bounds, frameWidth, frameHeight) {
  if (!focusMask?.layerIds?.length) return null

  const frame = { bounds, width: frameWidth, height: frameHeight }

  const holes = []
  for (const layer of layers) {
    if (!focusMask.layerIds.includes(layer.id)) continue
    if (layer.geometryType !== 'polygon') continue
    for (const feature of layer.features ?? []) {
      if (!feature.latlngs) continue
      holes.push(...getOuterRings(feature.latlngs))
    }
  }
  if (holes.length === 0) return null

  const outerPath = `M 0,0 L ${frameWidth},0 L ${frameWidth},${frameHeight} L 0,${frameHeight} Z`

  const holePaths = holes.map((ring) => {
    const pts = ring.map(([lat, lng]) => projectToPixel(lat, lng, frame))
    const first = pts[0]
    const rest = pts.slice(1)
    return (
      `M ${first.x.toFixed(2)},${first.y.toFixed(2)} ` +
      rest.map((p) => `L ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') +
      ' Z'
    )
  })

  const d = [outerPath, ...holePaths].join(' ')
  const color = focusMask.color ?? '#ffffff'
  const opacity = focusMask.opacity ?? 0.7

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${frameWidth}" height="${frameHeight}" viewBox="0 0 ${frameWidth} ${frameHeight}"><path d="${d}" fill="${color}" fill-opacity="${opacity}" fill-rule="evenodd" stroke="none" /></svg>`
}

/**
 * Generates a single-page print PDF combining the HD raster basemap with
 * all visible vector layers rendered as real PDF vectors.
 *
 * @param {L.Map}    map        Leaflet map instance.
 * @param {object[]} layers     Full layer array from app state.
 * @param {object}   basemap    Selected basemap catalog entry (must be type:'xyz').
 * @param {object}   focusMask  Optional mask state { layerIds, opacity, color }.
 */
export async function exportPDFSimple(map, layers, basemap, focusMask = null) {
  if (!map) throw new Error('Leaflet map instance is required')
  if (!basemap || basemap.type !== 'xyz') {
    throw new Error('PDF export only supports XYZ tile basemaps')
  }

  // 1. Reset bearing so map.getBounds() returns the screen-aligned bbox.
  //    leaflet-rotate with bearing != 0 returns an inflated bbox that would
  //    shift and zoom-out the export. We reset, capture, then restore.
  //    No setView/invalidateSize: those cause a small pan that shifts the
  //    bounds away from the actual screen view.
  await new Promise((resolve) => map.whenReady(resolve))

  const originalBearing = typeof map.getBearing === 'function' ? map.getBearing() : 0
  if (originalBearing !== 0 && typeof map.setBearing === 'function') {
    map.setBearing(0)
    await waitNextFrame()
    await waitNextFrame()
  }

  // 2. Capture frame before any further manipulation.
  //    frame.width/height are the screen pixel dimensions of the map container.
  //    These are the single source of truth for the PDF page dimensions.
  const frame = getExportFrame(map)
  const { bounds, width: frameWidth, height: frameHeight } = frame

  if (originalBearing !== 0 && typeof map.setBearing === 'function') {
    map.setBearing(originalBearing)
  }

  // DEBUG TEMPORAL
  console.log('[PDF] frame:', frameWidth, 'x', frameHeight, '| ratio:', (frameWidth / frameHeight).toFixed(4))

  // 3. HD basemap: download + stitch tiles (high-res image data for printing).
  const { canvas: hdCanvas, width: hdWidth, height: hdHeight } = await buildBasemapHDCanvas(
    bounds,
    basemap,
  )
  console.log('[PDF] hd canvas:', hdWidth, 'x', hdHeight, '| ratio:', (hdWidth / hdHeight).toFixed(4))

  // 4. PDF page dimensions = screen frame dimensions (px used as pt, 1:1).
  //    Using frameWidth/frameHeight guarantees the PDF aspect ratio matches
  //    the editor viewport exactly, regardless of HD tile quantization.
  //    Explicit orientation prevents jsPDF from swapping dimensions.
  const pageWidth = frameWidth
  const pageHeight = frameHeight
  const orientation = pageWidth >= pageHeight ? 'l' : 'p'

  console.log('[PDF] page:', pageWidth, 'x', pageHeight, 'pt | orientation:', orientation)

  const doc = new jsPDF({
    unit: 'pt',
    format: [pageWidth, pageHeight],
    orientation,
    compress: true,
  })

  // Verify what jsPDF actually created (internal dimensions).
  const docW = doc.internal.pageSize.getWidth()
  const docH = doc.internal.pageSize.getHeight()
  console.log('[PDF] jsPDF internal page:', docW.toFixed(2), 'x', docH.toFixed(2))

  // 5. Embed basemap as JPEG scaled to fill the entire page.
  const basemapDataUrl = hdCanvas.toDataURL('image/jpeg', 0.92)
  doc.addImage(basemapDataUrl, 'JPEG', 0, 0, docW, docH)
  console.log('[PDF] basemap inserted at (0,0)', docW.toFixed(2), 'x', docH.toFixed(2))

  // 6. Render each visible vector layer as real PDF vectors via svg2pdf.
  //    SVGs are built at frameWidth × frameHeight so projectToPixel coordinates
  //    map directly onto the PDF page without any scaling mismatch.
  const visibleLayers = layers.filter((l) => l.visible && COMPATIBLE.has(l.geometryType))

  for (const layer of visibleLayers) {
    const svgString = buildLayerSVG(layer, bounds, frameWidth, frameHeight)
    if (!svgString) continue

    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgEl = svgDoc.documentElement

    await svg2pdf(svgEl, doc, { x: 0, y: 0, width: docW, height: docH })
    console.log('[PDF] SVG layer inserted:', layer.name)
  }

  // 7. Render focus mask on top of vector layers (exterior fill with polygon holes).
  if (focusMask?.layerIds?.length) {
    const maskSvgString = buildMaskSVG(focusMask, layers, bounds, frameWidth, frameHeight)
    if (maskSvgString) {
      const maskDoc = new DOMParser().parseFromString(maskSvgString, 'image/svg+xml')
      await svg2pdf(maskDoc.documentElement, doc, { x: 0, y: 0, width: docW, height: docH })
    }
  }

  // 8. Download.
  const pdfBlob = doc.output('blob')
  downloadBlob(pdfBlob, 'mapa.pdf')
}
