/**
 * mergedSource.js — STUB
 *
 * Fusió i deduplicació de punts d'interès de múltiples fonts (OSM + Overture).
 *
 * ESTAT: pendent d'implementació. L'algorisme requereix validació amb dades reals.
 *
 * ─── ALGORISME PREVIST ──────────────────────────────────────────────────────────
 *
 * Fase 1: Càrrega
 *   - Obtenir features d'OSM (via fetchOsmPois)
 *   - Obtenir features d'Overture (via loadOvertureGeoJson)
 *
 * Fase 2: Candidats a duplicat (per bbox + nom)
 *   Per a cada feature Overture:
 *     1. Construir un bbox de 30-50 metres al voltant del punt
 *     2. Filtrar features OSM dins d'aquest bbox
 *     3. Calcular similitud de nom (Levenshtein normalitzat)
 *        - > 0.85 similitud I mateixa categoria → candidat fort
 *        - > 0.60 similitud I mateixa categoria → candidat feble
 *        - Posició idèntica però nom diferent → possible duplicat, NO fusionar
 *
 * Fase 3: Decisió de fusió
 *   - Candidat fort: fusionar, conservant totes dues fonts en `poi_sources[]`
 *   - Candidat feble: marcar com a `poi_merge_candidate: true`, NO fusionar
 *   - Equipaments públics (salut, educació, admin): conservadors, no fusionar si dubte
 *   - Sense candidat: afegir com a nou punt
 *
 * Fase 4: Construcció del POI fusionat
 *   {
 *     poi_source: 'merged',
 *     poi_sources: ['osm', 'overture'],    // fonts originals
 *     name: <solapament o preferència>,
 *     // Tags OSM originals preservats
 *     osm_type, osm_id, amenity, shop, ...
 *     // Taxonomia Overture preservada
 *     overture_basic_category, overture_hierarchy, overture_confidence, ...
 *     // Categoria interna (de la millor font)
 *     poi_category, poi_subcategory, ...
 *   }
 *
 * Fase 5: Neteja
 *   - Eliminar duplicats evidents (mateixa posició exacta, mateixa categoria)
 *   - Afegir `poi_merge_candidates: [...]` per als casos ambigus
 *
 * ─── DECISIÓ DE PRIORITAT DE CAMPS ──────────────────────────────────────────────
 *   - nom:      OSM (nom:ca > nom:es > name) si disponible, sinó Overture names.primary
 *   - adreça:   Overture (més estructurada) si disponible, sinó OSM
 *   - web:      Overture si disponible, sinó OSM
 *   - telèfon:  Overture si disponible, sinó OSM
 *   - categoria: Overture (taxonomia rica) per a visualització, OSM per a filtres OSM
 *
 * ─── INTERFÍCIE ESPERADA ─────────────────────────────────────────────────────────
 */

/**
 * @param {object} params
 * @param {object[]} params.osmFeatures      Features normalitzades d'OSM
 * @param {object[]} params.overtureFeatures Features normalitzades d'Overture
 * @param {object}  [params.options]
 * @param {number}  [params.options.distanceThresholdM=40]  Radi de dedup en metres
 * @param {number}  [params.options.nameSimThreshold=0.80]  Similitud de nom mínima per a fusió
 * @param {boolean} [params.options.conservativeForPublic=true]  Conservador per a salut/educació/admin
 * @returns {{ features: object[], mergeReport: object }}
 */
export async function mergePoisFromSources({ osmFeatures, overtureFeatures, options = {} } = {}) {
  // TODO: implementar
  void osmFeatures; void overtureFeatures; void options
  throw new Error(
    'mergedSource: pendent d\'implementació. Combina les capes OSM i Overture manualment per ara.',
  )
}

export default { mergePoisFromSources }
