import { useEffect, useMemo, useRef, useState } from 'react'

const CATEGORY_LABELS = {
  general: 'General',
  light: 'Clars',
  dark: 'Foscos',
  satellite: "Satèl·lit",
  topo: 'Topogràfic',
  official: 'Oficial',
  custom: 'Personalitzat',
}

const CATEGORY_ORDER = ['general', 'light', 'dark', 'satellite', 'topo', 'official', 'custom']

const SEARCH_MIN_CHARS = 3
const SEARCH_DEBOUNCE_MS = 300

function TopBar({
  projectName = 'Nou projecte',
  onProjectNameChange,
  isDirty = false,
  basemapOptions = [],
  selectedBasemapId = '',
  onBasemapChange,
  onMunicipalitySelect,
  onAddMunicipalityLayer,
  onOpenProject,
  onImportGeoJSON,
  onImportShapefile,
  onImportGpkg,
  onExportVisibleGeoJSON,
  onExportPNG,
  onExportProject,
  onExportWebProject,
  onExportAllLayers,
  onExportPDFSimple,
  onExportBasemapHD,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [currentSelection, setCurrentSelection] = useState(null)
  const [exportTitle, setExportTitle] = useState('')
  const [showLegend, setShowLegend] = useState(true)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [hdWidth, setHdWidth] = useState('10000')
  const [hdHeight, setHdHeight] = useState('')
  const [hdZoomMode, setHdZoomMode] = useState('auto')
  const [hdManualZoom, setHdManualZoom] = useState('17')
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(projectName)

  useEffect(() => {
    setNameInput(projectName)
  }, [projectName])

  const basemapMaxZoom = useMemo(
    () => basemapOptions.find((b) => b.id === selectedBasemapId)?.maxZoom ?? 19,
    [basemapOptions, selectedBasemapId],
  )

  const exportMenuRef = useRef(null)
  const importMenuRef = useRef(null)

  const canSearch = searchQuery.trim().length >= SEARCH_MIN_CHARS

  const searchEndpoint = useMemo(() => {
    const query = searchQuery.trim()
    if (!query || query.length < SEARCH_MIN_CHARS) return null
    const params = new URLSearchParams({
      format: 'jsonv2',
      countrycodes: 'es',
      addressdetails: '1',
      polygon_geojson: '1',
      limit: '6',
      dedupe: '1',
      q: query,
    })
    return `https://nominatim.openstreetmap.org/search?${params.toString()}`
  }, [searchQuery])

  useEffect(() => {
    if (!searchEndpoint) {
      setSuggestions([])
      setIsSearchLoading(false)
      setIsSearchOpen(false)
      return undefined
    }
    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      try {
        setIsSearchLoading(true)
        const response = await fetch(searchEndpoint, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error('Nominatim request failed')
        const data = await response.json()
        if (!Array.isArray(data)) { setSuggestions([]); return }
        setSuggestions(
          data.map((item) => ({
            placeId: item.place_id,
            label: item.display_name,
            lat: Number(item.lat),
            lon: Number(item.lon),
            boundingbox: Array.isArray(item.boundingbox) ? item.boundingbox : null,
            geometry: item.geojson || null,
          })),
        )
      } catch (error) {
        if (error.name !== 'AbortError') setSuggestions([])
      } finally {
        setIsSearchLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => { controller.abort(); clearTimeout(timeoutId) }
  }, [searchEndpoint])

  useEffect(() => {
    if (!showExportMenu) return
    const handleOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setShowExportMenu(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showExportMenu])

  useEffect(() => {
    if (!showImportMenu) return
    const handleOutside = (e) => {
      if (importMenuRef.current && !importMenuRef.current.contains(e.target)) setShowImportMenu(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showImportMenu])

  const commitName = () => {
    const trimmed = nameInput.trim() || 'Nou projecte'
    setIsEditingName(false)
    setNameInput(trimmed)
    onProjectNameChange?.(trimmed)
  }

  const handleSuggestionClick = (suggestion) => {
    const hasBoundingBox =
      Array.isArray(suggestion.boundingbox) && suggestion.boundingbox.length === 4
    let bounds
    if (hasBoundingBox) {
      const south = Number(suggestion.boundingbox[0])
      const north = Number(suggestion.boundingbox[1])
      const west = Number(suggestion.boundingbox[2])
      const east = Number(suggestion.boundingbox[3])
      if ([south, north, west, east].every(Number.isFinite)) {
        bounds = [[south, west], [north, east]]
      }
    }
    const selection = {
      label: suggestion.label,
      center: [suggestion.lat, suggestion.lon],
      bounds,
      geometry: suggestion.geometry,
      zoom: 12,
    }
    onMunicipalitySelect?.(selection)
    setCurrentSelection(
      suggestion.geometry && ['Polygon', 'MultiPolygon'].includes(suggestion.geometry.type)
        ? selection
        : null,
    )
    setSearchQuery(suggestion.label)
    setSuggestions([])
    setIsSearchOpen(false)
  }

  const handleClearMunicipality = () => {
    setSearchQuery('')
    setSuggestions([])
    setIsSearchLoading(false)
    setIsSearchOpen(false)
    setCurrentSelection(null)
    onMunicipalitySelect?.(null)
  }

  return (
    <header className="topbar">
      {/* LEFT — project zone */}
      <div className="topbar-project">
        <div className="topbar-project-name-wrapper">
          {isEditingName ? (
            <input
              className="topbar-project-name-input"
              value={nameInput}
              maxLength={80}
              autoFocus
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitName() }
                if (e.key === 'Escape') { setIsEditingName(false); setNameInput(projectName) }
              }}
            />
          ) : (
            <button
              type="button"
              className="topbar-project-name"
              title="Fes clic per editar el nom del projecte"
              onClick={() => setIsEditingName(true)}
            >
              {projectName}
              {isDirty ? (
                <span className="topbar-dirty-indicator" title="Hi ha canvis no exportats">●</span>
              ) : null}
            </button>
          )}
        </div>
      </div>

      {/* CENTER — tools */}
      <div className="topbar-center">
        <div className="topbar-search">
          <span className="topbar-search-label">Municipi</span>
          <div className="topbar-search-inner">
            <input
              id="municipality-search"
              type="text"
              value={searchQuery}
              onChange={(event) => {
                const nextQuery = event.target.value
                setSearchQuery(nextQuery)
                setIsSearchOpen(nextQuery.trim().length >= SEARCH_MIN_CHARS)
                if (!nextQuery.trim()) onMunicipalitySelect?.(null)
              }}
              onFocus={() => { if (canSearch) setIsSearchOpen(true) }}
              onBlur={() => setIsSearchOpen(false)}
              onKeyDown={(event) => { if (event.key === 'Escape') setIsSearchOpen(false) }}
              placeholder="Buscar municipi..."
              autoComplete="off"
            />
            {searchQuery.trim() ? (
              <button
                type="button"
                className="topbar-search-clear"
                aria-label="Buidar cerca de municipi"
                onMouseDown={(event) => { event.preventDefault(); handleClearMunicipality() }}
              >
                ×
              </button>
            ) : null}
            {isSearchOpen && canSearch && (isSearchLoading || suggestions.length > 0) ? (
              <ul className="topbar-search-results">
                {isSearchLoading ? <li>Cercant...</li> : null}
                {!isSearchLoading &&
                  suggestions.map((suggestion) => (
                    <li key={suggestion.placeId}>
                      <button
                        type="button"
                        onMouseDown={(event) => { event.preventDefault(); handleSuggestionClick(suggestion) }}
                      >
                        {suggestion.label}
                      </button>
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
          {currentSelection ? (
            <button
              type="button"
              className="topbar-add-layer-btn"
              title={`Afegir el límit de "${currentSelection.label}" com a capa poligonal`}
              onMouseDown={(event) => { event.preventDefault(); onAddMunicipalityLayer?.(currentSelection) }}
            >
              + Capa
            </button>
          ) : null}
        </div>

        <div className="topbar-basemap">
          <span className="topbar-basemap-label">Mapa base</span>
          <select
            value={selectedBasemapId}
            onChange={(event) => onBasemapChange?.(event.target.value)}
          >
            {CATEGORY_ORDER.filter((cat) =>
              basemapOptions.some((b) => b.category === cat),
            ).map((cat) => (
              <optgroup key={cat} label={CATEGORY_LABELS[cat] ?? cat}>
                {basemapOptions
                  .filter((b) => b.category === cat)
                  .map((basemap) => (
                    <option key={basemap.id} value={basemap.id}>
                      {basemap.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* RIGHT — actions */}
      <div className="topbar-right">
        <button type="button" className="topbar-btn" onClick={onOpenProject}>
          Obrir
        </button>

        {/* Import dropdown */}
        <div className="topbar-dropdown-wrapper" ref={importMenuRef}>
          <button
            type="button"
            className="topbar-btn"
            onClick={() => setShowImportMenu((v) => !v)}
          >
            Importar ▾
          </button>
          {showImportMenu ? (
            <div className="topbar-dropdown-panel">
              <div className="topbar-dropdown-section">Dades vectorials</div>
              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={() => { onImportGeoJSON?.(); setShowImportMenu(false) }}
              >
                GeoJSON
              </button>
              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={() => { onImportShapefile?.(); setShowImportMenu(false) }}
              >
                Shapefile (SHP)
              </button>
              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={() => { onImportGpkg?.(); setShowImportMenu(false) }}
              >
                GeoPackage (GPKG)
              </button>
            </div>
          ) : null}
        </div>

        {/* Export dropdown */}
        <div className="topbar-dropdown-wrapper" ref={exportMenuRef}>
          <button
            type="button"
            className="topbar-btn topbar-btn--primary"
            onClick={() => setShowExportMenu((v) => !v)}
          >
            Exportar ▾
          </button>
          {showExportMenu ? (
            <div className="topbar-dropdown-panel topbar-dropdown-panel--right">
              <div className="topbar-dropdown-section">Projecte</div>
              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={() => { onExportProject?.(); setShowExportMenu(false) }}
              >
                Guardar projecte (.json)
              </button>
              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={() => { onExportWebProject?.(); setShowExportMenu(false) }}
              >
                Exportar projecte web
              </button>

              <div className="topbar-dropdown-divider" />
              <div className="topbar-dropdown-section">Dades</div>
              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={() => { onExportVisibleGeoJSON?.(); setShowExportMenu(false) }}
              >
                Exportar GeoJSON visible
              </button>
              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={() => { onExportAllLayers?.(); setShowExportMenu(false) }}
              >
                Exportar capes (Affinity)
              </button>

              <div className="topbar-dropdown-divider" />
              <div className="topbar-dropdown-section">Imatge</div>
              <button
                type="button"
                className="topbar-dropdown-item"
                onClick={() => { onExportPDFSimple?.(); setShowExportMenu(false) }}
              >
                Exportar PDF (prova)
              </button>
              <div className="export-dropdown-png">
                <input
                  type="text"
                  className="topbar-export-title"
                  placeholder={`Títol PNG (per defecte: ${projectName})`}
                  value={exportTitle}
                  onChange={(event) => setExportTitle(event.target.value)}
                  maxLength={120}
                />
                <label className="topbar-export-legend-toggle">
                  <input
                    type="checkbox"
                    checked={showLegend}
                    onChange={(event) => setShowLegend(event.target.checked)}
                  />
                  Llegenda
                </label>
                <button
                  type="button"
                  className="topbar-dropdown-item topbar-dropdown-item--cta"
                  onClick={() => {
                    onExportPNG?.({ title: exportTitle || projectName, showLegend })
                    setShowExportMenu(false)
                  }}
                >
                  Exportar PNG
                </button>
              </div>

              <div className="topbar-dropdown-divider" />
              <div className="export-dropdown-hd">
                <div className="export-dropdown-hd-row">
                  <input
                    type="number"
                    className="topbar-hd-input"
                    placeholder="Amplada px"
                    value={hdWidth}
                    onChange={(e) => setHdWidth(e.target.value)}
                    min="100"
                    max="30000"
                  />
                  <input
                    type="number"
                    className="topbar-hd-input"
                    placeholder="Alçada px (opt.)"
                    value={hdHeight}
                    onChange={(e) => setHdHeight(e.target.value)}
                    min="100"
                    max="30000"
                  />
                </div>
                <div className="export-dropdown-hd-mode">
                  <label>
                    <input
                      type="radio"
                      name="hdZoomMode"
                      value="auto"
                      checked={hdZoomMode === 'auto'}
                      onChange={() => setHdZoomMode('auto')}
                    />
                    Automàtic
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="hdZoomMode"
                      value="manual"
                      checked={hdZoomMode === 'manual'}
                      onChange={() => { setHdZoomMode('manual'); setHdManualZoom(String(basemapMaxZoom)) }}
                    />
                    Manual
                  </label>
                </div>
                {hdZoomMode === 'manual' && (
                  <div className="export-dropdown-hd-zoom">
                    <label>
                      Zoom XYZ:
                      <input
                        type="number"
                        className="topbar-hd-input"
                        value={hdManualZoom}
                        onChange={(e) => setHdManualZoom(e.target.value)}
                        min="1"
                        max={basemapMaxZoom}
                      />
                    </label>
                    <span className="topbar-hd-hint">màx: {basemapMaxZoom}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="topbar-dropdown-item topbar-dropdown-item--cta"
                  onClick={() => {
                    onExportBasemapHD?.({
                      targetWidth: parseInt(hdWidth) || 10000,
                      targetHeight: hdHeight ? parseInt(hdHeight) : null,
                      maxQuality: hdZoomMode === 'auto',
                      manualZoom: hdZoomMode === 'manual' ? parseInt(hdManualZoom) || 17 : null,
                    })
                    setShowExportMenu(false)
                  }}
                >
                  Exportar basemap HD
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default TopBar
