import { useState } from 'react'
import { PALETTES, PALETTE_ORDER } from '../modules/styles/palettes'
import { generateHarmoniousColors } from '../modules/styles/colorGenerate'

function ColorRow({ color, index, total, onChangeColor, onMove, onRemove }) {
  return (
    <div className="palmgr-color-row">
      <input
        type="color"
        className="palmgr-color-input"
        value={color}
        onChange={(e) => onChangeColor(index, e.target.value)}
      />
      <span className="palmgr-color-hex">{color}</span>
      <button
        type="button"
        className="palmgr-color-btn"
        onClick={() => onMove(index, -1)}
        disabled={index === 0}
        aria-label="Pujar"
      >↑</button>
      <button
        type="button"
        className="palmgr-color-btn"
        onClick={() => onMove(index, 1)}
        disabled={index === total - 1}
        aria-label="Baixar"
      >↓</button>
      <button
        type="button"
        className="palmgr-color-btn palmgr-color-btn--del"
        onClick={() => onRemove(index)}
        aria-label="Eliminar color"
        disabled={total <= 1}
      >×</button>
    </div>
  )
}

const INTENSITY_LABELS = [
  { value: 'soft', label: 'Suau' },
  { value: 'balanced', label: 'Equilibrada' },
  { value: 'contrast', label: 'Contrastada' },
]

function PaletteCard({ palette, expanded, onToggleExpand, onRename, onDuplicate, onDelete, onChangeColor, onAddColor, onMoveColor, onRemoveColor, onSetColors }) {
  const [genCount, setGenCount] = useState(12)
  const [genIntensity, setGenIntensity] = useState('balanced')
  const [genPreview, setGenPreview] = useState(null)

  const handlePreview = () => {
    const generated = generateHarmoniousColors(palette.colors, genCount, genIntensity)
    setGenPreview(generated)
  }

  const handleApply = () => {
    if (genPreview) {
      onSetColors(palette.id, genPreview)
      setGenPreview(null)
    }
  }

  return (
    <div className="palmgr-card">
      <div className="palmgr-card-header">
        <input
          className="palmgr-card-name"
          value={palette.name}
          onChange={(e) => onRename(palette.id, e.target.value)}
          aria-label="Nom de la paleta"
        />
        <div className="palmgr-card-actions">
          <button
            type="button"
            className="palmgr-card-btn"
            onClick={() => onDuplicate(palette)}
            title="Duplicar paleta"
          >⎘</button>
          <button
            type="button"
            className="palmgr-card-btn palmgr-card-btn--del"
            onClick={() => onDelete(palette.id)}
            title="Eliminar paleta"
          >×</button>
        </div>
      </div>

      <div className="palmgr-swatches">
        {palette.colors.map((c, i) => (
          <span key={i} className="palmgr-swatch" style={{ background: c }} title={c} />
        ))}
      </div>

      <button
        type="button"
        className="palmgr-expand-btn"
        onClick={() => onToggleExpand(palette.id)}
      >
        {expanded ? 'Tancar ▲' : 'Editar colors ▼'}
      </button>

      {expanded && (
        <div className="palmgr-color-editor">
          {palette.colors.map((color, ci) => (
            <ColorRow
              key={ci}
              color={color}
              index={ci}
              total={palette.colors.length}
              onChangeColor={(i, c) => onChangeColor(palette.id, i, c)}
              onMove={(i, dir) => onMoveColor(palette.id, i, dir)}
              onRemove={(i) => onRemoveColor(palette.id, i)}
            />
          ))}
          <button
            type="button"
            className="palmgr-add-color-btn"
            onClick={() => onAddColor(palette.id)}
          >
            + Afegir color
          </button>

          {/* Color generation section */}
          <div className="palmgr-generate">
            <p className="palmgr-generate-title">Generar colors addicionals</p>
            <div className="palmgr-generate-controls">
              <label className="palmgr-generate-label">Total colors</label>
              <input
                type="number"
                className="palmgr-generate-num"
                min={palette.colors.length + 1}
                max={40}
                value={genCount}
                onChange={(e) => { setGenCount(Math.max(palette.colors.length + 1, Number(e.target.value) || 2)); setGenPreview(null) }}
              />
              <label className="palmgr-generate-label">Intensitat</label>
              <select
                className="palmgr-generate-select"
                value={genIntensity}
                onChange={(e) => { setGenIntensity(e.target.value); setGenPreview(null) }}
              >
                {INTENSITY_LABELS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {genPreview && (
              <div className="palmgr-generate-preview">
                <span className="palmgr-generate-preview-label">Previsualització ({genPreview.length})</span>
                <div className="palmgr-generate-swatches">
                  {genPreview.map((c, i) => (
                    <span
                      key={i}
                      className={`palmgr-swatch${i < palette.colors.length ? ' palmgr-swatch--seed' : ''}`}
                      style={{ background: c }}
                      title={`${c}${i < palette.colors.length ? ' (original)' : ' (generat)'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="palmgr-generate-actions">
              <button type="button" className="palmgr-generate-btn" onClick={handlePreview}>
                Previsualitzar
              </button>
              {genPreview && (
                <button type="button" className="palmgr-generate-btn palmgr-generate-btn--apply" onClick={handleApply}>
                  Aplicar paleta
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PaletteManagerDialog({ palettes = [], onClose, onChange }) {
  const [expandedId, setExpandedId] = useState(null)

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id))

  const create = () => {
    const id = `custom-${Date.now()}-${Math.round(Math.random() * 1e6)}`
    const newPal = { id, name: 'Nova paleta', colors: ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261'] }
    onChange([...palettes, newPal])
    setExpandedId(id)
  }

  const duplicate = (source) => {
    const id = `custom-${Date.now()}-${Math.round(Math.random() * 1e6)}`
    const copy = { id, name: `${source.name} (còpia)`, colors: [...source.colors] }
    onChange([...palettes, copy])
    setExpandedId(id)
  }

  const remove = (id) => {
    onChange(palettes.filter((p) => p.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const rename = (id, name) =>
    onChange(palettes.map((p) => (p.id === id ? { ...p, name } : p)))

  const changeColor = (id, ci, color) =>
    onChange(palettes.map((p) =>
      p.id !== id ? p : { ...p, colors: p.colors.map((c, i) => (i === ci ? color : c)) },
    ))

  const addColor = (id) =>
    onChange(palettes.map((p) =>
      p.id !== id ? p : { ...p, colors: [...p.colors, '#888888'] },
    ))

  const removeColor = (id, ci) =>
    onChange(palettes.map((p) =>
      p.id !== id ? p : { ...p, colors: p.colors.filter((_, i) => i !== ci) },
    ))

  const moveColor = (id, ci, dir) => {
    const pal = palettes.find((p) => p.id === id)
    if (!pal) return
    const arr = [...pal.colors]
    const ni = ci + dir
    if (ni < 0 || ni >= arr.length) return
    ;[arr[ci], arr[ni]] = [arr[ni], arr[ci]]
    onChange(palettes.map((p) => (p.id === id ? { ...p, colors: arr } : p)))
  }

  const setColors = (id, colors) =>
    onChange(palettes.map((p) => (p.id === id ? { ...p, colors } : p)))

  return (
    <div className="dialog-overlay">
      <div className="dialog-panel dialog-panel--tall palmgr-panel">
        <div className="dialog-header">
          <h2>Paletes del projecte</h2>
          <button type="button" onClick={onClose} aria-label="Tancar">×</button>
        </div>

        <div className="dialog-body palmgr-body">
          {/* Project palettes */}
          <div className="palmgr-section">
            <div className="palmgr-section-header">
              <span className="palmgr-section-title">Paletes del projecte</span>
              <button type="button" className="palmgr-new-btn" onClick={create}>
                + Nova paleta
              </button>
            </div>

            {palettes.length === 0 ? (
              <p className="palmgr-empty">
                Cap paleta de projecte. Crea'n una nova o duplica un preset del sistema.
              </p>
            ) : (
              palettes.map((pal) => (
                <PaletteCard
                  key={pal.id}
                  palette={pal}
                  expanded={expandedId === pal.id}
                  onToggleExpand={toggleExpand}
                  onRename={rename}
                  onDuplicate={duplicate}
                  onDelete={remove}
                  onChangeColor={changeColor}
                  onAddColor={addColor}
                  onMoveColor={moveColor}
                  onRemoveColor={removeColor}
                  onSetColors={setColors}
                />
              ))
            )}
          </div>

          {/* System presets — read-only, duplicable */}
          <div className="palmgr-section palmgr-section--presets">
            <div className="palmgr-section-header">
              <span className="palmgr-section-title">Presets del sistema</span>
            </div>
            {PALETTE_ORDER.map((id) => {
              const p = PALETTES[id]
              return (
                <div key={id} className="palmgr-card palmgr-card--preset">
                  <div className="palmgr-card-header">
                    <span className="palmgr-card-preset-name">{p.name}</span>
                    <button
                      type="button"
                      className="palmgr-card-btn"
                      onClick={() => duplicate({ id, name: p.name, colors: [...p.colors] })}
                      title="Duplicar com a paleta del projecte"
                    >
                      Duplicar
                    </button>
                  </div>
                  <div className="palmgr-swatches">
                    {p.colors.map((c, i) => (
                      <span key={i} className="palmgr-swatch" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="dialog-footer">
          <button type="button" className="primary" onClick={onClose}>Tancar</button>
        </div>
      </div>
    </div>
  )
}
