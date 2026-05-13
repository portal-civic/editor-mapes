import { useState } from 'react'

export default function CategoryEditorModal({ categories, field, onUpdateCategories, onClose }) {
  const [search, setSearch] = useState('')
  const [dragIndex, setDragIndex] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)

  const isFiltering = search.trim().length > 0
  const filtered = isFiltering
    ? categories
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => {
          const q = search.trim().toLowerCase()
          const val = c.value == null ? '' : String(c.value).toLowerCase()
          const lbl = (c.label || '').toLowerCase()
          return val.includes(q) || lbl.includes(q)
        })
    : categories.map((c, i) => ({ c, i }))

  const updateCat = (realIndex, updates) =>
    onUpdateCategories(categories.map((c, i) => (i === realIndex ? { ...c, ...updates } : c)))

  const moveCategory = (realIndex, dir) => {
    const next = [...categories]
    const t = realIndex + dir
    if (t < 0 || t >= next.length) return
    ;[next[realIndex], next[t]] = [next[t], next[realIndex]]
    onUpdateCategories(next)
  }

  const showAllLegend = () => onUpdateCategories(categories.map((c) => ({ ...c, legendVisible: true })))
  const hideAllLegend = () => onUpdateCategories(categories.map((c) => ({ ...c, legendVisible: false })))
  const syncLegendToMap = () => onUpdateCategories(categories.map((c) => ({ ...c, legendVisible: c.visible !== false })))
  const restoreAllLabels = () => onUpdateCategories(categories.map((c) => ({ ...c, label: '' })))
  const sortAlpha = () =>
    onUpdateCategories(
      [...categories].sort((a, b) =>
        String(a.label || a.value || '').localeCompare(String(b.label || b.value || '')),
      ),
    )
  const sortByCount = () =>
    onUpdateCategories([...categories].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)))

  const handleDragStart = (e, i) => {
    setDragIndex(i)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, i) => {
    e.preventDefault()
    if (i !== dropIndex) setDropIndex(i)
  }
  const handleDrop = (e, i) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== i) {
      const next = [...categories]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(i, 0, moved)
      onUpdateCategories(next)
    }
    setDragIndex(null)
    setDropIndex(null)
  }
  const handleDragEnd = () => { setDragIndex(null); setDropIndex(null) }

  return (
    <div className="dialog-overlay">
      <div className="dialog-panel catmodal-panel">
        <div className="dialog-header">
          <h2>
            Categories —{' '}
            <em className="catmodal-field">{field}</em>
            <span className="catmodal-count"> ({categories.length})</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Tancar">×</button>
        </div>

        <div className="catmodal-toolbar">
          <input
            type="search"
            className="catmodal-search"
            placeholder="Cercar per valor o etiqueta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="catmodal-quick-actions">
            <button type="button" className="cat-quick-btn" onClick={showAllLegend} title="Mostrar totes a la llegenda">✓ Llegenda</button>
            <button type="button" className="cat-quick-btn" onClick={hideAllLegend} title="Ocultar totes de la llegenda">✗ Llegenda</button>
            <button type="button" className="cat-quick-btn" onClick={syncLegendToMap} title="Llegenda = visibilitat mapa">↕ Mapa</button>
            <button type="button" className="cat-quick-btn" onClick={sortAlpha} title="Ordenar per nom alfabèticament">A→Z</button>
            <button type="button" className="cat-quick-btn" onClick={sortByCount} title="Ordenar per recompte descendent"># ↓</button>
            <button type="button" className="cat-quick-btn" onClick={restoreAllLabels} title="Restaurar tots els noms al valor tècnic">↩ Restaurar</button>
          </div>
        </div>

        <div className="catmodal-body">
          <div className="catmodal-table-wrap">
            <div className="catmodal-header-row">
              <span className="catm-col-drag" />
              <span className="catm-col-color">Color</span>
              <span className="catm-col-value">Valor tècnic</span>
              <span className="catm-col-label">Nom a la llegenda</span>
              <span className="catm-col-count">#</span>
              <span className="catm-col-vis">Mapa</span>
              <span className="catm-col-leg">Llegenda</span>
              <span className="catm-col-order" />
            </div>

            {filtered.length === 0 && (
              <p className="catmodal-empty">Cap resultat per "{search}"</p>
            )}

            {filtered.map(({ c: cat, i: realIndex }) => {
              const rowKey = cat.value == null ? '__null__' : String(cat.value)
              const isDragging = dragIndex === realIndex
              const isDropOver = dropIndex === realIndex && dragIndex !== null && dragIndex !== realIndex
              return (
                <div
                  key={rowKey}
                  className={[
                    'catmodal-row',
                    cat.visible === false ? 'catmodal-row--hidden' : '',
                    isDragging ? 'catmodal-row--dragging' : '',
                    isDropOver ? 'catmodal-row--dropover' : '',
                  ].filter(Boolean).join(' ')}
                  draggable={!isFiltering}
                  onDragStart={(e) => !isFiltering && handleDragStart(e, realIndex)}
                  onDragOver={(e) => !isFiltering && handleDragOver(e, realIndex)}
                  onDrop={(e) => !isFiltering && handleDrop(e, realIndex)}
                  onDragEnd={handleDragEnd}
                >
                  <span
                    className="catm-col-drag"
                    title={isFiltering ? 'Esborra la cerca per reordenar' : 'Arrossega per reordenar'}
                  >
                    {isFiltering ? '·' : '⠿'}
                  </span>
                  <input
                    type="color"
                    className="catm-col-color"
                    value={cat.color ?? '#888888'}
                    onChange={(e) => updateCat(realIndex, { color: e.target.value })}
                    title="Color de la categoria"
                  />
                  <span
                    className="catm-col-value"
                    title={cat.value == null ? '(buit)' : String(cat.value)}
                  >
                    {cat.value == null ? '—' : String(cat.value)}
                  </span>
                  <span className="catm-col-label-wrap">
                    <input
                      type="text"
                      className="catm-col-label"
                      value={typeof cat.label === 'string' ? cat.label : String(cat.label ?? '')}
                      onChange={(e) => updateCat(realIndex, { label: e.target.value })}
                      placeholder={cat.value == null ? '(buit)' : String(cat.value)}
                      title="Etiqueta de llegenda (buit = usa el valor tècnic)"
                    />
                    {cat.label ? (
                      <button
                        type="button"
                        className="catm-label-restore"
                        onClick={() => updateCat(realIndex, { label: '' })}
                        title="Restaurar al valor tècnic"
                      >
                        ↩
                      </button>
                    ) : null}
                  </span>
                  <span className="catm-col-count">{cat.count || ''}</span>
                  <input
                    type="checkbox"
                    className="catm-col-vis"
                    checked={cat.visible !== false}
                    onChange={(e) => updateCat(realIndex, { visible: e.target.checked })}
                    title="Visible al mapa"
                  />
                  <input
                    type="checkbox"
                    className="catm-col-leg"
                    checked={cat.legendVisible !== false}
                    onChange={(e) => updateCat(realIndex, { legendVisible: e.target.checked })}
                    title="Visible a la llegenda"
                  />
                  <span className="catm-col-order">
                    <button
                      type="button"
                      onClick={() => moveCategory(realIndex, -1)}
                      disabled={isFiltering || realIndex === 0}
                      aria-label="Pujar"
                    >↑</button>
                    <button
                      type="button"
                      onClick={() => moveCategory(realIndex, 1)}
                      disabled={isFiltering || realIndex === categories.length - 1}
                      aria-label="Baixar"
                    >↓</button>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="dialog-footer">
          <span className="catmodal-footer-info">
            {isFiltering
              ? `${filtered.length} de ${categories.length} categories`
              : `${categories.length} categories`}
          </span>
          <button type="button" className="primary" onClick={onClose}>Tancar</button>
        </div>
      </div>
    </div>
  )
}
