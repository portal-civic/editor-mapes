import { ACCESSIBILITY_PRESETS } from './accessibility'
import { NOISE_PRESETS } from './noise'
import { ENVIRONMENT_PRESETS } from './environment'
import { HERITAGE_PRESETS } from './heritage'
import { HEALTH_PRESETS } from './health'
import { SOCIAL_PRESETS } from './social'
import { INDUSTRY_PRESETS } from './industry'
import { URBAN_REGENERATION_PRESETS } from './urbanRegeneration'

export * from './accessibility'
export * from './noise'
export * from './environment'
export * from './heritage'
export * from './health'
export * from './social'
export * from './industry'
export * from './urbanRegeneration'

// ─── Registry ─────────────────────────────────────────────────────────────────

export const ALL_GVA_PRESETS = [
  ...ACCESSIBILITY_PRESETS,
  ...NOISE_PRESETS,
  ...ENVIRONMENT_PRESETS,
  ...HERITAGE_PRESETS,
  ...HEALTH_PRESETS,
  ...SOCIAL_PRESETS,
  ...INDUSTRY_PRESETS,
  ...URBAN_REGENERATION_PRESETS,
]

export const GVA_GROUPS = {
  accessibility: 'Accessibilitat',
  noise: 'Soroll',
  environment: 'Medi natural',
  heritage: 'Patrimoni',
  health: 'Salut',
  social: 'Social',
  industry: 'Indústria',
  urbanRegeneration: 'Reg. urbana',
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

const KEYWORD_SCORE = 30   // layer name contains a detection keyword
const FIELD_EXACT_SCORE = 25  // a suggestedField exists verbatim in layer fields
const FIELD_PARTIAL_SCORE = 8 // a suggestedField is a substring of a field name (or vice versa)
const VALUE_HINT_SCORE = 15   // a sample value matches a sampleValueHint

const MIN_SCORE = 20  // below this, not returned

/**
 * Score one preset against the provided layer signals.
 *
 * @param {object} preset
 * @param {object} ctx
 * @param {string}   ctx.lname       - layer name, already lowercased
 * @param {string[]} ctx.lfields     - field names, already lowercased (same index as origFields)
 * @param {string[]} ctx.origFields  - original-case field names
 * @param {string[]} ctx.allSamples  - all sample values from any field, lowercased
 * @returns {{ score: number, reasons: string[], recommendedField: string|null }}
 */
function scorePreset(preset, { lname, lfields, origFields, allSamples }) {
  let score = 0
  const reasons = []

  // 1. Layer name keyword match (only first match per preset to avoid inflating)
  for (const kw of preset.detectionKeywords) {
    if (lname.includes(kw.toLowerCase())) {
      score += KEYWORD_SCORE
      reasons.push(`Nom de capa: "${kw}"`)
      break
    }
  }

  // 2. Field name match (exact and partial)
  let exactFieldMatches = 0
  let partialFieldMatches = 0
  const matchedFields = new Set()

  for (const sf of preset.suggestedFields) {
    const sfL = sf.toLowerCase()
    const exactIdx = lfields.indexOf(sfL)
    if (exactIdx !== -1 && !matchedFields.has(sfL)) {
      matchedFields.add(sfL)
      exactFieldMatches++
      if (reasons.filter((r) => r.startsWith('Camp')).length < 2) {
        reasons.push(`Camp "${origFields[exactIdx]}"`)
      }
    } else if (!matchedFields.has(sfL)) {
      // partial: suggestedField is substring of actual field name or vice versa
      const partialMatch = lfields.find((lf) => lf.includes(sfL) || sfL.includes(lf))
      if (partialMatch) {
        matchedFields.add(sfL)
        partialFieldMatches++
      }
    }
  }

  score += exactFieldMatches * FIELD_EXACT_SCORE
  score += Math.min(partialFieldMatches, 2) * FIELD_PARTIAL_SCORE

  // 3. Sample value hints (up to 2 matches to avoid runaway score)
  let valueHitCount = 0
  for (const hint of preset.sampleValueHints) {
    const hintL = hint.toLowerCase()
    if (allSamples.some((sv) => sv === hintL || sv.includes(hintL))) {
      score += VALUE_HINT_SCORE
      valueHitCount++
      if (valueHitCount <= 2) reasons.push(`Valors: "${hint}"`)
      if (valueHitCount >= 2) break
    }
  }

  // 4. Recommended field: first in fieldPriority that exists in origFields (case-insensitive)
  let recommendedField = null
  for (const pf of preset.fieldPriority) {
    const pfL = pf.toLowerCase()
    const idx = lfields.indexOf(pfL)
    if (idx !== -1) {
      recommendedField = origFields[idx]
      break
    }
  }

  return { score, reasons, recommendedField }
}

/**
 * Returns GVA preset suggestions sorted by relevance score.
 *
 * @param {object} opts
 * @param {string}   opts.layerName   - display name of the layer
 * @param {string[]} opts.fields      - field names from layer.meta.fields
 * @param {object}   opts.sampleValues - { fieldName: string[] } — sample unique values per field
 * @returns {Array<{ preset, score, reasons, recommendedField }>}
 */
export function suggestGvaPresets({ layerName = '', fields = [], sampleValues = {} }) {
  const lname = layerName.toLowerCase()
  const origFields = fields
  const lfields = fields.map((f) => f.toLowerCase())
  const allSamples = Object.values(sampleValues)
    .flat()
    .map((v) => String(v).toLowerCase())

  const ctx = { lname, lfields, origFields, allSamples }

  return ALL_GVA_PRESETS
    .map((preset) => {
      const { score, reasons, recommendedField } = scorePreset(preset, ctx)
      return { preset, score, reasons, recommendedField }
    })
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
}

// ─── Future hook: field classification analysis ───────────────────────────────
// analyzeClassificationFields() can call getGvaPresetsForScoring() to use
// these presets as a knowledge base for field-level scoring.

export function getGvaPresetsForScoring() {
  return ALL_GVA_PRESETS
}
