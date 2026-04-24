export const DEFAULT_LEGEND_LAYOUT = {
  position: 'inside',   // 'inside' | 'right' | 'left' | 'bottom' | 'none'
  width: 220,           // column width in px (right/left) or bar height (bottom)
  fontFamily: 'sans-serif',
  fontSize: 11,
  titleFontSize: 10,
  background: '#ffffff',
  border: true,
  padding: 12,
  showOnlyVisibleInViewport: false,
  language: 'val',      // 'val' | 'cas' | 'eng'
}

const VALID_POSITIONS = ['inside', 'right', 'left', 'bottom', 'none']
const VALID_LANGUAGES = ['val', 'cas', 'eng']

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
    language: VALID_LANGUAGES.includes(raw.language) ? raw.language : d.language,
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
