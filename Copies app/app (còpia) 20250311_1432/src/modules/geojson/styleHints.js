function toValidStyleNumber(value) {
  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : null
}

function toValidStyleText(value) {
  if (typeof value !== 'string') {
    return null
  }

  const nextValue = value.trim()
  return nextValue ? nextValue : null
}

export function extractGeoJSONStyleHints(properties) {
  if (!properties || typeof properties !== 'object') {
    return { point: {}, line: {}, polygon: {} }
  }

  const stroke = toValidStyleText(properties.stroke)
  const strokeWidth = toValidStyleNumber(properties['stroke-width'])
  const strokeOpacity = toValidStyleNumber(properties['stroke-opacity'])
  const fill = toValidStyleText(properties.fill)
  const fillOpacity = toValidStyleNumber(properties['fill-opacity'])
  const markerColor = toValidStyleText(properties['marker-color'])

  return {
    point: {
      ...(markerColor ? { fillColor: markerColor, strokeColor: markerColor } : {}),
    },
    line: {
      ...(stroke ? { color: stroke } : {}),
      ...(strokeWidth !== null ? { width: strokeWidth } : {}),
      ...(strokeOpacity !== null ? { opacity: strokeOpacity } : {}),
    },
    polygon: {
      ...(stroke ? { strokeColor: stroke } : {}),
      ...(strokeWidth !== null ? { strokeWidth } : {}),
      ...(strokeOpacity !== null ? { strokeOpacity } : {}),
      ...(fill ? { fillColor: fill } : {}),
      ...(fillOpacity !== null ? { fillOpacity } : {}),
    },
  }
}
