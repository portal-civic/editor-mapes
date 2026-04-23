import { normalizeCategory } from '../sources/categoricalStyle'

// ─── Per-layer legend entry ───────────────────────────────────────────────────
// Returns { title, rows } | null
// rows: [{ label, geometryType, style }]
// style uses: fillColor, strokeColor, strokeWidth (point/polygon) | color, width (line)

export function buildLegendEntry(layer) {
  if (layer.legend?.visible === false) return null

  const title = layer.legend?.title || layer.legendLabel || layer.name || ''
  const showCounts = layer.legend?.showCounts === true
  const orderMode = layer.legend?.orderMode ?? 'manual'

  if (layer.styleMode === 'categorical' && layer.categorical?.categories?.length > 0) {
    const geom = layer.geometryType
    let cats = layer.categorical.categories
      .map((c, i) => normalizeCategory(c, i))
      .filter((c) => c.legendVisible !== false)

    if (orderMode === 'alpha') {
      cats = [...cats].sort((a, b) => a.label.localeCompare(b.label))
    } else if (orderMode === 'count') {
      cats = [...cats].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    } else {
      cats = [...cats].sort((a, b) => (a.legendOrder ?? 0) - (b.legendOrder ?? 0))
    }

    if (cats.length === 0) return null

    const rows = cats.map((cat) => {
      const color = cat.color ?? '#888888'
      const fill = cat.fillColor ?? color
      const stroke = cat.strokeColor ?? color
      const label = showCounts && cat.count > 0
        ? `${cat.label} (${cat.count.toLocaleString()})`
        : cat.label

      let style
      if (geom === 'polygon') {
        style = { fillColor: fill, fillOpacity: 0.35, strokeColor: stroke, strokeWidth: 2, strokeOpacity: 1 }
      } else if (geom === 'line') {
        style = { color: stroke, width: 3, opacity: 1 }
      } else {
        style = { fillColor: fill, fillOpacity: 0.9, strokeColor: stroke, strokeWidth: 2, radius: 6 }
      }

      return { label, geometryType: geom, style }
    })

    return { title, rows }
  }

  // Single-style layer
  const label = layer.legendLabel || layer.name || ''
  return { title, rows: [{ label, geometryType: layer.geometryType, style: layer.style ?? {} }] }
}

// ─── All visible legend entries ───────────────────────────────────────────────

export function buildLegendEntries(layers) {
  return layers
    .filter((l) => l.visible)
    .map(buildLegendEntry)
    .filter(Boolean)
    .filter((e) => e.rows.length > 0)
}
