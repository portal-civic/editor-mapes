/** Presets for GVA noise mapping layers (Mapes Estratègics de Soroll, Directiva 2002/49/CE). */

export const NOISE_PRESETS = [
  {
    id: 'gva-noise-lden',
    name: 'Soroll diürn-vespertí-nocturn (Lden)',
    group: 'noise',
    description: 'Classifica zones per nivell de soroll Lden (dB) seguint la Directiva Europea de Soroll.',
    suggestedFields: [
      'CLASE_LDEN', 'CLASSE_LDEN', 'LDEN', 'NIVEL_LDEN', 'NIVELL_LDEN', 'LDEN_CLASE',
    ],
    fieldPriority: [
      'CLASE_LDEN', 'CLASSE_LDEN', 'LDEN_CLASE', 'NIVEL_LDEN', 'NIVELL_LDEN', 'LDEN',
    ],
    detectionKeywords: [
      'soroll', 'lden', 'acustic', 'acústic', 'noise', 'mes_', 'mapa estrateg',
    ],
    sampleValueHints: [
      'lden', '55-59', '60-64', '65-69', '70-74', 'classe i', 'clase i',
    ],
    defaultPalette: 'diagnostic',
    legendTitle: 'Soroll Lden (dB)',
    mappings: {
      // Band classes (roman numerals used in some GVA datasets)
      'I': { label: 'Lden 55-59 dB', color: '#a9e34b' },
      'II': { label: 'Lden 60-64 dB', color: '#f08c00' },
      'III': { label: 'Lden 65-69 dB', color: '#e85d04' },
      'IV': { label: 'Lden 70-74 dB', color: '#d62828' },
      'V': { label: 'Lden ≥75 dB', color: '#7b2d8b' },
      // Numeric dB bands
      '55-59': { label: 'Lden 55-59 dB', color: '#a9e34b' },
      '60-64': { label: 'Lden 60-64 dB', color: '#f08c00' },
      '65-69': { label: 'Lden 65-69 dB', color: '#e85d04' },
      '70-74': { label: 'Lden 70-74 dB', color: '#d62828' },
      '>=75': { label: 'Lden ≥75 dB', color: '#7b2d8b' },
      '≥75': { label: 'Lden ≥75 dB', color: '#7b2d8b' },
      // Letter classes
      'A': { label: 'Lden 55-59 dB', color: '#a9e34b' },
      'B': { label: 'Lden 60-64 dB', color: '#f08c00' },
      'C': { label: 'Lden 65-69 dB', color: '#e85d04' },
      'D': { label: 'Lden 70-74 dB', color: '#d62828' },
      'E': { label: 'Lden ≥75 dB', color: '#7b2d8b' },
    },
    defaultStyle: {},
  },
  {
    id: 'gva-noise-ln',
    name: 'Soroll nocturn (Ln)',
    group: 'noise',
    description: 'Classifica zones per nivell de soroll nocturn Ln (dB).',
    suggestedFields: [
      'CLASE_LN', 'CLASSE_LN', 'LN', 'NIVEL_LN', 'NIVELL_LN', 'LN_CLASE',
    ],
    fieldPriority: [
      'CLASE_LN', 'CLASSE_LN', 'LN_CLASE', 'NIVEL_LN', 'NIVELL_LN', 'LN',
    ],
    detectionKeywords: [
      'soroll nocturn', 'ln_', '_ln', 'night noise', 'nocturna',
    ],
    sampleValueHints: [
      '45-49', '50-54', '55-59', '60-64', 'classe i', 'ln',
    ],
    defaultPalette: 'diagnostic',
    legendTitle: 'Soroll nocturn Ln (dB)',
    mappings: {
      'I': { label: 'Ln 45-49 dB', color: '#a9e34b' },
      'II': { label: 'Ln 50-54 dB', color: '#f08c00' },
      'III': { label: 'Ln 55-59 dB', color: '#e85d04' },
      'IV': { label: 'Ln 60-64 dB', color: '#d62828' },
      'V': { label: 'Ln ≥65 dB', color: '#7b2d8b' },
      '45-49': { label: 'Ln 45-49 dB', color: '#a9e34b' },
      '50-54': { label: 'Ln 50-54 dB', color: '#f08c00' },
      '55-59': { label: 'Ln 55-59 dB', color: '#e85d04' },
      '60-64': { label: 'Ln 60-64 dB', color: '#d62828' },
      '>=65': { label: 'Ln ≥65 dB', color: '#7b2d8b' },
    },
    defaultStyle: {},
  },
]
