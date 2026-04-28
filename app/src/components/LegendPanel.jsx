// External legend panel — rendered outside the map as a column (right/left) or
// horizontal bar (bottom). Shares swatch logic with MapLegendOverlay.

function Swatch({ geometryType, style = {} }) {
  if (geometryType === 'line') {
    return (
      <span
        className="map-legend-swatch map-legend-swatch--line"
        style={{ backgroundColor: style.color || '#888' }}
      />
    )
  }
  if (geometryType === 'polygon') {
    return (
      <span
        className="map-legend-swatch map-legend-swatch--polygon"
        style={{
          backgroundColor: style.fillColor || '#888',
          borderColor: style.strokeColor || style.fillColor || '#888',
        }}
      />
    )
  }
  return (
    <span
      className="map-legend-swatch map-legend-swatch--point"
      style={{
        backgroundColor: style.fillColor || '#888',
        borderColor: style.strokeColor || style.fillColor || '#888',
      }}
    />
  )
}

export default function LegendPanel({ entries = [], layout = {}, isHorizontal = false }) {
  const {
    fontFamily,
    fontSize,
    titleFontSize,
    background = '#ffffff',
    padding = 12,
    border = true,
  } = layout

  const fontStyle = {
    fontFamily: fontFamily || undefined,
    fontSize: fontSize ? `${fontSize}px` : undefined,
  }

  const borderStyle = border
    ? isHorizontal
      ? { borderTop: '1px solid #d6dde6' }
      : {} // border applied via CSS on the .legend-column wrapper
    : {}

  return (
    <div
      className={`legend-panel${isHorizontal ? ' legend-panel--horizontal' : ''}`}
      style={{ background, padding, ...fontStyle, ...borderStyle }}
      aria-label="Llegenda"
    >
      {entries.length === 0 ? (
        <span className="legend-panel-empty">Cap llegenda</span>
      ) : (
        entries.map((entry, ei) => {
          if (entry.isGroupHeader) {
            return (
              <div key={`gh-${ei}`} className="legend-col-group-header" style={titleFontSize ? { fontSize: `${titleFontSize}px` } : undefined}>
                {entry.title}
              </div>
            )
          }
          return (
            <div key={ei} className="legend-col-group">
              {entry.rows.length > 1 && (
                <div
                  className="legend-col-group-title"
                  style={titleFontSize ? { fontSize: `${titleFontSize}px` } : undefined}
                >
                  {entry.title}
                </div>
              )}
              {entry.rows.map((row, ri) => (
                <div key={ri} className="legend-col-row">
                  <Swatch geometryType={row.geometryType} style={row.style} />
                  <span className="legend-col-label" style={fontStyle}>
                    {row.label}
                  </span>
                </div>
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}
