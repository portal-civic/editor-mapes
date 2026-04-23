/**
 * readGpkg.js — Minimal GeoPackage reader for the browser.
 *
 * Pipeline:
 *   .gpkg File
 *   → openGpkgFile()          reads layer list (no geometry yet)
 *   → GpkgHandle.convertLayer() decodes WKB, reprojects, builds FeatureCollection
 *   → openSourceImportFromGeojson() (caller's responsibility)
 *
 * Future extension points (marked FUTURE: in code):
 *   - viewport bbox SQL filter before full row fetch
 *   - attribute-level WHERE clause before conversion
 *   - direct GPKG-backed source (stream rows without full conversion)
 *   - raster tile layer support
 */

// Static import so Vite copies the WASM to dist and gives us the URL.
// sql.js JS itself is dynamically imported to keep the main bundle small.
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import proj4 from 'proj4'

// ─── sql.js singleton ─────────────────────────────────────────────────────────

let _sqlJs = null

async function getSqlJs() {
  if (_sqlJs) return _sqlJs
  const { default: initSqlJs } = await import('sql.js')
  _sqlJs = await initSqlJs({ locateFile: () => sqlWasmUrl })
  return _sqlJs
}

// ─── GPKG Binary Format ───────────────────────────────────────────────────────
// OGC GeoPackage spec §2.1.3: 8-byte header (magic + version + flags + srs_id)
// followed by optional envelope, followed by WKB.

const ENVELOPE_BYTES = [0, 32, 48, 48, 64] // indexed by flags bits 1–3

function decodeGpkgGeom(bytes) {
  // bytes: Uint8Array from the SQLite BLOB column
  if (!bytes || bytes.length < 8) return null
  if (bytes[0] !== 0x47 || bytes[1] !== 0x50) return null // 'GP' magic

  const flags = bytes[3]
  if ((flags >> 4) & 0x01) return null // empty geometry flag

  const envIndicator = (flags >> 1) & 0x07
  const wkbStart = 8 + (ENVELOPE_BYTES[envIndicator] || 0)
  if (wkbStart >= bytes.length) return null

  // Re-use the underlying ArrayBuffer with an offset instead of slicing (no copy)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  try {
    return new WkbReader(view, wkbStart).readGeometry()
  } catch {
    return null
  }
}

// ─── WKB Parser ──────────────────────────────────────────────────────────────
// Handles: Point, LineString, Polygon, Multi*, GeometryCollection
// Handles byte-order per sub-geometry (WKB standard)
// Handles Z/M coords (ISO +1000/+2000/+3000 and EWKB bit flags) — dropped to XY

class WkbReader {
  constructor(view, pos = 0) {
    this._v = view
    this._p = pos
  }

  _u8()     { return this._v.getUint8(this._p++) }
  _u32(le)  { const v = this._v.getUint32(this._p, le); this._p += 4; return v }
  _f64(le)  { const v = this._v.getFloat64(this._p, le); this._p += 8; return v }

  readGeometry() {
    const le = this._u8() === 1
    let t = this._u32(le)

    // EWKB upper-bit flags
    let hasZ = false, hasM = false
    if (t & 0x80000000) { hasZ = true; t &= 0x0FFFFFFF }
    if (t & 0x40000000) { hasM = true; t &= 0x0FFFFFFF }
    if (t & 0x20000000) { this._p += 4; t &= 0x0FFFFFFF } // embedded SRID

    // ISO SQL/MM type offsets
    if      (t >= 3000 && t < 4000) { hasZ = true; hasM = true; t -= 3000 }
    else if (t >= 2000 && t < 3000) { hasM = true; t -= 2000 }
    else if (t >= 1000 && t < 2000) { hasZ = true; t -= 1000 }

    switch (t) {
      case 1: return this._point(le, hasZ, hasM)
      case 2: return this._lineStr(le, hasZ, hasM)
      case 3: return this._poly(le, hasZ, hasM)
      case 4: return this._multi(le, 'MultiPoint')
      case 5: return this._multi(le, 'MultiLineString')
      case 6: return this._multi(le, 'MultiPolygon')
      case 7: return this._collection(le)
      default: throw new Error(`WKB type ${t} not supported`)
    }
  }

  _xy(le, hasZ, hasM) {
    const x = this._f64(le), y = this._f64(le)
    if (hasZ) this._f64(le)
    if (hasM) this._f64(le)
    return [x, y]
  }

  _coords(le, hasZ, hasM) {
    const n = this._u32(le), out = []
    for (let i = 0; i < n; i++) out.push(this._xy(le, hasZ, hasM))
    return out
  }

  _point(le, hasZ, hasM) {
    const c = this._xy(le, hasZ, hasM)
    return isFinite(c[0]) && isFinite(c[1]) ? { type: 'Point', coordinates: c } : null
  }

  _lineStr(le, hasZ, hasM) {
    return { type: 'LineString', coordinates: this._coords(le, hasZ, hasM) }
  }

  _poly(le, hasZ, hasM) {
    const n = this._u32(le), rings = []
    for (let i = 0; i < n; i++) rings.push(this._coords(le, hasZ, hasM))
    return { type: 'Polygon', coordinates: rings }
  }

  _multi(le, type) {
    const n = this._u32(le), coords = []
    for (let i = 0; i < n; i++) {
      const g = this.readGeometry()
      if (g) coords.push(g.coordinates)
    }
    return { type, coordinates: coords }
  }

  _collection(le) {
    const n = this._u32(le), geoms = []
    for (let i = 0; i < n; i++) {
      const g = this.readGeometry()
      if (g) geoms.push(g)
    }
    return { type: 'GeometryCollection', geometries: geoms }
  }
}

// ─── Reprojection ─────────────────────────────────────────────────────────────

const _projCache = new Map()

function buildConverter(srsId, definition) {
  if (srsId === 4326 || srsId === 0) return null
  if (_projCache.has(srsId)) return _projCache.get(srsId)

  let conv = null
  try {
    const code = `EPSG:${srsId}`
    if (!proj4.defs(code) && definition) proj4.defs(code, definition)
    conv = proj4(code, 'EPSG:4326')
  } catch {
    // Unknown CRS — coordinates passed as-is
  }

  _projCache.set(srsId, conv)
  return conv
}

function fwd(conv, xy) {
  try { return conv ? conv.forward(xy) : xy } catch { return xy }
}

function reprojectGeom(geom, conv) {
  if (!geom || !conv) return geom
  switch (geom.type) {
    case 'Point':
      return { ...geom, coordinates: fwd(conv, geom.coordinates) }
    case 'LineString':
    case 'MultiPoint':
      return { ...geom, coordinates: geom.coordinates.map(c => fwd(conv, c)) }
    case 'Polygon':
    case 'MultiLineString':
      return { ...geom, coordinates: geom.coordinates.map(r => r.map(c => fwd(conv, c))) }
    case 'MultiPolygon':
      return { ...geom, coordinates: geom.coordinates.map(p => p.map(r => r.map(c => fwd(conv, c)))) }
    default:
      return geom
  }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

function query(db, sql, params = []) {
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function safeQuery(db, sql, params = []) {
  try { return query(db, sql, params) } catch { return [] }
}

// ─── GpkgHandle ──────────────────────────────────────────────────────────────

/**
 * Holds an open sql.js Database.
 * Must be stored in a useRef — never in React state.
 *
 * FUTURE: add streamFeatures(index, viewport, limit) to fetch only rows whose
 * geometry envelope (stored in the gpkg_rtree_* virtual table) intersects the
 * given bounding box, avoiding full table scan for large layers.
 */
export class GpkgHandle {
  constructor(db, layers, warnings, fileName) {
    this._db = db
    /** @type {{ name: string, tableName: string, geomColumn: string, srsId: number, featureCount: number }[]} */
    this.layers = layers
    this.warnings = warnings
    this.fileName = fileName
  }

  /**
   * Converts all features of one layer to a GeoJSON FeatureCollection.
   * FUTURE: accept { viewport, limit, filter } to restrict rows before decode.
   */
  async convertLayer(index) {
    return convertLayer(this._db, this.layers[index])
  }

  close() { try { this._db.close() } catch {} }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Opens a .gpkg file and returns a GpkgHandle (or { error } on failure).
 * Does NOT decode any geometry — just reads layer metadata.
 *
 * FUTURE: return a GPKG-backed source descriptor so features can be read
 * on demand (per viewport) without a full upfront conversion pass.
 */
export async function openGpkgFile(file) {
  if (!file.name.toLowerCase().endsWith('.gpkg')) {
    return { error: 'El fitxer ha de tenir extensió .gpkg' }
  }

  let SQL, buf
  try {
    ;[SQL, buf] = await Promise.all([getSqlJs(), file.arrayBuffer()])
  } catch {
    return { error: "No s'ha pogut carregar el motor SQLite o llegir el fitxer" }
  }

  let db
  try {
    db = new SQL.Database(new Uint8Array(buf))
  } catch {
    return { error: 'El fitxer no és un GeoPackage SQLite vàlid' }
  }

  // Minimal GPKG validation
  const hasMeta = safeQuery(
    db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name='gpkg_contents'",
  )
  if (!hasMeta.length) {
    db.close()
    return { error: "El fitxer no és un GeoPackage vàlid (falta gpkg_contents)" }
  }

  // Vector feature tables only — FUTURE: add 'tiles' for raster support
  const contents = safeQuery(
    db,
    "SELECT table_name, identifier, srs_id FROM gpkg_contents WHERE data_type = 'features' ORDER BY table_name",
  )
  if (!contents.length) {
    db.close()
    return { error: 'El GeoPackage no conté cap capa vectorial' }
  }

  // Geometry column per table
  const geomCols = safeQuery(db, 'SELECT table_name, column_name FROM gpkg_geometry_columns')
  const geomColMap = Object.fromEntries(geomCols.map(r => [r.table_name, r.column_name]))

  const warnings = []
  const layers = []

  for (const row of contents) {
    const tableName = row.table_name
    const geomColumn = geomColMap[tableName] || 'geom'

    let featureCount = 0
    try {
      const r = query(db, `SELECT COUNT(*) AS n FROM "${tableName}"`)
      featureCount = r[0]?.n ?? 0
    } catch {
      warnings.push(`No s'ha pogut comptar la capa "${row.identifier || tableName}"`)
    }

    layers.push({
      name: String(row.identifier || tableName),
      tableName,
      geomColumn,
      srsId: Number(row.srs_id) || 4326,
      featureCount,
    })
  }

  return new GpkgHandle(db, layers, warnings, file.name)
}

// ─── Layer conversion ─────────────────────────────────────────────────────────

async function convertLayer(db, layer) {
  const { tableName, geomColumn, srsId } = layer

  // Resolve reprojection converter from GPKG SRS metadata
  let conv = null
  if (srsId !== 4326) {
    const srsRows = safeQuery(
      db,
      'SELECT definition FROM gpkg_spatial_ref_sys WHERE srs_id = ?',
      [srsId],
    )
    conv = buildConverter(srsId, srsRows[0]?.definition || null)
    if (!conv) {
      console.warn(`[readGpkg] Unknown SRS ${srsId} — coordinates may be wrong`)
    }
  }

  // FUTURE: add WHERE clause here using gpkg_rtree_<table>_<geom> to filter by
  // viewport bounding box before pulling all rows into memory.
  // FUTURE: add LIMIT / OFFSET for attribute-filter pagination.
  const rows = safeQuery(db, `SELECT * FROM "${tableName}"`)

  let failed = 0
  const features = []

  for (const row of rows) {
    const blobVal = row[geomColumn]
    const properties = {}
    for (const [k, v] of Object.entries(row)) {
      if (k !== geomColumn) properties[k] = v
    }

    if (!blobVal) { failed++; continue }

    // sql.js returns BLOBs as Uint8Array
    const bytes = blobVal instanceof Uint8Array ? blobVal : new Uint8Array(blobVal)
    const geom = decodeGpkgGeom(bytes)
    if (!geom) { failed++; continue }

    features.push({
      type: 'Feature',
      geometry: reprojectGeom(geom, conv),
      properties,
    })
  }

  if (failed > 0) {
    console.warn(`[readGpkg] ${failed} geometries skipped in "${tableName}"`)
  }

  return { type: 'FeatureCollection', features }
}
