import { useState } from 'react'

const GEOM_TYPE_LABELS = {
  point: 'punts',
  line: 'línies',
  polygon: 'polígons',
  mixed: 'mixt',
}

const LARGE_FILE_THRESHOLD = 20000

/**
 * Dialog shown after reading a GeoJSON source.
 * Lets the user choose how many features to load into the working dataset.
 *
 * Props:
 *   fileName   — original file name
 *   meta       — { featureCount, bbox, fields, geometryType }
 *   onConfirm({ useViewport, limit })  — called with import options
 *   onCancel()
 */
export default function SourceImportDialog({ fileName, meta, onConfirm, onCancel }) {
  const [mode, setMode] = useState('all')
  const [limitValue, setLimitValue] = useState('5000')

  const { featureCount, bbox, fields, geometryType } = meta
  const isLarge = featureCount > LARGE_FILE_THRESHOLD

  const bboxStr = bbox
    ? `${bbox[0].toFixed(3)}, ${bbox[1].toFixed(3)}, ${bbox[2].toFixed(3)}, ${bbox[3].toFixed(3)}`
    : null

  const handleConfirm = () => {
    const options = {}
    if (mode === 'viewport') {
      options.useViewport = true
    } else if (mode === 'limit') {
      const n = parseInt(limitValue, 10)
      if (n > 0) options.limit = n
    }
    onConfirm(options)
  }

  const limitN = parseInt(limitValue, 10)
  const canConfirm = mode !== 'limit' || (limitN > 0 && limitN <= featureCount)

  return (
    <div className="dialog-overlay">
      <div className="dialog-panel">
        <div className="dialog-header">
          <h2>Importar com a font</h2>
          <button type="button" onClick={onCancel} aria-label="Tancar">
            ×
          </button>
        </div>

        <div className="dialog-body">
          <p className="dialog-file-info">
            <strong>{fileName.replace(/\.(geo)?json$/i, '')}</strong>
            {' · '}
            <strong>{featureCount.toLocaleString()}</strong> elements
            {' · '}
            {GEOM_TYPE_LABELS[geometryType] ?? geometryType}
          </p>

          {bboxStr ? (
            <p className="source-dialog-meta">bbox: {bboxStr}</p>
          ) : null}

          {fields.length > 0 ? (
            <p className="source-dialog-meta">
              Camps: {fields.slice(0, 8).join(', ')}
              {fields.length > 8 ? ` +${fields.length - 8} més` : ''}
            </p>
          ) : null}

          {isLarge ? (
            <p className="source-dialog-warning">
              Fitxer gran — es recomana filtrar per àrea visible o limitar el nombre d&apos;elements per evitar bloquejos.
            </p>
          ) : null}

          <fieldset className="dialog-fieldset">
            <legend>Elements a carregar</legend>

            <label className="dialog-radio-option">
              <input
                type="radio"
                name="source-mode"
                value="all"
                checked={mode === 'all'}
                onChange={() => setMode('all')}
              />
              <span>
                <strong>Tots els elements</strong>
                <span className="dialog-option-hint">
                  {featureCount.toLocaleString()} elements
                  {isLarge ? ' — pot ser lent' : ''}
                </span>
              </span>
            </label>

            <label className="dialog-radio-option">
              <input
                type="radio"
                name="source-mode"
                value="viewport"
                checked={mode === 'viewport'}
                onChange={() => setMode('viewport')}
              />
              <span>
                <strong>Àrea visible del mapa</strong>
                <span className="dialog-option-hint">
                  Filtra per la vista actual — recomanat per grans conjunts
                </span>
              </span>
            </label>

            <label className="dialog-radio-option">
              <input
                type="radio"
                name="source-mode"
                value="limit"
                checked={mode === 'limit'}
                onChange={() => setMode('limit')}
              />
              <span>
                <strong>Limitar a N elements</strong>
                {mode === 'limit' ? (
                  <span className="source-dialog-limit-row">
                    <input
                      type="number"
                      min="1"
                      max={featureCount}
                      value={limitValue}
                      onChange={(e) => setLimitValue(e.target.value)}
                      className="source-dialog-limit-input"
                    />
                    <span className="dialog-option-hint">
                      màx {featureCount.toLocaleString()}
                    </span>
                  </span>
                ) : null}
              </span>
            </label>
          </fieldset>

          <p className="source-dialog-note">
            Les dades s&apos;emmagatzemen fora del estat de React. El render filtra per viewport automàticament.
          </p>
        </div>

        <div className="dialog-footer">
          <button type="button" onClick={onCancel}>
            Cancel·lar
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            Crear capa
          </button>
        </div>
      </div>
    </div>
  )
}
