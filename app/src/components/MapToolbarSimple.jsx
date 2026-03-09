const TOOL_OPTIONS = [
  { id: 'select', label: 'Seleccionar' },
  { id: 'point', label: 'Punt' },
]

function MapToolbarSimple({ activeWorkModeId, onModeChange }) {
  return (
    <div className="map-toolbar-simple" role="toolbar" aria-label="Eines del mapa">
      {TOOL_OPTIONS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className={`tool-btn ${activeWorkModeId === tool.id ? 'active' : ''}`}
          aria-pressed={activeWorkModeId === tool.id}
          onClick={() => onModeChange(tool.id)}
        >
          {tool.label}
        </button>
      ))}
    </div>
  )
}

export default MapToolbarSimple
