/** Presets for GVA cultural heritage layers (BIC, BRL, patrimoni). */

export const HERITAGE_PRESETS = [
  {
    id: 'gva-heritage-bic-categoria',
    name: 'Béns d\'Interès Cultural (BIC)',
    group: 'heritage',
    description: 'Classifica elements patrimonials per categoria de protecció (BIC, BRL, ETCPV).',
    suggestedFields: [
      'CATEGORIA', 'REGIM', 'RÈGIM', 'TIPUS_BIC', 'GRAU_PROTECCIO',
      'GRAU_PROTECCIÓ', 'NIVELL_PROTECCIO',
    ],
    fieldPriority: [
      'CATEGORIA', 'GRAU_PROTECCIO', 'GRAU_PROTECCIÓ', 'REGIM', 'RÈGIM', 'TIPUS_BIC',
    ],
    detectionKeywords: [
      'patrimoni', 'bic', 'brl', 'cultural', 'monument', 'conjunt historic',
      'conjunt històric', 'etcpv', 'catalogat', 'proteg',
    ],
    sampleValueHints: [
      'bic', 'brl', 'etcpv', 'monument', 'conjunt', 'jardí',
    ],
    defaultPalette: 'default',
    legendTitle: 'Categoria de protecció',
    mappings: {
      'BIC': { label: 'Bé d\'Interès Cultural', color: '#b5179e' },
      'BRL': { label: 'Bé de Rellevància Local', color: '#8338ec' },
      'ETCPV': { label: 'Espai de Trajectòria Cultural del PV', color: '#3a86ff' },
      'MONUMENT': { label: 'Monument', color: '#e63946' },
      'CONJUNT HISTÒRIC': { label: 'Conjunt Històric', color: '#fb5607' },
      'CONJUNT HISTORIC': { label: 'Conjunt Històric', color: '#fb5607' },
      'JARDÍ HISTÒRIC': { label: 'Jardí Històric', color: '#06d6a0' },
      'JARDI HISTORIC': { label: 'Jardí Històric', color: '#06d6a0' },
      'LLOC HISTÒRIC': { label: 'Lloc Històric', color: '#ffbe0b' },
      'LLOC HISTORIC': { label: 'Lloc Històric', color: '#ffbe0b' },
      'ZONA ARQUEOLÒGICA': { label: 'Zona Arqueològica', color: '#f4a261' },
      'ZONA ARQUEOLOGICA': { label: 'Zona Arqueològica', color: '#f4a261' },
      'ESPAI ETNOLÒGIC': { label: 'Espai Etnològic', color: '#4cc9f0' },
    },
    defaultStyle: {},
  },
  {
    id: 'gva-heritage-tipologia',
    name: 'Tipologia de patrimoni',
    group: 'heritage',
    description: 'Classifica elements per tipologia: arqueològic, arquitectònic, industrial, etc.',
    suggestedFields: [
      'TIPOLOGIA', 'TIPUS', 'TIPUS_PATRIMONI', 'SUBTIPUS',
    ],
    fieldPriority: [
      'TIPOLOGIA', 'TIPUS_PATRIMONI', 'TIPUS', 'SUBTIPUS',
    ],
    detectionKeywords: [
      'patrimoni', 'arqueolo', 'arquitecton', 'industrial',
    ],
    sampleValueHints: [
      'arqueològic', 'arquitectònic', 'industrial', 'etnològic', 'documental',
      'arqueologic', 'arquitectonic', 'etnologic',
    ],
    defaultPalette: 'default',
    legendTitle: 'Tipologia patrimonial',
    mappings: {
      'ARQUEOLÒGIC': { label: 'Arqueològic' },
      'ARQUEOLOGIC': { label: 'Arqueològic' },
      'ARQUITECTÒNIC': { label: 'Arquitectònic' },
      'ARQUITECTONIC': { label: 'Arquitectònic' },
      'INDUSTRIAL': { label: 'Industrial' },
      'ETNOLÒGIC': { label: 'Etnològic' },
      'ETNOLOGIC': { label: 'Etnològic' },
      'NATURAL': { label: 'Natural' },
      'DOCUMENTAL': { label: 'Documental' },
    },
    defaultStyle: {},
  },
]
