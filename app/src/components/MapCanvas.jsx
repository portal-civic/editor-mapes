import { useRef } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  Marker,
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

function MapClickHandler({ canAddPoint, canAddLine, onPointAdd, onLinePointAdd }) {
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
  draftLinePoints = [],
  onPointAdd,
  onPointDelete,
  onPointMove,
  onPointUpdateLabel,
  onDraftLinePointAdd,
}) {
  const tileUrl = selectedBasemap?.url || FALLBACK_TILE_URL
  const tileAttribution = selectedBasemap?.attribution || FALLBACK_ATTRIBUTION
  const maxZoom = selectedBasemap?.maxZoom || 19
  const isPointMode = activeWorkModeId === 'point'
  const isLineMode = activeWorkModeId === 'line'
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

  return (
    <section className="map-stage" aria-label="Zona central del mapa">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="map-canvas"
        style={{ cursor: isPointMode || isLineMode ? 'crosshair' : '' }}
      >
        <MapClickHandler
          canAddPoint={isPointMode}
          canAddLine={isLineMode}
          onPointAdd={onPointAdd}
          onLinePointAdd={onDraftLinePointAdd}
        />
        <ZoomControl position="topright" />
        <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={maxZoom} />

        {lineFeatures.map((lineFeature) => (
          <Polyline
            key={`${lineFeature.layerId}-${lineFeature.id}`}
            positions={lineFeature.latlngs}
            pathOptions={{
              color: lineFeature.color || '#ea8b1f',
              weight: 3,
            }}
            interactive={false}
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
