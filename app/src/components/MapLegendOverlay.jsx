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
  // point (default)
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

export default function MapLegendOverlay({ entries = [] }) {
  if (entries.length === 0) return null

  return (
    <div className="map-legend-overlay" aria-label="Llegenda">
      {entries.map((entry, ei) => (
        <div key={ei} className="map-legend-group">
          {entry.rows.length > 1 && (
            <div className="map-legend-group-title">{entry.title}</div>
          )}
          {entry.rows.map((row, ri) => (
            <div key={ri} className="map-legend-row">
              <Swatch geometryType={row.geometryType} style={row.style} />
              <span className="map-legend-label">{row.label}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
