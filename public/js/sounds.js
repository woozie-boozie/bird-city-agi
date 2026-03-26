// ============================================================
// BIRD CITY: Sound Engine (Web Audio API — no files needed)
// ============================================================

window.SoundEngine = (function () {
  'use strict';

  let ctx = null;
  let enabled = true;
  let unlocked = false;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctx;
  }

  // Unlock AudioContext on first user gesture (required on mobile)
  function unlock() {
    if (unlocked) return;
    const ac = getCtx();
    if (ac.state === 'suspended') {
      ac.resume();
    }
    // Create a silent buffer to fully unlock
    const buf = ac.createBuffer(1, 1, 22050);
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    src.start(0);
    unlocked = true;
  }

  // Listen for first interaction to unlock
  ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(evt => {
    document.addEventListener(evt, unlock, { once: false, passive: true });
  });

  // === Utility: create noise buffer ===
  function noiseBuffer(duration, sampleRate) {
    const ac = getCtx();
    sampleRate = sampleRate || ac.sampleRate;
    const length = sampleRate * duration;
    const buf = ac.createBuffer(1, length, sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  // === POOP SOUND (wet splat) ===
  function poop() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    // Low thud
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    // Wet noise splat
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.12);
    const noiseGain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.value = 2;
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    noise.connect(filter).connect(noiseGain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  // === HIT NPC (splat + yelp) ===
  function hitNPC() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    poop(); // base splat

    // Yelp — short rising tone
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(ac.destination);
    osc.start(now + 0.05);
    osc.stop(now + 0.25);
  }

  // === HIT CAR (splat + metallic thud) ===
  function hitCar() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    poop(); // base splat

    // Metallic ping
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    gain.gain.setValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(ac.destination);
    osc.start(now + 0.02);
    osc.stop(now + 0.3);
  }

  // === HIT STATUE (splat + stone clink) ===
  function hitStatue() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    poop(); // base splat

    // Stone clink — two quick high tones
    [0, 0.06].forEach((offset, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i === 0 ? 2000 : 2400, now + 0.03 + offset);
      gain.gain.setValueAtTime(0.06, now + 0.03 + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + offset);
      osc.connect(gain).connect(ac.destination);
      osc.start(now + 0.03 + offset);
      osc.stop(now + 0.12 + offset);
    });
  }

  // === HIT LAUNDRY (splat + cloth flap) ===
  function hitLaundry() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    poop(); // base splat

    // Cloth flap — filtered noise burst
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.25);
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now + 0.03);
    filter.frequency.linearRampToValueAtTime(200, now + 0.2);
    filter.Q.value = 1;
    gain.gain.setValueAtTime(0.1, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.connect(filter).connect(gain).connect(ac.destination);
    noise.start(now + 0.03);
    noise.stop(now + 0.25);
  }

  // === STEAL FOOD (quick swoosh) ===
  function steal() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    // Swoosh — falling noise
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.15);
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(filter).connect(gain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.15);

    // Quick pop
    const osc = ac.createOscillator();
    const oscGain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
    oscGain.gain.setValueAtTime(0.1, now + 0.02);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(oscGain).connect(ac.destination);
    osc.start(now + 0.02);
    osc.stop(now + 0.1);
  }

  // === XP GAIN (quick ding) ===
  function xp() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1100, now + 0.06);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // === CAW / BIRD SOUND ===
  function caw() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    // Harsh squawk — sawtooth with vibrato
    const osc = ac.createOscillator();
    const vibrato = ac.createOscillator();
    const vibratoGain = ac.createGain();
    const gain = ac.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.08);
    osc.frequency.linearRampToValueAtTime(500, now + 0.2);
    osc.frequency.linearRampToValueAtTime(700, now + 0.28);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.4);

    vibrato.type = 'sine';
    vibrato.frequency.value = 30;
    vibratoGain.gain.value = 50;
    vibrato.connect(vibratoGain).connect(osc.frequency);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
    gain.gain.setValueAtTime(0.12, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    // Add some grit with a filter
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 3;

    osc.connect(filter).connect(gain).connect(ac.destination);
    vibrato.start(now);
    osc.start(now);
    osc.stop(now + 0.4);
    vibrato.stop(now + 0.4);
  }

  // === EVOLVE (triumphant jingle) ===
  function evolve() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
      gain.gain.setValueAtTime(0.12, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  // === CRY (sad trombone) ===
  function cry() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    const notes = [392, 370, 349, 330]; // G4 descending
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = now + i * 0.2;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // === JOIN (quick welcome chime) ===
  function join() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    [660, 880].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.1;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // === LEAVE (descending tone) ===
  function leave() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // ============================================================
  // TIER 1: NEW SOUNDS
  // ============================================================

  // === CAT MEOW (menacing) ===
  function catMeow() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    // Menacing meow: rising then falling with vibrato
    const osc = ac.createOscillator();
    const vibrato = ac.createOscillator();
    const vibratoGain = ac.createGain();
    const gain = ac.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.15);
    osc.frequency.linearRampToValueAtTime(500, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.6);

    vibrato.type = 'sine';
    vibrato.frequency.value = 8;
    vibratoGain.gain.value = 30;
    vibrato.connect(vibratoGain).connect(osc.frequency);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain.gain.setValueAtTime(0.15, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;

    osc.connect(filter).connect(gain).connect(ac.destination);
    vibrato.start(now);
    osc.start(now);
    osc.stop(now + 0.6);
    vibrato.stop(now + 0.6);
  }

  // === CAT HISS ===
  function catHiss() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    // Filtered noise burst — hiss
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.4);
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.linearRampToValueAtTime(2000, now + 0.3);
    filter.Q.value = 1;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
    gain.gain.setValueAtTime(0.12, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter).connect(gain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.4);
  }

  // === HAWK SCREECH ===
  function hawkScreech() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    // High-pitched screech with fast vibrato
    const osc = ac.createOscillator();
    const vibrato = ac.createOscillator();
    const vibratoGain = ac.createGain();
    const gain = ac.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.linearRampToValueAtTime(1800, now + 0.1);
    osc.frequency.linearRampToValueAtTime(1400, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);

    vibrato.type = 'sine';
    vibrato.frequency.value = 15;
    vibratoGain.gain.value = 80;
    vibrato.connect(vibratoGain).connect(osc.frequency);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gain.gain.setValueAtTime(0.1, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 3;

    osc.connect(filter).connect(gain).connect(ac.destination);
    vibrato.start(now);
    osc.start(now);
    osc.stop(now + 0.5);
    vibrato.stop(now + 0.5);
  }

  // === POWER-UP PICKUP (magical sparkle) ===
  function powerUp() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    // Ascending sparkle arpeggio
    const notes = [880, 1100, 1320, 1760];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.06;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });

    // Shimmer noise
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.3);
    const nGain = ac.createGain();
    const nFilter = ac.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 5000;
    nGain.gain.setValueAtTime(0.03, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noise.connect(nFilter).connect(nGain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.3);
  }

  // === CAR HONK ===
  function honk() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    // Two-tone honk
    const osc1 = ac.createOscillator();
    const osc2 = ac.createOscillator();
    const gain = ac.createGain();

    osc1.type = 'square';
    osc1.frequency.value = 440;
    osc2.type = 'square';
    osc2.frequency.value = 370;

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.setValueAtTime(0.08, now + 0.15);
    gain.gain.setValueAtTime(0, now + 0.16);
    gain.gain.setValueAtTime(0.08, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain).connect(ac.destination);
    osc2.connect(gain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  // === EVENT FANFARE (dramatic announcement) ===
  function eventFanfare() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    // Trumpet-like fanfare: C-E-G-C
    const notes = [523, 659, 784, 1047, 1047];
    const durations = [0.12, 0.12, 0.12, 0.12, 0.3];
    let t = now;

    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.setValueAtTime(0.1, t + durations[i] * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);

      osc.connect(filter).connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + durations[i]);

      t += durations[i];
    });
  }

  // === STUNNED / DIZZY (bonk sound) ===
  function stunned() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;

    // Comic bonk
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    // Stars sound — high ting
    const osc2 = ac.createOscillator();
    const gain2 = ac.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2000, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1500, now + 0.2);
    gain2.gain.setValueAtTime(0.06, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc2.connect(gain2).connect(ac.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.25);
  }

  // ============================================================
  // ABILITY SOUNDS
  // ============================================================

  // === FLOCK CALL (multiple chirps) ===
  function abilityFlockCall() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    for (let i = 0; i < 5; i++) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      const freq = 800 + Math.random() * 400;
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + i * 0.08 + 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + i * 0.08 + 0.1);
      gain.gain.setValueAtTime(0.06, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.12);
      osc.connect(gain).connect(ac.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.12);
    }
  }

  // === DIVE BOMB (whoosh + thud) ===
  function abilityDiveBomb() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    // Whoosh
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.3);
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.25);
    filter.Q.value = 2;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noise.connect(filter).connect(gain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.3);
    // Thud
    const osc = ac.createOscillator();
    const tGain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    tGain.gain.setValueAtTime(0.2, now + 0.2);
    tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(tGain).connect(ac.destination);
    osc.start(now + 0.2);
    osc.stop(now + 0.4);
  }

  // === SHADOW CLOAK (ghostly fade) ===
  function abilityShadowCloak() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.5);
    // Shimmer
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.4);
    const nGain = ac.createGain();
    const nFilter = ac.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 4000;
    nGain.gain.setValueAtTime(0.03, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(nFilter).connect(nGain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.4);
  }

  // === EAGLE EYE (eagle cry + sparkle) ===
  function abilityEagleEye() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    // Eagle cry
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.linearRampToValueAtTime(1500, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.4);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 2;
    osc.connect(filter).connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.4);
    // Sparkle
    const notes = [1320, 1760, 2200];
    notes.forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const t = now + 0.2 + i * 0.08;
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.15);
    });
  }

  // === GROUND POUND (heavy thud + rumble) ===
  function abilityGroundPound() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    // Heavy thud
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.4);
    // Rumble noise
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.5);
    const nGain = ac.createGain();
    const nFilter = ac.createBiquadFilter();
    nFilter.type = 'lowpass';
    nFilter.frequency.value = 200;
    nGain.gain.setValueAtTime(0.12, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    noise.connect(nFilter).connect(nGain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.5);
  }

  // ============================================================
  // MISSION & FLOCK SOUNDS
  // ============================================================

  function missionAccept() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.1;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  function missionComplete() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    const notes = [523, 659, 784, 1047, 1047];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  function missionFailed() {
    if (!enabled) return;
    cry(); // reuse sad trombone
  }

  function flockInvite() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    const notes = [880, 1100];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  // === BUY SKILL (cash register cha-ching) ===
  function buySkill() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    // Two quick high tones (cha-ching)
    [0, 0.08].forEach((offset, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i === 0 ? 1800 : 2400, now + offset);
      gain.gain.setValueAtTime(0.1, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
      osc.connect(gain).connect(ac.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.12);
    });
  }

  // === EQUIP SKILL (click/slot pop) ===
  function equipSkill() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // === SPEED BURST (whoosh) ===
  function speedBurst() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.3);
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.15);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.3);
    filter.Q.value = 2;
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noise.connect(filter).connect(gain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.3);
  }

  // === BEACON (sonar ping) ===
  function beacon() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // === DECOY (pop + echo) ===
  function decoySound() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    // Pop
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.12);
    // Echo
    const osc2 = ac.createOscillator();
    const gain2 = ac.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(500, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(250, now + 0.3);
    gain2.gain.setValueAtTime(0.06, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2).connect(ac.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.35);
  }

  // === BOSS SPAWN (dramatic rumble) ===
  function bossSpawn() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    // Deep rumble
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.0);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.setValueAtTime(0.2, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 1.0);
    // Noise rumble
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.8);
    const nGain = ac.createGain();
    const nFilter = ac.createBiquadFilter();
    nFilter.type = 'lowpass';
    nFilter.frequency.value = 150;
    nGain.gain.setValueAtTime(0.15, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    noise.connect(nFilter).connect(nGain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.8);
    // Dramatic chord
    [130, 165, 196].forEach((freq, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 800;
      g.gain.setValueAtTime(0.06, now + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      o.connect(f).connect(g).connect(ac.destination);
      o.start(now + 0.2);
      o.stop(now + 1.0);
    });
  }

  // === BOSS DEFEATED (epic victory fanfare) ===
  function bossDefeated() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.1;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    // Big cymbal
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.6);
    const nGain = ac.createGain();
    const nFilter = ac.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 3000;
    nGain.gain.setValueAtTime(0.08, now + 0.3);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    noise.connect(nFilter).connect(nGain).connect(ac.destination);
    noise.start(now + 0.3);
    noise.stop(now + 0.9);
  }

  // === TRUCK HONK (deeper two-tone horn) ===
  function truckHonk() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    const osc1 = ac.createOscillator();
    const osc2 = ac.createOscillator();
    const gain = ac.createGain();
    osc1.type = 'square';
    osc1.frequency.value = 220;
    osc2.type = 'square';
    osc2.frequency.value = 185;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.setValueAtTime(0.1, now + 0.2);
    gain.gain.setValueAtTime(0, now + 0.22);
    gain.gain.setValueAtTime(0.1, now + 0.28);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain).connect(ac.destination);
    osc2.connect(gain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  // === NPC REVENGE (angry shout sound) ===
  function npcRevenge() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    // Angry shout: rising noise burst
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.4);
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(1200, now + 0.15);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    filter.Q.value = 3;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.setValueAtTime(0.15, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(filter).connect(gain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.4);
    // Angry tone
    const osc = ac.createOscillator();
    const oGain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(500, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    oGain.gain.setValueAtTime(0.08, now);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(oGain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // === JANITOR SHOUT (low grumpy grunt) ===
  function janitorShout() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    // Short sawtooth oscillator at 150-200Hz with quick decay
    const freq = 150 + Math.random() * 50;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.2);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // === JANITOR CLEAN (mop swoosh) ===
  function janitorClean() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    // Filtered noise burst, bandpass at 400Hz
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.15);
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.Q.value = 2;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(filter).connect(gain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  // === JANITOR SUPER (power-up ascending tone sweep) ===
  function janitorSuper() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    // Ascending tone sweep 200->800Hz
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.setValueAtTime(0.12, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.6);
    // Shimmer noise
    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(0.4);
    const nGain = ac.createGain();
    const nFilter = ac.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.value = 3000;
    nGain.gain.setValueAtTime(0.06, now + 0.1);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    noise.connect(nFilter).connect(nGain).connect(ac.destination);
    noise.start(now + 0.1);
    noise.stop(now + 0.5);
  }

  // === NEST SOUND (cozy settle) ===
  function nestSound() {
    if (!enabled) return;
    const ac = getCtx();
    const now = ac.currentTime;
    // Gentle descending coo
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.4);
    // Soft chirp
    const osc2 = ac.createOscillator();
    const gain2 = ac.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(400, now + 0.35);
    gain2.gain.setValueAtTime(0.05, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2).connect(ac.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.4);
  }

  return {
    poop,
    hitNPC,
    hitCar,
    hitStatue,
    hitLaundry,
    steal,
    xp,
    caw,
    evolve,
    cry,
    join,
    leave,
    // Tier 1 sounds
    catMeow,
    catHiss,
    hawkScreech,
    powerUp,
    honk,
    eventFanfare,
    stunned,
    // Ability sounds
    abilityFlockCall,
    abilityDiveBomb,
    abilityShadowCloak,
    abilityEagleEye,
    abilityGroundPound,
    // Skill sounds
    buySkill,
    equipSkill,
    speedBurst,
    beacon,
    decoySound,
    // Mission & flock sounds
    missionAccept,
    missionComplete,
    missionFailed,
    flockInvite,
    // Boss & chaos sounds
    bossSpawn,
    bossDefeated,
    truckHonk,
    npcRevenge,
    nestSound,
    // Janitor sounds
    janitorShout,
    janitorClean,
    janitorSuper,
    toggle() { enabled = !enabled; return enabled; },
    isEnabled() { return enabled; },
  };

})();
