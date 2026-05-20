/**
 * overtureTaxonomy.js
 *
 * Mapeig de la taxonomia d'Overture Maps Places → categories internes de l'app.
 *
 * Overture té tres camps principals:
 *   - basic_category:          ~280 valors simplificats (ex. "restaurant")
 *   - taxonomy.primary:        categoria específica (ex. "casual_dining_restaurant")
 *   - taxonomy.hierarchy:      array [general → específic] (ex. ["food_and_drink","restaurant","casual_dining_restaurant"])
 *   - taxonomy.alternate:      categories alternatives
 *
 * Schema antic (deprecated, encara present en alguns exports):
 *   - categories.primary / categories.alternate
 *
 * Prioritat de classificació:
 *   1. taxonomy.hierarchy[0] → appCategory (nivell general)
 *   2. basic_category → appCategory (si hierarchy no disponible)
 *   3. categories.primary → appCategory (schema antic)
 *   4. Fallback: 'altres'
 */

// ─── Mapeig nivell 0 de taxonomy.hierarchy → appCategory ────────────────────
// Valors de primer nivell de la jerarquia Overture (confirmats a la doc oficial)

const HIERARCHY_TOP_TO_CATEGORY = {
  food_and_drink:           'restauracio',
  food_and_beverage:        'restauracio',

  retail:                   'comerc',
  shopping:                 'comerc',
  convenience_store:        'comerc',

  health_and_medical:       'health',
  healthcare:               'health',
  medical:                  'health',

  education:                'education',
  school:                   'education',

  government_and_community: 'admin',
  government:               'admin',
  civic:                    'admin',

  arts_and_entertainment:   'culture',
  entertainment:            'culture',
  arts:                     'culture',

  sports_and_recreation:    'sport',
  sport:                    'sport',
  recreation:               'sport',

  travel_and_transportation: 'mobility',
  transportation:           'mobility',
  transit:                  'mobility',

  accommodation:            'turisme',
  lodging:                  'turisme',
  travel:                   'turisme',
  tourism:                  'turisme',

  professional_services:    'serveis_pro',
  business:                 'serveis_pro',
  services:                 'serveis_pro',

  financial_services:       'finances',
  finance:                  'finances',
  banking:                  'finances',

  religion:                 'religio',
  place_of_worship:         'religio',
  religious:                'religio',

  parks_and_outdoors:       'green',
  nature:                   'green',
  outdoor:                  'green',
  park:                     'green',

  landmarks_and_outdoors:   'patrimoni',
  landmark:                 'patrimoni',
  historic:                 'patrimoni',
  heritage:                 'patrimoni',
}

// ─── Mapeig basic_category → appCategory ────────────────────────────────────
// Cobreix els ~280 valors de basic_category d'Overture.
// Per a cada basic_category retorna { appCategory, appSubcategory }.

const BASIC_CATEGORY_MAP = {
  // ── Restauració ──────────────────────────────────────────────────────────────
  restaurant:          { c: 'restauracio', s: 'restauracio_restaurant' },
  casual_dining:       { c: 'restauracio', s: 'restauracio_restaurant' },
  fine_dining:         { c: 'restauracio', s: 'restauracio_restaurant' },
  fast_food:           { c: 'restauracio', s: 'restauracio_fastfood' },
  fast_casual:         { c: 'restauracio', s: 'restauracio_fastfood' },
  food_truck:          { c: 'restauracio', s: 'restauracio_fastfood' },
  pizza:               { c: 'restauracio', s: 'restauracio_restaurant' },
  burger:              { c: 'restauracio', s: 'restauracio_fastfood' },
  sandwich:            { c: 'restauracio', s: 'restauracio_fastfood' },
  sushi:               { c: 'restauracio', s: 'restauracio_restaurant' },
  chinese_restaurant:  { c: 'restauracio', s: 'restauracio_restaurant' },
  italian_restaurant:  { c: 'restauracio', s: 'restauracio_restaurant' },
  japanese_restaurant: { c: 'restauracio', s: 'restauracio_restaurant' },
  mexican_restaurant:  { c: 'restauracio', s: 'restauracio_restaurant' },
  indian_restaurant:   { c: 'restauracio', s: 'restauracio_restaurant' },
  thai_restaurant:     { c: 'restauracio', s: 'restauracio_restaurant' },
  cafe:                { c: 'restauracio', s: 'restauracio_cafe' },
  coffee_shop:         { c: 'restauracio', s: 'restauracio_cafe' },
  coffee:              { c: 'restauracio', s: 'restauracio_cafe' },
  tea_house:           { c: 'restauracio', s: 'restauracio_cafe' },
  bar:                 { c: 'restauracio', s: 'restauracio_bar' },
  pub:                 { c: 'restauracio', s: 'restauracio_bar' },
  wine_bar:            { c: 'restauracio', s: 'restauracio_bar' },
  cocktail_bar:        { c: 'restauracio', s: 'restauracio_bar' },
  brewery:             { c: 'restauracio', s: 'restauracio_bar' },
  bakery:              { c: 'restauracio', s: 'restauracio_pastisseria' },
  pastry_shop:         { c: 'restauracio', s: 'restauracio_pastisseria' },
  ice_cream:           { c: 'restauracio', s: 'restauracio_pastisseria' },
  food_court:          { c: 'restauracio', s: 'restauracio_altres' },
  catering:            { c: 'restauracio', s: 'restauracio_altres' },

  // ── Comerç ───────────────────────────────────────────────────────────────────
  grocery:             { c: 'comerc', s: 'comerc_supermercat' },
  supermarket:         { c: 'comerc', s: 'comerc_supermercat' },
  convenience_store:   { c: 'comerc', s: 'comerc_supermercat' },
  clothing_store:      { c: 'comerc', s: 'comerc_roba' },
  fashion:             { c: 'comerc', s: 'comerc_roba' },
  shoe_store:          { c: 'comerc', s: 'comerc_roba' },
  electronics_store:   { c: 'comerc', s: 'comerc_electronica' },
  computer_store:      { c: 'comerc', s: 'comerc_electronica' },
  phone_store:         { c: 'comerc', s: 'comerc_electronica' },
  pharmacy:            { c: 'comerc', s: 'comerc_farmacia' },
  drug_store:          { c: 'comerc', s: 'comerc_farmacia' },
  book_store:          { c: 'comerc', s: 'comerc_altres' },
  furniture_store:     { c: 'comerc', s: 'comerc_altres' },
  hardware_store:      { c: 'comerc', s: 'comerc_altres' },
  pet_store:           { c: 'comerc', s: 'comerc_altres' },
  florist:             { c: 'comerc', s: 'comerc_altres' },
  shopping_mall:       { c: 'comerc', s: 'comerc_altres' },
  department_store:    { c: 'comerc', s: 'comerc_altres' },
  toy_store:           { c: 'comerc', s: 'comerc_altres' },
  sporting_goods:      { c: 'comerc', s: 'comerc_altres' },
  jewelry_store:       { c: 'comerc', s: 'comerc_altres' },
  home_goods:          { c: 'comerc', s: 'comerc_altres' },
  gift_shop:           { c: 'comerc', s: 'comerc_altres' },
  antique_store:       { c: 'comerc', s: 'comerc_altres' },
  market:              { c: 'comerc', s: 'comerc_supermercat' },
  farmers_market:      { c: 'comerc', s: 'comerc_supermercat' },
  wine_shop:           { c: 'comerc', s: 'comerc_altres' },
  liquor_store:        { c: 'comerc', s: 'comerc_altres' },

  // ── Salut ────────────────────────────────────────────────────────────────────
  hospital:            { c: 'health', s: 'health_hospital' },
  emergency_room:      { c: 'health', s: 'health_hospital' },
  clinic:              { c: 'health', s: 'health_clinic' },
  medical_center:      { c: 'health', s: 'health_centre' },
  doctor:              { c: 'health', s: 'health_centre' },
  dentist:             { c: 'health', s: 'health_dentist' },
  dental_clinic:       { c: 'health', s: 'health_dentist' },
  veterinarian:        { c: 'health', s: 'health_vet' },
  optician:            { c: 'health', s: 'health_centre' },
  physiotherapy:       { c: 'health', s: 'health_centre' },
  mental_health:       { c: 'health', s: 'health_centre' },
  dialysis:            { c: 'health', s: 'health_centre' },
  nursing_home:        { c: 'health', s: 'health_centre' },
  blood_bank:          { c: 'health', s: 'health_centre' },

  // ── Educació ─────────────────────────────────────────────────────────────────
  school:              { c: 'education', s: 'edu_school' },
  primary_school:      { c: 'education', s: 'edu_school' },
  high_school:         { c: 'education', s: 'edu_school' },
  university:          { c: 'education', s: 'edu_university' },
  college:             { c: 'education', s: 'edu_college' },
  kindergarten:        { c: 'education', s: 'edu_kindergarten' },
  preschool:           { c: 'education', s: 'edu_kindergarten' },
  library:             { c: 'culture',   s: 'culture_library' },
  training_center:     { c: 'education', s: 'edu_college' },
  language_school:     { c: 'education', s: 'edu_college' },
  driving_school:      { c: 'education', s: 'edu_college' },

  // ── Cultura ──────────────────────────────────────────────────────────────────
  museum:              { c: 'culture', s: 'culture_museum' },
  art_gallery:         { c: 'culture', s: 'culture_gallery' },
  theater:             { c: 'culture', s: 'culture_theatre' },
  theatre:             { c: 'culture', s: 'culture_theatre' },
  cinema:              { c: 'culture', s: 'culture_cinema' },
  movie_theater:       { c: 'culture', s: 'culture_cinema' },
  concert_hall:        { c: 'culture', s: 'culture_arts' },
  cultural_center:     { c: 'culture', s: 'culture_arts' },
  opera:               { c: 'culture', s: 'culture_theatre' },

  // ── Esport ───────────────────────────────────────────────────────────────────
  gym:                 { c: 'sport', s: 'sport_gym' },
  fitness_center:      { c: 'sport', s: 'sport_gym' },
  sports_complex:      { c: 'sport', s: 'sport_centre' },
  stadium:             { c: 'sport', s: 'sport_centre' },
  swimming_pool:       { c: 'sport', s: 'sport_pool' },
  sports_hall:         { c: 'sport', s: 'sport_hall' },
  tennis_court:        { c: 'sport', s: 'sport_pitch' },
  golf_course:         { c: 'sport', s: 'sport_pitch' },
  bowling:             { c: 'sport', s: 'sport_hall' },
  climbing:            { c: 'sport', s: 'sport_centre' },
  yoga_studio:         { c: 'sport', s: 'sport_gym' },
  martial_arts:        { c: 'sport', s: 'sport_gym' },

  // ── Espais verds ─────────────────────────────────────────────────────────────
  park:                { c: 'green', s: 'green_park' },
  garden:              { c: 'green', s: 'green_garden' },
  nature_reserve:      { c: 'green', s: 'green_nature' },
  beach:               { c: 'green', s: 'green_nature' },
  forest:              { c: 'green', s: 'green_nature' },
  playground:          { c: 'green', s: 'green_playground' },
  zoo:                 { c: 'green', s: 'green_nature' },

  // ── Administració ────────────────────────────────────────────────────────────
  city_hall:           { c: 'admin', s: 'admin_townhall' },
  town_hall:           { c: 'admin', s: 'admin_townhall' },
  government_office:   { c: 'admin', s: 'admin_govt' },
  police:              { c: 'admin', s: 'admin_police' },
  fire_station:        { c: 'admin', s: 'admin_fire' },
  courthouse:          { c: 'admin', s: 'admin_court' },
  embassy:             { c: 'admin', s: 'admin_govt' },
  post_office:         { c: 'services', s: null },
  customs:             { c: 'admin', s: 'admin_govt' },

  // ── Turisme / allotjament ────────────────────────────────────────────────────
  hotel:               { c: 'turisme', s: 'turisme_hotel' },
  motel:               { c: 'turisme', s: 'turisme_hostal' },
  hostel:              { c: 'turisme', s: 'turisme_hostal' },
  inn:                 { c: 'turisme', s: 'turisme_hostal' },
  bed_and_breakfast:   { c: 'turisme', s: 'turisme_hostal' },
  resort:              { c: 'turisme', s: 'turisme_hotel' },
  campground:          { c: 'turisme', s: 'turisme_hostal' },
  tourist_attraction:  { c: 'turisme', s: 'turisme_atraccio' },
  theme_park:          { c: 'turisme', s: 'turisme_atraccio' },
  amusement_park:      { c: 'turisme', s: 'turisme_atraccio' },
  aquarium:            { c: 'turisme', s: 'turisme_atraccio' },
  visitor_center:      { c: 'turisme', s: 'turisme_atraccio' },

  // ── Mobilitat ─────────────────────────────────────────────────────────────────
  train_station:       { c: 'mobility', s: 'mobility_rail' },
  metro_station:       { c: 'mobility', s: 'mobility_rail' },
  subway_station:      { c: 'mobility', s: 'mobility_rail' },
  bus_station:         { c: 'mobility', s: 'mobility_bus' },
  bus_stop:            { c: 'mobility', s: 'mobility_bus' },
  airport:             { c: 'mobility', s: null },
  ferry_terminal:      { c: 'mobility', s: 'mobility_ferry' },
  parking:             { c: 'mobility', s: 'mobility_parking' },
  car_rental:          { c: 'mobility', s: null },
  gas_station:         { c: 'mobility', s: null },
  electric_vehicle_charging: { c: 'mobility', s: null },
  taxi:                { c: 'mobility', s: null },
  bike_share:          { c: 'mobility', s: 'mobility_bike' },

  // ── Serveis professionals ────────────────────────────────────────────────────
  lawyer:              { c: 'serveis_pro', s: 'serveis_pro_legal' },
  law_firm:            { c: 'serveis_pro', s: 'serveis_pro_legal' },
  accountant:          { c: 'serveis_pro', s: 'serveis_pro_altres' },
  real_estate:         { c: 'serveis_pro', s: 'serveis_pro_altres' },
  architect:           { c: 'serveis_pro', s: 'serveis_pro_altres' },
  marketing_agency:    { c: 'serveis_pro', s: 'serveis_pro_altres' },
  advertising_agency:  { c: 'serveis_pro', s: 'serveis_pro_altres' },
  consulting:          { c: 'serveis_pro', s: 'serveis_pro_altres' },
  travel_agency:       { c: 'serveis_pro', s: 'serveis_pro_altres' },
  insurance:           { c: 'finances',    s: 'finances_altres' },
  notary:              { c: 'serveis_pro', s: 'serveis_pro_legal' },
  hair_salon:          { c: 'serveis_pro', s: 'serveis_pro_altres' },
  barber:              { c: 'serveis_pro', s: 'serveis_pro_altres' },
  beauty_salon:        { c: 'serveis_pro', s: 'serveis_pro_altres' },
  spa:                 { c: 'serveis_pro', s: 'serveis_pro_altres' },
  dry_cleaning:        { c: 'serveis_pro', s: 'serveis_pro_altres' },
  laundry:             { c: 'serveis_pro', s: 'serveis_pro_altres' },
  car_repair:          { c: 'serveis_pro', s: 'serveis_pro_altres' },
  car_wash:            { c: 'serveis_pro', s: 'serveis_pro_altres' },
  printing:            { c: 'serveis_pro', s: 'serveis_pro_altres' },
  veterinary:          { c: 'health',      s: 'health_vet' },

  // ── Serveis financers ────────────────────────────────────────────────────────
  bank:                { c: 'finances', s: 'finances_banc' },
  atm:                 { c: 'finances', s: 'finances_atm' },
  credit_union:        { c: 'finances', s: 'finances_banc' },
  currency_exchange:   { c: 'finances', s: 'finances_altres' },

  // ── Religió ──────────────────────────────────────────────────────────────────
  church:              { c: 'religio', s: 'religio_esglesia' },
  cathedral:           { c: 'religio', s: 'religio_esglesia' },
  mosque:              { c: 'religio', s: 'religio_mesquita' },
  synagogue:           { c: 'religio', s: 'religio_sinagoga' },
  temple:              { c: 'religio', s: 'religio_altres' },
  place_of_worship:    { c: 'religio', s: 'religio_altres' },
  monastery:           { c: 'religio', s: 'religio_altres' },

  // ── Patrimoni ─────────────────────────────────────────────────────────────────
  monument:            { c: 'patrimoni', s: 'patrimoni_monument' },
  memorial:            { c: 'patrimoni', s: 'patrimoni_monument' },
  castle:              { c: 'patrimoni', s: 'patrimoni_castell' },
  palace:              { c: 'patrimoni', s: 'patrimoni_castell' },
  historic_site:       { c: 'patrimoni', s: 'patrimoni_lloc' },
  ruins:               { c: 'patrimoni', s: 'patrimoni_lloc' },
  viewpoint:           { c: 'patrimoni', s: 'patrimoni_lloc' },
  landmark:            { c: 'patrimoni', s: 'patrimoni_lloc' },
}

// ─── Funcions d'extracció del schema Overture ────────────────────────────────

/**
 * Extreu la taxonomia d'una feature Overture.
 * Suporta tant el schema nou (taxonomy.*) com l'antic (categories.*).
 */
export function extractOvertureTaxonomy(props) {
  // Schema nou (2024+)
  const tax = props.taxonomy
  if (tax) {
    const hierarchy = Array.isArray(tax.hierarchy) ? tax.hierarchy
      : (typeof tax.hierarchy === 'string' ? tax.hierarchy.split(' > ').map((s) => s.trim()) : null)
    return {
      basicCategory: props.basic_category ?? null,
      primary: tax.primary ?? null,
      hierarchy: hierarchy ?? [],
      alternate: Array.isArray(tax.alternate) ? tax.alternate : [],
      schema: 'new',
    }
  }

  // Schema antic
  const cats = props.categories
  if (cats) {
    const primary = cats.primary ?? null
    const alternate = Array.isArray(cats.alternate) ? cats.alternate : []
    return {
      basicCategory: primary,
      primary,
      hierarchy: primary ? [primary] : [],
      alternate,
      schema: 'legacy',
    }
  }

  // Res disponible
  return { basicCategory: null, primary: null, hierarchy: [], alternate: [], schema: 'none' }
}

/**
 * Classifica una feature Overture a la categoria/subcategoria interna.
 * Retorna { appCategory, appSubcategory }.
 */
export function classifyOvertureFeature(props) {
  const { basicCategory, hierarchy } = extractOvertureTaxonomy(props)

  // 1. Intentar via basic_category (mapeig explícit més precís)
  if (basicCategory) {
    const mapped = BASIC_CATEGORY_MAP[basicCategory]
    if (mapped) {
      return { appCategory: mapped.c, appSubcategory: mapped.s }
    }
  }

  // 2. Intentar via primer nivell de taxonomy.hierarchy
  const topLevel = hierarchy[0]
  if (topLevel) {
    const cat = HIERARCHY_TOP_TO_CATEGORY[topLevel]
    if (cat) {
      // Intentar trobar subcategoria via basic_category
      const sub = basicCategory ? (BASIC_CATEGORY_MAP[basicCategory]?.s ?? null) : null
      return { appCategory: cat, appSubcategory: sub }
    }
  }

  // 3. Fallback
  return { appCategory: 'altres', appSubcategory: 'altres_altres' }
}

/**
 * Comprova si una feature Overture coincideix amb un filtre de jerarquia.
 * Útil per als filtres avançats.
 *
 * @param {object} props  Feature properties
 * @param {string} term   Terme a buscar (basic_category, primary, o qualsevol nivell de hierarchy)
 */
export function overtureMatchesHierarchyFilter(props, term) {
  if (!term) return true
  const { basicCategory, primary, hierarchy, alternate } = extractOvertureTaxonomy(props)
  const lc = term.toLowerCase()
  if (basicCategory?.toLowerCase() === lc) return true
  if (primary?.toLowerCase() === lc) return true
  if (hierarchy.some((h) => h.toLowerCase() === lc)) return true
  if (alternate.some((a) => a.toLowerCase() === lc)) return true
  return false
}

/**
 * Retorna la jerarquia formatada per a mostrar en popup/taula.
 * Ex: "food_and_drink > restaurant > casual_dining_restaurant"
 */
export function formatOvertureHierarchy(props) {
  const { hierarchy } = extractOvertureTaxonomy(props)
  return hierarchy.length > 0 ? hierarchy.join(' › ') : null
}
