/** Presets for GVA urban regeneration layers (ARI, ARRU, ARSE, àrees de rehabilitació). */

export const URBAN_REGENERATION_PRESETS = [
  {
    id: 'gva-uregen-prioritat',
    name: 'Prioritat de regeneració urbana',
    group: 'urbanRegeneration',
    description: 'Classifica àrees per nivell de prioritat d\'intervenció (alta, mitja, baixa).',
    suggestedFields: [
      'PRIORITAT', 'PRIORIDAD', 'NIVELL_PRIORITAT', 'GRAU_PRIORITAT',
      'FASE', 'ESTAT_ACTUACIO',
    ],
    fieldPriority: [
      'PRIORITAT', 'GRAU_PRIORITAT', 'NIVELL_PRIORITAT', 'PRIORIDAD', 'FASE',
    ],
    detectionKeywords: [
      'regeneraci', 'rehabilitaci', 'ari', 'arru', 'arse', 'renovaci',
      'barri', 'area renovaci', 'intervenció urbana', 'intervencio urbana',
    ],
    sampleValueHints: [
      'alta', 'mitja', 'baixa', 'molt alta', 'urgent', 'preferent',
    ],
    defaultPalette: 'contrast',
    legendTitle: 'Prioritat de regeneració',
    mappings: {
      'MOLT ALTA': { label: 'Molt alta', color: '#d62828' },
      'ALTA': { label: 'Alta', color: '#e85d04' },
      'MITJA': { label: 'Mitja', color: '#e9c46a' },
      'MITJANA': { label: 'Mitja', color: '#e9c46a' },
      'BAIXA': { label: 'Baixa', color: '#2dc653' },
      'MOLT BAIXA': { label: 'Molt baixa', color: '#007200' },
      // Numeric codes
      '1': { label: 'Molt alta', color: '#d62828' },
      '2': { label: 'Alta', color: '#e85d04' },
      '3': { label: 'Mitja', color: '#e9c46a' },
      '4': { label: 'Baixa', color: '#2dc653' },
      // Phase names
      'URGENT': { label: 'Urgent', color: '#d62828' },
      'PREFERENT': { label: 'Preferent', color: '#e85d04' },
      'RECOMANAT': { label: 'Recomanat', color: '#e9c46a' },
    },
    defaultStyle: {},
  },
  {
    id: 'gva-uregen-tipus-area',
    name: 'Tipus d\'àrea de regeneració',
    group: 'urbanRegeneration',
    description: 'Classifica les àrees de rehabilitació per tipologia (ARI, ARRU, ARSE, etc.).',
    suggestedFields: [
      'TIPUS_AREA', 'TIPUS_ARI', 'CATEGORIA', 'TIPOLOGIA', 'AMBIT', 'ÀMBIT',
    ],
    fieldPriority: [
      'TIPUS_AREA', 'TIPUS_ARI', 'TIPOLOGIA', 'CATEGORIA',
    ],
    detectionKeywords: [
      'ari', 'arru', 'arse', 'area rehabilitaci', 'àrea rehabilitació',
    ],
    sampleValueHints: [
      'ari', 'arru', 'arse', 'rehabilitació',
    ],
    defaultPalette: 'default',
    legendTitle: 'Tipus d\'àrea de rehabilitació',
    mappings: {
      'ARI': { label: 'Àrea de Rehabilitació Integral (ARI)', color: '#e63946' },
      'ARRU': { label: 'Àrea de Regeneració i Renovació Urbana (ARRU)', color: '#8338ec' },
      'ARSE': { label: 'Àrea de Rehabilitació del Sector Envellit (ARSE)', color: '#f4a261' },
    },
    defaultStyle: {},
  },
]
