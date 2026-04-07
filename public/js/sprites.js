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
  drawNameTag(ctx, x, y, name, level, type, isPlayer, mafiaTitle, gangTag, gangColor, tattoosEquipped, prestige, eagleFeather, idolBadge, royaleChampBadge, skillTreeMaster) {
    const text = `${name} [Lv.${level}]`;
    ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'center';

    let offsetY = 0; // stack badges upward

    // ✨ Skill Tree Master badge — the topmost badge of all (above prestige)
    if (skillTreeMaster) {
      ctx.font = '11px serif';
      const mStr = '✨ MASTER';
      const mw = ctx.measureText(mStr).width + 10;
      ctx.fillStyle = 'rgba(0,30,60,0.93)';
      ctx.fillRect(x - mw / 2, y - 52 - offsetY, mw, 14);
      ctx.strokeStyle = '#44eeff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - mw / 2, y - 52 - offsetY, mw, 14);
      ctx.shadowColor = '#00ddff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#88ffff';
      ctx.fillText(mStr, x, y - 41 - offsetY);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px Courier New';
      offsetY += 15;
    }

    // Prestige badge — very topmost (above gang tag)
    if (prestige && prestige > 0) {
      const badges = ['', '⚜️', '⚜️⚜️', '⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️⚜️'];
      const isLegend = prestige >= 5;
      const badgeStr = badges[Math.min(prestige, 5)];
      ctx.font = '11px serif';
      const pw = ctx.measureText(badgeStr).width + 10;
      const bgColor = isLegend ? 'rgba(100,70,0,0.90)' : 'rgba(30,20,0,0.88)';
      const borderColor = isLegend ? '#ffd700' : '#aa8833';
      ctx.fillStyle = bgColor;
      ctx.fillRect(x - pw / 2, y - 52 - offsetY, pw, 14);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isLegend ? 1.5 : 1;
      ctx.strokeRect(x - pw / 2, y - 52 - offsetY, pw, 14);
      if (isLegend) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 6;
      }
      ctx.fillStyle = isLegend ? '#ffd700' : '#ccaa44';
      ctx.fillText(badgeStr, x, y - 41 - offsetY);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px Courier New';
      offsetY += 15;
    }

    // Idol badge — 🎤 shown for session winner
    if (idolBadge) {
      ctx.font = '11px serif';
      const iw = ctx.measureText('🎤').width + 10;
      ctx.fillStyle = 'rgba(80,0,100,0.90)';
      ctx.fillRect(x - iw / 2, y - 52 - offsetY, iw, 14);
      ctx.strokeStyle = '#ff88ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - iw / 2, y - 52 - offsetY, iw, 14);
      ctx.shadowColor = '#ff44ff';
      ctx.shadowBlur = 7;
      ctx.fillStyle = '#ff88ff';
      ctx.fillText('🎤', x, y - 41 - offsetY);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px Courier New';
      offsetY += 14;
    }

    // 🏆 Royale Champion Badge — session-only trophy for winning Bird Royale
    if (royaleChampBadge) {
      ctx.font = '11px serif';
      const cw = ctx.measureText('🏆').width + 10;
      ctx.fillStyle = 'rgba(80,50,0,0.92)';
      ctx.fillRect(x - cw / 2, y - 52 - offsetY, cw, 14);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - cw / 2, y - 52 - offsetY, cw, 14);
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffd700';
      ctx.fillText('🏆', x, y - 41 - offsetY);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px Courier New';
      offsetY += 14;
    }

    // Eagle Feather badge — rare drop from Eagle Overlord
    if (eagleFeather) {
      ctx.font = '11px serif';
      const fw = ctx.measureText('🪶').width + 10;
      ctx.fillStyle = 'rgba(0,40,30,0.90)';
      ctx.fillRect(x - fw / 2, y - 52 - offsetY, fw, 14);
      ctx.strokeStyle = '#00e8a0';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - fw / 2, y - 52 - offsetY, fw, 14);
      ctx.shadowColor = '#00e8a0';
      ctx.shadowBlur = 5;
      ctx.fillStyle = '#00e8a0';
      ctx.fillText('🪶', x, y - 41 - offsetY);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px Courier New';
      offsetY += 14;
    }

    // Gang tag badge
    if (gangTag) {
      const gColor = gangColor || '#ff6633';
      ctx.font = 'bold 10px Courier New';
      const gtw = ctx.measureText(`[${gangTag}]`).width + 10;
      ctx.fillStyle = 'rgba(20,0,0,0.85)';
      ctx.fillRect(x - gtw / 2, y - 52 - offsetY, gtw, 13);
      ctx.strokeStyle = gColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - gtw / 2, y - 52 - offsetY, gtw, 13);
      ctx.fillStyle = gColor;
      ctx.shadowColor = gColor;
      ctx.shadowBlur = 4;
      ctx.fillText(`[${gangTag}]`, x, y - 42 - offsetY);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px Courier New';
      offsetY += 14;
    }

    // Mafia title badge
    if (mafiaTitle) {
      ctx.font = 'bold 10px Courier New';
      const tw = ctx.measureText(`🎩 ${mafiaTitle}`).width + 8;
      ctx.fillStyle = 'rgba(80, 50, 0, 0.85)';
      ctx.fillRect(x - tw / 2, y - 40 - offsetY, tw, 13);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`🎩 ${mafiaTitle}`, x, y - 30 - offsetY);
      ctx.font = 'bold 11px Courier New';
    }

    // Background — LEGEND gets golden glow
    const w = ctx.measureText(text).width + 8;
    const isLegend = prestige >= 5;
    if (isLegend && !isPlayer) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
    }
    ctx.fillStyle = isPlayer ? 'rgba(255, 200, 50, 0.7)' : (isLegend ? 'rgba(80,55,0,0.85)' : 'rgba(0, 0, 0, 0.6)');
    ctx.fillRect(x - w / 2, y - 25, w, 15);
    ctx.shadowBlur = 0;

    // Text
    ctx.fillStyle = isPlayer ? '#1a1a2e' : (isLegend ? '#ffd700' : '#fff');
    ctx.fillText(text, x, y - 14);

    // Tattoo strip — rendered below the name pill
    if (tattoosEquipped && tattoosEquipped.length > 0) {
      ctx.font = '11px serif';
      ctx.textAlign = 'center';
      const tatStr = tattoosEquipped.join(' ');
      const tw = ctx.measureText(tatStr).width + 6;
      ctx.fillStyle = isPlayer ? 'rgba(255,200,50,0.55)' : 'rgba(0,0,0,0.5)';
      ctx.fillRect(x - tw / 2, y - 12, tw, 12);
      ctx.fillStyle = isPlayer ? '#1a1a2e' : '#eee';
      ctx.fillText(tatStr, x, y - 3);
      ctx.font = 'bold 11px Courier New';
    }
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

  // === GOLDEN POOP — P5 LEGEND birds drop shimmering gold poop ===
  drawGoldenPoop(ctx, x, y, now) {
    const t = (now || 0) / 1000;
    const pulse = 0.7 + 0.3 * Math.sin(t * 8 + x * 0.5); // shimmer per-position

    // Gold glow halo
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8 * pulse;

    // Main body — rich amber/gold
    ctx.fillStyle = `rgba(${Math.floor(200 + 40 * pulse)}, ${Math.floor(140 + 30 * pulse)}, 0, 0.95)`;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Secondary lobe
    ctx.fillStyle = `rgba(230, 160, 10, 0.90)`;
    ctx.beginPath();
    ctx.arc(x - 2, y - 1, 3, 0, Math.PI * 2);
    ctx.fill();

    // Tertiary lobe
    ctx.fillStyle = `rgba(240, 180, 20, 0.85)`;
    ctx.beginPath();
    ctx.arc(x + 1, y + 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Bright gold highlight
    ctx.fillStyle = `rgba(255, 240, 100, ${0.5 + 0.4 * pulse})`;
    ctx.beginPath();
    ctx.arc(x - 1.5, y - 2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Tiny sparkle crosshair on top
    const sparkAlpha = 0.6 + 0.4 * Math.sin(t * 12 + y * 0.3);
    ctx.strokeStyle = `rgba(255, 255, 200, ${sparkAlpha})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y - 8); ctx.lineTo(x, y - 3);
    ctx.moveTo(x - 5, y - 5); ctx.lineTo(x - 2, y - 3);
    ctx.moveTo(x + 5, y - 5); ctx.lineTo(x + 2, y - 3);
    ctx.stroke();

    ctx.restore();
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
    } else if (type === 'pond_fish') {
      // Bioluminescent glowing fish — sacred pond night loot
      const t = Date.now();
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.006);
      // Outer glow aura
      ctx.fillStyle = `rgba(0, 255, 200, ${pulse * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Fish body (teal/cyan shimmer)
      const gb = Math.floor(180 + pulse * 75);
      const bb = Math.floor(150 + pulse * 105);
      ctx.fillStyle = `rgba(0, ${gb}, ${bb}, 0.92)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tail fin
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(-11, -3 - pulse);
      ctx.lineTo(-11, 3 + pulse);
      ctx.closePath();
      ctx.fill();
      // Glowing eye
      ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(4, -1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00ffc8';
      ctx.beginPath();
      ctx.arc(4, -1, 0.7, 0, Math.PI * 2);
      ctx.fill();
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
    } else if (type === 'water_puddle') {
      // Shimmering water puddle — heatwave relief
      const t = Date.now();
      const pulse = 0.55 + 0.45 * Math.sin(t * 0.004);
      const ripple = 0.4 + 0.6 * Math.sin(t * 0.003 + 1.0);
      // Outer glow halo
      ctx.fillStyle = `rgba(80, 160, 255, ${pulse * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Main puddle body — cornflower blue oval
      ctx.fillStyle = `rgba(70, 140, 240, ${0.65 + pulse * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Inner lighter reflection
      ctx.fillStyle = `rgba(160, 210, 255, ${0.35 + ripple * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(-1, -1, 7, 3.5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Bright specular highlight
      ctx.fillStyle = `rgba(220, 240, 255, ${0.5 + pulse * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(-3, -2, 3, 1.5, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Ripple ring
      const rr = 8 + ripple * 4;
      ctx.strokeStyle = `rgba(100, 180, 255, ${(1 - ripple) * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, rr, rr * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      // "💧" label above
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(50,120,200,0.85)';
      ctx.fillText('💧', 0, -10);
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
  drawFoodTruck(ctx, x, y, angle, heistProgress, heistActive, looted) {
    const now = Date.now();
    const alarmFlash = heistActive && Math.floor(now / 250) % 2 === 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Alarm glow behind truck when heist is active
    if (heistActive) {
      ctx.shadowColor = alarmFlash ? 'rgba(255,40,40,0.9)' : 'rgba(255,160,0,0.7)';
      ctx.shadowBlur = 18;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(2, 4, 28, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Truck body — dark red if looted, flashing if heist active, else orange
    if (looted) {
      ctx.fillStyle = '#cc4400';
    } else if (heistActive) {
      ctx.fillStyle = alarmFlash ? '#ff3300' : '#ff8800';
    } else {
      ctx.fillStyle = '#ff8800';
    }
    ctx.fillRect(-25, -13, 50, 26);

    // Cab
    ctx.fillStyle = looted ? '#993300' : '#cc6600';
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

    ctx.shadowBlur = 0;

    // Alarm light on roof when heist active
    if (heistActive) {
      ctx.fillStyle = alarmFlash ? '#ff0000' : '#ffaa00';
      ctx.beginPath();
      ctx.arc(0, -15, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Side label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (looted) {
      ctx.fillStyle = '#ffddaa';
      ctx.fillText('LOOTED', -3, 0);
    } else if (heistActive) {
      ctx.fillStyle = alarmFlash ? '#ffff00' : '#ffffff';
      ctx.fillText('🚨HEIST', -3, 0);
    } else {
      ctx.fillText('FOOD', -3, 0);
    }

    // Border
    ctx.strokeStyle = heistActive ? (alarmFlash ? '#ff0000' : '#ff8800') : '#aa5500';
    ctx.lineWidth = heistActive ? 2 : 1;
    ctx.strokeRect(-25, -13, 50, 26);

    ctx.restore();

    // Heist progress bar — drawn in world space (not rotated with truck)
    if (heistProgress > 0 && !looted) {
      const barW = 64;
      const barH = 7;
      const barX = x - barW / 2;
      const barY = y - 30;

      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      const r = Math.min(255, Math.floor(255 * heistProgress * 2));
      const g = Math.min(255, Math.floor(255 * (1 - heistProgress) * 2));
      ctx.fillStyle = `rgb(${r},${g},0)`;
      ctx.fillRect(barX, barY, barW * heistProgress, barH);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HEIST ' + Math.floor(heistProgress * 100) + '%', x, barY + barH / 2);
    }
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

  // Draw the Bounty Hunter — a grizzled detective bird in a trench coat and wide-brim hat
  drawBountyHunter(ctx, x, y, rotation, state, poopHits, now) {
    const isStunned = state === 'stunned';
    const isOffDuty = state === 'off_duty';

    ctx.save();
    ctx.translate(x, y);

    // Threat aura (dark red pulsing glow behind the hunter when pursuing)
    if (!isStunned && !isOffDuty) {
      const auraPulse = 0.4 + 0.2 * Math.sin(now * 0.004);
      const auraGrd = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
      auraGrd.addColorStop(0, `rgba(180, 20, 20, ${auraPulse})`);
      auraGrd.addColorStop(1, 'rgba(100, 0, 0, 0)');
      ctx.fillStyle = auraGrd;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.rotate(rotation);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(2, 6, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings — dark leathery trench coat look
    const wingFlap = Math.sin(now * 0.012) * 0.25;
    const wingColor = isOffDuty ? '#5a5a6a' : '#3a1a0a';
    // Left wing
    ctx.save();
    ctx.translate(-3, 0);
    ctx.rotate(-0.35 + wingFlap);
    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.ellipse(-7, 1, 10, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Right wing
    ctx.save();
    ctx.translate(-3, 0);
    ctx.rotate(0.35 - wingFlap);
    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.ellipse(-7, 1, 10, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body — dark brown with slight trench coat drape
    ctx.fillStyle = isOffDuty ? '#6a6a7a' : '#4a2010';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coat collar detail (darker stripe across chest)
    ctx.strokeStyle = isOffDuty ? '#4a4a5a' : '#2a0a00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 1, 5, -0.8, 0.8);
    ctx.stroke();

    // Head
    ctx.fillStyle = isOffDuty ? '#7a7a8a' : '#5a2a12';
    ctx.beginPath();
    ctx.arc(7, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Wide-brim detective hat
    const hatColor = isOffDuty ? '#333340' : '#1a0800';
    ctx.fillStyle = hatColor;
    // Hat crown
    ctx.beginPath();
    ctx.ellipse(7, -3, 5, 3.5, 0, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(3, -3.5, 8, 2);
    ctx.fill();
    // Hat brim (wide flat disc)
    ctx.fillStyle = isOffDuty ? '#2a2a38' : '#0d0400';
    ctx.beginPath();
    ctx.ellipse(7, -1.5, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hat band (dark red stripe)
    ctx.fillStyle = isOffDuty ? '#555560' : '#8b0000';
    ctx.fillRect(3.5, -3, 7, 1.2);

    // Eye — menacing red glow
    const eyeColor = isOffDuty ? '#aaa' : (isStunned ? '#555' : '#ff2200');
    if (!isStunned && !isOffDuty) {
      // Red glow around eye when hunting
      const eyeGrd = ctx.createRadialGradient(9.5, -0.5, 0, 9.5, -0.5, 5);
      eyeGrd.addColorStop(0, 'rgba(255, 50, 0, 0.6)');
      eyeGrd.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = eyeGrd;
      ctx.beginPath();
      ctx.arc(9.5, -0.5, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(9.5, -0.5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(9.5, -0.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Beak — sharp and angular
    ctx.fillStyle = '#c87020';
    ctx.beginPath();
    ctx.moveTo(11, -0.5);
    ctx.lineTo(16, 0.5);
    ctx.lineTo(11, 1.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // === Poop hit progress bar (shows how close to stunning him) ===
    if (poopHits > 0 && !isStunned && !isOffDuty) {
      const barW = 32;
      const barH = 4;
      const bx = x - barW / 2;
      const by = y - 22;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(bx - 1, by - 1, barW + 2, barH + 2, 2);
      ctx.fill();
      // Fill (orange → red based on progress)
      const progress = poopHits / 4;
      ctx.fillStyle = progress >= 0.75 ? '#ff4400' : '#ff8800';
      ctx.beginPath();
      ctx.roundRect(bx, by, barW * progress, barH, 2);
      ctx.fill();
    }

    // Stunned: 💫 effect
    if (isStunned) {
      ctx.save();
      ctx.font = 'bold 12px Courier New';
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
    ctx.fillStyle = isOffDuty ? '#888' : '#ff3300';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const bhLabel = isOffDuty ? 'OFF DUTY' : (isStunned ? 'STUNNED!' : '🔫 BOUNTY HUNTER');
    ctx.strokeText(bhLabel, x, y - 28);
    ctx.fillText(bhLabel, x, y - 28);
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

  // === DRUNK PIGEON (night-only, stumbling city bird full of coins) ===
  drawDrunkPigeon(ctx, x, y, rotation, wobblePhase, coins, now) {
    const wobble = Math.sin(wobblePhase + now * 0.002) * 0.28;   // sway angle
    const bob    = Math.sin(wobblePhase * 1.3 + now * 0.003) * 3; // vertical bob

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(rotation + wobble);

    const s = 13; // slightly chunkier than a normal pigeon

    // Shadow (bigger than normal — they're waddling)
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(2, 5, s * 0.85, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings (drooped, barely flapping — too drunk to fly properly)
    ctx.fillStyle = '#7a7a8a';
    ctx.save();
    ctx.translate(-s * 0.2, 0);
    ctx.rotate(0.15); // drooped
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.55, s * 0.58, s * 0.22, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(-s * 0.2, 0);
    ctx.rotate(-0.15); // drooped
    ctx.beginPath();
    ctx.ellipse(0, s * 0.55, s * 0.58, s * 0.22, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body (slightly bluish-grey — classic city pigeon look, but fatter)
    ctx.fillStyle = '#9090a8';
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly patch (lighter — they've been eating well)
    ctx.fillStyle = '#c8c8d8';
    ctx.beginPath();
    ctx.ellipse(-2, 0, s * 0.55, s * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#e8a020';
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(s + s * 0.55, -s * 0.14);
    ctx.lineTo(s + s * 0.55,  s * 0.14);
    ctx.closePath();
    ctx.fill();

    // Eyes — glassy half-closed (drunk squint)
    ctx.fillStyle = '#cc3344';  // bloodshot red
    ctx.beginPath();
    ctx.arc(s * 0.42, -s * 0.24, s * 0.13, 0, Math.PI * 2);
    ctx.arc(s * 0.42,  s * 0.24, s * 0.13, 0, Math.PI * 2);
    ctx.fill();
    // Half-lid
    ctx.fillStyle = '#7070a0';
    ctx.beginPath();
    ctx.ellipse(s * 0.42, -s * 0.24 - s * 0.04, s * 0.13, s * 0.08, 0, Math.PI, 0);
    ctx.ellipse(s * 0.42,  s * 0.24 - s * 0.04, s * 0.13, s * 0.08, 0, Math.PI, 0);
    ctx.fill();

    // Rosy red cheeks (very drunk)
    ctx.fillStyle = 'rgba(255, 80, 80, 0.35)';
    ctx.beginPath();
    ctx.arc(s * 0.3, -s * 0.38, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.3,  s * 0.38, s * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.fillStyle = '#7a7a8a';
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(-s * 1.45, -s * 0.32);
    ctx.lineTo(-s * 1.22, 0);
    ctx.lineTo(-s * 1.45,  s * 0.32);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // ── Orbiting stars (drawn in screen-space, no body-rotation) ──
    const numStars = 3;
    const orbitR  = 18;
    const orbitSpeed = now * 0.0022;
    for (let i = 0; i < numStars; i++) {
      const angle = orbitSpeed + (i / numStars) * Math.PI * 2;
      const sx2 = x + Math.cos(angle) * orbitR;
      const sy2 = y + bob - s - 6 + Math.sin(angle) * orbitR * 0.4;
      ctx.save();
      ctx.translate(sx2, sy2);
      ctx.rotate(angle * 2);
      ctx.fillStyle = '#ffe040';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 0);
      ctx.restore();
    }

    // ── Coin badge (how much loot they're carrying) ──
    if (coins > 0) {
      const labelY = y + bob - s - 18;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(x - 18, labelY - 7, 36, 14, 4);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 9px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍺 ' + coins + 'c', x, labelY);
    }
  },

  // ============================================================
  // EAGLE OVERLORD — massive aerial raid boss
  // ============================================================
  drawEagleOverlord(ctx, x, y, rotation, isCarrying, now) {
    const t = now || Date.now();
    const s = 30; // wingspan radius — drawn at this scale, then scaled 3× in main.js
    const wingFlap = Math.sin(t * 0.005) * 0.25;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // ── Massive wingspan (two layers for feather depth) ──
    // Outer wing layer
    ctx.fillStyle = '#5a3010';
    ctx.save();
    ctx.rotate(-wingFlap);
    ctx.beginPath();
    ctx.ellipse(-4, -s * 1.1, s * 1.6, s * 0.28, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.rotate(wingFlap);
    ctx.beginPath();
    ctx.ellipse(-4,  s * 1.1, s * 1.6, s * 0.28, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Inner wing layer (darker, golden edge)
    ctx.fillStyle = '#7a4820';
    ctx.save();
    ctx.rotate(-wingFlap);
    ctx.beginPath();
    ctx.ellipse(-4, -s * 0.8, s * 1.1, s * 0.22, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.rotate(wingFlap);
    ctx.beginPath();
    ctx.ellipse(-4,  s * 0.8, s * 1.1, s * 0.22, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Golden wing tip highlights
    ctx.fillStyle = '#c8820a';
    ctx.save();
    ctx.rotate(-wingFlap);
    ctx.beginPath();
    ctx.ellipse(-10, -s * 1.35, s * 0.6, s * 0.10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.rotate(wingFlap);
    ctx.beginPath();
    ctx.ellipse(-10,  s * 1.35, s * 0.6, s * 0.10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── Body ──
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.85, s * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // White chest patch
    ctx.fillStyle = '#e8dfc0';
    ctx.beginPath();
    ctx.ellipse(s * 0.2, 0, s * 0.35, s * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail feathers
    ctx.fillStyle = '#6a3510';
    ctx.beginPath();
    ctx.moveTo(-s * 0.85, 0);
    ctx.lineTo(-s * 1.4, -s * 0.35);
    ctx.lineTo(-s * 1.1,  0);
    ctx.lineTo(-s * 1.4,  s * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c8820a';
    ctx.beginPath();
    ctx.moveTo(-s * 0.95, 0);
    ctx.lineTo(-s * 1.3, -s * 0.18);
    ctx.lineTo(-s * 1.15, 0);
    ctx.lineTo(-s * 1.3,  s * 0.18);
    ctx.closePath();
    ctx.fill();

    // ── Head ──
    ctx.fillStyle = '#4a2208';
    ctx.beginPath();
    ctx.arc(s * 0.65, 0, s * 0.40, 0, Math.PI * 2);
    ctx.fill();

    // Fierce hooked beak
    ctx.fillStyle = '#daa520';
    ctx.beginPath();
    ctx.moveTo(s * 0.95, -s * 0.08);
    ctx.lineTo(s * 1.35, -s * 0.14);
    ctx.lineTo(s * 1.30,  s * 0.08);
    ctx.lineTo(s * 0.95,  s * 0.10);
    ctx.closePath();
    ctx.fill();
    // Beak hook tip
    ctx.fillStyle = '#b8880a';
    ctx.beginPath();
    ctx.moveTo(s * 1.25, -s * 0.06);
    ctx.lineTo(s * 1.35, -s * 0.14);
    ctx.lineTo(s * 1.32,  s * 0.04);
    ctx.closePath();
    ctx.fill();

    // Glowing orange eyes (menacing!)
    const eyePulse = 0.85 + 0.15 * Math.sin(t * 0.006);
    ctx.fillStyle = `rgba(255, 140, 0, ${eyePulse})`;
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(s * 0.72, -s * 0.17, s * 0.11, 0, Math.PI * 2);
    ctx.arc(s * 0.72,  s * 0.17, s * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a0800';
    ctx.beginPath();
    ctx.arc(s * 0.72, -s * 0.17, s * 0.055, 0, Math.PI * 2);
    ctx.arc(s * 0.72,  s * 0.17, s * 0.055, 0, Math.PI * 2);
    ctx.fill();

    // ── Talons (drawn below body) ──
    ctx.strokeStyle = '#2a1800';
    ctx.lineWidth = 2.5;
    // Left talon
    ctx.beginPath();
    ctx.moveTo(s * 0.1, -s * 0.38);
    ctx.lineTo(s * 0.1, -s * 0.55);
    ctx.moveTo(s * 0.1, -s * 0.55);
    ctx.lineTo(s * 0.0, -s * 0.68);
    ctx.moveTo(s * 0.1, -s * 0.55);
    ctx.lineTo(s * 0.18, -s * 0.67);
    ctx.stroke();
    // Right talon
    ctx.beginPath();
    ctx.moveTo(s * 0.1,  s * 0.38);
    ctx.lineTo(s * 0.1,  s * 0.55);
    ctx.moveTo(s * 0.1,  s * 0.55);
    ctx.lineTo(s * 0.0,  s * 0.68);
    ctx.moveTo(s * 0.1,  s * 0.55);
    ctx.lineTo(s * 0.18, s * 0.67);
    ctx.stroke();

    // ── Snatched bird indicator ──
    if (isCarrying) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('😱', s * 0.1, -s * 0.62);
    }

    ctx.restore();
  },

  // ─────────────────────────────────────────────────────────────
  // THE GODFATHER RACCOON — night crime boss (2× scale)
  // ─────────────────────────────────────────────────────────────
  drawGodfatherRaccoon(ctx, x, y, rotation, hp, maxHp, tributeCoins, now) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const s = 2.2; // scale factor
    ctx.scale(s, s);

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(2, 6, 17, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Purple menace glow aura
    const glow = Math.sin(now * 0.003) * 0.25 + 0.75;
    ctx.save();
    ctx.globalAlpha = 0.18 * glow;
    ctx.fillStyle = '#aa44ff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bushy striped tail (behind body)
    const tailWag = Math.sin(now * 0.004) * 0.3;
    ctx.save();
    ctx.translate(-12, 0);
    ctx.rotate(Math.PI + tailWag);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#777' : '#222';
      ctx.beginPath();
      ctx.ellipse(i * 5.5, 0, 5.5 - i * 0.4, 3.5 - i * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Pinstripe coat body (dark charcoal)
    ctx.fillStyle = '#2a2a35';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pinstripes (white lines)
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    for (let px = -10; px <= 10; px += 3.5) {
      ctx.beginPath();
      ctx.moveTo(px, -8.5);
      ctx.lineTo(px, 8.5);
      ctx.stroke();
    }
    ctx.restore();

    // White shirt front / chest
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.ellipse(-1, 0, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark red tie
    ctx.fillStyle = '#880000';
    ctx.beginPath();
    ctx.moveTo(-1, -4);
    ctx.lineTo(-2.5, 2);
    ctx.lineTo(-1, 4.5);
    ctx.lineTo(0.5, 2);
    ctx.closePath();
    ctx.fill();

    // Bandit mask (classic raccoon marking)
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(5.5, -2.5, 5, 3, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5.5, 2.5, 5, 3, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.ellipse(10, 0, 4.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(13.5, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(3, -8.5); ctx.lineTo(6.5, -13); ctx.lineTo(9, -8.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(3, 8.5); ctx.lineTo(6.5, 13); ctx.lineTo(9, 8.5);
    ctx.fill();

    // Menacing gold eyes with glow
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(7.5, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7.5, 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(8.2, -3, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8.2, 3, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Cigar (brown cylinder with ash glow)
    ctx.fillStyle = '#7a4a20';
    ctx.beginPath();
    ctx.roundRect(11, -1, 10, 2, 1);
    ctx.fill();
    ctx.fillStyle = '#cc5500';
    ctx.beginPath();
    ctx.arc(21, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Smoke puff
    const smokePhase = (now * 0.001) % 1;
    ctx.globalAlpha = 0.3 * (1 - smokePhase);
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.arc(21 + smokePhase * 6, -4 - smokePhase * 5, 1.5 + smokePhase * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Fedora hat (dark with cream band)
    // Brim
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(4, -11, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Crown
    ctx.beginPath();
    ctx.roundRect(-2, -19, 13, 9, 2);
    ctx.fill();
    // Hat band (cream)
    ctx.fillStyle = '#f0e080';
    ctx.fillRect(-1, -12.5, 12, 2);
    // Indent at crown top
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(4.5, -19, 4, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // undo scale

    // ── HP bar (drawn outside scale) ──
    const barW = 80;
    const barH = 8;
    const barX = x - barW / 2;
    const barY = y - 60;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 3);
    ctx.fill();
    const hpFrac = Math.max(0, hp / maxHp);
    ctx.fillStyle = hpFrac > 0.5 ? '#22cc44' : hpFrac > 0.25 ? '#ffaa00' : '#ff2222';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * hpFrac, barH, 2);
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 2);
    ctx.stroke();

    // Label above HP bar
    ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcc00';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('🎩 GODFATHER', x, barY - 4);
    ctx.fillText('🎩 GODFATHER', x, barY - 4);

    // Tribute coins label (below sprite)
    const tributeLabel = '💰 ' + tributeCoins + 'c collected';
    ctx.font = 'bold 9px Courier New';
    ctx.fillStyle = '#ffcc00';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(tributeLabel, x, y + 52);
    ctx.fillText(tributeLabel, x, y + 52);
  },

  // ============================================================
  // BANK HEIST SPRITES
  // ============================================================

  // Security camera — wall-mounted, red eye blinks when active
  drawSecurityCamera(ctx, x, y, disabled, progress, now) {
    ctx.save();
    // Mount bracket
    ctx.fillStyle = disabled ? '#336633' : '#553300';
    ctx.fillRect(x - 6, y - 5, 12, 5);

    // Camera body
    ctx.fillStyle = disabled ? '#44aa44' : '#222222';
    ctx.beginPath();
    ctx.roundRect(x - 10, y, 20, 10, 3);
    ctx.fill();
    ctx.strokeStyle = disabled ? '#66ff66' : '#888888';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lens
    ctx.beginPath();
    ctx.arc(x + 7, y + 5, 4, 0, Math.PI * 2);
    ctx.fillStyle = disabled ? '#004400' : '#000033';
    ctx.fill();
    if (!disabled) {
      // Blinking red LED
      const blinkAlpha = 0.5 + 0.5 * Math.sin(now / 300);
      ctx.beginPath();
      ctx.arc(x - 5, y + 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,40,0,${blinkAlpha})`;
      ctx.fill();
    } else {
      // Green LED (disabled/blind)
      ctx.beginPath();
      ctx.arc(x - 5, y + 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff44';
      ctx.fill();
    }

    // Disable progress bar (shown while being hacked)
    if (!disabled && progress > 0) {
      const barW = 30, barH = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(x - barW / 2, y - 16, barW, barH);
      ctx.fillStyle = '#44ffaa';
      ctx.fillRect(x - barW / 2, y - 16, barW * progress, barH);
    }

    // Label
    ctx.font = '8px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = disabled ? '#44ff88' : '#ffaa00';
    ctx.fillText(disabled ? '✓ BLIND' : '📷 CAM', x, y + 20);

    ctx.restore();
  },

  // Getaway van — sleek dark van with "CLEANERS" livery, engine running
  drawGetawayVan(ctx, x, y, now) {
    ctx.save();

    // Pulsing shadow underneath
    const shadowA = 0.3 + 0.15 * Math.sin(now / 200);
    ctx.beginPath();
    ctx.ellipse(x, y + 16, 38, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${shadowA})`;
    ctx.fill();

    // Van body
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(x - 30, y - 14, 60, 28, 5);
    ctx.fill();
    ctx.strokeStyle = '#ffdd00';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Windshield (front-left)
    ctx.fillStyle = 'rgba(100,180,255,0.4)';
    ctx.fillRect(x - 28, y - 10, 14, 12);

    // Side window
    ctx.fillRect(x - 8, y - 10, 16, 10);

    // Wheel arches
    ctx.fillStyle = '#0a0a1a';
    ctx.beginPath();
    ctx.arc(x - 16, y + 14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 16, y + 14, 7, 0, Math.PI * 2);
    ctx.fill();

    // Wheels (spinning)
    const spin = now / 80;
    for (const wx of [x - 16, x + 16]) {
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(wx, y + 14, 6, 0, Math.PI * 2);
      ctx.fill();
      // Rim spoke
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(spin) * 5, y + 14 + Math.sin(spin) * 5);
      ctx.lineTo(wx - Math.cos(spin) * 5, y + 14 - Math.sin(spin) * 5);
      ctx.stroke();
    }

    // "CLEANERS" text on side
    ctx.font = 'bold 6px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffdd00';
    ctx.fillText('CLEANERS', x, y + 4);

    // Exhaust smoke puffs (rear)
    for (let i = 0; i < 3; i++) {
      const age = ((now / 300) + i * 0.33) % 1;
      const puffA = (1 - age) * 0.4;
      const puffR = 3 + age * 8;
      ctx.beginPath();
      ctx.arc(x + 30 + age * 12, y + 10 - age * 6, puffR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,200,200,${puffA})`;
      ctx.fill();
    }

    // "GET IN!" flashing text above
    const flashA = 0.6 + 0.4 * Math.abs(Math.sin(now / 300));
    ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('🚐 GET IN!', x, y - 22);
    ctx.fillStyle = `rgba(255,220,0,${flashA})`;
    ctx.fillText('🚐 GET IN!', x, y - 22);

    ctx.restore();
  },

  // === MANHOLE COVER (iron grate, on road surface) ===
  drawManholeCover(ctx, x, y, glowing) {
    ctx.save();
    ctx.translate(x, y);
    const r = 13;

    // Outer iron ring
    ctx.fillStyle = glowing ? '#88ffcc' : '#4a4a4a';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner grate (slightly inset)
    ctx.fillStyle = glowing ? '#55ddaa' : '#333';
    ctx.beginPath();
    ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
    ctx.fill();

    // Grate cross pattern
    ctx.strokeStyle = glowing ? '#88ffcc' : '#555';
    ctx.lineWidth = 1.5;
    // Horizontal bars
    for (let gy = -8; gy <= 8; gy += 4) {
      const halfW = Math.sqrt(Math.max(0, (r - 4) * (r - 4) - gy * gy));
      ctx.beginPath();
      ctx.moveTo(-halfW, gy);
      ctx.lineTo(halfW, gy);
      ctx.stroke();
    }
    // Vertical bars
    for (let gx = -8; gx <= 8; gx += 4) {
      const halfH = Math.sqrt(Math.max(0, (r - 4) * (r - 4) - gx * gx));
      ctx.beginPath();
      ctx.moveTo(gx, -halfH);
      ctx.lineTo(gx, halfH);
      ctx.stroke();
    }

    // Outer rim highlight
    ctx.strokeStyle = glowing ? '#aaffdd' : '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Glow effect when player is nearby
    if (glowing) {
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#44ffaa';
      ctx.strokeStyle = 'rgba(68,255,170,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  },

  // === SEWER RAT (small, grey, beady eyes, long tail) ===
  drawSewerRat(ctx, x, y, rotation, state, now) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const chasing = state === 'chasing';

    // Body
    ctx.fillStyle = chasing ? '#8b3a3a' : '#5a5040';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = chasing ? '#7a2a2a' : '#4a4030';
    ctx.beginPath();
    ctx.ellipse(12, 0, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = chasing ? '#aa4444' : '#6a5a40';
    ctx.beginPath();
    ctx.ellipse(18, 0, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#cc8888';
    ctx.beginPath();
    ctx.ellipse(9, -7, 3, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(14, -6, 2.5, 3.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Beady eyes (glowing red when chasing)
    ctx.fillStyle = chasing ? '#ff2222' : '#cc0000';
    ctx.beginPath();
    ctx.arc(14, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = chasing ? '#ff8888' : '#ff4444';
    ctx.beginPath();
    ctx.arc(14.5, -2.5, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Tail (curved behind body)
    ctx.strokeStyle = '#3a3028';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.bezierCurveTo(-18, 8, -22, 0, -20, -8);
    ctx.stroke();

    // Front legs (scurrying motion)
    const legPhase = now * 0.008;
    ctx.strokeStyle = '#4a4030';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(6, 5);
    ctx.lineTo(6 + Math.sin(legPhase) * 5, 11);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(0 - Math.sin(legPhase) * 5, 11);
    ctx.stroke();

    // Glow aura when chasing
    if (chasing) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff4444';
      ctx.fillStyle = 'rgba(255,60,60,0.15)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  },

  // === SEWER TREASURE CACHE (pile of glowing coins) ===
  drawSewerTreasure(ctx, x, y, value, now) {
    ctx.save();
    ctx.translate(x, y);

    const pulse = 0.85 + 0.15 * Math.sin(now * 0.003 + x * 0.01);

    // Glow
    ctx.globalAlpha = 0.4 * pulse;
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
    grad.addColorStop(0, '#ffe040');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Coin pile (3 stacked coins)
    const coinPositions = [[-6, 4], [0, 0], [6, 4]];
    for (const [cx, cy] of coinPositions) {
      ctx.fillStyle = '#cc8800';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(cx - 1, cy - 1, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe566';
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Value label
    ctx.font = 'bold 9px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe040';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(value + 'c', 0, -14);
    ctx.fillText(value + 'c', 0, -14);

    ctx.restore();
  },

  // Golden egg — shimmering prize for the egg scramble event
  drawGoldenEgg(ctx, x, y, size, t) {
    const s = size || 12;
    const pulse = 0.88 + 0.12 * Math.sin(t * 3.2);
    const w = s * pulse;
    const h = w * 1.38;

    ctx.save();
    ctx.translate(x, y);

    // Outer glow halo
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 2.4);
    glowGrad.addColorStop(0, 'rgba(255, 230, 60, 0.45)');
    glowGrad.addColorStop(0.5, 'rgba(255, 180, 0, 0.18)');
    glowGrad.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 2.4, h * 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Egg body
    const bodyGrad = ctx.createRadialGradient(-w * 0.28, -h * 0.25, 0, 0, 0, h);
    bodyGrad.addColorStop(0, '#fff8b0');
    bodyGrad.addColorStop(0.35, '#ffd700');
    bodyGrad.addColorStop(0.75, '#cc8800');
    bodyGrad.addColorStop(1, '#9a5c00');
    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 200, 0, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Highlight
    ctx.beginPath();
    ctx.ellipse(-w * 0.26, -h * 0.28, w * 0.28, h * 0.18, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 200, 0.72)';
    ctx.fill();

    // Rotating sparkle star
    const sparkAngle = t * 4;
    ctx.fillStyle = 'rgba(255, 255, 130, 0.85)';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a1 = sparkAngle + i * (Math.PI / 2);
      const a2 = sparkAngle + i * (Math.PI / 2) + Math.PI / 4;
      ctx.lineTo(Math.cos(a1) * w * 0.52, Math.sin(a1) * w * 0.52);
      ctx.lineTo(Math.cos(a2) * w * 0.18, Math.sin(a2) * w * 0.18);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  },

  // ============================================================
  // THE PIGEON MAFIA DON — distinguished crime boss pigeon
  // ============================================================
  drawDon(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    const scale = 2.0;
    ctx.scale(scale, scale);

    // Purple crime-boss aura (pulsing glow behind body)
    const auraAlpha = 0.18 + Math.sin(t * 1.4) * 0.08;
    const auraGrad = ctx.createRadialGradient(0, 2, 0, 0, 2, 28);
    auraGrad.addColorStop(0, `rgba(160, 60, 220, ${auraAlpha})`);
    auraGrad.addColorStop(1, 'rgba(160, 60, 220, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2, 28, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body — plump pigeon in a dark suit with white shirt front
    ctx.fillStyle = '#1a1a2e'; // deep navy suit
    ctx.beginPath();
    ctx.ellipse(0, 4, 10, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // White shirt front
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.ellipse(0, 5, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark red tie
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.moveTo(-1.5, 1);
    ctx.lineTo(1.5, 1);
    ctx.lineTo(0.8, 11);
    ctx.lineTo(0, 13);
    ctx.lineTo(-0.8, 11);
    ctx.closePath();
    ctx.fill();

    // Gold chain
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 3, 5, -0.8, Math.PI + 0.8);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(0, -8, 7, 0, Math.PI * 2);
    ctx.fill();

    // Fedora brim
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(0, -13.5, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fedora crown
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(0, -17, 7.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fedora hat band — cream
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.rect(-7.5, -15.5, 15, 2.5);
    ctx.fill();

    // Eyes — golden glowing
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(-2.5, -8.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.5, -8.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pupil
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-2.5, -8.5, 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.5, -8.5, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#c4a000';
    ctx.beginPath();
    ctx.moveTo(-1.5, -5.5);
    ctx.lineTo(1.5, -5.5);
    ctx.lineTo(0, -3);
    ctx.closePath();
    ctx.fill();

    // Cane — right side
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(11, -5);
    ctx.lineTo(11, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(9, -5, 2, 0, Math.PI * 0.8, true);
    ctx.stroke();

    // Cigar — left beak, with animated smoke
    ctx.fillStyle = '#c68642';
    ctx.fillRect(-7, -6.5, 6, 1.5);
    // Cigar lit end (red-orange)
    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.arc(-7, -5.7, 1.2, 0, Math.PI * 2);
    ctx.fill();
    // Smoke puff (animated wisp)
    const smokeAlpha = 0.25 + Math.sin(t * 3 + 1) * 0.1;
    ctx.fillStyle = `rgba(200,200,200,${smokeAlpha})`;
    ctx.beginPath();
    ctx.arc(-9 + Math.sin(t * 2) * 1.5, -9 - (t * 3 % 5), 2 + Math.sin(t * 4) * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  /**
   * Draw a gang nest structure at (x, y) in world space (after camera transform).
   * gangColor: the gang's color, gangTag: 3-letter tag, hp/maxHp for damage bar.
   * isMyNest: true to show a warm aura glow.
   */
  drawGangNest(ctx, x, y, gangColor, gangTag, hp, maxHp, isMyNest, now) {
    const t = now / 1000;
    ctx.save();
    ctx.translate(x, y);

    // Aura glow behind nest (warm for own, neutral for others)
    const auraAlpha = 0.15 + 0.1 * Math.sin(t * 2);
    ctx.globalAlpha = auraAlpha;
    const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 36);
    auraGrad.addColorStop(0, gangColor);
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Ground shadow
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 14, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Twig bundle — layered curved sticks
    const twigColor = '#6b3a1e';
    const twigDark = '#3d1f0a';
    // Bottom twig layer
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const tx1 = Math.cos(angle) * 20;
      const ty1 = Math.sin(angle) * 10 + 6;
      const tx2 = Math.cos(angle + 0.4) * 14;
      const ty2 = Math.sin(angle + 0.4) * 7 + 4;
      ctx.strokeStyle = i % 2 === 0 ? twigColor : twigDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx1, ty1);
      ctx.quadraticCurveTo(tx1 * 0.4, ty1 * 0.4, tx2, ty2);
      ctx.stroke();
    }
    // Inner twig rim (the nest bowl)
    ctx.strokeStyle = twigDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 4, 14, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Nest bowl interior (dark mossy center)
    const bowlGrad = ctx.createRadialGradient(0, 4, 2, 0, 4, 13);
    bowlGrad.addColorStop(0, '#1a2a0a');
    bowlGrad.addColorStop(1, '#2d1806');
    ctx.fillStyle = bowlGrad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 13, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eggs inside the nest (2 eggs, cream-white with tinted shell)
    const eggPositions = [[-4, 4], [4, 3]];
    for (const [ex, ey] of eggPositions) {
      // Egg shadow
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(ex + 1, ey + 2.5, 4, 2.5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Egg body
      ctx.fillStyle = '#f0e8d0';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 4.5, 5.5, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Egg highlight
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(ex - 1.5, ey - 2, 1.5, 1, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Flag pole (right side of nest)
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, 8);
    ctx.lineTo(12, -22);
    ctx.stroke();

    // Flag (triangular, gang color)
    const flagWave = Math.sin(t * 3) * 2;
    ctx.fillStyle = gangColor;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(12, -22);
    ctx.lineTo(12 + 14 + flagWave, -18 + flagWave * 0.5);
    ctx.lineTo(12, -14);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    // Flag outline
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Gang tag on flag
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gangTag, 18 + flagWave * 0.3, -18);

    // HP bar (only when damaged)
    if (hp < maxHp) {
      const barW = 34;
      const barX = -barW / 2;
      const barY = -30;
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, 5);
      // HP fill (green to red)
      const pct = hp / maxHp;
      const barColor = pct > 0.5 ? '#44cc44' : pct > 0.25 ? '#ffaa00' : '#ff3333';
      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, Math.ceil(barW * pct), 3);
      // HP label
      ctx.fillStyle = '#fff';
      ctx.font = '5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${hp}/${maxHp}`, 0, barY - 5);
    }

    // "YOUR NEST" indicator for own gang's nest
    if (isMyNest) {
      const pulse = 0.7 + 0.3 * Math.sin(t * 2.5);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = gangColor;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🏠 HOME', 0, -34);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  },

  // === OWL ENFORCER — night guardian of the Sacred Pond ===
  drawOwlEnforcer(ctx, x, y, rotation, state, now) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const isAlert = state === 'chasing';
    const eyeColor = isAlert ? '#ff6600' : '#ffd700';
    const auraColor = isAlert ? 'rgba(255, 80, 0, 0.2)' : 'rgba(0, 255, 200, 0.15)';
    const auraPulse = 0.7 + 0.3 * Math.sin(now * (isAlert ? 0.01 : 0.003));

    // Aura glow behind owl
    ctx.fillStyle = auraColor;
    ctx.globalAlpha = auraPulse;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(2, 4, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings (spread out flat — top-down view)
    ctx.fillStyle = '#7a4f18';
    ctx.beginPath();
    ctx.ellipse(-13, 2, 9, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(13, 2, 9, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Wing stripes
    ctx.fillStyle = '#c8a050';
    ctx.beginPath();
    ctx.ellipse(-12, 2, 6, 2.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, 2, 6, 2.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Body (rounded, tan/brown)
    ctx.fillStyle = '#c8a050';
    ctx.beginPath();
    ctx.ellipse(0, 2, 8, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body pattern stripes
    ctx.fillStyle = 'rgba(100, 60, 10, 0.4)';
    for (let i = -6; i <= 6; i += 3) {
      ctx.beginPath();
      ctx.ellipse(0, i, 7, 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Round head
    ctx.fillStyle = '#d4a860';
    ctx.beginPath();
    ctx.arc(0, -10, 9, 0, Math.PI * 2);
    ctx.fill();
    // Facial disc (pale ring around face)
    ctx.fillStyle = 'rgba(255,245,220,0.55)';
    ctx.beginPath();
    ctx.arc(0, -10, 7, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (glowing — the signature feature)
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = isAlert ? 10 : 5;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(-3.5, -10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3.5, -10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Pupils
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-3.5, -10, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3.5, -10, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#d07c20';
    ctx.beginPath();
    ctx.moveTo(0, -7.5);
    ctx.lineTo(-1.8, -5.5);
    ctx.lineTo(1.8, -5.5);
    ctx.closePath();
    ctx.fill();

    // Ear tufts
    ctx.fillStyle = '#7a4f18';
    ctx.beginPath();
    ctx.moveTo(-4, -18); ctx.lineTo(-2, -14); ctx.lineTo(-6, -14); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, -18);  ctx.lineTo(2, -14);  ctx.lineTo(6, -14);  ctx.closePath(); ctx.fill();

    // Label
    ctx.fillStyle = isAlert ? '#ff8800' : '#00ffc8';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.fillText(isAlert ? '🦉 ALERT!' : '🦉 ENFORCER', 0, -24);
    ctx.shadowBlur = 0;

    ctx.restore();
  },

  // Mystery Crate Airdrop — glowing golden chest with spinning "?" and parachute
  drawMysteryCrate(ctx, x, y, now) {
    ctx.save();
    ctx.translate(x, y);

    const pulse = 0.5 + 0.5 * Math.sin(now * 0.004);
    const spin = (now * 0.002) % (Math.PI * 2);

    // Outer glow halo
    const grd = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
    grd.addColorStop(0, `rgba(255,220,0,${0.45 + 0.25 * pulse})`);
    grd.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    // Parachute (simple arc above crate)
    const chuteSway = Math.sin(now * 0.0015) * 3;
    ctx.strokeStyle = '#ccaa44';
    ctx.lineWidth = 1.2;
    // Chute canopy
    ctx.fillStyle = `rgba(255,220,80,0.75)`;
    ctx.beginPath();
    ctx.arc(chuteSway, -22, 12, Math.PI, 0, false);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(chuteSway, -22, 12, Math.PI, 0, false);
    ctx.stroke();
    // Chute strings (3 lines from canopy edge to crate top)
    ctx.strokeStyle = 'rgba(220,200,80,0.6)';
    ctx.lineWidth = 0.7;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(chuteSway + i * 11, -22);
      ctx.lineTo(i * 5, -8);
      ctx.stroke();
    }

    // Crate body
    ctx.fillStyle = '#c08020';
    ctx.strokeStyle = '#ffd040';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-11, -8, 22, 16, 3);
    ctx.fill();
    ctx.stroke();

    // Crate lid (slightly lighter)
    ctx.fillStyle = '#e0a030';
    ctx.beginPath();
    ctx.roundRect(-11, -10, 22, 5, [3, 3, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#ffd040';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Metal bands (horizontal)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-11, -3); ctx.lineTo(11, -3);
    ctx.stroke();

    // Metal bands (vertical center)
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(0, 8);
    ctx.stroke();

    // Spinning "?" in center
    ctx.save();
    ctx.rotate(spin);
    ctx.fillStyle = `rgba(255,255,100,${0.9 + 0.1 * pulse})`;
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 6;
    ctx.fillText('?', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Corner bolts
    ctx.fillStyle = '#ffd700';
    const bolts = [[-9, -8], [9, -8], [-9, 7], [9, 7]];
    for (const [bx, by] of bolts) {
      ctx.beginPath();
      ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  // === BIRD FLU MEDICINE ITEM ===
  // A glowing green/white capsule pill with a pulsing halo — spawns during flu outbreaks.
  drawMedicineItem(ctx, x, y, now) {
    const t = now * 0.001;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.5);
    const float = Math.sin(t * 2.2) * 2.5;

    ctx.save();
    ctx.translate(x, y + float);

    // Outer glow halo
    const haloAlpha = 0.25 + 0.25 * pulse;
    const grd = ctx.createRadialGradient(0, 0, 3, 0, 0, 18);
    grd.addColorStop(0, `rgba(0,255,100,${haloAlpha * 2})`);
    grd.addColorStop(1, 'rgba(0,220,80,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Pill capsule body (tilted at 30 degrees)
    ctx.rotate(Math.PI / 6);

    // Left half (white)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-3.5, 0, 4, 7, 0, Math.PI / 2, Math.PI * 3 / 2);
    ctx.rect(-3.5, -7, 3.5, 14);
    ctx.fillStyle = '#e8ffe8';
    ctx.fill();
    ctx.restore();

    // Right half (green)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(3.5, 0, 4, 7, 0, -Math.PI / 2, Math.PI / 2);
    ctx.rect(0, -7, 3.5, 14);
    ctx.fillStyle = `rgba(30,${180 + Math.floor(50 * pulse)},60,1)`;
    ctx.fill();
    ctx.restore();

    // Pill outline
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,180,60,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center dividing line
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 7);
    ctx.strokeStyle = 'rgba(0,140,40,0.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Highlight shine
    ctx.fillStyle = 'rgba(220,255,220,0.5)';
    ctx.beginPath();
    ctx.ellipse(-1.5, -2, 1.5, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // undo rotate

    // "💊" label above
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(80,220,100,${0.75 + 0.25 * pulse})`;
    ctx.fillText('💊', 0, -16);

    ctx.restore();
  },

  // ============================================================
  // CROW CARTEL — thug and Don Corvino sprites
  // ============================================================

  // A sleek gang crow in black with red eyes, gold chain, aggressive lean
  drawCrowThug(ctx, x, y, rotation, hp, maxHp, now) {
    ctx.save();
    ctx.translate(x, y);

    // HP bar (only when damaged)
    if (hp < maxHp) {
      const barW = 38;
      const pct = Math.max(0, hp / maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-barW / 2, -30, barW, 5);
      ctx.fillStyle = pct > 0.5 ? '#55ff55' : pct > 0.25 ? '#ffcc00' : '#ff3333';
      ctx.fillRect(-barW / 2, -30, barW * pct, 5);
    }

    ctx.rotate(rotation);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(2, 5, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body — jet black crow, slightly larger than a regular pigeon
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings — dark charcoal
    ctx.fillStyle = '#1e1e1e';
    // left wing
    ctx.save();
    ctx.translate(-3, 0);
    ctx.beginPath();
    ctx.ellipse(0, -13, 8, 3.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // right wing
    ctx.save();
    ctx.translate(-3, 0);
    ctx.beginPath();
    ctx.ellipse(0, 13, 8, 3.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Beak — dark hooked beak
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(21, -2.5);
    ctx.lineTo(21, 2.5);
    ctx.closePath();
    ctx.fill();

    // Red glowing eyes
    const eyeGlow = 0.7 + 0.3 * Math.sin(now / 300);
    ctx.fillStyle = `rgba(255,40,40,${eyeGlow})`;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(8, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Gold chain across chest — short horizontal arc
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(2, 0, 7, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    ctx.restore();

    // Label
    ctx.save();
    ctx.translate(x, y);
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#ff3333';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.fillText('🐦‍⬛ CARTEL', 0, -31);
    ctx.restore();
  },

  // Don Corvino — the Cartel boss. Bigger crow in a white collar + black suit with red tie, monocle, silver ring
  drawDonCorvino(ctx, x, y, rotation, hp, maxHp, now) {
    ctx.save();
    ctx.translate(x, y);

    // Purple menace aura
    const auraPulse = 0.5 + 0.5 * Math.sin(now / 400);
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 36);
    aura.addColorStop(0, `rgba(120,0,180,${0.35 * auraPulse})`);
    aura.addColorStop(1, 'rgba(120,0,180,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // HP bar
    if (hp < maxHp) {
      const barW = 60;
      const pct = Math.max(0, hp / maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-barW / 2, -48, barW, 7);
      ctx.fillStyle = pct > 0.5 ? '#55ff55' : pct > 0.25 ? '#ffcc00' : '#ff2222';
      ctx.fillRect(-barW / 2, -48, barW * pct, 7);
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(`DON ${Math.ceil(hp)}/${maxHp}`, 0, -43);
    }

    ctx.rotate(rotation);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(3, 7, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body — large black crow at ~1.8× scale
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = '#181818';
    ctx.save();
    ctx.translate(-4, 0);
    ctx.beginPath();
    ctx.ellipse(0, -18, 12, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(-4, 0);
    ctx.beginPath();
    ctx.ellipse(0, 18, 12, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // White collar shirt front
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.ellipse(4, 0, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark red tie
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.moveTo(5, -3);
    ctx.lineTo(7, 0);
    ctx.lineTo(5, 3);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    // Beak — large hooked boss beak
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(30, -3.5);
    ctx.lineTo(28, 0);
    ctx.lineTo(30, 3.5);
    ctx.closePath();
    ctx.fill();

    // Eyes — gold glowing with glow blur
    const eyeGlow = 0.8 + 0.2 * Math.sin(now / 250);
    ctx.fillStyle = `rgba(255,200,0,${eyeGlow})`;
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(11, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11, 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Monocle on right eye (left from our perspective, forward-facing side)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(11, -5, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Silver signet ring on talon (tiny circle near back)
    ctx.fillStyle = '#c0c0c0';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(-14, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Name label
    ctx.save();
    ctx.translate(x, y);
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#aa00ff';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText('🐦‍⬛ DON CORVINO', 0, -51);
    ctx.restore();
  },

  // Pigeon Pied Piper — enchanting rainbow musician
  drawPiedPiper(ctx, x, y, now, hitCount, hitsRequired) {
    const t = now / 1000;
    ctx.save();
    ctx.translate(x, y);

    // Magical rainbow aura behind the piper
    const auraPulse = 0.65 + 0.35 * Math.sin(t * 2.5);
    const auraGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 38);
    auraGrad.addColorStop(0, `rgba(200,100,255,${auraPulse * 0.5})`);
    auraGrad.addColorStop(0.5, `rgba(100,200,255,${auraPulse * 0.3})`);
    auraGrad.addColorStop(1, 'rgba(200,100,255,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();

    // Slight body sway (playing music)
    const sway = Math.sin(t * 3.5) * 0.12;
    ctx.rotate(sway);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(2, 8, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body — iridescent teal/purple pigeon, slightly plump
    const bodyGrad = ctx.createLinearGradient(-12, -6, 12, 6);
    bodyGrad.addColorStop(0, '#8844cc');
    bodyGrad.addColorStop(0.4, '#44aacc');
    bodyGrad.addColorStop(0.8, '#cc44aa');
    bodyGrad.addColorStop(1, '#4488ff');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing highlights — iridescent shimmer
    const wingHue = (t * 60) % 360;
    ctx.fillStyle = `hsla(${wingHue}, 80%, 70%, 0.6)`;
    ctx.save();
    ctx.rotate(-0.3);
    ctx.beginPath();
    ctx.ellipse(-1, -10, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.rotate(0.3);
    ctx.beginPath();
    ctx.ellipse(-1, 10, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Jester hat — colorful tipped hat
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.ellipse(-4, -7, 8, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(-10, -9);
    ctx.lineTo(4, -22);
    ctx.lineTo(2, -8);
    ctx.closePath();
    ctx.fill();
    // Bell at tip
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(4, -22, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c8a000';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Flute — held at an angle facing right
    ctx.save();
    ctx.rotate(-0.4);
    ctx.strokeStyle = '#c8860a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, -2);
    ctx.lineTo(21, -2);
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    [10, 13.5, 17].forEach(kx => {
      ctx.beginPath();
      ctx.arc(kx, -2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Eyes — bright magical glowing yellow
    const eyeGlow = 0.8 + 0.2 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(255,220,80,${eyeGlow})`;
    ctx.shadowColor = '#ffee00';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(8, -3.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Beak
    ctx.fillStyle = '#ffa030';
    ctx.beginPath();
    ctx.moveTo(13, -1);
    ctx.lineTo(19, -2.5);
    ctx.lineTo(19, 1);
    ctx.closePath();
    ctx.fill();

    // Hit progress bar
    if (hitCount < hitsRequired) {
      const barW = 46;
      const pct = hitCount / hitsRequired;
      const barX = -barW / 2;
      const barY = 16;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(barX - 1, barY - 1, barW + 2, 7, 3);
      ctx.fill();
      if (pct > 0) {
        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        barGrad.addColorStop(0, '#ff44aa');
        barGrad.addColorStop(0.5, '#aa44ff');
        barGrad.addColorStop(1, '#44aaff');
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * pct, 5, 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.fillText(`POOP ${hitCount}/${hitsRequired}x to drive away`, 0, barY + 16);
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Floating musical notes — drawn without body rotation
    ctx.save();
    ctx.translate(x, y);
    const noteData = [
      { dx: -18, phase: 0.0 },
      { dx: 16,  phase: 1.5 },
      { dx:  2,  phase: 3.0 },
      { dx: -7,  phase: 4.5 },
    ];
    noteData.forEach(n => {
      const floatY = ((t * 28 + n.phase * 18) % 52);
      const alpha = Math.min(1, Math.min(floatY / 10, (52 - floatY) / 10));
      if (alpha <= 0) return;
      const noteHue = (n.phase * 90 + t * 40) % 360;
      ctx.fillStyle = `hsla(${noteHue}, 95%, 72%, ${alpha})`;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('♪', n.dx, -24 - floatY);
    });

    // Name label
    ctx.fillStyle = '#ffaaff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText('🎵 PIED PIPER', 0, -40);
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  // ============================================================
  // CURSED COIN — world-space spinning dark gold skull coin
  // ============================================================
  drawCursedCoin(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);

    const spin = t * 1.8;
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);

    // Outer dark aura — pulsing purple-red
    const auraDark = ctx.createRadialGradient(0, 0, 4, 0, 0, 28 + pulse * 8);
    auraDark.addColorStop(0, `rgba(180, 0, 60, ${0.35 + pulse * 0.2})`);
    auraDark.addColorStop(1, 'rgba(80, 0, 30, 0)');
    ctx.fillStyle = auraDark;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();

    // Coin body — squashed to simulate 3D spin
    const scaleX = Math.abs(Math.cos(spin));
    ctx.save();
    ctx.scale(Math.max(0.15, scaleX), 1);

    const coinGrad = ctx.createRadialGradient(-2, -3, 1, 0, 0, 12);
    coinGrad.addColorStop(0, '#c0a020');
    coinGrad.addColorStop(0.6, '#7a5c00');
    coinGrad.addColorStop(1, '#3a2a00');
    ctx.fillStyle = coinGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1a0a00';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (scaleX > 0.3) {
      const alpha = Math.min(1, (scaleX - 0.3) / 0.7);
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.floor(10 * scaleX)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💀', 0, 0.5);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Floating label
    const bobY = -22 + Math.sin(t * 3) * 2;
    ctx.fillStyle = '#ff3366';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 6;
    ctx.strokeText('💀 CURSED COIN', 0, bobY);
    ctx.fillText('💀 CURSED COIN', 0, bobY);
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  // ============================================================
  // CURSED COIN holder indicator — drawn above the bird's head
  // ============================================================
  drawCursedCoinIndicator(ctx, x, y, t, intensity) {
    ctx.save();
    ctx.translate(x, y);

    const pulse = 0.5 + 0.5 * Math.sin(t * (4 + intensity * 8));
    const r = Math.floor(200 + intensity * 55);
    const g = Math.floor(Math.max(0, 50 - intensity * 50));
    const bobY = -38 + Math.sin(t * 3.5) * 3;

    ctx.shadowColor = `rgb(${r}, ${g}, 0)`;
    ctx.shadowBlur = 8 + pulse * 6;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💀', 0, bobY);
    ctx.shadowBlur = 0;

    // Intensity bar below skull
    if (intensity > 0.1) {
      const barW = 28;
      const barH = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(-barW / 2, bobY + 10, barW, barH, 2);
      ctx.fill();
      const barColor = intensity > 0.8 ? '#ff2200' : intensity > 0.5 ? '#ff8800' : '#cc6600';
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(-barW / 2, bobY + 10, barW * intensity, barH, 2);
      ctx.fill();
    }

    ctx.restore();
  },

  // ============================================================
  // SEAGULL INVASION — coastal raider sprite
  // ============================================================

  // White seagull with grey wingtips, orange beak, webbed feet.
  // States: swooping (hunting), stealing (hovering), carrying (flying with food), fleeing.
  drawSeagull(ctx, x, y, rotation, state, hp, carriedFoodType, now) {
    ctx.save();
    ctx.translate(x, y);

    // HP bar (shows damage — second hit kills)
    if (hp < 2) {
      const barW = 32;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-barW / 2, -28, barW, 5);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(-barW / 2, -28, barW * (hp / 2), 5);
    }

    ctx.rotate(rotation);

    // Wing flap animation
    const flapPhase = (now / 200 + x * 0.01) % (Math.PI * 2);
    const wingFlap = Math.sin(flapPhase) * 0.35;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(2, 7, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left wing
    ctx.save();
    ctx.rotate(-wingFlap - 0.2);
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.ellipse(-5, -11, 9, 3.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Grey wingtip
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.ellipse(-11, -15, 5, 2, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right wing
    ctx.save();
    ctx.rotate(wingFlap + 0.2);
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.ellipse(-5, 11, 9, 3.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Grey wingtip
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.ellipse(-11, 15, 5, 2, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body — white seagull body
    ctx.fillStyle = '#f8f8f8';
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orange beak
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(20, -2);
    ctx.lineTo(20, 2.5);
    ctx.closePath();
    ctx.fill();
    // Beak tip (red spot like a real seagull)
    ctx.fillStyle = '#cc3300';
    ctx.beginPath();
    ctx.arc(19, 1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Black eye
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(8, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8.5, -3.5, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Orange webbed feet (only visible when stealing/hovering)
    if (state === 'stealing') {
      ctx.fillStyle = '#ff8800';
      // Left foot
      ctx.beginPath();
      ctx.moveTo(-2, 6);
      ctx.lineTo(-6, 10);
      ctx.lineTo(-4, 10);
      ctx.lineTo(-3, 8);
      ctx.lineTo(-1, 10);
      ctx.lineTo(1, 10);
      ctx.lineTo(2, 8);
      ctx.lineTo(3, 10);
      ctx.lineTo(5, 10);
      ctx.lineTo(3, 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // State labels (unrotated, in screen space above the bird)
    ctx.save();
    ctx.translate(x, y);
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px monospace';

    if (state === 'carrying' && carriedFoodType) {
      // Show what they're carrying
      const foodEmoji = { bread:'🍞', chips:'🍟', sandwich:'🥪', kebab:'🌯', pizza:'🍕', donut:'🍩', crumb:'🍞', fry:'🍟', cheese:'🧀', meat:'🍖', corn:'🌽' }[carriedFoodType] || '🍔';
      const pulse = 0.7 + 0.3 * Math.sin(now / 300);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ff3333';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.fillText(`THIEF! ${foodEmoji}`, 0, -32);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    } else if (state === 'stealing') {
      // Stealing animation — pulsing orange text
      const pulse = 0.6 + 0.4 * Math.sin(now / 200);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ff8800';
      ctx.fillText('STEALING...', 0, -32);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  },

  // ============================================================
  // POLICE HELICOPTER — aerial pursuit unit that arrives at Wanted Level 5
  // ============================================================
  drawPoliceHelicopter(ctx, x, y, rotation, state, poopHits, spotlighting, now) {
    ctx.save();
    ctx.translate(x, y);

    const stunned = state === 'stunned';
    const hovering = state === 'hovering';

    // Stun: helicopter spins wildly (rapid rotation override)
    if (stunned) {
      ctx.rotate(now * 0.008);
    } else {
      ctx.rotate(rotation + Math.PI / 2); // point helicopter nose in movement direction
    }

    // ---- Ground shadow (suggests high altitude) ----
    ctx.save();
    ctx.rotate(0); // shadow stays level regardless of rotation
    const shadowPulse = 0.25 + 0.1 * Math.sin(now * 0.002);
    ctx.globalAlpha = stunned ? 0.1 : shadowPulse;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 30, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    if (stunned) {
      // Crashed look — tilted, smoking, dark
      ctx.globalAlpha = 0.6;
    }

    // ---- Main helicopter body ----
    // Police blue-white color scheme
    const bodyColor = stunned ? '#444' : '#1a4fa0'; // dark blue or grey (stunned)
    const bodyHighlight = stunned ? '#666' : '#2563cc';
    const bodyBottom = stunned ? '#222' : '#0f2d5c';

    // Main fuselage (oval body)
    const bodyGrad = ctx.createLinearGradient(-12, -8, 12, 12);
    bodyGrad.addColorStop(0, bodyHighlight);
    bodyGrad.addColorStop(0.5, bodyColor);
    bodyGrad.addColorStop(1, bodyBottom);
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = stunned ? '#333' : '#0a1f3d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // White stripe along the body
    if (!stunned) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(0, 1, 10, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- Cockpit window (front bubble) ----
    const cockpitColor = stunned ? '#333' : (spotlighting ? '#88ccff' : '#b8d4ff');
    ctx.fillStyle = cockpitColor;
    if (spotlighting && !stunned) {
      ctx.shadowColor = '#44aaff';
      ctx.shadowBlur = 6;
    }
    ctx.beginPath();
    ctx.ellipse(-5, -3, 7, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cockpit frame
    ctx.strokeStyle = stunned ? '#222' : '#0a1f3d';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ---- Tail boom ----
    ctx.fillStyle = stunned ? '#333' : '#1a4fa0';
    ctx.strokeStyle = stunned ? '#222' : '#0a1f3d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, -2);
    ctx.lineTo(22, -1);
    ctx.lineTo(22, 1);
    ctx.lineTo(8, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ---- Tail rotor ----
    const tailRotorAngle = now * 0.03;
    for (let i = 0; i < 3; i++) {
      const tr = tailRotorAngle + (i * Math.PI * 2 / 3);
      ctx.strokeStyle = stunned ? '#555' : '#aaccff';
      ctx.lineWidth = stunned ? 1 : 1.5;
      ctx.globalAlpha = stunned ? 0.4 : 0.8;
      ctx.beginPath();
      ctx.moveTo(22 + Math.cos(tr) * 1, Math.sin(tr) * 1);
      ctx.lineTo(22 + Math.cos(tr) * 6, Math.sin(tr) * 6);
      ctx.stroke();
    }
    ctx.globalAlpha = stunned ? 0.6 : 1;

    // ---- Main rotor hub ----
    ctx.fillStyle = stunned ? '#333' : '#0a1f3d';
    ctx.beginPath();
    ctx.arc(0, -10, 3, 0, Math.PI * 2);
    ctx.fill();

    // ---- Main rotor blades (4 blades, fast rotation) ----
    const rotorAngle = stunned ? now * 0.005 : now * (0.025 + 0.005 * Math.sin(now * 0.001));
    const numBlades = 4;
    for (let i = 0; i < numBlades; i++) {
      const ba = rotorAngle + (i * Math.PI * 2 / numBlades);
      const blade = stunned ? '#444' : '#aaccff';
      // Each blade is a thin elongated ellipse
      ctx.save();
      ctx.translate(0, -10);
      ctx.rotate(ba);
      const bladeGrad = ctx.createLinearGradient(-18, 0, 18, 0);
      bladeGrad.addColorStop(0, 'transparent');
      bladeGrad.addColorStop(0.2, blade);
      bladeGrad.addColorStop(0.8, blade);
      bladeGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bladeGrad;
      ctx.globalAlpha = stunned ? 0.4 : 0.75;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = stunned ? 0.6 : 1;
      ctx.restore();
    }

    // ---- Landing skids ----
    ctx.strokeStyle = stunned ? '#333' : '#0a1f3d';
    ctx.lineWidth = 2;
    // Left skid
    ctx.beginPath();
    ctx.moveTo(-8, 5);
    ctx.lineTo(-8, 12);
    ctx.moveTo(-13, 12);
    ctx.lineTo(-3, 12);
    ctx.stroke();
    // Right skid
    ctx.beginPath();
    ctx.moveTo(5, 5);
    ctx.lineTo(5, 12);
    ctx.moveTo(0, 12);
    ctx.lineTo(10, 12);
    ctx.stroke();

    // ---- Police siren lights (red/blue flashing, on either side of body) ----
    if (!stunned) {
      const sirenPhase = Math.floor(now / 200) % 2;
      // Left light
      ctx.fillStyle = sirenPhase === 0 ? '#ff2222' : '#2244ff';
      ctx.shadowColor = sirenPhase === 0 ? '#ff0000' : '#0044ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-10, 3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Right light
      ctx.fillStyle = sirenPhase === 0 ? '#2244ff' : '#ff2222';
      ctx.shadowColor = sirenPhase === 0 ? '#0044ff' : '#ff0000';
      ctx.beginPath();
      ctx.arc(10, 3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Stunned: lights flicker weakly
      const flickerOn = Math.sin(now * 0.03) > 0;
      if (flickerOn) {
        ctx.fillStyle = 'rgba(255,100,100,0.5)';
        ctx.beginPath();
        ctx.arc(-10, 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ---- POLICE text on side ----
    if (!stunned) {
      ctx.save();
      ctx.rotate(-Math.PI / 2); // text stays readable when helicopter rotates
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 5px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('POLICE', 0, 0);
      ctx.restore();
    }

    // ---- HP damage indicator ----
    if (poopHits > 0) {
      ctx.save();
      ctx.rotate(-rotation - Math.PI / 2); // label always faces up
      const pct = poopHits / 6;
      const barW = 40;
      const barX = -barW / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(barX - 1, -32, barW + 2, 7);
      ctx.fillStyle = pct < 0.5 ? '#ff8800' : '#ff2200';
      ctx.fillRect(barX, -31, barW * pct, 5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, -31, barW, 5);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 6px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`🚁 ${poopHits}/6`, 0, -37);
      ctx.restore();
    }

    // ---- Stunned indicator ----
    if (stunned) {
      ctx.save();
      ctx.rotate(-rotation - Math.PI / 2);
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      const f = 0.5 + 0.5 * Math.sin(now * 0.01);
      ctx.globalAlpha = f;
      ctx.fillText('💥 DOWN!', 0, -30);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    ctx.restore();
  },

  // ── Donut Cop ──────────────────────────────────────────────────
  // A plump, jolly cop who patrols outside the Donut Shop. Three states:
  //   'alert'  — standing straight, watching traffic
  //   'eating' — hunched over, donut in hand, totally distracted (BRIBEABLE + AMBUSHABLE)
  //   'stunned' — stars orbiting, dropped donut
  drawDonutCop(ctx, x, y, state, now) {
    ctx.save();
    ctx.translate(x, y);

    const t = now / 1000;

    // Slight body bob
    const bob = Math.sin(t * (state === 'eating' ? 2.5 : 1.4)) * (state === 'eating' ? 2 : 1);
    ctx.translate(0, bob);

    // === BODY ===
    // Uniform body: navy blue roundish cop
    ctx.fillStyle = '#1a2a6c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Uniform stripes (white shirt line at waist)
    ctx.strokeStyle = '#aaaacc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.lineTo(8, 2);
    ctx.stroke();

    // Gold badge (star shape on chest)
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 4;
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('★', 0, -2);
    ctx.shadowBlur = 0;

    // === HEAD ===
    // Head
    ctx.fillStyle = '#f4c48a';
    ctx.beginPath();
    ctx.arc(0, -18, 9, 0, Math.PI * 2);
    ctx.fill();

    // Police cap — dark blue with gold band
    ctx.fillStyle = '#1a2a6c';
    ctx.beginPath();
    ctx.ellipse(0, -24, 10, 4, 0, Math.PI, 0); // cap dome
    ctx.fill();
    // cap brim
    ctx.fillStyle = '#111a50';
    ctx.beginPath();
    ctx.ellipse(0, -22, 12, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // gold band on cap
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.rect(-10, -24, 20, 2.5);
    ctx.fill();

    // Eyes
    if (state === 'stunned') {
      // X eyes when stunned
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      for (const ex of [-4, 4]) {
        ctx.beginPath(); ctx.moveTo(ex - 2, -20); ctx.lineTo(ex + 2, -16); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex + 2, -20); ctx.lineTo(ex - 2, -16); ctx.stroke();
      }
    } else if (state === 'eating') {
      // Squinty happy eyes (eating)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.8;
      for (const ex of [-4, 4]) {
        ctx.beginPath();
        ctx.arc(ex, -17, 2.5, Math.PI + 0.3, -0.3, false);
        ctx.stroke();
      }
      // Big smile
      ctx.beginPath();
      ctx.arc(0, -14, 4, 0.2, Math.PI - 0.2);
      ctx.strokeStyle = '#884400';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // Alert eyes — wide, watchful
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(-4, -18, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(4, -18, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-4, -18, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(4, -18, 1.4, 0, Math.PI * 2); ctx.fill();
    }

    // === ARMS + DONUT ===
    if (state === 'eating') {
      // Right arm extended holding donut — angled up
      ctx.strokeStyle = '#1a2a6c';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(9, -4);
      ctx.quadraticCurveTo(16, -14, 19, -20);
      ctx.stroke();

      // Donut in hand — full donut at end of arm
      const dangle = Math.sin(t * 3.5) * 0.15; // gentle wobble
      ctx.save();
      ctx.translate(19, -22);
      ctx.rotate(dangle);

      // Donut ring
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#c8630b';
      ctx.fill();
      // Icing
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff69b4';
      ctx.fill();
      // Hole
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f4c48a'; // skin-tone hole (sees through to "hand")
      ctx.fill();
      // Sprinkles
      const sprinkles = [[-3, -3, 0.4], [3, -2, 1.2], [-1, 3, 0.8], [3, 3, 0.3], [-4, 1, 1.0]];
      for (const [sx, sy, sa] of sprinkles) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(sa);
        ctx.fillStyle = ['#ffcc00', '#44ff88', '#4488ff', '#ff4444', '#ffffff'][Math.floor((sx + sy + 7) % 5)];
        ctx.fillRect(-1.5, -0.5, 3, 1);
        ctx.restore();
      }
      ctx.restore();

      // Left arm — relaxed at side
      ctx.strokeStyle = '#1a2a6c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-9, -4);
      ctx.quadraticCurveTo(-14, 4, -12, 10);
      ctx.stroke();

    } else if (state === 'stunned') {
      // Arms dropped limp
      ctx.strokeStyle = '#1a2a6c';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-9, -4);
      ctx.quadraticCurveTo(-14, 6, -11, 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(9, -4);
      ctx.quadraticCurveTo(14, 6, 11, 14);
      ctx.stroke();

      // Dropped donut on the ground below
      ctx.save();
      ctx.translate(14, 16);
      ctx.rotate(0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#c8630b';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff69b4';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#cccccc';
      ctx.fill();
      ctx.restore();

    } else {
      // Alert — arms at sides, fist on belt
      ctx.strokeStyle = '#1a2a6c';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-9, -4);
      ctx.quadraticCurveTo(-14, 2, -13, 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(9, -4);
      ctx.quadraticCurveTo(14, 2, 13, 10);
      ctx.stroke();
    }

    // === LEGS ===
    ctx.strokeStyle = '#111a50';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const legSwing = state === 'eating' ? 0 : Math.sin(t * 1.8) * 4;
    ctx.beginPath();
    ctx.moveTo(-4, 12);
    ctx.lineTo(-6 + legSwing, 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, 12);
    ctx.lineTo(6 - legSwing, 24);
    ctx.stroke();

    // Shoes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(-6 + legSwing, 26, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6 - legSwing, 26, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // === STUNNED: orbiting stars ===
    if (state === 'stunned') {
      const numStars = 3;
      for (let i = 0; i < numStars; i++) {
        const angle = t * 2.5 + (i * Math.PI * 2) / numStars;
        const sx = Math.cos(angle) * 16;
        const sy = Math.sin(angle) * 8 - 22;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', sx, sy);
      }
    }

    // === STATE LABEL ===
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    if (state === 'eating') {
      // Pulsing "EATING 🍩" label in green
      const alpha = 0.7 + 0.3 * Math.sin(t * 3);
      ctx.fillStyle = `rgba(0, 255, 100, ${alpha})`;
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 6;
      ctx.fillText('😋 EATING', 0, -36);
      ctx.shadowBlur = 0;
    } else if (state === 'stunned') {
      ctx.fillStyle = '#ffcc00';
      ctx.fillText('💫 STUNNED', 0, -36);
    } else {
      ctx.fillStyle = '#aaaaff';
      ctx.fillText('👮 ON DUTY', 0, -36);
    }

    ctx.restore();
  },

  // === VENDING MACHINE ===
  drawVendingMachine(ctx, x, y, machineId, nearPlayer, onCooldown, secsLeft, now) {
    ctx.save();
    ctx.translate(x, y);
    const t = (now || 0) / 1000;

    // Machine colors cycle by id
    const COLORS = ['#e63946','#2196f3','#9c27b0','#009688','#4caf50'];
    const EMOJIS = ['🌶️','⚡','🌈','🧊','💚'];
    const col = COLORS[machineId % COLORS.length];

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cabinet body
    ctx.fillStyle = col;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-13, -28, 26, 46, 3);
    ctx.fill();
    ctx.stroke();

    // Screen / display area (dark glass)
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(-9, -24, 18, 16, 2);
    ctx.fill();

    // Screen glow — pulses
    const glow = 0.6 + 0.4 * Math.sin(t * 3 + machineId);
    ctx.fillStyle = `rgba(255,255,200,${glow * 0.15})`;
    ctx.beginPath();
    ctx.roundRect(-9, -24, 18, 16, 2);
    ctx.fill();

    // Price tag
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 6px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('20c', 0, -13);

    // Selection button row
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(-10, -4, 20, 8, 2);
    ctx.fill();
    // Big button
    ctx.fillStyle = '#ff5500';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cc3300';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Bottom slot / dispenser area
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.roundRect(-8, 8, 16, 7, 1);
    ctx.fill();

    // Emoji label on screen
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(EMOJIS[machineId % EMOJIS.length], 0, -18);

    // "VEND" text side stripe
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.font = 'bold 4px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('POOP SHOP', 0, -11);
    ctx.restore();

    // Near-player glow and prompt
    if (nearPlayer && !onCooldown) {
      ctx.shadowColor = col;
      ctx.shadowBlur = 16 + 8 * Math.sin(t * 4);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-13, -28, 26, 46, 3);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Cooldown overlay
    if (onCooldown && secsLeft > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(-13, -28, 26, 46, 3);
      ctx.fill();
      ctx.fillStyle = '#ff9900';
      ctx.font = 'bold 7px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(secsLeft + 's', 0, 0);
    }

    ctx.restore();
  },

  // === COLORED POOP VARIANTS (vending machine effects) ===
  drawColoredPoop(ctx, x, y, vpEffect, now) {
    const t = (now || 0) / 1000;
    ctx.save();

    if (vpEffect === 'spicy') {
      // Orange-red fiery poop
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#cc2200';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.arc(x - 2, y - 1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff7700';
      ctx.beginPath(); ctx.arc(x + 1, y + 2, 2, 0, Math.PI * 2); ctx.fill();
      // Tiny flame flicker
      const fAlpha = 0.7 + 0.3 * Math.sin(t * 15 + x);
      ctx.fillStyle = `rgba(255,200,0,${fAlpha})`;
      ctx.beginPath(); ctx.arc(x, y - 6, 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else if (vpEffect === 'freeze') {
      // Icy blue poop
      ctx.shadowColor = '#44aaff';
      ctx.shadowBlur = 7;
      ctx.fillStyle = '#0055cc';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3399ff';
      ctx.beginPath(); ctx.arc(x - 2, y - 1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#88ddff';
      ctx.beginPath(); ctx.arc(x + 1, y + 2, 2, 0, Math.PI * 2); ctx.fill();
      // Snowflake sparkle
      ctx.strokeStyle = 'rgba(180,230,255,0.8)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI / 3) + t * 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 1, y - 7 + Math.sin(a) * 1);
        ctx.lineTo(x + Math.cos(a) * 4.5, y - 7 + Math.sin(a) * 4.5);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    } else if (vpEffect === 'rainbow') {
      // Shimmering rainbow poop — color cycles
      const hue = ((t * 120) + x * 0.5) % 360;
      ctx.shadowColor = `hsl(${hue},100%,60%)`;
      ctx.shadowBlur = 7;
      ctx.fillStyle = `hsl(${hue},90%,40%)`;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `hsl(${(hue + 60) % 360},90%,55%)`;
      ctx.beginPath(); ctx.arc(x - 2, y - 1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `hsl(${(hue + 120) % 360},90%,65%)`;
      ctx.beginPath(); ctx.arc(x + 1, y + 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else if (vpEffect === 'toxic') {
      // Sickly green dripping poop
      ctx.shadowColor = '#00ff44';
      ctx.shadowBlur = 7;
      ctx.fillStyle = '#116611';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#22aa22';
      ctx.beginPath(); ctx.arc(x - 2, y - 1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#55ee55';
      ctx.beginPath(); ctx.arc(x + 1, y + 2, 2, 0, Math.PI * 2); ctx.fill();
      // Drip
      const drip = (t * 8 + x * 0.3) % 1;
      ctx.fillStyle = `rgba(40,200,40,${0.6 - drip * 0.5})`;
      ctx.beginPath(); ctx.arc(x, y + 6 + drip * 4, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else if (vpEffect === 'shock') {
      // Electric yellow poop with sparks
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 9;
      ctx.fillStyle = '#997700';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ddcc00';
      ctx.beginPath(); ctx.arc(x - 2, y - 1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffee44';
      ctx.beginPath(); ctx.arc(x + 1, y + 2, 2, 0, Math.PI * 2); ctx.fill();
      // Electric bolt zap
      const zAlpha = 0.5 + 0.5 * Math.sin(t * 20 + y);
      ctx.strokeStyle = `rgba(255,255,100,${zAlpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 1, y - 8);
      ctx.lineTo(x + 2, y - 5);
      ctx.lineTo(x - 2, y - 3);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Fallback: normal poop
      ctx.fillStyle = '#6b4226';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  },
};
