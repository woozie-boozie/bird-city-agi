const { v4: uuidv4 } = require('crypto');
const { db: firestoreDb } = require('./db');
const world = require('./world');

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ============================================================
// DAILY CHALLENGE POOL — 3 picked each UTC day via seeded random
// ============================================================
// ============================================================
// PRESTIGE SYSTEM — Ascend at 10,000 XP, earn permanent badges + bonuses
// ============================================================
const PRESTIGE_THRESHOLD = 10000; // XP needed to prestige
const MAX_PRESTIGE = 5;
// Cumulative XP multiplier on poop hits per prestige tier (0-5)
const PRESTIGE_XP_MULTS   = [1.00, 1.15, 1.15, 1.15, 1.15, 1.20];
// Cumulative coin multiplier on poop hits per prestige tier
const PRESTIGE_COIN_MULTS = [1.00, 1.00, 1.10, 1.10, 1.10, 1.15];
// Poop cooldown multiplier per prestige tier (lower = faster)
const PRESTIGE_COOLDOWN_MULTS = [1.00, 1.00, 1.00, 0.85, 0.85, 0.80];
// Prestige badge strings
const PRESTIGE_BADGES = ['', '⚜️', '⚜️⚜️', '⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️⚜️'];

// ============================================================
// SKILL TREE SYSTEM — Permanent character build via Feather Points
// Earn 1 FP per level-up. Unlock from 4 branches: Combat, Speed, Wealth, Survival.
// ============================================================
const SKILL_TREE_DEFS = {
  // Combat Branch (orange) — POOP HARDER
  quick_draw:    { branch: 'combat',   tier: 1, cost: 1, req: null,           label: 'Quick Draw',    emoji: '🎯', desc: '-15% poop cooldown — fire faster' },
  splash_zone:   { branch: 'combat',   tier: 2, cost: 2, req: 'quick_draw',   label: 'Splash Zone',   emoji: '💥', desc: '+20% poop hit radius — wider shots' },
  double_tap:    { branch: 'combat',   tier: 3, cost: 3, req: 'splash_zone',  label: 'Double Tap',    emoji: '🔥', desc: '20% chance to fire a bonus poop on every hit' },
  // Speed Branch (cyan) — FLY FASTER
  aerodynamics:  { branch: 'speed',    tier: 1, cost: 1, req: null,            label: 'Aerodynamics',  emoji: '💨', desc: '+10% max speed permanently' },
  wind_rider:    { branch: 'speed',    tier: 2, cost: 2, req: 'aerodynamics',  label: 'Wind Rider',    emoji: '🌀', desc: 'All external speed boosts +30% stronger' },
  desperado:     { branch: 'speed',    tier: 3, cost: 3, req: 'wind_rider',    label: 'Desperado',     emoji: '⚡', desc: '+22% speed when food is below 25 — survival instinct' },
  // Wealth Branch (gold) — EARN MORE
  sticky_claws:  { branch: 'wealth',   tier: 1, cost: 1, req: null,            label: 'Sticky Claws',  emoji: '💰', desc: '+18% coins from every poop hit' },
  fence_rep:     { branch: 'wealth',   tier: 2, cost: 2, req: 'sticky_claws',  label: 'Fence Rep',     emoji: '🤝', desc: 'Black Market prices -20%' },
  territory_tax: { branch: 'wealth',   tier: 3, cost: 3, req: 'fence_rep',     label: 'Territory Tax', emoji: '🏦', desc: '+50% passive territory income' },
  // Survival Branch (green) — STAY ALIVE
  street_smart:  { branch: 'survival', tier: 1, cost: 1, req: null,            label: 'Street Smart',  emoji: '🧠', desc: '-20% heat generated per poop — stay off the radar' },
  iron_wings:    { branch: 'survival', tier: 2, cost: 2, req: 'street_smart',  label: 'Iron Wings',    emoji: '🛡️', desc: '-35% stun duration from all sources' },
  ghost_walk:    { branch: 'survival', tier: 3, cost: 3, req: 'iron_wings',    label: 'Ghost Walk',    emoji: '👻', desc: '18% chance to fully evade a cop arrest' },
};

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
  { id: 'flu_survivor',   title: 'Flu Fighter',     desc: 'Recover from Bird Flu (find medicine)',   target: 1,   trackType: 'flu_cured',       reward: { xp: 170, coins: 80  } },
  { id: 'piper_stopper',  title: 'Music Critic',    desc: 'Hit the Pied Piper to help drive him away', target: 3, trackType: 'piper_hit',       reward: { xp: 180, coins: 90  } },
  { id: 'cursed_holder',  title: 'Cursed!',         desc: 'Hold the Cursed Coin for 30+ seconds',     target: 1,  trackType: 'cursed_hold',     reward: { xp: 200, coins: 100 } },
  { id: 'coin_thief',     title: 'Coin Thief',      desc: 'Steal the Cursed Coin from another bird',  target: 1,  trackType: 'cursed_steal',    reward: { xp: 150, coins: 75  } },
  { id: 'donut_ambush',   title: 'Sugar Rush',      desc: 'Poop on the Donut Cop while he\'s eating (x2)', target: 2, trackType: 'donut_cop_hit',  reward: { xp: 200, coins: 90  } },
  { id: 'donut_briber',   title: 'Cop Briber',      desc: 'Bribe the Donut Cop to reduce your heat (x2)', target: 2, trackType: 'donut_bribe',   reward: { xp: 160, coins: 80  } },
  { id: 'street_fighter', title: 'Street Fighter',  desc: 'Win 2 street duels against other birds',        target: 2, trackType: 'duel_win',        reward: { xp: 220, coins: 110 } },
  { id: 'ace_pilot',      title: 'Ace Pilot',       desc: 'Bring down the police helicopter',              target: 1, trackType: 'helicopter_down',  reward: { xp: 250, coins: 120 } },
  { id: 'royale_winner',  title: 'Battle Royale',   desc: 'Win a Bird Royale shrinking-zone event',        target: 1, trackType: 'royale_win',       reward: { xp: 300, coins: 150 } },
  { id: 'champ',          title: 'Fighting Champ',  desc: 'Win the Pigeon Fighting Championship tournament', target: 1, trackType: 'tournament_win',   reward: { xp: 400, coins: 200 } },
  { id: 'idol_champ',    title: 'Idol Champion',   desc: 'Win the Bird City Idol singing contest',          target: 1, trackType: 'idol_won',         reward: { xp: 250, coins: 120 } },
  { id: 'blizzard_brawler', title: 'Blizzard Brawler', desc: 'Hit 10 targets during a blizzard storm',       target: 10, trackType: 'blizzard_hit',      reward: { xp: 220, coins: 110 } },
  { id: 'snow_bird',     title: 'Snow Bird',       desc: 'Drink hot cocoa AND land 5 poop hits in a blizzard', target: 1, trackType: 'snow_bird_complete', reward: { xp: 250, coins: 120 } },
  { id: 'meteor_catcher', title: 'Stargazer',      desc: 'Catch a Shooting Star or Meteor during the Aurora', target: 1, trackType: 'star_caught',       reward: { xp: 300, coins: 150 } },
  { id: 'ice_skater',    title: 'Ice Skater',     desc: 'Land 5 poop hits while sliding on the Ice Rink',    target: 5, trackType: 'ice_rink_hit',     reward: { xp: 240, coins: 120 } },
  { id: 'disco_king',   title: 'Disco King',     desc: 'Hit 8 NPCs during a Disco Fever chaos event',        target: 8, trackType: 'disco_fever_hit',  reward: { xp: 190, coins: 95  } },
  { id: 'coin_grabber', title: 'Money Rain',     desc: 'Collect 10 coins from a Coin Shower event',          target: 10,trackType: 'coin_shower_grab', reward: { xp: 160, coins: 80  } },
  { id: 'chaos_taster', title: 'Chaos Connoisseur', desc: 'Experience 4 different chaos event types in one session', target: 4, trackType: 'chaos_types_seen', reward: { xp: 210, coins: 105 } },
  { id: 'decree_subject',  title: 'Subject',       desc: 'Be affected by 2 different Kingpin decrees in one session', target: 2, trackType: 'decree_affected',   reward: { xp: 200, coins: 100 } },
  { id: 'revolutionary',  title: 'Revolutionary',  desc: "Participate in a People's Revolt against the Kingpin",     target: 1, trackType: 'revolt_participant', reward: { xp: 280, coins: 140 } },
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
    this.gangWarDecreeBoostUntil = 0; // timestamp: Wanted Decree × Gang War → 2× kill XP for 30s
    this.GANG_COLORS = ['#ff3333', '#ff8800', '#ffcc00', '#33cc55', '#3399ff', '#cc44ff', '#ff44aa', '#00ccdd'];
    this._loadGangs();

    // === GANG NESTS (persistent gang home bases) ===
    // One nest per gang — placed by the leader, acts as respawn point and XP shrine.
    // Rival gangs can destroy it by pooping on it (80 HP). 8-min rebuild cooldown.
    this.gangNests = new Map();       // gangId -> { gangId, gangTag, gangColor, ownerId, ownerName, x, y, hp, maxHp, auraLastAt, builtAt, destroyedAt, rebuildAvailableAt }
    this._loadGangNests();

    // === Missions ===
    this.missionBoard = [];           // array of 3 mission defs on the board
    this.activeMissions = new Map();  // birdId -> { missionId, def, progress, startedAt, participants: Set<birdId> }
    this.missionBoardTimer = Date.now() + 10000;
    this.missionBoardRefreshTimer = Date.now() + 10000;

    // === CHAOS METER ===
    this.chaosMeter = 0;
    this.chaosEvent = null;           // { type, endsAt, data }
    this.chaosEventNPCs = new Map();  // extra NPCs spawned by chaos events
    this.chaosEventFoods = new Map(); // golden rain / coin shower / food festival items

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

    // === MOST WANTED BOARD + CITY LOCKDOWN ===
    // Tracks the top-3 most wanted birds city-wide (visible to all players on a persistent HUD).
    // City Lockdown triggers when 3+ birds simultaneously hit Wanted Level 3+.
    // During lockdown: 1.5× crime coin rewards, extra cops, and 3 National Guard units deploy.
    this.wantedTopThree = [];    // [{ birdId, name, gangTag, heat, level }, ...] — top-3 sorted by heat
    this.cityLockdown = null;    // null | { startedAt, endsAt, triggerCount, ngSpawnDone }
    this.nationalGuard = new Map(); // id -> NG agent state (elite cop variant targeting top-3 criminals)
    this._ngIdCounter = 0;

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
    this.weatherBetting = null;       // null or { openUntil, bets: Map(birdId -> { type, amount, name }) }
    this.heatPuddles = new Map();     // id -> true (water puddle food ids spawned during heatwave)
    this.hotCocoa = new Map();        // id -> true (hot_cocoa food ids spawned during blizzard)
    this.iceRink = null;              // null | { x, y, radius } — random plaza becomes ice rink during blizzard
    this.gangRitualCooldowns = new Map(); // gangId -> lastRitualTimestamp (2-min cooldown per gang)

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
      { id: 'speed_serum',      name: 'Speed Serum',      desc: '+60% speed for 30s',                      cost: 50,  emoji: '💉' },
      { id: 'mega_poop',        name: 'Mega Poop',         desc: 'Next 3 poops are AOE blasts',             cost: 75,  emoji: '💣' },
      { id: 'disguise_kit',     name: 'Disguise Kit',      desc: 'Clears ALL heat instantly',               cost: 100, emoji: '🎭' },
      { id: 'smoke_bomb',       name: 'Smoke Bomb',        desc: 'Cops lose you for 15 seconds',            cost: 80,  emoji: '💨' },
      { id: 'lucky_charm',      name: 'Lucky Charm',       desc: '2x XP for 5 full minutes',               cost: 150, emoji: '🍀' },
      { id: 'contract_cancel',  name: 'Contract Cancel',   desc: 'Bounty Hunter stands down for 60s',       cost: 120, emoji: '🔫' },
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
      boostGateCooldowns: new Map(), // `${gateId}_${birdId}` -> expiresAt timestamp
    };
    this.pigeonRaceTimer = Date.now() + this._randomRange(300000, 480000); // 5-8 min to first race
    this.RACE_ENTRY_FEE = 25;
    this.RACE_MAX_RACERS = 8;
    this.RACE_OPEN_MS = 30000;      // 30s registration window
    this.RACE_COUNTDOWN_MS = 5000;  // 5s countdown
    this.RACE_MAX_DURATION = 180000; // 3 min max race time
    this.RACE_CHECKPOINTS = world.RACE_CHECKPOINTS;
    this.RACE_BOOST_GATES = world.RACE_BOOST_GATES;

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
    this.kingpin = null; // { birdId, birdName, coins, crownedAt, hitCount: Map(hitterId->count), lastPassiveReward, decreesAvailable }
    this.kingpinCheckTimer = 0;
    this.kingpinDecree = null; // { type, endsAt, kingpinId, kingpinName } — active city-wide decree

    // === ROYAL COURT ===
    // Top-3 richest birds who aren't the Kingpin earn noble titles: Duke, Baron, Count
    // Each earns +10 coins passive tribute every 30s. Titles visible on nametags.
    this.royalCourt = []; // [{ birdId, birdName, gangTag, gangColor, prestige, title, coins, lastTribute }]
    this.royalCourtCheckTimer = 0;

    // === DETHRONEMENT POOL (City Hall Bounty Board) ===
    // Any bird can contribute coins to this pool. When the Kingpin is dethroned,
    // the entire pool goes to the bird who lands the killing 3rd hit.
    // Pool persists across Kingpin changes — it keeps growing until paid out.
    this.dethronementPool = {
      total: 0,
      topDonor: null,    // { name, amount } — the biggest single contributor
      lastPaidTo: null,  // { name, amount } — last payout recipient (for history display)
    };
    this.CITY_HALL_POS = world.CITY_HALL_POS;
    this.HALL_OF_LEGENDS_POS = world.HALL_OF_LEGENDS_POS;
    this._cachedHallOfLegends = [];  // top prestige players for the Hall of Legends
    this._cachedIdolLeaderboard = []; // top all-time Idol champions

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

    // === BIOLUMINESCENT POND (night-only) ===
    // An Owl Enforcer patrols the Sacred Pond at night. Pooping near it alerts the owl.
    // Glowing pond fish spawn in the water — auto-collect for big coins + XP.
    this.owlEnforcer = null;          // null or owl state object
    this.pondFishIds = new Set();     // tracks which food IDs are pond fish
    this.pondFishRespawnTimer = 0;    // when to try spawning next fish

    // === MYSTERY CRATE AIRDROP ===
    // Every 12-16 minutes a glowing crate drops at a random city location.
    // First bird to reach it within 90 seconds claims a powerful random item.
    this.mysteryCrate = null;  // null or { id, x, y, spawnedAt, expiresAt }
    this.mysteryCrateTimer = Date.now() + this._randomRange(720000, 960000); // 12-16 min
    this.MYSTERY_CRATE_SPAWN_LOCATIONS = [
      { x: 1200, y: 1200 }, // Park center
      { x: 2200, y: 1100 }, // Mall entrance
      { x: 2000, y: 580  }, // Downtown plaza
      { x: 620,  y: 1550 }, // Cafe District
      { x: 520,  y: 720  }, // Residential
      { x: 2700, y: 1250 }, // Arena area
      { x: 1200, y: 580  }, // Radio Tower area
      { x: 1400, y: 2050 }, // South road
      { x: 2380, y: 1800 }, // East corridor
      { x: 380,  y: 1800 }, // West waterfront
      { x: 1620, y: 380  }, // North plaza
      { x: 1600, y: 1540 }, // Mid city junction
    ];
    this.MYSTERY_CRATE_ITEMS = [
      { id: 'nuke_poop',     emoji: '💣', name: 'NUKE POOP',     weight: 7,  desc: 'Next poop triggers a 200px blast radius — obliterates everything nearby' },
      { id: 'jet_wings',     emoji: '🚀', name: 'JET WINGS',     weight: 13, desc: '3.5× speed for 15 seconds — leave everyone behind' },
      { id: 'coin_cache',    emoji: '💸', name: 'COIN CACHE',    weight: 18, desc: 'Instant windfall of 250–450 coins' },
      { id: 'riot_shield',   emoji: '🛡️', name: 'RIOT SHIELD',  weight: 11, desc: 'Immune to cops, predators, and poop hits for 12 seconds' },
      { id: 'lightning_rod', emoji: '⚡', name: 'LIGHTNING ROD', weight: 8,  desc: 'Every poop you fire summons lightning at the target for 20s' },
      { id: 'coin_magnet',   emoji: '🧲', name: 'COIN MAGNET',   weight: 15, desc: 'Pull all coins and food from 350px for 10 seconds' },
      { id: 'ghost_mode',    emoji: '👻', name: 'GHOST MODE',    weight: 11, desc: 'Invisible to cops and other birds for 15 seconds' },
      { id: 'twister_bomb',  emoji: '🌪️', name: 'TWISTER BOMB', weight: 7,  desc: 'Instantly blasts every bird within 200px away by 300px' },
      { id: 'diamond_poop',  emoji: '💎', name: 'DIAMOND POOP',  weight: 7,  desc: 'Every poop hit earns triple coins for 20 seconds' },
      { id: 'broken_crate',  emoji: '📦', name: 'BROKEN CRATE',  weight: 3,  desc: 'Empty... but here\'s 75c consolation prize' },
    ];
    this.MYSTERY_CRATE_TOTAL_WEIGHT = this.MYSTERY_CRATE_ITEMS.reduce((s, i) => s + i.weight, 0);

    // === BIRD FLU OUTBREAK ===
    // Every 25-40 minutes, Patient Zero is infected and flu spreads between nearby birds.
    // Medicine items spawn across the city — collect one to cure yourself.
    this.fluOutbreak = false;           // is an outbreak currently active?
    this.fluOutbreakTimer = Date.now() + this._randomRange(25 * 60000, 40 * 60000);
    this.fluMedicineItems = new Map();  // id -> { id, x, y, active }
    this._fluMedicineCounter = 0;
    this.FLU_MEDICINE_POSITIONS = [
      { x: 1200, y: 800  },  // north park
      { x: 2300, y: 1100 },  // mall area
      { x: 700,  y: 1850 },  // cafe district
      { x: 1900, y: 2200 },  // downtown south
      { x: 580,  y: 620  },  // residential
      { x: 2500, y: 700  },  // mall north
      { x: 1400, y: 1900 },  // south road
    ];

    // === CROW CARTEL RAIDS ===
    // Every 20-35 minutes, the Crow Cartel spawns and assaults a player-owned territory.
    // 3-4 crow thugs + 1 Don Corvino move in and drain the capture progress.
    // Players must poop them out to defend their turf. If unchecked, zone flips to CARTEL.
    this.crowCartel = null;   // null or { crows: Map, targetZoneId, state, raidEndsAt, holdUntil, defenderRewards }
    this.crowCartelTimer = Date.now() + this._randomRange(20 * 60000, 35 * 60000);
    this._crowCartelIdCounter = 0;

    // === BIRD CITY IDOL ===
    // Every 35-50 minutes, a singing contest opens at the stage in the park.
    // Birds fly to the stage and press [I] to register as contestants (up to 4).
    // During the open phase, contestant poop hits are tracked as performance score.
    // Then spectators vote by pressing [I] from anywhere on the map.
    // Winner = most (votes × 3 + performance hits × 2) → 300c + 250 XP + 🎤 badge
    // + city-wide 1.5× XP boost for 3 minutes. Runners-up: 80c + 50 XP.
    // Correct voters: 60c + 30 XP.
    this.birdIdol = null;
    this.birdIdolTimer = Date.now() + this._randomRange(35 * 60000, 50 * 60000);
    this.idolXpBoostUntil = 0; // timestamp when city-wide idol XP boost expires
    this.IDOL_STAGE_POS = world.IDOL_STAGE_POS;

    // === PIGEON PIED PIPER ===
    // Every 25-35 minutes, a mysterious enchanting musician appears somewhere in the city.
    // His magical flute pulls birds toward him (suction force within 350px).
    // Birds who get within 80px get ENCHANTED — cannot poop for 8 seconds.
    // Players must poop the Piper 6 times to drive him away — rewarding all online birds.
    // If nobody stops him in 90 seconds, he steals 20% of each nearby bird's coins and vanishes.
    this.piper = null;
    this.piperTimer = Date.now() + this._randomRange(25 * 60000, 35 * 60000);
    this.PIPER_SPAWN_LOCATIONS = [
      { x: 1200, y: 1200 }, // Park center
      { x: 800,  y: 1350 }, // Park west edge
      { x: 1600, y: 580  }, // North road near radio tower
      { x: 2200, y: 1550 }, // Mall south
      { x: 700,  y: 1950 }, // Cafe District
      { x: 2480, y: 1350 }, // East corridor
      { x: 1380, y: 1850 }, // Central south road
      { x: 1050, y: 900  }, // Hall of Legends area
      { x: 400,  y: 1200 }, // West waterfront
      { x: 2700, y: 700  }, // Mall northeast
    ];

    // === CURSED COIN ===
    // A single legendary cursed coin spawns in the world every 8-14 minutes.
    // Auto-collected on proximity. While held: +2.5× all coin gains, +20% speed,
    // but -3 food every 20s. Visible on everyone's minimap as a pulsing skull.
    // Anyone can STEAL it by flying within 50px (5s per-bird steal cooldown).
    // After 4 minutes held, EXPLODES: holder loses 30% coins (max 300c),
    // those coins scatter to all birds within 400px. Holder earns +500 XP.
    this.cursedCoin = null; // null | { state:'world'|'held', x, y, holderId, holderName, heldSince, intensity, lastDrain, stealCooldowns: Map }
    this.cursedCoinTimer = Date.now() + this._randomRange(8 * 60000, 14 * 60000); // first spawn 8-14 min in

    // === CRIME WAVE EVENT ===
    // Every 40-60 minutes, a 2-minute city-wide crime wave erupts:
    // - Heat generation ×2 (every poop escalates wanted level faster)
    // - Cops get 25% faster + spawn sooner
    // - But ALL crime coin rewards ×2 (high risk, high reward)
    // - Cop stun XP ×2 (heroes get paid)
    // - Wanted survival XP ×2
    this.crimeWave = null;  // null | { startedAt, endsAt }
    this.crimeWaveTimer = Date.now() + this._randomRange(40 * 60000, 60 * 60000);

    // === AURORA BOREALIS ===
    // A rare, breathtaking night spectacle — colored light ribbons flow across the sky.
    // Triggers with 30% chance at the start of each night phase. Lasts 4–7 minutes.
    // While active: +25% XP on all poop hits, combo window extended 8s→12s,
    // and "Cosmic Fish" appear at the Sacred Pond with tripled rewards.
    this.aurora = null; // null | { startedAt, endsAt, intensity: 0–1 }
    this.auroraTriggeredThisNight = false; // prevent re-triggering same night
    // Shooting Star: rare event during aurora — a star streaks across the sky and lands at a
    // world position. First bird within 60px wins a Mystery Crate-tier item.
    this.shootingStar = null; // null | { x, y, spawnedAt, expiresAt, streakAngle }
    this.shootingStarTriggeredThisAurora = false;
    this.shootingStarScheduledAt = null;
    // Meteor Shower: rarer aurora event — 3 stars fall simultaneously across the map.
    // Each can be claimed independently. Triggers once per aurora, 15% chance.
    this.meteorShower = null; // null | { stars: Map(id -> { x, y, expiresAt, streakAngle, claimed }) }
    this.meteorShowerTriggeredThisAurora = false;

    // === NIGHT MARKET ===
    // A celestial bazaar that materializes near the Sacred Pond only when the Aurora Borealis
    // is active. Birds spend Cosmic Fish tokens (earned by catching cosmic fish) on rare items.
    // Press [N] to shop when within 110px of the stall.
    this.nightMarket = null; // null | { x, y }
    this.NIGHT_MARKET_POS = { x: 900, y: 1150 }; // west of the Sacred Pond in the park
    this.NIGHT_MARKET_CATALOG = [
      { id: 'stardust_cloak',     name: 'Stardust Cloak',     emoji: '🌌', cost: 1, desc: 'Shimmering aurora aura — visible to all birds for 8 min' },
      { id: 'comet_trail',        name: 'Comet Trail',         emoji: '☄️',  cost: 2, desc: 'Leave a golden sparkle trail for 6 min' },
      { id: 'oracle_eye',         name: 'Oracle Eye',          emoji: '🔮', cost: 2, desc: 'See all hidden items on the minimap for 4 min' },
      { id: 'star_power',         name: 'Star Power',          emoji: '🌟', cost: 3, desc: '+50% all XP and coins for 8 min' },
      { id: 'lunar_lens',         name: 'Lunar Lens',          emoji: '🌙', cost: 3, desc: 'Reveals ALL sewer loot caches on your minimap for 2 min' },
      { id: 'constellation_badge',name: 'Constellation Badge', emoji: '🌌', cost: 5, desc: 'Permanent 🌌 nametag badge — rarest cosmetic in the game' },
    ];

    // === BOUNTY HUNTER ===
    // Persistent manhunter NPC that spawns when any bird reaches Wanted Level 4+.
    // Unlike cops, he never gives up — follows across the whole map, ignores smoke bombs.
    // Takes 4 poop hits to stun (pros have armor). Catches nets 40% coin steal.
    this.bountyHunter = null; // null | { id, x, y, rotation, targetId, targetName, state, stunUntil, offDutyUntil, poopHits, poopHitResetAt, lastCatchAt, spawnedAt, wanderAngle, sewerWanderAngle, fogWanderAngle }

    // === POLICE HELICOPTER ===
    // Spawns when wanted bird holds Level 5 for 15+ seconds.
    // Unlike cops or the bounty hunter, the helicopter is AERIAL: it can't be evaded underground,
    // smoke bombs don't work (airborne surveillance), fog partially blinds it beyond 280px.
    // Helicopter illuminates the target — their minimap dot is visible to ALL players while
    // the spotlight is active. Takes 6 poop hits to bring down (mega=2). On crash: city-wide reward.
    this.policeHelicopter = null; // null | { id, x, y, rotation, targetId, targetName, state, poopHits, poopHitResetAt, lastCatchAt, stunUntil, hoverX, hoverY, lastKnownX, lastKnownY, spawnedAt }
    this.helicopterLevel5Timer = 0; // ms bird has been at level 5 continuously

    // === SEAGULL INVASION ===
    // Every 25-35 minutes, 8-10 fast seagulls swoop in from the coast to steal food en masse.
    // Each seagull swoops toward an active food item, steals it, then flies back to the edge.
    // Poop on them (2 hits each) to drive them away — drop stolen food back on hit!
    // If all seagulls are defeated before the 90s timer: bonus XP+coins for all online birds.
    // Gazette: tracks seagull invasions.
    this.seagullInvasion = null; // null | { seagulls: Map, startedAt, endsAt, repelBonusGiven }
    this.seagullTimer = Date.now() + this._randomRange(25 * 60000, 35 * 60000);
    this._seagullIdCounter = 0;

    // === DONUT COP ===
    // A perpetually snacking cop outside the Donut Shop (north road area).
    // Cycles between 'eating' (10-15s, distracted, bribeable/ambushable) and 'alert' (25-40s).
    // While eating: poop on him for 2× XP + coins (ambush), or press [D] to BRIBE (50c/star → drop 1 wanted star).
    // While alert: poop on him for normal cop XP/coins + short stun.
    // Stunned: visually dazed, immune to further hits until recovery.
    this.donutCop = {
      x: world.DONUT_SHOP_POS.x - 45,
      y: world.DONUT_SHOP_POS.y + 20,
      state: 'alert',           // 'eating' | 'alert' | 'stunned'
      stateEndsAt: Date.now() + 12000, // first transition to eating in 12s
      stunUntil: 0,
    };

    // === BIRD ROYALE ===
    // Every 35-50 minutes, a shrinking zone forces all birds toward the city center.
    // Safe zone shrinks from 1400px radius to 150px over 3 minutes.
    // Birds outside take -6 food/sec. Hit 0 food outside = eliminated (lose 15% coins).
    // Last bird alive inside the zone wins 500 XP + 400c. Timer: 2-min warning first.
    this.birdRoyale = null; // null | { state:'warning'|'active'|'ended', startAt, endsAt, centerX, centerY, startRadius, endRadius, participants: Map(birdId -> {name, alive, eliminatedAt}), pot, zoneDrainTimers: Map(birdId -> lastDrainAt) }
    this.birdRoyaleTimer = Date.now() + this._randomRange(35 * 60000, 50 * 60000);
    this._royaleIdCounter = 0;
    this.gangRoyaleBonus = null; // { gangId, gangTag, gangName, bonusUntil } — 5-min territory bonus for royale-winning gang

    // === STREET DUELS ===
    // Any bird can challenge a nearby rival to a 1v1 poop duel right in the street.
    // Press [Y] near another bird to send a challenge. Target has 15s to accept/decline.
    // 3 hearts each — poop the opponent 3 times to knock them out. Max 45 seconds.
    // Winner takes the pot (25% of each bird's coins, min 30c, max 250c per side).
    this.streetDuels = new Map();       // duelId -> { id, challengerId, challengerName, targetId, targetName, state, hp, pot, centerX, centerY, startedAt, expiresAt, bets, betWindowUntil, rematchCount }
    this.pendingChallenges = new Map(); // targetBirdId -> { challengerId, challengerName, expiresAt, pot }
    this.rematchPending = new Map();    // key(`${min_id}_${max_id}`) -> { bird1Id, bird1Name, bird2Id, bird2Name, bird1Accept, bird2Accept, expiresAt, rematchCount }
    this.STREET_DUEL_DURATION = 45000;
    this.STREET_DUEL_CHALLENGE_EXPIRY = 15000;
    this._duelIdCounter = 0;

    // === PIGEON FIGHTING CHAMPIONSHIP ===
    // Don Featherstone hosts a bracket tournament every 25-35 minutes.
    // Birds pay 100c entry, get paired into rounds of street duels, last bird standing wins.
    this.tournament = {
      state: 'idle',    // 'idle' | 'signup' | 'fighting' | 'done'
      nextAt: Date.now() + (25 + Math.random() * 10) * 60000,
      signupUntil: null,
      entrants: [],     // [{ birdId, name, gangTag }]
      pot: 0,
      round: 0,
      bracket: [],      // current round: [{ bird1Id, bird2Id, bird1Name, bird2Name, duelId, winner, bye }]
      survivors: [],    // birdIds still in
      champion: null,   // { birdId, name, gangTag }
      entryFee: 100,
    };
    this._tournamentDuelIds = new Set(); // IDs of duels that are part of the tournament

    // === BIRD CITY GAZETTE ===
    // Every game day cycle (~20 min), a newspaper publishes at dawn recapping the night.
    // Tracks key moments: top combo, most wanted, heists, gang wars, predator kills, etc.
    this.gazetteEdition = 1;
    this._resetGazetteStats();

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
      prestige: saved ? (saved.prestige || 0) : 0,
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
      formationType: null,  // 'V' | 'WEDGE' | null — detected each tick
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
      heatQuenchedUntil: 0, // timestamp: if > now, bird drank recently and won't drain food
      puddleBoostUntil: 0,  // timestamp when puddle speed boost wears off
      warmUntil: 0,         // timestamp: hot cocoa warmth (blizzard — negates cold drag + speed bonus)
      // === RACE POWER-UPS ===
      raceBoostUntil: 0,    // timestamp when race boost gate speed buff wears off
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
      // === EAGLE FEATHER — rare drop from killing Eagle Overlord ===
      eagleFeather: saved ? (saved.eagle_feather || false) : false,
      // === MYSTERY CRATE active item buffs ===
      mcJetWingsUntil:     0,
      mcRiotShieldUntil:   0,
      mcGhostModeUntil:    0,
      mcLightningRodUntil: 0,
      mcMagnetUntil:       0,
      mcDiamondPoopUntil:  0,
      mcNukePoop:          false,
      mcMagnetLastPull:    0,
      // === BIRD FLU ===
      fluUntil: 0,             // timestamp when flu wears off (0 = healthy)
      fluSpreadCooldown: 0,    // timestamp: can't re-spread to another bird until this passes
      // === PIGEON PIED PIPER ===
      piperEnchantedUntil: 0,  // timestamp when enchantment wears off (blocks poop)
      // === SKILL TREE — Feather Points + unlocked skills ===
      skillPoints: saved ? (saved.skill_points || 0) : 0,
      skillTreeUnlocked: saved ? this._safeJsonParse(saved.skill_tree, []) : [],
      lastKnownLevel: 0, // used to detect level-ups and award skill points each tick
      // === WITNESS PROTECTION ===
      witnessProtectionUntil: 0,       // timestamp when WP expires
      witnessProtectionCooldown: 0,    // timestamp when WP can be purchased again
      // === SKILL TREE MASTERY ===
      skillTreeMaster: saved ? (saved.skill_tree_master || false) : false,
      // === VENDING MACHINE POOP POWER-UPS ===
      vpPoopEffect: null,          // { type: 'spicy'|'freeze'|'rainbow'|'toxic'|'shock' } or null
      vpMachineCooldowns: {},      // machineId → timestamp (last use)
      // === PIGEON FIGHTING CHAMPIONSHIP ===
      fightingChampBadge: false,   // session-only: won the bracket tournament this session
      tournamentWins: saved ? (saved.tournament_wins || 0) : 0,  // lifetime championship wins (persistent)
      // === BIRD CITY IDOL HALL OF FAME ===
      idolWins: saved ? (saved.idol_wins || 0) : 0,   // lifetime idol wins (persistent)
      // === NIGHT MARKET (aurora bazaar) ===
      cosmicFish: saved ? (saved.cosmic_fish || 0) : 0,  // persistent currency earned from cosmic fish
      constellationBadge: saved ? (saved.constellation_badge || false) : false, // permanent cosmetic
      stardustCloakUntil: 0,   // timed: shimmering aurora aura around bird
      cometTrailUntil:    0,   // timed: golden sparkle trail
      oracleEyeUntil:     0,   // timed: see all hidden items on minimap
      lunarLensUntil:    0,   // timed: see all sewer loot caches on minimap
      starPowerUntil:     0,   // timed: +50% XP and coins
    };

    // Determine bird type from XP
    const level = world.getLevelFromXP(bird.xp);
    bird.type = world.getBirdTypeForLevel(level);
    bird.level = level;
    bird.lastKnownLevel = level; // baseline for skill point detection

    // Prestige P4+: spawn with 50 bonus food (survival edge)
    if (bird.prestige >= 4) {
      bird.food = Math.min(100, (bird.food || 0) + 50);
    }

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
      // Drop cursed coin if holding — it stays at the bird's last position
      if (this.cursedCoin && this.cursedCoin.state === 'held' && this.cursedCoin.holderId === id) {
        this.cursedCoin.state = 'world';
        this.cursedCoin.holderId = null;
        this.cursedCoin.holderName = null;
        this.cursedCoin.heldSince = null;
        this.cursedCoin.stealCooldowns = new Map();
        this.events.push({ type: 'cursed_coin_dropped', x: this.cursedCoin.x, y: this.cursedCoin.y, reason: 'disconnect' });
      }
      // Cancel any pending duel challenge involving this bird
      this.pendingChallenges.delete(id);
      for (const [targetId, ch] of this.pendingChallenges) {
        if (ch.challengerId === id) { this.pendingChallenges.delete(targetId); break; }
      }
      // Cancel any pending rematch involving this bird
      for (const [key, rm] of this.rematchPending) {
        if (rm.bird1Id === id || rm.bird2Id === id) { this.rematchPending.delete(key); break; }
      }
      // Cancel any active street duel involving this bird
      if (bird.streetDuelId) {
        const duel = this.streetDuels.get(bird.streetDuelId);
        if (duel && duel.state === 'active') {
          const opponentId = duel.challengerId === id ? duel.targetId : duel.challengerId;
          const opponent = this.birds.get(opponentId);
          if (opponent) {
            opponent.streetDuelId = null;
            // Refund opponent
            opponent.coins += duel.pot;
          }
          // Refund all bettors on disconnect cancel
          if (duel.bets && duel.bets.size > 0) {
            for (const [bid, bet] of duel.bets) {
              const b = this.birds.get(bid);
              if (b) b.coins += bet.amount;
            }
          }
          duel.state = 'cancelled';
          this.events.push({ type: 'street_duel_cancelled', reason: 'disconnect', birdId: id, opponentId });
          this.streetDuels.delete(bird.streetDuelId);
        }
        bird.streetDuelId = null;
      }
      // Clear bounty hunter if they were hunting the disconnecting bird
      if (this.bountyHunter && this.bountyHunter.targetId === id) {
        this.bountyHunter = null;
      }
      // Clear police helicopter if it was pursuing the disconnecting bird
      if (this.policeHelicopter && this.policeHelicopter.targetId === id) {
        this.policeHelicopter = null;
        this.helicopterLevel5Timer = 0;
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
    if (action.type === 'nest_build') {
      this._handleNestBuild(bird, now);
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

    // === Donut Cop Bribe ===
    if (action.type === 'donut_bribe') {
      this._handleDonutBribe(bird, now);
    }

    // === Vending Machine Poop Power-Up ===
    if (action.type === 'vend_buy') {
      this._handleVendingBuy(bird, action.machineIdx, now);
    }

    // === Black Market ===
    if (action.type === 'blackmarket_buy') {
      this._handleBlackMarketBuy(bird, action.itemId, now);
    }

    // === Night Market (aurora bazaar) ===
    if (action.type === 'night_market_buy') {
      this._handleNightMarketBuy(bird, action.itemId, now);
    }

    // === Pigeonhole Slots Casino ===
    if (action.type === 'slots_spin') {
      this._handleSlotsSpin(bird, now);
    }

    // === Dethronement Pool (City Hall Bounty Board) ===
    if (action.type === 'pool_contribute') {
      this._handlePoolContribute(bird, action.amount, now);
    }

    // === Royal Decree — Kingpin's city-shaping power ===
    if (action.type === 'royal_decree') {
      this._handleRoyalDecree(bird, action.decreeType, now);
    }
    if (action.type === 'buy_witness_protection') {
      this._handleWitnessProtection(bird, now);
    }

    // === Bird Royale Spectator Cheer ===
    if (action.type === 'royale_cheer') {
      this._handleRoyaleCheer(bird, action, now);
    }

    // === Bird Tattoo Parlor ===
    if (action.type === 'buy_tattoo') {
      this._handleBuyTattoo(bird, action.tattooId, now);
    }
    if (action.type === 'equip_tattoo') {
      this._handleEquipTattoo(bird, action.tattooId, now);
    }

    // === Prestige ===
    if (action.type === 'prestige') {
      this._handlePrestige(bird, now);
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

    // === Bird City Idol ===
    if (action.type === 'idol_enter') {
      this._handleIdolEnter(bird, now);
    }
    if (action.type === 'idol_vote') {
      this._handleIdolVote(bird, action, now);
    }

    // === Pigeon Racing ===
    if (action.type === 'race_join') {
      this._handleRaceJoin(bird, now);
    }
    if (action.type === 'race_bet') {
      this._handleRaceBet(bird, action, now);
    }
    if (action.type === 'weather_bet') {
      this._handleWeatherBet(bird, action, now);
    }

    // === Skill Tree ===
    if (action.type === 'skill_tree_unlock') {
      this._handleSkillTreeUnlock(bird, action.skillId, now);
    }
    if (action.type === 'don_respec') {
      this._handleDonRespec(bird, now);
    }

    // === Street Duels ===
    if (action.type === 'challenge_duel') {
      this._handleChallengeDuel(bird, action.targetId, now);
    }
    if (action.type === 'accept_duel') {
      this._handleAcceptDuel(bird, now);
    }
    if (action.type === 'decline_duel') {
      this._handleDeclineDuel(bird, now);
    }
    if (action.type === 'bet_on_duel') {
      this._handleDuelBet(bird, action, now);
    }
    if (action.type === 'accept_rematch') {
      this._handleDuelRematch(bird, now);
    }
    if (action.type === 'don_tournament_join') {
      this._handleTournamentJoin(bird, now);
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

    // === Gang Nests ===
    this._tickGangNests(now);

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
    this._updateBountyHunter(dt, now);
    this._updatePoliceHelicopter(dt, now);
    this._updateCityLockdown(dt, now);
    this._updateNationalGuard(dt, now);

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

    // === Bioluminescent Pond (Owl Enforcer) ===
    this._updateOwlEnforcer(dt, now);

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

    // === Aurora Borealis + Shooting Star + Meteor Shower ===
    this._updateAurora(dt, now);
    this._tickShootingStar(now);
    this._tickMeteorShower(now);

    // === Underground Sewer ===
    this._updateSewerRats(dt, now);
    this._updateSewerLoot(now);

    // === Golden Egg Scramble ===
    this._updateEggScramble(dt, now);

    // === Kingpin System ===
    this._updateKingpin(now);
    this._updateRoyalCourt(now);
    this._updateKingpinDecree(now);
    this._tickRevoltWindow(now);

    // === Mystery Crate Airdrop ===
    this._tickMysteryCrate(now);

    // === Bird Flu Outbreak ===
    this._tickFluOutbreak(now);

    // === Crow Cartel Raid ===
    this._updateCrowCartel(dt, now);

    // === Bird City Idol ===
    this._tickBirdIdol(now);

    // === Pigeon Pied Piper ===
    this._tickPiper(dt, now);

    // === Cursed Coin ===
    this._tickCursedCoin(dt, now);

    // === Crime Wave ===
    this._tickCrimeWave(now);

    // === Donut Cop ===
    this._updateDonutCop(now);

    // === Seagull Invasion ===
    this._updateSeagullInvasion(dt, now);

    // === Bird Royale ===
    this._tickBirdRoyale(dt, now);

    // === Street Duels ===
    this._tickStreetDuels(now);

    // === Pigeon Fighting Championship ===
    this._tickTournament(now);
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
        {
          let catStun = 3000;
          if (nearestBird.skillTreeUnlocked && nearestBird.skillTreeUnlocked.includes('iron_wings')) catStun = Math.floor(catStun * 0.65);
          nearestBird.stunnedUntil = now + catStun;
        }
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
    // === SKILL POINT DETECTION — detect level-ups and award Feather Points ===
    if (bird.level > (bird.lastKnownLevel || 0)) {
      const gained = bird.level - (bird.lastKnownLevel || 0);
      bird.skillPoints = (bird.skillPoints || 0) + gained;
      bird.lastKnownLevel = bird.level;
      this.events.push({ type: 'skill_point_gained', birdId: bird.id, birdName: bird.name, skillPoints: bird.skillPoints, gained });
    } else {
      bird.lastKnownLevel = bird.level;
    }

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

    // Heatwave: thirsty birds drag their wings (-15% speed when food < 15)
    if (this.weather && this.weather.type === 'heatwave' && bird.food < 15 && bird.heatQuenchedUntil <= now) {
      maxSpeed *= 0.85;
    }

    // Race boost gate: lightning speed burst
    if (bird.raceBoostUntil > now) {
      maxSpeed *= 1.7;
    }

    // Puddle boost: cooled and refreshed, +20% speed
    if (bird.puddleBoostUntil > now) {
      maxSpeed *= 1.2;
    }

    // Blizzard: cold drag slows all birds — unless warmed by hot cocoa OR huddled at gang nest firepit
    bird.nearNestFirepit = false;
    if (this.weather && this.weather.type === 'blizzard') {
      // Gang Nest Firepit: your gang's nest becomes a warm campfire during blizzard — gather round!
      if (bird.gangId && !bird.inSewer) {
        const myNest = this.gangNests.get(bird.gangId);
        if (myNest && myNest.destroyedAt === null) {
          const fpdx = bird.x - myNest.x;
          const fpdy = bird.y - myNest.y;
          if (Math.sqrt(fpdx * fpdx + fpdy * fpdy) < 100) {
            bird.nearNestFirepit = true;
          }
        }
      }
      if (bird.warmUntil > now || bird.nearNestFirepit) {
        maxSpeed *= 1.25; // cocoa warmth or firepit warmth: +25% — beat the chill
      } else {
        maxSpeed *= 0.88; // cold drag: -12% — dragging frozen wings
      }
    }

    // Ice Rink: a plaza freezes into a slippery rink during blizzard — +30% speed, almost no turning control
    bird.onIceRink = false;
    if (this.iceRink && !bird.inSewer) {
      const irdx = bird.x - this.iceRink.x;
      const irdy = bird.y - this.iceRink.y;
      if (Math.sqrt(irdx * irdx + irdy * irdy) < this.iceRink.radius) {
        bird.onIceRink = true;
        maxSpeed *= 1.30; // slippery ice — birds launch fast but can barely turn!
      }
    }

    // Cursed Coin: holder gets +20% speed (urgent cursed energy)
    if (this.cursedCoin && this.cursedCoin.state === 'held' && this.cursedCoin.holderId === bird.id) {
      maxSpeed *= 1.20;
    }

    // Mystery Crate: Jet Wings — blazing fast
    if (bird.mcJetWingsUntil > now) {
      maxSpeed *= 3.5;
    }

    // Mystery Crate: Coin Magnet — pull nearby food/coins every 0.5s
    if (bird.mcMagnetUntil > now && now - bird.mcMagnetLastPull > 500) {
      bird.mcMagnetLastPull = now;
      const MAGNET_RADIUS = 350;
      for (const [fId, food] of this.foods) {
        if (!food.active) continue;
        const fdx = food.x - bird.x;
        const fdy = food.y - bird.y;
        if (Math.sqrt(fdx * fdx + fdy * fdy) < MAGNET_RADIUS) {
          // Pull food item value as coins instead of food
          bird.coins += (food.value || 5);
          food.active = false;
          food.respawnAt = now + 15000;
        }
      }
    }

    // Prestige P3+: reduced poop cooldown (faster firing rate as permanent bonus)
    if (bird.prestige >= 3) {
      poopCooldown = Math.floor(poopCooldown * PRESTIGE_COOLDOWN_MULTS[Math.min(bird.prestige, 5)]);
    }

    // === SKILL TREE: Combat — Quick Draw (-15% cooldown) ===
    if (bird.skillTreeUnlocked && bird.skillTreeUnlocked.includes('quick_draw')) {
      poopCooldown = Math.floor(poopCooldown * 0.85);
    }

    // === SKILL TREE: Speed — Aerodynamics (+10% base speed) ===
    if (bird.skillTreeUnlocked && bird.skillTreeUnlocked.includes('aerodynamics')) {
      maxSpeed *= 1.10;
    }

    // === SKILL TREE: Speed — Desperado (+22% speed when food < 25) ===
    if (bird.skillTreeUnlocked && bird.skillTreeUnlocked.includes('desperado') && bird.food < 25) {
      maxSpeed *= 1.22;
    }

    // Egg carrying: precious cargo slows you down
    if (bird.carryingEggId) {
      maxSpeed *= 0.8;
    }

    // Bird Flu: sick birds drag their wings (-25% speed, combo capped at 1x)
    if (bird.fluUntil > now) {
      maxSpeed *= 0.75;
    }

    // === FORMATION FLYING ===
    // Detect V-Formation (trailing flock) and Wedge (flanking attack) each tick.
    // V-Formation: 2+ sync flock mates within 250px → +18% speed (slipstream / updraft)
    // Wedge Formation: sync mates flanking BOTH sides within 180px → +10% speed + wider poop radius + +30% poop XP
    bird.formationType = null;
    if (bird.flockId) {
      const birdSpeed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
      if (birdSpeed > 20) {
        const velNX = bird.vx / birdSpeed;
        const velNY = bird.vy / birdSpeed;
        const perpNX = -velNY;   // perpendicular unit vector (left side)
        const perpNY = velNX;

        let syncMates = 0;      // mates in sync within 250px
        let lateralLeft = 0;    // mates on the left flank
        let lateralRight = 0;   // mates on the right flank
        let matesAhead = 0;     // mates ahead of this bird

        for (const other of this.birds.values()) {
          if (other.id === bird.id || other.flockId !== bird.flockId) continue;
          const dx = other.x - bird.x;
          const dy = other.y - bird.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 250 * 250) continue;

          const otherSpeed = Math.sqrt(other.vx * other.vx + other.vy * other.vy);
          if (otherSpeed < 20) continue;

          // Must be flying in roughly the same direction (dot product > 0.55)
          const velDot = (bird.vx / birdSpeed) * (other.vx / otherSpeed) + (bird.vy / birdSpeed) * (other.vy / otherSpeed);
          if (velDot < 0.55) continue;

          syncMates++;

          // Inline component: positive = mate is ahead of me along my velocity
          const inlineComp = dx * velNX + dy * velNY;
          if (inlineComp > 35) matesAhead++;

          // Lateral component: positive = right of my path, negative = left
          if (distSq <= 180 * 180) {
            const lateralComp = dx * perpNX + dy * perpNY;
            if (lateralComp > 35) lateralRight++;
            else if (lateralComp < -35) lateralLeft++;
          }
        }

        if (syncMates >= 2) {
          // WEDGE: this bird is the point — mates flanking both sides
          if (lateralLeft >= 1 && lateralRight >= 1) {
            bird.formationType = 'WEDGE';
            maxSpeed *= 1.10; // 10% speed for the wedge point
          } else {
            // V-FORMATION: trailing flock or lead position
            bird.formationType = 'V';
            maxSpeed *= 1.18; // 18% slipstream speed for all V members
          }
        } else if (syncMates === 1 && matesAhead >= 1) {
          // Even with just one mate ahead, slipstream kicks in (2-bird V)
          bird.formationType = 'V';
          maxSpeed *= 1.10;
        }
      }
    }

    // Ice Rink: dramatically reduced turning control + high slide (nearly no drag)
    const accel = bird.onIceRink ? 220 : 800;    // barely any directional authority on ice
    const drag  = bird.onIceRink ? 0.978 : 0.92; // almost no speed decay — birds SLIDE

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
      const windMult = (bird.skillTreeUnlocked && bird.skillTreeUnlocked.includes('wind_rider')) ? 1.3 : 1.0;
      bird.vx += Math.cos(this.weather.windAngle) * this.weather.windSpeed * dt * windMult;
      bird.vy += Math.sin(this.weather.windAngle) * this.weather.windSpeed * dt * windMult;
    }

    // Pied Piper suction force — draws birds toward the Piper within 350px
    if (this.piper && !bird.inSewer) {
      const pdx = this.piper.x - bird.x;
      const pdy = this.piper.y - bird.y;
      const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
      const PIPER_SUCTION_RADIUS = 350;
      if (pDist < PIPER_SUCTION_RADIUS && pDist > 1) {
        // Suction scales quadratically — barely noticeable at edge, strong up close
        const t2 = 1 - (pDist / PIPER_SUCTION_RADIUS);
        const suctionForce = 28 * t2 * t2; // max ~28 px/s pull
        bird.vx += (pdx / pDist) * suctionForce * dt;
        bird.vy += (pdy / pDist) * suctionForce * dt;

        // Enchantment: birds within 80px get enchanted (can't poop for 8s)
        if (pDist < 80 && bird.piperEnchantedUntil <= now) {
          bird.piperEnchantedUntil = now + 8000;
          this.events.push({
            type: 'piper_enchanted',
            birdId: bird.id, birdName: bird.name,
            x: bird.x, y: bird.y,
          });
        }
      }
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
    if (!bird.carryingEggId && bird.piperEnchantedUntil <= now && bird.input.space && now - bird.lastPoop > poopCooldown) {
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
        isLegend: (bird.prestige || 0) >= 5,  // P5 LEGEND birds drop golden poop
      };

      // Check if mega poop (power-up OR black market mega poop OR nuke poop crate item OR poop party event)
      const isNukePoop = bird.mcNukePoop;
      const isPoopParty = !!(this.chaosEvent && this.chaosEvent.type === 'poop_party');
      const isMegaPoop = bird.megaPoopReady || bird.bmMegaPoops > 0 || isNukePoop || isPoopParty;
      if (bird.megaPoopReady) {
        bird.megaPoopReady = false;
        bird.powerUp = null; // Consumed
      } else if (bird.bmMegaPoops > 0) {
        bird.bmMegaPoops--;
      }
      if (isNukePoop) {
        bird.mcNukePoop = false;
        // Tag poop as nuke so client can render it as massive
        poop.isNuke = true;
      }

      // Wedge Formation: the point bird gets a wider splash radius on their poop
      const isWedgePoop = !isMegaPoop && bird.formationType === 'WEDGE';
      if (isWedgePoop) poop.isWedge = true;

      // Vending Machine effect — tag poop and consume the effect
      let vpEffect = null;
      if (!isMegaPoop && bird.vpPoopEffect) {
        vpEffect = bird.vpPoopEffect.type;
        poop.vpEffect = vpEffect;
        bird.vpPoopEffect = null; // consumed on fire
      }

      // Check what it hit
      const hit = this._checkPoopHit(poop, isMegaPoop, isWedgePoop, vpEffect);
      poop.hitTarget = hit.target;

      this.poops.set(poopId, poop);
      bird.totalPoops++;
      // Gazette: track poop counts per bird this cycle
      if (!this.gazetteStats.poopCounts[bird.id]) {
        this.gazetteStats.poopCounts[bird.id] = { count: 0, name: bird.name, gangTag: bird.gangTag || null };
      }
      this.gazetteStats.poopCounts[bird.id].count++;

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
        let copCoinReward = cop.type === 'swat' ? 25 : 15;
        // Crime Wave: double XP and coins for stunning cops — heroes get paid
        if (this.crimeWave) { xpGain *= 2; copCoinReward *= 2; }
        bird.coins += copCoinReward;
        this.events.push({ type: 'cop_pooped', birdId: bird.id, birdName: bird.name, copType: cop.type, x: cop.x, y: cop.y });
        // Gazette: track cop stuns
        if (!this.gazetteStats.copsStunned[bird.id]) {
          this.gazetteStats.copsStunned[bird.id] = { count: 0, name: bird.name, gangTag: bird.gangTag || null };
        }
        this.gazetteStats.copsStunned[bird.id].count++;
      } else if (hit.target === 'bounty_hunter' && this.bountyHunter) {
        // Poop hit the Bounty Hunter! Build up hits — 4 in a row stuns him
        const bh = this.bountyHunter;
        bh.poopHits = (bh.poopHits || 0) + (isMegaPoop ? 2 : 1); // mega poop counts as 2 hits
        bh.poopHitResetAt = now + 10000; // reset counter if no hits in 10s
        xpGain = 30;
        bird.coins += 10;
        this.events.push({ type: 'bounty_hunter_hit', birdId: bird.id, birdName: bird.name, hits: bh.poopHits, x: bh.x, y: bh.y });
        if (bh.poopHits >= 4) {
          // STUNNED! Bounty Hunter goes down for 10 seconds
          bh.state = 'stunned';
          bh.stunUntil = now + 10000;
          bh.poopHits = 0;
          bh.poopHitResetAt = 0;
          xpGain = 100;
          bird.coins += 50;
          this.events.push({ type: 'bounty_hunter_stunned', birdId: bird.id, birdName: bird.name, x: bh.x, y: bh.y });
        }
      } else if (hit.target === 'donut_cop' && this.donutCop && this.donutCop.state !== 'stunned') {
        // Poop hit the Donut Cop!
        const dc = this.donutCop;
        const wasEating = dc.state === 'eating';
        if (wasEating) {
          // AMBUSH! Double XP + coins while he's distracted with his donut
          xpGain = 80;
          bird.coins += 30;
          dc.state = 'stunned';
          dc.stunUntil = now + 15000; // longer stun — he's shocked
          this.events.push({ type: 'donut_cop_pooped', birdId: bird.id, birdName: bird.name, gangTag: bird.gangTag || null, wasEating: true, x: dc.x, y: dc.y });
        } else {
          // Alert poop — normal cop reward, shorter stun
          xpGain = 45;
          bird.coins += 15;
          dc.state = 'stunned';
          dc.stunUntil = now + 8000;
          this.events.push({ type: 'donut_cop_pooped', birdId: bird.id, birdName: bird.name, gangTag: bird.gangTag || null, wasEating: false, x: dc.x, y: dc.y });
        }
        // Track daily challenge: only counts the eating ambush
        if (wasEating) {
          this._trackDailyProgress(bird, 'donut_cop_hit', 1);
        }
      } else if (hit.target === 'helicopter' && this.policeHelicopter && this.policeHelicopter.state !== 'stunned') {
        // Poop hit the Police Helicopter! Build up 6 hits to bring it down
        const heli = this.policeHelicopter;
        heli.poopHits = (heli.poopHits || 0) + (isMegaPoop ? 2 : 1); // mega poop = 2 hits
        heli.poopHitResetAt = now + 12000; // reset counter if no hits in 12s
        xpGain = 35;
        bird.coins += 12;
        this.events.push({ type: 'helicopter_hit', birdId: bird.id, birdName: bird.name, hits: heli.poopHits, x: heli.x, y: heli.y });

        if (heli.poopHits >= 6) {
          // HELICOPTER DOWN! Spectacular crash — reward all online birds
          heli.state = 'stunned';
          heli.stunUntil = now + 15000; // 15 second down time before returning
          heli.poopHits = 0;
          heli.poopHitResetAt = 0;
          heli.spotlighting = false;
          xpGain = 350;
          bird.coins += 150;
          // City-wide reward: every online bird gets XP + coins
          for (const otherBird of this.birds.values()) {
            if (otherBird.id === bird.id) continue;
            otherBird.xp += 75;
            otherBird.coins += 25;
          }
          this.events.push({ type: 'helicopter_downed', birdId: bird.id, birdName: bird.name, gangTag: bird.gangTag || null, x: heli.x, y: heli.y });
          this._trackDailyProgress(bird, 'helicopter_down', 1);
          // Gazette: track helicopter downs
          if (!this.gazetteStats.helicopterDowns) this.gazetteStats.helicopterDowns = [];
          this.gazetteStats.helicopterDowns.push({ name: bird.name, gangTag: bird.gangTag || null });
        }
      } else if (hit.target === 'national_guard' && hit.ngId) {
        // Poop hit a National Guard agent! Need 5 hits to stun (they're tough)
        const ng = this.nationalGuard.get(hit.ngId);
        if (ng && ng.state !== 'stunned') {
          ng.poopHits = (ng.poopHits || 0) + (isMegaPoop ? 2 : 1);
          ng.poopHitResetAt = now + 10000;
          xpGain = 40;
          bird.coins += 15;
          this.events.push({ type: 'ng_hit', birdId: bird.id, birdName: bird.name, hits: ng.poopHits, ngId: ng.id, x: ng.x, y: ng.y });
          if (ng.poopHits >= 5) {
            // Stunned! National Guard goes down for 12 seconds
            ng.state = 'stunned';
            ng.stunUntil = now + 12000;
            ng.poopHits = 0;
            ng.poopHitResetAt = 0;
            xpGain = 150;
            bird.coins += 60;
            this.events.push({ type: 'ng_stunned', birdId: bird.id, birdName: bird.name, ngId: ng.id, x: ng.x, y: ng.y });
          }
        }
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
          // Gazette: record predator kill
          this.gazetteStats.predatorKills.push({ name: bird.name, gangTag: bird.gangTag || null, predType: predKey });
          // Clear all warnings and hit counts for this predator
          for (const warnings of this.predatorWarnings.values()) warnings[predKey] = null;
          for (const counts of this.predatorHitCounts.values()) counts[predKey] = 0;
        }
      } else if (hit.target === 'street_duel_opponent' && hit.duel && hit.opponent) {
        // Street Duel PvP hit — one hit = one heart lost
        const duel = hit.duel;
        const opponentId = hit.opponentId;
        duel.hp[opponentId]--;
        xpGain = 45;
        bird.coins += 12;
        this.events.push({
          type: 'street_duel_hit',
          attackerId: bird.id, attackerName: bird.name,
          targetId: opponentId, targetName: hit.opponent.name,
          hp: duel.hp[opponentId],
          x: poop.x, y: poop.y,
        });
        // Check for knockout
        if (duel.hp[opponentId] <= 0) {
          this._resolveStreetDuel(duel, bird.id, 'knockout', now);
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
      } else if (hit.target === 'owl_enforcer' && this.owlEnforcer) {
        // Poop hit the Owl Enforcer directly — scares it off temporarily
        xpGain = 50;
        bird.coins += 15;
        this.owlEnforcer.state = 'stunned';
        this.owlEnforcer.stunnedUntil = now + 8000; // stunned 8s
        this.owlEnforcer.alertBirdId = null;
        this.events.push({ type: 'owl_scared', birdId: bird.id, birdName: bird.name, x: this.owlEnforcer.x, y: this.owlEnforcer.y });
      } else if (hit.target === 'piper' && this.piper) {
        // Poop hit the Pied Piper — one step closer to driving him away!
        const dmg = isMegaPoop ? 2 : 1; // mega poop counts double
        this.piper.hitCount += dmg;
        xpGain = isMegaPoop ? 60 : 30;
        bird.coins += isMegaPoop ? 12 : 5;
        this._trackDailyProgress(bird, 'piper_hit', 1);
        this.events.push({
          type: 'piper_hit',
          birdId: bird.id, birdName: bird.name,
          hitCount: this.piper.hitCount,
          hitsRequired: this.piper.hitsRequired,
          x: this.piper.x, y: this.piper.y,
        });
        if (this.piper.hitCount >= this.piper.hitsRequired) {
          this._defeatPiper(bird, now);
        }
      } else if (hit.target === 'crow_cartel' && hit.crow && this.crowCartel) {
        // Poop hit a Crow Cartel member — deal damage!
        const crow = hit.crow;
        const isDon = crow.type === 'don';
        const dmg = isMegaPoop ? (isDon ? 50 : 45) : (isDon ? 18 : 20);
        crow.hp -= dmg;
        xpGain = isMegaPoop ? (isDon ? 80 : 55) : (isDon ? 35 : 25);
        bird.coins += isDon ? 8 : 4;
        // GANG WAR × CROW CARTEL: shared enemy bonus — if any gang war is active, 2× XP vs Cartel
        const gangWarActive = Array.from(this.gangs.values()).some(g => g.warWithGangId && now < g.warEndsAt);
        if (gangWarActive) {
          xpGain *= 2;
          bird.coins += isDon ? 4 : 2;
          // Announce the synergy: city-wide on first discovery, personal on subsequent hits
          const raidKey = `gw_cartel_${this.crowCartel.raidId || 'raid'}`;
          if (!this._gangWarCartelAnnounced) this._gangWarCartelAnnounced = new Set();
          if (!this._gangWarCartelAnnounced.has(raidKey)) {
            // First discovery: city-wide announcement
            this._gangWarCartelAnnounced.add(raidKey);
            this.events.push({
              type: 'gang_war_cartel_synergy',
              cityWide: true,
              birdName: bird.name, gangTag: bird.gangTag || null,
              zoneName: this.crowCartel.targetZoneName || 'the zone',
            });
          }
          // Also always tell the hitting bird personally (so they see the 2× XP note)
          const birdKey = `${raidKey}_${bird.id}`;
          if (!this._gangWarCartelAnnounced.has(birdKey)) {
            this._gangWarCartelAnnounced.add(birdKey);
            this.events.push({ type: 'gang_war_cartel_synergy', birdId: bird.id });
          }
        }

        this.events.push({
          type: 'cartel_crow_hit',
          birdId: bird.id, birdName: bird.name,
          crowId: crow.id, crowType: crow.type,
          x: crow.x, y: crow.y,
          hp: Math.max(0, Math.ceil(crow.hp)), maxHp: crow.maxHp, dmg,
        });

        if (crow.hp <= 0) {
          crow.state = 'dead';
          const killXp = isDon ? 180 : 60;
          const killCoins = isDon ? 100 : 30;
          bird.xp += killXp;
          bird.coins += killCoins;
          const newLevel = world.getLevelFromXP(bird.xp);
          if (newLevel !== bird.level) {
            bird.level = newLevel;
            bird.type = world.getBirdTypeForLevel(newLevel);
          }
          this.events.push({
            type: isDon ? 'cartel_don_killed' : 'cartel_thug_killed',
            birdId: bird.id, birdName: bird.name,
            gangTag: bird.gangTag || null,
            x: crow.x, y: crow.y,
            killXp, killCoins,
            zoneName: this.crowCartel.targetZoneName,
          });
        }
      } else if (hit.target === 'seagull' && hit.seagull && this.seagullInvasion) {
        // Poop hit a seagull! Two hits to knock one out.
        const sg = hit.seagull;
        const dmg = isMegaPoop ? 2 : 1; // mega = instant kill
        sg.hp -= dmg;
        xpGain = isMegaPoop ? 50 : 25;
        bird.coins += 8;

        // Drop any stolen food at seagull position
        if (sg.hp <= 0) {
          sg.state = 'dead';
          // If carrying food, drop it
          if (sg.carriedFoodType) {
            const droppedId = 'food_sgdrop_' + uid();
            this.foods.set(droppedId, {
              id: droppedId,
              x: sg.x + (Math.random() - 0.5) * 20,
              y: sg.y + (Math.random() - 0.5) * 20,
              type: sg.carriedFoodType,
              value: 15 + Math.floor(Math.random() * 10),
              respawnAt: null,
              active: true,
            });
            setTimeout(() => { this.foods.delete(droppedId); }, 25000);
          }
          const killXp = 60;
          const killCoins = 20;
          bird.xp += killXp;
          bird.coins += killCoins;
          const newLevel = world.getLevelFromXP(bird.xp);
          if (newLevel !== bird.level) { bird.level = newLevel; bird.type = world.getBirdTypeForLevel(newLevel); }
          this.events.push({ type: 'seagull_killed', birdId: bird.id, birdName: bird.name, gangTag: bird.gangTag || null, x: sg.x, y: sg.y, killXp, killCoins });
          // Check if all seagulls are defeated
          this._checkSeagullInvasionVictory(now);
        } else {
          // First hit — seagull drops food if carrying and flees
          if (sg.carriedFoodType) {
            const droppedId = 'food_sgdrop_' + uid();
            this.foods.set(droppedId, {
              id: droppedId,
              x: sg.x + (Math.random() - 0.5) * 20,
              y: sg.y + (Math.random() - 0.5) * 20,
              type: sg.carriedFoodType,
              value: 15 + Math.floor(Math.random() * 10),
              respawnAt: null,
              active: true,
            });
            setTimeout(() => { this.foods.delete(droppedId); }, 25000);
            sg.carriedFoodType = null;
            sg.targetFoodId = null;
          }
          // After first hit seagull becomes frantic — finds new target
          this.events.push({ type: 'seagull_hit', birdId: bird.id, x: sg.x, y: sg.y });
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
      {
        let heatAmt = hit.target === 'npc' || hit.target === 'event_npc' ? 3 : hit.target === 'car' || hit.target === 'moving_car' ? 2 : 1;
        if (bird.skillTreeUnlocked && bird.skillTreeUnlocked.includes('street_smart')) {
          heatAmt = Math.max(0, Math.floor(heatAmt * 0.80));
        }
        // Crime Wave: heat generation ×2 — every crime escalates faster
        if (this.crimeWave) heatAmt *= 2;
        // Blizzard × Crime Wave: snowball poops generate EXTRA heat — the cold makes crime sting
        if (this.crimeWave && this.weather && this.weather.type === 'blizzard') heatAmt *= 2;
        // Poop Party × Crime Wave: AOE carnage during crime wave = 3× heat total (dangerous combo!)
        if (this.crimeWave && this.chaosEvent && this.chaosEvent.type === 'poop_party') heatAmt = Math.floor(heatAmt * 1.5); // ×2 from crime wave × 1.5 more = ×3 total
        this._addHeat(bird.id, heatAmt);
      }
      this._addAreaChaos(poop.x, poop.y, 1);
      if (hit.npc && hit.npc.poopedOn >= 3) {
        this._addChaos(5); // cry bonus
      }

      // Wanted bird XP bonus
      if (this.wantedBirdId === bird.id) {
        xpGain = Math.floor(xpGain * 1.5);
      }

      // Disco Fever / Crime Disco: NPC hits give 3× XP (5× during Crime Disco + 3× coins)
      const isDiscoFever = !!(this.chaosEvent && this.chaosEvent.type === 'disco_fever');
      const isCrimeDisco = isDiscoFever && !!this.crimeWave;
      if (isDiscoFever && (hit.target === 'npc' || hit.target === 'event_npc' || hit.target === 'chaos_npc') && xpGain > 0) {
        xpGain = Math.floor(xpGain * (isCrimeDisco ? 5 : 3));
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

      // Wedge Formation bonus: +30% XP and coins on every actual hit while in wedge attack
      if (isWedgePoop && xpGain > 2) {
        xpGain = Math.floor(xpGain * 1.30);
        coinGain = Math.max(1, Math.floor((coinGain || 1) * 1.30));
      }

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

      // Prestige P2+: coin bonus on poop hits
      if (bird.prestige >= 2 && coinGain > 0) {
        coinGain = Math.floor(coinGain * PRESTIGE_COIN_MULTS[Math.min(bird.prestige, 5)]);
      }
      // Skill Tree: Sticky Claws — +18% coins from every poop hit
      if (bird.skillTreeUnlocked && bird.skillTreeUnlocked.includes('sticky_claws') && coinGain > 0) {
        coinGain = Math.max(1, Math.floor(coinGain * 1.18));
      }
      // Cursed Coin: 2.5× all coin gains while holding it
      if (this.cursedCoin && this.cursedCoin.state === 'held' && this.cursedCoin.holderId === bird.id && coinGain > 0) {
        coinGain = Math.floor(coinGain * 2.5);
      }
      // Crime Wave: ×2 all crime coin rewards — high risk, high reward
      if (this.crimeWave && coinGain > 0) coinGain *= 2;
      // City Lockdown: ×1.5 crime coin rewards — city in chaos, crime pays
      if (this.cityLockdown && coinGain > 0) coinGain = Math.floor(coinGain * 1.5);
      // Royal Decree — Gold Rush: ×2 ALL coin drops city-wide for 60s
      if (this.kingpinDecree && this.kingpinDecree.type === 'gold_rush' && coinGain > 0) coinGain *= 2;
      // Vending Machine: Rainbow effect — 3× coins on this poop hit
      if (vpEffect === 'rainbow' && coinGain > 0) {
        coinGain = Math.floor(coinGain * 3);
        this.events.push({ type: 'vend_rainbow_hit', birdId: bird.id, coins: coinGain, x: poop.x, y: poop.y });
      }
      bird.coins += coinGain;

      // === COMBO STREAK — chain hits within 8s for escalating XP ===
      if (hit.target && hit.target !== 'none') {
        const comboActive = now < bird.comboExpiresAt;
        bird.comboCount = comboActive ? bird.comboCount + 1 : 1;
        // Aurora extends combo to 12s; blizzard to 11s (snowball chaos = more time to chain hits)
        const comboWindow = this.aurora ? 12000 : (this.weather && this.weather.type === 'blizzard' ? 11000 : 8000);
        bird.comboExpiresAt = now + comboWindow;
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
          this.events.push({ type: 'combo_milestone', birdId: bird.id, birdName: bird.name, combo, auroraActive: !!this.aurora });
        }
        // Gazette tracking: record top combo this cycle
        if (combo > this.gazetteStats.topCombo.count) {
          this.gazetteStats.topCombo = { count: combo, name: bird.name, gangTag: bird.gangTag || null };
        }
      }

      // Crime Disco: ×3 coins on NPC hits (crime wave + disco fever combined)
      if (isCrimeDisco && coinGain > 0 && (hit.target === 'npc' || hit.target === 'event_npc')) {
        coinGain *= 3;
      }

      // Black Market: Lucky Charm doubles all XP
      if (bird.bmDoubleXpUntil > now) xpGain *= 2;
      // Night Market: Star Power gives +50% XP and coins
      if (bird.starPowerUntil > now) {
        xpGain = Math.floor(xpGain * 1.5);
        coinGain = Math.floor((coinGain || 0) * 1.5);
      }
      // Radio Tower: Signal Boost gives 1.5x XP to ALL birds
      if (this.radioTower.signalBoostUntil > now) xpGain = Math.floor(xpGain * 1.5);
      // Bird City Idol: winner's boost gives 1.5x XP to ALL birds for 3 minutes
      if (this.idolXpBoostUntil > now) xpGain = Math.floor(xpGain * 1.5);
      // Aurora Borealis: sacred sky event gives +25% XP to ALL birds
      if (this.aurora) xpGain = Math.floor(xpGain * 1.25);
      // Idol: track performance hits for contestants during open phase
      if (this.birdIdol && this.birdIdol.state === 'open' && this.birdIdol.contestants.has(poop.birdId) && hit.target !== 'miss') {
        this.birdIdol.contestants.get(poop.birdId).performanceHits++;
      }
      // Prestige P1+: XP bonus on all poop hits
      if (bird.prestige >= 1) {
        xpGain = Math.floor(xpGain * PRESTIGE_XP_MULTS[Math.min(bird.prestige, 5)]);
      }
      // Skill Tree Mastery: permanent +5% XP bonus for unlocking all 12 skills
      if (bird.skillTreeMaster) xpGain = Math.floor(xpGain * 1.05);
      bird.xp += xpGain;

      // Skill Tree: Double Tap — 20% chance to fire a bonus poop on any hit
      if (bird.skillTreeUnlocked && bird.skillTreeUnlocked.includes('double_tap') && hit.target !== 'miss' && Math.random() < 0.20) {
        const bonusPoopId = uid();
        const bonusPoop = {
          id: bonusPoopId, birdId: bird.id,
          x: poop.x + (Math.random() - 0.5) * 30, y: poop.y + (Math.random() - 0.5) * 30,
          hitTarget: null, time: now, isNew: true, isLegend: poop.isLegend || false,
        };
        this.poops.set(bonusPoopId, bonusPoop);
        this.events.push({ type: 'poop', birdId: bird.id, id: bonusPoopId, x: bonusPoop.x, y: bonusPoop.y, isLegend: bonusPoop.isLegend });
      }

      // Mystery Crate: Diamond Poop — triple coins per hit instead of normal XP flow
      if (bird.mcDiamondPoopUntil > now && hit.target !== 'miss') {
        const bonusCoins = Math.floor(xpGain * 0.4) * 3;  // triple-ish coin bonus
        bird.coins += bonusCoins;
        this.events.push({ type: 'mc_diamond_poop', birdId: bird.id, x: poop.x, y: poop.y, coins: bonusCoins });
      }

      // Mystery Crate: Lightning Rod — summon lightning at hit target
      if (bird.mcLightningRodUntil > now && hit.target !== 'miss') {
        this.events.push({ type: 'lightning', x: poop.x, y: poop.y });
        // Stun birds within 90px of the strike (not the caster)
        for (const otherBird of this.birds.values()) {
          if (otherBird.id === bird.id) continue;
          const ldx = poop.x - otherBird.x;
          const ldy = poop.y - otherBird.y;
          if (Math.sqrt(ldx * ldx + ldy * ldy) < 90) {
            otherBird.stunnedUntil = now + 1800;
            otherBird.comboCount = 0;
            otherBird.comboExpiresAt = 0;
            this.events.push({ type: 'lightning_hit', birdId: otherBird.id, x: otherBird.x, y: otherBird.y });
          }
        }
      }

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
      // Ice Skater daily challenge: land 5 poop hits while on the ice rink
      if (bird.onIceRink) {
        this._trackDailyProgress(bird, 'ice_rink_hit', 1);
      }
      // Disco King daily challenge: hit 8 NPCs during Disco Fever
      if (isDiscoFever && (hit.target === 'npc' || hit.target === 'event_npc')) {
        this._trackDailyProgress(bird, 'disco_fever_hit', 1);
      }
      // Chaos Connoisseur daily: track unique chaos event types seen this session
      if (this.chaosEvent && !bird._chaosTypesSeen) bird._chaosTypesSeen = new Set();
      if (this.chaosEvent && bird._chaosTypesSeen && !bird._chaosTypesSeen.has(this.chaosEvent.type)) {
        bird._chaosTypesSeen.add(this.chaosEvent.type);
        this._trackDailyProgress(bird, 'chaos_types_seen', 1);
      }
      // Blizzard daily challenge: Blizzard Brawler (10 hits during blizzard)
      if (this.weather && this.weather.type === 'blizzard') {
        this._trackDailyProgress(bird, 'blizzard_hit', 1);
        // Snow Bird: cocoa drank + 5 blizzard hits
        if (!bird._blizzardHitsThisCocoa) bird._blizzardHitsThisCocoa = 0;
        if (bird._blizzardCocoaDrank > 0) {
          bird._blizzardHitsThisCocoa = (bird._blizzardHitsThisCocoa || 0) + 1;
          if (bird._blizzardHitsThisCocoa >= 5) {
            this._trackDailyProgress(bird, 'snow_bird_complete', 1);
            bird._blizzardHitsThisCocoa = 0; // reset so they can't double-count
            bird._blizzardCocoaDrank = 0;
          }
        }
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

      // Gang Nest Raid: check if poop landed near a rival gang's nest
      if (bird.gangId) {
        for (const [nestGangId, nest] of this.gangNests) {
          if (nestGangId === bird.gangId) continue; // can't damage own nest
          if (nest.destroyedAt !== null) continue;  // already destroyed
          const ndx = poop.x - nest.x;
          const ndy = poop.y - nest.y;
          if (Math.sqrt(ndx * ndx + ndy * ndy) < 35) {
            this._handleNestPoopHit(bird, nest, isMegaPoop, now);
            break;
          }
        }
      }

      // Owl Enforcer: poop noise within 150px alerts the owl even if it didn't hit
      if (this.owlEnforcer && hit.target !== 'owl_enforcer' &&
          (this.owlEnforcer.state === 'patrol' || this.owlEnforcer.state === 'returning')) {
        const odx = poop.x - this.owlEnforcer.x;
        const ody = poop.y - this.owlEnforcer.y;
        if (Math.sqrt(odx * odx + ody * ody) < 150) {
          this.owlEnforcer.state = 'chasing';
          this.owlEnforcer.alertBirdId = bird.id;
          this.owlEnforcer.chaseTimer = 8.0;
          this.events.push({ type: 'owl_alert', birdId: bird.id, birdName: bird.name, x: this.owlEnforcer.x, y: this.owlEnforcer.y });
        }
      }

      // === VENDING MACHINE SPECIAL EFFECTS (applied after main hit processing) ===
      if (vpEffect && hit.target && hit.target !== 'miss') {
        // FREEZE: slow any hit target to 40% speed for 4s
        if (vpEffect === 'freeze') {
          // Apply hailSlowUntil to hit player birds
          for (const otherBird of this.birds.values()) {
            if (otherBird.id === bird.id) continue;
            const fdx = poop.x - otherBird.x;
            const fdy = poop.y - otherBird.y;
            if (Math.sqrt(fdx * fdx + fdy * fdy) < 30) {
              otherBird.hailSlowUntil = Math.max(otherBird.hailSlowUntil, now + 4000);
              otherBird.comboCount = 0;
              otherBird.comboExpiresAt = 0;
              this.events.push({ type: 'vend_freeze_hit', birdId: otherBird.id, shooterId: bird.id, x: poop.x, y: poop.y });
              break;
            }
          }
          // Also slow hit cops
          for (const cop of this.copBirds.values()) {
            const fdx = poop.x - cop.x;
            const fdy = poop.y - cop.y;
            if (Math.sqrt(fdx * fdx + fdy * fdy) < 30) {
              cop.state = 'stunned';
              cop.stunnedUntil = Math.max(cop.stunnedUntil, now + 4000); // cops get frozen too
              break;
            }
          }
        }
        // SHOCK: stun any nearby player bird or cop for 3.5s (like lightning)
        if (vpEffect === 'shock') {
          let stunApplied = false;
          for (const otherBird of this.birds.values()) {
            if (otherBird.id === bird.id) continue;
            const sdx = poop.x - otherBird.x;
            const sdy = poop.y - otherBird.y;
            if (Math.sqrt(sdx * sdx + sdy * sdy) < 30) {
              otherBird.stunnedUntil = Math.max(otherBird.stunnedUntil, now + 3500);
              otherBird.comboCount = 0;
              otherBird.comboExpiresAt = 0;
              this.events.push({ type: 'vend_shock_hit', birdId: otherBird.id, shooterId: bird.id, x: poop.x, y: poop.y });
              stunApplied = true;
              break;
            }
          }
          if (!stunApplied) {
            // Also shock NPCs visually
            this.events.push({ type: 'lightning', x: poop.x, y: poop.y });
          }
        }
        // TOXIC: chain hit to 1 extra nearest NPC within 80px
        if (vpEffect === 'toxic') {
          let bestDist = 80;
          let chainTarget = null;
          for (const npc of this.npcs.values()) {
            const tdx = poop.x - npc.x;
            const tdy = poop.y - npc.y;
            const td = Math.sqrt(tdx * tdx + tdy * tdy);
            if (td < bestDist) {
              bestDist = td;
              chainTarget = npc;
            }
          }
          if (chainTarget) {
            chainTarget.poopedOn++;
            chainTarget.state = 'fleeing';
            chainTarget.stateTimer = 3;
            const ca = Math.random() * Math.PI * 2;
            chainTarget.targetX = chainTarget.x + Math.cos(ca) * 200;
            chainTarget.targetY = chainTarget.y + Math.sin(ca) * 200;
            chainTarget.speed = 80;
            bird.xp += 10;
            bird.coins += 3;
            this.events.push({ type: 'vend_toxic_chain', birdId: bird.id, x: chainTarget.x, y: chainTarget.y });
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

    // === Hot cocoa auto-collect (blizzard-only) — warms and boosts the bird ===
    if (this.weather && this.weather.type === 'blizzard' && this.hotCocoa.size > 0) {
      for (const cocoaId of this.hotCocoa.keys()) {
        const cocoa = this.foods.get(cocoaId);
        if (!cocoa || !cocoa.active) continue;
        const cdx = bird.x - cocoa.x;
        const cdy = bird.y - cocoa.y;
        if (Math.sqrt(cdx * cdx + cdy * cdy) < 45) {
          cocoa.active = false;
          this.hotCocoa.delete(cocoaId);
          bird.food = Math.min(100, bird.food + 20);
          bird.coins += 8;
          bird.xp += 15;
          bird.warmUntil = now + 30000; // warm for 30s — negates cold drag + speed bonus
          // Track Snow Bird daily: need to also land 5 blizzard hits — mark drank
          if (!bird._blizzardCocoaDrank) bird._blizzardCocoaDrank = 0;
          bird._blizzardCocoaDrank++;
          this._trackDailyProgress(bird, 'cocoa_drink', 1);
          this.events.push({
            type: 'cocoa_drink',
            birdId: bird.id, name: bird.name,
            x: cocoa.x, y: cocoa.y,
          });
          // Re-queue cocoa respawn quickly
          if (this.weather && this.weather.cocoaSpawnTimer > now + 15000) {
            this.weather.cocoaSpawnTimer = now + 8000;
          }
          break; // one cocoa per tick
        }
      }
    }

    // === Water puddle auto-collect (heatwave-only, fly near any puddle) ===
    if (this.weather && this.weather.type === 'heatwave' && this.heatPuddles.size > 0) {
      for (const puddleId of this.heatPuddles.keys()) {
        const puddle = this.foods.get(puddleId);
        if (!puddle || !puddle.active) continue;
        const pdx = bird.x - puddle.x;
        const pdy = bird.y - puddle.y;
        if (Math.sqrt(pdx * pdx + pdy * pdy) < 45) {
          puddle.active = false;
          this.heatPuddles.delete(puddleId);
          bird.food += 35;
          bird.xp += 20;
          bird.heatQuenchedUntil = now + 20000; // quenched for 20s — no thirst drain
          bird.puddleBoostUntil = now + 15000;  // +20% speed for 15s — cooled and refreshed!
          this._trackDailyProgress(bird, 'puddle_drink', 1);
          this.events.push({
            type: 'puddle_drink',
            birdId: bird.id, name: bird.name,
            x: puddle.x, y: puddle.y,
          });
          // Schedule puddle respawn via heatwave loop (remove after brief delay)
          const pId = puddleId;
          setTimeout(() => { this.foods.delete(pId); }, 5000);
          // Re-queue a new puddle soon so the city doesn't run dry
          if (this.weather && this.weather.heatPuddleTimer > now + 12000) {
            this.weather.heatPuddleTimer = now + 8000;
          }
          break; // one puddle per tick
        }
      }
    }

    // === Pond fish auto-collect (night-only, fly near the sacred pond) ===
    if (!bird.inSewer && this.pondFishIds.size > 0) {
      for (const fishId of this.pondFishIds) {
        const fish = this.foods.get(fishId);
        if (!fish || !fish.active) continue;
        const fdx = bird.x - fish.x;
        const fdy = bird.y - fish.y;
        if (Math.sqrt(fdx * fdx + fdy * fdy) < 40) {
          fish.active = false;
          this.pondFishIds.delete(fishId);
          const isCosmic = fish.type === 'cosmic_fish';
          // Cosmic fish (aurora only) give triple rewards + 1 Cosmic Fish token
          const coinBonus = isCosmic ? 120 : 40;
          const xpBonus  = isCosmic ? 240 : 80;
          const foodBonus = isCosmic ? 75 : 25;
          bird.coins += coinBonus;
          bird.xp += xpBonus;
          bird.food += foodBonus;
          if (isCosmic) {
            bird.cosmicFish = (bird.cosmicFish || 0) + 1;
            this._saveBird(bird); // persist the cosmic fish token immediately
          }
          this._trackDailyProgress(bird, 'coins_earned', coinBonus);
          const evType = isCosmic ? 'cosmic_fish_caught' : 'pond_fish_caught';
          this.events.push({ type: evType, birdId: bird.id, name: bird.name, coins: coinBonus, xp: xpBonus, x: fish.x, y: fish.y, isCosmic, cosmicFishTotal: isCosmic ? (bird.cosmicFish || 0) : 0 });
          const fId = fishId;
          setTimeout(() => { this.foods.delete(fId); }, 10000);
          // Check level up from XP
          const newLvl = world.getLevelFromXP(bird.xp);
          if (newLvl !== bird.level) {
            bird.level = newLvl;
            bird.type = world.getBirdTypeForLevel(newLvl);
            this.events.push({ type: 'evolve', birdId: bird.id, name: bird.name, birdType: bird.type });
          }
          break; // one fish per tick
        }
      }
    }
  }

  _checkPoopHit(poop, isMegaPoop, isWedgePoop = false, vpEffect = null) {
    let hitRadius = isMegaPoop ? 60 : (isWedgePoop ? 33 : 20); // Wedge: +65% wider splash
    // Vending Machine: Spicy effect — wide splash radius (between normal and mega)
    if (!isMegaPoop && vpEffect === 'spicy') hitRadius = 38;
    // Skill Tree: Splash Zone — +20% hit radius for the shooter
    const shooter = this.birds.get(poop.birdId);
    if (shooter && shooter.skillTreeUnlocked && shooter.skillTreeUnlocked.includes('splash_zone') && !isMegaPoop) {
      hitRadius = Math.round(hitRadius * 1.20);
    }
    // Blizzard: snowball poop! All poop gets wider splash (×2.2 for normal, ×1.5 for mega)
    if (this.weather && this.weather.type === 'blizzard') {
      hitRadius = Math.round(hitRadius * (isMegaPoop ? 1.5 : 2.2));
      // Snowball Fight Club: birds dueling during a blizzard get extra-wide snowball poop!
      // The snow makes every shot an exploding snowball — insane area-of-effect
      if (shooter && shooter.streetDuelId) {
        hitRadius = Math.round(hitRadius * 1.18); // ~50px for normal poop in a blizzard duel
      }
    }
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

    // Check Owl Enforcer (direct hit scares it away temporarily)
    if (this.owlEnforcer && this.owlEnforcer.state !== 'stunned') {
      const odx = poop.x - this.owlEnforcer.x;
      const ody = poop.y - this.owlEnforcer.y;
      if (Math.sqrt(odx * odx + ody * ody) < hitRadius + 14) {
        if (!isMegaPoop) return { target: 'owl_enforcer' };
        allHits.push({ target: 'owl_enforcer' });
      }
    }

    // Check Pigeon Pied Piper (can be pooped to drive away)
    if (this.piper) {
      const pdx = poop.x - this.piper.x;
      const pdy = poop.y - this.piper.y;
      if (Math.sqrt(pdx * pdx + pdy * pdy) < hitRadius + 20) {
        if (!isMegaPoop) return { target: 'piper' };
        allHits.push({ target: 'piper' });
      }
    }

    // Check Crow Cartel members
    if (this.crowCartel) {
      for (const crow of this.crowCartel.crows.values()) {
        if (crow.state === 'dead' || crow.state === 'fleeing') continue;
        if (crow.stunUntil > Date.now()) continue;
        const cdx = poop.x - crow.x;
        const cdy = poop.y - crow.y;
        const hitDist = hitRadius + (crow.type === 'don' ? 16 : 10);
        if (Math.sqrt(cdx * cdx + cdy * cdy) < hitDist) {
          if (!isMegaPoop) return { target: 'crow_cartel', crow };
          allHits.push({ target: 'crow_cartel', crow });
        }
      }
    }

    // Check Seagull Invasion members
    if (this.seagullInvasion) {
      for (const sg of this.seagullInvasion.seagulls.values()) {
        if (sg.state === 'fleeing' || sg.state === 'dead') continue;
        const sdx = poop.x - sg.x;
        const sdy = poop.y - sg.y;
        if (Math.sqrt(sdx * sdx + sdy * sdy) < hitRadius + 10) {
          if (!isMegaPoop) return { target: 'seagull', seagull: sg };
          allHits.push({ target: 'seagull', seagull: sg });
        }
      }
    }

    // Check Donut Cop (hit while eating = ambush bonus; while alert = normal cop reward; stunned = immune)
    if (this.donutCop && this.donutCop.state !== 'stunned') {
      const dcdx = poop.x - this.donutCop.x;
      const dcdy = poop.y - this.donutCop.y;
      if (Math.sqrt(dcdx * dcdx + dcdy * dcdy) < hitRadius + 12) {
        if (!isMegaPoop) return { target: 'donut_cop' };
        allHits.push({ target: 'donut_cop' });
      }
    }

    // Check Police Helicopter (large body — generous hit box so sky fights feel good)
    if (this.policeHelicopter && this.policeHelicopter.state !== 'stunned') {
      const hdx = poop.x - this.policeHelicopter.x;
      const hdy = poop.y - this.policeHelicopter.y;
      if (Math.sqrt(hdx * hdx + hdy * hdy) < hitRadius + 22) {
        // Can't be hit by the bird it's targeting while it's spotlighting (too bright to aim) — adds skill requirement
        // Actually allow it — targeting yourself with good aim should count
        if (!isMegaPoop) return { target: 'helicopter' };
        allHits.push({ target: 'helicopter' });
      }
    }

    if (isMegaPoop && allHits.length > 0) {
      return { target: allHits[0].target, npc: allHits[0].npc, allHits };
    }

    // Check street duel opponents — highest-priority PvP (can hit even without arena)
    if (!isMegaPoop && shooter && shooter.streetDuelId) {
      const duel = this.streetDuels.get(shooter.streetDuelId);
      if (duel && duel.state === 'active') {
        const opponentId = duel.challengerId === poop.birdId ? duel.targetId : duel.challengerId;
        const opponent = this.birds.get(opponentId);
        if (opponent) {
          const dx = poop.x - opponent.x;
          const dy = poop.y - opponent.y;
          if (Math.sqrt(dx * dx + dy * dy) < hitRadius + 14) {
            return { target: 'street_duel_opponent', duel, opponentId, opponent };
          }
        }
      }
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

    // Check Bounty Hunter (4 hits to stun — tough target)
    if (this.bountyHunter && this.bountyHunter.state === 'pursuing') {
      const bh = this.bountyHunter;
      const bdx = poop.x - bh.x;
      const bdy = poop.y - bh.y;
      if (Math.sqrt(bdx * bdx + bdy * bdy) < hitRadius + 10) {
        return { target: 'bounty_hunter' };
      }
    }

    // Check National Guard agents (5 hits to stun — elite tough target)
    for (const [ngId, ng] of this.nationalGuard) {
      if (ng.state === 'stunned') continue;
      const ngdx = poop.x - ng.x;
      const ngdy = poop.y - ng.y;
      if (Math.sqrt(ngdx * ngdx + ngdy * ngdy) < hitRadius + 10) {
        return { target: 'national_guard', ngId };
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
      const wasHeatwave = this.weather.type === 'heatwave';
      const oldType = this.weather.type;
      // Tornado ended — reset cursed coin flung flag so next tornado can interact again
      if (oldType === 'tornado' && this.cursedCoin) {
        this.cursedCoin._tornadoFlung = false;
      }
      this.weather = null;
      // Remove rain worms
      if (wasRainy) {
        for (const wormId of this.rainWorms.keys()) {
          this.foods.delete(wormId);
        }
        this.rainWorms.clear();
      }
      // Remove heat puddles
      if (wasHeatwave) {
        for (const puddleId of this.heatPuddles.keys()) {
          this.foods.delete(puddleId);
        }
        this.heatPuddles.clear();
        this.events.push({ type: 'heatwave_end' });
      }
      // Remove hot cocoa items (blizzard-only food)
      if (oldType === 'blizzard') {
        for (const cocoaId of this.hotCocoa.keys()) {
          this.foods.delete(cocoaId);
        }
        this.hotCocoa.clear();
        // Clear warmth from all birds (blizzard is over)
        for (const b of this.birds.values()) b.warmUntil = 0;
        // Melt the ice rink
        if (this.iceRink) {
          this.iceRink = null;
          for (const b of this.birds.values()) b.onIceRink = false;
          this.events.push({ type: 'ice_rink_melted' });
        }
      }
      this.events.push({ type: 'weather_end', weatherType: oldType });
      // Open a 30-second betting window before the next weather spawns
      const betGap = this._randomRange(90000, 180000); // 1.5–3 min gap
      const BET_WINDOW = 30000; // 30 seconds to place bets
      this.weatherTimer = now + betGap;
      // Only open betting if there's enough time (gap > 40s)
      if (betGap > 40000 && this.birds.size > 0) {
        this.weatherBetting = { openUntil: now + BET_WINDOW, bets: new Map() };
        this.events.push({ type: 'weather_bet_window', openUntil: this.weatherBetting.openUntil });
      }
      return;
    }

    // Expire betting window if nobody is around
    if (this.weatherBetting && now >= this.weatherBetting.openUntil) {
      this.weatherBetting = null;
      this.events.push({ type: 'weather_bet_expired' });
    }

    // Spawn new weather when timer fires
    if (!this.weather && now >= this.weatherTimer) {
      // Rain most common; heatwave/fog/hailstorm are rarer surprises; tornado and blizzard are rarest
      const roll = Math.random();
      let type;
      if (roll < 0.22) type = 'rain';
      else if (roll < 0.42) type = 'wind';
      else if (roll < 0.53) type = 'storm';
      else if (roll < 0.63) type = 'fog';
      else if (roll < 0.74) type = 'hailstorm';
      else if (roll < 0.85) type = 'heatwave';
      else if (roll < 0.92) type = 'tornado';
      else type = 'blizzard';  // 8% — winter blast: snowball poops, hot cocoa warmth, cops shiver

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
      } else if (type === 'hailstorm') {
        duration = this._randomRange(60000, 120000); // 1–2 min (intense but brief)
        windSpeed = 40 + Math.random() * 60; // moderate wind + hail
        intensity = 0.8 + Math.random() * 0.2;
      } else if (type === 'heatwave') {
        duration = this._randomRange(150000, 240000); // 2.5–4 min of scorching heat
        windSpeed = 0;
        intensity = 0.7 + Math.random() * 0.3; // 0.7–1.0 heat intensity
      } else if (type === 'blizzard') {
        duration = this._randomRange(150000, 240000); // 2.5–4 min of freezing cold
        windSpeed = 30 + Math.random() * 50; // moderate wind — snow drifts sideways
        intensity = 0.7 + Math.random() * 0.3; // 0.7–1.0
      } else { // tornado
        duration = 95000; // ~95 seconds — traverses the full map
        windSpeed = 0;
        intensity = 1.0;
      }

      // Tornado: compute entry point and direction (enters from a random map edge)
      let tornadoX = 0, tornadoY = 0, tornadoVx = 0, tornadoVy = 0;
      if (type === 'tornado') {
        const TORNADO_SPEED = 38; // px/s
        const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        if (edge === 0) {       // from top, move south
          tornadoX = 400 + Math.random() * (world.WORLD_WIDTH - 800);
          tornadoY = -180;
          tornadoVx = (Math.random() - 0.5) * TORNADO_SPEED * 0.25;
          tornadoVy = TORNADO_SPEED;
        } else if (edge === 1) { // from right, move west
          tornadoX = world.WORLD_WIDTH + 180;
          tornadoY = 400 + Math.random() * (world.WORLD_HEIGHT - 800);
          tornadoVx = -TORNADO_SPEED;
          tornadoVy = (Math.random() - 0.5) * TORNADO_SPEED * 0.25;
        } else if (edge === 2) { // from bottom, move north
          tornadoX = 400 + Math.random() * (world.WORLD_WIDTH - 800);
          tornadoY = world.WORLD_HEIGHT + 180;
          tornadoVx = (Math.random() - 0.5) * TORNADO_SPEED * 0.25;
          tornadoVy = -TORNADO_SPEED;
        } else {                // from left, move east
          tornadoX = -180;
          tornadoY = 400 + Math.random() * (world.WORLD_HEIGHT - 800);
          tornadoVx = TORNADO_SPEED;
          tornadoVy = (Math.random() - 0.5) * TORNADO_SPEED * 0.25;
        }
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
        heatPuddleTimer: now + 8000,   // for heatwave: when to spawn next puddle batch
        heatThirstTimer: now + 8000,   // for heatwave: when to next drain bird thirst
        cocoaSpawnTimer: now + 12000,  // for blizzard: when to spawn next hot cocoa batch
        blizzardHitTimer: now + 3000,  // for blizzard: daily challenge tracking reset timer
        // Tornado position + velocity
        tornadoX, tornadoY, tornadoVx, tornadoVy,
        tornadoCooldowns: {}, // birdId -> timestamp when they can be flung again
      };

      this.events.push({ type: 'weather_start', weatherType: type, windAngle, windSpeed, intensity });
      console.log(`[GameEngine] Weather started: ${type} (wind=${Math.round(windSpeed)}, angle=${windAngle.toFixed(2)})`);
      // Gazette tracking for blizzards + spawn ice rink
      if (type === 'blizzard') {
        if (!this.gazetteStats.blizzards) this.gazetteStats.blizzards = 0;
        this.gazetteStats.blizzards++;
        // Pick a random open plaza to freeze into an ice rink
        const RINK_POSITIONS = [
          { x: 1200, y: 1200 }, // Park center plaza
          { x: 1780, y: 1050 }, // City Hall courtyard
          { x: 2100, y: 1200 }, // Casino plaza
          { x: 600,  y: 1600 }, // Cafe District square
          { x: 1620, y: 750  }, // North market area
          { x: 920,  y: 1600 }, // Midtown plaza
        ];
        const rinkPos = RINK_POSITIONS[Math.floor(Math.random() * RINK_POSITIONS.length)];
        this.iceRink = { x: rinkPos.x, y: rinkPos.y, radius: 85 };
        this.events.push({
          type: 'ice_rink_spawned',
          x: this.iceRink.x, y: this.iceRink.y, radius: this.iceRink.radius,
        });
        console.log(`[GameEngine] ⛸️ Ice rink formed at (${rinkPos.x}, ${rinkPos.y}) during blizzard`);
      }

      // Resolve any outstanding weather bets
      if (this.weatherBetting) {
        this._resolveWeatherBets(type);
        this.weatherBetting = null;
      }

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
          const lightStun = (b.skillTreeUnlocked && b.skillTreeUnlocked.includes('iron_wings')) ? Math.floor(1800 * 0.65) : 1800;
          b.stunnedUntil = now + lightStun;
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

      // National Guard friendly fire — lightning stuns NG agents!
      // Even elite law enforcement can't outrun an act of God
      for (const [ngId, ng] of this.nationalGuard) {
        if (ng.state === 'stunned') continue; // already down
        const ngDx = ng.x - lx;
        const ngDy = ng.y - ly;
        if (Math.sqrt(ngDx * ngDx + ngDy * ngDy) < 80) {
          ng.state = 'stunned';
          ng.stunUntil = now + 4000; // 4-second stun
          this.events.push({
            type: 'ng_lightning_stun',
            ngId,
            x: ng.x,
            y: ng.y,
            targetName: ng.targetName || '???',
          });
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

    // Heatwave: spawn water puddles + drain bird thirst + spoil food
    if (this.weather.type === 'heatwave') {
      // Spawn puddles periodically up to 6 max
      if (now >= this.weather.heatPuddleTimer && this.heatPuddles.size < 6) {
        this._spawnHeatPuddle();
        this.weather.heatPuddleTimer = now + this._randomRange(10000, 20000);
        if (this.heatPuddles.size === 1) {
          this.events.push({ type: 'heat_puddles_appeared' });
        }
      }
      // Thirst drain: every 8 seconds all birds lose 1 food (unless quenched)
      if (now >= this.weather.heatThirstTimer) {
        this.weather.heatThirstTimer = now + 8000;
        for (const b of this.birds.values()) {
          if (b.heatQuenchedUntil > now) continue; // recently drank — skip
          if (b.food > 0) {
            b.food = Math.max(0, b.food - 1);
            this.events.push({ type: 'heat_thirst_tick', birdId: b.id });
          }
        }
      }
      // Food spoilage: scorching heat spoils ~10% of food every 35-55s
      if (!this.weather.foodSpoilTimer) this.weather.foodSpoilTimer = now + this._randomRange(35000, 55000);
      if (now >= this.weather.foodSpoilTimer) {
        const activeFoods = Array.from(this.foods.values()).filter(f => f.active && f.type !== 'water_puddle' && f.type !== 'pond_fish' && f.type !== 'worm');
        const spoilCount = Math.min(5, Math.floor(activeFoods.length * 0.10));
        const spoiled = [];
        for (let i = 0; i < spoilCount && activeFoods.length > 0; i++) {
          const idx = Math.floor(Math.random() * activeFoods.length);
          const food = activeFoods.splice(idx, 1)[0];
          food.active = false;
          food.respawnAt = now + this._randomRange(25000, 45000);
          spoiled.push({ x: food.x, y: food.y });
        }
        if (spoiled.length > 0) {
          this.events.push({ type: 'food_spoiled', count: spoiled.length });
        }
        this.weather.foodSpoilTimer = now + this._randomRange(35000, 55000);
      }
    }

    // === BLIZZARD: spawn hot cocoa warmth items, cops freeze, snowball poop ===
    if (this.weather.type === 'blizzard') {
      const HOT_COCOA_POSITIONS = [
        { x: 640, y: 1010 }, { x: 1250, y: 670 }, { x: 1780, y: 1200 }, { x: 2200, y: 880 },
        { x: 600, y: 1800 }, { x: 1600, y: 2100 }, { x: 2450, y: 1800 }, { x: 900, y: 2400 },
        { x: 1450, y: 1540 }, { x: 2700, y: 600 },
      ];
      // Spawn hot cocoa periodically up to 4 max
      if (now >= this.weather.cocoaSpawnTimer && this.hotCocoa.size < 4) {
        // Pick a random position not already occupied
        const available = HOT_COCOA_POSITIONS.filter(pos => {
          for (const cId of this.hotCocoa.keys()) {
            const c = this.foods.get(cId);
            if (c) {
              const dx = c.x - pos.x; const dy = c.y - pos.y;
              if (Math.sqrt(dx*dx+dy*dy) < 150) return false;
            }
          }
          return true;
        });
        if (available.length > 0) {
          const pos = available[Math.floor(Math.random() * available.length)];
          const cId = `cocoa_${now}_${Math.random().toFixed(4)}`;
          const cocoaItem = { id: cId, x: pos.x, y: pos.y, type: 'hot_cocoa', active: true, value: 20, respawnAt: 0 };
          this.foods.set(cId, cocoaItem);
          this.hotCocoa.set(cId, true);
          if (this.hotCocoa.size === 1) {
            this.events.push({ type: 'cocoa_appeared' });
          }
        }
        this.weather.cocoaSpawnTimer = now + this._randomRange(20000, 40000);
      }
      // Gazette tracking
      if (!this.gazetteStats.blizzards) this.gazetteStats.blizzards = 0;
    }

    // === TORNADO: move across map + suck/fling birds ===
    if (this.weather.type === 'tornado') {
      const w = this.weather;
      // Move tornado at constant velocity
      w.tornadoX += w.tornadoVx * dt;
      w.tornadoY += w.tornadoVy * dt;
      const tx = w.tornadoX;
      const ty = w.tornadoY;

      // End tornado early if it has fully exited the map
      if (tx < -500 || tx > world.WORLD_WIDTH + 500 || ty < -500 || ty > world.WORLD_HEIGHT + 500) {
        w.endsAt = now; // triggers expiry next tick
        return;
      }

      // Interact with birds
      const PULL_RADIUS = 260;  // outer ring — gradual pull toward vortex
      const FLING_RADIUS = 95;  // inner ring — get flung across the map!

      for (const b of this.birds.values()) {
        if (b.inSewer) continue; // underground birds are safe
        const dx = tx - b.x;
        const dy = ty - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > PULL_RADIUS) continue;

        const nx = dx / dist; // unit vector toward tornado center
        const ny = dy / dist;

        if (dist < FLING_RADIUS) {
          // Check fling cooldown
          const cooldownUntil = w.tornadoCooldowns[b.id] || 0;
          if (now < cooldownUntil) continue;

          // FLING — throw bird in a wild random direction
          const flingAngle = Math.random() * Math.PI * 2;
          const flingDist = 380 + Math.random() * 240; // 380–620px
          const newX = Math.max(60, Math.min(world.WORLD_WIDTH - 60, b.x + Math.cos(flingAngle) * flingDist));
          const newY = Math.max(60, Math.min(world.WORLD_HEIGHT - 60, b.y + Math.sin(flingAngle) * flingDist));

          // Clear velocity so the bird doesn't immediately fly back toward tornado
          b.vx = Math.cos(flingAngle) * 80;
          b.vy = Math.sin(flingAngle) * 80;
          b.x = newX;
          b.y = newY;
          b.stunnedUntil = now + 2000; // 2-second daze
          b.food = Math.max(0, b.food - 12);
          b.comboCount = 0;
          b.comboExpiresAt = 0;
          w.tornadoCooldowns[b.id] = now + 9000; // 9s before tornado can fling them again

          this.events.push({
            type: 'tornado_fling',
            birdId: b.id,
            birdName: b.name,
            x: newX,
            y: newY,
          });
        } else {
          // SUCTION — additive pull force toward vortex center (stronger when closer)
          const pullStrength = 55 * (1 - dist / PULL_RADIUS) * (1 - dist / PULL_RADIUS);
          b.vx += nx * pullStrength * dt;
          b.vy += ny * pullStrength * dt;
        }
      }

      // Tornado × Cursed Coin: if the tornado passes within 300px of the world-mode Cursed Coin,
      // it flings the coin to a completely new map location — chaos! (once per tornado pass)
      if (this.cursedCoin && this.cursedCoin.state === 'world' && !this.cursedCoin._tornadoFlung) {
        const ccDx = tx - this.cursedCoin.x;
        const ccDy = ty - this.cursedCoin.y;
        if (Math.sqrt(ccDx * ccDx + ccDy * ccDy) < 300) {
          const flingAngle = Math.random() * Math.PI * 2;
          const flingDist = 400 + Math.random() * 200; // 400–600px
          this.cursedCoin.x = Math.max(150, Math.min(world.WORLD_WIDTH - 150, this.cursedCoin.x + Math.cos(flingAngle) * flingDist));
          this.cursedCoin.y = Math.max(150, Math.min(world.WORLD_HEIGHT - 150, this.cursedCoin.y + Math.sin(flingAngle) * flingDist));
          this.cursedCoin._tornadoFlung = true; // prevent re-flinging same tornado pass
          this.events.push({
            type: 'cursed_coin_tornado_flung',
            x: this.cursedCoin.x,
            y: this.cursedCoin.y,
            message: '🌪️💀 TORNADO FLUNG THE CURSED COIN! It\'s somewhere else now...',
          });
        }
      }
    }
  }

  _spawnHeatPuddle() {
    // Puddle spawn zones — spread across the city near buildings and roads
    const puddleZones = [
      { x: 1050, y: 1000 }, // Park south entrance
      { x: 1900, y: 1180 }, // Downtown center
      { x: 2350, y: 900  }, // Mall corridor
      { x: 480,  y: 1720 }, // Cafe District
      { x: 380,  y: 580  }, // Residential north
      { x: 1380, y: 2480 }, // South Docks
      { x: 870,  y: 1580 }, // Midtown West
      { x: 1720, y: 380  }, // North Quarter
      { x: 2150, y: 1850 }, // East side
      { x: 640,  y: 2200 }, // Southwest corner
    ];
    // Find a zone that doesn't already have a puddle nearby
    const occupied = [];
    for (const pid of this.heatPuddles.keys()) {
      const f = this.foods.get(pid);
      if (f) occupied.push({ x: f.x, y: f.y });
    }
    const available = puddleZones.filter(z => {
      return !occupied.some(o => Math.abs(o.x - z.x) < 200 && Math.abs(o.y - z.y) < 200);
    });
    if (available.length === 0) return;
    const pos = available[Math.floor(Math.random() * available.length)];
    // Add small random offset so puddles don't always appear at the exact same pixel
    const px = pos.x + (Math.random() - 0.5) * 80;
    const py = pos.y + (Math.random() - 0.5) * 80;
    const id = 'food_puddle_' + uid();
    this.foods.set(id, {
      id,
      type: 'water_puddle',
      x: px, y: py,
      value: 35,     // hydrating!
      active: true,
      respawnAt: 0,  // puddles don't auto-respawn — controlled by weather loop
    });
    this.heatPuddles.set(id, true);
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

    // Blizzard × Drunk Pigeon: they slip on ice — direction changes are much more erratic
    const blizzardIcy = this.weather && this.weather.type === 'blizzard';

    for (const [dpId, dp] of this.drunkPigeons) {
      // Wobbly wandering: change direction frequently with big random swings
      dp.wanderTimer -= dt;
      if (dp.wanderTimer <= 0) {
        // Big random direction change — ±100° normally, ±180° on ice (blizzard makes them slip)
        const swing = blizzardIcy ? (Math.PI * 180 / 180) * 3 : (Math.PI * 100 / 180) * 3.5;
        dp.wanderAngle += (Math.random() - 0.5) * swing;
        dp.wanderTimer = this._randomRange(blizzardIcy ? 0.4 : 0.8, blizzardIcy ? 1.2 : 2.5);
      }

      // Move in wanderAngle direction, with a sine-wave stagger side-to-side
      // Blizzard: wider sway as they slip on icy ground
      const staggerAmt = blizzardIcy ? 45 : 25;
      const staggerOffset = Math.sin(now * 0.003 + dp.wobblePhase) * staggerAmt * dt;
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

    // Crime Wave synergy: if a crime wave is active, the explosion is SUPERCHARGED.
    // Coins are doubled and nearby cops are stunned by the blast — the ultimate chaos moment.
    const crimeWaveBonus = !!this.crimeWave;
    // Blizzard synergy: lightning + drunk pigeon on ice = ×3 coin scatter (coins fly EVERYWHERE)
    const blizzardBonus = !!(this.weather && this.weather.type === 'blizzard');
    const coinMult = crimeWaveBonus ? 2 : (blizzardBonus ? 3 : 1);

    // Every bird within 250px gets a windfall share of the coins
    const winners = [];
    for (const bird of this.birds.values()) {
      const dx = bird.x - dp.x;
      const dy = bird.y - dp.y;
      if (Math.sqrt(dx * dx + dy * dy) < 250) {
        const baseShare = Math.floor(dp.coins / 2) + Math.floor(Math.random() * 15);
        const share = baseShare * coinMult;
        bird.coins += share;
        bird.xp += 30;
        winners.push({ id: bird.id, name: bird.name, share });
      }
    }

    // Crime Wave: the shockwave stuns all cops within 120px — lightning + drunk pigeon + crime = CHAOS
    if (crimeWaveBonus) {
      let copsStunned = 0;
      for (const cop of this.copBirds.values()) {
        const dx = cop.x - dp.x;
        const dy = cop.y - dp.y;
        if (Math.sqrt(dx * dx + dy * dy) < 120) {
          cop.state = 'stunned';
          cop.stunnedUntil = Math.max(cop.stunnedUntil || 0, now + 3000);
          copsStunned++;
        }
      }
      if (copsStunned > 0) {
        this.events.push({ type: 'crime_wave_pigeon_blast_cops', count: copsStunned, x: dp.x, y: dp.y });
      }
    }

    this.events.push({
      type: 'drunk_pigeon_coin_shower',
      x: dp.x, y: dp.y,
      totalCoins: dp.coins * coinMult,
      winners,
      crimeWaveBonus,
      blizzardBonus,
    });
    console.log(`[GameEngine] ⚡🍺 Drunk pigeon ZAPPED — coin shower! ${dp.coins * coinMult}c scattered${crimeWaveBonus ? ' (CRIME WAVE ×2!)' : ''}${blizzardBonus ? ' (BLIZZARD ×3!)' : ''}`);
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

      // --- Gang Royale Bonus: 1.5× capture power for winning gang for 5 min ---
      // Clean up expired bonus
      if (this.gangRoyaleBonus && now > this.gangRoyaleBonus.bonusUntil) {
        this.gangRoyaleBonus = null;
      }
      const gangCaptureMult = (this.gangRoyaleBonus && now < this.gangRoyaleBonus.bonusUntil && dominantTeamId === this.gangRoyaleBonus.gangId) ? 1.5 : 1.0;
      const effectivePower = dominantPower * gangCaptureMult;

      // --- Update capture state ---
      if (zone.ownerTeamId === null) {
        // NEUTRAL: first dominant team starts capturing
        if (dominantTeamId !== null) {
          zone.capturingTeamId = dominantTeamId;
          zone.capturingName = dominantName;
          zone.captureProgress = Math.min(1, zone.captureProgress + CAPTURE_RATE * effectivePower * dt);
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
          zone.captureProgress = Math.min(1, zone.captureProgress + CAPTURE_RATE * 0.3 * effectivePower * dt);
        } else {
          // CONTESTED — rival team eroding the owner's hold
          zone.captureProgress = Math.max(0, zone.captureProgress - CAPTURE_RATE * effectivePower * dt);

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
              const taxMult = (bird.skillTreeUnlocked && bird.skillTreeUnlocked.includes('territory_tax')) ? 1.5 : 1.0;
              bird.xp += Math.floor(REWARD_XP * taxMult);
              bird.coins += Math.floor(REWARD_COINS * taxMult);
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
  // BIOLUMINESCENT POND — OWL ENFORCER + GLOWING FISH
  // ============================================================
  _spawnOwlEnforcer() {
    this.owlEnforcer = {
      x: 1160, y: 1100,          // start at right side of pond
      rotation: 0,
      hp: 40, maxHp: 40,
      state: 'patrol',           // 'patrol' | 'chasing' | 'returning' | 'stunned'
      patrolIndex: 0,
      alertBirdId: null,
      chaseTimer: 0,
      stunnedUntil: 0,
    };
  }

  _spawnPondFish() {
    // 5 possible spawn positions inside the pond ellipse (cx:1050, cy:1100)
    const FISH_POSITIONS = [
      { x: 1000, y: 1075 },
      { x: 1100, y: 1125 },
      { x: 1050, y: 1090 },
      { x: 975,  y: 1110 },
      { x: 1125, y: 1085 },
    ];
    for (const pos of FISH_POSITIONS) {
      // Skip if there's already an active fish very close
      let occupied = false;
      for (const fishId of this.pondFishIds) {
        const f = this.foods.get(fishId);
        if (!f || !f.active) continue;
        if (Math.abs(f.x - pos.x) < 30 && Math.abs(f.y - pos.y) < 30) { occupied = true; break; }
      }
      if (!occupied) {
        const id = 'food_pond_fish_' + uid();
        this.foods.set(id, { id, x: pos.x, y: pos.y, type: 'pond_fish', value: 30, active: true, respawnAt: null });
        this.pondFishIds.add(id);
        return; // one at a time
      }
    }
  }

  _updateOwlEnforcer(dt, now) {
    if (!this.owlEnforcer) return;
    const owl = this.owlEnforcer;

    // Patrol waypoints circling the pond (cx:1050, cy:1100)
    const PATROL = [
      { x: 1170, y: 1100 },
      { x: 1050, y: 1025 },
      { x: 930,  y: 1100 },
      { x: 1050, y: 1180 },
    ];

    if (owl.state === 'stunned') {
      if (now >= owl.stunnedUntil) { owl.state = 'patrol'; }
      return;
    }

    if (owl.state === 'patrol') {
      const wp = PATROL[owl.patrolIndex];
      const dx = wp.x - owl.x, dy = wp.y - owl.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 15) {
        owl.patrolIndex = (owl.patrolIndex + 1) % PATROL.length;
      } else {
        const spd = 38 * dt;
        owl.x += (dx / dist) * spd;
        owl.y += (dy / dist) * spd;
        owl.rotation = Math.atan2(dy, dx);
      }
    } else if (owl.state === 'chasing') {
      owl.chaseTimer -= dt;
      const target = this.birds.get(owl.alertBirdId);
      if (!target || owl.chaseTimer <= 0) {
        owl.state = 'returning';
        owl.alertBirdId = null;
      } else {
        const dx = target.x - owl.x, dy = target.y - owl.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 45) {
          // Caught! Steal coins, break combo
          const stolen = Math.min(Math.max(8, Math.floor(target.coins * 0.12)), 120);
          target.coins = Math.max(0, target.coins - stolen);
          target.comboCount = 0;
          target.stunnedUntil = now + 1500; // brief stun
          this.events.push({ type: 'owl_caught', birdId: target.id, birdName: target.name, stolen, x: owl.x, y: owl.y });
          owl.state = 'returning';
          owl.alertBirdId = null;
          owl.chaseTimer = 0;
        } else {
          const spd = 180 * dt;
          owl.x += (dx / dist) * spd;
          owl.y += (dy / dist) * spd;
          owl.rotation = Math.atan2(dy, dx);
        }
      }
    } else if (owl.state === 'returning') {
      const home = PATROL[0];
      const dx = home.x - owl.x, dy = home.y - owl.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) {
        owl.state = 'patrol';
      } else {
        const spd = 80 * dt;
        owl.x += (dx / dist) * spd;
        owl.y += (dy / dist) * spd;
        owl.rotation = Math.atan2(dy, dx);
      }
    }

    // Spawn pond fish on a timer
    if (now >= this.pondFishRespawnTimer && this.pondFishIds.size < 3) {
      this._spawnPondFish();
      this.pondFishRespawnTimer = now + this._randomRange(35000, 55000);
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

      // At dusk: reset gazette stats for the new night cycle
      if (newPhase === 'dusk') {
        this._resetGazetteStats();
      }
      // At day (new morning): publish the Bird City Gazette recap of the night
      if (newPhase === 'day') {
        this._compileGazette();
      }
      // At night: cats get faster and spawn sooner
      if (newPhase === 'night' && this.cat) {
        this.cat.speed *= 1.4;
      }
      // At night: Owl Enforcer arrives at the Sacred Pond + initial fish spawn
      if (newPhase === 'night') {
        this._spawnOwlEnforcer();
        // Seed 3 fish right away
        for (let i = 0; i < 3; i++) this._spawnPondFish();
        this.pondFishRespawnTimer = Date.now() + 45000;
        this.events.push({ type: 'owl_appears' });
        // 30% chance of Aurora Borealis — a sacred night spectacle
        this.auroraTriggeredThisNight = false;
        if (Math.random() < 0.30) {
          this._startAurora(now);
        }
      }
      // At dusk: reset aurora trigger flag so each night can have one aurora
      if (newPhase === 'dusk') {
        this.auroraTriggeredThisNight = false;
      }
      // At day: clear aurora and night market
      if (newPhase === 'day' && this.aurora) {
        this.aurora = null;
        this.events.push({ type: 'aurora_end', message: '✨ The Aurora Borealis fades as dawn approaches...' });
      }
      if (newPhase === 'day' && this.nightMarket) {
        this.nightMarket = null;
        this.events.push({ type: 'night_market_close' });
      }
      // At dawn: respawn all street foods to celebrate the new day
      if (newPhase === 'dawn') {
        for (const food of this.foods.values()) {
          food.active = true;
          food.respawnAt = null;
        }
        // Owl departs at dawn
        if (this.owlEnforcer) {
          this.owlEnforcer = null;
          this.events.push({ type: 'owl_leaves' });
        }
        // Remove pond fish
        for (const fishId of this.pondFishIds) {
          this.foods.delete(fishId);
        }
        this.pondFishIds.clear();
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
          prestige: b.prestige || 0,
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
          eagleFeather: b.eagleFeather || false,
          idolBadge: b.idolBadge || false,
          royaleChampBadge: b.royaleChampBadge || false,
          fightingChampBadge: b.fightingChampBadge || false,
          skillTreeMaster: b.skillTreeMaster || false,
          constellationBadge: b.constellationBadge || false,
          courtTitle: (() => { const cm = this.royalCourt.find(m => m.birdId === b.id); return cm ? cm.title : null; })(),
          stardustCloakUntil: b.stardustCloakUntil || 0,
          cometTrailUntil: b.cometTrailUntil || 0,
          isFlu: b.fluUntil > now,
          formationType: b.formationType || null,
          // Blackout × Cursed Coin: coin holder is INVISIBLE on all other players' minimaps during blackout
          hasCursedCoin: this.cursedCoin && this.cursedCoin.state === 'held' && this.cursedCoin.holderId === b.id
            && !(this.chaosEvent && this.chaosEvent.type === 'blackout' && b.id !== bird.id),
          cursedCoinIntensity: (this.cursedCoin && this.cursedCoin.state === 'held' && this.cursedCoin.holderId === b.id) ? this.cursedCoin.intensity : 0,
          witnessProtectionActive: b.witnessProtectionUntil > now,
          streetDuelId: b.streetDuelId || null,
        });
      }
    }

    // Nearby poops
    const nearbyPoops = [];
    for (const p of this.poops.values()) {
      if (Math.abs(p.x - bird.x) < viewRange && Math.abs(p.y - bird.y) < viewRange) {
        nearbyPoops.push({ id: p.id, x: p.x, y: p.y, hitTarget: p.hitTarget, isLegend: p.isLegend || false, vpEffect: p.vpEffect || null });
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
    if (bird.prestige >= 3) {
      effectiveCooldown = Math.floor(effectiveCooldown * PRESTIGE_COOLDOWN_MULTS[Math.min(bird.prestige, 5)]);
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
      chaosEvent: this.chaosEvent ? { type: this.chaosEvent.type, endsAt: this.chaosEvent.endsAt, isCrimeDisco: !!(this.chaosEvent.data && this.chaosEvent.data.crimeDisco) } : null,
      // Coin shower / food festival items near this bird
      chaosEventFoods: (() => {
        if (!this.chaosEvent || (this.chaosEvent.type !== 'coin_shower' && this.chaosEvent.type !== 'food_festival')) return [];
        const result = [];
        for (const food of this.chaosEventFoods.values()) {
          if (!food.active) continue;
          const dx = food.x - bird.x; const dy = food.y - bird.y;
          if (Math.sqrt(dx*dx + dy*dy) < 800) result.push({ id: food.id, x: food.x, y: food.y, type: food.type, coinValue: food.coinValue });
        }
        return result;
      })(),
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
      // Most Wanted Board + City Lockdown
      wantedTopThree: this.wantedTopThree,
      cityLockdown: this.cityLockdown ? {
        endsAt: this.cityLockdown.endsAt,
        triggerCount: this.cityLockdown.triggerCount,
      } : null,
      nationalGuard: (() => {
        const nearby = [];
        for (const ng of this.nationalGuard.values()) {
          const dx = ng.x - bird.x;
          const dy = ng.y - bird.y;
          if (Math.sqrt(dx * dx + dy * dy) < 800) {
            nearby.push({ id: ng.id, x: ng.x, y: ng.y, rotation: ng.rotation, state: ng.state, targetId: ng.targetId, poopHits: ng.poopHits });
          }
        }
        return nearby;
      })(),
      // Minimap: all national guard positions
      allNationalGuard: Array.from(this.nationalGuard.values()).map(ng => ({ id: ng.id, x: ng.x, y: ng.y, state: ng.state, targetId: ng.targetId })),
      foodTruck: foodTruckState,
      raccoons: nearbyRaccoons,
      drunkPigeons: nearbyDrunkPigeons,
      cops: nearbyCops,
      bountyHunter: this.bountyHunter ? {
        x: this.bountyHunter.x,
        y: this.bountyHunter.y,
        rotation: this.bountyHunter.rotation,
        state: this.bountyHunter.state,
        targetId: this.bountyHunter.targetId,
        poopHits: this.bountyHunter.poopHits,
        isTargetingMe: this.bountyHunter.targetId === bird.id,
      } : null,
      policeHelicopter: this.policeHelicopter ? {
        x: this.policeHelicopter.x,
        y: this.policeHelicopter.y,
        rotation: this.policeHelicopter.rotation,
        state: this.policeHelicopter.state,
        targetId: this.policeHelicopter.targetId,
        poopHits: this.policeHelicopter.poopHits,
        spotlighting: this.policeHelicopter.spotlighting,
        isTargetingMe: this.policeHelicopter.targetId === bird.id,
      } : null,
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
        // Tornado position (world-space) — sent every tick so client can animate
        tornadoX: this.weather.tornadoX,
        tornadoY: this.weather.tornadoY,
      } : null,
      weatherBetting: (() => {
        const wb = this.weatherBetting;
        if (!wb) return null;
        const myBet = wb.bets.get(bird.id) || null;
        const typeAmounts = {};
        for (const bet of wb.bets.values()) {
          typeAmounts[bet.type] = (typeAmounts[bet.type] || 0) + bet.amount;
        }
        return { openUntil: wb.openUntil, myBet, typeAmounts, totalBets: wb.bets.size };
      })(),
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
          // Which boost gates are on per-bird cooldown for THIS bird specifically?
          myGateCooldowns: race.state === 'racing'
            ? (() => {
                const cooldowns = {};
                for (const gate of this.RACE_BOOST_GATES) {
                  const key = `${gate.id}_${bird.id}`;
                  if ((race.boostGateCooldowns.get(key) || 0) > now) {
                    cooldowns[gate.id] = true;
                  }
                }
                return cooldowns;
              })()
            : {},
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
        onIceRink: bird.onIceRink || false,
        nearNestFirepit: bird.nearNestFirepit || false,
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
        // Skill Tree — Feather Points system
        skillPoints: bird.skillPoints || 0,
        skillTreeUnlocked: bird.skillTreeUnlocked || [],
        skillTreeDefs: SKILL_TREE_DEFS,
        skillTreeMaster: bird.skillTreeMaster || false,
        // Black Market active items
        bmSpeedUntil: bird.bmSpeedUntil,
        bmMegaPoops: bird.bmMegaPoops,
        bmSmokeBombUntil: bird.bmSmokeBombUntil,
        bmDoubleXpUntil: bird.bmDoubleXpUntil,
        // Night Market (aurora bazaar) — currency + active buffs
        cosmicFish: bird.cosmicFish || 0,
        constellationBadge: bird.constellationBadge || false,
        stardustCloakUntil: bird.stardustCloakUntil || 0,
        cometTrailUntil: bird.cometTrailUntil || 0,
        oracleEyeUntil: bird.oracleEyeUntil || 0,
        starPowerUntil: bird.starPowerUntil || 0,
        lunarLensUntil: bird.lunarLensUntil || 0,
        nearNightMarket: (() => {
          if (!this.nightMarket) return false;
          const dx = bird.x - this.nightMarket.x;
          const dy = bird.y - this.nightMarket.y;
          return Math.sqrt(dx * dx + dy * dy) < 110;
        })(),
        // Combo streak
        comboCount: bird.comboCount,
        comboExpiresAt: bird.comboExpiresAt,
        // Weather debuffs / buffs
        hailSlowUntil: bird.hailSlowUntil,
        heatQuenchedUntil: bird.heatQuenchedUntil,
        puddleBoostUntil: bird.puddleBoostUntil,
        warmUntil: bird.warmUntil,
        // Race boost gate
        raceBoostUntil: bird.raceBoostUntil,
        // Golden Egg Scramble
        carryingEggId: bird.carryingEggId,
        eggTackleImmunityUntil: bird.eggTackleImmunityUntil,
        // Street Duel
        streetDuelId: bird.streetDuelId || null,
        incomingChallenge: (() => {
          const ch = this.pendingChallenges.get(bird.id);
          if (!ch || ch.expiresAt < now) return null;
          return { challengerName: ch.challengerName, expiresAt: ch.expiresAt, pot: ch.pot };
        })(),
        nearbyBirdsForDuel: (() => {
          if (bird.streetDuelId) return [];
          const result = [];
          for (const [otherId, other] of this.birds) {
            if (otherId === bird.id || other.streetDuelId) continue;
            const dx = other.x - bird.x;
            const dy = other.y - bird.y;
            if (Math.sqrt(dx*dx + dy*dy) < 100) {
              result.push({ id: otherId, name: other.name, dist: Math.sqrt(dx*dx+dy*dy) });
            }
          }
          return result.sort((a,b) => a.dist - b.dist);
        })(),
        // Hit contract: is there an active bounty on this bird?
        myHitBounty: this.activeHits.has(bird.id) ? {
          reward: this.activeHits.get(bird.id).reward,
          contractorName: this.activeHits.get(bird.id).contractorName,
          expiresAt: this.activeHits.get(bird.id).expiresAt,
        } : null,
        // King's Pardon: are you currently protected by a royal pardon?
        pardonedUntil: bird.pardonedUntil || 0,
        // People's Revolt window: how long until Tax Day revolt window expires (for non-Kingpin birds)
        revoltWindowUntil: (this.kingpin && this.kingpin.revoltWindowUntil) ? this.kingpin.revoltWindowUntil : 0,
        // Kingpin: are YOU the kingpin?
        isKingpin: this.kingpin ? this.kingpin.birdId === bird.id : false,
        kingpinDecreesAvailable: (this.kingpin && this.kingpin.birdId === bird.id) ? (this.kingpin.decreesAvailable || 0) : 0,
        // Royal Court: what noble title do YOU hold (if any)?
        myCourtTitle: (() => { const cm = this.royalCourt.find(m => m.birdId === bird.id); return cm ? cm.title : null; })(),
        // Gang
        gangId: bird.gangId,
        gangName: bird.gangName,
        gangTag: bird.gangTag,
        gangColor: bird.gangColor,
        gangRole: bird.gangRole,
        // Prestige
        prestige: bird.prestige || 0,
        prestigeThreshold: PRESTIGE_THRESHOLD,
        maxPrestige: MAX_PRESTIGE,
        // Formation Flying
        formationType: bird.formationType || null,
        // Witness Protection
        witnessProtectionUntil: bird.witnessProtectionUntil || 0,
        witnessProtectionCooldown: bird.witnessProtectionCooldown || 0,
        // Duel Betting — spectators see open betting windows
        duelBetting: (() => {
          if (bird.streetDuelId) return null; // duelers don't see betting panel
          for (const [, duel] of this.streetDuels) {
            if (duel.state !== 'active') continue;
            if (!duel.betWindowUntil || duel.betWindowUntil <= now) continue;
            const bets1 = duel.bets ? [...duel.bets.values()].filter(b => b.onId === duel.challengerId).reduce((s, b) => s + b.amount, 0) : 0;
            const bets2 = duel.bets ? [...duel.bets.values()].filter(b => b.onId === duel.targetId).reduce((s, b) => s + b.amount, 0) : 0;
            const myBet = duel.bets ? duel.bets.get(bird.id) : null;
            return {
              duelId: duel.id,
              windowUntil: duel.betWindowUntil,
              fighter1Id: duel.challengerId,
              fighter1Name: duel.challengerName,
              fighter2Id: duel.targetId,
              fighter2Name: duel.targetName,
              bets1,
              bets2,
              total: bets1 + bets2,
              myBet: myBet ? { amount: myBet.amount, onId: myBet.onId } : null,
            };
          }
          return null;
        })(),
        // Duel Rematch — post-duel 10-second window to instantly rematch
        duelRematch: (() => {
          for (const [, rm] of this.rematchPending) {
            if (rm.bird1Id !== bird.id && rm.bird2Id !== bird.id) continue;
            if (rm.expiresAt < now) continue;
            return {
              expiresAt: rm.expiresAt,
              opponentName: rm.bird1Id === bird.id ? rm.bird2Name : rm.bird1Name,
              iAccepted: rm.bird1Id === bird.id ? rm.bird1Accept : rm.bird2Accept,
            };
          }
          return null;
        })(),
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
          decreesAvailable: this.kingpin.decreesAvailable || 0,
        };
      })() : null,
      // Active Royal Decree — affects all players
      activeDecree: this.kingpinDecree ? {
        type: this.kingpinDecree.type,
        endsAt: this.kingpinDecree.endsAt,
        kingpinName: this.kingpinDecree.kingpinName,
      } : null,
      // Royal Court — top-3 richest non-Kingpin birds with noble titles
      royalCourt: this.royalCourt.map(m => ({
        birdId: m.birdId,
        birdName: m.birdName,
        gangTag: m.gangTag,
        gangColor: m.gangColor,
        title: m.title,
        coins: m.coins,
      })),
      // Dethronement Pool (City Hall Bounty Board)
      dethronementPool: {
        total: this.dethronementPool.total,
        topDonor: this.dethronementPool.topDonor,
        lastPaidTo: this.dethronementPool.lastPaidTo,
      },
      nearCityHall: (() => {
        const ch = this.CITY_HALL_POS;
        const dx = bird.x - ch.x;
        const dy = bird.y - ch.y;
        return Math.sqrt(dx * dx + dy * dy) < ch.radius;
      })(),
      // Vending Machine proximity + active effect
      nearVendingMachine: (() => {
        for (const vm of world.VENDING_MACHINES) {
          const dx = bird.x - vm.x;
          const dy = bird.y - vm.y;
          if (Math.sqrt(dx * dx + dy * dy) < 70) {
            const cooldown = bird.vpMachineCooldowns[vm.id] || 0;
            return {
              idx: vm.id,
              x: vm.x,
              y: vm.y,
              onCooldown: now - cooldown < 12000,
              secsLeft: now - cooldown < 12000 ? Math.ceil((12000 - (now - cooldown)) / 1000) : 0,
              alreadyLoaded: !!bird.vpPoopEffect,
            };
          }
        }
        return null;
      })(),
      vpPoopEffect: bird.vpPoopEffect || null,
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
      // Street Duels (active duels visible to all nearby players for rendering hearts above combatants)
      streetDuels: (() => {
        const result = [];
        for (const [, duel] of this.streetDuels) {
          if (duel.state !== 'active') continue;
          const bets1 = duel.bets ? [...duel.bets.values()].filter(b => b.onId === duel.challengerId).reduce((s, b) => s + b.amount, 0) : 0;
          const bets2 = duel.bets ? [...duel.bets.values()].filter(b => b.onId === duel.targetId).reduce((s, b) => s + b.amount, 0) : 0;
          result.push({
            id: duel.id,
            challengerId: duel.challengerId,
            challengerName: duel.challengerName,
            targetId: duel.targetId,
            targetName: duel.targetName,
            hp: { [duel.challengerId]: duel.hp[duel.challengerId], [duel.targetId]: duel.hp[duel.targetId] },
            expiresAt: duel.expiresAt,
            betWindowUntil: duel.betWindowUntil || 0,
            bets1,
            bets2,
            rematchCount: duel.rematchCount || 0,
          });
        }
        return result;
      })(),
      // Sewer layer — only visible when underground
      sewerRats: bird.inSewer
        ? Array.from(this.sewerRats.values()).map(r => ({ id: r.id, x: r.x, y: r.y, rotation: r.rotation, state: r.state }))
        : [],
      sewerLoot: (bird.inSewer || (bird.lunarLensUntil || 0) > now)
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
      tournamentWins: bird.tournamentWins || 0,
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
      // Gang Nests — all alive nests visible city-wide (on minimap and world)
      gangNests: (() => {
        const nests = [];
        for (const nest of this.gangNests.values()) {
          nests.push({
            gangId: nest.gangId,
            gangTag: nest.gangTag,
            gangColor: nest.gangColor,
            ownerName: nest.ownerName,
            x: nest.x,
            y: nest.y,
            hp: nest.hp,
            maxHp: nest.maxHp,
            alive: nest.destroyedAt === null,
            isMyNest: bird.gangId === nest.gangId,
            rebuildAvailableAt: nest.rebuildAvailableAt,
          });
        }
        return nests;
      })(),
      myNestStatus: (() => {
        if (!bird.gangId) return null;
        const nest = this.gangNests.get(bird.gangId);
        if (!nest) return { exists: false, rebuildAvailableAt: null };
        return {
          exists: true,
          alive: nest.destroyedAt === null,
          hp: nest.hp,
          maxHp: nest.maxHp,
          x: nest.x,
          y: nest.y,
          rebuildAvailableAt: nest.rebuildAvailableAt,
        };
      })(),
      // Bioluminescent Pond — Owl Enforcer (night-only)
      owlEnforcer: this.owlEnforcer ? {
        x: this.owlEnforcer.x,
        y: this.owlEnforcer.y,
        rotation: this.owlEnforcer.rotation,
        state: this.owlEnforcer.state,
        hp: this.owlEnforcer.hp,
        maxHp: this.owlEnforcer.maxHp,
      } : null,
      // Hall of Legends — top prestige players city-wide
      hallOfLegends: this._cachedHallOfLegends || [],
      // Idol Hall of Fame — top all-time singing contest champions
      idolLeaderboard: this._cachedIdolLeaderboard || [],
      myIdolWins: bird.idolWins || 0,
      eagleFeather: bird.eagleFeather || false,
      nearHallOfLegends: (() => {
        const dx = bird.x - this.HALL_OF_LEGENDS_POS.x;
        const dy = bird.y - this.HALL_OF_LEGENDS_POS.y;
        return Math.sqrt(dx * dx + dy * dy) < this.HALL_OF_LEGENDS_POS.radius;
      })(),
      // Mystery Crate Airdrop
      mysteryCrate: this.mysteryCrate ? {
        x: this.mysteryCrate.x,
        y: this.mysteryCrate.y,
        spawnedAt: this.mysteryCrate.spawnedAt,
        expiresAt: this.mysteryCrate.expiresAt,
      } : null,
      // Mystery Crate active item buffs
      mcJetWingsUntil:     bird.mcJetWingsUntil,
      mcRiotShieldUntil:   bird.mcRiotShieldUntil,
      mcGhostModeUntil:    bird.mcGhostModeUntil,
      mcLightningRodUntil: bird.mcLightningRodUntil,
      mcMagnetUntil:       bird.mcMagnetUntil,
      mcDiamondPoopUntil:  bird.mcDiamondPoopUntil,
      mcNukePoop:          bird.mcNukePoop,
      // Bird Flu
      fluUntil:     bird.fluUntil,
      fluOutbreak:  this.fluOutbreak,
      fluMedicineItems: this.fluOutbreak
        ? Array.from(this.fluMedicineItems.values()).filter(m => m.active)
        : [],
      // Crow Cartel Raid
      crowCartel: this.crowCartel ? {
        crows: Array.from(this.crowCartel.crows.values()).map(c => ({
          id: c.id, x: c.x, y: c.y, rotation: c.rotation,
          hp: c.hp, maxHp: c.maxHp, type: c.type, state: c.state,
        })),
        targetZoneId: this.crowCartel.targetZoneId,
        targetZoneName: this.crowCartel.targetZoneName,
        state: this.crowCartel.state,
        raidEndsAt: this.crowCartel.raidEndsAt,
        holdUntil: this.crowCartel.holdUntil,
      } : null,
      // Bird City Idol
      birdIdol: (() => {
        const idol = this.birdIdol;
        if (!idol) return null;
        return {
          state: idol.state,
          contestants: idol.contestantsOrder.map((id, i) => ({
            id,
            name: idol.contestants.get(id).name,
            gangTag: idol.contestants.get(id).gangTag,
            gangColor: idol.contestants.get(id).gangColor,
            prestige: idol.contestants.get(id).prestige,
            tattoos: idol.contestants.get(id).tattoos,
            performanceHits: idol.contestants.get(id).performanceHits,
            slotNum: i + 1,
          })),
          openUntil: idol.openUntil,
          votingUntil: idol.votingUntil,
          resultsUntil: idol.resultsUntil,
          winnerId: idol.winnerId,
          winnerName: idol.winnerName,
          myVote: idol.votes.has(bird.id) ? idol.votes.get(bird.id).contestantId : null,
          isContestant: idol.contestants.has(bird.id),
          totalVotes: idol.votes.size,
        };
      })(),
      idolXpBoostUntil: this.idolXpBoostUntil,
      idolBadge: bird.idolBadge || false,
      royaleChampBadge: bird.royaleChampBadge || false,
      fightingChampBadge: bird.fightingChampBadge || false,
      nearIdolStage: (() => {
        const dx = bird.x - this.IDOL_STAGE_POS.x;
        const dy = bird.y - this.IDOL_STAGE_POS.y;
        return Math.sqrt(dx * dx + dy * dy) < this.IDOL_STAGE_POS.radius;
      })(),
      // Pigeon Pied Piper
      piper: this.piper ? {
        x: this.piper.x,
        y: this.piper.y,
        hitCount: this.piper.hitCount,
        hitsRequired: this.piper.hitsRequired,
        endsAt: this.piper.endsAt,
      } : null,
      piperEnchantedUntil: bird.piperEnchantedUntil,
      // Cursed Coin — during Blackout, holder position hidden from other players' minimaps
      cursedCoin: (() => {
        if (!this.cursedCoin) return null;
        const isBlackout = !!(this.chaosEvent && this.chaosEvent.type === 'blackout');
        const isHolder = this.cursedCoin.holderId === bird.id;
        const isHeld = this.cursedCoin.state === 'held';
        return {
          state: this.cursedCoin.state,
          // During blackout, non-holder players can't see the coin world position or holder info
          x: isBlackout && isHeld && !isHolder ? null : this.cursedCoin.x,
          y: isBlackout && isHeld && !isHolder ? null : this.cursedCoin.y,
          holderId: isBlackout && isHeld && !isHolder ? null : this.cursedCoin.holderId,
          holderName: isBlackout && isHeld && !isHolder ? '???' : this.cursedCoin.holderName,
          intensity: this.cursedCoin.intensity,
          isMine: isHolder,
          heldSince: this.cursedCoin.heldSince,
          blackoutHidden: isBlackout && isHeld && !isHolder,
        };
      })(),
      // Crime Wave
      crimeWave: this.crimeWave ? {
        endsAt: this.crimeWave.endsAt,
      } : null,
      // Aurora Borealis
      aurora: this.aurora ? {
        endsAt: this.aurora.endsAt,
        intensity: this.aurora.intensity,
      } : null,
      // Night Market (aurora bazaar — near Sacred Pond)
      nightMarket: this.nightMarket ? { x: this.nightMarket.x, y: this.nightMarket.y } : null,
      // Ice Rink (blizzard-only)
      iceRink: this.iceRink || null,
      // Shooting Star (aurora event)
      shootingStar: this.shootingStar ? {
        x: this.shootingStar.x,
        y: this.shootingStar.y,
        spawnedAt: this.shootingStar.spawnedAt,
        expiresAt: this.shootingStar.expiresAt,
        streakAngle: this.shootingStar.streakAngle,
      } : null,
      meteorShower: this.meteorShower ? {
        stars: Array.from(this.meteorShower.stars.values()).filter(s => !s.claimed).map(s => ({
          id: s.id, x: s.x, y: s.y, expiresAt: s.expiresAt, streakAngle: s.streakAngle,
        })),
      } : null,
      // City Lockdown — available in self state for HUD rendering
      cityLockdown: this.cityLockdown ? {
        endsAt: this.cityLockdown.endsAt,
        triggerCount: this.cityLockdown.triggerCount,
      } : null,
      isNGTarget: Array.from(this.nationalGuard.values()).some(ng => ng.targetId === bird.id),
      // Seagull Invasion
      seagullInvasion: this.seagullInvasion ? {
        endsAt: this.seagullInvasion.endsAt,
        seagulls: Array.from(this.seagullInvasion.seagulls.values())
          .filter(sg => sg.state !== 'dead')
          .map(sg => ({
            id: sg.id, x: sg.x, y: sg.y, rotation: sg.rotation,
            state: sg.state, hp: sg.hp, carriedFoodType: sg.carriedFoodType || null,
          })),
        totalCount: this.seagullInvasion.seagulls.size,
        aliveCount: Array.from(this.seagullInvasion.seagulls.values()).filter(sg => sg.state !== 'dead').length,
      } : null,
      // Bird Royale
      birdRoyale: this.birdRoyale ? {
        state: this.birdRoyale.state,
        startAt: this.birdRoyale.startAt,
        endsAt: this.birdRoyale.endsAt,
        centerX: this.birdRoyale.centerX,
        centerY: this.birdRoyale.centerY,
        currentRadius: this.birdRoyale.currentRadius,
        startRadius: this.birdRoyale.startRadius,
        endRadius: this.birdRoyale.endRadius,
        participantCount: this.birdRoyale.participants.size,
        aliveCount: Array.from(this.birdRoyale.participants.values()).filter(p => p.alive).length,
        myStatus: (() => {
          const p = this.birdRoyale.participants.get(bird.id);
          if (!p) return 'spectator';
          return p.alive ? 'alive' : 'eliminated';
        })(),
        winner: this.birdRoyale.winner || null,
        // For spectator cheer panel: list of alive participants
        aliveParticipants: Array.from(this.birdRoyale.participants.entries())
          .filter(([, p]) => p.alive)
          .map(([bId, p]) => ({ birdId: bId, name: p.name, gangTag: p.gangTag || null })),
        isSpectator: bird.royaleSpectator || false,
        cheerCooldown: bird.royaleCheerCooldown || 0,
      } : null,
      // Gang Royale Territory Bonus
      gangRoyaleBonus: (this.gangRoyaleBonus && now < this.gangRoyaleBonus.bonusUntil) ? {
        gangId: this.gangRoyaleBonus.gangId,
        gangTag: this.gangRoyaleBonus.gangTag,
        gangName: this.gangRoyaleBonus.gangName,
        bonusUntil: this.gangRoyaleBonus.bonusUntil,
        isMyGang: bird.gangId === this.gangRoyaleBonus.gangId,
      } : null,
      // Donut Cop
      donutCop: {
        x: this.donutCop.x,
        y: this.donutCop.y,
        state: this.donutCop.state,
        stateEndsAt: this.donutCop.stateEndsAt,
        stunUntil: this.donutCop.stunUntil,
      },
      // Pigeon Fighting Championship
      tournament: {
        state: this.tournament.state,
        nextAt: this.tournament.nextAt,
        signupUntil: this.tournament.signupUntil,
        entrantCount: this.tournament.entrants.length,
        entrants: this.tournament.entrants.map(e => ({ birdId: e.birdId, name: e.name, gangTag: e.gangTag })),
        pot: this.tournament.pot,
        round: this.tournament.round,
        bracket: this.tournament.bracket.map(m => ({
          bird1Id: m.bird1Id, bird1Name: m.bird1Name,
          bird2Id: m.bird2Id, bird2Name: m.bird2Name,
          winner: m.winner, bye: m.bye,
        })),
        isEntered: this.tournament.entrants.some(e => e.birdId === bird.id),
        isInMatch: this.tournament.bracket.some(m => (m.bird1Id === bird.id || m.bird2Id === bird.id) && !m.bye && !m.winner),
        champion: this.tournament.champion,
        entryFee: this.tournament.entryFee,
        vipFee: (bird.mafiaRep || 0) >= 15 ? Math.floor(this.tournament.entryFee / 2) : this.tournament.entryFee,
        hasVipDiscount: (bird.mafiaRep || 0) >= 15,
      },
      // Tournament Spectator Betting — list of active tournament duels with open bet windows
      tournamentBetting: (() => {
        // Fighters in a tournament duel cannot see the betting panel
        const myDuel = bird.streetDuelId ? this.streetDuels.get(bird.streetDuelId) : null;
        if (myDuel && myDuel.isTournamentDuel) return null;
        if (this.tournament.state !== 'fighting') return null;
        const activeBets = [];
        for (const [, duel] of this.streetDuels) {
          if (!duel.isTournamentDuel) continue;
          if (duel.state !== 'active') continue;
          if (!duel.betWindowUntil || duel.betWindowUntil <= now) continue;
          const bets1 = duel.bets ? [...duel.bets.values()].filter(b => b.onId === duel.challengerId).reduce((s, b) => s + b.amount, 0) : 0;
          const bets2 = duel.bets ? [...duel.bets.values()].filter(b => b.onId === duel.targetId).reduce((s, b) => s + b.amount, 0) : 0;
          const myBet = duel.bets ? duel.bets.get(bird.id) : null;
          activeBets.push({
            duelId: duel.id,
            windowUntil: duel.betWindowUntil,
            fighter1Id: duel.challengerId,
            fighter1Name: duel.challengerName,
            fighter2Id: duel.targetId,
            fighter2Name: duel.targetName,
            bets1,
            bets2,
            total: bets1 + bets2,
            myBet: myBet ? { amount: myBet.amount, onId: myBet.onId } : null,
            round: duel.tournamentRound,
          });
        }
        return activeBets.length > 0 ? activeBets : null;
      })(),
      // Championship leaderboard — top fighters by all-time tournament wins (from connected birds)
      championshipLeaderboard: (() => {
        return [...this.birds.values()]
          .filter(b => (b.tournamentWins || 0) > 0)
          .sort((a, b) => (b.tournamentWins || 0) - (a.tournamentWins || 0))
          .slice(0, 5)
          .map(b => ({
            name: b.name,
            gangTag: b.gangTag || null,
            wins: b.tournamentWins || 0,
            prestige: b.prestige || 0,
            fightingChampBadge: b.fightingChampBadge || false,
          }));
      })(),
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

    // Also refresh the Hall of Legends (top prestige players from Firestore)
    // Merge live prestige birds in first
    const livePrestige = [];
    for (const b of this.birds.values()) {
      if ((b.prestige || 0) > 0) {
        livePrestige.push({
          name: b.name, prestige: b.prestige, type: b.type,
          xp: b.xp, eagleFeather: b.eagleFeather || false,
          gangTag: b.gangTag || null, gangColor: b.gangColor || null,
          online: true,
        });
      }
    }
    firestoreDb.getHallOfLegends().then(savedHall => {
      const liveNames = new Set(livePrestige.map(b => b.name));
      const merged = [...livePrestige];
      for (const s of savedHall) {
        if (!liveNames.has(s.name)) merged.push({ ...s, online: false });
      }
      merged.sort((a, b) => (b.prestige - a.prestige) || (b.xp - a.xp));
      this._cachedHallOfLegends = merged.slice(0, 5);
    }).catch(() => {
      // fallback: live only
      livePrestige.sort((a, b) => (b.prestige - a.prestige) || (b.xp - a.xp));
      this._cachedHallOfLegends = livePrestige.slice(0, 5);
    });

    // Refresh Idol Leaderboard from live birds + Firestore
    this._refreshIdolLeaderboard();
  }

  // Refresh the top idol champions leaderboard (call after any idol win)
  _refreshIdolLeaderboard() {
    const liveIdolBirds = [];
    for (const b of this.birds.values()) {
      if ((b.idolWins || 0) > 0) {
        liveIdolBirds.push({
          name: b.name, idolWins: b.idolWins,
          gangTag: b.gangTag || null, gangColor: b.gangColor || null,
          prestige: b.prestige || 0, online: true,
        });
      }
    }
    // Try to merge Firestore offline data
    firestoreDb.getIdolLeaderboard().then(savedIdols => {
      const liveNames = new Set(liveIdolBirds.map(b => b.name));
      const merged = [...liveIdolBirds];
      for (const s of savedIdols) {
        if (!liveNames.has(s.name)) merged.push({ ...s, online: false });
      }
      merged.sort((a, b) => (b.idolWins || 0) - (a.idolWins || 0));
      this._cachedIdolLeaderboard = merged.slice(0, 5);
    }).catch(() => {
      liveIdolBirds.sort((a, b) => (b.idolWins || 0) - (a.idolWins || 0));
      this._cachedIdolLeaderboard = liveIdolBirds.slice(0, 5);
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
      prestige: bird.prestige || 0,
      eagle_feather: bird.eagleFeather || false,
      skill_points: bird.skillPoints || 0,
      skill_tree: JSON.stringify(bird.skillTreeUnlocked || []),
      skill_tree_master: bird.skillTreeMaster || false,
      tournament_wins: bird.tournamentWins || 0,
      idol_wins: bird.idolWins || 0,
      cosmic_fish: bird.cosmicFish || 0,
      constellation_badge: bird.constellationBadge || false,
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
    const prestigeXpMult   = PRESTIGE_XP_MULTS[Math.min(bird.prestige || 0, 5)];
    const prestigeCoinMult = PRESTIGE_COIN_MULTS[Math.min(bird.prestige || 0, 5)];
    const xpGain  = Math.floor(challenge.reward.xp    * streakMult * prestigeXpMult);
    const coinsGain = Math.floor(challenge.reward.coins * streakMult * prestigeCoinMult);
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

  // ============================================================
  // SKILL TREE — Feather Point unlock handler
  // ============================================================
  _handleSkillTreeUnlock(bird, skillId, now) {
    const def = SKILL_TREE_DEFS[skillId];
    if (!def) return;
    if (bird.skillTreeUnlocked && bird.skillTreeUnlocked.includes(skillId)) {
      this.events.push({ type: 'skill_tree_fail', birdId: bird.id, reason: 'Already unlocked.', skillId });
      return;
    }
    if (def.req && !(bird.skillTreeUnlocked && bird.skillTreeUnlocked.includes(def.req))) {
      this.events.push({ type: 'skill_tree_fail', birdId: bird.id, reason: 'Unlock ' + SKILL_TREE_DEFS[def.req].label + ' first.', skillId });
      return;
    }
    if ((bird.skillPoints || 0) < def.cost) {
      this.events.push({ type: 'skill_tree_fail', birdId: bird.id, reason: 'Need ' + def.cost + ' Feather Point(s). You have ' + (bird.skillPoints || 0) + '.', skillId });
      return;
    }
    bird.skillPoints -= def.cost;
    bird.skillTreeUnlocked = bird.skillTreeUnlocked || [];
    bird.skillTreeUnlocked.push(skillId);

    // Check for Skill Tree Mastery (all 12 skills unlocked)
    const allSkillIds = Object.keys(SKILL_TREE_DEFS);
    if (!bird.skillTreeMaster && allSkillIds.every(id => bird.skillTreeUnlocked.includes(id))) {
      bird.skillTreeMaster = true;
      this.events.push({
        type: 'skill_tree_mastered',
        birdId: bird.id,
        birdName: bird.name,
        gangTag: bird.gangTag || null,
      });
    }

    this._saveBird(bird);
    this.events.push({ type: 'skill_tree_unlocked', birdId: bird.id, birdName: bird.name, skillId, label: def.label, emoji: def.emoji, skillPoints: bird.skillPoints, isMaster: bird.skillTreeMaster });
  }

  // ============================================================
  // SKILL RESPEC — Reset all skill tree unlocks at Don Featherstone (500c)
  // ============================================================
  _handleDonRespec(bird, now) {
    const RESPEC_COST = 500;

    // Must be near The Don
    const dx = bird.x - world.DON_POS.x;
    const dy = bird.y - world.DON_POS.y;
    if (Math.sqrt(dx * dx + dy * dy) > 130) {
      this.events.push({ type: 'respec_fail', birdId: bird.id, reason: 'You must be near Don Featherstone to respec.' });
      return;
    }
    if ((bird.coins || 0) < RESPEC_COST) {
      this.events.push({ type: 'respec_fail', birdId: bird.id, reason: `Need ${RESPEC_COST}c to respec. You have ${bird.coins || 0}c.` });
      return;
    }
    if (!bird.skillTreeUnlocked || bird.skillTreeUnlocked.length === 0) {
      this.events.push({ type: 'respec_fail', birdId: bird.id, reason: 'No skills to respec — skill tree is already empty.' });
      return;
    }

    // Calculate FP to refund (sum of all unlocked skill costs)
    const fpRefunded = bird.skillTreeUnlocked.reduce((sum, id) => {
      const def = SKILL_TREE_DEFS[id];
      return sum + (def ? def.cost : 0);
    }, 0);

    bird.coins -= RESPEC_COST;
    bird.skillPoints = (bird.skillPoints || 0) + fpRefunded;
    bird.skillTreeUnlocked = [];
    bird.skillTreeMaster = false;  // mastery is lost on respec
    this._saveBird(bird);

    this.events.push({
      type: 'don_respec_done',
      birdId: bird.id,
      birdName: bird.name,
      fpRefunded,
      skillPoints: bird.skillPoints,
      cost: RESPEC_COST,
    });
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
      // Gang War × Aurora: sacred sky doubles kill XP
      const auroraWarBonus = !!this.aurora;
      // Gang War × Wanted Decree: Kingpin's chaos decree supercharges war kills for 30s
      const decreeWarBonus = this.gangWarDecreeBoostUntil > now;
      // Stacking: base 150, aurora 2×, decree 2×, both 3× (150 × 2 × 1.5)
      let killXp = 150;
      if (auroraWarBonus) killXp = Math.floor(killXp * 2);
      if (decreeWarBonus) killXp = Math.floor(killXp * 1.5);
      attacker.xp += killXp;
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
        loot, auroraBonus: auroraWarBonus, decreeBonus: decreeWarBonus, xp: killXp,
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
        // Gazette: track gang war result
        if (winner) {
          this.gazetteStats.gangWarResults.push({
            winnerTag: winner.tag, loserTag: rivalGang ? rivalGang.tag : '???',
            kills: Math.max(myKills, enemyKills),
          });
        }

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
    // Weighted pool: classic events get 2 entries, new events get 1 each
    const pool = [
      'npc_flood', 'npc_flood',
      'car_frenzy', 'car_frenzy',
      'golden_rain', 'golden_rain',
      'poop_party',
      'coin_shower',
      'food_festival',
      'blackout',
      'disco_fever',
    ];
    const type = pool[Math.floor(Math.random() * pool.length)];

    const DURATIONS = {
      npc_flood: 30000, car_frenzy: 20000, golden_rain: 20000,
      poop_party: 20000, coin_shower: 25000, food_festival: 30000,
      blackout: 25000, disco_fever: 20000,
    };
    const duration = DURATIONS[type] || 20000;

    // Check for CRIME DISCO: Crime Wave + Disco Fever together
    const isCrimeDisco = (type === 'disco_fever') && !!this.crimeWave;

    if (type === 'npc_flood') {
      this.chaosEvent = { type: 'npc_flood', endsAt: now + duration, data: {} };
      for (let i = 0; i < 50; i++) {
        const areas = world.NPC_TYPES.walker.spawnAreas;
        const area = areas[Math.floor(Math.random() * areas.length)];
        const npc = {
          id: 'chaos_npc_' + uid(), type: 'walker',
          x: area.x + Math.random() * area.w, y: area.y + Math.random() * area.h,
          targetX: 0, targetY: 0,
          speed: world.NPC_TYPES.walker.speed + Math.random() * 15,
          state: 'walking', stateTimer: 0, poopedOn: 0, hasFood: Math.random() > 0.5,
        };
        this._setNPCTarget(npc);
        this.chaosEventNPCs.set(npc.id, npc);
      }
    } else if (type === 'car_frenzy') {
      this.chaosEvent = { type: 'car_frenzy', endsAt: now + duration, data: { originalSpeeds: {} } };
      for (const car of this.movingCars) {
        this.chaosEvent.data.originalSpeeds[car.id] = car.speed;
        car.speed *= 2;
      }
    } else if (type === 'golden_rain') {
      this.chaosEvent = { type: 'golden_rain', endsAt: now + duration, data: {} };
      for (let i = 0; i < 40; i++) {
        const food = {
          id: 'golden_' + uid(),
          x: 100 + Math.random() * (world.WORLD_WIDTH - 200),
          y: 100 + Math.random() * (world.WORLD_HEIGHT - 200),
          type: 'golden', value: 15, coinValue: 5, respawnAt: null, active: true, isGolden: true,
        };
        this.chaosEventFoods.set(food.id, food);
      }
    } else if (type === 'poop_party') {
      // All poop becomes mega poop for 20s — handled in _updateBird poop logic
      this.chaosEvent = { type: 'poop_party', endsAt: now + duration, data: {} };
    } else if (type === 'coin_shower') {
      // 60 glowing coin stacks auto-scatter — auto-collect within 40px
      this.chaosEvent = { type: 'coin_shower', endsAt: now + duration, data: {} };
      for (let i = 0; i < 60; i++) {
        const coinValue = 20 + Math.floor(Math.random() * 31); // 20-50c
        const food = {
          id: 'coinshower_' + uid(),
          x: 150 + Math.random() * (world.WORLD_WIDTH - 300),
          y: 150 + Math.random() * (world.WORLD_HEIGHT - 300),
          type: 'coin_shower', value: 4, coinValue, active: true, respawnAt: null,
        };
        this.chaosEventFoods.set(food.id, food);
      }
    } else if (type === 'food_festival') {
      // 40 premium foods in 4 city zones
      this.chaosEvent = { type: 'food_festival', endsAt: now + duration, data: {} };
      const festivalZones = [
        { x: 900, y: 900, w: 600, h: 500 },   // Park
        { x: 500, y: 1600, w: 400, h: 400 },  // Cafe District
        { x: 1800, y: 1100, w: 500, h: 400 }, // Downtown
        { x: 2200, y: 700, w: 400, h: 400 },  // Mall
      ];
      const festivalTypes = ['pizza', 'sandwich', 'donut', 'cake'];
      for (let i = 0; i < 40; i++) {
        const zone = festivalZones[Math.floor(Math.random() * festivalZones.length)];
        const ftype = festivalTypes[Math.floor(Math.random() * festivalTypes.length)];
        const food = {
          id: 'festival_' + uid(),
          x: zone.x + Math.random() * zone.w,
          y: zone.y + Math.random() * zone.h,
          type: ftype, isFestival: true, value: 18, coinValue: 6,
          active: true, respawnAt: null,
        };
        this.chaosEventFoods.set(food.id, food);
      }
    } else if (type === 'blackout') {
      // Pitch-dark — cops wander blindly; cursed coin hidden on minimap (handled in snapshot)
      this.chaosEvent = { type: 'blackout', endsAt: now + duration, data: {} };
    } else if (type === 'disco_fever') {
      // All NPC poop hits give 3× XP (5× + 3× coins if Crime Disco)
      this.chaosEvent = { type: 'disco_fever', endsAt: now + duration, data: { crimeDisco: isCrimeDisco } };
    }

    console.log(`[GameEngine] CHAOS EVENT: ${type.toUpperCase()}!${isCrimeDisco ? ' (CRIME DISCO!)' : ''}`);
    this.events.push({ type: 'chaos_event', chaosType: type, duration, isCrimeDisco });
  }

  _updateChaosEvent(dt, now) {
    if (!this.chaosEvent) return;

    if (now >= this.chaosEvent.endsAt) {
      const endedType = this.chaosEvent.type;
      if (endedType === 'npc_flood') {
        this.chaosEventNPCs.clear();
      } else if (endedType === 'car_frenzy') {
        for (const car of this.movingCars) {
          if (this.chaosEvent.data.originalSpeeds[car.id]) {
            car.speed = this.chaosEvent.data.originalSpeeds[car.id];
          }
        }
      } else if (endedType === 'golden_rain' || endedType === 'coin_shower' || endedType === 'food_festival') {
        this.chaosEventFoods.clear();
      }
      this.events.push({ type: 'chaos_event_end', chaosType: endedType });
      this.chaosEvent = null;
      return;
    }

    // Update chaos event NPCs (NPC Flood)
    if (this.chaosEvent.type === 'npc_flood') {
      for (const npc of this.chaosEventNPCs.values()) {
        this._updateNPC(npc, dt, now);
      }
    }

    // Car frenzy: constant honking
    if (this.chaosEvent.type === 'car_frenzy') {
      for (const car of this.movingCars) {
        if (car.honkCooldown <= 0) {
          car.honkCooldown = 1;
          this.events.push({ type: 'honk', x: car.x, y: car.y });
        }
      }
    }

    // Golden rain: press E to collect
    if (this.chaosEvent.type === 'golden_rain') {
      for (const [fId, food] of this.chaosEventFoods) {
        if (!food.active) continue;
        for (const bird of this.birds.values()) {
          if (!bird.input.e || now - bird.lastSteal <= 1000) continue;
          const dx = bird.x - food.x; const dy = bird.y - food.y;
          if (Math.sqrt(dx * dx + dy * dy) < 60) {
            food.active = false;
            this.chaosEventFoods.delete(fId);
            bird.xp += food.value;
            bird.coins += (food.coinValue || 5);
            bird.food += food.value;
            bird.totalSteals++;
            bird.lastSteal = now;
            this.events.push({ type: 'steal', birdId: bird.id, foodId: food.id, foodType: 'golden', x: food.x, y: food.y, value: food.value });
            break;
          }
        }
      }
    }

    // Coin Shower: auto-collect within 40px — no button press needed
    if (this.chaosEvent.type === 'coin_shower') {
      for (const [fId, food] of this.chaosEventFoods) {
        if (!food.active) continue;
        for (const bird of this.birds.values()) {
          const dx = bird.x - food.x; const dy = bird.y - food.y;
          if (Math.sqrt(dx * dx + dy * dy) < 40) {
            food.active = false;
            this.chaosEventFoods.delete(fId);
            bird.coins += food.coinValue;
            bird.food += food.value;
            bird.xp += 8;
            this._trackDailyProgress(bird, 'coin_shower_grab', 1);
            this.events.push({ type: 'coin_shower_collect', birdId: bird.id, birdName: bird.name, coins: food.coinValue, x: food.x, y: food.y });
            break;
          }
        }
      }
    }

    // Food Festival: auto-collect within 50px
    if (this.chaosEvent.type === 'food_festival') {
      for (const [fId, food] of this.chaosEventFoods) {
        if (!food.active) continue;
        for (const bird of this.birds.values()) {
          const dx = bird.x - food.x; const dy = bird.y - food.y;
          if (Math.sqrt(dx * dx + dy * dy) < 50) {
            food.active = false;
            this.chaosEventFoods.delete(fId);
            bird.food += food.value;
            bird.coins += food.coinValue;
            bird.xp += 12;
            this.events.push({ type: 'festival_collect', birdId: bird.id, birdName: bird.name, foodType: food.type, x: food.x, y: food.y });
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
    const effectiveCost = (bird.skillTreeUnlocked && bird.skillTreeUnlocked.includes('fence_rep'))
      ? Math.max(1, Math.floor(item.cost * 0.80))
      : item.cost;
    if (bird.coins < effectiveCost) {
      this.events.push({ type: 'blackmarket_fail', birdId: bird.id, reason: 'Not enough coins. Need ' + effectiveCost + 'c.' });
      return;
    }

    bird.coins -= effectiveCost;

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
      case 'contract_cancel':
        // Send the Bounty Hunter off-duty for 60 seconds — even if not targeting you, pocket the coin
        if (this.bountyHunter && this.bountyHunter.targetId === bird.id) {
          this.bountyHunter.state = 'off_duty';
          this.bountyHunter.offDutyUntil = now + 60000;
        }
        break;
    }

    this.events.push({ type: 'blackmarket_purchased', birdId: bird.id, itemId, itemName: item.name, cost: item.cost, emoji: item.emoji });
    console.log(`[GameEngine] 🐀 ${bird.name} bought ${item.name} for ${item.cost}c`);
  }

  // ============================================================
  // NIGHT MARKET — Aurora Bazaar (Cosmic Fish currency)
  // ============================================================
  _handleNightMarketBuy(bird, itemId, now) {
    if (!this.nightMarket) {
      this.events.push({ type: 'night_market_fail', birdId: bird.id, reason: 'The Night Market only opens during the Aurora Borealis.' });
      return;
    }
    const dx = bird.x - this.nightMarket.x;
    const dy = bird.y - this.nightMarket.y;
    if (Math.sqrt(dx * dx + dy * dy) > 110) {
      this.events.push({ type: 'night_market_fail', birdId: bird.id, reason: 'Fly closer to the Night Market stall.' });
      return;
    }
    const item = this.NIGHT_MARKET_CATALOG.find(i => i.id === itemId);
    if (!item) {
      this.events.push({ type: 'night_market_fail', birdId: bird.id, reason: 'Unknown item.' });
      return;
    }
    // Permanent items: check if already owned
    if (itemId === 'constellation_badge' && bird.constellationBadge) {
      this.events.push({ type: 'night_market_fail', birdId: bird.id, reason: 'You already bear the Constellation Badge.' });
      return;
    }
    const fishBalance = bird.cosmicFish || 0;
    if (fishBalance < item.cost) {
      this.events.push({ type: 'night_market_fail', birdId: bird.id, reason: `Need ${item.cost} Cosmic Fish. You have ${fishBalance}.` });
      return;
    }

    bird.cosmicFish = (bird.cosmicFish || 0) - item.cost;

    switch (itemId) {
      case 'stardust_cloak':
        bird.stardustCloakUntil = now + 8 * 60000;  // 8 minutes
        break;
      case 'comet_trail':
        bird.cometTrailUntil = now + 6 * 60000;     // 6 minutes
        break;
      case 'oracle_eye':
        bird.oracleEyeUntil = now + 4 * 60000;      // 4 minutes
        break;
      case 'star_power':
        bird.starPowerUntil = now + 8 * 60000;      // 8 minutes
        break;
      case 'lunar_lens':
        bird.lunarLensUntil = now + 2 * 60000;      // 2 minutes — reveals all sewer caches
        break;
      case 'constellation_badge':
        bird.constellationBadge = true;
        this.events.push({ type: 'constellation_badge_earned', birdId: bird.id, birdName: bird.name,
          gangTag: bird.gangTag || null,
          message: `🌌 ${bird.gangTag ? '[' + bird.gangTag + '] ' : ''}${bird.name} earned the Constellation Badge — the rarest cosmetic in Bird City!` });
        break;
    }

    this._saveBird(bird); // persist cosmicFish and constellationBadge
    this.events.push({ type: 'night_market_purchased', birdId: bird.id, itemId, itemName: item.name, emoji: item.emoji, cost: item.cost, cosmicFishLeft: bird.cosmicFish });
    console.log(`[GameEngine] ✨ ${bird.name} bought ${item.name} for ${item.cost} Cosmic Fish`);
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
  // PRESTIGE SYSTEM
  // ============================================================
  _handlePrestige(bird, now) {
    if (bird.xp < PRESTIGE_THRESHOLD) {
      this.events.push({ type: 'prestige_fail', birdId: bird.id, msg: `Need ${PRESTIGE_THRESHOLD.toLocaleString()} XP to prestige. You have ${bird.xp.toLocaleString()}.` });
      return;
    }
    if ((bird.prestige || 0) >= MAX_PRESTIGE) {
      this.events.push({ type: 'prestige_fail', birdId: bird.id, msg: 'Already at max prestige (⚜️×5). LEGEND status achieved.' });
      return;
    }

    bird.prestige = (bird.prestige || 0) + 1;
    bird.xp = 0;  // XP resets — coins, gang, tattoos, rep all kept
    // Recalculate type from fresh XP
    const newLevel = world.getLevelFromXP(0);
    bird.type = world.getBirdTypeForLevel(newLevel);
    bird.level = newLevel;

    const badge = PRESTIGE_BADGES[bird.prestige];
    const bonuses = [
      '',
      '+15% XP on poop hits',
      '+15% XP · +10% coins on poop hits',
      '+15% XP · +10% coins · -15% poop cooldown',
      '+15% XP · +10% coins · -15% cooldown · spawn with 50 food',
      '+20% XP · +15% coins · -20% cooldown · LEGEND STATUS',
    ];

    this.events.push({
      type: 'prestige',
      birdId: bird.id,
      birdName: bird.name,
      prestige: bird.prestige,
      badge,
      bonus: bonuses[bird.prestige],
      gangTag: bird.gangTag || null,
      gangColor: bird.gangColor || null,
    });

    this._saveBird(bird);
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
          if (dist < 42 && now - predator.lastAttack > 2000 && !(target.mcRiotShieldUntil > now)) {
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
              // Bird killed — respawn at gang nest (if available) or city center
              const coinLoss = Math.floor(target.coins * 0.35);
              target.coins = Math.max(0, target.coins - coinLoss);
              target.food = Math.max(3, Math.floor(target.food * 0.3));
              const gangNest = target.gangId ? this.gangNests.get(target.gangId) : null;
              if (gangNest && gangNest.destroyedAt === null) {
                // Respawn at gang nest with a small scatter
                target.x = gangNest.x + (Math.random() - 0.5) * 120;
                target.y = gangNest.y + (Math.random() - 0.5) * 120;
                this.events.push({ type: 'nest_respawn', birdId: target.id, birdName: target.name, x: gangNest.x, y: gangNest.y });
              } else {
                target.x = world.WORLD_WIDTH / 2 + (Math.random() - 0.5) * 300;
                target.y = world.WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 300;
              }
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

    // Find the top damage dealer — they have a 15% chance of the Eagle Feather drop
    let topDamageDealer = null;
    let topDmg = 0;
    for (const [birdId, dmg] of boss.damageByBird.entries()) {
      if (dmg > topDmg) { topDmg = dmg; topDamageDealer = birdId; }
    }

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

    // Eagle Feather drop — 15% chance for the top damage dealer
    if (topDamageDealer && Math.random() < 0.15) {
      const killer = this.birds.get(topDamageDealer);
      if (killer && !killer.eagleFeather) {
        killer.eagleFeather = true;
        this._saveBird(killer);
        this.events.push({
          type: 'eagle_feather_drop',
          birdId: killer.id,
          birdName: killer.name,
          msg: `🪶 ${killer.name} claimed the Eagle Feather! A rare trophy from the Eagle Overlord.`,
        });
        console.log(`[GameEngine] 🪶 Eagle Feather dropped for ${killer.name}!`);
      }
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
    let base = 0;
    if (level >= 5) base = 4; // 3 cops + 1 SWAT
    else if (level >= 4) base = 3; // 2 cops + 1 SWAT
    else if (level >= 3) base = 2;
    else if (level >= 2) base = 1;
    // Crime Wave: +1 extra cop at every wanted level (capped at 5 total)
    if (this.crimeWave && base > 0) base = Math.min(5, base + 1);
    return base;
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
          // Gazette: track highest wanted level reached this cycle
          if (newLevel > this.gazetteStats.mostWanted.level) {
            this.gazetteStats.mostWanted = { level: newLevel, name: bird ? bird.name : '???', gangTag: bird ? (bird.gangTag || null) : null };
          }
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
        // Crime Wave: survival XP ×2 — staying alive under hot pursuit pays double
        const survMult = this.crimeWave ? 2 : 1;
        wanted.xp += wantedLevel * 15 * survMult;
        wanted.coins += wantedLevel * 5 * survMult;
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

    // Witness Protection: clear all cops if wanted bird is protected
    const wpBird = this.birds.get(this.wantedBirdId);
    if (wpBird && wpBird.witnessProtectionUntil > now) {
      if (this.copBirds.size > 0) this.copBirds.clear();
      return;
    }

    // Royal Amnesty Decree: ALL law enforcement stands down for 45s — total lawlessness
    if (this.kingpinDecree && this.kingpinDecree.type === 'royal_amnesty') {
      if (this.copBirds.size > 0) this.copBirds.clear();
      return; // No new cops spawn during amnesty
    }

    // King's Pardon: pardoned bird is legally immune — no new cop spawns targeting them
    if (wpBird && wpBird.pardonedUntil > now) {
      if (this.copBirds.size > 0) this.copBirds.clear();
      return; // Pardoned birds are off-limits
    }

    // BLACKOUT + GHOST MODE = FULL INVISIBILITY: no new spawns, all cops go blind-wander mode
    const blackoutActive = !!(this.chaosEvent && this.chaosEvent.type === 'blackout');
    const ghostModeActive = !!(wpBird && wpBird.mcGhostModeUntil > now);
    const fullInvisCombo = blackoutActive && ghostModeActive;
    if (fullInvisCombo) {
      // Announce the combo the first tick it activates
      if (!this._blackoutGhostAnnounced) {
        this._blackoutGhostAnnounced = true;
        this.events.push({ type: 'blackout_ghost_combo', birdId: this.wantedBirdId, birdName: wpBird.name });
      }
      // All cops drift completely aimlessly and can't arrest
      for (const cop of this.copBirds.values()) {
        cop.ghostDriftAngle = (cop.ghostDriftAngle || Math.random() * Math.PI * 2) + (Math.random() - 0.5) * 1.8 * dt * 3;
        cop.x += Math.cos(cop.ghostDriftAngle) * cop.speed * 0.35 * dt;
        cop.y += Math.sin(cop.ghostDriftAngle) * cop.speed * 0.35 * dt;
        cop.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, cop.x));
        cop.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, cop.y));
      }
      return; // Skip spawning and arrest checks entirely
    }
    if (!fullInvisCombo) this._blackoutGhostAnnounced = false;

    // Count current cops (excluding stunned-for-good ones)
    const activeCops = Array.from(this.copBirds.values()).filter(c => c.targetBirdId === this.wantedBirdId);

    // Spawn more cops if needed (one every 5s max; halved during Crime Wave)
    if (activeCops.length < targetCount) {
      const lastSpawn = this._lastCopSpawn || 0;
      const spawnCooldown = this.crimeWave ? 2500 : 5000;
      if (now - lastSpawn > spawnCooldown) {
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

    // Black Market Smoke Bomb OR Mystery Crate Ghost Mode: wanted bird is invisible to cops
    const smokeActive = wanted.bmSmokeBombUntil > now || wanted.mcGhostModeUntil > now;

    for (const [copId, cop] of this.copBirds) {

      // Stunned state
      if (cop.state === 'stunned') {
        if (now >= cop.stunnedUntil) {
          cop.state = 'pursuing';
        } else {
          continue;
        }
      }

      // Bird Flu infection: cop caught an infected bird and now staggers around sick
      if (cop.state === 'flu_confused') {
        if (now >= cop.fluConfusedUntil) {
          cop.state = 'pursuing';
          cop.fluWanderAngle = undefined;
        } else {
          // Stagger around randomly — too sick to chase
          cop.fluWanderAngle = ((cop.fluWanderAngle !== undefined ? cop.fluWanderAngle : Math.random() * Math.PI * 2) + (Math.random() - 0.5) * 2.0);
          cop.x += Math.cos(cop.fluWanderAngle) * cop.speed * 0.35 * dt;
          cop.y += Math.sin(cop.fluWanderAngle) * cop.speed * 0.35 * dt;
          cop.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, cop.x));
          cop.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, cop.y));
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
      // Blackout: cops are completely blind — always wander (1.2× drift vs fog's 0.6×)
      const blackoutActive = !!(this.chaosEvent && this.chaosEvent.type === 'blackout');

      // Pursue wanted bird
      const dx = wanted.x - cop.x;
      const dy = wanted.y - cop.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (blackoutActive) {
        // Complete blindness — cops drift aimlessly in all directions
        cop.fogWanderAngle = (cop.fogWanderAngle || Math.random() * Math.PI * 2) + (Math.random() - 0.5) * 1.2 * dt * 3;
        cop.x += Math.cos(cop.fogWanderAngle) * cop.speed * 0.4 * dt;
        cop.y += Math.sin(cop.fogWanderAngle) * cop.speed * 0.4 * dt;
        cop.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, cop.x));
        cop.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, cop.y));
        continue;
      }
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

      // Ice Rink: cops slip and slide helplessly on the frozen plaza — they can't arrest anyone on the ice!
      if (this.iceRink) {
        const irDx = cop.x - this.iceRink.x;
        const irDy = cop.y - this.iceRink.y;
        if (Math.sqrt(irDx * irDx + irDy * irDy) < this.iceRink.radius) {
          // Cop is on the ice — slide in a drifting direction, lose all pursuit control
          if (cop.iceSlideAngle === undefined) cop.iceSlideAngle = Math.atan2(dy, dx);
          cop.iceSlideAngle += (Math.random() - 0.5) * 2.5 * dt * 3; // wide, erratic drift
          cop.x += Math.cos(cop.iceSlideAngle) * cop.speed * 0.75 * dt;
          cop.y += Math.sin(cop.iceSlideAngle) * cop.speed * 0.75 * dt;
          cop.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, cop.x));
          cop.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, cop.y));
          continue; // no arrest while sliding on ice!
        }
        cop.iceSlideAngle = undefined; // exited ice rink — regain traction
      }

      if (dist > 1) {
        // Crime Wave: cops are 30% faster and more aggressive
        // Blizzard: cops shiver at 75% speed — their boots weren't made for snow
        const crimeWaveSpeedMult = this.crimeWave ? 1.30 : 1.0;
        const blizzardSlowMult = (this.weather && this.weather.type === 'blizzard') ? 0.75 : 1.0;
        cop.x += (dx / dist) * cop.speed * crimeWaveSpeedMult * blizzardSlowMult * dt;
        cop.y += (dy / dist) * cop.speed * crimeWaveSpeedMult * blizzardSlowMult * dt;
        cop.rotation = Math.atan2(dy, dx);
      }

      cop.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, cop.x));
      cop.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, cop.y));

      // Arrest: cop catches wanted bird (within 18px, bird not already stunned)
      // Mystery Crate: Riot Shield blocks arrest entirely
      if (dist < 18 && wanted.stunnedUntil <= now && !(wanted.mcRiotShieldUntil > now)) {
        // Skill Tree: Ghost Walk — 18% chance to fully evade a cop arrest
        if (wanted.skillTreeUnlocked && wanted.skillTreeUnlocked.includes('ghost_walk') && Math.random() < 0.18) {
          this.events.push({ type: 'ghost_walk_evade', birdId: wanted.id, birdName: wanted.name, x: cop.x, y: cop.y });
          cop.state = 'stunned';
          cop.stunnedUntil = now + 3000;
          continue;
        }
        let arrestDuration = cop.type === 'swat' ? 4000 : 2500;
        // Skill Tree: Iron Wings — -35% stun duration from all sources
        if (wanted.skillTreeUnlocked && wanted.skillTreeUnlocked.includes('iron_wings')) {
          arrestDuration = Math.floor(arrestDuration * 0.65);
        }
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

        // Bird Flu cross-system: if the arrested bird is infected, cop catches the flu!
        // The cop immediately becomes sick and staggers around confused for 5s.
        // This creates a beautiful counter-play: being infected is actually a WEAPON against cops.
        if (wanted.fluUntil > now) {
          cop.state = 'flu_confused';
          cop.fluConfusedUntil = now + 5000;
          cop.fluWanderAngle = undefined;
          this.events.push({
            type: 'flu_cop_infected',
            birdId: wanted.id, birdName: wanted.name,
            copType: cop.type,
            x: cop.x, y: cop.y,
          });
        } else {
          // Normal: after arrest cop goes off-duty for 8s
          cop.state = 'stunned';
          cop.stunnedUntil = now + 8000;
        }
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
    // Gazette: track heist completions
    this.gazetteStats.heistCount++;

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
    // Gazette: track bank heist completions
    this.gazetteStats.bankHeistCount++;

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

      // ── BOOST GATE detection (available to ALL birds during a race) ─────
      // Prune expired cooldowns to keep the map tidy
      for (const [key, exp] of race.boostGateCooldowns) {
        if (exp <= now) race.boostGateCooldowns.delete(key);
      }
      for (const gate of this.RACE_BOOST_GATES) {
        for (const b of this.birds.values()) {
          const cooldownKey = `${gate.id}_${b.id}`;
          if ((race.boostGateCooldowns.get(cooldownKey) || 0) > now) continue;
          const dx = b.x - gate.x;
          const dy = b.y - gate.y;
          if (dx * dx + dy * dy <= 45 * 45) {
            b.raceBoostUntil = now + 2500;
            race.boostGateCooldowns.set(cooldownKey, now + 18000); // 18s per-bird cooldown
            this.events.push({
              type: 'race_boost_gate',
              birdId: b.id,
              birdName: b.name,
              gateId: gate.id,
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
        race.boostGateCooldowns.clear();
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
  // WEATHER BETTING
  // ============================================================
  _handleWeatherBet(bird, action, now) {
    const wb = this.weatherBetting;
    if (!wb || now >= wb.openUntil) {
      this.events.push({ type: 'weather_bet_fail', birdId: bird.id, reason: 'no_window' });
      return;
    }
    if (wb.bets.has(bird.id)) {
      this.events.push({ type: 'weather_bet_fail', birdId: bird.id, reason: 'already_bet' });
      return;
    }
    const VALID_TYPES = ['rain', 'wind', 'storm', 'fog', 'hailstorm', 'heatwave', 'tornado', 'blizzard'];
    if (!VALID_TYPES.includes(action.betType)) {
      this.events.push({ type: 'weather_bet_fail', birdId: bird.id, reason: 'invalid_type' });
      return;
    }
    const amount = typeof action.amount === 'number' ? Math.floor(action.amount) : 0;
    if (amount < 10 || amount > 300) {
      this.events.push({ type: 'weather_bet_fail', birdId: bird.id, reason: 'invalid_amount' });
      return;
    }
    if (bird.coins < amount) {
      this.events.push({ type: 'weather_bet_fail', birdId: bird.id, reason: 'no_coins' });
      return;
    }

    bird.coins -= amount;
    wb.bets.set(bird.id, { type: action.betType, amount, name: bird.name });

    // Build typeAmounts for all clients
    const typeAmounts = {};
    for (const bet of wb.bets.values()) {
      typeAmounts[bet.type] = (typeAmounts[bet.type] || 0) + bet.amount;
    }

    this.events.push({
      type: 'weather_bet_placed',
      birdId: bird.id,
      birdName: bird.name,
      betType: action.betType,
      amount,
      typeAmounts,
      totalBets: wb.bets.size,
    });
  }

  _resolveWeatherBets(actualType) {
    const wb = this.weatherBetting;
    if (!wb || wb.bets.size === 0) return;

    const winBets = [...wb.bets.entries()].filter(([, b]) => b.type === actualType);
    const loseBets = [...wb.bets.entries()].filter(([, b]) => b.type !== actualType);
    const totalPool = [...wb.bets.values()].reduce((s, b) => s + b.amount, 0);

    const results = [];

    if (winBets.length === 0) {
      // Nobody guessed right — full refund
      for (const [bid, bet] of wb.bets) {
        const b = this.birds.get(bid);
        if (b) b.coins += bet.amount;
        results.push({ birdId: bid, birdName: bet.name, betType: bet.type, amount: bet.amount, payout: bet.amount, won: false, refund: true });
      }
      this.events.push({ type: 'weather_bet_results', actualType, noWinners: true, totalPool, results });
      return;
    }

    const totalWinAmount = winBets.reduce((s, [, b]) => s + b.amount, 0);

    for (const [bid, bet] of winBets) {
      // Each winner gets proportional share of the full pool (minimum 1.5×)
      const payout = Math.max(Math.floor(bet.amount * 1.5), Math.floor(totalPool * bet.amount / totalWinAmount));
      const b = this.birds.get(bid);
      if (b) {
        b.coins += payout;
        b.xp = (b.xp || 0) + 50;
      }
      results.push({ birdId: bid, birdName: bet.name, betType: bet.type, amount: bet.amount, payout, won: true });
    }
    for (const [bid, bet] of loseBets) {
      // Losers already had coins deducted
      results.push({ birdId: bid, birdName: bet.name, betType: bet.type, amount: bet.amount, payout: 0, won: false, refund: false });
    }

    this.events.push({ type: 'weather_bet_results', actualType, noWinners: false, totalPool, results });
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

            this.gazetteStats.eggsDelivered.push({ name: carrier.name, gangTag: carrier.gangTag || null });
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
        const champShield = !!richestBird.royaleChampBadge;
        this.kingpin = {
          birdId: richestBird.id,
          birdName: richestBird.name,
          coins: richestBird.coins,
          crownedAt: now,
          hitCount: new Map(),
          lastPassiveReward: now,
          champShieldActive: champShield, // Royale Champion absorbs the FIRST dethronement hit
          decreesAvailable: (richestBird.prestige >= 5) ? 2 : 1, // P5 LEGEND Kingpins get 2 decrees!
        };
        this.gazetteStats.kingpinCount++;
        this.events.push({
          type: 'kingpin_crowned',
          birdId: richestBird.id,
          birdName: richestBird.name,
          coins: richestBird.coins,
          champShield: champShield,
          isLegend: richestBird.prestige >= 5,
        });
      } else if (this.kingpin.birdId !== richestBird.id) {
        // Richer bird is now online — crown passes automatically (bloodless transfer)
        const oldName = this.kingpin.birdName;
        const champShield = !!richestBird.royaleChampBadge;
        this.kingpin = {
          birdId: richestBird.id,
          birdName: richestBird.name,
          coins: richestBird.coins,
          crownedAt: now,
          hitCount: new Map(),
          lastPassiveReward: now,
          champShieldActive: champShield,
          decreesAvailable: (richestBird.prestige >= 5) ? 2 : 1, // P5 LEGEND gets 2 decrees!
        };
        this.gazetteStats.kingpinCount++;
        this.events.push({
          type: 'kingpin_crowned',
          birdId: richestBird.id,
          birdName: richestBird.name,
          coins: richestBird.coins,
          oldKingpin: oldName,
          champShield: champShield,
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

  // ============================================================
  // ROYAL COURT SYSTEM
  // Top-3 richest birds (excluding the Kingpin) earn noble titles.
  // Each earns +10c passive tribute every 30s. Visible on nametags.
  // ============================================================

  _updateRoyalCourt(now) {
    if (now - this.royalCourtCheckTimer < 5000) return;
    this.royalCourtCheckTimer = now;

    const TITLES = ['Duke', 'Baron', 'Count'];
    const MIN_COINS = 100;

    // Find top-3 richest non-Kingpin, non-AFK birds with >= 100 coins
    const candidates = [];
    for (const b of this.birds.values()) {
      if (b.inNest) continue;
      if (this.kingpin && b.id === this.kingpin.birdId) continue;
      if (b.coins >= MIN_COINS) candidates.push(b);
    }
    candidates.sort((a, b) => b.coins - a.coins);
    const topThree = candidates.slice(0, 3);

    const newCourt = topThree.map((b, i) => {
      const existing = this.royalCourt.find(m => m.birdId === b.id);
      return {
        birdId: b.id,
        birdName: b.name,
        gangTag: b.gangTag || null,
        gangColor: b.gangColor || null,
        prestige: b.prestige || 0,
        title: TITLES[i],
        coins: b.coins,
        lastTribute: existing ? existing.lastTribute : now,
      };
    });

    // Fire events for newly titled birds or title changes
    for (const nm of newCourt) {
      const old = this.royalCourt.find(m => m.birdId === nm.birdId);
      if (!old || old.title !== nm.title) {
        this.events.push({
          type: 'court_titled',
          birdId: nm.birdId,
          birdName: nm.birdName,
          gangTag: nm.gangTag,
          title: nm.title,
        });
      }
    }

    // Fire events for birds who LOST their title
    for (const old of this.royalCourt) {
      if (!newCourt.find(m => m.birdId === old.birdId)) {
        this.events.push({
          type: 'court_lost_title',
          birdId: old.birdId,
          birdName: old.birdName,
          title: old.title,
        });
      }
    }

    this.royalCourt = newCourt;

    // Passive tribute: +10 coins every 30s per court member
    for (const member of this.royalCourt) {
      const b = this.birds.get(member.birdId);
      if (!b) continue;
      if (now - member.lastTribute >= 30000) {
        b.coins += 10;
        member.coins = b.coins;
        member.lastTribute = now;
        this.events.push({
          type: 'court_tribute',
          birdId: b.id,
          birdName: b.name,
          title: member.title,
          amount: 10,
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

    // === PEOPLE'S REVOLT — check if we're in the Tax Day rage window ===
    if (this.kingpin.revoltWindowUntil && now < this.kingpin.revoltWindowUntil) {
      if (!this.kingpin.revoltParticipants) this.kingpin.revoltParticipants = new Set();
      this.kingpin.revoltParticipants.add(attacker.id);
      const revolters = this.kingpin.revoltParticipants.size;
      this.events.push({
        type: 'revolt_progress',
        attackerName: attacker.name,
        revolters,
        needed: 3,
        kingpinName: this.kingpin.birdName,
      });
      if (revolters >= 3) {
        this._triggerPeoplesRevolt(now);
        return; // Done — kingpin is gone
      }
    }

    // === ROYALE CHAMPION SHIELD — absorbs the very first dethronement hit ===
    // If the kingpin won Bird Royale this session, they get one free pass
    if (count === 1 && this.kingpin.champShieldActive) {
      this.kingpin.champShieldActive = false;
      // Reset this attacker's hit count — the hit bounced off
      this.kingpin.hitCount.set(attacker.id, 0);
      this.events.push({
        type: 'champ_shield_broke',
        kingpinName: this.kingpin.birdName,
        attackerName: attacker.name,
        kingpinId: this.kingpin.birdId,
      });
      // Still give the small bonus (the hit landed, shield just absorbed the dethrone progress)
      return;
    }

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

    // === DETHRONEMENT POOL PAYOUT ===
    // If the pool has funds, the dethroner gets the entire pool as a bonus!
    let poolPayout = 0;
    if (this.dethronementPool.total > 0) {
      poolPayout = this.dethronementPool.total;
      attacker.coins += poolPayout;
      attacker.xp += Math.floor(poolPayout * 1.5); // bonus XP scales with pool size
      this.dethronementPool.lastPaidTo = { name: attacker.name, amount: poolPayout };
      this.dethronementPool.total = 0;
      this.dethronementPool.topDonor = null;
      this.events.push({
        type: 'pool_paid_out',
        winnerName: attacker.name,
        amount: poolPayout,
        loot: lootAmount,
      });
    }

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
      poolPayout,
      reason: 'defeated',
    });

    // Trigger screen shake for all players via a shockwave event
    this.events.push({ type: 'kingpin_topple_shockwave', x: kBird ? kBird.x : 1500, y: kBird ? kBird.y : 1500 });

    // Immediately check for new kingpin
    this.kingpinCheckTimer = 0;
    this._updateKingpin(now);
  }

  // ============================================================
  // ROYAL DECREE SYSTEM
  // ============================================================

  _handleRoyalDecree(bird, decreeType, now) {
    const VALID_DECREES = ['gold_rush', 'wanted_decree', 'royal_amnesty', 'tax_day', 'kings_pardon'];
    if (!VALID_DECREES.includes(decreeType)) return;

    // Must be the current Kingpin
    if (!this.kingpin || this.kingpin.birdId !== bird.id) {
      this.events.push({ type: 'decree_fail', birdId: bird.id, reason: 'not_kingpin' });
      return;
    }
    // Must have a decree available
    if (!this.kingpin.decreesAvailable || this.kingpin.decreesAvailable < 1) {
      this.events.push({ type: 'decree_fail', birdId: bird.id, reason: 'already_used' });
      return;
    }
    // Can't issue while another decree is already active
    if (this.kingpinDecree) {
      this.events.push({ type: 'decree_fail', birdId: bird.id, reason: 'already_active' });
      return;
    }

    // Consume the decree
    this.kingpin.decreesAvailable = 0;

    const DECREE_DURATIONS = {
      gold_rush: 60000,
      wanted_decree: 0,       // instant effect
      royal_amnesty: 45000,
      tax_day: 0,             // instant effect
      kings_pardon: 0,        // instant effect
    };

    const duration = DECREE_DURATIONS[decreeType];
    if (duration > 0) {
      this.kingpinDecree = { type: decreeType, endsAt: now + duration, kingpinId: bird.id, kingpinName: bird.name };
    }

    // === IMMEDIATE EFFECTS ===

    if (decreeType === 'wanted_decree') {
      // Add 20 heat to every online bird EXCEPT the Kingpin — chaos erupts
      let targetCount = 0;
      for (const b of this.birds.values()) {
        if (b.id === bird.id || b.inNest) continue;
        this._addHeat(b.id, 20);
        // Track for "Subject" daily challenge — affected by a decree
        if (!b._decreeTypesSeen) b._decreeTypesSeen = new Set();
        if (!b._decreeTypesSeen.has('wanted_decree')) {
          b._decreeTypesSeen.add('wanted_decree');
          this._trackDailyProgress(b, 'decree_affected', 1);
        }
        targetCount++;
      }
      this.events.push({ type: 'decree_wanted_zap', kingpinName: bird.name, targetCount });

      // === CROSS-SYSTEM: Wanted Decree × Gang War — doubles gang war kill XP for 30s ===
      const gangWarActive = Array.from(this.gangs.values()).some(g => g.warWithGangId && now < g.warEndsAt);
      if (gangWarActive) {
        this.gangWarDecreeBoostUntil = now + 30000;
        this.events.push({ type: 'gang_war_decree_boost', kingpinName: bird.name, duration: 30 });
      }
    }

    if (decreeType === 'tax_day') {
      // Collect 10% of every bird's coins (min 5c, max 100c) for the Kingpin
      let totalCollected = 0;
      for (const b of this.birds.values()) {
        if (b.id === bird.id || b.inNest) continue;
        const take = Math.min(100, Math.max(5, Math.floor(b.coins * 0.10)));
        if (b.coins >= take) {
          b.coins -= take;
          totalCollected += take;
          this.events.push({ type: 'decree_taxed', birdId: b.id, birdName: b.name, amount: take });
          // Track for "Subject" daily challenge
          if (!b._decreeTypesSeen) b._decreeTypesSeen = new Set();
          if (!b._decreeTypesSeen.has('tax_day')) {
            b._decreeTypesSeen.add('tax_day');
            this._trackDailyProgress(b, 'decree_affected', 1);
          }
        }
      }
      bird.coins += totalCollected;
      this.events.push({ type: 'decree_tax_collected', kingpinId: bird.id, kingpinName: bird.name, total: totalCollected });

      // === PEOPLE'S REVOLT — Tax Day opens a 15-second rage window ===
      // If 3+ different birds each poop the Kingpin during this window → OVERTHROW
      this.kingpin.revoltWindowUntil = now + 15000;
      this.kingpin.revoltParticipants = new Set();
      this.events.push({ type: 'revolt_window_start', kingpinName: bird.name, kingpinId: bird.id, windowMs: 15000 });
    }

    if (decreeType === 'gold_rush') {
      // === CROSS-SYSTEM: Gold Rush × Crime Wave — announce the 4× stacked combo ===
      if (this.crimeWave) {
        this.events.push({ type: 'gold_rush_crime_wave_combo', kingpinName: bird.name });
      }
      // Track for "Subject" daily challenge — gold rush helps all birds
      for (const b of this.birds.values()) {
        if (b.id === bird.id || b.inNest) continue;
        if (!b._decreeTypesSeen) b._decreeTypesSeen = new Set();
        if (!b._decreeTypesSeen.has('gold_rush')) {
          b._decreeTypesSeen.add('gold_rush');
          this._trackDailyProgress(b, 'decree_affected', 1);
        }
      }
    }

    if (decreeType === 'royal_amnesty') {
      // Track for "Subject" daily challenge — amnesty helps all birds
      for (const b of this.birds.values()) {
        if (b.id === bird.id || b.inNest) continue;
        if (!b._decreeTypesSeen) b._decreeTypesSeen = new Set();
        if (!b._decreeTypesSeen.has('royal_amnesty')) {
          b._decreeTypesSeen.add('royal_amnesty');
          this._trackDailyProgress(b, 'decree_affected', 1);
        }
      }
    }

    if (decreeType === 'kings_pardon') {
      // Find the bird with the highest heat (most wanted) among online non-Kingpin birds
      let pardoned = null;
      let highestHeat = 0;
      for (const b of this.birds.values()) {
        if (b.id === bird.id || b.inNest) continue;
        const heat = this.heatScores.get(b.id) || 0;
        if (heat > highestHeat) { highestHeat = heat; pardoned = b; }
      }
      if (!pardoned || highestHeat <= 0) {
        // No criminals to pardon — refund the decree
        this.kingpin.decreesAvailable = 1;
        this.events.push({ type: 'decree_fail', birdId: bird.id, reason: 'no_criminals' });
        return;
      }

      // Clear the pardoned bird's heat entirely
      this.heatScores.delete(pardoned.id);

      // Despawn all cops targeting them
      for (const [copId, cop] of this.copBirds) {
        if (cop.targetBirdId === pardoned.id) {
          this.copBirds.delete(copId);
        }
      }

      // Bounty Hunter stands down if targeting them
      if (this.bountyHunter && this.bountyHunter.targetId === pardoned.id) {
        this.bountyHunter.state = 'off_duty';
        this.bountyHunter.offDutyUntil = now + 120000;
      }

      // Cancel any active hit contracts on them
      if (this.activeHits.has(pardoned.id)) {
        this.activeHits.delete(pardoned.id);
        this.events.push({ type: 'hit_cancelled', targetId: pardoned.id, reason: 'pardoned' });
      }

      // Grant 3-minute pardon protection (cops won't respawn for them)
      pardoned.pardonedUntil = now + 180000;

      this.events.push({
        type: 'kings_pardon_issued',
        kingpinId: bird.id,
        kingpinName: bird.name,
        pardonedId: pardoned.id,
        pardonedName: pardoned.name,
        clearedHeat: highestHeat,
      });
    }

    // City-wide decree announcement
    this.events.push({
      type: 'royal_decree_issued',
      decreeType,
      kingpinId: bird.id,
      kingpinName: bird.name,
      gangTag: bird.gangTag || null,
      duration,
    });

    // Gazette tracking
    if (!this.gazetteStats.royalDecrees) this.gazetteStats.royalDecrees = [];
    this.gazetteStats.royalDecrees.push({ type: decreeType, kingpinName: bird.name });
  }

  _updateKingpinDecree(now) {
    if (!this.kingpinDecree) return;
    if (now >= this.kingpinDecree.endsAt) {
      const ended = this.kingpinDecree;
      this.kingpinDecree = null;
      this.events.push({ type: 'royal_decree_expired', decreeType: ended.type, kingpinName: ended.kingpinName });
    }
  }

  // Tick the People's Revolt window — if it expires without enough revolters, announce failure
  _tickRevoltWindow(now) {
    if (!this.kingpin || !this.kingpin.revoltWindowUntil) return;
    if (now > this.kingpin.revoltWindowUntil) {
      const count = this.kingpin.revoltParticipants ? this.kingpin.revoltParticipants.size : 0;
      if (count > 0 && count < 3) {
        this.events.push({ type: 'revolt_failed', count, needed: 3 });
      }
      this.kingpin.revoltWindowUntil = null;
      this.kingpin.revoltParticipants = null;
    }
  }

  // THE PEOPLE'S REVOLT — 3+ birds hit the Kingpin during the Tax Day rage window
  _triggerPeoplesRevolt(now) {
    if (!this.kingpin) return;
    const kBird = this.birds.get(this.kingpin.birdId);

    // Gather all alive revolt participants
    const participants = [...(this.kingpin.revoltParticipants || [])]
      .map(id => this.birds.get(id))
      .filter(b => b != null);

    // People's March upgrade: 5+ unique participants = 60% loot (the mob justice bonus)
    const isPeoplesMarch = participants.length >= 5;
    const lootPct = isPeoplesMarch ? 0.60 : 0.40;
    const xpBonus = isPeoplesMarch ? 350 : 250;

    // Kingpin loses 40% (or 60% if The People's March fires) of coins
    let totalLoot = 0;
    if (kBird) {
      totalLoot = Math.min(isPeoplesMarch ? 1200 : 800, Math.max(100, Math.floor(kBird.coins * lootPct)));
      kBird.coins = Math.max(0, kBird.coins - totalLoot);
      kBird.stunnedUntil = now + 3000;
      kBird.comboCount = 0;
    }

    // Split loot equally among all revolt participants
    const lootShare = participants.length > 0 ? Math.floor(totalLoot / participants.length) : 0;
    const participantNames = [];
    for (const p of participants) {
      p.coins += lootShare;
      p.xp += xpBonus;
      participantNames.push(p.name);
      this._trackDailyProgress(p, 'revolt_participant', 1);
      // Check level-up
      const newLevel = world.getLevelFromXP(p.xp);
      if (newLevel !== p.level) {
        p.level = newLevel;
        p.type = world.getBirdTypeForLevel(newLevel);
        this.events.push({ type: 'evolve', birdId: p.id, name: p.name, birdType: p.type });
      }
    }

    // Dethronement pool splits among all participants too
    let poolShare = 0;
    if (this.dethronementPool.total > 0 && participants.length > 0) {
      poolShare = Math.floor(this.dethronementPool.total / participants.length);
      for (const p of participants) p.coins += poolShare;
      this.dethronementPool.lastPaidTo = { name: `THE PEOPLE (${participants.length} birds)`, amount: this.dethronementPool.total };
      this.dethronementPool.total = 0;
      this.dethronementPool.topDonor = null;
    }

    const kingpinName = this.kingpin.birdName;
    const kingpinPos = { x: kBird ? kBird.x : 1500, y: kBird ? kBird.y : 1500 };

    // Clear revolt state and dethrone
    this.kingpin.revoltWindowUntil = null;
    this.kingpin.revoltParticipants = null;
    this.kingpin = null;

    this.events.push({
      type: 'peoples_revolt',
      kingpinName,
      participantNames,
      totalLoot,
      lootShare,
      poolShare,
      isPeoplesMarch,
    });

    // Epic screen shake for everyone
    this.events.push({ type: 'kingpin_topple_shockwave', x: kingpinPos.x, y: kingpinPos.y });

    // Gazette tracking
    this.gazetteStats.peoplesRevolt = { kingpinName, participantNames, isPeoplesMarch };

    // Immediately check for new kingpin
    this.kingpinCheckTimer = 0;
    this._updateKingpin(now);
  }

  _handlePoolContribute(bird, amount, now) {
    // Validate: must be a number, min 10c, max 500c, bird must have enough
    amount = Math.floor(Number(amount));
    if (!isFinite(amount) || amount < 10) return;
    amount = Math.min(amount, 500);
    if (bird.coins < amount) return;

    // Can't contribute if no Kingpin exists (no target to dethrone)
    if (!this.kingpin) {
      this.events.push({ type: 'pool_error', birdId: bird.id, msg: 'No Kingpin on the throne — wait for someone to take the crown!' });
      return;
    }
    // Can't contribute if YOU are the Kingpin
    if (this.kingpin.birdId === bird.id) {
      this.events.push({ type: 'pool_error', birdId: bird.id, msg: "You can't put a bounty on yourself!" });
      return;
    }

    bird.coins -= amount;
    this.dethronementPool.total += amount;

    // Track biggest donor
    if (!this.dethronementPool.topDonor || amount > this.dethronementPool.topDonor.amount) {
      this.dethronementPool.topDonor = { name: bird.name, amount };
    }

    this.events.push({
      type: 'pool_contributed',
      birdId: bird.id,
      birdName: bird.name,
      amount,
      poolTotal: this.dethronementPool.total,
    });
  }

  // ============================================================
  // WITNESS PROTECTION PROGRAM
  // ============================================================

  _handleWitnessProtection(bird, now) {
    const COST = 500;
    const DURATION = 3 * 60 * 1000;    // 3 minutes
    const COOLDOWN = 10 * 60 * 1000;   // 10 minute cooldown between uses

    // Must be near City Hall
    const ch = this.CITY_HALL_POS;
    const dx = bird.x - ch.x;
    const dy = bird.y - ch.y;
    if (Math.sqrt(dx * dx + dy * dy) > ch.radius * 1.4) {
      this.events.push({ type: 'wp_fail', birdId: bird.id, msg: 'Must be near City Hall to enter Witness Protection.' });
      return;
    }

    // Cooldown check
    if (now < bird.witnessProtectionCooldown) {
      const secsLeft = Math.ceil((bird.witnessProtectionCooldown - now) / 1000);
      this.events.push({ type: 'wp_fail', birdId: bird.id, msg: `Witness Protection on cooldown — ${secsLeft}s remaining.` });
      return;
    }

    // Already in WP
    if (bird.witnessProtectionUntil > now) {
      this.events.push({ type: 'wp_fail', birdId: bird.id, msg: 'You are already in Witness Protection!' });
      return;
    }

    // Cost check
    if (bird.coins < COST) {
      this.events.push({ type: 'wp_fail', birdId: bird.id, msg: `Not enough coins — costs ${COST}c.` });
      return;
    }

    // Apply effects
    bird.coins -= COST;
    bird.witnessProtectionUntil = now + DURATION;
    bird.witnessProtectionCooldown = now + COOLDOWN;

    // Clear all heat — enter the program clean
    this.heatScores.delete(bird.id);

    // Despawn cops targeting this bird
    if (this.wantedBirdId === bird.id) {
      this.wantedBirdId = null;
      this.copBirds.clear();
    } else {
      for (const [cid, cop] of this.copBirds) {
        if (cop.targetBirdId === bird.id) this.copBirds.delete(cid);
      }
    }

    // Send Bounty Hunter off-duty for the full WP duration
    if (this.bountyHunter && this.bountyHunter.targetId === bird.id) {
      this.bountyHunter.state = 'off_duty';
      this.bountyHunter.offDutyUntil = bird.witnessProtectionUntil;
    }

    // Wipe active hit contracts on this bird (they can't be fulfilled while in WP)
    if (this.activeHits.has(bird.id)) {
      this.activeHits.delete(bird.id);
    }

    this.events.push({
      type: 'witness_protection_active',
      birdId: bird.id,
      birdName: bird.name,
      expiresAt: bird.witnessProtectionUntil,
    });

    console.log(`[GameEngine] 🛡 ${bird.name} entered Witness Protection for 3 min (-${COST}c)`);
  }

  // ============================================================
  // GANG NESTS — persistent home bases for criminal crews
  // ============================================================

  async _loadGangNests() {
    try {
      const allNests = await firestoreDb.getAllGangNests();
      for (const n of allNests) {
        this.gangNests.set(n.gangId, {
          gangId: n.gangId,
          gangTag: n.gangTag,
          gangColor: n.gangColor,
          ownerId: n.ownerId,
          ownerName: n.ownerName,
          x: n.x,
          y: n.y,
          hp: n.hp,
          maxHp: n.maxHp,
          auraLastAt: 0,
          builtAt: n.builtAt,
          destroyedAt: n.destroyedAt,
          rebuildAvailableAt: n.rebuildAvailableAt,
        });
      }
      console.log(`[GameEngine] Loaded ${this.gangNests.size} gang nests from Firestore`);
    } catch (e) {
      console.log('[GameEngine] No gang nests to load:', e.message);
    }
  }

  _saveGangNest(nest) {
    firestoreDb.upsertGangNest({
      gangId: nest.gangId,
      gangTag: nest.gangTag,
      gangColor: nest.gangColor,
      ownerId: nest.ownerId,
      ownerName: nest.ownerName,
      x: nest.x,
      y: nest.y,
      hp: nest.hp,
      maxHp: nest.maxHp,
      builtAt: nest.builtAt,
      destroyedAt: nest.destroyedAt,
      rebuildAvailableAt: nest.rebuildAvailableAt,
    }).catch(e => console.error('[GameEngine] Failed to save nest:', e.message));
  }

  _handleNestBuild(bird, now) {
    if (!bird.gangId || bird.gangRole !== 'leader') {
      this.events.push({ type: 'nest_error', birdId: bird.id, msg: 'Only gang leaders can build a nest.' });
      return;
    }
    if (bird.coins < 400) {
      this.events.push({ type: 'nest_error', birdId: bird.id, msg: 'You need 400 coins to build a nest.' });
      return;
    }

    const existing = this.gangNests.get(bird.gangId);
    if (existing) {
      if (existing.destroyedAt === null) {
        this.events.push({ type: 'nest_error', birdId: bird.id, msg: 'Your gang already has a nest!' });
        return;
      }
      // Destroyed nest — check rebuild cooldown
      if (existing.rebuildAvailableAt && now < existing.rebuildAvailableAt) {
        const secsLeft = Math.ceil((existing.rebuildAvailableAt - now) / 1000);
        this.events.push({ type: 'nest_error', birdId: bird.id, msg: `Rebuild available in ${secsLeft}s. Lay low.` });
        return;
      }
    }

    // Keep nests away from predator territories (so hawk/cat zones stay clean)
    const hawkZone = world.PREDATOR_TERRITORIES.hawk;
    const catZone = world.PREDATOR_TERRITORIES.cat;
    if ((bird.x > hawkZone.x && bird.x < hawkZone.x + hawkZone.w && bird.y > hawkZone.y && bird.y < hawkZone.y + hawkZone.h) ||
        (bird.x > catZone.x && bird.x < catZone.x + catZone.w && bird.y > catZone.y && bird.y < catZone.y + catZone.h)) {
      this.events.push({ type: 'nest_error', birdId: bird.id, msg: "Can't build in predator territory!" });
      return;
    }

    bird.coins -= 400;
    const gang = this.gangs.get(bird.gangId);
    const nest = {
      gangId: bird.gangId,
      gangTag: bird.gangTag,
      gangColor: bird.gangColor,
      ownerId: bird.id,
      ownerName: bird.name,
      x: bird.x,
      y: bird.y,
      hp: 80,
      maxHp: 80,
      auraLastAt: 0,
      builtAt: now,
      destroyedAt: null,
      rebuildAvailableAt: null,
    };
    this.gangNests.set(bird.gangId, nest);
    this._saveGangNest(nest);

    this.events.push({
      type: 'nest_built',
      gangId: bird.gangId,
      gangTag: bird.gangTag,
      gangColor: bird.gangColor,
      gangName: gang ? gang.name : '',
      birdId: bird.id,
      birdName: bird.name,
      x: nest.x,
      y: nest.y,
    });
  }

  _handleNestPoopHit(attacker, nest, isMegaPoop, now) {
    const damage = isMegaPoop ? 24 : 8;
    nest.hp = Math.max(0, nest.hp - damage);

    // Small XP reward for raiding
    const xpGain = isMegaPoop ? 20 : 8;
    attacker.xp += xpGain;
    attacker.coins += 4;

    this.events.push({
      type: 'nest_hit',
      gangId: nest.gangId,
      gangTag: nest.gangTag,
      gangColor: nest.gangColor,
      attackerId: attacker.id,
      attackerName: attacker.name,
      damage,
      hp: nest.hp,
      maxHp: nest.maxHp,
      x: nest.x,
      y: nest.y,
    });

    if (nest.hp <= 0) {
      nest.destroyedAt = now;
      nest.rebuildAvailableAt = now + 480000; // 8 minute rebuild cooldown
      this._saveGangNest(nest);

      // Big reward for destroying a nest
      attacker.xp += 150;
      attacker.coins += 80;
      const attackerGang = attacker.gangId ? this.gangs.get(attacker.gangId) : null;
      const defenderGang = this.gangs.get(nest.gangId);

      this.events.push({
        type: 'nest_destroyed',
        gangId: nest.gangId,
        gangTag: nest.gangTag,
        gangColor: nest.gangColor,
        gangName: defenderGang ? defenderGang.name : nest.gangTag,
        attackerId: attacker.id,
        attackerName: attacker.name,
        attackerGangTag: attacker.gangTag || null,
        attackerGangColor: attacker.gangColor || null,
        x: nest.x,
        y: nest.y,
      });
    } else {
      this._saveGangNest(nest);
    }
  }

  _tickGangNests(now) {
    for (const [gangId, nest] of this.gangNests) {
      if (nest.destroyedAt !== null) continue; // destroyed nests don't aura

      // XP/coin aura: every 15s, reward nearby gang members
      if (now - nest.auraLastAt > 15000) {
        nest.auraLastAt = now;
        const gang = this.gangs.get(gangId);
        if (!gang) continue;
        const auraRewards = [];
        for (const memberId of gang.members) {
          const member = this.birds.get(memberId);
          if (!member) continue;
          if (member.inSewer) continue;
          const dx = member.x - nest.x;
          const dy = member.y - nest.y;
          if (Math.sqrt(dx * dx + dy * dy) < 130) {
            member.xp += 15;
            member.coins += 5;
            auraRewards.push({ birdId: member.id, birdName: member.name });
          }
        }
        if (auraRewards.length > 0) {
          this.events.push({
            type: 'nest_aura',
            gangId,
            gangTag: nest.gangTag,
            gangColor: nest.gangColor,
            x: nest.x,
            y: nest.y,
            rewards: auraRewards,
          });
        }
      }
    }
  }

  // ============================================================
  // MYSTERY CRATE AIRDROP
  // ============================================================
  _tickMysteryCrate(now) {
    // Spawn new crate if timer is up and no crate active
    if (!this.mysteryCrate && now >= this.mysteryCrateTimer && this.birds.size > 0) {
      this._spawnMysteryCrate(now);
    }

    if (!this.mysteryCrate) return;

    // Check expiry (90-second window)
    if (now >= this.mysteryCrate.expiresAt) {
      this.events.push({ type: 'mystery_crate_expired', x: this.mysteryCrate.x, y: this.mysteryCrate.y });
      this.mysteryCrate = null;
      this.mysteryCrateTimer = now + this._randomRange(720000, 960000);
      return;
    }

    // Auto-collect: first bird within 45px claims the crate
    for (const bird of this.birds.values()) {
      if (bird.stunnedUntil > now) continue;
      if (bird.inSewer) continue;
      const dx = bird.x - this.mysteryCrate.x;
      const dy = bird.y - this.mysteryCrate.y;
      if (Math.sqrt(dx * dx + dy * dy) < 45) {
        this._claimMysteryCrate(bird, now);
        return;
      }
    }
  }

  _spawnMysteryCrate(now) {
    const locations = this.MYSTERY_CRATE_SPAWN_LOCATIONS;
    const loc = locations[Math.floor(Math.random() * locations.length)];
    // Small random offset so it's not always the exact same pixel
    const x = loc.x + (Math.random() - 0.5) * 160;
    const y = loc.y + (Math.random() - 0.5) * 160;
    this.mysteryCrate = {
      id: 'mc_' + uid(),
      x: Math.max(50, Math.min(world.WORLD_WIDTH - 50, x)),
      y: Math.max(50, Math.min(world.WORLD_HEIGHT - 50, y)),
      spawnedAt: now,
      expiresAt: now + 90000,  // 90 seconds to claim
    };
    this.events.push({
      type: 'mystery_crate_spawn',
      x: this.mysteryCrate.x,
      y: this.mysteryCrate.y,
      expiresAt: this.mysteryCrate.expiresAt,
    });
  }

  _claimMysteryCrate(bird, now) {
    const crate = this.mysteryCrate;
    this.mysteryCrate = null;
    this.mysteryCrateTimer = now + this._randomRange(720000, 960000);

    // Pick a random item using weighted probability
    let roll = Math.random() * this.MYSTERY_CRATE_TOTAL_WEIGHT;
    let item = this.MYSTERY_CRATE_ITEMS[this.MYSTERY_CRATE_ITEMS.length - 1];
    for (const candidate of this.MYSTERY_CRATE_ITEMS) {
      if (roll < candidate.weight) { item = candidate; break; }
      roll -= candidate.weight;
    }

    // Apply item effect
    switch (item.id) {
      case 'nuke_poop':
        bird.mcNukePoop = true;
        break;
      case 'jet_wings':
        bird.mcJetWingsUntil = now + 15000;
        break;
      case 'coin_cache': {
        const coins = 250 + Math.floor(Math.random() * 200);
        bird.coins += coins;
        this._trackDailyProgress(bird, 'coins_earned', coins);
        item = { ...item, coinsAwarded: coins };
        break;
      }
      case 'riot_shield':
        bird.mcRiotShieldUntil = now + 12000;
        break;
      case 'lightning_rod':
        bird.mcLightningRodUntil = now + 20000;
        break;
      case 'coin_magnet':
        bird.mcMagnetUntil = now + 10000;
        bird.mcMagnetLastPull = 0;
        break;
      case 'ghost_mode':
        bird.mcGhostModeUntil = now + 15000;
        break;
      case 'twister_bomb':
        // Immediate effect: blast all birds within 200px away by 300px
        for (const other of this.birds.values()) {
          if (other.id === bird.id) continue;
          const dx = other.x - bird.x;
          const dy = other.y - bird.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const pushAngle = dist > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
            other.x = Math.max(50, Math.min(world.WORLD_WIDTH - 50, other.x + Math.cos(pushAngle) * 300));
            other.y = Math.max(50, Math.min(world.WORLD_HEIGHT - 50, other.y + Math.sin(pushAngle) * 300));
            other.stunnedUntil = now + 1200;
            other.comboCount = 0;
            other.comboExpiresAt = 0;
          }
        }
        break;
      case 'diamond_poop':
        bird.mcDiamondPoopUntil = now + 20000;
        break;
      case 'broken_crate':
        bird.coins += 75;
        this._trackDailyProgress(bird, 'coins_earned', 75);
        break;
    }

    this.events.push({
      type: 'mystery_crate_claimed',
      birdId: bird.id,
      birdName: bird.name,
      birdColor: bird.birdColor,
      gangTag: bird.gangTag || null,
      item: {
        id: item.id,
        emoji: item.emoji,
        name: item.name,
        desc: item.desc,
        coinsAwarded: item.coinsAwarded,
      },
      x: crate.x,
      y: crate.y,
    });
    // Gazette: track mystery crate claims (first claim only, most exciting item)
    if (this.gazetteStats.mysteryCrateItems.length === 0 || item.id !== 'broken_crate') {
      this.gazetteStats.mysteryCrateItems.unshift({ itemName: item.name, emoji: item.emoji, birdName: bird.name });
    }
  }

  // ============================================================
  // BIRD FLU OUTBREAK
  // ============================================================
  _tickFluOutbreak(now) {
    // Trigger a new outbreak if timer is up and at least one bird is online
    if (!this.fluOutbreak && now >= this.fluOutbreakTimer && this.birds.size > 0) {
      this._startFluOutbreak(now);
    }

    if (!this.fluOutbreak) return;

    // Count how many birds are currently sick
    let infectedCount = 0;
    for (const bird of this.birds.values()) {
      if (bird.fluUntil > now) infectedCount++;
    }

    // Outbreak ends naturally when nobody is infected anymore
    if (infectedCount === 0) {
      this._endFluOutbreak(now);
      return;
    }

    // --- SPREAD mechanic ---
    // Every infected bird can spread to a nearby healthy bird (80px radius, 35% chance per tick,
    // but each infected bird has a 4-second cooldown between spreads)
    for (const infectedBird of this.birds.values()) {
      if (infectedBird.fluUntil <= now) continue;       // not infected
      if (infectedBird.fluSpreadCooldown > now) continue; // on spread cooldown

      for (const targetBird of this.birds.values()) {
        if (targetBird.id === infectedBird.id) continue;
        if (targetBird.fluUntil > now) continue;         // already infected
        // Riot shield blocks infection
        if (targetBird.mcRiotShieldUntil > now) continue;

        const dx = targetBird.x - infectedBird.x;
        const dy = targetBird.y - infectedBird.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 80 && Math.random() < 0.35) {
          targetBird.fluUntil = now + 45000; // 45 seconds of sickness
          infectedBird.fluSpreadCooldown = now + 4000;  // 4s before can spread again

          this.events.push({
            type: 'flu_spread',
            fromId: infectedBird.id,
            fromName: infectedBird.name,
            targetId: targetBird.id,
            targetName: targetBird.name,
            x: targetBird.x,
            y: targetBird.y,
          });

          // Special: Kingpin gets infected — city-wide drama!
          if (this.kingpin && this.kingpin.birdId === targetBird.id) {
            this.events.push({
              type: 'flu_kingpin_infected',
              name: targetBird.name,
            });
          }

          break; // one spread per infected bird per check
        }
      }
    }

    // --- MEDICINE PICKUP mechanic ---
    // Any INFECTED bird that flies over a medicine item gets cured
    for (const bird of this.birds.values()) {
      if (bird.fluUntil <= now) continue; // healthy, no need for medicine

      for (const [medId, med] of this.fluMedicineItems) {
        if (!med.active) continue;

        const dx = bird.x - med.x;
        const dy = bird.y - med.y;
        if (Math.sqrt(dx * dx + dy * dy) < 45) {
          // Cured!
          bird.fluUntil = 0;
          med.active = false;
          const xpGained = 35;
          const coinsGained = 20;
          bird.xp += xpGained;
          bird.coins += coinsGained;
          this._trackDailyProgress(bird, 'flu_cured', 1);

          this.events.push({
            type: 'flu_cured',
            birdId: bird.id,
            birdName: bird.name,
            gangTag: bird.gangTag || null,
            xpGained,
            coinsGained,
            x: med.x,
            y: med.y,
          });
          break; // one medicine per bird per tick
        }
      }
    }
  }

  _startFluOutbreak(now) {
    this.fluOutbreak = true;

    // Pick a random online bird as Patient Zero
    const birdList = [...this.birds.values()];
    const patientZero = birdList[Math.floor(Math.random() * birdList.length)];
    patientZero.fluUntil = now + 50000; // Patient Zero is sick for 50 seconds

    // Scatter medicine across the city (5 items from preset positions with a little spread)
    this.fluMedicineItems.clear();
    const positions = this._shuffleArray([...this.FLU_MEDICINE_POSITIONS]);
    const count = Math.min(5, positions.length);
    for (let i = 0; i < count; i++) {
      const pos = positions[i];
      const medId = 'med_' + (this._fluMedicineCounter++);
      this.fluMedicineItems.set(medId, {
        id: medId,
        x: pos.x + (Math.random() - 0.5) * 180,
        y: pos.y + (Math.random() - 0.5) * 180,
        active: true,
      });
    }

    this.gazetteStats.fluOutbreaks++;
    this.events.push({
      type: 'flu_outbreak_start',
      patientZeroId: patientZero.id,
      patientZeroName: patientZero.name,
    });
  }

  _endFluOutbreak(now) {
    this.fluOutbreak = false;
    this.fluMedicineItems.clear();
    // Schedule next outbreak in 25-40 minutes
    this.fluOutbreakTimer = now + this._randomRange(25 * 60000, 40 * 60000);
    this.events.push({ type: 'flu_outbreak_end' });
  }

  _shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ============================================================
  // BIRD CITY GAZETTE — Daily Recap Newspaper
  // ============================================================
  _resetGazetteStats() {
    this.gazetteStats = {
      topCombo:        { count: 0, name: null, gangTag: null },
      poopCounts:      {},  // birdId -> { count, name, gangTag }
      mostWanted:      { level: 0, name: null, gangTag: null },
      heistCount:      0,
      bankHeistCount:  0,
      eggsDelivered:   [],  // [{ name, gangTag }]
      gangWarResults:  [],  // [{ winnerTag, loserTag, kills }]
      kingpinCount:    0,   // crown changes this cycle
      predatorKills:   [],  // [{ name, gangTag, predType }]
      mysteryCrateItems: [],// [{ itemName, emoji, birdName }]
      fluOutbreaks:    0,
      crimeWaves:      0,
      cityLockdowns:   0,   // city lockdowns triggered this cycle
      copsStunned:     {},  // birdId -> { count, name, gangTag }
      seagullInvasions: 0,
      auroraCount:     0,   // auroras triggered this cycle
      helicopterDowns: [],  // [{ name, gangTag }]
      tournamentWinner: null, // { name, gangTag, pot }
      blizzards:       0,   // blizzards this cycle
      meteorShowers:   0,   // meteor showers this cycle
      shootingStars:   0,   // shooting stars this cycle
      royalDecrees:    [],  // [{ type, kingpinName }] — decrees issued this cycle
      peoplesRevolt:   null, // { kingpinName, participantNames } — if revolt triggered
    };
  }

  _compileGazette() {
    const stats = this.gazetteStats;

    // Find top pooper
    let topPooper = null, topPoopCount = 0;
    for (const [, data] of Object.entries(stats.poopCounts)) {
      if (data.count > topPoopCount) { topPoopCount = data.count; topPooper = data; }
    }
    // Find top cop stunner
    let topCopStunner = null, topCopCount = 0;
    for (const [, data] of Object.entries(stats.copsStunned)) {
      if (data.count > topCopCount) { topCopCount = data.count; topCopStunner = data; }
    }

    const headlines = [];

    if (stats.topCombo.count >= 10) {
      const tag = stats.topCombo.gangTag ? `[${stats.topCombo.gangTag}] ` : '';
      headlines.push({
        icon: '🔥',
        headline: `COMBO RAMPAGE: ${tag}${stats.topCombo.name} HITS ${stats.topCombo.count}× STREAK`,
        subline: 'Witnesses describe "absolute chaos" as bird refuses to stop pooping.',
      });
    }

    if (stats.mostWanted.level >= 4) {
      const tag = stats.mostWanted.gangTag ? `[${stats.mostWanted.gangTag}] ` : '';
      const stars = '⭐'.repeat(stats.mostWanted.level);
      headlines.push({
        icon: '🚨',
        headline: `${stars} MOST WANTED: ${tag}${stats.mostWanted.name} TERRORIZES CITY`,
        subline: 'Police dispatch SWAT units. Residents advised to stay indoors.',
      });
    }

    if (stats.bankHeistCount > 0) {
      headlines.push({
        icon: '🏦',
        headline: `CITY BANK ROBBED${stats.bankHeistCount > 1 ? ` ${stats.bankHeistCount} TIMES` : ''}!`,
        subline: 'Authorities baffled as birds execute multi-phase vault breach. "Who gave them wings AND criminal ambition?"',
      });
    } else if (stats.heistCount > 0) {
      headlines.push({
        icon: '🚨',
        headline: `FOOD TRUCK HEIST CREW STRIKES: ${stats.heistCount} JOB${stats.heistCount > 1 ? 'S' : ''} PULLED`,
        subline: 'Police respond 5 minutes too late. Again.',
      });
    }

    if (stats.gangWarResults.length > 0) {
      const war = stats.gangWarResults[0];
      headlines.push({
        icon: '⚔️',
        headline: `TURF WAR: [${war.winnerTag}] DEFEATS [${war.loserTag}] IN BLOODY STREET BATTLE`,
        subline: `${war.kills} confirmed kills. Treasury looted. City Hall declines comment.`,
      });
    }

    if (stats.predatorKills.length > 0) {
      const kill = stats.predatorKills[0];
      const predName = kill.predType === 'hawk' ? 'THE HAWK' : kill.predType === 'cat' ? 'MEGA CAT' : 'EAGLE OVERLORD';
      const tag = kill.gangTag ? `[${kill.gangTag}] ` : '';
      headlines.push({
        icon: '🏆',
        headline: `HERO BIRD: ${tag}${kill.name} SLAYS ${predName}`,
        subline: 'Spontaneous celebrations in the streets. Local bird refuses interview. PETA confused.',
      });
    }

    if (stats.eggsDelivered.length > 0) {
      const names = stats.eggsDelivered.slice(0, 2).map(e => e.name).join(' & ');
      headlines.push({
        icon: '🥚',
        headline: `GOLDEN EGG SCRAMBLE: ${stats.eggsDelivered.length} EGG${stats.eggsDelivered.length > 1 ? 'S' : ''} SNATCHED AND DELIVERED`,
        subline: `Top runners: ${names}. Mysterious nests reportedly satisfied.`,
      });
    }

    if (stats.kingpinCount >= 3) {
      headlines.push({
        icon: '👑',
        headline: `UNSTABLE CROWN: KINGPIN THRONE CHANGED HANDS ${stats.kingpinCount} TIMES`,
        subline: 'Financial analysts worried. Birds are not.',
      });
    }

    if (stats.mysteryCrateItems.length > 0) {
      const crate = stats.mysteryCrateItems[0];
      headlines.push({
        icon: '📦',
        headline: `MYSTERY CRATE SHOCK: ${crate.birdName} CLAIMS ${crate.emoji} ${crate.itemName}`,
        subline: 'City scramble results in minor injuries, maximum chaos, one very smug bird.',
      });
    }

    if (topPooper && topPoopCount >= 20) {
      const tag = topPooper.gangTag ? `[${topPooper.gangTag}] ` : '';
      headlines.push({
        icon: '💩',
        headline: `POOP MACHINE: ${tag}${topPooper.name} FIRED ${topPoopCount} TIMES`,
        subline: 'Health department issues city-wide umbrella advisory.',
      });
    }

    if (topCopStunner && topCopCount >= 3) {
      const tag = topCopStunner.gangTag ? `[${topCopStunner.gangTag}] ` : '';
      headlines.push({
        icon: '🚔',
        headline: `POLICE HUMILIATED: ${tag}${topCopStunner.name} STUNS ${topCopCount} COPS`,
        subline: '"We were not prepared for this level of avian boldness," admits precinct captain.',
      });
    }

    if (stats.fluOutbreaks > 0) {
      headlines.push({
        icon: '🤧',
        headline: 'BIRD FLU OUTBREAK SWEEPS CITY — MEDICINE SUPPLIES DEPLETED',
        subline: 'Multiple birds infected. Patient Zero still at large. The pigeons are not sorry.',
      });
    }

    if (stats.cityLockdowns > 0) {
      headlines.push({
        icon: '🪖',
        headline: `CITY LOCKDOWN DECLARED — NATIONAL GUARD DEPLOYED`,
        subline: `Three criminals at large simultaneously. The National Guard stormed the streets. Nobody felt safe.`,
      });
    } else if (stats.crimeWaves > 0) {
      headlines.push({
        icon: '🚨',
        headline: `CRIME WAVE ERUPTS — CITY DESCENDS INTO LAWLESSNESS`,
        subline: 'Heat doubled. Cops overwhelmed. At least one bird made an absurd amount of coins.',
      });
    }

    if (stats.seagullInvasions > 0) {
      headlines.push({
        icon: '🐦',
        headline: `SEAGULL INVASION HITS CITY — COASTAL RAIDERS STRIP FOOD SUPPLIES`,
        subline: `${stats.seagullInvasions} invasion${stats.seagullInvasions > 1 ? 's' : ''} launched from the coast. Birds urged to "poop back immediately."`,
      });
    }

    if (stats.helicopterDowns && stats.helicopterDowns.length > 0) {
      const ace = stats.helicopterDowns[0];
      const tag = ace.gangTag ? `[${ace.gangTag}] ` : '';
      headlines.push({
        icon: '🚁',
        headline: `POLICE HELICOPTER DOWNED — ${tag}${ace.name} SHOOTS IT OUT OF THE SKY`,
        subline: 'Air support unit crash-landed in the park. "This has never happened before," says Chief.',
      });
    }

    if (stats.tournamentWinner) {
      const tw = stats.tournamentWinner;
      const tag = tw.gangTag ? `[${tw.gangTag}] ` : '';
      headlines.push({
        icon: '🥊',
        headline: `FIGHTING CHAMPIONSHIP: ${tag}${tw.name} WINS THE BRACKET!`,
        subline: `Took home ${tw.pot}c in prize coins. The crowd erupted. Pigeons wept.`,
      });
    }

    // People's Revolt / People's March headline takes priority over generic decree if it happened
    if (stats.peoplesRevolt) {
      const r = stats.peoplesRevolt;
      const names = r.participantNames.slice(0, 3).join(', ');
      if (r.isPeoplesMarch) {
        headlines.push({
          icon: '✊',
          headline: `THE PEOPLE'S MARCH — ${r.participantNames.length} BIRDS SEIZE THE CROWN`,
          subline: `${names} and others led a 5-bird uprising. ${r.kingpinName} stripped of 60% wealth. City Hall refuses comment.`,
        });
      } else {
        headlines.push({
          icon: '🏴',
          headline: `THE MASSES REVOLT — ${r.kingpinName} OVERTHROWN BY THE PEOPLE`,
          subline: `${names} rose up together after Tax Day was the last straw. The crown fell to the streets.`,
        });
      }
    } else if (stats.royalDecrees && stats.royalDecrees.length > 0) {
      const dec = stats.royalDecrees[0];
      const DECREE_HEADLINES = {
        gold_rush: [`⚜️ KINGPIN ${dec.kingpinName} ISSUES GOLD RUSH DECREE`, 'Coin drops doubled city-wide. Citizens celebrated briefly, then resumed criminal activity.'],
        wanted_decree: [`⚜️ TYRANT KINGPIN ${dec.kingpinName} SENTENCES ENTIRE CITY`, 'All birds declared wanted simultaneously. Cops overwhelmed. The Don reportedly approves.'],
        royal_amnesty: [`⚜️ KINGPIN ${dec.kingpinName} DECLARES ROYAL AMNESTY — LAWLESSNESS ERUPTS`, '45 seconds of no cops. The city made the most of it. Records broken.'],
        tax_day: [`⚜️ KINGPIN ${dec.kingpinName} LEVIES CITY TAX — CITIZENS FURIOUS`, '"They took 10% of my coins," says local bird. "I was going to use those for slots."'],
        kings_pardon: [`⚜️ KINGPIN ${dec.kingpinName} GRANTS ROYAL PARDON — CRIMINAL WALKS FREE`, 'The Most Wanted bird was cleared of all charges by royal fiat. Cops baffled. Citizens outraged.'],
      };
      const [hl, sl] = DECREE_HEADLINES[dec.type] || [`⚜️ KINGPIN ${dec.kingpinName} ISSUES ROYAL DECREE`, 'City reacts with awe, confusion, and renewed criminal intent.'];
      headlines.push({ icon: '⚜️', headline: hl, subline: sl });
    }

    if (stats.blizzards > 0) {
      headlines.push({
        icon: '❄️',
        headline: 'BLIZZARD SWEEPS BIRD CITY — SNOWBALL POOP CHAOS ERUPTS',
        subline: 'Hot cocoa stocks depleted in minutes. Cops report "cold feet." Drunk pigeons reported slipping on ice.',
      });
    }

    if (stats.meteorShowers > 0) {
      headlines.push({
        icon: '🌠',
        headline: `METEOR SHOWER OVER BIRD CITY — ${stats.meteorShowers * 3} STARS FALL SIMULTANEOUSLY`,
        subline: 'Racing birds scramble across the city as multiple Mystery Crate-tier items rain from the sky.',
      });
    } else if (stats.auroraCount > 0) {
      headlines.push({
        icon: '✨',
        headline: 'AURORA BOREALIS LIGHTS UP BIRD CITY SKIES',
        subline: 'Witnesses describe "divine light ribbons" above the park. Cosmic fish reportedly went wild. Scientists baffled.',
      });
    }

    // Default headline if nothing notable happened
    if (headlines.length === 0) {
      headlines.push({
        icon: '🌙',
        headline: 'QUIET NIGHT IN BIRD CITY',
        subline: 'Sources report unusually lawful behavior overnight. Citizens unsettled by the calm.',
      });
    }

    // Build stats summary (for the newspaper footer)
    const summaryStats = {
      topCombo: stats.topCombo.count > 0 ? { count: stats.topCombo.count, name: stats.topCombo.name } : null,
      topPooper: topPoopCount > 0 ? { count: topPoopCount, name: topPooper.name } : null,
      heists: stats.heistCount + stats.bankHeistCount,
    };

    this.events.push({
      type: 'gazette_edition',
      edition: this.gazetteEdition++,
      headlines: headlines.slice(0, 4), // max 4 headlines per edition
      summaryStats,
    });
  }

  // ============================================================
  // CROW CARTEL RAID SYSTEM
  // ============================================================
  _updateCrowCartel(dt, now) {
    // Spawn timer — only when players are online
    if (!this.crowCartel && now >= this.crowCartelTimer && this.birds.size > 0) {
      // Pick a player-owned territory (not CARTEL, not neutral)
      const ownedZones = Array.from(this.territories.values()).filter(
        z => z.ownerTeamId && z.ownerTeamId !== 'CARTEL'
      );
      if (ownedZones.length > 0) {
        const targetZone = ownedZones[Math.floor(Math.random() * ownedZones.length)];
        this._spawnCrowCartel(targetZone, now);
      } else {
        // No owned zones — try again in 3-5 min
        this.crowCartelTimer = now + this._randomRange(3 * 60000, 5 * 60000);
      }
    }

    if (!this.crowCartel) return;

    const cartel = this.crowCartel;
    const zone = this.territories.get(cartel.targetZoneId);

    if (cartel.state === 'raiding') {
      // Check if raid timed out (3 min max)
      if (now >= cartel.raidEndsAt) {
        this._retreatCrowCartel(now, 'timeout');
        return;
      }

      // Move crows toward zone center, then assault
      const zoneCx = zone.x + zone.w / 2;
      const zoneCy = zone.y + zone.h / 2;
      let crowsInZone = 0;

      for (const crow of cartel.crows.values()) {
        if (crow.state === 'dead' || crow.state === 'fleeing') continue;

        // Check if crow is inside the target zone
        const inZone = crow.x >= zone.x && crow.x <= zone.x + zone.w &&
                       crow.y >= zone.y && crow.y <= zone.y + zone.h;

        if (!inZone) {
          // Move toward zone center
          const dx = zoneCx - crow.x;
          const dy = zoneCy - crow.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            const speed = crow.speed * dt;
            crow.x += (dx / dist) * speed;
            crow.y += (dy / dist) * speed;
            crow.rotation = Math.atan2(dy, dx);
          }
        } else {
          crowsInZone++;
          // Assault: drain zone capture progress
          // Each crow in zone drains at 0.008/s — faster than a single defender captures
          const drainRate = 0.008 * dt;
          if (zone.ownerTeamId && zone.ownerTeamId !== 'CARTEL') {
            zone.captureProgress = Math.max(0, zone.captureProgress - drainRate);
            if (zone.captureProgress <= 0) {
              // Zone falls to the Cartel!
              this._flipZoneToCartel(zone, now);
              return; // State changes to 'holding' inside _flipZoneToCartel
            }
          } else if (zone.ownerTeamId === 'CARTEL') {
            // Cartel is filling it back up
            zone.captureProgress = Math.min(1, zone.captureProgress + drainRate);
          }

          // Crows in zone patrol with slight wander
          crow._wanderTimer = (crow._wanderTimer || 0) - dt;
          if (crow._wanderTimer <= 0) {
            crow._wanderAngle = (Math.random() * Math.PI * 2);
            crow._wanderTimer = 1.5 + Math.random() * 2;
          }
          crow.x += Math.cos(crow._wanderAngle) * 18 * dt;
          crow.y += Math.sin(crow._wanderAngle) * 18 * dt;
          // Clamp inside zone
          crow.x = Math.max(zone.x + 20, Math.min(zone.x + zone.w - 20, crow.x));
          crow.y = Math.max(zone.y + 20, Math.min(zone.y + zone.h - 20, crow.y));
          crow.rotation = crow._wanderAngle;
        }
      }

      // Check if all crows are dead/fleeing — defenders win!
      const aliveCrows = Array.from(cartel.crows.values()).filter(c => c.state !== 'dead' && c.state !== 'fleeing');
      if (aliveCrows.length === 0) {
        this._defenderVictory(zone, now);
      }

    } else if (cartel.state === 'holding') {
      // Holding the zone — stay until holdUntil, then retreat
      if (now >= cartel.holdUntil) {
        this._retreatCrowCartel(now, 'voluntary');
        return;
      }
      // Keep crows moving inside the zone
      for (const crow of cartel.crows.values()) {
        if (crow.state === 'dead' || crow.state === 'fleeing') continue;
        crow._wanderTimer = (crow._wanderTimer || 0) - dt;
        if (crow._wanderTimer <= 0) {
          crow._wanderAngle = Math.random() * Math.PI * 2;
          crow._wanderTimer = 1.5 + Math.random() * 2;
        }
        crow.x += Math.cos(crow._wanderAngle) * 22 * dt;
        crow.y += Math.sin(crow._wanderAngle) * 22 * dt;
        crow.x = Math.max(zone.x + 20, Math.min(zone.x + zone.w - 20, crow.x));
        crow.y = Math.max(zone.y + 20, Math.min(zone.y + zone.h - 20, crow.y));
        crow.rotation = crow._wanderAngle;
      }

      // Check if all crows killed during hold — zone returns to neutral
      const alive = Array.from(cartel.crows.values()).filter(c => c.state !== 'dead' && c.state !== 'fleeing');
      if (alive.length === 0) {
        this._defenderVictory(zone, now);
      }

    } else if (cartel.state === 'fleeing') {
      // All crows flee to map edge
      let allGone = true;
      for (const crow of cartel.crows.values()) {
        if (crow.state === 'dead') continue;
        crow.state = 'fleeing';
        const tx = crow._fleeTargetX || 1500;
        const ty = crow._fleeTargetY || -100;
        const dx = tx - crow.x;
        const dy = ty - crow.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 20) {
          allGone = false;
          const speed = 160 * dt;
          crow.x += (dx / dist) * speed;
          crow.y += (dy / dist) * speed;
          crow.rotation = Math.atan2(dy, dx);
        }
      }
      if (allGone) {
        this.crowCartel = null;
        this.crowCartelTimer = now + this._randomRange(20 * 60000, 35 * 60000);
        if (this._gangWarCartelAnnounced) this._gangWarCartelAnnounced.clear();
      }
    }
  }

  _spawnCrowCartel(zone, now) {
    const crows = new Map();
    const zoneCx = zone.x + zone.w / 2;
    const zoneCy = zone.y + zone.h / 2;

    // Spawn crows at zone edges
    const spawnPositions = [
      { x: zone.x - 40, y: zoneCy - 60 },
      { x: zone.x - 40, y: zoneCy + 60 },
      { x: zone.x + zone.w + 40, y: zoneCy - 60 },
      { x: zone.x + zone.w + 40, y: zoneCy + 60 },
    ];

    // 3-4 crow thugs
    const numThugs = 3 + (Math.random() < 0.5 ? 1 : 0);
    for (let i = 0; i < numThugs; i++) {
      const id = 'cartel_' + (++this._crowCartelIdCounter);
      const pos = spawnPositions[i % spawnPositions.length];
      crows.set(id, {
        id,
        x: pos.x + (Math.random() - 0.5) * 30,
        y: pos.y + (Math.random() - 0.5) * 30,
        rotation: 0,
        hp: 25,
        maxHp: 25,
        type: 'thug',
        state: 'moving',
        speed: 85,
        stunUntil: 0,
        _wanderAngle: Math.random() * Math.PI * 2,
        _wanderTimer: 0,
        _fleeTargetX: zone.x < 1500 ? -60 : 3060,
        _fleeTargetY: zone.y < 1500 ? -60 : 3060,
      });
    }

    // 1 Don Corvino (bigger, slower, more HP)
    const donId = 'cartel_don_' + (++this._crowCartelIdCounter);
    const donPos = spawnPositions[numThugs % spawnPositions.length];
    crows.set(donId, {
      id: donId,
      x: donPos.x,
      y: donPos.y,
      rotation: 0,
      hp: 80,
      maxHp: 80,
      type: 'don',
      state: 'moving',
      speed: 60,
      stunUntil: 0,
      _wanderAngle: Math.random() * Math.PI * 2,
      _wanderTimer: 0,
      _fleeTargetX: zone.x < 1500 ? -60 : 3060,
      _fleeTargetY: zone.y < 1500 ? -60 : 3060,
    });

    this.crowCartel = {
      crows,
      targetZoneId: zone.id,
      targetZoneName: zone.name,
      state: 'raiding',
      raidEndsAt: now + 180000, // 3 min max raid
      holdUntil: null,
      originalOwnerTeamId: zone.ownerTeamId,
      originalOwnerName: zone.ownerName,
      originalOwnerColor: zone.ownerColor,
      originalProgress: zone.captureProgress,
    };

    this.events.push({
      type: 'cartel_raid_start',
      zoneName: zone.name,
      zoneId: zone.id,
      ownerName: zone.ownerName,
      numCrows: crows.size,
    });

    console.log(`[Cartel] Raid started on ${zone.name} (${crows.size} crows)`);
  }

  _flipZoneToCartel(zone, now) {
    const cartel = this.crowCartel;
    const prevOwner = zone.ownerName;
    zone.ownerTeamId = 'CARTEL';
    zone.ownerName = 'Crow Cartel';
    zone.ownerColor = '#111111';
    zone.captureProgress = 1.0;
    zone.capturingTeamId = null;
    zone.capturingName = null;
    cartel.state = 'holding';
    cartel.holdUntil = now + 90000; // hold for 90s then leave

    this.events.push({
      type: 'cartel_zone_captured',
      zoneName: zone.name,
      zoneId: zone.id,
      prevOwner,
    });

    // After holding, zone will go neutral (handled in retreat)
    console.log(`[Cartel] Seized ${zone.name}! Previous owner: ${prevOwner}`);
  }

  _defenderVictory(zone, now) {
    const cartel = this.crowCartel;

    // Restore zone if Cartel had captured it
    if (zone.ownerTeamId === 'CARTEL') {
      zone.ownerTeamId = null;
      zone.ownerName = null;
      zone.ownerColor = null;
      zone.captureProgress = 0;
    }

    this.events.push({
      type: 'cartel_raid_repelled',
      zoneName: zone.name,
      zoneId: zone.id,
      zoneOwnerName: cartel.originalOwnerName,
    });

    // Big rewards to all birds who were in or near the zone
    for (const bird of this.birds.values()) {
      const inZone = bird.x >= zone.x && bird.x <= zone.x + zone.w &&
                     bird.y >= zone.y && bird.y <= zone.y + zone.h;
      const nearby = !inZone && Math.abs(bird.x - (zone.x + zone.w/2)) < zone.w * 0.9 &&
                     Math.abs(bird.y - (zone.y + zone.h/2)) < zone.h * 0.9;
      if (inZone || nearby) {
        bird.xp += 120;
        bird.coins += 80;
        const newLevel = world.getLevelFromXP(bird.xp);
        if (newLevel !== bird.level) {
          bird.level = newLevel;
          bird.type = world.getBirdTypeForLevel(newLevel);
        }
        this.events.push({ type: 'cartel_defender_reward', birdId: bird.id, birdName: bird.name, xp: 120, coins: 80 });
      }
    }

    // Set state to fleeing
    cartel.state = 'fleeing';
    // All crows flee
    for (const crow of cartel.crows.values()) {
      if (crow.state !== 'dead') {
        crow.state = 'fleeing';
      }
    }

    this.crowCartelTimer = now + this._randomRange(20 * 60000, 35 * 60000);
    console.log(`[Cartel] Raid repelled at ${zone.name}!`);
  }

  _retreatCrowCartel(now, reason) {
    const cartel = this.crowCartel;
    const zone = this.territories.get(cartel.targetZoneId);

    // If Cartel still holds the zone, restore it to neutral
    if (zone && zone.ownerTeamId === 'CARTEL') {
      zone.ownerTeamId = null;
      zone.ownerName = null;
      zone.ownerColor = null;
      zone.captureProgress = 0;
      zone.capturingTeamId = null;
      zone.capturingName = null;
    }

    if (reason === 'voluntary') {
      this.events.push({
        type: 'cartel_retreated',
        zoneName: zone ? zone.name : '?',
        zoneId: cartel.targetZoneId,
      });
    }

    cartel.state = 'fleeing';
    for (const crow of cartel.crows.values()) {
      if (crow.state !== 'dead') crow.state = 'fleeing';
    }
    this.crowCartelTimer = now + this._randomRange(20 * 60000, 35 * 60000);
    console.log(`[Cartel] Retreated from ${zone ? zone.name : '?'} (${reason})`);
  }

  // ============================================================
  // BIRD CITY IDOL — Singing Contest
  // ============================================================

  _tickBirdIdol(now) {
    // Start a new contest if timer elapsed and birds are online
    if (!this.birdIdol && now >= this.birdIdolTimer && this.birds.size > 0) {
      this.birdIdol = {
        state: 'open',
        contestants: new Map(),     // birdId -> contestant info
        contestantsOrder: [],       // ordered list of birdIds (for slot numbers)
        votes: new Map(),           // voterId -> { contestantId, birdName }
        openUntil: now + 35000,     // 35-second registration + performance window
        votingUntil: null,
        resultsUntil: null,
        winnerId: null,
        winnerName: null,
        scoreMap: null,
      };
      this.events.push({
        type: 'idol_contest_open',
        openUntil: this.birdIdol.openUntil,
      });
      return;
    }

    if (!this.birdIdol) return;
    const idol = this.birdIdol;

    // Open phase: wait for contestants to register. Transition to voting when timer runs out.
    if (idol.state === 'open' && now >= idol.openUntil) {
      if (idol.contestants.size < 2) {
        // Not enough contestants — cancel
        this.events.push({ type: 'idol_cancelled' });
        this.birdIdol = null;
        this.birdIdolTimer = now + this._randomRange(35 * 60000, 50 * 60000);
        return;
      }
      idol.state = 'voting';
      idol.votingUntil = now + 25000;
      this.events.push({
        type: 'idol_voting_open',
        contestants: idol.contestantsOrder.map((id, i) => ({
          id,
          name: idol.contestants.get(id).name,
          slotNum: i + 1,
          performanceHits: idol.contestants.get(id).performanceHits,
        })),
        votingUntil: idol.votingUntil,
      });
      return;
    }

    // Voting phase: collect spectator votes. Tally and announce when done.
    if (idol.state === 'voting' && now >= idol.votingUntil) {
      // Tally scores: votes × 3 + performanceHits × 2
      const scores = new Map();
      for (const c of idol.contestants.values()) {
        scores.set(c.id, (c.performanceHits || 0) * 2);
      }
      for (const { contestantId } of idol.votes.values()) {
        scores.set(contestantId, (scores.get(contestantId) || 0) + 3);
      }

      // Find winner (random tiebreak among equal top scorers)
      let topScore = -1;
      for (const score of scores.values()) {
        if (score > topScore) topScore = score;
      }
      const tied = [...scores.entries()].filter(([, s]) => s === topScore).map(([id]) => id);
      const winnerId = tied[Math.floor(Math.random() * tied.length)];

      idol.winnerId = winnerId;
      idol.winnerName = winnerId && idol.contestants.has(winnerId)
        ? idol.contestants.get(winnerId).name : 'Nobody';
      idol.state = 'results';
      idol.resultsUntil = now + 12000;
      idol.scoreMap = Object.fromEntries(scores);

      // Vote totals for display
      const voteCounts = {};
      for (const c of idol.contestants.values()) voteCounts[c.id] = 0;
      for (const { contestantId } of idol.votes.values()) {
        voteCounts[contestantId] = (voteCounts[contestantId] || 0) + 1;
      }

      // Reward winner
      const winnerBird = winnerId ? this.birds.get(winnerId) : null;
      if (winnerBird) {
        winnerBird.coins += 300;
        winnerBird.xp += 250;
        winnerBird.idolBadge = true;
        // Idol Hall of Fame: increment lifetime win counter + daily challenge tracking
        winnerBird.idolWins = (winnerBird.idolWins || 0) + 1;
        this._trackDailyProgress(winnerBird, 'idol_won', 1);
        // Refresh idol leaderboard to include this win immediately
        this._refreshIdolLeaderboard();
      }

      // Reward runners-up
      for (const id of idol.contestants.keys()) {
        if (id === winnerId) continue;
        const b = this.birds.get(id);
        if (b) { b.coins += 80; b.xp += 50; }
      }

      // Reward correct voters
      for (const [voterId, vote] of idol.votes) {
        if (vote.contestantId === winnerId) {
          const b = this.birds.get(voterId);
          if (b) { b.coins += 60; b.xp += 30; }
        }
      }

      // City-wide XP boost for 3 minutes
      this.idolXpBoostUntil = now + 180000;

      this.events.push({
        type: 'idol_results',
        winnerId,
        winnerName: idol.winnerName,
        contestants: idol.contestantsOrder.map((id, i) => ({
          id,
          name: idol.contestants.get(id).name,
          slotNum: i + 1,
          votes: voteCounts[id] || 0,
          performanceHits: idol.contestants.get(id).performanceHits || 0,
          score: scores.get(id) || 0,
        })),
        totalVotes: idol.votes.size,
        xpBoostUntil: this.idolXpBoostUntil,
      });
      return;
    }

    // Results phase: show winner, then clean up
    if (idol.state === 'results' && now >= idol.resultsUntil) {
      this.birdIdol = null;
      this.birdIdolTimer = now + this._randomRange(35 * 60000, 50 * 60000);
    }
  }

  _handleIdolEnter(bird, now) {
    const idol = this.birdIdol;
    if (!idol || idol.state !== 'open') return;
    if (idol.contestants.has(bird.id)) return;
    if (idol.contestants.size >= 4) {
      this.events.push({ type: 'idol_stage_full', birdId: bird.id });
      return;
    }

    // Proximity check
    const dx = bird.x - this.IDOL_STAGE_POS.x;
    const dy = bird.y - this.IDOL_STAGE_POS.y;
    if (Math.sqrt(dx * dx + dy * dy) > this.IDOL_STAGE_POS.radius) return;

    idol.contestants.set(bird.id, {
      id: bird.id,
      name: bird.name,
      gangTag: bird.gangTag || null,
      gangColor: bird.gangColor || null,
      prestige: bird.prestige || 0,
      tattoos: bird.tattoosEquipped || [],
      performanceHits: 0,
    });
    idol.contestantsOrder.push(bird.id);

    this.events.push({
      type: 'idol_contestant_joined',
      birdId: bird.id,
      birdName: bird.name,
      slotNum: idol.contestantsOrder.length,
      totalContestants: idol.contestants.size,
    });
  }

  _handleIdolVote(bird, action, now) {
    const idol = this.birdIdol;
    if (!idol || idol.state !== 'voting') return;
    if (idol.contestants.has(bird.id)) return; // contestants can't vote for themselves
    if (idol.votes.has(bird.id)) return;        // one vote per bird

    const contestantId = action.contestantId;
    if (!contestantId || !idol.contestants.has(contestantId)) return;

    idol.votes.set(bird.id, { contestantId, birdName: bird.name });

    this.events.push({
      type: 'idol_vote_cast',
      voterName: bird.name,
      contestantName: idol.contestants.get(contestantId).name,
      totalVotes: idol.votes.size,
    });
  }

  // ============================================================
  // PIGEON PIED PIPER
  // ============================================================

  _tickPiper(dt, now) {
    // Spawn timer
    if (!this.piper && now >= this.piperTimer && this.birds.size > 0) {
      this._spawnPiper(now);
      return;
    }
    if (!this.piper) return;

    const p = this.piper;

    // Check if time's up — piper steals coins and vanishes
    if (now >= p.endsAt) {
      this._piperSteal(now);
      return;
    }

    // Piper slowly wanders around his spawn area (gentle sine drift)
    const wanderPhase = now / 4000;
    const wanderRadius = 80;
    // Drift target oscillates around spawn point
    const tx = p.spawnX + Math.cos(wanderPhase) * wanderRadius;
    const ty = p.spawnY + Math.sin(wanderPhase * 1.3) * wanderRadius;
    const dx = tx - p.x;
    const dy = ty - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      const speed = 22; // very slow, he's focused on music
      p.x += (dx / dist) * Math.min(speed * dt, dist);
      p.y += (dy / dist) * Math.min(speed * dt, dist);
    }

    // Clamp to world bounds
    p.x = Math.max(50, Math.min(world.WORLD_WIDTH - 50, p.x));
    p.y = Math.max(50, Math.min(world.WORLD_HEIGHT - 50, p.y));
  }

  _spawnPiper(now) {
    const locations = this.PIPER_SPAWN_LOCATIONS;
    const loc = locations[Math.floor(Math.random() * locations.length)];
    this.piper = {
      x: loc.x,
      y: loc.y,
      spawnX: loc.x,
      spawnY: loc.y,
      hitCount: 0,
      hitsRequired: 6,
      spawnedAt: now,
      endsAt: now + 90000, // 90 seconds to stop him
    };
    this.events.push({
      type: 'piper_appears',
      x: this.piper.x,
      y: this.piper.y,
      endsAt: this.piper.endsAt,
    });
  }

  _defeatPiper(defeatingBird, now) {
    const p = this.piper;
    this.piper = null;
    this.piperTimer = now + this._randomRange(25 * 60000, 35 * 60000);

    // Reward ALL online birds for driving away the Piper
    const rewardXp = 120;
    const rewardCoins = 60;
    const winners = [];
    for (const b of this.birds.values()) {
      b.xp += rewardXp;
      b.coins += rewardCoins;
      this._trackDailyProgress(b, 'coins_earned', rewardCoins);
      winners.push(b.name);
      // Level up check
      const newLevel = world.getLevelFromXP(b.xp);
      if (newLevel !== b.level) {
        b.level = newLevel;
        b.type = world.getBirdTypeForLevel(newLevel);
        this.events.push({ type: 'evolve', birdId: b.id, name: b.name, birdType: b.type });
      }
    }
    this.events.push({
      type: 'piper_defeated',
      defeaterName: defeatingBird ? defeatingBird.name : 'A hero bird',
      defeaterGangTag: defeatingBird ? (defeatingBird.gangTag || null) : null,
      rewardXp,
      rewardCoins,
      x: p.x, y: p.y,
    });
  }

  _piperSteal(now) {
    const p = this.piper;
    this.piper = null;
    this.piperTimer = now + this._randomRange(25 * 60000, 35 * 60000);

    const STEAL_RADIUS = 350;
    const victims = [];
    let totalStolen = 0;
    for (const b of this.birds.values()) {
      if (b.inSewer) continue;
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < STEAL_RADIUS) {
        const stolen = Math.ceil(b.coins * 0.20); // 20% coins
        if (stolen > 0) {
          b.coins = Math.max(0, b.coins - stolen);
          victims.push({ name: b.name, stolen });
          totalStolen += stolen;
          this.events.push({
            type: 'piper_steal_personal',
            birdId: b.id,
            stolen,
            x: b.x, y: b.y,
          });
        }
      }
    }
    this.events.push({
      type: 'piper_stolen',
      victims,
      totalStolen,
      x: p.x, y: p.y,
    });
  }

  // ============================================================
  // CURSED COIN SYSTEM
  // A single legendary cursed coin roams Bird City.
  // Holding it gives +2.5× coin gains + +20% speed but drains food
  // and builds toward a catastrophic explosion after 4 minutes.
  // Anyone can steal it by flying within 50px (5s cooldown per bird).
  // ============================================================
  _tickCursedCoin(dt, now) {
    const CURSE_DURATION = 4 * 60 * 1000; // 4 minutes to full intensity
    const EXPLODE_RADIUS = 400;
    const STEAL_RADIUS = 50;
    const PICKUP_RADIUS = 45;
    const FOOD_DRAIN_INTERVAL = 20000; // drain 3 food every 20s
    const STEAL_COOLDOWN = 5000;       // 5s per-bird steal cooldown

    // Spawn timer: respawn after explosion or first appearance
    if (!this.cursedCoin && now >= this.cursedCoinTimer && this.birds.size > 0) {
      // Pick a random prominent city spot
      const SPAWN_SPOTS = [
        { x: 1200, y: 1200 }, // Park center
        { x: 2200, y: 1200 }, // Mall area
        { x: 800,  y: 1800 }, // Cafe District
        { x: 1800, y: 600  }, // Near Downtown
        { x: 600,  y: 600  }, // Residential
        { x: 2500, y: 1800 }, // East docks
        { x: 1500, y: 2200 }, // South quarter
        { x: 1050, y: 640  }, // Hall of Legends area
      ];
      const spot = SPAWN_SPOTS[Math.floor(Math.random() * SPAWN_SPOTS.length)];
      this.cursedCoin = {
        state: 'world',
        x: spot.x + (Math.random() - 0.5) * 200,
        y: spot.y + (Math.random() - 0.5) * 200,
        holderId: null,
        holderName: null,
        heldSince: null,
        intensity: 0,        // 0.0 to 1.0
        lastDrain: 0,
        stealCooldowns: new Map(),
      };
      this.events.push({
        type: 'cursed_coin_appeared',
        x: this.cursedCoin.x,
        y: this.cursedCoin.y,
      });
      return;
    }

    if (!this.cursedCoin) return;

    const coin = this.cursedCoin;

    if (coin.state === 'world') {
      // Auto-collect: first non-stunned bird within 45px picks it up
      for (const bird of this.birds.values()) {
        if (bird.stunnedUntil > now) continue;
        if (bird.inSewer) continue;
        const dx = bird.x - coin.x;
        const dy = bird.y - coin.y;
        if (Math.sqrt(dx * dx + dy * dy) < PICKUP_RADIUS) {
          coin.state = 'held';
          coin.holderId = bird.id;
          coin.holderName = bird.name;
          coin.heldSince = now;
          coin.intensity = 0;
          coin.lastDrain = now;
          coin.stealCooldowns = new Map();
          this.events.push({
            type: 'cursed_coin_grabbed',
            birdId: bird.id,
            birdName: bird.name,
            gangTag: bird.gangTag || null,
          });
          break;
        }
      }
    } else if (coin.state === 'held') {
      const holder = this.birds.get(coin.holderId);

      // Holder disconnected → drop at last known position
      if (!holder) {
        coin.state = 'world';
        coin.holderId = null;
        coin.holderName = null;
        coin.heldSince = null;
        coin.intensity = 0;
        coin.stealCooldowns = new Map();
        // Coin stays at last known position (x, y unchanged from holder's last pos)
        this.events.push({ type: 'cursed_coin_dropped', x: coin.x, y: coin.y });
        return;
      }

      // Update coin position to follow holder
      coin.x = holder.x;
      coin.y = holder.y;

      // Food drain: -3 food every 20 seconds
      if (now - coin.lastDrain >= FOOD_DRAIN_INTERVAL) {
        coin.lastDrain = now;
        holder.food = Math.max(0, holder.food - 3);
        this.events.push({
          type: 'cursed_coin_drain',
          birdId: holder.id,
          birdName: holder.name,
        });
      }

      // Build intensity
      const elapsed = now - coin.heldSince;
      coin.intensity = Math.min(1.0, elapsed / CURSE_DURATION);

      // Daily challenge: hold for 30+ seconds
      if (elapsed >= 30000 && !coin.holdChallengeDone) {
        coin.holdChallengeDone = true;
        this._trackDailyProgress(holder, 'cursed_hold', 1);
      }

      // EXPLOSION at full intensity
      if (coin.intensity >= 1.0) {
        this._explodeCursedCoin(holder, now, EXPLODE_RADIUS);
        return;
      }

      // Warn at 75% and 90%
      if (coin.intensity >= 0.90 && !coin.warned90) {
        coin.warned90 = true;
        this.events.push({ type: 'cursed_coin_warning', birdId: holder.id, birdName: holder.name, intensity: 90 });
      } else if (coin.intensity >= 0.75 && !coin.warned75) {
        coin.warned75 = true;
        this.events.push({ type: 'cursed_coin_warning', birdId: holder.id, birdName: holder.name, intensity: 75 });
      }

      // Steal check: any non-holder bird within 50px can steal (with cooldown)
      for (const bird of this.birds.values()) {
        if (bird.id === coin.holderId) continue;
        if (bird.stunnedUntil > now) continue;
        if (bird.inSewer) continue;
        const cooldownEnd = coin.stealCooldowns.get(bird.id) || 0;
        if (now < cooldownEnd) continue;
        const dx = bird.x - holder.x;
        const dy = bird.y - holder.y;
        if (Math.sqrt(dx * dx + dy * dy) < STEAL_RADIUS) {
          // Steal!
          const prevHolder = holder;
          const prevName = coin.holderName;
          coin.stealCooldowns.set(bird.id, now + STEAL_COOLDOWN);
          // Give 5s immunity back to original holder too
          coin.stealCooldowns.set(prevHolder.id, now + STEAL_COOLDOWN);
          coin.holderId = bird.id;
          coin.holderName = bird.name;
          coin.heldSince = now; // intensity does NOT reset — curse remembers!
          coin.warned75 = false;
          coin.warned90 = false;
          coin.lastDrain = now;
          this.events.push({
            type: 'cursed_coin_stolen',
            thiefId: bird.id,
            thiefName: bird.name,
            thiefGangTag: bird.gangTag || null,
            victimId: prevHolder.id,
            victimName: prevName,
            victimGangTag: prevHolder.gangTag || null,
            intensity: Math.round(coin.intensity * 100),
          });
          // Reward thief: XP + daily challenge progress
          bird.xp += 40;
          this._trackDailyProgress(bird, 'cursed_steal', 1);
          break;
        }
      }
    }
  }

  _explodeCursedCoin(holder, now, explodeRadius) {
    const coin = this.cursedCoin;

    // Holder loses up to 30% of coins (capped at 300c)
    const lostCoins = Math.min(300, Math.floor(holder.coins * 0.30));
    holder.coins = Math.max(0, holder.coins - lostCoins);

    // Holder earns +500 XP for surviving the full curse
    holder.xp += 500;

    // Aurora bonus: during Aurora Borealis, coin scatter is DOUBLED — the sacred sky blesses the explosion
    const auroraDoubled = !!this.aurora;

    // Scatter lost coins to all nearby birds proportionally
    const nearbyBirds = [];
    for (const bird of this.birds.values()) {
      if (bird.id === holder.id) continue;
      const dx = bird.x - holder.x;
      const dy = bird.y - holder.y;
      if (Math.sqrt(dx * dx + dy * dy) < explodeRadius) {
        nearbyBirds.push(bird);
      }
    }

    const rewards = [];
    const effectiveLostCoins = auroraDoubled ? lostCoins * 2 : lostCoins;
    if (nearbyBirds.length > 0 && effectiveLostCoins > 0) {
      const share = Math.floor(effectiveLostCoins / nearbyBirds.length);
      for (const b of nearbyBirds) {
        const earned = Math.max(1, share + Math.floor(Math.random() * 5));
        b.coins += earned;
        b.xp += auroraDoubled ? 80 : 50;
        rewards.push({ birdId: b.id, birdName: b.name, coins: earned });
      }
    }

    this.events.push({
      type: 'cursed_coin_explosion',
      holderId: holder.id,
      holderName: holder.name,
      holderGangTag: holder.gangTag || null,
      lostCoins,
      auroraDoubled,
      rewards,
      x: holder.x,
      y: holder.y,
    });

    // Wipe combo streak for the exploded holder
    holder.comboCount = 0;
    holder.comboExpiresAt = 0;

    // Remove the coin for now — respawn after 2-3 minutes
    this.cursedCoin = null;
    this.cursedCoinTimer = now + this._randomRange(2 * 60000, 3 * 60000);
  }

  // ============================================================
  // BOUNTY HUNTER
  // ============================================================
  _updateBountyHunter(dt, now) {
    // Only active when there's a wanted bird
    if (!this.wantedBirdId) {
      if (this.bountyHunter) {
        this.bountyHunter = null;
      }
      return;
    }

    const wanted = this.birds.get(this.wantedBirdId);
    if (!wanted) {
      this.bountyHunter = null;
      return;
    }

    const wantedHeat = this.heatScores.get(this.wantedBirdId) || 0;
    const wantedLevel = this._getWantedLevel(wantedHeat);

    // Despawn if wanted level drops below 3
    if (wantedLevel < 3) {
      if (this.bountyHunter) {
        this.bountyHunter = null;
        this.events.push({ type: 'bounty_hunter_gone', reason: 'heat_dropped' });
      }
      return;
    }

    // Spawn at wanted level 4+ (one persistent hunter per target)
    if (!this.bountyHunter && wantedLevel >= 4) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 600 + Math.random() * 200;
      const x = Math.max(60, Math.min(world.WORLD_WIDTH - 60, wanted.x + Math.cos(angle) * dist));
      const y = Math.max(60, Math.min(world.WORLD_HEIGHT - 60, wanted.y + Math.sin(angle) * dist));
      this.bountyHunter = {
        id: 'bounty_hunter_1',
        x, y,
        rotation: Math.atan2(wanted.y - y, wanted.x - x),
        targetId: this.wantedBirdId,
        targetName: wanted.name,
        state: 'pursuing',
        stunUntil: 0,
        offDutyUntil: 0,
        poopHits: 0,
        poopHitResetAt: 0,
        lastCatchAt: 0,
        spawnedAt: now,
      };
      this.events.push({
        type: 'bounty_hunter_spawned',
        targetId: this.wantedBirdId,
        targetName: wanted.name,
        x, y,
      });
      return;
    }

    if (!this.bountyHunter) return;

    const bh = this.bountyHunter;

    // Update target if the most-wanted bird changed
    if (bh.targetId !== this.wantedBirdId) {
      bh.targetId = this.wantedBirdId;
      bh.targetName = wanted.name;
      bh.poopHits = 0;
      bh.state = 'pursuing';
    }

    // Stunned state
    if (bh.state === 'stunned') {
      if (now >= bh.stunUntil) {
        bh.state = 'pursuing';
      }
      return; // don't move while stunned
    }

    // Witness Protection: if target entered WP, BH goes off-duty for the duration
    if (wanted.witnessProtectionUntil > now && bh.state !== 'off_duty') {
      bh.state = 'off_duty';
      bh.offDutyUntil = wanted.witnessProtectionUntil;
    }

    // Off-duty state (Contract Cancel purchased or Witness Protection active)
    if (bh.state === 'off_duty') {
      if (now >= bh.offDutyUntil) {
        bh.state = 'pursuing';
      } else {
        // Wander aimlessly, not threatening
        bh.wanderAngle = (bh.wanderAngle !== undefined ? bh.wanderAngle : Math.random() * Math.PI * 2) + dt * 0.6;
        bh.x += Math.cos(bh.wanderAngle) * 55 * dt;
        bh.y += Math.sin(bh.wanderAngle) * 55 * dt;
        bh.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, bh.x));
        bh.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, bh.y));
        return;
      }
    }

    // Reset poop hit counter if target hasn't been hit recently
    if (bh.poopHits > 0 && now > bh.poopHitResetAt) {
      bh.poopHits = 0;
    }

    // Underground: Bounty Hunter can't follow underground (even pros don't go in sewers)
    if (wanted.inSewer) {
      bh.sewerWanderAngle = (bh.sewerWanderAngle !== undefined ? bh.sewerWanderAngle : Math.random() * Math.PI * 2) + dt * 0.35;
      bh.x += Math.cos(bh.sewerWanderAngle) * 40 * dt;
      bh.y += Math.sin(bh.sewerWanderAngle) * 40 * dt;
      bh.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, bh.x));
      bh.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, bh.y));
      return;
    }
    bh.sewerWanderAngle = undefined;

    // Fog: BH has slightly better sight than cops but still affected
    const fogActive = this.weather && this.weather.type === 'fog';
    const dx = wanted.x - bh.x;
    const dy = wanted.y - bh.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (fogActive && dist > 200) {
      // Semi-professional tracker — slightly better than cops in fog but still loses them
      bh.fogWanderAngle = bh.fogWanderAngle !== undefined ? bh.fogWanderAngle : Math.atan2(dy, dx);
      bh.fogWanderAngle += (Math.random() - 0.5) * 0.35 * dt * 3;
      bh.x += Math.cos(bh.fogWanderAngle) * 110 * dt;
      bh.y += Math.sin(bh.fogWanderAngle) * 110 * dt;
      bh.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, bh.x));
      bh.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, bh.y));
      return;
    }
    if (!fogActive || dist <= 200) bh.fogWanderAngle = undefined;

    // NOTE: Smoke bomb does NOT work on Bounty Hunter — he's a professional, not a city cop.
    // He tracks by scent, not sight. Ghost Mode from Mystery Crate DOES partially work (40% not tracked).
    // EXCEPTION: Blackout + Ghost Mode = FULL INVISIBILITY — even the BH can't track you.
    const ghostActive = wanted.mcGhostModeUntil > now;
    const bhBlackout = !!(this.chaosEvent && this.chaosEvent.type === 'blackout');
    if (ghostActive && bhBlackout) {
      // Full invisibility combo — BH completely loses scent in the darkness
      bh.wanderAngle = (bh.wanderAngle !== undefined ? bh.wanderAngle : Math.atan2(dy, dx)) + (Math.random() - 0.5) * 2.0;
      bh.x += Math.cos(bh.wanderAngle) * 60 * dt;
      bh.y += Math.sin(bh.wanderAngle) * 60 * dt;
      bh.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, bh.x));
      bh.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, bh.y));
      return;
    }
    if (ghostActive && Math.random() < 0.40) {
      // Ghost mode gives a 40% chance each tick of the BH losing the scent briefly
      bh.wanderAngle = (bh.wanderAngle !== undefined ? bh.wanderAngle : Math.atan2(dy, dx)) + (Math.random() - 0.5) * 1.0;
      bh.x += Math.cos(bh.wanderAngle) * 80 * dt;
      bh.y += Math.sin(bh.wanderAngle) * 80 * dt;
      bh.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, bh.x));
      bh.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, bh.y));
      return;
    }

    // Pursue at 160px/s (faster than cop_pigeon at 110, slightly faster than SWAT at 145)
    if (dist > 1) {
      const BH_SPEED = 160;
      bh.x += (dx / dist) * BH_SPEED * dt;
      bh.y += (dy / dist) * BH_SPEED * dt;
      bh.rotation = Math.atan2(dy, dx);
    }
    bh.x = Math.max(10, Math.min(world.WORLD_WIDTH - 10, bh.x));
    bh.y = Math.max(10, Math.min(world.WORLD_HEIGHT - 10, bh.y));

    // Catch: close enough and bird not currently stunned/shielded
    if (dist < 20 && wanted.stunnedUntil <= now && !(wanted.mcRiotShieldUntil > now) && now - bh.lastCatchAt > 8000) {
      bh.lastCatchAt = now;

      // Skill Tree: Ghost Walk — 18% chance to evade a catch
      if (wanted.skillTreeUnlocked && wanted.skillTreeUnlocked.includes('ghost_walk') && Math.random() < 0.18) {
        this.events.push({ type: 'ghost_walk_evade', birdId: wanted.id, birdName: wanted.name, x: bh.x, y: bh.y });
        // Ghost walk stuns the BH for 3 seconds, not just a cop
        bh.state = 'stunned';
        bh.stunUntil = now + 3000;
        bh.poopHits = 0;
        return;
      }

      // Steal 40% of coins — Bounty Hunter takes a bigger cut than a cop
      const stolen = Math.min(500, Math.max(8, Math.floor(wanted.coins * 0.40)));
      wanted.coins = Math.max(0, wanted.coins - stolen);

      // Stun the bird (3.5s base; Iron Wings skill reduces it)
      let stunDur = 3500;
      if (wanted.skillTreeUnlocked && wanted.skillTreeUnlocked.includes('iron_wings')) {
        stunDur = Math.floor(stunDur * 0.65);
      }
      wanted.stunnedUntil = now + stunDur;

      // Wipe combo streak
      wanted.comboCount = 0;
      wanted.comboExpiresAt = 0;

      // Small heat reduction (not a full arrest — he robs, not books)
      const currentHeat = this.heatScores.get(wanted.id) || 0;
      this.heatScores.set(wanted.id, Math.max(0, currentHeat - 15));

      this.events.push({
        type: 'bounty_hunter_caught',
        birdId: wanted.id,
        birdName: wanted.name,
        coinsStolen: stolen,
        x: bh.x, y: bh.y,
      });

      // Bird Flu cross-system: if the caught bird was infected, the Bounty Hunter gets sick!
      // He's a professional but even pros aren't immune to the Bird Flu.
      // 15 seconds of confused wandering — a significant escape window for the target.
      if (wanted.fluUntil > now) {
        bh.state = 'off_duty';
        bh.offDutyUntil = now + 15000;
        bh.wanderAngle = Math.random() * Math.PI * 2;
        this.events.push({
          type: 'flu_bh_infected',
          birdId: wanted.id,
          birdName: wanted.name,
          x: bh.x, y: bh.y,
        });
      }
    }
  }

  // ============================================================
  // POLICE HELICOPTER
  // ============================================================
  _updatePoliceHelicopter(dt, now) {
    // Only relevant when there's a wanted bird
    if (!this.wantedBirdId) {
      if (this.policeHelicopter) {
        this.policeHelicopter = null;
        this.events.push({ type: 'helicopter_gone', reason: 'no_wanted' });
      }
      this.helicopterLevel5Timer = 0;
      return;
    }

    const wanted = this.birds.get(this.wantedBirdId);
    if (!wanted) {
      this.policeHelicopter = null;
      this.helicopterLevel5Timer = 0;
      return;
    }

    const wantedHeat = this.heatScores.get(this.wantedBirdId) || 0;
    const wantedLevel = this._getWantedLevel(wantedHeat);

    // Helicopter only active at level 5; despawn if drops below 4
    if (wantedLevel < 4) {
      if (this.policeHelicopter) {
        this.policeHelicopter = null;
        this.helicopterLevel5Timer = 0;
        this.events.push({ type: 'helicopter_gone', reason: 'heat_dropped' });
      }
      this.helicopterLevel5Timer = 0;
      return;
    }

    // Track how long bird has been at level 5 (gate: must hold level 5 for 15s before spawn)
    if (wantedLevel >= 5) {
      this.helicopterLevel5Timer += dt * 1000;
    } else {
      // Level 4: keep timer but don't increment (helicopter stays once spawned, but needs 15s at L5 to spawn)
      this.helicopterLevel5Timer = Math.max(0, this.helicopterLevel5Timer - dt * 500);
    }

    // Spawn helicopter when level 5 has been held 15+ seconds and no helicopter exists
    if (!this.policeHelicopter && this.helicopterLevel5Timer >= 15000 && wantedLevel >= 5) {
      // Spawn from a random map edge ~800px from target
      const angle = Math.random() * Math.PI * 2;
      const dist = 750 + Math.random() * 200;
      const x = Math.max(80, Math.min(world.WORLD_WIDTH - 80, wanted.x + Math.cos(angle) * dist));
      const y = Math.max(80, Math.min(world.WORLD_HEIGHT - 80, wanted.y + Math.sin(angle) * dist));
      this.policeHelicopter = {
        id: 'police_helicopter_1',
        x, y,
        rotation: Math.atan2(wanted.y - y, wanted.x - x),
        targetId: this.wantedBirdId,
        targetName: wanted.name,
        state: 'pursuing',   // 'pursuing' | 'stunned' | 'hovering' (when target underground/WP)
        poopHits: 0,
        poopHitResetAt: 0,
        lastCatchAt: 0,
        stunUntil: 0,
        hoverX: x,           // position to hover at when target is hidden
        hoverY: y,
        lastKnownX: wanted.x,
        lastKnownY: wanted.y,
        spawnedAt: now,
        spotlighting: false,  // true when within 200px of target — illuminates target on everyone's minimap
      };
      this.events.push({
        type: 'helicopter_spawned',
        targetId: this.wantedBirdId,
        targetName: wanted.name,
        x, y,
      });
      return;
    }

    if (!this.policeHelicopter) return;

    const heli = this.policeHelicopter;

    // Update target if the most-wanted bird changed
    if (heli.targetId !== this.wantedBirdId) {
      heli.targetId = this.wantedBirdId;
      heli.targetName = wanted.name;
      heli.poopHits = 0;
      heli.state = 'pursuing';
    }

    // Stunned state (downed by poop hits)
    if (heli.state === 'stunned') {
      if (now >= heli.stunUntil) {
        heli.state = 'pursuing';
        this.events.push({ type: 'helicopter_recovering', targetId: heli.targetId });
      }
      // Still move slowly while stunned (drifting/spinning)
      heli.x += Math.cos(heli.rotation + Math.PI) * 25 * dt;
      heli.y += Math.sin(heli.rotation + Math.PI) * 25 * dt;
      heli.x = Math.max(30, Math.min(world.WORLD_WIDTH - 30, heli.x));
      heli.y = Math.max(30, Math.min(world.WORLD_HEIGHT - 30, heli.y));
      heli.spotlighting = false;
      return;
    }

    // Reset poop hit counter if no hits in 12s
    if (heli.poopHits > 0 && now > heli.poopHitResetAt) {
      heli.poopHits = 0;
    }

    // Witness Protection: helicopter hovers at last known position, can't lock on
    if (wanted.witnessProtectionUntil > now) {
      heli.state = 'hovering';
      heli.hoverX = heli.lastKnownX;
      heli.hoverY = heli.lastKnownY;
      heli.spotlighting = false;
      // Hover at last known position with gentle drift
      const hx = heli.hoverX - heli.x;
      const hy = heli.hoverY - heli.y;
      const hdist = Math.sqrt(hx * hx + hy * hy);
      if (hdist > 5) {
        heli.x += (hx / hdist) * 40 * dt;
        heli.y += (hy / hdist) * 40 * dt;
      }
      heli.x = Math.max(30, Math.min(world.WORLD_WIDTH - 30, heli.x));
      heli.y = Math.max(30, Math.min(world.WORLD_HEIGHT - 30, heli.y));
      return;
    }

    // Underground: helicopter can't follow but hovers at the manhole entrance area
    if (wanted.inSewer) {
      heli.state = 'hovering';
      // Update hover position to follow the last above-ground position
      const hx = heli.lastKnownX - heli.x;
      const hy = heli.lastKnownY - heli.y;
      const hdist = Math.sqrt(hx * hx + hy * hy);
      if (hdist > 10) {
        heli.x += (hx / hdist) * 50 * dt;
        heli.y += (hy / hdist) * 50 * dt;
      }
      heli.x = Math.max(30, Math.min(world.WORLD_WIDTH - 30, heli.x));
      heli.y = Math.max(30, Math.min(world.WORLD_HEIGHT - 30, heli.y));
      heli.spotlighting = false;
      return;
    }

    // Back to pursuing after hiding
    if (heli.state === 'hovering') {
      heli.state = 'pursuing';
    }

    // Update last known position (above ground, not in WP)
    heli.lastKnownX = wanted.x;
    heli.lastKnownY = wanted.y;

    // Fog: helicopter loses target beyond 280px (airborne but still affected by dense fog)
    // During City Lockdown + fog: helicopter loses trail faster (200px) — rare synergy window
    const fogActive = this.weather && this.weather.type === 'fog';
    const dx = wanted.x - heli.x;
    const dy = wanted.y - heli.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const fogLossThreshold = (fogActive && this.cityLockdown) ? 200 : 280;

    if (fogActive && dist > fogLossThreshold) {
      // Track whether we just lost the trail this tick (to fire the escape alert once)
      if (!heli.fogLostTrail) {
        heli.fogLostTrail = true;
        // Fire personal escape alert to the hunted bird
        const lockdownNote = this.cityLockdown ? ' Lockdown fog is thick — helicopter can\'t see you!' : '';
        this.events.push({
          type: 'helicopter_fog_escape',
          targetId: heli.targetId,
          lockdownBonus: !!this.cityLockdown,
          msg: `🌫️ Helicopter LOST YOUR TRAIL in the fog!${lockdownNote} Move fast!`,
        });
      }
      // Drift toward last known position with angular deviation
      const lkx = heli.lastKnownX - heli.x;
      const lky = heli.lastKnownY - heli.y;
      const lkDist = Math.sqrt(lkx * lkx + lky * lky);
      if (lkDist > 5) {
        const driftAngle = Math.atan2(lky, lkx) + (Math.random() - 0.5) * 0.6;
        heli.x += Math.cos(driftAngle) * 90 * dt;
        heli.y += Math.sin(driftAngle) * 90 * dt;
        heli.rotation = driftAngle;
      }
      heli.x = Math.max(30, Math.min(world.WORLD_WIDTH - 30, heli.x));
      heli.y = Math.max(30, Math.min(world.WORLD_HEIGHT - 30, heli.y));
      heli.spotlighting = false;
      return;
    }

    // Reset fog trail loss flag when helicopter is back in range
    if (heli.fogLostTrail) heli.fogLostTrail = false;

    // NOTE: Smoke bomb DOESN'T work on the helicopter — it's airborne and uses heat-signature tracking.
    // Ghost Mode from Mystery Crate DOES work (40% chance).
    const ghostActive = wanted.mcGhostModeUntil > now;
    if (ghostActive && Math.random() < 0.40) {
      const driftAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;
      heli.x += Math.cos(driftAngle) * 70 * dt;
      heli.y += Math.sin(driftAngle) * 70 * dt;
      heli.x = Math.max(30, Math.min(world.WORLD_WIDTH - 30, heli.x));
      heli.y = Math.max(30, Math.min(world.WORLD_HEIGHT - 30, heli.y));
      heli.spotlighting = false;
      return;
    }

    // Pursue at 145px/s — fast but not faster than the Bounty Hunter (160px/s)
    const HELI_SPEED = 145;
    if (dist > 1) {
      heli.x += (dx / dist) * HELI_SPEED * dt;
      heli.y += (dy / dist) * HELI_SPEED * dt;
      heli.rotation = Math.atan2(dy, dx);
    }
    heli.x = Math.max(30, Math.min(world.WORLD_WIDTH - 30, heli.x));
    heli.y = Math.max(30, Math.min(world.WORLD_HEIGHT - 30, heli.y));

    // Spotlight: helicopter illuminates target when within 200px
    const wasSpotlighting = heli.spotlighting;
    heli.spotlighting = dist < 200;
    if (heli.spotlighting && !wasSpotlighting) {
      // Just locked spotlight on — announce to target
      this.events.push({ type: 'helicopter_spotlight_locked', targetId: heli.targetId, targetName: heli.targetName });
    } else if (!heli.spotlighting && wasSpotlighting) {
      this.events.push({ type: 'helicopter_spotlight_lost', targetId: heli.targetId });
    }

    // Catch: close enough and bird not shielded
    if (dist < 22 && !(wanted.mcRiotShieldUntil > now) && now - heli.lastCatchAt > 10000) {
      heli.lastCatchAt = now;

      // Ghost Walk skill: 18% chance to evade helicopter catch too
      if (wanted.skillTreeUnlocked && wanted.skillTreeUnlocked.includes('ghost_walk') && Math.random() < 0.18) {
        this.events.push({ type: 'ghost_walk_evade', birdId: wanted.id, birdName: wanted.name, x: heli.x, y: heli.y });
        heli.state = 'stunned';
        heli.stunUntil = now + 4000; // ghost walk stuns heli too
        heli.poopHits = 0;
        return;
      }

      // Steal 25% of coins (max 250c)
      const stolen = Math.min(250, Math.max(5, Math.floor(wanted.coins * 0.25)));
      wanted.coins = Math.max(0, wanted.coins - stolen);

      // Stun the bird (5s base; Iron Wings reduces it)
      let stunDur = 5000;
      if (wanted.skillTreeUnlocked && wanted.skillTreeUnlocked.includes('iron_wings')) {
        stunDur = Math.floor(stunDur * 0.65);
      }
      wanted.stunnedUntil = now + stunDur;

      // Wipe combo streak
      wanted.comboCount = 0;
      wanted.comboExpiresAt = 0;

      // Slight heat reduction (partial arrest — disrupted, not booked)
      const currentHeat = this.heatScores.get(wanted.id) || 0;
      this.heatScores.set(wanted.id, Math.max(0, currentHeat - 20));

      this.events.push({
        type: 'helicopter_caught',
        birdId: wanted.id,
        birdName: wanted.name,
        coinsStolen: stolen,
        x: heli.x, y: heli.y,
      });
    }
  }

  // ============================================================
  // CRIME WAVE EVENT
  // ============================================================
  _tickCrimeWave(now) {
    const CRIME_WAVE_DURATION = 2 * 60 * 1000; // 2 minutes

    // Start a new crime wave when timer fires
    if (!this.crimeWave && now >= this.crimeWaveTimer && this.birds.size > 0) {
      this.crimeWave = {
        startedAt: now,
        endsAt: now + CRIME_WAVE_DURATION,
      };
      // Blast every online bird with a personal "brace yourself" event
      for (const bird of this.birds.values()) {
        this.events.push({
          type: 'crime_wave_start',
          endsAt: this.crimeWave.endsAt,
          birdId: bird.id,
        });
      }
      // Also fire a single city-wide event for the feed
      this.events.push({ type: 'crime_wave_start_global', endsAt: this.crimeWave.endsAt });
      // RADIO TOWER × CRIME WAVE: if someone owns the tower, auto-broadcast a crime taunt
      if (this.radioTower.state === 'owned' && this.radioTower.ownerId && this.radioTower.ownerName) {
        const CRIME_TAUNTS = [
          "BIRD CITY IS BURNING — and I'm ON AIR!",
          "Crime pays. Come find me if you want some.",
          "The law is BLIND tonight. I made sure of it.",
          "All cops report: YOU'RE ON MY TURF NOW.",
          "This city belongs to whoever's bold enough to take it.",
        ];
        const taunt = CRIME_TAUNTS[Math.floor(Math.random() * CRIME_TAUNTS.length)];
        this.events.push({
          type: 'tower_broadcast',
          subType: 'taunt',
          ownerName: this.radioTower.ownerName,
          ownerColor: this.radioTower.ownerColor,
          message: taunt,
          isCrimeWaveForced: true,
        });
      }
      // Track for gazette
      this.gazetteStats.crimeWaves++;
      // Reset timer for next crime wave: 40–60 minutes after this one ends
      this.crimeWaveTimer = now + CRIME_WAVE_DURATION + this._randomRange(40 * 60000, 60 * 60000);
    }

    // End the crime wave
    if (this.crimeWave && now >= this.crimeWave.endsAt) {
      this.crimeWave = null;
      this.events.push({ type: 'crime_wave_end' });
    }
  }

  // ============================================================
  // AURORA BOREALIS
  // ============================================================
  _startAurora(now) {
    if (this.auroraTriggeredThisNight) return;
    this.auroraTriggeredThisNight = true;
    const duration = this._randomRange(4 * 60000, 7 * 60000); // 4–7 minutes
    this.aurora = { startedAt: now, endsAt: now + duration, intensity: 1.0 };
    this.events.push({
      type: 'aurora_start',
      endsAt: this.aurora.endsAt,
      message: '✨ AURORA BOREALIS lights up the night sky! +25% XP · Extended Combos · Cosmic Fish appear at the Sacred Pond!',
    });
    // Open the Night Market near the Sacred Pond
    this.nightMarket = { x: this.NIGHT_MARKET_POS.x, y: this.NIGHT_MARKET_POS.y };
    this.events.push({ type: 'night_market_open', x: this.nightMarket.x, y: this.nightMarket.y });
    // Spawn cosmic fish immediately at the pond (bonus fish beyond regular ones)
    for (let i = 0; i < 2; i++) this._spawnCosmicFish();
    // Track for gazette
    if (!this.gazetteStats.auroraCount) this.gazetteStats.auroraCount = 0;
    this.gazetteStats.auroraCount++;
    // Schedule shooting star (30% chance) OR meteor shower (15% chance), fires 15-50s into the aurora
    this.shootingStarTriggeredThisAurora = false;
    this.shootingStar = null;
    this.meteorShowerTriggeredThisAurora = false;
    this.meteorShower = null;
    const starRoll = Math.random();
    if (starRoll < 0.15) {
      // Meteor Shower — rarer, more spectacular: 3 stars simultaneously
      this.shootingStarScheduledAt = null;
      // Use a shared "scheduled at" approach: reuse shootingStarScheduledAt for the timer,
      // but meteorShower will check meteorShowerTriggeredThisAurora separately
      this._meteorShowerScheduledAt = now + this._randomRange(20000, 60000);
    } else if (starRoll < 0.45) {
      // Regular Shooting Star — 30% chance
      this.shootingStarScheduledAt = now + this._randomRange(15000, 50000);
      this._meteorShowerScheduledAt = null;
    } else {
      this.shootingStarScheduledAt = null;
      this._meteorShowerScheduledAt = null;
    }
  }

  _spawnCosmicFish() {
    const POND_POSITIONS = [
      { x: 990, y: 1070 }, { x: 1050, y: 1050 }, { x: 1110, y: 1080 },
      { x: 1020, y: 1130 }, { x: 1080, y: 1125 },
    ];
    const pos = POND_POSITIONS[Math.floor(Math.random() * POND_POSITIONS.length)];
    const id = 'food_cosmic_fish_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
    this.foods.set(id, { id, x: pos.x + (Math.random() - 0.5) * 30, y: pos.y + (Math.random() - 0.5) * 20, type: 'cosmic_fish', value: 90, active: true, respawnAt: null });
    this.pondFishIds.add(id);
  }

  _updateAurora(dt, now) {
    if (!this.aurora) return;
    // Expire aurora
    if (now >= this.aurora.endsAt) {
      this.aurora = null;
      // Close the Night Market when aurora ends
      if (this.nightMarket) {
        this.nightMarket = null;
        this.events.push({ type: 'night_market_close' });
      }
      this.events.push({ type: 'aurora_end', message: '✨ The Aurora Borealis fades. The sky returns to ordinary night.' });
      // Clean up cosmic fish (copy to array first to avoid modifying Set during iteration)
      const cosmicToRemove = Array.from(this.pondFishIds).filter(id => {
        const f = this.foods.get(id);
        return f && f.type === 'cosmic_fish';
      });
      for (const fishId of cosmicToRemove) {
        this.foods.delete(fishId);
        this.pondFishIds.delete(fishId);
      }
      // Clean up any unclaimed shooting star
      if (this.shootingStar) {
        this.events.push({ type: 'shooting_star_expired', x: this.shootingStar.x, y: this.shootingStar.y });
        this.shootingStar = null;
      }
      // Clean up any active meteor shower
      if (this.meteorShower) {
        this.meteorShower = null;
      }
      return;
    }
    // Spawn cosmic fish periodically during aurora (keep 2 in pond at all times)
    const cosmicCount = Array.from(this.pondFishIds).filter(id => {
      const f = this.foods.get(id);
      return f && f.type === 'cosmic_fish' && f.active;
    }).length;
    if (cosmicCount < 2 && Math.random() < 0.005) { // ~0.5% chance per tick = ~2.5% per second
      this._spawnCosmicFish();
    }
    // Fire scheduled shooting star
    if (!this.shootingStarTriggeredThisAurora && this.shootingStarScheduledAt && now >= this.shootingStarScheduledAt) {
      this._spawnShootingStar(now);
    }
    // Fire scheduled meteor shower (3 stars at once!)
    if (!this.meteorShowerTriggeredThisAurora && this._meteorShowerScheduledAt && now >= this._meteorShowerScheduledAt) {
      this._spawnMeteorShower(now);
    }

    // === GANG AURORA RITUAL ===
    // If 3+ members of the SAME gang gather near the Sacred Pond during the aurora,
    // a bonus cosmic fish spawns for each of them + an XP pulse (2-minute cooldown per gang).
    const RITUAL_POND_CX = 1050, RITUAL_POND_CY = 1100;
    const RITUAL_RADIUS = 155;  // px from pond center
    const RITUAL_COOLDOWN_MS = 120000; // 2 minutes
    const gangNearPond = new Map(); // gangId -> [bird, ...]
    for (const b of this.birds.values()) {
      if (!b.gangId || b.inSewer) continue;
      const dx = b.x - RITUAL_POND_CX;
      const dy = b.y - RITUAL_POND_CY;
      if (Math.sqrt(dx * dx + dy * dy) < RITUAL_RADIUS) {
        if (!gangNearPond.has(b.gangId)) gangNearPond.set(b.gangId, []);
        gangNearPond.get(b.gangId).push(b);
      }
    }
    for (const [gangId, members] of gangNearPond) {
      if (members.length < 3) continue;
      const lastRitual = this.gangRitualCooldowns.get(gangId) || 0;
      if (now < lastRitual + RITUAL_COOLDOWN_MS) continue;
      // Ritual fires!
      this.gangRitualCooldowns.set(gangId, now);
      const gang = this.gangs.get(gangId);
      const gangTag = gang ? gang.tag : '???';
      const gangColor = gang ? gang.color : '#ffffff';
      // Spawn one bonus cosmic fish per member + XP pulse
      for (const member of members) {
        this._spawnCosmicFish();
        member.xp += 80;
      }
      this.events.push({
        type: 'gang_aurora_ritual',
        gangId,
        gangTag,
        gangColor,
        memberCount: members.length,
        birdNames: members.map(m => m.name),
        birdIds:   members.map(m => m.id),
      });
      console.log(`[GameEngine] ✨ Gang Aurora Ritual: [${gangTag}] (${members.length} birds) — bonus cosmic fish!`);
    }
  }

  // ============================================================
  // ============================================================
  // SHOOTING STAR — Rare aurora event, Mystery Crate-tier reward
  // ============================================================

  _spawnShootingStar(now) {
    this.shootingStarTriggeredThisAurora = true;
    const LANDING_SPOTS = [
      { x: 1200, y: 1200 }, // park center
      { x: 2350, y: 580 },  // mall top-right
      { x: 280,  y: 300 },  // residential NW
      { x: 2520, y: 1800 }, // downtown
      { x: 1400, y: 2500 }, // docks
      { x: 760,  y: 700 },  // cafe district
      { x: 1900, y: 380 },  // north corridor
      { x: 380,  y: 1750 }, // west side
      { x: 1500, y: 900 },  // central north
    ];
    const spot = LANDING_SPOTS[Math.floor(Math.random() * LANDING_SPOTS.length)];
    // Small random offset so it never lands in the exact same pixel
    const x = Math.max(150, Math.min(world.WORLD_WIDTH - 150, spot.x + (Math.random() - 0.5) * 200));
    const y = Math.max(150, Math.min(world.WORLD_HEIGHT - 150, spot.y + (Math.random() - 0.5) * 200));
    // Streak comes from a random upper direction (top edge of screen)
    const streakAngle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 2); // ~-90° ± 45°
    this.shootingStar = {
      id: 'ss_' + Date.now(),
      x,
      y,
      spawnedAt: now,
      expiresAt: now + 45000, // 45-second claim window
      streakAngle,
    };
    this.events.push({
      type: 'shooting_star_spawn',
      x,
      y,
      streakAngle,
      spawnedAt: now,
      expiresAt: this.shootingStar.expiresAt,
    });
    if (!this.gazetteStats.shootingStars) this.gazetteStats.shootingStars = 0;
    this.gazetteStats.shootingStars++;
  }

  _tickShootingStar(now) {
    if (!this.shootingStar) return;
    // Expire
    if (now >= this.shootingStar.expiresAt) {
      this.events.push({ type: 'shooting_star_expired', x: this.shootingStar.x, y: this.shootingStar.y });
      this.shootingStar = null;
      return;
    }
    // Auto-collect: first non-stunned, above-ground bird within 60px
    for (const bird of this.birds.values()) {
      if (bird.stunnedUntil > now) continue;
      if (bird.inSewer) continue;
      const dx = bird.x - this.shootingStar.x;
      const dy = bird.y - this.shootingStar.y;
      if (Math.sqrt(dx * dx + dy * dy) < 60) {
        this._claimShootingStar(bird, now);
        return;
      }
    }
  }

  _claimShootingStar(bird, now) {
    const star = this.shootingStar;
    this.shootingStar = null;

    // Pick a Mystery Crate-tier item using the same weighted pool
    let roll = Math.random() * this.MYSTERY_CRATE_TOTAL_WEIGHT;
    let item = this.MYSTERY_CRATE_ITEMS[this.MYSTERY_CRATE_ITEMS.length - 1];
    for (const candidate of this.MYSTERY_CRATE_ITEMS) {
      if (roll < candidate.weight) { item = candidate; break; }
      roll -= candidate.weight;
    }

    // Apply item effect (mirrors _claimMysteryCrate)
    switch (item.id) {
      case 'nuke_poop':
        bird.mcNukePoop = true;
        break;
      case 'jet_wings':
        bird.mcJetWingsUntil = now + 15000;
        break;
      case 'coin_cache': {
        const coins = 250 + Math.floor(Math.random() * 200);
        bird.coins += coins;
        this._trackDailyProgress(bird, 'coins_earned', coins);
        item = { ...item, coinsAwarded: coins };
        break;
      }
      case 'riot_shield':
        bird.mcRiotShieldUntil = now + 12000;
        break;
      case 'lightning_rod':
        bird.mcLightningRodUntil = now + 20000;
        break;
      case 'coin_magnet':
        bird.mcMagnetUntil = now + 10000;
        bird.mcMagnetLastPull = 0;
        break;
      case 'ghost_mode':
        bird.mcGhostModeUntil = now + 15000;
        break;
      case 'twister_bomb':
        for (const other of this.birds.values()) {
          if (other.id === bird.id) continue;
          const dx = other.x - bird.x;
          const dy = other.y - bird.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const pushAngle = dist > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
            other.x = Math.max(50, Math.min(world.WORLD_WIDTH - 50, other.x + Math.cos(pushAngle) * 300));
            other.y = Math.max(50, Math.min(world.WORLD_HEIGHT - 50, other.y + Math.sin(pushAngle) * 300));
            other.stunnedUntil = now + 1200;
            other.comboCount = 0;
            other.comboExpiresAt = 0;
          }
        }
        break;
      case 'diamond_poop':
        bird.mcDiamondPoopUntil = now + 20000;
        break;
      case 'broken_crate':
        bird.coins += 75;
        this._trackDailyProgress(bird, 'coins_earned', 75);
        break;
    }

    this._trackDailyProgress(bird, 'star_caught', 1);

    // P5 LEGEND bonus: catching a shooting star blazes a golden comet trail for 30 seconds
    if (bird.prestige >= 5) {
      bird.cometTrailUntil = Math.max(bird.cometTrailUntil || 0, Date.now() + 30000);
      this.events.push({
        type: 'legend_comet_trail',
        birdId: bird.id, birdName: bird.name,
        gangTag: bird.gangTag || null,
      });
    }

    this.events.push({
      type: 'shooting_star_claimed',
      birdId: bird.id,
      birdName: bird.name,
      gangTag: bird.gangTag || null,
      item: {
        id: item.id,
        emoji: item.emoji,
        name: item.name,
        desc: item.desc,
        coinsAwarded: item.coinsAwarded,
      },
      x: star.x,
      y: star.y,
    });
  }

  // ============================================================
  // METEOR SHOWER — Rarer aurora event (15% chance per aurora)
  // Three shooting stars fall simultaneously at different map locations.
  // Each can be claimed independently by different birds.
  // ============================================================

  _spawnMeteorShower(now) {
    this.meteorShowerTriggeredThisAurora = true;
    const ALL_SPOTS = [
      { x: 1200, y: 1200 }, { x: 2350, y: 580 },  { x: 280,  y: 300 },
      { x: 2520, y: 1800 }, { x: 1400, y: 2500 }, { x: 760,  y: 700 },
      { x: 1900, y: 380 },  { x: 380,  y: 1750 }, { x: 1500, y: 900 },
      { x: 2700, y: 1200 }, { x: 600,  y: 2000 }, { x: 1700, y: 1700 },
    ];
    // Pick 3 non-overlapping spots
    const shuffled = ALL_SPOTS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const stars = new Map();
    for (const spot of shuffled) {
      const id = 'ms_' + Date.now() + '_' + Math.random().toFixed(6);
      const x = Math.max(150, Math.min(world.WORLD_WIDTH - 150, spot.x + (Math.random() - 0.5) * 200));
      const y = Math.max(150, Math.min(world.WORLD_HEIGHT - 150, spot.y + (Math.random() - 0.5) * 200));
      const streakAngle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 2);
      stars.set(id, { id, x, y, expiresAt: now + 45000, streakAngle, claimed: false });
    }
    this.meteorShower = { stars };

    // Fire events for all 3 stars at once — epic!
    this.events.push({
      type: 'meteor_shower_start',
      stars: Array.from(stars.values()).map(s => ({ id: s.id, x: s.x, y: s.y, streakAngle: s.streakAngle, expiresAt: s.expiresAt })),
    });
    if (!this.gazetteStats.meteorShowers) this.gazetteStats.meteorShowers = 0;
    this.gazetteStats.meteorShowers++;
    console.log('[GameEngine] ✨🌠 METEOR SHOWER — 3 stars falling simultaneously!');
  }

  _tickMeteorShower(now) {
    if (!this.meteorShower) return;
    const { stars } = this.meteorShower;
    let anyActive = false;
    for (const [starId, star] of stars) {
      if (star.claimed) continue;
      // Expire individual stars
      if (now >= star.expiresAt) {
        stars.delete(starId);
        this.events.push({ type: 'shooting_star_expired', x: star.x, y: star.y });
        continue;
      }
      anyActive = true;
      // Auto-collect: first non-stunned above-ground bird within 60px
      for (const bird of this.birds.values()) {
        if (bird.stunnedUntil > now) continue;
        if (bird.inSewer) continue;
        const dx = bird.x - star.x;
        const dy = bird.y - star.y;
        if (Math.sqrt(dx * dx + dy * dy) < 60) {
          this._claimMeteorStar(bird, star, now);
          star.claimed = true;
          break;
        }
      }
    }
    // End meteor shower when all stars claimed or expired
    if (stars.size === 0 || (!anyActive && [...stars.values()].every(s => s.claimed || now >= s.expiresAt))) {
      this.meteorShower = null;
    }
  }

  _claimMeteorStar(bird, star, now) {
    // Pick a Mystery Crate-tier item
    let roll = Math.random() * this.MYSTERY_CRATE_TOTAL_WEIGHT;
    let item = this.MYSTERY_CRATE_ITEMS[this.MYSTERY_CRATE_ITEMS.length - 1];
    for (const candidate of this.MYSTERY_CRATE_ITEMS) {
      if (roll < candidate.weight) { item = candidate; break; }
      roll -= candidate.weight;
    }
    // Apply item effect (mirrors _claimShootingStar)
    switch (item.id) {
      case 'nuke_poop': bird.mcNukePoop = true; break;
      case 'jet_wings': bird.mcJetWingsUntil = now + 15000; break;
      case 'coin_cache': {
        const coins = 250 + Math.floor(Math.random() * 200);
        bird.coins += coins;
        this._trackDailyProgress(bird, 'coins_earned', coins);
        item = { ...item, coinsAwarded: coins };
        break;
      }
      case 'riot_shield': bird.mcRiotShieldUntil = now + 12000; break;
      case 'lightning_rod': bird.mcLightningRodUntil = now + 20000; break;
      case 'coin_magnet':
        bird.mcMagnetUntil = now + 10000;
        bird.mcMagnetLastPull = 0;
        break;
      case 'ghost_mode': bird.mcGhostModeUntil = now + 15000; break;
      case 'twister_bomb':
        for (const other of this.birds.values()) {
          if (other.id === bird.id) continue;
          const dx = other.x - bird.x;
          const dy = other.y - bird.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const pushAngle = dist > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
            other.x = Math.max(50, Math.min(world.WORLD_WIDTH - 50, other.x + Math.cos(pushAngle) * 300));
            other.y = Math.max(50, Math.min(world.WORLD_HEIGHT - 50, other.y + Math.sin(pushAngle) * 300));
            other.stunnedUntil = now + 1200;
            other.comboCount = 0; other.comboExpiresAt = 0;
          }
        }
        break;
      case 'diamond_poop': bird.mcDiamondPoopUntil = now + 20000; break;
      case 'broken_crate': bird.coins += 75; this._trackDailyProgress(bird, 'coins_earned', 75); break;
    }
    this._trackDailyProgress(bird, 'star_caught', 1);

    // P5 LEGEND bonus: catching a meteor blazes a golden comet trail for 30 seconds
    if (bird.prestige >= 5) {
      bird.cometTrailUntil = Math.max(bird.cometTrailUntil || 0, Date.now() + 30000);
      this.events.push({
        type: 'legend_comet_trail',
        birdId: bird.id, birdName: bird.name,
        gangTag: bird.gangTag || null,
      });
    }

    this.events.push({
      type: 'shooting_star_claimed',
      birdId: bird.id,
      birdName: bird.name,
      gangTag: bird.gangTag || null,
      item: { id: item.id, emoji: item.emoji, name: item.name, desc: item.desc, coinsAwarded: item.coinsAwarded },
      x: star.x, y: star.y,
      isMeteor: true,
    });
    console.log(`[GameEngine] 🌠 Meteor star claimed by ${bird.name} → ${item.name}`);
  }

  // ============================================================
  // CITY LOCKDOWN + MOST WANTED BOARD
  // When 3+ birds simultaneously reach Wanted Level 3+, the city
  // goes into a 90-second lockdown: 1.5× crime rewards, extra cops,
  // and National Guard elite units deploy against each criminal.
  // ============================================================

  _updateCityLockdown(dt, now) {
    // Rebuild top-3 wanted list every frame (heatScores is small, so this is cheap)
    // Count birds at level 3+ for lockdown trigger
    const criminals = [];
    for (const [birdId, heat] of this.heatScores) {
      const bird = this.birds.get(birdId);
      if (!bird) continue;
      const level = this._getWantedLevel(heat);
      if (level >= 1) {
        criminals.push({ birdId, name: bird.name, gangTag: bird.gangTag || null, heat, level });
      }
    }
    // Sort descending by heat, take top 3
    criminals.sort((a, b) => b.heat - a.heat);
    this.wantedTopThree = criminals.slice(0, 3);

    // Lockdown: trigger when 3+ birds are at level 3+ simultaneously
    const level3Count = criminals.filter(c => c.level >= 3).length;
    const lockdownCooldownExpired = !this.lastLockdownEnd || (now - this.lastLockdownEnd > 180000); // 3 min cooldown

    if (!this.cityLockdown && level3Count >= 3 && lockdownCooldownExpired) {
      // Initiate lockdown
      this.cityLockdown = {
        startedAt: now,
        endsAt: now + 90000, // 90 seconds
        triggerCount: level3Count,
        ngSpawnDone: false,
      };
      this.gazetteStats.cityLockdowns = (this.gazetteStats.cityLockdowns || 0) + 1;
      this.events.push({ type: 'city_lockdown_start', count: level3Count });
      console.log(`[Lockdown] City Lockdown initiated — ${level3Count} criminals at Wanted 3+`);
    }

    // Check if lockdown should end
    if (this.cityLockdown) {
      if (now >= this.cityLockdown.endsAt || level3Count < 1) {
        // End lockdown — clear all national guard
        this.nationalGuard.clear();
        this.cityLockdown = null;
        this.lastLockdownEnd = now;
        this.events.push({ type: 'city_lockdown_end' });
        console.log('[Lockdown] City Lockdown ended');
        return;
      }

      // Spawn National Guard once per lockdown (3 agents, one per top criminal)
      if (!this.cityLockdown.ngSpawnDone && this.wantedTopThree.length >= 3) {
        this.cityLockdown.ngSpawnDone = true;
        const edgePositions = [
          { x: this._randomRange(200, 800),  y: 50 },
          { x: this._randomRange(2200, 2800), y: 50 },
          { x: 50,  y: this._randomRange(1000, 2000) },
        ];
        for (let i = 0; i < Math.min(3, this.wantedTopThree.length); i++) {
          const criminal = this.wantedTopThree[i];
          const spawnPos = edgePositions[i];
          const ngId = 'ng_' + (++this._ngIdCounter);
          this.nationalGuard.set(ngId, {
            id: ngId,
            x: spawnPos.x,
            y: spawnPos.y,
            rotation: 0,
            targetId: criminal.birdId,
            targetName: criminal.name,
            state: 'pursuing',   // 'pursuing' | 'stunned' | 'off_duty'
            speed: 135,          // faster than SWAT (145px/s = same, they're equal threat)
            poopHits: 0,         // need 5 poop hits to stun (tough)
            poopHitResetAt: 0,
            stunUntil: 0,
            lastCatchAt: 0,
            wanderAngle: Math.random() * Math.PI * 2,
          });
        }
        this.events.push({ type: 'national_guard_deployed', count: this.nationalGuard.size });
      }
    }
  }

  _updateNationalGuard(dt, now) {
    if (this.nationalGuard.size === 0) return;

    for (const [ngId, ng] of this.nationalGuard) {
      // Remove if target disconnected or wanted level cleared
      const target = this.birds.get(ng.targetId);
      if (!target || (this.heatScores.get(ng.targetId) || 0) < this.WANTED_THRESHOLDS[2]) {
        // Target no longer criminal enough — pick a new target from wantedTopThree
        const newTarget = this.wantedTopThree.find(c => c.level >= 3 &&
          !Array.from(this.nationalGuard.values()).some(other => other.id !== ngId && other.targetId === c.birdId));
        if (newTarget) {
          ng.targetId = newTarget.birdId;
          ng.targetName = newTarget.name;
        } else {
          this.nationalGuard.delete(ngId);
          continue;
        }
      }

      const targetBird = this.birds.get(ng.targetId);
      if (!targetBird) continue;

      // Reset stun
      if (ng.state === 'stunned' && now >= ng.stunUntil) {
        ng.state = 'pursuing';
        ng.poopHits = 0;
      }
      if (ng.state !== 'pursuing') continue;

      // Fog: partially confused at >220px
      let effectiveSpeed = ng.speed;
      if (this.weather && this.weather.type === 'fog' && this.weather.intensity > 0.3) {
        const fdx = ng.x - targetBird.x;
        const fdy = ng.y - targetBird.y;
        if (Math.sqrt(fdx * fdx + fdy * fdy) > 220) {
          effectiveSpeed *= 0.6;
        }
      }

      // Underground: hover at manhole like bounty hunter (can't follow)
      if (targetBird.inSewer) {
        // Hover in place, slight drift
        ng.wanderAngle += (Math.random() - 0.5) * 0.4;
        ng.x += Math.cos(ng.wanderAngle) * effectiveSpeed * 0.3 * dt;
        ng.y += Math.sin(ng.wanderAngle) * effectiveSpeed * 0.3 * dt;
        ng.x = Math.max(50, Math.min(this.worldWidth - 50, ng.x));
        ng.y = Math.max(50, Math.min(this.worldHeight - 50, ng.y));
        continue;
      }

      // Move toward target
      const dx = targetBird.x - ng.x;
      const dy = targetBird.y - ng.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        ng.rotation = Math.atan2(dy, dx);
        const moveSpeed = Math.min(effectiveSpeed * dt, dist);
        ng.x += (dx / dist) * moveSpeed;
        ng.y += (dy / dist) * moveSpeed;
      }
      ng.x = Math.max(50, Math.min(this.worldWidth - 50, ng.x));
      ng.y = Math.max(50, Math.min(this.worldHeight - 50, ng.y));

      // Catch: within 22px AND cooldown expired
      if (dist < 22 && now - ng.lastCatchAt > 8000) {
        ng.lastCatchAt = now;
        // Steal 20% of coins (max 200c)
        const stolen = Math.min(200, Math.floor(targetBird.coins * 0.20));
        targetBird.coins = Math.max(0, targetBird.coins - stolen);
        // Stun target 3.5s (Iron Wings skill reduces)
        let stunDur = 3500;
        if (targetBird.skillTreeUnlocked && targetBird.skillTreeUnlocked.includes('iron_wings')) {
          stunDur = Math.floor(stunDur * 0.65);
        }
        targetBird.stunnedUntil = now + stunDur;
        // Wipe combo
        targetBird.comboCount = 0;
        targetBird.comboExpiresAt = 0;
        // Ghost Walk: 18% evade chance
        let evaded = false;
        if (targetBird.skillTreeUnlocked && targetBird.skillTreeUnlocked.includes('ghost_walk')) {
          if (Math.random() < 0.18) {
            evaded = true;
            ng.stunUntil = now + 3000;
            ng.state = 'stunned';
            this.events.push({ type: 'ghost_walk_evade', birdId: targetBird.id });
          }
        }
        if (!evaded) {
          this.events.push({ type: 'ng_caught', birdId: targetBird.id, ngId, stolen, targetName: targetBird.name });
        }
      }
    }
  }

  // ============================================================
  // SEAGULL INVASION — coastal raiders who steal food en masse
  // ============================================================

  _updateSeagullInvasion(dt, now) {
    // Spawn timer — only when players are online
    if (!this.seagullInvasion && now >= this.seagullTimer && this.birds.size > 0) {
      this._spawnSeagullInvasion(now);
    }

    if (!this.seagullInvasion) return;

    const invasion = this.seagullInvasion;

    // Check invasion timeout (90s)
    if (now >= invasion.endsAt) {
      this._endSeagullInvasion(now, 'timeout');
      return;
    }

    const W = 3000, H = 3000; // world bounds

    for (const sg of invasion.seagulls.values()) {
      if (sg.state === 'dead') continue;

      if (sg.state === 'fleeing') {
        // Fast flee toward target edge
        const dx = sg._fleeTargetX - sg.x;
        const dy = sg._fleeTargetY - sg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20 || sg.x < -80 || sg.x > W + 80 || sg.y < -80 || sg.y > H + 80) {
          sg.state = 'dead';
          continue;
        }
        const spd = sg.fleeSpeed * dt;
        sg.x += (dx / dist) * spd;
        sg.y += (dy / dist) * spd;
        sg.rotation = Math.atan2(dy, dx);
        continue;
      }

      if (sg.state === 'carrying') {
        // Fly toward map edge with the stolen food
        const dx = sg._fleeTargetX - sg.x;
        const dy = sg._fleeTargetY - sg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20 || sg.x < -80 || sg.x > W + 80 || sg.y < -80 || sg.y > H + 80) {
          sg.state = 'dead';
          continue;
        }
        const spd = sg.speed * dt;
        sg.x += (dx / dist) * spd;
        sg.y += (dy / dist) * spd;
        sg.rotation = Math.atan2(dy, dx);
        continue;
      }

      if (sg.state === 'stealing') {
        // Count down the steal timer
        sg.stealTimer -= dt;
        if (sg.stealTimer <= 0) {
          // Steal complete — remove the food and start carrying
          const food = this.foods.get(sg.targetFoodId);
          if (food) {
            food.active = false;
            food.respawnAt = now + 20000;
            sg.carriedFoodType = food.type;
          }
          sg.targetFoodId = null;
          sg.state = 'carrying';
          // Pick flee direction toward nearest map edge
          const edgeTarget = this._seagullEdgeTarget(sg.x, sg.y);
          sg._fleeTargetX = edgeTarget.x;
          sg._fleeTargetY = edgeTarget.y;
          this.events.push({ type: 'seagull_stole_food', x: sg.x, y: sg.y, foodType: sg.carriedFoodType });
        }
        // Hover in place while stealing
        continue;
      }

      // state === 'swooping' — find and move toward a food item
      // Check if current target is still valid
      if (sg.targetFoodId) {
        const food = this.foods.get(sg.targetFoodId);
        if (!food || !food.active) {
          sg.targetFoodId = null; // food gone, re-acquire
        }
      }

      // Acquire a new food target if needed
      if (!sg.targetFoodId) {
        // Find the nearest active food item not already targeted by another seagull
        const targeted = new Set();
        for (const other of invasion.seagulls.values()) {
          if (other.id !== sg.id && other.targetFoodId) targeted.add(other.targetFoodId);
        }
        // Food Festival × Seagull Invasion: seagulls target festival food FIRST (tastier!)
        const isFoodFestival = !!(this.chaosEvent && this.chaosEvent.type === 'food_festival');
        let bestFood = null, bestDist = Infinity;
        let festivalBestFood = null, festivalBestDist = Infinity;
        // First pass: combine main foods + chaos event foods
        const allFoodSources = [...this.foods.values(), ...(isFoodFestival ? [...this.chaosEventFoods.values()] : [])];
        for (const food of allFoodSources) {
          if (!food.active || targeted.has(food.id)) continue;
          if (food.type === 'worm' || food.type === 'water_puddle') continue; // skip weather foods
          const fdx = food.x - sg.x;
          const fdy = food.y - sg.y;
          const d = Math.sqrt(fdx * fdx + fdy * fdy);
          if (food.isFestival && d < festivalBestDist) { festivalBestDist = d; festivalBestFood = food; }
          if (d < bestDist) { bestDist = d; bestFood = food; }
        }
        // Prefer festival food within 600px (seagulls will divert for the premium stuff)
        if (isFoodFestival && festivalBestFood && festivalBestDist < 600) {
          bestFood = festivalBestFood;
          if (!sg._announcedFestivalRaid) {
            sg._announcedFestivalRaid = true;
            this.events.push({ type: 'seagull_festival_raid', x: sg.x, y: sg.y });
          }
        }
        if (bestFood) {
          sg.targetFoodId = bestFood.id;
        } else {
          // No food — just flee
          sg.state = 'fleeing';
          const edgeTarget = this._seagullEdgeTarget(sg.x, sg.y);
          sg._fleeTargetX = edgeTarget.x;
          sg._fleeTargetY = edgeTarget.y;
          continue;
        }
      }

      const targetFood = this.foods.get(sg.targetFoodId);
      if (!targetFood) continue;

      const fdx = targetFood.x - sg.x;
      const fdy = targetFood.y - sg.y;
      const foodDist = Math.sqrt(fdx * fdx + fdy * fdy);

      if (foodDist < 28) {
        // Arrived at food — start stealing (1.5-second steal action)
        sg.state = 'stealing';
        sg.stealTimer = 1.5;
        sg.x = targetFood.x;
        sg.y = targetFood.y;
      } else {
        // Move toward food
        // Blizzard × Seagull Invasion: seagulls slowed −20% by the cold (easier to intercept!)
        const blizzardSlow = (this.weather && this.weather.type === 'blizzard') ? 0.80 : 1.0;
        const spd = sg.speed * blizzardSlow * dt;
        sg.x += (fdx / foodDist) * spd;
        sg.y += (fdy / foodDist) * spd;
        sg.rotation = Math.atan2(fdy, fdx);
      }
    }

    // Clean up dead seagulls from map
    for (const [id, sg] of invasion.seagulls.entries()) {
      if (sg.state === 'dead') invasion.seagulls.delete(id);
    }

    // If all seagulls gone (escaped or dead) — end invasion quietly
    if (invasion.seagulls.size === 0 && !invasion.repelBonusGiven) {
      this._endSeagullInvasion(now, 'all_gone');
    }
  }

  _spawnSeagullInvasion(now) {
    const W = 3000, H = 3000;
    const numSeagulls = 8 + Math.floor(Math.random() * 3); // 8-10
    const seagulls = new Map();

    // Seagulls enter from a random coastal edge (right or bottom edges = "coast")
    const edges = ['right', 'bottom', 'top'];
    const chosenEdge = edges[Math.floor(Math.random() * edges.length)];

    for (let i = 0; i < numSeagulls; i++) {
      const id = 'seagull_' + (++this._seagullIdCounter);
      let x, y;
      if (chosenEdge === 'right') {
        x = W + 40 + Math.random() * 60;
        y = 200 + Math.random() * (H - 400);
      } else if (chosenEdge === 'bottom') {
        x = 200 + Math.random() * (W - 400);
        y = H + 40 + Math.random() * 60;
      } else {
        x = 200 + Math.random() * (W - 400);
        y = -40 - Math.random() * 60;
      }

      // Flee direction is back toward the spawn edge
      const edgeTarget = this._seagullEdgeTarget(x, y);

      seagulls.set(id, {
        id,
        x, y,
        rotation: 0,
        speed: 130 + Math.random() * 20, // 130-150px/s — fast!
        fleeSpeed: 180,
        state: 'swooping',
        hp: 2,
        targetFoodId: null,
        carriedFoodType: null,
        stealTimer: 0,
        _fleeTargetX: edgeTarget.x,
        _fleeTargetY: edgeTarget.y,
        spawnedAt: now,
      });
    }

    this.seagullInvasion = {
      seagulls,
      startedAt: now,
      endsAt: now + 90000, // 90 seconds
      repelBonusGiven: false,
    };

    this.events.push({ type: 'seagull_invasion_start', count: numSeagulls });
    this.gazetteStats.seagullInvasions = (this.gazetteStats.seagullInvasions || 0) + 1;
    console.log(`[Seagull] Invasion started — ${numSeagulls} seagulls from ${chosenEdge} edge`);
  }

  _seagullEdgeTarget(x, y) {
    const W = 3000, H = 3000;
    // Find the nearest map edge and return a point beyond it
    const dLeft   = x;
    const dRight  = W - x;
    const dTop    = y;
    const dBottom = H - y;
    const minDist = Math.min(dLeft, dRight, dTop, dBottom);
    if (minDist === dRight)  return { x: W + 120, y };
    if (minDist === dBottom) return { x, y: H + 120 };
    if (minDist === dLeft)   return { x: -120, y };
    return { x, y: -120 }; // top
  }

  _checkSeagullInvasionVictory(now) {
    if (!this.seagullInvasion || this.seagullInvasion.repelBonusGiven) return;
    const aliveSeagulls = Array.from(this.seagullInvasion.seagulls.values()).filter(sg => sg.state !== 'dead');
    if (aliveSeagulls.length === 0) {
      this.seagullInvasion.repelBonusGiven = true;
      // Big reward for all online birds!
      for (const bird of this.birds.values()) {
        bird.xp += 150;
        bird.coins += 60;
        const newLevel = world.getLevelFromXP(bird.xp);
        if (newLevel !== bird.level) { bird.level = newLevel; bird.type = world.getBirdTypeForLevel(newLevel); }
        this.events.push({ type: 'seagull_invasion_repelled_reward', birdId: bird.id, xp: 150, coins: 60 });
      }
      this.events.push({ type: 'seagull_invasion_repelled' });
      this.seagullTimer = now + this._randomRange(25 * 60000, 35 * 60000);
      console.log('[Seagull] Invasion REPELLED! Rewards given to all birds.');
      setTimeout(() => { this.seagullInvasion = null; }, 3000);
    }
  }

  _endSeagullInvasion(now, reason) {
    if (!this.seagullInvasion) return;
    if (reason === 'timeout') {
      // Count surviving seagulls that stole food
      const carrierCount = Array.from(this.seagullInvasion.seagulls.values()).filter(sg => sg.state === 'carrying').length;
      this.events.push({ type: 'seagull_invasion_fled', carrierCount });
    }
    this.seagullInvasion = null;
    this.seagullTimer = now + this._randomRange(25 * 60000, 35 * 60000);
    console.log(`[Seagull] Invasion ended (${reason})`);
  }

  // ============================================================
  // BIRD ROYALE SPECTATOR CHEER
  // ============================================================

  _handleRoyaleCheer(bird, action, now) {
    if (!this.birdRoyale || this.birdRoyale.state !== 'active') return;
    if (!bird.royaleSpectator) return;
    if ((bird.royaleCheerCooldown || 0) > now) return;

    const targetBirdId = action.targetBirdId;
    if (!targetBirdId || typeof targetBirdId !== 'string') return;
    const participant = this.birdRoyale.participants.get(targetBirdId);
    if (!participant || !participant.alive) return;
    const targetBird = this.birds.get(targetBirdId);
    if (!targetBird) return;

    const foodGain = 8;
    targetBird.food = Math.min(100, targetBird.food + foodGain);
    bird.royaleCheerCooldown = now + 15000; // 15-second cooldown

    this.events.push({
      type: 'royale_cheer_received',
      birdId: targetBirdId,
      targetName: targetBird.name,
      cheerName: bird.name,
      foodGain,
    });
    this.events.push({
      type: 'royale_cheer_city',
      targetName: targetBird.name,
      cheerName: bird.name,
    });
    console.log(`[BirdRoyale] ${bird.name} cheered for ${targetBird.name} (+${foodGain} food)`);
  }

  // ============================================================
  // BIRD ROYALE — shrinking zone battle royal
  // ============================================================

  _tickBirdRoyale(dt, now) {
    const WORLD_W = 3000;
    const WORLD_H = 3000;
    const CENTER_X = WORLD_W / 2;   // 1500
    const CENTER_Y = WORLD_H / 2;   // 1500
    const START_RADIUS = 1420;      // covers almost the whole map
    const END_RADIUS = 160;         // final panic zone at city center
    const SHRINK_DURATION = 3 * 60 * 1000; // 3 minutes
    const WARNING_DURATION = 2 * 60 * 1000; // 2 min warning before start
    const FOOD_DRAIN_RATE = 6;       // food lost per second outside zone
    const DRAIN_INTERVAL = 1000;     // drain once per second

    // ── TRIGGER WARNING PHASE ──
    if (!this.birdRoyale && now >= this.birdRoyaleTimer && this.birds.size >= 1) {
      const startAt = now + WARNING_DURATION;
      this.birdRoyale = {
        state: 'warning',
        startAt,
        endsAt: startAt + SHRINK_DURATION,
        centerX: CENTER_X,
        centerY: CENTER_Y,
        startRadius: START_RADIUS,
        endRadius: END_RADIUS,
        currentRadius: START_RADIUS,
        participants: new Map(),  // birdId -> { name, alive, eliminatedAt, gangTag, gangColor }
        pot: 0,
        zoneDrainTimers: new Map(), // birdId -> lastDrainAt
        winner: null,
        survivorXpGiven: false,
      };
      for (const bird of this.birds.values()) {
        this.events.push({
          type: 'royale_warning',
          birdId: bird.id,
          startAt,
          warningDuration: WARNING_DURATION,
        });
      }
      this.events.push({ type: 'royale_warning_global', startAt });
      console.log('[BirdRoyale] Warning phase started. Royale begins in 2 min.');
    }

    if (!this.birdRoyale) return;
    const r = this.birdRoyale;

    // ── START ACTIVE PHASE ──
    if (r.state === 'warning' && now >= r.startAt) {
      // Need at least 2 participants to run; if only 1 online, still start (solo survival)
      // Register all currently online birds as participants
      for (const bird of this.birds.values()) {
        r.participants.set(bird.id, {
          name: bird.name,
          alive: true,
          eliminatedAt: null,
          gangTag: bird.gangTag || null,
          gangColor: bird.gangColor || null,
        });
        r.zoneDrainTimers.set(bird.id, now);
      }
      r.state = 'active';
      r.currentRadius = START_RADIUS;

      for (const bird of this.birds.values()) {
        this.events.push({
          type: 'royale_start',
          birdId: bird.id,
          endsAt: r.endsAt,
          participantCount: r.participants.size,
        });
      }
      this.events.push({
        type: 'royale_start_global',
        endsAt: r.endsAt,
        participantCount: r.participants.size,
      });
      console.log(`[BirdRoyale] Active phase started! ${r.participants.size} participants.`);
    }

    // ── ACTIVE PHASE TICK ──
    if (r.state === 'active') {
      // Shrink zone linearly
      const elapsed = now - r.startAt;
      const shrinkProg = Math.min(1.0, elapsed / SHRINK_DURATION);
      r.currentRadius = START_RADIUS - (START_RADIUS - END_RADIUS) * shrinkProg;

      // Count alive participants
      let aliveCount = 0;
      let lastAliveId = null;
      for (const [bId, p] of r.participants) {
        if (p.alive) { aliveCount++; lastAliveId = bId; }
      }

      // Apply zone drain to birds outside the safe zone
      for (const bird of this.birds.values()) {
        if (bird.inSewer) continue; // sewer birds get drained too (can't hide to win)

        const dx = bird.x - r.centerX;
        const dy = bird.y - r.centerY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const outsideZone = distFromCenter > r.currentRadius;

        if (outsideZone) {
          // Drain food every second
          const lastDrain = r.zoneDrainTimers.get(bird.id) || 0;
          if (now - lastDrain >= DRAIN_INTERVAL) {
            r.zoneDrainTimers.set(bird.id, now);
            bird.food = Math.max(0, bird.food - FOOD_DRAIN_RATE);
            // Tell client they're outside the zone
            this.events.push({ type: 'royale_zone_damage', birdId: bird.id, foodLeft: bird.food });

            // Elimination: food hits 0 outside the zone
            if (bird.food <= 0) {
              const participant = r.participants.get(bird.id);
              if (participant && participant.alive) {
                participant.alive = false;
                participant.eliminatedAt = now;
                aliveCount--;

                // Penalty: lose 15% of coins (mild)
                const coinLoss = Math.min(Math.floor(bird.coins * 0.15), 120);
                bird.coins = Math.max(0, bird.coins - coinLoss);
                // Warp to zone edge (push them just inside)
                const angle = Math.atan2(dy, dx);
                bird.x = r.centerX + Math.cos(angle) * (r.currentRadius * 0.85);
                bird.y = r.centerY + Math.sin(angle) * (r.currentRadius * 0.85);
                bird.vx = 0; bird.vy = 0;
                bird.food = 20; // small food top-up on respawn so they can move
                // Mark as spectator so they can cheer for survivors
                bird.royaleSpectator = true;
                bird.royaleCheerCooldown = 0;

                this.events.push({
                  type: 'royale_eliminated',
                  birdId: bird.id,
                  name: bird.name,
                  coinLoss,
                  aliveCount,
                  participantCount: r.participants.size,
                });
                console.log(`[BirdRoyale] ${bird.name} eliminated! ${aliveCount} left. Now spectating.`);
              }
            }
          }
        } else {
          // Reset drain timer while inside zone (grace reset)
          r.zoneDrainTimers.set(bird.id, now);
        }
      }

      // Also handle birds who registered but are now disconnected — auto-eliminate after 20s of being offline
      for (const [bId, p] of r.participants) {
        if (!p.alive) continue;
        if (!this.birds.has(bId)) {
          // Bird disconnected mid-royale — eliminate them
          p.alive = false;
          p.eliminatedAt = now;
          aliveCount--;
          this.events.push({
            type: 'royale_eliminated',
            name: p.name,
            birdId: bId,
            coinLoss: 0,
            aliveCount,
            participantCount: r.participants.size,
            disconnected: true,
          });
        }
      }

      // ── WINNER CHECK ──
      if (aliveCount <= 1 || now >= r.endsAt) {
        // Find winner (last alive or most recently online if time ran out)
        let winnerId = null;
        let winnerBird = null;
        for (const [bId, p] of r.participants) {
          if (p.alive && this.birds.has(bId)) {
            winnerId = bId;
            winnerBird = this.birds.get(bId);
            break;
          }
        }

        if (winnerBird) {
          winnerBird.xp += 500;
          winnerBird.coins += 400;
          // Inline level-up check
          const wNewLevel = world.getLevelFromXP(winnerBird.xp);
          const wNewType = world.getBirdTypeForLevel(wNewLevel);
          if (wNewType !== winnerBird.type) {
            winnerBird.type = wNewType;
            this.events.push({ type: 'evolve', birdId: winnerId, name: winnerBird.name, birdType: wNewType });
          }
          winnerBird.level = wNewLevel;
          r.winner = { id: winnerId, name: winnerBird.name, gangTag: winnerBird.gangTag || null };
          this.events.push({
            type: 'royale_winner',
            birdId: winnerId,
            name: winnerBird.name,
            gangTag: winnerBird.gangTag || null,
            xpGain: 500,
            coinGain: 400,
            participantCount: r.participants.size,
          });
          // 🏆 Champion Badge — session-only trophy visible on nametag
          winnerBird.royaleChampBadge = true;
          this._trackDailyProgress(winnerBird, 'royale_win', 1);

          // 🗺️ Gang Territory Royale Bonus — 5-min 1.5× capture power for winning gang
          if (winnerBird.gangId) {
            this.gangRoyaleBonus = {
              gangId: winnerBird.gangId,
              gangTag: winnerBird.gangTag || '???',
              gangName: winnerBird.gangName || 'Unknown Gang',
              bonusUntil: now + 5 * 60 * 1000,
            };
            this.events.push({
              type: 'royale_gang_territory_bonus',
              gangId: winnerBird.gangId,
              gangTag: winnerBird.gangTag || '???',
              gangName: winnerBird.gangName || 'Unknown Gang',
              winnerName: winnerBird.name,
              bonusUntil: this.gangRoyaleBonus.bonusUntil,
            });
            console.log(`[BirdRoyale] Gang territory bonus for [${winnerBird.gangTag}] — 5 min 1.5× capture power`);
          }

          console.log(`[BirdRoyale] Winner: ${winnerBird.name}! +500 XP +400c 🏆`);
        } else {
          // No winner (everyone eliminated or nobody survived)
          this.events.push({ type: 'royale_no_winner', participantCount: r.participants.size });
        }

        r.state = 'ended';
        // Reset royale timer: 35-50 min after this one ends
        this.birdRoyaleTimer = now + this._randomRange(35 * 60000, 50 * 60000);
        // Clear royale after 10 seconds (let HUD show results), also clear spectator status
        setTimeout(() => {
          this.birdRoyale = null;
          for (const b of this.birds.values()) {
            b.royaleSpectator = false;
            b.royaleCheerCooldown = 0;
          }
        }, 10000);
      }
    }
  }

  // ============================================================
  // DONUT COP SYSTEM
  // ============================================================

  _updateDonutCop(now) {
    const dc = this.donutCop;
    if (!dc) return;

    // Handle stun recovery first
    if (dc.state === 'stunned' && now >= dc.stunUntil) {
      dc.state = 'alert';
      dc.stateEndsAt = now + this._randomRange(20000, 35000); // back on duty
      this.events.push({ type: 'donut_cop_state', state: 'alert' });
      return;
    }
    if (dc.state === 'stunned') return; // still stunned, nothing to do

    // Transition between eating/alert states
    if (now >= dc.stateEndsAt) {
      if (dc.state === 'alert') {
        dc.state = 'eating';
        dc.stateEndsAt = now + this._randomRange(10000, 15000); // eat for 10-15s
        this.events.push({ type: 'donut_cop_state', state: 'eating' });
      } else if (dc.state === 'eating') {
        dc.state = 'alert';
        dc.stateEndsAt = now + this._randomRange(25000, 40000); // alert for 25-40s
        this.events.push({ type: 'donut_cop_state', state: 'alert' });
      }
    }
  }

  _handleDonutBribe(bird, now) {
    const dc = this.donutCop;
    if (!dc) return;

    // Must be near the cop
    const dx = bird.x - dc.x;
    const dy = bird.y - dc.y;
    if (Math.sqrt(dx * dx + dy * dy) > 95) {
      this.events.push({ type: 'donut_bribe_fail', birdId: bird.id, reason: 'too_far' });
      return;
    }

    // Cop must be eating
    if (dc.state !== 'eating') {
      this.events.push({ type: 'donut_bribe_fail', birdId: bird.id, reason: 'not_eating' });
      return;
    }

    const currentHeat = this.heatScores.get(bird.id) || 0;
    const wantedLevel = this._getWantedLevel(currentHeat);

    // Nothing to bribe if not wanted
    if (wantedLevel === 0) {
      this.events.push({ type: 'donut_bribe_fail', birdId: bird.id, reason: 'no_heat' });
      return;
    }

    // Cost: 50c per current wanted star level (1 star=50c, 5 stars=250c)
    const cost = 50 * wantedLevel;
    if (bird.coins < cost) {
      this.events.push({ type: 'donut_bribe_fail', birdId: bird.id, reason: 'no_coins', cost });
      return;
    }

    // Calculate heat threshold for the next lower wanted level
    // Thresholds: 10, 25, 50, 100, 200
    const THRESHOLDS = [0, 10, 25, 50, 100, 200];
    const targetLevel = Math.max(0, wantedLevel - 1);
    // Drop heat to just below the threshold of the current level
    const newHeat = Math.max(0, THRESHOLDS[wantedLevel] - 1);
    this.heatScores.set(bird.id, newHeat);

    bird.coins -= cost;
    bird.xp += 25; // small XP for doing crime correctly

    // Track daily challenge
    this._trackDailyProgress(bird, 'donut_bribe', 1);

    this.events.push({
      type: 'donut_bribe_success',
      birdId: bird.id,
      birdName: bird.name,
      cost,
      oldLevel: wantedLevel,
      newLevel: targetLevel,
    });

    console.log(`[DonutCop] ${bird.name} bribed the cop for ${cost}c — heat dropped from ⭐${wantedLevel} to ⭐${targetLevel}`);
  }

  // === VENDING MACHINE POOP POWER-UPS ===
  _handleVendingBuy(bird, machineIdx, now) {
    const machines = world.VENDING_MACHINES;
    if (machineIdx === undefined || machineIdx < 0 || machineIdx >= machines.length) return;
    const machine = machines[machineIdx];

    // Proximity check (70px)
    const dx = bird.x - machine.x;
    const dy = bird.y - machine.y;
    if (Math.sqrt(dx * dx + dy * dy) > 70) {
      this.events.push({ type: 'vend_fail', birdId: bird.id, reason: 'too_far' });
      return;
    }

    // Cooldown check (12s per machine)
    const lastUse = bird.vpMachineCooldowns[machineIdx] || 0;
    if (now - lastUse < 12000) {
      const secsLeft = Math.ceil((12000 - (now - lastUse)) / 1000);
      this.events.push({ type: 'vend_fail', birdId: bird.id, reason: 'cooldown', secsLeft });
      return;
    }

    // Already have an effect queued?
    if (bird.vpPoopEffect) {
      this.events.push({ type: 'vend_fail', birdId: bird.id, reason: 'already_loaded' });
      return;
    }

    // Cost
    const COST = 20;
    if (bird.coins < COST) {
      this.events.push({ type: 'vend_fail', birdId: bird.id, reason: 'no_coins', cost: COST });
      return;
    }

    // Roll random effect (weighted)
    const roll = Math.random();
    let effectType;
    if      (roll < 0.32) effectType = 'spicy';    // 32% — wider splash
    else if (roll < 0.58) effectType = 'freeze';   // 26% — slows target
    else if (roll < 0.80) effectType = 'rainbow';  // 22% — 3× coins
    else if (roll < 0.93) effectType = 'toxic';    // 13% — chain hit
    else                   effectType = 'shock';    //  7% — stun target

    const EFFECT_EMOJIS = { spicy: '🌶️', freeze: '🧊', rainbow: '🌈', toxic: '💚', shock: '⚡' };
    const EFFECT_NAMES  = { spicy: 'SPICY', freeze: 'FREEZE', rainbow: 'RAINBOW', toxic: 'TOXIC', shock: 'SHOCK' };

    bird.coins -= COST;
    bird.vpMachineCooldowns[machineIdx] = now;
    bird.vpPoopEffect = { type: effectType };

    this.events.push({
      type: 'vend_success',
      birdId: bird.id,
      birdName: bird.name,
      effectType,
      emoji: EFFECT_EMOJIS[effectType],
      effectName: EFFECT_NAMES[effectType],
      machineIdx,
    });

    console.log(`[Vending] ${bird.name} got ${EFFECT_EMOJIS[effectType]} ${effectType.toUpperCase()} poop from machine ${machineIdx}`);
  }

  // ============================================================
  // STREET DUEL SYSTEM
  // ============================================================

  _handleChallengeDuel(challenger, targetId, now) {
    if (!targetId) return;
    if (challenger.streetDuelId) return; // already in a duel
    if (this.arena.fighters.has(challenger.id)) return; // in arena
    if (this.pendingChallenges.has(challenger.id)) return; // already have incoming challenge

    const target = this.birds.get(targetId);
    if (!target || target.id === challenger.id) return;
    if (target.streetDuelId) return; // target already in duel
    if (this.pendingChallenges.has(target.id)) return; // target already has pending challenge

    // Proximity check
    const dx = challenger.x - target.x;
    const dy = challenger.y - target.y;
    if (Math.sqrt(dx*dx + dy*dy) > 110) {
      this.events.push({ type: 'duel_fail', birdId: challenger.id, reason: 'too_far' });
      return;
    }

    // Calculate pot: 25% of each bird's coins, min 30c each side, max 250c each side
    const challengerStake = Math.min(250, Math.max(30, Math.floor(challenger.coins * 0.25)));
    const targetStake = Math.min(250, Math.max(30, Math.floor(target.coins * 0.25)));
    if (challenger.coins < challengerStake) {
      this.events.push({ type: 'duel_fail', birdId: challenger.id, reason: 'no_coins' });
      return;
    }

    const pot = challengerStake + targetStake;
    this.pendingChallenges.set(target.id, {
      challengerId: challenger.id,
      challengerName: challenger.name,
      targetStake,
      challengerStake,
      pot,
      expiresAt: now + this.STREET_DUEL_CHALLENGE_EXPIRY,
    });

    this.events.push({
      type: 'duel_challenge_sent',
      birdId: challenger.id,
      targetName: target.name,
      pot,
    });
    this.events.push({
      type: 'duel_incoming_challenge',
      birdId: target.id,
      challengerName: challenger.name,
      pot,
      expiresAt: now + this.STREET_DUEL_CHALLENGE_EXPIRY,
    });
  }

  _handleAcceptDuel(bird, now) {
    const pending = this.pendingChallenges.get(bird.id);
    if (!pending || pending.expiresAt < now) {
      this.events.push({ type: 'duel_fail', birdId: bird.id, reason: 'no_challenge' });
      return;
    }
    if (bird.streetDuelId) return;

    const challenger = this.birds.get(pending.challengerId);
    if (!challenger) {
      this.pendingChallenges.delete(bird.id);
      return;
    }

    // Deduct stakes from both birds
    if (challenger.coins < pending.challengerStake || bird.coins < pending.targetStake) {
      this.pendingChallenges.delete(bird.id);
      this.events.push({ type: 'duel_fail', birdId: bird.id, reason: 'no_coins' });
      return;
    }
    challenger.coins -= pending.challengerStake;
    bird.coins -= pending.targetStake;

    const duelId = `duel_${++this._duelIdCounter}`;
    const duel = {
      id: duelId,
      challengerId: pending.challengerId,
      challengerName: pending.challengerName,
      targetId: bird.id,
      targetName: bird.name,
      state: 'active',
      hp: { [pending.challengerId]: 3, [bird.id]: 3 },
      pot: pending.pot,
      centerX: (challenger.x + bird.x) / 2,
      centerY: (challenger.y + bird.y) / 2,
      startedAt: now,
      expiresAt: now + this.STREET_DUEL_DURATION,
      // Betting window — spectators can bet for 20s after duel starts
      bets: new Map(),            // birdId -> { amount, onId, birdName }
      betWindowUntil: now + 20000,
      rematchCount: 0,            // increments with each rematch
    };

    this.streetDuels.set(duelId, duel);
    challenger.streetDuelId = duelId;
    bird.streetDuelId = duelId;
    this.pendingChallenges.delete(bird.id);

    this.events.push({
      type: 'street_duel_start',
      duelId,
      challengerId: pending.challengerId,
      challengerName: pending.challengerName,
      targetId: bird.id,
      targetName: bird.name,
      pot: pending.pot,
    });
  }

  _handleDeclineDuel(bird, now) {
    const pending = this.pendingChallenges.get(bird.id);
    if (!pending) return;
    this.pendingChallenges.delete(bird.id);
    this.events.push({
      type: 'duel_declined',
      birdId: pending.challengerId,
      targetName: bird.name,
    });
  }

  _resolveStreetDuel(duel, winnerId, reason, now) {
    if (duel.state !== 'active') return;
    duel.state = 'resolved';

    const winner = this.birds.get(winnerId);
    const loserId = duel.challengerId === winnerId ? duel.targetId : duel.challengerId;
    const loser = this.birds.get(loserId);
    const loserName = duel.challengerId === loserId ? duel.challengerName : duel.targetName;

    // === Tournament duel: special handling ===
    if (duel.isTournamentDuel) {
      this._tournamentDuelIds.delete(duel.id);
      if (winner) {
        winner.xp += 80;  // smaller XP per round win — championship pot is the big reward
        winner.streetDuelId = null;
        this._trackDailyProgress(winner, 'duel_win', 1);
      }
      if (loser) {
        loser.streetDuelId = null;
        loser.comboCount = 0;
      }
      this.events.push({
        type: 'street_duel_end',
        duelId: duel.id,
        winnerId,
        winnerName: winner ? winner.name : (duel.challengerId === winnerId ? duel.challengerName : duel.targetName),
        loserId,
        loserName,
        pot: 0,
        reason,
        isTournamentDuel: true,
        tournamentRound: this.tournament.round,
      });
      this._onTournamentMatchResult(winnerId, duel.challengerId, duel.targetId, now);

      // === Pay out tournament duel spectator bets ===
      if (duel.bets && duel.bets.size > 0) {
        const winningBets = [...duel.bets.entries()].filter(([, b]) => b.onId === winnerId);
        const losingBets  = [...duel.bets.entries()].filter(([, b]) => b.onId !== winnerId);
        const totalPool = [...duel.bets.values()].reduce((s, b) => s + b.amount, 0);
        const totalWinningAmount = winningBets.reduce((s, [, b]) => s + b.amount, 0);
        const betResults = [];
        if (winningBets.length === 0) {
          for (const [bid, bet] of duel.bets) {
            const b = this.birds.get(bid);
            if (b) b.coins += bet.amount;
            betResults.push({ birdId: bid, birdName: bet.birdName, betAmount: bet.amount, payout: bet.amount, profit: 0, won: false, refund: true });
          }
          this.events.push({ type: 'duel_bet_results', duelId: duel.id, winnerName: winner ? winner.name : '???', noWinners: true, results: betResults });
        } else {
          for (const [bid, bet] of winningBets) {
            const b = this.birds.get(bid);
            const payout = Math.max(Math.floor(bet.amount * 1.5), Math.floor(totalPool * bet.amount / totalWinningAmount));
            if (b) { b.coins += payout; b.xp += 30; }
            betResults.push({ birdId: bid, birdName: bet.birdName, betAmount: bet.amount, payout, profit: payout - bet.amount, won: true });
          }
          for (const [bid, bet] of losingBets) {
            betResults.push({ birdId: bid, birdName: bet.birdName, betAmount: bet.amount, payout: 0, profit: -bet.amount, won: false });
          }
          this.events.push({ type: 'duel_bet_results', duelId: duel.id, winnerName: winner ? winner.name : '???', noWinners: false, results: betResults });
        }
      }

      this.streetDuels.delete(duel.id);
      return;
    }

    if (winner) {
      winner.coins += duel.pot;
      winner.xp += 150;
      winner.streetDuelId = null;
      this._trackDailyProgress(winner, 'duel_win', 1);
    }
    if (loser) {
      loser.streetDuelId = null;
      // Wipe combo on duel loss
      loser.comboCount = 0;
    }

    this.events.push({
      type: 'street_duel_end',
      duelId: duel.id,
      winnerId,
      winnerName: winner ? winner.name : '???',
      loserId,
      loserName,
      pot: duel.pot,
      reason,
    });

    // === Process duel bets ===
    if (duel.bets && duel.bets.size > 0 && winnerId) {
      const winningBets = [...duel.bets.entries()].filter(([, b]) => b.onId === winnerId);
      const losingBets  = [...duel.bets.entries()].filter(([, b]) => b.onId !== winnerId);
      const totalPool = [...duel.bets.values()].reduce((s, b) => s + b.amount, 0);
      const totalWinningAmount = winningBets.reduce((s, [, b]) => s + b.amount, 0);
      const betResults = [];

      if (winningBets.length === 0) {
        // Nobody bet on the winner — full refund
        for (const [bid, bet] of duel.bets) {
          const b = this.birds.get(bid);
          if (b) b.coins += bet.amount;
          betResults.push({ birdId: bid, birdName: bet.birdName, betAmount: bet.amount, payout: bet.amount, profit: 0, won: false, refund: true });
        }
        this.events.push({ type: 'duel_bet_results', duelId: duel.id, winnerName: winner ? winner.name : '???', noWinners: true, results: betResults });
      } else {
        // Winners split pool proportionally (min 1.5× guaranteed)
        for (const [bid, bet] of winningBets) {
          const b = this.birds.get(bid);
          const payout = Math.max(Math.floor(bet.amount * 1.5), Math.floor(totalPool * bet.amount / totalWinningAmount));
          if (b) { b.coins += payout; b.xp += 30; }
          betResults.push({ birdId: bid, birdName: bet.birdName, betAmount: bet.amount, payout, profit: payout - bet.amount, won: true });
        }
        for (const [bid, bet] of losingBets) {
          betResults.push({ birdId: bid, birdName: bet.birdName, betAmount: bet.amount, payout: 0, profit: -bet.amount, won: false });
        }
        this.events.push({ type: 'duel_bet_results', duelId: duel.id, winnerName: winner ? winner.name : '???', noWinners: false, results: betResults });
      }
    }

    // === Offer rematch (only for knockouts, both birds still online) ===
    if (reason === 'knockout' && winner && loser) {
      const rematchKey = [winnerId, loserId].sort().join('_');
      this.rematchPending.set(rematchKey, {
        bird1Id: winnerId,
        bird1Name: winner.name,
        bird2Id: loserId,
        bird2Name: loser.name,
        bird1Accept: false,
        bird2Accept: false,
        expiresAt: now + 10000,
        rematchCount: (duel.rematchCount || 0) + 1,
      });
      this.events.push({
        type: 'duel_rematch_available',
        bird1Id: winnerId,
        bird2Id: loserId,
        expiresAt: now + 10000,
        rematchCount: (duel.rematchCount || 0) + 1,
      });
    }

    this.streetDuels.delete(duel.id);
  }

  _tickStreetDuels(now) {
    // Expire pending challenges
    for (const [targetId, ch] of this.pendingChallenges) {
      if (ch.expiresAt < now) {
        this.pendingChallenges.delete(targetId);
        this.events.push({ type: 'duel_challenge_expired', birdId: ch.challengerId, targetName: '' });
      }
    }

    // Expire active duels (draw — refund both sides + refund bettors)
    for (const [, duel] of this.streetDuels) {
      if (duel.state !== 'active') continue;
      if (now >= duel.expiresAt) {
        // Tournament duels on timeout: pick random winner (no draw allowed)
        if (duel.isTournamentDuel) {
          const randomWinnerId = Math.random() < 0.5 ? duel.challengerId : duel.targetId;
          this._resolveStreetDuel(duel, randomWinnerId, 'timeout', now);
          continue;
        }
        duel.state = 'draw';
        const challenger = this.birds.get(duel.challengerId);
        const target = this.birds.get(duel.targetId);
        const challengerStake = Math.floor(duel.pot / 2);
        const targetStake = duel.pot - challengerStake;
        if (challenger) { challenger.coins += challengerStake; challenger.streetDuelId = null; }
        if (target) { target.coins += targetStake; target.streetDuelId = null; }
        // Refund all bets on a draw
        if (duel.bets && duel.bets.size > 0) {
          for (const [bid, bet] of duel.bets) {
            const b = this.birds.get(bid);
            if (b) b.coins += bet.amount;
          }
        }
        this.events.push({
          type: 'street_duel_end',
          duelId: duel.id,
          winnerId: null,
          winnerName: null,
          loserId: null,
          loserName: null,
          pot: duel.pot,
          reason: 'draw',
        });
        this.streetDuels.delete(duel.id);
      }
    }

    // Expire pending rematches
    for (const [key, rm] of this.rematchPending) {
      if (rm.expiresAt < now) {
        this.rematchPending.delete(key);
      }
    }
  }

  // ============================================================
  // DUEL BETTING SYSTEM
  // ============================================================

  _handleDuelBet(bird, action, now) {
    const { duelId, onId, amount } = action;
    const duel = this.streetDuels.get(duelId);
    if (!duel || duel.state !== 'active') {
      this.events.push({ type: 'duel_bet_fail', birdId: bird.id, reason: 'no_duel' });
      return;
    }
    if (duel.challengerId === bird.id || duel.targetId === bird.id) {
      this.events.push({ type: 'duel_bet_fail', birdId: bird.id, reason: 'dueler' });
      return;
    }
    if (!duel.betWindowUntil || duel.betWindowUntil <= now) {
      this.events.push({ type: 'duel_bet_fail', birdId: bird.id, reason: 'window_closed' });
      return;
    }
    if (duel.bets.has(bird.id)) {
      this.events.push({ type: 'duel_bet_fail', birdId: bird.id, reason: 'already_bet' });
      return;
    }
    if (onId !== duel.challengerId && onId !== duel.targetId) {
      this.events.push({ type: 'duel_bet_fail', birdId: bird.id, reason: 'invalid_fighter' });
      return;
    }
    const betAmount = Math.floor(Math.max(10, Math.min(300, Number(amount) || 0)));
    if (betAmount < 10) {
      this.events.push({ type: 'duel_bet_fail', birdId: bird.id, reason: 'invalid_amount' });
      return;
    }
    if (bird.coins < betAmount) {
      this.events.push({ type: 'duel_bet_fail', birdId: bird.id, reason: 'no_coins' });
      return;
    }

    bird.coins -= betAmount;
    duel.bets.set(bird.id, { amount: betAmount, onId, birdName: bird.name });

    const bets1 = [...duel.bets.values()].filter(b => b.onId === duel.challengerId).reduce((s, b) => s + b.amount, 0);
    const bets2 = [...duel.bets.values()].filter(b => b.onId === duel.targetId).reduce((s, b) => s + b.amount, 0);

    this.events.push({
      type: 'duel_bet_placed',
      birdId: bird.id,
      birdName: bird.name,
      duelId,
      onId,
      onName: onId === duel.challengerId ? duel.challengerName : duel.targetName,
      amount: betAmount,
      bets1,
      bets2,
    });
  }

  // ============================================================
  // DUEL REMATCH SYSTEM
  // ============================================================

  _handleDuelRematch(bird, now) {
    for (const [key, rm] of this.rematchPending) {
      if (rm.expiresAt < now) { this.rematchPending.delete(key); continue; }
      if (rm.bird1Id !== bird.id && rm.bird2Id !== bird.id) continue;

      // Already accepted?
      const myAlreadyAccepted = rm.bird1Id === bird.id ? rm.bird1Accept : rm.bird2Accept;
      if (myAlreadyAccepted) return;

      if (rm.bird1Id === bird.id) rm.bird1Accept = true;
      else rm.bird2Accept = true;

      this.events.push({ type: 'duel_rematch_accepted_by', birdId: bird.id, birdName: bird.name });

      // If both accepted: create the rematch duel
      if (rm.bird1Accept && rm.bird2Accept) {
        this.rematchPending.delete(key);

        const b1 = this.birds.get(rm.bird1Id);
        const b2 = this.birds.get(rm.bird2Id);
        if (!b1 || !b2 || b1.streetDuelId || b2.streetDuelId) {
          this.events.push({ type: 'duel_rematch_fail', reason: 'unavailable', bird1Id: rm.bird1Id, bird2Id: rm.bird2Id });
          return;
        }

        const stake1 = Math.min(250, Math.max(30, Math.floor(b1.coins * 0.25)));
        const stake2 = Math.min(250, Math.max(30, Math.floor(b2.coins * 0.25)));
        if (b1.coins < stake1 || b2.coins < stake2) {
          this.events.push({ type: 'duel_rematch_fail', reason: 'no_coins', bird1Id: rm.bird1Id, bird2Id: rm.bird2Id });
          return;
        }
        b1.coins -= stake1;
        b2.coins -= stake2;

        const duelId = `duel_${++this._duelIdCounter}`;
        const rematchDuel = {
          id: duelId,
          challengerId: rm.bird1Id,
          challengerName: rm.bird1Name,
          targetId: rm.bird2Id,
          targetName: rm.bird2Name,
          state: 'active',
          hp: { [rm.bird1Id]: 3, [rm.bird2Id]: 3 },
          pot: stake1 + stake2,
          centerX: (b1.x + b2.x) / 2,
          centerY: (b1.y + b2.y) / 2,
          startedAt: now,
          expiresAt: now + this.STREET_DUEL_DURATION,
          bets: new Map(),
          betWindowUntil: now + 20000,
          rematchCount: rm.rematchCount,
        };
        this.streetDuels.set(duelId, rematchDuel);
        b1.streetDuelId = duelId;
        b2.streetDuelId = duelId;

        this.events.push({
          type: 'street_duel_start',
          duelId,
          challengerId: rm.bird1Id,
          challengerName: rm.bird1Name,
          targetId: rm.bird2Id,
          targetName: rm.bird2Name,
          pot: stake1 + stake2,
          isRematch: true,
          rematchCount: rm.rematchCount,
        });
      }
      return;
    }
  }

  // ============================================================
  // PIGEON FIGHTING CHAMPIONSHIP
  // ============================================================

  _tickTournament(now) {
    const t = this.tournament;

    if (t.state === 'idle' && now >= t.nextAt) {
      // Announce signup opening
      t.state = 'signup';
      t.signupUntil = now + 45000;  // 45 seconds to sign up
      t.entrants = [];
      t.pot = 0;
      t.round = 0;
      t.bracket = [];
      t.survivors = [];
      t.champion = null;
      this.events.push({
        type: 'tournament_open',
        signupUntil: t.signupUntil,
        entryFee: t.entryFee,
      });
      return;
    }

    if (t.state === 'signup' && now >= t.signupUntil) {
      if (t.entrants.length < 3) {
        // Cancel — not enough entrants, refund all
        for (const e of t.entrants) {
          const bird = this.birds.get(e.birdId);
          if (bird) bird.coins += t.entryFee;
        }
        t.state = 'idle';
        t.nextAt = now + (25 + Math.random() * 10) * 60000;
        this.events.push({ type: 'tournament_cancelled', entrantCount: t.entrants.length });
        return;
      }
      // Enough entrants — start Round 1
      t.survivors = t.entrants.map(e => e.birdId);
      this._startTournamentRound(now);
      return;
    }

    if (t.state === 'fighting') {
      // Check if all current bracket matches are resolved
      const allDone = t.bracket.every(m => m.winner !== null);
      if (!allDone) return;

      const winners = t.bracket.map(m => m.winner).filter(Boolean);

      if (winners.length <= 1) {
        // We have our champion!
        const champId = winners[0] || t.survivors[0]; // fallback
        const champEntrant = t.entrants.find(e => e.birdId === champId);
        const champBird = this.birds.get(champId);

        t.champion = {
          birdId: champId,
          name: champEntrant ? champEntrant.name : (champBird ? champBird.name : '???'),
          gangTag: champEntrant ? champEntrant.gangTag : (champBird ? (champBird.gangTag || null) : null),
        };

        if (champBird) {
          champBird.coins += t.pot;
          champBird.xp += 500;
          champBird.fightingChampBadge = true;
          champBird.tournamentWins = (champBird.tournamentWins || 0) + 1;
          this._trackDailyProgress(champBird, 'tournament_win', 1);
          this._trackDailyProgress(champBird, 'duel_win', 1);
          this._saveBird(champBird);
        }

        // Gazette tracking
        if (!this.gazetteStats.tournamentWinner) {
          this.gazetteStats.tournamentWinner = {
            name: t.champion.name,
            gangTag: t.champion.gangTag,
            pot: t.pot,
          };
        }

        t.state = 'done';
        t.nextAt = now + (25 + Math.random() * 10) * 60000;

        this.events.push({
          type: 'tournament_ended',
          championId: champId,
          championName: t.champion.name,
          gangTag: t.champion.gangTag,
          pot: t.pot,
          rounds: t.round,
        });
      } else {
        // Multiple winners — start next round with survivors
        t.survivors = winners;
        this._startTournamentRound(now);
      }
    }

    // Reset done state to idle once the next timer fires
    if (t.state === 'done' && now >= t.nextAt) {
      t.state = 'idle';
    }
  }

  _handleTournamentJoin(bird, now) {
    const t = this.tournament;

    if (t.state !== 'signup') {
      this.events.push({ type: 'tournament_join_fail', birdId: bird.id, reason: 'not_open' });
      return;
    }
    if (now >= t.signupUntil) {
      this.events.push({ type: 'tournament_join_fail', birdId: bird.id, reason: 'closed' });
      return;
    }
    // Proximity to Don Featherstone
    const dx = bird.x - world.DON_POS.x;
    const dy = bird.y - world.DON_POS.y;
    if (Math.sqrt(dx * dx + dy * dy) > 110) {
      this.events.push({ type: 'tournament_join_fail', birdId: bird.id, reason: 'too_far' });
      return;
    }
    if (t.entrants.length >= 8) {
      this.events.push({ type: 'tournament_join_fail', birdId: bird.id, reason: 'full' });
      return;
    }
    if (t.entrants.some(e => e.birdId === bird.id)) {
      this.events.push({ type: 'tournament_join_fail', birdId: bird.id, reason: 'already_entered' });
      return;
    }
    // VIP discount: Made Bird (rep 15+) pays half price — respects their criminal investment
    const effectiveFee = (bird.mafiaRep || 0) >= 15 ? Math.floor(t.entryFee / 2) : t.entryFee;
    const hasVipDiscount = effectiveFee < t.entryFee;
    if (bird.coins < effectiveFee) {
      this.events.push({ type: 'tournament_join_fail', birdId: bird.id, reason: 'no_coins', needed: effectiveFee });
      return;
    }

    bird.coins -= effectiveFee;
    t.pot += effectiveFee;
    t.entrants.push({ birdId: bird.id, name: bird.name, gangTag: bird.gangTag || null });

    this.events.push({
      type: 'tournament_joined',
      birdId: bird.id,
      birdName: bird.name,
      gangTag: bird.gangTag || null,
      entrantCount: t.entrants.length,
      pot: t.pot,
      signupUntil: t.signupUntil,
      feePaid: effectiveFee,
      hasVipDiscount,
    });
  }

  _startTournamentRound(now) {
    const t = this.tournament;
    t.state = 'fighting';
    t.round++;

    // Shuffle survivors
    const shuffled = [...t.survivors].sort(() => Math.random() - 0.5);
    const matches = [];

    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      const b1Id = shuffled[i];
      const b2Id = shuffled[i + 1];
      const b1Entry = t.entrants.find(e => e.birdId === b1Id);
      const b2Entry = t.entrants.find(e => e.birdId === b2Id);
      matches.push({
        bird1Id: b1Id,
        bird2Id: b2Id,
        bird1Name: b1Entry ? b1Entry.name : (this.birds.get(b1Id) ? this.birds.get(b1Id).name : '???'),
        bird2Name: b2Entry ? b2Entry.name : (this.birds.get(b2Id) ? this.birds.get(b2Id).name : '???'),
        duelId: null,
        winner: null,
        bye: false,
      });
    }

    // Odd number: the last survivor gets a bye
    if (shuffled.length % 2 === 1) {
      const byeId = shuffled[shuffled.length - 1];
      const byeEntry = t.entrants.find(e => e.birdId === byeId);
      matches.push({
        bird1Id: byeId,
        bird2Id: null,
        bird1Name: byeEntry ? byeEntry.name : (this.birds.get(byeId) ? this.birds.get(byeId).name : '???'),
        bird2Name: null,
        duelId: null,
        winner: byeId,
        bye: true,
      });
    }

    t.bracket = matches;

    // Start all non-bye duels
    for (const match of matches) {
      if (!match.bye) {
        const duelId = this._forceTournamentDuel(match.bird1Id, match.bird2Id, now);
        match.duelId = duelId;
        if (!duelId) {
          // One or both birds offline — pick whoever is online, or random
          const b1 = this.birds.get(match.bird1Id);
          const b2 = this.birds.get(match.bird2Id);
          if (b1 && !b2) match.winner = match.bird1Id;
          else if (b2 && !b1) match.winner = match.bird2Id;
          else match.winner = Math.random() < 0.5 ? match.bird1Id : match.bird2Id;
        }
      }
    }

    this.events.push({
      type: 'tournament_round_start',
      round: t.round,
      totalRounds: Math.ceil(Math.log2(t.entrants.length)) || 1,
      bracket: t.bracket.map(m => ({
        bird1Name: m.bird1Name,
        bird2Name: m.bird2Name,
        bye: m.bye,
      })),
      survivorCount: t.survivors.length,
    });
  }

  _forceTournamentDuel(bird1Id, bird2Id, now) {
    const bird1 = this.birds.get(bird1Id);
    const bird2 = this.birds.get(bird2Id);
    if (!bird1 || !bird2) return null;

    // If either bird is already in a duel, clear it first
    for (const id of [bird1Id, bird2Id]) {
      const b = this.birds.get(id);
      if (b && b.streetDuelId) {
        const existingDuel = this.streetDuels.get(b.streetDuelId);
        if (existingDuel && !existingDuel.isTournamentDuel) {
          // Refund non-tournament duel and cancel it
          const otherId = existingDuel.challengerId === id ? existingDuel.targetId : existingDuel.challengerId;
          const other = this.birds.get(otherId);
          if (other) {
            other.coins += Math.floor(existingDuel.pot / 2);
            other.streetDuelId = null;
          }
          b.coins += Math.floor(existingDuel.pot / 2);
          existingDuel.state = 'cancelled';
          this.streetDuels.delete(b.streetDuelId);
        }
        b.streetDuelId = null;
      }
    }

    const duelId = `tduel_${++this._duelIdCounter}`;
    const duel = {
      id: duelId,
      challengerId: bird1Id,
      challengerName: bird1.name,
      targetId: bird2Id,
      targetName: bird2.name,
      state: 'active',
      hp: { [bird1Id]: 3, [bird2Id]: 3 },
      pot: 0,   // no stakes — championship pot is the reward
      centerX: (bird1.x + bird2.x) / 2,
      centerY: (bird1.y + bird2.y) / 2,
      startedAt: now,
      expiresAt: now + 60000,   // 60 seconds for tournament rounds
      bets: new Map(),
      betWindowUntil: now + 20000,
      rematchCount: 0,
      isTournamentDuel: true,
      tournamentRound: this.tournament.round,
    };

    this.streetDuels.set(duelId, duel);
    bird1.streetDuelId = duelId;
    bird2.streetDuelId = duelId;
    this._tournamentDuelIds.add(duelId);

    this.events.push({
      type: 'street_duel_start',
      duelId,
      challengerId: bird1Id,
      challengerName: bird1.name,
      targetId: bird2Id,
      targetName: bird2.name,
      pot: 0,
      isTournamentDuel: true,
      tournamentRound: this.tournament.round,
    });

    return duelId;
  }

  _onTournamentMatchResult(winnerId, bird1Id, bird2Id, now) {
    const t = this.tournament;
    const match = t.bracket.find(m =>
      (m.bird1Id === bird1Id && m.bird2Id === bird2Id) ||
      (m.bird1Id === bird2Id && m.bird2Id === bird1Id)
    );
    if (!match || match.winner !== null) return;

    match.winner = winnerId;

    const winnerName = winnerId === match.bird1Id ? match.bird1Name : match.bird2Name;
    const loserId = winnerId === match.bird1Id ? match.bird2Id : match.bird1Id;
    const loserName = winnerId === match.bird1Id ? match.bird2Name : match.bird1Name;

    this.events.push({
      type: 'tournament_match_result',
      round: t.round,
      winnerId,
      winnerName,
      loserId,
      loserName,
    });
  }

}

module.exports = GameEngine;
