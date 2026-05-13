import { useMemo } from 'react'
import { getRefLayerFeatureList } from '../modules/legend/polygonFilter'

const POSITION_OPTIONS = [
  { value: 'inside', label: 'Damunt del mapa' },
  { value: 'right', label: 'Columna a la dreta' },
  { value: 'left', label: "Columna a l'esquerra" },
  { value: 'bottom', label: 'Franja inferior' },
  { value: 'none', label: 'Sense llegenda' },
]

const LANGUAGE_OPTIONS = [
  { value: 'val', label: 'Valencià' },
  { value: 'cas', label: 'Castellà' },
  { value: 'eng', label: 'Anglès' },
]

const FONT_OPTIONS = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: '"Source Sans 3", sans-serif', label: 'Source Sans 3' },
  { value: '"IBM Plex Sans", sans-serif', label: 'IBM Plex Sans' },
  { value: 'sans-serif', label: 'Sans-serif (sistema)' },
  { value: 'Georgia, serif', label: 'Georgia (serif)' },
]

const TITLE_POSITION_OPTIONS = [
  { value: 'floating', label: 'Flotant (damunt mapa)' },
  { value: 'above-map', label: 'Franja sobre el mapa' },
  { value: 'above-legend', label: 'Sobre la llegenda' },
]

const COMPOSITION_RATIOS = [
  { value: 'auto', label: 'Auto' },
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
  { value: 'a4-land', label: 'A4 horitzontal' },
  { value: 'a4-port', label: 'A4 vertical' },
  { value: 'square', label: 'Quadrat' },
  { value: 'custom', label: 'Personalitzat' },
]

export default function LegendConfigPanel({ layout, onChange, layers = [], mapComposition, onMapCompositionChange }) {
  const upd = (key, val) => onChange({ ...layout, [key]: val })
  const updMulti = (patch) => onChange({ ...layout, ...patch })
  const pos = layout.position ?? 'inside'
  const showColWidth = pos === 'right' || pos === 'left'

  // Polygon layers available as reference (all visible polygon layers)
  const polygonLayers = useMemo(
    () => layers.filter((l) => l.visible && (l.geometryType === 'polygon' || l.type === 'source' && l.geometryType === 'polygon')),
    [layers],
  )

  const refLayer = polygonLayers.find((l) => l.id === layout.polygonLayerId) ?? null
  const refFeatureList = useMemo(() => getRefLayerFeatureList(refLayer), [refLayer])

  return (
    <aside className="panel panel-right">
      <div className="panel-header">
        <h2>Llegenda</h2>
      </div>
      <div className="panel-content legend-config-panel">

        {/* ── Composició ───────────────────────────── */}
        {mapComposition && onMapCompositionChange ? (
          <>
            <p className="legend-cfg-section-label">Composició</p>

            <div className="comp-ratio-grid">
              {COMPOSITION_RATIOS.map(({ value, label }) => {
                const active = value === 'auto'
                  ? mapComposition.mode === 'auto'
                  : mapComposition.mode === 'fixed' && mapComposition.ratio === value
                return (
                  <button
                    key={value}
                    type="button"
                    className={`comp-ratio-btn${active ? ' comp-ratio-btn--active' : ''}`}
                    onClick={() => {
                      if (value === 'auto') {
                        onMapCompositionChange({ mode: 'auto' })
                      } else {
                        onMapCompositionChange({
                          mode: 'fixed',
                          ratio: value,
                          customW: mapComposition.customW ?? 16,
                          customH: mapComposition.customH ?? 9,
                        })
                      }
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {mapComposition.mode === 'fixed' && mapComposition.ratio === 'custom' && (
              <div className="comp-custom-row">
                <input
                  type="number"
                  className="legend-cfg-input"
                  min={1} max={100} step={1}
                  value={mapComposition.customW ?? 16}
                  onChange={(e) =>
                    onMapCompositionChange({ ...mapComposition, customW: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
                <span className="comp-custom-sep">:</span>
                <input
                  type="number"
                  className="legend-cfg-input"
                  min={1} max={100} step={1}
                  value={mapComposition.customH ?? 9}
                  onChange={(e) =>
                    onMapCompositionChange({ ...mapComposition, customH: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
              </div>
            )}

            <div className="legend-cfg-divider" />
          </>
        ) : null}

        {/* ── Posició ──────────────────────────────── */}
        <p className="legend-cfg-section-label">Posició</p>

        <div className="legend-cfg-row">
          <label className="legend-cfg-label">Posició</label>
          <select
            className="legend-cfg-select"
            value={pos}
            onChange={(e) => upd('position', e.target.value)}
          >
            {POSITION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {showColWidth && (
          <div className="legend-cfg-row">
            <label className="legend-cfg-label">Amplada (px)</label>
            <input
              type="number"
              className="legend-cfg-input"
              min={120}
              max={500}
              step={10}
              value={layout.width ?? 220}
              onChange={(e) => upd('width', Number(e.target.value))}
            />
          </div>
        )}

        <div className="legend-cfg-row">
          <label className="legend-cfg-label">Màx. files</label>
          <input
            type="number"
            className="legend-cfg-input"
            min={0}
            max={200}
            step={5}
            value={layout.maxLegendRows ?? 0}
            onChange={(e) => upd('maxLegendRows', Math.max(0, Number(e.target.value) || 0))}
            title="0 = sense límit; >0 compacta en 2 columnes a l'export"
          />
        </div>

        <div className="legend-cfg-row">
          <label className="legend-cfg-label">Idioma</label>
          <select
            className="legend-cfg-select"
            value={layout.language ?? 'val'}
            onChange={(e) => upd('language', e.target.value)}
          >
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="legend-cfg-divider" />

        {/* ── Filtre espacial ───────────────────────── */}
        <p className="legend-cfg-section-label">Filtre de categories</p>

        <label className="legend-cfg-check">
          <input
            type="checkbox"
            checked={layout.showOnlyVisibleInViewport ?? false}
            onChange={(e) => upd('showOnlyVisibleInViewport', e.target.checked)}
          />
          Sols categories visibles al mapa
        </label>

        <label className="legend-cfg-check">
          <input
            type="checkbox"
            checked={layout.filterByPolygon ?? false}
            onChange={(e) => updMulti({ filterByPolygon: e.target.checked, polygonLayerId: layout.polygonLayerId, polygonFeatureIndex: null })}
          />
          Filtrar per polígon de referència
        </label>

        {layout.filterByPolygon && (
          <div className="legend-cfg-polygon-filter">
            <div className="legend-cfg-row">
              <label className="legend-cfg-label">Capa referència</label>
              <select
                className="legend-cfg-select"
                value={layout.polygonLayerId ?? ''}
                onChange={(e) => updMulti({ polygonLayerId: e.target.value || null, polygonFeatureIndex: null })}
              >
                <option value="">— Selecciona capa —</option>
                {polygonLayers.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {refLayer && refFeatureList.length > 1 && (
              <div className="legend-cfg-row">
                <label className="legend-cfg-label">Polígon</label>
                <select
                  className="legend-cfg-select"
                  value={layout.polygonFeatureIndex ?? ''}
                  onChange={(e) => upd('polygonFeatureIndex', e.target.value === '' ? null : Number(e.target.value))}
                >
                  <option value="">Tots ({refFeatureList.length})</option>
                  {refFeatureList.map(({ index, label }) => (
                    <option key={index} value={index}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            {refLayer && (
              <p className="legend-cfg-filter-hint">
                Mostra únicament les categories presents dins del polígon seleccionat (filtre per bbox + centroide).
              </p>
            )}

            {!refLayer && layout.polygonLayerId && (
              <p className="legend-cfg-filter-hint legend-cfg-filter-hint--warn">
                La capa de referència no és visible o no existeix.
              </p>
            )}

            {polygonLayers.length === 0 && (
              <p className="legend-cfg-filter-hint legend-cfg-filter-hint--warn">
                Cap capa de polígons visible disponible.
              </p>
            )}
          </div>
        )}

        <div className="legend-cfg-divider" />

        {/* ── Export layout ────────────────────────── */}
        <p className="legend-cfg-section-label">Export</p>

        <div className="legend-cfg-row">
          <label className="legend-cfg-label">Marge (px)</label>
          <input
            type="number"
            className="legend-cfg-input"
            min={0}
            max={80}
            step={4}
            value={layout.margin ?? 0}
            onChange={(e) => upd('margin', Math.max(0, Number(e.target.value) || 0))}
          />
        </div>

        <div className="legend-cfg-row">
          <label className="legend-cfg-label">Posició títol</label>
          <select
            className="legend-cfg-select"
            value={layout.titlePosition ?? 'floating'}
            onChange={(e) => upd('titlePosition', e.target.value)}
          >
            {TITLE_POSITION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <label className="legend-cfg-check">
          <input
            type="checkbox"
            checked={layout.exportTitleEnabled ?? false}
            onChange={(e) => upd('exportTitleEnabled', e.target.checked)}
          />
          Mostrar títol
        </label>

        {layout.exportTitleEnabled ? (
          <div className="legend-cfg-row">
            <label className="legend-cfg-label">Títol</label>
            <input
              type="text"
              className="legend-cfg-text-input"
              value={layout.exportTitle ?? ''}
              onChange={(e) => upd('exportTitle', e.target.value)}
              placeholder="Títol del mapa…"
              maxLength={120}
            />
          </div>
        ) : null}

        <div className="legend-cfg-divider" />

        {/* ── Tipografia ───────────────────────────── */}
        <p className="legend-cfg-section-label">Tipografia</p>

        <div className="legend-cfg-row">
          <label className="legend-cfg-label">Font</label>
          <select
            className="legend-cfg-select"
            value={layout.fontFamily ?? 'Inter, sans-serif'}
            onChange={(e) => upd('fontFamily', e.target.value)}
          >
            {FONT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="legend-cfg-row">
          <label className="legend-cfg-label">Categories (px)</label>
          <input
            type="number"
            className="legend-cfg-input"
            min={8}
            max={16}
            step={1}
            value={layout.fontSize ?? 11}
            onChange={(e) => upd('fontSize', Number(e.target.value))}
          />
        </div>

        <div className="legend-cfg-row">
          <label className="legend-cfg-label">Títol capa (px)</label>
          <input
            type="number"
            className="legend-cfg-input"
            min={8}
            max={18}
            step={1}
            value={layout.titleFontSize ?? 12}
            onChange={(e) => upd('titleFontSize', Number(e.target.value))}
          />
        </div>

        <div className="legend-cfg-divider" />

        {/* ── Opcions visuals ──────────────────────── */}
        <p className="legend-cfg-section-label">Visual</p>

        <label className="legend-cfg-check">
          <input
            type="checkbox"
            checked={layout.border ?? true}
            onChange={(e) => upd('border', e.target.checked)}
          />
          Mostrar marc
        </label>

        <label className="legend-cfg-check">
          <input
            type="checkbox"
            checked={layout.showLayerNames !== false}
            onChange={(e) => upd('showLayerNames', e.target.checked)}
          />
          Mostrar noms de capa
        </label>

      </div>
    </aside>
  )
}
