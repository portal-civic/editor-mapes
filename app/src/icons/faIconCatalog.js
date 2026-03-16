/**
 * Curated catalog of Font Awesome Free Solid icons for point marker selection.
 *
 * Each entry:
 *   id       — FA icon id, kebab-case without the "fa" prefix.
 *              Maps to the package variable as:  "fa" + PascalCase(id)
 *              e.g. "location-dot" → faLocationDot
 *   label    — Human-readable name (Catalan).
 *   category — Grouping key for UI filtering.
 *   tags     — Search keywords (Catalan + English).
 *
 * Icons missing from the installed FA version are skipped silently by the
 * resolver, so the list degrades gracefully across package versions.
 *
 * Extending this catalog in a later iteration (e.g. per-feature icon override)
 * does NOT require changing the resolver or the map rendering code.
 */
export const FA_ICON_CATALOG = [
  // ── General ───────────────────────────────────────────────────
  { id: 'location-dot',         label: 'Marcador',         category: 'general',        tags: ['pin', 'marker', 'location', 'punt'] },
  { id: 'map-pin',              label: 'Pin de mapa',      category: 'general',        tags: ['pin', 'map', 'marker'] },
  { id: 'star',                 label: 'Estrella',         category: 'general',        tags: ['star', 'estrella', 'favourite', 'important'] },
  { id: 'heart',                label: 'Cor',              category: 'general',        tags: ['heart', 'cor', 'love', 'favourite'] },
  { id: 'flag',                 label: 'Bandera',          category: 'general',        tags: ['flag', 'bandera', 'marker', 'country'] },
  { id: 'bookmark',             label: 'Marcapàgines',     category: 'general',        tags: ['bookmark', 'save', 'mark'] },
  { id: 'circle-info',          label: 'Informació',       category: 'general',        tags: ['info', 'informacio', 'help', 'circle'] },
  { id: 'triangle-exclamation', label: 'Avís',             category: 'general',        tags: ['alert', 'warning', 'avis', 'danger', 'caution'] },
  { id: 'circle-check',         label: 'Verificat',        category: 'general',        tags: ['check', 'done', 'ok', 'verified'] },
  { id: 'circle-xmark',         label: 'Error',            category: 'general',        tags: ['x', 'close', 'error', 'cancel'] },
  { id: 'bell',                 label: 'Campana',          category: 'general',        tags: ['bell', 'notification', 'alert', 'alarm'] },
  { id: 'circle-question',      label: 'Interrogant',      category: 'general',        tags: ['question', 'help', 'unknown'] },
  { id: 'eye',                  label: 'Ull',              category: 'general',        tags: ['eye', 'view', 'visible'] },
  { id: 'shield',               label: 'Escud',            category: 'general',        tags: ['shield', 'security', 'protect', 'safe'] },
  { id: 'lock',                 label: 'Accés restringit', category: 'general',        tags: ['lock', 'security', 'restricted'] },
  { id: 'key',                  label: 'Clau',             category: 'general',        tags: ['key', 'access', 'unlock'] },
  { id: 'thumbtack',            label: 'Agulla',           category: 'general',        tags: ['thumbtack', 'pin', 'fix', 'marker'] },

  // ── People ────────────────────────────────────────────────────
  { id: 'user',                 label: 'Persona',          category: 'people',         tags: ['person', 'user', 'individual'] },
  { id: 'users',                label: 'Grup',             category: 'people',         tags: ['people', 'group', 'team', 'community'] },
  { id: 'house',                label: 'Casa',             category: 'people',         tags: ['home', 'house', 'residence'] },
  { id: 'house-chimney',        label: 'Llar',             category: 'people',         tags: ['home', 'house', 'chimney', 'residence'] },

  // ── Services / Buildings ──────────────────────────────────────
  { id: 'building',             label: 'Edifici',          category: 'services',       tags: ['building', 'office', 'structure', 'edifici'] },
  { id: 'hospital',             label: 'Hospital',         category: 'services',       tags: ['hospital', 'health', 'medical', 'emergency', 'clinic'] },
  { id: 'building-columns',     label: 'Banc / Biblioteca',category: 'services',       tags: ['bank', 'library', 'columns', 'government', 'banc'] },
  { id: 'industry',             label: 'Indústria',        category: 'services',       tags: ['factory', 'industry', 'plant', 'manufacturing'] },
  { id: 'school',               label: 'Escola',           category: 'services',       tags: ['school', 'education', 'learning', 'children', 'escola'] },
  { id: 'graduation-cap',       label: 'Educació',         category: 'services',       tags: ['graduation', 'education', 'university', 'studies'] },
  { id: 'church',               label: 'Església',         category: 'services',       tags: ['church', 'religion', 'temple', 'worship', 'esglesia'] },
  { id: 'landmark',             label: 'Patrimoni',        category: 'services',       tags: ['landmark', 'monument', 'history', 'heritage', 'govern'] },
  { id: 'store',                label: 'Botiga',           category: 'services',       tags: ['shop', 'store', 'commerce', 'supermarket', 'botiga'] },
  { id: 'phone',                label: 'Telèfon',          category: 'services',       tags: ['phone', 'call', 'contact', 'telephone'] },
  { id: 'envelope',             label: 'Correu',           category: 'services',       tags: ['mail', 'email', 'letter', 'post', 'envelope'] },

  // ── Food & Drink ──────────────────────────────────────────────
  { id: 'mug-saucer',           label: 'Cafè',             category: 'food',           tags: ['coffee', 'cafe', 'drink', 'bar', 'beverage'] },
  { id: 'pizza-slice',          label: 'Pizza',            category: 'food',           tags: ['pizza', 'food', 'restaurant', 'fast food'] },
  { id: 'utensils',             label: 'Restaurant',       category: 'food',           tags: ['kitchen', 'restaurant', 'fork', 'spoon', 'dine'] },
  { id: 'wine-glass',           label: 'Beguda',           category: 'food',           tags: ['glass', 'drink', 'bar', 'wine', 'water'] },
  { id: 'beer-mug-empty',       label: 'Cervesa',          category: 'food',           tags: ['beer', 'drink', 'bar', 'pub', 'alcohol'] },
  { id: 'drumstick-bite',       label: 'Carn',             category: 'food',           tags: ['meat', 'food', 'restaurant', 'chicken', 'grill'] },
  { id: 'fish',                 label: 'Peix',             category: 'food',           tags: ['fish', 'food', 'seafood', 'restaurant'] },
  { id: 'bread-slice',          label: 'Forn / Pa',        category: 'food',           tags: ['bread', 'food', 'bakery', 'bake'] },
  { id: 'seedling',             label: 'Planta / Jardí',   category: 'food',           tags: ['plant', 'seed', 'grow', 'nature', 'garden', 'agriculture'] },

  // ── Transport ─────────────────────────────────────────────────
  { id: 'car',                  label: 'Cotxe',            category: 'transport',      tags: ['car', 'vehicle', 'automobile', 'drive', 'cotxe'] },
  { id: 'bus',                  label: 'Autobús',          category: 'transport',      tags: ['bus', 'transport', 'public', 'transit', 'autobus'] },
  { id: 'train',                label: 'Tren',             category: 'transport',      tags: ['train', 'rail', 'railway', 'metro', 'subway', 'tren'] },
  { id: 'plane',                label: 'Avió',             category: 'transport',      tags: ['plane', 'airplane', 'flight', 'airport', 'avio'] },
  { id: 'bicycle',              label: 'Bicicleta',        category: 'transport',      tags: ['bike', 'bicycle', 'cycling', 'cycle', 'bicicleta'] },
  { id: 'person-walking',       label: 'Caminar',          category: 'transport',      tags: ['walk', 'pedestrian', 'foot', 'hiking'] },
  { id: 'ship',                 label: 'Vaixell',          category: 'transport',      tags: ['ship', 'boat', 'maritime', 'sea', 'vaixell'] },
  { id: 'square-parking',       label: 'Aparcament',       category: 'transport',      tags: ['parking', 'park', 'car', 'garage', 'aparcament'] },
  { id: 'gas-pump',             label: 'Gasolinera',       category: 'transport',      tags: ['gas', 'fuel', 'station', 'petrol', 'energy'] },
  { id: 'motorcycle',           label: 'Moto',             category: 'transport',      tags: ['motorbike', 'motorcycle', 'moto', 'scooter'] },
  { id: 'helicopter',           label: 'Helicòpter',       category: 'transport',      tags: ['helicopter', 'air', 'flight', 'rescue'] },
  { id: 'anchor',               label: 'Àncora / Port',    category: 'transport',      tags: ['anchor', 'port', 'maritime', 'sea', 'harbor'] },
  { id: 'truck',                label: 'Camió',            category: 'transport',      tags: ['truck', 'vehicle', 'transport', 'delivery', 'logistics'] },

  // ── Nature ────────────────────────────────────────────────────
  { id: 'tree',                 label: 'Arbre',            category: 'nature',         tags: ['tree', 'forest', 'nature', 'park', 'wood', 'arbre'] },
  { id: 'mountain',             label: 'Muntanya',         category: 'nature',         tags: ['mountain', 'hill', 'peak', 'hiking', 'alpine', 'muntanya'] },
  { id: 'sun',                  label: 'Sol',              category: 'nature',         tags: ['sun', 'sunny', 'weather', 'warm', 'summer'] },
  { id: 'cloud',                label: 'Núvol',            category: 'nature',         tags: ['cloud', 'weather', 'rain', 'sky'] },
  { id: 'snowflake',            label: 'Neu',              category: 'nature',         tags: ['snow', 'winter', 'cold', 'ice', 'freeze'] },
  { id: 'fire',                 label: 'Foc',              category: 'nature',         tags: ['fire', 'flame', 'heat', 'danger', 'burn'] },
  { id: 'droplet',              label: 'Gota / Aigua',     category: 'nature',         tags: ['water', 'drop', 'rain', 'liquid', 'river', 'gota'] },
  { id: 'leaf',                 label: 'Fulla',            category: 'nature',         tags: ['leaf', 'plant', 'nature', 'ecology', 'green', 'fulla'] },
  { id: 'paw',                  label: 'Animal',           category: 'nature',         tags: ['animal', 'paw', 'pet', 'nature', 'fauna'] },
  { id: 'feather',              label: 'Ploma',            category: 'nature',         tags: ['feather', 'bird', 'nature', 'light'] },
  { id: 'wind',                 label: 'Vent',             category: 'nature',         tags: ['wind', 'air', 'breeze', 'weather', 'vent'] },
  { id: 'water',                label: 'Aigua / Mar',      category: 'nature',         tags: ['water', 'wave', 'sea', 'ocean', 'coast', 'beach'] },

  // ── Tourism ───────────────────────────────────────────────────
  { id: 'camera',               label: 'Càmera',           category: 'tourism',        tags: ['camera', 'photo', 'tourism', 'photography', 'picture'] },
  { id: 'map',                  label: 'Mapa',             category: 'tourism',        tags: ['map', 'route', 'travel', 'navigate', 'mapa'] },
  { id: 'compass',              label: 'Brúixola',         category: 'tourism',        tags: ['compass', 'navigate', 'direction', 'north', 'orient'] },
  { id: 'globe',                label: 'Globus terraqüi',  category: 'tourism',        tags: ['globe', 'world', 'international', 'earth'] },
  { id: 'ticket',               label: 'Tiquet',           category: 'tourism',        tags: ['ticket', 'event', 'entry', 'admission'] },
  { id: 'campground',           label: 'Campament',        category: 'tourism',        tags: ['tent', 'camping', 'outdoor', 'nature', 'campament'] },
  { id: 'person-hiking',        label: 'Senderisme',       category: 'tourism',        tags: ['hike', 'hiking', 'trail', 'mountain', 'trek', 'senderisme'] },
  { id: 'person-swimming',      label: 'Natació',          category: 'tourism',        tags: ['swimming', 'pool', 'water', 'sport', 'beach'] },

  // ── Sport ─────────────────────────────────────────────────────
  { id: 'futbol',               label: 'Futbol',           category: 'sport',          tags: ['football', 'soccer', 'sport', 'ball', 'futbol'] },
  { id: 'trophy',               label: 'Trofeu',           category: 'sport',          tags: ['trophy', 'award', 'winner', 'sport', 'prize'] },
  { id: 'person-running',       label: 'Córrer',           category: 'sport',          tags: ['run', 'running', 'sport', 'fitness', 'marathon'] },
  { id: 'dumbbell',             label: 'Gimnàs',           category: 'sport',          tags: ['dumbbell', 'gym', 'fitness', 'sport', 'weights'] },

  // ── Infrastructure ────────────────────────────────────────────
  { id: 'tower-broadcast',      label: 'Torre telecomunicacions', category: 'infrastructure', tags: ['tower', 'signal', 'telecom', 'antenna', 'broadcast'] },
  { id: 'plug',                 label: 'Electricitat',     category: 'infrastructure', tags: ['plug', 'electricity', 'power', 'electric', 'energy'] },
  { id: 'solar-panel',          label: 'Panell solar',     category: 'infrastructure', tags: ['solar', 'energy', 'renewable', 'panel', 'photovoltaic'] },
  { id: 'trash',                label: 'Contenidor',       category: 'infrastructure', tags: ['trash', 'waste', 'recycle', 'bin', 'garbage'] },
  { id: 'wrench',               label: 'Manteniment',      category: 'infrastructure', tags: ['tool', 'maintenance', 'repair', 'work', 'wrench'] },
  { id: 'recycle',              label: 'Reciclatge',       category: 'infrastructure', tags: ['recycle', 'ecology', 'green', 'environment', 'sustainable'] },
  { id: 'bolt',                 label: 'Punt de càrrega',  category: 'infrastructure', tags: ['electric', 'charging', 'ev', 'bolt', 'energy', 'electrica'] },

  // ── Health ────────────────────────────────────────────────────
  { id: 'stethoscope',          label: 'Metge / Consulta', category: 'health',         tags: ['stethoscope', 'doctor', 'health', 'medical', 'clinic'] },
  { id: 'kit-medical',          label: 'Primers auxilis',  category: 'health',         tags: ['first aid', 'medical', 'emergency', 'health', 'safety'] },
  { id: 'pills',                label: 'Farmàcia',         category: 'health',         tags: ['pill', 'medicine', 'pharmacy', 'health', 'drug'] },
  { id: 'wheelchair',           label: 'Accessibilitat',   category: 'health',         tags: ['wheelchair', 'accessibility', 'disability', 'accessible'] },
  { id: 'syringe',              label: 'Vacuna / Injecció',category: 'health',         tags: ['vaccine', 'syringe', 'health', 'medical', 'injection'] },
  { id: 'truck-medical',        label: 'Ambulància',       category: 'health',         tags: ['ambulance', 'emergency', 'medical', 'health', '112'] },
  { id: 'heart-pulse',          label: 'Monitor cardíac',  category: 'health',         tags: ['heart', 'monitor', 'health', 'pulse', 'ecg'] },

  // ── Emergency & Security ──────────────────────────────────────
  { id: 'fire-extinguisher',    label: 'Extintor',         category: 'emergency',      tags: ['fire', 'extinguisher', 'safety', 'emergency'] },
  { id: 'shield-halved',        label: 'Seguretat',        category: 'emergency',      tags: ['police', 'security', 'law', 'shield', 'officer'] },
  { id: 'life-ring',            label: 'Salvavides',       category: 'emergency',      tags: ['lifebuoy', 'rescue', 'safety', 'sea', 'maritime'] },
]

/**
 * Unique categories in first-occurrence order.
 * Can be used to build a category filter in the icon picker.
 */
export const FA_ICON_CATEGORIES = [...new Set(FA_ICON_CATALOG.map((ic) => ic.category))]

/**
 * First 60 icons to show when the search field is empty.
 * Represents the most common use cases.
 */
export const FA_POPULAR_ICONS = FA_ICON_CATALOG.slice(0, 60)
