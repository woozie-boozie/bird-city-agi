const { v4: uuidv4 } = require('crypto');
const { db: firestoreDb } = require('./db');
const world = require('./world');

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

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

    // === BOSS BATTLES ===
    this.boss = null;                 // { type, x, y, hp, maxHp, speed, rotation, spawnedAt, lastAttack }
    this.bossSpawnTimer = Date.now() + this._randomRange(300000, 480000); // 5-8 min

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

    // === WEATHER SYSTEM ===
    this.weather = null;              // { type, intensity, windAngle, windSpeed, endsAt, wormSpawnTimer, lightningTimer }
    this.weatherTimer = Date.now() + this._randomRange(60000, 120000); // 1-2 min to first weather
    this.rainWorms = new Map();       // id -> true (worm food ids spawned during rain)

    // === TERRITORY CONTROL ===
    this.territories = new Map();  // zoneId -> zone state
    this._initTerritories();

    // === LEADERBOARD CACHE (async Firestore) ===
    this._cachedLeaderboard = [];
    this._refreshLeaderboard();
    this._leaderboardInterval = setInterval(() => this._refreshLeaderboard(), 10000);

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
    };

    // Determine bird type from XP
    const level = world.getLevelFromXP(bird.xp);
    bird.type = world.getBirdTypeForLevel(level);
    bird.level = level;

    this.birds.set(id, bird);

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

    // === Mission actions ===
    if (action.type === 'accept_mission') {
      this._handleAcceptMission(bird, action.missionId, now);
    }
  }

  tick() {
    const now = Date.now();
    const dt = Math.min((now - this.lastTick) / 1000, 0.1); // cap at 100ms
    this.lastTick = now;

    // Update birds
    for (const bird of this.birds.values()) {
      this._updateBird(bird, dt, now);
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

    // === Missions ===
    this._updateMissions(now);
    this._updateMissionBoard(now);

    // === Chaos Meter ===
    this._updateChaosMeter(dt, now);
    this._updateChaosEvent(dt, now);

    // === Boss Battles ===
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

    // === Weather ===
    this._updateWeather(dt, now);

    // === Territory Control ===
    this._updateTerritories(dt, now);

    // === Day/Night Cycle ===
    this._updateDayNight(dt, now);
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
    if (bird.input.space && now - bird.lastPoop > poopCooldown) {
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

      // Check if mega poop
      const isMegaPoop = bird.megaPoopReady;
      if (isMegaPoop) {
        bird.megaPoopReady = false;
        bird.powerUp = null; // Consumed
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
      } else if (hit.target === 'cop' && hit.cop) {
        // Poop hit a cop bird! Stun it — daring escape move
        const cop = hit.cop;
        const stunDuration = cop.type === 'swat' ? 3000 : 5000; // SWAT shrug it off faster
        cop.state = 'stunned';
        cop.stunnedUntil = now + stunDuration;
        xpGain = cop.type === 'swat' ? 80 : 50;
        bird.coins += cop.type === 'swat' ? 25 : 15;
        this.events.push({ type: 'cop_pooped', birdId: bird.id, birdName: bird.name, copType: cop.type, x: cop.x, y: cop.y });
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
      bird.coins += coinGain;

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

    if (isMegaPoop && allHits.length > 0) {
      return { target: allHits[0].target, npc: allHits[0].npc, allHits };
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
      // Rain is most common, storm is rarest
      const roll = Math.random();
      let type;
      if (roll < 0.40) type = 'rain';
      else if (roll < 0.75) type = 'wind';
      else type = 'storm';

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
      } else { // storm
        duration = this._randomRange(90000, 150000); // 1.5–2.5 min
        windSpeed = 80 + Math.random() * 100;
        intensity = 1.0;
      }

      this.weather = {
        type,
        intensity,
        windAngle,
        windSpeed,
        endsAt: now + duration,
        wormSpawnTimer: now + 5000,
        lightningTimer: now + this._randomRange(6000, 18000),
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
          this.events.push({ type: 'lightning_hit', birdId: b.id, birdName: b.name, x: b.x, y: b.y });
        }
      }

      this.weather.lightningTimer = now + this._randomRange(8000, 28000);
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
      const teamCounts = new Map(); // teamId -> { count, name, isFlock }
      for (const bird of this.birds.values()) {
        if (bird.x >= zone.x && bird.x <= zone.x + zone.w &&
            bird.y >= zone.y && bird.y <= zone.y + zone.h) {
          const teamId = bird.flockId || ('solo_' + bird.id);
          const teamName = bird.flockName || bird.name;
          const isFlock = !!bird.flockId;
          if (!teamCounts.has(teamId)) {
            teamCounts.set(teamId, { count: 0, name: teamName, isFlock });
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
            zone.ownerColor = this._teamColor(dominantTeamId);
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
            const teamId = bird.flockId || ('solo_' + bird.id);
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
      };
    }

    // Food truck state
    let foodTruckState = null;
    if (this.foodTruck) {
      foodTruckState = {
        x: this.foodTruck.x, y: this.foodTruck.y,
        w: this.foodTruck.w, h: this.foodTruck.h,
        foodLeft: this.foodTruck.foodLeft,
        angle: this.foodTruck.angle,
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
      wantedBirdId: this.wantedBirdId,
      foodTruck: foodTruckState,
      raccoons: nearbyRaccoons,
      cops: nearbyCops,
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
      },
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
  // BOSS BATTLES
  // ============================================================
  _updateBoss(dt, now) {
    // Spawn boss
    if (!this.boss && now >= this.bossSpawnTimer && this.birds.size > 0) {
      this._spawnBoss(now);
    }

    if (!this.boss) return;

    const boss = this.boss;

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
      this.bossSpawnTimer = now + this._randomRange(300000, 480000);
      return;
    }
  }

  _spawnBoss(now) {
    const types = ['MEGA_CAT', 'MEGA_HAWK'];
    const type = types[Math.floor(Math.random() * types.length)];
    const roads = world.ROADS;
    const road = roads[Math.floor(Math.random() * roads.length)];
    const x = road.x + Math.random() * road.w;
    const y = road.y + Math.random() * road.h;

    if (type === 'MEGA_CAT') {
      this.boss = { type, x, y, hp: 100, maxHp: 100, speed: 120, rotation: 0, spawnedAt: now, lastAttack: 0 };
    } else {
      this.boss = { type, x, y, hp: 80, maxHp: 80, speed: 250, rotation: 0, spawnedAt: now, lastAttack: 0 };
    }
    this.events.push({ type: 'boss_spawn', bossType: type, x, y });
    console.log(`[GameEngine] BOSS SPAWNED: ${type} at ${Math.round(x)}, ${Math.round(y)}`);
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
    for (const [copId, cop] of this.copBirds) {

      // Stunned state
      if (cop.state === 'stunned') {
        if (now >= cop.stunnedUntil) {
          cop.state = 'pursuing';
        } else {
          continue;
        }
      }

      // Pursue wanted bird
      const dx = wanted.x - cop.x;
      const dy = wanted.y - cop.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

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
  // FOOD TRUCK
  // ============================================================
  _updateFoodTruck(dt, now) {
    // Spawn food truck
    if (!this.foodTruck && now >= this.foodTruckSpawnTimer && this.birds.size > 0) {
      this._spawnFoodTruck(now);
    }

    if (!this.foodTruck) return;

    const truck = this.foodTruck;

    // Drive toward waypoint
    const dx = truck.targetX - truck.x;
    const dy = truck.targetY - truck.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      // Pick next waypoint
      this._setFoodTruckWaypoint(truck);
    } else {
      truck.x += (dx / dist) * truck.speed * dt;
      truck.y += (dy / dist) * truck.speed * dt;
      truck.angle = Math.atan2(dy, dx);
    }

    // Keep in bounds
    truck.x = Math.max(20, Math.min(world.WORLD_WIDTH - 20, truck.x));
    truck.y = Math.max(20, Math.min(world.WORLD_HEIGHT - 20, truck.y));

    // Honk when birds are near (60px)
    if (truck.honkCooldown > 0) {
      truck.honkCooldown -= dt;
    } else {
      for (const bird of this.birds.values()) {
        const bdx = bird.x - truck.x;
        const bdy = bird.y - truck.y;
        if (Math.sqrt(bdx * bdx + bdy * bdy) < 60) {
          truck.honkCooldown = 3;
          this.events.push({ type: 'truck_honk', x: truck.x, y: truck.y });
          break;
        }
      }
    }

    // Steal food from truck: birds within 50px pressing E
    if (truck.foodLeft > 0) {
      for (const bird of this.birds.values()) {
        if (!bird.input.e || now - bird.lastSteal <= 1000) continue;
        const bdx = bird.x - truck.x;
        const bdy = bird.y - truck.y;
        if (Math.sqrt(bdx * bdx + bdy * bdy) < 50) {
          truck.foodLeft--;
          bird.xp += 10;
          bird.coins += 5;
          bird.food += 10;
          bird.totalSteals++;
          bird.lastSteal = now;
          this._addHeat(bird.id, 2);
          this._addChaos(2);
          this.events.push({
            type: 'steal', birdId: bird.id, foodId: 'truck_food',
            foodType: 'truck_food', x: truck.x, y: truck.y, value: 10,
          });
          break;
        }
      }
    }

    // When empty, speed up and drive away
    if (truck.foodLeft <= 0 && !truck.emptyAt) {
      truck.emptyAt = now;
      truck.speed = 120;
    }

    // Despawn 10s after empty
    if (truck.emptyAt && now - truck.emptyAt > 10000) {
      this.foodTruck = null;
      this.foodTruckSpawnTimer = now + this._randomRange(180000, 300000);
    }
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
      speed: 60,
      angle: 0,
      foodLeft: 10,
      targetX: x, targetY: y,
      honkCooldown: 0,
      emptyAt: null,
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
}

module.exports = GameEngine;
