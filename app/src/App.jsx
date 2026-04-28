import { useMemo, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import LayersPanel from './components/LayersPanel'
import MapCanvas from './components/MapCanvas'
import MapToolbarSimple from './components/MapToolbarSimple'
import FeatureInspector from './components/FeatureInspector'
import LayerInspector from './components/LayerInspector'
import GeoJsonImportDialog from './components/GeoJsonImportDialog'
import SourceImportDialog from './components/SourceImportDialog'
import ShapefileLayerSelectDialog from './components/ShapefileLayerSelectDialog'
import GpkgLayerSelectDialog from './components/GpkgLayerSelectDialog'
import PaletteManagerDialog from './components/PaletteManagerDialog'
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
  normalizeImportedGroups,
  normalizeImportedPalettes,
  normalizeImportedLegendLayout,
  restoreProjectDatasets,
  downloadWebProject,
} from './modules/project'
import { buildLayerSVG } from './modules/export/exportSVG'
import { exportHybridPointLayer, exportAllVisibleLayers } from './modules/export/exportHybrid'
import { exportPDFSimple } from './modules/export/exportPDF'
import { exportBasemapHDPng } from './modules/export/exportBasemapHD'
import {
  buildImportedLayersFromGeoJSON,
  normalizeGeoJSONInput,
  convertLayerToGeoJSON,
  sanitizeGeoJSONFileName,
} from './modules/geojson'
import {
  filterFeaturesByArea,
  getImportAreaFromViewport,
  getImportAreaFromGeoJSONGeometry,
} from './modules/import/spatialFilter'
import { IMPORT_MODES } from './modules/import/importOptions'
import { readGeoJSONMeta } from './modules/sources/readGeoJSONMeta'
import { createDatasetFromSource } from './modules/sources/createDataset'
import { storeSourceFeatures, removeSource, removeDataset, getSourceFeatures } from './modules/sources/sourceStore'
import { readShapefileZip } from './modules/sources/readShapefileZip'
import { openGpkgFile } from './modules/sources/readGpkg'
import {
  generateCategoriesFromDataset,
  applyPaletteToCategories,
  normalizeCategory,
} from './modules/sources/categoricalStyle'
import { PALETTES } from './modules/styles/palettes'
import { buildLegendEntries } from './modules/legend/buildLegendEntries'
import { DEFAULT_LEGEND_LAYOUT, normalizeLegendLayout } from './modules/legend/legendLayout'
import {
  applyDictionaryToCategories,
  ALL_DICTIONARIES,
  translateCv05Value,
} from './modules/dictionaries'
import { getDatasetFeatures } from './modules/sources/sourceStore'
import { filterByViewportBbox } from './modules/sources/bboxFilter'
import LegendPanel from './components/LegendPanel'
import LegendConfigPanel from './components/LegendConfigPanel'
import SelectedSourceFeaturePanel from './components/SelectedSourceFeaturePanel'
import LibraryDialog from './components/LibraryDialog'
import { fetchWfsGeoJson } from './modules/services/wfsClient'

function isValidBasemapId(basemapId) {
  return basemapOptions.some((basemap) => basemap.id === basemapId)
}

function App() {
  const importInputRef = useRef(null)
  const importGeoJSONInputRef = useRef(null)
  const importShapefileInputRef = useRef(null)
  const importGpkgInputRef = useRef(null)
  const gpkgHandleRef = useRef(null)
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
  // pendingGeoJSONImport = { parsedData, fileName, featureCount } | null
  const [pendingGeoJSONImport, setPendingGeoJSONImport] = useState(null)
  // groups = [{ id, name, collapsed, legend, styleOverride }]
  const [groups, setGroups] = useState([])
  // bearing: map rotation in degrees (0 = north up)
  const [bearing, setBearing] = useState(0)
  // sources = [{ id, type, fileName, meta }] — lightweight metadata only
  const [sources, setSources] = useState([])
  // datasets = [{ id, sourceId, featureCount, options }] — lightweight metadata only
  const [datasets, setDatasets] = useState([])
  // pendingSourceImport = { sourceId, fileName, meta, sourceType? } | null
  const [pendingSourceImport, setPendingSourceImport] = useState(null)
  // pendingShapefileSelect = { layers, warnings, zipName } | null  (multi-layer SHP)
  const [pendingShapefileSelect, setPendingShapefileSelect] = useState(null)
  // pendingGpkgLayers = { layers, warnings, fileName } | null  (multi-layer GPKG)
  const [pendingGpkgLayers, setPendingGpkgLayers] = useState(null)
  // projectPalettes: user-defined palettes, exported with the project
  const [projectPalettes, setProjectPalettes] = useState([])
  const [showPaletteManager, setShowPaletteManager] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState('layer')
  // legendLayout: global legend configuration (position, fonts, language, etc.)
  const [legendLayout, setLegendLayout] = useState(DEFAULT_LEGEND_LAYOUT)
  // mapViewport: [west, south, east, north] updated on map moveend — used for viewport filtering
  const [mapViewport, setMapViewport] = useState(null)
  // selectedSourceFeature: clicked feature from an imported source layer
  const [selectedSourceFeature, setSelectedSourceFeature] = useState(null)
  // projectName: editable inline in TopBar; used for export filename and default PNG title
  const [projectName, setProjectName] = useState('Nou projecte')
  const [showLibraryDialog, setShowLibraryDialog] = useState(false)

  const selectedBasemap = useMemo(
    () =>
      basemapOptions.find((basemap) => basemap.id === selectedBasemapId) ||
      basemapOptions[0],
    [selectedBasemapId],
  )

  const groupStyleOverrideMap = useMemo(() => {
    const map = new Map()
    for (const g of groups) {
      if (g.styleOverride?.enabled) map.set(g.id, g.styleOverride)
    }
    return map
  }, [groups])

  const visiblePointFeatures = useMemo(
    () =>
      layers
        .filter((layer) => layer.geometryType === 'point' && layer.visible)
        .flatMap((layer) => {
          const features = Array.isArray(layer.features) ? layer.features : []
          const gso = layer.groupId ? groupStyleOverrideMap.get(layer.groupId) : undefined
          return features.map((feature) => {
            const featureIconMatch =
              typeof feature.icon === 'string' ? feature.icon.match(/^fa:(.+)$/) : null
            let base = featureIconMatch
              ? { ...layer.style, markerType: 'icon-circle', icon: featureIconMatch[1], iconSet: 'fa' }
              : layer.style
            if (gso) base = { ...base, fillColor: gso.fillColor, fillOpacity: gso.fillOpacity, strokeColor: gso.strokeColor, strokeOpacity: gso.strokeOpacity, strokeWidth: gso.strokeWidth }
            return {
              ...feature,
              label: typeof feature.label === 'string' ? feature.label : '',
              style: base,
              layerId: layer.id,
            }
          })
        }),
    [layers, groupStyleOverrideMap],
  )

  const visibleLineFeatures = useMemo(
    () =>
      layers
        .filter((layer) => layer.geometryType === 'line' && layer.visible)
        .flatMap((layer) => {
          const features = Array.isArray(layer.features) ? layer.features : []
          const gso = layer.groupId ? groupStyleOverrideMap.get(layer.groupId) : undefined
          const baseStyle = gso
            ? { ...layer.style, color: gso.strokeColor, width: gso.strokeWidth, opacity: gso.strokeOpacity, dashStyle: gso.dashStyle }
            : layer.style
          return features
            .filter((feature) => Array.isArray(feature.latlngs))
            .map((feature) => ({
              ...feature,
              label: typeof feature.label === 'string' ? feature.label : '',
              style: baseStyle,
              layerId: layer.id,
            }))
        }),
    [layers, groupStyleOverrideMap],
  )

  const visiblePolygonFeatures = useMemo(
    () =>
      layers
        .filter((layer) => layer.geometryType === 'polygon' && layer.visible)
        .flatMap((layer) => {
          const features = Array.isArray(layer.features) ? layer.features : []
          const gso = layer.groupId ? groupStyleOverrideMap.get(layer.groupId) : undefined
          const baseStyle = gso
            ? { ...layer.style, fillColor: gso.fillColor, fillOpacity: gso.fillOpacity, strokeColor: gso.strokeColor, strokeOpacity: gso.strokeOpacity, strokeWidth: gso.strokeWidth, dashStyle: gso.dashStyle }
            : layer.style
          return features
            .filter((feature) => Array.isArray(feature.latlngs))
            .map((feature) => ({
              ...feature,
              label: typeof feature.label === 'string' ? feature.label : '',
              style: baseStyle,
              layerId: layer.id,
            }))
        }),
    [layers, groupStyleOverrideMap],
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

  const visibleSourceLayers = useMemo(
    () => layers.filter((l) => l.type === 'source' && l.visible),
    [layers],
  )

  // Viewport-visible category values for categorical source layers.
  // Only populated when showOnlyVisibleInViewport is active.
  const visibleValuesByLayerId = useMemo(() => {
    if (!legendLayout.showOnlyVisibleInViewport || !mapViewport) return null
    const result = {}
    for (const layer of layers) {
      if (!layer.visible || layer.styleMode !== 'categorical') continue
      const field = layer.categorical?.field
      if (!field) continue
      const values = new Set()
      if (layer.datasetId) {
        const features = getDatasetFeatures(layer.datasetId)
        const visible = filterByViewportBbox(features, mapViewport)
        for (const feat of visible) {
          const val = feat.properties?.[field]
          if (val != null) values.add(String(val))
        }
      }
      result[layer.id] = values
    }
    return result
  }, [legendLayout.showOnlyVisibleInViewport, layers, mapViewport])

  const legendEntries = useMemo(
    () => buildLegendEntries(layers, {
      language: legendLayout.language,
      showLayerNames: legendLayout.showLayerNames !== false,
      visibleValuesByLayerId,
      groups,
    }),
    [layers, legendLayout.language, legendLayout.showLayerNames, visibleValuesByLayerId, groups],
  )

  const allPalettes = useMemo(() => {
    const map = { ...PALETTES }
    for (const p of projectPalettes) map[p.id] = { name: p.name, colors: p.colors }
    return map
  }, [projectPalettes])

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

  const handleToggleLayerInMask = (layerId, include) => {
    setFocusMask((prev) => {
      const currentIds = prev?.layerIds ?? []
      const nextIds = include
        ? [...new Set([...currentIds, layerId])]
        : currentIds.filter((id) => id !== layerId)
      if (nextIds.length === 0) return null
      return {
        layerIds: nextIds,
        opacity: prev?.opacity ?? 0.7,
        color: prev?.color ?? '#ffffff',
      }
    })
  }

  const handleMaskOpacityChange = (opacity) => {
    setFocusMask((prev) => (prev ? { ...prev, opacity } : null))
  }

  const handleMaskColorChange = (color) => {
    setFocusMask((prev) => (prev ? { ...prev, color } : null))
  }

  const handleCreateGroup = () => {
    const nextId = `group-${Date.now()}-${Math.round(Math.random() * 10000)}`
    setGroups((prev) => [
      ...prev,
      {
        id: nextId,
        name: `Grup ${prev.length + 1}`,
        collapsed: false,
        legend: { title: '', showGroupTitle: false, showChildLayers: true },
        styleOverride: { enabled: false, fillColor: '#888888', fillOpacity: 0.5, strokeColor: '#333333', strokeOpacity: 1, strokeWidth: 2, dashStyle: 'solid' },
      },
    ])
  }

  const handleRenameGroup = (groupId, newName) => {
    const trimmed = typeof newName === 'string' ? newName.trim() : ''
    if (!trimmed) return
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name: trimmed } : g)))
  }

  const handleDeleteGroup = (groupId) => {
    setLayers((current) =>
      current.map((l) => (l.groupId === groupId ? { ...l, groupId: undefined } : l)),
    )
    setGroups((prev) => prev.filter((g) => g.id !== groupId))
  }

  const handleSetLayerGroup = (layerId, groupId) => {
    setLayers((current) =>
      current.map((l) =>
        l.id === layerId ? { ...l, groupId: groupId || undefined } : l,
      ),
    )
  }

  const handleGroupVisibilityChange = (groupId, visible) => {
    setLayers((current) =>
      current.map((l) => (l.groupId === groupId ? { ...l, visible } : l)),
    )
  }

  const handleToggleGroupCollapse = (groupId) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, collapsed: !g.collapsed } : g)),
    )
  }

  const handleUpdateGroupLegend = (groupId, legend) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, legend } : g)),
    )
  }

  const handleUpdateGroupStyleOverride = (groupId, styleOverride) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, styleOverride } : g)),
    )
  }

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

  // Rotation is locked to 0 during any drawing/delete mode to avoid coordinate
  // transform issues with custom draw handlers. Restores when back in select mode.
  const effectiveBearing = activeWorkModeId === 'select' ? bearing : 0

  const handleBearingRotate = (delta) => {
    setBearing((prev) => Math.round((prev + delta + 360) % 360))
  }

  const handleBearingReset = () => setBearing(0)

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

  const handleMapViewChange = ({ center, zoom, bounds }) => {
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
    if (bounds) setMapViewport(bounds)
  }

  const handleSourceFeatureClick = (payload) => {
    if (!payload) {
      setSelectedSourceFeature(null)
      return
    }
    const { layerId, featureKey, feature } = payload
    setSelectedSourceFeature({ layerId, featureKey, feature })
    setRightPanelTab('layer')
  }

  const handleSourceFeatureDeselect = () => {
    setSelectedSourceFeature(null)
  }

  const handleFeatureOverrideChange = (layerId, featureKey, partial) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l
        if (partial === null) {
          const { [featureKey]: _removed, ...rest } = l.featureOverrides ?? {}
          return { ...l, featureOverrides: rest }
        }
        return {
          ...l,
          featureOverrides: {
            ...(l.featureOverrides ?? {}),
            [featureKey]: {
              ...(l.featureOverrides?.[featureKey] ?? {}),
              ...partial,
            },
          },
        }
      }),
    )
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
    // Collect GeoJSON features from the external sourceStore for every source layer.
    // _srcIdx is non-enumerable so JSON.stringify omits it automatically — the
    // serialized features are clean GeoJSON with no internal metadata.
    const datasetsPayload = {}
    for (const layer of layers) {
      if (layer.type === 'source' && layer.datasetId) {
        const features = getDatasetFeatures(layer.datasetId)
        if (features.length > 0) {
          datasetsPayload[layer.datasetId] = { type: 'geojson', features }
        }
      }
    }

    const projectData = buildProjectData({
      mapView: { ...mapView, bearing },
      selectedBasemapId,
      activeWorkModeId,
      editableLayerId,
      layers,
      groups,
      projectPalettes,
      legendLayout,
      focusMask,
      datasets: datasetsPayload,
    })
    const jsonContent = JSON.stringify(projectData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    const safeFileName = (projectName || 'projecte').replace(/[^a-z0-9À-ú\s._-]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'projecte'
    link.download = `${safeFileName}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
  }

  const handleExportAllLayers = async () => {
    if (!mapInstanceRef.current) {
      window.alert("No s'ha trobat el mapa per exportar")
      return
    }
    try {
      await exportAllVisibleLayers(mapInstanceRef.current, layers, selectedBasemap)
    } catch {
      window.alert("No s'ha pogut exportar les capes")
    }
  }

  const handleExportPDFSimple = async () => {
    if (!mapInstanceRef.current) {
      window.alert("No s'ha trobat el mapa per exportar")
      return
    }
    try {
      await exportPDFSimple(mapInstanceRef.current, layers, selectedBasemap, focusMask)
    } catch (err) {
      window.alert(`No s'ha pogut exportar el PDF: ${err.message}`)
    }
  }

  const handleExportBasemapHD = async (opts) => {
    if (!mapInstanceRef.current) {
      window.alert("No s'ha trobat el mapa per exportar")
      return
    }
    if (!selectedBasemap || selectedBasemap.type !== 'xyz') {
      window.alert("El basemap seleccionat no és compatible amb l'exportació HD (cal un basemap de teseles XYZ).")
      return
    }
    try {
      await exportBasemapHDPng(mapInstanceRef.current, selectedBasemap, opts)
    } catch (err) {
      window.alert(`No s'ha pogut exportar el basemap HD: ${err.message}`)
    }
  }

  const handleExportHybrid = async (layerId) => {
    const layer = layers.find((l) => l.id === layerId)
    if (!layer || layer.geometryType !== 'point') return
    if (!mapInstanceRef.current) {
      window.alert("No s'ha trobat el mapa per exportar")
      return
    }
    try {
      await exportHybridPointLayer(mapInstanceRef.current, layer)
    } catch {
      window.alert("No s'ha pogut exportar PNG + SVG")
    }
  }

  const handleExportLayerSVG = (layerId) => {
    const layer = layers.find((l) => l.id === layerId)
    if (!layer) return
    if (!mapInstanceRef.current) {
      window.alert("No s'ha trobat el mapa per exportar")
      return
    }
    const map = mapInstanceRef.current
    const rect = map.getContainer().getBoundingClientRect()
    const width = Math.round(rect.width) || 800
    const height = Math.round(rect.height) || 600
    const bounds = map.getBounds()
    const svgContent = buildLayerSVG(layer, bounds, width, height)
    if (!svgContent) return
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${layer.name || 'capa'}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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

  const handleExportPNG = async ({ showLegend = true } = {}) => {
    if (!mapInstanceRef.current) {
      window.alert("No s'ha trobat el mapa per exportar")
      return
    }

    try {
      const titleText = legendLayout.exportTitleEnabled
        ? (legendLayout.exportTitle || projectName || '')
        : ''

      // When the TopBar "Llegenda" toggle is off, force position=none for this export.
      const exportLayout = showLegend
        ? legendLayout
        : { ...legendLayout, position: 'none' }

      await exportMapAsPNG({
        map: mapInstanceRef.current,
        fileName: 'editor-mapes.png',
        legendEntries,
        legendLayout: exportLayout,
        title: titleText,
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
    window.__debugMap = map // DEBUG TEMPORAL — eliminar després
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

      // Restore external sourceStore before setting layer state so that
      // getDatasetFeatures(datasetId) works immediately after layers are set.
      restoreProjectDatasets(parsedData)

      const normalizedLayers = normalizeImportedLayers(importedProject.layers)
      setLayers(normalizedLayers)
      setGroups(normalizeImportedGroups(importedProject.groups))
      setProjectPalettes(normalizeImportedPalettes(importedProject.palettes))
      setLegendLayout(normalizeImportedLegendLayout(importedProject.legendLayout))

      const savedMask = importedProject.focusMask
      setFocusMask(
        savedMask &&
        Array.isArray(savedMask.layerIds) &&
        savedMask.layerIds.length > 0
          ? {
              layerIds: savedMask.layerIds.filter((id) => typeof id === 'string'),
              opacity: typeof savedMask.opacity === 'number' ? savedMask.opacity : 0.7,
              color: typeof savedMask.color === 'string' ? savedMask.color : '#ffffff',
            }
          : null,
      )

      // Rebuild lightweight datasets metadata so layer deletion cleans up correctly.
      setDatasets(
        normalizedLayers
          .filter((l) => l.type === 'source' && l.datasetId)
          .map((l) => ({
            id: l.datasetId,
            sourceId: l.sourceId ?? null,
            featureCount: getDatasetFeatures(l.datasetId).length,
            options: {},
          })),
      )
      setBearing(typeof importedProject.mapView?.bearing === 'number' ? importedProject.mapView.bearing : 0)
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

      // Derive project name from filename (strip extension)
      const rawName = selectedFile.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
      if (rawName) setProjectName(rawName)
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
      const meta = readGeoJSONMeta(parsedData)

      if (!meta) {
        window.alert('GeoJSON no vàlid')
        return
      }

      const sourceId = `src-${Date.now()}-${Math.round(Math.random() * 10000)}`
      storeSourceFeatures(sourceId, meta.rawFeatures)

      setPendingSourceImport({
        sourceId,
        fileName: selectedFile.name,
        meta: {
          featureCount: meta.featureCount,
          bbox: meta.bbox,
          fields: meta.fields,
          geometryType: meta.geometryType,
        },
      })
    } catch {
      window.alert("No s'ha pogut llegir el fitxer GeoJSON")
    } finally {
      event.target.value = ''
    }
  }

  const handleSourceImportConfirm = (options) => {
    if (!pendingSourceImport) return
    const { sourceId, fileName, meta } = pendingSourceImport

    const importOptions = {}
    if (options.useViewport && mapInstanceRef.current) {
      const bounds = mapInstanceRef.current.getBounds()
      importOptions.viewport = [
        bounds.getWest(), bounds.getSouth(),
        bounds.getEast(), bounds.getNorth(),
      ]
    }
    if (options.limit) importOptions.limit = options.limit

    const dataset = createDatasetFromSource(sourceId, importOptions)

    const sourceRecord = { id: sourceId, type: pendingSourceImport.sourceType ?? 'geojson', fileName, meta }
    setSources((s) => [...s, sourceRecord])
    setDatasets((d) => [...d, dataset])

    const effectiveGeomType =
      meta.geometryType === 'mixed' ? 'polygon' : meta.geometryType
    const layerColor =
      effectiveGeomType === 'polygon' ? '#2f7de1'
        : effectiveGeomType === 'line' ? '#ea8b1f'
        : '#d4335b'
    const importName = fileName.replace(/\.(geo)?json$/i, '').trim() || 'Font'
    const layerId = `src-layer-${Date.now()}-${Math.round(Math.random() * 10000)}`

    const sourceLayer = {
      id: layerId,
      name: importName,
      color: layerColor,
      geometryType: effectiveGeomType,
      visible: true,
      legendLabel: importName,
      style: getDefaultLayerStyle(effectiveGeomType, layerColor),
      features: [],
      type: 'source',
      datasetId: dataset.id,
      sourceId,
      meta: {
        totalFeatureCount: meta.featureCount,
        loadedFeatureCount: dataset.featureCount,
        fields: meta.fields ?? [],
      },
      legend: {
        title: importName,
        showCounts: false,
        orderMode: 'manual',
        visible: true,
      },
    }

    setLayers((currentLayers) => ensureInitialPointLayer([...currentLayers, sourceLayer]))
    setEditableLayerId(layerId)
    setPendingSourceImport(null)
  }

  const handleSourceImportCancel = () => {
    if (pendingSourceImport) {
      removeSource(pendingSourceImport.sourceId)
    }
    setPendingSourceImport(null)
  }

  // Library: import a catalog entry (geojson or wfs) filtered to the current viewport.
  // For WFS entries, entry.typeName must already be resolved by LibraryDialog.
  // Returns { featureCount, warned } on success; throws with err.message code on failure.
  const handleLibraryImport = async (entry) => {
    // Resolve viewport from state, fall back to map instance
    const viewport =
      mapViewport ??
      (() => {
        if (!mapInstanceRef.current) return null
        const b = mapInstanceRef.current.getBounds()
        return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
      })()

    // ── Step 1: fetch data ────────────────────────────────────────────────────
    let parsedData
    let serverFiltered = false
    let limitHit = false

    if (entry.type === 'wfs') {
      const wfsResult = await fetchWfsGeoJson({
        url: entry.serviceUrl,
        typeName: entry.typeName,
        bbox: viewport,
        srsName: entry.srsName ?? 'EPSG:4326',
        maxFeatures: entry.maxFeatures ?? 5000,
        version: entry.wfsVersion ?? '2.0.0',
        outputFormat: entry.outputFormat ?? 'application/json',
        language: entry.language ?? null,
      })
      parsedData = wfsResult.data
      serverFiltered = true
      // WFS server applies COUNT; warn if result == limit (likely truncated)
      const returned = Array.isArray(parsedData?.features) ? parsedData.features.length : 0
      limitHit = typeof entry.maxFeatures === 'number' && returned >= entry.maxFeatures
    } else {
      // entry.path starts with '/' (e.g. '/library/layers/foo.geojson').
      // BASE_URL ends with '/' ('/' in dev, '/editor-mapes/' in production).
      // Slice off the trailing slash so the two slashes don't double up.
      const resolvedPath = import.meta.env.BASE_URL.slice(0, -1) + entry.path
      const response = await fetch(resolvedPath)
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'no_file' : 'fetch_failed')
      }
      parsedData = await response.json()
    }

    // ── Step 2: read metadata ─────────────────────────────────────────────────
    const meta = readGeoJSONMeta(parsedData)
    if (!meta) throw new Error('invalid')

    // ── Step 3: store source features ─────────────────────────────────────────
    const sourceId = `src-lib-${Date.now()}-${Math.round(Math.random() * 10000)}`
    storeSourceFeatures(sourceId, meta.rawFeatures)

    // ── Step 4: create dataset (client-side viewport filter for geojson only) ──
    const importOptions = {}
    if (!serverFiltered) {
      if (viewport) importOptions.viewport = viewport
      // Check if viewport-filtered count exceeds maxFeatures (geojson only)
      if (typeof entry.maxFeatures === 'number') {
        const vpFeatures = viewport
          ? filterByViewportBbox(getSourceFeatures(sourceId), viewport)
          : getSourceFeatures(sourceId)
        limitHit = vpFeatures.length > entry.maxFeatures
      }
    }
    if (typeof entry.maxFeatures === 'number') importOptions.limit = entry.maxFeatures

    const dataset = createDatasetFromSource(sourceId, importOptions)

    if (dataset.featureCount === 0) {
      removeSource(sourceId)
      return { featureCount: 0 }
    }

    // ── Step 5: register source + dataset ─────────────────────────────────────
    const sourceRecord = {
      id: sourceId,
      type: entry.type ?? 'geojson',
      fileName: entry.name,
      meta: {
        featureCount: meta.featureCount,
        bbox: meta.bbox,
        fields: meta.fields,
        geometryType: meta.geometryType,
      },
    }
    setSources((s) => [...s, sourceRecord])
    setDatasets((d) => [...d, dataset])

    // ── Step 6: build source layer ────────────────────────────────────────────
    const effectiveGeomType =
      entry.geometryType && entry.geometryType !== 'mixed'
        ? entry.geometryType
        : meta.geometryType === 'mixed'
        ? 'polygon'
        : meta.geometryType
    const defaultColors = { polygon: '#2f7de1', line: '#ea8b1f', point: '#d4335b' }
    const layerColor = defaultColors[effectiveGeomType] ?? '#2f7de1'
    const layerId = `lib-layer-${Date.now()}-${Math.round(Math.random() * 10000)}`

    const sourceLayer = {
      id: layerId,
      name: entry.name,
      color: layerColor,
      geometryType: effectiveGeomType,
      visible: true,
      legendLabel: entry.name,
      style: getDefaultLayerStyle(effectiveGeomType, layerColor),
      features: [],
      type: 'source',
      datasetId: dataset.id,
      sourceId,
      meta: {
        totalFeatureCount: meta.featureCount,
        loadedFeatureCount: dataset.featureCount,
        fields: meta.fields ?? [],
        catalogEntryId: entry.id,
        dictionaryId: entry.dictionaryId ?? null,
        preferredField: entry.preferredField ?? null,
      },
      legend: {
        title: entry.name,
        showCounts: false,
        orderMode: 'manual',
        visible: true,
      },
    }

    setLayers((currentLayers) => ensureInitialPointLayer([...currentLayers, sourceLayer]))
    setEditableLayerId(layerId)

    return {
      featureCount: dataset.featureCount,
      warned: limitHit ? entry.maxFeatures : null,
    }
  }

  // Shared helper: takes a GeoJSON FeatureCollection + a display name and
  // feeds it into the source pipeline (readGeoJSONMeta → sourceStore → SourceImportDialog).
  const openSourceImportFromGeojson = (geojson, displayName, sourceType = 'geojson') => {
    const meta = readGeoJSONMeta(geojson)
    if (!meta) {
      window.alert("No s'han trobat geometries vàlides")
      return
    }
    const sourceId = `src-${Date.now()}-${Math.round(Math.random() * 10000)}`
    storeSourceFeatures(sourceId, meta.rawFeatures)
    setPendingSourceImport({
      sourceId,
      fileName: displayName,
      sourceType,
      meta: {
        featureCount: meta.featureCount,
        bbox: meta.bbox,
        fields: meta.fields,
        geometryType: meta.geometryType,
      },
    })
  }

  const handleImportShapefileClick = () => {
    importShapefileInputRef.current?.click()
  }

  const handleImportShapefileFileChange = async (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    try {
      const result = await readShapefileZip(selectedFile)

      if (result.error) {
        window.alert(result.error)
        return
      }

      const { detectedLayers, warnings, fileName } = result

      if (detectedLayers.length === 1) {
        // Single layer: proceed directly to SourceImportDialog
        const layer = detectedLayers[0]
        openSourceImportFromGeojson(layer.geojson, layer.name, 'shapefile')
      } else {
        // Multiple layers: let user choose first
        setPendingShapefileSelect({ layers: detectedLayers, warnings, zipName: fileName })
      }
    } catch {
      window.alert("No s'ha pogut llegir el shapefile")
    } finally {
      event.target.value = ''
    }
  }

  const handleShapefileLayerSelect = (index) => {
    if (!pendingShapefileSelect) return
    const layer = pendingShapefileSelect.layers[index]
    setPendingShapefileSelect(null)
    openSourceImportFromGeojson(layer.geojson, layer.name, 'shapefile')
  }

  const handleShapefileLayerSelectCancel = () => {
    setPendingShapefileSelect(null)
  }

  const handleImportGpkgClick = () => {
    importGpkgInputRef.current?.click()
  }

  const handleImportGpkgFileChange = async (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    try {
      const result = await openGpkgFile(selectedFile)

      if (result.error) {
        window.alert(result.error)
        return
      }

      // result is a GpkgHandle — store outside React state
      gpkgHandleRef.current = result

      if (result.layers.length === 1) {
        await _convertAndOpenGpkgLayer(result, 0)
      } else {
        setPendingGpkgLayers({
          layers: result.layers.map((l) => ({ name: l.name, featureCount: l.featureCount })),
          warnings: result.warnings,
          fileName: result.fileName,
        })
      }
    } catch {
      window.alert("No s'ha pogut obrir el GeoPackage")
    } finally {
      event.target.value = ''
    }
  }

  const _convertAndOpenGpkgLayer = async (handle, index) => {
    try {
      const layerName = handle.layers[index].name
      const geojson = await handle.convertLayer(index)
      handle.close()
      gpkgHandleRef.current = null
      openSourceImportFromGeojson(geojson, layerName, 'gpkg')
    } catch (err) {
      handle.close()
      gpkgHandleRef.current = null
      window.alert(`Error convertint la capa: ${err?.message || 'error desconegut'}`)
    }
  }

  const handleGpkgLayerSelect = async (indices) => {
    const handle = gpkgHandleRef.current
    if (!handle) return
    setPendingGpkgLayers(null)

    if (indices.length === 1) {
      await _convertAndOpenGpkgLayer(handle, indices[0])
      return
    }

    // Multi-layer: convert sequentially, batch-add without SourceImportDialog
    const newSources = []
    const newDatasets = []
    const newLayers = []
    const errors = []

    for (const index of indices) {
      const layerName = handle.layers[index].name
      try {
        const geojson = await handle.convertLayer(index)
        const meta = readGeoJSONMeta(geojson)
        if (!meta) {
          errors.push(`${layerName}: sense geometries vàlides`)
          continue
        }

        const sourceId = `src-${Date.now()}-${Math.round(Math.random() * 1e8)}`
        storeSourceFeatures(sourceId, meta.rawFeatures)

        const dataset = createDatasetFromSource(sourceId, {})
        const sourceRecord = { id: sourceId, type: 'gpkg', fileName: layerName, meta }

        const effectiveGeomType = meta.geometryType === 'mixed' ? 'polygon' : meta.geometryType
        const layerColor =
          effectiveGeomType === 'polygon' ? '#2f7de1'
          : effectiveGeomType === 'line' ? '#ea8b1f'
          : '#d4335b'
        const layerId = `src-layer-${Date.now()}-${Math.round(Math.random() * 1e8)}`

        newSources.push(sourceRecord)
        newDatasets.push(dataset)
        newLayers.push({
          id: layerId,
          name: layerName,
          color: layerColor,
          geometryType: effectiveGeomType,
          visible: true,
          legendLabel: layerName,
          style: getDefaultLayerStyle(effectiveGeomType, layerColor),
          features: [],
          type: 'source',
          datasetId: dataset.id,
          sourceId,
          meta: {
            totalFeatureCount: meta.featureCount,
            loadedFeatureCount: dataset.featureCount,
            fields: meta.fields ?? [],
          },
          legend: {
            title: layerName,
            showCounts: false,
            orderMode: 'manual',
            visible: true,
          },
        })
      } catch (err) {
        errors.push(`${layerName}: ${err?.message || 'error desconegut'}`)
      }
    }

    handle.close()
    gpkgHandleRef.current = null

    if (newLayers.length > 0) {
      setSources((s) => [...s, ...newSources])
      setDatasets((d) => [...d, ...newDatasets])
      setLayers((currentLayers) => ensureInitialPointLayer([...currentLayers, ...newLayers]))
      setEditableLayerId(newLayers[newLayers.length - 1].id)
    }

    if (errors.length > 0) {
      const okMsg = newLayers.length > 0
        ? `${newLayers.length} capa(es) importada(es) correctament.`
        : 'Cap capa importada.'
      window.alert(`${okMsg}\n\nErrors:\n${errors.join('\n')}`)
    }
  }

  const handleGpkgLayerSelectCancel = () => {
    const handle = gpkgHandleRef.current
    if (handle) { handle.close(); gpkgHandleRef.current = null }
    setPendingGpkgLayers(null)
  }

  const doImportGeoJSON = (geojsonData, fileName) => {
    const importedLayers = buildImportedLayersFromGeoJSON(geojsonData, fileName)

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

    const firstImported =
      importedLayers.pointLayer || importedLayers.lineLayer || importedLayers.polygonLayer
    if (firstImported) {
      setEditableLayerId(firstImported.id)
    }
  }

  const handleGeoJSONImportConfirm = ({ mode, municipalityGeometry }) => {
    if (!pendingGeoJSONImport) return
    const { parsedData, fileName } = pendingGeoJSONImport

    let dataToImport = parsedData

    if (mode === IMPORT_MODES.VIEWPORT || mode === IMPORT_MODES.MUNICIPALITY) {
      let areaFeature = null
      if (mode === IMPORT_MODES.VIEWPORT && mapInstanceRef.current) {
        areaFeature = getImportAreaFromViewport(mapInstanceRef.current.getBounds())
      } else if (mode === IMPORT_MODES.MUNICIPALITY && municipalityGeometry) {
        areaFeature = getImportAreaFromGeoJSONGeometry(municipalityGeometry)
      }

      if (areaFeature) {
        const allFeatures = normalizeGeoJSONInput(parsedData) || []
        const filteredFeatures = filterFeaturesByArea(allFeatures, areaFeature)
        dataToImport = { type: 'FeatureCollection', features: filteredFeatures }
      }
    }

    setPendingGeoJSONImport(null)
    doImportGeoJSON(dataToImport, fileName)
  }

  const handleGeoJSONImportCancel = () => {
    setPendingGeoJSONImport(null)
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

  const handleLayerStyleModeChange = (layerId, mode) => {
    setLayers((prev) => prev.map((l) => (l.id !== layerId ? l : { ...l, styleMode: mode })))
  }

  const handleLayerCategoricalChange = (layerId, partial) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l
        if (partial._applyPreset) {
          const { preset, recommendedField } = partial
          const targetField = recommendedField || l.categorical?.field
          if (!targetField) return l

          // Generate categories from dataset using the preset's palette
          let cats = generateCategoriesFromDataset(
            l.datasetId,
            targetField,
            preset.defaultPalette ?? 'default',
            allPalettes,
          )

          // Apply mappings: override label and color for known values
          if (preset.mappings) {
            cats = cats.map((cat) => {
              const key = cat.value == null ? '__null__' : String(cat.value)
              const mapping = preset.mappings[key] ?? preset.mappings[String(cat.value)]
              if (!mapping) return cat
              return {
                ...cat,
                label: mapping.label ?? cat.label,
                ...(mapping.color != null
                  ? { color: mapping.color, fillColor: null, strokeColor: null }
                  : {}),
              }
            })
          }

          // Apply dictionary if the preset specifies one (e.g., dictionaryId: 'siose')
          if (preset.dictionaryId) {
            const dict = ALL_DICTIONARIES.find((d) => d.id === preset.dictionaryId)
            if (dict) {
              const { categories: dictCats } = applyDictionaryToCategories(cats, dict)
              cats = dictCats
            }
          }

          return {
            ...l,
            categorical: { field: targetField, categories: cats },
            legend: {
              ...(l.legend ?? {}),
              title: preset.legendTitle || l.legend?.title || l.name,
            },
          }
        }

        if (partial._applyDictionary) {
          const { dictionary } = partial
          const current = (l.categorical?.categories ?? []).map(normalizeCategory)
          const { categories: next } = applyDictionaryToCategories(current, dictionary)
          return { ...l, categorical: { ...(l.categorical ?? {}), categories: next } }
        }

        if (partial._applyCV05Dictionary) {
          const { dictionary, field: dictField } = partial
          const current = (l.categorical?.categories ?? []).map(normalizeCategory)
          const next = current.map((cat) => {
            if (cat.value == null) return cat
            const translated = translateCv05Value({ dictionary, field: dictField, value: cat.value })
            return translated != null ? { ...cat, label: translated } : cat
          })
          return {
            ...l,
            categorical: { ...(l.categorical ?? {}), field: dictField, categories: next },
          }
        }

        if (partial._generate) {
          const generated = generateCategoriesFromDataset(
            l.datasetId,
            partial.field,
            partial.paletteId ?? 'default',
            allPalettes,
          )
          return { ...l, categorical: { field: partial.field, categories: generated } }
        }
        if (partial._applyPalette) {
          const current = (l.categorical?.categories ?? []).map(normalizeCategory)
          const next = applyPaletteToCategories(current, partial.paletteId, partial.invert ?? false, allPalettes)
          return { ...l, categorical: { ...(l.categorical ?? {}), categories: next } }
        }
        if (partial._updateCatStyle) {
          return {
            ...l,
            categorical: {
              ...(l.categorical ?? {}),
              categoricalStyle: { ...(l.categorical?.categoricalStyle ?? {}), ...partial.categoricalStyle },
            },
          }
        }
        const { _generate: _g, _applyPalette: _ap, _updateCatStyle: _ucs, ...rest } = partial
        return { ...l, categorical: { ...(l.categorical ?? {}), ...rest } }
      }),
    )
  }

  const handleLayerLegendChange = (layerId, partialLegend) => {
    setLayers((prev) =>
      prev.map((l) =>
        l.id !== layerId ? l : { ...l, legend: { ...(l.legend ?? {}), ...partialLegend } },
      ),
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

      if (layerToDelete.type === 'source') {
        if (layerToDelete.datasetId) removeDataset(layerToDelete.datasetId)
        if (layerToDelete.sourceId) removeSource(layerToDelete.sourceId)
        setSources((s) => s.filter((src) => src.id !== layerToDelete.sourceId))
        setDatasets((d) => d.filter((ds) => ds.id !== layerToDelete.datasetId))
      }

      return nextLayers
    })
  }

  return (
    <div className="editor-shell">
      {pendingGeoJSONImport ? (
        <GeoJsonImportDialog
          fileName={pendingGeoJSONImport.fileName}
          featureCount={pendingGeoJSONImport.featureCount}
          onConfirm={handleGeoJSONImportConfirm}
          onCancel={handleGeoJSONImportCancel}
        />
      ) : null}
      {pendingSourceImport ? (
        <SourceImportDialog
          fileName={pendingSourceImport.fileName}
          meta={pendingSourceImport.meta}
          onConfirm={handleSourceImportConfirm}
          onCancel={handleSourceImportCancel}
        />
      ) : null}
      {pendingShapefileSelect ? (
        <ShapefileLayerSelectDialog
          layers={pendingShapefileSelect.layers}
          warnings={pendingShapefileSelect.warnings}
          zipName={pendingShapefileSelect.zipName}
          onConfirm={handleShapefileLayerSelect}
          onCancel={handleShapefileLayerSelectCancel}
        />
      ) : null}
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
      <input
        ref={importShapefileInputRef}
        type="file"
        accept=".zip"
        style={{ display: 'none' }}
        onChange={handleImportShapefileFileChange}
      />
      <input
        ref={importGpkgInputRef}
        type="file"
        accept=".gpkg"
        style={{ display: 'none' }}
        onChange={handleImportGpkgFileChange}
      />
      {pendingGpkgLayers ? (
        <GpkgLayerSelectDialog
          layers={pendingGpkgLayers.layers}
          warnings={pendingGpkgLayers.warnings}
          fileName={pendingGpkgLayers.fileName}
          onConfirm={handleGpkgLayerSelect}
          onCancel={handleGpkgLayerSelectCancel}
        />
      ) : null}
      {showPaletteManager ? (
        <PaletteManagerDialog
          palettes={projectPalettes}
          onChange={setProjectPalettes}
          onClose={() => setShowPaletteManager(false)}
        />
      ) : null}
      {showLibraryDialog ? (
        <LibraryDialog
          onClose={() => setShowLibraryDialog(false)}
          onImport={handleLibraryImport}
        />
      ) : null}
      <TopBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        basemapOptions={basemapOptions}
        selectedBasemapId={selectedBasemap.id}
        onBasemapChange={setSelectedBasemapId}
        onMunicipalitySelect={handleMunicipalitySelect}
        onAddMunicipalityLayer={handleAddMunicipalityLayer}
        onOpenProject={handleOpenProjectClick}
        onImportGeoJSON={handleImportGeoJSONClick}
        onImportShapefile={handleImportShapefileClick}
        onImportGpkg={handleImportGpkgClick}
        onExportVisibleGeoJSON={handleExportVisibleGeoJSON}
        onExportPNG={handleExportPNG}
        onExportProject={handleExportProject}
        onExportWebProject={handleExportWebProject}
        onExportAllLayers={handleExportAllLayers}
        onExportPDFSimple={handleExportPDFSimple}
        onExportBasemapHD={handleExportBasemapHD}
      />

      <main className="workspace">
        <LayersPanel
          layers={layers}
          groups={groups}
          editableLayerId={editableLayerId}
          onSetEditableLayer={handleSetEditableLayer}
          onLayerVisibilityChange={handleLayerVisibilityChange}
          onCreatePointLayer={handleCreatePointLayer}
          onCreateLineLayer={handleCreateLineLayer}
          onCreatePolygonLayer={handleCreatePolygonLayer}
          onRenameLayer={handleRenameLayer}
          onCreateGroup={handleCreateGroup}
          onRenameGroup={handleRenameGroup}
          onDeleteGroup={handleDeleteGroup}
          onGroupVisibilityChange={handleGroupVisibilityChange}
          onToggleGroupCollapse={handleToggleGroupCollapse}
          onSetLayerGroup={handleSetLayerGroup}
          onUpdateGroupLegend={handleUpdateGroupLegend}
          onUpdateGroupStyleOverride={handleUpdateGroupStyleOverride}
          onOpenLibrary={() => setShowLibraryDialog(true)}
        />
        <section className="map-workspace">
          <MapToolbarSimple
            activeWorkModeId={activeWorkModeId}
            editableLayerGeometryType={editableLayer?.geometryType ?? null}
            onModeChange={handleWorkModeChange}
            bearing={effectiveBearing}
            onRotate={handleBearingRotate}
            onReset={handleBearingReset}
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
          {(() => {
            const lpos = legendLayout.position ?? 'inside'
            const isColumn = lpos === 'right' || lpos === 'left'
            const isBottom = lpos === 'bottom'
            const showExternalLegend = isColumn || isBottom
            const wrapClass = isColumn
              ? `map-area-wrap map-area-wrap--${lpos}`
              : isBottom
                ? 'map-area-wrap map-area-wrap--bottom'
                : 'map-area-wrap'

            const mapCanvasEl = (
              <MapCanvas
                selectedBasemap={selectedBasemap}
                activeWorkModeId={activeWorkModeId}
                bearing={effectiveBearing}
                mapCenter={mapView.center}
                mapZoom={mapView.zoom}
                mapNavigationRequest={mapNavigationRequest}
                pointFeatures={visiblePointFeatures}
                lineFeatures={visibleLineFeatures}
                polygonFeatures={visiblePolygonFeatures}
                sourceLayers={visibleSourceLayers}
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
                onSourceFeatureClick={handleSourceFeatureClick}
                selectedSourceFeature={selectedSourceFeature}
                focusMask={focusMask}
                legendEntries={showExternalLegend || lpos === 'none' ? [] : legendEntries}
                legendLayout={legendLayout}
              />
            )

            const legendColumnEl = showExternalLegend ? (
              <div
                className={`legend-column legend-column--${lpos}`}
                style={isColumn ? { width: legendLayout.width } : undefined}
              >
                <LegendPanel
                  entries={legendEntries}
                  layout={legendLayout}
                  isHorizontal={isBottom}
                />
              </div>
            ) : null

            return (
              <div className={wrapClass}>
                {lpos === 'left' && legendColumnEl}
                {mapCanvasEl}
                {lpos !== 'left' && legendColumnEl}
              </div>
            )
          })()}
        </section>
        <div className="right-panel-slot">
          <div className="rp-tab-bar">
            <button
              type="button"
              className={`rp-tab${rightPanelTab === 'layer' ? ' rp-tab--active' : ''}`}
              onClick={() => setRightPanelTab('layer')}
            >
              Capa
            </button>
            <button
              type="button"
              className={`rp-tab${rightPanelTab === 'map' ? ' rp-tab--active' : ''}`}
              onClick={() => setRightPanelTab('map')}
            >
              Llegenda
            </button>
          </div>

          {rightPanelTab === 'layer' ? (
            selectedSourceFeature ? (
              <SelectedSourceFeaturePanel
                key={`${selectedSourceFeature.layerId}-${selectedSourceFeature.featureKey}`}
                feature={selectedSourceFeature.feature}
                featureKey={selectedSourceFeature.featureKey}
                layer={layers.find((l) => l.id === selectedSourceFeature.layerId)}
                onClose={handleSourceFeatureDeselect}
                onFeatureOverrideChange={handleFeatureOverrideChange}
              />
            ) : selectedFeatureData ? (
              <FeatureInspector
                key={`${selectedFeatureData.layer.id}-${selectedFeatureData.feature.id}`}
                feature={selectedFeatureData.feature}
                layer={selectedFeatureData.layer}
                onUpdate={handleFeatureUpdate}
                onClose={handleFeatureDeselect}
              />
            ) : editableLayer ? (
              <LayerInspector
                key={editableLayer.id}
                layer={editableLayer}
                layerIndex={editableLayerIndex}
                totalLayers={vectorLayers.length}
                groups={groups}
                focusMask={focusMask}
                onRenameLayer={handleRenameLayer}
                onLayerStyleChange={handleLayerStyleChange}
                onLayerStyleModeChange={handleLayerStyleModeChange}
                onLayerCategoricalChange={handleLayerCategoricalChange}
                onLayerLegendChange={handleLayerLegendChange}
                onFeatureOverrideChange={handleFeatureOverrideChange}
                projectPalettes={projectPalettes}
                onManagePalettes={() => setShowPaletteManager(true)}
                onMoveLayerUp={handleMoveLayerUp}
                onMoveLayerDown={handleMoveLayerDown}
                onExportLayerGeoJSON={handleExportLayerGeoJSON}
                onExportLayerSVG={handleExportLayerSVG}
                onExportLayerHybrid={handleExportHybrid}
                onDeleteLayer={handleDeleteLayer}
                onSetLayerGroup={handleSetLayerGroup}
                onToggleLayerInMask={handleToggleLayerInMask}
                onMaskOpacityChange={handleMaskOpacityChange}
                onMaskColorChange={handleMaskColorChange}
              />
            ) : (
              <aside className="panel panel-right inspector-empty">
                <p className="inspector-empty-state">Selecciona una capa per editar les propietats</p>
              </aside>
            )
          ) : (
            <LegendConfigPanel
              layout={normalizeLegendLayout(legendLayout)}
              onChange={setLegendLayout}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
