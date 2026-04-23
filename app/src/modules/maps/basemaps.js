/**
 * Basemap catalog.
 *
 * Each entry describes one basemap option available in the editor.
 *
 * Fields:
 *   id            — Unique string identifier. Persisted in project files.
 *   name          — Human-readable display name.
 *   type          — Tile source type: 'xyz' | 'wms' | 'wmts'
 *   url           — Tile URL template (xyz) or service endpoint (wms/wmts).
 *   attribution   — HTML attribution string shown on the map.
 *   thumbnail     — Optional path/URL to a preview image (not yet used in UI).
 *   minZoom       — Minimum zoom level for this tile source.
 *   maxZoom       — Maximum zoom level at which tiles are available.
 *   subdomains    — Subdomain string or array for {s} substitution (xyz only).
 *   category      — UI grouping: 'general' | 'light' | 'dark' | 'satellite' | 'topo' | 'official' | 'custom'
 *   default       — True for the basemap selected on fresh projects.
 *   requiresApiKey — True if an API key is needed to use this source.
 *   apiKeyEnv     — Name of the env variable that holds the API key (if any).
 *   options       — Extra Leaflet TileLayer options merged into the layer props.
 */
export const basemapCatalog = [
  // ── General ───────────────────────────────────────────────
  {
    id: 'osm',
    name: 'OpenStreetMap',
    type: 'xyz',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    thumbnail: null,
    minZoom: 0,
    maxZoom: 19,
    subdomains: 'abc',
    category: 'general',
    default: true,
    requiresApiKey: false,
    apiKeyEnv: null,
    options: {},
  },
  {
    id: 'carto-voyager',
    name: 'Carto Voyager',
    type: 'xyz',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    thumbnail: null,
    minZoom: 0,
    maxZoom: 20,
    subdomains: 'abcd',
    category: 'general',
    default: false,
    requiresApiKey: false,
    apiKeyEnv: null,
    options: {},
  },
  {
    id: 'esri-street',
    name: 'Esri World Street Map',
    type: 'xyz',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom',
    thumbnail: null,
    minZoom: 0,
    maxZoom: 20,
    subdomains: null,
    category: 'general',
    default: false,
    requiresApiKey: false,
    apiKeyEnv: null,
    options: {},
  },

  // ── Light ─────────────────────────────────────────────────
  {
    id: 'carto-positron',
    name: 'Carto Positron',
    type: 'xyz',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    thumbnail: null,
    minZoom: 0,
    maxZoom: 20,
    subdomains: 'abcd',
    category: 'light',
    default: false,
    requiresApiKey: false,
    apiKeyEnv: null,
    options: {},
  },

  {
    id: 'carto-positron-nolabels',
    name: 'Carto Positron (sense etiquetes)',
    type: 'xyz',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    thumbnail: null,
    minZoom: 0,
    maxZoom: 20,
    subdomains: 'abcd',
    category: 'light',
    default: false,
    requiresApiKey: false,
    apiKeyEnv: null,
    options: {},
  },

  // ── Dark ──────────────────────────────────────────────────
  {
    id: 'carto-dark',
    name: 'Carto Dark Matter',
    type: 'xyz',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    thumbnail: null,
    minZoom: 0,
    maxZoom: 20,
    subdomains: 'abcd',
    category: 'dark',
    default: false,
    requiresApiKey: false,
    apiKeyEnv: null,
    options: {},
  },

  {
    id: 'carto-darkmatter-nolabels',
    name: 'Carto Dark Matter (sense etiquetes)',
    type: 'xyz',
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    thumbnail: null,
    minZoom: 0,
    maxZoom: 20,
    subdomains: 'abcd',
    category: 'dark',
    default: false,
    requiresApiKey: false,
    apiKeyEnv: null,
    options: {},
  },

  // ── Satellite ─────────────────────────────────────────────
  {
    id: 'esri-imagery',
    name: 'Esri World Imagery',
    type: 'xyz',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    thumbnail: null,
    minZoom: 0,
    maxZoom: 20,
    subdomains: null,
    category: 'satellite',
    default: false,
    requiresApiKey: false,
    apiKeyEnv: null,
    options: {},
  },

  // ── Topo ──────────────────────────────────────────────────
  {
    id: 'opentopomap',
    name: 'OpenTopoMap',
    type: 'xyz',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    thumbnail: null,
    minZoom: 0,
    maxZoom: 17,
    subdomains: 'abc',
    category: 'topo',
    default: false,
    requiresApiKey: false,
    apiKeyEnv: null,
    options: {},
  },
  {
    id: 'esri-topo',
    name: 'Esri World Topo Map',
    type: 'xyz',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong)',
    thumbnail: null,
    minZoom: 0,
    maxZoom: 20,
    subdomains: null,
    category: 'topo',
    default: false,
    requiresApiKey: false,
    apiKeyEnv: null,
    options: {},
  },
]

/** Flat array used for rendering selectors and resolving basemaps by id. */
export const basemapOptions = basemapCatalog

/** Id of the basemap selected on fresh projects. */
export const defaultBasemapId = basemapCatalog.find((b) => b.default)?.id ?? 'osm'
