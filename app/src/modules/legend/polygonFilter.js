import * as turf from '@turf/turf'
import { getDatasetFeatures } from '../sources/sourceStore'

// ── Low-level helpers ─────────────────────────────────────────────────────────

function bboxOverlap(a, b) {
  // a, b: [minX, minY, maxX, maxY]  (Turf bbox format)
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]
}

/**
 * Convert Leaflet latlngs ([[lat,lng],...]) to a GeoJSON Polygon geometry.
 * Handles nested formats like [[[lat,lng],...]] by flattening.
 */
function leafletLatlngsToPolygon(latlngs) {
  // Flatten all numbers (handles [[lat,lng],...] and [[[lat,lng],...]] alike)
  const flat = latlngs.flat(Infinity)
  const coords = []
  for (let i = 0; i + 1 < flat.length; i += 2) {
    coords.push([flat[i + 1], flat[i]]) // Leaflet [lat,lng] → GeoJSON [lng,lat]
  }
  if (coords.length < 3) return null
  // Close ring if needed
  if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
    coords.push([coords[0][0], coords[0][1]])
  }
  return { type: 'Polygon', coordinates: [coords] }
}

/**
 * Build an array of Turf Feature objects for the reference layer.
 * Source layers supply GeoJSON directly; vector layers are converted from latlngs.
 */
function buildRefFeatures(refLayer, featureIndex) {
  if (!refLayer) return []

  // ── Source layer (GeoJSON features from dataset store) ────────────────────
  if (refLayer.type === 'source' && refLayer.datasetId) {
    const all = getDatasetFeatures(refLayer.datasetId)
    const subset = featureIndex != null ? [all[featureIndex]].filter(Boolean) : all
    return subset
      .filter((f) => f?.geometry)
      .map((f) => turf.feature(f.geometry))
  }

  // ── Vector polygon layer (Leaflet latlngs format) ─────────────────────────
  if (refLayer.geometryType === 'polygon' && Array.isArray(refLayer.features)) {
    const subset =
      featureIndex != null
        ? [refLayer.features[featureIndex]].filter(Boolean)
        : refLayer.features
    return subset.flatMap((f) => {
      if (!Array.isArray(f.latlngs) || f.latlngs.length < 3) return []
      const geom = leafletLatlngsToPolygon(f.latlngs)
      return geom ? [turf.feature(geom)] : []
    })
  }

  return []
}

/**
 * Safe turf.bbox wrapper — returns null on failure.
 */
function safeBbox(turfFeature) {
  try {
    return turf.bbox(turfFeature)
  } catch {
    return null
  }
}

/**
 * Safe turf.booleanIntersects wrapper — falls back to true (include) on error
 * so malformed geometries don't silently hide categories.
 */
function safeIntersects(a, b) {
  try {
    return turf.booleanIntersects(a, b)
  } catch {
    return true
  }
}

// ── Main export: polygon-based legend filter ──────────────────────────────────

/**
 * For each categorical layer visible in `layers`, return the Set of category
 * value strings that have at least one feature geometrically intersecting the
 * reference polygon(s) from `refLayer`.
 *
 * Uses Turf.booleanIntersects for real geometric intersection — works with
 * partial overlaps, MultiPolygon, LineString, Point, etc.
 *
 * @param {Array}        layers       — full layers array from App state
 * @param {Object}       refLayer     — the reference polygon layer object
 * @param {number|null}  featureIndex — if set, only use that feature from refLayer
 * @returns {{ [layerId: string]: Set<string> } | null}
 */
export function computeVisibleValuesByPolygon(layers, refLayer, featureIndex = null) {
  const refFeatures = buildRefFeatures(refLayer, featureIndex)
  if (!refFeatures.length) return null

  // Pre-compute bboxes for all reference features (reused for every checked feature)
  const refBboxes = refFeatures.map(safeBbox).filter(Boolean)
  if (!refBboxes.length) return null

  // Union bbox of all ref features — first coarse pass
  const unionBbox = refBboxes.reduce(
    (u, b) => [
      Math.min(u[0], b[0]),
      Math.min(u[1], b[1]),
      Math.max(u[2], b[2]),
      Math.max(u[3], b[3]),
    ],
    [Infinity, Infinity, -Infinity, -Infinity],
  )

  const result = {}

  // DEV debug counters
  let _dbgChecked = 0
  let _dbgPassed = 0

  for (const layer of layers) {
    if (!layer.visible || layer.styleMode !== 'categorical') continue
    const field = layer.categorical?.field
    if (!field || !layer.datasetId) continue

    const features = getDatasetFeatures(layer.datasetId)
    const visibleValues = new Set()

    // Set of values still to find — enables early exit once all categories matched
    const remaining = new Set(
      (layer.categorical?.categories ?? []).map((c) => String(c.value)),
    )

    for (const feat of features) {
      if (remaining.size === 0) break // all categories already found

      const rawVal = feat.properties?.[field]
      if (rawVal == null) continue
      const valStr = String(rawVal)

      if (!remaining.has(valStr)) continue // not a known (or already-found) category

      const geom = feat.geometry
      if (!geom) continue

      if (import.meta.env.DEV) _dbgChecked++

      // ── Coarse pass: feature bbox vs union ref bbox ──────────────────────
      const turfFeat = turf.feature(geom)
      const featBbox = safeBbox(turfFeat)
      if (!featBbox || !bboxOverlap(featBbox, unionBbox)) continue

      // ── Fine pass: booleanIntersects with each ref feature ───────────────
      let intersects = false
      for (let ri = 0; ri < refFeatures.length; ri++) {
        // Per-ref bbox check before the expensive intersects call
        if (!bboxOverlap(featBbox, refBboxes[ri])) continue
        if (safeIntersects(turfFeat, refFeatures[ri])) {
          intersects = true
          break
        }
      }

      if (intersects) {
        visibleValues.add(valStr)
        remaining.delete(valStr)
        if (import.meta.env.DEV) _dbgPassed++
      }
    }

    result[layer.id] = visibleValues
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(
      `[polygonFilter] refLayer="${refLayer?.id}" featureIndex=${featureIndex}` +
        ` | features_checked=${_dbgChecked} categories_found=${_dbgPassed}` +
        ` | layers: ${JSON.stringify(
          Object.fromEntries(Object.entries(result).map(([id, s]) => [id, s.size])),
        )}`,
    )
  }

  return result
}

// ── UI helper: feature list for the reference polygon picker ──────────────────

/**
 * Extract the list of polygon features from a reference layer for the UI picker.
 * Returns [{ index, label }]
 */
export function getRefLayerFeatureList(refLayer) {
  if (!refLayer) return []

  if (refLayer.type === 'source' && refLayer.datasetId) {
    const features = getDatasetFeatures(refLayer.datasetId)
    return features.map((f, i) => {
      const nameField = Object.keys(f.properties ?? {}).find((k) =>
        /nom|name|nombre|nom_/i.test(k),
      )
      const label = nameField ? String(f.properties[nameField]) : `Polígon ${i + 1}`
      return { index: i, label }
    })
  }

  if (refLayer.geometryType === 'polygon' && Array.isArray(refLayer.features)) {
    return refLayer.features.map((f, i) => ({
      index: i,
      label: f.name || `Polígon ${i + 1}`,
    }))
  }

  return []
}
