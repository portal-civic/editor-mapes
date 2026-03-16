/**
 * Basemap adapter — converts a catalog entry into props
 * that can be spread directly onto a React-Leaflet TileLayer.
 *
 * Supported types: xyz
 * Scaffolded (not yet functional): wms, wmts
 */

const FALLBACK_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const FALLBACK_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function buildFallbackProps() {
  return {
    url: FALLBACK_URL,
    attribution: FALLBACK_ATTRIBUTION,
    maxZoom: 19,
  }
}

/**
 * Returns a plain object with TileLayer props derived from a basemap
 * catalog entry. Safe to spread onto <TileLayer {...props} />.
 *
 * @param {object|null} basemap — A catalog entry from basemapCatalog.
 * @returns {object} TileLayer props.
 */
export function getTileLayerProps(basemap) {
  if (!basemap) {
    return buildFallbackProps()
  }

  if (basemap.type === 'xyz') {
    const props = {
      url: basemap.url,
      attribution: basemap.attribution,
      maxZoom: basemap.maxZoom ?? 19,
    }

    if (basemap.minZoom != null) {
      props.minZoom = basemap.minZoom
    }

    if (basemap.subdomains) {
      props.subdomains = basemap.subdomains
    }

    // Merge any extra Leaflet options declared in the catalog entry
    if (basemap.options && typeof basemap.options === 'object') {
      Object.assign(props, basemap.options)
    }

    return props
  }

  if (basemap.type === 'wms') {
    // WMS support — future phase.
    // Will need: layers, format, transparent, version, crs from basemap.options.
    console.warn(
      `[basemapAdapter] WMS basemaps are not yet supported (id: "${basemap.id}"). Falling back to OSM.`,
    )
    return buildFallbackProps()
  }

  if (basemap.type === 'wmts') {
    // WMTS support — future phase.
    // Will need: layer, tilematrixset, format, style from basemap.options.
    console.warn(
      `[basemapAdapter] WMTS basemaps are not yet supported (id: "${basemap.id}"). Falling back to OSM.`,
    )
    return buildFallbackProps()
  }

  console.warn(
    `[basemapAdapter] Unknown basemap type "${basemap.type}" (id: "${basemap.id}"). Falling back to OSM.`,
  )
  return buildFallbackProps()
}
