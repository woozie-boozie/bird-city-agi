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

    // === FLOCK EVENTS ===
    if (ev.type === 'flock_invite') {
      if (ev.toId === myId) {
        SoundEngine.flockInvite();
      }
    }
    if (ev.type === 'flock_joined') {
      addEventMessage(ev.birdName + ' joined ' + ev.flockName + '!', '#4ade80');
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

    // === FOOD TRUCK EVENTS ===
    if (ev.type === 'food_truck_spawn') {
      addEventMessage('A Food Truck is cruising the streets!', '#ff8800');
    }
    if (ev.type === 'truck_honk') {
      SoundEngine.truckHonk();
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
        rain:  ['🌧️ IT\'S RAINING! Worms are surfacing — free food!', '#66aaff'],
        wind:  ['💨 STRONG WINDS! The city is being swept!', '#aaddff'],
        storm: ['⛈️ THUNDERSTORM! Take cover — lightning incoming!', '#ffdd44'],
      };
      const [msg, color] = msgs[ev.weatherType] || ['Weather changed!', '#fff'];
      showAnnouncement(msg, color, 4000);
      addEventMessage(msg, color);
      weatherState = { type: ev.weatherType, windAngle: ev.windAngle, windSpeed: ev.windSpeed, intensity: ev.intensity };
    }
    if (ev.type === 'weather_end') {
      const endMsgs = {
        rain: 'The rain has stopped. Worms retreating underground.',
        wind: 'The wind has died down.',
        storm: 'The storm has passed.',
      };
      addEventMessage(endMsgs[ev.weatherType] || 'Weather cleared.', '#aaaaaa');
      weatherState = null;
    }
    if (ev.type === 'worms_appeared') {
      addEventMessage('🪱 Worms are wriggling out of the wet ground! Grab them!', '#d46a8a');
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
      socket.emit('action', { type: 'use_skill', slot: 0 });
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
    syncInput();
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
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

  function drawWeather(ctx, camera, now, weather) {
    if (!weather) return;
    const sw = camera.screenW;
    const sh = camera.screenH;
    const dt = 0.05; // approximate frame dt for animation

    const isRainy = weather.type === 'rain' || weather.type === 'storm';
    const isWindy = weather.windSpeed > 0;

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
    const badges = { rain: '🌧️ RAIN', wind: '💨 WIND', storm: '⛈️ STORM' };
    const badge = badges[weather.type];
    if (badge) {
      const timeRemaining = Math.max(0, Math.ceil((weather.endsAt - Date.now()) / 1000));
      const mins = Math.floor(timeRemaining / 60);
      const secs = timeRemaining % 60;
      const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      const pulse = weather.type === 'storm' ? (Math.sin(now * 0.006) * 0.15 + 0.85) : 1;
      ctx.save();
      ctx.globalAlpha = pulse * 0.88;
      ctx.fillStyle = weather.type === 'storm' ? 'rgba(60, 40, 0, 0.75)' : 'rgba(20, 40, 80, 0.65)';
      ctx.beginPath();
      ctx.roundRect(sw / 2 + 75, 6, 105, 24, 5);
      ctx.fill();
      ctx.fillStyle = weather.type === 'storm' ? '#ffdd44' : '#88ccff';
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
    Renderer.drawRoads(ctx, camera);
    Renderer.drawPark(ctx, camera);

    // Territory zones (drawn on top of ground, below buildings/entities)
    if (gameState.territories && gameState.self) {
      const selfBird = gameState.self;
      const myTeamId = selfBird.flockId || ('solo_' + selfBird.id);
      Renderer.drawTerritories(ctx, camera, gameState.territories, myTeamId);
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

    // Food truck
    if (gameState.foodTruck) {
      const truck = gameState.foodTruck;
      const sx = truck.x - camera.x + camera.screenW / 2;
      const sy = truck.y - camera.y + camera.screenH / 2;
      if (sx > -margin - 40 && sx < camera.screenW + margin + 40 && sy > -margin - 40 && sy < camera.screenH + margin + 40) {
        Sprites.drawFoodTruck(ctx, sx, sy, truck.angle, truck.foodLeft);
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

    // Buildings & trees on top
    Renderer.drawBuildings(ctx, camera);
    Renderer.drawTrees(ctx, camera);

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
          Sprites.drawNameTag(ctx, sx, sy, b.name || '???', b.level || 0, b.type, isPlayer);
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

    // Restore zoom (HUD drawn at screen scale, not zoomed)
    ctx.restore();

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

    // Minimap (now includes activeEvent and cat)
    Renderer.drawMinimap(minimapCtx, worldData, gameState.birds, selfBird, gameState.activeEvent, gameState.cat, gameState.janitor, gameState.territories);

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

    // Draw food truck on minimap
    if (gameState.foodTruck && worldData) {
      const mw = minimapCtx.canvas.width;
      const mh = minimapCtx.canvas.height;
      const msx = mw / worldData.width;
      const msy = mh / worldData.height;
      minimapCtx.fillStyle = '#ff8800';
      minimapCtx.beginPath();
      minimapCtx.arc(gameState.foodTruck.x * msx, gameState.foodTruck.y * msy, 3, 0, Math.PI * 2);
      minimapCtx.fill();
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
