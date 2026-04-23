// External (non-React) store for raw GeoJSON feature arrays.
// Keeping feature data outside React state prevents large arrays from
// triggering reconciliation on every map interaction.

const _sourceFeatures = new Map()
const _datasetFeatures = new Map()

export function storeSourceFeatures(sourceId, features) {
  _sourceFeatures.set(sourceId, features)
}

export function getSourceFeatures(sourceId) {
  return _sourceFeatures.get(sourceId) ?? []
}

export function removeSource(sourceId) {
  _sourceFeatures.delete(sourceId)
}

export function storeDatasetFeatures(datasetId, features) {
  _datasetFeatures.set(datasetId, features)
}

export function getDatasetFeatures(datasetId) {
  return _datasetFeatures.get(datasetId) ?? []
}

export function removeDataset(datasetId) {
  _datasetFeatures.delete(datasetId)
}
