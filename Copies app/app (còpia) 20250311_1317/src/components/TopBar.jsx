import { useEffect, useMemo, useState } from 'react'

const SEARCH_MIN_CHARS = 3
const SEARCH_DEBOUNCE_MS = 300

function TopBar({
  basemapOptions = [],
  selectedBasemapId = '',
  onBasemapChange,
  onMunicipalitySelect,
  onOpenProject,
  onImportGeoJSON,
  onExportVisibleGeoJSON,
  onExportPNG,
  onExportProject,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

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

    onMunicipalitySelect?.({
      label: suggestion.label,
      center: [suggestion.lat, suggestion.lon],
      bounds,
      geometry: suggestion.geometry,
      zoom: 12,
    })

    setSearchQuery(suggestion.label)
    setSuggestions([])
    setIsSearchOpen(false)
  }

  const handleClearMunicipality = () => {
    setSearchQuery('')
    setSuggestions([])
    setIsSearchLoading(false)
    setIsSearchOpen(false)
    onMunicipalitySelect?.(null)
  }

  return (
    <header className="topbar">
      <div className="brand-block">
        <p className="eyebrow">Editor de mapes</p>
        <h1>Projecte actiu: Municipi (placeholder)</h1>
      </div>
      <div className="topbar-actions">
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
            {basemapOptions.map((basemap) => (
              <option key={basemap.id} value={basemap.id}>
                {basemap.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onOpenProject}>
          Obrir projecte
        </button>
        <button type="button" onClick={onImportGeoJSON}>
          Importar GeoJSON
        </button>
        <button type="button" onClick={onExportVisibleGeoJSON}>
          Exportar visible a GeoJSON
        </button>
        <button type="button" onClick={onExportPNG}>
          Exportar PNG
        </button>
        <button type="button" className="primary" onClick={onExportProject}>
          Exportar projecte
        </button>
      </div>
    </header>
  )
}

export default TopBar
