/**
 * Diccionari de planejament urbanístic.
 * Codis de classificació i qualificació del sòl (LOTUP / PGOU).
 *
 * Cobreix la terminologia de la Comunitat Valenciana (LOTUP, PGOU estàndard).
 * Cada municipi pot usar codis lleugerament diferents; aquest diccionari recull
 * els més habituals en la documentació de GVA i ajuntaments valencians.
 */

export const PLANNING_DICTIONARY = {
  id: 'planning',
  name: 'Planejament Urbanístic (LOTUP/PGOU)',
  description: 'Tradueix codis de classificació i qualificació del sòl de planejament urbanístic.',
  targetFields: [
    'CLAS_URBA', 'CLASIFICACION', 'CALIF_URBA', 'CALIFICACION',
    'USO_GLOBAL', 'USO_PORM', 'ZONA', 'COD_ZONA', 'TIPOLOGIA',
    'CLASIFICACION_SUELO', 'CALIFICACION_SUELO', 'TIPO_SUELO',
    'REGIM', 'N_REGIMEN', 'CODI_CLASSIF',
  ],

  mappings: {
    // ── Classificació del sòl (LOTUP) ──
    SU: 'Sòl Urbà',
    SUC: 'Sòl Urbà Consolidat',
    SUNC: 'Sòl Urbà No Consolidat',
    SUB: 'Sòl Urbanitzable',
    SUBP: 'Sòl Urbanitzable Programat',
    SUBS: 'Sòl Urbanitzable Sense Programa',
    SNU: 'Sòl No Urbanitzable',
    SNUE: 'Sòl No Urbanitzable d\'Especial Protecció',
    SNUG: 'Sòl No Urbanitzable de Protecció General',
    SNUC: 'Sòl No Urbanitzable Comú',
    SNUA: 'Sòl No Urbanitzable Agrícola',
    SNUF: 'Sòl No Urbanitzable Forestal',
    SNUEP: 'Sòl No Urbanitzable d\'Especial Protecció',

    // ── Qualificació residencial ──
    R: 'Residencial',
    RI: 'Residencial Intensiu',
    RB: 'Residencial Baixa Densitat',
    RE: 'Residencial Extensiu',
    RM: 'Residencial Mig',
    RC: 'Residencial en Casc Antic',
    RU: 'Residencial Unifamiliar',
    RP: 'Residencial Plurifamiliar',

    // ── Qualificació industrial ──
    I: 'Industrial',
    IA: 'Industrial Actiu',
    IL: 'Industrial Lleuger',
    IB: 'Industrial Bàsic (gran indústria)',
    IN: 'Industrial i Logística',

    // ── Qualificació terciari ──
    C: 'Comercial',
    CM: 'Comercial Mitjà i Gran',
    S: 'Serveis',
    O: 'Oficines i Serveis Avançats',
    H: 'Hoteler i Turístic',
    T: 'Terciari Mixt',

    // ── Dotacional i equipaments ──
    EQ: 'Equipament',
    EQD: 'Equipament Docent / Educatiu',
    EQS: 'Equipament Sanitari',
    EQE: 'Equipament Esportiu',
    EQC: 'Equipament Cultural',
    EQA: 'Equipament Assistencial / Social',
    EQR: 'Equipament Religiós',
    EQP: 'Equipament de Protecció (bombers, policia)',
    D: 'Dotacional',
    DA: 'Dotacional Administratiu',

    // ── Sistemes generals i locals ──
    VIA: 'Viari',
    SV: 'Sistema Viari',
    ZV: 'Zona Verda',
    PP: 'Parc Públic',
    JP: 'Jardí Públic',
    SP: 'Sistema d\'Espais Lliures',
    SPP: 'Sòl d\'Espais Protegits',
    SPE: 'Sòl de Protecció Especial',

    // ── Mixtes i altres ──
    M: 'Mixt Residencial i Terciari',
    MR: 'Mixt Residencial',
    MC: 'Mixt Comercial',
    AG: 'Agrícola',
    AGR: 'Agrícola Protegida',
    TU: 'Turístic i Recreatiu',
    P: 'Portuari',
    AE: 'Aeroportuari',
    IF: 'Infraestructures',
    NU: 'No Urbanitzable / No Qualificat',

    // ── Codis numèrics habituals ──
    '1': 'Sòl Urbà',
    '2': 'Sòl Urbanitzable',
    '3': 'Sòl No Urbanitzable',
    '4': 'Sòl No Urbanitzable d\'Especial Protecció',
  },
}
