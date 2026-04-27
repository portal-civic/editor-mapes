// Returns a stable string key for a GeoJSON feature.
// Priority: GeoJSON feature-level id → common ID properties → embedded _srcIdx
// (set non-enumerably by storeDatasetFeatures) → fallbackIndex of last resort.
export function getFeatureKey(feature, fallbackIndex = 0) {
  const id =
    feature?.id ??
    feature?.properties?.id ??
    feature?.properties?.OBJECTID ??
    feature?.properties?.objectid ??
    feature?.properties?.gid ??
    feature?.properties?.GID ??
    feature?.properties?.fid ??
    feature?.properties?.FID
  if (id != null) return String(id)
  // _srcIdx is branded by storeDatasetFeatures — always consistent across render/select
  if (feature?._srcIdx != null) return `_idx_${feature._srcIdx}`
  return `_idx_${fallbackIndex}`
}
