/**
 * normalizePoiFeature.js — Normalitza camps llegibles d'una feature POI.
 * Suporta fonts OSM, Overture i GeoJSON oficial.
 */

import { OSM_CATEGORY_BY_ID, OSM_SUBCATEGORY_BY_ID } from './osmPoiCategories'
import { APP_CATEGORY_BY_ID, OVERTURE_SUBCAT_BY_ID } from '../poi/appCategoryRegistry'

function resolveCategory(catId) {
  return OSM_CATEGORY_BY_ID[catId] ?? APP_CATEGORY_BY_ID[catId] ?? null
}

function resolveSubcategory(subcatId) {
  return OSM_SUBCATEGORY_BY_ID[subcatId] ?? OVERTURE_SUBCAT_BY_ID[subcatId] ?? null
}

export function normalizePoiFeature(feature) {
  const props = feature?.properties
  if (!props?.poi_category) return null

  const cat = resolveCategory(props.poi_category)
  const sub = props.poi_subcategory ? resolveSubcategory(props.poi_subcategory) : null

  const title =
    props.name ||
    props['name:ca'] ||
    props['name:es'] ||
    props['name:en'] ||
    null

  // ── Address (OSM o Overture) ───────────────────────────────────────────────
  let address = props.address ?? null
  if (!address) {
    if (props['addr:full']) {
      address = props['addr:full']
    } else {
      const street = props['addr:street']
      const num = props['addr:housenumber']
      const postcode = props['addr:postcode']
      const city = props['addr:city']
      const parts = []
      if (street && num) parts.push(`${street}, ${num}`)
      else if (street) parts.push(street)
      if (postcode || city) parts.push([postcode, city].filter(Boolean).join(' '))
      if (parts.length) address = parts.join(' – ')
    }
  }

  const phone = props.phone || props['contact:phone'] || null
  const website = props.website || props['contact:website'] || props.url || null
  const operator = props.operator || props.brand || null
  const description = props.description || props['description:ca'] || props['description:es'] || null

  const coords = feature?.geometry?.coordinates
  let lat = null, lng = null
  if (coords && feature?.geometry?.type === 'Point') {
    lng = coords[0]
    lat = coords[1]
  }

  const source = props.poi_source ?? 'osm'

  // ── Camps específics per font ──────────────────────────────────────────────
  const overtureData = source === 'overture' ? {
    basicCategory: props.overture_basic_category ?? null,
    primary: props.overture_primary ?? null,
    hierarchy: props.overture_hierarchy ?? null,
    hierarchyArr: (() => {
      try { return JSON.parse(props.overture_hierarchy_arr ?? 'null') } catch { return null }
    })(),
    alternate: props.overture_alternate ?? null,
    confidence: props.overture_confidence ?? null,
    operatingStatus: props.overture_operating_status ?? null,
    dataset: props.overture_dataset ?? null,
    schema: props.overture_schema ?? null,
  } : null

  const osmData = source === 'osm' ? {
    osmId: props.osm_id ? `${props.osm_type ?? 'node'}/${props.osm_id}` : null,
  } : null

  return {
    title,
    category: cat?.label ?? props.poi_category_label ?? props.poi_category,
    subcategory: sub?.label ?? props.poi_subcategory_label ?? null,
    description,
    address,
    phone,
    website,
    operator,
    icon: props.poi_icon ?? sub?.icon ?? cat?.icon ?? null,
    color: props.poi_color ?? sub?.color ?? cat?.color ?? null,
    osm_id: osmData?.osmId ?? null,
    lat,
    lng,
    source,
    overture: overtureData,
    official: source === 'official' ? {
      sourceCategory: props.official_source_category ?? null,
      sourceSubcategory: props.official_source_subcategory ?? null,
    } : null,
  }
}

export function isOsmPoiFeature(feature) {
  return !!feature?.properties?.poi_category
}
