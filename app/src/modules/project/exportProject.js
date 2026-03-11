export function buildProjectData({
  mapView,
  selectedBasemapId,
  activeWorkModeId,
  activePointLayerId,
  activeLineLayerId,
  activePolygonLayerId,
  layers,
}) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    project: {
      mapView,
      selectedBasemapId,
      activeWorkModeId,
      activePointLayerId,
      activeLineLayerId,
      activePolygonLayerId,
      layers,
    },
  }
}
