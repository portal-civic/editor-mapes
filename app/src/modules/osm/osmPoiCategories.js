/**
 * osmPoiCategories.js — hierarchical POI category definitions.
 *
 * OSM_POI_CATEGORIES: top-level categories (for UI grouping and styling)
 * OSM_POI_SUBCATEGORIES: specific types with OSM tag filters
 */

export const OSM_POI_CATEGORIES = [
  { id: 'health',    label: 'Salut',          icon: '🏥', color: '#e74c3c' },
  { id: 'education', label: 'Educació',        icon: '🏫', color: '#3498db' },
  { id: 'culture',   label: 'Cultura',         icon: '🎭', color: '#9b59b6' },
  { id: 'sport',     label: 'Esport',          icon: '⚽', color: '#27ae60' },
  { id: 'green',     label: 'Zones verdes',    icon: '🌳', color: '#2ecc71' },
  { id: 'admin',     label: 'Administració',   icon: '🏛️', color: '#e67e22' },
  { id: 'mobility',  label: 'Mobilitat',       icon: '🚉', color: '#1abc9c' },
  { id: 'services',  label: 'Serveis bàsics',  icon: '🏪', color: '#f39c12' },
]

export const OSM_POI_SUBCATEGORIES = [
  // ── Salut ──────────────────────────────────────────────────────────────────
  { id: 'health_hospital',  categoryId: 'health', label: 'Hospitals',        icon: '🏥', color: '#dc2626',
    tags: [{ key: 'amenity', value: 'hospital' }] },
  { id: 'health_centre',    categoryId: 'health', label: 'Centres de salut', icon: '🩺', color: '#ef4444',
    tags: [{ key: 'amenity', value: 'health_centre' }, { key: 'amenity', value: 'doctors' }] },
  { id: 'health_clinic',    categoryId: 'health', label: 'Clíniques',        icon: '🏨', color: '#f97316',
    tags: [{ key: 'amenity', value: 'clinic' }] },
  { id: 'health_pharmacy',  categoryId: 'health', label: 'Farmàcies',        icon: '💊', color: '#e879a0',
    tags: [{ key: 'amenity', value: 'pharmacy' }] },
  { id: 'health_dentist',   categoryId: 'health', label: 'Dentistes',        icon: '🦷', color: '#64748b',
    tags: [{ key: 'amenity', value: 'dentist' }] },
  { id: 'health_vet',       categoryId: 'health', label: 'Veterinaris',      icon: '🐾', color: '#c084a0',
    tags: [{ key: 'amenity', value: 'veterinary' }] },

  // ── Educació ───────────────────────────────────────────────────────────────
  { id: 'edu_kindergarten', categoryId: 'education', label: 'Infantil',        icon: '🧸', color: '#93c5fd',
    tags: [{ key: 'amenity', value: 'kindergarten' }] },
  { id: 'edu_school',       categoryId: 'education', label: 'Primàries i ESO', icon: '🏫', color: '#3b82f6',
    tags: [{ key: 'amenity', value: 'school' }] },
  { id: 'edu_college',      categoryId: 'education', label: 'FP i formació',   icon: '📚', color: '#2563eb',
    tags: [{ key: 'amenity', value: 'college' }] },
  { id: 'edu_university',   categoryId: 'education', label: 'Universitats',    icon: '🎓', color: '#1d4ed8',
    tags: [{ key: 'amenity', value: 'university' }] },

  // ── Cultura ────────────────────────────────────────────────────────────────
  { id: 'culture_museum',   categoryId: 'culture', label: 'Museus',            icon: '🏛️', color: '#7c3aed',
    tags: [{ key: 'tourism', value: 'museum' }] },
  { id: 'culture_library',  categoryId: 'culture', label: 'Biblioteques',      icon: '📚', color: '#8b5cf6',
    tags: [{ key: 'amenity', value: 'library' }] },
  { id: 'culture_theatre',  categoryId: 'culture', label: 'Teatres',           icon: '🎭', color: '#a78bfa',
    tags: [{ key: 'amenity', value: 'theatre' }] },
  { id: 'culture_cinema',   categoryId: 'culture', label: 'Cinemes',           icon: '🎬', color: '#c084fc',
    tags: [{ key: 'amenity', value: 'cinema' }] },
  { id: 'culture_arts',     categoryId: 'culture', label: 'Centres culturals', icon: '🎨', color: '#e879f9',
    tags: [{ key: 'amenity', value: 'arts_centre' }, { key: 'amenity', value: 'community_centre' }] },
  { id: 'culture_gallery',  categoryId: 'culture', label: 'Galeries d\'art',   icon: '🖼️', color: '#d946ef',
    tags: [{ key: 'tourism', value: 'gallery' }] },

  // ── Esport ─────────────────────────────────────────────────────────────────
  { id: 'sport_pool',    categoryId: 'sport', label: 'Piscines',        icon: '🏊', color: '#0ea5e9',
    tags: [{ key: 'leisure', value: 'swimming_pool' }] },
  { id: 'sport_centre',  categoryId: 'sport', label: 'Poliesportius',   icon: '🏟️', color: '#16a34a',
    tags: [{ key: 'leisure', value: 'sports_centre' }, { key: 'leisure', value: 'stadium' }] },
  { id: 'sport_hall',    categoryId: 'sport', label: 'Pavellons',       icon: '🏀', color: '#15803d',
    tags: [{ key: 'leisure', value: 'sports_hall' }] },
  { id: 'sport_gym',     categoryId: 'sport', label: 'Gimnasos',        icon: '🏋️', color: '#166534',
    tags: [{ key: 'leisure', value: 'fitness_centre' }] },
  { id: 'sport_pitch',   categoryId: 'sport', label: 'Camps esportius', icon: '⚽', color: '#4ade80',
    tags: [{ key: 'leisure', value: 'pitch' }, { key: 'leisure', value: 'track' }] },

  // ── Zones verdes ───────────────────────────────────────────────────────────
  { id: 'green_park',       categoryId: 'green', label: 'Parcs',             icon: '🌳', color: '#16a34a',
    tags: [{ key: 'leisure', value: 'park' }] },
  { id: 'green_garden',     categoryId: 'green', label: 'Jardins',           icon: '🌹', color: '#4ade80',
    tags: [{ key: 'leisure', value: 'garden' }] },
  { id: 'green_nature',     categoryId: 'green', label: 'Reserves naturals', icon: '🦌', color: '#86efac',
    tags: [{ key: 'leisure', value: 'nature_reserve' }] },
  { id: 'green_playground', categoryId: 'green', label: 'Zones de jocs',    icon: '🛝', color: '#bbf7d0',
    tags: [{ key: 'leisure', value: 'playground' }] },

  // ── Administració ──────────────────────────────────────────────────────────
  { id: 'admin_townhall', categoryId: 'admin', label: 'Ajuntaments',   icon: '🏛️', color: '#ea580c',
    tags: [{ key: 'amenity', value: 'townhall' }] },
  { id: 'admin_police',   categoryId: 'admin', label: 'Policia',       icon: '👮', color: '#1d4ed8',
    tags: [{ key: 'amenity', value: 'police' }] },
  { id: 'admin_court',    categoryId: 'admin', label: 'Jutjats',       icon: '⚖️', color: '#92400e',
    tags: [{ key: 'amenity', value: 'courthouse' }] },
  { id: 'admin_fire',     categoryId: 'admin', label: 'Bombers',       icon: '🚒', color: '#dc2626',
    tags: [{ key: 'amenity', value: 'fire_station' }] },
  { id: 'admin_govt',     categoryId: 'admin', label: 'Administració', icon: '🏢', color: '#f97316',
    tags: [{ key: 'office', value: 'government' }, { key: 'amenity', value: 'embassy' }] },

  // ── Mobilitat ──────────────────────────────────────────────────────────────
  { id: 'mobility_rail',    categoryId: 'mobility', label: 'Estacions tren/metro', icon: '🚉', color: '#0369a1',
    tags: [{ key: 'railway', value: 'station' }, { key: 'railway', value: 'halt' }] },
  { id: 'mobility_bus',     categoryId: 'mobility', label: 'Estacions bus',        icon: '🚌', color: '#0284c7',
    tags: [{ key: 'amenity', value: 'bus_station' }] },
  { id: 'mobility_parking', categoryId: 'mobility', label: 'Aparcaments',          icon: '🅿️', color: '#0ea5e9',
    tags: [{ key: 'amenity', value: 'parking' }] },
  { id: 'mobility_bike',    categoryId: 'mobility', label: 'Aparcaments bici',     icon: '🚲', color: '#38bdf8',
    tags: [{ key: 'amenity', value: 'bicycle_parking' }] },
  { id: 'mobility_ferry',   categoryId: 'mobility', label: 'Ports i ferries',      icon: '⛴️', color: '#0c4a6e',
    tags: [{ key: 'amenity', value: 'ferry_terminal' }] },

  // ── Serveis bàsics ─────────────────────────────────────────────────────────
  { id: 'services_bank',   categoryId: 'services', label: 'Bancs i caixers', icon: '🏦', color: '#b45309',
    tags: [{ key: 'amenity', value: 'bank' }, { key: 'amenity', value: 'atm' }] },
  { id: 'services_post',   categoryId: 'services', label: 'Correus',         icon: '📬', color: '#d97706',
    tags: [{ key: 'amenity', value: 'post_office' }] },
  { id: 'services_market', categoryId: 'services', label: 'Mercats',         icon: '🏪', color: '#f59e0b',
    tags: [{ key: 'amenity', value: 'marketplace' }] },
  { id: 'services_super',  categoryId: 'services', label: 'Supermercats',    icon: '🛒', color: '#fbbf24',
    tags: [{ key: 'shop', value: 'supermarket' }, { key: 'shop', value: 'mall' }] },
  { id: 'services_fuel',   categoryId: 'services', label: 'Gasolineres',     icon: '⛽', color: '#78716c',
    tags: [{ key: 'amenity', value: 'fuel' }] },
]

/** Map from category id → category object */
export const OSM_CATEGORY_BY_ID = Object.fromEntries(
  OSM_POI_CATEGORIES.map((cat) => [cat.id, cat]),
)

/** Map from subcategory id → subcategory object */
export const OSM_SUBCATEGORY_BY_ID = Object.fromEntries(
  OSM_POI_SUBCATEGORIES.map((sub) => [sub.id, sub]),
)

/** Get all subcategories for a given category id */
export function getSubcategoriesForCategory(categoryId) {
  return OSM_POI_SUBCATEGORIES.filter((s) => s.categoryId === categoryId)
}
