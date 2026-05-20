/**
 * overtureSource.js
 *
 * Connector per a Overture Maps Places.
 *
 * Com que Overture no té una API pública gratuïta per a consultes per bbox,
 * aquest connector carrega un GeoJSON local pre-exportat amb:
 *
 *   overturemaps download --bbox <west,south,east,north> -f geojson --type places -o places.geojson
 *
 * La interfície `fetchByBbox` és un stub per a ús futur quan existeixi un backend.
 *
 * Propietats generades en cada feature normalitzada:
 *   poi_source:              'overture'
 *   poi_category:            app category ID (ex. 'restauracio')
 *   poi_subcategory:         app subcategory ID (ex. 'restauracio_restaurant') | null
 *   poi_category_label:      etiqueta de categoria
 *   poi_subcategory_label:   etiqueta de subcategoria | null
 *   poi_icon:                emoji de la subcategoria/categoria
 *   poi_color:               color hex
 *   name:                    nom principal
 *   address:                 adreça formatada
 *   phone:                   primer telèfon
 *   website:                 primer web
 *   operator:                marca o operador
 *   overture_id:             ID original Overture
 *   overture_basic_category: basic_category
 *   overture_primary:        taxonomy.primary
 *   overture_hierarchy:      jerarquia formatada (text, ' › ' separator)
 *   overture_hierarchy_arr:  jerarquia com a JSON array string
 *   overture_alternate:      categories alternatives (text, ', ' separator)
 *   overture_confidence:     número 0-1
 *   overture_operating_status: estat operatiu
 *   overture_dataset:        dataset d'origen (de sources[])
 */

import {
  classifyOvertureFeature,
  extractOvertureTaxonomy,
  formatOvertureHierarchy,
} from '../overtureTaxonomy.js'
import { APP_CATEGORY_BY_ID, OVERTURE_SUBCAT_BY_ID } from '../appCategoryRegistry.js'

// ─── Extracció de camps Overture ─────────────────────────────────────────────

function extractName(props) {
  return (
    props['names.primary'] ??
    props.names?.primary ??
    props.name ??
    null
  )
}

function extractAddress(props) {
  // Overture address array
  const addrs = props['addresses'] ?? props.addresses ?? []
  const first = Array.isArray(addrs) ? addrs[0] : (typeof addrs === 'object' ? addrs : null)
  if (!first) return null

  if (first.freeform) return first.freeform

  const parts = []
  if (first.locality) parts.push(first.locality)
  if (first.postcode) parts.push(first.postcode)
  if (first.region) parts.push(first.region)
  if (first.country) parts.push(first.country)
  return parts.join(', ') || null
}

function extractPhone(props) {
  const phones = props.phones ?? []
  return Array.isArray(phones) ? (phones[0] ?? null) : (typeof phones === 'string' ? phones : null)
}

function extractWebsite(props) {
  const webs = props.websites ?? props.socials ?? []
  return Array.isArray(webs) ? (webs[0] ?? null) : (typeof webs === 'string' ? webs : null)
}

function extractBrand(props) {
  return (
    props['brand.names.primary'] ??
    props.brand?.names?.primary ??
    props.brand?.name ??
    null
  )
}

function extractDataset(props) {
  const sources = props.sources ?? []
  if (!Array.isArray(sources) || sources.length === 0) return null
  return sources.map((s) => s.dataset ?? '').filter(Boolean).join(', ') || null
}

// ─── Normalitzador principal ──────────────────────────────────────────────────

/**
 * Normalitza una feature GeoJSON d'Overture al model intern de l'app.
 * Retorna null si la feature no té geometria Point vàlida.
 */
export function normalizeOvertureFeature(rawFeature, index = 0) {
  if (!rawFeature?.geometry) return null

  const geom = rawFeature.geometry
  // Overture és sempre Point, però el GeoJSON exportat pot tenir MultiPoint en casos rars
  let coordinates = null
  if (geom.type === 'Point') {
    coordinates = geom.coordinates
  } else if (geom.type === 'MultiPoint') {
    coordinates = geom.coordinates[0]
  } else {
    return null // ignorar geometries no-Point
  }

  if (!Array.isArray(coordinates) || coordinates.length < 2) return null

  const props = rawFeature.properties ?? {}

  // ── Taxonomia ──────────────────────────────────────────────────────────────
  const { basicCategory, primary, hierarchy, alternate, schema } = extractOvertureTaxonomy(props)
  const { appCategory, appSubcategory } = classifyOvertureFeature(props)

  const catDef = APP_CATEGORY_BY_ID[appCategory]
  const subDef = appSubcategory ? OVERTURE_SUBCAT_BY_ID[appSubcategory] : null

  // Fallback a la definició de categoria si la subcategoria no té definició pròpia
  const icon = subDef?.icon ?? catDef?.icon ?? '📍'
  const color = subDef?.color ?? catDef?.color ?? '#94a3b8'

  // ── Metadades ──────────────────────────────────────────────────────────────
  const name = extractName(props)
  const address = extractAddress(props)
  const phone = extractPhone(props)
  const website = extractWebsite(props)
  const brand = extractBrand(props)
  const dataset = extractDataset(props)

  const overtureId = props.id ?? props['@id'] ?? `overture_${index}`
  const confidence = typeof props.confidence === 'number' ? props.confidence : null
  const operatingStatus = props.operating_status ?? props['operating_status'] ?? null

  const hierarchyText = hierarchy.length > 0 ? hierarchy.join(' › ') : null

  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: {
      // ── Identificació interna ──────────────────────────────────────
      poi_source:              'overture',
      poi_id:                  overtureId,

      // ── Classificació app (llegenda, estil, filtres generals) ──────
      poi_category:            appCategory,
      poi_subcategory:         appSubcategory ?? appCategory,
      poi_category_label:      catDef?.label ?? appCategory,
      poi_subcategory_label:   subDef?.label ?? catDef?.label ?? appCategory,
      poi_icon:                icon,
      poi_color:               color,

      // ── Camps de visualització ─────────────────────────────────────
      name:                    name ?? '',
      address:                 address,
      phone:                   phone,
      website:                 website,
      operator:                brand,

      // ── Taxonomia Overture (per popup, taula i filtres avançats) ───
      overture_id:             overtureId,
      overture_basic_category: basicCategory,
      overture_primary:        primary,
      overture_hierarchy:      hierarchyText,
      overture_hierarchy_arr:  hierarchy.length > 0 ? JSON.stringify(hierarchy) : null,
      overture_alternate:      alternate.length > 0 ? alternate.join(', ') : null,
      overture_confidence:     confidence,
      overture_operating_status: operatingStatus,
      overture_dataset:        dataset,
      overture_schema:         schema,
    },
  }
}

// ─── Carregador de GeoJSON local ──────────────────────────────────────────────

/**
 * Carrega i normalitza un GeoJSON d'Overture a partir del text del fitxer.
 *
 * @param {string} geojsonText   Contingut del fitxer .geojson
 * @param {string[]} [catFilter] Si s'especifica, filtra per appCategory
 * @returns {{ features: Feature[], skipped: number, total: number }}
 */
export function loadOvertureGeoJson(geojsonText, catFilter = null) {
  let parsed
  try {
    parsed = JSON.parse(geojsonText)
  } catch {
    throw new Error('El fitxer no és un JSON vàlid.')
  }

  // Accepta FeatureCollection, Feature o array de features
  let rawFeatures = []
  if (parsed?.type === 'FeatureCollection') {
    rawFeatures = parsed.features ?? []
  } else if (parsed?.type === 'Feature') {
    rawFeatures = [parsed]
  } else if (Array.isArray(parsed)) {
    rawFeatures = parsed
  } else {
    throw new Error('Format no reconegut. S\'espera un GeoJSON FeatureCollection.')
  }

  const normalized = []
  let skipped = 0

  for (let i = 0; i < rawFeatures.length; i++) {
    const feat = normalizeOvertureFeature(rawFeatures[i], i)
    if (!feat) { skipped++; continue }

    // Filtre de categoria opcional
    if (catFilter && catFilter.length > 0 && !catFilter.includes(feat.properties.poi_category)) {
      skipped++
      continue
    }

    normalized.push(feat)
  }

  return {
    features: normalized,
    skipped,
    total: rawFeatures.length,
  }
}

/**
 * Stub per a futur endpoint de backend.
 * Quan existeixi un servidor que accepte bbox + categories, implementar aquí.
 */
export async function fetchOverturePoisByBbox({ bbox, categories, signal } = {}) {
  void bbox; void categories; void signal
  throw new Error(
    'La consulta per bbox requereix un backend. Exporta les dades amb el CLI d\'Overture i carrega el fitxer GeoJSON.',
  )
}
