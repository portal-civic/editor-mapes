import { SIOSE_DICTIONARY } from './siose'
import { SIGPAC_DICTIONARY } from './sigpac'
import { PLANNING_DICTIONARY } from './planning'

export { SIOSE_DICTIONARY } from './siose'
export { SIGPAC_DICTIONARY } from './sigpac'
export { PLANNING_DICTIONARY } from './planning'

// ─── Registry ─────────────────────────────────────────────────────────────────

export const ALL_DICTIONARIES = [
  SIOSE_DICTIONARY,
  SIGPAC_DICTIONARY,
  PLANNING_DICTIONARY,
]

// ─── Code resolution helpers ──────────────────────────────────────────────────

/**
 * Resolves a single code string against a dictionary's mappings.
 * Tries exact match first, then longest-prefix match.
 *
 * @param {string} code
 * @param {Record<string,string>} mappings
 * @returns {string|null}
 */
function resolveCode(code, mappings) {
  if (!code) return null
  if (mappings[code]) return mappings[code]

  // Longest prefix: find the longest key that `code` starts with
  let bestKey = null
  let bestLen = 0
  for (const key of Object.keys(mappings)) {
    if (key.length > bestLen && code.startsWith(key)) {
      bestKey = key
      bestLen = key.length
    }
  }
  return bestKey ? mappings[bestKey] : null
}

/** Joins an array of labels in Valencian natural language ("A i B" / "A, B i C"). */
function joinLabels(labels) {
  const unique = [...new Set(labels)]
  if (unique.length === 0) return null
  if (unique.length === 1) return unique[0]
  if (unique.length === 2) return `${unique[0]} i ${unique[1]}`
  return `${unique.slice(0, -1).join(', ')} i ${unique[unique.length - 1]}`
}

// ─── Main translation function ────────────────────────────────────────────────

/**
 * Translates a raw category value using the given dictionary.
 *
 * Handles:
 *   - Simple codes: "PST" → "Pastures"
 *   - Prefix codes: "PSTpc" → resolves via prefix "PST" → "Pastures"
 *   - Composite codes: "UCS(90EDFem_10VAP)"
 *       → outer: "UCS" → "Teixit urbà compacte"
 *       → inner parts (strip leading %, split by _): "EDFem", "VAP"
 *       → result: "Teixit urbà compacte: edificació i vials"
 *   - Nested composite: "R(50LFCrr_50PSTpc)"
 *       → outer: "R" → "Mescla"
 *       → inner: "LFCrr" (prefix "LF"), "PSTpc" (prefix "PST")
 *       → result: "Mescla: conreus llenyosos i pastures"
 *
 * Returns null if no translation could be found.
 *
 * @param {string|null} value
 * @param {object} dictionary
 * @returns {string|null}
 */
export function translateCategoryValue(value, dictionary) {
  if (value == null) return null
  const str = String(value).trim()
  if (!str) return null

  const { mappings } = dictionary

  // 1. Exact match
  if (mappings[str]) return mappings[str]

  // 2. Composite pattern: OUTER_CODE(INNER_PARTS)
  //    Outer code: letters (and digits after first letter group)
  //    Inner parts: anything inside the first pair of parentheses
  const compositeRe = /^([A-Za-z][A-Za-z0-9]*)\((.+)\)$/
  const compositeMatch = str.match(compositeRe)

  if (compositeMatch) {
    const outerCode = compositeMatch[1]
    const innerStr = compositeMatch[2]

    const outerLabel = resolveCode(outerCode, mappings)

    // Parse inner: split by "_", strip leading percentage digits from each part
    const innerParts = innerStr.split('_').map((part) => {
      // Strip leading run of digits (percentage prefix): "90EDFem" → "EDFem"
      const code = part.replace(/^\d+/, '')
      return resolveCode(code, mappings)
    }).filter(Boolean)

    if (outerLabel && innerParts.length > 0) {
      return `${outerLabel}: ${joinLabels(innerParts)}`
    }
    if (outerLabel) return outerLabel
    if (innerParts.length > 0) {
      return innerParts.length === 1
        ? innerParts[0]
        : `Mescla: ${joinLabels(innerParts)}`
    }
    // Fall through to prefix match below
  }

  // 3. Prefix match (for codes like "PSTpc", "MTRfr", "LFCrr")
  const prefixLabel = resolveCode(str, mappings)
  if (prefixLabel) return prefixLabel

  return null
}

// ─── Batch apply ──────────────────────────────────────────────────────────────

/**
 * Applies a dictionary to an array of categories, updating only `label`.
 * Does not change value, color, order, or visibility.
 *
 * @param {object[]} categories  — normalized category objects
 * @param {object}   dictionary
 * @returns {{ categories: object[], translated: number, untranslated: number }}
 */
export function applyDictionaryToCategories(categories, dictionary) {
  let translated = 0

  const next = categories.map((cat) => {
    const label = translateCategoryValue(cat.value, dictionary)
    if (label != null) {
      translated++
      return { ...cat, label }
    }
    return cat
  })

  return { categories: next, translated, untranslated: categories.length - translated }
}

// ─── Field compatibility ──────────────────────────────────────────────────────

/**
 * Returns dictionaries compatible with a given field name.
 * Matches exact, substring, or prefix of targetFields entries.
 *
 * @param {string} fieldName
 * @returns {object[]}
 */
export function findCompatibleDictionaries(fieldName) {
  if (!fieldName) return []
  const fLower = fieldName.toLowerCase()
  return ALL_DICTIONARIES.filter((d) =>
    d.targetFields.some((tf) => {
      const tfL = tf.toLowerCase()
      return tfL === fLower || fLower.includes(tfL) || tfL.includes(fLower)
    }),
  )
}

/**
 * Returns the first compatible dictionary for a field, or null.
 * Useful for auto-detection.
 *
 * @param {string} fieldName
 * @returns {object|null}
 */
export function suggestDictionary(fieldName) {
  return findCompatibleDictionaries(fieldName)[0] ?? null
}
