import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchWfsCapabilities,
  findCv05BuildingLayer,
} from '../modules/services/wfsClient'

const GEOM_COLORS = {
  point: '#d4335b',
  line: '#ea8b1f',
  polygon: '#2f7de1',
  mixed: '#64748b',
}

const GEOM_LABELS = { point: 'punts', line: 'línies', polygon: 'polígons', mixed: 'mixt' }

function GeomBadge({ type }) {
  const color = GEOM_COLORS[type] ?? '#64748b'
  const label = GEOM_LABELS[type] ?? type
  if (type === 'polygon') {
    return (
      <svg className="lib-geom-icon" width="14" height="14" viewBox="0 0 14 14" aria-label={label}>
        <polygon points="7,1 13,12 1,12" fill={color} fillOpacity="0.35" stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }
  if (type === 'line') {
    return (
      <svg className="lib-geom-icon" width="14" height="14" viewBox="0 0 14 14" aria-label={label}>
        <line x1="1" y1="12" x2="13" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  if (type === 'point') {
    return (
      <svg className="lib-geom-icon" width="14" height="14" viewBox="0 0 14 14" aria-label={label}>
        <circle cx="7" cy="7" r="4" fill={color} />
      </svg>
    )
  }
  return <span className="lib-geom-icon lib-geom-mixed" aria-label={label}>◈</span>
}

function WfsTypeBadge() {
  return (
    <span className="lib-type-badge lib-type-badge--wfs" title="Carregada des d'un servei WFS">
      WFS
    </span>
  )
}

function EntryStatus({ result, error, isImporting }) {
  if (isImporting) {
    return <p className="lib-entry-status lib-entry-status--loading">Carregant dades…</p>
  }
  if (error) {
    let msg
    switch (error.code) {
      case 'no_file':
        msg = "Esta capa està registrada en la biblioteca però encara no té dades carregades."
        break
      case 'invalid':
        msg = "El fitxer no conté geometries vàlides."
        break
      case 'caps_network':
      case 'wfs_network':
        msg = "No s'ha pogut connectar al servei. Comprova la connexió o que el servei estiga disponible."
        break
      case 'non_json':
        msg = error.wfsUrl
          ? `El servei no retorna JSON. URL generada: ${error.wfsUrl}`
          : "El servei no retorna JSON. Prova amb un outputFormat diferent."
        break
      case 'caps_failed':
      case 'caps_parse_error':
        msg = "No s'ha pogut llegir el catàleg del servei WFS."
        break
      default:
        if (error.code?.startsWith('wfs_http_') || error.code?.startsWith('caps_http_')) {
          const status = error.code.split('_').pop()
          msg = `Error HTTP ${status} del servei WFS.`
          if (error.wfsUrl) msg += ` URL: ${error.wfsUrl}`
        } else {
          msg = `Error carregant la capa (${error.code ?? 'desconegut'}).`
        }
    }
    return <p className="lib-entry-status lib-entry-status--error">{msg}</p>
  }
  if (result) {
    if (result.featureCount === 0) {
      return (
        <p className="lib-entry-status lib-entry-status--empty">
          No hi ha elements d'esta capa en la zona visible.
        </p>
      )
    }
    return (
      <p className="lib-entry-status lib-entry-status--success">
        Capa carregada: {result.featureCount.toLocaleString()} elements
        {result.warned != null
          ? ` (limitat a ${result.warned.toLocaleString()} màx.)`
          : null}
      </p>
    )
  }
  return null
}

function LibraryEntry({ entry, isImporting, result, error, wfsPicker, onWfsTypeSelect, onImport }) {
  const showPicker =
    wfsPicker && !wfsPicker.loading && wfsPicker.layers.length > 0
  const isBusy = isImporting || (wfsPicker?.loading ?? false)

  return (
    <div className={`lib-entry${isBusy ? ' lib-entry--loading' : ''}`}>
      <div className="lib-entry-row">
        <GeomBadge type={entry.geometryType} />
        <div className="lib-entry-info">
          <span className="lib-entry-name">
            {entry.name}
            {entry.type === 'wfs' ? <WfsTypeBadge /> : null}
          </span>
          <span className="lib-entry-group">{entry.group}</span>
        </div>
        <button
          type="button"
          className="lib-import-btn"
          disabled={isBusy}
          onClick={onImport}
          title={
            showPicker
              ? "Afegir la capa seleccionada de la zona visible"
              : "Afegir elements de la zona visible com a capa editable"
          }
        >
          {isBusy ? '…' : showPicker ? 'Confirmar' : 'Zona visible'}
        </button>
      </div>

      {entry.description ? (
        <p className="lib-entry-desc">{entry.description}</p>
      ) : null}

      {/* WFS layer picker — shown when auto-detection fails */}
      {showPicker ? (
        <div className="lib-wfs-picker">
          <p className="lib-wfs-picker-label">
            No s'ha pogut detectar automàticament la capa. Selecciona-la:
          </p>
          <select
            className="lib-wfs-picker-select"
            value={wfsPicker.selectedName}
            onChange={(e) => onWfsTypeSelect(e.target.value)}
          >
            {wfsPicker.layers.map((l) => (
              <option key={l.name} value={l.name}>
                {l.title ? `${l.title} (${l.name})` : l.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <EntryStatus result={result} error={error} isImporting={isImporting} />
    </div>
  )
}

function LibraryDialog({ onClose, onImport }) {
  const [catalog, setCatalog] = useState(null)
  const [catalogError, setCatalogError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState(null)
  const [importing, setImporting] = useState(null)
  const [results, setResults] = useState({})
  const [errors, setErrors] = useState({})
  // WFS picker state per entry: { loading, layers, selectedName }
  const [wfsPickers, setWfsPickers] = useState({})

  const searchRef = useRef(null)

  useEffect(() => {
    fetch('/library/layers/catalog.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => setCatalog(Array.isArray(data) ? data : []))
      .catch(() => setCatalogError(true))
  }, [])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    if (catalog !== null) searchRef.current?.focus()
  }, [catalog])

  const groups = useMemo(() => {
    if (!catalog) return []
    const seen = new Set()
    const list = []
    for (const entry of catalog) {
      if (entry.group && !seen.has(entry.group)) {
        seen.add(entry.group)
        list.push(entry.group)
      }
    }
    return list
  }, [catalog])

  const groupCounts = useMemo(() => {
    if (!catalog) return {}
    const counts = {}
    for (const e of catalog) counts[e.group] = (counts[e.group] ?? 0) + 1
    return counts
  }, [catalog])

  const filtered = useMemo(() => {
    if (!catalog) return []
    let entries = catalog
    if (activeGroup) entries = entries.filter((e) => e.group === activeGroup)
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      entries = entries.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q),
      )
    }
    return entries
  }, [catalog, activeGroup, searchQuery])

  // Runs the actual import once typeName is resolved (geojson or wfs with resolved type)
  const runImport = async (entry) => {
    setImporting(entry.id)
    setResults((r) => { const n = { ...r }; delete n[entry.id]; return n })
    setErrors((r) => { const n = { ...r }; delete n[entry.id]; return n })
    try {
      const result = await onImport(entry)
      setResults((r) => ({ ...r, [entry.id]: result }))
    } catch (err) {
      setErrors((r) => ({
        ...r,
        [entry.id]: { code: err.message, wfsUrl: err.wfsUrl ?? null },
      }))
    } finally {
      setImporting(null)
    }
  }

  const handleImport = async (entry) => {
    if (importing) return

    // WFS entry without a resolved typeName: fetch capabilities first
    if (entry.type === 'wfs' && !entry.typeName) {
      const picker = wfsPickers[entry.id]

      // If picker is loading, ignore double-click
      if (picker?.loading) return

      // If picker is shown and user has selected a type, proceed to import
      if (picker && !picker.loading && picker.selectedName) {
        await runImport({ ...entry, typeName: picker.selectedName })
        return
      }

      // Fetch capabilities to resolve typeName
      setWfsPickers((p) => ({
        ...p,
        [entry.id]: { loading: true, layers: [], selectedName: '' },
      }))
      setErrors((r) => { const n = { ...r }; delete n[entry.id]; return n })

      let layers
      try {
        layers = await fetchWfsCapabilities(entry.serviceUrl)
      } catch (err) {
        setWfsPickers((p) => { const n = { ...p }; delete n[entry.id]; return n })
        setErrors((r) => ({ ...r, [entry.id]: { code: err.message ?? 'caps_failed' } }))
        return
      }

      const detected = findCv05BuildingLayer(layers)
      if (detected) {
        // Auto-detected: clear picker and proceed directly
        setWfsPickers((p) => { const n = { ...p }; delete n[entry.id]; return n })
        await runImport({ ...entry, typeName: detected.name })
      } else {
        // Manual selection needed
        setWfsPickers((p) => ({
          ...p,
          [entry.id]: {
            loading: false,
            layers,
            selectedName: layers[0]?.name ?? '',
          },
        }))
      }
      return
    }

    // Geojson or WFS with typeName already set
    await runImport(entry)
  }

  const handleWfsTypeSelect = (entryId, name) => {
    setWfsPickers((p) => ({
      ...p,
      [entryId]: { ...p[entryId], selectedName: name },
    }))
  }

  return (
    <div
      className="lib-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Biblioteca de capes"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="lib-modal">
        <header className="lib-header">
          <div className="lib-header-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="5" height="12" rx="1" fill="#0f4c81" fillOpacity="0.7" />
              <rect x="9" y="2" width="5" height="12" rx="1" fill="#0f4c81" fillOpacity="0.4" />
            </svg>
            <h2>Biblioteca de capes</h2>
          </div>
          <button
            type="button"
            className="lib-close"
            onClick={onClose}
            aria-label="Tancar"
          >
            ×
          </button>
        </header>

        <div className="lib-search-bar">
          <input
            ref={searchRef}
            type="search"
            placeholder="Cercar capes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cercar en la biblioteca"
          />
        </div>

        <div className="lib-groups" role="group" aria-label="Filtrar per grup">
          <button
            type="button"
            className={`lib-group-pill${!activeGroup ? ' active' : ''}`}
            onClick={() => setActiveGroup(null)}
          >
            Totes ({catalog?.length ?? '…'})
          </button>
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              className={`lib-group-pill${activeGroup === g ? ' active' : ''}`}
              onClick={() => setActiveGroup(activeGroup === g ? null : g)}
            >
              {g} ({groupCounts[g]})
            </button>
          ))}
        </div>

        <div className="lib-list">
          {catalogError ? (
            <p className="lib-catalog-msg lib-catalog-msg--error">
              No s'ha pogut carregar el catàleg de capes.
            </p>
          ) : catalog === null ? (
            <p className="lib-catalog-msg">Carregant catàleg…</p>
          ) : filtered.length === 0 ? (
            <p className="lib-catalog-msg">Cap capa coincideix amb la cerca.</p>
          ) : (
            filtered.map((entry) => (
              <LibraryEntry
                key={entry.id}
                entry={entry}
                isImporting={importing === entry.id}
                result={results[entry.id] ?? null}
                error={errors[entry.id] ?? null}
                wfsPicker={wfsPickers[entry.id] ?? null}
                onWfsTypeSelect={(name) => handleWfsTypeSelect(entry.id, name)}
                onImport={() => handleImport(entry)}
              />
            ))
          )}
        </div>

        <footer className="lib-footer">
          <span className="lib-footer-hint">
            "Zona visible" carrega sols els elements de la zona actual del mapa.
          </span>
        </footer>
      </div>
    </div>
  )
}

export default LibraryDialog
