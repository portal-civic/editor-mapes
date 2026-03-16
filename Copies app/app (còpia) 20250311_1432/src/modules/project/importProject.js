import { normalizeLayerStyle, ensureInitialPointLayer } from '../layers'

export function isValidProjectData(parsedData) {
  return (
    parsedData != null &&
    typeof parsedData === 'object' &&
    parsedData.project != null &&
    typeof parsedData.project === 'object' &&
    Array.isArray(parsedData.project.layers)
  )
}

export function normalizeImportedLayers(layers) {
  const normalized = layers.map((layer) => ({
    ...normalizeLayerStyle(layer),
    features: Array.isArray(layer.features) ? layer.features : [],
  }))
  return ensureInitialPointLayer(normalized)
}
