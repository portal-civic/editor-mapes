/**
 * visibleCategories.js
 *
 * Unified legend category filter.
 *
 * Both "viewport" and "polygon" modes share the same core loop:
 *   for each categorical layer → for each feature → booleanIntersects(feature, refGeom)
 *
 * The only difference is how the reference geometry is built:
 *   - viewport  → a single rectangular Polygon from the map bbox
 *   - polygon   → one or more Polygon/MultiPolygon features from a reference layer
 */

import * as turf from '@turf/turf'
import { getDatasetFeatures } from '../sources/sourceStore'

// ── Low-level geometry helpers ────────────────────────────────────────────────

function bboxOverlap(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]
}

function safeBbox(turfFeature) {
  try { return turf.bbox(turfFeature) } catch { return null }
}

/** Returns true if the two features intersect. Falls back to true on error. */
function safeIntersects(a, b) {
  try { return turf.booleanIntersects(a, b) } catch { return true }
}

/** Convert viewport [W, S, E, N] to a Turf Feature<Polygon>. */
function viewportToTurfFeature([W, S, E, N]) {
  return turf.bboxPolygon([W, S, E, N])
}

/**
 * Convert Leaflet latlngs ([[lat,lng],...]) to a GeoJSON Polygon geometry.
 * Handles nested formats (with holes) by flattening first.
 */
function leafletLatlngsToPolygon(latlngs) {
  const flat = latlngs.flat(Infinity)
  const coords = []
  for (let i = 0; i + 1 < flat.length; i += 2) {
    coords.push([flat[i + 1], flat[i]]) // [lat,lng] → [lng,lat]
  }
  if (coords.length < 3) return null
  if (
    coords[0][0] !== coords[coords.length - 1][0] ||
    coords[0][1] !== coords[coords.length - 1][1]
  ) {
    coords.push([coords[0][0], coords[0][1]])
  }
  return { type: 'Polygon', coordinates: [coords] }
}

// ── Reference geometry builders ───────────────────────────────────────────────

/**
 * Build an array of Turf Feature objects from a reference polygon layer.
 * Handles both source layers (GeoJSON) and drawn vector layers (Leaflet latlngs).
 */
export function buildRefTurfFeatures(refLayer, featureIndex = null) {
  if (!refLayer) return []

  // Source layer — GeoJSON features from the dataset store
  if (refLayer.type === 'source' && refLayer.datasetId) {
    const all = getDatasetFeatures(refLayer.datasetId)
    const subset = featureIndex != null ? [all[featureIndex]].filter(Boolean) : all
    return subset.filter((f) => f?.geometry).map((f) => turf.feature(f.geometry))
  }

  // Drawn vector polygon layer — Leaflet latlngs format
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

// ── Core per-layer filter ─────────────────────────────────────────────────────

/**
 * Given a single categorical layer and a set of reference Turf features,
 * return the Set of category value strings that have at least one feature
 * intersecting at least one reference geometry.
 *
 * @returns {{ visibleValues: Set<string>, featuresChecked: number }}
 */
function filterLayerByGeometries(layer, refFeatures, refBboxes, unionBbox) {
  const field = layer.categorical?.field
  if (!field || !layer.datasetId) return { visibleValues: new Set(), featuresChecked: 0 }

  const features = getDatasetFeatures(layer.datasetId)
  const visibleValues = new Set()

  // All known category values — enables early exit once all are found
  const remaining = new Set(
    (layer.categorical?.categories ?? []).map((c) => String(c.value)),
  )

  let featuresChecked = 0

  for (const feat of features) {
    if (remaining.size === 0) break

    const rawVal = feat.properties?.[field]
    if (rawVal == null) continue
    const valStr = String(rawVal)
    if (!remaining.has(valStr)) continue

    const geom = feat.geometry
    if (!geom) continue

    featuresChecked++

    const turfFeat = turf.feature(geom)
    const featBbox = safeBbox(turfFeat)
    if (!featBbox || !bboxOverlap(featBbox, unionBbox)) continue

    // Check against each reference geometry
    for (let ri = 0; ri < refFeatures.length; ri++) {
      if (!bboxOverlap(featBbox, refBboxes[ri])) continue
      if (safeIntersects(turfFeat, refFeatures[ri])) {
        visibleValues.add(valStr)
        remaining.delete(valStr)
        break
      }
    }
  }

  return { visibleValues, featuresChecked }
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Compute { [layerId]: Set<string> } of visible category values
 * for all categorical layers, using geometric intersection.
 *
 * @param {Array}  layers  — full layers array from App state
 * @param {'viewport'|'polygon'} mode
 * @param {Object} options
 *   - viewport:    [W, S, E, N]  — required when mode === 'viewport'
 *   - refLayer:    layer object  — required when mode === 'polygon'
 *   - featureIndex: number|null  — optional, selects a single polygon from refLayer
 *
 * @returns {{ [layerId: string]: Set<string> } | null}
 *   null means "no filter active — show all categories"
 */
export function computeVisibleValuesByLayerId(layers, mode, options = {}) {
  // Build reference geometries from the chosen mode
  let refFeatures

  if (mode === 'viewport') {
    if (!options.viewport) return null
    refFeatures = [viewportToTurfFeature(options.viewport)]
  } else if (mode === 'polygon') {
    refFeatures = buildRefTurfFeatures(options.refLayer, options.featureIndex ?? null)
    if (!refFeatures.length) return null
  } else {
    return null
  }

  // Pre-compute bboxes once for all reference geometries
  const refBboxes = refFeatures.map(safeBbox)
  const validPairs = refFeatures
    .map((f, i) => (refBboxes[i] ? { f, b: refBboxes[i] } : null))
    .filter(Boolean)

  if (!validPairs.length) return null

  const validRefFeatures = validPairs.map((p) => p.f)
  const validRefBboxes = validPairs.map((p) => p.b)

  // Union bbox of all reference geometries (first coarse pass)
  const unionBbox = validRefBboxes.reduce(
    (u, b) => [
      Math.min(u[0], b[0]),
      Math.min(u[1], b[1]),
      Math.max(u[2], b[2]),
      Math.max(u[3], b[3]),
    ],
    [Infinity, Infinity, -Infinity, -Infinity],
  )

  const result = {}
  let totalFeaturesChecked = 0

  for (const layer of layers) {
    if (!layer.visible || layer.styleMode !== 'categorical') continue
    if (!layer.categorical?.field || !layer.datasetId) continue

    const { visibleValues, featuresChecked } = filterLayerByGeometries(
      layer,
      validRefFeatures,
      validRefBboxes,
      unionBbox,
    )

    result[layer.id] = visibleValues
    totalFeaturesChecked += featuresChecked
  }

  if (import.meta.env.DEV) {
    const layerSummary = Object.fromEntries(
      Object.entries(result).map(([id, s]) => [id, s.size]),
    )
    // eslint-disable-next-line no-console
    console.debug(
      `[visibleCategories] mode=${mode}` +
        (mode === 'polygon'
          ? ` refLayer="${options.refLayer?.id}" featureIndex=${options.featureIndex ?? 'all'}`
          : '') +
        ` | features_checked=${totalFeaturesChecked}` +
        ` | categories_per_layer: ${JSON.stringify(layerSummary)}`,
    )
  }

  return result
}

// ── UI helper (moved from polygonFilter.js) ───────────────────────────────────

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
