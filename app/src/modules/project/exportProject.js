export function buildProjectData({
  mapView,
  selectedBasemapId,
  activeWorkModeId,
  editableLayerId,
  layers,
  groups,
  projectPalettes = [],
}) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    project: {
      mapView,
      selectedBasemapId,
      activeWorkModeId,
      editableLayerId,
      layers,
      groups: Array.isArray(groups) ? groups : [],
      palettes: projectPalettes,
    },
  }
}
