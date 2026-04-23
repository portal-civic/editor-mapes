/** Presets for GVA natural environment and protected areas (ENP, Xarxa Natura 2000, zones humides). */

export const ENVIRONMENT_PRESETS = [
  {
    id: 'gva-enp-regim',
    name: 'Espais Naturals Protegits',
    group: 'environment',
    description: 'Classifica ENP per règim de protecció (Parc Natural, Paratge, Reserva, etc.).',
    suggestedFields: [
      'REGIM', 'RÈGIM', 'CATEGORIA', 'TIPUS', 'TIPUS_ENP', 'CODI_ENP', 'DENOMINACIO',
    ],
    fieldPriority: [
      'REGIM', 'RÈGIM', 'TIPUS_ENP', 'CATEGORIA', 'TIPUS',
    ],
    detectionKeywords: [
      'espai natural', 'enp', 'parc natural', 'paratge', 'reserva natural',
      'microrreserva', 'zona humida', 'xarxa natura', 'lic', 'zepa', 'zec',
      'natura_2000', 'proteg',
    ],
    sampleValueHints: [
      'parc natural', 'paratge natural', 'reserva natural', 'microrreserva',
      'zona humida', 'lic', 'zepa', 'zec', 'ramsar',
    ],
    defaultPalette: 'urbana',
    legendTitle: 'Règim de protecció',
    mappings: {
      'PARC NATURAL': { label: 'Parc Natural', color: '#023047' },
      'PARATGE NATURAL MUNICIPAL': { label: 'Paratge Natural Municipal', color: '#219ebc' },
      'PARATGE NATURAL': { label: 'Paratge Natural', color: '#219ebc' },
      'RESERVA NATURAL': { label: 'Reserva Natural', color: '#007200' },
      'RESERVA NATURAL INTEGRAL': { label: 'Reserva Natural Integral', color: '#007200' },
      'RESERVA NATURAL PARCIAL': { label: 'Reserva Natural Parcial', color: '#2a9d8f' },
      'MICRORRESERVA': { label: 'Microrreserva de Flora', color: '#a8dadc' },
      'MICRORRESERVA DE FLORA': { label: 'Microrreserva de Flora', color: '#a8dadc' },
      'ZONA HUMIDA': { label: 'Zona Humida', color: '#8ecae6' },
      'LLOCS RAMSAR': { label: 'Lloc Ramsar', color: '#0096c7' },
      'LIC': { label: 'LIC / ZEC', color: '#2a9d8f' },
      'ZEC': { label: 'ZEC', color: '#2a9d8f' },
      'ZEPA': { label: 'ZEPA', color: '#457b9d' },
    },
    defaultStyle: {},
  },
  {
    id: 'gva-habitat-tipus',
    name: 'Hàbitats naturals',
    group: 'environment',
    description: 'Classifica polígons per tipus d\'hàbitat (Directiva Hàbitats, cartografia CORINE).',
    suggestedFields: [
      'HABITAT', 'HÀBITAT', 'TIPUS_HABITAT', 'COD_HABITAT', 'CORINE', 'COBERTA',
    ],
    fieldPriority: [
      'HABITAT', 'HÀBITAT', 'TIPUS_HABITAT', 'COD_HABITAT', 'CORINE',
    ],
    detectionKeywords: [
      'habitat', 'hàbitat', 'corine', 'coberta terrestre', 'vegetacio', 'flora',
    ],
    sampleValueHints: [
      'bosc', 'garriga', 'matollar', 'prat', 'aiguamoll',
    ],
    defaultPalette: 'urbana',
    legendTitle: 'Tipus d\'hàbitat',
    mappings: {
      'BOSC': { label: 'Bosc' },
      'GARRIGA': { label: 'Garriga' },
      'MATOLLAR': { label: 'Matollar' },
      'PRAT': { label: 'Prat i herbassar' },
      'AIGUAMOLL': { label: 'Aiguamoll' },
      'CULTIU': { label: 'Cultiu agrícola' },
    },
    defaultStyle: {},
  },
]
