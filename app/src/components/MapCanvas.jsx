import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import MapToolbar from './MapToolbar'

function PointDrawHandler({ isPointMode, onPointAdd }) {
  useMapEvents({
    click(event) {
      if (!isPointMode) {
        return
      }

      const { lat, lng } = event.latlng
      onPointAdd?.({ lat, lng })
    },
  })

  return null
}

function MapInteractionController({ activeWorkModeId }) {
  const map = useMap()

  useEffect(() => {
    const isPointMode = activeWorkModeId === 'point'
    const container = map.getContainer()

    if (isPointMode) {
      map.dragging.disable()
      container.style.cursor = 'crosshair'
    } else {
      map.dragging.enable()
      container.style.cursor = ''
    }

    return () => {
      map.dragging.enable()
      container.style.cursor = ''
    }
  }, [activeWorkModeId, map])

  return null
}

function MapInitialSizeSync() {
  const map = useMap()

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      map.invalidateSize()
    })
    return () => cancelAnimationFrame(frameId)
  }, [map])

  return null
}

function MapCanvas({
  visibleLayers = [],
  selectedBasemap,
  activeWorkModeId,
  workModes = [],
  onWorkModeChange,
  onPointAdd,
}) {
  const activeMode =
    workModes.find((mode) => mode.id === activeWorkModeId) || workModes[0]
  const visiblePointLayers = visibleLayers.filter(
    (layer) => layer.geometryType === 'point',
  )
  const pointFeatures = visiblePointLayers.flatMap((layer) => {
    const features = Array.isArray(layer.features) ? layer.features : []
    return features
      .filter((feature) => Array.isArray(feature.coordinates))
      .map((feature) => ({
        ...feature,
        layerId: layer.id,
        color: layer.color,
      }))
  })

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
        <p className="map-points-indicator">
          Punts visibles: <strong>{pointFeatures.length}</strong>
        </p>
      </aside>
      <MapContainer
        center={[40.4168, -3.7038]}
        zoom={6}
        zoomControl={false}
        className="map-canvas"
      >
        <MapInitialSizeSync />
        <MapInteractionController activeWorkModeId={activeWorkModeId} />
        <PointDrawHandler
          isPointMode={activeWorkModeId === 'point'}
          onPointAdd={onPointAdd}
        />
        <ZoomControl position="topright" />
        <TileLayer
          key={selectedBasemap?.id}
          attribution={selectedBasemap?.attribution}
          url={selectedBasemap?.url}
          maxZoom={selectedBasemap?.maxZoom}
        />
        {pointFeatures.map((feature) => (
          <CircleMarker
            key={feature.id}
            center={feature.coordinates}
            radius={7}
            pathOptions={{
              color: feature.color,
              fillColor: feature.color,
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
