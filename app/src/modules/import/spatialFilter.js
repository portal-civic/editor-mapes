import { booleanIntersects, bboxPolygon } from '@turf/turf'

/**
 * Creates a Turf GeoJSON Feature polygon from Leaflet map bounds.
 * `mapBounds` is a Leaflet LatLngBounds instance.
 */
export function getImportAreaFromViewport(mapBounds) {
  const sw = mapBounds.getSouthWest()
  const ne = mapBounds.getNorthEast()
  // bboxPolygon expects [west, south, east, north]
  return bboxPolygon([sw.lng, sw.lat, ne.lng, ne.lat])
}

/**
 * Wraps a GeoJSON Polygon/MultiPolygon geometry in a Feature for use as a filter area.
 */
export function getImportAreaFromGeoJSONGeometry(geometry) {
  return { type: 'Feature', geometry, properties: {} }
}

/**
 * Filters an array of GeoJSON Features to those that spatially intersect `areaFeature`.
 * Phase 1: intersection only — no geometry clipping.
 */
export function filterFeaturesByArea(features, areaFeature) {
  if (!areaFeature) return features
  return features.filter((feature) => {
    if (!feature?.geometry) return false
    try {
      return booleanIntersects(feature, areaFeature)
    } catch {
      return false
    }
  })
}
