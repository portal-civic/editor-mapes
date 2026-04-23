// Fast axis-aligned bounding box filter for GeoJSON features.
// No external dependencies — pure arithmetic, O(n) per feature set.

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

function getFeatureBbox(feature) {
  const geom = feature?.geometry
  if (!geom) return null
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
  visitCoords(geom, (lng, lat) => {
    if (lng < minLng) minLng = lng
    if (lat < minLat) minLat = lat
    if (lng > maxLng) maxLng = lng
    if (lat > maxLat) maxLat = lat
  })
  if (!isFinite(minLng)) return null
  return [minLng, minLat, maxLng, maxLat]
}

/**
 * Filters features to those whose bbox intersects the viewport.
 * viewport: [west, south, east, north] in WGS84 degrees
 */
export function filterByViewportBbox(features, viewport) {
  const [vW, vS, vE, vN] = viewport
  return features.filter((f) => {
    const bbox = getFeatureBbox(f)
    if (!bbox) return false
    const [fW, fS, fE, fN] = bbox
    return !(fE < vW || fW > vE || fN < vS || fS > vN)
  })
}
