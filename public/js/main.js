// ============================================================
// BIRD CITY: CHAOS CENTRAL — Main Client (Desktop + Mobile)
// ============================================================

(function () {
  'use strict';

  // === DOM Elements ===
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const minimapCanvas = document.getElementById('minimap');
  const minimapCtx = minimapCanvas.getContext('2d');
  const joinScreen = document.getElementById('joinScreen');
  const nameInput = document.getElementById('nameInput');
  const joinBtn = document.getElementById('joinBtn');
  const hud = document.getElementById('hud');
  const xpBar = document.getElementById('xpBar');
  const xpBarFill = document.getElementById('xpBarFill');
  const xpBarText = document.getElementById('xpBarText');
  const poopCooldown = document.getElementById('poopCooldown');
  const statsBar = document.getElementById('statsBar');
  const leaderboardEl = document.getElementById('leaderboard');
  const leaderboardEntries = document.getElementById('leaderboardEntries');
  const eventFeed = document.getElementById('eventFeed');
  const onlineCount = document.getElementById('onlineCount');

  // Mobile elements
  const mobileControls = document.getElementById('mobileControls');
  const joystickZone = document.getElementById('joystickZone');
  const joystickBase = document.getElementById('joystickBase');
  const joystickThumb = document.getElementById('joystickThumb');
  const btnPoop = document.getElementById('btnPoop');
  const btnSteal = document.getElementById('btnSteal');
  const btnCaw = document.getElementById('btnCaw');
  const btnAbility = document.getElementById('btnAbility');
  const btnLeaderboard = document.getElementById('btnLeaderboard');

  // Chaos/lobby UI elements
  const chaosBar = document.getElementById('chaosBar');
  const chaosFill = document.getElementById('chaosFill');
  const chaosLabel = document.getElementById('chaosLabel');
  const flockLobby = document.getElementById('flockLobby');

  // Mission/flock UI elements
  const missionBoardOverlay = document.getElementById('missionBoardOverlay');
  const missionBoardList = document.getElementById('missionBoardList');
  const missionBoardClose = document.getElementById('missionBoardClose');
  const activeMissionHud = document.getElementById('activeMissionHud');
  const missionTitle = document.getElementById('missionTitle');
  const missionProgressFill = document.getElementById('missionProgressFill');
  const missionTimeLeft = document.getElementById('missionTimeLeft');
  const abilityCooldownEl = document.getElementById('abilityCooldown');
  const flockInvitePopup = document.getElementById('flockInvitePopup');
  const flockInviteText = document.getElementById('flockInviteText');
  const flockAcceptBtn = document.getElementById('flockAcceptBtn');
  const flockDeclineBtn = document.getElementById('flockDeclineBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const iosPrompt = document.getElementById('iosPrompt');
  const iosPromptClose = document.getElementById('iosPromptClose');
  const soundToggle = document.getElementById('soundToggle');
  const wantedHud = document.getElementById('wantedHud');
  const comboHud = document.getElementById('comboHud');
  const predatorHud = document.getElementById('predatorHud');

  // === Pigeon Mafia Don ===
  const donOverlay = document.getElementById('donOverlay');
  const donProximityPrompt = document.getElementById('donProximityPrompt');
  const donMissionHud = document.getElementById('donMissionHud');
  const donAcceptBtn = document.getElementById('donAcceptBtn');
  const donCloseBtn = document.getElementById('donCloseBtn');
  let donOverlayVisible = false;
  let lastNearDon = false;

  // === Daily Challenges ===
  const dailyPanel = document.getElementById('dailyPanel');
  const dailyPanelClose = document.getElementById('dailyPanelClose');
  const dailyHudIndicator = document.getElementById('dailyHudIndicator');
  let dailyPanelVisible = false;

  // === Bird Gangs ===
  const gangHqOverlay = document.getElementById('gangHqOverlay');
  const gangHqClose = document.getElementById('gangHqClose');
  const gangWarHud = document.getElementById('gangWarHud');
  let gangHqVisible = false;
  let gangSelectedColor = null;

  // === Pigeonhole Slots Casino ===
  const casinoOverlay = document.getElementById('casinoOverlay');
  const casinoProximityPrompt = document.getElementById('casinoProximityPrompt');
  const casinoSpinBtn = document.getElementById('casinoSpinBtn');
  const casinoCloseBtn = document.getElementById('casinoCloseBtn');
  let casinoOverlayVisible = false;
  let lastNearCasino = false;

  // === ROYAL DECREE PANEL ===
  let decreePanelVisible = false;
  window._revoltWindowUntil = null; // timestamp when the People's Revolt window expires
  window._poopToRevolt = function() {
    // If revolt window is active, clicking the pill focuses attention — poop with SPACE
    // (just a visual hint, actual mechanic is via poop hits)
  };
  let casinoSpinning = false;
  let casinoSpinInterval = null;
  const CASINO_REEL_SYMBOLS = ['🐦', '💩', '🍗', '⭐', '💎', '👑'];

  // === BIRD TATTOO PARLOR ===
  const tattooOverlay = document.getElementById('tattooOverlay');
  const tattooCloseBtn = document.getElementById('tattooCloseBtn');
  let tattooOverlayVisible = false;
  let lastNearTattooParlor = false;

  // === DONUT COP ===
  const donutCopPrompt = document.getElementById('donutCopPrompt');
  let lastNearDonutCop = false;

  // === VENDING MACHINE POOP POWER-UPS ===
  const vendingMachinePrompt = document.getElementById('vendingMachinePrompt');
  let lastNearVendingMachine = null;

  // === CITY HALL BOUNTY BOARD ===
  const bountyBoardOverlay = document.getElementById('bountyBoardOverlay');
  const bbCloseBtn = document.getElementById('bbCloseBtn');
  const bbContributeBtn = document.getElementById('bbContributeBtn');
  const bbContributeAmount = document.getElementById('bbContributeAmount');
  const bbContributeMsg = document.getElementById('bbContributeMsg');
  const bbWpBtn = document.getElementById('bbWpBtn');
  const bbWpMsg = document.getElementById('bbWpMsg');
  const bbWpStatus = document.getElementById('bbWpStatus');
  const poolHudPill = document.getElementById('poolHudPill');
  const cityHallPrompt = document.getElementById('cityHallPrompt');
  let bountyBoardVisible = false;
  let lastNearCityHall = false;

  // === PRESTIGE PANEL ===
  const prestigeOverlay = document.getElementById('prestigeOverlay');
  let prestigePanelVisible = false;
  let idolOverlayVisible = false;

  // === Persistent Identity (localStorage) ===
  function getSavedAccount() {
    try {
      const raw = localStorage.getItem('birdcity_account');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function saveAccount(id, name) {
    localStorage.setItem('birdcity_account', JSON.stringify({ id, name }));
  }

  function clearAccount() {
    localStorage.removeItem('birdcity_account');
  }

  function generateId() {
    return 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // === State ===
  // Eager init: later autonomous sessions added top-level socket.on() handlers
  // (around line 16137, 17226+) that ran before connectSocket(), crashing on null.
  // Creating the socket here keeps those registrations valid; connectSocket() below
  // only attaches its own handlers and handles the connect-race.
  let socket = io();
  let worldData = null;
  let myId = null;
  let gameState = null;
  let prevState = null;
  let stateTime = 0;
  let prevStateTime = 0;
  let joined = false;

  // Camera (zoom: 1.0 = normal, higher = zoomed in)
  const camera = { x: 1500, y: 1500, screenW: 0, screenH: 0, zoom: 1.0 };

  // Input state (sent to server)
  const inputState = {
    w: false, a: false, s: false, d: false,
    up: false, down: false, left: false, right: false,
    space: false, e: false,
  };

  // Desktop keyboard
  const keys = {};

  // Mobile joystick state
  const joystick = {
    active: false,
    touchId: null,
    baseX: 0, baseY: 0,
    thumbX: 0, thumbY: 0,
    dx: 0, dy: 0,       // normalized -1 to 1
    distance: 0,         // 0 to 1
  };

  // Mobile button states
  const mobileButtons = {
    poop: false,
    steal: false,
  };

  // Effects
  const effects = [];
  const soundBubbles = [];
  const eventMessages = [];

  // Weather state (mirrored from server events for visual rendering)
  let weatherState = null;   // { type, windAngle, windSpeed, intensity }
  let lightningFlash = null; // { time, x, y, duration } — brief screen-flash on strike

  // === Tier 1: Announcement system ===
  const announcements = []; // { text, color, time, duration }

  // Mission board UI state
  let missionBoardVisible = false;
  let lastNearDateCenter = false;
  let flockLobbyVisible = false;

  // Night Market state (aurora bazaar)
  let nmOverlayOpen = false;
  let lastNearNightMarket = false;
  const NM_CATALOG = [
    { id: 'stardust_cloak',      name: 'Stardust Cloak',      emoji: '🌌', cost: 1, desc: 'Shimmering aurora aura around your bird for 8 min — visible to all', dur: '8 min' },
    { id: 'comet_trail',         name: 'Comet Trail',          emoji: '☄️',  cost: 2, desc: 'Golden sparkle trail behind your movement for 6 min', dur: '6 min' },
    { id: 'oracle_eye',          name: 'Oracle Eye',           emoji: '🔮', cost: 2, desc: 'See all hidden items on the minimap for 4 min', dur: '4 min' },
    { id: 'star_power',          name: 'Star Power',           emoji: '🌟', cost: 3, desc: '+50% all XP and coins for 8 min — stacks with every multiplier', dur: '8 min' },
    { id: 'lunar_lens',          name: 'Lunar Lens',           emoji: '🌙', cost: 3, desc: 'Reveals ALL sewer loot caches on your minimap for 2 min — find them above ground!', dur: '2 min' },
    { id: 'constellation_badge', name: 'Constellation Badge',  emoji: '🌌', cost: 5, desc: 'Permanent 🌌 nametag badge — the rarest cosmetic in Bird City', dur: 'Forever' },
  ];

  // Black Market state
  let bmShopOpen = false;
  let lastNearBlackMarket = false;
  const BM_CATALOG = [
    { id: 'speed_serum',  name: 'Speed Serum',   desc: '+60% speed for 30s',           cost: 50,  emoji: '💉' },
    { id: 'mega_poop',    name: 'Mega Poop',      desc: 'Next 3 poops are AOE blasts',  cost: 75,  emoji: '💣' },
    { id: 'disguise_kit', name: 'Disguise Kit',   desc: 'Clears ALL heat instantly',    cost: 100, emoji: '🎭' },
    { id: 'smoke_bomb',   name: 'Smoke Bomb',     desc: 'Cops lose you for 15 seconds', cost: 80,  emoji: '💨' },
    { id: 'lucky_charm',  name: 'Lucky Charm',    desc: '2x XP for 5 full minutes',     cost: 150, emoji: '🍀' },
  ];

  // Bird Home UI state
  let birdHomeVisible = false;
  let activeEquipSlot = 0;

  // Arena state
  let lastNearArena = false;
  const arenaHud = document.getElementById('arenaHud');
  const arenaProximityPrompt = document.getElementById('arenaProximityPrompt');

  // Graffiti spray state
  let sprayState = null; // { buildingIdx, progress, startTime } while holding G near a building

  // Gang mural painting state
  let muralPaintState = null;  // { zoneId, zoneName, sendTimer } while holding G near a mural zone
  const MURAL_PROXIMITY_CLIENT = 145;
  const MURAL_SEND_INTERVAL = 200; // ms between mural_paint action sends

  // Radio Tower state
  let towerCapState = null;     // { progress, startTime } while holding E near tower
  let towerBroadcastOpen = false;
  let lastNearTower = false;

  // Sewer state
  let lastNearManholeId = null; // id of the manhole the player is near, or null

  // Pigeon Racing state
  let lastNearRaceStart = false;
  const raceProximityPrompt = document.getElementById('raceProximityPrompt');
  const raceHud = document.getElementById('raceHud');
  const raceBettingPanel = document.getElementById('raceBettingPanel');
  let raceBetAmount = 50; // default bet amount

  // Weather Betting state
  const weatherBetPanel = document.getElementById('weatherBetPanel');
  let weatherBetAmount = 30; // default bet amount

  // Leaderboard data
  let leaderboardData = [];
  let serverStats = { playersOnline: 0, totalPoops: 0 };

  // Device detection
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // === Resize Canvas ===
  function resize() {
    // Use visualViewport for accurate mobile sizing (avoids black bars)
    const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    canvas.width = vw;
    canvas.height = vh;
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    camera.screenW = vw;
    camera.screenH = vh;

    // Mobile zoom: scale up so the world feels bigger and more immersive
    if (isTouchDevice) {
      // Zoom based on screen height — smaller screen = more zoom
      camera.zoom = Math.max(1.0, Math.min(1.3, 500 / vh));
      const mmSize = Math.min(90, vh * 0.22);
      minimapCanvas.width = mmSize;
      minimapCanvas.height = mmSize;
      minimapCanvas.style.width = mmSize + 'px';
      minimapCanvas.style.height = mmSize + 'px';
    } else {
      camera.zoom = 1.0;
      minimapCanvas.width = 120;
      minimapCanvas.height = 120;
    }
  }
  window.addEventListener('resize', resize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resize);
  }
  resize();

  // Try to lock landscape on mobile
  function tryLockLandscape() {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  }

  // === Fetch World Data ===
  async function fetchWorld() {
    const res = await fetch('/api/world');
    worldData = await res.json();
    Renderer.init(worldData);
  }

  // === Socket Connection ===
  function connectSocket() {
    socket.on('connect', () => {
      console.log('Connected to Bird City!');
      // Auto-rejoin if we have a saved account
      const saved = getSavedAccount();
      if (saved && saved.id && saved.name) {
        joinGame(saved);
      }
    });

    // If the eager socket already connected before this handler was registered,
    // the 'connect' event is missed — run the auto-rejoin path manually.
    if (socket.connected) {
      console.log('Connected to Bird City! (pre-registration)');
      const saved = getSavedAccount();
      if (saved && saved.id && saved.name) {
        joinGame(saved);
      }
    }

    socket.on('welcome', (data) => {
      myId = data.id;
      camera.x = data.bird.x;
      camera.y = data.bird.y;
      joined = true;

      joinScreen.style.display = 'none';
      hud.style.display = 'block';
      xpBar.style.display = 'block';
      xpBarText.style.display = 'block';
      statsBar.style.display = 'block';
      minimapCanvas.style.display = 'block';
      if (soundToggle) soundToggle.style.display = 'flex';
      if (chaosBar) chaosBar.style.display = 'block';
      const todHud = document.getElementById('timeOfDayHud');
      if (todHud) todHud.style.display = 'block';
      if (wantedHud) wantedHud.style.display = 'none'; // only shown when wanted level > 0
      if (comboHud) comboHud.style.display = 'none'; // only shown when combo >= 2

      if (!isTouchDevice) {
        poopCooldown.style.display = 'block';
        leaderboardEl.style.display = 'block';
      }

      tryLockLandscape();

      // iOS fullscreen prompt
      if (window._birdCityShowIOSPrompt) window._birdCityShowIOSPrompt();
    });

    socket.on('state', (state) => {
      prevState = gameState;
      prevStateTime = stateTime;
      gameState = state;
      stateTime = performance.now();
      // Sync revolt window state for players who join mid-revolt
      if (state.self && state.self.revoltWindowUntil && state.self.revoltWindowUntil > Date.now()) {
        window._revoltWindowUntil = state.self.revoltWindowUntil;
      } else if (window._revoltWindowUntil && window._revoltWindowUntil < Date.now()) {
        window._revoltWindowUntil = null;
      }
      // Sync Noble Challenges for players who join mid-challenge
      if (state.dukeChallenge) {
        if (!window._dukeChallenge || window._dukeChallenge.id !== state.dukeChallenge.id) {
          window._dukeChallenge = state.dukeChallenge;
          window._dukeChallengeProgressData = window._dukeChallengeProgressData || {};
        }
        window._dukeChallenge.expiresAt = state.dukeChallenge.expiresAt;
      } else if (window._dukeChallenge && !state.dukeChallenge) {
        window._dukeChallenge = null;
      }
      if (state.baronChallenge) {
        if (!window._baronChallenge || window._baronChallenge.id !== state.baronChallenge.id) {
          window._baronChallenge = state.baronChallenge;
        }
        window._baronChallenge.expiresAt = state.baronChallenge.expiresAt;
      } else if (window._baronChallenge && !state.baronChallenge) {
        window._baronChallenge = null;
      }
      if (state.countChallenge) {
        if (!window._countChallenge || window._countChallenge.id !== state.countChallenge.id) {
          window._countChallenge = state.countChallenge;
        }
        window._countChallenge.expiresAt = state.countChallenge.expiresAt;
      } else if (window._countChallenge && !state.countChallenge) {
        window._countChallenge = null;
      }
    });

    socket.on('events', (events) => {
      for (const ev of events) {
        handleEvent(ev);
      }
    });

    socket.on('leaderboard', (data) => {
      leaderboardData = data.leaderboard || [];
      serverStats = data.stats || serverStats;
      updateLeaderboardUI();
    });

    socket.on('disconnect', () => {
      joined = false;
      joinScreen.style.display = 'flex';
      hud.style.display = 'none';
      xpBar.style.display = 'none';
      xpBarText.style.display = 'none';
      poopCooldown.style.display = 'none';
      statsBar.style.display = 'none';
      leaderboardEl.style.display = 'none';
      minimapCanvas.style.display = 'none';
      if (chaosBar) chaosBar.style.display = 'none';
      if (flockLobby) flockLobby.style.display = 'none';
    });
  }

  // === Handle Events ===
  function handleEvent(ev) {
    const now = performance.now();

    if (ev.type === 'poop') {
      effects.push({ type: 'splat', x: ev.x, y: ev.y, time: now, duration: 600, radius: ev.isMegaPoop ? 60 : 15 });

      // Sound — only play for own poops or nearby poops
      if (ev.birdId === myId) {
        if (ev.hitTarget === 'npc' || ev.hitTarget === 'event_npc') SoundEngine.hitNPC();
        else if (ev.hitTarget === 'car' || ev.hitTarget === 'moving_car') SoundEngine.hitCar();
        else if (ev.hitTarget === 'statue') SoundEngine.hitStatue();
        else if (ev.hitTarget === 'laundry') SoundEngine.hitLaundry();
        else if (ev.hitTarget === 'janitor') SoundEngine.hitNPC();
        else SoundEngine.poop();

        if (ev.xp > 0) SoundEngine.xp();
      }

      if (ev.birdId === myId && ev.xp > 0) {
        effects.push({
          type: 'xp', x: ev.x, y: ev.y - 10,
          time: now, duration: 1200,
          text: '+' + ev.xp + ' XP',
          color: ev.hitTarget ? '#ffd700' : '#aaa',
        });
      }

      const hitTexts = {
        npc: { text: 'DIRECT HIT!', color: '#ff4444', size: 16 },
        statue: { text: 'STATUE SHOT!', color: '#ffaa00', size: 16 },
        car: { text: 'CAR BOMBED!', color: '#ff6600', size: 14 },
        moving_car: { text: 'MOVING TARGET!', color: '#ff8800', size: 16 },
        laundry: { text: 'LAUNDRY RUINED!', color: '#ff00ff', size: 16 },
        bride: { text: 'BRIDE BOMBED! +100!', color: '#ff69b4', size: 20 },
        parade_pigeon: { text: 'PARADE HIT!', color: '#aaaaff', size: 14 },
        event_npc: { text: 'EVENT HIT!', color: '#ffaa00', size: 14 },
        janitor: { text: 'JANITOR HIT! +20 XP', color: '#3355aa', size: 16 },
        eagle_overlord: { text: '🦅 EAGLE HIT! −8HP', color: '#ff8c00', size: 18 },
      };
      if (ev.hitTarget && hitTexts[ev.hitTarget]) {
        const ht = hitTexts[ev.hitTarget];
        effects.push({
          type: 'text', x: ev.x, y: ev.y - 20,
          time: now, duration: 1500, ...ht,
        });
      }

      if (ev.isMegaPoop) {
        effects.push({
          type: 'text', x: ev.x, y: ev.y - 35,
          time: now, duration: 2000,
          text: 'MEGA POOP!', color: '#ffd700', size: 22,
        });
      }

      // Floating combo text for own poop hits at streak 3+
      if (ev.birdId === myId && ev.combo >= 3 && ev.hitTarget && ev.hitTarget !== 'none') {
        const comboColors = ['', '', '', '#ffaa00', '#ff8800', '#ff6600', '#ff4400', '#ff2200', '#ff0088', '#dd00ff', '#ff00ff'];
        const comboColor = ev.combo >= 10 ? '#ff00ff' : (comboColors[ev.combo] || '#ff8800');
        const comboFire = ev.combo >= 15 ? '🔥🔥🔥' : ev.combo >= 10 ? '🔥🔥' : '🔥';
        effects.push({
          type: 'text', x: ev.x, y: ev.y - 50,
          time: now, duration: 1800,
          text: comboFire + ' x' + ev.combo,
          color: comboColor, size: ev.combo >= 10 ? 22 : 18,
        });
      }
    }

    if (ev.type === 'steal') {
      if (ev.birdId === myId) SoundEngine.steal();
      effects.push({
        type: 'text', x: ev.x, y: ev.y - 15,
        time: now, duration: 1200,
        text: 'YOINK! ' + ev.foodType, color: '#4ade80', size: 14,
      });
      if (ev.birdId === myId) {
        effects.push({
          type: 'xp', x: ev.x, y: ev.y - 30,
          time: now, duration: 1200,
          text: '+' + ev.value + ' XP', color: '#ffd700',
        });
      }
    }

    if (ev.type === 'sound') {
      soundBubbles.push({ x: ev.x, y: ev.y, text: ev.sound, time: now });
      SoundEngine.caw();
    }

    if (ev.type === 'join') {
      addEventMessage(ev.name + ' flew in!', '#4ade80');
      SoundEngine.join();
    }
    if (ev.type === 'leave') {
      addEventMessage(ev.name + ' flew away', '#888');
      SoundEngine.leave();
    }

    if (ev.type === 'nest_enter') {
      if (ev.birdId === myId) {
        showAnnouncement('Safe in your nest! Zzz...', '#8bc34a', 2000);
      }
      addEventMessage(ev.name + ' went to sleep', '#8bc34a');
    }
    if (ev.type === 'nest_exit') {
      if (ev.birdId === myId) {
        showAnnouncement('You woke up!', '#ffc832', 1500);
      }
    }

    if (ev.type === 'evolve') {
      addEventMessage(ev.name + ' evolved: ' + ev.birdType.toUpperCase() + '!', '#ffd700');
      if (ev.birdId === myId) {
        SoundEngine.evolve();
        effects.push({
          type: 'evolve', x: camera.x, y: camera.y,
          time: now, duration: 2000,
          text: 'EVOLVED: ' + ev.birdType.toUpperCase(),
        });
      }
    }

    if (ev.type === 'cry') {
      effects.push({
        type: 'text', x: ev.x, y: ev.y - 25,
        time: now, duration: 2000,
        text: 'MADE THEM CRY!', color: '#ff0', size: 18,
      });
    }

    // === TIER 1 EVENTS ===

    if (ev.type === 'cat_spawn') {
      SoundEngine.catMeow();
      showAnnouncement('THE CAT HAS APPEARED!', '#ff6633', 3000);
      addEventMessage('A cat is stalking the birds!', '#ff6633');
    }

    if (ev.type === 'cat_hiss') {
      SoundEngine.catHiss();
    }

    if (ev.type === 'cat_flee') {
      showAnnouncement('THE CAT FLED! BIRDS WIN!', '#4ade80', 2000);
      addEventMessage('Birds mobbed the cat! It fled!', '#4ade80');
    }

    if (ev.type === 'cat_attack') {
      if (ev.birdId === myId) {
        SoundEngine.stunned();
        showAnnouncement('THE CAT GOT YOU!', '#ff0000', 2000);
      }
      effects.push({
        type: 'text', x: ev.x, y: ev.y - 20,
        time: now, duration: 2000,
        text: 'CAT ATTACK!', color: '#ff3300', size: 18,
      });
    }

    if (ev.type === 'cat_despawn') {
      addEventMessage('The cat wandered away.', '#888');
    }

    // === JANITOR EVENTS ===
    if (ev.type === 'janitor_spawn') {
      addEventMessage('The Janitor has arrived!', '#3355aa');
    }

    if (ev.type === 'janitor_despawn') {
      addEventMessage('The Janitor left (nothing to clean).', '#888');
    }

    if (ev.type === 'janitor_shout') {
      SoundEngine.janitorShout();
      soundBubbles.push({ x: ev.x, y: ev.y, text: ev.text, time: now });
    }

    if (ev.type === 'janitor_super') {
      SoundEngine.janitorSuper();
      showAnnouncement('SUPER JANITOR ACTIVATED!', '#3355aa', 3000);
      addEventMessage('The Janitor went SUPER MODE!', '#3355aa');
    }

    if (ev.type === 'janitor_ragequit') {
      showAnnouncement('THE JANITOR RAGE QUIT!', '#ff0000', 3000);
      addEventMessage('The Janitor rage quit! Too much poop!', '#ff0000');
    }

    if (ev.type === 'janitor_hit') {
      if (ev.birdId === myId) {
        SoundEngine.hitNPC();
        effects.push({
          type: 'text', x: ev.x, y: ev.y - 20,
          time: now, duration: 1500,
          text: 'JANITOR HIT! +20 XP', color: '#3355aa', size: 16,
        });
      }
    }

    if (ev.type === 'hawk_attack') {
      if (ev.birdId === myId) {
        SoundEngine.stunned();
        showAnnouncement('THE HAWK GOT YOU!', '#ff0000', 2000);
      }
      effects.push({
        type: 'text', x: ev.x, y: ev.y - 20,
        time: now, duration: 2000,
        text: 'HAWK STRIKE!', color: '#cc3300', size: 18,
      });
    }

    if (ev.type === 'hawk_screech') {
      SoundEngine.hawkScreech();
    }

    if (ev.type === 'stunned') {
      if (ev.birdId === myId) {
        SoundEngine.stunned();
      }
    }

    if (ev.type === 'honk') {
      SoundEngine.honk();
    }

    if (ev.type === 'powerup') {
      if (ev.birdId === myId) {
        SoundEngine.powerUp();
        const names = {
          hot_sauce: 'HOT SAUCE! No poop cooldown!',
          speed_feather: 'SPEED FEATHER! 2x speed!',
          ghost_feather: 'GHOST FEATHER! Invisible to predators!',
          mega_poop: 'MEGA POOP! Next poop hits everything nearby!',
        };
        showAnnouncement(names[ev.powerUpType] || 'POWER-UP!', '#00ff88', 2000);
      }
      effects.push({
        type: 'text', x: ev.x, y: ev.y - 20,
        time: now, duration: 1500,
        text: 'POWER-UP!', color: '#00ff88', size: 16,
      });
    }

    if (ev.type === 'event_start') {
      SoundEngine.eventFanfare();
      const eventNames = {
        breadcrumbs: 'BREADCRUMB FRENZY!',
        wedding: 'A WEDDING! Find the bride!',
        hawk: 'THE HAWK IS HUNTING! Take cover!',
        parade: 'PIGEON PARADE! Easy targets!',
      };
      const eventColors = {
        breadcrumbs: '#ffd700',
        wedding: '#ff69b4',
        hawk: '#ff3300',
        parade: '#aaaaff',
      };
      showAnnouncement(eventNames[ev.eventType] || 'WORLD EVENT!', eventColors[ev.eventType] || '#fff', 4000);
      addEventMessage(eventNames[ev.eventType] || 'World event started!', eventColors[ev.eventType] || '#fff');
    }

    if (ev.type === 'event_end') {
      const endNames = {
        breadcrumbs: 'The old lady left.',
        wedding: 'The wedding party departed.',
        hawk: 'The hawk flew away.',
        parade: 'The pigeon parade ended.',
      };
      addEventMessage(endNames[ev.eventType] || 'Event ended.', '#888');
    }

    // === SKILL / ABILITY EVENTS ===
    if (ev.type === 'skill_used' || ev.type === 'ability_used') {
      const skill = ev.skill || ev.ability;
      if (skill === 'poop_barrage' && ev.birdId === myId) SoundEngine.abilityFlockCall();
      else if (skill === 'dive_bomb') SoundEngine.abilityDiveBomb();
      else if (skill === 'shadow_cloak') SoundEngine.abilityShadowCloak();
      else if (skill === 'eagle_eye') SoundEngine.abilityEagleEye();
      else if (skill === 'ground_pound') SoundEngine.abilityGroundPound();
      else if (skill === 'speed_burst') SoundEngine.speedBurst();
      else if (skill === 'beacon_call') SoundEngine.beacon();
      else if (skill === 'decoy') SoundEngine.decoySound();

      // Show skill description for the user who activated it
      if (ev.birdId === myId) {
        const skillDescs = {
          poop_barrage: 'POOP BARRAGE!',
          dive_bomb: 'DIVE BOMB!',
          shadow_cloak: 'CLOAKED! Invisible for 8s',
          eagle_eye: 'EAGLE EYE! All food revealed',
          ground_pound: 'GROUND POUND!',
          decoy: 'DECOY DEPLOYED!',
          speed_burst: 'SPEED BURST! 2x speed!',
          beacon_call: 'BEACON PLACED!',
        };
        const desc = skillDescs[skill] || skill.toUpperCase();
        showAnnouncement(desc, '#a064ff', 2000);
      }

      if (skill === 'ground_pound') {
        effects.push({ type: 'ground_pound', x: ev.x, y: ev.y, time: now, duration: 800 });
        if (gameState && gameState.self) {
          const dx = ev.x - gameState.self.x;
          const dy = ev.y - gameState.self.y;
          if (Math.sqrt(dx * dx + dy * dy) < 400) {
            effects.push({ type: 'screen_shake', time: now, duration: 400, intensity: 5 });
          }
        }
      }
      if (skill === 'dive_bomb') {
        effects.push({ type: 'dive_bomb_trail', x: ev.x, y: ev.y, rotation: 0, time: now, duration: 500 });
      }
      if (skill === 'eagle_eye' && ev.birdId === myId) {
        effects.push({ type: 'eagle_eye_tint', time: now, duration: 15000 });
      }
    }

    if (ev.type === 'skill_bought') {
      if (ev.birdId === myId) {
        SoundEngine.buySkill();
        showAnnouncement('SKILL UNLOCKED!', '#4ade80', 2000);
        // Refresh bird home if open
        if (birdHomeVisible) renderBirdHome();
      }
    }

    // === MISSION EVENTS ===
    if (ev.type === 'mission_accepted') {
      if (ev.birdId === myId) {
        SoundEngine.missionAccept();
        showAnnouncement('MISSION: ' + ev.title, '#cc88dd', 2000);
      }
    }
    if (ev.type === 'mission_complete') {
      if (ev.birdId === myId) {
        SoundEngine.missionComplete();
        const coinText = ev.coinReward ? ' +' + ev.coinReward + ' coins' : '';
        showAnnouncement('MISSION COMPLETE! +' + ev.xpReward + ' XP' + coinText, '#4ade80', 3000);
      }
      addEventMessage(ev.title + ' completed!', '#4ade80');
    }
    if (ev.type === 'mission_failed') {
      if (ev.birdId === myId) {
        SoundEngine.missionFailed();
        showAnnouncement('MISSION FAILED: ' + ev.title, '#ff6b6b', 2000);
      }
    }

    // === PIGEON MAFIA DON EVENTS ===
    if (ev.type === 'don_job_rotated') {
      addEventMessage('🎩 The Don has new work. Visit Don Featherstone for a contract.', '#ffd700');
    }
    if (ev.type === 'don_mission_accepted') {
      if (ev.birdId === myId) {
        showAnnouncement(`🎩 CONTRACT: ${ev.title}`, '#ffd700', 2500);
        addEventMessage(`🎩 ${ev.birdName} took a contract from The Don: "${ev.title}"`, '#ffd700');
      }
    }
    if (ev.type === 'don_mission_complete') {
      if (ev.birdId === myId) {
        screenShake(6, 400);
        showAnnouncement(`🎩 CONTRACT DONE! +${ev.coinReward}c +${ev.xpReward} XP`, '#ffd700', 3500);
        if (ev.titleUnlocked) {
          setTimeout(() => showAnnouncement(`🎖 NEW RANK: [${ev.titleUnlocked}]`, '#cc88ff', 3000), 2000);
        }
      }
      addEventMessage(`🎩 ${ev.birdName} completed The Don's contract: "${ev.title}" (REP: ${ev.newRep})`, '#ffd700');
    }
    if (ev.type === 'don_mission_failed') {
      if (ev.birdId === myId) {
        showAnnouncement(`🎩 CONTRACT EXPIRED: ${ev.title}`, '#ff6b6b', 2000);
      }
    }

    // === HIT CONTRACT EVENTS ===
    if (ev.type === 'hit_placed') {
      screenShake(5, 300);
      addEventMessage(`💀 HIT PLACED on ${ev.targetName}! Bounty: ${ev.reward}c — 3 poop hits to claim`, '#ff4444');
      if (gameState && gameState.self && gameState.self.id === ev.targetId) {
        showAnnouncement(`💀 A HIT HAS BEEN PLACED ON YOU! Bounty: ${ev.reward}c`, '#ff2222', 5000);
      }
    }
    if (ev.type === 'hit_progress') {
      addEventMessage(`🎯 ${ev.hitmanName} scored a hit on ${ev.targetName} (${ev.count}/${ev.needed})`, '#ff8844');
      if (gameState && gameState.self) {
        if (gameState.self.id === ev.hitmanId) {
          showAnnouncement(`🎯 HIT! ${ev.count}/${ev.needed} — keep going!`, '#ff8844', 2000);
        } else if (gameState.self.id === ev.targetId) {
          showAnnouncement(`💀 HIT ${ev.count}/${ev.needed} — RUN!`, '#ff2222', 2000);
        }
      }
    }
    if (ev.type === 'hit_complete') {
      screenShake(10, 600);
      addEventMessage(`💀 HIT COMPLETE! ${ev.hitmanName} took out ${ev.targetName} — earned ${ev.coinReward}c!`, '#ff4444');
      if (gameState && gameState.self) {
        if (gameState.self.id === ev.hitmanId) {
          showAnnouncement(`💀 CONTRACT FULFILLED! +${ev.coinReward}c +120 XP +1 REP`, '#ff4444', 4000);
        } else if (gameState.self.id === ev.targetId) {
          showAnnouncement(`💀 YOU WERE TAKEN OUT! −${ev.taxAmount}c`, '#ff2222', 3500);
        }
      }
    }
    if (ev.type === 'hit_expired') {
      addEventMessage(`⌛ Hit on ${ev.targetName} expired — no takers (50c refunded to contractor)`, '#888888');
      if (gameState && gameState.self && gameState.self.name === ev.contractorName) {
        showAnnouncement(`⌛ YOUR HIT ON ${ev.targetName} EXPIRED — 50c refunded`, '#888888', 2500);
      }
    }

    // === DAILY CHALLENGE EVENTS ===
    if (ev.type === 'daily_challenge_complete') {
      if (ev.birdId === myId) {
        screenShake(5, 300);
        showAnnouncement(`📅 DAILY DONE: ${ev.challengeTitle}! +${ev.xp} XP +${ev.coins}c (${ev.completedCount}/${ev.totalCount})`, '#3399ff', 3500);
        addEventMessage(`📅 ${ev.birdName} completed daily: "${ev.challengeTitle}" (+${ev.xp}XP +${ev.coins}c)`, '#3399ff');
      } else {
        addEventMessage(`📅 ${ev.birdName} completed daily: "${ev.challengeTitle}"`, '#5577aa');
      }
    }
    if (ev.type === 'daily_all_complete') {
      if (ev.birdId === myId) {
        screenShake(12, 600);
        showAnnouncement(`🎉 ALL DAILIES COMPLETE! Day ${ev.streak} streak! +${ev.bonusXp} XP +${ev.bonusCoins}c BONUS!`, '#ffd700', 5000);
      }
      addEventMessage(`🎉 ${ev.birdName} completed ALL daily challenges! (Day ${ev.streak} streak!)`, '#ffd700');
    }
    if (ev.type === 'daily_refresh') {
      showAnnouncement('📅 NEW DAILY CHALLENGES! Press [J] to view them', '#3399ff', 4000);
      addEventMessage('📅 Daily challenges have reset! New challenges available — press [J]', '#3399ff');
    }

    // === KINGPIN EVENTS ===
    if (ev.type === 'kingpin_crowned') {
      const selfIsKingpin = ev.birdId === myId;
      const shieldNote = ev.champShield ? '\n🏆 ROYALE CHAMPION SHIELD — first hit absorbed!' : '';
      const shieldNoteOther = ev.champShield ? '\n🏆 They have a Champion Shield — takes 4 hits to dethrone!' : '';
      const legendNote = ev.isLegend ? '\n⚜️⚜️⚜️⚜️⚜️ LEGEND KING — 2 ROYAL DECREES this tenure!' : '';
      if (selfIsKingpin) {
        screenShake(10, 700);
        const decreeLine = ev.isLegend ? '\n⚜️ Press [O] for 2 ROYAL DECREES (LEGEND POWER)!' : '\n⚜️ Press [O] to issue a ROYAL DECREE!';
        showAnnouncement(`👑 YOU ARE THE KINGPIN!\n${ev.coins}c makes you the richest bird.\nYou earn tribute — but you are a TARGET!${decreeLine}${shieldNote}`, '#ffd700', 5000);
      } else if (ev.oldKingpin) {
        addEventMessage(`👑 ${ev.birdName} seized the crown from ${ev.oldKingpin}! (${ev.coins}c)${ev.champShield ? ' 🏆 CHAMPION SHIELD!' : ''}${ev.isLegend ? ' ⚜️ LEGEND — 2 decrees!' : ''}`, '#ffd700');
        showAnnouncement(`👑 NEW KINGPIN: ${ev.birdName}!\nPoop them 3× to steal the crown!${shieldNoteOther}${legendNote}`, '#ffd700', 4000);
      } else {
        addEventMessage(`👑 ${ev.birdName} has been crowned KINGPIN! (${ev.coins}c)${ev.champShield ? ' 🏆 CHAMPION SHIELD!' : ''}${ev.isLegend ? ' ⚜️ LEGEND — 2 decrees!' : ''}`, '#ffd700');
        showAnnouncement(`👑 KINGPIN: ${ev.birdName}!\nPoop them 3× to dethrone and loot them!${shieldNoteOther}${legendNote}`, '#ffd700', 4000);
      }
      effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
    }
    if (ev.type === 'kingpin_dethroned') {
      if (ev.reason === 'defeated' && ev.deposedByName) {
        const selfDeposed = ev.deposedByName === (gameState && gameState.self && gameState.self.name);
        const poolLine = ev.poolPayout > 0 ? `\n💀 +${ev.poolPayout}c POOL PAYOUT!` : '';
        if (selfDeposed) {
          screenShake(16, 900);
          showAnnouncement(`💰 YOU DETHRONED ${ev.deposed}!\n+${ev.loot}c LOOTED! +450 XP! +2 MAFIA REP!${poolLine}`, '#ffd700', 5500);
        } else if (ev.deposed && gameState && gameState.self && ev.deposed === gameState.self.name) {
          screenShake(14, 800);
          showAnnouncement(`💀 YOU WERE DETHRONED by ${ev.deposedByName}!\nThey looted ${ev.loot}c from your stash!`, '#ff4444', 4500);
        } else {
          showAnnouncement(`👑 ${ev.deposedByName} DETHRONED ${ev.deposed}! (+${ev.loot}c loot)${poolLine ? '\n' + poolLine.trim() : ''}`, '#ff8800', 4000);
        }
        addEventMessage(`👑 ${ev.deposedByName} dethroned ${ev.deposed} and looted ${ev.loot}c!`, '#ff8800');
        effects.push({ type: 'screen_shake', intensity: 10, duration: 600, time: now });
      } else if (ev.reason === 'disconnected') {
        addEventMessage(`👑 ${ev.deposed} left the city — throne is vacant!`, '#888');
      } else if (ev.reason === 'broke') {
        addEventMessage(`👑 ${ev.deposed} spent their fortune — throne is vacant!`, '#888');
      }
    }

    // === DETHRONEMENT POOL EVENTS ===
    if (ev.type === 'pool_contributed') {
      const isSelf = ev.birdId === myId;
      if (isSelf) {
        showAnnouncement(`💀 You added ${ev.amount}c to the Dethronement Pool!\nPool total: ${ev.poolTotal}c`, '#ff6600', 2500);
      }
      addEventMessage(`💀 ${ev.birdName} put ${ev.amount}c in the Dethronement Pool! (Total: ${ev.poolTotal}c)`, '#ff8800');
      updatePoolHudPill(ev.poolTotal);
    }
    if (ev.type === 'pool_paid_out') {
      const isSelf = ev.winnerName === (gameState && gameState.self && gameState.self.name);
      screenShake(18, 1000);
      if (isSelf) {
        showAnnouncement(`💰💀 POOL PAYOUT! +${ev.amount}c\nThe Dethronement Pool was YOURS!`, '#ff6600', 6000);
      } else {
        showAnnouncement(`💀 ${ev.winnerName} claimed the DETHRONEMENT POOL!\n${ev.amount}c paid out!`, '#ff6600', 4500);
      }
      addEventMessage(`💀 POOL CLAIMED: ${ev.winnerName} earned ${ev.amount}c from the Dethronement Pool!`, '#ff6600');
      updatePoolHudPill(0);
    }
    if (ev.type === 'pool_error') {
      if (ev.birdId === myId) {
        const msg = document.getElementById('bbContributeMsg');
        if (msg) { msg.textContent = ev.msg; setTimeout(() => { msg.textContent = ''; }, 3000); }
      }
    }
    if (ev.type === 'wp_fail') {
      if (ev.birdId === myId) {
        const msg = document.getElementById('bbWpMsg');
        if (msg) { msg.textContent = ev.msg; setTimeout(() => { msg.textContent = ''; }, 3500); }
      }
    }
    if (ev.type === 'witness_protection_active') {
      const isSelf = ev.birdId === myId;
      if (isSelf) {
        screenShake(10, 600);
        showAnnouncement('🛡 WITNESS PROTECTION ACTIVE!\nYou vanish from the radar for 3 minutes.\nAll heat cleared. Bounty Hunter stands down.', '#44aaff', 6000);
        addEventMessage(`🛡 ${ev.birdName} entered WITNESS PROTECTION — they are now off the grid!`, '#44aaff');
      } else {
        addEventMessage(`🛡 ${ev.birdName} entered Witness Protection — they vanished from the minimap!`, '#4488cc');
      }
    }
    if (ev.type === 'kingpin_hit') {
      if (ev.attackerId === myId) {
        effects.push({ type: 'text', x: ev.x || camera.x, y: (ev.y || camera.y) - 25, time: now, duration: 1500,
          text: `👑 KINGPIN HIT ${ev.count}/3`, color: '#ffd700', size: 16 });
        if (ev.count === 2) {
          showAnnouncement(`💀 ONE MORE HIT to dethrone ${ev.targetName}!`, '#ffd700', 2000);
        }
      } else if (ev.count === 2) {
        addEventMessage(`⚠️ ${ev.attackerName} has hit ${ev.targetName} twice! One more dethrones the Kingpin!`, '#ffaa00');
      }
    }
    if (ev.type === 'kingpin_tribute') {
      if (ev.birdId === myId) {
        const tribText = ev.bloodMoon ? `+${ev.amount}c TRIBUTE 🌑 (DOUBLED!)` : `+${ev.amount}c TRIBUTE`;
        const tribColor = ev.bloodMoon ? '#ff8844' : '#ffd700';
        effects.push({ type: 'xp', x: camera.x, y: camera.y - 30, time: now, duration: 1800,
          text: tribText, color: tribColor });
      }
    }
    if (ev.type === 'kingpin_topple_shockwave') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 800, time: now });
    }

    // === ROYAL DECREE EVENTS ===
    if (ev.type === 'royal_decree_issued') {
      const DECREE_NAMES = { gold_rush: '👑 GOLD RUSH', wanted_decree: '⚡ WANTED DECREE', royal_amnesty: '🛡️ ROYAL AMNESTY', tax_day: '💰 TAX DAY', kings_pardon: '👑 KING\'S PARDON' };
      const DECREE_DESCS = {
        gold_rush: 'All coin drops DOUBLED city-wide for 60 seconds!',
        wanted_decree: 'All birds immediately gain wanted heat — chaos erupts!',
        royal_amnesty: 'All law enforcement STANDS DOWN for 45 seconds!',
        tax_day: 'The Kingpin collects 10% of every bird\'s coins!\n🏴 REVOLT WINDOW OPENS — 15s to fight back!',
        kings_pardon: 'The most wanted criminal walks free by royal decree!',
      };
      const selfIsKingpin = ev.kingpinId === myId;
      const decName = DECREE_NAMES[ev.decreeType] || ev.decreeType;
      const decDesc = DECREE_DESCS[ev.decreeType] || '';
      screenShake(12, 700);
      if (selfIsKingpin) {
        showAnnouncement(`⚜️ YOU ISSUED A ROYAL DECREE!\n${decName}\n${decDesc}`, '#ffd700', 6000);
      } else {
        showAnnouncement(`⚜️ ROYAL DECREE from ${ev.gangTag ? `[${ev.gangTag}] ` : ''}${ev.kingpinName}:\n${decName}\n${decDesc}`, '#ffd700', 6000);
      }
      addEventMessage(`⚜️ ROYAL DECREE: ${ev.kingpinName} issues ${decName}!`, '#ffd700');
    }
    if (ev.type === 'royal_decree_expired') {
      const DECREE_NAMES = { gold_rush: 'GOLD RUSH', royal_amnesty: 'ROYAL AMNESTY' };
      const name = DECREE_NAMES[ev.decreeType];
      if (name) addEventMessage(`⚜️ DECREE EXPIRED: ${name} has ended.`, '#aa8800');
    }
    if (ev.type === 'decree_fail') {
      const msgs = { not_kingpin: 'Only the Kingpin can issue decrees!', already_used: 'You already used your decree this tenure!', already_active: 'A decree is already in effect!', no_criminals: 'No wanted criminals to pardon — wait for a Most Wanted bird!' };
      if (ev.birdId === myId) showTemporaryPrompt('⚜️ ' + (msgs[ev.reason] || 'Cannot issue decree now.'), 'decreeBanner', 2500);
    }
    if (ev.type === 'decree_wanted_zap') {
      addEventMessage(`⚡ WANTED DECREE: ${ev.kingpinName} sentenced ${ev.targetCount} birds — wanted heat surges!`, '#ff4444');
    }
    if (ev.type === 'decree_taxed') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: camera.x, y: camera.y - 30, time: now, duration: 2000, text: `💰 TAX DAY −${ev.amount}c`, color: '#ff8800', size: 15 });
        showAnnouncement(`💰 THE KINGPIN TAXED YOU: −${ev.amount}c\n🏴 REVOLT! Poop the Kingpin — 15 seconds!`, '#ff8800', 4000);
      }
    }
    if (ev.type === 'decree_tax_collected') {
      addEventMessage(`💰 TAX DAY: ${ev.kingpinName} collected ${ev.total}c from the citizens!`, '#ffd700');
    }

    // === PEOPLE'S REVOLT EVENTS ===
    if (ev.type === 'revolt_window_start') {
      window._revoltWindowUntil = Date.now() + ev.windowMs;
      if (ev.kingpinId !== myId) {
        // For non-Kingpin birds: show the rage prompt
        showAnnouncement(`🏴 REVOLT WINDOW — ${Math.round(ev.windowMs / 1000)}s!\n${ev.kingpinName} just taxed everyone.\nPOOP THE KINGPIN! 3 different birds = OVERTHROW!`, '#ff4444', ev.windowMs);
      } else {
        showAnnouncement(`⚠️ YOUR TAX DAY OPENED A REVOLT WINDOW!\nBirds have ${Math.round(ev.windowMs / 1000)} seconds to rise up.\nFLY, DODGE, SURVIVE!`, '#ff6600', 4000);
      }
      addEventFeedMessage(`🏴 REVOLT WINDOW OPEN! ${Math.round(ev.windowMs / 1000)}s to overthrow ${ev.kingpinName}!`, '#ff4444');
    }
    if (ev.type === 'revolt_progress') {
      addEventFeedMessage(`🏴 REVOLT ${ev.revolters}/3 — ${ev.attackerName} joins the uprising against ${ev.kingpinName}!`, '#ff6622');
      if (ev.revolters === 2) {
        addEventFeedMessage(`🏴 ONE MORE BIRD to trigger THE PEOPLE'S REVOLT!`, '#ff4400');
      }
    }
    if (ev.type === 'peoples_revolt') {
      window._revoltWindowUntil = null;
      screenShake(22, 1800);
      const names = ev.participantNames.join(', ');
      if (ev.isPeoplesMarch) {
        showAnnouncement(`✊ THE PEOPLE'S MARCH!\n${ev.participantNames.length} birds OVERTHROW ${ev.kingpinName}!\nMob justice: ${ev.lootShare}c each!\n⚡ 5+ MARCHERS — 60% LOOT SEIZED!`, '#ff4400', 9000);
        addEventFeedMessage(`✊ THE PEOPLE'S MARCH — ${ev.participantNames.length} birds seize ${ev.totalLoot}c from ${ev.kingpinName}!`, '#ff4400');
      } else {
        showAnnouncement(`🏴 THE PEOPLE REVOLT!\n${ev.kingpinName} has been OVERTHROWN by the masses!\n${names} each earn ${ev.lootShare}c!`, '#ff6622', 8000);
        addEventFeedMessage(`🏴 REVOLUTION! ${ev.kingpinName} overthrown by ${names}!`, '#ff4422');
      }
    }
    if (ev.type === 'revolt_failed') {
      window._revoltWindowUntil = null;
      addEventFeedMessage(`🏴 The revolt fizzled... only ${ev.count}/${ev.needed} birds joined the uprising.`, '#886644');
    }

    // === ROYAL COURT EVENTS ===
    if (ev.type === 'court_titled') {
      const COURT_EMOJIS = { Duke: '👑', Baron: '🥈', Count: '🥉' };
      const COURT_COLORS = { Duke: '#ffd700', Baron: '#c8c8d0', Count: '#cd8c5a' };
      const emoji = COURT_EMOJIS[ev.title] || '';
      const color = COURT_COLORS[ev.title] || '#ccc';
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      if (ev.birdId === myId) {
        screenShake(8, 500);
        showAnnouncement(`${emoji} YOU ARE NOW THE ${ev.title.toUpperCase()} OF BIRD CITY!\nNoble tribute flows to you every 30 seconds!\nStay rich to keep your title.`, color, 6000);
        addEventMessage(`${emoji} YOU EARNED THE TITLE OF ${ev.title.toUpperCase()}!`, color);
      } else {
        addEventMessage(`${emoji} ${tag}${ev.birdName} is now the ${ev.title} of Bird City!`, color);
      }
    }
    if (ev.type === 'court_tribute') {
      if (ev.birdId === myId) {
        const COURT_EMOJIS = { Duke: '👑', Baron: '🥈', Count: '🥉' };
        const COURT_COLORS = { Duke: '#ffd700', Baron: '#c8c8d0', Count: '#cd8c5a' };
        // Subtle floating text — no announcement spam
        addEventMessage(`${COURT_EMOJIS[ev.title] || ''} Noble tribute: +${ev.amount}c (${ev.title})`, COURT_COLORS[ev.title] || '#ccc');
      }
    }
    if (ev.type === 'court_lost_title') {
      if (ev.birdId === myId) {
        const COURT_EMOJIS = { Duke: '👑', Baron: '🥈', Count: '🥉' };
        addEventMessage(`${COURT_EMOJIS[ev.title] || ''} You lost the title of ${ev.title} — your wealth slipped!`, '#888');
      }
    }

    // === NOBLE ASCENSION (court member becomes Kingpin) ===
    if (ev.type === 'noble_ascension') {
      screenShake(14, 1000);
      showAnnouncement(`⚜️ NOBLE ASCENSION!\n${ev.announcement}`, '#ffd700', 8000);
      addEventMessage(ev.announcement, '#ffd700');
    }

    // === SPRING WITNESS BONUS ===
    if (ev.type === 'spring_witness_bonus' && ev.birdId === myId) {
      showAnnouncement('🌸🏮 SPRING WITNESS!\nYou were present when the Hanami Lantern rose!\nDaily challenge progress awarded!', '#ff99cc', 4000);
    }

    // === DUKE'S CHALLENGE EVENTS ===
    if (ev.type === 'duke_challenge_started') {
      window._dukeChallenge = ev;
      window._dukeChallengeStartedAt = Date.now();
      const dTag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      screenShake(8, 600);
      showAnnouncement(
        `👑 DUKE'S CHALLENGE!\n${dTag}${ev.dukeName} issues a city challenge!\n${ev.desc}\nReward: ${ev.reward}c to first completer!\nExpires in ${Math.round(ev.duration / 1000)}s`,
        '#ffd700', 8000
      );
      addEventMessage(`👑 DUKE'S CHALLENGE by ${dTag}${ev.dukeName}: "${ev.desc}" — ${ev.reward}c reward!`, '#ffd700');
    }
    if (ev.type === 'duke_challenge_progress') {
      window._dukeChallengeProgressData = window._dukeChallengeProgressData || {};
      // Server sends: birdId, name, gangTag, current, target
      const dcBirdName = ev.birdName || ev.name;
      const dcProgress = ev.progress !== undefined ? ev.progress : ev.current;
      window._dukeChallengeProgressData[ev.birdId] = { name: dcBirdName, gangTag: ev.gangTag, progress: dcProgress };
      if (ev.birdId === myId) {
        const target = (window._dukeChallenge && window._dukeChallenge.target) || ev.target || 1;
        const pct = Math.min(100, Math.round((dcProgress / target) * 100));
        addEventMessage(`👑 Your Duke Challenge progress: ${dcProgress}/${target} (${pct}%)`, '#ffd700');
      } else {
        const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
        const target = (window._dukeChallenge && window._dukeChallenge.target) || ev.target || 1;
        addEventMessage(`👑 ${tag}${dcBirdName} progresses: ${dcProgress}/${target}`, '#ccaa00');
      }
    }
    if (ev.type === 'duke_challenge_claimed') {
      window._dukeChallenge = null;
      window._dukeChallengeProgressData = {};
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      screenShake(12, 900);
      if (ev.birdId === myId) {
        showAnnouncement(`👑🏆 DUKE'S CHALLENGE COMPLETE!\nYou won ${ev.reward}c + ${ev.xp} XP!\nThe Duke is impressed.`, '#ffd700', 7000);
      } else {
        showAnnouncement(`👑 ${tag}${ev.birdName} completed the Duke's Challenge!\n+${ev.reward}c +${ev.xp} XP`, '#ffd700', 5000);
      }
      addEventMessage(`👑 ${tag}${ev.birdName} claimed the Duke's Challenge! +${ev.reward}c +${ev.xp} XP`, '#ffd700');
    }
    if (ev.type === 'duke_challenge_expired') {
      window._dukeChallenge = null;
      window._dukeChallengeProgressData = {};
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      addEventMessage(`👑 ${tag}${ev.dukeName}'s challenge expired unclaimed. The Duke is displeased.`, '#aa8800');
    }
    if (ev.type === 'duke_challenge_cancelled') {
      window._dukeChallenge = null;
      window._dukeChallengeProgressData = {};
      addEventMessage(`👑 ${ev.dukeName} cancelled their city challenge. (50% refund granted)`, '#aa8800');
    }
    if (ev.type === 'duke_challenge_fail' && ev.birdId === myId) {
      const FAIL_MSGS = {
        not_duke: 'Only the Duke can issue challenges!',
        already_active: 'A Duke\'s Challenge is already active! Wait for it to end.',
        cooldown: `You must wait before issuing another challenge.`,
        insufficient_coins: 'You don\'t have enough coins to issue that challenge!',
        invalid_type: 'Invalid challenge type.',
        invalid_reward: 'Reward must be 20–500 coins.',
        invalid_target: 'Invalid challenge target value.',
        no_bird: 'You must be connected to issue challenges.',
        no_coins: 'Not enough coins!',
      };
      addEventMessage(`👑 Challenge failed: ${FAIL_MSGS[ev.reason] || ev.reason}`, '#ff6644');
    }

    // === BARON'S DECREE EVENTS ===
    if (ev.type === 'baron_challenge_started') {
      window._baronChallenge = ev;
      const bTag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      screenShake(6, 400);
      showAnnouncement(`🥈 BARON'S DECREE!\n${bTag}${ev.baronName} issues a city challenge!\n${ev.desc}\nReward: ${ev.reward}c! Expires in ${Math.round(ev.duration / 1000)}s`, '#c8c8d0', 6000);
      addEventMessage(`🥈 BARON'S DECREE by ${bTag}${ev.baronName}: "${ev.desc}" — ${ev.reward}c reward!`, '#c8c8d0');
    }
    if (ev.type === 'baron_challenge_progress') {
      const name2 = ev.birdName || ev.name;
      const tag2 = ev.gangTag ? `[${ev.gangTag}] ` : '';
      if (ev.birdId === myId) {
        addEventMessage(`🥈 Baron progress: ${ev.current}/${ev.target}`, '#c8c8d0');
      } else {
        addEventMessage(`🥈 ${tag2}${name2}: ${ev.current}/${ev.target}`, '#a8a8b0');
      }
    }
    if (ev.type === 'baron_challenge_claimed') {
      window._baronChallenge = null;
      const tag3 = ev.gangTag ? `[${ev.gangTag}] ` : '';
      screenShake(10, 700);
      if (ev.winnerId === myId) {
        showAnnouncement(`🥈🏆 BARON'S DECREE COMPLETE!\nYou won ${ev.reward}c! The Baron is pleased.`, '#c8c8d0', 6000);
      } else {
        showAnnouncement(`🥈 ${tag3}${ev.winnerName} completed the Baron's Decree! +${ev.reward}c`, '#c8c8d0', 4000);
      }
      addEventMessage(`🥈 ${tag3}${ev.winnerName} claimed the Baron's Decree! +${ev.reward}c`, '#c8c8d0');
    }
    if (ev.type === 'baron_challenge_expired') {
      window._baronChallenge = null;
      addEventMessage(`🥈 The Baron's Decree expired unclaimed.`, '#888');
    }
    if (ev.type === 'baron_challenge_cancelled') {
      window._baronChallenge = null;
      addEventMessage(`🥈 ${ev.baronName} cancelled their Decree. (50% refund)`, '#888');
    }
    if (ev.type === 'baron_challenge_fail' && ev.birdId === myId) {
      const FAIL_MSGS = { not_baron: 'Only the Baron can issue Decrees!', already_active: 'A Baron\'s Decree is already active!', cooldown: 'Decree on cooldown — wait a bit.', no_coins: 'Not enough coins!' };
      addEventMessage(`🥈 Decree failed: ${FAIL_MSGS[ev.reason] || ev.reason}`, '#ff6644');
    }

    // === COUNT'S EDICT EVENTS ===
    if (ev.type === 'count_challenge_started') {
      window._countChallenge = ev;
      const cTag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      screenShake(4, 300);
      showAnnouncement(`🥉 COUNT'S EDICT!\n${cTag}${ev.countName} issues a mini-challenge!\n${ev.desc}\nReward: ${ev.reward}c! Expires in ${Math.round(ev.duration / 1000)}s`, '#cd8c5a', 5000);
      addEventMessage(`🥉 COUNT'S EDICT by ${cTag}${ev.countName}: "${ev.desc}" — ${ev.reward}c!`, '#cd8c5a');
    }
    if (ev.type === 'count_challenge_progress') {
      const name4 = ev.birdName || ev.name;
      if (ev.birdId === myId) {
        addEventMessage(`🥉 Count progress: ${ev.current}/${ev.target}`, '#cd8c5a');
      } else {
        const tag4 = ev.gangTag ? `[${ev.gangTag}] ` : '';
        addEventMessage(`🥉 ${tag4}${name4}: ${ev.current}/${ev.target}`, '#a07040');
      }
    }
    if (ev.type === 'count_challenge_claimed') {
      window._countChallenge = null;
      const tag5 = ev.gangTag ? `[${ev.gangTag}] ` : '';
      screenShake(8, 600);
      if (ev.winnerId === myId) {
        showAnnouncement(`🥉🏆 COUNT'S EDICT COMPLETE!\nYou won ${ev.reward}c! The Count nods approvingly.`, '#cd8c5a', 5000);
      } else {
        showAnnouncement(`🥉 ${tag5}${ev.winnerName} completed the Count's Edict! +${ev.reward}c`, '#cd8c5a', 3000);
      }
      addEventMessage(`🥉 ${tag5}${ev.winnerName} claimed the Count's Edict! +${ev.reward}c`, '#cd8c5a');
    }
    if (ev.type === 'count_challenge_expired') {
      window._countChallenge = null;
      addEventMessage(`🥉 The Count's Edict expired unclaimed.`, '#886644');
    }
    if (ev.type === 'count_challenge_cancelled') {
      window._countChallenge = null;
      addEventMessage(`🥉 ${ev.countName} cancelled their Edict. (50% refund)`, '#886644');
    }
    if (ev.type === 'count_challenge_fail' && ev.birdId === myId) {
      const FAIL_MSGS = { not_count: 'Only the Count can issue Edicts!', already_active: 'A Count\'s Edict is already active!', cooldown: 'Edict on cooldown — wait a bit.', no_coins: 'Not enough coins!' };
      addEventMessage(`🥉 Edict failed: ${FAIL_MSGS[ev.reason] || ev.reason}`, '#ff6644');
    }

    // === NOBLE PERKS TIER 2 — Baron's Import + Count's City Intel ===
    if (ev.type === 'baron_import_catalog' && ev.birdId === myId) {
      renderBaronImportOverlay(ev.catalog);
    }
    if (ev.type === 'baron_import_purchased' && ev.birdId === myId) {
      closeBaronImportOverlay();
      screenShake(6, 400);
      showAnnouncement(`🥈 NOBLE IMPORT!\n${ev.emoji} ${ev.itemName} delivered to your talons!\n−${ev.cost}c (includes 20% import fee)`, '#c8c8d0', 5000);
      addEventMessage(`🥈 ${ev.announcement}`, '#c8c8d0');
    }
    if (ev.type === 'baron_import_purchased' && ev.birdId !== myId) {
      addEventMessage(`🥈 ${ev.announcement}`, '#a0a0c0');
    }
    if (ev.type === 'baron_import_fail' && ev.birdId === myId) {
      addEventMessage(`🥈 Noble Import failed: ${ev.reason}`, '#ff6644');
    }
    if (ev.type === 'count_intel_revealed' && ev.birdId === myId) {
      window._countIntelTip = { nextType: ev.nextType, emoji: ev.emoji, label: ev.label };
      screenShake(4, 300);
      showAnnouncement(`🥉 COUNT'S CITY INTEL!\n${ev.emoji} Next weather: ${ev.label.toUpperCase()}\nBet NOW before the window opens!`, '#cd8c5a', 8000);
      addEventMessage(`🥉 COUNT'S INTEL: Next weather is ${ev.emoji} ${ev.label}! Place your bet early!`, '#cd8c5a');
    }
    if (ev.type === 'count_intel_gang' && ev.birdId === myId) {
      window._countIntelTip = { nextType: ev.nextType, emoji: ev.emoji, label: ev.label };
      screenShake(3, 200);
      showAnnouncement(`🥉 GANG INTEL from ${ev.countName} (Count)!\n${ev.emoji} Next weather: ${ev.label.toUpperCase()}\nBet before the window!`, '#cd8c5a', 6000);
      addEventMessage(`🥉 Gang intel: ${ev.message}`, '#cd8c5a');
    }
    if (ev.type === 'count_intel_fail' && ev.birdId === myId) {
      addEventMessage(`🥉 City Intel failed: ${ev.reason}`, '#ff6644');
    }
    // Clear intel tip once weather arrives (it was correct!)
    if (ev.type === 'weather_start') {
      if (window._countIntelTip && window._countIntelTip.nextType === ev.weatherType) {
        addEventMessage(`🥉 COUNT'S INTEL WAS RIGHT! ${window._countIntelTip.emoji} ${ev.weatherType.toUpperCase()} arrived!`, '#ffd700');
      }
      window._countIntelTip = null;
    }

    // === NOBLE CARTEL DEFENSE (Royal Court × Crow Cartel synergy) ===
    if (ev.type === 'noble_cartel_defense') {
      const TITLE_EMOJI = { Duke: '👑', Baron: '🥈', Count: '🥉' };
      const emoji = TITLE_EMOJI[ev.title] || '⚜️';
      const tag6 = ev.gangTag ? `[${ev.gangTag}] ` : '';
      if (ev.birdId === myId) {
        addEventMessage(`${emoji} NOBLE DEFENSE BONUS! 2× XP for defending ${ev.zoneName} as ${ev.title}!`, '#ffd700');
      } else {
        addEventMessage(`${emoji} ${tag6}${ev.birdName} defends ${ev.zoneName} as the ${ev.title}! 2× XP bonus!`, '#ccaa00');
      }
    }

    // === KING'S PARDON EVENTS ===
    if (ev.type === 'kings_pardon_issued') {
      if (ev.pardonedId === myId) {
        screenShake(10, 800);
        showAnnouncement(`👑 ROYAL PARDON!\n${ev.kingpinName} has pardoned you!\nAll heat cleared! Cops stand down for 3 minutes!`, '#44cc88', 6000);
      } else {
        showAnnouncement(`👑 ROYAL PARDON\n${ev.kingpinName} grants full pardon to ${ev.pardonedName}!`, '#44cc88', 4000);
      }
      addEventFeedMessage(`👑 ROYAL PARDON: ${ev.kingpinName} frees ${ev.pardonedName} from all charges!`, '#44cc88');
    }

    // === DECREE CROSS-SYSTEM SYNERGIES ===
    if (ev.type === 'gang_war_decree_boost') {
      screenShake(10, 600);
      showAnnouncement(`⚡⚔️ WANTED DECREE + GANG WAR!\n${ev.kingpinName}'s decree supercharges the battle!\nAll gang war kills: 1.5× XP for ${ev.duration}s!`, '#ff8844', 5000);
      addEventFeedMessage(`⚡⚔️ GANG WAR DECREE BOOST — gang kills give +50% XP for ${ev.duration}s!`, '#ff8844');
    }
    if (ev.type === 'gold_rush_crime_wave_combo') {
      screenShake(12, 700);
      showAnnouncement(`👑💰🚨 GOLD RUSH + CRIME WAVE!\n${ev.kingpinName}'s decree meets the Crime Wave!\n4× COINS on all poop hits right now!`, '#ffcc00', 5000);
      addEventFeedMessage(`💰 GOLD RUSH × CRIME WAVE — 4× COINS stacked!`, '#ffcc00');
    }

    // === FLOCK EVENTS ===
    if (ev.type === 'flock_invite') {
      if (ev.toId === myId) {
        SoundEngine.flockInvite();
      }
    }
    if (ev.type === 'flock_joined') {
      addEventMessage(ev.birdName + ' joined ' + ev.flockName + '!', '#4ade80');
    }

    // === GANG EVENTS ===
    if (ev.type === 'gang_created') {
      addEventMessage(`🔥 [${ev.gangTag}] ${ev.gangName} founded by ${ev.birdName}!`, ev.gangColor || '#ff6633');
      if (ev.birdId === myId) {
        showAnnouncement(`🔥 [${ev.gangTag}] ${ev.gangName} IS BORN!`, ev.gangColor || '#ff6633', 3500);
      }
    }
    if (ev.type === 'gang_joined') {
      addEventMessage(`${ev.birdName} joined [${ev.gangTag}] ${ev.gangName}!`, '#ff9966');
    }
    if (ev.type === 'gang_disbanded') {
      addEventMessage(`[${ev.gangTag}] ${ev.gangName} has disbanded.`, '#888');
    }
    if (ev.type === 'gang_deposit') {
      if (ev.birdId === myId) {
        addEventMessage(`💰 You deposited ${ev.amount}c into [${ev.gangTag}] treasury (${ev.treasury}c total)`, '#ffd700');
      }
    }
    if (ev.type === 'gang_treasury_distributed') {
      addEventMessage(`💸 [${ev.gangTag}] ${ev.gangName} distributed ${ev.perMember}c to ${ev.memberCount} members!`, '#ffd700');
    }
    if (ev.type === 'gang_war_declared') {
      SoundEngine.bossSpawn();
      showAnnouncement(`⚔️ GANG WAR! [${ev.gang1Tag}] vs [${ev.gang2Tag}] — 10 MINUTES!`, '#ff3333', 5000);
      addEventMessage(`⚔️ [${ev.gang1Tag}] ${ev.gang1Name} declared war on [${ev.gang2Tag}] ${ev.gang2Name}!`, '#ff3333');
      effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      showGangWarHud(`⚔️ [${ev.gang1Tag}] vs [${ev.gang2Tag}] — GANG WAR!`, 6000);
    }
    if (ev.type === 'gang_war_hit') {
      const domeHitNote = ev.domeBonus ? ' ⚡ DOME DOUBLE HIT!' : '';
      if (ev.targetId === myId) {
        addEventMessage(`🎯 [${ev.attackerTag}] ${ev.attackerName} hit you! (${ev.hits}/3)${domeHitNote}`, '#ff4444');
      }
      if (ev.attackerId === myId) {
        addEventMessage(`🎯 Hit [${ev.targetTag}] ${ev.targetName}! (${ev.hits}/3)${domeHitNote}`, '#ff9944');
      }
    }
    if (ev.type === 'gang_war_kill') {
      SoundEngine.coinPickup && SoundEngine.coinPickup();
      const auroraExtra = ev.auroraBonus ? ' ✨ 2× AURORA XP!' : '';
      const domeExtra = ev.domeBonus ? ' ⚡ DOME KILL!' : '';
      const bloodMoonExtra = ev.bloodMoonBonus ? ' 🌑 1.5× BLOOD MOON XP!' : '';
      showAnnouncement(`💀 [${ev.attackerGangTag}] ${ev.attackerName} SMOKED [${ev.targetGangTag}] ${ev.targetName}! (+${ev.loot}c)${auroraExtra}${domeExtra}${bloodMoonExtra}`, ev.attackerGangColor || '#ff3333', 4000);
      const aurFeedMsg = ev.auroraBonus ? ' ✨ AURORA BONUS XP!' : '';
      const domeFeedMsg = ev.domeBonus ? ' ⚡ DOME KILL +50% XP!' : '';
      addEventMessage(`💀 [${ev.attackerGangTag}] ${ev.attackerName} ELIMINATED [${ev.targetGangTag}] ${ev.targetName} (+${ev.loot}c loot)${aurFeedMsg}${domeFeedMsg}`, '#ff4444');
      effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
    }
    if (ev.type === 'gang_war_ended') {
      const winMsg = ev.winnerName ? `[${ev.winnerTag}] ${ev.winnerName} WINS the war! (${Math.max(ev.gang1Kills, ev.gang2Kills)}-${Math.min(ev.gang1Kills, ev.gang2Kills)} kills)` : `War ended in a DRAW!`;
      showAnnouncement(`⚔️ WAR OVER! ${winMsg}`, '#ff8800', 5000);
      addEventMessage(`⚔️ Gang war ended! ${winMsg}`, '#ff8800');
      showGangWarHud(`⚔️ WAR OVER — ${winMsg}`, 7000);
    }
    if (ev.type === 'gang_error') {
      if (ev.birdId === myId) {
        addEventMessage(`⚠️ ${ev.msg}`, '#ff8844');
      }
    }
    if (ev.type === 'nest_error') {
      if (ev.birdId === myId) {
        addEventMessage(`🏠 ${ev.msg}`, '#ff8844');
      }
    }
    if (ev.type === 'nest_built') {
      showAnnouncement(`🏠 [${ev.gangTag}] GANG NEST BUILT by ${ev.birdName}!`, ev.gangColor || '#66ff88', 3500);
      addEventMessage(`🏠 [${ev.gangTag}] ${ev.gangName} built a gang nest!`, ev.gangColor || '#66ff88');
      effects.push({ type: 'screen_shake', intensity: 5, duration: 400, time: now });
    }
    if (ev.type === 'nest_hit') {
      if (ev.attackerId === myId) {
        addEventMessage(`🏠 You hit [${ev.gangTag}] nest! (${ev.hp}/${ev.maxHp} HP)`, '#ffaa44');
      }
      // Show floating damage numbers near the nest
      effects.push({ type: 'float_text', text: `-${ev.damage}HP`, x: ev.x, y: ev.y - 20, color: '#ff4444', duration: 900, time: now });
    }
    if (ev.type === 'nest_destroyed') {
      SoundEngine.bossSpawn && SoundEngine.bossSpawn();
      showAnnouncement(`💥 [${ev.gangTag}] NEST DESTROYED by ${ev.attackerName}! (+150 XP +80c)`, '#ff4444', 5000);
      addEventMessage(`💥 [${ev.attackerName}] RAIDED [${ev.gangTag}] ${ev.gangName}'s nest! (+150 XP)`, '#ff4444');
      effects.push({ type: 'screen_shake', intensity: 12, duration: 700, time: now });
    }
    if (ev.type === 'nest_respawn') {
      if (ev.birdId === myId) {
        showAnnouncement('🏠 RESPAWNED AT YOUR GANG NEST!', '#66ff88', 2500);
      }
    }
    if (ev.type === 'nest_aura') {
      for (const r of ev.rewards || []) {
        if (r.birdId === myId) {
          addEventMessage(`🏠 Gang nest aura: +15 XP +5c`, ev.gangColor || '#66ff88');
        }
      }
    }

    // === GANG SIEGE EVENTS ===
    if (ev.type === 'siege_start') {
      window._activeSieges = window._activeSieges || {};
      window._activeSieges[ev.siegeId] = ev;
      effects.push({ type: 'screen_shake', intensity: 10, duration: 600, time: now });
      const isMyAttack  = gameState && gameState.myGang && gameState.myGang.id === ev.attackingGangId;
      const isMyDefense = gameState && gameState.myGang && gameState.myGang.id === ev.defendingGangId;
      showAnnouncement(
        `⚔️ GANG SIEGE DECLARED!\n[${ev.attackingGangTag}] ${ev.attackingGangName} ATTACKS [${ev.defendingGangTag}] NEST!\n4 minutes — POOP the nest to break it!`,
        ev.attackingGangColor || '#ff4444', 7000
      );
      addEventMessage(
        `⚔️ [${ev.attackingGangTag}] declared a SIEGE on [${ev.defendingGangTag}]'s nest! 4-minute assault begins!`,
        ev.attackingGangColor || '#ff4444'
      );
      if (isMyAttack) {
        showAnnouncement('⚔️ YOUR SIEGE HAS BEGUN! Fly to the enemy nest and POOP it down! (200 HP pool)', '#ff4444', 5000);
      } else if (isMyDefense) {
        showAnnouncement('🛡️ YOUR NEST IS UNDER SIEGE! Defend it — poop the attackers away!', '#ffaa00', 5000);
      }
    }
    if (ev.type === 'siege_nest_hit') {
      // Update local siege HP
      if (window._activeSieges && window._activeSieges[ev.siegeId]) {
        window._activeSieges[ev.siegeId].hpPool = ev.hpPool;
      }
      effects.push({ type: 'float_text', text: `⚔️ -${ev.hpPool > 0 ? (window._activeSieges && window._activeSieges[ev.siegeId] ? (window._activeSieges[ev.siegeId].hpMaxPool - ev.hpPool) : '?') : 'BROKEN'}`, x: ev.x, y: ev.y - 30, color: ev.attackerGangColor || '#ff4444', duration: 1100, time: now });
      if (ev.attackerId === myId) {
        addEventMessage(`⚔️ Siege hit! Nest HP pool: ${ev.hpPool}/${ev.hpMaxPool}`, ev.attackerGangColor || '#ff4444');
      }
    }
    if (ev.type === 'siege_defense_hit') {
      if (ev.defenderId === myId) {
        effects.push({ type: 'float_text', text: '🛡️ +DEF!', x: ev.x, y: ev.y - 20, color: '#44ff88', duration: 900, time: now });
        addEventMessage(`🛡️ Defense hit on ${ev.attackerName}! Attacker stunned!`, '#44ff88');
      } else {
        // show float text at attacker position for nearby observers
        effects.push({ type: 'float_text', text: '🛡️ STUNNED!', x: ev.x, y: ev.y - 20, color: '#44ff88', duration: 900, time: now });
      }
    }
    if (ev.type === 'siege_warning') {
      const atkColor = (window._activeSieges && Object.values(window._activeSieges)[0]) ?
        Object.values(window._activeSieges)[0].attackingGangColor : '#ffaa44';
      addEventMessage(`⚔️ SIEGE: ${ev.seconds}s remaining! [${ev.attackingGangTag}] vs [${ev.defendingGangTag}]`, atkColor);
    }
    if (ev.type === 'siege_victory') {
      window._activeSieges = window._activeSieges || {};
      delete window._activeSieges[ev.siegeId];
      effects.push({ type: 'screen_shake', intensity: 18, duration: 900, time: now });
      showAnnouncement(
        `⚔️ SIEGE VICTORY!\n[${ev.attackingGangTag}] ${ev.attackingGangName} DESTROYED [${ev.defendingGangTag}]'s nest!\nTreasury looted: ${ev.stolenAmount}c — 20-min rebuild!`,
        ev.attackingGangColor || '#ff4444', 8000
      );
      addEventMessage(`⚔️ SIEGE VICTORY! [${ev.attackingGangTag}] smashed [${ev.defendingGangTag}]'s nest! ${ev.stolenAmount}c treasury stolen!`, ev.attackingGangColor || '#ff4444');
    }
    if (ev.type === 'siege_repelled') {
      window._activeSieges = window._activeSieges || {};
      delete window._activeSieges[ev.siegeId];
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      showAnnouncement(
        `🛡️ SIEGE REPELLED!\n[${ev.defendingGangTag}] defended their nest against [${ev.attackingGangTag}]!\nThe nest stands!`,
        ev.defendingGangColor || '#44ff88', 7000
      );
      addEventMessage(`🛡️ [${ev.defendingGangTag}] repelled the siege! [${ev.attackingGangTag}] spent 300c for nothing.`, ev.defendingGangColor || '#44ff88');
    }
    if (ev.type === 'siege_attacker_reward') {
      if (ev.birdId === myId) {
        showAnnouncement(`⚔️ SIEGE REWARD! +${ev.xp} XP +${ev.coins}c (incl. ${ev.treasureShare || 0}c looted treasury)`, '#ffaa44', 4000);
      }
    }
    if (ev.type === 'siege_defender_reward') {
      if (ev.birdId === myId) {
        showAnnouncement(`🛡️ DEFENDER REWARD! +${ev.xp} XP +${ev.coins}c for holding the line!`, '#44ff88', 4000);
      }
    }
    if (ev.type === 'siege_fail') {
      if (ev.birdId === myId) {
        const REASONS = {
          no_gang: 'You need a gang to declare a siege.',
          not_leader: 'Only the gang leader can declare a siege.',
          self_siege: "You can't siege your own gang.",
          no_target_gang: 'That gang no longer exists.',
          no_target_nest: 'That gang has no active nest to siege.',
          already_in_siege: 'Your gang is already involved in a siege.',
          no_funds: `Not enough treasury funds. Need 300c, have less.`,
        };
        addEventMessage(`⚔️ Siege failed: ${REASONS[ev.reason] || ev.reason}`, '#ff4444');
      }
    }

    // === CHAOS EVENTS ===
    if (ev.type === 'chaos_event') {
      SoundEngine.eventFanfare();
      window._lastChaosType = ev.chaosType;
      const isCrimeDisco = ev.isCrimeDisco;
      if (isCrimeDisco) {
        effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
        showAnnouncement('🚨🪩 CRIME DISCO!\n5× NPC XP · 3× crime coins — Dance AND commit crimes — at the same time!', '#ff44ff', 6000);
        addEventMessage('🚨🪩 CRIME DISCO! Double chaos: 5× NPC XP · 3× crime coins active!', '#ff44ff');
      } else {
        const CHAOS_INFO = {
          npc_flood:    { msg: '🚶 CHAOS: NPC FLOOD! Targets everywhere!',         color: '#ff4444', shake: 6 },
          car_frenzy:   { msg: '🚗 CHAOS: CAR FRENZY! Cars gone wild!',            color: '#ff8800', shake: 6 },
          golden_rain:  { msg: '🌟 CHAOS: GOLDEN RAIN! Grab the gold!',            color: '#ffd700', shake: 6 },
          poop_party:   { msg: '🎉 POOP PARTY! ALL poop is MEGA for 20 seconds!',  color: '#ff88ff', shake: 8 },
          coin_shower:  { msg: '💸 COIN SHOWER! Fly and collect the gold coins!',  color: '#ffd700', shake: 7 },
          food_festival:{ msg: '🎊 FOOD FESTIVAL! Premium food spawned citywide!', color: '#88ff44', shake: 6 },
          blackout:     { msg: '⚡ BLACKOUT! The city goes DARK — cops lose sight!',color: '#4488ff', shake: 7 },
          disco_fever:  { msg: '🪩 DISCO FEVER! 3× XP on all NPC hits — DANCE!',  color: '#ff88ff', shake: 7 },
        };
        const info = CHAOS_INFO[ev.chaosType] || { msg: 'CHAOS EVENT!', color: '#ff4444', shake: 6 };
        effects.push({ type: 'screen_shake', intensity: info.shake, duration: 500, time: now });
        showAnnouncement(info.msg, info.color, 4000);
        addEventMessage(info.msg, info.color);
      }
      // Track chaos types seen for Chaos Connoisseur daily challenge
      if (!window._chaosTypesSeen) window._chaosTypesSeen = new Set();
      window._chaosTypesSeen.add(ev.chaosType);
    }
    if (ev.type === 'chaos_event_end') {
      const lastType = window._lastChaosType || 'chaos';
      const END_NAMES = {
        npc_flood: 'The NPC flood subsides.', car_frenzy: 'Cars return to normal.',
        golden_rain: 'The golden rain dries up.', poop_party: '🎉 Poop Party is over — back to normal ammo.',
        coin_shower: '💸 Coin Shower done — better luck next time!',
        food_festival: '🎊 Food Festival ends — food stalls cleared.',
        blackout: '⚡ LIGHTS BACK ON — cops can see you again!',
        disco_fever: '🪩 Disco Fever fades — the dance floor goes quiet.',
      };
      addEventMessage(END_NAMES[lastType] || 'Chaos event ended.', '#888');
      window._lastChaosType = null;
    }
    if (ev.type === 'coin_shower_collect') {
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1400, text: '+' + ev.coins + 'c 💸', color: '#ffd700', size: 13 });
    }
    if (ev.type === 'festival_collect') {
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1400, text: '🎊 +' + ev.food + ' food', color: '#88ff44', size: 12 });
    }
    if (ev.type === 'seagull_festival_raid') {
      addEventMessage('🦅🎊 SEAGULLS ARE RAIDING THE FESTIVAL FOOD! Poop them for +90 XP!', '#ffaa44');
    }

    // === MYSTERY CRATE AIRDROP EVENTS ===
    if (ev.type === 'mystery_crate_spawn') {
      showAnnouncement('📦 MYSTERY CRATE AIRDROP! Race to claim it!', '#ffd700', 5000);
      addEventMessage('📦 A Mystery Crate landed somewhere in the city — first bird there wins!', '#ffd700');
      effects.push({ type: 'screen_shake', intensity: 6, duration: 500, time: now });
      // Store crate location so we can draw the direction arrow
      window._mysteryCrateLocation = { x: ev.x, y: ev.y, spawnedAt: now, expiresAt: ev.expiresAt };
    }
    if (ev.type === 'mystery_crate_claimed') {
      const isMe = ev.birdId === myId;
      const itemEmoji = ev.item.emoji;
      const itemName = ev.item.name;
      if (isMe) {
        showAnnouncement(`${itemEmoji} YOU GOT: ${itemName}!`, '#ffd700', 5000);
        addEventMessage(`📦 You claimed the crate and got ${itemEmoji} ${itemName}!`, '#ffd700');
        effects.push({ type: 'screen_shake', intensity: 10, duration: 600, time: now });
      } else {
        const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
        addEventMessage(`📦 ${tag}${ev.birdName} claimed the crate → ${itemEmoji} ${itemName}!`, '#ffcc44');
      }
      window._mysteryCrateLocation = null;
      // Coin shower particles for coin_cache
      if (isMe && ev.item.id === 'coin_cache') {
        for (let i = 0; i < 12; i++) {
          effects.push({
            type: 'coin_particle',
            x: (camera.screenW / 2) + (Math.random() - 0.5) * 200,
            y: (camera.screenH / 2) + (Math.random() - 0.5) * 200,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 3) * 3,
            time: now,
            duration: 1400,
          });
        }
      }
      // Twister: everyone nearby flies to different screen position
      if (isMe && ev.item.id === 'twister_bomb') {
        showAnnouncement('🌪️ TWISTER BOMB! Birds scattered!', '#ffaa00', 3000);
      }
    }
    if (ev.type === 'mystery_crate_expired') {
      addEventMessage('📦 The Mystery Crate disappeared — nobody claimed it!', '#888');
      window._mysteryCrateLocation = null;
    }

    // === BIRD FLU OUTBREAK EVENTS ===
    if (ev.type === 'flu_outbreak_start') {
      effects.push({ type: 'screen_shake', intensity: 6, duration: 500, time: now });
      showAnnouncement('🤧 BIRD FLU OUTBREAK! ' + ev.patientZeroName + ' is Patient Zero!\nFind green medicine items to cure yourself!', '#44ff44', 6000);
      addEventMessage('🤧 BIRD FLU OUTBREAK! ' + ev.patientZeroName + ' is Patient Zero. Medicine scattered across the city!', '#44ff44');
    }
    if (ev.type === 'flu_spread') {
      if (ev.targetId === myId) {
        showAnnouncement('🤧 YOU\'VE BEEN INFECTED! Find green medicine — avoid other birds!', '#88ff44', 4000);
        effects.push({ type: 'screen_shake', intensity: 4, duration: 300, time: now });
        effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1500, text: '🤧 INFECTED!', color: '#88ff44', size: 13 });
      } else {
        addEventMessage('🤧 ' + ev.targetName + ' caught the flu from ' + ev.fromName + '!', '#88cc44');
        effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1200, text: '🤧', color: '#88ff44', size: 16 });
      }
    }
    if (ev.type === 'flu_cured') {
      if (ev.birdId === myId) {
        showAnnouncement('💊 CURED! You found the medicine. Feeling great! +' + ev.xpGained + ' XP +' + ev.coinsGained + 'c', '#aaffcc', 3000);
        effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1500, text: '💊 CURED!', color: '#aaffcc', size: 13 });
      } else {
        addEventMessage('💊 ' + (ev.gangTag ? '[' + ev.gangTag + '] ' : '') + ev.birdName + ' found the medicine and was cured!', '#88eeaa');
      }
    }
    if (ev.type === 'flu_outbreak_end') {
      showAnnouncement('✅ The bird flu outbreak has ended. City is clean!', '#aaffcc', 3000);
      addEventMessage('✅ Bird flu outbreak over — all clear!', '#88cc88');
    }
    if (ev.type === 'flu_kingpin_infected') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      showAnnouncement('👑🤧 THE KINGPIN HAS THE FLU! ' + ev.name + ' is WEAKENED!', '#ffcc00', 5000);
      addEventMessage('👑🤧 KINGPIN ' + ev.name + ' is infected with bird flu — now\'s your chance!', '#ffcc00');
    }
    // Bird Flu cross-system: cop infected during arrest
    if (ev.type === 'flu_cop_infected') {
      if (ev.birdId === myId) {
        showAnnouncement('🤧💉 YOUR FLU INFECTED THE COP! 5s of freedom!', '#88ff88', 3000);
      }
      const cType = ev.copType === 'swat' ? 'SWAT crow' : 'cop pigeon';
      addEventMessage('🤧🚔 ' + ev.birdName + '\'s flu spread to the arresting ' + cType + '! It\'s staggering around sick!', '#88ee88');
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 2000, text: '🤧 FLU INFECTED!', color: '#88ff88', size: 13 });
    }
    // Bird Flu cross-system: bounty hunter infected during catch
    if (ev.type === 'flu_bh_infected') {
      if (ev.birdId === myId) {
        showAnnouncement('🤧🔫 YOUR FLU INFECTED THE BOUNTY HUNTER! 15s to escape!', '#88ff88', 4000);
      }
      addEventMessage('🤧🔫 ' + ev.birdName + '\'s bird flu dropped the Bounty Hunter! He\'s wandering confused for 15s!', '#88ee88');
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 2500, text: '🤧 BH SICK!', color: '#88ff88', size: 14 });
    }

    // === PIGEON PIED PIPER EVENTS ===
    if (ev.type === 'piper_appears') {
      effects.push({ type: 'screen_shake', intensity: 5, duration: 400, time: now });
      showAnnouncement('🎵 THE PIED PIPER APPEARS!\nPoop on him 6× before he steals your coins!', '#ff88ff', 6000);
      addEventMessage('🎵 The Pied Piper has appeared — his music enchants nearby birds! POOP HIM AWAY!', '#ff88ff');
      window._piperLocation = { x: ev.x, y: ev.y, endsAt: ev.endsAt };
    }
    if (ev.type === 'piper_enchanted') {
      if (ev.birdId === myId) {
        showAnnouncement('🎵 YOU\'RE ENCHANTED! Can\'t poop for 8 seconds — fight the music!', '#cc88ff', 3000);
        effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1500, text: '🎵 ENCHANTED!', color: '#ff88ff', size: 14 });
      }
    }
    if (ev.type === 'piper_hit') {
      effects.push({ type: 'text', x: ev.x, y: ev.y - 15, time: now, duration: 1200, text: `🎵 HIT! ${ev.hitCount}/${ev.hitsRequired}`, color: '#ff88ff', size: 12 });
      if (ev.hitCount === Math.floor(ev.hitsRequired / 2)) {
        addEventMessage(`🎵 Pied Piper hit ${ev.hitCount}/${ev.hitsRequired}× — keep going! ${ev.birdName} landed a hit!`, '#ff88ff');
      }
    }
    if (ev.type === 'piper_defeated') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      const tag = ev.defeaterGangTag ? `[${ev.defeaterGangTag}] ` : '';
      showAnnouncement(`🎵 PIED PIPER DRIVEN AWAY!\n${tag}${ev.defeaterName} landed the final hit!\n+${ev.rewardXp} XP +${ev.rewardCoins}c for ALL birds!`, '#ffaaff', 6000);
      addEventMessage(`🎵 ${tag}${ev.defeaterName} drove away the Pied Piper! Everyone gets +${ev.rewardXp} XP +${ev.rewardCoins}c!`, '#ff88ff');
      window._piperLocation = null;
      // Musical coin shower
      for (let i = 0; i < 14; i++) {
        effects.push({
          type: 'coin_particle',
          x: camera.screenW / 2 + (Math.random() - 0.5) * 260,
          y: camera.screenH / 2 + (Math.random() - 0.5) * 200,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 3) * 3,
          time: now,
          duration: 1600,
        });
      }
    }
    if (ev.type === 'piper_steal_personal') {
      if (ev.birdId === myId) {
        showAnnouncement(`🎵 THE PIPER STOLE ${ev.stolen} COINS! You were too close to his music!`, '#ff4488', 4000);
        effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1800, text: `-${ev.stolen}c`, color: '#ff4488', size: 14 });
        effects.push({ type: 'screen_shake', intensity: 5, duration: 350, time: now });
      }
    }
    if (ev.type === 'piper_stolen') {
      const victimList = ev.victims.slice(0, 3).map(v => `${v.name} (−${v.stolen}c)`).join(', ');
      addEventMessage(`🎵 The Pied Piper escaped! Stole ${ev.totalStolen} total coins: ${victimList}`, '#ff4488');
      window._piperLocation = null;
    }

    // === CURSED COIN EVENTS ===
    if (ev.type === 'cursed_coin_appeared') {
      effects.push({ type: 'screen_shake', intensity: 6, duration: 500, time: now });
      showAnnouncement('💀 THE CURSED COIN HAS MATERIALIZED!\n+2.5× coin gains — but beware the curse!', '#ff3366', 6000);
      addEventMessage('💀 The Cursed Coin appeared on the streets! First to grab it earns +2.5× coins!', '#ff3366');
    }
    if (ev.type === 'cursed_coin_tornado_flung') {
      effects.push({ type: 'screen_shake', intensity: 5, duration: 400, time: now });
      showAnnouncement('🌪️💀 TORNADO FLUNG THE CURSED COIN!\nIt\'s somewhere else now — check the minimap!', '#cc44ff', 5000);
      addEventMessage('🌪️💀 The tornado swept the Cursed Coin to a new location!', '#cc44ff');
      // Gold pulsing direction arrow handled via the existing cursed coin minimap dot (position updates automatically)
    }
    if (ev.type === 'cursed_coin_grabbed') {
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('💀 YOU GRABBED THE CURSED COIN!\n+2.5× coins · +20% speed · Everyone can see you!', '#ff6600', 5000);
      } else {
        addEventMessage(`💀 ${tag}${ev.birdName} grabbed the Cursed Coin! +2.5× coins... if they survive!`, '#ff3366');
      }
    }
    if (ev.type === 'cursed_coin_stolen') {
      const tag = ev.thiefGangTag ? `[${ev.thiefGangTag}] ` : '';
      const vTag = ev.victimGangTag ? `[${ev.victimGangTag}] ` : '';
      const isMe = ev.thiefId === myId;
      const stolenFromMe = ev.victimId === myId;
      if (isMe) {
        showAnnouncement(`💀 YOU STOLE THE CURSED COIN from ${vTag}${ev.victimName}!\nIntensity: ${ev.intensity}% — better hurry!`, '#ff6600', 4000);
      } else if (stolenFromMe) {
        showAnnouncement(`💀 ${tag}${ev.thiefName} STOLE THE CURSED COIN FROM YOU!`, '#ff4444', 4000);
        effects.push({ type: 'screen_shake', intensity: 4, duration: 300, time: now });
      } else {
        addEventMessage(`💀 ${tag}${ev.thiefName} SNATCHED the Cursed Coin from ${vTag}${ev.victimName}! (${ev.intensity}% intensity)`, '#ff5500');
      }
    }
    if (ev.type === 'cursed_coin_warning') {
      if (ev.birdId === myId) {
        const msg = ev.intensity >= 90
          ? '💀 THE CURSE IS ABOUT TO EXPLODE! RUN or brace for impact!'
          : '💀 CURSE INTENSIFYING! 75% — explosion coming!';
        showAnnouncement(msg, ev.intensity >= 90 ? '#ff0000' : '#ff6600', 3000);
        effects.push({ type: 'screen_shake', intensity: ev.intensity >= 90 ? 8 : 5, duration: 400, time: now });
      }
    }
    if (ev.type === 'cursed_coin_drain') {
      if (ev.birdId === myId) {
        const drainText = ev.bloodMoon ? `💀🌑 -${ev.amount} food (BLOOD MOON CURSE!)` : `💀 -${ev.amount} food`;
        const drainColor = ev.bloodMoon ? '#ff2222' : '#ff6600';
        effects.push({ type: 'text', x: camera.screenW / 2, y: camera.screenH / 2 - 60, time: now, duration: 1200, text: drainText, color: drainColor, size: 11 });
      }
    }
    if (ev.type === 'cursed_coin_dropped') {
      addEventMessage('💀 The Cursed Coin was dropped!', '#ff5500');
    }
    if (ev.type === 'cursed_coin_explosion') {
      effects.push({ type: 'screen_shake', intensity: 15, duration: 900, time: now });
      const tag = ev.holderGangTag ? `[${ev.holderGangTag}] ` : '';
      const isMe = ev.holderId === myId;
      const auroraMsg = ev.auroraDoubled ? '\n✨ AURORA doubles the coin scatter!' : '';
      if (isMe) {
        showAnnouncement(`💀 THE CURSE EXPLODES!${auroraMsg}\nYou lost ${ev.lostCoins}c — but earned +500 XP for surviving!\nCoins scattered to nearby birds!`, ev.auroraDoubled ? '#88ffcc' : '#ff0033', 6000);
      } else {
        showAnnouncement(`💀 CURSE EXPLOSION!${auroraMsg}\n${tag}${ev.holderName} took the full brunt! Coins scattered!`, ev.auroraDoubled ? '#88ffcc' : '#ff3366', 5000);
      }
      const doubledNote = ev.auroraDoubled ? ' ✨ AURORA DOUBLES THE SCATTER!' : '';
      addEventMessage(`💀 💥 CURSE EXPLODES on ${tag}${ev.holderName}! −${ev.lostCoins}c scattered to ${ev.rewards.length} birds!${doubledNote}`, ev.auroraDoubled ? '#88ffcc' : '#ff0033');
      // Coin shower for nearby birds (more particles if aurora doubled)
      const particleCount = ev.auroraDoubled ? 36 : 20;
      if (ev.rewards && ev.rewards.length > 0) {
        for (let i = 0; i < Math.min(particleCount, ev.rewards.length * 3); i++) {
          effects.push({
            type: 'coin_particle',
            x: camera.screenW / 2 + (Math.random() - 0.5) * 300,
            y: camera.screenH / 2 + (Math.random() - 0.5) * 240,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 3) * 4,
            time: now,
            duration: 1800,
          });
        }
      }
      // Show personal reward
      const myReward = ev.rewards && ev.rewards.find(r => r.birdId === myId);
      if (myReward) {
        showAnnouncement(`${ev.auroraDoubled ? '✨ AURORA ' : ''}💀 COIN SHOWER! +${myReward.coins}c from the curse explosion!`, '#ffcc00', 4000);
      }
    }

    if (ev.type === 'mc_diamond_poop') {
      if (ev.birdId === myId) {
        effects.push({
          type: 'text', x: ev.x, y: ev.y - 24,
          time: now, duration: 1000,
          text: '+' + ev.coins + 'c 💎', color: '#aaddff', size: 13,
        });
      }
    }

    // === CRIME WAVE EVENTS ===
    if (ev.type === 'crime_wave_start' && ev.birdId === myId) {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 800, time: now });
      showAnnouncement(
        '🚨 CRIME WAVE!\nHeat builds 2× faster — but ALL crime pays DOUBLE!\nStun cops for big XP · Survive your heat!',
        '#ff2222', 7000
      );
    }
    if (ev.type === 'crime_wave_start_global') {
      addEventMessage('🚨 CRIME WAVE ERUPTS ACROSS BIRD CITY! 2× heat · 2× crime rewards · Extra cops!', '#ff4444');
    }
    // Radio Tower × Crime Wave: forced auto-broadcast
    if (ev.type === 'tower_broadcast' && ev.isCrimeWaveForced) {
      showAnnouncement(`📻 PIGEON RADIO: ${ev.ownerName} says:\n"${ev.message}"`, ev.ownerColor || '#ff8844', 5000);
      addEventMessage(`📻 [CRIME WAVE BROADCAST] ${ev.ownerName}: "${ev.message}"`, ev.ownerColor || '#ff8844');
    }
    // Blackout + Ghost Mode full invisibility announcement
    if (ev.type === 'blackout_ghost_combo' && ev.birdId === myId) {
      effects.push({ type: 'screen_shake', intensity: 6, duration: 500, time: now });
      showAnnouncement('🌑👻 BLACKOUT + GHOST MODE!\nYou are FULLY INVISIBLE — cops, Bounty Hunter,\neverything. 15 seconds of complete freedom!', '#44aaff', 6000);
    }
    // Gang War + Crow Cartel synergy
    if (ev.type === 'gang_war_cartel_synergy') {
      if (ev.cityWide) {
        // City-wide first-discovery announcement
        effects.push({ type: 'screen_shake', intensity: 5, duration: 400, time: now });
        showAnnouncement(`⚔️🐦‍⬛ GANG WAR × CARTEL RAID!\n${ev.birdName} discovered the synergy!\n2× XP vs the Cartel — your enemies share an enemy!`, '#ff8844', 5000);
        addEventMessage(`⚔️🐦‍⬛ GANG WAR × CARTEL RAID — 2× XP for fighting Cartel! Shared enemy bonus active in ${ev.zoneName}!`, '#ff8844');
      } else if (ev.birdId === myId) {
        // Personal notice on subsequent hits
        addEventMessage('⚔️🐦‍⬛ 2× XP vs Cartel! (Gang War synergy)', '#ff8844');
      }
    }
    if (ev.type === 'crime_wave_end') {
      addEventMessage('🚔 The crime wave subsides. Officers stand down.', '#ff8888');
      showAnnouncement('🚔 Crime wave over. The city breathes again.', '#ff8888', 3000);
    }

    // === AURORA BOREALIS EVENTS ===
    if (ev.type === 'aurora_start') {
      effects.push({ type: 'screen_shake', intensity: 5, duration: 600, time: now });
      showAnnouncement('✨ AURORA BOREALIS!\n+25% XP · Extended Combos\nCosmic Fish at the Sacred Pond!', '#88ffcc', 7000);
      addEventMessage('✨ AURORA BOREALIS lights up the night sky! +25% XP · Extended Combo Windows!', '#88ffcc');
    }
    if (ev.type === 'aurora_end') {
      addEventMessage('✨ The Aurora fades... The sky returns to ordinary night.', '#55bbaa');
      window._shootingStarData = null; // clean up if aurora ends with unclaimed star
      window._meteorShowerData = null; // clean up any meteor shower too
    }
    if (ev.type === 'gang_aurora_ritual') {
      const isMine = gameState.self && gameState.self.gangId === ev.gangId;
      const names = ev.birdNames ? ev.birdNames.slice(0, 3).join(', ') : '';
      addEventMessage(`✨🐦 [${ev.gangTag}] GANG AURORA RITUAL! ${ev.memberCount} birds gathered at the Sacred Pond — bonus cosmic fish appear! (${names})`, '#44ffcc');
      if (isMine) {
        showAnnouncement(`✨ [${ev.gangTag}] GANG AURORA RITUAL!\n${ev.memberCount} gang birds at the pond — bonus cosmic fish + 80 XP each!`, '#44ffcc', 5000);
        effects.push({ type: 'screen_shake', intensity: 5, duration: 500, time: now });
      }
    }

    // === 🌑 BLOOD MOON ===
    if (ev.type === 'blood_moon_start') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 900, time: now });
      showAnnouncement(
        `🌑 BLOOD MOON RISES!\nFeral birds roam the city!\n+50% XP & Coins · Night Market CURSED!`,
        '#cc2200', 9000
      );
      addEventMessage(`🌑 BLOOD MOON! ${ev.count} feral birds summoned — +50% XP/Coins all night! Night Market items may backfire!`, '#ff4444');
    }
    if (ev.type === 'blood_moon_end') {
      addEventMessage(`🌑 ${ev.message}`, '#cc6666');
    }
    if (ev.type === 'feral_bird_spawn') {
      // Quiet spawn — just a subtle event feed note
      if (ev.feralBirds && ev.feralBirds.length > 1) {
        addEventMessage(`🌑 More feral birds emerge from the shadows...`, '#ff4444');
      }
    }
    if (ev.type === 'feral_steal') {
      if (ev.targetId === myId) {
        effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
        showAnnouncement(`🌑 FERAL BIRD STOLE ${ev.amount}c FROM YOU!\nPoop it to stop the bleeding!`, '#ff2200', 4000);
        effects.push({ type: 'text', x: gameState.self ? gameState.self.x : 0,
          y: gameState.self ? gameState.self.y - 35 : 0,
          time: now, duration: 2000, text: `-${ev.amount}c 🌑`, color: '#ff3333', size: 15 });
      } else {
        const tag = ev.targetGangTag ? `[${ev.targetGangTag}] ` : '';
        addEventMessage(`🌑 A feral bird stole ${ev.amount}c from ${tag}${ev.targetName}!`, '#ff4444');
      }
    }
    if (ev.type === 'feral_bird_hit') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 25, time: now, duration: 1200,
          text: `💀 ${ev.hp <= 0 ? 'DEAD' : '1 MORE!'}`, color: '#ff4444', size: 13 });
      }
    }
    if (ev.type === 'feral_bird_killed') {
      const tag = ev.killerGangTag ? `[${ev.killerGangTag}] ` : '';
      addEventMessage(`💀 ${tag}${ev.killerName} slew a feral bird! +${ev.xp}XP +${ev.coins}c`, '#ff6666');
      if (ev.killerId === myId) {
        showAnnouncement(`💀 FERAL BIRD SLAIN!\n+${ev.xp}XP +${ev.coins}c`, '#ff6666', 3000);
      }
    }
    if (ev.type === 'blood_moon_cleared') {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      showAnnouncement(`💀 ALL FERAL BIRDS DEFEATED!\n${ev.message}`, '#ffaa44', 6000);
      addEventMessage(`💀 ${ev.message} ${ev.xp}XP +${ev.coins}c for every online bird!`, '#ffaa44');
    }
    if (ev.type === 'blood_moon_survived') {
      if (ev.birdId === myId) {
        showAnnouncement(`🌑 BLOOD MOON SURVIVOR!\nYou kept your coins safe all night — daily challenge complete!`, '#ff8855', 5000);
      }
    }
    if (ev.type === 'blood_moon_curse') {
      if (ev.birdId === myId) {
        effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
        showAnnouncement(ev.message, '#cc0000', 5000);
        addEventMessage(`🌑 ${ev.message}`, '#cc0000');
      }
    }

    // === SESSION 93: POSSESSION EVENTS ===
    if (ev.type === 'bird_possessed') {
      if (ev.birdId === myId) {
        effects.push({ type: 'screen_shake', intensity: 12, duration: 800, time: now });
        showAnnouncement(
          `🌑👁️ YOU ARE POSSESSED!\n+50% poop radius · Immune to arrest\nBut others can exorcise you!`,
          '#cc2200', 7000
        );
        addEventMessage(`🌑👁️ ${ev.announcement}`, '#ff3300');
      } else {
        const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
        addEventMessage(`🌑👁️ ${tag}${ev.birdName} is POSSESSED! Poop them 5× to exorcise for 200 XP +75c!`, '#ff4444');
      }
    }
    if (ev.type === 'exorcism_hit') {
      if (ev.targetId === myId) {
        effects.push({ type: 'screen_shake', intensity: 5, duration: 300, time: now });
        addEventMessage(`🌑 EXORCISM HIT! ${ev.attackerName} hit you ${ev.count}/5 — FLEE!`, '#ff6666');
      }
      if (ev.attackerId === myId) {
        effects.push({ type: 'text',
          x: gameState.self ? gameState.self.x : 0, y: gameState.self ? gameState.self.y - 30 : 0,
          time: now, duration: 1500, text: `👁️ ${ev.count}/5`, color: '#ff9900', size: 14 });
      }
    }
    if (ev.type === 'bird_exorcised') {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      if (ev.attackerId === myId) {
        showAnnouncement(`🌑✨ EXORCISM COMPLETE!\n+${ev.xp} XP +${ev.coins}c — ${ev.targetName} is free!`, '#ffaa44', 5000);
      } else if (ev.targetId === myId) {
        showAnnouncement(`🌑✨ YOU WERE EXORCISED!\n-${ev.lostCoins}c taken by ${ev.attackerName}`, '#ff8844', 5000);
      }
      const atag = ev.attackerGangTag ? `[${ev.attackerGangTag}] ` : '';
      const ttag = ev.targetGangTag ? `[${ev.targetGangTag}] ` : '';
      addEventMessage(`🌑✨ ${atag}${ev.attackerName} EXORCISED ${ttag}${ev.targetName}! +${ev.xp}XP +${ev.coins}c`, '#ffaa44');
    }
    if (ev.type === 'possession_expired') {
      if (ev.birdId === myId) {
        addEventMessage(`🌑 The possession lifted. You are free.`, '#cc6666');
      }
    }
    if (ev.type === 'blood_moon_dome_synergy') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      showAnnouncement(`🌑⚡ BLOOD MOON + THUNDER DOME!\n2× XP · 2× wall shock damage!`, '#cc2200', 5000);
      addEventMessage(`🌑⚡ ${ev.message}`, '#ff3333');
    }

    // === SESSION 94: RAT KING + ARENA LEGEND + DOME FORMATION SYNERGY ===
    if (ev.type === 'rat_king_spawned') {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      showAnnouncement('👑 THE RAT KING EMERGES!\nThe sewer boss is underground — 4 hits to defeat!', '#cc44ff', 6000);
      addEventMessage('👑 THE RAT KING has emerged in the sewers! Descend and fight him for massive rewards!', '#cc44ff');
    }
    if (ev.type === 'rat_king_hit') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text',
          x: gameState.ratKing ? gameState.ratKing.x : (gameState.self ? gameState.self.x : 0),
          y: gameState.ratKing ? gameState.ratKing.y - 20 : (gameState.self ? gameState.self.y - 30 : 0),
          time: now, duration: 1500, text: `👑 HIT! ${ev.hp}/${ev.maxHp}`, color: '#cc44ff', size: 14 });
      }
      if (ev.hp === 1) {
        addEventMessage(`👑 RAT KING AT 1 HP — ONE MORE HIT!`, '#ff88ff');
      }
    }
    if (ev.type === 'rat_king_steal') {
      if (ev.birdId === myId) {
        effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
        showAnnouncement(`👑 RAT KING ROBBED YOU!\n-${ev.stolen}c stolen from your wallet!`, '#cc44ff', 4000);
        effects.push({ type: 'text',
          x: gameState.self ? gameState.self.x : 0, y: gameState.self ? gameState.self.y - 30 : 0,
          time: now, duration: 2000, text: `-${ev.stolen}c 👑`, color: '#ff66ff', size: 16 });
      }
      addEventMessage(`👑 Rat King robbed someone for ${ev.stolen}c!`, '#cc44ff');
    }
    if (ev.type === 'rat_king_defeated') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 900, time: now });
      showAnnouncement('👑 RAT KING DEFEATED!\nThe sewer is safe — rewards distributed!', '#ffaaff', 7000);
      addEventMessage(`👑 THE RAT KING HAS FALLEN! Underground heroes share the loot!`, '#ffaaff');
    }
    if (ev.type === 'rat_king_reward') {
      if (ev.birdId === myId) {
        showAnnouncement(`👑 RAT KING LOOT!\n+${ev.xp} XP  +${ev.coins}c`, '#ffaaff', 5000);
      }
    }
    if (ev.type === 'rat_king_escaped') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      showAnnouncement('👑 RAT KING ESCAPED!\nHe robbed the underground birds on the way out!', '#cc44ff', 5000);
      addEventMessage('👑 The Rat King retreated into the depths — and took coins with him!', '#cc44ff');
    }
    if (ev.type === 'arena_legend_earned') {
      effects.push({ type: 'screen_shake', intensity: 12, duration: 800, time: now });
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      showAnnouncement(`⚡ ARENA LEGEND!\n${tag}${ev.name} has won the Thunder Dome ${ev.domeWins} times!\nPermanent ⚡ ARENA LEGEND badge earned!`, '#00ccff', 8000);
      addEventMessage(`⚡ ${tag}${ev.name} has earned the ARENA LEGEND title — ${ev.domeWins} Thunder Dome wins!`, '#00aaff');
    }
    if (ev.type === 'dome_formation_synergy') {
      if (ev.birdId === myId) {
        showAnnouncement(`⚡⚔️ WEDGE + THUNDER DOME!\n+15% poop hit radius while in Wedge Formation inside the dome!`, '#ffaa00', 4000);
      }
    }

    // === SHOOTING STAR (rare aurora event) ===
    if (ev.type === 'shooting_star_spawn') {
      window._shootingStarData = { x: ev.x, y: ev.y, spawnedAt: ev.spawnedAt, expiresAt: ev.expiresAt, streakAngle: ev.streakAngle };
      effects.push({ type: 'screen_shake', intensity: 4, duration: 400, time: now });
      showAnnouncement('🌠 SHOOTING STAR!\nRace to the landing site — Mystery item awaits!', '#ffffaa', 6000);
      addEventMessage('🌠 A SHOOTING STAR streaks across the aurora sky! First bird to the landing site wins a cosmic reward!', '#ffffaa');
    }
    if (ev.type === 'shooting_star_claimed') {
      window._shootingStarData = null;
      if (ev.birdId === myId) {
        showAnnouncement(`🌠 STAR CLAIMED! You got: ${ev.item.emoji} ${ev.item.name}!`, '#ffffaa', 5000);
        addEventMessage(`🌠 You caught the Shooting Star and got ${ev.item.emoji} ${ev.item.name}!`, '#ffffaa');
        effects.push({ type: 'screen_shake', intensity: 10, duration: 600, time: now });
      } else {
        const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
        addEventMessage(`🌠 ${tag}${ev.birdName} caught the Shooting Star → ${ev.item.emoji} ${ev.item.name}!`, '#ffee88');
      }
    }
    if (ev.type === 'shooting_star_expired') {
      window._shootingStarData = null;
      addEventMessage('🌠 The Shooting Star faded... Nobody reached the landing site in time.', '#887755');
    }
    if (ev.type === 'legend_comet_trail') {
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      addEventMessage(`✨☄️ ${tag}${ev.birdName} caught a star and blazes with a LEGEND COMET TRAIL! ⚜️⚜️⚜️⚜️⚜️`, '#ffd700');
      if (ev.birdId === myId) {
        showAnnouncement('☄️ LEGEND COMET TRAIL!', '#ffd700', 3500);
      }
    }

    // === METEOR SHOWER (rare aurora upgrade — 3 simultaneous shooting stars) ===
    if (ev.type === 'meteor_shower_start') {
      window._meteorShowerData = ev.stars.map(s => ({ ...s })); // { id, x, y, expiresAt, streakAngle }
      effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      showAnnouncement(`☄️ METEOR SHOWER!\n${ev.count} stars fall — race to any landing site!`, '#ffeeaa', 6000);
      addEventMessage(`☄️ METEOR SHOWER over Bird City! ${ev.count} stars streak across the aurora sky — Mystery items for every lucky bird!`, '#ffeeaa');
    }
    if (ev.type === 'meteor_star_claimed') {
      // Remove the claimed star from local data
      if (window._meteorShowerData) {
        window._meteorShowerData = window._meteorShowerData.filter(s => s.id !== ev.starId);
      }
      if (ev.birdId === myId) {
        showAnnouncement(`☄️ METEOR CAUGHT! You got: ${ev.item.emoji} ${ev.item.name}!`, '#ffeeaa', 5000);
        addEventMessage(`☄️ You caught a Meteor and got ${ev.item.emoji} ${ev.item.name}!`, '#ffeeaa');
        effects.push({ type: 'screen_shake', intensity: 10, duration: 500, time: now });
      } else {
        const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
        addEventMessage(`☄️ ${tag}${ev.birdName} caught a Meteor → ${ev.item.emoji} ${ev.item.name}!`, '#ffdd88');
      }
    }
    if (ev.type === 'meteor_star_expired') {
      if (window._meteorShowerData) {
        window._meteorShowerData = window._meteorShowerData.filter(s => s.id !== ev.starId);
      }
    }
    if (ev.type === 'meteor_shower_end') {
      window._meteorShowerData = null;
      addEventMessage('☄️ The meteor shower fades. Aurora light returns to peace.', '#887755');
    }

    // Cosmic fish caught (triple loot — aurora only)
    if (ev.type === 'cosmic_fish_caught' && ev.birdId === myId) {
      const fishNote = ev.isCosmic ? `\n🐟 You now have ${ev.cosmicFishTotal} Cosmic Fish` : '';
      showAnnouncement(`✨ COSMIC FISH! +${ev.coins}c +${ev.xp} XP${fishNote}`, '#88ffcc', 3500);
      effects.push({ type: 'text', x: ev.x, y: ev.y, text: `✨ +${ev.coins}c 🐟+1`, color: '#88ffcc', size: 16, time: performance.now(), duration: 2500 });
    }
    if (ev.type === 'cosmic_fish_caught' && ev.birdId !== myId) {
      addEventMessage(`✨ ${ev.name} caught a Cosmic Fish! (+${ev.coins}c +${ev.xp} XP)`, '#88ffcc');
    }

    // === NIGHT MARKET EVENTS (aurora bazaar) ===
    if (ev.type === 'night_market_open') {
      addEventMessage('✨ THE NIGHT MARKET OPENS near the Sacred Pond! Spend Cosmic Fish for rare items! [Press N]', '#44ffee');
    }
    if (ev.type === 'night_market_close') {
      addEventMessage('✨ The Night Market closes as the Aurora fades...', '#33aaaa');
    }
    if (ev.type === 'night_market_purchased' && ev.birdId === myId) {
      showAnnouncement(`${ev.emoji} ${ev.itemName} UNLOCKED!\n−${ev.cost} Cosmic Fish · ${ev.cosmicFishLeft} remaining`, '#44ffee', 4000);
      addEventMessage(`✨ You bought ${ev.emoji} ${ev.itemName} from the Night Market!`, '#44ffee');
      renderNightMarketOverlay(); // refresh fish count
    }
    if (ev.type === 'night_market_fail' && ev.birdId === myId) {
      showAnnouncement(`✨ Night Market: ${ev.reason}`, '#cc6644', 3000);
    }
    if (ev.type === 'constellation_badge_earned') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      if (ev.birdId === myId) {
        showAnnouncement('🌌 CONSTELLATION BADGE EARNED!\nThe rarest cosmetic in Bird City — visible on your nametag forever!', '#44ffee', 6000);
      }
      addEventMessage(`🌌 ${ev.message}`, '#44ffee');
    }

    // === BIRD ROYALE EVENTS ===
    if (ev.type === 'royale_warning' && ev.birdId === myId) {
      effects.push({ type: 'screen_shake', intensity: 12, duration: 1000, time: now });
      const warningSecS = Math.round((ev.startAt - now) / 1000);
      if (ev.isSpringRoyale) {
        showAnnouncement(
          `🌸⚔️ SPRING ROYALE in ${warningSecS}s!\nZone centered on the SACRED POND!\nCherry blossoms watch as you fight for survival!`,
          '#ff88c8', 8000
        );
      } else {
        showAnnouncement(
          `⚔️ BIRD ROYALE in ${warningSecS}s!\nFly to the SAFE ZONE or be eliminated!\nLast bird alive wins 400 coins + 500 XP!`,
          '#ff6600', 8000
        );
      }
    }
    if (ev.type === 'royale_warning_global') {
      if (ev.isSpringRoyale) {
        addEventMessage('🌸⚔️ SPRING ROYALE starts in 2 minutes! Zone centered on the Sacred Pond — cherry blossoms witness all!', '#ff88c8');
      } else {
        addEventMessage('⚔️ BIRD ROYALE starts in 2 minutes! Stay inside the shrinking zone or lose your food fast!', '#ff6600');
      }
    }
    if (ev.type === 'royale_start' && ev.birdId === myId) {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 1000, time: now });
      if (ev.isSpringRoyale) {
        showAnnouncement(
          `🌸⚔️ SPRING ROYALE BEGINS!\n${ev.participantCount} birds circle the Sacred Pond!\nPetals fall as the zone closes!`,
          '#ff88c8', 7000
        );
      } else {
        showAnnouncement(
          `⚔️ BIRD ROYALE BEGINS!\n${ev.participantCount} birds enter — one walks out!\nZone shrinks for 3 minutes. DON'T LEAVE THE RING!`,
          '#ff2200', 7000
        );
      }
    }
    if (ev.type === 'royale_start_global') {
      if (ev.isSpringRoyale) {
        addEventMessage(`🌸⚔️ SPRING ROYALE — ${ev.participantCount} birds around the Sacred Pond! Zone centered on the cherry blossoms!`, '#ff88c8');
      } else {
        addEventMessage(`⚔️ BIRD ROYALE HAS BEGUN! ${ev.participantCount} participants. Zone shrinks for 3 minutes!`, '#ff4400');
      }
    }
    if (ev.type === 'royale_zone_damage' && ev.birdId === myId) {
      // Subtle food drain warning — only show text if food is low
      if (ev.foodLeft !== undefined && ev.foodLeft <= 20) {
        effects.push({ type: 'text', x: gameState.self.x, y: gameState.self.y - 30, text: `⚠️ ZONE! ${ev.foodLeft}🍗`, color: '#ff4400', time: now, duration: 1200 });
      }
    }
    if (ev.type === 'royale_eliminated') {
      if (ev.birdId === myId) {
        effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
        const penalty = ev.coinLoss > 0 ? ` −${ev.coinLoss}c penalty` : '';
        showAnnouncement(`💀 YOU'VE BEEN ELIMINATED!\n${ev.aliveCount} birds remain${penalty}\nWatch the survivors fight it out!`, '#cc2200', 6000);
      } else {
        if (ev.disconnected) {
          addEventMessage(`💀 ${ev.name} disconnected — eliminated from Bird Royale! (${ev.aliveCount} left)`, '#ff6644');
        } else {
          addEventMessage(`💀 ${ev.name} was eliminated from Bird Royale! (${ev.aliveCount} remain)`, '#ff6644');
        }
      }
    }
    if (ev.type === 'royale_winner') {
      effects.push({ type: 'screen_shake', intensity: 18, duration: 1200, time: now });
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      if (ev.birdId === myId) {
        showAnnouncement(`🏆 YOU WIN BIRD ROYALE!\n+500 XP +400 COINS\nLast bird standing out of ${ev.participantCount}!`, '#ffd700', 10000);
      } else {
        showAnnouncement(`🏆 BIRD ROYALE WINNER:\n${tag}${ev.name}\n+500 XP +400c — Last one standing!`, '#ffd700', 8000);
      }
      addEventMessage(`🏆 BIRD ROYALE WINNER: ${tag}${ev.name} outlasted ${ev.participantCount} birds! +500 XP +400c`, '#ffd700');
    }
    if (ev.type === 'royale_no_winner') {
      showAnnouncement(`💀 BIRD ROYALE — NO SURVIVORS!\nAll ${ev.participantCount} birds were eliminated.\nThe city mourns.`, '#888888', 6000);
      addEventMessage(`💀 Bird Royale ended with no survivors! All ${ev.participantCount} birds eliminated.`, '#aa6644');
    }
    // Spectator crowd cheer received (you got cheered for)
    if (ev.type === 'royale_cheer_received' && ev.birdId === myId) {
      if (gameState.self) {
        effects.push({ type: 'float_text', text: `🎉 +${ev.foodGain} food!`, x: gameState.self.x, y: gameState.self.y - 30, color: '#44ff88', duration: 1800, time: now });
      }
      addEventMessage(`🎉 ${ev.cheerName} cheered for you! +${ev.foodGain} food`, '#44ff88');
    }
    // City-wide cheer shoutout
    if (ev.type === 'royale_cheer_city') {
      addEventMessage(`🎉 ${ev.cheerName} cheers for ${ev.targetName}!`, '#88cc88');
    }
    // Gang territory royale bonus
    if (ev.type === 'royale_gang_territory_bonus') {
      const isMine = gameState.self && gameState.self.gangId === ev.gangId;
      if (isMine) {
        showAnnouncement(`🗺️ YOUR GANG WINS BIRD ROYALE!\n[${ev.gangTag}] ${ev.gangName}\n+1.5× Territory Capture Power for 5 min!`, '#ffd700', 8000);
        effects.push({ type: 'screen_shake', intensity: 10, duration: 800, time: now });
      }
      addEventMessage(`🗺️ [${ev.gangTag}] ${ev.gangName} wins Bird Royale! 1.5× territory power for 5 min!`, '#ffd700');
    }

    // === PIGEON FIGHTING CHAMPIONSHIP EVENTS ===
    if (ev.type === 'tournament_open') {
      const secsLeft = Math.ceil((ev.signupUntil - now) / 1000);
      showAnnouncement(`🥊 DON FEATHERSTONE'S FIGHTING CHAMPIONSHIP!\n${ev.entryFee}c entry · 45s signup · Visit The Don at the Docks!\nPress [M] near The Don to JOIN`, '#ff8844', 8000);
      addEventMessage(`🥊 FIGHTING CHAMPIONSHIP signup open! ${ev.entryFee}c entry — fly to Don Featherstone!`, '#ff8844');
      effects.push({ type: 'screen_shake', intensity: 7, duration: 500, time: now });
      updateTournamentHud();
    }
    if (ev.type === 'tournament_joined') {
      const vipNote = ev.hasVipDiscount ? ` 🎖 VIP ${ev.feePaid}c` : '';
      addEventMessage(`🥊 ${ev.birdName} enters the Championship! (${ev.entrantCount}/8 · pot: ${ev.pot}c${vipNote})`, '#ffaa44');
      if (ev.birdId === myId) {
        const vipMsg = ev.hasVipDiscount ? `\n🎖 Capo Discount applied — paid ${ev.feePaid}c!` : '';
        showAnnouncement(`🥊 YOU'RE IN THE TOURNAMENT!\n${ev.entrantCount}/8 birds entered · Pot: ${ev.pot}c\nWinner takes all + 500 XP!${vipMsg}`, '#ff8844', 5000);
      }
      updateTournamentHud();
    }
    if (ev.type === 'tournament_join_fail' && ev.birdId === myId) {
      const neededCoins = ev.needed || (gameState.tournament ? gameState.tournament.entryFee : 100);
      const msgs = {
        not_open: 'No tournament signup open right now.',
        closed: 'Signup window has closed.',
        too_far: 'You need to be near Don Featherstone!',
        full: 'Tournament is full (8/8 birds).',
        already_entered: 'You\'re already signed up!',
        no_coins: `Not enough coins. Need ${neededCoins}c.`,
      };
      showAnnouncement(`🥊 ${msgs[ev.reason] || 'Cannot join tournament.'}`, '#ff4444', 3000);
    }
    if (ev.type === 'tournament_cancelled') {
      showAnnouncement(`🥊 Tournament cancelled — not enough entrants. Coins refunded.`, '#888888', 4000);
      addEventMessage('🥊 Fighting Championship cancelled. Not enough birds signed up.', '#888888');
      updateTournamentHud();
    }
    if (ev.type === 'tournament_round_start') {
      const roundLabel = `ROUND ${ev.round}`;
      const nonByeMatches = ev.bracket.filter(m => !m.bye);
      let matchStr = ev.bracket.map(m => m.bye ? `${m.bird1Name} (BYE)` : `${m.bird1Name} vs ${m.bird2Name}`).join(' · ');
      showAnnouncement(`🥊 CHAMPIONSHIP ${roundLabel}!\n${matchStr}\nPOOP your opponent 3 times to advance!`, '#ff8844', 7000);
      addEventMessage(`🥊 CHAMPIONSHIP ROUND ${ev.round}: ${matchStr}`, '#ff8844');
      if (nonByeMatches.length > 0) {
        addEventMessage(`🎰 SPECTATORS: Bet on Round ${ev.round} — check bottom-left panel! 20s window!`, '#ffcc44');
      }
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      updateTournamentHud();
    }
    if (ev.type === 'tournament_match_result') {
      addEventMessage(`🥊 Round ${ev.round}: ${ev.winnerName} DEFEATS ${ev.loserName}! ➜ ADVANCES`, '#ff8844');
    }
    if (ev.type === 'tournament_ended') {
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      const selfWins = (gameState.self && gameState.self.tournamentWins) || 0;
      const winCountNote = ev.championId === myId && selfWins > 0 ? `\n🏆 Career wins: ${selfWins}` : '';
      showAnnouncement(`🥊 FIGHTING CHAMPION!\n${tag}${ev.championName} WINS THE CHAMPIONSHIP!\n+500 XP · +${ev.pot}c pot · 🥊 BADGE UNLOCKED${winCountNote}`, '#ff6600', 10000);
      addEventMessage(`🥊🏆 ${tag}${ev.championName} IS THE PIGEON FIGHTING CHAMPION! (${ev.rounds} rounds · ${ev.pot}c prize)`, '#ff6600');
      effects.push({ type: 'screen_shake', intensity: 14, duration: 900, time: now });
      updateTournamentHud();
    }

    // === BOSS EVENTS ===
    if (ev.type === 'boss_spawn') {
      SoundEngine.bossSpawn();
      if (ev.bossType === 'EAGLE_OVERLORD') {
        showAnnouncement('🦅 EAGLE OVERLORD DESCENDS ON BIRD CITY!', '#ff8c00', 5000);
        addEventMessage('🦅 Eagle Overlord has appeared! POOP IT DOWN — 90 seconds!', '#ff8c00');
        effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      } else {
        showAnnouncement('BOSS: ' + ev.bossType + ' HAS APPEARED!', '#ff0000', 4000);
        addEventMessage('A ' + ev.bossType + ' boss has spawned!', '#ff0000');
      }
    }
    if (ev.type === 'boss_defeated') {
      SoundEngine.bossDefeated();
      showAnnouncement('BOSS DEFEATED! +100 XP +25 Coins!', '#ffd700', 4000);
      addEventMessage(ev.bossType + ' defeated! Rewards for nearby birds!', '#ffd700');
    }
    if (ev.type === 'boss_attack') {
      if (ev.birdId === myId) {
        SoundEngine.stunned();
        showAnnouncement(ev.bossType + ' ATTACKED YOU!', '#ff0000', 2000);
      }
      effects.push({
        type: 'text', x: ev.x, y: ev.y - 20,
        time: now, duration: 2000,
        text: 'BOSS ATTACK!', color: '#ff0000', size: 18,
      });
    }

    // === EAGLE OVERLORD EVENTS ===
    if (ev.type === 'eagle_snatch') {
      if (ev.birdId === myId) {
        SoundEngine.stunned();
        showAnnouncement('🦅 YOU WERE SNATCHED! STRUGGLE FREE!', '#ff4400', 3000);
        effects.push({ type: 'screen_shake', intensity: 14, duration: 800, time: now });
      } else {
        addEventMessage('🦅 Eagle snatched ' + ev.birdName + '! (−' + ev.stolenCoins + 'c)', '#ff8c00');
      }
      effects.push({ type: 'text', x: ev.x, y: ev.y - 30, time: now, duration: 2000, text: '🦅 SNATCHED!', color: '#ff4400', size: 20 });
    }
    if (ev.type === 'eagle_rescue') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 30, time: now, duration: 1500, text: '🦸 RESCUE SHOT!', color: '#4ade80', size: 18 });
      }
      addEventMessage('🦸 Bird rescued from the Eagle\'s talons!', '#4ade80');
    }
    if (ev.type === 'eagle_released') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1500, text: 'ESCAPED!', color: '#aaffaa', size: 16 });
      }
    }
    if (ev.type === 'eagle_hit') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 25, time: now, duration: 1200, text: '−8 HP!', color: '#ff8c00', size: 14 });
      }
    }
    if (ev.type === 'eagle_robbed') {
      if (ev.birdId === myId) {
        showAnnouncement('🦅 EAGLE STOLE ' + ev.stolen + ' COINS FROM YOU!', '#ff0000', 4000);
        effects.push({ type: 'screen_shake', intensity: 10, duration: 500, time: now });
      } else {
        addEventMessage('🦅 Eagle robbed ' + ev.birdName + ' of ' + ev.stolen + 'c before fleeing!', '#ff8c00');
      }
    }
    if (ev.type === 'eagle_escaped') {
      SoundEngine.bossSpawn(); // dramatic sound
      showAnnouncement('🦅 THE EAGLE OVERLORD ESCAPED!', '#ff8800', 4000);
      addEventMessage('🦅 Eagle Overlord flew off into the sky...', '#ff8800');
    }
    if (ev.type === 'eagle_overlord_defeated') {
      SoundEngine.bossDefeated();
      effects.push({ type: 'screen_shake', intensity: 18, duration: 1200, time: now });
      showAnnouncement('🦅 EAGLE OVERLORD DEFEATED! THE CITY IS SAFE!', '#ffd700', 5000);
      let rewardMsg = '🦅 Eagle slain! Rewards: ';
      if (ev.rewards && ev.rewards.length > 0) {
        rewardMsg += ev.rewards.slice(0, 3).map(r => r.name + ' (+' + r.xp + 'xp +' + r.coins + 'c)').join(', ');
        if (ev.rewards.length > 3) rewardMsg += '...';
      }
      addEventMessage(rewardMsg, '#ffd700');
    }

    if (ev.type === 'eagle_feather_drop') {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      addEventMessage(`🪶 ${ev.birdName} claimed the EAGLE FEATHER — a rare trophy from the Eagle Overlord!`, '#00e8a0');
      if (ev.birdId === myId) {
        showAnnouncement('🪶 EAGLE FEATHER CLAIMED!\nYou are now immortalized in the Hall of Legends.', '#00e8a0', 6000);
      }
    }

    // === TERRITORY PREDATOR EVENTS ===
    if (ev.type === 'territory_warning') {
      if (ev.birdId === myId) {
        const icon = ev.predType === 'hawk' ? '🦅' : '🐱';
        const color = ev.predType === 'hawk' ? '#ff5500' : '#cc44ff';
        showAnnouncement(icon + ' ' + ev.label + ' — LEAVE NOW or face the predator!', color, 3500);
        effects.push({ type: 'screen_shake', intensity: 5, duration: 400, time: now });
      }
    }
    if (ev.type === 'predator_hunting') {
      const icon = ev.predType === 'hawk' ? '🦅' : '🐱';
      const color = ev.predType === 'hawk' ? '#ff5500' : '#cc44ff';
      if (ev.birdId === myId) {
        showAnnouncement(icon + ' THE PREDATOR IS HUNTING YOU! POOP IT OR RUN!', color, 4000);
        effects.push({ type: 'screen_shake', intensity: 10, duration: 600, time: now });
      } else {
        addEventMessage(icon + ' Predator locked onto ' + ev.birdName + '!', color);
      }
    }
    if (ev.type === 'predator_attack') {
      const icon = ev.predType === 'hawk' ? '🦅' : '🐱';
      const color = ev.predType === 'hawk' ? '#ff5500' : '#cc44ff';
      if (ev.birdId === myId) {
        SoundEngine.stunned && SoundEngine.stunned();
        showAnnouncement(icon + ' HIT ' + ev.hitCount + '/' + ev.maxHits + '! POOP BACK!', color, 2000);
        effects.push({ type: 'screen_shake', intensity: 8, duration: 400, time: now });
      }
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1500, text: icon + ' HIT ' + ev.hitCount + '/' + ev.maxHits, color, size: 16 });
    }
    if (ev.type === 'predator_poop_hit') {
      const color = ev.predType === 'hawk' ? '#ff5500' : '#cc44ff';
      effects.push({ type: 'text', x: ev.x, y: ev.y - 25, time: now, duration: 1200, text: '−' + ev.dmg + ' HP! (' + ev.hp + '/' + ev.maxHp + ')', color, size: 14 });
    }
    if (ev.type === 'predator_defeated') {
      const icon = ev.predType === 'hawk' ? '🦅' : '🐱';
      const color = ev.predType === 'hawk' ? '#ff8800' : '#cc44ff';
      effects.push({ type: 'screen_shake', intensity: 14, duration: 900, time: now });
      showAnnouncement(icon + ' PREDATOR DEFEATED! +300 XP +200 Coins!', '#ffd700', 5000);
      addEventMessage(icon + ' ' + ev.birdName + ' slayed the territory predator!', '#ffd700');
    }
    if (ev.type === 'predator_killed_bird') {
      const icon = ev.predType === 'hawk' ? '🦅' : '🐱';
      const color = ev.predType === 'hawk' ? '#ff5500' : '#cc44ff';
      if (ev.birdId === myId) {
        effects.push({ type: 'screen_shake', intensity: 18, duration: 1000, time: now });
        showAnnouncement(icon + ' YOU WERE KILLED! Lost ' + ev.coinLoss + 'c — respawning...', '#ff0000', 5000);
      } else {
        addEventMessage(icon + ' Predator killed ' + ev.birdName + '! (−' + ev.coinLoss + 'c)', color);
      }
    }
    if (ev.type === 'predator_respawned') {
      const icon = ev.predType === 'hawk' ? '🦅' : '🐱';
      addEventMessage(icon + ' The predator has returned to ' + ev.zoneName + '...', '#888');
    }

    // === WANTED EVENTS ===
    if (ev.type === 'wanted_new') {
      const stars = '⭐'.repeat(ev.level || 1);
      if (ev.birdId === myId) {
        showAnnouncement('YOU ARE WANTED! ' + stars, '#ff0000', 3000);
      } else {
        showAnnouncement(ev.birdName + ' IS WANTED! ' + stars, '#ff6600', 3000);
      }
      addEventMessage(ev.birdName + ' is WANTED ' + stars, '#ff6600');
    }
    if (ev.type === 'wanted_level_up') {
      const stars = '⭐'.repeat(ev.level);
      if (ev.birdId === myId) {
        showAnnouncement('HEAT RISING! ' + stars + ' COPS INCOMING!', '#ff0000', 3000);
      } else {
        addEventMessage(ev.birdName + ' heat rising ' + stars, '#ff6600');
      }
    }
    if (ev.type === 'wanted_level5') {
      if (ev.birdId === myId) {
        showAnnouncement('⭐⭐⭐⭐⭐ MOST WANTED! SWAT IS COMING!', '#ff0000', 4000);
      } else {
        showAnnouncement(ev.birdName + ' IS MOST WANTED! ⭐⭐⭐⭐⭐', '#ff4400', 3000);
        addEventMessage('🚨 ' + ev.birdName + ' is MOST WANTED! SWAT deployed!', '#ff4400');
      }
    }
    if (ev.type === 'wanted_escaped') {
      if (ev.birdId === myId) {
        showAnnouncement('YOU ESCAPED THE LAW! 🎉', '#4ade80', 3000);
      } else {
        addEventMessage(ev.birdName + ' escaped the cops!', '#4ade80');
      }
    }
    if (ev.type === 'wanted_survival') {
      if (ev.birdId === myId) {
        addEventMessage('Surviving the heat! ⭐' + ev.level + ' bonus XP!', '#ffd700');
      }
    }
    if (ev.type === 'wanted_tagged') {
      const bountyText = ev.bounty ? ' (' + ev.bounty + ' coins!)' : '';
      showAnnouncement(ev.taggerName + ' TAGGED ' + ev.wantedName + '!' + bountyText, '#4ade80', 2500);
      addEventMessage(ev.taggerName + ' tagged ' + ev.wantedName + ' for ' + (ev.bounty || 15) + ' coins!', '#4ade80');
    }
    if (ev.type === 'cop_spawn') {
      if (gameState && gameState.self && gameState.self.isWanted) {
        addEventMessage((ev.copType === 'swat' ? '🦅 SWAT crow deployed!' : '🐦 Cop pigeon on duty!'), '#4488ff');
      }
    }
    if (ev.type === 'cop_arrest') {
      if (ev.birdId === myId) {
        showAnnouncement('BUSTED! -' + ev.coinsStolen + ' COINS!', '#ff0000', 3000);
      } else {
        addEventMessage(ev.birdName + ' got busted! -' + ev.coinsStolen + ' coins', '#ff4444');
      }
    }
    if (ev.type === 'cop_pooped') {
      if (ev.birdId === myId) {
        showAnnouncement('COP STUNNED! RUN!', '#4ade80', 2000);
      } else {
        addEventMessage(ev.birdName + ' stunned a ' + (ev.copType === 'swat' ? 'SWAT crow' : 'cop') + '!', '#4ade80');
      }
    }

    // === CITY LOCKDOWN EVENTS ===
    if (ev.type === 'city_lockdown_start') {
      effects.push({ type: 'screen_shake', intensity: 12, duration: 800, time: now });
      showAnnouncement('🚨 CITY LOCKDOWN! ' + ev.count + ' CRIMINALS ON THE LOOSE! · 1.5× CRIME REWARDS', '#ff1a1a', 5000);
      addEventMessage('🚨 CITY LOCKDOWN DECLARED — ' + ev.count + ' birds at 3+ stars! National Guard deploying!', '#ff4444');
    }
    if (ev.type === 'city_lockdown_end') {
      showAnnouncement('🚔 LOCKDOWN LIFTED — City breathes again.', '#4488ff', 3000);
      addEventMessage('🚔 City Lockdown ended. National Guard stands down.', '#4488ff');
    }
    if (ev.type === 'national_guard_deployed') {
      addEventMessage('🪖 ' + ev.count + ' National Guard agents DEPLOYED — elite pursuit units!', '#ff8800');
    }
    if (ev.type === 'ng_hit') {
      if (ev.birdId === myId) {
        showAnnouncement('💥 NG HIT! ' + ev.hits + '/5 — 5 hits to stun!', '#ff8800', 1500);
      }
      effects.push({ type: 'float_text', text: '💥 ' + ev.hits + '/5', x: ev.x, y: ev.y, color: '#ff8800', time: now });
    }
    if (ev.type === 'ng_stunned') {
      effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
      if (ev.birdId === myId) {
        showAnnouncement('🪖💫 NATIONAL GUARD DOWN! +150 XP +60c!', '#4ade80', 3000);
      }
      addEventMessage('🪖💫 ' + ev.birdName + ' STUNNED a National Guard agent! +150 XP', '#4ade80');
    }
    if (ev.type === 'ng_caught') {
      if (ev.birdId === myId) {
        showAnnouncement('🪖 CAUGHT BY NATIONAL GUARD! −' + ev.stolen + 'c!', '#ff0000', 3000);
      }
      effects.push({ type: 'float_text', text: '🪖 −' + ev.stolen + 'c', x: 0, y: 0, color: '#ff4444', time: now });
      addEventMessage('🪖 National Guard apprehended ' + ev.targetName + '! −' + ev.stolen + 'c', '#ff4444');
    }

    // === BOUNTY HUNTER EVENTS ===
    if (ev.type === 'bounty_hunter_spawned') {
      effects.push({ type: 'screen_shake', intensity: 6, duration: 500, time: now });
      if (ev.targetId === myId) {
        showAnnouncement('🔫 A BOUNTY HUNTER is on your trail!', '#cc2200', 4000);
        addEventMessage('🔫 A Bounty Hunter was hired to track YOU. 4 poop hits to stun him.', '#cc2200');
      } else {
        addEventMessage('🔫 Bounty Hunter spotted — hunting ' + ev.targetName + '!', '#aa3300');
      }
    }
    if (ev.type === 'bounty_hunter_hit') {
      if (ev.birdId === myId) {
        showAnnouncement('💥 HIT! ' + ev.hits + '/4 — keep going!', '#ff8800', 1500);
      }
      effects.push({ type: 'float_text', text: '💥 ' + ev.hits + '/4', x: ev.x, y: ev.y, color: '#ff8800', time: now });
    }
    if (ev.type === 'bounty_hunter_stunned') {
      effects.push({ type: 'screen_shake', intensity: 5, duration: 400, time: now });
      if (ev.birdId === myId) {
        showAnnouncement('🎯 BOUNTY HUNTER DOWN! +100 XP +50c!', '#4ade80', 3000);
      }
      addEventMessage('🔫💫 ' + ev.birdName + ' STUNNED the Bounty Hunter! +100 XP +50c', '#4ade80');
    }
    if (ev.type === 'bounty_hunter_caught') {
      effects.push({ type: 'screen_shake', intensity: 7, duration: 600, time: now });
      if (ev.birdId === myId) {
        showAnnouncement('🔫 CAUGHT BY BOUNTY HUNTER! -' + ev.coinsStolen + 'c!', '#ff1100', 4000);
      } else {
        addEventMessage('🔫 Bounty Hunter caught ' + ev.birdName + '! -' + ev.coinsStolen + 'c', '#ff4400');
      }
    }
    if (ev.type === 'bounty_hunter_gone') {
      addEventMessage('🔫 The Bounty Hunter stands down.', '#888');
    }

    // === POLICE HELICOPTER ===
    if (ev.type === 'helicopter_spawned') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 700, time: now });
      if (ev.targetId === myId) {
        showAnnouncement('🚁 POLICE HELICOPTER DISPATCHED — YOU\'RE TRACKED FROM ABOVE!', '#1144cc', 5000);
        addEventMessage('🚁 Helicopter locked on YOU! 6 poop hits to bring it down. Sewer won\'t help!', '#2255dd');
      } else {
        addEventMessage('🚁 Police helicopter dispatched — hunting ' + ev.targetName + ' from the sky!', '#3366cc');
      }
    }
    if (ev.type === 'helicopter_hit') {
      if (ev.birdId === myId) {
        showAnnouncement('💥 HIT! ' + ev.hits + '/6 — keep firing!', '#ff8800', 1500);
      }
      effects.push({ type: 'float_text', text: '💥 ' + ev.hits + '/6', x: ev.x, y: ev.y, color: '#ff8800', time: now });
    }
    if (ev.type === 'helicopter_downed') {
      effects.push({ type: 'screen_shake', intensity: 12, duration: 1000, time: now });
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      if (ev.birdId === myId) {
        showAnnouncement('🚁💥 HELICOPTER DOWN! +350 XP +150c — LEGENDARY!', '#ffd700', 5000);
      }
      addEventMessage(`🚁💥 ${tag}${ev.birdName} SHOT DOWN THE POLICE HELICOPTER! +75 XP +25c for ALL BIRDS!`, '#ffd700');
    }
    if (ev.type === 'helicopter_caught') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      if (ev.birdId === myId) {
        showAnnouncement('🚁 HELICOPTER GRABBED YOU! -' + ev.coinsStolen + 'c!', '#ff1100', 4000);
      } else {
        addEventMessage('🚁 Helicopter caught ' + ev.birdName + '! -' + ev.coinsStolen + 'c', '#ff4400');
      }
    }
    if (ev.type === 'helicopter_gone') {
      addEventMessage('🚁 Police helicopter stands down.', '#888');
    }
    if (ev.type === 'helicopter_spotlight_locked') {
      if (ev.targetId === myId) {
        showAnnouncement('🔦 SPOTLIGHT ON YOU — Visible to ALL players on the map!', '#ff8800', 3000);
      }
    }

    // === HELICOPTER + FOG ESCAPE ===
    if (ev.type === 'helicopter_fog_escape') {
      if (ev.targetId === myId) {
        const color = ev.lockdownBonus ? '#00ff88' : '#44ccff';
        const extra = ev.lockdownBonus ? '\nLockdown fog is dense — you have MORE TIME!' : '';
        showAnnouncement(`🌫️ HELICOPTER LOST YOUR TRAIL!\nMove fast before the fog lifts!${extra}`, color, 4500);
        screenShake(4, 300);
      }
    }

    // === NATIONAL GUARD + LIGHTNING FRIENDLY FIRE ===
    if (ev.type === 'ng_lightning_stun') {
      // Floating text at the NG position — visible to all nearby
      effects.push({ type: 'text', x: ev.x, y: ev.y - 30, time: now, duration: 2200,
        text: '⚡ NG STUNNED!', color: '#ffff44', size: 17 });
      addEventMessage(`⚡ Lightning struck a National Guard agent! ${ev.targetName ? `(targeting ${ev.targetName})` : ''} — stunned 4s!`, '#ffff44');
      screenShake(5, 350);
    }

    // === ROYALE CHAMPION KINGPIN SHIELD BREAKS ===
    if (ev.type === 'champ_shield_broke') {
      const isSelf = ev.kingpinId === myId;
      if (isSelf) {
        showAnnouncement(`🏆💔 YOUR CHAMPION\'S SHIELD BROKE!\n${ev.attackerName} cracked it — you\'re now vulnerable!`, '#ff8800', 4000);
        screenShake(8, 500);
      } else {
        showAnnouncement(`🏆💔 ${ev.kingpinName}\'s CHAMPION SHIELD BROKE!\nThey are now vulnerable — 3 hits to dethrone!`, '#ff8800', 4000);
        addEventMessage(`🏆💔 ${ev.kingpinName}'s Royale Champion shield shattered! Now vulnerable to dethronement.`, '#ff8800');
      }
      effects.push({ type: 'screen_shake', intensity: 6, duration: 450, time: now });
      // Golden shield burst visual at kingpin's world position — expanding ring flash
      if (ev.x !== undefined && ev.y !== undefined) {
        window._champShieldFlash = { x: ev.x, y: ev.y, startTime: now, duration: 700 };
      }
    }

    if (ev.type === 'helicopter_recovering') {
      if (gameState.policeHelicopter && gameState.policeHelicopter.targetId === myId) {
        addEventMessage('🚁 Police helicopter recovering — it\'s coming back!', '#cc6600');
      }
    }

    // === Donut Cop events ===
    if (ev.type === 'donut_cop_pooped') {
      effects.push({ type: 'screen_shake', intensity: ev.wasEating ? 6 : 3, duration: 300, time: now });
      if (ev.birdId === myId) {
        if (ev.wasEating) {
          showAnnouncement('🍩💥 AMBUSH! +80 XP +30c — He dropped his donut!', '#44ff88', 3500);
        } else {
          showAnnouncement('👮💩 Cop pooped! +45 XP +15c', '#aaaaff', 2500);
        }
      }
      if (ev.wasEating) {
        const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
        addEventMessage(`🍩💥 ${tag}${ev.birdName} ambushed the Donut Cop mid-snack!`, '#44ff88');
      }
    }
    if (ev.type === 'donut_cop_state') {
      if (ev.state === 'eating') {
        addEventMessage('🍩 The Donut Cop just got his donut — he\'s distracted! Ambush him or bribe him!', '#44ff88');
      } else if (ev.state === 'alert') {
        addEventMessage('👮 The Donut Cop is back on duty.', '#aaaaaa');
      }
    }
    // === VENDING MACHINE POOP POWER-UPS ===
    if (ev.type === 'vend_success') {
      if (ev.birdId === myId) {
        const msg = `${ev.emoji} ${ev.effectName} POOP LOADED! (-20c) · Poop to fire it!`;
        showAnnouncement(msg, '#aaddff', 3500);
      }
      addEventMessage(`🪙 ${ev.birdName} got ${ev.emoji} ${ev.effectName} poop from the machine!`, '#88bbff');
    }
    if (ev.type === 'vend_fail') {
      if (ev.birdId === myId) {
        if (ev.reason === 'too_far') showAnnouncement('🪙 Get closer to the machine!', '#ff8866', 2000);
        else if (ev.reason === 'cooldown') showAnnouncement(`🪙 Machine cooling down: ${ev.secsLeft}s`, '#ff8866', 2000);
        else if (ev.reason === 'already_loaded') showAnnouncement('🪙 Already loaded a poop power — fire it first!', '#ffaa44', 2000);
        else if (ev.reason === 'no_coins') showAnnouncement(`🪙 Need ${ev.cost}c to use the machine!`, '#ff4444', 2000);
      }
    }
    if (ev.type === 'vend_freeze_hit') {
      if (ev.birdId === myId) showAnnouncement('🧊 FROZEN! Slowed to 40% speed for 4s!', '#44aaff', 3000);
      if (ev.shooterId === myId) showAnnouncement('🧊 FREEZE HIT! Target slowed!', '#88ddff', 2000);
    }
    if (ev.type === 'vend_shock_hit') {
      if (ev.birdId === myId) showAnnouncement('⚡ SHOCKED! Stunned for 3.5s!', '#ffee44', 3000);
      if (ev.shooterId === myId) showAnnouncement('⚡ SHOCK HIT! Target stunned!', '#ffff88', 2000);
      effects.push({ type: 'screen_shake', intensity: 4, duration: 250, time: now });
    }
    if (ev.type === 'vend_rainbow_hit') {
      if (ev.birdId === myId) showAnnouncement(`🌈 RAINBOW HIT! +${ev.coins}c (3×)!`, '#ff88ff', 2500);
    }
    if (ev.type === 'vend_toxic_chain') {
      if (ev.birdId === myId) showAnnouncement('💚 TOXIC CHAIN! Extra target hit!', '#88ff88', 2000);
    }

    if (ev.type === 'donut_bribe_success') {
      if (ev.birdId === myId) {
        showAnnouncement(`🍩💰 BRIBED! -${ev.cost}c → Heat dropped from ⭐${ev.oldLevel} to ⭐${ev.newLevel}!`, '#44ff88', 4000);
      }
      const tag = gameState.self && gameState.self.gangTag ? `[${gameState.self.gangTag}] ` : '';
      addEventMessage(`🍩 ${ev.birdName} bribed the Donut Cop to look the other way! (-${ev.cost}c)`, '#aaffaa');
    }
    if (ev.type === 'donut_bribe_fail') {
      if (ev.birdId === myId) {
        if (ev.reason === 'too_far') showAnnouncement('👮 Get closer to the cop first!', '#ff6666', 2000);
        else if (ev.reason === 'not_eating') showAnnouncement('👮 He\'s not eating right now — wait for it!', '#ffaa44', 2000);
        else if (ev.reason === 'no_heat') showAnnouncement('👮 You\'re clean — no heat to bribe away!', '#88aaff', 2000);
        else if (ev.reason === 'no_coins') showAnnouncement(`💸 Need ${ev.cost}c to bribe at this wanted level!`, '#ff4444', 2500);
      }
    }

    // === COMBO MILESTONE ===
    if (ev.type === 'combo_milestone') {
      const fireCount = ev.combo >= 15 ? '🔥🔥🔥' : ev.combo >= 10 ? '🔥🔥' : '🔥';
      if (ev.birdId === myId) {
        showAnnouncement(fireCount + ' COMBO x' + ev.combo + '! ' + fireCount, '#ff8c00', 2500);
        effects.push({ type: 'screen_shake', intensity: Math.min(6, Math.floor(ev.combo / 5)), duration: 300, time: now });
        // Aurora + Combo x20: sacred sky flash — rare cinematic moment
        if (ev.combo === 20 && ev.auroraActive) {
          effects.push({ type: 'aurora_combo_flash', time: now, duration: 800 });
          showAnnouncement('✨🔥 COMBO x20 UNDER THE AURORA! 🔥✨\nThe sky responds to your rampage!', '#88ffcc', 4000);
        }
      }
      addEventMessage(fireCount + ' ' + ev.birdName + ' is ON FIRE! x' + ev.combo + ' combo!', '#ff8c00');
      if (ev.combo === 20 && ev.auroraActive) {
        addEventMessage('✨🔥 ' + ev.birdName + ' hits x20 combo UNDER THE AURORA — the city trembles!', '#88ffcc');
      }
    }

    // === FOOD TRUCK / HEIST EVENTS ===
    if (ev.type === 'food_truck_spawn') {
      addEventMessage('🚚 A Food Truck is cruising the streets! Hold E near it to HEIST it!', '#ff8800');
    }
    if (ev.type === 'truck_honk') {
      SoundEngine.truckHonk();
    }
    if (ev.type === 'heist_started') {
      showAnnouncement('🚨 FOOD TRUCK HEIST IN PROGRESS!', '#ff4400', 3000);
      addEventMessage('🚨 Someone is robbing the food truck! Cops dispatched in 5s!', '#ff8800');
      effects.push({ type: 'screen_shake', intensity: 4, duration: 400, time: now });
    }
    if (ev.type === 'heist_alarm') {
      // Play alarm sound (reuse truck honk or a beep)
      SoundEngine.truckHonk && SoundEngine.truckHonk();
    }
    if (ev.type === 'heist_cops_dispatched') {
      addEventMessage('🚔 Cops heading to the food truck heist!', '#4488ff');
    }
    if (ev.type === 'heist_complete') {
      showAnnouncement('💰 FOOD TRUCK LOOTED!', '#ffd700', 4000);
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      // Coin explosion particles at truck position
      const sx = ev.x - camera.x + camera.screenW / 2;
      const sy = ev.y - camera.y + camera.screenH / 2;
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 120;
        effects.push({
          type: 'particle', x: ev.x, y: ev.y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          color: Math.random() > 0.5 ? '#ffd700' : '#ff8800',
          size: 4 + Math.random() * 5, life: 1.2, maxLife: 1.2,
        });
      }
      // Reward callouts
      if (ev.rewards) {
        for (const r of ev.rewards) {
          if (r.birdId === myId) {
            showAnnouncement('💰 YOUR CUT: +' + r.coins + 'c  +' + r.xp + ' XP', '#ffd700', 4000);
          }
          addEventMessage('💰 ' + (r.name || 'Bird') + ' got +' + r.coins + 'c +' + r.xp + 'XP from the heist!', '#ffcc44');
        }
      }
    }

    // === BANK HEIST EVENTS ===
    if (ev.type === 'bank_heist_casing_start') {
      showAnnouncement('🏦 BANK HEIST OPPORTUNITY!', '#4466ff', 5000);
      addEventMessage('🏦 The Bank\'s security window is open! Disable the 3 cameras (hold E near each). 2 minutes!', '#aaccff');
      effects.push({ type: 'screen_shake', intensity: 4, duration: 400, time: now });
    }
    if (ev.type === 'bank_heist_camera_down') {
      if (ev.allDown) {
        showAnnouncement('📷 ALL CAMERAS DOWN — CRACK THE VAULT!', '#44ffaa', 4000);
        addEventMessage('📷 All 3 cameras disabled! Fly to the vault door (north face of the Bank) and hold E!', '#44ffaa');
        effects.push({ type: 'screen_shake', intensity: 6, duration: 500, time: now });
      } else {
        addEventMessage('📷 Camera ' + (ev.cameraId + 1) + ' disabled by ' + ev.birdName + '!', '#88ffcc');
      }
    }
    if (ev.type === 'bank_heist_casing_failed') {
      addEventMessage('🔒 Bank security window closed. Try again later...', '#ff6644');
    }
    if (ev.type === 'bank_heist_cracking_start') {
      showAnnouncement('🔒 CRACK THE VAULT! Hold E at the north face of the Bank!', '#ffcc00', 5000);
      addEventMessage('🔓 Vault cracking begun! Hold E at the Bank vault door — cops will respond in 8 seconds!', '#ffcc00');
    }
    if (ev.type === 'bank_heist_alarm') {
      showAnnouncement('🚨 BANK ALARM! COPS INBOUND!', '#ff2200', 3000);
      addEventMessage('🚨 BANK ALARM TRIGGERED — 3 cops dispatched to the Bank!', '#ff6644');
      effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
    }
    if (ev.type === 'bank_heist_swat') {
      showAnnouncement('⚠️ SWAT DEPLOYED!', '#ff0000', 3000);
      addEventMessage('⚠️ SWAT CROW deployed to the Bank!', '#ff4444');
    }
    if (ev.type === 'bank_heist_escape_start') {
      showAnnouncement('💰 VAULT CRACKED! GET TO THE VAN!', '#ffd700', 5000);
      addEventMessage('🚐 Getaway van spotted! 45 seconds to escape! Fly to it!', '#ffdd00');
      effects.push({ type: 'screen_shake', intensity: 12, duration: 800, time: now });
      // Coin explosion at vault
      for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 150;
        effects.push({
          type: 'particle', x: 1960, y: 1695,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          color: Math.random() > 0.5 ? '#ffd700' : '#44ff88',
          size: 5 + Math.random() * 6, life: 1.5, maxLife: 1.5,
        });
      }
    }
    if (ev.type === 'bank_heist_bird_escaped') {
      if (ev.birdId === myId) {
        showAnnouncement('🚐 YOU MADE IT TO THE VAN!', '#44ff88', 3000);
      }
      addEventMessage('🚐 ' + ev.birdName + ' made it to the getaway van!', '#44ff88');
    }
    if (ev.type === 'bank_heist_complete') {
      const count = ev.escapeCount || 0;
      const total = ev.totalCrackers || 1;
      showAnnouncement('🏦 HEIST COMPLETE! ' + count + '/' + total + ' ESCAPED!', '#ffd700', 6000);
      effects.push({ type: 'screen_shake', intensity: 15, duration: 1000, time: now });
      if (ev.rewards) {
        for (const r of ev.rewards) {
          const escLabel = r.escaped ? '🚐 ESCAPED' : '🔒 CAUGHT';
          if (r.birdId === myId) {
            showAnnouncement((r.escaped ? '💰' : '😰') + ' YOUR TAKE: +' + r.coins + 'c  +' + r.xp + ' XP  [' + (r.escaped ? 'ESCAPED' : 'CAUGHT') + ']', r.escaped ? '#ffd700' : '#ff6644', 5000);
          }
          addEventMessage(escLabel + ' ' + r.name + ' +' + r.coins + 'c +' + r.xp + 'XP', r.escaped ? '#ffd700' : '#ff8866');
        }
      }
    }

    // === NPC REVENGE EVENTS ===
    if (ev.type === 'npc_revenge') {
      SoundEngine.npcRevenge();
      showAnnouncement('NPCs ARE FIGHTING BACK!', '#ff4444', 2000);
      addEventMessage('Angry NPCs in the area!', '#ff4444');
    }
    if (ev.type === 'revenge_npc_catch') {
      if (ev.birdId === myId) {
        SoundEngine.stunned();
        showAnnouncement('REVENGE NPC GOT YOU!', '#ff0000', 2000);
      }
    }

    // === BLACK MARKET EVENTS ===
    if (ev.type === 'blackmarket_open') {
      addEventMessage('🐀 The Black Market is OPEN! Dark alley near Cafe District. Press B nearby.', '#cc44ff');
    }
    if (ev.type === 'blackmarket_close') {
      addEventMessage('🌅 The Black Market packed up at dawn.', '#888');
      closeBmShop();
    }
    if (ev.type === 'blackmarket_purchased') {
      if (ev.birdId === myId) {
        showAnnouncement(ev.emoji + ' Bought: ' + ev.itemName + ' (-' + ev.cost + 'c)', '#cc44ff', 2500);
        addEventMessage('You bought ' + ev.itemName + ' from the Black Market!', '#cc44ff');
      }
    }
    if (ev.type === 'blackmarket_fail') {
      if (ev.birdId === myId) {
        addEventMessage('❌ ' + ev.reason, '#ff4444');
      }
    }

    // === PIGEONHOLE SLOTS CASINO EVENTS ===
    if (ev.type === 'slots_result') {
      if (ev.birdId === myId) {
        onSlotsResult(ev);
      }
    }
    if (ev.type === 'slots_fail') {
      if (ev.birdId === myId) {
        const msg = document.getElementById('casinoResultMsg');
        if (msg) { msg.style.color = '#ff4444'; msg.textContent = '❌ ' + ev.reason; }
        const spinBtn = document.getElementById('casinoSpinBtn');
        if (spinBtn) { spinBtn.disabled = false; spinBtn.style.opacity = '1'; }
        casinoSpinning = false;
        if (casinoSpinInterval) { clearInterval(casinoSpinInterval); casinoSpinInterval = null; }
      }
    }
    if (ev.type === 'slots_jackpot') {
      // City-wide jackpot announcement!
      showAnnouncement(`👑 JACKPOT!! ${ev.name} won ${ev.payout}c from the CASINO!!`, '#ffd700', 5000);
      addEventMessage(`🎰 JACKPOT! ${ev.name} hit the jackpot for ${ev.payout}c!!!`, '#ffd700');
      effects.push({ type: 'screen_shake', intensity: 25, duration: 1500, time: performance.now() });
    }

    // === BIRD TATTOO PARLOR EVENTS ===
    if (ev.type === 'tattoo_bought') {
      if (ev.birdId === myId) {
        showAnnouncement(`🎨 NEW TATTOO: ${ev.emoji} ${ev.name}! (-${ev.cost}c)`, '#ff88ff', 3000);
        addEventMessage(`🎨 You got inked: ${ev.emoji} ${ev.name}!`, '#ff88ff');
        if (tattooOverlayVisible) renderTattooOverlay();
      }
    }
    if (ev.type === 'tattoo_equipped') {
      if (ev.birdId === myId) {
        if (tattooOverlayVisible) renderTattooOverlay();
      }
    }
    if (ev.type === 'tattoo_error') {
      if (ev.birdId === myId) {
        addEventMessage('❌ Tattoo: ' + ev.msg, '#ff4444');
      }
    }

    // === PRESTIGE EVENTS ===
    if (ev.type === 'prestige') {
      const badges = ['', '⚜️', '⚜️⚜️', '⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️⚜️'];
      const tierNames = ['', 'Ascended', 'Veteran', 'Elite', 'Champion', 'LEGEND'];
      const isMe = ev.birdId === myId;
      const gangPart = ev.gangTag ? ` [${ev.gangTag}]` : '';
      const tier = tierNames[Math.min(ev.prestige, 5)] || '';
      const badge = badges[Math.min(ev.prestige, 5)] || '';
      if (isMe) {
        triggerScreenShake(10, 800);
        showAnnouncement(`${badge} PRESTIGE ${ev.prestige}! You are now ${tier}!`, ev.prestige >= 5 ? '#ffd700' : '#cc88ff', 6000);
        addEventMessage(`${badge} YOU ASCENDED to ${tier}! ${ev.bonus}`, ev.prestige >= 5 ? '#ffd700' : '#cc88ff');
        if (prestigePanelVisible) renderPrestigePanel();
      } else {
        const color = ev.prestige >= 5 ? '#ffd700' : '#cc88ff';
        showAnnouncement(`${badge} ${ev.birdName}${gangPart} ASCENDED — Prestige ${ev.prestige} (${tier})!`, color, 4000);
        addEventMessage(`${badge} ${ev.birdName} reached Prestige ${ev.prestige} (${tier})!`, color);
      }
    }
    if (ev.type === 'prestige_fail') {
      if (ev.birdId === myId) {
        addEventMessage('⚜️ Prestige: ' + ev.msg, '#ff8844');
        if (prestigePanelVisible) renderPrestigePanel();
      }
    }

    // === THE ARENA — PvP EVENTS ===
    if (ev.type === 'arena_enter') {
      if (ev.birdId === myId) {
        showAnnouncement('⚔️ YOU ENTERED THE ARENA! (-30c)', '#ff8844', 3000);
        addEventMessage('⚔️ You entered the arena! Pot: ' + ev.pot + 'c (' + ev.fighterCount + ' fighters)', '#ff8844');
      } else {
        addEventMessage('⚔️ ' + ev.birdName + ' joined the arena! Pot: ' + ev.pot + 'c', '#ff8844');
      }
    }
    if (ev.type === 'arena_enter_fail') {
      if (ev.birdId === myId) {
        addEventMessage('❌ Arena: ' + ev.reason, '#ff4444');
      }
    }
    if (ev.type === 'arena_refund') {
      if (ev.birdId === myId) {
        addEventMessage('💸 Arena: Not enough fighters — 30c refunded', '#ffcc44');
      }
    }
    if (ev.type === 'arena_countdown') {
      showAnnouncement('⚔️ ARENA FIGHT IN ' + ev.countdown + 's! ' + ev.fighters.join(' vs '), '#ffcc00', 5000);
      addEventMessage('⚔️ Arena fight starting! ' + ev.fighters.join(' vs ') + ' — Pot: ' + ev.pot + 'c', '#ffcc00');
      effects.push({ type: 'screen_shake', time: now, duration: 400, intensity: 4 });
    }
    if (ev.type === 'arena_fight_start') {
      showAnnouncement('⚔️ FIGHT! ⚔️', '#ff4400', 2000);
      addEventMessage('⚔️ ARENA FIGHT STARTED! ' + ev.fighters.join(' vs ') + ' — Pot: ' + ev.pot + 'c', '#ff4400');
      effects.push({ type: 'screen_shake', time: now, duration: 600, intensity: 8 });
    }
    if (ev.type === 'arena_damage') {
      effects.push({ type: 'splat', x: ev.x, y: ev.y, time: now, duration: 600, radius: 20 });
      if (ev.attackerId === myId) {
        effects.push({
          type: 'text', x: ev.x, y: ev.y - 25,
          time: now, duration: 1400,
          text: '⚔️ ARENA HIT! -1♥', color: '#ff4400', size: 16,
        });
      }
      if (ev.targetId === myId) {
        effects.push({
          type: 'text', x: ev.x, y: ev.y - 25,
          time: now, duration: 1400,
          text: '💔 HIT! ♥'.repeat(ev.hp) || 'LAST HP!', color: '#ff0000', size: 14,
        });
        SoundEngine.stunned();
      }
    }
    if (ev.type === 'arena_eliminated') {
      if (ev.birdId === myId) {
        showAnnouncement('💀 ELIMINATED!', '#ff0000', 4000);
        effects.push({ type: 'screen_shake', time: now, duration: 800, intensity: 12 });
      } else if (ev.killedById === myId) {
        showAnnouncement('⚔️ YOU ELIMINATED ' + ev.birdName + '!', '#ff6600', 3000);
        addEventMessage('⚔️ ' + ev.killedByName + ' eliminated ' + ev.birdName + '!', '#ff6600');
      } else {
        addEventMessage('💀 ' + ev.birdName + ' was eliminated' + (ev.killedByName ? ' by ' + ev.killedByName : '') + '!', '#ff4444');
      }
    }
    if (ev.type === 'arena_victory') {
      if (ev.winnerId === myId) {
        showAnnouncement('🏆 YOU WIN! +' + ev.pot + 'c + 200 XP!', '#ffd700', 6000);
        effects.push({ type: 'screen_shake', time: now, duration: 1000, intensity: 15 });
      }
      addEventMessage('🏆 ARENA WINNER: ' + ev.winnerName + ' takes the pot (' + ev.pot + 'c)!', '#ffd700');
    }
    if (ev.type === 'arena_draw') {
      showAnnouncement('🤝 ARENA DRAW! Fees refunded.', '#aaaaff', 3000);
      addEventMessage('🤝 Arena ended in a draw — entry fees refunded', '#aaaaff');
    }
    if (ev.type === 'arena_cancelled') {
      addEventMessage('⚔️ Arena fight cancelled — not enough fighters', '#888');
    }

    // === STREET DUELS ===
    if (ev.type === 'duel_incoming_challenge') {
      if (ev.birdId === myId) {
        showAnnouncement('⚔️ ' + ev.challengerName + ' challenges you to a STREET DUEL!\nPot: ' + ev.pot + 'c · Press [Y] to accept, [ESC] to decline', '#ff6666', 15000);
        SoundEngine.stunned();
      }
    }
    if (ev.type === 'duel_challenge_sent') {
      if (ev.birdId === myId) {
        showTemporaryPrompt('⚔️ Challenge sent to ' + ev.targetName + '! Waiting…', 'streetDuelPrompt', 4000);
      }
    }
    if (ev.type === 'duel_declined') {
      if (ev.birdId === myId) {
        showAnnouncement('❌ ' + ev.targetName + ' declined the duel.', '#ff8888', 3000);
      }
    }
    if (ev.type === 'duel_challenge_expired') {
      if (ev.birdId === myId) {
        showTemporaryPrompt('⚔️ Duel challenge expired.', 'streetDuelPrompt', 2000);
      }
    }
    if (ev.type === 'duel_fail') {
      if (ev.birdId === myId) {
        const msgs = { too_far: 'Too far away to challenge!', no_coins: 'Not enough coins for the stake!', no_challenge: 'No pending challenge.' };
        showTemporaryPrompt('⚔️ ' + (msgs[ev.reason] || 'Cannot duel right now.'), 'streetDuelPrompt', 2000);
      }
    }
    if (ev.type === 'street_duel_start') {
      const rematchLabel = ev.isRematch ? (ev.rematchCount > 1 ? ` (REMATCH x${ev.rematchCount})` : ' (REMATCH)') : '';
      addEventMessage('⚔️ STREET DUEL' + rematchLabel + ': ' + ev.challengerName + ' vs ' + ev.targetName + ' (' + ev.pot + 'c pot!) · 🎰 Bet on a fighter!');
      effects.push({ type: 'screen_shake', time: now, duration: 600, intensity: 8 });
      if (ev.challengerId === myId || ev.targetId === myId) {
        const title = ev.isRematch ? '🔄 REMATCH START!' : '⚔️ STREET DUEL START!';
        showAnnouncement(title + '\nPot: ' + ev.pot + 'c · POOP YOUR OPPONENT!', '#ff4444', 4000);
      } else {
        // Show non-duelers that they can bet
        showTemporaryPrompt('⚔️ DUEL: ' + ev.challengerName + ' vs ' + ev.targetName + ' · 🎰 Bet window opens!', 'streetDuelPrompt', 4000);
      }
    }
    if (ev.type === 'street_duel_hit') {
      effects.push({ type: 'splat', x: ev.x, y: ev.y, time: now, duration: 600, radius: 18 });
      const hp = ev.hp;
      const hearts = (hp >= 3 ? '❤️❤️❤️' : hp === 2 ? '❤️❤️🖤' : hp === 1 ? '❤️🖤🖤' : '💀💀💀');
      if (ev.attackerId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 28, time: now, duration: 1400, text: '⚔️ DUEL HIT! ' + hearts, color: '#ff6600', size: 15 });
      }
      if (ev.targetId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 28, time: now, duration: 1400, text: '💔 DUEL HIT! ' + hearts, color: '#ff0000', size: 15 });
        effects.push({ type: 'screen_shake', time: now, duration: 300, intensity: 5 });
        SoundEngine.stunned();
      }
    }
    if (ev.type === 'street_duel_end') {
      if (ev.reason === 'draw') {
        if (ev.challengerId === myId || ev.targetId === myId) {
          showAnnouncement('🤝 DUEL DRAW! Time\'s up — coins refunded.', '#aaaaff', 4000);
        }
        addEventMessage('🤝 DUEL DRAW: ' + ev.challengerName + ' vs ' + ev.targetName + ' — time ran out', '#aaaaff');
      } else {
        if (ev.winnerId === myId) {
          showAnnouncement('🏆 DUEL WIN! ⚔️ +' + ev.pot + 'c +150 XP!', '#ffd700', 5000);
          effects.push({ type: 'screen_shake', time: now, duration: 800, intensity: 12 });
        } else if (ev.loserId === myId) {
          showAnnouncement('💀 DUEL LOSS! ' + (ev.winnerName || '???') + ' knocked you out!', '#ff4444', 4000);
          effects.push({ type: 'screen_shake', time: now, duration: 600, intensity: 8 });
        }
        addEventMessage('⚔️ DUEL WINNER: ' + (ev.winnerName || '???') + ' defeats ' + (ev.loserName || '???') + ' (+' + ev.pot + 'c)!', '#ffd700');
      }
    }
    if (ev.type === 'street_duel_cancelled') {
      if (ev.opponentId === myId) {
        showAnnouncement('⚔️ Your opponent disconnected — duel cancelled, coins refunded.', '#ff9999', 3000);
      }
    }

    // === DUEL BETTING ===
    if (ev.type === 'duel_bet_placed') {
      addEventMessage('🎰 ' + ev.birdName + ' bets ' + ev.amount + 'c on ' + ev.onName + ' in the street duel!', '#ffcc44');
      // If it was my bet, show confirmation
      if (ev.birdId === myId) {
        showTemporaryPrompt('🎰 Bet placed: ' + ev.amount + 'c on ' + ev.onName + '!', 'streetDuelPrompt', 3000);
      }
    }
    if (ev.type === 'duel_bet_fail') {
      if (ev.birdId === myId) {
        const msgs = {
          no_duel: 'No active duel found.',
          dueler: 'You can\'t bet on your own duel!',
          window_closed: 'Betting window is closed.',
          already_bet: 'Already placed a bet on this duel.',
          invalid_amount: 'Bet must be 10–300 coins.',
          no_coins: 'Not enough coins to bet.',
          invalid_fighter: 'Invalid fighter selection.',
        };
        showTemporaryPrompt('🎰 ' + (msgs[ev.reason] || 'Cannot bet right now.'), 'streetDuelPrompt', 2500);
      }
    }
    if (ev.type === 'duel_bet_results') {
      if (ev.results) {
        for (const r of ev.results) {
          if (r.birdId === myId) {
            if (r.refund) {
              showAnnouncement('🎰 Duel bet refunded — nobody bet on the winner.', '#aaaaff', 4000);
            } else if (r.won) {
              showAnnouncement('🎰 DUEL BET WIN! +' + r.payout + 'c profit ' + (r.profit > 0 ? '(+' + r.profit + 'c)!' : ''), '#ffd700', 5000);
              addEventMessage('🎰 ' + r.birdName + ' bet on ' + ev.winnerName + ' and won +' + r.payout + 'c!', '#ffd700');
            } else {
              showAnnouncement('🎰 Duel bet lost — ' + r.betAmount + 'c gone.', '#ff7777', 3000);
            }
          } else if (r.won) {
            addEventMessage('🎰 ' + r.birdName + ' won their duel bet: +' + r.payout + 'c!', '#ffcc44');
          }
        }
      }
    }

    // === DUEL REMATCH ===
    if (ev.type === 'duel_rematch_available') {
      if (ev.bird1Id === myId || ev.bird2Id === myId) {
        const opponentName = ev.bird1Id === myId ? '' : '';
        showAnnouncement('🔄 REMATCH? Press [Y] to go again! (10 seconds)', '#ff9966', 10000);
      }
    }
    if (ev.type === 'duel_rematch_accepted_by') {
      addEventMessage('🔄 ' + ev.birdName + ' accepted the rematch!', '#ff9966');
    }
    if (ev.type === 'duel_rematch_fail') {
      if (ev.bird1Id === myId || ev.bird2Id === myId) {
        showTemporaryPrompt('🔄 Rematch failed — not enough coins.', 'streetDuelPrompt', 2000);
      }
    }

    // === PIGEON RACING ===
    if (ev.type === 'race_open') {
      const sec = Math.round(Math.max(0, (ev.openUntil - Date.now()) / 1000));
      showAnnouncement('🏁 PIGEON RACE STARTING!\nFly to START ring & press [R] to race (-' + ev.entryFee + 'c)\n🎰 Spectators can BET on the winner!', '#ffd700', 6000);
      addEventMessage('🏁 RACE OPEN — fly to START [R] to race (-' + ev.entryFee + 'c) or 🎰 BET from anywhere!', '#ffd700');
    }
    if (ev.type === 'race_join') {
      if (ev.birdId === selfId) {
        addEventMessage('🏁 You joined the race! ' + ev.racerCount + ' racer(s) — pot: ' + ev.pot + 'c', '#ffd700');
      } else {
        addEventMessage('🏁 ' + ev.birdName + ' joined the race! (' + ev.racerCount + ' racers, pot: ' + ev.pot + 'c)', '#aaffaa');
      }
    }
    if (ev.type === 'race_join_fail') {
      if (ev.birdId === selfId) {
        const msgs = { not_open: 'No race open right now!', already_joined: 'You\'re already in!', full: 'Race is full!', no_coins: 'Not enough coins!', too_far: 'Fly to the START ring first!' };
        addEventMessage('❌ ' + (msgs[ev.reason] || 'Can\'t join race'), '#ff6644');
      }
    }
    if (ev.type === 'race_countdown') {
      const names = ev.racers.slice(0, 4).join(', ') + (ev.racers.length > 4 ? '...' : '');
      showAnnouncement('🏁 RACE STARTING IN ' + ev.countdown + 's!\n' + ev.racerCount + ' racers — 💰 ' + ev.pot + 'c pot\n' + names, '#ffd700', 5500);
    }
    if (ev.type === 'race_start') {
      showAnnouncement('🏁 RACE START — GO GO GO!\n' + ev.racerCount + ' birds racing for ' + ev.pot + 'c', '#ffd700', 3000);
      addEventMessage('🏁 RACE STARTED! ' + ev.racerCount + ' birds racing for ' + ev.pot + 'c!', '#ffd700');
      effects.push({ type: 'screen_shake', time: performance.now(), duration: 400, intensity: 6 });
    }
    if (ev.type === 'race_checkpoint_hit') {
      if (ev.birdId === selfId) {
        showAnnouncement('✅ ' + ev.checkpoint + ' CLEARED!\n📍 Position: #' + ev.position, '#44ff44', 2200);
        effects.push({ type: 'screen_shake', time: performance.now(), duration: 200, intensity: 3 });
      } else {
        addEventMessage('🏁 ' + ev.birdName + ' hit ' + ev.checkpoint + '! (P' + ev.position + ')', '#aaffaa');
      }
    }
    if (ev.type === 'race_finish') {
      const medals = ['🥇','🥈','🥉'];
      const medal = medals[(ev.position || 1) - 1] || ('#' + ev.position);
      const timeStr = ev.time ? (ev.time / 1000).toFixed(1) + 's' : 'DNF';
      if (ev.birdId === selfId) {
        showAnnouncement(medal + ' YOU FINISHED! Position: ' + medal + '\nTime: ' + timeStr, '#ffd700', 5000);
        effects.push({ type: 'screen_shake', time: performance.now(), duration: 500, intensity: 8 });
      } else {
        showAnnouncement(medal + ' ' + ev.birdName + ' finished! (#' + ev.position + ' — ' + timeStr + ')', ev.position === 1 ? '#ffd700' : '#aaaaff', 3000);
        addEventMessage('🏁 ' + medal + ' ' + ev.birdName + ' crossed the FINISH LINE! (' + timeStr + ')', '#ffd700');
      }
    }
    if (ev.type === 'race_boost_gate') {
      if (ev.birdId === selfId) {
        // Big personal flash + floating text
        effects.push({ type: 'screen_shake', time: performance.now(), duration: 180, intensity: 4 });
        effects.push({ type: 'flash', time: performance.now(), duration: 350, color: 'rgba(255,255,50,0.4)' });
        effects.push({ type: 'text', x: gameState.self ? gameState.self.x : 0, y: gameState.self ? gameState.self.y - 30 : 0, text: '⚡ BOOST!', color: '#ffff44', size: 18, time: performance.now(), duration: 1200 });
      } else {
        addEventMessage('⚡ ' + ev.birdName + ' hit a BOOST gate!', '#ffff44');
      }
    }
    if (ev.type === 'race_cancelled') {
      addEventMessage('🏁 Race cancelled — not enough racers', '#888');
    }
    if (ev.type === 'race_results') {
      const top = (ev.rewards || []).filter(r => r.coins > 0).slice(0, 3);
      const podium = top.map((r, i) => ['🥇','🥈','🥉'][i] + ' ' + r.name + ' (+' + r.coins + 'c)').join('  ');
      showAnnouncement('🏁 RACE RESULTS!\n' + (podium || 'No finishers'), '#ffd700', 7000);
      addEventMessage('🏁 RACE OVER! Winner: ' + ((ev.rewards && ev.rewards[0]) ? ev.rewards[0].name : '???') + ' 🏆', '#ffd700');
    }
    if (ev.type === 'race_bet_placed') {
      if (ev.birdId === selfId) {
        addEventMessage('🎰 You bet ' + ev.amount + 'c on ' + ev.targetName + '! Good luck!', '#ffd700');
      } else {
        addEventMessage('🎰 ' + ev.birdName + ' placed a bet on ' + ev.targetName + '! (' + ev.totalBets + ' bets total)', '#ccaa44');
      }
    }
    if (ev.type === 'race_bet_fail') {
      if (ev.birdId === selfId) {
        const msgs = {
          not_open: 'Betting is closed!',
          racer_no_bet: 'Racers can\'t bet on the race!',
          already_bet: 'You already placed a bet!',
          no_coins: 'Not enough coins!',
          invalid_amount: 'Bet must be 10–500 coins!',
          invalid_racer: 'Invalid racer!',
          no_racers: 'No racers registered yet!',
        };
        addEventMessage('❌ ' + (msgs[ev.reason] || 'Can\'t place bet'), '#ff6644');
      }
    }
    if (ev.type === 'race_bet_results') {
      if (ev.noWinners) {
        addEventMessage('🎰 No one bet on ' + ev.winnerName + ' — all bets refunded!', '#ffaa44');
        // Show refund if this player bet
        const myResult = (ev.results || []).find(r => r.birdId === selfId);
        if (myResult) {
          showAnnouncement('🎰 BET REFUNDED!\nNo one else predicted ' + ev.winnerName + '\n+' + myResult.payout + 'c back', '#ffaa44', 5000);
        }
      } else {
        const myResult = (ev.results || []).find(r => r.birdId === selfId);
        if (myResult) {
          if (myResult.won) {
            showAnnouncement('🎰 WINNING BET!\nYou backed ' + ev.winnerName + '!\n+' + myResult.payout + 'c payout (profit: +' + myResult.profit + 'c)', '#44ff44', 6000);
            effects.push({ type: 'screen_shake', time: performance.now(), duration: 400, intensity: 5 });
          } else {
            showAnnouncement('🎰 Wrong pick...\nYou bet on ' + myResult.betAmount + 'c\n' + ev.winnerName + ' won — lost ' + myResult.betAmount + 'c', '#ff6644', 4000);
          }
        }
        // Announce winners to all
        const winners = (ev.results || []).filter(r => r.won);
        if (winners.length > 0) {
          const winStr = winners.slice(0, 3).map(r => r.birdName + ' (+' + r.profit + 'c)').join(', ');
          addEventMessage('🎰 RACE BETS SETTLED! Winning bettors: ' + winStr, '#ffd700');
        }
      }
    }

    // === DAY/NIGHT PHASE CHANGE ===
    if (ev.type === 'phase_change') {
      const phaseColors = {
        dusk:  '#ff9944',
        night: '#8888ff',
        dawn:  '#ffcc44',
        day:   '#ffff88',
      };
      const color = phaseColors[ev.phase] || '#ffffff';
      showAnnouncement(ev.message || ev.phase.toUpperCase(), color, 5000);
      addEventMessage(ev.message || ('Phase: ' + ev.phase), color);
      // Subtle screen tint flash
      if (ev.phase === 'night') {
        effects.push({ type: 'screen_shake', time: performance.now(), duration: 300, intensity: 2 });
      }
    }

    // === WEATHER EVENTS ===
    if (ev.type === 'weather_start') {
      const msgs = {
        rain:      ['🌧️ IT\'S RAINING! Worms are surfacing — free food!', '#66aaff'],
        wind:      ['💨 STRONG WINDS! The city is being swept!', '#aaddff'],
        storm:     ['⛈️ THUNDERSTORM! Take cover — lightning incoming!', '#ffdd44'],
        fog:       ['🌫️ DENSE FOG rolls in... cops lose your trail in the mist!', '#b8ddc0'],
        hailstorm: ['🌨️ HAILSTORM! Ice chunks will slow anyone they hit!', '#aaddff'],
        heatwave:  ['🌡️ HEATWAVE! The city is SCORCHING — find water puddles before you shrivel!', '#ff8800'],
        tornado:   ['🌪️ TORNADO INCOMING! Stay clear or get FLUNG across the city!', '#cc88ff'],
        blizzard:  ['❄️ BLIZZARD! Snowball poop is HUGE — find hot cocoa to stay warm!', '#aaddff'],
      };
      const [msg, color] = msgs[ev.weatherType] || ['Weather changed!', '#fff'];
      showAnnouncement(msg, color, 4000);
      addEventMessage(msg, color);
      if (ev.weatherType === 'tornado') {
        effects.push({ type: 'screen_shake', time: performance.now(), duration: 800, intensity: 10 });
      }
      weatherState = { type: ev.weatherType, windAngle: ev.windAngle, windSpeed: ev.windSpeed, intensity: ev.intensity };
    }
    if (ev.type === 'weather_end') {
      const endMsgs = {
        rain:      'The rain has stopped. Worms retreating underground.',
        wind:      'The wind has died down.',
        storm:     'The storm has passed.',
        fog:       '🌫️ The fog lifts. Cops can see you again.',
        hailstorm: '🌨️ The hailstorm passes.',
        heatwave:  '🌡️ The heatwave breaks. Cool relief washes over the city.',
        tornado:   '🌪️ The tornado dissipates. The city exhales.',
        blizzard:  '❄️ The blizzard clears. Snow melts off the streets.',
      };
      addEventMessage(endMsgs[ev.weatherType] || 'Weather cleared.', '#aaaaaa');
      weatherState = null;
    }
    if (ev.type === 'worms_appeared') {
      addEventMessage('🪱 Worms are wriggling out of the wet ground! Grab them!', '#d46a8a');
    }
    if (ev.type === 'heat_puddles_appeared') {
      addEventMessage('💧 Water puddles have appeared across the city — drink before you dry out!', '#5599ff');
    }
    if (ev.type === 'puddle_drink') {
      if (ev.birdId === myId) {
        showAnnouncement('💧 REFRESHED! +35 food — quenched for 20s + speed boost!', '#44aaff', 2500);
        addEventMessage('💧 You drank from a puddle! +35 food — quenched for 20s + ×1.2 speed for 15s', '#44aaff');
      }
    }
    if (ev.type === 'food_spoiled') {
      addEventMessage(`🥵 The scorching heat spoiled ${ev.count || 'some'} food around the city!`, '#ff8822');
    }
    if (ev.type === 'cocoa_appeared') {
      addEventMessage('☕ Hot cocoa has appeared around the city — drink up to stay warm!', '#ffaa44');
    }
    if (ev.type === 'cocoa_drink' && ev.birdId === myId) {
      showAnnouncement('☕ HOT COCOA! +20 food — WARM for 30s (+25% speed)!', '#ffcc44', 2500);
      addEventMessage('☕ You drank hot cocoa! Warm for 30s · +25% speed', '#ffcc44');
    }
    if (ev.type === 'ice_rink_spawned') {
      showAnnouncement('⛸️ ICE RINK!', '❄️ A plaza has frozen over! Fly there to SLIDE — lose all turning control but gain huge speed!', '#aaddff', 5000);
      addEventMessage('⛸️ An ICE RINK formed in the blizzard! Birds slide uncontrollably — +30% speed, almost no turning!', '#aaddff');
      effects.push({ type: 'screen_shake', time: performance.now(), duration: 500, intensity: 6 });
    }
    if (ev.type === 'ice_rink_melted') {
      addEventMessage('⛸️ The ice rink has melted as the blizzard clears.', '#88aacc');
    }

    // === THUNDER DOME EVENTS ===
    if (ev.type === 'thunder_dome_start') {
      window._thunderDomeData = { x: ev.x, y: ev.y, radius: ev.radius, district: ev.district, endsAt: ev.endsAt };
      showAnnouncement(`⚡ THUNDER DOME descends on ${ev.district}!`, `Electric walls trap birds inside for +50% XP. Can't leave — can't stop POOPING!`, '#4499ff', 6000);
      addEventMessage(`⚡ THUNDER DOME descended on ${ev.district}! Birds inside earn +50% XP — but you CANNOT LEAVE!`, '#88aaff');
      effects.push({ type: 'screen_shake', time: performance.now(), duration: 900, intensity: 16 });
    }
    if (ev.type === 'thunder_dome_end') {
      window._thunderDomeData = null;
      showAnnouncement('⚡ THUNDER DOME lifts.', `The electromagnetic field over ${ev.district} collapses. Birds scatter.`, '#88aaff', 4000);
      addEventMessage(`⚡ The Thunder Dome over ${ev.district} has lifted. Birds scatter.`, '#88aaff');
      effects.push({ type: 'screen_shake', time: performance.now(), duration: 400, intensity: 8 });
    }
    if (ev.type === 'thunder_dome_shock') {
      if (ev.birdId === myId) {
        addFloatingText(ev.x, ev.y, '⚡ SHOCKED! −5 food', '#88aaff');
      }
    }

    // === THUNDER DOME CROSS-SYSTEM SYNERGIES ===
    // Dome × Gang War: announcement when dome lands during active war
    if (ev.type === 'dome_gang_war_synergy') {
      showAnnouncement(`⚡⚔️ GANG WAR + THUNDER DOME!`, `War kills inside the dome count DOUBLE — the cage is a killing field!`, '#ff6644', 6000);
      addEventMessage(`⚡⚔️ DOME+WAR SYNERGY in ${ev.district}! Gang war kills count 2× inside the dome!`, '#ff8866');
    }
    // Dome × Kingpin: Kingpin trapped at dome spawn
    if (ev.type === 'dome_kingpin_trapped') {
      showAnnouncement(`⚡👑 ${ev.kingpinName} IS TRAPPED IN THE THUNDER DOME!`, `Dethronement hits on the Kingpin inside the dome give +100 XP bonus!`, '#4499ff', 6000);
      addEventMessage(`⚡👑 THE KINGPIN ${ev.kingpinName} is trapped in the dome! Each hit gives you +100 XP!`, '#88ccff');
    }
    // Dome × Kingpin hit bonus
    if (ev.type === 'dome_kingpin_hit_bonus' && ev.attackerId === myId) {
      addFloatingText(0, 0, `⚡ +${ev.bonus} DOME XP BONUS!`, '#88ccff');
      addEventMessage(`⚡ You earn +${ev.bonus} XP bonus for hitting the Kingpin in the dome!`, '#88ccff');
    }
    // Dome Champion badge awarded
    if (ev.type === 'dome_champion') {
      const isMine = ev.birdId === myId;
      if (isMine) {
        showAnnouncement('⚡ YOU ARE THE GLADIATOR CHAMPION!', `${ev.hits} dome hits in ${ev.district} — you earned the ⚡ GLADIATOR badge!`, '#4499ff', 8000);
      }
      addEventMessage(`⚡ GLADIATOR CHAMPION: ${ev.gangTag ? '[' + ev.gangTag + '] ' : ''}${ev.name} lands ${ev.hits} hits in ${ev.district}!`, '#88ccff');
      effects.push({ type: 'screen_shake', time: performance.now(), duration: 600, intensity: 12 });
    }

    // === WEATHER BETTING EVENTS ===
    if (ev.type === 'weather_bet_window') {
      const secsLeft = Math.ceil((ev.openUntil - Date.now()) / 1000);
      showAnnouncement('🌤️ WEATHER BET OPEN! What comes next? ' + secsLeft + 's to bet!', '#aaddff', 4000);
      addEventMessage('🌤️ Forecast betting window open — check the left panel!', '#aaddff');
    }
    if (ev.type === 'weather_bet_placed') {
      const info = WEATHER_BET_INFO && WEATHER_BET_INFO[ev.betType];
      const emoji = info ? info.emoji : '?';
      addEventMessage(`🌤️ ${ev.birdName} bet ${ev.amount}c on ${emoji} ${ev.betType}! (${ev.totalBets} bets, pool growing)`, '#88aacc');
    }
    if (ev.type === 'weather_bet_fail' && ev.birdId === myId) {
      const reasons = {
        no_window: 'No betting window is open right now.',
        already_bet: 'You already placed your bet!',
        invalid_type: 'Invalid weather type.',
        invalid_amount: 'Bet must be 10–300 coins.',
        no_coins: 'Not enough coins!',
      };
      showAnnouncement('❌ ' + (reasons[ev.reason] || 'Bet failed.'), '#ff4444', 2000);
    }
    if (ev.type === 'weather_bet_expired') {
      addEventMessage('🌤️ Forecast betting window closed.', '#7799cc');
    }
    if (ev.type === 'weather_bet_results') {
      const info = WEATHER_BET_INFO && WEATHER_BET_INFO[ev.actualType];
      const emoji = info ? info.emoji : '?';
      if (ev.noWinners) {
        showAnnouncement(emoji + ' ' + ev.actualType.toUpperCase() + ' rolled in! Nobody guessed — full refund!', '#aaddff', 5000);
        addEventMessage(emoji + ' Weather: ' + ev.actualType + ' — no correct bets. Everyone refunded.', '#aaddff');
      } else {
        const winners = ev.results.filter(r => r.won);
        const winText = winners.map(r => r.birdName + ' (+' + (r.payout - r.amount) + 'c)').join(', ');
        showAnnouncement(emoji + ' ' + ev.actualType.toUpperCase() + ' was right! Winners: ' + winText, '#44ff88', 6000);
        for (const r of ev.results) {
          if (r.won && r.birdId === myId) {
            showAnnouncement('🎉 YOU WON! +' + (r.payout - r.amount) + 'c profit on your ' + ev.actualType + ' bet!', '#44ff88', 5000);
            effects.push({ type: 'screen_shake', intensity: 8, duration: 400, time: performance.now() });
          }
          if (!r.won && !r.refund && r.birdId === myId) {
            addEventMessage('💸 Your ' + r.betType + ' bet lost. Better luck next time!', '#ff7777');
          }
        }
        addEventMessage(emoji + ' Weather: ' + ev.actualType + ' — ' + winners.length + ' bettor(s) won! ' + winText, '#44ff88');
      }
    }
    if (ev.type === 'lightning') {
      // Screen flash + shake
      lightningFlash = { time: performance.now(), x: ev.x, y: ev.y, duration: 300 };
      effects.push({ type: 'screen_shake', intensity: 12, duration: 600, time: performance.now() });
    }
    if (ev.type === 'lightning_hit') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('⚡ YOU WERE STRUCK BY LIGHTNING!', '#ffff00', 2500);
      }
      addEventMessage(`⚡ ${ev.birdName || 'A bird'} was struck by lightning!`, '#ffdd44');
      effects.push({ type: 'text', x: ev.x, y: ev.y, text: '⚡ ZAP!', color: '#ffff44', size: 14, time: performance.now(), duration: 1500 });
    }
    if (ev.type === 'hail_strike') {
      // Brief ice-blue screen flash at strike location
      const sx = ev.x - camera.x + camera.screenW / 2;
      const sy = ev.y - camera.y + camera.screenH / 2;
      effects.push({ type: 'text', x: ev.x, y: ev.y, text: '🧊', color: '#aaddff', size: 16, time: performance.now(), duration: 800 });
      // Small screen shake for nearby strikes
      const strikeDist = Math.sqrt((sx - camera.screenW / 2) ** 2 + (sy - camera.screenH / 2) ** 2);
      if (strikeDist < 300) {
        effects.push({ type: 'screen_shake', intensity: 4, duration: 250, time: performance.now() });
      }
    }
    if (ev.type === 'hail_hit') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('🧊 HIT BY HAIL! Slowed!', '#aaddff', 1500);
        effects.push({ type: 'screen_shake', intensity: 6, duration: 300, time: performance.now() });
      }
      addEventMessage(`🧊 ${ev.birdName || 'A bird'} was slowed by hail!`, '#88ccff');
      effects.push({ type: 'text', x: ev.x, y: ev.y, text: '🧊 SLOW!', color: '#aaddff', size: 13, time: performance.now(), duration: 1200 });
    }
    if (ev.type === 'tornado_fling') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('🌪️ FLUNG BY THE TORNADO! −12 food!', '#cc88ff', 2500);
        effects.push({ type: 'screen_shake', intensity: 18, duration: 600, time: performance.now() });
      }
      addEventMessage(`🌪️ ${ev.birdName || 'A bird'} was FLUNG by the tornado!`, '#cc88ff');
      effects.push({ type: 'text', x: ev.x, y: ev.y, text: '🌪️ FLUNG!', color: '#cc88ff', size: 16, time: performance.now(), duration: 1800 });
    }

    // === RACCOON EVENTS ===
    if (ev.type === 'raccoon_spawn') {
      showAnnouncement('🦝 RACCOON THIEVES ARE OUT TONIGHT!', '#bb88ff', 4000);
      addEventMessage('Raccoon thieves are stealing food! Poop on them to stop them!', '#bb88ff');
    }
    if (ev.type === 'raccoon_steal') {
      addEventMessage('🦝 A raccoon snatched food!', '#ff8844');
      effects.push({ type: 'text', x: ev.x, y: ev.y, text: 'SNATCHED!', color: '#ff8844', size: 11, time: performance.now(), duration: 1500 });
    }
    if (ev.type === 'raccoon_flee') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('RACCOON BUSTED! +10 COINS!', '#4ade80', 2000);
      }
      addEventMessage((ev.birdName || 'A bird') + ' busted a raccoon thief! +10 coins!', '#4ade80');
      effects.push({ type: 'text', x: ev.x, y: ev.y, text: 'BUSTED! +35 XP', color: '#4ade80', size: 11, time: performance.now(), duration: 1800 });
    }
    if (ev.type === 'raccoons_gone') {
      addEventMessage('The raccoon thieves fled at dawn.', '#aaaaaa');
    }

    // === DRUNK PIGEON EVENTS ===
    if (ev.type === 'drunk_pigeon_spawn') {
      showAnnouncement('🍺 DRUNK PIGEONS ARE OUT TONIGHT!', '#ffaa44', 4000);
      addEventMessage('Drunk pigeons are stumbling around the city — pickpocket them for coins!', '#ffaa44');
    }
    if (ev.type === 'drunk_pigeon_pickpocket') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement(`PICKPOCKETED! +${ev.stolen}c`, '#ffd700', 1800);
      }
      if (isMe || Math.random() < 0.25) {
        addEventMessage(`🍺 ${ev.birdName} swiped ${ev.stolen}c from a drunk pigeon!`, '#ffd700');
      }
      effects.push({ type: 'text', x: ev.x, y: ev.y, text: '+' + ev.stolen + 'c', color: '#ffd700', size: 13, time: performance.now(), duration: 1600 });
    }
    if (ev.type === 'drunk_pigeon_coin_shower') {
      // Big screen flash for everyone
      const crimeBonus = ev.crimeWaveBonus;
      const headerText = crimeBonus ? '⚡🍺🚨 CRIME WAVE PIGEON ZAPPED — 2× COIN SHOWER!' : '⚡🍺 DRUNK PIGEON ZAPPED — COIN SHOWER!';
      showAnnouncement(headerText, '#ffd700', crimeBonus ? 5000 : 4000);
      const winnerNames = ev.winners.map(w => `${w.name} (+${w.share}c)`).join(', ');
      const prefix = crimeBonus ? '⚡🚨 CRIME WAVE BOOST: ' : '⚡ ';
      addEventMessage(prefix + `Lightning zapped a drunk pigeon! Coins scattered: ${winnerNames || 'nobody nearby'}`, '#ffd700');
      effects.push({ type: 'text', x: ev.x, y: ev.y, text: crimeBonus ? '💰🚨 2× SHOWER!' : '💰 COIN SHOWER!', color: '#ffd700', size: 16, time: performance.now(), duration: 3000 });
      effects.push({ type: 'screen_shake', intensity: crimeBonus ? 14 : 10, duration: crimeBonus ? 700 : 500, time: performance.now() });
      // Bonus announcement if I was in range
      if (ev.winners && ev.winners.some(w => w.id === myId)) {
        const myWin = ev.winners.find(w => w.id === myId);
        showAnnouncement(`💰 YOU GOT ${myWin.share}c FROM THE SHOWER!${crimeBonus ? ' (2× CRIME WAVE!)' : ''}`, '#ffd700', 3000);
      }
    }
    if (ev.type === 'crime_wave_pigeon_blast_cops') {
      addEventMessage(`🚨⚡🍺 Crime Wave pigeon blast STUNNED ${ev.count} cop${ev.count > 1 ? 's' : ''}! Chaos reigns!`, '#ff8800');
      effects.push({ type: 'text', x: ev.x, y: ev.y - 30, text: `🚨 ${ev.count} COP${ev.count > 1 ? 'S' : ''} STUNNED!`, color: '#ff8800', size: 13, time: performance.now(), duration: 2500 });
    }
    if (ev.type === 'drunk_pigeons_gone') {
      addEventMessage('The drunk pigeons passed out and went home at dawn.', '#aaaaaa');
    }

    // === BIOLUMINESCENT POND — OWL ENFORCER EVENTS ===
    if (ev.type === 'owl_appears') {
      showAnnouncement('🦉 The Owl Enforcer guards the Sacred Pond! Stay quiet...', '#00ffc8', 4000);
      addEventMessage('🦉 The Owl Enforcer has arrived at the Sacred Pond. Pooping nearby will alert it!', '#00ffc8');
    }
    if (ev.type === 'owl_leaves') {
      addEventMessage('🦉 The Owl Enforcer retreats at dawn. The pond is quiet again.', '#aaaaaa');
    }
    if (ev.type === 'owl_alert') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('🦉 OWL ALERT! The Enforcer is hunting you!', '#ff8800', 3000);
        effects.push({ type: 'screen_shake', intensity: 6, duration: 350, time: performance.now() });
      } else {
        addEventMessage(`🦉 Owl SPOTTED ${ev.birdName} making noise near the Sacred Pond!`, '#ff8800');
      }
    }
    if (ev.type === 'owl_caught') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement(`🦉 OWL CAUGHT YOU! −${ev.stolen} coins`, '#ff4400', 3000);
        effects.push({ type: 'screen_shake', intensity: 10, duration: 500, time: performance.now() });
        effects.push({ type: 'text', x: ev.x, y: ev.y, text: `−${ev.stolen}c 🦉`, color: '#ff4400', size: 14, time: performance.now(), duration: 2000 });
      } else {
        addEventMessage(`🦉 Owl caught ${ev.birdName} and seized ${ev.stolen} coins!`, '#ff8800');
      }
    }
    if (ev.type === 'owl_scared') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('🦉 YOU SCARED OFF THE OWL! +15c +50 XP', '#00ffc8', 2500);
        effects.push({ type: 'text', x: ev.x, y: ev.y, text: '🦉 SCARED! +15c', color: '#00ffc8', size: 13, time: performance.now(), duration: 2000 });
      } else {
        addEventMessage(`🦉 ${ev.birdName} scared the Owl Enforcer away! (8s stunned)`, '#00ffc8');
      }
    }
    if (ev.type === 'pond_fish_caught') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement(`✨ BIOLUMINESCENT FISH! +${ev.coins}c +80 XP`, '#00ffc8', 3000);
        effects.push({ type: 'text', x: ev.x, y: ev.y, text: `+${ev.coins}c ✨`, color: '#00ffc8', size: 14, time: performance.now(), duration: 2200 });
      } else {
        addEventMessage(`✨ ${ev.name} caught a glowing pond fish! (+${ev.coins}c)`, '#00ffc8');
      }
    }

    // === CHERRY BLOSSOM EVENTS ===
    if (ev.type === 'mochi_collected') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        const msg = ev.sacredNight
          ? `🌸✨ SACRED SPRING NIGHT! +${ev.food} food +${ev.xp} XP +${ev.coins}c (3×!)`
          : ev.crimeWaveBonus
            ? `🌸🚨 CRIME WAVE MOCHI! +${ev.food} food +${ev.xp} XP +${ev.coins}c (2×!)`
            : `🌸 CHERRY BLOSSOM MOCHI! +${ev.food} food +${ev.xp} XP +${ev.coins}c`;
        showAnnouncement(msg, '#ff99cc', 3000);
        effects.push({ type: 'text', x: ev.x, y: ev.y, text: `+${ev.xp} XP 🌸`, color: '#ff88b4', size: 14, time: performance.now(), duration: 2200 });
      } else {
        const bonusNote = ev.sacredNight ? ' (Sacred Night 3×!)' : ev.crimeWaveBonus ? ' (Crime Wave 2×!)' : '';
        addEventMessage(`🌸 ${ev.name} collected cherry blossom mochi!${bonusNote}`, '#ff99cc');
      }
    }
    if (ev.type === 'mochi_appeared') {
      addEventMessage('🌸 Cherry blossom mochi appeared in the Park! Find them for XP and coins.', '#ff99cc');
    }
    if (ev.type === 'mochi_crime_wave_hidden') {
      addEventMessage(`🌸🚨 Shopkeepers are hiding their mochi during the crime wave! (${ev.count} hidden)`, '#ff8866');
    }
    if (ev.type === 'mochi_crime_wave_restored') {
      showAnnouncement(`🌸 MOCHI RESTOCKED! Crime wave ended — ${ev.count} mochi reappear with 2× coins!`, '#ff99cc', 4000);
      addEventMessage(`🌸 Mochi shopkeepers return! ${ev.count} mochi back in the park — 2× coins while they last!`, '#ff99cc');
    }
    if (ev.type === 'hanami_bonus' && ev.birdId === myId) {
      effects.push({ type: 'text', x: ev.x, y: ev.y, text: '+5 XP 🌸', color: '#ffaac8', size: 11, time: performance.now(), duration: 1800 });
    }

    // === HANAMI LANTERN — Sacred Pond night event (spring only) ===
    if (ev.type === 'hanami_lantern_spawn') {
      window._hanamiLanternData = { x: ev.x, y: ev.y, baseY: ev.y, spawnedAt: performance.now(), expiresAt: performance.now() + (ev.expiresAt - Date.now()), floatPhase: Math.random() * Math.PI * 2, serverExpiresAt: ev.expiresAt };
      screenShake(6, 800);
      showAnnouncement('🏮 A HANAMI LANTERN rises from the Sacred Pond!\nFly to it and catch it for 200c + 120 XP + 🏮 badge!', '#ff9944', 6000);
      addEventMessage('🏮 A Hanami Lantern floats up from the Sacred Pond! First bird to catch it wins big!', '#ff9944');
    }
    if (ev.type === 'hanami_lantern_claimed') {
      window._hanamiLanternData = null;
      const isMe = ev.birdId === myId;
      if (isMe) {
        screenShake(10, 1200);
        showAnnouncement(`🏮 YOU CAUGHT THE HANAMI LANTERN!\n+${ev.coins}c +${ev.xp} XP + 🏮 badge!`, '#ff9944', 6000);
      } else {
        const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
        addEventMessage(`🏮 ${tag}${ev.name} caught the Hanami Lantern! (+${ev.coins}c +${ev.xp} XP + 🏮 badge)`, '#ff9944');
      }
    }
    if (ev.type === 'hanami_lantern_expired') {
      window._hanamiLanternData = null;
      addEventMessage('🏮 The Hanami Lantern drifted away unclaimed...', '#aa7744');
    }

    // === SAKURA VIEWING PARTY ===
    if (ev.type === 'sakura_viewing_party') {
      screenShake(8, 800);
      showAnnouncement(`🌸 SAKURA VIEWING PARTY!\n${ev.count} birds at the pond — +${ev.xp} XP +${ev.coins}c each!`, '#ff88c8', 5000);
      addEventMessage(`🌸 SAKURA VIEWING PARTY! ${ev.count} birds gathered at the Sacred Pond — all earn +${ev.xp} XP +${ev.coins}c!`, '#ff88c8');
    }

    // === UNDERGROUND SEWER EVENTS ===
    if (ev.type === 'sewer_enter') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('🐀 UNDERGROUND — No cops can follow you here!', '#44ff88', 3000);
      } else {
        addEventMessage('🚇 ' + ev.name + ' disappeared into the sewer!', '#44ff88');
      }
    }
    if (ev.type === 'sewer_exit') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('⬆ Resurfaced!', '#aaffcc', 1800);
      }
    }
    if (ev.type === 'sewer_rat_attack') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('🐀 RAT ATTACK! −' + ev.stolen + 'c', '#ff4444', 2000);
        effects.push({ type: 'screen_shake', intensity: 5, duration: 350, time: performance.now() });
        effects.push({ type: 'text', x: gameState && gameState.self ? gameState.self.x : ev.x, y: gameState && gameState.self ? gameState.self.y : ev.y, text: '−' + ev.stolen + 'c', color: '#ff4444', size: 13, time: performance.now(), duration: 1600 });
      }
    }
    if (ev.type === 'sewer_loot') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('💰 SEWER STASH! +' + ev.value + 'c', '#ffd700', 2500);
        effects.push({ type: 'text', x: ev.x, y: ev.y, text: '+' + ev.value + 'c 💰', color: '#ffd700', size: 14, time: performance.now(), duration: 2000 });
      } else {
        addEventMessage('🐀 ' + ev.name + ' found a sewer stash! +' + ev.value + 'c', '#ffd700');
      }
    }

    // === GODFATHER RACCOON EVENTS ===
    if (ev.type === 'godfather_spawn') {
      SoundEngine.bossSpawn();
      showAnnouncement('🎩 THE GODFATHER HAS ARRIVED — PAY YOUR TRIBUTE OR POOP HIM DOWN!', '#aa44ff', 6000);
      addEventMessage('🎩 The Godfather Raccoon slithered out of the shadows. 220 HP. Poop him to death — or lose your coins!', '#aa44ff');
      effects.push({ type: 'screen_shake', intensity: 7, duration: 600, time: now });
    }
    if (ev.type === 'godfather_tribute') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement(`🎩 TRIBUTE TAKEN: −${ev.taken}c`, '#ff6600', 2500);
        effects.push({ type: 'screen_shake', intensity: 5, duration: 350, time: now });
      }
      if (isMe || Math.random() < 0.3) {
        addEventMessage(`🎩 The Godfather shook down ${ev.birdName} for ${ev.taken}c. "Nice coins ya got there."`, '#ff8c44');
      }
      effects.push({ type: 'text', x: ev.x, y: ev.y - 25, text: '🎩 −' + ev.taken + 'c', color: '#ff6600', size: 14, time: performance.now(), duration: 2000 });
    }
    if (ev.type === 'godfather_hit') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 30, text: '−12 HP!', color: '#aa44ff', size: 13, time: performance.now(), duration: 1200 });
      }
    }
    if (ev.type === 'godfather_defeated') {
      SoundEngine.bossDefeated();
      effects.push({ type: 'screen_shake', intensity: 16, duration: 1000, time: now });
      showAnnouncement('🎩 THE GODFATHER IS DOWN! THE CITY IS FREE!', '#ffd700', 6000);
      const rewardStr = (ev.rewards || []).slice(0, 4).map(r => `${r.name} (+${r.coins}c +${r.xp}xp)`).join(', ');
      addEventMessage(`🎩 Godfather defeated! His tribute (${ev.tributeCoins}c) returned to the streets. Rewards: ${rewardStr || 'nobody nearby'}`, '#ffd700');
    }
    if (ev.type === 'godfather_escaped') {
      SoundEngine.bossSpawn();
      showAnnouncement('🎩 THE GODFATHER ESCAPED INTO THE NIGHT!', '#aa44ff', 5000);
      const victimStr = (ev.victims || []).map(v => `${v.name} (−${v.stolen}c)`).join(', ');
      if (victimStr) {
        addEventMessage(`🎩 The Godfather slipped away — robbing ${victimStr} on his way out. Next time...`, '#aa44ff');
      } else {
        addEventMessage('🎩 The Godfather melted back into the shadows. "I\'ll be back."', '#aa44ff');
      }
    }

    // === GOLDEN EGG SCRAMBLE EVENTS ===
    if (ev.type === 'egg_scramble_start') {
      SoundEngine.bossSpawn();
      showAnnouncement('🥚 GOLDEN EGG SCRAMBLE! 3 eggs dropped — grab & deliver to a 🪺 NEST!', '#ffd700', 6000);
      addEventMessage('🥚 3 golden eggs appeared across the city! Grab one and fly it to a 🪺 nest — but rivals can tackle you to steal it! No pooping while carrying!', '#ffd700');
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
    }
    if (ev.type === 'egg_grabbed') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('🥚 YOU GRABBED AN EGG! Fly to a 🪺 NEST — no pooping while carrying!', '#ffd700', 4000);
      }
      addEventMessage('🥚 ' + ev.birdName + ' grabbed a golden egg!', '#ffd700');
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, text: '🥚 GOT EGG!', color: '#ffd700', size: 16, time: performance.now(), duration: 2000 });
    }
    if (ev.type === 'egg_tackled') {
      const wasMe = ev.victimBirdId === myId;
      const didITackle = ev.tacklerBirdId === myId;
      if (wasMe) {
        showAnnouncement('💥 EGG STOLEN BY ' + ev.tacklerName.toUpperCase() + '!', '#ff4444', 3000);
        effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
      } else if (didITackle) {
        showAnnouncement('💥 YOU TACKLED ' + ev.victimName.toUpperCase() + ' — EGG SECURED!', '#ffd700', 3000);
      }
      addEventMessage('💥 ' + ev.tacklerName + ' tackled ' + ev.victimName + ' and stole the egg!', '#ff8800');
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, text: '💥 STOLEN!', color: '#ff8800', size: 16, time: performance.now(), duration: 2000 });
    }
    if (ev.type === 'egg_delivered') {
      const isMe = ev.birdId === myId;
      if (isMe) {
        showAnnouncement('🪺 EGG DELIVERED! +' + ev.xp + ' XP +' + ev.coins + 'c', '#4ade80', 5000);
        effects.push({ type: 'screen_shake', intensity: 10, duration: 600, time: now });
      }
      const medal = ev.deliveryNumber === 1 ? '🥇' : ev.deliveryNumber === 2 ? '🥈' : '🥉';
      addEventMessage(medal + ' ' + ev.birdName + ' delivered egg #' + ev.deliveryNumber + '! (+' + ev.xp + ' XP +' + ev.coins + 'c)', '#4ade80');
    }
    if (ev.type === 'egg_scramble_end') {
      if (ev.allDelivered) {
        addEventMessage('🥚 All ' + ev.total + ' golden eggs delivered! Next scramble in ~15 minutes.', '#ffd700');
      } else {
        addEventMessage('🥚 Egg scramble ended — ' + ev.delivered + '/' + ev.total + ' eggs delivered. Next scramble in ~15 minutes.', '#888888');
      }
    }

    // === TERRITORY EVENTS ===
    if (ev.type === 'territory_captured') {
      addEventMessage(`🏴 ${ev.teamName} seized ${ev.zoneName}!`, '#ffe066');
      showAnnouncement(`${ev.teamName} captured ${ev.zoneName}!`, '#ffe066', 4000);
    }
    if (ev.type === 'territory_contested') {
      addEventMessage(`⚔️ ${ev.zoneName} is under attack! (${ev.attackerName} vs ${ev.ownerName})`, '#ff8844');
    }
    if (ev.type === 'territory_lost') {
      addEventMessage(`💀 ${ev.ownerName} lost ${ev.zoneName}!`, '#ff4444');
      showAnnouncement(`${ev.zoneName} flipped to neutral!`, '#ff6666', 3500);
    }
    if (ev.type === 'territory_reward') {
      // Subtle — just a small event feed note (only shown occasionally to avoid spam)
      if (Math.random() < 0.3) {
        addEventMessage(`💰 ${ev.teamName} collecting tribute from ${ev.zoneName}`, '#aaddff');
      }
    }

    // === GRAFFITI EVENTS ===
    if (ev.type === 'graffiti_tagged') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1500,
          text: '🎨 TAGGED! +' + ev.xp + 'XP', color: '#ff88ff', size: 16 });
      }
      addEventMessage('🎨 ' + ev.ownerName + ' tagged ' + ev.buildingName, '#dd88ff');
    }
    if (ev.type === 'graffiti_overtag') {
      addEventMessage('🎨 ' + ev.newOwner + ' OVER-TAGGED ' + ev.buildingName + ' (was ' + ev.oldOwner + '!)', '#ff4488');
      effects.push({ type: 'text', x: camera.x, y: camera.y - 40, time: now, duration: 2000,
        text: '🎨 TURF WAR!', color: '#ff4488', size: 18 });
    }
    if (ev.type === 'graffiti_domination') {
      showAnnouncement('🎨 ' + ev.name + ' OWNS THE STREETS! (+100c)', '#ff44ff', 5000);
      addEventMessage('🎨🔥 ' + ev.name + ' tagged 5 buildings — STREET DOMINATION!', '#ff44ff');
      effects.push({ type: 'screen_shake', intensity: 10, duration: 800, time: now });
    }

    // === GANG MURAL EVENTS ===
    if (ev.type === 'mural_painted') {
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      const overtakeMsg = ev.isOvertake
        ? ` — OVERTAKING [${ev.oldGangTag}] ${ev.oldGangName}!`
        : '';
      showAnnouncement(
        `🎨 GANG MURAL COMPLETE!\n${tag}${ev.gangName}\npainted ${ev.zoneName}${overtakeMsg}`,
        ev.gangColor || '#cc88ff', 6000
      );
      addEventMessage(
        `🎨 [${ev.gangTag}] ${ev.gangName} painted a MURAL at ${ev.zoneName}!${overtakeMsg}`,
        ev.gangColor || '#cc88ff'
      );
      effects.push({ type: 'screen_shake', intensity: 12, duration: 700, time: now });
      // Spray burst particles at self position
      if (gameState.self) {
        for (let p = 0; p < 24; p++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 40 + Math.random() * 80;
          effects.push({ type: 'particle', x: gameState.self.x, y: gameState.self.y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            color: ev.gangColor || '#cc88ff', time: now,
            duration: 700 + Math.random() * 500, radius: 4 + Math.random() * 4 });
        }
      }
    }
    if (ev.type === 'mural_reward') {
      if (ev.birdId === myId) {
        const self = gameState.self;
        effects.push({ type: 'text', x: self ? self.x : camera.x, y: self ? self.y - 30 : camera.y - 30,
          time: now, duration: 2000, text: `🎨 +${ev.xp}XP +${ev.coins}c MURAL!`, color: '#cc88ff', size: 17 });
      }
    }
    if (ev.type === 'mural_expired') {
      addEventMessage(`🎨 The ${ev.zoneName} mural has faded...`, '#888');
    }

    // === RADIO TOWER EVENTS ===
    if (ev.type === 'tower_captured') {
      const msg = ev.prevOwnerName
        ? '📡 ' + ev.birdName + ' SEIZED the Radio Tower from ' + ev.prevOwnerName + '!'
        : '📡 ' + ev.birdName + ' captured the Radio Tower!';
      showAnnouncement('📡 TOWER CAPTURED — ' + ev.birdName, ev.ownerColor || '#44aaff', 4000);
      addEventMessage(msg, ev.ownerColor || '#44aaff');
      effects.push({ type: 'screen_shake', intensity: 6, duration: 500, time: now });
      if (ev.birdId === myId) {
        showAnnouncement('📡 YOU OWN THE RADIO TOWER! Press [T] to broadcast!', '#44ffff', 5000);
      }
    }
    if (ev.type === 'tower_expired') {
      addEventMessage('📡 The Radio Tower signal cut out — ' + (ev.ownerName || 'nobody') + '\'s broadcast has ended.', '#888888');
    }
    if (ev.type === 'tower_broadcast' && !ev.isCrimeWaveForced) {
      // Big overlay-style announcement for broadcasts (skip if this is the crime wave auto-broadcast — handled separately above)
      showAnnouncement('📻 PIGEON RADIO: ' + ev.message, ev.ownerColor || '#44aaff', 6000);
      addEventMessage('📻 ' + ev.message, ev.ownerColor || '#44aaff');
      if (ev.broadcastType === 'signal_boost') {
        effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      }
    }
    if (ev.type === 'signal_boost_ended') {
      addEventMessage('📡 Signal Boost has faded.', '#888888');
    }

    // === TERRITORY EVENTS ===
    if (ev.type === 'territory_captured') {
      showAnnouncement('🏴 ' + ev.teamName + ' seized ' + ev.zoneName + '!', '#ffc832', 3000);
      addEventMessage('🏴 ' + ev.teamName + ' claimed ' + ev.zoneName, '#ffc832');
    }
    if (ev.type === 'territory_contested') {
      addEventMessage('⚔ ' + ev.attackerName + ' attacks ' + ev.zoneName + ' (' + ev.ownerName + ')', '#ff8800');
    }
    if (ev.type === 'territory_lost') {
      showAnnouncement('⚔ ' + ev.ownerName + ' LOST ' + ev.zoneName + '!', '#ff4444', 3000);
      addEventMessage('⚔ ' + ev.ownerName + ' lost ' + ev.zoneName + ' to ' + ev.attackerName, '#ff4444');
    }

    // === CROW CARTEL RAID EVENTS ===
    if (ev.type === 'cartel_raid_start') {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      showAnnouncement(`🐦‍⬛ CROW CARTEL RAIDING ${ev.zoneName.toUpperCase()}!\nPoop them out to defend your turf!`, '#cc22cc', 5500);
      addEventMessage(`🐦‍⬛ The Crow Cartel is assaulting ${ev.zoneName}${ev.ownerName ? ' (' + ev.ownerName + ')' : ''}!`, '#cc22cc');
    }
    if (ev.type === 'cartel_crow_hit') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1200,
          text: `-${ev.dmg}HP`, color: '#ff4444', size: 14 });
      }
    }
    if (ev.type === 'cartel_thug_killed') {
      addEventMessage(`💀 ${ev.birdName ? (ev.gangTag ? '[' + ev.gangTag + '] ' : '') + ev.birdName + ' took down' : 'A Crow Cartel thug fell'} a Cartel thug! (+${ev.killXp}XP +${ev.killCoins}c)`, '#ff6644');
      if (ev.birdId === myId) {
        effects.push({ type: 'screen_shake', intensity: 5, duration: 350, time: now });
        showAnnouncement(`💀 CROW THUG DOWN! +${ev.killXp}XP +${ev.killCoins}c`, '#ff6644', 2500);
      }
    }
    if (ev.type === 'cartel_don_killed') {
      effects.push({ type: 'screen_shake', intensity: 16, duration: 1000, time: now });
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      showAnnouncement(`🐦‍⬛ DON CORVINO DEFEATED!\n${tag}${ev.birdId === myId ? 'YOU' : ev.birdName} took him down! +${ev.killXp}XP +${ev.killCoins}c`, '#ff44ff', 7000);
      addEventMessage(`🐦‍⬛🔥 ${tag}${ev.birdName} SLEW DON CORVINO at ${ev.zoneName}! LEGEND. (+${ev.killXp}XP +${ev.killCoins}c)`, '#ff44ff');
    }
    if (ev.type === 'cartel_zone_captured') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 800, time: now });
      showAnnouncement(`🐦‍⬛ CROW CARTEL SEIZED ${ev.zoneName.toUpperCase()}!\nThey're holding it — keep pooping!`, '#880088', 5000);
      addEventMessage(`🐦‍⬛ Crow Cartel captured ${ev.zoneName}! (had: ${ev.prevOwner || 'nobody'})`, '#880088');
    }
    if (ev.type === 'cartel_raid_repelled') {
      effects.push({ type: 'screen_shake', intensity: 12, duration: 900, time: now });
      showAnnouncement(`🏆 RAID REPELLED! ${ev.zoneName} held!`, '#44ff88', 5000);
      addEventMessage(`🏆 The Crow Cartel was driven from ${ev.zoneName}! +120XP +80c to defenders`, '#44ff88');
    }
    if (ev.type === 'cartel_defender_reward') {
      if (ev.birdId === myId) {
        showAnnouncement(`🏆 RAID REPELLED! +${ev.xp}XP +${ev.coins}c`, '#44ff88', 3000);
        effects.push({ type: 'text', x: camera.x, y: camera.y - 60, time: now, duration: 2000,
          text: '+' + ev.xp + 'XP +' + ev.coins + 'c', color: '#44ff88', size: 18 });
      }
    }
    if (ev.type === 'cartel_retreated') {
      addEventMessage(`🐦‍⬛ The Crow Cartel retreated from ${ev.zoneName}.`, '#aa66aa');
    }

    // === SEAGULL INVASION ===
    if (ev.type === 'seagull_invasion_start') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      showAnnouncement(`🐦 SEAGULL INVASION! ${ev.count} seagulls swooping in from the coast!\nPOOP THEM BEFORE THEY STEAL ALL THE FOOD!`, '#44aaff', 6000);
      addEventMessage(`🐦 SEAGULL INVASION! ${ev.count} seagulls are raiding the city's food supply!`, '#44aaff');
    }
    if (ev.type === 'seagull_stole_food') {
      addEventMessage(`🐦 A seagull snatched some food! Poop them to get it back!`, '#ff8844');
    }
    if (ev.type === 'seagull_hit') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1000,
          text: 'HIT! 1/2', color: '#44aaff', size: 13 });
      }
    }
    if (ev.type === 'seagull_killed') {
      addEventMessage(`💀 ${ev.birdName ? (ev.gangTag ? '[' + ev.gangTag + '] ' : '') + ev.birdName + ' downed' : 'A'} a seagull! (+${ev.killXp}XP +${ev.killCoins}c)`, '#44aaff');
      if (ev.birdId === myId) {
        effects.push({ type: 'screen_shake', intensity: 4, duration: 250, time: now });
        showAnnouncement(`💀 SEAGULL DOWN! +${ev.killXp}XP +${ev.killCoins}c`, '#44aaff', 2000);
      }
    }
    if (ev.type === 'seagull_invasion_repelled') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 900, time: now });
      showAnnouncement(`🏆 SEAGULLS REPELLED! The city's food supply is safe!\n+150XP +60c for ALL birds!`, '#44ff88', 6000);
      addEventMessage(`🏆 SEAGULL INVASION REPELLED! All birds earn +150XP +60c!`, '#44ff88');
    }
    if (ev.type === 'seagull_invasion_repelled_reward') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: camera.x, y: camera.y - 50, time: now, duration: 2500,
          text: '+150XP +60c DEFENSE BONUS', color: '#44ff88', size: 16 });
      }
    }
    if (ev.type === 'seagull_invasion_fled') {
      const msg = ev.carrierCount > 0
        ? `🐦 The seagulls got away with ${ev.carrierCount} food item${ev.carrierCount > 1 ? 's' : ''}! Drive them away faster next time.`
        : '🐦 The seagulls retreated without stealing much.';
      addEventMessage(msg, '#ff8844');
    }

    // === GREAT MIGRATION EVENTS ===
    if (ev.type === 'migration_start') {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      window._migrationArrowDir = ev.entryEdge; // track for direction arrow
      showAnnouncement(
        `🦅 THE GREAT MIGRATION!\n${ev.count} wild birds flying from the ${ev.label}!\nFly near them for +30% speed · Poop the ALPHA for 400XP!`,
        '#f6ad55', 8000
      );
      addEventMessage(`🦅 GREAT MIGRATION entering from the ${ev.label}! Intercept the Alpha for big rewards!`, '#f6ad55');
    }
    if (ev.type === 'migration_joined') {
      if (ev.birdId === myId) {
        showAnnouncement('🦅 RIDING THE MIGRATION! +30% speed boost!', '#f6ad55', 2500);
      }
    }
    if (ev.type === 'migration_alpha_hit') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 30, time: now, duration: 1000,
          text: `−${ev.dmg}HP`, color: '#f6ad55', size: 15 });
      }
      // Show HP bar flash (handled by sprite itself)
    }
    if (ev.type === 'migration_alpha_defeated') {
      effects.push({ type: 'screen_shake', intensity: 18, duration: 1000, time: now });
      window._migrationArrowDir = null;
      const killerTag = ev.killerGangTag ? `[${ev.killerGangTag}] ` : '';
      const killerStr = ev.killerName ? `${killerTag}${ev.killerName} dealt the killing blow!` : 'The Alpha has fallen!';
      showAnnouncement(`🏆 ALPHA LEADER DOWN!\n${killerStr}\nContributors rewarded!`, '#ffd700', 7000);
      addEventMessage(`🦅 MIGRATION ALPHA DEFEATED! ${killerStr}`, '#ffd700');
    }
    if (ev.type === 'migration_reward') {
      if (ev.birdId === myId) {
        const tag = ev.isKiller ? '🏆 KILLING BLOW! ' : '⚔️ CONTRIBUTOR! ';
        showAnnouncement(`${tag}+${ev.xp}XP +${ev.coins}c`, '#ffd700', 3000);
        effects.push({ type: 'text', x: gameState.self ? gameState.self.x : 0, y: gameState.self ? gameState.self.y - 40 : 0,
          time: now, duration: 2500, text: `+${ev.xp}XP +${ev.coins}c`, color: '#ffd700', size: 16 });
      }
    }
    if (ev.type === 'migration_escaped') {
      window._migrationArrowDir = null;
      addEventMessage(`🦅 The migration flock crossed the city safely. Alpha escaped!`, '#aaaaaa');
    }

    // 🦅 Feather of the Alpha — rare drop on killing blow
    if (ev.type === 'alpha_feather_drop') {
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      if (ev.birdId === myId) {
        showAnnouncement(`🦅 FEATHER OF THE ALPHA!\nThe fallen leader's feather is yours — worn forever!`, '#ffcc55', 8000);
      }
      addEventMessage(`🦅 ${tag}${ev.birdName} earned the FEATHER OF THE ALPHA — a legendary trophy!`, '#ffcc55');
    }

    // 🦅⚔️ Gang War × Migration — +50% XP synergy
    if (ev.type === 'migration_gang_war_bonus') {
      if (ev.birdId === myId) {
        showAnnouncement(`🦅⚔️ GANG WAR BONUS!\n+${ev.xp}XP extra — gang war makes the migration dangerous!`, '#ff6644', 3500);
        effects.push({ type: 'text', x: gameState.self ? gameState.self.x : 0, y: gameState.self ? gameState.self.y - 50 : 0,
          time: now, duration: 2000, text: `⚔️ WAR BONUS +${ev.xp}XP`, color: '#ff8866', size: 14 });
      }
    }
    if (ev.type === 'migration_gang_war_synergy') {
      addEventMessage(`🦅⚔️ GANG WAR × MIGRATION! ${ev.count} warring birds earn +50% XP for slaying the Alpha!`, '#ff8866');
    }

    // ⚡🦅 Thunder Dome × Migration — alpha takes 2× damage inside the dome
    if (ev.type === 'migration_dome_double') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      if (ev.birdId === myId) {
        showAnnouncement(`⚡🦅 DOME SYNERGY!\nAlpha is inside the Thunder Dome — DOUBLE DAMAGE on every hit!`, '#66aaff', 5000);
      }
      addEventMessage(`⚡🦅 ${ev.birdName} discovers the synergy — Alpha takes 2× damage inside the Thunder Dome!`, '#66aaff');
    }

    // === CITY VAULT TRUCK EVENTS ===
    if (ev.type === 'vault_truck_spawn') {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      window._vaultTruckDir = { x: ev.x, y: ev.y }; // for direction arrow
      showAnnouncement(`💼 CITY VAULT TRUCK SPOTTED!\n100 poop hits to CRACK IT OPEN — 1500c jackpot!\n3 minutes before it escapes — START POOPING!`, '#ffd700', 8000);
      addEventMessage(`💼 CITY VAULT TRUCK rolling through town! Poop it 100 times for a 1500c jackpot!`, '#ffd700');
    }
    if (ev.type === 'vault_truck_hit') {
      // Personal floating text on each hit
      if (ev.birdId === myId) {
        const hpPct = Math.round(ev.hp / ev.maxHp * 100);
        effects.push({ type: 'text', x: ev.x, y: ev.y - 30, time: now, duration: 900,
          text: `−${ev.dmg} HP (${hpPct}%)`, color: '#ffd700', size: 12 });
      }
    }
    if (ev.type === 'vault_truck_milestone') {
      effects.push({ type: 'screen_shake', intensity: ev.pct === 10 ? 10 : 6, duration: 400, time: now });
      const color = ev.pct <= 10 ? '#ff4400' : ev.pct <= 25 ? '#ff8800' : '#ffd700';
      showAnnouncement(`💼 ${ev.message}`, color, 4000);
      addEventMessage(`💼 ${ev.message}`, color);
    }
    if (ev.type === 'vault_truck_cops') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      showAnnouncement(`🚨 ${ev.message}`, '#ff4444', 4000);
      addEventMessage(`🚨 ${ev.message}`, '#ff4444');
    }
    if (ev.type === 'vault_truck_cracked') {
      effects.push({ type: 'screen_shake', intensity: 20, duration: 1200, time: now });
      window._vaultTruckDir = null;
      // Coin shower particles
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        effects.push({ type: 'text', x: ev.x + Math.cos(angle) * (30 + Math.random() * 60),
          y: ev.y + Math.sin(angle) * (30 + Math.random() * 60), time: now + Math.random() * 500,
          duration: 1800, text: '💼', color: '#ffd700', size: 18 + Math.random() * 10 });
      }
      // Personal reward announcement
      if (ev.rewards) {
        const myReward = ev.rewards.find(r => r.birdId === myId);
        if (myReward) {
          showAnnouncement(
            `💼💥 VAULT TRUCK CRACKED!\n+${myReward.coins}c +${myReward.xp}XP\n(${myReward.hits} poop hits = ${Math.round(myReward.hits / Math.max(1, ev.rewards.reduce((s,r)=>s+r.hits,0)) * 100)}% share)`,
            '#ffd700', 7000
          );
          effects.push({ type: 'text', x: gameState.self ? gameState.self.x : 0,
            y: gameState.self ? gameState.self.y - 60 : 0, time: now, duration: 3000,
            text: `+${myReward.coins}c +${myReward.xp}XP`, color: '#ffd700', size: 20 });
        } else {
          showAnnouncement(`💼💥 VAULT TRUCK CRACKED!\n${ev.contributorCount} birds shared the jackpot!`, '#ffd700', 5000);
        }
      }
      addEventMessage(`💼💥 VAULT TRUCK CRACKED! ${ev.contributorCount} birds split 1500c!`, '#ffd700');
      // Reward callouts for all contributors
      if (ev.rewards) {
        for (const r of ev.rewards.slice(0, 3)) {
          addEventMessage(`  💼 ${r.name}: +${r.coins}c +${r.xp}XP (${r.hits} hits)`, '#ffdd44');
        }
      }
    }
    if (ev.type === 'vault_truck_escaped') {
      window._vaultTruckDir = null;
      addEventMessage(`💼 The Vault Truck escaped! The city failed to crack it in time.`, '#888888');
    }

    // === PIGEON COUPE EVENTS (Session 101) ===
    if (ev.type === 'coupe_spawned') {
      window._coupeDirTarget = { x: ev.x, y: ev.y };
      showAnnouncement(`🚗 PIGEON COUPE APPEARED!\nFly to it and press [E] to GET IN and ride in style!\nCarjack it 3× to trigger a COIN EXPLOSION!`, '#ff6600', 7000);
      addEventMessage(`🚗 The Pigeon Coupe just appeared somewhere in the city!`, '#ff6600');
    }
    if (ev.type === 'coupe_entered') {
      if (ev.birdId === myId) {
        showAnnouncement(`🚗 YOU'RE IN THE PIGEON COUPE!\n220px/s speed — press [E] to exit.\nCarjacks remaining: ${ev.maxCarjacks - (gameState.pigeonCoupe ? gameState.pigeonCoupe.carjacks : 0)}`, '#ff6600', 4000);
      } else {
        addEventMessage(`🚗 ${ev.gangTag ? `[${ev.gangTag}] ` : ''}${ev.birdName} got in the Pigeon Coupe!`, '#ff6600');
      }
    }
    if (ev.type === 'coupe_carjacked') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      if (ev.birdId === myId) {
        showAnnouncement(`🚨 YOU CARJACKED THE PIGEON COUPE!\n+80 XP +30c — ride hard! (${ev.carjacks}/3 carjacks)`, '#ff4400', 4000);
      } else if (ev.prevDriverName === (gameState.self && gameState.self.name)) {
        showAnnouncement(`🚨 YOU GOT CARJACKED by ${ev.birdName}! They stole the Coupe!`, '#ff2200', 4000);
      }
      addEventMessage(`🚨 ${ev.message}`, '#ff4400');
    }
    if (ev.type === 'coupe_exploded') {
      window._coupeDirTarget = null;
      effects.push({ type: 'screen_shake', intensity: 18, duration: 1000, time: now });
      // Coin shower particles
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        effects.push({ type: 'text', x: ev.x + Math.cos(angle) * (30 + Math.random() * 80),
          y: ev.y + Math.sin(angle) * (30 + Math.random() * 80), time: now + Math.random() * 600,
          duration: 1800, text: '💰', color: '#ffd700', size: 18 + Math.random() * 12 });
      }
      showAnnouncement(`💥🚗 PIGEON COUPE EXPLODED!\nCoins scattered to ${ev.nearbyCount} nearby birds!`, '#ff6600', 5000);
      addEventMessage(`💥 ${ev.message}`, '#ff6600');
    }
    if (ev.type === 'coupe_explosion_reward') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: gameState.self ? gameState.self.x : 0,
          y: gameState.self ? gameState.self.y - 50 : 0, time: now, duration: 2000,
          text: `💰 +${ev.coins}c COUPE LOOT!`, color: '#ffd700', size: 16 });
      }
    }

    // === BIRDNAPPER VAN EVENTS ===
    if (ev.type === 'van_spawned') {
      window._birdnapperVanDir = { x: ev.x, y: ev.y };
      showAnnouncement(`🚐 BIRDNAPPER VAN SPOTTED!\nA suspicious black van is prowling the city.\nStay alert — it HUNTS birds and abducts them!`, '#880099', 7000);
      addEventMessage(`🚐 A suspicious black van is prowling Bird City...`, '#880099');
    }
    if (ev.type === 'van_hunting') {
      if (ev.targetId === myId) {
        effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
        showAnnouncement(`🚐 THE VAN IS HUNTING YOU!\nFLY AWAY before it catches you!\nOthers: poop the van to rescue any captive!`, '#cc00ff', 5000);
      } else {
        addEventMessage(`🚐 The Birdnapper Van is hunting ${ev.targetName}!`, '#cc00ff');
      }
    }
    if (ev.type === 'van_warning') {
      if (ev.targetId === myId) {
        effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
        showAnnouncement(`🚐⚠️ VAN CLOSING IN — FLEE NOW!\nFly AWAY or it will grab you in seconds!`, '#ff00ff', 3000);
      }
    }
    if (ev.type === 'van_abducted') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 800, time: now });
      if (ev.captiveId === myId) {
        showAnnouncement(`🚐💀 YOU'VE BEEN ABDUCTED!\nThe van is escaping with you inside!\nSCREAM for help — others must poop the van ${ev.maxPoopHits}x to free you!`, '#ff0000', 8000);
      } else {
        showAnnouncement(`🚐💀 ${ev.captiveName} has been ABDUCTED!\nPOOP the van ${ev.maxPoopHits}× to rescue them!`, '#ff4400', 6000);
        addEventMessage(`🚐 ${ev.captiveName} abducted by the Birdnapper Van! Poop it to rescue!`, '#ff4400');
      }
    }
    if (ev.type === 'van_hit') {
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1500,
        text: `💥 ${ev.hits}/${ev.maxHits}`, color: '#00ffff', size: 13 });
    }
    if (ev.type === 'van_drain') {
      if (ev.captiveId === myId) {
        effects.push({ type: 'text', x: gameState.self ? gameState.self.x : 0,
          y: gameState.self ? gameState.self.y - 40 : 0, time: now, duration: 1800,
          text: `🚐 −${ev.drainedCoins}c STOLEN!`, color: '#ff4444', size: 14 });
      }
    }
    if (ev.type === 'van_rescued') {
      window._birdnapperVanDir = null;
      effects.push({ type: 'screen_shake', intensity: 12, duration: 700, time: now });
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        effects.push({ type: 'text', x: ev.x + Math.cos(ang) * (20 + Math.random() * 50),
          y: ev.y + Math.sin(ang) * (20 + Math.random() * 50), time: now + Math.random() * 400,
          duration: 2000, text: '🐦', color: '#00ff88', size: 16 });
      }
      if (ev.captiveId === myId) {
        showAnnouncement(`🐦✅ YOU'VE BEEN RESCUED!\nHeroic birds pooped the van to free you!\nWatch out — the city is dangerous!`, '#00ff88', 6000);
      } else {
        showAnnouncement(`🐦✅ ${ev.captiveName} HAS BEEN RESCUED!\nHeroic birds pooped the van free!`, '#00ff88', 4000);
      }
      addEventMessage(`🐦 ${ev.captiveName} rescued from the Birdnapper Van! ${ev.rescuerName} scored the final hit!`, '#00ff88');
    }
    if (ev.type === 'van_rescue_reward') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: gameState.self ? gameState.self.x : 0,
          y: gameState.self ? gameState.self.y - 50 : 0, time: now, duration: 2200,
          text: `🐦 +${ev.xp}XP +${ev.coins}c RESCUE!`, color: '#00ff88', size: 15 });
      }
    }
    if (ev.type === 'van_escaped_with_captive') {
      window._birdnapperVanDir = null;
      effects.push({ type: 'screen_shake', intensity: 10, duration: 600, time: now });
      if (ev.captiveId === myId) {
        showAnnouncement(`🚐💀 THE VAN ESCAPED WITH YOU!\nYou've been dropped at the city center — look for the daily challenge progress!`, '#ff2200', 6000);
      } else {
        showAnnouncement(`🚐 The Birdnapper Van ESCAPED with ${ev.captiveName}!\n${ev.captiveName} loses ${ev.coinsLost}c and is dropped at city center!`, '#ff4400', 5000);
      }
      addEventMessage(`🚐 Van escaped! ${ev.captiveName} lost ${ev.coinsLost}c and was dropped at city center.`, '#ff4400');
    }
    if (ev.type === 'van_escaped_empty') {
      window._birdnapperVanDir = null;
      addEventMessage(`🚐 The Birdnapper Van slipped away without a catch...`, '#888888');
    }
    if (ev.type === 'van_hunt_failed') {
      if (ev.targetId === myId) {
        addEventMessage(`🚐 The van gave up hunting you — you outran it!`, '#aaaaaa');
        if (gameState.self) {
          effects.push({ type: 'text', x: gameState.self.x, y: gameState.self.y - 40, time: now,
            duration: 2000, text: '🚐 ESCAPED!', color: '#00ff88', size: 14 });
        }
      }
    }
    if (ev.type === 'van_despawned') {
      window._birdnapperVanDir = null;
    }

    // === CITY ELECTION EVENTS ===
    if (ev.type === 'election_started') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 700, time: now });
      const opts = ev.options.map(o => `${o.emoji} ${o.name}`).join(' · ');
      showAnnouncement(
        `🗳️ CITY ELECTION!\nFly to City Hall and press [V] to vote!\nOptions: ${opts}\nVoting closes in ${Math.round(ev.duration / 1000)}s`,
        '#44ee88', 8000
      );
      addEventMessage(`🗳️ CITY ELECTION OPEN! Vote at City Hall [V] — ${ev.options.length} policies on the ballot!`, '#44ee88');
      updateElectionHudPill();
    }
    if (ev.type === 'election_vote_cast') {
      addEventMessage(`🗳️ ${ev.voterName} voted in the City Election`, '#66cc88');
      updateElectionHudPill();
    }
    if (ev.type === 'election_result') {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 800, time: now });
      const pol = ev.policy || {};
      const durationMs = ev.policyEndsAt ? (ev.policyEndsAt - now) : 480000;
      const mins = Math.floor(durationMs / 60000);
      showAnnouncement(
        `🗳️ ELECTION RESULT!\nThe city voted for: ${pol.emoji || ''} ${pol.name || ev.winningId}\n${pol.desc || ''}\nActive for ${mins} minutes!`,
        '#44ee88', 7000
      );
      const totalV = ev.totalVotes || 0;
      addEventMessage(`🗳️ ELECTION: ${pol.emoji || ''} ${pol.name || ev.winningId} wins! (${totalV} total votes) · ${ev.voteBreakdown || ''}`, '#44ee88');
      updateElectionHudPill();
    }
    if (ev.type === 'election_personal_result') {
      if (ev.birdId === myId && ev.myVote) {
        addEventMessage(ev.won
          ? `🗳️ ✅ Your vote for ${ev.myVote} WON the election!`
          : `🗳️ Your pick didn't win this time — next election soon!`, '#88ccaa');
      }
    }
    if (ev.type === 'election_policy_expired') {
      showAnnouncement(`🗳️ ${ev.emoji || ''} ${ev.policyName || ev.policy || ''} policy has EXPIRED\nThe city returns to normal.`, '#aaaaaa', 4000);
      addEventMessage(`🗳️ Election policy ${ev.emoji || ''} ${ev.policyName || ev.policy || ''} has expired.`, '#888888');
      updateElectionHudPill();
    }
    if (ev.type === 'election_vote_fail') {
      if (ev.birdId === myId) {
        addEventMessage(`🗳️ Vote failed: ${ev.reason}`, '#ff8844');
      }
    }

    // Cross-system synergy messages
    if (ev.type === 'migration_race_synergy') {
      if (ev.birdId === myId) {
        showAnnouncement(`🦅⚡ SLIPSTREAM + BOOST GATE!\nMigration slipstream stacks with race boost — LUDICROUS SPEED!`, '#f6ad55', 3500);
      }
      addEventMessage(`🦅⚡ ${ev.birdName} stacks migration slipstream AND race boost gate — supercharge!`, '#f6ad55');
    }
    // === PIGEON STAMPEDE EVENTS ===
    if (ev.type === 'stampede_start') {
      effects.push({ type: 'screen_shake', intensity: 12, duration: 800, time: now });
      showAnnouncement(
        `🐦 PIGEON STAMPEDE!\n${ev.count} panicked pigeons charging from the ${ev.edgeLabel}!\nFIRE INTO THE HERD — top scorer earns 300XP + 200c!`,
        '#e09040', 7000
      );
      addEventMessage(`🐦 PIGEON STAMPEDE! ${ev.count} birds charging the city from the ${ev.edgeLabel}!`, '#e09040');
    }
    if (ev.type === 'stampede_bird_hit') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 700,
          text: '+HIT', color: '#e09040', size: 12 });
      }
    }
    if (ev.type === 'stampede_bird_down') {
      // Small feather burst at kill position
      effects.push({ type: 'text', x: ev.x, y: ev.y - 15, time: now, duration: 900,
        text: '💨', color: '#c08040', size: 14 });
    }
    if (ev.type === 'stampede_repelled') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 900, time: now });
      showAnnouncement(
        `✅ STAMPEDE REPELLED!\nAll ${ev.birdsCleared} panicked pigeons downed!\n+75XP +30c for EVERYONE!`,
        '#44dd88', 6000
      );
      addEventMessage(`✅ PIGEON STAMPEDE REPELLED! All birds downed — +75XP +30c for every online bird!`, '#44dd88');
    }
    if (ev.type === 'stampede_end') {
      if (ev.champName) {
        const tag = ev.champGangTag ? `[${ev.champGangTag}] ` : '';
        effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
        showAnnouncement(
          `🐦 STAMPEDE OVER!\n🏆 STAMPEDE KING: ${tag}${ev.champName}\n${ev.champHits} hits — +300XP +200c!`,
          '#e09040', 6000
        );
        addEventMessage(`🐦 Stampede ended! KING: ${tag}${ev.champName} (${ev.champHits} hits)!`, '#e09040');
      } else {
        addEventMessage(`🐦 The pigeon stampede cleared the city.`, '#aaaaaa');
      }
    }

    if (ev.type === 'siege_cartel_backup') {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      showAnnouncement(`⚔️🐦‍⬛ CROW CARTEL BACKUP!\nDon Corvino sends 3 thugs to [${ev.attackingGangTag}]'s siege!\nThe nest won't hold!`, '#aa44ff', 6000);
      addEventMessage(`⚔️🐦‍⬛ DON CORVINO sends Cartel backup to the [${ev.attackingGangTag}] vs [${ev.defendingGangTag}] siege!`, '#aa44ff');
    }
    if (ev.type === 'siege_mural_hit') {
      effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
      addEventMessage(`🎨⚔️ [${ev.attackingGangTag}] seized [${ev.defendingGangTag}]'s mural! Siege pool −${ev.dmg} HP (${ev.hpPool}/${ev.hpMaxPool} left)`, '#ff8844');
    }
    if (ev.type === 'siege_dome_synergy') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      showAnnouncement(`⚡⚔️ THUNDER DOME × SIEGE!\nAttacks inside the dome deal 2× siege damage!`, '#66aaff', 5000);
      addEventMessage(`⚡⚔️ [${ev.attackingGangTag}] inside the Thunder Dome — 2× siege damage!`, '#66aaff');
    }

    // === MURAL VANDAL EVENTS ===
    if (ev.type === 'vandal_appeared') {
      effects.push({ type: 'screen_shake', intensity: 7, duration: 500, time: now });
      showAnnouncement(`🎨💀 VANDAL CROW SPOTTED!\nHeading for [${ev.gangTag}] ${ev.gangName}'s mural at ${ev.targetZoneName}!\nPOOP HIM 3× TO SCARE HIM OFF!`, '#cc44ff', 8000);
      addEventMessage(`🎨💀 A Vandal Crow is heading for [${ev.gangTag}]'s mural at ${ev.targetZoneName}! Poop him away!`, '#cc44ff');
    }
    if (ev.type === 'vandal_start_vandalizing') {
      showAnnouncement(`🎨💀 VANDAL REACHED THE MURAL — VANDALIZING!\nHe has ~40 seconds to destroy it!\nFly to ${ev.targetZoneName} and POOP HIM!`, '#ff4400', 6000);
      addEventMessage(`🎨 Vandal Crow is actively vandalizing the mural at ${ev.targetZoneName}! Stop him!`, '#ff4400');
    }
    if (ev.type === 'vandal_hit') {
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1200,
        text: `HIT! ${ev.hitCount}/${ev.hitsRequired}`, color: '#ff6600', size: 14 });
      if (ev.birdId === myId) {
        showAnnouncement(`💥 HIT THE VANDAL! ${ev.hitCount}/${ev.hitsRequired} — ${ev.hitsRequired - ev.hitCount} more to scare him off!`, '#ff6600', 2000);
      }
      addEventMessage(`💥 ${ev.birdName} hit the Vandal Crow! (${ev.hitCount}/${ev.hitsRequired})`, '#ff6600');
    }
    if (ev.type === 'vandal_scared') {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      showAnnouncement(`🏃 VANDAL SCARED OFF by ${ev.gangTag ? '[' + ev.gangTag + '] ' : ''}${ev.birdName}!\n+150XP +80c — The mural at ${ev.targetZoneName} is SAFE!`, '#44ff88', 6000);
      addEventMessage(`🎨✅ ${ev.birdName} scared off the Vandal Crow! ${ev.targetZoneName} mural saved! (+150XP +80c)`, '#44ff88');
    }
    if (ev.type === 'vandal_mural_destroyed') {
      effects.push({ type: 'screen_shake', intensity: 12, duration: 800, time: now });
      showAnnouncement(`💀🎨 MURAL DESTROYED!\nThe Vandal Crow ruined [${ev.gangTag}] ${ev.gangName}'s art at ${ev.targetZoneName}!\nPaint a new one to reclaim the zone!`, '#ff2222', 8000);
      addEventMessage(`💀 VANDAL CROW DESTROYED the ${ev.gangTag} mural at ${ev.targetZoneName}! Gang art is gone!`, '#ff3333');
    }
    if (ev.type === 'vandal_escaped') {
      addEventMessage(`🎨 The Vandal Crow slipped away. The mural survived... this time.`, '#aaaaaa');
    }
    if (ev.type === 'crime_wave_mural_boost') {
      showAnnouncement(`🚨🎨 CRIME WAVE MURAL RUSH!\n[${ev.gangTag}] painting at ${ev.zoneName} gains +50% paint speed!\nThe chaos fuels their art!`, '#ff6622', 5000);
      addEventMessage(`🚨🎨 Crime Wave boost! [${ev.gangTag}] paints ${ev.zoneName} mural 50% faster!`, '#ff6622');
    }
    if (ev.type === 'gang_war_mural_synergy') {
      showAnnouncement(`⚔️🎨 GANG WAR MURAL TAKEOVER!\n[${ev.attackGangTag}] captured ${ev.defGangTag}'s mural at ${ev.zoneName}!\n+${ev.warXpBonus}XP +${ev.warCoinBonus}c war bonus for all painters!`, '#ff8844', 5000);
      addEventMessage(`⚔️🎨 [${ev.attackGangTag}] seized [${ev.defGangTag}]'s mural at ${ev.zoneName} during the war! (+${ev.warXpBonus}XP per painter)`, '#ff8844');
    }

    // === GOLDEN RAMPAGE (Session 96) ===
    if (ev.type === 'golden_rampage_start') {
      effects.push({ type: 'screen_shake', intensity: 18, duration: 1000, time: now });
      const isYou = ev.birdId === myId;
      if (isYou) {
        showAnnouncement(
          `🌟 YOU HAVE ASCENDED!\nYOU ARE THE GOLDEN BIRD!\n2.5× SPEED · ALL MEGA POOP · 4× XP for 90s!\nOthers will hunt you for big rewards!`,
          '#ffd700', 8000
        );
      } else {
        showAnnouncement(
          `🌟 GOLDEN RAMPAGE!\n${ev.gangTag ? '[' + ev.gangTag + '] ' : ''}${ev.birdName} has ASCENDED!\nHunt them for massive rewards!\n(${ev.hp} HP — poop them to share the loot)`,
          '#ffd700', 7000
        );
      }
      addEventMessage(`🌟 GOLDEN RAMPAGE! ${ev.gangTag ? '[' + ev.gangTag + '] ' : ''}${ev.birdName} has become the Golden Bird! Hunt them for rewards!`, '#ffd700');
    }
    if (ev.type === 'golden_bird_hit_progress') {
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 1000,
        text: `💥 −${ev.dmg}HP  ${ev.hp}/${ev.maxHp}`, color: '#ffd700', size: 13 });
      if (ev.shooterId === myId) {
        addEventMessage(`💥 HIT THE GOLDEN BIRD! ${ev.hp}/${ev.maxHp} HP — keep going for the loot!`, '#ffd700');
      }
    }
    if (ev.type === 'golden_rampage_survived') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 900, time: now });
      if (ev.birdId === myId) {
        showAnnouncement(
          `🏆 GOLDEN BIRD SURVIVED!\nYou outlasted the hunters!\n+1200 XP +700c!\nYou earn the 👑 GOLDEN BIRD badge!`,
          '#ffd700', 9000
        );
      } else {
        showAnnouncement(
          `🌟 ${ev.gangTag ? '[' + ev.gangTag + '] ' : ''}${ev.birdName} SURVIVED the Golden Rampage!\n+1200 XP +700c · GOLDEN BIRD badge earned!`,
          '#ffd700', 7000
        );
      }
      addEventMessage(`🌟 ${ev.gangTag ? '[' + ev.gangTag + '] ' : ''}${ev.birdName} SURVIVED 90s as the Golden Bird! +1200XP +700c · 👑 badge earned!`, '#ffd700');
    }
    if (ev.type === 'golden_rampage_freed') {
      effects.push({ type: 'screen_shake', intensity: 16, duration: 1000, time: now });
      showAnnouncement(
        `⚔️ GOLDEN BIRD BROUGHT DOWN!\n${ev.killerCount} bird${ev.killerCount !== 1 ? 's' : ''} split the loot!\nTop hunter: ${ev.topHunterName || '???'} (+${ev.topHunterXp || 0}XP +${ev.topHunterCoins || 0}c)`,
        '#ff9900', 7000
      );
      addEventMessage(`⚔️ GOLDEN BIRD ${ev.gangTag ? '[' + ev.gangTag + '] ' : ''}${ev.birdName} was brought down! Hunters share the loot!`, '#ff9900');
    }
    if (ev.type === 'golden_bird_reward') {
      if (ev.birdId === myId) {
        showAnnouncement(`💰 GOLDEN BIRD LOOT!\n+${ev.xp} XP · +${ev.coins}c\nYour ${ev.sharePercent}% damage share paid off!`, '#ffd700', 5000);
      }
    }

    // === GOLDEN THRONE (Session 100) ===
    if (ev.type === 'golden_throne_spawned') {
      effects.push({ type: 'screen_shake', intensity: 16, duration: 900, time: now });
      showAnnouncement(
        `👑 THE GOLDEN THRONE HAS DESCENDED!\nFly there and CLAIM IT to become KINGPIN!\nBeware: 2 Royal Guards protect the throne!\nPoop them to stun, then stay near the throne for 8s!`,
        '#ffd700', 9000
      );
      addEventMessage(`👑 THE GOLDEN THRONE has descended on ${ev.locationName || 'the city'}! First to claim it becomes KINGPIN!`, '#ffd700');
    }
    if (ev.type === 'throne_guard_hit') {
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 900,
        text: `⚔️ ${ev.hp}/${ev.maxHp} HP`, color: '#ffd700', size: 11 });
    }
    if (ev.type === 'throne_guard_stunned') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      effects.push({ type: 'text', x: ev.x, y: ev.y - 30, time: now, duration: 1200,
        text: '★ GUARD STUNNED! ★', color: '#ffff44', size: 12 });
      if (ev.allDown) {
        addEventMessage(`⭐ ${ev.gangTag ? '[' + ev.gangTag + '] ' : ''}${ev.birdName} stunned both throne guards! The throne is UNPROTECTED — claim it now!`, '#ffd700');
        if (ev.birdId === myId) {
          showAnnouncement(`⭐ BOTH GUARDS DOWN!\nSTAY NEAR THE THRONE for 8 seconds to CLAIM IT!\nBe quick — guards will recover!`, '#ffd700', 6000);
        }
      }
    }
    if (ev.type === 'golden_throne_claiming') {
      if (ev.birdId === myId) {
        // Continuous claiming progress handled via state snapshot (claimProgress field)
      } else {
        addEventMessage(`👑 ${ev.gangTag ? '[' + ev.gangTag + '] ' : ''}${ev.birdName} is claiming the Golden Throne! STOP THEM!`, '#ffd700');
      }
    }
    if (ev.type === 'golden_throne_blocked') {
      if (ev.birdId === myId) {
        showAnnouncement(`⚠️ A GUARD BLOCKS YOUR CLAIM!\nPoop the guards first!`, '#ff8800', 3000);
      }
    }
    if (ev.type === 'golden_throne_claimed') {
      effects.push({ type: 'screen_shake', intensity: 22, duration: 1200, time: now });
      const isYou = ev.birdId === myId;
      if (isYou) {
        showAnnouncement(
          `👑 YOU CLAIMED THE GOLDEN THRONE!\nYOU ARE KINGPIN!\n+400 XP · +200c · Gold Rush decree ACTIVATED!\nAll coin drops doubled for 60 seconds!`,
          '#ffd700', 10000
        );
      } else {
        showAnnouncement(
          `👑 ${ev.gangTag ? '[' + ev.gangTag + '] ' : ''}${ev.birdName} SEIZED THE GOLDEN THRONE!\nThey are now KINGPIN!\nGold Rush: 2× coins city-wide for 60s!`,
          '#ffd700', 8000
        );
      }
      addEventMessage(`👑 ${ev.gangTag ? '[' + ev.gangTag + '] ' : ''}${ev.birdName} CLAIMED THE GOLDEN THRONE and became KINGPIN! Gold Rush — 2× coins for 60s!`, '#ffd700');
      // Coin shower particles
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      for (let i = 0; i < 30; i++) {
        effects.push({
          type: 'coin_particle', x: centerX + (Math.random() - 0.5) * 300,
          y: centerY + (Math.random() - 0.5) * 300,
          vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 10 - 2,
          time: now, duration: 1200 + Math.random() * 600, color: '#ffd700'
        });
      }
    }
    if (ev.type === 'golden_throne_expired') {
      addEventMessage(`👑 The Golden Throne faded away... No bird was brave enough to claim it.`, '#c8a000');
    }

// === SUSPICIOUS PACKAGE EVENTS ===
    if (ev.type === 'package_spawned') {
      effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      showAnnouncement(
        `\uD83D\uDCA3 SUSPICIOUS PACKAGE SPOTTED!\nPOOP IT 10 TIMES to defuse it!\nIf it EXPLODES — everyone nearby gets FLUNG!\n(Chain reactions: casino scatter · nest damage · vault crack)`,
        '#ff4400', 8000
      );
      addEventMessage(ev.message || '\uD83D\uDCA3 SUSPICIOUS PACKAGE spotted! Poop it 10\u00D7 to defuse!', '#ff6600');
    }
    if (ev.type === 'package_hit') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: ev.x, y: ev.y - 22, time: now, duration: 900,
          text: `\uD83D\uDCA3 ${ev.defuseHits}/${ev.maxDefuseHits}`, color: '#00ccff', size: 13 });
      }
    }
    if (ev.type === 'package_cops_dispatched') {
      addEventMessage('\uD83D\uDEA8 Cops dispatched to the suspicious package! Working up heat for defusers!', '#ffaa44');
    }
    if (ev.type === 'package_urgent') {
      const secsLeft = Math.ceil((ev.timeLeft || 0) / 1000);
      effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      showAnnouncement(`\u26A0\uFE0F\uD83D\uDCA3 PACKAGE ABOUT TO EXPLODE!\n${secsLeft}s LEFT — FLY TO IT AND POOP!`, '#ff2200', 5000);
      addEventMessage(`\u26A0\uFE0F PACKAGE URGENT! ${secsLeft}s left to defuse!`, '#ff3300');
    }
    if (ev.type === 'package_defused') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 800, time: now });
      const heroCount = ev.rewards ? ev.rewards.length : 0;
      const topName = ev.topName || '???';
      const topReward = ev.rewards && ev.rewards.length > 0 ? ev.rewards[0] : null;
      showAnnouncement(
        `\u2705 PACKAGE DEFUSED!\n${heroCount} brave bird${heroCount !== 1 ? 's' : ''} neutralised the threat!\nTop defuser: ${topName}${topReward ? ` (+${topReward.xp}XP +${topReward.coins}c)` : ''}`,
        '#44ff88', 7000
      );
      addEventMessage(ev.message || `\u2705 SUSPICIOUS PACKAGE DEFUSED! City saved! ${heroCount} defusers rewarded.`, '#44ff88');
    }
    if (ev.type === 'package_exploded') {
      effects.push({ type: 'screen_shake', intensity: 22, duration: 1200, time: now });
      const flungCount = ev.blasted ? ev.blasted.length : 0;
      let chainStr = '';
      if (ev.casinoChain) chainStr += ' \uD83C\uDFB0Casino scatter!';
      if (ev.nestChains && ev.nestChains.length > 0) {
        const tag = ev.nestChains[0].gangTag;
        chainStr += ` \uD83C\uDFE0${tag ? '[' + tag + '] ' : ''}Nest hit!`;
      }
      if (ev.vaultChain) chainStr += ' \uD83D\uDCBCVault cracked!';
      showAnnouncement(
        `\uD83D\uDCA5 PACKAGE EXPLODED!\n${flungCount > 0 ? flungCount + ' bird' + (flungCount !== 1 ? 's' : '') + ' FLUNG across the city!' : 'Nobody was nearby.'}${chainStr ? '\n' + chainStr : ''}`,
        '#ff2200', 9000
      );
      addEventMessage(ev.message || `\uD83D\uDCA5 BOOM! Suspicious Package exploded! ${flungCount} birds flung.${chainStr}`, '#ff3300');
      // Full-screen flash
      effects.push({ type: 'flash', color: 'rgba(255,220,100,0.35)', duration: 400, time: now });
      // Personal blast announcement if this bird was in the blast radius
      if (ev.blasted) {
        const me = ev.blasted.find(b => b.birdId === myId);
        if (me) {
          showAnnouncement(`\uD83D\uDCA5 YOU WERE CAUGHT IN THE BLAST!\nFlung ${me.dist}px away · \u22121${me.coinLoss}c`, '#ff4400', 4000);
        }
      }
    }

// === BIRD CITY GAZETTE ===
    if (ev.type === 'gazette_edition') {
      showGazette(ev);
      addEventMessage('📰 The Bird City Gazette MORNING EDITION is out!', '#c8a040');
    }

    // === BIRD CITY IDOL ===
    if (ev.type === 'idol_contest_open') {
      showAnnouncement('🎤 BIRD CITY IDOL — CONTEST OPEN!\nFly to the 🎤 stage in the park · Press [I] to enter!', '#ff88ff', 7000);
      addEventMessage('🎤 BIRD CITY IDOL contest has opened! Fly to the stage in the east park and press [I]!', '#ff88ff');
      triggerScreenShake(8, 400);
    }
    if (ev.type === 'idol_contestant_joined') {
      addEventMessage(`🎤 ${ev.birdName} joined BIRD CITY IDOL as contestant #${ev.slotNum}! (${ev.totalContestants}/4)`, '#cc88ff');
      if (idolOverlayVisible) renderIdolOverlay();
    }
    if (ev.type === 'idol_cancelled') {
      addEventMessage('🎤 Idol contest cancelled — not enough contestants.', '#888888');
      if (idolOverlayVisible) hideIdolOverlay();
    }
    if (ev.type === 'idol_voting_open') {
      showAnnouncement('🗳️ BIRD CITY IDOL VOTING OPEN!\nPress [I] to vote for your favourite performer!', '#44aaff', 6000);
      addEventMessage('🗳️ IDOL VOTING is open! Press [I] from anywhere to cast your vote!', '#44aaff');
      if (idolOverlayVisible) renderIdolOverlay();
      else showIdolOverlay(); // Auto-open voting overlay for all
    }
    if (ev.type === 'idol_vote_cast') {
      addEventMessage(`🗳️ ${ev.voterName} voted in the Idol contest! (${ev.totalVotes} total votes)`, '#8888ff');
      if (idolOverlayVisible) renderIdolOverlay();
    }
    if (ev.type === 'idol_results') {
      showAnnouncement(`🏆 BIRD CITY IDOL WINNER: ${ev.winnerName}!\n+300c · +250 XP · 🎤 IDOL badge · ⚡ 3-min XP boost for ALL!`, '#ffd700', 8000);
      addEventMessage(`🏆 IDOL WINNER: ${ev.winnerName}! City-wide 1.5× XP boost for 3 minutes!`, '#ffd700');
      triggerScreenShake(12, 600);
      if (idolOverlayVisible) renderIdolOverlay();
      else showIdolOverlay(); // Show results to everyone
    }

    // === WANTED HOTLINE (Session 104) ===
    if (ev.type === 'hotline_confirm' && ev.birdId === myId) {
      showAnnouncement(`📞 TIP SENT on ${ev.targetName}!\n+${ev.heatAdded} heat applied. Anonymous.`, '#ff4444', 3500);
    }
    if (ev.type === 'hotline_alert' && ev.birdId === myId) {
      showAnnouncement(`📞 ANONYMOUS TIP!\nSomeone reported you to the Wanted Hotline!\n+70 heat added to your record.`, '#ff2222', 4500);
      effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
    }
    if (ev.type === 'hotline_fail' && ev.birdId === myId) {
      const msgText = ev.msg || 'Hotline tip failed.';
      showAnnouncement(`📞 ${msgText}`, '#ff6666', 3000);
    }
    if (ev.type === 'hotline_tipped') {
      const tag = ev.targetGangTag ? `[${ev.targetGangTag}] ` : '';
      addEventMessage(`📞 ANONYMOUS TIP: ${tag}${ev.targetName} was reported to the authorities! (+${ev.heatAdded} heat)`, '#ff4444');
    }
    if (ev.type === 'hotline_shield_triggered') {
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      showAnnouncement(
        `🛡 INFORMANT SHIELD TRIGGERED!\n${ev.snitchName} tried to tip on ${ev.targetName}\n— BOUNCED! Snitch gets +${ev.bounceHeat} heat!`,
        '#ff8800', 6000
      );
      addEventMessage(`🛡 ${ev.targetName}'s shield EXPOSED the snitch: ${ev.snitchName} (+${ev.bounceHeat} heat)!`, '#ff8800');
    }
    if (ev.type === 'informant_shield_active' && ev.birdId === myId) {
      showAnnouncement(
        `🛡 INFORMANT SHIELD ACTIVE!\nNext tip on you BOUNCES back — exposing the snitch!\n(5 minutes)`,
        '#ff8800', 5000
      );
    }

    // === GRUDGE SYSTEM (Session 105) ===
    if (ev.type === 'grudge_set' && ev.birdId === myId) {
      showAnnouncement(
        `😤 GRUDGE SET!\nYou ${ev.reasonDesc} ${ev.targetName}!\nPoop them 3× for revenge! (+${ev.rewardXp} XP +${ev.rewardCoins}c)`,
        '#ff6600', 6000
      );
      addEventMessage(`😤 ${ev.targetName} is your grudge target — poop them 3 times!`, '#ff6600');
      effects.push({ type: 'screen_shake', intensity: 4, duration: 300, time: now });
    }
    if (ev.type === 'grudge_hit') {
      if (ev.revengerId === myId) {
        const done = ev.hitsDealt >= ev.hitsNeeded;
        const msg = done
          ? `😤 GRUDGE HIT ${ev.hitsDealt}/${ev.hitsNeeded} — REVENGE INCOMING!`
          : `😤 GRUDGE HIT ${ev.hitsDealt}/${ev.hitsNeeded} on ${ev.targetName}!`;
        addEventMessage(msg, '#ff8800');
        effects.push({ type: 'float_text', text: `😤 ${ev.hitsDealt}/${ev.hitsNeeded}`, x: ev.targetX || 0, y: (ev.targetY || 0) - 30, color: '#ff8800', duration: 1000, time: now });
      }
      if (ev.targetId === myId) {
        addEventMessage(`😤 ${ev.revengerName} has a GRUDGE — they hit you! (${ev.hitsDealt}/${ev.hitsNeeded})`, '#ff4400');
      }
    }
    if (ev.type === 'grudge_complete') {
      const tag = ev.revengerGangTag ? `[${ev.revengerGangTag}] ` : '';
      if (ev.revengerId === myId) {
        showAnnouncement(
          `😤 REVENGE COMPLETE!\nYou settled the score with ${ev.targetName}!\n+${ev.xp} XP +${ev.coins}c`,
          '#ff8800', 5000
        );
        addEventMessage(`😤 REVENGE! ${tag}${ev.revengerName} settled the score (+${ev.xp} XP +${ev.coins}c)`, '#ff8800');
        effects.push({ type: 'screen_shake', intensity: 7, duration: 500, time: now });
      } else {
        addEventMessage(`😤 ${tag}${ev.revengerName} got REVENGE on ${ev.targetName}!`, '#ff6600');
      }
    }

    // === VIGILANTE MARSHAL (Session 109) ===
    if (ev.type === 'vigilante_call_opened') {
      const tag = ev.targetGangTag ? `[${ev.targetGangTag}] ` : '';
      showAnnouncement(
        `⭐ VIGILANTE CALL!\n${tag}${ev.targetName} is MOST WANTED!\nPress [H] to become the Marshal!\n+500 XP · steal 30% coins · clear their heat`,
        '#ffe566', 8000
      );
      addEventMessage(`⭐ VIGILANTE CALL for ${tag}${ev.targetName} — press [H] to hunt them! (20s)`, '#ffe566');
      effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
    }
    if (ev.type === 'vigilante_accepted') {
      const tag = ev.marshalGangTag ? `[${ev.marshalGangTag}] ` : '';
      if (ev.marshalId === myId) {
        showAnnouncement(
          `⭐ YOU ARE THE MARSHAL!\nHunt ${ev.targetName}!\nStay within 55px for 4s to ARREST them.\nThey can poop you 4× to stun you!`,
          '#ffe566', 7000
        );
        addEventMessage(`⭐ YOU accepted the Vigilante Call! Hunt ${ev.targetName}!`, '#ffe566');
        effects.push({ type: 'screen_shake', intensity: 7, duration: 500, time: now });
      } else if (ev.targetId === myId) {
        showAnnouncement(
          `⭐ A MARSHAL IS HUNTING YOU!\n${tag}${ev.marshalName} accepted the call!\nPoop them 4× to stun — 3 stuns = VICTORY!`,
          '#ff4444', 7000
        );
        addEventMessage(`⚠️ ${tag}${ev.marshalName} is the Vigilante Marshal — they're hunting YOU!`, '#ff4444');
        effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      } else {
        addEventMessage(`⭐ ${tag}${ev.marshalName} accepted the Vigilante Call to hunt ${ev.targetName}!`, '#ffe566');
      }
    }
    if (ev.type === 'vigilante_closing_in') {
      if (ev.targetId === myId) {
        showAnnouncement(`⭐ MARSHAL CLOSING IN!\nPoop them NOW! (${ev.dist}px away)`, '#ff4444', 2500);
        effects.push({ type: 'screen_shake', intensity: 5, duration: 300, time: now });
      }
    }
    if (ev.type === 'vigilante_counter_hit') {
      if (ev.criminalId === myId) {
        effects.push({ type: 'float_text', text: `⭐ HIT! ${ev.hitsDealt}/4`, x: (gameState.self && gameState.self.x) || 1500, y: ((gameState.self && gameState.self.y) || 1500) - 40, color: '#ffe566', duration: 1200, time: now });
      }
    }
    if (ev.type === 'vigilante_stunned') {
      const tag = ev.marshalGangTag ? `[${ev.marshalGangTag}] ` : '';
      if (ev.marshalId === myId) {
        showAnnouncement(`💫 MARSHAL STUNNED!\n${ev.criminalName} hit you — stunned for 8s!\n(${ev.stunCount}/3 stuns)`, '#ff8800', 4000);
        effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      } else if (ev.criminalId === myId) {
        showAnnouncement(`💥 STUN ${ev.stunCount}/3! Marshal is down for 8s!\nKeep going to WIN!`, '#ff8800', 3000);
      } else {
        addEventMessage(`💫 ${tag}${ev.marshalName} was STUNNED (${ev.stunCount}/3) by ${ev.criminalName}!`, '#ff8800');
      }
    }
    if (ev.type === 'vigilante_caught') {
      const tag = ev.marshalGangTag ? `[${ev.marshalGangTag}] ` : '';
      if (ev.marshalId === myId) {
        showAnnouncement(
          `⭐ ARREST MADE!\nYou caught ${ev.criminalName}!\n+500 XP +${ev.coins}c stolen!`,
          '#ffe566', 6000
        );
        effects.push({ type: 'screen_shake', intensity: 12, duration: 800, time: now });
      } else if (ev.criminalId === myId) {
        showAnnouncement(
          `🚔 ARRESTED BY THE MARSHAL!\n${tag}${ev.marshalName} caught you!\n−${ev.stolen}c stolen — heat cleared`,
          '#ff4444', 6000
        );
        effects.push({ type: 'screen_shake', intensity: 12, duration: 800, time: now });
      } else {
        showAnnouncement(`⭐ ${tag}${ev.marshalName} ARRESTED ${ev.criminalName}! +500 XP`, '#ffe566', 5000);
        addEventMessage(`⭐ ARREST! ${tag}${ev.marshalName} caught ${ev.criminalName} — stole ${ev.stolen}c`, '#ffe566');
        effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      }
    }
    if (ev.type === 'vigilante_defeated') {
      const tag = ev.marshalGangTag ? `[${ev.marshalGangTag}] ` : '';
      if (ev.criminalId === myId) {
        showAnnouncement(
          `🔥 MARSHAL DEFEATED!\nYou outlasted the law!\n+300 XP +200c!`,
          '#ff8800', 6000
        );
        effects.push({ type: 'screen_shake', intensity: 10, duration: 700, time: now });
      } else if (ev.marshalId === myId) {
        showAnnouncement(`💀 YOU WERE DEFEATED\n${ev.criminalName} outlasted you…\nBetter luck next call!`, '#888888', 5000);
      } else {
        showAnnouncement(`🔥 ${ev.criminalName} DEFEATED the Marshal ${tag}${ev.marshalName}!`, '#ff8800', 5000);
        addEventMessage(`🔥 OUTLAW WINS! ${ev.criminalName} defeated ${tag}${ev.marshalName}! +300 XP +200c`, '#ff8800');
        effects.push({ type: 'screen_shake', intensity: 7, duration: 500, time: now });
      }
    }
    if (ev.type === 'vigilante_ended') {
      if (ev.reason === 'expired') {
        addEventMessage(`⭐ Vigilante call expired — ${ev.targetName} evaded the law!`, '#888888');
      }
    }

    // === FLASH MOB (Session 106) ===
    if (ev.type === 'flash_mob_warning') {
      // Draw direction arrow so players can find the mob location
      window._flashMobDir = { x: ev.x, y: ev.y, startsAt: ev.startsAt };
      showAnnouncement(
        `🎉 FLASH MOB IN 30s!\nLocation: ${ev.locationName}\nFly there for XP + coins — bigger crowd = bigger reward!\n6+ birds = MEGA MOB 🌟`,
        '#cc88ff', 8000
      );
      addEventMessage(`🎉 FLASH MOB INCOMING at ${ev.locationName} in 30s — FLY THERE!`, '#cc88ff');
    }
    if (ev.type === 'flash_mob_active') {
      window._flashMobDir = { x: ev.x, y: ev.y, endsAt: ev.endsAt };
      effects.push({ type: 'screen_shake', intensity: 8, duration: 600, time: now });
      showAnnouncement(
        `🎉 FLASH MOB STARTED at ${ev.locationName}!\nFly within 90px for passive XP + coins!\n6+ birds = MEGA MOB!`,
        '#ff44cc', 6000
      );
      addEventMessage(`🎉 FLASH MOB ACTIVE at ${ev.locationName}! Fly there now!`, '#ff44cc');
    }
    if (ev.type === 'flash_mob_tick_reward') {
      if (ev.birdId === myId) {
        effects.push({ type: 'text', x: (gameState.self && gameState.self.x) || 1500,
          y: (gameState.self && gameState.self.y) || 1500, time: now, duration: 900,
          text: `🎉 +${ev.xp}XP`, color: '#ff88cc', size: 13 });
      }
    }
    if (ev.type === 'flash_mob_ended') {
      window._flashMobDir = null;
      const count = ev.count || 0;
      if (count === 0) {
        addEventMessage(`🎉 Flash Mob at ${ev.locationName} fizzled out... nobody showed up.`, '#888888');
      } else if (ev.isMega) {
        effects.push({ type: 'screen_shake', intensity: 14, duration: 900, time: now });
        showAnnouncement(
          `🌟 MEGA MOB!\n${count} birds partied at ${ev.locationName}!\n+${ev.xpReward}XP +${ev.coinReward}c for participants!\n+30XP +10c for EVERY online bird!`,
          '#ff44cc', 8000
        );
        addEventMessage(`🌟 MEGA MOB! ${count} birds at ${ev.locationName} (+${ev.xpReward}XP +${ev.coinReward}c each + spectator bonus)!`, '#ff44cc');
        for (const w of (ev.winners || [])) {
          effects.push({ type: 'coins', x: ev.x || 1500, y: ev.y || 1500, count: 6, time: now });
        }
      } else {
        effects.push({ type: 'screen_shake', intensity: 7, duration: 500, time: now });
        const tag = ev.rewardXp > 0 ? `+${ev.xpReward}XP +${ev.coinReward}c each` : '';
        showAnnouncement(
          `🎉 FLASH MOB ENDED at ${ev.locationName}!\n${count} bird${count !== 1 ? 's' : ''} showed up${tag ? ' — ' + tag : ''}!`,
          '#ff88cc', 5000
        );
        addEventMessage(`🎉 Flash Mob over — ${count} bird${count !== 1 ? 's' : ''} at ${ev.locationName}${tag ? ' (' + tag + ')' : ''}!`, '#ff88cc');
      }
    }

    // === COURIER PIGEON (Session 107) ===
    if (ev.type === 'courier_spawned') {
      window._courierPigeonDir = { x: ev.destX, y: ev.destY };
      effects.push({ type: 'screen_shake', intensity: 5, duration: 400, time: now });
      showAnnouncement(
        `📬 COURIER PIGEON!\nDelivering a secret letter from ${ev.srcName} → ${ev.destName}\nEscort it for rewards — or INTERCEPT it for a parcel! (3 poop hits)`,
        '#e8c060', 7000
      );
      addEventMessage(`📬 A Courier Pigeon is flying from ${ev.srcName} to ${ev.destName}! Escort or intercept!`, '#e8c060');
    }
    if (ev.type === 'courier_hit') {
      effects.push({ type: 'text', x: ev.x, y: ev.y, time: now, duration: 900,
        text: `📬 HIT! ${ev.hitCount}/${ev.maxHits}`, color: '#ff8800', size: 13 });
      if (ev.birdId === myId) {
        addEventMessage(`📬 You intercepted the courier! ${ev.hitCount}/${ev.maxHits} — ${ev.maxHits - ev.hitCount} more to steal the parcel!`, '#ff8800');
      }
    }
    if (ev.type === 'courier_parcel_stolen') {
      window._courierPigeonDir = null;
      effects.push({ type: 'screen_shake', intensity: 10, duration: 600, time: now });
      effects.push({ type: 'coins', x: ev.x, y: ev.y, count: 10, time: now });
      const gangPart = ev.gangTag ? `[${ev.gangTag}] ` : '';
      if (ev.birdId === myId) {
        showAnnouncement(
          `📬 PARCEL STOLEN!\n+${ev.parcelReward}c +${ev.parcelXp}XP — you intercepted the courier!`,
          '#ffd700', 6000
        );
      }
      addEventMessage(`📬 ${gangPart}${ev.birdName} STOLE the courier's parcel! (+${ev.parcelReward}c +${ev.parcelXp}XP)`, '#ffd700');
    }
    if (ev.type === 'courier_delivered') {
      window._courierPigeonDir = null;
      addEventMessage(`📬 The Courier Pigeon delivered its letter to ${ev.destName}!`, '#88aaff');
      if (ev.escortRewards && ev.escortRewards.length > 0) {
        for (const r of ev.escortRewards) {
          if (r.birdId === myId) {
            showAnnouncement(`📬 ESCORT REWARD!\n+${r.xp}XP +${r.coins}c — you safely guided the courier!`, '#88aaff', 5000);
          } else {
            addEventMessage(`📬 ${r.birdName} earned escort reward: +${r.xp}XP +${r.coins}c`, '#88aaff');
          }
        }
      }
    }
    if (ev.type === 'courier_escaped') {
      window._courierPigeonDir = null;
      addEventMessage(`📬 The Courier Pigeon escaped without being intercepted. Letter delivered... somewhere.`, '#888888');
    }
    if (ev.type === 'don_noble_doubletip') {
      if (ev.birdId === myId) {
        showAnnouncement(`🎩 DON CONTRACT DOUBLE-DIP!\n+${ev.bonusCoins}c +${ev.bonusXp}XP — your mission also ticked the Noble Challenge!`, '#d4af37', 4000);
      }
    }
    if (ev.type === 'pardon_territory_boost') {
      addEventMessage(`👑 [${ev.gangTag}] ${ev.kingpinName}'s pardon of ${ev.pardonedName} earns their gang 1.5× territory capture for 2 minutes!`, '#d4af37');
      if (gameState.self && gameState.self.gangTag === ev.gangTag) {
        showAnnouncement(`👑 ROYAL PARDON BONUS!\n[${ev.gangTag}] earns 1.5× territory capture speed for 2 minutes!`, '#d4af37', 5000);
      }
    }

    // === AUCTION HOUSE (Session 108) ===
    if (ev.type === 'auction_open') {
      effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
      showAnnouncement(`🔨 BIRD CITY AUCTION HOUSE OPENS!\n3 lots up for bid — fly to the Auction House (SW) and press [A]!\nStarting bid: ${ev.lots && ev.lots[0] ? ev.lots[0].currentBid + 'c' : '?'}`, '#ffd700', 6000);
      addEventMessage('🔨 AUCTION HOUSE OPEN! 3 lots for bid — press [A] near the Auction House!', '#ffd700');
      window._renderAuctionOverlay();
    }
    if (ev.type === 'auction_lot_open') {
      const lot = ev.lot;
      addEventMessage(`🔨 LOT ${ev.lotIndex + 1}/3: ${lot.emoji} ${lot.name} — starting at ${ev.currentBid}c`, '#ffd700');
      window._renderAuctionOverlay();
    }
    if (ev.type === 'auction_bid_placed') {
      const isMine = ev.birdId === myId;
      const tag = ev.bidderGang ? `[${ev.bidderGang}] ` : '';
      addEventMessage(`🔨 ${tag}${ev.bidderName} bids ${ev.amount}c`, '#ffe066');
      if (!isMine) {
        const bidMsg = document.getElementById('auctionBidMsg');
        if (bidMsg) { bidMsg.textContent = `${tag}${ev.bidderName} outbids — new: ${ev.amount}c`; bidMsg.style.color = '#ff8844'; }
      }
      window._renderAuctionOverlay();
    }
    if (ev.type === 'auction_bid_fail') {
      if (ev.birdId === myId) {
        const msgs = { no_active_auction: 'No active lot right now.', too_far: 'You\'re too far from the Auction House!', invalid_amount: `Minimum bid is ${ev.minBid}c!`, no_coins: `Need ${ev.need}c — you only have ${ev.have}c!` };
        const bidMsg = document.getElementById('auctionBidMsg');
        if (bidMsg) { bidMsg.textContent = msgs[ev.reason] || 'Bid failed.'; bidMsg.style.color = '#ff4444'; }
      }
    }
    if (ev.type === 'auction_lot_won') {
      const tag = ev.winnerGang ? `[${ev.winnerGang}] ` : '';
      const isMine = ev.winnerId === myId;
      effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: now });
      if (isMine) {
        effects.push({ type: 'coins', x: gameState.self?.x || 1500, y: gameState.self?.y || 1500, count: 10, time: now });
        showAnnouncement(`🔨 SOLD! You won ${ev.item.emoji} ${ev.item.name} for ${ev.finalBid}c!`, '#ffd700', 5000);
      } else {
        addEventMessage(`🔨 SOLD! ${tag}${ev.winnerName} wins ${ev.item.emoji} ${ev.item.name} for ${ev.finalBid}c`, '#ffd700');
      }
      window._renderAuctionOverlay();
    }
    if (ev.type === 'auction_lot_no_sale') {
      addEventMessage(`🔨 No bids — ${ev.item.emoji} ${ev.item.name} passes unsold.`, '#888855');
      window._renderAuctionOverlay();
    }
    if (ev.type === 'auction_closed') {
      addEventMessage('🔨 Auction House closes. See you next time!', '#a08030');
      const overlay = document.getElementById('auctionOverlay');
      if (overlay) overlay.style.display = 'none';
    }
    if (ev.type === 'auction_item_applied') {
      if (ev.birdId === myId) {
        let msg = `🔨 ${ev.item.emoji} ${ev.item.name} applied!`;
        if (ev.luckyItem) msg += ` (Lucky Dip: ${ev.luckyItem.emoji} ${ev.luckyItem.name}!)`;
        if (ev.value) msg += ` +${ev.value}${ev.item.id === 'xp_bomb' ? ' XP' : 'c'}`;
        showAnnouncement(msg, '#ffd700', 4000);
      }
    }

    // === BOWLING BIRD (Session 109) ===
    if (ev.type === 'bowling_ball_start') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 900, time: now });
      const isMe = ev.birdId === myId;
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      if (isMe) {
        showAnnouncement(
          `🎳 YOU ARE THE BOWLING BIRD!\n2.2× size · KNOCK birds aside at 220px/s\nSurvive 75s for 600XP +350c · Poop disabled while rolling!`,
          '#e06000', 8000
        );
      } else {
        showAnnouncement(
          `🎳 BOWLING BIRD!\n${tag}${ev.birdName} has been INFLATED into a giant bowling ball!\nPoop them 12× to pop the shell! DODGE if they charge you!`,
          '#e06000', 7000
        );
      }
      addEventMessage(`🎳 ${tag}${ev.birdName} became a BOWLING BIRD! Poop them 12× to pop the shell!`, '#e06000');
      window._bowlingBallDir = null; // reset off-screen arrow tracking
    }
    if (ev.type === 'bowling_bird_hit') {
      effects.push({ type: 'text', x: ev.x, y: ev.y - 20, time: now, duration: 800,
        text: `🎳 −${ev.dmg}`, color: '#ff8800', size: 13 });
      if (ev.hitterId === myId) {
        addEventMessage(`🎳 You hit the Bowling Bird! ${ev.hp}/${ev.maxHp} HP left!`, '#ff8800');
      }
    }
    if (ev.type === 'bowling_knock') {
      if (ev.targetId === myId) {
        effects.push({ type: 'screen_shake', intensity: 16, duration: 700, time: now });
        showAnnouncement(`🎳 KNOCKED ASIDE by the Bowling Bird!`, '#ff4400', 2500);
        addEventMessage(`🎳 ${ev.bowlerName} knocked you flying!`, '#ff6600');
      } else {
        effects.push({ type: 'text', x: ev.x, y: ev.y, time: now, duration: 900,
          text: '🎳 KO!', color: '#ff4400', size: 14 });
      }
    }
    if (ev.type === 'bowling_ball_popped') {
      effects.push({ type: 'screen_shake', intensity: 16, duration: 900, time: now });
      effects.push({ type: 'coins', x: ev.x || 1500, y: ev.y || 1500, count: 15, time: now });
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      showAnnouncement(
        `🎳💥 BOWLING BALL POPPED!\n${tag}${ev.birdName}'s shell SHATTERED!\nContributors rewarded!`,
        '#ff8800', 7000
      );
      addEventMessage(`🎳💥 Bowling Bird ${tag}${ev.birdName} was POPPED by the city! Well done!`, '#ff8800');
    }
    if (ev.type === 'bowling_ball_survived') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 900, time: now });
      const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
      showAnnouncement(
        `🎳🏆 BOWLING BIRD SURVIVED!\n${tag}${ev.birdName} outlasted the city!\n+600XP +350c — UNSTOPPABLE!`,
        '#ffd700', 8000
      );
      addEventMessage(`🎳🏆 ${tag}${ev.birdName} SURVIVED as the Bowling Bird! +600XP +350c + 🎳 badge!`, '#ffd700');
    }
    if (ev.type === 'bowling_ball_reward' && ev.targetId === myId) {
      showAnnouncement(`🎳 BOWLING BIRD POPPED! +${ev.xp}XP +${ev.coins}c — nice work!`, '#ff8800', 4000);
    }
    if (ev.type === 'bowling_consolation' && ev.targetId === myId) {
      addEventMessage(`🎳 The Bowling Bird survived... +15c consolation.`, '#888855');
    }

    // === MAYOR'S MOTORCADE (Session 111) ===
    if (ev.type === 'motorcade_spawn') {
      showAnnouncement(`🚗 MAYOR'S MOTORCADE! Hit the limo 8 times!`, '#1a3a6b', 5000);
      addEventMessage(`🚗 MAYOR'S MOTORCADE is cruising through Bird City! Stun the escorts, then poop the limo!`, '#3366cc');
      triggerScreenShake(7, 400);
      window._motorcadeDir = { x: ev.x, y: ev.y };
    }
    if (ev.type === 'motorcade_escort_hit') {
      if (ev.hitterId === myId) {
        const now2 = performance.now();
        effects.push({ type: 'xp', x: ev.x, y: ev.y - 10, time: now2, duration: 900, text: `🏍 HIT! ${ev.hitCount}/2`, color: '#5588ff' });
      }
    }
    if (ev.type === 'motorcade_escort_stunned') {
      addEventMessage(`🏍💫 ${ev.hitterName} stunned a motorcycle escort!`, '#5599ff');
      if (ev.hitterId === myId) {
        showAnnouncement(`🏍 ESCORT STUNNED! Now hit the LIMO!`, '#5588ff', 2500);
      }
      triggerScreenShake(4, 300);
    }
    if (ev.type === 'motorcade_limo_hit') {
      if (ev.hitterId === myId) {
        const now2 = performance.now();
        effects.push({ type: 'xp', x: ev.x, y: ev.y - 10, time: now2, duration: 1000, text: `🚗 ${ev.hp}/${ev.maxHp}`, color: '#ffcc33' });
      }
    }
    if (ev.type === 'motorcade_outrage') {
      showAnnouncement(`🚨 THE MAYOR'S OUTRAGED! Cops flooding the streets!`, '#cc2200', 6000);
      addEventMessage(`🚨 MAYOR'S MOTORCADE OUTRAGE — every bird in the city gets +20 heat!`, '#ff3322');
      triggerScreenShake(12, 700);
      // Full-screen red flash
      window._motorcadeOutrageFlash = performance.now();
    }
    if (ev.type === 'motorcade_escort_recovered') {
      addEventMessage(`🏍 A motorcycle escort recovered!`, '#aaaaaa');
    }
    if (ev.type === 'motorcade_departed') {
      if (ev.attacked) {
        showAnnouncement(`🚗 MOTORCADE FLED! ${ev.topName} led the attack!`, '#3366cc', 4000);
        addEventMessage(`🚗 Mayor's Motorcade has fled Bird City! Chaos left in its wake.`, '#5588ff');
      } else {
        addEventMessage(`🚗 The Mayor's Motorcade passed through peacefully.`, '#aaaaaa');
      }
      window._motorcadeDir = null;
    }
    if (ev.type === 'motorcade_reward' && (ev.birdId === myId || ev.targetId === myId)) {
      showAnnouncement(`🚗 MOTORCADE! +${ev.xp} XP +${ev.coins}c!`, '#ffd700', 4000);
      const now2 = performance.now();
      effects.push({ type: 'xp', x: myX || 1500, y: myY ? myY - 30 : 1500, time: now2, duration: 1800, text: `🚗 +${ev.xp} XP +${ev.coins}c`, color: '#ffd700' });
    }

    // === GOLDEN PERCH (Session 112) ===
    if (ev.type === 'golden_perch_spawned') {
      showAnnouncement(`🏅 GOLDEN PERCH at ${ev.locationName}! Hold for 90s to win 700 XP + 450c!`, '#ffd700', 6000);
      addEventMessage(`🏅 The Golden Perch materializes at ${ev.locationName}! First to hold it wins!`, '#ffd700');
      triggerScreenShake(6, 300);
      window._goldenPerchDir = { x: ev.x, y: ev.y };
    }
    if (ev.type === 'golden_perch_claimed') {
      addEventMessage(`🏅 ${ev.holderName} claims the Golden Perch at ${ev.locationName}!`, '#ffd700');
      if (ev.holderId === myId) showAnnouncement(`🏅 YOU HOLD THE GOLDEN PERCH! Stay 90s to win!`, '#00ff88', 4000);
    }
    if (ev.type === 'golden_perch_contested') {
      addEventMessage(`🏅 ${ev.challengerName} fights for the Perch vs ${ev.holderName}!`, '#ff9900');
      if (ev.challengerId === myId) showAnnouncement(`🏅 YOU SEIZED THE GOLDEN PERCH!`, '#ffd700', 3000);
      if (ev.holderId === myId)     showAnnouncement(`🏅 PERCH STOLEN — TAKE IT BACK!`, '#ff4400', 3000);
    }
    if (ev.type === 'golden_perch_knocked_off') {
      addEventMessage(`🏅 ${ev.holderName} was knocked off the Perch at ${ev.locationName}!`, '#ff6600');
      if (ev.holderId === myId) showAnnouncement(`🏅 YOU LOST THE PERCH — RECLAIM IT!`, '#ff4400', 3000);
    }
    if (ev.type === 'golden_perch_milestone') {
      addEventMessage(`🏅 ${ev.holderName} has held the Perch for 30 seconds! 60 more to win!`, '#ffd700');
      if (ev.targetId === myId) showAnnouncement(`🏅 30s MILESTONE! 60 more seconds to WIN!`, '#ffd700', 3000);
    }
    if (ev.type === 'golden_perch_passive' && ev.targetId === myId) {
      const now2 = performance.now();
      effects.push({ type: 'xp', x: myX || 1500, y: myY ? myY - 20 : 1500, time: now2, duration: 1200, text: `🏅 +${ev.coins}c tribute`, color: '#ffd700' });
    }
    if (ev.type === 'golden_perch_won') {
      showAnnouncement(`🏅 ${ev.winnerGangTag ? '[' + ev.winnerGangTag + '] ' : ''}${ev.winnerName} WINS THE GOLDEN PERCH!`, '#ffd700', 7000);
      addEventMessage(`🏅 KING OF THE HILL: ${ev.winnerName} claims the Golden Perch at ${ev.locationName}!`, '#ffd700');
      triggerScreenShake(12, 600);
      if (ev.winnerId === myId) showAnnouncement(`🏅 YOU WIN! +${ev.xp} XP +${ev.coins}c — KING OF THE HILL!`, '#00ff88', 8000);
      window._goldenPerchDir = null;
    }
    if (ev.type === 'golden_perch_expired') {
      addEventMessage(`🏅 The Golden Perch at ${ev.locationName} faded away unclaimed.`, '#888888');
      window._goldenPerchDir = null;
    }
    if (ev.type === 'golden_perch_kingpin_bonus') {
      showAnnouncement(`👑🏅 KINGPIN WINS THE PERCH — Bonus Royal Decree granted!`, '#ffd700', 5000);
      addEventMessage(`👑🏅 The Kingpin claimed the Golden Perch! Bonus Decree awarded!`, '#ffd700');
    }

    // === SKY PIRATE AIRSHIP (Session 110) ===
    if (ev.type === 'sky_pirate_ship_spawn') {
      showAnnouncement(`☠️ SKY PIRATES! Airship inbound — poop it 20 times!`, '#dd4422', 5000);
      addEventMessage(`☠️ SKY PIRATE AIRSHIP crossing Bird City! Poop it down!`, '#ff6633');
      triggerScreenShake(8, 400);
      window._skyPirateDir = { x: ev.x, y: ev.y };
    }
    if (ev.type === 'sky_pirate_ship_hit') {
      if (ev.hitterId === myId) {
        const now2 = performance.now();
        effects.push({ type: 'xp', x: ev.x, y: ev.y - 10, time: now2, duration: 1000, text: `☠️ ${ev.hp}/${ev.maxHp}`, color: '#ff9944' });
      }
    }
    if (ev.type === 'pirate_guard_hit') {
      if (ev.hitterId === myId) {
        const now2 = performance.now();
        effects.push({ type: 'xp', x: ev.x, y: ev.y - 10, time: now2, duration: 1000, text: `🏴‍☠️ HIT!`, color: '#ff6622' });
      }
    }
    if (ev.type === 'pirate_guard_stunned') {
      addEventMessage(`🏴‍☠️ A pirate guard was STUNNED!`, '#ff9944');
    }
    if (ev.type === 'pirate_steal') {
      if (ev.birdId === myId) {
        showAnnouncement(`🏴‍☠️ A PIRATE STOLE ${ev.coins}c FROM YOU!`, '#ff4422', 2500);
        addEventMessage(`🏴‍☠️ ${ev.birdName} was robbed by a pirate guard! -${ev.coins}c`, '#ff6633');
        triggerScreenShake(6, 400);
      } else {
        addEventMessage(`🏴‍☠️ ${ev.birdName} got robbed by a pirate guard! -${ev.coins}c`, '#ff9944');
      }
    }
    if (ev.type === 'pirate_loot_spawned') {
      window._skyPirateLootIds = window._skyPirateLootIds || new Set();
      window._skyPirateLootIds.add(ev.id);
    }
    if (ev.type === 'pirate_loot_collected') {
      if (ev.birdId === myId) {
        showAnnouncement(`💰 PIRATE LOOT! +${ev.coins}c +40 XP!`, '#ffd700', 2500);
        const now2 = performance.now();
        effects.push({ type: 'xp', x: ev.x, y: ev.y - 10, time: now2, duration: 1200, text: `+${ev.coins}c 💰`, color: '#ffd700' });
      } else {
        addEventMessage(`💰 ${ev.birdName} grabbed pirate loot!`, '#aaaaaa');
      }
    }
    if (ev.type === 'sky_pirate_ship_destroyed') {
      showAnnouncement(`☠️💥 AIRSHIP DESTROYED! Grab the loot crates!`, '#ff4400', 6000);
      addEventMessage(`☠️💥 THE SKY PIRATE AIRSHIP GOES DOWN! Loot crates scattered!`, '#ff6633');
      triggerScreenShake(16, 800);
      window._skyPirateDir = null;
    }
    if (ev.type === 'sky_pirate_ship_reward' && ev.birdId === myId) {
      showAnnouncement(`☠️ AIRSHIP DOWN! +${ev.xp} XP +${ev.coins}c!`, '#ffd700', 4000);
      const now2 = performance.now();
      effects.push({ type: 'xp', x: myX || 1500, y: myY ? myY - 30 : 1500, time: now2, duration: 1800, text: `☠️ +${ev.xp} XP +${ev.coins}c`, color: '#ffd700' });
    }
    if (ev.type === 'sky_pirate_ship_escaped') {
      addEventMessage(ev.msg || `☠️ The Sky Pirates escaped!`, '#ff6633');
      if (ev.birdId === myId) {
        showAnnouncement(`☠️ PIRATES ROBBED YOU! -${ev.loot}c`, '#ff3322', 3000);
        triggerScreenShake(8, 500);
      }
      window._skyPirateDir = null;
    }

    // === HOT DOG CART — Frank's Cart (Session 115) ===
    if (ev.type === 'hotdog_cart_spawned') {
      showAnnouncement(`🌭 FRANK'S HOT DOG CART is open! Fly within 100px and press [H]!`, '#ff8800', 5000);
      addEventMessage(`🌭 Frank the Rat has set up his hot dog cart! Find him on the roads.`, '#ffaa44');
    }
    if (ev.type === 'hotdog_bought') {
      if (ev.targetId === myId) {
        const stolen = ev.isTheft;
        const extra = ev.isBlizzard ? ' ☕+warmth!' : ev.isHeatwave ? ' 🌡️discount!' : '';
        const msg = stolen
          ? `🌭 STOLE A HOT DOG from Frank! +100 food +speed +XP boost! (+10 heat)`
          : `🌭 FRANK'S HOT DOG! +100 food +1.4× speed 20s +5-hit ×1.3 XP${extra}`;
        showAnnouncement(msg, stolen ? '#ff4422' : '#ff8800', 3500);
        const now2 = performance.now();
        effects.push({ type: 'xp', x: myX || 1500, y: (myY || 1500) - 20, time: now2, duration: 1200, text: stolen ? '🌭 YOINK!' : '🌭 +100 food!', color: '#ff8800' });
      } else {
        addEventMessage(`🌭 ${ev.birdName} ${ev.isTheft ? 'STOLE a hot dog from Frank!' : 'bought a hot dog from Frank!'}`, '#ffaa44');
      }
    }
    if (ev.type === 'hotdog_cart_despawned') {
      addEventMessage(`🌭 Frank has packed up the cart and rolled away.`, '#888888');
    }

    // === RIVAL BIRD — "Ace" from Feather City (Session 116) ===
    if (ev.type === 'rival_bird_spawn') {
      screenShake(8, 500);
      showAnnouncement(ev.msg || `🔴 ACE FROM FEATHER CITY ARRIVES!`, '#cc1a1a', 5000);
      addEventMessage(`✈️ Rival Bird "Ace" targets ${ev.targetZoneName || 'Bird City'}! 10 HP — poop together!`, '#ff4444');
    }
    if (ev.type === 'rival_bird_hit') {
      const isMine = ev.hitterId === myId;
      effects.push({ type: 'float_text', x: ev.x, y: ev.y - 20, time: now, duration: 900, text: `🔴 -${ev.dmg}HP (${ev.hp}/${ev.maxHp})`, color: '#ff6666' });
      if (isMine) addEventMessage(`🔴 You hit Ace! ${ev.hp}/${ev.maxHp} HP left`, '#ff4444');
    }
    if (ev.type === 'rival_bird_taunt') {
      addEventMessage(ev.msg, '#ff6644');
    }
    if (ev.type === 'rival_bird_killed') {
      screenShake(12, 700);
      showAnnouncement(ev.msg || `🏆 ACE DEFEATED!`, '#ffd700', 6000);
      effects.push({ type: 'screen_flash', color: 'rgba(255,215,0,0.3)', duration: 400, time: now });
    }
    if (ev.type === 'rival_bird_reward' && ev.targetId === myId) {
      showAnnouncement(`🏆 FEATHER CITY DEFENDER! +${ev.xp} XP +${ev.coins}c (${ev.share}% contribution)`, '#ffd700', 4000);
    }
    if (ev.type === 'rival_bird_escaped') {
      showAnnouncement(ev.msg || `🔴 Ace ESCAPED! The city failed to defend!`, '#cc1a1a', 5000);
      addEventMessage(`🔴 Ace from Feather City escaped and mocked the city on his way out!`, '#ff6644');
    }
    if (ev.type === 'rival_bird_zone_drained') {
      addEventMessage(`🔴 Ace drained ${ev.zoneName || 'a territory'}! Zone capture progress reset!`, '#ff4444');
    }

    // === THE MOLE (Session 117) ===
    if (ev.type === 'mole_assigned' && ev.targetId === myId) {
      // Only the mole sees this
      const names = (ev.targetNames || []).join(', ');
      showAnnouncement(`🕵️ YOU ARE THE MOLE! Tag: ${names}\n(stay hidden for 60s, then revealed!)`, '#8800cc', 7000);
      addEventMessage(`🕵️ SECRET MISSION: Tag ${ev.targetNames.length} targets — you have 75 seconds!`, '#cc44ff');
    }
    if (ev.type === 'mole_mission_start') {
      // City-wide hint — no mole identity revealed yet
      addEventMessage(`🕵️ A mole has infiltrated Bird City… watch who's lurking near you!`, '#884488');
    }
    if (ev.type === 'mole_tag_success' && ev.moleId === myId) {
      // Only the mole sees this
      effects.push({ type: 'float_text', x: ev.x || camera.x, y: (ev.y || camera.y) - 20, time: now, duration: 1100, text: `🕵️ TAGGED! ${ev.taggedCount}/${ev.totalTargets}`, color: '#cc44ff' });
      addEventMessage(`🕵️ Tagged ${ev.targetName}! ${ev.taggedCount}/${ev.totalTargets} done!`, '#cc44ff');
    }
    if (ev.type === 'mole_alert') {
      screenShake(10, 600);
      showAnnouncement(`🕵️ MOLE ALERT! ${ev.moleName} was the mole! Tagged ${ev.taggedCount}/${ev.totalTargets} — POOP THEM for ${ev.taggedCount >= ev.totalTargets ? '600 XP!' : '80 XP!'}`, '#cc00ff', 6000);
      effects.push({ type: 'screen_flash', color: 'rgba(136,0,204,0.25)', duration: 500, time: now });
      addEventMessage(`🕵️ MOLE ALERT — ${ev.moleName} REVEALED! ${ev.taggedCount}/${ev.totalTargets} targets tagged. Poop them for bonus XP!`, '#cc44ff');
    }
    if (ev.type === 'mole_revenge_hit') {
      const isMe = ev.hitterId === myId;
      const isMole = gameState.self && gameState.self.mole && gameState.self.mole.isMole;
      if (isMe) {
        effects.push({ type: 'float_text', x: ev.x || camera.x, y: (ev.y || camera.y) - 20, time: now, duration: 900, text: `🕵️ HIT! ${ev.hitNum}`, color: '#cc44ff' });
        addEventMessage(`🕵️ You hit the Mole (${ev.hitNum})! +80 XP +40c!`, '#cc44ff');
      } else if (isMole) {
        effects.push({ type: 'float_text', x: ev.x || camera.x, y: (ev.y || camera.y) - 20, time: now, duration: 900, text: `💥 HIT ${ev.hitNum}`, color: '#ff4444' });
      } else {
        addEventMessage(`🕵️ ${ev.hitterName} hunts the Mole! (${ev.hitNum} hit)`, '#884488');
      }
    }
    if (ev.type === 'mole_success') {
      const isMe = ev.moleId === myId;
      screenShake(10, 600);
      if (isMe) {
        showAnnouncement(`🕵️ MISSION COMPLETE! You tagged all ${ev.totalTargets} targets! +600 XP +350c — now SURVIVE the MOLE ALERT!`, '#cc00ff', 7000);
        effects.push({ type: 'screen_flash', color: 'rgba(136,0,204,0.3)', duration: 600, time: now });
      } else {
        showAnnouncement(`🕵️ ${ev.moleName} completed the MOLE MISSION! +600 XP +350c — MOLE ALERT incoming!`, '#8800cc', 5000);
      }
      addEventMessage(`🕵️ ${ev.moleName} ${ev.moleGang ? `[${ev.moleGang}]` : ''} tagged ALL ${ev.totalTargets} targets! Master spy! MOLE ALERT starts now!`, '#cc44ff');
    }
    if (ev.type === 'mole_failed') {
      const isMe = ev.moleId === myId;
      if (isMe) {
        showAnnouncement(`🕵️ MISSION FAILED — only tagged ${ev.taggedCount}/${ev.totalTargets} targets.`, '#884488', 4000);
      }
      addEventMessage(`🕵️ The mole's cover is blown. Mission failed — only ${ev.taggedCount}/${ev.totalTargets} tagged.`, '#664466');
    }

    if (ev.type === 'hotdog_fail' && ev.targetId === myId) {
      showAnnouncement(ev.msg || `🌭 Can't buy right now!`, '#aa5500', 2000);
    }

    // === WING SURGE (Session 113) ===
    if (ev.type === 'wing_surge_activated') {
      const isMe = ev.birdId === myId;
      // World-space golden shockwave ring for everyone
      if (ev.x !== undefined && ev.y !== undefined) {
        window._wingSurgeFlash = { x: ev.x, y: ev.y, startTime: now, duration: 600 };
      }
      if (isMe) {
        // Golden screen flash
        effects.push({ type: 'screen_flash', color: 'rgba(255,220,0,0.45)', duration: 350, time: now });
        effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
        const hyperText = ev.hyper ? ' ×3 XP — HYPER MODE!' : ' ×2 XP!';
        showAnnouncement(`⚡ WING SURGE! ×1.8 SPEED${hyperText}\nCops can't arrest you — RAMPAGE!`, '#ffdd00', 4000);
      } else {
        // City-wide callout for others
        const tag = ev.gangTag ? `[${ev.gangTag}] ` : '';
        const hyperStr = ev.hyper ? ' 🔥 HYPER MODE!' : '';
        addEventMessage(`⚡ ${tag}${ev.birdName} ACTIVATES WING SURGE — +80% speed for 5s!${hyperStr}`, '#ffcc33');
      }
    }

    // === BURIED TREASURE SYSTEM (Session 114) ===
    if (ev.type === 'treasure_scroll_spawned') {
      showAnnouncement(`📜 A TREASURE SCROLL appeared somewhere in Bird City!\nFind it first to claim the ancient map!`, '#f4c542', 5000);
      addEventMessage(`📜 Treasure Scroll spotted on a city road — first bird wins the map!`, '#f4c542');
    }
    if (ev.type === 'treasure_scroll_picked_up') {
      if (ev.targetId === myId) {
        showAnnouncement(`📜 YOU FOUND THE TREASURE MAP!\n"${ev.clue}"\nFly to the X to dig — rivals will try to steal it!`, '#f4c542', 9000);
        addEventMessage(`📜 You hold the Treasure Map! Poop rivals poop you 3× to steal it.`, '#f4c542');
      } else {
        const tag = ev.holderGangTag ? `[${ev.holderGangTag}] ` : '';
        addEventMessage(`📜 ${tag}${ev.holderName} grabbed the Treasure Map! Poop them 3× to steal it!`, '#f4c542');
      }
    }
    if (ev.type === 'treasure_scroll_dropped') {
      addEventMessage(`📜 Treasure Map dropped at ${ev.holderName}'s last position — grab it quick!`, '#f4c542');
    }
    if (ev.type === 'treasure_scroll_expired') {
      addEventMessage(`📜 The Treasure Scroll crumbled to dust. Whoever held it waited too long.`, '#888');
    }
    if (ev.type === 'treasure_steal_hit') {
      if (ev.targetId === myId) {
        showAnnouncement(`💀 STEAL ATTEMPT! ${ev.stealerName} hit you ${ev.count}/${ev.needed} — KEEP MOVING!`, '#ff4444', 3000);
      } else {
        addEventMessage(`📜 ${ev.stealerName} hits ${ev.holderName} ${ev.count}/${ev.needed} for the map steal!`, '#f4c542');
      }
    }
    if (ev.type === 'treasure_map_stolen') {
      if (ev.thiefId === myId) {
        showAnnouncement(`📜 YOU STOLE THE TREASURE MAP!\n"${ev.clue}"\nNow FLY to the X before they steal it back!`, '#f4c542', 8000);
        effects.push({ type: 'screen_shake', intensity: 6, duration: 400, time: now });
      } else if (ev.victimId === myId) {
        showAnnouncement(`💀 YOUR MAP WAS STOLEN by ${ev.thiefName}!\nYou lose the treasure...`, '#ff4444', 5000);
      } else {
        const tag = ev.thiefGangTag ? `[${ev.thiefGangTag}] ` : '';
        addEventMessage(`📜 ${tag}${ev.thiefName} STOLE the map from ${ev.victimName}! Race is on!`, '#f4c542');
      }
    }
    if (ev.type === 'treasure_claimed') {
      if (ev.targetId === myId) {
        effects.push({ type: 'screen_shake', intensity: 10, duration: 600, time: now });
        effects.push({ type: 'screen_flash', color: 'rgba(244,197,66,0.5)', duration: 500, time: now });
        let msg = `💰 BURIED TREASURE CLAIMED! +${ev.xp} XP +${ev.coins}c`;
        if (ev.gotCrate && ev.crateItem) msg += `\n📦 BONUS: ${ev.crateItem.emoji} ${ev.crateItem.name}!`;
        showAnnouncement(msg, '#f4c542', 7000);
      } else {
        const tag = ev.holderGangTag ? `[${ev.holderGangTag}] ` : '';
        addEventMessage(`💰 ${tag}${ev.holderName} unearthed BURIED TREASURE! +${ev.xp} XP +${ev.coins}c`, '#f4c542');
      }
    }
    if (ev.type === 'treasure_map_expired') {
      if (ev.targetId === myId) {
        showAnnouncement(`📜 Your Treasure Map expired — you ran out of time!`, '#888', 4000);
      } else {
        addEventMessage(`📜 The Treasure Map expired. ${ev.holderName} never found the X.`, '#888');
      }
    }
  }

  function showAnnouncement(text, color, duration) {
    announcements.push({ text, color, time: performance.now(), duration: duration || 3000 });
  }

  function addEventMessage(text, color) {
    eventMessages.push({ text, color, time: performance.now() });
    if (eventMessages.length > 6) eventMessages.shift();
    updateEventFeed();
  }

  // ============================================================
  // BIRD CITY GAZETTE — newspaper overlay
  // ============================================================
  let gazetteCountdownInterval = null;

  function showGazette(data) {
    const overlay = document.getElementById('gazetteOverlay');
    if (!overlay) return;

    // Edition info
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const editionEl = document.getElementById('gazetteEditionLine');
    if (editionEl) editionEl.textContent = `EDITION #${data.edition} · ${dateStr}`;

    // Build headlines HTML
    const headlinesEl = document.getElementById('gazetteHeadlines');
    if (headlinesEl) {
      headlinesEl.innerHTML = '';
      data.headlines.forEach((h, i) => {
        const block = document.createElement('div');
        block.className = 'gazette-headline-block';

        const iconEl = document.createElement('div');
        iconEl.className = 'gazette-headline-icon';
        iconEl.textContent = h.icon;

        const headlineEl = document.createElement('div');
        headlineEl.className = 'gazette-headline-text';
        headlineEl.textContent = h.headline;

        const sublineEl = document.createElement('div');
        sublineEl.className = 'gazette-subline-text';
        sublineEl.textContent = '"' + h.subline + '"';

        block.appendChild(iconEl);
        block.appendChild(headlineEl);
        block.appendChild(sublineEl);

        // Add separator between headlines (not after last)
        if (i < data.headlines.length - 1) {
          const sep = document.createElement('div');
          sep.className = 'gazette-separator';
          sep.textContent = '— — —';
          block.appendChild(sep);
        }

        headlinesEl.appendChild(block);
      });
    }

    // Stats footer
    const footerEl = document.getElementById('gazetteFooter');
    if (footerEl) {
      const parts = [];
      if (data.summaryStats) {
        if (data.summaryStats.topCombo && data.summaryStats.topCombo.count > 0) {
          parts.push(`🔥 TOP COMBO: ${data.summaryStats.topCombo.name} × ${data.summaryStats.topCombo.count}`);
        }
        if (data.summaryStats.topPooper && data.summaryStats.topPooper.count > 0) {
          parts.push(`💩 TOP POOPER: ${data.summaryStats.topPooper.name} (${data.summaryStats.topPooper.count})`);
        }
        if (data.summaryStats.heists > 0) {
          parts.push(`🏦 HEISTS: ${data.summaryStats.heists}`);
        }
      }
      if (parts.length === 0) parts.push('A MOSTLY PEACEFUL NIGHT IN BIRD CITY');
      footerEl.textContent = parts.join('  ·  ');
    }

    // Show the overlay (use flex so content is centered)
    overlay.style.display = 'flex';

    // Screen shake to announce it
    effects.push({ type: 'screen_shake', time: performance.now(), duration: 500, intensity: 6 });

    // Auto-dismiss countdown (20 seconds)
    let remaining = 20;
    const countdownEl = document.getElementById('gazetteCountdown');
    if (gazetteCountdownInterval) clearInterval(gazetteCountdownInterval);
    if (countdownEl) countdownEl.textContent = `Auto-closes in ${remaining}s`;
    gazetteCountdownInterval = setInterval(() => {
      remaining--;
      if (countdownEl) countdownEl.textContent = `Auto-closes in ${remaining}s`;
      if (remaining <= 0) {
        clearInterval(gazetteCountdownInterval);
        gazetteCountdownInterval = null;
        overlay.style.display = 'none';
      }
    }, 1000);
  }

  function closeGazette() {
    const overlay = document.getElementById('gazetteOverlay');
    if (overlay) overlay.style.display = 'none';
    if (gazetteCountdownInterval) {
      clearInterval(gazetteCountdownInterval);
      gazetteCountdownInterval = null;
    }
  }

  function updateEventFeed() {
    const now = performance.now();
    eventFeed.innerHTML = '';
    for (const msg of eventMessages) {
      const age = now - msg.time;
      if (age > 8000) continue;
      const div = document.createElement('div');
      div.className = 'event-msg' + (age > 6000 ? ' fading' : '');
      div.style.color = msg.color;
      div.textContent = msg.text;
      eventFeed.appendChild(div);
    }
  }

  // ============================================================
  // INPUT: KEYBOARD (Desktop)
  // ============================================================
  window.addEventListener('keydown', (e) => {
    if (!joined) {
      if (e.key === 'Enter') joinGame();
      return;
    }

    // Escape key: close the gazette if it's open; decline duel challenge
    if (e.key === 'Escape') {
      const go = document.getElementById('gazetteOverlay');
      if (go && go.style.display !== 'none') { closeGazette(); return; }
      // Decline incoming duel challenge
      if (gameState && gameState.self && gameState.self.incomingChallenge) {
        socket.emit('action', { type: 'decline_duel' });
      }
    }

    // [H] — Hot Dog Cart buy (if near cart) or Bird Home toggle
    if (e.key.toLowerCase() === 'h') {
      if (gameState && gameState.hotDogCart && gameState.hotDogCart.nearMe) {
        socket.emit('action', { type: 'hotdog_buy' });
      } else {
        toggleBirdHome();
      }
      return;
    }

    // Don't process game input while Bird Home is open
    if (birdHomeVisible) return;

    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Tab') {
      e.preventDefault();
      leaderboardEl.style.display = leaderboardEl.style.display === 'none' ? 'block' : 'none';
    }
    if (e.key.toLowerCase() === 'q') {
      socket.emit('action', { type: 'caw' });
    }
    if (e.key.toLowerCase() === 'r') {
      // Race join when near START and race is open
      if (gameState && gameState.pigeonRace && gameState.pigeonRace.state === 'open' &&
          !gameState.pigeonRace.isRacer && lastNearRaceStart) {
        socket.emit('action', { type: 'race_join' });
      } else {
        socket.emit('action', { type: 'use_skill', slot: 0 });
      }
    }
    if (e.key === '1') {
      socket.emit('action', { type: 'use_skill', slot: 0 });
    }
    if (e.key === '2') {
      socket.emit('action', { type: 'use_skill', slot: 1 });
    }
    if (e.key === '3') {
      socket.emit('action', { type: 'use_skill', slot: 2 });
    }
    if (e.key.toLowerCase() === 'n') {
      if (gameState && gameState.self && gameState.self.inNest) {
        socket.emit('action', { type: 'wake_from_nest' });
      } else {
        socket.emit('action', { type: 'send_to_nest' });
        SoundEngine.nestSound();
      }
    }
    // Donut Cop bribe
    if (e.key.toLowerCase() === 'd') {
      if (gameState && gameState.donutCop && lastNearDonutCop) {
        if (gameState.donutCop.state === 'eating') {
          socket.emit('action', { type: 'donut_bribe' });
        }
      }
    }
    // Vending Machine — [X] to buy a random poop power-up
    if (e.key.toLowerCase() === 'x') {
      if (gameState && gameState.self && gameState.self.nearVendingMachine) {
        socket.emit('action', { type: 'vend_buy', machineIdx: gameState.self.nearVendingMachine.idx });
      }
    }
    // Night Market toggle [N]
    if (e.key.toLowerCase() === 'n') {
      if (nmOverlayOpen) {
        closeNightMarketOverlay();
      } else if (gameState && gameState.nightMarket && lastNearNightMarket) {
        openNightMarketOverlay();
      }
    }
    // Black Market toggle
    // Auction House bid [A]
    if (e.key.toLowerCase() === 'a') {
      const auctionOverlay = document.getElementById('auctionOverlay');
      if (auctionOverlay && auctionOverlay.style.display !== 'none') {
        // Overlay open — place bid
        window._placeAuctionBid();
      } else if (gameState && gameState.self && gameState.self.nearAuctionHouse &&
                 gameState.auction && (gameState.auction.state === 'bidding' || gameState.auction.state === 'gap')) {
        // Open the overlay
        window._renderAuctionOverlay();
        auctionOverlay.style.display = 'block';
      }
      e.preventDefault();
    }
    if (e.key.toLowerCase() === 'b') {
      if (gameState && gameState.blackMarket && lastNearBlackMarket) {
        toggleBlackMarketShop();
      }
    }
    // Don overlay toggle
    if (e.key.toLowerCase() === 'm') {
      if (donOverlayVisible) {
        hideDonOverlay();
      } else if (gameState && gameState.nearDon) {
        showDonOverlay();
      }
    }
    // Gang HQ toggle
    if (e.key.toLowerCase() === 'f') {
      if (gangHqVisible) {
        hideGangHq();
      } else {
        showGangHq();
      }
    }
    // Daily Challenges panel
    if (e.key.toLowerCase() === 'j') {
      if (dailyPanelVisible) {
        hideDailyPanel();
      } else {
        showDailyPanel();
      }
    }
    // Casino toggle
    if (e.key.toLowerCase() === 'c') {
      if (casinoOverlayVisible) {
        hideCasinoOverlay();
      } else if (gameState && lastNearCasino) {
        showCasinoOverlay();
      }
    }
    // Tattoo Parlor toggle
    if (e.key.toLowerCase() === 'p') {
      if (tattooOverlayVisible) {
        hideTattooOverlay();
      } else if (gameState && lastNearTattooParlor) {
        showTattooOverlay();
      }
    }
    // Bounty Board / City Hall toggle
    if (e.key.toLowerCase() === 'v') {
      if (bountyBoardVisible) {
        hideBountyBoard();
      } else if (gameState && gameState.nearCityHall) {
        showBountyBoard();
      }
    }
    // Prestige Panel
    if (e.key.toLowerCase() === 'u') {
      if (prestigePanelVisible) {
        hidePrestigePanel();
      } else {
        showPrestigePanel();
      }
    }
    // [K] — Skill Tree
    if (e.key.toLowerCase() === 'k') {
      toggleSkillTree();
    }

    // [L] — Constellation Panel
    if (e.key.toLowerCase() === 'l') {
      toggleConstellationPanel();
    }

    // [Z] — Royale Spectator Cheer Panel
    if (e.key.toLowerCase() === 'z') {
      toggleRoyaleCheerPanel();
    }

    // [Y] — Street Duel: accept rematch OR accept incoming challenge OR challenge nearest bird
    if (e.key.toLowerCase() === 'y') {
      if (gameState && gameState.self) {
        const rematch = gameState.self.duelRematch;
        const incoming = gameState.self.incomingChallenge;
        if (rematch && !rematch.iAccepted) {
          // Accept the rematch first
          socket.emit('action', { type: 'accept_rematch' });
          showTemporaryPrompt('🔄 Rematch accepted! Waiting for opponent…', 'streetDuelPrompt', 3000);
        } else if (incoming) {
          socket.emit('action', { type: 'accept_duel' });
        } else if (!gameState.self.streetDuelId) {
          // Challenge nearest bird within range
          const nearby = gameState.self.nearbyBirdsForDuel;
          if (nearby && nearby.length > 0) {
            socket.emit('action', { type: 'challenge_duel', targetId: nearby[0].id });
          } else {
            showTemporaryPrompt('⚔️ No birds nearby to challenge!', 'streetDuelPrompt', 2000);
          }
        }
      }
    }

    // Vigilante Marshal — [H] to accept the call and become the Marshal
    if (e.key.toLowerCase() === 'h') {
      if (gameState && gameState.vigilanteCall) {
        socket.emit('action', { type: 'accept_vigilante' });
      }
    }

    // Royal Decree — [O] to open Decree Panel (Kingpin only)
    if (e.key.toLowerCase() === 'o') {
      if (gameState && gameState.self && gameState.self.isKingpin) {
        toggleDecreePanel();
      }
    }

    // Bird City Idol — [I] to enter contest or vote
    if (e.key.toLowerCase() === 'i') {
      if (idolOverlayVisible) {
        hideIdolOverlay();
      } else if (gameState) {
        const idol = gameState.self && gameState.self.birdIdol;
        const nearStage = gameState.self && gameState.self.nearIdolStage;
        if (idol && idol.state === 'open' && nearStage && !idol.isContestant) {
          // Register as contestant
          socket.emit('action', { type: 'idol_enter' });
        } else if (idol && (idol.state === 'open' || idol.state === 'voting')) {
          // Open voting/status overlay
          showIdolOverlay();
        } else if (nearStage) {
          showIdolOverlay();
        }
      }
    }
    // Arena enter
    if (e.key.toLowerCase() === 'e') {
      if (gameState && gameState.arena && lastNearArena &&
          (gameState.arena.state === 'idle' || gameState.arena.state === 'waiting') &&
          !gameState.arena.isFighter) {
        socket.emit('action', { type: 'arena_enter' });
      }
      // Pigeon Coupe — enter, exit, or carjack
      if (gameState && gameState.self && gameState.pigeonCoupe) {
        if (gameState.self.drivingCoupeId) {
          // Exit the coupe
          socket.emit('action', { type: 'coupe_exit' });
        } else if (gameState.self.canCarjack) {
          // Carjack the occupied coupe
          socket.emit('action', { type: 'coupe_carjack' });
        } else if (gameState.self.nearPigeonCoupe && !gameState.pigeonCoupe.driverId) {
          // Enter the empty coupe
          socket.emit('action', { type: 'coupe_enter' });
        }
      }
      // Sewer entry / exit — press E near a manhole
      if (gameState && gameState.self && lastNearManholeId) {
        if (gameState.self.inSewer) {
          socket.emit('action', { type: 'exit_sewer' });
        } else {
          socket.emit('action', { type: 'enter_sewer' });
        }
      }
      // Radio Tower capture — hold E near tower (not near arena)
      if (gameState && gameState.self && worldData && worldData.radioTowerPos && !lastNearArena && towerCapState === null) {
        const s = gameState.self;
        const rt = worldData.radioTowerPos;
        const tdx = s.x - rt.x;
        const tdy = s.y - rt.y;
        const tDist = Math.sqrt(tdx * tdx + tdy * tdy);
        const rtState = gameState.radioTower;
        if (tDist < (rt.captureRadius || 90) && rtState && !rtState.isOwner) {
          towerCapState = { progress: 0, startTime: performance.now() };
        }
      }
    }
    // Radio Tower broadcast — press T when near and owning the tower
    if (e.key.toLowerCase() === 't') {
      if (gameState && gameState.radioTower && gameState.radioTower.isOwner && lastNearTower) {
        toggleTowerBroadcastMenu();
      }
    }
    // Graffiti spray / Gang Mural — hold G
    if (e.key.toLowerCase() === 'g') {
      if (gameState && gameState.self && worldData && sprayState === null && muralPaintState === null) {
        const self = gameState.self;

        // Priority: check mural zones first (gang members only)
        if (self.gangId && gameState.muralZones) {
          let nearestZone = null, nearestZoneDist = Infinity;
          for (const zone of gameState.muralZones) {
            const zdx = self.x - zone.x;
            const zdy = self.y - zone.y;
            const zdist = Math.sqrt(zdx * zdx + zdy * zdy);
            if (zdist < MURAL_PROXIMITY_CLIENT && zdist < nearestZoneDist) {
              nearestZoneDist = zdist;
              nearestZone = zone;
            }
          }
          if (nearestZone) {
            muralPaintState = { zoneId: nearestZone.id, zoneName: nearestZone.name, sendTimer: 0 };
            // Don't fall through to regular graffiti
          } else {
            // Regular building graffiti
            let nearest = -1, nearestDist = Infinity;
            worldData.buildings.forEach((b, idx) => {
              const bcx = b.x + b.w / 2;
              const bcy = b.y + b.h / 2;
              const ddx = self.x - bcx;
              const ddy = self.y - bcy;
              const dist = Math.sqrt(ddx * ddx + ddy * ddy);
              if (dist < 90 && dist < nearestDist) {
                nearestDist = dist;
                nearest = idx;
              }
            });
            if (nearest !== -1) {
              sprayState = { buildingIdx: nearest, progress: 0, startTime: performance.now() };
            }
          }
        } else {
          // Not in a gang — regular graffiti only
          let nearest = -1, nearestDist = Infinity;
          worldData.buildings.forEach((b, idx) => {
            const bcx = b.x + b.w / 2;
            const bcy = b.y + b.h / 2;
            const ddx = self.x - bcx;
            const ddy = self.y - bcy;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist < 90 && dist < nearestDist) {
              nearestDist = dist;
              nearest = idx;
            }
          });
          if (nearest !== -1) {
            sprayState = { buildingIdx: nearest, progress: 0, startTime: performance.now() };
          }
        }
      }
    }
    syncInput();
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    if (e.key.toLowerCase() === 'g') {
      sprayState = null;      // cancel spray on key release
      muralPaintState = null; // cancel mural painting
    }
    if (e.key.toLowerCase() === 'e') {
      towerCapState = null; // cancel tower capture on key release
    }
    syncInput();
  });

  // ============================================================
  // INPUT: VIRTUAL JOYSTICK (Mobile)
  // ============================================================
  const JOYSTICK_MAX_RADIUS = 55; // max distance thumb can move from center
  const JOYSTICK_DEADZONE = 0.15;  // ignore tiny movements

  if (joystickZone) {
    joystickZone.addEventListener('touchstart', onJoystickStart, { passive: false });
    joystickZone.addEventListener('touchmove', onJoystickMove, { passive: false });
    joystickZone.addEventListener('touchend', onJoystickEnd, { passive: false });
    joystickZone.addEventListener('touchcancel', onJoystickEnd, { passive: false });
  }

  // Get the fixed center of the joystick base
  function getJoystickCenter() {
    const rect = joystickBase.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function onJoystickStart(e) {
    e.preventDefault();
    if (joystick.active) return;

    const touch = e.changedTouches[0];
    const center = getJoystickCenter();

    joystick.active = true;
    joystick.touchId = touch.identifier;
    joystick.baseX = center.x;
    joystick.baseY = center.y;

    joystickThumb.classList.add('active');

    // Immediately process position
    processJoystickTouch(touch.clientX, touch.clientY);
  }

  function processJoystickTouch(touchX, touchY) {
    let dx = touchX - joystick.baseX;
    let dy = touchY - joystick.baseY;
    let dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp to max radius
    if (dist > JOYSTICK_MAX_RADIUS) {
      dx = (dx / dist) * JOYSTICK_MAX_RADIUS;
      dy = (dy / dist) * JOYSTICK_MAX_RADIUS;
      dist = JOYSTICK_MAX_RADIUS;
    }

    joystick.dx = dx / JOYSTICK_MAX_RADIUS;
    joystick.dy = dy / JOYSTICK_MAX_RADIUS;
    joystick.distance = dist / JOYSTICK_MAX_RADIUS;

    // Move thumb visually relative to its CSS home position
    joystickThumb.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';

    syncInput();
  }

  function onJoystickMove(e) {
    e.preventDefault();
    if (!joystick.active) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier !== joystick.touchId) continue;
      processJoystickTouch(touch.clientX, touch.clientY);
    }
  }

  function onJoystickEnd(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystick.touchId) {
        joystick.active = false;
        joystick.touchId = null;
        joystick.dx = 0;
        joystick.dy = 0;
        joystick.distance = 0;

        // Snap thumb back to center
        joystickThumb.classList.remove('active');
        joystickThumb.style.transform = 'translate(-50%, -50%)';

        syncInput();
      }
    }
  }

  // ============================================================
  // INPUT: ACTION BUTTONS (Mobile)
  // ============================================================

  function setupActionButton(el, onDown, onUp) {
    if (!el) return;

    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.add('pressed');
      if (onDown) onDown();
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove('pressed');
      if (onUp) onUp();
    }, { passive: false });

    el.addEventListener('touchcancel', (e) => {
      el.classList.remove('pressed');
      if (onUp) onUp();
    }, { passive: false });
  }

  // POOP button — hold to keep pooping
  setupActionButton(btnPoop,
    () => { mobileButtons.poop = true; syncInput(); },
    () => { mobileButtons.poop = false; syncInput(); }
  );

  // STEAL button — hold to steal
  setupActionButton(btnSteal,
    () => { mobileButtons.steal = true; syncInput(); },
    () => { mobileButtons.steal = false; syncInput(); }
  );

  // CAW button — tap
  setupActionButton(btnCaw,
    () => { if (socket && joined) socket.emit('action', { type: 'caw' }); },
    null
  );

  // ABILITY button — tap (use skill slot 0)
  setupActionButton(btnAbility,
    () => { if (socket && joined) socket.emit('action', { type: 'use_skill', slot: 0 }); },
    null
  );

  // HOME button — tap
  const btnHome = document.getElementById('btnHome');
  if (btnHome) {
    btnHome.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleBirdHome();
    }, { passive: false });
  }

  // Leaderboard toggle
  if (btnLeaderboard) {
    btnLeaderboard.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      leaderboardEl.style.display = leaderboardEl.style.display === 'none' ? 'block' : 'none';
    }, { passive: false });
  }

  // Nest button
  const btnNest = document.getElementById('btnNest');
  if (btnNest) {
    btnNest.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (gameState && gameState.self && gameState.self.inNest) {
        socket.emit('action', { type: 'wake_from_nest' });
      } else {
        socket.emit('action', { type: 'send_to_nest' });
        SoundEngine.nestSound();
      }
    }, { passive: false });
    btnNest.addEventListener('click', () => {
      if (gameState && gameState.self && gameState.self.inNest) {
        socket.emit('action', { type: 'wake_from_nest' });
      } else {
        socket.emit('action', { type: 'send_to_nest' });
        SoundEngine.nestSound();
      }
    });
  }

  // Prevent canvas touch from interfering
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });

  // ============================================================
  // SYNC INPUT -> SERVER
  // ============================================================
  function syncInput() {
    // Don't send input while Bird Home is open
    if (birdHomeVisible) {
      if (socket && joined) {
        socket.emit('input', { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false, space: false, e: false });
      }
      return;
    }
    // Merge keyboard + joystick + mobile buttons
    const kbW = !!(keys['w'] || keys['arrowup']);
    const kbA = !!(keys['a'] || keys['arrowleft']);
    const kbS = !!(keys['s'] || keys['arrowdown']);
    const kbD = !!(keys['d'] || keys['arrowright']);

    // Convert joystick to WASD (with deadzone)
    let joyW = false, joyA = false, joyS = false, joyD = false;
    if (joystick.distance > JOYSTICK_DEADZONE) {
      // Use the joystick angle to set directional input
      // But we also send the analog values for smoother movement
      if (joystick.dy < -JOYSTICK_DEADZONE) joyW = true;
      if (joystick.dy > JOYSTICK_DEADZONE) joyS = true;
      if (joystick.dx < -JOYSTICK_DEADZONE) joyA = true;
      if (joystick.dx > JOYSTICK_DEADZONE) joyD = true;
    }

    inputState.w = kbW || joyW;
    inputState.a = kbA || joyA;
    inputState.s = kbS || joyS;
    inputState.d = kbD || joyD;
    inputState.up = kbW || joyW;
    inputState.down = kbS || joyS;
    inputState.left = kbA || joyA;
    inputState.right = kbD || joyD;
    inputState.space = !!keys[' '] || mobileButtons.poop;
    inputState.e = !!keys['e'] || mobileButtons.steal;

    // Send analog joystick data for smoother movement on mobile
    const payload = { ...inputState };
    if (joystick.active && joystick.distance > JOYSTICK_DEADZONE) {
      payload.joyX = joystick.dx;
      payload.joyY = joystick.dy;
    }

    if (socket && joined) {
      socket.emit('input', payload);
    }
  }

  // ============================================================
  // JOIN GAME
  // ============================================================
  function joinGame(existingAccount) {
    let id, name;

    if (existingAccount) {
      // Auto-rejoin with saved account
      id = existingAccount.id;
      name = existingAccount.name;
    } else {
      // New join from the join screen
      name = nameInput.value.trim() || 'Bird_' + Math.random().toString(36).slice(2, 6);
      const saved = getSavedAccount();
      id = saved ? saved.id : generateId();
    }

    socket.emit('join', { id, name });
    saveAccount(id, name);
    nameInput.blur();
    tryLockLandscape();
  }

  function logout() {
    clearAccount();
    if (socket) socket.disconnect();
    joined = false;
    joinScreen.style.display = 'flex';
    hud.style.display = 'none';
    xpBar.style.display = 'none';
    xpBarText.style.display = 'none';
    poopCooldown.style.display = 'none';
    statsBar.style.display = 'none';
    leaderboardEl.style.display = 'none';
    minimapCanvas.style.display = 'none';
    nameInput.value = '';
    // Reconnect socket for fresh join
    socket.connect();
  }

  joinBtn.addEventListener('click', () => joinGame());
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinGame();
  });

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
    logoutBtn.addEventListener('touchstart', (e) => { e.preventDefault(); logout(); }, { passive: false });
  }

  // Flock accept/decline buttons
  if (flockAcceptBtn) {
    flockAcceptBtn.addEventListener('click', () => {
      if (socket && joined) socket.emit('action', { type: 'flock_accept' });
    });
    flockAcceptBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (socket && joined) socket.emit('action', { type: 'flock_accept' });
    }, { passive: false });
  }
  if (flockDeclineBtn) {
    flockDeclineBtn.addEventListener('click', () => {
      if (socket && joined) socket.emit('action', { type: 'flock_decline' });
    });
    flockDeclineBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (socket && joined) socket.emit('action', { type: 'flock_decline' });
    }, { passive: false });
  }

  // Mission board close
  if (missionBoardClose) {
    missionBoardClose.addEventListener('click', hideMissionBoard);
    missionBoardClose.addEventListener('touchstart', (e) => { e.preventDefault(); hideMissionBoard(); }, { passive: false });
  }

  // Don overlay buttons
  if (donAcceptBtn) {
    donAcceptBtn.addEventListener('click', () => {
      if (socket && joined) socket.emit('action', { type: 'don_accept' });
      hideDonOverlay();
    });
  }
  if (donCloseBtn) {
    donCloseBtn.addEventListener('click', hideDonOverlay);
  }

  // Daily Panel close button
  if (dailyPanelClose) {
    dailyPanelClose.addEventListener('click', hideDailyPanel);
    dailyPanelClose.addEventListener('touchstart', (e) => { e.preventDefault(); hideDailyPanel(); }, { passive: false });
  }
  // Daily HUD indicator click → open panel
  if (dailyHudIndicator) {
    dailyHudIndicator.addEventListener('click', () => {
      if (dailyPanelVisible) hideDailyPanel(); else showDailyPanel();
    });
  }

  // Night Market close button
  const nmCloseEl = document.getElementById('nmClose');
  if (nmCloseEl) {
    nmCloseEl.addEventListener('click', closeNightMarketOverlay);
    nmCloseEl.addEventListener('touchstart', (e) => { e.preventDefault(); closeNightMarketOverlay(); }, { passive: false });
  }

  // Black Market close button
  const bmShopCloseEl = document.getElementById('bmShopClose');
  if (bmShopCloseEl) {
    bmShopCloseEl.addEventListener('click', closeBmShop);
    bmShopCloseEl.addEventListener('touchstart', (e) => { e.preventDefault(); closeBmShop(); }, { passive: false });
  }

  // Sound toggle
  if (soundToggle) {
    function toggleSound() {
      const on = SoundEngine.toggle();
      soundToggle.textContent = on ? '\uD83D\uDD0A' : '\uD83D\uDD07';
    }
    soundToggle.addEventListener('click', toggleSound);
    soundToggle.addEventListener('touchstart', (e) => { e.preventDefault(); toggleSound(); }, { passive: false });
  }

  // ============================================================
  // UPDATE HUD
  // ============================================================
  function updateHUD() {
    if (!gameState || !gameState.self) return;
    const s = gameState.self;

    document.getElementById('hudBirdType').textContent = s.type.toUpperCase();
    document.getElementById('hudLevel').textContent = s.level;
    document.getElementById('hudPoops').textContent = s.totalPoops;
    document.getElementById('hudSteals').textContent = s.totalSteals;
    document.getElementById('hudHits').textContent = s.totalHits;
    document.getElementById('hudCried').textContent = s.humansCried;
    document.getElementById('hudFood').textContent = s.food;

    // Coins display
    let coinEl = document.getElementById('hudCoins');
    if (!coinEl) {
      // Create coin display on first call
      const hudEl = document.getElementById('hud');
      const coinDiv = document.createElement('div');
      coinDiv.innerHTML = '<span class="coin-display">\uD83D\uDCB0 <span id="hudCoins">0</span></span>';
      hudEl.appendChild(coinDiv);
      coinEl = document.getElementById('hudCoins');
    }
    if (coinEl) coinEl.textContent = s.coins || 0;

    // XP bar
    let cumXP = 0;
    for (let i = 0; i < s.level; i++) {
      cumXP += Math.floor(100 * Math.pow(1.5, i));
    }
    const currentLevelXP = s.xp - cumXP;
    const neededXP = s.nextLevelXP;
    const pct = neededXP > 0 ? Math.min(100, (currentLevelXP / neededXP) * 100) : 0;
    xpBarFill.style.width = pct + '%';
    const prestigeBadges = ['', '⚜️', '⚜️⚜️', '⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️⚜️'];
    const prestigePrefix = (s.prestige > 0) ? (prestigeBadges[Math.min(s.prestige, 5)] + ' ') : '';
    xpBarText.textContent = prestigePrefix + 'Lv.' + s.level + ' \u2014 ' + currentLevelXP + '/' + neededXP + ' XP';

    // Desktop poop cooldown text
    if (poopCooldown && poopCooldown.style.display !== 'none') {
      poopCooldown.textContent = s.poopReady ? '\uD83D\uDCA9 READY [SPACE]' : '\uD83D\uDCA9 reloading...';
      poopCooldown.style.color = s.poopReady ? '#4ade80' : '#ff6b6b';
    }

    // Mobile poop button state
    if (btnPoop) {
      if (s.poopReady) {
        btnPoop.classList.add('ready');
      } else {
        btnPoop.classList.remove('ready');
      }
    }

    // Stats bar
    statsBar.textContent = '\uD83D\uDC26 ' + serverStats.playersOnline + ' online | \uD83D\uDCA9 ' + serverStats.totalPoops + ' poops';

    // Time of day HUD
    const todHud = document.getElementById('timeOfDayHud');
    if (todHud && gameState.dayTime !== undefined) {
      const t = gameState.dayTime;
      // Map dayTime to a 24-hour clock (0.0 = 6:00 AM, full cycle ends at 6:00 AM next day)
      const hourOffset = 6; // start at 6 AM
      const hour24 = (hourOffset + Math.floor(t * 24)) % 24;
      const minute = Math.floor((t * 24 * 60) % 60);
      const ampm = hour24 < 12 ? 'AM' : 'PM';
      const hour12 = hour24 % 12 || 12;
      const timeStr = hour12 + ':' + String(minute).padStart(2, '0') + ' ' + ampm;
      const phaseEmoji = { day: '☀️', dusk: '🌆', night: '🌙', dawn: '🌅' };
      const emoji = phaseEmoji[gameState.dayPhase] || '☀️';
      const phaseColors = { day: '#ffff99', dusk: '#ffaa55', night: '#aaaaff', dawn: '#ffcc66' };
      todHud.style.color = phaseColors[gameState.dayPhase] || '#ffffff';
      todHud.style.borderColor = (phaseColors[gameState.dayPhase] || '#ffffff') + '44';
      todHud.textContent = emoji + ' ' + timeStr;
    }

    // Wanted Level HUD (star meter for this player)
    if (wantedHud && gameState.self) {
      const wLevel = gameState.self.wantedLevel || 0;
      if (wLevel === 0) {
        wantedHud.style.display = 'none';
      } else {
        wantedHud.style.display = 'block';
        const stars = '⭐'.repeat(wLevel) + '☆'.repeat(5 - wLevel);
        const labels = ['', 'WATCHED', 'PURSUIT', 'WANTED', 'DANGEROUS', 'MOST WANTED'];
        const colors = ['', '#ffff88', '#ffaa44', '#ff6644', '#ff3322', '#ff0000'];
        wantedHud.style.color = colors[wLevel];
        wantedHud.style.borderColor = colors[wLevel] + '99';
        wantedHud.className = wLevel >= 5 ? 'level5' : '';
        const copCount = gameState.cops ? gameState.cops.length : 0;
        const copText = copCount > 0 ? ' 🚔' + copCount : '';
        const cwText = gameState.self.crimeWave ? ' 🚨×2' : '';
        wantedHud.textContent = '🚨 ' + stars + ' ' + labels[wLevel] + copText + cwText;
      }
    }

    // Most Wanted Board — city-wide persistent top-3 criminal tracker
    const mwBoard = document.getElementById('mostWantedBoard');
    if (mwBoard) {
      const topThree = gameState.wantedTopThree;
      if (!topThree || topThree.length === 0) {
        mwBoard.style.display = 'none';
      } else {
        mwBoard.style.display = 'block';
        const lockdown = gameState.cityLockdown;
        const lockdownText = lockdown ? `<div class="mwb-lockdown">🚨 CITY LOCKDOWN ${Math.ceil((lockdown.endsAt - Date.now()) / 1000)}s</div>` : '';
        const myCoinsForHit = gameState.self ? (gameState.self.coins || 0) : 0;
        const rows = topThree.map((c, i) => {
          const medals = ['🥇', '🥈', '🥉'];
          const stars = '⭐'.repeat(c.level);
          const isMe = gameState.self && c.birdId === gameState.self.id;
          const meText = isMe ? ' 👈' : '';
          const tag = c.gangTag ? `<span style="color:#aaa;font-size:9px">[${c.gangTag}]</span> ` : '';
          const heatBar = Math.min(100, Math.round((c.heat / 200) * 100));
          // Quick-hit button (not for self, need 100c)
          const hitBtn = (!isMe && myCoinsForHit >= 100)
            ? `<button class="mwb-hit-btn" data-id="${c.birdId}" data-name="${c.name}" title="Place 100c hit via Don" style="margin-left:4px;background:rgba(120,0,0,0.85);color:#ff8888;border:1px solid #aa2222;border-radius:3px;font-size:8px;padding:1px 4px;cursor:pointer;vertical-align:middle;">💀100c</button>`
            : '';
          return `<div class="mwb-row${isMe ? ' mwb-me' : ''}">
            <span class="mwb-medal">${medals[i]}</span>
            <span class="mwb-name">${tag}${c.name}${meText}${hitBtn}</span>
            <span class="mwb-stars">${stars}</span>
            <div class="mwb-heat-bar"><div class="mwb-heat-fill" style="width:${heatBar}%;background:${c.level >= 4 ? '#ff3300' : c.level >= 3 ? '#ff6600' : '#ffaa00'}"></div></div>
          </div>`;
        }).join('');
        mwBoard.innerHTML = `<div class="mwb-title">🔴 MOST WANTED</div>${lockdownText}${rows}`;
        // Wire up quick-hit buttons
        mwBoard.querySelectorAll('.mwb-hit-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.dataset.id;
            const targetName = btn.dataset.name;
            if (!targetId || !socket || !joined) return;
            if (!confirm(`Place a 💀 100c hit on ${targetName}?\nFirst bird to poop them 3× claims the bounty!`)) return;
            socket.emit('action', { type: 'place_hit', targetId });
            showAnnouncement(`💀 HIT PLACED on ${targetName}!\nFirst to poop them 3× claims the bounty!`, '#ff4444', 3000);
          });
        });
        if (lockdown) {
          mwBoard.classList.add('mwb-lockdown-active');
        } else {
          mwBoard.classList.remove('mwb-lockdown-active');
        }
      }
    }

    // Royal Court Board — show below Most Wanted Board if court members exist
    const rcBoard = document.getElementById('royalCourtBoard');
    if (rcBoard) {
      const court = gameState.royalCourt;
      if (!court || court.length === 0) {
        rcBoard.style.display = 'none';
      } else {
        rcBoard.style.display = 'block';
        // Position below the Most Wanted Board
        const mwEl = document.getElementById('mostWantedBoard');
        if (mwEl && mwEl.style.display !== 'none') {
          const mwBottom = mwEl.getBoundingClientRect().bottom;
          rcBoard.style.top = (mwBottom + 6) + 'px';
        } else {
          rcBoard.style.top = '44px';
        }
        const TITLE_INFO = {
          Duke:  { emoji: '👑', color: '#ffd700' },
          Baron: { emoji: '🥈', color: '#c8c8d0' },
          Count: { emoji: '🥉', color: '#cd8c5a' },
        };
        const myId2 = gameState.self ? gameState.self.id : null;
        const rows = court.map(m => {
          const ti = TITLE_INFO[m.title] || { emoji: '🏅', color: '#ccc' };
          const isMe = m.birdId === myId2;
          const tag = m.gangTag ? `<span style="opacity:0.65;font-size:9px">[${m.gangTag}]</span> ` : '';
          const meText = isMe ? ' 👈' : '';
          return `<div class="rcb-row${isMe ? ' rcb-me' : ''}" style="color:${ti.color}">
            <span class="rcb-title-badge">${ti.emoji} ${m.title.toUpperCase()}</span>
            <span class="rcb-name">${tag}${m.name}${meText}</span>
            <span class="rcb-coins">${m.coins}c</span>
          </div>`;
        }).join('');
        // Noble challenge + perk buttons
        const myTitle = gameState.self ? gameState.self.myCourtTitle : null;
        const isDuke   = myTitle === 'Duke';
        const isBaron  = myTitle === 'Baron';
        const isCount  = myTitle === 'Count';
        const dcActive = !!(window._dukeChallenge);
        const bcActive = !!(window._baronChallenge);
        const ccActive = !!(window._countChallenge);
        const baronImportUsed = gameState.self ? !!gameState.self.baronImportUsed : false;
        const countIntelUsed  = gameState.self ? !!gameState.self.countIntelUsed  : false;

        let nobleBtns = '';
        if (isDuke) {
          nobleBtns += !dcActive
            ? `<button id="dukeChallengeIssueBtn" style="display:block;width:100%;margin-top:5px;background:linear-gradient(135deg,#7a5a00,#b38b00);color:#ffd700;border:1px solid #ffd70088;border-radius:4px;font-size:9px;font-weight:bold;padding:3px 6px;cursor:pointer;">🎯 ISSUE DUKE'S CHALLENGE</button>`
            : `<div style="font-size:9px;color:#ccaa00;margin-top:4px;text-align:center;">🎯 Challenge active…</div>`;
        }
        if (isBaron) {
          nobleBtns += !bcActive
            ? `<button id="baronChallengeIssueBtn" style="display:block;width:100%;margin-top:5px;background:linear-gradient(135deg,#202230,#363860);color:#c8c8d0;border:1px solid #a0a0c088;border-radius:4px;font-size:9px;font-weight:bold;padding:3px 6px;cursor:pointer;">📜 ISSUE BARON'S DECREE</button>`
            : `<div style="font-size:9px;color:#a0a0c0;margin-top:4px;text-align:center;">📜 Decree active…</div>`;
          // Noble Import perk
          nobleBtns += !baronImportUsed
            ? `<button id="baronImportBtn" style="display:block;width:100%;margin-top:4px;background:linear-gradient(135deg,#1a1a30,#2a2a50);color:#a0c8ff;border:1px solid #6080c088;border-radius:4px;font-size:9px;font-weight:bold;padding:3px 6px;cursor:pointer;">📦 NOBLE IMPORT — Buy Black Market item remotely</button>`
            : `<div style="font-size:9px;color:#606080;margin-top:3px;text-align:center;">📦 Noble Import used this tenure</div>`;
        }
        if (isCount) {
          nobleBtns += !ccActive
            ? `<button id="countChallengeIssueBtn" style="display:block;width:100%;margin-top:5px;background:linear-gradient(135deg,#2a1a08,#5a3a18);color:#cd8c5a;border:1px solid #b07040aa;border-radius:4px;font-size:9px;font-weight:bold;padding:3px 6px;cursor:pointer;">🗒 ISSUE COUNT'S EDICT</button>`
            : `<div style="font-size:9px;color:#a07040;margin-top:4px;text-align:center;">🗒 Edict active…</div>`;
          // City Intel perk
          nobleBtns += !countIntelUsed
            ? `<button id="countIntelBtn" style="display:block;width:100%;margin-top:4px;background:linear-gradient(135deg,#1a2810,#304820);color:#a0d880;border:1px solid #507040aa;border-radius:4px;font-size:9px;font-weight:bold;padding:3px 6px;cursor:pointer;">📡 CITY INTEL — Reveal next weather type privately</button>`
            : `<div style="font-size:9px;color:#506040;margin-top:3px;text-align:center;">📡 City Intel used this tenure</div>`;
        }

        // Tenure record (shows your own court history)
        let tenureHtml = '';
        if (gameState.self && (gameState.self.dukeTenures || gameState.self.baronTenures || gameState.self.countTenures)) {
          const dt = gameState.self.dukeTenures || 0;
          const bt = gameState.self.baronTenures || 0;
          const ct = gameState.self.countTenures || 0;
          tenureHtml = `<div style="font-size:8px;color:#888;margin-top:5px;border-top:1px solid rgba(255,255,255,0.1);padding-top:3px;text-align:center;">Your Court Record: ${dt>0?`👑×${dt} `:''}${bt>0?`🥈×${bt} `:''}${ct>0?`🥉×${ct}`:''}`;
          if (dt >= 5 || bt >= 10 || ct >= 15) tenureHtml += ` <span style="color:#ffd700;">⚜️ Noble Veteran</span>`;
          tenureHtml += `</div>`;
        }

        rcBoard.innerHTML = `<div class="rcb-title">⚜️ ROYAL COURT</div>${rows}${nobleBtns}${tenureHtml}`;
        const dcIssueBtn = document.getElementById('dukeChallengeIssueBtn');
        if (dcIssueBtn) dcIssueBtn.onclick = () => openDukeChallengeOverlay();
        const bcIssueBtn = document.getElementById('baronChallengeIssueBtn');
        if (bcIssueBtn) bcIssueBtn.onclick = () => openBaronChallengeOverlay();
        const ccIssueBtn = document.getElementById('countChallengeIssueBtn');
        if (ccIssueBtn) ccIssueBtn.onclick = () => openCountChallengeOverlay();
        const biBtn = document.getElementById('baronImportBtn');
        if (biBtn) biBtn.onclick = () => { socket.emit('action', { type: 'baron_noble_import', itemId: null }); };
        const ciBtn = document.getElementById('countIntelBtn');
        if (ciBtn) ciBtn.onclick = () => { socket.emit('action', { type: 'count_city_intel' }); };
      }
    }

    // Duke's Challenge HUD bar — shows progress/countdown when active
    const dcChallenge = window._dukeChallenge;
    const dcHud = document.getElementById('dukeChallengeHud');
    if (dcHud) {
      if (!dcChallenge) {
        dcHud.style.display = 'none';
      } else {
        const now2 = Date.now();
        const secsLeft = Math.max(0, Math.round((dcChallenge.expiresAt - now2) / 1000));
        const myProg = (gameState.self && window._dukeChallengeProgressData && window._dukeChallengeProgressData[gameState.self.id])
          ? window._dukeChallengeProgressData[gameState.self.id].progress
          : (gameState.self && gameState.self.myDukeChallengeProgress) || 0;
        const target = dcChallenge.target || 1;
        const pct = Math.min(100, Math.round((myProg / target) * 100));
        const amIDuke = gameState.self && gameState.self.isDukeChallengeDuke;
        const cancelBtn = amIDuke ? ' <button onclick="socket.emit(\'action\',{type:\'duke_challenge_cancel\'})" style="background:rgba(80,0,0,0.7);color:#ff8888;border:1px solid #aa2222;border-radius:2px;font-size:9px;padding:0 4px;cursor:pointer;margin-left:4px;">✕ Cancel (50% refund)</button>' : '';
        dcHud.style.display = 'block';
        dcHud.innerHTML = `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:bold;color:#ffd700;">👑 DUKE'S CHALLENGE</span>
          <span style="font-size:10px;color:#ffe066;">${dcChallenge.desc}</span>
          <span style="font-size:10px;color:#ffcc44;">${myProg}/${target} · ${secsLeft}s · 🏆${dcChallenge.reward}c</span>
          ${cancelBtn}
        </div>
        <div style="width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin-top:3px;">
          <div style="width:${pct}%;height:4px;background:#ffd700;border-radius:2px;transition:width 0.3s;"></div>
        </div>`;
      }
    }

    // Baron's Decree HUD bar
    const bcChallenge = window._baronChallenge;
    const bcHud = document.getElementById('baronChallengeHud');
    if (bcHud) {
      if (!bcChallenge) {
        bcHud.style.display = 'none';
      } else {
        const nowB = Date.now();
        const secsLeftB = Math.max(0, Math.round((bcChallenge.expiresAt - nowB) / 1000));
        const myProgB = (gameState.self && gameState.self.myBaronChallengeProgress) || 0;
        const targetB = bcChallenge.target || 1;
        const pctB = Math.min(100, Math.round((myProgB / targetB) * 100));
        const amIBaron = gameState.self && gameState.self.isBaronChallengeBaron;
        const cancelBtnB = amIBaron ? ' <button onclick="socket.emit(\'action\',{type:\'baron_challenge_cancel\'})" style="background:rgba(60,60,80,0.7);color:#aaaaee;border:1px solid #6666aa;border-radius:2px;font-size:9px;padding:0 4px;cursor:pointer;margin-left:4px;">✕ Cancel (50% refund)</button>' : '';
        // Position below Duke HUD if Duke HUD is also visible
        const dcHudVisible = dcChallenge && dcHud && dcHud.style.display !== 'none';
        bcHud.style.marginTop = dcHudVisible ? '38px' : '0';
        bcHud.style.display = 'block';
        bcHud.innerHTML = `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:11px;font-weight:bold;color:#c8c8d0;">🥈 BARON'S DECREE</span>
          <span style="font-size:10px;color:#d8d8e0;">${bcChallenge.desc}</span>
          <span style="font-size:10px;color:#b0b0c0;">${myProgB}/${targetB} · ${secsLeftB}s · 🏆${bcChallenge.reward}c</span>
          ${cancelBtnB}
        </div>
        <div style="width:100%;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;margin-top:3px;">
          <div style="width:${pctB}%;height:3px;background:#c8c8d0;border-radius:2px;transition:width 0.3s;"></div>
        </div>`;
      }
    }

    // Count's Edict HUD bar
    const ccChallenge = window._countChallenge;
    const ccHud = document.getElementById('countChallengeHud');
    if (ccHud) {
      if (!ccChallenge) {
        ccHud.style.display = 'none';
      } else {
        const nowC = Date.now();
        const secsLeftC = Math.max(0, Math.round((ccChallenge.expiresAt - nowC) / 1000));
        const myProgC = (gameState.self && gameState.self.myCountChallengeProgress) || 0;
        const targetC = ccChallenge.target || 1;
        const pctC = Math.min(100, Math.round((myProgC / targetC) * 100));
        const amICount = gameState.self && gameState.self.isCountChallengeCount;
        const cancelBtnC = amICount ? ' <button onclick="socket.emit(\'action\',{type:\'count_challenge_cancel\'})" style="background:rgba(60,40,20,0.7);color:#ddaa88;border:1px solid #996644;border-radius:2px;font-size:9px;padding:0 4px;cursor:pointer;margin-left:4px;">✕ Cancel (50% refund)</button>' : '';
        // Stack below Duke and Baron HUDs
        const bothAbove = (dcChallenge || bcChallenge);
        ccHud.style.marginTop = bothAbove ? '72px' : (dcChallenge || bcChallenge ? '38px' : '0');
        ccHud.style.display = 'block';
        ccHud.innerHTML = `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:10px;font-weight:bold;color:#cd8c5a;">🥉 COUNT'S EDICT</span>
          <span style="font-size:10px;color:#d8a070;">${ccChallenge.desc}</span>
          <span style="font-size:10px;color:#b07848;">${myProgC}/${targetC} · ${secsLeftC}s · 🏆${ccChallenge.reward}c</span>
          ${cancelBtnC}
        </div>
        <div style="width:100%;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;margin-top:3px;">
          <div style="width:${pctC}%;height:3px;background:#cd8c5a;border-radius:2px;transition:width 0.3s;"></div>
        </div>`;
      }
    }

    // Predator Danger HUD
    if (predatorHud && gameState.self && gameState.myPredatorWarnings) {
      const w = gameState.myPredatorWarnings;
      const hawkHits = w.hawkHits || 0;
      const catHits = w.catHits || 0;
      const pred = gameState.territoryPredators;
      const inHawkZone = w.hawk !== null && pred && pred.hawk && pred.hawk.state === 'hunting';
      const inCatZone = w.cat !== null && pred && pred.cat && pred.cat.state === 'hunting';
      if (inHawkZone || inCatZone) {
        predatorHud.style.display = 'block';
        const icon = inHawkZone ? '🦅' : '🐱';
        const hits = inHawkZone ? hawkHits : catHits;
        const hearts = '❤️'.repeat(Math.max(0, 3 - hits)) + '🖤'.repeat(hits);
        predatorHud.textContent = icon + ' DANGER ' + hearts + ' — POOP BACK or FLEE!';
        predatorHud.style.borderColor = inHawkZone ? 'rgba(255,85,0,0.9)' : 'rgba(204,68,255,0.9)';
        predatorHud.style.color = inHawkZone ? '#ff5500' : '#cc44ff';
      } else {
        predatorHud.style.display = 'none';
      }
    } else if (predatorHud) {
      predatorHud.style.display = 'none';
    }

    // Combo Streak HUD
    if (comboHud && gameState.self) {
      const combo = gameState.self.comboCount || 0;
      const expiresAt = gameState.self.comboExpiresAt || 0;
      const serverNow = Date.now(); // rough approximation
      if (combo < 2 || serverNow > expiresAt) {
        comboHud.style.display = 'none';
      } else {
        comboHud.style.display = 'block';
        let comboMult = '1×';
        if (combo >= 15) comboMult = '4× XP';
        else if (combo >= 10) comboMult = '3× XP';
        else if (combo >= 7) comboMult = '2.5× XP';
        else if (combo >= 5) comboMult = '2× XP';
        else if (combo >= 3) comboMult = '1.5× XP';
        const fire = combo >= 10 ? '🔥🔥' : '🔥';
        comboHud.textContent = fire + ' COMBO x' + combo + '  ' + comboMult;
        comboHud.className = combo >= 10 ? 'mega' : '';
      }
    }

    // Skill cooldown display (desktop) - show first equipped skill
    if (abilityCooldownEl && !isTouchDevice) {
      abilityCooldownEl.style.display = 'block';
      const skillNames = {
        poop_barrage: 'POOP BARRAGE',
        dive_bomb: 'DIVE BOMB',
        shadow_cloak: 'SHADOW CLOAK',
        eagle_eye: 'EAGLE EYE',
        ground_pound: 'GROUND POUND',
        decoy: 'DECOY',
        speed_burst: 'SPEED BURST',
        beacon_call: 'BEACON CALL',
      };
      const firstSkill = s.equippedSkills ? s.equippedSkills[0] : s.abilityName;
      const skillName = skillNames[firstSkill] || (firstSkill || '').toUpperCase();
      const cd = s.skillCooldowns && s.skillCooldowns[firstSkill] ? s.skillCooldowns[firstSkill] : 0;
      const ready = cd <= 0;
      if (ready) {
        abilityCooldownEl.textContent = '\u26A1 ' + skillName + ' READY [R]';
        abilityCooldownEl.style.color = '#a064ff';
      } else {
        abilityCooldownEl.textContent = '\u26A1 ' + skillName + ' ' + Math.ceil(cd / 1000) + 's';
        abilityCooldownEl.style.color = '#888';
      }

      // Show extra skill slots
      if (s.equippedSkills && s.equippedSkills.length > 1) {
        let extra = '';
        for (let i = 1; i < s.equippedSkills.length; i++) {
          if (!s.equippedSkills[i]) continue;
          const sk = s.equippedSkills[i];
          const skCd = s.skillCooldowns && s.skillCooldowns[sk] ? s.skillCooldowns[sk] : 0;
          const sName = skillNames[sk] || sk;
          if (skCd <= 0) {
            extra += ' | [' + (i + 1) + '] ' + sName + ' READY';
          } else {
            extra += ' | [' + (i + 1) + '] ' + sName + ' ' + Math.ceil(skCd / 1000) + 's';
          }
        }
        abilityCooldownEl.textContent += extra;
      }
    }

    // Mobile ability button - show first equipped skill
    if (btnAbility) {
      const firstSkill = s.equippedSkills ? s.equippedSkills[0] : s.abilityName;
      const cd = s.skillCooldowns && s.skillCooldowns[firstSkill] ? s.skillCooldowns[firstSkill] : 0;
      const ready = cd <= 0;
      if (ready) {
        btnAbility.classList.add('ready');
      } else {
        btnAbility.classList.remove('ready');
      }
      const skillIcons = {
        poop_barrage: '\uD83D\uDCA9',
        dive_bomb: '\uD83D\uDCA8',
        shadow_cloak: '\uD83D\uDC7B',
        eagle_eye: '\uD83E\uDD85',
        ground_pound: '\uD83D\uDCA5',
        decoy: '\uD83E\uDE9E',
        speed_burst: '\u26A1',
        beacon_call: '\uD83D\uDCE1',
      };
      const icon = skillIcons[firstSkill] || '\u26A1';
      const label = btnAbility.querySelector('.btn-label');
      const iconSpan = btnAbility.querySelector('span:first-child');
      if (iconSpan) iconSpan.textContent = icon;
      if (label) {
        const shortNames = {
          poop_barrage: 'BARRAGE',
          dive_bomb: 'DIVE',
          shadow_cloak: 'CLOAK',
          eagle_eye: 'EYE',
          ground_pound: 'POUND',
          decoy: 'DECOY',
          speed_burst: 'SPEED',
          beacon_call: 'BEACON',
        };
        label.textContent = shortNames[firstSkill] || 'SKILL';
      }
    }

    // Flock display in HUD
    if (s.flockName) {
      document.getElementById('hudBirdType').textContent = s.type.toUpperCase() + ' [' + s.flockName + ']';
    }

    // Flock invite popup
    if (s.flockInviteFrom) {
      flockInvitePopup.style.display = 'block';
      flockInviteText.textContent = 'Join "' + s.flockInviteFrom.flockName + '" with ' + s.flockInviteFrom.birdName + '?';
    } else {
      flockInvitePopup.style.display = 'none';
    }

    // Mission board: show when near Date Center
    if (s.nearDateCenter && !lastNearDateCenter && !s.activeMission) {
      showMissionBoard();
    }
    if (!s.nearDateCenter && lastNearDateCenter) {
      hideMissionBoard();
    }
    lastNearDateCenter = s.nearDateCenter;

    // Chaos meter bar
    if (chaosBar && gameState.chaosMeter !== undefined) {
      chaosBar.style.display = 'block';
      chaosFill.style.width = gameState.chaosMeter + '%';
      chaosLabel.textContent = gameState.chaosMeter > 0 ? 'CHAOS ' + gameState.chaosMeter + '%' : '';
    }

    // Flock Lobby: show when near date center
    if (s.nearDateCenter && gameState.lobbyBirds && !s.activeMission) {
      if (!flockLobbyVisible) {
        flockLobbyVisible = true;
        renderFlockLobby(gameState.lobbyBirds, s);
      }
    }
    if (!s.nearDateCenter && flockLobbyVisible) {
      flockLobbyVisible = false;
      flockLobby.style.display = 'none';
    }

    // Pigeon Mafia Don proximity
    if (gameState.nearDon && !lastNearDon) {
      donProximityPrompt.style.display = 'block';
    }
    if (!gameState.nearDon && lastNearDon) {
      donProximityPrompt.style.display = 'none';
      if (donOverlayVisible) hideDonOverlay();
    }
    // Update Don prompt text — mention tournament when signup is open
    if (gameState.nearDon) {
      const tourOpen = gameState.tournament && gameState.tournament.state === 'signup' && !gameState.tournament.isEntered;
      donProximityPrompt.innerHTML = tourOpen
        ? '🥊 Press <kbd>M</kbd> — TOURNAMENT SIGNUP OPEN!'
        : '🎩 Press <kbd>M</kbd> to meet The Don';
      donProximityPrompt.style.color = tourOpen ? '#ff9944' : '';
    }
    lastNearDon = !!gameState.nearDon;

    // Update Don overlay if open
    if (donOverlayVisible) renderDonOverlay();

    // Casino proximity
    const nearCas = !!gameState.nearCasino;
    if (nearCas && !lastNearCasino) {
      casinoProximityPrompt.style.display = 'block';
    }
    if (!nearCas && lastNearCasino) {
      casinoProximityPrompt.style.display = 'none';
      if (casinoOverlayVisible) hideCasinoOverlay();
    }
    lastNearCasino = nearCas;
    if (casinoOverlayVisible) updateCasinoDisplay();

    // Tattoo Parlor proximity
    const nearTat = !!gameState.nearTattooParlor;
    if (nearTat !== lastNearTattooParlor) {
      if (!nearTat && tattooOverlayVisible) hideTattooOverlay();
    }
    lastNearTattooParlor = nearTat;
    if (tattooOverlayVisible) renderTattooOverlay();

    // City Hall / Bounty Board proximity
    const nearCH = !!gameState.nearCityHall;
    if (nearCH && !lastNearCityHall) {
      const pool = gameState.dethronementPool || { total: 0 };
      const poolTxt = pool.total > 0 ? `💀 Pool: ${pool.total}c` : 'No pool yet — start one!';
      if (cityHallPrompt) {
        cityHallPrompt.innerHTML = `🏛 CITY HALL — Press [V] to open Bounty Board &amp; Witness Protection<br><span style="font:9px monospace;color:#ff8800;">${poolTxt}</span>`;
        cityHallPrompt.style.display = 'block';
      }
    }
    if (!nearCH && lastNearCityHall) {
      if (cityHallPrompt) cityHallPrompt.style.display = 'none';
      if (bountyBoardVisible) hideBountyBoard();
    }
    lastNearCityHall = nearCH;
    if (bountyBoardVisible) renderBountyBoard();

    // Update pool HUD pill and proximity prompt if near
    const pool = gameState.dethronementPool || { total: 0 };
    updatePoolHudPill(pool.total);
    updateElectionHudPill();
    if (nearCH && cityHallPrompt && cityHallPrompt.style.display !== 'none') {
      const el = gameState.election;
      const elNote = el && el.state === 'voting' ? ' · 🗳️ VOTE NOW!' : '';
      const poolTxtLive = pool.total > 0 ? `💀 Pool: ${pool.total}c · 🛡 Witness Protection: 500c${elNote}` : `🛡 Witness Protection 500c${elNote}`;
      cityHallPrompt.innerHTML = `🏛 CITY HALL — Press [V]<br><span style="font:9px monospace;color:#ff8800;">${poolTxtLive}</span>`;
    }

    // Gang HQ — update when open
    if (gangHqVisible) renderGangHq();

    // Bird City Idol overlay auto-refresh
    if (idolOverlayVisible) renderIdolOverlay();

    // Don mission HUD
    if (gameState.donMission) {
      const dm = gameState.donMission;
      const timeLeftS = Math.ceil((dm.timeLeft || 0) / 1000);
      donMissionHud.style.display = 'block';
      donMissionHud.textContent = `🎩 ${dm.title}: ${dm.progress}/${dm.target} (${timeLeftS}s)`;
    } else {
      donMissionHud.style.display = 'none';
    }

    // Active mission HUD
    if (s.activeMission) {
      activeMissionHud.style.display = 'block';
      missionTitle.textContent = s.activeMission.title;
      const pct = s.activeMission.target > 0 ? Math.min(100, (s.activeMission.progress / s.activeMission.target) * 100) : 0;
      missionProgressFill.style.width = pct + '%';
      const timeLeftS = Math.ceil(s.activeMission.timeLeft / 1000);
      missionTimeLeft.textContent = s.activeMission.progress + '/' + s.activeMission.target + ' | ' + timeLeftS + 's';
    } else {
      activeMissionHud.style.display = 'none';
    }

    // Night Market proximity check
    const nmPrompt = document.getElementById('nmProximityPrompt');
    if (gameState.nightMarket) {
      const isNearNM = s.nearNightMarket || false;
      if (isNearNM !== lastNearNightMarket) {
        lastNearNightMarket = isNearNM;
        if (!isNearNM && nmOverlayOpen) closeNightMarketOverlay();
      }
      if (nmPrompt) nmPrompt.style.display = isNearNM && !nmOverlayOpen ? 'block' : 'none';
    } else {
      lastNearNightMarket = false;
      if (nmOverlayOpen) closeNightMarketOverlay();
      if (nmPrompt) nmPrompt.style.display = 'none';
    }

    // Black Market proximity check
    const bmPrompt = document.getElementById('bmProximityPrompt');
    if (gameState.blackMarket) {
      const bmdx = s.x - gameState.blackMarket.x;
      const bmdy = s.y - gameState.blackMarket.y;
      const bmDist = Math.sqrt(bmdx * bmdx + bmdy * bmdy);
      const isNear = bmDist < 110;
      if (isNear !== lastNearBlackMarket) {
        lastNearBlackMarket = isNear;
        if (!isNear && bmShopOpen) closeBmShop();
      }
      if (bmPrompt) bmPrompt.style.display = isNear && !bmShopOpen ? 'block' : 'none';
    } else {
      lastNearBlackMarket = false;
      if (bmShopOpen) closeBmShop();
      if (bmPrompt) bmPrompt.style.display = 'none';
    }

    // Refresh open shop coins
    if (bmShopOpen) renderBmShop();

    // Donut Cop proximity check
    if (gameState.donutCop) {
      const dc = gameState.donutCop;
      const dcdx = s.x - dc.x;
      const dcdy = s.y - dc.y;
      const dcDist = Math.sqrt(dcdx * dcdx + dcdy * dcdy);
      const isNear = dcDist < 95;
      lastNearDonutCop = isNear;
      if (donutCopPrompt) {
        if (isNear) {
          if (dc.state === 'eating') {
            const wantedLevel = gameState.self ? (gameState.self.wantedLevel || 0) : 0;
            const bribeCost = wantedLevel > 0 ? 50 * wantedLevel : null;
            const bribeText = wantedLevel > 0 ? ` · [D] BRIBE (-${bribeCost}c, -1 star)` : ' · Not wanted';
            donutCopPrompt.textContent = `😋 Cop is EATING! Poop for 2× reward!${bribeText}`;
            donutCopPrompt.style.background = 'rgba(0,180,80,0.85)';
            donutCopPrompt.style.display = 'block';
          } else if (dc.state === 'stunned') {
            donutCopPrompt.textContent = '💫 Cop is STUNNED — recovering...';
            donutCopPrompt.style.background = 'rgba(180,150,0,0.85)';
            donutCopPrompt.style.display = 'block';
          } else {
            donutCopPrompt.textContent = '👮 Donut Cop — poop him or wait for eating!';
            donutCopPrompt.style.background = 'rgba(40,60,160,0.85)';
            donutCopPrompt.style.display = 'block';
          }
        } else {
          donutCopPrompt.style.display = 'none';
        }
      }
    } else {
      lastNearDonutCop = false;
      if (donutCopPrompt) donutCopPrompt.style.display = 'none';
    }

    // Vending Machine proximity
    const nearVM = s.nearVendingMachine || null;
    lastNearVendingMachine = nearVM;
    if (vendingMachinePrompt) {
      if (nearVM) {
        const EFFECT_NAMES = { spicy: '🌶️ SPICY', freeze: '🧊 FREEZE', rainbow: '🌈 RAINBOW', toxic: '💚 TOXIC', shock: '⚡ SHOCK' };
        if (nearVM.alreadyLoaded && s.vpPoopEffect) {
          const eff = EFFECT_NAMES[s.vpPoopEffect.type] || s.vpPoopEffect.type.toUpperCase();
          vendingMachinePrompt.innerHTML = `🪙 LOADED: ${eff} — Poop to use it!`;
          vendingMachinePrompt.style.background = 'rgba(20,120,20,0.9)';
          vendingMachinePrompt.style.display = 'block';
        } else if (nearVM.onCooldown) {
          vendingMachinePrompt.innerHTML = `🪙 VENDING MACHINE — On cooldown: ${nearVM.secsLeft}s`;
          vendingMachinePrompt.style.background = 'rgba(80,80,80,0.85)';
          vendingMachinePrompt.style.display = 'block';
        } else {
          vendingMachinePrompt.innerHTML = `🪙 POOP MACHINE — Press [X] to buy a random poop power (-20c)`;
          vendingMachinePrompt.style.background = 'rgba(20,40,120,0.9)';
          vendingMachinePrompt.style.display = 'block';
        }
      } else {
        vendingMachinePrompt.style.display = 'none';
      }
    }

    // Hot Dog Cart proximity prompt
    const hotDogCartPrompt = document.getElementById('hotDogCartPrompt');
    if (hotDogCartPrompt) {
      if (gameState.hotDogCart && gameState.hotDogCart.nearMe) {
        const hdc = gameState.hotDogCart;
        const isCrimeWave = gameState.crimeWave && gameState.crimeWave.active;
        const wantedLevel = (s && s.wantedLevel) || 0;
        const isBlizzard = gameState.weather && gameState.weather.type === 'blizzard';
        const isHeatwave = gameState.weather && gameState.weather.type === 'heatwave';
        let cost = 60;
        let label = '';
        if (isCrimeWave && wantedLevel >= 2) {
          label = '🌭 [H] STEAL THE HOT DOG (Crime Wave — FREE! +10 heat)';
        } else if (isHeatwave) {
          cost = 30;
          label = `🌭 [H] Buy Hot Dog — ${cost}c 🌡️ Heatwave discount! (+100 food, speed 1.4×, +XP)`;
        } else if (isBlizzard) {
          label = `🌭 [H] Buy Hot Dog — ${cost}c ❄️ Blizzard bonus: warmth included! (+100 food, speed 1.4×, +XP)`;
        } else {
          label = `🌭 [H] Buy Hot Dog from Frank — ${cost}c (+100 food, 1.4× speed 20s, 5-hit XP ×1.3)`;
        }
        hotDogCartPrompt.textContent = label;
        hotDogCartPrompt.style.display = 'block';
      } else {
        hotDogCartPrompt.style.display = 'none';
      }
    }

    // Street Duel HUD
    updateStreetDuelHud();

    // Duel Bet Panel (spectators)
    updateDuelBetPanel();

    // Auction House — update overlay when near and auction is active
    if (gameState.self && gameState.self.nearAuctionHouse && gameState.auction &&
        (gameState.auction.state === 'bidding' || gameState.auction.state === 'gap')) {
      if (typeof window._renderAuctionOverlay === 'function') window._renderAuctionOverlay();
    } else {
      const auctionOverlay = document.getElementById('auctionOverlay');
      if (auctionOverlay && auctionOverlay.style.display !== 'none') auctionOverlay.style.display = 'none';
    }

    // Tournament Bet Panel (spectators during championship rounds)
    updateTournamentBetPanel();

    // Active buffs HUD
    updateActiveBuffsHud();

    // Royal Decree banner
    updateDecreeBanner();
    // Refresh decree panel if open
    if (decreePanelVisible) renderDecreePanel();

    // Daily Challenges HUD indicator
    updateDailyHudIndicator();
    updatePrestigeHudPill();
    updateSkillTreeHud();
    // Refresh daily panel if open
    if (dailyPanelVisible) renderDailyPanel();
    // Refresh prestige panel if open
    if (prestigePanelVisible) renderPrestigePanel();
    // Refresh skill tree if open
    if (skillTreeVisible) renderSkillTree();
    // Refresh royale cheer panel — auto-close when royale ends or we're no longer spectating
    if (royaleCheerPanelVisible) {
      const ry = gameState.birdRoyale;
      if (!ry || ry.state !== 'active' || (ry.myStatus !== 'eliminated' && !ry.isSpectator)) {
        hideRoyaleCheerPanel();
      } else {
        renderRoyaleCheerPanel();
      }
    }

    // Signal Boost HUD
    const sbHud = document.getElementById('signalBoostHud');
    if (sbHud && gameState.radioTower) {
      const sbUntil = gameState.radioTower.signalBoostUntil;
      if (sbUntil && sbUntil > Date.now()) {
        const secsLeft = Math.max(0, Math.ceil((sbUntil - Date.now()) / 1000));
        sbHud.style.display = 'block';
        const timerEl = document.getElementById('signalBoostTimer');
        if (timerEl) timerEl.textContent = secsLeft + 's';
      } else {
        sbHud.style.display = 'none';
      }
    }

    // Egg Scramble HUD
    updateEggScrambleHud();
  }

  function updateEggScrambleHud() {
    const hudEl = document.getElementById('eggScrambleHud');
    if (!hudEl) return;

    const scramble = gameState && gameState.eggScramble;
    if (!scramble) {
      hudEl.style.display = 'none';
      return;
    }

    const secsLeft = Math.max(0, Math.ceil((scramble.endsAt - Date.now()) / 1000));
    const carrying = gameState.self && gameState.self.carryingEggId;
    const delivered = scramble.delivered || 0;
    const total = (scramble.eggs && scramble.eggs.length) || 3;

    hudEl.style.display = 'block';
    hudEl.innerHTML =
      '<span style="font-size:16px">🥚</span> ' +
      '<b>EGG SCRAMBLE</b> ' +
      delivered + '/' + total + ' delivered' +
      (secsLeft > 0 ? ' &nbsp;·&nbsp; ' + secsLeft + 's' : '') +
      (carrying ? ' &nbsp;·&nbsp; <span style="color:#ffd700">YOU HAVE AN EGG — FLY TO 🪺!</span>' : '');
  }

  // ============================================================
  // ARENA UI — proximity prompt + fight HUD
  // ============================================================
  function updateArenaUI() {
    if (!gameState || !gameState.self || !worldData || !worldData.arena) return;

    const s = gameState.self;
    const arenaZone = worldData.arena;
    const arena = gameState.arena;

    // Proximity check (server-side distance to arena center)
    const adx = s.x - arenaZone.x;
    const ady = s.y - arenaZone.y;
    const aDist = Math.sqrt(adx * adx + ady * ady);
    const isNear = aDist < arenaZone.radius + 80;
    lastNearArena = isNear;

    // Show proximity prompt when near and not already a fighter
    if (arenaProximityPrompt) {
      const canEnter = arena && (arena.state === 'idle' || arena.state === 'waiting') && !arena.isFighter;
      if (isNear && canEnter) {
        const potText = arena.pot > 0 ? ' (pot: ' + arena.pot + 'c)' : '';
        const fightText = arena.fighterCount > 0 ? ' — ' + arena.fighterCount + ' waiting' : '';
        arenaProximityPrompt.innerHTML = '⚔️ Press <kbd>E</kbd> to ENTER ARENA (-' + arenaZone.entryFee + 'c)' + fightText + potText;
        arenaProximityPrompt.style.display = 'block';
      } else {
        arenaProximityPrompt.style.display = 'none';
      }
    }

    // Arena fight HUD — shown when player is an active fighter
    if (arenaHud) {
      if (!arena || !arena.isFighter) {
        arenaHud.style.display = 'none';
        return;
      }

      arenaHud.style.display = 'block';

      if (arena.state === 'waiting') {
        const secsUntil = arena.waitUntil ? Math.max(0, Math.ceil((arena.waitUntil - Date.now()) / 1000)) : '?';
        arenaHud.innerHTML = '⚔️ WAITING FOR FIGHTERS (' + arena.fighterCount + ' in queue) — starts in ~' + secsUntil + 's';
        arenaHud.className = '';
      } else if (arena.state === 'countdown') {
        const secsLeft = arena.countdownUntil ? Math.max(0, Math.ceil((arena.countdownUntil - Date.now()) / 1000)) : '?';
        arenaHud.innerHTML = '⚔️ FIGHT STARTS IN <span style="color:#ffcc00;font-size:18px">' + secsLeft + '</span>s!';
        arenaHud.className = '';
      } else if (arena.state === 'fighting') {
        const myHp = arena.myArenaHp !== null ? arena.myArenaHp : 0;
        const secsLeft = arena.fightEndsAt ? Math.max(0, Math.ceil((arena.fightEndsAt - Date.now()) / 1000)) : '?';
        const timerColor = secsLeft <= 15 ? '#ff4444' : '#ffcc44';
        const hearts = '♥'.repeat(Math.max(0, myHp)) + '♡'.repeat(Math.max(0, 3 - myHp));
        let opponentHtml = '';
        if (arena.fighters) {
          for (const f of arena.fighters) {
            if (f.id === s.id) continue;
            const fHearts = '♥'.repeat(Math.max(0, f.arenaHp)) + '♡'.repeat(Math.max(0, f.maxArenaHp - f.arenaHp));
            const eliminated = f.eliminated ? ' <span style="color:#888">(out)</span>' : '';
            opponentHtml += ' | ' + f.name + ': <span style="color:#ff8888">' + fHearts + '</span>' + eliminated;
          }
        }
        arenaHud.innerHTML = '⚔️ YOU: <span style="color:#ff4400">' + hearts + '</span>  ' +
          '<span style="color:' + timerColor + '">⏱' + secsLeft + 's</span>' +
          (opponentHtml || '');
        arenaHud.className = 'fighting';
      } else {
        arenaHud.style.display = 'none';
      }
    }
  }

  // ============================================================
  // FOOD TRUCK HEIST UI — proximity prompt
  // ============================================================
  // ============================================================
  // STREET DUEL HUD — incoming challenge + active duel display
  // ============================================================

  function showTemporaryPrompt(text, elemId, duration) {
    const el = document.getElementById(elemId);
    if (!el) return;
    el.textContent = text;
    el.style.display = 'block';
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => { el.style.display = 'none'; }, duration);
  }

  function updateStreetDuelHud() {
    if (!gameState || !gameState.self) return;
    const s = gameState.self;
    const now = Date.now();
    const challengeEl = document.getElementById('streetDuelChallenge');
    const duelHudEl = document.getElementById('streetDuelHud');
    const duelPromptEl = document.getElementById('streetDuelPrompt');

    // Show/hide incoming challenge overlay
    if (challengeEl) {
      const incoming = s.incomingChallenge;
      if (incoming && incoming.expiresAt > now) {
        challengeEl.style.display = 'block';
        const nameEl = document.getElementById('streetDuelChallengerName');
        const potEl = document.getElementById('streetDuelPot');
        const timerEl = document.getElementById('streetDuelChallengeTimer');
        if (nameEl) nameEl.textContent = '⚔️ ' + incoming.challengerName + ' challenges you!';
        if (potEl) potEl.textContent = '💰 Pot: ' + incoming.pot + 'c';
        if (timerEl) timerEl.textContent = Math.max(0, Math.ceil((incoming.expiresAt - now) / 1000)) + 's to respond';
      } else {
        challengeEl.style.display = 'none';
      }
    }

    // Show [Y] challenge prompt if a challengeable bird is nearby (and not in duel)
    if (duelPromptEl && !s.streetDuelId && !s.incomingChallenge) {
      const nearby = s.nearbyBirdsForDuel;
      if (nearby && nearby.length > 0 && duelPromptEl.style.display === 'none') {
        // Only show if no timer is running
        if (!duelPromptEl._challengeTarget || duelPromptEl._challengeTarget !== nearby[0].name) {
          duelPromptEl._challengeTarget = nearby[0].name;
          duelPromptEl.textContent = '⚔️ Press [Y] to challenge ' + nearby[0].name + ' to a duel';
          duelPromptEl.style.display = 'block';
          clearTimeout(duelPromptEl._challengeShowTimer);
          duelPromptEl._challengeShowTimer = setTimeout(() => {
            duelPromptEl.style.display = 'none';
            duelPromptEl._challengeTarget = null;
          }, 3000);
        }
      } else if (!nearby || nearby.length === 0) {
        duelPromptEl._challengeTarget = null;
      }
    } else if (duelPromptEl && (s.streetDuelId || s.incomingChallenge)) {
      duelPromptEl.style.display = 'none';
    }

    // Show active duel fight HUD
    if (duelHudEl) {
      if (s.streetDuelId && gameState.streetDuels) {
        const duel = gameState.streetDuels.find(d => d.id === s.streetDuelId);
        if (duel) {
          duelHudEl.style.display = 'block';
          const iAmChallenger = duel.challengerId === s.id;
          const myId = s.id;
          const oppId = iAmChallenger ? duel.targetId : duel.challengerId;
          const oppName = iAmChallenger ? duel.targetName : duel.challengerName;
          const myHp = duel.hp[myId] || 0;
          const oppHp = duel.hp[oppId] || 0;
          const hearts = (n) => (n >= 3 ? '❤️❤️❤️' : n === 2 ? '❤️❤️🖤' : n === 1 ? '❤️🖤🖤' : '💀💀💀');
          const secsLeft = Math.max(0, Math.ceil((duel.expiresAt - now) / 1000));
          const myNameEl = document.getElementById('streetDuelMyName');
          const myHeartsEl = document.getElementById('streetDuelMyHearts');
          const oppNameEl = document.getElementById('streetDuelOppName');
          const oppHeartsEl = document.getElementById('streetDuelOppHearts');
          const timerEl = document.getElementById('streetDuelTimer');
          const potEl = document.getElementById('streetDuelPotDisplay');
          if (myNameEl) myNameEl.textContent = s.name;
          if (myHeartsEl) myHeartsEl.textContent = hearts(myHp);
          if (oppNameEl) oppNameEl.textContent = oppName;
          if (oppHeartsEl) oppHeartsEl.textContent = hearts(oppHp);
          if (timerEl) timerEl.textContent = '⏱ ' + secsLeft + 's · POOP to knock out!';
          if (potEl) potEl.textContent = '💰 Pot: ' + duel.pot + 'c';
        } else {
          duelHudEl.style.display = 'none';
        }
      } else {
        duelHudEl.style.display = 'none';
      }
    }
  }

  // ============================================================
  // DUEL BET PANEL — spectator betting on active street duels
  // ============================================================
  let _duelBetAmount = 50; // remember last bet amount

  function updateDuelBetPanel() {
    const el = document.getElementById('duelBetPanel');
    if (!el || !gameState || !gameState.self) { if (el) el.style.display = 'none'; return; }
    const s = gameState.self;
    const now = Date.now();
    const db = s.duelBetting;

    if (!db || db.windowUntil <= now) {
      el.style.display = 'none';
      return;
    }

    const secsLeft = Math.max(0, Math.ceil((db.windowUntil - now) / 1000));
    const total = db.total || 0;

    // Odds display
    const odds1 = total > 0 ? ((total / Math.max(db.bets1 || 1, 1)).toFixed(1) + '×') : '?';
    const odds2 = total > 0 ? ((total / Math.max(db.bets2 || 1, 1)).toFixed(1) + '×') : '?';

    let html = '';
    html += '<div style="color:#ff6666;font-size:13px;text-align:center;margin-bottom:6px;letter-spacing:1px;">🎰 BET ON THE DUEL</div>';
    html += '<div style="color:#ff9999;font-size:10px;text-align:center;margin-bottom:8px;">⏱ ' + secsLeft + 's · pool: ' + total + 'c</div>';

    if (db.myBet) {
      // Already bet
      const onName = db.myBet.onId === db.fighter1Id ? db.fighter1Name : db.fighter2Name;
      html += '<div style="background:rgba(60,20,0,0.8);border:1px solid #ff8800;border-radius:8px;padding:6px 8px;text-align:center;color:#ffcc66;font-size:11px;">';
      html += '✅ Bet: ' + db.myBet.amount + 'c on <b>' + onName + '</b><br>';
      html += '<span style="color:#ffaa44;font-size:10px;">Waiting for duel result…</span>';
      html += '</div>';
    } else {
      // Betting interface
      html += '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">';
      html += '<input id="duelBetAmountInput" type="number" min="10" max="300" value="' + _duelBetAmount + '" ';
      html += 'style="width:70px;background:rgba(40,0,0,0.8);color:#ffaaaa;border:1px solid #882222;border-radius:6px;padding:3px 6px;font:bold 11px \'Courier New\',monospace;text-align:center;" ';
      html += 'oninput="window._duelBetAmountInput=this.value" />';
      html += '<span style="color:#ff9999;font-size:10px;">coins (10–300)</span>';
      html += '</div>';

      // Fighter 1 button
      html += '<button onclick="window._placeDuelBet(\'' + db.duelId + '\',\'' + db.fighter1Id + '\')" ';
      html += 'style="display:block;width:100%;margin-bottom:5px;background:rgba(20,40,80,0.9);color:#88aaff;';
      html += 'border:1px solid #4466aa;padding:6px 8px;border-radius:8px;cursor:pointer;font:bold 11px \'Courier New\',monospace;text-align:left;">';
      html += '🥊 ' + db.fighter1Name + '<br>';
      html += '<span style="color:#aabbdd;font-size:10px;">' + (db.bets1 || 0) + 'c bet · ' + odds1 + ' payout</span>';
      html += '</button>';

      // Fighter 2 button
      html += '<button onclick="window._placeDuelBet(\'' + db.duelId + '\',\'' + db.fighter2Id + '\')" ';
      html += 'style="display:block;width:100%;background:rgba(80,20,20,0.9);color:#ffaaaa;';
      html += 'border:1px solid #aa4444;padding:6px 8px;border-radius:8px;cursor:pointer;font:bold 11px \'Courier New\',monospace;text-align:left;">';
      html += '🥊 ' + db.fighter2Name + '<br>';
      html += '<span style="color:#ddbbbb;font-size:10px;">' + (db.bets2 || 0) + 'c bet · ' + odds2 + ' payout</span>';
      html += '</button>';
    }

    el.innerHTML = html;
    el.style.display = 'block';
  }

  // Global helper called from inline buttons
  window._placeDuelBet = function(duelId, onId) {
    const inputEl = document.getElementById('duelBetAmountInput');
    const rawVal = inputEl ? parseInt(inputEl.value) : _duelBetAmount;
    const amount = Math.max(10, Math.min(300, isNaN(rawVal) ? 50 : rawVal));
    _duelBetAmount = amount;
    socket.emit('action', { type: 'bet_on_duel', duelId, onId, amount });
  };

  // ============================================================
  // TOURNAMENT SPECTATOR BETTING PANEL
  // ============================================================
  let _tournamentBetAmount = 50;

  function updateTournamentBetPanel() {
    const el = document.getElementById('tournamentBetPanel');
    if (!el || !gameState || !gameState.self) { if (el) el.style.display = 'none'; return; }
    const tb = gameState.tournamentBetting;
    const now = Date.now();

    if (!tb || tb.length === 0) {
      el.style.display = 'none';
      return;
    }

    // Filter to matches still within the bet window
    const openMatches = tb.filter(m => m.windowUntil > now);
    if (openMatches.length === 0) {
      el.style.display = 'none';
      return;
    }

    const round = openMatches[0].round || 1;
    const secsLeft = Math.max(0, Math.ceil((Math.min(...openMatches.map(m => m.windowUntil)) - now) / 1000));

    let html = '';
    html += `<div style="color:#ffcc44;font-size:13px;text-align:center;margin-bottom:4px;letter-spacing:1px;">🥊 ROUND ${round} BETTING</div>`;
    html += `<div style="color:#ffaa66;font-size:10px;text-align:center;margin-bottom:8px;">⏱ ${secsLeft}s · Bet on any match!</div>`;

    // Amount input
    html += '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">';
    html += `<input id="tournamentBetAmountInput" type="number" min="10" max="300" value="${_tournamentBetAmount}" `;
    html += 'style="width:70px;background:rgba(40,20,0,0.8);color:#ffdd88;border:1px solid #886622;border-radius:6px;padding:3px 6px;font:bold 11px \'Courier New\',monospace;text-align:center;" ';
    html += 'oninput="window._tournamentBetAmountInput=this.value" />';
    html += '<span style="color:#ffaa66;font-size:10px;">coins (10–300)</span>';
    html += '</div>';

    for (const match of openMatches) {
      const total = match.total || 0;
      const odds1 = total > 0 ? ((total / Math.max(match.bets1 || 1, 1)).toFixed(1) + '×') : '?';
      const odds2 = total > 0 ? ((total / Math.max(match.bets2 || 1, 1)).toFixed(1) + '×') : '?';

      if (match.myBet) {
        const onName = match.myBet.onId === match.fighter1Id ? match.fighter1Name : match.fighter2Name;
        html += `<div style="background:rgba(60,30,0,0.8);border:1px solid #cc8800;border-radius:8px;padding:6px 8px;margin-bottom:6px;text-align:center;color:#ffcc66;font-size:11px;">`;
        html += `✅ <b>${match.fighter1Name} vs ${match.fighter2Name}</b><br>`;
        html += `Bet: ${match.myBet.amount}c on <b>${onName}</b> · Pool: ${total}c`;
        html += `</div>`;
      } else {
        html += `<div style="margin-bottom:6px;">`;
        html += `<div style="color:#ffaa44;font-size:9px;margin-bottom:3px;text-align:center;">— ${match.fighter1Name} vs ${match.fighter2Name} · Pool: ${total}c —</div>`;
        // Fighter 1 button
        html += `<button onclick="window._placeTournamentBet('${match.duelId}','${match.fighter1Id}')" `;
        html += `style="display:block;width:100%;margin-bottom:4px;background:rgba(20,40,80,0.9);color:#88aaff;`;
        html += `border:1px solid #4466aa;padding:5px 8px;border-radius:7px;cursor:pointer;font:bold 11px 'Courier New',monospace;text-align:left;">`;
        html += `🥊 ${match.fighter1Name}<br>`;
        html += `<span style="color:#aabbdd;font-size:10px;">${match.bets1 || 0}c bet · ${odds1} payout</span>`;
        html += `</button>`;
        // Fighter 2 button
        html += `<button onclick="window._placeTournamentBet('${match.duelId}','${match.fighter2Id}')" `;
        html += `style="display:block;width:100%;background:rgba(80,20,20,0.9);color:#ffaaaa;`;
        html += `border:1px solid #aa4444;padding:5px 8px;border-radius:7px;cursor:pointer;font:bold 11px 'Courier New',monospace;text-align:left;">`;
        html += `🥊 ${match.fighter2Name}<br>`;
        html += `<span style="color:#ddbbbb;font-size:10px;">${match.bets2 || 0}c bet · ${odds2} payout</span>`;
        html += `</button>`;
        html += `</div>`;
      }
    }

    el.innerHTML = html;
    el.style.display = 'block';

    const inputEl = document.getElementById('tournamentBetAmountInput');
    if (inputEl) inputEl.addEventListener('change', () => { _tournamentBetAmount = parseInt(inputEl.value) || 50; });
  }

  window._placeTournamentBet = function(duelId, onId) {
    const inputEl = document.getElementById('tournamentBetAmountInput');
    const rawVal = inputEl ? parseInt(inputEl.value) : _tournamentBetAmount;
    const amount = Math.max(10, Math.min(300, isNaN(rawVal) ? 50 : rawVal));
    _tournamentBetAmount = amount;
    // Reuse the same duel_bet action — the server validates it's not a fighter betting on themselves
    socket.emit('action', { type: 'bet_on_duel', duelId, onId, amount });
  };

  function updateFoodTruckHeistUI() {
    const heistPrompt = document.getElementById('heistProximityPrompt');
    if (!heistPrompt || !gameState || !gameState.self || !gameState.foodTruck) {
      if (heistPrompt) heistPrompt.style.display = 'none';
      return;
    }
    const truck = gameState.foodTruck;
    if (truck.looted) {
      heistPrompt.style.display = 'none';
      return;
    }
    const s = gameState.self;
    const dx = s.x - truck.x;
    const dy = s.y - truck.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 90) {
      if (truck.heistActive) {
        const pct = Math.floor((truck.heistProgress || 0) * 100);
        const contributors = truck.heisterCount || 1;
        heistPrompt.innerHTML = '🚨 Hold <kbd>E</kbd> — HEIST ' + pct + '% (' + contributors + ' bird' + (contributors !== 1 ? 's' : '') + ')';
        heistPrompt.style.borderColor = '#ff4400';
        heistPrompt.style.color = '#ffcc44';
      } else {
        heistPrompt.innerHTML = '🚚 Hold <kbd>E</kbd> to HEIST the food truck!';
        heistPrompt.style.borderColor = '#ff8800';
        heistPrompt.style.color = '#ffffff';
      }
      heistPrompt.style.display = 'block';
    } else {
      heistPrompt.style.display = 'none';
    }
  }

  // ============================================================
  // BANK HEIST UI — proximity prompts for each phase
  // ============================================================
  function updateBankHeistUI() {
    const bhPrompt = document.getElementById('bankHeistPrompt');
    const bhEscapeHud = document.getElementById('bankEscapeHud');
    if (!bhPrompt || !bhEscapeHud) return;
    if (!gameState || !gameState.self || !gameState.bankHeist) {
      bhPrompt.style.display = 'none';
      bhEscapeHud.style.display = 'none';
      return;
    }

    const s = gameState.self;
    const bh = gameState.bankHeist;
    const BANK_X = 1960, BANK_Y = 1775;
    const VAULT_X = 1960, VAULT_Y = 1695;
    const now = Date.now();

    // ---- CASING: show which cameras are near ----
    if (bh.phase === 'casing') {
      let nearCam = null;
      let minDist = Infinity;
      for (const cam of (bh.cameras || [])) {
        if (cam.disabled) continue;
        const dx = s.x - cam.x;
        const dy = s.y - cam.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 60 && dist < minDist) { minDist = dist; nearCam = cam; }
      }
      const disabledCount = (bh.cameras || []).filter(c => c.disabled).length;
      const secsLeft = bh.casingExpiresAt ? Math.max(0, Math.ceil((bh.casingExpiresAt - now) / 1000)) : 0;

      if (nearCam) {
        const pct = Math.floor(nearCam.disableProgress * 100);
        bhPrompt.innerHTML = '📷 Hold <kbd>E</kbd> to blind camera (' + disabledCount + '/3 down, ' + pct + '%) — <span style="color:#ff8866">' + secsLeft + 's left</span>';
        bhPrompt.style.display = 'block';
      } else {
        const dxBank = s.x - BANK_X;
        const dyBank = s.y - BANK_Y;
        if (Math.sqrt(dxBank * dxBank + dyBank * dyBank) < 250) {
          bhPrompt.innerHTML = '🏦 HEIST ACTIVE — Disable the ' + (3 - disabledCount) + ' cameras! (<span style="color:#ff8866">' + secsLeft + 's</span>)';
          bhPrompt.style.display = 'block';
        } else {
          bhPrompt.style.display = 'none';
        }
      }
      bhEscapeHud.style.display = 'none';
    }

    // ---- CRACKING: show drill progress prompt ----
    else if (bh.phase === 'cracking') {
      const dx = s.x - VAULT_X;
      const dy = s.y - VAULT_Y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 85) {
        const pct = Math.floor((bh.crackProgress || 0) * 100);
        const contributors = bh.crackContributorCount || 0;
        bhPrompt.innerHTML = '🔒 Hold <kbd>E</kbd> to CRACK VAULT — ' + pct + '%' +
          (contributors > 0 ? ' (' + contributors + ' driller' + (contributors !== 1 ? 's' : '') + ')' : '');
        bhPrompt.style.display = 'block';
      } else {
        const dxBank = s.x - BANK_X;
        const dyBank = s.y - BANK_Y;
        if (Math.sqrt(dxBank * dxBank + dyBank * dyBank) < 250) {
          bhPrompt.innerHTML = '🔒 Fly to the vault door (north face of Bank) and hold <kbd>E</kbd>!';
          bhPrompt.style.display = 'block';
        } else {
          bhPrompt.style.display = 'none';
        }
      }
      bhEscapeHud.style.display = 'none';
    }

    // ---- ESCAPE: show escape HUD for crackers ----
    else if (bh.phase === 'escape') {
      bhPrompt.style.display = 'none';
      if (bh.isCracker && bh.escapeVan) {
        const secsLeft = bh.escapeEndsAt ? Math.max(0, Math.ceil((bh.escapeEndsAt - now) / 1000)) : 0;
        const escaped = bh.escapeVan.hasEscaped;
        const timerColor = secsLeft <= 10 ? '#ff4444' : '#ffcc00';
        if (escaped) {
          bhEscapeHud.innerHTML = '🚐 SAFE IN THE VAN! ' + (bh.escapeVan.escapeeCount || 1) + ' escaped';
          bhEscapeHud.style.borderColor = '#44ff88';
        } else {
          bhEscapeHud.innerHTML = '🚐 GET TO THE VAN! <span style="color:' + timerColor + '">' + secsLeft + 's</span>';
          bhEscapeHud.style.borderColor = secsLeft <= 10 ? '#ff4444' : '#ffcc00';
        }
        bhEscapeHud.style.display = 'block';

        // Show proximity prompt near the van
        const vdx = s.x - bh.escapeVan.x;
        const vdy = s.y - bh.escapeVan.y;
        if (Math.sqrt(vdx * vdx + vdy * vdy) < 80 && !escaped) {
          bhPrompt.innerHTML = '🚐 Fly into the van to ESCAPE!';
          bhPrompt.style.display = 'block';
        }
      } else {
        bhEscapeHud.style.display = 'none';
      }
    }

    // ---- All other phases: hide everything ----
    else {
      bhPrompt.style.display = 'none';
      bhEscapeHud.style.display = 'none';
    }
  }

  // ============================================================
  // GANG MURAL PAINTING UI — send mural_paint actions while holding G near zone
  // ============================================================
  function updateMuralUI(now) {
    if (!gameState || !gameState.self || !worldData || !gameState.muralZones) return;
    const s = gameState.self;

    // Active painting: send action every MURAL_SEND_INTERVAL ms while holding G
    if (muralPaintState !== null) {
      // Validate still in range
      const zone = gameState.muralZones.find(z => z.id === muralPaintState.zoneId);
      if (zone) {
        const zdx = s.x - zone.x;
        const zdy = s.y - zone.y;
        if (Math.sqrt(zdx * zdx + zdy * zdy) > MURAL_PROXIMITY_CLIENT) {
          muralPaintState = null; // moved away
          return;
        }
        // Send paint action on interval
        muralPaintState.sendTimer = (muralPaintState.sendTimer || 0);
        if (now - muralPaintState.sendTimer > MURAL_SEND_INTERVAL) {
          muralPaintState.sendTimer = now;
          if (socket && joined) {
            socket.emit('action', { type: 'mural_paint', zoneId: muralPaintState.zoneId });
          }
        }
      } else {
        muralPaintState = null;
      }
    }

    // Proximity prompt for mural zones — show when near a zone and in a gang (and not already spraying)
    if (s.gangId && !muralPaintState && !sprayState) {
      for (const zone of gameState.muralZones) {
        const zdx = s.x - zone.x;
        const zdy = s.y - zone.y;
        const zdist = Math.sqrt(zdx * zdx + zdy * zdy);
        if (zdist < MURAL_PROXIMITY_CLIENT) {
          // Check if there's an active mural here by this gang
          const existingMural = gameState.murals && gameState.murals.find(m => m.zoneId === zone.id);
          const paintingHere = gameState.muralPainting && gameState.muralPainting.find(p => p.zoneId === zone.id);

          let promptText;
          if (existingMural && existingMural.gangTag === (gameState.self.gangTag || '')) {
            promptText = `🎨 Hold [G] to REFRESH your mural at ${zone.name}`;
          } else if (existingMural) {
            promptText = `🎨 Hold [G] to OVERTAKE [${existingMural.gangTag}] mural at ${zone.name}! (Extra XP)`;
          } else if (paintingHere) {
            promptText = `🖌️ Hold [G] to JOIN the mural at ${zone.name}! (${paintingHere.painterCount} painting)`;
          } else {
            promptText = `🎨 Hold [G] with your gang to paint a MURAL at ${zone.name}!`;
          }

          let muralPrompt = document.getElementById('muralZonePrompt');
          if (!muralPrompt) {
            muralPrompt = document.createElement('div');
            muralPrompt.id = 'muralZonePrompt';
            muralPrompt.style.cssText = 'position:fixed;bottom:150px;left:50%;transform:translateX(-50%);' +
              'background:rgba(30,10,60,0.88);color:#cc88ff;font:bold 13px Courier New;' +
              'padding:8px 18px;border-radius:20px;border:2px solid #9944cc;pointer-events:none;z-index:50;';
            document.body.appendChild(muralPrompt);
          }
          muralPrompt.textContent = promptText;
          muralPrompt.style.display = 'block';
          return;
        }
      }
    }

    // Hide prompt if not near any zone
    const muralPrompt = document.getElementById('muralZonePrompt');
    if (muralPrompt) muralPrompt.style.display = 'none';
  }

  // ============================================================
  // GRAFFITI SPRAY UI — proximity prompt + hold progress
  // ============================================================
  function updateSprayUI(now) {
    if (!gameState || !gameState.self || !worldData) return;
    const s = gameState.self;

    // Update spray progress if holding G
    if (sprayState !== null) {
      const elapsed = performance.now() - sprayState.startTime;
      sprayState.progress = Math.min(1, elapsed / 2000);

      // Cancel if moved too far from building
      const b = worldData.buildings[sprayState.buildingIdx];
      if (b) {
        const bcx = b.x + b.w / 2;
        const bcy = b.y + b.h / 2;
        const ddx = s.x - bcx;
        const ddy = s.y - bcy;
        if (Math.sqrt(ddx * ddx + ddy * ddy) > 100) {
          sprayState = null;
          return;
        }
      }

      // Fire when complete
      if (sprayState.progress >= 1) {
        if (socket && joined) {
          socket.emit('action', { type: 'spray_tag', buildingIdx: sprayState.buildingIdx });
        }
        // Spray burst visual
        if (gameState.self && worldData.buildings[sprayState.buildingIdx]) {
          const tb = worldData.buildings[sprayState.buildingIdx];
          const tbcx = tb.x + tb.w / 2;
          const tbcy = tb.y + tb.h / 2;
          const tagColor = gameState.self.birdColor || '#ff44ff';
          for (let p = 0; p < 18; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 60;
            effects.push({
              type: 'particle',
              x: tbcx, y: tbcy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: tagColor,
              time: performance.now(),
              duration: 600 + Math.random() * 400,
              radius: 3 + Math.random() * 3,
            });
          }
        }
        sprayState = null;
        return;
      }
    }

    // Proximity prompt — show when near a building but not spraying
    let sprayPrompt = document.getElementById('sprayPrompt');
    if (!sprayPrompt) {
      sprayPrompt = document.createElement('div');
      sprayPrompt.id = 'sprayPrompt';
      sprayPrompt.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);' +
        'background:rgba(0,0,0,0.75);color:#ff88ff;font:bold 13px Courier New;' +
        'padding:7px 16px;border-radius:20px;border:1px solid #ff44ff;display:none;pointer-events:none;z-index:50;';
      document.body.appendChild(sprayPrompt);
    }

    let nearAnyBuilding = false;
    // Don't show spray prompt if mural painting is active
    if (!sprayState && !muralPaintState) {
      // Check we're not near a mural zone first (mural zone takes priority)
      let nearMuralZone = false;
      if (s.gangId && gameState.muralZones) {
        for (const zone of gameState.muralZones) {
          const zdx = s.x - zone.x;
          const zdy = s.y - zone.y;
          if (Math.sqrt(zdx * zdx + zdy * zdy) < MURAL_PROXIMITY_CLIENT) { nearMuralZone = true; break; }
        }
      }
      if (!nearMuralZone) {
        for (let i = 0; i < worldData.buildings.length; i++) {
          const b = worldData.buildings[i];
          const bcx = b.x + b.w / 2;
          const bcy = b.y + b.h / 2;
          const ddx = s.x - bcx;
          const ddy = s.y - bcy;
          if (Math.sqrt(ddx * ddx + ddy * ddy) < 90) {
            nearAnyBuilding = true;
            const existing = gameState.graffiti && gameState.graffiti.find(function(t) { return t.buildingIdx === i; });
            const cost = (existing && existing.ownerName !== s.name) ? 8 : 5;
            sprayPrompt.textContent = '🎨 Hold [G] to SPRAY TAG ' + b.name + ' (-' + cost + 'c)';
            break;
          }
        }
      }
    }
    sprayPrompt.style.display = (nearAnyBuilding && !muralPaintState) ? 'block' : 'none';

    // Draw spray progress bar in canvas
    if (sprayState !== null && worldData.buildings[sprayState.buildingIdx]) {
      const tb = worldData.buildings[sprayState.buildingIdx];
      const bsx = tb.x - camera.x + camera.screenW / 2;
      const bsy = tb.y - camera.y + camera.screenH / 2;
      const barW = tb.w;
      const barH = 7;
      const barY = bsy - 14;
      ctx.save();
      ctx.globalAlpha = 1;
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bsx, barY, barW, barH);
      // Fill
      const sprayColor = (gameState.self && gameState.self.birdColor) || '#ff44ff';
      ctx.fillStyle = sprayColor;
      ctx.fillRect(bsx, barY, barW * sprayState.progress, barH);
      // Border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(bsx, barY, barW, barH);
      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('🎨 SPRAYING ' + Math.floor(sprayState.progress * 100) + '%', bsx + barW / 2, barY - 3);
      ctx.restore();
    }
  }

  // ============================================================
  // RADIO TOWER UI — proximity prompt, hold-capture progress, broadcast menu
  // ============================================================
  function updateRadioTowerUI(now) {
    if (!gameState || !gameState.self || !worldData || !worldData.radioTowerPos) return;
    const s = gameState.self;
    const rt = worldData.radioTowerPos;
    const rtState = gameState.radioTower;
    const tdx = s.x - rt.x;
    const tdy = s.y - rt.y;
    const tDist = Math.sqrt(tdx * tdx + tdy * tdy);
    const isNear = tDist < (rt.captureRadius || 90) + 20;
    lastNearTower = isNear;

    // Close broadcast menu if walked away or no longer owner
    if (towerBroadcastOpen && (!isNear || !rtState || !rtState.isOwner)) {
      closeTowerBroadcastMenu();
    }

    // Proximity prompt
    let towerPrompt = document.getElementById('towerPrompt');
    if (!towerPrompt) {
      towerPrompt = document.createElement('div');
      towerPrompt.id = 'towerPrompt';
      towerPrompt.style.cssText = 'position:fixed;bottom:150px;left:50%;transform:translateX(-50%);' +
        'background:rgba(0,0,10,0.82);color:#44ddff;font:bold 13px Courier New;' +
        'padding:8px 18px;border-radius:22px;border:1px solid #44aaff;display:none;pointer-events:none;z-index:50;text-align:center;';
      document.body.appendChild(towerPrompt);
    }

    if (isNear && rtState) {
      if (rtState.isOwner) {
        const secsLeft = Math.max(0, Math.ceil((rtState.expiresAt - Date.now()) / 1000));
        const canBoost = !rtState.signalBoostUsed;
        const boostCd = rtState.broadcastCooldownUntil > Date.now()
          ? Math.ceil((rtState.broadcastCooldownUntil - Date.now()) / 1000) + 's'
          : 'ready';
        towerPrompt.innerHTML = '📡 ON AIR — ' + secsLeft + 's left | Press [T] to BROADCAST' +
          (canBoost ? ' | [T]→Signal Boost (-30c)' : '');
        towerPrompt.style.color = '#44ffff';
        towerPrompt.style.borderColor = '#44ffff';
        towerPrompt.style.display = 'block';
      } else if (towerCapState !== null) {
        const pct = Math.floor(towerCapState.progress * 100);
        towerPrompt.innerHTML = '📡 CAPTURING TOWER... ' + pct + '%';
        towerPrompt.style.color = '#ffcc44';
        towerPrompt.style.borderColor = '#ffcc44';
        towerPrompt.style.display = 'block';
      } else {
        const ownerText = rtState.state === 'owned'
          ? ' (owned by ' + (rtState.ownerName || '?') + ')'
          : '';
        towerPrompt.innerHTML = '📡 Hold <kbd>E</kbd> to CAPTURE Radio Tower' + ownerText;
        towerPrompt.style.color = '#44ddff';
        towerPrompt.style.borderColor = '#44aaff';
        towerPrompt.style.display = 'block';
      }
    } else {
      towerPrompt.style.display = 'none';
    }

    // Update hold-capture progress
    if (towerCapState !== null) {
      const elapsed = performance.now() - towerCapState.startTime;
      towerCapState.progress = Math.min(1, elapsed / 5000); // 5-second hold

      // Cancel if walked away
      if (!isNear) {
        towerCapState = null;
        return;
      }

      // Complete the capture
      if (towerCapState.progress >= 1) {
        if (socket && joined) {
          socket.emit('action', { type: 'tower_capture' });
        }
        // Capture spark burst
        const sx = rt.x - camera.x + camera.screenW / 2;
        const sy = rt.y - camera.y + camera.screenH / 2;
        for (let p = 0; p < 22; p++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 40 + Math.random() * 80;
          effects.push({
            type: 'particle',
            x: rt.x, y: rt.y - 50,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#44aaff',
            time: performance.now(),
            duration: 700 + Math.random() * 400,
            radius: 3 + Math.random() * 3,
          });
        }
        towerCapState = null;
      }
    }

    // Draw capture progress bar on canvas (above the tower)
    if (towerCapState !== null && isNear) {
      const tsx = rt.x - camera.x + camera.screenW / 2;
      const tsy = rt.y - camera.y + camera.screenH / 2;
      const barW = 80;
      const barH = 7;
      const barX = tsx - barW / 2;
      const barY = tsy - 110;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#44aaff';
      ctx.fillRect(barX, barY, barW * towerCapState.progress, barH);
      ctx.strokeStyle = '#44ddff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('📡 ' + Math.floor(towerCapState.progress * 100) + '%', tsx, barY - 4);
      ctx.restore();
    }
  }

  // ============================================================
  // RACE BETTING PANEL — shown to spectators during open/countdown/racing
  // ============================================================
  function updateRaceBettingPanel() {
    if (!raceBettingPanel) return;
    const race = gameState && gameState.pigeonRace;
    if (!race) { raceBettingPanel.style.display = 'none'; return; }

    const st = race.state;

    // Show during open, countdown, or racing (if player has a bet)
    const isRacer = race.isRacer;
    const myBet = race.myBet;
    const showDuringOpen = (st === 'open' || st === 'countdown') && !isRacer;
    const showDuringRace = st === 'racing' && myBet;

    if (!showDuringOpen && !showDuringRace) {
      raceBettingPanel.style.display = 'none';
      return;
    }

    raceBettingPanel.style.display = 'block';
    raceBettingPanel.style.pointerEvents = showDuringOpen ? 'auto' : 'none';

    if (showDuringOpen && !myBet) {
      // Betting interface — show racers with bet buttons
      const racers = race.openRacers || [];
      const betAmts = race.racerBetAmounts || {};
      const totalPool = race.totalBetPool || 0;

      let html = '<div style="color:#ffd700;font-size:13px;margin-bottom:6px;">🎰 RACE BETTING</div>';
      if (racers.length === 0) {
        html += '<div style="color:#888;font-size:10px;">Waiting for racers...</div>';
      } else {
        html += '<div style="color:#aaa;font-size:9px;margin-bottom:6px;">Pool: ' + totalPool + 'c · Min 10c · Max 500c</div>';
        for (const r of racers) {
          const onRacer = betAmts[r.id] || 0;
          const pct = totalPool > 0 ? Math.round((onRacer / (totalPool + raceBetAmount)) * 100) : 0;
          html += '<div style="margin:3px 0;display:flex;align-items:center;gap:6px;">'
            + '<button data-target-id="' + r.id + '" data-target-name="' + r.name + '" '
            + 'style="flex:1;background:#2a1a00;border:1px solid #cc8800;color:#ffd700;'
            + 'font:bold 10px Courier New,monospace;padding:3px 6px;border-radius:6px;cursor:pointer;'
            + 'text-align:left;" onclick="window._raceBetClick(this)">'
            + '🐦 ' + r.name.slice(0, 12)
            + '</button>'
            + '<span style="color:#aaa;font-size:9px;white-space:nowrap;">' + onRacer + 'c</span>'
            + '</div>';
        }
        html += '<div style="margin-top:7px;display:flex;align-items:center;gap:5px;">'
          + '<span style="color:#aaa;font-size:9px;">Bet:</span>'
          + '<input id="raceBetInput" type="number" min="10" max="500" value="' + raceBetAmount + '" '
          + 'style="width:60px;background:#111;border:1px solid #666;color:#ffd700;'
          + 'font:11px Courier New,monospace;padding:2px 4px;border-radius:4px;" />'
          + '<span style="color:#888;font-size:9px;">c</span>'
          + '</div>';
        html += '<div style="color:#888;font-size:9px;margin-top:4px;">Click a racer to bet!</div>';
      }
      raceBettingPanel.innerHTML = html;

      // Update amount state when input changes
      const inp = document.getElementById('raceBetInput');
      if (inp) {
        inp.addEventListener('change', () => {
          const v = parseInt(inp.value);
          if (v >= 10 && v <= 500) raceBetAmount = v;
        });
        inp.addEventListener('input', () => {
          const v = parseInt(inp.value);
          if (v >= 10 && v <= 500) raceBetAmount = v;
        });
      }
    } else if (showDuringOpen && myBet) {
      // Already bet — show confirmation
      const betAmts = race.racerBetAmounts || {};
      const totalPool = race.totalBetPool || 0;
      const onMyPick = betAmts[myBet.targetId] || myBet.amount;
      const estPayout = totalPool > 0 ? Math.floor(totalPool * myBet.amount / onMyPick) : myBet.amount;

      raceBettingPanel.innerHTML =
        '<div style="color:#44ff44;font-size:12px;">🎰 BET PLACED!</div>'
        + '<div style="color:#ffd700;margin:4px 0;font-size:11px;">' + myBet.amount + 'c on <b>' + myBet.targetName + '</b></div>'
        + '<div style="color:#aaa;font-size:9px;">Pool: ' + totalPool + 'c</div>'
        + '<div style="color:#88ff88;font-size:9px;">Est. payout if they win: ~' + Math.max(Math.floor(myBet.amount * 1.5), estPayout) + 'c</div>';
    } else if (showDuringRace && myBet) {
      // Race live — show bet tracking
      const positions = race.positions || [];
      const myPickPos = positions.find(p => p.id === myBet.targetId);
      const pos = myPickPos ? positions.indexOf(myPickPos) + 1 : '?';
      const status = myPickPos
        ? (myPickPos.finished ? '🏁 FINISHED #' + myPickPos.finishPosition : 'Position: #' + pos + ' [CP' + myPickPos.progress + ']')
        : 'Unknown';

      raceBettingPanel.innerHTML =
        '<div style="color:#ffd700;font-size:12px;">🎰 YOUR BET</div>'
        + '<div style="font-size:11px;margin:3px 0;">' + myBet.amount + 'c on <b style="color:#ffd700;">' + myBet.targetName + '</b></div>'
        + '<div style="color:#aaffaa;font-size:10px;">' + status + '</div>';
    }
  }

  // Global handler for bet buttons (avoids closure issues with dynamic HTML)
  window._raceBetClick = function(btn) {
    const targetId = btn.getAttribute('data-target-id');
    const targetName = btn.getAttribute('data-target-name');
    const inp = document.getElementById('raceBetInput');
    if (inp) {
      const v = parseInt(inp.value);
      if (v >= 10 && v <= 500) raceBetAmount = v;
    }
    socket.emit('action', { type: 'race_bet', targetId, amount: raceBetAmount });
  };

  // ============================================================
  // WEATHER BETTING PANEL — shown between weather events
  // ============================================================
  const WEATHER_BET_INFO = {
    rain:      { emoji: '🌧️', label: 'RAIN',      color: '#66aaff', odds: '24%' },
    wind:      { emoji: '💨', label: 'WIND',      color: '#aaddff', odds: '20%' },
    storm:     { emoji: '⛈️', label: 'STORM',     color: '#ffdd44', odds: '12%' },
    fog:       { emoji: '🌫️', label: 'FOG',       color: '#b8ddc0', odds: '11%' },
    hailstorm: { emoji: '🌨️', label: 'HAILSTORM', color: '#88ccff', odds: '12%' },
    heatwave:  { emoji: '🌡️', label: 'HEATWAVE',  color: '#ff9933', odds: '12%' },
    tornado:   { emoji: '🌪️', label: 'TORNADO',   color: '#cc88ff', odds: '9%' },
    blizzard:  { emoji: '❄️', label: 'BLIZZARD',  color: '#aaeeff', odds: '8%' },
  };

  function updateWeatherBetPanel(now) {
    if (!weatherBetPanel) return;
    const wb = gameState && gameState.weatherBetting;
    if (!wb) { weatherBetPanel.style.display = 'none'; return; }

    const msLeft = wb.openUntil - now;
    if (msLeft <= 0) { weatherBetPanel.style.display = 'none'; return; }

    weatherBetPanel.style.display = 'block';
    const secsLeft = Math.ceil(msLeft / 1000);
    const myBet = wb.myBet;
    const typeAmounts = wb.typeAmounts || {};
    const totalPool = Object.values(typeAmounts).reduce((s, v) => s + v, 0);

    if (myBet) {
      // Already bet — show confirmation with live pool
      const info = WEATHER_BET_INFO[myBet.type] || {};
      const onMyPick = typeAmounts[myBet.type] || myBet.amount;
      const estPayout = totalPool > 0
        ? Math.max(Math.floor(myBet.amount * 1.5), Math.floor(totalPool * myBet.amount / onMyPick))
        : Math.floor(myBet.amount * 1.5);
      weatherBetPanel.innerHTML =
        '<div style="color:#aaddff;font-size:12px;margin-bottom:4px;">🌤️ FORECAST BET</div>'
        + '<div style="color:#44ff88;font-size:11px;margin-bottom:4px;">✅ BET PLACED!</div>'
        + '<div style="color:#ffd700;font-size:12px;margin-bottom:3px;">'
        + myBet.amount + 'c on <b>' + (info.emoji || '') + ' ' + (info.label || myBet.type) + '</b></div>'
        + '<div style="color:#88ff88;font-size:9px;">Pool: ' + totalPool + 'c · Est. win: ~' + estPayout + 'c</div>'
        + '<div style="color:#7799cc;font-size:9px;margin-top:4px;">Window closes: ' + secsLeft + 's</div>';
      weatherBetPanel.style.pointerEvents = 'none';
    } else {
      // Betting interface — show all 8 weather types
      const TYPES = ['rain', 'wind', 'storm', 'fog', 'hailstorm', 'heatwave', 'tornado', 'blizzard'];
      // Count's City Intel tip — show at top if available
      const intelTip = window._countIntelTip;
      const intelHint = intelTip
        ? `<div style="background:rgba(80,120,60,0.3);border:1px solid #60a040;border-radius:5px;padding:3px 6px;margin-bottom:5px;font-size:9px;color:#a0d880;">🥉 Count's Intel: <strong>${intelTip.emoji} ${intelTip.label.toUpperCase()}</strong> coming!</div>`
        : '';
      let html = '<div style="color:#aaddff;font-size:12px;margin-bottom:2px;">🌤️ FORECAST BET</div>'
        + '<div style="color:#7799cc;font-size:9px;margin-bottom:6px;">What\'s next? · ' + secsLeft + 's · Pool: ' + totalPool + 'c</div>'
        + intelHint;

      for (const t of TYPES) {
        const info = WEATHER_BET_INFO[t];
        const onType = typeAmounts[t] || 0;
        html += '<div style="margin:2px 0;display:flex;align-items:center;gap:5px;">'
          + '<button data-wtype="' + t + '" '
          + 'style="flex:1;background:rgba(20,40,80,0.8);border:1px solid ' + info.color + ';color:' + info.color + ';'
          + 'font:bold 9px Courier New,monospace;padding:3px 5px;border-radius:6px;cursor:pointer;text-align:left;" '
          + 'onclick="window._weatherBetClick(this)">'
          + info.emoji + ' ' + info.label + ' <span style="color:#888;font-size:8px;">(' + info.odds + ')</span>'
          + '</button>'
          + '<span style="color:#aaa;font-size:8px;white-space:nowrap;">' + onType + 'c</span>'
          + '</div>';
      }
      html += '<div style="margin-top:7px;display:flex;align-items:center;gap:5px;">'
        + '<span style="color:#7799cc;font-size:9px;">Bet:</span>'
        + '<input id="weatherBetInput" type="number" min="10" max="300" value="' + weatherBetAmount + '" '
        + 'style="width:55px;background:#111;border:1px solid #446688;color:#aaddff;'
        + 'font:10px Courier New,monospace;padding:2px 4px;border-radius:4px;" />'
        + '<span style="color:#7799cc;font-size:9px;">c (10–300)</span>'
        + '</div>'
        + '<div style="color:#6688aa;font-size:8px;margin-top:3px;">Click weather to bet!</div>';
      weatherBetPanel.innerHTML = html;
      weatherBetPanel.style.pointerEvents = 'auto';

      const inp = document.getElementById('weatherBetInput');
      if (inp) {
        inp.addEventListener('change', () => { const v = parseInt(inp.value); if (v >= 10 && v <= 300) weatherBetAmount = v; });
        inp.addEventListener('input',  () => { const v = parseInt(inp.value); if (v >= 10 && v <= 300) weatherBetAmount = v; });
      }
    }
  }

  window._weatherBetClick = function(btn) {
    const betType = btn.getAttribute('data-wtype');
    const inp = document.getElementById('weatherBetInput');
    if (inp) { const v = parseInt(inp.value); if (v >= 10 && v <= 300) weatherBetAmount = v; }
    socket.emit('action', { type: 'weather_bet', betType, amount: weatherBetAmount });
  };

  // ============================================================
  // PIGEON RACING UI — proximity prompt + race HUD
  // ============================================================
  // SEWER UI — proximity prompt for manholes
  // ============================================================
  function updateSewerUI(now) {
    if (!gameState || !gameState.self || !worldData || !worldData.manholes) return;
    const s = gameState.self;
    const inSewer = s.inSewer;

    // Find nearest manhole
    let nearId = null, nearDist = Infinity;
    for (const mh of worldData.manholes) {
      const dx = s.x - mh.x, dy = s.y - mh.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 70 && dist < nearDist) { nearDist = dist; nearId = mh.id; }
    }
    lastNearManholeId = nearId;

    // Show/hide sewer proximity prompt
    let sewerPrompt = document.getElementById('sewerProximityPrompt');
    if (!sewerPrompt) {
      sewerPrompt = document.createElement('div');
      sewerPrompt.id = 'sewerProximityPrompt';
      sewerPrompt.style.cssText = 'position:fixed;bottom:145px;left:50%;transform:translateX(-50%);' +
        'background:rgba(0,30,10,0.85);color:#44ff88;font:bold 13px Courier New;' +
        'padding:7px 16px;border-radius:20px;border:1px solid #44ff88;display:none;pointer-events:none;z-index:50;';
      document.body.appendChild(sewerPrompt);
    }

    if (nearId) {
      sewerPrompt.textContent = inSewer
        ? '⬆ Press [E] to resurface'
        : '🐀 Press [E] to enter the sewer';
      sewerPrompt.style.display = 'block';
    } else {
      sewerPrompt.style.display = 'none';
    }
  }

  // ============================================================
  function updateRaceUI() {
    if (!gameState || !gameState.self || !worldData || !worldData.raceCheckpoints) return;
    const s = gameState.self;
    const race = gameState.pigeonRace;
    const cp0 = worldData.raceCheckpoints[0];
    if (!cp0) return;

    // Proximity check to START/FINISH ring
    const rdx = s.x - cp0.x;
    const rdy = s.y - cp0.y;
    const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
    lastNearRaceStart = rDist < 280;

    // Proximity prompt
    if (raceProximityPrompt) {
      const raceState = race ? race.state : 'idle';
      if (lastNearRaceStart && raceState === 'open' && race && !race.isRacer) {
        const secsLeft = Math.max(0, Math.ceil((race.openUntil - Date.now()) / 1000));
        raceProximityPrompt.textContent = '🏁 Press [R] to ENTER RACE (-' + (25) + 'c)  ' + race.racerCount + ' entered — ' + secsLeft + 's left';
        raceProximityPrompt.style.display = 'block';
      } else if (lastNearRaceStart && raceState === 'idle') {
        raceProximityPrompt.textContent = '🏁 START LINE — Race opens soon!';
        raceProximityPrompt.style.display = 'block';
      } else {
        raceProximityPrompt.style.display = 'none';
      }
    }

    // Race HUD — shown during open / countdown / racing
    if (raceHud) {
      if (!race) { raceHud.style.display = 'none'; return; }
      const raceState = race.state;

      if (raceState === 'idle' || raceState === 'finished') {
        // Brief results screen
        if (raceState === 'finished' && race.positions && race.positions.length > 0) {
          const podium = race.positions.slice(0, 3).map((r, i) => {
            const m = ['🥇','🥈','🥉'][i] || ('#' + (i+1));
            return m + ' ' + (r.name || '?');
          }).join('  ');
          raceHud.innerHTML = '<div style="color:#ffd700;font-size:11px;">🏁 RACE RESULTS: ' + podium + '</div>';
          raceHud.style.display = 'block';
        } else {
          raceHud.style.display = 'none';
        }
        return;
      }

      if (raceState === 'open') {
        const secsLeft = Math.max(0, Math.ceil((race.openUntil - Date.now()) / 1000));
        if (race.isRacer) {
          raceHud.innerHTML = '<div style="color:#44ff44;">✅ REGISTERED for the race!</div><div style="color:#ffd700;font-size:10px;">' + race.racerCount + ' racers — 💰 ' + race.pot + 'c pot — starts in ' + secsLeft + 's</div>';
        } else {
          raceHud.innerHTML = '<div style="color:#ffd700;">🏁 RACE REGISTRATION OPEN — ' + secsLeft + 's left</div><div style="color:#aaffaa;font-size:10px;">' + race.racerCount + ' joined — fly to START ring [R] to enter (-25c)</div>';
        }
        raceHud.style.display = 'block';
        return;
      }

      if (raceState === 'countdown') {
        const secsLeft = Math.max(0, Math.ceil((race.countdownUntil - Date.now()) / 1000));
        raceHud.innerHTML = '<div style="color:#ffd700;font-size:16px;">🏁 RACE STARTS IN ' + secsLeft + '...</div><div style="font-size:10px;color:#ffaa44;">' + race.racerCount + ' racers — 💰 ' + race.pot + 'c pot</div>';
        raceHud.style.display = 'block';
        return;
      }

      if (raceState === 'racing') {
        const timeLeft = race.raceEndsAt ? Math.max(0, Math.ceil((race.raceEndsAt - Date.now()) / 1000)) : '??';
        let myStatus = '';
        if (race.isRacer) {
          if (race.myFinished) {
            myStatus = '<div style="color:#44ff44;">✅ FINISHED! Position: ' + (race.myFinishPosition || '?') + '</div>';
          } else if (race.myNeedsFinish) {
            myStatus = '<div style="color:#ffd700;">→ HEAD FOR FINISH LINE! 🏁</div>';
          } else {
            myStatus = '<div style="color:#ffd700;">→ CP ' + race.myNextCpIdx + ' NEXT</div>';
          }
        }

        let leaderboard = '';
        if (race.positions && race.positions.length > 0) {
          leaderboard = race.positions.slice(0, 4).map((r, i) => {
            const isSelf = r.id === selfId;
            const style = isSelf ? 'color:#ffd700;font-weight:bold;' : 'color:#aaaaaa;';
            const cpLabel = r.finished ? '🏁' : ('CP' + r.progress);
            return '<span style="' + style + '">' + (i+1) + '. ' + r.name.slice(0,10) + ' [' + cpLabel + ']</span>';
          }).join('  ');
        }

        raceHud.innerHTML =
          '<div style="color:#ffd700;font-size:12px;">🏁 RACE — ⏱ ' + timeLeft + 's left — 💰 ' + race.pot + 'c</div>' +
          myStatus +
          '<div style="font-size:9px;margin-top:3px;">' + leaderboard + '</div>';
        raceHud.style.display = 'block';
        return;
      }

      raceHud.style.display = 'none';
    }
  }

  function toggleTowerBroadcastMenu() {
    if (towerBroadcastOpen) {
      closeTowerBroadcastMenu();
    } else {
      openTowerBroadcastMenu();
    }
  }

  function openTowerBroadcastMenu() {
    towerBroadcastOpen = true;
    let menu = document.getElementById('towerBroadcastMenu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'towerBroadcastMenu';
      menu.style.cssText =
        'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'background:rgba(0,5,20,0.95);border:2px solid #44aaff;border-radius:12px;' +
        'padding:18px 24px;z-index:200;min-width:280px;text-align:center;' +
        'font-family:Courier New,monospace;color:#fff;';
      document.body.appendChild(menu);
    }
    const rt = gameState && gameState.radioTower;
    const canBoost = rt && !rt.signalBoostUsed;
    const taunting = rt && rt.broadcastCooldownUntil > Date.now();
    const tauntCd = taunting ? Math.ceil((rt.broadcastCooldownUntil - Date.now()) / 1000) + 's' : '';
    const coins = (gameState && gameState.self && gameState.self.coins) || 0;

    menu.innerHTML =
      '<div style="color:#44ddff;font-size:15px;font-weight:bold;margin-bottom:12px;">📻 PIGEON RADIO — ON AIR</div>' +
      '<div style="font-size:11px;color:#aaaacc;margin-bottom:14px;">You\'re broadcasting. Make it count.</div>' +

      '<button id="towerTauntBtn" style="display:block;width:100%;margin-bottom:10px;' +
      'background:' + (taunting ? 'rgba(80,80,100,0.5)' : 'rgba(20,80,160,0.9)') + ';' +
      'color:' + (taunting ? '#888' : '#fff') + ';border:1px solid #44aaff;border-radius:8px;' +
      'padding:9px 12px;cursor:pointer;font:bold 12px Courier New;">' +
      '📢 TAUNT the city' + (taunting ? ' (cooldown ' + tauntCd + ')' : ' [FREE]') + '</button>' +

      '<button id="towerBoostBtn" style="display:block;width:100%;margin-bottom:14px;' +
      'background:' + (!canBoost ? 'rgba(80,80,100,0.5)' : 'rgba(30,140,30,0.9)') + ';' +
      'color:' + (!canBoost ? '#888' : '#fff') + ';border:1px solid #44ff44;border-radius:8px;' +
      'padding:9px 12px;cursor:pointer;font:bold 12px Courier New;">' +
      '⚡ SIGNAL BOOST — 50% XP for all, 60s [-30c]' + (!canBoost ? ' (USED)' : '') + '</button>' +

      '<button id="towerMenuClose" style="background:rgba(80,30,30,0.8);color:#ff8888;' +
      'border:1px solid #ff4444;border-radius:8px;padding:6px 20px;cursor:pointer;' +
      'font:bold 11px Courier New;">CLOSE [T]</button>';

    document.getElementById('towerTauntBtn').onclick = function() {
      if (!taunting && socket && joined) socket.emit('action', { type: 'tower_broadcast', broadcastType: 'taunt' });
      closeTowerBroadcastMenu();
    };
    document.getElementById('towerBoostBtn').onclick = function() {
      if (canBoost && coins >= 30 && socket && joined) socket.emit('action', { type: 'tower_broadcast', broadcastType: 'signal_boost' });
      closeTowerBroadcastMenu();
    };
    document.getElementById('towerMenuClose').onclick = closeTowerBroadcastMenu;
    menu.style.display = 'block';
  }

  function closeTowerBroadcastMenu() {
    towerBroadcastOpen = false;
    const menu = document.getElementById('towerBroadcastMenu');
    if (menu) menu.style.display = 'none';
  }

  // ============================================================
  // FLOCK LOBBY UI
  // ============================================================
  function renderFlockLobby(lobbyBirds, selfState) {
    flockLobby.style.display = 'block';
    let html = '<div class="lobby-header">FLOCK LOBBY</div>';
    for (const b of lobbyBirds) {
      const isSelf = b.id === selfState.id;
      html += '<div class="lobby-bird-row">';
      html += '<div>';
      html += '<span class="lobby-bird-name">' + b.name + '</span>';
      html += '<span class="lobby-bird-level">Lv.' + b.level + '</span>';
      html += '<span class="lobby-bird-type">' + b.type + '</span>';
      if (b.flockName) {
        html += '<span class="lobby-bird-flock">[' + b.flockName + ']</span>';
      }
      html += '</div>';
      if (isSelf) {
        html += '<span class="lobby-self-tag">YOU</span>';
      } else if (!b.flockId) {
        html += '<span class="lobby-invite-btn" data-invite="' + b.id + '">INVITE</span>';
      } else {
        html += '<span class="lobby-self-tag">IN FLOCK</span>';
      }
      html += '</div>';
    }
    html += '<div class="lobby-close-btn" id="lobbyCloseBtn">CLOSE</div>';
    flockLobby.innerHTML = html;

    // Add event listeners for invite buttons
    flockLobby.querySelectorAll('.lobby-invite-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const targetId = this.getAttribute('data-invite');
        if (socket && joined) socket.emit('action', { type: 'flock_invite', targetId: targetId });
      });
      btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('data-invite');
        if (socket && joined) socket.emit('action', { type: 'flock_invite', targetId: targetId });
      }, { passive: false });
    });

    // Close button
    const closeBtn = document.getElementById('lobbyCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() { flockLobby.style.display = 'none'; flockLobbyVisible = false; });
      closeBtn.addEventListener('touchstart', function(e) { e.preventDefault(); flockLobby.style.display = 'none'; flockLobbyVisible = false; }, { passive: false });
    }
  }

  // ============================================================
  // MISSION BOARD UI
  // ============================================================
  function showMissionBoard() {
    if (!gameState || !gameState.missionBoard) return;
    missionBoardVisible = true;
    missionBoardOverlay.style.display = 'block';
    missionBoardList.innerHTML = '';
    for (const mission of gameState.missionBoard) {
      const card = document.createElement('div');
      card.className = 'mission-card';
      const groupTag = mission.type === 'group' ? ' <span class="group-tag">FLOCK</span>' : '';
      card.innerHTML =
        '<div class="mission-card-title">' + mission.title + '</div>' +
        '<div class="mission-card-desc">' + mission.desc + '</div>' +
        '<div class="mission-card-meta">' + mission.minPlayers + '+ players' + groupTag + '</div>' +
        '<div class="mission-accept-btn" data-mission="' + mission.id + '">ACCEPT</div>';
      missionBoardList.appendChild(card);
    }
    // Add click handlers
    const acceptBtns = missionBoardList.querySelectorAll('.mission-accept-btn');
    for (const btn of acceptBtns) {
      btn.addEventListener('click', (e) => {
        const missionId = e.target.getAttribute('data-mission');
        if (socket && joined) {
          socket.emit('action', { type: 'accept_mission', missionId });
        }
        hideMissionBoard();
      });
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const missionId = e.target.getAttribute('data-mission');
        if (socket && joined) {
          socket.emit('action', { type: 'accept_mission', missionId });
        }
        hideMissionBoard();
      }, { passive: false });
    }
  }

  function hideMissionBoard() {
    missionBoardVisible = false;
    missionBoardOverlay.style.display = 'none';
  }

  // ============================================================
  // LEADERBOARD UI
  // ============================================================
  function updateLeaderboardUI() {
    leaderboardEntries.innerHTML = '';
    for (let i = 0; i < leaderboardData.length; i++) {
      const entry = leaderboardData[i];
      const div = document.createElement('div');
      div.className = 'lb-entry';
      div.innerHTML =
        '<span><span class="lb-rank">#' + (i + 1) + '</span>' +
        '<span class="lb-name ' + (entry.online ? 'online' : '') + '">' + entry.name + '</span></span>' +
        '<span class="lb-xp">' + entry.xp + '</span>';
      leaderboardEntries.appendChild(div);
    }
    onlineCount.textContent = serverStats.playersOnline + ' bird(s) currently causing chaos';
  }

  // ============================================================
  // INTERPOLATION
  // ============================================================
  function lerpBird(id, birds, prevBirds) {
    const bird = birds.find(b => b.id === id);
    if (!bird) return null;
    if (!prevBirds) return bird;
    const prev = prevBirds.find(b => b.id === id);
    if (!prev) return bird;

    const elapsed = performance.now() - stateTime;
    const interval = stateTime - prevStateTime;
    const t = interval > 0 ? Math.min(elapsed / interval, 1.5) : 1;

    return {
      ...bird,
      x: prev.x + (bird.x - prev.x) * t,
      y: prev.y + (bird.y - prev.y) * t,
      rotation: prev.rotation + (bird.rotation - prev.rotation) * Math.min(t, 1),
      wingPhase: bird.wingPhase,
    };
  }

  // ============================================================
  // EFFECTS
  // ============================================================
  function drawEffects(ctx, camera, now) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const fx = effects[i];
      const age = now - fx.time;
      if (age > fx.duration) { effects.splice(i, 1); continue; }
      const progress = age / fx.duration;
      const sx = fx.x - camera.x + camera.screenW / 2;
      const sy = fx.y - camera.y + camera.screenH / 2;

      if (fx.type === 'splat') {
        const r = fx.radius * (0.5 + progress * 0.5);
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = '#6b4226';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        for (let j = 0; j < 6; j++) {
          const angle = (j / 6) * Math.PI * 2;
          const dist = r * 1.5 * progress;
          ctx.beginPath();
          ctx.arc(sx + Math.cos(angle) * dist, sy + Math.sin(angle) * dist, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (fx.type === 'xp' || fx.type === 'text') {
        ctx.globalAlpha = 1 - progress;
        ctx.font = 'bold ' + (fx.size || 13) + 'px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = fx.color || '#ffd700';
        ctx.fillText(fx.text, sx, sy - progress * 30);
        ctx.globalAlpha = 1;
      }

      if (fx.type === 'evolve') {
        ctx.globalAlpha = 1 - progress;
        ctx.font = 'bold 24px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const ey = camera.screenH / 2 - 50 - progress * 30;
        ctx.strokeText(fx.text, camera.screenW / 2, ey);
        ctx.fillText(fx.text, camera.screenW / 2, ey);
        ctx.globalAlpha = 1;
      }

      if (fx.type === 'ground_pound') {
        Sprites.drawGroundPoundWave(ctx, sx, sy, progress);
      }

      if (fx.type === 'dive_bomb_trail') {
        Sprites.drawDiveBombTrail(ctx, sx, sy, fx.rotation || 0, progress);
      }

      if (fx.type === 'screen_shake') {
        // Screen shake handled by camera offset
      }

      if (fx.type === 'particle') {
        const px = sx + fx.vx * (age / 1000);
        const py = sy + fx.vy * (age / 1000);
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = fx.color || '#ff44ff';
        ctx.beginPath();
        ctx.arc(px, py, fx.radius || 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Sound bubbles
    for (let i = soundBubbles.length - 1; i >= 0; i--) {
      const sb = soundBubbles[i];
      const age = now - sb.time;
      if (age > 2000) { soundBubbles.splice(i, 1); continue; }
      const progress = age / 2000;
      const sx = sb.x - camera.x + camera.screenW / 2;
      const sy = sb.y - camera.y + camera.screenH / 2;
      ctx.globalAlpha = 1 - progress;
      ctx.font = 'bold 14px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(sb.text, sx, sy - 20 - progress * 25);
      ctx.globalAlpha = 1;
    }
  }

  // ============================================================
  // WEATHER RENDERING
  // ============================================================
  // Lazily generated rain drop pool
  let _rainDrops = null;
  function _ensureRainDrops(sw, sh) {
    if (_rainDrops && _rainDrops.sw === sw && _rainDrops.sh === sh) return;
    _rainDrops = { sw, sh, drops: [] };
    for (let i = 0; i < 300; i++) {
      _rainDrops.drops.push({
        x: Math.random() * sw,
        y: Math.random() * sh,
        len: 8 + Math.random() * 10,
        speed: 280 + Math.random() * 180,
        opacity: 0.3 + Math.random() * 0.5,
      });
    }
  }

  // Lazily generated hail chunk pool
  let _hailChunks = null;
  function _ensureHailChunks(sw, sh) {
    if (_hailChunks && _hailChunks.sw === sw && _hailChunks.sh === sh) return;
    _hailChunks = { sw, sh, chunks: [] };
    for (let i = 0; i < 180; i++) {
      _hailChunks.chunks.push({
        x: Math.random() * sw,
        y: Math.random() * sh,
        size: 2.5 + Math.random() * 3.5,   // chunky ice pellets
        speed: 380 + Math.random() * 240,   // faster than rain
        opacity: 0.55 + Math.random() * 0.35,
        wobble: Math.random() * Math.PI * 2, // slight horizontal wobble phase
      });
    }
  }

  // Lazily generated blizzard snowflake pool
  let _snowflakes = null;
  function _ensureSnowflakes(sw, sh) {
    if (_snowflakes && _snowflakes.sw === sw && _snowflakes.sh === sh) return;
    _snowflakes = { sw, sh, flakes: [] };
    for (let i = 0; i < 260; i++) {
      _snowflakes.flakes.push({
        x:      Math.random() * sw,
        y:      Math.random() * sh,
        size:   1.5 + Math.random() * 3.0,
        speed:  40 + Math.random() * 80,    // gentle fall — slower than hail
        opacity: 0.5 + Math.random() * 0.45,
        wobble: Math.random() * Math.PI * 2, // horizontal drift phase
        wobbleAmp: 1.5 + Math.random() * 3.0,
        sparkle: Math.random() > 0.7,        // larger flakes get a shimmer highlight
      });
    }
  }

  // Lazily generated heat-haze line pool (horizontal shimmer streaks rising upward)
  let _heatHaze = null;
  function _ensureHeatHaze(sw, sh) {
    if (_heatHaze && _heatHaze.sw === sw && _heatHaze.sh === sh) return;
    _heatHaze = { sw, sh, lines: [] };
    for (let i = 0; i < 60; i++) {
      _heatHaze.lines.push({
        x:           Math.random() * sw,
        y:           Math.random() * sh,
        len:         10 + Math.random() * 35,
        speed:       12 + Math.random() * 22,          // upward drift px/s
        wobble:      Math.random() * Math.PI * 2,
        wobbleSpeed: 2 + Math.random() * 4,
        amplitude:   3 + Math.random() * 8,            // horizontal wiggle
        opacity:     0.04 + Math.random() * 0.07,
        thickness:   0.5 + Math.random() * 1.0,
      });
    }
  }

  // Lazily generated fog wisp pool
  let _fogWisps = null;
  function _ensureFogWisps(sw, sh) {
    if (_fogWisps && _fogWisps.sw === sw && _fogWisps.sh === sh) return;
    _fogWisps = { sw, sh, wisps: [] };
    for (let i = 0; i < 40; i++) {
      _fogWisps.wisps.push({
        x: Math.random() * sw,
        y: Math.random() * sh,
        w: 80 + Math.random() * 200,
        h: 18 + Math.random() * 30,
        speed: 6 + Math.random() * 14,       // slow horizontal drift
        opacity: 0.06 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // ============================================================
  // CHERRY BLOSSOMS — falling pink petals (screen-space, seasonal)
  // ============================================================
  let _cherryPetals = null;
  function _ensureCherryPetals(sw, sh) {
    if (_cherryPetals && _cherryPetals.sw === sw && _cherryPetals.sh === sh) return;
    _cherryPetals = { sw, sh, petals: [] };
    for (let i = 0; i < 70; i++) {
      _cherryPetals.petals.push({
        x:       Math.random() * sw,
        y:       Math.random() * sh,
        size:    2.0 + Math.random() * 3.5,  // petal size
        speed:   18 + Math.random() * 30,    // fall speed px/s
        sway:    Math.random() * Math.PI * 2, // horizontal sway phase
        swayAmp: 15 + Math.random() * 30,    // sway amplitude
        swaySpd: 0.4 + Math.random() * 0.8,  // sway frequency
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 3.0, // tumble speed rad/s
        opacity:  0.55 + Math.random() * 0.4,
        // Petal shape: oval rotated by rotation
        ratiox: 0.8 + Math.random() * 0.5,  // x radius multiplier
        ratioy: 0.4 + Math.random() * 0.4,  // y radius multiplier (flatter petal)
      });
    }
  }

  function drawCherryBlossomPetals(ctx, now, dt, sw, sh) {
    _ensureCherryPetals(sw, sh);
    ctx.save();
    for (const petal of _cherryPetals.petals) {
      // Animate
      petal.y += petal.speed * dt;
      petal.x += Math.sin(petal.sway) * petal.swayAmp * dt * petal.swaySpd;
      petal.sway += petal.swaySpd * dt;
      petal.rotation += petal.rotSpeed * dt;
      // Wrap
      if (petal.y > sh + 10) { petal.y = -10; petal.x = Math.random() * sw; }
      if (petal.x > sw + 20) petal.x -= sw + 40;
      if (petal.x < -20) petal.x += sw + 40;

      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);
      ctx.globalAlpha = petal.opacity;
      // Petal color — varied pink/white tones
      const hue = 330 + Math.sin(petal.sway * 0.5) * 15;
      ctx.fillStyle = `hsl(${hue}, 85%, 85%)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size * petal.ratiox, petal.size * petal.ratioy, 0, 0, Math.PI * 2);
      ctx.fill();
      // Subtle vein line down center of petal
      ctx.strokeStyle = `hsla(${hue - 10}, 70%, 72%, ${petal.opacity * 0.5})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -petal.size * petal.ratiox * 0.5);
      ctx.lineTo(0,  petal.size * petal.ratiox * 0.5);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ============================================================
  // TORNADO — world-space drawing (call before zoom ctx.restore())
  // ============================================================
  // Tornado debris particles (lazily initialized, static offsets)
  let _tornadoDebris = null;
  function _ensureTornadoDebris() {
    if (_tornadoDebris) return;
    _tornadoDebris = [];
    for (let i = 0; i < 55; i++) {
      _tornadoDebris.push({
        orbitRadius: 55 + Math.random() * 200,    // how far from center
        orbitAngleOffset: Math.random() * Math.PI * 2,
        orbitSpeed: 1.8 + Math.random() * 3.0,   // rad/s
        heightFrac: Math.random(),                 // 0=bottom, 1=top of funnel
        size: 3 + Math.random() * 8,
        opacity: 0.35 + Math.random() * 0.55,
        type: Math.random() < 0.4 ? 'rect' : 'circle', // mixed debris
      });
    }
  }

  // Blood Moon: pulsing crimson vignette at screen edges
  function drawBloodMoonVignette(ctx, sw, sh, now) {
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.0015);
    const grad = ctx.createRadialGradient(sw / 2, sh / 2, sh * 0.3, sw / 2, sh / 2, sh * 0.85);
    grad.addColorStop(0, 'rgba(80, 0, 0, 0)');
    grad.addColorStop(0.7, `rgba(120, 0, 0, ${0.05 + pulse * 0.04})`);
    grad.addColorStop(1, `rgba(180, 0, 0, ${0.15 + pulse * 0.1})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, sw, sh);
  }

  function drawTornadoInWorld(ctx, camera, weather, now) {
    if (!weather || weather.type !== 'tornado') return;
    const tx = weather.tornadoX;
    const ty = weather.tornadoY;
    if (tx === undefined || ty === undefined) return;

    // Convert world position to screen position (ctx is in zoomed world space)
    const sx = tx - camera.x + camera.screenW / 2;
    const sy = ty - camera.y + camera.screenH / 2;

    // Cull if way off screen
    const cullMargin = 400;
    if (sx < -cullMargin || sx > camera.screenW + cullMargin ||
        sy < -cullMargin || sy > camera.screenH + cullMargin) return;

    _ensureTornadoDebris();
    const t = now * 0.001;

    // ── Tornado funnel height and dimensions ──
    const FUNNEL_HEIGHT = 340;   // total height of the tornado sprite
    const BASE_RADIUS   = 160;   // wide mouth at the sky (top)
    const TIP_RADIUS    = 12;    // narrow tip at ground (bottom)

    ctx.save();

    // --- Ground shadow / dust base ---
    const shadowGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, BASE_RADIUS * 0.9);
    shadowGrad.addColorStop(0, 'rgba(30,0,50,0.45)');
    shadowGrad.addColorStop(0.5, 'rgba(40,10,60,0.22)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(sx, sy, BASE_RADIUS * 0.9, BASE_RADIUS * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Funnel body: stacked rotating ellipses narrowing toward the tip ---
    const LAYERS = 22;
    for (let i = 0; i < LAYERS; i++) {
      const frac = i / (LAYERS - 1);               // 0 = ground tip, 1 = sky mouth
      const layerY = sy - frac * FUNNEL_HEIGHT;
      const layerRx = TIP_RADIUS + (BASE_RADIUS - TIP_RADIUS) * frac;
      const layerRy = layerRx * 0.28;              // flatten to give depth perspective

      // Rotation phase shifts with layer index for the spiral appearance
      const rotPhase = t * 2.4 + frac * Math.PI * 5;
      const alpha = frac < 0.15
        ? 0.55 + frac * 2       // fade in at the very tip
        : (0.25 + frac * 0.38); // gradually more opaque toward the top

      // Outer dark ring
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = `hsl(${270 + frac * 30}, 50%, ${12 + frac * 20}%)`;
      ctx.lineWidth = 3 + frac * 5;
      ctx.beginPath();
      ctx.ellipse(sx + Math.cos(rotPhase) * layerRx * 0.08, layerY,
                  layerRx, layerRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner highlight arc (lighter purple core)
      ctx.globalAlpha = alpha * 0.35;
      ctx.strokeStyle = `hsl(${280 + frac * 20}, 65%, ${30 + frac * 30}%)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx + Math.cos(rotPhase + 0.8) * layerRx * 0.6,
              layerY + Math.sin(rotPhase + 0.8) * layerRy * 0.4,
              layerRx * 0.55, rotPhase * 0.8, rotPhase * 0.8 + Math.PI);
      ctx.stroke();
    }

    // --- Debris particles orbiting the tornado ---
    ctx.globalAlpha = 1;
    for (const d of _tornadoDebris) {
      const orbitAngle = t * d.orbitSpeed + d.orbitAngleOffset;
      // Debris height mapped so frac=0 is tip, frac=1 is mouth
      const debrisFrac = d.heightFrac;
      const debrisR = TIP_RADIUS + (BASE_RADIUS - TIP_RADIUS) * debrisFrac;
      const actualOrbitR = d.orbitRadius * (debrisR / BASE_RADIUS);
      const dsx = sx + Math.cos(orbitAngle) * actualOrbitR;
      const dsy = (sy - debrisFrac * FUNNEL_HEIGHT) + Math.sin(orbitAngle) * actualOrbitR * 0.28;

      ctx.globalAlpha = d.opacity * (0.55 + debrisFrac * 0.45);
      ctx.fillStyle = `hsl(${260 + Math.sin(orbitAngle) * 20}, 25%, ${15 + debrisFrac * 25}%)`;
      if (d.type === 'rect') {
        ctx.save();
        ctx.translate(dsx, dsy);
        ctx.rotate(orbitAngle * 2);
        ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size * 0.6);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(dsx, dsy, d.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- Inner eye glow (eerie purple light at the tip) ---
    ctx.globalAlpha = 0.55 + Math.sin(t * 3.5) * 0.15;
    const eyeGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, TIP_RADIUS * 3.5);
    eyeGrad.addColorStop(0, 'rgba(200,120,255,0.75)');
    eyeGrad.addColorStop(0.5, 'rgba(140,60,200,0.35)');
    eyeGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, TIP_RADIUS * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // --- Spinning top cloud mass (wide dark cap at sky) ---
    const cloudY = sy - FUNNEL_HEIGHT;
    ctx.globalAlpha = 0.7;
    const cloudGrad = ctx.createRadialGradient(sx, cloudY, 0, sx, cloudY, BASE_RADIUS * 1.4);
    cloudGrad.addColorStop(0, 'rgba(40,10,65,0.9)');
    cloudGrad.addColorStop(0.45, 'rgba(50,20,75,0.65)');
    cloudGrad.addColorStop(1, 'rgba(20,5,35,0)');
    ctx.fillStyle = cloudGrad;
    ctx.beginPath();
    ctx.ellipse(sx, cloudY, BASE_RADIUS * 1.4, BASE_RADIUS * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cloud edge wisps rotating
    for (let w = 0; w < 6; w++) {
      const wAngle = t * 1.5 + (w / 6) * Math.PI * 2;
      const wsx = sx + Math.cos(wAngle) * BASE_RADIUS * (0.9 + Math.sin(t * 2 + w) * 0.2);
      const wsy = cloudY + Math.sin(wAngle) * BASE_RADIUS * 0.3;
      ctx.globalAlpha = 0.3 + Math.sin(t * 2 + w) * 0.1;
      ctx.fillStyle = 'rgba(80, 30, 110, 0.5)';
      ctx.beginPath();
      ctx.ellipse(wsx, wsy, 35 + Math.sin(t + w) * 8, 16, wAngle * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- "🌪️ TORNADO" label above the cloud ---
    ctx.globalAlpha = 0.9;
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#dd88ff';
    const labelY = cloudY - 20;
    ctx.strokeText('🌪️ TORNADO', sx, labelY);
    ctx.fillText('🌪️ TORNADO', sx, labelY);

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawWeather(ctx, camera, now, weather) {
    if (!weather) return;
    const sw = camera.screenW;
    const sh = camera.screenH;
    const dt = 0.05; // approximate frame dt for animation

    const isRainy = weather.type === 'rain' || weather.type === 'storm';
    const isWindy = weather.windSpeed > 0;

    // === TORNADO SCREEN EFFECTS (directional vignette + direction arrow) ===
    if (weather.type === 'tornado' && weather.tornadoX !== undefined) {
      const tx = weather.tornadoX;
      const ty = weather.tornadoY;
      // Convert to screen space
      const tSx = tx - camera.x + sw / 2;
      const tSy = ty - camera.y + sh / 2;
      const distToTornado = Math.sqrt((tSx - sw / 2) ** 2 + (tSy - sh / 2) ** 2);
      const VIGNETTE_START = 450;   // px screen distance where tint begins
      const VIGNETTE_FULL  = 150;   // px where tint is at max

      // Proximity-based purple tint (stronger when tornado is close)
      const tintStrength = Math.max(0, Math.min(1, 1 - (distToTornado - VIGNETTE_FULL) / (VIGNETTE_START - VIGNETTE_FULL)));
      if (tintStrength > 0) {
        const pulse = 0.8 + Math.sin(now * 0.008) * 0.2;
        ctx.save();
        ctx.globalAlpha = tintStrength * 0.28 * pulse;
        ctx.fillStyle = '#6600aa';
        ctx.fillRect(0, 0, sw, sh);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Directional arrow when tornado is off-screen (like mystery crate compass)
      const onScreen = tSx > 40 && tSx < sw - 40 && tSy > 40 && tSy < sh - 40;
      if (!onScreen) {
        const angle = Math.atan2(tSy - sh / 2, tSx - sw / 2);
        const arrowR = Math.min(sw, sh) * 0.42;
        const arrowX = sw / 2 + Math.cos(angle) * arrowR;
        const arrowY = sh / 2 + Math.sin(angle) * arrowR;
        const arrowPulse = 0.65 + Math.sin(now * 0.01) * 0.35;
        ctx.save();
        ctx.globalAlpha = arrowPulse * 0.9;
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        // Arrow body
        ctx.fillStyle = '#cc66ff';
        ctx.strokeStyle = '#220033';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-8, -10);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, 10);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        // Emoji
        ctx.font = '18px serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = arrowPulse * 0.95;
        ctx.fillText('🌪️', -18, 6);
        ctx.restore();
      }
    }

    // === FOG VIGNETTE ===
    // Dense fog fills the screen except for a clear radius around the player's bird
    if (weather.type === 'fog') {
      _ensureFogWisps(sw, sh);
      const density = weather.intensity; // 0.75–1.0
      const playerSx = sw / 2;
      const playerSy = sh / 2;

      // Background fog tint (grey-green haze over entire screen)
      ctx.save();
      ctx.globalAlpha = density * 0.18;
      ctx.fillStyle = '#8aaa90';
      ctx.fillRect(0, 0, sw, sh);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Fog wisps drifting slowly left to right
      ctx.save();
      for (const wisp of _fogWisps.wisps) {
        wisp.x += wisp.speed * dt;
        if (wisp.x > sw + wisp.w) wisp.x = -wisp.w;
        const wy = wisp.y + Math.sin(now * 0.0003 + wisp.phase) * 8;
        const pulse = 0.85 + Math.sin(now * 0.0008 + wisp.phase * 2) * 0.15;
        ctx.globalAlpha = wisp.opacity * density * pulse;
        ctx.fillStyle = '#b8d0bc';
        ctx.beginPath();
        ctx.ellipse(wisp.x, wy, wisp.w / 2, wisp.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Radial visibility mask: clear around player, thick fog far from player
      ctx.save();
      const fogRadius = 220 + (1 - density) * 100; // smaller radius = denser fog
      const outerRadius = fogRadius * 2.2;
      const grad = ctx.createRadialGradient(playerSx, playerSy, fogRadius * 0.6, playerSx, playerSy, outerRadius);
      grad.addColorStop(0, 'rgba(168, 190, 170, 0)');
      grad.addColorStop(0.45, 'rgba(160, 185, 165, ' + (density * 0.55) + ')');
      grad.addColorStop(1.0, 'rgba(148, 175, 155, ' + (density * 0.88) + ')');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, sw, sh);
      ctx.restore();
    }

    // === HEATWAVE SHIMMER ===
    if (weather.type === 'heatwave') {
      const intensity = weather.intensity;
      // Baked orange-yellow tint over the entire screen
      ctx.save();
      ctx.globalAlpha = intensity * 0.14;
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(0, 0, sw, sh);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Wavy heat-haze lines rising from the bottom of the screen
      _ensureHeatHaze(sw, sh);
      ctx.save();
      for (const h of _heatHaze.lines) {
        h.y -= h.speed * dt;                        // rise upward
        h.wobble += h.wobbleSpeed * dt;
        if (h.y < -8) { h.y = sh + 4; h.x = Math.random() * sw; } // wrap to bottom
        const ox = Math.sin(h.wobble) * h.amplitude; // horizontal shimmer
        ctx.globalAlpha = h.opacity * intensity * (1 - (sh - h.y) / sh * 0.6);
        ctx.strokeStyle = `rgba(255, 180, 60, ${h.opacity * intensity * 0.6})`;
        ctx.lineWidth = h.thickness;
        ctx.beginPath();
        ctx.moveTo(h.x + ox - h.len / 2, h.y);
        ctx.lineTo(h.x + ox + h.len / 2, h.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Vignette — hotter at the edges (orange radial glow)
      ctx.save();
      const vGrad = ctx.createRadialGradient(sw / 2, sh / 2, sw * 0.25, sw / 2, sh / 2, sw * 0.8);
      vGrad.addColorStop(0, 'rgba(255, 120, 0, 0)');
      vGrad.addColorStop(1, `rgba(200, 60, 0, ${intensity * 0.22})`);
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, sw, sh);
      ctx.restore();
    }

    // === HAILSTORM CHUNKS ===
    if (weather.type === 'hailstorm') {
      _ensureHailChunks(sw, sh);
      const wx = Math.cos(weather.windAngle);
      const wy = Math.sin(weather.windAngle);
      const windTilt = wx * 0.35;

      ctx.save();
      for (const chunk of _hailChunks.chunks) {
        // Animate: fast downward fall + wind tilt + slight wobble
        chunk.y += chunk.speed * dt;
        chunk.x += windTilt * chunk.speed * dt + Math.sin(now * 0.003 + chunk.wobble) * 0.4;
        if (chunk.y > sh + 10) { chunk.y = -10; chunk.x = Math.random() * sw; }
        if (chunk.x > sw + 10) chunk.x -= sw + 20;
        if (chunk.x < -10) chunk.x += sw + 20;

        ctx.globalAlpha = chunk.opacity * weather.intensity;
        // Ice pellet: small white-blue rounded square
        ctx.fillStyle = '#d8eeff';
        ctx.beginPath();
        ctx.roundRect(chunk.x - chunk.size / 2, chunk.y - chunk.size / 2, chunk.size, chunk.size, 1.5);
        ctx.fill();
        // Subtle blue outline
        ctx.strokeStyle = 'rgba(160, 210, 255, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === BLIZZARD SNOWFLAKES + ICY TINT ===
    if (weather.type === 'blizzard') {
      _ensureSnowflakes(sw, sh);
      const wx = weather.windAngle ? Math.cos(weather.windAngle) : -0.3;
      const windTilt = wx * 0.18; // gentle diagonal from wind

      // Icy blue world tint
      ctx.save();
      ctx.globalAlpha = 0.09 * weather.intensity;
      ctx.fillStyle = '#b0d8ff';
      ctx.fillRect(0, 0, sw, sh);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Snowflakes
      ctx.save();
      for (const flake of _snowflakes.flakes) {
        flake.wobble += 0.015;
        flake.y += flake.speed * dt;
        flake.x += windTilt * flake.speed * dt + Math.sin(flake.wobble) * flake.wobbleAmp * dt * 40;
        if (flake.y > sh + 6) { flake.y = -6; flake.x = Math.random() * sw; }
        if (flake.x > sw + 6) flake.x -= sw + 12;
        if (flake.x < -6) flake.x += sw + 12;

        ctx.globalAlpha = flake.opacity * weather.intensity;
        ctx.fillStyle = flake.sparkle ? '#eaf6ff' : '#cce8ff';
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
        // Sparkle cross on larger flakes
        if (flake.sparkle && flake.size > 3) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(flake.x - flake.size * 1.4, flake.y);
          ctx.lineTo(flake.x + flake.size * 1.4, flake.y);
          ctx.moveTo(flake.x, flake.y - flake.size * 1.4);
          ctx.lineTo(flake.x, flake.y + flake.size * 1.4);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === RAIN DROPS ===
    if (isRainy) {
      _ensureRainDrops(sw, sh);
      const intensity = weather.intensity;
      const windTilt = isWindy ? (Math.cos(weather.windAngle) * 0.4) : -0.2; // slight diagonal

      ctx.save();
      ctx.strokeStyle = 'rgba(170, 210, 255, 0.55)';
      ctx.lineWidth = 1;
      for (const drop of _rainDrops.drops) {
        // Animate drop position
        drop.y += drop.speed * dt;
        drop.x += windTilt * drop.speed * dt;
        if (drop.y > sh + 20) { drop.y = -20; drop.x = Math.random() * sw; }
        if (drop.x > sw + 20) drop.x -= sw + 40;
        if (drop.x < -20) drop.x += sw + 40;

        ctx.globalAlpha = drop.opacity * intensity;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + windTilt * drop.len, drop.y + drop.len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === WIND STREAKS (visible during wind/storm) ===
    if (isWindy) {
      const t = now * 0.001;
      const wx = Math.cos(weather.windAngle);
      const wy = Math.sin(weather.windAngle);
      const count = Math.floor(weather.intensity * 18);
      ctx.save();
      ctx.strokeStyle = 'rgba(200, 230, 255, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < count; i++) {
        // Each streak has a fixed seed so it loops smoothly
        const seed = (i * 2.39996) % 1; // golden ratio spacing
        const baseX = (seed * sw * 2.5 + t * weather.windSpeed * 0.4 * wx) % (sw * 1.5) - sw * 0.25;
        const baseY = ((i / count) * sh * 1.5 + t * weather.windSpeed * 0.4 * wy) % (sh * 1.5) - sh * 0.25;
        const len = 25 + seed * 50;
        ctx.globalAlpha = 0.15 + seed * 0.2;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(baseX + wx * len, baseY + wy * len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // === WIND DIRECTION INDICATOR (bottom-left corner) ===
      const indicatorX = 20;
      const indicatorY = sh - 55;
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(indicatorX, indicatorY, 80, 36, 6);
      ctx.fill();
      ctx.fillStyle = '#aaddff';
      ctx.font = 'bold 9px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText('WIND', indicatorX + 6, indicatorY + 13);
      // Arrow showing wind direction
      const arrowCx = indicatorX + 60;
      const arrowCy = indicatorY + 18;
      const arrowLen = 12;
      const aPulse = Math.sin(now * 0.005) * 0.15 + 0.85;
      ctx.globalAlpha = aPulse * 0.9;
      ctx.strokeStyle = '#aaddff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arrowCx - wx * arrowLen * 0.5, arrowCy - wy * arrowLen * 0.5);
      ctx.lineTo(arrowCx + wx * arrowLen, arrowCy + wy * arrowLen);
      ctx.stroke();
      // Arrowhead
      const headAngle = Math.atan2(wy, wx);
      ctx.fillStyle = '#aaddff';
      ctx.beginPath();
      ctx.moveTo(arrowCx + wx * arrowLen, arrowCy + wy * arrowLen);
      ctx.lineTo(
        arrowCx + wx * arrowLen - Math.cos(headAngle - 0.5) * 6,
        arrowCy + wy * arrowLen - Math.sin(headAngle - 0.5) * 6
      );
      ctx.lineTo(
        arrowCx + wx * arrowLen - Math.cos(headAngle + 0.5) * 6,
        arrowCy + wy * arrowLen - Math.sin(headAngle + 0.5) * 6
      );
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === WEATHER BADGE (top-center, alongside clock) ===
    const badges = {
      rain: '🌧️ RAIN',
      wind: '💨 WIND',
      storm: '⛈️ STORM',
      fog: '🌫️ FOG',
      hailstorm: '🌨️ HAIL',
      heatwave: '🌡️ HEATWAVE',
      tornado: '🌪️ TORNADO',
      blizzard: '❄️ BLIZZARD',
    };
    const badgeBg = {
      storm: 'rgba(60, 40, 0, 0.75)',
      fog: 'rgba(80, 100, 80, 0.72)',
      hailstorm: 'rgba(20, 50, 90, 0.78)',
      heatwave: 'rgba(100, 40, 0, 0.80)',
      tornado: 'rgba(60, 20, 90, 0.85)',
      blizzard: 'rgba(10, 30, 70, 0.85)',
    };
    const badgeColor = {
      storm: '#ffdd44',
      fog: '#c8e8cc',
      hailstorm: '#aaddff',
      heatwave: '#ffaa44',
      tornado: '#dd88ff',
      blizzard: '#cceeFF',
    };
    const badge = badges[weather.type];
    if (badge) {
      const timeRemaining = Math.max(0, Math.ceil((weather.endsAt - Date.now()) / 1000));
      const mins = Math.floor(timeRemaining / 60);
      const secs = timeRemaining % 60;
      const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      const pulse = (weather.type === 'storm' || weather.type === 'hailstorm')
        ? (Math.sin(now * 0.006) * 0.15 + 0.85)
        : (weather.type === 'heatwave' ? (Math.sin(now * 0.004) * 0.18 + 0.82)
        : (weather.type === 'fog' ? (Math.sin(now * 0.002) * 0.08 + 0.92)
        : (weather.type === 'tornado' ? (Math.sin(now * 0.008) * 0.22 + 0.78)
        : (weather.type === 'blizzard' ? (Math.sin(now * 0.003) * 0.10 + 0.90) : 1))));
      ctx.save();
      ctx.globalAlpha = pulse * 0.88;
      ctx.fillStyle = badgeBg[weather.type] || 'rgba(20, 40, 80, 0.65)';
      ctx.beginPath();
      ctx.roundRect(sw / 2 + 75, 6, 105, 24, 5);
      ctx.fill();
      ctx.fillStyle = badgeColor[weather.type] || '#88ccff';
      ctx.font = 'bold 10px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(badge + ' ' + timeStr, sw / 2 + 127, 22);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === AURORA BOREALIS badge (below weather badge or standalone when no weather) ===
    if (gameState.aurora && gameState.aurora.endsAt > now) {
      const auLeft = Math.max(0, Math.ceil((gameState.aurora.endsAt - now) / 1000));
      const auMins = Math.floor(auLeft / 60);
      const auSecs = auLeft % 60;
      const auTime = auMins > 0 ? `${auMins}m ${auSecs}s` : `${auLeft}s`;
      const auPulse = Math.sin(now * 0.003) * 0.15 + 0.85;
      const auHue = (now * 0.06) % 360;
      // Position: directly below weather badge, or at same spot if no weather
      const badgeY = weather && badges[weather.type] ? 34 : 6;
      ctx.save();
      ctx.globalAlpha = auPulse * 0.92;
      ctx.fillStyle = 'rgba(0, 50, 35, 0.82)';
      ctx.beginPath();
      ctx.roundRect(sw / 2 + 75, badgeY, 115, 24, 5);
      ctx.fill();
      // Hue-cycling border glow
      ctx.strokeStyle = `hsl(${auHue}, 80%, 65%)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = `hsl(${(auHue + 30) % 360}, 90%, 75%)`;
      ctx.font = 'bold 10px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('✨ AURORA ' + auTime, sw / 2 + 132, badgeY + 16);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === CHERRY BLOSSOM SPRING badge ===
    if (gameState.cherryBlossoms) {
      const springPulse = Math.sin(now * 0.0015) * 0.12 + 0.88;
      const springBadgeY = 6 + (weather && badges[weather.type] ? 28 : 0) + (gameState.aurora && gameState.aurora.endsAt > now ? 28 : 0);
      ctx.save();
      ctx.globalAlpha = springPulse * 0.9;
      ctx.fillStyle = 'rgba(80, 20, 40, 0.82)';
      ctx.beginPath();
      ctx.roundRect(sw / 2 - 192, springBadgeY, 100, 22, 5);
      ctx.fill();
      ctx.strokeStyle = '#ff88bb';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffccee';
      ctx.font = 'bold 10px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('🌸 SPRING', sw / 2 - 142, springBadgeY + 15);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  // ============================================================
  // ANNOUNCEMENTS (big center-screen text)
  // ============================================================
  function drawAnnouncements(ctx, now) {
    for (let i = announcements.length - 1; i >= 0; i--) {
      const a = announcements[i];
      const age = now - a.time;
      if (age > a.duration) { announcements.splice(i, 1); continue; }

      const progress = age / a.duration;
      let alpha = 1;
      if (progress < 0.1) alpha = progress / 0.1;
      else if (progress > 0.7) alpha = (1 - progress) / 0.3;

      ctx.globalAlpha = alpha;
      ctx.font = 'bold 28px Courier New';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.fillStyle = a.color;

      const y = camera.screenH * 0.25 + i * 40;
      ctx.strokeText(a.text, camera.screenW / 2, y);
      ctx.fillText(a.text, camera.screenW / 2, y);
      ctx.globalAlpha = 1;
    }
  }

  // ============================================================
  // DRAW EVENT TIMER
  // ============================================================
  function drawEventTimer(ctx, activeEvent) {
    if (!activeEvent) return;
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((activeEvent.endsAt - now) / 1000));
    if (remaining <= 0) return;

    const labels = {
      breadcrumbs: 'BREADCRUMB FRENZY',
      wedding: 'THE WEDDING',
      hawk: 'HAWK HUNTING',
      parade: 'PIGEON PARADE',
    };

    const label = labels[activeEvent.type] || 'EVENT';

    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(camera.screenW / 2 - 80, 10, 160, 30);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(label + ': ' + remaining + 's', camera.screenW / 2, 30);
  }

  // ============================================================
  // MAIN RENDER LOOP
  // ============================================================
  function render() {
    requestAnimationFrame(render);
    if (!joined || !gameState) return;

    const now = performance.now();

    // Camera follow
    const selfBird = lerpBird(myId, gameState.birds, prevState?.birds);
    if (selfBird) {
      camera.x += (selfBird.x - camera.x) * 0.1;
      camera.y += (selfBird.y - camera.y) * 0.1;
    }

    // Screen shake
    for (const fx of effects) {
      if (fx.type === 'screen_shake') {
        const age = now - fx.time;
        if (age < fx.duration) {
          const intensity = fx.intensity * (1 - age / fx.duration);
          camera.x += (Math.random() - 0.5) * intensity;
          camera.y += (Math.random() - 0.5) * intensity;
        }
      }
    }

    // Clear (full canvas, before zoom)
    // Background color shifts darker during night
    let bgColor = '#2a3a2a';
    if (gameState.dayTime !== undefined) {
      const dt = gameState.dayTime;
      if (dt >= 0.45 && dt < 0.75) bgColor = '#0a0f1a'; // deep night
      else if (dt >= 0.30 && dt < 0.45) bgColor = '#151a2a'; // dusk
      else if (dt >= 0.75 && dt < 0.90) bgColor = '#151a2a'; // dawn
    }
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply zoom — scale from center of screen
    const z = camera.zoom;
    ctx.save();
    ctx.translate(camera.screenW / 2, camera.screenH / 2);
    ctx.scale(z, z);
    ctx.translate(-camera.screenW / 2, -camera.screenH / 2);

    // Culling margin expanded for zoom
    const margin = 60;

    // World layers
    Renderer.drawGround(ctx, camera);

    // Territory zones (drawn on top of ground, below buildings/entities)
    if (gameState.territories && gameState.self) {
      const selfBird = gameState.self;
      const myTeamId = selfBird.flockId || ('solo_' + selfBird.id);
      Renderer.drawTerritories(ctx, camera, gameState.territories, myTeamId, gameState.crowCartel);
    }

    // Predator territory danger zones (hawk + cat)
    if (worldData && worldData.predatorTerritories) {
      Renderer.drawPredatorTerritories(ctx, camera, worldData, gameState.territoryPredators || null, now);
    }

    // Egg nest delivery zones (always visible when scramble is active)
    if (gameState.eggScramble && gameState.eggNestZones) {
      Renderer.drawEggNestZones(ctx, camera, gameState.eggNestZones, now / 1000);
    }

    Renderer.drawRoads(ctx, camera);
    Renderer.drawPark(ctx, camera, gameState ? gameState.dayTime : undefined, now);
    // Cherry Blossom Spring Festival — decorative trees in the park
    if (gameState && gameState.cherryBlossoms) {
      Renderer.drawCherryBlossomTrees(ctx, camera, now);
    }

    // The Arena (drawn on ground level, below buildings)
    if (worldData && worldData.arena) {
      Renderer.drawArena(ctx, camera, worldData.arena, gameState.arena || null, now);
    }

    Renderer.drawTables(ctx, camera);
    Renderer.drawLaundry(ctx, camera);
    Renderer.drawCars(ctx, camera);

    // Moving cars
    if (gameState.movingCars) {
      Renderer.drawMovingCars(ctx, camera, gameState.movingCars);
    }

    // Poops
    if (gameState.poops) {
      for (const poop of gameState.poops) {
        const sx = poop.x - camera.x + camera.screenW / 2;
        const sy = poop.y - camera.y + camera.screenH / 2;
        if (sx > -margin && sx < camera.screenW + margin && sy > -margin && sy < camera.screenH + margin) {
          if (poop.isLegend) {
            Sprites.drawGoldenPoop(ctx, sx, sy, now);
          } else if (poop.vpEffect) {
            Sprites.drawColoredPoop(ctx, sx, sy, poop.vpEffect, now);
          } else {
            Sprites.drawPoop(ctx, sx, sy);
          }
        }
      }
    }

    // Foods
    if (gameState.foods) {
      for (const food of gameState.foods) {
        const sx = food.x - camera.x + camera.screenW / 2;
        const sy = food.y - camera.y + camera.screenH / 2;
        if (sx > -margin && sx < camera.screenW + margin && sy > -margin && sy < camera.screenH + margin) {
          Sprites.drawFood(ctx, sx, sy, food.type);
        }
      }
    }

    // Chaos event foods (coin shower coins / food festival premium items)
    if (gameState.chaosEventFoods && gameState.chaosEventFoods.length > 0) {
      for (const food of gameState.chaosEventFoods) {
        const sx = food.x - camera.x + camera.screenW / 2;
        const sy = food.y - camera.y + camera.screenH / 2;
        if (sx > -margin && sx < camera.screenW + margin && sy > -margin && sy < camera.screenH + margin) {
          Sprites.drawFood(ctx, sx, sy, food.type || 'coin_shower');
        }
      }
    }

    // Golden eggs (on ground, unclaimed)
    if (gameState.eggScramble && gameState.eggScramble.eggs) {
      Renderer.drawGoldenEggs(ctx, camera, gameState.eggScramble.eggs, now / 1000);
    }

    // Bird Flu medicine items — glowing green capsules scattered across city during outbreak
    if (gameState.self && gameState.self.fluMedicineItems && gameState.self.fluMedicineItems.length > 0) {
      for (const med of gameState.self.fluMedicineItems) {
        const sx = med.x - camera.x + camera.screenW / 2;
        const sy = med.y - camera.y + camera.screenH / 2;
        if (sx > -margin && sx < camera.screenW + margin && sy > -margin && sy < camera.screenH + margin) {
          Sprites.drawMedicineItem(ctx, sx, sy, now);
        }
      }
    }

    // Power-ups
    if (gameState.powerUps) {
      for (const pu of gameState.powerUps) {
        const sx = pu.x - camera.x + camera.screenW / 2;
        const sy = pu.y - camera.y + camera.screenH / 2;
        if (sx > -margin && sx < camera.screenW + margin && sy > -margin && sy < camera.screenH + margin) {
          Sprites.drawPowerUp(ctx, sx, sy, pu.type);
        }
      }
    }

    // NPCs (includes event NPCs now)
    if (gameState.npcs) {
      for (const npc of gameState.npcs) {
        const sx = npc.x - camera.x + camera.screenW / 2;
        const sy = npc.y - camera.y + camera.screenH / 2;
        if (sx > -margin && sx < camera.screenW + margin && sy > -margin && sy < camera.screenH + margin) {
          if (npc.type === 'bride') {
            Sprites.drawBride(ctx, sx, sy);
          } else if (npc.type === 'old_lady') {
            Sprites.drawOldLady(ctx, sx, sy);
          } else if (npc.type === 'parade_pigeon' || npc.type === 'summoned_pigeon') {
            // Draw as a small bird
            Sprites.drawBird(ctx, sx, sy, 0, 'pigeon', now * 0.005, false);
          } else if (npc.type === 'revenge_npc') {
            Sprites.drawRevengeNPC(ctx, sx, sy);
          } else {
            Sprites.drawNPC(ctx, sx, sy, npc.type, npc.state, npc.poopedOn);
          }
        }
      }
    }

    // Cat
    if (gameState.cat) {
      const cat = gameState.cat;
      const sx = cat.x - camera.x + camera.screenW / 2;
      const sy = cat.y - camera.y + camera.screenH / 2;
      if (sx > -margin - 20 && sx < camera.screenW + margin + 20 && sy > -margin - 20 && sy < camera.screenH + margin + 20) {
        Sprites.drawCat(ctx, sx, sy, cat.rotation);
      }
    }

    // Janitor
    if (gameState.janitor) {
      const jan = gameState.janitor;
      const sx = jan.x - camera.x + camera.screenW / 2;
      const sy = jan.y - camera.y + camera.screenH / 2;
      if (sx > -margin - 20 && sx < camera.screenW + margin + 20 && sy > -margin - 20 && sy < camera.screenH + margin + 20) {
        Sprites.drawJanitor(ctx, sx, sy, jan.state, jan.isSuper);
      }
    }

    // Hawk
    if (gameState.hawk) {
      const hawk = gameState.hawk;
      const sx = hawk.x - camera.x + camera.screenW / 2;
      const sy = hawk.y - camera.y + camera.screenH / 2;
      if (sx > -margin - 30 && sx < camera.screenW + margin + 30 && sy > -margin - 30 && sy < camera.screenH + margin + 30) {
        Sprites.drawHawk(ctx, sx, sy, hawk.rotation);
      }
    }

    // Boss
    if (gameState.boss) {
      const boss = gameState.boss;
      const sx = boss.x - camera.x + camera.screenW / 2;
      const sy = boss.y - camera.y + camera.screenH / 2;
      if (sx > -margin - 100 && sx < camera.screenW + margin + 100 && sy > -margin - 100 && sy < camera.screenH + margin + 100) {
        if (boss.type === 'EAGLE_OVERLORD') {
          // ── Eagle ground shadow (drawn before boss) ──
          ctx.save();
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.ellipse(sx + 18, sy + 30, 85, 30, boss.rotation * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          // ── Eagle Overlord sprite ──
          ctx.save();
          ctx.shadowColor = 'rgba(255, 140, 0, 0.7)';
          ctx.shadowBlur = 30;
          ctx.translate(sx, sy);
          ctx.scale(3, 3);
          Sprites.drawEagleOverlord(ctx, 0, 0, boss.rotation, !!boss.snatchedBirdId, performance.now());
          ctx.restore();
          // HP bar (wider for the raid boss)
          const hpRatio = Math.max(0, boss.hp / boss.maxHp);
          const barW = 120, barH = 10;
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(sx - barW / 2 - 1, sy - 80 - barH / 2 - 1, barW + 2, barH + 2);
          ctx.fillStyle = '#440000';
          ctx.fillRect(sx - barW / 2, sy - 80 - barH / 2, barW, barH);
          const col = hpRatio > 0.5 ? '#ff8c00' : hpRatio > 0.25 ? '#ffcc00' : '#ff2200';
          ctx.fillStyle = col;
          ctx.fillRect(sx - barW / 2, sy - 80 - barH / 2, barW * hpRatio, barH);
          ctx.strokeStyle = '#fff8';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx - barW / 2, sy - 80 - barH / 2, barW, barH);
          // Name + HP numbers
          ctx.font = 'bold 13px Courier New';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ff8c00';
          ctx.fillText('🦅 EAGLE OVERLORD', sx, sy - 96);
          ctx.font = '10px Courier New';
          ctx.fillStyle = '#fff';
          ctx.fillText(Math.ceil(boss.hp) + '/' + boss.maxHp, sx, sy - 80 + 3);
          // Escape countdown
          if (boss.escapeTime) {
            const secsLeft = Math.max(0, Math.ceil((boss.escapeTime - Date.now()) / 1000));
            ctx.font = 'bold 10px Courier New';
            ctx.fillStyle = secsLeft < 20 ? '#ff4444' : '#ffcc44';
            ctx.fillText('ESCAPES IN ' + secsLeft + 's', sx, sy - 108);
          }
        } else {
          // MEGA_CAT / MEGA_HAWK (existing rendering)
          ctx.save();
          ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
          ctx.shadowBlur = 20;
          if (boss.type === 'MEGA_CAT') {
            ctx.save();
            ctx.translate(sx, sy);
            ctx.scale(2, 2);
            Sprites.drawCat(ctx, 0, 0, boss.rotation);
            ctx.restore();
          } else {
            ctx.save();
            ctx.translate(sx, sy);
            ctx.scale(2, 2);
            Sprites.drawHawk(ctx, 0, 0, boss.rotation);
            ctx.restore();
          }
          ctx.restore();
          Sprites.drawBossHP(ctx, sx, sy - 40, boss.hp, boss.maxHp);
          ctx.font = 'bold 12px Courier New';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ff0000';
          ctx.fillText(boss.type, sx, sy - 52);
        }
      }
    }

    // Territory predators (hawk and cat in their fixed home zones)
    if (gameState.territoryPredators) {
      const predDefs = worldData && worldData.predatorTerritories ? worldData.predatorTerritories : {};
      const predColors = { hawk: '#ff5500', cat: '#cc44ff' };
      for (const [predKey, pred] of Object.entries(gameState.territoryPredators)) {
        if (!pred) continue;
        const sx = pred.x - camera.x + camera.screenW / 2;
        const sy = pred.y - camera.y + camera.screenH / 2;
        if (sx < -margin - 60 || sx > camera.screenW + margin + 60 || sy < -margin - 60 || sy > camera.screenH + margin + 60) continue;

        const col = predColors[predKey] || '#ff0000';
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = pred.state === 'hunting' ? 30 : 15;
        ctx.translate(sx, sy);
        ctx.scale(2, 2);
        if (pred.type === 'MEGA_CAT') {
          Sprites.drawCat(ctx, 0, 0, pred.rotation);
        } else {
          Sprites.drawHawk(ctx, 0, 0, pred.rotation);
        }
        ctx.restore();

        // HP bar (only in hunting state)
        if (pred.state === 'hunting') {
          Sprites.drawBossHP(ctx, sx, sy - 44, pred.hp, pred.maxHp);
          ctx.font = 'bold 11px Courier New';
          ctx.textAlign = 'center';
          ctx.fillStyle = col;
          ctx.fillText(predKey === 'hawk' ? '🦅 HAWK' : '🐱 MEGA CAT', sx, sy - 56);
        } else {
          // Patrol label
          ctx.font = 'bold 10px Courier New';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillText(predKey === 'hawk' ? '🦅 PATROLLING' : '🐱 PATROLLING', sx, sy - 36);
        }
      }
    }

    // Food truck
    if (gameState.foodTruck) {
      const truck = gameState.foodTruck;
      const sx = truck.x - camera.x + camera.screenW / 2;
      const sy = truck.y - camera.y + camera.screenH / 2;
      if (sx > -margin - 40 && sx < camera.screenW + margin + 40 && sy > -margin - 40 && sy < camera.screenH + margin + 40) {
        Sprites.drawFoodTruck(ctx, sx, sy, truck.angle, truck.heistProgress || 0, truck.heistActive || false, truck.looted || false);
      }
    }

    // Vault Truck (armored moving target)
    if (gameState.vaultTruck && !gameState.vaultTruck.cracked && !gameState.vaultTruck.escaped) {
      const vt = gameState.vaultTruck;
      const sx = vt.x - camera.x + camera.screenW / 2;
      const sy = vt.y - camera.y + camera.screenH / 2;
      if (sx > -margin - 50 && sx < camera.screenW + margin + 50 && sy > -margin - 50 && sy < camera.screenH + margin + 50) {
        Sprites.drawVaultTruck(ctx, sx, sy, vt.angle || 0, vt.hp, vt.maxHp, vt.myHits || 0, now);
      }
    }

    // Pigeon Coupe (driveable luxury sports car)
    if (gameState.pigeonCoupe) {
      const pc = gameState.pigeonCoupe;
      const pcsx = pc.x - camera.x + camera.screenW / 2;
      const pcsy = pc.y - camera.y + camera.screenH / 2;
      if (pcsx > -margin - 60 && pcsx < camera.screenW + margin + 60 && pcsy > -margin - 60 && pcsy < camera.screenH + margin + 60) {
        Sprites.drawPigeonCoupe(ctx, pcsx, pcsy, pc.angle || 0, pc.driverId, pc.driverName, pc.driverColor, pc.carjacks, pc.maxCarjacks, pc.expiresAt, now);
      }
    }

    // Birdnapper Van (sinister moving threat)
    if (gameState.birdnapperVan) {
      const bv = gameState.birdnapperVan;
      const bvsx = bv.x - camera.x + camera.screenW / 2;
      const bvsy = bv.y - camera.y + camera.screenH / 2;
      if (bvsx > -margin - 60 && bvsx < camera.screenW + margin + 60 && bvsy > -margin - 60 && bvsy < camera.screenH + margin + 60) {
        Sprites.drawBirdnapperVan(ctx, bvsx, bvsy, bv.angle || 0, bv.state, bv.captiveName, bv.poopHits || 0, bv.maxPoopHits || 8, now);
      }
    }

    // Mayor's Motorcade (Session 111)
    if (gameState.motorcade) {
      const mc = gameState.motorcade;
      const mcsx = mc.x - camera.x + camera.screenW / 2;
      const mcsy = mc.y - camera.y + camera.screenH / 2;
      if (mcsx > -margin - 120 && mcsx < camera.screenW + margin + 120 && mcsy > -margin - 120 && mcsy < camera.screenH + margin + 120) {
        Renderer.drawMotorcade(ctx, {
          x: mcsx, y: mcsy, angle: mc.angle || 0, hp: mc.hp, maxHp: mc.maxHp,
          outraged: mc.outraged, now,
          escorts: (mc.escorts || []).map(e => ({
            ...e,
            x: e.x - camera.x + camera.screenW / 2,
            y: e.y - camera.y + camera.screenH / 2,
          })),
        }, now);
      }
    }

    // Hot Dog Cart — Session 115
    if (gameState.hotDogCart) {
      const hdc = gameState.hotDogCart;
      const hdcsx = hdc.x - camera.x + camera.screenW / 2;
      const hdcsy = hdc.y - camera.y + camera.screenH / 2;
      if (hdcsx > -margin - 60 && hdcsx < camera.screenW + margin + 60 && hdcsy > -margin - 60 && hdcsy < camera.screenH + margin + 60) {
        Sprites.drawHotDogCart(ctx, hdcsx, hdcsy, hdc.angle || 0, now);
      }
    }

    // Rival Bird — "Ace" from Feather City (Session 116)
    if (gameState.rivalBird) {
      const rb = gameState.rivalBird;
      const rbsx = rb.x - camera.x + camera.screenW / 2;
      const rbsy = rb.y - camera.y + camera.screenH / 2;
      if (rbsx > -margin - 40 && rbsx < camera.screenW + margin + 40 && rbsy > -margin - 40 && rbsy < camera.screenH + margin + 40) {
        Sprites.drawRivalBird(ctx, rbsx, rbsy, rb.angle || 0, rb.hp, rb.maxHp, now);
        // Label
        ctx.save();
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const label = `🔴 ACE (${rb.myHits || 0} hits)`;
        ctx.strokeText(label, rbsx, rbsy - 30);
        ctx.fillText(label, rbsx, rbsy - 30);
        ctx.restore();
      }
    }

    // Courier Pigeon (Session 107)
    if (gameState.courierPigeon) {
      const cp = gameState.courierPigeon;
      const cpsx = cp.x - camera.x + camera.screenW / 2;
      const cpsy = cp.y - camera.y + camera.screenH / 2;
      if (cpsx > -margin - 40 && cpsx < camera.screenW + margin + 40 && cpsy > -margin - 40 && cpsy < camera.screenH + margin + 40) {
        Sprites.drawCourierPigeon(ctx, cpsx, cpsy, cp.angle || 0, cp.state, cp.hitsDealt || 0, cp.maxHits, cp.amEscorting, now);
      }
    }

    // Raccoon Thieves (night-only)
    if (gameState.raccoons) {
      for (const raccoon of gameState.raccoons) {
        const sx = raccoon.x - camera.x + camera.screenW / 2;
        const sy = raccoon.y - camera.y + camera.screenH / 2;
        if (sx > -margin - 20 && sx < camera.screenW + margin + 20 && sy > -margin - 20 && sy < camera.screenH + margin + 20) {
          Sprites.drawRaccoon(ctx, sx, sy, raccoon.rotation, raccoon.state, raccoon.carriedFoodType);
        }
      }
    }

    // Drunk Pigeons (night-only, pickpocketable)
    if (gameState.drunkPigeons) {
      for (const dp of gameState.drunkPigeons) {
        const sx = dp.x - camera.x + camera.screenW / 2;
        const sy = dp.y - camera.y + camera.screenH / 2;
        if (sx > -margin - 30 && sx < camera.screenW + margin + 30 && sy > -margin - 30 && sy < camera.screenH + margin + 30) {
          Sprites.drawDrunkPigeon(ctx, sx, sy, dp.rotation, dp.wobblePhase, dp.coins, now);
        }
      }
    }

    // The Godfather Raccoon (night crime boss)
    if (gameState.godfatherRaccoon) {
      const gf = gameState.godfatherRaccoon;
      const gfsx = gf.x - camera.x + camera.screenW / 2;
      const gfsy = gf.y - camera.y + camera.screenH / 2;
      if (gfsx > -margin - 80 && gfsx < camera.screenW + margin + 80 && gfsy > -margin - 80 && gfsy < camera.screenH + margin + 80) {
        Sprites.drawGodfatherRaccoon(ctx, gfsx, gfsy, gf.rotation, gf.hp, gf.maxHp, gf.tributeCoins, now);
      }
    }

    // Owl Enforcer — night guardian of the Sacred Pond
    if (gameState.owlEnforcer) {
      const owl = gameState.owlEnforcer;
      const owlSx = owl.x - camera.x + camera.screenW / 2;
      const owlSy = owl.y - camera.y + camera.screenH / 2;
      if (owlSx > -margin - 50 && owlSx < camera.screenW + margin + 50 && owlSy > -margin - 50 && owlSy < camera.screenH + margin + 50) {
        Sprites.drawOwlEnforcer(ctx, owlSx, owlSy, owl.rotation, owl.state, now);
      }
    }

    // Crow Cartel Raiders — NPC gang assaulting a territory
    if (gameState.crowCartel) {
      const cc = gameState.crowCartel;
      for (const crow of cc.crows) {
        if (crow.state === 'dead') continue;
        const csx = crow.x - camera.x + camera.screenW / 2;
        const csy = crow.y - camera.y + camera.screenH / 2;
        if (csx > -margin - 60 && csx < camera.screenW + margin + 60 && csy > -margin - 60 && csy < camera.screenH + margin + 60) {
          if (crow.type === 'don') {
            Sprites.drawDonCorvino(ctx, csx, csy, crow.rotation, crow.hp, crow.maxHp, now);
          } else {
            Sprites.drawCrowThug(ctx, csx, csy, crow.rotation, crow.hp, crow.maxHp, now);
          }
        }
      }
    }

    // Mural Vandal — rogue crow defacing gang murals
    if (gameState.muralVandal) {
      const mv = gameState.muralVandal;
      const mvSx = mv.x - camera.x + camera.screenW / 2;
      const mvSy = mv.y - camera.y + camera.screenH / 2;
      if (mvSx > -margin - 70 && mvSx < camera.screenW + margin + 70 && mvSy > -margin - 70 && mvSy < camera.screenH + margin + 70) {
        Sprites.drawMuralVandal(ctx, mvSx, mvSy, mv.rotation || 0, mv.vandalizingProgress, mv.hitCount, mv.hitsRequired, mv.state, now);
      }
    }

    // Seagull Invasion — fast coastal raiders swooping in to steal food
    if (gameState.seagullInvasion && gameState.seagullInvasion.seagulls) {
      for (const sg of gameState.seagullInvasion.seagulls) {
        const sgsx = sg.x - camera.x + camera.screenW / 2;
        const sgsy = sg.y - camera.y + camera.screenH / 2;
        if (sgsx > -margin - 50 && sgsx < camera.screenW + margin + 50 &&
            sgsy > -margin - 50 && sgsy < camera.screenH + margin + 50) {
          Sprites.drawSeagull(ctx, sgsx, sgsy, sg.rotation, sg.state, sg.hp, sg.carriedFoodType, now);
        }
      }
    }

    // ===== GREAT MIGRATION — V-formation crossing the city =====
    if (gameState.migration && gameState.migration.birds) {
      // Draw flock birds
      for (const mb of gameState.migration.birds) {
        const mbsx = mb.x - camera.x + camera.screenW / 2;
        const mbsy = mb.y - camera.y + camera.screenH / 2;
        if (mbsx > -margin - 50 && mbsx < camera.screenW + margin + 50 &&
            mbsy > -margin - 50 && mbsy < camera.screenH + margin + 50) {
          Sprites.drawMigrationBird(ctx, mbsx, mbsy, mb.rotation, now);
        }
      }
      // Draw Alpha Leader
      if (gameState.migration.alpha) {
        const al = gameState.migration.alpha;
        const alsx = al.x - camera.x + camera.screenW / 2;
        const alsy = al.y - camera.y + camera.screenH / 2;
        if (alsx > -margin - 80 && alsx < camera.screenW + margin + 80 &&
            alsy > -margin - 80 && alsy < camera.screenH + margin + 80) {
          Sprites.drawAlphaMigrationBird(ctx, alsx, alsy, al.rotation, al.hp, al.maxHp, now);
        }
      }
    }

    // Blood Moon Feral Birds — dark corrupted pigeons with glowing red eyes
    if (gameState.bloodMoon && gameState.bloodMoon.feralBirds && gameState.bloodMoon.feralBirds.length > 0) {
      for (const feral of gameState.bloodMoon.feralBirds) {
        const fsx = feral.x - camera.x + camera.screenW / 2;
        const fsy = feral.y - camera.y + camera.screenH / 2;
        if (fsx > -margin - 30 && fsx < camera.screenW + margin + 30 &&
            fsy > -margin - 30 && fsy < camera.screenH + margin + 30) {
          Sprites.drawFeralBird(ctx, fsx, fsy, feral.rotation, feral.hp, feral.state, now);
        }
      }
    }

    // === PIGEON STAMPEDE — panicked herd crossing the city ===
    if (gameState.stampede && gameState.stampede.birds) {
      for (const sb of gameState.stampede.birds) {
        const ssx = sb.x - camera.x + camera.screenW / 2;
        const ssy = sb.y - camera.y + camera.screenH / 2;
        if (ssx > -margin - 40 && ssx < camera.screenW + margin + 40 &&
            ssy > -margin - 40 && ssy < camera.screenH + margin + 40) {
          Sprites.drawStampedeBird(ctx, ssx, ssy, sb.vx, sb.vy, sb.phase || 0, now);
        }
      }
    }

    // === SUSPICIOUS PACKAGE ===
    if (gameState.suspiciousPackage) {
      const pkg = gameState.suspiciousPackage;
      const pkgsx = pkg.x - camera.x + camera.screenW / 2;
      const pkgsy = pkg.y - camera.y + camera.screenH / 2;
      if (pkgsx > -margin - 60 && pkgsx < camera.screenW + margin + 60 &&
          pkgsy > -margin - 60 && pkgsy < camera.screenH + margin + 60) {
        Sprites.drawSuspiciousPackage(ctx, pkgsx, pkgsy,
          pkg.defuseHits, pkg.maxDefuseHits, pkg.timeLeft, pkg.maxTime || 90000, now);
      }
    }

    // The Pigeon Mafia Don — permanent NPC at his corner
    {
      const DON_WORLD_X = 1300, DON_WORLD_Y = 2380;
      const donSx = DON_WORLD_X - camera.x + camera.screenW / 2;
      const donSy = DON_WORLD_Y - camera.y + camera.screenH / 2;
      if (donSx > -margin - 50 && donSx < camera.screenW + margin + 50 && donSy > -margin - 50 && donSy < camera.screenH + margin + 50) {
        Sprites.drawDon(ctx, donSx, donSy, now / 1000);
        // Label above the Don
        ctx.save();
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText('🎩 DON FEATHERSTONE', donSx, donSy - 52);
        // Show press hint only when player is near
        if (gameState.self && gameState.nearDon) {
          ctx.fillStyle = '#ff88ff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('[M] Meet The Don', donSx, donSy - 40);
        }
        ctx.restore();
      }
    }

    // Black Market NPC (night-only shady alley shop)
    if (gameState.blackMarket) {
      const bm = gameState.blackMarket;
      const bmsx = bm.x - camera.x + camera.screenW / 2;
      const bmsy = bm.y - camera.y + camera.screenH / 2;
      if (bmsx > -margin - 40 && bmsx < camera.screenW + margin + 40 && bmsy > -margin - 40 && bmsy < camera.screenH + margin + 40) {
        Sprites.drawBlackMarket(ctx, bmsx, bmsy, now);
      }
    }

    // Night Market NPC (aurora bazaar — celestial stall near Sacred Pond)
    if (gameState.nightMarket) {
      const nm = gameState.nightMarket;
      const nmsx = nm.x - camera.x + camera.screenW / 2;
      const nmsy = nm.y - camera.y + camera.screenH / 2;
      if (nmsx > -margin - 50 && nmsx < camera.screenW + margin + 50 && nmsy > -margin - 50 && nmsy < camera.screenH + margin + 50) {
        Sprites.drawNightMarket(ctx, nmsx, nmsy, now);
      }
    }

    // Cop Birds (wanted system enforcement)
    if (gameState.cops) {
      for (const cop of gameState.cops) {
        const sx = cop.x - camera.x + camera.screenW / 2;
        const sy = cop.y - camera.y + camera.screenH / 2;
        if (sx > -margin - 30 && sx < camera.screenW + margin + 30 && sy > -margin - 30 && sy < camera.screenH + margin + 30) {
          Sprites.drawCopBird(ctx, sx, sy, cop.rotation, cop.type, cop.state, now);
        }
      }
    }

    // Bounty Hunter (persistent manhunter NPC — visible city-wide)
    if (gameState.bountyHunter) {
      const bh = gameState.bountyHunter;
      const sx = bh.x - camera.x + camera.screenW / 2;
      const sy = bh.y - camera.y + camera.screenH / 2;
      if (sx > -margin - 40 && sx < camera.screenW + margin + 40 && sy > -margin - 40 && sy < camera.screenH + margin + 40) {
        Sprites.drawBountyHunter(ctx, sx, sy, bh.rotation, bh.state, bh.poopHits, now);
      }
    }

    // National Guard agents (elite military police during City Lockdown)
    if (gameState.nationalGuard && gameState.nationalGuard.length > 0) {
      for (const ng of gameState.nationalGuard) {
        const ngsx = ng.x - camera.x + camera.screenW / 2;
        const ngsy = ng.y - camera.y + camera.screenH / 2;
        if (ngsx > -margin - 50 && ngsx < camera.screenW + margin + 50 && ngsy > -margin - 50 && ngsy < camera.screenH + margin + 50) {
          Sprites.drawNationalGuard(ctx, ngsx, ngsy, ng.rotation, ng.state, ng.poopHits, now / 1000);
          // NG label
          ctx.save();
          ctx.fillStyle = '#ffd700';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 3;
          ctx.fillText('🪖 NAT. GUARD', ngsx, ngsy - 28);
          ctx.shadowBlur = 0;
          ctx.restore();
        }
      }
    }

    // Police Helicopter (aerial pursuit unit — visible from afar, draws ABOVE most things)
    if (gameState.policeHelicopter) {
      const heli = gameState.policeHelicopter;
      const hsx = heli.x - camera.x + camera.screenW / 2;
      const hsy = heli.y - camera.y + camera.screenH / 2;
      const heliMargin = 60;
      if (hsx > -heliMargin && hsx < camera.screenW + heliMargin && hsy > -heliMargin && hsy < camera.screenH + heliMargin) {
        // Draw spotlight beam BEFORE the sprite (so sprite renders on top)
        if (heli.spotlighting && gameState.self && !heli.isTargetingMe === false) {
          // Spotlight: cone from helicopter downward toward target position
          const myX = gameState.self.x;
          const myY = gameState.self.y;
          if (myX !== undefined) {
            const tx = myX - camera.x + camera.screenW / 2;
            const ty = myY - camera.y + camera.screenH / 2;
            const spotAngle = Math.atan2(ty - hsy, tx - hsx);
            const spotLen = Math.sqrt((tx - hsx) ** 2 + (ty - hsy) ** 2);
            ctx.save();
            ctx.globalAlpha = 0.22 + 0.08 * Math.sin(now * 0.005);
            const coneGrad = ctx.createRadialGradient(hsx, hsy, 5, hsx, hsy, spotLen + 20);
            coneGrad.addColorStop(0, 'rgba(180,220,255,0.9)');
            coneGrad.addColorStop(0.6, 'rgba(140,190,255,0.5)');
            coneGrad.addColorStop(1, 'rgba(100,160,255,0)');
            ctx.fillStyle = coneGrad;
            const halfAngle = 0.18; // cone spread
            ctx.beginPath();
            ctx.moveTo(hsx, hsy);
            ctx.lineTo(hsx + Math.cos(spotAngle - halfAngle) * (spotLen + 20), hsy + Math.sin(spotAngle - halfAngle) * (spotLen + 20));
            ctx.lineTo(hsx + Math.cos(spotAngle + halfAngle) * (spotLen + 20), hsy + Math.sin(spotAngle + halfAngle) * (spotLen + 20));
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
        Sprites.drawPoliceHelicopter(ctx, hsx, hsy, heli.rotation, heli.state, heli.poopHits, heli.spotlighting, now);
      }
    }

    // Bank Heist overlays (cameras, vault progress, escape van) — drawn before buildings for z-order
    if (gameState.bankHeist) {
      Renderer.drawBankHeist(ctx, camera, gameState.bankHeist, now);
    }

    // Buildings & trees on top
    Renderer.drawBuildings(ctx, camera, gameState.bankHeist ? gameState.bankHeist.phase : null);
    // Graffiti tags (drawn on top of buildings)
    if (gameState.graffiti) {
      Renderer.drawGraffiti(ctx, camera, gameState.graffiti);
    }
    // Gang murals — completed art + in-progress zones + beacons
    if (gameState.muralZones) {
      Renderer.drawMurals(ctx, camera, gameState.muralZones, gameState.murals, gameState.muralPainting, gameState.self, now);
    }
    Renderer.drawTrees(ctx, camera);

    // Radio Tower (drawn after trees — it's a tall landmark)
    if (gameState.radioTower && worldData) {
      Renderer.drawRadioTower(ctx, camera, gameState.radioTower, now);
    }

    // Pigeonhole Slots Casino
    if (worldData && worldData.casinoPos) {
      Renderer.drawCasino(ctx, camera, worldData.casinoPos, gameState.slotsJackpot || 500, !!gameState.nearCasino, now);
    }

    // Bird Tattoo Parlor
    if (worldData && worldData.tattooParlor) {
      Renderer.drawTattooParlor(ctx, camera, worldData.tattooParlor.pos, !!gameState.nearTattooParlor, now);
    }

    // City Hall + Bounty Board
    if (worldData && worldData.cityHallPos) {
      const poolAmount = (gameState.dethronementPool && gameState.dethronementPool.total) || 0;
      Renderer.drawCityHall(ctx, camera, worldData.cityHallPos, poolAmount, !!gameState.nearCityHall, now);
    }

    // Donut Shop + Donut Cop
    if (worldData && worldData.donutShopPos && gameState.donutCop) {
      Renderer.drawDonutShop(ctx, camera, worldData.donutShopPos, gameState.donutCop, lastNearDonutCop, now);
      const dcScreenX = gameState.donutCop.x - camera.x + camera.screenW / 2;
      const dcScreenY = gameState.donutCop.y - camera.y + camera.screenH / 2;
      Sprites.drawDonutCop(ctx, dcScreenX, dcScreenY, gameState.donutCop.state, now);
    }

    // Vending Machines
    if (worldData && worldData.vendingMachines) {
      Renderer.drawVendingMachines(ctx, camera, worldData.vendingMachines, gameState.self ? gameState.self.nearVendingMachine : null, now);
    }

    // Hall of Legends — prestige leaderboard building
    if (worldData && worldData.hallOfLegendsPos) {
      const legendsData = (gameState.self && gameState.self.hallOfLegends) || [];
      Renderer.drawHallOfLegends(ctx, camera, worldData.hallOfLegendsPos, legendsData, !!(gameState.self && gameState.self.nearHallOfLegends), now);
    }

    // Gang Nests (pass blizzard flag for firepit visual)
    if (gameState.gangNests && gameState.gangNests.length > 0) {
      const selfGangId = gameState.self && gameState.self.gangId;
      const isBlizzard = weatherState && weatherState.type === 'blizzard';
      Renderer.drawGangNests(ctx, camera, gameState.gangNests, selfGangId, now, isBlizzard);
    }
    // Siege overlays (flaming rings, HP bars)
    if (gameState.activeSieges && gameState.activeSieges.length > 0) {
      Renderer.drawSiegeOverlays(ctx, camera, gameState.activeSieges, now);
    }

    // Bird City Idol Stage
    if (worldData && worldData.idolStagePos) {
      const idolSt = gameState.self && gameState.self.birdIdol;
      const nearStage = gameState.self && gameState.self.nearIdolStage;
      Renderer.drawIdolStage(ctx, camera, worldData.idolStagePos, idolSt, nearStage, now);
    }

    // Mystery Crate Airdrop
    const _mc = gameState.self && gameState.self.mysteryCrate;
    if (_mc) {
      Renderer.drawMysteryCrate(ctx, camera, _mc, now);
    }

    // Shooting Star landing marker (aurora event)
    const _ss = gameState.self && gameState.self.shootingStar;
    if (_ss) {
      Renderer.drawShootingStarLanding(ctx, camera, _ss, now);
    }

    // Hanami Lantern (spring night event)
    const _lantern = window._hanamiLanternData || (gameState.self && gameState.self.hanamiLantern);
    if (_lantern) {
      Renderer.drawHanamiLantern(ctx, camera, _lantern, now);
    }

    // Pigeon Pied Piper
    if (gameState.self && gameState.self.piper) {
      Renderer.drawPiedPiper(ctx, camera, gameState.self.piper, now);
    }

    // Cursed Coin (world-state)
    if (gameState.self && gameState.self.cursedCoin && gameState.self.cursedCoin.state === 'world') {
      Renderer.drawCursedCoin(ctx, camera, gameState.self.cursedCoin, now);
    }

    // Bird Royale — safe zone ring + danger zone overlay
    if (gameState.birdRoyale && gameState.birdRoyale.state === 'active') {
      Renderer.drawBirdRoyaleZone(ctx, camera, gameState.birdRoyale, now);
    }

    // Pigeon Race track checkpoints
    if (worldData && worldData.raceCheckpoints) {
      Renderer.drawRaceTrack(ctx, camera, worldData.raceCheckpoints, gameState.pigeonRace || null, now);
    }

    // Race boost gates — visible during open/countdown/racing phases
    if (worldData && worldData.raceBoostGates && gameState.pigeonRace) {
      const raceActive = ['open', 'countdown', 'racing'].includes(gameState.pigeonRace.state);
      const myCooldowns = (gameState.pigeonRace && gameState.pigeonRace.myGateCooldowns) || {};
      Renderer.drawBoostGates(ctx, camera, worldData.raceBoostGates, myCooldowns, raceActive, now);
    }

    // Ice Rink — slippery blizzard plaza
    if (gameState.iceRink) {
      Renderer.drawIceRink(ctx, camera, gameState.iceRink, now);
    }

    // Auction House (Session 108)
    if (worldData && worldData.auctionHousePos) {
      Renderer.drawAuctionHouse(ctx, camera, worldData.auctionHousePos, gameState.auction || null, !!gameState.self?.nearAuctionHouse, now);
    }

    // Flash Mob — social congregation event (drawn before birds)
    if (gameState.flashMob) {
      Renderer.drawFlashMob(ctx, camera, gameState.flashMob, now);
    }

    // Thunder Dome — electromagnetic arena (drawn before birds so birds appear inside the ring)
    const _domeToDraw = gameState.thunderDome || window._thunderDomeData;
    if (_domeToDraw) {
      Renderer.drawThunderDome(ctx, camera, _domeToDraw, now);
    }

    // Golden Throne — legendary seat of power, drawn before birds
    if (gameState.self && gameState.self.goldenThrone) {
      Renderer.drawGoldenThrone(ctx, camera, gameState.self.goldenThrone, now);
    }

    // Golden Perch — king-of-the-hill roost (drawn before birds)
    if (gameState.self && gameState.self.goldenPerch) {
      const gp = gameState.self.goldenPerch;
      Renderer.drawGoldenPerch(ctx, gp, camera.x, camera.y, camera.zoom, now);
    }

    // === BURIED TREASURE SYSTEM (Session 114) — world-space scroll and dig site X ===
    // Draw scroll in world space (visible to all when unclaimed)
    if (gameState.treasureScroll) {
      const ts = gameState.treasureScroll;
      const ssx = ts.x - camera.x + camera.screenW / 2;
      const ssy = ts.y - camera.y + camera.screenH / 2;
      if (ssx > -60 && ssx < camera.screenW + 60 && ssy > -60 && ssy < camera.screenH + 60) {
        const tsPulse = 0.6 + 0.4 * Math.sin(now * 0.006);
        ctx.save();
        // Glow aura
        const tsGrd = ctx.createRadialGradient(ssx, ssy, 4, ssx, ssy, 26);
        tsGrd.addColorStop(0, `rgba(244,197,66,${0.55 * tsPulse})`);
        tsGrd.addColorStop(1, 'rgba(244,197,66,0)');
        ctx.fillStyle = tsGrd;
        ctx.beginPath();
        ctx.arc(ssx, ssy, 26, 0, Math.PI * 2);
        ctx.fill();
        // Scroll emoji
        ctx.font = `${18 + 2 * tsPulse}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.85 + 0.15 * tsPulse;
        ctx.fillText('📜', ssx, ssy);
        // Label
        ctx.globalAlpha = 0.9;
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#f4c542';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText('TREASURE SCROLL', ssx, ssy - 18);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }
    // Draw dig site X marker (only visible to the map holder)
    if (gameState.self && gameState.self.myTreasureDigSite) {
      const ds = gameState.self.myTreasureDigSite;
      const dsx = ds.x - camera.x + camera.screenW / 2;
      const dsy = ds.y - camera.y + camera.screenH / 2;
      if (dsx > -80 && dsx < camera.screenW + 80 && dsy > -80 && dsy < camera.screenH + 80) {
        const digProg = gameState.treasureMap ? (gameState.treasureMap.digProgress || 0) : 0;
        const dsPulse = 0.5 + 0.5 * Math.sin(now * 0.008);
        ctx.save();
        // Glow ring around dig site
        const dsGrd = ctx.createRadialGradient(dsx, dsy, 8, dsx, dsy, 55);
        dsGrd.addColorStop(0, `rgba(244,197,66,${0.35 * dsPulse})`);
        dsGrd.addColorStop(1, 'rgba(244,197,66,0)');
        ctx.fillStyle = dsGrd;
        ctx.beginPath();
        ctx.arc(dsx, dsy, 55, 0, Math.PI * 2);
        ctx.fill();
        // X mark (bold yellow X with dark stroke)
        ctx.font = `bold ${32 + 4 * dsPulse}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#5a3a00';
        ctx.lineWidth = 5;
        ctx.strokeText('✕', dsx, dsy);
        ctx.fillStyle = '#f4c542';
        ctx.fillText('✕', dsx, dsy);
        // Dig progress arc
        if (digProg > 0) {
          ctx.beginPath();
          ctx.arc(dsx, dsy, 30, -Math.PI / 2, -Math.PI / 2 + digProg * 2 * Math.PI);
          ctx.strokeStyle = '#ffdd55';
          ctx.lineWidth = 4;
          ctx.stroke();
        }
        // Dashed zone ring showing 55px claim radius
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = `rgba(244,197,66,${0.5 + 0.3 * dsPulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dsx, dsy, 55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Label
        ctx.font = 'bold 9px Arial';
        ctx.fillStyle = '#ffd966';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 5;
        ctx.fillText('HOLD 3s TO DIG', dsx, dsy + 28);
        if (digProg > 0) {
          ctx.fillText(`${Math.floor(digProg * 100)}%`, dsx, dsy - 28);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }
      // Off-screen direction arrow pointing to dig site
      const isOnScreen = (dsx > 60 && dsx < camera.screenW - 60 && dsy > 60 && dsy < camera.screenH - 60);
      if (!isOnScreen) {
        // Draw a compass arrow pointing toward the dig site
        const angle = Math.atan2(ds.y - (camera.y), ds.x - (camera.x));
        const edgeX = camera.screenW / 2 + Math.cos(angle) * (Math.min(camera.screenW, camera.screenH) / 2 - 55);
        const edgeY = camera.screenH / 2 + Math.sin(angle) * (Math.min(camera.screenW, camera.screenH) / 2 - 55);
        ctx.save();
        ctx.translate(edgeX, edgeY);
        ctx.rotate(angle);
        ctx.fillStyle = '#f4c542';
        ctx.strokeStyle = '#5a3a00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-10, -9);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 9);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.restore();
        // Label near the arrow
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#f4c542';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 5;
        ctx.fillText('🗺️ X', edgeX + Math.cos(angle + Math.PI) * 28, edgeY + Math.sin(angle + Math.PI) * 28);
        ctx.shadowBlur = 0;
      }
    }

    // Birds
    if (gameState.birds) {
      for (const bird of gameState.birds) {
        const b = lerpBird(bird.id, gameState.birds, prevState?.birds) || bird;
        const sx = b.x - camera.x + camera.screenW / 2;
        const sy = b.y - camera.y + camera.screenH / 2;
        if (sx > -margin && sx < camera.screenW + margin && sy > -margin && sy < camera.screenH + margin) {
          const isPlayer = b.id === myId;
          const selfNow = Date.now();
          const selfData = isPlayer && gameState.self ? gameState.self : null;

          // Mystery Crate: Jet Wings — fire aura behind the bird
          if (selfData && selfData.mcJetWingsUntil > selfNow) {
            const firePulse = 0.6 + 0.4 * Math.sin(selfNow * 0.015);
            const fireGrd = ctx.createRadialGradient(sx - Math.cos(b.rotation) * 18, sy - Math.sin(b.rotation) * 18, 2, sx - Math.cos(b.rotation) * 18, sy - Math.sin(b.rotation) * 18, 22);
            fireGrd.addColorStop(0, `rgba(255,160,0,${0.75 * firePulse})`);
            fireGrd.addColorStop(0.5, `rgba(255,60,0,${0.45 * firePulse})`);
            fireGrd.addColorStop(1, 'rgba(255,0,0,0)');
            ctx.fillStyle = fireGrd;
            ctx.beginPath();
            ctx.arc(sx - Math.cos(b.rotation) * 18, sy - Math.sin(b.rotation) * 18, 22, 0, Math.PI * 2);
            ctx.fill();
          }

          // Mystery Crate: Ghost Mode — partially transparent self-bird
          if (selfData && selfData.mcGhostModeUntil > selfNow) {
            ctx.globalAlpha = 0.35;
          } else if (b.witnessProtectionActive && !isPlayer) {
            // Witness Protection: ghost outline visible locally but semi-transparent to others
            ctx.globalAlpha = 0.28;
          } else if (b.cloaked) {
            // Cloaked birds: render at low alpha (ghost outline for others, more visible for self)
            ctx.globalAlpha = isPlayer ? 0.4 : 0.15;
          } else if (b.inNest) {
            ctx.globalAlpha = 0.5;
          }

          // Witness Protection — soft blue shield aura visible to the WP bird themselves
          if (isPlayer && selfData && selfData.witnessProtectionUntil > selfNow) {
            const wpPulse = 0.35 + 0.25 * Math.sin(selfNow * 0.005);
            ctx.save();
            ctx.globalAlpha = wpPulse;
            const wpGrd = ctx.createRadialGradient(sx, sy, 8, sx, sy, 34);
            wpGrd.addColorStop(0, 'rgba(40,140,255,0.5)');
            wpGrd.addColorStop(1, 'rgba(20,80,200,0)');
            ctx.fillStyle = wpGrd;
            ctx.beginPath();
            ctx.arc(sx, sy, 34, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Mystery Crate: Riot Shield — electric blue ring
          if (selfData && selfData.mcRiotShieldUntil > selfNow) {
            const shieldPulse = 0.6 + 0.4 * Math.sin(selfNow * 0.01);
            ctx.strokeStyle = `rgba(80,180,255,${shieldPulse})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sx, sy, 26 + shieldPulse * 4, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Formation Flying: draw colored aura + speed wake behind formation birds
          if (b.formationType) {
            const ft = b.formationType;
            const isV = ft === 'V';
            // Aura color: cyan for V-formation, orange for Wedge
            const auraColor = isV ? [80, 220, 255] : [255, 140, 0];
            const auraAlpha = isV ? 0.38 : 0.48;
            const auraR = isV ? 26 : 28;
            const ftPulse = 0.55 + 0.25 * Math.sin(now * (isV ? 0.006 : 0.009) + b.id * 1.37);
            ctx.save();
            ctx.globalAlpha = auraAlpha * ftPulse;
            const ftGrd = ctx.createRadialGradient(sx, sy, 4, sx, sy, auraR);
            ftGrd.addColorStop(0, `rgba(${auraColor[0]},${auraColor[1]},${auraColor[2]},0.6)`);
            ftGrd.addColorStop(1, `rgba(${auraColor[0]},${auraColor[1]},${auraColor[2]},0)`);
            ctx.fillStyle = ftGrd;
            ctx.beginPath();
            ctx.arc(sx, sy, auraR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            // Speed wake: stretched gradient behind the bird in V-formation
            if (isV && b.vx !== undefined) {
              const spd = Math.sqrt((b.vx || 0) * (b.vx || 0) + (b.vy || 0) * (b.vy || 0));
              if (spd > 20) {
                const wakeLen = Math.min(32, spd * 0.18);
                const wakeNX = -(b.vx / spd);
                const wakeNY = -(b.vy / spd);
                const wx = sx + wakeNX * wakeLen;
                const wy = sy + wakeNY * wakeLen;
                ctx.save();
                ctx.globalAlpha = 0.25 * ftPulse;
                const wakeGrd = ctx.createLinearGradient(sx, sy, wx, wy);
                wakeGrd.addColorStop(0, 'rgba(120,240,255,0.7)');
                wakeGrd.addColorStop(1, 'rgba(120,240,255,0)');
                ctx.strokeStyle = wakeGrd;
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(wx, wy);
                ctx.stroke();
                ctx.restore();
              }
            }
          }

          // Bird Flu: green glow ring behind infected birds (drawn before the bird sprite)
          if (b.isFlu) {
            const fluPulse = 0.4 + 0.35 * Math.sin(now * 0.008);
            ctx.save();
            ctx.globalAlpha = fluPulse;
            const fluGrd = ctx.createRadialGradient(sx, sy, 6, sx, sy, 28);
            fluGrd.addColorStop(0, 'rgba(0,255,80,0.5)');
            fluGrd.addColorStop(1, 'rgba(0,200,50,0)');
            ctx.fillStyle = fluGrd;
            ctx.beginPath();
            ctx.arc(sx, sy, 28, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Session 93: POSSESSION — crimson aura glow + glowing red eyes indicator
          if (b.isPossessed) {
            const possPulse = 0.5 + 0.35 * Math.sin(now * 0.011 + (b.id ? b.id.charCodeAt(0) * 0.3 : 0));
            ctx.save();
            ctx.globalAlpha = possPulse;
            const possGrd = ctx.createRadialGradient(sx, sy, 4, sx, sy, 34);
            possGrd.addColorStop(0, 'rgba(220,0,0,0.7)');
            possGrd.addColorStop(0.5, 'rgba(160,0,30,0.4)');
            possGrd.addColorStop(1, 'rgba(80,0,0,0)');
            ctx.fillStyle = possGrd;
            ctx.beginPath();
            ctx.arc(sx, sy, 34, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            // Glowing red eyes overlay (drawn after sprite, on top)
            ctx.save();
            ctx.globalAlpha = 0.85 + 0.15 * Math.sin(now * 0.02);
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#ff2222';
            ctx.beginPath();
            ctx.arc(sx - 4, sy - 2, 3, 0, Math.PI * 2);
            ctx.arc(sx + 4, sy - 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            // 👁️ label and exorcism progress
            ctx.save();
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            const exP = b.exorcismProgress || 0;
            if (exP > 0) {
              ctx.fillStyle = '#ff9900';
              ctx.fillText(`👁️ EXORCISE ${exP}/5`, sx, sy - 38);
            } else {
              ctx.fillStyle = '#ff3333';
              ctx.fillText('👁️ POSSESSED', sx, sy - 38);
            }
            ctx.restore();
          }

          // Stardust Cloak — shimmering aurora aura (visible to all nearby players)
          if (b.stardustCloakUntil && b.stardustCloakUntil > now) {
            const cloakPulse = 0.3 + 0.3 * Math.abs(Math.sin(now * 0.0015 + (b.id ? b.id.charCodeAt(0) * 0.1 : 0)));
            ctx.save();
            ctx.globalAlpha = cloakPulse;
            const cloakGrd = ctx.createRadialGradient(sx, sy, 5, sx, sy, 30);
            cloakGrd.addColorStop(0, 'rgba(80,240,220,0.7)');
            cloakGrd.addColorStop(0.5, 'rgba(40,180,200,0.3)');
            cloakGrd.addColorStop(1, 'rgba(0,80,150,0)');
            ctx.fillStyle = cloakGrd;
            ctx.beginPath();
            ctx.arc(sx, sy, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Comet Trail — golden sparkle particles trailing behind movement
          if (b.cometTrailUntil && b.cometTrailUntil > now) {
            ctx.save();
            const trailAngle = b.rotation + Math.PI; // opposite direction of movement
            for (let t = 1; t <= 4; t++) {
              const td = t * 7;
              const tx2 = sx + Math.cos(trailAngle) * td;
              const ty2 = sy + Math.sin(trailAngle) * td;
              const talpha = (1 - t / 5) * (0.5 + 0.3 * Math.abs(Math.sin(now * 0.004 + t)));
              ctx.globalAlpha = talpha;
              ctx.fillStyle = t <= 2 ? '#ffee88' : '#ffcc44';
              ctx.beginPath();
              ctx.arc(tx2, ty2, 2.5 - t * 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // === WING SURGE glow (Session 113) — drawn before bird sprite ===
          if (b.wingSurgeUntil && b.wingSurgeUntil > now) {
            // Active surge: bright gold pulsing aura
            const surgePulse = 0.4 + 0.4 * Math.sin(now * 0.018);
            ctx.save();
            const surgeGrd = ctx.createRadialGradient(sx, sy, 4, sx, sy, 32);
            surgeGrd.addColorStop(0, `rgba(255,220,0,${0.7 + 0.2 * surgePulse})`);
            surgeGrd.addColorStop(0.45, `rgba(255,160,0,${0.35 + 0.15 * surgePulse})`);
            surgeGrd.addColorStop(1, 'rgba(255,80,0,0)');
            ctx.fillStyle = surgeGrd;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 32, 28, b.rotation, 0, Math.PI * 2);
            ctx.fill();
            // Fast spinning ring
            ctx.strokeStyle = `rgba(255,230,80,${0.6 + 0.3 * surgePulse})`;
            ctx.lineWidth = 1.8;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 22 + surgePulse * 5, 16 + surgePulse * 3, b.rotation + now * 0.004, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();
          } else if (b.wingCharge && b.wingCharge >= 30) {
            // Charging: subtle gold glow that intensifies with charge
            const chargePct = b.wingCharge / 100;
            const chargeAlpha = 0.15 + chargePct * 0.35;
            const chargePulse = chargePct >= 0.9 ? 0.5 + 0.5 * Math.sin(now * 0.015) : chargePct >= 0.6 ? 0.5 + 0.3 * Math.sin(now * 0.008) : 0.5;
            ctx.save();
            ctx.globalAlpha = chargeAlpha * chargePulse;
            const chargeGrd = ctx.createRadialGradient(sx, sy, 3, sx, sy, 22 + chargePct * 10);
            chargeGrd.addColorStop(0, 'rgba(255,210,0,0.8)');
            chargeGrd.addColorStop(0.5, 'rgba(220,140,0,0.4)');
            chargeGrd.addColorStop(1, 'rgba(160,80,0,0)');
            ctx.fillStyle = chargeGrd;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 22 + chargePct * 10, 16 + chargePct * 7, b.rotation, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.restore();
          }

          Sprites.drawBird(ctx, sx, sy, b.rotation, b.type, b.wingPhase, isPlayer, b.birdColor || null);
          ctx.globalAlpha = 1; // Always reset after bird draw
          Sprites.drawNameTag(ctx, sx, sy, b.name || '???', b.level || 0, b.type, isPlayer, b.mafiaTitle || null, b.gangTag || null, b.gangColor || null, b.tattoosEquipped || [], b.prestige || 0, b.eagleFeather || false, b.idolBadge || false, b.royaleChampBadge || false, b.skillTreeMaster || false, b.fightingChampBadge || false, b.constellationBadge || false, b.courtTitle || null, b.hanamiLanternBadge || false, b.domeChampBadge || false, b.alphaFeather || false, b.arenaLegend || false, b.goldenBirdBadge || false, b.constellations || [], b.stampedeBadge || false, b.throneChampBadge || false, b.perchChampBadge || false, b.marshalBadge || false);

          // Bird Flu: sneezing emoji indicator above infected birds
          if (b.isFlu) {
            const sneezePulse = Math.abs(Math.sin(now * 0.003));
            ctx.save();
            ctx.globalAlpha = 0.7 + 0.3 * sneezePulse;
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🤧', sx, sy - 44);
            ctx.restore();
          }

          // Sleeping ZZZ for nesting birds
          if (b.inNest) {
            ctx.globalAlpha = 0.6;
            Sprites.drawSleepZzz(ctx, sx, sy, now);
            ctx.globalAlpha = 1;
          }

          // Stun stars
          if (b.stunned) {
            Sprites.drawStunStars(ctx, sx, sy, now);
          }

          // Power-up icon
          if (b.powerUpType) {
            Sprites.drawPowerUpIcon(ctx, sx, sy, b.powerUpType);
          }

          // Golden egg carrier indicator
          if (b.carryingEggId) {
            Renderer.drawCarriedEggIndicator(ctx, sx, sy, now / 1000);
          }

          // Cursed Coin holder indicator
          if (b.hasCursedCoin) {
            Sprites.drawCursedCoinIndicator(ctx, sx, sy, now / 1000, b.cursedCoinIntensity || 0);
          }

          // Street Duel: red combat aura + hearts above dueling birds
          if (b.streetDuelId && gameState.streetDuels) {
            const duel = gameState.streetDuels.find(d => d.id === b.streetDuelId);
            if (duel) {
              // Pulsing red combat aura
              const duelPulse = 0.35 + 0.3 * Math.sin(now * 0.012);
              ctx.save();
              ctx.globalAlpha = duelPulse;
              const duelGrd = ctx.createRadialGradient(sx, sy, 8, sx, sy, 30);
              duelGrd.addColorStop(0, 'rgba(255,40,40,0.6)');
              duelGrd.addColorStop(1, 'rgba(200,0,0,0)');
              ctx.fillStyle = duelGrd;
              ctx.beginPath();
              ctx.arc(sx, sy, 30, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
              // Hearts above the bird
              const hp = duel.hp[b.id] || 0;
              const hearts = (hp >= 3 ? '❤️❤️❤️' : hp === 2 ? '❤️❤️🖤' : hp === 1 ? '❤️🖤🖤' : '💀');
              ctx.save();
              ctx.font = '11px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(hearts, sx, sy - 52);
              ctx.restore();
            }
          }

          // Wanted indicator
          if (gameState.wantedBirdId && b.id === gameState.wantedBirdId) {
            const wPulse = Math.sin(now * 0.008) * 0.3 + 0.7;
            ctx.strokeStyle = 'rgba(255, 0, 0, ' + wPulse + ')';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sx, sy, 22, 0, Math.PI * 2);
            ctx.stroke();
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff0000';
            ctx.fillText('WANTED', sx, sy - 32);
          }

          // Flock indicator (small green ring)
          if (b.flockId && gameState.self && gameState.self.flockId === b.flockId && !isPlayer) {
            ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, 18, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Kingpin crown — gold crown above the richest bird
          if (b.isKingpin) {
            const crownPulse = Math.sin(now * 0.004) * 0.25 + 0.75;
            const crownY = sy - 38;
            // Outer gold glow ring
            ctx.save();
            ctx.globalAlpha = 0.3 * crownPulse;
            ctx.beginPath();
            ctx.arc(sx, sy, 28, 0, Math.PI * 2);
            const crownGlow = ctx.createRadialGradient(sx, sy, 14, sx, sy, 28);
            crownGlow.addColorStop(0, 'rgba(255,215,0,0)');
            crownGlow.addColorStop(1, 'rgba(255,215,0,0.5)');
            ctx.fillStyle = crownGlow;
            ctx.fill();
            ctx.restore();
            // Crown emoji + hit progress label
            ctx.save();
            ctx.globalAlpha = crownPulse;
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👑', sx, crownY);
            ctx.restore();
            // Show hit progress if we've hit them
            if (b.kingpinMyHits > 0) {
              ctx.save();
              ctx.font = 'bold 9px Courier New';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = `rgba(255, 200, 0, ${crownPulse})`;
              ctx.fillText(`${b.kingpinMyHits}/3`, sx, crownY + 16);
              ctx.restore();
            }
            // Blossom Crown — orbiting pink petals during Cherry Blossom season
            // Only shows when Kingpin is in or near the park area (~x:1200, y:1200)
            if (gameState.cherryBlossoms) {
              const PARK_CX = 1200, PARK_CY = 1200, PARK_BLOSSOM_RADIUS = 500;
              const bwx = b.x, bwy = b.y;
              const distToPark = Math.hypot(bwx - PARK_CX, bwy - PARK_CY);
              if (distToPark < PARK_BLOSSOM_RADIUS) {
                // Fade petals in as the kingpin approaches the park center
                const petalAlpha = Math.min(1, (PARK_BLOSSOM_RADIUS - distToPark) / 200) * 0.9;
                const numPetals = 6;
                ctx.save();
                for (let pi = 0; pi < numPetals; pi++) {
                  const baseAngle = (pi / numPetals) * Math.PI * 2;
                  const orbitSpeed = 0.0008 + pi * 0.00015;
                  const orbitAngle = baseAngle + now * orbitSpeed;
                  const orbitR = 32 + Math.sin(now * 0.0012 + pi * 1.3) * 5;
                  const px = sx + Math.cos(orbitAngle) * orbitR;
                  const py = sy - 8 + Math.sin(orbitAngle) * orbitR * 0.45; // slightly flattened orbit
                  const petalRotation = orbitAngle + Math.PI * 0.5 + Math.sin(now * 0.002 + pi) * 0.4;
                  // Draw a 5-petal cherry blossom
                  ctx.globalAlpha = petalAlpha;
                  ctx.save();
                  ctx.translate(px, py);
                  ctx.rotate(petalRotation);
                  const ps = 5; // petal size
                  for (let k = 0; k < 5; k++) {
                    const kAngle = (k / 5) * Math.PI * 2;
                    const pkx = Math.cos(kAngle) * ps;
                    const pky = Math.sin(kAngle) * ps;
                    ctx.beginPath();
                    ctx.ellipse(pkx, pky, ps * 0.7, ps * 0.45, kAngle, 0, Math.PI * 2);
                    ctx.fillStyle = pi % 2 === 0 ? '#ffb7c5' : '#ffd6e0';
                    ctx.fill();
                  }
                  // Center dot
                  ctx.beginPath();
                  ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
                  ctx.fillStyle = '#ffcc44';
                  ctx.fill();
                  ctx.restore();
                }
                ctx.restore();
              }
            }
          }

          // Hit contract target — red crosshair reticle + bounty label
          if (b.hitBounty) {
            const pulse = Math.sin(now * 0.009) * 0.35 + 0.65;
            const r2 = 28 + Math.sin(now * 0.006) * 4;
            ctx.save();
            ctx.strokeStyle = `rgba(255, 30, 30, ${pulse})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(sx, sy, r2, 0, Math.PI * 2);
            ctx.stroke();
            // Cross-hair lines
            ctx.strokeStyle = `rgba(255, 60, 60, ${pulse * 0.8})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sx - r2 - 6, sy);
            ctx.lineTo(sx - r2 + 6, sy);
            ctx.moveTo(sx + r2 - 6, sy);
            ctx.lineTo(sx + r2 + 6, sy);
            ctx.moveTo(sx, sy - r2 - 6);
            ctx.lineTo(sx, sy - r2 + 6);
            ctx.moveTo(sx, sy + r2 - 6);
            ctx.lineTo(sx, sy + r2 + 6);
            ctx.stroke();
            // Bounty label
            ctx.font = 'bold 9px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = `rgba(255, 80, 80, ${pulse})`;
            const hitsLeft = b.hitBounty.hitsNeeded - b.hitBounty.myHits;
            ctx.fillText(`💀 ${b.hitBounty.reward}c  (${b.hitBounty.myHits}/${b.hitBounty.hitsNeeded})`, sx, sy - 46);
            ctx.restore();
          }

          // Arena fighter HP hearts (shown above fighter during fight/countdown)
          if (gameState.arena && gameState.arena.fighters && gameState.arena.state === 'fighting') {
            const arenaFighter = gameState.arena.fighters.find(function(f) { return f.id === b.id; });
            if (arenaFighter && !arenaFighter.eliminated) {
              const heartSize = 8;
              const totalW = arenaFighter.maxArenaHp * (heartSize + 2);
              const heartY = sy - 42;
              const heartX0 = sx - totalW / 2;
              ctx.font = heartSize + 'px sans-serif';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              for (let h = 0; h < arenaFighter.maxArenaHp; h++) {
                ctx.globalAlpha = h < arenaFighter.arenaHp ? 1.0 : 0.25;
                ctx.fillStyle = isPlayer ? '#ff4444' : '#ff8888';
                ctx.fillText('♥', heartX0 + h * (heartSize + 2), heartY);
              }
              ctx.globalAlpha = 1;
              // Red ring to highlight fighters
              const ringPulse = Math.sin(now * 0.006) * 0.2 + 0.6;
              ctx.strokeStyle = isPlayer ? 'rgba(255, 100, 0, ' + ringPulse + ')' : 'rgba(220, 50, 50, ' + ringPulse + ')';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(sx, sy, 22, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // === GOLDEN RAMPAGE (Session 96) — golden aura overlay drawn ON TOP of the bird ===
          if (b.isGoldenBird && gameState.goldenRampage) {
            const gr = gameState.goldenRampage;
            const timeLeft = gr.endsAt - now;
            Sprites.drawGoldenBirdEffects(ctx, sx, sy, b.rotation, gr.hp, gr.maxHp, timeLeft, now);
          }

          // === BOWLING BIRD (Session 109) — giant bowling ball overlay drawn ON TOP of the bird ===
          if (b.isBowlingBird && gameState.bowlingBall) {
            const bb = gameState.bowlingBall;
            const timeLeft = bb.endsAt - now;
            Sprites.drawBowlingBirdEffects(ctx, sx, sy, b.rotation, bb.hp, bb.maxHp, timeLeft, now);
          }

          // === THE MOLE (Session 117) ===
          const moleData = gameState.self && gameState.self.mole;
          if (moleData) {
            if (moleData.revealed && b.id === moleData.moleId) {
              // Draw the revealed-mole badge on this bird
              Sprites.drawMoleBadge(ctx, sx, sy, now);
            }
            if (moleData.isMole && moleData.targets && moleData.targets.includes(b.id)) {
              // Only the mole player sees target indicators
              const tagged = moleData.tagged && moleData.tagged.includes(b.id);
              Sprites.drawMoleTargetIndicator(ctx, sx, sy, tagged, now);
            }
          }
        }
      }
    }

    // Formation Flying: draw faint connecting lines between flock birds in same formation
    if (gameState.birds && gameState.birds.length >= 2) {
      const formBirds = gameState.birds.filter(b => b.formationType && b.flockId);
      if (formBirds.length >= 2) {
        // Group by flockId
        const flockGroups = new Map();
        for (const b of formBirds) {
          if (!flockGroups.has(b.flockId)) flockGroups.set(b.flockId, []);
          flockGroups.get(b.flockId).push(b);
        }
        for (const [, members] of flockGroups) {
          if (members.length < 2) continue;
          const ft = members[0].formationType;
          const lineColor = ft === 'WEDGE' ? 'rgba(255,140,0,' : 'rgba(80,220,255,';
          const lineAlpha = 0.20 + 0.12 * Math.sin(now * 0.005);
          ctx.save();
          ctx.setLineDash([4, 5]);
          ctx.lineWidth = 1.2;
          // Draw a line from each member to every other member in the same formation group
          for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
              const ax = members[i].x - camera.x + camera.screenW / 2;
              const ay = members[i].y - camera.y + camera.screenH / 2;
              const bx = members[j].x - camera.x + camera.screenW / 2;
              const by2 = members[j].y - camera.y + camera.screenH / 2;
              const dist = Math.sqrt((ax - bx) * (ax - bx) + (ay - by2) * (ay - by2));
              if (dist < 300) {
                ctx.strokeStyle = lineColor + lineAlpha + ')';
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(bx, by2);
                ctx.stroke();
              }
            }
          }
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    }

    // ===== SKY PIRATE AIRSHIP (Session 110) =====
    if (gameState.skyPirateShip) {
      const sp = gameState.skyPirateShip;

      // Draw loot crates first (behind everything else)
      for (const crate of (sp.lootCrates || [])) {
        const crsx = crate.x - camera.x + camera.screenW / 2;
        const crsy = crate.y - camera.y + camera.screenH / 2;
        if (crsx > -40 && crsx < camera.screenW + 40 && crsy > -40 && crsy < camera.screenH + 40) {
          Renderer.drawLootCrate(ctx, { ...crate, x: crsx, y: crsy }, now);
        }
      }

      // Draw pirate guards
      for (const pirate of (sp.pirates || [])) {
        const psx = pirate.x - camera.x + camera.screenW / 2;
        const psy = pirate.y - camera.y + camera.screenH / 2;
        if (psx > -50 && psx < camera.screenW + 50 && psy > -50 && psy < camera.screenH + 50) {
          Sprites.drawPirateBird(ctx, { ...pirate, x: psx, y: psy }, now);
        }
      }

      // Draw the airship itself
      const spsx = sp.x - camera.x + camera.screenW / 2;
      const spsy = sp.y - camera.y + camera.screenH / 2;
      if (spsx > -120 && spsx < camera.screenW + 120 && spsy > -120 && spsy < camera.screenH + 120) {
        // Save ctx state, temporarily work in screen space
        ctx.save();
        ctx.translate(spsx - sp.x, spsy - sp.y); // offset to convert world→screen for drawing
        Renderer.drawSkyPirateShip(ctx, sp, now);
        ctx.restore();
      }

      // Minimap
      const worldData = { worldW: WORLD_W, worldH: WORLD_H, mmW: minimapCanvas.width, mmH: minimapCanvas.height };
      Renderer.drawSkyPirateShipOnMinimap(minimapCtx, sp, worldData, now);
    }

    // Mayor's Motorcade minimap (Session 111)
    if (gameState.motorcade) {
      Renderer.drawMotorcadeOnMinimap(minimapCtx, gameState.motorcade, WORLD_W, WORLD_H, minimapCanvas.width, minimapCanvas.height, now);
    }

    // Decoys
    if (gameState.decoys) {
      for (const d of gameState.decoys) {
        const sx = d.x - camera.x + camera.screenW / 2;
        const sy = d.y - camera.y + camera.screenH / 2;
        if (sx > -margin && sx < camera.screenW + margin && sy > -margin && sy < camera.screenH + margin) {
          Sprites.drawDecoy(ctx, sx, sy, d.rotation, d.type, now * 0.005, d.birdColor);
        }
      }
    }

    // Beacons (world space)
    if (gameState.beacons) {
      for (const b of gameState.beacons) {
        const sx = b.x - camera.x + camera.screenW / 2;
        const sy = b.y - camera.y + camera.screenH / 2;
        if (sx > -margin && sx < camera.screenW + margin && sy > -margin && sy < camera.screenH + margin) {
          Sprites.drawBeacon(ctx, sx, sy);
        }
      }
    }

    // Effects (in zoomed world space)
    drawEffects(ctx, camera, now);

    // Manholes (surface) — drawn in world space before zoom restore
    if (worldData && worldData.manholes) {
      const inSewer = gameState.self && gameState.self.inSewer;
      Renderer.drawManholes(ctx, camera, worldData.manholes, lastNearManholeId, inSewer);
    }

    // Tornado — world-space vortex (drawn last so it overlays everything on the map)
    if (gameState.weather && gameState.weather.type === 'tornado') {
      drawTornadoInWorld(ctx, camera, gameState.weather, now);
    }

    // Restore zoom (HUD drawn at screen scale, not zoomed)
    ctx.restore();

    // Sewer overlay (screen-space, drawn after zoom restore so it covers whole screen)
    if (gameState.self && gameState.self.inSewer) {
      Renderer.drawSewerOverlay(ctx, camera, gameState.self, gameState.sewerRats || [], gameState.sewerLoot || [], now, gameState.ratKing || null);
    }

    // Day/Night overlay (screen-space, after zoom restore)
    if (gameState.dayTime !== undefined && worldData) {
      Renderer.drawDayNight(ctx, camera, z, gameState.dayTime, worldData.streetLamps, gameState.bloodMoon || null);
    }

    // Aurora Borealis (screen-space, AFTER darkness overlay — additive blending makes it glow through)
    // Suppressed during Blood Moon (they are mutually exclusive)
    if (gameState.aurora && !gameState.bloodMoon) {
      Renderer.drawAurora(ctx, camera, gameState.dayTime, gameState.aurora);
    }

    // Blood Moon crimson pulsing vignette (additional screen-space effect)
    if (gameState.bloodMoon) {
      drawBloodMoonVignette(ctx, camera.screenW, camera.screenH, now);
    }

    // Shooting Star streak (screen-space, drawn ON TOP of aurora for full spectacle)
    if (window._shootingStarData) {
      Renderer.drawShootingStarStreak(ctx, camera, window._shootingStarData, now);
    }
    // Meteor Shower — 3 simultaneous landing zones (each drawn like a shooting star)
    if (window._meteorShowerData && window._meteorShowerData.length > 0) {
      for (const mStar of window._meteorShowerData) {
        Renderer.drawShootingStarStreak(ctx, camera, mStar, now);
      }
    }

    // === CHAMPION SHIELD BURST — golden expanding ring at Kingpin position ===
    if (window._champShieldFlash) {
      const csf = window._champShieldFlash;
      const elapsed = now - csf.startTime;
      if (elapsed < csf.duration) {
        const t = elapsed / csf.duration; // 0→1
        const sx = (csf.x - camera.x) * camera.zoom + camera.screenW / 2;
        const sy = (csf.y - camera.y) * camera.zoom + camera.screenH / 2;
        const maxR = 80 * camera.zoom;
        const r = t * maxR;
        const alpha = (1 - t) * 0.85;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.lineWidth = (1 - t) * 6 + 1;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.stroke();
        // Second ring slightly behind
        const r2 = t * maxR * 0.7;
        const alpha2 = (1 - t) * 0.5;
        ctx.strokeStyle = `rgba(255, 245, 150, ${alpha2})`;
        ctx.lineWidth = (1 - t) * 3;
        ctx.beginPath();
        ctx.arc(sx, sy, r2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        window._champShieldFlash = null;
      }
    }

    // === WING SURGE shockwave ring (Session 113) — world-space expanding ring on activation ===
    if (window._wingSurgeFlash) {
      const wsf = window._wingSurgeFlash;
      const elapsed = now - wsf.startTime;
      if (elapsed < wsf.duration) {
        const t = elapsed / wsf.duration; // 0→1
        const sfx = (wsf.x - camera.x) * camera.zoom + camera.screenW / 2;
        const sfy = (wsf.y - camera.y) * camera.zoom + camera.screenH / 2;
        const maxR = 70 * camera.zoom;
        const r = t * maxR;
        const alpha = (1 - t) * 0.9;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 230, 0, ${alpha})`;
        ctx.lineWidth = (1 - t) * 7 + 1;
        ctx.shadowColor = '#ffdd00';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(sfx, sfy, r, 0, Math.PI * 2);
        ctx.stroke();
        // Second inner ring (faster fade)
        const r2 = t * maxR * 0.55;
        ctx.strokeStyle = `rgba(255, 255, 140, ${(1 - t) * 0.55})`;
        ctx.lineWidth = (1 - t) * 3.5;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sfx, sfy, r2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      } else {
        window._wingSurgeFlash = null;
      }
    }

    // Weather effects (screen-space, drawn over day/night overlay)
    // Use gameState.weather as authoritative source (server-synced each tick)
    drawWeather(ctx, camera, now, gameState.weather || weatherState);

    // === CHERRY BLOSSOM PETALS (seasonal, April only) ===
    if (gameState.cherryBlossoms) {
      drawCherryBlossomPetals(ctx, now, dt, camera.screenW, camera.screenH);
    }

    // === SEAGULL INVASION HUD ===
    if (gameState.seagullInvasion) {
      const si = gameState.seagullInvasion;
      const siTimeLeft = Math.max(0, si.endsAt - now);
      const siTotal = 90000;
      const siFrac = siTimeLeft / siTotal;
      const aliveCount = si.aliveCount || 0;
      const totalCount = si.totalCount || si.seagulls.length;

      // Subtle blue-white tint during invasion
      const sgPulse = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.004));
      ctx.save();
      ctx.globalAlpha = 0.04 + 0.03 * sgPulse;
      ctx.fillStyle = '#44aaff';
      ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      ctx.globalAlpha = 1;
      ctx.restore();

      // HUD bar below crime wave bar (y=168 if crime wave active, else y=132)
      const hasCrimeWave = gameState.self && gameState.self.crimeWave;
      const sgBarY = hasCrimeWave ? 175 : 132;
      const sgBarW = 180, sgBarH = 12;
      const sgBarX = camera.screenW / 2 - sgBarW / 2;

      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.roundRect(sgBarX - 55, sgBarY - 18, sgBarW + 110, sgBarH + 32, 10);
      ctx.fill();

      const sgLabelPulse = 0.75 + 0.25 * Math.sin(now * 0.007);
      ctx.globalAlpha = sgLabelPulse;
      ctx.fillStyle = '#66ccff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`🐦 SEAGULL RAID — ${aliveCount}/${totalCount} remaining · ${Math.ceil(siTimeLeft / 1000)}s`, camera.screenW / 2, sgBarY - 4);

      ctx.globalAlpha = 0.8;
      ctx.fillStyle = 'rgba(0,40,80,0.5)';
      ctx.beginPath();
      ctx.roundRect(sgBarX, sgBarY + 2, sgBarW, sgBarH, 4);
      ctx.fill();

      ctx.fillStyle = siFrac > 0.5 ? '#44aaff' : siFrac > 0.25 ? '#88ccff' : '#ffcc44';
      ctx.beginPath();
      ctx.roundRect(sgBarX, sgBarY + 2, sgBarW * siFrac, sgBarH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === GREAT MIGRATION HUD BAR ===
    if (gameState.migration) {
      const mig = gameState.migration;
      const migTimeLeft = Math.max(0, mig.endsAt - now);
      const alpha = mig.alpha;
      const alphaHpPct = alpha ? (alpha.hp / alpha.maxHp) : 1;

      // Warm golden tint overlay
      const migPulse = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.004));
      ctx.save();
      ctx.globalAlpha = 0.04 + 0.02 * migPulse;
      ctx.fillStyle = '#f6ad55';
      ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Stack below crime wave and seagull bars
      const hasCrimeWave2 = gameState.self && gameState.self.crimeWave;
      const hasSeagull4 = gameState.seagullInvasion;
      let migBarY = 132;
      if (hasCrimeWave2) migBarY += 43;
      if (hasSeagull4) migBarY += 43;
      const migBarW = 200, migBarH = 12;
      const migBarX = camera.screenW / 2 - migBarW / 2;

      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.roundRect(migBarX - 60, migBarY - 18, migBarW + 120, migBarH + 32, 10);
      ctx.fill();

      const migLabelPulse = 0.75 + 0.25 * Math.sin(now * 0.007);
      ctx.globalAlpha = migLabelPulse;
      ctx.fillStyle = '#f6ad55';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const alphaHpStr = alpha && alpha.hp > 0 ? ` · Alpha ${alpha.hp}/${alpha.maxHp}HP` : ' · ALPHA DOWN!';
      ctx.fillText(`🦅 GREAT MIGRATION · ${Math.ceil(migTimeLeft / 1000)}s${alphaHpStr}`, camera.screenW / 2, migBarY - 4);

      // Alpha HP bar
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(50,30,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(migBarX, migBarY + 2, migBarW, migBarH, 4);
      ctx.fill();

      const alphaBarColor = alphaHpPct > 0.5 ? '#f6ad55' : alphaHpPct > 0.25 ? '#fc8a00' : '#fc5555';
      ctx.fillStyle = alphaBarColor;
      ctx.beginPath();
      ctx.roundRect(migBarX, migBarY + 2, migBarW * Math.max(0, alphaHpPct), migBarH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // Direction arrow — when migration is completely off-screen, show where it's coming from
      if (alpha && alpha.hp > 0) {
        const alSX = alpha.x - camera.x + camera.screenW / 2;
        const alSY = alpha.y - camera.y + camera.screenH / 2;
        const pad = 60;
        const isOffScreen = alSX < pad || alSX > camera.screenW - pad || alSY < pad || alSY > camera.screenH - pad;
        if (isOffScreen) {
          const arrAngle = Math.atan2(alSY - camera.screenH / 2, alSX - camera.screenW / 2);
          const arrRadius = Math.min(camera.screenW, camera.screenH) * 0.42;
          const arrX = camera.screenW / 2 + Math.cos(arrAngle) * arrRadius;
          const arrY = camera.screenH / 2 + Math.sin(arrAngle) * arrRadius;
          const arrowPulse = 0.6 + 0.4 * Math.sin(now * 0.006);
          ctx.save();
          ctx.translate(arrX, arrY);
          ctx.rotate(arrAngle);
          ctx.globalAlpha = 0.8 + 0.2 * arrowPulse;
          ctx.fillStyle = '#f6ad55';
          ctx.strokeStyle = '#7b3f00';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(22, 0);
          ctx.lineTo(-10, 10);
          ctx.lineTo(-5, 0);
          ctx.lineTo(-10, -10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // Emoji
          ctx.globalAlpha = 1;
          ctx.font = '14px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🦅', 0, 0);
          ctx.restore();
        }
      }
    }

    // === CITY VAULT TRUCK HUD BAR ===
    if (gameState.vaultTruck && !gameState.vaultTruck.cracked && !gameState.vaultTruck.escaped) {
      const vt = gameState.vaultTruck;
      const vtTimeLeft = Math.max(0, vt.endsAt - now);
      const vtHpPct = vt.hp / vt.maxHp;
      const vtMyHits = vt.myHits || 0;

      // Gold tint overlay — the whole city glows with greed
      const vtPulse = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.004));
      ctx.save();
      ctx.globalAlpha = 0.04 + 0.02 * vtPulse;
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      ctx.globalAlpha = 1;
      ctx.restore();

      // HUD bar: stacks below migration/seagull/crime wave bars
      const hasCrimeWaveVT = gameState.self && gameState.self.crimeWave;
      const hasSeagullVT = gameState.seagullInvasion;
      const hasMigrationVT = gameState.migration;
      let vtBarY = 132;
      if (hasCrimeWaveVT) vtBarY += 43;
      if (hasSeagullVT) vtBarY += 43;
      if (hasMigrationVT) vtBarY += 43;

      const vtBarW = 220, vtBarH = 12;
      const vtBarX = camera.screenW / 2 - vtBarW / 2;

      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.beginPath();
      ctx.roundRect(vtBarX - 60, vtBarY - 18, vtBarW + 120, vtBarH + 32, 10);
      ctx.fill();

      const vtLabelPulse = 0.75 + 0.25 * Math.sin(now * 0.007);
      ctx.globalAlpha = vtLabelPulse;
      const vtHpColor = vtHpPct > 0.5 ? '#ffd700' : vtHpPct > 0.25 ? '#ff8800' : '#ff4400';
      ctx.fillStyle = vtHpColor;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const vtHitsStr = vtMyHits > 0 ? ` · MY HITS: ${vtMyHits}` : '';
      ctx.fillText(`💼 VAULT TRUCK — ${vt.hp}/${vt.maxHp}HP · ${Math.ceil(vtTimeLeft / 1000)}s${vtHitsStr}`, camera.screenW / 2, vtBarY - 4);

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(60,50,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(vtBarX, vtBarY + 2, vtBarW, vtBarH, 4);
      ctx.fill();

      ctx.fillStyle = vtHpColor;
      ctx.beginPath();
      ctx.roundRect(vtBarX, vtBarY + 2, vtBarW * vtHpPct, vtBarH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // Off-screen direction arrow when vault truck is not visible
      const vtSX = vt.x - camera.x + camera.screenW / 2;
      const vtSY = vt.y - camera.y + camera.screenH / 2;
      const padVT = 60;
      if (vtSX < padVT || vtSX > camera.screenW - padVT || vtSY < padVT || vtSY > camera.screenH - padVT) {
        const vtArrAngle = Math.atan2(vtSY - camera.screenH / 2, vtSX - camera.screenW / 2);
        const vtArrRadius = Math.min(camera.screenW, camera.screenH) * 0.42;
        const vtArrX = camera.screenW / 2 + Math.cos(vtArrAngle) * vtArrRadius;
        const vtArrY = camera.screenH / 2 + Math.sin(vtArrAngle) * vtArrRadius;
        const vtArrPulse = 0.6 + 0.4 * Math.sin(now * 0.006);
        ctx.save();
        ctx.translate(vtArrX, vtArrY);
        ctx.rotate(vtArrAngle);
        ctx.globalAlpha = 0.8 + 0.2 * vtArrPulse;
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#7a6000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.font = '13px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💼', 0, 0);
        ctx.restore();
      }
    }

    // === PIGEON STAMPEDE HUD BAR ===
    if (gameState.stampede) {
      const st = gameState.stampede;
      const stTimeLeft = Math.max(0, st.endsAt - now);
      const stTotal = 80000; // ~80 second max duration
      const stFrac = stTimeLeft / stTotal;
      const stAlive = st.aliveCount || 0;
      const stMyHits = st.myHits || 0;

      // Warm brown/orange tint — a dusty stampede cloud
      const stPulse = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.006));
      ctx.save();
      ctx.globalAlpha = 0.04 + 0.02 * stPulse;
      ctx.fillStyle = '#c08040';
      ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Stack below crime wave, seagull, migration, and vault truck bars
      const hasCrimeWaveST = gameState.self && gameState.self.crimeWave;
      const hasSeagullST = gameState.seagullInvasion;
      const hasMigrationST = gameState.migration;
      const hasVaultST = gameState.vaultTruck && !gameState.vaultTruck.cracked && !gameState.vaultTruck.escaped;
      let stBarY = 132;
      if (hasCrimeWaveST) stBarY += 43;
      if (hasSeagullST) stBarY += 43;
      if (hasMigrationST) stBarY += 43;
      if (hasVaultST) stBarY += 43;

      const stBarW = 210, stBarH = 12;
      const stBarX = camera.screenW / 2 - stBarW / 2;

      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.beginPath();
      ctx.roundRect(stBarX - 60, stBarY - 18, stBarW + 120, stBarH + 32, 10);
      ctx.fill();

      const stLabelPulse = 0.75 + 0.25 * Math.sin(now * 0.009);
      ctx.globalAlpha = stLabelPulse;
      ctx.fillStyle = '#e09040';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const stHitsStr = stMyHits > 0 ? ` · MY HITS: ${stMyHits}` : '';
      ctx.fillText(`🐦 PIGEON STAMPEDE — ${stAlive}/${st.totalCount} alive · ${Math.ceil(stTimeLeft / 1000)}s${stHitsStr}`, camera.screenW / 2, stBarY - 4);

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(60,30,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(stBarX, stBarY + 2, stBarW, stBarH, 4);
      ctx.fill();

      const stBarColor = stFrac > 0.5 ? '#e09040' : stFrac > 0.25 ? '#cc6020' : '#ff4400';
      ctx.fillStyle = stBarColor;
      ctx.beginPath();
      ctx.roundRect(stBarX, stBarY + 2, stBarW * stFrac, stBarH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === SUSPICIOUS PACKAGE HUD BAR ===
    if (gameState.suspiciousPackage) {
      const pkg = gameState.suspiciousPackage;
      const pkgTimeLeft = Math.max(0, pkg.timeLeft);
      const pkgMaxTime = pkg.maxTime || 90000;
      const pkgFrac = pkgTimeLeft / pkgMaxTime;
      const pkgDefuseFrac = pkg.defuseHits / pkg.maxDefuseHits;
      const pkgMyHits = pkg.myHits || 0;
      const pkgSecsLeft = Math.ceil(pkgTimeLeft / 1000);

      const pkgUrgency = pkgFrac < 0.25; // under 25% of time left
      const pkgPulse = 0.6 + 0.4 * Math.abs(Math.sin(now * (pkgUrgency ? 0.018 : 0.006)));

      // Red tint screen overlay when urgent
      if (pkgUrgency) {
        ctx.save();
        ctx.globalAlpha = 0.04 * pkgPulse;
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(0, 0, camera.screenW, camera.screenH);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Stack below crime wave, seagull, migration, vault, stampede
      const hasCrimeWavePKG = gameState.self && gameState.self.crimeWave;
      const hasSeagullPKG = gameState.seagullInvasion;
      const hasMigrationPKG = gameState.migration;
      const hasVaultPKG = gameState.vaultTruck && !gameState.vaultTruck.cracked && !gameState.vaultTruck.escaped;
      const hasStampedePKG = gameState.stampede;
      let pkgBarY = 132;
      if (hasCrimeWavePKG) pkgBarY += 43;
      if (hasSeagullPKG) pkgBarY += 43;
      if (hasMigrationPKG) pkgBarY += 43;
      if (hasVaultPKG) pkgBarY += 43;
      if (hasStampedePKG) pkgBarY += 43;

      const pkgBarW = 220, pkgBarH = 12;
      const pkgBarX = camera.screenW / 2 - pkgBarW / 2;

      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.beginPath();
      ctx.roundRect(pkgBarX - 60, pkgBarY - 18, pkgBarW + 120, pkgBarH + 32, 10);
      ctx.fill();

      const pkgLabelPulse = pkgUrgency ? (0.7 + 0.3 * Math.sin(now * 0.018)) : 0.85;
      ctx.globalAlpha = pkgLabelPulse;
      ctx.fillStyle = pkgUrgency ? '#ff3300' : '#ff8800';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const pkgHitsStr = pkgMyHits > 0 ? ` · MY HITS: ${pkgMyHits}` : '';
      ctx.fillText(`\uD83D\uDCA3 PACKAGE — ${pkg.defuseHits}/${pkg.maxDefuseHits} DEFUSED · FUSE: ${pkgSecsLeft}s${pkgHitsStr}`, camera.screenW / 2, pkgBarY - 4);

      // Red fuse countdown bar
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(80,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(pkgBarX, pkgBarY + 2, pkgBarW, pkgBarH, 4);
      ctx.fill();

      const pkgFuseColor = pkgFrac > 0.5 ? '#ff8800' : pkgFrac > 0.25 ? '#ff4400' : '#ff1100';
      ctx.fillStyle = pkgFuseColor;
      ctx.beginPath();
      ctx.roundRect(pkgBarX, pkgBarY + 2, pkgBarW * pkgFrac, pkgBarH, 4);
      ctx.fill();

      // Cyan defuse progress overlay on top
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#00ccff';
      ctx.beginPath();
      ctx.roundRect(pkgBarX, pkgBarY + 2, pkgBarW * pkgDefuseFrac, pkgBarH, 4);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === BIRDNAPPER VAN HUD BAR (when escaping with captive) ===
    if (gameState.birdnapperVan && gameState.birdnapperVan.state === 'escaping' && gameState.birdnapperVan.captiveName) {
      const bv = gameState.birdnapperVan;
      const bvPct = (bv.poopHits || 0) / (bv.maxPoopHits || 8);
      const bvFast = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.015));

      // Pulsing purple/red danger tint
      ctx.save();
      ctx.globalAlpha = 0.06 + 0.04 * bvFast;
      ctx.fillStyle = bv.isCaptive ? '#ff0000' : '#880088';
      ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Stack below crime wave, seagull, migration, vault, stampede, package bars
      const hasCrimeWaveBV = gameState.self && gameState.self.crimeWave;
      const hasSeagullBV = gameState.seagullInvasion;
      const hasMigrationBV = gameState.migration;
      const hasVaultBV = gameState.vaultTruck && !gameState.vaultTruck.cracked && !gameState.vaultTruck.escaped;
      const hasStampedeBV = gameState.stampede;
      const hasPackageBV = gameState.suspiciousPackage;
      let bvBarY = 132;
      if (hasCrimeWaveBV) bvBarY += 43;
      if (hasSeagullBV) bvBarY += 43;
      if (hasMigrationBV) bvBarY += 43;
      if (hasVaultBV) bvBarY += 43;
      if (hasStampedeBV) bvBarY += 43;
      if (hasPackageBV) bvBarY += 43;

      const bvBarW = 220, bvBarH = 12;
      const bvBarX = camera.screenW / 2 - bvBarW / 2;

      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.beginPath();
      ctx.roundRect(bvBarX - 60, bvBarY - 18, bvBarW + 120, bvBarH + 32, 10);
      ctx.fill();

      ctx.globalAlpha = 0.8 + 0.2 * bvFast;
      ctx.fillStyle = bv.isCaptive ? '#ff3300' : '#cc00cc';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const bvMyHitsStr = bv.myHits > 0 ? ` · MY HITS: ${bv.myHits}` : '';
      const bvLabel = bv.isCaptive
        ? `🚐💀 YOU'RE CAPTIVE! Others poop the van! ${bv.poopHits}/${bv.maxPoopHits}${bvMyHitsStr}`
        : `🚐 POOP THE VAN — RESCUE ${bv.captiveName}! ${bv.poopHits}/${bv.maxPoopHits}${bvMyHitsStr}`;
      ctx.fillText(bvLabel, camera.screenW / 2, bvBarY - 4);

      // Dark background of bar
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(60,0,60,0.55)';
      ctx.beginPath();
      ctx.roundRect(bvBarX, bvBarY + 2, bvBarW, bvBarH, 4);
      ctx.fill();

      // Cyan rescue progress fill
      ctx.fillStyle = '#00ccff';
      ctx.beginPath();
      ctx.roundRect(bvBarX, bvBarY + 2, bvBarW * bvPct, bvBarH, 4);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === FLASH MOB HUD BAR (Session 106) ===
    if (gameState.flashMob) {
      const fm = gameState.flashMob;
      const fmIsActive = fm.state === 'active';
      const fmSecsLeft = fmIsActive
        ? Math.max(0, Math.ceil((fm.endsAt - now) / 1000))
        : Math.max(0, Math.ceil((fm.startsAt - now) / 1000));
      const fmColor = fmIsActive ? '#ff44cc' : '#cc88ff';
      const fmPulse = 0.7 + 0.3 * Math.abs(Math.sin(now * (fmIsActive ? 0.012 : 0.007)));

      // Party pink tint when active
      if (fmIsActive) {
        ctx.save();
        ctx.globalAlpha = 0.04 + 0.02 * fmPulse;
        ctx.fillStyle = '#ff44cc';
        ctx.fillRect(0, 0, camera.screenW, camera.screenH);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Stack below all other HUD bars
      const hasCrimeWaveFM = gameState.self && gameState.self.crimeWave;
      const hasSeagullFM = gameState.seagullInvasion;
      const hasMigrationFM = gameState.migration;
      const hasVaultFM = gameState.vaultTruck && !gameState.vaultTruck.cracked && !gameState.vaultTruck.escaped;
      const hasStampedeFM = gameState.stampede;
      const hasPackageFM = gameState.suspiciousPackage;
      const hasBVFM = gameState.birdnapperVan && gameState.birdnapperVan.state === 'escaping';
      let fmBarY = 132;
      if (hasCrimeWaveFM) fmBarY += 43;
      if (hasSeagullFM) fmBarY += 43;
      if (hasMigrationFM) fmBarY += 43;
      if (hasVaultFM) fmBarY += 43;
      if (hasStampedeFM) fmBarY += 43;
      if (hasPackageFM) fmBarY += 43;
      if (hasBVFM) fmBarY += 43;

      const fmBarW = 230, fmBarH = 12;
      const fmBarX = camera.screenW / 2 - fmBarW / 2;

      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.beginPath();
      ctx.roundRect(fmBarX - 60, fmBarY - 18, fmBarW + 120, fmBarH + 32, 10);
      ctx.fill();

      ctx.globalAlpha = fmPulse;
      ctx.fillStyle = fmColor;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const fmLabel = fmIsActive
        ? `🎉 FLASH MOB at ${fm.locationName} — ${fm.participantCount || 0} birds · ${fmSecsLeft}s · FLY THERE!`
        : `🎉 FLASH MOB INCOMING — ${fm.locationName} in ${fmSecsLeft}s!`;
      ctx.fillText(fmLabel, camera.screenW / 2, fmBarY - 4);

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = fmIsActive ? 'rgba(80,0,60,0.55)' : 'rgba(50,20,80,0.55)';
      ctx.beginPath();
      ctx.roundRect(fmBarX, fmBarY + 2, fmBarW, fmBarH, 4);
      ctx.fill();

      const fmFracTotal = fmIsActive ? 60000 : 30000;
      const fmFrac = fmIsActive ? fmSecsLeft / 60 : fmSecsLeft / 30;
      ctx.fillStyle = fmIsActive ? '#ff44cc' : '#9944ff';
      ctx.beginPath();
      ctx.roundRect(fmBarX, fmBarY + 2, fmBarW * Math.max(0, Math.min(1, fmFrac)), fmBarH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // Off-screen direction arrow
      const fmSX = fm.x - camera.x + camera.screenW / 2;
      const fmSY = fm.y - camera.y + camera.screenH / 2;
      const fmPad = 60;
      if (fmSX < fmPad || fmSX > camera.screenW - fmPad || fmSY < fmPad || fmSY > camera.screenH - fmPad) {
        const fmAngle = Math.atan2(fmSY - camera.screenH / 2, fmSX - camera.screenW / 2);
        const fmArrR = Math.min(camera.screenW, camera.screenH) * 0.42;
        const fmArrX = camera.screenW / 2 + Math.cos(fmAngle) * fmArrR;
        const fmArrY = camera.screenH / 2 + Math.sin(fmAngle) * fmArrR;
        const fmArrPulse = 0.6 + 0.4 * Math.sin(now * (fmIsActive ? 0.015 : 0.008));
        ctx.save();
        ctx.translate(fmArrX, fmArrY);
        ctx.rotate(fmAngle);
        ctx.globalAlpha = 0.85 + 0.15 * fmArrPulse;
        ctx.fillStyle = fmIsActive ? '#ff44cc' : '#cc88ff';
        ctx.strokeStyle = '#440033';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.font = '13px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎉', 0, 0);
        ctx.restore();
      }
    }

    // === SKY PIRATE AIRSHIP HUD BAR (Session 110) ===
    if (gameState.skyPirateShip && !gameState.skyPirateShip.sinking) {
      const sp = gameState.skyPirateShip;
      const spTimeLeft = Math.max(0, Math.ceil((sp.expiresAt - now) / 1000));
      const spHpFrac = sp.hp / sp.maxHp;
      const spPulse = 0.7 + 0.3 * Math.abs(Math.sin(now * 0.008));
      const spUrgent = spHpFrac < 0.35;
      const spColor = spUrgent ? '#ff3333' : '#cc2200';

      // Red screen tint when airship is active
      ctx.save();
      ctx.globalAlpha = 0.04 + 0.02 * spPulse;
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Stack below crime wave, seagull, migration, vault, stampede, package, birdnapper bars
      const hasCWsp = gameState.self && gameState.self.crimeWave;
      const hasSGsp = gameState.seagullInvasion;
      const hasMGsp = gameState.migration;
      const hasVTsp = gameState.vaultTruck && !gameState.vaultTruck.cracked && !gameState.vaultTruck.escaped;
      const hasSTsp = gameState.stampede;
      const hasPKsp = gameState.suspiciousPackage;
      const hasBVsp = gameState.birdnapperVan && gameState.birdnapperVan.state === 'escaping';
      const hasFMsp = gameState.flashMob;
      let spBarY = 132;
      if (hasCWsp) spBarY += 43;
      if (hasSGsp) spBarY += 43;
      if (hasMGsp) spBarY += 43;
      if (hasVTsp) spBarY += 43;
      if (hasSTsp) spBarY += 43;
      if (hasPKsp) spBarY += 43;
      if (hasBVsp) spBarY += 43;
      if (hasFMsp) spBarY += 43;

      const spBarW = 230, spBarH = 12;
      const spBarX = camera.screenW / 2 - spBarW / 2;

      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.beginPath();
      ctx.roundRect(spBarX - 60, spBarY - 18, spBarW + 120, spBarH + 32, 10);
      ctx.fill();

      ctx.globalAlpha = spUrgent ? spPulse : 0.9;
      ctx.fillStyle = spColor;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const spMyHitsStr = sp.myHits > 0 ? ` · MY HITS: ${sp.myHits}` : '';
      ctx.fillText(`🏴‍☠️ SKY PIRATE AIRSHIP — ${sp.hp}/${sp.maxHp} HP · ${spTimeLeft}s${spMyHitsStr} · POOP IT DOWN!`, camera.screenW / 2, spBarY - 4);

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(60,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(spBarX, spBarY + 2, spBarW, spBarH, 4);
      ctx.fill();

      const spFillColor = spUrgent ? '#ff2222' : '#cc3311';
      ctx.fillStyle = spFillColor;
      ctx.beginPath();
      ctx.roundRect(spBarX, spBarY + 2, spBarW * Math.max(0, spHpFrac), spBarH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === MAYOR'S MOTORCADE HUD BAR (Session 111) ===
    if (gameState.motorcade) {
      const mc = gameState.motorcade;
      const mcTimeLeft = Math.max(0, mc.endsAt - now);
      const mcHpFrac = mc.hp / mc.maxHp;
      const mcPulse = 0.7 + 0.3 * Math.abs(Math.sin(now * (mc.outraged ? 0.016 : 0.007)));
      const mcOutraged = mc.outraged;
      const mcColor = mcOutraged ? '#dd2200' : '#1a3a8f';

      // Subtle blue/red tint
      ctx.save();
      ctx.globalAlpha = 0.03 + 0.02 * mcPulse;
      ctx.fillStyle = mcOutraged ? '#cc1100' : '#1133aa';
      ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Stack below all other HUD bars
      const hasCWmc = gameState.self && gameState.self.crimeWave;
      const hasSGmc = gameState.seagullInvasion;
      const hasMGmc = gameState.migration;
      const hasVTmc = gameState.vaultTruck && !gameState.vaultTruck.cracked && !gameState.vaultTruck.escaped;
      const hasSTmc = gameState.stampede;
      const hasPKmc = gameState.suspiciousPackage;
      const hasBVmc = gameState.birdnapperVan && gameState.birdnapperVan.state === 'escaping';
      const hasFMmc = gameState.flashMob;
      const hasSPmc = gameState.skyPirateShip && !gameState.skyPirateShip.sinking;
      let mcBarY = 132;
      if (hasCWmc) mcBarY += 43;
      if (hasSGmc) mcBarY += 43;
      if (hasMGmc) mcBarY += 43;
      if (hasVTmc) mcBarY += 43;
      if (hasSTmc) mcBarY += 43;
      if (hasPKmc) mcBarY += 43;
      if (hasBVmc) mcBarY += 43;
      if (hasFMmc) mcBarY += 43;
      if (hasSPmc) mcBarY += 43;

      const mcBarW = 240, mcBarH = 12;
      const mcBarX = camera.screenW / 2 - mcBarW / 2;

      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.beginPath();
      ctx.roundRect(mcBarX - 60, mcBarY - 18, mcBarW + 120, mcBarH + 32, 10);
      ctx.fill();

      ctx.globalAlpha = mcPulse;
      ctx.fillStyle = mcColor;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const mcMyHitsStr = mc.myHits > 0 ? ` · MY HITS: ${mc.myHits}` : '';
      const mcLabel = mcOutraged
        ? `🚨 OUTRAGE! LIMO — ${mc.hp}/${mc.maxHp} HP · ${Math.ceil(mcTimeLeft / 1000)}s${mcMyHitsStr}`
        : `🚗 MAYOR'S MOTORCADE — ${mc.hp}/${mc.maxHp} HP · ${Math.ceil(mcTimeLeft / 1000)}s · Stun escorts first!${mcMyHitsStr}`;
      ctx.fillText(mcLabel, camera.screenW / 2, mcBarY - 4);

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = mcOutraged ? 'rgba(60,0,0,0.55)' : 'rgba(0,15,60,0.55)';
      ctx.beginPath();
      ctx.roundRect(mcBarX, mcBarY + 2, mcBarW, mcBarH, 4);
      ctx.fill();

      const mcFillColor = mcHpFrac > 0.5 ? (mcOutraged ? '#ff3300' : '#3366dd') : mcHpFrac > 0.25 ? '#ff8800' : '#ff2200';
      ctx.fillStyle = mcFillColor;
      ctx.beginPath();
      ctx.roundRect(mcBarX, mcBarY + 2, mcBarW * Math.max(0, mcHpFrac), mcBarH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // Off-screen direction arrow
      const mcSX = mc.x - camera.x + camera.screenW / 2;
      const mcSY = mc.y - camera.y + camera.screenH / 2;
      const mcPad = 60;
      if (mcSX < mcPad || mcSX > camera.screenW - mcPad || mcSY < mcPad || mcSY > camera.screenH - mcPad) {
        const mcArrAngle = Math.atan2(mcSY - camera.screenH / 2, mcSX - camera.screenW / 2);
        const mcArrRadius = Math.min(camera.screenW, camera.screenH) * 0.42;
        const mcArrX = camera.screenW / 2 + Math.cos(mcArrAngle) * mcArrRadius;
        const mcArrY = camera.screenH / 2 + Math.sin(mcArrAngle) * mcArrRadius;
        ctx.save();
        ctx.translate(mcArrX, mcArrY);
        ctx.rotate(mcArrAngle);
        ctx.globalAlpha = 0.85 + 0.15 * mcPulse;
        ctx.fillStyle = mcOutraged ? '#ff4400' : '#2255cc';
        ctx.strokeStyle = mcOutraged ? '#660000' : '#001144';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.font = '13px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚗', 0, 0);
        ctx.restore();
      }
    }

    // === CRIME WAVE OVERLAY ===
    if (gameState.self && gameState.self.crimeWave) {
      const cw = gameState.self.crimeWave;
      const cwTimeLeft = Math.max(0, cw.endsAt - now);
      const cwTotal = 120000; // 2 minutes
      const cwFrac = cwTimeLeft / cwTotal;

      // Pulsing red tint over the whole screen
      const cwPulse = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.003));
      ctx.save();
      ctx.globalAlpha = 0.08 + 0.05 * cwPulse;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Siren vignette: red/blue alternating edge flash
      const sirenPhase = Math.floor(now / 500) % 2; // alternates every 500ms
      ctx.save();
      const sirenGrad = ctx.createRadialGradient(
        camera.screenW / 2, camera.screenH / 2, camera.screenH * 0.3,
        camera.screenW / 2, camera.screenH / 2, camera.screenH * 0.9
      );
      const sirenColor = sirenPhase === 0 ? 'rgba(255,30,30,' : 'rgba(30,80,255,';
      sirenGrad.addColorStop(0, sirenColor + '0)');
      sirenGrad.addColorStop(1, sirenColor + '0.12)');
      ctx.fillStyle = sirenGrad;
      ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      ctx.globalAlpha = 1;
      ctx.restore();

      // HUD bar at top showing countdown
      const cwBarW = 200, cwBarH = 14;
      const cwBarX = camera.screenW / 2 - cwBarW / 2;
      const cwBarY = 132;
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath();
      ctx.roundRect(cwBarX - 60, cwBarY - 18, cwBarW + 120, cwBarH + 34, 10);
      ctx.fill();
      // Label
      const cwLabelPulse = 0.75 + 0.25 * Math.sin(now * 0.006);
      ctx.globalAlpha = cwLabelPulse;
      ctx.fillStyle = '#ff3333';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`🚨 CRIME WAVE — ${Math.ceil(cwTimeLeft / 1000)}s · 2× HEAT · 2× CRIME REWARDS`, camera.screenW / 2, cwBarY - 4);
      // Bar background
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(80,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(cwBarX, cwBarY + 4, cwBarW, cwBarH, 5);
      ctx.fill();
      // Bar fill — draining red bar
      ctx.fillStyle = cwFrac > 0.5 ? '#ff4444' : cwFrac > 0.25 ? '#ff8800' : '#ffcc00';
      ctx.beginPath();
      ctx.roundRect(cwBarX, cwBarY + 4, cwBarW * cwFrac, cwBarH, 5);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === PEOPLE'S REVOLT WINDOW OVERLAY (non-Kingpin birds only) ===
    if (window._revoltWindowUntil && window._revoltWindowUntil > now) {
      const rvTimeLeft = Math.max(0, window._revoltWindowUntil - now);
      const rvTotal = 15000;
      const rvFrac = rvTimeLeft / rvTotal;
      const rvSecs = Math.ceil(rvTimeLeft / 1000);

      // Pulsing red tint overlay — rage building in the city
      const rvPulse = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.006));
      ctx.save();
      ctx.globalAlpha = 0.06 + 0.04 * rvPulse;
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      ctx.globalAlpha = 1;
      ctx.restore();

      // HUD bar at top (stacks below crime wave bar if active, else at y=132)
      const hasCrimeWave2 = gameState.self && gameState.self.crimeWave;
      const rvBarY = hasCrimeWave2 ? 212 : 132;
      const rvBarW = 200, rvBarH = 12;
      const rvBarX = camera.screenW / 2 - rvBarW / 2;

      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.roundRect(rvBarX - 60, rvBarY - 18, rvBarW + 120, rvBarH + 34, 10);
      ctx.fill();

      const rvLabelPulse = 0.7 + 0.3 * Math.sin(now * 0.01);
      ctx.globalAlpha = Math.max(0.7, rvLabelPulse);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`🏴 REVOLT WINDOW — ${rvSecs}s! POOP THE KINGPIN! (3 birds needed)`, camera.screenW / 2, rvBarY - 4);

      ctx.globalAlpha = 0.8;
      ctx.fillStyle = 'rgba(80,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(rvBarX, rvBarY + 2, rvBarW, rvBarH, 4);
      ctx.fill();

      ctx.fillStyle = rvFrac > 0.5 ? '#ff3333' : rvFrac > 0.25 ? '#ff6600' : '#ffcc00';
      ctx.beginPath();
      ctx.roundRect(rvBarX, rvBarY + 2, rvBarW * rvFrac, rvBarH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === CITY LOCKDOWN OVERLAY ===
    if (gameState.cityLockdown) {
      const cl = gameState.cityLockdown;
      const clTimeLeft = Math.max(0, cl.endsAt - now);
      const clTotal = 90000;
      const clFrac = clTimeLeft / clTotal;

      // Military red-orange siren pulse
      const clPulse = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.0045));
      ctx.save();
      ctx.globalAlpha = 0.07 + 0.05 * clPulse;
      ctx.fillStyle = '#cc2200';
      ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Warning-stripe vignette at screen edges (yellow/black hazard stripes)
      const stripePhase = (now * 0.0006) % 1;
      ctx.save();
      ctx.globalAlpha = 0.08 + 0.04 * clPulse;
      for (let i = -10; i < 30; i++) {
        const px = (i + stripePhase) * (camera.screenW / 20);
        ctx.fillStyle = (i % 2 === 0) ? '#ffcc00' : '#000';
        ctx.fillRect(px, 0, camera.screenW / 20, 8);
        ctx.fillRect(px, camera.screenH - 8, camera.screenW / 20, 8);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // HUD bar (stacks below crime wave bar and seagull bar)
      const hasCrimeWave2 = gameState.self && gameState.self.crimeWave;
      const hasSeagull2 = gameState.seagullInvasion;
      let clBarY = 132;
      if (hasCrimeWave2) clBarY += 43;
      if (hasSeagull2) clBarY += 43;

      const clBarW = 210, clBarH = 14;
      const clBarX = camera.screenW / 2 - clBarW / 2;

      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.roundRect(clBarX - 65, clBarY - 18, clBarW + 130, clBarH + 34, 10);
      ctx.fill();

      const clLabelPulse = 0.75 + 0.25 * Math.sin(now * 0.006);
      ctx.globalAlpha = clLabelPulse;
      ctx.fillStyle = '#ff6600';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`🚨 CITY LOCKDOWN — ${Math.ceil(clTimeLeft / 1000)}s · 1.5× CRIME REWARDS · NAT. GUARD`, camera.screenW / 2, clBarY - 4);

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(80,20,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(clBarX, clBarY + 4, clBarW, clBarH, 5);
      ctx.fill();

      // Bar fill — draining orange-red bar
      ctx.fillStyle = clFrac > 0.5 ? '#ff6600' : clFrac > 0.25 ? '#ff8800' : '#ffcc00';
      ctx.beginPath();
      ctx.roundRect(clBarX, clBarY + 4, clBarW * clFrac, clBarH, 5);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === CHAOS EVENT OVERLAYS ===
    if (gameState.chaosEvent) {
      const ce = gameState.chaosEvent;
      const ceTimeLeft = Math.max(0, ce.endsAt - now);
      const ceDur = { npc_flood:30000, car_frenzy:20000, golden_rain:20000,
        poop_party:20000, coin_shower:25000, food_festival:30000, blackout:25000, disco_fever:20000 };
      const ceTotal = ceDur[ce.type] || 25000;
      const ceFrac = ceTimeLeft / ceTotal;
      const cePulse = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.005));

      // Blackout — near-total darkness, cop blindness
      if (ce.type === 'blackout') {
        ctx.save();
        ctx.globalAlpha = 0.87;
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, camera.screenW, camera.screenH);
        // Occasional electric flicker
        if (Math.random() < 0.005) {
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = '#4488ff';
          ctx.fillRect(0, 0, camera.screenW, camera.screenH);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Poop Party — pink confetti rain + tint
      if (ce.type === 'poop_party') {
        ctx.save();
        ctx.globalAlpha = 0.06 + 0.03 * cePulse;
        ctx.fillStyle = '#ff44cc';
        ctx.fillRect(0, 0, camera.screenW, camera.screenH);
        ctx.globalAlpha = 1;
        // Confetti particles (deterministic per frame for perf)
        const confettiCount = 40;
        for (let i = 0; i < confettiCount; i++) {
          const phase = (now * 0.0003 + i * 0.7) % 1;
          const cx2 = ((i * 137.5) % camera.screenW);
          const cy2 = (phase * (camera.screenH + 40)) - 20;
          const hue = (i * 30 + now * 0.05) % 360;
          ctx.globalAlpha = 0.55 + 0.35 * Math.sin(now * 0.004 + i);
          ctx.fillStyle = `hsl(${hue},100%,65%)`;
          ctx.fillRect(cx2, cy2, 4, 8);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Disco Fever — spinning disco ball light rays
      if (ce.type === 'disco_fever' || ce.isCrimeDisco) {
        ctx.save();
        // Subtle color-cycling tint
        const discoHue = (now * 0.04) % 360;
        ctx.globalAlpha = 0.07 + 0.04 * cePulse;
        ctx.fillStyle = `hsl(${discoHue},100%,60%)`;
        ctx.fillRect(0, 0, camera.screenW, camera.screenH);
        // Disco beam rays from top-center
        const ballX = camera.screenW / 2;
        const ballY = 60;
        ctx.globalAlpha = 0.08;
        for (let r = 0; r < 8; r++) {
          const angle = (now * 0.0015 + r * Math.PI / 4) % (Math.PI * 2);
          const hue2 = (r * 45 + now * 0.06) % 360;
          ctx.strokeStyle = `hsl(${hue2},100%,70%)`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ballX, ballY);
          ctx.lineTo(ballX + Math.cos(angle) * 900, ballY + Math.sin(angle) * 900);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Coin Shower — golden sparkle overlay
      if (ce.type === 'coin_shower') {
        ctx.save();
        ctx.globalAlpha = 0.05 + 0.03 * cePulse;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(0, 0, camera.screenW, camera.screenH);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Food Festival — soft green tint
      if (ce.type === 'food_festival') {
        ctx.save();
        ctx.globalAlpha = 0.05 + 0.02 * cePulse;
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(0, 0, camera.screenW, camera.screenH);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // HUD countdown bar for all chaos events
      const CE_LABELS = {
        npc_flood: '🚶 NPC FLOOD', car_frenzy: '🚗 CAR FRENZY', golden_rain: '🌟 GOLDEN RAIN',
        poop_party: '🎉 POOP PARTY — ALL POOP = MEGA!', coin_shower: '💸 COIN SHOWER — COLLECT!',
        food_festival: '🎊 FOOD FESTIVAL — EAT UP!',
        blackout: '⚡ BLACKOUT — COPS BLIND!',
        disco_fever: ce.isCrimeDisco ? '🚨🪩 CRIME DISCO — 5× NPC XP · 3× CRIME COINS!' : '🪩 DISCO FEVER — 3× NPC XP!',
      };
      const CE_COLORS = {
        npc_flood: '#ff4444', car_frenzy: '#ff8800', golden_rain: '#ffd700',
        poop_party: '#ff88ff', coin_shower: '#ffd700', food_festival: '#88ff44',
        blackout: '#4488ff', disco_fever: ce.isCrimeDisco ? '#ff44ff' : '#ff88ff',
      };
      const ceLabel = CE_LABELS[ce.type] || 'CHAOS EVENT';
      const ceColor = CE_COLORS[ce.type] || '#ff4444';

      // Stack below existing bars
      const hasCrimeWave3 = gameState.self && gameState.self.crimeWave;
      const hasSeagull3 = gameState.seagullInvasion;
      const hasLockdown3 = gameState.cityLockdown;
      let ceBarY = 132;
      if (hasCrimeWave3) ceBarY += 43;
      if (hasSeagull3) ceBarY += 43;
      if (hasLockdown3) ceBarY += 43;

      const ceBarW = 200, ceBarH = 12;
      const ceBarX = camera.screenW / 2 - ceBarW / 2;
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath();
      ctx.roundRect(ceBarX - 65, ceBarY - 18, ceBarW + 130, ceBarH + 34, 10);
      ctx.fill();
      ctx.globalAlpha = 0.75 + 0.25 * Math.sin(now * 0.007);
      ctx.fillStyle = ceColor;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${ceLabel} — ${Math.ceil(ceTimeLeft / 1000)}s`, camera.screenW / 2, ceBarY - 4);
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = 'rgba(30,0,30,0.5)';
      ctx.beginPath();
      ctx.roundRect(ceBarX, ceBarY + 2, ceBarW, ceBarH, 4);
      ctx.fill();
      ctx.fillStyle = ceColor;
      ctx.beginPath();
      ctx.roundRect(ceBarX, ceBarY + 2, ceBarW * ceFrac, ceBarH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // === BIRD ROYALE OVERLAY ===
    if (gameState.birdRoyale) {
      const ry = gameState.birdRoyale;
      const ryPulse = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.005));

      if (ry.state === 'active') {
        // Pulsing orange tint during royale
        ctx.save();
        ctx.globalAlpha = 0.05 + 0.03 * ryPulse;
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(0, 0, camera.screenW, camera.screenH);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Determine bar y position (stack below seagull and crime wave bars)
      const hasCrimeWave = gameState.crimeWave;
      const hasSeagull = gameState.seagullInvasion;
      let ryBarY = 132;
      if (hasCrimeWave) ryBarY += 43;
      if (hasSeagull) ryBarY += 43;

      const ryBarW = 220, ryBarH = 14;
      const ryBarX = camera.screenW / 2 - ryBarW / 2;
      const ryLabelPulse = 0.75 + 0.25 * Math.sin(now * 0.006);

      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath();
      ctx.roundRect(ryBarX - 60, ryBarY - 18, ryBarW + 120, ryBarH + 36, 10);
      ctx.fill();

      if (ry.state === 'warning') {
        const secLeft = Math.max(0, Math.ceil((ry.startAt - now) / 1000));
        ctx.globalAlpha = ryLabelPulse;
        ctx.fillStyle = '#ff9900';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`⚔️ BIRD ROYALE in ${secLeft}s — Fly to the center!`, camera.screenW / 2, ryBarY - 4);
        // Warning countdown bar (orange, draining)
        const warningTotal = 2 * 60 * 1000;
        const warnFrac = Math.max(0, Math.min(1, (ry.startAt - now) / warningTotal));
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = 'rgba(80,40,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(ryBarX, ryBarY + 4, ryBarW, ryBarH, 5);
        ctx.fill();
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.roundRect(ryBarX, ryBarY + 4, ryBarW * warnFrac, ryBarH, 5);
        ctx.fill();
      } else if (ry.state === 'active') {
        const secLeft = Math.max(0, Math.ceil((ry.endsAt - now) / 1000));
        const myStatus = ry.myStatus || 'spectator';
        const statusStr = myStatus === 'alive' ? '— STAY INSIDE!' : myStatus === 'eliminated' ? '— ELIMINATED' : '';
        ctx.globalAlpha = ryLabelPulse;
        ctx.fillStyle = '#ff4400';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`⚔️ BIRD ROYALE — ${ry.aliveCount} alive · ${secLeft}s ${statusStr}`, camera.screenW / 2, ryBarY - 4);
        // Time remaining bar
        const shrinkTotal = 3 * 60 * 1000;
        const ryFrac = Math.max(0, Math.min(1, (ry.endsAt - now) / shrinkTotal));
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = 'rgba(80,20,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(ryBarX, ryBarY + 4, ryBarW, ryBarH, 5);
        ctx.fill();
        ctx.fillStyle = ryFrac > 0.5 ? '#ff4400' : ryFrac > 0.25 ? '#ff8800' : '#ffcc00';
        ctx.beginPath();
        ctx.roundRect(ryBarX, ryBarY + 4, ryBarW * ryFrac, ryBarH, 5);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Lightning flash (brief bright overlay)
    if (lightningFlash) {
      const age = now - lightningFlash.time;
      if (age < lightningFlash.duration) {
        const alpha = Math.max(0, 0.75 * (1 - age / lightningFlash.duration));
        ctx.fillStyle = 'rgba(230, 240, 255, ' + alpha + ')';
        ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      } else {
        lightningFlash = null;
      }
    }

    // Motorcade outrage flash (red)
    if (window._motorcadeOutrageFlash) {
      const mof_age = now - window._motorcadeOutrageFlash;
      const mof_dur = 600;
      if (mof_age < mof_dur) {
        const mof_alpha = Math.max(0, 0.55 * (1 - mof_age / mof_dur));
        ctx.fillStyle = `rgba(220, 30, 30, ${mof_alpha})`;
        ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      } else {
        window._motorcadeOutrageFlash = null;
      }
    }

    // Mystery Crate — direction arrow (compass pointing toward crate when off-screen or far away)
    if (gameState.self && gameState.self.mysteryCrate) {
      const crate = gameState.self.mysteryCrate;
      const cx = crate.x - camera.x + camera.screenW / 2;
      const cy = crate.y - camera.y + camera.screenH / 2;
      const timeLeft = Math.max(0, crate.expiresAt - now);
      const onScreen = cx > 20 && cx < camera.screenW - 20 && cy > 20 && cy < camera.screenH - 20;
      // Always show HUD countdown bar
      const total = 90000;
      const frac = timeLeft / total;
      const barW = 140, barH = 12;
      const barX = camera.screenW / 2 - barW / 2;
      const barY = 82;
      const pulse = 0.7 + 0.3 * Math.sin(now * 0.005);
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(barX - 40, barY - 16, barW + 80, barH + 28, 8);
      ctx.fill();
      // Icon + label
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`📦 MYSTERY CRATE — ${Math.ceil(timeLeft / 1000)}s`, camera.screenW / 2, barY - 3);
      // Progress bar background
      ctx.fillStyle = 'rgba(255,200,0,0.2)';
      ctx.beginPath();
      ctx.roundRect(barX, barY + 2, barW, barH, 4);
      ctx.fill();
      // Progress bar fill
      ctx.fillStyle = frac > 0.4 ? '#ffd700' : (frac > 0.2 ? '#ff8800' : '#ff3300');
      ctx.beginPath();
      ctx.roundRect(barX, barY + 2, barW * frac, barH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Direction arrow if crate is off-screen
      if (!onScreen) {
        const angle = Math.atan2(cy - camera.screenH / 2, cx - camera.screenW / 2);
        const arrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 50;
        const ax = camera.screenW / 2 + Math.cos(angle) * arrowDist;
        const ay = camera.screenH / 2 + Math.sin(angle) * arrowDist;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.85 * pulse;
        // Arrow body
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // "?" label on arrow
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 4, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    // Shooting Star — direction arrow + countdown bar (when landing site is off-screen)
    const _ssHud = gameState.self && gameState.self.shootingStar;
    if (_ssHud) {
      const ssx = _ssHud.x - camera.x + camera.screenW / 2;
      const ssy = _ssHud.y - camera.y + camera.screenH / 2;
      const ssTimeLeft = Math.max(0, _ssHud.expiresAt - now);
      const ssOnScreen = ssx > 40 && ssx < camera.screenW - 40 && ssy > 40 && ssy < camera.screenH - 40;
      const ssFrac = ssTimeLeft / 45000;
      const ssPulse = 0.7 + 0.3 * Math.sin(now * 0.007);
      // HUD countdown bar (at barY=99 to avoid overlapping mystery crate bar at 82)
      const ssBarW = 160, ssBarH = 12;
      const ssBarX = camera.screenW / 2 - ssBarW / 2;
      const ssBarY = 100;
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(ssBarX - 40, ssBarY - 16, ssBarW + 80, ssBarH + 28, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffaa';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`🌠 SHOOTING STAR — ${Math.ceil(ssTimeLeft / 1000)}s`, camera.screenW / 2, ssBarY - 3);
      ctx.fillStyle = 'rgba(255,255,100,0.15)';
      ctx.beginPath();
      ctx.roundRect(ssBarX, ssBarY + 2, ssBarW, ssBarH, 4);
      ctx.fill();
      ctx.fillStyle = ssFrac > 0.4 ? '#ffffaa' : (ssFrac > 0.2 ? '#ffcc44' : '#ff8833');
      ctx.beginPath();
      ctx.roundRect(ssBarX, ssBarY + 2, ssBarW * ssFrac, ssBarH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Direction arrow if landing site is off-screen
      if (!ssOnScreen) {
        const angle = Math.atan2(ssy - camera.screenH / 2, ssx - camera.screenW / 2);
        const arrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 55;
        const ax = camera.screenW / 2 + Math.cos(angle) * arrowDist;
        const ay = camera.screenH / 2 + Math.sin(angle) * arrowDist;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.85 * ssPulse;
        ctx.fillStyle = '#ffffaa';
        ctx.strokeStyle = '#664400';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#332200';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌠', 4, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    // === HANAMI LANTERN — countdown bar + direction arrow when off-screen ===
    const _lanternHud = window._hanamiLanternData || (gameState.self && gameState.self.hanamiLantern);
    if (_lanternHud) {
      const elapsed_l = (now - _lanternHud.spawnedAt) / 1000;
      const curLY = _lanternHud.baseY - Math.min(elapsed_l * 7, 180);
      const curLX = _lanternHud.x + Math.sin(elapsed_l * 0.6 + (_lanternHud.floatPhase || 0)) * 20;
      const lsx = curLX - camera.x + camera.screenW / 2;
      const lsy = curLY - camera.y + camera.screenH / 2;
      const lTimeLeft = Math.max(0, (_lanternHud.expiresAt || (_lanternHud.spawnedAt + 90000)) - now);
      const lOnScreen = lsx > 40 && lsx < camera.screenW - 40 && lsy > 40 && lsy < camera.screenH - 40;
      const lFrac = lTimeLeft / 90000;
      const lPulse = 0.7 + 0.3 * Math.sin(now * 0.006);
      // HUD countdown bar
      const lBarW = 160, lBarH = 12;
      const lBarX = camera.screenW / 2 - lBarW / 2;
      const lBarY = 116; // below shooting star bar
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(lBarX - 40, lBarY - 16, lBarW + 80, lBarH + 28, 8);
      ctx.fill();
      ctx.fillStyle = '#ffcc88';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`🏮 HANAMI LANTERN — ${Math.ceil(lTimeLeft / 1000)}s`, camera.screenW / 2, lBarY - 3);
      ctx.fillStyle = 'rgba(255,153,60,0.18)';
      ctx.beginPath();
      ctx.roundRect(lBarX, lBarY + 2, lBarW, lBarH, 4);
      ctx.fill();
      ctx.fillStyle = lFrac > 0.4 ? '#ffcc66' : (lFrac > 0.2 ? '#ff9933' : '#ff4400');
      ctx.beginPath();
      ctx.roundRect(lBarX, lBarY + 2, lBarW * lFrac, lBarH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Direction arrow if lantern is off-screen
      if (!lOnScreen) {
        const angle = Math.atan2(lsy - camera.screenH / 2, lsx - camera.screenW / 2);
        const arrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 55;
        const ax = camera.screenW / 2 + Math.cos(angle) * arrowDist;
        const ay = camera.screenH / 2 + Math.sin(angle) * arrowDist;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.85 * lPulse;
        ctx.fillStyle = '#ffcc66';
        ctx.strokeStyle = '#883300';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#331100';
        ctx.fillText('🏮', 4, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    // === METEOR SHOWER — direction arrows for each unclaimed landing site ===
    if (window._meteorShowerData && window._meteorShowerData.length > 0) {
      for (const mStar of window._meteorShowerData) {
        const msTimeLeft = Math.max(0, mStar.expiresAt - now);
        if (msTimeLeft <= 0) continue;
        const msx = mStar.x - camera.x + camera.screenW / 2;
        const msy = mStar.y - camera.y + camera.screenH / 2;
        const msOnScreen = msx > 40 && msx < camera.screenW - 40 && msy > 40 && msy < camera.screenH - 40;
        const msPulse = 0.7 + 0.3 * Math.sin(now * 0.009 + mStar.id * 1.3);
        if (!msOnScreen) {
          const angle = Math.atan2(msy - camera.screenH / 2, msx - camera.screenW / 2);
          const arrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 55;
          const ax = camera.screenW / 2 + Math.cos(angle) * arrowDist;
          const ay = camera.screenH / 2 + Math.sin(angle) * arrowDist;
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(angle);
          ctx.globalAlpha = 0.85 * msPulse;
          ctx.fillStyle = '#ffeeaa';
          ctx.strokeStyle = '#664400';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(20, 0);
          ctx.lineTo(-10, -10);
          ctx.lineTo(-5, 0);
          ctx.lineTo(-10, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#332200';
          ctx.font = 'bold 9px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('☄️', 4, 0);
          ctx.restore();
        }
      }
    }

    // Bird Royale — compass arrow pointing to safe zone center when outside or near edge
    if (gameState.birdRoyale && gameState.birdRoyale.state === 'active' && gameState.self) {
      const ry = gameState.birdRoyale;
      const myStatus = ry.myStatus || 'spectator';
      if (myStatus === 'alive') {
        // Compute where zone center is on screen
        const zx = ry.centerX - camera.x + camera.screenW / 2;
        const zy = ry.centerY - camera.y + camera.screenH / 2;
        const dx = gameState.self.x - ry.centerX;
        const dy = gameState.self.y - ry.centerY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const outsideZone = distFromCenter > ry.currentRadius;
        const zoneOnScreen = zx > 80 && zx < camera.screenW - 80 && zy > 80 && zy < camera.screenH - 80;

        if (outsideZone || !zoneOnScreen) {
          // Point arrow toward zone center
          const angle = Math.atan2(zy - camera.screenH / 2, zx - camera.screenW / 2);
          const arrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
          const ax = camera.screenW / 2 + Math.cos(angle) * arrowDist;
          const ay = camera.screenH / 2 + Math.sin(angle) * arrowDist;
          const ryPulse = 0.6 + 0.4 * Math.sin(now * 0.008);
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(angle);
          ctx.globalAlpha = 0.9 * ryPulse;
          // Arrow body
          ctx.fillStyle = outsideZone ? '#ff2200' : '#ff8800';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(22, 0);
          ctx.lineTo(-10, -11);
          ctx.lineTo(-5, 0);
          ctx.lineTo(-10, 11);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // Arrow label
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚔️', 4, 0);
          ctx.restore();
        }
      }
    }

    // Pigeon Pied Piper — direction arrow + countdown bar
    if (gameState.self && gameState.self.piper) {
      const piper = gameState.self.piper;
      const pcx = piper.x - camera.x + camera.screenW / 2;
      const pcy = piper.y - camera.y + camera.screenH / 2;
      const pTimeLeft = Math.max(0, piper.endsAt - now);
      const pOnScreen = pcx > 20 && pcx < camera.screenW - 20 && pcy > 20 && pcy < camera.screenH - 20;
      // HUD countdown bar (above mystery crate zone — placed at y=110 to avoid clash)
      const pTotal = 90000;
      const pFrac = pTimeLeft / pTotal;
      const pBarW = 140, pBarH = 12;
      const pBarX = camera.screenW / 2 - pBarW / 2;
      const pBarY = 110;
      const pPulse = 0.7 + 0.3 * Math.sin(now * 0.007);
      const pHue = (now / 15) % 360;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(pBarX - 40, pBarY - 16, pBarW + 80, pBarH + 28, 8);
      ctx.fill();
      ctx.fillStyle = `hsl(${pHue}, 90%, 72%)`;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`🎵 PIED PIPER — POOP HIM! ${Math.ceil(pTimeLeft / 1000)}s`, camera.screenW / 2, pBarY - 3);
      // Bar background
      ctx.fillStyle = 'rgba(200,100,255,0.2)';
      ctx.beginPath();
      ctx.roundRect(pBarX, pBarY + 2, pBarW, pBarH, 4);
      ctx.fill();
      // Bar fill — rainbow gradient
      if (pFrac > 0) {
        const pBarGrad = ctx.createLinearGradient(pBarX, 0, pBarX + pBarW, 0);
        pBarGrad.addColorStop(0, '#ff44aa');
        pBarGrad.addColorStop(0.5, '#aa44ff');
        pBarGrad.addColorStop(1, '#44aaff');
        ctx.fillStyle = pFrac > 0.35 ? pBarGrad : '#ff3333';
        ctx.beginPath();
        ctx.roundRect(pBarX, pBarY + 2, pBarW * pFrac, pBarH, 4);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Direction arrow if off-screen
      if (!pOnScreen) {
        const pAngle = Math.atan2(pcy - camera.screenH / 2, pcx - camera.screenW / 2);
        const pArrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 50;
        const pAx = camera.screenW / 2 + Math.cos(pAngle) * pArrowDist;
        const pAy = camera.screenH / 2 + Math.sin(pAngle) * pArrowDist;
        ctx.save();
        ctx.translate(pAx, pAy);
        ctx.rotate(pAngle);
        ctx.globalAlpha = 0.85 * pPulse;
        const arrowHue2 = (now / 12) % 360;
        ctx.fillStyle = `hsl(${arrowHue2}, 90%, 65%)`;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎵', 4, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    // Bounty Hunter — direction arrow when targeting the player and off-screen
    if (gameState.bountyHunter && gameState.bountyHunter.isTargetingMe && gameState.bountyHunter.state === 'pursuing') {
      const bh = gameState.bountyHunter;
      const bhsx = bh.x - camera.x + camera.screenW / 2;
      const bhsy = bh.y - camera.y + camera.screenH / 2;
      const bhOnScreen = bhsx > 20 && bhsx < camera.screenW - 20 && bhsy > 20 && bhsy < camera.screenH - 20;
      if (!bhOnScreen) {
        const bhAngle = Math.atan2(bhsy - camera.screenH / 2, bhsx - camera.screenW / 2);
        const bhArrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 55;
        const bhAx = camera.screenW / 2 + Math.cos(bhAngle) * bhArrowDist;
        const bhAy = camera.screenH / 2 + Math.sin(bhAngle) * bhArrowDist;
        const bhPulse = 0.7 + 0.3 * Math.sin(now * 0.006);
        ctx.save();
        ctx.translate(bhAx, bhAy);
        ctx.rotate(bhAngle);
        ctx.globalAlpha = bhPulse;
        ctx.fillStyle = '#cc1100';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔫', 4, 0);
        ctx.restore();
      }
    }

    // Police Helicopter — direction arrow when targeting the player and off-screen
    if (gameState.policeHelicopter && gameState.policeHelicopter.isTargetingMe && gameState.policeHelicopter.state === 'pursuing') {
      const heli = gameState.policeHelicopter;
      const hsx2 = heli.x - camera.x + camera.screenW / 2;
      const hsy2 = heli.y - camera.y + camera.screenH / 2;
      const heliOnScreen = hsx2 > 20 && hsx2 < camera.screenW - 20 && hsy2 > 20 && hsy2 < camera.screenH - 20;
      if (!heliOnScreen) {
        const heliAngle = Math.atan2(hsy2 - camera.screenH / 2, hsx2 - camera.screenW / 2);
        const heliArrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 55;
        const heliAx = camera.screenW / 2 + Math.cos(heliAngle) * heliArrowDist;
        const heliAy = camera.screenH / 2 + Math.sin(heliAngle) * heliArrowDist;
        const heliPulse = 0.7 + 0.3 * Math.sin(now * 0.005);
        const sirenFlash = Math.floor(now / 200) % 2;
        ctx.save();
        ctx.translate(heliAx, heliAy);
        ctx.rotate(heliAngle);
        ctx.globalAlpha = heliPulse;
        ctx.fillStyle = sirenFlash === 0 ? '#2244ff' : '#ff2222';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚁', 4, 0);
        ctx.restore();
      }
    }

    // Cursed Coin — direction arrow and mini HUD bar when coin exists
    if (gameState.self && gameState.self.cursedCoin) {
      const cc = gameState.self.cursedCoin;
      const ccx = cc.x - camera.x + camera.screenW / 2;
      const ccy = cc.y - camera.y + camera.screenH / 2;
      const ccOnScreen = ccx > 20 && ccx < camera.screenW - 20 && ccy > 20 && ccy < camera.screenH - 20;
      const ccPulse = 0.6 + 0.4 * Math.sin(now * 0.006);
      // Direction arrow when off-screen
      if (!ccOnScreen) {
        const ccAngle = Math.atan2(ccy - camera.screenH / 2, ccx - camera.screenW / 2);
        const ccArrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 55;
        const ccAx = camera.screenW / 2 + Math.cos(ccAngle) * ccArrowDist;
        const ccAy = camera.screenH / 2 + Math.sin(ccAngle) * ccArrowDist;
        ctx.save();
        ctx.translate(ccAx, ccAy);
        ctx.rotate(ccAngle);
        ctx.globalAlpha = 0.85 * ccPulse;
        ctx.fillStyle = '#cc0033';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀', 4, 0);
        ctx.restore();
      }
    }

    // === GOLDEN THRONE — HUD countdown + direction arrow when off-screen ===
    if (gameState.self && gameState.self.goldenThrone) {
      const throne = gameState.self.goldenThrone;
      const tsx = throne.x - camera.x + camera.screenW / 2;
      const tsy = throne.y - camera.y + camera.screenH / 2;
      const throneTimeLeft = Math.max(0, throne.expiresAt - now);
      const throneOnScreen = tsx > 40 && tsx < camera.screenW - 40 && tsy > 40 && tsy < camera.screenH - 40;
      const throneFrac = throneTimeLeft / 180000; // 3 min max
      const throneUrgency = throneTimeLeft < 30000 ? 1 - throneTimeLeft / 30000 : 0;
      const thronePulse = 0.7 + 0.3 * Math.sin(now * 0.006);
      const urgFast = 0.5 + 0.5 * Math.sin(now * 0.012);

      // HUD countdown bar (stacks at top area)
      const tBarW = 200, tBarH = 12;
      const tBarX = camera.screenW / 2 - tBarW / 2;
      const tBarY = 118; // Below mystery crate bar
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(tBarX - 50, tBarY - 18, tBarW + 100, tBarH + 30, 8);
      ctx.fill();
      const throneBarColor = throneUrgency > 0.5 ? '#ff4400' : throneUrgency > 0 ? '#ff9900' : '#ffd700';
      ctx.fillStyle = throneBarColor;
      ctx.font = `bold 11px Arial`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.fillText(`👑 GOLDEN THRONE — ${Math.ceil(throneTimeLeft / 1000)}s · Fly there to CLAIM IT!`, camera.screenW / 2, tBarY - 3);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,215,0,0.18)';
      ctx.beginPath();
      ctx.roundRect(tBarX, tBarY + 2, tBarW, tBarH, 4);
      ctx.fill();
      ctx.fillStyle = throneBarColor;
      ctx.beginPath();
      ctx.roundRect(tBarX, tBarY + 2, tBarW * throneFrac, tBarH, 4);
      ctx.fill();
      // Claim progress sub-bar if actively claiming
      if (throne.isClaiming && throne.claimProgress > 0) {
        ctx.fillStyle = 'rgba(255,255,100,0.25)';
        ctx.beginPath();
        ctx.roundRect(tBarX, tBarY + 2, tBarW, tBarH, 4);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,80,${0.8 + 0.2 * urgFast})`;
        ctx.beginPath();
        ctx.roundRect(tBarX, tBarY + 2, tBarW * throne.claimProgress, tBarH, 4);
        ctx.fill();
        ctx.fillStyle = '#ffff44';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`CLAIMING ${Math.floor(throne.claimProgress * 100)}%`, camera.screenW / 2, tBarY + tBarH + 14);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Direction arrow if throne is off-screen
      if (!throneOnScreen) {
        const angle = Math.atan2(tsy - camera.screenH / 2, tsx - camera.screenW / 2);
        const arrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 55;
        const ax = camera.screenW / 2 + Math.cos(angle) * arrowDist;
        const ay = camera.screenH / 2 + Math.sin(angle) * arrowDist;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.9 * thronePulse;
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-12, -11);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-12, 11);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👑', 4, 0);
        ctx.restore();
      }
    }

    // === GOLDEN RAMPAGE — off-screen direction arrow pointing toward the Golden Bird ===
    if (gameState.goldenRampage && gameState.goldenRampage.goldenBirdX !== undefined) {
      const gbsx = gameState.goldenRampage.goldenBirdX - camera.x + camera.screenW / 2;
      const gbsy = gameState.goldenRampage.goldenBirdY - camera.y + camera.screenH / 2;
      const gbOnScreen = gbsx > 50 && gbsx < camera.screenW - 50 && gbsy > 50 && gbsy < camera.screenH - 50;
      if (!gbOnScreen) {
        const gbAngle = Math.atan2(gbsy - camera.screenH / 2, gbsx - camera.screenW / 2);
        const gbArrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
        const gbAx = camera.screenW / 2 + Math.cos(gbAngle) * gbArrowDist;
        const gbAy = camera.screenH / 2 + Math.sin(gbAngle) * gbArrowDist;
        const gbPulse = 0.7 + 0.3 * Math.sin(now * 0.007);
        ctx.save();
        ctx.translate(gbAx, gbAy);
        ctx.rotate(gbAngle);
        ctx.globalAlpha = 0.9 * gbPulse;
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👑', 4, 0);
        ctx.restore();
      }
    }

    // === BOWLING BIRD — off-screen direction arrow ===
    if (gameState.bowlingBall && gameState.bowlingBall.bbX !== undefined) {
      const bbsx = gameState.bowlingBall.bbX - camera.x + camera.screenW / 2;
      const bbsy = gameState.bowlingBall.bbY - camera.y + camera.screenH / 2;
      const bbOnScreen = bbsx > 50 && bbsx < camera.screenW - 50 && bbsy > 50 && bbsy < camera.screenH - 50;
      if (!bbOnScreen) {
        const bbAngle = Math.atan2(bbsy - camera.screenH / 2, bbsx - camera.screenW / 2);
        const bbArrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
        const bbAx = camera.screenW / 2 + Math.cos(bbAngle) * bbArrowDist;
        const bbAy = camera.screenH / 2 + Math.sin(bbAngle) * bbArrowDist;
        const bbPulse = 0.7 + 0.3 * Math.sin(now * 0.009);
        ctx.save();
        ctx.translate(bbAx, bbAy);
        ctx.rotate(bbAngle);
        ctx.globalAlpha = 0.9 * bbPulse;
        ctx.fillStyle = '#e06000';
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎳', 4, 0);
        ctx.restore();
      }
    }

    // === SKY PIRATE AIRSHIP — off-screen direction arrow ===
    if (gameState.skyPirateShip && !gameState.skyPirateShip.sinking) {
      const spsx2 = gameState.skyPirateShip.x - camera.x + camera.screenW / 2;
      const spsy2 = gameState.skyPirateShip.y - camera.y + camera.screenH / 2;
      const spOnScreen = spsx2 > 60 && spsx2 < camera.screenW - 60 && spsy2 > 60 && spsy2 < camera.screenH - 60;
      if (!spOnScreen) {
        const spAngle = Math.atan2(spsy2 - camera.screenH / 2, spsx2 - camera.screenW / 2);
        const spArrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
        const spAx = camera.screenW / 2 + Math.cos(spAngle) * spArrowDist;
        const spAy = camera.screenH / 2 + Math.sin(spAngle) * spArrowDist;
        const spPulse = 0.7 + 0.3 * Math.sin(now * 0.007);
        ctx.save();
        ctx.translate(spAx, spAy);
        ctx.rotate(spAngle);
        ctx.globalAlpha = 0.9 * spPulse;
        ctx.fillStyle = '#cc2222';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏴‍☠️', 4, 0);
        ctx.restore();
      }
    }

    // Ice Rink — direction arrow when off-screen (during blizzard)
    if (gameState.iceRink && selfBird && weatherState && weatherState.type === 'blizzard') {
      const irsx = gameState.iceRink.x - camera.x + camera.screenW / 2;
      const irsy = gameState.iceRink.y - camera.y + camera.screenH / 2;
      const irOnScreen = irsx > 40 && irsx < camera.screenW - 40 && irsy > 40 && irsy < camera.screenH - 40;
      if (!irOnScreen) {
        const irAngle = Math.atan2(irsy - camera.screenH / 2, irsx - camera.screenW / 2);
        const irArrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
        const irAx = camera.screenW / 2 + Math.cos(irAngle) * irArrowDist;
        const irAy = camera.screenH / 2 + Math.sin(irAngle) * irArrowDist;
        const irPulse = 0.65 + 0.35 * Math.sin(now * 0.005);
        ctx.save();
        ctx.translate(irAx, irAy);
        ctx.rotate(irAngle);
        ctx.globalAlpha = 0.85 * irPulse;
        ctx.fillStyle = '#88ddff';
        ctx.strokeStyle = '#224';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-9, -9);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-9, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⛸️', 3, 0);
        ctx.restore();
      }
    }

    // === SUSPICIOUS PACKAGE — off-screen direction arrow ===
    if (gameState.suspiciousPackage) {
      const pkg = gameState.suspiciousPackage;
      const pkgsx = pkg.x - camera.x + camera.screenW / 2;
      const pkgsy = pkg.y - camera.y + camera.screenH / 2;
      const pkgOnScreen = pkgsx > 50 && pkgsx < camera.screenW - 50 && pkgsy > 50 && pkgsy < camera.screenH - 50;
      if (!pkgOnScreen) {
        const pkgAngle = Math.atan2(pkgsy - camera.screenH / 2, pkgsx - camera.screenW / 2);
        const pkgArrowDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
        const pkgAx = camera.screenW / 2 + Math.cos(pkgAngle) * pkgArrowDist;
        const pkgAy = camera.screenH / 2 + Math.sin(pkgAngle) * pkgArrowDist;
        const pkgUrgencyFrac = 1 - Math.max(0, pkg.timeLeft / (pkg.maxTime || 90000));
        const pkgPulse = 0.7 + 0.3 * Math.sin(now * (0.006 + pkgUrgencyFrac * 0.016));
        ctx.save();
        ctx.translate(pkgAx, pkgAy);
        ctx.rotate(pkgAngle);
        ctx.globalAlpha = 0.9 * pkgPulse;
        ctx.fillStyle = pkgUrgencyFrac > 0.7 ? '#ff2200' : '#ff6600';
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 10 + pkgUrgencyFrac * 8;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uD83D\uDCA3', 4, 0);
        ctx.restore();
      }
    }

    // === PIGEON COUPE — off-screen direction arrow + minimap dot ===
    if (gameState.pigeonCoupe) {
      const pc = gameState.pigeonCoupe;
      const pcsx = pc.x - camera.x + camera.screenW / 2;
      const pcsy = pc.y - camera.y + camera.screenH / 2;
      const pcOnScreen = pcsx > 50 && pcsx < camera.screenW - 50 && pcsy > 50 && pcsy < camera.screenH - 50;
      if (!pcOnScreen) {
        const pcAngle = Math.atan2(pcsy - camera.screenH / 2, pcsx - camera.screenW / 2);
        const pcArrDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
        const pcAx = camera.screenW / 2 + Math.cos(pcAngle) * pcArrDist;
        const pcAy = camera.screenH / 2 + Math.sin(pcAngle) * pcArrDist;
        const pcPulse = 0.7 + 0.3 * Math.sin(now * 0.006);
        ctx.save();
        ctx.translate(pcAx, pcAy);
        ctx.rotate(pcAngle);
        ctx.globalAlpha = 0.9 * pcPulse;
        ctx.fillStyle = pc.driverId ? '#ff4400' : '#ff9900';
        ctx.shadowColor = pc.driverId ? '#ff2200' : '#ff6600';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uD83D\uDE97', 4, 0);
        ctx.restore();
      }
    }

    // === BIRDNAPPER VAN — off-screen direction arrow ===
    if (gameState.birdnapperVan) {
      const bv = gameState.birdnapperVan;
      const bvsx = bv.x - camera.x + camera.screenW / 2;
      const bvsy = bv.y - camera.y + camera.screenH / 2;
      const bvOnScreen = bvsx > 50 && bvsx < camera.screenW - 50 && bvsy > 50 && bvsy < camera.screenH - 50;
      // Show arrow if off-screen, OR if it's hunting/escaping us (always want to know where it is)
      const bvUrgent = bv.isHuntTarget || bv.isCaptive;
      if (!bvOnScreen || bvUrgent) {
        const bvAngle = Math.atan2(bvsy - camera.screenH / 2, bvsx - camera.screenW / 2);
        const bvArrDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
        const bvAx = camera.screenW / 2 + Math.cos(bvAngle) * bvArrDist;
        const bvAy = camera.screenH / 2 + Math.sin(bvAngle) * bvArrDist;
        const bvFast = 0.5 + 0.5 * Math.sin(now * 0.015);
        const bvPulse = bvUrgent ? bvFast : 0.5 + 0.3 * Math.sin(now * 0.005);
        const bvColor = bv.state === 'escaping' ? '#ff2200' : bv.state === 'hunting' ? '#cc00ff' : '#660088';
        ctx.save();
        ctx.translate(bvAx, bvAy);
        ctx.rotate(bvAngle);
        ctx.globalAlpha = 0.9 * bvPulse;
        ctx.fillStyle = bvColor;
        ctx.shadowColor = bvColor;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚐', 4, 0);
        ctx.restore();
      }
    }

    // === COURIER PIGEON — off-screen direction arrow ===
    if (gameState.courierPigeon && window._courierPigeonDir) {
      const cp = gameState.courierPigeon;
      const cpsx = cp.x - camera.x + camera.screenW / 2;
      const cpsy = cp.y - camera.y + camera.screenH / 2;
      const cpOnScreen = cpsx > 50 && cpsx < camera.screenW - 50 && cpsy > 50 && cpsy < camera.screenH - 50;
      if (!cpOnScreen) {
        const cpAngle = Math.atan2(cpsy - camera.screenH / 2, cpsx - camera.screenW / 2);
        const cpArrDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
        const cpAx = camera.screenW / 2 + Math.cos(cpAngle) * cpArrDist;
        const cpAy = camera.screenH / 2 + Math.sin(cpAngle) * cpArrDist;
        const cpPulse = 0.7 + 0.3 * Math.sin(now * 0.006);
        ctx.save();
        ctx.translate(cpAx, cpAy);
        ctx.rotate(cpAngle);
        ctx.globalAlpha = 0.9 * cpPulse;
        ctx.fillStyle = '#e8c060';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📬', 4, 0);
        ctx.restore();
      }
    }

    // === HOT DOG CART — off-screen direction arrow ===
    if (gameState.hotDogCart) {
      const hdc = gameState.hotDogCart;
      const hdcsx = hdc.x - camera.x + camera.screenW / 2;
      const hdcsy = hdc.y - camera.y + camera.screenH / 2;
      const hdcOnScreen = hdcsx > 50 && hdcsx < camera.screenW - 50 && hdcsy > 50 && hdcsy < camera.screenH - 50;
      if (!hdcOnScreen) {
        const hdcAngle = Math.atan2(hdcsy - camera.screenH / 2, hdcsx - camera.screenW / 2);
        const hdcArrDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
        const hdcAx = camera.screenW / 2 + Math.cos(hdcAngle) * hdcArrDist;
        const hdcAy = camera.screenH / 2 + Math.sin(hdcAngle) * hdcArrDist;
        const hdcPulse = 0.7 + 0.3 * Math.sin(now * 0.007);
        ctx.save();
        ctx.translate(hdcAx, hdcAy);
        ctx.rotate(hdcAngle);
        ctx.globalAlpha = 0.9 * hdcPulse;
        ctx.fillStyle = '#ff8800';
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0); ctx.lineTo(-10, -10); ctx.lineTo(-5, 0); ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌭', 4, 0);
        ctx.restore();
      }
    }

    // === RIVAL BIRD — off-screen direction arrow ===
    if (gameState.rivalBird) {
      const rb = gameState.rivalBird;
      const rbsx = rb.x - camera.x + camera.screenW / 2;
      const rbsy = rb.y - camera.y + camera.screenH / 2;
      const rbOnScreen = rbsx > 50 && rbsx < camera.screenW - 50 && rbsy > 50 && rbsy < camera.screenH - 50;
      if (!rbOnScreen) {
        const rbAngle = Math.atan2(rbsy - camera.screenH / 2, rbsx - camera.screenW / 2);
        const rbArrDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
        const rbAx = camera.screenW / 2 + Math.cos(rbAngle) * rbArrDist;
        const rbAy = camera.screenH / 2 + Math.sin(rbAngle) * rbArrDist;
        const rbPulse = 0.7 + 0.3 * Math.sin(now * 0.009);
        ctx.save();
        ctx.translate(rbAx, rbAy);
        ctx.rotate(rbAngle);
        ctx.globalAlpha = 0.9 * rbPulse;
        ctx.fillStyle = '#cc1a1a';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0); ctx.lineTo(-10, -10); ctx.lineTo(-5, 0); ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔴', 4, 0);
        ctx.restore();
      }
    }

    // === THE MOLE — off-screen arrow pointing at the revealed mole during MOLE ALERT ===
    const _moleAlertData = gameState.self && gameState.self.mole;
    if (_moleAlertData && _moleAlertData.revealed && _moleAlertData.moleId && gameState.birds) {
      const moleBirdPos = gameState.birds.find(b => b.id === _moleAlertData.moleId);
      if (moleBirdPos) {
        const msx = moleBirdPos.x - camera.x + camera.screenW / 2;
        const msy = moleBirdPos.y - camera.y + camera.screenH / 2;
        const mOnScreen = msx > 50 && msx < camera.screenW - 50 && msy > 50 && msy < camera.screenH - 50;
        if (!mOnScreen) {
          const mAngle = Math.atan2(msy - camera.screenH / 2, msx - camera.screenW / 2);
          const mArrDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
          const mAx = camera.screenW / 2 + Math.cos(mAngle) * mArrDist;
          const mAy = camera.screenH / 2 + Math.sin(mAngle) * mArrDist;
          const mPulse = 0.7 + 0.3 * Math.sin(now * 0.009);
          ctx.save();
          ctx.translate(mAx, mAy);
          ctx.rotate(mAngle);
          ctx.globalAlpha = 0.9 * mPulse;
          ctx.fillStyle = '#8800cc';
          ctx.shadowColor = '#cc44ff';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(22, 0); ctx.lineTo(-10, -10); ctx.lineTo(-5, 0); ctx.lineTo(-10, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.font = 'bold 11px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🕵️', 4, 0);
          ctx.restore();
        }
      }
    }

    // === GOLDEN PERCH — off-screen direction arrow ===
    const _gpData = gameState.self && gameState.self.goldenPerch;
    if (_gpData && window._goldenPerchDir) {
      const gpsx = _gpData.x - camera.x + camera.screenW / 2;
      const gpsy = _gpData.y - camera.y + camera.screenH / 2;
      const gpOnScreen = gpsx > 50 && gpsx < camera.screenW - 50 && gpsy > 50 && gpsy < camera.screenH - 50;
      if (!gpOnScreen) {
        const gpAngle = Math.atan2(gpsy - camera.screenH / 2, gpsx - camera.screenW / 2);
        const gpArrDist = Math.min(camera.screenW, camera.screenH) / 2 - 60;
        const gpAx = camera.screenW / 2 + Math.cos(gpAngle) * gpArrDist;
        const gpAy = camera.screenH / 2 + Math.sin(gpAngle) * gpArrDist;
        const gpPulse = 0.7 + 0.3 * Math.sin(now * 0.005);
        ctx.save();
        ctx.translate(gpAx, gpAy);
        ctx.rotate(gpAngle);
        ctx.globalAlpha = 0.9 * gpPulse;
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏅', 4, 0);
        ctx.restore();
      }
    }

    // Announcements (screen-space)
    drawAnnouncements(ctx, now);

    // Event timer
    if (gameState.activeEvent) {
      drawEventTimer(ctx, gameState.activeEvent);
    }

    // HUD
    updateHUD();
    updateEventFeed();
    updateArenaUI();
    updateFoodTruckHeistUI();
    updateBankHeistUI();
    updateMuralUI(now);
    updateSprayUI(now);
    updateRadioTowerUI(now);
    updateRaceUI();
    updateRaceBettingPanel();
    updateWeatherBetPanel(now);
    updateTournamentBetPanel();
    updateSewerUI(now);

    // Minimap (now includes activeEvent and cat)
    Renderer.drawMinimap(minimapCtx, worldData, gameState.birds, selfBird, gameState.activeEvent, gameState.cat, gameState.janitor, gameState.territories, gameState.bankHeist, gameState.graffiti);

    // Gang murals on minimap — colored dots for completed murals + neutral dots for zones
    if (worldData && gameState.muralZones) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      Renderer.drawMuralsOnMinimap(minimapCtx, gameState.muralZones, gameState.murals, gameState.muralPainting, mw, mh, worldData.width, worldData.height);
    }

    // Don Featherstone on minimap — permanent gold 🎩 dot
    if (worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const DON_WORLD_X = 1300, DON_WORLD_Y = 2380;
      const dmx = DON_WORLD_X * mw / worldData.width;
      const dmy = DON_WORLD_Y * mh / worldData.height;
      minimapCtx.fillStyle = '#ffd700';
      minimapCtx.beginPath();
      minimapCtx.arc(dmx, dmy, 3, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.font = 'bold 7px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText('🎩', dmx, dmy - 4);
    }

    // Donut Shop on minimap — pink 🍩 dot, color changes with cop state
    if (worldData && worldData.donutShopPos && gameState.donutCop) {
      Renderer.drawDonutShopOnMinimap(minimapCtx, worldData.donutShopPos, gameState.donutCop.state, worldData.width, worldData.height);
    }

    // Vending Machines on minimap
    if (worldData && worldData.vendingMachines) {
      Renderer.drawVendingMachinesOnMinimap(minimapCtx, worldData.vendingMachines, worldData.width, worldData.height);
    }

    // Owl Enforcer on minimap — cyan 🦉 dot when active at night
    if (worldData && gameState.owlEnforcer) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const owl = gameState.owlEnforcer;
      const omx = owl.x * mw / worldData.width;
      const omy = owl.y * mh / worldData.height;
      const owlPulse = 0.6 + 0.4 * Math.sin(performance.now() * (owl.state === 'chasing' ? 0.01 : 0.003));
      minimapCtx.fillStyle = owl.state === 'chasing' ? `rgba(255, 120, 0, ${owlPulse})` : `rgba(0, 255, 200, ${owlPulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(omx, omy, 3.5, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.font = 'bold 7px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText('🦉', omx, omy - 4);
    }

    // Race checkpoints on minimap
    if (worldData && worldData.raceCheckpoints) {
      Renderer.drawRaceOnMinimap(minimapCtx, worldData, worldData.raceCheckpoints, gameState.pigeonRace || null);
    }

    // Race boost gates on minimap (shown during active races)
    if (worldData && worldData.raceBoostGates && gameState.pigeonRace) {
      const raceActive = ['open', 'countdown', 'racing'].includes(gameState.pigeonRace.state);
      Renderer.drawBoostGatesOnMinimap(minimapCtx, worldData, worldData.raceBoostGates, raceActive, now);
    }

    // Manholes on minimap
    if (worldData && worldData.manholes) {
      Renderer.drawManholesOnMinimap(minimapCtx, worldData, worldData.manholes, gameState.self && gameState.self.inSewer);
    }

    // Lunar Lens: reveal all sewer loot caches on minimap even when above ground
    const now_mm = Date.now();
    if (gameState.self && gameState.self.lunarLensUntil > now_mm && gameState.sewerLoot && gameState.sewerLoot.length > 0) {
      for (const loot of gameState.sewerLoot) {
        const mx = (loot.x / worldData.WORLD_WIDTH) * minimapCanvas.width;
        const my = (loot.y / worldData.WORLD_HEIGHT) * minimapCanvas.height;
        // Pulsing cyan dot with coin amount label
        const pulse = 0.6 + 0.4 * Math.sin(now_mm * 0.005 + loot.x * 0.01);
        minimapCtx.globalAlpha = pulse;
        minimapCtx.fillStyle = '#44eedd';
        minimapCtx.beginPath();
        minimapCtx.arc(mx, my, 3.5, 0, Math.PI * 2);
        minimapCtx.fill();
        // Tiny glow ring
        minimapCtx.globalAlpha = pulse * 0.3;
        minimapCtx.strokeStyle = '#88ffee';
        minimapCtx.lineWidth = 1.5;
        minimapCtx.beginPath();
        minimapCtx.arc(mx, my, 5.5, 0, Math.PI * 2);
        minimapCtx.stroke();
        minimapCtx.globalAlpha = 1;
      }
    }

    // Rat King minimap indicator — pulsing purple crown for underground birds
    if (gameState.self && gameState.self.inSewer && gameState.ratKing) {
      const rkMx = (gameState.ratKing.x / worldData.WORLD_WIDTH) * minimapCanvas.width;
      const rkMy = (gameState.ratKing.y / worldData.WORLD_HEIGHT) * minimapCanvas.height;
      const rkPulse = 0.6 + 0.4 * Math.sin(now_mm * 0.005);
      minimapCtx.globalAlpha = rkPulse;
      minimapCtx.fillStyle = '#cc44ff';
      minimapCtx.shadowColor = '#aa00ff';
      minimapCtx.shadowBlur = 6;
      minimapCtx.beginPath();
      minimapCtx.arc(rkMx, rkMy, 5, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      // Crown label
      minimapCtx.globalAlpha = rkPulse * 0.9;
      minimapCtx.font = '8px serif';
      minimapCtx.fillStyle = '#ffccff';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText('👑', rkMx, rkMy - 6);
      minimapCtx.globalAlpha = 1;
    }

    // Golden egg scramble on minimap
    if (gameState.eggScramble || gameState.eggNestZones) {
      Renderer.drawEggScrambleOnMinimap(minimapCtx, worldData, gameState.eggScramble || null, gameState.eggNestZones || null);
    }

    // Territory predators on minimap
    if (worldData && worldData.predatorTerritories) {
      Renderer.drawPredatorTerritoriesOnMinimap(minimapCtx, worldData, gameState.territoryPredators || null);
    }

    // Casino on minimap
    if (worldData && worldData.casinoPos) {
      Renderer.drawCasinoOnMinimap(minimapCtx, worldData, gameState.slotsJackpot || 500);
    }

    // Tattoo Parlor on minimap
    if (worldData && worldData.tattooParlor) {
      Renderer.drawTattooParlourOnMinimap(minimapCtx, worldData);
    }

    // City Hall on minimap
    if (worldData && worldData.cityHallPos) {
      const poolAmount = (gameState.dethronementPool && gameState.dethronementPool.total) || 0;
      Renderer.drawCityHallOnMinimap(minimapCtx, worldData, poolAmount);
    }

    // Hall of Legends on minimap
    if (worldData && worldData.hallOfLegendsPos) {
      const legendsData = (gameState.self && gameState.self.hallOfLegends) || [];
      Renderer.drawHallOfLegendsOnMinimap(minimapCtx, worldData, worldData.hallOfLegendsPos, legendsData.length > 0, now);
    }

    // Bird City Idol stage on minimap
    if (worldData && worldData.idolStagePos) {
      const idolSt = gameState.self && gameState.self.birdIdol;
      Renderer.drawIdolStageOnMinimap(minimapCtx, worldData, worldData.idolStagePos, idolSt, now);
    }

    // Gang Nests on minimap
    if (gameState.gangNests && gameState.gangNests.length > 0 && worldData) {
      const selfGangId = gameState.self && gameState.self.gangId;
      Renderer.drawGangNestsOnMinimap(minimapCtx, worldData, gameState.gangNests, selfGangId, now);
    }
    // Active Sieges on minimap — red pulsing ring around besieged nest
    if (gameState.activeSieges && gameState.activeSieges.length > 0 && worldData) {
      const mmw = minimapCtx.canvas.width;
      const mmh = minimapCtx.canvas.height;
      const msx = mmw / worldData.width;
      const msy = mmh / worldData.height;
      const mt = now / 1000;
      for (const siege of gameState.activeSieges) {
        const mx = siege.nestX * msx;
        const my = siege.nestY * msy;
        const pulse = 0.5 + 0.5 * Math.sin(mt * 5);
        minimapCtx.save();
        minimapCtx.globalAlpha = 0.7 + 0.3 * pulse;
        minimapCtx.beginPath();
        minimapCtx.arc(mx, my, 5 + 3 * pulse, 0, Math.PI * 2);
        minimapCtx.strokeStyle = '#ff3300';
        minimapCtx.lineWidth = 2;
        minimapCtx.stroke();
        minimapCtx.fillStyle = 'rgba(255,50,0,0.4)';
        minimapCtx.fill();
        minimapCtx.font = 'bold 7px Arial';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillStyle = '#ffaa00';
        minimapCtx.fillText('⚔️', mx, my + 3);
        minimapCtx.restore();
      }
    }

    // Mystery Crate on minimap
    if (gameState.self && gameState.self.mysteryCrate && worldData) {
      Renderer.drawMysteryCrateOnMinimap(minimapCtx, worldData, gameState.self.mysteryCrate, now);
    }

    // Shooting Star landing site on minimap — pulsing gold star dot
    if (gameState.self && gameState.self.shootingStar && worldData) {
      const ss = gameState.self.shootingStar;
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const px = ss.x * mw / worldData.width;
      const py = ss.y * mh / worldData.height;
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(now * 0.008));
      minimapCtx.save();
      minimapCtx.shadowColor = '#ffffaa';
      minimapCtx.shadowBlur = 8 + 4 * pulse;
      minimapCtx.fillStyle = `rgba(255, 255, 150, ${0.7 + 0.3 * pulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(px, py, 4 + pulse * 2, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      minimapCtx.font = '8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText('🌠', px, py - 5);
      minimapCtx.restore();
    }

    // Meteor Shower landing sites on minimap — pulsing amber dots
    if (window._meteorShowerData && window._meteorShowerData.length > 0 && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      for (const mStar of window._meteorShowerData) {
        if (mStar.expiresAt <= now) continue;
        const mpx = mStar.x * mw / worldData.width;
        const mpy = mStar.y * mh / worldData.height;
        const mPulse = 0.4 + 0.6 * Math.abs(Math.sin(now * 0.009 + mStar.id * 1.1));
        minimapCtx.save();
        minimapCtx.shadowColor = '#ffeeaa';
        minimapCtx.shadowBlur = 6 + 3 * mPulse;
        minimapCtx.fillStyle = `rgba(255, 230, 120, ${0.6 + 0.35 * mPulse})`;
        minimapCtx.beginPath();
        minimapCtx.arc(mpx, mpy, 3 + mPulse * 1.5, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.shadowBlur = 0;
        minimapCtx.font = '7px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillText('☄️', mpx, mpy - 4);
        minimapCtx.restore();
      }
    }

    // Cherry blossom trees on minimap — pink dots during spring
    if (gameState.cherryBlossoms && worldData) {
      Renderer.drawCherryBlossomTreesOnMinimap(minimapCtx, worldData.width, worldData.height);
    }

    // Hanami Lantern on minimap — pulsing warm orange lantern emoji
    const _minimapLantern = window._hanamiLanternData || (gameState.self && gameState.self.hanamiLantern);
    if (_minimapLantern && worldData) {
      const worldDataMM = { minimapW: minimapCtx.canvas.width, minimapH: minimapCtx.canvas.height, worldWidth: worldData.width, worldHeight: worldData.height };
      Renderer.drawHanamiLanternOnMinimap(minimapCtx, worldDataMM, _minimapLantern, now);
    }

    // Pied Piper on minimap — rainbow pulsing dot
    if (gameState.self && gameState.self.piper && worldData) {
      Renderer.drawPiperOnMinimap(minimapCtx, worldData, gameState.self.piper, now);
    }

    // Cursed Coin on minimap — pulsing red skull (visible even when held by another bird)
    if (gameState.self && gameState.self.cursedCoin && worldData) {
      Renderer.drawCursedCoinOnMinimap(minimapCtx, worldData, gameState.self.cursedCoin, now);
    }

    // Tornado on minimap — pulsing purple 🌪️ dot tracking the vortex position
    if (gameState.weather && gameState.weather.type === 'tornado' &&
        gameState.weather.tornadoX !== undefined && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const tmx = gameState.weather.tornadoX * mw / worldData.width;
      const tmy = gameState.weather.tornadoY * mh / worldData.height;
      const pulse = 0.55 + 0.45 * Math.sin(now * 0.012);
      minimapCtx.fillStyle = `rgba(180, 80, 255, ${0.7 + 0.3 * pulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(tmx, tmy, 5 + pulse * 2, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.font = '9px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText('🌪️', tmx, tmy - 7);
    }

    // Seagull Invasion on minimap — white/blue pulsing dots showing raider positions
    if (gameState.seagullInvasion && gameState.seagullInvasion.seagulls && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const sgPulse = 0.6 + 0.4 * Math.sin(now * 0.009);
      for (const sg of gameState.seagullInvasion.seagulls) {
        const smx = sg.x * mw / worldData.width;
        const smy = sg.y * mh / worldData.height;
        // White for swooping, orange for carrying (thieves!)
        minimapCtx.fillStyle = sg.state === 'carrying'
          ? `rgba(255,140,40,${0.7 + 0.3 * sgPulse})`
          : `rgba(180,220,255,${0.6 + 0.4 * sgPulse})`;
        minimapCtx.beginPath();
        minimapCtx.arc(smx, smy, 2.5 + sgPulse, 0, Math.PI * 2);
        minimapCtx.fill();
      }
      // Seagull count label at top-left of minimap
      minimapCtx.fillStyle = '#66ccff';
      minimapCtx.font = 'bold 7px monospace';
      minimapCtx.textAlign = 'left';
      minimapCtx.fillText(`🐦 ${gameState.seagullInvasion.aliveCount}/${gameState.seagullInvasion.totalCount}`, 3, mh - 3);
    }

    // Pigeon Stampede on minimap — warm orange-brown swarming dots
    if (gameState.stampede && gameState.stampede.birds && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const stPulse = 0.5 + 0.5 * Math.sin(now * 0.01);
      for (const sb of gameState.stampede.birds) {
        const sbmx = sb.x * mw / worldData.width;
        const sbmy = sb.y * mh / worldData.height;
        minimapCtx.fillStyle = `rgba(220,140,50,${0.55 + 0.35 * stPulse})`;
        minimapCtx.beginPath();
        minimapCtx.arc(sbmx, sbmy, 2 + stPulse * 0.5, 0, Math.PI * 2);
        minimapCtx.fill();
      }
      minimapCtx.fillStyle = '#e09040';
      minimapCtx.font = 'bold 7px monospace';
      minimapCtx.textAlign = 'right';
      minimapCtx.fillText(`🐦 ${gameState.stampede.aliveCount}/${gameState.stampede.totalCount}`, mw - 3, mh - 3);
    }

    // Suspicious Package on minimap — pulsing red 💣 bomb dot
    if (gameState.suspiciousPackage && worldData) {
      const pkg = gameState.suspiciousPackage;
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const pmx = pkg.x * mw / worldData.width;
      const pmy = pkg.y * mh / worldData.height;
      const pkgUrgencyFrac = 1 - Math.max(0, pkg.timeLeft / (pkg.maxTime || 90000));
      const pkgPulse = 0.55 + 0.45 * Math.sin(now_mm * (0.006 + pkgUrgencyFrac * 0.018));
      minimapCtx.save();
      minimapCtx.shadowColor = '#ff3300';
      minimapCtx.shadowBlur = 8 + 5 * pkgPulse;
      minimapCtx.fillStyle = `rgba(255, ${Math.floor(80 - 60 * pkgUrgencyFrac)}, 0, ${0.8 + 0.2 * pkgPulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(pmx, pmy, 4 + pkgPulse * 2, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      minimapCtx.font = '8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText('\uD83D\uDCA3', pmx, pmy - 6);
      minimapCtx.restore();
    }

    // Blood Moon feral birds on minimap — pulsing red skull dots
    if (gameState.bloodMoon && gameState.bloodMoon.feralBirds && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const bmpulse = 0.5 + 0.5 * Math.sin(now * 0.004);
      for (const feral of gameState.bloodMoon.feralBirds) {
        const fmx = feral.x * mw / worldData.width;
        const fmy = feral.y * mh / worldData.height;
        minimapCtx.save();
        minimapCtx.shadowColor = '#ff0000';
        minimapCtx.shadowBlur = 5 + 3 * bmpulse;
        minimapCtx.fillStyle = `rgba(220, ${Math.floor(20 + 30 * bmpulse)}, 20, ${0.7 + 0.3 * bmpulse})`;
        minimapCtx.beginPath();
        minimapCtx.arc(fmx, fmy, 2.5 + bmpulse, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.shadowBlur = 0;
        minimapCtx.restore();
      }
    }

    // Great Migration on minimap — white flock birds + pulsing gold alpha dot
    if (gameState.migration && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const migPulse = 0.6 + 0.4 * Math.sin(now * 0.008);
      if (gameState.migration.birds) {
        for (const mb of gameState.migration.birds) {
          const mmx = mb.x * mw / worldData.width;
          const mmy = mb.y * mh / worldData.height;
          minimapCtx.fillStyle = `rgba(200,220,255,${0.5 + 0.3 * migPulse})`;
          minimapCtx.beginPath();
          minimapCtx.arc(mmx, mmy, 2, 0, Math.PI * 2);
          minimapCtx.fill();
        }
      }
      if (gameState.migration.alpha && gameState.migration.alpha.hp > 0) {
        const amx = gameState.migration.alpha.x * mw / worldData.width;
        const amy = gameState.migration.alpha.y * mh / worldData.height;
        minimapCtx.save();
        minimapCtx.shadowColor = '#f5af32';
        minimapCtx.shadowBlur = 8 + 4 * migPulse;
        minimapCtx.fillStyle = `rgba(245,175,50,${0.8 + 0.2 * migPulse})`;
        minimapCtx.beginPath();
        minimapCtx.arc(amx, amy, 4 + migPulse, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.shadowBlur = 0;
        minimapCtx.font = '8px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillText('🦅', amx, amy - 6);
        minimapCtx.restore();
      }
    }

    // Vault Truck gold pulsing dot on minimap
    if (gameState.vaultTruck && !gameState.vaultTruck.cracked && !gameState.vaultTruck.escaped && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const vtPulse = 0.5 + 0.5 * Math.sin(now * 0.008);
      const vtmx = gameState.vaultTruck.x * msx;
      const vtmy = gameState.vaultTruck.y * msy;
      minimapCtx.save();
      minimapCtx.shadowColor = '#ffd700';
      minimapCtx.shadowBlur = 8 + 4 * vtPulse;
      minimapCtx.fillStyle = `rgba(255,215,0,${0.8 + 0.2 * vtPulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(vtmx, vtmy, 4 + vtPulse, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      minimapCtx.font = '8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.textBaseline = 'alphabetic';
      minimapCtx.fillText('💼', vtmx, vtmy - 6);
      minimapCtx.restore();
    }

    // === PIGEON COUPE — orange/red pulsing 🚗 dot on minimap ===
    if (gameState.pigeonCoupe && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const pcPulse = 0.5 + 0.5 * Math.sin(now * 0.009);
      const pcmx = gameState.pigeonCoupe.x * mw / worldData.width;
      const pcmy = gameState.pigeonCoupe.y * mh / worldData.height;
      minimapCtx.save();
      const pcColor = gameState.pigeonCoupe.driverId ? '#ff4400' : '#ff9900';
      minimapCtx.shadowColor = pcColor;
      minimapCtx.shadowBlur = 8 + 4 * pcPulse;
      minimapCtx.fillStyle = `rgba(255,${gameState.pigeonCoupe.driverId ? 60 : 140},0,${0.8 + 0.2 * pcPulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(pcmx, pcmy, 4 + pcPulse, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      minimapCtx.font = '8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.textBaseline = 'alphabetic';
      minimapCtx.fillText('\uD83D\uDE97', pcmx, pcmy - 6);
      minimapCtx.restore();
    }

    // === BIRDNAPPER VAN — pulsing dark/purple dot on minimap ===
    if (gameState.birdnapperVan && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const bvPulse = 0.5 + 0.5 * Math.sin(now * 0.012);
      const bvmx = gameState.birdnapperVan.x * mw / worldData.width;
      const bvmy = gameState.birdnapperVan.y * mh / worldData.height;
      const bvState = gameState.birdnapperVan.state;
      const bvColor = bvState === 'escaping' ? '#ff2200' : bvState === 'hunting' ? '#cc00ff' : '#880099';
      minimapCtx.save();
      minimapCtx.shadowColor = bvColor;
      minimapCtx.shadowBlur = 8 + 5 * bvPulse;
      minimapCtx.fillStyle = bvColor;
      minimapCtx.beginPath();
      minimapCtx.arc(bvmx, bvmy, 4 + 2 * bvPulse, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      minimapCtx.font = '8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.textBaseline = 'alphabetic';
      minimapCtx.fillText('🚐', bvmx, bvmy - 5);
      minimapCtx.restore();
    }

    // === RIVAL BIRD — pulsing red 🔴 dot on minimap ===
    if (gameState.rivalBird && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const rbPulse = 0.5 + 0.5 * Math.sin(now * 0.01);
      const rbmx = gameState.rivalBird.x * mw / worldData.width;
      const rbmy = gameState.rivalBird.y * mh / worldData.height;
      minimapCtx.save();
      minimapCtx.shadowColor = '#ff2222';
      minimapCtx.shadowBlur = 8 + 5 * rbPulse;
      minimapCtx.fillStyle = '#cc1a1a';
      minimapCtx.beginPath();
      minimapCtx.arc(rbmx, rbmy, 4 + 2 * rbPulse, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      minimapCtx.font = '8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.textBaseline = 'alphabetic';
      minimapCtx.fillText('🔴', rbmx, rbmy - 5);
      minimapCtx.restore();
    }

    // === THE MOLE — pulsing purple 🕵️ dot on minimap (MOLE ALERT only) ===
    {
      const _mMapData = gameState.self && gameState.self.mole;
      if (_mMapData && _mMapData.revealed && _mMapData.moleId && gameState.birds && worldData) {
        const mBird = gameState.birds.find(b => b.id === _mMapData.moleId);
        if (mBird) {
          const mw = minimapCtx.canvas.width;
          const mh = minimapCtx.canvas.height;
          const molePulse = 0.5 + 0.5 * Math.sin(now * 0.011);
          const molemx = mBird.x * mw / worldData.width;
          const molemy = mBird.y * mh / worldData.height;
          minimapCtx.save();
          minimapCtx.shadowColor = '#cc44ff';
          minimapCtx.shadowBlur = 8 + 5 * molePulse;
          minimapCtx.fillStyle = `rgba(136,0,204,${0.8 + 0.2 * molePulse})`;
          minimapCtx.beginPath();
          minimapCtx.arc(molemx, molemy, 5 + 2 * molePulse, 0, Math.PI * 2);
          minimapCtx.fill();
          minimapCtx.shadowBlur = 0;
          minimapCtx.font = '8px sans-serif';
          minimapCtx.textAlign = 'center';
          minimapCtx.textBaseline = 'alphabetic';
          minimapCtx.fillText('🕵️', molemx, molemy - 5);
          minimapCtx.restore();
        }
      }
    }

    // === COURIER PIGEON — pulsing warm-gold 📬 dot on minimap ===
    if (gameState.courierPigeon && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const cpPulse = 0.5 + 0.5 * Math.sin(now * 0.008);
      const cpmx = gameState.courierPigeon.x * mw / worldData.width;
      const cpmy = gameState.courierPigeon.y * mh / worldData.height;
      minimapCtx.save();
      minimapCtx.shadowColor = '#e8c060';
      minimapCtx.shadowBlur = 8 + 4 * cpPulse;
      minimapCtx.fillStyle = `rgba(232,192,96,${0.8 + 0.2 * cpPulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(cpmx, cpmy, 4 + cpPulse, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      minimapCtx.font = '8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.textBaseline = 'alphabetic';
      minimapCtx.fillText('📬', cpmx, cpmy - 5);
      minimapCtx.restore();
    }

    // === HOT DOG CART — pulsing orange 🌭 dot on minimap ===
    if (gameState.hotDogCart && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const hdcPulse = 0.5 + 0.5 * Math.sin(now * 0.008);
      const hdcmx = gameState.hotDogCart.x * mw / worldData.width;
      const hdcmy = gameState.hotDogCart.y * mh / worldData.height;
      minimapCtx.save();
      minimapCtx.shadowColor = '#ff8800';
      minimapCtx.shadowBlur = 8 + 4 * hdcPulse;
      minimapCtx.fillStyle = `rgba(255,136,0,${0.8 + 0.2 * hdcPulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(hdcmx, hdcmy, 3.5 + hdcPulse, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      minimapCtx.font = '8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.textBaseline = 'alphabetic';
      minimapCtx.fillText('🌭', hdcmx, hdcmy - 5);
      minimapCtx.restore();
    }

    // === GOLDEN RAMPAGE — pulsing gold crown dot on minimap at the Golden Bird's position ===
    if (gameState.goldenRampage && gameState.goldenRampage.goldenBirdX !== undefined && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const gbPulse = 0.5 + 0.5 * Math.sin(now * 0.009);
      const gbmx = gameState.goldenRampage.goldenBirdX * msx;
      const gbmy = gameState.goldenRampage.goldenBirdY * msy;
      minimapCtx.save();
      minimapCtx.shadowColor = '#ffd700';
      minimapCtx.shadowBlur = 10 + 6 * gbPulse;
      minimapCtx.fillStyle = `rgba(255,215,0,${0.85 + 0.15 * gbPulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(gbmx, gbmy, 5 + gbPulse * 1.5, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      minimapCtx.font = '9px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.textBaseline = 'alphabetic';
      minimapCtx.fillText('👑', gbmx, gbmy - 5);
      minimapCtx.restore();
    }

    // === BOWLING BIRD — pulsing orange 🎳 dot on minimap ===
    if (gameState.bowlingBall && gameState.bowlingBall.bbX !== undefined && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const bbPulse = 0.5 + 0.5 * Math.sin(now * 0.01);
      const bbmmx = gameState.bowlingBall.bbX * msx;
      const bbmmy = gameState.bowlingBall.bbY * msy;
      minimapCtx.save();
      minimapCtx.shadowColor = '#e06000';
      minimapCtx.shadowBlur = 10 + 6 * bbPulse;
      minimapCtx.fillStyle = `rgba(224,96,0,${0.85 + 0.15 * bbPulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(bbmmx, bbmmy, 5 + bbPulse * 1.5, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      minimapCtx.font = '9px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.textBaseline = 'alphabetic';
      minimapCtx.fillText('🎳', bbmmx, bbmmy - 5);
      minimapCtx.restore();
    }

    // === GRUDGE TARGET — pulsing orange 😤 dot on minimap at target's position ===
    if (gameState.self && gameState.self.grudge && gameState.birds && worldData) {
      const grudgeTarget = gameState.birds.find(b => b.id === gameState.self.grudge.targetId);
      if (grudgeTarget) {
        const mw = minimapCtx.canvas.width;
        const mh = minimapCtx.canvas.height;
        const gPulse = 0.5 + 0.5 * Math.sin(now * 0.01);
        const gmx = grudgeTarget.x * mw / worldData.width;
        const gmy = grudgeTarget.y * mh / worldData.height;
        minimapCtx.save();
        minimapCtx.shadowColor = '#ff6600';
        minimapCtx.shadowBlur = 8 + 4 * gPulse;
        minimapCtx.fillStyle = `rgba(255,100,0,${0.8 + 0.2 * gPulse})`;
        minimapCtx.beginPath();
        minimapCtx.arc(gmx, gmy, 4 + gPulse, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.shadowBlur = 0;
        minimapCtx.font = '8px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.textBaseline = 'alphabetic';
        minimapCtx.fillText('😤', gmx, gmy - 5);
        minimapCtx.restore();
      }
    }

    // === BURIED TREASURE SYSTEM — minimap dots ===
    if (worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const tPulse = 0.5 + 0.5 * Math.sin(now * 0.007);
      // Treasure scroll (visible to all)
      if (gameState.treasureScroll) {
        const ts = gameState.treasureScroll;
        const tsmx = ts.x * mw / worldData.width;
        const tsmy = ts.y * mh / worldData.height;
        minimapCtx.save();
        minimapCtx.shadowColor = '#f4c542';
        minimapCtx.shadowBlur = 8 + 4 * tPulse;
        minimapCtx.fillStyle = `rgba(244,197,66,${0.8 + 0.2 * tPulse})`;
        minimapCtx.beginPath();
        minimapCtx.arc(tsmx, tsmy, 4 + tPulse, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.shadowBlur = 0;
        minimapCtx.font = '8px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.textBaseline = 'alphabetic';
        minimapCtx.fillText('📜', tsmx, tsmy - 5);
        minimapCtx.restore();
      }
      // Treasure map holder (visible to all — the holder's position is public)
      if (gameState.treasureMap && gameState.treasureMap.holderX !== null) {
        const tm = gameState.treasureMap;
        const tmmx = tm.holderX * mw / worldData.width;
        const tmmy = tm.holderY * mh / worldData.height;
        minimapCtx.save();
        minimapCtx.shadowColor = '#ff9900';
        minimapCtx.shadowBlur = 10 + 5 * tPulse;
        minimapCtx.fillStyle = `rgba(255,153,0,${0.85 + 0.15 * tPulse})`;
        minimapCtx.beginPath();
        minimapCtx.arc(tmmx, tmmy, 4.5 + tPulse * 1.2, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.shadowBlur = 0;
        minimapCtx.font = '8px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.textBaseline = 'alphabetic';
        minimapCtx.fillText('🗺️', tmmx, tmmy - 5);
        minimapCtx.restore();
      }
    }

    // Bird Royale safe zone ring on minimap
    if (gameState.birdRoyale && gameState.birdRoyale.state === 'active' && worldData) {
      Renderer.drawBirdRoyaleOnMinimap(minimapCtx, worldData, gameState.birdRoyale, now);
    }

    // Bird Flu medicine items on minimap — green pulsing dots during outbreak
    if (gameState.self && gameState.self.fluMedicineItems && gameState.self.fluMedicineItems.length > 0 && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const fluPulse = 0.5 + 0.5 * Math.sin(now * 0.008);
      for (const med of gameState.self.fluMedicineItems) {
        minimapCtx.fillStyle = `rgba(0,255,80,${0.7 + 0.3 * fluPulse})`;
        minimapCtx.beginPath();
        minimapCtx.arc(med.x * msx, med.y * msy, 3 + fluPulse * 1.5, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.fillStyle = 'rgba(200,255,220,0.9)';
        minimapCtx.font = '6px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.textBaseline = 'middle';
        minimapCtx.fillText('💊', med.x * msx, med.y * msy - 5);
      }
    }

    // Draw beacons on minimap
    if (gameState.beacons && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      for (const b of gameState.beacons) {
        const pulse = Math.sin(performance.now() * 0.005) * 0.4 + 0.6;
        minimapCtx.fillStyle = 'rgba(255, 220, 50, ' + pulse + ')';
        minimapCtx.beginPath();
        minimapCtx.arc(b.x * msx, b.y * msy, 3, 0, Math.PI * 2);
        minimapCtx.fill();
        // "!" marker
        minimapCtx.fillStyle = '#ffd700';
        minimapCtx.font = 'bold 7px Courier New';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillText('!', b.x * msx, b.y * msy - 5);
      }
    }

    // Draw boss on minimap (big pulsing dot — orange for Eagle Overlord, red for others)
    if (gameState.boss && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const bPulse = Math.sin(performance.now() * 0.006) * 0.3 + 0.7;
      if (gameState.boss.type === 'EAGLE_OVERLORD') {
        minimapCtx.fillStyle = 'rgba(255, 140, 0, ' + bPulse + ')';
        minimapCtx.beginPath();
        minimapCtx.arc(gameState.boss.x * msx, gameState.boss.y * msy, 7, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.font = 'bold 7px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillStyle = '#fff';
        minimapCtx.fillText('🦅', gameState.boss.x * msx, gameState.boss.y * msy + 3);
      } else {
        minimapCtx.fillStyle = 'rgba(255, 0, 0, ' + bPulse + ')';
        minimapCtx.beginPath();
        minimapCtx.arc(gameState.boss.x * msx, gameState.boss.y * msy, 5, 0, Math.PI * 2);
        minimapCtx.fill();
      }
    }

    // Draw Kingpin on minimap — large pulsing gold crown (electric blue when inside Thunder Dome)
    if (gameState.kingpin && gameState.kingpin.x !== null && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const kx = gameState.kingpin.x * msx;
      const ky = gameState.kingpin.y * msy;
      const kPulse = Math.sin(performance.now() * 0.005) * 0.3 + 0.7;
      const kingpinInDome = !!(gameState.kingpin.inDome);
      // Thunder Dome × Kingpin: electric blue crown when trapped in dome
      const kingpinOuterColor = kingpinInDome ? '#4499ff' : '#ffd700';
      const kingpinInnerColor = kingpinInDome ? '#88ccff' : '#ffe84d';
      // Outer glow
      minimapCtx.globalAlpha = 0.35 * kPulse;
      minimapCtx.fillStyle = kingpinOuterColor;
      minimapCtx.beginPath();
      minimapCtx.arc(kx, ky, kingpinInDome ? 9 : 7, 0, Math.PI * 2);
      minimapCtx.fill();
      // Inner dot
      minimapCtx.globalAlpha = 0.9 * kPulse;
      minimapCtx.fillStyle = kingpinInnerColor;
      minimapCtx.beginPath();
      minimapCtx.arc(kx, ky, 3.5, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.globalAlpha = 1;
      // Crown emoji label — lightning bolt if in dome
      minimapCtx.font = 'bold 8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText(kingpinInDome ? '⚡' : '👑', kx, ky - 6);
    }

    // Draw wanted bird on minimap (flashing red skull)
    if (gameState.wantedBirdId && gameState.birds && worldData) {
      const wanted = gameState.birds.find(function(b) { return b.id === gameState.wantedBirdId; });
      if (wanted) {
        const mw = minimapCtx.canvas.width;
        const mh = minimapCtx.canvas.height;
        const msx = mw / worldData.width;
        const msy = mh / worldData.height;
        const wPulse = Math.sin(performance.now() * 0.008) * 0.5 + 0.5;
        minimapCtx.fillStyle = 'rgba(255, 0, 0, ' + wPulse + ')';
        minimapCtx.beginPath();
        minimapCtx.arc(wanted.x * msx, wanted.y * msy, 4, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.font = 'bold 6px Courier New';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillStyle = '#ff0000';
        minimapCtx.fillText('W', wanted.x * msx, wanted.y * msy - 5);
        // Helicopter spotlight: bright blue ring visible to ALL players when helicopter is spotlighting
        if (gameState.policeHelicopter && gameState.policeHelicopter.spotlighting) {
          const spotPulse = 0.5 + 0.5 * Math.sin(now * 0.01);
          minimapCtx.strokeStyle = `rgba(100,180,255,${0.6 + 0.4 * spotPulse})`;
          minimapCtx.lineWidth = 2;
          minimapCtx.beginPath();
          minimapCtx.arc(wanted.x * msx, wanted.y * msy, 7, 0, Math.PI * 2);
          minimapCtx.stroke();
          minimapCtx.font = '6px sans-serif';
          minimapCtx.fillStyle = '#88ccff';
          minimapCtx.fillText('🔦', wanted.x * msx, wanted.y * msy - 9);
        }
      }
    }

    // Draw cop birds on minimap (blue/red flashing dots)
    if (gameState.cops && gameState.cops.length > 0 && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const copFlash = Math.sin(performance.now() * 0.01) > 0;
      for (const cop of gameState.cops) {
        minimapCtx.fillStyle = cop.type === 'swat' ? (copFlash ? '#ff3333' : '#ff9900') : (copFlash ? '#4488ff' : '#ff3333');
        minimapCtx.beginPath();
        minimapCtx.arc(cop.x * msx, cop.y * msy, cop.type === 'swat' ? 3.5 : 2.5, 0, Math.PI * 2);
        minimapCtx.fill();
      }
    }

    // Draw Bounty Hunter on minimap (dark red pulsing skull dot)
    if (gameState.bountyHunter && gameState.bountyHunter.state !== 'off_duty' && worldData) {
      const bh = gameState.bountyHunter;
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const bhPulse = Math.sin(performance.now() * 0.006) > 0;
      minimapCtx.fillStyle = bhPulse ? '#cc1100' : '#880800';
      minimapCtx.beginPath();
      minimapCtx.arc(bh.x * msx, bh.y * msy, 4, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.font = '7px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText('🔫', bh.x * msx, bh.y * msy - 4);
    }

    // Draw National Guard on minimap (gold-green pulsing dots with 🪖)
    if (gameState.allNationalGuard && gameState.allNationalGuard.length > 0 && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const ngPulse = Math.sin(now * 0.008) * 0.5 + 0.5;
      for (const ng of gameState.allNationalGuard) {
        if (ng.state === 'stunned') continue;
        minimapCtx.fillStyle = `rgba(${Math.round(160 + 95 * ngPulse)}, 140, 0, 1)`;
        minimapCtx.shadowColor = '#ffd700';
        minimapCtx.shadowBlur = 4 + 3 * ngPulse;
        minimapCtx.beginPath();
        minimapCtx.arc(ng.x * msx, ng.y * msy, 4, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.shadowBlur = 0;
        minimapCtx.font = '7px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillText('🪖', ng.x * msx, ng.y * msy - 4);
      }
    }

    // Draw Police Helicopter on minimap (blue/red siren-flashing dot)
    if (gameState.policeHelicopter && gameState.policeHelicopter.state !== 'stunned' && worldData) {
      const heli = gameState.policeHelicopter;
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const heliSirenFlash = Math.floor(now / 200) % 2;
      minimapCtx.fillStyle = heliSirenFlash === 0 ? '#2244ff' : '#ff2222';
      minimapCtx.shadowColor = heliSirenFlash === 0 ? '#4466ff' : '#ff4444';
      minimapCtx.shadowBlur = 6;
      minimapCtx.beginPath();
      minimapCtx.arc(heli.x * msx, heli.y * msy, 5, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.shadowBlur = 0;
      minimapCtx.font = '8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText('🚁', heli.x * msx, heli.y * msy - 5);
      // Also: when spotlighting, draw a ring around the targeted bird's minimap dot
      if (heli.spotlighting && gameState.self) {
        const tx = gameState.self.x * msx;
        const ty = gameState.self.y * msy;
        const spotPulse = 0.5 + 0.5 * Math.sin(now * 0.008);
        minimapCtx.strokeStyle = `rgba(100,180,255,${spotPulse})`;
        minimapCtx.lineWidth = 2;
        minimapCtx.beginPath();
        minimapCtx.arc(tx, ty, 7, 0, Math.PI * 2);
        minimapCtx.stroke();
      }
    }

    // Draw food truck on minimap (flashing red during heist)
    if (gameState.foodTruck && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const truck = gameState.foodTruck;
      const heistFlash = truck.heistActive && Math.floor(now / 300) % 2 === 0;
      minimapCtx.fillStyle = truck.looted ? '#884400' : (heistFlash ? '#ff2200' : '#ff8800');
      minimapCtx.beginPath();
      minimapCtx.arc(truck.x * msx, truck.y * msy, truck.heistActive ? 4 : 3, 0, Math.PI * 2);
      minimapCtx.fill();
      if (truck.heistActive) {
        minimapCtx.font = 'bold 6px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillStyle = '#ffff00';
        minimapCtx.fillText('🚨', truck.x * msx, truck.y * msy - 5);
      }
    }

    // Draw black market on minimap (purple dot when open)
    if (gameState.blackMarket && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      minimapCtx.fillStyle = '#cc44ff';
      minimapCtx.beginPath();
      minimapCtx.arc(gameState.blackMarket.x * msx, gameState.blackMarket.y * msy, 3, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    // Draw Godfather Raccoon on minimap (pulsing gold/purple dot)
    if (gameState.godfatherRaccoon && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const gfPulse = Math.sin(performance.now() * 0.005) * 0.35 + 0.65;
      minimapCtx.fillStyle = `rgba(170, 68, 255, ${gfPulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(gameState.godfatherRaccoon.x * msx, gameState.godfatherRaccoon.y * msy, 6, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.font = 'bold 7px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillStyle = '#ffd700';
      minimapCtx.fillText('🎩', gameState.godfatherRaccoon.x * msx, gameState.godfatherRaccoon.y * msy + 3);
    }

    // Crow Cartel on minimap — pulsing red ⚔️ dots for each crow
    if (gameState.crowCartel && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const ccPulse = Math.sin(performance.now() * 0.009) * 0.4 + 0.6;
      for (const crow of gameState.crowCartel.crows) {
        if (crow.state === 'dead') continue;
        const isDon = crow.type === 'don';
        minimapCtx.fillStyle = `rgba(${isDon ? '180,0,220' : '220,30,30'},${ccPulse})`;
        minimapCtx.beginPath();
        minimapCtx.arc(crow.x * msx, crow.y * msy, isDon ? 5 : 3, 0, Math.PI * 2);
        minimapCtx.fill();
        if (isDon) {
          minimapCtx.font = 'bold 7px sans-serif';
          minimapCtx.textAlign = 'center';
          minimapCtx.fillStyle = '#ff44ff';
          minimapCtx.fillText('🐦‍⬛', crow.x * msx, crow.y * msy + 3);
        }
      }
    }

    // Mural Vandal on minimap — pulsing dark purple 🎨 dot
    if (gameState.muralVandal && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const mv = gameState.muralVandal;
      if (mv.state !== 'fleeing') {
        const mvPulse = 0.6 + 0.4 * Math.sin(performance.now() * 0.01);
        minimapCtx.fillStyle = `rgba(180,40,220,${mvPulse})`;
        minimapCtx.beginPath();
        minimapCtx.arc(mv.x * msx, mv.y * msy, 4, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.font = '8px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillText('🎨', mv.x * msx, mv.y * msy + 2);
      }
    }

    // Draw arena on minimap (static red ring + pulsing dot when active)
    if (worldData && worldData.arena) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const arenaX = worldData.arena.x * msx;
      const arenaY = worldData.arena.y * msy;
      const arenaR = worldData.arena.radius * msx;
      const arenaActive = gameState.arena && (gameState.arena.state === 'fighting' || gameState.arena.state === 'countdown');
      const arenaPulse = arenaActive ? (Math.sin(performance.now() * 0.008) * 0.4 + 0.6) : 1;
      minimapCtx.strokeStyle = arenaActive ? 'rgba(255, 80, 0, ' + arenaPulse + ')' : 'rgba(180, 100, 40, 0.7)';
      minimapCtx.lineWidth = arenaActive ? 1.5 : 1;
      minimapCtx.beginPath();
      minimapCtx.arc(arenaX, arenaY, Math.max(3, arenaR), 0, Math.PI * 2);
      minimapCtx.stroke();
      if (arenaActive) {
        minimapCtx.fillStyle = 'rgba(255, 80, 0, 0.4)';
        minimapCtx.fill();
      }
      minimapCtx.font = 'bold 6px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillStyle = arenaActive ? '#ff8844' : '#cc8833';
      minimapCtx.fillText('⚔', arenaX, arenaY + 2);
    }

    // Draw hawk on minimap if present
    if (gameState.hawk && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      minimapCtx.fillStyle = '#ff0000';
      minimapCtx.beginPath();
      minimapCtx.arc(gameState.hawk.x * msx, gameState.hawk.y * msy, 3, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    // Draw Radio Tower on minimap (always visible — fixed landmark)
    if (worldData && worldData.radioTowerPos) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const tx = worldData.radioTowerPos.x * msx;
      const ty = worldData.radioTowerPos.y * msy;
      const rt = gameState.radioTower;
      const owned = rt && rt.state === 'owned';
      const sigBoost = rt && rt.signalBoostUntil > Date.now();
      const tPulse = Math.sin(performance.now() * 0.006) * 0.35 + 0.65;

      // Glow for signal boost
      if (sigBoost) {
        minimapCtx.strokeStyle = 'rgba(80,255,80,' + tPulse + ')';
        minimapCtx.lineWidth = 2;
        minimapCtx.beginPath();
        minimapCtx.arc(tx, ty, 6, 0, Math.PI * 2);
        minimapCtx.stroke();
      }

      minimapCtx.fillStyle = owned
        ? (rt.ownerColor || '#44aaff')
        : 'rgba(100,120,160,0.8)';
      minimapCtx.beginPath();
      minimapCtx.arc(tx, ty, owned ? 4 : 3, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.font = 'bold 6px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillStyle = owned ? '#fff' : '#aabbcc';
      minimapCtx.fillText('📡', tx, ty - 4);
    }

    // Aurora Borealis — pulsing teal/green glow above the minimap when active
    if (gameState.aurora && gameState.aurora.endsAt > Date.now()) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      // Pond center world coords: ~1050, 1100
      const px = 1050 * msx;
      const py = 1100 * msy;
      const aPulse = Math.sin(performance.now() * 0.004) * 0.4 + 0.6;
      minimapCtx.save();
      minimapCtx.fillStyle = `rgba(136, 255, 200, ${aPulse * 0.6})`;
      minimapCtx.beginPath();
      minimapCtx.arc(px, py, 5, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.font = 'bold 9px Arial';
      minimapCtx.textAlign = 'center';
      minimapCtx.textBaseline = 'middle';
      minimapCtx.fillText('✨', px, py);
      minimapCtx.restore();
    }

    // Ice Rink — pulsing icy blue dot when blizzard is active
    if (gameState.iceRink && worldData) {
      Renderer.drawIceRinkOnMinimap(minimapCtx, gameState.iceRink, worldData.width, worldData.height);
    }

    // Flash Mob — pulsing party dot on minimap
    if (gameState.flashMob && worldData) {
      Renderer.drawFlashMobOnMinimap(minimapCtx, { worldW: worldData.width, worldH: worldData.height, mmW: minimapCanvas.width, mmH: minimapCanvas.height }, gameState.flashMob, now);
    }

    // Golden Perch — pulsing gold 🏅 dot when active
    if (gameState.self && gameState.self.goldenPerch && worldData) {
      Renderer.drawGoldenPerchOnMinimap(minimapCtx, gameState.self.goldenPerch, minimapCanvas.width, minimapCanvas.height, worldData.width, worldData.height, now);
    }

    // Auction House — permanent gold dot, pulses brighter when auction active
    if (worldData && worldData.auctionHousePos) {
      Renderer.drawAuctionHouseOnMinimap(minimapCtx, worldData.auctionHousePos, { worldW: worldData.width, worldH: worldData.height, mmW: minimapCanvas.width, mmH: minimapCanvas.height }, gameState.auction || null, now);
    }

    // Thunder Dome — pulsing electric-blue ring on minimap
    const _domeForMinimap = gameState.thunderDome || window._thunderDomeData;
    if (_domeForMinimap && worldData) {
      Renderer.drawThunderDomeOnMinimap(minimapCtx, { width: worldData.width, height: worldData.height }, _domeForMinimap, now);
    }

    // Golden Throne — pulsing gold crown dot on minimap
    if (gameState.self && gameState.self.goldenThrone && worldData) {
      Renderer.drawGoldenThroneOnMinimap(minimapCtx, { width: worldData.width, height: worldData.height }, gameState.self.goldenThrone, now);
    }

    // Night Market — pulsing teal dot near the pond when aurora is active
    if (gameState.nightMarket && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const nmx = gameState.nightMarket.x * msx;
      const nmy = gameState.nightMarket.y * msy;
      const nmPulse = Math.abs(Math.sin(performance.now() * 0.0025));
      minimapCtx.save();
      const nmGrd = minimapCtx.createRadialGradient(nmx, nmy, 1, nmx, nmy, 6 + nmPulse * 2);
      nmGrd.addColorStop(0, 'rgba(80,255,220,0.9)');
      nmGrd.addColorStop(1, 'rgba(0,150,180,0)');
      minimapCtx.fillStyle = nmGrd;
      minimapCtx.beginPath();
      minimapCtx.arc(nmx, nmy, 6 + nmPulse * 2, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.font = '8px Arial';
      minimapCtx.textAlign = 'center';
      minimapCtx.textBaseline = 'middle';
      minimapCtx.fillText('🛒', nmx, nmy);
      minimapCtx.restore();
    }

    // Directional arrow pointing toward active event when off-screen
    if (gameState.activeEvent && gameState.activeEvent.x !== undefined && selfBird) {
      const evX = gameState.activeEvent.x;
      const evY = gameState.activeEvent.y;
      const dx = evX - selfBird.x;
      const dy = evY - selfBird.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 400) {
        const angle = Math.atan2(dy, dx);
        const arrowDist = Math.min(camera.screenW, camera.screenH) * 0.4;
        const ax = camera.screenW / 2 + Math.cos(angle) * arrowDist;
        const ay = camera.screenH / 2 + Math.sin(angle) * arrowDist;
        const eventColors = {
          breadcrumbs: '#ffd700',
          wedding: '#ff69b4',
          hawk: '#ff3300',
          parade: '#6666ff',
        };
        const arrowColor = eventColors[gameState.activeEvent.type] || '#fff';
        const pulse = Math.sin(now * 0.005) * 0.3 + 0.7;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = arrowColor;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-6, -7);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 7);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    // Full-screen color flash (boost gate, etc.)
    for (const fx of effects) {
      if (fx.type === 'flash') {
        const age = now - fx.time;
        if (age < fx.duration) {
          const fadeFactor = 1 - age / fx.duration;
          // Parse alpha from rgba string and apply fade
          ctx.fillStyle = fx.color || 'rgba(255,255,255,0.3)';
          ctx.globalAlpha = fadeFactor;
          ctx.fillRect(0, 0, camera.screenW, camera.screenH);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Eagle eye golden tint overlay
    for (const fx of effects) {
      if (fx.type === 'eagle_eye_tint') {
        const age = now - fx.time;
        if (age < fx.duration) {
          const alpha = Math.min(0.08, 0.08 * (1 - age / fx.duration));
          ctx.fillStyle = 'rgba(255, 215, 0, ' + alpha + ')';
          ctx.fillRect(0, 0, camera.screenW, camera.screenH);
        }
      }
    }

    // Aurora combo flash — teal/cyan screen bloom when x20 combo lands under Aurora Borealis
    for (const fx of effects) {
      if (fx.type === 'aurora_combo_flash') {
        const age = now - fx.time;
        if (age < fx.duration) {
          // Two-phase: quick bright flash then gentle teal glow fade
          const t = age / fx.duration;
          let alpha;
          if (t < 0.25) {
            alpha = 0.45 * (t / 0.25); // fast ramp up
          } else {
            alpha = 0.45 * (1 - (t - 0.25) / 0.75); // slow fade out
          }
          const grad = ctx.createRadialGradient(
            camera.screenW / 2, camera.screenH / 2, 0,
            camera.screenW / 2, camera.screenH / 2, Math.max(camera.screenW, camera.screenH) * 0.7
          );
          grad.addColorStop(0, `rgba(136, 255, 204, ${alpha})`);   // bright teal center
          grad.addColorStop(0.5, `rgba(80, 200, 180, ${alpha * 0.6})`);
          grad.addColorStop(1, `rgba(40, 100, 120, 0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, camera.screenW, camera.screenH);
        }
      }
    }
  }

  // ============================================================
  // FULLSCREEN
  // ============================================================
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.matchMedia('(display-mode: fullscreen)').matches ||
                       window.navigator.standalone === true;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function goFullscreen() {
    const el = document.documentElement;
    const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (rfs) {
      rfs.call(el).then(() => {
        if (fullscreenBtn) fullscreenBtn.style.display = 'none';
      }).catch(() => {});
    }
  }

  // Show fullscreen button if Fullscreen API is available & not already fullscreen/standalone
  if (!isStandalone && (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) {
    fullscreenBtn.style.display = 'flex';
    fullscreenBtn.addEventListener('click', goFullscreen);
    fullscreenBtn.addEventListener('touchstart', (e) => { e.preventDefault(); goFullscreen(); }, { passive: false });
  }

  // Exit fullscreen -> show button again
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && fullscreenBtn) fullscreenBtn.style.display = 'flex';
  });
  document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement && fullscreenBtn) fullscreenBtn.style.display = 'flex';
  });

  // iOS Safari: show "Add to Home Screen" prompt (no Fullscreen API on iOS Safari)
  if (isIOS && !isStandalone && iosPrompt) {
    // Show after a short delay once the game starts
    const origWelcome = socket;
    // We'll show it on first join
    const showIOSPrompt = () => {
      if (localStorage.getItem('birdcity_ios_dismissed')) return;
      setTimeout(() => { iosPrompt.style.display = 'block'; }, 3000);
    };
    // Hook into join
    const _origJoin = joinGame;
    // Use a MutationObserver-free approach: check after join
    window._birdCityShowIOSPrompt = showIOSPrompt;
  }

  if (iosPromptClose) {
    iosPromptClose.addEventListener('click', () => {
      iosPrompt.style.display = 'none';
      localStorage.setItem('birdcity_ios_dismissed', '1');
    });
    iosPromptClose.addEventListener('touchstart', (e) => {
      e.preventDefault();
      iosPrompt.style.display = 'none';
      localStorage.setItem('birdcity_ios_dismissed', '1');
    }, { passive: false });
  }

  // ============================================================
  // BIRD HOME OVERLAY
  // ============================================================
  // ============================================================
  // BLACK MARKET SHOP UI
  // ============================================================
  // ============================================================
  // NIGHT MARKET (aurora bazaar) — open/close/render
  // ============================================================
  function openNightMarketOverlay() {
    if (!gameState || !gameState.nightMarket || !lastNearNightMarket) return;
    nmOverlayOpen = true;
    const el = document.getElementById('nightMarketOverlay');
    if (el) el.style.display = 'block';
    renderNightMarketOverlay();
    // Freeze movement while shopping
    for (const k in keys) keys[k] = false;
    syncInput();
  }

  function closeNightMarketOverlay() {
    nmOverlayOpen = false;
    const el = document.getElementById('nightMarketOverlay');
    if (el) el.style.display = 'none';
  }

  function renderNightMarketOverlay() {
    if (!gameState || !gameState.self) return;
    const s = gameState.self;
    const now = Date.now();
    const fish = s.cosmicFish || 0;
    document.getElementById('nmFishBalance').textContent = fish;

    const itemsEl = document.getElementById('nmItems');
    if (!itemsEl) return;
    itemsEl.innerHTML = '';

    for (const item of NM_CATALOG) {
      const isPermanent = item.id === 'constellation_badge';
      const alreadyOwned = isPermanent && s.constellationBadge;
      // Check active state for timed items
      let isActive = false;
      if (item.id === 'stardust_cloak') isActive = s.stardustCloakUntil > now;
      if (item.id === 'comet_trail')    isActive = s.cometTrailUntil > now;
      if (item.id === 'oracle_eye')     isActive = s.oracleEyeUntil > now;
      if (item.id === 'star_power')     isActive = s.starPowerUntil > now;
      if (item.id === 'lunar_lens')     isActive = s.lunarLensUntil > now;
      const canAfford = fish >= item.cost && !alreadyOwned;

      const div = document.createElement('div');
      div.style.cssText = `
        padding:9px 12px;border-radius:8px;cursor:${canAfford ? 'pointer' : 'default'};
        background:${alreadyOwned ? 'rgba(0,60,40,0.5)' : isActive ? 'rgba(0,40,60,0.6)' : canAfford ? 'rgba(0,30,50,0.5)' : 'rgba(20,20,30,0.4)'};
        border:1px solid ${alreadyOwned ? '#44ff88' : isActive ? '#44ddcc' : canAfford ? 'rgba(68,255,238,0.4)' : 'rgba(68,150,140,0.2)'};
        opacity:${canAfford || alreadyOwned || isActive ? '1' : '0.55'};
        transition:background 0.2s;
      `;

      const statusStr = alreadyOwned ? '<span style="color:#44ff88;font-size:10px;"> ✓ OWNED</span>'
        : isActive ? '<span style="color:#44ffee;font-size:10px;"> ✓ ACTIVE</span>' : '';
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;">${item.emoji} <strong style="color:#eeffee;">${item.name}</strong>${statusStr}</span>
          <span style="color:${canAfford || alreadyOwned || isActive ? '#88ffee' : '#557777'};font-weight:bold;white-space:nowrap;">
            ${alreadyOwned ? '—' : `🐟 ${item.cost}`}
          </span>
        </div>
        <div style="font-size:10px;color:#669988;margin-top:3px;">${item.desc} <em style="color:#557766;">[${item.dur}]</em></div>
      `;
      if (canAfford) {
        div.addEventListener('click', () => {
          socket.emit('action', { type: 'night_market_buy', itemId: item.id });
          closeNightMarketOverlay();
        });
        div.addEventListener('mouseenter', () => { div.style.background = 'rgba(0,50,70,0.75)'; });
        div.addEventListener('mouseleave', () => { div.style.background = canAfford ? 'rgba(0,30,50,0.5)' : 'rgba(20,20,30,0.4)'; });
      }
      itemsEl.appendChild(div);
    }
  }

  function toggleBlackMarketShop() {
    if (bmShopOpen) {
      closeBmShop();
    } else {
      openBmShop();
    }
  }

  function openBmShop() {
    if (!gameState || !gameState.blackMarket || !lastNearBlackMarket) return;
    bmShopOpen = true;
    const el = document.getElementById('blackMarketShop');
    el.style.display = 'block';
    renderBmShop();
    // Stop bird movement while shopping
    for (const k in keys) keys[k] = false;
    syncInput();
  }

  function closeBmShop() {
    bmShopOpen = false;
    const el = document.getElementById('blackMarketShop');
    if (el) el.style.display = 'none';
  }

  // ============================================================
  // DUKE'S CHALLENGE OVERLAY
  // ============================================================
  function openDukeChallengeOverlay() {
    if (!gameState || !gameState.self || gameState.self.myCourtTitle !== 'Duke') return;
    const isDukeEl = document.getElementById('dukeChallengeOverlay');
    if (isDukeEl) {
      isDukeEl.style.display = 'block';
      renderDukeChallengeOverlay();
    }
    for (const k in keys) keys[k] = false;
    syncInput();
  }

  function closeDukeChallengeOverlay() {
    const el = document.getElementById('dukeChallengeOverlay');
    if (el) el.style.display = 'none';
  }

  function renderDukeChallengeOverlay() {
    const el = document.getElementById('dukeChallengeOverlay');
    if (!el || !gameState || !gameState.self) return;
    const s = gameState.self;
    const coins = s.coins || 0;
    const dcActive = !!(window._dukeChallenge);

    const CHALLENGE_TYPES = [
      { type: 'poop_npcs',     label: '💩 Poop NPCs',          desc: 'First to poop N NPCs/cars wins', targets: [5, 10, 15, 20] },
      { type: 'tag_buildings', label: '🎨 Tag Buildings',       desc: 'First to graffiti N buildings wins', targets: [2, 4, 6] },
      { type: 'sewer_loot',   label: '🐀 Sewer Loot',          desc: 'First to collect N sewer caches wins', targets: [1, 2, 3] },
      { type: 'reach_heat',   label: '⭐ Reach Wanted Level',   desc: 'First to hit the target star level wins', targets: [2, 3, 4] },
      { type: 'stun_cops',    label: '🚨 Stun Cop Birds',       desc: 'First to poop-stun N cops wins', targets: [3, 5, 8] },
      { type: 'deliver_egg',  label: '🥚 Deliver Golden Eggs',  desc: 'First to deliver N eggs to a nest wins', targets: [1, 2] },
    ];

    if (dcActive) {
      const dc = window._dukeChallenge;
      const secsLeft = Math.max(0, Math.round((dc.expiresAt - Date.now()) / 1000));
      el.innerHTML = `
        <div style="background:linear-gradient(160deg,#1a1200,#2a2000);border:2px solid #b38b00;border-radius:12px;padding:20px 22px;min-width:320px;max-width:480px;color:#ffe066;font-family:sans-serif;position:relative;">
          <button onclick="closeDukeChallengeOverlay()" style="position:absolute;top:10px;right:12px;background:none;border:none;color:#ffd700;font-size:18px;cursor:pointer;">✕</button>
          <div style="font-size:16px;font-weight:bold;color:#ffd700;margin-bottom:12px;">👑 DUKE'S CHALLENGE ACTIVE</div>
          <div style="font-size:13px;color:#ffe066;margin-bottom:8px;">${dc.desc}</div>
          <div style="font-size:11px;color:#ccaa00;">Reward: 🏆 ${dc.reward}c &nbsp;|&nbsp; Expires in ${secsLeft}s</div>
          <button onclick="socket.emit('action',{type:'duke_challenge_cancel'});closeDukeChallengeOverlay();" style="margin-top:14px;background:rgba(80,0,0,0.8);color:#ff8888;border:1px solid #aa2222;border-radius:5px;font-size:11px;padding:6px 14px;cursor:pointer;">✕ Cancel Challenge (50% refund)</button>
        </div>`;
      return;
    }

    // Build issue form
    let typeRows = CHALLENGE_TYPES.map(ct => {
      const tgtOptions = ct.targets.map(t => `<option value="${t}">${t}</option>`).join('');
      return `<tr>
        <td style="padding:5px 6px;"><label><input type="radio" name="dcType" value="${ct.type}" ${ct.type === 'poop_npcs' ? 'checked' : ''}> ${ct.label}</label></td>
        <td style="padding:5px 6px;font-size:10px;color:#ccaa44;">${ct.desc}</td>
        <td style="padding:5px 6px;"><select class="dcTargetSel" data-type="${ct.type}" style="background:#2a2000;color:#ffd700;border:1px solid #b38b00;border-radius:3px;font-size:10px;">${tgtOptions}</select></td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div style="background:linear-gradient(160deg,#1a1200,#2a2000);border:2px solid #b38b00;border-radius:12px;padding:20px 22px;min-width:340px;max-width:500px;color:#ffe066;font-family:sans-serif;position:relative;">
        <button onclick="closeDukeChallengeOverlay()" style="position:absolute;top:10px;right:12px;background:none;border:none;color:#ffd700;font-size:18px;cursor:pointer;">✕</button>
        <div style="font-size:16px;font-weight:bold;color:#ffd700;margin-bottom:4px;">👑 ISSUE DUKE'S CHALLENGE</div>
        <div style="font-size:11px;color:#ccaa44;margin-bottom:12px;">Issue a city-wide challenge. First bird to complete it wins your reward. You get 50% back if nobody completes it.</div>
        <table style="width:100%;border-collapse:collapse;">
          ${typeRows}
        </table>
        <div style="margin-top:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <label style="font-size:11px;">Reward: <input id="dcRewardInput" type="number" min="20" max="500" value="100" style="width:60px;background:#2a2000;color:#ffd700;border:1px solid #b38b00;border-radius:3px;padding:2px 5px;"> coins (your balance: ${coins}c)</label>
          <label style="font-size:11px;">Duration: <select id="dcDurationSel" style="background:#2a2000;color:#ffd700;border:1px solid #b38b00;border-radius:3px;">
            <option value="60">60s</option>
            <option value="90" selected>90s</option>
            <option value="120">120s</option>
            <option value="180">3 min</option>
          </select></label>
        </div>
        <div id="dcIssueErr" style="color:#ff6644;font-size:10px;margin-top:6px;min-height:14px;"></div>
        <button id="dcIssueBtn" style="margin-top:12px;background:linear-gradient(135deg,#7a5a00,#b38b00);color:#ffd700;border:1px solid #ffd70088;border-radius:6px;font-size:13px;font-weight:bold;padding:8px 20px;cursor:pointer;width:100%;">🎯 ISSUE CHALLENGE</button>
      </div>`;

    document.getElementById('dcIssueBtn').onclick = () => {
      const typeInput = el.querySelector('input[name="dcType"]:checked');
      if (!typeInput) { document.getElementById('dcIssueErr').textContent = 'Select a challenge type.'; return; }
      const type = typeInput.value;
      const targetSel = el.querySelector(`.dcTargetSel[data-type="${type}"]`);
      const target = parseInt(targetSel ? targetSel.value : '5');
      const reward = parseInt(document.getElementById('dcRewardInput').value) || 100;
      const duration = parseInt(document.getElementById('dcDurationSel').value) * 1000 || 90000;
      if (reward < 20 || reward > 500) { document.getElementById('dcIssueErr').textContent = 'Reward must be 20–500 coins.'; return; }
      socket.emit('action', { type: 'duke_challenge_issue', challengeType: type, target, reward, duration });
      closeDukeChallengeOverlay();
    };
  }

  // ============================================================
  // BARON'S DECREE OVERLAY
  // ============================================================
  function openBaronChallengeOverlay() {
    if (!gameState || !gameState.self || gameState.self.myCourtTitle !== 'Baron') return;
    const el = document.getElementById('baronChallengeOverlay');
    if (!el) return;
    el.style.display = 'block';
    renderBaronChallengeOverlay();
    for (const k in keys) keys[k] = false;
    syncInput();
  }

  function closeBaronChallengeOverlay() {
    const el = document.getElementById('baronChallengeOverlay');
    if (el) el.style.display = 'none';
  }

  function renderBaronChallengeOverlay() {
    const el = document.getElementById('baronChallengeOverlay');
    if (!el || !gameState || !gameState.self) return;
    const s = gameState.self;
    const coins = s.coins || 0;
    const bcActive = !!(window._baronChallenge);

    if (bcActive) {
      const bc = window._baronChallenge;
      const secsLeft = Math.max(0, Math.round((bc.expiresAt - Date.now()) / 1000));
      el.innerHTML = `
        <div style="background:linear-gradient(160deg,#10121e,#1e2040);border:2px solid #8080c0;border-radius:12px;padding:20px 22px;min-width:300px;max-width:440px;color:#d0d0e8;font-family:sans-serif;position:relative;">
          <button onclick="closeBaronChallengeOverlay()" style="position:absolute;top:10px;right:12px;background:none;border:none;color:#c8c8d0;font-size:18px;cursor:pointer;">✕</button>
          <div style="font-size:15px;font-weight:bold;color:#c8c8d0;margin-bottom:12px;">🥈 BARON'S DECREE ACTIVE</div>
          <div style="font-size:13px;color:#d0d0e8;margin-bottom:8px;">${bc.desc}</div>
          <div style="font-size:11px;color:#a0a0c0;">Reward: 🏆 ${bc.reward}c &nbsp;|&nbsp; Expires in ${secsLeft}s</div>
          <button onclick="socket.emit('action',{type:'baron_challenge_cancel'});closeBaronChallengeOverlay();" style="margin-top:14px;background:rgba(40,40,80,0.8);color:#aaaaee;border:1px solid #6666aa;border-radius:5px;font-size:11px;padding:6px 14px;cursor:pointer;">✕ Cancel Decree (50% refund)</button>
        </div>`;
      return;
    }

    const BARON_TYPES = [
      { type: 'poop_npcs',    label: '💩 Poop NPCs',       desc: 'First to poop N NPCs/cars wins', targets: [3, 5, 8, 10] },
      { type: 'tag_buildings',label: '🎨 Tag Buildings',   desc: 'First to graffiti N buildings wins', targets: [1, 2, 3] },
      { type: 'stun_cops',    label: '🚓 Stun Cops',       desc: 'First to stun N cops with poop wins', targets: [2, 3, 5] },
    ];

    let typeRows = BARON_TYPES.map(ct => {
      const tgtOptions = ct.targets.map(t => `<option value="${t}">${t}</option>`).join('');
      return `<tr>
        <td style="padding:4px 6px;"><label><input type="radio" name="bcType" value="${ct.type}" ${ct.type === 'poop_npcs' ? 'checked' : ''}> ${ct.label}</label></td>
        <td style="padding:4px 6px;font-size:10px;color:#a0a0c0;">${ct.desc}</td>
        <td style="padding:4px 6px;"><select class="bcTargetSel" data-type="${ct.type}" style="background:#1e2040;color:#c8c8d0;border:1px solid #8080c0;border-radius:3px;font-size:10px;">${tgtOptions}</select></td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div style="background:linear-gradient(160deg,#10121e,#1e2040);border:2px solid #8080c0;border-radius:12px;padding:20px 22px;min-width:320px;max-width:460px;color:#d0d0e8;font-family:sans-serif;position:relative;">
        <button onclick="closeBaronChallengeOverlay()" style="position:absolute;top:10px;right:12px;background:none;border:none;color:#c8c8d0;font-size:18px;cursor:pointer;">✕</button>
        <div style="font-size:15px;font-weight:bold;color:#c8c8d0;margin-bottom:4px;">🥈 ISSUE BARON'S DECREE</div>
        <div style="font-size:11px;color:#8080a0;margin-bottom:10px;">The Baron's word is law — temporarily. First to complete wins your reward. 50% refund if unclaimed.</div>
        <table style="width:100%;border-collapse:collapse;">
          ${typeRows}
        </table>
        <div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <label style="font-size:11px;color:#c8c8d0;">Reward: <input id="bcRewardInput" type="number" min="20" max="100" value="40" style="width:55px;background:#1e2040;color:#c8c8d0;border:1px solid #8080c0;border-radius:3px;padding:2px 4px;"> coins (your balance: ${coins}c)</label>
          <label style="font-size:11px;color:#c8c8d0;">Duration: <select id="bcDurationSel" style="background:#1e2040;color:#c8c8d0;border:1px solid #8080c0;border-radius:3px;">
            <option value="45">45s</option>
            <option value="60" selected>60s</option>
            <option value="90">90s</option>
            <option value="120">2 min</option>
          </select></label>
        </div>
        <div id="bcIssueErr" style="color:#ff6644;font-size:10px;margin-top:5px;min-height:14px;"></div>
        <button id="bcIssueBtn" style="margin-top:10px;background:linear-gradient(135deg,#303060,#606090);color:#c8c8d0;border:1px solid #a0a0c088;border-radius:6px;font-size:12px;font-weight:bold;padding:7px 16px;cursor:pointer;width:100%;">📜 ISSUE DECREE</button>
      </div>`;

    document.getElementById('bcIssueBtn').onclick = () => {
      const typeInput = el.querySelector('input[name="bcType"]:checked');
      if (!typeInput) { document.getElementById('bcIssueErr').textContent = 'Select a challenge type.'; return; }
      const type = typeInput.value;
      const targetSel = el.querySelector(`.bcTargetSel[data-type="${type}"]`);
      const target = parseInt(targetSel ? targetSel.value : '3');
      const reward = parseInt(document.getElementById('bcRewardInput').value) || 40;
      const duration = parseInt(document.getElementById('bcDurationSel').value) * 1000 || 60000;
      if (reward < 20 || reward > 100) { document.getElementById('bcIssueErr').textContent = 'Reward must be 20–100 coins.'; return; }
      socket.emit('action', { type: 'baron_challenge_issue', challengeType: type, target, reward, duration });
      closeBaronChallengeOverlay();
    };
  }

  // ============================================================
  // COUNT'S EDICT OVERLAY
  // ============================================================
  function openCountChallengeOverlay() {
    if (!gameState || !gameState.self || gameState.self.myCourtTitle !== 'Count') return;
    const el = document.getElementById('countChallengeOverlay');
    if (!el) return;
    el.style.display = 'block';
    renderCountChallengeOverlay();
    for (const k in keys) keys[k] = false;
    syncInput();
  }

  function closeCountChallengeOverlay() {
    const el = document.getElementById('countChallengeOverlay');
    if (el) el.style.display = 'none';
  }

  function renderCountChallengeOverlay() {
    const el = document.getElementById('countChallengeOverlay');
    if (!el || !gameState || !gameState.self) return;
    const s = gameState.self;
    const coins = s.coins || 0;
    const ccActive = !!(window._countChallenge);

    if (ccActive) {
      const cc = window._countChallenge;
      const secsLeft = Math.max(0, Math.round((cc.expiresAt - Date.now()) / 1000));
      el.innerHTML = `
        <div style="background:linear-gradient(160deg,#1a1008,#2e1e0a);border:2px solid #996644;border-radius:12px;padding:20px 22px;min-width:280px;max-width:400px;color:#d8a070;font-family:sans-serif;position:relative;">
          <button onclick="closeCountChallengeOverlay()" style="position:absolute;top:10px;right:12px;background:none;border:none;color:#cd8c5a;font-size:18px;cursor:pointer;">✕</button>
          <div style="font-size:14px;font-weight:bold;color:#cd8c5a;margin-bottom:12px;">🥉 COUNT'S EDICT ACTIVE</div>
          <div style="font-size:13px;color:#d8a070;margin-bottom:8px;">${cc.desc}</div>
          <div style="font-size:11px;color:#a07848;">Reward: 🏆 ${cc.reward}c &nbsp;|&nbsp; Expires in ${secsLeft}s</div>
          <button onclick="socket.emit('action',{type:'count_challenge_cancel'});closeCountChallengeOverlay();" style="margin-top:14px;background:rgba(40,20,10,0.8);color:#ddaa88;border:1px solid #996644;border-radius:5px;font-size:11px;padding:6px 14px;cursor:pointer;">✕ Cancel Edict (50% refund)</button>
        </div>`;
      return;
    }

    const COUNT_TYPES = [
      { type: 'poop_npcs',  label: '💩 Poop NPCs',       desc: 'First to poop N NPCs/cars wins', targets: [2, 3, 5] },
      { type: 'deliver_egg',label: '🥚 Deliver Egg',      desc: 'First to deliver a golden egg wins', targets: [1] },
    ];

    let typeRows = COUNT_TYPES.map(ct => {
      const tgtOptions = ct.targets.map(t => `<option value="${t}">${t}</option>`).join('');
      return `<tr>
        <td style="padding:4px 6px;"><label><input type="radio" name="ccType" value="${ct.type}" ${ct.type === 'poop_npcs' ? 'checked' : ''}> ${ct.label}</label></td>
        <td style="padding:4px 6px;font-size:10px;color:#a07848;">${ct.desc}</td>
        <td style="padding:4px 6px;"><select class="ccTargetSel" data-type="${ct.type}" style="background:#2e1e0a;color:#cd8c5a;border:1px solid #996644;border-radius:3px;font-size:10px;">${tgtOptions}</select></td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div style="background:linear-gradient(160deg,#1a1008,#2e1e0a);border:2px solid #996644;border-radius:12px;padding:20px 22px;min-width:280px;max-width:420px;color:#d8a070;font-family:sans-serif;position:relative;">
        <button onclick="closeCountChallengeOverlay()" style="position:absolute;top:10px;right:12px;background:none;border:none;color:#cd8c5a;font-size:18px;cursor:pointer;">✕</button>
        <div style="font-size:14px;font-weight:bold;color:#cd8c5a;margin-bottom:4px;">🥉 ISSUE COUNT'S EDICT</div>
        <div style="font-size:11px;color:#886644;margin-bottom:10px;">A modest decree from the Count. Quick rewards for quick deeds. 50% refund if unclaimed.</div>
        <table style="width:100%;border-collapse:collapse;">
          ${typeRows}
        </table>
        <div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <label style="font-size:11px;color:#d8a070;">Reward: <input id="ccRewardInput" type="number" min="10" max="50" value="25" style="width:50px;background:#2e1e0a;color:#cd8c5a;border:1px solid #996644;border-radius:3px;padding:2px 4px;"> coins (balance: ${coins}c)</label>
          <label style="font-size:11px;color:#d8a070;">Duration: <select id="ccDurationSel" style="background:#2e1e0a;color:#cd8c5a;border:1px solid #996644;border-radius:3px;">
            <option value="30">30s</option>
            <option value="45" selected>45s</option>
            <option value="60">60s</option>
            <option value="90">90s</option>
          </select></label>
        </div>
        <div id="ccIssueErr" style="color:#ff6644;font-size:10px;margin-top:5px;min-height:14px;"></div>
        <button id="ccIssueBtn" style="margin-top:10px;background:linear-gradient(135deg,#4a2a08,#7a4a18);color:#cd8c5a;border:1px solid #99664488;border-radius:6px;font-size:12px;font-weight:bold;padding:7px 16px;cursor:pointer;width:100%;">🗒 ISSUE EDICT</button>
      </div>`;

    document.getElementById('ccIssueBtn').onclick = () => {
      const typeInput = el.querySelector('input[name="ccType"]:checked');
      if (!typeInput) { document.getElementById('ccIssueErr').textContent = 'Select a challenge type.'; return; }
      const type = typeInput.value;
      const targetSel = el.querySelector(`.ccTargetSel[data-type="${type}"]`);
      const target = parseInt(targetSel ? targetSel.value : '2');
      const reward = parseInt(document.getElementById('ccRewardInput').value) || 25;
      const duration = parseInt(document.getElementById('ccDurationSel').value) * 1000 || 45000;
      if (reward < 10 || reward > 50) { document.getElementById('ccIssueErr').textContent = 'Reward must be 10–50 coins.'; return; }
      socket.emit('action', { type: 'count_challenge_issue', challengeType: type, target, reward, duration });
      closeCountChallengeOverlay();
    };
  }

  // ============================================================
  // BARON'S NOBLE IMPORT OVERLAY
  // ============================================================
  function renderBaronImportOverlay(catalog) {
    const el = document.getElementById('baronImportOverlay');
    if (!el || !gameState || !gameState.self) return;
    const coins = gameState.self.coins || 0;

    const rows = catalog.map(item => {
      const canAfford = coins >= item.importCost;
      return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(160,192,255,0.1);">
        <span style="font-size:20px;width:28px;text-align:center;">${item.emoji}</span>
        <div style="flex:1;">
          <div style="font-size:11px;font-weight:bold;color:#c8d8ff;">${item.name}</div>
          <div style="font-size:9px;color:#8090a8;">${item.desc}</div>
        </div>
        <div style="text-align:right;min-width:80px;">
          <div style="font-size:9px;color:#8090a8;text-decoration:line-through;">${item.cost}c</div>
          <div style="font-size:11px;font-weight:bold;color:${canAfford ? '#a0c8ff' : '#666677'};">${item.importCost}c</div>
          <button onclick="baronImportBuy('${item.id}')" ${!canAfford ? 'disabled' : ''}
            style="margin-top:3px;background:${canAfford ? 'linear-gradient(135deg,#1a2050,#2a3580)' : 'rgba(40,40,60,0.5)'};color:${canAfford ? '#a0c8ff' : '#555'};border:1px solid ${canAfford ? '#6080c0' : '#333'};border-radius:4px;font-size:9px;padding:2px 8px;cursor:${canAfford ? 'pointer' : 'default'};">
            ${canAfford ? 'IMPORT' : 'Need coins'}
          </button>
        </div>
      </div>`;
    }).join('');

    el.innerHTML = `
      <div style="background:linear-gradient(160deg,#0c0c1e,#151530);border:2px solid #5070b0;border-radius:12px;padding:20px 22px;min-width:320px;max-width:440px;color:#b0c0e0;font-family:sans-serif;position:relative;box-shadow:0 0 30px rgba(80,120,200,0.3);">
        <button onclick="closeBaronImportOverlay()" style="position:absolute;top:10px;right:12px;background:none;border:none;color:#a0b0d0;font-size:18px;cursor:pointer;">✕</button>
        <div style="font-size:15px;font-weight:bold;color:#c8d8ff;margin-bottom:2px;">📦 NOBLE IMPORT</div>
        <div style="font-size:10px;color:#7080a0;margin-bottom:12px;">Baron's privilege: buy any Black Market item remotely.<br>20% import fee applies. One use per Baron tenure.</div>
        <div style="font-size:10px;color:#8090a8;margin-bottom:10px;">Balance: <span style="color:#c8d8ff;font-weight:bold;">${coins}c</span></div>
        ${rows}
        <div style="font-size:9px;color:#556070;margin-top:10px;text-align:center;">No proximity required — noble connections have their privileges.</div>
      </div>`;
    el.style.display = 'block';
    for (const k in keys) keys[k] = false;
    syncInput();
  }

  function closeBaronImportOverlay() {
    const el = document.getElementById('baronImportOverlay');
    if (el) el.style.display = 'none';
  }

  window.baronImportBuy = function(itemId) {
    socket.emit('action', { type: 'baron_noble_import', itemId });
    closeBaronImportOverlay();
  };

  // ============================================================
  // PIGEON MAFIA DON OVERLAY
  // ============================================================
  function openDonOverlay() {
    if (!gameState || !gameState.nearDon) return;
    showDonOverlay();
  }

  function updateTournamentHud() {
    // Force refresh of active buffs pill (which includes tournament status)
    if (typeof updateActiveBuffsHud === 'function') updateActiveBuffsHud();
    // Refresh Don overlay if open
    if (donOverlayVisible) renderDonOverlay();
  }

  function showDonOverlay() {
    if (!gameState || !gameState.nearDon) return;
    donOverlayVisible = true;
    donOverlay.style.display = 'block';
    // Stop movement while talking to Don
    for (const k in keys) keys[k] = false;
    syncInput();
    renderDonOverlay();
  }

  function hideDonOverlay() {
    donOverlayVisible = false;
    donOverlay.style.display = 'none';
  }

  function renderDonOverlay() {
    if (!gameState) return;
    const rep = gameState.mafiaRep || 0;
    const title = gameState.mafiaTitle;
    const repBadge = document.getElementById('donRepBadge');
    const titleStr = title ? `[${title}]` : '[Civilian]';
    repBadge.textContent = `🎖 REP: ${rep} — ${titleStr}`;

    const hasMission = !!(gameState.donMission);
    const hasJob = !!(gameState.donCurrentJob);

    document.getElementById('donActiveMission').style.display = hasMission ? 'block' : 'none';
    document.getElementById('donAcceptBtn').style.display = (!hasMission && hasJob) ? 'inline-block' : 'none';
    document.getElementById('donNoJob').style.display = (!hasJob) ? 'block' : 'none';
    document.getElementById('donJobCard').style.display = hasJob ? 'block' : 'none';

    if (hasJob) {
      const job = gameState.donCurrentJob;
      document.getElementById('donJobTitle').textContent = job.title;
      document.getElementById('donJobDesc').textContent = job.desc;
      document.getElementById('donJobRewards').textContent =
        `💰 ${job.coinReward}c  +${job.xpReward} XP  +1 REP`;
    }

    if (hasMission) {
      const dm = gameState.donMission;
      document.getElementById('donActiveTitle').textContent = dm.title;
      const timeLeftS = Math.ceil((dm.timeLeft || 0) / 1000);
      const pct = dm.target > 0 ? Math.min(100, Math.round(dm.progress / dm.target * 100)) : 0;
      document.getElementById('donActiveProgress').textContent =
        `Progress: ${dm.progress}/${dm.target} (${pct}%) — ${timeLeftS}s left`;
    }

    // === PLACE A HIT SECTION ===
    let hitSectionEl = document.getElementById('donHitSection');
    if (!hitSectionEl) {
      hitSectionEl = document.createElement('div');
      hitSectionEl.id = 'donHitSection';
      // Insert before close button row
      const closeRow = document.querySelector('#donOverlay > div:last-child');
      if (closeRow) donOverlay.insertBefore(hitSectionEl, closeRow);
      else donOverlay.appendChild(hitSectionEl);
    }

    const myCoins = gameState.self ? gameState.self.coins || 0 : 0;
    const onlineBirds = gameState.onlineBirdsForHit;
    const canAffordHit = myCoins >= 100;

    let hitHtml = `<div style="margin-top:12px;border-top:1px solid #440000;padding-top:10px;">`;
    hitHtml += `<div style="color:#ff4444;font-size:11px;font-weight:bold;margin-bottom:6px;">💀 PLACE A HIT — 100c</div>`;
    hitHtml += `<div style="color:#cc8888;font-size:9px;margin-bottom:8px;">3 poop hits to claim bounty. Pays ${Math.max(250, 250 + (gameState.mafiaRep||0)*4)}c+</div>`;

    if (!onlineBirds || onlineBirds.length === 0) {
      hitHtml += `<div style="color:#555;font-size:10px;font-style:italic;">No other birds online to mark.</div>`;
    } else if (!canAffordHit) {
      hitHtml += `<div style="color:#664444;font-size:10px;font-style:italic;">Need 100c to place a hit.</div>`;
    } else {
      hitHtml += `<div style="max-height:100px;overflow-y:auto;">`;
      for (const b of onlineBirds) {
        if (b.hasActiveHit) {
          hitHtml += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;opacity:0.5;">`;
          hitHtml += `<span style="color:#ff6666;font-size:10px;">🎯 ${b.name}</span>`;
          hitHtml += `<span style="color:#ff4444;font-size:9px;">MARKED</span>`;
          hitHtml += `</div>`;
        } else {
          hitHtml += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">`;
          hitHtml += `<span style="color:#ddaaaa;font-size:10px;">${b.name} (${b.coins}c)</span>`;
          hitHtml += `<button class="don-hit-btn" data-id="${b.id}" data-name="${b.name}"`;
          hitHtml += ` style="background:#660000;color:#ff8888;border:1px solid #aa2222;border-radius:4px;font-size:9px;padding:2px 6px;cursor:pointer;">`;
          hitHtml += `HIT −100c</button>`;
          hitHtml += `</div>`;
        }
      }
      hitHtml += `</div>`;
    }
    hitHtml += `</div>`;
    hitSectionEl.innerHTML = hitHtml;

    // Wire up hit buttons
    hitSectionEl.querySelectorAll('.don-hit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.id;
        const targetName = btn.dataset.name;
        if (!targetId || !socket || !joined) return;
        if (!confirm(`Place a 100c hit on ${targetName}? Bounty hunter earns ~${Math.max(250, 250 + (gameState.mafiaRep||0)*4)}c for 3 hits.`)) return;
        socket.emit('action', { type: 'place_hit', targetId });
        hideDonOverlay();
      });
    });

    // === SKILL RESPEC SECTION ===
    let respecSectionEl = document.getElementById('donRespecSection');
    if (!respecSectionEl) {
      respecSectionEl = document.createElement('div');
      respecSectionEl.id = 'donRespecSection';
      const closeRow = document.querySelector('#donOverlay > div:last-child');
      if (closeRow) donOverlay.insertBefore(respecSectionEl, closeRow);
      else donOverlay.appendChild(respecSectionEl);
    }

    const selfData = gameState.self || {};
    const mySkills = selfData.skillTreeUnlocked || [];
    const myCoinsNow = selfData.coins || 0;
    const isMaster = selfData.skillTreeMaster || false;
    const RESPEC_COST = 500;
    const canAffordRespec = myCoinsNow >= RESPEC_COST;
    const hasSkills = mySkills.length > 0;
    const defs = selfData.skillTreeDefs || {};
    const fpToRefund = mySkills.reduce((sum, id) => sum + ((defs[id] && defs[id].cost) || 0), 0);

    let respecHtml = `<div style="margin-top:12px;border-top:1px solid #224422;padding-top:10px;">`;
    respecHtml += `<div style="color:#44ddaa;font-size:11px;font-weight:bold;margin-bottom:4px;">🔄 SKILL RESPEC — 500c</div>`;
    respecHtml += `<div style="color:#88aa88;font-size:9px;margin-bottom:8px;">Reset your entire skill tree and get all Feather Points back. Mastery badge is lost.</div>`;

    if (!hasSkills) {
      respecHtml += `<div style="color:#446644;font-size:10px;font-style:italic;">No skills to respec yet.</div>`;
    } else if (!canAffordRespec) {
      respecHtml += `<div style="color:#446644;font-size:10px;">Need 500c. You have ${myCoinsNow}c. Earn more and come back.</div>`;
    } else {
      const label = isMaster ? '🔄 RESPEC (loses ✨ MASTER)' : '🔄 RESPEC SKILLS';
      respecHtml += `<div style="display:flex;justify-content:space-between;align-items:center;">`;
      respecHtml += `<span style="color:#aaddaa;font-size:9px;">Refunds: +${fpToRefund} FP · Costs: 500c</span>`;
      respecHtml += `<button id="donRespecBtn" style="background:#224422;color:#88ffaa;border:1px solid #44aa44;border-radius:4px;font-size:9px;padding:3px 8px;cursor:pointer;">${label}</button>`;
      respecHtml += `</div>`;
    }
    respecHtml += `</div>`;
    respecSectionEl.innerHTML = respecHtml;

    const respecBtn = document.getElementById('donRespecBtn');
    if (respecBtn) {
      respecBtn.addEventListener('click', () => {
        if (!socket || !joined) return;
        const masterWarn = isMaster ? '\n⚠️ You will lose your ✨ MASTER badge!' : '';
        if (!confirm(`Reset ALL skill tree unlocks for 500c?\n+${fpToRefund} FP will be refunded.${masterWarn}\n\nThis cannot be undone.`)) return;
        socket.emit('action', { type: 'don_respec' });
        hideDonOverlay();
      });
    }

    // === FIGHTING CHAMPIONSHIP SECTION ===
    let tournamentSectionEl = document.getElementById('donTournamentSection');
    if (!tournamentSectionEl) {
      tournamentSectionEl = document.createElement('div');
      tournamentSectionEl.id = 'donTournamentSection';
      const closeRow = document.querySelector('#donOverlay > div:last-child');
      if (closeRow) donOverlay.insertBefore(tournamentSectionEl, closeRow);
      else donOverlay.appendChild(tournamentSectionEl);
    }

    const t = gameState.tournament;
    const myCoinsForTour = selfData.coins || 0;
    const myMafiaRep = selfData.mafiaRep || 0;
    const hasVip = t && t.hasVipDiscount;
    const effectiveFee = t ? (t.vipFee || t.entryFee) : 100;
    let tourHtml = `<div style="margin-top:12px;border-top:1px solid #663300;padding-top:10px;">`;
    tourHtml += `<div style="color:#ff8844;font-size:11px;font-weight:bold;margin-bottom:4px;">🥊 FIGHTING CHAMPIONSHIP</div>`;

    if (!t || t.state === 'idle' || t.state === 'done') {
      const nextSec = t ? Math.max(0, Math.ceil((t.nextAt - Date.now()) / 1000)) : 0;
      const nextMin = Math.ceil(nextSec / 60);
      const feeNote = hasVip ? `<span style="color:#ffd700;"> · VIP: ${effectiveFee}c 🎖</span>` : '';
      tourHtml += `<div style="color:#886655;font-size:9px;">Next tournament in ~${nextMin > 0 ? nextMin + 'm' : 'soon'}. Entry: ${t ? t.entryFee : 100}c${feeNote}. Last bird standing wins the pot!</div>`;
      if (t && t.champion) {
        const champTag = t.champion.gangTag ? `[${t.champion.gangTag}] ` : '';
        tourHtml += `<div style="color:#ff9944;font-size:10px;margin-top:4px;">🏆 Last champion: ${champTag}${t.champion.name}</div>`;
      }
    } else if (t.state === 'signup') {
      const secsLeft = Math.max(0, Math.ceil((t.signupUntil - Date.now()) / 1000));
      tourHtml += `<div style="color:#ffcc88;font-size:10px;margin-bottom:6px;">🔔 SIGNUP OPEN — ${secsLeft}s left · ${t.entrantCount}/8 birds entered · Pot: ${t.pot}c</div>`;
      if (t.entrantCount > 0) {
        tourHtml += `<div style="color:#cc9966;font-size:9px;margin-bottom:6px;">Entrants: ${t.entrants.map(e => e.name).join(', ')}</div>`;
      }
      if (t.isEntered) {
        tourHtml += `<div style="color:#44ff88;font-size:10px;font-weight:bold;">✅ YOU'RE IN! Good luck, fighter.</div>`;
      } else if (myCoinsForTour < effectiveFee) {
        const discountNote = hasVip ? ` (VIP 🎖: ${effectiveFee}c)` : '';
        tourHtml += `<div style="color:#886644;font-size:9px;">Need ${effectiveFee}c${discountNote} to enter. You have ${myCoinsForTour}c.</div>`;
      } else {
        const discountNote = hasVip ? ` <span style="color:#ffd700;font-size:9px;">(🎖 Capo Discount!)</span>` : '';
        tourHtml += `<button id="donTournamentJoinBtn" style="background:#662200;color:#ffaa44;border:1.5px solid #ff6622;border-radius:6px;font-size:10px;padding:5px 14px;cursor:pointer;font-weight:bold;">🥊 JOIN TOURNAMENT — ${effectiveFee}c${hasVip ? ' 🎖' : ''}</button>${discountNote}`;
      }
    } else if (t.state === 'fighting') {
      tourHtml += `<div style="color:#ffaa44;font-size:10px;font-weight:bold;margin-bottom:4px;">⚔️ ROUND ${t.round} IN PROGRESS — Pot: ${t.pot}c</div>`;
      if (t.bracket) {
        for (const m of t.bracket) {
          const winner = m.winner ? t.entrants.find(e => e.birdId === m.winner) : null;
          const winnerName = winner ? winner.name : (m.winner ? '???' : null);
          if (m.bye) {
            tourHtml += `<div style="color:#888;font-size:9px;">• ${m.bird1Name} (BYE ➜ advances)</div>`;
          } else if (winnerName) {
            tourHtml += `<div style="color:#88ff88;font-size:9px;">✅ ${winnerName} WINS vs ${m.bird1Name === winnerName ? m.bird2Name : m.bird1Name}</div>`;
          } else {
            const b1IsMe = m.bird1Id === myId;
            const b2IsMe = m.bird2Id === myId;
            const style = (b1IsMe || b2IsMe) ? 'color:#ff9966;font-weight:bold' : 'color:#cc8844';
            tourHtml += `<div style="${style};font-size:9px;">🥊 ${m.bird1Name} vs ${m.bird2Name}${(b1IsMe || b2IsMe) ? ' ← YOU' : ''}</div>`;
          }
        }
      }
    }

    // === CHAMPIONSHIP LEADERBOARD ===
    const leaderboard = gameState.championshipLeaderboard || [];
    const myWins = selfData.tournamentWins || 0;
    tourHtml += `<div style="margin-top:10px;border-top:1px dashed #663300;padding-top:8px;">`;
    tourHtml += `<div style="color:#ffaa66;font-size:10px;font-weight:bold;margin-bottom:4px;">🏆 ALL-TIME CHAMPIONS</div>`;
    if (leaderboard.length === 0) {
      tourHtml += `<div style="color:#664433;font-size:9px;font-style:italic;">No champions yet — be the first!</div>`;
    } else {
      leaderboard.forEach((entry, i) => {
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        const tag = entry.gangTag ? `[${entry.gangTag}] ` : '';
        const prestigeDots = entry.prestige > 0 ? ' ' + '⚜️'.repeat(Math.min(entry.prestige, 3)) : '';
        const champ = entry.fightingChampBadge ? ' 🥊' : '';
        tourHtml += `<div style="color:${i === 0 ? '#ffd700' : '#cc9966'};font-size:9px;">`;
        tourHtml += `${medals[i] || '•'} ${tag}${entry.name}${prestigeDots}${champ} — ${entry.wins} win${entry.wins !== 1 ? 's' : ''}`;
        tourHtml += `</div>`;
      });
    }
    if (myWins > 0) {
      tourHtml += `<div style="color:#44ff88;font-size:9px;margin-top:4px;">Your wins: ${myWins} 🥊</div>`;
    }
    tourHtml += `</div>`;

    tourHtml += `</div>`;
    tournamentSectionEl.innerHTML = tourHtml;

    const joinBtn = document.getElementById('donTournamentJoinBtn');
    if (joinBtn) {
      joinBtn.addEventListener('click', () => {
        if (!socket || !joined) return;
        socket.emit('action', { type: 'don_tournament_join' });
      });
    }
  }

  function renderBmShop() {
    if (!gameState || !gameState.self) return;
    const coins = gameState.self.coins || 0;
    document.getElementById('bmCoinsVal').textContent = coins;

    const itemsEl = document.getElementById('bmShopItems');
    let html = '';
    for (const item of BM_CATALOG) {
      const canAfford = coins >= item.cost;
      html += '<div class="bm-item">';
      html += '<div class="bm-item-emoji">' + item.emoji + '</div>';
      html += '<div class="bm-item-info">';
      html += '<div class="bm-item-name">' + item.name + '</div>';
      html += '<div class="bm-item-desc">' + item.desc + '</div>';
      html += '</div>';
      html += '<button class="bm-buy-btn' + (canAfford ? '' : ' disabled') + '" data-item="' + item.id + '">' + item.cost + 'c</button>';
      html += '</div>';
    }
    itemsEl.innerHTML = html;

    // Wire up buy buttons
    itemsEl.querySelectorAll('.bm-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.item;
        if (btn.classList.contains('disabled')) return;
        if (socket && joined) {
          socket.emit('action', { type: 'blackmarket_buy', itemId });
        }
      });
    });
  }

  // ============================================================
  // DAILY CHALLENGES PANEL
  // ============================================================
  function showDailyPanel() {
    dailyPanelVisible = true;
    dailyPanel.style.display = 'block';
    for (const k in keys) keys[k] = false;
    syncInput();
    renderDailyPanel();
  }

  function hideDailyPanel() {
    dailyPanelVisible = false;
    dailyPanel.style.display = 'none';
  }

  function renderDailyPanel() {
    if (!gameState || !gameState.self) return;
    const self = gameState.self;
    const challenges = self.dailyChallenges || [];
    const streak = self.dailyStreak || 0;
    const mult = self.dailyStreakMult || 1.0;
    const completed = self.dailyCompleted || 0;

    // Reset timer: seconds until next UTC midnight
    const now = new Date();
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    const secsLeft = Math.floor((midnight - now) / 1000);
    const h = Math.floor(secsLeft / 3600);
    const m = Math.floor((secsLeft % 3600) / 60);
    const timerEl = document.getElementById('dailyResetTimer');
    if (timerEl) timerEl.textContent = 'Resets in ' + h + 'h ' + m + 'm';

    // Streak badge
    const streakEl = document.getElementById('dailyStreakBadge');
    if (streakEl) {
      if (streak >= 7) {
        streakEl.innerHTML = '<span style="color:#ff8800;font-size:13px;">🔥 ' + streak + '-Day Streak! — <span style="color:#ffd700;">' + (mult * 100).toFixed(0) + '% rewards</span></span>';
      } else if (streak >= 2) {
        streakEl.innerHTML = '<span style="color:#ffaa44;font-size:12px;">🔥 ' + streak + '-Day Streak — ' + (mult * 100).toFixed(0) + '% rewards</span>';
      } else {
        streakEl.innerHTML = '<span style="color:#7799cc;font-size:11px;">Start a streak — complete all 3 for 3+ days for bonus rewards!</span>';
      }
    }

    // Challenge list
    const listEl = document.getElementById('dailyChallengeList');
    if (!listEl) return;
    let html = '';
    for (const c of challenges) {
      const pct = Math.min(1, (c.progress || 0) / c.target);
      const barW = Math.floor(pct * 100);
      const done = c.completed;
      const icon = done ? '✅' : (pct > 0 ? '🔘' : '⬜');
      const baseColor = done ? '#44cc44' : (pct > 0 ? '#ffd700' : '#7799cc');
      html += '<div style="margin-bottom:12px;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<span style="color:' + baseColor + ';font-weight:bold;">' + icon + ' ' + c.title + '</span>';
      html += '<span style="color:#aaddff;font-size:10px;">' + (c.progress || 0) + '/' + c.target + '</span>';
      html += '</div>';
      html += '<div style="font-size:10px;color:#88aacc;margin:2px 0 4px;">' + c.desc + '</div>';
      html += '<div style="background:#112233;border-radius:4px;height:6px;overflow:hidden;">';
      html += '<div style="background:' + (done ? '#44cc44' : '#3399ff') + ';width:' + barW + '%;height:100%;transition:width 0.3s;"></div>';
      html += '</div>';
      html += '<div style="font-size:10px;color:#88aacc;margin-top:2px;">Reward: ';
      const xpR = Math.floor(c.reward.xp * mult);
      const coinsR = Math.floor(c.reward.coins * mult);
      html += '<span style="color:#44ff88">+' + xpR + ' XP</span>  <span style="color:#ffd700">+' + coinsR + 'c</span>';
      if (mult > 1.0) html += ' <span style="color:#ff8800">(×' + mult.toFixed(2) + ' streak bonus!)</span>';
      html += '</div>';
      html += '</div>';
    }
    if (challenges.length === 0) {
      html = '<div style="color:#7799cc;text-align:center;padding:10px;">Connecting...</div>';
    }
    listEl.innerHTML = html;

    // Bonus note
    const bonusEl = document.getElementById('dailyBonusNote');
    if (bonusEl) {
      if (completed >= challenges.length && challenges.length > 0) {
        bonusEl.innerHTML = '<span style="color:#44ff88;font-size:12px;">🎉 ALL DONE TODAY! +200 XP +100c bonus claimed!</span>';
      } else {
        bonusEl.textContent = 'Complete all ' + challenges.length + ' for +200 XP +100c bonus!';
      }
    }
  }

  function updateDailyHudIndicator() {
    if (!dailyHudIndicator || !joined) return;
    if (!gameState || !gameState.self) { dailyHudIndicator.style.display = 'none'; return; }
    const self = gameState.self;
    const challenges = self.dailyChallenges || [];
    const completed = self.dailyCompleted || 0;
    const streak = self.dailyStreak || 0;
    dailyHudIndicator.style.display = 'block';
    const allDone = completed >= challenges.length && challenges.length > 0;
    const streakStr = streak >= 2 ? (' 🔥' + streak) : '';
    dailyHudIndicator.textContent = '📅 ' + completed + '/' + challenges.length + (allDone ? ' ✓' : '') + streakStr;
    dailyHudIndicator.style.borderColor = allDone ? '#44cc44' : '#3399ff';
    dailyHudIndicator.style.color = allDone ? '#44cc44' : '#ffd700';
  }

  function updatePrestigeHudPill() {
    const pill = document.getElementById('prestigeHudPill');
    if (!pill || !joined || !gameState || !gameState.self) {
      if (pill) pill.style.display = 'none';
      return;
    }
    const prestige = gameState.self.prestige || 0;
    const threshold = gameState.self.prestigeThreshold || 10000;
    if (prestige <= 0) {
      // Show "⚜️ [U]" pill only when close to prestige threshold
      const totalXP = gameState.self.xp || 0;
      if (totalXP >= threshold * 0.9) {
        pill.style.display = 'block';
        pill.textContent = '⚜️ PRESTIGE READY [U]';
        pill.style.borderColor = '#cc44ff';
        pill.style.color = '#cc88ff';
      } else {
        pill.style.display = 'none';
      }
    } else {
      const badges = ['', '⚜️', '⚜️⚜️', '⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️⚜️'];
      pill.style.display = 'block';
      pill.textContent = badges[Math.min(prestige, 5)] + ' [U]';
      pill.style.borderColor = prestige >= 5 ? '#ffd700' : '#7733cc';
      pill.style.color = prestige >= 5 ? '#ffd700' : '#cc88ff';
    }
  }
  // Wire prestige HUD pill click
  const _prestigeHudPill = document.getElementById('prestigeHudPill');
  if (_prestigeHudPill) {
    _prestigeHudPill.addEventListener('click', () => {
      if (prestigePanelVisible) hidePrestigePanel(); else showPrestigePanel();
    });
  }

  function updateActiveBuffsHud() {
    const el = document.getElementById('activeBuffsHud');
    if (!el || !gameState || !gameState.self) {
      if (el) el.innerHTML = '';
      return;
    }
    const s = gameState.self;
    const now = Date.now();
    let html = '';

    if (s.bmSpeedUntil && s.bmSpeedUntil > now) {
      const secs = Math.ceil((s.bmSpeedUntil - now) / 1000);
      html += '<div class="bm-buff-pill">💉 Speed ×1.6 — ' + secs + 's</div>';
    }
    if (s.bmMegaPoops && s.bmMegaPoops > 0) {
      html += '<div class="bm-buff-pill">💣 Mega Poop ×' + s.bmMegaPoops + '</div>';
    }
    if (s.bmSmokeBombUntil && s.bmSmokeBombUntil > now) {
      const secs = Math.ceil((s.bmSmokeBombUntil - now) / 1000);
      html += '<div class="bm-buff-pill">💨 Smoke — ' + secs + 's</div>';
    }
    if (s.bmDoubleXpUntil && s.bmDoubleXpUntil > now) {
      const secs = Math.ceil((s.bmDoubleXpUntil - now) / 1000);
      html += '<div class="bm-buff-pill">🍀 2× XP — ' + Math.floor(secs / 60) + 'm' + (secs % 60) + 's</div>';
    }
    if (s.hailSlowUntil && s.hailSlowUntil > now) {
      const secs = Math.ceil((s.hailSlowUntil - now) / 1000);
      html += '<div class="bm-buff-pill" style="background:rgba(40,80,140,0.7);border-color:#aaddff;color:#aaddff">🧊 HAIL SLOW — ' + secs + 's</div>';
    }
    // Blizzard: show WARM buff if hot cocoa active, near firepit, or CHILLY debuff otherwise
    if (weatherState && weatherState.type === 'blizzard') {
      if (s.onIceRink) {
        html += '<div class="bm-buff-pill" style="background:rgba(0,60,120,0.92);border-color:#88ddff;color:#cceeff;animation:kingpinGlow 0.5s ease-in-out infinite alternate;font-weight:bold;">⛸️ ON ICE — SLIDING! +30% SPD · Minimal control</div>';
      } else if (s.nearNestFirepit) {
        html += '<div class="bm-buff-pill" style="background:rgba(100,40,0,0.92);border-color:#ff8822;color:#ffcc66;animation:kingpinGlow 0.8s ease-in-out infinite alternate;font-weight:bold;">🔥 GANG FIREPIT — +25% SPD · Warm and cozy!</div>';
      } else if (s.warmUntil && s.warmUntil > now) {
        const secs = Math.ceil((s.warmUntil - now) / 1000);
        html += '<div class="bm-buff-pill" style="background:rgba(100,50,0,0.85);border-color:#ffaa44;color:#ffcc66;">☕ WARM +25% SPD — ' + secs + 's</div>';
      } else {
        html += '<div class="bm-buff-pill" style="background:rgba(10,30,70,0.85);border-color:#aaeeff;color:#cceeff;animation:kingpinGlow 1.2s ease-in-out infinite alternate;">❄️ CHILLY! −12% speed · Find hot cocoa!</div>';
      }
    }
    // Heatwave: show QUENCHED buff when fresh, or THIRSTY debuff when low on food
    if (weatherState && weatherState.type === 'heatwave') {
      if (s.heatQuenchedUntil && s.heatQuenchedUntil > now) {
        const secs = Math.ceil((s.heatQuenchedUntil - now) / 1000);
        html += '<div class="bm-buff-pill" style="background:rgba(0,60,140,0.85);border-color:#44aaff;color:#88ddff;">💧 QUENCHED — ' + secs + 's</div>';
      } else if (s.food !== undefined && s.food < 15) {
        html += '<div class="bm-buff-pill" style="background:rgba(140,50,0,0.85);border-color:#ff7700;color:#ffaa44;animation:pulseRed 0.7s infinite alternate;">🌡️ THIRSTY! −15% speed · Drink a puddle!</div>';
      }
    }
    if (s.raceBoostUntil && s.raceBoostUntil > now) {
      const secs = Math.max(0, Math.ceil((s.raceBoostUntil - now) / 1000));
      html += '<div class="bm-buff-pill" style="background:rgba(100,90,0,0.85);border-color:#ffff44;color:#ffff44;animation:kingpinGlow 0.4s ease-in-out infinite alternate;">⚡ BOOST ×1.7 — ' + secs + 's</div>';
    }
    // Thunder Dome: inside (trapped + bonus) or nearby (invitation)
    const _domeSelf = gameState.thunderDome || window._thunderDomeData;
    if (_domeSelf) {
      if (s.insideThunderDome) {
        const secsLeft = Math.max(0, Math.ceil((_domeSelf.endsAt - now) / 1000));
        const mins = Math.floor(secsLeft / 60);
        const rem = secsLeft % 60;
        const inCrimeWave = !!(gameState.crimeWave);
        const inKingpinDome = !!(gameState.kingpin && gameState.kingpin.inDome);
        if (inCrimeWave) {
          // Thunder Dome × Crime Wave: ×3 heat — blazing danger pill
          html += `<div class="bm-buff-pill" style="background:rgba(80,0,0,0.95);border-color:#ff4422;color:#ff8866;animation:pulseRed 0.4s infinite alternate;font-weight:bold;">⚡🚨 DOME + CRIME WAVE — ×3 HEAT! Wanted in here? You're dead! ${mins}:${rem.toString().padStart(2,'0')}</div>`;
        } else if (inKingpinDome) {
          // Thunder Dome × Kingpin: electric crown prize
          html += `<div class="bm-buff-pill" style="background:rgba(0,20,70,0.95);border-color:#4499ff;color:#88ccff;animation:kingpinGlow 0.4s ease-in-out infinite alternate;font-weight:bold;">⚡👑 DOME + KINGPIN — Hit ${gameState.kingpin.birdName} for +100 XP BONUS! ${mins}:${rem.toString().padStart(2,'0')}</div>`;
        } else {
          html += `<div class="bm-buff-pill" style="background:rgba(0,25,80,0.95);border-color:#4499ff;color:#88ccff;animation:kingpinGlow 0.55s ease-in-out infinite alternate;font-weight:bold;">⚡ INSIDE THUNDER DOME — +50% XP! ${mins}:${rem.toString().padStart(2,'0')} left · TRAPPED</div>`;
        }
      } else {
        const secsLeft = Math.max(0, Math.ceil((_domeSelf.endsAt - now) / 1000));
        html += `<div class="bm-buff-pill" style="background:rgba(0,15,50,0.85);border-color:#2255aa;color:#4488cc;">⚡ THUNDER DOME — ${_domeSelf.district} · Fly in for +50% XP (${Math.floor(secsLeft/60)}:${(secsLeft%60).toString().padStart(2,'0')})</div>`;
      }
    }
    if (s.puddleBoostUntil && s.puddleBoostUntil > now) {
      const secs = Math.max(0, Math.ceil((s.puddleBoostUntil - now) / 1000));
      html += '<div class="bm-buff-pill" style="background:rgba(0,80,120,0.85);border-color:#55ccff;color:#55ccff;animation:kingpinGlow 0.6s ease-in-out infinite alternate;">💧 REFRESHED ×1.2 — ' + secs + 's</div>';
    }
    if (s.myHitBounty) {
      const secsLeft = Math.max(0, Math.ceil((s.myHitBounty.expiresAt - now) / 1000));
      html += '<div class="bm-buff-pill" style="background:rgba(80,0,0,0.85);border-color:#ff2222;color:#ff8888;animation:pulseRed 0.8s infinite alternate;">💀 BOUNTY: ' + s.myHitBounty.reward + 'c — ' + Math.floor(secsLeft / 60) + 'm' + (secsLeft % 60) + 's</div>';
    }
    if (s.isKingpin) {
      const decreeNote = s.kingpinDecreesAvailable >= 2 ? ' ×2 DECREES (LEGEND POWER)' : '';
      html += `<div class="bm-buff-pill" style="background:rgba(100,80,0,0.9);border-color:#ffd700;color:#ffd700;animation:kingpinGlow 1.2s ease-in-out infinite alternate;font-weight:bold;">👑 KINGPIN — You earn tribute! Stay rich!${decreeNote}</div>`;
      if (s.kingpinDecreesAvailable > 0 && !gameState.activeDecree) {
        html += '<div class="bm-buff-pill" style="background:rgba(120,90,0,0.95);border-color:#ffcc00;color:#ffe044;animation:kingpinGlow 0.5s ease-in-out infinite alternate;cursor:pointer;font-weight:bold;" onclick="toggleDecreePanel()">⚜️ DECREE READY — Press [O] to govern!</div>';
      }
    }
    // Royal Court title pill — Duke, Baron, Count
    if (s.myCourtTitle) {
      const COURT_STYLES = {
        Duke:  { bg: 'rgba(55,38,0,0.92)',   border: '#d4a800', color: '#ffd700', anim: 'kingpinGlow 1.4s ease-in-out infinite alternate' },
        Baron: { bg: 'rgba(35,35,50,0.92)',  border: '#9090a0', color: '#d0d0e0', anim: 'kingpinGlow 2s ease-in-out infinite alternate' },
        Count: { bg: 'rgba(50,28,8,0.92)',   border: '#9a6535', color: '#cd8c5a', anim: 'kingpinGlow 2.5s ease-in-out infinite alternate' },
      };
      const COURT_EMOJIS = { Duke: '👑', Baron: '🥈', Count: '🥉' };
      const cs = COURT_STYLES[s.myCourtTitle] || COURT_STYLES.Count;
      const em = COURT_EMOJIS[s.myCourtTitle] || '';
      html += `<div class="bm-buff-pill" style="background:${cs.bg};border-color:${cs.border};color:${cs.color};animation:${cs.anim};font-weight:bold;">${em} ${s.myCourtTitle.toUpperCase()} — Noble tribute flows every 30s</div>`;
    }
    // Noble Perk pills — Baron Import available + Count Intel available/active
    if (s.myCourtTitle === 'Baron' && !s.baronImportUsed) {
      html += `<div class="bm-buff-pill" style="background:rgba(18,18,40,0.92);border-color:#6080c0;color:#a0c8ff;animation:kingpinGlow 2s ease-in-out infinite alternate;cursor:pointer;font-weight:bold;" onclick="socket.emit('action',{type:'baron_noble_import',itemId:null})">📦 NOBLE IMPORT READY — Click to buy BM item remotely</div>`;
    }
    if (s.myCourtTitle === 'Count' && !s.countIntelUsed) {
      html += `<div class="bm-buff-pill" style="background:rgba(18,30,12,0.92);border-color:#507040;color:#a0d880;animation:kingpinGlow 2.5s ease-in-out infinite alternate;cursor:pointer;font-weight:bold;" onclick="socket.emit('action',{type:'count_city_intel'})">📡 CITY INTEL READY — Click to pre-reveal next weather</div>`;
    }
    // Count's Intel active tip — show as a subtle reminder
    if (window._countIntelTip) {
      const tip = window._countIntelTip;
      html += `<div class="bm-buff-pill" style="background:rgba(25,45,15,0.92);border-color:#60a040;color:#c0f0a0;font-weight:bold;">🥉 INTEL: ${tip.emoji} ${tip.label.toUpperCase()} coming! Bet it!</div>`;
    }

    // King's Pardon: show green legal immunity pill when pardoned
    if (s.pardonedUntil && s.pardonedUntil > now) {
      const secs = Math.ceil((s.pardonedUntil - now) / 1000);
      const mins = Math.floor(secs / 60);
      const rem = secs % 60;
      html += `<div class="bm-buff-pill" style="background:rgba(10,80,40,0.92);border-color:#44cc88;color:#88ffaa;animation:kingpinGlow 1.2s ease-in-out infinite alternate;font-weight:bold;">👑 PARDONED — ${mins > 0 ? mins + 'm ' : ''}${rem}s · Cops stand down</div>`;
    }
    // People's Revolt window — pulse for non-Kingpin birds while window is open
    if (!s.isKingpin && window._revoltWindowUntil && window._revoltWindowUntil > now) {
      const secs = Math.ceil((window._revoltWindowUntil - now) / 1000);
      html += `<div class="bm-buff-pill" style="background:rgba(100,0,0,0.92);border-color:#ff4444;color:#ffaaaa;animation:pulseRed 0.5s infinite alternate;cursor:pointer;font-weight:bold;" onclick="window._poopToRevolt()">🏴 REVOLT — ${secs}s! POOP THE KINGPIN! (3 needed)</div>`;
    }
    // Active Royal Decree — shown to ALL players
    if (gameState.activeDecree) {
      const d = gameState.activeDecree;
      const secs = Math.max(0, Math.ceil((d.endsAt - now) / 1000));
      if (secs > 0) {
        const decInfo = { gold_rush: { icon: '👑', label: 'GOLD RUSH 2× COINS', c: '#ffd700' }, royal_amnesty: { icon: '🛡️', label: 'ROYAL AMNESTY — NO COPS', c: '#44aaff' } };
        const di = decInfo[d.type];
        if (di) {
          html += `<div class="bm-buff-pill" style="background:rgba(80,60,0,0.95);border-color:${di.c};color:${di.c};animation:kingpinGlow 0.8s ease-in-out infinite alternate;font-weight:bold;">⚜️ ${di.icon} ${di.label} — ${secs}s</div>`;
        }
      }
    }

    // === MYSTERY CRATE active buff pills ===
    if (s.mcJetWingsUntil && s.mcJetWingsUntil > now) {
      const secs = Math.ceil((s.mcJetWingsUntil - now) / 1000);
      html += '<div class="bm-buff-pill" style="background:rgba(140,60,0,0.85);border-color:#ff8800;color:#ffcc44;animation:kingpinGlow 0.3s ease-in-out infinite alternate;">🚀 JET WINGS ×3.5 — ' + secs + 's</div>';
    }
    if (s.mcRiotShieldUntil && s.mcRiotShieldUntil > now) {
      const secs = Math.ceil((s.mcRiotShieldUntil - now) / 1000);
      html += '<div class="bm-buff-pill" style="background:rgba(0,80,160,0.85);border-color:#44aaff;color:#88ccff;">🛡️ RIOT SHIELD — ' + secs + 's</div>';
    }
    if (s.mcGhostModeUntil && s.mcGhostModeUntil > now) {
      const secs = Math.ceil((s.mcGhostModeUntil - now) / 1000);
      html += '<div class="bm-buff-pill" style="background:rgba(40,0,80,0.85);border-color:#cc88ff;color:#cc88ff;">👻 GHOST MODE — ' + secs + 's</div>';
    }
    if (s.mcLightningRodUntil && s.mcLightningRodUntil > now) {
      const secs = Math.ceil((s.mcLightningRodUntil - now) / 1000);
      html += '<div class="bm-buff-pill" style="background:rgba(80,80,0,0.85);border-color:#ffff44;color:#ffff44;animation:kingpinGlow 0.4s ease-in-out infinite alternate;">⚡ LIGHTNING ROD — ' + secs + 's</div>';
    }
    if (s.mcMagnetUntil && s.mcMagnetUntil > now) {
      const secs = Math.ceil((s.mcMagnetUntil - now) / 1000);
      html += '<div class="bm-buff-pill" style="background:rgba(0,60,80,0.85);border-color:#44ddcc;color:#44ddcc;">🧲 COIN MAGNET — ' + secs + 's</div>';
    }
    if (s.mcDiamondPoopUntil && s.mcDiamondPoopUntil > now) {
      const secs = Math.ceil((s.mcDiamondPoopUntil - now) / 1000);
      html += '<div class="bm-buff-pill" style="background:rgba(0,80,120,0.85);border-color:#88eeff;color:#88eeff;">💎 DIAMOND POOP ×3c — ' + secs + 's</div>';
    }
    // Bird Flu debuff
    if (s.fluUntil && s.fluUntil > now) {
      const secs = Math.ceil((s.fluUntil - now) / 1000);
      html += '<div class="bm-buff-pill" style="background:rgba(0,100,20,0.85);border-color:#44ff44;color:#88ff88;animation:pulseGreen 0.8s infinite alternate;">🤧 BIRD FLU — ' + secs + 's · Find medicine!</div>';
    } else if (s.fluOutbreak && gameState.birds) {
      // Warn healthy birds when infected birds are nearby
      const nearbyInfectedCount = gameState.birds.filter(b => b.isFlu && b.id !== gameState.self.id).length;
      if (nearbyInfectedCount > 0) {
        html += '<div class="bm-buff-pill" style="background:rgba(0,60,10,0.75);border-color:#44cc44;color:#88ee88;">⚠️ SICK BIRD NEARBY — stay back!</div>';
      }
    }
    if (s.mcNukePoop) {
      html += '<div class="bm-buff-pill" style="background:rgba(120,0,0,0.85);border-color:#ff4422;color:#ff8866;animation:pulseRed 0.5s infinite alternate;font-weight:bold;">💣 NUKE POOP — READY!</div>';
    }

    // Seagull Invasion awareness pill
    if (gameState.seagullInvasion && gameState.seagullInvasion.aliveCount > 0) {
      const sgLeft = Math.ceil((gameState.seagullInvasion.endsAt - now) / 1000);
      html += `<div class="bm-buff-pill" style="background:rgba(0,40,80,0.9);border-color:#44aaff;color:#88ccff;animation:kingpinGlow 1.0s ease-in-out infinite alternate;">🐦 SEAGULL RAID — ${gameState.seagullInvasion.aliveCount} left · ${sgLeft}s · POOP THEM!</div>`;
    }

    // Pigeon Stampede awareness pill
    if (gameState.stampede && gameState.stampede.aliveCount > 0) {
      const stLeft = Math.ceil((gameState.stampede.endsAt - now) / 1000);
      const stHits = gameState.stampede.myHits || 0;
      const stHitsStr = stHits > 0 ? ` · MY HITS: ${stHits}` : '';
      html += `<div class="bm-buff-pill" style="background:rgba(60,30,0,0.9);border-color:#e09040;color:#f0b060;animation:kingpinGlow 0.9s ease-in-out infinite alternate;">🐦 STAMPEDE — ${gameState.stampede.aliveCount}/${gameState.stampede.totalCount} birds · ${stLeft}s · POOP INTO THE HERD!${stHitsStr}</div>`;
    }

    // Formation Flying buff pills
    if (s.formationType === 'V') {
      html += '<div class="bm-buff-pill" style="background:rgba(0,60,100,0.85);border-color:#44ddff;color:#88eeff;animation:kingpinGlow 1.0s ease-in-out infinite alternate;">🔷 V-FORMATION +18% SPD</div>';
    } else if (s.formationType === 'WEDGE') {
      html += '<div class="bm-buff-pill" style="background:rgba(100,50,0,0.85);border-color:#ff9900;color:#ffcc44;animation:kingpinGlow 0.7s ease-in-out infinite alternate;font-weight:bold;">⚔️ WEDGE ATTACK +10% SPD +30% POOP</div>';
    }

    // Bird City Idol — city-wide XP boost
    if (s.idolXpBoostUntil && s.idolXpBoostUntil > now) {
      const secs = Math.ceil((s.idolXpBoostUntil - now) / 1000);
      html += '<div class="bm-buff-pill" style="background:rgba(100,0,120,0.85);border-color:#ff88ff;color:#ffaafF;animation:kingpinGlow 0.9s ease-in-out infinite alternate;font-weight:bold;">🎤 IDOL XP BOOST ×1.5 — ' + secs + 's</div>';
    }
    // Idol contestant badge — show when you're in the contest
    if (s.birdIdol && s.birdIdol.isContestant) {
      html += '<div class="bm-buff-pill" style="background:rgba(80,0,100,0.85);border-color:#cc44ff;color:#ee88ff;">🎤 CONTESTANT — POOP FOR PERFORMANCE SCORE!</div>';
    }

    // Pigeon Pied Piper — enchanted debuff (can't poop!)
    if (s.piperEnchantedUntil && s.piperEnchantedUntil > now) {
      const secs = Math.ceil((s.piperEnchantedUntil - now) / 1000);
      html += '<div class="bm-buff-pill" style="background:rgba(80,0,100,0.9);border-color:#ff88ff;color:#ffaaff;animation:pulseGreen 0.4s infinite alternate;font-weight:bold;">🎵 ENCHANTED — NO POOP! ' + secs + 's</div>';
    }
    // Show warning when piper is active and nearby
    if (s.piper && !s.piperEnchantedUntil) {
      const pdx = s.x - s.piper.x;
      const pdy = s.y - s.piper.y;
      const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
      if (pDist < 350) {
        html += '<div class="bm-buff-pill" style="background:rgba(60,0,80,0.75);border-color:#cc66ff;color:#ffaaff;">🎵 PIPER NEARBY — POOP HIM AWAY!</div>';
      }
    }

    // === CURSED COIN holder buffs ===
    if (s.cursedCoin && s.cursedCoin.isMine) {
      const intensityPct = Math.round((s.cursedCoin.intensity || 0) * 100);
      const secHeld = s.cursedCoin.heldSince ? Math.floor((now - s.cursedCoin.heldSince) / 1000) : 0;
      const timeLeft = Math.max(0, Math.ceil((240000 - (now - (s.cursedCoin.heldSince || now))) / 1000));
      const urgencyColor = intensityPct >= 90 ? '#ff0000' : intensityPct >= 75 ? '#ff6600' : '#cc3366';
      const anim = intensityPct >= 90 ? 'pulseRed 0.4s infinite alternate' : intensityPct >= 75 ? 'pulseRed 0.7s infinite alternate' : 'kingpinGlow 1.2s ease-in-out infinite alternate';
      html += `<div class="bm-buff-pill" style="background:rgba(80,0,20,0.9);border-color:${urgencyColor};color:${urgencyColor};font-weight:bold;animation:${anim};">💀 CURSED COIN — ${intensityPct}% · +2.5× COINS · ${timeLeft}s until EXPLOSION</div>`;
    }
    // If someone else has the coin — show proximity warn if you're near them
    if (s.cursedCoin && s.cursedCoin.state === 'held' && !s.cursedCoin.isMine) {
      const intensityPct = Math.round((s.cursedCoin.intensity || 0) * 100);
      const holderBird = gameState.birds && gameState.birds.find(b => b.id === s.cursedCoin.holderId);
      if (holderBird) {
        const cdx = s.x - holderBird.x;
        const cdy = s.y - holderBird.y;
        const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
        if (cDist < 100) {
          html += `<div class="bm-buff-pill" style="background:rgba(60,0,15,0.8);border-color:#cc3366;color:#ff7799;">💀 CURSED COIN NEARBY — TOUCH ${s.cursedCoin.holderName} to steal it! (${intensityPct}%)</div>`;
        }
      }
    }

    // Witness Protection — off the grid
    if (s.witnessProtectionUntil && s.witnessProtectionUntil > now) {
      const secsLeft = Math.ceil((s.witnessProtectionUntil - now) / 1000);
      const minsLeft = Math.floor(secsLeft / 60);
      const secsPart = secsLeft % 60;
      const timeStr = minsLeft > 0 ? `${minsLeft}m ${secsPart}s` : `${secsLeft}s`;
      html += `<div class="bm-buff-pill" style="background:rgba(0,30,80,0.9);border-color:#44aaff;color:#88ddff;font-weight:bold;animation:kingpinGlow 1.5s ease-in-out infinite alternate;">🛡 WITNESS PROTECTION — ${timeStr} · Off the grid</div>`;
    }

    // Aurora Borealis — sacred night spectacle
    if (s.aurora) {
      const auLeft = Math.max(0, Math.ceil((s.aurora.endsAt - now) / 1000));
      const auMins = Math.floor(auLeft / 60);
      const auSecs = auLeft % 60;
      const auTime = auMins > 0 ? `${auMins}m ${auSecs}s` : `${auLeft}s`;
      html += `<div class="bm-buff-pill" style="background:rgba(0,60,40,0.9);border-color:#88ffcc;color:#aaffdd;font-weight:bold;animation:kingpinGlow 1.5s ease-in-out infinite alternate;">✨ AURORA BOREALIS — ${auTime} · +25% XP · Combo 12s</div>`;
    }

    // Night Market proximity nudge (when market is open and you're near but haven't visited)
    if (gameState.nightMarket && lastNearNightMarket && !nmOverlayOpen) {
      html += `<div class="bm-buff-pill" style="background:rgba(0,40,60,0.9);border-color:#44ffee;color:#88ffee;cursor:pointer;animation:kingpinGlow 1.5s ease-in-out infinite alternate;" onclick="openNightMarketOverlay()">✨ NIGHT MARKET — [N] to shop · ${(s.cosmicFish || 0)} 🐟 Cosmic Fish</div>`;
    }
    // Night Market active buff pills
    if (s.stardustCloakUntil && s.stardustCloakUntil > now) {
      const secs = Math.ceil((s.stardustCloakUntil - now) / 1000);
      const mm = Math.floor(secs / 60), ss = secs % 60;
      html += `<div class="bm-buff-pill" style="background:rgba(0,40,70,0.9);border-color:#44ffee;color:#88ffee;animation:kingpinGlow 1.2s ease-in-out infinite alternate;">🌌 STARDUST CLOAK — ${mm}m ${ss}s</div>`;
    }
    if (s.cometTrailUntil && s.cometTrailUntil > now) {
      const secs = Math.ceil((s.cometTrailUntil - now) / 1000);
      const mm = Math.floor(secs / 60), ss = secs % 60;
      html += `<div class="bm-buff-pill" style="background:rgba(40,30,0,0.9);border-color:#ffdd44;color:#ffeeaa;animation:kingpinGlow 0.9s ease-in-out infinite alternate;">☄️ COMET TRAIL — ${mm}m ${ss}s</div>`;
    }
    if (s.oracleEyeUntil && s.oracleEyeUntil > now) {
      const secs = Math.ceil((s.oracleEyeUntil - now) / 1000);
      const mm = Math.floor(secs / 60), ss = secs % 60;
      html += `<div class="bm-buff-pill" style="background:rgba(40,0,80,0.9);border-color:#cc88ff;color:#ddaaff;animation:kingpinGlow 1.3s ease-in-out infinite alternate;">🔮 ORACLE EYE — ${mm}m ${ss}s · All secrets revealed</div>`;
    }
    if (s.starPowerUntil && s.starPowerUntil > now) {
      const secs = Math.ceil((s.starPowerUntil - now) / 1000);
      const mm = Math.floor(secs / 60), ss = secs % 60;
      html += `<div class="bm-buff-pill" style="background:rgba(60,50,0,0.9);border-color:#ffd700;color:#ffe044;font-weight:bold;animation:kingpinGlow 0.7s ease-in-out infinite alternate;">🌟 STAR POWER +50% XP &amp; COINS — ${mm}m ${ss}s</div>`;
    }
    if (s.lunarLensUntil && s.lunarLensUntil > now) {
      const secs = Math.ceil((s.lunarLensUntil - now) / 1000);
      const mm = Math.floor(secs / 60), ss = secs % 60;
      html += `<div class="bm-buff-pill" style="background:rgba(0,20,50,0.9);border-color:#88aaff;color:#aaccff;animation:kingpinGlow 1.4s ease-in-out infinite alternate;">🌙 LUNAR LENS — ${mm}m ${ss}s · Sewer caches revealed on minimap</div>`;
    }

    // === 🌑 BLOOD MOON ===
    if (gameState.bloodMoon) {
      const bmLeft = Math.max(0, Math.ceil((gameState.bloodMoon.endsAt - now) / 1000));
      const bmMins = Math.floor(bmLeft / 60);
      const bmSecs = bmLeft % 60;
      const bmCount = gameState.bloodMoon.feralBirds ? gameState.bloodMoon.feralBirds.length : 0;
      const bmTime = bmMins > 0 ? `${bmMins}m ${bmSecs}s` : `${bmLeft}s`;
      html += `<div class="bm-buff-pill" style="background:rgba(80,0,0,0.95);border-color:#cc2200;color:#ff6644;font-weight:bold;animation:pulseRed 0.8s infinite alternate;">🌑 BLOOD MOON — ${bmTime} · +50% XP/Coins · ${bmCount} feral birds!</div>`;
      if (s.bloodMoonStarCursed && s.bloodMoonStarCursed > now) {
        const secs = Math.ceil((s.bloodMoonStarCursed - now) / 1000);
        html += `<div class="bm-buff-pill" style="background:rgba(80,0,20,0.9);border-color:#ff3333;color:#ff8888;animation:pulseRed 0.6s infinite alternate;">🌑💀 CURSED STAR POWER — HALF XP for ${secs}s!</div>`;
      }
      if (s.bloodMoonExposedUntil && s.bloodMoonExposedUntil > now) {
        const secs = Math.ceil((s.bloodMoonExposedUntil - now) / 1000);
        html += `<div class="bm-buff-pill" style="background:rgba(80,0,0,0.9);border-color:#ff0000;color:#ff4444;animation:pulseRed 0.4s infinite alternate;">🌑💀 EXPOSED — Glowing RED — visible to all for ${secs}s!</div>`;
      }
    }

    // Session 93: Possession buff pill — crimson danger, arrest immune, +50% poop radius
    if (s.possessedUntil && s.possessedUntil > now) {
      const secs = Math.ceil((s.possessedUntil - now) / 1000);
      const exP = s.exorcismProgress || 0;
      const exorcismWarn = exP > 0 ? ` ⚠️ EXORCISM ${exP}/5!` : '';
      html += `<div class="bm-buff-pill" style="background:rgba(100,0,0,0.92);border-color:#ff2222;color:#ff8888;animation:pulseRed 0.6s infinite alternate;font-weight:bold;">🌑👁️ POSSESSED — +50% radius · Arrest immune · ${secs}s${exorcismWarn}</div>`;
    }

    // Crime Wave — city-wide danger indicator
    if (s.crimeWave) {
      const cwLeft = Math.max(0, Math.ceil((s.crimeWave.endsAt - now) / 1000));
      const isPoopParty = gameState.chaosEvent && gameState.chaosEvent.type === 'poop_party';
      const isInDome = s.insideThunderDome;
      if (isPoopParty) {
        html += `<div class="bm-buff-pill" style="background:rgba(120,0,60,0.9);border-color:#ff44ff;color:#ffaaff;font-weight:bold;animation:pulseRed 0.4s infinite alternate;">🎉🚨 POOP PARTY + CRIME WAVE — ${cwLeft}s · AOE MEGA · 3× HEAT — BE CAREFUL!</div>`;
      } else if (isInDome) {
        // Crime Wave × Dome synergy: show ×3 heat warning in the crime wave pill too
        html += `<div class="bm-buff-pill" style="background:rgba(120,10,0,0.95);border-color:#ff5533;color:#ffaa88;font-weight:bold;animation:pulseRed 0.45s infinite alternate;">⚡🚨 DOME + CRIME WAVE — ${cwLeft}s · ×3 HEAT inside dome · Crime pays DOUBLE</div>`;
      } else {
        html += `<div class="bm-buff-pill" style="background:rgba(120,0,0,0.9);border-color:#ff2222;color:#ff6666;font-weight:bold;animation:pulseRed 0.6s infinite alternate;">🚨 CRIME WAVE — ${cwLeft}s · 2× heat &amp; coins!</div>`;
      }
    }

    // Active Chaos Event pills
    if (gameState.chaosEvent) {
      const ce = gameState.chaosEvent;
      const ceLeft = Math.max(0, Math.ceil((ce.endsAt - now) / 1000));
      if (ce.type === 'poop_party') {
        html += `<div class="bm-buff-pill" style="background:rgba(120,0,80,0.9);border-color:#ff88ff;color:#ffaafF;font-weight:bold;animation:kingpinGlow 0.5s ease-in-out infinite alternate;">🎉 POOP PARTY — ${ceLeft}s · ALL POOP = MEGA AOE!</div>`;
      } else if (ce.type === 'coin_shower') {
        html += `<div class="bm-buff-pill" style="background:rgba(100,80,0,0.9);border-color:#ffd700;color:#ffe044;animation:kingpinGlow 0.8s ease-in-out infinite alternate;">💸 COIN SHOWER — ${ceLeft}s · FLY OVER COINS!</div>`;
      } else if (ce.type === 'food_festival') {
        html += `<div class="bm-buff-pill" style="background:rgba(0,80,10,0.9);border-color:#44ff44;color:#88ff88;animation:kingpinGlow 0.9s ease-in-out infinite alternate;">🎊 FOOD FESTIVAL — ${ceLeft}s · Premium food citywide!</div>`;
      } else if (ce.type === 'blackout') {
        html += `<div class="bm-buff-pill" style="background:rgba(0,0,40,0.95);border-color:#4488ff;color:#88aaff;font-weight:bold;animation:kingpinGlow 0.7s ease-in-out infinite alternate;">⚡ BLACKOUT — ${ceLeft}s · COPS ARE BLIND! Run!</div>`;
        // If cursed coin is hidden, show extra hint
        if (gameState.cursedCoin && gameState.cursedCoin.blackoutHidden) {
          html += `<div class="bm-buff-pill" style="background:rgba(40,0,10,0.85);border-color:#cc3344;color:#ff8888;">💀 COIN HOLDER VANISHED — in the dark somewhere…</div>`;
        }
      } else if (ce.type === 'disco_fever') {
        if (ce.isCrimeDisco) {
          html += `<div class="bm-buff-pill" style="background:rgba(120,0,80,0.95);border-color:#ff44ff;color:#ffaaff;font-weight:bold;animation:kingpinGlow 0.4s ease-in-out infinite alternate;">🚨🪩 CRIME DISCO — ${ceLeft}s · 5× NPC XP · 3× CRIME COINS!</div>`;
        } else {
          html += `<div class="bm-buff-pill" style="background:rgba(80,0,100,0.9);border-color:#ff88ff;color:#ffaafF;font-weight:bold;animation:kingpinGlow 0.7s ease-in-out infinite alternate;">🪩 DISCO FEVER — ${ceLeft}s · 3× XP on NPC hits!</div>`;
        }
      }
    }

    // City Lockdown — military emergency
    if (s.cityLockdown) {
      const clLeft = Math.max(0, Math.ceil((s.cityLockdown.endsAt - now) / 1000));
      html += `<div class="bm-buff-pill" style="background:rgba(100,30,0,0.9);border-color:#ff6600;color:#ffaa44;font-weight:bold;animation:pulseRed 0.9s infinite alternate;">🚨 CITY LOCKDOWN — ${clLeft}s · 1.5× crime rewards · NAT. GUARD active!</div>`;
    }

    // National Guard targeting indicator
    if (s.isNGTarget) {
      html += `<div class="bm-buff-pill" style="background:rgba(80,40,0,0.9);border-color:#ffd700;color:#ffcc44;font-weight:bold;animation:pulseRed 0.6s infinite alternate;">🪖 NATIONAL GUARD ON YOUR TAIL! 5 poop hits to stun · ${gameState.nationalGuard ? gameState.nationalGuard.length : 0} agents</div>`;
    }

    // Bounty Hunter targeting indicator
    if (gameState.bountyHunter && gameState.bountyHunter.isTargetingMe) {
      const bhState = gameState.bountyHunter.state;
      if (bhState === 'off_duty') {
        html += '<div class="bm-buff-pill" style="background:rgba(40,20,0,0.85);border-color:#888866;color:#bbbbaa;">🔫 BOUNTY HUNTER — OFF DUTY (60s)</div>';
      } else if (bhState === 'stunned') {
        html += '<div class="bm-buff-pill" style="background:rgba(0,80,0,0.85);border-color:#44ff44;color:#88ff88;">🔫 BOUNTY HUNTER — STUNNED! RUN!</div>';
      } else {
        const hits = gameState.bountyHunter.poopHits || 0;
        html += `<div class="bm-buff-pill" style="background:rgba(100,0,0,0.9);border-color:#cc2200;color:#ff6644;font-weight:bold;animation:pulseRed 0.8s infinite alternate;">🔫 BOUNTY HUNTER ON YOUR TAIL! Poop him: ${hits}/4 hits · Go underground to hide</div>`;
      }
    }

    // Birdnapper Van — hunt target or captive
    if (gameState.birdnapperVan) {
      const bv = gameState.birdnapperVan;
      if (bv.isCaptive) {
        const hits = bv.poopHits || 0;
        const max = bv.maxPoopHits || 8;
        html += `<div class="bm-buff-pill" style="background:rgba(120,0,0,0.95);border-color:#ff2200;color:#ff9988;font-weight:bold;animation:pulseRed 0.5s infinite alternate;">🚐💀 ABDUCTED! Trapped inside the van · Others: poop it ${hits}/${max} to free you!</div>`;
      } else if (bv.isHuntTarget) {
        html += `<div class="bm-buff-pill" style="background:rgba(80,0,120,0.92);border-color:#cc00ff;color:#ee88ff;font-weight:bold;animation:pulseRed 0.7s infinite alternate;">🚐 VAN IS HUNTING YOU — FLEE! Go to the sewer or stay moving!</div>`;
      } else if (bv.state === 'escaping' && bv.captiveName) {
        html += `<div class="bm-buff-pill" style="background:rgba(80,0,80,0.85);border-color:#aa00aa;color:#dd88ff;animation:kingpinGlow 0.8s ease-in-out infinite alternate;">🚐 POOP THE VAN! ${bv.captiveName} is trapped! ${bv.poopHits}/${bv.maxPoopHits} hits</div>`;
      }
    }

    // Police Helicopter targeting indicator
    if (gameState.policeHelicopter && gameState.policeHelicopter.isTargetingMe) {
      const heliState = gameState.policeHelicopter.state;
      if (heliState === 'stunned') {
        const sirenColor = Math.floor(now / 300) % 2 === 0 ? '#44aaff' : '#ff4466';
        html += `<div class="bm-buff-pill" style="background:rgba(0,60,0,0.85);border-color:#44ff44;color:#88ff88;">🚁💥 HELICOPTER DOWN! It'll recover soon — run!</div>`;
      } else if (heliState === 'hovering') {
        html += `<div class="bm-buff-pill" style="background:rgba(0,30,80,0.85);border-color:#3366cc;color:#88aaff;">🚁 Helicopter circling above — come up and it'll find you</div>`;
      } else {
        const hits = gameState.policeHelicopter.poopHits || 0;
        const spotlit = gameState.policeHelicopter.spotlighting;
        const bgColor = spotlit ? 'rgba(0,40,120,0.95)' : 'rgba(0,20,80,0.9)';
        const borderColor = spotlit ? '#66aaff' : '#2244cc';
        const spotText = spotlit ? ' · 🔦 SPOTLIT — visible to ALL!' : '';
        html += `<div class="bm-buff-pill" style="background:${bgColor};border-color:${borderColor};color:#88ccff;font-weight:bold;animation:pulseRed 0.8s infinite alternate;">🚁 POLICE HELICOPTER ON YOUR TAIL! Poop it: ${hits}/6 · Sewer won't help!${spotText}</div>`;
      }
    }

    // Rat King — underground boss alert pill
    if (s.inSewer && gameState.ratKing) {
      const rk = gameState.ratKing;
      if (rk.state === 'stunned') {
        html += '<div class="bm-buff-pill" style="background:rgba(60,0,80,0.85);border-color:#cc44ff;color:#ffaaff;">👑 RAT KING STUNNED! Hit him again!</div>';
      } else {
        const secsLeft = Math.max(0, Math.ceil((rk.endsAt - now) / 1000));
        html += `<div class="bm-buff-pill" style="background:rgba(80,0,100,0.9);border-color:#cc44ff;color:#ff88ff;font-weight:bold;animation:pulseRed 0.9s infinite alternate;">👑 RAT KING IS HERE! ${rk.hp}/${rk.maxHp} HP · Poop him! ${secsLeft}s to escape</div>`;
      }
    }

    // Bird Royale — status pill
    if (gameState.birdRoyale) {
      const ry = gameState.birdRoyale;
      if (ry.state === 'warning') {
        const secLeft = Math.max(0, Math.ceil((ry.startAt - now) / 1000));
        html += `<div class="bm-buff-pill" style="background:rgba(140,50,0,0.9);border-color:#ff7700;color:#ffcc44;font-weight:bold;animation:kingpinGlow 0.8s ease-in-out infinite alternate;">⚔️ BIRD ROYALE IN ${secLeft}s — FLY TO CENTER!</div>`;
      } else if (ry.state === 'active') {
        const secLeft = Math.max(0, Math.ceil((ry.endsAt - now) / 1000));
        const myStatus = ry.myStatus || 'spectator';
        if (myStatus === 'alive') {
          // Check if outside zone
          if (s.x !== undefined && s.y !== undefined) {
            const dx = s.x - ry.centerX;
            const dy = s.y - ry.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > ry.currentRadius) {
              html += `<div class="bm-buff-pill" style="background:rgba(160,0,0,0.95);border-color:#ff2200;color:#ff8888;font-weight:bold;animation:pulseRed 0.35s infinite alternate;">⚔️ OUTSIDE ZONE — −6 FOOD/SEC! FLY IN NOW!</div>`;
            } else {
              html += `<div class="bm-buff-pill" style="background:rgba(100,40,0,0.85);border-color:#ff8800;color:#ffcc66;animation:kingpinGlow 1.0s ease-in-out infinite alternate;">⚔️ ROYALE — ${ry.aliveCount} alive · ${secLeft}s · SAFE ✓</div>`;
            }
          }
        } else if (myStatus === 'eliminated') {
          html += `<div class="bm-buff-pill" style="background:rgba(40,40,40,0.85);border-color:#888888;color:#aaaaaa;cursor:pointer;" onclick="toggleRoyaleCheerPanel()">💀 ELIMINATED — [Z] CHEER survivors · ${ry.aliveCount} left</div>`;
        } else if (ry.isSpectator) {
          html += `<div class="bm-buff-pill" style="background:rgba(20,60,20,0.85);border-color:#44aa44;color:#88ff88;cursor:pointer;" onclick="toggleRoyaleCheerPanel()">🎉 SPECTATING — [Z] to cheer · ${ry.aliveCount} alive</div>`;
        } else {
          html += `<div class="bm-buff-pill" style="background:rgba(60,30,0,0.75);border-color:#aa6600;color:#ddaa44;">⚔️ ROYALE ACTIVE — ${ry.aliveCount}/${ry.participantCount} alive</div>`;
        }
      }
    }

    // Gang Royale Territory Bonus
    if (gameState.gangRoyaleBonus && gameState.gangRoyaleBonus.isMyGang) {
      const bonus = gameState.gangRoyaleBonus;
      const secLeft = Math.max(0, Math.ceil((bonus.bonusUntil - now) / 1000));
      html += `<div class="bm-buff-pill" style="background:rgba(80,50,0,0.9);border-color:#ffd700;color:#ffd700;animation:kingpinGlow 1.2s ease-in-out infinite alternate;">🗺️ ROYALE BONUS — 1.5× Territory · ${secLeft}s</div>`;
    }

    // Royale Champion badge reminder
    if (s.royaleChampBadge) {
      html += `<div class="bm-buff-pill" style="background:rgba(80,55,0,0.9);border-color:#ffd700;color:#ffd700;">🏆 ROYALE CHAMPION — You are a legend!</div>`;
    }

    // Fighting Champion badge reminder
    if (s.fightingChampBadge) {
      html += `<div class="bm-buff-pill" style="background:rgba(80,30,0,0.9);border-color:#ff8800;color:#ffaa44;font-weight:bold;">🥊 FIGHTING CHAMPION — The Don's favourite!</div>`;
    }

    // Tournament signup open — nudge player toward The Don
    if (gameState.tournament && gameState.tournament.state === 'signup') {
      const t = gameState.tournament;
      const secsLeft = Math.max(0, Math.ceil((t.signupUntil - now) / 1000));
      if (!t.isEntered) {
        html += `<div class="bm-buff-pill" style="background:rgba(80,25,0,0.9);border-color:#ff8844;color:#ffcc88;font-weight:bold;animation:kingpinGlow 0.8s ease-in-out infinite alternate;cursor:pointer;" onclick="openDonOverlay()">🥊 TOURNAMENT SIGNUP — ${t.entrantCount}/8 · ${secsLeft}s · [M] at Don to join</div>`;
      } else {
        html += `<div class="bm-buff-pill" style="background:rgba(50,30,0,0.9);border-color:#cc6633;color:#ffaa66;">🥊 ENTERED TOURNAMENT — ${t.entrantCount}/8 birds · Pot: ${t.pot}c · ${secsLeft}s</div>`;
      }
    }

    // Tournament fighting — show current status
    if (gameState.tournament && gameState.tournament.state === 'fighting') {
      const t = gameState.tournament;
      const myMatch = t.bracket && t.bracket.find(m => (m.bird1Id === myId || m.bird2Id === myId) && !m.bye);
      if (myMatch && !myMatch.winner) {
        const opponentName = myMatch.bird1Id === myId ? myMatch.bird2Name : myMatch.bird1Name;
        html += `<div class="bm-buff-pill" style="background:rgba(100,20,0,0.95);border-color:#ff4400;color:#ff9966;font-weight:bold;animation:pulseRed 0.6s infinite alternate;">🥊 ROUND ${t.round} — POOP ${opponentName} 3 TIMES! Championship pot: ${t.pot}c</div>`;
      } else if (t.isEntered) {
        html += `<div class="bm-buff-pill" style="background:rgba(50,30,0,0.85);border-color:#cc7722;color:#ffbb55;">🥊 ROUND ${t.round} FIGHTING — ${t.bracket ? t.bracket.filter(m => !m.winner && !m.bye).length : '?'} matches left…</div>`;
      } else if (gameState.tournamentBetting && gameState.tournamentBetting.length > 0) {
        // Spectator: there are open tournament bets!
        const openCount = gameState.tournamentBetting.filter(m => m.windowUntil > now).length;
        const alreadyBet = gameState.tournamentBetting.some(m => m.myBet);
        if (openCount > 0 && !alreadyBet) {
          html += `<div class="bm-buff-pill" style="background:rgba(60,30,0,0.9);border-color:#cc8800;color:#ffcc44;font-weight:bold;animation:kingpinGlow 0.7s ease-in-out infinite alternate;">🥊 CHAMPIONSHIP BETTING OPEN! ${openCount} match${openCount !== 1 ? 'es' : ''} — check bottom-left!</div>`;
        }
      }
    }

    // === VENDING MACHINE active poop effect ===
    if (s.vpPoopEffect) {
      const EFFECT_STYLES = {
        spicy:   { bg: 'rgba(140,30,0,0.9)',   border: '#ff6600', color: '#ffaa44', text: '🌶️ SPICY POOP — +38px radius!',         anim: 'kingpinGlow 0.5s ease-in-out infinite alternate' },
        freeze:  { bg: 'rgba(0,50,130,0.9)',   border: '#44aaff', color: '#88ddff', text: '🧊 FREEZE POOP — Slows target 4s!',       anim: '' },
        rainbow: { bg: 'rgba(80,0,120,0.9)',   border: '#ff88ff', color: '#ffaafF', text: '🌈 RAINBOW POOP — 3× coins on hit!',     anim: 'kingpinGlow 0.8s ease-in-out infinite alternate' },
        toxic:   { bg: 'rgba(0,80,10,0.9)',    border: '#44ff44', color: '#88ff88', text: '💚 TOXIC POOP — Chains to extra target!', anim: '' },
        shock:   { bg: 'rgba(100,90,0,0.9)',   border: '#ffee44', color: '#ffff88', text: '⚡ SHOCK POOP — Stuns target 3.5s!',      anim: 'kingpinGlow 0.4s ease-in-out infinite alternate' },
      };
      const st = EFFECT_STYLES[s.vpPoopEffect.type] || EFFECT_STYLES.spicy;
      const animStyle = st.anim ? `animation:${st.anim};` : '';
      html += `<div class="bm-buff-pill" style="background:${st.bg};border-color:${st.border};color:${st.color};font-weight:bold;${animStyle}">${st.text} · POOP to use!</div>`;
    }

    // === MURAL VANDAL warning pill (city-wide when vandal is active) ===
    if (gameState.muralVandal && gameState.muralVandal.state !== 'fleeing') {
      const mv = gameState.muralVandal;
      const secs = Math.max(0, Math.ceil((mv.expiresAt - now) / 1000));
      const isVandalizing = mv.state === 'vandalizing';
      const pct = Math.round(mv.vandalizingProgress * 100);
      const urgentStyle = isVandalizing ? 'animation:kingpinGlow 0.4s ease-in-out infinite alternate;' : '';
      const label = isVandalizing
        ? `🎨💀 VANDAL DEFACING ${mv.targetZoneName}! ${pct}% — POOP HIM! ${mv.hitCount}/${mv.hitsRequired}`
        : `🎨💀 VANDAL CROW heading for ${mv.targetZoneName} mural — Intercept & POOP (${secs}s)`;
      html += `<div class="bm-buff-pill" style="background:rgba(80,20,120,0.9);border-color:#cc44ff;color:#ee88ff;font-weight:bold;${urgentStyle}">${label}</div>`;
    }

    // === CITY VAULT TRUCK contribution pill ===
    if (gameState.vaultTruck && !gameState.vaultTruck.cracked && !gameState.vaultTruck.escaped) {
      const vt = gameState.vaultTruck;
      const myHits = vt.myHits || 0;
      const hpPct = Math.round(vt.hp / vt.maxHp * 100);
      const secs = Math.ceil(Math.max(0, vt.endsAt - now) / 1000);
      const mins = Math.floor(secs / 60);
      const rem = secs % 60;
      const timeStr = mins > 0 ? `${mins}m ${rem}s` : `${secs}s`;
      const urgency = hpPct <= 10 ? 'animation:pulseRed 0.4s infinite alternate;' : hpPct <= 25 ? 'animation:kingpinGlow 0.6s ease-in-out infinite alternate;' : '';
      html += `<div class="bm-buff-pill" style="background:rgba(80,65,0,0.92);border-color:#ffd700;color:#ffe566;font-weight:bold;${urgency}">💼 VAULT TRUCK — ${vt.hp}HP · ${timeStr} · MY HITS: ${myHits} · POOP IT!</div>`;
    }

    // === MAYOR'S MOTORCADE pill (Session 111) ===
    if (gameState.motorcade) {
      const mc = gameState.motorcade;
      const mcMyHits = mc.myHits || 0;
      const mcSecs = Math.ceil(Math.max(0, mc.endsAt - now) / 1000);
      const mcHpFrac = mc.hp / mc.maxHp;
      const mcUrgency = mcHpFrac <= 0.25 ? 'animation:pulseRed 0.4s infinite alternate;' : '';
      if (mc.outraged) {
        html += `<div class="bm-buff-pill" style="background:rgba(80,10,0,0.95);border-color:#ff3300;color:#ff6644;font-weight:bold;${mcUrgency}">🚨 MAYOR OUTRAGED! Limo fleeing — ${mc.hp}/${mc.maxHp}HP · ${mcSecs}s · MY HITS: ${mcMyHits}</div>`;
      } else {
        const escortsLeft = (mc.escorts || []).filter(e => !e.stunned).length;
        const hitsStr = mcMyHits > 0 ? ` · MY HITS: ${mcMyHits}` : '';
        const tipStr = escortsLeft > 0 ? ` · Stun ${escortsLeft} escort(s) first!` : ' · LIMO IS EXPOSED! POOP IT!';
        html += `<div class="bm-buff-pill" style="background:rgba(10,25,80,0.92);border-color:#3366cc;color:#6699ff;font-weight:bold;">🚗 MAYOR'S MOTORCADE — ${mc.hp}/${mc.maxHp}HP · ${mcSecs}s${tipStr}${hitsStr}</div>`;
      }
    }

    // === DUEL REMATCH pill ===
    if (s.duelRematch) {
      const rm = s.duelRematch;
      const secsLeft = Math.max(0, Math.ceil((rm.expiresAt - now) / 1000));
      if (secsLeft > 0) {
        if (rm.iAccepted) {
          html += `<div class="bm-buff-pill" style="background:rgba(60,30,0,0.9);border-color:#ff9966;color:#ffcc88;">🔄 REMATCH ACCEPTED — waiting for ${rm.opponentName}… ${secsLeft}s</div>`;
        } else {
          html += `<div class="bm-buff-pill" style="background:rgba(80,30,0,0.9);border-color:#ff6633;color:#ffaa66;font-weight:bold;animation:kingpinGlow 0.6s ease-in-out infinite alternate;cursor:pointer;" onclick="socket.emit('action',{type:'accept_rematch'})">🔄 REMATCH vs ${rm.opponentName}? Press [Y] · ${secsLeft}s</div>`;
        }
      }
    }

    // === SUSPICIOUS PACKAGE pill ===
    if (gameState.suspiciousPackage) {
      const pkg = gameState.suspiciousPackage;
      const pkgSecsLeft = Math.ceil(Math.max(0, pkg.timeLeft) / 1000);
      const pkgUrgencyFrac = 1 - Math.max(0, pkg.timeLeft / (pkg.maxTime || 90000));
      const myHits = pkg.myHits || 0;
      const hitsLeft = pkg.maxDefuseHits - pkg.defuseHits;
      const bgColor = pkgUrgencyFrac > 0.7 ? 'rgba(100,0,0,0.95)' : 'rgba(80,20,0,0.9)';
      const borderColor = pkgUrgencyFrac > 0.7 ? '#ff2200' : '#ff6600';
      const textColor = pkgUrgencyFrac > 0.7 ? '#ff5500' : '#ff9933';
      const anim = pkgUrgencyFrac > 0.7 ? 'animation:pulseRed 0.35s infinite alternate;' : 'animation:kingpinGlow 0.7s ease-in-out infinite alternate;';
      const hitsStr = myHits > 0 ? ` · MY HITS: ${myHits}` : '';
      html += `<div class="bm-buff-pill" style="background:${bgColor};border-color:${borderColor};color:${textColor};font-weight:bold;${anim}">\uD83D\uDCA3 PACKAGE — ${hitsLeft} hits to defuse · ${pkgSecsLeft}s FUSE${hitsStr} · POOP IT!</div>`;
    }

    // === GOLDEN RAMPAGE (Session 96) pills ===
    if (gameState.goldenRampage) {
      const gr = gameState.goldenRampage;
      const secsLeft = Math.max(0, Math.ceil((gr.endsAt - now) / 1000));
      if (s.isGoldenBird) {
        // You ARE the Golden Bird — show power + timer + warning
        const urgentStyle = secsLeft < 15 ? 'animation:pulseRed 0.3s infinite alternate;' : 'animation:kingpinGlow 0.4s ease-in-out infinite alternate;';
        const urgentColor = secsLeft < 15 ? '#ff8800' : '#ffd700';
        html += `<div class="bm-buff-pill" style="background:rgba(100,70,0,0.95);border-color:${urgentColor};color:${urgentColor};${urgentStyle}font-weight:bold;">🌟 GOLDEN BIRD — 2.5× SPD · ALL MEGA POOP · 4× XP · ${secsLeft}s — HUNTERS ARE COMING!</div>`;
        html += `<div class="bm-buff-pill" style="background:rgba(100,60,0,0.85);border-color:#ffaa22;color:#ffcc66;">👑 HP: ${gr.hp}/${gr.maxHp} · Survive to earn 1200 XP + 700c + badge!</div>`;
      } else if (gr.birdName) {
        // Someone else is the Golden Bird — show hunt prompt + distance info
        const myHits = gr.myHits || 0;
        html += `<div class="bm-buff-pill" style="background:rgba(60,40,0,0.9);border-color:#cc9900;color:#ffdd44;font-weight:bold;">🌟 GOLDEN RAMPAGE — ${gr.gangTag ? '[' + gr.gangTag + '] ' : ''}${gr.birdName} · ${secsLeft}s · HP: ${gr.hp}/${gr.maxHp} · MY HITS: ${myHits} · POOP THEM!</div>`;
      }
    }

    // === BOWLING BIRD (Session 109) pills ===
    if (gameState.bowlingBall) {
      const bb = gameState.bowlingBall;
      const bbSecsLeft = Math.max(0, Math.ceil((bb.endsAt - now) / 1000));
      if (bb.isBowlingBird) {
        const urgentStyle = bbSecsLeft < 15 ? 'animation:pulseRed 0.3s infinite alternate;' : 'animation:kingpinGlow 0.5s ease-in-out infinite alternate;';
        const urgentColor = bbSecsLeft < 15 ? '#ff6600' : '#ff9900';
        html += `<div class="bm-buff-pill" style="background:rgba(60,20,0,0.95);border-color:${urgentColor};color:${urgentColor};${urgentStyle}font-weight:bold;">🎳 YOU ARE THE BOWLING BALL — Charge birds! HP: ${bb.hp}/${bb.maxHp} · ${bbSecsLeft}s — SURVIVE FOR 600 XP + 350c!</div>`;
      } else {
        const myHits = bb.myHits || 0;
        html += `<div class="bm-buff-pill" style="background:rgba(40,15,0,0.9);border-color:#cc5500;color:#ff9944;font-weight:bold;">🎳 BOWLING BIRD — ${bb.gangTag ? '[' + bb.gangTag + '] ' : ''}${bb.birdName} · HP: ${bb.hp}/${bb.maxHp} · ${bbSecsLeft}s · MY HITS: ${myHits} · POOP THEM!</div>`;
      }
    }

    // === SKY PIRATE AIRSHIP (Session 110) pill ===
    if (gameState.skyPirateShip && !gameState.skyPirateShip.sinking) {
      const sp = gameState.skyPirateShip;
      const spSecs = Math.max(0, Math.ceil((sp.expiresAt - now) / 1000));
      const myHits = sp.myHits || 0;
      const urgency = sp.hp <= 5 ? 'animation:pulseRed 0.3s infinite alternate;' : sp.hp <= 10 ? 'animation:kingpinGlow 0.5s ease-in-out infinite alternate;' : '';
      html += `<div class="bm-buff-pill" style="background:rgba(60,0,0,0.92);border-color:#cc2200;color:#ff6644;font-weight:bold;${urgency}">🏴‍☠️ SKY PIRATE AIRSHIP — ${sp.hp}/${sp.maxHp} HP · ${spSecs}s · MY HITS: ${myHits} · POOP IT DOWN!</div>`;
    }

    // === Golden Throne — claim progress or champion badge pill ===
    if (s && s.goldenThrone) {
      const throne = s.goldenThrone;
      const throneLeft = Math.max(0, throne.expiresAt - Date.now());
      const throneSecsLeft = Math.ceil(throneLeft / 1000);
      if (throne.isClaiming && throne.claimProgress > 0) {
        const claimPct = Math.floor(throne.claimProgress * 100);
        const claimStyle = claimPct >= 75 ? 'animation:kingpinGlow 0.3s ease-in-out infinite alternate;' : '';
        html += `<div class="bm-buff-pill" style="background:rgba(50,35,0,0.95);border-color:#ffd700;color:#ffe566;font-weight:bold;${claimStyle}">👑 CLAIMING THRONE ${claimPct}% — Hold position! ${throneSecsLeft}s left!</div>`;
      } else {
        html += `<div class="bm-buff-pill" style="background:rgba(40,30,0,0.85);border-color:#c8a000;color:#ffd700;">👑 GOLDEN THRONE nearby — ${throneSecsLeft}s · Stun guards, then claim it!</div>`;
      }
    }
    if (s && s.throneChampBadge) {
      html += `<div class="bm-buff-pill" style="background:rgba(50,35,0,0.9);border-color:#ffd700;color:#ffe566;">👑 THRONE CHAMPION — You seized the Golden Throne this session!</div>`;
    }
    if (s && s.perchChampBadge) {
      html += `<div class="bm-buff-pill" style="background:rgba(50,40,0,0.9);border-color:#ffd700;color:#ffe566;">🏅 PERCH CHAMPION — King of the Hill!</div>`;
    }

    // Golden Perch: holding pill
    const _gpSelf = s && s.goldenPerch;
    if (_gpSelf) {
      if (_gpSelf.amHolder) {
        const _gpHoldSecs = Math.floor((_gpSelf.holdTimeMs || 0) / 1000);
        const _gpWinSecs = Math.ceil((_gpSelf.holdRequiredMs - (_gpSelf.holdTimeMs || 0)) / 1000);
        html += `<div class="bm-buff-pill" style="background:rgba(50,40,0,0.95);border-color:#ffd700;color:#00ff88;animation:kingpinGlow 0.5s ease-in-out infinite alternate;font-weight:bold;">🏅 HOLDING THE PERCH — ${_gpHoldSecs}s held · ${Math.max(0,_gpWinSecs)}s to WIN! +10c every 8s · 3× XP zone!</div>`;
      } else if (_gpSelf.inZone) {
        const _gpHolderName = _gpSelf.holderName || 'nobody';
        html += `<div class="bm-buff-pill" style="background:rgba(50,35,0,0.88);border-color:#ffa500;color:#ffd700;">🏅 IN PERCH ZONE — ${_gpSelf.holderId ? `${_gpHolderName} is holding (${Math.floor((_gpSelf.holdTimeMs||0)/1000)}s/${Math.floor(_gpSelf.holdRequiredMs/1000)}s)` : 'Unclaimed!'} · 3× XP on poop hits!</div>`;
      } else {
        // Perch exists but you're not in zone — passive awareness
        const _gpSecsLeft = Math.max(0, Math.ceil((_gpSelf.expiresAt - now) / 1000));
        html += `<div class="bm-buff-pill" style="background:rgba(40,30,0,0.82);border-color:#aa8800;color:#ccaa44;">🏅 GOLDEN PERCH at ${_gpSelf.locationName} · ${_gpSecsLeft}s · Fly there!</div>`;
      }
    }

    // Pigeon Coupe: driving pill
    if (s && s.drivingCoupeId && gameState.pigeonCoupe) {
      const pc = gameState.pigeonCoupe;
      const secsLeft = Math.max(0, Math.ceil((pc.expiresAt - now) / 1000));
      html += `<div class="bm-buff-pill" style="background:rgba(80,30,0,0.92);border-color:#ff6600;color:#ffaa44;animation:kingpinGlow 0.7s ease-in-out infinite alternate;font-weight:bold;cursor:pointer;" onclick="sendAction({type:'coupe_exit'})">🚗 DRIVING THE PIGEON COUPE — 220px/s · Carjacks: ${pc.carjacks}/3 · ${secsLeft}s · [E] to exit</div>`;
    } else if (s && s.nearPigeonCoupe && gameState.pigeonCoupe && !gameState.pigeonCoupe.driverId) {
      html += `<div class="bm-buff-pill" style="background:rgba(60,25,0,0.88);border-color:#ff7722;color:#ffcc88;cursor:pointer;" onclick="sendAction({type:'coupe_enter'})">🚗 PIGEON COUPE here — [E] to GET IN!</div>`;
    } else if (s && s.canCarjack && gameState.pigeonCoupe && gameState.pigeonCoupe.driverId) {
      html += `<div class="bm-buff-pill" style="background:rgba(80,0,0,0.92);border-color:#ff2200;color:#ff8866;animation:pulseRed 0.6s infinite alternate;font-weight:bold;cursor:pointer;" onclick="sendAction({type:'coupe_carjack'})">🚨 CARJACK THE COUPE — [E] to steal it from ${gameState.pigeonCoupe.driverName}!</div>`;
    }

    // Election policy active pill
    const elState = gameState.election;
    if (elState) {
      const nowEl = Date.now();
      if (elState.state === 'voting') {
        const secsLeft = Math.max(0, Math.ceil((elState.endsAt - nowEl) / 1000));
        html += `<div class="bm-buff-pill" style="background:rgba(0,50,20,0.92);border-color:#22aa44;color:#66ffaa;animation:pulseGreen 1s ease-in-out infinite alternate;cursor:pointer;font-weight:bold;" onclick="if(window.gameState&&window.gameState.nearCityHall)document.querySelector('#bountyBoardOverlay').style.display='block'">🗳️ ELECTION — VOTE NOW at City Hall [V] · ${secsLeft}s · ${elState.totalVotes || 0} votes</div>`;
      } else if (elState.state === 'active') {
        const secsLeft = Math.max(0, Math.ceil((elState.policyEndsAt - nowEl) / 1000));
        const mins = Math.floor(secsLeft / 60);
        const rem = secsLeft % 60;
        const POLICY_COLORS = { feast:'#88ff44', tax_revolt:'#ffdd44', anarchy:'#ff4444', unity:'#44aaff', festival:'#ff88ff', bloodsport:'#ff6622' };
        const col = POLICY_COLORS[elState.policy] || '#66ffaa';
        html += `<div class="bm-buff-pill" style="background:rgba(0,40,15,0.88);border-color:${col};color:${col};animation:pulseGreen 2s ease-in-out infinite alternate;">🗳️ ${elState.emoji || ''} ${(elState.policy || '').toUpperCase()} POLICY — ${mins}:${rem.toString().padStart(2,'0')} left</div>`;
      }
    }

    // === FLASH MOB pill (Session 106) ===
    if (gameState.flashMob) {
      const fm = gameState.flashMob;
      const fmIsActive = fm.state === 'active';
      if (fmIsActive && s.nearFlashMob) {
        html += `<div class="bm-buff-pill" style="background:rgba(80,0,60,0.92);border-color:#ff44cc;color:#ff99ee;animation:kingpinGlow 0.6s ease-in-out infinite alternate;font-weight:bold;">🎉 IN THE MOB — +20XP +5c every 10s!</div>`;
      } else if (fmIsActive && !s.nearFlashMob) {
        const fmSecsLeft = Math.max(0, Math.ceil((fm.endsAt - now) / 1000));
        html += `<div class="bm-buff-pill" style="background:rgba(50,0,40,0.85);border-color:#cc88ff;color:#ff88cc;">🎉 FLASH MOB at ${fm.locationName} — ${fmSecsLeft}s · FLY THERE!</div>`;
      }
    }

    // === GRUDGE SYSTEM pill (Session 105) ===
    if (s.grudge) {
      const g = s.grudge;
      const hitsLeft = 3 - g.hitsDealt;
      const anim = g.hitsDealt >= 2 ? 'animation:pulseRed 0.5s infinite alternate;' : 'animation:kingpinGlow 0.9s ease-in-out infinite alternate;';
      html += `<div class="bm-buff-pill" style="background:rgba(100,30,0,0.92);border-color:#ff6600;color:#ffaa44;font-weight:bold;${anim}">😤 GRUDGE — Poop ${g.targetName} ${hitsLeft} more time${hitsLeft !== 1 ? 's' : ''} for REVENGE! (${g.hitsDealt}/3)</div>`;
    }
    // Show warning when a nearby bird has a grudge targeting you
    if (gameState.birds) {
      const grudgeHunter = gameState.birds.find(b => b.hasGrudgeOnMe);
      if (grudgeHunter) {
        const gdx = (s.x || 0) - grudgeHunter.x;
        const gdy = (s.y || 0) - grudgeHunter.y;
        const gDist = Math.sqrt(gdx * gdx + gdy * gdy);
        if (gDist < 300) {
          html += `<div class="bm-buff-pill" style="background:rgba(80,20,0,0.85);border-color:#ff4400;color:#ffaa66;">😤 ${grudgeHunter.name} has a GRUDGE on YOU — they're hunting you!</div>`;
        }
      }
    }

    // === VIGILANTE MARSHAL pills (Session 109) ===
    if (gameState.vigilanteCall && gameState.vigilanteCall.openUntil > now) {
      const secsLeft = Math.ceil((gameState.vigilanteCall.openUntil - now) / 1000);
      const tName = gameState.vigilanteCall.targetName || 'criminal';
      html += `<div class="bm-buff-pill" style="background:rgba(60,50,0,0.95);border-color:#ffe566;color:#fff7a0;font-weight:bold;animation:kingpinGlow 0.5s ease-in-out infinite alternate;">⭐ VIGILANTE CALL — Press [H] to hunt ${tName}! (${secsLeft}s) · +500 XP · steal 30% coins</div>`;
    }
    if (gameState.vigilante) {
      const v = gameState.vigilante;
      const secsLeft = Math.max(0, Math.ceil((v.endsAt - now) / 1000));
      const isStunned = v.stunUntil && v.stunUntil > now;
      const stunSecsLeft = isStunned ? Math.ceil((v.stunUntil - now) / 1000) : 0;
      if (v.iAmMarshal) {
        if (isStunned) {
          html += `<div class="bm-buff-pill" style="background:rgba(80,30,0,0.95);border-color:#ff8800;color:#ffcc88;font-weight:bold;animation:pulseRed 0.4s infinite alternate;">💫 MARSHAL STUNNED — ${stunSecsLeft}s · Recover then continue!</div>`;
        } else {
          const catchPct = Math.round((v.catchProgress || 0) * 100);
          const catchMsg = catchPct > 0 ? ` · ARRESTING: ${catchPct}%` : ' · Stay within 55px for 4s to ARREST';
          html += `<div class="bm-buff-pill" style="background:rgba(50,40,0,0.95);border-color:#ffe566;color:#fff7a0;font-weight:bold;animation:kingpinGlow 0.6s ease-in-out infinite alternate;">⭐ MARSHAL — Hunt ${v.targetName}! (${secsLeft}s)${catchMsg} · Stuns: ${v.stunCount}/3</div>`;
        }
      } else if (v.iAmTarget) {
        if (isStunned) {
          html += `<div class="bm-buff-pill" style="background:rgba(0,50,0,0.85);border-color:#44ff88;color:#aaffcc;">💫 MARSHAL STUNNED ${stunSecsLeft}s — RUN!</div>`;
        } else {
          const catchPct = Math.round((v.catchProgress || 0) * 100);
          const catchMsg = catchPct > 30 ? ` · ⚠️ ARREST IN PROGRESS: ${catchPct}%` : ' · Poop them 4× to stun!';
          html += `<div class="bm-buff-pill" style="background:rgba(100,10,0,0.95);border-color:#ff4444;color:#ffaaaa;font-weight:bold;animation:pulseRed 0.5s infinite alternate;">⭐ MARSHAL HUNTING YOU! ${v.name} · (${secsLeft}s)${catchMsg} · Stuns: ${v.stunCount}/3</div>`;
        }
      }
    }

    // === COURIER PIGEON pill (Session 107) ===
    if (gameState.courierPigeon) {
      const cp = gameState.courierPigeon;
      const cpSecsLeft = Math.max(0, Math.ceil((cp.expiresAt - now) / 1000));
      if (cp.amEscorting) {
        const myTimeNearSecs = Math.floor((cp.myTimeNear || 0) / 1000);
        html += `<div class="bm-buff-pill" style="background:rgba(60,40,0,0.92);border-color:#e8c060;color:#ffe899;animation:kingpinGlow 0.8s ease-in-out infinite alternate;font-weight:bold;">📬 ESCORTING COURIER — ${myTimeNearSecs}s near · Deliver for reward! (${cpSecsLeft}s left)</div>`;
      } else {
        const hitsLeft = cp.maxHits - cp.hitsDealt;
        html += `<div class="bm-buff-pill" style="background:rgba(40,30,0,0.85);border-color:#c8a060;color:#ffe070;">📬 COURIER PIGEON flying ${cp.srcName}→${cp.destName} — ESCORT (+reward) or INTERCEPT ${hitsLeft > 0 ? `(${cp.hitsDealt}/${cp.maxHits} hits)` : ''}! ${cpSecsLeft}s left</div>`;
      }
    }

    // === BURIED TREASURE SYSTEM (Session 114) ===
    if (gameState.treasureMap && gameState.treasureMap.holderId === (s.id || myId)) {
      const digPct = Math.floor((gameState.treasureMap.digProgress || 0) * 100);
      const stealsOnMe = gameState.treasureMap.stealHitsOnMe || 0;
      let treasurePillLabel = `🗺️ TREASURE MAP — Fly to the X and hold 3s to dig! (${digPct}%)`;
      if (stealsOnMe > 0) {
        treasurePillLabel += ` ⚠️ STEAL: ${stealsOnMe}/3!`;
      }
      html += `<div class="bm-buff-pill" style="background:rgba(80,55,0,0.95);border-color:#f4c542;color:#ffd966;animation:${stealsOnMe > 0 ? 'rpKingpin 0.3s ease-in-out infinite alternate' : 'slowPulse 2s ease-in-out infinite'};">${treasurePillLabel}</div>`;
    } else if (gameState.treasureMap && gameState.treasureMap.holderId !== (s.id || myId)) {
      const stealsDealt = gameState.treasureMap.stealHitsIveDealt || 0;
      if (stealsDealt > 0) {
        html += `<div class="bm-buff-pill" style="background:rgba(60,30,0,0.8);border-color:#ff9900;color:#ffcc44;">📜 STEAL ATTEMPT — ${stealsDealt}/3 hits on the map holder! Keep going!</div>`;
      }
    }
    if (gameState.self && gameState.self.myTreasureDigSite) {
      // Show dig site reminder even if not currently near the X
    }

    // === WING SURGE SYSTEM (Session 113) ===
    if (s.wingSurgeUntil && s.wingSurgeUntil > now) {
      const secs = Math.ceil((s.wingSurgeUntil - now) / 1000);
      const isHyper = !!s.wingSurgeHyperXp;
      const surgeLabel = isHyper ? '⚡ WING SURGE! ×1.8 SPD · 3× XP — HYPER!' : '⚡ WING SURGE! ×1.8 SPD · 2× XP —';
      html += `<div class="bm-buff-pill" style="background:rgba(120,80,0,0.95);border-color:#ffdd00;color:#ffee88;animation:kingpinGlow 0.3s ease-in-out infinite alternate;font-weight:bold;">${surgeLabel} ${secs}s · COPS CAN'T ARREST!</div>`;
    } else if (s.wingCooldownUntil && s.wingCooldownUntil > now) {
      const secs = Math.ceil((s.wingCooldownUntil - now) / 1000);
      html += `<div class="bm-buff-pill" style="background:rgba(40,30,0,0.7);border-color:#888844;color:#aaa866;">🪶 Wing Surge cooldown — ${secs}s</div>`;
    } else if (s.wingCharge && s.wingCharge > 0) {
      const chargePct = Math.floor(s.wingCharge);
      const chargeColor = chargePct >= 75 ? '#ffee00' : chargePct >= 50 ? '#ffcc33' : '#cc9900';
      html += `<div class="bm-buff-pill" style="background:rgba(60,45,0,0.75);border-color:${chargeColor};color:${chargeColor};">🪶 Wing Charge: ${chargePct}% — Poop more to SURGE!</div>`;
    }

    // === HOT DOG CART buffs (Session 115) ===
    if (s.hotdogSpeedUntil && s.hotdogSpeedUntil > now) {
      const hdSecs = Math.ceil((s.hotdogSpeedUntil - now) / 1000);
      html += `<div class="bm-buff-pill" style="background:rgba(130,50,0,0.88);border-color:#ff8800;color:#ffcc44;animation:kingpinGlow 0.7s ease-in-out infinite alternate;font-weight:bold;">🌭 FRANK'S HOT DOG — ×1.4 SPD — ${hdSecs}s</div>`;
    }
    if (s.hotdogXpBoostHits && s.hotdogXpBoostHits > 0) {
      html += `<div class="bm-buff-pill" style="background:rgba(100,60,0,0.85);border-color:#ffaa44;color:#ffcc88;font-weight:bold;">🌭 HOT DOG XP BOOST ×1.3 — ${s.hotdogXpBoostHits} hits left!</div>`;
    }

    // === THE MOLE active buffs (Session 117) ===
    const _moleHudData = s.mole;
    if (_moleHudData) {
      if (_moleHudData.isMole && !_moleHudData.revealed) {
        const tagged = (_moleHudData.tagged || []).length;
        const total = (_moleHudData.targets || []).length;
        const secsLeft = _moleHudData.secsLeft || 0;
        const labelParts = [];
        for (let i = 0; i < total; i++) {
          const name = (_moleHudData.targetNames || [])[i] || '???';
          const done = (_moleHudData.tagged || []).includes((_moleHudData.targets || [])[i]);
          labelParts.push(done ? `✅ ${name}` : `🎯 ${name}`);
        }
        html += `<div class="bm-buff-pill" style="background:rgba(60,0,100,0.92);border-color:#8800cc;color:#dd88ff;animation:pulseRed 0.7s ease-in-out infinite alternate;font-weight:bold;">🕵️ MOLE MISSION — ${tagged}/${total} tagged · ${secsLeft}s · STAY HIDDEN!<br><span style="font-size:9px;font-weight:normal;">${labelParts.join(' · ')}</span></div>`;
      }
      if (_moleHudData.revealed && _moleHudData.moleId) {
        const revengeLeft = _moleHudData.revengeEndsAt ? Math.max(0, Math.ceil((_moleHudData.revengeEndsAt - now) / 1000)) : 0;
        if (revengeLeft > 0) {
          if (_moleHudData.isMole) {
            html += `<div class="bm-buff-pill" style="background:rgba(100,0,30,0.92);border-color:#cc0044;color:#ff8888;animation:pulseRed 1s ease-in-out infinite alternate;font-weight:bold;">🕵️💀 MOLE REVEALED — SURVIVE ${revengeLeft}s! You're exposed!</div>`;
          } else {
            const myHits = _moleHudData.revengeHitsOnMe || 0;
            html += `<div class="bm-buff-pill" style="background:rgba(60,0,100,0.92);border-color:#8800cc;color:#dd88ff;animation:kingpinGlow 0.9s ease-in-out infinite alternate;font-weight:bold;">🕵️ MOLE ALERT! ${_moleHudData.moleName || '???'} · POOP THEM · ${revengeLeft}s · MY HITS: ${myHits}</div>`;
          }
        }
      }
    }

    // Rival Bird active warning (anyone, not just self)
    if (gameState.rivalBird && gameState.rivalBird.state === 'raiding') {
      const rb = gameState.rivalBird;
      const secsLeft = Math.ceil(Math.max(0, rb.expiresAt - now) / 1000);
      const myHits = rb.myHits || 0;
      html += `<div class="bm-buff-pill" style="background:rgba(80,0,0,0.9);border-color:#cc1a1a;color:#ff6666;animation:pulseRed 0.8s ease-in-out infinite alternate;font-weight:bold;">🔴 RIVAL BIRD — ${rb.hp}/${rb.maxHp} HP · ${secsLeft}s · MY HITS: ${myHits} · POOP ACE!</div>`;
    }

    el.innerHTML = html;
  }

  function toggleBirdHome() {
    if (birdHomeVisible) {
      closeBirdHome();
    } else {
      openBirdHome();
    }
  }

  function openBirdHome() {
    if (!gameState || !gameState.self) return;
    birdHomeVisible = true;
    const el = document.getElementById('birdHome');
    el.style.display = 'flex';
    renderBirdHome();
    // Clear all key states so bird stops moving
    for (const k in keys) keys[k] = false;
    syncInput();
  }

  function closeBirdHome() {
    birdHomeVisible = false;
    const el = document.getElementById('birdHome');
    el.style.display = 'none';
  }

  function renderBirdHome() {
    if (!gameState || !gameState.self) return;
    const s = gameState.self;
    const el = document.getElementById('birdHome');
    const catalog = worldData ? worldData.skillCatalog : {};
    const colors = worldData ? worldData.birdColors : [];

    // Compute XP bar
    let cumXP = 0;
    for (let i = 0; i < s.level; i++) {
      cumXP += Math.floor(100 * Math.pow(1.5, i));
    }
    const currentLevelXP = s.xp - cumXP;
    const neededXP = s.nextLevelXP;
    const pct = neededXP > 0 ? Math.min(100, (currentLevelXP / neededXP) * 100) : 0;

    let skillSlots = s.skillSlots || 1;
    const equipped = s.equippedSkills || ['poop_barrage'];
    const owned = s.ownedSkills || ['poop_barrage'];

    // Bird Home: bunker-style with big spinning bird in center
    let html = '<div class="bh-layout">';

    // LEFT: stats panel
    html += '<div class="bh-stats-panel">';
    html += '<div class="bh-name">' + (s.name || '???') + '</div>';
    html += '<div class="bh-type">' + (s.type || 'pigeon').toUpperCase() + ' Lv.' + s.level + '</div>';
    html += '<div class="bh-xp-bar"><div class="bh-xp-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="bh-xp-text">' + currentLevelXP + '/' + neededXP + ' XP</div>';
    html += '<div class="bh-stat-row"><span>Coins</span><span class="bh-coins">\uD83D\uDCB0 ' + (s.coins || 0) + '</span></div>';
    html += '<div class="bh-stat-row"><span>Poops</span><span>' + s.totalPoops + '</span></div>';
    html += '<div class="bh-stat-row"><span>Steals</span><span>' + s.totalSteals + '</span></div>';
    html += '<div class="bh-stat-row"><span>Hits</span><span>' + s.totalHits + '</span></div>';
    html += '<div class="bh-stat-row"><span>Made Cry</span><span>' + s.humansCried + '</span></div>';
    html += '</div>';

    // CENTER: big bird showcase
    html += '<div class="bh-showcase">';
    html += '<canvas id="birdPreviewCanvas" width="180" height="180"></canvas>';
    html += '<div class="bh-showcase-hint">drag to spin</div>';
    html += '<div class="bh-action-buttons">';
    html += '<div class="bh-action-btn" id="bhColors">\uD83C\uDFA8 Colors</div>';
    html += '<div class="bh-action-btn" id="bhSkills">\u2694\uFE0F Skills</div>';
    html += '</div>';
    html += '</div>';

    // RIGHT: equipped skills summary
    html += '<div class="bh-equip-panel">';
    html += '<div class="bh-equip-title">LOADOUT</div>';
    for (let i = 0; i < 3; i++) {
      if (i < skillSlots) {
        const sk = equipped[i] || null;
        const skInfo = sk && catalog[sk] ? catalog[sk] : null;
        if (skInfo) {
          html += '<div class="bh-equip-slot filled">' + skInfo.icon + '<span>' + skInfo.name + '</span></div>';
        } else {
          html += '<div class="bh-equip-slot empty">empty</div>';
        }
      } else {
        const unlockLevel = i === 1 ? 10 : 25;
        html += '<div class="bh-equip-slot locked">\uD83D\uDD12 Lv.' + unlockLevel + '</div>';
      }
    }
    html += '<div class="bh-close-btn" id="birdHomeClose">\u2715 CLOSE</div>';
    html += '</div>';

    html += '</div>'; // end bh-layout

    // COLOR MODAL (hidden by default)
    html += '<div class="bh-modal" id="bhColorModal" style="display:none">';
    html += '<div class="bh-modal-content">';
    html += '<div class="bh-modal-title">CHOOSE COLOR</div>';
    html += '<div class="color-picker">';
    for (const c of colors) {
      const selected = s.birdColor === c ? ' selected' : '';
      html += '<div class="color-circle' + selected + '" style="background:' + c + '" data-color="' + c + '"></div>';
    }
    html += '<div class="color-circle' + (!s.birdColor ? ' selected' : '') + '" style="background:linear-gradient(135deg,#888,#666)" data-color="" title="Default"></div>';
    html += '</div>';
    html += '<div class="bh-modal-close" data-close="bhColorModal">DONE</div>';
    html += '</div></div>';

    // SKILL MODAL (hidden by default)
    html += '<div class="bh-modal" id="bhSkillModal" style="display:none">';
    html += '<div class="bh-modal-content bh-modal-wide">';
    html += '<div class="bh-modal-title">SKILL SHOP</div>';
    html += '<div class="bh-modal-subtitle">Tap slot, then tap skill to equip</div>';
    html += '<div class="skill-slots">';
    for (let i = 0; i < 3; i++) {
      if (i < skillSlots) {
        const sk = equipped[i] || null;
        const skInfo = sk && catalog[sk] ? catalog[sk] : null;
        const active = (activeEquipSlot === i) ? ' active' : '';
        if (skInfo) {
          html += '<div class="skill-slot' + active + '" data-slot="' + i + '">' + (i + 1) + ': ' + skInfo.icon + ' ' + skInfo.name + '</div>';
        } else {
          html += '<div class="skill-slot' + active + '" data-slot="' + i + '">' + (i + 1) + ': empty</div>';
        }
      } else {
        const unlockLevel = i === 1 ? 10 : 25;
        html += '<div class="skill-slot locked">\uD83D\uDD12 Lv.' + unlockLevel + '</div>';
      }
    }
    html += '</div>';
    html += '<div class="skill-shop">';
    for (const [skillId, info] of Object.entries(catalog)) {
      const isOwned = owned.includes(skillId);
      const isEquipped = equipped.includes(skillId);
      html += '<div class="skill-card">';
      html += '<div class="skill-card-info">';
      html += '<span class="skill-card-icon">' + info.icon + '</span>';
      html += '<div><div class="skill-card-name">' + info.name + '</div>';
      html += '<div class="skill-card-desc">' + info.desc + '</div></div>';
      html += '</div>';
      if (isEquipped) {
        html += '<span class="equipped-tag">EQUIPPED</span>';
      } else if (isOwned) {
        html += '<span class="owned-tag" data-equip="' + skillId + '">EQUIP</span>';
      } else {
        html += '<span class="buy-btn" data-buy="' + skillId + '">' + info.cost + ' \uD83D\uDCB0 BUY</span>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="bh-modal-close" data-close="bhSkillModal">DONE</div>';
    html += '</div></div>';

    el.innerHTML = html;

    // === Draw big bird on preview canvas ===
    const previewCanvas = document.getElementById('birdPreviewCanvas');
    if (previewCanvas) {
      const pCtx = previewCanvas.getContext('2d');
      let previewRotation = -Math.PI / 2; // facing up by default
      let dragging = false;
      let lastDragX = 0;

      function drawPreview() {
        pCtx.clearRect(0, 0, 180, 180);
        // Spotlight circle
        const grad = pCtx.createRadialGradient(90, 95, 10, 90, 95, 85);
        grad.addColorStop(0, 'rgba(255,200,50,0.08)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        pCtx.fillStyle = grad;
        pCtx.fillRect(0, 0, 180, 180);
        // Draw bird at 3x scale
        pCtx.save();
        pCtx.translate(90, 90);
        pCtx.scale(3, 3);
        const wingP = Date.now() * 0.005;
        Sprites.drawBird(pCtx, 0, 0, previewRotation, s.type || 'pigeon', wingP, true, s.birdColor || null);
        pCtx.restore();
      }
      drawPreview();

      // Spin on drag
      function onDragStart(x) { dragging = true; lastDragX = x; }
      function onDragMove(x) {
        if (!dragging) return;
        previewRotation += (x - lastDragX) * 0.03;
        lastDragX = x;
        drawPreview();
      }
      function onDragEnd() { dragging = false; }

      previewCanvas.addEventListener('mousedown', function(e) { onDragStart(e.clientX); });
      previewCanvas.addEventListener('mousemove', function(e) { onDragMove(e.clientX); });
      previewCanvas.addEventListener('mouseup', onDragEnd);
      previewCanvas.addEventListener('mouseleave', onDragEnd);
      previewCanvas.addEventListener('touchstart', function(e) { e.preventDefault(); onDragStart(e.touches[0].clientX); }, { passive: false });
      previewCanvas.addEventListener('touchmove', function(e) { e.preventDefault(); onDragMove(e.touches[0].clientX); }, { passive: false });
      previewCanvas.addEventListener('touchend', function(e) { e.preventDefault(); onDragEnd(); }, { passive: false });

      // Idle spin animation
      let idleSpin = setInterval(function() {
        if (!dragging && birdHomeVisible) {
          previewRotation += 0.015;
          drawPreview();
        } else if (!birdHomeVisible) {
          clearInterval(idleSpin);
        }
      }, 50);
    }

    // === Event listeners ===
    // Open color modal
    function addTapListener(elId, fn) {
      const target = document.getElementById(elId);
      if (!target) return;
      target.addEventListener('click', fn);
      target.addEventListener('touchstart', function(e) { e.preventDefault(); fn(); }, { passive: false });
    }

    addTapListener('bhColors', function() {
      document.getElementById('bhColorModal').style.display = 'flex';
    });
    addTapListener('bhSkills', function() {
      document.getElementById('bhSkillModal').style.display = 'flex';
    });

    // Close modals
    el.querySelectorAll('.bh-modal-close').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.getElementById(this.getAttribute('data-close')).style.display = 'none';
      });
      btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        document.getElementById(this.getAttribute('data-close')).style.display = 'none';
      }, { passive: false });
    });

    // Color picker
    el.querySelectorAll('.color-circle').forEach(function(circle) {
      circle.addEventListener('click', function() {
        const color = this.getAttribute('data-color');
        if (socket && joined) {
          socket.emit('action', { type: 'set_color', color: color || '' });
        }
        el.querySelectorAll('.color-circle').forEach(function(c) { c.classList.remove('selected'); });
        this.classList.add('selected');
        // Redraw preview with new color
        setTimeout(function() { if (birdHomeVisible) renderBirdHome(); }, 300);
      });
      circle.addEventListener('touchstart', function(e) { e.preventDefault(); this.click(); }, { passive: false });
    });

    // Skill slots
    el.querySelectorAll('.skill-slot:not(.locked)').forEach(function(slot) {
      slot.addEventListener('click', function() {
        activeEquipSlot = parseInt(this.getAttribute('data-slot'));
        renderBirdHome();
        document.getElementById('bhSkillModal').style.display = 'flex';
      });
      slot.addEventListener('touchstart', function(e) { e.preventDefault(); this.click(); }, { passive: false });
    });

    // Buy buttons
    el.querySelectorAll('.buy-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const skillId = this.getAttribute('data-buy');
        if (socket && joined) socket.emit('action', { type: 'buy_skill', skillId: skillId });
        setTimeout(function() { if (birdHomeVisible) renderBirdHome(); }, 200);
      });
      btn.addEventListener('touchstart', function(e) { e.preventDefault(); this.click(); }, { passive: false });
    });

    // Equip buttons
    el.querySelectorAll('.owned-tag[data-equip]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const skillId = this.getAttribute('data-equip');
        if (socket && joined) {
          SoundEngine.equipSkill();
          socket.emit('action', { type: 'equip_skill', skillId: skillId, slot: activeEquipSlot });
        }
        setTimeout(function() { if (birdHomeVisible) renderBirdHome(); }, 200);
      });
      btn.addEventListener('touchstart', function(e) { e.preventDefault(); this.click(); }, { passive: false });
    });

    // Close button
    addTapListener('birdHomeClose', closeBirdHome);
  }

  // ============================================================
  // PIGEONHOLE SLOTS CASINO
  // ============================================================
  function showCasinoOverlay() {
    casinoOverlayVisible = true;
    casinoOverlay.style.display = 'block';
    for (const k in keys) keys[k] = false;
    syncInput();
    updateCasinoDisplay();
  }

  function hideCasinoOverlay() {
    casinoOverlayVisible = false;
    casinoOverlay.style.display = 'none';
    if (casinoSpinInterval) { clearInterval(casinoSpinInterval); casinoSpinInterval = null; }
    casinoSpinning = false;
  }

  function updateCasinoDisplay() {
    if (!gameState || !gameState.self) return;
    const el = document.getElementById('casinoCoinVal');
    if (el) el.textContent = gameState.self.coins || 0;
    const jackpotEl = document.getElementById('casinoJackpotVal');
    if (jackpotEl && gameState.slotsJackpot !== undefined) jackpotEl.textContent = gameState.slotsJackpot;
  }

  function startCasinoSpin() {
    if (casinoSpinning) return;
    if (!gameState || !gameState.self || gameState.self.coins < 30) {
      const msg = document.getElementById('casinoResultMsg');
      if (msg) { msg.style.color = '#ff4444'; msg.textContent = '💸 Not enough coins! Need 30c'; }
      return;
    }
    casinoSpinning = true;
    const spinBtn = document.getElementById('casinoSpinBtn');
    if (spinBtn) { spinBtn.disabled = true; spinBtn.style.opacity = '0.5'; }
    const resultMsg = document.getElementById('casinoResultMsg');
    if (resultMsg) resultMsg.textContent = '';

    // Animate reels spinning
    let spinCount = 0;
    casinoSpinInterval = setInterval(() => {
      for (let i = 0; i < 3; i++) {
        const reel = document.getElementById('casinoReel' + i);
        if (reel) reel.textContent = CASINO_REEL_SYMBOLS[Math.floor(Math.random() * CASINO_REEL_SYMBOLS.length)];
      }
      spinCount++;
      if (spinCount > 30) {
        clearInterval(casinoSpinInterval);
        casinoSpinInterval = null;
      }
    }, 60);

    socket.emit('action', { type: 'slots_spin' });
  }

  function onSlotsResult(ev) {
    // Stop spin animation and snap to result
    if (casinoSpinInterval) { clearInterval(casinoSpinInterval); casinoSpinInterval = null; }
    casinoSpinning = false;

    // Stagger the reel stops for drama (reel 0 stops first, then 1, then 2)
    const reels = ev.reels;
    setTimeout(() => {
      const r0 = document.getElementById('casinoReel0');
      if (r0) { r0.textContent = reels[0]; r0.style.transform = 'scale(1.2)'; setTimeout(() => { r0.style.transform = ''; }, 200); }
    }, 0);
    setTimeout(() => {
      const r1 = document.getElementById('casinoReel1');
      if (r1) { r1.textContent = reels[1]; r1.style.transform = 'scale(1.2)'; setTimeout(() => { r1.style.transform = ''; }, 200); }
    }, 200);
    setTimeout(() => {
      const r2 = document.getElementById('casinoReel2');
      if (r2) { r2.textContent = reels[2]; r2.style.transform = 'scale(1.2)'; setTimeout(() => { r2.style.transform = ''; }, 200); }

      // Show result after all reels stop
      setTimeout(() => {
        const msg = document.getElementById('casinoResultMsg');
        if (msg) {
          const nowMs = performance.now();
          switch (ev.resultType) {
            case 'jackpot':
              msg.style.color = '#ffd700';
              msg.textContent = `👑 JACKPOT!! +${ev.payout}c!!!!`;
              effects.push({ type: 'screen_shake', intensity: 20, duration: 1200, time: nowMs });
              break;
            case 'big_win':
              msg.style.color = '#ff88ff';
              msg.textContent = `💎 BIG WIN! +${ev.payout}c!`;
              effects.push({ type: 'screen_shake', intensity: 8, duration: 500, time: nowMs });
              break;
            case 'win':
              msg.style.color = '#44ff88';
              msg.textContent = ev.specialEffect === 'mega_poop'
                ? `💩 TRIPLE POOP! +${ev.payout}c + FREE MEGA POOP 💣`
                : `✨ WIN! +${ev.payout}c`;
              break;
            case 'small_win':
              msg.style.color = '#aaffaa';
              msg.textContent = `😅 Small win: +${ev.payout}c`;
              break;
            default:
              msg.style.color = '#ff6666';
              msg.textContent = `💸 No luck... lost 30c`;
          }
        }

        // Update jackpot display
        const jackpotEl = document.getElementById('casinoJackpotVal');
        if (jackpotEl && ev.jackpot !== undefined) jackpotEl.textContent = ev.jackpot;

        // Re-enable spin button
        const spinBtn = document.getElementById('casinoSpinBtn');
        if (spinBtn) { spinBtn.disabled = false; spinBtn.style.opacity = '1'; }

        updateCasinoDisplay();
      }, 300);
    }, 400);
  }

  // Casino button listeners (set up once during init, checked below)
  if (casinoSpinBtn) {
    casinoSpinBtn.addEventListener('click', () => startCasinoSpin());
  }
  if (casinoCloseBtn) {
    casinoCloseBtn.addEventListener('click', () => hideCasinoOverlay());
  }

  // ============================================================
  // CITY HALL — BOUNTY BOARD OVERLAY
  // ============================================================
  function showBountyBoard() {
    bountyBoardVisible = true;
    bountyBoardOverlay.style.display = 'block';
    for (const k in keys) keys[k] = false;
    syncInput();
    renderBountyBoard();
  }

  function hideBountyBoard() {
    bountyBoardVisible = false;
    bountyBoardOverlay.style.display = 'none';
  }

  function renderBountyBoard() {
    if (!gameState) return;
    const pool = gameState.dethronementPool || { total: 0, topDonor: null, lastPaidTo: null };
    const kp = gameState.kingpin;
    const self = gameState.self;

    // Kingpin section
    const kpInfo = document.getElementById('bbKingpinInfo');
    if (kpInfo) {
      if (kp) {
        const isSelf = self && kp.birdId === self.id;
        kpInfo.innerHTML = `<span style="font:bold 14px monospace;color:#ffd700;">👑 ${kp.birdName}</span>`
          + `<br><span style="color:#ffcc44;">${kp.coins}c</span>`
          + (isSelf ? '<br><span style="color:#ff8800;font:9px monospace;">That\'s you! Others are plotting your downfall...</span>' : '');
      } else {
        kpInfo.innerHTML = '<span style="color:#666;font:italic 11px monospace;">Throne is vacant — no Kingpin</span>';
      }
    }

    // Pool section
    const poolTotalEl = document.getElementById('bbPoolTotal');
    if (poolTotalEl) {
      poolTotalEl.textContent = pool.total > 0 ? `💀 ${pool.total}c` : '0c — be the first to contribute!';
    }

    const topDonorEl = document.getElementById('bbTopDonor');
    if (topDonorEl) {
      topDonorEl.textContent = pool.topDonor
        ? `Biggest contributor: ${pool.topDonor.name} (${pool.topDonor.amount}c)`
        : '';
    }

    const lastPaidEl = document.getElementById('bbLastPaidOut');
    if (lastPaidEl) {
      lastPaidEl.textContent = pool.lastPaidTo
        ? `Last payout: ${pool.lastPaidTo.name} claimed ${pool.lastPaidTo.amount}c`
        : '';
    }

    // Contribute button — disable if no Kingpin or you are Kingpin or insufficient funds
    const contributeBtn = document.getElementById('bbContributeBtn');
    const noKingpin = !kp;
    const isSelf = self && kp && kp.birdId === self.id;
    if (contributeBtn) {
      const disabled = noKingpin || isSelf;
      contributeBtn.disabled = disabled;
      contributeBtn.style.opacity = disabled ? '0.4' : '1';
      contributeBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }

    // Witness Protection status display
    const now = Date.now();
    if (bbWpStatus && self) {
      const wpActive = self.witnessProtectionUntil && self.witnessProtectionUntil > now;
      const wpCooldown = self.witnessProtectionCooldown && self.witnessProtectionCooldown > now;
      if (wpActive) {
        const secsLeft = Math.ceil((self.witnessProtectionUntil - now) / 1000);
        bbWpStatus.innerHTML = `<span style="color:#44ff88;font-weight:bold;">🛡 ACTIVE — ${secsLeft}s remaining · You are off the grid</span>`;
      } else if (wpCooldown) {
        const cdLeft = Math.ceil((self.witnessProtectionCooldown - now) / 1000);
        bbWpStatus.innerHTML = `<span style="color:#888;">Cooldown: ${cdLeft}s remaining</span>`;
      } else if (self.coins < 500) {
        bbWpStatus.innerHTML = `<span style="color:#886644;">Insufficient funds — need 500c (you have ${self.coins || 0}c)</span>`;
      } else {
        bbWpStatus.innerHTML = '<span style="color:#44aaff;">Available — your identity can be wiped</span>';
      }
    }
    if (bbWpBtn && self) {
      const wpActive = self.witnessProtectionUntil && self.witnessProtectionUntil > now;
      const wpCooldown = self.witnessProtectionCooldown && self.witnessProtectionCooldown > now;
      const canBuy = !wpActive && !wpCooldown && (self.coins || 0) >= 500;
      bbWpBtn.disabled = !canBuy;
      bbWpBtn.style.opacity = canBuy ? '1' : '0.4';
      bbWpBtn.style.cursor = canBuy ? 'pointer' : 'not-allowed';
    }

    // Leaderboard — use leaderboardData (XP-based global rankings)
    const lbEl = document.getElementById('bbLeaderboard');
    if (lbEl) {
      const lb = leaderboardData || [];
      if (lb.length === 0) {
        lbEl.textContent = 'No data yet';
      } else {
        const topFive = lb.slice(0, 5);
        lbEl.innerHTML = topFive.map((b, i) => {
          const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
          return `<div style="display:flex;justify-content:space-between;margin-bottom:3px;">
            <span>${medals[i]} ${b.name}</span>
            <span style="color:#88aaff;">${b.xp} XP</span>
          </div>`;
        }).join('');
      }
    }

    // Election section
    const elEl = document.getElementById('bbElectionContent');
    if (elEl && gameState) {
      const el = gameState.election;
      const now2 = Date.now();
      if (!el) {
        elEl.innerHTML = '<span style="color:#447755;font:italic 9px monospace;">No election in progress — next election fires automatically</span>';
      } else if (el.state === 'voting') {
        const secsLeft = Math.max(0, Math.ceil((el.endsAt - now2) / 1000));
        const myVote = el.myVote;
        const selfNearCH = gameState.nearCityHall;
        let html2 = `<div style="color:#66ffaa;font:bold 10px monospace;margin-bottom:6px;">🗳️ VOTING OPEN — ${secsLeft}s remaining · ${el.totalVotes || 0} votes</div>`;
        if (myVote) {
          const myOpt = (el.options || []).find(o => o.id === myVote);
          html2 += `<div style="color:#aaffcc;font:9px monospace;margin-bottom:6px;">✅ You voted: ${myOpt ? myOpt.emoji + ' ' + myOpt.name : myVote}</div>`;
        } else if (!selfNearCH) {
          html2 += `<div style="color:#aa9955;font:9px monospace;margin-bottom:6px;">⚠️ Fly to City Hall to vote!</div>`;
        }
        html2 += `<div style="display:flex;flex-direction:column;gap:4px;">`;
        for (const opt of (el.options || [])) {
          const isMyVote = myVote === opt.id;
          const votePct = el.totalVotes > 0 ? Math.round((el.voteCount[opt.id] || 0) / el.totalVotes * 100) : 0;
          const canVote = !myVote && selfNearCH;
          html2 += `<div style="display:flex;align-items:center;gap:6px;">
            <button onclick="window._castElectionVote('${opt.id}')"
              style="background:${isMyVote ? 'rgba(0,80,40,0.9)' : 'rgba(20,50,30,0.7)'};
              color:${isMyVote ? '#66ffaa' : '#99cc88'};border:1px solid ${isMyVote ? '#33aa66' : '#225533'};
              border-radius:6px;padding:3px 8px;cursor:${canVote ? 'pointer' : 'default'};
              font:bold 9px monospace;white-space:nowrap;opacity:${canVote || isMyVote ? '1' : '0.6'};"
              ${canVote ? '' : 'disabled'}>
              ${opt.emoji} ${opt.name}${isMyVote ? ' ✅' : ''}
            </button>
            <div style="flex:1;background:rgba(0,30,15,0.6);border-radius:4px;height:8px;overflow:hidden;">
              <div style="background:#22aa55;height:100%;width:${votePct}%;border-radius:4px;transition:width 0.3s;"></div>
            </div>
            <span style="color:#669966;font:8px monospace;min-width:28px;">${votePct}%</span>
          </div>
          <div style="color:#557755;font:8px monospace;margin-left:4px;margin-bottom:2px;">${opt.desc}</div>`;
        }
        html2 += '</div>';
        elEl.innerHTML = html2;
      } else if (el.state === 'active') {
        const secsLeft = Math.max(0, Math.ceil((el.policyEndsAt - now2) / 1000));
        const mins = Math.floor(secsLeft / 60);
        const rem = secsLeft % 60;
        const POLICY_DESCS = {
          feast: 'All food +60% more & +50% XP/coins from collecting',
          tax_revolt: 'All poop-hit coin gains +50%',
          anarchy: 'All cops despawned — total lawlessness',
          unity: 'Territory capture speed ×2.5',
          festival: 'All XP gains +50%',
          bloodsport: 'Duel stakes ×2, Arena FREE entry, Arena pot ×2',
        };
        elEl.innerHTML = `
          <div style="color:#66ffaa;font:bold 11px monospace;">✅ ${el.emoji || ''} ${(el.policy || '').toUpperCase()} ACTIVE</div>
          <div style="color:#88ccaa;font:9px monospace;margin-top:4px;">${POLICY_DESCS[el.policy] || ''}</div>
          <div style="color:#33aa55;font:8px monospace;margin-top:6px;">Expires in ${mins}:${rem.toString().padStart(2,'0')}</div>`;
      }
    }

    // === WANTED HOTLINE section ===
    const now3 = Date.now();
    const bbShieldStatus = document.getElementById('bbHotlineShieldStatus');
    const bbShieldBtn = document.getElementById('bbShieldBtn');
    const bbTargets = document.getElementById('bbHotlineTargets');

    if (bbShieldStatus && self) {
      const shieldActive = self.informantShieldUntil && self.informantShieldUntil > now3;
      const shieldCd = self.hotlineShieldCooldown && self.hotlineShieldCooldown > now3;
      if (shieldActive) {
        const s = Math.ceil((self.informantShieldUntil - now3) / 1000);
        bbShieldStatus.innerHTML = `<span style="color:#ff4444;font-weight:bold;">🛡 SHIELD ACTIVE — ${s}s · Next tip BOUNCES BACK on snitch</span>`;
      } else if (shieldCd) {
        const s = Math.ceil((self.hotlineShieldCooldown - now3) / 1000);
        bbShieldStatus.innerHTML = `<span style="color:#664444;">Cooldown: ${s}s</span>`;
      } else if ((self.coins || 0) < 75) {
        bbShieldStatus.innerHTML = `<span style="color:#554444;">Need 75c (have ${self.coins || 0}c)</span>`;
      } else {
        bbShieldStatus.innerHTML = `<span style="color:#886666;">Unprotected — buy the shield to expose snitches</span>`;
      }
    }

    if (bbShieldBtn && self) {
      const shieldActive = self.informantShieldUntil && self.informantShieldUntil > now3;
      const shieldCd = self.hotlineShieldCooldown && self.hotlineShieldCooldown > now3;
      const canBuy = !shieldActive && !shieldCd && (self.coins || 0) >= 75;
      bbShieldBtn.disabled = !canBuy;
      bbShieldBtn.style.opacity = canBuy ? '1' : '0.4';
      bbShieldBtn.style.cursor = canBuy ? 'pointer' : 'not-allowed';
    }

    if (bbTargets && gameState) {
      const online = gameState.onlineBirds || [];
      const myCoins = (self && self.coins) || 0;
      if (online.length === 0) {
        bbTargets.innerHTML = `<span style="color:#554444;font:italic 9px monospace;">No other birds online to tip on</span>`;
      } else {
        bbTargets.innerHTML = online.map(b => {
          const tag = b.gangTag ? `<span style="color:#774444;">[${b.gangTag}]</span> ` : '';
          const hasShield = b.informantShieldUntil && b.informantShieldUntil > now3;
          const shieldTip = hasShield ? ' 🛡' : '';
          const canTip = myCoins >= 60;
          return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span>${tag}<span style="color:#cc8888;">${b.name}</span>${shieldTip}${hasShield ? '<span style="color:#553333;font:8px monospace;"> (SHIELDED)</span>' : ''}</span>
            <button data-tipid="${b.id}" data-tipname="${b.name}"
              style="background:rgba(100,10,10,0.85);color:#ff6666;border:1px solid #881111;
              border-radius:4px;font:bold 8px monospace;padding:2px 7px;cursor:${canTip ? 'pointer' : 'not-allowed'};
              opacity:${canTip ? '1' : '0.4'};white-space:nowrap;"
              ${canTip ? '' : 'disabled'}>📞 TIP (60c)</button>
          </div>`;
        }).join('');

        // Wire up tip buttons
        bbTargets.querySelectorAll('[data-tipid]').forEach(btn => {
          btn.addEventListener('click', e => {
            e.stopPropagation();
            const tid = btn.dataset.tipid;
            const tname = btn.dataset.tipname;
            if (!socket || !joined) return;
            socket.emit('action', { type: 'hotline_tip', targetId: tid });
            const msg = document.getElementById('bbHotlineMsg');
            if (msg) { msg.textContent = `📞 Tip sent on ${tname}...`; setTimeout(() => { if (msg) msg.textContent = ''; }, 2500); }
          });
        });
      }
    }
  }

  function updatePoolHudPill(total) {
    if (!poolHudPill) return;
    if (total > 0) {
      poolHudPill.style.display = 'block';
      poolHudPill.textContent = `💀 POOL: ${total}c`;
    } else {
      poolHudPill.style.display = 'none';
    }
  }

  function updateElectionHudPill() {
    const pill = document.getElementById('electionHudPill');
    if (!pill || !gameState) return;
    const el = gameState.election;
    const now = Date.now();
    if (!el) { pill.style.display = 'none'; return; }
    if (el.state === 'voting') {
      const secsLeft = Math.max(0, Math.ceil((el.endsAt - now) / 1000));
      pill.style.display = 'block';
      pill.innerHTML = `🗳️ CITY ELECTION — VOTE NOW! Press [V] at City Hall · ${secsLeft}s left · ${el.totalVotes || 0} votes cast`;
      pill.style.cursor = 'pointer';
      pill.onclick = () => { if (gameState.nearCityHall) showBountyBoard(); };
    } else if (el.state === 'active') {
      const secsLeft = Math.max(0, Math.ceil((el.policyEndsAt - now) / 1000));
      const mins = Math.floor(secsLeft / 60);
      const rem = secsLeft % 60;
      pill.style.display = 'block';
      pill.style.background = 'rgba(0,60,30,0.92)';
      pill.style.borderColor = '#22aa44';
      pill.style.color = '#66ffaa';
      pill.innerHTML = `🗳️ ${el.emoji || ''} ${el.policy ? el.policy.toUpperCase() : ''} POLICY ACTIVE — ${mins}:${rem.toString().padStart(2,'0')} left`;
      pill.onclick = null;
    } else {
      pill.style.display = 'none';
    }
  }

  // Election vote helper (called from inline onclick)
  window._castElectionVote = function(policyId) {
    if (!gameState || !gameState.nearCityHall) return;
    socket.emit('action', { type: 'election_vote', policyId });
  };

  // ============================================================
  // AUCTION HOUSE (Session 108) — helper functions
  // ============================================================
  window._renderAuctionOverlay = function() {
    const overlay = document.getElementById('auctionOverlay');
    if (!overlay) return;
    const au = gameState && gameState.auction;
    if (!au) { overlay.style.display = 'none'; return; }

    const lotLabel = document.getElementById('auctionLotLabel');
    const lotItem = document.getElementById('auctionLotItem');
    const lotName = document.getElementById('auctionLotName');
    const lotDesc = document.getElementById('auctionLotDesc');
    const bidInfo = document.getElementById('auctionBidInfo');
    const timerEl = document.getElementById('auctionTimer');
    const bidRow = document.getElementById('auctionBidRow');
    const allLots = document.getElementById('auctionAllLots');

    if (au.state === 'gap') {
      const nextMs = Math.max(0, au.nextLotAt - Date.now());
      if (lotLabel) lotLabel.textContent = au.currentLot === 0 ? 'Auction opens in...' : 'Next lot in...';
      if (lotItem) lotItem.textContent = au.lots && au.lots[au.currentLot] ? au.lots[au.currentLot].emoji : '🔨';
      if (lotName) lotName.textContent = au.lots && au.lots[au.currentLot] ? au.lots[au.currentLot].name : '';
      if (lotDesc) lotDesc.textContent = au.lots && au.lots[au.currentLot] ? au.lots[au.currentLot].desc : '';
      if (bidInfo) bidInfo.textContent = `Starting bid: ${au.lots && au.lots[au.currentLot] ? au.lots[au.currentLot].currentBid : '?'}c`;
      if (timerEl) timerEl.textContent = `${Math.ceil(nextMs / 1000)}s`;
      if (bidRow) bidRow.style.display = 'none';
    } else {
      // bidding state
      const lot = au.lots && au.lots[au.currentLot];
      const timeLeft = Math.max(0, au.lotEndsAt - Date.now());
      if (lotLabel) lotLabel.textContent = `Lot ${au.currentLot + 1} of ${au.lots ? au.lots.length : 3} — BIDDING LIVE`;
      if (lotItem) lotItem.textContent = lot ? lot.emoji : '?';
      if (lotName) lotName.textContent = lot ? lot.name : '';
      if (lotDesc) lotDesc.textContent = lot ? lot.desc : '';
      const bidderTag = au.currentBidderGang ? `[${au.currentBidderGang}] ` : '';
      if (bidInfo) bidInfo.textContent = au.currentBidder
        ? `Current bid: ${au.currentBid}c by ${bidderTag}${au.currentBidderName}`
        : `Opening bid: ${au.currentBid}c — no bids yet`;
      if (timerEl) timerEl.textContent = `Lot closes in: ${Math.ceil(timeLeft / 1000)}s`;
      if (bidRow) bidRow.style.display = 'flex';
      // Pre-fill input with min bid
      const input = document.getElementById('auctionBidInput');
      if (input) input.min = au.currentBid + 5;
      const bidMsg = document.getElementById('auctionBidMsg');
      if (bidMsg && !bidMsg._userMsg) bidMsg.textContent = '';
    }

    // All lots preview
    if (allLots && au.lots) {
      allLots.textContent = 'Lots: ' + au.lots.map((l, i) => `${i + 1}.${l.emoji}${l.name}`).join(' | ');
    }

    if (!gameState.self || !gameState.self.nearAuctionHouse) {
      overlay.style.display = 'none';
    } else {
      overlay.style.display = 'block';
    }
  };

  window._placeAuctionBid = function() {
    const input = document.getElementById('auctionBidInput');
    if (!input) return;
    const amount = parseInt(input.value, 10);
    if (isNaN(amount) || amount < 5) return;
    const bidMsg = document.getElementById('auctionBidMsg');
    if (bidMsg) { bidMsg.textContent = ''; bidMsg._userMsg = false; }
    socket.emit('action', { type: 'place_auction_bid', amount });
  };

  window._closeAuctionOverlay = function() {
    const overlay = document.getElementById('auctionOverlay');
    if (overlay) overlay.style.display = 'none';
  };

  // Bounty Board button listeners
  if (bbCloseBtn) {
    bbCloseBtn.addEventListener('click', () => hideBountyBoard());
  }
  if (bbContributeBtn) {
    bbContributeBtn.addEventListener('click', () => {
      const raw = parseInt(bbContributeAmount ? bbContributeAmount.value : '50', 10);
      const amount = isNaN(raw) ? 50 : Math.max(10, Math.min(500, raw));
      socket.emit('action', { type: 'pool_contribute', amount });
    });
  }
  if (bbWpBtn) {
    bbWpBtn.addEventListener('click', () => {
      socket.emit('action', { type: 'buy_witness_protection' });
    });
  }

  // ============================================================
  // BIRD TATTOO PARLOR — OVERLAY
  // ============================================================
  function showTattooOverlay() {
    tattooOverlayVisible = true;
    tattooOverlay.style.display = 'block';
    for (const k in keys) keys[k] = false;
    syncInput();
    renderTattooOverlay();
  }

  function hideTattooOverlay() {
    tattooOverlayVisible = false;
    tattooOverlay.style.display = 'none';
  }

  function renderTattooOverlay() {
    if (!gameState || !gameState.self || !worldData || !worldData.tattooParlor) return;
    const catalog = worldData.tattooParlor.catalog || [];
    const owned = gameState.tattoosOwned || [];
    const equipped = gameState.tattoosEquipped || [];
    const coins = gameState.self.coins || 0;

    // Update coin display
    const coinEl = document.getElementById('tattooCoinVal');
    if (coinEl) coinEl.textContent = coins;

    // Equipped slots
    const slotsEl = document.getElementById('tattooEquippedSlots');
    if (slotsEl) {
      slotsEl.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const slot = document.createElement('div');
        slot.style.cssText = 'display:inline-block;width:36px;height:36px;border:2px solid rgba(255,68,200,0.6);border-radius:6px;text-align:center;line-height:36px;font-size:20px;margin:0 4px;background:rgba(30,0,50,0.8);cursor:pointer;';
        if (equipped[i]) {
          const t = catalog.find(c => c.id === equipped[i]);
          slot.textContent = t ? t.emoji : '?';
          slot.title = `Unequip ${t ? t.name : equipped[i]}`;
          slot.onclick = () => {
            if (socket && joined) socket.emit('action', { type: 'equip_tattoo', tattooId: equipped[i] });
          };
        } else {
          slot.textContent = '·';
          slot.style.opacity = '0.3';
        }
        slotsEl.appendChild(slot);
      }
    }

    // Catalog grid grouped by category
    const gridEl = document.getElementById('tattooCatalogGrid');
    if (!gridEl) return;
    gridEl.innerHTML = '';
    const categories = ['Crime', 'Power', 'Nature', 'Attitude', 'Rare'];
    const catColors = { Crime: '#ff4444', Power: '#ffd700', Nature: '#44ff88', Attitude: '#ff8844', Rare: '#cc44ff' };

    for (const cat of categories) {
      const items = catalog.filter(t => t.category === cat);
      if (!items.length) continue;

      const catHeader = document.createElement('div');
      catHeader.style.cssText = `width:100%;color:${catColors[cat]};font-size:10px;font-weight:bold;margin:6px 0 2px;letter-spacing:1px;text-transform:uppercase;`;
      catHeader.textContent = cat;
      gridEl.appendChild(catHeader);

      for (const tattoo of items) {
        const isOwned = owned.includes(tattoo.id);
        const isEquipped = equipped.includes(tattoo.id);
        const canAfford = coins >= tattoo.cost;

        const card = document.createElement('div');
        card.style.cssText = `display:inline-flex;flex-direction:column;align-items:center;width:60px;margin:3px;padding:6px 4px;border-radius:8px;cursor:pointer;font-size:11px;border:1.5px solid ${isOwned ? catColors[cat] : 'rgba(120,80,150,0.4)'};background:${isOwned ? 'rgba(30,0,50,0.9)' : 'rgba(15,0,25,0.8)'};vertical-align:top;`;

        const emojiSpan = document.createElement('div');
        emojiSpan.style.cssText = 'font-size:22px;line-height:1;margin-bottom:3px;';
        emojiSpan.textContent = tattoo.emoji;

        const nameSpan = document.createElement('div');
        nameSpan.style.cssText = 'color:#ddd;font-size:9px;margin-bottom:3px;white-space:nowrap;';
        nameSpan.textContent = tattoo.name;

        const actionBtn = document.createElement('button');
        actionBtn.style.cssText = 'border:none;border-radius:4px;padding:2px 6px;font-size:9px;cursor:pointer;font-weight:bold;';
        if (!isOwned) {
          actionBtn.textContent = `${tattoo.cost}c`;
          actionBtn.style.background = canAfford ? catColors[cat] : '#555';
          actionBtn.style.color = canAfford ? '#000' : '#888';
          actionBtn.disabled = !canAfford;
          actionBtn.onclick = () => {
            if (socket && joined) socket.emit('action', { type: 'buy_tattoo', tattooId: tattoo.id });
          };
        } else if (isEquipped) {
          actionBtn.textContent = '✓ ON';
          actionBtn.style.background = catColors[cat];
          actionBtn.style.color = '#000';
          actionBtn.onclick = () => {
            if (socket && joined) socket.emit('action', { type: 'equip_tattoo', tattooId: tattoo.id });
          };
        } else {
          actionBtn.textContent = 'EQUIP';
          actionBtn.style.background = 'rgba(80,40,100,0.9)';
          actionBtn.style.color = catColors[cat];
          actionBtn.onclick = () => {
            if (socket && joined) socket.emit('action', { type: 'equip_tattoo', tattooId: tattoo.id });
          };
        }

        card.appendChild(emojiSpan);
        card.appendChild(nameSpan);
        card.appendChild(actionBtn);
        gridEl.appendChild(card);
      }
    }
  }

  if (tattooCloseBtn) {
    tattooCloseBtn.addEventListener('click', () => hideTattooOverlay());
  }

  // Gazette close button
  const gazetteCloseBtn = document.getElementById('gazetteCloseBtn');
  if (gazetteCloseBtn) {
    gazetteCloseBtn.addEventListener('click', closeGazette);
  }
  // Click overlay background to close gazette
  const gazetteOverlayEl = document.getElementById('gazetteOverlay');
  if (gazetteOverlayEl) {
    gazetteOverlayEl.addEventListener('click', (e) => {
      if (e.target === gazetteOverlayEl) closeGazette();
    });
  }

  // ============================================================
  // PRESTIGE PANEL
  // ============================================================
  function showPrestigePanel() {
    if (!prestigeOverlay) return;
    prestigePanelVisible = true;
    prestigeOverlay.style.display = 'block';
    for (const k in keys) keys[k] = false;
    syncInput();
    renderPrestigePanel();
  }

  function hidePrestigePanel() {
    if (!prestigeOverlay) return;
    prestigePanelVisible = false;
    prestigeOverlay.style.display = 'none';
  }

  function renderPrestigePanel() {
    if (!gameState || !gameState.self || !prestigeOverlay) return;
    const s = gameState.self;
    const prestige = s.prestige || 0;
    const threshold = s.prestigeThreshold || 10000;
    const maxPrestige = s.maxPrestige || 5;
    const badges = ['', '⚜️', '⚜️⚜️', '⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️⚜️'];
    const tierNames = ['Fledgling', 'Ascended', 'Veteran', 'Elite', 'Champion', 'LEGEND'];
    const bonusDescs = [
      'No bonuses yet — prestige to ascend!',
      '+15% XP on all poop hits',
      '+15% XP · +10% coins on poop hits',
      '+15% XP · +10% coins · -15% poop cooldown',
      '+15% XP · +10% coins · -15% cooldown · Spawn with 50 food',
      '+20% XP · +15% coins · -20% cooldown · Spawn food · LEGEND status (golden name)',
    ];

    // XP toward prestige
    let cumXP = 0;
    for (let i = 0; i < s.level; i++) cumXP += Math.floor(100 * Math.pow(1.5, i));
    const totalXP = s.xp || 0;
    const pctToPrestige = prestige >= maxPrestige ? 100 : Math.min(100, Math.floor((totalXP / threshold) * 100));
    const canPrestige = totalXP >= threshold && prestige < maxPrestige;

    const badgeEl = document.getElementById('prestigeBadgeDisplay');
    if (badgeEl) badgeEl.textContent = prestige > 0 ? badges[prestige] : '🐣';

    const tierEl = document.getElementById('prestigeTierName');
    if (tierEl) {
      tierEl.textContent = tierNames[Math.min(prestige, 5)];
      tierEl.style.color = prestige >= 5 ? '#ffd700' : prestige >= 3 ? '#cc88ff' : prestige >= 1 ? '#88ddff' : '#aaa';
    }

    const bonusEl = document.getElementById('prestigeBonusDesc');
    if (bonusEl) bonusEl.textContent = bonusDescs[Math.min(prestige, 5)];

    const barEl = document.getElementById('prestigeXpBar');
    if (barEl) barEl.style.width = pctToPrestige + '%';

    const xpLabel = document.getElementById('prestigeXpLabel');
    if (xpLabel) {
      if (prestige >= maxPrestige) {
        xpLabel.textContent = 'MAX PRESTIGE ACHIEVED';
      } else {
        xpLabel.textContent = `${totalXP.toLocaleString()} / ${threshold.toLocaleString()} XP (${pctToPrestige}%)`;
      }
    }

    const ascendBtn = document.getElementById('prestigeAscendBtn');
    if (ascendBtn) {
      ascendBtn.style.display = canPrestige ? 'block' : 'none';
    }

    const maxEl = document.getElementById('prestigeMaxMsg');
    if (maxEl) maxEl.style.display = prestige >= maxPrestige ? 'block' : 'none';

    // Next tier preview
    const nextPreviewEl = document.getElementById('prestigeNextBonus');
    if (nextPreviewEl) {
      if (prestige < maxPrestige) {
        nextPreviewEl.textContent = `Next (${badges[prestige + 1]} ${tierNames[prestige + 1]}): ${bonusDescs[prestige + 1]}`;
      } else {
        nextPreviewEl.textContent = '';
      }
    }
  }

  // Handle prestige event from server
  socket.on('event', (evts) => {
    // (already handled inline below — just adding prestige-specific rendering)
  });

  // Wire up prestige ascend button
  const _prestigeAscendBtn = document.getElementById('prestigeAscendBtn');
  if (_prestigeAscendBtn) {
    _prestigeAscendBtn.addEventListener('click', () => {
      socket.emit('action', { type: 'prestige' });
      hidePrestigePanel();
    });
  }
  const _prestigeCloseBtn = document.getElementById('prestigeCloseBtn');
  if (_prestigeCloseBtn) {
    _prestigeCloseBtn.addEventListener('click', () => hidePrestigePanel());
  }

  // ============================================================
  // BIRD GANGS — HQ OVERLAY
  // ============================================================
  function showGangHq() {
    gangHqVisible = true;
    gangHqOverlay.style.display = 'block';
    for (const k in keys) keys[k] = false;
    syncInput();
    renderGangHq();
    // Init color picker
    _initGangColorPicker();
    // Wire up buttons
    _wireGangHqButtons();
  }

  function hideGangHq() {
    gangHqVisible = false;
    gangHqOverlay.style.display = 'none';
  }

  function showGangWarHud(msg, durationMs) {
    gangWarHud.textContent = msg;
    gangWarHud.style.display = 'block';
    clearTimeout(gangWarHud._timer);
    gangWarHud._timer = setTimeout(() => { gangWarHud.style.display = 'none'; }, durationMs || 5000);
  }

  function _initGangColorPicker() {
    const picker = document.getElementById('gangColorPicker');
    if (!picker || picker._initialized) return;
    picker._initialized = true;
    const colors = (gameState && gameState.gangColors) ? gameState.gangColors :
      ['#ff3333','#ff8800','#ffcc00','#33cc55','#3399ff','#cc44ff','#ff44aa','#00ccdd'];
    gangSelectedColor = colors[0];
    colors.forEach(c => {
      const swatch = document.createElement('div');
      swatch.style.cssText = `width:24px;height:24px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${c === gangSelectedColor ? '#fff' : 'transparent'};`;
      swatch.addEventListener('click', () => {
        gangSelectedColor = c;
        picker.querySelectorAll('div').forEach(s => { s.style.border = '2px solid transparent'; });
        swatch.style.border = '2px solid #fff';
      });
      picker.appendChild(swatch);
    });
  }

  function _wireGangHqButtons() {
    // Create gang
    const createBtn = document.getElementById('gangCreateBtn');
    if (createBtn && !createBtn._wired) {
      createBtn._wired = true;
      createBtn.addEventListener('click', () => {
        const tag = (document.getElementById('gangTagInput').value || '').toUpperCase().trim();
        const name = (document.getElementById('gangNameInput').value || '').trim();
        socket.emit('action', { type: 'gang_create', tag, name });
      });
    }
    // Deposit
    const depositBtn = document.getElementById('gangDepositBtn');
    if (depositBtn && !depositBtn._wired) {
      depositBtn._wired = true;
      depositBtn.addEventListener('click', () => {
        const amount = parseInt(document.getElementById('gangDepositInput').value) || 0;
        if (amount > 0) socket.emit('action', { type: 'gang_deposit', amount });
      });
    }
    // Distribute (leader only)
    const distBtn = document.getElementById('gangDistributeBtn');
    if (distBtn && !distBtn._wired) {
      distBtn._wired = true;
      distBtn.addEventListener('click', () => {
        if (confirm('Distribute gang treasury equally to all online members?')) {
          socket.emit('action', { type: 'gang_distribute' });
        }
      });
    }
    // Leave
    const leaveBtn = document.getElementById('gangLeaveBtn');
    if (leaveBtn && !leaveBtn._wired) {
      leaveBtn._wired = true;
      leaveBtn.addEventListener('click', () => {
        if (confirm('Leave your gang?')) {
          socket.emit('action', { type: 'gang_leave' });
        }
      });
    }
    // Build nest
    const nestBuildBtn = document.getElementById('gangNestBuildBtn');
    if (nestBuildBtn && !nestBuildBtn._wired) {
      nestBuildBtn._wired = true;
      nestBuildBtn.addEventListener('click', () => {
        socket.emit('action', { type: 'nest_build' });
      });
    }
    // Close
    if (gangHqClose && !gangHqClose._wired) {
      gangHqClose._wired = true;
      gangHqClose.addEventListener('click', hideGangHq);
    }
    // Accept/decline gang invite
    const acceptInvite = document.getElementById('gangAcceptInviteBtn');
    if (acceptInvite && !acceptInvite._wired) {
      acceptInvite._wired = true;
      acceptInvite.addEventListener('click', () => {
        socket.emit('action', { type: 'gang_accept' });
      });
    }
    const declineInvite = document.getElementById('gangDeclineInviteBtn');
    if (declineInvite && !declineInvite._wired) {
      declineInvite._wired = true;
      declineInvite.addEventListener('click', () => {
        socket.emit('action', { type: 'gang_decline' });
      });
    }
  }

  function renderGangHq() {
    if (!gameState) return;
    const self = gameState.self;
    const myGang = gameState.myGang;
    const gangInvite = gameState.gangInvite;

    const createSection = document.getElementById('gangCreateSection');
    const infoSection = document.getElementById('gangInfoSection');
    const invitePending = document.getElementById('gangInvitePendingSection');

    if (!createSection || !infoSection) return;

    // Subtitle
    const subtitle = document.getElementById('gangHqSubtitle');
    if (subtitle) subtitle.textContent = self && self.gangId ? `[${self.gangTag}] ${self.gangName}` : 'No gang. Start a criminal empire.';

    // Pending gang invite
    if (gangInvite) {
      invitePending.style.display = 'block';
      const txt = document.getElementById('gangInvitePendingText');
      if (txt) txt.innerHTML = `<span style="color:${gangInvite.gangColor || '#ff9944'}">[${gangInvite.gangTag}] ${gangInvite.gangName}</span> wants you to join their crew! (from <b>${gangInvite.fromName}</b>)`;
    } else {
      invitePending.style.display = 'none';
    }

    if (!self || !self.gangId) {
      // Show creation form
      createSection.style.display = 'block';
      infoSection.style.display = 'none';
    } else if (myGang) {
      // Show gang info
      createSection.style.display = 'none';
      infoSection.style.display = 'block';

      // Gang badge
      const badge = document.getElementById('gangBadge');
      if (badge) {
        badge.innerHTML = `<span style="color:${myGang.color};font-size:22px;font-weight:bold;text-shadow:0 0 10px ${myGang.color};">[${myGang.tag}]</span> <span style="color:#ffcc99;font-size:14px;">${myGang.name}</span><br><span style="font-size:10px;color:#cc8866;">${myGang.onlineCount} online · Leader: ${myGang.leaderName}</span>`;
      }

      // Treasury
      const treasury = document.getElementById('gangTreasury');
      if (treasury) treasury.textContent = `${myGang.treasury}c`;
      const distBtn = document.getElementById('gangDistributeBtn');
      if (distBtn) distBtn.style.display = (self.gangRole === 'leader' && myGang.treasury > 0) ? 'inline-block' : 'none';

      // Member list
      const memberList = document.getElementById('gangMemberList');
      if (memberList && myGang.members) {
        memberList.innerHTML = myGang.members.map(m => {
          const onlineDot = m.online ? `<span style="color:#44ff44;">●</span>` : `<span style="color:#444;">●</span>`;
          const leaderBadge = m.isLeader ? ` <span style="color:#ffd700;font-size:9px;">LEADER</span>` : '';
          return `<div style="margin:2px 0;font-size:10px;">${onlineDot} ${m.name}${leaderBadge}</div>`;
        }).join('');
      }

      // Gang war status
      const warStatus = document.getElementById('gangWarStatus');
      const declareSection = document.getElementById('gangDeclareWarSection');
      if (warStatus) {
        if (myGang.warWithGangId) {
          const timeLeft = Math.max(0, Math.ceil((myGang.warEndsAt - Date.now()) / 1000));
          const mins = Math.floor(timeLeft / 60);
          const secs = timeLeft % 60;
          warStatus.innerHTML = `<div style="color:#ff3333;font-size:11px;">⚔️ AT WAR WITH [${myGang.warWithGangTag}] ${myGang.warWithGangName}</div><div style="color:#ffaa44;font-size:10px;margin-top:4px;">KILLS: ${myGang.warKills} — ENEMY: ${myGang.warEnemyKills} — TIME: ${mins}m${secs}s</div>`;
          if (declareSection) declareSection.style.display = 'none';
        } else {
          warStatus.innerHTML = `<div style="color:#884444;font-size:10px;">No active war. 3 poop hits on an enemy kills them (+150 XP +80c).</div>`;
          if (declareSection) {
            if (self.gangRole === 'leader') {
              declareSection.style.display = 'block';
              const rivalList = document.getElementById('gangRivalList');
              if (rivalList && gameState.allGangs) {
                rivalList.innerHTML = gameState.allGangs.length === 0 ? '<div style="color:#666;font-size:10px;">No other gangs exist yet.</div>' :
                  gameState.allGangs.map(g => `
                    <div style="display:flex;align-items:center;gap:8px;margin:3px 0;">
                      <span style="color:${g.color};font-weight:bold;">[${g.tag}]</span>
                      <span style="color:#cc8866;font-size:10px;">${g.name} (${g.onlineCount} online)</span>
                      <button onclick="window._gangDeclareWar('${g.id}')" style="background:rgba(80,0,0,0.8);color:#ff4444;border:1px solid #880000;border-radius:6px;padding:2px 8px;cursor:pointer;font:10px 'Courier New',monospace;">⚔️ WAR</button>
                    </div>`).join('');
              }
            } else {
              declareSection.style.display = 'none';
            }
          }
        }
      }

      // Nest section
      const nestStatus = document.getElementById('gangNestStatus');
      const nestBuildBtn = document.getElementById('gangNestBuildBtn');
      const nestInfo = gameState.myNestStatus;
      if (nestStatus && nestBuildBtn) {
        if (!nestInfo || !nestInfo.exists) {
          // No nest yet
          nestStatus.innerHTML = `<span style="color:#99cc99;">No nest. Build one to set your gang's respawn point and XP shrine.</span>`;
          if (self.gangRole === 'leader') {
            nestBuildBtn.style.display = 'inline-block';
            nestBuildBtn.textContent = `🪺 BUILD NEST (400c)${self.coins < 400 ? ' — NEED MORE COINS' : ''}`;
            nestBuildBtn.disabled = self.coins < 400;
          } else {
            nestBuildBtn.style.display = 'none';
          }
        } else if (!nestInfo.alive) {
          // Destroyed nest
          const rebuildInSecs = nestInfo.rebuildAvailableAt ? Math.max(0, Math.ceil((nestInfo.rebuildAvailableAt - Date.now()) / 1000)) : 0;
          nestStatus.innerHTML = rebuildInSecs > 0
            ? `<span style="color:#ff6644;">💥 Nest destroyed! Rebuild in ${rebuildInSecs}s.</span>`
            : `<span style="color:#ffaa44;">💥 Nest destroyed! Ready to rebuild.</span>`;
          if (self.gangRole === 'leader' && rebuildInSecs === 0) {
            nestBuildBtn.style.display = 'inline-block';
            nestBuildBtn.textContent = `🪺 REBUILD NEST (400c)`;
            nestBuildBtn.disabled = self.coins < 400;
          } else {
            nestBuildBtn.style.display = 'none';
          }
        } else {
          // Alive nest
          const hpPct = Math.floor((nestInfo.hp / nestInfo.maxHp) * 100);
          const hpColor = hpPct > 60 ? '#66ff88' : hpPct > 30 ? '#ffaa44' : '#ff4444';
          nestStatus.innerHTML = `<span style="color:${hpColor};">HP: ${nestInfo.hp}/${nestInfo.maxHp}</span> <span style="color:#99cc99;font-size:9px;">· Nearby members get +15 XP +5c every 15s · Acts as respawn point</span>`;
          nestBuildBtn.style.display = 'none';
        }
      }

      // === SIEGE SECTION ===
      const siegeSection = document.getElementById('gangSiegeSection');
      if (siegeSection) {
        const siegeStatus = document.getElementById('gangSiegeStatus');
        const activeSieges = gameState.activeSieges || [];
        const mySiegeAsAttacker = activeSieges.find(s => s.attackingGangId === myGang.id);
        const mySiegeAsDefender = activeSieges.find(s => s.defendingGangId === myGang.id);
        const activeSiege = mySiegeAsAttacker || mySiegeAsDefender;

        if (activeSiege) {
          const timeLeft = Math.max(0, Math.ceil((activeSiege.endsAt - Date.now()) / 1000));
          const mins = Math.floor(timeLeft / 60);
          const secs = timeLeft % 60;
          const hpPct = Math.floor((activeSiege.hpPool / activeSiege.hpMaxPool) * 100);
          const hpColor = hpPct > 60 ? '#ff6644' : hpPct > 30 ? '#ff2200' : '#ff0000';
          if (mySiegeAsAttacker) {
            siegeStatus.innerHTML = `
              <div style="color:#ff4444;font-weight:bold;">⚔️ SIEGE IN PROGRESS</div>
              <div style="color:#ffaa44;font-size:10px;margin-top:3px;">Attacking: [${activeSiege.defendingGangTag}] nest</div>
              <div style="color:#ff9900;font-size:10px;">Nest HP Pool: <span style="color:${hpColor};">${activeSiege.hpPool}/${activeSiege.hpMaxPool}</span></div>
              <div style="background:rgba(40,0,0,0.6);height:6px;border-radius:3px;margin:4px 0;overflow:hidden;">
                <div style="background:${hpColor};width:${hpPct}%;height:100%;border-radius:3px;transition:width 0.2s;"></div>
              </div>
              <div style="color:#ffaa44;font-size:10px;">⏱️ ${mins}m${secs}s remaining — POOP the enemy nest!</div>`;
          } else {
            siegeStatus.innerHTML = `
              <div style="color:#ffaa00;font-weight:bold;">🛡️ YOUR NEST IS UNDER SIEGE!</div>
              <div style="color:#ffcc44;font-size:10px;margin-top:3px;">Attackers: [${activeSiege.attackingGangTag}] ${activeSiege.attackingGangName}</div>
              <div style="color:#ff9900;font-size:10px;">Nest HP Pool: <span style="color:${hpColor};">${activeSiege.hpPool}/${activeSiege.hpMaxPool}</span></div>
              <div style="background:rgba(40,0,0,0.6);height:6px;border-radius:3px;margin:4px 0;overflow:hidden;">
                <div style="background:${hpColor};width:${hpPct}%;height:100%;border-radius:3px;transition:width 0.2s;"></div>
              </div>
              <div style="color:#ffcc44;font-size:10px;">⏱️ ${mins}m${secs}s — POOP attackers near your nest!</div>`;
          }
        } else {
          // No active siege — show declare option if leader and enemy gang with nest exists
          const isLeader = self.gangRole === 'leader';
          const nestAlive = gameState.myNestStatus && gameState.myNestStatus.alive;
          const enemyGangsWithNests = (gameState.activeSieges || []).length > 0 ? [] :
            (gameState.allGangs || []).filter(g => g.id !== myGang.id && g.hasNest);

          if (isLeader) {
            const siegeable = (gameState.allGangs || []).filter(g => g.id !== myGang.id && g.hasNest);
            if (siegeable.length === 0) {
              siegeStatus.innerHTML = `<div style="color:#775544;font-size:10px;">No rival gangs have active nests to siege.</div>`;
            } else {
              const hasFunds = myGang.treasury >= 300;
              siegeStatus.innerHTML = `
                <div style="color:#cc7744;font-size:10px;margin-bottom:6px;">Declare a 4-minute siege on a rival nest. Cost: 300c from treasury. Victory: steal 25% of their treasury + destroy nest (20-min rebuild).</div>
                ${!hasFunds ? `<div style="color:#ff4444;font-size:10px;">Not enough treasury (need 300c, have ${myGang.treasury}c).</div>` : ''}
                <div id="gangSiegeTargets">${siegeable.map(g => `
                  <div style="display:flex;align-items:center;gap:8px;margin:3px 0;">
                    <span style="color:${g.color};font-weight:bold;">[${g.tag}]</span>
                    <span style="color:#cc8866;font-size:10px;">${g.name}</span>
                    <button onclick="window._declareSiege('${g.id}')" ${!hasFunds ? 'disabled' : ''} style="background:rgba(80,0,0,0.8);color:#ff4444;border:1px solid #880000;border-radius:6px;padding:2px 8px;cursor:pointer;font:10px 'Courier New',monospace;${!hasFunds ? 'opacity:0.4;' : ''}">⚔️ SIEGE</button>
                  </div>`).join('')}
                </div>`;
            }
          } else {
            siegeStatus.innerHTML = `<div style="color:#664433;font-size:10px;">Sieges can be declared by the gang leader when enemies have nests.</div>`;
          }
        }
      }

      // Invite section (leader only)
      const inviteSection = document.getElementById('gangInviteSection');
      if (inviteSection) {
        if (self.gangRole === 'leader' && gameState) {
          inviteSection.style.display = 'block';
          const inviteList = document.getElementById('gangInviteList');
          if (inviteList) {
            const nearbyBirds = (gameState.birds || []).filter(b => b.id !== self.id && !b.gangId);
            inviteList.innerHTML = nearbyBirds.length === 0 ? '<div style="color:#666;font-size:10px;">No non-gang birds nearby.</div>' :
              nearbyBirds.map(b => `
                <div style="display:flex;align-items:center;gap:8px;margin:3px 0;">
                  <span style="color:#ffaa66;font-size:10px;">${b.name}</span>
                  <button onclick="window._gangInvite('${b.id}')" style="background:rgba(80,40,0,0.8);color:#ff9944;border:1px solid #885500;border-radius:6px;padding:2px 8px;cursor:pointer;font:10px 'Courier New',monospace;">INVITE</button>
                </div>`).join('');
          }
        } else {
          inviteSection.style.display = 'none';
        }
      }
    }
  }

  // Global helpers for inline onclick in gang HQ
  window._gangDeclareWar = function(rivalGangId) {
    socket.emit('action', { type: 'gang_declare_war', rivalGangId });
  };
  window._gangInvite = function(targetId) {
    socket.emit('action', { type: 'gang_invite', targetId });
  };
  window._declareSiege = function(targetGangId) {
    socket.emit('action', { type: 'siege_declare', targetGangId });
  };

  // ============================================================
  // BIRD CITY IDOL — Overlay management
  // ============================================================
  const idolOverlayEl = document.getElementById('idolOverlay');
  const idolOverlayCloseBtn = document.getElementById('idolOverlayClose');
  if (idolOverlayCloseBtn) {
    idolOverlayCloseBtn.addEventListener('click', () => hideIdolOverlay());
  }

  function showIdolOverlay() {
    if (!idolOverlayEl) return;
    idolOverlayVisible = true;
    idolOverlayEl.style.display = 'block';
    for (const k in keys) keys[k] = false;
    syncInput();
    renderIdolOverlay();
  }

  function hideIdolOverlay() {
    if (!idolOverlayEl) return;
    idolOverlayVisible = false;
    idolOverlayEl.style.display = 'none';
  }

  function renderIdolOverlay() {
    if (!idolOverlayEl || !gameState) return;
    const s = gameState.self;
    const idol = s && s.birdIdol;
    const titleEl = document.getElementById('idolOverlayTitle');
    const subtitleEl = document.getElementById('idolOverlaySubtitle');
    const bodyEl = document.getElementById('idolOverlayBody');
    if (!titleEl || !bodyEl) return;

    if (!idol) {
      subtitleEl.textContent = 'Next contest coming soon...';
      // Build Idol Hall of Fame display
      const idolLB = (s && s.idolLeaderboard) || [];
      const myWins = (s && s.myIdolWins) || 0;
      let hofHtml = `<div style="text-align:center;color:#aa88cc;font-size:10px;padding:8px 0 4px;">
        The stage is quiet for now. Come back soon!<br>
        <span style="color:#cc88ff;font-size:9px;">Contest opens every 35-50 minutes.</span>
      </div>`;
      if (myWins > 0) {
        hofHtml += `<div style="text-align:center;margin:6px 0;padding:5px;background:rgba(180,100,0,0.2);border:1px solid #886600;border-radius:6px;">
          <span style="color:#ffd700;font-size:11px;">🎤 Your Idol Wins: <strong>${myWins}</strong></span>
        </div>`;
      }
      hofHtml += `<div style="border-top:1px solid #660099;margin-top:6px;padding-top:8px;">
        <div style="text-align:center;color:#ff88ff;font-size:10px;font-weight:bold;letter-spacing:1px;margin-bottom:6px;">🎤 IDOL HALL OF FAME 🎤</div>`;
      if (idolLB.length === 0) {
        hofHtml += `<div style="text-align:center;color:#664488;font-size:9px;padding:8px;">No all-time champions yet — be the first!</div>`;
      } else {
        for (let i = 0; i < idolLB.length; i++) {
          const entry = idolLB[i];
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
          const prestigeBadges = ['','⚜️','⚜️⚜️','⚜️⚜️⚜️','⚜️⚜️⚜️⚜️','⚜️⚜️⚜️⚜️⚜️'][Math.min(entry.prestige||0,5)];
          hofHtml += `<div style="display:flex;justify-content:space-between;align-items:center;
            padding:4px 8px;margin-bottom:3px;background:rgba(80,0,120,0.3);
            border-radius:5px;border:1px solid #550077;">
            <span>${medal} <span style="color:#ff88ff;font-size:10px;">${entry.name}</span>
              ${entry.gangTag ? `<span style="color:${entry.gangColor||'#ff9944'};font-size:8px;">[${entry.gangTag}]</span>` : ''}
              ${prestigeBadges ? `<span style="font-size:8px;">${prestigeBadges}</span>` : ''}
            </span>
            <span style="color:#ffd700;font-size:10px;font-weight:bold;">${entry.idolWins}🎤</span>
          </div>`;
        }
      }
      hofHtml += `</div>`;
      bodyEl.innerHTML = hofHtml;
      return;
    }

    if (idol.state === 'open') {
      const timeLeft = Math.max(0, Math.ceil((idol.openUntil - Date.now()) / 1000));
      subtitleEl.textContent = `REGISTRATION OPEN — ${timeLeft}s remaining`;
      const isContestant = idol.isContestant;
      const nearStage = s.nearIdolStage;

      let html = `<div style="font-size:10px;color:#cc88ff;margin-bottom:10px;text-align:center;">
        ${idol.contestants.length}/4 contestants registered<br>
        <span style="color:#ffdd88;font-size:9px;">Poop hits during the open phase count as performance score!</span>
      </div>`;

      if (idol.contestants.length > 0) {
        html += `<div style="margin-bottom:10px;">`;
        for (const c of idol.contestants) {
          const badges = ['', '⚜️', '⚜️⚜️', '⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️⚜️'];
          const prestigeBadge = badges[Math.min(c.prestige || 0, 5)];
          const tattoos = (c.tattoos || []).join(' ');
          html += `<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;
            background:rgba(100,0,150,0.3);border:1px solid #660099;border-radius:6px;margin-bottom:4px;">
            <span style="color:#ff88ff;font-weight:bold;font-size:11px;">#${c.slotNum}</span>
            <span style="color:#ffffff;font-size:11px;">${c.name}</span>
            ${c.gangTag ? `<span style="color:${c.gangColor||'#ff9944'};font-size:9px;">[${c.gangTag}]</span>` : ''}
            ${prestigeBadge ? `<span style="font-size:9px;">${prestigeBadge}</span>` : ''}
            ${tattoos ? `<span style="font-size:9px;">${tattoos}</span>` : ''}
          </div>`;
        }
        html += `</div>`;
      }

      if (!isContestant && nearStage && idol.contestants.length < 4) {
        html += `<div style="text-align:center;margin-top:8px;">
          <button onclick="window._idolEnter()" style="background:linear-gradient(135deg,#880088,#cc00cc);
            color:#fff;border:2px solid #ff44ff;border-radius:8px;padding:8px 20px;cursor:pointer;
            font:bold 11px 'Courier New',monospace;letter-spacing:1px;
            box-shadow:0 0 12px rgba(255,68,255,0.4);">🎤 JOIN THE CONTEST</button>
          <div style="color:#aa88cc;font-size:8px;margin-top:4px;">Cost: FREE · Reward: 80c + 50 XP (winner: 300c + 250 XP)</div>
        </div>`;
      } else if (isContestant) {
        html += `<div style="text-align:center;padding:8px;color:#88ff88;font-size:10px;">
          ✅ You're registered! Go poop on everything to build your performance score!
        </div>`;
      } else if (!nearStage) {
        html += `<div style="text-align:center;color:#aa88cc;font-size:9px;padding:6px;">
          Fly to the 🎤 stage in the east park to register!
        </div>`;
      }
      bodyEl.innerHTML = html;

    } else if (idol.state === 'voting') {
      const timeLeft = Math.max(0, Math.ceil((idol.votingUntil - Date.now()) / 1000));
      subtitleEl.textContent = `VOTE NOW — ${timeLeft}s remaining`;
      const isContestant = idol.isContestant;
      const myVote = idol.myVote;

      if (isContestant) {
        bodyEl.innerHTML = `<div style="text-align:center;color:#ffdd88;font-size:10px;padding:12px;">
          🎤 You're performing! Spectators are voting...<br>
          <span style="color:#88ff88;margin-top:4px;display:block;">${idol.totalVotes} vote${idol.totalVotes !== 1 ? 's' : ''} cast so far</span>
        </div>`;
        return;
      }

      if (myVote) {
        const voted = idol.contestants.find(c => c.id === myVote);
        bodyEl.innerHTML = `<div style="text-align:center;color:#88ff88;font-size:10px;padding:12px;">
          ✅ You voted for <strong>${voted ? voted.name : '?'}</strong>!<br>
          <span style="color:#ffdd88;font-size:9px;">Correct pick = +60c +30 XP</span>
        </div>`;
        return;
      }

      let html = `<div style="font-size:9px;color:#cc88ff;margin-bottom:10px;text-align:center;">
        Click a contestant to cast your vote! Correct picks earn +60c +30 XP
      </div>`;
      for (const c of idol.contestants) {
        const badges = ['', '⚜️', '⚜️⚜️', '⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️⚜️'];
        const prestigeBadge = badges[Math.min(c.prestige || 0, 5)];
        const tattoos = (c.tattoos || []).join(' ');
        html += `<button onclick="window._idolVote('${c.id}')" style="
          display:flex;align-items:center;gap:6px;width:100%;padding:8px 10px;margin-bottom:6px;
          background:rgba(80,0,120,0.5);border:1.5px solid #aa44dd;border-radius:8px;
          cursor:pointer;color:#fff;font:10px 'Courier New',monospace;
          text-align:left;transition:background 0.15s;">
          <span style="color:#ff88ff;font-weight:bold;font-size:13px;">#${c.slotNum}</span>
          <div>
            <div style="font-size:11px;font-weight:bold;">${c.name}
              ${c.gangTag ? `<span style="color:${c.gangColor||'#ff9944'};font-size:9px;">[${c.gangTag}]</span>` : ''}
              ${prestigeBadge}
            </div>
            <div style="font-size:9px;color:#cc99ff;">
              ${c.performanceHits} poop hits ${tattoos ? `· ${tattoos}` : ''}
            </div>
          </div>
        </button>`;
      }
      bodyEl.innerHTML = html;

    } else if (idol.state === 'results') {
      subtitleEl.textContent = '🏆 AND THE WINNER IS...';

      let html = `<div style="text-align:center;margin-bottom:12px;">
        <div style="font-size:24px;margin-bottom:4px;">🏆</div>
        <div style="font-size:16px;font-weight:900;color:#ffd700;text-shadow:0 0 12px #ffaa00;">${idol.winnerName}</div>
        <div style="font-size:9px;color:#ffdd88;margin-top:4px;">+300c · +250 XP · 🎤 IDOL badge</div>
        <div style="font-size:9px;color:#88ff88;margin-top:2px;">⚡ City-wide 1.5× XP boost for 3 minutes!</div>
      </div>`;

      html += `<div style="border-top:1px solid #660099;padding-top:8px;">`;
      const sorted = [...idol.contestants].sort((a, b) => (b.score || 0) - (a.score || 0));
      for (let i = 0; i < sorted.length; i++) {
        const c = sorted[i];
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
        const isWinner = c.id === idol.winnerId;
        html += `<div style="display:flex;justify-content:space-between;align-items:center;
          padding:4px 8px;margin-bottom:3px;background:${isWinner ? 'rgba(180,140,0,0.2)' : 'rgba(60,0,90,0.3)'};
          border-radius:5px;border:1px solid ${isWinner ? '#886600' : '#440066'};">
          <span>${medal} <span style="color:${isWinner ? '#ffd700' : '#cc88ff'};font-weight:${isWinner ? 'bold' : 'normal'};font-size:11px;">${c.name}</span></span>
          <span style="font-size:9px;color:#aa88cc;">${c.votes} vote${c.votes !== 1 ? 's' : ''} · ${c.performanceHits} hits · <strong style="color:#ffdd88;">${c.score} pts</strong></span>
        </div>`;
      }
      html += `</div>`;

      // Show Hall of Fame snippet at bottom of results
      const idolLB = (s && s.idolLeaderboard) || [];
      if (idolLB.length > 0) {
        html += `<div style="border-top:1px solid #440055;margin-top:8px;padding-top:6px;">
          <div style="text-align:center;color:#cc88ff;font-size:9px;margin-bottom:4px;">🎤 HALL OF FAME (all-time)</div>`;
        for (let i = 0; i < Math.min(idolLB.length, 3); i++) {
          const e = idolLB[i];
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
          html += `<div style="display:flex;justify-content:space-between;font-size:9px;color:#aa88bb;padding:1px 6px;">
            <span>${medal} ${e.name}${e.gangTag ? ' ['+e.gangTag+']' : ''}</span>
            <span style="color:#ffd700;">${e.idolWins} wins</span>
          </div>`;
        }
        html += `</div>`;
      }
      bodyEl.innerHTML = html;
    }
  }

  // Global helpers for idol overlay onclick
  window._idolEnter = function() {
    socket.emit('action', { type: 'idol_enter' });
    hideIdolOverlay();
  };
  window._idolVote = function(contestantId) {
    socket.emit('action', { type: 'idol_vote', contestantId });
    // Refresh overlay to show "voted" state
    setTimeout(() => { if (idolOverlayVisible) renderIdolOverlay(); }, 200);
  };

  // ============================================================
  // SKILL TREE — [K] to open/close
  // ============================================================
  let skillTreeVisible = false;

  function toggleSkillTree() {
    if (skillTreeVisible) hideSkillTree();
    else showSkillTree();
  }

  function showSkillTree() {
    if (!joined) return;
    skillTreeVisible = true;
    const el = document.getElementById('skillTreeOverlay');
    if (el) el.style.display = 'block';
    for (const k in keys) keys[k] = false;
    syncInput();
    renderSkillTree();
  }

  function hideSkillTree() {
    skillTreeVisible = false;
    const el = document.getElementById('skillTreeOverlay');
    if (el) el.style.display = 'none';
  }

  // ============================================================
  // CONSTELLATION PANEL — [L] to open/close
  // ============================================================
  let constellationPanelVisible = false;

  function toggleConstellationPanel() {
    if (constellationPanelVisible) hideConstellationPanel();
    else showConstellationPanel();
  }

  function hideConstellationPanel() {
    constellationPanelVisible = false;
    const el = document.getElementById('constellationPanel');
    if (el) el.style.display = 'none';
  }

  function showConstellationPanel() {
    if (!joined) return;
    constellationPanelVisible = true;
    const el = document.getElementById('constellationPanel');
    if (el) {
      el.style.display = 'block';
      renderConstellationPanel();
    }
    for (const k in keys) keys[k] = false;
    syncInput();
  }

  function renderConstellationPanel() {
    const el = document.getElementById('constellationPanel');
    if (!el || !gameState || !gameState.self) return;
    const s = gameState.self;
    const earned = s.constellations || [];
    const defs = s.constellationDefs || [];

    const count = earned.length;
    const total = defs.length || 12;

    let html = `
      <div style="text-align:center;margin-bottom:12px;">
        <div style="font-size:20px;font-weight:bold;color:#ccaaff;text-shadow:0 0 12px #8866ff;">
          ✨ CONSTELLATION BADGES
        </div>
        <div style="font-size:12px;color:#997fcc;margin-top:4px;">
          Permanent zodiac signs earned through epic moments
        </div>
        <div style="font-size:13px;color:#bb99ff;margin-top:6px;font-weight:bold;">
          ${count} / ${total} earned
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:380px;overflow-y:auto;">
    `;

    for (const def of defs) {
      const isEarned = earned.includes(def.id);
      if (isEarned) {
        html += `
          <div style="
            background:rgba(100,60,180,0.35);
            border:1px solid #9966ff;
            border-radius:8px;
            padding:8px 10px;
            box-shadow:0 0 10px rgba(140,80,255,0.35);
          ">
            <div style="font-size:18px;text-shadow:0 0 10px #bb88ff;">${def.sign}</div>
            <div style="font-size:12px;font-weight:bold;color:#ddbbff;">${def.name}</div>
            <div style="font-size:10px;color:#aa88dd;font-style:italic;">${def.title}</div>
            <div style="font-size:9px;color:#9977bb;margin-top:3px;">${def.desc}</div>
          </div>
        `;
      } else {
        html += `
          <div style="
            background:rgba(20,10,40,0.5);
            border:1px solid #443366;
            border-radius:8px;
            padding:8px 10px;
            opacity:0.65;
          ">
            <div style="font-size:18px;color:#444;">🔒</div>
            <div style="font-size:12px;font-weight:bold;color:#665588;">${def.name}</div>
            <div style="font-size:10px;color:#554477;font-style:italic;">${def.title}</div>
            <div style="font-size:9px;color:#4d3d66;margin-top:3px;">${def.desc}</div>
          </div>
        `;
      }
    }

    html += `</div>
      <div style="text-align:center;margin-top:10px;">
        <button onclick="window._hideConstellationPanel()" style="
          background:rgba(80,40,140,0.8);border:1px solid #8866ff;
          color:#ccaaff;padding:6px 20px;border-radius:6px;cursor:pointer;font-size:12px;
        ">CLOSE [L]</button>
      </div>
    `;

    el.innerHTML = html;
  }

  window._hideConstellationPanel = hideConstellationPanel;

  function renderSkillTree() {
    const el = document.getElementById('skillTreeOverlay');
    if (!el || !gameState || !gameState.self) return;
    const s = gameState.self;
    const fp = s.skillPoints || 0;
    const unlocked = s.skillTreeUnlocked || [];
    const defs = s.skillTreeDefs || {};

    const isMasterNow = s.skillTreeMaster || false;
    const fpDisplay = document.getElementById('skillTreeFpDisplay');
    if (fpDisplay) {
      if (isMasterNow) {
        fpDisplay.innerHTML = `<span style="color:#44eeff;font-weight:bold;font-size:13px;text-shadow:0 0 8px #00ddff;">✨ SKILL TREE MASTERED — All 12 skills unlocked! +5% XP permanently</span>`;
      } else if (fp > 0) {
        fpDisplay.innerHTML = `<span style="color:#88ff88;font-weight:bold;font-size:14px;">${fp}</span> <span style="color:#aaffaa;">Feather Point${fp !== 1 ? 's' : ''} available</span>`;
      } else {
        fpDisplay.innerHTML = `<span style="color:#667766;">0 Feather Points · Level up to earn more</span>`;
      }
    }

    const branches = [
      { key: 'combat',   label: '⚔️ Combat',   color: '#ff8844', skills: ['quick_draw', 'splash_zone', 'double_tap'] },
      { key: 'speed',    label: '💨 Speed',    color: '#44ddff', skills: ['aerodynamics', 'wind_rider', 'desperado'] },
      { key: 'wealth',   label: '💰 Wealth',   color: '#ffd700', skills: ['sticky_claws', 'fence_rep', 'territory_tax'] },
      { key: 'survival', label: '🛡️ Survival', color: '#44cc44', skills: ['street_smart', 'iron_wings', 'ghost_walk'] },
    ];

    const grid = document.getElementById('skillTreeGrid');
    if (!grid) return;
    let gridHtml = '';

    for (const branch of branches) {
      gridHtml += `<div style="display:flex;flex-direction:column;gap:8px;">
        <div style="text-align:center;font-size:11px;font-weight:bold;color:${branch.color};
          border-bottom:1px solid ${branch.color}44;padding-bottom:6px;margin-bottom:2px;letter-spacing:1px;">
          ${branch.label}
        </div>`;

      for (let ti = 0; ti < branch.skills.length; ti++) {
        const skillId = branch.skills[ti];
        const def = defs[skillId];
        if (!def) continue;

        const isUnlocked = unlocked.includes(skillId);
        const prereqMet = !def.req || unlocked.includes(def.req);
        const canAfford = fp >= def.cost;
        const canBuy = !isUnlocked && prereqMet && canAfford;

        let bg = 'rgba(20,40,20,0.5)';
        let border = '#334433';
        let textColor = '#556655';
        let cursor = 'default';
        let opacity = '0.55';

        if (isUnlocked) {
          bg = 'rgba(20,80,20,0.8)';
          border = branch.color;
          textColor = '#c8ffc8';
          opacity = '1';
        } else if (prereqMet && canAfford) {
          bg = 'rgba(30,60,30,0.8)';
          border = branch.color + 'aa';
          textColor = '#aaddaa';
          cursor = 'pointer';
          opacity = '1';
        } else if (prereqMet) {
          bg = 'rgba(30,50,30,0.6)';
          border = '#445544';
          textColor = '#778877';
          opacity = '0.75';
        }

        const costLabel = isUnlocked ? '✓ UNLOCKED' : `${def.cost} FP`;
        const costColor = isUnlocked ? '#44ff44' : (canBuy ? '#ffdd44' : '#556655');
        const glowStyle = isUnlocked ? `box-shadow:0 0 8px ${branch.color}66;` : (canBuy ? `box-shadow:0 0 6px ${branch.color}44;` : '');
        const onclick = canBuy ? `window._buySkillTree('${skillId}')` : '';

        gridHtml += `<div onclick="${onclick}"
          style="background:${bg};border:1px solid ${border};border-radius:8px;
          padding:8px 10px;opacity:${opacity};cursor:${cursor};${glowStyle}"
          onmouseover="window._skillTreeHover('${skillId}')"
          onmouseleave="window._skillTreeHoverOut()">
          <div style="font-size:16px;margin-bottom:3px;">${def.emoji}</div>
          <div style="font-size:10px;font-weight:bold;color:${textColor};line-height:1.3;">${def.label}</div>
          <div style="font-size:9px;color:${costColor};margin-top:4px;font-weight:bold;">${costLabel}</div>
          ${ti > 0 ? `<div style="font-size:8px;color:#445544;margin-top:2px;">Tier ${def.tier}</div>` : ''}
        </div>`;

        if (ti < branch.skills.length - 1) {
          gridHtml += `<div style="text-align:center;color:${border};font-size:10px;margin:-4px 0;">▼</div>`;
        }
      }
      gridHtml += '</div>';
    }

    grid.innerHTML = gridHtml;

    const tooltip = document.getElementById('skillTreeTooltip');
    if (tooltip) tooltip.innerHTML = '<span style="color:#556655;">Hover a skill to see details — click a highlighted node to unlock</span>';
  }

  window._skillTreeHover = function(skillId) {
    const tooltip = document.getElementById('skillTreeTooltip');
    if (!tooltip || !gameState || !gameState.self) return;
    const def = (gameState.self.skillTreeDefs || {})[skillId];
    if (!def) return;
    const unlocked = gameState.self.skillTreeUnlocked || [];
    const fp = gameState.self.skillPoints || 0;
    const prereq = def.req ? (gameState.self.skillTreeDefs || {})[def.req] : null;
    const isUnlocked = unlocked.includes(skillId);
    const prereqMet = !def.req || unlocked.includes(def.req);
    const canAfford = fp >= def.cost;
    let status = '';
    if (isUnlocked) status = '<span style="color:#44ff44;">✓ UNLOCKED</span>';
    else if (!prereqMet) status = `<span style="color:#ff8844;">Requires: ${prereq ? prereq.label : def.req}</span>`;
    else if (!canAfford) status = `<span style="color:#ffaa44;">Need ${def.cost} FP (have ${fp})</span>`;
    else status = `<span style="color:#88ff44;font-weight:bold;">Click to unlock for ${def.cost} FP!</span>`;
    tooltip.innerHTML = `<strong style="color:#ccffcc;">${def.emoji} ${def.label}</strong> — ${def.desc}<br>${status}`;
  };

  window._skillTreeHoverOut = function() {
    const tooltip = document.getElementById('skillTreeTooltip');
    if (tooltip) tooltip.innerHTML = '<span style="color:#556655;">Hover a skill to see details — click a highlighted node to unlock</span>';
  };

  // ============================================================
  // ROYALE SPECTATOR CHEER PANEL
  // ============================================================

  let royaleCheerPanelVisible = false;

  function toggleRoyaleCheerPanel() {
    if (royaleCheerPanelVisible) hideRoyaleCheerPanel();
    else showRoyaleCheerPanel();
  }

  function showRoyaleCheerPanel() {
    if (!joined || !gameState) return;
    const ry = gameState.birdRoyale;
    // Only show if royale is active and we're a spectator or eliminated
    if (!ry || ry.state !== 'active') return;
    if (ry.myStatus !== 'eliminated' && !ry.isSpectator) return;

    royaleCheerPanelVisible = true;
    const el = document.getElementById('royaleCheerPanel');
    if (el) { el.style.display = 'block'; renderRoyaleCheerPanel(); }
  }

  function hideRoyaleCheerPanel() {
    royaleCheerPanelVisible = false;
    const el = document.getElementById('royaleCheerPanel');
    if (el) el.style.display = 'none';
  }

  function renderRoyaleCheerPanel() {
    const el = document.getElementById('royaleCheerPanel');
    if (!el || !gameState) return;
    const ry = gameState.birdRoyale;
    if (!ry || ry.state !== 'active') { hideRoyaleCheerPanel(); return; }

    const now = Date.now();
    const cooldown = ry.cheerCooldown || 0;
    const onCooldown = cooldown > now;
    const secLeft = onCooldown ? Math.ceil((cooldown - now) / 1000) : 0;
    const participants = ry.aliveParticipants || [];

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:14px;font-weight:bold;color:#88ff88;">🎉 CROWD CHEERS</span>
        <button onclick="window._hideRoyaleCheerPanel()" style="background:rgba(0,0,0,0.5);border:1px solid #666;color:#ccc;cursor:pointer;padding:2px 8px;border-radius:3px;">✕</button>
      </div>
      <div style="font-size:11px;color:#aaaaaa;margin-bottom:6px;">Click a survivor to give them +8 food!${onCooldown ? ` (cooldown: ${secLeft}s)` : ''}</div>`;

    if (participants.length === 0) {
      html += `<div style="color:#888;font-size:12px;text-align:center;padding:10px;">No survivors remaining...</div>`;
    } else {
      for (const p of participants) {
        const tag = p.gangTag ? `[${p.gangTag}] ` : '';
        html += `<button onclick="window._royaleCheer('${p.birdId}')" style="
          display:block;width:100%;margin-bottom:4px;padding:6px 8px;
          background:${onCooldown ? 'rgba(40,40,40,0.7)' : 'rgba(20,80,20,0.85)'};
          border:1px solid ${onCooldown ? '#555' : '#44aa44'};
          color:${onCooldown ? '#888' : '#88ff88'};
          cursor:${onCooldown ? 'not-allowed' : 'pointer'};
          border-radius:4px;text-align:left;font-size:12px;
          ${onCooldown ? '' : 'transition:background 0.15s;'}
        " ${onCooldown ? 'disabled' : ''}>
          🐦 ${tag}${p.name}  <span style="float:right;opacity:0.7">+8 🍖</span>
        </button>`;
      }
    }

    el.innerHTML = html;
  }

  window._royaleCheer = function(targetBirdId) {
    if (!gameState || !gameState.birdRoyale) return;
    const now = Date.now();
    const cooldown = gameState.birdRoyale.cheerCooldown || 0;
    if (cooldown > now) return;
    socket.emit('action', { type: 'royale_cheer', targetBirdId });
    renderRoyaleCheerPanel(); // re-render to show optimistic cooldown
  };

  window._hideRoyaleCheerPanel = function() { hideRoyaleCheerPanel(); };
  window.toggleRoyaleCheerPanel = toggleRoyaleCheerPanel;

  // ============================================================
  // ROYAL DECREE PANEL
  // ============================================================

  const DECREE_INFO = {
    gold_rush: {
      emoji: '👑',
      name: 'GOLD RUSH',
      desc: 'All poop coin drops DOUBLED city-wide for 60 seconds.\nEveryone profits — but you get credit.',
      duration: '60s',
      color: '#ffd700',
    },
    wanted_decree: {
      emoji: '⚡',
      name: 'WANTED DECREE',
      desc: 'Instantly adds wanted heat to every other bird.\nChaos erupts — cops flood the streets!',
      duration: 'INSTANT',
      color: '#ff4444',
    },
    royal_amnesty: {
      emoji: '🛡️',
      name: 'ROYAL AMNESTY',
      desc: 'All law enforcement STANDS DOWN for 45 seconds.\nTotal lawlessness — no arrests, no cops.',
      duration: '45s',
      color: '#44aaff',
    },
    tax_day: {
      emoji: '💰',
      name: 'TAX DAY',
      desc: 'Collect 10% of every bird\'s coins.\nMax 100c per bird — fills your royal treasury.\n⚠️ Opens a 15s REVOLT WINDOW — birds can mob you!',
      duration: 'INSTANT',
      color: '#ff9900',
    },
    kings_pardon: {
      emoji: '👑',
      name: "KING'S PARDON",
      desc: 'Grant full legal immunity to the most wanted criminal.\nClears their heat, despawns cops, 3 min no-arrest protection.\nUseful for pardoning a gang ally — or your enemy.',
      duration: '3 min protection',
      color: '#44cc88',
    },
  };

  function toggleDecreePanel() {
    if (decreePanelVisible) closeDecreePanel();
    else openDecreePanel();
  }

  function openDecreePanel() {
    if (!gameState || !gameState.self || !gameState.self.isKingpin) return;
    decreePanelVisible = true;
    const el = document.getElementById('decreePanelOverlay');
    if (el) { el.style.display = 'block'; renderDecreePanel(); }
  }

  function closeDecreePanel() {
    decreePanelVisible = false;
    const el = document.getElementById('decreePanelOverlay');
    if (el) el.style.display = 'none';
  }

  function renderDecreePanel() {
    const el = document.getElementById('decreePanelContent');
    if (!el || !gameState) return;

    const s = gameState.self;
    const decreesLeft = s ? s.kingpinDecreesAvailable : 0;
    const activeDecree = gameState.activeDecree;

    if (activeDecree) {
      const secs = Math.max(0, Math.ceil((activeDecree.endsAt - Date.now()) / 1000));
      const info = DECREE_INFO[activeDecree.type];
      el.innerHTML = `
        <div style="text-align:center;padding:12px;background:rgba(255,215,0,0.1);border:1px solid #886600;border-radius:8px;">
          <div style="font-size:28px;margin-bottom:6px;">${info ? info.emoji : '⚜️'}</div>
          <div style="font-size:15px;font-weight:900;color:#ffd700;margin-bottom:4px;">${info ? info.name : activeDecree.type.toUpperCase()} ACTIVE</div>
          <div style="font-size:12px;color:#ffcc44;">Expires in <b>${secs}s</b></div>
        </div>
        <div style="margin-top:12px;font-size:11px;color:#aa8800;letter-spacing:0.5px;">
          Your decree has been issued. Earn or regain the crown for a fresh decree.
        </div>`;
      return;
    }

    if (!decreesLeft) {
      el.innerHTML = `
        <div style="text-align:center;padding:16px;opacity:0.7;">
          <div style="font-size:22px;margin-bottom:8px;">📜</div>
          <div style="font-size:13px;color:#aa8800;">Decree already used this tenure.</div>
          <div style="font-size:11px;color:#886600;margin-top:6px;">Lose and regain the crown to issue another.</div>
        </div>`;
      return;
    }

    // Build decree cards
    let cards = '';
    for (const [type, info] of Object.entries(DECREE_INFO)) {
      cards += `
        <div onclick="window._issueDecree('${type}')" style="cursor:pointer;margin-bottom:10px;
          padding:10px 14px;background:rgba(40,30,0,0.7);border:1px solid ${info.color}44;border-radius:8px;
          display:flex;align-items:flex-start;gap:10px;
          transition:background 0.2s;text-align:left;"
          onmouseover="this.style.background='rgba(80,60,0,0.9)'" onmouseout="this.style.background='rgba(40,30,0,0.7)'">
          <div style="font-size:22px;flex-shrink:0;margin-top:2px;">${info.emoji}</div>
          <div>
            <div style="font-size:13px;font-weight:900;color:${info.color};letter-spacing:1px;">${info.name}
              <span style="font-size:10px;color:#886600;font-weight:normal;margin-left:6px;">[${info.duration}]</span>
            </div>
            <div style="font-size:10px;color:#ccaa66;margin-top:3px;line-height:1.4;">${info.desc.replace('\n', '<br>')}</div>
          </div>
        </div>`;
    }
    el.innerHTML = `
      <div style="font-size:11px;color:#aa8800;letter-spacing:0.5px;margin-bottom:12px;text-align:center;">
        ⚜️ You have <b style="color:#ffd700;">1 decree</b> to spend. Choose wisely — your word is law.
      </div>
      ${cards}`;
  }

  window.closeDecreePanel = closeDecreePanel;
  window.toggleDecreePanel = toggleDecreePanel;
  window._issueDecree = function(decreeType) {
    socket.emit('action', { type: 'royal_decree', decreeType });
    closeDecreePanel();
  };

  function updateDecreeBanner() {
    const banner = document.getElementById('decreeBanner');
    if (!banner || !gameState) { if (banner) banner.style.display = 'none'; return; }

    const d = gameState.activeDecree;
    if (!d) { banner.style.display = 'none'; return; }

    const secs = Math.max(0, Math.ceil((d.endsAt - Date.now()) / 1000));
    const info = DECREE_INFO[d.type];
    if (!secs) { banner.style.display = 'none'; return; }

    const COLOR_MAP = { gold_rush: '#ffd700', royal_amnesty: '#44aaff' };
    const color = COLOR_MAP[d.type] || '#ffd700';
    banner.style.display = 'block';
    banner.style.borderColor = color;
    banner.style.color = color;
    banner.textContent = `⚜️ ROYAL DECREE: ${info ? info.name : d.type.toUpperCase()} — ${secs}s remaining`;
  }

  window._buySkillTree = function(skillId) {
    socket.emit('action', { type: 'skill_tree_unlock', skillId });
    setTimeout(() => { if (skillTreeVisible) renderSkillTree(); }, 300);
  };

  function updateSkillTreeHud() {
    const pill = document.getElementById('fpHudPill');
    if (!pill || !gameState || !gameState.self) {
      if (pill) pill.style.display = 'none';
      return;
    }
    const fp = gameState.self.skillPoints || 0;
    const isMaster = gameState.self.skillTreeMaster || false;
    if (isMaster) {
      pill.style.display = 'block';
      pill.textContent = '✨ MASTER — [K]';
      pill.style.color = '#44eeff';
      pill.style.borderColor = '#00ddff';
      pill.style.boxShadow = '0 0 6px #00ddff44';
    } else if (fp > 0) {
      pill.style.display = 'block';
      pill.textContent = `🪶 ${fp} FP — Press [K]`;
      pill.style.color = '';
      pill.style.borderColor = '';
      pill.style.boxShadow = '';
    } else {
      pill.style.display = 'none';
    }
    pill.onclick = () => toggleSkillTree();
  }

  socket.on('skill_tree_unlocked', (data) => {
    if (data.birdId === socket.id) {
      showAnnouncement(`🪶 ${data.emoji} ${data.label} UNLOCKED! (${data.skillPoints} FP left)`, '#44cc44', 3000);
      if (skillTreeVisible) renderSkillTree();
    } else {
      addEventFeedMessage(`🪶 ${data.birdName} unlocked ${data.emoji} ${data.label}!`);
    }
  });

  socket.on('skill_tree_mastered', (data) => {
    if (data.birdId === socket.id) {
      triggerScreenShake(14, 1200);
      showAnnouncement('✨ SKILL TREE MASTERED! All 12 skills unlocked — +5% XP permanently!', '#44eeff', 6000);
    }
    const tag = data.gangTag ? `[${data.gangTag}] ` : '';
    addEventFeedMessage(`✨ ${tag}${data.birdName} MASTERED the Skill Tree! All 12 skills unlocked!`);
  });

  socket.on('constellation_earned', (data) => {
    if (data.birdId === socket.id) {
      triggerScreenShake(12, 1000);
      showAnnouncement(
        `${data.sign} CONSTELLATION EARNED: ${data.name} (${data.title})!\nYou now have ${data.totalCount} constellation${data.totalCount !== 1 ? 's' : ''}.`,
        '#ccaaff', 7000
      );
      if (constellationPanelVisible) renderConstellationPanel();
    }
    const tag = data.gangTag ? `[${data.gangTag}] ` : '';
    addEventFeedMessage(`${data.sign} ${tag}${data.birdName} earned the ${data.name} Constellation! (${data.title})`);
  });

  socket.on('skill_tree_fail', (data) => {
    if (data.birdId === socket.id) {
      showAnnouncement(`❌ ${data.reason}`, '#cc4444', 2000);
    }
  });

  socket.on('skill_point_gained', (data) => {
    if (data.birdId === socket.id) {
      showAnnouncement(`🪶 +${data.gained} Feather Point${data.gained !== 1 ? 's' : ''}! Press [K] to spend`, '#88ff88', 3500);
      if (skillTreeVisible) renderSkillTree();
    }
  });

  socket.on('don_respec_done', (data) => {
    if (data.birdId === socket.id) {
      showAnnouncement(`🔄 SKILLS RESET! +${data.fpRefunded} FP refunded. Spent ${data.cost}c. Press [K] to rebuild.`, '#ffaa44', 5000);
      if (skillTreeVisible) renderSkillTree();
      if (donOverlayVisible) renderDonOverlay();
    }
  });

  socket.on('respec_fail', (data) => {
    if (data.birdId === socket.id) {
      showAnnouncement(`❌ ${data.reason}`, '#cc4444', 2500);
    }
  });

  socket.on('ghost_walk_evade', (data) => {
    if (data.birdId === socket.id) {
      showAnnouncement('👻 GHOST WALK! Cop arrest evaded!', '#aaffaa', 2000);
    }
    addEventFeedMessage(`👻 ${data.birdName} ghost-walked out of an arrest!`);
  });

  document.getElementById('skillTreeCloseBtn').addEventListener('click', hideSkillTree);

  // === WANTED HOTLINE — shield button click handler (Session 104) ===
  const _bbShieldBtnEl = document.getElementById('bbShieldBtn');
  if (_bbShieldBtnEl) {
    _bbShieldBtnEl.addEventListener('click', e => {
      e.stopPropagation();
      if (!socket || !joined) return;
      socket.emit('action', { type: 'buy_informant_shield' });
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  async function init() {
    await fetchWorld();
    connectSocket();
    requestAnimationFrame(render);

    // Prevent all default touch behavior on body
    document.body.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
  }

  init();

})();
