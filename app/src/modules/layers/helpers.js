import { INITIAL_POINT_FEATURES } from './defaults'
import { normalizeLayerStyle } from './styles'

export function ensureInitialPointLayer(layers) {
  const hasDefaultPointLayer = layers.some((layer) => layer.id === 'punts')
  if (hasDefaultPointLayer) {
    return layers.map(normalizeLayerStyle)
  }

  const firstPointLayer = layers.find((layer) => layer.geometryType === 'point')
  if (firstPointLayer) {
    const existingFeatures = Array.isArray(firstPointLayer.features)
      ? firstPointLayer.features
      : []

    return layers
      .map((layer) =>
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
      .map(normalizeLayerStyle)
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
  ].map(normalizeLayerStyle)
}

export function getNextPointLayerName(layers) {
  const existingIndices = layers
    .map((layer) => {
      const match = /^Nova capa (\d+)$/.exec(layer.name)
      return match ? Number(match[1]) : null
    })
    .filter((value) => Number.isInteger(value))

  const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1
  return `Nova capa ${nextIndex}`
}

export function getNextLineLayerName(layers) {
  const existingIndices = layers
    .map((layer) => {
      const match = /^Nova l\u00ednia (\d+)$/.exec(layer.name)
      return match ? Number(match[1]) : null
    })
    .filter((value) => Number.isInteger(value))

  const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1
  return `Nova l\u00ednia ${nextIndex}`
}

export function getNextPolygonLayerName(layers) {
  const existingIndices = layers
    .map((layer) => {
      const match = /^Nou pol\u00edgon (\d+)$/.exec(layer.name)
      return match ? Number(match[1]) : null
    })
    .filter((value) => Number.isInteger(value))

  const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1
  return `Nou pol\u00edgon ${nextIndex}`
}

export function getPointLayerForNewPoint(layers, activePointLayerId) {
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

export function getLineLayerForNewFeature(layers, activeLineLayerId) {
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

export function getPolygonLayerForNewFeature(layers, activePolygonLayerId) {
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
