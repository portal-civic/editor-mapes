/**
 * normalizeGeometries.js
 *
 * Fixes common issues with Polygon geometries before storing features:
 *
 *  1. Multiple exterior rings encoded as a single Polygon
 *     → converted to MultiPolygon
 *
 *  2. Exterior ring not listed first
 *     → rings reordered so the largest exterior is coords[0]
 *
 *  3. Winding order wrong (exterior CW instead of CCW, or holes CCW)
 *     → fixed by turf.rewind
 *
 * The algorithm:
 *   - Sort all rings by absolute area descending (largest = most likely exterior)
 *   - For each ring (largest first): check if its interior point falls inside
 *     any ring already classified as exterior → if yes, it's a hole of that ring;
 *     if no, it's a new exterior ring
 *   - If multiple exterior rings → MultiPolygon
 *   - Apply turf.rewind to enforce RFC 7946 winding (exterior CCW, holes CW)
 */

import * as turf from '@turf/turf'

// ── Low-level ring helpers ────────────────────────────────────────────────────

/** Shoelace signed area. Positive = CCW, negative = CW (in standard coords). */
function ringSignedArea(ring) {
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }
  return a / 2
}

/** Ray-casting point-in-ring test (no Turf dependency, O(n)). */
function pointInRing(px, py, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Return a representative interior point for a ring.
 * Uses turf.pointOnFeature for reliability; falls back to first coordinate.
 */
function ringInteriorPoint(ring) {
  try {
    const poly = turf.polygon([ring])
    const pt = turf.pointOnFeature(poly)
    return pt.geometry.coordinates
  } catch {
    return ring[0]
  }
}

// ── Core normalizer ───────────────────────────────────────────────────────────

/**
 * Normalize a single GeoJSON Feature.
 * Only acts on Polygon/MultiPolygon; all other types pass through unchanged.
 *
 * @returns {{ feature: Feature, changed: boolean, reason: string|null }}
 */
export function normalizePolygonFeature(feature) {
  if (!feature?.geometry) return { feature, changed: false, reason: null }

  const { type, coordinates } = feature.geometry

  // ── MultiPolygon: rewind each sub-polygon, nothing structural to fix here ──
  if (type === 'MultiPolygon') {
    try {
      const rewound = turf.rewind(feature, { mutate: false })
      return { feature: rewound, changed: false, reason: null }
    } catch {
      return { feature, changed: false, reason: null }
    }
  }

  if (type !== 'Polygon') return { feature, changed: false, reason: null }

  const rings = coordinates

  // Single ring: just rewind and return
  if (rings.length <= 1) {
    try {
      const rewound = turf.rewind(feature, { mutate: false })
      return { feature: rewound, changed: false, reason: null }
    } catch {
      return { feature, changed: false, reason: null }
    }
  }

  // ── Multiple rings: build containment hierarchy ───────────────────────────

  const infos = rings
    .map((ring, idx) => ({
      ring,
      idx,
      absArea: Math.abs(ringSignedArea(ring)),
    }))
    .sort((a, b) => b.absArea - a.absArea) // largest first

  // exteriors: [{ ring, holes: [] }]
  const exteriors = []

  for (const info of infos) {
    const ip = ringInteriorPoint(info.ring)
    let placed = false

    for (const ext of exteriors) {
      if (pointInRing(ip[0], ip[1], ext.ring)) {
        ext.holes.push(info.ring)
        placed = true
        break
      }
    }

    if (!placed) {
      exteriors.push({ ring: info.ring, holes: [] })
    }
  }

  // ── Rebuild geometry ──────────────────────────────────────────────────────

  let newFeature
  let reason

  if (exteriors.length === 1) {
    // Still a Polygon — but rings may have been reordered
    const reordered = exteriors[0].ring !== rings[0]
    const newCoords = [exteriors[0].ring, ...exteriors[0].holes]
    newFeature = { ...feature, geometry: { type: 'Polygon', coordinates: newCoords } }
    reason = reordered ? 'polygon rings reordered' : null
  } else {
    // Multiple exterior rings → MultiPolygon
    const multiCoords = exteriors.map((ext) => [ext.ring, ...ext.holes])
    newFeature = { ...feature, geometry: { type: 'MultiPolygon', coordinates: multiCoords } }
    reason = `polygon converted to multipolygon (${exteriors.length} exterior rings)`
  }

  // Apply RFC 7946 winding order
  try {
    const rewound = turf.rewind(newFeature, { mutate: false })
    return { feature: rewound, changed: reason !== null, reason }
  } catch {
    return { feature: newFeature, changed: reason !== null, reason }
  }
}

// ── Batch normalizer ──────────────────────────────────────────────────────────

/**
 * Normalize an array of GeoJSON features.
 * Returns a new array (originals are not mutated).
 */
export function normalizeFeatureGeometries(features) {
  const DEV = import.meta.env.DEV
  let polygonCount = 0
  let convertedCount = 0
  let reorderedCount = 0

  const result = features.map((feature) => {
    const type = feature?.geometry?.type
    if (type !== 'Polygon' && type !== 'MultiPolygon') return feature

    const { feature: normalized, changed, reason } = normalizePolygonFeature(feature)

    if (DEV && reason) {
      if (reason.includes('multipolygon')) convertedCount++
      else if (reason.includes('reordered')) reorderedCount++
      polygonCount++
    }

    return normalized
  })

  if (DEV && (convertedCount > 0 || reorderedCount > 0)) {
    console.debug(
      `[normalizeGeometries] ${features.length} features processed:` +
        (convertedCount ? ` ${convertedCount} polygon→multipolygon` : '') +
        (reorderedCount ? ` ${reorderedCount} rings reordered` : ''),
    )
  }

  return result
}
