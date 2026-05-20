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
import {
  APP_CATEGORIES,
  APP_CATEGORY_BY_ID,
  OVERTURE_POI_SUBCATEGORIES,
  OVERTURE_SUBCAT_BY_ID,
} from '../poi/appCategoryRegistry'
import { normalizeCategory } from '../sources/categoricalStyle'
import { getPoiTablerIcon } from '../symbols/poiIconMap'

// ─── Registre unificat: OSM + Overture + Altres ───────────────────────────────
// Usem el registre unificat per a lookup de categories que no existeixen a OSM.

function resolveCategory(catId) {
  return OSM_CATEGORY_BY_ID[catId] ?? APP_CATEGORY_BY_ID[catId] ?? null
}

function resolveSubcategory(subcatId) {
  return OSM_SUBCATEGORY_BY_ID[subcatId] ?? OVERTURE_SUBCAT_BY_ID[subcatId] ?? null
}

function getUnifiedTablerIcon(subcatId) {
  // Primer intenta l'iconMap OSM, si no usa el tablerIcon del registre unificat
  const osmIcon = getPoiTablerIcon(subcatId)
  if (osmIcon !== 'map-pin') return osmIcon // map-pin és el fallback d'OSM
  const subDef = OVERTURE_SUBCAT_BY_ID[subcatId]
  return subDef?.tablerIcon ?? 'map-pin'
}

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
    const present = new Set(
      features.map((f) => f?.properties?.poi_subcategory).filter(Boolean),
    )

    // Construir des del registre unificat (OSM + Overture) en ordre canònic
    const ALL_SUBCATS = [...OSM_POI_SUBCATEGORIES, ...OVERTURE_POI_SUBCATEGORIES]
    const seen = new Set()
    const categories = []

    for (const sub of ALL_SUBCATS) {
      if (!present.has(sub.id) || seen.has(sub.id)) continue
      seen.add(sub.id)
      categories.push(normalizeCategory({
        value: sub.id,
        label: sub.label,
        color: sub.color,
        icon: null,
        markerStyle: {
          iconSet: 'tabler',
          icon: getUnifiedTablerIcon(sub.id),
          size: 22,
          fillColor: sub.color,
          iconColor: '#ffffff',
          strokeColor: sub.color,
          strokeWidth: 0,
        },
        visible: true,
        legendOrder: categories.length,
      }))
    }

    // Subcategories no trobades al registre (IDs desconeguts) — afegir-les al final
    for (const id of present) {
      if (seen.has(id)) continue
      categories.push(normalizeCategory({
        value: id,
        label: id,
        color: '#94a3b8',
        icon: null,
        markerStyle: { iconSet: 'tabler', icon: 'map-pin', size: 22, fillColor: '#94a3b8', iconColor: '#ffffff', strokeColor: '#94a3b8', strokeWidth: 0 },
        visible: true,
        legendOrder: categories.length,
      }))
    }

    return { field: 'poi_subcategory', categories }
  }

  // displayMode === 'category'
  const present = new Set(
    features.map((f) => f?.properties?.poi_category).filter(Boolean),
  )

  // Registre unificat de categories (OSM + app categories)
  const ALL_CATS = [...OSM_POI_CATEGORIES, ...APP_CATEGORIES.filter((c) => !OSM_CATEGORY_BY_ID[c.id])]
  const seen = new Set()
  const categories = []

  for (const cat of ALL_CATS) {
    if (!present.has(cat.id) || seen.has(cat.id)) continue
    seen.add(cat.id)
    categories.push(normalizeCategory({
      value: cat.id,
      label: cat.label,
      color: cat.color,
      icon: null,
      markerStyle: {
        iconSet: 'tabler',
        icon: cat.tablerIcon ?? 'map-pin',
        size: 22,
        fillColor: cat.color,
        iconColor: '#ffffff',
        strokeColor: cat.color,
        strokeWidth: 0,
      },
      visible: true,
      legendOrder: categories.length,
    }))
  }

  // Categories no trobades al registre
  for (const id of present) {
    if (seen.has(id)) continue
    categories.push(normalizeCategory({
      value: id,
      label: id,
      color: '#94a3b8',
      icon: null,
      markerStyle: { iconSet: 'tabler', icon: 'map-pin', size: 22, fillColor: '#94a3b8', iconColor: '#ffffff', strokeColor: '#94a3b8', strokeWidth: 0 },
      visible: true,
      legendOrder: categories.length,
    }))
  }

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
      const iconId = getUnifiedTablerIcon(cat.value)
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
        ? (resolveSubcategory(cat.value))
        : (resolveCategory(cat.value))
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
