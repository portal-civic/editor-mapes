export function buildProjectData({
  mapView,
  selectedBasemapId,
  activeWorkModeId,
  editableLayerId,
  layers,
  groups,
  projectPalettes = [],
  legendLayout = null,
  datasets = {},
}) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    // datasets lives at the top level (separate from project metadata) so it
    // can be streamed / compressed independently in future versions.
    datasets,
    project: {
      mapView,
      selectedBasemapId,
      activeWorkModeId,
      editableLayerId,
      layers,
      groups: Array.isArray(groups) ? groups : [],
      palettes: projectPalettes,
      legendLayout,
    },
  }
}
