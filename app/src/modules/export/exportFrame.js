// Shared export frame: defines the geographic and pixel extent used for
// both PNG and SVG exports so files align perfectly when overlaid.
//
// ExportFrame = { bounds: LeafletBounds, width: number, height: number }

export function getExportFrame(map) {
  const rect = map.getContainer().getBoundingClientRect()
  return {
    bounds: map.getBounds(),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  }
}

// Web Mercator (EPSG:3857) latitude to normalized Y factor.
// Matches the tile projection used by Leaflet/OSM basemaps.
function latToMercatorY(lat) {
  const rad = (lat * Math.PI) / 180
  return Math.log(Math.tan(Math.PI / 4 + rad / 2))
}

// Projects geographic coordinates to pixel coordinates within the export frame.
// Returns { x, y } — top-left origin, Y increases downward.
// Reusable for any geometry type: point coordinates, line vertices, polygon rings.
export function projectToPixel(lat, lng, frame) {
  const { bounds, width, height } = frame
  const west = bounds.getWest()
  const east = bounds.getEast()
  const south = bounds.getSouth()
  const north = bounds.getNorth()

  const x = ((lng - west) / (east - west)) * width

  const yTop = latToMercatorY(north)
  const yBottom = latToMercatorY(south)
  const y = ((yTop - latToMercatorY(lat)) / (yTop - yBottom)) * height

  return { x, y }
}
