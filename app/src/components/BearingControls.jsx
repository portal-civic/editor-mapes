function BearingControls({ bearing = 0, isSelectMode, onRotate, onReset }) {
  const disableRotate = !isSelectMode

  return (
    <div className="bearing-controls" role="group" aria-label="Rotació del mapa">
      <button
        type="button"
        className="bearing-btn"
        disabled={disableRotate}
        onClick={() => onRotate(-15)}
        title="Girar -15°"
        aria-label="Girar -15°"
      >
        ↺
      </button>
      <button
        type="button"
        className="bearing-btn bearing-btn--nord"
        onClick={onReset}
        title="Orientar al nord"
        aria-label="Orientar al nord"
      >
        ↑ Nord
      </button>
      <button
        type="button"
        className="bearing-btn"
        disabled={disableRotate}
        onClick={() => onRotate(+15)}
        title="Girar +15°"
        aria-label="Girar +15°"
      >
        ↻
      </button>
      {bearing !== 0 ? (
        <span className="bearing-label">{Math.round(bearing)}°</span>
      ) : null}
    </div>
  )
}

export default BearingControls
