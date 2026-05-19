/**
 * measurements.js
 *
 * Geometry measurement utilities using Turf.js.
 * Works with any GeoJSON Feature or plain geometry object.
 */

import * as turf from '@turf/turf'

// ── Core measurement ──────────────────────────────────────────────────────────

/**
 * Measure a GeoJSON feature.
 * Returns a result object based on geometry type, or null if unmeasurable.
 *
 * @returns
 *   { kind: 'area',   m2: number }            — Polygon / MultiPolygon
 *   { kind: 'length', km: number }            — LineString / MultiLineString
 *   { kind: 'point',  lat: number, lng: number } — Point
 *   null                                      — unknown / no geometry
 */
/**
 * Convert drawn feature (Leaflet latlngs format) to a measurement result.
 *
 * Point features:   feature.coordinates = [lat, lng]
 * Line features:    feature.latlngs = [[lat, lng], ...]
 * Polygon features: feature.latlngs in flat / ring / multi-polygon format
 */
export function measureDrawnFeature(feature, geometryType) {
  if (!feature) return null

  if (geometryType === 'point') {
    const coords = feature.coordinates
    if (!Array.isArray(coords) || coords.length < 2) return null
    const [lat, lng] = coords
    if (!isFinite(lat) || !isFinite(lng)) return null
    return { kind: 'point', lat, lng }
  }

  if (geometryType === 'line') {
    const lls = feature.latlngs
    if (!Array.isArray(lls) || lls.length < 2) return null
    // Always flat [[lat, lng], ...]
    const coords = lls.map(([lat, lng]) => [lng, lat])
    if (coords.length < 2) return null
    try {
      const km = turf.length(turf.lineString(coords), { units: 'kilometers' })
      return { kind: 'length', km: isFinite(km) && km >= 0 ? km : null }
    } catch { return null }
  }

  if (geometryType === 'polygon') {
    const lls = feature.latlngs
    if (!Array.isArray(lls) || lls.length === 0) return null

    // Detect format and collect outer rings as [[lng, lat], ...] arrays
    const rings = []
    const isMulti = Array.isArray(lls[0]?.[0]?.[0])
    if (isMulti) {
      // MultiPolygon: [[[outerRing,...], ...], ...]
      for (const poly of lls) {
        const outer = poly[0]
        if (Array.isArray(outer) && outer.length >= 3) {
          rings.push(outer.map(([lat, lng]) => [lng, lat]))
        }
      }
    } else if (Array.isArray(lls[0]?.[0])) {
      // Ring format: [[outerRing], [hole], ...]
      const outer = lls[0]
      if (outer.length >= 3) rings.push(outer.map(([lat, lng]) => [lng, lat]))
    } else {
      // Flat format: [[lat, lng], ...]
      if (lls.length >= 3) rings.push(lls.map(([lat, lng]) => [lng, lat]))
    }

    if (rings.length === 0) return null

    // Close each ring
    const closedRings = rings.map((ring) => {
      const r = [...ring]
      if (r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1]) r.push([...r[0]])
      return r
    })

    try {
      const geojson = closedRings.length === 1
        ? turf.polygon([closedRings[0]])
        : turf.multiPolygon(closedRings.map((r) => [r]))
      const m2 = turf.area(geojson)
      return { kind: 'area', m2: isFinite(m2) && m2 >= 0 ? m2 : null }
    } catch { return null }
  }

  return null
}

export function measureFeature(feature) {
  const geom = feature?.geometry ?? (feature?.type ? feature : null)
  if (!geom) return null
  const type = geom.type

  if (type === 'Polygon' || type === 'MultiPolygon') {
    try {
      const feat = geom.type === 'Feature' ? geom : turf.feature(geom)
      const m2 = turf.area(feat)
      if (!isFinite(m2) || m2 < 0) return { kind: 'area', m2: null, invalid: true }
      // Heuristic: polygon with coordinates but zero area → likely invalid geometry
      if (m2 === 0) {
        const hasCoords = (geom.coordinates?.flat(Infinity).length ?? 0) > 6
        return { kind: 'area', m2: 0, invalid: hasCoords }
      }
      return { kind: 'area', m2 }
    } catch {
      return { kind: 'area', m2: null, invalid: true }
    }
  }

  if (type === 'LineString' || type === 'MultiLineString') {
    try {
      const feat = geom.type === 'Feature' ? geom : turf.feature(geom)
      const km = turf.length(feat, { units: 'kilometers' })
      return { kind: 'length', km: isFinite(km) && km >= 0 ? km : null }
    } catch {
      return null
    }
  }

  if (type === 'Point') {
    const [lng, lat] = geom.coordinates ?? []
    if (!isFinite(lat) || !isFinite(lng)) return null
    return { kind: 'point', lat, lng }
  }

  if (type === 'MultiPoint') {
    // Return centroid coordinates of the first point
    const first = geom.coordinates?.[0]
    if (!first) return null
    return { kind: 'point', lat: first[1], lng: first[0] }
  }

  return null
}

// ── Formatters ────────────────────────────────────────────────────────────────

/**
 * Format an area in m² to a human-readable string.
 * Returns { primary, secondary } where secondary is an optional conversion.
 */
export function formatArea(m2) {
  if (m2 == null || !isFinite(m2)) return { primary: '—', secondary: null }

  if (m2 >= 1_000_000) {
    return {
      primary: `${(m2 / 1_000_000).toFixed(3)} km²`,
      secondary: `${(m2 / 10_000).toFixed(2)} ha`,
    }
  }
  if (m2 >= 10_000) {
    return {
      primary: `${(m2 / 10_000).toFixed(4)} ha`,
      secondary: `${Math.round(m2).toLocaleString('ca')} m²`,
    }
  }
  return {
    primary: `${Math.round(m2).toLocaleString('ca')} m²`,
    secondary: null,
  }
}

/**
 * Format a length in km to a human-readable string.
 * Returns { primary, secondary }
 */
export function formatLength(km) {
  if (km == null || !isFinite(km)) return { primary: '—', secondary: null }

  const m = km * 1000
  if (km >= 1) {
    return {
      primary: `${km.toFixed(3)} km`,
      secondary: m >= 10 ? `${Math.round(m).toLocaleString('ca')} m` : null,
    }
  }
  return {
    primary: `${Math.round(m).toLocaleString('ca')} m`,
    secondary: null,
  }
}

/**
 * Format a measurement result to { primary, secondary, copyText } strings,
 * or null if the measurement is null.
 */
export function formatMeasurement(measurement) {
  if (!measurement) return null

  if (measurement.kind === 'area') {
    if (measurement.invalid) {
      return { primary: null, secondary: null, copyText: null, invalid: true }
    }
    if (measurement.m2 == null) return null
    const fmt = formatArea(measurement.m2)
    return { ...fmt, copyText: fmt.primary, invalid: false }
  }

  if (measurement.kind === 'length' && measurement.km != null) {
    const fmt = formatLength(measurement.km)
    return { ...fmt, copyText: fmt.primary, invalid: false }
  }

  if (measurement.kind === 'point') {
    const text = `${measurement.lat.toFixed(6)}, ${measurement.lng.toFixed(6)}`
    return { primary: text, secondary: null, copyText: text, invalid: false }
  }

  return null
}
