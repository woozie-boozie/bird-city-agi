// Bird City Sprite Drawing (all canvas primitives, no images needed)
window.Sprites = {

  // Helper: darken a hex color
  _darkenColor(hex, factor) {
    factor = factor || 0.7;
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.floor(r * factor);
    g = Math.floor(g * factor);
    b = Math.floor(b * factor);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  // === BIRD (top-down view) ===
  drawBird(ctx, x, y, rotation, type, wingPhase, isPlayer, colorOverride) {
    const types = {
      pigeon:  { body: '#888', wing: '#666', beak: '#e8a020', size: 12, eye: '#000' },
      seagull: { body: '#eee', wing: '#bbb', beak: '#e87020', size: 14, eye: '#222' },
      crow:    { body: '#222', wing: '#111', beak: '#444', size: 14, eye: '#c00' },
      eagle:   { body: '#8B4513', wing: '#654321', beak: '#daa520', size: 18, eye: '#ff0' },
      ostrich: { body: '#5a4030', wing: '#4a3020', beak: '#cc8833', size: 24, eye: '#000' },
    };
    const t = types[type] || types.pigeon;
    const s = t.size;
    // Apply color override
    const bodyColor = colorOverride || t.body;
    const wingColor = colorOverride ? this._darkenColor(colorOverride, 0.7) : t.wing;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(2, 4, s * 0.8, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings (flapping)
    const wingFlap = Math.sin(wingPhase) * 0.4;
    const wingSpread = s * 0.9;

    ctx.fillStyle = wingColor;
    // Left wing
    ctx.save();
    ctx.translate(-s * 0.2, 0);
    ctx.rotate(-wingFlap);
    ctx.beginPath();
    ctx.ellipse(0, -wingSpread * 0.5, s * 0.6, s * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right wing
    ctx.save();
    ctx.translate(-s * 0.2, 0);
    ctx.rotate(wingFlap);
    ctx.beginPath();
    ctx.ellipse(0, wingSpread * 0.5, s * 0.6, s * 0.25, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = t.beak;
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(s + s * 0.5, -s * 0.15);
    ctx.lineTo(s + s * 0.5, s * 0.15);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = t.eye;
    ctx.beginPath();
    ctx.arc(s * 0.4, -s * 0.25, s * 0.12, 0, Math.PI * 2);
    ctx.arc(s * 0.4, s * 0.25, s * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(-s * 1.4, -s * 0.3);
    ctx.lineTo(-s * 1.2, 0);
    ctx.lineTo(-s * 1.4, s * 0.3);
    ctx.closePath();
    ctx.fill();

    // Player indicator (glow)
    if (isPlayer) {
      ctx.strokeStyle = 'rgba(255, 200, 50, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, s + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  },

  // === NAME TAG ===
  drawNameTag(ctx, x, y, name, level, type, isPlayer) {
    const text = `${name} [Lv.${level}]`;
    ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'center';

    // Background
    const w = ctx.measureText(text).width + 8;
    ctx.fillStyle = isPlayer ? 'rgba(255, 200, 50, 0.7)' : 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x - w / 2, y - 25, w, 15);
    ctx.borderRadius = 3;

    // Text
    ctx.fillStyle = isPlayer ? '#1a1a2e' : '#fff';
    ctx.fillText(text, x, y - 14);
  },

  // === POOP ===
  drawPoop(ctx, x, y) {
    // Splat shape
    ctx.fillStyle = '#6b4226';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.arc(x - 2, y - 1, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#9b6a3b';
    ctx.beginPath();
    ctx.arc(x + 1, y + 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(x - 1, y - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  },

  // === NPC HUMAN (top-down) ===
  drawNPC(ctx, x, y, type, state, poopedOn) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(1, 2, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bodyColors = {
      walker: '#4488cc',
      cafe_sitter: '#cc6644',
      park_walker: '#66aa44',
      wedding_guest: '#6644aa',
      parade_pigeon: '#888888',
    };
    ctx.fillStyle = bodyColors[type] || '#4488cc';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#deb887';
    ctx.beginPath();
    ctx.arc(0, -6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.arc(0, -8, 4, Math.PI, 0);
    ctx.fill();

    // State effects
    if (state === 'fleeing') {
      // Panic lines
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + Date.now() * 0.01;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 10 - 4);
        ctx.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15 - 4);
        ctx.stroke();
      }
    }

    if (state === 'angry') {
      // Angry face
      ctx.fillStyle = '#f00';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -14);
    }

    // Poop stains
    if (poopedOn > 0) {
      for (let i = 0; i < Math.min(poopedOn, 5); i++) {
        ctx.fillStyle = '#6b4226';
        const px = (Math.sin(i * 2.5) * 6);
        const py = (Math.cos(i * 3.1) * 6);
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  },

  // === FOOD ===
  drawFood(ctx, x, y, type) {
    ctx.save();
    ctx.translate(x, y);

    const colors = {
      chips: '#ffd700',
      sandwich: '#deb887',
      kebab: '#cd853f',
      pizza: '#ff6347',
      donut: '#ff69b4',
      crumb: '#d2b48c',
      fry: '#ffd700',
      bread: '#deb887',
      cake: '#ffccee',
      golden: '#ffd700',
      truck_food: '#ff8800',
    };

    ctx.fillStyle = colors[type] || '#deb887';

    if (type === 'chips' || type === 'fry') {
      // Little rectangle sticks
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-3 + i * 2, -4, 1.5, 8);
      }
    } else if (type === 'pizza') {
      // Triangle
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(-5, 5);
      ctx.lineTo(5, 5);
      ctx.closePath();
      ctx.fill();
      // Pepperoni
      ctx.fillStyle = '#8b0000';
      ctx.beginPath();
      ctx.arc(-1, 0, 1.5, 0, Math.PI * 2);
      ctx.arc(2, 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'donut') {
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'golden') {
      // Golden food: glowing gold circle
      const gPulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
      ctx.fillStyle = 'rgba(255, 215, 0, ' + (gPulse * 0.3) + ')';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-1, -1, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'crumb') {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(Math.sin(i * 2) * 3, Math.cos(i * 3) * 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'worm') {
      // Squiggly pink worm — drawn as a winding bezier curve
      const wPulse = Math.sin(Date.now() * 0.004) * 1.5;
      ctx.strokeStyle = '#d46a8a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, -2 + wPulse);
      ctx.bezierCurveTo(-3, -5 - wPulse, 0, 3 + wPulse, 3, -3 - wPulse);
      ctx.bezierCurveTo(5, -6, 6, 1 + wPulse, 7, 0);
      ctx.stroke();
      // Worm head (small circle)
      ctx.fillStyle = '#c45a7a';
      ctx.beginPath();
      ctx.arc(7, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'cake') {
      // Wedding cake - larger, tiered
      ctx.fillStyle = '#fff';
      ctx.fillRect(-8, -4, 16, 10);
      ctx.fillRect(-6, -8, 12, 6);
      ctx.fillRect(-4, -12, 8, 5);
      // Pink decoration
      ctx.fillStyle = '#ff69b4';
      ctx.beginPath();
      ctx.arc(0, -12, 3, 0, Math.PI * 2);
      ctx.fill();
      // Gold border
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(-8, -4, 16, 10);
      ctx.strokeRect(-6, -8, 12, 6);
    } else {
      // Generic food blob
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(-1, -1, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glow to make food visible
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  },

  // === CAFE TABLE ===
  drawTable(ctx, x, y) {
    // Table top
    ctx.fillStyle = '#8b6914';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Table edge
    ctx.strokeStyle = '#6b4914';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();
  },

  // === CAR (top-down) ===
  drawCar(ctx, x, y, w, h, color) {
    ctx.save();
    ctx.translate(x, y);

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Windshield
    ctx.fillStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.fillRect(w * 0.15, -h / 2 + 2, w * 0.25, h - 4);

    // Roof line
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);

    ctx.restore();
  },

  // === TREE (top-down) ===
  drawTree(ctx, x, y, size) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 3, size, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Canopy (main)
    ctx.fillStyle = '#2d8a4e';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Canopy (highlight)
    ctx.fillStyle = '#3da85e';
    ctx.beginPath();
    ctx.arc(x - size * 0.2, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Trunk visible in center
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  },

  // === STATUE ===
  drawStatue(ctx, x, y) {
    // Pedestal
    ctx.fillStyle = '#999';
    ctx.fillRect(x - 12, y - 5, 24, 18);

    // Figure
    ctx.fillStyle = '#bbb';
    ctx.fillRect(x - 4, y - 20, 8, 15);

    // Head
    ctx.beginPath();
    ctx.arc(x, y - 24, 5, 0, Math.PI * 2);
    ctx.fill();

    // Plaque
    ctx.fillStyle = '#c8a84e';
    ctx.fillRect(x - 8, y + 10, 16, 4);
  },

  // === BUILDING (top-down) ===
  drawBuilding(ctx, x, y, w, h, color) {
    // Main structure
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);

    // Darker roof edge
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x, y, w, 4);
    ctx.fillRect(x, y, 4, h);

    // Windows
    ctx.fillStyle = 'rgba(200, 220, 255, 0.4)';
    const winSize = 6;
    const winGap = 14;
    for (let wx = x + 10; wx < x + w - 10; wx += winGap) {
      for (let wy = y + 12; wy < y + h - 10; wy += winGap) {
        ctx.fillRect(wx, wy, winSize, winSize);
      }
    }

    // Building outline
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  },

  // === LAUNDRY LINE ===
  drawLaundry(ctx, x1, y1, x2, y2) {
    // Posts
    ctx.fillStyle = '#654321';
    ctx.fillRect(x1 - 2, y1 - 15, 4, 20);
    ctx.fillRect(x2 - 2, y2 - 15, 4, 20);

    // Line
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 12);
    ctx.lineTo(x2, y2 - 12);
    ctx.stroke();

    // Clothes hanging
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8a5c'];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    for (let i = 0; i < 5; i++) {
      const t = 0.15 + i * 0.15;
      const cx = x1 + dx * t;
      const cy = y1 + dy * t - 12;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(cx - 4, cy, 8, 10 + Math.sin(Date.now() * 0.002 + i) * 2);
    }
  },

  // ============================================================
  // TIER 1: NEW SPRITES
  // ============================================================

  // === CAT (top-down, orange/ginger) ===
  drawCat(ctx, x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(2, 3, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail (behind body)
    ctx.strokeStyle = '#d47730';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    const tailWag = Math.sin(Date.now() * 0.005) * 4;
    ctx.quadraticCurveTo(-18, tailWag, -22, tailWag - 4);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#e88830';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stripes
    ctx.strokeStyle = '#c46820';
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 4, -5);
      ctx.lineTo(i * 4, 5);
      ctx.stroke();
    }

    // Head
    ctx.fillStyle = '#e88830';
    ctx.beginPath();
    ctx.arc(10, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Ears (triangles)
    ctx.fillStyle = '#d47730';
    ctx.beginPath();
    ctx.moveTo(13, -6);
    ctx.lineTo(16, -12);
    ctx.lineTo(10, -8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(13, 6);
    ctx.lineTo(16, 12);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();

    // Inner ears
    ctx.fillStyle = '#ffaa88';
    ctx.beginPath();
    ctx.moveTo(13, -6);
    ctx.lineTo(15, -10);
    ctx.lineTo(11, -7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(13, 6);
    ctx.lineTo(15, 10);
    ctx.lineTo(11, 7);
    ctx.closePath();
    ctx.fill();

    // Eyes (menacing green)
    ctx.fillStyle = '#2a2';
    ctx.beginPath();
    ctx.ellipse(12, -3, 2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, 3, 2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (vertical slits)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(12, -3, 0.8, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, 3, 0.8, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#ff8888';
    ctx.beginPath();
    ctx.arc(16, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(14, side * 2);
        ctx.lineTo(22, side * (3 + i * 2));
        ctx.stroke();
      }
    }

    // Danger indicator (red glow)
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  },

  // === HAWK (top-down, brown, larger) ===
  drawHawk(ctx, x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const s = 20; // larger than birds

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(3, 5, s * 0.9, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings (spread wide)
    const wingFlap = Math.sin(Date.now() * 0.008) * 0.2;
    ctx.fillStyle = '#5a3a1a';
    ctx.save();
    ctx.rotate(-wingFlap);
    ctx.beginPath();
    ctx.ellipse(-3, -s * 0.8, s * 1.2, s * 0.3, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.rotate(wingFlap);
    ctx.beginPath();
    ctx.ellipse(-3, s * 0.8, s * 1.2, s * 0.3, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Wing feather details
    ctx.fillStyle = '#4a2a0a';
    ctx.save();
    ctx.rotate(-wingFlap);
    ctx.beginPath();
    ctx.ellipse(-6, -s * 0.9, s * 0.8, s * 0.15, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.rotate(wingFlap);
    ctx.beginPath();
    ctx.ellipse(-6, s * 0.9, s * 0.8, s * 0.15, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = '#6b4226';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.8, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // White chest
    ctx.fillStyle = '#d4c4a4';
    ctx.beginPath();
    ctx.ellipse(3, 0, s * 0.3, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#4a2a0a';
    ctx.beginPath();
    ctx.arc(s * 0.6, 0, s * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Hooked beak (yellow)
    ctx.fillStyle = '#daa520';
    ctx.beginPath();
    ctx.moveTo(s * 0.9, 0);
    ctx.lineTo(s * 1.2, -s * 0.08);
    ctx.lineTo(s * 1.15, s * 0.05);
    ctx.lineTo(s * 0.9, s * 0.05);
    ctx.closePath();
    ctx.fill();

    // Fierce eyes
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(s * 0.65, -s * 0.15, s * 0.1, 0, Math.PI * 2);
    ctx.arc(s * 0.65, s * 0.15, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(s * 0.67, -s * 0.15, s * 0.05, 0, Math.PI * 2);
    ctx.arc(s * 0.67, s * 0.15, s * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Tail feathers
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, 0);
    ctx.lineTo(-s * 1.2, -s * 0.25);
    ctx.lineTo(-s * 1.0, 0);
    ctx.lineTo(-s * 1.2, s * 0.25);
    ctx.closePath();
    ctx.fill();

    // Danger glow (red)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, s + 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  },

  // === BRIDE NPC ===
  drawBride(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(1, 3, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dress (white, flowing)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, 2, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dress detail
    ctx.strokeStyle = 'rgba(200,200,200,0.5)';
    ctx.lineWidth = 0.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 3, -6);
      ctx.lineTo(i * 4, 10);
      ctx.stroke();
    }

    // Bodice
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.ellipse(0, -4, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.arc(0, -10, 5, 0, Math.PI * 2);
    ctx.fill();

    // Veil
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(-5, -12);
    ctx.quadraticCurveTo(0, -18, 5, -12);
    ctx.lineTo(8, 0);
    ctx.quadraticCurveTo(0, -5, -8, 0);
    ctx.closePath();
    ctx.fill();

    // Bouquet
    ctx.fillStyle = '#ff69b4';
    ctx.beginPath();
    ctx.arc(6, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff1493';
    ctx.beginPath();
    ctx.arc(5, -1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#228b22';
    ctx.beginPath();
    ctx.arc(7, 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle
    const sparkle = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 215, 0, ${sparkle * 0.5})`;
    ctx.beginPath();
    ctx.arc(-3, -15, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -14, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  // === OLD LADY NPC ===
  drawOldLady(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(1, 3, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coat (dark purple)
    ctx.fillStyle = '#6a4a7a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.arc(0, -8, 5, 0, Math.PI * 2);
    ctx.fill();

    // Grey hair (bun)
    ctx.fillStyle = '#c0c0c0';
    ctx.beginPath();
    ctx.arc(0, -10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -13, 3, 0, Math.PI * 2);
    ctx.fill();

    // Glasses
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-2, -7, 2.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(2, -7, 2.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.5, -7);
    ctx.lineTo(0.5, -7);
    ctx.stroke();

    // Bread bag
    ctx.fillStyle = '#c4956a';
    ctx.fillRect(5, -3, 7, 9);
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(5, -3, 7, 2);

    // Bread pieces visible in bag
    ctx.fillStyle = '#deb887';
    ctx.beginPath();
    ctx.arc(8, 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, 3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Throwing breadcrumbs animation
    const throwPhase = (Date.now() * 0.003) % (Math.PI * 2);
    ctx.fillStyle = '#deb887';
    for (let i = 0; i < 3; i++) {
      const a = throwPhase + i * 2.1;
      const d = 12 + Math.sin(a) * 5;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  // === POWER-UP (glowing colored orb) ===
  drawPowerUp(ctx, x, y, type) {
    ctx.save();
    ctx.translate(x, y);

    const colors = {
      hot_sauce: { inner: '#ff4400', outer: '#ff8800', glow: 'rgba(255,68,0,0.3)' },
      speed_feather: { inner: '#00ccff', outer: '#88eeff', glow: 'rgba(0,204,255,0.3)' },
      ghost_feather: { inner: '#cc88ff', outer: '#eeccff', glow: 'rgba(204,136,255,0.3)' },
      mega_poop: { inner: '#8b4513', outer: '#ffd700', glow: 'rgba(255,215,0,0.3)' },
    };

    const c = colors[type] || colors.hot_sauce;
    const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    const bobY = Math.sin(Date.now() * 0.003) * 3;

    // Outer glow
    ctx.fillStyle = c.glow;
    ctx.beginPath();
    ctx.arc(0, bobY, 14 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Inner glow
    ctx.fillStyle = c.outer;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, bobY, 10 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Core orb
    ctx.fillStyle = c.inner;
    ctx.beginPath();
    ctx.arc(0, bobY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(-2, bobY - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Icon inside
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    const icons = {
      hot_sauce: '\u{1F336}',
      speed_feather: '\u{1F4A8}',
      ghost_feather: '\u{1F47B}',
      mega_poop: '\u{1F4A5}',
    };
    // Use text labels since emoji rendering varies
    const labels = {
      hot_sauce: 'H',
      speed_feather: 'S',
      ghost_feather: 'G',
      mega_poop: 'M',
    };
    ctx.fillText(labels[type] || '?', 0, bobY);

    // Sparkle particles
    for (let i = 0; i < 4; i++) {
      const a = Date.now() * 0.002 + i * 1.57;
      const d = 10 + Math.sin(Date.now() * 0.004 + i) * 3;
      ctx.fillStyle = c.outer;
      ctx.globalAlpha = pulse * 0.7;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, bobY + Math.sin(a) * d, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  },

  // === STUN STARS (spinning around stunned bird) ===
  drawStunStars(ctx, x, y, time) {
    ctx.save();
    ctx.translate(x, y);

    const phase = time * 0.005;
    const starCount = 5;
    const radius = 18;

    for (let i = 0; i < starCount; i++) {
      const angle = phase + (i / starCount) * Math.PI * 2;
      const sx = Math.cos(angle) * radius;
      const sy = Math.sin(angle) * radius - 10;

      // Star shape
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * Math.PI * 2 - Math.PI / 2 + phase * 2;
        const r = j % 2 === 0 ? 4 : 2;
        if (j === 0) ctx.moveTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
        else ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Dizzy swirl
    ctx.strokeStyle = 'rgba(255, 255, 100, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.2) {
      const r = 5 + a * 2;
      const px = Math.cos(a + phase) * r;
      const py = Math.sin(a + phase) * r - 10;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.restore();
  },

  // === SLEEPING ZZZ (for nesting birds) ===
  drawSleepZzz(ctx, x, y, time) {
    ctx.save();
    ctx.translate(x, y - 20);
    const phase = time * 0.002;

    // Three Z's floating upward at different phases
    const zees = [
      { text: 'z', size: 10, offset: 0 },
      { text: 'Z', size: 13, offset: 0.7 },
      { text: 'z', size: 9, offset: 1.4 },
    ];

    for (const z of zees) {
      const t = ((phase + z.offset) % 2) / 2; // 0-1 cycle
      const fx = Math.sin(t * Math.PI * 2) * 8;
      const fy = -t * 25;
      ctx.globalAlpha = 1 - t;
      ctx.font = 'bold ' + z.size + 'px Courier New';
      ctx.fillStyle = '#aaccff';
      ctx.textAlign = 'center';
      ctx.fillText(z.text, fx, fy);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  },

  // === GROUND POUND WAVE ===
  drawGroundPoundWave(ctx, x, y, progress) {
    ctx.save();
    ctx.translate(x, y);
    const radius = 80 * progress;
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4 * (1 - progress);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    // Inner ring
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 2 * (1 - progress);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  // === DIVE BOMB TRAIL ===
  drawDiveBombTrail(ctx, x, y, rotation, progress) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = 0.6 * (1 - progress);
    // Speed streaks behind the bird
    for (let i = 0; i < 5; i++) {
      const offsetY = (i - 2) * 6;
      const len = 20 + i * 8;
      ctx.strokeStyle = i % 2 === 0 ? '#00ccff' : '#88eeff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10 - len * progress, offsetY);
      ctx.lineTo(-10, offsetY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  // === MISSION BOARD (floating icon above Pigeon Date Center) ===
  drawMissionBoard(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    const bob = Math.sin(Date.now() * 0.003) * 3;
    // Board
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(-12, -30 + bob, 24, 20);
    // Paper
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(-10, -28 + bob, 20, 16);
    // Lines
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-7, -24 + bob + i * 4);
      ctx.lineTo(7, -24 + bob + i * 4);
      ctx.stroke();
    }
    // Pin
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(0, -30 + bob, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  // === DECOY (ghost bird) ===
  drawDecoy(ctx, x, y, rotation, type, wingPhase, colorOverride) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    // Shimmer effect
    const shimmer = Math.sin(Date.now() * 0.01) * 0.1 + 0.3;
    ctx.globalAlpha = shimmer;
    this.drawBird(ctx, x, y, rotation, type, wingPhase || Date.now() * 0.005, false, colorOverride);
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  // === BEACON (pulsing marker) ===
  drawBeacon(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    const outerR = 12 * pulse;

    // Outer glow
    ctx.fillStyle = 'rgba(255, 255, 100, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, outerR + 4, 0, Math.PI * 2);
    ctx.fill();

    // Main circle
    ctx.fillStyle = 'rgba(255, 220, 50, 0.6)';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Inner dot
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Rays
    ctx.strokeStyle = 'rgba(255, 220, 50, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Date.now() * 0.002;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.lineTo(Math.cos(a) * (12 + pulse * 4), Math.sin(a) * (12 + pulse * 4));
      ctx.stroke();
    }

    // "!" text
    ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('!', 0, -16);

    ctx.restore();
  },

  // === BOSS HP BAR ===
  drawBossHP(ctx, x, y, hp, maxHp) {
    const barW = 60;
    const barH = 8;
    const ratio = Math.max(0, hp / maxHp);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - barW / 2 - 1, y - barH / 2 - 1, barW + 2, barH + 2);

    // Red background
    ctx.fillStyle = '#440000';
    ctx.fillRect(x - barW / 2, y - barH / 2, barW, barH);

    // Green fill
    const fillColor = ratio > 0.5 ? '#44cc44' : ratio > 0.25 ? '#cccc44' : '#cc4444';
    ctx.fillStyle = fillColor;
    ctx.fillRect(x - barW / 2, y - barH / 2, barW * ratio, barH);

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barW / 2, y - barH / 2, barW, barH);

    // Text
    ctx.font = 'bold 7px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(Math.ceil(hp) + '/' + maxHp, x, y + 3);
  },

  // === FOOD TRUCK ===
  drawFoodTruck(ctx, x, y, angle, foodLeft) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(2, 4, 28, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Truck body (larger than car)
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(-25, -13, 50, 26);

    // Cab
    ctx.fillStyle = '#cc6600';
    ctx.fillRect(18, -11, 10, 22);

    // Windshield
    ctx.fillStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.fillRect(22, -9, 5, 18);

    // Wheels
    ctx.fillStyle = '#333';
    ctx.fillRect(-20, -15, 8, 4);
    ctx.fillRect(-20, 11, 8, 4);
    ctx.fillRect(12, -15, 8, 4);
    ctx.fillRect(12, 11, 8, 4);

    // Food icon on side
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(foodLeft > 0 ? 'FOOD' : 'EMPTY', -3, 0);

    // Food count
    if (foodLeft > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 8px Courier New';
      ctx.fillText(foodLeft + '', -3, 8);
    }

    // Border
    ctx.strokeStyle = '#aa5500';
    ctx.lineWidth = 1;
    ctx.strokeRect(-25, -13, 50, 26);

    ctx.restore();
  },

  // === REVENGE NPC (angry red-faced NPC with exclamation mark) ===
  // === THE JANITOR ===
  drawJanitor(ctx, x, y, state, isSuper) {
    ctx.save();
    ctx.translate(x, y);

    const time = Date.now() * 0.001;

    // Freakout: rotate sprite slightly
    if (state === 'freakout') {
      ctx.rotate(Math.sin(time * 15) * 0.3);
    }

    // Super: golden glow outline
    if (isSuper) {
      ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
      ctx.shadowBlur = 15;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(1, 2, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body: blue overalls
    ctx.fillStyle = '#3355aa';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Overall straps
    ctx.strokeStyle = '#224488';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-3, -4);
    ctx.lineTo(-3, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, -4);
    ctx.lineTo(3, 4);
    ctx.stroke();

    // Head
    const faceColor = (state === 'angry' || state === 'fist_shake' || state === 'freakout') ? '#e07070' : '#deb887';
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.arc(0, -6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cap / Hard hat
    if (isSuper) {
      // Yellow hard hat
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.ellipse(0, -9, 6, 3, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-6, -9, 12, 2);
    } else {
      // Blue cap
      ctx.fillStyle = '#2244aa';
      ctx.beginPath();
      ctx.ellipse(0, -9, 5, 2.5, 0, Math.PI, 0);
      ctx.fill();
      // Cap brim
      ctx.fillStyle = '#1a3388';
      ctx.fillRect(-5, -9, 10, 1.5);
    }

    // Mop / Power washer
    if (isSuper) {
      // Power washer: thicker line with spray
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 3;
      const mopSway = state === 'cleaning' ? Math.sin(time * 8) * 6 : 0;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(14 + mopSway, 8);
      ctx.stroke();
      // Spray nozzle
      ctx.fillStyle = '#888';
      ctx.fillRect(12 + mopSway, 6, 5, 4);
      // Spray particles
      for (let i = 0; i < 4; i++) {
        const px = 18 + mopSway + Math.random() * 8;
        const py = 6 + Math.random() * 6;
        ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Sparkle dots around janitor
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + time * 2;
        const dist = 12 + Math.sin(time * 3 + i) * 4;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Mop: gray stick + white mop head
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      const mopSway = state === 'cleaning' ? Math.sin(time * 8) * 6 : 0;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(14 + mopSway, 8);
      ctx.stroke();
      // Mop head
      ctx.fillStyle = '#eee';
      ctx.fillRect(12 + mopSway, 7, 5, 4);
      ctx.fillStyle = '#ddd';
      ctx.fillRect(11 + mopSway, 9, 7, 2);
    }

    // State-specific effects
    if (state === 'angry' || state === 'fist_shake') {
      // Fist above head
      ctx.fillStyle = '#deb887';
      ctx.beginPath();
      ctx.arc(0, -16, 3, 0, Math.PI * 2);
      ctx.fill();
      // "!" text
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 12px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -20);
    }

    if (state === 'freakout') {
      // "!!!" above head
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 12px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('!!!', 0, -18);
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  drawRevengeNPC(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(1, 2, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red glow
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Body (red)
    ctx.fillStyle = '#cc2222';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head (angry red)
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(0, -6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-2, -7, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -7, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-2, -7, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -7, 1, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.lineTo(-1, -8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, -9);
    ctx.lineTo(1, -8);
    ctx.stroke();

    // Exclamation mark
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, -16);

    ctx.restore();
  },

  // === POWER-UP ICON (shown near bird when active) ===
  drawPowerUpIcon(ctx, x, y, type) {
    ctx.save();
    ctx.translate(x, y - 30);

    const colors = {
      hot_sauce: '#ff4400',
      speed_feather: '#00ccff',
      ghost_feather: '#cc88ff',
      mega_poop: '#ffd700',
    };
    const labels = {
      hot_sauce: 'HOT',
      speed_feather: 'FAST',
      ghost_feather: 'GHOST',
      mega_poop: 'MEGA',
    };

    const col = colors[type] || '#fff';
    const label = labels[type] || '?';

    // Background pill
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const w = 28;
    ctx.fillRect(-w / 2, -6, w, 12);

    // Text
    ctx.font = 'bold 8px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = col;
    ctx.fillText(label, 0, 0);

    ctx.restore();
  },

  // === RACCOON THIEF (top-down, night creature) ===
  drawRaccoon(ctx, x, y, rotation, state, carriedFoodType) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(2, 4, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bushy striped tail (drawn behind body)
    const tailWag = Math.sin(Date.now() * 0.006) * 0.25;
    ctx.save();
    ctx.translate(-10, 0);
    ctx.rotate(Math.PI + tailWag);
    // Tail segments with rings
    for (let i = 0; i < 3; i++) {
      const ri = i / 3;
      ctx.fillStyle = i % 2 === 0 ? '#888' : '#333';
      ctx.beginPath();
      ctx.ellipse(i * 5, 0, 5 - i * 0.5, 3 - i * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Body — dark gray
    ctx.fillStyle = '#6a6a6a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black "bandit" mask stripe across middle (distinctive raccoon feature)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(5, -2, 5, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5, 2, 5, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Lighter belly/chest
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.ellipse(-1, 0, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.ellipse(9, 0, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose (little black dot)
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(12, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Ears (small triangles at top)
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(3, -7);
    ctx.lineTo(6, -11);
    ctx.lineTo(8, -7);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(3, 7);
    ctx.lineTo(6, 11);
    ctx.lineTo(8, 7);
    ctx.fill();

    // Eyes — beady glowing yellow (raccoon night eyes)
    ctx.fillStyle = '#ffee00';
    ctx.beginPath();
    ctx.arc(7, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(7.5, -3, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7.5, 3, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // "THIEF!" label when carrying food
    if (state === 'carrying' && carriedFoodType) {
      const now = Date.now();
      const pulse = Math.sin(now * 0.008) * 0.15 + 0.85;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.font = 'bold 9px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4400';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText('THIEF!', x, y - 20);
      ctx.fillText('THIEF!', x, y - 20);
      ctx.restore();
    }

    // "CAUGHT!" flash when fleeing
    if (state === 'fleeing') {
      ctx.save();
      ctx.font = 'bold 9px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4ade80';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText('BUSTED!', x, y - 20);
      ctx.fillText('BUSTED!', x, y - 20);
      ctx.restore();
    }
  },

  // ================================================================
  // COP BIRD — Blue uniform pigeon with badge and siren light
  // ================================================================
  drawCopBird(ctx, x, y, rotation, type, state, now) {
    const isSWAT = type === 'swat';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(2, 5, isSWAT ? 13 : 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings (spread slightly — cop birds fly purposefully)
    const wingFlap = Math.sin(now * 0.015) * 0.3;
    ctx.fillStyle = isSWAT ? '#1a1a2e' : '#1a3a6e';
    // Left wing
    ctx.save();
    ctx.translate(-4, 0);
    ctx.rotate(-0.4 + wingFlap);
    ctx.beginPath();
    ctx.ellipse(-6, 0, isSWAT ? 10 : 8, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Right wing
    ctx.save();
    ctx.translate(-4, 0);
    ctx.rotate(0.4 - wingFlap);
    ctx.beginPath();
    ctx.ellipse(-6, 0, isSWAT ? 10 : 8, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body — police blue (SWAT: black tactical)
    ctx.fillStyle = isSWAT ? '#0d0d1a' : '#1e4080';
    ctx.beginPath();
    ctx.ellipse(0, 0, isSWAT ? 11 : 9, isSWAT ? 8 : 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chest badge (gold star shape)
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    // Simple star: 5 points
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
      const ai = (i * 4 * Math.PI / 5 + 2 * Math.PI / 5) - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
      else ctx.lineTo(Math.cos(a) * 4, Math.sin(a) * 4);
      ctx.lineTo(Math.cos(ai) * 2, Math.sin(ai) * 2);
    }
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = isSWAT ? '#222' : '#2a5298';
    ctx.beginPath();
    ctx.arc(7, 0, isSWAT ? 6 : 5, 0, Math.PI * 2);
    ctx.fill();

    // Police cap / SWAT helmet
    if (isSWAT) {
      // Tactical helmet — dark with visor
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(7, -1, 6, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#2a4a6a';
      ctx.beginPath();
      ctx.arc(7, 1, 4, Math.PI, 0);
      ctx.fill();
    } else {
      // Classic police cap
      ctx.fillStyle = '#0a2060';
      ctx.beginPath();
      ctx.arc(7, -1, 5, Math.PI, 0);
      ctx.fill();
      // Cap brim
      ctx.fillStyle = '#08174a';
      ctx.beginPath();
      ctx.rect(3, -1, 8, 2);
      ctx.fill();
      // Cap badge dot
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(7, -2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eye (beady, determined)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(10, -1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(10.5, -1, 1, 0, Math.PI * 2);
    ctx.fill();

    // Beak (sharp)
    ctx.fillStyle = '#e8a000';
    ctx.beginPath();
    ctx.moveTo(12, -1);
    ctx.lineTo(16, 0);
    ctx.lineTo(12, 1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // === Siren light on top (flashing red/blue) ===
    if (state !== 'stunned') {
      const sirenT = (now * 0.008) % (Math.PI * 2);
      const sirenOn = Math.sin(sirenT) > 0;
      const sirenColor = sirenOn ? 'rgba(255,50,50,0.85)' : 'rgba(50,100,255,0.85)';

      // Siren glow
      const sirenGlow = ctx.createRadialGradient(x, y - 14, 0, x, y - 14, 12);
      sirenGlow.addColorStop(0, sirenColor);
      sirenGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = sirenGlow;
      ctx.beginPath();
      ctx.arc(x, y - 14, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Siren dot
      ctx.save();
      ctx.fillStyle = sirenColor;
      ctx.beginPath();
      ctx.arc(x, y - 14, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Stunned: ZZZ effect
    if (state === 'stunned') {
      ctx.save();
      ctx.font = 'bold 10px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffff00';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const stunBob = Math.sin(now * 0.005) * 3;
      ctx.strokeText('💫', x, y - 22 + stunBob);
      ctx.fillText('💫', x, y - 22 + stunBob);
      ctx.restore();
    }

    // Label
    ctx.save();
    ctx.font = 'bold 9px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = isSWAT ? '#ff3333' : '#4488ff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const label = isSWAT ? 'S.W.A.T.' : 'COP';
    ctx.strokeText(label, x, y - 24);
    ctx.fillText(label, x, y - 24);
    ctx.restore();
  },

  // Draw the Black Market NPC — a hooded raccoon fence in a dark alley
  drawBlackMarket(ctx, x, y, now) {
    ctx.save();

    // Flickering neon sign glow (purple aura)
    const flicker = 0.7 + 0.3 * Math.sin(now * 0.005 + 1.2) * Math.sin(now * 0.0031);
    const glowSize = 28 + 6 * Math.sin(now * 0.004);
    const grd = ctx.createRadialGradient(x, y, 2, x, y, glowSize);
    grd.addColorStop(0, 'rgba(160, 0, 255, ' + (0.35 * flicker) + ')');
    grd.addColorStop(1, 'rgba(80, 0, 140, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Shadow on ground
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 14, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (dark hooded cloak)
    ctx.fillStyle = '#1a0028';
    ctx.strokeStyle = '#6600aa';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 13);
    ctx.lineTo(x - 11, y - 2);
    ctx.quadraticCurveTo(x - 8, y - 14, x, y - 16);
    ctx.quadraticCurveTo(x + 8, y - 14, x + 11, y - 2);
    ctx.lineTo(x + 9, y + 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hood shadow face (dark oval)
    ctx.fillStyle = '#0d0018';
    ctx.beginPath();
    ctx.ellipse(x, y - 8, 5.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Raccoon eyes (two glowing dots in the darkness)
    const eyeGlow = 0.6 + 0.4 * Math.abs(Math.sin(now * 0.002));
    ctx.fillStyle = 'rgba(200, 80, 255, ' + eyeGlow + ')';
    ctx.beginPath(); ctx.arc(x - 2.5, y - 8, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 2.5, y - 8, 1.4, 0, Math.PI * 2); ctx.fill();

    // Tiny coin bag held in cloak
    ctx.fillStyle = '#b8860b';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + 7, y + 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 5px serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', x + 7, y + 5);

    // Floating "BM" neon sign
    const signBob = Math.sin(now * 0.0025) * 2;
    ctx.font = 'bold 7px Courier New';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#220033';
    ctx.lineWidth = 3;
    ctx.strokeText('BLACK MKT', x, y - 22 + signBob);
    ctx.fillStyle = 'rgba(200, 100, 255, ' + (0.7 + 0.3 * flicker) + ')';
    ctx.fillText('BLACK MKT', x, y - 22 + signBob);

    ctx.restore();
  },
};
