import { useEffect, useRef, useState } from 'react'

// ─── Icons ───────────────────────────────────────────────────────────────────

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M1.5 8C3 4.5 13 4.5 14.5 8C13 11.5 3 11.5 1.5 8Z" />
        <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1.5 8C3 4.5 13 4.5 14.5 8C13 11.5 3 11.5 1.5 8Z" opacity="0.4" />
      <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" opacity="0.4" />
      <line x1="3" y1="13" x2="13" y2="3" />
    </svg>
  )
}

// Returns SVG dasharray string for a given dashStyle
function dashArray(dashStyle) {
  if (dashStyle === 'dashed') return '5,4'
  if (dashStyle === 'dotted') return '1.5,4'
  return null
}

// Rich layer symbol using actual style properties
function LayerSymbol({ layer, size = 16 }) {
  const geom = layer.geometryType
  const st = layer.style || {}

  if (geom === 'point') {
    const fill = st.fillColor || layer.color || '#888'
    const stroke = st.strokeColor || fill
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="5" fill={fill} fillOpacity={st.fillOpacity ?? 0.9} stroke={stroke} strokeWidth="1.5" />
      </svg>
    )
  }

  if (geom === 'line') {
    const color = st.color || layer.color || '#888'
    const da = dashArray(st.dashStyle)
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <line x1="2" y1="13" x2="14" y2="3" stroke={color} strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={da || undefined} />
      </svg>
    )
  }

  if (geom === 'polygon') {
    const fill = st.fillColor || layer.color || '#888'
    const stroke = st.strokeColor || fill
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <polygon
          points="8,2 14,13 2,13"
          fill={fill}
          fillOpacity={st.fillOpacity ?? 0.18}
          stroke={stroke}
          strokeWidth={Math.min(st.strokeWidth ?? 2, 3)}
        />
      </svg>
    )
  }

  // Categorical/source: use first category color if available
  if (layer.styleMode === 'categorical' && layer.categorical?.categories?.length > 0) {
    const firstCat = layer.categorical.categories[0]
    const color = firstCat.fillColor || firstCat.color || layer.color || '#888'
    const cs = layer.categorical.categoricalStyle || {}
    if (layer.geometryType === 'line') {
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
          <line x1="2" y1="13" x2="14" y2="3" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    }
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        <polygon points="8,2 14,13 2,13" fill={color} fillOpacity={cs.fillOpacity ?? 0.5} stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }

  return null
}

// ─── Group layer management modal ─────────────────────────────────────────────

function GroupLayerModal({ group, layers, onClose, onSetLayerGroup }) {
  const handleToggle = (layerId, checked) => {
    onSetLayerGroup?.(layerId, checked ? group.id : undefined)
  }

  const vectorLayers = layers.filter(
    (l) => l.geometryType === 'point' || l.geometryType === 'line' || l.geometryType === 'polygon',
  )

  return (
    <div className="group-modal-backdrop" onMouseDown={onClose}>
      <div className="group-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="group-modal-header">
          <span>Capes del grup "{group.name}"</span>
          <button type="button" className="group-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="group-modal-body">
          {vectorLayers.length === 0 ? (
            <p className="group-modal-empty">No hi ha capes vectorials</p>
          ) : (
            vectorLayers.map((layer) => {
              const inThisGroup = layer.groupId === group.id
              const inOtherGroup = layer.groupId && layer.groupId !== group.id
              return (
                <label key={layer.id} className={`group-modal-row${inOtherGroup ? ' group-modal-row--other' : ''}`}>
                  <input
                    type="checkbox"
                    checked={inThisGroup}
                    disabled={!!inOtherGroup}
                    onChange={(e) => handleToggle(layer.id, e.target.checked)}
                  />
                  <LayerSymbol layer={layer} size={14} />
                  <span className="group-modal-layer-name">{layer.name}</span>
                  {inOtherGroup ? (
                    <span className="group-modal-other-hint">
                      (a un altre grup)
                    </span>
                  ) : null}
                </label>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Group settings panel (legend + style override) ───────────────────────────

function GroupSettingsPanel({ group, onUpdateLegend, onUpdateStyleOverride, onClose }) {
  const leg = group.legend ?? {}
  const so = group.styleOverride ?? {}

  const updLeg = (key, val) => onUpdateLegend?.({ ...leg, [key]: val })
  const updSo = (key, val) => onUpdateStyleOverride?.({ ...so, [key]: val })

  return (
    <div className="group-settings-panel">
      <div className="group-settings-header">
        <span>Grup: {group.name}</span>
        <button type="button" className="group-modal-close" onClick={onClose}>×</button>
      </div>

      <div className="group-settings-section-label">Llegenda</div>

      <label className="group-settings-check">
        <input type="checkbox" checked={!!leg.showGroupTitle} onChange={(e) => updLeg('showGroupTitle', e.target.checked)} />
        Mostrar capçalera de grup
      </label>

      {leg.showGroupTitle ? (
        <div className="group-settings-row">
          <label className="group-settings-label">Títol</label>
          <input
            type="text"
            className="group-settings-input"
            value={leg.title ?? ''}
            onChange={(e) => updLeg('title', e.target.value)}
            placeholder={group.name}
            maxLength={80}
          />
        </div>
      ) : null}

      <label className="group-settings-check">
        <input type="checkbox" checked={leg.showChildLayers !== false} onChange={(e) => updLeg('showChildLayers', e.target.checked)} />
        Mostrar capes individuals
      </label>

      <div className="group-settings-divider" />
      <div className="group-settings-section-label">Estil comú</div>

      <label className="group-settings-check">
        <input type="checkbox" checked={!!so.enabled} onChange={(e) => updSo('enabled', e.target.checked)} />
        Aplicar estil comú al grup
      </label>

      {so.enabled ? (
        <div className="group-settings-style">
          <div className="group-settings-row">
            <label className="group-settings-label">Color farcit</label>
            <input type="color" value={so.fillColor ?? '#888888'} onChange={(e) => updSo('fillColor', e.target.value)} />
          </div>
          <div className="group-settings-row">
            <label className="group-settings-label">Opacitat farcit</label>
            <input type="range" min="0" max="1" step="0.05" value={so.fillOpacity ?? 0.5} onChange={(e) => updSo('fillOpacity', parseFloat(e.target.value))} />
            <span className="group-settings-hint">{Math.round((so.fillOpacity ?? 0.5) * 100)}%</span>
          </div>
          <div className="group-settings-row">
            <label className="group-settings-label">Color contorn</label>
            <input type="color" value={so.strokeColor ?? '#333333'} onChange={(e) => updSo('strokeColor', e.target.value)} />
          </div>
          <div className="group-settings-row">
            <label className="group-settings-label">Opacitat contorn</label>
            <input type="range" min="0" max="1" step="0.05" value={so.strokeOpacity ?? 1} onChange={(e) => updSo('strokeOpacity', parseFloat(e.target.value))} />
            <span className="group-settings-hint">{Math.round((so.strokeOpacity ?? 1) * 100)}%</span>
          </div>
          <div className="group-settings-row">
            <label className="group-settings-label">Amplada línia</label>
            <input type="number" min="0.5" max="20" step="0.5" className="group-settings-number" value={so.strokeWidth ?? 2} onChange={(e) => updSo('strokeWidth', parseFloat(e.target.value) || 2)} />
          </div>
          <div className="group-settings-row">
            <label className="group-settings-label">Estil línia</label>
            <select className="group-settings-select" value={so.dashStyle ?? 'solid'} onChange={(e) => updSo('dashStyle', e.target.value)}>
              <option value="solid">Continu</option>
              <option value="dashed">Discontinu</option>
              <option value="dotted">Puntejat</option>
            </select>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ─── LayersPanel ──────────────────────────────────────────────────────────────

function LayersPanel({
  layers = [],
  groups = [],
  editableLayerId,
  onSetEditableLayer,
  onLayerVisibilityChange,
  onCreatePointLayer,
  onCreateLineLayer,
  onCreatePolygonLayer,
  onRenameLayer,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onGroupVisibilityChange,
  onToggleGroupCollapse,
  onSetLayerGroup,
  onUpdateGroupLegend,
  onUpdateGroupStyleOverride,
  onOpenLibrary,
}) {
  const [editingNameLayerId, setEditingNameLayerId] = useState(null)
  const [editingNameValue, setEditingNameValue] = useState('')
  const [showNewLayerMenu, setShowNewLayerMenu] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [editingGroupValue, setEditingGroupValue] = useState('')
  const [managingGroupId, setManagingGroupId] = useState(null) // group layer modal
  const [settingsGroupId, setSettingsGroupId] = useState(null) // group settings panel

  const groupNameInputRef = useRef(null)
  const renameInputRef = useRef(null)
  const panelRef = useRef(null)

  const vectorLayers = layers.filter(
    (l) => l.geometryType === 'point' || l.geometryType === 'line' || l.geometryType === 'polygon',
  )

  useEffect(() => {
    if (editingNameLayerId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [editingNameLayerId])

  useEffect(() => {
    if (editingGroupId && groupNameInputRef.current) {
      groupNameInputRef.current.focus()
      groupNameInputRef.current.select()
    }
  }, [editingGroupId])

  useEffect(() => {
    if (!showNewLayerMenu) return
    const handleOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowNewLayerMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showNewLayerMenu])

  const startRename = (layer) => {
    setEditingNameLayerId(layer.id)
    setEditingNameValue(layer.name)
  }

  const commitRename = (layerId) => {
    const trimmed = editingNameValue.trim()
    if (trimmed) onRenameLayer?.(layerId, trimmed)
    setEditingNameLayerId(null)
    setEditingNameValue('')
  }

  const cancelRename = () => {
    setEditingNameLayerId(null)
    setEditingNameValue('')
  }

  const startRenameGroup = (group) => {
    setEditingGroupId(group.id)
    setEditingGroupValue(group.name)
  }

  const commitRenameGroup = (groupId) => {
    const trimmed = editingGroupValue.trim()
    if (trimmed) onRenameGroup?.(groupId, trimmed)
    setEditingGroupId(null)
    setEditingGroupValue('')
  }

  const cancelRenameGroup = () => {
    setEditingGroupId(null)
    setEditingGroupValue('')
  }

  // Build render items: groups (with their layers) then ungrouped layers.
  const groupedLayerIds = new Set(
    vectorLayers.filter((l) => l.groupId).map((l) => l.groupId),
  )
  const renderItems = []

  groups.forEach((group) => {
    const groupLayers = vectorLayers.filter((l) => l.groupId === group.id)
    const isCollapsed = !!group.collapsed
    const allVisible = groupLayers.length > 0 && groupLayers.every((l) => l.visible)
    renderItems.push({ type: 'group', group, groupLayers, isCollapsed, allVisible })
    if (!isCollapsed) {
      groupLayers.forEach((layer) => renderItems.push({ type: 'layer', layer, inGroup: true }))
    }
  })

  vectorLayers
    .filter((l) => !l.groupId || !groupedLayerIds.has(l.groupId))
    .forEach((layer) => renderItems.push({ type: 'layer', layer, inGroup: false }))

  const managingGroup = managingGroupId ? groups.find((g) => g.id === managingGroupId) : null
  const settingsGroup = settingsGroupId ? groups.find((g) => g.id === settingsGroupId) : null

  const renderLayer = (layer, inGroup) => {
    const isEditable = layer.id === editableLayerId
    const isEditingName = editingNameLayerId === layer.id

    return (
      <article
        key={layer.id}
        className={`layer-card ${isEditable ? 'layer-card--active' : ''} ${layer.visible ? '' : 'layer-card--hidden'} ${inGroup ? 'layer-card--in-group' : ''}`}
      >
        <div
          className="layer-card-row"
          onClick={() => { if (!isEditingName) onSetEditableLayer?.(layer.id) }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onSetEditableLayer?.(layer.id) }}
        >
          <span className="layer-card-symbol" aria-hidden="true">
            <LayerSymbol layer={layer} size={16} />
          </span>

          {isEditingName ? (
            <input
              ref={renameInputRef}
              className="layer-name-input"
              value={editingNameValue}
              onChange={(e) => setEditingNameValue(e.target.value)}
              onBlur={() => commitRename(layer.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename(layer.id)
                if (e.key === 'Escape') cancelRename()
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="layer-card-name"
              onDoubleClick={(e) => { e.stopPropagation(); startRename(layer) }}
              title="Doble clic per renombrar"
            >
              {layer.name}
              {layer.type === 'source' ? (
                <span
                  className="layer-source-badge"
                  title={`Font externa · ${(layer.meta?.loadedFeatureCount ?? 0).toLocaleString()} elements carregats`}
                >
                  FONT
                </span>
              ) : null}
            </span>
          )}

          <span className="layer-card-controls">
            <button
              type="button"
              className={`layer-eye-btn ${layer.visible ? '' : 'layer-eye-btn--off'}`}
              onClick={(e) => { e.stopPropagation(); onLayerVisibilityChange?.(layer.id, !layer.visible) }}
              title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
              aria-label={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
            >
              <EyeIcon visible={layer.visible} />
            </button>
          </span>
        </div>
      </article>
    )
  }

  return (
    <aside className="panel panel-left" ref={panelRef}>
      <div className="panel-header">
        <h2>Capes</h2>
        <div className="new-layer-wrapper">
          <button
            type="button"
            className="btn-new-layer"
            onClick={() => setShowNewLayerMenu((v) => !v)}
          >
            + Nova capa
          </button>
          {showNewLayerMenu ? (
            <div className="new-layer-dropdown">
              <button type="button" onClick={() => { onCreatePointLayer?.(); setShowNewLayerMenu(false) }}>
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="#d4335b" fillOpacity="0.9" stroke="#d4335b" strokeWidth="1.5" /></svg>
                Capa de punts
              </button>
              <button type="button" onClick={() => { onCreateLineLayer?.(); setShowNewLayerMenu(false) }}>
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><line x1="2" y1="13" x2="14" y2="3" stroke="#ea8b1f" strokeWidth="2.5" strokeLinecap="round" /></svg>
                Capa de línies
              </button>
              <button type="button" onClick={() => { onCreatePolygonLayer?.(); setShowNewLayerMenu(false) }}>
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><polygon points="8,2 14,13 2,13" fill="#2f7de1" fillOpacity="0.2" stroke="#2f7de1" strokeWidth="1.5" /></svg>
                Capa de polígons
              </button>
              <div className="new-layer-dropdown-divider" />
              <button type="button" onClick={() => { onOpenLibrary?.(); setShowNewLayerMenu(false) }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="5" height="12" rx="1" fill="currentColor" fillOpacity="0.7" />
                  <rect x="8" y="1" width="5" height="12" rx="1" fill="currentColor" fillOpacity="0.4" />
                </svg>
                Des de biblioteca
              </button>
              <div className="new-layer-dropdown-divider" />
              <button type="button" onClick={() => { onCreateGroup?.(); setShowNewLayerMenu(false) }}>
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="1" y="3" width="12" height="8" rx="2" />
                  <line x1="4" y1="1" x2="10" y2="1" />
                </svg>
                Nou grup
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="layer-list">
        {renderItems.map((item) => {
          if (item.type === 'group') {
            const { group, groupLayers, isCollapsed, allVisible } = item
            const isEditingGroupName = editingGroupId === group.id
            const isEmpty = groupLayers.length === 0
            const hasStyleOverride = group.styleOverride?.enabled
            return (
              <div key={group.id} className={`layer-group${hasStyleOverride ? ' layer-group--override' : ''}`}>
                <div className="layer-group-header">
                  <button
                    type="button"
                    className="layer-group-collapse-btn"
                    onClick={() => onToggleGroupCollapse?.(group.id)}
                    aria-label={isCollapsed ? 'Expandir grup' : 'Plegar grup'}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" fill="currentColor">
                      {isCollapsed
                        ? <path d="M3 2l4 3-4 3V2z" />
                        : <path d="M2 3l3 4 3-4H2z" />}
                    </svg>
                  </button>

                  {isEditingGroupName ? (
                    <input
                      ref={groupNameInputRef}
                      className="layer-group-name-input"
                      value={editingGroupValue}
                      onChange={(e) => setEditingGroupValue(e.target.value)}
                      onBlur={() => commitRenameGroup(group.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRenameGroup(group.id)
                        if (e.key === 'Escape') cancelRenameGroup()
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="layer-group-name"
                      onDoubleClick={() => startRenameGroup(group)}
                      title="Doble clic per renombrar"
                    >
                      {group.name}
                      {isCollapsed && groupLayers.length > 0 ? (
                        <span className="layer-group-count">{groupLayers.length}</span>
                      ) : null}
                    </span>
                  )}

                  <span className="layer-group-controls">
                    {/* Manage layers button */}
                    <button
                      type="button"
                      className="layer-group-action-btn"
                      onClick={() => setManagingGroupId(group.id)}
                      title="Gestionar capes del grup"
                      aria-label="Gestionar capes del grup"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="2" y1="4" x2="12" y2="4" />
                        <line x1="2" y1="7" x2="12" y2="7" />
                        <line x1="2" y1="10" x2="9" y2="10" />
                      </svg>
                    </button>
                    {/* Group settings button */}
                    <button
                      type="button"
                      className={`layer-group-action-btn${settingsGroupId === group.id ? ' layer-group-action-btn--active' : ''}`}
                      onClick={() => setSettingsGroupId((id) => id === group.id ? null : group.id)}
                      title="Configuració del grup"
                      aria-label="Configuració del grup"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                        <circle cx="7" cy="7" r="2" />
                        <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" />
                      </svg>
                    </button>
                    {/* Visibility */}
                    <button
                      type="button"
                      className={`layer-eye-btn ${allVisible ? '' : 'layer-eye-btn--off'}`}
                      onClick={() => onGroupVisibilityChange?.(group.id, !allVisible)}
                      title={allVisible ? 'Ocultar grup' : 'Mostrar grup'}
                      aria-label={allVisible ? 'Ocultar grup' : 'Mostrar grup'}
                      disabled={isEmpty}
                    >
                      <EyeIcon visible={allVisible} />
                    </button>
                    {isEmpty ? (
                      <button
                        type="button"
                        className="layer-group-delete-btn"
                        onClick={() => onDeleteGroup?.(group.id)}
                        title="Eliminar grup buit"
                        aria-label="Eliminar grup buit"
                      >
                        ×
                      </button>
                    ) : null}
                  </span>
                </div>

                {/* Group settings panel (inline below header) */}
                {settingsGroupId === group.id ? (
                  <GroupSettingsPanel
                    group={group}
                    onUpdateLegend={(leg) => onUpdateGroupLegend?.(group.id, leg)}
                    onUpdateStyleOverride={(so) => onUpdateGroupStyleOverride?.(group.id, so)}
                    onClose={() => setSettingsGroupId(null)}
                  />
                ) : null}

                {!isCollapsed && groupLayers.length === 0 ? (
                  <p className="layer-group-empty">Cap capa en aquest grup</p>
                ) : null}
              </div>
            )
          }
          return renderLayer(item.layer, item.inGroup)
        })}
      </div>

      {/* Group layer management modal */}
      {managingGroup ? (
        <GroupLayerModal
          group={managingGroup}
          layers={layers}
          onClose={() => setManagingGroupId(null)}
          onSetLayerGroup={onSetLayerGroup}
        />
      ) : null}
    </aside>
  )
}

export default LayersPanel
