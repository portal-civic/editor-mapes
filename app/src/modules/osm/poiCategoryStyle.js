/**
 * poiCategoryStyle.js
 *
 * Builds the `categorical` config for a POI layer from the actual features,
 * using colours and labels defined in osmPoiCategories.js.
 *
 * displayMode = 'subcategory'  → field: poi_subcategory  (stable IDs)
 * displayMode = 'category'     → field: poi_category     (stable IDs)
 */

import {
  OSM_POI_CATEGORIES,
  OSM_POI_SUBCATEGORIES,
  OSM_CATEGORY_BY_ID,
  OSM_SUBCATEGORY_BY_ID,
  getSubcategoriesForCategory,
} from './osmPoiCategories'
import { normalizeCategory } from '../sources/categoricalStyle'
import { getPoiTablerIcon } from '../symbols/poiIconMap'

/** Build the default markerStyle for a subcategory (Tabler icon + colour). */
function subcatMarkerStyle(sub) {
  return {
    iconSet: 'tabler',
    icon: getPoiTablerIcon(sub.id),
    size: 22,
    fillColor: sub.color,
    iconColor: '#ffffff',
    strokeColor: sub.color,
    strokeWidth: 0,
  }
}

/** Build the default markerStyle for a top-level category. */
function catMarkerStyle(cat) {
  return {
    iconSet: 'tabler',
    icon: 'map-pin',
    size: 22,
    fillColor: cat.color,
    iconColor: '#ffffff',
    strokeColor: cat.color,
    strokeWidth: 0,
  }
}

/**
 * Build `{ field, categories }` for `layer.categorical`.
 *
 * @param {object[]} features  - GeoJSON features array (rawFeatures from store)
 * @param {'subcategory'|'category'} displayMode
 * @returns {{ field: string, categories: object[] }}
 */
export function buildPoiCategoricalConfig(features, displayMode = 'subcategory') {
  if (displayMode === 'subcategory') {
    // Collect the subcategory IDs that actually appear in the data,
    // preserving the canonical order from osmPoiCategories.
    const present = new Set(
      features.map((f) => f?.properties?.poi_subcategory).filter(Boolean),
    )
    const categories = OSM_POI_SUBCATEGORIES
      .filter((sub) => present.has(sub.id))
      .map((sub, i) =>
        normalizeCategory({
          value: sub.id,
          label: sub.label,
          color: sub.color,
          icon: null,             // emoji not used by default
          markerStyle: subcatMarkerStyle(sub),
          visible: true,
          legendOrder: i,
        }),
      )
    return { field: 'poi_subcategory', categories }
  }

  // displayMode === 'category'
  const present = new Set(
    features.map((f) => f?.properties?.poi_category).filter(Boolean),
  )
  const categories = OSM_POI_CATEGORIES
    .filter((cat) => present.has(cat.id))
    .map((cat, i) =>
      normalizeCategory({
        value: cat.id,
        label: cat.label,
        color: cat.color,
        icon: null,
        markerStyle: catMarkerStyle(cat),
        visible: true,
        legendOrder: i,
      }),
    )
  return { field: 'poi_category', categories }
}

/**
 * Given a POI layer and its current poiVisibility, return the Set of
 * category values that should be hidden from the legend.
 *
 * Works for both displayModes.
 *
 * @param {object} layer
 * @returns {Set<string>}  values to suppress in the legend
 */
export function getPoiHiddenLegendValues(layer) {
  const pv = layer.poiVisibility?.subcategories
  if (!pv) return new Set()

  const dm = layer.poiConfig?.displayMode ?? 'category'

  if (dm === 'subcategory') {
    // A subcategory value is hidden if explicitly set to false
    return new Set(
      Object.entries(pv)
        .filter(([, v]) => v === false)
        .map(([k]) => k),
    )
  }

  // dm === 'category'
  // A category is hidden if ALL its subcategories are hidden
  const hidden = new Set()
  for (const cat of OSM_POI_CATEGORIES) {
    const subcats = getSubcategoriesForCategory(cat.id)
    if (subcats.length > 0 && subcats.every((s) => pv[s.id] === false)) {
      hidden.add(cat.id)
    }
  }
  return hidden
}

/**
 * Rebuild markerStyle for every category in a POI layer according to `mode`.
 *
 * mode = 'tabler'  — Tabler vector icons + colour circle (professional default)
 * mode = 'emoji'   — emoji from OSM category definitions
 * mode = 'circle'  — plain colour circle, no icon
 */
export function applyPoiMarkerStyleToCategories(categories, mode, displayMode = 'subcategory') {
  return categories.map((cat) => {
    if (mode === 'tabler') {
      const iconId = getPoiTablerIcon(cat.value)
      return {
        ...cat,
        icon: null,
        markerStyle: {
          iconSet: 'tabler',
          icon: iconId,
          size: 22,
          fillColor: cat.color,
          iconColor: '#ffffff',
          strokeColor: cat.color,
          strokeWidth: 0,
        },
      }
    }

    if (mode === 'emoji') {
      const def = displayMode === 'subcategory'
        ? OSM_SUBCATEGORY_BY_ID[cat.value]
        : OSM_CATEGORY_BY_ID[cat.value]
      const emojiIcon = def?.icon ?? cat.icon ?? null
      return {
        ...cat,
        icon: emojiIcon,
        markerStyle: { iconSet: 'emoji', icon: emojiIcon },
      }
    }

    // mode === 'circle'
    return { ...cat, icon: null, markerStyle: null }
  })
}

// Re-export for convenience
export { OSM_SUBCATEGORY_BY_ID, OSM_CATEGORY_BY_ID }
