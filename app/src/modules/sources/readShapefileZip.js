// Converts a .zip shapefile to GeoJSON in the browser using shpjs.
// Only .zip input is accepted — no bare .shp support.
//
// Future: add GPKG support here using sql.js-httpvfs or a WASM-based GPKG reader.
// The returned shape ({ detectedLayers, warnings, fileName, error }) is the same
// interface this module would expose for GPKG, keeping App.jsx agnostic.

import { parseZip } from 'shpjs'

function layerBaseName(rawFileName) {
  if (!rawFileName) return 'capa'
  const last = rawFileName.split('/').pop().split('\\').pop()
  return last || rawFileName
}

function normalizeCollection(fc, rawFileName) {
  return {
    name: layerBaseName(rawFileName ?? fc.fileName),
    featureCount: Array.isArray(fc.features) ? fc.features.length : 0,
    geojson: fc,
  }
}

/**
 * Reads a .zip shapefile File and converts it to GeoJSON.
 *
 * Returns one of:
 *   { detectedLayers: Layer[], warnings: string[], fileName: string }
 *   { error: string }
 *
 * Where Layer = { name: string, featureCount: number, geojson: FeatureCollection }
 */
export async function readShapefileZip(file) {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    return { error: "El fitxer ha de ser un arxiu .zip que contingui els components del shapefile (.shp, .dbf, .shx)" }
  }

  let arrayBuffer
  try {
    arrayBuffer = await file.arrayBuffer()
  } catch {
    return { error: "No s'ha pogut llegir el fitxer" }
  }

  let result
  try {
    result = await parseZip(arrayBuffer)
  } catch (err) {
    return { error: buildErrorMessage(err) }
  }

  const warnings = []
  const collections = Array.isArray(result) ? result : [result]

  const validLayers = collections
    .filter((fc) => fc && fc.type === 'FeatureCollection' && Array.isArray(fc.features))
    .map((fc) => normalizeCollection(fc, fc.fileName))

  const emptyCount = collections.length - validLayers.length
  if (emptyCount > 0) {
    warnings.push(`${emptyCount} ${emptyCount === 1 ? 'capa sense' : 'capes sense'} geometries ignorada${emptyCount === 1 ? '' : 's'}`)
  }

  if (validLayers.length === 0) {
    return { error: 'El shapefile no conté geometries vàlides' }
  }

  return {
    detectedLayers: validLayers,
    warnings,
    fileName: file.name,
  }
}

function buildErrorMessage(err) {
  const msg = (err?.message ?? '').toLowerCase()
  if (msg.includes('no layers')) {
    return "No s'ha trobat cap fitxer .shp dins del ZIP"
  }
  if (msg.includes('dbf')) {
    return "Falta el fitxer .dbf dins del ZIP. El shapefile necessita .shp, .dbf i .shx"
  }
  if (msg.includes('shx')) {
    return "Falta el fitxer .shx dins del ZIP. El shapefile necessita .shp, .dbf i .shx"
  }
  if (msg.includes('proj') || msg.includes('prj')) {
    return "Error en llegir la projecció (.prj). Les coordenades poden ser incorrectes"
  }
  return `No s'ha pogut processar el shapefile: ${err?.message || 'error desconegut'}`
}
