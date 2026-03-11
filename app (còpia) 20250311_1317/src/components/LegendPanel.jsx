function LegendPanel({ layers = [] }) {
  const visibleLayers = layers.filter((layer) => layer.visible)

  return (
    <aside className="panel panel-right">
      <div className="panel-header">
        <h2>Llegenda</h2>
        <button type="button">Editar</button>
      </div>
      <div className="panel-content">
        {visibleLayers.map((layer) => (
          <article key={layer.id} className="layer-item">
            <div className="layer-item-main">
              <span
                className="layer-swatch"
                style={{ backgroundColor: layer.color }}
                aria-hidden="true"
              />
              <p className="layer-name">{layer.name || layer.legendLabel}</p>
            </div>
            <p className="layer-meta">{layer.geometryType}</p>
          </article>
        ))}
      </div>
    </aside>
  )
}

export default LegendPanel
