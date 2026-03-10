import { useMemo, useState } from 'react'
import TopBar from './components/TopBar'
import LayersPanel from './components/LayersPanel'
import MapCanvas from './components/MapCanvas'
import LegendPanel from './components/LegendPanel'
import MapToolbarSimple from './components/MapToolbarSimple'
import { mockLayers } from './modules/layers'
import { basemapOptions, defaultBasemapId } from './modules/maps'

const INITIAL_POINT_FEATURES = [
  { id: 'pt-madrid', name: 'Madrid', coordinates: [40.4168, -3.7038] },
  { id: 'pt-valencia', name: 'València', coordinates: [39.4699, -0.3763] },
  { id: 'pt-zaragoza', name: 'Saragossa', coordinates: [41.6488, -0.8891] },
]

function ensureInitialPointLayer(layers) {
  const hasDefaultPointLayer = layers.some((layer) => layer.id === 'punts')
  if (hasDefaultPointLayer) {
    return layers
  }

  const firstPointLayer = layers.find((layer) => layer.geometryType === 'point')
  if (firstPointLayer) {
    const existingFeatures = Array.isArray(firstPointLayer.features)
      ? firstPointLayer.features
      : []

    return layers.map((layer) =>
      layer.id === firstPointLayer.id
        ? {
            ...layer,
            id: 'punts',
            name: 'Punts',
            color: layer.color || '#d4335b',
            geometryType: 'point',
            visible: true,
            legendLabel: 'Punts',
            features:
              existingFeatures.length > 0
                ? existingFeatures
                : INITIAL_POINT_FEATURES,
          }
        : layer,
    )
  }

  return [
    ...layers,
    {
      id: 'punts',
      name: 'Punts',
      color: '#d4335b',
      geometryType: 'point',
      visible: true,
      legendLabel: 'Punts',
      features: INITIAL_POINT_FEATURES,
    },
  ]
}

function getNextPointLayerName(layers) {
  const existingIndices = layers
    .map((layer) => {
      const match = /^Nova capa (\d+)$/.exec(layer.name)
      return match ? Number(match[1]) : null
    })
    .filter((value) => Number.isInteger(value))

  const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1
  return `Nova capa ${nextIndex}`
}

function getPointLayerForNewPoint(layers, activePointLayerId) {
  const activeLayer = layers.find(
    (layer) => layer.id === activePointLayerId && layer.geometryType === 'point',
  )

  if (activeLayer) {
    return activeLayer
  }

  const visiblePointLayers = layers.filter(
    (layer) => layer.geometryType === 'point' && layer.visible,
  )

  return visiblePointLayers[visiblePointLayers.length - 1] || null
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
  const [activeWorkModeId, setActiveWorkModeId] = useState('select')
  const [activePointLayerId, setActivePointLayerId] = useState('punts')

  const selectedBasemap = useMemo(
    () =>
      basemapOptions.find((basemap) => basemap.id === selectedBasemapId) ||
      basemapOptions[0],
    [selectedBasemapId],
  )

  const visiblePointFeatures = useMemo(
    () =>
      layers
        .filter((layer) => layer.geometryType === 'point' && layer.visible)
        .flatMap((layer) => {
          const features = Array.isArray(layer.features) ? layer.features : []
          return features.map((feature) => ({
            ...feature,
            color: layer.color,
            layerId: layer.id,
          }))
        }),
    [layers],
  )

  const handleLayerVisibilityChange = (layerId, isVisible) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: isVisible } : layer,
      ),
    )
  }

  const handleCreatePointLayer = () => {
    const nextLayerId = `point-${Date.now()}-${Math.round(Math.random() * 10000)}`
    setActivePointLayerId(nextLayerId)
    setLayers((currentLayers) => {
      const nextLayerName = getNextPointLayerName(currentLayers)

      return [
        ...currentLayers,
        {
          id: nextLayerId,
          name: nextLayerName,
          color: '#d4335b',
          geometryType: 'point',
          visible: true,
          legendLabel: nextLayerName,
          features: [],
        },
      ]
    })
  }

  const handleMapPointAdd = (coordinates) => {
    setLayers((currentLayers) => {
      const targetLayer = getPointLayerForNewPoint(currentLayers, activePointLayerId)

      if (!targetLayer) {
        return currentLayers
      }

      return currentLayers.map((layer) => {
        if (layer.id !== targetLayer.id) {
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
      })
    })
  }

  const handleMapPointDelete = ({ layerId, pointId }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'point') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.filter((feature) => feature.id !== pointId),
        }
      }),
    )
  }

  const handleMapPointMove = ({ layerId, pointId, lat, lng }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'point') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.map((feature) =>
            feature.id === pointId ? { ...feature, coordinates: [lat, lng] } : feature,
          ),
        }
      }),
    )
  }

  const handleRenamePointLayer = (layerId) => {
    const layerToRename = layers.find(
      (layer) => layer.id === layerId && layer.geometryType === 'point',
    )

    if (!layerToRename) {
      return
    }

    const nextName = window.prompt('Nou nom de la capa', layerToRename.name)
    if (nextName === null) {
      return
    }

    const trimmedName = nextName.trim()
    if (!trimmedName) {
      return
    }

    setLayers((currentLayers) =>
      currentLayers.map((layer) =>
        layer.id === layerId ? { ...layer, name: trimmedName } : layer,
      ),
    )
  }

  const handleDeletePointLayer = (layerId) => {
    setLayers((currentLayers) => {
      const layerToDelete = currentLayers.find(
        (layer) => layer.id === layerId && layer.geometryType === 'point',
      )

      if (!layerToDelete) {
        return currentLayers
      }

      const layerFeatures = Array.isArray(layerToDelete.features)
        ? layerToDelete.features
        : []

      if (layerFeatures.length > 0) {
        window.alert('No es pot eliminar una capa amb punts')
        return currentLayers
      }

      const shouldDelete = window.confirm('Eliminar capa?')
      if (!shouldDelete) {
        return currentLayers
      }

      const nextLayers = currentLayers.filter((layer) => layer.id !== layerId)

      if (activePointLayerId === layerId) {
        const remainingPointLayers = nextLayers.filter(
          (layer) => layer.geometryType === 'point',
        )
        const nextActivePointLayer =
          remainingPointLayers[remainingPointLayers.length - 1]?.id || null
        setActivePointLayerId(nextActivePointLayer)
      }

      return nextLayers
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
          activePointLayerId={activePointLayerId}
          onSetActivePointLayer={setActivePointLayerId}
          onLayerVisibilityChange={handleLayerVisibilityChange}
          onCreatePointLayer={handleCreatePointLayer}
          onRenamePointLayer={handleRenamePointLayer}
          onDeletePointLayer={handleDeletePointLayer}
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
            onPointDelete={handleMapPointDelete}
            onPointMove={handleMapPointMove}
          />
        </section>
        <LegendPanel layers={layers} />
      </main>
    </div>
  )
}

export default App
