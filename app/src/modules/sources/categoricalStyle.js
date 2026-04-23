import { getDatasetFeatures } from './sourceStore.js'
import { PALETTES, PALETTE_ORDER } from '../styles/palettes.js'

// ─── Category model normalization ─────────────────────────────────────────────
// Migrates old { value, label?, style: { color } } to the full model.

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

// ─── Generation ───────────────────────────────────────────────────────────────

export function generateCategoriesFromDataset(datasetId, field, paletteId = 'default') {
  const features = getDatasetFeatures(datasetId) ?? []
  const palette = PALETTES[paletteId]?.colors ?? PALETTES.default.colors

  const counts = new Map()
  for (const f of features) {
    const v = f.properties?.[field]
    const key = v == null ? '__null__' : String(v)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  // Order by count descending for palette assignment
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

export function applyPaletteToCategories(categories, paletteId, invert = false) {
  const base = PALETTES[paletteId]?.colors ?? PALETTES.default.colors
  const palette = invert ? [...base].reverse() : base
  return categories.map((cat, i) => ({
    ...normalizeCategory(cat, i),
    color: palette[i % palette.length],
    fillColor: null,
    strokeColor: null,
  }))
}

// ─── Leaflet style conversion ─────────────────────────────────────────────────

export function leafletStyleForCategory(category, geometryType) {
  if (!category || category.visible === false) {
    return { opacity: 0, fillOpacity: 0, weight: 0 }
  }
  const color = category.color ?? '#888888'
  const fill = category.fillColor ?? color
  const stroke = category.strokeColor ?? color

  if (geometryType === 'polygon') {
    return { color: stroke, weight: 2, opacity: 1, fillColor: fill, fillOpacity: 0.35 }
  }
  if (geometryType === 'line') {
    return { color: stroke, weight: 3, opacity: 1 }
  }
  return { fillColor: fill, fillOpacity: 0.9, color: stroke, weight: 2, opacity: 1, radius: 6 }
}

export { PALETTES, PALETTE_ORDER }
