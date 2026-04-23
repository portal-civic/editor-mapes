import { useEffect, useMemo, useState } from 'react'
import IconPicker from './IconPicker'
import { getDatasetFeatures } from '../modules/sources/sourceStore'
import { normalizeCategory } from '../modules/sources/categoricalStyle'
import { PALETTES, PALETTE_ORDER } from '../modules/styles/palettes'

// ─── CategoricalStyleEditor ───────────────────────────────────────────────────

function CategoricalStyleEditor({ layer, onLayerCategoricalChange, onLayerLegendChange, projectPalettes = [], onManagePalettes }) {
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

      {/* Category editor list */}
      {categories.length > 0 ? (
        <div className="cat-editor-list">
          <div className="cat-editor-header">
            <span className="cat-col-color" />
            <span className="cat-col-value">Valor</span>
            <span className="cat-col-label">Etiqueta</span>
            <span className="cat-col-count" title="Features">#</span>
            <span className="cat-col-vis" title="Visible al mapa">👁</span>
            <span className="cat-col-leg" title="Visible a la llegenda">☰</span>
            <span className="cat-col-order" />
          </div>
          <div className="cat-editor-rows">
            {categories.map((cat, i) => (
              <div
                key={cat.value == null ? '__null__' : String(cat.value)}
                className={`cat-editor-row${cat.visible === false ? ' cat-editor-row--hidden' : ''}`}
              >
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
                  value={cat.label}
                  onChange={(e) => updateCat(i, { label: e.target.value })}
                  placeholder="Etiqueta…"
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
                  <button
                    type="button"
                    onClick={() => moveCategory(i, -1)}
                    disabled={i === 0}
                    aria-label="Pujar"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => moveCategory(i, 1)}
                    disabled={i === categories.length - 1}
                    aria-label="Baixar"
                  >↓</button>
                </span>
              </div>
            ))}
          </div>
        </div>
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
