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
        // Witness Protection: hidden from other players' minimaps
        if (b.witnessProtectionActive) continue;
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

  // Draw Aurora Borealis — flowing colored light ribbons across the night sky.
  // Called in screen-space before the darkness overlay so the ribbons glow through.
  // auroraData: { endsAt, intensity } from server state (or null)
  // dayTime: 0–1 (aurora only visible during night phase ~0.45–0.75)
  drawAurora(ctx, camera, dayTime, auroraData) {
    if (!auroraData) return;

    // Compute night visibility factor (fades in/out with darkness)
    let nightAlpha = 0;
    if (dayTime >= 0.45 && dayTime < 0.55) {
      nightAlpha = (dayTime - 0.45) / 0.10; // fade in
    } else if (dayTime >= 0.55 && dayTime < 0.70) {
      nightAlpha = 1.0;
    } else if (dayTime >= 0.70 && dayTime < 0.80) {
      nightAlpha = 1.0 - (dayTime - 0.70) / 0.10; // fade out at dawn
    }
    if (nightAlpha <= 0.02) return;

    // Fade near expiry (last 30 seconds)
    const now = Date.now();
    const remaining = auroraData.endsAt - now;
    const fadeFactor = remaining < 30000 ? remaining / 30000 : 1.0;
    const alpha = nightAlpha * fadeFactor;
    if (alpha <= 0.02) return;

    const sw = camera.screenW;
    const sh = camera.screenH;
    const t = now * 0.0003; // slow time base for animation

    ctx.save();

    // Aurora ribbons — 5 bands of flowing colored light across the top half of the sky
    const RIBBON_DEFS = [
      { yBase: 0.05, amplitude: 0.06, speed: 0.8,  hue1: 140, hue2: 160, width: 0.10, bright: 0.9 }, // emerald green core
      { yBase: 0.12, amplitude: 0.07, speed: 0.55, hue1: 165, hue2: 185, width: 0.08, bright: 0.7 }, // teal
      { yBase: 0.08, amplitude: 0.05, speed: 1.2,  hue1: 270, hue2: 300, width: 0.07, bright: 0.6 }, // violet
      { yBase: 0.18, amplitude: 0.05, speed: 0.65, hue1: 150, hue2: 170, width: 0.09, bright: 0.5 }, // soft green-teal
      { yBase: 0.03, amplitude: 0.04, speed: 1.0,  hue1: 200, hue2: 230, width: 0.06, bright: 0.45 }, // ice blue
    ];

    for (const ribbon of RIBBON_DEFS) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter'; // additive blending = glowing aurora look
      ctx.globalAlpha = alpha * ribbon.bright * 0.55;

      // Build a wavy path across the screen width
      const STEPS = 80;
      const wHalf = sh * ribbon.width * 0.5;

      for (let pass = 0; pass < 2; pass++) {
        // Two passes: inner brighter core, outer softer fringe
        const passAlpha = pass === 0 ? 1.0 : 0.45;
        const passWidth = pass === 0 ? wHalf * 0.5 : wHalf;

        ctx.beginPath();
        for (let i = 0; i <= STEPS; i++) {
          const xFrac = i / STEPS;
          const px = xFrac * sw;
          // Sine wave baseline with secondary harmonics for organic ripple
          const wave = Math.sin(xFrac * 4.5 + t * ribbon.speed) * ribbon.amplitude
                     + Math.sin(xFrac * 2.1 + t * ribbon.speed * 0.6 + 1.3) * ribbon.amplitude * 0.4;
          const centerY = (ribbon.yBase + wave) * sh;

          if (i === 0) ctx.moveTo(px, centerY - passWidth);
          else ctx.lineTo(px, centerY - passWidth);
        }
        for (let i = STEPS; i >= 0; i--) {
          const xFrac = i / STEPS;
          const px = xFrac * sw;
          const wave = Math.sin(xFrac * 4.5 + t * ribbon.speed) * ribbon.amplitude
                     + Math.sin(xFrac * 2.1 + t * ribbon.speed * 0.6 + 1.3) * ribbon.amplitude * 0.4;
          const centerY = (ribbon.yBase + wave) * sh;
          ctx.lineTo(px, centerY + passWidth);
        }
        ctx.closePath();

        // Horizontal gradient along the ribbon for color variety
        const grad = ctx.createLinearGradient(0, 0, sw, 0);
        const h1 = ribbon.hue1 + Math.sin(t * 0.3) * 10;
        const h2 = ribbon.hue2 + Math.cos(t * 0.25) * 10;
        grad.addColorStop(0,   `hsla(${h1},    90%, 70%, ${passAlpha})`);
        grad.addColorStop(0.3, `hsla(${h2},    85%, 75%, ${passAlpha})`);
        grad.addColorStop(0.6, `hsla(${h1+15}, 88%, 72%, ${passAlpha})`);
        grad.addColorStop(1,   `hsla(${h2-10}, 90%, 68%, ${passAlpha})`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.restore();
    }

    // Vertical shimmer curtains — thin streaks of light hanging down from the ribbons
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const CURTAIN_COUNT = 18;
    for (let i = 0; i < CURTAIN_COUNT; i++) {
      const seed = i * 137.508; // golden angle spacing
      const cx = ((seed * 0.618) % 1.0) * sw;
      const curtainT = t * (0.3 + (i % 4) * 0.12) + seed;
      const curtainX = cx + Math.sin(curtainT) * 30;
      const curtainLen = sh * (0.12 + Math.sin(seed + t * 0.5) * 0.05);
      const curtainHue = 140 + (i % 5) * 30 + Math.sin(t + seed) * 15;
      const curtainAlpha = alpha * (0.08 + Math.sin(t * 1.1 + seed) * 0.04);
      const cg = ctx.createLinearGradient(curtainX, 0, curtainX, curtainLen);
      cg.addColorStop(0,   `hsla(${curtainHue}, 85%, 72%, ${curtainAlpha})`);
      cg.addColorStop(0.6, `hsla(${curtainHue + 20}, 80%, 65%, ${curtainAlpha * 0.5})`);
      cg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.strokeStyle = cg;
      ctx.lineWidth = 2 + Math.sin(curtainT * 0.7) * 1;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(curtainX, 0);
      ctx.lineTo(curtainX + Math.sin(curtainT * 1.3) * 15, curtainLen);
      ctx.stroke();
    }
    ctx.restore();

    // Soft glow at the top of the screen — the sky is lit from above
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const topGlow = ctx.createLinearGradient(0, 0, 0, sh * 0.35);
    const gHue = 155 + Math.sin(t * 0.2) * 20;
    topGlow.addColorStop(0,   `hsla(${gHue}, 80%, 50%, ${alpha * 0.25})`);
    topGlow.addColorStop(0.5, `hsla(${gHue + 30}, 75%, 55%, ${alpha * 0.08})`);
    topGlow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, sw, sh * 0.35);
    ctx.restore();

    ctx.restore();
  },

  // Draw day/night overlay with street lamp glow holes
  // Called in screen-space (after ctx.restore() removes world zoom)
  drawDayNight(ctx, camera, zoom, dayTime, streetLamps, bloodMoon) {
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

    // Blood Moon override: crimson tint replaces the normal dark blue overlay
    if (bloodMoon) {
      darkness = Math.max(darkness, 0.72); // slightly darker than normal night
      tr = 80; tg = 5; tb = 5; // deep crimson — the sky bleeds
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
    this._drawStarsAndMoon(ctx, camera, darkness, sw, sh, bloodMoon);

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
  _drawStarsAndMoon(ctx, camera, darkness, sw, sh, bloodMoon) {
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

    // Stars — during Blood Moon they glow red
    ctx.save();
    for (const star of this._stars) {
      // Anchor in screen-space with very slow parallax drift
      const sx = ((star.nx * sw * 2 - camera.x * parallax) % sw + sw) % sw;
      const sy = ((star.ny * sh * 2 - camera.y * parallax) % sh + sh) % sh;

      const twinkle = Math.sin(now * 0.0018 + star.twinkleOffset) * 0.25 + 0.75;
      ctx.globalAlpha = darkness * star.brightness * twinkle * 0.85;
      ctx.fillStyle = bloodMoon ? '#ff8080' : '#ffffff'; // red-tinted stars during Blood Moon
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moon — upper-right quadrant of screen, gentle sway
    const moonX = sw * 0.80 + Math.sin(camera.x * 0.00025) * 18;
    const moonY = sh * 0.11 + Math.sin(camera.y * 0.00025) * 10;
    const moonR = Math.min(20, sw * 0.028); // scale with screen

    if (bloodMoon) {
      // Blood Moon: full crimson disc — no crescent, glows like a warning sign
      // Pulsing blood-red outer halo
      const pulse = (Math.sin(now * 0.002) * 0.5 + 0.5); // 0-1 pulse
      ctx.globalAlpha = darkness * (0.3 + pulse * 0.2);
      const bloodHalo = ctx.createRadialGradient(moonX, moonY, moonR * 0.7, moonX, moonY, moonR * 4);
      bloodHalo.addColorStop(0, 'rgba(220, 30, 10, 1)');
      bloodHalo.addColorStop(0.4, 'rgba(180, 0, 0, 0.5)');
      bloodHalo.addColorStop(1, 'rgba(120, 0, 0, 0)');
      ctx.fillStyle = bloodHalo;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 4, 0, Math.PI * 2);
      ctx.fill();

      // Full blood-red moon disc — no crescent clip
      ctx.globalAlpha = darkness * 0.95;
      const moonGrad = ctx.createRadialGradient(moonX - moonR * 0.25, moonY - moonR * 0.25, 0, moonX, moonY, moonR);
      moonGrad.addColorStop(0, '#ff4040');
      moonGrad.addColorStop(0.5, '#cc1a00');
      moonGrad.addColorStop(1, '#7a0000');
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // Dark veins / craters on the blood moon for texture
      ctx.globalAlpha = darkness * 0.4;
      ctx.fillStyle = 'rgba(50, 0, 0, 0.6)';
      ctx.beginPath(); ctx.arc(moonX - 5, moonY + 3, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(moonX + 6, moonY - 5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(moonX - 2, moonY + 8, 3.5, 0, Math.PI * 2); ctx.fill();

      // "🌑" text label under the moon for clarity
      ctx.globalAlpha = darkness * 0.75;
      ctx.fillStyle = '#ff6060';
      ctx.font = `bold ${Math.round(moonR * 0.6)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('BLOOD MOON', moonX, moonY + moonR + 14);
    } else {
      // Normal crescent moon
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
    }

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
  drawTerritories(ctx, camera, territories, myTeamId, crowCartel) {
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

      // === Crow Cartel Raid Overlay ===
      if (crowCartel && crowCartel.targetZoneId === zone.id) {
        const raidPulse = 0.5 + 0.5 * Math.sin(now * 0.008);
        // Red danger tint over the zone
        ctx.globalAlpha = 0.12 + 0.06 * raidPulse;
        ctx.fillStyle = '#ff1111';
        ctx.fillRect(sx, sy, zone.w, zone.h);

        // Pulsing dashed red border
        ctx.globalAlpha = 0.7 + 0.3 * raidPulse;
        ctx.strokeStyle = '#ff2222';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 6]);
        ctx.lineDashOffset = (now * 0.05) % 16;
        ctx.strokeRect(sx + 2, sy + 2, zone.w - 4, zone.h - 4);
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;

        // "⚔️ UNDER RAID" label at top of zone
        ctx.globalAlpha = 0.9 + 0.1 * raidPulse;
        ctx.font = `bold ${12 + Math.floor(raidPulse * 2)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#000';
        ctx.fillText('⚔️ UNDER RAID', cx + 1, sy + 6 + 1);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('⚔️ UNDER RAID', cx, sy + 6);

        // Drain bar — shows capture drain from right (red bar shrinking)
        if (zone.captureProgress > 0) {
          const barW = Math.min(zone.w - 20, 140);
          const barH = 7;
          const barX = cx - barW / 2;
          const barY = sy + zone.h - 30;
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
          ctx.fillStyle = '#55bb55';
          ctx.fillRect(barX, barY, barW * zone.captureProgress, barH);
          ctx.fillStyle = 'rgba(255,50,50,0.8)';
          ctx.fillRect(barX + barW * zone.captureProgress, barY, barW * (1 - zone.captureProgress), barH);
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff';
          ctx.fillText('POOP THE CROWS!', cx, barY + barH / 2);
        }
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

  // Draw gang mural zones (beacons + completed murals + in-progress painting)
  drawMurals(ctx, camera, muralZones, murals, muralPainting, selfBird, now) {
    if (!muralZones || !this.worldData) return;
    const t = now / 1000;

    // Build quick lookup maps
    const completedMap = {};
    if (murals) { for (const m of murals) completedMap[m.zoneId] = m; }
    const paintingMap = {};
    if (muralPainting) { for (const p of muralPainting) paintingMap[p.zoneId] = p; }

    for (const zone of muralZones) {
      const sx = zone.x - camera.x + camera.screenW / 2;
      const sy = zone.y - camera.y + camera.screenH / 2;

      // Frustum cull (with padding for the full zone radius)
      if (sx + zone.radius < -60 || sx - zone.radius > camera.screenW + 60 ||
          sy + zone.radius < -60 || sy - zone.radius > camera.screenH + 60) continue;

      const completed = completedMap[zone.id];
      const painting  = paintingMap[zone.id];

      // === COMPLETED MURAL: draw vivid art on buildings within the zone ===
      if (completed) {
        const fade = completed.expiresAt - now;
        const alpha = fade < 90000
          ? Math.max(0, (fade / 90000) * 0.92)
          : 0.92;
        if (alpha <= 0) continue;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Colorize all buildings inside the zone radius
        for (const b of this.worldData.buildings) {
          const bcx = b.x + b.w / 2;
          const bcy = b.y + b.h / 2;
          const bdx = bcx - zone.x;
          const bdy = bcy - zone.y;
          if (bdx * bdx + bdy * bdy > zone.radius * zone.radius) continue;

          const bsx = b.x - camera.x + camera.screenW / 2;
          const bsy = b.y - camera.y + camera.screenH / 2;
          if (bsx + b.w < -10 || bsx > camera.screenW + 10 || bsy + b.h < -10 || bsy > camera.screenH + 10) continue;

          // Large colorful mural band across 40% of building height
          const bandH = Math.floor(b.h * 0.42);
          const bandY = bsy + b.h - bandH;

          // Gradient fill for the mural band
          const grad = ctx.createLinearGradient(bsx, bandY, bsx + b.w, bandY);
          grad.addColorStop(0, completed.gangColor + 'cc');
          grad.addColorStop(0.5, completed.gangColor + 'ff');
          grad.addColorStop(1, completed.gangColor + 'aa');
          ctx.fillStyle = grad;
          ctx.fillRect(bsx, bandY, b.w, bandH);

          // Dark overlay with gang tag text
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          ctx.fillRect(bsx + 2, bandY + 2, b.w - 4, bandH - 4);

          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.max(8, Math.min(18, Math.floor(b.w / 4)))}px "Courier New", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = completed.gangColor;
          ctx.shadowBlur = 8;
          ctx.fillText('[' + completed.gangTag + ']', bsx + b.w / 2, bandY + bandH / 2);
          ctx.shadowBlur = 0;

          // Spray paint splatter dots at building corners
          const splatColor = completed.gangColor;
          for (let i = 0; i < 6; i++) {
            const splatX = bsx + (i < 3 ? 6 : b.w - 6) + (Math.sin(i * 1.7 + t * 0.3) * 3);
            const splatY = bandY + 4 + i * (bandH / 7);
            ctx.beginPath();
            ctx.arc(splatX, splatY, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = splatColor + 'aa';
            ctx.fill();
          }
        }

        // Zone label above the beacon point
        ctx.shadowColor = completed.gangColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = completed.gangColor;
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`🎨 [${completed.gangTag}] ${zone.name}`, sx, sy - 16);
        ctx.shadowBlur = 0;
        ctx.restore();

      } else {
        // === ZONE BEACON — unowned or being painted ===
        const pulse = 0.6 + 0.4 * Math.sin(t * 2.5);

        if (painting) {
          // Active painting in progress — draw a bright progress ring
          const progress = painting.progress;
          const ringColor = painting.gangColor;

          ctx.save();
          // Outer glow
          ctx.beginPath();
          ctx.arc(sx, sy, 32 + 8 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = ringColor + '22';
          ctx.fill();

          // Progress arc
          ctx.beginPath();
          ctx.arc(sx, sy, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
          ctx.strokeStyle = ringColor;
          ctx.lineWidth = 6;
          ctx.stroke();

          // Background track
          ctx.beginPath();
          ctx.arc(sx, sy, 28, -Math.PI / 2 + Math.PI * 2 * progress, Math.PI * 1.5);
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Spray can icon + progress text
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🎨', sx, sy);
          ctx.font = 'bold 9px Arial';
          ctx.fillStyle = ringColor;
          ctx.fillText(Math.round(progress * 100) + '%', sx, sy + 20);
          ctx.fillText('[' + painting.gangTag + '] PAINTING...', sx, sy - 40);
          ctx.fillText('🖌️ ' + painting.painterCount + ' painter' + (painting.painterCount !== 1 ? 's' : ''), sx, sy - 52);
          ctx.restore();

        } else {
          // Neutral zone beacon — subtle purple spray can icon
          ctx.save();
          ctx.globalAlpha = 0.55 * pulse;

          ctx.beginPath();
          ctx.arc(sx, sy, 22, 0, Math.PI * 2);
          ctx.fillStyle = '#aa88ff22';
          ctx.fill();
          ctx.strokeStyle = '#aa88ff88';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.globalAlpha = 0.7 * pulse;
          ctx.fillStyle = '#ddbbff';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🎨', sx, sy);

          ctx.font = '8px Arial';
          ctx.fillStyle = '#ccaaff';
          ctx.fillText(zone.name, sx, sy + 30);
          ctx.restore();
        }
      }
    }
  },

  // Draw gang mural zones on the minimap
  drawMuralsOnMinimap(minimapCtx, muralZones, murals, muralPainting, mw, mh, worldWidth, worldHeight) {
    if (!muralZones) return;
    const sx = mw / worldWidth;
    const sy = mh / worldHeight;
    const now = Date.now();

    const completedMap = {};
    if (murals) { for (const m of murals) completedMap[m.zoneId] = m; }
    const paintingMap = {};
    if (muralPainting) { for (const p of muralPainting) paintingMap[p.zoneId] = p; }

    for (const zone of muralZones) {
      const mx = zone.x * sx;
      const my = zone.y * sy;
      const completed = completedMap[zone.id];
      const painting  = paintingMap[zone.id];

      if (completed) {
        // Completed mural — colored dot
        const t = now / 500;
        const pulse = 0.7 + 0.3 * Math.sin(t);
        minimapCtx.beginPath();
        minimapCtx.arc(mx, my, 4 * pulse, 0, Math.PI * 2);
        minimapCtx.fillStyle = completed.gangColor;
        minimapCtx.fill();
        minimapCtx.font = '7px Arial';
        minimapCtx.fillStyle = '#fff';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillText('🎨', mx, my - 5);
      } else if (painting) {
        // In progress — pulsing
        const t = now / 300;
        const pulse = 0.6 + 0.4 * Math.sin(t);
        minimapCtx.beginPath();
        minimapCtx.arc(mx, my, 3.5 * pulse, 0, Math.PI * 2);
        minimapCtx.fillStyle = painting.gangColor + 'cc';
        minimapCtx.fill();
      } else {
        // Neutral — subtle purple dot
        minimapCtx.beginPath();
        minimapCtx.arc(mx, my, 2.5, 0, Math.PI * 2);
        minimapCtx.fillStyle = '#9966cc88';
        minimapCtx.fill();
      }
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
  drawSewerOverlay(ctx, camera, selfBird, sewerRats, sewerLoot, now, ratKing) {
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

    // === Rat King (underground boss) ===
    if (ratKing) {
      const rksx = ratKing.x - camera.x + sw / 2;
      const rksy = ratKing.y - camera.y + sh / 2;
      // Draw at 2× scale
      ctx.save();
      ctx.scale(2, 2);
      Sprites.drawRatKing(ctx, rksx / 2, rksy / 2, ratKing.hp, ratKing.maxHp, ratKing.state, now);
      ctx.restore();
    }

    // === SEWER HUD — top banner ===
    ctx.save();
    ctx.fillStyle = ratKing ? 'rgba(60, 0, 80, 0.88)' : 'rgba(0, 60, 20, 0.85)';
    ctx.strokeStyle = ratKing ? '#cc44ff' : '#44ff88';
    ctx.lineWidth = 1.5;
    const hudW = 300, hudH = 28;
    const hudX = (sw - hudW) / 2;
    ctx.beginPath();
    ctx.roundRect(hudX, 8, hudW, hudH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = ratKing ? '#dd88ff' : '#44ff88';
    const ratCount = sewerRats ? sewerRats.length : 0;
    const hudText = ratKing
      ? '👑 RAT KING IS HERE! POOP HIM!  🐀 ' + ratCount
      : '🐀 UNDERGROUND  ·  ' + ratCount + ' rat' + (ratCount !== 1 ? 's' : '') + ' nearby';
    ctx.fillText(hudText, sw / 2, 27);
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
  drawGangNests(ctx, camera, nests, selfGangId, now, isBlizzard) {
    if (!nests || nests.length === 0) return;
    const t = now / 1000;
    for (const nest of nests) {
      if (!nest.alive) continue;
      const sx = nest.x - camera.x;
      const sy = nest.y - camera.y;
      // Only draw nests within a reasonable view range
      if (sx < -200 || sx > (camera.screenW || 1400) + 200 || sy < -200 || sy > (camera.screenH || 900) + 200) continue;

      // Gang Nest Firepit: during blizzard, draw a warm campfire aura around own gang's nest
      if (isBlizzard && nest.isMyNest) {
        const pulse = 0.6 + 0.4 * Math.sin(t * 2.8);
        const fireR = 100; // matches server-side 100px radius
        // Warm outer glow (large, very soft)
        const firepitGrad = ctx.createRadialGradient(sx, sy + 5, 8, sx, sy, fireR);
        firepitGrad.addColorStop(0, `rgba(255,180,40,${0.38 * pulse})`);
        firepitGrad.addColorStop(0.45, `rgba(255,100,10,${0.18 * pulse})`);
        firepitGrad.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.beginPath();
        ctx.arc(sx, sy, fireR, 0, Math.PI * 2);
        ctx.fillStyle = firepitGrad;
        ctx.fill();
        // Firepit flame flicker (small bright core)
        ctx.save();
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 9.5 + 0.4);
        const flameGrad = ctx.createRadialGradient(sx, sy + 3, 2, sx, sy + 3, 18);
        flameGrad.addColorStop(0, '#fff4aa');
        flameGrad.addColorStop(0.4, '#ffaa22');
        flameGrad.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.beginPath();
        ctx.ellipse(sx, sy + 3, 12, 16, 0, 0, Math.PI * 2);
        ctx.fillStyle = flameGrad;
        ctx.fill();
        ctx.restore();
        // "🔥" label above nest
        ctx.save();
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc55';
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 6;
        ctx.fillText('🔥 WARM', sx, sy - 52);
        ctx.restore();
      }

      Sprites.drawGangNest(ctx, sx, sy, nest.gangColor, nest.gangTag, nest.hp, nest.maxHp, nest.isMyNest, now);
    }
  },

  /**
   * Draw active siege overlays in world space.
   * sieges: array of siege objects from gameState.activeSieges
   * nests: array of gangNests
   */
  drawSiegeOverlays(ctx, camera, sieges, now) {
    if (!sieges || sieges.length === 0) return;
    const t = now / 1000;
    for (const siege of sieges) {
      const sx = siege.nestX - camera.x;
      const sy = siege.nestY - camera.y;
      const screenW = camera.screenW || 1400;
      const screenH = camera.screenH || 900;
      if (sx < -350 || sx > screenW + 350 || sy < -350 || sy > screenH + 350) continue;

      const pct = Math.max(0, siege.hpPool / siege.hpMaxPool);
      const timeLeft = Math.max(0, siege.endsAt - now);
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);

      // Flaming ring around nest (attack zone indicator, 200px radius)
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.10 * pulse;
      ctx.beginPath();
      ctx.arc(sx, sy, 200, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,60,0,1)`;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Animated fire ring border
      const ringSegments = 16;
      for (let i = 0; i < ringSegments; i++) {
        const angle = (i / ringSegments) * Math.PI * 2 + t * 1.5;
        const flickerR = 200 + 6 * Math.sin(t * 8 + i * 1.3);
        const fx = sx + Math.cos(angle) * flickerR;
        const fy = sy + Math.sin(angle) * flickerR;
        const flameSize = 6 + 4 * Math.sin(t * 12 + i * 0.7);
        const flameGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, flameSize);
        flameGrad.addColorStop(0, '#fff4aa');
        flameGrad.addColorStop(0.4, '#ff8800');
        flameGrad.addColorStop(1, 'rgba(255,40,0,0)');
        ctx.beginPath();
        ctx.arc(fx, fy, flameSize, 0, Math.PI * 2);
        ctx.fillStyle = flameGrad;
        ctx.globalAlpha = 0.7 + 0.3 * pulse;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // HP pool bar above the nest
      const barW = 100;
      const barH = 9;
      const barX = sx - barW / 2;
      const barY = sy - 72;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath();
      ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 4);
      ctx.fill();
      const hpColor = pct > 0.5 ? '#ff4400' : pct > 0.25 ? '#ff8800' : '#ff0000';
      ctx.fillStyle = hpColor;
      ctx.fillRect(barX, barY, barW * pct, barH);
      ctx.strokeStyle = '#aa2200';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      // Siege label
      ctx.save();
      ctx.font = `bold 9px 'Courier New',monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 8;
      ctx.fillText('⚔️ SIEGE', sx, barY - 6);
      ctx.shadowBlur = 0;

      // Attacker vs Defender tags
      const atkColor = siege.attackingGangColor || '#ff4444';
      const defColor = siege.defendingGangColor || '#aaaaaa';
      ctx.font = `8px 'Courier New',monospace`;
      ctx.fillStyle = atkColor;
      ctx.fillText(`[${siege.attackingGangTag}] ▶`, sx - 2, barY + barH + 10);
      ctx.fillStyle = defColor;
      ctx.fillText(`◀ [${siege.defendingGangTag}]`, sx + 2, barY + barH + 18);

      // Countdown
      const secsLeft = Math.ceil(timeLeft / 1000);
      const countColor = secsLeft <= 30 ? '#ff2222' : '#ffaa44';
      ctx.fillStyle = countColor;
      ctx.font = `bold 9px 'Courier New',monospace`;
      ctx.fillText(`${secsLeft}s`, sx, barY + barH + 28);

      ctx.restore();
      ctx.restore();
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

        // Eagle feather badge + Alpha feather badge
        let nameX = cx - 18;
        if (entry.eagleFeather) {
          ctx.font = '7px serif';
          ctx.fillText('🪶', nameX, ry + ROW_H - 3);
          nameX += 10;
        }
        if (entry.alphaFeather) {
          ctx.font = '7px serif';
          ctx.fillStyle = '#ffcc55';
          ctx.fillText('🦅', nameX, ry + ROW_H - 3);
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

  // ============================================================
  // SHOOTING STAR — Landing marker (world-space) + Streak (screen-space)
  // ============================================================

  drawShootingStarLanding(ctx, camera, starData, now) {
    if (!starData) return;
    const sx = starData.x - camera.x + camera.screenW / 2;
    const sy = starData.y - camera.y + camera.screenH / 2;
    if (sx < -80 || sx > camera.screenW + 80 || sy < -80 || sy > camera.screenH + 80) return;

    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 4.5);
    const timeLeft = Math.max(0, starData.expiresAt - now);
    const urgency = timeLeft < 10000 ? 1 - timeLeft / 10000 : 0;

    ctx.save();

    // Outer glow halo — expands and contracts
    const haloR = 55 + 15 * pulse;
    const haloGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
    haloGrad.addColorStop(0, `rgba(255, 255, 180, ${0.3 + 0.15 * pulse})`);
    haloGrad.addColorStop(0.5, `rgba(200, 255, 140, ${0.15 + 0.08 * pulse})`);
    haloGrad.addColorStop(1, 'rgba(100, 200, 100, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
    ctx.fill();

    // 8-pointed star burst
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(t * 0.8);
    const starPoints = 8;
    const outerR = 20 + 5 * pulse;
    const innerR = 8;
    ctx.beginPath();
    for (let i = 0; i < starPoints * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i / (starPoints * 2)) * Math.PI * 2;
      if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
    starGrad.addColorStop(0, '#ffffff');
    starGrad.addColorStop(0.3, '#ffffaa');
    starGrad.addColorStop(1, '#ffcc44');
    ctx.fillStyle = starGrad;
    ctx.shadowColor = '#ffffaa';
    ctx.shadowBlur = 12 + 8 * pulse;
    ctx.fill();
    ctx.restore();

    // Inner bright core dot
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.85 + 0.15 * pulse})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 4 sparkle particles orbiting the core
    for (let i = 0; i < 4; i++) {
      const ang = t * 2.2 + (i / 4) * Math.PI * 2;
      const r = 28 + 6 * Math.sin(t * 3 + i);
      const px = sx + Math.cos(ang) * r;
      const py = sy + Math.sin(ang) * r;
      ctx.fillStyle = `rgba(255, 255, 160, ${0.5 + 0.4 * Math.sin(t * 5 + i * 2)})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Label "🌠 CLAIM IT!" pulsing above the marker
    const labelAlpha = urgency > 0 ? (0.7 + 0.3 * Math.sin(now * 0.015)) : (0.7 + 0.3 * pulse);
    ctx.globalAlpha = labelAlpha;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffaa';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeText('🌠 FLY HERE!', sx, sy - 42);
    ctx.fillText('🌠 FLY HERE!', sx, sy - 42);
    ctx.globalAlpha = 1;

    ctx.restore();
  },

  drawShootingStarStreak(ctx, camera, starData, now) {
    if (!starData) return;
    const elapsed = now - starData.spawnedAt;
    const STREAK_DUR = 2200; // ms for streak animation
    if (elapsed > STREAK_DUR + 500) return; // already done

    const progress = Math.min(1, elapsed / STREAK_DUR);

    // Landing position in screen space
    const landSx = starData.x - camera.x + camera.screenW / 2;
    const landSy = starData.y - camera.y + camera.screenH / 2;

    // Origin: the star comes from a direction based on streakAngle, starting far off-screen
    const ORIGIN_DIST = Math.max(camera.screenW, camera.screenH) * 1.4;
    const fromAngle = starData.streakAngle + Math.PI; // opposite of landing direction
    const fromX = landSx + Math.cos(fromAngle) * ORIGIN_DIST;
    const fromY = landSy + Math.sin(fromAngle) * ORIGIN_DIST;

    // Current star head position (lerp from far away to landing)
    const headX = fromX + (landSx - fromX) * progress;
    const headY = fromY + (landSy - fromY) * progress;

    // Tail start: 15–20% behind the head along the trajectory
    const TAIL_FRAC = 0.18;
    const tailStartProgress = Math.max(0, progress - TAIL_FRAC);
    const tailX = fromX + (landSx - fromX) * tailStartProgress;
    const tailY = fromY + (landSy - fromY) * tailStartProgress;

    ctx.save();

    if (progress < 1.0) {
      // Draw the streak: bright core line with glowing halo
      const alpha = progress < 0.08 ? progress / 0.08 : 1.0; // fast fade in

      // Outer glow
      ctx.globalCompositeOperation = 'lighter';
      const trailGrad = ctx.createLinearGradient(tailX, tailY, headX, headY);
      trailGrad.addColorStop(0, 'rgba(255, 255, 200, 0)');
      trailGrad.addColorStop(0.6, `rgba(255, 255, 180, ${0.25 * alpha})`);
      trailGrad.addColorStop(1, `rgba(255, 255, 255, ${0.7 * alpha})`);
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();

      // Bright core
      const coreGrad = ctx.createLinearGradient(tailX, tailY, headX, headY);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      coreGrad.addColorStop(0.7, `rgba(255, 255, 220, ${0.6 * alpha})`);
      coreGrad.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);
      ctx.strokeStyle = coreGrad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();

      // Star head sparkle point
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.shadowColor = '#ffffaa';
      ctx.shadowBlur = 15 + 5 * Math.sin(now * 0.05);
      ctx.beginPath();
      ctx.arc(headX, headY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Landing impact: bright flash that fades
      const impactAge = elapsed - STREAK_DUR;
      const impactFrac = Math.min(1, impactAge / 500);
      const impactAlpha = 1 - impactFrac;
      const impactR = 30 + 60 * impactFrac;
      ctx.globalCompositeOperation = 'lighter';
      const impGrad = ctx.createRadialGradient(landSx, landSy, 0, landSx, landSy, impactR);
      impGrad.addColorStop(0, `rgba(255, 255, 220, ${0.8 * impactAlpha})`);
      impGrad.addColorStop(1, 'rgba(255, 255, 180, 0)');
      ctx.fillStyle = impGrad;
      ctx.beginPath();
      ctx.arc(landSx, landSy, impactR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  // ============================================================
  // BIRD CITY IDOL — Stage drawing
  // ============================================================

  drawIdolStage(ctx, camera, stagePos, idolState, nearStage, now) {
    if (!stagePos) return;
    const sx = stagePos.x - camera.x + camera.screenW / 2;
    const sy = stagePos.y - camera.y + camera.screenH / 2;
    if (sx < -200 || sx > camera.screenW + 200 || sy < -200 || sy > camera.screenH + 200) return;

    const t = now / 1000;
    const isActive = idolState && (idolState.state === 'open' || idolState.state === 'voting' || idolState.state === 'results');
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.0);

    ctx.save();
    ctx.translate(sx, sy);

    // Stage platform — wooden boards
    const stageW = 150;
    const stageH = 55;
    const stageY = -10;

    // Platform shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, stageY + stageH / 2 + 8, stageW / 2 + 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stage floor
    ctx.fillStyle = '#8B5E14';
    ctx.beginPath();
    ctx.roundRect(-stageW / 2, stageY - stageH / 2, stageW, stageH, 6);
    ctx.fill();

    // Wooden plank lines
    ctx.strokeStyle = '#6b4810';
    ctx.lineWidth = 1.5;
    for (let px2 = -55; px2 <= 55; px2 += 22) {
      ctx.beginPath();
      ctx.moveTo(px2, stageY - stageH / 2 + 3);
      ctx.lineTo(px2, stageY + stageH / 2 - 3);
      ctx.stroke();
    }

    // Stage edge trim
    ctx.strokeStyle = '#ffd04a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-stageW / 2, stageY - stageH / 2, stageW, stageH, 6);
    ctx.stroke();

    // Left and right curtain poles
    ctx.strokeStyle = '#8B1A1A';
    ctx.lineWidth = 4;
    // Left pole
    ctx.beginPath();
    ctx.moveTo(-stageW / 2 - 8, stageY - stageH / 2 - 40);
    ctx.lineTo(-stageW / 2 - 8, stageY + stageH / 2);
    ctx.stroke();
    // Right pole
    ctx.beginPath();
    ctx.moveTo(stageW / 2 + 8, stageY - stageH / 2 - 40);
    ctx.lineTo(stageW / 2 + 8, stageY + stageH / 2);
    ctx.stroke();

    // Left curtain
    ctx.fillStyle = 'rgba(180, 20, 20, 0.82)';
    ctx.beginPath();
    ctx.moveTo(-stageW / 2 - 8, stageY - stageH / 2 - 40);
    ctx.bezierCurveTo(-stageW / 2 + 15, stageY - stageH / 2 - 20, -stageW / 2 - 5, stageY - 8, -stageW / 2 + 20, stageY + stageH / 2);
    ctx.lineTo(-stageW / 2 - 8, stageY + stageH / 2);
    ctx.closePath();
    ctx.fill();

    // Right curtain
    ctx.fillStyle = 'rgba(180, 20, 20, 0.82)';
    ctx.beginPath();
    ctx.moveTo(stageW / 2 + 8, stageY - stageH / 2 - 40);
    ctx.bezierCurveTo(stageW / 2 - 15, stageY - stageH / 2 - 20, stageW / 2 + 5, stageY - 8, stageW / 2 - 20, stageY + stageH / 2);
    ctx.lineTo(stageW / 2 + 8, stageY + stageH / 2);
    ctx.closePath();
    ctx.fill();

    // Stage lights — small spotlights along the top
    const lightColors = ['#fffbe0', '#fff0b0', '#ffe580'];
    for (let i = 0; i < 5; i++) {
      const lx = -60 + i * 30;
      const ly = stageY - stageH / 2 - 4;
      const glow = isActive ? (0.7 + 0.3 * Math.sin(t * 4 + i * 1.2)) : 0.4;
      ctx.fillStyle = `rgba(255, 240, 100, ${glow})`;
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spotlight beams during active contest
    if (isActive) {
      for (let i = 0; i < 3; i++) {
        const beamAlpha = 0.06 + 0.04 * Math.sin(t * 2 + i * 2.1);
        const beamX = -40 + i * 40;
        const grad = ctx.createLinearGradient(beamX, stageY - stageH / 2 - 6, beamX + 10, stageY - 50);
        grad.addColorStop(0, `rgba(255,250,200,${beamAlpha * 3})`);
        grad.addColorStop(1, `rgba(255,250,200,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(beamX - 5, stageY - stageH / 2 - 6);
        ctx.lineTo(beamX + 15, stageY - stageH / 2 - 6);
        ctx.lineTo(beamX + 30, stageY - 50);
        ctx.lineTo(beamX - 20, stageY - 50);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Microphone stand center-stage
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, stageY + stageH / 2 - 6);
    ctx.lineTo(0, stageY - stageH / 2 + 12);
    ctx.stroke();
    // Mic head
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.ellipse(0, stageY - stageH / 2 + 8, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Mic shimmer
    ctx.fillStyle = isActive ? `rgba(255,255,200,${0.6 + 0.4 * pulse})` : 'rgba(200,200,150,0.3)';
    ctx.beginPath();
    ctx.ellipse(-1, stageY - stageH / 2 + 6, 2, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Label
    const labelY = stageY - stageH / 2 - 50;
    if (isActive && idolState.state === 'open') {
      // Pulsing neon pink sign
      ctx.shadowColor = '#ff44cc';
      ctx.shadowBlur = 10 + 6 * pulse;
      ctx.fillStyle = `rgba(255,68,204,${0.85 + 0.15 * pulse})`;
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('🎤 IDOL STAGE — OPEN!', 0, labelY);
      ctx.shadowBlur = 0;
      // Contestant count
      ctx.fillStyle = '#ffdd88';
      ctx.font = '9px Courier New';
      ctx.fillText(`${idolState.contestants.length}/4 contestants`, 0, labelY + 13);
      if (nearStage) {
        ctx.fillStyle = '#88ff88';
        ctx.fillText('[I] JOIN THE CONTEST', 0, labelY + 25);
      }
    } else if (isActive && idolState.state === 'voting') {
      ctx.shadowColor = '#44aaff';
      ctx.shadowBlur = 10 + 6 * pulse;
      ctx.fillStyle = '#44aaff';
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('🗳️ VOTING IN PROGRESS', 0, labelY);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#aaddff';
      ctx.font = '9px Courier New';
      ctx.fillText('[I] to vote from anywhere', 0, labelY + 13);
    } else if (isActive && idolState.state === 'results') {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14 + 6 * pulse;
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 12px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 ' + (idolState.winnerName || '???') + ' WINS!', 0, labelY);
      ctx.shadowBlur = 0;
    } else {
      // Idle — show subtle label
      ctx.fillStyle = 'rgba(200,150,255,0.6)';
      ctx.font = '9px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('🎤 IDOL STAGE', 0, labelY);
      if (nearStage) {
        ctx.fillStyle = 'rgba(180,180,255,0.8)';
        ctx.font = '8px Courier New';
        ctx.fillText('Contest coming soon...', 0, labelY + 11);
      }
    }

    ctx.restore();
  },

  drawIdolStageOnMinimap(minimapCtx, worldData, stagePos, idolState, now) {
    if (!stagePos || !worldData) return;
    const msx = minimapCtx.canvas.width / worldData.width;
    const msy = minimapCtx.canvas.height / worldData.height;
    const px = stagePos.x * msx;
    const py = stagePos.y * msy;
    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.0);
    const isActive = idolState && (idolState.state === 'open' || idolState.state === 'voting');

    minimapCtx.save();
    if (isActive) {
      minimapCtx.shadowColor = idolState.state === 'voting' ? '#44aaff' : '#ff44cc';
      minimapCtx.shadowBlur = 5 + 3 * pulse;
    }
    minimapCtx.fillStyle = isActive
      ? (idolState.state === 'voting' ? `rgba(68,170,255,${0.8 + 0.2 * pulse})` : `rgba(255,68,204,${0.8 + 0.2 * pulse})`)
      : '#cc88ff';
    minimapCtx.beginPath();
    minimapCtx.arc(px, py, isActive ? 3.5 + pulse : 2.5, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;
    minimapCtx.font = '8px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('🎤', px, py - 4);
    minimapCtx.restore();
  },

  // ============================================================
  // PIGEON PIED PIPER
  // ============================================================

  drawPiedPiper(ctx, camera, piper, now) {
    if (!piper) return;
    const sx = piper.x - camera.x + camera.screenW / 2;
    const sy = piper.y - camera.y + camera.screenH / 2;
    if (sx < -80 || sx > camera.screenW + 80 || sy < -80 || sy > camera.screenH + 80) return;
    Sprites.drawPiedPiper(ctx, sx, sy, now, piper.hitCount, piper.hitsRequired);
  },

  drawPiperOnMinimap(minimapCtx, worldData, piper, now) {
    if (!piper) return;
    const scale = minimapCtx.canvas.width / worldData.width;
    const px = piper.x * scale;
    const py = piper.y * scale;
    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    const hue = (t * 60) % 360;
    minimapCtx.save();
    minimapCtx.shadowColor = `hsl(${hue}, 90%, 70%)`;
    minimapCtx.shadowBlur = 6 + 4 * pulse;
    minimapCtx.fillStyle = `hsla(${hue}, 90%, 70%, ${0.8 + 0.2 * pulse})`;
    minimapCtx.beginPath();
    minimapCtx.arc(px, py, 4 + pulse * 1.5, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;
    minimapCtx.font = '8px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('🎵', px, py - 4);
    minimapCtx.restore();
  },

  // ============================================================
  // CURSED COIN — world drawing
  // ============================================================
  drawCursedCoin(ctx, camera, coin, now) {
    if (!coin || coin.state !== 'world') return;
    const sx = coin.x - camera.x + camera.screenW / 2;
    const sy = coin.y - camera.y + camera.screenH / 2;
    Sprites.drawCursedCoin(ctx, sx, sy, now / 1000);
  },

  drawCursedCoinOnMinimap(minimapCtx, worldData, coin, now) {
    if (!coin) return;
    const scale = minimapCtx.canvas.width / worldData.width;
    const cx = coin.x * scale;
    const cy = coin.y * scale;
    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 5);
    minimapCtx.save();
    minimapCtx.shadowColor = '#ff0033';
    minimapCtx.shadowBlur = 6 + 4 * pulse;
    minimapCtx.fillStyle = `rgba(220, 0, 50, ${0.8 + 0.2 * pulse})`;
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, 4 + pulse * 2, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;
    minimapCtx.font = '8px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('💀', cx, cy - 5);
    minimapCtx.restore();
  },

  // ============================================================
  // BIRD ROYALE — shrinking safe zone
  // ============================================================

  drawBirdRoyaleZone(ctx, camera, royale, now) {
    if (!royale || royale.state === 'warning') return;

    const cx = royale.centerX - camera.x + camera.screenW / 2;
    const cy = royale.centerY - camera.y + camera.screenH / 2;
    const r = royale.currentRadius;
    // Scale radius to screen (world units = screen units at zoom=1; if camera has zoom use it)
    const zoom = camera.zoom || 1;
    const sr = r * zoom;

    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);

    // ── DANGER ZONE: Red fill outside the circle ──
    // Use compositing: fill whole screen red (tinted), then cut out the safe circle
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, camera.screenW, camera.screenH);
    // Cut-out circle (safe zone)
    ctx.arc(cx, cy, sr, 0, Math.PI * 2, true); // true = counterclockwise = hole
    ctx.fillStyle = `rgba(200, 0, 0, ${0.22 + 0.08 * pulse})`;
    ctx.fill();
    ctx.restore();

    // ── SAFE ZONE BORDER: Pulsing white/electric ring ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, sr, 0, Math.PI * 2);
    // Outer glow
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 16 + 8 * pulse;
    ctx.strokeStyle = `rgba(255, ${80 + Math.floor(120 * pulse)}, ${80 + Math.floor(80 * pulse)}, ${0.85 + 0.15 * pulse})`;
    ctx.lineWidth = 3 + pulse * 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner white core of the border
    ctx.beginPath();
    ctx.arc(cx, cy, sr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + 0.3 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // ── "SAFE ZONE" label near the border (top of circle) ──
    const labelY = cy - sr - 12;
    if (labelY > 10 && labelY < camera.screenH - 10) {
      ctx.save();
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255, 200, 200, ${0.8 + 0.2 * pulse})`;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 6;
      ctx.fillText('⚔️ SAFE ZONE', cx, labelY);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  },

  drawBirdRoyaleOnMinimap(minimapCtx, worldData, royale, now) {
    if (!royale || royale.state === 'warning') return;
    const scale = minimapCtx.canvas.width / worldData.width;
    const cx = royale.centerX * scale;
    const cy = royale.centerY * scale;
    const r = royale.currentRadius * scale;

    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);

    minimapCtx.save();
    // Red ring around safe zone
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, r, 0, Math.PI * 2);
    minimapCtx.strokeStyle = `rgba(255, 80, 80, ${0.7 + 0.3 * pulse})`;
    minimapCtx.lineWidth = 2 + pulse;
    minimapCtx.shadowColor = '#ff4444';
    minimapCtx.shadowBlur = 4 + 2 * pulse;
    minimapCtx.stroke();
    minimapCtx.shadowBlur = 0;

    // Subtle danger zone fill outside
    minimapCtx.beginPath();
    minimapCtx.rect(0, 0, minimapCtx.canvas.width, minimapCtx.canvas.height);
    minimapCtx.arc(cx, cy, r, 0, Math.PI * 2, true);
    minimapCtx.fillStyle = `rgba(180, 0, 0, 0.18)`;
    minimapCtx.fill();
    minimapCtx.restore();
  },

  // ── Donut Shop Building ─────────────────────────────────────
  // A cheerful pink/white bakery on the north road. The Donut Cop patrols outside.
  drawDonutShop(ctx, camera, shopPos, donutCop, nearDonutCop, now) {
    if (!shopPos) return;
    const bx = shopPos.x - camera.x + camera.screenW / 2;
    const by = shopPos.y - camera.y + camera.screenH / 2;
    const t = now / 1000;

    const pulse = 0.6 + 0.4 * Math.sin(t * 2.0);
    const signFlicker = 0.8 + 0.2 * Math.sin(t * 9.3) * Math.cos(t * 5.7);

    ctx.save();

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(bx - 56 + 4, by - 70 + 4, 112, 90);

    // Main building — pink pastel
    ctx.fillStyle = '#ffd6e8';
    ctx.fillRect(bx - 56, by - 70, 112, 90);

    // Building border — hot pink
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bx - 56, by - 70, 112, 90);

    // Outer glow when player is near
    if (nearDonutCop) {
      ctx.shadowColor = '#ff69b4';
      ctx.shadowBlur = 14 * pulse;
      ctx.strokeStyle = `rgba(255, 105, 180, ${0.5 * pulse})`;
      ctx.lineWidth = 7;
      ctx.strokeRect(bx - 56, by - 70, 112, 90);
      ctx.shadowBlur = 0;
    }

    // Sign background — deep pink strip
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(bx - 50, by - 64, 100, 28);

    // Sign border
    ctx.strokeStyle = '#ffc0d9';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx - 50, by - 64, 100, 28);

    // Neon sign text
    ctx.shadowColor = '#ff1493';
    ctx.shadowBlur = 8 * signFlicker;
    ctx.fillStyle = `rgba(255, 255, 255, ${signFlicker})`;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🍩 DONUT SHOP', bx, by - 45);
    ctx.shadowBlur = 0;

    // Big donut emoji on facade
    ctx.font = '22px serif';
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 6 * pulse;
    ctx.fillText('🍩', bx - 22, by - 14);
    ctx.fillText('🍩', bx + 22, by - 14);
    ctx.shadowBlur = 0;

    // "OPEN 24/7" sign at bottom (flashing)
    const signAlpha = 0.55 + 0.45 * Math.sin(t * 2.8);
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = `rgba(255, 80, 80, ${signAlpha})`;
    ctx.fillText('OPEN 24/7', bx, by + 14);

    // Bottom label
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#cc3377';
    ctx.fillText('🍩 Donut Shop', bx, by + 30);

    ctx.restore();
  },

  // Draw the Donut Shop/Cop on minimap
  // === VENDING MACHINES ===
  drawVendingMachines(ctx, camera, machines, nearMachineIdx, now) {
    if (!machines || machines.length === 0) return;
    for (const vm of machines) {
      const sx = vm.x - camera.x + camera.screenW / 2;
      const sy = vm.y - camera.y + camera.screenH / 2;
      const margin = 60;
      if (sx < -margin || sx > camera.screenW + margin || sy < -margin || sy > camera.screenH + margin) continue;
      const isNear = nearMachineIdx !== null && nearMachineIdx !== undefined && nearMachineIdx === vm.id;
      // nearMachineIdx is the full nearVendingMachine object from server, so we check vm.id
      const nearObj = (typeof nearMachineIdx === 'object' && nearMachineIdx) ? nearMachineIdx : null;
      const isNearThis = nearObj && nearObj.idx === vm.id;
      Sprites.drawVendingMachine(ctx, sx, sy, vm.id, isNearThis, nearObj && nearObj.onCooldown, nearObj && nearObj.secsLeft, now);
    }
  },

  drawVendingMachinesOnMinimap(minimapCtx, machines, worldWidth, worldHeight) {
    if (!machines || machines.length === 0) return;
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const sx = mw / worldWidth;
    const sy = mh / worldHeight;
    const t = Date.now() / 1000;
    const COLORS = ['#e63946','#2196f3','#9c27b0','#009688','#4caf50'];
    for (const vm of machines) {
      const cx = vm.x * sx;
      const cy = vm.y * sy;
      const col = COLORS[vm.id % COLORS.length];
      minimapCtx.save();
      minimapCtx.fillStyle = col;
      minimapCtx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 2 + vm.id);
      minimapCtx.beginPath();
      minimapCtx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.globalAlpha = 1;
      minimapCtx.font = '6px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText('🪙', cx, cy - 3);
      minimapCtx.restore();
    }
  },

  drawDonutShopOnMinimap(minimapCtx, shopPos, donutCopState, worldWidth, worldHeight) {
    if (!shopPos) return;
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const sx = mw / worldWidth;
    const sy = mh / worldHeight;
    const cx = shopPos.x * sx;
    const cy = shopPos.y * sy;

    const t = Date.now() / 1000;
    const pulse = 0.7 + 0.3 * Math.sin(t * 3);

    // Color reflects cop state
    let dotColor = '#aaaaaa'; // alert = grey
    if (donutCopState === 'eating') dotColor = '#44ff88'; // eating = bright green
    if (donutCopState === 'stunned') dotColor = '#ffcc00'; // stunned = gold/dazed

    minimapCtx.save();
    minimapCtx.globalAlpha = donutCopState === 'eating' ? pulse : 0.85;
    minimapCtx.fillStyle = dotColor;
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, donutCopState === 'eating' ? 3.5 : 2.5, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.globalAlpha = 1;
    minimapCtx.font = '7px sans-serif';
    minimapCtx.fillStyle = '#ff69b4';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('🍩', cx, cy - 4);
    minimapCtx.restore();
  },

  // ============================================================
  // NIGHT MARKET — Mystical stall near Sacred Pond, aurora-only
  // ============================================================
  drawNightMarket(ctx, marketPos, camera, isNear, now) {
    if (!marketPos) return;
    const px = marketPos.x - camera.x + camera.screenW / 2;
    const py = marketPos.y - camera.y + camera.screenH / 2;
    const t = now / 1000;

    ctx.save();

    // Pulsing aurora aura behind the stall
    const auraAlpha = 0.18 + 0.10 * Math.sin(t * 1.4);
    const auraGrad = ctx.createRadialGradient(px, py + 4, 8, px, py + 4, 52);
    auraGrad.addColorStop(0, `rgba(0,255,200,${auraAlpha * 1.5})`);
    auraGrad.addColorStop(0.5, `rgba(100,60,255,${auraAlpha})`);
    auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(px, py + 4, 52, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tent/stall structure
    // Canopy (triangular tent top in teal/violet gradient)
    const canopyGrad = ctx.createLinearGradient(px - 30, py - 28, px + 30, py - 5);
    canopyGrad.addColorStop(0, '#00e5cc');
    canopyGrad.addColorStop(0.5, '#7c3aed');
    canopyGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = canopyGrad;
    ctx.beginPath();
    ctx.moveTo(px - 32, py - 4);
    ctx.lineTo(px, py - 30);
    ctx.lineTo(px + 32, py - 4);
    ctx.closePath();
    ctx.fill();

    // Canopy border sparkle edge
    ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.3 * Math.sin(t * 2)})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Stall counter (wooden plank base)
    ctx.fillStyle = '#2d1a4a';
    ctx.fillRect(px - 28, py - 4, 56, 20);
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 28, py - 4, 56, 20);

    // Draping curtain fringe at canopy bottom
    for (let i = 0; i < 7; i++) {
      const fx = px - 27 + i * 9;
      const fLen = 6 + 3 * Math.sin(t * 2.5 + i * 0.9);
      ctx.fillStyle = i % 2 === 0 ? '#00e5cc' : '#a855f7';
      ctx.beginPath();
      ctx.ellipse(fx, py - 4 + fLen / 2, 3, fLen / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing star items on counter (decorative)
    const stars = ['✨', '🔮', '🌙'];
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) {
      const ix = px - 16 + i * 16;
      const iy = py + 5;
      const starAlpha = 0.7 + 0.3 * Math.sin(t * 1.8 + i * 1.1);
      ctx.globalAlpha = starAlpha;
      ctx.fillText(stars[i], ix, iy);
    }
    ctx.globalAlpha = 1;

    // Animated floating sparkles around the tent
    for (let i = 0; i < 5; i++) {
      const angle = t * 1.2 + i * (Math.PI * 2 / 5);
      const radius = 30 + 6 * Math.sin(t + i * 0.7);
      const sx2 = px + Math.cos(angle) * radius;
      const sy2 = py - 8 + Math.sin(angle) * radius * 0.4;
      const alpha2 = 0.4 + 0.4 * Math.sin(t * 2 + i * 1.3);
      ctx.globalAlpha = alpha2;
      ctx.fillStyle = i % 2 === 0 ? '#00ffcc' : '#c084fc';
      ctx.beginPath();
      ctx.arc(sx2, sy2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Sign above tent
    ctx.fillStyle = `rgba(0,0,0,0.65)`;
    ctx.beginPath();
    ctx.roundRect(px - 34, py - 46, 68, 14, 4);
    ctx.fill();
    ctx.fillStyle = `hsl(${(t * 60) % 360}, 100%, 80%)`;
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ NIGHT MARKET', px, py - 36);

    // Proximity prompt
    if (isNear) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.roundRect(px - 44, py + 18, 88, 13, 4);
      ctx.fill();
      ctx.fillStyle = '#a5f3fc';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[L] Open Night Market', px, py + 28);
    }

    ctx.restore();
  },

  drawNightMarketOnMinimap(minimapCtx, marketPos, worldWidth, worldHeight) {
    if (!marketPos) return;
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const sx = mw / worldWidth;
    const sy = mh / worldHeight;
    const cx = marketPos.x * sx;
    const cy = marketPos.y * sy;
    const t = Date.now() / 1000;
    const pulse = 0.6 + 0.4 * Math.sin(t * 2);

    minimapCtx.save();
    // Teal hue-cycling glow
    minimapCtx.globalAlpha = pulse;
    minimapCtx.fillStyle = `hsl(${170 + 30 * Math.sin(t)}, 100%, 60%)`;
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.globalAlpha = 1;
    minimapCtx.font = '7px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('✨', cx, cy - 4);
    minimapCtx.restore();
  },

  // ============================================================
  // ICE RINK — blizzard-only slippery plaza
  // ============================================================
  drawIceRink(ctx, camera, iceRinkData, now) {
    if (!iceRinkData) return;
    const sx = iceRinkData.x - camera.x + camera.screenW / 2;
    const sy = iceRinkData.y - camera.y + camera.screenH / 2;
    const r  = iceRinkData.radius || 85;
    const t  = now / 1000;

    // Skip if off screen
    if (sx + r * 1.8 < 0 || sx - r * 1.8 > camera.screenW ||
        sy + r < 0 || sy - r > camera.screenH) return;

    ctx.save();

    // Ice surface (wide shallow oval — like a real rink)
    ctx.beginPath();
    ctx.ellipse(sx, sy, r * 1.65, r * 0.78, 0, 0, Math.PI * 2);

    const iceGrad = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.25, 5, sx, sy, r * 1.65);
    iceGrad.addColorStop(0, 'rgba(210, 245, 255, 0.82)');
    iceGrad.addColorStop(0.55, 'rgba(155, 215, 255, 0.65)');
    iceGrad.addColorStop(1, 'rgba(80, 160, 220, 0.28)');
    ctx.fillStyle = iceGrad;
    ctx.fill();

    // Border ring
    ctx.strokeStyle = 'rgba(170, 230, 255, 0.92)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Skating-mark cross-hatch lines (clipped to oval)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(sx, sy, r * 1.65, r * 0.78, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(180, 225, 255, 0.28)';
    ctx.lineWidth = 1;
    for (let li = -4; li <= 4; li++) {
      const lx = sx + li * (r * 1.65 / 4.5);
      ctx.beginPath();
      ctx.moveTo(lx - 25, sy - r * 0.78);
      ctx.lineTo(lx + 25, sy + r * 0.78);
      ctx.stroke();
    }
    ctx.restore();

    // Center circle
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = 'rgba(150, 210, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(sx, sy, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Orbiting sparkle glints (12 points around the oval)
    for (let i = 0; i < 12; i++) {
      const phase = (i / 12) * Math.PI * 2 + t * 0.55;
      const glintPulse = (Math.sin(t * 2.8 + i * 1.4) + 1) / 2;
      const gx = sx + Math.cos(phase) * r * 1.45;
      const gy = sy + Math.sin(phase) * r * 0.65;
      const gs = 1.4 + glintPulse * 2.2;

      ctx.globalAlpha = 0.35 + glintPulse * 0.65;
      ctx.fillStyle = '#ddeeff';
      ctx.beginPath();
      ctx.arc(gx, gy, gs, 0, Math.PI * 2);
      ctx.fill();

      // Crosshair sparkle on brighter glints
      if (glintPulse > 0.6) {
        ctx.strokeStyle = 'rgba(200, 235, 255, 0.7)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(gx - gs * 2.2, gy); ctx.lineTo(gx + gs * 2.2, gy);
        ctx.moveTo(gx, gy - gs * 2.2); ctx.lineTo(gx, gy + gs * 2.2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Label
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cceeff';
    ctx.shadowColor = '#0066bb';
    ctx.shadowBlur = 10;
    ctx.fillText('⛸️ ICE RINK', sx, sy - r * 0.78 - 9);
    ctx.shadowBlur = 0;

    ctx.restore();
  },

  drawIceRinkOnMinimap(minimapCtx, iceRinkData, worldWidth, worldHeight) {
    if (!iceRinkData) return;
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const cx = iceRinkData.x * (mw / worldWidth);
    const cy = iceRinkData.y * (mh / worldHeight);
    const t = Date.now() / 1000;
    const pulse = 0.55 + 0.45 * Math.sin(t * 2.2);

    minimapCtx.save();
    minimapCtx.globalAlpha = pulse;
    minimapCtx.fillStyle = '#88ddff';
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.globalAlpha = 1;
    minimapCtx.font = '7px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('⛸️', cx, cy - 4);
    minimapCtx.restore();
  },

  // ============================================================
  // CHERRY BLOSSOMS SPRING FESTIVAL — Decorative park trees
  // 4 blossoming cherry trees placed around the park perimeter.
  // Drawn in world space after the park background. Only called
  // from main.js when gameState.cherryBlossoms === true.
  // ============================================================

  drawCherryBlossomTrees(ctx, camera, now) {
    // Tree positions around the park (park: x:820-1480, y:920-1530, pond at 1050,1100)
    const TREES = [
      { x: 850,  y: 960  },  // northwest corner
      { x: 1440, y: 960  },  // northeast corner
      { x: 860,  y: 1490 },  // southwest corner
      { x: 1440, y: 1490 },  // southeast corner
      { x: 1050, y: 940  },  // north center (near pond, on path)
      { x: 1180, y: 1250 },  // pond east (romantic spot)
    ];

    const t = now * 0.001;

    for (let i = 0; i < TREES.length; i++) {
      const tree = TREES[i];
      const sx = tree.x - camera.x + camera.screenW / 2;
      const sy = tree.y - camera.y + camera.screenH / 2;

      // Cull off-screen trees
      if (sx < -80 || sx > camera.screenW + 80 || sy < -80 || sy > camera.screenH + 80) continue;

      ctx.save();
      ctx.translate(sx, sy);

      // === Trunk ===
      ctx.fillStyle = '#7a4f2e';
      ctx.beginPath();
      ctx.roundRect(-4, -12, 8, 22, 2);
      ctx.fill();
      // Trunk highlight
      ctx.fillStyle = 'rgba(200, 150, 100, 0.3)';
      ctx.beginPath();
      ctx.roundRect(-2, -10, 3, 18, 1);
      ctx.fill();

      // === Canopy — layered pink cloud ===
      // Each tree has a slightly different sway phase
      const sway = Math.sin(t * 0.7 + i * 1.3) * 1.5;
      const canopyY = -22 + sway * 0.3;

      // Outer glow (very soft)
      ctx.fillStyle = 'rgba(255, 182, 210, 0.18)';
      ctx.beginPath();
      ctx.ellipse(sway, canopyY - 2, 32, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main canopy blobs — 5 overlapping circles for fluffy cloud look
      const BLOBS = [
        { dx: 0,   dy: 0,   r: 22 },
        { dx: -14, dy: 4,   r: 17 },
        { dx: 14,  dy: 4,   r: 17 },
        { dx: -8,  dy: -10, r: 15 },
        { dx: 8,   dy: -10, r: 15 },
        { dx: 0,   dy: -16, r: 13 },
      ];
      // Draw deeper blobs first, lighter on top
      for (let b = 0; b < BLOBS.length; b++) {
        const blob = BLOBS[b];
        const pinkness = b === 0 ? 0 : (b < 3 ? 0.08 : 0.15); // outer blobs slightly lighter
        const hue = 340 + pinkness * 20;
        ctx.fillStyle = `hsl(${hue}, 80%, ${72 + pinkness * 12}%)`;
        ctx.globalAlpha = 0.88;
        ctx.beginPath();
        ctx.arc(blob.dx + sway, canopyY + blob.dy, blob.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Scattered flower petals in canopy (static, small dots)
      const petalSeed = i * 7 + 123;
      for (let p = 0; p < 12; p++) {
        const angle = (p / 12) * Math.PI * 2 + petalSeed;
        const dist = 6 + ((p * 13 + petalSeed) % 15);
        const px2 = Math.cos(angle) * dist + sway;
        const py2 = canopyY - 5 + Math.sin(angle) * dist * 0.6;
        const pPulse = Math.sin(t * 1.5 + p * 0.8 + i) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 240, 248, ${pPulse * 0.75})`;
        ctx.beginPath();
        ctx.arc(px2, py2, 1.5 + ((p * 3) % 3) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  },

  // Cherry Blossom trees on minimap — small pink dots in the park area
  drawCherryBlossomTreesOnMinimap(minimapCtx, worldWidth, worldHeight) {
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const TREES = [
      { x: 850, y: 960 }, { x: 1440, y: 960 },
      { x: 860, y: 1490 }, { x: 1440, y: 1490 },
    ];
    const t = Date.now() * 0.001;
    const pulse = 0.6 + 0.4 * Math.sin(t * 1.8);
    minimapCtx.save();
    for (const tree of TREES) {
      const tx = tree.x * (mw / worldWidth);
      const ty = tree.y * (mh / worldHeight);
      minimapCtx.globalAlpha = pulse * 0.8;
      minimapCtx.fillStyle = '#ff99cc';
      minimapCtx.beginPath();
      minimapCtx.arc(tx, ty, 2.5, 0, Math.PI * 2);
      minimapCtx.fill();
    }
    minimapCtx.globalAlpha = 1;
    minimapCtx.restore();
  },

  // ============================================================
  // HANAMI LANTERN — glowing paper lantern rises from Sacred Pond
  // ============================================================
  drawHanamiLantern(ctx, camera, lantern, now) {
    if (!lantern) return;
    // Compute current animated position (matches server formula)
    const elapsed = (now - lantern.spawnedAt) / 1000;
    const curY = lantern.baseY - Math.min(elapsed * 7, 180);
    const swayX = lantern.x + Math.sin(elapsed * 0.6 + (lantern.floatPhase || 0)) * 20;

    const sx = swayX - camera.x + camera.screenW / 2;
    const sy = curY - camera.y + camera.screenH / 2;
    if (sx < -80 || sx > camera.screenW + 80 || sy < -80 || sy > camera.screenH + 80) return;

    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
    const timeLeft = Math.max(0, lantern.expiresAt - now);
    const urgency = timeLeft < 15000 ? 1 - timeLeft / 15000 : 0;

    ctx.save();

    // Outer warm glow halo
    const haloR = 50 + 12 * pulse;
    const haloGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
    haloGrad.addColorStop(0, `rgba(255, 165, 50, ${0.35 + 0.15 * pulse})`);
    haloGrad.addColorStop(0.5, `rgba(255, 100, 20, ${0.15 + 0.07 * pulse})`);
    haloGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
    ctx.fill();

    // Lantern body — oval paper body with warm orange/red gradient
    ctx.save();
    ctx.translate(sx, sy);
    const bodyW = 18, bodyH = 24;
    const bodyGrad = ctx.createRadialGradient(-3, -4, 0, 0, 0, bodyH);
    bodyGrad.addColorStop(0, '#ffee88');   // bright warm center
    bodyGrad.addColorStop(0.4, '#ff9933'); // orange mid
    bodyGrad.addColorStop(1, '#cc3300');   // deep red edge
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = `rgba(255, 160, 50, ${0.8 + 0.2 * pulse})`;
    ctx.shadowBlur = 18 + 8 * pulse;
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Horizontal ribs on the lantern body (3 rings)
    ctx.strokeStyle = `rgba(200, 60, 0, 0.55)`;
    ctx.lineWidth = 1.2;
    for (let i = -1; i <= 1; i++) {
      const ry = i * 8;
      const rx = Math.sqrt(Math.max(0, bodyW * bodyW * (1 - (ry * ry) / (bodyH * bodyH))));
      ctx.beginPath();
      ctx.ellipse(0, ry, rx * 0.92, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Top cap
    ctx.fillStyle = '#cc4400';
    ctx.beginPath();
    ctx.ellipse(0, -bodyH, bodyW * 0.55, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bottom cap + hanging tassel
    ctx.fillStyle = '#cc4400';
    ctx.beginPath();
    ctx.ellipse(0, bodyH, bodyW * 0.55, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tassel string
    ctx.strokeStyle = '#ffcc66';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, bodyH + 5);
    ctx.lineTo(0, bodyH + 12);
    ctx.stroke();
    // Tassel tuft
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 2.5, bodyH + 12);
      ctx.lineTo(i * 3.5 + (Math.sin(t * 4 + i) * 2), bodyH + 20);
      ctx.stroke();
    }

    // Inner light glow
    const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, bodyW * 0.65);
    innerGrad.addColorStop(0, `rgba(255, 255, 200, ${0.6 + 0.3 * pulse})`);
    innerGrad.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyW * 0.65, bodyH * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // String going upward (the lantern is floating, held by nothing — but implies ascent)
    ctx.strokeStyle = `rgba(200, 120, 50, 0.35)`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy - bodyH - 5);
    ctx.lineTo(sx + Math.sin(t * 1.5) * 6, sy - bodyH - 20);
    ctx.stroke();

    // Label "🏮 CATCH IT!" with urgency pulse
    const labelAlpha = urgency > 0 ? (0.7 + 0.3 * Math.sin(now * 0.02)) : (0.75 + 0.25 * pulse);
    ctx.globalAlpha = labelAlpha;
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = urgency > 0.5 ? '#ff4400' : '#ffdd88';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    const label = urgency > 0 ? '🏮 HURRY!' : '🏮 CATCH IT!';
    ctx.strokeText(label, sx, sy - 36);
    ctx.fillText(label, sx, sy - 36);
    ctx.globalAlpha = 1;

    ctx.restore();
  },

  drawHanamiLanternOnMinimap(minimapCtx, worldData, lantern, now) {
    if (!lantern) return;
    const mw = worldData.minimapW, mh = worldData.minimapH;
    const worldWidth = worldData.worldWidth, worldHeight = worldData.worldHeight;
    // Compute current animated lantern position
    const elapsed = (now - lantern.spawnedAt) / 1000;
    const curY = lantern.baseY - Math.min(elapsed * 7, 180);
    const swayX = lantern.x + Math.sin(elapsed * 0.6 + (lantern.floatPhase || 0)) * 20;
    const mx = swayX * (mw / worldWidth);
    const my = curY * (mh / worldHeight);

    const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
    minimapCtx.save();
    minimapCtx.globalAlpha = 0.7 + 0.3 * pulse;
    minimapCtx.shadowColor = '#ff9944';
    minimapCtx.shadowBlur = 6;
    minimapCtx.font = `${7 + Math.round(pulse * 2)}px sans-serif`;
    minimapCtx.textAlign = 'center';
    minimapCtx.textBaseline = 'middle';
    minimapCtx.fillText('🏮', mx, my);
    minimapCtx.shadowBlur = 0;
    minimapCtx.globalAlpha = 1;
    minimapCtx.restore();
  },

  // ── Thunder Dome ────────────────────────────────────────────
  // Electromagnetic arena — pulsing electric ring that traps birds inside for +50% XP.
  // Visual: multi-layer blue-white glow ring + animated electric arc segments + subtle inner tint.
  drawThunderDome(ctx, camera, dome, now) {
    if (!dome) return;
    const cx = dome.x - camera.x + camera.screenW / 2;
    const cy = dome.y - camera.y + camera.screenH / 2;
    const zoom = camera.zoom || 1;
    const sr = dome.radius * zoom;
    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    const fastPulse = 0.5 + 0.5 * Math.sin(t * 12);

    // ── Inner tint: subtle electric-blue wash inside the dome ──
    ctx.save();
    const innerGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr);
    innerGrd.addColorStop(0, `rgba(30, 80, 200, ${0.04 + 0.04 * pulse})`);
    innerGrd.addColorStop(0.7, `rgba(50, 100, 220, ${0.03 + 0.02 * pulse})`);
    innerGrd.addColorStop(1, `rgba(80, 160, 255, 0)`);
    ctx.beginPath();
    ctx.arc(cx, cy, sr, 0, Math.PI * 2);
    ctx.fillStyle = innerGrd;
    ctx.fill();
    ctx.restore();

    // ── Outer glow halo: wide soft blue ring ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, sr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(80, 160, 255, ${0.15 + 0.10 * pulse})`;
    ctx.lineWidth = 28 + 10 * pulse;
    ctx.shadowColor = '#4499ff';
    ctx.shadowBlur = 30 + 15 * pulse;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Main ring: bright electric white-blue ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, sr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(150, 210, 255, ${0.7 + 0.25 * pulse})`;
    ctx.lineWidth = 3 + pulse * 1.5;
    ctx.shadowColor = '#aaddff';
    ctx.shadowBlur = 12 + 6 * pulse;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Inner ring: bright core ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, sr - 4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + 0.3 * fastPulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // ── Electric arc segments: zigzag lightning bolts along the ring ──
    const NUM_ARCS = 8;
    ctx.save();
    ctx.shadowColor = '#88ccff';
    ctx.shadowBlur = 8;
    for (let i = 0; i < NUM_ARCS; i++) {
      // Each arc has a unique time phase so they flicker independently
      const arcPhase = t * (3 + i * 0.7) + i * (Math.PI * 2 / NUM_ARCS);
      const arcAlpha = Math.max(0, Math.sin(arcPhase)) * 0.9;
      if (arcAlpha < 0.05) continue;

      const startAngle = (i / NUM_ARCS) * Math.PI * 2 + t * 0.3;
      const arcSpan = (Math.PI * 2 / NUM_ARCS) * 0.6;
      const STEPS = 6;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(180, 230, 255, ${arcAlpha})`;
      ctx.lineWidth = 1.5;

      for (let s = 0; s <= STEPS; s++) {
        const angle = startAngle + (s / STEPS) * arcSpan;
        // Offset radially inward/outward to create zigzag
        const zigzag = (s % 2 === 0 ? 1 : -1) * (4 + 6 * Math.sin(arcPhase * 2 + s));
        const r = sr + zigzag;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Sparks: small bright dots scattered on the ring ──
    ctx.save();
    const NUM_SPARKS = 12;
    for (let i = 0; i < NUM_SPARKS; i++) {
      const sparkPhase = t * (5 + i * 1.1) + i;
      const sparkAlpha = Math.max(0, Math.sin(sparkPhase * 3));
      if (sparkAlpha < 0.2) continue;
      const angle = (i / NUM_SPARKS) * Math.PI * 2 + t * 0.5 + i * 0.4;
      const sx = cx + Math.cos(angle) * sr;
      const sy = cy + Math.sin(angle) * sr;
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + 2 * sparkAlpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 240, 255, ${sparkAlpha})`;
      ctx.shadowColor = '#aaddff';
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Label: "⚡ THUNDER DOME" at top of ring ──
    const labelY = cy - sr - 16;
    if (labelY > 10) {
      ctx.save();
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(180, 230, 255, ${0.85 + 0.15 * pulse})`;
      ctx.shadowColor = '#4499ff';
      ctx.shadowBlur = 8;
      ctx.fillText(`⚡ THUNDER DOME`, cx, labelY);
      // District name just below
      ctx.font = '11px sans-serif';
      ctx.fillStyle = `rgba(150, 200, 240, ${0.7 + 0.2 * pulse})`;
      ctx.fillText(dome.district, cx, labelY + 14);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ── Timer countdown ── (remaining seconds, shown inside ring near top)
    if (dome.endsAt) {
      const secsLeft = Math.max(0, Math.ceil((dome.endsAt - now) / 1000));
      const mins = Math.floor(secsLeft / 60);
      const secs = secsLeft % 60;
      const timerStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(120, 200, 255, ${0.8 + 0.2 * fastPulse})`;
      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = 5;
      ctx.fillText(timerStr, cx, cy - sr + 22);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  },

  // ============================================================
  // GOLDEN THRONE — legendary descending seat of power
  // ============================================================
  drawGoldenThrone(ctx, camera, throne, now) {
    if (!throne) return;
    const sx = throne.x - camera.x + camera.screenW / 2;
    const sy = throne.y - camera.y + camera.screenH / 2;
    if (sx < -120 || sx > camera.screenW + 120 || sy < -120 || sy > camera.screenH + 120) return;

    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.8);
    const fastPulse = 0.5 + 0.5 * Math.sin(t * 6);
    const timeLeft = Math.max(0, throne.expiresAt - now);
    const urgency = timeLeft < 30000 ? 1 - timeLeft / 30000 : 0;

    ctx.save();
    ctx.translate(sx, sy);

    // === Outer divine glow ===
    const outerGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, 80);
    outerGlow.addColorStop(0, `rgba(255,215,0,${(0.18 + 0.1 * pulse) + urgency * 0.12})`);
    outerGlow.addColorStop(0.5, `rgba(255,165,0,${0.08 + 0.05 * pulse})`);
    outerGlow.addColorStop(1, 'rgba(255,120,0,0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.fill();

    // === Throne base steps ===
    ctx.fillStyle = `rgba(180,140,20,0.9)`;
    ctx.beginPath();
    ctx.roundRect(-28, 20, 56, 10, 3);
    ctx.fill();
    ctx.fillStyle = `rgba(210,170,30,0.9)`;
    ctx.beginPath();
    ctx.roundRect(-22, 12, 44, 10, 3);
    ctx.fill();

    // === Throne seat ===
    ctx.fillStyle = '#c8880a';
    ctx.beginPath();
    ctx.roundRect(-18, -2, 36, 16, 4);
    ctx.fill();
    // Gold seat highlight
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.roundRect(-16, -1, 32, 8, 3);
    ctx.fill();
    // Red velvet cushion
    ctx.fillStyle = '#cc2200';
    ctx.beginPath();
    ctx.roundRect(-14, 0, 28, 11, 3);
    ctx.fill();
    ctx.fillStyle = '#ff4422';
    ctx.beginPath();
    ctx.roundRect(-12, 1, 24, 7, 2);
    ctx.fill();
    // Cushion buttons
    ctx.fillStyle = '#ffd700';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * 8, 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // === Throne back ===
    ctx.fillStyle = '#c8880a';
    ctx.beginPath();
    ctx.roundRect(-18, -32, 36, 32, 4);
    ctx.fill();
    // Back highlight
    ctx.fillStyle = '#e0a020';
    ctx.beginPath();
    ctx.roundRect(-14, -28, 28, 26, 3);
    ctx.fill();
    // Royal crest on back — inner golden circle
    const glowVal = 0.7 + 0.3 * pulse;
    ctx.fillStyle = `rgba(255,215,0,${glowVal})`;
    ctx.beginPath();
    ctx.arc(0, -16, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c8880a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', 0, -16);

    // === Armrests ===
    ctx.fillStyle = '#c8880a';
    ctx.beginPath();
    ctx.roundRect(-26, -4, 10, 18, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(16, -4, 10, 18, 3);
    ctx.fill();
    // Armrest tops
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(-21, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(21, -4, 5, 0, Math.PI * 2);
    ctx.fill();

    // === Crown finials at top corners ===
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 8 + 5 * pulse;
    for (const fx of [-14, 14]) {
      ctx.beginPath();
      ctx.moveTo(fx - 5, -32);
      ctx.lineTo(fx, -44);
      ctx.lineTo(fx + 5, -32);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // === Claim progress arc (shows when player is claiming) ===
    if (throne.isClaiming && throne.claimProgress > 0) {
      const r = 52;
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + throne.claimProgress * Math.PI * 2;
      ctx.strokeStyle = `rgba(255,255,100,${0.8 + 0.2 * fastPulse})`;
      ctx.lineWidth = 5;
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, r, startAngle, endAngle);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineCap = 'butt';
      // "CLAIMING" text
      ctx.fillStyle = `rgba(255,255,80,${0.9 + 0.1 * fastPulse})`;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.fillText(`CLAIMING ${Math.floor(throne.claimProgress * 100)}%`, 0, 48);
      ctx.shadowBlur = 0;
    } else {
      // Orbit sparkles around throne
      for (let i = 0; i < 6; i++) {
        const ang = t * 1.4 + (i * Math.PI * 2) / 6;
        const orb = 48 + 4 * Math.sin(t * 2 + i);
        const ox = Math.cos(ang) * orb;
        const oy = Math.sin(ang) * orb;
        const sparkAlpha = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.2);
        ctx.fillStyle = `rgba(255,215,0,${sparkAlpha})`;
        ctx.beginPath();
        ctx.arc(ox, oy, 2 + Math.sin(t * 3 + i) * 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // === Labels ===
    const labelY = -60;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillStyle = `rgba(255,215,0,${0.9 + 0.1 * pulse})`;
    ctx.fillText('👑 GOLDEN THRONE', 0, labelY);
    ctx.shadowBlur = 0;

    // Expiry countdown
    if (timeLeft > 0) {
      const secsLeft = Math.ceil(timeLeft / 1000);
      const countColor = urgency > 0.5 ? '#ff4400' : urgency > 0 ? '#ffaa00' : '#ffff88';
      ctx.font = `bold ${urgency > 0.5 ? 10 : 9}px monospace`;
      ctx.fillStyle = countColor;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 3;
      ctx.fillText(`${secsLeft}s remaining`, 0, labelY + 14);
      ctx.shadowBlur = 0;
    }

    // Guards — draw using Sprites
    ctx.restore();

    if (throne.guards) {
      for (const guard of throne.guards) {
        const gsx = guard.x - camera.x + camera.screenW / 2;
        const gsy = guard.y - camera.y + camera.screenH / 2;
        if (gsx < -60 || gsx > camera.screenW + 60 || gsy < -60 || gsy > camera.screenH + 60) continue;
        Sprites.drawThroneGuard(ctx, gsx, gsy, guard.orbitAngle + Math.PI / 2, guard.state, guard.hp, guard.maxHp, now);
      }
    }
  },

  drawGoldenThroneOnMinimap(minimapCtx, worldData, throne, now) {
    if (!throne) return;
    const scale = minimapCtx.canvas.width / worldData.width;
    const px = throne.x * scale;
    const py = throne.y * scale;
    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.5);

    minimapCtx.save();
    minimapCtx.shadowColor = '#ffd700';
    minimapCtx.shadowBlur = 8 + 5 * pulse;
    minimapCtx.fillStyle = `rgba(255,215,0,${0.8 + 0.2 * pulse})`;
    minimapCtx.beginPath();
    minimapCtx.arc(px, py, 6 + 3 * pulse, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;
    minimapCtx.font = '9px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.textBaseline = 'middle';
    minimapCtx.fillText('👑', px, py);
    minimapCtx.restore();
  },

  drawThunderDomeOnMinimap(minimapCtx, worldData, dome, now) {
    if (!dome) return;
    const mw = minimapCtx.canvas.width;
    const mh = minimapCtx.canvas.height;
    const scaleX = mw / worldData.width;
    const scaleY = mh / worldData.height;
    const cx = dome.x * scaleX;
    const cy = dome.y * scaleY;
    const r = dome.radius * scaleX;

    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);

    minimapCtx.save();
    // Outer glow
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, r + 2 + pulse, 0, Math.PI * 2);
    minimapCtx.strokeStyle = `rgba(80, 160, 255, ${0.35 + 0.25 * pulse})`;
    minimapCtx.lineWidth = 3 + pulse * 2;
    minimapCtx.shadowColor = '#4499ff';
    minimapCtx.shadowBlur = 5 + 3 * pulse;
    minimapCtx.stroke();
    minimapCtx.shadowBlur = 0;

    // Inner bright ring
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, r, 0, Math.PI * 2);
    minimapCtx.strokeStyle = `rgba(180, 220, 255, ${0.7 + 0.3 * pulse})`;
    minimapCtx.lineWidth = 1.5;
    minimapCtx.stroke();

    // ⚡ label in center
    minimapCtx.font = '9px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.textBaseline = 'middle';
    minimapCtx.fillStyle = `rgba(180, 220, 255, ${0.8 + 0.2 * pulse})`;
    minimapCtx.fillText('⚡', cx, cy);
    minimapCtx.restore();
  },

  // ── Flash Mob ────────────────────────────────────────────────
  drawFlashMob(ctx, camera, flashMob, now) {
    if (!flashMob) return;
    const sx = flashMob.x - camera.x + camera.screenW / 2;
    const sy = flashMob.y - camera.y + camera.screenH / 2;

    const isActive = flashMob.state === 'active';
    const isMega = flashMob.participantCount >= 6;
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(now * (isActive ? 0.006 : 0.004)));

    ctx.save();

    if (isActive) {
      // Outer pulsing glow ring
      const glowR = 100 * pulse;
      const grad = ctx.createRadialGradient(sx, sy, 30, sx, sy, glowR);
      const alpha = isMega ? 0.35 * pulse : 0.2 * pulse;
      grad.addColorStop(0, `rgba(255, 60, 200, ${alpha})`);
      grad.addColorStop(1, 'rgba(255, 60, 200, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Participation radius ring (90px in world → scaled)
      const worldR = 90;
      const screenR = worldR; // 1:1 zoom assumed; renderer handles camera scale elsewhere
      ctx.beginPath();
      ctx.arc(sx, sy, screenR, 0, Math.PI * 2);
      ctx.strokeStyle = isMega
        ? `rgba(255, 220, 0, ${0.6 + 0.4 * pulse})`
        : `rgba(255, 100, 220, ${0.5 + 0.5 * pulse})`;
      ctx.lineWidth = isMega ? 3 : 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Party particles when MEGA MOB
      if (isMega) {
        const nParticles = 10;
        for (let i = 0; i < nParticles; i++) {
          const angle = (i / nParticles) * Math.PI * 2 + now * 0.0018;
          const r = 55 + 30 * Math.sin(now * 0.003 + i);
          const px = sx + Math.cos(angle) * r;
          const py = sy + Math.sin(angle) * r;
          const colors = ['#ff88cc', '#ffdd00', '#88ffee', '#ff6644', '#ccaaff'];
          ctx.beginPath();
          ctx.arc(px, py, 3 + pulse * 2, 0, Math.PI * 2);
          ctx.fillStyle = colors[i % colors.length];
          ctx.fill();
        }
      }

      // Center label
      ctx.font = `bold ${14 + 2 * pulse}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isMega ? '#ffdd00' : '#ff88cc';
      ctx.shadowColor = isMega ? '#ff8800' : '#cc00aa';
      ctx.shadowBlur = 8;
      ctx.fillText(isMega ? '🎉 MEGA MOB!' : '🎉 FLASH MOB', sx, sy - 110);
      ctx.shadowBlur = 0;

      // Participant count
      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(255,200,240,0.9)';
      ctx.fillText(`${flashMob.participantCount} birds inside`, sx, sy + 108);
    } else {
      // Warning phase — pulsing beacon
      const beaconR = 20 + 10 * pulse;
      const grad = ctx.createRadialGradient(sx, sy, 5, sx, sy, beaconR);
      grad.addColorStop(0, `rgba(200, 160, 255, ${0.7 * pulse})`);
      grad.addColorStop(1, 'rgba(200, 160, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, beaconR, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(220, 180, 255, ${0.7 + 0.3 * pulse})`;
      ctx.fillText('🎉 INCOMING!', sx, sy - 30);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(200,160,255,0.8)';
      ctx.fillText(flashMob.locationName, sx, sy + 28);
    }

    ctx.restore();
  },

  drawFlashMobOnMinimap(minimapCtx, worldData, flashMob, now) {
    if (!flashMob) return;
    const { worldW, worldH, mmW, mmH } = worldData;
    const cx = (flashMob.x / worldW) * mmW;
    const cy = (flashMob.y / worldH) * mmH;

    const isActive = flashMob.state === 'active';
    const isMega = flashMob.participantCount >= 6;
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(now * (isActive ? 0.008 : 0.005)));

    minimapCtx.save();
    const r = isActive ? 5 + 2 * pulse : 4 + 2 * pulse;
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, r, 0, Math.PI * 2);
    minimapCtx.fillStyle = isMega
      ? `rgba(255, 220, 0, ${0.8 + 0.2 * pulse})`
      : isActive
        ? `rgba(255, 80, 200, ${0.8 + 0.2 * pulse})`
        : `rgba(200, 160, 255, ${0.6 + 0.4 * pulse})`;
    minimapCtx.shadowColor = isMega ? '#ffcc00' : '#ff44cc';
    minimapCtx.shadowBlur = 5 + 3 * pulse;
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;

    minimapCtx.font = '9px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.textBaseline = 'middle';
    minimapCtx.fillStyle = 'rgba(255,255,255,0.9)';
    minimapCtx.fillText('🎉', cx, cy);
    minimapCtx.restore();
  },

  // ============================================================
  // AUCTION HOUSE (Session 108)
  // ============================================================
  drawAuctionHouse(ctx, camera, pos, auction, isNear, now) {
    const sx = (pos.x - camera.x) * camera.zoom + ctx.canvas.width / 2;
    const sy = (pos.y - camera.y) * camera.zoom + ctx.canvas.height / 2;
    const scale = camera.zoom;
    const isActive = auction && (auction.state === 'bidding' || auction.state === 'gap');
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(now * 0.003));

    ctx.save();
    ctx.translate(sx, sy);

    // Building body — grand ornate hall
    const bw = 90 * scale, bh = 65 * scale;
    const bx = -bw / 2, by = -bh;

    // Main building
    ctx.fillStyle = '#d4c08a';
    ctx.strokeStyle = '#8a6c2a';
    ctx.lineWidth = 1.5 * scale;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);

    // Roof / pediment triangle
    ctx.beginPath();
    ctx.moveTo(bx - 6 * scale, by);
    ctx.lineTo(sx - sx + 0, by - 22 * scale); // apex
    ctx.lineTo(bx + bw + 6 * scale, by);
    ctx.closePath();
    ctx.fillStyle = '#c0a060';
    ctx.fill();
    ctx.strokeStyle = '#7a5820';
    ctx.stroke();

    // Gavel icon in pediment
    ctx.font = `${12 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔨', 0, by - 10 * scale);

    // Six columns
    const numCols = 6;
    const colSpacing = bw / (numCols - 1);
    for (let i = 0; i < numCols; i++) {
      const cx2 = bx + i * colSpacing;
      ctx.fillStyle = '#f0dfa0';
      ctx.strokeStyle = '#8a6c2a';
      ctx.lineWidth = 1 * scale;
      ctx.fillRect(cx2 - 3 * scale, by, 6 * scale, bh);
      ctx.strokeRect(cx2 - 3 * scale, by, 6 * scale, bh);
    }

    // Grand entrance arch
    ctx.fillStyle = isActive ? `rgba(255, 220, 100, ${0.4 + 0.3 * pulse})` : '#c8a855';
    ctx.strokeStyle = '#7a5820';
    ctx.lineWidth = 1.5 * scale;
    const aw = 24 * scale, ah = 30 * scale;
    ctx.beginPath();
    ctx.arc(0, by + bh - ah + aw / 2, aw / 2, Math.PI, 0);
    ctx.lineTo(aw / 2, by + bh);
    ctx.lineTo(-aw / 2, by + bh);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sign above entrance
    ctx.fillStyle = '#2a1a00';
    ctx.font = `bold ${7 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('AUCTION', 0, by + 14 * scale);
    ctx.fillText('HOUSE', 0, by + 22 * scale);

    // Glow when auction is active
    if (isActive) {
      const grad = ctx.createRadialGradient(0, by - 10 * scale, 0, 0, by - 10 * scale, 60 * scale);
      grad.addColorStop(0, `rgba(255, 200, 50, ${0.25 * pulse})`);
      grad.addColorStop(1, 'rgba(255, 200, 50, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, by - 10 * scale, 60 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Proximity prompt
    if (isNear) {
      ctx.font = `${10 * scale}px sans-serif`;
      ctx.fillStyle = isActive ? '#ffd700' : '#cccc66';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(isActive ? '🔨 [A] Bid at Auction House' : '🏛️ Auction House', 0, by - 26 * scale);
    }

    ctx.restore();
  },

  drawSkyPirateShip(ctx, ship, now) {
    if (!ship) return;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    const hpFrac = ship.hp / ship.maxHp;
    const sinking = ship.sinking;

    // Balloon envelope (large oval)
    const balloonGrad = ctx.createRadialGradient(-10, -20, 5, 0, 0, 50);
    balloonGrad.addColorStop(0, '#cc2222');
    balloonGrad.addColorStop(0.5, '#881111');
    balloonGrad.addColorStop(1, '#440000');
    ctx.beginPath();
    ctx.ellipse(0, -18, 48, 30, 0, 0, Math.PI * 2);
    ctx.fillStyle = balloonGrad;
    ctx.fill();

    // Skull & crossbones on the balloon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☠', 0, -18);

    // Balloon outline
    ctx.beginPath();
    ctx.ellipse(0, -18, 48, 30, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#660000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ropes connecting balloon to gondola
    ctx.strokeStyle = '#996633';
    ctx.lineWidth = 1.5;
    for (let rx of [-20, 0, 20]) {
      ctx.beginPath(); ctx.moveTo(rx, 12); ctx.lineTo(rx * 0.6, 14); ctx.stroke();
    }

    // Gondola (wooden hull)
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.roundRect(-28, 14, 56, 20, 4);
    ctx.fill();
    ctx.strokeStyle = '#5c2d0a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Gondola planks
    ctx.strokeStyle = '#6b3210';
    ctx.lineWidth = 1;
    for (let px = -24; px < 28; px += 9) {
      ctx.beginPath(); ctx.moveTo(px, 14); ctx.lineTo(px, 34); ctx.stroke();
    }

    // Cannons (left and right)
    ctx.fillStyle = '#333333';
    ctx.save();
    ctx.translate(-28, 22); ctx.rotate(-0.15);
    ctx.fillRect(-10, -3, 18, 6); ctx.restore();

    ctx.save();
    ctx.translate(28, 22); ctx.rotate(0.15);
    ctx.fillRect(-8, -3, 18, 6); ctx.restore();

    // Pirate flag pole and flag
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(6, -48); ctx.lineTo(6, -14); ctx.stroke();
    ctx.fillStyle = '#111111';
    ctx.beginPath(); ctx.moveTo(6, -48); ctx.lineTo(22, -41); ctx.lineTo(6, -34); ctx.closePath(); ctx.fill();

    // Smoke damage at low HP
    if (!sinking && hpFrac < 0.5) {
      const numPuffs = Math.floor((1 - hpFrac) * 8);
      for (let i = 0; i < numPuffs; i++) {
        const puffX = -20 + i * 6 + Math.sin(now * 0.003 + i) * 4;
        const puffY = -8 + Math.cos(now * 0.004 + i * 1.3) * 5;
        const alpha = 0.3 + 0.3 * Math.abs(Math.sin(now * 0.002 + i));
        ctx.beginPath();
        ctx.arc(puffX, puffY, 5 + i * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,80,80,${alpha})`;
        ctx.fill();
      }
    }

    // Sinking effect — extra smoke and red tint
    if (sinking) {
      for (let i = 0; i < 10; i++) {
        const puffX = -25 + i * 5 + Math.sin(now * 0.008 + i) * 8;
        const puffY = -30 + Math.cos(now * 0.006 + i) * 12;
        const alpha = 0.5 + 0.3 * Math.abs(Math.sin(now * 0.005 + i));
        ctx.beginPath();
        ctx.arc(puffX, puffY, 8 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 50, 0, ${alpha})`;
        ctx.fill();
      }
      // Red danger glow
      const sg = ctx.createRadialGradient(0, 0, 10, 0, 0, 60);
      sg.addColorStop(0, 'rgba(255,50,0,0.15)');
      sg.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.ellipse(0, 0, 70, 50, 0, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();

    // HP bar above ship (only when damaged)
    if (!sinking && ship.hp < ship.maxHp) {
      const bw = 90, bh = 8;
      const bx = ship.x - bw / 2, by = ship.y - 70;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.roundRect(bx - 2, by - 2, bw + 4, bh + 4, 3); ctx.fill();
      ctx.fillStyle = hpFrac > 0.5 ? '#44cc44' : hpFrac > 0.25 ? '#eeaa22' : '#dd3333';
      ctx.fillRect(bx, by, bw * hpFrac, bh);
      ctx.strokeStyle = '#ffffff55';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(bx, by, bw, bh);
      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`☠️ AIRSHIP ${ship.hp}/${ship.maxHp}`, ship.x, by - 2);
    }
  },

  drawSkyPirateShipOnMinimap(minimapCtx, ship, worldData, now) {
    if (!ship) return;
    const { worldW, worldH, mmW, mmH } = worldData;
    const cx = (ship.x / worldW) * mmW;
    const cy = (ship.y / worldH) * mmH;
    const pulse = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.004));
    minimapCtx.save();
    minimapCtx.shadowColor = ship.sinking ? '#ff4400' : '#cc0000';
    minimapCtx.shadowBlur = 8 * pulse;
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, 5 + 2 * pulse, 0, Math.PI * 2);
    minimapCtx.fillStyle = ship.sinking ? `rgba(255,68,0,${0.7 + 0.3 * pulse})` : `rgba(200,0,0,${0.7 + 0.3 * pulse})`;
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;
    minimapCtx.font = '10px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.textBaseline = 'middle';
    minimapCtx.fillText('☠', cx, cy);
    minimapCtx.restore();
  },

  drawLootCrate(ctx, crate, now) {
    const bob = Math.sin(now * 0.004 + crate.id.length) * 3;
    const y = crate.y + bob;
    const pulse = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.005));

    // Glow
    const g = ctx.createRadialGradient(crate.x, y, 2, crate.x, y, 20);
    g.addColorStop(0, `rgba(255, 200, 0, ${0.5 * pulse})`);
    g.addColorStop(1, 'rgba(255,200,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(crate.x, y, 20, 20, 0, 0, Math.PI * 2); ctx.fill();

    // Chest body
    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.roundRect(crate.x - 12, y - 8, 24, 16, 2); ctx.fill();
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
    ctx.strokeRect(crate.x - 12, y - 8, 24, 16);

    // Gold band across middle
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(crate.x - 12, y - 2, 24, 4);

    // Lock
    ctx.beginPath(); ctx.arc(crate.x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffcc00'; ctx.fill();

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('LOOT', crate.x, y - 10);
  },

  drawAuctionHouseOnMinimap(minimapCtx, pos, worldData, auction, now) {
    const { worldW, worldH, mmW, mmH } = worldData;
    const cx = (pos.x / worldW) * mmW;
    const cy = (pos.y / worldH) * mmH;
    const isActive = auction && (auction.state === 'bidding' || auction.state === 'gap');
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(now * 0.003));

    minimapCtx.save();
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, isActive ? 5 + 2 * pulse : 4, 0, Math.PI * 2);
    minimapCtx.fillStyle = isActive
      ? `rgba(255, 210, 60, ${0.85 + 0.15 * pulse})`
      : 'rgba(200, 160, 60, 0.7)';
    minimapCtx.shadowColor = '#ffd700';
    minimapCtx.shadowBlur = isActive ? 6 + 3 * pulse : 3;
    minimapCtx.fill();
    minimapCtx.shadowBlur = 0;

    minimapCtx.font = '9px sans-serif';
    minimapCtx.textAlign = 'center';
    minimapCtx.textBaseline = 'middle';
    minimapCtx.fillText('🔨', cx, cy);
    minimapCtx.restore();
  },
};
