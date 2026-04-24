import { normalizeLayerStyle, ensureInitialPointLayer, normalizeFeature } from '../layers'
import { normalizeLegendLayout } from '../legend/legendLayout'

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
    features: Array.isArray(layer.features)
      ? layer.features.map(normalizeFeature).filter(Boolean)
      : [],
  }))
  return ensureInitialPointLayer(normalized)
}

export function normalizeImportedGroups(groups) {
  if (!Array.isArray(groups)) return []
  return groups
    .filter((g) => g && typeof g.id === 'string' && typeof g.name === 'string')
    .map((g) => ({ id: g.id, name: g.name }))
}

export function normalizeImportedLegendLayout(raw) {
  return normalizeLegendLayout(raw)
}

export function normalizeImportedPalettes(palettes) {
  if (!Array.isArray(palettes)) return []
  return palettes
    .filter(
      (p) =>
        p &&
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        Array.isArray(p.colors),
    )
    .map((p) => ({
      id: p.id,
      name: String(p.name),
      colors: p.colors.filter((c) => typeof c === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c)),
    }))
    .filter((p) => p.colors.length > 0)
}
