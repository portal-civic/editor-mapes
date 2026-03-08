import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import MapToolbar from './MapToolbar'

function MapCanvas({
  visibleLayers = [],
  selectedBasemap,
  activeWorkModeId,
  workModes = [],
  onWorkModeChange,
}) {
  const activeMode =
    workModes.find((mode) => mode.id === activeWorkModeId) || workModes[0]

  return (
    <section className="map-stage" aria-label="Zona central del mapa">
      <MapToolbar
        modes={workModes}
        activeModeId={activeWorkModeId}
        onModeChange={onWorkModeChange}
      />
      <aside className="map-active-layers" aria-live="polite">
        <p className="map-active-title">Capes actives</p>
        {visibleLayers.length > 0 ? (
          <ul className="map-active-list">
            {visibleLayers.map((layer) => (
              <li key={layer.id}>
                <span
                  className="layer-swatch"
                  style={{ backgroundColor: layer.color }}
                  aria-hidden="true"
                />
                <span>{layer.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="map-active-empty">No hi ha cap capa visible.</p>
        )}
        <p className="map-mode-indicator">
          Mode actual: <strong>{activeMode?.label || '-'}</strong>
        </p>
      </aside>
      <MapContainer
        center={[40.4168, -3.7038]}
        zoom={6}
        zoomControl={false}
        className="map-canvas"
      >
        <ZoomControl position="topright" />
        <TileLayer
          key={selectedBasemap?.id}
          attribution={selectedBasemap?.attribution}
          url={selectedBasemap?.url}
          maxZoom={selectedBasemap?.maxZoom}
        />
      </MapContainer>
    </section>
  )
}

export default MapCanvas
