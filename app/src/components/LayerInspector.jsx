import { useEffect, useState } from 'react'
import IconPicker from './IconPicker'

// Resolves the display size (diameter) from style, supporting both the new
// `size` field and the legacy `radius` field from old saved projects.
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


function LayerInspector({
  layer,
  layerIndex,
  totalLayers,
  groups = [],
  focusMask = null,
  onRenameLayer,
  onLayerStyleChange,
  onMoveLayerUp,
  onMoveLayerDown,
  onExportLayerGeoJSON,
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

        <div className="inspector-section">
          <p className="inspector-section-title">Estil</p>
          <div className="layer-style-editor">
            {layer.geometryType === 'point' ? (
              <>
                {/* Marker type */}
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

                {/* Icon picker — only for icon-circle */}
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

                {/* Size (diameter) */}
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

                {/* Fill */}
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

                {/* Stroke */}
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
