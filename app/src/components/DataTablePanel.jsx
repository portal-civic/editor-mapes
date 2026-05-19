import { useMemo, useState } from 'react'
import { getDatasetFeatures } from '../modules/sources/sourceStore'

const ROW_HEIGHT = 28
const DEFAULT_HEIGHT = 300
const MIN_HEIGHT = 140
const MAX_HEIGHT = 640
const TOOLBAR_H = 40
const HANDLE_H = 6
const HEAD_H = 30

export default function DataTablePanel({ layer, onClose }) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT)
  const [scrollTop, setScrollTop] = useState(0)

  const allFeatures = useMemo(() => {
    if (layer.datasetId) {
      const ds = getDatasetFeatures(layer.datasetId)
      if (ds?.length) return ds
    }
    return Array.isArray(layer.features) ? layer.features : []
  }, [layer.datasetId, layer.features])

  const fields = useMemo(() => {
    if (layer.meta?.fields?.length) {
      return layer.meta.fields.map((f) => (typeof f === 'string' ? f : String(f)))
    }
    const first = allFeatures[0]?.properties
    if (first) return Object.keys(first).slice(0, 40)
    return []
  }, [layer.meta?.fields, allFeatures])

  const rows = useMemo(() => {
    let result = allFeatures
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter((feat) => {
        const props = feat.properties ?? {}
        return Object.values(props).some(
          (v) => v != null && String(v).toLowerCase().includes(q),
        )
      })
    }
    if (sortField) {
      result = [...result].sort((a, b) => {
        const av = a.properties?.[sortField]
        const bv = b.properties?.[sortField]
        const an = Number(av)
        const bn = Number(bv)
        const isNum = av != null && bv != null && !isNaN(an) && !isNaN(bn)
        const cmp = isNum ? an - bn : String(av ?? '').localeCompare(String(bv ?? ''))
        return sortDir === 'desc' ? -cmp : cmp
      })
    }
    return result
  }, [allFeatures, search, sortField, sortDir])

  // Virtual scroll window
  const bodyHeight = Math.max(0, panelHeight - TOOLBAR_H - HANDLE_H - HEAD_H)
  const visibleCount = Math.ceil(bodyHeight / ROW_HEIGHT) + 10
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 3)
  const endIdx = Math.min(rows.length, startIdx + visibleCount)
  const topSpace = startIdx * ROW_HEIGHT
  const bottomSpace = Math.max(0, (rows.length - endIdx) * ROW_HEIGHT)

  const onResizeStart = (e) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = panelHeight
    const onMove = (ev) => {
      setPanelHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startH + (startY - ev.clientY))))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const toggleSort = (f) => {
    if (sortField === f) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(f); setSortDir('asc') }
  }

  return (
    <div className="dt-panel" style={{ height: panelHeight }}>
      <div
        className="dt-resize-handle"
        onPointerDown={onResizeStart}
        aria-hidden="true"
        title="Arrossega per redimensionar"
      />

      <div className="dt-toolbar">
        <span className="dt-layer-name">{layer.name}</span>
        <span className="dt-count">
          {search.trim()
            ? `${rows.length.toLocaleString('ca')} / ${allFeatures.length.toLocaleString('ca')} files`
            : `${allFeatures.length.toLocaleString('ca')} files · ${fields.length} camps`}
        </span>
        <input
          type="search"
          className="dt-search"
          placeholder="Cerca en totes les columnes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="dt-close-btn"
          onClick={onClose}
          aria-label="Tancar taula"
        >
          ✕
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="dt-empty">Cap camp d'atribut disponible per a aquesta capa</div>
      ) : (
        <div
          className="dt-scroll-area"
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
          <div className="dt-inner">
            {/* Sticky header */}
            <div className="dt-head">
              <div className="dt-row dt-row--head">
                <span className="dt-cell dt-cell--idx">#</span>
                {fields.map((f) => (
                  <div
                    key={f}
                    className={`dt-hcell${sortField === f ? ' dt-hcell--sorted' : ''}`}
                    onClick={() => toggleSort(f)}
                    title={`Ordenar per "${f}"`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSort(f)}
                  >
                    <span className="dt-hcell-name">{f}</span>
                    {sortField === f && (
                      <span className="dt-sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Virtual rows */}
            <div className="dt-rows-wrap">
              {topSpace > 0 && <div style={{ height: topSpace }} aria-hidden="true" />}
              {rows.slice(startIdx, endIdx).map((feat, vi) => {
                const realIdx = startIdx + vi
                const props = feat.properties ?? {}
                return (
                  <div key={feat.id ?? realIdx} className="dt-row">
                    <span className="dt-cell dt-cell--idx">{realIdx + 1}</span>
                    {fields.map((f) => (
                      <span
                        key={f}
                        className="dt-cell dt-cell--col"
                        title={props[f] != null ? String(props[f]) : ''}
                      >
                        {props[f] != null ? String(props[f]) : ''}
                      </span>
                    ))}
                  </div>
                )
              })}
              {bottomSpace > 0 && <div style={{ height: bottomSpace }} aria-hidden="true" />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
