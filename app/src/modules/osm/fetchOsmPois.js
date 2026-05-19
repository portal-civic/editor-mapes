/**
 * fetchOsmPois.js — Fetch POIs from Overpass API using subcategory-level tag matching.
 */

import {
  OSM_POI_CATEGORIES,
  OSM_POI_SUBCATEGORIES,
  OSM_CATEGORY_BY_ID,
  OSM_SUBCATEGORY_BY_ID,
  getSubcategoriesForCategory,
} from './osmPoiCategories'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// In-session cache keyed by "bbox_rounded:sorted_cat_ids"
const _cache = new Map()

/**
 * Build Overpass QL query for the given bbox and selected category ids.
 * Bbox format for Overpass: (south,west,north,east)
 * @param {[number,number,number,number]} bbox - [west, south, east, north]
 * @param {string[]} categoryIds - top-level category ids
 */
function buildOverpassQuery(bbox, categoryIds) {
  const [west, south, east, north] = bbox
  const bboxStr = `(${south},${west},${north},${east})`

  // Collect all tag filters from subcategories of selected categories
  const tagFilters = []
  for (const catId of categoryIds) {
    const subcats = getSubcategoriesForCategory(catId)
    for (const sub of subcats) {
      for (const tag of sub.tags) {
        const filter = tag.value
          ? `["${tag.key}"="${tag.value}"]`
          : `["${tag.key}"]`
        tagFilters.push(filter)
      }
    }
  }

  const uniqueFilters = [...new Set(tagFilters)]

  const lines = ['[out:json][timeout:30];', '(']
  for (const filter of uniqueFilters) {
    lines.push(`  node${filter}${bboxStr};`)
    lines.push(`  way${filter}${bboxStr};`)
    lines.push(`  relation${filter}${bboxStr};`)
  }
  lines.push(');')
  lines.push('out center tags;')

  return lines.join('\n')
}

/**
 * Match OSM tags to the most specific subcategory.
 * Tries subcategories in order — returns first match.
 * @param {object} tags - OSM tags map
 * @param {string[]} categoryIds - categories to test
 * @returns {{ categoryId, subcategoryId } | null}
 */
function matchTags(tags, categoryIds) {
  for (const catId of categoryIds) {
    const subcats = getSubcategoriesForCategory(catId)
    for (const sub of subcats) {
      for (const tagDef of sub.tags) {
        const osmVal = tags[tagDef.key]
        if (osmVal == null) continue
        if (tagDef.value == null || osmVal === tagDef.value) {
          return { categoryId: catId, subcategoryId: sub.id }
        }
      }
    }
  }
  return null
}

/**
 * Convert a raw Overpass element to a GeoJSON Feature.
 * Returns null if coordinates cannot be extracted.
 */
function elementToFeature(el, match) {
  let lat, lng
  if (el.type === 'node') {
    lat = el.lat
    lng = el.lon
  } else if (el.center) {
    lat = el.center.lat
    lng = el.center.lon
  } else {
    return null
  }

  if (!isFinite(lat) || !isFinite(lng)) return null

  const cat = OSM_CATEGORY_BY_ID[match.categoryId]
  const sub = OSM_SUBCATEGORY_BY_ID[match.subcategoryId]
  const tags = el.tags ?? {}
  const name = tags.name ?? tags['name:ca'] ?? tags['name:es'] ?? null

  const props = {
    osm_type: el.type,
    osm_id: el.id,
    poi_category: match.categoryId,
    poi_category_label: cat?.label ?? match.categoryId,
    poi_subcategory: match.subcategoryId,
    poi_subcategory_label: sub?.label ?? match.subcategoryId,
    poi_icon: sub?.icon ?? cat?.icon ?? null,
    poi_color: sub?.color ?? cat?.color ?? null,
    // poi_label: reserved for future labelling
    name: name ?? '',
    ...tags,
  }

  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: props,
  }
}

/**
 * Fetch POIs from Overpass API.
 * @param {object} opts
 * @param {[number,number,number,number]} opts.bbox - [west, south, east, north]
 * @param {string[]} opts.selectedCategoryIds
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{features: object[], fromCache: boolean}>}
 */
export async function fetchOsmPois({ bbox, selectedCategoryIds, signal }) {
  if (!bbox || selectedCategoryIds.length === 0) {
    return { features: [], fromCache: false }
  }

  const bboxKey = bbox.map((v) => v.toFixed(2)).join(',')
  const catKey = [...selectedCategoryIds].sort().join(',')
  const cacheKey = `${bboxKey}:${catKey}`

  if (_cache.has(cacheKey)) {
    return { features: _cache.get(cacheKey), fromCache: true }
  }

  const query = buildOverpassQuery(bbox, selectedCategoryIds)

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Overpass error ${response.status}: ${text.slice(0, 200)}`)
  }

  const json = await response.json()
  const elements = json.elements ?? []

  const seen = new Set()
  const features = []

  for (const el of elements) {
    const key = `${el.type}:${el.id}`
    if (seen.has(key)) continue
    seen.add(key)

    const tags = el.tags ?? {}
    const match = matchTags(tags, selectedCategoryIds)
    if (!match) continue

    const feature = elementToFeature(el, match)
    if (feature) features.push(feature)
  }

  _cache.set(cacheKey, features)
  return { features, fromCache: false }
}
