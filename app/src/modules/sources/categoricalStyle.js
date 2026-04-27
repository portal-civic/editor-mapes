import { getDatasetFeatures } from './sourceStore.js'
import { PALETTES, PALETTE_ORDER } from '../styles/palettes.js'

// ─── Category model normalization ─────────────────────────────────────────────

export function normalizeCategory(cat, index) {
  if (cat == null) return null
  const color = cat.color ?? cat.style?.color ?? '#888888'
  return {
    value: cat.value ?? null,
    label: cat.label ?? (cat.value == null ? '(buit)' : String(cat.value)),
    description: cat.description ?? '',
    color,
    fillColor: cat.fillColor ?? null,
    strokeColor: cat.strokeColor ?? null,
    visible: cat.visible !== false,
    legendVisible: cat.legendVisible !== false,
    legendOrder: cat.legendOrder ?? index,
    count: cat.count ?? 0,
  }
}

// ─── Global categorical style ─────────────────────────────────────────────────
// Controls shared rendering parameters (opacity, stroke, dash) for all
// categories of a layer. Lives at layer.categorical.categoricalStyle.

export const DEFAULT_CATEGORICAL_STYLE = {
  fillOpacity: 0.45,
  strokeOpacity: 1.0,
  strokeWidth: 2,
  dashStyle: 'solid',
  strokeMode: 'category', // 'category' = use category color | 'fixed' = fixedStrokeColor
  fixedStrokeColor: '#333333',
}

export function normalizeCategoricalStyle(raw) {
  const d = DEFAULT_CATEGORICAL_STYLE
  if (!raw || typeof raw !== 'object') return { ...d }
  return {
    fillOpacity: Number.isFinite(raw.fillOpacity)
      ? Math.max(0, Math.min(1, raw.fillOpacity)) : d.fillOpacity,
    strokeOpacity: Number.isFinite(raw.strokeOpacity)
      ? Math.max(0, Math.min(1, raw.strokeOpacity)) : d.strokeOpacity,
    strokeWidth: typeof raw.strokeWidth === 'number' && raw.strokeWidth >= 0
      ? raw.strokeWidth : d.strokeWidth,
    dashStyle: ['solid', 'dashed', 'dotted'].includes(raw.dashStyle)
      ? raw.dashStyle : d.dashStyle,
    strokeMode: ['category', 'fixed'].includes(raw.strokeMode)
      ? raw.strokeMode : d.strokeMode,
    fixedStrokeColor: typeof raw.fixedStrokeColor === 'string'
      ? raw.fixedStrokeColor : d.fixedStrokeColor,
  }
}

// ─── Generation ───────────────────────────────────────────────────────────────

export function generateCategoriesFromDataset(datasetId, field, paletteId = 'default', paletteMap = null) {
  const features = getDatasetFeatures(datasetId) ?? []
  const resolved = paletteMap ?? PALETTES
  const palette = resolved[paletteId]?.colors ?? PALETTES.default.colors

  const counts = new Map()
  for (const f of features) {
    const v = f.properties?.[field]
    const key = v == null ? '__null__' : String(v)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])

  return sorted.map(([key, count], i) => ({
    value: key === '__null__' ? null : key,
    label: key === '__null__' ? '(buit)' : key,
    description: '',
    color: palette[i % palette.length],
    fillColor: null,
    strokeColor: null,
    visible: true,
    legendVisible: true,
    legendOrder: i,
    count,
  }))
}

// ─── Palette application ──────────────────────────────────────────────────────

export function applyPaletteToCategories(categories, paletteId, invert = false, paletteMap = null) {
  const resolved = paletteMap ?? PALETTES
  const base = resolved[paletteId]?.colors ?? PALETTES.default.colors
  const palette = invert ? [...base].reverse() : base
  return categories.map((cat, i) => ({
    ...normalizeCategory(cat, i),
    color: palette[i % palette.length],
    fillColor: null,
    strokeColor: null,
  }))
}

// ─── Leaflet style for a single category ─────────────────────────────────────
// catStyle is the global categoricalStyle block; falls back to defaults when
// absent (full backward compatibility).

export function leafletStyleForCategory(category, geometryType, catStyle) {
  if (!category || category.visible === false) {
    return { opacity: 0, fillOpacity: 0, weight: 0 }
  }
  const cs = normalizeCategoricalStyle(catStyle)
  const color = category.color ?? '#888888'
  const fill = category.fillColor ?? color
  const stroke = cs.strokeMode === 'fixed'
    ? cs.fixedStrokeColor
    : (category.strokeColor ?? color)

  const dashArray = cs.dashStyle === 'dashed' ? '10,8'
    : cs.dashStyle === 'dotted' ? '2,8'
    : undefined

  if (geometryType === 'polygon') {
    return {
      color: stroke,
      weight: cs.strokeWidth,
      opacity: cs.strokeOpacity,
      fillColor: fill,
      fillOpacity: cs.fillOpacity,
      dashArray,
    }
  }
  if (geometryType === 'line') {
    // Lines: fill color is the line color; no fill/stroke separation
    return {
      color: fill,
      weight: cs.strokeWidth,
      opacity: cs.strokeOpacity,
      dashArray,
    }
  }
  // point
  return {
    fillColor: fill,
    fillOpacity: cs.fillOpacity,
    color: stroke,
    weight: cs.strokeWidth,
    opacity: cs.strokeOpacity,
    radius: 6,
  }
}

export { PALETTES, PALETTE_ORDER }
