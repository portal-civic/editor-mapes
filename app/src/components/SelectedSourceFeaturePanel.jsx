import { normalizeCategoricalStyle } from '../modules/sources/categoricalStyle'

function formatArea(m2) {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} km²`
  if (m2 >= 10_000) return `${(m2 / 10_000).toFixed(2)} ha`
  return `${Math.round(m2).toLocaleString()} m²`
}

function calcPolygonAreaM2(geometry) {
  if (!geometry) return null
  let rings = null
  if (geometry.type === 'Polygon') rings = [geometry.coordinates[0]]
  else if (geometry.type === 'MultiPolygon') rings = geometry.coordinates.map((p) => p[0])
  if (!rings) return null

  let total = 0
  for (const ring of rings) {
    if (!ring || ring.length < 3) continue
    const latMid = ring.reduce((s, c) => s + c[1], 0) / ring.length
    const mPerDegLat = 111320
    const mPerDegLon = 111320 * Math.cos((latMid * Math.PI) / 180)
    let area = 0
    for (let i = 0, n = ring.length - 1; i < n; i++) {
      area +=
        ring[i][0] * mPerDegLon * ring[i + 1][1] * mPerDegLat -
        ring[i + 1][0] * mPerDegLon * ring[i][1] * mPerDegLat
    }
    total += Math.abs(area / 2)
  }
  return total > 0 ? total : null
}

const EMPTY_OVERRIDE = {
  fillColor: '',
  fillOpacity: '',
  strokeColor: '',
  strokeOpacity: '',
  strokeWidth: '',
  showInLegend: false,
  legendLabel: '',
}

function readOverride(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_OVERRIDE }
  return {
    fillColor: raw.fillColor ?? '',
    fillOpacity: raw.fillOpacity ?? '',
    strokeColor: raw.strokeColor ?? '',
    strokeOpacity: raw.strokeOpacity ?? '',
    strokeWidth: raw.strokeWidth ?? '',
    showInLegend: raw.showInLegend === true,
    legendLabel: raw.legendLabel ?? '',
  }
}

export default function SelectedSourceFeaturePanel({
  feature,
  featureKey,
  layer,
  onClose,
  onFeatureOverrideChange,
}) {
  const props = feature?.properties ?? {}
  const area = calcPolygonAreaM2(feature?.geometry)
  const raw = layer?.featureOverrides?.[featureKey]
  const ov = readOverride(raw)
  const hasOverride = raw != null

  const set = (patch) => onFeatureOverrideChange?.(layer.id, featureKey, patch)
  const clearAll = () => onFeatureOverrideChange?.(layer.id, featureKey, null)

  const propEntries = Object.entries(props)

  return (
    <aside className="panel panel-right ssf-panel">
      <div className="ssf-header">
        <div className="ssf-title-row">
          <span className="ssf-title">Element seleccionat</span>
          <button type="button" className="ssf-close" onClick={onClose} aria-label="Tancar">
            ✕
          </button>
        </div>
        <div className="ssf-meta">
          <span className="ssf-meta-layer">{layer?.name ?? '—'}</span>
          <span className="ssf-meta-key" title={featureKey}>{featureKey}</span>
        </div>
      </div>

      {area != null ? (
        <div className="ssf-section">
          <p className="ssf-section-title">Superfície</p>
          <p className="ssf-area">{formatArea(area)}</p>
        </div>
      ) : null}

      <div className="ssf-section">
        <p className="ssf-section-title">Atributs</p>
        {propEntries.length === 0 ? (
          <p className="ssf-empty-props">Sense atributs</p>
        ) : (
          <div className="ssf-props-table">
            {propEntries.map(([k, v]) => (
              <div key={k} className="ssf-prop-row">
                <span className="ssf-prop-key" title={k}>{k}</span>
                <span className="ssf-prop-val" title={v == null ? '' : String(v)}>
                  {v == null ? <em>null</em> : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ssf-section">
        <p className="ssf-section-title">Estil propi de l'element</p>
        {!hasOverride ? (
          <div className="ssf-no-own-style">
            <p className="ssf-no-own-style-msg">Este element utilitza l'estil de la capa</p>
            <button type="button" className="ssf-activate-style" onClick={() => set({})}>
              Activar estil propi
            </button>
          </div>
        ) : (
          <>
            <div className="ssf-override-grid">
              <div className="ssf-ov-row">
                <span>Color farcit</span>
                <div className="ssf-ov-color-wrap">
                  <input
                    type="color"
                    value={ov.fillColor || '#888888'}
                    onChange={(e) => set({ fillColor: e.target.value })}
                  />
                  {ov.fillColor ? (
                    <button type="button" className="ssf-ov-clear" onClick={() => set({ fillColor: '' })}>
                      ×
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="ssf-ov-row">
                <span>Opacitat farcit</span>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={ov.fillOpacity !== '' ? ov.fillOpacity : 0.7}
                  onChange={(e) => set({ fillOpacity: Number(e.target.value) })}
                />
                <span className="ssf-ov-pct">
                  {ov.fillOpacity !== '' ? `${Math.round(Number(ov.fillOpacity) * 100)}%` : '—'}
                </span>
              </div>

              <div className="ssf-ov-row">
                <span>Color contorn</span>
                <div className="ssf-ov-color-wrap">
                  <input
                    type="color"
                    value={ov.strokeColor || '#333333'}
                    onChange={(e) => set({ strokeColor: e.target.value })}
                  />
                  {ov.strokeColor ? (
                    <button type="button" className="ssf-ov-clear" onClick={() => set({ strokeColor: '' })}>
                      ×
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="ssf-ov-row">
                <span>Opacitat contorn</span>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={ov.strokeOpacity !== '' ? ov.strokeOpacity : 1}
                  onChange={(e) => set({ strokeOpacity: Number(e.target.value) })}
                />
                <span className="ssf-ov-pct">
                  {ov.strokeOpacity !== '' ? `${Math.round(Number(ov.strokeOpacity) * 100)}%` : '—'}
                </span>
              </div>

              <div className="ssf-ov-row">
                <span>Amplada contorn</span>
                <input
                  type="number" min="0" max="20" step="0.5"
                  value={ov.strokeWidth !== '' ? ov.strokeWidth : ''}
                  placeholder="auto"
                  onChange={(e) =>
                    set({ strokeWidth: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <button type="button" className="ssf-clear-all" onClick={clearAll}>
              Eliminar estil propi
            </button>
          </>
        )}
      </div>

      <div className="ssf-section">
        <p className="ssf-section-title">Llegenda</p>
        <label className="ssf-legend-check">
          <input
            type="checkbox"
            checked={ov.showInLegend}
            onChange={(e) => set({ showInLegend: e.target.checked })}
          />
          Mostrar com a element destacat
        </label>
        {ov.showInLegend ? (
          <label className="ssf-legend-label-row">
            <span>Etiqueta</span>
            <input
              type="text"
              value={ov.legendLabel}
              placeholder={featureKey}
              onChange={(e) => set({ legendLabel: e.target.value })}
            />
          </label>
        ) : null}
      </div>
    </aside>
  )
}
