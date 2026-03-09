import { CircleMarker, MapContainer, TileLayer, ZoomControl, useMapEvents } from 'react-leaflet'

const DEFAULT_CENTER = [40.4168, -3.7038]
const DEFAULT_ZOOM = 6
const FALLBACK_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const FALLBACK_ATTRIBUTION = '&copy; OpenStreetMap contributors'

function ClickToAddPoint({ canAddPoint, onMapClick }) {
  useMapEvents({
    click(event) {
      if (!canAddPoint) {
        return
      }

      const { lat, lng } = event.latlng
      onMapClick?.([lat, lng])
    },
  })

  return null
}

function MapCanvas({
  selectedBasemap,
  activeWorkModeId = 'select',
  pointFeatures = [],
  onPointAdd,
}) {
  const tileUrl = selectedBasemap?.url || FALLBACK_TILE_URL
  const tileAttribution = selectedBasemap?.attribution || FALLBACK_ATTRIBUTION
  const maxZoom = selectedBasemap?.maxZoom || 19
  const isPointMode = activeWorkModeId === 'point'

  return (
    <section className="map-stage" aria-label="Zona central del mapa">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="map-canvas"
        style={{ cursor: isPointMode ? 'crosshair' : '' }}
      >
        <ClickToAddPoint canAddPoint={isPointMode} onMapClick={onPointAdd} />
        <ZoomControl position="topright" />
        <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={maxZoom} />

        {pointFeatures.map((point) => (
          <CircleMarker
            key={point.id}
            center={point.coordinates}
            radius={7}
            pathOptions={{
              color: '#d4335b',
              fillColor: '#d4335b',
              fillOpacity: 0.9,
              weight: 2,
            }}
          />
        ))}
      </MapContainer>
    </section>
  )
}

export default MapCanvas
