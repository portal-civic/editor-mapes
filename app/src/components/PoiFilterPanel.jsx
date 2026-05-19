import { useEffect, useMemo, useRef, useState } from 'react'
import {
  OSM_POI_CATEGORIES,
  OSM_POI_SUBCATEGORIES,
  getSubcategoriesForCategory,
} from '../modules/osm/osmPoiCategories'
import { getDatasetFeatures } from '../modules/sources/sourceStore'
import { isPoiFeatureVisible } from '../modules/osm/poiVisibility'

// ── Count helpers ─────────────────────────────────────────────────────────────

function computeSubcategoryCounts(layer) {
  if (!layer.datasetId) return {}
  const features = getDatasetFeatures(layer.datasetId)
  const counts = {}
  for (const f of features) {
    const subcat = f.properties?.poi_subcategory
    if (subcat) counts[subcat] = (counts[subcat] ?? 0) + 1
  }
  return counts
}

// ── Category row ──────────────────────────────────────────────────────────────

function CategoryRow({
  cat, subcats, subcatCounts,
  isSubcatVisible, onToggleCategory, onToggleSubcat,
  defaultExpanded,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const checkRef = useRef(null)

  const visibleCount = subcats.filter((s) => isSubcatVisible(s.id)).length
  const total = subcats.length
  const isChecked = visibleCount === total
  const isPartial = visibleCount > 0 && visibleCount < total
  const catCount = subcats.reduce((sum, s) => sum + (subcatCounts[s.id] ?? 0), 0)

  useEffect(() => {
    if (checkRef.current) checkRef.current.indeterminate = isPartial
  }, [isPartial])

  return (
    <div className="poi-filter-cat">
      <div className="poi-filter-cat-hdr">
        <button
          type="button"
          className="poi-filter-expand"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <input
          type="checkbox"
          ref={checkRef}
          checked={isChecked}
          onChange={(e) => onToggleCategory(cat.id, e.target.checked)}
        />
        <span className="poi-filter-cat-icon">{cat.icon}</span>
        <span className="poi-filter-cat-name">{cat.label}</span>
        {catCount > 0 && (
          <span className="poi-filter-count">{catCount.toLocaleString('ca')}</span>
        )}
      </div>

      {expanded && (
        <div className="poi-filter-subcats">
          {subcats.map((sub) => {
            const count = subcatCounts[sub.id] ?? 0
            const visible = isSubcatVisible(sub.id)
            return (
              <label key={sub.id} className="poi-filter-subcat">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => onToggleSubcat(sub.id, e.target.checked)}
                />
                <span className="poi-filter-subcat-dot" style={{ background: sub.color }} />
                <span className="poi-filter-subcat-icon">{sub.icon}</span>
                <span className="poi-filter-subcat-name">{sub.label}</span>
                {count > 0 && (
                  <span className="poi-filter-count">{count.toLocaleString('ca')}</span>
                )}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function PoiFilterPanel({ layer, onPoiVisibilityChange }) {
  const [search, setSearch] = useState('')

  const subcatCounts = useMemo(
    () => computeSubcategoryCounts(layer),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layer.datasetId],
  )

  const poiVisibility = layer.poiVisibility

  const isSubcatVisible = (subcatId) => {
    if (!poiVisibility?.subcategories) return true
    return poiVisibility.subcategories[subcatId] !== false
  }

  const toggleSubcat = (subcatId, checked) => {
    const current = poiVisibility?.subcategories ?? {}
    onPoiVisibilityChange?.(layer.id, {
      ...poiVisibility,
      subcategories: { ...current, [subcatId]: checked },
    })
  }

  const toggleCategory = (catId, checked) => {
    const subcats = getSubcategoriesForCategory(catId)
    const current = poiVisibility?.subcategories ?? {}
    const next = { ...current }
    for (const s of subcats) next[s.id] = checked
    onPoiVisibilityChange?.(layer.id, { ...poiVisibility, subcategories: next })
  }

  const showAll = () => onPoiVisibilityChange?.(layer.id, null)

  const hideAll = () => {
    const next = {}
    for (const s of OSM_POI_SUBCATEGORIES) next[s.id] = false
    onPoiVisibilityChange?.(layer.id, { subcategories: next })
  }

  const searchLower = search.toLowerCase()
  const matchesSearch = (label) => !searchLower || label.toLowerCase().includes(searchLower)

  const visibleCats = OSM_POI_CATEGORIES.filter((cat) =>
    getSubcategoriesForCategory(cat.id).some(
      (s) => matchesSearch(s.label) && (subcatCounts[s.id] ?? 0) > 0,
    ),
  )

  // Also include categories with matching search even if count = 0
  const allMatchingCats = OSM_POI_CATEGORIES.filter((cat) =>
    getSubcategoriesForCategory(cat.id).some((s) => matchesSearch(s.label)),
  )

  const displayCats = searchLower ? allMatchingCats : visibleCats

  const totalVisible = OSM_POI_SUBCATEGORIES.filter((s) => isSubcatVisible(s.id)).length
  const totalAll = OSM_POI_SUBCATEGORIES.length
  const allChecked = totalVisible === totalAll
  const noneChecked = totalVisible === 0

  return (
    <div className="poi-filter-panel">
      <div className="poi-filter-toolbar">
        <button
          type="button"
          className="poi-filter-btn"
          onClick={showAll}
          disabled={allChecked}
        >
          Mostrar totes
        </button>
        <button
          type="button"
          className="poi-filter-btn"
          onClick={hideAll}
          disabled={noneChecked}
        >
          Ocultar totes
        </button>
      </div>

      <input
        type="text"
        className="poi-filter-search"
        placeholder="Buscar subcategoria..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="poi-filter-list">
        {displayCats.length === 0 ? (
          <p className="poi-filter-empty">Cap subcategoria coincideix amb la cerca.</p>
        ) : (
          displayCats.map((cat) => {
            const subcats = getSubcategoriesForCategory(cat.id).filter((s) =>
              matchesSearch(s.label),
            )
            return (
              <CategoryRow
                key={cat.id}
                cat={cat}
                subcats={subcats}
                subcatCounts={subcatCounts}
                isSubcatVisible={isSubcatVisible}
                onToggleCategory={toggleCategory}
                onToggleSubcat={toggleSubcat}
                defaultExpanded={searchLower ? true : subcats.some((s) => (subcatCounts[s.id] ?? 0) > 0)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
