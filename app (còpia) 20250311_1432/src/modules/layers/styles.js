import { DEFAULT_LAYER_COLORS } from './defaults'

export function getDefaultLayerStyle(geometryType, layerColor) {
  const fallbackColor = DEFAULT_LAYER_COLORS[geometryType] || '#0f4c81'
  const color = layerColor || fallbackColor

  if (geometryType === 'point') {
    return {
      radius: 7,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: color,
      strokeWidth: 2,
      strokeOpacity: 1,
    }
  }

  if (geometryType === 'line') {
    return {
      color,
      width: 3,
      opacity: 1,
      dashStyle: 'solid',
    }
  }

  if (geometryType === 'polygon') {
    return {
      strokeColor: color,
      strokeWidth: 2,
      strokeOpacity: 1,
      dashStyle: 'solid',
      fillColor: color,
      fillOpacity: 0.18,
    }
  }

  return {}
}

export function normalizeLayerStyle(layer) {
  const defaults = getDefaultLayerStyle(layer.geometryType, layer.color)
  const currentStyle =
    layer.style && typeof layer.style === 'object' ? layer.style : {}

  return {
    ...layer,
    style: {
      ...defaults,
      ...currentStyle,
    },
  }
}
