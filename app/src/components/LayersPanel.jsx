function LayersPanel({
  layers = [],
  activePointLayerId,
  onSetActivePointLayer,
  onLayerVisibilityChange,
  onCreatePointLayer,
  onRenamePointLayer,
}) {
  return (
    <aside className="panel panel-left">
      <div className="panel-header">
        <h2>Capes</h2>
        <button type="button" onClick={onCreatePointLayer}>
          + Nova
        </button>
      </div>
      <div className="panel-content">
        {layers.map((layer) => {
          const isPointLayer = layer.geometryType === 'point'
          const isActivePointLayer = isPointLayer && layer.id === activePointLayerId

          return (
            <article key={layer.id} className="layer-item">
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
              {isPointLayer ? (
                <>
                  <label className="layer-toggle">
                    <input
                      type="radio"
                      name="active-point-layer"
                      checked={isActivePointLayer}
                      onChange={() => onSetActivePointLayer?.(layer.id)}
                    />
                    <span>Capa activa</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onRenamePointLayer?.(layer.id)}
                  >
                    Renombrar
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
