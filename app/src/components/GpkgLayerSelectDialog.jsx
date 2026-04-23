import { useState, useMemo } from 'react'

/**
 * Multi-select dialog for choosing which GPKG layers to import.
 * Props:
 *   layers   — [{ name: string, featureCount: number }]
 *   warnings — string[]
 *   fileName — original .gpkg filename
 *   onConfirm(indices: number[]) — called with sorted selected indices
 *   onCancel()
 */
export default function GpkgLayerSelectDialog({ layers, warnings = [], fileName, onConfirm, onCancel }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => new Set(layers.map((_, i) => i)))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? layers.map((l, i) => ({ ...l, index: i })).filter((l) => l.name.toLowerCase().includes(q))
      : layers.map((l, i) => ({ ...l, index: i }))
  }, [layers, search])

  const toggleIndex = (i) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  const selectAll = () => setSelected((prev) => {
    const next = new Set(prev)
    filtered.forEach((l) => next.add(l.index))
    return next
  })

  const deselectAll = () => setSelected((prev) => {
    const next = new Set(prev)
    filtered.forEach((l) => next.delete(l.index))
    return next
  })

  const handleConfirm = () => {
    const indices = Array.from(selected).sort((a, b) => a - b)
    if (indices.length > 0) onConfirm(indices)
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog-panel dialog-panel--tall">
        <div className="dialog-header">
          <h2>Importar capes del GeoPackage</h2>
          <button type="button" onClick={onCancel} aria-label="Tancar">×</button>
        </div>

        <div className="dialog-body gpkg-body">
          <p className="dialog-file-info">
            {fileName} · <strong>{layers.length}</strong> capes trobades
          </p>

          {warnings.length > 0 && (
            <p className="source-dialog-warning">{warnings.join(' · ')}</p>
          )}

          <div className="gpkg-toolbar">
            <input
              className="gpkg-search"
              type="search"
              placeholder="Cerca capa…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" className="gpkg-sel-btn" onClick={selectAll}>Totes</button>
            <button type="button" className="gpkg-sel-btn" onClick={deselectAll}>Cap</button>
          </div>

          <div className="gpkg-layer-list">
            {filtered.length === 0 ? (
              <p className="gpkg-empty">Cap capa coincideix amb la cerca.</p>
            ) : filtered.map((layer) => (
              <label key={layer.index} className="gpkg-layer-row">
                <input
                  type="checkbox"
                  checked={selected.has(layer.index)}
                  onChange={() => toggleIndex(layer.index)}
                />
                <span className="gpkg-layer-name">{layer.name}</span>
                <span className="gpkg-layer-count">{layer.featureCount.toLocaleString()} elem.</span>
              </label>
            ))}
          </div>
        </div>

        <div className="dialog-footer">
          <span className="gpkg-selected-count">{selected.size} seleccionades</span>
          <button type="button" onClick={onCancel}>Cancel·lar</button>
          <button
            type="button"
            className="primary"
            disabled={selected.size === 0}
            onClick={handleConfirm}
          >
            Importar{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
