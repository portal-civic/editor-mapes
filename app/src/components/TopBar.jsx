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
  basemapOptions = [],
  selectedBasemapId = '',
  onBasemapChange,
  onMunicipalitySelect,
  onAddMunicipalityLayer,
  onOpenProject,
  onImportGeoJSON,
  onExportVisibleGeoJSON,
  onExportPNG,
  onExportProject,
  onExportWebProject,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  // Tracks the last confirmed municipality selection (with geometry) for the "add to layer" action.
  const [currentSelection, setCurrentSelection] = useState(null)
  const [exportTitle, setExportTitle] = useState('')
  const [showLegend, setShowLegend] = useState(true)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const exportMenuRef = useRef(null)

  const canSearch = searchQuery.trim().length >= SEARCH_MIN_CHARS

  const searchEndpoint = useMemo(() => {
    const query = searchQuery.trim()
    if (!query || query.length < SEARCH_MIN_CHARS) {
      return null
    }

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
          headers: {
            Accept: 'application/json',
          },
        })
        if (!response.ok) {
          throw new Error('Nominatim request failed')
        }

        const data = await response.json()
        if (!Array.isArray(data)) {
          setSuggestions([])
          return
        }

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
        if (error.name !== 'AbortError') {
          setSuggestions([])
        }
      } finally {
        setIsSearchLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [searchEndpoint])

  useEffect(() => {
    if (!showExportMenu) return
    const handleOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showExportMenu])

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
        bounds = [
          [south, west],
          [north, east],
        ]
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
      <div className="brand-block">
        <p className="eyebrow">Editor de mapes</p>
        <h1>Projecte actiu: Municipi (placeholder)</h1>
      </div>

      <div className="topbar-center">
        <div className="topbar-search">
          <label className="topbar-field" htmlFor="municipality-search">
            <span>Municipi</span>
          </label>
          <input
            id="municipality-search"
            type="text"
            value={searchQuery}
            onChange={(event) => {
              const nextQuery = event.target.value
              setSearchQuery(nextQuery)
              setIsSearchOpen(nextQuery.trim().length >= SEARCH_MIN_CHARS)
              if (!nextQuery.trim()) {
                onMunicipalitySelect?.(null)
              }
            }}
            onFocus={() => {
              if (canSearch) {
                setIsSearchOpen(true)
              }
            }}
            onBlur={() => setIsSearchOpen(false)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsSearchOpen(false)
              }
            }}
            placeholder="Buscar municipi..."
            autoComplete="off"
          />
          {searchQuery.trim() ? (
            <button
              type="button"
              className="topbar-search-clear"
              aria-label="Buidar cerca de municipi"
              onMouseDown={(event) => {
                event.preventDefault()
                handleClearMunicipality()
              }}
            >
              ×
            </button>
          ) : null}
          {currentSelection ? (
            <button
              type="button"
              className="topbar-add-layer-btn"
              title={`Afegir el límit de "${currentSelection.label}" com a capa poligonal`}
              onMouseDown={(event) => {
                event.preventDefault()
                onAddMunicipalityLayer?.(currentSelection)
              }}
            >
              + Capa
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
                      onMouseDown={(event) => {
                        event.preventDefault()
                        handleSuggestionClick(suggestion)
                      }}
                    >
                      {suggestion.label}
                    </button>
                  </li>
                ))}
            </ul>
          ) : null}
        </div>

        <label className="topbar-field">
          <span>Mapa base</span>
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
        </label>
      </div>

      <div className="topbar-right">
        <button type="button" onClick={onOpenProject}>
          Obrir
        </button>
        <button type="button" onClick={onImportGeoJSON}>
          Importar GeoJSON
        </button>

        <div className="export-dropdown-wrapper" ref={exportMenuRef}>
          <button
            type="button"
            className="primary"
            onClick={() => setShowExportMenu((v) => !v)}
          >
            Exportar ▾
          </button>
          {showExportMenu ? (
            <div className="export-dropdown-panel">
              <button
                type="button"
                onClick={() => {
                  onExportProject?.()
                  setShowExportMenu(false)
                }}
              >
                Exportar projecte
              </button>
              <button
                type="button"
                onClick={() => {
                  onExportWebProject?.()
                  setShowExportMenu(false)
                }}
              >
                Exportar projecte web
              </button>
              <div className="export-dropdown-divider" />
              <button
                type="button"
                onClick={() => {
                  onExportVisibleGeoJSON?.()
                  setShowExportMenu(false)
                }}
              >
                Exportar GeoJSON visible
              </button>
              <div className="export-dropdown-divider" />
              <div className="export-dropdown-png">
                <input
                  type="text"
                  className="topbar-export-title"
                  placeholder="Títol del PNG..."
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
                  onClick={() => {
                    onExportPNG?.({ title: exportTitle, showLegend })
                    setShowExportMenu(false)
                  }}
                >
                  Exportar PNG
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
