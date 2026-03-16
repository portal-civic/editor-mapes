import { useMemo, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import LayersPanel from './components/LayersPanel'
import MapCanvas from './components/MapCanvas'
import MapToolbarSimple from './components/MapToolbarSimple'
import FeatureInspector from './components/FeatureInspector'
import LayerInspector from './components/LayerInspector'
import useMapExport from './hooks/useMapExport'
import {
  mockLayers,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  DEFAULT_LAYER_FIELDS,
  getDefaultLayerStyle,
  ensureInitialPointLayer,
  getNextPointLayerName,
  getNextLineLayerName,
  getNextPolygonLayerName,
  normalizeFeature,
} from './modules/layers'
import { basemapOptions, defaultBasemapId } from './modules/maps'
import {
  buildProjectData,
  isValidProjectData,
  normalizeImportedLayers,
  downloadWebProject,
} from './modules/project'
import {
  buildImportedLayersFromGeoJSON,
  convertLayerToGeoJSON,
  sanitizeGeoJSONFileName,
} from './modules/geojson'

function isValidBasemapId(basemapId) {
  return basemapOptions.some((basemap) => basemap.id === basemapId)
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
  const [editableLayerId, setEditableLayerId] = useState('punts')
  const [draftLinePoints, setDraftLinePoints] = useState([])
  const [draftPolygonPoints, setDraftPolygonPoints] = useState([])
  const [selectedFeature, setSelectedFeature] = useState(null)
  // focusMask = { layerId, featureId, latlngs, opacity } | null
  const [focusMask, setFocusMask] = useState(null)

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
          return features.map((feature) => {
            // Feature icon override: "fa:iconid" stored in feature.icon overrides
            // the layer icon while inheriting all other style properties.
            const featureIconMatch =
              typeof feature.icon === 'string' ? feature.icon.match(/^fa:(.+)$/) : null
            const effectiveStyle = featureIconMatch
              ? { ...layer.style, markerType: 'icon-circle', icon: featureIconMatch[1], iconSet: 'fa' }
              : layer.style
            return {
              ...feature,
              label: typeof feature.label === 'string' ? feature.label : '',
              style: effectiveStyle,
              layerId: layer.id,
            }
          })
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

  const vectorLayers = useMemo(
    () =>
      layers.filter(
        (l) =>
          l.geometryType === 'point' ||
          l.geometryType === 'line' ||
          l.geometryType === 'polygon',
      ),
    [layers],
  )

  const editableLayer = useMemo(
    () => vectorLayers.find((l) => l.id === editableLayerId) ?? null,
    [vectorLayers, editableLayerId],
  )

  const editableLayerIndex = useMemo(
    () => vectorLayers.findIndex((l) => l.id === editableLayerId),
    [vectorLayers, editableLayerId],
  )

  const selectedFeatureData = useMemo(() => {
    if (!selectedFeature) return null
    const layer = layers.find((l) => l.id === selectedFeature.layerId)
    if (!layer) return null
    const features = Array.isArray(layer.features) ? layer.features : []
    const feature = features.find((f) => f.id === selectedFeature.featureId)
    if (!feature) return null
    return { feature, layer }
  }, [selectedFeature, layers])

  const handleFeatureSelect = ({ layerId, featureId, geometryType }) => {
    setSelectedFeature({ layerId, featureId, geometryType })
  }

  const handleFeatureDeselect = () => {
    setSelectedFeature(null)
  }

  const handleSetFocusMask = (maskConfig) => setFocusMask(maskConfig)
  const handleClearFocusMask = () => setFocusMask(null)

  const handleFeatureUpdate = (layerId, featureId, partialData) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId) return layer
        return {
          ...layer,
          features: Array.isArray(layer.features)
            ? layer.features.map((f) => (f.id === featureId ? { ...f, ...partialData } : f))
            : [],
        }
      }),
    )
  }

  const handleWorkModeChange = (nextMode) => {
    setActiveWorkModeId(nextMode)
    setSelectedFeature(null)
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

  // Converts a GeoJSON Polygon/MultiPolygon geometry to the Leaflet latlngs format
  // used internally by polygon features. GeoJSON coords are [lng, lat]; Leaflet uses [lat, lng].
  const geoJsonToLeafletLatlngs = (geometry) => {
    const flipRing = (ring) => ring.map(([lng, lat]) => [lat, lng])
    if (geometry.type === 'Polygon') {
      return geometry.coordinates.map(flipRing)
    }
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.map((polygon) => polygon.map(flipRing))
    }
    return null
  }

  const LIMITS_LAYER_COLOR = '#0f4c81'

  const handleAddMunicipalityLayer = (selection) => {
    if (!selection?.geometry) return
    const latlngs = geoJsonToLeafletLatlngs(selection.geometry)
    if (!latlngs) return

    // Use only the first part of the Nominatim display_name (e.g. "Alzira" from "Alzira, ...").
    const layerName = (selection.label || 'Límit municipal').split(',')[0].trim()
    const layerId = `municipality-${Date.now()}-${Math.round(Math.random() * 10000)}`

    const newFeature = normalizeFeature({
      id: `${layerId}-feature`,
      name: layerName,
      sourceType: 'municipality',
      latlngs,
    })
    if (!newFeature) return

    // Each municipality gets its own dedicated layer.
    const newLayer = {
      id: layerId,
      name: layerName,
      color: LIMITS_LAYER_COLOR,
      geometryType: 'polygon',
      visible: true,
      legendLabel: layerName,
      style: getDefaultLayerStyle('polygon', LIMITS_LAYER_COLOR),
      features: [newFeature],
    }
    setLayers((currentLayers) => [...currentLayers, newLayer])
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

  const handleExportProject = () => {
    const projectData = buildProjectData({
      mapView,
      selectedBasemapId,
      activeWorkModeId,
      editableLayerId,
      layers,
    })
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

  const handleExportPNG = async ({ title = '', showLegend = true } = {}) => {
    if (!mapInstanceRef.current) {
      window.alert("No s'ha trobat el mapa per exportar")
      return
    }

    try {
      const visibleLayers = layers.filter(
        (layer) =>
          layer.visible &&
          (layer.geometryType === 'point' ||
            layer.geometryType === 'line' ||
            layer.geometryType === 'polygon'),
      )
      await exportMapAsPNG({
        map: mapInstanceRef.current,
        fileName: 'editor-mapes.png',
        legendLayers: visibleLayers,
        title,
        showLegend,
      })
    } catch {
      window.alert("No s'ha pogut exportar la imatge PNG")
    }
  }

  const handleExportWebProject = () => {
    downloadWebProject({ mapView, selectedBasemapId, layers })
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

      if (!isValidProjectData(parsedData)) {
        window.alert('Fitxer de projecte no vàlid')
        return
      }

      const importedProject = parsedData.project

      setLayers(normalizeImportedLayers(importedProject.layers))
      // Support new format (editableLayerId) and old format (activePointLayerId etc.)
      setEditableLayerId(
        importedProject.editableLayerId ??
        importedProject.activePointLayerId ??
        importedProject.activeLineLayerId ??
        importedProject.activePolygonLayerId ??
        null,
      )
      setSelectedFeature(null)
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
      window.alert("No s'ha pogut llegir el fitxer de projecte")
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
        window.alert("No s'han trobat geometries compatibles en el GeoJSON")
        return
      }

      setLayers((currentLayers) => ensureInitialPointLayer([...currentLayers, ...nextLayersToAdd]))

      // Set the first imported layer as editable
      const firstImported = importedLayers.pointLayer || importedLayers.lineLayer || importedLayers.polygonLayer
      if (firstImported) {
        setEditableLayerId(firstImported.id)
      }
    } catch {
      window.alert("No s'ha pogut importar el fitxer GeoJSON")
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

  const isCreateMode = (mode) =>
    mode === 'point' || mode === 'line' || mode === 'polygon'

  const handleSetEditableLayer = (layerId) => {
    setEditableLayerId(layerId)
    if (isCreateMode(activeWorkModeId)) {
      const nextLayer = layers.find((l) => l.id === layerId)
      if (nextLayer?.geometryType) {
        handleWorkModeChange(nextLayer.geometryType)
      }
    }
  }

  const handleCreatePointLayer = () => {
    const nextLayerId = `point-${Date.now()}-${Math.round(Math.random() * 10000)}`
    setEditableLayerId(nextLayerId)
    handleWorkModeChange('point')
    setLayers((currentLayers) => {
      const nextLayerName = getNextPointLayerName(currentLayers)

      return [
        ...currentLayers,
        {
          ...DEFAULT_LAYER_FIELDS,
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
    setEditableLayerId(nextLayerId)
    handleWorkModeChange('line')
    setLayers((currentLayers) => {
      const nextLayerName = getNextLineLayerName(currentLayers)

      return [
        ...currentLayers,
        {
          ...DEFAULT_LAYER_FIELDS,
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
    setEditableLayerId(nextLayerId)
    handleWorkModeChange('polygon')
    setLayers((currentLayers) => {
      const nextLayerName = getNextPolygonLayerName(currentLayers)

      return [
        ...currentLayers,
        {
          ...DEFAULT_LAYER_FIELDS,
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
    const editableLayer = layers.find((l) => l.id === editableLayerId)
    if (!editableLayer || editableLayer.geometryType !== 'point') {
      window.alert('La capa en edició no és de tipus punt')
      return
    }

    const currentFeatures = Array.isArray(editableLayer.features) ? editableLayer.features : []
    const newFeature = normalizeFeature({
      id: `pt-${Date.now()}-${Math.round(Math.random() * 10000)}`,
      name: `Punt ${currentFeatures.length + 1}`,
      label: '',
      coordinates,
    })
    if (!newFeature) return

    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== editableLayerId) return layer
        const feats = Array.isArray(layer.features) ? layer.features : []
        return { ...layer, features: [...feats, newFeature] }
      }),
    )
    setSelectedFeature({ layerId: editableLayerId, featureId: newFeature.id, geometryType: 'point' })
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

  const handleDraftLinePointAdd = (coordinates) => {
    const editableLayer = layers.find((l) => l.id === editableLayerId)
    if (!editableLayer || editableLayer.geometryType !== 'line') {
      window.alert('La capa en edició no és de tipus línia')
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

    const editableLayer = layers.find((l) => l.id === editableLayerId)
    if (!editableLayer || editableLayer.geometryType !== 'line') {
      window.alert('La capa en edició no és de tipus línia')
      return
    }

    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== editableLayerId || layer.geometryType !== 'line') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        const newFeature = normalizeFeature({
          id: `ln-${Date.now()}-${Math.round(Math.random() * 10000)}`,
          name: '',
          latlngs: [...draftLinePoints],
        })
        if (!newFeature) return layer
        return {
          ...layer,
          features: [...currentFeatures, newFeature],
        }
      }),
    )

    setDraftLinePoints([])
  }

  const handleDraftPolygonPointAdd = (coordinates) => {
    const editableLayer = layers.find((l) => l.id === editableLayerId)
    if (!editableLayer || editableLayer.geometryType !== 'polygon') {
      window.alert('La capa en edició no és de tipus polígon')
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

    const editableLayer = layers.find((l) => l.id === editableLayerId)
    if (!editableLayer || editableLayer.geometryType !== 'polygon') {
      window.alert('La capa en edició no és de tipus polígon')
      return
    }

    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== editableLayerId || layer.geometryType !== 'polygon') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        const newFeature = normalizeFeature({
          id: `pg-${Date.now()}-${Math.round(Math.random() * 10000)}`,
          name: '',
          latlngs: [...draftPolygonPoints],
        })
        if (!newFeature) return layer
        return {
          ...layer,
          features: [...currentFeatures, newFeature],
        }
      }),
    )

    setDraftPolygonPoints([])
  }

  const handleRenameLayer = (layerId, newName) => {
    const trimmedName = typeof newName === 'string' ? newName.trim() : ''
    if (!trimmedName) return

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

      if (editableLayerId === layerId) {
        const remainingVectorLayers = nextLayers.filter((layer) =>
          layer.geometryType === 'point' ||
          layer.geometryType === 'line' ||
          layer.geometryType === 'polygon',
        )
        const nextEditableId = remainingVectorLayers[remainingVectorLayers.length - 1]?.id || null
        setEditableLayerId(nextEditableId)
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
        onAddMunicipalityLayer={handleAddMunicipalityLayer}
        onOpenProject={handleOpenProjectClick}
        onImportGeoJSON={handleImportGeoJSONClick}
        onExportVisibleGeoJSON={handleExportVisibleGeoJSON}
        onExportPNG={handleExportPNG}
        onExportProject={handleExportProject}
        onExportWebProject={handleExportWebProject}
      />

      <main className="workspace">
        <LayersPanel
          layers={layers}
          editableLayerId={editableLayerId}
          onSetEditableLayer={handleSetEditableLayer}
          onLayerVisibilityChange={handleLayerVisibilityChange}
          onCreatePointLayer={handleCreatePointLayer}
          onCreateLineLayer={handleCreateLineLayer}
          onCreatePolygonLayer={handleCreatePolygonLayer}
          onRenameLayer={handleRenameLayer}
        />
        <section className="map-workspace">
          <MapToolbarSimple
            activeWorkModeId={activeWorkModeId}
            editableLayerGeometryType={editableLayer?.geometryType ?? null}
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
            editableLayerId={editableLayerId}
            selectedFeature={selectedFeature}
            onPointAdd={handleMapPointAdd}
            onPointDelete={handleMapPointDelete}
            onPointMove={handleMapPointMove}
            onFeatureSelect={handleFeatureSelect}
            onLineDelete={handleMapLineDelete}
            onPolygonDelete={handleMapPolygonDelete}
            onDraftLinePointAdd={handleDraftLinePointAdd}
            onDraftPolygonPointAdd={handleDraftPolygonPointAdd}
            onViewChange={handleMapViewChange}
            onMapReady={handleMapReady}
            focusMask={focusMask}
          />
        </section>
        {selectedFeatureData ? (
          <FeatureInspector
            key={`${selectedFeatureData.layer.id}-${selectedFeatureData.feature.id}`}
            feature={selectedFeatureData.feature}
            layer={selectedFeatureData.layer}
            onUpdate={handleFeatureUpdate}
            onClose={handleFeatureDeselect}
            focusMask={focusMask}
            onSetFocusMask={handleSetFocusMask}
            onClearFocusMask={handleClearFocusMask}
          />
        ) : editableLayer ? (
          <LayerInspector
            key={editableLayer.id}
            layer={editableLayer}
            layerIndex={editableLayerIndex}
            totalLayers={vectorLayers.length}
            onRenameLayer={handleRenameLayer}
            onLayerStyleChange={handleLayerStyleChange}
            onMoveLayerUp={handleMoveLayerUp}
            onMoveLayerDown={handleMoveLayerDown}
            onExportLayerGeoJSON={handleExportLayerGeoJSON}
            onDeleteLayer={handleDeleteLayer}
          />
        ) : (
          <aside className="panel panel-right inspector-empty">
            <p className="inspector-empty-state">Selecciona una capa per editar les propietats</p>
          </aside>
        )}
      </main>
    </div>
  )
}

export default App
