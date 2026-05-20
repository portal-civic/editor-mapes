/**
 * OsmPoiModal.jsx (ara: modal multi-font de Punts d'Interès)
 * Tabs: OpenStreetMap | Overture Maps | GeoJSON Oficial
 */
import { useRef, useState, useCallback } from 'react'
import * as turf from '@turf/turf'
import { OSM_POI_CATEGORIES } from '../modules/osm/osmPoiCategories'
import { APP_CATEGORIES } from '../modules/poi/appCategoryRegistry'
import { fetchOsmPois } from '../modules/osm/fetchOsmPois'
import { loadOvertureGeoJson, fetchOverturePoisByBbox } from '../modules/poi/sources/overtureSource'
import { loadOfficialGeoJson } from '../modules/poi/sources/officialGeoJsonSource'
import { getLayerTurfFeatures } from '../modules/analysis/spatialOverlay'

const BBOX_AREA_WARNING_DEG2 = 0.5
const POI_COUNT_WARNING = 2000

const ALL_APP_CATEGORIES = [
  ...OSM_POI_CATEGORIES.map((c) => ({ ...c, sourceType: 'osm' })),
  ...APP_CATEGORIES.filter((c) => !OSM_POI_CATEGORIES.find((o) => o.id === c.id)),
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function bboxArea(bbox) {
  if (!bbox) return 0
  const [west, south, east, north] = bbox
  return Math.abs(east - west) * Math.abs(north - south)
}

function getBboxFromLayer(layer) {
  if (!layer) return null
  const features = getLayerTurfFeatures(layer)
  if (!features.length) return null
  try {
    const fc = turf.featureCollection(features.map((f) => f.turfFeat))
    return turf.bbox(fc)
  } catch { return null }
}

function filterPointsByPolygonLayer(points, layer) {
  if (!layer) return points
  const polygonFeatures = getLayerTurfFeatures(layer)
  if (!polygonFeatures.length) return points
  return points.filter((pt) => {
    const turfPt = turf.point(pt.geometry.coordinates)
    return polygonFeatures.some((pf) => {
      try { return turf.booleanPointInPolygon(turfPt, pf.turfFeat) } catch { return false }
    })
  })
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function SourceTab({ id, label, active, onClick }) {
  return (
    <button
      type="button"
      className={`poi-modal-tab${active ? ' poi-modal-tab--active' : ''}`}
      onClick={() => onClick(id)}
    >
      {label}
    </button>
  )
}

function ZoneSelector({ layers, zoneMode, setZoneMode, selectedLayerId, setSelectedLayerId, bbox, showBboxWarning }) {
  const polygonLayers = layers.filter(
    (l) => l.visible && (l.geometryType === 'polygon' || l.meta?.geometryType === 'polygon'),
  )
  return (
    <div className="sovlay-field">
      <label className="sovlay-label">Zona de cerca</label>
      <div className="osm-zone-row">
        <label className="osm-radio-label">
          <input type="radio" name="zoneMode" value="viewport" checked={zoneMode === 'viewport'}
            onChange={() => { setZoneMode('viewport'); setSelectedLayerId('') }} />
          Viewport actual
        </label>
        <label className="osm-radio-label">
          <input type="radio" name="zoneMode" value="layer" checked={zoneMode === 'layer'}
            onChange={() => setZoneMode('layer')} />
          Capa poligonal
        </label>
      </div>
      {zoneMode === 'layer' && (
        <select className="sovlay-select" value={selectedLayerId}
          onChange={(e) => setSelectedLayerId(e.target.value)} style={{ marginTop: 6 }}>
          <option value="">— Selecciona capa —</option>
          {polygonLayers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          {!polygonLayers.length && <option disabled>No hi ha capes de polígons</option>}
        </select>
      )}
      {!bbox && (
        <p className="sovlay-hint sovlay-hint--warn">
          {zoneMode === 'viewport' ? 'No hi ha viewport. Mou el mapa primer.' : 'Selecciona una capa.'}
        </p>
      )}
      {bbox && showBboxWarning && (
        <p className="sovlay-hint sovlay-hint--warn">
          Zona gran ({bboxArea(bbox).toFixed(2)} °²). La consulta pot trigar.
        </p>
      )}
    </div>
  )
}

// ── Tab OSM ───────────────────────────────────────────────────────────────────

function OsmTab({ layers, mapViewport, onCreateLayer, onClose }) {
  const [zoneMode, setZoneMode] = useState('viewport')
  const [selectedLayerId, setSelectedLayerId] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(
    () => new Set(OSM_POI_CATEGORIES.map((c) => c.id)),
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const polygonLayers = layers.filter(
    (l) => l.visible && (l.geometryType === 'polygon' || l.meta?.geometryType === 'polygon'),
  )
  const selectedLayer = polygonLayers.find((l) => l.id === selectedLayerId) ?? null
  const bbox = zoneMode === 'viewport' ? mapViewport : getBboxFromLayer(selectedLayer)
  const showBboxWarning = bboxArea(bbox) > BBOX_AREA_WARNING_DEG2
  const noneChecked = selectedCategoryIds.size === 0
  const allChecked = selectedCategoryIds.size === OSM_POI_CATEGORIES.length

  const toggleCategory = (id, checked) =>
    setSelectedCategoryIds((prev) => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n })
  const toggleAll = (checked) =>
    setSelectedCategoryIds(checked ? new Set(OSM_POI_CATEGORIES.map((c) => c.id)) : new Set())

  const handleLoad = async () => {
    if (!bbox || noneChecked || loading) return
    setLoading(true); setError(null); setResult(null)
    const controller = new AbortController()
    abortRef.current = controller
    await new Promise((r) => setTimeout(r, 20))
    try {
      const { features } = await fetchOsmPois({ bbox, selectedCategoryIds: [...selectedCategoryIds], signal: controller.signal })
      let filtered = features
      if (zoneMode === 'layer' && selectedLayer) filtered = filterPointsByPolygonLayer(features, selectedLayer)
      setResult({ count: filtered.length, features: filtered })
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message ?? 'Error carregant dades Overpass')
    } finally { setLoading(false); abortRef.current = null }
  }

  const handleCreateLayer = () => {
    if (!result?.features?.length) return
    const geojson = { type: 'FeatureCollection', features: result.features }
    const selectedCategories = OSM_POI_CATEGORIES.filter((c) => selectedCategoryIds.has(c.id))
    onCreateLayer(geojson, "Punts d'interès (OSM)", selectedCategories, 'osm')
    onClose()
  }

  const canLoad = !!bbox && !noneChecked && !loading
  const canCreate = result && result.count > 0 && !loading

  return (
    <>
      <ZoneSelector layers={layers} zoneMode={zoneMode} setZoneMode={setZoneMode}
        selectedLayerId={selectedLayerId} setSelectedLayerId={(v) => { setSelectedLayerId(v); setResult(null) }}
        bbox={bbox} showBboxWarning={showBboxWarning} />

      <div className="sovlay-field">
        <div className="osm-section-header">
          <label className="sovlay-label" style={{ margin: 0 }}>Categories OSM</label>
          <div className="osm-toggles">
            <button type="button" className="osm-toggle-btn" onClick={() => toggleAll(true)} disabled={allChecked}>Tot</button>
            <button type="button" className="osm-toggle-btn" onClick={() => toggleAll(false)} disabled={noneChecked}>Cap</button>
          </div>
        </div>
        <div className="osm-cat-grid">
          {OSM_POI_CATEGORIES.map((cat) => (
            <label key={cat.id} className="osm-cat-label">
              <input type="checkbox" checked={selectedCategoryIds.has(cat.id)} onChange={(e) => toggleCategory(cat.id, e.target.checked)} />
              <span className="osm-cat-dot" style={{ background: cat.color }} />
              <span className="osm-cat-icon">{cat.icon}</span>
              <span className="osm-cat-name">{cat.label}</span>
            </label>
          ))}
        </div>
        {noneChecked && <p className="sovlay-hint sovlay-hint--warn">Selecciona almenys una categoria.</p>}
      </div>

      <button type="button" className={`sovlay-calc-btn${loading ? ' sovlay-calc-btn--loading' : ''}`}
        onClick={handleLoad} disabled={!canLoad}>
        {loading ? <><span className="sovlay-spinner" aria-hidden="true" /> Consultant Overpass…</> : 'Carregar punts'}
      </button>
      {loading && (
        <button type="button" className="sovlay-export-btn" onClick={() => abortRef.current?.abort()}>Cancel·lar</button>
      )}
      {error && <p className="sovlay-error">{error}</p>}
      {result && !loading && (
        <div className="sovlay-results">
          <div className="sovlay-results-hdr">
            <h3 className="sovlay-results-title">{result.count.toLocaleString('ca')} punts trobats</h3>
            {result.count > 0 && (
              <button type="button" className="sovlay-calc-btn" onClick={handleCreateLayer}
                style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                Crear capa
              </button>
            )}
          </div>
          {result.count === 0 && <p className="sovlay-hint">Sense punts per a la zona i categories seleccionades.</p>}
          {result.count > POI_COUNT_WARNING && (
            <p className="sovlay-hint sovlay-hint--warn">Molts resultats ({result.count.toLocaleString('ca')}). La capa pot ser lenta.</p>
          )}
        </div>
      )}
    </>
  )
}

// ── Tab Overture ──────────────────────────────────────────────────────────────

const API_CONFIGURED = !!import.meta.env.VITE_API_BASE_URL

function OvertureTab({ mapViewport, onCreateLayer, onClose }) {
  // ── Mode: 'api' (viewport) o 'file' (importació avançada) ───────────────────
  const [mode, setMode] = useState(API_CONFIGURED ? 'api' : 'file')

  // ── Mode API ──────────────────────────────────────────────────────────────────
  const abortRef = useRef(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiResult, setApiResult] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [minConfidence, setMinConfidence] = useState(0.6)
  const [apiLimit, setApiLimit] = useState(5000)

  const bbox = mapViewport
    ? [mapViewport.west, mapViewport.south, mapViewport.east, mapViewport.north]
    : null

  const handleFetchApi = useCallback(async () => {
    if (!bbox) return
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setApiLoading(true); setApiError(null); setApiResult(null)
    try {
      const res = await fetchOverturePoisByBbox({
        bbox, limit: apiLimit, minConfidence, signal: controller.signal,
      })
      setApiResult(res)
    } catch (err) {
      if (err.name !== 'AbortError') setApiError(err.message)
    } finally { setApiLoading(false) }
  }, [bbox, apiLimit, minConfidence])

  const handleCreateLayerApi = () => {
    if (!apiResult?.features?.length) return
    const geojson = { type: 'FeatureCollection', features: apiResult.features }
    onCreateLayer(geojson, "Punts d'interès (Overture)", [], 'overture')
    onClose()
  }

  // ── Mode fitxer ───────────────────────────────────────────────────────────────
  const fileRef = useRef(null)
  const [fileName, setFileName] = useState(null)
  const [geojsonText, setGeojsonText] = useState(null)
  const [selectedCats, setSelectedCats] = useState(new Set())
  const [fileResult, setFileResult] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [fileLoading, setFileLoading] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name); setFileResult(null); setFileError(null)
    const reader = new FileReader()
    reader.onload = (ev) => setGeojsonText(ev.target.result)
    reader.readAsText(file)
  }

  const toggleCat = (id) =>
    setSelectedCats((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleProcessFile = () => {
    if (!geojsonText) return
    setFileLoading(true); setFileError(null); setFileResult(null)
    setTimeout(() => {
      try {
        const catFilter = selectedCats.size > 0 ? [...selectedCats] : null
        const res = loadOvertureGeoJson(geojsonText, catFilter)
        setFileResult(res)
      } catch (err) {
        setFileError(err.message)
      } finally { setFileLoading(false) }
    }, 0)
  }

  const handleCreateLayerFile = () => {
    if (!fileResult?.features?.length) return
    const geojson = { type: 'FeatureCollection', features: fileResult.features }
    onCreateLayer(geojson, "Punts d'interès (Overture)", [], 'overture')
    onClose()
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Mode switcher */}
      {API_CONFIGURED && (
        <div className="poi-overture-mode-row">
          <button
            type="button"
            className={`poi-overture-mode-btn${mode === 'api' ? ' poi-overture-mode-btn--active' : ''}`}
            onClick={() => setMode('api')}
          >
            Viewport actual
          </button>
          <button
            type="button"
            className={`poi-overture-mode-btn${mode === 'file' ? ' poi-overture-mode-btn--active' : ''}`}
            onClick={() => setMode('file')}
          >
            Importar fitxer
          </button>
        </div>
      )}

      {/* ── Mode API ── */}
      {mode === 'api' && (
        <>
          {!API_CONFIGURED ? (
            <p className="sovlay-hint sovlay-hint--warn">
              <strong>VITE_API_BASE_URL</strong> no configurada.
              Afig-la a <code>app/.env.local</code> per activar aquest mode.
            </p>
          ) : (
            <>
              <div className="sovlay-field">
                <label className="sovlay-label">Zona de consulta</label>
                {bbox ? (
                  <p className="sovlay-hint">
                    Viewport actual: {bbox.map((v) => v.toFixed(4)).join(', ')}
                  </p>
                ) : (
                  <p className="sovlay-hint sovlay-hint--warn">No hi ha viewport. Mou el mapa primer.</p>
                )}
              </div>

              <div className="sovlay-field">
                <div className="poi-overture-params">
                  <label className="poi-overture-param-row">
                    <span>Confiança mínima</span>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={minConfidence}
                      onChange={(e) => setMinConfidence(Number(e.target.value))}
                    />
                    <span className="poi-size-val">{Math.round(minConfidence * 100)}%</span>
                  </label>
                  <label className="poi-overture-param-row">
                    <span>Màxim de punts</span>
                    <select
                      className="poi-official-field-input"
                      value={apiLimit}
                      onChange={(e) => setApiLimit(Number(e.target.value))}
                      style={{ width: 'auto' }}
                    >
                      {[1000, 2000, 5000, 10000].map((v) => (
                        <option key={v} value={v}>{v.toLocaleString('ca')}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <button
                type="button"
                className={`sovlay-calc-btn${apiLoading ? ' sovlay-calc-btn--loading' : ''}`}
                onClick={handleFetchApi}
                disabled={apiLoading || !bbox}
              >
                {apiLoading
                  ? <><span className="sovlay-spinner" aria-hidden="true" /> Consultant Overture…</>
                  : 'Carregar POIs del viewport'}
              </button>

              {apiError && <p className="sovlay-error">{apiError}</p>}

              {apiResult && !apiLoading && (
                <div className="sovlay-results">
                  <div className="sovlay-results-hdr">
                    <h3 className="sovlay-results-title">
                      {apiResult.features.length.toLocaleString('ca')} punts carregats
                    </h3>
                    {apiResult.features.length > 0 && (
                      <button type="button" className="sovlay-calc-btn" onClick={handleCreateLayerApi}
                        style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                        Crear capa
                      </button>
                    )}
                  </div>
                  {apiResult.features.length === 0 && (
                    <p className="sovlay-hint">Cap POI trobat per a aquest viewport i paràmetres.</p>
                  )}
                  {apiResult.features.length > POI_COUNT_WARNING && (
                    <p className="sovlay-hint sovlay-hint--warn">
                      Molts punts ({apiResult.features.length.toLocaleString('ca')}). El mapa pot anar lent.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Mode fitxer ── */}
      {mode === 'file' && (
        <>
          <div className="sovlay-field">
            <label className="sovlay-label">Fitxer GeoJSON d'Overture</label>
            <p className="sovlay-hint">
              Exporta amb: <code>overturemaps download --bbox &lt;west,south,east,north&gt; -f geojson --type place -o places.geojson</code>
            </p>
            <div className="poi-file-row">
              <button type="button" className="poi-file-btn" onClick={() => fileRef.current?.click()}>
                Seleccionar fitxer…
              </button>
              <span className="poi-file-name">{fileName ?? 'Cap fitxer seleccionat'}</span>
              <input ref={fileRef} type="file" accept=".geojson,.json" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          </div>

          {geojsonText && (
            <div className="sovlay-field">
              <div className="osm-section-header">
                <label className="sovlay-label" style={{ margin: 0 }}>Filtre de categories (opcional)</label>
                {selectedCats.size > 0 && (
                  <button type="button" className="osm-toggle-btn" onClick={() => setSelectedCats(new Set())}>Netejar</button>
                )}
              </div>
              <div className="osm-cat-grid">
                {ALL_APP_CATEGORIES.map((cat) => (
                  <label key={cat.id} className="osm-cat-label">
                    <input type="checkbox" checked={selectedCats.has(cat.id)} onChange={() => toggleCat(cat.id)} />
                    <span className="osm-cat-dot" style={{ background: cat.color }} />
                    <span className="osm-cat-icon">{cat.icon}</span>
                    <span className="osm-cat-name">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {geojsonText && (
            <button type="button" className={`sovlay-calc-btn${fileLoading ? ' sovlay-calc-btn--loading' : ''}`}
              onClick={handleProcessFile} disabled={fileLoading}>
              {fileLoading ? <><span className="sovlay-spinner" aria-hidden="true" /> Processant…</> : 'Processar fitxer'}
            </button>
          )}

          {fileError && <p className="sovlay-error">{fileError}</p>}

          {fileResult && !fileLoading && (
            <div className="sovlay-results">
              <div className="sovlay-results-hdr">
                <h3 className="sovlay-results-title">
                  {fileResult.features.length.toLocaleString('ca')} punts processats
                  {fileResult.skipped > 0 && <span className="poi-skipped"> ({fileResult.skipped} omesos)</span>}
                </h3>
                {fileResult.features.length > 0 && (
                  <button type="button" className="sovlay-calc-btn" onClick={handleCreateLayerFile}
                    style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                    Crear capa
                  </button>
                )}
              </div>
              {fileResult.features.length === 0 && <p className="sovlay-hint">Cap punt vàlid trobat al fitxer.</p>}
              {fileResult.features.length > POI_COUNT_WARNING && (
                <p className="sovlay-hint sovlay-hint--warn">
                  Molts punts ({fileResult.features.length.toLocaleString('ca')}). Considera filtrar per categories.
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="poi-overture-info">
        <strong>Overture Maps</strong> conserva la taxonomia completa (basic_category, taxonomy.primary, taxonomy.hierarchy).
        Disponible al popup, la taula de dades i l'exportació.
      </div>
    </>
  )
}

// ── Tab GeoJSON Oficial ───────────────────────────────────────────────────────

function OfficialTab({ onCreateLayer, onClose }) {
  const fileRef = useRef(null)
  const [fileName, setFileName] = useState(null)
  const [geojsonText, setGeojsonText] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState({
    idField: '', nameField: '', categoryField: '', subcategoryField: '', addressField: '',
    appCategory: '',
  })

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name); setResult(null); setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => setGeojsonText(ev.target.result)
    reader.readAsText(file)
  }

  const setField = (k, v) => setConfig((prev) => ({ ...prev, [k]: v }))

  const handleProcess = () => {
    if (!geojsonText) return
    setLoading(true); setError(null); setResult(null)
    setTimeout(() => {
      try {
        const res = loadOfficialGeoJson(geojsonText, config)
        setResult(res)
      } catch (err) {
        setError(err.message)
      } finally { setLoading(false) }
    }, 0)
  }

  const handleCreateLayer = () => {
    if (!result?.features?.length) return
    const geojson = { type: 'FeatureCollection', features: result.features }
    onCreateLayer(geojson, "Punts d'interès (Oficial)", [], 'official')
    onClose()
  }

  return (
    <>
      <div className="sovlay-field">
        <label className="sovlay-label">Fitxer GeoJSON</label>
        <div className="poi-file-row">
          <button type="button" className="poi-file-btn" onClick={() => fileRef.current?.click()}>Seleccionar fitxer…</button>
          <span className="poi-file-name">{fileName ?? 'Cap fitxer seleccionat'}</span>
          <input ref={fileRef} type="file" accept=".geojson,.json" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      </div>

      {geojsonText && (
        <div className="sovlay-field">
          <label className="sovlay-label">Configuració de camps</label>
          <p className="sovlay-hint">Deixa buit si el camp no existeix al fitxer.</p>
          <div className="poi-official-fields">
            {[
              ['idField', 'Camp ID'],
              ['nameField', 'Camp Nom'],
              ['categoryField', 'Camp Categoria'],
              ['subcategoryField', 'Camp Subcategoria'],
              ['addressField', 'Camp Adreça'],
            ].map(([key, label]) => (
              <div key={key} className="poi-official-field-row">
                <span className="poi-official-field-label">{label}</span>
                <input
                  type="text" className="poi-official-field-input"
                  value={config[key]} placeholder={key}
                  onChange={(e) => setField(key, e.target.value)}
                />
              </div>
            ))}
            <div className="poi-official-field-row">
              <span className="poi-official-field-label">Categoria interna forçada</span>
              <select className="poi-official-field-input" value={config.appCategory} onChange={(e) => setField('appCategory', e.target.value)}>
                <option value="">(automàtic)</option>
                {ALL_APP_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {geojsonText && (
        <button type="button" className={`sovlay-calc-btn${loading ? ' sovlay-calc-btn--loading' : ''}`}
          onClick={handleProcess} disabled={loading}>
          {loading ? <><span className="sovlay-spinner" aria-hidden="true" /> Processant…</> : 'Processar fitxer'}
        </button>
      )}

      {error && <p className="sovlay-error">{error}</p>}

      {result && !loading && (
        <div className="sovlay-results">
          <div className="sovlay-results-hdr">
            <h3 className="sovlay-results-title">
              {result.features.length.toLocaleString('ca')} punts processats
              {result.skipped > 0 && <span className="poi-skipped"> ({result.skipped} omesos)</span>}
            </h3>
            {result.features.length > 0 && (
              <button type="button" className="sovlay-calc-btn" onClick={handleCreateLayer}
                style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                Crear capa
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── Modal principal ───────────────────────────────────────────────────────────

export default function OsmPoiModal({ layers, mapViewport, onClose, onCreateLayer }) {
  const [activeTab, setActiveTab] = useState('osm')

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="osm-modal osm-modal--wide">
        <div className="sovlay-header">
          <h2 className="sovlay-title">Punts d'interès</h2>
          <button type="button" className="sovlay-close" onClick={onClose} aria-label="Tancar">✕</button>
        </div>

        <div className="poi-modal-tabs">
          <SourceTab id="osm" label="OpenStreetMap" active={activeTab === 'osm'} onClick={setActiveTab} />
          <SourceTab id="overture" label="Overture Maps" active={activeTab === 'overture'} onClick={setActiveTab} />
          <SourceTab id="official" label="GeoJSON Oficial" active={activeTab === 'official'} onClick={setActiveTab} />
        </div>

        <div className="sovlay-body">
          {activeTab === 'osm' && (
            <OsmTab layers={layers} mapViewport={mapViewport} onCreateLayer={onCreateLayer} onClose={onClose} />
          )}
          {activeTab === 'overture' && (
            <OvertureTab mapViewport={mapViewport} onCreateLayer={onCreateLayer} onClose={onClose} />
          )}
          {activeTab === 'official' && (
            <OfficialTab onCreateLayer={onCreateLayer} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  )
}
