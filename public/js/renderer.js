// Bird City World Renderer
window.Renderer = {

  worldData: null,

  init(worldData) {
    this.worldData = worldData;
    this._radioTowerPos = worldData.radioTowerPos || { x: 1200, y: 450 };
  },

  // Draw the ground / base layer
  drawGround(ctx, camera) {
    const w = this.worldData;
    if (!w) return;

    // Sky/grass background
    ctx.fillStyle = '#4a7a3a';
    const gx = -camera.x + camera.screenW / 2;
    const gy = -camera.y + camera.screenH / 2;
    ctx.fillRect(gx, gy, w.width, w.height);

    // World border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.strokeRect(gx, gy, w.width, w.height);
  },

  // Draw roads
  drawRoads(ctx, camera) {
    if (!this.worldData) return;
    for (const road of this.worldData.roads) {
      const sx = road.x - camera.x + camera.screenW / 2;
      const sy = road.y - camera.y + camera.screenH / 2;

      // Road surface
      ctx.fillStyle = '#555';
      ctx.fillRect(sx, sy, road.w, road.h);

      // Road lines (dashed center line)
      ctx.strokeStyle = '#aa0';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      if (road.w > road.h) {
        // Horizontal road
        const cy = sy + road.h / 2;
        ctx.beginPath();
        ctx.moveTo(sx, cy);
        ctx.lineTo(sx + road.w, cy);
        ctx.stroke();
      } else {
        // Vertical road
        const cx = sx + road.w / 2;
        ctx.beginPath();
        ctx.moveTo(cx, sy);
        ctx.lineTo(cx, sy + road.h);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Sidewalk edges
      ctx.fillStyle = '#777';
      if (road.w > road.h) {
        ctx.fillRect(sx, sy, road.w, 3);
        ctx.fillRect(sx, sy + road.h - 3, road.w, 3);
      } else {
        ctx.fillRect(sx, sy, 3, road.h);
        ctx.fillRect(sx + road.w - 3, sy, 3, road.h);
      }
    }
  },

  // Draw park area
  drawPark(ctx, camera) {
    if (!this.worldData) return;
    const p = this.worldData.park;
    const sx = p.x - camera.x + camera.screenW / 2;
    const sy = p.y - camera.y + camera.screenH / 2;

    // Lighter grass for park
    ctx.fillStyle = '#5a9a4a';
    ctx.fillRect(sx, sy, p.w, p.h);

    // Park border (path)
    ctx.strokeStyle = '#b8a070';
    ctx.lineWidth = 6;
    ctx.strokeRect(sx + 20, sy + 20, p.w - 40, p.h - 40);

    // Pond
    const pond = p.pond;
    const px = pond.x - camera.x + camera.screenW / 2;
    const py = pond.y - camera.y + camera.screenH / 2;
    ctx.fillStyle = '#3a7abd';
    ctx.beginPath();
    ctx.ellipse(px, py, pond.rx, pond.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pond shimmer
    ctx.fillStyle = 'rgba(150, 200, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(px - 10, py - 5, pond.rx * 0.4, pond.ry * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Statue
    const st = p.statue;
    Sprites.drawStatue(ctx,
      st.x - camera.x + camera.screenW / 2,
      st.y - camera.y + camera.screenH / 2
    );
  },

  // Draw buildings
  drawBuildings(ctx, camera, bankHeistPhase) {
    if (!this.worldData) return;
    const heistActive = bankHeistPhase && bankHeistPhase !== 'idle' && bankHeistPhase !== 'cooldown';
    const heistAlarm = heistActive && (bankHeistPhase === 'cracking' || bankHeistPhase === 'escape');
    const now = Date.now();

    for (const b of this.worldData.buildings) {
      // Frustum culling
      const sx = b.x - camera.x + camera.screenW / 2;
      const sy = b.y - camera.y + camera.screenH / 2;
      if (sx + b.w < -50 || sx > camera.screenW + 50 ||
          sy + b.h < -50 || sy > camera.screenH + 50) continue;

      // Bank gets a tinted overlay during heist phases
      const isBank = b.name === 'Bank';
      if (isBank && heistAlarm) {
        const flashA = 0.15 + 0.1 * Math.sin(now / 150);
        ctx.fillStyle = `rgba(255,50,0,${flashA})`;
        ctx.fillRect(sx - 3, sy - 3, b.w + 6, b.h + 6);
      }

      Sprites.drawBuilding(ctx, sx, sy, b.w, b.h, b.color);

      // Special decoration for Pigeon Date Center
      if (b.name === 'Pigeon Date Center') {
        // Hearts
        ctx.fillStyle = 'rgba(255, 105, 180, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('\u2665', sx + 15, sy + 15);
        ctx.fillText('\u2665', sx + b.w - 15, sy + 15);
        // Mission board icon
        Sprites.drawMissionBoard(ctx, sx + b.w / 2, sy);
      }

      // Bank heist label
      if (isBank && heistActive) {
        const pulse = 0.7 + 0.3 * Math.abs(Math.sin(now / 400));
        ctx.font = 'bold 10px Courier New';
        ctx.textAlign = 'center';
        ctx.globalAlpha = pulse;
        const label = bankHeistPhase === 'casing' ? '🏦 HEIST ACTIVE' :
                      bankHeistPhase === 'cracking' ? '🔒 CRACK VAULT' :
                      '🚨 ALARM!';
        ctx.fillStyle = bankHeistPhase === 'cracking' ? '#ffdd44' : '#ff6644';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(label, sx + b.w / 2, sy - 6);
        ctx.fillText(label, sx + b.w / 2, sy - 6);
        ctx.globalAlpha = 1;
      }

      // Building name
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '9px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, sx + b.w / 2, sy + b.h / 2 + 3);
    }
  },

  // Draw trees
  drawTrees(ctx, camera) {
    if (!this.worldData) return;
    for (const tree of this.worldData.trees) {
      const sx = tree.x - camera.x + camera.screenW / 2;
      const sy = tree.y - camera.y + camera.screenH / 2;
      if (sx < -30 || sx > camera.screenW + 30 ||
          sy < -30 || sy > camera.screenH + 30) continue;
      Sprites.drawTree(ctx, sx, sy, tree.size);
    }
  },

  // Draw cars
  drawCars(ctx, camera) {
    if (!this.worldData) return;
    for (const car of this.worldData.cars) {
      const sx = car.x - camera.x + camera.screenW / 2;
      const sy = car.y - camera.y + camera.screenH / 2;
      if (sx < -50 || sx > camera.screenW + 50 ||
          sy < -50 || sy > camera.screenH + 50) continue;
      Sprites.drawCar(ctx, sx, sy, car.w, car.h, car.color);
    }
  },

  // Draw laundry
  drawLaundry(ctx, camera) {
    if (!this.worldData) return;
    for (const l of this.worldData.laundry) {
      const sx1 = l.x1 - camera.x + camera.screenW / 2;
      const sy1 = l.y1 - camera.y + camera.screenH / 2;
      const sx2 = l.x2 - camera.x + camera.screenW / 2;
      const sy2 = l.y2 - camera.y + camera.screenH / 2;
      Sprites.drawLaundry(ctx, sx1, sy1, sx2, sy2);
    }
  },

  // Draw cafe tables
  drawTables(ctx, camera) {
    if (!this.worldData) return;
    for (const t of this.worldData.cafeTables) {
      const sx = t.x - camera.x + camera.screenW / 2;
      const sy = t.y - camera.y + camera.screenH / 2;
      if (sx < -20 || sx > camera.screenW + 20 ||
          sy < -20 || sy > camera.screenH + 20) continue;
      Sprites.drawTable(ctx, sx, sy);
    }
  },

  // Draw moving cars (from game state, not world data)
  drawMovingCars(ctx, camera, movingCars) {
    if (!movingCars) return;
    for (const car of movingCars) {
      const sx = car.x - camera.x + camera.screenW / 2;
      const sy = car.y - camera.y + camera.screenH / 2;
      if (sx < -60 || sx > camera.screenW + 60 ||
          sy < -60 || sy > camera.screenH + 60) continue;
      Sprites.drawCar(ctx, sx, sy, car.w, car.h, car.color);
    }
  },

  // Draw minimap
  drawMinimap(minimapCtx, worldData, birds, selfBird, activeEvent, cat, janitor, territories, bankHeist, graffiti) {
    if (!worldData) return;

    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const sx = mw / worldData.width;
    const sy = mh / worldData.height;

    // Background
    minimapCtx.fillStyle = '#2a4a2a';
    minimapCtx.fillRect(0, 0, mw, mh);

    // Roads
    minimapCtx.fillStyle = '#444';
    for (const r of worldData.roads) {
      minimapCtx.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
    }

    // Park
    minimapCtx.fillStyle = '#3a6a3a';
    const p = worldData.park;
    minimapCtx.fillRect(p.x * sx, p.y * sy, p.w * sx, p.h * sy);

    // Territory zones on minimap
    if (territories) {
      for (const zone of territories) {
        const owned = zone.ownerTeamId !== null;
        const capturing = zone.captureProgress > 0;
        if (!owned && !capturing) continue;
        minimapCtx.globalAlpha = owned ? 0.45 : 0.22;
        minimapCtx.fillStyle = owned ? (zone.ownerColor || zone.baseColor) : zone.baseColor;
        minimapCtx.fillRect(zone.x * sx, zone.y * sy, zone.w * sx, zone.h * sy);
        if (owned) {
          minimapCtx.globalAlpha = 0.8;
          minimapCtx.strokeStyle = zone.ownerColor || zone.baseColor;
          minimapCtx.lineWidth = 1;
          minimapCtx.strokeRect(zone.x * sx, zone.y * sy, zone.w * sx, zone.h * sy);
        }
        minimapCtx.globalAlpha = 1;
      }
    }

    // Buildings (with graffiti color hints)
    const graffitiMap = {};
    if (graffiti) {
      const now = Date.now();
      for (const tag of graffiti) {
        if (tag.expiresAt > now) graffitiMap[tag.buildingIdx] = tag;
      }
    }
    for (let i = 0; i < worldData.buildings.length; i++) {
      const b = worldData.buildings[i];
      const tag = graffitiMap[i];
      minimapCtx.fillStyle = tag ? tag.ownerColor : '#666';
      minimapCtx.globalAlpha = tag ? 0.8 : 1;
      minimapCtx.fillRect(b.x * sx, b.y * sy, Math.max(b.w * sx, 1), Math.max(b.h * sy, 1));
      minimapCtx.globalAlpha = 1;
    }

    // Date Center as purple dot
    const dcBuilding = worldData.buildings.find(b => b.name === 'Pigeon Date Center');
    if (dcBuilding) {
      minimapCtx.fillStyle = '#cc88dd';
      minimapCtx.beginPath();
      minimapCtx.arc((dcBuilding.x + dcBuilding.w / 2) * sx, (dcBuilding.y + dcBuilding.h / 2) * sy, 3, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    // Other birds — flock mates get green, others white
    const selfFlockId = selfBird && selfBird.flockId ? selfBird.flockId : null;
    if (birds) {
      for (const b of birds) {
        if (b.id === (selfBird && selfBird.id)) continue;
        if (selfFlockId && b.flockId === selfFlockId) {
          minimapCtx.fillStyle = '#4ade80'; // green for flock mates
        } else {
          minimapCtx.fillStyle = '#fff';
        }
        minimapCtx.beginPath();
        minimapCtx.arc(b.x * sx, b.y * sy, 2, 0, Math.PI * 2);
        minimapCtx.fill();
      }
    }

    // Self (yellow dot)
    if (selfBird) {
      minimapCtx.fillStyle = '#ffc832';
      minimapCtx.beginPath();
      minimapCtx.arc(selfBird.x * sx, selfBird.y * sy, 3, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    // Cat as small red-orange dot
    if (cat) {
      minimapCtx.fillStyle = '#ff6633';
      minimapCtx.beginPath();
      minimapCtx.arc(cat.x * sx, cat.y * sy, 3, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    // Janitor as small blue dot
    if (janitor) {
      minimapCtx.fillStyle = '#3355aa';
      minimapCtx.beginPath();
      minimapCtx.arc(janitor.x * sx, janitor.y * sy, 3, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    // Active event marker (pulsing colored marker)
    if (activeEvent && activeEvent.x !== undefined && activeEvent.y !== undefined) {
      const eventColors = {
        breadcrumbs: '#ffd700',
        wedding: '#ff69b4',
        hawk: '#ff3300',
        parade: '#6666ff',
      };
      const color = eventColors[activeEvent.type] || '#fff';
      const pulse = Math.sin(Date.now() * 0.006) * 0.4 + 0.6;
      minimapCtx.globalAlpha = pulse;
      minimapCtx.fillStyle = color;
      minimapCtx.beginPath();
      minimapCtx.arc(activeEvent.x * sx, activeEvent.y * sy, 4, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.globalAlpha = 1;
    }

    // Bank heist indicators
    if (bankHeist && bankHeist.phase !== 'idle' && bankHeist.phase !== 'cooldown') {
      const bx = 1960 * sx;
      const by = 1775 * sy;
      const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;

      if (bankHeist.phase === 'casing' || bankHeist.phase === 'cracking') {
        // Pulsing blue bank indicator
        minimapCtx.globalAlpha = 0.5 + 0.5 * pulse;
        minimapCtx.fillStyle = '#4466ff';
        minimapCtx.beginPath();
        minimapCtx.arc(bx, by, 4, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.globalAlpha = 0.4 * pulse;
        minimapCtx.strokeStyle = '#aaccff';
        minimapCtx.lineWidth = 1;
        minimapCtx.beginPath();
        minimapCtx.arc(bx, by, 7, 0, Math.PI * 2);
        minimapCtx.stroke();
        minimapCtx.globalAlpha = 1;
      }

      if (bankHeist.phase === 'escape' && bankHeist.escapeVan) {
        // Yellow van indicator
        const vx = bankHeist.escapeVan.x * sx;
        const vy = bankHeist.escapeVan.y * sy;
        minimapCtx.globalAlpha = 0.6 + 0.4 * pulse;
        minimapCtx.fillStyle = '#ffd700';
        minimapCtx.beginPath();
        minimapCtx.arc(vx, vy, 5, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.globalAlpha = 1;
        minimapCtx.font = 'bold 8px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillStyle = '#ffd700';
        minimapCtx.fillText('🚐', vx, vy - 6);
      }
    }

    // Border
    minimapCtx.strokeStyle = 'rgba(255,255,255,0.3)';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(0, 0, mw, mh);
  },

  // Draw stars and moon into the world background (called before ground layer, in world-space)
  // Only visible during dusk/night/dawn phases
  drawNightSky(ctx, camera, dayTime) {
    if (dayTime === undefined || dayTime === null) return;

    // Compute how visible the stars/moon are (0 = invisible, 1 = full)
    let starAlpha = 0;
    if (dayTime >= 0.30 && dayTime < 0.45) {
      starAlpha = (dayTime - 0.30) / 0.15; // fade in during dusk
    } else if (dayTime >= 0.45 && dayTime < 0.75) {
      starAlpha = 1.0; // full night
    } else if (dayTime >= 0.75 && dayTime < 0.90) {
      starAlpha = 1.0 - (dayTime - 0.75) / 0.15; // fade out during dawn
    }
    if (starAlpha <= 0.02) return;

    const sw = camera.screenW;
    const sh = camera.screenH;

    // Reuse a seeded star field so stars don't jitter each frame
    if (!this._stars) {
      this._stars = [];
      const rng = (seed) => {
        let s = seed;
        return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
      };
      const r = rng(42);
      for (let i = 0; i < 180; i++) {
        this._stars.push({
          // Store as normalized 0-1 coordinates in a 2x2 world tile — parallax offset
          nx: r(),
          ny: r(),
          size: r() * 1.4 + 0.4,
          brightness: r() * 0.6 + 0.4,
          twinkleOffset: r() * Math.PI * 2,
        });
      }
    }

    ctx.save();

    // Draw stars in screen-space with slight parallax (stars move slower than world)
    const parallax = 0.05; // stars drift only 5% as fast as the camera
    const now = Date.now();

    for (const star of this._stars) {
      // Map star onto a large virtual sky canvas; loop with modulo for tiling
      const rawX = (star.nx * sw * 3 - camera.x * parallax) % (sw * 1.5);
      const rawY = (star.ny * sh * 3 - camera.y * parallax) % (sh * 1.5);
      // Keep in screen range with wrapping
      const sx = ((rawX % sw) + sw) % sw;
      const sy = ((rawY % sh) + sh) % sh;

      const twinkle = Math.sin(now * 0.002 + star.twinkleOffset) * 0.3 + 0.7;
      ctx.globalAlpha = starAlpha * star.brightness * twinkle;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moon — fixed screen position (top-right area), subtle parallax
    const moonX = sw * 0.78 + Math.sin(camera.x * 0.0003) * 20;
    const moonY = sh * 0.12 + Math.sin(camera.y * 0.0003) * 10;
    const moonR = 22;

    // Moon glow halo
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 2.5);
    moonGlow.addColorStop(0, `rgba(220, 230, 255, ${starAlpha * 0.18})`);
    moonGlow.addColorStop(1, 'rgba(180, 200, 255, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Moon disc + crescent shadow — done in a save/clip block to stay contained
    ctx.save();
    ctx.globalAlpha = starAlpha;

    // Disc
    ctx.fillStyle = '#dde8ff';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Crescent shadow: clip to moon disc, then paint offset circle
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(20, 30, 70, 0.60)';
    ctx.beginPath();
    ctx.arc(moonX + moonR * 0.38, moonY, moonR * 0.88, 0, Math.PI * 2);
    ctx.fill();

    // Moon craters (subtle texture inside clip)
    ctx.fillStyle = 'rgba(180, 195, 230, 0.35)';
    ctx.beginPath(); ctx.arc(moonX - 5, moonY - 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX + 4, moonY + 7, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX - 8, moonY + 5, 3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    ctx.globalAlpha = 1;
    ctx.restore();
  },

  // Draw day/night overlay with street lamp glow holes
  // Called in screen-space (after ctx.restore() removes world zoom)
  drawDayNight(ctx, camera, zoom, dayTime, streetLamps) {
    if (dayTime === undefined || dayTime === null) return;

    // Compute darkness level (0 = full daylight, ~0.65 = full night)
    let darkness = 0;
    let tr = 0, tg = 0, tb = 0; // tint RGB

    if (dayTime < 0.30) {
      // Day — no overlay
      darkness = 0;
    } else if (dayTime < 0.45) {
      // Dusk — fade in with warm purple/red
      const t = (dayTime - 0.30) / 0.15;
      darkness = t * 0.60;
      tr = 60; tg = 10; tb = 40;
    } else if (dayTime < 0.55) {
      // Nightfall — deepen quickly to full night
      const t = (dayTime - 0.45) / 0.10;
      darkness = 0.60 + t * 0.10;
      tr = 5; tg = 5; tb = 35;
    } else if (dayTime < 0.65) {
      // Full night — steady
      darkness = 0.70;
      tr = 5; tg = 5; tb = 35;
    } else if (dayTime < 0.75) {
      // Pre-dawn — slightly lightening
      const t = (dayTime - 0.65) / 0.10;
      darkness = 0.70 - t * 0.15;
      tr = 5; tg = 5; tb = 35;
    } else if (dayTime < 0.90) {
      // Dawn — warm orange fade out
      const t = (dayTime - 0.75) / 0.15;
      darkness = 0.55 - t * 0.55;
      tr = 70; tg = 25; tb = 5;
    } else {
      // Day — clear
      darkness = 0;
    }

    if (darkness <= 0.01) return;

    const sw = camera.screenW;
    const sh = camera.screenH;

    // Create/reuse offscreen canvas for the night layer
    if (!this._nightCanvas || this._nightCanvas.width !== sw || this._nightCanvas.height !== sh) {
      this._nightCanvas = document.createElement('canvas');
      this._nightCanvas.width = sw;
      this._nightCanvas.height = sh;
      this._nightCtx = this._nightCanvas.getContext('2d');
    }

    const nc = this._nightCtx;
    nc.clearRect(0, 0, sw, sh);

    // Fill darkness base
    nc.fillStyle = `rgba(${tr},${tg},${tb},${darkness})`;
    nc.fillRect(0, 0, sw, sh);

    // Punch lamp-shaped holes in the darkness using destination-out
    if (darkness > 0.08 && streetLamps && streetLamps.length) {
      nc.globalCompositeOperation = 'destination-out';
      const lampRadius = 85 + darkness * 90;

      for (const lamp of streetLamps) {
        // Convert world position to screen position (accounting for zoom)
        const sx = sw / 2 + (lamp.x - camera.x) * zoom;
        const sy = sh / 2 + (lamp.y - camera.y) * zoom;

        if (sx < -lampRadius || sx > sw + lampRadius || sy < -lampRadius || sy > sh + lampRadius) continue;

        const grad = nc.createRadialGradient(sx, sy, 0, sx, sy, lampRadius);
        grad.addColorStop(0, `rgba(0,0,0,${darkness})`);
        grad.addColorStop(0.45, `rgba(0,0,0,${darkness * 0.55})`);
        grad.addColorStop(0.75, `rgba(0,0,0,${darkness * 0.15})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        nc.fillStyle = grad;
        nc.beginPath();
        nc.arc(sx, sy, lampRadius, 0, Math.PI * 2);
        nc.fill();
      }
      nc.globalCompositeOperation = 'source-over';
    }

    // Stamp the night layer onto the game canvas
    ctx.drawImage(this._nightCanvas, 0, 0);

    // Draw stars + moon on top of the darkness overlay (they peek through the night)
    this._drawStarsAndMoon(ctx, camera, darkness, sw, sh);

    // Draw warm lamp glow dots on top of the darkness
    if (darkness > 0.08 && streetLamps && streetLamps.length) {
      const glowAlpha = Math.min(0.85, darkness * 1.1);
      for (const lamp of streetLamps) {
        const sx = sw / 2 + (lamp.x - camera.x) * zoom;
        const sy = sh / 2 + (lamp.y - camera.y) * zoom;
        if (sx < -20 || sx > sw + 20 || sy < -20 || sy > sh + 20) continue;

        // Soft outer glow
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 22 * zoom);
        glow.addColorStop(0, `rgba(255,215,80,${glowAlpha})`);
        glow.addColorStop(0.5, `rgba(255,170,40,${glowAlpha * 0.4})`);
        glow.addColorStop(1, 'rgba(255,120,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, 22 * zoom, 0, Math.PI * 2);
        ctx.fill();

        // Bright center dot
        ctx.fillStyle = `rgba(255,240,160,${glowAlpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 3 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  // Internal helper: draw stars + moon on top of the darkness overlay
  _drawStarsAndMoon(ctx, camera, darkness, sw, sh) {
    if (darkness < 0.05) return;

    // Lazily generate a stable star field
    if (!this._stars) {
      this._stars = [];
      // Simple deterministic LCG for reproducible star positions
      let s = 999983;
      const rnd = () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
      for (let i = 0; i < 200; i++) {
        this._stars.push({
          nx: rnd(),      // normalized 0-1 screen X anchor
          ny: rnd(),      // normalized 0-1 screen Y anchor
          size: rnd() * 1.2 + 0.3,
          brightness: rnd() * 0.5 + 0.5,
          twinkleOffset: rnd() * Math.PI * 2,
        });
      }
    }

    const now = Date.now();
    const parallax = 0.04; // stars parallax with camera at 4%

    // Stars
    ctx.save();
    for (const star of this._stars) {
      // Anchor in screen-space with very slow parallax drift
      const sx = ((star.nx * sw * 2 - camera.x * parallax) % sw + sw) % sw;
      const sy = ((star.ny * sh * 2 - camera.y * parallax) % sh + sh) % sh;

      const twinkle = Math.sin(now * 0.0018 + star.twinkleOffset) * 0.25 + 0.75;
      ctx.globalAlpha = darkness * star.brightness * twinkle * 0.85;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moon — upper-right quadrant of screen, gentle sway
    const moonX = sw * 0.80 + Math.sin(camera.x * 0.00025) * 18;
    const moonY = sh * 0.11 + Math.sin(camera.y * 0.00025) * 10;
    const moonR = Math.min(20, sw * 0.028); // scale with screen

    // Glow halo
    ctx.globalAlpha = darkness * 0.25;
    const halo = ctx.createRadialGradient(moonX, moonY, moonR * 0.6, moonX, moonY, moonR * 3);
    halo.addColorStop(0, 'rgba(200, 215, 255, 1)');
    halo.addColorStop(1, 'rgba(150, 180, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 3, 0, Math.PI * 2);
    ctx.fill();

    // Moon disc + crescent in a clipped sub-context
    ctx.globalAlpha = darkness * 0.90;
    ctx.save();
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fillStyle = '#d8e8ff';
    ctx.fill();
    // Crescent: clip to moon, paint shadow offset
    ctx.clip();
    ctx.fillStyle = 'rgba(18, 28, 65, 0.65)';
    ctx.beginPath();
    ctx.arc(moonX + moonR * 0.40, moonY, moonR * 0.85, 0, Math.PI * 2);
    ctx.fill();
    // Craters
    ctx.fillStyle = 'rgba(160, 180, 220, 0.35)';
    ctx.beginPath(); ctx.arc(moonX - 5, moonY - 5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX + 3, moonY + 6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX - 7, moonY + 4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); // removes clip

    ctx.globalAlpha = 1;
    ctx.restore();
  },

  // ============================================================
  // THE ARENA — PvP colosseum ring
  // ============================================================
  drawArena(ctx, camera, arenaZone, arenaState, now) {
    if (!arenaZone) return;

    const sx = arenaZone.x - camera.x + camera.screenW / 2;
    const sy = arenaZone.y - camera.y + camera.screenH / 2;
    const r = arenaZone.radius;

    // Cull if way off screen
    if (sx + r < -50 || sx - r > camera.screenW + 50 ||
        sy + r < -50 || sy - r > camera.screenH + 50) return;

    const isFighting = arenaState && arenaState.state === 'fighting';
    const isCountdown = arenaState && arenaState.state === 'countdown';
    const pulse = Math.sin(now * 0.004) * 0.4 + 0.6;

    ctx.save();

    // === Sandy arena floor ===
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#c8a06a';
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    // === Dirt ring tracks (concentric circles for arena texture) ===
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#a07040';
    ctx.lineWidth = 3;
    for (let ri = r * 0.35; ri < r - 8; ri += r * 0.2) {
      ctx.beginPath();
      ctx.arc(sx, sy, ri, 0, Math.PI * 2);
      ctx.stroke();
    }

    // === Outer stone wall ring ===
    const wallAlpha = isFighting ? (0.7 + pulse * 0.3) : 0.75;
    ctx.globalAlpha = wallAlpha;
    ctx.strokeStyle = isFighting ? '#ff6622' : (isCountdown ? '#ffaa00' : '#886644');
    ctx.lineWidth = isFighting ? 8 : 6;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner edge of wall
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = isFighting ? '#ff8844' : '#aa8855';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, r - 10, 0, Math.PI * 2);
    ctx.stroke();

    // === Torch pillars at cardinal points ===
    const torchCount = 8;
    for (let i = 0; i < torchCount; i++) {
      const angle = (i / torchCount) * Math.PI * 2;
      const tx = sx + Math.cos(angle) * r;
      const ty = sy + Math.sin(angle) * r;
      ctx.globalAlpha = 1;
      // Stone base
      ctx.fillStyle = '#776655';
      ctx.fillRect(tx - 4, ty - 8, 8, 10);
      // Flame flicker
      const flickerOff = Math.sin(now * 0.01 + i * 1.3) * 2;
      const flameAlpha = isFighting ? 0.95 : 0.7;
      ctx.globalAlpha = flameAlpha;
      ctx.fillStyle = isFighting ? '#ff4400' : '#ff8800';
      ctx.beginPath();
      ctx.ellipse(tx + flickerOff * 0.4, ty - 12, 4, 7, flickerOff * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffee44';
      ctx.beginPath();
      ctx.ellipse(tx + flickerOff * 0.2, ty - 13, 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // === Center line (divided field) ===
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#aa8855';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(sx - r + 10, sy);
    ctx.lineTo(sx + r - 10, sy);
    ctx.stroke();
    ctx.setLineDash([]);

    // === ARENA label ===
    ctx.globalAlpha = isFighting ? 1.0 : 0.8;
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelColor = isFighting ? '#ff6622' : isCountdown ? '#ffcc00' : '#cc9944';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText('⚔️ ARENA', sx + 1, sy - r * 0.5 + 1);
    ctx.fillStyle = labelColor;
    ctx.fillText('⚔️ ARENA', sx, sy - r * 0.5);

    // === Fight state overlay text ===
    if (isCountdown && arenaState.countdownUntil) {
      const secsLeft = Math.max(0, Math.ceil((arenaState.countdownUntil - Date.now()) / 1000));
      ctx.globalAlpha = 0.9 + pulse * 0.1;
      ctx.font = 'bold 28px Courier New';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText('FIGHT IN ' + secsLeft, sx + 2, sy + 2);
      ctx.fillStyle = '#ffcc00';
      ctx.fillText('FIGHT IN ' + secsLeft, sx, sy);
    } else if (isFighting && arenaState.fightEndsAt) {
      const secsLeft = Math.max(0, Math.ceil((arenaState.fightEndsAt - Date.now()) / 1000));
      ctx.globalAlpha = secsLeft <= 15 ? (0.6 + pulse * 0.4) : 0.7;
      ctx.font = 'bold 15px Courier New';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText('⏱ ' + secsLeft + 's', sx + 1, sy + 1);
      ctx.fillStyle = secsLeft <= 15 ? '#ff4444' : '#ffcc44';
      ctx.fillText('⏱ ' + secsLeft + 's', sx, sy);
    } else if (arenaState && arenaState.state === 'waiting') {
      ctx.globalAlpha = 0.8;
      ctx.font = 'bold 11px Courier New';
      ctx.fillStyle = '#aaddff';
      ctx.fillText(arenaState.fighterCount + ' fighter(s) — waiting...', sx, sy);
    } else if (arenaState && arenaState.state === 'idle') {
      ctx.globalAlpha = 0.65;
      ctx.font = '11px Courier New';
      ctx.fillStyle = '#cc9944';
      ctx.fillText('Entry: ' + arenaZone.entryFee + 'c', sx, sy + 8);
    } else if (arenaState && arenaState.state === 'cooldown') {
      ctx.globalAlpha = 0.6;
      ctx.font = '11px Courier New';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('COOLDOWN', sx, sy);
    }

    // Pot display
    if (arenaState && arenaState.pot > 0) {
      ctx.globalAlpha = 0.9;
      ctx.font = 'bold 12px Courier New';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('💰 ' + arenaState.pot + 'c pot', sx, sy + r * 0.55);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  },

  // ============================================================
  // TERRITORY ZONES — colored overlays with ownership UI
  // ============================================================
  drawTerritories(ctx, camera, territories, myTeamId) {
    if (!territories || territories.length === 0) return;

    const now = performance.now();

    for (const zone of territories) {
      const sx = zone.x - camera.x + camera.screenW / 2;
      const sy = zone.y - camera.y + camera.screenH / 2;

      // Cull zones entirely off screen
      if (sx + zone.w < -100 || sx > camera.screenW + 100 ||
          sy + zone.h < -100 || sy > camera.screenH + 100) continue;

      ctx.save();

      // Determine display color
      let displayColor = zone.baseColor;
      const isContested = zone.ownerTeamId !== null && zone.capturingTeamId !== null && zone.capturingTeamId !== zone.ownerTeamId;

      if (zone.ownerTeamId !== null && zone.ownerColor) {
        displayColor = zone.ownerColor;
      } else if (zone.capturingTeamId !== null) {
        displayColor = zone.baseColor;
      }

      // Pulsing contested animation
      const pulse = isContested ? (0.55 + 0.15 * Math.sin(now * 0.006)) : 0;

      // Fill zone with owner/capture color
      const owned = zone.ownerTeamId !== null;
      const capturing = zone.captureProgress > 0 && zone.captureProgress < 1;
      let fillAlpha = owned ? 0.18 : (capturing ? 0.10 : 0.05);
      if (isContested) fillAlpha = 0.22 + pulse * 0.1;

      // Is this MY zone?
      const isMine = myTeamId && zone.ownerTeamId === myTeamId;
      if (isMine) fillAlpha = Math.min(0.28, fillAlpha + 0.08);

      ctx.globalAlpha = fillAlpha;
      ctx.fillStyle = displayColor;
      ctx.fillRect(sx, sy, zone.w, zone.h);

      // Border
      ctx.globalAlpha = owned ? (isMine ? 0.8 : 0.5) : (capturing ? 0.35 : 0.15);
      ctx.strokeStyle = displayColor;
      ctx.lineWidth = isMine ? 3 : 2;
      if (isContested) {
        ctx.setLineDash([8, 5]);
        ctx.globalAlpha = 0.7;
      }
      ctx.strokeRect(sx + 1, sy + 1, zone.w - 2, zone.h - 2);
      ctx.setLineDash([]);

      ctx.globalAlpha = 1;

      // === Zone label (center) ===
      const cx = sx + zone.w / 2;
      const cy = sy + zone.h / 2;

      // Zone name
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillText(zone.name, cx + 1, cy - 10 + 1);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = owned ? 1.0 : 0.65;
      ctx.fillText(zone.name, cx, cy - 10);

      // Owner / capturing label
      ctx.globalAlpha = 1;
      if (zone.ownerName) {
        ctx.font = '11px monospace';
        const ownerLabel = (isMine ? '★ ' : '') + zone.ownerName;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText(ownerLabel, cx + 1, cy + 7 + 1);
        ctx.fillStyle = isMine ? '#ffe066' : (zone.ownerColor || '#fff');
        ctx.fillText(ownerLabel, cx, cy + 7);
      } else if (zone.capturingName && zone.captureProgress > 0) {
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('capturing...', cx + 1, cy + 7 + 1);
        ctx.fillStyle = '#aaddff';
        ctx.fillText('capturing...', cx, cy + 7);
      }

      // === Capture progress bar ===
      if (zone.captureProgress > 0 && zone.captureProgress < 1) {
        const barW = Math.min(zone.w - 20, 140);
        const barH = 6;
        const barX = cx - barW / 2;
        const barY = sy + zone.h - 22;

        // Background
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        // Fill
        ctx.fillStyle = displayColor;
        ctx.fillRect(barX, barY, barW * zone.captureProgress, barH);

        // Contested indicator: show drain from right
        if (isContested) {
          ctx.fillStyle = 'rgba(255,60,60,0.7)';
          const drainW = barW * (1 - zone.captureProgress);
          ctx.fillRect(barX + barW * zone.captureProgress, barY, drainW, barH);
        }

        ctx.globalAlpha = 1;
      }

      // Owned: full green bar at bottom
      if (zone.ownerTeamId !== null && zone.captureProgress >= 1) {
        const barW = Math.min(zone.w - 20, 140);
        const barH = 4;
        const barX = cx - barW / 2;
        const barY = sy + zone.h - 20;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = isMine ? '#ffe066' : (zone.ownerColor || displayColor);
        ctx.fillRect(barX, barY, barW, barH);
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }
  },

  // Draw bank heist overlays: cameras, vault bar, escape van
  drawBankHeist(ctx, camera, bankHeist, now) {
    if (!bankHeist || bankHeist.phase === 'idle' || bankHeist.phase === 'cooldown') return;

    const phase = bankHeist.phase;
    const toS = (wx, wy) => ({
      x: wx - camera.x + camera.screenW / 2,
      y: wy - camera.y + camera.screenH / 2,
    });

    // ---- CAMERAS (casing + cracking phases) ----
    if (phase === 'casing' || phase === 'cracking') {
      for (const cam of bankHeist.cameras) {
        const sp = toS(cam.x, cam.y);
        Sprites.drawSecurityCamera(ctx, sp.x, sp.y, cam.disabled, cam.disableProgress, now);
      }
    }

    // ---- VAULT PROGRESS (cracking phase) ----
    if (phase === 'cracking') {
      // Show crack progress bar at vault door (north face of Bank)
      const vaultSp = toS(1960, 1695);
      const prog = bankHeist.crackProgress || 0;
      const barW = 90, barH = 8;
      const barX = vaultSp.x - barW / 2;
      const barY = vaultSp.y - 20;

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

      // Progress fill (green -> yellow -> red)
      const t = prog;
      const r = Math.floor(255 * Math.min(1, t * 2));
      const g = Math.floor(255 * Math.min(1, (1 - t) * 2));
      ctx.fillStyle = `rgb(${r},${g},0)`;
      ctx.fillRect(barX, barY, barW * prog, barH);

      // Border
      ctx.strokeStyle = '#aaaaff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('🔒 VAULT ' + Math.floor(prog * 100) + '%', vaultSp.x, barY - 6);

      // Alarm flash when alarm sent
      if (bankHeist.crackStartedAt && now - bankHeist.crackStartedAt > 8000) {
        const flashA = 0.15 * Math.abs(Math.sin(now / 200));
        ctx.fillStyle = `rgba(255,0,0,${flashA})`;
        ctx.fillRect(0, 0, camera.screenW, camera.screenH);
      }
    }

    // ---- ESCAPE VAN ----
    if (phase === 'escape' && bankHeist.escapeVan) {
      const van = bankHeist.escapeVan;
      const sp = toS(van.x, van.y);
      Sprites.drawGetawayVan(ctx, sp.x, sp.y, now);

      // Timer above van
      const secsLeft = bankHeist.escapeEndsAt
        ? Math.max(0, Math.ceil((bankHeist.escapeEndsAt - now) / 1000))
        : 0;
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = secsLeft <= 10 ? '#ff4444' : '#ffdd00';
      ctx.fillText('ESCAPE: ' + secsLeft + 's', sp.x, sp.y - 42);

      // Pulsing ring
      const ringR = 55 + 8 * Math.sin(now / 200);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,220,0,' + (0.4 + 0.4 * Math.sin(now / 150)) + ')';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  },

  // Draw graffiti tags on buildings
  drawGraffiti(ctx, camera, graffiti) {
    if (!graffiti || !graffiti.length || !this.worldData) return;
    const now = Date.now();

    // Build lookup map
    const tagMap = {};
    for (const tag of graffiti) {
      tagMap[tag.buildingIdx] = tag;
    }

    for (let i = 0; i < this.worldData.buildings.length; i++) {
      const tag = tagMap[i];
      if (!tag) continue;

      const b = this.worldData.buildings[i];
      const sx = b.x - camera.x + camera.screenW / 2;
      const sy = b.y - camera.y + camera.screenH / 2;

      // Frustum cull
      if (sx + b.w < -60 || sx > camera.screenW + 60 ||
          sy + b.h < -60 || sy > camera.screenH + 60) continue;

      // Fade when < 90s left
      const timeLeft = tag.expiresAt - now;
      const alpha = timeLeft < 90000
        ? Math.max(0, (timeLeft / 90000) * 0.88)
        : 0.88;
      if (alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Left color stripe
      ctx.fillStyle = tag.ownerColor;
      ctx.fillRect(sx, sy, 5, b.h);

      // Bottom color bar
      ctx.fillRect(sx, sy + b.h - 7, b.w, 7);

      // Squiggly spray-paint style text on the bottom bar
      const label = '\uD83C\uDFA8' + (tag.flockName || tag.ownerName).slice(0, 9);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(sx + 6, sy + b.h - 7, b.w - 6, 7);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px Courier New';
      ctx.textAlign = 'left';
      ctx.shadowColor = tag.ownerColor;
      ctx.shadowBlur = 4;
      ctx.fillText(label, sx + 8, sy + b.h - 1);
      ctx.shadowBlur = 0;

      ctx.restore();
    }
  },

  // Draw the Radio Tower control point
  drawRadioTower(ctx, camera, radioTower, now) {
    if (!radioTower) return;
    // Tower position is fixed — read from world data injected at init
    const tx = this._radioTowerPos ? this._radioTowerPos.x : 1200;
    const ty = this._radioTowerPos ? this._radioTowerPos.y : 450;
    const sx = tx - camera.x + camera.screenW / 2;
    const sy = ty - camera.y + camera.screenH / 2;

    // Frustum cull with generous margin
    if (sx < -120 || sx > camera.screenW + 120 || sy < -120 || sy > camera.screenH + 120) return;

    const owned = radioTower.state === 'owned';
    const ownerColor = owned ? (radioTower.ownerColor || '#44aaff') : '#888888';
    const blinkOn = Math.floor(now / 700) % 2 === 0;
    const sigBoost = radioTower.signalBoostUntil > now;

    // ── Signal Boost aura ──
    if (sigBoost) {
      const pulse = 0.55 + 0.35 * Math.sin(now / 180);
      const r = 70 + 12 * Math.sin(now / 350);
      const aura = ctx.createRadialGradient(sx, sy - 45, 0, sx, sy - 45, r);
      aura.addColorStop(0, 'rgba(80,255,80,0)');
      aura.addColorStop(0.5, 'rgba(80,255,80,' + (pulse * 0.3) + ')');
      aura.addColorStop(1, 'rgba(80,255,80,0)');
      ctx.save();
      ctx.fillStyle = aura;
      ctx.fillRect(sx - r, sy - 45 - r, r * 2, r * 2);
      ctx.restore();
    }

    // ── Radio-wave rings (owned only) ──
    if (owned) {
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const phase = ((now / 1400 + i / 3) % 1);
        const ringR = 15 + phase * 65;
        const alpha = Math.max(0, 0.55 - phase * 0.55);
        ctx.beginPath();
        ctx.arc(sx, sy - 48, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = ownerColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // ── Tower structure ──
    ctx.save();
    const strut = owned ? ownerColor : '#666677';
    ctx.strokeStyle = strut;
    ctx.lineCap = 'round';

    // Left leg
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx - 18, sy); ctx.lineTo(sx - 2, sy - 58); ctx.stroke();
    // Right leg
    ctx.beginPath(); ctx.moveTo(sx + 18, sy); ctx.lineTo(sx + 2, sy - 58); ctx.stroke();

    // Horizontal cross-braces
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx - 14, sy - 16); ctx.lineTo(sx + 14, sy - 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 9,  sy - 36); ctx.lineTo(sx + 9,  sy - 36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 5,  sy - 50); ctx.lineTo(sx + 5,  sy - 50); ctx.stroke();

    // Diagonal X-braces
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(sx - 14, sy - 16); ctx.lineTo(sx + 9,  sy - 36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 14, sy - 16); ctx.lineTo(sx - 9,  sy - 36); ctx.stroke();
    ctx.globalAlpha = 1;

    // Antenna spike
    ctx.lineWidth = 2;
    ctx.strokeStyle = owned ? ownerColor : '#888';
    ctx.beginPath(); ctx.moveTo(sx, sy - 58); ctx.lineTo(sx, sy - 82); ctx.stroke();

    // ── Blinking red LED ──
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur = blinkOn ? 12 : 2;
    ctx.fillStyle = blinkOn ? '#ff5555' : '#881111';
    ctx.beginPath();
    ctx.arc(sx, sy - 82, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // ── Base platform ──
    ctx.fillStyle = owned ? ownerColor : '#555566';
    ctx.fillRect(sx - 20, sy, 40, 5);
    ctx.fillStyle = '#33333a';
    ctx.fillRect(sx - 22, sy + 4, 44, 4);

    ctx.restore();

    // ── Labels ──
    ctx.textAlign = 'center';

    if (owned) {
      // "ON AIR" flashing
      const onAirBlink = Math.floor(now / 500) % 2 === 0;
      ctx.font = 'bold 9px Courier New';
      ctx.fillStyle = onAirBlink ? '#ff3300' : '#cc0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = onAirBlink ? 8 : 2;
      ctx.fillText('ON AIR', sx, sy - 89);
      ctx.shadowBlur = 0;

      // Signal boost label
      if (sigBoost) {
        ctx.font = 'bold 10px Courier New';
        ctx.fillStyle = '#44ff44';
        ctx.shadowColor = '#44ff44';
        ctx.shadowBlur = 8;
        ctx.fillText('⚡ BOOST ACTIVE', sx, sy - 101);
        ctx.shadowBlur = 0;
      }

      // Owner name below base
      ctx.font = 'bold 9px Courier New';
      ctx.fillStyle = ownerColor;
      ctx.shadowColor = ownerColor;
      ctx.shadowBlur = 4;
      const label = (radioTower.ownerName || '').slice(0, 12);
      ctx.fillText('📡 ' + label, sx, sy + 16);
      ctx.shadowBlur = 0;
    } else {
      // Neutral label
      ctx.font = '9px Courier New';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('RADIO TOWER', sx, sy + 16);
      ctx.fillStyle = '#777788';
      ctx.font = '8px Courier New';
      ctx.fillText('Hold E to capture', sx, sy + 26);
    }
  },
};
