function MapToolbarSimple({
  activeWorkModeId,
  editableLayerGeometryType,
  onModeChange,
  bearing = 0,
  onRotate,
  onReset,
}) {
  const isCreateMode =
    activeWorkModeId === 'point' ||
    activeWorkModeId === 'line' ||
    activeWorkModeId === 'polygon'

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

      <div className="tool-divider" aria-hidden="true" />

      <button
        type="button"
        className="tool-btn-rotate"
        title="Girar mapa a l'esquerra"
        aria-label="Girar mapa a l'esquerra"
        onClick={() => onRotate?.(-15)}
      >
        ↺
      </button>
      <button
        type="button"
        className={`tool-btn-rotate tool-btn-rotate--north ${bearing !== 0 ? 'active' : ''}`}
        title="Restablir orientació"
        aria-label="Restablir orientació nord"
        onClick={onReset}
      >
        N
      </button>
      <button
        type="button"
        className="tool-btn-rotate"
        title="Girar mapa a la dreta"
        aria-label="Girar mapa a la dreta"
        onClick={() => onRotate?.(+15)}
      >
        ↻
      </button>
      {bearing !== 0 ? (
        <span className="tool-bearing-label" aria-live="polite">
          {Math.round(bearing)}°
        </span>
      ) : null}
    </div>
  )
}

export default MapToolbarSimple
