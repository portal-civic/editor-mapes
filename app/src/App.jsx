import { useMemo, useState } from 'react'
import TopBar from './components/TopBar'
import LayersPanel from './components/LayersPanel'
import MapCanvas from './components/MapCanvas'
import LegendPanel from './components/LegendPanel'
import { mockLayers } from './modules/layers'
import { basemapOptions, defaultBasemapId } from './modules/maps'

function App() {
  const [layers, setLayers] = useState(() =>
    mockLayers.map((layer) => ({ ...layer })),
  )
  const [selectedBasemapId, setSelectedBasemapId] = useState(defaultBasemapId)

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
        />
        <LegendPanel layers={layers} />
      </main>
    </div>
  )
}

export default App
