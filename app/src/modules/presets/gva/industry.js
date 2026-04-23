/** Presets for GVA industrial and economic activity layers. */

export const INDUSTRY_PRESETS = [
  {
    id: 'gva-industry-sector',
    name: 'Sector econòmic (CNAE)',
    group: 'industry',
    description: 'Classifica activitats econòmiques per sector (primari, secundari, terciari) o divisió CNAE.',
    suggestedFields: [
      'SECTOR', 'CNAE', 'CLASSE_CNAE', 'DIVISIO_CNAE', 'ACTIVITAT', 'GRUP_ACTIVITAT',
    ],
    fieldPriority: [
      'SECTOR', 'CLASSE_CNAE', 'DIVISIO_CNAE', 'CNAE', 'ACTIVITAT',
    ],
    detectionKeywords: [
      'cnae', 'activitat econom', 'industria', 'empresa', 'sector economic',
      'activitats', 'comerç', 'comerc',
    ],
    sampleValueHints: [
      'primari', 'secundari', 'terciari', 'industrial', 'comerç', 'comerc',
      'agricultura', 'serveis', 'construccio',
    ],
    defaultPalette: 'default',
    legendTitle: 'Sector econòmic',
    mappings: {
      'PRIMARI': { label: 'Sector Primari', color: '#06d6a0' },
      'A': { label: 'Agricultura, ramaderia, silvicultura', color: '#06d6a0' },
      'B': { label: 'Indústries extractives', color: '#457b9d' },
      'SECUNDARI': { label: 'Sector Secundari', color: '#3a86ff' },
      'C': { label: 'Indústria manufacturera', color: '#3a86ff' },
      'D': { label: 'Energia elèctrica i gas', color: '#ffbe0b' },
      'E': { label: 'Subministrament d\'aigua', color: '#4cc9f0' },
      'F': { label: 'Construcció', color: '#f4a261' },
      'TERCIARI': { label: 'Sector Terciari', color: '#8338ec' },
      'G': { label: 'Comerç a l\'engròs i detall', color: '#b5179e' },
      'I': { label: 'Hostaleria', color: '#e63946' },
    },
    defaultStyle: {},
  },
  {
    id: 'gva-industry-zona',
    name: 'Zones industrials i productives',
    group: 'industry',
    description: 'Classifica àrees per tipologia de zona industrial o productiva.',
    suggestedFields: [
      'TIPOLOGIA', 'TIPUS_ZONA', 'CATEGORIA', 'ZONA',
    ],
    fieldPriority: [
      'TIPOLOGIA', 'TIPUS_ZONA', 'CATEGORIA', 'ZONA',
    ],
    detectionKeywords: [
      'poligon industrial', 'polígon industrial', 'zona industrial',
      'parc tecnologic', 'parc tecnològic', 'area industrial', 'àrea industrial',
    ],
    sampleValueHints: [
      'polígon industrial', 'poligon industrial', 'parc tecnològic',
      'area logistica', 'àrea logística',
    ],
    defaultPalette: 'diagnostic',
    legendTitle: 'Tipologia de zona',
    mappings: {
      'POLÍGON INDUSTRIAL': { label: 'Polígon Industrial' },
      'POLIGON INDUSTRIAL': { label: 'Polígon Industrial' },
      'PARC TECNOLÒGIC': { label: 'Parc Tecnològic' },
      'PARC TECNOLOGIC': { label: 'Parc Tecnològic' },
      'ÀREA LOGÍSTICA': { label: 'Àrea Logística' },
      'AREA LOGISTICA': { label: 'Àrea Logística' },
      'ZONA COMERCIAL': { label: 'Zona Comercial' },
    },
    defaultStyle: {},
  },
]
