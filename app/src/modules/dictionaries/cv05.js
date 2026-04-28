/**
 * CV05 — Cartografia Base de la Comunitat Valenciana (escala 1:5.000)
 * Institut Cartogràfic Valencià (ICV / GVA)
 *
 * Els mappings estan organitzats PER CAMP ('grupo', 'ficha'), no com a mapping pla,
 * perquè el mateix codi pot tindre significats distints segons el camp.
 *
 * IMPORTANT: Només es registren codis verificats en dades reals dels serveis WFS.
 * No inventar traduccions per a codis desconeguts — mantindre el codi tècnic com a label.
 */

// ─── Diccionaris ──────────────────────────────────────────────────────────────

export const CV05_DICTIONARIES = {
  cv05_edificaciones: {
    id: 'cv05_edificaciones',
    name: 'CV05 — Edificacions',
    description: 'Edificacions i construccions de la cartografia base CV05 (ICV).',
    targetTypeName: 'ms:EdificacionesBCV05',
    preferredField: 'grupo',
    targetFields: ['grupo', 'ficha'],
    legendTitle: 'Edificacions',
    defaultPalette: 'urbana',
    mappings: {
      grupo: {
        CONSTRUCCIONES: 'Construccions',
      },
      ficha: {
        CON01: 'Construcció principal',
        CON15: 'Altres construccions',
      },
    },
  },

  cv05_construcciones: {
    id: 'cv05_construcciones',
    name: 'CV05 — Construccions',
    description: 'Construccions de la cartografia base CV05 (ICV).',
    targetTypeName: 'ms:ConstruccionesBCV05',
    preferredField: 'grupo',
    targetFields: ['grupo', 'ficha'],
    legendTitle: 'Construccions',
    defaultPalette: 'urbana',
    mappings: {
      grupo: {
        CONSTRUCCIONES: 'Construccions',
      },
      ficha: {},
    },
  },

  cv05_hidrografia: {
    id: 'cv05_hidrografia',
    name: 'CV05 — Hidrografia',
    description: "Masses i cursos d'aigua de la cartografia base CV05 (ICV).",
    targetTypeName: 'ms:HidrografiaBCV05',
    preferredField: 'grupo',
    targetFields: ['grupo', 'ficha'],
    legendTitle: 'Hidrografia',
    defaultPalette: 'default',
    mappings: {
      grupo: {
        'HIDROGRAFÍA': 'Hidrografia',
        HIDROGRAFIA: 'Hidrografia',
      },
      ficha: {},
    },
  },

  cv05_hidrolineal: {
    id: 'cv05_hidrolineal',
    name: 'CV05 — Hidrografia lineal',
    description: 'Cursos fluvials lineals de la cartografia base CV05 (ICV).',
    targetTypeName: 'ms:HidrolinealBCV05',
    preferredField: 'grupo',
    targetFields: ['grupo', 'ficha'],
    legendTitle: 'Hidrografia lineal',
    defaultPalette: 'default',
    mappings: {
      grupo: {
        'HIDROGRAFÍA': 'Hidrografia',
        HIDROGRAFIA: 'Hidrografia',
      },
      ficha: {},
    },
  },

  cv05_red_comunicaciones: {
    id: 'cv05_red_comunicaciones',
    name: 'CV05 — Xarxa de comunicacions',
    description: 'Xarxa viària i comunicacions de la cartografia base CV05 (ICV).',
    targetTypeName: 'ms:RedComunicacionesBCV05',
    preferredField: 'grupo',
    targetFields: ['grupo', 'ficha'],
    legendTitle: 'Xarxa de comunicacions',
    defaultPalette: 'default',
    mappings: {
      grupo: {
        COMUNICACIONES: 'Comunicacions',
        COMUNICACIONS: 'Comunicacions',
      },
      ficha: {},
    },
  },

  cv05_infraestructuras_viarias: {
    id: 'cv05_infraestructuras_viarias',
    name: 'CV05 — Infraestructures viàries',
    description: 'Infraestructures viàries de la cartografia base CV05 (ICV).',
    targetTypeName: 'ms:InfraestructurasViariasBCV05',
    preferredField: 'grupo',
    targetFields: ['grupo', 'ficha'],
    legendTitle: 'Infraestructures viàries',
    defaultPalette: 'default',
    mappings: {
      grupo: {
        COMUNICACIONES: 'Comunicacions',
        'INFRAESTRUCTURAS VIARIAS': 'Infraestructures viàries',
      },
      ficha: {},
    },
  },

  cv05_cultivos: {
    id: 'cv05_cultivos',
    name: 'CV05 — Cultius',
    description: 'Cobertes de conreu de la cartografia base CV05 (ICV).',
    targetTypeName: 'ms:CultivosBCV05',
    preferredField: 'grupo',
    targetFields: ['grupo', 'ficha'],
    legendTitle: 'Cultius',
    defaultPalette: 'default',
    mappings: {
      grupo: {
        CULTIVOS: 'Cultius',
        CULTIUS: 'Cultius',
      },
      ficha: {},
    },
  },

  cv05_zonas_arboladas: {
    id: 'cv05_zonas_arboladas',
    name: 'CV05 — Zones arbrades',
    description: 'Zones amb arbres de la cartografia base CV05 (ICV).',
    targetTypeName: 'ms:ZonasArboladasBCV05',
    preferredField: 'grupo',
    targetFields: ['grupo', 'ficha'],
    legendTitle: 'Zones arbrades',
    defaultPalette: 'default',
    mappings: {
      grupo: {
        'ZONAS ARBOLADAS': 'Zones arbrades',
        'ZONES AMB ARBRES': 'Zones arbrades',
      },
      ficha: {},
    },
  },
}

// ─── Utilitats ────────────────────────────────────────────────────────────────

/**
 * Returns the CV05 dictionary that best matches the given layer hints.
 * Detection order: dictionaryId (exact) → typeName → targetFields overlap.
 *
 * @param {{ dictionaryId?: string, typeName?: string, fields?: string[] }}
 * @returns {object|null}
 */
export function getCv05DictionaryForLayer({ dictionaryId, typeName, fields = [] }) {
  if (dictionaryId && CV05_DICTIONARIES[dictionaryId]) {
    return CV05_DICTIONARIES[dictionaryId]
  }

  const dicts = Object.values(CV05_DICTIONARIES)

  if (typeName) {
    const byType = dicts.find((d) => d.targetTypeName === typeName)
    if (byType) return byType
  }

  if (fields.length > 0) {
    const fLower = fields.map((f) => f.toLowerCase())
    const byFields = dicts.find((d) =>
      d.targetFields.every((tf) => fLower.includes(tf.toLowerCase())),
    )
    if (byFields) return byFields
  }

  return null
}

/**
 * Translates a single value for a given field using the CV05 per-field mapping.
 * Returns null if no translation exists — the caller should keep the original value as label.
 *
 * @param {{ dictionary: object, field: string, value: string|null }}
 * @returns {string|null}
 */
export function translateCv05Value({ dictionary, field, value }) {
  if (!dictionary || !field || value == null) return null
  const fieldMap = dictionary.mappings?.[field]
  if (!fieldMap) return null
  return fieldMap[String(value)] ?? null
}

/**
 * Returns the list of raw values in categories that have no translation in the dictionary
 * for the given field. These should be displayed to the user as pending/unknown.
 *
 * @param {{ categories: object[], dictionary: object, field: string }}
 * @returns {string[]}  — unique raw value strings without a known translation
 */
export function collectUnknownCv05Values({ categories, dictionary, field }) {
  if (!dictionary || !field || !Array.isArray(categories)) return []
  const fieldMap = dictionary.mappings?.[field] ?? {}
  const unknown = new Set()
  for (const cat of categories) {
    if (cat.value == null) continue
    const raw = String(cat.value)
    if (fieldMap[raw] == null) unknown.add(raw)
  }
  return [...unknown]
}
