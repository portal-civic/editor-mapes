import proj4 from 'proj4'

proj4.defs(
  'EPSG:25830',
  '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
)

/**
 * Transforms a WGS84 bbox [west, south, east, north] to EPSG:25830.
 * Returns [minX, minY, maxX, maxY] in metres.
 */
export function bbox4326To25830([west, south, east, north]) {
  const [x1, y1] = proj4('EPSG:4326', 'EPSG:25830', [west, south])
  const [x2, y2] = proj4('EPSG:4326', 'EPSG:25830', [east, south])
  const [x3, y3] = proj4('EPSG:4326', 'EPSG:25830', [east, north])
  const [x4, y4] = proj4('EPSG:4326', 'EPSG:25830', [west, north])
  return [
    Math.min(x1, x2, x3, x4),
    Math.min(y1, y2, y3, y4),
    Math.max(x1, x2, x3, x4),
    Math.max(y1, y2, y3, y4),
  ]
}
