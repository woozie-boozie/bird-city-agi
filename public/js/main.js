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
  let casinoSpinning = false;
  let casinoSpinInterval = null;
  const CASINO_REEL_SYMBOLS = ['🐦', '💩', '🍗', '⭐', '💎', '👑'];

  // === BIRD TATTOO PARLOR ===
  const tattooOverlay = document.getElementById('tattooOverlay');
  const tattooCloseBtn = document.getElementById('tattooCloseBtn');
  let tattooOverlayVisible = false;
  let lastNearTattooParlor = false;

  // === CITY HALL BOUNTY BOARD ===
  const bountyBoardOverlay = document.getElementById('bountyBoardOverlay');
  const bbCloseBtn = document.getElementById('bbCloseBtn');
  const bbContributeBtn = document.getElementById('bbContributeBtn');
  const bbContributeAmount = document.getElementById('bbContributeAmount');
  const bbContributeMsg = document.getElementById('bbContributeMsg');
  const poolHudPill = document.getElementById('poolHudPill');
  const cityHallPrompt = document.getElementById('cityHallPrompt');
  let bountyBoardVisible = false;
  let lastNearCityHall = false;

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
  let socket = null;
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
    socket = io();

    socket.on('connect', () => {
      console.log('Connected to Bird City!');
      // Auto-rejoin if we have a saved account
      const saved = getSavedAccount();
      if (saved && saved.id && saved.name) {
        joinGame(saved);
      }
    });

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
      if (selfIsKingpin) {
        screenShake(10, 700);
        showAnnouncement(`👑 YOU ARE THE KINGPIN!\n${ev.coins}c makes you the richest bird.\nYou earn tribute — but you are a TARGET!`, '#ffd700', 5000);
      } else if (ev.oldKingpin) {
        addEventMessage(`👑 ${ev.birdName} seized the crown from ${ev.oldKingpin}! (${ev.coins}c)`, '#ffd700');
        showAnnouncement(`👑 NEW KINGPIN: ${ev.birdName}!\nPoop them 3× to steal the crown!`, '#ffd700', 4000);
      } else {
        addEventMessage(`👑 ${ev.birdName} has been crowned KINGPIN! (${ev.coins}c)`, '#ffd700');
        showAnnouncement(`👑 KINGPIN: ${ev.birdName}!\nPoop them 3× to dethrone and loot them!`, '#ffd700', 4000);
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
        effects.push({ type: 'xp', x: camera.x, y: camera.y - 30, time: now, duration: 1800,
          text: `+${ev.amount}c TRIBUTE`, color: '#ffd700' });
      }
    }
    if (ev.type === 'kingpin_topple_shockwave') {
      effects.push({ type: 'screen_shake', intensity: 14, duration: 800, time: now });
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
      if (ev.targetId === myId) {
        addEventMessage(`🎯 [${ev.attackerTag}] ${ev.attackerName} hit you! (${ev.hits}/3)`, '#ff4444');
      }
      if (ev.attackerId === myId) {
        addEventMessage(`🎯 Hit [${ev.targetTag}] ${ev.targetName}! (${ev.hits}/3)`, '#ff9944');
      }
    }
    if (ev.type === 'gang_war_kill') {
      SoundEngine.coinPickup && SoundEngine.coinPickup();
      showAnnouncement(`💀 [${ev.attackerGangTag}] ${ev.attackerName} SMOKED [${ev.targetGangTag}] ${ev.targetName}! (+${ev.loot}c)`, ev.attackerGangColor || '#ff3333', 4000);
      addEventMessage(`💀 [${ev.attackerGangTag}] ${ev.attackerName} ELIMINATED [${ev.targetGangTag}] ${ev.targetName} (+${ev.loot}c loot)`, '#ff4444');
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

    // === CHAOS EVENTS ===
    if (ev.type === 'chaos_event') {
      SoundEngine.eventFanfare();
      const names = {
        npc_flood: 'CHAOS: NPC FLOOD! Targets everywhere!',
        car_frenzy: 'CHAOS: CAR FRENZY! Cars gone wild!',
        golden_rain: 'CHAOS: GOLDEN RAIN! Grab the gold!',
      };
      showAnnouncement(names[ev.chaosType] || 'CHAOS EVENT!', '#ff4444', 4000);
      addEventMessage(names[ev.chaosType] || 'Chaos event triggered!', '#ff4444');
    }
    if (ev.type === 'chaos_event_end') {
      addEventMessage('Chaos event ended.', '#888');
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

    // === COMBO MILESTONE ===
    if (ev.type === 'combo_milestone') {
      const fireCount = ev.combo >= 15 ? '🔥🔥🔥' : ev.combo >= 10 ? '🔥🔥' : '🔥';
      if (ev.birdId === myId) {
        showAnnouncement(fireCount + ' COMBO x' + ev.combo + '! ' + fireCount, '#ff8c00', 2500);
        effects.push({ type: 'screen_shake', intensity: Math.min(6, Math.floor(ev.combo / 5)), duration: 300, time: now });
      }
      addEventMessage(fireCount + ' ' + ev.birdName + ' is ON FIRE! x' + ev.combo + ' combo!', '#ff8c00');
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
      };
      const [msg, color] = msgs[ev.weatherType] || ['Weather changed!', '#fff'];
      showAnnouncement(msg, color, 4000);
      addEventMessage(msg, color);
      weatherState = { type: ev.weatherType, windAngle: ev.windAngle, windSpeed: ev.windSpeed, intensity: ev.intensity };
    }
    if (ev.type === 'weather_end') {
      const endMsgs = {
        rain:      'The rain has stopped. Worms retreating underground.',
        wind:      'The wind has died down.',
        storm:     'The storm has passed.',
        fog:       '🌫️ The fog lifts. Cops can see you again.',
        hailstorm: '🌨️ The hailstorm passes.',
      };
      addEventMessage(endMsgs[ev.weatherType] || 'Weather cleared.', '#aaaaaa');
      weatherState = null;
    }
    if (ev.type === 'worms_appeared') {
      addEventMessage('🪱 Worms are wriggling out of the wet ground! Grab them!', '#d46a8a');
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
      showAnnouncement('⚡🍺 DRUNK PIGEON ZAPPED — COIN SHOWER!', '#ffd700', 4000);
      const winnerNames = ev.winners.map(w => `${w.name} (+${w.share}c)`).join(', ');
      addEventMessage(`⚡ Lightning zapped a drunk pigeon! Coins scattered: ${winnerNames || 'nobody nearby'}`, '#ffd700');
      effects.push({ type: 'text', x: ev.x, y: ev.y, text: '💰 COIN SHOWER!', color: '#ffd700', size: 16, time: performance.now(), duration: 3000 });
      effects.push({ type: 'screen_shake', intensity: 10, duration: 500, time: performance.now() });
      // Bonus announcement if I was in range
      if (ev.winners && ev.winners.some(w => w.id === myId)) {
        const myWin = ev.winners.find(w => w.id === myId);
        showAnnouncement(`💰 YOU GOT ${myWin.share}c FROM THE SHOWER!`, '#ffd700', 3000);
      }
    }
    if (ev.type === 'drunk_pigeons_gone') {
      addEventMessage('The drunk pigeons passed out and went home at dawn.', '#aaaaaa');
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
    if (ev.type === 'tower_broadcast') {
      // Big overlay-style announcement for broadcasts
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
  }

  function showAnnouncement(text, color, duration) {
    announcements.push({ text, color, time: performance.now(), duration: duration || 3000 });
  }

  function addEventMessage(text, color) {
    eventMessages.push({ text, color, time: performance.now() });
    if (eventMessages.length > 6) eventMessages.shift();
    updateEventFeed();
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

    // Bird Home toggle
    if (e.key.toLowerCase() === 'h') {
      toggleBirdHome();
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
    // Black Market toggle
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
    // Arena enter
    if (e.key.toLowerCase() === 'e') {
      if (gameState && gameState.arena && lastNearArena &&
          (gameState.arena.state === 'idle' || gameState.arena.state === 'waiting') &&
          !gameState.arena.isFighter) {
        socket.emit('action', { type: 'arena_enter' });
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
    // Graffiti spray — hold G near a building to tag it
    if (e.key.toLowerCase() === 'g') {
      if (gameState && gameState.self && worldData && sprayState === null) {
        const self = gameState.self;
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
    syncInput();
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    if (e.key.toLowerCase() === 'g') {
      sprayState = null; // cancel spray on key release
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
    xpBarText.textContent = 'Lv.' + s.level + ' \u2014 ' + currentLevelXP + '/' + neededXP + ' XP';

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
        wantedHud.textContent = '🚨 ' + stars + ' ' + labels[wLevel] + copText;
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
        cityHallPrompt.innerHTML = `🏛 CITY HALL — Press [V] to open Bounty Board<br><span style="font:9px monospace;color:#ff8800;">${poolTxt}</span>`;
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
    if (nearCH && cityHallPrompt && cityHallPrompt.style.display !== 'none') {
      const poolTxtLive = pool.total > 0 ? `💀 Pool: ${pool.total}c — dethrone the Kingpin to claim it!` : 'No pool yet — be the first to contribute!';
      cityHallPrompt.innerHTML = `🏛 CITY HALL — Press [V] to open Bounty Board<br><span style="font:9px monospace;color:#ff8800;">${poolTxtLive}</span>`;
    }

    // Gang HQ — update when open
    if (gangHqVisible) renderGangHq();

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

    // Active buffs HUD
    updateActiveBuffsHud();

    // Daily Challenges HUD indicator
    updateDailyHudIndicator();
    // Refresh daily panel if open
    if (dailyPanelVisible) renderDailyPanel();

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
    if (!sprayState) {
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
    sprayPrompt.style.display = nearAnyBuilding ? 'block' : 'none';

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
    rain:      { emoji: '🌧️', label: 'RAIN',      color: '#66aaff', odds: '32%' },
    wind:      { emoji: '💨', label: 'WIND',      color: '#aaddff', odds: '26%' },
    storm:     { emoji: '⛈️', label: 'STORM',     color: '#ffdd44', odds: '15%' },
    fog:       { emoji: '🌫️', label: 'FOG',       color: '#b8ddc0', odds: '14%' },
    hailstorm: { emoji: '🌨️', label: 'HAILSTORM', color: '#88ccff', odds: '13%' },
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
      // Betting interface — show all 5 weather types
      const TYPES = ['rain', 'wind', 'storm', 'fog', 'hailstorm'];
      let html = '<div style="color:#aaddff;font-size:12px;margin-bottom:2px;">🌤️ FORECAST BET</div>'
        + '<div style="color:#7799cc;font-size:9px;margin-bottom:6px;">What\'s next? · ' + secsLeft + 's · Pool: ' + totalPool + 'c</div>';

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

  function drawWeather(ctx, camera, now, weather) {
    if (!weather) return;
    const sw = camera.screenW;
    const sh = camera.screenH;
    const dt = 0.05; // approximate frame dt for animation

    const isRainy = weather.type === 'rain' || weather.type === 'storm';
    const isWindy = weather.windSpeed > 0;

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
    };
    const badgeBg = {
      storm: 'rgba(60, 40, 0, 0.75)',
      fog: 'rgba(80, 100, 80, 0.72)',
      hailstorm: 'rgba(20, 50, 90, 0.78)',
    };
    const badgeColor = {
      storm: '#ffdd44',
      fog: '#c8e8cc',
      hailstorm: '#aaddff',
    };
    const badge = badges[weather.type];
    if (badge) {
      const timeRemaining = Math.max(0, Math.ceil((weather.endsAt - Date.now()) / 1000));
      const mins = Math.floor(timeRemaining / 60);
      const secs = timeRemaining % 60;
      const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      const pulse = (weather.type === 'storm' || weather.type === 'hailstorm')
        ? (Math.sin(now * 0.006) * 0.15 + 0.85)
        : (weather.type === 'fog' ? (Math.sin(now * 0.002) * 0.08 + 0.92) : 1);
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
      Renderer.drawTerritories(ctx, camera, gameState.territories, myTeamId);
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
    Renderer.drawPark(ctx, camera);

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
          Sprites.drawPoop(ctx, sx, sy);
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

    // Golden eggs (on ground, unclaimed)
    if (gameState.eggScramble && gameState.eggScramble.eggs) {
      Renderer.drawGoldenEggs(ctx, camera, gameState.eggScramble.eggs, now / 1000);
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

    // Gang Nests
    if (gameState.gangNests && gameState.gangNests.length > 0) {
      const selfGangId = gameState.self && gameState.self.gangId;
      Renderer.drawGangNests(ctx, camera, gameState.gangNests, selfGangId, now);
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

    // Birds
    if (gameState.birds) {
      for (const bird of gameState.birds) {
        const b = lerpBird(bird.id, gameState.birds, prevState?.birds) || bird;
        const sx = b.x - camera.x + camera.screenW / 2;
        const sy = b.y - camera.y + camera.screenH / 2;
        if (sx > -margin && sx < camera.screenW + margin && sy > -margin && sy < camera.screenH + margin) {
          const isPlayer = b.id === myId;
          // Cloaked birds: render at low alpha (ghost outline for others, more visible for self)
          if (b.cloaked) {
            ctx.globalAlpha = isPlayer ? 0.4 : 0.15;
          } else if (b.inNest) {
            ctx.globalAlpha = 0.5;
          }
          Sprites.drawBird(ctx, sx, sy, b.rotation, b.type, b.wingPhase, isPlayer, b.birdColor || null);
          Sprites.drawNameTag(ctx, sx, sy, b.name || '???', b.level || 0, b.type, isPlayer, b.mafiaTitle || null, b.gangTag || null, b.gangColor || null, b.tattoosEquipped || []);
          if (b.cloaked || b.inNest) {
            ctx.globalAlpha = 1;
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
        }
      }
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

    // Restore zoom (HUD drawn at screen scale, not zoomed)
    ctx.restore();

    // Sewer overlay (screen-space, drawn after zoom restore so it covers whole screen)
    if (gameState.self && gameState.self.inSewer) {
      Renderer.drawSewerOverlay(ctx, camera, gameState.self, gameState.sewerRats || [], gameState.sewerLoot || [], now);
    }

    // Day/Night overlay (screen-space, after zoom restore)
    if (gameState.dayTime !== undefined && worldData) {
      Renderer.drawDayNight(ctx, camera, z, gameState.dayTime, worldData.streetLamps);
    }

    // Weather effects (screen-space, drawn over day/night overlay)
    // Use gameState.weather as authoritative source (server-synced each tick)
    drawWeather(ctx, camera, now, gameState.weather || weatherState);

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
    updateSprayUI(now);
    updateRadioTowerUI(now);
    updateRaceUI();
    updateRaceBettingPanel();
    updateWeatherBetPanel(now);
    updateSewerUI(now);

    // Minimap (now includes activeEvent and cat)
    Renderer.drawMinimap(minimapCtx, worldData, gameState.birds, selfBird, gameState.activeEvent, gameState.cat, gameState.janitor, gameState.territories, gameState.bankHeist, gameState.graffiti);

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

    // Gang Nests on minimap
    if (gameState.gangNests && gameState.gangNests.length > 0 && worldData) {
      const selfGangId = gameState.self && gameState.self.gangId;
      Renderer.drawGangNestsOnMinimap(minimapCtx, worldData, gameState.gangNests, selfGangId, now);
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

    // Draw Kingpin on minimap — large pulsing gold crown
    if (gameState.kingpin && gameState.kingpin.x !== null && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      const kx = gameState.kingpin.x * msx;
      const ky = gameState.kingpin.y * msy;
      const kPulse = Math.sin(performance.now() * 0.005) * 0.3 + 0.7;
      // Outer glow
      minimapCtx.globalAlpha = 0.35 * kPulse;
      minimapCtx.fillStyle = '#ffd700';
      minimapCtx.beginPath();
      minimapCtx.arc(kx, ky, 7, 0, Math.PI * 2);
      minimapCtx.fill();
      // Inner dot
      minimapCtx.globalAlpha = 0.9 * kPulse;
      minimapCtx.fillStyle = '#ffe84d';
      minimapCtx.beginPath();
      minimapCtx.arc(kx, ky, 3.5, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.globalAlpha = 1;
      // Crown emoji label
      minimapCtx.font = 'bold 8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText('👑', kx, ky - 6);
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
  // PIGEON MAFIA DON OVERLAY
  // ============================================================
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
    if (s.raceBoostUntil && s.raceBoostUntil > now) {
      const secs = Math.max(0, Math.ceil((s.raceBoostUntil - now) / 1000));
      html += '<div class="bm-buff-pill" style="background:rgba(100,90,0,0.85);border-color:#ffff44;color:#ffff44;animation:kingpinGlow 0.4s ease-in-out infinite alternate;">⚡ BOOST ×1.7 — ' + secs + 's</div>';
    }
    if (s.myHitBounty) {
      const secsLeft = Math.max(0, Math.ceil((s.myHitBounty.expiresAt - now) / 1000));
      html += '<div class="bm-buff-pill" style="background:rgba(80,0,0,0.85);border-color:#ff2222;color:#ff8888;animation:pulseRed 0.8s infinite alternate;">💀 BOUNTY: ' + s.myHitBounty.reward + 'c — ' + Math.floor(secsLeft / 60) + 'm' + (secsLeft % 60) + 's</div>';
    }
    if (s.isKingpin) {
      html += '<div class="bm-buff-pill" style="background:rgba(100,80,0,0.9);border-color:#ffd700;color:#ffd700;animation:kingpinGlow 1.2s ease-in-out infinite alternate;font-weight:bold;">👑 KINGPIN — You earn tribute! Stay rich!</div>';
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
