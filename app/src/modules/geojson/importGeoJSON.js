import { DEFAULT_LAYER_COLORS, getDefaultLayerStyle } from '../layers'
import { extractGeoJSONStyleHints } from './styleHints'

function toLatLng(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null
  }

  const lng = Number(coordinates[0])
  const lat = Number(coordinates[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return [lat, lng]
}

function getFeatureLabel(properties) {
  if (!properties || typeof properties !== 'object') {
    return ''
  }

  const rawLabel = properties.label ?? properties.name ?? properties.title
  return typeof rawLabel === 'string' ? rawLabel : ''
}

export function normalizeGeoJSONInput(geojsonData) {
  if (!geojsonData || typeof geojsonData !== 'object') {
    return null
  }

  if (geojsonData.type === 'FeatureCollection' && Array.isArray(geojsonData.features)) {
    return geojsonData.features
  }

  if (geojsonData.type === 'Feature') {
    return [geojsonData]
  }

  const validGeometryTypes = new Set([
    'Point',
    'MultiPoint',
    'LineString',
    'MultiLineString',
    'Polygon',
    'MultiPolygon',
  ])

  if (validGeometryTypes.has(geojsonData.type)) {
    return [{ type: 'Feature', geometry: geojsonData, properties: {} }]
  }

  return null
}

export function buildImportedLayersFromGeoJSON(geojsonData, fileName) {
  const normalizedFeatures = normalizeGeoJSONInput(geojsonData)
  if (!normalizedFeatures) {
    return null
  }

  const points = []
  const lines = []
  const polygons = []
  let pointStyleHint = null
  let lineStyleHint = null
  let polygonStyleHint = null
  const baseId = `${Date.now()}-${Math.round(Math.random() * 10000)}`
  const importName = fileName.replace(/\.(geo)?json$/i, '').trim() || 'GeoJSON'

  const pushPoint = (coordinates, label, sourceId) => {
    const latlng = toLatLng(coordinates)
    if (!latlng) {
      return
    }

    points.push({
      id: sourceId
        ? `pt-import-${baseId}-${sourceId}-${points.length + 1}`
        : `pt-import-${baseId}-${points.length + 1}`,
      name: `Punt ${points.length + 1}`,
      label,
      coordinates: latlng,
    })
  }

  const pushLine = (coordinates, label, sourceId) => {
    if (!Array.isArray(coordinates)) {
      return
    }

    const latlngs = coordinates.map(toLatLng).filter(Boolean)
    if (latlngs.length < 2) {
      return
    }

    lines.push({
      id: sourceId
        ? `ln-import-${baseId}-${sourceId}-${lines.length + 1}`
        : `ln-import-${baseId}-${lines.length + 1}`,
      label,
      latlngs,
    })
  }

  const pushPolygon = (coordinates, label, sourceId) => {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return
    }

    const rings = coordinates
      .map((ring) => (Array.isArray(ring) ? ring.map(toLatLng).filter(Boolean) : null))
      .filter((ring) => Array.isArray(ring) && ring.length >= 3)

    if (rings.length === 0) {
      return
    }

    polygons.push({
      id: sourceId
        ? `pg-import-${baseId}-${sourceId}-${polygons.length + 1}`
        : `pg-import-${baseId}-${polygons.length + 1}`,
      label,
      latlngs: rings,
    })
  }

  normalizedFeatures.forEach((feature, featureIndex) => {
    const geometry = feature?.geometry
    if (!geometry || typeof geometry !== 'object') {
      return
    }

    const label = getFeatureLabel(feature.properties)
    const styleHints = extractGeoJSONStyleHints(feature.properties)
    const sourceId =
      feature.id != null && feature.id !== '' ? String(feature.id) : String(featureIndex + 1)

    if (geometry.type === 'Point') {
      if (!pointStyleHint && Object.keys(styleHints.point).length > 0) {
        pointStyleHint = styleHints.point
      }
      pushPoint(geometry.coordinates, label, sourceId)
      return
    }

    if (geometry.type === 'MultiPoint' && Array.isArray(geometry.coordinates)) {
      if (!pointStyleHint && Object.keys(styleHints.point).length > 0) {
        pointStyleHint = styleHints.point
      }
      geometry.coordinates.forEach((coordinates) => {
        pushPoint(coordinates, label, sourceId)
      })
      return
    }

    if (geometry.type === 'LineString') {
      if (!lineStyleHint && Object.keys(styleHints.line).length > 0) {
        lineStyleHint = styleHints.line
      }
      pushLine(geometry.coordinates, label, sourceId)
      return
    }

    if (geometry.type === 'MultiLineString' && Array.isArray(geometry.coordinates)) {
      if (!lineStyleHint && Object.keys(styleHints.line).length > 0) {
        lineStyleHint = styleHints.line
      }
      geometry.coordinates.forEach((lineCoordinates) => {
        pushLine(lineCoordinates, label, sourceId)
      })
      return
    }

    if (geometry.type === 'Polygon') {
      if (!polygonStyleHint && Object.keys(styleHints.polygon).length > 0) {
        polygonStyleHint = styleHints.polygon
      }
      pushPolygon(geometry.coordinates, label, sourceId)
      return
    }

    if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
      if (!polygonStyleHint && Object.keys(styleHints.polygon).length > 0) {
        polygonStyleHint = styleHints.polygon
      }
      geometry.coordinates.forEach((polygonCoordinates) => {
        pushPolygon(polygonCoordinates, label, sourceId)
      })
    }
  })

  return {
    pointLayer:
      points.length > 0
        ? {
            id: `point-import-${baseId}`,
            name: `${importName} \u00b7 punts`,
            color: DEFAULT_LAYER_COLORS.point,
            geometryType: 'point',
            visible: true,
            legendLabel: `${importName} \u00b7 punts`,
            style: {
              ...getDefaultLayerStyle('point', DEFAULT_LAYER_COLORS.point),
              ...(pointStyleHint || {}),
            },
            features: points,
          }
        : null,
    lineLayer:
      lines.length > 0
        ? {
            id: `line-import-${baseId}`,
            name: `${importName} \u00b7 l\u00ednies`,
            color: DEFAULT_LAYER_COLORS.line,
            geometryType: 'line',
            visible: true,
            legendLabel: `${importName} \u00b7 l\u00ednies`,
            style: {
              ...getDefaultLayerStyle('line', DEFAULT_LAYER_COLORS.line),
              ...(lineStyleHint || {}),
            },
            features: lines,
          }
        : null,
    polygonLayer:
      polygons.length > 0
        ? {
            id: `polygon-import-${baseId}`,
            name: `${importName} \u00b7 pol\u00edgons`,
            color: DEFAULT_LAYER_COLORS.polygon,
            geometryType: 'polygon',
            visible: true,
            legendLabel: `${importName} \u00b7 pol\u00edgons`,
            style: {
              ...getDefaultLayerStyle('polygon', DEFAULT_LAYER_COLORS.polygon),
              ...(polygonStyleHint || {}),
            },
            features: polygons,
          }
        : null,
  }
}
