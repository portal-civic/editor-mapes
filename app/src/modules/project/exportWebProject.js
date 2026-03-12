import { convertLayerToGeoJSON } from '../geojson'
import { buildZip } from './zipUtils'

const GEOM_SOURCE = {
  point: 'layers/points.geojson',
  line: 'layers/lines.geojson',
  polygon: 'layers/areas.geojson',
}

/**
 * Builds the project.json manifest for a publishable web project.
 * Always exports all vector layers regardless of visible/showInWeb flags —
 * the viewer decides what to show. Flags travel as metadata.
 */
export function buildWebProjectJson({ mapView, selectedBasemapId, layers, projectTitle = '' }) {
  const vectorLayers = layers.filter(
    (l) =>
      l.geometryType === 'point' ||
      l.geometryType === 'line' ||
      l.geometryType === 'polygon',
  )

  const layerManifest = vectorLayers.map((layer) => ({
    id: layer.id,
    name: layer.name,
    geometryType: layer.geometryType,
    source: GEOM_SOURCE[layer.geometryType],
    visible: layer.visible ?? true,
    legendLabel: layer.legendLabel || layer.name,
    showInLegend: layer.showInLegend ?? true,
    showInWeb: layer.showInWeb ?? true,
    showInExport: layer.showInExport ?? true,
    role: layer.role ?? 'default',
    style: layer.style || {},
  }))

  return {
    meta: {
      id: 'editor-mapes-project',
      title: projectTitle || '',
      subtitle: '',
      version: '1.0.0',
    },
    map: {
      center: mapView?.center || [0, 0],
      zoom: mapView?.zoom || 6,
      minZoom: 3,
      maxZoom: 19,
      basemap: selectedBasemapId || 'osm',
    },
    layers: layerManifest,
    categories: [],
    branding: {},
    ui: {},
  }
}

/**
 * Downloads a complete web project as a single ZIP file:
 *   project-web.zip
 *     project.json
 *     layers/
 *       points.geojson
 *       lines.geojson
 *       areas.geojson
 *
 * All vector layers and all their features are included — no filtering by
 * showInExport or visible. Those flags travel as metadata for the viewer to use.
 */
export function downloadWebProject({ mapView, selectedBasemapId, layers, projectTitle = '' }) {
  const vectorLayers = layers.filter(
    (l) =>
      l.geometryType === 'point' ||
      l.geometryType === 'line' ||
      l.geometryType === 'polygon',
  )

  const projectJson = buildWebProjectJson({ mapView, selectedBasemapId, layers, projectTitle })

  const mergeGeojson = (geomType) =>
    JSON.stringify(
      {
        type: 'FeatureCollection',
        features: vectorLayers
          .filter((l) => l.geometryType === geomType)
          .flatMap((l) => convertLayerToGeoJSON(l).features),
      },
      null,
      2,
    )

  const zipBytes = buildZip([
    { name: 'project.json', content: JSON.stringify(projectJson, null, 2) },
    { name: 'layers/points.geojson', content: mergeGeojson('point') },
    { name: 'layers/lines.geojson', content: mergeGeojson('line') },
    { name: 'layers/areas.geojson', content: mergeGeojson('polygon') },
  ])

  const blob = new Blob([zipBytes], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'project-web.zip'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
