import { DEFAULT_LAYER_COLORS, getDefaultLayerStyle, normalizeFeature } from '../layers'
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

function extractFeatureProps(properties) {
  if (!properties || typeof properties !== 'object') {
    return {}
  }

  const label =
    typeof properties.label === 'string'
      ? properties.label
      : typeof properties.name === 'string'
        ? properties.name
        : typeof properties.title === 'string'
          ? properties.title
          : ''

  return {
    name: typeof properties.name === 'string' ? properties.name : '',
    label,
    description: typeof properties.description === 'string' ? properties.description : '',
    category: typeof properties.category === 'string' ? properties.category : '',
    subcategory: typeof properties.subcategory === 'string' ? properties.subcategory : '',
    status: typeof properties.status === 'string' ? properties.status : '',
    icon: typeof properties.icon === 'string' ? properties.icon : '',
    showInWeb: properties.showInWeb !== false,
    showInExport: properties.showInExport !== false,
  }
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

  const pushPoint = (coordinates, props, sourceId) => {
    const latlng = toLatLng(coordinates)
    if (!latlng) {
      return
    }

    const rawFeature = {
      id: sourceId
        ? `pt-import-${baseId}-${sourceId}-${points.length + 1}`
        : `pt-import-${baseId}-${points.length + 1}`,
      name: props.name || `Punt ${points.length + 1}`,
      ...props,
      coordinates: latlng,
    }
    const feature = normalizeFeature(rawFeature)
    if (feature) {
      points.push(feature)
    }
  }

  const pushLine = (coordinates, props, sourceId) => {
    if (!Array.isArray(coordinates)) {
      return
    }

    const latlngs = coordinates.map(toLatLng).filter(Boolean)
    if (latlngs.length < 2) {
      return
    }

    const rawFeature = {
      id: sourceId
        ? `ln-import-${baseId}-${sourceId}-${lines.length + 1}`
        : `ln-import-${baseId}-${lines.length + 1}`,
      name: props.name || '',
      ...props,
      latlngs,
    }
    const feature = normalizeFeature(rawFeature)
    if (feature) {
      lines.push(feature)
    }
  }

  const pushPolygon = (coordinates, props, sourceId) => {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return
    }

    const rings = coordinates
      .map((ring) => (Array.isArray(ring) ? ring.map(toLatLng).filter(Boolean) : null))
      .filter((ring) => Array.isArray(ring) && ring.length >= 3)

    if (rings.length === 0) {
      return
    }

    const rawFeature = {
      id: sourceId
        ? `pg-import-${baseId}-${sourceId}-${polygons.length + 1}`
        : `pg-import-${baseId}-${polygons.length + 1}`,
      name: props.name || '',
      ...props,
      latlngs: rings,
    }
    const feature = normalizeFeature(rawFeature)
    if (feature) {
      polygons.push(feature)
    }
  }

  normalizedFeatures.forEach((feature, featureIndex) => {
    const geometry = feature?.geometry
    if (!geometry || typeof geometry !== 'object') {
      return
    }

    const props = extractFeatureProps(feature.properties)
    const styleHints = extractGeoJSONStyleHints(feature.properties)
    const sourceId =
      feature.id != null && feature.id !== '' ? String(feature.id) : String(featureIndex + 1)

    if (geometry.type === 'Point') {
      if (!pointStyleHint && Object.keys(styleHints.point).length > 0) {
        pointStyleHint = styleHints.point
      }
      pushPoint(geometry.coordinates, props, sourceId)
      return
    }

    if (geometry.type === 'MultiPoint' && Array.isArray(geometry.coordinates)) {
      if (!pointStyleHint && Object.keys(styleHints.point).length > 0) {
        pointStyleHint = styleHints.point
      }
      geometry.coordinates.forEach((coordinates) => {
        pushPoint(coordinates, props, sourceId)
      })
      return
    }

    if (geometry.type === 'LineString') {
      if (!lineStyleHint && Object.keys(styleHints.line).length > 0) {
        lineStyleHint = styleHints.line
      }
      pushLine(geometry.coordinates, props, sourceId)
      return
    }

    if (geometry.type === 'MultiLineString' && Array.isArray(geometry.coordinates)) {
      if (!lineStyleHint && Object.keys(styleHints.line).length > 0) {
        lineStyleHint = styleHints.line
      }
      geometry.coordinates.forEach((lineCoordinates) => {
        pushLine(lineCoordinates, props, sourceId)
      })
      return
    }

    if (geometry.type === 'Polygon') {
      if (!polygonStyleHint && Object.keys(styleHints.polygon).length > 0) {
        polygonStyleHint = styleHints.polygon
      }
      pushPolygon(geometry.coordinates, props, sourceId)
      return
    }

    if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
      if (!polygonStyleHint && Object.keys(styleHints.polygon).length > 0) {
        polygonStyleHint = styleHints.polygon
      }
      geometry.coordinates.forEach((polygonCoordinates) => {
        pushPolygon(polygonCoordinates, props, sourceId)
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
