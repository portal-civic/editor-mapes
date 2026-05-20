import { useState } from 'react'
import { normalizeCategory } from '../modules/sources/categoricalStyle'
import { measureFeature } from '../modules/geometry/measurements'
import MeasurementSection from './MeasurementSection'
import { normalizePoiFeature, isOsmPoiFeature } from '../modules/osm/normalizePoiFeature'

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

// ── OSM POI card ──────────────────────────────────────────────────────────────

function PoiField({ label, value, isLink }) {
  if (!value) return null
  return (
    <div className="poi-field">
      <span className="poi-field-label">{label}</span>
      {isLink ? (
        <a className="poi-field-val poi-field-val--link" href={value} target="_blank" rel="noopener noreferrer">
          {value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
        </a>
      ) : (
        <span className="poi-field-val">{value}</span>
      )}
    </div>
  )
}

const POI_SYNTHETIC_KEYS = new Set([
  'poi_category', 'poi_category_label', 'poi_subcategory', 'poi_subcategory_label',
  'poi_source', 'poi_id', 'poi_icon', 'poi_color',
  'osm_type', 'osm_id', 'name', 'address', 'phone', 'website', 'operator',
])

function PoiSourceBadge({ source }) {
  const labels = { osm: 'OpenStreetMap', overture: 'Overture Maps', official: 'Font oficial', merged: 'Fusionat' }
  const colors = { osm: '#2ecc71', overture: '#3b82f6', official: '#f59e0b', merged: '#9b59b6' }
  return (
    <span className="poi-source-badge" style={{ background: colors[source] ?? '#64748b' }}>
      {labels[source] ?? source}
    </span>
  )
}

function OvertureSection({ data }) {
  if (!data) return null
  return (
    <div className="poi-overture-section">
      <div className="poi-overture-section-title">Taxonomia Overture</div>
      {data.hierarchy && (
        <div className="poi-overture-hierarchy">
          {data.hierarchy.split(' › ').map((level, i, arr) => (
            <span key={i}>
              <span className={`poi-hier-level poi-hier-level--${i}`}>{level}</span>
              {i < arr.length - 1 && <span className="poi-hier-sep"> › </span>}
            </span>
          ))}
        </div>
      )}
      {data.basicCategory && (
        <div className="poi-overture-row">
          <span className="poi-overture-key">basic_category</span>
          <span className="poi-overture-val">{data.basicCategory}</span>
        </div>
      )}
      {data.primary && data.primary !== data.basicCategory && (
        <div className="poi-overture-row">
          <span className="poi-overture-key">taxonomy.primary</span>
          <span className="poi-overture-val">{data.primary}</span>
        </div>
      )}
      {data.alternate && (
        <div className="poi-overture-row">
          <span className="poi-overture-key">Alternatives</span>
          <span className="poi-overture-val">{data.alternate}</span>
        </div>
      )}
      {data.confidence != null && (
        <div className="poi-overture-row">
          <span className="poi-overture-key">Confiança</span>
          <span className="poi-overture-val">
            <span className="poi-confidence-bar" style={{ '--conf': data.confidence }}>
              <span className="poi-confidence-fill" />
            </span>
            {Math.round(data.confidence * 100)}%
          </span>
        </div>
      )}
      {data.operatingStatus && (
        <div className="poi-overture-row">
          <span className="poi-overture-key">Estat</span>
          <span className={`poi-status poi-status--${data.operatingStatus}`}>{data.operatingStatus}</span>
        </div>
      )}
    </div>
  )
}

function PoiCard({ feature }) {
  const [showRaw, setShowRaw] = useState(false)
  const poi = normalizePoiFeature(feature)
  if (!poi) return null

  const props = feature?.properties ?? {}
  const displayTitle = poi.title || poi.subcategory || poi.category
  const coordText = (poi.lat != null && poi.lng != null)
    ? `${poi.lat.toFixed(6)}, ${poi.lng.toFixed(6)}`
    : null

  // Raw attrs: excloure claus sintètiques i claus Overture que ja mostrem
  const overturePrefix = 'overture_'
  const rawEntries = Object.entries(props).filter(([k]) =>
    !POI_SYNTHETIC_KEYS.has(k) && !k.startsWith(overturePrefix) && !k.startsWith('src_') && !k.startsWith('official_'),
  )

  return (
    <div className="poi-card ssf-section">
      {/* Header */}
      <div className="poi-card-header">
        {poi.icon && (
          <span className="poi-card-icon" style={{ '--poi-color': poi.color ?? '#64748b' }}>
            {poi.icon}
          </span>
        )}
        <div className="poi-card-title-block">
          <div className="poi-card-title-row">
            <p className="poi-card-title">{displayTitle}</p>
            <PoiSourceBadge source={poi.source} />
          </div>
          <p className="poi-card-category" style={{ color: poi.color ?? '#64748b' }}>
            {poi.category}{poi.subcategory && poi.subcategory !== poi.category ? ` · ${poi.subcategory}` : ''}
          </p>
        </div>
      </div>

      {/* Camps comuns */}
      <div className="poi-fields">
        <PoiField label="Adreça" value={poi.address} />
        <PoiField label="Telèfon" value={poi.phone} />
        <PoiField label="Web" value={poi.website} isLink />
        <PoiField label="Operador" value={poi.operator} />
        {poi.description && <PoiField label="Descripció" value={poi.description} />}
        {coordText && <PoiField label="Coordenades" value={coordText} />}
        {poi.osm_id && <PoiField label="OSM ID" value={poi.osm_id} />}
        {poi.official?.sourceCategory && (
          <PoiField label="Categoria original" value={poi.official.sourceCategory} />
        )}
      </div>

      {/* Secció Overture (si present) */}
      <OvertureSection data={poi.overture} />

      {/* Atributs tècnics col·lapsables */}
      {rawEntries.length > 0 && (
        <div className="poi-raw-section">
          <button type="button" className="poi-raw-toggle"
            onClick={() => setShowRaw((v) => !v)} aria-expanded={showRaw}>
            <span className="poi-raw-toggle-arrow">{showRaw ? '▾' : '▸'}</span>
            Atributs tècnics ({rawEntries.length})
          </button>
          {showRaw && (
            <div className="ssf-props-table poi-raw-table">
              {rawEntries.map(([k, v]) => (
                <div key={k} className="ssf-prop-row">
                  <span className="ssf-prop-key poi-raw-key" title={k}>{k}</span>
                  <span className="ssf-prop-val" title={v == null ? '' : String(v)}>
                    {v == null ? <em>null</em> : String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Category badge (non-POI layers) ──────────────────────────────────────────

function CategoryBadge({ layer, feature, featureKey }) {
  if (layer?.styleMode !== 'categorical') return null

  const field = layer.categorical?.field
  if (!field) return null

  const rawVal = feature?.properties?.[field]
  const valStr = rawVal == null ? null : String(rawVal)

  const categories = (layer.categorical?.categories ?? []).map(normalizeCategory)
  const cat = valStr != null
    ? categories.find((c) => String(c.value) === valStr)
    : null

  const hasOwnStyle = layer?.featureOverrides?.[featureKey] != null
  const isInLegend = layer?.featureOverrides?.[featureKey]?.showInLegend === true

  const label = cat
    ? (cat.label && cat.label !== String(cat.value) ? cat.label : null)
    : null
  const displayLabel = label ?? (cat ? String(cat.value) : null)

  return (
    <div className="ssf-section ssf-cat-section">
      <p className="ssf-section-title">Categoria</p>

      {cat ? (
        <div className="ssf-cat-row">
          <span
            className="ssf-cat-swatch"
            style={{ background: cat.color ?? '#888888' }}
            aria-hidden="true"
          />
          <div className="ssf-cat-info">
            <span className="ssf-cat-label">{displayLabel}</span>
            {label && (
              <span className="ssf-cat-value">{valStr}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="ssf-cat-row ssf-cat-row--unknown">
          <span className="ssf-cat-swatch ssf-cat-swatch--unknown" aria-hidden="true" />
          <div className="ssf-cat-info">
            <span className="ssf-cat-label ssf-cat-label--unknown">Categoria no identificada</span>
            {valStr != null && (
              <span className="ssf-cat-value">{valStr}</span>
            )}
          </div>
        </div>
      )}

      {(hasOwnStyle || isInLegend) && (
        <div className="ssf-cat-badges">
          {hasOwnStyle && (
            <span className="ssf-cat-badge">Estil propi aplicat</span>
          )}
          {isInLegend && (
            <span className="ssf-cat-badge ssf-cat-badge--legend">Element destacat en llegenda</span>
          )}
        </div>
      )}
    </div>
  )
}

export default function SelectedSourceFeaturePanel({
  feature,
  featureKey,
  layer,
  onClose,
  onFeatureOverrideChange,
}) {
  const props = feature?.properties ?? {}
  const raw = layer?.featureOverrides?.[featureKey]
  const ov = readOverride(raw)
  const hasOverride = raw != null
  const isPoi = isOsmPoiFeature(feature)

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

      {isPoi ? (
        <PoiCard feature={feature} />
      ) : (
        <>
          <CategoryBadge layer={layer} feature={feature} featureKey={featureKey} />
          <MeasurementSection feature={feature} />
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
        </>
      )}

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
