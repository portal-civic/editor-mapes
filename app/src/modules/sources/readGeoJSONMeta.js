import { normalizeFeatureGeometries } from '../geometry/normalizeGeometries'

const VALID_GEOMETRY_TYPES = new Set([
  'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon',
])

function visitCoords(geom, callback) {
  const { type, coordinates } = geom
  if (!coordinates) return

  if (type === 'Point') {
    callback(coordinates[0], coordinates[1])
  } else if (type === 'MultiPoint' || type === 'LineString') {
    for (const c of coordinates) callback(c[0], c[1])
  } else if (type === 'MultiLineString' || type === 'Polygon') {
    for (const ring of coordinates) for (const c of ring) callback(c[0], c[1])
  } else if (type === 'MultiPolygon') {
    for (const poly of coordinates)
      for (const ring of poly)
        for (const c of ring) callback(c[0], c[1])
  }
}

/**
 * Returns { featureCount, bbox, fields, geometryType, rawFeatures } or null.
 * rawFeatures is the original array reference — do not mutate it.
 */
export function readGeoJSONMeta(parsedData) {
  if (!parsedData || typeof parsedData !== 'object') return null

  let features = []

  if (parsedData.type === 'FeatureCollection' && Array.isArray(parsedData.features)) {
    features = parsedData.features
  } else if (parsedData.type === 'Feature') {
    features = [parsedData]
  } else if (VALID_GEOMETRY_TYPES.has(parsedData.type)) {
    features = [{ type: 'Feature', geometry: parsedData, properties: {} }]
  } else {
    return null
  }

  if (features.length === 0) return null

  // Normalize polygon geometries: fix ring ordering, detect multi-exterior polygons
  const normalizedFeatures = normalizeFeatureGeometries(features)

  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
  const fields = new Set()
  const geomTypes = new Set()

  for (const f of normalizedFeatures) {
    if (f.properties && typeof f.properties === 'object') {
      for (const k of Object.keys(f.properties)) fields.add(k)
    }
    const geom = f.geometry
    if (!geom) continue
    geomTypes.add(geom.type)
    visitCoords(geom, (lng, lat) => {
      if (lng < minLng) minLng = lng
      if (lat < minLat) minLat = lat
      if (lng > maxLng) maxLng = lng
      if (lat > maxLat) maxLat = lat
    })
  }

  const bbox = isFinite(minLng) ? [minLng, minLat, maxLng, maxLat] : null

  let geometryType = 'mixed'
  if (geomTypes.has('Polygon') || geomTypes.has('MultiPolygon')) geometryType = 'polygon'
  else if (geomTypes.has('LineString') || geomTypes.has('MultiLineString')) geometryType = 'line'
  else if (geomTypes.has('Point') || geomTypes.has('MultiPoint')) geometryType = 'point'

  return {
    featureCount: features.length,
    bbox,
    fields: [...fields].slice(0, 50),
    geometryType,
    rawFeatures: normalizedFeatures,
  }
}
