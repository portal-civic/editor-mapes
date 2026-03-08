function TopBar({
  basemapOptions = [],
  selectedBasemapId = '',
  onBasemapChange,
}) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <p className="eyebrow">Editor de mapes</p>
        <h1>Projecte actiu: Municipi (placeholder)</h1>
      </div>
      <div className="topbar-actions">
        <label className="topbar-field">
          <span>Mapa base</span>
          <select
            value={selectedBasemapId}
            onChange={(event) => onBasemapChange?.(event.target.value)}
          >
            {basemapOptions.map((basemap) => (
              <option key={basemap.id} value={basemap.id}>
                {basemap.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button">Guardar projecte</button>
        <button type="button" className="primary">
          Exportar
        </button>
      </div>
    </header>
  )
}

export default TopBar
