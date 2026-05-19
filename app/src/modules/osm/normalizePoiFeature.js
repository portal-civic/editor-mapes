/**
 * normalizePoiFeature.js — Extract human-readable fields from an OSM POI feature.
 */

import { OSM_CATEGORY_BY_ID, OSM_SUBCATEGORY_BY_ID } from './osmPoiCategories'

const SUBTYPE_KEYS = ['amenity', 'tourism', 'leisure', 'healthcare', 'office', 'railway', 'aeroway', 'landuse', 'shop']

export function normalizePoiFeature(feature) {
  const props = feature?.properties
  if (!props?.poi_category) return null

  const cat = OSM_CATEGORY_BY_ID[props.poi_category]
  const sub = props.poi_subcategory ? OSM_SUBCATEGORY_BY_ID[props.poi_subcategory] : null

  const title =
    props.name ||
    props['name:ca'] ||
    props['name:es'] ||
    props['name:en'] ||
    null

  // ── Address ───────────────────────────────────────────────────────────────
  let address = null
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
    osm_id: props.osm_id ? `${props.osm_type ?? 'node'}/${props.osm_id}` : null,
    lat,
    lng,
    source: 'osm',
  }
}

export function isOsmPoiFeature(feature) {
  return !!feature?.properties?.poi_category
}
