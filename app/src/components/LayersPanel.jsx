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
  onDeleteLayer,
  onLayerStyleChange,
  onMoveLayerUp,
  onMoveLayerDown,
  onExportLayerGeoJSON,
}) {
  const [openMenuLayerId, setOpenMenuLayerId] = useState(null)
  const [openStyleLayerId, setOpenStyleLayerId] = useState(null)
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
    if (!openMenuLayerId && !showNewLayerMenu) return

    const handleOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpenMenuLayerId(null)
        setShowNewLayerMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [openMenuLayerId, showNewLayerMenu])

  const startRename = (layer) => {
    setEditingNameLayerId(layer.id)
    setEditingNameValue(layer.name)
    setOpenMenuLayerId(null)
  }

  const commitRename = (layerId) => {
    const trimmed = editingNameValue.trim()
    if (trimmed) {
      onRenameLayer?.(layerId, trimmed)
    }
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

      <div className="panel-content">
        {vectorLayers.map((layer, vectorIndex) => {
          const isEditable = layer.id === editableLayerId
          const isMenuOpen = openMenuLayerId === layer.id
          const isStyleOpen = openStyleLayerId === layer.id
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

                  <div className="layer-menu-wrapper">
                    <button
                      type="button"
                      className={`layer-menu-btn ${isMenuOpen ? 'layer-menu-btn--open' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuLayerId(isMenuOpen ? null : layer.id)
                      }}
                      aria-label="Més opcions"
                    >
                      ⋮
                    </button>

                    {isMenuOpen ? (
                      <div className="layer-dropdown">
                        <button type="button" onClick={() => startRename(layer)}>
                          Renombrar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenStyleLayerId((id) => (id === layer.id ? null : layer.id))
                            setOpenMenuLayerId(null)
                          }}
                        >
                          Estil
                        </button>
                        <div className="layer-dropdown-divider" />
                        <button
                          type="button"
                          disabled={vectorIndex === 0}
                          onClick={() => {
                            onMoveLayerUp?.(layer.id)
                            setOpenMenuLayerId(null)
                          }}
                        >
                          ↑ Pujar
                        </button>
                        <button
                          type="button"
                          disabled={vectorIndex === vectorLayers.length - 1}
                          onClick={() => {
                            onMoveLayerDown?.(layer.id)
                            setOpenMenuLayerId(null)
                          }}
                        >
                          ↓ Baixar
                        </button>
                        <div className="layer-dropdown-divider" />
                        <button
                          type="button"
                          onClick={() => {
                            onExportLayerGeoJSON?.(layer.id)
                            setOpenMenuLayerId(null)
                          }}
                        >
                          Exportar GeoJSON
                        </button>
                        <div className="layer-dropdown-divider" />
                        <button
                          type="button"
                          className="layer-dropdown-danger"
                          onClick={() => {
                            onDeleteLayer?.(layer.id)
                            setOpenMenuLayerId(null)
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : null}
                  </div>
                </span>
              </div>

              {isStyleOpen ? (
                <div className="layer-style-editor">
                  {layer.geometryType === 'point' ? (
                    <>
                      <label>
                        Radi
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={layerStyle.radius ?? 7}
                          onChange={(e) =>
                            onLayerStyleChange?.(layer.id, {
                              radius: Number(e.target.value) || 1,
                            })
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
                            onLayerStyleChange?.(layer.id, {
                              fillOpacity: Number(e.target.value),
                            })
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
                            onLayerStyleChange?.(layer.id, {
                              strokeWidth: Number(e.target.value) || 0,
                            })
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
                            onLayerStyleChange?.(layer.id, {
                              strokeOpacity: Number(e.target.value),
                            })
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
                            onLayerStyleChange?.(layer.id, {
                              width: Number(e.target.value) || 1,
                            })
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
                            onLayerStyleChange?.(layer.id, {
                              opacity: Number(e.target.value),
                            })
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
                            onLayerStyleChange?.(layer.id, {
                              strokeWidth: Number(e.target.value) || 0,
                            })
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
                            onLayerStyleChange?.(layer.id, {
                              strokeOpacity: Number(e.target.value),
                            })
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
                            onLayerStyleChange?.(layer.id, {
                              fillOpacity: Number(e.target.value),
                            })
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
              ) : null}
            </article>
          )
        })}
      </div>
    </aside>
  )
}

export default LayersPanel
