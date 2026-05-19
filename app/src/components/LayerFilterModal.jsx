import { useMemo, useState } from 'react'
import { getDatasetFeatures } from '../modules/sources/sourceStore'
import {
  defaultFilters,
  featurePassesFilters,
  getFieldStats,
  OPERATORS,
} from '../modules/filters/layerFilters'
import {
  OSM_POI_CATEGORIES,
  OSM_POI_SUBCATEGORIES,
  getSubcategoriesForCategory,
} from '../modules/osm/osmPoiCategories'

// ── helpers ───────────────────────────────────────────────────────────────────

let _ruleCounter = 0
function newRuleId() { return `r${++_ruleCounter}` }

function makeRule(field = '') {
  return { id: newRuleId(), field, operator: 'eq', value: '', value2: '' }
}

// ── FieldExplorer ─────────────────────────────────────────────────────────────

function FieldExplorer({ features, fields, onInsertValue }) {
  const [explorerField, setExplorerField] = useState(fields[0]?.name ?? '')

  const stats = useMemo(() => {
    if (!explorerField || !features.length) return null
    return getFieldStats(features, explorerField)
  }, [features, explorerField])

  const maxCount = stats?.topValues[0]?.count ?? 1

  return (
    <div className="lf-explorer">
      <p className="lf-explorer-title">Explorador de valors</p>
      <select
        className="lf-explorer-field-sel"
        value={explorerField}
        onChange={(e) => setExplorerField(e.target.value)}
      >
        {fields.map((f) => (
          <option key={f.name} value={f.name}>{f.name}</option>
        ))}
      </select>

      {stats && (
        <>
          <div className="lf-explorer-meta">
            <span>{stats.unique} valors únics</span>
            {stats.nullCount > 0 && <span>{stats.nullCount} buits</span>}
            {stats.isNumeric && <span>numèric</span>}
          </div>

          <div className="lf-explorer-vals">
            {stats.topValues.map(({ val, count }) => (
              <div key={val} className="lf-explorer-row">
                <button
                  type="button"
                  className="lf-explorer-val-btn"
                  title="Inserir a la regla activa"
                  onClick={() => onInsertValue?.(explorerField, val)}
                >
                  {val}
                </button>
                <div className="lf-explorer-bar-wrap">
                  <div
                    className="lf-explorer-bar"
                    style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="lf-explorer-count">{count}</span>
              </div>
            ))}
            {stats.hasMore && (
              <p className="lf-explorer-more">+ més valors…</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── RuleRow ───────────────────────────────────────────────────────────────────

function RuleRow({ rule, fields, onUpdate, onDelete, onFocus, isActive }) {
  const op = OPERATORS.find((o) => o.id === rule.operator) ?? OPERATORS[0]

  return (
    <div
      className={`lf-rule-row${isActive ? ' lf-rule-row--active' : ''}`}
      onClick={onFocus}
    >
      <select
        className="lf-rule-field"
        value={rule.field}
        onChange={(e) => onUpdate({ field: e.target.value })}
      >
        <option value="">— camp —</option>
        {fields.map((f) => (
          <option key={f.name} value={f.name}>{f.name}</option>
        ))}
      </select>

      <select
        className="lf-rule-op"
        value={rule.operator}
        onChange={(e) => onUpdate({ operator: e.target.value, value: '', value2: '' })}
      >
        {OPERATORS.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>

      {op.needsValue && (
        <input
          className="lf-rule-val"
          type={op.isNumeric && !op.needsValue2 ? 'number' : 'text'}
          placeholder={op.needsValue2 ? 'de…' : 'valor'}
          value={rule.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
        />
      )}

      {op.needsValue2 && (
        <input
          className="lf-rule-val lf-rule-val2"
          type="number"
          placeholder="fins…"
          value={rule.value2 ?? ''}
          onChange={(e) => onUpdate({ value2: e.target.value })}
        />
      )}

      <button
        type="button"
        className="lf-rule-del"
        title="Eliminar regla"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
      >
        ×
      </button>
    </div>
  )
}

// ── PoiTab ────────────────────────────────────────────────────────────────────

function PoiTab({ features, onApply }) {
  const [selected, setSelected] = useState(() => {
    const s = new Set()
    OSM_POI_SUBCATEGORIES.forEach((sub) => s.add(sub.id))
    return s
  })

  const subcatCounts = useMemo(() => {
    const m = new Map()
    for (const f of features) {
      const sub = f?.properties?.poi_subcategory
      if (sub) m.set(sub, (m.get(sub) ?? 0) + 1)
    }
    return m
  }, [features])

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleCat = (catId) => {
    const subcats = getSubcategoriesForCategory(catId)
    const allOn = subcats.every((s) => selected.has(s.id))
    setSelected((prev) => {
      const next = new Set(prev)
      subcats.forEach((s) => (allOn ? next.delete(s.id) : next.add(s.id)))
      return next
    })
  }

  const totalSelected = [...subcatCounts.keys()].filter((id) => selected.has(id))
    .reduce((sum, id) => sum + (subcatCounts.get(id) ?? 0), 0)
  const totalAll = [...subcatCounts.values()].reduce((a, b) => a + b, 0)

  const handleApply = () => {
    const allSubcatIds = OSM_POI_SUBCATEGORIES.map((s) => s.id)
    const allSelected = allSubcatIds.every((id) => selected.has(id))
    if (allSelected) {
      onApply([])
    } else {
      const val = [...selected].join(',')
      onApply([{ id: newRuleId(), field: 'poi_subcategory', operator: 'in', value: val, value2: '' }])
    }
  }

  return (
    <div className="lf-poi-tab">
      <p className="lf-poi-summary">
        {totalSelected} / {totalAll} elements visibles
      </p>

      {OSM_POI_CATEGORIES.map((cat) => {
        const subcats = getSubcategoriesForCategory(cat.id).filter(
          (s) => (subcatCounts.get(s.id) ?? 0) > 0
        )
        if (subcats.length === 0) return null
        const allOn = subcats.every((s) => selected.has(s.id))
        const anyOn = subcats.some((s) => selected.has(s.id))

        return (
          <div key={cat.id} className="lf-poi-cat">
            <label className="lf-poi-cat-hdr">
              <input
                type="checkbox"
                checked={allOn}
                ref={(node) => { if (node) node.indeterminate = !allOn && anyOn }}
                onChange={() => toggleCat(cat.id)}
              />
              <span className="lf-poi-cat-icon">{cat.icon}</span>
              <span className="lf-poi-cat-name">{cat.label}</span>
            </label>
            <div className="lf-poi-subcats">
              {subcats.map((sub) => (
                <label key={sub.id} className="lf-poi-subcat">
                  <input
                    type="checkbox"
                    checked={selected.has(sub.id)}
                    onChange={() => toggle(sub.id)}
                  />
                  <span className="lf-poi-subcat-dot" style={{ background: sub.color }} />
                  <span className="lf-poi-subcat-name">{sub.label}</span>
                  <span className="lf-poi-subcat-count">{subcatCounts.get(sub.id) ?? 0}</span>
                </label>
              ))}
            </div>
          </div>
        )
      })}

      <button type="button" className="lf-btn lf-btn--primary lf-poi-apply" onClick={handleApply}>
        Aplicar selecció com a filtre
      </button>
    </div>
  )
}

// ── LayerFilterModal ──────────────────────────────────────────────────────────

export default function LayerFilterModal({ layer, onFilterChange, onClose }) {
  const allFeatures = useMemo(
    () => getDatasetFeatures(layer.datasetId) ?? [],
    [layer.datasetId],
  )

  const [local, setLocal] = useState(() => ({
    ...(layer.filters ?? defaultFilters()),
    rules: (layer.filters?.rules ?? []).map((r) => ({ ...r })),
  }))
  const [activeTab, setActiveTab] = useState('general')
  const [activeRuleId, setActiveRuleId] = useState(null)

  const fields = useMemo(() => layer.meta?.fields ?? [], [layer.meta])

  const previewCount = useMemo(
    () => allFeatures.filter((f) => featurePassesFilters(f, local)).length,
    [allFeatures, local],
  )

  const updateRule = (id, patch) =>
    setLocal((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))

  const deleteRule = (id) =>
    setLocal((prev) => ({ ...prev, rules: prev.rules.filter((r) => r.id !== id) }))

  const addRule = () => {
    const rule = makeRule(fields[0]?.name ?? '')
    setLocal((prev) => ({ ...prev, rules: [...prev.rules, rule] }))
    setActiveRuleId(rule.id)
  }

  const handleInsertValue = (fieldName, val) => {
    if (!activeRuleId) return
    updateRule(activeRuleId, { field: fieldName, value: val })
  }

  const handleApply = () => {
    onFilterChange?.(layer.id, local)
    onClose?.()
  }

  const handleClear = () => {
    const cleared = defaultFilters()
    setLocal(cleared)
    onFilterChange?.(layer.id, cleared)
  }

  const handlePoiApply = (rules) => {
    const next = { ...local, enabled: rules.length > 0, rules }
    setLocal(next)
    setActiveTab('general')
  }

  const isPoi = layer.poiConfig != null
  const pct = allFeatures.length > 0
    ? Math.round((previewCount / allFeatures.length) * 100)
    : 0

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="lf-modal">
        {/* ── Header ── */}
        <div className="lf-header">
          <span className="lf-title">Filtrar dades — {layer.name}</span>
          <button type="button" className="sovlay-close" onClick={onClose} aria-label="Tancar">✕</button>
        </div>

        {/* ── Summary bar ── */}
        <div className="lf-summary">
          <label className="lf-enable-toggle">
            <input
              type="checkbox"
              checked={local.enabled}
              onChange={(e) => setLocal((p) => ({ ...p, enabled: e.target.checked }))}
            />
            Filtre activat
          </label>
          <div className="lf-summary-count">
            <span className="lf-summary-n">{previewCount.toLocaleString('ca')}</span>
            <span className="lf-summary-sep"> / </span>
            <span>{allFeatures.length.toLocaleString('ca')} elements</span>
            <span className="lf-summary-pct">({pct}%)</span>
          </div>
          {local.rules.length > 1 && (
            <label className="lf-logic-toggle">
              Lògica
              <select
                value={local.logic}
                onChange={(e) => setLocal((p) => ({ ...p, logic: e.target.value }))}
              >
                <option value="AND">AND (totes)</option>
                <option value="OR">OR (alguna)</option>
              </select>
            </label>
          )}
        </div>

        {/* ── Tabs ── */}
        {isPoi && (
          <div className="lf-tabs">
            <button
              type="button"
              className={`lf-tab${activeTab === 'general' ? ' lf-tab--active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              Regles generals
            </button>
            <button
              type="button"
              className={`lf-tab${activeTab === 'poi' ? ' lf-tab--active' : ''}`}
              onClick={() => setActiveTab('poi')}
            >
              Categories de punts d'interès
            </button>
          </div>
        )}

        {/* ── Body ── */}
        <div className="lf-body">
          {activeTab === 'general' && (
            <>
              {/* Left: rules */}
              <div className="lf-rules-col">
                <div className="lf-rules-list">
                  {local.rules.length === 0 && (
                    <p className="lf-rules-empty">Cap regla definida. Afegiu-ne una o useu la pestanya de categories.</p>
                  )}
                  {local.rules.map((rule) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      fields={fields}
                      isActive={activeRuleId === rule.id}
                      onFocus={() => setActiveRuleId(rule.id)}
                      onUpdate={(patch) => updateRule(rule.id, patch)}
                      onDelete={() => deleteRule(rule.id)}
                    />
                  ))}
                </div>
                <button type="button" className="lf-add-rule" onClick={addRule}>
                  + Afegir regla
                </button>
              </div>

              {/* Right: field explorer */}
              {fields.length > 0 && (
                <FieldExplorer
                  features={allFeatures}
                  fields={fields}
                  onInsertValue={handleInsertValue}
                />
              )}
            </>
          )}

          {activeTab === 'poi' && (
            <PoiTab features={allFeatures} onApply={handlePoiApply} />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="lf-footer">
          <button type="button" className="lf-btn lf-btn--danger" onClick={handleClear}>
            Netejar filtres
          </button>
          <div className="lf-footer-right">
            <button type="button" className="lf-btn" onClick={onClose}>
              Tancar
            </button>
            <button type="button" className="lf-btn lf-btn--primary" onClick={handleApply}>
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
