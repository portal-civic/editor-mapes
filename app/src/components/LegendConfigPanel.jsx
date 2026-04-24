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
  { value: 'sans-serif', label: 'Sans-serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Georgia", serif', label: 'Georgia' },
]

export default function LegendConfigPanel({ layout, onChange }) {
  const upd = (key, val) => onChange({ ...layout, [key]: val })
  const pos = layout.position ?? 'inside'
  const showWidth = pos === 'right' || pos === 'left'

  return (
    <aside className="panel panel-right">
      <div className="panel-header">
        <h2>Llegenda</h2>
      </div>
      <div className="panel-content legend-config-panel">

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

        {showWidth && (
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

        <div className="legend-cfg-row">
          <label className="legend-cfg-label">Tipografia</label>
          <select
            className="legend-cfg-select"
            value={layout.fontFamily ?? 'sans-serif'}
            onChange={(e) => upd('fontFamily', e.target.value)}
          >
            {FONT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="legend-cfg-row">
          <label className="legend-cfg-label">Mida lletra (px)</label>
          <input
            type="number"
            className="legend-cfg-input"
            min={8}
            max={20}
            step={1}
            value={layout.fontSize ?? 11}
            onChange={(e) => upd('fontSize', Number(e.target.value))}
          />
        </div>

        <div className="legend-cfg-row">
          <label className="legend-cfg-label">Mida títol (px)</label>
          <input
            type="number"
            className="legend-cfg-input"
            min={7}
            max={18}
            step={1}
            value={layout.titleFontSize ?? 10}
            onChange={(e) => upd('titleFontSize', Number(e.target.value))}
          />
        </div>

        <div className="legend-cfg-divider" />

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
            checked={layout.showOnlyVisibleInViewport ?? false}
            onChange={(e) => upd('showOnlyVisibleInViewport', e.target.checked)}
          />
          Sols categories visibles al mapa
        </label>

      </div>
    </aside>
  )
}
