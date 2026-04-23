/** Presets for GVA accessibility layers (itineraris vianants, barreres arquitectòniques). */

export const ACCESSIBILITY_PRESETS = [
  {
    id: 'gva-accessibility-itv',
    name: 'Accessibilitat urbana',
    group: 'accessibility',
    description: 'Classifica espais o trams per grau d\'accessibilitat física per a persones amb mobilitat reduïda.',
    suggestedFields: [
      'ADEQUACIO', 'ADEQUACIÓ', 'ACCESSIBILITAT', 'GRAU_ACCESSIBILITAT',
      'ESTAT_ACCESSIBILITAT', 'TIPOLOGIA', 'GRAU',
    ],
    fieldPriority: [
      'ADEQUACIO', 'ADEQUACIÓ', 'ACCESSIBILITAT', 'GRAU_ACCESSIBILITAT',
      'ESTAT_ACCESSIBILITAT', 'GRAU', 'TIPOLOGIA',
    ],
    detectionKeywords: [
      'accessibilit', 'barrera', 'mobilitat redu', 'itinerari vianant',
      'seap', 'vorera', 'accessibil',
    ],
    sampleValueHints: [
      'accessible', 'no accessible', 'parcialment', 'barreres',
    ],
    defaultPalette: 'contrast',
    legendTitle: 'Grau d\'accessibilitat',
    mappings: {
      'ACCESSIBLE': { label: 'Accessible', color: '#007200' },
      'PARCIALMENT ACCESSIBLE': { label: 'Parcialment accessible', color: '#e85d04' },
      'ACCESSIBLE PARCIALMENT': { label: 'Parcialment accessible', color: '#e85d04' },
      'NO ACCESSIBLE': { label: 'No accessible', color: '#d62828' },
      'NO_ACCESSIBLE': { label: 'No accessible', color: '#d62828' },
      'ACCESSIBLE_PARCIALMENT': { label: 'Parcialment accessible', color: '#e85d04' },
      // Coded levels
      '1': { label: 'Accessible', color: '#007200' },
      '2': { label: 'Parcialment accessible', color: '#e85d04' },
      '3': { label: 'No accessible', color: '#d62828' },
      'A': { label: 'Accessible', color: '#007200' },
      'B': { label: 'Parcialment accessible', color: '#e85d04' },
      'C': { label: 'No accessible', color: '#d62828' },
    },
    defaultStyle: {},
  },
  {
    id: 'gva-accessibility-barriers',
    name: 'Tipus de barreres',
    group: 'accessibility',
    description: 'Identifica el tipus de barrera arquitectònica o element d\'accessibilitat.',
    suggestedFields: [
      'TIPUS_BARRERA', 'TIPUS_ELEMENT', 'TIPOLOGIA', 'ELEMENT',
    ],
    fieldPriority: [
      'TIPUS_BARRERA', 'TIPUS_ELEMENT', 'TIPOLOGIA', 'ELEMENT',
    ],
    detectionKeywords: [
      'barrera', 'element accessib', 'obstacle',
    ],
    sampleValueHints: [
      'gual', 'escala', 'vorada', 'semàfor', 'rampa',
    ],
    defaultPalette: 'default',
    legendTitle: 'Tipus de barrera',
    mappings: {
      'GUAL': { label: 'Gual' },
      'ESCALA': { label: 'Escala' },
      'RAMPA': { label: 'Rampa' },
      'VORADA': { label: 'Vorada alta' },
    },
    defaultStyle: {},
  },
]
