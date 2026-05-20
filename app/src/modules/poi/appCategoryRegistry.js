/**
 * appCategoryRegistry.js
 *
 * Registre unificat de categories internes de l'aplicació.
 * Inclou les 8 categories OSM originals (IDs conservats per compatibilitat)
 * i 8 categories noves per a dades Overture Maps i fonts oficials.
 *
 * Les capes OSM existents continuen usant els IDs originals (health, education…)
 * sense cap migraci ó. Les noves categories s'activen per a capes Overture/oficial.
 */

// ─── Categories (top level) ──────────────────────────────────────────────────

export const APP_CATEGORIES = [
  // ── Originals OSM (IDs conservats) ──────────────────────────────────────────
  { id: 'health',      label: 'Salut',                          icon: '🏥', color: '#dc2626', tablerIcon: 'stethoscope' },
  { id: 'education',   label: 'Educació',                       icon: '🏫', color: '#3b82f6', tablerIcon: 'school' },
  { id: 'culture',     label: 'Cultura',                        icon: '🎭', color: '#9b59b6', tablerIcon: 'photo' },
  { id: 'sport',       label: 'Esport i oci',                   icon: '⚽', color: '#16a34a', tablerIcon: 'ball-football' },
  { id: 'green',       label: 'Espais verds i natura',          icon: '🌳', color: '#22c55e', tablerIcon: 'tree' },
  { id: 'admin',       label: 'Administració pública',          icon: '🏛️', color: '#7c3aed', tablerIcon: 'building' },
  { id: 'mobility',    label: 'Mobilitat i transport',          icon: '🚉', color: '#06b6d4', tablerIcon: 'bus' },
  { id: 'services',    label: 'Serveis generals',               icon: '🏪', color: '#f59e0b', tablerIcon: 'tools' },
  // ── Noves (Overture / fonts oficials) ────────────────────────────────────────
  { id: 'restauracio', label: 'Alimentació i restauració',      icon: '🍽️', color: '#e63946', tablerIcon: 'tools-kitchen-2' },
  { id: 'comerc',      label: 'Comerç',                         icon: '🛍️', color: '#fb8500', tablerIcon: 'shopping-bag' },
  { id: 'turisme',     label: 'Turisme i allotjament',          icon: '🏨', color: '#d97706', tablerIcon: 'bed' },
  { id: 'serveis_pro', label: 'Serveis professionals',          icon: '💼', color: '#64748b', tablerIcon: 'briefcase' },
  { id: 'finances',    label: 'Serveis financers',              icon: '🏦', color: '#1d4ed8', tablerIcon: 'coin' },
  { id: 'religio',     label: 'Religió',                        icon: '⛪', color: '#a78bfa', tablerIcon: 'building-church' },
  { id: 'patrimoni',   label: 'Patrimoni i llocs d\'interès',   icon: '🏰', color: '#b45309', tablerIcon: 'castle' },
  { id: 'altres',      label: 'Altres',                         icon: '📍', color: '#94a3b8', tablerIcon: 'map-pin' },
]

// ─── Subcategories per a fonts Overture/oficial ──────────────────────────────
// Les subcategories OSM originals segueixen sent definides a osmPoiCategories.js.
// Aquí només les noves per a Overture i fonts externes.

export const OVERTURE_POI_SUBCATEGORIES = [
  // restauracio ────────────────────────────────────────────────────────────────
  { id: 'restauracio_restaurant', categoryId: 'restauracio', label: 'Restaurants',      icon: '🍽️', color: '#e63946', tablerIcon: 'tools-kitchen-2' },
  { id: 'restauracio_cafe',       categoryId: 'restauracio', label: 'Cafès',             icon: '☕', color: '#c2410c', tablerIcon: 'coffee' },
  { id: 'restauracio_bar',        categoryId: 'restauracio', label: 'Bars i pubs',       icon: '🍺', color: '#b45309', tablerIcon: 'glass-beer' },
  { id: 'restauracio_fastfood',   categoryId: 'restauracio', label: 'Menjar ràpid',      icon: '🍔', color: '#dc2626', tablerIcon: 'burger' },
  { id: 'restauracio_pastisseria',categoryId: 'restauracio', label: 'Pastisseries',      icon: '🥐', color: '#d97706', tablerIcon: 'bread' },
  { id: 'restauracio_altres',     categoryId: 'restauracio', label: 'Altres restauració',icon: '🍴', color: '#ef4444', tablerIcon: 'tools-kitchen' },
  // comerc ─────────────────────────────────────────────────────────────────────
  { id: 'comerc_supermercat',  categoryId: 'comerc', label: 'Supermercats',         icon: '🛒', color: '#fb8500', tablerIcon: 'shopping-cart' },
  { id: 'comerc_roba',         categoryId: 'comerc', label: 'Moda i roba',          icon: '👕', color: '#ea580c', tablerIcon: 'shirt' },
  { id: 'comerc_electronica',  categoryId: 'comerc', label: 'Electrònica',          icon: '💻', color: '#d97706', tablerIcon: 'device-laptop' },
  { id: 'comerc_farmacia',     categoryId: 'comerc', label: 'Farmàcies',            icon: '💊', color: '#e879a0', tablerIcon: 'pill' },
  { id: 'comerc_altres',       categoryId: 'comerc', label: 'Altres comerços',      icon: '🛍️', color: '#f59e0b', tablerIcon: 'shopping-bag' },
  // turisme ────────────────────────────────────────────────────────────────────
  { id: 'turisme_hotel',       categoryId: 'turisme', label: 'Hotels',              icon: '🏨', color: '#d97706', tablerIcon: 'bed' },
  { id: 'turisme_hostal',      categoryId: 'turisme', label: 'Hostals i pensions',  icon: '🛏️', color: '#b45309', tablerIcon: 'home-2' },
  { id: 'turisme_atraccio',    categoryId: 'turisme', label: 'Atraccions',          icon: '🗺️', color: '#92400e', tablerIcon: 'map-2' },
  // serveis_pro ────────────────────────────────────────────────────────────────
  { id: 'serveis_pro_oficina', categoryId: 'serveis_pro', label: 'Oficines',        icon: '🏢', color: '#64748b', tablerIcon: 'building-skyscraper' },
  { id: 'serveis_pro_legal',   categoryId: 'serveis_pro', label: 'Serveis legals',  icon: '⚖️', color: '#475569', tablerIcon: 'scale' },
  { id: 'serveis_pro_medics',  categoryId: 'serveis_pro', label: 'Serveis mèdics',  icon: '🩺', color: '#334155', tablerIcon: 'stethoscope' },
  { id: 'serveis_pro_altres',  categoryId: 'serveis_pro', label: 'Altres serveis',  icon: '💼', color: '#1e293b', tablerIcon: 'briefcase' },
  // finances ───────────────────────────────────────────────────────────────────
  { id: 'finances_banc',       categoryId: 'finances', label: 'Bancs',              icon: '🏦', color: '#1d4ed8', tablerIcon: 'building-bank' },
  { id: 'finances_atm',        categoryId: 'finances', label: 'Caixers automàtics', icon: '💳', color: '#2563eb', tablerIcon: 'credit-card' },
  { id: 'finances_altres',     categoryId: 'finances', label: 'Serveis financers',  icon: '🛡️', color: '#1e40af', tablerIcon: 'shield' },
  // religio ────────────────────────────────────────────────────────────────────
  { id: 'religio_esglesia',    categoryId: 'religio', label: 'Esglésies',           icon: '⛪', color: '#a78bfa', tablerIcon: 'building-church' },
  { id: 'religio_mesquita',    categoryId: 'religio', label: 'Mesquites',           icon: '🕌', color: '#8b5cf6', tablerIcon: 'building-mosque' },
  { id: 'religio_sinagoga',    categoryId: 'religio', label: 'Sinagogues',          icon: '✡️', color: '#7c3aed', tablerIcon: 'star-of-david' },
  { id: 'religio_altres',      categoryId: 'religio', label: 'Altres llocs culte',  icon: '🙏', color: '#6d28d9', tablerIcon: 'pray' },
  // patrimoni ──────────────────────────────────────────────────────────────────
  { id: 'patrimoni_monument',  categoryId: 'patrimoni', label: 'Monuments',         icon: '🏛️', color: '#b45309', tablerIcon: 'building-monument' },
  { id: 'patrimoni_castell',   categoryId: 'patrimoni', label: 'Castells',          icon: '🏰', color: '#92400e', tablerIcon: 'castle' },
  { id: 'patrimoni_lloc',      categoryId: 'patrimoni', label: 'Llocs d\'interès',  icon: '📍', color: '#a16207', tablerIcon: 'map-2' },
  // altres ─────────────────────────────────────────────────────────────────────
  { id: 'altres_altres',       categoryId: 'altres', label: 'Altres',              icon: '📍', color: '#94a3b8', tablerIcon: 'map-pin' },
]

// ─── Lookup maps ─────────────────────────────────────────────────────────────

export const APP_CATEGORY_BY_ID = Object.fromEntries(APP_CATEGORIES.map((c) => [c.id, c]))

export const OVERTURE_SUBCAT_BY_ID = Object.fromEntries(
  OVERTURE_POI_SUBCATEGORIES.map((s) => [s.id, s]),
)

export function getOvertureSubcatsForCategory(categoryId) {
  return OVERTURE_POI_SUBCATEGORIES.filter((s) => s.categoryId === categoryId)
}
