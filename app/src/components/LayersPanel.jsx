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
  editableLayerId,
  onSetEditableLayer,
  onLayerVisibilityChange,
  onCreatePointLayer,
  onCreateLineLayer,
  onCreatePolygonLayer,
  onRenameLayer,
}) {
  const [editingNameLayerId, setEditingNameLayerId] = useState(null)
  const [editingNameValue, setEditingNameValue] = useState('')
  const [showNewLayerMenu, setShowNewLayerMenu] = useState(false)

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
              <button
                type="button"
                onClick={() => {
                  onCreatePointLayer?.()
                  setShowNewLayerMenu(false)
                }}
              >
                <GeomSymbol type="point" color="#d4335b" size={14} />
                Capa de punts
              </button>
              <button
                type="button"
                onClick={() => {
                  onCreateLineLayer?.()
                  setShowNewLayerMenu(false)
                }}
              >
                <GeomSymbol type="line" color="#ea8b1f" size={14} />
                Capa de línies
              </button>
              <button
                type="button"
                onClick={() => {
                  onCreatePolygonLayer?.()
                  setShowNewLayerMenu(false)
                }}
              >
                <GeomSymbol type="polygon" color="#2f7de1" size={14} />
                Capa de polígons
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="layer-list">
        {vectorLayers.map((layer) => {
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
              className={`layer-card ${isEditable ? 'layer-card--active' : ''} ${layer.visible ? '' : 'layer-card--hidden'}`}
            >
              <div
                className="layer-card-row"
                onClick={() => {
                  if (!isEditingName) onSetEditableLayer?.(layer.id)
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSetEditableLayer?.(layer.id)
                }}
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
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      startRename(layer)
                    }}
                    title="Doble clic per renombrar"
                  >
                    {layer.name}
                  </span>
                )}

                <span className="layer-card-controls">
                  <button
                    type="button"
                    className={`layer-eye-btn ${layer.visible ? '' : 'layer-eye-btn--off'}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onLayerVisibilityChange?.(layer.id, !layer.visible)
                    }}
                    title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
                    aria-label={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
                  >
                    <EyeIcon visible={layer.visible} />
                  </button>
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </aside>
  )
}

export default LayersPanel
