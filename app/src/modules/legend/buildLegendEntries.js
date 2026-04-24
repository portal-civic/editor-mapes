import { normalizeCategory } from '../sources/categoricalStyle'
import { resolveLegendLabel } from './legendLayout'

// ─── Per-layer legend entry ───────────────────────────────────────────────────
// Returns { title, rows } | null
// rows: [{ label, geometryType, style }]
//
// options:
//   language              — 'val' | 'cas' | 'eng' (default 'val')
//   visibleValuesByLayerId — Map<layerId, Set<string>> | null; when provided,
//                           categories whose value is not in the set are hidden.

export function buildLegendEntry(layer, options = {}) {
  if (layer.legend?.visible === false) return null

  const language = options.language ?? 'val'
  const visibleValues = options.visibleValuesByLayerId?.[layer.id] // Set | undefined

  const title = layer.legend?.title || layer.legendLabel || layer.name || ''
  const showCounts = layer.legend?.showCounts === true
  const orderMode = layer.legend?.orderMode ?? 'manual'

  if (layer.styleMode === 'categorical' && layer.categorical?.categories?.length > 0) {
    const geom = layer.geometryType
    let cats = layer.categorical.categories
      .map((c, i) => normalizeCategory(c, i))
      .filter((c) => c.legendVisible !== false)

    // Viewport filter: only categories with visible features in the current bbox
    if (visibleValues !== undefined) {
      cats = cats.filter((c) => visibleValues.has(String(c.value)))
    }

    if (orderMode === 'alpha') {
      cats = [...cats].sort((a, b) => {
        const la = resolveLegendLabel(a.label, language)
        const lb = resolveLegendLabel(b.label, language)
        return la.localeCompare(lb)
      })
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
      const resolvedLabel = resolveLegendLabel(cat.label, language) || String(cat.value)
      const label = showCounts && cat.count > 0
        ? `${resolvedLabel} (${cat.count.toLocaleString()})`
        : resolvedLabel

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
  const label = resolveLegendLabel(layer.legendLabel || layer.name || '', language)
  return { title, rows: [{ label, geometryType: layer.geometryType, style: layer.style ?? {} }] }
}

// ─── All visible legend entries ───────────────────────────────────────────────

export function buildLegendEntries(layers, options = {}) {
  return layers
    .filter((l) => l.visible)
    .map((l) => buildLegendEntry(l, options))
    .filter(Boolean)
    .filter((e) => e.rows.length > 0)
}
