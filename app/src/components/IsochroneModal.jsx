import { useEffect, useState } from 'react'
import { fetchIsochrone, getORSKey, setORSKey } from '../modules/services/orsClient'

const PROFILES = [
  { value: 'foot-walking', label: 'A peu' },
  { value: 'cycling-regular', label: 'Bicicleta' },
  { value: 'driving-car', label: 'Cotxe' },
]

const TIMES = [5, 10, 15]

const PROFILE_ICONS = {
  'foot-walking': (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" stroke="none" />
      <path d="M6 5l-1.5 4h3l1 4M6 5l2 1.5 2-1.5M10 9l1.5 4" />
    </svg>
  ),
  'cycling-regular': (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="3.5" cy="11.5" r="2.5" />
      <circle cx="12.5" cy="11.5" r="2.5" />
      <path d="M3.5 11.5L7 6l3 1.5 2.5 4" />
      <path d="M7 6l1.5-3h2" />
    </svg>
  ),
  'driving-car': (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 9l1.5-4h9L14 9v3H2V9Z" />
      <circle cx="4.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M2 9h12" />
    </svg>
  ),
}

function profileLabel(profile) {
  return PROFILES.find((p) => p.value === profile)?.label ?? profile
}

function autoLayerName(profile, timeMin) {
  return `Isòcrona ${timeMin} min — ${profileLabel(profile).toLowerCase()}`
}

const ERROR_MESSAGES = {
  POINT_REQUIRED: 'Selecciona un punt en el mapa primer.',
  NO_API_KEY: 'Introdueix la API key de OpenRouteService.',
  API_KEY_INVALID: 'La API key no és vàlida o ha caducat.',
  NETWORK_ERROR: 'Error de xarxa. Comprova la connexió a internet.',
  API_ERROR: 'Error generant la isòcrona. Torna-ho a intentar.',
  NO_DATA: 'El servei no ha retornat dades per a este punt.',
}

export default function IsochroneModal({ pickedPoint, onRequestPick, onCreateLayer, onClose }) {
  const [profile, setProfile] = useState('foot-walking')
  const [timeMin, setTimeMin] = useState(10)
  const [layerName, setLayerName] = useState(() => autoLayerName('foot-walking', 10))
  const [layerNameEdited, setLayerNameEdited] = useState(false)
  const [apiKey, setApiKey] = useState(getORSKey)
  const [showApiKey, setShowApiKey] = useState(() => !getORSKey())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Auto-update layer name unless the user has typed a custom one
  useEffect(() => {
    if (!layerNameEdited) setLayerName(autoLayerName(profile, timeMin))
  }, [profile, timeMin, layerNameEdited])

  // Reset success when inputs change
  useEffect(() => { setSuccess(false); setError(null) }, [profile, timeMin, pickedPoint])

  const handleGenerate = async () => {
    if (!pickedPoint) { setError('POINT_REQUIRED'); return }
    const key = apiKey.trim()
    if (!key) { setError('NO_API_KEY'); return }
    setORSKey(key)
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    const [lat, lng] = pickedPoint
    try {
      const geojson = await fetchIsochrone({ lng, lat, profile, seconds: timeMin * 60 })
      const name = layerName.trim() || autoLayerName(profile, timeMin)
      onCreateLayer(geojson, name)
      setSuccess(true)
    } catch (err) {
      setError(err.code ?? 'API_ERROR')
    } finally {
      setIsLoading(false)
    }
  }

  const errorText = error ? (ERROR_MESSAGES[error] ?? `Error: ${error}`) : null
  const canGenerate = !!pickedPoint && !!apiKey.trim() && !isLoading

  return (
    <div
      className="iso-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Crear isòcrona"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="iso-modal">
        <div className="iso-header">
          <h2 className="iso-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="6" />
              <circle cx="8" cy="8" r="3.5" />
              <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
            </svg>
            Crear isòcrona
          </h2>
          <button type="button" className="iso-close" onClick={onClose} aria-label="Tancar">×</button>
        </div>

        <div className="iso-body">
          {/* Transport mode */}
          <div className="iso-field">
            <p className="iso-field-label">Mode de transport</p>
            <div className="iso-btn-group">
              {PROFILES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`iso-mode-btn${profile === p.value ? ' iso-mode-btn--active' : ''}`}
                  onClick={() => setProfile(p.value)}
                >
                  {PROFILE_ICONS[p.value]}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="iso-field">
            <p className="iso-field-label">Temps màxim</p>
            <div className="iso-btn-group">
              {TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`iso-time-btn${timeMin === t ? ' iso-mode-btn--active' : ''}`}
                  onClick={() => setTimeMin(t)}
                >
                  {t} min
                </button>
              ))}
            </div>
          </div>

          {/* Point pick */}
          <div className="iso-field">
            <p className="iso-field-label">Punt d'origen</p>
            <div className="iso-pick-row">
              <button type="button" className="iso-pick-btn" onClick={onRequestPick}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="7" cy="7" r="3" />
                  <line x1="7" y1="1" x2="7" y2="4" />
                  <line x1="7" y1="10" x2="7" y2="13" />
                  <line x1="1" y1="7" x2="4" y2="7" />
                  <line x1="10" y1="7" x2="13" y2="7" />
                </svg>
                Seleccionar punt en mapa
              </button>
              {pickedPoint ? (
                <span className="iso-coords">
                  {pickedPoint[0].toFixed(5)}, {pickedPoint[1].toFixed(5)}
                </span>
              ) : (
                <span className="iso-coords-empty">Cap punt seleccionat</span>
              )}
            </div>
          </div>

          {/* Layer name */}
          <div className="iso-field">
            <p className="iso-field-label">Nom de la capa</p>
            <input
              type="text"
              className="iso-input"
              value={layerName}
              onChange={(e) => { setLayerName(e.target.value); setLayerNameEdited(true) }}
              placeholder="Nom de la capa…"
              maxLength={80}
            />
          </div>

          {/* API key */}
          <div className="iso-field iso-field--apikey">
            <div className="iso-apikey-header">
              <p className="iso-field-label">Clau API OpenRouteService</p>
              {getORSKey() && (
                <button type="button" className="iso-apikey-toggle" onClick={() => setShowApiKey((v) => !v)}>
                  {showApiKey ? 'Amagar' : 'Canviar'}
                </button>
              )}
            </div>
            {showApiKey ? (
              <input
                type="password"
                className="iso-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enganxa la teua API key…"
                autoComplete="off"
                spellCheck={false}
              />
            ) : (
              <p className="iso-apikey-set">
                <span className="iso-apikey-dots">••••••••••••</span>
                &nbsp;(guardada)
              </p>
            )}
            <p className="iso-apikey-info">
              Registra't a{' '}
              <span className="iso-apikey-site">openrouteservice.org</span>{' '}
              per obtenir una clau gratuïta. Es guarda localment al navegador.
            </p>
          </div>
        </div>

        {/* Status messages */}
        {errorText ? (
          <div className="iso-status iso-status--error">{errorText}</div>
        ) : success ? (
          <div className="iso-status iso-status--success">
            Isòcrona creada. Pots veure-la en el panell de capes.
          </div>
        ) : null}

        <div className="iso-footer">
          <button type="button" className="iso-btn-cancel" onClick={onClose}>
            Tancar
          </button>
          <button
            type="button"
            className="iso-btn-generate"
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            {isLoading ? (
              <>
                <span className="iso-spinner" aria-hidden="true" />
                Generant…
              </>
            ) : (
              'Generar isòcrona'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
