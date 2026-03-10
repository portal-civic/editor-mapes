function LayersPanel({
  layers = [],
  activePointLayerId,
  activeLineLayerId,
  onSetActivePointLayer,
  onSetActiveLineLayer,
  onLayerVisibilityChange,
  onCreatePointLayer,
  onCreateLineLayer,
  onRenameLayer,
  onDeleteLayer,
}) {
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
          </button>
        </div>
      </div>
      <div className="panel-content">
        {layers.map((layer) => {
          const isPointLayer = layer.geometryType === 'point'
          const isLineLayer = layer.geometryType === 'line'
          const isActivePointLayer = isPointLayer && layer.id === activePointLayerId
          const isActiveLineLayer = isLineLayer && layer.id === activeLineLayerId
          const isActiveVectorLayer = isActivePointLayer || isActiveLineLayer

          return (
            <article
              key={layer.id}
              className={`layer-item ${isActiveVectorLayer ? 'layer-item-active' : ''}`}
            >
              <div className="layer-item-main">
                <span
                  className="layer-swatch"
                  style={{ backgroundColor: layer.color }}
                  aria-hidden="true"
                />
                <p className="layer-name">{layer.name}</p>
              </div>
              <p className="layer-meta">
                {layer.geometryType} · {layer.visible ? 'visible' : 'oculta'}
              </p>
              {isPointLayer || isLineLayer ? (
                <>
                  {isActiveVectorLayer ? (
                    <p className="layer-active-indicator">Activa</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        isPointLayer
                          ? onSetActivePointLayer?.(layer.id)
                          : onSetActiveLineLayer?.(layer.id)
                      }
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
                </>
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
