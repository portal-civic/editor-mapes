import { useEffect, useMemo, useState } from 'react'
import IconPicker from './IconPicker'
import { getDatasetFeatures } from '../modules/sources/sourceStore'
import { normalizeCategory, normalizeCategoricalStyle } from '../modules/sources/categoricalStyle'
import { PALETTES, PALETTE_ORDER } from '../modules/styles/palettes'
import { suggestGvaPresets, GVA_GROUPS } from '../modules/presets/gva'
import {
  findCompatibleDictionaries,
  applyDictionaryToCategories,
  getCv05DictionaryForLayer,
  translateCv05Value,
  collectUnknownCv05Values,
} from '../modules/dictionaries'

// ─── CategoricalStyleEditor ───────────────────────────────────────────────────

function CategoricalStyleEditor({ layer, onLayerCategoricalChange, onLayerLegendChange, onFeatureOverrideChange, projectPalettes = [], onManagePalettes }) {
  const fields = layer.meta?.fields ?? []
  const categorical = layer.categorical ?? {}
  const field = categorical.field ?? ''
  const legend = layer.legend ?? {}

  // Normalize on read — migrates old { value, style: { color } } to full model
  const categories = useMemo(
    () => (categorical.categories ?? []).map(normalizeCategory),
    [categorical.categories],
  )

  const [selectedPaletteId, setSelectedPaletteId] = useState('default')
  const [showGvaPresets, setShowGvaPresets] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)

  // Sample values per field (up to 30 unique values each, from first 300 features)
  const sampleValues = useMemo(() => {
    if (!layer.datasetId) return {}
    const features = getDatasetFeatures(layer.datasetId)
    const result = {}
    for (const f of fields) {
      const vals = new Set()
      for (const feat of features.slice(0, 300)) {
        const v = feat.properties?.[f]
        if (v != null) { vals.add(String(v)); if (vals.size >= 30) break }
      }
      result[f] = Array.from(vals)
    }
    return result
  }, [layer.datasetId, fields])

  const gvaSuggestions = useMemo(
    () => suggestGvaPresets({ layerName: layer.name || '', fields, sampleValues }).slice(0, 3),
    [layer.name, fields, sampleValues],
  )

  const compatibleDicts = useMemo(() => findCompatibleDictionaries(field), [field])
  const [dictApplyResult, setDictApplyResult] = useState(null) // { dictId, translated, untranslated }

  // Reset dictionary result when field changes
  useEffect(() => { setDictApplyResult(null) }, [field])

  const cv05Dict = useMemo(
    () => getCv05DictionaryForLayer({ dictionaryId: layer.meta?.dictionaryId, fields }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layer.meta?.dictionaryId, fields.join(',')],
  )
  const [cv05FieldMode, setCv05FieldMode] = useState(cv05Dict?.preferredField ?? 'grupo')
  const [cv05ApplyResult, setCv05ApplyResult] = useState(null)

  // Reset when the detected dictionary changes (different layer loaded)
  useEffect(() => {
    setCv05FieldMode(cv05Dict?.preferredField ?? 'grupo')
    setCv05ApplyResult(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv05Dict?.id])

  // Map: raw key → category (for value distribution display)
  const categoryKeyMap = useMemo(() => {
    const m = new Map()
    for (const cat of categories) {
      m.set(cat.value == null ? '__null__' : String(cat.value), cat)
    }
    return m
  }, [categories])

  // Value distribution from the external dataset store
  const distInfo = useMemo(() => {
    if (!layer.datasetId) return null
    const features = getDatasetFeatures(layer.datasetId)
    const totalFeatures = features.length
    if (!field) return { totalFeatures, values: [] }
    const counts = new Map()
    for (const f of features) {
      const v = f.properties?.[field]
      const k = v == null ? '__null__' : String(v)
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    const values = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k, count]) => ({ k, display: k === '__null__' ? '(buit)' : k, count }))
    return { totalFeatures, values }
  }, [field, layer.datasetId])

  // First 5 features for per-feature attribute verification
  const sampleRows = useMemo(() => {
    if (!field || !layer.datasetId || !categories.length) return null
    const features = getDatasetFeatures(layer.datasetId)
    return features.slice(0, 5).map((f, i) => {
      const raw = f.properties?.[field]
      const k = raw == null ? '__null__' : String(raw)
      return { i, raw, found: categoryKeyMap.has(k) }
    })
  }, [field, layer.datasetId, categoryKeyMap, categories.length])

  const updateCategories = (next) =>
    onLayerCategoricalChange?.(layer.id, { field, categories: next })

  const updateCat = (index, updates) =>
    updateCategories(categories.map((c, i) => (i === index ? { ...c, ...updates } : c)))

  const moveCategory = (index, dir) => {
    const next = [...categories]
    const t = index + dir
    if (t < 0 || t >= next.length) return
    ;[next[index], next[t]] = [next[t], next[index]]
    updateCategories(next)
  }

  // ── Quick actions ─────────────────────────────────────────────────────────
  const hideAllLegend = () =>
    updateCategories(categories.map((c) => ({ ...c, legendVisible: false })))
  const showAllLegend = () =>
    updateCategories(categories.map((c) => ({ ...c, legendVisible: true })))
  const syncLegendToMap = () =>
    updateCategories(categories.map((c) => ({ ...c, legendVisible: c.visible !== false })))
  const sortAlpha = () =>
    updateCategories(
      [...categories].sort((a, b) =>
        String(a.label || a.value || '').localeCompare(String(b.label || b.value || '')),
      ),
    )
  const sortByCount = () =>
    updateCategories([...categories].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)))

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDragStart = (e, i) => {
    setDragIndex(i)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(i))
  }
  const handleDragOver = (e, i) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (i !== dropIndex) setDropIndex(i)
  }
  const handleDrop = (e, i) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== i) {
      const next = [...categories]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(i, 0, moved)
      updateCategories(next)
    }
    setDragIndex(null)
    setDropIndex(null)
  }
  const handleDragEnd = () => { setDragIndex(null); setDropIndex(null) }

  // ── Feature overrides helper ──────────────────────────────────────────────
  const updateOverride = (featureKey, partial) =>
    onFeatureOverrideChange?.(layer.id, featureKey, partial)

  return (
    <>
      {/* Dataset info */}
      <div className="catdiag-info">
        <span>
          {distInfo
            ? `${distInfo.totalFeatures.toLocaleString()} features al dataset`
            : 'Dataset no disponible'}
        </span>
        {fields.length > 0 ? (
          <span className="catdiag-fields-hint">
            {fields.length} camps: {fields.slice(0, 5).join(', ')}
            {fields.length > 5 ? ` +${fields.length - 5} més` : ''}
          </span>
        ) : (
          <span className="catdiag-warn">⚠ No hi ha camps (meta.fields buit)</span>
        )}
      </div>

      {/* Field selector */}
      <label>
        Camp de classificació
        <select
          value={field}
          onChange={(e) =>
            onLayerCategoricalChange?.(layer.id, { field: e.target.value, categories: [] })
          }
        >
          <option value="">— Triar camp —</option>
          {fields.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </label>

      {/* Value distribution (before and after generation) */}
      {field && distInfo && distInfo.values.length > 0 ? (
        <div className="catdiag-dist">
          <p className="catdiag-dist-title">
            Valors únics de <strong>"{field}"</strong> ({distInfo.values.length}):
          </p>
          <div className="catdiag-dist-list">
            {distInfo.values.slice(0, 30).map(({ k, display, count }) => {
              const cat = categoryKeyMap.get(k)
              return (
                <div key={k} className="catdiag-dist-row">
                  <span
                    className="catdiag-swatch"
                    style={{
                      background: cat ? (cat.color ?? '#888') : 'transparent',
                      border: cat ? 'none' : '1px dashed #c8d0db',
                    }}
                  />
                  <span className="catdiag-dist-val" title={display}>{display}</span>
                  <span className="catdiag-dist-count">{count}</span>
                </div>
              )
            })}
            {distInfo.values.length > 30 ? (
              <p className="catdiag-dist-more">…i {distInfo.values.length - 30} valors més</p>
            ) : null}
          </div>
        </div>
      ) : field && distInfo && distInfo.values.length === 0 ? (
        <p className="catdiag-warn">⚠ Cap valor trobat per "{field}"</p>
      ) : null}

      {/* CV05 dictionary suggestion — shown whenever the layer has a known CV05 dictionaryId */}
      {cv05Dict ? (() => {
        const applyField = cv05FieldMode
        const canApply = categories.length > 0 && !!applyField
        const isFichaMode = cv05FieldMode === 'ficha'
        const hasGrupo = cv05Dict.targetFields.includes('grupo')
        const hasFicha = cv05Dict.targetFields.includes('ficha')
        return (
          <div className="dict-block dict-block--cv05">
            <div className="dict-block-header">Diccionari CV05 (ICV)</div>
            <div className="dict-item">
              <div className="dict-item-top">
                <span className="dict-item-name">{cv05Dict.name}</span>
                <button
                  type="button"
                  className="dict-apply-btn"
                  disabled={!canApply}
                  title={canApply ? `Aplicar diccionari per "${applyField}"` : 'Cal generar categories primer'}
                  onClick={() => {
                    const unknown = collectUnknownCv05Values({ categories, dictionary: cv05Dict, field: applyField })
                    const translated = categories.filter((cat) => {
                      if (cat.value == null) return false
                      return translateCv05Value({ dictionary: cv05Dict, field: applyField, value: cat.value }) != null
                    }).length
                    setCv05ApplyResult({ translated, unknown })
                    onLayerCategoricalChange?.(layer.id, {
                      _applyCV05Dictionary: true,
                      dictionary: cv05Dict,
                      field: applyField,
                    })
                  }}
                >
                  Aplicar
                </button>
              </div>

              {/* Field switcher: grupo (default) / ficha (advanced) */}
              {hasGrupo && hasFicha ? (
                <div className="cv05-field-switcher">
                  <span className="cv05-switcher-label">Classificar per:</span>
                  <button
                    type="button"
                    className={`cv05-switcher-btn${cv05FieldMode === 'grupo' ? ' active' : ''}`}
                    onClick={() => { setCv05FieldMode('grupo'); setCv05ApplyResult(null) }}
                  >
                    grupo
                  </button>
                  <button
                    type="button"
                    className={`cv05-switcher-btn${cv05FieldMode === 'ficha' ? ' active' : ''}`}
                    onClick={() => { setCv05FieldMode('ficha'); setCv05ApplyResult(null) }}
                  >
                    ficha
                  </button>
                </div>
              ) : null}

              {/* Warning when ficha is selected */}
              {isFichaMode ? (
                <p className="cv05-ficha-warn">
                  Els codis <em>ficha</em> són tècnics i no representen una classificació completa.
                </p>
              ) : null}

              {/* Hint when no categories generated yet */}
              {categories.length === 0 ? (
                <p className="cv05-field-hint">
                  Genera categories per <strong>{applyField}</strong> i aplica el diccionari per obtindre noms llegibles.
                </p>
              ) : null}

              {/* Apply result */}
              {cv05ApplyResult ? (
                <>
                  <p className="dict-apply-result">
                    {cv05ApplyResult.translated} traduïdes
                    {cv05ApplyResult.unknown.length > 0
                      ? ` · ${cv05ApplyResult.unknown.length} sense traducció`
                      : ' · totes reconegudes'}
                  </p>
                  {cv05ApplyResult.unknown.length > 0 ? (
                    <p
                      className="cv05-unknown-vals"
                      title={cv05ApplyResult.unknown.join(', ')}
                    >
                      Valors pendents: {cv05ApplyResult.unknown.slice(0, 6).join(', ')}
                      {cv05ApplyResult.unknown.length > 6
                        ? ` +${cv05ApplyResult.unknown.length - 6}`
                        : ''}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        )
      })() : null}

      {/* Dictionary suggestions */}
      {field && categories.length > 0 && compatibleDicts.length > 0 && (
        <div className="dict-block">
          <div className="dict-block-header">Diccionaris de codis</div>
          {compatibleDicts.map((dict) => {
            const isApplied = dictApplyResult?.dictId === dict.id
            return (
              <div key={dict.id} className="dict-item">
                <div className="dict-item-top">
                  <span className="dict-item-name">{dict.name}</span>
                  <button
                    type="button"
                    className="dict-apply-btn"
                    onClick={() => {
                      const { translated, untranslated } = applyDictionaryToCategories(categories, dict)
                      setDictApplyResult({ dictId: dict.id, translated, untranslated })
                      onLayerCategoricalChange?.(layer.id, { _applyDictionary: true, dictionary: dict })
                    }}
                  >
                    Aplicar
                  </button>
                </div>
                <p className="dict-item-desc">{dict.description}</p>
                {isApplied && (
                  <p className="dict-apply-result">
                    {dictApplyResult.translated} traduïdes
                    {dictApplyResult.untranslated > 0
                      ? ` · ${dictApplyResult.untranslated} sense traducció`
                      : ' · totes reconegudes'}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* GVA preset suggestions */}
      {gvaSuggestions.length > 0 && (
        <div className="gva-presets-block">
          <button
            type="button"
            className="gva-presets-toggle"
            onClick={() => setShowGvaPresets((v) => !v)}
          >
            <span>Presets GVA suggerits</span>
            <span className="gva-presets-badge">{gvaSuggestions.length}</span>
            <span className="gva-presets-chevron">{showGvaPresets ? '▲' : '▼'}</span>
          </button>
          {showGvaPresets && (
            <div className="gva-presets-list">
              {gvaSuggestions.map(({ preset, score, reasons, recommendedField: recField }) => {
                const canApply = !!(recField || field)
                return (
                  <div key={preset.id} className="gva-preset-item">
                    <div className="gva-preset-top">
                      <span className="gva-preset-group-badge">
                        {GVA_GROUPS[preset.group] ?? preset.group}
                      </span>
                      <span className="gva-preset-name">{preset.name}</span>
                      {recField && (
                        <span className="gva-preset-recfield" title="Camp recomanat">
                          {recField}
                        </span>
                      )}
                    </div>
                    <p className="gva-preset-desc">{preset.description}</p>
                    <div className="gva-preset-footer">
                      <span className="gva-preset-reasons">
                        {reasons.slice(0, 2).join(' · ')}
                      </span>
                      <button
                        type="button"
                        className="gva-preset-apply-btn"
                        disabled={!canApply}
                        title={canApply ? `Aplicar "${preset.name}"` : 'Cal seleccionar un camp'}
                        onClick={() =>
                          onLayerCategoricalChange?.(layer.id, {
                            _applyPreset: true,
                            preset,
                            recommendedField: recField || field || null,
                          })
                        }
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Palette selector + generate / apply */}
      {field ? (
        <div className="cat-palette-row">
          <select
            className="cat-palette-select"
            value={selectedPaletteId}
            onChange={(e) => setSelectedPaletteId(e.target.value)}
          >
            <optgroup label="Sistema">
              {PALETTE_ORDER.map((id) => (
                <option key={id} value={id}>{PALETTES[id].name}</option>
              ))}
            </optgroup>
            {projectPalettes.length > 0 && (
              <optgroup label="Projecte">
                {projectPalettes.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            type="button"
            className="cat-palette-btn"
            title="Gestionar paletes del projecte"
            onClick={onManagePalettes}
          >⚙</button>
          <button
            type="button"
            className="cat-palette-btn"
            title="Generar categories amb aquesta paleta"
            onClick={() =>
              onLayerCategoricalChange?.(layer.id, {
                field,
                _generate: true,
                paletteId: selectedPaletteId,
              })
            }
          >
            Generar
          </button>
          {categories.length > 0 ? (
            <>
              <button
                type="button"
                className="cat-palette-btn"
                title="Aplicar paleta a les categories existents"
                onClick={() =>
                  onLayerCategoricalChange?.(layer.id, {
                    field,
                    _applyPalette: true,
                    paletteId: selectedPaletteId,
                  })
                }
              >
                Aplicar
              </button>
              <button
                type="button"
                className="cat-palette-btn"
                title="Aplicar paleta invertida"
                onClick={() =>
                  onLayerCategoricalChange?.(layer.id, {
                    field,
                    _applyPalette: true,
                    paletteId: selectedPaletteId,
                    invert: true,
                  })
                }
              >
                ⇅
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {/* Quick actions + category editor list */}
      {categories.length > 0 ? (
        <>
          <div className="cat-quick-actions">
            <button type="button" className="cat-quick-btn" onClick={showAllLegend} title="Mostrar totes a la llegenda">Mostrar</button>
            <button type="button" className="cat-quick-btn" onClick={hideAllLegend} title="Ocultar totes de la llegenda">Ocultar</button>
            <button type="button" className="cat-quick-btn" onClick={syncLegendToMap} title="Llegenda = visibilitat mapa">↕ Mapa</button>
            <button type="button" className="cat-quick-btn" onClick={sortAlpha} title="Ordenar per nom">A→Z</button>
            <button type="button" className="cat-quick-btn" onClick={sortByCount} title="Ordenar per recompte descendent"># ↓</button>
          </div>
          <div className="cat-editor-list">
            <div className="cat-editor-header">
              <span className="cat-col-drag" />
              <span className="cat-col-color" />
              <span className="cat-col-value">Valor</span>
              <span className="cat-col-label">Etiqueta</span>
              <span className="cat-col-count" title="Features">#</span>
              <span className="cat-col-vis" title="Visible al mapa">👁</span>
              <span className="cat-col-leg" title="Visible a la llegenda">☰</span>
              <span className="cat-col-order" />
            </div>
            <div className="cat-editor-rows">
              {categories.map((cat, i) => {
                const rowKey = cat.value == null ? '__null__' : String(cat.value)
                const isDragging = dragIndex === i
                const isDropOver = dropIndex === i && dragIndex !== null && dragIndex !== i
                return (
                  <div
                    key={rowKey}
                    className={[
                      'cat-editor-row',
                      cat.visible === false ? 'cat-editor-row--hidden' : '',
                      isDragging ? 'cat-editor-row--dragging' : '',
                      isDropOver ? 'cat-editor-row--dropover' : '',
                    ].filter(Boolean).join(' ')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={(e) => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="cat-col-drag" title="Arrossega per reordenar">⠿</span>
                    <input
                      type="color"
                      className="cat-col-color"
                      value={cat.color ?? '#888888'}
                      onChange={(e) => updateCat(i, { color: e.target.value })}
                      title="Color principal"
                    />
                    <span
                      className="cat-col-value"
                      title={cat.value == null ? '(buit)' : String(cat.value)}
                    >
                      {cat.value == null ? '—' : String(cat.value)}
                    </span>
                    <input
                      type="text"
                      className="cat-col-label"
                      value={typeof cat.label === 'string' ? cat.label : String(cat.label ?? '')}
                      onChange={(e) => updateCat(i, { label: e.target.value })}
                      placeholder={cat.value == null ? '(buit)' : String(cat.value)}
                    />
                    <span className="cat-col-count">{cat.count || ''}</span>
                    <input
                      type="checkbox"
                      className="cat-col-vis"
                      checked={cat.visible !== false}
                      onChange={(e) => updateCat(i, { visible: e.target.checked })}
                      title="Visible al mapa"
                    />
                    <input
                      type="checkbox"
                      className="cat-col-leg"
                      checked={cat.legendVisible !== false}
                      onChange={(e) => updateCat(i, { legendVisible: e.target.checked })}
                      title="Visible a la llegenda"
                    />
                    <span className="cat-col-order">
                      <button type="button" onClick={() => moveCategory(i, -1)} disabled={i === 0} aria-label="Pujar">↑</button>
                      <button type="button" onClick={() => moveCategory(i, 1)} disabled={i === categories.length - 1} aria-label="Baixar">↓</button>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : null}

      {/* Per-feature sample verification */}
      {sampleRows && sampleRows.length > 0 ? (
        <div className="catdiag-sample">
          <p className="catdiag-dist-title">Verificació feature↔categoria:</p>
          {sampleRows.map(({ i, raw, found }) => (
            <div key={i} className="catdiag-sample-row">
              <span className="catdiag-sample-idx">[{i}]</span>
              <code className="catdiag-sample-val">
                {raw == null ? 'null' : JSON.stringify(raw)}
              </code>
              <span className={found ? 'catdiag-ok' : 'catdiag-miss'}>
                {found ? '✓' : '✗ sense categoria'}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Global categorical style */}
      {categories.length > 0 ? (() => {
        const cs = normalizeCategoricalStyle(layer.categorical?.categoricalStyle)
        const updateCs = (patch) =>
          onLayerCategoricalChange?.(layer.id, {
            _updateCatStyle: true,
            categoricalStyle: { ...cs, ...patch },
          })
        return (
          <div className="cat-global-style">
            <p className="catdiag-dist-title">Estil global de categories</p>
            <label className="cat-gs-row">
              <span>Opacitat farcit</span>
              <input
                type="range" min="0" max="1" step="0.05"
                value={cs.fillOpacity}
                onChange={(e) => updateCs({ fillOpacity: Number(e.target.value) })}
              />
              <span className="cat-gs-val">{Math.round(cs.fillOpacity * 100)}%</span>
            </label>
            <label className="cat-gs-row">
              <span>Contorn</span>
              <select
                value={cs.strokeMode}
                onChange={(e) => updateCs({ strokeMode: e.target.value })}
              >
                <option value="category">Color de categoria</option>
                <option value="fixed">Color fix</option>
              </select>
            </label>
            {cs.strokeMode === 'fixed' ? (
              <label className="cat-gs-row">
                <span>Color contorn fix</span>
                <input
                  type="color"
                  value={cs.fixedStrokeColor}
                  onChange={(e) => updateCs({ fixedStrokeColor: e.target.value })}
                />
              </label>
            ) : null}
            <label className="cat-gs-row">
              <span>Opacitat contorn</span>
              <input
                type="range" min="0" max="1" step="0.05"
                value={cs.strokeOpacity}
                onChange={(e) => updateCs({ strokeOpacity: Number(e.target.value) })}
              />
              <span className="cat-gs-val">{Math.round(cs.strokeOpacity * 100)}%</span>
            </label>
            <label className="cat-gs-row">
              <span>Amplada contorn</span>
              <input
                type="number" min="0" max="20" step="0.5"
                value={cs.strokeWidth}
                onChange={(e) => updateCs({ strokeWidth: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="cat-gs-row">
              <span>Estil línia</span>
              <select
                value={cs.dashStyle}
                onChange={(e) => updateCs({ dashStyle: e.target.value })}
              >
                <option value="solid">Contínua</option>
                <option value="dashed">Discontínua</option>
                <option value="dotted">Puntejada</option>
              </select>
            </label>
          </div>
        )
      })() : null}

      {/* Legend settings */}
      {categories.length > 0 ? (
        <div className="cat-legend-section">
          <p className="catdiag-dist-title">Llegenda</p>
          <label className="cat-legend-row">
            Títol
            <input
              type="text"
              value={legend.title ?? ''}
              onChange={(e) => onLayerLegendChange?.(layer.id, { title: e.target.value })}
              placeholder="Títol de la llegenda…"
            />
          </label>
          <label className="cat-legend-row cat-legend-row--check">
            <input
              type="checkbox"
              checked={legend.showCounts !== false}
              onChange={(e) => onLayerLegendChange?.(layer.id, { showCounts: e.target.checked })}
            />
            Mostrar recomptes
          </label>
          <label className="cat-legend-row">
            Ordre
            <select
              value={legend.orderMode ?? 'manual'}
              onChange={(e) => onLayerLegendChange?.(layer.id, { orderMode: e.target.value })}
            >
              <option value="manual">Manual</option>
              <option value="alpha">Alfabètic</option>
              <option value="count">Per recompte</option>
            </select>
          </label>
          <label className="cat-legend-row cat-legend-row--check">
            <input
              type="checkbox"
              checked={legend.visible !== false}
              onChange={(e) => onLayerLegendChange?.(layer.id, { visible: e.target.checked })}
            />
            Visible en exportació
          </label>

          <div className="cat-legend-threshold">
            <label className="cat-legend-row cat-legend-threshold-row">
              Ocultar si menys de
              <input
                type="number"
                min="0"
                step="1"
                value={legend.hideMinCount ?? 0}
                onChange={(e) =>
                  onLayerLegendChange?.(layer.id, { hideMinCount: Math.max(0, Number(e.target.value) || 0) })
                }
              />
              elements
            </label>
            <label className="cat-legend-row cat-legend-row--check">
              <input
                type="checkbox"
                checked={legend.groupSmallCategories === true}
                disabled={!(legend.hideMinCount > 0)}
                onChange={(e) =>
                  onLayerLegendChange?.(layer.id, { groupSmallCategories: e.target.checked })
                }
              />
              Agrupar-les com a «Altres»
            </label>
          </div>

          {/* Elements destacats (feature overrides) */}
          {Object.keys(layer.featureOverrides ?? {}).length > 0 && (
            <div className="cat-overrides-section">
              <p className="catdiag-dist-title">Elements destacats</p>
              {Object.entries(layer.featureOverrides).map(([fk, ov]) => {
                if (!ov) return null
                const shortKey = fk.length > 14 ? `…${fk.slice(-12)}` : fk
                return (
                  <div key={fk} className="cat-override-row">
                    <span
                      className="cat-override-swatch"
                      style={{ background: ov.fillColor || '#888' }}
                      title={fk}
                    />
                    <span className="cat-override-key" title={fk}>{shortKey}</span>
                    <input
                      type="checkbox"
                      className="cat-col-leg"
                      checked={ov.showInLegend === true}
                      onChange={(e) => updateOverride(fk, { showInLegend: e.target.checked })}
                      title="Visible a la llegenda"
                    />
                    <input
                      type="text"
                      className="cat-override-label"
                      value={ov.legendLabel || ''}
                      placeholder="Etiqueta…"
                      onChange={(e) => updateOverride(fk, { legendLabel: e.target.value })}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolvePointSize(style, defaultSize) {
  if (style?.size != null) return Number(style.size)
  if (style?.radius != null) return Number(style.radius) * 2
  return defaultSize
}

function GeomSymbol({ type, color, size = 16 }) {
  if (type === 'point') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="5" fill={color} />
      </svg>
    )
  }
  if (type === 'line') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <line x1="2" y1="13" x2="14" y2="3" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (type === 'polygon') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <polygon
          points="8,2 14,13 2,13"
          fill={color}
          fillOpacity="0.45"
          stroke={color}
          strokeWidth="1.5"
        />
      </svg>
    )
  }
  return null
}

// ─── LayerInspector ───────────────────────────────────────────────────────────

function LayerInspector({
  layer,
  layerIndex,
  totalLayers,
  groups = [],
  focusMask = null,
  onRenameLayer,
  onLayerStyleChange,
  onLayerStyleModeChange,
  onLayerCategoricalChange,
  onLayerLegendChange,
  onFeatureOverrideChange,
  projectPalettes = [],
  onManagePalettes,
  onMoveLayerUp,
  onMoveLayerDown,
  onExportLayerGeoJSON,
  onExportLayerSVG,
  onExportLayerHybrid,
  onDeleteLayer,
  onSetLayerGroup,
  onToggleLayerInMask,
  onMaskOpacityChange,
  onMaskColorChange,
}) {
  const [nameValue, setNameValue] = useState(layer.name)
  const layerStyle = layer.style || {}
  const featureCount = Array.isArray(layer.features) ? layer.features.length : 0
  const geomLabel =
    layer.geometryType === 'point'
      ? 'Punts'
      : layer.geometryType === 'line'
        ? 'Línies'
        : 'Polígons'

  const symbolColor =
    layer.geometryType === 'point'
      ? layerStyle.fillColor || layer.color
      : layer.geometryType === 'line'
        ? layerStyle.color || layer.color
        : layerStyle.fillColor || layer.color

  useEffect(() => {
    setNameValue(layer.name)
  }, [layer.name])

  const commitName = () => {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== layer.name) {
      onRenameLayer?.(layer.id, trimmed)
    } else {
      setNameValue(layer.name)
    }
  }

  return (
    <aside className="panel panel-right">
      <div className="panel-header">
        <h2>Propietats</h2>
        <span className="inspector-geom-symbol">
          <GeomSymbol type={layer.geometryType} color={symbolColor} size={14} />
        </span>
      </div>

      <div className="inspector-content">
        <div className="inspector-section inspector-identity">
          <input
            className="layer-props-name-input"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') {
                setNameValue(layer.name)
                e.currentTarget.blur()
              }
            }}
            aria-label="Nom de la capa"
          />
          <p className="layer-props-meta">
            {geomLabel} · {featureCount} {featureCount === 1 ? 'element' : 'elements'}
          </p>
          {groups.length > 0 ? (
            <label className="layer-group-select-label">
              Grup
              <select
                value={layer.groupId ?? ''}
                onChange={(e) => onSetLayerGroup?.(layer.id, e.target.value || null)}
              >
                <option value="">— Cap grup —</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {/* Estil section */}
        <div className="inspector-section">
          <p className="inspector-section-title">Estil</p>

          {/* Mode selector — only for source layers */}
          {layer.type === 'source' ? (
            <div className="layer-style-editor">
              <label>
                Mode d'estil
                <select
                  value={layer.styleMode ?? 'single'}
                  onChange={(e) => onLayerStyleModeChange?.(layer.id, e.target.value)}
                >
                  <option value="single">Estil únic</option>
                  <option value="categorical">Per atribut</option>
                </select>
              </label>
            </div>
          ) : null}

          {/* Categorical editor or single-style editor */}
          {layer.styleMode === 'categorical' ? (
            <div className="layer-style-editor">
              <CategoricalStyleEditor
                layer={layer}
                onLayerCategoricalChange={onLayerCategoricalChange}
                onLayerLegendChange={onLayerLegendChange}
                onFeatureOverrideChange={onFeatureOverrideChange}
                projectPalettes={projectPalettes}
                onManagePalettes={onManagePalettes}
              />
            </div>
          ) : (
            <div className="layer-style-editor">
              {layer.geometryType === 'point' ? (
                <>
                  <label>
                    Tipus de marcador
                    <select
                      value={layerStyle.markerType ?? 'circle'}
                      onChange={(e) => {
                        const nextType = e.target.value
                        if (nextType === 'icon-circle') {
                          onLayerStyleChange?.(layer.id, {
                            markerType: 'icon-circle',
                            size: 40,
                            strokeColor: '#ffffff',
                            strokeWidth: 3,
                            iconColor: '#ffffff',
                          })
                        } else {
                          onLayerStyleChange?.(layer.id, { markerType: nextType })
                        }
                      }}
                    >
                      <option value="circle">Cercle</option>
                      <option value="icon-circle">Cercle amb icona</option>
                    </select>
                  </label>

                  {(layerStyle.markerType ?? 'circle') === 'icon-circle' ? (
                    <>
                      <p className="icon-picker-label">Icona</p>
                      <IconPicker
                        selectedIconId={layerStyle.icon ?? null}
                        onSelect={(iconId) =>
                          onLayerStyleChange?.(layer.id, { icon: iconId, iconSet: 'fa' })
                        }
                      />
                      <label>
                        Color icona
                        <input
                          type="color"
                          value={layerStyle.iconColor ?? '#ffffff'}
                          onChange={(e) =>
                            onLayerStyleChange?.(layer.id, { iconColor: e.target.value })
                          }
                        />
                      </label>
                    </>
                  ) : null}

                  <label>
                    Mida
                    <input
                      type="number"
                      min="6"
                      max="60"
                      value={resolvePointSize(layerStyle, (layerStyle.markerType ?? 'circle') === 'icon-circle' ? 28 : 14)}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { size: Number(e.target.value) || 14 })
                      }
                    />
                  </label>
                  <label>
                    Color interior
                    <input
                      type="color"
                      value={layerStyle.fillColor ?? '#d4335b'}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { fillColor: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Opacitat interior
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layerStyle.fillOpacity ?? 0.9}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { fillOpacity: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Color contorn
                    <input
                      type="color"
                      value={layerStyle.strokeColor ?? '#d4335b'}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { strokeColor: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Gruix contorn
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={layerStyle.strokeWidth ?? 2}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { strokeWidth: Number(e.target.value) || 0 })
                      }
                    />
                  </label>
                  <label>
                    Opacitat contorn
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layerStyle.strokeOpacity ?? 1}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { strokeOpacity: Number(e.target.value) })
                      }
                    />
                  </label>
                </>
              ) : null}

              {layer.geometryType === 'line' ? (
                <>
                  <label>
                    Color
                    <input
                      type="color"
                      value={layerStyle.color ?? '#ea8b1f'}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { color: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Gruix
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={layerStyle.width ?? 3}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { width: Number(e.target.value) || 1 })
                      }
                    />
                  </label>
                  <label>
                    Opacitat
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layerStyle.opacity ?? 1}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { opacity: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Tipus de línia
                    <select
                      value={layerStyle.dashStyle ?? 'solid'}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { dashStyle: e.target.value })
                      }
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </label>
                </>
              ) : null}

              {layer.geometryType === 'polygon' ? (
                <>
                  <label>
                    Color vora
                    <input
                      type="color"
                      value={layerStyle.strokeColor ?? '#2f7de1'}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { strokeColor: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Gruix vora
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={layerStyle.strokeWidth ?? 2}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { strokeWidth: Number(e.target.value) || 0 })
                      }
                    />
                  </label>
                  <label>
                    Opacitat vora
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layerStyle.strokeOpacity ?? 1}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { strokeOpacity: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Color interior
                    <input
                      type="color"
                      value={layerStyle.fillColor ?? '#2f7de1'}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { fillColor: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Opacitat interior
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layerStyle.fillOpacity ?? 0.18}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { fillOpacity: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Tipus de vora
                    <select
                      value={layerStyle.dashStyle ?? 'solid'}
                      onChange={(e) =>
                        onLayerStyleChange?.(layer.id, { dashStyle: e.target.value })
                      }
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </label>
                </>
              ) : null}
            </div>
          )}
        </div>

        <div className="inspector-section">
          <p className="inspector-section-title">Llegenda</p>
          <label>
            Nom en llegenda
            <input
              type="text"
              value={layer.legend?.title ?? ''}
              onChange={(e) => onLayerLegendChange?.(layer.id, { title: e.target.value })}
              placeholder={layer.name}
            />
          </label>
        </div>

        {layer.geometryType === 'polygon' ? (
          <div className="inspector-section">
            <p className="inspector-section-title">Màscara exterior</p>
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={focusMask?.layerIds?.includes(layer.id) ?? false}
                onChange={(e) => onToggleLayerInMask?.(layer.id, e.target.checked)}
              />
              <span>Inclou en la màscara</span>
            </label>
            {focusMask?.layerIds?.length > 0 ? (
              <>
                <label>
                  Opacitat
                  <input
                    type="range"
                    min={0.05}
                    max={0.95}
                    step={0.05}
                    value={focusMask.opacity ?? 0.7}
                    onChange={(e) => onMaskOpacityChange?.(Number(e.target.value))}
                  />
                </label>
                <label>
                  Color de la màscara
                  <input
                    type="color"
                    value={focusMask.color ?? '#ffffff'}
                    onChange={(e) => onMaskColorChange?.(e.target.value)}
                  />
                </label>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="inspector-section">
          <p className="inspector-section-title">Accions</p>
          <div className="layer-props-actions">
            <div className="layer-props-actions-row">
              <button
                type="button"
                disabled={layerIndex === 0}
                onClick={() => onMoveLayerUp?.(layer.id)}
              >
                ↑ Pujar
              </button>
              <button
                type="button"
                disabled={layerIndex === totalLayers - 1}
                onClick={() => onMoveLayerDown?.(layer.id)}
              >
                ↓ Baixar
              </button>
            </div>
            <button type="button" onClick={() => onExportLayerGeoJSON?.(layer.id)}>
              Exportar GeoJSON
            </button>
            <button type="button" onClick={() => onExportLayerSVG?.(layer.id)}>
              Exportar SVG (prova)
            </button>
            {layer.geometryType === 'point' ? (
              <button type="button" onClick={() => onExportLayerHybrid?.(layer.id)}>
                Exportar PNG + SVG (prova)
              </button>
            ) : null}
            <button
              type="button"
              className="btn-danger-layer"
              onClick={() => onDeleteLayer?.(layer.id)}
            >
              Eliminar capa
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default LayerInspector
