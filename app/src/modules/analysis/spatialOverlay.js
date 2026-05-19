/**
 * spatialOverlay.js
 *
 * Core spatial analysis: intersect layer A (reference) with layer B (analysis).
 * Handles both source layers (GeoJSON from sourceStore) and drawn vector layers
 * (Leaflet latlngs format).
 */

import * as turf from '@turf/turf'
import { getDatasetFeatures } from '../sources/sourceStore'

// ── Geometry converters ───────────────────────────────────────────────────────

function closeRing(ring) {
  if (ring.length < 2) return ring
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push([...ring[0]])
  }
  return ring
}

function drawnFeatureToGeom(feature, geometryType) {
  if (geometryType === 'point') {
    const [lat, lng] = feature.coordinates ?? []
    if (!isFinite(lat) || !isFinite(lng)) return null
    return { type: 'Point', coordinates: [lng, lat] }
  }

  if (geometryType === 'line') {
    const lls = feature.latlngs
    if (!Array.isArray(lls) || lls.length < 2) return null
    return { type: 'LineString', coordinates: lls.map(([lat, lng]) => [lng, lat]) }
  }

  if (geometryType === 'polygon') {
    const lls = feature.latlngs
    if (!Array.isArray(lls) || lls.length === 0) return null

    const isMulti = Array.isArray(lls[0]?.[0]?.[0])
    if (isMulti) {
      const polys = lls
        .map((poly) => {
          const outer = poly[0]
          if (!Array.isArray(outer) || outer.length < 3) return null
          return [closeRing(outer.map(([lat, lng]) => [lng, lat]))]
        })
        .filter(Boolean)
      return polys.length > 0 ? { type: 'MultiPolygon', coordinates: polys } : null
    }

    const isRing = Array.isArray(lls[0]?.[0])
    const flat = isRing ? lls[0] : lls
    if (flat.length < 3) return null
    return { type: 'Polygon', coordinates: [closeRing(flat.map(([lat, lng]) => [lng, lat]))] }
  }

  return null
}

// ── Feature extractor ─────────────────────────────────────────────────────────

/**
 * Convert a layer to an array of { turfFeat, properties, bbox }.
 * Works for both source layers and drawn vector layers.
 */
export function getLayerTurfFeatures(layer) {
  if (!layer) return []

  if (layer.type === 'source' && layer.datasetId) {
    return getDatasetFeatures(layer.datasetId)
      .map((f) => {
        if (!f?.geometry) return null
        try {
          const tf = turf.feature(f.geometry, f.properties ?? {})
          return { turfFeat: tf, properties: f.properties ?? {} }
        } catch { return null }
      })
      .filter(Boolean)
  }

  return (layer.features ?? []).flatMap((feat) => {
    const geom = drawnFeatureToGeom(feat, layer.geometryType)
    if (!geom) return []
    try {
      return [{ turfFeat: turf.feature(geom, {}), properties: feat }]
    } catch { return [] }
  })
}

// ── Spatial helpers ───────────────────────────────────────────────────────────

function safeBbox(tf) {
  try { return turf.bbox(tf) } catch { return null }
}

function bboxOverlap(a, b) {
  if (!a || !b) return true
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]
}

function safeIntersects(a, b) {
  try { return turf.booleanIntersects(a, b) } catch { return true }
}

function safeIntersect(a, b) {
  try { return turf.intersect(turf.featureCollection([a, b])) ?? null } catch { return null }
}

function safeArea(feat) {
  if (!feat) return 0
  try { const m2 = turf.area(feat); return isFinite(m2) ? m2 : 0 } catch { return 0 }
}

// ── Operations ────────────────────────────────────────────────────────────────

export const OPERATIONS = [
  { id: 'count', label: 'Comptar elements afectats' },
  { id: 'area',  label: 'Calcular superfície afectada' },
  { id: 'category', label: 'Resum per categoria' },
]

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * @param {Object} params
 * @param {Object}  params.layerA            reference / risk zone (polygon)
 * @param {Object}  params.layerB            layer to analyse
 * @param {string}  params.operation         'count' | 'area' | 'category'
 * @param {string|null} params.categoryField field from B to group by
 * @param {boolean} params.createIntersectionGeoms collect intersection geometries
 *
 * @returns {{ error } | { warning, proceed } | result-object }
 */
export function runSpatialOverlay({
  layerA,
  layerB,
  operation,
  categoryField,
  createIntersectionGeoms = false,
}) {
  const featuresA = getLayerTurfFeatures(layerA)
  const featuresB = getLayerTurfFeatures(layerB)

  if (featuresA.length === 0) return { error: "La capa A no té geometries vàlides" }
  if (featuresB.length === 0) return { error: "La capa B no té geometries vàlides" }

  const computeArea = (operation === 'area' || operation === 'category') &&
                      layerB.geometryType === 'polygon'

  // Pre-compute bboxes for A and build union bbox
  const aItems = featuresA.map((item) => ({ ...item, bbox: safeBbox(item.turfFeat) }))
  const validABboxes = aItems.map((i) => i.bbox).filter(Boolean)
  if (validABboxes.length === 0) return { error: "La capa A no té geometries amb bbox vàlida" }

  const unionBboxA = validABboxes.reduce(
    (u, b) => [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])],
    [Infinity, Infinity, -Infinity, -Infinity],
  )

  const catMap = new Map()     // catKey → { count, areaM2 }
  let affectedCount = 0
  let totalAreaM2 = 0
  const intersectionGeoms = []

  for (const itemB of featuresB) {
    const bboxB = safeBbox(itemB.turfFeat)
    if (bboxB && !bboxOverlap(bboxB, unionBboxA)) continue

    let affected = false
    let featureAreaM2 = 0

    for (let ai = 0; ai < aItems.length; ai++) {
      const aItem = aItems[ai]
      if (bboxB && aItem.bbox && !bboxOverlap(bboxB, aItem.bbox)) continue
      if (!safeIntersects(itemB.turfFeat, aItem.turfFeat)) continue

      if (!affected && !computeArea && createIntersectionGeoms) {
        // Count mode: save the B feature itself (first intersection only)
        intersectionGeoms.push(itemB.turfFeat)
      }

      affected = true

      if (computeArea) {
        const inter = safeIntersect(itemB.turfFeat, aItem.turfFeat)
        const m2 = safeArea(inter)
        if (m2 > 0) {
          featureAreaM2 += m2
          if (createIntersectionGeoms && inter) intersectionGeoms.push(inter)
        }
      } else {
        break // count mode: no need to check more A features
      }
    }

    if (affected) {
      affectedCount++
      totalAreaM2 += featureAreaM2

      if (categoryField) {
        const rawVal = itemB.properties?.[categoryField]
        const catKey = rawVal == null ? '(sense valor)' : String(rawVal)
        const entry = catMap.get(catKey) ?? { count: 0, areaM2: 0 }
        entry.count++
        entry.areaM2 += featureAreaM2
        catMap.set(catKey, entry)
      }
    }
  }

  return {
    totalA: featuresA.length,
    totalB: featuresB.length,
    affectedCount,
    affectedPct: featuresB.length > 0 ? (affectedCount / featuresB.length) * 100 : 0,
    totalAreaM2: computeArea ? totalAreaM2 : null,
    categoryRows: categoryField
      ? [...catMap.entries()]
          .map(([catVal, { count, areaM2 }]) => ({ catVal, count, areaM2 }))
          .sort((a, b) => b.count - a.count)
      : null,
    intersectionGeoms: createIntersectionGeoms ? intersectionGeoms : null,
    operation,
    isPolygonB: layerB.geometryType === 'polygon',
    layerAName: layerA.name,
    layerBName: layerB.name,
  }
}

// ── Export helpers ────────────────────────────────────────────────────────────

export function resultsToCSV(results) {
  const hasArea = results.totalAreaM2 != null
  const rows = []

  if (results.categoryRows?.length > 0) {
    const headers = ['Categoria', 'Elements afectats', '%']
    if (hasArea) headers.push('Superfície (m²)')
    rows.push(headers.join(','))

    for (const row of results.categoryRows) {
      const pct = results.affectedCount > 0
        ? ((row.count / results.affectedCount) * 100).toFixed(1)
        : '0.0'
      const cols = [`"${row.catVal}"`, row.count, `${pct}%`]
      if (hasArea) cols.push(row.areaM2.toFixed(2))
      rows.push(cols.join(','))
    }
  } else {
    rows.push('Mètrica,Valor')
    rows.push(`"Capa A (referència)","${results.layerAName}"`)
    rows.push(`"Capa B (anàlisi)","${results.layerBName}"`)
    rows.push(`"Total elements B",${results.totalB}`)
    rows.push(`"Elements afectats",${results.affectedCount}`)
    rows.push(`"Percentatge afectat","${results.affectedPct.toFixed(1)}%"`)
    if (hasArea) rows.push(`"Superfície total afectada (m²)",${results.totalAreaM2.toFixed(2)}`)
  }

  return rows.join('\n')
}
