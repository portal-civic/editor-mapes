/**
 * SIOSE — Sistema de Información sobre Ocupación del Suelo de España
 * Codi de coberta del sòl i usos.
 *
 * Els valors poden ser simples (PST) o compostos (UCS(90EDFem_10VAP)).
 * La funció translateCategoryValue de l'index.js gestiona els compostos.
 */

export const SIOSE_DICTIONARY = {
  id: 'siose',
  name: 'SIOSE — Coberta i Usos del Sòl',
  description: 'Tradueix codis tècnics SIOSE a noms llegibles en valencià.',
  targetFields: ['SIOSE_CODE', 'SIOSE_CODIGO', 'COD_SIOSE', 'CODIGO_SIOSE', 'SIOSE'],

  // Codes appear as keys; values are human labels in Valencian.
  // Longer/more specific codes take priority over prefixes (handled by the resolver).
  mappings: {
    // ── Associació (wrapper per a valors compostos) ──
    R: 'Mescla',
    A: 'Associació',

    // ── Artificial: teixit urbà ──
    UCS: 'Teixit urbà compacte',
    UCO: 'Teixit urbà discontínu',
    URS: 'Teixit urbà dispers',
    UPL: 'Urbanització planificada',

    // ── Artificial: edificació ──
    EDF: 'Edificació',
    EDFem: 'Edificació (ús residencial)',
    EDFnv: 'Edificació (ús no residencial)',
    EDFin: 'Edificació industrial',

    // ── Artificial: infraestructures ──
    VAP: 'Vials, aparcaments i zones pavimentades',
    ZIN: 'Zona industrial i comercial',
    ZDP: 'Zones esportives i recreatives',
    ZEV: 'Zones verdes urbanes',
    PRT: 'Port',
    AER: 'Aeroport i infraestructura aeronàutica',
    MIN: 'Mines, pedreres i abocadors',
    INF: 'Infraestructura (xarxa, línia, instal·lació)',
    VES: 'Abocador o dipòsit de residus',

    // ── Agrícola: herbacis ──
    CHL: 'Conreus herbacis en secà',
    CHLre: 'Conreus herbacis en regadiu',
    CHLsc: 'Conreus herbacis en secà',
    CAF: 'Guaret (terres en repòs)',
    CAFre: 'Guaret en regadiu',
    CVA: 'Conreus en verd (horticultura)',

    // ── Agrícola: llenyosos ──
    LF: 'Conreus llenyosos',
    LFCrr: 'Cítrics en regadiu',
    LFCse: 'Cítrics en secà',
    LFVrr: 'Vinya en regadiu',
    LFVse: 'Vinya en secà',
    LFOlr: 'Olivera en regadiu',
    LFOls: 'Olivera en secà',
    LFFr: 'Fruiters',
    LFFs: 'Fruita seca (ametler, garrofer, figuera)',
    LFRr: 'Arrossar',
    LFAr: 'Arròs',
    LOL: 'Conreus llenyosos (altre)',

    // ── Natural: forestal ──
    CNF: 'Coníferes',
    CNFpi: 'Pinar',
    CNFal: 'Atzetza / pi d\'Alep',
    FDS: 'Frondoses',
    FDSqr: 'Carrasca i alzina',
    FDSmx: 'Frondoses mixtes',

    // ── Natural: matollar i pastura ──
    MTR: 'Matollar',
    MTRfr: 'Matollar amb frondoses',
    MTRcn: 'Matollar amb coníferes',
    PST: 'Pastures',
    PSTpc: 'Pastures poc cobertes',
    PSTal: 'Pastures amb arbres',

    // ── Natural: sòl nu i roques ──
    NRV: 'Sòl nu o àrees sense vegetació',
    ROC: 'Roques i roquissars',
    TER: 'Terres ermes',
    ARE: 'Sorres i zones arenoses',
    PLA: 'Platja, dunes i arenal',
    GLK: 'Glaceres i neus perpètues',

    // ── Aigüa ──
    LAA: 'Làmina d\'aigua artificial (embassament, bassa)',
    LAN: 'Làmina d\'aigua natural (llac, llacuna)',
    LAR: 'Curs fluvial (riu, rambla)',
    ZHU: 'Zona humida / aiguamoll',
    ZHL: 'Zona humida litoral',
    MAR: 'Mar i zones costaneres',
  },
}
