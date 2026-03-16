function toGeoJSONCoordinate(latlng) {
  if (!Array.isArray(latlng) || latlng.length < 2) {
    return null
  }

  const lat = Number(latlng[0])
  const lng = Number(latlng[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return [lng, lat]
}

function closeGeoJSONRing(ring) {
  if (!Array.isArray(ring) || ring.length < 3) {
    return null
  }

  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) {
    return ring
  }

  return [...ring, first]
}

function getPolygonGeoJSONCoordinates(latlngs) {
  if (!Array.isArray(latlngs) || latlngs.length === 0) {
    return null
  }

  const isSingleRing =
    Array.isArray(latlngs[0]) &&
    latlngs[0].length >= 2 &&
    typeof latlngs[0][0] === 'number' &&
    typeof latlngs[0][1] === 'number'

  if (isSingleRing) {
    const ring = latlngs.map(toGeoJSONCoordinate).filter(Boolean)
    const closedRing = closeGeoJSONRing(ring)
    return closedRing ? [closedRing] : null
  }

  const rings = latlngs
    .map((ringLatlngs) =>
      Array.isArray(ringLatlngs)
        ? closeGeoJSONRing(ringLatlngs.map(toGeoJSONCoordinate).filter(Boolean))
        : null,
    )
    .filter(Boolean)

  return rings.length > 0 ? rings : null
}

export function convertFeatureToGeoJSON(feature, layer) {
  const baseProperties = {
    name: typeof feature?.name === 'string' ? feature.name : '',
    label: typeof feature?.label === 'string' ? feature.label : '',
    description: typeof feature?.description === 'string' ? feature.description : '',
    category: typeof feature?.category === 'string' ? feature.category : '',
    subcategory: typeof feature?.subcategory === 'string' ? feature.subcategory : '',
    status: typeof feature?.status === 'string' ? feature.status : '',
    icon: typeof feature?.icon === 'string' ? feature.icon : '',
    showInWeb: feature?.showInWeb !== false,
    showInExport: feature?.showInExport !== false,
    layerName: layer.name,
    layerType: layer.geometryType,
  }

  if (layer.geometryType === 'point') {
    const coordinates = toGeoJSONCoordinate(feature?.coordinates)
    if (!coordinates) {
      return null
    }

    return {
      type: 'Feature',
      id: feature?.id,
      properties: baseProperties,
      geometry: {
        type: 'Point',
        coordinates,
      },
    }
  }

  if (layer.geometryType === 'line') {
    const coordinates = Array.isArray(feature?.latlngs)
      ? feature.latlngs.map(toGeoJSONCoordinate).filter(Boolean)
      : []

    if (coordinates.length < 2) {
      return null
    }

    return {
      type: 'Feature',
      id: feature?.id,
      properties: baseProperties,
      geometry: {
        type: 'LineString',
        coordinates,
      },
    }
  }

  if (layer.geometryType === 'polygon') {
    const coordinates = getPolygonGeoJSONCoordinates(feature?.latlngs)
    if (!coordinates) {
      return null
    }

    return {
      type: 'Feature',
      id: feature?.id,
      properties: baseProperties,
      geometry: {
        type: 'Polygon',
        coordinates,
      },
    }
  }

  return null
}

export function convertLayerToGeoJSON(layer) {
  const layerFeatures = Array.isArray(layer?.features) ? layer.features : []

  return {
    type: 'FeatureCollection',
    features: layerFeatures
      .map((feature) => convertFeatureToGeoJSON(feature, layer))
      .filter(Boolean),
  }
}

export function sanitizeGeoJSONFileName(name) {
  const safeName = String(name || 'layer')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')

  return safeName || 'layer'
}
