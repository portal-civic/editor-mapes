import { CircleMarker, MapContainer, TileLayer, ZoomControl } from 'react-leaflet'

const DEFAULT_CENTER = [40.4168, -3.7038]
const DEFAULT_ZOOM = 6
const FALLBACK_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const FALLBACK_ATTRIBUTION = '&copy; OpenStreetMap contributors'

const TEST_POINTS = [
  { id: 'test-madrid', coordinates: [40.4168, -3.7038] },
  { id: 'test-valencia', coordinates: [39.4699, -0.3763] },
  { id: 'test-zaragoza', coordinates: [41.6488, -0.8891] },
]

function MapCanvas({ selectedBasemap }) {
  const tileUrl = selectedBasemap?.url || FALLBACK_TILE_URL
  const tileAttribution = selectedBasemap?.attribution || FALLBACK_ATTRIBUTION
  const maxZoom = selectedBasemap?.maxZoom || 19

  return (
    <section className="map-stage" aria-label="Zona central del mapa">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="map-canvas"
      >
        <ZoomControl position="topright" />
        <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={maxZoom} />
        {TEST_POINTS.map((point) => (
          <CircleMarker
            key={point.id}
            center={point.coordinates}
            radius={8}
            pathOptions={{
              color: '#0f4c81',
              fillColor: '#0f4c81',
              fillOpacity: 0.85,
              weight: 2,
            }}
          />
        ))}
      </MapContainer>
    </section>
  )
}

export default MapCanvas
