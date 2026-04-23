/** Presets for GVA social services and social equipment layers. */

export const SOCIAL_PRESETS = [
  {
    id: 'gva-social-tipus-equip',
    name: 'Equipaments de serveis socials',
    group: 'social',
    description: 'Classifica equipaments per tipologia (residència, centre de dia, serveis bàsics…).',
    suggestedFields: [
      'TIPUS_EQUIP', 'TIPOLOGIA', 'TIPUS', 'SERVEI', 'CATEGORIA', 'CLASSE_EQUIP',
    ],
    fieldPriority: [
      'TIPUS_EQUIP', 'TIPOLOGIA', 'SERVEI', 'TIPUS', 'CATEGORIA',
    ],
    detectionKeywords: [
      'servei social', 'equipament social', 'depend', 'residencia', 'centre dia',
      'exclusio social', 'vulnerab', 'atenció social', 'atencio social',
    ],
    sampleValueHints: [
      'residència', 'centre de dia', 'serveis bàsics', 'serveis basics',
      'residencia', 'centre dia', 'sad',
    ],
    defaultPalette: 'default',
    legendTitle: 'Tipologia d\'equipament social',
    mappings: {
      'RESIDÈNCIA': { label: 'Residència de Majors', color: '#8338ec' },
      'RESIDENCIA': { label: 'Residència de Majors', color: '#8338ec' },
      'RESIDÈNCIA PERSONES MAJORS': { label: 'Residència de Majors', color: '#8338ec' },
      'CENTRE DE DIA': { label: 'Centre de Dia', color: '#3a86ff' },
      'CENTRE DIA': { label: 'Centre de Dia', color: '#3a86ff' },
      'SERVEIS BÀSICS': { label: 'Serveis Bàsics d\'Atenció Social', color: '#06d6a0' },
      'SERVEIS BASICS': { label: 'Serveis Bàsics d\'Atenció Social', color: '#06d6a0' },
      'SAD': { label: 'Servei d\'Atenció a Domicili', color: '#4cc9f0' },
      'SERVEI ATENCIÓ A DOMICILI': { label: 'Servei d\'Atenció a Domicili', color: '#4cc9f0' },
      'CENTRE SOCIAL': { label: 'Centre Social', color: '#2a9d8f' },
      'CENTRE OCUPACIONAL': { label: 'Centre Ocupacional', color: '#e9c46a' },
      'CENTRE ESPECIAL TREBALL': { label: 'Centre Especial de Treball', color: '#f4a261' },
    },
    defaultStyle: {},
  },
  {
    id: 'gva-social-renda',
    name: 'Vulnerabilitat socioeconòmica',
    group: 'social',
    description: 'Classifica àrees per nivell de vulnerabilitat o renda.',
    suggestedFields: [
      'VULNERABILITAT', 'VULNERABILIDAD', 'PRIORITAT', 'RENDA', 'NIVEL_RENTA',
      'GRAU_VULNERABILITAT', 'INDICADOR',
    ],
    fieldPriority: [
      'GRAU_VULNERABILITAT', 'VULNERABILITAT', 'PRIORITAT', 'RENDA', 'NIVEL_RENTA',
    ],
    detectionKeywords: [
      'vulnerab', 'renda', 'renta', 'exclusio', 'pobresa', 'risc social',
    ],
    sampleValueHints: [
      'alta', 'mitja', 'baixa', 'molt alta', 'vulnerable',
    ],
    defaultPalette: 'contrast',
    legendTitle: 'Vulnerabilitat socioeconòmica',
    mappings: {
      'MOLT ALTA': { label: 'Molt alta', color: '#d62828' },
      'ALTA': { label: 'Alta', color: '#e85d04' },
      'MITJA': { label: 'Mitjana', color: '#e9c46a' },
      'MITJANA': { label: 'Mitjana', color: '#e9c46a' },
      'BAIXA': { label: 'Baixa', color: '#2dc653' },
      'MOLT BAIXA': { label: 'Molt baixa', color: '#007200' },
      '1': { label: 'Molt alta', color: '#d62828' },
      '2': { label: 'Alta', color: '#e85d04' },
      '3': { label: 'Mitjana', color: '#e9c46a' },
      '4': { label: 'Baixa', color: '#2dc653' },
      '5': { label: 'Molt baixa', color: '#007200' },
    },
    defaultStyle: {},
  },
]
