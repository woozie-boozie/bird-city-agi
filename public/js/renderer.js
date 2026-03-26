// Bird City World Renderer
window.Renderer = {

  worldData: null,

  init(worldData) {
    this.worldData = worldData;
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
  drawBuildings(ctx, camera) {
    if (!this.worldData) return;
    for (const b of this.worldData.buildings) {
      // Frustum culling
      const sx = b.x - camera.x + camera.screenW / 2;
      const sy = b.y - camera.y + camera.screenH / 2;
      if (sx + b.w < -50 || sx > camera.screenW + 50 ||
          sy + b.h < -50 || sy > camera.screenH + 50) continue;

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
  drawMinimap(minimapCtx, worldData, birds, selfBird, activeEvent, cat, janitor) {
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

    // Buildings
    minimapCtx.fillStyle = '#666';
    for (const b of worldData.buildings) {
      minimapCtx.fillRect(b.x * sx, b.y * sy, Math.max(b.w * sx, 1), Math.max(b.h * sy, 1));
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

    // Border
    minimapCtx.strokeStyle = 'rgba(255,255,255,0.3)';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(0, 0, mw, mh);
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
};
