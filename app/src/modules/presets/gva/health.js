/** Presets for GVA health layers (centres sanitaris, zones de salut). */

export const HEALTH_PRESETS = [
  {
    id: 'gva-health-tipus-centre',
    name: 'Centres sanitaris',
    group: 'health',
    description: 'Classifica centres per tipologia (hospital, centre de salut, consultori, PAC…).',
    suggestedFields: [
      'TIPUS_CENTRE', 'TIPOLOGIA', 'TIPUS', 'CATEGORIA', 'CLASSE',
    ],
    fieldPriority: [
      'TIPUS_CENTRE', 'TIPOLOGIA', 'TIPUS', 'CATEGORIA',
    ],
    detectionKeywords: [
      'sanita', 'salut', 'hospital', 'clinica', 'centre salut', 'consultori',
      'pac', 'csm', 'uad', 'atencio primaria',
    ],
    sampleValueHints: [
      'hospital', 'centre de salut', 'pac', 'consultori', 'csm',
    ],
    defaultPalette: 'urbana',
    legendTitle: 'Tipus de centre sanitari',
    mappings: {
      'HOSPITAL': { label: 'Hospital', color: '#d62828' },
      'HOSPITAL COMARCAL': { label: 'Hospital Comarcal', color: '#e85d04' },
      'CENTRE DE SALUT': { label: 'Centre de Salut', color: '#023e8a' },
      'CS': { label: 'Centre de Salut', color: '#023e8a' },
      'PAC': { label: 'Punt d\'Atenció Continuada', color: '#219ebc' },
      'CONSULTORI AUXILIAR': { label: 'Consultori Auxiliar', color: '#8ecae6' },
      'CONSULTORI': { label: 'Consultori', color: '#8ecae6' },
      'CSM': { label: 'Centre de Salut Mental', color: '#7b2d8b' },
      'CENTRE DE SALUT MENTAL': { label: 'Centre de Salut Mental', color: '#7b2d8b' },
      'UAD': { label: 'Unitat d\'Atenció a Drogodependències', color: '#9d4edd' },
      'CENTRE DE DIA': { label: 'Centre de Dia Sanitari', color: '#4cc9f0' },
    },
    defaultStyle: {},
  },
  {
    id: 'gva-health-zona-salut',
    name: 'Zones de salut',
    group: 'health',
    description: 'Classifica zones o departaments de salut de la xarxa sanitària de la GVA.',
    suggestedFields: [
      'DEPARTAMENT', 'ZONA_SALUT', 'SECTOR', 'AREA_SALUT',
    ],
    fieldPriority: [
      'DEPARTAMENT', 'ZONA_SALUT', 'AREA_SALUT', 'SECTOR',
    ],
    detectionKeywords: [
      'departament salut', 'zona salut', 'sector sanitari', 'area salut',
    ],
    sampleValueHints: [
      'departament', 'zona', 'sector',
    ],
    defaultPalette: 'urbana',
    legendTitle: 'Zona de salut',
    mappings: {},
    defaultStyle: {},
  },
]
