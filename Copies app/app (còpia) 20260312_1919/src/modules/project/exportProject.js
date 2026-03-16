export function buildProjectData({
  mapView,
  selectedBasemapId,
  activeWorkModeId,
  editableLayerId,
  layers,
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
    },
  }
}
