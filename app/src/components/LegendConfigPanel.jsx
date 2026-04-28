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

export default function LegendConfigPanel({ layout, onChange }) {
  const upd = (key, val) => onChange({ ...layout, [key]: val })
  const pos = layout.position ?? 'inside'
  const showColWidth = pos === 'right' || pos === 'left'

  return (
    <aside className="panel panel-right">
      <div className="panel-header">
        <h2>Llegenda</h2>
      </div>
      <div className="panel-content legend-config-panel">

        {/* ── Posició i mides ─────────────────────── */}
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

        {/* ── Opcions ──────────────────────────────── */}
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

        <label className="legend-cfg-check">
          <input
            type="checkbox"
            checked={layout.showOnlyVisibleInViewport ?? false}
            onChange={(e) => upd('showOnlyVisibleInViewport', e.target.checked)}
          />
          Sols categories visibles al mapa
        </label>

      </div>
    </aside>
  )
}
