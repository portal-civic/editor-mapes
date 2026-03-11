import { useMemo, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import LayersPanel from './components/LayersPanel'
import MapCanvas from './components/MapCanvas'
import LegendPanel from './components/LegendPanel'
import MapToolbarSimple from './components/MapToolbarSimple'
import useMapExport from './hooks/useMapExport'
import { mockLayers } from './modules/layers'
import { basemapOptions, defaultBasemapId } from './modules/maps'

const DEFAULT_MAP_CENTER = [40.4168, -3.7038]
const DEFAULT_MAP_ZOOM = 6
const DEFAULT_LAYER_COLORS = {
  point: '#d4335b',
  line: '#ea8b1f',
  polygon: '#2f7de1',
}
const INITIAL_POINT_FEATURES = [
  { id: 'pt-madrid', name: 'Madrid', label: '', coordinates: [40.4168, -3.7038] },
  { id: 'pt-valencia', name: 'València', label: '', coordinates: [39.4699, -0.3763] },
  { id: 'pt-zaragoza', name: 'Saragossa', label: '', coordinates: [41.6488, -0.8891] },
]

function getDefaultLayerStyle(geometryType, layerColor) {
  const fallbackColor = DEFAULT_LAYER_COLORS[geometryType] || '#0f4c81'
  const color = layerColor || fallbackColor

  if (geometryType === 'point') {
    return {
      radius: 7,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: color,
      strokeWidth: 2,
      strokeOpacity: 1,
    }
  }

  if (geometryType === 'line') {
    return {
      color,
      width: 3,
      opacity: 1,
      dashStyle: 'solid',
    }
  }

  if (geometryType === 'polygon') {
    return {
      strokeColor: color,
      strokeWidth: 2,
      strokeOpacity: 1,
      dashStyle: 'solid',
      fillColor: color,
      fillOpacity: 0.18,
    }
  }

  return {}
}

function normalizeLayerStyle(layer) {
  const defaults = getDefaultLayerStyle(layer.geometryType, layer.color)
  const currentStyle =
    layer.style && typeof layer.style === 'object' ? layer.style : {}

  return {
    ...layer,
    style: {
      ...defaults,
      ...currentStyle,
    },
  }
}

function ensureInitialPointLayer(layers) {
  const hasDefaultPointLayer = layers.some((layer) => layer.id === 'punts')
  if (hasDefaultPointLayer) {
    return layers.map(normalizeLayerStyle)
  }

  const firstPointLayer = layers.find((layer) => layer.geometryType === 'point')
  if (firstPointLayer) {
    const existingFeatures = Array.isArray(firstPointLayer.features)
      ? firstPointLayer.features
      : []

    return layers
      .map((layer) =>
        layer.id === firstPointLayer.id
          ? {
              ...layer,
              id: 'punts',
              name: 'Punts',
              color: layer.color || '#d4335b',
              geometryType: 'point',
              visible: true,
              legendLabel: 'Punts',
              features:
                existingFeatures.length > 0
                  ? existingFeatures
                  : INITIAL_POINT_FEATURES,
            }
          : layer,
      )
      .map(normalizeLayerStyle)
  }

  return [
    ...layers,
    {
      id: 'punts',
      name: 'Punts',
      color: '#d4335b',
      geometryType: 'point',
      visible: true,
      legendLabel: 'Punts',
      features: INITIAL_POINT_FEATURES,
    },
  ].map(normalizeLayerStyle)
}

function getNextPointLayerName(layers) {
  const existingIndices = layers
    .map((layer) => {
      const match = /^Nova capa (\d+)$/.exec(layer.name)
      return match ? Number(match[1]) : null
    })
    .filter((value) => Number.isInteger(value))

  const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1
  return `Nova capa ${nextIndex}`
}

function getNextLineLayerName(layers) {
  const existingIndices = layers
    .map((layer) => {
      const match = /^Nova línia (\d+)$/.exec(layer.name)
      return match ? Number(match[1]) : null
    })
    .filter((value) => Number.isInteger(value))

  const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1
  return `Nova línia ${nextIndex}`
}

function getNextPolygonLayerName(layers) {
  const existingIndices = layers
    .map((layer) => {
      const match = /^Nou polígon (\d+)$/.exec(layer.name)
      return match ? Number(match[1]) : null
    })
    .filter((value) => Number.isInteger(value))

  const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1
  return `Nou polígon ${nextIndex}`
}

function getPointLayerForNewPoint(layers, activePointLayerId) {
  const activeLayer = layers.find(
    (layer) => layer.id === activePointLayerId && layer.geometryType === 'point',
  )

  if (activeLayer) {
    return activeLayer
  }

  const visiblePointLayers = layers.filter(
    (layer) => layer.geometryType === 'point' && layer.visible,
  )

  return visiblePointLayers[visiblePointLayers.length - 1] || null
}

function getLineLayerForNewFeature(layers, activeLineLayerId) {
  const activeLayer = layers.find(
    (layer) => layer.id === activeLineLayerId && layer.geometryType === 'line',
  )

  if (activeLayer) {
    return activeLayer
  }

  const visibleLineLayers = layers.filter(
    (layer) => layer.geometryType === 'line' && layer.visible,
  )

  return visibleLineLayers[visibleLineLayers.length - 1] || null
}

function getPolygonLayerForNewFeature(layers, activePolygonLayerId) {
  const activeLayer = layers.find(
    (layer) => layer.id === activePolygonLayerId && layer.geometryType === 'polygon',
  )

  if (activeLayer) {
    return activeLayer
  }

  const visiblePolygonLayers = layers.filter(
    (layer) => layer.geometryType === 'polygon' && layer.visible,
  )

  return visiblePolygonLayers[visiblePolygonLayers.length - 1] || null
}

function isValidBasemapId(basemapId) {
  return basemapOptions.some((basemap) => basemap.id === basemapId)
}

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

function toValidStyleNumber(value) {
  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : null
}

function toValidStyleText(value) {
  if (typeof value !== 'string') {
    return null
  }

  const nextValue = value.trim()
  return nextValue ? nextValue : null
}

function extractGeoJSONStyleHints(properties) {
  if (!properties || typeof properties !== 'object') {
    return { point: {}, line: {}, polygon: {} }
  }

  const stroke = toValidStyleText(properties.stroke)
  const strokeWidth = toValidStyleNumber(properties['stroke-width'])
  const strokeOpacity = toValidStyleNumber(properties['stroke-opacity'])
  const fill = toValidStyleText(properties.fill)
  const fillOpacity = toValidStyleNumber(properties['fill-opacity'])
  const markerColor = toValidStyleText(properties['marker-color'])

  return {
    point: {
      ...(markerColor ? { fillColor: markerColor, strokeColor: markerColor } : {}),
    },
    line: {
      ...(stroke ? { color: stroke } : {}),
      ...(strokeWidth !== null ? { width: strokeWidth } : {}),
      ...(strokeOpacity !== null ? { opacity: strokeOpacity } : {}),
    },
    polygon: {
      ...(stroke ? { strokeColor: stroke } : {}),
      ...(strokeWidth !== null ? { strokeWidth } : {}),
      ...(strokeOpacity !== null ? { strokeOpacity } : {}),
      ...(fill ? { fillColor: fill } : {}),
      ...(fillOpacity !== null ? { fillOpacity } : {}),
    },
  }
}

function normalizeGeoJSONInput(geojsonData) {
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

function buildImportedLayersFromGeoJSON(geojsonData, fileName) {
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
            name: `${importName} · punts`,
            color: DEFAULT_LAYER_COLORS.point,
            geometryType: 'point',
            visible: true,
            legendLabel: `${importName} · punts`,
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
            name: `${importName} · línies`,
            color: DEFAULT_LAYER_COLORS.line,
            geometryType: 'line',
            visible: true,
            legendLabel: `${importName} · línies`,
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
            name: `${importName} · polígons`,
            color: DEFAULT_LAYER_COLORS.polygon,
            geometryType: 'polygon',
            visible: true,
            legendLabel: `${importName} · polígons`,
            style: {
              ...getDefaultLayerStyle('polygon', DEFAULT_LAYER_COLORS.polygon),
              ...(polygonStyleHint || {}),
            },
            features: polygons,
          }
        : null,
  }
}

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

function convertFeatureToGeoJSON(feature, layer) {
  const baseProperties = {
    label: typeof feature?.label === 'string' ? feature.label : '',
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

function convertLayerToGeoJSON(layer) {
  const layerFeatures = Array.isArray(layer?.features) ? layer.features : []

  return {
    type: 'FeatureCollection',
    features: layerFeatures
      .map((feature) => convertFeatureToGeoJSON(feature, layer))
      .filter(Boolean),
  }
}

function sanitizeGeoJSONFileName(name) {
  const safeName = String(name || 'layer')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')

  return safeName || 'layer'
}

function App() {
  const importInputRef = useRef(null)
  const importGeoJSONInputRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const { exportMapAsPNG } = useMapExport()
  const [layers, setLayers] = useState(() => {
    const seededLayers = mockLayers.map((layer) => ({
      ...layer,
      features: Array.isArray(layer.features) ? [...layer.features] : [],
    }))

    return ensureInitialPointLayer(seededLayers)
  })
  const [selectedBasemapId, setSelectedBasemapId] = useState(defaultBasemapId)
  const [activeWorkModeId, setActiveWorkModeId] = useState('select')
  const [mapView, setMapView] = useState({
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
  })
  const [mapNavigationRequest, setMapNavigationRequest] = useState(null)
  const [selectedMunicipalityGeometry, setSelectedMunicipalityGeometry] =
    useState(null)
  const [activePointLayerId, setActivePointLayerId] = useState('punts')
  const [draftLinePoints, setDraftLinePoints] = useState([])
  const [draftPolygonPoints, setDraftPolygonPoints] = useState([])
  const [activeLineLayerId, setActiveLineLayerId] = useState(() => {
    const initialLineLayer = ensureInitialPointLayer(mockLayers).find(
      (layer) => layer.geometryType === 'line',
    )
    return initialLineLayer?.id || null
  })
  const [activePolygonLayerId, setActivePolygonLayerId] = useState(() => {
    const initialPolygonLayer = ensureInitialPointLayer(mockLayers).find(
      (layer) => layer.geometryType === 'polygon',
    )
    return initialPolygonLayer?.id || null
  })

  const selectedBasemap = useMemo(
    () =>
      basemapOptions.find((basemap) => basemap.id === selectedBasemapId) ||
      basemapOptions[0],
    [selectedBasemapId],
  )

  const visiblePointFeatures = useMemo(
    () =>
      layers
        .filter((layer) => layer.geometryType === 'point' && layer.visible)
        .flatMap((layer) => {
          const features = Array.isArray(layer.features) ? layer.features : []
          return features.map((feature) => ({
            ...feature,
            label: typeof feature.label === 'string' ? feature.label : '',
            style: layer.style,
            layerId: layer.id,
          }))
        }),
    [layers],
  )

  const visibleLineFeatures = useMemo(
    () =>
      layers
        .filter((layer) => layer.geometryType === 'line' && layer.visible)
        .flatMap((layer) => {
          const features = Array.isArray(layer.features) ? layer.features : []
          return features
            .filter((feature) => Array.isArray(feature.latlngs))
            .map((feature) => ({
              ...feature,
              label: typeof feature.label === 'string' ? feature.label : '',
              style: layer.style,
              layerId: layer.id,
            }))
        }),
    [layers],
  )

  const visiblePolygonFeatures = useMemo(
    () =>
      layers
        .filter((layer) => layer.geometryType === 'polygon' && layer.visible)
        .flatMap((layer) => {
          const features = Array.isArray(layer.features) ? layer.features : []
          return features
            .filter((feature) => Array.isArray(feature.latlngs))
            .map((feature) => ({
              ...feature,
              label: typeof feature.label === 'string' ? feature.label : '',
              style: layer.style,
              layerId: layer.id,
            }))
        }),
    [layers],
  )
  const visibleLayerOrder = useMemo(
    () =>
      layers
        .filter(
          (layer) =>
            layer.visible &&
            (layer.geometryType === 'point' ||
              layer.geometryType === 'line' ||
              layer.geometryType === 'polygon'),
        )
        .map((layer) => layer.id),
    [layers],
  )

  const handleWorkModeChange = (nextMode) => {
    setActiveWorkModeId(nextMode)
    if (nextMode !== 'line') {
      setDraftLinePoints([])
    }
    if (nextMode !== 'polygon') {
      setDraftPolygonPoints([])
    }
  }

  const handleMapViewChange = ({ center, zoom }) => {
    setMapView((currentView) => {
      if (
        currentView.zoom === zoom &&
        currentView.center[0] === center[0] &&
        currentView.center[1] === center[1]
      ) {
        return currentView
      }

      return { center, zoom }
    })
  }

  const handleMunicipalitySelect = (selection) => {
    if (!selection) {
      setSelectedMunicipalityGeometry(null)
      return
    }

    const { center, bounds, geometry, zoom = 12 } = selection
    const requestId = `${Date.now()}-${Math.random()}`

    if (geometry && ['Polygon', 'MultiPolygon'].includes(geometry.type)) {
      setSelectedMunicipalityGeometry(geometry)
    } else {
      setSelectedMunicipalityGeometry(null)
    }

    if (Array.isArray(bounds) && bounds.length === 2) {
      setMapNavigationRequest({
        id: requestId,
        type: 'fitBounds',
        bounds,
      })
      return
    }

    if (Array.isArray(center) && center.length === 2) {
      setMapNavigationRequest({
        id: requestId,
        type: 'setView',
        center,
        zoom,
      })
    }
  }

  const buildProjectData = () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    project: {
      mapView,
      selectedBasemapId,
      activeWorkModeId,
      activePointLayerId,
      activeLineLayerId,
      activePolygonLayerId,
      layers,
    },
  })

  const handleExportProject = () => {
    const projectData = buildProjectData()
    const jsonContent = JSON.stringify(projectData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'editor-mapes-project.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
  }

  const handleExportLayerGeoJSON = (layerId) => {
    const layer = layers.find((currentLayer) => currentLayer.id === layerId)
    if (!layer) {
      return
    }

    if (
      layer.geometryType !== 'point' &&
      layer.geometryType !== 'line' &&
      layer.geometryType !== 'polygon'
    ) {
      return
    }

    const geojsonData = convertLayerToGeoJSON(layer)
    const geojsonContent = JSON.stringify(geojsonData, null, 2)
    const blob = new Blob([geojsonContent], { type: 'application/geo+json' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${sanitizeGeoJSONFileName(layer.name)}.geojson`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
  }

  const handleExportVisibleGeoJSON = () => {
    const visibleVectorLayers = layers.filter(
      (layer) =>
        layer.visible &&
        (layer.geometryType === 'point' ||
          layer.geometryType === 'line' ||
          layer.geometryType === 'polygon'),
    )

    const geojsonData = {
      type: 'FeatureCollection',
      features: visibleVectorLayers.flatMap((layer) => convertLayerToGeoJSON(layer).features),
    }

    const geojsonContent = JSON.stringify(geojsonData, null, 2)
    const blob = new Blob([geojsonContent], { type: 'application/geo+json' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'editor-mapes-visible.geojson'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
  }

  const handleExportPNG = async () => {
    if (!mapInstanceRef.current) {
      window.alert('No s’ha trobat el mapa per exportar')
      return
    }

    try {
      await exportMapAsPNG({
        map: mapInstanceRef.current,
        fileName: 'editor-mapes.png',
      })
    } catch {
      window.alert('No s’ha pogut exportar la imatge PNG')
    }
  }

  const handleMapReady = (map) => {
    mapInstanceRef.current = map
  }

  const handleOpenProjectClick = () => {
    importInputRef.current?.click()
  }

  const handleImportGeoJSONClick = () => {
    importGeoJSONInputRef.current?.click()
  }

  const handleImportProjectFileChange = async (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    try {
      const fileContent = await selectedFile.text()
      const parsedData = JSON.parse(fileContent)

      if (
        !parsedData ||
        typeof parsedData !== 'object' ||
        !parsedData.project ||
        typeof parsedData.project !== 'object' ||
        !Array.isArray(parsedData.project.layers)
      ) {
        window.alert('Fitxer de projecte no vàlid')
        return
      }

      const importedProject = parsedData.project
      const normalizedLayers = importedProject.layers.map((layer) => ({
        ...normalizeLayerStyle(layer),
        features: Array.isArray(layer.features) ? layer.features : [],
      }))

      setLayers(ensureInitialPointLayer(normalizedLayers))
      setActivePointLayerId(importedProject.activePointLayerId ?? null)
      setActiveLineLayerId(importedProject.activeLineLayerId ?? null)
      setActivePolygonLayerId(importedProject.activePolygonLayerId ?? null)
      setDraftLinePoints([])
      setDraftPolygonPoints([])

      if (
        importedProject.mapView &&
        Array.isArray(importedProject.mapView.center) &&
        importedProject.mapView.center.length === 2 &&
        typeof importedProject.mapView.center[0] === 'number' &&
        typeof importedProject.mapView.center[1] === 'number' &&
        typeof importedProject.mapView.zoom === 'number'
      ) {
        setMapView({
          center: importedProject.mapView.center,
          zoom: importedProject.mapView.zoom,
        })
      }

      if (isValidBasemapId(importedProject.selectedBasemapId)) {
        setSelectedBasemapId(importedProject.selectedBasemapId)
      } else {
        setSelectedBasemapId(defaultBasemapId)
      }

      if (
        typeof importedProject.activeWorkModeId === 'string' &&
        ['select', 'point', 'line', 'polygon', 'delete'].includes(
          importedProject.activeWorkModeId,
        )
      ) {
        setActiveWorkModeId(importedProject.activeWorkModeId)
      } else {
        setActiveWorkModeId('select')
      }
    } catch {
      window.alert('No s’ha pogut llegir el fitxer de projecte')
    } finally {
      event.target.value = ''
    }
  }

  const handleImportGeoJSONFileChange = async (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    try {
      const fileContent = await selectedFile.text()
      const parsedData = JSON.parse(fileContent)
      const importedLayers = buildImportedLayersFromGeoJSON(
        parsedData,
        selectedFile.name,
      )

      if (!importedLayers) {
        window.alert('GeoJSON no vàlid')
        return
      }

      const nextLayersToAdd = [
        importedLayers.pointLayer,
        importedLayers.lineLayer,
        importedLayers.polygonLayer,
      ].filter(Boolean)

      if (nextLayersToAdd.length === 0) {
        window.alert('No s’han trobat geometries compatibles en el GeoJSON')
        return
      }

      setLayers((currentLayers) => ensureInitialPointLayer([...currentLayers, ...nextLayersToAdd]))

      if (importedLayers.pointLayer) {
        setActivePointLayerId(importedLayers.pointLayer.id)
      }
      if (importedLayers.lineLayer) {
        setActiveLineLayerId(importedLayers.lineLayer.id)
      }
      if (importedLayers.polygonLayer) {
        setActivePolygonLayerId(importedLayers.polygonLayer.id)
      }
    } catch {
      window.alert('No s’ha pogut importar el fitxer GeoJSON')
    } finally {
      event.target.value = ''
    }
  }

  const handleLayerVisibilityChange = (layerId, isVisible) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: isVisible } : layer,
      ),
    )
  }

  const handleLayerStyleChange = (layerId, partialStyle) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId) {
          return layer
        }

        const nextStyle = {
          ...getDefaultLayerStyle(layer.geometryType, layer.color),
          ...(layer.style && typeof layer.style === 'object' ? layer.style : {}),
          ...partialStyle,
        }

        return { ...layer, style: nextStyle }
      }),
    )
  }

  const handleMoveLayerUp = (layerId) => {
    setLayers((currentLayers) => {
      const layerIndex = currentLayers.findIndex((layer) => layer.id === layerId)
      if (layerIndex <= 0) {
        return currentLayers
      }

      const nextLayers = [...currentLayers]
      const layerToMove = nextLayers[layerIndex]
      nextLayers[layerIndex] = nextLayers[layerIndex - 1]
      nextLayers[layerIndex - 1] = layerToMove
      return nextLayers
    })
  }

  const handleMoveLayerDown = (layerId) => {
    setLayers((currentLayers) => {
      const layerIndex = currentLayers.findIndex((layer) => layer.id === layerId)
      if (layerIndex < 0 || layerIndex >= currentLayers.length - 1) {
        return currentLayers
      }

      const nextLayers = [...currentLayers]
      const layerToMove = nextLayers[layerIndex]
      nextLayers[layerIndex] = nextLayers[layerIndex + 1]
      nextLayers[layerIndex + 1] = layerToMove
      return nextLayers
    })
  }

  const handleCreatePointLayer = () => {
    const nextLayerId = `point-${Date.now()}-${Math.round(Math.random() * 10000)}`
    setActivePointLayerId(nextLayerId)
    setLayers((currentLayers) => {
      const nextLayerName = getNextPointLayerName(currentLayers)

      return [
        ...currentLayers,
        {
          id: nextLayerId,
          name: nextLayerName,
          color: '#d4335b',
          geometryType: 'point',
          visible: true,
          legendLabel: nextLayerName,
          style: getDefaultLayerStyle('point', '#d4335b'),
          features: [],
        },
      ]
    })
  }

  const handleCreateLineLayer = () => {
    const nextLayerId = `line-${Date.now()}-${Math.round(Math.random() * 10000)}`
    setActiveLineLayerId(nextLayerId)
    setLayers((currentLayers) => {
      const nextLayerName = getNextLineLayerName(currentLayers)

      return [
        ...currentLayers,
        {
          id: nextLayerId,
          name: nextLayerName,
          color: '#ea8b1f',
          geometryType: 'line',
          visible: true,
          legendLabel: nextLayerName,
          style: getDefaultLayerStyle('line', '#ea8b1f'),
          features: [],
        },
      ]
    })
  }

  const handleCreatePolygonLayer = () => {
    const nextLayerId = `polygon-${Date.now()}-${Math.round(Math.random() * 10000)}`
    setActivePolygonLayerId(nextLayerId)
    setLayers((currentLayers) => {
      const nextLayerName = getNextPolygonLayerName(currentLayers)

      return [
        ...currentLayers,
        {
          id: nextLayerId,
          name: nextLayerName,
          color: '#2f7de1',
          geometryType: 'polygon',
          visible: true,
          legendLabel: nextLayerName,
          style: getDefaultLayerStyle('polygon', '#2f7de1'),
          features: [],
        },
      ]
    })
  }

  const handleMapPointAdd = (coordinates) => {
    const nextLabelInput = window.prompt('Text del punt:', '')
    const nextLabel =
      nextLabelInput === null || nextLabelInput.trim() === '' ? '' : nextLabelInput

    setLayers((currentLayers) => {
      const targetLayer = getPointLayerForNewPoint(currentLayers, activePointLayerId)

      if (!targetLayer) {
        return currentLayers
      }

      return currentLayers.map((layer) => {
        if (layer.id !== targetLayer.id) {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        const pointIndex = currentFeatures.length + 1

        return {
          ...layer,
          features: [
            ...currentFeatures,
            {
              id: `pt-${Date.now()}-${Math.round(Math.random() * 10000)}`,
              name: `Punt ${pointIndex}`,
              label: nextLabel,
              coordinates,
            },
          ],
        }
      })
    })
  }

  const handleMapPointDelete = ({ layerId, pointId }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'point') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.filter((feature) => feature.id !== pointId),
        }
      }),
    )
  }

  const handleMapPointMove = ({ layerId, pointId, lat, lng }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'point') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.map((feature) =>
            feature.id === pointId ? { ...feature, coordinates: [lat, lng] } : feature,
          ),
        }
      }),
    )
  }

  const handleMapPointUpdateLabel = ({ layerId, pointId, label }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'point') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.map((feature) =>
            feature.id === pointId ? { ...feature, label } : feature,
          ),
        }
      }),
    )
  }

  const handleMapLineDelete = ({ layerId, lineId }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'line') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.filter((feature) => feature.id !== lineId),
        }
      }),
    )
  }

  const handleMapLineUpdateLabel = ({ layerId, lineId, label }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'line') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.map((feature) =>
            feature.id === lineId ? { ...feature, label } : feature,
          ),
        }
      }),
    )
  }

  const handleMapPolygonDelete = ({ layerId, polygonId }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'polygon') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.filter((feature) => feature.id !== polygonId),
        }
      }),
    )
  }

  const handleMapPolygonUpdateLabel = ({ layerId, polygonId, label }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'polygon') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.map((feature) =>
            feature.id === polygonId ? { ...feature, label } : feature,
          ),
        }
      }),
    )
  }

  const handleDraftLinePointAdd = (coordinates) => {
    const targetLineLayer = getLineLayerForNewFeature(layers, activeLineLayerId)

    if (!targetLineLayer) {
      window.alert('Cal una capa de línia activa')
      return
    }

    setDraftLinePoints((currentPoints) => [...currentPoints, coordinates])
  }

  const handleDraftLineCancel = () => {
    setDraftLinePoints([])
  }

  const handleDraftLineFinish = () => {
    if (draftLinePoints.length < 2) {
      return
    }

    const targetLineLayer = getLineLayerForNewFeature(layers, activeLineLayerId)
    if (!targetLineLayer) {
      window.alert('Cal una capa de línia activa')
      return
    }

    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== targetLineLayer.id || layer.geometryType !== 'line') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: [
            ...currentFeatures,
            {
              id: `ln-${Date.now()}-${Math.round(Math.random() * 10000)}`,
              latlngs: [...draftLinePoints],
            },
          ],
        }
      }),
    )

    setDraftLinePoints([])
  }

  const handleDraftPolygonPointAdd = (coordinates) => {
    const targetPolygonLayer = getPolygonLayerForNewFeature(
      layers,
      activePolygonLayerId,
    )

    if (!targetPolygonLayer) {
      window.alert('Cal una capa de polígon activa')
      return
    }

    setDraftPolygonPoints((currentPoints) => [...currentPoints, coordinates])
  }

  const handleDraftPolygonCancel = () => {
    setDraftPolygonPoints([])
  }

  const handleDraftPolygonFinish = () => {
    if (draftPolygonPoints.length < 3) {
      return
    }

    const targetPolygonLayer = getPolygonLayerForNewFeature(
      layers,
      activePolygonLayerId,
    )
    if (!targetPolygonLayer) {
      window.alert('Cal una capa de polígon activa')
      return
    }

    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== targetPolygonLayer.id || layer.geometryType !== 'polygon') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: [
            ...currentFeatures,
            {
              id: `pg-${Date.now()}-${Math.round(Math.random() * 10000)}`,
              latlngs: [...draftPolygonPoints],
            },
          ],
        }
      }),
    )

    setDraftPolygonPoints([])
  }

  const handleRenameLayer = (layerId) => {
    const layerToRename = layers.find(
      (layer) =>
        layer.id === layerId &&
        (layer.geometryType === 'point' ||
          layer.geometryType === 'line' ||
          layer.geometryType === 'polygon'),
    )

    if (!layerToRename) {
      return
    }

    const nextName = window.prompt('Nou nom de la capa', layerToRename.name)
    if (nextName === null) {
      return
    }

    const trimmedName = nextName.trim()
    if (!trimmedName) {
      return
    }

    setLayers((currentLayers) =>
      currentLayers.map((layer) =>
        layer.id === layerId ? { ...layer, name: trimmedName } : layer,
      ),
    )
  }

  const handleDeleteLayer = (layerId) => {
    setLayers((currentLayers) => {
      const layerToDelete = currentLayers.find(
        (layer) =>
          layer.id === layerId &&
          (layer.geometryType === 'point' ||
            layer.geometryType === 'line' ||
            layer.geometryType === 'polygon'),
      )

      if (!layerToDelete) {
        return currentLayers
      }

      const layerFeatures = Array.isArray(layerToDelete.features)
        ? layerToDelete.features
        : []

      if (layerFeatures.length > 0) {
        const message =
          layerToDelete.geometryType === 'point'
            ? 'No es pot eliminar una capa amb punts'
            : 'No es pot eliminar una capa amb elements'
        window.alert(message)
        return currentLayers
      }

      const shouldDelete = window.confirm('Eliminar capa?')
      if (!shouldDelete) {
        return currentLayers
      }

      const nextLayers = currentLayers.filter((layer) => layer.id !== layerId)

      if (activePointLayerId === layerId) {
        const remainingPointLayers = nextLayers.filter(
          (layer) => layer.geometryType === 'point',
        )
        const nextActivePointLayer =
          remainingPointLayers[remainingPointLayers.length - 1]?.id || null
        setActivePointLayerId(nextActivePointLayer)
      }

      if (activeLineLayerId === layerId) {
        const remainingLineLayers = nextLayers.filter(
          (layer) => layer.geometryType === 'line',
        )
        const nextActiveLineLayer =
          remainingLineLayers[remainingLineLayers.length - 1]?.id || null
        setActiveLineLayerId(nextActiveLineLayer)
      }

      if (activePolygonLayerId === layerId) {
        const remainingPolygonLayers = nextLayers.filter(
          (layer) => layer.geometryType === 'polygon',
        )
        const nextActivePolygonLayer =
          remainingPolygonLayers[remainingPolygonLayers.length - 1]?.id || null
        setActivePolygonLayerId(nextActivePolygonLayer)
      }

      return nextLayers
    })
  }

  return (
    <div className="editor-shell">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={handleImportProjectFileChange}
      />
      <input
        ref={importGeoJSONInputRef}
        type="file"
        accept=".geojson,application/geo+json,application/json,.json"
        style={{ display: 'none' }}
        onChange={handleImportGeoJSONFileChange}
      />
      <TopBar
        basemapOptions={basemapOptions}
        selectedBasemapId={selectedBasemap.id}
        onBasemapChange={setSelectedBasemapId}
        onMunicipalitySelect={handleMunicipalitySelect}
        onOpenProject={handleOpenProjectClick}
        onImportGeoJSON={handleImportGeoJSONClick}
        onExportVisibleGeoJSON={handleExportVisibleGeoJSON}
        onExportPNG={handleExportPNG}
        onExportProject={handleExportProject}
      />

      <main className="workspace">
        <LayersPanel
          layers={layers}
          activePointLayerId={activePointLayerId}
          activeLineLayerId={activeLineLayerId}
          activePolygonLayerId={activePolygonLayerId}
          onSetActivePointLayer={setActivePointLayerId}
          onSetActiveLineLayer={setActiveLineLayerId}
          onSetActivePolygonLayer={setActivePolygonLayerId}
          onLayerVisibilityChange={handleLayerVisibilityChange}
          onCreatePointLayer={handleCreatePointLayer}
          onCreateLineLayer={handleCreateLineLayer}
          onCreatePolygonLayer={handleCreatePolygonLayer}
          onRenameLayer={handleRenameLayer}
          onDeleteLayer={handleDeleteLayer}
          onLayerStyleChange={handleLayerStyleChange}
          onMoveLayerUp={handleMoveLayerUp}
          onMoveLayerDown={handleMoveLayerDown}
          onExportLayerGeoJSON={handleExportLayerGeoJSON}
        />
        <section className="map-workspace">
          <MapToolbarSimple
            activeWorkModeId={activeWorkModeId}
            onModeChange={handleWorkModeChange}
          />
          {activeWorkModeId === 'line' && draftLinePoints.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={handleDraftLineFinish}
                disabled={draftLinePoints.length < 2}
              >
                Acabar línia
              </button>{' '}
              <button type="button" onClick={handleDraftLineCancel}>
                Cancel·lar
              </button>
            </div>
          ) : null}
          {activeWorkModeId === 'polygon' && draftPolygonPoints.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={handleDraftPolygonFinish}
                disabled={draftPolygonPoints.length < 3}
              >
                Acabar polígon
              </button>{' '}
              <button type="button" onClick={handleDraftPolygonCancel}>
                Cancel·lar
              </button>
            </div>
          ) : null}
          <MapCanvas
            selectedBasemap={selectedBasemap}
            activeWorkModeId={activeWorkModeId}
            mapCenter={mapView.center}
            mapZoom={mapView.zoom}
            mapNavigationRequest={mapNavigationRequest}
            pointFeatures={visiblePointFeatures}
            lineFeatures={visibleLineFeatures}
            polygonFeatures={visiblePolygonFeatures}
            visibleLayerOrder={visibleLayerOrder}
            selectedMunicipalityGeometry={selectedMunicipalityGeometry}
            draftLinePoints={draftLinePoints}
            draftPolygonPoints={draftPolygonPoints}
            onPointAdd={handleMapPointAdd}
            onPointDelete={handleMapPointDelete}
            onPointMove={handleMapPointMove}
            onPointUpdateLabel={handleMapPointUpdateLabel}
            onLineDelete={handleMapLineDelete}
            onLineUpdateLabel={handleMapLineUpdateLabel}
            onPolygonDelete={handleMapPolygonDelete}
            onPolygonUpdateLabel={handleMapPolygonUpdateLabel}
            onDraftLinePointAdd={handleDraftLinePointAdd}
            onDraftPolygonPointAdd={handleDraftPolygonPointAdd}
            onViewChange={handleMapViewChange}
            onMapReady={handleMapReady}
          />
        </section>
        <LegendPanel layers={layers} />
      </main>
    </div>
  )
}

export default App
