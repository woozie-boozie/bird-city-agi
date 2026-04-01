const { v4: uuidv4 } = require('crypto');
const { db: firestoreDb } = require('./db');
const world = require('./world');

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ============================================================
// DAILY CHALLENGE POOL — 3 picked each UTC day via seeded random
// ============================================================
const DAILY_CHALLENGE_POOL = [
  { id: 'poop_humans',     title: 'Bombardier',      desc: 'Poop on 15 humans or NPCs',              target: 15,  trackType: 'poop_npc',        reward: { xp: 120, coins: 50  } },
  { id: 'poop_total',      title: 'Poop Machine',    desc: 'Poop 30 times (any target)',             target: 30,  trackType: 'poop_total',      reward: { xp: 100, coins: 45  } },
  { id: 'car_bomber',      title: 'Road Rager',      desc: 'Poop on 8 moving cars',                  target: 8,   trackType: 'car_hit',         reward: { xp: 130, coins: 60  } },
  { id: 'raccoon_stopper', title: 'Thief Stopper',   desc: 'Poop on 3 raccoon thieves mid-steal',    target: 3,   trackType: 'raccoon_hit',     reward: { xp: 140, coins: 65  } },
  { id: 'cop_stunner',     title: 'Cop Dodger',      desc: 'Stun 3 cop birds with poop',             target: 3,   trackType: 'cop_hit',         reward: { xp: 160, coins: 75  } },
  { id: 'combo_master',    title: 'Combo King',      desc: 'Reach a 10× combo streak',               target: 1,   trackType: 'combo10',         reward: { xp: 180, coins: 80  } },
  { id: 'graffiti_artist', title: 'Street Artist',   desc: 'Tag 5 buildings with graffiti',          target: 5,   trackType: 'tags',            reward: { xp: 120, coins: 55  } },
  { id: 'pickpocket',      title: 'Pickpocket Pro',  desc: 'Pickpocket 4 drunk pigeons',             target: 4,   trackType: 'pickpocket',      reward: { xp: 130, coins: 60  } },
  { id: 'sewer_explorer',  title: 'Sewer Rat',       desc: 'Collect 3 sewer loot caches underground',target: 3,   trackType: 'sewer_loot',      reward: { xp: 150, coins: 70  } },
  { id: 'heist_job',       title: 'Heist Crew',      desc: 'Complete a food truck or bank heist',    target: 1,   trackType: 'heist',           reward: { xp: 200, coins: 100 } },
  { id: 'egg_carrier',     title: 'Egg Runner',      desc: 'Deliver a golden egg to a nest',         target: 1,   trackType: 'egg_delivered',   reward: { xp: 200, coins: 100 } },
  { id: 'mafia_work',      title: 'Made Bird',       desc: 'Complete a Don Featherstone contract',   target: 1,   trackType: 'don_contract',    reward: { xp: 180, coins: 90  } },
  { id: 'wanted_survivor', title: 'Most Wanted',     desc: 'Reach Wanted Level 3 and survive 10s',   target: 1,   trackType: 'wanted_survival', reward: { xp: 150, coins: 75  } },
  { id: 'coin_hoarder',    title: 'Coin Hoarder',    desc: 'Earn 200 coins today',                   target: 200, trackType: 'coins_earned',    reward: { xp: 110, coins: 55  } },
  { id: 'npc_cryer',       title: 'Tear Collector',  desc: 'Make 3 humans cry with poop',            target: 3,   trackType: 'npc_cry',         reward: { xp: 160, coins: 70  } },
];

class GameEngine {
  constructor() {
    this.birds = new Map();       // id -> bird state
    this.poops = new Map();       // id -> poop
    this.npcs = new Map();        // id -> npc
    this.foods = new Map();       // id -> food item
    this.events = [];             // transient events to broadcast

    // === NEW: Tier 1 state ===
    this.cat = null;              // active cat NPC or null
    this.catSpawnTimer = Date.now() + this._randomRange(60000, 90000);

    this.movingCars = [];         // moving car state
    this._initMovingCars();

    this.powerUps = new Map();    // id -> power-up item
    this.powerUpSpawnTimer = Date.now() + this._randomRange(30000, 45000);

    this.worldEvent = null;       // current world event or null
    this.worldEventTimer = Date.now() + this._randomRange(120000, 300000);
    this.worldEventNPCs = new Map();  // event-specific NPCs
    this.worldEventFoods = new Map(); // event-specific foods

    // === Skills ===
    this.decoys = new Map();          // id -> { id, x, y, vx, vy, rotation, type, birdColor, ownerId, expiresAt }
    this.beacons = new Map();         // id -> { x, y, birdId, expiresAt }

    // === Flocks ===
    this.flocks = new Map();          // flockId -> { id, name, leaderId, members: Set<birdId>, createdAt }
    this.flockInvites = new Map();    // targetBirdId -> { fromId, toId, flockId, flockName, expiresAt }

    // === Bird Gangs (persistent criminal crews) ===
    this.gangs = new Map();           // gangId -> { id, name, tag, color, leaderId, leaderName, treasury, members: Set, memberNames: Map, warWithGangId, warEndsAt, warKills, warEnemyKills, createdAt }
    this.gangInvites = new Map();     // targetBirdId -> { fromId, fromName, gangId, gangName, gangTag, gangColor, expiresAt }
    this.gangWarHits = new Map();     // `${attackerBirdId}_${targetBirdId}` -> hit count (tracks 3-poop kills during war)
    this.GANG_COLORS = ['#ff3333', '#ff8800', '#ffcc00', '#33cc55', '#3399ff', '#cc44ff', '#ff44aa', '#00ccdd'];
    this._loadGangs();

    // === Missions ===
    this.missionBoard = [];           // array of 3 mission defs on the board
    this.activeMissions = new Map();  // birdId -> { missionId, def, progress, startedAt, participants: Set<birdId> }
    this.missionBoardTimer = Date.now() + 10000;
    this.missionBoardRefreshTimer = Date.now() + 10000;

    // === CHAOS METER ===
    this.chaosMeter = 0;
    this.chaosEvent = null;           // { type, endsAt, data }
    this.chaosEventNPCs = new Map();  // extra NPCs spawned by chaos events
    this.chaosEventFoods = new Map(); // golden rain foods

    // === BOSS BATTLES (Eagle Overlord only — MEGA_CAT/MEGA_HAWK now have fixed territories) ===
    this.boss = null;
    this.bossSpawnTimer = Date.now() + this._randomRange(600000, 900000); // Eagle only: 10-15 min

    // === TERRITORY PREDATORS — hawk and cat live in fixed home zones, never wander the city ===
    this.territoryPredators = {
      hawk: { type: 'MEGA_HAWK', x: world.PREDATOR_TERRITORIES.hawk.spawnX, y: world.PREDATOR_TERRITORIES.hawk.spawnY, hp: 60, maxHp: 60, rotation: 0, state: 'patrol', wanderAngle: Math.random() * Math.PI * 2, wanderTimer: 0, targetBirdId: null, lastAttack: 0, respawnTimer: 0 },
      cat:  { type: 'MEGA_CAT',  x: world.PREDATOR_TERRITORIES.cat.spawnX,  y: world.PREDATOR_TERRITORIES.cat.spawnY,  hp: 60, maxHp: 60, rotation: 0, state: 'patrol', wanderAngle: Math.random() * Math.PI * 2, wanderTimer: 0, targetBirdId: null, lastAttack: 0, respawnTimer: 0 },
    };
    this.predatorWarnings = new Map(); // birdId -> { hawk: timestampOrNull, cat: timestampOrNull }
    this.predatorHitCounts = new Map(); // birdId -> { hawk: 0, cat: 0 }

    // === WANTED SYSTEM ===
    this.heatScores = new Map();      // birdId -> heat number (0-250+)
    this.wantedBirdId = null;         // bird with highest heat (>= level 1)
    this.lastWantedCheck = Date.now();
    this.lastHeatDecay = Date.now();
    this.lastSurvivalXp = Date.now(); // timer for high-heat survival XP
    this.copBirds = new Map();        // id -> cop bird NPC state
    // Heat thresholds: level 1-5
    // 10 = ⭐, 25 = ⭐⭐ (1 cop), 50 = ⭐⭐⭐ (2 cops), 100 = ⭐⭐⭐⭐ (3 cops + SWAT), 200 = ⭐⭐⭐⭐⭐ (SWAT hawk + bounty)
    this.WANTED_THRESHOLDS = [10, 25, 50, 100, 200];

    // === FOOD TRUCK ===
    this.foodTruck = null;
    this.foodTruckSpawnTimer = Date.now() + this._randomRange(180000, 300000); // 3-5 min

    // === NPC REVENGE ===
    this.areaChaos = [0, 0, 0, 0];   // 4 quadrants: TL, TR, BL, BR
    this.revengeNPCs = new Map();     // id -> revenge NPC
    this.revengeExpiry = [0, 0, 0, 0]; // when revenge NPCs despawn per quadrant

    // === THE JANITOR ===
    this.janitor = null;
    this.janitorRageQuitUntil = 0;
    this.janitorBaseSpeedBonus = 0;   // cumulative speed bonus from rage quits

    // === RACCOON THIEVES (night-only) ===
    this.raccoons = new Map();        // id -> raccoon state
    this.raccoonSpawnTimer = 0;       // when to try next spawn

    // === THE GODFATHER RACCOON (night boss, once per night) ===
    this.godfatherRaccoon = null;
    this.godfatherSpawnedThisNight = false;

    // === PIGEON MAFIA DON (permanent NPC questgiver) ===
    this.donCurrentJob = null;   // current job def on offer
    this.donJobTimer = Date.now() + 8000; // first job in 8s

    // === HIT CONTRACTS (player-placed bounties via The Don) ===
    this.activeHits = new Map();  // targetBirdId -> { contractorId, contractorName, targetId, targetName, reward, hitProgress: Map(hitmanId->count), hitsNeeded, expiresAt }
    this._hitCounter = 0;

    // === DRUNK PIGEONS (night-only, pickpocketable) ===
    this.drunkPigeons = new Map();    // id -> drunk pigeon state
    this.drunkPigeonSpawnTimer = 0;   // when to try next spawn

    // === WEATHER SYSTEM ===
    this.weather = null;              // { type, intensity, windAngle, windSpeed, endsAt, wormSpawnTimer, lightningTimer }
    this.weatherTimer = Date.now() + this._randomRange(60000, 120000); // 1-2 min to first weather
    this.rainWorms = new Map();       // id -> true (worm food ids spawned during rain)

    // === GOLDEN EGG SCRAMBLE ===
    this.eggScramble = null;          // null or { state, startedAt, endsAt, eggs: Map(id->egg), delivered }
    this.eggScrambleTimer = Date.now() + this._randomRange(720000, 1080000); // first scramble 12-18 min in

    // === THE ARENA (PvP combat pit) ===
    this.arena = {
      state: 'idle', // 'idle' | 'waiting' | 'countdown' | 'fighting' | 'cooldown'
      fighters: new Map(), // birdId -> { arenaHp, maxArenaHp, eliminated, damageDealt, name }
      pot: 0,
      waitingUntil: null,   // auto-countdown trigger when 2+ fighters
      countdownUntil: null, // fight starts
      fightEndsAt: null,    // 90s fight timer
      cooldownUntil: null,  // rest period after fight
    };
    this.ARENA_ENTRY_FEE = 30;
    this.ARENA_FIGHT_DURATION = 90000;  // 90 seconds
    this.ARENA_COUNTDOWN_MS = 5000;     // 5-second countdown
    this.ARENA_COOLDOWN_MS = 25000;     // 25-second rest after fight
    this.ARENA_WAIT_MS = 20000;         // wait 20s for more fighters after 2nd joins

    // === BLACK MARKET (night-only contraband shop) ===
    this.blackMarket = null;  // null when closed, { x, y } when open at night
    this.BLACK_MARKET_POS = { x: 700, y: 2200 }; // dark alley behind Cafe District
    this.BLACK_MARKET_CATALOG = [
      { id: 'speed_serum',  name: 'Speed Serum',   desc: '+60% speed for 30s',            cost: 50,  emoji: '💉' },
      { id: 'mega_poop',    name: 'Mega Poop',      desc: 'Next 3 poops are AOE blasts',   cost: 75,  emoji: '💣' },
      { id: 'disguise_kit', name: 'Disguise Kit',   desc: 'Clears ALL heat instantly',     cost: 100, emoji: '🎭' },
      { id: 'smoke_bomb',   name: 'Smoke Bomb',     desc: 'Cops lose you for 15 seconds',  cost: 80,  emoji: '💨' },
      { id: 'lucky_charm',  name: 'Lucky Charm',    desc: '2x XP for 5 full minutes',      cost: 150, emoji: '🍀' },
    ];

    // === BANK HEIST (multi-phase cooperative heist event) ===
    this.bankHeist = this._initBankHeistState();
    this.bankHeistTimer = Date.now() + this._randomRange(480000, 720000); // 8-12 min first opportunity

    // === GRAFFITI TAGS ===
    // buildingIdx -> { ownerBirdId, ownerName, ownerColor, flockId, flockName, taggedAt, expiresAt }
    this.graffiti = new Map();
    this._lastGraffitiClean = Date.now();

    // === RADIO TOWER ===
    // Contested control point — hold E to capture, press T to broadcast
    this.radioTower = {
      state: 'neutral',   // 'neutral' | 'owned'
      ownerId: null,
      ownerName: null,
      ownerColor: null,
      capturedAt: null,
      expiresAt: null,    // ownership lasts 3 minutes
      lastRewardAt: 0,
      broadcastCooldownUntil: 0,  // taunt cooldown
      signalBoostUsed: false,
      signalBoostUntil: 0,        // global XP boost ends at
    };

    // === TERRITORY CONTROL ===
    this.territories = new Map();  // zoneId -> zone state
    this._initTerritories();

    // === PIGEON RACING TRACK ===
    this.pigeonRace = {
      state: 'idle',      // 'idle' | 'open' | 'countdown' | 'racing' | 'finished'
      racers: new Map(),  // birdId -> { name, nextCpIdx, needsFinish, finished, finishTime, finishPosition }
      bets: new Map(),    // birdId -> { targetId, targetName, amount }
      pot: 0,
      openUntil: null,
      countdownUntil: null,
      raceStartAt: null,
      raceEndsAt: null,   // max race time (3 min)
      winners: [],        // ordered finishers: [{ birdId, name, time }]
      finishedAt: null,   // when results were shown (idle cooldown)
    };
    this.pigeonRaceTimer = Date.now() + this._randomRange(300000, 480000); // 5-8 min to first race
    this.RACE_ENTRY_FEE = 25;
    this.RACE_MAX_RACERS = 8;
    this.RACE_OPEN_MS = 30000;      // 30s registration window
    this.RACE_COUNTDOWN_MS = 5000;  // 5s countdown
    this.RACE_MAX_DURATION = 180000; // 3 min max race time
    this.RACE_CHECKPOINTS = world.RACE_CHECKPOINTS;

    // === UNDERGROUND SEWER SYSTEM ===
    this.sewerRats = new Map();     // id -> sewer rat state
    this.sewerLoot = new Map();     // id -> loot cache state
    this._lastSewerRatSpawn = 0;
    this._initSewerLoot();

    // === LEADERBOARD CACHE (async Firestore) ===
    this._cachedLeaderboard = [];
    this._refreshLeaderboard();
    this._leaderboardInterval = setInterval(() => this._refreshLeaderboard(), 10000);

    // === DAILY CHALLENGES ===
    this.dailyChallenges = [];      // 3 current challenge defs for today
    this.dailyChallengesDate = '';  // 'YYYY-MM-DD' UTC string
    this._refreshDailyChallengesIfNeeded(); // pick today's 3 challenges on startup

    // === KINGPIN SYSTEM ===
    // Richest bird online wears the crown. Visible on everyone's minimap.
    // 3 poop hits from the same attacker = dethrone. Big reward for the hitman.
    this.kingpin = null; // { birdId, birdName, coins, crownedAt, hitCount: Map(hitterId->count), lastPassiveReward }
    this.kingpinCheckTimer = 0;

    // === BIRD TATTOO PARLOR ===
    this.TATTOO_PARLOR_POS = world.TATTOO_PARLOR_POS;
    this.TATTOO_CATALOG = world.TATTOO_CATALOG;
    // Build quick lookup: id → tattoo
    this.TATTOO_MAP = {};
    for (const t of this.TATTOO_CATALOG) this.TATTOO_MAP[t.id] = t;

    // === PIGEONHOLE SLOTS CASINO ===
    this.slotsJackpot = 500;   // progressive jackpot — grows 5c per losing spin
    this.CASINO_POS = world.CASINO_POS;
    this.SLOTS_BET = 30;
    this.SLOTS_SYMBOLS = [
      { id: 'bird',    emoji: '🐦', weight: 35 },
      { id: 'poop',    emoji: '💩', weight: 25 },
      { id: 'food',    emoji: '🍗', weight: 20 },
      { id: 'star',    emoji: '⭐', weight: 12 },
      { id: 'diamond', emoji: '💎', weight: 6  },
      { id: 'crown',   emoji: '👑', weight: 2  },
    ];
    this.SLOTS_TOTAL_WEIGHT = this.SLOTS_SYMBOLS.reduce((s, sym) => s + sym.weight, 0);

    // === DAY/NIGHT CYCLE ===
    // 0.0 = early day, 0.3 = dusk, 0.45 = night, 0.75 = dawn, 1.0 = day again
    // Full cycle = 20 real-time minutes
    this.dayTime = 0.0;
    this.dayPhase = 'day'; // 'day' | 'dusk' | 'night' | 'dawn'

    this.tickRate = 20;           // ticks per second
    this.tickInterval = 1000 / this.tickRate;
    this.lastTick = Date.now();

    this._initNPCs();
    this._initFoods();
    this._loadPersistedPoops();

    // Start game loop
    this.loop = setInterval(() => this.tick(), this.tickInterval);

    // Periodic saves
    this.saveLoop = setInterval(() => this.saveAll(), 30000);

    // Food respawn
    this.foodRespawn = setInterval(() => this._respawnFoods(), 10000);

    console.log(`[GameEngine] Started. ${this.npcs.size} NPCs, ${this.foods.size} foods, ${this.poops.size} poops loaded.`);
  }

  _randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  _initMovingCars() {
    this.movingCars = world.MOVING_CARS.map(def => ({
      ...def,
      honkCooldown: 0,
    }));
  }

  _initNPCs() {
    // Walkers on roads
    for (let i = 0; i < 25; i++) {
      const areas = world.NPC_TYPES.walker.spawnAreas;
      const area = areas[Math.floor(Math.random() * areas.length)];
      const npc = {
        id: 'npc_' + uid(),
        type: 'walker',
        x: area.x + Math.random() * area.w,
        y: area.y + Math.random() * area.h,
        targetX: 0, targetY: 0,
        speed: world.NPC_TYPES.walker.speed + Math.random() * 15,
        state: 'walking',
        stateTimer: 0,
        poopedOn: 0,
        hasFood: Math.random() > 0.7,
      };
      this._setNPCTarget(npc);
      this.npcs.set(npc.id, npc);
    }

    // Cafe sitters
    world.NPC_TYPES.cafe_sitter.positions.forEach((pos, i) => {
      const npc = {
        id: 'npc_cafe_' + i,
        type: 'cafe_sitter',
        x: pos.x,
        y: pos.y,
        targetX: pos.x, targetY: pos.y,
        speed: 0,
        state: 'sitting',
        stateTimer: 0,
        poopedOn: 0,
        hasFood: true,
        homeX: pos.x, homeY: pos.y,
      };
      this.npcs.set(npc.id, npc);
    });

    // Park walkers
    for (let i = 0; i < 10; i++) {
      const area = world.NPC_TYPES.park_walker.spawnArea;
      const npc = {
        id: 'npc_park_' + uid(),
        type: 'park_walker',
        x: area.x + Math.random() * area.w,
        y: area.y + Math.random() * area.h,
        targetX: 0, targetY: 0,
        speed: world.NPC_TYPES.park_walker.speed + Math.random() * 10,
        state: 'walking',
        stateTimer: 0,
        poopedOn: 0,
        hasFood: Math.random() > 0.5,
      };
      this._setNPCTarget(npc);
      this.npcs.set(npc.id, npc);
    }
  }

  _setNPCTarget(npc) {
    if (npc.type === 'walker') {
      const areas = world.NPC_TYPES.walker.spawnAreas;
      const area = areas[Math.floor(Math.random() * areas.length)];
      npc.targetX = area.x + Math.random() * area.w;
      npc.targetY = area.y + Math.random() * area.h;
    } else if (npc.type === 'park_walker') {
      const area = world.NPC_TYPES.park_walker.spawnArea;
      npc.targetX = area.x + Math.random() * area.w;
      npc.targetY = area.y + Math.random() * area.h;
    }
  }

  _initFoods() {
    // Cafe table foods
    world.CAFE_TABLES.forEach((table, i) => {
      if (table.food) {
        const food = {
          id: 'food_' + i,
          x: table.x,
          y: table.y,
          type: ['chips', 'sandwich', 'kebab', 'pizza', 'donut'][Math.floor(Math.random() * 5)],
          value: 10 + Math.floor(Math.random() * 20),
          respawnAt: null,
          active: true,
        };
        this.foods.set(food.id, food);
      }
    });

    // Random ground food (crumbs, dropped stuff)
    for (let i = 0; i < 15; i++) {
      const food = {
        id: 'food_ground_' + i,
        x: 100 + Math.random() * (world.WORLD_WIDTH - 200),
        y: 100 + Math.random() * (world.WORLD_HEIGHT - 200),
        type: ['crumb', 'fry', 'bread'][Math.floor(Math.random() * 3)],
        value: 3 + Math.floor(Math.random() * 8),
        respawnAt: null,
        active: true,
      };
      this.foods.set(food.id, food);
    }
  }

  _respawnFoods() {
    const now = Date.now();
    for (const food of this.foods.values()) {
      if (!food.active && food.respawnAt && now >= food.respawnAt) {
        food.active = true;
        food.respawnAt = null;
      }
    }
  }

  _loadPersistedPoops() {
    firestoreDb.getPoops().then(rows => {
      for (const row of rows) {
        if (row.x >= 0 && row.x <= world.WORLD_WIDTH && row.y >= 0 && row.y <= world.WORLD_HEIGHT) {
          this.poops.set(row.id, {
            id: row.id,
            birdId: row.bird_id,
            x: row.x,
            y: row.y,
            hitTarget: row.hit_target,
            time: row.created_at * 1000,
          });
        }
      }
      console.log(`[GameEngine] Loaded ${this.poops.size} persisted poops from Firestore`);
    }).catch(e => {
      console.log('[GameEngine] No persisted poops to load:', e.message);
    });
  }

  async addBird(id, name) {
    // Check if returning bird
    const saved = await firestoreDb.getBird(id);

    const bird = {
      id,
      name: name || (saved ? saved.name : 'Bird_' + uid()),
      x: saved ? saved.last_x : 1100 + Math.random() * 100,
      y: saved ? saved.last_y : 1150 + Math.random() * 100,
      vx: 0, vy: 0,
      rotation: 0,
      type: saved ? saved.type : 'pigeon',
      xp: saved ? saved.xp : 0,
      food: saved ? saved.food : 0,
      shinyThings: saved ? saved.shiny_things : 0,
      totalPoops: saved ? saved.total_poops : 0,
      totalSteals: saved ? saved.total_steals : 0,
      totalHits: saved ? saved.total_hits : 0,
      humansCried: saved ? saved.humans_cried : 0,
      online: true,
      lastPoop: 0,
      lastSteal: 0,
      input: { w: false, a: false, s: false, d: false, space: false, e: false },
      wingPhase: Math.random() * Math.PI * 2,
      // Tier 1: stun + power-up state
      stunnedUntil: 0,
      powerUp: null,       // { type, expiresAt } or null
      megaPoopReady: false, // true when mega_poop power-up is active (one-time use)
      // Abilities (legacy + new skill system)
      lastAbility: 0,
      cloakedUntil: 0,
      eagleEyeUntil: 0,
      diveBombing: false,
      diveBombUntil: 0,
      speedBurstUntil: 0,
      // Skill system
      coins: saved ? (saved.coins || 0) : 0,
      ownedSkills: saved ? JSON.parse(saved.owned_skills || '["poop_barrage"]') : ['poop_barrage'],
      equippedSkills: saved ? JSON.parse(saved.equipped_skills || '["poop_barrage"]') : ['poop_barrage'],
      birdColor: saved ? (saved.bird_color || null) : null,
      skillCooldowns: {},
      // Flock
      flockId: null,
      flockName: null,
      // Mission
      activeMission: null, // { missionId, progress, startedAt }
      // Nest (safe AFK)
      inNest: false,
      // Underground sewer
      inSewer: false,
      lastSewerEntry: 0,
      // Black Market active items
      bmSpeedUntil: 0,
      bmMegaPoops: 0,
      bmSmokeBombUntil: 0,
      bmDoubleXpUntil: 0,
      // === COMBO STREAK ===
      comboCount: 0,        // current consecutive hit streak
      comboExpiresAt: 0,    // timestamp when combo resets if no new hit
      // === WEATHER EFFECTS ===
      hailSlowUntil: 0,     // timestamp when hail slow wears off
      // === GOLDEN EGG SCRAMBLE ===
      carryingEggId: null,         // id of the golden egg this bird is carrying, or null
      eggTackleImmunityUntil: 0,   // timestamp until tackle immunity (after being robbed)
      // === PIGEON MAFIA DON ===
      mafiaRep: saved ? (saved.mafia_rep || 0) : 0,
      donMission: null,            // { jobId, progress, startedAt, survivalStarted }
      // === DAILY CHALLENGES ===
      dailyDate:      saved ? (saved.daily_date || '') : '',
      dailyProgress:  saved ? this._safeJsonParse(saved.daily_progress, {}) : {},
      dailyCompleted: saved ? this._safeJsonParse(saved.daily_completed, []) : [],
      dailyStreak:    saved ? (saved.daily_streak || 0) : 0,
      dailyStreakDate: saved ? (saved.daily_streak_date || '') : '',
      dailyCoinEarned: 0,  // transient: coins earned today, reset on new day
      // === BIRD GANGS (persistent criminal crews) ===
      gangId:   saved ? (saved.gang_id   || null) : null,
      gangName: saved ? (saved.gang_name || null) : null,
      gangTag:  saved ? (saved.gang_tag  || null) : null,
      gangColor:saved ? (saved.gang_color|| null) : null,
      gangRole: saved ? (saved.gang_role || null) : null,  // 'leader' | 'member'
      // === BIRD TATTOO PARLOR ===
      tattoosOwned:    saved ? this._safeJsonParse(saved.tattoos_owned, []) : [],
      tattoosEquipped: saved ? this._safeJsonParse(saved.tattoos_equipped, []) : [],
    };

    // Determine bird type from XP
    const level = world.getLevelFromXP(bird.xp);
    bird.type = world.getBirdTypeForLevel(level);
    bird.level = level;

    this.birds.set(id, bird);

    // Register with gang if bird has one
    if (bird.gangId) {
      const gang = this.gangs.get(bird.gangId);
      if (gang) {
        gang.members.add(bird.id);
        gang.memberNames.set(bird.id, bird.name);
      } else {
        // Gang no longer exists — clear the bird's gang data
        bird.gangId = null; bird.gangName = null; bird.gangTag = null; bird.gangColor = null; bird.gangRole = null;
      }
    }

    this.events.push({ type: 'join', birdId: id, name: bird.name, birdType: bird.type });

    return bird;
  }

  removeBird(id) {
    const bird = this.birds.get(id);
    if (bird) {
      this._saveBird(bird);
      bird.online = false;
      this.events.push({ type: 'leave', birdId: id, name: bird.name });
      // Clean up flock membership
      if (bird.flockId) {
        this._handleFlockLeave(bird);
      }
      // Clean up gang membership (keep in memberNames for offline display)
      if (bird.gangId) {
        const gang = this.gangs.get(bird.gangId);
        if (gang) gang.members.delete(bird.id);
      }
      // Clean up active mission
      if (bird.activeMission) {
        bird.activeMission = null;
      }
      // Clean up decoys
      for (const [dId, d] of this.decoys) {
        if (d.ownerId === id) this.decoys.delete(dId);
      }
      // Clean up beacons
      for (const [bId, b] of this.beacons) {
        if (b.birdId === id) this.beacons.delete(bId);
      }
      // Clean up arena fighters (mark as eliminated on disconnect)
      if (this.arena.fighters.has(id)) {
        const f = this.arena.fighters.get(id);
        f.eliminated = true;
      }
      // Drop golden egg if carrying
      if (bird.carryingEggId && this.eggScramble) {
        const egg = this.eggScramble.eggs.get(bird.carryingEggId);
        if (egg && !egg.delivered) {
          egg.carrierId = null;
          egg.carrierName = null;
        }
      }
      this.birds.delete(id);
    }
  }

  setInput(birdId, input) {
    const bird = this.birds.get(birdId);
    if (bird) {
      bird.input = input;
    }
  }

  handleAction(birdId, action) {
    const bird = this.birds.get(birdId);
    if (!bird) return;
    const now = Date.now();

    if (action.type === 'caw') {
      const sounds = ['CAW!', 'SQUAWK!', 'COO!', 'CHIRP!', 'SCREEE!', 'BAWK!'];
      const sound = sounds[Math.floor(Math.random() * sounds.length)];
      this.events.push({ type: 'sound', birdId, sound, x: bird.x, y: bird.y });
    }

    if (action.type === 'send_to_nest') {
      bird.inNest = true;
      bird.vx = 0;
      bird.vy = 0;
      this.events.push({ type: 'nest_enter', birdId, name: bird.name, x: bird.x, y: bird.y });
    }

    if (action.type === 'wake_from_nest') {
      if (bird.inNest) {
        bird.inNest = false;
        this.events.push({ type: 'nest_exit', birdId, name: bird.name });
      }
    }

    if (action.type === 'ability') {
      // Backwards compat: maps to use_skill slot 0
      this._handleUseSkill(bird, 0, now);
    }

    if (action.type === 'use_skill') {
      const slot = typeof action.slot === 'number' ? action.slot : 0;
      this._handleUseSkill(bird, slot, now);
    }

    if (action.type === 'buy_skill') {
      this._handleBuySkill(bird, action.skillId, now);
    }

    if (action.type === 'equip_skill') {
      this._handleEquipSkill(bird, action.skillId, action.slot, now);
    }

    if (action.type === 'set_color') {
      if (action.color === '' || action.color === null) {
        bird.birdColor = null;
        this._saveBird(bird);
      } else if (world.BIRD_COLORS.includes(action.color)) {
        bird.birdColor = action.color;
        this._saveBird(bird);
      }
    }

    // === Flock actions ===
    if (action.type === 'flock_invite') {
      this._handleFlockInvite(bird, action.targetId, now);
    }
    if (action.type === 'flock_accept') {
      this._handleFlockAccept(bird, now);
    }
    if (action.type === 'flock_decline') {
      this.flockInvites.delete(bird.id);
    }
    if (action.type === 'flock_leave') {
      this._handleFlockLeave(bird);
    }

    // === Gang actions ===
    if (action.type === 'gang_create') {
      this._handleGangCreate(bird, action.tag, action.name, now);
    }
    if (action.type === 'gang_invite') {
      this._handleGangInvite(bird, action.targetId, now);
    }
    if (action.type === 'gang_accept') {
      this._handleGangAccept(bird, now);
    }
    if (action.type === 'gang_decline') {
      this.gangInvites.delete(bird.id);
    }
    if (action.type === 'gang_leave') {
      this._handleGangLeave(bird);
    }
    if (action.type === 'gang_deposit') {
      this._handleGangDeposit(bird, action.amount, now);
    }
    if (action.type === 'gang_declare_war') {
      this._handleGangDeclareWar(bird, action.rivalGangId, now);
    }
    if (action.type === 'gang_distribute') {
      this._handleGangDistribute(bird, now);
    }

    // === Mission actions ===
    if (action.type === 'accept_mission') {
      this._handleAcceptMission(bird, action.missionId, now);
    }

    // === Pigeon Mafia Don ===
    if (action.type === 'don_accept') {
      this._handleDonAccept(bird, now);
    }
    if (action.type === 'place_hit') {
      this._handlePlaceHit(bird, action, now);
    }

    // === Black Market ===
    if (action.type === 'blackmarket_buy') {
      this._handleBlackMarketBuy(bird, action.itemId, now);
    }

    // === Pigeonhole Slots Casino ===
    if (action.type === 'slots_spin') {
      this._handleSlotsSpin(bird, now);
    }

    // === Bird Tattoo Parlor ===
    if (action.type === 'buy_tattoo') {
      this._handleBuyTattoo(bird, action.tattooId, now);
    }
    if (action.type === 'equip_tattoo') {
      this._handleEquipTattoo(bird, action.tattooId, now);
    }

    // === The Arena ===
    if (action.type === 'arena_enter') {
      this._handleArenaEnter(bird, now);
    }

    // === Radio Tower ===
    if (action.type === 'tower_capture') {
      this._handleTowerCapture(bird, now);
    }
    if (action.type === 'tower_broadcast') {
      this._handleTowerBroadcast(bird, action.broadcastType, now);
    }

    // === Pigeon Racing ===
    if (action.type === 'race_join') {
      this._handleRaceJoin(bird, now);
    }
    if (action.type === 'race_bet') {
      this._handleRaceBet(bird, action, now);
    }

    // === Graffiti Tagging ===
    if (action.type === 'spray_tag') {
      const buildingIdx = typeof action.buildingIdx === 'number' ? action.buildingIdx : -1;
      const building = world.BUILDINGS[buildingIdx];
      if (!building) return;

      // Server-side proximity check
      const bcx = building.x + building.w / 2;
      const bcy = building.y + building.h / 2;
      const ddx = bird.x - bcx;
      const ddy = bird.y - bcy;
      if (Math.sqrt(ddx * ddx + ddy * ddy) > 100) return;

      const existing = this.graffiti.get(buildingIdx);
      const isOvertag = existing && existing.expiresAt > now && existing.ownerBirdId !== bird.id;
      const cost = isOvertag ? 8 : 5;

      if (bird.coins < cost) return;

      const tagColor = bird.birdColor || this._teamColor(bird.flockId || bird.id);
      bird.coins -= cost;
      const xpGain = isOvertag ? 25 : 20;
      bird.xp += xpGain;

      const TAG_DURATION = 8 * 60 * 1000; // 8 minutes
      this.graffiti.set(buildingIdx, {
        ownerBirdId: bird.id,
        ownerName: bird.name,
        ownerColor: tagColor,
        flockId: bird.flockId || null,
        flockName: bird.flockName || null,
        taggedAt: now,
        expiresAt: now + TAG_DURATION,
      });

      if (isOvertag) {
        this.events.push({
          type: 'graffiti_overtag',
          buildingName: building.name,
          newOwner: bird.name,
          oldOwner: existing.ownerName,
        });
      } else {
        this.events.push({
          type: 'graffiti_tagged',
          birdId: bird.id,
          buildingName: building.name,
          ownerName: bird.name,
          x: bcx, y: bcy,
          xp: xpGain,
        });
      }

      // Don mission progress: spray contract
      if (bird.donMission && bird.donMission.jobId === 'don_spray') {
        bird.donMission.progress++;
        this._checkDonMissionComplete(bird, now);
      }
      // Daily challenge: graffiti tags
      this._trackDailyProgress(bird, 'tags', 1);

      // Check for street domination (5+ buildings owned by same team)
      const myTeamId = bird.flockId || bird.id;
      let myTagCount = 0;
      for (const tag of this.graffiti.values()) {
        if (tag.expiresAt > now && (tag.flockId || tag.ownerBirdId) === myTeamId) {
          myTagCount++;
        }
      }
      if (myTagCount === 5) {
        bird.coins += 100; // domination bonus
        this.events.push({
          type: 'graffiti_domination',
          name: bird.flockName || bird.name,
          color: tagColor,
        });
      }

      // Level up check
      const newLevel = world.getLevelFromXP(bird.xp);
      bird.level = newLevel;
      const newType = world.getBirdTypeForLevel(newLevel);
      if (newType !== bird.type) {
        bird.type = newType;
        this.events.push({ type: 'evolve', birdId: bird.id, name: bird.name, birdType: newType });
      }

    // === Sewer entry / exit ===
    if (action.type === 'enter_sewer') {
      this._handleEnterSewer(bird, now);
    }
    if (action.type === 'exit_sewer') {
      this._handleExitSewer(bird, now);
    }
    }
  }

  tick() {
    const now = Date.now();
    const dt = Math.min((now - this.lastTick) / 1000, 0.1); // cap at 100ms
    this.lastTick = now;

    // Check for UTC midnight daily challenge refresh
    this._refreshDailyChallengesIfNeeded();

    // Update birds
    for (const bird of this.birds.values()) {
      this._updateBird(bird, dt, now);
      // Combo expiry: reset streak if window elapsed
      if (bird.comboCount > 0 && now > bird.comboExpiresAt) {
        bird.comboCount = 0;
        bird.comboExpiresAt = 0;
      }
    }

    // Update NPCs
    for (const npc of this.npcs.values()) {
      this._updateNPC(npc, dt, now);
    }

    // === Tier 1: Update systems ===
    this._updateCat(dt, now);
    this._updateMovingCars(dt, now);
    this._updatePowerUps(dt, now);
    this._updateWorldEvent(dt, now);
    this._updateWorldEventNPCs(dt, now);

    // === Skills ===
    this._updateDecoys(dt, now);
    this._updateBeacons(now);

    // === Flocks ===
    this._cleanupFlockInvites(now);

    // === Gang Wars ===
    this._tickGangWars(now);

    // === Missions ===
    this._updateMissions(now);
    this._updateMissionBoard(now);
    this._updateDon(now);
    this._updateActiveHits(now);

    // === Chaos Meter ===
    this._updateChaosMeter(dt, now);
    this._updateChaosEvent(dt, now);

    // === Territory Predators (hawk + cat in fixed home zones) ===
    this._updateTerritoryPredators(dt, now);

    // === Boss Battles (Eagle Overlord only) ===
    this._updateBoss(dt, now);

    // === Wanted System ===
    this._updateWanted(dt, now);
    this._updateCopBirds(dt, now);

    // === Food Truck ===
    this._updateFoodTruck(dt, now);

    // === NPC Revenge ===
    this._updateRevengeNPCs(dt, now);

    // === The Janitor ===
    this._updateJanitor(dt, now);

    // === Raccoon Thieves ===
    this._updateRaccoons(dt, now);

    // === Drunk Pigeons ===
    this._updateDrunkPigeons(dt, now);

    // === The Godfather Raccoon ===
    this._updateGodfatherRaccoon(dt, now);

    // === Weather ===
    this._updateWeather(dt, now);

    // === Territory Control ===
    this._updateTerritories(dt, now);

    // === Black Market ===
    this._updateBlackMarket(dt, now);

    // === The Arena ===
    this._updateArena(dt, now);

    // === Bank Heist ===
    this._updateBankHeist(dt, now);

    // === Graffiti ===
    this._updateGraffiti(now);

    // === Radio Tower ===
    this._updateRadioTower(dt, now);

    // === Pigeon Racing Track ===
    this._updatePigeonRace(dt, now);

    // === Day/Night Cycle ===
    this._updateDayNight(dt, now);

    // === Underground Sewer ===
    this._updateSewerRats(dt, now);
    this._updateSewerLoot(now);

    // === Golden Egg Scramble ===
    this._updateEggScramble(dt, now);

    // === Kingpin System ===
    this._updateKingpin(now);
  }

  // ============================================================
  // CAT SYSTEM
  // ============================================================
  _updateCat(dt, now) {
    // Spawn cat
    if (!this.cat && now >= this.catSpawnTimer && this.birds.size > 0) {
      this._spawnCat(now);
    }

    if (!this.cat) return;

    const cat = this.cat;

    // Cat lifetime
    if (now >= cat.despawnAt) {
      this.cat = null;
      this.events.push({ type: 'cat_despawn' });
      this.catSpawnTimer = now + this._randomRange(60000, 90000);
      return;
    }

    // Count birds near cat (mob check)
    let birdsNearby = 0;
    for (const bird of this.birds.values()) {
      const dx = bird.x - cat.x;
      const dy = bird.y - cat.y;
      if (Math.sqrt(dx * dx + dy * dy) < 80) {
        birdsNearby++;
      }
    }

    // Mobbed by 5+ birds: flee!
    if (birdsNearby >= 5) {
      this.events.push({ type: 'cat_flee', x: cat.x, y: cat.y });
      this.cat = null;
      this.catSpawnTimer = now + this._randomRange(60000, 90000);
      return;
    }

    // Check if any decoys are nearby - prioritize decoys
    let decoyChasingTarget = null;
    for (const d of this.decoys.values()) {
      const dx = d.x - cat.x;
      const dy = d.y - cat.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        if (!decoyChasingTarget || dist < decoyChasingTarget.dist) {
          decoyChasingTarget = { x: d.x, y: d.y, dist, id: d.id };
        }
      }
    }

    if (decoyChasingTarget) {
      // Chase decoy instead of birds
      const dx = decoyChasingTarget.x - cat.x;
      const dy = decoyChasingTarget.y - cat.y;
      const dist = decoyChasingTarget.dist;
      if (dist > 1) {
        cat.x += (dx / dist) * cat.speed * dt;
        cat.y += (dy / dist) * cat.speed * dt;
        cat.rotation = Math.atan2(dy, dx);
      }
      if (dist < 25) {
        this.decoys.delete(decoyChasingTarget.id);
      }
      cat.x = Math.max(20, Math.min(world.WORLD_WIDTH - 20, cat.x));
      cat.y = Math.max(20, Math.min(world.WORLD_HEIGHT - 20, cat.y));
      return;
    }

    // Find nearest bird (that isn't ghost or cloaked)
    let nearestBird = null;
    let nearestDist = Infinity;
    for (const bird of this.birds.values()) {
      // Nest: cat ignores nesting birds
      if (bird.inNest) continue;
      // Ghost feather: cat ignores this bird
      if (bird.powerUp && bird.powerUp.type === 'ghost_feather' && now < bird.powerUp.expiresAt) continue;
      // Shadow cloak: cat skips cloaked birds
      if (bird.cloakedUntil > now) continue;
      const dx = bird.x - cat.x;
      const dy = bird.y - cat.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestBird = bird;
      }
    }

    if (nearestBird) {
      // Move towards nearest bird
      const dx = nearestBird.x - cat.x;
      const dy = nearestBird.y - cat.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        cat.x += (dx / dist) * cat.speed * dt;
        cat.y += (dy / dist) * cat.speed * dt;
        cat.rotation = Math.atan2(dy, dx);
      }

      // Check if cat catches a bird (within 25px)
      if (dist < 25) {
        // Bird loses 20% food, gets stunned 3 seconds
        nearestBird.food = Math.max(0, Math.floor(nearestBird.food * 0.8));
        nearestBird.stunnedUntil = now + 3000;
        // Combo break — the cat got your streak!
        nearestBird.comboCount = 0;
        nearestBird.comboExpiresAt = 0;
        this.events.push({
          type: 'cat_attack',
          birdId: nearestBird.id,
          x: cat.x, y: cat.y,
        });
        this.events.push({
          type: 'stunned',
          birdId: nearestBird.id,
          duration: 3000,
        });
        this.cat = null;
        this.catSpawnTimer = now + this._randomRange(60000, 90000);
        return;
      }

      // Hiss when near (within 80px), throttled
      if (dist < 80 && (!cat.lastHiss || now - cat.lastHiss > 3000)) {
        cat.lastHiss = now;
        this.events.push({ type: 'cat_hiss', x: cat.x, y: cat.y });
      }
    }

    // Keep in bounds
    cat.x = Math.max(20, Math.min(world.WORLD_WIDTH - 20, cat.x));
    cat.y = Math.max(20, Math.min(world.WORLD_HEIGHT - 20, cat.y));
  }

  _spawnCat(now) {
    // Pick random road position
    const roads = world.ROADS;
    const road = roads[Math.floor(Math.random() * roads.length)];
    const x = road.x + Math.random() * road.w;
    const y = road.y + Math.random() * road.h;

    this.cat = {
      x, y,
      speed: 150,
      rotation: 0,
      despawnAt: now + 30000, // 30s lifetime
      lastHiss: 0,
    };

    this.events.push({ type: 'cat_spawn', x, y });
    console.log('[GameEngine] Cat spawned at', Math.round(x), Math.round(y));
  }

  // ============================================================
  // THE JANITOR
  // ============================================================
  _updateJanitor(dt, now) {
    // Spawn: if no janitor, enough poops, and not rage-quit cooldown
    if (this.janitor === null && this.poops.size > 20 && now > this.janitorRageQuitUntil) {
      this._spawnJanitor(now);
    }

    if (!this.janitor) return;

    const j = this.janitor;

    // Despawn: if not enough poops to clean (and not in super mode)
    if (this.poops.size < 5 && j.superUntil <= now) {
      this.janitor = null;
      this.events.push({ type: 'janitor_despawn' });
      return;
    }

    // Super mode expiry
    if (j.superUntil > 0 && now >= j.superUntil) {
      j.superUntil = 0;
      j.speed = j.baseSpeed;
      j.poopsCleaned = 0;
    }

    // Super janitor activation: 30 poops cleaned
    if (j.poopsCleaned >= 30 && j.superUntil === 0) {
      j.superUntil = now + 60000;
      j.speed = 60;
      this.events.push({ type: 'janitor_super', x: j.x, y: j.y });
    }

    // Fist shake trigger: any bird poops within 80px while janitor is walking
    if (j.state === 'walking') {
      for (const ev of this.events) {
        if (ev.type === 'poop') {
          const dx = ev.x - j.x;
          const dy = ev.y - j.y;
          if (Math.sqrt(dx * dx + dy * dy) < 80) {
            j.state = 'fist_shake';
            j.stateTimer = 1;
            break;
          }
        }
      }
    }

    // State machine
    switch (j.state) {
      case 'walking': {
        // Move toward nearest poop
        let nearestPoop = null;
        let nearestDist = Infinity;
        for (const p of this.poops.values()) {
          const dx = p.x - j.x;
          const dy = p.y - j.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestPoop = p;
          }
        }
        if (nearestPoop) {
          j.targetPoopId = nearestPoop.id;
          const dx = nearestPoop.x - j.x;
          const dy = nearestPoop.y - j.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1) {
            j.x += (dx / dist) * j.speed * dt;
            j.y += (dy / dist) * j.speed * dt;
            j.rotation = Math.atan2(dy, dx);
          }
          if (dist < 15) {
            j.state = 'cleaning';
            j.stateTimer = j.superUntil > now ? 0.5 : 1.5;
          }
        }
        break;
      }

      case 'cleaning': {
        j.stateTimer -= dt;
        if (j.stateTimer <= 0) {
          // Remove the target poop
          if (j.targetPoopId && this.poops.has(j.targetPoopId)) {
            this.poops.delete(j.targetPoopId);
            firestoreDb.deletePoop(j.targetPoopId).catch(e => { /* ignore */ });
            j.poopsCleaned++;
          }
          // Super: AOE clean within 30px
          if (j.superUntil > now) {
            const toDelete = [];
            for (const p of this.poops.values()) {
              const dx = p.x - j.x;
              const dy = p.y - j.y;
              if (Math.sqrt(dx * dx + dy * dy) < 30) {
                toDelete.push(p.id);
              }
            }
            for (const pid of toDelete) {
              this.poops.delete(pid);
              firestoreDb.deletePoop(pid).catch(e => { /* ignore */ });
              j.poopsCleaned++;
            }
          }
          j.state = 'walking';
        }
        break;
      }

      case 'angry': {
        j.speed = 70;
        j.stateTimer -= dt;
        // Move toward nearest poop even when angry
        let nearestPoop2 = null;
        let nearestDist2 = Infinity;
        for (const p of this.poops.values()) {
          const dx = p.x - j.x;
          const dy = p.y - j.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < nearestDist2) {
            nearestDist2 = dist;
            nearestPoop2 = p;
          }
        }
        if (nearestPoop2) {
          const dx = nearestPoop2.x - j.x;
          const dy = nearestPoop2.y - j.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1) {
            j.x += (dx / dist) * j.speed * dt;
            j.y += (dy / dist) * j.speed * dt;
            j.rotation = Math.atan2(dy, dx);
          }
        }
        if (j.stateTimer <= 0) {
          j.state = 'walking';
          j.speed = j.superUntil > now ? 60 : j.baseSpeed;
        }
        break;
      }

      case 'fist_shake': {
        j.stateTimer -= dt;
        if (j.stateTimer <= 0) {
          const shouts = ['HEY!', 'DISGUSTING!', 'NOT AGAIN!', 'I JUST CLEANED THAT!', 'YOU BIRDS ARE THE WORST!'];
          const shout = shouts[Math.floor(Math.random() * shouts.length)];
          this.events.push({ type: 'janitor_shout', text: shout, x: j.x, y: j.y });
          j.state = 'angry';
          j.stateTimer = 3;
        }
        break;
      }

      case 'freakout': {
        j.stateTimer -= dt;
        j.freakoutTimer = (j.freakoutTimer || 0) + dt;
        // Run in small circles: randomize velocity every 0.3s
        if (j.freakoutTimer >= 0.3) {
          j.freakoutTimer = 0;
          const angle = Math.random() * Math.PI * 2;
          j.x += Math.cos(angle) * 15;
          j.y += Math.sin(angle) * 15;
          j.rotation = angle;
        }
        if (j.stateTimer <= 0) {
          j.state = 'walking';
          j.speed = j.superUntil > now ? 60 : j.baseSpeed;
        }
        break;
      }

      case 'super': {
        // Super acts like walking but faster with AOE
        j.state = 'walking';
        break;
      }
    }

    // Keep in bounds
    j.x = Math.max(20, Math.min(world.WORLD_WIDTH - 20, j.x));
    j.y = Math.max(20, Math.min(world.WORLD_HEIGHT - 20, j.y));
  }

  _spawnJanitor(now) {
    const roads = world.ROADS;
    const road = roads[Math.floor(Math.random() * roads.length)];
    const x = road.x + Math.random() * road.w;
    const y = road.y + Math.random() * road.h;
    const baseSpeed = 40 + this.janitorBaseSpeedBonus;

    this.janitor = {
      x, y,
      state: 'walking',
      stateTimer: 0,
      speed: Math.min(80, baseSpeed),
      baseSpeed: Math.min(80, baseSpeed),
      poopsCleaned: 0,
      poopedOnCount: 0,
      superUntil: 0,
      targetPoopId: null,
      rotation: 0,
      freakoutTimer: 0,
    };

    this.events.push({ type: 'janitor_spawn', x, y });
    console.log('[GameEngine] Janitor spawned at', Math.round(x), Math.round(y));
  }

  // ============================================================
  // MOVING CARS
  // ============================================================
  _updateMovingCars(dt, now) {
    for (const car of this.movingCars) {
      if (car.direction === 'h') {
        const dir = car.endX > car.startX ? 1 : -1;
        car.x += dir * car.speed * dt;
        // Loop: teleport back
        if (dir > 0 && car.x > world.WORLD_WIDTH + 50) {
          car.x = -50;
        } else if (dir < 0 && car.x < -50) {
          car.x = world.WORLD_WIDTH + 50;
        }
      } else {
        const dir = car.endY > car.startY ? 1 : -1;
        car.y += dir * car.speed * dt;
        if (dir > 0 && car.y > world.WORLD_HEIGHT + 50) {
          car.y = -50;
        } else if (dir < 0 && car.y < -50) {
          car.y = world.WORLD_HEIGHT + 50;
        }
      }

      // Honk when bird is nearby on road
      if (car.honkCooldown > 0) {
        car.honkCooldown -= dt;
      } else {
        for (const bird of this.birds.values()) {
          const dx = bird.x - car.x;
          const dy = bird.y - car.y;
          if (Math.sqrt(dx * dx + dy * dy) < 60) {
            car.honkCooldown = 4; // 4 second cooldown
            this.events.push({ type: 'honk', x: car.x, y: car.y });
            break;
          }
        }
      }
    }
  }

  // ============================================================
  // POWER-UPS
  // ============================================================
  _updatePowerUps(dt, now) {
    // Spawn power-ups
    if (this.powerUps.size < 3 && now >= this.powerUpSpawnTimer) {
      this._spawnPowerUp(now);
      this.powerUpSpawnTimer = now + this._randomRange(30000, 45000);
    }

    // Check pickup: bird within 30px
    for (const [puId, pu] of this.powerUps) {
      for (const bird of this.birds.values()) {
        const dx = bird.x - pu.x;
        const dy = bird.y - pu.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          // Pickup!
          this._applyPowerUp(bird, pu, now);
          this.powerUps.delete(puId);
          this.events.push({
            type: 'powerup',
            birdId: bird.id,
            powerUpType: pu.type,
            x: pu.x, y: pu.y,
          });
          break;
        }
      }
    }

    // Expire power-ups on birds
    for (const bird of this.birds.values()) {
      if (bird.powerUp && now >= bird.powerUp.expiresAt) {
        bird.powerUp = null;
        bird.megaPoopReady = false;
      }
    }
  }

  _spawnPowerUp(now) {
    const types = world.POWERUP_TYPES;
    const type = types[Math.floor(Math.random() * types.length)];
    const id = 'pu_' + uid();
    const pu = {
      id,
      type,
      x: 100 + Math.random() * (world.WORLD_WIDTH - 200),
      y: 100 + Math.random() * (world.WORLD_HEIGHT - 200),
      spawnedAt: now,
    };
    this.powerUps.set(id, pu);
  }

  _applyPowerUp(bird, pu, now) {
    if (pu.type === 'hot_sauce') {
      bird.powerUp = { type: 'hot_sauce', expiresAt: now + 10000 };
    } else if (pu.type === 'speed_feather') {
      bird.powerUp = { type: 'speed_feather', expiresAt: now + 15000 };
    } else if (pu.type === 'ghost_feather') {
      bird.powerUp = { type: 'ghost_feather', expiresAt: now + 10000 };
    } else if (pu.type === 'mega_poop') {
      bird.powerUp = { type: 'mega_poop', expiresAt: now + 30000 }; // 30s to use it
      bird.megaPoopReady = true;
    }
  }

  // ============================================================
  // WORLD EVENTS
  // ============================================================
  _updateWorldEvent(dt, now) {
    // Spawn new event
    if (!this.worldEvent && now >= this.worldEventTimer) {
      this._startWorldEvent(now);
    }

    if (!this.worldEvent) return;

    // Check if event expired
    if (now >= this.worldEvent.endsAt) {
      this._endWorldEvent(now);
      return;
    }

    // Hawk-specific update
    if (this.worldEvent.type === 'hawk') {
      this._updateHawk(dt, now);
    }

    // Parade-specific update
    if (this.worldEvent.type === 'parade') {
      this._updateParade(dt, now);
    }
  }

  _startWorldEvent(now) {
    const types = ['breadcrumbs', 'wedding', 'hawk', 'parade'];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === 'breadcrumbs') {
      this._startBreadcrumbFrenzy(now);
    } else if (type === 'wedding') {
      this._startWedding(now);
    } else if (type === 'hawk') {
      this._startHawk(now);
    } else if (type === 'parade') {
      this._startParade(now);
    }

    console.log(`[GameEngine] World event started: ${type}`);
  }

  _startBreadcrumbFrenzy(now) {
    const loc = world.EVENT_LOCATIONS.breadcrumbs;
    this.worldEvent = {
      type: 'breadcrumbs',
      endsAt: now + 30000,
      startedAt: now,
      x: loc.x,
      y: loc.y,
    };

    // Spawn old lady NPC
    const oldLady = {
      id: 'evt_oldlady',
      type: 'old_lady',
      x: loc.x, y: loc.y,
      targetX: loc.x, targetY: loc.y,
      speed: 0,
      state: 'standing',
      stateTimer: 0,
      poopedOn: 0,
      hasFood: true,
    };
    this.worldEventNPCs.set(oldLady.id, oldLady);

    // Spawn 30 breadcrumbs around her
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 100;
      const food = {
        id: 'evt_bread_' + i,
        x: loc.x + Math.cos(angle) * dist,
        y: loc.y + Math.sin(angle) * dist,
        type: 'bread',
        value: 25,
        respawnAt: null,
        active: true,
        isEventFood: true,
      };
      this.worldEventFoods.set(food.id, food);
    }

    this.events.push({ type: 'event_start', eventType: 'breadcrumbs', x: loc.x, y: loc.y, duration: 30000 });
  }

  _startWedding(now) {
    const loc = world.EVENT_LOCATIONS.wedding;
    this.worldEvent = {
      type: 'wedding',
      endsAt: now + 45000,
      startedAt: now,
      x: loc.x,
      y: loc.y,
    };

    // Spawn wedding party (6-8 NPCs)
    const count = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 30 + Math.random() * 40;
      const isBride = (i === 0);
      const npc = {
        id: 'evt_wedding_' + i,
        type: isBride ? 'bride' : 'wedding_guest',
        x: loc.x + Math.cos(angle) * dist,
        y: loc.y + Math.sin(angle) * dist,
        targetX: loc.x + Math.cos(angle) * dist,
        targetY: loc.y + Math.sin(angle) * dist,
        speed: 0,
        state: 'standing',
        stateTimer: 0,
        poopedOn: 0,
        hasFood: false,
        isBride,
      };
      this.worldEventNPCs.set(npc.id, npc);
    }

    // Wedding cake food item
    const cake = {
      id: 'evt_cake',
      x: loc.x,
      y: loc.y + 15,
      type: 'cake',
      value: 200,
      respawnAt: null,
      active: true,
      isEventFood: true,
    };
    this.worldEventFoods.set(cake.id, cake);

    this.events.push({ type: 'event_start', eventType: 'wedding', x: loc.x, y: loc.y, duration: 45000 });
  }

  _startHawk(now) {
    // Hawk starts from a random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * world.WORLD_WIDTH; y = 0; }
    else if (edge === 1) { x = world.WORLD_WIDTH; y = Math.random() * world.WORLD_HEIGHT; }
    else if (edge === 2) { x = Math.random() * world.WORLD_WIDTH; y = world.WORLD_HEIGHT; }
    else { x = 0; y = Math.random() * world.WORLD_HEIGHT; }

    this.worldEvent = {
      type: 'hawk',
      endsAt: now + 20000,
      startedAt: now,
      x: x,
      y: y,
      hawk: {
        x, y,
        speed: 400,
        rotation: 0,
        targetX: world.WORLD_WIDTH / 2,
        targetY: world.WORLD_HEIGHT / 2,
        sweepAngle: 0,
        lastScreech: 0,
      },
    };

    this.events.push({ type: 'event_start', eventType: 'hawk', x, y, duration: 20000 });
  }

  _startParade(now) {
    const loc = world.EVENT_LOCATIONS.parade;
    this.worldEvent = {
      type: 'parade',
      endsAt: now + 40000,
      startedAt: now,
      x: loc.startX,
      y: loc.startY,
    };

    // Spawn 30 parade pigeons at left edge of horizontal road
    for (let i = 0; i < 30; i++) {
      const npc = {
        id: 'evt_parade_' + i,
        type: 'parade_pigeon',
        x: loc.startX + (i % 6) * 30,
        y: loc.startY + Math.floor(i / 6) * 20 - 20,
        targetX: loc.endX,
        targetY: loc.startY + Math.floor(i / 6) * 20 - 20,
        speed: 70 + Math.random() * 10,
        state: 'marching',
        stateTimer: 0,
        poopedOn: 0,
        hasFood: false,
      };
      this.worldEventNPCs.set(npc.id, npc);
    }

    this.events.push({ type: 'event_start', eventType: 'parade', x: loc.startX, y: loc.startY, duration: 40000 });
  }

  _updateHawk(dt, now) {
    const hawk = this.worldEvent.hawk;
    if (!hawk) return;

    // Check decoys first - hawk targets decoys with priority
    for (const d of this.decoys.values()) {
      const dx = d.x - hawk.x;
      const dy = d.y - hawk.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 300) {
        // Chase decoy
        if (dist > 1) {
          hawk.x += (dx / dist) * hawk.speed * dt;
          hawk.y += (dy / dist) * hawk.speed * dt;
          hawk.rotation = Math.atan2(dy, dx);
        }
        if (dist < 30) {
          this.decoys.delete(d.id);
        }
        hawk.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, hawk.x));
        hawk.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, hawk.y));
        this.worldEvent.x = hawk.x;
        this.worldEvent.y = hawk.y;
        return; // Skip normal targeting
      }
    }

    // Sweeping pattern: target a nearby bird, or sweep
    let targetBird = null;
    let targetDist = Infinity;
    for (const bird of this.birds.values()) {
      // Nest: hawk ignores nesting birds
      if (bird.inNest) continue;
      // Ghost feather protects from hawk
      if (bird.powerUp && bird.powerUp.type === 'ghost_feather' && now < bird.powerUp.expiresAt) continue;
      // Shadow cloak: hawk skips cloaked birds
      if (bird.cloakedUntil > now) continue;
      // Check if bird is near cover (building or tree within 40px)
      if (this._birdNearCover(bird)) continue;

      const dx = bird.x - hawk.x;
      const dy = bird.y - hawk.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < targetDist) {
        targetDist = dist;
        targetBird = bird;
      }
    }

    if (targetBird) {
      // Fly towards target bird
      const dx = targetBird.x - hawk.x;
      const dy = targetBird.y - hawk.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        hawk.x += (dx / dist) * hawk.speed * dt;
        hawk.y += (dy / dist) * hawk.speed * dt;
        hawk.rotation = Math.atan2(dy, dx);
      }

      // Catch check (within 30px)
      if (dist < 30) {
        targetBird.food = Math.max(0, Math.floor(targetBird.food * 0.5));
        targetBird.stunnedUntil = now + 2000;
        this.events.push({
          type: 'hawk_attack',
          birdId: targetBird.id,
          x: hawk.x, y: hawk.y,
        });
        this.events.push({
          type: 'stunned',
          birdId: targetBird.id,
          duration: 2000,
        });
      }
    } else {
      // Sweep pattern (no exposed birds)
      hawk.sweepAngle += dt * 0.5;
      const cx = world.WORLD_WIDTH / 2 + Math.cos(hawk.sweepAngle) * 600;
      const cy = world.WORLD_HEIGHT / 2 + Math.sin(hawk.sweepAngle * 0.7) * 400;
      const dx = cx - hawk.x;
      const dy = cy - hawk.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        hawk.x += (dx / dist) * hawk.speed * 0.5 * dt;
        hawk.y += (dy / dist) * hawk.speed * 0.5 * dt;
        hawk.rotation = Math.atan2(dy, dx);
      }
    }

    // Screech periodically
    if (!hawk.lastScreech || now - hawk.lastScreech > 5000) {
      hawk.lastScreech = now;
      this.events.push({ type: 'hawk_screech', x: hawk.x, y: hawk.y });
    }

    // Keep in bounds
    hawk.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, hawk.x));
    hawk.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, hawk.y));

    // Update worldEvent position for minimap tracking
    this.worldEvent.x = hawk.x;
    this.worldEvent.y = hawk.y;
  }

  _birdNearCover(bird) {
    // Check buildings
    for (const b of world.BUILDINGS) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const dx = bird.x - cx;
      const dy = bird.y - cy;
      // Check if within 40px of building edge
      if (bird.x >= b.x - 40 && bird.x <= b.x + b.w + 40 &&
          bird.y >= b.y - 40 && bird.y <= b.y + b.h + 40) {
        return true;
      }
    }
    // Check trees
    for (const t of world.TREES) {
      const dx = bird.x - t.x;
      const dy = bird.y - t.y;
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        return true;
      }
    }
    return false;
  }

  _updateParade(dt, now) {
    // Move parade pigeons and track center
    let sumX = 0, count = 0;
    for (const [id, npc] of this.worldEventNPCs) {
      if (npc.type !== 'parade_pigeon') continue;
      const dx = npc.targetX - npc.x;
      const dist = Math.abs(dx);
      if (dist > 2) {
        npc.x += (dx > 0 ? 1 : -1) * npc.speed * dt;
      }
      sumX += npc.x;
      count++;
    }
    if (count > 0 && this.worldEvent) {
      this.worldEvent.x = sumX / count;
    }
  }

  _updateWorldEventNPCs(dt, now) {
    // Only update event NPCs that are walkers (wedding guests sway, etc.)
    // Most event NPCs are stationary or handled by specific update methods
  }

  _endWorldEvent(now) {
    const type = this.worldEvent.type;
    this.events.push({ type: 'event_end', eventType: type });

    // Clean up event NPCs and foods
    this.worldEventNPCs.clear();
    this.worldEventFoods.clear();

    this.worldEvent = null;
    this.worldEventTimer = now + this._randomRange(120000, 300000);
    console.log(`[GameEngine] World event ended: ${type}`);
  }

  // ============================================================
  // BIRD UPDATE (modified)
  // ============================================================
  _updateBird(bird, dt, now) {
    // Check nest — bird is safe, skip everything. Auto-wake on any input.
    if (bird.inNest) {
      bird.vx = 0;
      bird.vy = 0;
      const inp = bird.input;
      if (inp.w || inp.a || inp.s || inp.d || inp.up || inp.down || inp.left || inp.right || inp.space || inp.e || inp.joyX || inp.joyY) {
        bird.inNest = false;
        this.events.push({ type: 'nest_exit', birdId: bird.id, name: bird.name });
      } else {
        return; // Stay in nest, skip all updates
      }
    }

    // Check stun
    if (bird.stunnedUntil > now) {
      // Stunned: can't move, velocity decays
      bird.vx *= 0.9;
      bird.vy *= 0.9;
      bird.wingPhase += dt * 2;
      return; // Skip all input processing
    }

    // Dive bomb check
    if (bird.diveBombing && now >= bird.diveBombUntil) {
      bird.diveBombing = false;
      // Check for NPC hits along path
      for (const npc of this.npcs.values()) {
        const dx = npc.x - bird.x;
        const dy = npc.y - bird.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
          npc.poopedOn++;
          npc.state = 'fleeing';
          npc.stateTimer = 3;
          const angle = Math.random() * Math.PI * 2;
          npc.targetX = npc.x + Math.cos(angle) * 200;
          npc.targetY = npc.y + Math.sin(angle) * 200;
          npc.speed = 80;
          bird.xp += 15;
          bird.totalHits++;
        }
      }
    }

    const typeInfo = world.BIRD_TYPES[bird.type] || world.BIRD_TYPES.pigeon;
    let maxSpeed = typeInfo.speed;
    let poopCooldown = typeInfo.poopCooldown;

    // Apply power-up effects
    if (bird.powerUp && now < bird.powerUp.expiresAt) {
      if (bird.powerUp.type === 'speed_feather') {
        maxSpeed *= 2;
      }
      if (bird.powerUp.type === 'hot_sauce') {
        poopCooldown = 100;
      }
    }

    // Speed Burst skill effect
    if (bird.speedBurstUntil > now) {
      maxSpeed *= 2;
    }

    // Black Market: Speed Serum
    if (bird.bmSpeedUntil > now) {
      maxSpeed *= 1.6;
    }

    // Hailstorm: ice chunks slow birds
    if (bird.hailSlowUntil > now) {
      maxSpeed *= 0.5;
    }

    // Egg carrying: precious cargo slows you down
    if (bird.carryingEggId) {
      maxSpeed *= 0.8;
    }

    // V Formation speed buff: 3+ flock mates within 200px with similar velocity
    if (bird.flockId) {
      let flockMatesNearby = 0;
      let flockMatesWithSimilarVel = 0;
      const birdSpeed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
      for (const otherBird of this.birds.values()) {
        if (otherBird.id === bird.id || otherBird.flockId !== bird.flockId) continue;
        const dx = otherBird.x - bird.x;
        const dy = otherBird.y - bird.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          flockMatesNearby++;
          // Check velocity direction similarity
          const otherSpeed = Math.sqrt(otherBird.vx * otherBird.vx + otherBird.vy * otherBird.vy);
          if (birdSpeed > 10 && otherSpeed > 10) {
            const dot = (bird.vx / birdSpeed) * (otherBird.vx / otherSpeed) + (bird.vy / birdSpeed) * (otherBird.vy / otherSpeed);
            if (dot > 0.6) flockMatesWithSimilarVel++;
          }
        }
      }
      if (flockMatesWithSimilarVel >= 2) {
        maxSpeed *= 1.15; // 15% speed buff
      }
    }

    const accel = 800;
    const drag = 0.92;

    // Apply input — supports analog joystick (joyX/joyY) or digital WASD
    let ax = 0, ay = 0;
    if (bird.input.joyX !== undefined && bird.input.joyY !== undefined) {
      // Analog joystick from mobile: values are -1 to 1, reduced sensitivity
      ax = bird.input.joyX;
      ay = bird.input.joyY;
      const mag = Math.sqrt(ax * ax + ay * ay);
      if (mag > 1) { ax /= mag; ay /= mag; }
      ax *= accel * 0.55;
      ay *= accel * 0.55;
    } else {
      if (bird.input.w || bird.input.up) ay -= 1;
      if (bird.input.s || bird.input.down) ay += 1;
      if (bird.input.a || bird.input.left) ax -= 1;
      if (bird.input.d || bird.input.right) ax += 1;
      // Normalize diagonal for digital input
      const inputLen = Math.sqrt(ax * ax + ay * ay);
      if (inputLen > 0) {
        ax = (ax / inputLen) * accel;
        ay = (ay / inputLen) * accel;
      }
    }

    bird.vx = (bird.vx + ax * dt) * drag;
    bird.vy = (bird.vy + ay * dt) * drag;

    // Clamp speed
    const speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
    if (speed > maxSpeed) {
      bird.vx = (bird.vx / speed) * maxSpeed;
      bird.vy = (bird.vy / speed) * maxSpeed;
    }

    // Wind pushes birds — applied after player-speed clamp so it's additive drift
    if (this.weather && this.weather.windSpeed > 0) {
      bird.vx += Math.cos(this.weather.windAngle) * this.weather.windSpeed * dt;
      bird.vy += Math.sin(this.weather.windAngle) * this.weather.windSpeed * dt;
    }

    // Update position
    bird.x += bird.vx * dt;
    bird.y += bird.vy * dt;

    // World bounds
    bird.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, bird.x));
    bird.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, bird.y));

    // Rotation
    if (speed > 5) {
      bird.rotation = Math.atan2(bird.vy, bird.vx);
    }

    // Wing animation
    bird.wingPhase += dt * (5 + speed * 0.03);

    // === POOP ===
    if (!bird.carryingEggId && bird.input.space && now - bird.lastPoop > poopCooldown) {
      bird.lastPoop = now;
      const poopId = 'p_' + uid();
      const poop = {
        id: poopId,
        birdId: bird.id,
        x: bird.x + (Math.random() - 0.5) * 6,
        y: bird.y + (Math.random() - 0.5) * 6,
        hitTarget: null,
        time: now,
        isNew: true,
      };

      // Check if mega poop (power-up OR black market mega poop)
      const isMegaPoop = bird.megaPoopReady || bird.bmMegaPoops > 0;
      if (bird.megaPoopReady) {
        bird.megaPoopReady = false;
        bird.powerUp = null; // Consumed
      } else if (bird.bmMegaPoops > 0) {
        bird.bmMegaPoops--;
      }

      // Check what it hit
      const hit = this._checkPoopHit(poop, isMegaPoop);
      poop.hitTarget = hit.target;

      this.poops.set(poopId, poop);
      bird.totalPoops++;

      // XP for pooping
      let xpGain = 2;
      if (hit.target === 'npc') {
        xpGain = 15;
        bird.totalHits++;
        if (hit.npc) {
          hit.npc.poopedOn++;
          hit.npc.state = 'fleeing';
          hit.npc.stateTimer = 3;
          // Random flee direction
          const angle = Math.random() * Math.PI * 2;
          hit.npc.targetX = hit.npc.x + Math.cos(angle) * 200;
          hit.npc.targetY = hit.npc.y + Math.sin(angle) * 200;
          hit.npc.speed = 80;
          if (hit.npc.poopedOn >= 3) {
            bird.humansCried++;
            xpGain = 30;
            this.events.push({ type: 'cry', npcId: hit.npc.id, x: hit.npc.x, y: hit.npc.y });
          }
        }
      } else if (hit.target === 'car') {
        xpGain = 10;
      } else if (hit.target === 'moving_car') {
        xpGain = 25;
      } else if (hit.target === 'statue') {
        xpGain = 20;
      } else if (hit.target === 'laundry') {
        xpGain = 25;
      } else if (hit.target === 'bride') {
        xpGain = 100;
      } else if (hit.target === 'parade_pigeon') {
        xpGain = 5;
      } else if (hit.target === 'event_npc') {
        xpGain = 15;
      } else if (hit.target === 'janitor') {
        xpGain = 20;
        if (this.janitor) {
          this.janitor.poopedOnCount++;
          this.janitor.state = 'freakout';
          this.janitor.stateTimer = 3;
          this.janitor.freakoutTimer = 0;
          this.events.push({ type: 'janitor_hit', birdId: bird.id, x: this.janitor.x, y: this.janitor.y });
          if (this.janitor.poopedOnCount >= 3) {
            this.events.push({ type: 'janitor_ragequit', x: this.janitor.x, y: this.janitor.y });
            this.janitorBaseSpeedBonus = Math.min(40, this.janitorBaseSpeedBonus + 10);
            this.janitorRageQuitUntil = now + 30000;
            this.janitor = null;
          }
        }
      } else if (hit.target === 'raccoon' && hit.raccoon) {
        xpGain = 35; // Nice reward for stopping a thief
        const r = hit.raccoon;
        // Drop carried food at raccoon's current position
        if (r.state === 'carrying' && r.carriedFoodType) {
          const droppedId = 'food_raccoon_drop_' + uid();
          const droppedFood = {
            id: droppedId,
            x: r.x + (Math.random() - 0.5) * 20,
            y: r.y + (Math.random() - 0.5) * 20,
            type: r.carriedFoodType,
            value: 15 + Math.floor(Math.random() * 10), // bonus loot!
            respawnAt: null,
            active: true,
          };
          this.foods.set(droppedId, droppedFood);
          // Clean up after 20 seconds
          setTimeout(() => { this.foods.delete(droppedId); }, 20000);
        }
        // Raccoon flees fast
        r.state = 'fleeing';
        r.fleeSpeed = 220;
        // Pick flee direction (toward nearest map edge)
        const fleeToEdge = this._raccoonEdgeTarget(r.x, r.y);
        r.targetX = fleeToEdge.x;
        r.targetY = fleeToEdge.y;
        this.events.push({ type: 'raccoon_flee', raccoonId: r.id, x: r.x, y: r.y, birdId: bird.id, birdName: bird.name });
        bird.coins += 10; // bonus coins for stopping a thief
      } else if (hit.target === 'godfather' && this.godfatherRaccoon) {
        const gf = this.godfatherRaccoon;
        const dmg = isMegaPoop ? 36 : 12;
        gf.hp -= dmg;
        xpGain = isMegaPoop ? 55 : 22;
        bird.coins += 4;
        const prevDmg = gf.damageByBird.get(bird.id) || 0;
        gf.damageByBird.set(bird.id, prevDmg + dmg);
        this.events.push({ type: 'godfather_hit', birdId: bird.id, x: gf.x, y: gf.y, hp: Math.ceil(gf.hp), maxHp: gf.maxHp });
      } else if (hit.target === 'eagle_overlord' && this.boss && this.boss.type === 'EAGLE_OVERLORD') {
        // Poop hits the Eagle Overlord — deal damage, track contribution
        const dmg = isMegaPoop ? 24 : 8;
        this.boss.hp -= dmg;
        xpGain = isMegaPoop ? 45 : 18;
        bird.coins += 4;
        const prevDmg = this.boss.damageByBird.get(bird.id) || 0;
        this.boss.damageByBird.set(bird.id, prevDmg + dmg);
        this.events.push({ type: 'eagle_hit', birdId: bird.id, x: this.boss.x, y: this.boss.y, hp: Math.ceil(this.boss.hp), maxHp: this.boss.maxHp });
        // Hitting the eagle while it carries someone rescues the captive
        if (this.boss.snatched && this.boss.snatched.birdId !== bird.id) {
          const captive = this.birds.get(this.boss.snatched.birdId);
          if (captive) {
            captive.stunnedUntil = 0;
            this.events.push({ type: 'eagle_rescue', birdId: bird.id, rescuedId: this.boss.snatched.birdId, x: this.boss.x, y: this.boss.y });
          }
          this.boss.snatched = null;
        }
      } else if (hit.target === 'cop' && hit.cop) {
        // Poop hit a cop bird! Stun it — daring escape move
        const cop = hit.cop;
        const stunDuration = cop.type === 'swat' ? 3000 : 5000; // SWAT shrug it off faster
        cop.state = 'stunned';
        cop.stunnedUntil = now + stunDuration;
        xpGain = cop.type === 'swat' ? 80 : 50;
        bird.coins += cop.type === 'swat' ? 25 : 15;
        this.events.push({ type: 'cop_pooped', birdId: bird.id, birdName: bird.name, copType: cop.type, x: cop.x, y: cop.y });
      } else if (hit.target === 'territory_predator' && hit.predator) {
        // Poop hit a territory predator (hawk or cat in their home zone)
        const { predKey, predator } = hit;
        const dmg = isMegaPoop ? 45 : 15;
        predator.hp -= dmg;
        xpGain = isMegaPoop ? 60 : 25;
        bird.coins += 5;
        this.events.push({ type: 'predator_poop_hit', predType: predKey, birdId: bird.id, x: predator.x, y: predator.y, hp: Math.max(0, Math.ceil(predator.hp)), maxHp: predator.maxHp, dmg });
        if (predator.hp <= 0 && predator.state !== 'dead') {
          predator.state = 'dead';
          predator.respawnTimer = now + 180000; // 3 min cooldown
          predator.targetBirdId = null;
          // Big reward for the killing shot
          bird.xp += 300;
          bird.coins += 200;
          const newLevel = world.getLevelFromXP(bird.xp);
          if (newLevel !== bird.level) {
            bird.level = newLevel;
            bird.type = world.getBirdTypeForLevel(newLevel);
            this.events.push({ type: 'evolve', birdId: bird.id, name: bird.name, birdType: bird.type });
          }
          this.events.push({ type: 'predator_defeated', predType: predKey, birdId: bird.id, birdName: bird.name, x: predator.x, y: predator.y });
          // Clear all warnings and hit counts for this predator
          for (const warnings of this.predatorWarnings.values()) warnings[predKey] = null;
          for (const counts of this.predatorHitCounts.values()) counts[predKey] = 0;
        }
      } else if (hit.target === 'arena_fighter' && hit.fighter) {
        // Arena PvP damage! One hit = one arena HP lost
        const fighter = hit.fighter;
        fighter.arenaHp--;
        const shooterFighter = this.arena.fighters.get(bird.id);
        if (shooterFighter) shooterFighter.damageDealt++;
        xpGain = 40;
        this.events.push({
          type: 'arena_damage',
          attackerId: bird.id, attackerName: bird.name,
          targetId: hit.fighterId, targetName: fighter.name,
          hp: fighter.arenaHp, maxHp: fighter.maxArenaHp,
          x: poop.x, y: poop.y,
        });
        if (fighter.arenaHp <= 0) {
          fighter.eliminated = true;
          // Break combo for the eliminated fighter
          const eliminatedBird = this.birds.get(hit.fighterId);
          if (eliminatedBird) eliminatedBird.comboCount = 0;
          this.events.push({
            type: 'arena_eliminated',
            birdId: hit.fighterId, birdName: fighter.name,
            killedById: bird.id, killedByName: bird.name,
          });
        }
      } else if (hit.target === 'hit_target' && hit.hitContract) {
        // Bounty hunting — player hit a bird with an active hit contract
        const hitContract = hit.hitContract;
        const currentCount = hitContract.hitProgress.get(bird.id) || 0;
        const newCount = currentCount + 1;
        hitContract.hitProgress.set(bird.id, newCount);
        xpGain = 55;
        bird.coins += 20;
        this.events.push({
          type: 'hit_progress',
          hitmanId: bird.id, hitmanName: bird.name,
          targetId: hitContract.targetId, targetName: hitContract.targetName,
          count: newCount, needed: hitContract.hitsNeeded,
          x: poop.x, y: poop.y,
        });
        if (newCount >= hitContract.hitsNeeded) {
          // Contract fulfilled! Big payout
          bird.coins += hitContract.reward;
          xpGain += 120; // let xpGain flow through multipliers (combo, lucky charm, etc.)
          bird.mafiaRep = (bird.mafiaRep || 0) + 1;
          // Target loses 15% of their coins as "damage"
          const targetBird = this.birds.get(hitContract.targetId);
          const taxAmount = targetBird ? Math.min(Math.floor(targetBird.coins * 0.15), 120) : 0;
          if (targetBird) {
            targetBird.coins = Math.max(0, targetBird.coins - taxAmount);
            targetBird.comboCount = 0; // combo wiped — you got hit
          }
          this.activeHits.delete(hitContract.targetId);
          this.events.push({
            type: 'hit_complete',
            hitmanId: bird.id, hitmanName: bird.name,
            targetId: hitContract.targetId, targetName: hitContract.targetName,
            reward: hitContract.reward + 120, // coins + xp indication
            coinReward: hitContract.reward,
            taxAmount,
          });
        }
      }

      // Mega poop hits multiple targets
      if (isMegaPoop && hit.allHits) {
        for (const extraHit of hit.allHits) {
          if (extraHit.target === 'npc' && extraHit.npc) {
            extraHit.npc.poopedOn++;
            extraHit.npc.state = 'fleeing';
            extraHit.npc.stateTimer = 3;
            const angle = Math.random() * Math.PI * 2;
            extraHit.npc.targetX = extraHit.npc.x + Math.cos(angle) * 200;
            extraHit.npc.targetY = extraHit.npc.y + Math.sin(angle) * 200;
            extraHit.npc.speed = 80;
            xpGain += 15;
            bird.totalHits++;
          }
        }
      }

      // Flock XP bonus: 2+ flock mates within 300px -> 1.2x
      if (bird.flockId) {
        let nearbyFlockMates = 0;
        for (const otherBird of this.birds.values()) {
          if (otherBird.id === bird.id || otherBird.flockId !== bird.flockId) continue;
          const fdx = otherBird.x - bird.x;
          const fdy = otherBird.y - bird.y;
          if (Math.sqrt(fdx * fdx + fdy * fdy) < 300) nearbyFlockMates++;
        }
        if (nearbyFlockMates >= 2) {
          xpGain = Math.floor(xpGain * 1.2);
        }
      }

      // === CHAOS & HEAT & AREA CHAOS ===
      this._addChaos(hit.target === 'npc' || hit.target === 'event_npc' ? 3 : hit.target === 'car' || hit.target === 'moving_car' ? 2 : hit.target === 'bride' ? 5 : 1);
      this._addHeat(bird.id, hit.target === 'npc' || hit.target === 'event_npc' ? 3 : hit.target === 'car' || hit.target === 'moving_car' ? 2 : 1);
      this._addAreaChaos(poop.x, poop.y, 1);
      if (hit.npc && hit.npc.poopedOn >= 3) {
        this._addChaos(5); // cry bonus
      }

      // Wanted bird XP bonus
      if (this.wantedBirdId === bird.id) {
        xpGain = Math.floor(xpGain * 1.5);
      }

      // Coin earning from poop hits
      let coinGain = 0;
      if (hit.target === 'npc' || hit.target === 'event_npc') coinGain = 2;
      else if (hit.target === 'car') coinGain = 1;
      else if (hit.target === 'moving_car') coinGain = 3;
      else if (hit.target === 'statue') coinGain = 2;
      else if (hit.target === 'laundry') coinGain = 3;
      else if (hit.target === 'bride') coinGain = 10;
      else if (hit.target === 'janitor') coinGain = 3;
      if (hit.npc && hit.npc.poopedOn >= 3) coinGain += 5; // made cry bonus

      // Territory home turf bonus: +30% XP and coins when pooping in your own zone
      if (xpGain > 2) { // only for actual hits, not bare ground poop
        const poopZone = this._getZoneForPoint(poop.x, poop.y);
        if (poopZone) {
          const territory = this.territories.get(poopZone.id);
          if (territory && territory.ownerTeamId && territory.captureProgress >= 0.5) {
            const myTeamId = bird.flockId || ('solo_' + bird.id);
            if (territory.ownerTeamId === myTeamId) {
              xpGain = Math.floor(xpGain * 1.3);
              coinGain = Math.max(1, Math.floor(coinGain * 1.3));
            }
          }
        }
      }

      bird.coins += coinGain;

      // === COMBO STREAK — chain hits within 8s for escalating XP ===
      if (hit.target && hit.target !== 'none') {
        const comboActive = now < bird.comboExpiresAt;
        bird.comboCount = comboActive ? bird.comboCount + 1 : 1;
        bird.comboExpiresAt = now + 8000;
        const combo = bird.comboCount;
        // XP bonus: flat multiplier applied to base xpGain
        let comboMult = 1.0;
        if (combo >= 15) comboMult = 4.0;
        else if (combo >= 10) comboMult = 3.0;
        else if (combo >= 7) comboMult = 2.5;
        else if (combo >= 5) comboMult = 2.0;
        else if (combo >= 3) comboMult = 1.5;
        if (comboMult > 1.0) xpGain = Math.floor(xpGain * comboMult);
        // City-wide shoutout at milestones
        if (combo === 5 || combo === 10 || combo === 15 || combo === 20) {
          this.events.push({ type: 'combo_milestone', birdId: bird.id, birdName: bird.name, combo });
        }
      }

      // Black Market: Lucky Charm doubles all XP
      if (bird.bmDoubleXpUntil > now) xpGain *= 2;
      // Radio Tower: Signal Boost gives 1.5x XP to ALL birds
      if (this.radioTower.signalBoostUntil > now) xpGain = Math.floor(xpGain * 1.5);
      bird.xp += xpGain;

      // Mission progress: poop hits
      if (bird.activeMission) {
        const mission = bird.activeMission;
        if (hit.target === 'npc' || hit.target === 'event_npc') {
          if (mission.missionId === 'poop_spree' || mission.missionId === 'flock_poop') {
            mission.progress++;
          }
        }
        if (hit.target === 'moving_car' && mission.missionId === 'highway_havoc') {
          mission.progress++;
        }
        if (hit.target === 'statue' && mission.missionId === 'statue_sniper') {
          mission.progress++;
        }
      }

      // Don mission progress: poop hits
      if (bird.donMission) {
        const dj = bird.donMission;
        if (dj.jobId === 'don_hit') {
          dj.progress++;
          this._checkDonMissionComplete(bird, now);
        }
        if (dj.jobId === 'don_cars' && hit.target === 'moving_car') {
          dj.progress++;
          this._checkDonMissionComplete(bird, now);
        }
      }

      // === DAILY CHALLENGE TRACKING (poop-related) ===
      this._trackDailyProgress(bird, 'poop_total', 1);
      if (hit.target === 'npc' || hit.target === 'event_npc' || hit.target === 'janitor') {
        this._trackDailyProgress(bird, 'poop_npc', 1);
      }
      if (hit.target === 'moving_car') {
        this._trackDailyProgress(bird, 'car_hit', 1);
      }
      if (hit.target === 'raccoon') {
        this._trackDailyProgress(bird, 'raccoon_hit', 1);
      }
      if (hit.target === 'cop') {
        this._trackDailyProgress(bird, 'cop_hit', 1);
      }
      if (hit.npc && hit.npc.poopedOn >= 3) {
        this._trackDailyProgress(bird, 'npc_cry', 1);
      }
      // Track combo10 milestone
      if (bird.comboCount === 10) {
        this._trackDailyProgress(bird, 'combo10', 1);
      }

      // === KINGPIN HIT TRACKING — secondary check, doesn't replace primary hit ===
      // Any poop that lands near the kingpin counts as a hit, on top of any other target
      if (this.kingpin && bird.id !== this.kingpin.birdId) {
        const kBird = this.birds.get(this.kingpin.birdId);
        if (kBird && !kBird.inSewer) {
          const kdx = poop.x - kBird.x;
          const kdy = poop.y - kBird.y;
          const kHitRadius = isMegaPoop ? 88 : 34; // (60+28) vs (20+14)
          if (Math.sqrt(kdx * kdx + kdy * kdy) < kHitRadius) {
            this._handleKingpinHit(bird, now);
          }
        }
      }

      // Gang War: check if poop landed near a rival gang member
      if (bird.gangId && !isMegaPoop) {
        const myGang = this.gangs.get(bird.gangId);
        if (myGang && myGang.warWithGangId && now < myGang.warEndsAt) {
          for (const [targetId, targetBird] of this.birds) {
            if (targetId === bird.id) continue;
            if (targetBird.gangId !== myGang.warWithGangId) continue;
            if (targetBird.inSewer) continue;
            const gdx = poop.x - targetBird.x;
            const gdy = poop.y - targetBird.y;
            if (Math.sqrt(gdx * gdx + gdy * gdy) < 34) {
              this._handleGangWarHit(bird, targetBird, now);
              break;
            }
          }
        }
      }

      // Check level up
      const newLevel = world.getLevelFromXP(bird.xp);
      const newType = world.getBirdTypeForLevel(newLevel);
      if (newType !== bird.type) {
        bird.type = newType;
        bird.level = newLevel;
        this.events.push({ type: 'evolve', birdId: bird.id, name: bird.name, birdType: newType });
      }
      bird.level = newLevel;

      this.events.push({
        type: 'poop',
        poopId, birdId: bird.id,
        x: poop.x, y: poop.y,
        hitTarget: hit.target, xp: xpGain,
        isMegaPoop,
        combo: bird.comboCount,
      });

      // Persist
      firestoreDb.savePoop(poopId, bird.id, poop.x, poop.y, hit.target, Math.floor(now / 1000)).catch(e => { /* ignore */ });
    }

    // === STEAL FOOD (includes event foods) ===
    if (bird.input.e && now - bird.lastSteal > 1000) {
      bird.lastSteal = now;
      let closest = null;
      let closestDist = 60; // steal radius
      let fromEventFoods = false;

      // Check regular foods
      for (const food of this.foods.values()) {
        if (!food.active) continue;
        const dx = bird.x - food.x;
        const dy = bird.y - food.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closest = food;
          closestDist = dist;
          fromEventFoods = false;
        }
      }

      // Check event foods
      for (const food of this.worldEventFoods.values()) {
        if (!food.active) continue;
        const dx = bird.x - food.x;
        const dy = bird.y - food.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closest = food;
          closestDist = dist;
          fromEventFoods = true;
        }
      }

      if (closest) {
        closest.active = false;
        if (!fromEventFoods) {
          closest.respawnAt = now + 15000 + Math.random() * 15000; // 15-30s respawn
        } else {
          // Event foods don't respawn, just remove
          this.worldEventFoods.delete(closest.id);
        }
        bird.food += closest.value;
        bird.totalSteals++;
        let stealXP = closest.value;
        // Flock XP bonus
        if (bird.flockId) {
          let nearbyFlockMates = 0;
          for (const otherBird of this.birds.values()) {
            if (otherBird.id === bird.id || otherBird.flockId !== bird.flockId) continue;
            const fdx = otherBird.x - bird.x;
            const fdy = otherBird.y - bird.y;
            if (Math.sqrt(fdx * fdx + fdy * fdy) < 300) nearbyFlockMates++;
          }
          if (nearbyFlockMates >= 2) {
            stealXP = Math.floor(stealXP * 1.2);
          }
        }
        // Wanted bird XP bonus
        if (this.wantedBirdId === bird.id) {
          stealXP = Math.floor(stealXP * 1.5);
        }
        bird.xp += stealXP;
        bird.coins += 2; // coins for stealing
        this._addChaos(2);
        this._addHeat(bird.id, 2);

        // Mission progress: steal food
        if (bird.activeMission && bird.activeMission.missionId === 'food_run') {
          bird.activeMission.progress++;
        }

        this.events.push({
          type: 'steal',
          birdId: bird.id,
          foodId: closest.id,
          foodType: closest.type,
          x: closest.x, y: closest.y,
          value: stealXP,
        });

        // Nearby cafe sitter reacts
        for (const npc of this.npcs.values()) {
          if (npc.type === 'cafe_sitter') {
            const dx = npc.x - closest.x;
            const dy = npc.y - closest.y;
            if (Math.sqrt(dx * dx + dy * dy) < 40) {
              npc.state = 'angry';
              npc.stateTimer = 2;
            }
          }
        }

        // Level check
        const newLevel = world.getLevelFromXP(bird.xp);
        const newType = world.getBirdTypeForLevel(newLevel);
        if (newType !== bird.type) {
          bird.type = newType;
          this.events.push({ type: 'evolve', birdId: bird.id, name: bird.name, birdType: newType });
        }
        bird.level = newLevel;
      }
    }

    // === Auto-pickup power-ups (within 30px, handled in _updatePowerUps) ===

    // === Sewer loot collection (auto-collect when underground and in range) ===
    if (bird.inSewer) {
      for (const loot of this.sewerLoot.values()) {
        if (!loot.available) continue;
        const dx = bird.x - loot.x;
        const dy = bird.y - loot.y;
        if (Math.sqrt(dx * dx + dy * dy) < 38) {
          loot.available = false;
          loot.respawnAt = now + 90000 + Math.random() * 30000; // 90-120s respawn
          bird.coins += loot.value;
          bird.xp += Math.floor(loot.value * 0.5);
          this.events.push({ type: 'sewer_loot', birdId: bird.id, name: bird.name, value: loot.value, x: loot.x, y: loot.y });
          this._trackDailyProgress(bird, 'sewer_loot', 1);
          this._trackDailyProgress(bird, 'coins_earned', loot.value);
        }
      }
    }
  }

  _checkPoopHit(poop, isMegaPoop) {
    const hitRadius = isMegaPoop ? 60 : 20;
    const allHits = [];

    // Check janitor
    if (this.janitor) {
      const jdx = poop.x - this.janitor.x;
      const jdy = poop.y - this.janitor.y;
      if (Math.sqrt(jdx * jdx + jdy * jdy) < 20) {
        return { target: 'janitor' };
      }
    }

    // Check regular NPCs
    for (const npc of this.npcs.values()) {
      const dx = poop.x - npc.x;
      const dy = poop.y - npc.y;
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
        if (!isMegaPoop) {
          return { target: 'npc', npc };
        }
        allHits.push({ target: 'npc', npc });
      }
    }

    // Check chaos event NPCs
    for (const npc of this.chaosEventNPCs.values()) {
      const dx = poop.x - npc.x;
      const dy = poop.y - npc.y;
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
        if (!isMegaPoop) {
          return { target: 'npc', npc };
        }
        allHits.push({ target: 'npc', npc });
      }
    }

    // Check event NPCs
    for (const npc of this.worldEventNPCs.values()) {
      const dx = poop.x - npc.x;
      const dy = poop.y - npc.y;
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
        if (npc.type === 'bride') {
          if (!isMegaPoop) return { target: 'bride', npc };
          allHits.push({ target: 'bride', npc });
        } else if (npc.type === 'parade_pigeon') {
          npc.poopedOn++;
          if (!isMegaPoop) return { target: 'parade_pigeon', npc };
          allHits.push({ target: 'parade_pigeon', npc });
        } else {
          if (!isMegaPoop) return { target: 'event_npc', npc };
          allHits.push({ target: 'event_npc', npc });
        }
      }
    }

    // Check statue
    const statue = world.PARK.statue;
    if (Math.abs(poop.x - statue.x) < hitRadius && Math.abs(poop.y - statue.y) < hitRadius) {
      if (!isMegaPoop) return { target: 'statue' };
      allHits.push({ target: 'statue' });
    }

    // Check parked cars
    for (const car of world.CARS) {
      if (poop.x >= car.x - car.w / 2 - (isMegaPoop ? 40 : 0) && poop.x <= car.x + car.w / 2 + (isMegaPoop ? 40 : 0) &&
          poop.y >= car.y - car.h / 2 - (isMegaPoop ? 40 : 0) && poop.y <= car.y + car.h / 2 + (isMegaPoop ? 40 : 0)) {
        if (!isMegaPoop) return { target: 'car' };
        allHits.push({ target: 'car' });
      }
    }

    // Check moving cars
    for (const car of this.movingCars) {
      const hw = car.w / 2 + (isMegaPoop ? 40 : 0);
      const hh = car.h / 2 + (isMegaPoop ? 40 : 0);
      if (poop.x >= car.x - hw && poop.x <= car.x + hw &&
          poop.y >= car.y - hh && poop.y <= car.y + hh) {
        if (!isMegaPoop) return { target: 'moving_car' };
        allHits.push({ target: 'moving_car' });
      }
    }

    // Check laundry
    for (const l of world.LAUNDRY) {
      const dx = l.x2 - l.x1;
      const dy = l.y2 - l.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len, ny = dx / len;
      const dist = Math.abs((poop.x - l.x1) * nx + (poop.y - l.y1) * ny);
      const proj = ((poop.x - l.x1) * dx + (poop.y - l.y1) * dy) / (len * len);
      if (dist < (isMegaPoop ? 50 : 10) && proj >= 0 && proj <= 1) {
        if (!isMegaPoop) return { target: 'laundry' };
        allHits.push({ target: 'laundry' });
      }
    }

    // Check raccoons
    for (const raccoon of this.raccoons.values()) {
      if (raccoon.state === 'fleeing') continue; // already fleeing, immune
      const dx = poop.x - raccoon.x;
      const dy = poop.y - raccoon.y;
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius + 4) {
        if (!isMegaPoop) return { target: 'raccoon', raccoon };
        allHits.push({ target: 'raccoon', raccoon });
      }
    }

    // Check Godfather Raccoon (boss — takes damage from poop)
    if (this.godfatherRaccoon && this.godfatherRaccoon.state !== 'escaping') {
      const gf = this.godfatherRaccoon;
      const gdx = poop.x - gf.x;
      const gdy = poop.y - gf.y;
      if (Math.sqrt(gdx * gdx + gdy * gdy) < hitRadius + 18) {
        if (!isMegaPoop) return { target: 'godfather' };
        allHits.push({ target: 'godfather' });
      }
    }

    // Check cop birds (can be stunned by poop — daring escape mechanic!)
    for (const cop of this.copBirds.values()) {
      if (cop.state === 'stunned') continue; // already stunned
      const dx = poop.x - cop.x;
      const dy = poop.y - cop.y;
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius + 5) {
        if (!isMegaPoop) return { target: 'cop', cop };
        allHits.push({ target: 'cop', cop });
      }
    }

    // Check Eagle Overlord (large hit box — massive wingspan)
    if (this.boss && this.boss.type === 'EAGLE_OVERLORD') {
      const dx = poop.x - this.boss.x;
      const dy = poop.y - this.boss.y;
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius + 28) {
        if (!isMegaPoop) return { target: 'eagle_overlord' };
        allHits.push({ target: 'eagle_overlord' });
      }
    }

    // Check territory predators (hawk and cat in their fixed home zones)
    for (const [predKey, predator] of Object.entries(this.territoryPredators)) {
      if (predator.state === 'dead') continue;
      const pdx = poop.x - predator.x;
      const pdy = poop.y - predator.y;
      const hitDist = hitRadius + (predKey === 'hawk' ? 14 : 18);
      if (Math.sqrt(pdx * pdx + pdy * pdy) < hitDist) {
        if (!isMegaPoop) return { target: 'territory_predator', predKey, predator };
        allHits.push({ target: 'territory_predator', predKey, predator });
      }
    }

    if (isMegaPoop && allHits.length > 0) {
      return { target: allHits[0].target, npc: allHits[0].npc, allHits };
    }

    // Check arena fighters (PvP — only single-poop hits, arena must be in 'fighting' state)
    if (!isMegaPoop && this.arena && this.arena.state === 'fighting' && this.arena.fighters.has(poop.birdId)) {
      for (const [fighterId, fighter] of this.arena.fighters) {
        if (fighterId === poop.birdId || fighter.eliminated) continue;
        const target = this.birds.get(fighterId);
        if (!target) continue;
        const dx = poop.x - target.x;
        const dy = poop.y - target.y;
        if (Math.sqrt(dx * dx + dy * dy) < hitRadius + 12) {
          return { target: 'arena_fighter', fighterId, fighter };
        }
      }
    }

    // Check hit contract targets (bounty hunting — any bird can hit a marked target)
    if (!isMegaPoop && this.activeHits.size > 0) {
      for (const [targetBirdId, hitContract] of this.activeHits) {
        if (poop.birdId === hitContract.contractorId) continue; // contractor can't be own hitman
        if (poop.birdId === targetBirdId) continue;             // target can't poop themselves
        const targetBird = this.birds.get(targetBirdId);
        if (!targetBird) continue;
        const dx = poop.x - targetBird.x;
        const dy = poop.y - targetBird.y;
        if (Math.sqrt(dx * dx + dy * dy) < hitRadius + 14) {
          return { target: 'hit_target', hitContract, targetBird };
        }
      }
    }

    return { target: null };
  }

  _updateNPC(npc, dt, now) {
    if (npc.stateTimer > 0) {
      npc.stateTimer -= dt;
      if (npc.stateTimer <= 0) {
        // Return to normal
        if (npc.type === 'cafe_sitter') {
          npc.state = 'sitting';
          npc.x = npc.homeX;
          npc.y = npc.homeY;
          npc.speed = 0;
        } else {
          npc.state = 'walking';
          npc.speed = npc.type === 'walker' ?
            world.NPC_TYPES.walker.speed + Math.random() * 15 :
            world.NPC_TYPES.park_walker.speed + Math.random() * 10;
          this._setNPCTarget(npc);
        }
      }
    }

    if (npc.state === 'sitting') return;

    // Move towards target
    const dx = npc.targetX - npc.x;
    const dy = npc.targetY - npc.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      // Reached target, get new one
      if (npc.state === 'fleeing') {
        npc.state = 'walking';
        npc.speed = npc.type === 'walker' ?
          world.NPC_TYPES.walker.speed :
          world.NPC_TYPES.park_walker.speed;
      }
      this._setNPCTarget(npc);
    } else {
      const moveSpeed = npc.speed * dt;
      npc.x += (dx / dist) * moveSpeed;
      npc.y += (dy / dist) * moveSpeed;
    }

    // Keep in bounds
    npc.x = Math.max(20, Math.min(world.WORLD_WIDTH - 20, npc.x));
    npc.y = Math.max(20, Math.min(world.WORLD_HEIGHT - 20, npc.y));
  }

  // ============================================================
  // WEATHER SYSTEM
  // ============================================================
  _updateWeather(dt, now) {
    // Expire current weather
    if (this.weather && now >= this.weather.endsAt) {
      const wasRainy = this.weather.type === 'rain' || this.weather.type === 'storm';
      const oldType = this.weather.type;
      this.weather = null;
      // Remove rain worms
      if (wasRainy) {
        for (const wormId of this.rainWorms.keys()) {
          this.foods.delete(wormId);
        }
        this.rainWorms.clear();
      }
      this.events.push({ type: 'weather_end', weatherType: oldType });
      this.weatherTimer = now + this._randomRange(90000, 180000); // 1.5–3 min gap
      return;
    }

    // Spawn new weather when timer fires
    if (!this.weather && now >= this.weatherTimer) {
      // Rain most common; fog and hailstorm rarer surprises
      const roll = Math.random();
      let type;
      if (roll < 0.32) type = 'rain';
      else if (roll < 0.58) type = 'wind';
      else if (roll < 0.73) type = 'storm';
      else if (roll < 0.87) type = 'fog';
      else type = 'hailstorm';

      const windAngle = Math.random() * Math.PI * 2;
      let duration, windSpeed, intensity;
      if (type === 'rain') {
        duration = this._randomRange(150000, 270000); // 2.5–4.5 min
        windSpeed = 0;
        intensity = 0.55 + Math.random() * 0.45;
      } else if (type === 'wind') {
        duration = this._randomRange(90000, 180000); // 1.5–3 min
        windSpeed = 55 + Math.random() * 85;
        intensity = 0.5 + Math.random() * 0.5;
      } else if (type === 'storm') {
        duration = this._randomRange(90000, 150000); // 1.5–2.5 min
        windSpeed = 80 + Math.random() * 100;
        intensity = 1.0;
      } else if (type === 'fog') {
        duration = this._randomRange(180000, 300000); // 3–5 min
        windSpeed = 0;
        intensity = 0.75 + Math.random() * 0.25; // 0.75–1.0 fog density
      } else { // hailstorm
        duration = this._randomRange(60000, 120000); // 1–2 min (intense but brief)
        windSpeed = 40 + Math.random() * 60; // moderate wind + hail
        intensity = 0.8 + Math.random() * 0.2;
      }

      this.weather = {
        type,
        intensity,
        windAngle,
        windSpeed,
        endsAt: now + duration,
        wormSpawnTimer: now + 5000,
        lightningTimer: now + this._randomRange(6000, 18000),
        hailTimer: now + this._randomRange(2000, 4000), // for hailstorm
      };

      this.events.push({ type: 'weather_start', weatherType: type, windAngle, windSpeed, intensity });
      console.log(`[GameEngine] Weather started: ${type} (wind=${Math.round(windSpeed)}, angle=${windAngle.toFixed(2)})`);
      return;
    }

    if (!this.weather) return;

    // Rain/storm: spawn worms on grassy areas
    const isRainy = this.weather.type === 'rain' || this.weather.type === 'storm';
    if (isRainy && now >= this.weather.wormSpawnTimer && this.rainWorms.size < 7) {
      this._spawnRainWorm();
      this.weather.wormSpawnTimer = now + this._randomRange(7000, 14000);
      if (this.rainWorms.size === 1) {
        // First worm — hint to players
        this.events.push({ type: 'worms_appeared' });
      }
    }

    // Storm: random lightning strikes
    if (this.weather.type === 'storm' && now >= this.weather.lightningTimer) {
      // Strike a random position in the world (biased toward populated areas)
      const lx = 300 + Math.random() * (world.WORLD_WIDTH - 600);
      const ly = 300 + Math.random() * (world.WORLD_HEIGHT - 600);
      this.events.push({ type: 'lightning', x: lx, y: ly });

      // Stun any birds caught in the blast radius
      for (const b of this.birds.values()) {
        if (b.stunnedUntil > now) continue; // already stunned
        const dx = b.x - lx;
        const dy = b.y - ly;
        if (Math.sqrt(dx * dx + dy * dy) < 90) {
          b.stunnedUntil = now + 1800;
          b.comboCount = 0;
          b.comboExpiresAt = 0;
          this.events.push({ type: 'lightning_hit', birdId: b.id, birdName: b.name, x: b.x, y: b.y });
        }
      }

      // Lightning zaps nearby drunk pigeons — coin shower for all birds in radius!
      for (const [dpId, dp] of this.drunkPigeons) {
        const dpDx = dp.x - lx;
        const dpDy = dp.y - ly;
        if (Math.sqrt(dpDx * dpDx + dpDy * dpDy) < 150) {
          this._explodeDrunkPigeon(dpId, dp, now);
        }
      }

      this.weather.lightningTimer = now + this._randomRange(8000, 28000);
    }

    // Hailstorm: periodic hail strikes that slow birds
    if (this.weather.type === 'hailstorm' && now >= this.weather.hailTimer) {
      // Pick 1–3 random positions in the world for hail strikes
      const strikeCount = 1 + Math.floor(Math.random() * 3);
      for (let s = 0; s < strikeCount; s++) {
        const hx = 200 + Math.random() * (world.WORLD_WIDTH - 400);
        const hy = 200 + Math.random() * (world.WORLD_HEIGHT - 400);
        this.events.push({ type: 'hail_strike', x: hx, y: hy });

        // Slow any bird within 80px of the strike
        for (const b of this.birds.values()) {
          if (b.stunnedUntil > now) continue;
          const dx = b.x - hx;
          const dy = b.y - hy;
          if (Math.sqrt(dx * dx + dy * dy) < 80) {
            b.hailSlowUntil = now + 1200; // slowed for 1.2 seconds
            b.comboCount = 0;             // hail breaks your combo streak
            b.comboExpiresAt = 0;
            this.events.push({ type: 'hail_hit', birdId: b.id, birdName: b.name, x: b.x, y: b.y });
          }
        }
      }
      this.weather.hailTimer = now + this._randomRange(2500, 5000);
    }
  }

  _spawnRainWorm() {
    // Grassy spawn zones (park + open areas, off roads)
    const grassZones = [
      { x: 820, y: 920, w: 660, h: 610 },  // park interior
      { x: 50,  y: 50,  w: 700, h: 150 },  // top-left grass strip
      { x: 50,  y: 700, w: 700, h: 150 },  // mid-left grass strip
      { x: 50,  y: 1600, w: 700, h: 150 }, // lower-left grass strip
      { x: 1700, y: 50, w: 1200, h: 150 }, // top-right grass strip
      { x: 50,  y: 2500, w: 2900, h: 400 },// bottom open grass
    ];
    const zone = grassZones[Math.floor(Math.random() * grassZones.length)];
    const id = 'food_worm_' + uid();
    const food = {
      id,
      type: 'worm',
      x: zone.x + Math.random() * zone.w,
      y: zone.y + Math.random() * zone.h,
      value: 28,      // worms are nutritious!
      active: true,
      respawnAt: 0,
    };
    this.foods.set(id, food);
    this.rainWorms.set(id, true);
  }

  // ============================================================
  // RACCOON THIEVES
  // ============================================================
  _raccoonEdgeTarget(x, y) {
    // Return the nearest map edge point as a flee target
    const distLeft   = x;
    const distRight  = world.WORLD_WIDTH - x;
    const distTop    = y;
    const distBottom = world.WORLD_HEIGHT - y;
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    if (minDist === distLeft)   return { x: -50, y };
    if (minDist === distRight)  return { x: world.WORLD_WIDTH + 50, y };
    if (minDist === distTop)    return { x, y: -50 };
    return { x, y: world.WORLD_HEIGHT + 50 };
  }

  _spawnRaccoon(now) {
    // Spawn on road, away from players
    const roads = world.ROADS;
    const road = roads[Math.floor(Math.random() * roads.length)];
    const x = road.x + Math.random() * road.w;
    const y = road.y + Math.random() * road.h;
    const id = 'raccoon_' + uid();
    const raccoon = {
      id, x, y,
      rotation: Math.random() * Math.PI * 2,
      speed: 75,
      fleeSpeed: 220,
      state: 'hunting',   // 'hunting' | 'carrying' | 'fleeing'
      targetX: x, targetY: y,
      targetFoodId: null,
      carriedFoodType: null,
      spawnedAt: now,
    };
    this.raccoons.set(id, raccoon);
    console.log(`[GameEngine] Raccoon spawned at ${Math.round(x)}, ${Math.round(y)}`);
  }

  _updateRaccoons(dt, now) {
    const isNight = this.dayPhase === 'night' || this.dayPhase === 'dusk';

    // Despawn all raccoons at dawn/day
    if (!isNight) {
      if (this.raccoons.size > 0) {
        this.raccoons.clear();
        this.raccoonSpawnTimer = 0;
        this.events.push({ type: 'raccoons_gone' });
      }
      return;
    }

    // Spawn new raccoons during night (up to 3, every 25–40s)
    if (this.raccoons.size < 3 && now >= this.raccoonSpawnTimer && this.birds.size > 0) {
      this._spawnRaccoon(now);
      this.raccoonSpawnTimer = now + this._randomRange(25000, 40000);
      if (this.raccoons.size === 1) {
        // First raccoon of the night — announce it
        this.events.push({ type: 'raccoon_spawn' });
      }
    }

    // Update each raccoon
    for (const [raccoonId, r] of this.raccoons) {
      // Check if escaped off-map
      if (r.x < -60 || r.x > world.WORLD_WIDTH + 60 ||
          r.y < -60 || r.y > world.WORLD_HEIGHT + 60) {
        this.raccoons.delete(raccoonId);
        continue;
      }

      const speed = (r.state === 'fleeing') ? r.fleeSpeed : r.speed;

      if (r.state === 'hunting') {
        // Find nearest active food
        let nearestFood = null;
        let nearestDist = Infinity;
        for (const food of this.foods.values()) {
          if (!food.active) continue;
          // Skip food that was just dropped by a raccoon (has 'raccoon_drop' in id)
          if (food.id.startsWith('food_raccoon_drop_')) continue;
          const fdx = food.x - r.x;
          const fdy = food.y - r.y;
          const dist = Math.sqrt(fdx * fdx + fdy * fdy);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestFood = food;
          }
        }
        if (nearestFood) {
          r.targetFoodId = nearestFood.id;
          r.targetX = nearestFood.x;
          r.targetY = nearestFood.y;
          // Move toward food
          const dx = r.targetX - r.x;
          const dy = r.targetY - r.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1) {
            r.x += (dx / dist) * speed * dt;
            r.y += (dy / dist) * speed * dt;
            r.rotation = Math.atan2(dy, dx);
          }
          // Reached food: steal it!
          if (dist < 12) {
            const food = this.foods.get(r.targetFoodId);
            if (food && food.active) {
              r.carriedFoodType = food.type;
              food.active = false;
              food.respawnAt = now + 30000; // long respawn — the raccoon took it
              r.state = 'carrying';
              r.targetFoodId = null;
              // Head for nearest map edge
              const edge = this._raccoonEdgeTarget(r.x, r.y);
              r.targetX = edge.x;
              r.targetY = edge.y;
              this.events.push({ type: 'raccoon_steal', x: r.x, y: r.y, foodType: r.carriedFoodType });
            } else {
              // Food already gone — pick a new target next tick
              r.targetFoodId = null;
            }
          }
        } else {
          // No food on map — wander toward park (food-rich area)
          r.targetX = 900 + Math.random() * 600;
          r.targetY = 900 + Math.random() * 600;
          const dx = r.targetX - r.x;
          const dy = r.targetY - r.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1) {
            r.x += (dx / dist) * speed * dt;
            r.y += (dy / dist) * speed * dt;
            r.rotation = Math.atan2(dy, dx);
          }
        }

      } else if (r.state === 'carrying' || r.state === 'fleeing') {
        // Move toward escape target (map edge)
        const dx = r.targetX - r.x;
        const dy = r.targetY - r.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          r.x += (dx / dist) * speed * dt;
          r.y += (dy / dist) * speed * dt;
          r.rotation = Math.atan2(dy, dx);
        }
      }
    }
  }

  // ============================================================
  // DRUNK PIGEONS (night-only, pickpocketable loot carriers)
  // ============================================================
  _spawnDrunkPigeon(now) {
    // Spawn near city hotspots (bars, cafe district, downtown)
    const spawnPoints = [
      { x: 680,  y: 1900 },  // Cafe District (the bar strip)
      { x: 950,  y: 1600 },  // Park edge
      { x: 1250, y: 850  },  // Downtown
      { x: 1850, y: 1500 },  // Residential neighborhood
      { x: 2100, y: 2100 },  // Near the Mall
      { x: 520,  y: 1100 },  // West side
      { x: 1600, y: 600  },  // North strip
    ];
    const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    const id = 'drunk_' + uid();
    const pigeon = {
      id,
      x: spawn.x + (Math.random() - 0.5) * 120,
      y: spawn.y + (Math.random() - 0.5) * 120,
      rotation: Math.random() * Math.PI * 2,
      coins: 18 + Math.floor(Math.random() * 28),  // 18–45 coins on them
      wobblePhase: Math.random() * Math.PI * 2,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0,
      pickpocketCooldowns: {},   // birdId -> expiry
      spawnedAt: now,
    };
    this.drunkPigeons.set(id, pigeon);
    console.log(`[GameEngine] 🍺 Drunk pigeon spawned with ${pigeon.coins}c`);
  }

  _updateDrunkPigeons(dt, now) {
    const isNight = this.dayPhase === 'night' || this.dayPhase === 'dusk';

    // Despawn at dawn/day
    if (!isNight) {
      if (this.drunkPigeons.size > 0) {
        this.drunkPigeons.clear();
        this.drunkPigeonSpawnTimer = 0;
        this.events.push({ type: 'drunk_pigeons_gone' });
      }
      return;
    }

    // Spawn up to 6 drunk pigeons at night, one every 20–35s
    if (this.drunkPigeons.size < 6 && now >= this.drunkPigeonSpawnTimer && this.birds.size > 0) {
      this._spawnDrunkPigeon(now);
      this.drunkPigeonSpawnTimer = now + this._randomRange(20000, 35000);
      if (this.drunkPigeons.size === 1) {
        this.events.push({ type: 'drunk_pigeon_spawn' });
      }
    }

    // Speed of drunk wander (slow — they're wasted)
    const WANDER_SPEED = 38;

    for (const [dpId, dp] of this.drunkPigeons) {
      // Wobbly wandering: change direction frequently with big random swings
      dp.wanderTimer -= dt;
      if (dp.wanderTimer <= 0) {
        // Big random direction change (±100° swing = very drunk)
        dp.wanderAngle += (Math.random() - 0.5) * (Math.PI * 100 / 180) * 3.5;
        dp.wanderTimer = this._randomRange(0.8, 2.5);
      }

      // Move in wanderAngle direction, with a sine-wave stagger side-to-side
      const staggerOffset = Math.sin(now * 0.003 + dp.wobblePhase) * 25 * dt;
      dp.x += Math.cos(dp.wanderAngle) * WANDER_SPEED * dt + Math.cos(dp.wanderAngle + Math.PI / 2) * staggerOffset;
      dp.y += Math.sin(dp.wanderAngle) * WANDER_SPEED * dt + Math.sin(dp.wanderAngle + Math.PI / 2) * staggerOffset;
      dp.wobblePhase += dt * 2;

      // Face their movement direction (slightly slurred — lags behind)
      dp.rotation = dp.wanderAngle;

      // Bounce off world edges
      if (dp.x < 80)  { dp.x = 80;  dp.wanderAngle = Math.PI - dp.wanderAngle; }
      if (dp.x > world.WORLD_WIDTH - 80)  { dp.x = world.WORLD_WIDTH - 80;  dp.wanderAngle = Math.PI - dp.wanderAngle; }
      if (dp.y < 80)  { dp.y = 80;  dp.wanderAngle = -dp.wanderAngle; }
      if (dp.y > world.WORLD_HEIGHT - 80) { dp.y = world.WORLD_HEIGHT - 80; dp.wanderAngle = -dp.wanderAngle; }

      // Pickpocket check: bird within 45px steals coins
      if (dp.coins > 0) {
        for (const bird of this.birds.values()) {
          if (bird.stunnedUntil > now) continue;
          // Per-bird cooldown (8s) — can't farm the same drunk all night
          if (dp.pickpocketCooldowns[bird.id] && dp.pickpocketCooldowns[bird.id] > now) continue;

          const dx = bird.x - dp.x;
          const dy = bird.y - dp.y;
          if (Math.sqrt(dx * dx + dy * dy) < 45) {
            const stolen = Math.min(dp.coins, 8 + Math.floor(Math.random() * 12));
            dp.coins -= stolen;
            bird.coins += stolen;
            bird.xp += 12;
            dp.pickpocketCooldowns[bird.id] = now + 8000;
            // Stumble: big sudden direction change when pickpocketed
            dp.wanderAngle += (Math.random() - 0.5) * Math.PI * 1.5;
            this.events.push({
              type: 'drunk_pigeon_pickpocket',
              birdId: bird.id, birdName: bird.name,
              dpId, stolen, remaining: dp.coins,
              x: dp.x, y: dp.y,
            });
            // Daily challenge tracking
            this._trackDailyProgress(bird, 'pickpocket', 1);
            this._trackDailyProgress(bird, 'coins_earned', stolen);
          }
        }
      }
    }
  }

  _explodeDrunkPigeon(dpId, dp, now) {
    if (!this.drunkPigeons.has(dpId)) return;
    this.drunkPigeons.delete(dpId);

    // Every bird within 250px gets a windfall share of the coins
    const winners = [];
    for (const bird of this.birds.values()) {
      const dx = bird.x - dp.x;
      const dy = bird.y - dp.y;
      if (Math.sqrt(dx * dx + dy * dy) < 250) {
        const share = Math.floor(dp.coins / 2) + Math.floor(Math.random() * 15);
        bird.coins += share;
        bird.xp += 30;
        winners.push({ id: bird.id, name: bird.name, share });
      }
    }

    this.events.push({
      type: 'drunk_pigeon_coin_shower',
      x: dp.x, y: dp.y,
      totalCoins: dp.coins,
      winners,
    });
    console.log(`[GameEngine] ⚡🍺 Drunk pigeon ZAPPED — coin shower! ${dp.coins}c scattered`);
  }

  // ============================================================
  // ============================================================
  // TERRITORY CONTROL SYSTEM
  // ============================================================
  _initTerritories() {
    const now = Date.now();
    for (const zoneDef of world.TERRITORY_ZONES) {
      this.territories.set(zoneDef.id, {
        id: zoneDef.id,
        name: zoneDef.name,
        x: zoneDef.x, y: zoneDef.y,
        w: zoneDef.w, h: zoneDef.h,
        baseColor: zoneDef.baseColor,
        ownerTeamId: null,     // flockId or 'solo_BIRDID' or null
        ownerName: null,       // display name of owner
        ownerColor: null,      // hex color for rendering
        captureProgress: 0,    // 0.0 → 1.0
        capturingTeamId: null, // team currently filling the bar
        capturingName: null,
        lastRewardAt: now,
        lastContestAlert: 0,
      });
    }
  }

  _teamColor(teamId) {
    const COLORS = ['#ff4444', '#4499ff', '#ff8800', '#44dd66', '#cc44ff', '#ffcc00', '#ff44aa', '#00ccff'];
    let hash = 0;
    for (let i = 0; i < teamId.length; i++) hash = (hash * 31 + teamId.charCodeAt(i)) & 0xffff;
    return COLORS[hash % COLORS.length];
  }

  _updateTerritories(dt, now) {
    const CAPTURE_RATE = 0.006;    // progress per bird per second (solo: ~167s to cap; 3-bird flock: ~37s)
    const FLOCK_MULTIPLIER = 2.0;  // flock birds count double
    const REWARD_INTERVAL = 20000; // ms between passive rewards
    const REWARD_XP = 20;
    const REWARD_COINS = 8;
    const REWARD_FOOD = 5;

    for (const zone of this.territories.values()) {
      // --- Count birds inside this zone by team ---
      const teamCounts = new Map(); // teamId -> { count, name, isFlock, color }
      for (const bird of this.birds.values()) {
        if (bird.x >= zone.x && bird.x <= zone.x + zone.w &&
            bird.y >= zone.y && bird.y <= zone.y + zone.h) {
          // Gang takes priority: gang members fight as their gang, not flock or solo
          const teamId = bird.gangId || bird.flockId || ('solo_' + bird.id);
          const teamName = bird.gangId ? `[${bird.gangTag}] ${bird.gangName}` : (bird.flockName || bird.name);
          const isFlock = !!(bird.gangId || bird.flockId);
          const teamColor = bird.gangId ? bird.gangColor : null;
          if (!teamCounts.has(teamId)) {
            teamCounts.set(teamId, { count: 0, name: teamName, isFlock, color: teamColor });
          }
          teamCounts.get(teamId).count++;
        }
      }

      // --- Find dominant team (most effective birds) ---
      let dominantTeamId = null, dominantPower = 0, dominantName = null;
      for (const [teamId, info] of teamCounts) {
        const power = info.count * (info.isFlock ? FLOCK_MULTIPLIER : 1);
        if (power > dominantPower) {
          dominantPower = power;
          dominantTeamId = teamId;
          dominantName = info.name;
        }
      }

      // --- Update capture state ---
      if (zone.ownerTeamId === null) {
        // NEUTRAL: first dominant team starts capturing
        if (dominantTeamId !== null) {
          zone.capturingTeamId = dominantTeamId;
          zone.capturingName = dominantName;
          zone.captureProgress = Math.min(1, zone.captureProgress + CAPTURE_RATE * dominantPower * dt);
          if (zone.captureProgress >= 1) {
            zone.captureProgress = 1;
            zone.ownerTeamId = dominantTeamId;
            zone.ownerName = dominantName;
            zone.ownerColor = teamCounts.get(dominantTeamId)?.color || this._teamColor(dominantTeamId);
            zone.lastRewardAt = now;
            zone.lastContestAlert = 0;
            this.events.push({
              type: 'territory_captured',
              zoneId: zone.id, zoneName: zone.name,
              teamName: dominantName,
            });
          }
        }
      } else {
        // OWNED: check for contest or reinforcement
        if (dominantTeamId === null) {
          // Empty zone — hold steady (no change)
        } else if (dominantTeamId === zone.ownerTeamId) {
          // Owners reinforcing
          zone.captureProgress = Math.min(1, zone.captureProgress + CAPTURE_RATE * 0.3 * dominantPower * dt);
        } else {
          // CONTESTED — rival team eroding the owner's hold
          zone.captureProgress = Math.max(0, zone.captureProgress - CAPTURE_RATE * dominantPower * dt);

          // Alert: zone under attack (throttled)
          if (now - zone.lastContestAlert > 25000) {
            zone.lastContestAlert = now;
            this.events.push({
              type: 'territory_contested',
              zoneId: zone.id, zoneName: zone.name,
              ownerName: zone.ownerName, attackerName: dominantName,
            });
          }

          if (zone.captureProgress <= 0) {
            // Zone flipped to neutral — attacker now starts capturing it
            const lostOwner = zone.ownerName;
            zone.ownerTeamId = null;
            zone.ownerName = null;
            zone.ownerColor = null;
            zone.capturingTeamId = dominantTeamId;
            zone.capturingName = dominantName;
            zone.captureProgress = 0;
            this.events.push({
              type: 'territory_lost',
              zoneId: zone.id, zoneName: zone.name,
              ownerName: lostOwner, attackerName: dominantName,
            });
          }
        }

        // --- Passive rewards for owner team members inside the zone ---
        if (zone.ownerTeamId && now - zone.lastRewardAt >= REWARD_INTERVAL) {
          zone.lastRewardAt = now;
          let rewarded = 0;
          for (const bird of this.birds.values()) {
            const teamId = bird.gangId || bird.flockId || ('solo_' + bird.id);
            if (teamId === zone.ownerTeamId &&
                bird.x >= zone.x && bird.x <= zone.x + zone.w &&
                bird.y >= zone.y && bird.y <= zone.y + zone.h) {
              bird.xp += REWARD_XP;
              bird.coins += REWARD_COINS;
              bird.food += REWARD_FOOD;
              rewarded++;
            }
          }
          if (rewarded > 0) {
            this.events.push({
              type: 'territory_reward',
              zoneId: zone.id, zoneName: zone.name,
              teamName: zone.ownerName, count: rewarded,
            });
          }
        }
      }
    }
  }

  // ============================================================
  // DAY/NIGHT CYCLE
  // ============================================================
  _updateDayNight(dt, now) {
    const CYCLE_SECONDS = 20 * 60; // 20-minute real-time cycle
    this.dayTime = (this.dayTime + dt / CYCLE_SECONDS) % 1.0;

    let newPhase;
    if (this.dayTime < 0.30) newPhase = 'day';
    else if (this.dayTime < 0.45) newPhase = 'dusk';
    else if (this.dayTime < 0.75) newPhase = 'night';
    else newPhase = 'dawn';

    if (newPhase !== this.dayPhase) {
      this.dayPhase = newPhase;
      const phaseMessages = {
        dusk:  '🌆 The sun sets over Bird City... danger approaches.',
        night: '🌙 NIGHTFALL! The streets grow dark. Cats are more aggressive.',
        dawn:  '🌅 Dawn breaks over Bird City. Survivors collect their spoils.',
        day:   '☀️ A new day begins in Bird City. Go cause some chaos!',
      };
      this.events.push({
        type: 'phase_change',
        phase: newPhase,
        message: phaseMessages[newPhase],
      });

      // At night: cats get faster and spawn sooner
      if (newPhase === 'night' && this.cat) {
        this.cat.speed *= 1.4;
      }
      // At dawn: respawn all street foods to celebrate the new day
      if (newPhase === 'dawn') {
        for (const food of this.foods.values()) {
          food.active = true;
          food.respawnAt = null;
        }
      }
    }
  }

  getStateForBird(birdId) {
    const bird = this.birds.get(birdId);
    if (!bird) return null;

    const now = Date.now();
    const viewRange = 1200; // pixels from center

    // Nearby birds
    const nearbyBirds = [];
    for (const b of this.birds.values()) {
      if (Math.abs(b.x - bird.x) < viewRange && Math.abs(b.y - bird.y) < viewRange) {
        nearbyBirds.push({
          id: b.id,
          name: b.name,
          x: b.x, y: b.y,
          vx: b.vx, vy: b.vy,
          rotation: b.rotation,
          type: b.type,
          level: b.level,
          wingPhase: b.wingPhase,
          stunned: b.stunnedUntil > now,
          powerUpType: (b.powerUp && now < b.powerUp.expiresAt) ? b.powerUp.type : null,
          cloaked: b.cloakedUntil > now,
          inNest: b.inNest,
          flockId: b.flockId,
          birdColor: b.birdColor,
          carryingEggId: b.carryingEggId || null,
          mafiaTitle: this._getMafiaTitle(b.mafiaRep || 0),
          gangId: b.gangId || null,
          gangTag: b.gangTag || null,
          gangColor: b.gangColor || null,
          hitBounty: this.activeHits.has(b.id) ? {
            reward: this.activeHits.get(b.id).reward,
            myHits: this.activeHits.get(b.id).hitProgress.get(bird.id) || 0,
            hitsNeeded: this.activeHits.get(b.id).hitsNeeded,
          } : null,
          isKingpin: this.kingpin ? this.kingpin.birdId === b.id : false,
          kingpinMyHits: (this.kingpin && this.kingpin.birdId === b.id) ? (this.kingpin.hitCount.get(bird.id) || 0) : 0,
          tattoosEquipped: b.tattoosEquipped || [],
        });
      }
    }

    // Nearby poops
    const nearbyPoops = [];
    for (const p of this.poops.values()) {
      if (Math.abs(p.x - bird.x) < viewRange && Math.abs(p.y - bird.y) < viewRange) {
        nearbyPoops.push({ id: p.id, x: p.x, y: p.y, hitTarget: p.hitTarget });
      }
    }

    // Nearby NPCs (includes event NPCs)
    const nearbyNPCs = [];
    for (const n of this.npcs.values()) {
      if (Math.abs(n.x - bird.x) < viewRange && Math.abs(n.y - bird.y) < viewRange) {
        nearbyNPCs.push({
          id: n.id, type: n.type,
          x: n.x, y: n.y,
          state: n.state, hasFood: n.hasFood,
          poopedOn: n.poopedOn,
        });
      }
    }
    // Event NPCs
    for (const n of this.worldEventNPCs.values()) {
      if (Math.abs(n.x - bird.x) < viewRange && Math.abs(n.y - bird.y) < viewRange) {
        nearbyNPCs.push({
          id: n.id, type: n.type,
          x: n.x, y: n.y,
          state: n.state, hasFood: n.hasFood,
          poopedOn: n.poopedOn,
          isBride: n.isBride || false,
        });
      }
    }
    // Chaos event NPCs (NPC flood)
    for (const n of this.chaosEventNPCs.values()) {
      if (Math.abs(n.x - bird.x) < viewRange && Math.abs(n.y - bird.y) < viewRange) {
        nearbyNPCs.push({
          id: n.id, type: n.type,
          x: n.x, y: n.y,
          state: n.state, hasFood: n.hasFood,
          poopedOn: n.poopedOn,
        });
      }
    }
    // Revenge NPCs
    for (const n of this.revengeNPCs.values()) {
      if (Math.abs(n.x - bird.x) < viewRange && Math.abs(n.y - bird.y) < viewRange) {
        nearbyNPCs.push({
          id: n.id, type: 'revenge_npc',
          x: n.x, y: n.y,
          state: 'chasing', hasFood: false,
          poopedOn: 0,
        });
      }
    }
    // Decoys
    const nearbyDecoys = [];
    for (const d of this.decoys.values()) {
      if (Math.abs(d.x - bird.x) < viewRange && Math.abs(d.y - bird.y) < viewRange) {
        nearbyDecoys.push({
          id: d.id, x: d.x, y: d.y, rotation: d.rotation, type: d.type, birdColor: d.birdColor,
        });
      }
    }

    // Beacons (all beacons visible for minimap)
    const allBeacons = [];
    for (const b of this.beacons.values()) {
      allBeacons.push({ x: b.x, y: b.y, birdId: b.birdId });
    }

    // Nearby foods (includes event foods) — eagle eye sees ALL
    const isEagleEye = bird.eagleEyeUntil > now;
    const foodRange = isEagleEye ? Infinity : viewRange;
    const nearbyFoods = [];
    for (const f of this.foods.values()) {
      if (f.active && (isEagleEye || (Math.abs(f.x - bird.x) < foodRange && Math.abs(f.y - bird.y) < foodRange))) {
        nearbyFoods.push({ id: f.id, x: f.x, y: f.y, type: f.type });
      }
    }
    for (const f of this.worldEventFoods.values()) {
      if (f.active && (isEagleEye || (Math.abs(f.x - bird.x) < foodRange && Math.abs(f.y - bird.y) < foodRange))) {
        nearbyFoods.push({ id: f.id, x: f.x, y: f.y, type: f.type, value: f.value });
      }
    }
    // Chaos event golden rain foods
    for (const f of this.chaosEventFoods.values()) {
      if (f.active && (isEagleEye || (Math.abs(f.x - bird.x) < foodRange && Math.abs(f.y - bird.y) < foodRange))) {
        nearbyFoods.push({ id: f.id, x: f.x, y: f.y, type: 'golden', value: f.value });
      }
    }

    // Eagle eye: also send all powerups
    const puRange = isEagleEye ? Infinity : viewRange;

    // Cat
    let catState = null;
    if (this.cat) {
      catState = { x: this.cat.x, y: this.cat.y, rotation: this.cat.rotation };
    }

    // Janitor
    let janitorState = null;
    if (this.janitor && Math.abs(this.janitor.x - bird.x) < viewRange && Math.abs(this.janitor.y - bird.y) < viewRange) {
      janitorState = {
        x: this.janitor.x, y: this.janitor.y,
        state: this.janitor.state,
        isSuper: this.janitor.superUntil > now,
        poopsCleaned: this.janitor.poopsCleaned,
      };
    }

    // Moving cars (only nearby)
    const nearbyMovingCars = [];
    for (const car of this.movingCars) {
      if (Math.abs(car.x - bird.x) < viewRange && Math.abs(car.y - bird.y) < viewRange) {
        nearbyMovingCars.push({
          id: car.id, x: car.x, y: car.y, w: car.w, h: car.h,
          color: car.color, angle: car.angle,
        });
      }
    }

    // Power-ups (eagle eye sees all)
    const nearbyPowerUps = [];
    for (const pu of this.powerUps.values()) {
      if (isEagleEye || (Math.abs(pu.x - bird.x) < viewRange && Math.abs(pu.y - bird.y) < viewRange)) {
        nearbyPowerUps.push({ id: pu.id, x: pu.x, y: pu.y, type: pu.type });
      }
    }

    // Hawk
    let hawkState = null;
    if (this.worldEvent && this.worldEvent.type === 'hawk' && this.worldEvent.hawk) {
      const h = this.worldEvent.hawk;
      hawkState = { x: h.x, y: h.y, rotation: h.rotation };
    }

    // Active event info (with x/y for minimap)
    let activeEvent = null;
    if (this.worldEvent) {
      activeEvent = {
        type: this.worldEvent.type,
        endsAt: this.worldEvent.endsAt,
        startedAt: this.worldEvent.startedAt,
        x: this.worldEvent.x,
        y: this.worldEvent.y,
      };
    }

    const typeInfo2 = world.BIRD_TYPES[bird.type] || world.BIRD_TYPES.pigeon;
    let effectiveCooldown = typeInfo2.poopCooldown;
    if (bird.powerUp && now < bird.powerUp.expiresAt && bird.powerUp.type === 'hot_sauce') {
      effectiveCooldown = 100;
    }

    // Skill cooldown info for equipped skills
    const skillCooldownsState = {};
    for (let i = 0; i < bird.equippedSkills.length; i++) {
      const skillId = bird.equippedSkills[i];
      if (!skillId) continue;
      const catalog = world.SKILL_CATALOG[skillId];
      if (!catalog) continue;
      const lastUsed = bird.skillCooldowns[skillId] || 0;
      const elapsed = now - lastUsed;
      const remaining = Math.max(0, catalog.cooldown - elapsed);
      skillCooldownsState[skillId] = remaining;
    }

    // Skill slots unlocked based on level
    let skillSlots = 1;
    if (bird.level >= 10) skillSlots = 2;
    if (bird.level >= 25) skillSlots = 3;

    // Legacy ability info (for backwards compat with old client)
    const firstSkill = bird.equippedSkills[0] || 'poop_barrage';
    const firstCatalog = world.SKILL_CATALOG[firstSkill];
    const abilityName = firstSkill;
    const abilityCooldownMs = firstCatalog ? firstCatalog.cooldown : 20000;
    const timeSinceAbility = now - (bird.skillCooldowns[firstSkill] || 0);
    const abilityReady = timeSinceAbility >= abilityCooldownMs;
    const abilityCooldownRemaining = abilityReady ? 0 : abilityCooldownMs - timeSinceAbility;

    // Flock info
    let flockMembers = [];
    let flockName = null;
    if (bird.flockId) {
      const flock = this.flocks.get(bird.flockId);
      if (flock) {
        flockName = flock.name;
        for (const memberId of flock.members) {
          const member = this.birds.get(memberId);
          flockMembers.push({
            id: memberId,
            name: member ? member.name : '???',
            online: !!member,
          });
        }
      }
    }

    // Flock invite pending
    let flockInviteFrom = null;
    const pendingInvite = this.flockInvites.get(bird.id);
    if (pendingInvite && pendingInvite.expiresAt > now) {
      const fromBird = this.birds.get(pendingInvite.fromId);
      flockInviteFrom = {
        birdId: pendingInvite.fromId,
        birdName: fromBird ? fromBird.name : '???',
        flockName: pendingInvite.flockName || 'New Flock',
      };
    }

    // Near Date Center (150px for lobby)
    const dc = world.DATE_CENTER;
    const dcDx = bird.x - (dc.x + dc.w / 2);
    const dcDy = bird.y - (dc.y + dc.h / 2);
    const nearDateCenter = Math.sqrt(dcDx * dcDx + dcDy * dcDy) < 150;

    // Flock lobby: all online birds when near date center
    let lobbyBirds = null;
    if (nearDateCenter) {
      lobbyBirds = [];
      for (const b of this.birds.values()) {
        lobbyBirds.push({
          id: b.id,
          name: b.name,
          level: b.level,
          type: b.type,
          flockId: b.flockId || null,
          flockName: b.flockName || null,
        });
      }
    }

    // Active mission info
    let activeMissionState = null;
    if (bird.activeMission) {
      const am = bird.activeMission;
      const def = this._getMissionDef(am.missionId);
      const timeLeft = def ? Math.max(0, (am.startedAt + (def.timeLimit || 60000)) - now) : 0;
      const target = def && def.objective && def.objective.count ? def.objective.count : 1;
      activeMissionState = {
        id: am.missionId,
        title: def ? def.title : am.missionId,
        progress: am.progress,
        target: target,
        timeLeft: timeLeft,
      };
    }

    // Boss state
    let bossState = null;
    if (this.boss) {
      bossState = {
        type: this.boss.type,
        x: this.boss.x, y: this.boss.y,
        hp: Math.ceil(this.boss.hp),
        maxHp: this.boss.maxHp,
        rotation: this.boss.rotation,
        snatchedBirdId: (this.boss.snatched ? this.boss.snatched.birdId : null),
        escapeTime: this.boss.escapeTime || null,
      };
    }

    // Food truck state
    let foodTruckState = null;
    if (this.foodTruck) {
      foodTruckState = {
        x: this.foodTruck.x, y: this.foodTruck.y,
        w: this.foodTruck.w, h: this.foodTruck.h,
        angle: this.foodTruck.angle,
        heistProgress: this.foodTruck.heistProgress,
        heistActive: this.foodTruck.heistActive,
        looted: this.foodTruck.looted || false,
        heisterCount: Object.keys(this.foodTruck.contributions || {}).length,
      };
    }

    // Raccoons (all visible — they're on roads, large range)
    const nearbyRaccoons = [];
    for (const r of this.raccoons.values()) {
      if (Math.abs(r.x - bird.x) < viewRange && Math.abs(r.y - bird.y) < viewRange) {
        nearbyRaccoons.push({
          id: r.id, x: r.x, y: r.y, rotation: r.rotation,
          state: r.state,
          carriedFoodType: r.carriedFoodType || null,
        });
      }
    }

    // Drunk Pigeons (city-wide visible — players need to spot and chase them)
    const nearbyDrunkPigeons = [];
    for (const dp of this.drunkPigeons.values()) {
      if (Math.abs(dp.x - bird.x) < viewRange && Math.abs(dp.y - bird.y) < viewRange) {
        nearbyDrunkPigeons.push({
          id: dp.id, x: dp.x, y: dp.y,
          rotation: dp.rotation,
          wobblePhase: dp.wobblePhase,
          coins: dp.coins,
        });
      }
    }

    // Cop birds — all visible city-wide (sirens make them visible from afar)
    const nearbyCops = [];
    for (const cop of this.copBirds.values()) {
      nearbyCops.push({
        id: cop.id, x: cop.x, y: cop.y, rotation: cop.rotation,
        type: cop.type,
        state: cop.state,
        sirensPhase: cop.sirensPhase,
      });
    }

    // Wanted level for this specific bird
    const myHeat = this.heatScores.get(bird.id) || 0;
    const myWantedLevel = this._getWantedLevel(myHeat);

    return {
      birds: nearbyBirds,
      poops: nearbyPoops,
      npcs: nearbyNPCs,
      foods: nearbyFoods,
      cat: catState,
      janitor: janitorState,
      movingCars: nearbyMovingCars,
      powerUps: nearbyPowerUps,
      hawk: hawkState,
      activeEvent,
      decoys: nearbyDecoys,
      beacons: allBeacons,
      missionBoard: this.missionBoard.map(m => ({ id: m.id, title: m.title, desc: m.desc, minPlayers: m.minPlayers, type: m.type })),
      lobbyBirds: lobbyBirds,
      chaosMeter: Math.floor(this.chaosMeter),
      boss: bossState,
      territoryPredators: {
        hawk: this.territoryPredators.hawk.state !== 'dead' ? {
          type: 'MEGA_HAWK', x: this.territoryPredators.hawk.x, y: this.territoryPredators.hawk.y,
          rotation: this.territoryPredators.hawk.rotation, hp: Math.ceil(this.territoryPredators.hawk.hp),
          maxHp: this.territoryPredators.hawk.maxHp, state: this.territoryPredators.hawk.state,
        } : null,
        cat: this.territoryPredators.cat.state !== 'dead' ? {
          type: 'MEGA_CAT', x: this.territoryPredators.cat.x, y: this.territoryPredators.cat.y,
          rotation: this.territoryPredators.cat.rotation, hp: Math.ceil(this.territoryPredators.cat.hp),
          maxHp: this.territoryPredators.cat.maxHp, state: this.territoryPredators.cat.state,
        } : null,
      },
      myPredatorWarnings: (() => {
        const w = this.predatorWarnings.get(bird.id);
        const h = this.predatorHitCounts.get(bird.id);
        return {
          hawk: w ? w.hawk : null,
          cat: w ? w.cat : null,
          hawkHits: h ? h.hawk : 0,
          catHits: h ? h.cat : 0,
        };
      })(),
      wantedBirdId: this.wantedBirdId,
      foodTruck: foodTruckState,
      raccoons: nearbyRaccoons,
      drunkPigeons: nearbyDrunkPigeons,
      cops: nearbyCops,
      godfatherRaccoon: this.godfatherRaccoon ? {
        id: this.godfatherRaccoon.id,
        x: this.godfatherRaccoon.x,
        y: this.godfatherRaccoon.y,
        rotation: this.godfatherRaccoon.rotation,
        hp: this.godfatherRaccoon.hp,
        maxHp: this.godfatherRaccoon.maxHp,
        state: this.godfatherRaccoon.state,
        tributeCoins: this.godfatherRaccoon.tributeCoins,
      } : null,
      weather: this.weather ? {
        type: this.weather.type,
        intensity: this.weather.intensity,
        windAngle: this.weather.windAngle,
        windSpeed: this.weather.windSpeed,
        endsAt: this.weather.endsAt,
      } : null,
      territories: Array.from(this.territories.values()).map(z => ({
        id: z.id,
        name: z.name,
        x: z.x, y: z.y, w: z.w, h: z.h,
        baseColor: z.baseColor,
        ownerTeamId: z.ownerTeamId,
        ownerName: z.ownerName,
        ownerColor: z.ownerColor,
        captureProgress: z.captureProgress,
        capturingTeamId: z.capturingTeamId,
        capturingName: z.capturingName,
      })),
      dayTime: this.dayTime,
      dayPhase: this.dayPhase,
      blackMarket: this.blackMarket ? { x: this.blackMarket.x, y: this.blackMarket.y } : null,
      arena: {
        state: this.arena.state,
        pot: this.arena.pot,
        fighterCount: this.arena.fighters.size,
        isFighter: this.arena.fighters.has(bird.id),
        myArenaHp: this.arena.fighters.has(bird.id) ? this.arena.fighters.get(bird.id).arenaHp : null,
        countdownUntil: this.arena.countdownUntil,
        fightEndsAt: this.arena.fightEndsAt,
        cooldownUntil: this.arena.cooldownUntil,
        waitUntil: this.arena.waitingUntil,
        fighters: (this.arena.state === 'fighting' || this.arena.state === 'countdown' || this.arena.state === 'waiting')
          ? [...this.arena.fighters.entries()].map(([id, f]) => ({
              id, name: f.name, arenaHp: f.arenaHp, maxArenaHp: f.maxArenaHp, eliminated: f.eliminated,
            }))
          : null,
      },
      pigeonRace: (() => {
        const race = this.pigeonRace;
        const myRacer = race.racers.get(bird.id);
        const myBet = race.bets.get(bird.id) || null;
        // Compute total coins bet on each racer
        const racerBetAmounts = {};
        for (const [, bet] of race.bets) {
          racerBetAmounts[bet.targetId] = (racerBetAmounts[bet.targetId] || 0) + bet.amount;
        }
        return {
          state: race.state,
          pot: race.pot,
          racerCount: race.racers.size,
          isRacer: !!myRacer,
          myNextCpIdx: myRacer ? myRacer.nextCpIdx : null,
          myNeedsFinish: myRacer ? myRacer.needsFinish : false,
          myFinished: myRacer ? myRacer.finished : false,
          myFinishPosition: myRacer ? myRacer.finishPosition : null,
          openUntil: race.openUntil,
          countdownUntil: race.countdownUntil,
          raceEndsAt: race.raceEndsAt,
          winners: race.winners,
          myBet,
          racerBetAmounts,
          totalBetPool: [...race.bets.values()].reduce((s, b) => s + b.amount, 0),
          // List of racers with IDs (for betting UI during open/countdown)
          openRacers: (race.state === 'open' || race.state === 'countdown')
            ? [...race.racers.entries()].map(([id, r]) => ({ id, name: r.name }))
            : null,
          positions: (race.state === 'racing' || race.state === 'countdown' || race.state === 'finished')
            ? [...race.racers.entries()].map(([id, r]) => ({
                id, name: r.name,
                progress: r.finished ? 99 : (r.needsFinish ? 5 : r.nextCpIdx - 1),
                finished: r.finished,
                finishTime: r.finishTime,
                finishPosition: r.finishPosition,
              })).sort((a, b) => b.progress - a.progress)
            : null,
        };
      })(),
      self: {
        id: bird.id,
        name: bird.name,
        x: bird.x, y: bird.y,
        type: bird.type,
        level: bird.level,
        xp: bird.xp,
        food: bird.food,
        totalPoops: bird.totalPoops,
        totalSteals: bird.totalSteals,
        totalHits: bird.totalHits,
        humansCried: bird.humansCried,
        nextLevelXP: world.getXPForLevel(bird.level),
        poopReady: now - bird.lastPoop > effectiveCooldown,
        stunned: bird.stunnedUntil > now,
        stunnedUntil: bird.stunnedUntil,
        powerUp: (bird.powerUp && now < bird.powerUp.expiresAt) ? bird.powerUp : null,
        abilityReady,
        abilityCooldown: abilityCooldownRemaining,
        abilityName,
        eagleEye: bird.eagleEyeUntil > now,
        cloaked: bird.cloakedUntil > now,
        inNest: bird.inNest,
        inSewer: bird.inSewer,
        flockId: bird.flockId,
        flockName,
        flockMembers,
        flockInviteFrom,
        nearDateCenter,
        activeMission: activeMissionState,
        // Wanted/heat
        heat: this.heatScores.get(bird.id) || 0,
        wantedLevel: myWantedLevel,
        isWanted: this.wantedBirdId === bird.id,
        // Skill system
        coins: bird.coins,
        ownedSkills: bird.ownedSkills,
        equippedSkills: bird.equippedSkills,
        birdColor: bird.birdColor,
        skillSlots,
        skillCooldowns: skillCooldownsState,
        // Black Market active items
        bmSpeedUntil: bird.bmSpeedUntil,
        bmMegaPoops: bird.bmMegaPoops,
        bmSmokeBombUntil: bird.bmSmokeBombUntil,
        bmDoubleXpUntil: bird.bmDoubleXpUntil,
        // Combo streak
        comboCount: bird.comboCount,
        comboExpiresAt: bird.comboExpiresAt,
        // Weather debuffs
        hailSlowUntil: bird.hailSlowUntil,
        // Golden Egg Scramble
        carryingEggId: bird.carryingEggId,
        eggTackleImmunityUntil: bird.eggTackleImmunityUntil,
        // Hit contract: is there an active bounty on this bird?
        myHitBounty: this.activeHits.has(bird.id) ? {
          reward: this.activeHits.get(bird.id).reward,
          contractorName: this.activeHits.get(bird.id).contractorName,
          expiresAt: this.activeHits.get(bird.id).expiresAt,
        } : null,
        // Kingpin: are YOU the kingpin?
        isKingpin: this.kingpin ? this.kingpin.birdId === bird.id : false,
        // Gang
        gangId: bird.gangId,
        gangName: bird.gangName,
        gangTag: bird.gangTag,
        gangColor: bird.gangColor,
        gangRole: bird.gangRole,
      },
      // Kingpin state (global — for minimap and visual targeting)
      kingpin: this.kingpin ? (() => {
        const kBird = this.birds.get(this.kingpin.birdId);
        return {
          birdId: this.kingpin.birdId,
          birdName: this.kingpin.birdName,
          coins: this.kingpin.coins,
          crownedAt: this.kingpin.crownedAt,
          myHits: this.kingpin.hitCount.get(bird.id) || 0,
          x: kBird ? kBird.x : null,
          y: kBird ? kBird.y : null,
        };
      })() : null,
      radioTower: {
        state: this.radioTower.state,
        ownerId: this.radioTower.ownerId,
        ownerName: this.radioTower.ownerName,
        ownerColor: this.radioTower.ownerColor,
        expiresAt: this.radioTower.expiresAt,
        broadcastCooldownUntil: this.radioTower.broadcastCooldownUntil,
        signalBoostUsed: this.radioTower.signalBoostUsed,
        signalBoostUntil: this.radioTower.signalBoostUntil,
        isOwner: this.radioTower.ownerId === bird.id,
      },
      bankHeist: this._getBankHeistStateFor(bird.id),
      // Sewer layer — only visible when underground
      sewerRats: bird.inSewer
        ? Array.from(this.sewerRats.values()).map(r => ({ id: r.id, x: r.x, y: r.y, rotation: r.rotation, state: r.state }))
        : [],
      sewerLoot: bird.inSewer
        ? Array.from(this.sewerLoot.values()).filter(l => l.available).map(l => ({ id: l.id, x: l.x, y: l.y, value: l.value }))
        : [],
      graffiti: Array.from(this.graffiti.entries())
        .filter(([, tag]) => tag.expiresAt > now)
        .map(([buildingIdx, tag]) => ({
          buildingIdx,
          ownerName: tag.ownerName,
          ownerColor: tag.ownerColor,
          flockName: tag.flockName,
          expiresAt: tag.expiresAt,
        })),
      eggScramble: this._getEggScrambleState(),
      eggNestZones: world.EGG_NEST_ZONES,
      // Pigeon Mafia Don
      donCurrentJob: this.donCurrentJob ? {
        id: this.donCurrentJob.id,
        title: this.donCurrentJob.title,
        desc: this.donCurrentJob.desc,
        coinReward: this.donCurrentJob.coinReward,
        xpReward: this.donCurrentJob.xpReward,
        target: this.donCurrentJob.objective.count || 1,
      } : null,
      nearDon: (() => {
        const dx = bird.x - world.DON_POS.x;
        const dy = bird.y - world.DON_POS.y;
        return Math.sqrt(dx * dx + dy * dy) < 110;
      })(),
      // Online birds list for hit contract placement (only sent when near Don)
      onlineBirdsForHit: (() => {
        const dx = bird.x - world.DON_POS.x;
        const dy = bird.y - world.DON_POS.y;
        if (Math.sqrt(dx * dx + dy * dy) > 110 || this.birds.size <= 1) return null;
        return [...this.birds.values()]
          .filter(b => b.id !== bird.id)
          .map(b => ({
            id: b.id,
            name: b.name,
            coins: b.coins,
            hasActiveHit: this.activeHits.has(b.id),
          }))
          .sort((a, b) => b.coins - a.coins);
      })(),
      donMission: bird.donMission ? {
        jobId: bird.donMission.jobId,
        title: this._getDonJobDef(bird.donMission.jobId) ? this._getDonJobDef(bird.donMission.jobId).title : '',
        progress: bird.donMission.progress,
        target: this._getDonJobDef(bird.donMission.jobId) ? (this._getDonJobDef(bird.donMission.jobId).objective.count || 1) : 1,
        timeLeft: bird.donMission ? Math.max(0, (bird.donMission.startedAt + (this._getDonJobDef(bird.donMission.jobId) ? this._getDonJobDef(bird.donMission.jobId).timeLimit : 60000)) - now) : 0,
      } : null,
      mafiaRep: bird.mafiaRep || 0,
      mafiaTitle: this._getMafiaTitle(bird.mafiaRep || 0),
      // Daily challenges
      dailyChallenges: this.dailyChallenges.map(c => ({
        id: c.id,
        title: c.title,
        desc: c.desc,
        target: c.target,
        reward: c.reward,
        progress: (bird.dailyProgress && bird.dailyProgress[c.id]) || 0,
        completed: (bird.dailyCompleted || []).includes(c.id),
      })),
      dailyCompleted: (bird.dailyCompleted || []).length,
      dailyStreak: bird.dailyStreak || 0,
      dailyStreakMult: this._getDailyStreakMultiplier(bird.dailyStreak || 0),
      dailyChallengesDate: this.dailyChallengesDate,
      // Pigeonhole Slots Casino
      slotsJackpot: this.slotsJackpot,
      nearCasino: (() => {
        const cdx = bird.x - this.CASINO_POS.x;
        const cdy = bird.y - this.CASINO_POS.y;
        return Math.sqrt(cdx * cdx + cdy * cdy) < this.CASINO_POS.radius;
      })(),
      // Bird Tattoo Parlor
      tattoosOwned: bird.tattoosOwned || [],
      tattoosEquipped: bird.tattoosEquipped || [],
      nearTattooParlor: (() => {
        const tdx = bird.x - this.TATTOO_PARLOR_POS.x;
        const tdy = bird.y - this.TATTOO_PARLOR_POS.y;
        return Math.sqrt(tdx * tdx + tdy * tdy) < this.TATTOO_PARLOR_POS.radius;
      })(),
      // Gang state
      myGang: (() => {
        if (!bird.gangId) return null;
        const gang = this.gangs.get(bird.gangId);
        if (!gang) return null;
        const memberList = [];
        for (const [memberId, memberName] of gang.memberNames) {
          memberList.push({
            id: memberId,
            name: memberName,
            online: gang.members.has(memberId),
            isLeader: memberId === gang.leaderId,
          });
        }
        const enemyGang = gang.warWithGangId ? this.gangs.get(gang.warWithGangId) : null;
        return {
          id: gang.id,
          name: gang.name,
          tag: gang.tag,
          color: gang.color,
          leaderId: gang.leaderId,
          leaderName: gang.leaderName,
          treasury: gang.treasury,
          members: memberList,
          onlineCount: gang.members.size,
          warWithGangId: gang.warWithGangId,
          warWithGangName: enemyGang ? enemyGang.name : null,
          warWithGangTag: enemyGang ? enemyGang.tag : null,
          warEndsAt: gang.warEndsAt,
          warKills: gang.warKills,
          warEnemyKills: gang.warEnemyKills,
        };
      })(),
      gangInvite: (() => {
        const inv = this.gangInvites.get(bird.id);
        if (!inv || inv.expiresAt < now) return null;
        return {
          fromId: inv.fromId,
          fromName: inv.fromName,
          gangId: inv.gangId,
          gangName: inv.gangName,
          gangTag: inv.gangTag,
          gangColor: inv.gangColor,
        };
      })(),
      // All known gangs (for declaring war — pick a rival)
      allGangs: (() => {
        const list = [];
        for (const g of this.gangs.values()) {
          if (g.id === bird.gangId) continue;
          list.push({ id: g.id, name: g.name, tag: g.tag, color: g.color, onlineCount: g.members.size });
        }
        return list;
      })(),
      gangColors: this.GANG_COLORS,
    };
  }

  getEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }

  getLeaderboard() {
    return this._cachedLeaderboard;
  }

  _refreshLeaderboard() {
    // Live birds
    const live = [];
    for (const b of this.birds.values()) {
      live.push({
        name: b.name, type: b.type,
        total_poops: b.totalPoops, total_steals: b.totalSteals,
        total_hits: b.totalHits, humans_cried: b.humansCried,
        xp: b.xp, online: true,
      });
    }

    firestoreDb.getLeaderboard().then(saved => {
      const liveIds = new Set([...this.birds.values()].map(b => b.name));
      const merged = [...live];
      for (const s of saved) {
        if (!liveIds.has(s.name)) {
          merged.push({ ...s, online: false });
        }
      }
      merged.sort((a, b) => b.xp - a.xp);
      this._cachedLeaderboard = merged.slice(0, 20);
    }).catch(e => {
      // Fallback to live data only
      this._cachedLeaderboard = live.sort((a, b) => b.xp - a.xp).slice(0, 20);
    });
  }

  getStats() {
    return {
      playersOnline: this.birds.size,
      totalPoops: this.poops.size,
      npcsActive: this.npcs.size,
    };
  }

  _saveBird(bird) {
    firestoreDb.upsertBird({
      id: bird.id,
      name: bird.name,
      type: bird.type,
      xp: bird.xp,
      food: bird.food,
      shiny_things: bird.shinyThings || 0,
      total_poops: bird.totalPoops,
      total_steals: bird.totalSteals,
      total_hits: bird.totalHits,
      humans_cried: bird.humansCried,
      last_x: bird.x,
      last_y: bird.y,
      coins: bird.coins || 0,
      owned_skills: JSON.stringify(bird.ownedSkills || ['poop_barrage']),
      equipped_skills: JSON.stringify(bird.equippedSkills || ['poop_barrage']),
      bird_color: bird.birdColor || null,
      mafia_rep: bird.mafiaRep || 0,
      daily_date: bird.dailyDate || '',
      daily_progress: JSON.stringify(bird.dailyProgress || {}),
      daily_completed: JSON.stringify(bird.dailyCompleted || []),
      daily_streak: bird.dailyStreak || 0,
      daily_streak_date: bird.dailyStreakDate || '',
      gang_id: bird.gangId || null,
      gang_name: bird.gangName || null,
      gang_tag: bird.gangTag || null,
      gang_color: bird.gangColor || null,
      gang_role: bird.gangRole || null,
      tattoos_owned: JSON.stringify(bird.tattoosOwned || []),
      tattoos_equipped: JSON.stringify(bird.tattoosEquipped || []),
    }).catch(e => {
      console.error('[GameEngine] Failed to save bird:', e.message);
    });
  }

  saveAll() {
    for (const bird of this.birds.values()) {
      this._saveBird(bird);
    }
    // Clean old poops
    firestoreDb.cleanOldPoops().catch(e => { /* ignore */ });
  }

  destroy() {
    clearInterval(this.loop);
    clearInterval(this.saveLoop);
    clearInterval(this.foodRespawn);
    clearInterval(this._leaderboardInterval);
    this.saveAll();
  }

  // ============================================================
  // DAILY CHALLENGES
  // ============================================================

  _safeJsonParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  _getDailyDateString() {
    return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD' UTC
  }

  _refreshDailyChallengesIfNeeded() {
    const today = this._getDailyDateString();
    if (this.dailyChallengesDate === today) return;
    const prev = this.dailyChallengesDate;
    this.dailyChallengesDate = today;

    // Seeded selection: same 3 challenges for everyone on the same UTC day
    const seed = parseInt(today.replace(/-/g, ''), 10);
    const pool = [...DAILY_CHALLENGE_POOL];
    const selected = [];
    let s = seed;
    while (selected.length < 3 && pool.length > 0) {
      s = Math.abs((s * 1664525 + 1013904223) | 0);
      const idx = s % pool.length;
      selected.push(pool.splice(idx, 1)[0]);
    }
    this.dailyChallenges = selected;

    if (prev) {
      // Announce daily reset to all online birds
      this.events.push({
        type: 'daily_refresh',
        challenges: this.dailyChallenges.map(c => ({ id: c.id, title: c.title, desc: c.desc, target: c.target, reward: c.reward })),
      });
    }
  }

  _resetBirdDailyIfNeeded(bird) {
    const today = this.dailyChallengesDate;
    if (!today || bird.dailyDate === today) return;
    // Check streak continuation: did they finish all 3 yesterday?
    if (bird.dailyDate !== '') {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (bird.dailyStreakDate === yesterdayStr) {
        // Streak continues — already incremented on completion
      } else {
        // They didn't complete all 3 yesterday, or skipped a day
        bird.dailyStreak = 0;
      }
    }
    bird.dailyDate = today;
    bird.dailyProgress = {};
    bird.dailyCompleted = [];
    bird.dailyCoinEarned = 0;
  }

  _trackDailyProgress(bird, trackType, amount) {
    if (!this.dailyChallengesDate) return;
    this._resetBirdDailyIfNeeded(bird);
    for (const challenge of this.dailyChallenges) {
      if (challenge.trackType !== trackType) continue;
      if (bird.dailyCompleted.includes(challenge.id)) continue;
      bird.dailyProgress[challenge.id] = (bird.dailyProgress[challenge.id] || 0) + amount;
      if (bird.dailyProgress[challenge.id] >= challenge.target) {
        bird.dailyProgress[challenge.id] = challenge.target;
        this._completeDailyChallenge(bird, challenge);
      }
    }
  }

  _completeDailyChallenge(bird, challenge) {
    if (bird.dailyCompleted.includes(challenge.id)) return;
    bird.dailyCompleted.push(challenge.id);

    const streakMult = this._getDailyStreakMultiplier(bird.dailyStreak);
    const xpGain  = Math.floor(challenge.reward.xp    * streakMult);
    const coinsGain = Math.floor(challenge.reward.coins * streakMult);
    bird.xp    += xpGain;
    bird.coins += coinsGain;

    this.events.push({
      type: 'daily_challenge_complete',
      birdId: bird.id,
      birdName: bird.name,
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      xp: xpGain,
      coins: coinsGain,
      completedCount: bird.dailyCompleted.length,
      totalCount: this.dailyChallenges.length,
    });

    if (bird.dailyCompleted.length >= this.dailyChallenges.length) {
      const bonusXp    = 200;
      const bonusCoins = 100;
      bird.xp    += bonusXp;
      bird.coins += bonusCoins;
      // Increment streak
      bird.dailyStreak    = (bird.dailyStreak || 0) + 1;
      bird.dailyStreakDate = this.dailyChallengesDate;
      this.events.push({
        type: 'daily_all_complete',
        birdId: bird.id,
        birdName: bird.name,
        streak: bird.dailyStreak,
        bonusXp,
        bonusCoins,
      });
      this._saveBird(bird);
    }
  }

  _getDailyStreakMultiplier(streak) {
    if (!streak || streak < 2) return 1.0;
    if (streak < 4)  return 1.1;
    if (streak < 7)  return 1.25;
    return 1.5; // 7+ day streak
  }

  // Helper: find which territory zone contains point (x, y)
  _getZoneForPoint(x, y) {
    for (const zone of world.TERRITORY_ZONES) {
      if (x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
        return zone;
      }
    }
    return null;
  }


  // ============================================================
  // SKILL SYSTEM
  // ============================================================
  _handleUseSkill(bird, slot, now) {
    if (slot < 0 || slot >= bird.equippedSkills.length) return;
    const skillId = bird.equippedSkills[slot];
    if (!skillId) return;
    const catalog = world.SKILL_CATALOG[skillId];
    if (!catalog) return;

    // Check cooldown
    const lastUsed = bird.skillCooldowns[skillId] || 0;
    if (lastUsed + catalog.cooldown > now) return;

    // Execute skill
    bird.skillCooldowns[skillId] = now;

    if (skillId === 'poop_barrage') this._skillPoopBarrage(bird, now);
    else if (skillId === 'dive_bomb') this._skillDiveBomb(bird, now);
    else if (skillId === 'shadow_cloak') this._skillShadowCloak(bird, now);
    else if (skillId === 'eagle_eye') this._skillEagleEye(bird, now);
    else if (skillId === 'ground_pound') this._skillGroundPound(bird, now);
    else if (skillId === 'decoy') this._skillDecoy(bird, now);
    else if (skillId === 'speed_burst') this._skillSpeedBurst(bird, now);
    else if (skillId === 'beacon_call') this._skillBeaconCall(bird, now);

    this.events.push({ type: 'skill_used', birdId: bird.id, skill: skillId, x: bird.x, y: bird.y });
    // Also emit legacy event for backwards compat
    this.events.push({ type: 'ability_used', birdId: bird.id, ability: skillId, x: bird.x, y: bird.y });
  }

  _handleBuySkill(bird, skillId, now) {
    const catalog = world.SKILL_CATALOG[skillId];
    if (!catalog) return;
    if (bird.ownedSkills.includes(skillId)) return;
    if (bird.coins < catalog.cost) return;

    bird.coins -= catalog.cost;
    bird.ownedSkills.push(skillId);
    this._saveBird(bird);
    this.events.push({ type: 'skill_bought', birdId: bird.id, skillId });
  }

  _handleEquipSkill(bird, skillId, slot, now) {
    if (!bird.ownedSkills.includes(skillId)) return;
    // Validate slot based on level
    let maxSlots = 1;
    if (bird.level >= 10) maxSlots = 2;
    if (bird.level >= 25) maxSlots = 3;
    if (slot < 0 || slot >= maxSlots) return;

    // Ensure equippedSkills array is large enough
    while (bird.equippedSkills.length <= slot) {
      bird.equippedSkills.push(null);
    }
    bird.equippedSkills[slot] = skillId;
    this._saveBird(bird);
  }

  _skillPoopBarrage(bird, now) {
    const angles = [-30, -15, 0, 15, 30].map(d => d * (Math.PI / 180));
    let totalXP = 0;
    for (const angleOffset of angles) {
      const angle = bird.rotation + angleOffset;
      const dist = 20 + Math.random() * 20;
      const px = bird.x + Math.cos(angle) * dist;
      const py = bird.y + Math.sin(angle) * dist;
      const poopId = 'p_' + uid();
      const poop = {
        id: poopId,
        birdId: bird.id,
        x: px, y: py,
        hitTarget: null,
        time: now,
        isNew: true,
      };
      const hit = this._checkPoopHit(poop, false);
      poop.hitTarget = hit.target;
      this.poops.set(poopId, poop);
      bird.totalPoops++;

      let xpGain = 2;
      if (hit.target === 'npc') {
        xpGain = 15;
        bird.totalHits++;
        if (hit.npc) {
          hit.npc.poopedOn++;
          hit.npc.state = 'fleeing';
          hit.npc.stateTimer = 3;
          const fa = Math.random() * Math.PI * 2;
          hit.npc.targetX = hit.npc.x + Math.cos(fa) * 200;
          hit.npc.targetY = hit.npc.y + Math.sin(fa) * 200;
          hit.npc.speed = 80;
          if (hit.npc.poopedOn >= 3) {
            bird.humansCried++;
            xpGain = 30;
            this.events.push({ type: 'cry', npcId: hit.npc.id, x: hit.npc.x, y: hit.npc.y });
          }
        }
        bird.coins += 2;
      } else if (hit.target === 'car') { xpGain = 10; bird.coins += 1; }
      else if (hit.target === 'moving_car') { xpGain = 25; bird.coins += 3; }
      else if (hit.target === 'statue') { xpGain = 20; bird.coins += 2; }
      else if (hit.target === 'laundry') { xpGain = 25; bird.coins += 3; }
      else if (hit.target === 'bride') { xpGain = 100; bird.coins += 10; }
      else if (hit.target === 'event_npc') { xpGain = 15; bird.coins += 2; }

      // Barrage chaos/heat
      if (hit.target) {
        this._addChaos(hit.target === 'npc' ? 3 : 1);
        this._addHeat(bird.id, hit.target === 'npc' ? 3 : 1);
        this._addAreaChaos(poop.x, poop.y, 1);
      }

      bird.xp += xpGain;
      totalXP += xpGain;

      this.events.push({
        type: 'poop', poopId, birdId: bird.id,
        x: poop.x, y: poop.y,
        hitTarget: hit.target, xp: xpGain,
        isMegaPoop: false,
      });

      firestoreDb.savePoop(poopId, bird.id, poop.x, poop.y, hit.target, Math.floor(now / 1000)).catch(e => { /* ignore */ });
    }

    // Level check after barrage
    const newLevel = world.getLevelFromXP(bird.xp);
    const newType = world.getBirdTypeForLevel(newLevel);
    if (newType !== bird.type) {
      bird.type = newType;
      bird.level = newLevel;
      this.events.push({ type: 'evolve', birdId: bird.id, name: bird.name, birdType: newType });
    }
    bird.level = newLevel;
  }

  _skillDiveBomb(bird, now) {
    const speed = (world.BIRD_TYPES[bird.type] || world.BIRD_TYPES.pigeon).speed;
    bird.vx = Math.cos(bird.rotation) * speed * 2;
    bird.vy = Math.sin(bird.rotation) * speed * 2;
    bird.diveBombing = true;
    bird.diveBombUntil = now + 300;
  }

  _skillShadowCloak(bird, now) {
    bird.cloakedUntil = now + 8000;
  }

  _skillEagleEye(bird, now) {
    bird.eagleEyeUntil = now + 15000;
  }

  _skillGroundPound(bird, now) {
    let hitCount = 0;
    for (const npc of this.npcs.values()) {
      const dx = npc.x - bird.x;
      const dy = npc.y - bird.y;
      if (Math.sqrt(dx * dx + dy * dy) < 80) {
        npc.state = 'fleeing';
        npc.stateTimer = 3;
        const angle = Math.atan2(npc.y - bird.y, npc.x - bird.x);
        npc.targetX = npc.x + Math.cos(angle) * 150;
        npc.targetY = npc.y + Math.sin(angle) * 150;
        npc.speed = 100;
        hitCount++;
      }
    }
    bird.xp += hitCount * 5;
    bird.coins += hitCount;
    this.events.push({ type: 'ground_pound', birdId: bird.id, x: bird.x, y: bird.y, hitCount });
  }

  _skillDecoy(bird, now) {
    const decoyId = 'decoy_' + uid();
    const decoy = {
      id: decoyId,
      ownerId: bird.id,
      x: bird.x,
      y: bird.y,
      vx: bird.vx,
      vy: bird.vy,
      rotation: bird.rotation,
      type: bird.type,
      birdColor: bird.birdColor,
      expiresAt: now + 5000,
    };
    this.decoys.set(decoyId, decoy);
  }

  _skillSpeedBurst(bird, now) {
    bird.speedBurstUntil = now + 5000;
  }

  _skillBeaconCall(bird, now) {
    const beaconId = 'beacon_' + uid();
    this.beacons.set(beaconId, {
      x: bird.x,
      y: bird.y,
      birdId: bird.id,
      expiresAt: now + 30000,
    });
  }

  _updateDecoys(dt, now) {
    for (const [dId, d] of this.decoys) {
      if (now >= d.expiresAt) {
        this.decoys.delete(dId);
        continue;
      }
      // Move decoy in its direction
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      // Slow down
      d.vx *= 0.98;
      d.vy *= 0.98;
      // Keep in bounds
      d.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, d.x));
      d.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, d.y));
    }

    // Cat targeting of decoys is handled in _updateCat
  }

  _updateBeacons(now) {
    for (const [bId, b] of this.beacons) {
      if (now >= b.expiresAt) {
        this.beacons.delete(bId);
      }
    }
  }

  // ============================================================
  // FLOCK SYSTEM
  // ============================================================
  _generateFlockName() {
    const adjectives = ['Angry', 'Chaos', 'Turbo', 'Sneaky', 'Poop', 'Flying', 'Radical', 'Funky', 'Wild', 'Savage', 'Mega', 'Ultra', 'Chill', 'Spicy', 'Crispy'];
    const nouns = ['Pigeons', 'Crows', 'Seagulls', 'Eagles', 'Squadron', 'Bombers', 'Flockers', 'Rascals', 'Terrors', 'Legends', 'Noodles', 'Nuggets', 'Feathers', 'Beaks'];
    return adjectives[Math.floor(Math.random() * adjectives.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)];
  }

  _handleFlockInvite(bird, targetId, now) {
    if (!targetId) return;
    const target = this.birds.get(targetId);
    if (!target) return;
    // Must be within 150px OR near Date Center (lobby invite)
    const dc = world.DATE_CENTER;
    const dcDx = bird.x - (dc.x + dc.w / 2);
    const dcDy = bird.y - (dc.y + dc.h / 2);
    const nearDC = Math.sqrt(dcDx * dcDx + dcDy * dcDy) < 150;
    const dx = target.x - bird.x;
    const dy = target.y - bird.y;
    if (Math.sqrt(dx * dx + dy * dy) > 150 && !nearDC) return;
    // Can't invite someone already in a flock of 6
    if (target.flockId) {
      const flock = this.flocks.get(target.flockId);
      if (flock && flock.members.size >= 6) return;
    }
    if (bird.flockId) {
      const flock = this.flocks.get(bird.flockId);
      if (flock && flock.members.size >= 6) return;
    }

    const flockName = bird.flockId ? (this.flocks.get(bird.flockId) || {}).name || 'New Flock' : 'New Flock';
    this.flockInvites.set(targetId, {
      fromId: bird.id,
      toId: targetId,
      flockId: bird.flockId,
      flockName,
      expiresAt: now + 15000,
    });
    this.events.push({ type: 'flock_invite', fromId: bird.id, toId: targetId, flockName });
  }

  _handleFlockAccept(bird, now) {
    const invite = this.flockInvites.get(bird.id);
    if (!invite || invite.expiresAt < now) {
      this.flockInvites.delete(bird.id);
      return;
    }
    const inviter = this.birds.get(invite.fromId);
    if (!inviter) {
      this.flockInvites.delete(bird.id);
      return;
    }

    let flock;
    if (inviter.flockId && this.flocks.has(inviter.flockId)) {
      flock = this.flocks.get(inviter.flockId);
    } else {
      // Create new flock
      const flockId = 'flock_' + uid();
      flock = {
        id: flockId,
        name: this._generateFlockName(),
        leaderId: inviter.id,
        members: new Set([inviter.id]),
        createdAt: now,
      };
      this.flocks.set(flockId, flock);
      inviter.flockId = flockId;
      inviter.flockName = flock.name;
    }

    if (flock.members.size >= 6) {
      this.flockInvites.delete(bird.id);
      return;
    }

    // If bird is in another flock, leave it
    if (bird.flockId && bird.flockId !== flock.id) {
      this._handleFlockLeave(bird);
    }

    flock.members.add(bird.id);
    bird.flockId = flock.id;
    bird.flockName = flock.name;
    this.flockInvites.delete(bird.id);

    this.events.push({ type: 'flock_joined', birdId: bird.id, birdName: bird.name, flockName: flock.name });
  }

  _handleFlockLeave(bird) {
    if (!bird.flockId) return;
    const flock = this.flocks.get(bird.flockId);
    if (flock) {
      flock.members.delete(bird.id);
      if (flock.members.size === 0) {
        this.flocks.delete(flock.id);
      } else if (flock.leaderId === bird.id) {
        flock.leaderId = flock.members.values().next().value;
      }
    }
    bird.flockId = null;
    bird.flockName = null;
  }

  _cleanupFlockInvites(now) {
    for (const [targetId, invite] of this.flockInvites) {
      if (invite.expiresAt < now) {
        this.flockInvites.delete(targetId);
      }
    }
  }

  // ============================================================
  // BIRD GANGS — persistent criminal crews
  // ============================================================

  async _loadGangs() {
    try {
      const allGangs = await firestoreDb.getAllGangs();
      for (const g of allGangs) {
        this.gangs.set(g.id, {
          id: g.id,
          name: g.name,
          tag: g.tag,
          color: g.color,
          leaderId: g.leader_id,
          leaderName: g.leader_name,
          treasury: g.treasury || 0,
          members: new Set(),           // rebuilt as birds join
          memberNames: new Map(Object.entries(g.member_names || {})),
          warWithGangId: null,
          warEndsAt: 0,
          warKills: 0,
          warEnemyKills: 0,
          createdAt: g.created_at || 0,
        });
      }
      console.log(`[GameEngine] Loaded ${this.gangs.size} gangs from Firestore`);
    } catch (e) {
      console.log('[GameEngine] No gangs to load:', e.message);
    }
  }

  _saveGang(gang) {
    const memberNamesObj = {};
    for (const [id, name] of gang.memberNames) {
      memberNamesObj[id] = name;
    }
    firestoreDb.upsertGang({
      id: gang.id,
      name: gang.name,
      tag: gang.tag,
      color: gang.color,
      leaderId: gang.leaderId,
      leaderName: gang.leaderName,
      treasury: gang.treasury,
      memberNames: memberNamesObj,
      createdAt: gang.createdAt,
    }).catch(e => console.error('[GameEngine] Failed to save gang:', e.message));
  }

  _handleGangCreate(bird, tag, name, now) {
    if (bird.gangId) return; // already in a gang
    if (bird.coins < 200) return; // not enough coins

    // Validate tag: exactly 3 uppercase letters
    if (!tag || !/^[A-Z]{3}$/.test(tag)) return;
    // Validate name: 3-30 chars, no offensive content (basic)
    const cleanName = (name || '').trim().slice(0, 30);
    if (cleanName.length < 3) return;
    // Check tag uniqueness
    for (const g of this.gangs.values()) {
      if (g.tag === tag) {
        this.events.push({ type: 'gang_error', birdId: bird.id, msg: `[${tag}] is already taken.` });
        return;
      }
    }

    // Pick color based on gang count
    const color = this.GANG_COLORS[this.gangs.size % this.GANG_COLORS.length];

    bird.coins -= 200;
    const gangId = 'gang_' + uid();
    const gang = {
      id: gangId,
      name: cleanName,
      tag: tag,
      color: color,
      leaderId: bird.id,
      leaderName: bird.name,
      treasury: 0,
      members: new Set([bird.id]),
      memberNames: new Map([[bird.id, bird.name]]),
      warWithGangId: null,
      warEndsAt: 0,
      warKills: 0,
      warEnemyKills: 0,
      createdAt: now,
    };
    this.gangs.set(gangId, gang);

    bird.gangId = gangId;
    bird.gangName = cleanName;
    bird.gangTag = tag;
    bird.gangColor = color;
    bird.gangRole = 'leader';

    this._saveBird(bird);
    this._saveGang(gang);

    this.events.push({
      type: 'gang_created',
      birdId: bird.id, birdName: bird.name,
      gangId, gangName: cleanName, gangTag: tag, gangColor: color,
    });
  }

  _handleGangInvite(bird, targetId, now) {
    if (!bird.gangId) return;
    if (bird.gangRole !== 'leader') return; // only leaders can invite
    const gang = this.gangs.get(bird.gangId);
    if (!gang) return;
    if (gang.members.size >= 20) return; // max 20 members

    const target = this.birds.get(targetId);
    if (!target) return;
    if (target.gangId) {
      this.events.push({ type: 'gang_error', birdId: bird.id, msg: `${target.name} is already in a gang.` });
      return;
    }

    // Proximity check (150px)
    const dx = target.x - bird.x;
    const dy = target.y - bird.y;
    if (Math.sqrt(dx * dx + dy * dy) > 150) return;

    this.gangInvites.set(targetId, {
      fromId: bird.id,
      fromName: bird.name,
      gangId: gang.id,
      gangName: gang.name,
      gangTag: gang.tag,
      gangColor: gang.color,
      expiresAt: now + 20000,
    });
    this.events.push({
      type: 'gang_invite',
      fromId: bird.id, fromName: bird.name,
      toId: targetId,
      gangName: gang.name, gangTag: gang.tag, gangColor: gang.color,
    });
  }

  _handleGangAccept(bird, now) {
    const invite = this.gangInvites.get(bird.id);
    if (!invite || invite.expiresAt < now) {
      this.gangInvites.delete(bird.id);
      return;
    }
    if (bird.gangId) {
      this.gangInvites.delete(bird.id);
      return;
    }
    const gang = this.gangs.get(invite.gangId);
    if (!gang || gang.members.size >= 20) {
      this.gangInvites.delete(bird.id);
      return;
    }

    gang.members.add(bird.id);
    gang.memberNames.set(bird.id, bird.name);

    bird.gangId = gang.id;
    bird.gangName = gang.name;
    bird.gangTag = gang.tag;
    bird.gangColor = gang.color;
    bird.gangRole = 'member';

    this.gangInvites.delete(bird.id);
    this._saveBird(bird);
    this._saveGang(gang);

    this.events.push({
      type: 'gang_joined',
      birdId: bird.id, birdName: bird.name,
      gangId: gang.id, gangName: gang.name, gangTag: gang.tag,
    });
  }

  _handleGangLeave(bird) {
    if (!bird.gangId) return;
    const gang = this.gangs.get(bird.gangId);
    if (gang) {
      gang.members.delete(bird.id);
      gang.memberNames.delete(bird.id);
      // Leadership transfer or disband
      if (gang.leaderId === bird.id) {
        if (gang.memberNames.size === 0) {
          // Disband — no members left
          this.gangs.delete(gang.id);
          firestoreDb.deleteGang(gang.id).catch(() => {});
          this.events.push({ type: 'gang_disbanded', gangName: gang.name, gangTag: gang.tag });
        } else {
          // Transfer leadership to first remaining member
          const newLeaderId = gang.memberNames.keys().next().value;
          gang.leaderId = newLeaderId;
          gang.leaderName = gang.memberNames.get(newLeaderId);
          this._saveGang(gang);
          // Update new leader's role if online
          const newLeader = this.birds.get(newLeaderId);
          if (newLeader) {
            newLeader.gangRole = 'leader';
            this._saveBird(newLeader);
          }
        }
      } else {
        this._saveGang(gang);
      }
    }
    bird.gangId = null;
    bird.gangName = null;
    bird.gangTag = null;
    bird.gangColor = null;
    bird.gangRole = null;
    this._saveBird(bird);
  }

  _handleGangDeposit(bird, amount, now) {
    if (!bird.gangId) return;
    const gang = this.gangs.get(bird.gangId);
    if (!gang) return;
    const amt = Math.floor(Math.min(amount, bird.coins, 5000));
    if (amt <= 0) return;
    bird.coins -= amt;
    gang.treasury += amt;
    this._saveBird(bird);
    this._saveGang(gang);
    this.events.push({
      type: 'gang_deposit',
      birdId: bird.id, birdName: bird.name,
      gangTag: gang.tag, gangName: gang.name,
      amount: amt, treasury: gang.treasury,
    });
  }

  _handleGangDeclareWar(bird, rivalGangId, now) {
    if (!bird.gangId || bird.gangRole !== 'leader') return;
    const myGang = this.gangs.get(bird.gangId);
    if (!myGang) return;
    if (myGang.warWithGangId) {
      this.events.push({ type: 'gang_error', birdId: bird.id, msg: 'You are already at war!' });
      return;
    }
    const rivalGang = this.gangs.get(rivalGangId);
    if (!rivalGang) return;
    if (rivalGang.members.size === 0) {
      this.events.push({ type: 'gang_error', birdId: bird.id, msg: 'Rival gang has no online members.' });
      return;
    }

    const WAR_DURATION = 10 * 60 * 1000; // 10 minutes
    myGang.warWithGangId = rivalGangId;
    myGang.warEndsAt = now + WAR_DURATION;
    myGang.warKills = 0;
    myGang.warEnemyKills = 0;

    rivalGang.warWithGangId = bird.gangId;
    rivalGang.warEndsAt = now + WAR_DURATION;
    rivalGang.warKills = 0;
    rivalGang.warEnemyKills = 0;

    // Clear existing gang war hits
    for (const key of [...this.gangWarHits.keys()]) {
      this.gangWarHits.delete(key);
    }

    this.events.push({
      type: 'gang_war_declared',
      gang1Id: bird.gangId, gang1Name: myGang.name, gang1Tag: myGang.tag, gang1Color: myGang.color,
      gang2Id: rivalGangId, gang2Name: rivalGang.name, gang2Tag: rivalGang.tag, gang2Color: rivalGang.color,
      endsAt: myGang.warEndsAt,
    });
  }

  _handleGangDistribute(bird, now) {
    if (!bird.gangId || bird.gangRole !== 'leader') return;
    const gang = this.gangs.get(bird.gangId);
    if (!gang || gang.treasury <= 0) return;

    const onlineMembers = [...gang.members].map(id => this.birds.get(id)).filter(Boolean);
    if (onlineMembers.length === 0) return;

    const perMember = Math.floor(gang.treasury / onlineMembers.length);
    if (perMember <= 0) return;

    const totalPaid = perMember * onlineMembers.length;
    gang.treasury -= totalPaid;

    for (const member of onlineMembers) {
      member.coins += perMember;
      this._saveBird(member);
    }
    this._saveGang(gang);

    this.events.push({
      type: 'gang_treasury_distributed',
      gangTag: gang.tag, gangName: gang.name,
      perMember, memberCount: onlineMembers.length, total: totalPaid,
    });
  }

  _handleGangWarHit(attacker, target, now) {
    if (!attacker.gangId || !target.gangId) return;
    const hitKey = `${attacker.id}_${target.id}`;
    const count = (this.gangWarHits.get(hitKey) || 0) + 1;
    this.gangWarHits.set(hitKey, count);

    this.events.push({
      type: 'gang_war_hit',
      attackerId: attacker.id, attackerName: attacker.name, attackerTag: attacker.gangTag,
      targetId: target.id, targetName: target.name, targetTag: target.gangTag,
      hits: count, hitsNeeded: 3,
    });

    if (count >= 3) {
      // KILL!
      this.gangWarHits.delete(hitKey);

      const loot = Math.min(Math.floor(target.coins * 0.18), 150);
      target.coins = Math.max(0, target.coins - loot);
      attacker.coins += loot + 80;
      attacker.xp += 150;
      target.comboCount = 0;
      target.stunnedUntil = now + 2000;

      const myGang = this.gangs.get(attacker.gangId);
      const enemyGang = this.gangs.get(target.gangId);
      if (myGang) myGang.warKills = (myGang.warKills || 0) + 1;
      if (enemyGang) enemyGang.warEnemyKills = (enemyGang.warEnemyKills || 0) + 1;

      this.events.push({
        type: 'gang_war_kill',
        attackerId: attacker.id, attackerName: attacker.name, attackerGangTag: attacker.gangTag, attackerGangColor: attacker.gangColor,
        targetId: target.id, targetName: target.name, targetGangTag: target.gangTag,
        loot,
      });
    }
  }

  _tickGangWars(now) {
    for (const gang of this.gangs.values()) {
      if (gang.warWithGangId && now >= gang.warEndsAt) {
        const rivalGang = this.gangs.get(gang.warWithGangId);
        // Determine winner
        const myKills = gang.warKills || 0;
        const enemyKills = gang.warEnemyKills || 0;
        let winnerId = null, loserId = null;
        if (myKills > enemyKills) {
          winnerId = gang.id; loserId = gang.warWithGangId;
        } else if (enemyKills > myKills) {
          winnerId = gang.warWithGangId; loserId = gang.id;
        }
        const winner = winnerId ? this.gangs.get(winnerId) : null;
        const loser  = loserId  ? this.gangs.get(loserId)  : null;

        // Victory bonus from loser treasury (20%)
        if (winner && loser && loser.treasury > 0) {
          const loot = Math.floor(loser.treasury * 0.2);
          loser.treasury -= loot;
          winner.treasury += loot;
          this._saveGang(winner);
          this._saveGang(loser);
        }

        this.events.push({
          type: 'gang_war_ended',
          gang1Id: gang.id, gang1Name: gang.name, gang1Tag: gang.tag, gang1Kills: myKills,
          gang2Id: gang.warWithGangId, gang2Name: rivalGang ? rivalGang.name : '???', gang2Tag: rivalGang ? rivalGang.tag : '???', gang2Kills: enemyKills,
          winnerId, winnerName: winner ? winner.name : null, winnerTag: winner ? winner.tag : null,
        });

        // Clear war state on both gangs
        gang.warWithGangId = null;
        gang.warEndsAt = 0;
        gang.warKills = 0;
        gang.warEnemyKills = 0;
        if (rivalGang) {
          rivalGang.warWithGangId = null;
          rivalGang.warEndsAt = 0;
          rivalGang.warKills = 0;
          rivalGang.warEnemyKills = 0;
        }
      }
    }
  }

  // ============================================================
  // MISSION SYSTEM
  // ============================================================
  _getMissionDefs() {
    return [
      { id: 'cat_hunt', title: 'Cat Hunt', desc: 'Mob the cat with your flock', minPlayers: 3, type: 'group', objective: { type: 'mob_cat', count: 1 }, timeLimit: 60000, xpReward: 50 },
      { id: 'highway_havoc', title: 'Highway Havoc', desc: 'Poop on 5 moving cars', minPlayers: 1, type: 'solo', objective: { type: 'poop_moving_cars', count: 5 }, timeLimit: 60000, xpReward: 40 },
      { id: 'statue_sniper', title: 'Statue Sniper', desc: 'Hit the statue 3 times', minPlayers: 1, type: 'solo', objective: { type: 'poop_statue', count: 3 }, timeLimit: 45000, xpReward: 30 },
      { id: 'food_run', title: 'Food Run', desc: 'Steal 5 foods in 90 seconds', minPlayers: 1, type: 'solo', objective: { type: 'steal_food', count: 5 }, timeLimit: 90000, xpReward: 35 },
      { id: 'speed_demon', title: 'Speed Demon', desc: 'Fly far and fast', minPlayers: 1, type: 'solo', objective: { type: 'fly_distance', count: 1 }, timeLimit: 15000, xpReward: 25 },
      { id: 'poop_spree', title: 'Poop Spree', desc: 'Hit 10 NPCs', minPlayers: 1, type: 'solo', objective: { type: 'poop_npcs', count: 10 }, timeLimit: 60000, xpReward: 45 },
      { id: 'flock_poop', title: 'Flock Bombing', desc: 'Flock poops on 20 NPCs together', minPlayers: 2, type: 'group', objective: { type: 'flock_poop_npcs', count: 20 }, timeLimit: 90000, xpReward: 60 },
    ];
  }

  _getMissionDef(missionId) {
    return this._getMissionDefs().find(m => m.id === missionId) || null;
  }

  _generateMissionBoard() {
    const allDefs = this._getMissionDefs();
    const soloMissions = allDefs.filter(m => m.type === 'solo');
    const groupMissions = allDefs.filter(m => m.type === 'group');

    const board = [];
    // At least 1 solo
    const solo = soloMissions[Math.floor(Math.random() * soloMissions.length)];
    board.push(solo);

    // At least 1 group if enough players online
    if (this.birds.size >= 2 && groupMissions.length > 0) {
      const group = groupMissions[Math.floor(Math.random() * groupMissions.length)];
      board.push(group);
    }

    // Fill to 3
    const remaining = allDefs.filter(m => !board.find(b => b.id === m.id));
    while (board.length < 3 && remaining.length > 0) {
      const idx = Math.floor(Math.random() * remaining.length);
      board.push(remaining.splice(idx, 1)[0]);
    }

    this.missionBoard = board;
  }

  _updateMissionBoard(now) {
    if (now >= this.missionBoardRefreshTimer) {
      this._generateMissionBoard();
      this.missionBoardRefreshTimer = now + this._randomRange(180000, 300000); // 3-5 min
    }
  }

  _handleAcceptMission(bird, missionId, now) {
    // Must be near Date Center
    const dc = world.DATE_CENTER;
    const dx = bird.x - (dc.x + dc.w / 2);
    const dy = bird.y - (dc.y + dc.h / 2);
    if (Math.sqrt(dx * dx + dy * dy) > 120) return;

    // Check if mission is on the board
    const boardMission = this.missionBoard.find(m => m.id === missionId);
    if (!boardMission) return;

    // Already has active mission
    if (bird.activeMission) return;

    bird.activeMission = {
      missionId: missionId,
      progress: 0,
      startedAt: now,
    };

    // For group missions, auto-join flock mates who are nearby
    if (boardMission.type === 'group' && bird.flockId) {
      for (const otherBird of this.birds.values()) {
        if (otherBird.id === bird.id || otherBird.flockId !== bird.flockId) continue;
        if (otherBird.activeMission) continue;
        const fdx = otherBird.x - bird.x;
        const fdy = otherBird.y - bird.y;
        if (Math.sqrt(fdx * fdx + fdy * fdy) < 200) {
          otherBird.activeMission = {
            missionId: missionId,
            progress: 0,
            startedAt: now,
          };
        }
      }
    }

    this.events.push({ type: 'mission_accepted', birdId: bird.id, missionId, title: boardMission.title });
  }

  // ============================================================
  // PIGEON MAFIA DON
  // ============================================================
  _getDonJobDefs() {
    return [
      {
        id: 'don_hit',
        title: 'The Hit',
        desc: 'Poop on 8 targets within 90 seconds. Any target counts.',
        objective: { type: 'poop_targets', count: 8 },
        timeLimit: 90000,
        coinReward: 120,
        xpReward: 60,
        repReward: 1,
      },
      {
        id: 'don_getaway',
        title: 'The Getaway',
        desc: 'Reach 3 wanted stars and survive for 20 seconds at that level.',
        objective: { type: 'survive_wanted', count: 1 },
        timeLimit: 120000,
        coinReward: 150,
        xpReward: 80,
        repReward: 1,
      },
      {
        id: 'don_spray',
        title: 'The Spray Contract',
        desc: 'Tag 4 buildings with graffiti within 5 minutes.',
        objective: { type: 'spray_buildings', count: 4 },
        timeLimit: 300000,
        coinReward: 100,
        xpReward: 50,
        repReward: 1,
      },
      {
        id: 'don_heist',
        title: 'The Heist Cut',
        desc: 'Participate in a food truck heist to get your cut.',
        objective: { type: 'heist_participate', count: 1 },
        timeLimit: 600000,
        coinReward: 180,
        xpReward: 90,
        repReward: 1,
      },
      {
        id: 'don_cars',
        title: 'The Car Bomb',
        desc: 'Poop on 5 moving cars within 90 seconds.',
        objective: { type: 'poop_cars', count: 5 },
        timeLimit: 90000,
        coinReward: 130,
        xpReward: 65,
        repReward: 1,
      },
    ];
  }

  _getDonJobDef(jobId) {
    return this._getDonJobDefs().find(j => j.id === jobId) || null;
  }

  _getMafiaTitle(rep) {
    if (rep >= 50) return 'The Don';
    if (rep >= 30) return 'Capo';
    if (rep >= 15) return 'Made Bird';
    if (rep >= 7) return 'Associate';
    if (rep >= 3) return 'Thug';
    return null;
  }

  _updateDon(now) {
    // Rotate the Don's current job every 8 minutes
    if (now >= this.donJobTimer) {
      const defs = this._getDonJobDefs();
      // Pick a random job, avoid repeating the same one if possible
      let candidates = defs;
      if (this.donCurrentJob) {
        candidates = defs.filter(d => d.id !== this.donCurrentJob.id);
      }
      this.donCurrentJob = candidates[Math.floor(Math.random() * candidates.length)];
      this.donJobTimer = now + 480000; // 8 minutes
      this.events.push({ type: 'don_job_rotated', title: this.donCurrentJob.title });
    }

    // Check active don missions for timeout and getaway survival
    for (const bird of this.birds.values()) {
      if (!bird.donMission) continue;
      const def = this._getDonJobDef(bird.donMission.jobId);
      if (!def) { bird.donMission = null; continue; }

      // Timeout check
      if (now > bird.donMission.startedAt + def.timeLimit) {
        this.events.push({ type: 'don_mission_failed', birdId: bird.id, title: def.title });
        bird.donMission = null;
        continue;
      }

      // Getaway survival tracking
      if (bird.donMission.jobId === 'don_getaway') {
        const heat = this.heatScores.get(bird.id) || 0;
        const level = this._getWantedLevel(heat);
        if (level >= 3) {
          if (!bird.donMission.survivalStarted) {
            bird.donMission.survivalStarted = now;
          } else if (now - bird.donMission.survivalStarted >= 20000) {
            // Survived 20s at 3+ stars — mission complete
            bird.donMission.progress = 1;
            this._checkDonMissionComplete(bird, now);
          }
        } else {
          // Dropped below 3 stars — reset survival timer
          bird.donMission.survivalStarted = null;
        }
      }
    }
  }

  _handleDonAccept(bird, now) {
    // Proximity check
    const dx = bird.x - world.DON_POS.x;
    const dy = bird.y - world.DON_POS.y;
    if (Math.sqrt(dx * dx + dy * dy) > 120) return;

    // Must have a current job
    if (!this.donCurrentJob) return;

    // Already has an active don mission
    if (bird.donMission) return;

    bird.donMission = {
      jobId: this.donCurrentJob.id,
      progress: 0,
      startedAt: now,
      survivalStarted: null,
    };

    this.events.push({
      type: 'don_mission_accepted',
      birdId: bird.id,
      birdName: bird.name,
      jobId: this.donCurrentJob.id,
      title: this.donCurrentJob.title,
    });
  }

  _checkDonMissionComplete(bird, now) {
    if (!bird.donMission) return;
    const def = this._getDonJobDef(bird.donMission.jobId);
    if (!def) return;
    const target = def.objective.count || 1;
    if (bird.donMission.progress < target) return;

    // Mission complete!
    const coinReward = def.coinReward + Math.floor((bird.mafiaRep || 0) * 5); // rep bonus
    const xpReward = def.xpReward;
    const repReward = def.repReward;

    bird.coins += coinReward;
    bird.xp += xpReward;
    bird.mafiaRep = (bird.mafiaRep || 0) + repReward;

    const newTitle = this._getMafiaTitle(bird.mafiaRep);
    const oldTitle = this._getMafiaTitle(bird.mafiaRep - repReward);

    this.events.push({
      type: 'don_mission_complete',
      birdId: bird.id,
      birdName: bird.name,
      title: def.title,
      coinReward,
      xpReward,
      repReward,
      newRep: bird.mafiaRep,
      newTitle,
      titleUnlocked: newTitle !== oldTitle ? newTitle : null,
    });

    bird.donMission = null;
    // Daily challenge: Don contract completed
    this._trackDailyProgress(bird, 'don_contract', 1);
    this._trackDailyProgress(bird, 'coins_earned', coinReward);
    this._saveBird(bird);
  }

  // ============================================================
  // HIT CONTRACTS
  // ============================================================
  _handlePlaceHit(bird, action, now) {
    const HIT_COST = 100;
    const BASE_REWARD = 250;

    // Must be near The Don
    const ddx = bird.x - world.DON_POS.x;
    const ddy = bird.y - world.DON_POS.y;
    if (Math.sqrt(ddx * ddx + ddy * ddy) > 120) return;

    if (bird.coins < HIT_COST) return;

    const targetId = action.targetId;
    if (!targetId || targetId === bird.id) return;

    const target = this.birds.get(targetId);
    if (!target) return;

    // Only one active hit per target at a time
    if (this.activeHits.has(targetId)) return;

    bird.coins -= HIT_COST;
    const reward = BASE_REWARD + Math.floor((bird.mafiaRep || 0) * 4); // higher rep = bigger bounty

    this.activeHits.set(targetId, {
      id: ++this._hitCounter,
      contractorId: bird.id,
      contractorName: bird.name,
      targetId,
      targetName: target.name,
      reward,
      hitProgress: new Map(), // hitmanId -> count of hits on target
      hitsNeeded: 3,
      expiresAt: now + 300000, // 5 minutes
    });

    this.events.push({
      type: 'hit_placed',
      contractorId: bird.id,
      contractorName: bird.name,
      targetId,
      targetName: target.name,
      reward,
    });
  }

  _updateActiveHits(now) {
    for (const [targetId, hit] of this.activeHits) {
      if (now > hit.expiresAt) {
        // Partial refund to contractor
        const contractor = this.birds.get(hit.contractorId);
        if (contractor) contractor.coins += 50;
        this.events.push({
          type: 'hit_expired',
          targetName: hit.targetName,
          contractorName: hit.contractorName,
        });
        this.activeHits.delete(targetId);
      }
    }
    // Remove hits for birds that disconnected
    for (const [targetId] of this.activeHits) {
      if (!this.birds.has(targetId)) {
        this.activeHits.delete(targetId);
      }
    }
  }

  // ============================================================
  // CHAOS METER
  // ============================================================
  _addChaos(amount) {
    this.chaosMeter = Math.min(100, this.chaosMeter + amount);
  }

  _updateChaosMeter(dt, now) {
    // Trigger chaos event at 100 (check before decay)
    if (this.chaosMeter >= 100 && !this.chaosEvent) {
      this._triggerChaosEvent(now);
      this.chaosMeter = 0;
      return;
    }

    // Decay: -0.5 per second
    this.chaosMeter = Math.max(0, this.chaosMeter - 0.5 * dt);
  }

  _triggerChaosEvent(now) {
    const types = ['npc_flood', 'car_frenzy', 'golden_rain'];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === 'npc_flood') {
      this.chaosEvent = { type: 'npc_flood', endsAt: now + 30000, data: {} };
      // Spawn 50 walker NPCs
      for (let i = 0; i < 50; i++) {
        const areas = world.NPC_TYPES.walker.spawnAreas;
        const area = areas[Math.floor(Math.random() * areas.length)];
        const npc = {
          id: 'chaos_npc_' + uid(),
          type: 'walker',
          x: area.x + Math.random() * area.w,
          y: area.y + Math.random() * area.h,
          targetX: 0, targetY: 0,
          speed: world.NPC_TYPES.walker.speed + Math.random() * 15,
          state: 'walking',
          stateTimer: 0,
          poopedOn: 0,
          hasFood: Math.random() > 0.5,
        };
        this._setNPCTarget(npc);
        this.chaosEventNPCs.set(npc.id, npc);
      }
      console.log('[GameEngine] CHAOS EVENT: NPC FLOOD!');
    } else if (type === 'car_frenzy') {
      this.chaosEvent = { type: 'car_frenzy', endsAt: now + 20000, data: { originalSpeeds: {} } };
      // Double all moving car speeds
      for (const car of this.movingCars) {
        this.chaosEvent.data.originalSpeeds[car.id] = car.speed;
        car.speed *= 2;
      }
      console.log('[GameEngine] CHAOS EVENT: CAR FRENZY!');
    } else if (type === 'golden_rain') {
      this.chaosEvent = { type: 'golden_rain', endsAt: now + 20000, data: {} };
      // Spawn 40 golden food items
      for (let i = 0; i < 40; i++) {
        const food = {
          id: 'golden_' + uid(),
          x: 100 + Math.random() * (world.WORLD_WIDTH - 200),
          y: 100 + Math.random() * (world.WORLD_HEIGHT - 200),
          type: 'golden',
          value: 15,
          coinValue: 5,
          respawnAt: null,
          active: true,
          isGolden: true,
        };
        this.chaosEventFoods.set(food.id, food);
      }
      console.log('[GameEngine] CHAOS EVENT: GOLDEN RAIN!');
    }

    this.events.push({ type: 'chaos_event', chaosType: type, duration: type === 'npc_flood' ? 30000 : 20000 });
  }

  _updateChaosEvent(dt, now) {
    if (!this.chaosEvent) return;

    if (now >= this.chaosEvent.endsAt) {
      // End chaos event
      if (this.chaosEvent.type === 'npc_flood') {
        this.chaosEventNPCs.clear();
      } else if (this.chaosEvent.type === 'car_frenzy') {
        // Restore original speeds
        for (const car of this.movingCars) {
          if (this.chaosEvent.data.originalSpeeds[car.id]) {
            car.speed = this.chaosEvent.data.originalSpeeds[car.id];
          }
        }
      } else if (this.chaosEvent.type === 'golden_rain') {
        this.chaosEventFoods.clear();
      }
      this.events.push({ type: 'chaos_event_end', chaosType: this.chaosEvent.type });
      this.chaosEvent = null;
      return;
    }

    // Update chaos event NPCs
    if (this.chaosEvent.type === 'npc_flood') {
      for (const npc of this.chaosEventNPCs.values()) {
        this._updateNPC(npc, dt, now);
      }
    }

    // Car frenzy: constant honking
    if (this.chaosEvent.type === 'car_frenzy') {
      for (const car of this.movingCars) {
        if (car.honkCooldown <= 0) {
          car.honkCooldown = 1; // honk every second
          this.events.push({ type: 'honk', x: car.x, y: car.y });
        }
      }
    }

    // Golden rain: check bird pickup
    if (this.chaosEvent.type === 'golden_rain') {
      for (const [fId, food] of this.chaosEventFoods) {
        if (!food.active) continue;
        for (const bird of this.birds.values()) {
          if (!bird.input.e || now - bird.lastSteal <= 1000) continue;
          const dx = bird.x - food.x;
          const dy = bird.y - food.y;
          if (Math.sqrt(dx * dx + dy * dy) < 60) {
            food.active = false;
            this.chaosEventFoods.delete(fId);
            bird.xp += food.value;
            bird.coins += (food.coinValue || 5);
            bird.food += food.value;
            bird.totalSteals++;
            bird.lastSteal = now;
            this.events.push({
              type: 'steal', birdId: bird.id, foodId: food.id,
              foodType: 'golden', x: food.x, y: food.y, value: food.value,
            });
            break;
          }
        }
      }
    }
  }

  // ============================================================
  // BLACK MARKET
  // ============================================================
  _updateBlackMarket(dt, now) {
    const isNight = this.dayPhase === 'night' || this.dayPhase === 'dusk';
    const wasOpen = this.blackMarket !== null;

    if (isNight && !wasOpen) {
      this.blackMarket = { x: this.BLACK_MARKET_POS.x, y: this.BLACK_MARKET_POS.y };
      this.events.push({ type: 'blackmarket_open', x: this.blackMarket.x, y: this.blackMarket.y });
      console.log('[GameEngine] 🐀 Black Market OPENED');
    } else if (!isNight && wasOpen) {
      this.blackMarket = null;
      this.events.push({ type: 'blackmarket_close' });
      console.log('[GameEngine] 🐀 Black Market CLOSED');
    }
  }

  _handleBlackMarketBuy(bird, itemId, now) {
    if (!this.blackMarket) {
      this.events.push({ type: 'blackmarket_fail', birdId: bird.id, reason: 'The market is closed. Come back at night.' });
      return;
    }
    const dx = bird.x - this.blackMarket.x;
    const dy = bird.y - this.blackMarket.y;
    if (Math.sqrt(dx * dx + dy * dy) > 110) {
      this.events.push({ type: 'blackmarket_fail', birdId: bird.id, reason: 'Fly closer to the market.' });
      return;
    }
    const item = this.BLACK_MARKET_CATALOG.find(i => i.id === itemId);
    if (!item) return;
    if (bird.coins < item.cost) {
      this.events.push({ type: 'blackmarket_fail', birdId: bird.id, reason: 'Not enough coins. Need ' + item.cost + 'c.' });
      return;
    }

    bird.coins -= item.cost;

    switch (itemId) {
      case 'speed_serum':
        bird.bmSpeedUntil = now + 30000;
        break;
      case 'mega_poop':
        bird.bmMegaPoops = (bird.bmMegaPoops || 0) + 3;
        break;
      case 'disguise_kit':
        // Instantly wipe all heat and despawn any cops targeting this bird
        this.heatScores.delete(bird.id);
        if (this.wantedBirdId === bird.id) {
          this.wantedBirdId = null;
          this.copBirds.clear();
        } else {
          for (const [cid, cop] of this.copBirds) {
            if (cop.targetBirdId === bird.id) this.copBirds.delete(cid);
          }
        }
        break;
      case 'smoke_bomb':
        bird.bmSmokeBombUntil = now + 15000;
        break;
      case 'lucky_charm':
        bird.bmDoubleXpUntil = now + 300000; // 5 min
        break;
    }

    this.events.push({ type: 'blackmarket_purchased', birdId: bird.id, itemId, itemName: item.name, cost: item.cost, emoji: item.emoji });
    console.log(`[GameEngine] 🐀 ${bird.name} bought ${item.name} for ${item.cost}c`);
  }

  // ============================================================
  // PIGEONHOLE SLOTS CASINO
  // ============================================================
  _handleSlotsSpin(bird, now) {
    const BET = this.SLOTS_BET;

    // Cooldown — 2 seconds between spins per bird
    if (bird.lastSlotsSpin && now - bird.lastSlotsSpin < 2000) return;

    // Proximity check
    const dx = bird.x - this.CASINO_POS.x;
    const dy = bird.y - this.CASINO_POS.y;
    if (Math.sqrt(dx * dx + dy * dy) > this.CASINO_POS.radius) {
      this.events.push({ type: 'slots_fail', birdId: bird.id, reason: 'Fly closer to the casino!' });
      return;
    }

    // Funds check
    if (bird.coins < BET) {
      this.events.push({ type: 'slots_fail', birdId: bird.id, reason: `Need ${BET}c to spin. You're broke!` });
      return;
    }

    bird.lastSlotsSpin = now;
    bird.coins -= BET;

    // Spin the reels — weighted random
    const spinReel = () => {
      let r = Math.random() * this.SLOTS_TOTAL_WEIGHT;
      for (const sym of this.SLOTS_SYMBOLS) {
        r -= sym.weight;
        if (r <= 0) return sym;
      }
      return this.SLOTS_SYMBOLS[this.SLOTS_SYMBOLS.length - 1];
    };

    const reels = [spinReel(), spinReel(), spinReel()];
    const ids = reels.map(r => r.id);

    let payout = 0;
    let resultType = 'lose';
    let specialEffect = null;
    let announcement = null;

    // Check 3-of-a-kind
    if (ids[0] === ids[1] && ids[1] === ids[2]) {
      const sym = ids[0];
      switch (sym) {
        case 'crown':
          payout = this.slotsJackpot;
          this.slotsJackpot = 500; // jackpot resets
          resultType = 'jackpot';
          announcement = { type: 'slots_jackpot', name: bird.name, payout };
          break;
        case 'diamond':
          payout = 250;
          resultType = 'big_win';
          break;
        case 'star':
          payout = 90;
          resultType = 'win';
          break;
        case 'food':
          payout = 60;
          resultType = 'win';
          break;
        case 'poop':
          payout = 45;
          resultType = 'win';
          specialEffect = 'mega_poop';
          bird.bmMegaPoops = (bird.bmMegaPoops || 0) + 1;
          break;
        case 'bird':
          payout = 36;
          resultType = 'small_win';
          break;
      }
    } else {
      // Check for 2-of-a-kind with high-value symbols — partial consolation
      const counts = {};
      for (const id of ids) counts[id] = (counts[id] || 0) + 1;
      for (const [id, count] of Object.entries(counts)) {
        if (count >= 2 && (id === 'crown' || id === 'diamond')) {
          payout = 15;
          resultType = 'small_win';
          break;
        }
      }
    }

    bird.coins += payout;

    // Jackpot grows from every losing spin
    if (resultType === 'lose') {
      this.slotsJackpot = Math.min(5000, this.slotsJackpot + 5);
    }

    // Small XP for participating
    bird.xp += 5;

    if (announcement) {
      this.events.push(announcement);
    }

    this.events.push({
      type: 'slots_result',
      birdId: bird.id,
      reels: reels.map(r => r.emoji),
      payout,
      resultType,
      specialEffect,
      jackpot: this.slotsJackpot,
    });

    console.log(`[Casino] 🎰 ${bird.name} spun [${reels.map(r => r.emoji).join('')}] → ${resultType} +${payout}c (jackpot now ${this.slotsJackpot}c)`);
  }

  // ============================================================
  // BIRD TATTOO PARLOR
  // ============================================================

  _handleBuyTattoo(bird, tattooId, now) {
    const tattoo = this.TATTOO_MAP[tattooId];
    if (!tattoo) {
      this.events.push({ type: 'tattoo_error', birdId: bird.id, msg: 'Unknown tattoo.' });
      return;
    }
    if ((bird.tattoosOwned || []).includes(tattooId)) {
      this.events.push({ type: 'tattoo_error', birdId: bird.id, msg: 'Already owned.' });
      return;
    }
    // Proximity check
    const pdx = bird.x - this.TATTOO_PARLOR_POS.x;
    const pdy = bird.y - this.TATTOO_PARLOR_POS.y;
    if (Math.sqrt(pdx * pdx + pdy * pdy) > this.TATTOO_PARLOR_POS.radius) {
      this.events.push({ type: 'tattoo_error', birdId: bird.id, msg: 'Too far from parlor.' });
      return;
    }
    if (bird.coins < tattoo.cost) {
      this.events.push({ type: 'tattoo_error', birdId: bird.id, msg: 'Not enough coins.' });
      return;
    }
    bird.coins -= tattoo.cost;
    if (!bird.tattoosOwned) bird.tattoosOwned = [];
    bird.tattoosOwned.push(tattooId);
    this._saveBird(bird);
    this.events.push({
      type: 'tattoo_bought',
      birdId: bird.id,
      tattooId,
      emoji: tattoo.emoji,
      name: tattoo.name,
      cost: tattoo.cost,
      tattoosOwned: bird.tattoosOwned,
      tattoosEquipped: bird.tattoosEquipped || [],
      coins: bird.coins,
    });
    console.log(`[Tattoo] 🎨 ${bird.name} bought tattoo: ${tattoo.emoji} ${tattoo.name}`);
  }

  _handleEquipTattoo(bird, tattooId, now) {
    if (!(bird.tattoosOwned || []).includes(tattooId)) {
      this.events.push({ type: 'tattoo_error', birdId: bird.id, msg: 'Tattoo not owned.' });
      return;
    }
    if (!bird.tattoosEquipped) bird.tattoosEquipped = [];
    const idx = bird.tattoosEquipped.indexOf(tattooId);
    if (idx !== -1) {
      // Unequip
      bird.tattoosEquipped.splice(idx, 1);
    } else {
      // Equip — max 3 slots
      if (bird.tattoosEquipped.length >= 3) {
        // Replace oldest (first in array) with the new one
        bird.tattoosEquipped.shift();
      }
      bird.tattoosEquipped.push(tattooId);
    }
    this._saveBird(bird);
    this.events.push({
      type: 'tattoo_equipped',
      birdId: bird.id,
      tattooId,
      tattoosEquipped: bird.tattoosEquipped,
      tattoosOwned: bird.tattoosOwned,
    });
  }

  // ============================================================
  // BOSS BATTLES
  // ============================================================
  _updateBoss(dt, now) {
    // Spawn boss
    if (!this.boss && now >= this.bossSpawnTimer && this.birds.size > 0) {
      this._spawnBoss(now);
    }

    if (!this.boss) return;

    const boss = this.boss;

    // Eagle Overlord has its own update logic
    if (boss.type === 'EAGLE_OVERLORD') {
      this._updateEagleOverlord(boss, dt, now);
      return;
    }

    // Boss movement: wander toward nearest bird
    let nearestBird = null;
    let nearestDist = Infinity;
    for (const bird of this.birds.values()) {
      if (bird.inNest) continue; // Skip nesting birds
      const dx = bird.x - boss.x;
      const dy = bird.y - boss.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestBird = bird;
      }
    }

    if (nearestBird) {
      const dx = nearestBird.x - boss.x;
      const dy = nearestBird.y - boss.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        boss.x += (dx / dist) * boss.speed * dt;
        boss.y += (dy / dist) * boss.speed * dt;
        boss.rotation = Math.atan2(dy, dx);
      }
    }

    // Keep in bounds
    boss.x = Math.max(30, Math.min(world.WORLD_WIDTH - 30, boss.x));
    boss.y = Math.max(30, Math.min(world.WORLD_HEIGHT - 30, boss.y));

    // Boss takes damage: 1 HP per nearby bird (<50px) per second
    for (const bird of this.birds.values()) {
      const dx = bird.x - boss.x;
      const dy = bird.y - boss.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 50) {
        boss.hp -= dt; // 1 HP/sec per bird nearby
      }

      // Boss attacks birds within 30px
      if (dist < 30 && (!boss.lastAttack || now - boss.lastAttack > 2000)) {
        boss.lastAttack = now;
        bird.food = Math.max(0, Math.floor(bird.food * 0.85)); // -15% food
        bird.stunnedUntil = now + 2000; // 2s stun
        this.events.push({ type: 'boss_attack', birdId: bird.id, x: boss.x, y: boss.y, bossType: boss.type });
        this.events.push({ type: 'stunned', birdId: bird.id, duration: 2000 });
      }
    }

    // Check defeat
    if (boss.hp <= 0) {
      // Reward all birds within 200px
      for (const bird of this.birds.values()) {
        const dx = bird.x - boss.x;
        const dy = bird.y - boss.y;
        if (Math.sqrt(dx * dx + dy * dy) < 200) {
          bird.xp += 100;
          bird.coins += 25;
          // Level check
          const newLevel = world.getLevelFromXP(bird.xp);
          const newType = world.getBirdTypeForLevel(newLevel);
          if (newType !== bird.type) {
            bird.type = newType;
            bird.level = newLevel;
            this.events.push({ type: 'evolve', birdId: bird.id, name: bird.name, birdType: newType });
          }
          bird.level = newLevel;
        }
      }
      this.events.push({ type: 'boss_defeated', bossType: boss.type, x: boss.x, y: boss.y });
      this.boss = null;
      this.bossSpawnTimer = now + this._randomRange(600000, 900000); // Eagle: 10-15 min cooldown
      return;
    }
  }

  // ============================================================
  // TERRITORY PREDATORS — hawk and mega cat in permanent home zones
  // ============================================================
  _updateTerritoryPredators(dt, now) {
    const WARNING_GRACE = 3000; // ms before predator attacks after warning

    for (const [predKey, predator] of Object.entries(this.territoryPredators)) {
      const zone = world.PREDATOR_TERRITORIES[predKey];

      // --- Respawn dead predators after cooldown ---
      if (predator.state === 'dead') {
        if (now >= predator.respawnTimer) {
          predator.x = zone.spawnX;
          predator.y = zone.spawnY;
          predator.hp = predator.maxHp;
          predator.state = 'patrol';
          predator.targetBirdId = null;
          predator.wanderAngle = Math.random() * Math.PI * 2;
          predator.wanderTimer = 0;
          this.events.push({ type: 'predator_respawned', predType: predKey, x: predator.x, y: predator.y, zoneName: zone.name });
        }
        continue;
      }

      // --- Find birds inside this territory ---
      const birdsInZone = [];
      for (const bird of this.birds.values()) {
        if (bird.x >= zone.x && bird.x <= zone.x + zone.w &&
            bird.y >= zone.y && bird.y <= zone.y + zone.h) {
          birdsInZone.push(bird);
        }
      }

      // --- Clear warnings for birds who left the zone ---
      for (const [birdId, warnings] of this.predatorWarnings.entries()) {
        if (!birdsInZone.some(b => b.id === birdId) && warnings[predKey]) {
          warnings[predKey] = null;
          if (predator.targetBirdId === birdId) {
            predator.targetBirdId = null;
            predator.state = 'patrol';
          }
        }
      }

      // --- Issue first-entry warnings ---
      for (const bird of birdsInZone) {
        if (!this.predatorWarnings.has(bird.id)) {
          this.predatorWarnings.set(bird.id, { hawk: null, cat: null });
        }
        const warnings = this.predatorWarnings.get(bird.id);
        if (!warnings[predKey]) {
          warnings[predKey] = now;
          this.events.push({ type: 'territory_warning', predType: predKey, birdId: bird.id, zoneName: zone.name, label: zone.label });
        }
      }

      // --- Switch to hunting if a warned bird has lingered long enough ---
      if (predator.state === 'patrol') {
        for (const bird of birdsInZone) {
          const warnings = this.predatorWarnings.get(bird.id);
          if (warnings && warnings[predKey] && (now - warnings[predKey]) >= WARNING_GRACE) {
            predator.state = 'hunting';
            predator.targetBirdId = bird.id;
            this.events.push({ type: 'predator_hunting', predType: predKey, birdId: bird.id, birdName: bird.name, x: predator.x, y: predator.y });
            break;
          }
        }
      }

      // --- Movement ---
      const huntSpeed = predKey === 'hawk' ? 260 : 150;
      const patrolSpeed = predKey === 'hawk' ? 90 : 65;

      if (predator.state === 'hunting' && predator.targetBirdId) {
        const target = this.birds.get(predator.targetBirdId);
        // Abandon hunt if target left the zone or disconnected
        if (!target || target.x < zone.x || target.x > zone.x + zone.w ||
            target.y < zone.y || target.y > zone.y + zone.h) {
          predator.targetBirdId = null;
          predator.state = 'patrol';
        } else {
          const dx = target.x - predator.x;
          const dy = target.y - predator.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1) {
            predator.x += (dx / dist) * huntSpeed * dt;
            predator.y += (dy / dist) * huntSpeed * dt;
            predator.rotation = Math.atan2(dy, dx);
          }

          // Attack on contact
          if (dist < 42 && now - predator.lastAttack > 2000) {
            predator.lastAttack = now;

            if (!this.predatorHitCounts.has(target.id)) {
              this.predatorHitCounts.set(target.id, { hawk: 0, cat: 0 });
            }
            const hits = this.predatorHitCounts.get(target.id);
            hits[predKey]++;

            target.food = Math.max(0, Math.floor(target.food * 0.75));
            target.stunnedUntil = now + 1500;
            target.comboCount = 0;
            target.comboExpiresAt = 0;

            this.events.push({ type: 'predator_attack', predType: predKey, birdId: target.id, hitCount: hits[predKey], maxHits: 3, x: predator.x, y: predator.y });

            if (hits[predKey] >= 3) {
              // Bird killed — respawn at city center with penalties
              const coinLoss = Math.floor(target.coins * 0.35);
              target.coins = Math.max(0, target.coins - coinLoss);
              target.food = Math.max(3, Math.floor(target.food * 0.3));
              target.x = world.WORLD_WIDTH / 2 + (Math.random() - 0.5) * 300;
              target.y = world.WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 300;
              target.stunnedUntil = now + 3000;

              this.events.push({ type: 'predator_killed_bird', predType: predKey, birdId: target.id, birdName: target.name, coinLoss, x: predator.x, y: predator.y });

              this.predatorHitCounts.delete(target.id);
              this.predatorWarnings.delete(target.id);
              predator.targetBirdId = null;
              predator.state = 'patrol';
            }
          }
        }
      } else {
        // Patrol: wander randomly within territory
        predator.wanderTimer -= dt;
        if (predator.wanderTimer <= 0) {
          predator.wanderAngle = Math.random() * Math.PI * 2;
          predator.wanderTimer = 1.5 + Math.random() * 2.5;
        }
        predator.x += Math.cos(predator.wanderAngle) * patrolSpeed * dt;
        predator.y += Math.sin(predator.wanderAngle) * patrolSpeed * dt;
        predator.rotation = predator.wanderAngle;

        // Bounce off territory walls
        if (predator.x < zone.x + 20 || predator.x > zone.x + zone.w - 20) {
          predator.wanderAngle = Math.PI - predator.wanderAngle;
          predator.x = Math.max(zone.x + 20, Math.min(zone.x + zone.w - 20, predator.x));
        }
        if (predator.y < zone.y + 20 || predator.y > zone.y + zone.h - 20) {
          predator.wanderAngle = -predator.wanderAngle;
          predator.y = Math.max(zone.y + 20, Math.min(zone.y + zone.h - 20, predator.y));
        }
      }
    }
  }

  _spawnBoss(now) {
    // Only Eagle Overlord spawns as a roaming raid boss now.
    // MEGA_CAT and MEGA_HAWK have permanent fixed territories (see _updateTerritoryPredators).
    const edge = Math.floor(Math.random() * 4);
    let ex, ey;
    if (edge === 0)      { ex = 80; ey = 80 + Math.random() * (world.WORLD_HEIGHT - 160); }
    else if (edge === 1) { ex = world.WORLD_WIDTH - 80; ey = 80 + Math.random() * (world.WORLD_HEIGHT - 160); }
    else if (edge === 2) { ex = 80 + Math.random() * (world.WORLD_WIDTH - 160); ey = 80; }
    else                 { ex = 80 + Math.random() * (world.WORLD_WIDTH - 160); ey = world.WORLD_HEIGHT - 80; }
    this.boss = {
      type: 'EAGLE_OVERLORD',
      x: ex, y: ey,
      hp: 300, maxHp: 300,
      speed: 185,
      rotation: 0, spawnedAt: now, lastAttack: 0,
      swoopAngle: Math.atan2(world.WORLD_HEIGHT / 2 - ey, world.WORLD_WIDTH / 2 - ex),
      swoopPhase: Math.random() * Math.PI * 2,
      snatched: null,
      escapeTime: now + 90000,
      damageByBird: new Map(),
    };
    this.events.push({ type: 'boss_spawn', bossType: 'EAGLE_OVERLORD', x: ex, y: ey });
    console.log(`[GameEngine] 🦅 EAGLE OVERLORD SPAWNED at edge ${edge}`);
  }

  // ============================================================
  // EAGLE OVERLORD (aerial raid boss)
  // ============================================================
  _updateEagleOverlord(boss, dt, now) {
    // 1. Sweeping arc movement — steer toward nearest bird with sine wave oscillation
    let targetX = world.WORLD_WIDTH / 2;
    let targetY = world.WORLD_HEIGHT / 2;
    let nearestDist = Infinity;
    for (const bird of this.birds.values()) {
      if (bird.stunnedUntil > now + 200) continue;
      const dx = bird.x - boss.x;
      const dy = bird.y - boss.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) { nearestDist = dist; targetX = bird.x; targetY = bird.y; }
    }

    const desiredAngle = Math.atan2(targetY - boss.y, targetX - boss.x);
    let angleDiff = desiredAngle - boss.swoopAngle;
    while (angleDiff > Math.PI)  angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    boss.swoopAngle += angleDiff * Math.min(1, dt * 0.75);

    boss.swoopPhase += dt * 2.2;
    const perpAngle = boss.swoopAngle + Math.PI / 2;
    const oscAmp = 38;

    boss.x += Math.cos(boss.swoopAngle) * boss.speed * dt
             + Math.cos(perpAngle) * Math.sin(boss.swoopPhase) * oscAmp * dt;
    boss.y += Math.sin(boss.swoopAngle) * boss.speed * dt
             + Math.sin(perpAngle) * Math.sin(boss.swoopPhase) * oscAmp * dt;
    boss.rotation = boss.swoopAngle;

    // Bounce off world edges
    if (boss.x < 60)                       { boss.swoopAngle = Math.PI - boss.swoopAngle; boss.x = 60; }
    if (boss.x > world.WORLD_WIDTH  - 60)  { boss.swoopAngle = Math.PI - boss.swoopAngle; boss.x = world.WORLD_WIDTH - 60; }
    if (boss.y < 60)                       { boss.swoopAngle = -boss.swoopAngle; boss.y = 60; }
    if (boss.y > world.WORLD_HEIGHT - 60)  { boss.swoopAngle = -boss.swoopAngle; boss.y = world.WORLD_HEIGHT - 60; }

    // 2. Move the snatched bird with the eagle
    if (boss.snatched) {
      const captive = this.birds.get(boss.snatched.birdId);
      if (captive) {
        captive.x = boss.x + 20;
        captive.y = boss.y + 24;
        captive.vx = 0; captive.vy = 0;
        captive.stunnedUntil = now + 300;
        // Auto-release after 5 s
        if (now - boss.snatched.snatchedAt > 5000) {
          captive.stunnedUntil = 0;
          this.events.push({ type: 'eagle_released', birdId: captive.id, x: boss.x, y: boss.y });
          boss.snatched = null;
        }
      } else {
        boss.snatched = null;
      }
    }

    // 3. Snatch nearest bird within 50 px
    if (!boss.snatched && now - boss.lastAttack > 4000) {
      for (const bird of this.birds.values()) {
        if (bird.stunnedUntil > now + 300) continue;
        const dx = bird.x - boss.x;
        const dy = bird.y - boss.y;
        if (Math.sqrt(dx * dx + dy * dy) < 50) {
          boss.lastAttack = now;
          boss.snatched = { birdId: bird.id, snatchedAt: now };
          bird.stunnedUntil = now + 5500;
          bird.comboCount = 0;
          bird.comboExpiresAt = 0;
          const stolen = Math.floor(bird.coins * 0.12);
          bird.coins = Math.max(0, bird.coins - stolen);
          this.events.push({ type: 'eagle_snatch', birdId: bird.id, birdName: bird.name, x: boss.x, y: boss.y, stolenCoins: stolen });
          break;
        }
      }
    }

    // 4. Passive flanking damage from nearby birds (incentivises swarming)
    for (const bird of this.birds.values()) {
      const dx = bird.x - boss.x;
      const dy = bird.y - boss.y;
      if (Math.sqrt(dx * dx + dy * dy) < 60) {
        const dmg = dt * 0.4;
        boss.hp -= dmg;
        const prev = boss.damageByBird.get(bird.id) || 0;
        boss.damageByBird.set(bird.id, prev + dmg);
      }
    }

    // 5. Escape if survival timer expires
    if (now >= boss.escapeTime) {
      this._eagleOverlordEscape(boss, now);
      return;
    }

    // 6. Defeat check
    if (boss.hp <= 0) {
      this._eagleOverlordDefeated(boss, now);
    }
  }

  _eagleOverlordEscape(boss, now) {
    // Steal coins from richest bird and flee
    let richest = null, mostCoins = 10;
    for (const bird of this.birds.values()) {
      if (bird.coins > mostCoins) { mostCoins = bird.coins; richest = bird; }
    }
    if (richest) {
      const stolen = Math.floor(richest.coins * 0.30);
      richest.coins -= stolen;
      this.events.push({ type: 'eagle_robbed', birdId: richest.id, birdName: richest.name, stolen, x: boss.x, y: boss.y });
    }
    if (boss.snatched) {
      const captive = this.birds.get(boss.snatched.birdId);
      if (captive) captive.stunnedUntil = 0;
    }
    this.events.push({ type: 'eagle_escaped', x: boss.x, y: boss.y });
    this.boss = null;
    this.bossSpawnTimer = now + this._randomRange(420000, 600000);
    console.log('[GameEngine] 🦅 Eagle Overlord escaped!');
  }

  _eagleOverlordDefeated(boss, now) {
    let totalDmg = 0;
    for (const d of boss.damageByBird.values()) totalDmg += d;

    const rewards = [];
    for (const [birdId, dmg] of boss.damageByBird.entries()) {
      const bird = this.birds.get(birdId);
      if (!bird) continue;
      const share = totalDmg > 0 ? dmg / totalDmg : 1 / Math.max(1, this.birds.size);
      const xpReward   = Math.round(60  + share * 240);
      const coinReward = Math.round(25  + share * 175);
      bird.xp    += xpReward;
      bird.coins += coinReward;
      const newLevel = world.getLevelFromXP(bird.xp);
      const newType  = world.getBirdTypeForLevel(newLevel);
      if (newType !== bird.type) {
        bird.type = newType; bird.level = newLevel;
        this.events.push({ type: 'evolve', birdId: bird.id, name: bird.name, birdType: newType });
      }
      bird.level = newLevel;
      rewards.push({ name: bird.name, xp: xpReward, coins: coinReward });
    }
    if (boss.snatched) {
      const captive = this.birds.get(boss.snatched.birdId);
      if (captive) captive.stunnedUntil = 0;
    }
    this.events.push({ type: 'eagle_overlord_defeated', x: boss.x, y: boss.y, rewards });
    this.boss = null;
    this.bossSpawnTimer = now + this._randomRange(420000, 600000);
    console.log('[GameEngine] 🦅 Eagle Overlord DEFEATED by the flock!');
  }

  // ============================================================
  // WANTED SYSTEM
  // ============================================================
  _addHeat(birdId, amount) {
    const current = this.heatScores.get(birdId) || 0;
    this.heatScores.set(birdId, current + amount);
  }

  // Returns 0-5 star wanted level for a given heat value
  _getWantedLevel(heat) {
    if (heat >= this.WANTED_THRESHOLDS[4]) return 5;
    if (heat >= this.WANTED_THRESHOLDS[3]) return 4;
    if (heat >= this.WANTED_THRESHOLDS[2]) return 3;
    if (heat >= this.WANTED_THRESHOLDS[1]) return 2;
    if (heat >= this.WANTED_THRESHOLDS[0]) return 1;
    return 0;
  }

  // How many cop birds should be active for a given star level
  _targetCopCount(level) {
    if (level >= 5) return 4; // 3 cops + 1 SWAT
    if (level >= 4) return 3; // 2 cops + 1 SWAT
    if (level >= 3) return 2;
    if (level >= 2) return 1;
    return 0;
  }

  _updateWanted(dt, now) {
    // Decay heat: -2 per 5 seconds (faster when no cops nearby — escaping reduces heat)
    if (now - this.lastHeatDecay > 5000) {
      this.lastHeatDecay = now;
      for (const [birdId, heat] of this.heatScores) {
        // Faster decay when wanted bird has escaped (no cop within 300px)
        let decayAmount = 2;
        const bird = this.birds.get(birdId);
        if (bird) {
          let nearestCop = Infinity;
          for (const cop of this.copBirds.values()) {
            if (cop.targetBirdId !== birdId) continue;
            const cdx = cop.x - bird.x;
            const cdy = cop.y - bird.y;
            nearestCop = Math.min(nearestCop, Math.sqrt(cdx * cdx + cdy * cdy));
          }
          if (nearestCop > 300) decayAmount = 4; // bonus decay when evaded
        }
        const newHeat = heat - decayAmount;
        if (newHeat <= 0) {
          this.heatScores.delete(birdId);
        } else {
          this.heatScores.set(birdId, newHeat);
        }
      }
    }

    // Check wanted status every 2 seconds (more responsive level changes)
    if (now - this.lastWantedCheck > 2000) {
      this.lastWantedCheck = now;
      let maxHeat = 0;
      let maxBirdId = null;
      for (const [birdId, heat] of this.heatScores) {
        if (heat > maxHeat && this.birds.has(birdId)) {
          maxHeat = heat;
          maxBirdId = birdId;
        }
      }
      const newWanted = (maxHeat >= this.WANTED_THRESHOLDS[0]) ? maxBirdId : null;

      // Level-up announcements
      if (newWanted && newWanted === this.wantedBirdId) {
        const bird = this.birds.get(newWanted);
        const newLevel = this._getWantedLevel(maxHeat);
        const oldLevel = this._getWantedLevel(maxHeat - 2); // approximate prev
        if (newLevel > oldLevel && newLevel >= 2) {
          this.events.push({ type: 'wanted_level_up', birdId: newWanted, birdName: bird ? bird.name : '???', level: newLevel });
        }
      }

      if (newWanted !== this.wantedBirdId) {
        const prevWanted = this.wantedBirdId;
        this.wantedBirdId = newWanted;
        if (newWanted) {
          const bird = this.birds.get(newWanted);
          const level = this._getWantedLevel(maxHeat);
          this.events.push({ type: 'wanted_new', birdId: newWanted, birdName: bird ? bird.name : '???', level });
          if (level >= 5) {
            // Level 5: announce bounty to all players
            this.events.push({ type: 'wanted_level5', birdId: newWanted, birdName: bird ? bird.name : '???' });
          }
        } else if (prevWanted) {
          // Wanted cleared — announce escape
          const bird = this.birds.get(prevWanted);
          if (bird) {
            this.events.push({ type: 'wanted_escaped', birdId: prevWanted, birdName: bird.name });
          }
          // Despawn all cop birds
          this.copBirds.clear();
        }
      }
    }

    // Tagging: other birds within 30px of wanted bird pressing E
    if (this.wantedBirdId) {
      const wanted = this.birds.get(this.wantedBirdId);
      if (!wanted) {
        this.wantedBirdId = null;
        this.copBirds.clear();
        return;
      }
      const wantedHeat = this.heatScores.get(this.wantedBirdId) || 0;
      const wantedLevel = this._getWantedLevel(wantedHeat);
      // Bounty scales with level: 15 + 25*level coins
      const bounty = 15 + 25 * wantedLevel;
      for (const bird of this.birds.values()) {
        if (bird.id === this.wantedBirdId) continue;
        if (!bird.input.e) continue;
        const dx = bird.x - wanted.x;
        const dy = bird.y - wanted.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          bird.coins += bounty;
          bird.xp += 50 + wantedLevel * 20;
          this.events.push({ type: 'wanted_tagged', taggerId: bird.id, wantedId: this.wantedBirdId, taggerName: bird.name, wantedName: wanted.name, bounty });
          this.heatScores.delete(this.wantedBirdId);
          this.wantedBirdId = null;
          this.copBirds.clear();
          break;
        }
      }

      // Survival XP: reward the wanted bird for staying alive at high heat
      if (this.wantedBirdId && wantedLevel >= 3 && now - this.lastSurvivalXp > 10000) {
        this.lastSurvivalXp = now;
        wanted.xp += wantedLevel * 15;
        wanted.coins += wantedLevel * 5;
        this.events.push({ type: 'wanted_survival', birdId: wanted.id, level: wantedLevel });
        // Daily challenge: survive 10s at wanted level 3+
        this._trackDailyProgress(wanted, 'wanted_survival', 1);
        this._trackDailyProgress(wanted, 'coins_earned', wantedLevel * 5);
      }
    }
  }

  // ============================================================
  // COP BIRDS (spawned by wanted system)
  // ============================================================
  _spawnCopBird(targetBirdId, type) {
    // Spawn from a random map edge
    const target = this.birds.get(targetBirdId);
    if (!target) return;
    // Pick a spawn point 400-600px away from target, on a road
    const angle = Math.random() * Math.PI * 2;
    const dist = 450 + Math.random() * 150;
    const x = Math.max(50, Math.min(world.WORLD_WIDTH - 50, target.x + Math.cos(angle) * dist));
    const y = Math.max(50, Math.min(world.WORLD_HEIGHT - 50, target.y + Math.sin(angle) * dist));
    const id = 'cop_' + uid();
    const isSWAT = type === 'swat';
    const cop = {
      id, x, y,
      type,          // 'cop' | 'swat'
      rotation: Math.atan2(target.y - y, target.x - x),
      speed: isSWAT ? 145 : 110,
      state: 'pursuing',   // 'pursuing' | 'stunned'
      stunnedUntil: 0,
      targetBirdId,
      spawnedAt: Date.now(),
      sirensPhase: Math.random() * Math.PI * 2, // for flashing light animation
    };
    this.copBirds.set(id, cop);
    this.events.push({ type: 'cop_spawn', copType: type, x, y });
  }

  _updateCopBirds(dt, now) {
    if (!this.wantedBirdId) {
      // No wanted bird — clear all cops
      if (this.copBirds.size > 0) this.copBirds.clear();
      return;
    }

    const wantedHeat = this.heatScores.get(this.wantedBirdId) || 0;
    const wantedLevel = this._getWantedLevel(wantedHeat);
    const targetCount = this._targetCopCount(wantedLevel);

    // Count current cops (excluding stunned-for-good ones)
    const activeCops = Array.from(this.copBirds.values()).filter(c => c.targetBirdId === this.wantedBirdId);

    // Spawn more cops if needed (one every 5s max to avoid flooding)
    if (activeCops.length < targetCount) {
      const lastSpawn = this._lastCopSpawn || 0;
      if (now - lastSpawn > 5000) {
        this._lastCopSpawn = now;
        // Decide type: SWAT crow for level 4+
        const needSWAT = wantedLevel >= 4 && !activeCops.some(c => c.type === 'swat');
        this._spawnCopBird(this.wantedBirdId, needSWAT ? 'swat' : 'cop');
      }
    }

    // Remove excess cops if wanted level dropped
    const copList = Array.from(this.copBirds.entries());
    if (activeCops.length > targetCount) {
      // Despawn slowest cops first
      let toRemove = activeCops.length - targetCount;
      for (const [id] of copList) {
        if (toRemove <= 0) break;
        this.copBirds.delete(id);
        toRemove--;
      }
    }

    // Update each cop
    const wanted = this.birds.get(this.wantedBirdId);
    if (!wanted) {
      this.copBirds.clear();
      return;
    }

    // Black Market Smoke Bomb: wanted bird is invisible to cops
    const smokeActive = wanted.bmSmokeBombUntil > now;

    for (const [copId, cop] of this.copBirds) {

      // Stunned state
      if (cop.state === 'stunned') {
        if (now >= cop.stunnedUntil) {
          cop.state = 'pursuing';
        } else {
          continue;
        }
      }

      // Smoke bomb: cops wander in a confused circle instead of chasing
      if (smokeActive) {
        cop.smokeWanderAngle = (cop.smokeWanderAngle || Math.random() * Math.PI * 2) + dt * 0.8;
        cop.x += Math.cos(cop.smokeWanderAngle) * cop.speed * 0.4 * dt;
        cop.y += Math.sin(cop.smokeWanderAngle) * cop.speed * 0.4 * dt;
        cop.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, cop.x));
        cop.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, cop.y));
        continue;
      }

      // Sewer: cops can't follow birds underground — they wander confused at manhole
      if (wanted.inSewer) {
        cop.sewerWanderAngle = (cop.sewerWanderAngle || Math.random() * Math.PI * 2) + dt * 0.4;
        cop.x += Math.cos(cop.sewerWanderAngle) * cop.speed * 0.25 * dt;
        cop.y += Math.sin(cop.sewerWanderAngle) * cop.speed * 0.25 * dt;
        cop.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, cop.x));
        cop.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, cop.y));
        continue;
      }
      cop.sewerWanderAngle = null;

      // Fog: cops lose sight of birds beyond 220px — they wander instead of pursuing
      const fogActive = this.weather && this.weather.type === 'fog';

      // Pursue wanted bird
      const dx = wanted.x - cop.x;
      const dy = wanted.y - cop.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (fogActive && dist > 220) {
        // Lost in the fog — wander in last-known direction with drift
        cop.fogWanderAngle = cop.fogWanderAngle || Math.atan2(dy, dx);
        cop.fogWanderAngle += (Math.random() - 0.5) * 0.6 * dt * 3;
        cop.x += Math.cos(cop.fogWanderAngle) * cop.speed * 0.5 * dt;
        cop.y += Math.sin(cop.fogWanderAngle) * cop.speed * 0.5 * dt;
        cop.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, cop.x));
        cop.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, cop.y));
        continue;
      }
      // Reset fog wander state once they can "see" again
      if (!fogActive || dist <= 220) cop.fogWanderAngle = null;

      if (dist > 1) {
        cop.x += (dx / dist) * cop.speed * dt;
        cop.y += (dy / dist) * cop.speed * dt;
        cop.rotation = Math.atan2(dy, dx);
      }

      cop.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, cop.x));
      cop.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, cop.y));

      // Arrest: cop catches wanted bird (within 18px, bird not already stunned)
      if (dist < 18 && wanted.stunnedUntil <= now) {
        const arrestDuration = cop.type === 'swat' ? 4000 : 2500;
        wanted.stunnedUntil = now + arrestDuration;
        // Combo break — busted kills your streak
        wanted.comboCount = 0;
        wanted.comboExpiresAt = 0;

        // Steal coins (25% of coins, min 5)
        const stolen = Math.max(5, Math.floor(wanted.coins * 0.25));
        wanted.coins = Math.max(0, wanted.coins - stolen);

        // Remove a big chunk of heat
        const currentHeat = this.heatScores.get(wanted.id) || 0;
        const newHeat = Math.max(0, currentHeat - 40);
        if (newHeat <= 0) {
          this.heatScores.delete(wanted.id);
        } else {
          this.heatScores.set(wanted.id, newHeat);
        }

        this.events.push({
          type: 'cop_arrest',
          birdId: wanted.id, birdName: wanted.name,
          copType: cop.type,
          coinsStolen: stolen,
          x: cop.x, y: cop.y,
        });

        // After arrest cop goes off-duty for 8s
        cop.state = 'stunned';
        cop.stunnedUntil = now + 8000;
      }
    }
  }

  // ============================================================
  // FOOD TRUCK HEIST
  // ============================================================
  _updateFoodTruck(dt, now) {
    // Spawn food truck
    if (!this.foodTruck && now >= this.foodTruckSpawnTimer && this.birds.size > 0) {
      this._spawnFoodTruck(now);
    }

    if (!this.foodTruck) return;

    const truck = this.foodTruck;

    // --- LOOTED STATE: truck speeds away, then despawns ---
    if (truck.looted) {
      // Drive fast toward escape waypoint
      const dx = truck.targetX - truck.x;
      const dy = truck.targetY - truck.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 10) {
        this._setFoodTruckEscapeWaypoint(truck);
      } else {
        truck.x += (dx / dist) * truck.speed * dt;
        truck.y += (dy / dist) * truck.speed * dt;
        truck.angle = Math.atan2(dy, dx);
      }
      truck.x = Math.max(20, Math.min(world.WORLD_WIDTH - 20, truck.x));
      truck.y = Math.max(20, Math.min(world.WORLD_HEIGHT - 20, truck.y));
      if (now - truck.lootedAt > 8000) {
        this.foodTruck = null;
        this.foodTruckSpawnTimer = now + this._randomRange(240000, 360000); // 4-6 min until next
      }
      return;
    }

    // --- NORMAL DRIVING: stop during active heist ---
    const heistBeingDrained = truck.heistActive && now < truck.driveStopUntil;
    if (!heistBeingDrained) {
      const dx = truck.targetX - truck.x;
      const dy = truck.targetY - truck.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 10) {
        this._setFoodTruckWaypoint(truck);
      } else {
        truck.x += (dx / dist) * truck.speed * dt;
        truck.y += (dy / dist) * truck.speed * dt;
        truck.angle = Math.atan2(dy, dx);
      }
      truck.x = Math.max(20, Math.min(world.WORLD_WIDTH - 20, truck.x));
      truck.y = Math.max(20, Math.min(world.WORLD_HEIGHT - 20, truck.y));
    }

    // Honk when birds are near (80px) — only while not being heisted
    if (!truck.heistActive) {
      if (truck.honkCooldown > 0) {
        truck.honkCooldown -= dt;
      } else {
        for (const bird of this.birds.values()) {
          const bdx = bird.x - truck.x;
          const bdy = bird.y - truck.y;
          if (Math.sqrt(bdx * bdx + bdy * bdy) < 80) {
            truck.honkCooldown = 3;
            this.events.push({ type: 'truck_honk', x: truck.x, y: truck.y });
            break;
          }
        }
      }
    }

    // --- HEIST MECHANICS ---
    // Collect birds holding E within 80px
    const heistingBirds = [];
    for (const bird of this.birds.values()) {
      if (!bird.input.e) continue;
      const bdx = bird.x - truck.x;
      const bdy = bird.y - truck.y;
      if (Math.sqrt(bdx * bdx + bdy * bdy) < 80) {
        heistingBirds.push(bird);
      }
    }

    if (heistingBirds.length > 0) {
      // At least one bird is actively heisting
      if (!truck.heistActive) {
        // Heist just started!
        truck.heistActive = true;
        truck.heistStartedAt = now;
        this.events.push({
          type: 'heist_started',
          x: truck.x, y: truck.y,
          birdCount: heistingBirds.length,
        });
        console.log('[GameEngine] Food Truck Heist started!');
      }

      // Freeze the truck while actively being drained
      truck.driveStopUntil = now + 500;

      // Progress fills at 0.075/s per bird (1 bird = ~13.3s, 2 = ~6.7s, 4 = ~3.3s)
      const heistRate = Math.min(heistingBirds.length, 4) * 0.075;
      truck.heistProgress = Math.min(1.0, truck.heistProgress + heistRate * dt);

      // Track per-bird contributions (for proportional rewards)
      for (const bird of heistingBirds) {
        truck.contributions[bird.id] = (truck.contributions[bird.id] || 0) + dt;
        truck.contributorNames[bird.id] = bird.name;
        bird.totalSteals++;
        // Small heat per second of heisting
        this._addHeat(bird.id, 0.3 * dt);
      }

      // Dispatch cops after 5 seconds of heist
      if (!truck.copsDispatched && now - truck.heistStartedAt > 5000) {
        truck.copsDispatched = true;
        // Spawn 2 cop pigeons headed to the truck
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spawnDist = 400 + Math.random() * 200;
          const cx = Math.max(50, Math.min(world.WORLD_WIDTH - 50, truck.x + Math.cos(angle) * spawnDist));
          const cy = Math.max(50, Math.min(world.WORLD_HEIGHT - 50, truck.y + Math.sin(angle) * spawnDist));
          const copId = 'cop_heist_' + uid();
          this.copBirds.set(copId, {
            id: copId, type: 'cop_pigeon',
            x: cx, y: cy, rotation: 0,
            targetBirdId: null,
            heistTarget: { x: truck.x, y: truck.y }, // heading to truck location
            speed: 130, state: 'chasing',
            stunUntil: 0, offDutyUntil: 0, sirensPhase: Math.random() * Math.PI * 2,
          });
        }
        this.events.push({ type: 'heist_cops_dispatched', x: truck.x, y: truck.y });
      }

      // Heist alarm sound (every 2s while in progress)
      if (!truck.alarmCooldown || now > truck.alarmCooldown) {
        truck.alarmCooldown = now + 2000;
        this.events.push({ type: 'heist_alarm', x: truck.x, y: truck.y });
      }

      // HEIST COMPLETE!
      if (truck.heistProgress >= 1.0) {
        this._triggerHeistLoot(truck, now);
        return;
      }
    } else {
      // No birds heisting — slowly drain progress back (pressure to stay)
      if (truck.heistProgress > 0) {
        truck.heistProgress = Math.max(0, truck.heistProgress - 0.03 * dt);
        if (truck.heistProgress === 0) {
          truck.heistActive = false;
          truck.heistStartedAt = null;
          truck.copsDispatched = false;
          truck.contributions = {};
          truck.contributorNames = {};
        }
      }
    }
  }

  _triggerHeistLoot(truck, now) {
    const contributions = truck.contributions;
    const names = truck.contributorNames;
    const totalTime = Object.values(contributions).reduce((a, b) => a + b, 0) || 1;
    const numContributors = Object.keys(contributions).length;
    const totalPot = 200 + numContributors * 60; // 260-440 coins total

    const rewards = [];
    for (const [birdId, time] of Object.entries(contributions)) {
      const bird = this.birds.get(birdId);
      const share = time / totalTime;
      const coins = Math.floor(share * totalPot);
      const xp = Math.floor(80 + share * 320);
      if (bird) {
        bird.coins += coins;
        bird.xp += xp;
        bird.food += 25;
        this._addHeat(birdId, 20);
      }
      rewards.push({ birdId, name: names[birdId] || '?', coins, xp });
    }

    // Scatter food items around truck position
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
      const r = 40 + Math.random() * 100;
      const fx = Math.max(50, Math.min(world.WORLD_WIDTH - 50, truck.x + Math.cos(angle) * r));
      const fy = Math.max(50, Math.min(world.WORLD_HEIGHT - 50, truck.y + Math.sin(angle) * r));
      const foodId = 'heist_food_' + uid();
      this.foods.set(foodId, { id: foodId, x: fx, y: fy, type: 'pizza', active: true, respawnAt: null });
    }

    this._addChaos(40);

    this.events.push({
      type: 'heist_complete',
      x: truck.x, y: truck.y,
      rewards,
    });

    // Don mission progress + daily challenge: heist participant
    for (const birdId of Object.keys(contributions)) {
      const b = this.birds.get(birdId);
      if (b) {
        if (b.donMission && b.donMission.jobId === 'don_heist') {
          b.donMission.progress++;
          this._checkDonMissionComplete(b, now);
        }
        this._trackDailyProgress(b, 'heist', 1);
        const heistCoins = rewards.find(r => r.birdId === birdId);
        if (heistCoins) this._trackDailyProgress(b, 'coins_earned', heistCoins.coins);
      }
    }

    // Truck speeds away panicking
    truck.looted = true;
    truck.lootedAt = now;
    truck.speed = 160;
    truck.heistActive = false;
    this._setFoodTruckEscapeWaypoint(truck);
    console.log('[GameEngine] Food Truck Heist complete! Loot distributed.');
  }

  _spawnFoodTruck(now) {
    // Start on a road
    const roads = world.ROADS;
    const road = roads[Math.floor(Math.random() * roads.length)];
    const x = road.x + Math.random() * road.w;
    const y = road.y + Math.random() * road.h;

    this.foodTruck = {
      x, y,
      w: 50, h: 26,
      speed: 55,
      angle: 0,
      targetX: x, targetY: y,
      honkCooldown: 0,
      // Heist state
      heistProgress: 0,
      heistActive: false,
      heistStartedAt: null,
      copsDispatched: false,
      driveStopUntil: 0,
      alarmCooldown: 0,
      contributions: {},
      contributorNames: {},
      looted: false,
      lootedAt: null,
    };
    this._setFoodTruckWaypoint(this.foodTruck);
    this.events.push({ type: 'food_truck_spawn', x, y });
    console.log('[GameEngine] Food Truck spawned!');
  }

  _setFoodTruckWaypoint(truck) {
    // Pick a random point on a road
    const roads = world.ROADS;
    const road = roads[Math.floor(Math.random() * roads.length)];
    truck.targetX = road.x + Math.random() * road.w;
    truck.targetY = road.y + Math.random() * road.h;
  }

  _setFoodTruckEscapeWaypoint(truck) {
    // Head toward a map edge to escape
    const edges = [
      { x: -50, y: truck.y },
      { x: world.WORLD_WIDTH + 50, y: truck.y },
      { x: truck.x, y: -50 },
      { x: truck.x, y: world.WORLD_HEIGHT + 50 },
    ];
    const edge = edges[Math.floor(Math.random() * edges.length)];
    truck.targetX = edge.x;
    truck.targetY = edge.y;
  }

  // ============================================================
  // NPC REVENGE
  // ============================================================
  _getAreaQuadrant(x, y) {
    const qx = x < 1500 ? 0 : 1;
    const qy = y < 1500 ? 0 : 1;
    return qy * 2 + qx; // 0=TL, 1=TR, 2=BL, 3=BR
  }

  _addAreaChaos(x, y, amount) {
    const q = this._getAreaQuadrant(x, y);
    this.areaChaos[q] += amount;
  }

  _updateRevengeNPCs(dt, now) {
    // Decay area chaos: -1 per 2 seconds per quadrant
    for (let q = 0; q < 4; q++) {
      this.areaChaos[q] = Math.max(0, this.areaChaos[q] - (dt / 2));
    }

    // Check if any quadrant > 40 and no active revenge
    for (let q = 0; q < 4; q++) {
      if (this.areaChaos[q] > 40 && this.revengeExpiry[q] < now) {
        this._spawnRevengeNPCs(q, now);
        this.areaChaos[q] = 0; // Reset that quadrant
      }
    }

    // Update revenge NPCs
    for (const [npcId, npc] of this.revengeNPCs) {
      if (now >= npc.expiresAt) {
        this.revengeNPCs.delete(npcId);
        continue;
      }

      // Chase nearest bird at 100 px/s
      let nearestBird = null;
      let nearestDist = Infinity;
      for (const bird of this.birds.values()) {
        const dx = bird.x - npc.x;
        const dy = bird.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestBird = bird;
        }
      }

      if (nearestBird) {
        const dx = nearestBird.x - npc.x;
        const dy = nearestBird.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          npc.x += (dx / dist) * 100 * dt;
          npc.y += (dy / dist) * 100 * dt;
        }

        // Catch within 25px: stun 2s, -10% food, then despawn
        if (dist < 25) {
          nearestBird.stunnedUntil = now + 2000;
          nearestBird.food = Math.max(0, Math.floor(nearestBird.food * 0.9));
          this.events.push({ type: 'revenge_npc_catch', birdId: nearestBird.id, x: npc.x, y: npc.y });
          this.events.push({ type: 'stunned', birdId: nearestBird.id, duration: 2000 });
          this.revengeNPCs.delete(npcId);
          continue;
        }
      }

      // Keep in bounds
      npc.x = Math.max(20, Math.min(world.WORLD_WIDTH - 20, npc.x));
      npc.y = Math.max(20, Math.min(world.WORLD_HEIGHT - 20, npc.y));
    }
  }

  _spawnRevengeNPCs(quadrant, now) {
    const baseX = (quadrant % 2) === 0 ? 750 : 2250;
    const baseY = quadrant < 2 ? 750 : 2250;

    for (let i = 0; i < 5; i++) {
      const npc = {
        id: 'revenge_' + uid(),
        type: 'revenge_npc',
        x: baseX + (Math.random() - 0.5) * 400,
        y: baseY + (Math.random() - 0.5) * 400,
        expiresAt: now + 25000,
      };
      this.revengeNPCs.set(npc.id, npc);
    }

    this.revengeExpiry[quadrant] = now + 25000;
    this.events.push({ type: 'npc_revenge', quadrant });
    console.log(`[GameEngine] Revenge NPCs spawned in quadrant ${quadrant}!`);
  }

  _updateMissions(now) {
    for (const bird of this.birds.values()) {
      if (!bird.activeMission) continue;
      const am = bird.activeMission;
      const def = this._getMissionDef(am.missionId);
      if (!def) {
        bird.activeMission = null;
        continue;
      }

      const elapsed = now - am.startedAt;
      const timeLimit = def.timeLimit || 60000;

      // Check timeout
      if (elapsed > timeLimit) {
        bird.activeMission = null;
        this.events.push({ type: 'mission_failed', birdId: bird.id, missionId: am.missionId, title: def.title });
        continue;
      }

      // For group missions, aggregate progress from flock
      let totalProgress = am.progress;
      if (def.type === 'group' && bird.flockId) {
        for (const otherBird of this.birds.values()) {
          if (otherBird.id === bird.id || otherBird.flockId !== bird.flockId) continue;
          if (otherBird.activeMission && otherBird.activeMission.missionId === am.missionId) {
            totalProgress += otherBird.activeMission.progress;
          }
        }
      }

      // Check completion
      const target = def.objective && def.objective.count ? def.objective.count : 1;
      if (totalProgress >= target) {
        bird.xp += def.xpReward;
        const missionCoinReward = 10 + Math.floor(Math.random() * 16); // 10-25 coins
        bird.coins += missionCoinReward;
        bird.activeMission = null;
        this._addChaos(10);
        this.events.push({ type: 'mission_complete', birdId: bird.id, missionId: am.missionId, title: def.title, xpReward: def.xpReward, coinReward: missionCoinReward });

        // Also reward flock mates on same mission
        if (def.type === 'group' && bird.flockId) {
          for (const otherBird of this.birds.values()) {
            if (otherBird.id === bird.id || otherBird.flockId !== bird.flockId) continue;
            if (otherBird.activeMission && otherBird.activeMission.missionId === am.missionId) {
              otherBird.xp += def.xpReward;
              otherBird.activeMission = null;
              this.events.push({ type: 'mission_complete', birdId: otherBird.id, missionId: am.missionId, title: def.title, xpReward: def.xpReward });
            }
          }
        }
      }
    }
  }
  // ============================================================
  // THE GODFATHER RACCOON (night boss — stalks the rich, demands tribute)
  // ============================================================
  _spawnGodfatherRaccoon(now) {
    // Spawn in dark corners of the city
    const spawnPoints = [
      { x: 250, y: 250 },
      { x: 2850, y: 250 },
      { x: 250, y: 2850 },
      { x: 2850, y: 2850 },
    ];
    const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    this.godfatherRaccoon = {
      id: 'godfather_' + uid(),
      x: sp.x, y: sp.y,
      rotation: 0,
      hp: 220, maxHp: 220,
      speed: 50,
      state: 'stalking',   // 'stalking' | 'escaping'
      targetBirdId: null,
      damageByBird: new Map(),
      tributeCoins: 0,
      tributeCooldowns: new Map(), // birdId -> last tribute timestamp
      escapeTimer: now + 180000,   // 3 minutes to defeat or he escapes
      spawnedAt: now,
    };
    this.godfatherSpawnedThisNight = true;
    this.events.push({ type: 'godfather_spawn', x: sp.x, y: sp.y });
    console.log(`[GameEngine] 🎩 GODFATHER RACCOON spawned at ${Math.round(sp.x)}, ${Math.round(sp.y)}`);
  }

  _updateGodfatherRaccoon(dt, now) {
    const isNight = this.dayPhase === 'night';

    // Reset spawn flag each day so next night gets a fresh Godfather
    if (this.dayPhase === 'day') {
      this.godfatherSpawnedThisNight = false;
    }

    // Despawn if present but night is over (dawn/day)
    if (this.godfatherRaccoon && !isNight) {
      if (this.godfatherRaccoon.state !== 'escaping') {
        // Dawn comes — Godfather slips away. Rob top 2 richest birds as parting gift.
        const richBirds = Array.from(this.birds.values())
          .filter(b => b.coins > 15)
          .sort((a, b) => b.coins - a.coins)
          .slice(0, 2);
        const victims = [];
        for (const b of richBirds) {
          const stolen = Math.min(Math.floor(b.coins * 0.15), 120);
          if (stolen > 0) {
            b.coins -= stolen;
            victims.push({ id: b.id, name: b.name, stolen });
          }
        }
        this.events.push({ type: 'godfather_escaped', victims });
      }
      this.godfatherRaccoon = null;
      return;
    }

    // Spawn during night — random chance, once per night, requires players
    if (!this.godfatherRaccoon && isNight && !this.godfatherSpawnedThisNight && this.birds.size > 0) {
      if (Math.random() < 0.003) { // ~0.3% per tick at 20Hz = ~1 per 17s average during night
        this._spawnGodfatherRaccoon(now);
      }
      return;
    }

    if (!this.godfatherRaccoon) return;
    const gf = this.godfatherRaccoon;

    // Defeat check (hp <= 0)
    if (gf.hp <= 0) {
      const totalDmg = Array.from(gf.damageByBird.values()).reduce((sum, d) => sum + d, 0) || 1;
      const coinPool = 200 + gf.tributeCoins; // base reward + stolen tribute returned to the city
      const rewards = [];
      for (const [birdId, dmg] of gf.damageByBird) {
        const bird = this.birds.get(birdId);
        if (!bird) continue;
        const coinShare = Math.round((dmg / totalDmg) * coinPool);
        const xpShare = 80 + Math.round((dmg / totalDmg) * 350);
        bird.coins += coinShare;
        bird.xp += xpShare;
        rewards.push({ name: bird.name, coins: coinShare, xp: xpShare });
      }
      this.events.push({ type: 'godfather_defeated', rewards, tributeCoins: gf.tributeCoins });
      this.godfatherRaccoon = null;
      return;
    }

    // Escape timer expired — rob and flee
    if (now >= gf.escapeTimer && gf.state !== 'escaping') {
      const richBirds = Array.from(this.birds.values())
        .filter(b => b.coins > 20)
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 2);
      const victims = [];
      for (const b of richBirds) {
        const stolen = Math.min(Math.floor(b.coins * 0.25), 200);
        if (stolen > 0) {
          b.coins -= stolen;
          victims.push({ id: b.id, name: b.name, stolen });
        }
      }
      gf.state = 'escaping';
      const edge = this._raccoonEdgeTarget(gf.x, gf.y);
      gf.targetX = edge.x;
      gf.targetY = edge.y;
      gf.speed = 170;
      this.events.push({ type: 'godfather_escaped', victims });
    }

    // Escaping: run for the edge
    if (gf.state === 'escaping') {
      const dx = gf.targetX - gf.x;
      const dy = gf.targetY - gf.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        gf.x += (dx / dist) * gf.speed * dt;
        gf.y += (dy / dist) * gf.speed * dt;
        gf.rotation = Math.atan2(dy, dx);
      }
      if (gf.x < -100 || gf.x > world.WORLD_WIDTH + 100 ||
          gf.y < -100 || gf.y > world.WORLD_HEIGHT + 100) {
        this.godfatherRaccoon = null;
      }
      return;
    }

    // Stalking: find richest bird and walk toward them
    let richestBird = null;
    let maxCoins = -1;
    for (const bird of this.birds.values()) {
      if (bird.stunnedUntil > now + 200) continue;
      if (bird.coins > maxCoins) {
        maxCoins = bird.coins;
        richestBird = bird;
      }
    }

    if (richestBird) {
      gf.targetBirdId = richestBird.id;
      const dx = richestBird.x - gf.x;
      const dy = richestBird.y - gf.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 45) {
        gf.x += (dx / dist) * gf.speed * dt;
        gf.y += (dy / dist) * gf.speed * dt;
        gf.rotation = Math.atan2(dy, dx);
      }
    }

    // Tribute collection: rob any bird within 75px (per-bird 15s cooldown)
    for (const bird of this.birds.values()) {
      const bdx = bird.x - gf.x;
      const bdy = bird.y - gf.y;
      const bDist = Math.sqrt(bdx * bdx + bdy * bdy);
      const lastTribute = gf.tributeCooldowns.get(bird.id) || 0;
      if (bDist < 75 && now - lastTribute > 15000 && bird.coins >= 6) {
        const taken = Math.min(Math.floor(bird.coins * 0.18), 180);
        if (taken > 0) {
          bird.coins -= taken;
          gf.tributeCoins += taken;
          gf.tributeCooldowns.set(bird.id, now);
          this.events.push({ type: 'godfather_tribute', birdId: bird.id, birdName: bird.name, taken, x: gf.x, y: gf.y });
        }
      }
    }

    // Keep inside world bounds
    gf.x = Math.max(60, Math.min(world.WORLD_WIDTH - 60, gf.x));
    gf.y = Math.max(60, Math.min(world.WORLD_HEIGHT - 60, gf.y));
  }

  // ============================================================
  // THE ARENA — PvP colosseum
  // ============================================================
  _updateArena(dt, now) {
    const arena = this.arena;

    if (arena.state === 'waiting') {
      // Drop disconnected fighters and refund them
      for (const [fighterId, fighter] of arena.fighters) {
        if (!this.birds.has(fighterId)) {
          arena.fighters.delete(fighterId);
          arena.pot = Math.max(0, arena.pot - this.ARENA_ENTRY_FEE);
        }
      }

      if (arena.fighters.size === 0) {
        arena.state = 'idle';
        arena.pot = 0;
        arena.waitingUntil = null;
        return;
      }
      if (arena.fighters.size === 1) {
        // Only one fighter — refund and reset
        for (const [fighterId] of arena.fighters) {
          const bird = this.birds.get(fighterId);
          if (bird) {
            bird.coins += this.ARENA_ENTRY_FEE;
            this.events.push({ type: 'arena_refund', birdId: fighterId, birdName: bird.name });
          }
        }
        arena.fighters.clear();
        arena.state = 'idle';
        arena.pot = 0;
        arena.waitingUntil = null;
        return;
      }

      // Start countdown when 2+ fighters AND wait time elapsed, or 4+ fighters immediately
      if (arena.fighters.size >= 4 || (arena.fighters.size >= 2 && now >= arena.waitingUntil)) {
        arena.state = 'countdown';
        arena.countdownUntil = now + this.ARENA_COUNTDOWN_MS;
        this.events.push({
          type: 'arena_countdown',
          countdown: this.ARENA_COUNTDOWN_MS / 1000,
          fighterCount: arena.fighters.size,
          pot: arena.pot,
          fighters: [...arena.fighters.values()].map(f => f.name),
        });
      }
    }

    if (arena.state === 'countdown') {
      // Drop disconnected fighters
      for (const [fighterId] of arena.fighters) {
        if (!this.birds.has(fighterId)) {
          arena.fighters.delete(fighterId);
          arena.pot = Math.max(0, arena.pot - this.ARENA_ENTRY_FEE);
        }
      }

      if (arena.fighters.size < 2) {
        // Not enough fighters — cancel and refund
        for (const [fighterId] of arena.fighters) {
          const bird = this.birds.get(fighterId);
          if (bird) bird.coins += this.ARENA_ENTRY_FEE;
        }
        arena.fighters.clear();
        arena.state = 'idle';
        arena.pot = 0;
        arena.countdownUntil = null;
        this.events.push({ type: 'arena_cancelled', reason: 'not_enough_fighters' });
        return;
      }

      if (now >= arena.countdownUntil) {
        arena.state = 'fighting';
        arena.fightEndsAt = now + this.ARENA_FIGHT_DURATION;
        this.events.push({
          type: 'arena_fight_start',
          fighterCount: arena.fighters.size,
          pot: arena.pot,
          fightDuration: this.ARENA_FIGHT_DURATION,
          fighters: [...arena.fighters.values()].map(f => f.name),
        });
      }
    }

    if (arena.state === 'fighting') {
      // Mark disconnected fighters as eliminated
      for (const [fighterId, fighter] of arena.fighters) {
        if (!this.birds.has(fighterId) && !fighter.eliminated) {
          fighter.eliminated = true;
          this.events.push({
            type: 'arena_eliminated',
            birdId: fighterId, birdName: fighter.name,
            killedById: null, killedByName: null, reason: 'disconnect',
          });
        }
      }

      const activeFighters = [...arena.fighters.entries()].filter(([, f]) => !f.eliminated);

      if (activeFighters.length <= 1) {
        // Fight over — last bird standing (or draw if all disconnected)
        this._endArenaFight(now, activeFighters.length === 1 ? activeFighters[0][0] : null);
        return;
      }

      // Time's up — most HP wins
      if (now >= arena.fightEndsAt) {
        activeFighters.sort(([, a], [, b]) => b.arenaHp - a.arenaHp);
        // Tie-break: whoever dealt more damage
        if (activeFighters[0][1].arenaHp === activeFighters[1][1].arenaHp) {
          activeFighters.sort(([, a], [, b]) => b.damageDealt - a.damageDealt);
        }
        this._endArenaFight(now, activeFighters[0][0]);
        return;
      }
    }

    if (arena.state === 'cooldown') {
      if (now >= arena.cooldownUntil) {
        arena.state = 'idle';
        arena.fighters.clear();
        arena.pot = 0;
        arena.countdownUntil = null;
        arena.fightEndsAt = null;
        arena.cooldownUntil = null;
        arena.waitingUntil = null;
      }
    }
  }

  _endArenaFight(now, winnerId) {
    const arena = this.arena;
    const fighterNames = [...arena.fighters.values()].map(f => f.name);

    if (winnerId) {
      const winner = this.birds.get(winnerId);
      if (winner) {
        winner.coins += arena.pot;
        winner.xp += 200;
        console.log(`[Arena] 🏆 Winner: ${winner.name} — pot ${arena.pot}c`);
      }
      this.events.push({
        type: 'arena_victory',
        winnerId,
        winnerName: winnerId && this.birds.get(winnerId) ? this.birds.get(winnerId).name : (arena.fighters.get(winnerId) || {}).name || '???',
        pot: arena.pot,
        fighters: fighterNames,
      });
    } else {
      // Draw — refund all connected fighters
      for (const [fighterId] of arena.fighters) {
        const bird = this.birds.get(fighterId);
        if (bird) bird.coins += this.ARENA_ENTRY_FEE;
      }
      this.events.push({ type: 'arena_draw', fighters: fighterNames });
    }

    arena.state = 'cooldown';
    arena.cooldownUntil = now + this.ARENA_COOLDOWN_MS;
    arena.fightEndsAt = null;
    arena.countdownUntil = null;
  }

  _handleArenaEnter(bird, now) {
    const arena = this.arena;
    const ARENA = world.ARENA;

    // Can only enter during idle or waiting
    if (arena.state !== 'idle' && arena.state !== 'waiting') {
      const reason = arena.state === 'fighting' ? 'Fight in progress!' :
                     arena.state === 'countdown' ? 'Fight starting soon!' :
                     'Arena cooling down...';
      this.events.push({ type: 'arena_enter_fail', birdId: bird.id, reason });
      return;
    }

    // Already registered as a fighter
    if (arena.fighters.has(bird.id)) {
      this.events.push({ type: 'arena_enter_fail', birdId: bird.id, reason: 'Already in the arena!' });
      return;
    }

    // Proximity check (must be within radius + 80px of center)
    const dx = bird.x - ARENA.x;
    const dy = bird.y - ARENA.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > ARENA.radius + 80) {
      this.events.push({ type: 'arena_enter_fail', birdId: bird.id, reason: 'Fly closer to the Arena!' });
      return;
    }

    // Coins check
    if (bird.coins < this.ARENA_ENTRY_FEE) {
      this.events.push({ type: 'arena_enter_fail', birdId: bird.id, reason: `Need ${this.ARENA_ENTRY_FEE}c to enter!` });
      return;
    }

    // Charge entry fee and register fighter
    bird.coins -= this.ARENA_ENTRY_FEE;
    arena.pot += this.ARENA_ENTRY_FEE;

    arena.fighters.set(bird.id, {
      arenaHp: 3,
      maxArenaHp: 3,
      eliminated: false,
      damageDealt: 0,
      name: bird.name,
    });

    if (arena.state === 'idle') {
      arena.state = 'waiting';
      arena.waitingUntil = now + this.ARENA_WAIT_MS;
    }

    this.events.push({
      type: 'arena_enter',
      birdId: bird.id, birdName: bird.name,
      fighterCount: arena.fighters.size,
      pot: arena.pot,
      waitUntil: arena.waitingUntil,
    });
    console.log(`[Arena] ⚔️ ${bird.name} entered the arena (pot: ${arena.pot}c, fighters: ${arena.fighters.size})`);
  }

  // ============================================================
  // BANK HEIST — multi-phase cooperative robbery
  // Phase 1: CASING   — disable 3 security cameras (hold E, 3s each)
  // Phase 2: CRACKING — drill the vault (hold E at north face)
  // Phase 3: ESCAPE   — fly to getaway van before timer expires
  // ============================================================
  _initBankHeistState() {
    return {
      phase: 'idle',
      cameras: [
        { id: 0, x: 1888, y: 1680, disabled: false, disableProgress: 0, disabledBy: null },
        { id: 1, x: 2035, y: 1745, disabled: false, disableProgress: 0, disabledBy: null },
        { id: 2, x: 1958, y: 1858, disabled: false, disableProgress: 0, disabledBy: null },
      ],
      casingStartedAt: null,
      casingExpiresAt: null,
      crackProgress: 0,
      crackContributions: {},
      crackContributorNames: {},
      crackStartedAt: null,
      crackAlarmSent: false,
      crackSwatSent: false,
      escapeVan: null,   // { x, y, escapees: Set<birdId> }
      escapeEndsAt: null,
      cooldownUntil: null,
    };
  }

  _getBankHeistStateFor(birdId) {
    const bh = this.bankHeist;
    return {
      phase: bh.phase,
      cameras: bh.cameras.map(c => ({
        id: c.id, x: c.x, y: c.y,
        disabled: c.disabled,
        disableProgress: c.disableProgress,
        disabledBy: c.disabledBy,
      })),
      crackProgress: bh.crackProgress,
      crackContributorCount: Object.keys(bh.crackContributions).length,
      crackStartedAt: bh.crackStartedAt,
      isCracker: !!bh.crackContributions[birdId],
      escapeVan: bh.escapeVan ? {
        x: bh.escapeVan.x,
        y: bh.escapeVan.y,
        hasEscaped: bh.escapeVan.escapees.has(birdId),
        escapeeCount: bh.escapeVan.escapees.size,
      } : null,
      escapeEndsAt: bh.escapeEndsAt,
      casingExpiresAt: bh.casingExpiresAt,
    };
  }

  _updateBankHeist(dt, now) {
    const bh = this.bankHeist;
    const VAULT_X = 1960, VAULT_Y = 1695; // north face of the Bank building
    const ESCAPE_POINTS = [
      { x: 2960, y: 1560 },
      { x: 80,   y: 1560 },
      { x: 1660, y: 2960 },
    ];

    // ---- IDLE: wait for timer ----
    if (bh.phase === 'idle') {
      if (now >= this.bankHeistTimer && this.birds.size > 0) {
        bh.phase = 'casing';
        bh.casingStartedAt = now;
        bh.casingExpiresAt = now + 120000; // 2 minutes to disable cameras
        for (const cam of bh.cameras) {
          cam.disabled = false;
          cam.disableProgress = 0;
          cam.disabledBy = null;
        }
        this.events.push({ type: 'bank_heist_casing_start' });
        console.log('[BankHeist] Phase 1: CASING started');
      }
      return;
    }

    // ---- COOLDOWN ----
    if (bh.phase === 'cooldown') {
      if (now >= bh.cooldownUntil) {
        bh.phase = 'idle';
        this.bankHeistTimer = now + this._randomRange(480000, 720000);
      }
      return;
    }

    // ---- PHASE 1: CASING — disable 3 cameras ----
    if (bh.phase === 'casing') {
      if (now > bh.casingExpiresAt) {
        // Window closed — announce failure & cooldown
        this.events.push({ type: 'bank_heist_casing_failed' });
        bh.phase = 'cooldown';
        bh.cooldownUntil = now + 300000; // 5 min retry
        for (const cam of bh.cameras) {
          cam.disabled = false;
          cam.disableProgress = 0;
          cam.disabledBy = null;
        }
        console.log('[BankHeist] Casing FAILED — timeout');
        return;
      }

      for (const cam of bh.cameras) {
        if (cam.disabled) continue;
        const disablers = [];
        for (const bird of this.birds.values()) {
          if (!bird.input.e) continue;
          const dx = bird.x - cam.x;
          const dy = bird.y - cam.y;
          if (Math.sqrt(dx * dx + dy * dy) < 55) disablers.push(bird);
        }

        if (disablers.length > 0) {
          // Progress fills: 3s per camera solo, faster with more birds
          cam.disableProgress = Math.min(1.0, cam.disableProgress + 0.33 * disablers.length * dt);
          cam.disabledBy = disablers[0].name;
          if (cam.disableProgress >= 1.0) {
            cam.disabled = true;
            for (const b of disablers) {
              b.xp += 20;
              b.coins += 8;
            }
            const allDown = bh.cameras.every(c => c.disabled);
            this.events.push({
              type: 'bank_heist_camera_down',
              cameraId: cam.id,
              birdName: disablers[0].name,
              allDown,
            });
            console.log(`[BankHeist] Camera ${cam.id} disabled by ${disablers[0].name}. All down: ${allDown}`);
          }
        } else {
          // Slowly drain back if untouched
          cam.disableProgress = Math.max(0, cam.disableProgress - 0.08 * dt);
          if (cam.disableProgress === 0) cam.disabledBy = null;
        }
      }

      if (bh.cameras.every(c => c.disabled)) {
        bh.phase = 'cracking';
        bh.crackStartedAt = now;
        bh.crackProgress = 0;
        bh.crackContributions = {};
        bh.crackContributorNames = {};
        bh.crackAlarmSent = false;
        bh.crackSwatSent = false;
        this.events.push({ type: 'bank_heist_cracking_start' });
        console.log('[BankHeist] Phase 2: CRACKING started');
      }
      return;
    }

    // ---- PHASE 2: CRACKING — drill the vault ----
    if (bh.phase === 'cracking') {
      const drillers = [];
      for (const bird of this.birds.values()) {
        if (!bird.input.e) continue;
        const dx = bird.x - VAULT_X;
        const dy = bird.y - VAULT_Y;
        if (Math.sqrt(dx * dx + dy * dy) < 75) drillers.push(bird);
      }

      if (drillers.length > 0) {
        const drillRate = Math.min(drillers.length, 4) * 0.05; // 1 bird=20s, 3 birds~7s
        bh.crackProgress = Math.min(1.0, bh.crackProgress + drillRate * dt);

        for (const bird of drillers) {
          bh.crackContributions[bird.id] = (bh.crackContributions[bird.id] || 0) + dt;
          bh.crackContributorNames[bird.id] = bird.name;
          this._addHeat(bird.id, 1.5 * dt); // drilling generates serious heat
        }

        // 8s in: cops respond
        if (!bh.crackAlarmSent && now - bh.crackStartedAt > 8000) {
          bh.crackAlarmSent = true;
          for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.5;
            const dist = 450 + Math.random() * 200;
            const cx = Math.max(50, Math.min(world.WORLD_WIDTH - 50, VAULT_X + Math.cos(angle) * dist));
            const cy = Math.max(50, Math.min(world.WORLD_HEIGHT - 50, VAULT_Y + Math.sin(angle) * dist));
            const copId = 'cop_bank_' + uid();
            this.copBirds.set(copId, {
              id: copId, type: 'cop_pigeon',
              x: cx, y: cy, rotation: 0,
              targetBirdId: drillers[0] ? drillers[0].id : null,
              speed: 130, state: 'chasing',
              stunUntil: 0, offDutyUntil: 0, sirensPhase: Math.random() * Math.PI * 2,
            });
          }
          this.events.push({ type: 'bank_heist_alarm', x: VAULT_X, y: VAULT_Y });
          console.log('[BankHeist] ALARM! 3 cops dispatched to bank');
        }

        // 16s in: SWAT arrives
        if (!bh.crackSwatSent && now - bh.crackStartedAt > 16000) {
          bh.crackSwatSent = true;
          const angle = Math.random() * Math.PI * 2;
          const sx = Math.max(50, Math.min(world.WORLD_WIDTH - 50, VAULT_X + Math.cos(angle) * 550));
          const sy = Math.max(50, Math.min(world.WORLD_HEIGHT - 50, VAULT_Y + Math.sin(angle) * 550));
          const swatId = 'swat_bank_' + uid();
          this.copBirds.set(swatId, {
            id: swatId, type: 'swat_crow',
            x: sx, y: sy, rotation: 0,
            targetBirdId: drillers[0] ? drillers[0].id : null,
            speed: 155, state: 'chasing',
            stunUntil: 0, offDutyUntil: 0, sirensPhase: Math.random() * Math.PI * 2,
          });
          this.events.push({ type: 'bank_heist_swat', x: VAULT_X, y: VAULT_Y });
          console.log('[BankHeist] SWAT dispatched!');
        }

        // VAULT CRACKED!
        if (bh.crackProgress >= 1.0) {
          const ep = ESCAPE_POINTS[Math.floor(Math.random() * ESCAPE_POINTS.length)];
          bh.escapeVan = { x: ep.x, y: ep.y, escapees: new Set() };
          bh.escapeEndsAt = now + 45000; // 45s to reach van
          bh.phase = 'escape';
          this.events.push({ type: 'bank_heist_escape_start', vanX: ep.x, vanY: ep.y });
          console.log(`[BankHeist] VAULT CRACKED! Escape van at ${ep.x},${ep.y}`);
        }
      } else {
        // Progress drains slowly if nobody drilling
        if (bh.crackProgress > 0) {
          bh.crackProgress = Math.max(0, bh.crackProgress - 0.025 * dt);
        }
      }
      return;
    }

    // ---- PHASE 3: ESCAPE — reach the getaway van ----
    if (bh.phase === 'escape') {
      const van = bh.escapeVan;

      // Check if any heister reached the van
      for (const bird of this.birds.values()) {
        if (van.escapees.has(bird.id)) continue;
        if (!bh.crackContributions[bird.id]) continue; // not a heister
        const dx = bird.x - van.x;
        const dy = bird.y - van.y;
        if (Math.sqrt(dx * dx + dy * dy) < 65) {
          van.escapees.add(bird.id);
          this.events.push({
            type: 'bank_heist_bird_escaped',
            birdId: bird.id,
            birdName: bird.name,
          });
        }
      }

      // Time's up — resolve rewards
      if (now >= bh.escapeEndsAt) {
        this._resolveBankHeist(now);
      }
      return;
    }
  }

  _resolveBankHeist(now) {
    const bh = this.bankHeist;
    const contributions = bh.crackContributions;
    const names = bh.crackContributorNames;
    const totalTime = Object.values(contributions).reduce((a, b) => a + b, 0) || 1;
    const numContributors = Object.keys(contributions).length;
    const escapees = bh.escapeVan ? bh.escapeVan.escapees : new Set();
    const escapeCount = escapees.size;

    const basePot = 500 + numContributors * 150;
    const rewards = [];

    for (const [birdId, time] of Object.entries(contributions)) {
      const bird = this.birds.get(birdId);
      const share = time / totalTime;
      const fullCoins = Math.floor(share * basePot);
      const escaped = escapees.has(birdId);
      const coins = escaped ? fullCoins : Math.floor(fullCoins * 0.3);
      const xp = escaped ? Math.floor(250 + share * 400) : Math.floor(60 + share * 80);
      if (bird) {
        bird.coins += coins;
        bird.xp += xp;
        bird.food += escaped ? 40 : 10;
        this._addHeat(birdId, escaped ? 60 : 30);
        const newLevel = world.getLevelFromXP(bird.xp);
        const newType = world.getBirdTypeForLevel(newLevel);
        if (newType !== bird.type) {
          bird.type = newType;
          this.events.push({ type: 'evolve', birdId: bird.id, name: bird.name, birdType: newType });
        }
        bird.level = newLevel;
      }
      rewards.push({ birdId, name: names[birdId] || '?', coins, xp, escaped });
    }

    this._addChaos(80);

    this.events.push({
      type: 'bank_heist_complete',
      rewards,
      escapeCount,
      totalCrackers: numContributors,
    });

    console.log(`[BankHeist] RESOLVED! Escapees: ${escapeCount}/${numContributors}`);

    // Daily challenge: bank heist participants
    for (const r of rewards) {
      const b = this.birds.get(r.birdId);
      if (b) {
        this._trackDailyProgress(b, 'heist', 1);
        this._trackDailyProgress(b, 'coins_earned', r.coins);
      }
    }

    bh.phase = 'cooldown';
    bh.cooldownUntil = now + this._randomRange(480000, 720000);
    bh.escapeVan = null;
    bh.escapeEndsAt = null;
    bh.crackContributions = {};
    bh.crackContributorNames = {};
  }

  // ============================================================
  // GRAFFITI SYSTEM
  // ============================================================
  _updateGraffiti(now) {
    // Clean expired tags every 15s
    if (now - this._lastGraffitiClean < 15000) return;
    this._lastGraffitiClean = now;
    for (const [idx, tag] of this.graffiti.entries()) {
      if (tag.expiresAt <= now) {
        this.graffiti.delete(idx);
      }
    }
  }

  // ============================================================
  // RADIO TOWER SYSTEM
  // ============================================================
  _updateRadioTower(dt, now) {
    const rt = this.radioTower;

    // Expire signal boost
    if (rt.signalBoostUntil > 0 && now >= rt.signalBoostUntil) {
      rt.signalBoostUntil = 0;
      this.events.push({ type: 'signal_boost_ended' });
    }

    // Expire ownership
    if (rt.state === 'owned' && rt.expiresAt && now >= rt.expiresAt) {
      this.events.push({
        type: 'tower_expired',
        ownerName: rt.ownerName,
      });
      rt.state = 'neutral';
      rt.ownerId = null;
      rt.ownerName = null;
      rt.ownerColor = null;
      rt.capturedAt = null;
      rt.expiresAt = null;
      rt.signalBoostUsed = false;
      rt.broadcastCooldownUntil = 0;
      rt.lastRewardAt = 0;
      return;
    }

    // Passive coins for owner while they're online (5c per 20s)
    if (rt.state === 'owned' && rt.ownerId && now - rt.lastRewardAt >= 20000) {
      const owner = this.birds.get(rt.ownerId);
      if (owner) {
        owner.coins += 5;
        rt.lastRewardAt = now;
      }
    }
  }

  _handleTowerCapture(bird, now) {
    const rt = this.radioTower;
    const towerPos = world.RADIO_TOWER;

    // Server-side proximity validation
    const dx = bird.x - towerPos.x;
    const dy = bird.y - towerPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > towerPos.captureRadius + 40) return;

    // Already the owner
    if (rt.ownerId === bird.id) return;

    const prevOwnerName = rt.ownerName;
    const ownerColor = bird.birdColor || this._teamColor(bird.flockId || bird.id);

    rt.state = 'owned';
    rt.ownerId = bird.id;
    rt.ownerName = bird.name;
    rt.ownerColor = ownerColor;
    rt.capturedAt = now;
    rt.expiresAt = now + 180000;  // 3 minutes
    rt.lastRewardAt = now;
    rt.broadcastCooldownUntil = 0;
    rt.signalBoostUsed = false;
    rt.signalBoostUntil = 0;

    // XP + coin reward for capture
    bird.xp += 50;
    bird.coins += 20;
    const newLevel = world.getLevelFromXP(bird.xp);
    bird.level = newLevel;
    const newType = world.getBirdTypeForLevel(newLevel);
    if (newType !== bird.type) {
      bird.type = newType;
      this.events.push({ type: 'evolve', birdId: bird.id, name: bird.name, birdType: newType });
    }

    this._addChaos(25);
    this.events.push({
      type: 'tower_captured',
      birdId: bird.id,
      birdName: bird.name,
      ownerColor,
      prevOwnerName: prevOwnerName || null,
    });
  }

  _handleTowerBroadcast(bird, broadcastType, now) {
    const rt = this.radioTower;
    if (rt.ownerId !== bird.id) return;

    const displayName = bird.flockName
      ? '[' + bird.flockName + '] ' + bird.name
      : bird.name;

    if (broadcastType === 'taunt') {
      if (now < rt.broadcastCooldownUntil) return;

      const TAUNTS = [
        'runs this city. Everyone else is just visiting.',
        'broadcasts: Your coins are safe... unless I find them.',
        'says: Challenge me. I dare you.',
        'announces: Tonight we feast. On your losses.',
        'declares: The airwaves, the streets, the skies — ALL MINE.',
        'reports: Today\'s weather forecast — CHAOS, all day.',
        'says: All complaints go through me. In poop form.',
        'on air: Looking for worthy opponents. Criteria: none so far.',
        'broadcast: If you\'re hearing this, you\'re already in my territory.',
        'announces: The city has spoken. It said my name.',
      ];
      const taunt = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
      rt.broadcastCooldownUntil = now + 30000; // 30s cooldown

      bird.xp += 10;
      this.events.push({
        type: 'tower_broadcast',
        broadcastType: 'taunt',
        message: displayName + ' ' + taunt,
        ownerColor: rt.ownerColor,
      });

    } else if (broadcastType === 'signal_boost') {
      if (rt.signalBoostUsed) return;
      if (bird.coins < 30) return;

      bird.coins -= 30;
      rt.signalBoostUsed = true;
      rt.signalBoostUntil = now + 60000; // 60 seconds

      this._addChaos(30);
      this.events.push({
        type: 'tower_broadcast',
        broadcastType: 'signal_boost',
        message: bird.name + ' activated the SIGNAL BOOST! All birds get +50% XP for 60 seconds!',
        ownerColor: rt.ownerColor,
        duration: 60000,
      });
    }
  }

  // ============================================================
  // PIGEON RACING TRACK
  // ============================================================

  _handleRaceJoin(bird, now) {
    const race = this.pigeonRace;

    if (race.state !== 'open') {
      this.events.push({ type: 'race_join_fail', birdId: bird.id, reason: 'not_open' });
      return;
    }
    if (race.racers.has(bird.id)) {
      this.events.push({ type: 'race_join_fail', birdId: bird.id, reason: 'already_joined' });
      return;
    }
    if (race.racers.size >= this.RACE_MAX_RACERS) {
      this.events.push({ type: 'race_join_fail', birdId: bird.id, reason: 'full' });
      return;
    }
    if (bird.coins < this.RACE_ENTRY_FEE) {
      this.events.push({ type: 'race_join_fail', birdId: bird.id, reason: 'no_coins' });
      return;
    }

    // Proximity check to the start/finish line
    const start = this.RACE_CHECKPOINTS[0];
    const dx = bird.x - start.x;
    const dy = bird.y - start.y;
    if (dx * dx + dy * dy > 250 * 250) {
      this.events.push({ type: 'race_join_fail', birdId: bird.id, reason: 'too_far' });
      return;
    }

    bird.coins -= this.RACE_ENTRY_FEE;
    race.pot += this.RACE_ENTRY_FEE;

    race.racers.set(bird.id, {
      birdId: bird.id,
      name: bird.name,
      nextCpIdx: 1,       // next checkpoint to hit (1..4)
      needsFinish: false, // true after all 4 CPs cleared — must return to finish
      finished: false,
      finishTime: null,
      finishPosition: null,
    });

    this.events.push({
      type: 'race_join',
      birdId: bird.id,
      birdName: bird.name,
      racerCount: race.racers.size,
      pot: race.pot,
      openUntil: race.openUntil,
    });
  }

  _updatePigeonRace(dt, now) {
    const race = this.pigeonRace;

    // ── IDLE: open registration when timer fires ──────────────
    if (race.state === 'idle') {
      if (now >= this.pigeonRaceTimer && this.birds.size > 0) {
        race.state = 'open';
        race.openUntil = now + this.RACE_OPEN_MS;
        this.events.push({
          type: 'race_open',
          openUntil: race.openUntil,
          entryFee: this.RACE_ENTRY_FEE,
        });
      }
      return;
    }

    // ── OPEN: registration window ─────────────────────────────
    if (race.state === 'open') {
      // Drop disconnected racers (refund them)
      for (const [bid] of race.racers) {
        if (!this.birds.has(bid)) {
          race.racers.delete(bid);
          race.pot = Math.max(0, race.pot - this.RACE_ENTRY_FEE);
        }
      }

      // Fill up → start countdown immediately
      if (race.racers.size >= this.RACE_MAX_RACERS) {
        this._startRaceCountdown(now);
        return;
      }

      // Time expired
      if (now >= race.openUntil) {
        if (race.racers.size < 2) {
          // Not enough — cancel and refund
          for (const [bid] of race.racers) {
            const b = this.birds.get(bid);
            if (b) b.coins += this.RACE_ENTRY_FEE;
          }
          race.racers.clear();
          race.pot = 0;
          race.state = 'idle';
          this.pigeonRaceTimer = now + this._randomRange(300000, 480000);
          this.events.push({ type: 'race_cancelled', reason: 'not_enough_racers' });
        } else {
          this._startRaceCountdown(now);
        }
      }
      return;
    }

    // ── COUNTDOWN: 5-second GO! countdown ────────────────────
    if (race.state === 'countdown') {
      // Drop disconnected racers
      for (const [bid] of race.racers) {
        if (!this.birds.has(bid)) {
          race.racers.delete(bid);
          race.pot = Math.max(0, race.pot - this.RACE_ENTRY_FEE);
        }
      }

      if (race.racers.size < 2) {
        for (const [bid] of race.racers) {
          const b = this.birds.get(bid);
          if (b) b.coins += this.RACE_ENTRY_FEE;
        }
        race.racers.clear();
        race.pot = 0;
        race.state = 'idle';
        race.countdownUntil = null;
        this.pigeonRaceTimer = now + this._randomRange(300000, 480000);
        this.events.push({ type: 'race_cancelled', reason: 'not_enough_racers' });
        return;
      }

      if (now >= race.countdownUntil) {
        race.state = 'racing';
        race.raceStartAt = now;
        race.raceEndsAt = now + this.RACE_MAX_DURATION;
        this.events.push({
          type: 'race_start',
          racerCount: race.racers.size,
          pot: race.pot,
          racers: [...race.racers.values()].map(r => r.name),
        });
      }
      return;
    }

    // ── RACING: checkpoint detection ─────────────────────────
    if (race.state === 'racing') {
      // Mark disconnected racers as DNF
      for (const [bid, racer] of race.racers) {
        if (!this.birds.has(bid) && !racer.finished) {
          racer.finished = true;
          racer.finishTime = null; // DNF
        }
      }

      // Detect checkpoint hits
      for (const [bid, racer] of race.racers) {
        if (racer.finished) continue;
        const b = this.birds.get(bid);
        if (!b) continue;

        // Which checkpoint are they aiming for?
        const targetCp = racer.needsFinish
          ? this.RACE_CHECKPOINTS[0]  // finish line = start position
          : this.RACE_CHECKPOINTS[racer.nextCpIdx];

        const dx = b.x - targetCp.x;
        const dy = b.y - targetCp.y;
        if (dx * dx + dy * dy <= targetCp.r * targetCp.r) {
          if (racer.needsFinish) {
            // 🏁 FINISHED!
            racer.finished = true;
            racer.finishTime = now - race.raceStartAt;
            racer.finishPosition = race.winners.length + 1;
            race.winners.push({ birdId: bid, name: racer.name, time: racer.finishTime });

            this.events.push({
              type: 'race_finish',
              birdId: bid,
              birdName: racer.name,
              position: racer.finishPosition,
              time: racer.finishTime,
            });

            // Check if all racers are done
            const allDone = [...race.racers.values()].every(r => r.finished);
            if (allDone) {
              this._endPigeonRace(now, false);
              return;
            }
          } else {
            // Hit an intermediate checkpoint
            racer.nextCpIdx++;
            if (racer.nextCpIdx >= this.RACE_CHECKPOINTS.length) {
              racer.needsFinish = true; // all CPs cleared — head for finish!
            }

            const position = this._getRacerPosition(bid);
            this.events.push({
              type: 'race_checkpoint_hit',
              birdId: bid,
              birdName: racer.name,
              checkpoint: racer.needsFinish ? 'FINISH' : ('CP ' + racer.nextCpIdx),
              cpNum: racer.needsFinish ? 5 : racer.nextCpIdx,
              position,
            });
          }
        }
      }

      // Time limit expired
      if (now >= race.raceEndsAt) {
        this._endPigeonRace(now, true);
      }
      return;
    }

    // ── FINISHED: show results then reset ────────────────────
    if (race.state === 'finished') {
      if (race.finishedAt && now >= race.finishedAt + 15000) {
        race.state = 'idle';
        race.racers.clear();
        race.bets.clear();
        race.pot = 0;
        race.winners = [];
        race.finishedAt = null;
        race.openUntil = null;
        race.countdownUntil = null;
        race.raceStartAt = null;
        race.raceEndsAt = null;
        this.pigeonRaceTimer = now + this._randomRange(480000, 720000); // 8-12 min
      }
    }
  }

  _startRaceCountdown(now) {
    const race = this.pigeonRace;
    race.state = 'countdown';
    race.countdownUntil = now + this.RACE_COUNTDOWN_MS;
    this.events.push({
      type: 'race_countdown',
      countdown: this.RACE_COUNTDOWN_MS / 1000,
      racerCount: race.racers.size,
      pot: race.pot,
      racers: [...race.racers.values()].map(r => r.name),
    });
  }

  _getRacerPosition(birdId) {
    const race = this.pigeonRace;
    const positions = [...race.racers.entries()].map(([id, r]) => ({
      id,
      score: r.finished ? 999 : (r.needsFinish ? 5 : r.nextCpIdx - 1),
    }));
    positions.sort((a, b) => b.score - a.score);
    return positions.findIndex(p => p.id === birdId) + 1;
  }

  _endPigeonRace(now, isTimeout) {
    const race = this.pigeonRace;
    race.state = 'finished';
    race.finishedAt = now;

    // Assign finish positions to any unfinished racers by checkpoint progress
    if (isTimeout || [...race.racers.values()].some(r => !r.finished)) {
      const unfinished = [...race.racers.entries()]
        .filter(([, r]) => !r.finished)
        .map(([id, r]) => ({ id, score: r.needsFinish ? 5 : r.nextCpIdx - 1 }))
        .sort((a, b) => b.score - a.score);

      for (const { id } of unfinished) {
        const racer = race.racers.get(id);
        if (racer) {
          racer.finished = true;
          racer.finishTime = null; // DNF / timeout
          racer.finishPosition = race.winners.length + 1;
          race.winners.push({ birdId: id, name: racer.name, time: null });
        }
      }
    }

    // Calculate and distribute rewards
    const pot = race.pot;
    const rewards = [];

    for (const [bid, racer] of race.racers) {
      const b = this.birds.get(bid);
      if (!b) continue;

      const fp = racer.finishPosition || (race.racers.size + 1);
      let coins = 0;
      let xp = 0;

      if (fp === 1) {
        coins = Math.floor(pot * 0.60);
        xp = 400;
      } else if (fp === 2) {
        coins = Math.floor(pot * 0.25);
        xp = 200;
      } else if (fp === 3) {
        coins = Math.floor(pot * 0.15);
        xp = 100;
      } else {
        xp = 50; // consolation XP for racing
      }

      b.coins += coins;
      b.xp += xp;
      rewards.push({ birdId: bid, name: racer.name, position: fp, coins, xp, time: racer.finishTime });
    }

    rewards.sort((a, b) => a.position - b.position);

    this.events.push({
      type: 'race_results',
      isTimeout,
      pot,
      rewards,
    });

    // === Process spectator bets ===
    if (race.bets.size > 0 && race.winners.length > 0) {
      const winnerId = race.winners[0].birdId;
      const winnerName = race.winners[0].name;

      const winningBets = [...race.bets.entries()].filter(([, b]) => b.targetId === winnerId);
      const losingBets  = [...race.bets.entries()].filter(([, b]) => b.targetId !== winnerId);

      const totalWinningAmount = winningBets.reduce((s, [, b]) => s + b.amount, 0);
      const totalPool = [...race.bets.values()].reduce((s, b) => s + b.amount, 0);

      const betResults = [];

      if (winningBets.length === 0) {
        // No one bet on the winner — refund everyone
        for (const [bid, bet] of race.bets) {
          const b = this.birds.get(bid);
          if (b) b.coins += bet.amount;
          betResults.push({
            birdId: bid,
            birdName: b ? b.name : '?',
            betAmount: bet.amount,
            payout: bet.amount,
            profit: 0,
            won: false,
            refund: true,
          });
        }
        this.events.push({ type: 'race_bet_results', winnerName, noWinners: true, results: betResults });
      } else {
        // Winners split the full pool proportionally (minimum 1.5× guaranteed)
        for (const [bid, bet] of winningBets) {
          const b = this.birds.get(bid);
          if (!b) continue;
          const payout = Math.max(
            Math.floor(bet.amount * 1.5),
            Math.floor(totalPool * bet.amount / totalWinningAmount)
          );
          b.coins += payout;
          b.xp += 50;
          betResults.push({ birdId: bid, birdName: b.name, betAmount: bet.amount, payout, profit: payout - bet.amount, won: true });
        }
        for (const [bid, bet] of losingBets) {
          const b = this.birds.get(bid);
          betResults.push({ birdId: bid, birdName: b ? b.name : '?', betAmount: bet.amount, payout: 0, profit: -bet.amount, won: false });
        }
        this.events.push({ type: 'race_bet_results', winnerName, noWinners: false, results: betResults });
      }
    }
  }

  // ============================================================
  // UNDERGROUND SEWER SYSTEM
  // ============================================================
  _initSewerLoot() {
    world.SEWER_LOOT_POSITIONS.forEach((pos, i) => {
      const id = 'sewer_loot_' + i;
      this.sewerLoot.set(id, {
        id, x: pos.x, y: pos.y,
        value: 30 + Math.floor(Math.random() * 60), // 30–89 coins
        available: true,
        respawnAt: 0,
      });
    });
  }

  _handleEnterSewer(bird, now) {
    if (bird.inSewer) return;
    if (now - (bird.lastSewerEntry || 0) < 3000) return; // 3s cooldown
    // Server-side proximity to any manhole
    for (const mh of world.MANHOLES) {
      const dx = bird.x - mh.x;
      const dy = bird.y - mh.y;
      if (Math.sqrt(dx * dx + dy * dy) < 60) {
        bird.inSewer = true;
        bird.lastSewerEntry = now;
        // Heat decays 3x faster underground (paranoid birds hide well)
        this.events.push({ type: 'sewer_enter', birdId: bird.id, name: bird.name, x: bird.x, y: bird.y });
        return;
      }
    }
  }

  _handleExitSewer(bird, now) {
    if (!bird.inSewer) return;
    if (now - (bird.lastSewerEntry || 0) < 2000) return; // must stay 2s min
    for (const mh of world.MANHOLES) {
      const dx = bird.x - mh.x;
      const dy = bird.y - mh.y;
      if (Math.sqrt(dx * dx + dy * dy) < 60) {
        bird.inSewer = false;
        bird.lastSewerEntry = now;
        this.events.push({ type: 'sewer_exit', birdId: bird.id, name: bird.name, x: bird.x, y: bird.y });
        return;
      }
    }
  }

  _updateSewerRats(dt, now) {
    const anyBirdUnderground = Array.from(this.birds.values()).some(b => b.inSewer);

    // Despawn all rats when nobody is underground
    if (!anyBirdUnderground) {
      this.sewerRats.clear();
      return;
    }

    // Spawn up to 4 rats (one every 6s)
    if (this.sewerRats.size < 4 && now - this._lastSewerRatSpawn > 6000) {
      this._lastSewerRatSpawn = now;
      const id = 'rat_' + Math.random().toString(36).slice(2, 8);
      this.sewerRats.set(id, {
        id,
        x: this._randomRange(200, world.WORLD_WIDTH - 200),
        y: this._randomRange(200, world.WORLD_HEIGHT - 200),
        rotation: 0,
        state: 'patrolling',
        targetX: 0, targetY: 0,
        nextPatrolAt: now,
        lastAttack: 0,
        speed: 110 + Math.random() * 50,
      });
    }

    for (const rat of this.sewerRats.values()) {
      // Find nearest underground bird
      let nearestBird = null, nearestDist = 240;
      for (const bird of this.birds.values()) {
        if (!bird.inSewer) continue;
        const dx = bird.x - rat.x, dy = bird.y - rat.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) { nearestBird = bird; nearestDist = dist; }
      }

      if (nearestBird) {
        rat.state = 'chasing';
        const dx = nearestBird.x - rat.x, dy = nearestBird.y - rat.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          rat.x += (dx / dist) * rat.speed * dt;
          rat.y += (dy / dist) * rat.speed * dt;
          rat.rotation = Math.atan2(dy, dx);
        }
        // Attack on contact
        if (dist < 45 && now - rat.lastAttack > 3500 && nearestBird.stunnedUntil <= now) {
          rat.lastAttack = now;
          const stolen = Math.min(Math.floor(this._randomRange(8, 28)), nearestBird.coins);
          nearestBird.coins -= stolen;
          nearestBird.stunnedUntil = now + 1500;
          // Break combo streak
          nearestBird.comboCount = 0;
          nearestBird.comboExpiresAt = 0;
          this.events.push({ type: 'sewer_rat_attack', birdId: nearestBird.id, ratId: rat.id, stolen, x: rat.x, y: rat.y });
        }
      } else {
        rat.state = 'patrolling';
        if (now >= rat.nextPatrolAt) {
          rat.targetX = this._randomRange(100, world.WORLD_WIDTH - 100);
          rat.targetY = this._randomRange(100, world.WORLD_HEIGHT - 100);
          rat.nextPatrolAt = now + this._randomRange(3000, 7000);
        }
        const dx = rat.targetX - rat.x, dy = rat.targetY - rat.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 20) {
          rat.x += (dx / dist) * rat.speed * 0.5 * dt;
          rat.y += (dy / dist) * rat.speed * 0.5 * dt;
          rat.rotation = Math.atan2(dy, dx);
        }
      }

      rat.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, rat.x));
      rat.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, rat.y));
    }
  }

  _updateSewerLoot(now) {
    for (const loot of this.sewerLoot.values()) {
      if (!loot.available && loot.respawnAt > 0 && now >= loot.respawnAt) {
        loot.available = true;
        loot.value = 30 + Math.floor(Math.random() * 60); // fresh value on respawn
      }
    }
  }

  _handleRaceBet(bird, action, now) {
    const race = this.pigeonRace;

    if (race.state !== 'open' && race.state !== 'countdown') {
      this.events.push({ type: 'race_bet_fail', birdId: bird.id, reason: 'not_open' });
      return;
    }
    if (race.racers.has(bird.id)) {
      this.events.push({ type: 'race_bet_fail', birdId: bird.id, reason: 'racer_no_bet' });
      return;
    }
    if (race.bets.has(bird.id)) {
      this.events.push({ type: 'race_bet_fail', birdId: bird.id, reason: 'already_bet' });
      return;
    }
    if (race.racers.size === 0) {
      this.events.push({ type: 'race_bet_fail', birdId: bird.id, reason: 'no_racers' });
      return;
    }

    const amount = typeof action.amount === 'number' ? Math.floor(action.amount) : 0;
    if (amount < 10 || amount > 500) {
      this.events.push({ type: 'race_bet_fail', birdId: bird.id, reason: 'invalid_amount' });
      return;
    }
    if (bird.coins < amount) {
      this.events.push({ type: 'race_bet_fail', birdId: bird.id, reason: 'no_coins' });
      return;
    }

    const targetId = action.targetId;
    const targetRacer = race.racers.get(targetId);
    if (!targetRacer) {
      this.events.push({ type: 'race_bet_fail', birdId: bird.id, reason: 'invalid_racer' });
      return;
    }

    bird.coins -= amount;
    race.bets.set(bird.id, { targetId, targetName: targetRacer.name, amount });

    this.events.push({
      type: 'race_bet_placed',
      birdId: bird.id,
      birdName: bird.name,
      targetName: targetRacer.name,
      amount,
      totalBets: race.bets.size,
    });
  }

  // ============================================================
  // GOLDEN EGG SCRAMBLE
  // ============================================================
  _startEggScramble(now) {
    const eggs = new Map();
    // Pick 3 random spawn positions from the pool
    const pool = world.EGG_SPAWN_POOL.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    for (const pos of pool) {
      const id = 'egg_' + uid();
      eggs.set(id, {
        id,
        x: pos.x + (Math.random() - 0.5) * 60,
        y: pos.y + (Math.random() - 0.5) * 60,
        carrierId: null,
        carrierName: null,
        delivered: false,
      });
    }

    this.eggScramble = {
      state: 'active',
      startedAt: now,
      endsAt: now + 180000, // 3 minutes
      eggs,
      delivered: 0,
    };

    this.events.push({
      type: 'egg_scramble_start',
      endsAt: this.eggScramble.endsAt,
      eggCount: eggs.size,
    });
  }

  _updateEggScramble(dt, now) {
    // Trigger a new scramble if timer elapsed and there are players
    if (!this.eggScramble && now >= this.eggScrambleTimer && this.birds.size > 0) {
      this._startEggScramble(now);
    }
    if (!this.eggScramble) return;

    const scramble = this.eggScramble;
    const nestZones = world.EGG_NEST_ZONES;

    // Check expiry or all delivered
    if (now >= scramble.endsAt || scramble.delivered >= scramble.eggs.size) {
      // Drop any still-carried eggs
      for (const egg of scramble.eggs.values()) {
        if (!egg.delivered && egg.carrierId) {
          const carrier = this.birds.get(egg.carrierId);
          if (carrier) {
            carrier.carryingEggId = null;
            carrier.eggTackleImmunityUntil = 0;
          }
        }
      }
      const allDelivered = scramble.delivered >= scramble.eggs.size;
      this.events.push({
        type: 'egg_scramble_end',
        delivered: scramble.delivered,
        total: scramble.eggs.size,
        allDelivered,
      });
      this.eggScramble = null;
      this.eggScrambleTimer = now + this._randomRange(720000, 1080000);
      return;
    }

    for (const egg of scramble.eggs.values()) {
      if (egg.delivered) continue;

      if (!egg.carrierId) {
        // Unclaimed egg — check if any bird picks it up
        for (const bird of this.birds.values()) {
          if (bird.inNest || bird.inSewer || bird.stunnedUntil > now) continue;
          if (bird.carryingEggId) continue; // Already carrying
          const dx = bird.x - egg.x;
          const dy = bird.y - egg.y;
          if (dx * dx + dy * dy < 35 * 35) {
            egg.carrierId = bird.id;
            egg.carrierName = bird.name;
            bird.carryingEggId = egg.id;
            this.events.push({
              type: 'egg_grabbed',
              birdId: bird.id,
              birdName: bird.name,
              eggId: egg.id,
              x: egg.x, y: egg.y,
            });
            break;
          }
        }
      } else {
        // Egg is being carried — sync position with carrier
        const carrier = this.birds.get(egg.carrierId);
        if (!carrier) {
          // Carrier disconnected — drop the egg in place
          egg.carrierId = null;
          egg.carrierName = null;
          continue;
        }

        egg.x = carrier.x;
        egg.y = carrier.y;

        // Check for delivery at a nest zone
        let delivered = false;
        for (const nest of nestZones) {
          const dx = carrier.x - nest.x;
          const dy = carrier.y - nest.y;
          if (dx * dx + dy * dy < nest.r * nest.r) {
            egg.delivered = true;
            egg.carrierId = null;
            egg.carrierName = null;
            carrier.carryingEggId = null;
            carrier.eggTackleImmunityUntil = 0;
            scramble.delivered++;

            // Reward scales with delivery order
            const orderRewards = [
              { xp: 500, coins: 250, food: 25 },
              { xp: 300, coins: 150, food: 15 },
              { xp: 200, coins: 100, food: 10 },
            ];
            const reward = orderRewards[scramble.delivered - 1] || { xp: 150, coins: 75, food: 8 };

            carrier.xp    += reward.xp;
            carrier.coins += reward.coins;
            carrier.food   = Math.min(carrier.food + reward.food, 100);

            // Level up check
            const newLevel = world.getLevelFromXP(carrier.xp);
            if (newLevel !== carrier.level) {
              carrier.level = newLevel;
              const newType = world.getBirdTypeForLevel(newLevel);
              if (newType !== carrier.type) {
                carrier.type = newType;
                this.events.push({ type: 'evolve', birdId: carrier.id, name: carrier.name, birdType: newType });
              }
            }

            this.events.push({
              type: 'egg_delivered',
              birdId: carrier.id,
              birdName: carrier.name,
              eggId: egg.id,
              nestId: nest.id,
              deliveryNumber: scramble.delivered,
              total: scramble.eggs.size,
              xp: reward.xp,
              coins: reward.coins,
            });
            // Daily challenge: egg delivery
            this._trackDailyProgress(carrier, 'egg_delivered', 1);
            this._trackDailyProgress(carrier, 'coins_earned', reward.coins);
            delivered = true;
            break;
          }
        }
        if (delivered) continue;

        // Check for tackle: rival bird close enough steals the egg
        for (const rival of this.birds.values()) {
          if (rival.id === egg.carrierId) continue;
          if (rival.inNest || rival.inSewer || rival.stunnedUntil > now) continue;
          if (rival.carryingEggId) continue; // Rival already has an egg
          if (rival.eggTackleImmunityUntil > now) continue;

          const dx = rival.x - carrier.x;
          const dy = rival.y - carrier.y;
          if (dx * dx + dy * dy < 45 * 45) {
            // TACKLE — rival steals the egg
            carrier.carryingEggId = null;
            carrier.eggTackleImmunityUntil = now + 3000; // 3s immunity
            egg.carrierId = rival.id;
            egg.carrierName = rival.name;
            rival.carryingEggId = egg.id;
            egg.x = rival.x;
            egg.y = rival.y;
            this.events.push({
              type: 'egg_tackled',
              tacklerBirdId: rival.id,
              tacklerName: rival.name,
              victimBirdId: carrier.id,
              victimName: carrier.name,
              eggId: egg.id,
              x: rival.x, y: rival.y,
            });
            break;
          }
        }
      }
    }
  }

  _getEggScrambleState() {
    if (!this.eggScramble) return null;
    return {
      state: this.eggScramble.state,
      endsAt: this.eggScramble.endsAt,
      delivered: this.eggScramble.delivered,
      eggs: Array.from(this.eggScramble.eggs.values()).map(e => ({
        id: e.id,
        x: e.x, y: e.y,
        carrierId: e.carrierId,
        carrierName: e.carrierName,
        delivered: e.delivered,
      })),
    };
  }

  // ============================================================
  // KINGPIN SYSTEM
  // ============================================================

  _updateKingpin(now) {
    // Check every 5 seconds
    if (now - this.kingpinCheckTimer < 5000) return;
    this.kingpinCheckTimer = now;

    // Find richest online bird — minimum 200 coins to be crowned
    let richestBird = null;
    let richestCoins = 199; // threshold
    for (const b of this.birds.values()) {
      if (b.inNest) continue; // AFK birds can't be crowned
      if (b.coins > richestCoins) {
        richestCoins = b.coins;
        richestBird = b;
      }
    }

    // If current kingpin is no longer online, clear them
    if (this.kingpin && !this.birds.has(this.kingpin.birdId)) {
      const oldName = this.kingpin.birdName;
      this.kingpin = null;
      this.events.push({ type: 'kingpin_dethroned', deposed: oldName, deposedByName: null, loot: 0, reason: 'disconnected' });
    }

    // Crown new kingpin (or update coins on existing)
    if (richestBird) {
      if (!this.kingpin) {
        // New kingpin!
        this.kingpin = {
          birdId: richestBird.id,
          birdName: richestBird.name,
          coins: richestBird.coins,
          crownedAt: now,
          hitCount: new Map(),
          lastPassiveReward: now,
        };
        this.events.push({
          type: 'kingpin_crowned',
          birdId: richestBird.id,
          birdName: richestBird.name,
          coins: richestBird.coins,
        });
      } else if (this.kingpin.birdId !== richestBird.id) {
        // Richer bird is now online — crown passes automatically (bloodless transfer)
        const oldName = this.kingpin.birdName;
        this.kingpin = {
          birdId: richestBird.id,
          birdName: richestBird.name,
          coins: richestBird.coins,
          crownedAt: now,
          hitCount: new Map(),
          lastPassiveReward: now,
        };
        this.events.push({
          type: 'kingpin_crowned',
          birdId: richestBird.id,
          birdName: richestBird.name,
          coins: richestBird.coins,
          oldKingpin: oldName,
        });
      } else {
        // Same kingpin — update their coin count
        this.kingpin.coins = richestBird.coins;
      }
    } else if (this.kingpin) {
      // Nobody is rich enough — throne goes vacant
      const oldName = this.kingpin.birdName;
      this.kingpin = null;
      this.events.push({ type: 'kingpin_dethroned', deposed: oldName, deposedByName: null, loot: 0, reason: 'broke' });
    }

    // Passive income: Kingpin earns 20 coins every 30 seconds as "city tribute"
    if (this.kingpin) {
      const kBird = this.birds.get(this.kingpin.birdId);
      if (kBird && now - this.kingpin.lastPassiveReward >= 30000) {
        kBird.coins += 20;
        this.kingpin.coins = kBird.coins;
        this.kingpin.lastPassiveReward = now;
        this.events.push({
          type: 'kingpin_tribute',
          birdId: kBird.id,
          birdName: kBird.name,
          amount: 20,
        });
      }
    }
  }

  _handleKingpinHit(attacker, now) {
    if (!this.kingpin) return;
    // Can't hit yourself as kingpin
    if (attacker.id === this.kingpin.birdId) return;

    const count = (this.kingpin.hitCount.get(attacker.id) || 0) + 1;
    this.kingpin.hitCount.set(attacker.id, count);

    // Small bonus for hitting the kingpin
    attacker.xp += 35;
    attacker.coins += 10;

    this.events.push({
      type: 'kingpin_hit',
      attackerId: attacker.id,
      attackerName: attacker.name,
      targetName: this.kingpin.birdName,
      count,
      hitsNeeded: 3,
    });

    if (count >= 3) {
      this._dethroneKingpin(attacker, now);
    }
  }

  _dethroneKingpin(attacker, now) {
    if (!this.kingpin) return;

    const kBird = this.birds.get(this.kingpin.birdId);
    let lootAmount = 0;

    if (kBird) {
      lootAmount = Math.min(600, Math.max(80, Math.floor(kBird.coins * 0.28)));
      kBird.coins = Math.max(0, kBird.coins - lootAmount);
      kBird.comboCount = 0;   // combo shattered
      kBird.stunnedUntil = now + 2500; // brief stun
    }

    attacker.coins += lootAmount;
    attacker.xp += 450;
    attacker.mafiaRep = (attacker.mafiaRep || 0) + 2; // KINGPIN SLAYER earns mafia rep

    const dethroned = { birdId: this.kingpin.birdId, birdName: this.kingpin.birdName };
    this.kingpin = null;

    // Level check for attacker
    const newLevel = world.getLevelFromXP(attacker.xp);
    if (newLevel !== attacker.level) {
      attacker.level = newLevel;
      attacker.type = world.getBirdTypeForLevel(newLevel);
      this.events.push({ type: 'evolve', birdId: attacker.id, name: attacker.name, birdType: attacker.type });
    }

    this.events.push({
      type: 'kingpin_dethroned',
      deposed: dethroned.birdName,
      deposedById: attacker.id,
      deposedByName: attacker.name,
      loot: lootAmount,
      reason: 'defeated',
    });

    // Trigger screen shake for all players via a shockwave event
    this.events.push({ type: 'kingpin_topple_shockwave', x: kBird ? kBird.x : 1500, y: kBird ? kBird.y : 1500 });

    // Immediately check for new kingpin
    this.kingpinCheckTimer = 0;
    this._updateKingpin(now);
  }

}

module.exports = GameEngine;
