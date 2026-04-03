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
  drawPark(ctx, camera, dayTime, now) {
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
    // Pond shimmer (daytime only)
    ctx.fillStyle = 'rgba(150, 200, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(px - 10, py - 5, pond.rx * 0.4, pond.ry * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Bioluminescent pond overlay at night
    if (dayTime !== undefined && now !== undefined) {
      this.drawBioluminescentPond(ctx, px, py, pond.rx, pond.ry, dayTime, now);
    }

    // Statue
    const st = p.statue;
    Sprites.drawStatue(ctx,
      st.x - camera.x + camera.screenW / 2,
      st.y - camera.y + camera.screenH / 2
    );
  },

  // Bioluminescent pond glow — activates at dusk/night/dawn
  drawBioluminescentPond(ctx, px, py, rx, ry, dayTime, now) {
    // Compute glow intensity (mirrors night darkness curve)
    let glowAlpha = 0;
    if (dayTime >= 0.30 && dayTime < 0.45) {
      glowAlpha = (dayTime - 0.30) / 0.15;
    } else if (dayTime >= 0.45 && dayTime < 0.75) {
      glowAlpha = 1.0;
    } else if (dayTime >= 0.75 && dayTime < 0.90) {
      glowAlpha = 1.0 - (dayTime - 0.75) / 0.15;
    }
    if (glowAlpha <= 0.02) return;

    const haloPulse = 0.7 + 0.3 * Math.sin(now * 0.002);

    // Outer radial glow halo
    const grad = ctx.createRadialGradient(px, py, 0, px, py, rx * 2.8);
    grad.addColorStop(0, `rgba(0, 255, 200, ${glowAlpha * 0.35 * haloPulse})`);
    grad.addColorStop(0.45, `rgba(0, 180, 140, ${glowAlpha * 0.18 * haloPulse})`);
    grad.addColorStop(1, 'rgba(0, 80, 60, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(px, py, rx * 2.8, rx * 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing pond surface (teal overlay on top of blue)
    ctx.save();
    ctx.globalAlpha = glowAlpha * (0.6 + 0.15 * haloPulse);
    ctx.fillStyle = `rgba(0, 210, 180, 1)`;
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // Expanding ripple rings from center
    for (let i = 0; i < 4; i++) {
      const phase = ((now * 0.0007 + i * 0.25) % 1.0);
      const ringAlpha = (1 - phase) * 0.55 * glowAlpha;
      const ringRx = rx * (0.2 + phase * 1.9);
      const ringRy = ry * (0.2 + phase * 1.9);
      ctx.strokeStyle = `rgba(0, 255, 200, ${ringAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(px, py, ringRx, ringRy, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sparkle particles floating on the surface
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + now * 0.00025;
      const wobble = Math.sin(now * 0.0018 + i * 1.73) * 18;
      const spx = px + Math.cos(angle) * (rx * 0.62 + wobble * 0.4);
      const spy = py + Math.sin(angle) * (ry * 0.55 + wobble * 0.25);
      const spAlpha = (0.25 + 0.75 * Math.abs(Math.sin(now * 0.0028 + i * 0.9))) * glowAlpha;
      ctx.fillStyle = `rgba(180, 255, 240, ${spAlpha})`;
      ctx.beginPath();
      ctx.arc(spx, spy, 1.5 + Math.sin(now * 0.005 + i) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // "SACRED POND ✨" label when glowing brightly
    if (glowAlpha > 0.55) {
      const labelAlpha = (glowAlpha - 0.55) * 2.2;
      ctx.fillStyle = `rgba(0, 255, 200, ${Math.min(1, labelAlpha)})`;
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 200, 160, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText('✨ SACRED POND', px, py + ry + 13);
      ctx.shadowBlur = 0;
    }
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

  // Convert hex color to rgba string
  _hexToRgba(hex, alpha) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(255,255,255,${alpha})`;
    return `rgba(${parseInt(result[1],16)},${parseInt(result[2],16)},${parseInt(result[3],16)},${alpha})`;
  },

  // Draw territory zone overlays — uses upstream state format (ownerTeamId, ownerColor, captureProgress)
  drawTerritories(ctx, camera, territories) {
    if (!territories || !territories.length) return;
    const animTime = Date.now() / 1000;

    for (const zone of territories) {
      const sx = zone.x - camera.x + camera.screenW / 2;
      const sy = zone.y - camera.y + camera.screenH / 2;

      if (sx + zone.w < -20 || sy + zone.h < -20 || sx > camera.screenW + 20 || sy > camera.screenH + 20) continue;

      const isOwned = zone.ownerTeamId !== null;
      const isContested = isOwned && zone.capturingTeamId !== null;
      const captureProgress = zone.captureProgress || 0; // 0-1

      let fillAlpha = 0.05;
      let fillColor;
      let borderColor;
      let borderWidth = 1;

      if (isOwned) {
        const ownerColor = zone.ownerColor || '#ffffff';
        fillAlpha = 0.08 + captureProgress * 0.10;
        fillColor = this._hexToRgba(ownerColor, fillAlpha);
        borderColor = this._hexToRgba(ownerColor, 0.55);
        borderWidth = 1.5;
      } else if (zone.capturingTeamId) {
        fillColor = `rgba(200,200,200,0.06)`;
        const cColor = zone.baseColor || '#ffffff';
        borderColor = this._hexToRgba(cColor, 0.3);
      } else {
        fillColor = `rgba(200,200,200,0.04)`;
        borderColor = `rgba(200,200,200,0.10)`;
      }

      if (isContested) {
        const pulse = 0.5 + 0.5 * Math.sin(animTime * 5);
        borderColor = `rgba(255,100,50,${0.4 + pulse * 0.6})`;
        borderWidth = 2;
      }

      ctx.fillStyle = fillColor;
      ctx.fillRect(sx, sy, zone.w, zone.h);

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.setLineDash(isOwned ? [] : [6, 8]);
      ctx.strokeRect(sx + 1, sy + 1, zone.w - 2, zone.h - 2);
      ctx.setLineDash([]);

      ctx.save();
      ctx.textAlign = 'center';
      const cx = sx + zone.w / 2;
      const ty = sy + 20;

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = isOwned ? (zone.ownerColor || '#fff') : 'rgba(255,255,255,0.35)';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(zone.name.toUpperCase(), cx, ty);

      if (isOwned) {
        ctx.font = '9px monospace';
        ctx.shadowBlur = 3;
        if (isContested && zone.capturingName) {
          const pulse = 0.6 + 0.4 * Math.sin(animTime * 5);
          ctx.fillStyle = `rgba(255,100,50,${pulse})`;
          ctx.fillText(`\u2694 ${zone.capturingName} ATTACKING`, cx, ty + 13);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillText(zone.ownerName || '', cx, ty + 13);
        }
      }
      ctx.restore();

      // Capture progress bar
      if (captureProgress > 0 || isOwned) {
        const bx = sx + 8;
        const by = sy + zone.h - 9;
        const bw = zone.w - 16;
        const bh = 4;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx, by, bw, bh);
        const fillW = captureProgress * bw;
        const barColor = isOwned
          ? (isContested ? '#ff6633' : (zone.ownerColor || '#4ade80'))
          : (zone.baseColor || '#888');
        ctx.fillStyle = barColor;
        ctx.fillRect(bx, by, fillW, bh);
      }
    }
  },

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
        if (b.hitBounty) {
          // Hit contract target: pulsing red dot
          const pulse = Math.sin(Date.now() * 0.012) * 0.4 + 0.6;
          minimapCtx.globalAlpha = pulse;
          minimapCtx.fillStyle = '#ff2222';
          minimapCtx.beginPath();
          minimapCtx.arc(b.x * sx, b.y * sy, 3.5, 0, Math.PI * 2);
          minimapCtx.fill();
          minimapCtx.globalAlpha = 1;
        } else if (selfFlockId && b.flockId === selfFlockId) {
          minimapCtx.fillStyle = '#4ade80'; // green for flock mates
          minimapCtx.beginPath();
          minimapCtx.arc(b.x * sx, b.y * sy, 2, 0, Math.PI * 2);
          minimapCtx.fill();
        } else {
          minimapCtx.fillStyle = '#fff';
          minimapCtx.beginPath();
          minimapCtx.arc(b.x * sx, b.y * sy, 2, 0, Math.PI * 2);
          minimapCtx.fill();
        }
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

  // ============================================================
  // PIGEON RACING TRACK — checkpoint rings + dotted track path
  // ============================================================
  drawRaceTrack(ctx, camera, checkpoints, pigeonRace, now) {
    if (!checkpoints || checkpoints.length === 0) return;

    const raceState = pigeonRace ? pigeonRace.state : 'idle';
    const isActive = raceState === 'open' || raceState === 'countdown' || raceState === 'racing' || raceState === 'finished';
    const isRacer = pigeonRace && pigeonRace.isRacer;
    const myNextCp = isRacer ? pigeonRace.myNextCpIdx : null;
    const myNeedsFinish = isRacer ? pigeonRace.myNeedsFinish : false;
    const myFinished = isRacer ? pigeonRace.myFinished : false;

    // Draw dotted track path connecting checkpoints when race is active
    if (isActive) {
      ctx.save();
      ctx.setLineDash([8, 12]);
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#ffdd44';
      ctx.beginPath();
      for (let i = 0; i < checkpoints.length; i++) {
        const cp = checkpoints[i];
        const sx = cp.x - camera.x + camera.screenW / 2;
        const sy = cp.y - camera.y + camera.screenH / 2;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      // Close loop back to start
      const s0 = checkpoints[0];
      ctx.lineTo(s0.x - camera.x + camera.screenW / 2, s0.y - camera.y + camera.screenH / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Draw each checkpoint ring
    for (let i = 0; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      const sx = cp.x - camera.x + camera.screenW / 2;
      const sy = cp.y - camera.y + camera.screenH / 2;
      const r = cp.r || 80;

      // Cull if off screen
      if (sx + r < -80 || sx - r > camera.screenW + 80 ||
          sy + r < -80 || sy - r > camera.screenH + 80) continue;

      // Only show start ring when idle; show all when active
      if (!isActive && i !== 0) continue;

      // Is this the checkpoint this player needs to hit next?
      let isMyTarget = false;
      if (isRacer && !myFinished && raceState === 'racing') {
        if (myNeedsFinish && i === 0) isMyTarget = true;
        else if (!myNeedsFinish && i === myNextCp) isMyTarget = true;
      }

      const pulse = Math.sin(now * 0.004 + i * 0.8) * 0.5 + 0.5;
      const isStart = i === 0;

      // Color theme per checkpoint
      const cpColors = ['#ffd700', '#ff4444', '#ff8800', '#44ff44', '#44aaff'];
      const ringColor = cpColors[i] || '#ffffff';
      const glowColor = ringColor;

      ctx.save();

      // Pulsing glow halo for my target
      if (isMyTarget) {
        ctx.globalAlpha = 0.25 + pulse * 0.25;
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(sx, sy, r + 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer ring with glow
      ctx.globalAlpha = isMyTarget ? (0.7 + pulse * 0.3) : 0.4;
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = isMyTarget ? 6 : 3;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isMyTarget ? 22 : 8;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner dashed ring
      ctx.globalAlpha = isMyTarget ? (0.5 + pulse * 0.2) : 0.2;
      ctx.strokeStyle = isMyTarget ? '#ffffff' : ringColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(sx, sy, r - 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Checkered pattern on start/finish ring
      if (isStart && isActive) {
        const stripeCount = 8;
        for (let s = 0; s < stripeCount; s++) {
          const a1 = (s / stripeCount) * Math.PI * 2;
          const a2 = ((s + 0.5) / stripeCount) * Math.PI * 2;
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = s % 2 === 0 ? '#ffffff' : '#000000';
          ctx.beginPath();
          ctx.arc(sx, sy, r + 6, a1, a2);
          ctx.arc(sx, sy, r, a2, a1, true);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Checkpoint label / icon
      ctx.globalAlpha = isMyTarget ? 1.0 : 0.8;
      ctx.font = `bold ${isMyTarget ? 14 : 12}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelText = isStart ? (isActive ? '🏁' : '🏁 RACE') : cp.label;
      ctx.fillStyle = '#000000';
      ctx.fillText(labelText, sx + 1, sy + 1);
      ctx.fillStyle = isMyTarget ? '#ffffff' : ringColor;
      ctx.fillText(labelText, sx, sy);

      ctx.globalAlpha = 1;
      ctx.restore();
    }
  },

  // Draw race track checkpoints on minimap
  drawRaceOnMinimap(minimapCtx, worldData, checkpoints, pigeonRace) {
    if (!checkpoints || checkpoints.length === 0) return;
    const raceState = pigeonRace ? pigeonRace.state : 'idle';
    const mw = 100 / worldData.width;
    const mh = 100 / worldData.height;

    // Always show start dot
    const cp0 = checkpoints[0];
    const s0x = cp0.x * mw;
    const s0y = cp0.y * mh;
    minimapCtx.globalAlpha = 0.75;
    minimapCtx.fillStyle = '#ffd700';
    minimapCtx.beginPath();
    minimapCtx.arc(s0x, s0y, 2.5, 0, Math.PI * 2);
    minimapCtx.fill();

    if (raceState === 'idle') {
      minimapCtx.globalAlpha = 1;
      return;
    }

    // Track path
    minimapCtx.save();
    minimapCtx.setLineDash([3, 5]);
    minimapCtx.strokeStyle = '#ffdd44';
    minimapCtx.lineWidth = 0.8;
    minimapCtx.globalAlpha = 0.4;
    minimapCtx.beginPath();
    for (let i = 0; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      const sx = cp.x * mw;
      const sy = cp.y * mh;
      if (i === 0) minimapCtx.moveTo(sx, sy);
      else minimapCtx.lineTo(sx, sy);
    }
    minimapCtx.lineTo(s0x, s0y); // close loop
    minimapCtx.stroke();
    minimapCtx.setLineDash([]);

    // CP dots
    const isRacer = pigeonRace && pigeonRace.isRacer;
    const myNextCp = isRacer ? pigeonRace.myNextCpIdx : null;
    const myNeedsFinish = isRacer ? pigeonRace.myNeedsFinish : false;
    const cpColors = ['#ffd700','#ff4444','#ff8800','#44ff44','#44aaff'];

    for (let i = 1; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      const sx = cp.x * mw;
      const sy = cp.y * mh;
      const isMyTarget = isRacer && !myNeedsFinish && i === myNextCp;
      minimapCtx.globalAlpha = isMyTarget ? 1.0 : 0.6;
      minimapCtx.fillStyle = cpColors[i] || '#ffffff';
      minimapCtx.beginPath();
      minimapCtx.arc(sx, sy, isMyTarget ? 3.5 : 2, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    minimapCtx.globalAlpha = 1;
    minimapCtx.restore();
  },

  // Draw race boost gates — glowing lightning arches placed between checkpoints
  drawBoostGates(ctx, camera, boostGates, myCooldowns, raceActive, now) {
    if (!boostGates || !raceActive) return;

    for (const gate of boostGates) {
      const sx = gate.x - camera.x + camera.screenW / 2;
      const sy = gate.y - camera.y + camera.screenH / 2;
      if (sx < -80 || sx > camera.screenW + 80 || sy < -80 || sy > camera.screenH + 80) continue;

      const onCooldown = myCooldowns && myCooldowns[gate.id];
      const pulse = Math.sin(now * 0.005 + gate.id * 1.1) * 0.5 + 0.5;
      const arcPulse = Math.sin(now * 0.012 + gate.id * 0.7) * 0.5 + 0.5;
      const halfW = 30; // half distance between posts
      const postH = 50;

      ctx.save();
      ctx.globalAlpha = onCooldown ? 0.25 : (0.75 + pulse * 0.25);

      // Glow behind the gate arch
      if (!onCooldown) {
        const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, halfW + 16);
        grad.addColorStop(0, 'rgba(255, 240, 50, 0.35)');
        grad.addColorStop(1, 'rgba(255, 200, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(sx, sy, halfW + 16, postH * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Left post
      ctx.shadowColor = onCooldown ? '#888800' : '#ffff44';
      ctx.shadowBlur = onCooldown ? 4 : (8 + pulse * 8);
      ctx.fillStyle = onCooldown ? '#555500' : '#ffcc00';
      ctx.fillRect(sx - halfW - 5, sy - postH * 0.5, 10, postH);
      // Post top cap
      ctx.beginPath();
      ctx.arc(sx - halfW, sy - postH * 0.5, 5, 0, Math.PI * 2);
      ctx.fill();

      // Right post
      ctx.fillRect(sx + halfW - 5, sy - postH * 0.5, 10, postH);
      ctx.beginPath();
      ctx.arc(sx + halfW, sy - postH * 0.5, 5, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal connecting bar at top
      ctx.fillRect(sx - halfW - 5, sy - postH * 0.5 - 5, halfW * 2 + 10, 5);

      // Animated electric arc between the posts
      if (!onCooldown) {
        const arcY = sy - postH * 0.5 - 3; // top of arch
        const segments = 8;
        const segW = (halfW * 2) / segments;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 + arcPulse;
        ctx.shadowColor = '#aaffff';
        ctx.shadowBlur = 6;
        ctx.globalAlpha = 0.6 + arcPulse * 0.4;
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const px = sx - halfW + i * segW;
          const offset = (i === 0 || i === segments) ? 0 : (Math.sin(now * 0.015 + i * 1.57 + gate.id) * 8);
          if (i === 0) ctx.moveTo(px, arcY + offset);
          else ctx.lineTo(px, arcY + offset);
        }
        ctx.stroke();

        // Second arc strand (offset in time for shimmer)
        ctx.strokeStyle = '#ffff88';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const px = sx - halfW + i * segW;
          const offset = (i === 0 || i === segments) ? 0 : (Math.sin(now * 0.013 + i * 2.1 + gate.id + 1.5) * 6);
          if (i === 0) ctx.moveTo(px, arcY + offset);
          else ctx.lineTo(px, arcY + offset);
        }
        ctx.stroke();
      }

      // Label
      ctx.shadowBlur = 0;
      ctx.globalAlpha = onCooldown ? 0.3 : 1;
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = onCooldown ? '#888800' : '#ffff44';
      ctx.fillText(onCooldown ? '⚡ USED' : '⚡ BOOST', sx, sy + postH * 0.5 + 14);

      ctx.restore();
    }
  },

  // Draw boost gate dots on minimap
  drawBoostGatesOnMinimap(minimapCtx, worldData, boostGates, raceActive, now) {
    if (!boostGates || !raceActive) return;
    const mw = 100 / worldData.width;
    const mh = 100 / worldData.height;
    const pulse = Math.sin(now * 0.005) * 0.3 + 0.7;
    minimapCtx.globalAlpha = pulse * 0.8;
    minimapCtx.fillStyle = '#ffff44';
    for (const gate of boostGates) {
      const gx = gate.x * mw;
      const gy = gate.y * mh;
      minimapCtx.beginPath();
      minimapCtx.arc(gx, gy, 1.5, 0, Math.PI * 2);
      minimapCtx.fill();
    }
    minimapCtx.globalAlpha = 1;
  },

  // Draw manhole covers on the surface map
  drawManholes(ctx, camera, manholes, nearManholeId, inSewer) {
    if (!manholes) return;
    for (const mh of manholes) {
      const sx = mh.x - camera.x + camera.screenW / 2;
      const sy = mh.y - camera.y + camera.screenH / 2;
      if (sx < -30 || sx > camera.screenW + 30 || sy < -30 || sy > camera.screenH + 30) continue;

      const glowing = (nearManholeId === mh.id);
      Sprites.drawManholeCover(ctx, sx, sy, glowing);

      // Label near glowing one
      if (glowing) {
        ctx.save();
        ctx.font = 'bold 10px Courier New';
        ctx.textAlign = 'center';
        const label = inSewer ? '⬆ Press [E] to surface' : '⬇ Press [E] to enter sewer';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(label, sx, sy - 20);
        ctx.fillStyle = '#44ffaa';
        ctx.fillText(label, sx, sy - 20);
        ctx.restore();
      }
    }
  },

  // Draw the full sewer environment overlay (when player is underground)
  drawSewerOverlay(ctx, camera, selfBird, sewerRats, sewerLoot, now) {
    const sw = camera.screenW, sh = camera.screenH;
    const px = sw / 2, py = sh / 2;
    const sightR = 320;

    // === Use offscreen canvas so destination-out doesn't destroy main canvas ===
    if (!this._sewerCanvas || this._sewerCanvas.width !== sw || this._sewerCanvas.height !== sh) {
      this._sewerCanvas = document.createElement('canvas');
      this._sewerCanvas.width = sw;
      this._sewerCanvas.height = sh;
      this._sewerCtx = this._sewerCanvas.getContext('2d');
    }
    const sc = this._sewerCtx;
    sc.clearRect(0, 0, sw, sh);

    // Fill entire offscreen canvas with dark sewer colour
    sc.fillStyle = 'rgba(5, 18, 8, 0.93)';
    sc.fillRect(0, 0, sw, sh);

    // Punch a transparent sight circle using destination-out
    sc.globalCompositeOperation = 'destination-out';
    const clearGrad = sc.createRadialGradient(px, py, 0, px, py, sightR);
    clearGrad.addColorStop(0,   'rgba(0,0,0,1)');
    clearGrad.addColorStop(0.65,'rgba(0,0,0,0.88)');
    clearGrad.addColorStop(1,   'rgba(0,0,0,0)');
    sc.fillStyle = clearGrad;
    sc.beginPath();
    sc.arc(px, py, sightR, 0, Math.PI * 2);
    sc.fill();
    sc.globalCompositeOperation = 'source-over';

    // Blit offscreen darkness onto main canvas
    ctx.drawImage(this._sewerCanvas, 0, 0);

    // === Green sewer tint over the visible area ===
    ctx.save();
    ctx.fillStyle = 'rgba(30, 80, 40, 0.15)';
    ctx.beginPath();
    ctx.arc(px, py, sightR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // === Dripping water particles (atmospheric) ===
    ctx.save();
    for (let i = 0; i < 12; i++) {
      const seed = i * 137.5;
      const drip_x = ((seed * 71 + now * 0.02) % sw);
      const drip_y = ((now * (0.3 + (seed % 0.5)) + seed * 200) % (sightR * 2)) + py - sightR;
      const alpha = 0.25 * Math.abs(Math.sin(now * 0.002 + seed));
      const dist = Math.sqrt((drip_x - px) * (drip_x - px) + (drip_y - py) * (drip_y - py));
      if (dist > sightR * 0.82) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#66cc88';
      ctx.beginPath();
      ctx.arc(drip_x, drip_y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(drip_x - 0.5, drip_y, 1, 5);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // === Sewer loot caches (visible through darkness) ===
    if (sewerLoot) {
      for (const loot of sewerLoot) {
        const sx = loot.x - camera.x + sw / 2;
        const sy = loot.y - camera.y + sh / 2;
        const dist = Math.sqrt((sx - px) * (sx - px) + (sy - py) * (sy - py));
        if (dist > sightR + 40) continue;
        Sprites.drawSewerTreasure(ctx, sx, sy, loot.value, now);
      }
    }

    // === Sewer rats (visible through darkness) ===
    if (sewerRats) {
      for (const rat of sewerRats) {
        const sx = rat.x - camera.x + sw / 2;
        const sy = rat.y - camera.y + sh / 2;
        const dist = Math.sqrt((sx - px) * (sx - px) + (sy - py) * (sy - py));
        if (dist > sightR + 50) continue;
        Sprites.drawSewerRat(ctx, sx, sy, rat.rotation, rat.state, now);
      }
    }

    // === SEWER HUD — top banner ===
    ctx.save();
    ctx.fillStyle = 'rgba(0, 60, 20, 0.85)';
    ctx.strokeStyle = '#44ff88';
    ctx.lineWidth = 1.5;
    const hudW = 260, hudH = 28;
    const hudX = (sw - hudW) / 2;
    ctx.beginPath();
    ctx.roundRect(hudX, 8, hudW, hudH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#44ff88';
    const ratCount = sewerRats ? sewerRats.length : 0;
    ctx.fillText('🐀 UNDERGROUND  ·  ' + ratCount + ' rat' + (ratCount !== 1 ? 's' : '') + ' nearby', sw / 2, 27);
    ctx.restore();
  },

  // Manhole dots on minimap
  drawManholesOnMinimap(minimapCtx, worldData, manholes, inSewer) {
    if (!manholes || !worldData) return;
    const mw = 100 / worldData.width;
    const mh = 100 / worldData.height;
    for (const hole of manholes) {
      const sx = hole.x * mw;
      const sy = hole.y * mh;
      minimapCtx.globalAlpha = inSewer ? 0.9 : 0.5;
      minimapCtx.fillStyle = inSewer ? '#44ff88' : '#668866';
      minimapCtx.beginPath();
      minimapCtx.arc(sx, sy, 2, 0, Math.PI * 2);
      minimapCtx.fill();
    }
    minimapCtx.globalAlpha = 1;
  },

  // Draw golden egg nest delivery zones (glowing gold rings on the map)
  drawEggNestZones(ctx, camera, nestZones, t) {
    if (!nestZones || !nestZones.length) return;
    for (const nest of nestZones) {
      const sx = nest.x - camera.x + camera.screenW / 2;
      const sy = nest.y - camera.y + camera.screenH / 2;
      if (sx < -150 || sx > camera.screenW + 150 || sy < -150 || sy > camera.screenH + 150) continue;

      const pulse = 0.55 + 0.45 * Math.sin(t * 2.2 + nest.x * 0.003);

      // Filled area
      ctx.beginPath();
      ctx.arc(sx, sy, nest.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 210, 0, ${0.06 + 0.05 * pulse})`;
      ctx.fill();

      // Pulsing border ring
      ctx.beginPath();
      ctx.arc(sx, sy, nest.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + 0.4 * pulse})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(sx, sy, nest.r + 6 + 4 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 200, 0, ${0.18 * pulse})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 230, 50, 0.9)';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText('🪺 DELIVER HERE', sx, sy - nest.r - 6);
      ctx.restore();
    }
  },

  // Draw golden eggs lying on the ground (unclaimed)
  drawGoldenEggs(ctx, camera, eggs, t) {
    if (!eggs || !eggs.length) return;
    for (const egg of eggs) {
      if (egg.delivered || egg.carrierId) continue; // Only draw uncarried eggs
      const sx = egg.x - camera.x + camera.screenW / 2;
      const sy = egg.y - camera.y + camera.screenH / 2;
      if (sx < -60 || sx > camera.screenW + 60 || sy < -60 || sy > camera.screenH + 60) continue;

      Sprites.drawGoldenEgg(ctx, sx, sy, 13, t);

      // "EGG" label below
      ctx.save();
      ctx.font = 'bold 10px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 3;
      ctx.fillText('EGG', sx, sy + 25);
      ctx.restore();
    }
  },

  // Draw egg indicator above a bird that is carrying a golden egg
  drawCarriedEggIndicator(ctx, bx, by, t) {
    const bobY = -38 + 3 * Math.sin(t * 4);
    Sprites.drawGoldenEgg(ctx, bx, by + bobY, 8, t);

    // "EGG!" label
    ctx.save();
    ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 3;
    ctx.fillText('EGG!', bx, by + bobY - 16);
    ctx.restore();
  },

  // Draw egg scramble minimap indicators
  drawEggScrambleOnMinimap(minimapCtx, worldData, eggScramble, eggNestZones) {
    if (!worldData) return;
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const sx = mw / worldData.width;
    const sy = mh / worldData.height;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);

    // Draw nest zones as small gold dots
    if (eggNestZones) {
      for (const nest of eggNestZones) {
        minimapCtx.globalAlpha = 0.55 + 0.25 * pulse;
        minimapCtx.fillStyle = '#ffd700';
        minimapCtx.beginPath();
        minimapCtx.arc(nest.x * sx, nest.y * sy, 3, 0, Math.PI * 2);
        minimapCtx.fill();
      }
    }

    // Draw eggs (unclaimed = gold, carried = brighter/pulsing)
    if (eggScramble && eggScramble.eggs) {
      for (const egg of eggScramble.eggs) {
        if (egg.delivered) continue;
        minimapCtx.globalAlpha = egg.carrierId ? (0.7 + 0.3 * pulse) : 0.85;
        minimapCtx.fillStyle = egg.carrierId ? '#ff8c00' : '#ffd700';
        minimapCtx.beginPath();
        minimapCtx.arc(egg.x * sx, egg.y * sy, egg.carrierId ? 4 : 3, 0, Math.PI * 2);
        minimapCtx.fill();
        if (egg.carrierId) {
          // Ring around carried egg
          minimapCtx.globalAlpha = 0.4 * pulse;
          minimapCtx.strokeStyle = '#ffcc00';
          minimapCtx.lineWidth = 1;
          minimapCtx.beginPath();
          minimapCtx.arc(egg.x * sx, egg.y * sy, 6, 0, Math.PI * 2);
          minimapCtx.stroke();
        }
      }
    }
    minimapCtx.globalAlpha = 1;
  },

  // Draw predator territory danger zones and warning signs on the main canvas
  drawPredatorTerritories(ctx, camera, worldData, territoryPredators, now) {
    if (!worldData || !worldData.predatorTerritories) return;
    const t = now / 1000;

    const zones = [
      { key: 'hawk', def: worldData.predatorTerritories.hawk, color: '#ff5500', label: "⚠️ HAWK'S NEST", icon: '🦅' },
      { key: 'cat',  def: worldData.predatorTerritories.cat,  color: '#cc44ff', label: '⚠️ CAT ALLEY',    icon: '🐱' },
    ];

    for (const { key, def, color, label, icon } of zones) {
      const pred = territoryPredators ? territoryPredators[key] : null;
      const alive = pred !== null;

      const sx = def.x - camera.x + camera.screenW / 2;
      const sy = def.y - camera.y + camera.screenH / 2;
      const sw = def.w;
      const sh = def.h;

      // Skip if entirely off-screen
      if (sx + sw < -50 || sy + sh < -50 || sx > camera.screenW + 50 || sy > camera.screenH + 50) continue;

      ctx.save();

      // Danger zone fill — pulsing red-tinted overlay
      const pulse = 0.04 + 0.02 * Math.sin(t * 2.5);
      ctx.globalAlpha = alive ? pulse : 0.04;
      ctx.fillStyle = alive ? color : '#888888';
      ctx.fillRect(sx, sy, sw, sh);

      // Border — dashed danger stripe
      ctx.globalAlpha = alive ? (0.5 + 0.2 * Math.sin(t * 3)) : 0.2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);
      ctx.setLineDash([]);

      ctx.globalAlpha = 1;

      // Warning label at zone top
      const cx = sx + sw / 2;
      const labelY = sy + 28;

      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(label, cx + 1, labelY + 1);
      // Label
      ctx.fillStyle = alive ? color : '#888';
      ctx.fillText(label, cx, labelY);

      // Sub-label
      if (alive) {
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('ENTER AT YOUR OWN RISK', cx, labelY + 16);
      } else {
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(150,150,150,0.6)';
        ctx.fillText('TERRITORY CLEAR — respawning...', cx, labelY + 16);
      }

      // HP bar if predator is alive and in hunting state
      if (pred && pred.state === 'hunting') {
        const barW = Math.min(120, sw - 20);
        const barX = cx - barW / 2;
        const barY = sy + sh - 20;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, 8);
        const hpFrac = pred.hp / pred.maxHp;
        ctx.fillStyle = hpFrac > 0.5 ? '#ff4400' : '#ff0000';
        ctx.fillRect(barX, barY, barW * hpFrac, 6);
        ctx.font = '9px monospace';
        ctx.fillStyle = '#ffdddd';
        ctx.fillText(`${icon} HP: ${pred.hp}/${pred.maxHp}`, cx, barY - 7);
      }

      ctx.restore();
    }
  },

  // Draw the Pigeonhole Slots Casino building
  drawCasino(ctx, camera, casinoPos, jackpot, nearCasino, now) {
    if (!casinoPos) return;
    const cx = casinoPos.x - camera.x + camera.screenW / 2;
    const cy = casinoPos.y - camera.y + camera.screenH / 2;
    const t = now / 1000;

    // Neon flicker (fast oscillation)
    const flicker = 0.85 + 0.15 * Math.sin(t * 12.7) * Math.cos(t * 7.3);
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.5);

    ctx.save();

    // Building shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(cx - 68 + 5, cy - 88 + 5, 136, 110);

    // Main building body
    ctx.fillStyle = '#1a0025';
    ctx.fillRect(cx - 68, cy - 88, 136, 110);

    // Building border (neon magenta)
    ctx.strokeStyle = `rgba(255,68,255,${flicker})`;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cx - 68, cy - 88, 136, 110);

    // Outer neon glow
    ctx.shadowColor = '#ff44ff';
    ctx.shadowBlur = 18 * flicker;
    ctx.strokeStyle = `rgba(255,100,255,${0.4 * flicker})`;
    ctx.lineWidth = 8;
    ctx.strokeRect(cx - 68, cy - 88, 136, 110);
    ctx.shadowBlur = 0;

    // Sign background
    ctx.fillStyle = '#2a0035';
    ctx.fillRect(cx - 60, cy - 82, 120, 30);
    ctx.strokeStyle = `rgba(255,68,255,${flicker})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 60, cy - 82, 120, 30);

    // Sign text
    ctx.shadowColor = '#ff44ff';
    ctx.shadowBlur = 10 * flicker;
    ctx.fillStyle = `rgba(255,180,255,${flicker})`;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PIGEONHOLE SLOTS', cx, cy - 61);

    // Slot machine icons on facade (3 mini slot faces)
    const slotEmojis = ['🎰', '🎰', '🎰'];
    ctx.font = '16px serif';
    ctx.shadowBlur = 6 * flicker;
    ctx.shadowColor = '#ff88ff';
    for (let i = 0; i < 3; i++) {
      ctx.fillText(slotEmojis[i], cx - 36 + i * 36, cy - 30);
    }
    ctx.shadowBlur = 0;

    // Flashing neon "OPEN 24/7" sign at bottom
    const signAlpha = 0.5 + 0.5 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(255,220,0,${signAlpha})`;
    ctx.font = 'bold 8px monospace';
    ctx.fillText('OPEN 24/7', cx, cy - 4);

    // Jackpot display (gold crown at bottom of building)
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = `rgba(255,215,0,${0.8 + 0.2 * pulse})`;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 6 * pulse;
    ctx.fillText(`👑 ${jackpot}c`, cx, cy + 16);
    ctx.shadowBlur = 0;

    // Neon entrance arch at the base
    ctx.strokeStyle = `rgba(255,68,255,${flicker})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + 22, 20, Math.PI, 0);
    ctx.stroke();

    // Pulsing pink aura when player is near
    if (nearCasino) {
      ctx.globalAlpha = 0.15 * pulse;
      ctx.fillStyle = '#ff44ff';
      ctx.beginPath();
      ctx.arc(cx, cy - 33, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Label
    ctx.font = '9px monospace';
    ctx.fillStyle = `rgba(255,140,255,${0.6 + 0.4 * flicker})`;
    ctx.fillText('🎰 Casino', cx, cy + 34);
    if (nearCasino) {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ff88ff';
      ctx.fillText('[C] to play', cx, cy + 46);
    }

    ctx.restore();
  },

  // Draw casino dot on minimap
  drawCasinoOnMinimap(minimapCtx, worldData, jackpot) {
    if (!worldData || !worldData.casinoPos) return;
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const sx = mw / worldData.width;
    const sy = mh / worldData.height;
    const cx = worldData.casinoPos.x * sx;
    const cy = worldData.casinoPos.y * sy;
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 300);

    minimapCtx.save();
    minimapCtx.globalAlpha = pulse;
    minimapCtx.fillStyle = '#ff44ff';
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, 3, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.globalAlpha = 1;
    minimapCtx.font = '7px sans-serif';
    minimapCtx.fillStyle = '#ff88ff';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('🎰', cx, cy - 4);
    minimapCtx.restore();
  },

  // ── Bird Tattoo Parlor ──────────────────────────────────────
  drawTattooParlor(ctx, camera, parlorPos, nearParlor, now) {
    if (!parlorPos) return;
    const px = parlorPos.x - camera.x + camera.screenW / 2;
    const py = parlorPos.y - camera.y + camera.screenH / 2;
    const t = now / 1000;

    const pulse = 0.65 + 0.35 * Math.sin(t * 2.2);
    const flicker = 0.8 + 0.2 * Math.sin(t * 8.4) * Math.cos(t * 5.1);

    ctx.save();

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(px - 52 + 4, py - 72 + 4, 104, 90);

    // Main building body — deep indigo/purple
    ctx.fillStyle = '#1a0035';
    ctx.fillRect(px - 52, py - 72, 104, 90);

    // Building border — neon pink/purple
    ctx.shadowColor = '#ff44cc';
    ctx.shadowBlur = 14 * flicker;
    ctx.strokeStyle = `rgba(255,68,200,${flicker})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 52, py - 72, 104, 90);
    ctx.shadowBlur = 0;

    // Candy-stripe barbershop pole (left side)
    const poleX = px - 44;
    const poleTop = py - 66;
    const poleH = 78;
    ctx.fillStyle = '#fff';
    ctx.fillRect(poleX - 4, poleTop, 8, poleH);
    // Animated red/blue stripes rotating down the pole
    const stripeH = 10;
    const offset = (t * 22) % (stripeH * 2);
    const colors = ['#ff2244', '#4488ff'];
    for (let i = -2; i < poleH / stripeH + 2; i++) {
      const sy2 = poleTop + i * stripeH * 2 + offset;
      ctx.fillStyle = colors[i & 1] || colors[0];
      ctx.fillRect(poleX - 4, Math.max(poleTop, sy2), 8, Math.min(stripeH, poleTop + poleH - Math.max(poleTop, sy2)));
      ctx.fillStyle = colors[(i + 1) & 1] || colors[1];
      ctx.fillRect(poleX - 4, Math.max(poleTop, sy2 + stripeH), 8, Math.min(stripeH, poleTop + poleH - Math.max(poleTop, sy2 + stripeH)));
    }
    // Pole cap
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.arc(poleX, poleTop, 4, 0, Math.PI * 2);
    ctx.fill();

    // Neon sign background
    ctx.fillStyle = '#250040';
    ctx.fillRect(px - 40, py - 66, 88, 20);
    ctx.strokeStyle = `rgba(255,100,220,${flicker})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 40, py - 66, 88, 20);

    // Sign text
    ctx.shadowColor = '#ff44cc';
    ctx.shadowBlur = 8 * flicker;
    ctx.fillStyle = `rgba(255,160,255,${flicker})`;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TATTOO PARLOR', px, py - 52);
    ctx.shadowBlur = 0;

    // Decorative tattoo emojis on building face
    ctx.font = '12px serif';
    const decoEmojis = ['💀', '🔥', '💎'];
    ctx.shadowBlur = 5 * pulse;
    ctx.shadowColor = '#ff88ff';
    for (let i = 0; i < 3; i++) {
      ctx.fillText(decoEmojis[i], px - 24 + i * 24, py - 28);
    }
    ctx.shadowBlur = 0;

    // Pulsing "OPEN" sign
    const openAlpha = 0.5 + 0.5 * Math.sin(t * 3.1);
    ctx.fillStyle = `rgba(100,255,100,${openAlpha})`;
    ctx.font = 'bold 7px monospace';
    ctx.fillText('● OPEN', px, py - 10);

    // Proximity aura + prompt
    if (nearParlor) {
      ctx.globalAlpha = 0.12 * pulse;
      ctx.fillStyle = '#ff44cc';
      ctx.beginPath();
      ctx.arc(px, py - 27, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ff88ff';
      ctx.shadowColor = '#ff44cc';
      ctx.shadowBlur = 6;
      ctx.fillText('[P] Tattoo Parlor', px, py + 26);
      ctx.shadowBlur = 0;
    } else {
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(200,100,200,0.7)';
      ctx.fillText('🎨 Tattoo Parlor', px, py + 22);
    }

    ctx.restore();
  },

  drawTattooParlourOnMinimap(minimapCtx, worldData) {
    if (!worldData || !worldData.tattooParlor) return;
    const pos = worldData.tattooParlor.pos;
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const sx = mw / worldData.width;
    const sy = mh / worldData.height;
    const px = pos.x * sx;
    const py = pos.y * sy;
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 400);

    minimapCtx.save();
    minimapCtx.globalAlpha = pulse;
    minimapCtx.fillStyle = '#ff44cc';
    minimapCtx.beginPath();
    minimapCtx.arc(px, py, 3, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.globalAlpha = 1;
    minimapCtx.font = '7px sans-serif';
    minimapCtx.fillStyle = '#ff88ff';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('🎨', px, py - 4);
    minimapCtx.restore();
  },

  // ===== CITY HALL =====
  // Grand civic building — hosts the Dethronement Pool Bounty Board ([V] to open)
  drawCityHall(ctx, camera, pos, poolAmount, nearCityHall, now) {
    if (!pos) return;
    const cx = pos.x - camera.x + camera.screenW / 2;
    const cy = pos.y - camera.y + camera.screenH / 2;
    const t = now / 1000;
    const pulse = 0.6 + 0.4 * Math.sin(t * 1.8);
    const poolPulse = poolAmount > 0 ? (0.5 + 0.5 * Math.sin(t * 3.5)) : 0;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(cx - 72 + 5, cy - 95 + 5, 144, 120);

    // Main building body — marble white/cream
    const grad = ctx.createLinearGradient(cx - 72, cy - 95, cx + 72, cy + 25);
    grad.addColorStop(0, '#e8e0d0');
    grad.addColorStop(1, '#c8c0b0');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 72, cy - 95, 144, 120);

    // Roof / pediment (triangular)
    ctx.beginPath();
    ctx.moveTo(cx - 80, cy - 95);
    ctx.lineTo(cx, cy - 130);
    ctx.lineTo(cx + 80, cy - 95);
    ctx.closePath();
    ctx.fillStyle = '#d8d0c0';
    ctx.fill();
    ctx.strokeStyle = '#a09080';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Columns (6 classical columns)
    ctx.fillStyle = '#f0e8d8';
    ctx.strokeStyle = '#b0a090';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const colX = cx - 62 + i * 25;
      ctx.fillRect(colX - 4, cy - 90, 8, 115);
      ctx.strokeRect(colX - 4, cy - 90, 8, 115);
    }

    // Building border
    ctx.strokeStyle = '#a09080';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 72, cy - 95, 144, 120);

    // Sign panel at pediment
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(cx - 48, cy - 110, 96, 16);

    // "CITY HALL" text on pediment
    ctx.font = 'bold 9px serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 4;
    ctx.fillText('CITY HALL', cx, cy - 99);
    ctx.shadowBlur = 0;

    // Entrance door (centered, bottom)
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(cx - 12, cy - 18, 24, 40);
    // Door arch
    ctx.beginPath();
    ctx.arc(cx, cy - 18, 12, Math.PI, 0);
    ctx.fillStyle = '#3a2010';
    ctx.fill();

    // Bounty Pool display — gold glowing amount on the facade
    if (poolAmount > 0) {
      // Glowing red/gold background for pool display
      ctx.save();
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 12 * poolPulse;
      ctx.fillStyle = `rgba(80,20,0,${0.85})`;
      ctx.fillRect(cx - 44, cy - 75, 88, 22);
      ctx.strokeStyle = `rgba(255,${Math.floor(100 + 100 * poolPulse)},0,${0.8 + 0.2 * poolPulse})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 44, cy - 75, 88, 22);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = `rgba(255,${Math.floor(180 + 75 * poolPulse)},0,1)`;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 6 * poolPulse;
      ctx.fillText(`💀 POOL: ${poolAmount}c`, cx, cy - 59);
      ctx.restore();
    } else {
      // Neutral display when pool is empty
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(120,100,80,0.9)';
      ctx.fillText('BOUNTY BOARD', cx, cy - 62);
    }

    // Flag on top of pediment — flutters
    const flagWave = Math.sin(t * 4) * 5;
    ctx.fillStyle = '#cc2222';
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 130);
    ctx.lineTo(cx - 4, cy - 155);
    ctx.lineTo(cx + 18 + flagWave, cy - 148);
    ctx.lineTo(cx + 18 + flagWave * 0.6, cy - 142);
    ctx.lineTo(cx - 4, cy - 135);
    ctx.closePath();
    ctx.fill();

    // Flag pole
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 130);
    ctx.lineTo(cx - 4, cy - 160);
    ctx.stroke();

    // Proximity glow
    if (nearCityHall) {
      ctx.globalAlpha = 0.12 * pulse;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(cx, cy - 35, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Label
    ctx.font = '9px serif';
    ctx.fillStyle = 'rgba(200,180,140,0.9)';
    ctx.fillText('🏛 City Hall', cx, cy + 34);
    if (nearCityHall) {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 5;
      ctx.fillText('[V] Bounty Board', cx, cy + 46);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  },

  drawCityHallOnMinimap(minimapCtx, worldData, poolAmount) {
    if (!worldData || !worldData.cityHallPos) return;
    const pos = worldData.cityHallPos;
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const sx = mw / worldData.width;
    const sy = mh / worldData.height;
    const px = pos.x * sx;
    const py = pos.y * sy;
    const t = Date.now() / 1000;
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.5);

    minimapCtx.save();
    if (poolAmount > 0) {
      // Pool active — glowing red/gold dot
      minimapCtx.globalAlpha = pulse;
      minimapCtx.fillStyle = '#ff5500';
      minimapCtx.beginPath();
      minimapCtx.arc(px, py, 4, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.globalAlpha = 0.3 * pulse;
      minimapCtx.fillStyle = '#ff8800';
      minimapCtx.beginPath();
      minimapCtx.arc(px, py, 7, 0, Math.PI * 2);
      minimapCtx.fill();
    } else {
      // No pool — static gold dot
      minimapCtx.globalAlpha = 0.85;
      minimapCtx.fillStyle = '#ffd700';
      minimapCtx.beginPath();
      minimapCtx.arc(px, py, 3, 0, Math.PI * 2);
      minimapCtx.fill();
    }
    minimapCtx.globalAlpha = 1;
    minimapCtx.font = '7px sans-serif';
    minimapCtx.fillStyle = '#ffd700';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('🏛', px, py - 4);
    minimapCtx.restore();
  },

  // Draw predator territory zones on the minimap
  drawPredatorTerritoriesOnMinimap(minimapCtx, worldData, territoryPredators) {
    if (!worldData || !worldData.predatorTerritories) return;
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const sx = mw / worldData.width;
    const sy = mh / worldData.height;

    const zones = [
      { key: 'hawk', def: worldData.predatorTerritories.hawk, color: '#ff5500' },
      { key: 'cat',  def: worldData.predatorTerritories.cat,  color: '#cc44ff' },
    ];

    for (const { key, def, color } of zones) {
      const pred = territoryPredators ? territoryPredators[key] : null;
      const alive = pred !== null;

      // Draw zone border on minimap
      minimapCtx.globalAlpha = alive ? 0.5 : 0.2;
      minimapCtx.strokeStyle = color;
      minimapCtx.lineWidth = 1;
      minimapCtx.setLineDash([3, 3]);
      minimapCtx.strokeRect(def.x * sx, def.y * sy, def.w * sx, def.h * sy);
      minimapCtx.setLineDash([]);
      minimapCtx.globalAlpha = 1;

      // Draw predator dot
      if (pred) {
        const pdx = pred.x * sx;
        const pdy = pred.y * sy;
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 400);
        minimapCtx.globalAlpha = pred.state === 'hunting' ? pulse : 0.8;
        minimapCtx.fillStyle = color;
        minimapCtx.beginPath();
        minimapCtx.arc(pdx, pdy, pred.state === 'hunting' ? 4 : 2.5, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.globalAlpha = 1;
      }
    }
  },

  /**
   * Draw all gang nests in world space.
   * nests: array from gameState.gangNests
   */
  drawGangNests(ctx, camera, nests, selfGangId, now) {
    if (!nests || nests.length === 0) return;
    for (const nest of nests) {
      if (!nest.alive) continue;
      const sx = nest.x - camera.x;
      const sy = nest.y - camera.y;
      // Only draw nests within a reasonable view range
      if (sx < -120 || sx > (camera.screenW || 1400) + 120 || sy < -120 || sy > (camera.screenH || 900) + 120) continue;
      Sprites.drawGangNest(ctx, sx, sy, nest.gangColor, nest.gangTag, nest.hp, nest.maxHp, nest.isMyNest, now);
    }
  },

  /**
   * Draw gang nests on the minimap.
   */
  drawGangNestsOnMinimap(minimapCtx, worldData, nests, selfGangId, now) {
    if (!nests || nests.length === 0 || !worldData) return;
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const sx = mw / worldData.width;
    const sy = mh / worldData.height;
    const t = now / 1000;

    for (const nest of nests) {
      const px = nest.x * sx;
      const py = nest.y * sy;

      if (nest.alive) {
        const pulse = 0.7 + 0.3 * Math.sin(t * 2.5);
        // Outer glow for own nest
        if (nest.isMyNest) {
          minimapCtx.globalAlpha = 0.3 * pulse;
          minimapCtx.fillStyle = nest.gangColor;
          minimapCtx.beginPath();
          minimapCtx.arc(px, py, 6, 0, Math.PI * 2);
          minimapCtx.fill();
        }
        // Nest dot
        minimapCtx.globalAlpha = nest.isMyNest ? pulse : 0.85;
        minimapCtx.fillStyle = nest.gangColor;
        minimapCtx.beginPath();
        minimapCtx.arc(px, py, nest.isMyNest ? 4 : 3, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.globalAlpha = 1;
        // House emoji label
        minimapCtx.font = '7px sans-serif';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillText('🏠', px, py - 4);
      } else {
        // Destroyed nest — grey X
        minimapCtx.globalAlpha = 0.4;
        minimapCtx.fillStyle = '#666';
        minimapCtx.beginPath();
        minimapCtx.arc(px, py, 2.5, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.globalAlpha = 1;
      }
    }
  },

  // =====================================================================
  // HALL OF LEGENDS — Grand memorial hall north of the park
  // Shows the city's top prestige players as golden illuminated plaques
  // =====================================================================
  drawHallOfLegends(ctx, camera, pos, legendsData, nearHall, now) {
    if (!pos) return;
    const cx = pos.x - camera.x + camera.screenW / 2;
    const cy = pos.y - camera.y + camera.screenH / 2;
    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.4);
    const hasLegends = legendsData && legendsData.length > 0;
    const hasP5 = legendsData && legendsData.some(l => l.prestige >= 5);

    ctx.save();

    // Foundation shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(cx - 78 + 5, cy - 108 + 5, 156, 130);

    // Main building — dark marble with golden highlights
    const grad = ctx.createLinearGradient(cx - 78, cy - 108, cx + 78, cy + 22);
    grad.addColorStop(0, '#1a1408');
    grad.addColorStop(0.5, '#2a2010');
    grad.addColorStop(1, '#1a1408');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 78, cy - 108, 156, 130);

    // Golden aura if any P5 LEGEND is on the board
    if (hasP5) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18 * pulse;
      ctx.strokeStyle = `rgba(255,215,0,${0.6 + 0.4 * pulse})`;
    } else if (hasLegends) {
      ctx.strokeStyle = 'rgba(180,140,30,0.7)';
    } else {
      ctx.strokeStyle = 'rgba(90,70,20,0.6)';
    }
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 78, cy - 108, 156, 130);
    ctx.shadowBlur = 0;

    // Roof / pediment — triangular, very dark marble
    ctx.beginPath();
    ctx.moveTo(cx - 88, cy - 108);
    ctx.lineTo(cx, cy - 148);
    ctx.lineTo(cx + 88, cy - 108);
    ctx.closePath();
    ctx.fillStyle = '#120e04';
    ctx.fill();
    ctx.strokeStyle = hasP5 ? '#ffd700' : '#7a6020';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pediment inner triangle (decorative)
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy - 108);
    ctx.lineTo(cx, cy - 135);
    ctx.lineTo(cx + 70, cy - 108);
    ctx.closePath();
    ctx.strokeStyle = hasP5 ? 'rgba(255,215,0,0.4)' : 'rgba(120,90,20,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4 tall golden columns
    for (let i = 0; i < 4; i++) {
      const colX = cx - 52 + i * 35;
      const colGrad = ctx.createLinearGradient(colX - 5, 0, colX + 5, 0);
      colGrad.addColorStop(0, '#3a2a08');
      colGrad.addColorStop(0.4, '#8a6a18');
      colGrad.addColorStop(1, '#3a2a08');
      ctx.fillStyle = colGrad;
      ctx.fillRect(colX - 5, cy - 102, 10, 124);
      ctx.strokeStyle = '#5a4010';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(colX - 5, cy - 102, 10, 124);
      // Column capital
      ctx.fillStyle = '#8a6818';
      ctx.fillRect(colX - 7, cy - 102, 14, 6);
    }

    // Building border
    ctx.strokeStyle = hasP5 ? 'rgba(255,215,0,0.5)' : 'rgba(100,80,20,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 78, cy - 108, 156, 130);

    // "HALL OF LEGENDS" carved text on pediment
    ctx.font = 'bold 8px serif';
    ctx.textAlign = 'center';
    if (hasP5) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffd700';
    } else {
      ctx.fillStyle = '#c8a830';
    }
    ctx.fillText('HALL OF LEGENDS', cx, cy - 115);
    ctx.shadowBlur = 0;

    // ⚜️ crest in the pediment
    ctx.font = '12px serif';
    ctx.fillStyle = hasP5 ? '#ffd700' : '#8a6818';
    if (hasP5) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 6; }
    ctx.fillText('⚜️', cx, cy - 130);
    ctx.shadowBlur = 0;

    // Entrance arch door
    ctx.fillStyle = '#0a0804';
    ctx.fillRect(cx - 14, cy - 22, 28, 44);
    ctx.beginPath();
    ctx.arc(cx, cy - 22, 14, Math.PI, 0);
    ctx.fillStyle = '#050302';
    ctx.fill();
    // Door arch glow if near
    if (nearHall) {
      ctx.strokeStyle = `rgba(255,215,0,${0.5 + 0.5 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 22, 14, Math.PI, 0);
      ctx.stroke();
    }

    // ── Plaques Panel ──
    // Gold-tinted inner panel (inside the columns)
    ctx.fillStyle = 'rgba(30,20,5,0.92)';
    ctx.fillRect(cx - 60, cy - 96, 120, 72);
    ctx.strokeStyle = 'rgba(120,90,15,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 60, cy - 96, 120, 72);

    if (!hasLegends) {
      // Empty hall message
      ctx.font = '7px serif';
      ctx.fillStyle = 'rgba(120,90,30,0.7)';
      ctx.fillText('No Legends yet...', cx, cy - 57);
      ctx.fillText('Prestige to be immortalized', cx, cy - 47);
    } else {
      // Draw top-5 prestige plaques
      const badges = ['', '⚜️', '⚜️⚜️', '⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️', '⚜️⚜️⚜️⚜️⚜️'];
      const ROW_H = 13;
      const startY = cy - 92;
      for (let i = 0; i < Math.min(legendsData.length, 5); i++) {
        const entry = legendsData[i];
        const ry = startY + i * ROW_H;
        const isLeg = entry.prestige >= 5;

        // Plaque background (alternate tones)
        ctx.fillStyle = i % 2 === 0 ? 'rgba(40,28,5,0.6)' : 'rgba(25,18,3,0.6)';
        ctx.fillRect(cx - 58, ry, 116, ROW_H);

        if (isLeg) {
          ctx.strokeStyle = `rgba(255,215,0,${0.3 + 0.3 * pulse})`;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(cx - 58, ry, 116, ROW_H);
        }

        // Rank number
        ctx.font = 'bold 7px Courier New';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#6a5010';
        ctx.fillText(`#${i + 1}`, cx - 56, ry + ROW_H - 3);

        // Prestige badges
        ctx.font = '7px serif';
        ctx.textAlign = 'left';
        if (isLeg) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 3; }
        ctx.fillStyle = isLeg ? '#ffd700' : '#c8a030';
        ctx.fillText(badges[Math.min(entry.prestige, 5)], cx - 44, ry + ROW_H - 3);
        ctx.shadowBlur = 0;

        // Eagle feather badge
        let nameX = cx - 18;
        if (entry.eagleFeather) {
          ctx.font = '7px serif';
          ctx.fillText('🪶', nameX, ry + ROW_H - 3);
          nameX += 10;
        }

        // Name
        ctx.font = isLeg ? 'bold 7px Courier New' : '7px Courier New';
        ctx.textAlign = 'left';
        if (isLeg) {
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 2;
          ctx.fillStyle = '#ffd700';
        } else {
          ctx.fillStyle = '#e0c060';
        }
        // Clip name to avoid overflow
        const nameStr = entry.name.length > 12 ? entry.name.slice(0, 11) + '…' : entry.name;
        ctx.fillText(nameStr, nameX, ry + ROW_H - 3);
        ctx.shadowBlur = 0;

        // Gang tag if any
        if (entry.gangTag) {
          ctx.font = '6px Courier New';
          ctx.textAlign = 'right';
          ctx.fillStyle = entry.gangColor || '#ff9944';
          ctx.fillText(`[${entry.gangTag}]`, cx + 56, ry + ROW_H - 3);
        }
      }
    }

    // Proximity prompt
    if (nearHall) {
      ctx.font = 'bold 9px Courier New';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffd700';
      ctx.fillText('🏛 HALL OF LEGENDS', cx, cy + 30);
      ctx.shadowBlur = 0;
    } else {
      ctx.font = '8px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(180,140,30,0.7)';
      ctx.fillText('Hall of Legends', cx, cy + 30);
    }

    ctx.restore();
  },

  drawHallOfLegendsOnMinimap(minimapCtx, worldData, hallPos, hasLegends, now) {
    if (!hallPos || !worldData) return;
    const msx = minimapCtx.canvas.width / worldData.width;
    const msy = minimapCtx.canvas.height / worldData.height;
    const px = hallPos.x * msx;
    const py = hallPos.y * msy;
    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.0);

    minimapCtx.save();
    if (hasLegends) {
      minimapCtx.shadowColor = '#ffd700';
      minimapCtx.shadowBlur = 4 * pulse;
    }
    minimapCtx.fillStyle = hasLegends ? '#ffd700' : '#8a6818';
    minimapCtx.beginPath();
    minimapCtx.arc(px, py, hasLegends ? 3.5 : 2.5, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;
    minimapCtx.font = '8px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('🏛', px, py - 4);
    minimapCtx.restore();
  },

  // Mystery Crate — draw in world space
  drawMysteryCrate(ctx, camera, crate, now) {
    if (!crate) return;
    const sx = crate.x - camera.x + camera.screenW / 2;
    const sy = crate.y - camera.y + camera.screenH / 2;
    // Off-screen culling with generous margin for parachute
    if (sx < -60 || sx > camera.screenW + 60 || sy < -80 || sy > camera.screenH + 60) return;
    Sprites.drawMysteryCrate(ctx, sx, sy, now);
  },

  // Mystery Crate — pulsing ? dot on minimap
  drawMysteryCrateOnMinimap(minimapCtx, worldData, crate, now) {
    if (!crate) return;
    const scale = minimapCtx.canvas.width / worldData.width;
    const px = crate.x * scale;
    const py = crate.y * scale;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
    minimapCtx.save();
    minimapCtx.shadowColor = '#ffd700';
    minimapCtx.shadowBlur = 6 + 4 * pulse;
    minimapCtx.fillStyle = `rgba(255,210,0,${0.8 + 0.2 * pulse})`;
    minimapCtx.beginPath();
    minimapCtx.arc(px, py, 4 + pulse * 2, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;
    minimapCtx.font = '8px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('?', px, py + 3);
    minimapCtx.restore();
  },
};
