/**
 * poiVisibility.js — helpers for POI subcategory visibility filtering.
 *
 * layer.poiVisibility = {
 *   subcategories: { [subcatId]: boolean }
 * }
 * Missing entry = visible (default open).
 */

/**
 * Returns true if a feature should be shown given the layer's poiVisibility config.
 * Features without poi_subcategory are always shown.
 */
export function isPoiFeatureVisible(feature, poiVisibility) {
  if (!poiVisibility) return true
  const subcat = feature?.properties?.poi_subcategory
  if (!subcat) return true
  return poiVisibility.subcategories?.[subcat] !== false
}

/**
 * Build a default poiVisibility object where all subcategories are visible.
 * Passing null to onPoiVisibilityChange is equivalent.
 */
export function allVisible() {
  return null
}
