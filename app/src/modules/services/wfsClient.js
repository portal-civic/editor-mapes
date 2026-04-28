/**
 * WFS client — fetches capabilities and features from OGC WFS services.
 *
 * URL encoding note:
 *   URLSearchParams over-encodes characters like :, /, ; which some WFS servers
 *   do not properly decode. The custom buildQueryString() below encodes only
 *   truly unsafe characters (space, &, #) so the URL matches what servers expect,
 *   e.g. TYPENAMES=ms:EdificacionesBCV05 and OUTPUTFORMAT=application/json; subtype=geojson.
 *
 * Axis order (WFS 2.0.0 + EPSG:25830):
 *   terramapas/MapServer (CV05) uses EPSG:25830 as native CRS for BBOX filtering.
 *   bbox4326To25830() reprojects the Leaflet viewport bbox before sending the request.
 *   The response is requested in EPSG:4326 so Leaflet can display it directly.
 */

import { bbox4326To25830 } from '../geo/projections'

// ── URL builder ───────────────────────────────────────────────────────────────

// Minimal encoding: only encode chars that would break the query string structure.
// Leaves :, /, ; unencoded to match the exact format WFS servers expect.
function qv(value) {
  return String(value)
    .replace(/%/g, '%25')
    .replace(/ /g, '%20')
    .replace(/&/g, '%26')
    .replace(/\+/g, '%2B')
    .replace(/#/g, '%23')
}

function buildWfsUrl(base, params) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${qv(v)}`)
    .join('&')
  return `${base}?${qs}`
}

// ── Capabilities ─────────────────────────────────────────────────────────────

/**
 * Fetches WFS GetCapabilities and returns an array of layer descriptors:
 * [{ name, title, abstract }]
 */
export async function fetchWfsCapabilities(serviceUrl) {
  const wfsUrl = buildWfsUrl(serviceUrl, {
    SERVICE: 'WFS',
    REQUEST: 'GetCapabilities',
  })

  let response
  try {
    response = await fetch(wfsUrl, {
      headers: { Accept: 'application/xml, text/xml, */*' },
    })
  } catch (networkErr) {
    const err = new Error('caps_network')
    err.cause = networkErr
    throw err
  }

  if (!response.ok) {
    throw new Error(`caps_http_${response.status}`)
  }

  const xml = await response.text()
  return parseCapabilities(xml)
}

function parseCapabilities(xmlText) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')

  if (doc.documentElement.nodeName === 'parsererror') {
    throw new Error('caps_parse_error')
  }

  return Array.from(doc.querySelectorAll('FeatureType'))
    .map((ft) => ({
      name: ft.querySelector('Name')?.textContent?.trim() ?? '',
      title: ft.querySelector('Title')?.textContent?.trim() ?? '',
      abstract: ft.querySelector('Abstract')?.textContent?.trim() ?? '',
    }))
    .filter((l) => l.name)
}

// ── Layer detection ───────────────────────────────────────────────────────────

const BUILDING_KEYWORDS = ['edific', 'construc', 'edifici']

const _normalize = (s) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

/**
 * Tries to find the building/construction layer from a capabilities list.
 * Returns the first matching layer descriptor or null if nothing is clear.
 */
export function findCv05BuildingLayer(layers) {
  for (const layer of layers) {
    const text = _normalize([layer.name, layer.title, layer.abstract].join(' '))
    for (const kw of BUILDING_KEYWORDS) {
      if (text.includes(_normalize(kw))) return layer
    }
  }
  return null
}

// ── GetFeature ────────────────────────────────────────────────────────────────

/**
 * Executes a WFS GetFeature request filtered by viewport bbox and returns { data, wfsUrl }.
 *
 * Options:
 *   url          — WFS service base URL
 *   typeName     — layer type name (e.g. "ms:EdificacionesBCV05")
 *   bbox         — [west, south, east, north] in WGS84 degrees (required)
 *   srsName      — native CRS of the service for BBOX filtering (e.g. 'EPSG:25830')
 *                  When 'EPSG:25830', bbox is reprojected before sending; output is always EPSG:4326.
 *   maxFeatures  — max features to return (default 5000)
 *   version      — WFS version string (default '2.0.0')
 *   outputFormat — MIME type for output (default 'application/json')
 *   language     — optional language hint (e.g. 'spa')
 *
 * Throws with err.wfsUrl set for debugging. Error codes: wfs_http_<n>, non_json, wfs_network
 * No automatic fallback — if the request fails, the error propagates to the caller.
 */
export async function fetchWfsGeoJson({
  url,
  typeName,
  bbox,
  srsName = 'EPSG:4326',
  maxFeatures = 5000,
  version = '2.0.0',
  outputFormat = 'application/json',
  language = null,
}) {
  const p = {}
  if (language) p.language = language
  p.SERVICE = 'WFS'
  p.VERSION = version
  p.REQUEST = 'GetFeature'

  // WFS 2.0.0 uses TYPENAMES + COUNT; 1.x uses typeName + maxFeatures
  if (version.startsWith('2')) {
    p.TYPENAMES = typeName
    p.COUNT = String(maxFeatures)
  } else {
    p.typeName = typeName
    p.maxFeatures = String(maxFeatures)
  }

  // Output is always in EPSG:4326 so Leaflet can display features directly
  p.SRSNAME = 'EPSG:4326'
  p.OUTPUTFORMAT = outputFormat

  if (bbox) {
    let bboxForFilter = bbox
    if (srsName === 'EPSG:25830') {
      bboxForFilter = bbox4326To25830(bbox)
    }
    p.BBOX = `${bboxForFilter[0]},${bboxForFilter[1]},${bboxForFilter[2]},${bboxForFilter[3]},${srsName}`
  }

  const wfsUrl = buildWfsUrl(url, p)
  // eslint-disable-next-line no-console
  console.info('[WFS] GET', wfsUrl)

  const result = await _doFetch(wfsUrl)
  return { ...result }
}

async function _doFetch(wfsUrl) {
  let response
  try {
    response = await fetch(wfsUrl)
  } catch (networkErr) {
    const err = new Error('wfs_network')
    err.wfsUrl = wfsUrl
    err.cause = networkErr
    throw err
  }

  if (!response.ok) {
    const err = new Error(`wfs_http_${response.status}`)
    err.wfsUrl = wfsUrl
    throw err
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) {
    let preview = ''
    try { preview = (await response.text()).slice(0, 600) } catch (_) { /* ignore */ }
    const err = new Error('non_json')
    err.wfsUrl = wfsUrl
    err.responsePreview = preview
    throw err
  }

  const data = await response.json()
  return { data, wfsUrl }
}
