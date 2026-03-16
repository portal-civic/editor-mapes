function MapToolbarSimple({ activeWorkModeId, editableLayerGeometryType, onModeChange }) {
  const isCreateMode = activeWorkModeId === 'point' || activeWorkModeId === 'line' || activeWorkModeId === 'polygon'

  const handleCreate = () => {
    if (editableLayerGeometryType) {
      onModeChange(editableLayerGeometryType)
    }
  }

  return (
    <div className="map-toolbar-simple" role="toolbar" aria-label="Eines del mapa">
      <button
        type="button"
        className={`tool-btn ${activeWorkModeId === 'select' ? 'active' : ''}`}
        aria-pressed={activeWorkModeId === 'select'}
        onClick={() => onModeChange('select')}
      >
        Seleccionar
      </button>
      <button
        type="button"
        className={`tool-btn ${isCreateMode ? 'active' : ''}`}
        aria-pressed={isCreateMode}
        disabled={!editableLayerGeometryType}
        onClick={handleCreate}
      >
        Crear
      </button>
      <button
        type="button"
        className={`tool-btn ${activeWorkModeId === 'delete' ? 'active' : ''}`}
        aria-pressed={activeWorkModeId === 'delete'}
        onClick={() => onModeChange('delete')}
      >
        Eliminar
      </button>
    </div>
  )
}

export default MapToolbarSimple
