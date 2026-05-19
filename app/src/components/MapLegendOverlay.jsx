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

export default function MapLegendOverlay({ entries = [], layout = {} }) {
  if (entries.length === 0) return null

  const { fontFamily, fontSize, titleFontSize, background, border } = layout

  const overlayStyle = {
    fontFamily: fontFamily || undefined,
    fontSize: fontSize ? `${fontSize}px` : undefined,
    background: background && background !== '#ffffff'
      ? `${background}ee`
      : undefined,
    border: border === false ? 'none' : undefined,
  }

  const titleStyle = {
    fontSize: titleFontSize ? `${titleFontSize}px` : undefined,
  }

  return (
    <div className="map-legend-overlay" aria-label="Llegenda" style={overlayStyle}>
      {entries.map((entry, ei) => {
        if (entry.isGroupHeader) {
          return (
            <div key={`gh-${ei}`} className="map-legend-group-header" style={titleStyle}>
              {entry.title}
            </div>
          )
        }
        return (
          <div key={ei} className="map-legend-group">
            {entry.rows.length > 1 && (
              <div className="map-legend-group-title" style={titleStyle}>{entry.title}</div>
            )}
            {entry.rows.map((row, ri) => (
              <div key={ri} className="map-legend-row">
                <Swatch geometryType={row.geometryType} style={row.style} icon={row.icon} markerStyle={row.markerStyle} />
                <span className="map-legend-label">{row.label}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
