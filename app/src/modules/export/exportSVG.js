import { projectToPixel } from './exportFrame'

// ---------------------------------------------------------------------------
// Internal geometry helpers
// ---------------------------------------------------------------------------

// Converts a line's latlngs to an SVG path data string.
// Handles flat [[lat,lng],...] and multi [[[lat,lng],...],...]
function lineFeatureToPathData(latlngs, frame) {
  const isMulti = Array.isArray(latlngs?.[0]?.[0])
  const segments = isMulti ? latlngs : [latlngs]
  return segments
    .filter((seg) => Array.isArray(seg) && seg.length >= 2)
    .map((seg) => {
      const pts = seg.map(([lat, lng]) => {
        const { x, y } = projectToPixel(lat, lng, frame)
        return `${x.toFixed(2)},${y.toFixed(2)}`
      })
      return `M ${pts.join(' L ')}`
    })
    .join(' ')
}

// Converts a polygon ring (flat [[lat,lng],...]) to a closed SVG path segment.
function ringToPathSegment(ring, frame) {
  const pts = ring.map(([lat, lng]) => {
    const { x, y } = projectToPixel(lat, lng, frame)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })
  return `M ${pts.join(' L ')} Z`
}

// Converts a polygon's latlngs to an SVG path data string.
// Handles flat, ring-format [outerRing, holes...] and MultiPolygon.
// Concatenates all rings; use fill-rule="evenodd" in SVG to get holes for free.
function polygonFeatureToPathData(latlngs, frame) {
  const isMulti = Array.isArray(latlngs?.[0]?.[0]?.[0])
  if (isMulti) {
    return latlngs
      .flatMap((polygon) => {
        const isRings = Array.isArray(polygon?.[0]?.[0])
        const rings = isRings ? polygon : [polygon]
        return rings.map((ring) => ringToPathSegment(ring, frame))
      })
      .join(' ')
  }
  const isRings = Array.isArray(latlngs?.[0]?.[0])
  if (isRings) {
    return latlngs.map((ring) => ringToPathSegment(ring, frame)).join(' ')
  }
  // Flat format (manually drawn polygon)
  return ringToPathSegment(latlngs, frame)
}

function dashArray(dashStyle) {
  if (dashStyle === 'dashed') return ' stroke-dasharray="8 4"'
  if (dashStyle === 'dotted') return ' stroke-dasharray="2 4"'
  return ''
}

function wrapSVG(layerName, layerId, width, height, elements) {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `  <title>${escapeXML(layerName)}</title>`,
    `  <g id="layer-${escapeXML(layerId ?? 'layer')}" data-name="${escapeXML(layerName)}">`,
    ...elements,
    `  </g>`,
    `</svg>`,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Public builders — all accept (layer, bounds, width, height)
// ---------------------------------------------------------------------------

export function buildPointLayerSVG(layer, bounds, width = 800, height = 600) {
  if (!layer || layer.geometryType !== 'point') return null

  const frame = { bounds, width, height }
  const features = Array.isArray(layer.features) ? layer.features : []
  const style = layer.style || {}

  const fillColor = style.fillColor ?? layer.color ?? '#d4335b'
  const fillOpacity = style.fillOpacity ?? 0.9
  const strokeColor = style.strokeColor ?? fillColor
  const strokeWidth = style.strokeWidth ?? 2
  const strokeOpacity = style.strokeOpacity ?? 1
  const size = style.size != null ? Number(style.size) : (style.radius != null ? Number(style.radius) * 2 : 14)
  const r = size / 2

  const elements = features
    .filter((f) => Array.isArray(f.coordinates) && f.coordinates.length >= 2)
    .map((f) => {
      const [lat, lng] = f.coordinates
      const { x, y } = projectToPixel(lat, lng, frame)
      const title = typeof f.label === 'string' && f.label ? `\n    <title>${escapeXML(f.label)}</title>` : ''
      return `  <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r}" fill="${escapeXML(fillColor)}" fill-opacity="${fillOpacity}" stroke="${escapeXML(strokeColor)}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}">${title}</circle>`
    })

  const layerName = typeof layer.name === 'string' ? layer.name : 'Capa'
  return wrapSVG(layerName, layer.id, width, height, elements)
}

export function buildLineLayerSVG(layer, bounds, width = 800, height = 600) {
  if (!layer || layer.geometryType !== 'line') return null

  const frame = { bounds, width, height }
  const features = Array.isArray(layer.features) ? layer.features : []
  const style = layer.style || {}

  const stroke = style.color ?? layer.color ?? '#ea8b1f'
  const strokeWidth = style.width ?? 3
  const strokeOpacity = style.opacity ?? 1
  const dash = dashArray(style.dashStyle)

  const elements = features
    .filter((f) => Array.isArray(f.latlngs) && f.latlngs.length >= 2)
    .map((f) => {
      const d = lineFeatureToPathData(f.latlngs, frame)
      if (!d) return null
      return `  <path d="${d}" fill="none" stroke="${escapeXML(stroke)}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`
    })
    .filter(Boolean)

  const layerName = typeof layer.name === 'string' ? layer.name : 'Capa'
  return wrapSVG(layerName, layer.id, width, height, elements)
}

export function buildPolygonLayerSVG(layer, bounds, width = 800, height = 600) {
  if (!layer || layer.geometryType !== 'polygon') return null

  const frame = { bounds, width, height }
  const features = Array.isArray(layer.features) ? layer.features : []
  const style = layer.style || {}

  const fill = style.fillColor ?? layer.color ?? '#2f7de1'
  const fillOpacity = style.fillOpacity ?? 0.18
  const stroke = style.strokeColor ?? layer.color ?? '#2f7de1'
  const strokeWidth = style.strokeWidth ?? 2
  const strokeOpacity = style.strokeOpacity ?? 1
  const dash = dashArray(style.dashStyle)

  const elements = features
    .filter((f) => Array.isArray(f.latlngs) && f.latlngs.length > 0)
    .map((f) => {
      const d = polygonFeatureToPathData(f.latlngs, frame)
      if (!d) return null
      return `  <path d="${d}" fill="${escapeXML(fill)}" fill-opacity="${fillOpacity}" fill-rule="evenodd" stroke="${escapeXML(stroke)}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" stroke-linejoin="round"${dash}/>`
    })
    .filter(Boolean)

  const layerName = typeof layer.name === 'string' ? layer.name : 'Capa'
  return wrapSVG(layerName, layer.id, width, height, elements)
}

// Unified dispatcher — delegates to the right builder based on geometry type.
export function buildLayerSVG(layer, bounds, width = 800, height = 600) {
  if (layer?.geometryType === 'point') return buildPointLayerSVG(layer, bounds, width, height)
  if (layer?.geometryType === 'line') return buildLineLayerSVG(layer, bounds, width, height)
  if (layer?.geometryType === 'polygon') return buildPolygonLayerSVG(layer, bounds, width, height)
  return null
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
