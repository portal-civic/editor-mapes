import {
  CircleMarker,
  MapContainer,
  TileLayer,
  ZoomControl,
  useMapEvents,
} from 'react-leaflet'

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

function MapCanvas({
  visibleLayers = [],
  selectedBasemap,
  activeWorkModeId,
  workModes = [],
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
      <p className="map-mode-indicator" aria-live="polite">
        Mode actual: <strong>{activeMode?.label || '-'}</strong> · Punts
        visibles: <strong>{pointFeatures.length}</strong>
      </p>
      <MapContainer
        center={[40.4168, -3.7038]}
        zoom={6}
        zoomControl={false}
        className="map-canvas"
      >
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
