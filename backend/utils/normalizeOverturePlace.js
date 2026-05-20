/**
 * Normalise a raw Overture Places GeoJSON feature into the internal POI model.
 *
 * Overture schema reference:
 *   https://docs.overturemaps.org/guides/places/
 *
 * Supports both the current schema (top-level taxonomy fields) and the legacy
 * "categories" object from older exports.
 */
export function normalizeOverturePlace(feature, index) {
  const props = feature?.properties ?? {}
  const geom = feature?.geometry

  if (geom?.type !== 'Point' || !Array.isArray(geom.coordinates)) return null

  const [longitude, latitude] = geom.coordinates
  if (typeof longitude !== 'number' || typeof latitude !== 'number') return null

  // ── Identity ─────────────────────────────────────────────────────────────────
  const id = props.id ?? props.place_id ?? `overture-${index}`

  // ── Name ─────────────────────────────────────────────────────────────────────
  const name = extractName(props)

  // ── Taxonomy (current schema: top-level; legacy: categories object) ──────────
  const basicCategory = props.basic_category ?? props.categories?.primary ?? null

  // taxonomy.* fields (current schema)
  const taxonomy = props.taxonomy ?? {}
  const primaryCategory = taxonomy.primary ?? props.categories?.primary ?? basicCategory
  const hierarchyArr = Array.isArray(taxonomy.hierarchy) ? taxonomy.hierarchy : null
  const hierarchyStr = hierarchyArr
    ? hierarchyArr.join(' › ')
    : (typeof taxonomy.hierarchy === 'string' ? taxonomy.hierarchy : null)

  const alternateCategories = (() => {
    const alt = taxonomy.alternate ?? props.categories?.alternate ?? null
    if (!alt) return null
    if (Array.isArray(alt)) return alt.join(', ')
    return String(alt)
  })()

  // ── App category (coarse mapping, refined on the frontend) ───────────────────
  const appCategory = guessAppCategory(basicCategory, hierarchyArr)

  // ── Quality signals ───────────────────────────────────────────────────────────
  const confidence = typeof props.confidence === 'number' ? props.confidence : null
  const operatingStatus = props.operating_status ?? null

  // ── Contact ──────────────────────────────────────────────────────────────────
  const address = extractAddress(props)
  const websites = extractList(props.websites ?? props.website)
  const phones = extractList(props.phones ?? props.phone)

  return {
    id,
    source: 'overture',
    name,
    latitude,
    longitude,
    appCategory,
    sourceCategory: basicCategory,
    sourceSubcategory: primaryCategory !== basicCategory ? primaryCategory : null,
    overtureBasicCategory: basicCategory,
    overturePrimaryCategory: primaryCategory,
    overtureHierarchy: hierarchyStr,
    overtureHierarchyArr: hierarchyArr,
    overtureAlternateCategories: alternateCategories,
    confidence,
    operatingStatus,
    address,
    websites,
    phones,
    raw: props,
  }
}

// ── Coarse app-category mapping (top-level hierarchy keyword) ─────────────────
// The frontend overtureTaxonomy.js contains the exhaustive per-basic_category map.
// Here we only need enough to tag POIs so the frontend can show them by category.

const HIERARCHY_TOP_TO_CAT = {
  food_and_drink: 'restauracio',
  eat_and_drink: 'restauracio',
  restaurant: 'restauracio',
  retail: 'comerc',
  shopping: 'comerc',
  travel_and_transportation: 'mobility',
  lodging: 'turisme',
  accommodation: 'turisme',
  hotel: 'turisme',
  attraction: 'turisme',
  tourism: 'turisme',
  health_and_medical: 'health',
  healthcare: 'health',
  medical: 'health',
  pharmacy: 'health',
  education: 'education',
  school: 'education',
  sport: 'sport',
  sports: 'sport',
  religion: 'religio',
  worship: 'religio',
  financial: 'finances',
  bank: 'finances',
  professional_services: 'serveis_pro',
  services: 'serveis_pro',
  government: 'serveis_pro',
  arts_and_entertainment: 'patrimoni',
  entertainment: 'patrimoni',
  museum: 'patrimoni',
  park: 'green',
  nature: 'green',
}

function guessAppCategory(basicCategory, hierarchyArr) {
  if (hierarchyArr?.length > 0) {
    const top = hierarchyArr[0]?.toLowerCase()
    if (top && HIERARCHY_TOP_TO_CAT[top]) return HIERARCHY_TOP_TO_CAT[top]
  }
  if (basicCategory) {
    const bc = basicCategory.toLowerCase()
    for (const [key, cat] of Object.entries(HIERARCHY_TOP_TO_CAT)) {
      if (bc.includes(key)) return cat
    }
  }
  return 'altres'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractName(props) {
  const names = props.names ?? props.name
  if (names && typeof names === 'object' && !Array.isArray(names)) {
    if (typeof names.primary === 'string') return names.primary
    const common = names.common
    if (Array.isArray(common) && common.length > 0) {
      const ca = common.find((n) => n.language === 'ca')?.value
      const es = common.find((n) => n.language === 'es')?.value
      const en = common.find((n) => n.language === 'en')?.value
      return ca ?? es ?? en ?? common[0]?.value ?? null
    }
  }
  if (typeof names === 'string') return names
  return props['name:ca'] ?? props['name:es'] ?? props['name:en'] ?? null
}

function extractAddress(props) {
  const addresses = props.addresses
  if (Array.isArray(addresses) && addresses.length > 0) {
    const addr = addresses[0]
    if (addr.freeform) return addr.freeform
    const parts = []
    if (addr.street_address) parts.push(addr.street_address)
    if (addr.postcode || addr.locality) parts.push([addr.postcode, addr.locality].filter(Boolean).join(' '))
    if (parts.length) return parts.join(' – ')
  }
  if (props['addr:full']) return props['addr:full']
  const street = props['addr:street']
  const num = props['addr:housenumber']
  if (street) {
    const line1 = num ? `${street}, ${num}` : street
    const line2 = [props['addr:postcode'], props['addr:city']].filter(Boolean).join(' ')
    return [line1, line2].filter(Boolean).join(' – ')
  }
  return null
}

function extractList(val) {
  if (!val) return null
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'string') return [val]
  return null
}
