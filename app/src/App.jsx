import { useMemo, useState } from 'react'
import TopBar from './components/TopBar'
import LayersPanel from './components/LayersPanel'
import MapCanvas from './components/MapCanvas'
import LegendPanel from './components/LegendPanel'
import MapToolbarSimple from './components/MapToolbarSimple'
import { mockLayers } from './modules/layers'
import { basemapOptions, defaultBasemapId } from './modules/maps'

const POINT_LAYER_ID = 'punts'
const INITIAL_POINT_FEATURES = [
  { id: 'pt-madrid', name: 'Madrid', coordinates: [40.4168, -3.7038] },
  { id: 'pt-valencia', name: 'València', coordinates: [39.4699, -0.3763] },
  { id: 'pt-zaragoza', name: 'Saragossa', coordinates: [41.6488, -0.8891] },
]

function ensurePointLayer(layers) {
  const existingPointLayer =
    layers.find((layer) => layer.id === POINT_LAYER_ID) ||
    layers.find((layer) => layer.geometryType === 'point')

  const existingFeatures = Array.isArray(existingPointLayer?.features)
    ? existingPointLayer.features
    : []

  return [
    ...layers.filter((layer) => layer.geometryType !== 'point'),
    {
      id: POINT_LAYER_ID,
      name: 'Punts',
      color: '#d4335b',
      geometryType: 'point',
      visible: existingPointLayer?.visible ?? true,
      legendLabel: 'Punts',
      features:
        existingFeatures.length > 0 ? existingFeatures : INITIAL_POINT_FEATURES,
    },
  ]
}

function App() {
  const [layers, setLayers] = useState(() => {
    const seededLayers = mockLayers.map((layer) => ({
      ...layer,
      features: Array.isArray(layer.features) ? [...layer.features] : [],
    }))

    return ensurePointLayer(seededLayers)
  })
  const [selectedBasemapId, setSelectedBasemapId] = useState(defaultBasemapId)
  const [activeWorkModeId, setActiveWorkModeId] = useState('select')

  const selectedBasemap = useMemo(
    () =>
      basemapOptions.find((basemap) => basemap.id === selectedBasemapId) ||
      basemapOptions[0],
    [selectedBasemapId],
  )

  const pointLayer = useMemo(
    () => layers.find((layer) => layer.id === POINT_LAYER_ID),
    [layers],
  )

  const visiblePointFeatures = useMemo(() => {
    if (!pointLayer?.visible) {
      return []
    }

    return Array.isArray(pointLayer.features) ? pointLayer.features : []
  }, [pointLayer])

  const handleLayerVisibilityChange = (layerId, isVisible) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: isVisible } : layer,
      ),
    )
  }

  const handleMapPointAdd = (coordinates) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== POINT_LAYER_ID) {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        const pointIndex = currentFeatures.length + 1

        return {
          ...layer,
          features: [
            ...currentFeatures,
            {
              id: `pt-${Date.now()}-${Math.round(Math.random() * 10000)}`,
              name: `Punt ${pointIndex}`,
              coordinates,
            },
          ],
        }
      }),
    )
  }

  return (
    <div className="editor-shell">
      <TopBar
        basemapOptions={basemapOptions}
        selectedBasemapId={selectedBasemap.id}
        onBasemapChange={setSelectedBasemapId}
      />

      <main className="workspace">
        <LayersPanel
          layers={layers}
          onLayerVisibilityChange={handleLayerVisibilityChange}
        />
        <section className="map-workspace">
          <MapToolbarSimple
            activeWorkModeId={activeWorkModeId}
            onModeChange={setActiveWorkModeId}
          />
          <MapCanvas
            selectedBasemap={selectedBasemap}
            activeWorkModeId={activeWorkModeId}
            pointFeatures={visiblePointFeatures}
            onPointAdd={handleMapPointAdd}
          />
        </section>
        <LegendPanel layers={layers} />
      </main>
    </div>
  )
}

export default App
