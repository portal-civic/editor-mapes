import { useMemo, useState } from 'react'
import TopBar from './components/TopBar'
import LayersPanel from './components/LayersPanel'
import MapCanvas from './components/MapCanvas'
import LegendPanel from './components/LegendPanel'
import MapToolbarSimple from './components/MapToolbarSimple'
import { mockLayers } from './modules/layers'
import { basemapOptions, defaultBasemapId } from './modules/maps'

const INITIAL_POINT_FEATURES = [
  { id: 'pt-madrid', name: 'Madrid', label: '', coordinates: [40.4168, -3.7038] },
  { id: 'pt-valencia', name: 'València', label: '', coordinates: [39.4699, -0.3763] },
  { id: 'pt-zaragoza', name: 'Saragossa', label: '', coordinates: [41.6488, -0.8891] },
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

function getNextLineLayerName(layers) {
  const existingIndices = layers
    .map((layer) => {
      const match = /^Nova línia (\d+)$/.exec(layer.name)
      return match ? Number(match[1]) : null
    })
    .filter((value) => Number.isInteger(value))

  const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1
  return `Nova línia ${nextIndex}`
}

function getNextPolygonLayerName(layers) {
  const existingIndices = layers
    .map((layer) => {
      const match = /^Nou polígon (\d+)$/.exec(layer.name)
      return match ? Number(match[1]) : null
    })
    .filter((value) => Number.isInteger(value))

  const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1
  return `Nou polígon ${nextIndex}`
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

function getLineLayerForNewFeature(layers, activeLineLayerId) {
  const activeLayer = layers.find(
    (layer) => layer.id === activeLineLayerId && layer.geometryType === 'line',
  )

  if (activeLayer) {
    return activeLayer
  }

  const visibleLineLayers = layers.filter(
    (layer) => layer.geometryType === 'line' && layer.visible,
  )

  return visibleLineLayers[visibleLineLayers.length - 1] || null
}

function getPolygonLayerForNewFeature(layers, activePolygonLayerId) {
  const activeLayer = layers.find(
    (layer) => layer.id === activePolygonLayerId && layer.geometryType === 'polygon',
  )

  if (activeLayer) {
    return activeLayer
  }

  const visiblePolygonLayers = layers.filter(
    (layer) => layer.geometryType === 'polygon' && layer.visible,
  )

  return visiblePolygonLayers[visiblePolygonLayers.length - 1] || null
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
  const [draftLinePoints, setDraftLinePoints] = useState([])
  const [draftPolygonPoints, setDraftPolygonPoints] = useState([])
  const [activeLineLayerId, setActiveLineLayerId] = useState(() => {
    const initialLineLayer = ensureInitialPointLayer(mockLayers).find(
      (layer) => layer.geometryType === 'line',
    )
    return initialLineLayer?.id || null
  })
  const [activePolygonLayerId, setActivePolygonLayerId] = useState(() => {
    const initialPolygonLayer = ensureInitialPointLayer(mockLayers).find(
      (layer) => layer.geometryType === 'polygon',
    )
    return initialPolygonLayer?.id || null
  })

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
            label: typeof feature.label === 'string' ? feature.label : '',
            color: layer.color,
            layerId: layer.id,
          }))
        }),
    [layers],
  )

  const visibleLineFeatures = useMemo(
    () =>
      layers
        .filter((layer) => layer.geometryType === 'line' && layer.visible)
        .flatMap((layer) => {
          const features = Array.isArray(layer.features) ? layer.features : []
          return features
            .filter((feature) => Array.isArray(feature.latlngs))
            .map((feature) => ({
              ...feature,
              color: layer.color,
              layerId: layer.id,
            }))
        }),
    [layers],
  )

  const visiblePolygonFeatures = useMemo(
    () =>
      layers
        .filter((layer) => layer.geometryType === 'polygon' && layer.visible)
        .flatMap((layer) => {
          const features = Array.isArray(layer.features) ? layer.features : []
          return features
            .filter((feature) => Array.isArray(feature.latlngs))
            .map((feature) => ({
              ...feature,
              color: layer.color,
              layerId: layer.id,
            }))
        }),
    [layers],
  )

  const handleWorkModeChange = (nextMode) => {
    setActiveWorkModeId(nextMode)
    if (nextMode !== 'line') {
      setDraftLinePoints([])
    }
    if (nextMode !== 'polygon') {
      setDraftPolygonPoints([])
    }
  }

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

  const handleCreateLineLayer = () => {
    const nextLayerId = `line-${Date.now()}-${Math.round(Math.random() * 10000)}`
    setActiveLineLayerId(nextLayerId)
    setLayers((currentLayers) => {
      const nextLayerName = getNextLineLayerName(currentLayers)

      return [
        ...currentLayers,
        {
          id: nextLayerId,
          name: nextLayerName,
          color: '#ea8b1f',
          geometryType: 'line',
          visible: true,
          legendLabel: nextLayerName,
          features: [],
        },
      ]
    })
  }

  const handleCreatePolygonLayer = () => {
    const nextLayerId = `polygon-${Date.now()}-${Math.round(Math.random() * 10000)}`
    setActivePolygonLayerId(nextLayerId)
    setLayers((currentLayers) => {
      const nextLayerName = getNextPolygonLayerName(currentLayers)

      return [
        ...currentLayers,
        {
          id: nextLayerId,
          name: nextLayerName,
          color: '#2f7de1',
          geometryType: 'polygon',
          visible: true,
          legendLabel: nextLayerName,
          features: [],
        },
      ]
    })
  }

  const handleMapPointAdd = (coordinates) => {
    const nextLabelInput = window.prompt('Text del punt:', '')
    const nextLabel =
      nextLabelInput === null || nextLabelInput.trim() === '' ? '' : nextLabelInput

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
              label: nextLabel,
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

  const handleMapPointUpdateLabel = ({ layerId, pointId, label }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'point') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.map((feature) =>
            feature.id === pointId ? { ...feature, label } : feature,
          ),
        }
      }),
    )
  }

  const handleMapLineDelete = ({ layerId, lineId }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'line') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.filter((feature) => feature.id !== lineId),
        }
      }),
    )
  }

  const handleMapPolygonDelete = ({ layerId, polygonId }) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== layerId || layer.geometryType !== 'polygon') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: currentFeatures.filter((feature) => feature.id !== polygonId),
        }
      }),
    )
  }

  const handleDraftLinePointAdd = (coordinates) => {
    const targetLineLayer = getLineLayerForNewFeature(layers, activeLineLayerId)

    if (!targetLineLayer) {
      window.alert('Cal una capa de línia activa')
      return
    }

    setDraftLinePoints((currentPoints) => [...currentPoints, coordinates])
  }

  const handleDraftLineCancel = () => {
    setDraftLinePoints([])
  }

  const handleDraftLineFinish = () => {
    if (draftLinePoints.length < 2) {
      return
    }

    const targetLineLayer = getLineLayerForNewFeature(layers, activeLineLayerId)
    if (!targetLineLayer) {
      window.alert('Cal una capa de línia activa')
      return
    }

    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== targetLineLayer.id || layer.geometryType !== 'line') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: [
            ...currentFeatures,
            {
              id: `ln-${Date.now()}-${Math.round(Math.random() * 10000)}`,
              latlngs: [...draftLinePoints],
            },
          ],
        }
      }),
    )

    setDraftLinePoints([])
  }

  const handleDraftPolygonPointAdd = (coordinates) => {
    const targetPolygonLayer = getPolygonLayerForNewFeature(
      layers,
      activePolygonLayerId,
    )

    if (!targetPolygonLayer) {
      window.alert('Cal una capa de polígon activa')
      return
    }

    setDraftPolygonPoints((currentPoints) => [...currentPoints, coordinates])
  }

  const handleDraftPolygonCancel = () => {
    setDraftPolygonPoints([])
  }

  const handleDraftPolygonFinish = () => {
    if (draftPolygonPoints.length < 3) {
      return
    }

    const targetPolygonLayer = getPolygonLayerForNewFeature(
      layers,
      activePolygonLayerId,
    )
    if (!targetPolygonLayer) {
      window.alert('Cal una capa de polígon activa')
      return
    }

    setLayers((currentLayers) =>
      currentLayers.map((layer) => {
        if (layer.id !== targetPolygonLayer.id || layer.geometryType !== 'polygon') {
          return layer
        }

        const currentFeatures = Array.isArray(layer.features) ? layer.features : []
        return {
          ...layer,
          features: [
            ...currentFeatures,
            {
              id: `pg-${Date.now()}-${Math.round(Math.random() * 10000)}`,
              latlngs: [...draftPolygonPoints],
            },
          ],
        }
      }),
    )

    setDraftPolygonPoints([])
  }

  const handleRenameLayer = (layerId) => {
    const layerToRename = layers.find(
      (layer) =>
        layer.id === layerId &&
        (layer.geometryType === 'point' ||
          layer.geometryType === 'line' ||
          layer.geometryType === 'polygon'),
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

  const handleDeleteLayer = (layerId) => {
    setLayers((currentLayers) => {
      const layerToDelete = currentLayers.find(
        (layer) =>
          layer.id === layerId &&
          (layer.geometryType === 'point' ||
            layer.geometryType === 'line' ||
            layer.geometryType === 'polygon'),
      )

      if (!layerToDelete) {
        return currentLayers
      }

      const layerFeatures = Array.isArray(layerToDelete.features)
        ? layerToDelete.features
        : []

      if (layerFeatures.length > 0) {
        const message =
          layerToDelete.geometryType === 'point'
            ? 'No es pot eliminar una capa amb punts'
            : 'No es pot eliminar una capa amb elements'
        window.alert(message)
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

      if (activeLineLayerId === layerId) {
        const remainingLineLayers = nextLayers.filter(
          (layer) => layer.geometryType === 'line',
        )
        const nextActiveLineLayer =
          remainingLineLayers[remainingLineLayers.length - 1]?.id || null
        setActiveLineLayerId(nextActiveLineLayer)
      }

      if (activePolygonLayerId === layerId) {
        const remainingPolygonLayers = nextLayers.filter(
          (layer) => layer.geometryType === 'polygon',
        )
        const nextActivePolygonLayer =
          remainingPolygonLayers[remainingPolygonLayers.length - 1]?.id || null
        setActivePolygonLayerId(nextActivePolygonLayer)
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
          activeLineLayerId={activeLineLayerId}
          activePolygonLayerId={activePolygonLayerId}
          onSetActivePointLayer={setActivePointLayerId}
          onSetActiveLineLayer={setActiveLineLayerId}
          onSetActivePolygonLayer={setActivePolygonLayerId}
          onLayerVisibilityChange={handleLayerVisibilityChange}
          onCreatePointLayer={handleCreatePointLayer}
          onCreateLineLayer={handleCreateLineLayer}
          onCreatePolygonLayer={handleCreatePolygonLayer}
          onRenameLayer={handleRenameLayer}
          onDeleteLayer={handleDeleteLayer}
        />
        <section className="map-workspace">
          <MapToolbarSimple
            activeWorkModeId={activeWorkModeId}
            onModeChange={handleWorkModeChange}
          />
          {activeWorkModeId === 'line' && draftLinePoints.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={handleDraftLineFinish}
                disabled={draftLinePoints.length < 2}
              >
                Acabar línia
              </button>{' '}
              <button type="button" onClick={handleDraftLineCancel}>
                Cancel·lar
              </button>
            </div>
          ) : null}
          {activeWorkModeId === 'polygon' && draftPolygonPoints.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={handleDraftPolygonFinish}
                disabled={draftPolygonPoints.length < 3}
              >
                Acabar polígon
              </button>{' '}
              <button type="button" onClick={handleDraftPolygonCancel}>
                Cancel·lar
              </button>
            </div>
          ) : null}
          <MapCanvas
            selectedBasemap={selectedBasemap}
            activeWorkModeId={activeWorkModeId}
            pointFeatures={visiblePointFeatures}
            lineFeatures={visibleLineFeatures}
            polygonFeatures={visiblePolygonFeatures}
            draftLinePoints={draftLinePoints}
            draftPolygonPoints={draftPolygonPoints}
            onPointAdd={handleMapPointAdd}
            onPointDelete={handleMapPointDelete}
            onPointMove={handleMapPointMove}
            onPointUpdateLabel={handleMapPointUpdateLabel}
            onLineDelete={handleMapLineDelete}
            onPolygonDelete={handleMapPolygonDelete}
            onDraftLinePointAdd={handleDraftLinePointAdd}
            onDraftPolygonPointAdd={handleDraftPolygonPointAdd}
          />
        </section>
        <LegendPanel layers={layers} />
      </main>
    </div>
  )
}

export default App
