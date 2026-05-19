/**
 * layerFilters.js — General attribute filter engine for any layer type.
 */

export function defaultFilters() {
  return { enabled: false, logic: 'AND', rules: [] }
}

export function hasActiveFilters(filters) {
  return filters?.enabled === true && (filters.rules?.length ?? 0) > 0
}

function evalRule(feature, rule) {
  const { field, operator, value, value2 } = rule
  if (!field) return true
  const raw = feature?.properties?.[field]
  const strVal = raw == null ? '' : String(raw)
  const numVal = parseFloat(raw)
  const ruleStr = value == null ? '' : String(value)

  switch (operator) {
    case 'eq':          return strVal === ruleStr
    case 'neq':         return strVal !== ruleStr
    case 'contains':    return strVal.toLowerCase().includes(ruleStr.toLowerCase())
    case 'not_contains':return !strVal.toLowerCase().includes(ruleStr.toLowerCase())
    case 'empty':       return raw == null || strVal === ''
    case 'not_empty':   return raw != null && strVal !== ''
    case 'gt':          return !isNaN(numVal) && numVal > Number(value)
    case 'gte':         return !isNaN(numVal) && numVal >= Number(value)
    case 'lt':          return !isNaN(numVal) && numVal < Number(value)
    case 'lte':         return !isNaN(numVal) && numVal <= Number(value)
    case 'between':     return !isNaN(numVal) && numVal >= Number(value) && numVal <= Number(value2 ?? value)
    case 'in': {
      const vals = ruleStr.split(',').map((s) => s.trim()).filter(Boolean)
      return vals.includes(strVal)
    }
    case 'not_in': {
      const vals = ruleStr.split(',').map((s) => s.trim()).filter(Boolean)
      return !vals.includes(strVal)
    }
    default: return true
  }
}

export function featurePassesFilters(feature, filters) {
  if (!filters?.enabled) return true
  const rules = filters.rules ?? []
  if (rules.length === 0) return true
  const logic = filters.logic ?? 'AND'
  return logic === 'OR'
    ? rules.some((r) => evalRule(feature, r))
    : rules.every((r) => evalRule(feature, r))
}

export function filterFeatures(features, filters) {
  if (!hasActiveFilters(filters)) return features
  return features.filter((f) => featurePassesFilters(f, filters))
}

/**
 * Compute value frequency stats for a field across features.
 * Returns { total, unique, nullCount, isNumeric, topValues, hasMore }
 */
export function getFieldStats(features, fieldName, maxTop = 25) {
  const counts = new Map()
  let nullCount = 0
  let numericCount = 0

  for (const f of features) {
    const val = f?.properties?.[fieldName]
    if (val == null || String(val) === '') {
      nullCount++
      continue
    }
    if (typeof val === 'number' || !isNaN(Number(val))) numericCount++
    const key = String(val)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  return {
    total: features.length,
    unique: counts.size,
    nullCount,
    isNumeric: numericCount > 0 && numericCount >= counts.size * 0.8,
    topValues: sorted.slice(0, maxTop).map(([val, count]) => ({ val, count })),
    hasMore: sorted.length > maxTop,
  }
}

export const OPERATORS = [
  { id: 'eq',           label: '= igual a',          needsValue: true,  isNumeric: false },
  { id: 'neq',          label: '≠ diferent de',       needsValue: true,  isNumeric: false },
  { id: 'contains',     label: 'conté',               needsValue: true,  isNumeric: false },
  { id: 'not_contains', label: 'no conté',             needsValue: true,  isNumeric: false },
  { id: 'empty',        label: 'és buit / null',      needsValue: false, isNumeric: false },
  { id: 'not_empty',    label: 'no és buit',          needsValue: false, isNumeric: false },
  { id: 'gt',           label: '> major que',         needsValue: true,  isNumeric: true  },
  { id: 'gte',          label: '≥ major o igual',     needsValue: true,  isNumeric: true  },
  { id: 'lt',           label: '< menor que',         needsValue: true,  isNumeric: true  },
  { id: 'lte',          label: '≤ menor o igual',     needsValue: true,  isNumeric: true  },
  { id: 'between',      label: 'entre … i …',         needsValue: true,  isNumeric: true,  needsValue2: true },
  { id: 'in',           label: 'és un de (llista)',   needsValue: true,  isNumeric: false },
]
