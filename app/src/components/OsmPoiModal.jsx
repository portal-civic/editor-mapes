import { useRef, useState } from 'react'
import * as turf from '@turf/turf'
import { OSM_POI_CATEGORIES } from '../modules/osm/osmPoiCategories'
import { fetchOsmPois } from '../modules/osm/fetchOsmPois'
import { getLayerTurfFeatures } from '../modules/analysis/spatialOverlay'

const BBOX_AREA_WARNING_DEG2 = 0.5
const POI_COUNT_WARNING = 2000

// ── Helpers ───────────────────────────────────────────────────────────────────

function bboxArea(bbox) {
  if (!bbox) return 0
  const [west, south, east, north] = bbox
  return Math.abs(east - west) * Math.abs(north - south)
}

function getBboxFromLayer(layer) {
  if (!layer) return null
  const features = getLayerTurfFeatures(layer)
  if (features.length === 0) return null
  try {
    const fc = turf.featureCollection(features.map((f) => f.turfFeat))
    return turf.bbox(fc)
  } catch {
    return null
  }
}

function filterPointsByPolygonLayer(points, layer) {
  if (!layer) return points
  const polygonFeatures = getLayerTurfFeatures(layer)
  if (polygonFeatures.length === 0) return points
  return points.filter((pt) => {
    const turfPt = turf.point(pt.geometry.coordinates)
    return polygonFeatures.some((pf) => {
      try { return turf.booleanPointInPolygon(turfPt, pf.turfFeat) } catch { return false }
    })
  })
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function CategoryCheckbox({ cat, checked, onChange }) {
  return (
    <label className="osm-cat-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(cat.id, e.target.checked)}
      />
      <span className="osm-cat-dot" style={{ background: cat.color }} />
      <span className="osm-cat-icon">{cat.icon}</span>
      <span className="osm-cat-name">{cat.label}</span>
    </label>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function OsmPoiModal({ layers, mapViewport, onClose, onCreateLayer }) {
  const [zoneMode, setZoneMode] = useState('viewport') // 'viewport' | 'layer'
  const [selectedLayerId, setSelectedLayerId] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(
    () => new Set(OSM_POI_CATEGORIES.map((c) => c.id)),
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { count, features }
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const polygonLayers = layers.filter(
    (l) => l.visible && (l.geometryType === 'polygon' || l.meta?.geometryType === 'polygon'),
  )

  const selectedLayer = polygonLayers.find((l) => l.id === selectedLayerId) ?? null

  const bbox = zoneMode === 'viewport'
    ? mapViewport
    : getBboxFromLayer(selectedLayer)

  const bboxAreaDeg2 = bboxArea(bbox)
  const showBboxWarning = bboxAreaDeg2 > BBOX_AREA_WARNING_DEG2

  const noneChecked = selectedCategoryIds.size === 0
  const allChecked = selectedCategoryIds.size === OSM_POI_CATEGORIES.length

  const toggleCategory = (id, checked) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  const toggleAll = (checked) => {
    setSelectedCategoryIds(checked ? new Set(OSM_POI_CATEGORIES.map((c) => c.id)) : new Set())
  }

  const handleLoad = async () => {
    if (!bbox || noneChecked || loading) return

    setLoading(true)
    setError(null)
    setResult(null)

    const controller = new AbortController()
    abortRef.current = controller
    await new Promise((r) => setTimeout(r, 20))

    try {
      const { features } = await fetchOsmPois({
        bbox,
        selectedCategoryIds: [...selectedCategoryIds],
        signal: controller.signal,
      })

      let filtered = features
      if (zoneMode === 'layer' && selectedLayer) {
        filtered = filterPointsByPolygonLayer(features, selectedLayer)
      }

      setResult({ count: filtered.length, features: filtered })
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message ?? "Error carregant dades d'Overpass")
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    setLoading(false)
  }

  const handleCreateLayer = () => {
    if (!result?.features?.length) return
    const geojson = { type: 'FeatureCollection', features: result.features }
    const zoneName = zoneMode === 'layer' && selectedLayer ? selectedLayer.name : 'Viewport'
    const catCount = selectedCategoryIds.size
    const layerName = `POI OSM – ${zoneName} (${catCount} cat.)`
    const selectedCategories = OSM_POI_CATEGORIES.filter((c) => selectedCategoryIds.has(c.id))
    onCreateLayer(geojson, layerName, selectedCategories)
    onClose()
  }

  const canLoad = !!bbox && !noneChecked && !loading
  const canCreate = result && result.count > 0 && !loading

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="osm-modal">
        {/* Header */}
        <div className="sovlay-header">
          <h2 className="sovlay-title">Punts d'interès OSM</h2>
          <button type="button" className="sovlay-close" onClick={onClose} aria-label="Tancar">✕</button>
        </div>

        <div className="sovlay-body">
          {/* Zone */}
          <div className="sovlay-field">
            <label className="sovlay-label">Zona de cerca</label>
            <div className="osm-zone-row">
              <label className="osm-radio-label">
                <input
                  type="radio"
                  name="zoneMode"
                  value="viewport"
                  checked={zoneMode === 'viewport'}
                  onChange={() => { setZoneMode('viewport'); setSelectedLayerId('') }}
                />
                Viewport actual
              </label>
              <label className="osm-radio-label">
                <input
                  type="radio"
                  name="zoneMode"
                  value="layer"
                  checked={zoneMode === 'layer'}
                  onChange={() => setZoneMode('layer')}
                />
                Capa poligonal
              </label>
            </div>

            {zoneMode === 'layer' && (
              <select
                className="sovlay-select"
                value={selectedLayerId}
                onChange={(e) => { setSelectedLayerId(e.target.value); setResult(null) }}
                style={{ marginTop: 6 }}
              >
                <option value="">— Selecciona capa —</option>
                {polygonLayers.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
                {polygonLayers.length === 0 && (
                  <option disabled>No hi ha capes de polígons visibles</option>
                )}
              </select>
            )}

            {!bbox && (
              <p className="sovlay-hint sovlay-hint--warn">
                {zoneMode === 'viewport'
                  ? 'No hi ha viewport disponible. Mou el mapa primer.'
                  : 'Selecciona una capa per definir la zona.'}
              </p>
            )}

            {bbox && showBboxWarning && (
              <p className="sovlay-hint sovlay-hint--warn">
                La zona és gran ({bboxAreaDeg2.toFixed(2)} graus²). La consulta pot trigar o retornar molts resultats.
              </p>
            )}
          </div>

          {/* Categories */}
          <div className="sovlay-field">
            <div className="osm-section-header">
              <label className="sovlay-label" style={{ margin: 0 }}>Categories</label>
              <div className="osm-toggles">
                <button
                  type="button"
                  className="osm-toggle-btn"
                  onClick={() => toggleAll(true)}
                  disabled={allChecked}
                >
                  Tot
                </button>
                <button
                  type="button"
                  className="osm-toggle-btn"
                  onClick={() => toggleAll(false)}
                  disabled={noneChecked}
                >
                  Cap
                </button>
              </div>
            </div>
            <div className="osm-cat-grid">
              {OSM_POI_CATEGORIES.map((cat) => (
                <CategoryCheckbox
                  key={cat.id}
                  cat={cat}
                  checked={selectedCategoryIds.has(cat.id)}
                  onChange={toggleCategory}
                />
              ))}
            </div>
            {noneChecked && (
              <p className="sovlay-hint sovlay-hint--warn">Selecciona almenys una categoria.</p>
            )}
          </div>

          {/* Action */}
          <button
            type="button"
            className={`sovlay-calc-btn${loading ? ' sovlay-calc-btn--loading' : ''}`}
            onClick={handleLoad}
            disabled={!canLoad}
          >
            {loading
              ? <><span className="sovlay-spinner" aria-hidden="true" /> Consultant Overpass…</>
              : 'Carregar punts'}
          </button>

          {loading && (
            <button
              type="button"
              className="sovlay-export-btn"
              onClick={handleCancel}
              style={{ alignSelf: 'flex-start' }}
            >
              Cancel·lar
            </button>
          )}

          {error && <p className="sovlay-error">{error}</p>}

          {/* Results */}
          {result && !loading && (
            <div className="sovlay-results">
              <div className="sovlay-results-hdr">
                <h3 className="sovlay-results-title">
                  {result.count.toLocaleString('ca')} punts trobats
                </h3>
                {result.count > 0 && (
                  <button
                    type="button"
                    className="sovlay-calc-btn"
                    onClick={handleCreateLayer}
                    style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                  >
                    Crear capa
                  </button>
                )}
              </div>

              {result.count === 0 && (
                <p className="sovlay-hint">
                  No s'han trobat punts per a la zona i categories seleccionades.
                </p>
              )}

              {result.count > POI_COUNT_WARNING && (
                <p className="sovlay-hint sovlay-hint--warn">
                  Molts resultats ({result.count.toLocaleString('ca')}). La capa pot ser lenta de renderitzar.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
