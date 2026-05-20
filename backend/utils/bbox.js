// Max area in decimal degrees squared before we reject the request (roughly ~500km²)
const MAX_BBOX_AREA_DEG2 = 0.5

/**
 * Parse a bbox string "west,south,east,north" into an array of numbers.
 * Throws an Error with status 400 if the input is invalid.
 */
export function parseBbox(value) {
  if (!value || typeof value !== 'string') {
    const err = new Error('bbox is required (format: west,south,east,north)')
    err.status = 400
    throw err
  }

  const parts = value.split(',').map(Number)
  if (parts.length !== 4 || parts.some(isNaN)) {
    const err = new Error('bbox must be four numbers: west,south,east,north')
    err.status = 400
    throw err
  }

  const [west, south, east, north] = parts

  if (west >= east || south >= north) {
    const err = new Error('bbox is degenerate: west must be < east and south must be < north')
    err.status = 400
    throw err
  }

  if (west < -180 || east > 180 || south < -90 || north > 90) {
    const err = new Error('bbox coordinates out of valid range (lon: ±180, lat: ±90)')
    err.status = 400
    throw err
  }

  return [west, south, east, north]
}

/**
 * Throws 413 if the bbox area exceeds the allowed maximum.
 */
export function assertBboxIsReasonable(bbox) {
  const [west, south, east, north] = bbox
  const area = Math.abs(east - west) * Math.abs(north - south)
  if (area > MAX_BBOX_AREA_DEG2) {
    const err = new Error(
      `bbox area ${area.toFixed(3)} °² exceeds maximum ${MAX_BBOX_AREA_DEG2} °² — zoom in or reduce the area`,
    )
    err.status = 413
    throw err
  }
}

/**
 * Serialise bbox back to the canonical "west,south,east,north" string.
 */
export function bboxToString([west, south, east, north]) {
  return `${west},${south},${east},${north}`
}
