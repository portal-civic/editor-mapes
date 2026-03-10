function MapToolbarSimple({ activeWorkModeId, onModeChange }) {
  return (
    <div className="map-toolbar-simple" role="toolbar" aria-label="Eines del mapa">
      <div className="toolbar-zone" aria-label="Seleccionar">
        <button
          type="button"
          className={`tool-btn ${activeWorkModeId === 'select' ? 'active' : ''}`}
          aria-pressed={activeWorkModeId === 'select'}
          onClick={() => onModeChange('select')}
        >
          Seleccionar
        </button>
      </div>

      <div className="toolbar-zone" aria-label="Crear">
        <button
          type="button"
          className={`tool-btn ${activeWorkModeId === 'point' ? 'active' : ''}`}
          aria-pressed={activeWorkModeId === 'point'}
          onClick={() => onModeChange('point')}
        >
          Punt
        </button>
        <button type="button" className="tool-btn" disabled>
          Línia
        </button>
        <button type="button" className="tool-btn" disabled>
          Polígon
        </button>
      </div>

      <div className="toolbar-zone" aria-label="Eliminar">
        <button
          type="button"
          className={`tool-btn ${activeWorkModeId === 'delete' ? 'active' : ''}`}
          aria-pressed={activeWorkModeId === 'delete'}
          onClick={() => onModeChange('delete')}
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

export default MapToolbarSimple
