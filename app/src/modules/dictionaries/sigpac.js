/**
 * SIGPAC — Sistema de Información Geográfica de Parcelas Agrícolas
 * Codis d'ús agrícola de la parcel·la.
 *
 * Referència oficial FEGA. Codis de 2 lletres majúscules.
 */

export const SIGPAC_DICTIONARY = {
  id: 'sigpac',
  name: 'SIGPAC — Usos de Parcel·la Agrícola',
  description: 'Tradueix codis d\'ús SIGPAC (USO_SIGPAC) a noms llegibles.',
  targetFields: ['USO_SIGPAC', 'USO', 'SIGPAC_USO', 'SIGPAC_USE', 'USO_DECLARADO', 'USO_ACTUAL'],

  mappings: {
    // ── Conreus ──
    TA: 'Terra llaurada (conreus herbacis)',
    TH: 'Terra llaurada en regadiu (humida)',
    VI: 'Vinya',
    CF: 'Cítrics',
    OV: 'Olivar en terra de conreu',
    OF: 'Olivar en terra forestal',
    FY: 'Fruita seca (ametler, garrofer, figuera)',
    FS: 'Fruiters en secà',
    FR: 'Fruiters en regadiu',
    FV: 'Horticultura i fruticultura',
    CS: 'Conreus en hivernacle',
    OC: 'Altres conreus',
    AG: 'Associació de conreus',
    FL: 'Frondoses en terra de conreu',

    // ── Pastures i prats ──
    PR: 'Prat o pradera',
    PS: 'Pastura',
    PA: 'Pastura arbustiva',
    PE: 'Pastura d\'alta muntanya',

    // ── Forestal ──
    FO: 'Forestal (arbrat)',
    CO: 'Coníferes (zona forestal)',
    CI: 'Coníferes en terra de conreu',
    FP: 'Frondoses de producció',
    MT: 'Matollar forestal',

    // ── Improductiu i altres ──
    IM: 'Improductiu',
    IS: 'Improductiu en secà',
    IV: 'Improductiu variat',
    EP: 'Element del paisatge (arbre, bassa, marges)',
    CA: 'Via ramadera (cañada)',
    VF: 'Viari i ferrocarril',
    VO: 'Vies i obres',

    // ── Urbà ──
    ZU: 'Zona urbana',
    ZV: 'Zona verda urbana',
    ED: 'Edificació',

    // ── Zones especials ──
    PT: 'Platja, dunes i arenals',
    RO: 'Roques, pedreres',
    SO: 'Terres ermes (sequera o erosió)',
    RI: 'Ribera i lleres fluvials',
    AG2: 'Llac, embassament, llacuna',
    ZH: 'Zona humida',
  },
}
