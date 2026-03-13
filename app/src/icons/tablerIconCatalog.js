/**
 * Curated catalog of Tabler Icons for point marker selection.
 *
 * Each entry:
 *   id       — Tabler icon id (kebab-case, e.g. "map-pin").
 *              The React component is resolved as "Icon" + PascalCase(id).
 *   label    — Human-readable display name (Catalan).
 *   category — Grouping for UI filtering.
 *   tags     — Search keywords.
 *
 * Icons not found in the installed package version are silently skipped
 * by resolveTablerIcon(), so the list degrades gracefully.
 */
export const TABLER_ICON_CATALOG = [
  // ── General ───────────────────────────────────────────────────
  { id: 'map-pin', label: 'Marcador', category: 'general', tags: ['pin', 'marker', 'location', 'point'] },
  { id: 'star', label: 'Estrella', category: 'general', tags: ['star', 'favourite', 'important', 'rating'] },
  { id: 'heart', label: 'Cor', category: 'general', tags: ['heart', 'love', 'favourite'] },
  { id: 'flag', label: 'Bandera', category: 'general', tags: ['flag', 'marker', 'country'] },
  { id: 'bookmark', label: 'Marcapàgines', category: 'general', tags: ['bookmark', 'save', 'mark'] },
  { id: 'info-circle', label: 'Informació', category: 'general', tags: ['info', 'information', 'help'] },
  { id: 'alert-triangle', label: 'Avís', category: 'general', tags: ['alert', 'warning', 'danger', 'caution'] },
  { id: 'circle-check', label: 'Verificat', category: 'general', tags: ['check', 'done', 'ok', 'verified'] },
  { id: 'circle-x', label: 'Error', category: 'general', tags: ['x', 'close', 'error', 'cancel'] },
  { id: 'bell', label: 'Campana', category: 'general', tags: ['bell', 'notification', 'alert', 'alarm'] },
  { id: 'question-mark', label: 'Interrogant', category: 'general', tags: ['question', 'help', 'unknown'] },
  { id: 'eye', label: 'Ull', category: 'general', tags: ['eye', 'view', 'visible', 'observe'] },
  { id: 'circle-dot', label: "Punt d'interès", category: 'general', tags: ['point', 'dot', 'interest', 'location'] },
  { id: 'shield', label: 'Seguretat', category: 'general', tags: ['shield', 'security', 'protect', 'safe'] },
  { id: 'lock', label: 'Accés restringit', category: 'general', tags: ['lock', 'security', 'restricted', 'private'] },
  { id: 'key', label: 'Clau', category: 'general', tags: ['key', 'access', 'unlock', 'entrance'] },

  // ── People ────────────────────────────────────────────────────
  { id: 'user', label: 'Persona', category: 'people', tags: ['person', 'user', 'individual'] },
  { id: 'users', label: 'Grup', category: 'people', tags: ['people', 'group', 'team', 'community'] },
  { id: 'user-circle', label: 'Perfil', category: 'people', tags: ['person', 'profile', 'avatar'] },
  { id: 'home', label: 'Casa', category: 'people', tags: ['home', 'house', 'residence', 'building'] },
  { id: 'home-2', label: 'Llar', category: 'people', tags: ['home', 'house', 'residence'] },

  // ── Services / Buildings ──────────────────────────────────────
  { id: 'building', label: 'Edifici', category: 'services', tags: ['building', 'office', 'structure'] },
  { id: 'building-hospital', label: 'Hospital', category: 'services', tags: ['hospital', 'health', 'medical', 'emergency', 'clinic'] },
  { id: 'building-bank', label: 'Banc', category: 'services', tags: ['bank', 'finance', 'money', 'atm'] },
  { id: 'building-store', label: 'Botiga', category: 'services', tags: ['shop', 'store', 'commerce', 'supermarket'] },
  { id: 'building-factory', label: 'Fàbrica', category: 'services', tags: ['factory', 'industry', 'plant', 'manufacturing'] },
  { id: 'school', label: 'Escola', category: 'services', tags: ['school', 'education', 'learning', 'children', 'students'] },
  { id: 'building-library', label: 'Biblioteca', category: 'services', tags: ['library', 'books', 'education', 'culture'] },
  { id: 'building-museum', label: 'Museu', category: 'services', tags: ['museum', 'art', 'culture', 'history'] },
  { id: 'building-church', label: 'Església', category: 'services', tags: ['church', 'religion', 'temple', 'worship'] },
  { id: 'building-castle', label: 'Castell', category: 'services', tags: ['castle', 'fort', 'heritage', 'history'] },
  { id: 'building-stadium', label: 'Estadi', category: 'services', tags: ['stadium', 'sport', 'arena', 'football'] },
  { id: 'building-skyscraper', label: 'Gratacels', category: 'services', tags: ['skyscraper', 'office', 'tower', 'downtown'] },
  { id: 'building-government', label: 'Administració', category: 'services', tags: ['government', 'administration', 'public', 'official', 'civic'] },
  { id: 'building-community', label: 'Comunitat', category: 'services', tags: ['community', 'neighborhood', 'civic', 'social'] },
  { id: 'phone', label: 'Telèfon', category: 'services', tags: ['phone', 'call', 'contact', 'telephone'] },
  { id: 'mail', label: 'Correu', category: 'services', tags: ['mail', 'email', 'letter', 'post', 'envelope'] },
  { id: 'mailbox', label: 'Bústia', category: 'services', tags: ['mailbox', 'mail', 'post', 'letter'] },

  // ── Food & Drink ──────────────────────────────────────────────
  { id: 'coffee', label: 'Cafè', category: 'food', tags: ['coffee', 'cafe', 'drink', 'bar', 'beverage'] },
  { id: 'pizza', label: 'Pizza', category: 'food', tags: ['pizza', 'food', 'restaurant', 'fast food'] },
  { id: 'tools-kitchen-2', label: 'Restaurant', category: 'food', tags: ['kitchen', 'restaurant', 'cooking', 'fork', 'spoon', 'dine'] },
  { id: 'glass-full', label: 'Beguda', category: 'food', tags: ['glass', 'drink', 'bar', 'wine', 'water'] },
  { id: 'beer', label: 'Cervesa', category: 'food', tags: ['beer', 'drink', 'bar', 'pub', 'alcohol'] },
  { id: 'bottle', label: 'Ampolla', category: 'food', tags: ['bottle', 'drink', 'wine', 'beverage'] },
  { id: 'salad', label: 'Menjar saludable', category: 'food', tags: ['salad', 'food', 'healthy', 'restaurant', 'vegetable'] },
  { id: 'meat', label: 'Carn', category: 'food', tags: ['meat', 'food', 'restaurant', 'barbecue', 'grill'] },
  { id: 'fish', label: 'Peix', category: 'food', tags: ['fish', 'food', 'seafood', 'restaurant'] },
  { id: 'bread', label: 'Pa / Forn', category: 'food', tags: ['bread', 'food', 'bakery', 'bake'] },
  { id: 'ice-cream', label: 'Gelat', category: 'food', tags: ['ice cream', 'dessert', 'sweet', 'food'] },

  // ── Transport ─────────────────────────────────────────────────
  { id: 'car', label: 'Cotxe', category: 'transport', tags: ['car', 'vehicle', 'automobile', 'drive'] },
  { id: 'bus', label: 'Autobús', category: 'transport', tags: ['bus', 'transport', 'public', 'transit', 'passengers'] },
  { id: 'train', label: 'Tren', category: 'transport', tags: ['train', 'rail', 'railway', 'metro', 'subway'] },
  { id: 'plane', label: 'Avió', category: 'transport', tags: ['plane', 'airplane', 'flight', 'airport', 'air'] },
  { id: 'bike', label: 'Bicicleta', category: 'transport', tags: ['bike', 'bicycle', 'cycling', 'cycle'] },
  { id: 'walk', label: 'Caminar', category: 'transport', tags: ['walk', 'pedestrian', 'foot', 'hiking'] },
  { id: 'ship', label: 'Vaixell', category: 'transport', tags: ['ship', 'boat', 'maritime', 'sea', 'vessel'] },
  { id: 'parking', label: 'Aparcament', category: 'transport', tags: ['parking', 'park', 'car', 'garage'] },
  { id: 'road', label: 'Carretera', category: 'transport', tags: ['road', 'highway', 'street', 'asphalt'] },
  { id: 'gas-station', label: 'Gasolinera', category: 'transport', tags: ['gas', 'fuel', 'station', 'petrol', 'energy'] },
  { id: 'charging-pile', label: 'Càrrega elèctrica', category: 'transport', tags: ['electric', 'charging', 'ev', 'car', 'plug'] },
  { id: 'motorbike', label: 'Moto', category: 'transport', tags: ['motorbike', 'motorcycle', 'moto', 'scooter'] },
  { id: 'helicopter', label: 'Helicòpter', category: 'transport', tags: ['helicopter', 'air', 'flight', 'rescue'] },
  { id: 'sailboat', label: 'Veler', category: 'transport', tags: ['sailboat', 'boat', 'sea', 'sailing', 'wind'] },
  { id: 'anchor', label: 'Àncora', category: 'transport', tags: ['anchor', 'port', 'maritime', 'sea', 'harbor'] },
  { id: 'traffic-lights', label: 'Semàfor', category: 'transport', tags: ['traffic', 'lights', 'road', 'signal', 'junction'] },
  { id: 'truck', label: 'Camió', category: 'transport', tags: ['truck', 'vehicle', 'transport', 'delivery', 'logistics'] },

  // ── Nature ────────────────────────────────────────────────────
  { id: 'tree', label: 'Arbre', category: 'nature', tags: ['tree', 'forest', 'nature', 'park', 'wood'] },
  { id: 'trees', label: 'Bosc', category: 'nature', tags: ['trees', 'forest', 'nature', 'park', 'wood'] },
  { id: 'mountain', label: 'Muntanya', category: 'nature', tags: ['mountain', 'hill', 'peak', 'hiking', 'alpine'] },
  { id: 'waves', label: 'Ones / Mar', category: 'nature', tags: ['waves', 'sea', 'water', 'ocean', 'coast', 'beach'] },
  { id: 'leaf', label: 'Fulla', category: 'nature', tags: ['leaf', 'plant', 'nature', 'ecology', 'green'] },
  { id: 'sun', label: 'Sol', category: 'nature', tags: ['sun', 'sunny', 'weather', 'warm', 'summer'] },
  { id: 'cloud', label: 'Núvol', category: 'nature', tags: ['cloud', 'weather', 'rain', 'sky'] },
  { id: 'snowflake', label: 'Neu', category: 'nature', tags: ['snow', 'winter', 'cold', 'ice', 'freeze'] },
  { id: 'flame', label: 'Foc', category: 'nature', tags: ['fire', 'flame', 'heat', 'danger', 'burn'] },
  { id: 'drop', label: 'Gota / Aigua', category: 'nature', tags: ['water', 'drop', 'rain', 'liquid', 'river'] },
  { id: 'flower', label: 'Flor', category: 'nature', tags: ['flower', 'garden', 'nature', 'park', 'spring'] },
  { id: 'windmill', label: 'Molí de vent', category: 'nature', tags: ['windmill', 'wind', 'energy', 'rural', 'agriculture'] },
  { id: 'seeding', label: 'Cultiu', category: 'nature', tags: ['plant', 'seed', 'grow', 'nature', 'garden', 'agriculture'] },
  { id: 'paw-print', label: 'Animal', category: 'nature', tags: ['animal', 'paw', 'pet', 'nature', 'fauna'] },
  { id: 'feather', label: 'Ploma', category: 'nature', tags: ['feather', 'bird', 'nature', 'light'] },

  // ── Tourism ───────────────────────────────────────────────────
  { id: 'camera', label: 'Càmera', category: 'tourism', tags: ['camera', 'photo', 'tourism', 'photography', 'picture'] },
  { id: 'map', label: 'Mapa', category: 'tourism', tags: ['map', 'route', 'travel', 'navigate'] },
  { id: 'compass', label: 'Brúixola', category: 'tourism', tags: ['compass', 'navigate', 'direction', 'north', 'orient'] },
  { id: 'globe', label: 'Globus terraqüi', category: 'tourism', tags: ['globe', 'world', 'international', 'earth'] },
  { id: 'ticket', label: 'Tiquet', category: 'tourism', tags: ['ticket', 'event', 'entry', 'admission'] },
  { id: 'tent', label: 'Campament', category: 'tourism', tags: ['tent', 'camping', 'outdoor', 'nature'] },
  { id: 'backpack', label: 'Motxilla', category: 'tourism', tags: ['backpack', 'travel', 'hiking', 'adventure'] },
  { id: 'swimming', label: 'Natació', category: 'tourism', tags: ['swimming', 'pool', 'water', 'sport', 'beach'] },
  { id: 'kayak', label: 'Caiac / Piragua', category: 'tourism', tags: ['kayak', 'water', 'sport', 'paddle', 'river'] },
  { id: 'golf', label: 'Golf', category: 'tourism', tags: ['golf', 'sport', 'leisure', 'green', 'club'] },

  // ── Sport ─────────────────────────────────────────────────────
  { id: 'ball-football', label: 'Futbol', category: 'sport', tags: ['football', 'soccer', 'sport', 'ball'] },
  { id: 'ball-basketball', label: 'Bàsquet', category: 'sport', tags: ['basketball', 'sport', 'ball', 'nba'] },
  { id: 'ball-tennis', label: 'Tennis', category: 'sport', tags: ['tennis', 'sport', 'ball', 'racket'] },
  { id: 'trophy', label: 'Trofeu', category: 'sport', tags: ['trophy', 'award', 'winner', 'sport', 'prize'] },
  { id: 'run', label: 'Córrer', category: 'sport', tags: ['run', 'running', 'sport', 'fitness', 'marathon'] },
  { id: 'yoga', label: 'Ioga', category: 'sport', tags: ['yoga', 'fitness', 'sport', 'health', 'meditation'] },

  // ── Infrastructure ────────────────────────────────────────────
  { id: 'tower', label: 'Torre', category: 'infrastructure', tags: ['tower', 'signal', 'telecom', 'antenna'] },
  { id: 'bridge', label: 'Pont', category: 'infrastructure', tags: ['bridge', 'infrastructure', 'crossing', 'road'] },
  { id: 'plug', label: 'Electricitat', category: 'infrastructure', tags: ['plug', 'electricity', 'power', 'electric', 'energy'] },
  { id: 'solar-panel', label: 'Panell solar', category: 'infrastructure', tags: ['solar', 'energy', 'renewable', 'panel', 'photovoltaic'] },
  { id: 'antenna', label: 'Antena', category: 'infrastructure', tags: ['antenna', 'signal', 'radio', 'tower', 'telecom'] },
  { id: 'trash', label: 'Contenidor', category: 'infrastructure', tags: ['trash', 'waste', 'recycle', 'bin', 'garbage'] },
  { id: 'crane', label: 'Grua', category: 'infrastructure', tags: ['crane', 'construction', 'building', 'machinery'] },
  { id: 'tool', label: 'Manteniment', category: 'infrastructure', tags: ['tool', 'maintenance', 'repair', 'work', 'wrench'] },
  { id: 'recycle', label: 'Reciclatge', category: 'infrastructure', tags: ['recycle', 'ecology', 'green', 'environment', 'sustainable'] },

  // ── Health ────────────────────────────────────────────────────
  { id: 'stethoscope', label: 'Metge', category: 'health', tags: ['stethoscope', 'doctor', 'health', 'medical', 'clinic'] },
  { id: 'first-aid-kit', label: 'Primers auxilis', category: 'health', tags: ['first aid', 'medical', 'emergency', 'health', 'safety'] },
  { id: 'pill', label: 'Farmàcia', category: 'health', tags: ['pill', 'medicine', 'pharmacy', 'health', 'drug'] },
  { id: 'wheelchair', label: 'Accessibilitat', category: 'health', tags: ['wheelchair', 'accessibility', 'disability', 'accessible'] },
  { id: 'vaccine', label: 'Vacuna', category: 'health', tags: ['vaccine', 'syringe', 'health', 'medical', 'injection'] },
  { id: 'ambulance', label: 'Ambulància', category: 'health', tags: ['ambulance', 'emergency', 'medical', 'health', '112'] },
  { id: 'heart-rate-monitor', label: 'Monitor cardíac', category: 'health', tags: ['heart', 'monitor', 'health', 'pulse', 'ecg'] },

  // ── Emergency & Security ──────────────────────────────────────
  { id: 'firetruck', label: 'Bombers', category: 'emergency', tags: ['fire', 'firefighter', 'emergency', 'rescue', 'truck'] },
  { id: 'police-badge', label: 'Policia', category: 'emergency', tags: ['police', 'security', 'law', 'badge', 'officer'] },
  { id: 'fire-extinguisher', label: 'Extintor', category: 'emergency', tags: ['fire', 'extinguisher', 'safety', 'emergency'] },
  { id: 'lifebuoy', label: 'Salvavides', category: 'emergency', tags: ['lifebuoy', 'rescue', 'safety', 'sea', 'maritime'] },
]

/**
 * Returns the unique list of categories from the catalog,
 * in their first occurrence order.
 */
export const TABLER_ICON_CATEGORIES = [...new Set(TABLER_ICON_CATALOG.map((ic) => ic.category))]
