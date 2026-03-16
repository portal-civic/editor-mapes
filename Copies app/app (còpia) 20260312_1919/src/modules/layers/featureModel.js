/**
 * Default values for optional feature metadata fields.
 * Used to normalize features from old projects or imported GeoJSON.
 */
export const FEATURE_DEFAULTS = {
  description: '',
  category: '',
  subcategory: '',
  status: '',
  icon: '',
  showInWeb: true,
  showInExport: true,
}

/**
 * Normalizes a raw feature ensuring all metadata fields exist.
 * Safe on old projects – missing fields get defaults.
 * Preserves geometry fields (coordinates / latlngs).
 */
export function normalizeFeature(rawFeature) {
  if (!rawFeature || typeof rawFeature !== 'object') return null
  const f = { ...FEATURE_DEFAULTS, ...rawFeature }
  return {
    ...f,
    id:
      typeof f.id === 'string' && f.id
        ? f.id
        : `feature-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    name: typeof f.name === 'string' ? f.name : '',
    label: typeof f.label === 'string' ? f.label : '',
    description: typeof f.description === 'string' ? f.description : '',
    category: typeof f.category === 'string' ? f.category : '',
    subcategory: typeof f.subcategory === 'string' ? f.subcategory : '',
    status: typeof f.status === 'string' ? f.status : '',
    icon: typeof f.icon === 'string' ? f.icon : '',
    showInWeb: f.showInWeb !== false,
    showInExport: f.showInExport !== false,
  }
}
