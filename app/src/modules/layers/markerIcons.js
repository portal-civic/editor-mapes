/**
 * Built-in icon catalog for point markers.
 *
 * Each entry:
 *   id       — Unique identifier. Stored in layer/feature style.
 *   name     — Human-readable display name (Catalan).
 *   category — Grouping hint for future UI filtering.
 *   path     — SVG path data in a 24×24 viewBox (no fill attr needed).
 *
 * Icon paths are adapted from Material Design Icons (Apache 2.0).
 *
 * Future iconSets (e.g. 'fontawesome', 'custom-svg') will be resolved
 * by their own resolver; this file covers the default 'builtin' set.
 */
export const BUILTIN_ICONS = [
  // ── General ───────────────────────────────────────────────
  {
    id: 'star',
    name: 'Estrella',
    category: 'general',
    path: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  },
  {
    id: 'flag',
    name: 'Bandera',
    category: 'general',
    path: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
  },
  {
    id: 'home',
    name: 'Casa',
    category: 'general',
    path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  },
  {
    id: 'person',
    name: 'Persona',
    category: 'general',
    path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  },
  {
    id: 'info',
    name: 'Informació',
    category: 'general',
    path: 'M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z',
  },
  {
    id: 'warning',
    name: 'Avís',
    category: 'general',
    path: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  },

  // ── Services ──────────────────────────────────────────────
  {
    id: 'school',
    name: 'Escola',
    category: 'services',
    path: 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
  },
  {
    id: 'hospital',
    name: 'Hospital',
    category: 'services',
    path: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 3h2v3h3v2h-3v3h-2v-3H10v-2h3V6z',
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    category: 'services',
    path: 'M18 3v2h-2V3h-2v6h2V7h2v14h2V3h-2zM6 3C4.34 3 3 4.34 3 6v7h4v7h2V6c0-1.66-1.34-3-3-3z',
  },
  {
    id: 'cafe',
    name: 'Cafè',
    category: 'services',
    path: 'M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z',
  },
  {
    id: 'hotel',
    name: 'Hotel',
    category: 'services',
    path: 'M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z',
  },
  {
    id: 'shop',
    name: 'Botiga',
    category: 'services',
    path: 'M16 6V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H2v13c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6h-6zm-6-2h4v2h-4V4zM11 17H9v-6h2v6zm4 0h-2v-6h2v6z',
  },
  {
    id: 'bank',
    name: 'Banc',
    category: 'services',
    path: 'M11.5 1L2 6v2h19V6L11.5 1zM4 10v7H2v3h20v-3h-2v-7h-3v7H7v-7H4z',
  },

  // ── Transport ─────────────────────────────────────────────
  {
    id: 'parking',
    name: 'Aparcament',
    category: 'transport',
    path: 'M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z',
  },
  {
    id: 'bus',
    name: 'Autobús',
    category: 'transport',
    path: 'M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z',
  },
  {
    id: 'car',
    name: 'Cotxe',
    category: 'transport',
    path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
  },

  // ── Leisure ───────────────────────────────────────────────
  {
    id: 'camera',
    name: 'Càmera',
    category: 'leisure',
    path: 'M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z',
  },
  {
    id: 'nature',
    name: 'Natura',
    category: 'leisure',
    path: 'M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z',
  },
]

/**
 * Returns an icon entry by id, searching the builtin set.
 * Returns null if not found.
 *
 * @param {string} iconId
 * @param {string} [iconSet='builtin']
 * @returns {{ id: string, name: string, path: string } | null}
 */
export function resolveIcon(iconId, iconSet = 'builtin') {
  if (!iconId) return null
  if (iconSet === 'builtin') {
    return BUILTIN_ICONS.find((ic) => ic.id === iconId) ?? null
  }
  // Other iconSets will be resolved by their own resolvers in future phases.
  return null
}
