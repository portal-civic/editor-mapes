/**
 * Tabler Icons resolver.
 *
 * resolveTablerIcon(id) — returns the React component for the icon, or null.
 * getTablerIconSvgContent(id, color) — returns inner SVG markup for use in
 *   Leaflet divIcon HTML strings. Result is cached per (id, color) pair.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as TablerIcons from '@tabler/icons-react'

/**
 * Converts a kebab-case icon id to the corresponding Tabler React component name.
 * e.g. "map-pin" → "IconMapPin", "building-hospital" → "IconBuildingHospital"
 */
function toComponentName(iconId) {
  return (
    'Icon' +
    iconId
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('')
  )
}

/**
 * Returns the @tabler/icons-react React component for the given icon id.
 * Returns null if the icon does not exist in the installed package version.
 */
export function resolveTablerIcon(iconId) {
  if (!iconId) return null
  const componentName = toComponentName(iconId)
  return TablerIcons[componentName] || null
}

// Cache for SVG inner markup strings, keyed by "iconId:color"
const _svgCache = new Map()

/**
 * Returns the inner SVG markup string for a Tabler icon, suitable for embedding
 * inside a Leaflet divIcon HTML string. The outer <svg> wrapper is stripped so
 * the result can be placed inside a parent <svg> element.
 *
 * Results are cached — rendering each (icon, color) pair only once.
 *
 * @param {string} iconId  — kebab-case Tabler icon id
 * @param {string} color   — explicit color for stroke/fill (e.g. "#ffffff")
 * @returns {string} inner SVG markup, or empty string if icon not found
 */
export function getTablerIconSvgContent(iconId, color = '#ffffff') {
  if (!iconId) return ''
  const cacheKey = `${iconId}:${color}`
  if (_svgCache.has(cacheKey)) return _svgCache.get(cacheKey)

  const Component = resolveTablerIcon(iconId)
  if (!Component) {
    _svgCache.set(cacheKey, '')
    return ''
  }

  try {
    const html = renderToStaticMarkup(
      createElement(Component, { size: 24, stroke: 2, color }),
    )
    // Strip outer <svg ...>...</svg> wrapper to get embeddable inner content.
    // Also replace any remaining "currentColor" references with the explicit color
    // so the icon renders correctly when placed inside a Leaflet divIcon string.
    const inner = html
      .replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>$/, '')
      .replace(/currentColor/g, color)
    _svgCache.set(cacheKey, inner)
    return inner
  } catch {
    _svgCache.set(cacheKey, '')
    return ''
  }
}
