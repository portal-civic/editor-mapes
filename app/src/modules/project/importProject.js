import { normalizeLayerStyle, ensureInitialPointLayer, normalizeFeature } from '../layers'
import { normalizeLegendLayout } from '../legend/legendLayout'
import { storeDatasetFeatures } from '../sources/sourceStore'

// Repopulates the sourceStore from the datasets block saved in the project file.
// Returns the list of datasetIds that were successfully restored.
// Safe to call with old project files that lack a datasets block — returns [].
export function restoreProjectDatasets(parsedData) {
  const raw = parsedData?.datasets
  if (!raw || typeof raw !== 'object') return []

  const restored = []
  for (const [datasetId, dataset] of Object.entries(raw)) {
    if (typeof datasetId === 'string' && Array.isArray(dataset?.features)) {
      // storeDatasetFeatures brands each feature with a non-enumerable _srcIdx
      storeDatasetFeatures(datasetId, dataset.features)
      restored.push(datasetId)
    }
  }
  return restored
}

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

function normalizeGroupLegend(raw) {
  if (!raw || typeof raw !== 'object') return { title: '', showGroupTitle: false, showChildLayers: true }
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    showGroupTitle: typeof raw.showGroupTitle === 'boolean' ? raw.showGroupTitle : false,
    showChildLayers: typeof raw.showChildLayers === 'boolean' ? raw.showChildLayers : true,
  }
}

function normalizeGroupStyleOverride(raw) {
  const d = { enabled: false, fillColor: '#888888', fillOpacity: 0.5, strokeColor: '#333333', strokeOpacity: 1, strokeWidth: 2, dashStyle: 'solid' }
  if (!raw || typeof raw !== 'object') return d
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : false,
    fillColor: typeof raw.fillColor === 'string' ? raw.fillColor : d.fillColor,
    fillOpacity: typeof raw.fillOpacity === 'number' ? raw.fillOpacity : d.fillOpacity,
    strokeColor: typeof raw.strokeColor === 'string' ? raw.strokeColor : d.strokeColor,
    strokeOpacity: typeof raw.strokeOpacity === 'number' ? raw.strokeOpacity : d.strokeOpacity,
    strokeWidth: typeof raw.strokeWidth === 'number' ? raw.strokeWidth : d.strokeWidth,
    dashStyle: ['solid', 'dashed', 'dotted'].includes(raw.dashStyle) ? raw.dashStyle : d.dashStyle,
  }
}

export function normalizeImportedGroups(groups) {
  if (!Array.isArray(groups)) return []
  return groups
    .filter((g) => g && typeof g.id === 'string' && typeof g.name === 'string')
    .map((g) => ({
      id: g.id,
      name: g.name,
      collapsed: typeof g.collapsed === 'boolean' ? g.collapsed : false,
      legend: normalizeGroupLegend(g.legend),
      styleOverride: normalizeGroupStyleOverride(g.styleOverride),
    }))
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
