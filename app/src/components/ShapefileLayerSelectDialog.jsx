import { useState } from 'react'

/**
 * Shown when a .zip shapefile contains more than one layer.
 * Lets the user pick which one to import before proceeding to SourceImportDialog.
 *
 * Props:
 *   layers   — [{ name, featureCount }]
 *   warnings — string[]
 *   zipName  — original .zip filename shown in the header
 *   onConfirm(index) — called with the selected layer index
 *   onCancel()
 */
export default function ShapefileLayerSelectDialog({ layers, warnings = [], zipName, onConfirm, onCancel }) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <div className="dialog-overlay">
      <div className="dialog-panel">
        <div className="dialog-header">
          <h2>Triar capa del shapefile</h2>
          <button type="button" onClick={onCancel} aria-label="Tancar">
            ×
          </button>
        </div>

        <div className="dialog-body">
          <p className="dialog-file-info">
            {zipName} · <strong>{layers.length}</strong> capes trobades
          </p>

          {warnings.length > 0 ? (
            <p className="source-dialog-warning">
              {warnings.join(' · ')}
            </p>
          ) : null}

          <fieldset className="dialog-fieldset">
            <legend>Capes disponibles</legend>

            {layers.map((layer, i) => (
              <label key={i} className="dialog-radio-option">
                <input
                  type="radio"
                  name="shp-layer-select"
                  checked={selectedIndex === i}
                  onChange={() => setSelectedIndex(i)}
                />
                <span>
                  <strong>{layer.name}</strong>
                  <span className="dialog-option-hint">
                    {layer.featureCount.toLocaleString()} elements
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>

        <div className="dialog-footer">
          <button type="button" onClick={onCancel}>
            Cancel·lar
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => onConfirm(selectedIndex)}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
