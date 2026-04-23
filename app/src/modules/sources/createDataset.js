import { getSourceFeatures, storeDatasetFeatures } from './sourceStore'
import { filterByViewportBbox } from './bboxFilter'

/**
 * Creates a dataset from a source, applying optional filters.
 *
 * options:
 *   viewport  [west, south, east, north]  — spatial filter by bounding box
 *   limit     number                       — max features to include
 *
 * Returns { id, sourceId, featureCount, options }.
 * The actual features are written to the dataset store, not returned.
 */
export function createDatasetFromSource(sourceId, options = {}) {
  let features = getSourceFeatures(sourceId)

  if (options.viewport) {
    features = filterByViewportBbox(features, options.viewport)
  }

  if (typeof options.limit === 'number' && options.limit > 0 && features.length > options.limit) {
    features = features.slice(0, options.limit)
  }

  const datasetId = `ds-${Date.now()}-${Math.round(Math.random() * 10000)}`
  storeDatasetFeatures(datasetId, features)

  return {
    id: datasetId,
    sourceId,
    featureCount: features.length,
    options,
  }
}
