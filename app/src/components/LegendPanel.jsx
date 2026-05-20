// External legend panel — rendered outside the map as a column (right/left) or
// horizontal bar (bottom). Shares swatch logic with MapLegendOverlay.
import { resolveTablerIcon } from '../icons/tablerIconResolver'

function Swatch({ geometryType, style = {}, icon, markerStyle }) {
  // Tabler vector icon in coloured circle
  if (markerStyle?.iconSet === 'tabler' && markerStyle.icon && geometryType === 'point') {
    const TablerIcon = resolveTablerIcon(markerStyle.icon)
    const bg = markerStyle.fillColor ?? style.fillColor ?? '#888'
    const ic = markerStyle.iconColor ?? '#fff'
    return (
      <span
        className="map-legend-swatch map-legend-swatch--poi"
        style={{ backgroundColor: bg }}
        aria-hidden="true"
      >
        {TablerIcon ? <TablerIcon size={10} color={ic} strokeWidth={2.5} /> : null}
      </span>
    )
  }
  // Emoji icon
  const emojiIcon = (markerStyle?.iconSet === 'emoji' ? markerStyle.icon : null) ?? icon
  if (emojiIcon && geometryType === 'point') {
    return (
      <span
        className="map-legend-swatch map-legend-swatch--poi"
        style={{ backgroundColor: style.fillColor || '#888' }}
        aria-hidden="true"
      >
        {emojiIcon}
      </span>
    )
  }
  if (geometryType === 'line') {
    return (
      <span
        className="map-legend-swatch map-legend-swatch--line"
        style={{ backgroundColor: style.color || '#888' }}
        aria-hidden="true"
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
        aria-hidden="true"
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
      aria-hidden="true"
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
      : {}
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
              <div
                key={`gh-${ei}`}
                className="legend-col-group-header"
                style={titleFontSize ? { fontSize: `${titleFontSize}px` } : undefined}
              >
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
                  <Swatch
                    geometryType={row.geometryType}
                    style={row.style}
                    icon={row.icon}
                    markerStyle={row.markerStyle}
                  />
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
