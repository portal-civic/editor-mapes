import { useEffect, useRef, useState } from 'react'

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

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M1.5 8C3 4.5 13 4.5 14.5 8C13 11.5 3 11.5 1.5 8Z" />
        <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M1.5 8C3 4.5 13 4.5 14.5 8C13 11.5 3 11.5 1.5 8Z" opacity="0.4" />
      <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" opacity="0.4" />
      <line x1="3" y1="13" x2="13" y2="3" />
    </svg>
  )
}

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
  onOpenLibrary,
}) {
  const [editingNameLayerId, setEditingNameLayerId] = useState(null)
  const [editingNameValue, setEditingNameValue] = useState('')
  const [showNewLayerMenu, setShowNewLayerMenu] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState(new Set())
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [editingGroupValue, setEditingGroupValue] = useState('')

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

  const toggleGroupCollapse = (groupId) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  // Build render items: groups (with their layers) then ungrouped layers.
  // Preserves relative order within each group and among ungrouped layers.
  const groupedLayerIds = new Set(
    vectorLayers.filter((l) => l.groupId).map((l) => l.groupId),
  )
  const renderItems = []

  groups.forEach((group) => {
    const groupLayers = vectorLayers.filter((l) => l.groupId === group.id)
    const isCollapsed = collapsedGroups.has(group.id)
    const allVisible = groupLayers.length > 0 && groupLayers.every((l) => l.visible)
    renderItems.push({ type: 'group', group, groupLayers, isCollapsed, allVisible })
    if (!isCollapsed) {
      groupLayers.forEach((layer) => renderItems.push({ type: 'layer', layer, inGroup: true }))
    }
  })

  vectorLayers
    .filter((l) => !l.groupId || !groupedLayerIds.has(l.groupId))
    .forEach((layer) => renderItems.push({ type: 'layer', layer, inGroup: false }))

  const renderLayer = (layer, inGroup) => {
    const isEditable = layer.id === editableLayerId
    const isEditingName = editingNameLayerId === layer.id
    const layerStyle = layer.style || {}
    const symbolColor =
      layer.geometryType === 'point'
        ? layerStyle.fillColor || layer.color
        : layer.geometryType === 'line'
          ? layerStyle.color || layer.color
          : layerStyle.fillColor || layer.color

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
            <GeomSymbol type={layer.geometryType} color={symbolColor} size={16} />
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
                <GeomSymbol type="point" color="#d4335b" size={14} />
                Capa de punts
              </button>
              <button type="button" onClick={() => { onCreateLineLayer?.(); setShowNewLayerMenu(false) }}>
                <GeomSymbol type="line" color="#ea8b1f" size={14} />
                Capa de línies
              </button>
              <button type="button" onClick={() => { onCreatePolygonLayer?.(); setShowNewLayerMenu(false) }}>
                <GeomSymbol type="polygon" color="#2f7de1" size={14} />
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
            return (
              <div key={group.id} className="layer-group">
                <div className="layer-group-header">
                  <button
                    type="button"
                    className="layer-group-collapse-btn"
                    onClick={() => toggleGroupCollapse(group.id)}
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
                    </span>
                  )}

                  <span className="layer-group-controls">
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
                {!isCollapsed && groupLayers.length === 0 ? (
                  <p className="layer-group-empty">Cap capa en aquest grup</p>
                ) : null}
              </div>
            )
          }
          return renderLayer(item.layer, item.inGroup)
        })}
      </div>
    </aside>
  )
}

export default LayersPanel
