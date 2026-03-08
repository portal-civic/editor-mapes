function LayersPanel({ layers = [], onLayerVisibilityChange }) {
  return (
    <aside className="panel panel-left">
      <div className="panel-header">
        <h2>Capes</h2>
        <button type="button">+ Nova</button>
      </div>
      <div className="panel-content">
        {layers.map((layer) => (
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
        ))}
      </div>
    </aside>
  )
}

export default LayersPanel
