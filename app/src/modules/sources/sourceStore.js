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
  // Brand each feature with its stable dataset index (non-enumerable → invisible to
  // JSON.stringify, Object.keys, attribute panels). Used by getFeatureKey so that
  // features without an explicit ID field still get a consistent _idx_N key.
  features.forEach((f, i) => {
    if (f != null && typeof f === 'object' && !Object.prototype.hasOwnProperty.call(f, '_srcIdx')) {
      Object.defineProperty(f, '_srcIdx', {
        value: i, enumerable: false, configurable: false, writable: false,
      })
    }
  })
  _datasetFeatures.set(datasetId, features)
}

export function getDatasetFeatures(datasetId) {
  return _datasetFeatures.get(datasetId) ?? []
}

export function removeDataset(datasetId) {
  _datasetFeatures.delete(datasetId)
}
