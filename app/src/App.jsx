import { useMemo, useState } from 'react'
import TopBar from './components/TopBar'
import LayersPanel from './components/LayersPanel'
import MapCanvas from './components/MapCanvas'
import LegendPanel from './components/LegendPanel'
import { mockLayers } from './modules/layers'
import {
  basemapOptions,
  defaultBasemapId,
  defaultWorkModeId,
  workModes,
} from './modules/maps'

function ensureInitialPointLayer(layers) {
  const hasVisiblePointLayer = layers.some(
    (layer) => layer.geometryType === 'point' && layer.visible,
  )

  if (hasVisiblePointLayer) {
    return layers
  }

  return [
    ...layers,
    {
      id: 'punts-prova',
      name: 'Punts de prova',
      color: '#d4335b',
      geometryType: 'point',
      visible: true,
      legendLabel: 'Punts de prova',
      features: [
        {
          id: 'pt-prova-1',
          name: 'Punt inicial',
          coordinates: [40.4168, -3.7038],
        },
      ],
    },
  ]
}

function App() {
  const [layers, setLayers] = useState(() => {
    const seededLayers = mockLayers.map((layer) => ({
      ...layer,
      features: Array.isArray(layer.features) ? [...layer.features] : [],
    }))

    return ensureInitialPointLayer(seededLayers)
  })
  const [selectedBasemapId, setSelectedBasemapId] = useState(defaultBasemapId)
  const [activeWorkModeId, setActiveWorkModeId] = useState(defaultWorkModeId)

  const visibleLayers = useMemo(
    () => layers.filter((layer) => layer.visible),
    [layers],
  )
  const selectedBasemap = useMemo(
    () =>
      basemapOptions.find((basemap) => basemap.id === selectedBasemapId) ||
      basemapOptions[0],
    [selectedBasemapId],
  )

  const handleLayerVisibilityChange = (layerId, isVisible) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: isVisible } : layer,
      ),
    )
  }

  const handleMapPointAdd = ({ lat, lng }) => {
    setLayers((currentLayers) => {
      const targetPointLayer = currentLayers.find(
        (layer) => layer.geometryType === 'point' && layer.visible,
      )

      if (!targetPointLayer) {
        return currentLayers
      }

      const currentFeatures = Array.isArray(targetPointLayer.features)
        ? targetPointLayer.features
        : []
      const pointIndex = currentFeatures.length + 1
      const pointFeature = {
        id: `pt-${Date.now()}-${Math.round(Math.random() * 10000)}`,
        name: `Punt ${pointIndex}`,
        coordinates: [lat, lng],
      }

      return currentLayers.map((layer) =>
        layer.id === targetPointLayer.id
          ? { ...layer, features: [...currentFeatures, pointFeature] }
          : layer,
      )
    })
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
        <MapCanvas
          visibleLayers={visibleLayers}
          selectedBasemap={selectedBasemap}
          activeWorkModeId={activeWorkModeId}
          workModes={workModes}
          onWorkModeChange={setActiveWorkModeId}
          onPointAdd={handleMapPointAdd}
        />
        <LegendPanel layers={layers} />
      </main>
    </div>
  )
}

export default App
