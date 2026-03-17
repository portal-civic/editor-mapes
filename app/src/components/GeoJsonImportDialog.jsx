import { useEffect, useMemo, useState } from 'react'
import { IMPORT_MODES } from '../modules/import/importOptions'

const NOMINATIM_MIN_CHARS = 3
const NOMINATIM_DEBOUNCE_MS = 300

/**
 * Dialog shown before importing a GeoJSON file.
 * Lets the user choose the spatial filter mode before layers are created.
 *
 * Props:
 *   fileName       — file name shown in the header
 *   featureCount   — total feature count from the raw file
 *   onConfirm({ mode, municipalityGeometry }) — called when the user confirms
 *   onCancel()     — called when the user dismisses the dialog
 */
export default function GeoJsonImportDialog({ fileName, featureCount, onConfirm, onCancel }) {
  const [mode, setMode] = useState(IMPORT_MODES.COMPLETE)
  const [municipalityQuery, setMunicipalityQuery] = useState('')
  const [municipalitySuggestions, setMunicipalitySuggestions] = useState([])
  const [isMunicipalityLoading, setIsMunicipalityLoading] = useState(false)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [selectedMunicipality, setSelectedMunicipality] = useState(null)

  const canSearch = municipalityQuery.trim().length >= NOMINATIM_MIN_CHARS

  const searchEndpoint = useMemo(() => {
    const query = municipalityQuery.trim()
    if (query.length < NOMINATIM_MIN_CHARS) return null
    const params = new URLSearchParams({
      format: 'jsonv2',
      countrycodes: 'es',
      polygon_geojson: '1',
      limit: '6',
      q: query,
    })
    return `https://nominatim.openstreetmap.org/search?${params.toString()}`
  }, [municipalityQuery])

  useEffect(() => {
    if (!searchEndpoint) {
      setMunicipalitySuggestions([])
      setIsMunicipalityLoading(false)
      setIsSuggestionsOpen(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      try {
        setIsMunicipalityLoading(true)
        const response = await fetch(searchEndpoint, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error('Nominatim request failed')
        const data = await response.json()
        if (!Array.isArray(data)) {
          setMunicipalitySuggestions([])
          return
        }
        setMunicipalitySuggestions(
          data
            .map((item) => ({
              placeId: item.place_id,
              label: item.display_name,
              geometry: item.geojson || null,
            }))
            .filter(
              (s) => s.geometry && ['Polygon', 'MultiPolygon'].includes(s.geometry.type),
            ),
        )
      } catch (error) {
        if (error.name !== 'AbortError') setMunicipalitySuggestions([])
      } finally {
        setIsMunicipalityLoading(false)
      }
    }, NOMINATIM_DEBOUNCE_MS)

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [searchEndpoint])

  const handleSelectMunicipality = (suggestion) => {
    const shortLabel = suggestion.label.split(',')[0].trim()
    setSelectedMunicipality({ label: shortLabel, geometry: suggestion.geometry })
    setMunicipalityQuery(shortLabel)
    setMunicipalitySuggestions([])
    setIsSuggestionsOpen(false)
  }

  const handleClearMunicipality = () => {
    setMunicipalityQuery('')
    setSelectedMunicipality(null)
    setMunicipalitySuggestions([])
  }

  const handleConfirm = () => {
    if (mode === IMPORT_MODES.MUNICIPALITY && !selectedMunicipality) return
    onConfirm({ mode, municipalityGeometry: selectedMunicipality?.geometry ?? null })
  }

  const canConfirm = mode !== IMPORT_MODES.MUNICIPALITY || selectedMunicipality !== null

  return (
    <div className="dialog-overlay">
      <div className="dialog-panel">
        <div className="dialog-header">
          <h2>Importar GeoJSON</h2>
          <button type="button" onClick={onCancel} aria-label="Tancar">
            ×
          </button>
        </div>

        <div className="dialog-body">
          <p className="dialog-file-info">
            {fileName.replace(/\.(geo)?json$/i, '')} ·{' '}
            <strong>{featureCount.toLocaleString()}</strong> elements al fitxer
          </p>

          <fieldset className="dialog-fieldset">
            <legend>Àrea d&apos;importació</legend>

            <label className="dialog-radio-option">
              <input
                type="radio"
                name="import-mode"
                value={IMPORT_MODES.COMPLETE}
                checked={mode === IMPORT_MODES.COMPLETE}
                onChange={() => setMode(IMPORT_MODES.COMPLETE)}
              />
              <span>
                <strong>Tot el fitxer</strong>
                <span className="dialog-option-hint">Importa tots els elements</span>
              </span>
            </label>

            <label className="dialog-radio-option">
              <input
                type="radio"
                name="import-mode"
                value={IMPORT_MODES.VIEWPORT}
                checked={mode === IMPORT_MODES.VIEWPORT}
                onChange={() => setMode(IMPORT_MODES.VIEWPORT)}
              />
              <span>
                <strong>Àrea visible del mapa</strong>
                <span className="dialog-option-hint">
                  Només els elements que intersecten la vista actual
                </span>
              </span>
            </label>

            <label className="dialog-radio-option">
              <input
                type="radio"
                name="import-mode"
                value={IMPORT_MODES.MUNICIPALITY}
                checked={mode === IMPORT_MODES.MUNICIPALITY}
                onChange={() => setMode(IMPORT_MODES.MUNICIPALITY)}
              />
              <span>
                <strong>Àrea municipal</strong>
                <span className="dialog-option-hint">
                  Només els elements que intersecten el límit d&apos;un municipi
                </span>
              </span>
            </label>
          </fieldset>

          {mode === IMPORT_MODES.MUNICIPALITY ? (
            <div className="dialog-municipality-search">
              <div className="dialog-municipality-input-wrapper">
                <input
                  type="text"
                  placeholder="Buscar municipi..."
                  value={municipalityQuery}
                  autoComplete="off"
                  onChange={(e) => {
                    setMunicipalityQuery(e.target.value)
                    setSelectedMunicipality(null)
                    setIsSuggestionsOpen(
                      e.target.value.trim().length >= NOMINATIM_MIN_CHARS,
                    )
                  }}
                  onFocus={() => {
                    if (canSearch) setIsSuggestionsOpen(true)
                  }}
                  onBlur={() => setIsSuggestionsOpen(false)}
                />
                {municipalityQuery ? (
                  <button
                    type="button"
                    className="dialog-clear-btn"
                    onClick={handleClearMunicipality}
                  >
                    ×
                  </button>
                ) : null}
              </div>

              {isSuggestionsOpen &&
              canSearch &&
              (isMunicipalityLoading || municipalitySuggestions.length > 0) ? (
                <ul className="dialog-search-results">
                  {isMunicipalityLoading ? <li>Cercant...</li> : null}
                  {!isMunicipalityLoading &&
                    municipalitySuggestions.map((s) => (
                      <li key={s.placeId}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelectMunicipality(s)
                          }}
                        >
                          {s.label}
                        </button>
                      </li>
                    ))}
                </ul>
              ) : null}

              {selectedMunicipality ? (
                <p className="dialog-municipality-selected">
                  <span className="dialog-municipality-check">✓</span>{' '}
                  {selectedMunicipality.label}
                </p>
              ) : null}
            </div>
          ) : null}
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
            Importar
          </button>
        </div>
      </div>
    </div>
  )
}
