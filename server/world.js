// Bird City World Definition
// 3000x3000 persistent world

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

// Building definitions: { x, y, w, h, color, name }
const BUILDINGS = [
  // === DOWNTOWN (bottom-right quadrant) ===
  { x: 1700, y: 1700, w: 150, h: 120, color: '#5a6e7f', name: 'Office Tower' },
  { x: 1900, y: 1700, w: 120, h: 150, color: '#4a5e6f', name: 'Bank' },
  { x: 2100, y: 1700, w: 180, h: 100, color: '#6b7b8b', name: 'Shopping Mall' },
  { x: 2350, y: 1700, w: 100, h: 130, color: '#7a8a9a', name: 'Hotel' },
  { x: 1700, y: 1900, w: 130, h: 110, color: '#8090a0', name: 'Restaurant' },
  { x: 1900, y: 1920, w: 160, h: 130, color: '#5070a0', name: 'Cinema' },
  { x: 2120, y: 1880, w: 140, h: 100, color: '#cc88dd', name: 'Pigeon Date Center' },
  { x: 2350, y: 1900, w: 110, h: 140, color: '#506080', name: 'Apartments' },
  { x: 1700, y: 2120, w: 170, h: 120, color: '#4a6070', name: 'Library' },
  { x: 1920, y: 2120, w: 120, h: 100, color: '#5a7080', name: 'Pharmacy' },
  { x: 2100, y: 2100, w: 200, h: 140, color: '#3a5060', name: 'Department Store' },
  { x: 2380, y: 2100, w: 100, h: 120, color: '#6a7a8a', name: 'Barber' },
  { x: 1700, y: 2350, w: 140, h: 100, color: '#5a6878', name: 'Post Office' },
  { x: 1900, y: 2340, w: 180, h: 120, color: '#4a5868', name: 'Court House' },
  { x: 2150, y: 2350, w: 120, h: 110, color: '#6a7888', name: 'Fire Station' },

  // === RESIDENTIAL (top-left quadrant) ===
  { x: 150, y: 150, w: 80, h: 80, color: '#c4956a', name: 'House' },
  { x: 300, y: 150, w: 80, h: 80, color: '#b4856a', name: 'House' },
  { x: 450, y: 150, w: 80, h: 80, color: '#d4a57a', name: 'House' },
  { x: 600, y: 150, w: 80, h: 80, color: '#c4856a', name: 'House' },
  { x: 150, y: 320, w: 80, h: 80, color: '#a4756a', name: 'House' },
  { x: 300, y: 320, w: 80, h: 80, color: '#c4a56a', name: 'House' },
  { x: 450, y: 320, w: 80, h: 80, color: '#b4956a', name: 'House' },
  { x: 600, y: 320, w: 80, h: 80, color: '#d4956a', name: 'House' },
  { x: 150, y: 500, w: 80, h: 80, color: '#c4856a', name: 'House' },
  { x: 300, y: 500, w: 80, h: 80, color: '#b4a56a', name: 'House' },
  { x: 450, y: 500, w: 80, h: 80, color: '#c4956a', name: 'House' },
  { x: 600, y: 500, w: 80, h: 80, color: '#a4856a', name: 'House' },
  { x: 150, y: 680, w: 80, h: 80, color: '#d4956a', name: 'House' },
  { x: 300, y: 680, w: 80, h: 80, color: '#c4a56a', name: 'House' },
  { x: 450, y: 680, w: 80, h: 80, color: '#b4856a', name: 'House' },
  { x: 600, y: 680, w: 80, h: 80, color: '#c4956a', name: 'House' },

  // === MALL / COMMERCIAL (top-right quadrant) ===
  { x: 1800, y: 200, w: 300, h: 200, color: '#8899aa', name: 'Mega Mall' },
  { x: 2200, y: 200, w: 150, h: 120, color: '#7788aa', name: 'Electronics Store' },
  { x: 2400, y: 200, w: 120, h: 120, color: '#9988aa', name: 'Pet Store' },
  { x: 1800, y: 480, w: 140, h: 100, color: '#6688aa', name: 'Supermarket' },
  { x: 2000, y: 480, w: 120, h: 100, color: '#7799bb', name: 'Laundromat' },
  { x: 2200, y: 480, w: 160, h: 100, color: '#5588aa', name: 'Auto Shop' },
  { x: 2420, y: 480, w: 100, h: 100, color: '#8899bb', name: 'Bakery' },

  // === CAFE DISTRICT (bottom-left, near park) ===
  { x: 200, y: 1800, w: 120, h: 80, color: '#aa7744', name: 'Cafe Pigeon' },
  { x: 400, y: 1800, w: 100, h: 80, color: '#bb8855', name: 'Cafe Chaos' },
  { x: 580, y: 1800, w: 110, h: 80, color: '#997744', name: 'Kebab Palace' },
  { x: 200, y: 1960, w: 130, h: 90, color: '#aa8866', name: 'Pizza Joint' },
  { x: 400, y: 1960, w: 100, h: 90, color: '#bb9966', name: 'Sushi Bar' },
  { x: 580, y: 1960, w: 120, h: 90, color: '#cc8844', name: 'Burger Shack' },
];

// Trees: { x, y, size }
const TREES = [];
// Park trees (center area)
for (let i = 0; i < 30; i++) {
  TREES.push({
    x: 800 + Math.random() * 600,
    y: 900 + Math.random() * 600,
    size: 15 + Math.random() * 15,
  });
}
// Street trees
for (let x = 100; x < WORLD_WIDTH; x += 200) {
  if (Math.random() > 0.5) TREES.push({ x, y: 860, size: 12 });
  if (Math.random() > 0.5) TREES.push({ x, y: 1560, size: 12 });
}
for (let y = 100; y < WORLD_HEIGHT; y += 200) {
  if (Math.random() > 0.5) TREES.push({ x: 760, y, size: 12 });
  if (Math.random() > 0.5) TREES.push({ x: 1660, y, size: 12 });
}

// Park definition
const PARK = {
  x: 800, y: 900, w: 700, h: 650,
  pond: { x: 1050, y: 1100, rx: 80, ry: 50 },
  statue: { x: 1150, y: 1000, w: 30, h: 30 },
};

// Cafe tables (outdoor seating) with food
const CAFE_TABLES = [
  { x: 180, y: 1890, food: true },
  { x: 230, y: 1890, food: true },
  { x: 280, y: 1890, food: true },
  { x: 380, y: 1890, food: true },
  { x: 430, y: 1890, food: true },
  { x: 560, y: 1890, food: true },
  { x: 610, y: 1890, food: true },
  { x: 660, y: 1890, food: true },
  { x: 180, y: 2060, food: true },
  { x: 230, y: 2060, food: true },
  { x: 380, y: 2060, food: true },
  { x: 430, y: 2060, food: true },
  { x: 560, y: 2060, food: true },
  { x: 610, y: 2060, food: true },
];

// Roads (major roads)
const ROADS = [
  // Horizontal roads
  { x: 0, y: 840, w: WORLD_WIDTH, h: 60 },
  { x: 0, y: 1540, w: WORLD_WIDTH, h: 60 },
  { x: 0, y: 2280, w: WORLD_WIDTH, h: 60 },
  { x: 1500, y: 0, w: 60, h: 130 },
  // Vertical roads
  { x: 740, y: 0, w: 60, h: WORLD_HEIGHT },
  { x: 1640, y: 0, w: 60, h: WORLD_HEIGHT },
  { x: 2540, y: 0, w: 60, h: WORLD_HEIGHT },
];

// Parked cars
const CARS = [
  { x: 750, y: 200, w: 40, h: 22, color: '#cc3333', angle: 0 },
  { x: 750, y: 350, w: 40, h: 22, color: '#3333cc', angle: 0 },
  { x: 750, y: 500, w: 40, h: 22, color: '#33cc33', angle: 0 },
  { x: 750, y: 700, w: 40, h: 22, color: '#cccc33', angle: 0 },
  { x: 1650, y: 300, w: 40, h: 22, color: '#cc33cc', angle: 0 },
  { x: 1650, y: 600, w: 40, h: 22, color: '#33cccc', angle: 0 },
  { x: 1650, y: 1000, w: 40, h: 22, color: '#ff6600', angle: 0 },
  { x: 200, y: 850, w: 22, h: 40, color: '#993333', angle: Math.PI / 2 },
  { x: 400, y: 850, w: 22, h: 40, color: '#339933', angle: Math.PI / 2 },
  { x: 900, y: 850, w: 22, h: 40, color: '#333399', angle: Math.PI / 2 },
  { x: 1200, y: 850, w: 22, h: 40, color: '#999933', angle: Math.PI / 2 },
  { x: 1800, y: 1550, w: 22, h: 40, color: '#cc6633', angle: Math.PI / 2 },
  { x: 2100, y: 1550, w: 22, h: 40, color: '#6633cc', angle: Math.PI / 2 },
  { x: 2300, y: 1550, w: 22, h: 40, color: '#33cc66', angle: Math.PI / 2 },
];

// Laundry lines (in residential area)
const LAUNDRY = [
  { x1: 250, y1: 250, x2: 380, y2: 250 },
  { x1: 550, y1: 420, x2: 680, y2: 420 },
  { x1: 250, y1: 600, x2: 380, y2: 600 },
];

// NPC spawn config
const NPC_TYPES = {
  walker: {
    speed: 30,
    spawnAreas: [
      { x: 100, y: 840, w: 2800, h: 60 },   // horizontal road
      { x: 100, y: 1540, w: 2800, h: 60 },
      { x: 740, y: 100, w: 60, h: 2800 },   // vertical road
      { x: 1640, y: 100, w: 60, h: 2800 },
    ]
  },
  cafe_sitter: {
    speed: 0,
    positions: CAFE_TABLES.map(t => ({ x: t.x, y: t.y - 15 }))
  },
  park_walker: {
    speed: 20,
    spawnArea: { x: 850, y: 950, w: 600, h: 500 }
  }
};

// Pigeon Date Center building reference
const DATE_CENTER = { x: 2120, y: 1880, w: 140, h: 100 };

// Bird type progression
const BIRD_TYPES = {
  pigeon: { level: 0, speed: 280, poopCooldown: 2000, color: '#888888', size: 12, name: 'Pigeon' },
  seagull: { level: 5, speed: 300, poopCooldown: 1800, color: '#e8e8e0', size: 14, name: 'Seagull' },
  crow: { level: 15, speed: 320, poopCooldown: 1500, color: '#222222', size: 14, name: 'Crow' },
  eagle: { level: 30, speed: 380, poopCooldown: 1200, color: '#8B4513', size: 18, name: 'Eagle' },
  ostrich: { level: 50, speed: 200, poopCooldown: 800, color: '#5a4030', size: 24, name: 'Ostrich' },
};

// Skill catalog for skill shop system
const SKILL_CATALOG = {
  poop_barrage: { name: 'Poop Barrage', desc: '5 poops in a spread pattern', cost: 0, cooldown: 20000, icon: '\uD83D\uDCA9' },
  dive_bomb: { name: 'Dive Bomb', desc: 'Dash forward, hit NPCs in path', cost: 50, cooldown: 20000, icon: '\uD83D\uDCA8' },
  shadow_cloak: { name: 'Shadow Cloak', desc: 'Invisible for 8s', cost: 80, cooldown: 25000, icon: '\uD83D\uDC7B' },
  eagle_eye: { name: 'Eagle Eye', desc: 'Reveal all food on minimap 15s', cost: 60, cooldown: 35000, icon: '\uD83E\uDD85' },
  ground_pound: { name: 'Ground Pound', desc: 'AOE scatter NPCs', cost: 70, cooldown: 15000, icon: '\uD83D\uDCA5' },
  decoy: { name: 'Decoy', desc: 'Fake copy distracts cat/hawk', cost: 40, cooldown: 30000, icon: '\uD83E\uDE9E' },
  speed_burst: { name: 'Speed Burst', desc: '2x speed for 5s', cost: 30, cooldown: 20000, icon: '\u26A1' },
  beacon_call: { name: 'Beacon Call', desc: 'Minimap beacon for 30s', cost: 45, cooldown: 45000, icon: '\uD83D\uDCE1' },
};

const BIRD_COLORS = ['#cc3333','#3366cc','#33aa33','#cccc33','#ff8800','#9933cc','#ff66aa','#eeeeee','#333333','#daa520','#33aaaa','#8b6914'];

function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level));
}

function getLevelFromXP(xp) {
  let level = 0;
  let needed = 100;
  while (xp >= needed) {
    xp -= needed;
    level++;
    needed = Math.floor(100 * Math.pow(1.5, level));
  }
  return level;
}

function getBirdTypeForLevel(level) {
  let best = 'pigeon';
  for (const [type, info] of Object.entries(BIRD_TYPES)) {
    if (level >= info.level) best = type;
  }
  return best;
}

// Moving cars on roads (direction: 'h' = horizontal, 'v' = vertical)
// startX/startY: where they teleport back to; endX/endY: where they head
const MOVING_CARS = [
  // Horizontal road y=840
  { id: 'mc_0', x: 100, y: 855, w: 44, h: 22, color: '#e03030', speed: 100, direction: 'h', startX: 0, endX: WORLD_WIDTH, angle: 0 },
  { id: 'mc_1', x: 600, y: 865, w: 44, h: 22, color: '#2060d0', speed: 85, direction: 'h', startX: 0, endX: WORLD_WIDTH, angle: 0 },
  { id: 'mc_2', x: 1800, y: 855, w: 44, h: 22, color: '#20c040', speed: 110, direction: 'h', startX: WORLD_WIDTH, endX: 0, angle: Math.PI },
  // Horizontal road y=1540
  { id: 'mc_3', x: 200, y: 1555, w: 44, h: 22, color: '#c0c020', speed: 95, direction: 'h', startX: 0, endX: WORLD_WIDTH, angle: 0 },
  { id: 'mc_4', x: 1200, y: 1565, w: 44, h: 22, color: '#d040d0', speed: 120, direction: 'h', startX: WORLD_WIDTH, endX: 0, angle: Math.PI },
  // Horizontal road y=2280
  { id: 'mc_5', x: 500, y: 2295, w: 44, h: 22, color: '#ff8800', speed: 90, direction: 'h', startX: 0, endX: WORLD_WIDTH, angle: 0 },
  // Vertical road x=740
  { id: 'mc_6', x: 755, y: 200, w: 22, h: 44, color: '#30b0b0', speed: 80, direction: 'v', startY: 0, endY: WORLD_HEIGHT, angle: Math.PI / 2 },
  { id: 'mc_7', x: 765, y: 1800, w: 22, h: 44, color: '#b03030', speed: 100, direction: 'v', startY: WORLD_HEIGHT, endY: 0, angle: -Math.PI / 2 },
  // Vertical road x=1640
  { id: 'mc_8', x: 1655, y: 500, w: 22, h: 44, color: '#6060c0', speed: 105, direction: 'v', startY: 0, endY: WORLD_HEIGHT, angle: Math.PI / 2 },
  { id: 'mc_9', x: 1665, y: 2200, w: 22, h: 44, color: '#c06060', speed: 88, direction: 'v', startY: WORLD_HEIGHT, endY: 0, angle: -Math.PI / 2 },
  // Vertical road x=2540
  { id: 'mc_10', x: 2555, y: 800, w: 22, h: 44, color: '#40a040', speed: 95, direction: 'v', startY: 0, endY: WORLD_HEIGHT, angle: Math.PI / 2 },
];

// Event spawn locations
const EVENT_LOCATIONS = {
  breadcrumbs: { x: 1100, y: 1200 },               // Park center
  wedding: { x: 1150, y: 1000 },                    // Near park statue
  parade: {
    startX: 0, startY: 870, endX: WORLD_WIDTH, endY: 870,  // Along horizontal road
  },
};

// Power-up types
const POWERUP_TYPES = ['hot_sauce', 'speed_feather', 'ghost_feather', 'mega_poop'];

// Street lamps — appear along roads and park perimeter, glow at night
const STREET_LAMPS = [];
// Along horizontal roads (placed at top edge of each road)
[840, 1540, 2280].forEach(ry => {
  for (let x = 150; x < WORLD_WIDTH - 100; x += 280) {
    STREET_LAMPS.push({ x, y: ry - 8 });
  }
});
// Along vertical roads (placed at left edge of each road)
[740, 1640, 2540].forEach(rx => {
  for (let y = 150; y < WORLD_HEIGHT - 100; y += 280) {
    STREET_LAMPS.push({ x: rx - 8, y });
  }
});
// Park perimeter lamps
for (let px = 850; px <= 1480; px += 220) {
  STREET_LAMPS.push({ x: px, y: 898 });   // top edge
  STREET_LAMPS.push({ x: px, y: 1552 });  // bottom edge
}
for (let py = 950; py <= 1500; py += 220) {
  STREET_LAMPS.push({ x: 798, y: py });   // left edge
  STREET_LAMPS.push({ x: 1502, y: py }); // right edge
}

// ============================================================
// TERRITORY ZONES — capturable areas for flocks & solo birds
// Each zone: { id, name, x, y, w, h, baseColor }
// ============================================================
const TERRITORY_ZONES = [
  { id: 'park',        name: 'The Park',       x: 820,  y: 920,  w: 660, h: 610, baseColor: '#22cc55' },
  { id: 'downtown',    name: 'Downtown',        x: 1720, y: 1720, w: 730, h: 700, baseColor: '#4488ff' },
  { id: 'cafe',        name: 'Cafe District',   x: 200,  y: 1800, w: 510, h: 260, baseColor: '#ff8844' },
  { id: 'residential', name: 'Residential',     x: 140,  y: 140,  w: 560, h: 620, baseColor: '#cc44ff' },
  { id: 'mall',        name: 'The Mall',        x: 1790, y: 190,  w: 760, h: 410, baseColor: '#ffcc00' },
];

// ============================================================
// THE ARENA — PvP combat zone in the open grassland
// Birds enter, pay an entry fee, and fight to the last wing
// ============================================================
const ARENA = {
  x: 2750,      // center X
  y: 1200,      // center Y
  radius: 175,  // arena ring radius
  entryFee: 30, // coins to enter
};

// ============================================================
// THE RADIO TOWER — contested control point (center-north)
// Hold E to capture. Own it to broadcast to the whole city.
// ============================================================
const RADIO_TOWER = {
  x: 1200,         // center between vertical roads (x:740 & x:1640)
  y: 450,          // above main horizontal road (y:840)
  captureRadius: 90,
};

// ============================================================
// PIGEON RACING TRACK — 5-checkpoint loop around the city
// START at park center, race clockwise through all 4 corners,
// then return to the finish line for glory and coins!
// ============================================================
const RACE_CHECKPOINTS = [
  { x: 1200, y: 1200, label: 'START', r: 85 },   // idx 0 = start/finish line (park center)
  { x: 2350, y: 600,  label: 'CP 1',  r: 85 },   // top-right: between Mall and highway
  { x: 2500, y: 2480, label: 'CP 2',  r: 85 },   // bottom-right: below Downtown
  { x: 350,  y: 2480, label: 'CP 3',  r: 85 },   // bottom-left: below Cafe District
  { x: 350,  y: 480,  label: 'CP 4',  r: 85 },   // top-left: Residential corner
];

// ============================================================
// UNDERGROUND SEWER SYSTEM — manholes to a secret underworld
// Press [E] near a manhole to descend. No cops can follow.
// Sewer rats patrol underground. Rare loot caches await.
// ============================================================
const MANHOLES = [
  { id: 'mh1', x: 400,  y: 855,  label: 'Residential' },
  { id: 'mh2', x: 1050, y: 855,  label: 'Park Entrance' },
  { id: 'mh3', x: 2050, y: 855,  label: 'Mall District' },
  { id: 'mh4', x: 755,  y: 380,  label: 'North Quarter' },
  { id: 'mh5', x: 755,  y: 1380, label: 'Midtown West' },
  { id: 'mh6', x: 1655, y: 1800, label: 'Downtown' },
  { id: 'mh7', x: 450,  y: 2295, label: 'South Alley' },
];

// Underground loot cache positions (scattered deep in the sewer)
const SEWER_LOOT_POSITIONS = [
  { x: 500,  y: 1050 },   // under Park area
  { x: 1350, y: 320  },   // under north, near radio tower
  { x: 1580, y: 1450 },   // center of city, underground
  { x: 2300, y: 850  },   // under Mall district
  { x: 680,  y: 2380 },   // under south cafe
  { x: 2480, y: 2350 },   // southeast underground
];

module.exports = {
  WORLD_WIDTH, WORLD_HEIGHT,
  BUILDINGS, TREES, PARK, CAFE_TABLES, ROADS, CARS, LAUNDRY,
  MOVING_CARS, EVENT_LOCATIONS, POWERUP_TYPES,
  NPC_TYPES, BIRD_TYPES, DATE_CENTER,
  SKILL_CATALOG, BIRD_COLORS, STREET_LAMPS,
  TERRITORY_ZONES, ARENA, RADIO_TOWER, RACE_CHECKPOINTS,
  MANHOLES, SEWER_LOOT_POSITIONS,
  getXPForLevel, getLevelFromXP, getBirdTypeForLevel,
};
