/**
 * Font Awesome Free Solid icon resolver.
 *
 * resolveFaIcon(iconId) — given a kebab-case id from FA_ICON_CATALOG,
 * returns { width, height, path } ready to embed as an inline SVG path,
 * or null if the icon is not found.
 *
 * The resolver converts kebab-case ids to the FA variable name:
 *   'location-dot'  →  FaSolid.faLocationDot
 *   'house'         →  FaSolid.faHouse
 */
import * as FaSolid from '@fortawesome/free-solid-svg-icons'

function toFaVarName(iconId) {
  return (
    'fa' +
    iconId
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('')
  )
}

// Cache resolved icon data to avoid repeated lookups.
const _cache = new Map()

export function resolveFaIcon(iconId) {
  if (!iconId) return null
  if (_cache.has(iconId)) return _cache.get(iconId)

  const varName = toFaVarName(iconId)
  const faIconObj = FaSolid[varName]

  if (!faIconObj?.icon) {
    _cache.set(iconId, null)
    return null
  }

  const [width, height, , , path] = faIconObj.icon
  const result = {
    width,
    height,
    // FA free icons are always single-path; duotone (array of paths) is paid.
    path: Array.isArray(path) ? path[path.length - 1] : path,
  }
  _cache.set(iconId, result)
  return result
}
