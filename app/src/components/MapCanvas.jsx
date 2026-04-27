import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet-rotate'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { getTileLayerProps } from '../modules/maps'
import { resolveIcon } from '../modules/layers'
import { getTablerIconSvgContent } from '../icons/tablerIconResolver'
import { resolveFaIcon } from '../icons/faIconResolver'
import { getDatasetFeatures } from '../modules/sources/sourceStore'
import { filterByViewportBbox } from '../modules/sources/bboxFilter'
import { leafletStyleForCategory } from '../modules/sources/categoricalStyle'
import { getFeatureKey } from '../modules/sources/featureKey'
import MapLegendOverlay from './MapLegendOverlay'

const DEFAULT_CENTER = [40.4168, -3.7038]
const DEFAULT_ZOOM = 6

function getDashArray(dashStyle) {
  if (dashStyle === 'dashed') {
    return '10,8'
  }

  if (dashStyle === 'dotted') {
    return '2,8'
  }

  return undefined
}

function getLayerPaneName(layerId) {
  return `user-layer-${String(layerId).replace(/[^a-zA-Z0-9-_]/g, '_')}`
}

function MapClickHandler({
  canAddPoint,
  canAddLine,
  canAddPolygon,
  onPointAdd,
  onLinePointAdd,
  onPolygonPointAdd,
}) {
  useMapEvents({
    click(event) {
      if (canAddPoint) {
        const { lat, lng } = event.latlng
        onPointAdd?.([lat, lng])
        return
      }

      if (canAddLine) {
        const { lat, lng } = event.latlng
        onLinePointAdd?.([lat, lng])
        return
      }

      if (canAddPolygon) {
        const { lat, lng } = event.latlng
        onPolygonPointAdd?.([lat, lng])
      }
    },
  })

  return null
}

function MapCursorHandler({ isDrawMode, hasSelectableSourceLayers }) {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const cursorValue = isDrawMode ? 'crosshair' : hasSelectableSourceLayers ? 'pointer' : ''

    container.style.cursor = cursorValue
    container.querySelectorAll('.leaflet-pane, .leaflet-interactive').forEach((el) => {
      el.style.cursor = cursorValue
    })

    return () => {
      container.style.cursor = ''
      container
        .querySelectorAll('.leaflet-pane, .leaflet-interactive')
        .forEach((el) => {
          el.style.cursor = ''
        })
    }
  }, [isDrawMode, hasSelectableSourceLayers, map])

  return null
}

function MapHoverHandler({ isDrawMode, onHoverChange }) {
  useMapEvents({
    mousemove(event) {
      if (!isDrawMode) {
        return
      }

      const { lat, lng } = event.latlng
      onHoverChange?.([lat, lng])
    },
    mouseout() {
      onHoverChange?.(null)
    },
  })

  useEffect(() => {
    if (!isDrawMode) {
      onHoverChange?.(null)
    }
  }, [isDrawMode, onHoverChange])

  return null
}

function MapViewHandler({ onViewChange }) {
  const map = useMapEvents({
    moveend() {
      const center = map.getCenter()
      const b = map.getBounds()
      onViewChange?.({
        center: [center.lat, center.lng],
        zoom: map.getZoom(),
        // [west, south, east, north] — compatible with bboxFilter viewport format
        bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
      })
    },
  })

  return null
}

function BearingSync({ bearing }) {
  const map = useMap()
  useEffect(() => {
    if (typeof map.setBearing === 'function') {
      map.setBearing(bearing ?? 0)
    }
  }, [bearing, map])
  return null
}

function MapInstanceBridge({ onMapReady }) {
  const map = useMap()

  useEffect(() => {
    onMapReady?.(map)
  }, [map, onMapReady])

  return null
}

function MapViewSync({ center, zoom, navigationRequest }) {
  const map = useMap()

  useEffect(() => {
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom()
    const hasSameCenter =
      Math.abs(currentCenter.lat - center[0]) < 1e-9 &&
      Math.abs(currentCenter.lng - center[1]) < 1e-9
    const hasSameZoom = currentZoom === zoom

    if (hasSameCenter && hasSameZoom) {
      return
    }

    map.setView(center, zoom, { animate: false })
  }, [center, map, zoom])

  useEffect(() => {
    if (!navigationRequest || !navigationRequest.id) {
      return
    }

    if (
      navigationRequest.type === 'fitBounds' &&
      Array.isArray(navigationRequest.bounds)
    ) {
      map.fitBounds(navigationRequest.bounds, { padding: [24, 24] })
      return
    }

    if (
      navigationRequest.type === 'setView' &&
      Array.isArray(navigationRequest.center)
    ) {
      map.setView(navigationRequest.center, navigationRequest.zoom ?? 12, {
        animate: false,
      })
    }
  }, [map, navigationRequest])

  return null
}

function MapLayerPanes({ orderedLayerIds }) {
  const map = useMap()

  useEffect(() => {
    // When leaflet-rotate is active it creates _rotatePane inside _mapPane.
    // Custom panes must live inside _rotatePane so they receive the same CSS
    // rotation as tiles and default overlays. Falls back to undefined (default
    // Leaflet behaviour: panes go directly into _mapPane) when rotation is off.
    const rotateContainer = map._rotatePane || undefined

    const ensurePane = (name, container) => {
      let pane = map.getPane(name)
      if (!pane) {
        pane = map.createPane(name, container)
      } else if (container && pane.parentNode !== container) {
        container.appendChild(pane)
      }
      return pane
    }

    // User layer panes sit BELOW Leaflet's markerPane (600) and above overlayPane (400).
    // This is critical: canvas elements in user layer panes must not sit above the
    // markerPane because canvas blocks all pointer events, even when interactive:false.
    // Markers are DOM elements in markerPane (600) and are always reachable.
    orderedLayerIds.forEach((layerId, index) => {
      const paneName = getLayerPaneName(layerId)
      const pane = ensurePane(paneName, rotateContainer)
      pane.style.zIndex = String(420 + (orderedLayerIds.length - index))
    })

    // interaction-pane uses SVG renderer (pointer-events:none on <svg> container,
    // only individual <path> elements capture events). Placed above markerPane so
    // line/polygon hit targets are reachable, but Marker clicks pass through the SVG.
    const interactionPane = ensurePane('interaction-pane', rotateContainer)
    interactionPane.style.zIndex = '620'

    // mask-pane sits above all data layers (420–450) but below markers (600).
    // pointer-events are none on the mask polygon so clicks pass through.
    const maskPane = ensurePane('mask-pane', rotateContainer)
    maskPane.style.zIndex = '490'

    // selection-pane: highlight ring for selected source features. Above source
    // layers (420–450) and mask-pane (490), below markers (600).
    const selectionPane = ensurePane('selection-pane', rotateContainer)
    selectionPane.style.zIndex = '495'
  }, [map, orderedLayerIds])

  return null
}

// World bounding box used as the outer ring of the inverted mask polygon.
const WORLD_BBOX = [[-90, -180], [-90, 180], [90, 180], [90, -180]]

/**
 * Returns the outer ring(s) of a polygon latlngs in all three internal formats:
 *   Ring-format Polygon:  latlngs = [[outerRing], [hole], ...]   → [outerRing]
 *   Flat-format Polygon:  latlngs = [[lat,lng], ...]             → [latlngs]
 *   MultiPolygon:         latlngs = [[[outerRing],...], ...]     → [outerRing, outerRing, ...]
 */
function getOuterRings(latlngs) {
  const isMulti = Array.isArray(latlngs?.[0]?.[0]?.[0])
  if (isMulti) return latlngs.map((rings) => rings[0])
  const isRingFormat = Array.isArray(latlngs?.[0]?.[0])
  if (isRingFormat) return [latlngs[0]]
  return [latlngs]
}

function getLayerStyleSignature(layer) {
  let base
  if (layer.styleMode === 'categorical' && layer.categorical?.field) {
    const { field, categories = [], categoricalStyle } = layer.categorical
    const colorStr = categories
      .map((c) => `${c.value}:${c.color ?? c.style?.color ?? ''}:${c.visible !== false ? 1 : 0}`)
      .join('|')
    const cs = categoricalStyle ?? {}
    const styleStr = `${cs.fillOpacity}:${cs.strokeOpacity}:${cs.strokeWidth}:${cs.dashStyle}:${cs.strokeMode}:${cs.fixedStrokeColor}`
    base = `cat:${field}:${colorStr}:${styleStr}`
  } else {
    const s = layer.style ?? {}
    if (layer.geometryType === 'polygon') {
      base = `s:${s.strokeColor}:${s.strokeWidth}:${s.strokeOpacity}:${s.fillColor}:${s.fillOpacity}:${s.dashStyle}`
    } else if (layer.geometryType === 'line') {
      base = `s:${s.color}:${s.width}:${s.opacity}:${s.dashStyle}`
    } else {
      base = `s:${s.fillColor}:${s.fillOpacity}:${s.strokeColor}:${s.strokeWidth}:${s.size}`
    }
  }
  const ovEntries = Object.entries(layer.featureOverrides ?? {})
  if (ovEntries.length > 0) {
    const ovStr = ovEntries
      .map(([k, v]) => `${k}:${v?.fillColor ?? ''}:${v?.fillOpacity ?? ''}:${v?.strokeColor ?? ''}:${v?.strokeOpacity ?? ''}:${v?.strokeWidth ?? ''}`)
      .join('|')
    return `${base}:ov:${ovStr}`
  }
  return base
}

function applyFeatureOverride(baseStyle, override, geometryType) {
  if (!override) return baseStyle
  const merged = { ...baseStyle }
  // Only apply a field when it is explicitly set (not undefined, not empty string).
  // undefined !== '' evaluates to true, which caused NaN to be written to opacity/weight.
  const has = (v) => v != null && v !== ''
  if (has(override.fillColor)) merged.fillColor = override.fillColor
  if (has(override.fillOpacity)) merged.fillOpacity = Number(override.fillOpacity)
  if (has(override.strokeColor)) merged.color = override.strokeColor
  if (has(override.strokeOpacity)) merged.opacity = Number(override.strokeOpacity)
  if (has(override.strokeWidth)) merged.weight = Number(override.strokeWidth)
  return merged
}

// ─── Point-in-polygon (GeoJSON coordinate space: [lng, lat]) ─────────────────

function pointInRing(pt, ring) {
  const [x, y] = pt
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function pointInGeoJSONPolygon(pt, coords) {
  if (!pointInRing(pt, coords[0])) return false
  for (let i = 1; i < coords.length; i++) {
    if (pointInRing(pt, coords[i])) return false // inside a hole
  }
  return true
}

function pointInGeoJSONFeature(pt, geometry) {
  if (!geometry) return false
  if (geometry.type === 'Polygon') return pointInGeoJSONPolygon(pt, geometry.coordinates)
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((coords) => pointInGeoJSONPolygon(pt, coords))
  }
  return false
}

// ─── Map-level click handler for source layer feature selection ───────────────
// Keeps source layers interactive:false (canvas/pane issues avoided) and
// does hit-testing on the raw GeoJSON data instead.

function MapSourceFeatureClickHandler({ sourceLayers, isSelectMode, onSourceFeatureClick }) {
  const map = useMap()
  useMapEvents({
    click(e) {
      if (!isSelectMode) return
      const { lat, lng } = e.latlng
      const pt = [lng, lat] // GeoJSON order: [longitude, latitude]

      const bounds = map.getBounds()
      const viewport = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]

      // Iterate layers top-to-bottom (last in array = highest z-order rendered first)
      for (const layer of [...sourceLayers].reverse()) {
        if (layer.geometryType !== 'polygon') continue
        const allFeatures = getDatasetFeatures(layer.datasetId) ?? []
        // Pre-filter to viewport to keep hit-testing fast
        const candidates = filterByViewportBbox(allFeatures, viewport)
        for (const feature of candidates) {
          if (pointInGeoJSONFeature(pt, feature?.geometry)) {
            // getFeatureKey uses _srcIdx (embedded by storeDatasetFeatures) for stable key
            const key = getFeatureKey(feature)
            console.log('[source select] key:', key, '| override:', layer.featureOverrides?.[key] ?? 'none') // debug
            onSourceFeatureClick?.({ layerId: layer.id, featureKey: key, feature })
            return
          }
        }
      }
      // Click on empty space — deselect
      onSourceFeatureClick?.(null)
    },
  })
  return null
}

function SourceLayerRenderer({ layer, pane }) {
  const map = useMap()
  const [moveCount, setMoveCount] = useState(0)

  useMapEvents({
    moveend() {
      setMoveCount((n) => n + 1)
    },
  })

  const geojsonData = useMemo(() => {
    const bounds = map.getBounds()
    const viewport = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
    const allFeatures = getDatasetFeatures(layer.datasetId)
    const visible = filterByViewportBbox(allFeatures, viewport)
    return { type: 'FeatureCollection', features: visible }
  }, [layer.datasetId, moveCount, map])

  const isCategorical = layer.styleMode === 'categorical' && !!layer.categorical?.field

  const categoryMap = useMemo(() => {
    if (!isCategorical) return null
    const m = new Map()
    for (const cat of layer.categorical.categories ?? []) {
      const key = cat.value == null ? '__null__' : String(cat.value)
      m.set(key, cat)
    }
    return m
  }, [isCategorical, layer.categorical])

  const catStyle = isCategorical ? layer.categorical?.categoricalStyle : null

  const getFeatureStyle = useCallback(
    (feature) => {
      const fKey = getFeatureKey(feature)
      const override = layer.featureOverrides?.[fKey]
      if (override) console.log('[render] override applied for key:', fKey, override) // debug

      let base
      if (isCategorical && categoryMap) {
        const val = feature?.properties?.[layer.categorical.field]
        const catKey = val == null ? '__null__' : String(val)
        base = leafletStyleForCategory(categoryMap.get(catKey), layer.geometryType, catStyle)
      } else {
        const s = layer.style || {}
        if (layer.geometryType === 'polygon') {
          base = {
            color: s.strokeColor || layer.color || '#2f7de1',
            weight: s.strokeWidth ?? 2,
            opacity: s.strokeOpacity ?? 1,
            fillColor: s.fillColor || layer.color || '#2f7de1',
            fillOpacity: s.fillOpacity ?? 0.18,
            dashArray: s.dashStyle === 'dashed' ? '10,8' : s.dashStyle === 'dotted' ? '2,8' : undefined,
          }
        } else if (layer.geometryType === 'line') {
          base = {
            color: s.color || layer.color || '#ea8b1f',
            weight: s.width || 3,
            opacity: s.opacity ?? 1,
            dashArray: s.dashStyle === 'dashed' ? '10,8' : s.dashStyle === 'dotted' ? '2,8' : undefined,
          }
        } else {
          base = {}
        }
      }
      return applyFeatureOverride(base, override, layer.geometryType)
    },
    [isCategorical, categoryMap, layer, catStyle],
  )

  const pointToLayer = useCallback(
    (feature, latlng) => {
      if (isCategorical && categoryMap) {
        const val = feature?.properties?.[layer.categorical.field]
        const key = val == null ? '__null__' : String(val)
        const base = leafletStyleForCategory(categoryMap.get(key), 'point', catStyle)
        const override = layer.featureOverrides?.[getFeatureKey(feature)]
        return L.circleMarker(latlng, applyFeatureOverride(base, override, 'point'))
      }
      const s = layer.style || {}
      const radius = s.size ? Math.max(1, s.size / 2) : 6
      return L.circleMarker(latlng, {
        radius,
        fillColor: s.fillColor || layer.color || '#d4335b',
        fillOpacity: s.fillOpacity ?? 0.9,
        color: s.strokeColor || layer.color || '#d4335b',
        weight: s.strokeWidth ?? 2,
        opacity: s.strokeOpacity ?? 1,
      })
    },
    [isCategorical, categoryMap, layer, catStyle],
  )

  if (!geojsonData.features.length) return null

  return (
    <GeoJSON
      key={`src-${layer.id}-${moveCount}-${getLayerStyleSignature(layer)}`}
      data={geojsonData}
      style={getFeatureStyle}
      pointToLayer={pointToLayer}
      pane={pane}
      interactive={false}
    />
  )
}

function MapCanvas({
  selectedBasemap,
  activeWorkModeId = 'select',
  bearing = 0,
  mapCenter = DEFAULT_CENTER,
  mapZoom = DEFAULT_ZOOM,
  mapNavigationRequest = null,
  pointFeatures = [],
  lineFeatures = [],
  polygonFeatures = [],
  sourceLayers = [],
  visibleLayerOrder = [],
  selectedMunicipalityGeometry = null,
  draftLinePoints = [],
  draftPolygonPoints = [],
  editableLayerId = null,
  selectedFeature = null,
  focusMask = null,
  onPointAdd,
  onPointDelete,
  onPointMove,
  onFeatureSelect,
  onLineDelete,
  onPolygonDelete,
  onDraftLinePointAdd,
  onDraftPolygonPointAdd,
  onViewChange,
  onMapReady,
  onSourceFeatureClick,
  selectedSourceFeature = null,
  legendEntries = [],
  legendLayout = null,
}) {
  const tileLayerProps = getTileLayerProps(selectedBasemap)
  const isPointMode = activeWorkModeId === 'point'
  const isLineMode = activeWorkModeId === 'line'
  const isPolygonMode = activeWorkModeId === 'polygon'
  const isSelectMode = activeWorkModeId === 'select'
  const isDeleteMode = activeWorkModeId === 'delete'
  const isDrawMode = isPointMode || isLineMode || isPolygonMode
  const recentlyDraggedPointKeysRef = useRef(new Set())
  // SVG renderer for interaction overlays: unlike canvas, SVG pointer-events are
  // per-path, so clicks on empty space pass through to Markers beneath.
  const interactionSvgRenderer = useMemo(() => L.svg({ pane: 'interaction-pane' }), [])

  const isSelectedFeature = (feat) =>
    selectedFeature != null &&
    feat.layerId === selectedFeature.layerId &&
    feat.id === selectedFeature.featureId
  const [hoverLatLng, setHoverLatLng] = useState(null)
  const layerPanesById = useMemo(
    () =>
      Object.fromEntries(
        visibleLayerOrder.map((layerId) => [layerId, getLayerPaneName(layerId)]),
      ),
    [visibleLayerOrder],
  )

  // Resolves the pixel radius from the unified `size` (diameter) field,
  // falling back to the legacy `radius` field for old saved projects.
  const resolvePointRadius = (style) => {
    if (style?.size != null) return Math.max(1, Number(style.size) / 2)
    return Math.max(1, Number(style?.radius) || 7)
  }

  const createPointIcon = (style, isSelected = false) => {
    const markerType = style?.markerType ?? 'circle'
    const radius = resolvePointRadius(style)
    const fillColor = style?.fillColor ?? '#d4335b'
    const fillOpacity =
      Number.isFinite(Number(style?.fillOpacity)) ? Number(style.fillOpacity) : 0.9
    const strokeColor = style?.strokeColor ?? '#d4335b'
    const strokeWidth =
      Number.isFinite(Number(style?.strokeWidth)) ? Number(style.strokeWidth) : 2
    const strokeOpacity =
      Number.isFinite(Number(style?.strokeOpacity)) ? Number(style.strokeOpacity) : 1

    // Always reserve space for the selection ring so icon dimensions stay
    // stable when selection state changes.
    const pad = 9
    const totalSize = (radius + pad) * 2
    const cx = radius + pad
    const cy = radius + pad

    const selectionRing = isSelected
      ? `<circle cx="${cx}" cy="${cy}" r="${radius + 6}" fill="none" stroke="#0f4c81" stroke-width="3" stroke-opacity="0.85" />`
      : ''

    const circleEl = `<circle cx="${cx}" cy="${cy}" r="${Math.max(radius - strokeWidth / 2, 0)}" fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" />`

    let iconEl = ''
    if (markerType === 'icon-circle') {
      const iconId = style?.icon ?? null
      const iconSet = style?.iconSet ?? 'tabler'
      const iconColor = style?.iconColor ?? '#ffffff'
      // Icon occupies ~41% of the circle diameter — leaves breathing room around the edge.
      const iconDisplaySize = radius * 0.82
      const ix = cx - iconDisplaySize / 2
      const iy = cy - iconDisplaySize / 2

      if (iconSet === 'fa') {
        // Font Awesome Free — fill-based icons with variable viewBox dimensions.
        const faData = resolveFaIcon(iconId)
        if (faData) {
          iconEl = `<svg x="${ix}" y="${iy}" width="${iconDisplaySize}" height="${iconDisplaySize}" viewBox="0 0 ${faData.width} ${faData.height}"><path d="${faData.path}" fill="${iconColor}"/></svg>`
        }
      } else if (iconSet === 'tabler') {
        // Tabler Icons (legacy) — stroke-based, stroke attrs must be on the wrapper.
        const svgContent = getTablerIconSvgContent(iconId, iconColor)
        if (svgContent) {
          iconEl = `<svg x="${ix}" y="${iy}" width="${iconDisplaySize}" height="${iconDisplaySize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgContent}</svg>`
        }
      } else {
        // Legacy builtin icons (iconSet === 'builtin').
        const iconEntry = resolveIcon(iconId, iconSet)
        if (iconEntry) {
          iconEl = `<svg x="${ix}" y="${iy}" width="${iconDisplaySize}" height="${iconDisplaySize}" viewBox="0 0 24 24"><path d="${iconEntry.path}" fill="${iconColor}"/></svg>`
        }
      }
    }

    return L.divIcon({
      className: '',
      html: `<svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">${selectionRing}${circleEl}${iconEl}</svg>`,
      iconSize: [totalSize, totalSize],
      iconAnchor: [cx, cy],
    })
  }

  const handlePointClick = (point, event) => {
    // Always absorb the click on an interactive marker so it never bubbles to
    // the map's MapClickHandler (which would add a new point in create mode).
    event.originalEvent?.stopPropagation()

    if (!isSelectMode && !isDeleteMode) {
      return
    }

    if (point.layerId !== editableLayerId) {
      return
    }

    const pointKey = `${point.layerId}-${point.id}`
    if (recentlyDraggedPointKeysRef.current.has(pointKey)) {
      return
    }

    if (isSelectMode) {
      onFeatureSelect?.({ layerId: point.layerId, featureId: point.id, geometryType: 'point' })
      return
    }

    const shouldDelete = window.confirm('Eliminar punt?')
    if (!shouldDelete) {
      return
    }

    onPointDelete?.({ layerId: point.layerId, pointId: point.id })
  }

  const handlePointDragEnd = (point, event) => {
    if (!isSelectMode) {
      return
    }

    const latLng = event.target.getLatLng()
    const pointKey = `${point.layerId}-${point.id}`
    recentlyDraggedPointKeysRef.current.add(pointKey)
    setTimeout(() => recentlyDraggedPointKeysRef.current.delete(pointKey), 250)

    onPointMove?.({
      layerId: point.layerId,
      pointId: point.id,
      lat: latLng.lat,
      lng: latLng.lng,
    })
  }

  const handleLineClick = (lineFeature, event) => {
    if (!isSelectMode && !isDeleteMode) {
      return
    }

    event.originalEvent?.stopPropagation()

    if (isSelectMode) {
      onFeatureSelect?.({ layerId: lineFeature.layerId, featureId: lineFeature.id, geometryType: 'line' })
      return
    }

    const shouldDelete = window.confirm('Eliminar línia?')
    if (!shouldDelete) {
      return
    }

    onLineDelete?.({ layerId: lineFeature.layerId, lineId: lineFeature.id })
  }

  const handlePolygonClick = (polygonFeature, event) => {
    if (!isSelectMode && !isDeleteMode) {
      return
    }

    event.originalEvent?.stopPropagation()

    if (isSelectMode) {
      onFeatureSelect?.({ layerId: polygonFeature.layerId, featureId: polygonFeature.id, geometryType: 'polygon' })
      return
    }

    const shouldDelete = window.confirm('Eliminar polígon?')
    if (!shouldDelete) {
      return
    }

    onPolygonDelete?.({
      layerId: polygonFeature.layerId,
      polygonId: polygonFeature.id,
    })
  }

  return (
    <section className="map-stage" aria-label="Zona central del mapa">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
        preferCanvas
        rotate={true}
        className="map-canvas"
      >
        <BearingSync bearing={bearing} />
        <MapInstanceBridge onMapReady={onMapReady} />
        <MapLayerPanes orderedLayerIds={visibleLayerOrder} />
        <MapCursorHandler
          isDrawMode={isDrawMode}
          hasSelectableSourceLayers={
            isSelectMode && sourceLayers.some((l) => l.geometryType === 'polygon')
          }
        />
        <MapViewSync
          center={mapCenter}
          zoom={mapZoom}
          navigationRequest={mapNavigationRequest}
        />
        <MapViewHandler onViewChange={onViewChange} />
        <MapHoverHandler isDrawMode={isDrawMode} onHoverChange={setHoverLatLng} />
        <MapClickHandler
          canAddPoint={isPointMode}
          canAddLine={isLineMode}
          canAddPolygon={isPolygonMode}
          onPointAdd={onPointAdd}
          onLinePointAdd={onDraftLinePointAdd}
          onPolygonPointAdd={onDraftPolygonPointAdd}
        />
        <ZoomControl position="topright" />
        <TileLayer
          key={selectedBasemap?.id ?? 'default'}
          {...tileLayerProps}
          crossOrigin="anonymous"
        />

        {selectedMunicipalityGeometry ? (
          <GeoJSON
            data={selectedMunicipalityGeometry}
            style={{
              color: '#3b82f6',
              weight: 2,
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
            }}
            interactive={false}
          />
        ) : null}

        <MapSourceFeatureClickHandler
          sourceLayers={sourceLayers}
          isSelectMode={isSelectMode}
          onSourceFeatureClick={onSourceFeatureClick}
        />

        {sourceLayers.map((layer) => (
          <SourceLayerRenderer
            key={layer.id}
            layer={layer}
            pane={layerPanesById[layer.id]}
          />
        ))}

        {selectedSourceFeature?.feature ? (
          <GeoJSON
            key={`sel-${selectedSourceFeature.layerId}-${selectedSourceFeature.featureKey}`}
            data={{ type: 'FeatureCollection', features: [selectedSourceFeature.feature] }}
            style={() => ({
              color: '#1e40af',
              weight: 3,
              opacity: 1,
              fill: true,
              fillColor: '#3b82f6',
              fillOpacity: 0.18,
              dashArray: undefined,
            })}
            pane="selection-pane"
            interactive={false}
          />
        ) : null}

        {lineFeatures.map((lineFeature) => {
          const isSelected = isSelectedFeature(lineFeature)
          const lineLabel = lineFeature.label?.trim() || lineFeature.name?.trim() || ''
          return (
            <Fragment key={`${lineFeature.layerId}-${lineFeature.id}`}>
              <Polyline
                positions={lineFeature.latlngs}
                pane={layerPanesById[lineFeature.layerId]}
                pathOptions={{
                  color: lineFeature.style?.color || '#ea8b1f',
                  weight: lineFeature.style?.width || 3,
                  opacity: lineFeature.style?.opacity ?? 1,
                  dashArray: getDashArray(lineFeature.style?.dashStyle),
                }}
                interactive={false}
              />
              {isSelected ? (
                <Polyline
                  positions={lineFeature.latlngs}
                  pane={layerPanesById[lineFeature.layerId]}
                  pathOptions={{
                    color: '#0f4c81',
                    weight: (lineFeature.style?.width || 3) + 6,
                    opacity: 0.35,
                    dashArray: undefined,
                  }}
                  interactive={false}
                />
              ) : null}
              {(isSelectMode || isDeleteMode) && lineFeature.layerId === editableLayerId ? (
                <Polyline
                  positions={lineFeature.latlngs}
                  renderer={interactionSvgRenderer}
                  pathOptions={{
                    color: 'transparent',
                    weight: Math.max((lineFeature.style?.width || 3) + 4, 7),
                    opacity: 0,
                  }}
                  interactive
                  bubblingMouseEvents={false}
                  eventHandlers={{
                    click: (event) => handleLineClick(lineFeature, event),
                  }}
                >
                  {lineLabel ? <Tooltip sticky>{lineLabel}</Tooltip> : null}
                </Polyline>
              ) : null}
            </Fragment>
          )
        })}

        {isLineMode && draftLinePoints.length > 0 ? (
          <Polyline
            positions={draftLinePoints}
            pathOptions={{
              color: '#ea8b1f',
              weight: 3,
              dashArray: '6,6',
            }}
            interactive={false}
          />
        ) : null}

        {isLineMode && hoverLatLng && draftLinePoints.length > 0 ? (
          <Polyline
            positions={[draftLinePoints[draftLinePoints.length - 1], hoverLatLng]}
            pathOptions={{
              color: '#ea8b1f',
              weight: 2,
              dashArray: '4,6',
              opacity: 0.7,
            }}
            interactive={false}
          />
        ) : null}

        {polygonFeatures.map((polygonFeature) => {
          const isSelected = isSelectedFeature(polygonFeature)
          const polygonLabel = polygonFeature.label?.trim() || polygonFeature.name?.trim() || ''
          return (
            <Fragment key={`${polygonFeature.layerId}-${polygonFeature.id}`}>
              <Polygon
                positions={polygonFeature.latlngs}
                pane={layerPanesById[polygonFeature.layerId]}
                pathOptions={{
                  color: polygonFeature.style?.strokeColor || '#2f7de1',
                  stroke: (polygonFeature.style?.strokeWidth ?? 2) > 0,
                  weight: polygonFeature.style?.strokeWidth ?? 2,
                  opacity: polygonFeature.style?.strokeOpacity ?? 1,
                  dashArray: getDashArray(polygonFeature.style?.dashStyle),
                  fillColor: polygonFeature.style?.fillColor || '#2f7de1',
                  fill: true,
                  fillOpacity: polygonFeature.style?.fillOpacity ?? 0.18,
                }}
                interactive={false}
              />
              {isSelected ? (
                <Polygon
                  positions={polygonFeature.latlngs}
                  pane={layerPanesById[polygonFeature.layerId]}
                  pathOptions={{
                    color: '#0f4c81',
                    weight: 4,
                    opacity: 0.8,
                    fill: false,
                  }}
                  interactive={false}
                />
              ) : null}
              {(isSelectMode || isDeleteMode) && polygonFeature.layerId === editableLayerId ? (
                <Polygon
                  positions={polygonFeature.latlngs}
                  renderer={interactionSvgRenderer}
                  pathOptions={{
                    color: 'transparent',
                    weight: 10,
                    fillColor: '#000000',
                    fill: true,
                    fillOpacity: 0.01,
                  }}
                  interactive
                  bubblingMouseEvents={false}
                  eventHandlers={{
                    click: (event) => handlePolygonClick(polygonFeature, event),
                  }}
                >
                  {polygonLabel ? <Tooltip sticky>{polygonLabel}</Tooltip> : null}
                </Polygon>
              ) : null}
            </Fragment>
          )
        })}

        {isPolygonMode && draftPolygonPoints.length > 0 ? (
          <>
            <Polyline
              positions={draftPolygonPoints}
              pathOptions={{
                color: '#2f7de1',
                weight: 2,
                dashArray: '6,6',
              }}
              interactive={false}
            />
            {draftPolygonPoints.length >= 3 ? (
              <Polygon
                positions={draftPolygonPoints}
                pathOptions={{
                  color: '#2f7de1',
                  weight: 2,
                  fillColor: '#2f7de1',
                  fillOpacity: 0.12,
                  dashArray: '6,6',
                }}
                interactive={false}
              />
            ) : null}
          </>
        ) : null}

        {(() => {
          if (!focusMask?.layerIds?.length) return null
          const holes = polygonFeatures
            .filter((f) => focusMask.layerIds.includes(f.layerId) && f.latlngs)
            .flatMap((f) => getOuterRings(f.latlngs))
          if (holes.length === 0) return null
          return (
            <Polygon
              key={`mask-${focusMask.layerIds.join('-')}`}
              positions={[WORLD_BBOX, ...holes]}
              pane="mask-pane"
              pathOptions={{
                fillColor: focusMask.color ?? '#ffffff',
                fillOpacity: focusMask.opacity ?? 0.7,
                stroke: false,
              }}
              interactive={false}
            />
          )
        })()}

        {isPolygonMode && hoverLatLng && draftPolygonPoints.length > 0 ? (
          <Polyline
            positions={[
              draftPolygonPoints[draftPolygonPoints.length - 1],
              hoverLatLng,
            ]}
            pathOptions={{
              color: '#2f7de1',
              weight: 2,
              dashArray: '4,6',
              opacity: 0.7,
            }}
            interactive={false}
          />
        ) : null}

        {isDrawMode && hoverLatLng ? (
          <CircleMarker
            center={hoverLatLng}
            radius={5}
            pathOptions={{
              color: '#0f4c81',
              fillColor: '#0f4c81',
              fillOpacity: 0.25,
              weight: 2,
            }}
            interactive={false}
          />
        ) : null}

        {pointFeatures.map((point) => {
          const isEditable = point.layerId === editableLayerId
          const isSelected = isSelectedFeature(point)
          const pointTooltip = point.label?.trim() || ''
          // Editable layer Markers live in interaction-pane (620) — above all visual
          // layer canvases (420-450). Non-editable Markers stay in their user pane,
          // purely visual and non-interactive.
          const markerPane = isEditable ? 'interaction-pane' : layerPanesById[point.layerId]
          return (
            <Fragment key={`${point.layerId}-${point.id}`}>
              <Marker
                position={point.coordinates}
                icon={createPointIcon(point.style, isSelected)}
                pane={markerPane}
                interactive={isEditable}
                draggable={isEditable && isSelectMode}
                eventHandlers={{
                  click: (event) => handlePointClick(point, event),
                  dragend: (event) => handlePointDragEnd(point, event),
                }}
              >
                {pointTooltip && isEditable ? (
                  <Tooltip permanent={false}>{pointTooltip}</Tooltip>
                ) : null}
              </Marker>
            </Fragment>
          )
        })}
      </MapContainer>
      <MapLegendOverlay entries={legendEntries} layout={legendLayout ?? {}} />
    </section>
  )
}

export default MapCanvas
