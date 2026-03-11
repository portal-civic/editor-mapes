import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
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

const DEFAULT_CENTER = [40.4168, -3.7038]
const DEFAULT_ZOOM = 6
const FALLBACK_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const FALLBACK_ATTRIBUTION = '&copy; OpenStreetMap contributors'

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

function MapCursorHandler({ isDrawMode }) {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const cursorValue = isDrawMode ? 'crosshair' : ''

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
  }, [isDrawMode, map])

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
      onViewChange?.({
        center: [center.lat, center.lng],
        zoom: map.getZoom(),
      })
    },
  })

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
    orderedLayerIds.forEach((layerId, index) => {
      const paneName = getLayerPaneName(layerId)
      const pane = map.getPane(paneName) || map.createPane(paneName)
      pane.style.zIndex = String(700 + (orderedLayerIds.length - index))
    })
  }, [map, orderedLayerIds])

  return null
}

function MapCanvas({
  selectedBasemap,
  activeWorkModeId = 'select',
  mapCenter = DEFAULT_CENTER,
  mapZoom = DEFAULT_ZOOM,
  mapNavigationRequest = null,
  pointFeatures = [],
  lineFeatures = [],
  polygonFeatures = [],
  visibleLayerOrder = [],
  selectedMunicipalityGeometry = null,
  draftLinePoints = [],
  draftPolygonPoints = [],
  onPointAdd,
  onPointDelete,
  onPointMove,
  onPointUpdateLabel,
  onLineDelete,
  onLineUpdateLabel,
  onPolygonDelete,
  onPolygonUpdateLabel,
  onDraftLinePointAdd,
  onDraftPolygonPointAdd,
  onViewChange,
  onMapReady,
}) {
  const tileUrl = selectedBasemap?.url || FALLBACK_TILE_URL
  const tileAttribution = selectedBasemap?.attribution || FALLBACK_ATTRIBUTION
  const maxZoom = selectedBasemap?.maxZoom || 19
  const isPointMode = activeWorkModeId === 'point'
  const isLineMode = activeWorkModeId === 'line'
  const isPolygonMode = activeWorkModeId === 'polygon'
  const isSelectMode = activeWorkModeId === 'select'
  const isDeleteMode = activeWorkModeId === 'delete'
  const isDrawMode = isPointMode || isLineMode || isPolygonMode
  const recentlyDraggedPointKeysRef = useRef(new Set())
  const [hoverLatLng, setHoverLatLng] = useState(null)
  const layerPanesById = useMemo(
    () =>
      Object.fromEntries(
        visibleLayerOrder.map((layerId) => [layerId, getLayerPaneName(layerId)]),
      ),
    [visibleLayerOrder],
  )

  const createPointIcon = (style) => {
    const radius = Math.max(1, Number(style?.radius) || 7)
    const diameter = radius * 2
    const fillColor = style?.fillColor || '#d4335b'
    const fillOpacity =
      Number.isFinite(Number(style?.fillOpacity)) ? Number(style.fillOpacity) : 0.9
    const strokeColor = style?.strokeColor || '#d4335b'
    const strokeWidth =
      Number.isFinite(Number(style?.strokeWidth)) ? Number(style.strokeWidth) : 2
    const strokeOpacity =
      Number.isFinite(Number(style?.strokeOpacity))
        ? Number(style.strokeOpacity)
        : 1

    return L.divIcon({
      className: '',
      html: `<svg width="${diameter}" height="${diameter}" viewBox="0 0 ${diameter} ${diameter}" xmlns="http://www.w3.org/2000/svg"><circle cx="${radius}" cy="${radius}" r="${Math.max(
        radius - strokeWidth / 2,
        0,
      )}" fill="${fillColor}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" /></svg>`,
      iconSize: [diameter, diameter],
      iconAnchor: [radius, radius],
    })
  }

  const handlePointClick = (point, event) => {
    if (!isSelectMode && !isDeleteMode) {
      return
    }

    const pointKey = `${point.layerId}-${point.id}`
    if (recentlyDraggedPointKeysRef.current.has(pointKey)) {
      return
    }

    event.originalEvent?.stopPropagation()

    if (isSelectMode) {
      const currentLabel = typeof point.label === 'string' ? point.label : ''
      const nextLabelInput = window.prompt('Text del punt:', currentLabel)
      if (nextLabelInput === null) {
        return
      }

      const nextLabel = nextLabelInput.trim() === '' ? '' : nextLabelInput
      onPointUpdateLabel?.({
        layerId: point.layerId,
        pointId: point.id,
        label: nextLabel,
      })
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
      const currentLabel = typeof lineFeature.label === 'string' ? lineFeature.label : ''
      const nextLabelInput = window.prompt('Text de la línia:', currentLabel)
      if (nextLabelInput === null) {
        return
      }

      const nextLabel = nextLabelInput.trim() === '' ? '' : nextLabelInput
      onLineUpdateLabel?.({
        layerId: lineFeature.layerId,
        lineId: lineFeature.id,
        label: nextLabel,
      })
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
      const currentLabel =
        typeof polygonFeature.label === 'string' ? polygonFeature.label : ''
      const nextLabelInput = window.prompt('Text del polígon:', currentLabel)
      if (nextLabelInput === null) {
        return
      }

      const nextLabel = nextLabelInput.trim() === '' ? '' : nextLabelInput
      onPolygonUpdateLabel?.({
        layerId: polygonFeature.layerId,
        polygonId: polygonFeature.id,
        label: nextLabel,
      })
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
        className="map-canvas"
      >
        <MapInstanceBridge onMapReady={onMapReady} />
        <MapLayerPanes orderedLayerIds={visibleLayerOrder} />
        <MapCursorHandler isDrawMode={isDrawMode} />
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
          url={tileUrl}
          attribution={tileAttribution}
          maxZoom={maxZoom}
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

        {lineFeatures.map((lineFeature) => (
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
            {isSelectMode || isDeleteMode ? (
              <Polyline
                positions={lineFeature.latlngs}
                pane={layerPanesById[lineFeature.layerId]}
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
              />
            ) : null}
          </Fragment>
        ))}

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

        {polygonFeatures.map((polygonFeature) => (
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
            {isSelectMode || isDeleteMode ? (
              <Polygon
                positions={polygonFeature.latlngs}
                pane={layerPanesById[polygonFeature.layerId]}
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
              />
            ) : null}
          </Fragment>
        ))}

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

        {pointFeatures.map((point) => (
          <Marker
            key={`${point.layerId}-${point.id}`}
            position={point.coordinates}
            icon={createPointIcon(point.style)}
            pane={layerPanesById[point.layerId]}
            draggable={isSelectMode}
            eventHandlers={{
              click: (event) => handlePointClick(point, event),
              dragend: (event) => handlePointDragEnd(point, event),
            }}
          >
            {typeof point.label === 'string' && point.label.trim() ? (
              <Tooltip>{point.label}</Tooltip>
            ) : null}
          </Marker>
        ))}
      </MapContainer>
    </section>
  )
}

export default MapCanvas
