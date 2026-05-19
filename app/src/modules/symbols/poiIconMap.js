/**
 * poiIconMap.js
 *
 * Maps each POI subcategory ID to a Tabler Icons name (kebab-case).
 * All names have been verified to exist in the installed @tabler/icons-react version.
 * Fallback for any unmapped subcategory: 'map-pin'.
 */

export const POI_ICON_MAP = {
  // ── Salut ──────────────────────────────────────────────────────────────────
  health_hospital: 'building-hospital',
  health_centre:   'stethoscope',
  health_clinic:   'heart-plus',
  health_pharmacy: 'pill',
  health_dentist:  'cross',
  health_vet:      'paw',

  // ── Educació ───────────────────────────────────────────────────────────────
  edu_kindergarten: 'baby-carriage',
  edu_school:       'school',
  edu_college:      'books',
  edu_university:   'school',

  // ── Cultura ────────────────────────────────────────────────────────────────
  culture_museum:  'photo',
  culture_library: 'library',
  culture_theatre: 'theater',
  culture_cinema:  'movie',
  culture_arts:    'palette',
  culture_gallery: 'photo',

  // ── Esport ─────────────────────────────────────────────────────────────────
  sport_pool:    'pool',
  sport_centre:  'building-stadium',
  sport_hall:    'activity',
  sport_gym:     'barbell',
  sport_pitch:   'ball-football',

  // ── Zones verdes ───────────────────────────────────────────────────────────
  green_park:       'tree',
  green_garden:     'flower',
  green_nature:     'trees',
  green_playground: 'run',

  // ── Administració ──────────────────────────────────────────────────────────
  admin_townhall: 'building-community',
  admin_police:   'shield-check',
  admin_court:    'scale',
  admin_fire:     'firetruck',
  admin_govt:     'building',

  // ── Mobilitat ──────────────────────────────────────────────────────────────
  mobility_rail:    'train',
  mobility_bus:     'bus-stop',
  mobility_parking: 'parking',
  mobility_bike:    'bike',
  mobility_ferry:   'anchor',

  // ── Serveis bàsics ─────────────────────────────────────────────────────────
  services_bank:   'building-bank',
  services_post:   'mail',
  services_market: 'shopping-cart',
  services_super:  'shopping-cart',
  services_fuel:   'gas-station',
}

export const POI_ICON_FALLBACK = 'map-pin'

/** Resolve a Tabler icon name for a given subcategory ID. */
export function getPoiTablerIcon(subcategoryId) {
  return POI_ICON_MAP[subcategoryId] ?? POI_ICON_FALLBACK
}
