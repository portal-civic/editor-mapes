import { useMemo, useState } from 'react'
import { runSpatialOverlay, resultsToCSV, OPERATIONS } from '../modules/analysis/spatialOverlay'
import { formatArea } from '../modules/geometry/measurements'

// ── Helpers ───────────────────────────────────────────────────────────────────

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function fmt(n) { return n.toLocaleString('ca') }
function pct(p) { return `${p.toFixed(1)}%` }

// ── Subcomponents ─────────────────────────────────────────────────────────────

function ResultsSummary({ results }) {
  const hasArea = results.totalAreaM2 != null

  return (
    <div className="sovlay-summary">
      <div className="sovlay-summary-pair">
        <div className="sovlay-summary-row">
          <span className="sovlay-summary-label">Capa A</span>
          <span className="sovlay-summary-val">{results.layerAName} · {fmt(results.totalA)} elem.</span>
        </div>
        <div className="sovlay-summary-row">
          <span className="sovlay-summary-label">Capa B</span>
          <span className="sovlay-summary-val">{results.layerBName} · {fmt(results.totalB)} elem.</span>
        </div>
      </div>

      <div className="sovlay-summary-divider" />

      <div className="sovlay-summary-row sovlay-summary-row--highlight">
        <span className="sovlay-summary-label">Elements afectats</span>
        <span className="sovlay-summary-val">
          <strong>{fmt(results.affectedCount)}</strong>
          <span className="sovlay-pct">{pct(results.affectedPct)}</span>
        </span>
      </div>

      {hasArea && (
        <div className="sovlay-summary-row sovlay-summary-row--highlight">
          <span className="sovlay-summary-label">Superfície total afectada</span>
          <span className="sovlay-summary-val">
            <strong>{formatArea(results.totalAreaM2).primary}</strong>
            {formatArea(results.totalAreaM2).secondary && (
              <span className="sovlay-pct">{formatArea(results.totalAreaM2).secondary}</span>
            )}
          </span>
        </div>
      )}

      {results.intersectionGeoms != null && (
        <div className="sovlay-summary-row">
          <span className="sovlay-summary-label">Geometries creades</span>
          <span className="sovlay-summary-val">{fmt(results.intersectionGeoms.length)}</span>
        </div>
      )}
    </div>
  )
}

function CategoryTable({ results }) {
  const rows = results.categoryRows
  if (!rows || rows.length === 0) return null
  const hasArea = results.totalAreaM2 != null

  return (
    <div className="sovlay-cat-wrap">
      <p className="sovlay-cat-title">Detall per categoria</p>
      <div className="sovlay-cat-table-scroll">
        <table className="sovlay-cat-table">
          <thead>
            <tr>
              <th className="sovlay-th-cat">Categoria</th>
              <th className="sovlay-th-num">Afectats</th>
              <th className="sovlay-th-num">%</th>
              {hasArea && <th className="sovlay-th-num">Superfície</th>}
              {hasArea && <th className="sovlay-th-num">% Superf.</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cntPct = results.affectedCount > 0
                ? (row.count / results.affectedCount) * 100 : 0
              const areaPct = hasArea && results.totalAreaM2 > 0
                ? (row.areaM2 / results.totalAreaM2) * 100 : null
              return (
                <tr key={row.catVal}>
                  <td className="sovlay-td-cat" title={row.catVal}>{row.catVal}</td>
                  <td className="sovlay-td-num">{fmt(row.count)}</td>
                  <td className="sovlay-td-num">{pct(cntPct)}</td>
                  {hasArea && (
                    <td className="sovlay-td-num">{formatArea(row.areaM2).primary}</td>
                  )}
                  {hasArea && (
                    <td className="sovlay-td-num">{areaPct != null ? pct(areaPct) : '—'}</td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function SpatialOverlayModal({ layers, onClose, onCreateLayer }) {
  const [layerAId, setLayerAId] = useState('')
  const [layerBId, setLayerBId] = useState('')
  const [operation, setOperation] = useState('count')
  const [categoryField, setCategoryField] = useState('')
  const [createLayer, setCreateLayer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  // Layer A: polygon layers only
  const polygonLayers = useMemo(
    () => layers.filter((l) => l.visible && l.geometryType === 'polygon'),
    [layers],
  )

  // Layer B: all visible geometry layers
  const allGeoLayers = useMemo(
    () => layers.filter((l) => l.visible && ['polygon', 'line', 'point'].includes(l.geometryType)),
    [layers],
  )

  const layerA = layers.find((l) => l.id === layerAId) ?? null
  const layerB = layers.find((l) => l.id === layerBId) ?? null

  // Fields from B for category grouping
  const fieldsB = useMemo(() => {
    if (!layerB) return []
    if (layerB.type === 'source' && Array.isArray(layerB.meta?.fields)) {
      return layerB.meta.fields.map((f) => (typeof f === 'string' ? f : f.name)).filter(Boolean)
    }
    return []
  }, [layerB])

  const canComputeArea = layerB?.geometryType === 'polygon'
  const needsCategory = operation === 'category'
  const canCalculate =
    layerA &&
    layerB &&
    layerA.id !== layerB.id &&
    (!needsCategory || categoryField)

  // Size warning
  const sizeWarning = useMemo(() => {
    if (!layerA || !layerB) return null
    const sizeA = layerA.type === 'source'
      ? (layerA.meta?.loadedFeatureCount ?? 0)
      : (layerA.features?.length ?? 0)
    const sizeB = layerB.type === 'source'
      ? (layerB.meta?.loadedFeatureCount ?? 0)
      : (layerB.features?.length ?? 0)
    const ops = sizeA * sizeB
    if (ops > 200_000) return `Combinació gran: ~${(ops / 1000).toFixed(0)}k operacions. Pot trigar.`
    return null
  }, [layerA, layerB])

  const handleCalculate = async () => {
    if (!canCalculate || loading) return
    setLoading(true)
    setResults(null)
    setError(null)

    await new Promise((r) => setTimeout(r, 20)) // let React render the spinner

    try {
      const r = runSpatialOverlay({
        layerA,
        layerB,
        operation,
        categoryField: needsCategory ? categoryField : null,
        createIntersectionGeoms: createLayer && canComputeArea,
      })

      if (r.error) { setError(r.error); return }

      setResults(r)

      // Create intersection layer if requested and geometries were collected
      if (createLayer && r.intersectionGeoms?.length > 0) {
        const geojson = {
          type: 'FeatureCollection',
          features: r.intersectionGeoms.map((f, i) => ({
            ...f,
            properties: { interseccio_id: i + 1 },
          })),
        }
        onCreateLayer?.(geojson, `Intersecció: ${layerA.name} × ${layerB.name}`)
      }
    } catch (err) {
      setError(`Error durant l'anàlisi: ${err?.message ?? 'error desconegut'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!results) return
    downloadBlob(resultsToCSV(results), 'analisi-espacial.csv', 'text/csv;charset=utf-8')
  }

  const handleExportJSON = () => {
    if (!results) return
    const json = JSON.stringify({
      layerA: results.layerAName,
      layerB: results.layerBName,
      operation: results.operation,
      totalA: results.totalA,
      totalB: results.totalB,
      affectedCount: results.affectedCount,
      affectedPct: results.affectedPct,
      totalAreaM2: results.totalAreaM2,
      categoryRows: results.categoryRows,
    }, null, 2)
    downloadBlob(json, 'analisi-espacial.json', 'application/json')
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="sovlay-modal">
        {/* Header */}
        <div className="sovlay-header">
          <h2 className="sovlay-title">Anàlisi de superposició</h2>
          <button type="button" className="sovlay-close" onClick={onClose} aria-label="Tancar">✕</button>
        </div>

        <div className="sovlay-body">
          {/* ── Setup ────────────────────────────────────────────────────── */}
          <div className="sovlay-setup">

            {/* Layer A */}
            <div className="sovlay-field">
              <label className="sovlay-label">Capa A — referència / zona d'afecció</label>
              <select
                className="sovlay-select"
                value={layerAId}
                onChange={(e) => { setLayerAId(e.target.value); setResults(null) }}
              >
                <option value="">Selecciona una capa de polígons…</option>
                {polygonLayers.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              {polygonLayers.length === 0 && (
                <p className="sovlay-hint sovlay-hint--warn">No hi ha capes de polígons visibles.</p>
              )}
            </div>

            {/* Layer B */}
            <div className="sovlay-field">
              <label className="sovlay-label">Capa B — elements a analitzar</label>
              <select
                className="sovlay-select"
                value={layerBId}
                onChange={(e) => { setLayerBId(e.target.value); setCategoryField(''); setResults(null) }}
              >
                <option value="">Selecciona una capa…</option>
                {allGeoLayers.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.geometryType})</option>
                ))}
              </select>
              {layerA && layerB && layerA.id === layerB.id && (
                <p className="sovlay-hint sovlay-hint--warn">A i B han de ser capes diferents.</p>
              )}
            </div>

            {/* Operation */}
            <div className="sovlay-field">
              <label className="sovlay-label">Operació</label>
              <div className="sovlay-radios">
                {OPERATIONS.map((op) => {
                  const disabled = op.id === 'area' && !canComputeArea
                  return (
                    <label
                      key={op.id}
                      className={`sovlay-radio${disabled ? ' sovlay-radio--disabled' : ''}`}
                    >
                      <input
                        type="radio"
                        name="sovlay-op"
                        value={op.id}
                        checked={operation === op.id}
                        disabled={disabled}
                        onChange={() => { setOperation(op.id); setResults(null) }}
                      />
                      <span>{op.label}</span>
                      {op.id === 'area' && !canComputeArea && (
                        <span className="sovlay-radio-note">cal B = polígons</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Category field */}
            {needsCategory && (
              <div className="sovlay-field">
                <label className="sovlay-label">Camp de categoria (capa B)</label>
                {fieldsB.length > 0 ? (
                  <select
                    className="sovlay-select"
                    value={categoryField}
                    onChange={(e) => { setCategoryField(e.target.value); setResults(null) }}
                  >
                    <option value="">Selecciona un camp…</option>
                    {fieldsB.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                ) : (
                  <p className="sovlay-hint sovlay-hint--warn">
                    {!layerB
                      ? 'Selecciona la capa B primer.'
                      : layerB.type !== 'source'
                        ? 'Les capes dibuixades no tenen camps de propietats.'
                        : 'La capa B no té camps disponibles.'}
                  </p>
                )}
              </div>
            )}

            {/* Create layer */}
            <label className={`sovlay-check${!canComputeArea ? ' sovlay-check--disabled' : ''}`}>
              <input
                type="checkbox"
                checked={createLayer}
                disabled={!canComputeArea}
                onChange={(e) => setCreateLayer(e.target.checked)}
              />
              <span>
                Crear capa amb les interseccions resultants
                {!canComputeArea && (
                  <span className="sovlay-radio-note">cal B = polígons</span>
                )}
              </span>
            </label>

            {/* Size warning */}
            {sizeWarning && (
              <p className="sovlay-hint sovlay-hint--warn">{sizeWarning}</p>
            )}

            {/* Calculate */}
            <button
              type="button"
              className={`sovlay-calc-btn${loading ? ' sovlay-calc-btn--loading' : ''}`}
              onClick={handleCalculate}
              disabled={!canCalculate || loading}
            >
              {loading
                ? <><span className="sovlay-spinner" aria-hidden="true" /> Calculant…</>
                : 'Calcular'}
            </button>

            {error && <p className="sovlay-error">{error}</p>}
          </div>

          {/* ── Results ──────────────────────────────────────────────────── */}
          {results && !loading && (
            <div className="sovlay-results">
              <div className="sovlay-results-hdr">
                <h3 className="sovlay-results-title">Resultats</h3>
                <div className="sovlay-export-btns">
                  <button type="button" className="sovlay-export-btn" onClick={handleExportCSV}>
                    ↓ CSV
                  </button>
                  <button type="button" className="sovlay-export-btn" onClick={handleExportJSON}>
                    ↓ JSON
                  </button>
                </div>
              </div>

              <ResultsSummary results={results} />
              <CategoryTable results={results} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
