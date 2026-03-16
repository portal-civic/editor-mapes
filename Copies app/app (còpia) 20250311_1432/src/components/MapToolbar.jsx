function MapToolbar({ modes = [], activeModeId, onModeChange }) {
  return (
    <div className="map-toolbar" role="toolbar" aria-label="Modes de treball">
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          className={`tool-btn ${activeModeId === mode.id ? 'active' : ''}`}
          onClick={() => onModeChange?.(mode.id)}
          aria-pressed={activeModeId === mode.id}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}

export default MapToolbar
