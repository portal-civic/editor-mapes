export const DEFAULT_MAP_CENTER = [40.4168, -3.7038]
export const DEFAULT_MAP_ZOOM = 6

export const DEFAULT_LAYER_COLORS = {
  point: '#d4335b',
  line: '#ea8b1f',
  polygon: '#2f7de1',
}

export const INITIAL_POINT_FEATURES = [
  { id: 'pt-madrid', name: 'Madrid', label: '', coordinates: [40.4168, -3.7038] },
  { id: 'pt-valencia', name: "Val\u00e8ncia", label: '', coordinates: [39.4699, -0.3763] },
  { id: 'pt-zaragoza', name: 'Saragossa', label: '', coordinates: [41.6488, -0.8891] },
]

export const DEFAULT_LAYER_FIELDS = {
  showInLegend: true,
  showInWeb: true,
  showInExport: true,
  role: 'default',
  legendOrder: null,
}
