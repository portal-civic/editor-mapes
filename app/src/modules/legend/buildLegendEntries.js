import { normalizeCategory, normalizeCategoricalStyle } from '../sources/categoricalStyle'
import { resolveLegendLabel } from './legendLayout'
import { getPoiHiddenLegendValues } from '../osm/poiCategoryStyle'

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
  const showLayerNames = options.showLayerNames !== false
  const visibleValues = options.visibleValuesByLayerId?.[layer.id] // Set | undefined

  const rawTitle = layer.legend?.title || layer.name || ''
  const title = showLayerNames ? rawTitle : ''
  const showCounts = layer.legend?.showCounts === true
  const orderMode = layer.legend?.orderMode ?? 'manual'

  if (layer.styleMode === 'categorical' && layer.categorical?.categories?.length > 0) {
    const geom = layer.geometryType
    const cs = normalizeCategoricalStyle(layer.categorical?.categoricalStyle)
    let cats = layer.categorical.categories
      .map((c, i) => normalizeCategory(c, i))
      .filter((c) => c.legendVisible !== false)

    // Viewport filter: only categories with visible features in the current bbox
    if (visibleValues !== undefined) {
      cats = cats.filter((c) => visibleValues.has(String(c.value)))
    }

    // POI visibility filter: hide subcategories/categories toggled off in PoiFilterPanel
    if (layer.poiConfig) {
      const hiddenValues = getPoiHiddenLegendValues(layer)
      if (hiddenValues.size > 0) {
        cats = cats.filter((c) => !hiddenValues.has(String(c.value)))
      }
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

    // Hide categories below a count threshold; optionally group them as "Altres"
    const hideMinCount = layer.legend?.hideMinCount ?? 0
    const groupSmallCategories = layer.legend?.groupSmallCategories === true
    let smallCats = []
    if (hideMinCount > 0) {
      smallCats = cats.filter((c) => (c.count ?? 0) <= hideMinCount)
      cats = cats.filter((c) => (c.count ?? 0) > hideMinCount)
    }

    // Feature override rows (showInLegend: true) — appended after categories
    const overrideRows = Object.entries(layer.featureOverrides ?? {})
      .filter(([, ov]) => ov?.showInLegend)
      .map(([key, ov]) => ({
        label: ov.legendLabel || key,
        geometryType: geom,
        style: {
          fillColor: ov.fillColor || '#888888',
          fillOpacity: ov.fillOpacity !== '' && ov.fillOpacity != null ? Number(ov.fillOpacity) : cs.fillOpacity,
          strokeColor: ov.strokeColor || cs.fixedStrokeColor || '#333333',
          strokeWidth: ov.strokeWidth !== '' && ov.strokeWidth != null ? Number(ov.strokeWidth) : cs.strokeWidth,
          strokeOpacity: ov.strokeOpacity !== '' && ov.strokeOpacity != null ? Number(ov.strokeOpacity) : cs.strokeOpacity,
        },
      }))

    const hasContent = cats.length > 0 || (groupSmallCategories && smallCats.length > 0) || overrideRows.length > 0
    if (!hasContent) return null
    if (cats.length === 0 && !groupSmallCategories) return overrideRows.length > 0 ? { title, rows: overrideRows } : null

    const rows = cats.map((cat) => {
      const color = cat.color ?? '#888888'
      const fill = cat.fillColor ?? color
      const effectiveStroke = cs.strokeMode === 'fixed'
        ? cs.fixedStrokeColor
        : (cat.strokeColor ?? color)
      const resolvedLabel = resolveLegendLabel(cat.label, language) || String(cat.value)
      const label = showCounts && cat.count > 0
        ? `${resolvedLabel} (${cat.count.toLocaleString()})`
        : resolvedLabel

      let style
      if (geom === 'polygon') {
        style = {
          fillColor: fill,
          fillOpacity: cs.fillOpacity,
          strokeColor: effectiveStroke,
          strokeWidth: cs.strokeWidth,
          strokeOpacity: cs.strokeOpacity,
          dashStyle: cs.dashStyle,
        }
      } else if (geom === 'line') {
        style = { color: fill, width: cs.strokeWidth, opacity: cs.strokeOpacity, dashStyle: cs.dashStyle }
      } else {
        style = {
          fillColor: fill,
          fillOpacity: cs.fillOpacity,
          strokeColor: effectiveStroke,
          strokeWidth: cs.strokeWidth,
          radius: 6,
        }
      }

      // Merge global poiConfig.iconColor as fallback (per-cat markerStyle takes priority)
      const globalIconColor = layer.poiConfig?.iconColor ?? null
      const effectiveMarkerStyle = cat.markerStyle
        ? (globalIconColor && !cat.markerStyle.iconColor)
          ? { ...cat.markerStyle, iconColor: globalIconColor }
          : cat.markerStyle
        : null

      return { label, geometryType: geom, style, icon: cat.icon ?? null, markerStyle: effectiveMarkerStyle }
    })

    // "Altres" group: summarises categories below the count threshold
    if (groupSmallCategories && smallCats.length > 0) {
      const altresCount = smallCats.reduce((s, c) => s + (c.count ?? 0), 0)
      const altresLabel = showCounts && altresCount > 0
        ? `Altres (${altresCount.toLocaleString()})`
        : `Altres (${smallCats.length})`
      const altresStyle = geom === 'polygon'
        ? { fillColor: '#9ca3af', fillOpacity: cs.fillOpacity, strokeColor: '#6b7280', strokeWidth: cs.strokeWidth, strokeOpacity: cs.strokeOpacity }
        : geom === 'line'
          ? { color: '#9ca3af', width: cs.strokeWidth, opacity: cs.strokeOpacity }
          : { fillColor: '#9ca3af', fillOpacity: cs.fillOpacity, strokeColor: '#6b7280', strokeWidth: cs.strokeWidth, radius: 6 }
      rows.push({ label: altresLabel, geometryType: geom, style: altresStyle })
    }

    return { title, rows: [...rows, ...overrideRows] }
  }

  // Single-style layer
  const label = resolveLegendLabel(layer.legend?.title || layer.name || '', language)
  return { title, rows: [{ label, geometryType: layer.geometryType, style: layer.style ?? {} }] }
}

// ─── All visible legend entries ───────────────────────────────────────────────
// Entries are either:
//   { title, rows, layerId }          — per-layer entry (existing shape)
//   { isGroupHeader: true, title }    — group section separator

export function buildLegendEntries(layers, options = {}) {
  const groups = options.groups ?? []
  if (groups.length === 0) {
    return layers
      .filter((l) => l.visible)
      .map((l) => buildLegendEntry(l, options))
      .filter(Boolean)
      .filter((e) => e.rows.length > 0)
  }

  const visibleLayers = layers.filter((l) => l.visible)
  const processedIds = new Set()
  const result = []

  for (const group of groups) {
    const groupLayers = visibleLayers.filter((l) => l.groupId === group.id)
    if (groupLayers.length === 0) continue

    const leg = group.legend ?? {}
    const showGroupTitle = leg.showGroupTitle === true
    const showChildLayers = leg.showChildLayers !== false
    const groupTitle = (typeof leg.title === 'string' && leg.title.trim()) ? leg.title.trim() : group.name

    if (showGroupTitle) {
      result.push({ isGroupHeader: true, title: groupTitle })
    }

    if (showChildLayers) {
      for (const layer of groupLayers) {
        const entry = buildLegendEntry(layer, options)
        if (entry && entry.rows.length > 0) result.push(entry)
        processedIds.add(layer.id)
      }
    } else {
      groupLayers.forEach((l) => processedIds.add(l.id))
    }
  }

  for (const layer of visibleLayers) {
    if (processedIds.has(layer.id)) continue
    const entry = buildLegendEntry(layer, options)
    if (entry && entry.rows.length > 0) result.push(entry)
  }

  return result
}

