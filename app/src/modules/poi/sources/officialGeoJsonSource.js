/**
 * officialGeoJsonSource.js
 *
 * Connector per a fonts oficials de dades en format GeoJSON.
 * Permet configurar quins camps del GeoJSON corresponen als camps interns.
 *
 * Exemple d'ús:
 *   const config = {
 *     idField: 'CODEQUIP',
 *     nameField: 'NOM',
 *     categoryField: 'TIPUS',
 *     subcategoryField: 'SUBTIPUS',
 *     addressField: 'ADRECA',
 *     appCategory: 'health',       // categoria interna forçada (opcional)
 *     appSubcategory: null,        // subcategoria interna forçada (opcional)
 *   }
 *   const { features } = loadOfficialGeoJson(text, config)
 */

import { APP_CATEGORY_BY_ID, OVERTURE_SUBCAT_BY_ID } from '../appCategoryRegistry.js'
import { OSM_CATEGORY_BY_ID, OSM_SUBCATEGORY_BY_ID } from '../../osm/osmPoiCategories.js'

function getCategoryDef(catId) {
  return APP_CATEGORY_BY_ID[catId] ?? OSM_CATEGORY_BY_ID[catId] ?? null
}

function getSubcategoryDef(subcatId) {
  return OVERTURE_SUBCAT_BY_ID[subcatId] ?? OSM_SUBCATEGORY_BY_ID[subcatId] ?? null
}

/**
 * @typedef {object} OfficialSourceConfig
 * @property {string}  [idField]           Camp de l'ID únic
 * @property {string}  [nameField]         Camp del nom
 * @property {string}  [categoryField]     Camp de la categoria (mapejat a poi_category)
 * @property {string}  [subcategoryField]  Camp de la subcategoria
 * @property {string}  [addressField]      Camp de l'adreça
 * @property {string}  [phoneField]        Camp del telèfon
 * @property {string}  [websiteField]      Camp del web
 * @property {string}  [appCategory]       Categoria interna forçada per a tots els elements
 * @property {string}  [appSubcategory]    Subcategoria interna forçada per a tots els elements
 * @property {string}  [categoryMapping]   Objecte {valorOriginal: appCategoryId}
 */

/**
 * Normalitza una feature d'una font oficial al model intern.
 */
export function normalizeOfficialFeature(rawFeature, config = {}, index = 0) {
  if (!rawFeature?.geometry) return null
  const geom = rawFeature.geometry

  let coordinates = null
  if (geom.type === 'Point') {
    coordinates = geom.coordinates
  } else if (geom.type === 'MultiPoint') {
    coordinates = geom.coordinates[0]
  } else {
    // Per a polígons, usar centroide aproximat (bbox center)
    return null
  }

  if (!coordinates || coordinates.length < 2) return null

  const props = rawFeature.properties ?? {}

  // ── Resolució de categoria ──────────────────────────────────────────────────
  let appCategory = config.appCategory ?? null
  let appSubcategory = config.appSubcategory ?? null

  if (!appCategory && config.categoryField) {
    const rawCat = props[config.categoryField]
    if (rawCat != null) {
      const mapping = config.categoryMapping ?? {}
      appCategory = mapping[String(rawCat)] ?? String(rawCat).toLowerCase().replace(/\s+/g, '_')
    }
  }

  if (!appSubcategory && config.subcategoryField) {
    const rawSub = props[config.subcategoryField]
    if (rawSub != null) {
      appCategory = appCategory ?? 'altres'
      appSubcategory = `${appCategory}_${String(rawSub).toLowerCase().replace(/\s+/g, '_')}`
    }
  }

  appCategory = appCategory ?? 'altres'
  appSubcategory = appSubcategory ?? appCategory

  const catDef = getCategoryDef(appCategory)
  const subDef = getSubcategoryDef(appSubcategory)

  // ── Extracció de camps ──────────────────────────────────────────────────────
  const id = config.idField ? (props[config.idField] ?? `official_${index}`) : `official_${index}`
  const name = config.nameField ? (props[config.nameField] ?? null) : (props.name ?? props.NOM ?? props.NOMBRE ?? null)
  const address = config.addressField ? (props[config.addressField] ?? null) : (props.address ?? props.ADRECA ?? props.DIRECCION ?? null)
  const phone = config.phoneField ? (props[config.phoneField] ?? null) : (props.phone ?? props.TELEFON ?? null)
  const website = config.websiteField ? (props[config.websiteField] ?? null) : (props.website ?? props.WEB ?? null)

  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: {
      poi_source:            'official',
      poi_id:                String(id),

      poi_category:          appCategory,
      poi_subcategory:       appSubcategory,
      poi_category_label:    catDef?.label ?? appCategory,
      poi_subcategory_label: subDef?.label ?? appSubcategory,
      poi_icon:              subDef?.icon ?? catDef?.icon ?? '📍',
      poi_color:             subDef?.color ?? catDef?.color ?? '#94a3b8',

      name:                  name ?? '',
      address,
      phone,
      website,
      operator:              null,

      // Totes les propietats originals (per a taula de dades i exportació)
      official_source_category:    config.categoryField ? (props[config.categoryField] ?? null) : null,
      official_source_subcategory: config.subcategoryField ? (props[config.subcategoryField] ?? null) : null,

      // Propietats originals accessibles també
      ...Object.fromEntries(
        Object.entries(props).map(([k, v]) => [`src_${k}`, v])
      ),
    },
  }
}

/**
 * Carrega un GeoJSON oficial i el normalitza al model intern.
 *
 * @param {string} geojsonText
 * @param {OfficialSourceConfig} config
 * @returns {{ features: Feature[], skipped: number, total: number }}
 */
export function loadOfficialGeoJson(geojsonText, config = {}) {
  let parsed
  try {
    parsed = JSON.parse(geojsonText)
  } catch {
    throw new Error('El fitxer no és un JSON vàlid.')
  }

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

  const features = []
  let skipped = 0

  for (let i = 0; i < rawFeatures.length; i++) {
    const feat = normalizeOfficialFeature(rawFeatures[i], config, i)
    if (!feat) { skipped++; continue }
    features.push(feat)
  }

  return { features, skipped, total: rawFeatures.length }
}
