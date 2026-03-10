import { useRef } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMapEvents,
} from 'react-leaflet'

const DEFAULT_CENTER = [40.4168, -3.7038]
const DEFAULT_ZOOM = 6
const FALLBACK_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const FALLBACK_ATTRIBUTION = '&copy; OpenStreetMap contributors'

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

function MapCanvas({
  selectedBasemap,
  activeWorkModeId = 'select',
  pointFeatures = [],
  lineFeatures = [],
  polygonFeatures = [],
  draftLinePoints = [],
  draftPolygonPoints = [],
  onPointAdd,
  onPointDelete,
  onPointMove,
  onPointUpdateLabel,
  onLineDelete,
  onPolygonDelete,
  onDraftLinePointAdd,
  onDraftPolygonPointAdd,
}) {
  const tileUrl = selectedBasemap?.url || FALLBACK_TILE_URL
  const tileAttribution = selectedBasemap?.attribution || FALLBACK_ATTRIBUTION
  const maxZoom = selectedBasemap?.maxZoom || 19
  const isPointMode = activeWorkModeId === 'point'
  const isLineMode = activeWorkModeId === 'line'
  const isPolygonMode = activeWorkModeId === 'polygon'
  const isSelectMode = activeWorkModeId === 'select'
  const isDeleteMode = activeWorkModeId === 'delete'
  const recentlyDraggedPointKeysRef = useRef(new Set())

  const createPointIcon = (color) =>
    L.divIcon({
      className: '',
      html: `<span style="display:block;width:14px;height:14px;border-radius:999px;border:2px solid ${color};background:${color};opacity:0.9;"></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

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
    if (!isDeleteMode) {
      return
    }

    event.originalEvent?.stopPropagation()

    const shouldDelete = window.confirm('Eliminar línia?')
    if (!shouldDelete) {
      return
    }

    onLineDelete?.({ layerId: lineFeature.layerId, lineId: lineFeature.id })
  }

  const handlePolygonClick = (polygonFeature, event) => {
    if (!isDeleteMode) {
      return
    }

    event.originalEvent?.stopPropagation()

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
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="map-canvas"
        style={{ cursor: isPointMode || isLineMode || isPolygonMode ? 'crosshair' : '' }}
      >
        <MapClickHandler
          canAddPoint={isPointMode}
          canAddLine={isLineMode}
          canAddPolygon={isPolygonMode}
          onPointAdd={onPointAdd}
          onLinePointAdd={onDraftLinePointAdd}
          onPolygonPointAdd={onDraftPolygonPointAdd}
        />
        <ZoomControl position="topright" />
        <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={maxZoom} />

        {lineFeatures.map((lineFeature) => (
          <Polyline
            key={`${lineFeature.layerId}-${lineFeature.id}`}
            positions={lineFeature.latlngs}
            pathOptions={{
              color: lineFeature.color || '#ea8b1f',
              weight: isDeleteMode ? 6 : 3,
            }}
            interactive
            bubblingMouseEvents={false}
            eventHandlers={{
              click: (event) => handleLineClick(lineFeature, event),
            }}
          />
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

        {polygonFeatures.map((polygonFeature) => (
          <Polygon
            key={`${polygonFeature.layerId}-${polygonFeature.id}`}
            positions={polygonFeature.latlngs}
            pathOptions={{
              color: polygonFeature.color || '#2f7de1',
              weight: 2,
              fillColor: polygonFeature.color || '#2f7de1',
              fillOpacity: 0.18,
            }}
            interactive={isDeleteMode}
            bubblingMouseEvents={false}
            eventHandlers={{
              click: (event) => handlePolygonClick(polygonFeature, event),
            }}
          />
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

        {pointFeatures.map((point) => (
          <Marker
            key={`${point.layerId}-${point.id}`}
            position={point.coordinates}
            icon={createPointIcon(point.color || '#d4335b')}
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
