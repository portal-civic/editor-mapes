export const DEFAULT_LEGEND_LAYOUT = {
  position: 'inside',   // 'inside' | 'right' | 'left' | 'bottom' | 'none'
  width: 220,           // column width in px (right/left)
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  titleFontSize: 12,    // legend group-title font size (px)
  background: '#ffffff',
  border: true,
  padding: 12,
  showOnlyVisibleInViewport: false,
  showLayerNames: true,
  language: 'val',      // 'val' | 'cas' | 'eng'
  // export layout
  margin: 0,            // page-margin around the whole composition (px)
  titlePosition: 'floating', // 'floating' | 'above-map' | 'above-legend'
  maxLegendRows: 0,     // 0 = unlimited; >0 wraps legend to 2 cols in export
}

const VALID_POSITIONS = ['inside', 'right', 'left', 'bottom', 'none']
const VALID_LANGUAGES = ['val', 'cas', 'eng']
const VALID_TITLE_POSITIONS = ['floating', 'above-map', 'above-legend']

export function normalizeLegendLayout(raw) {
  const d = DEFAULT_LEGEND_LAYOUT
  if (!raw || typeof raw !== 'object') return { ...d }
  return {
    position: VALID_POSITIONS.includes(raw.position) ? raw.position : d.position,
    width: typeof raw.width === 'number' && raw.width > 0 ? raw.width : d.width,
    fontFamily: typeof raw.fontFamily === 'string' && raw.fontFamily ? raw.fontFamily : d.fontFamily,
    fontSize: typeof raw.fontSize === 'number' && raw.fontSize > 0 ? raw.fontSize : d.fontSize,
    titleFontSize: typeof raw.titleFontSize === 'number' && raw.titleFontSize > 0
      ? raw.titleFontSize : d.titleFontSize,
    background: typeof raw.background === 'string' ? raw.background : d.background,
    border: typeof raw.border === 'boolean' ? raw.border : d.border,
    padding: typeof raw.padding === 'number' && raw.padding >= 0 ? raw.padding : d.padding,
    showOnlyVisibleInViewport: typeof raw.showOnlyVisibleInViewport === 'boolean'
      ? raw.showOnlyVisibleInViewport : d.showOnlyVisibleInViewport,
    showLayerNames: typeof raw.showLayerNames === 'boolean' ? raw.showLayerNames : d.showLayerNames,
    language: VALID_LANGUAGES.includes(raw.language) ? raw.language : d.language,
    margin: typeof raw.margin === 'number' && raw.margin >= 0 ? Math.min(Math.floor(raw.margin), 80) : d.margin,
    titlePosition: VALID_TITLE_POSITIONS.includes(raw.titlePosition) ? raw.titlePosition : d.titlePosition,
    maxLegendRows: typeof raw.maxLegendRows === 'number' && raw.maxLegendRows >= 0
      ? Math.floor(raw.maxLegendRows) : d.maxLegendRows,
  }
}

/**
 * Resolves a label that may be a plain string or a multilingual object
 * { val: '...', cas: '...', eng: '...' }.
 * Falls back through available languages before returning an empty string.
 */
export function resolveLegendLabel(label, language = 'val') {
  if (label === null || label === undefined) return ''
  if (typeof label === 'string') return label
  if (typeof label === 'object' && !Array.isArray(label)) {
    const order = [language, ...VALID_LANGUAGES.filter((l) => l !== language)]
    for (const l of order) {
      if (label[l] != null) return String(label[l])
    }
    const first = Object.values(label).find((v) => v != null)
    return first != null ? String(first) : ''
  }
  return String(label)
}
