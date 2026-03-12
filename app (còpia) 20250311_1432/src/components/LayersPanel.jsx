import { useState } from 'react'

function LayersPanel({
  layers = [],
  activePointLayerId,
  activeLineLayerId,
  activePolygonLayerId,
  onSetActivePointLayer,
  onSetActiveLineLayer,
  onSetActivePolygonLayer,
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
  const [openStyleLayerId, setOpenStyleLayerId] = useState(null)

  return (
    <aside className="panel panel-left">
      <div className="panel-header">
        <h2>Capes</h2>
        <div>
          <button type="button" onClick={onCreatePointLayer}>
            + Punt
          </button>{' '}
          <button type="button" onClick={onCreateLineLayer}>
            + Línia
          </button>{' '}
          <button type="button" onClick={onCreatePolygonLayer}>
            + Polígon
          </button>
        </div>
      </div>
      <div className="panel-content">
        {layers.map((layer, layerIndex) => {
          const isPointLayer = layer.geometryType === 'point'
          const isLineLayer = layer.geometryType === 'line'
          const isPolygonLayer = layer.geometryType === 'polygon'
          const isActivePointLayer = isPointLayer && layer.id === activePointLayerId
          const isActiveLineLayer = isLineLayer && layer.id === activeLineLayerId
          const isActivePolygonLayer =
            isPolygonLayer && layer.id === activePolygonLayerId
          const isActiveVectorLayer =
            isActivePointLayer || isActiveLineLayer || isActivePolygonLayer
          const isStyleOpen = openStyleLayerId === layer.id
          const layerStyle = layer.style || {}
          const swatchColor = isPointLayer
            ? layerStyle.fillColor || layer.color
            : isLineLayer
              ? layerStyle.color || layer.color
              : isPolygonLayer
                ? layerStyle.fillColor || layer.color
                : layer.color

          return (
            <article
              key={layer.id}
              className={`layer-item ${isActiveVectorLayer ? 'layer-item-active' : ''}`}
            >
              <div className="layer-item-main">
                <span
                  className="layer-swatch"
                  style={{ backgroundColor: swatchColor }}
                  aria-hidden="true"
                />
                <p className="layer-name">{layer.name}</p>
              </div>
              <p className="layer-meta">
                {layer.geometryType} · {layer.visible ? 'visible' : 'oculta'}
              </p>
              {isPointLayer || isLineLayer || isPolygonLayer ? (
                <>
                  {isActiveVectorLayer ? (
                    <p className="layer-active-indicator">Activa</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (isPointLayer) {
                          onSetActivePointLayer?.(layer.id)
                          return
                        }
                        if (isLineLayer) {
                          onSetActiveLineLayer?.(layer.id)
                          return
                        }
                        onSetActivePolygonLayer?.(layer.id)
                      }}
                    >
                      Activar
                    </button>
                  )}
                  <button type="button" onClick={() => onRenameLayer?.(layer.id)}>
                    Renombrar
                  </button>
                  <button type="button" onClick={() => onDeleteLayer?.(layer.id)}>
                    Eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => onExportLayerGeoJSON?.(layer.id)}
                  >
                    Exportar GeoJSON
                  </button>
                  <button
                    type="button"
                    disabled={layerIndex === 0}
                    onClick={() => onMoveLayerUp?.(layer.id)}
                  >
                    Pujar
                  </button>
                  <button
                    type="button"
                    disabled={layerIndex === layers.length - 1}
                    onClick={() => onMoveLayerDown?.(layer.id)}
                  >
                    Baixar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenStyleLayerId((currentId) =>
                        currentId === layer.id ? null : layer.id,
                      )
                    }
                  >
                    Estil
                  </button>
                </>
              ) : null}
              {isStyleOpen && (isPointLayer || isLineLayer || isPolygonLayer) ? (
                <div className="layer-style-editor">
                  {isPointLayer ? (
                    <>
                      <label>
                        Radi
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={layerStyle.radius ?? 7}
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              radius: Number(event.target.value) || 1,
                            })
                          }
                        />
                      </label>
                      <label>
                        Color interior
                        <input
                          type="color"
                          value={layerStyle.fillColor ?? '#d4335b'}
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              fillColor: event.target.value,
                            })
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
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              fillOpacity: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        Color contorn
                        <input
                          type="color"
                          value={layerStyle.strokeColor ?? '#d4335b'}
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              strokeColor: event.target.value,
                            })
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
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              strokeWidth: Number(event.target.value) || 0,
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
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              strokeOpacity: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                    </>
                  ) : null}

                  {isLineLayer ? (
                    <>
                      <label>
                        Color
                        <input
                          type="color"
                          value={layerStyle.color ?? '#ea8b1f'}
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              color: event.target.value,
                            })
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
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              width: Number(event.target.value) || 1,
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
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              opacity: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        Tipus de línia
                        <select
                          value={layerStyle.dashStyle ?? 'solid'}
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              dashStyle: event.target.value,
                            })
                          }
                        >
                          <option value="solid">Solid</option>
                          <option value="dashed">Dashed</option>
                          <option value="dotted">Dotted</option>
                        </select>
                      </label>
                    </>
                  ) : null}

                  {isPolygonLayer ? (
                    <>
                      <label>
                        Color vora
                        <input
                          type="color"
                          value={layerStyle.strokeColor ?? '#2f7de1'}
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              strokeColor: event.target.value,
                            })
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
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              strokeWidth: Number(event.target.value) || 0,
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
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              strokeOpacity: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        Color interior
                        <input
                          type="color"
                          value={layerStyle.fillColor ?? '#2f7de1'}
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              fillColor: event.target.value,
                            })
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
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              fillOpacity: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        Tipus de vora
                        <select
                          value={layerStyle.dashStyle ?? 'solid'}
                          onChange={(event) =>
                            onLayerStyleChange?.(layer.id, {
                              dashStyle: event.target.value,
                            })
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
              <label className="layer-toggle">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={(event) =>
                    onLayerVisibilityChange?.(layer.id, event.target.checked)
                  }
                />
                <span>Mostrar al mapa</span>
              </label>
            </article>
          )
        })}
      </div>
    </aside>
  )
}

export default LayersPanel
