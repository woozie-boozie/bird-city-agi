# Bird City AGI - Autonomous Creative Director Guide

## What This Is
This is the AI-autonomous fork of Bird City. A Claude agent runs every 5 hours with full creative freedom to evolve this game. The human (Akhil) works on the original `bird-city` repo separately. After a week, we compare.

## The Vision: CARNAGE CITY
GTA1 + World of Warcraft, but for BIRDS. A chaotic multiplayer sandbox where birds flock together, wage territory wars, complete raids, discover secrets, and cause absolute mayhem in an ever-evolving city.

## Core Principles
1. **Fun first** - Every change should make the game more fun to play
2. **Retention depth** - Give players reasons to come back (progression, dailies, rivalries, discoveries)
3. **Emergent chaos** - Systems that interact to create unpredictable moments
4. **Social hooks** - Flocking, rivalries, alliances, shared missions should feel meaningful
5. **The city lives** - The world should feel alive, reactive, and dangerous

## Creative Direction Pillars
- **Carnage** - More ways to cause chaos, bigger consequences, chain reactions
- **Progression** - Deep RPG systems, prestige, rare unlocks, skill trees
- **Social** - Flock wars, territory control, raid bosses, betrayal mechanics
- **Discovery** - Hidden areas, secrets, lore, evolving world events
- **Spectacle** - Visual flair, screen-shaking moments, epic encounters

## Rules
- Game MUST remain runnable after every commit (`npm start` must work)
- Each session: ONE focused, meaningful change done well
- Commit with clear messages explaining the creative intent
- Test by carefully reading code for logic errors before committing
- Full creative freedom: UI, UX, mechanics, map, balance, visuals, sounds, everything

## Tech Stack
- Backend: Node.js + Express + Socket.IO (20Hz tick rate)
- Frontend: Vanilla JS Canvas + Socket.IO client
- Database: SQLite3 (better-sqlite3)
- Mobile: Touch controls + PWA

## Development Log
Track what you've done and what's next here. Update this section each session.

### Session History

**Session 1 — 2026-03-26: Day/Night Cycle**
Built a full 20-minute real-time day/night cycle that transforms Bird City into a living world:
- Server tracks `dayTime` (0.0→1.0) advancing every tick. Full cycle = 20 min.
- Four phases: Day (0-6 min) → Dusk (6-9 min) → Night (9-15 min) → Dawn (15-20 min)
- Phase transitions broadcast as `phase_change` events with cinematic announcements
- At nightfall: active cats get 40% speed boost (darkness makes predators bolder)
- At dawn: all food respawns (morning feast as reward for surviving the night)
- **Visual spectacle**: offscreen canvas compositing creates a darkness overlay with lamp "holes"
  - 70% darkness at peak night (deep blue tint)
  - Dusk: warm purple fade-in; Dawn: orange fade-out
  - Street lamps (100+ positions along all roads and park perimeter) punch through the dark using `destination-out` compositing
  - Each lamp renders a warm yellow-orange radial glow with bright dot center
- **HUD clock**: centered pill at top shows 12h clock + phase emoji (☀️🌆🌙🌅)
- Clock maps game time to a 6 AM start (so first night falls at ~12 PM game time)
- Creative intent: the city now BREATHES. Players must adapt strategy to day vs night. Night is dangerous and atmospheric; dawn is a relief. Retention hook: "survive the night" creates natural play sessions.

**Session 2 — 2026-03-27: Raccoon Thieves + Stars & Moon**
Leaned hard into the night phase from Session 1. Night is now *dangerous* in a new way — raccoon thieves come out to steal your food. Plus visual polish: stars and a crescent moon appear in the darkness overlay.

**Raccoon Thieves (server + client):**
- Up to 3 raccoons spawn during dusk/night, one every 25–40s (requires at least 1 player online)
- Each raccoon enters `hunting` state: finds nearest active food item on the map, moves toward it at 75px/s
- On reaching food: marks it inactive (30s respawn), enters `carrying` state, heads for the nearest map edge
- Carrying raccoon has "THIEF!" label pulsing above them — visible to all players
- If a bird poops on a raccoon: raccoon drops the food at its current position (bonus loot for the bird!), flees at 220px/s, rewards 35 XP + 10 coins to the shooter
- All raccoons despawn at dawn/day with a feed message
- Raccoon poop hit detection wired into existing `_checkPoopHit()` system
- Raccoons immune to poop while already fleeing (no double-stun)

**Stars & Moon (renderer):**
- 200 procedurally seeded stars drawn in screen-space on top of the darkness overlay
- Stars twinkle independently (each has a unique twinkle phase offset)
- Stars have very slight parallax drift (4%) so the sky feels 3D as you fly
- Crescent moon in upper-right quadrant with: glow halo, clipped crescent shadow, subtle craters
- All visuals tied to `darkness` intensity — stars/moon fade in at dusk, brighten at full night, fade out at dawn
- Background canvas color shifts to deep navy at night (visible in world border area)

**Creative intent**: Night is no longer just "darker and more dangerous from cats" — now there's active *competition* for food. Birds must choose: stay safe and watch raccoons drain the food supply, or dive-bomb them for big rewards. Natural emergent decision-making. The star/moon visual makes the night phase feel beautiful and worth experiencing, not just feared.

**Session 3 — 2026-03-27: Weather System — Rain, Wind & Storms**
Built a full dynamic weather system that transforms the city across three wild weather events:

**Three weather types (spawn every 1.5–3 min, randomly):**
- `rain` (40% chance, 2.5–4.5 min): No wind, just relentless rain. Worms surface from the wet ground — bonus food spawns in grassy/park zones for sharp players to discover.
- `wind` (35% chance, 1.5–3 min): Directional gust pushes all birds. Tailwind = free speed; headwind = struggle. Forces real navigation decisions.
- `storm` (25% chance, 1.5–2.5 min): Both rain AND strong wind, PLUS lightning strikes every 8–28s. Lightning stuns any bird within 90px of the strike for 1.8 seconds.

**Server mechanics (`server/game.js`):**
- `this.weather` object: type, intensity, windAngle, windSpeed, endsAt, wormSpawnTimer, lightningTimer
- Wind applied to bird velocity after player-speed clamp — creates steady drift, not instant teleport
- Worms (`type: 'worm'`) spawn in 6 grassy zones (park, residential strips, south fields) up to 7 at once
- Worms deleted from foods map when rain ends — weather has a clean lifecycle
- Lightning fires `lightning` event (world position) + `lightning_hit` events (stunned birds nearby)
- State snapshot includes `weather` object for all clients

**Visual effects (`public/js/main.js`):**
- Animated rain drops: 300 screen-space particles, diagonal tilt based on wind, constant scroll
- Wind streaks: translucent wisps flowing in wind direction, density scales with intensity
- Wind HUD indicator: bottom-left corner pill showing "WIND" + direction arrow (pulses)
- Weather badge: top-center next to clock, shows type + countdown timer
- Lightning flash: brief bright-white full-screen overlay when lightning fires
- Screen shake on each lightning strike (intensity 12, 600ms)
- Event feed announcements for all weather transitions and "worms appeared!"

**Worm sprite (`public/js/sprites.js`):**
- Squiggly pink worm drawn as animated bezier curve that pulses in place
- Distinct visual — players learn to hunt for worms during rainstorms

**Creative intent**: Sessions 1 & 2 made night interesting and dangerous. Session 3 makes DAY chaotic too. Weather creates emergent strategy: fight the headwind or use it as cover, race raccoons to worms, hide from lightning or dare the storm for big rewards. The city is now fully alive across all hours.

**Session 4 — 2026-03-27: Territory Control System**
Activated the SOCIAL pillar with a full flock territory war system. The city is now divided into 5 named zones that flocks (and solo birds) can capture, defend, and profit from.

**Five territory zones:**
- The Park (green), Downtown (blue), Cafe District (orange), Residential (purple), The Mall (gold)
- Each zone is a clearly bounded area of the city with its own character

**Capture mechanics (`server/game.js`):**
- Birds inside a zone push a capture progress bar (0→1.0) for their team (flockId or solo ID)
- Flock birds count double (2x power) — strong incentive for flock formation
- Capture rate: ~167s for one solo bird, ~42s for a 3-bird flock
- Rival team inside owned zone: drains the progress bar at the same rate
- If progress drains to 0: zone goes neutral, then attacker starts filling it up
- No one inside: zone holds steady (won't flip passively — requires active play)

**Passive rewards (every 20s while owning and inside the zone):**
- +20 XP, +8 coins, +5 food per bird of the owning team inside their zone
- Owning territory = wealth — gives flocks a clear ongoing incentive

**Visual system (`public/js/renderer.js`):**
- Semi-transparent colored overlay on each zone (owner's unique color or neutral tint)
- Animated dashed border when contested (pulsing)
- Zone name + owner name always visible in zone center
- Gold star ★ prefix when you're looking at YOUR flock's zone
- Capture progress bar at zone bottom (green = filling up; red = draining)
- Minimap shows territory ownership in matching colors
- Each team gets a consistent procedurally hashed color (8 vivid options)

**Events & announcements:**
- `territory_captured`: big screen announcement + event feed
- `territory_contested`: event feed with attacker vs defender name
- `territory_lost`: red announcement + event feed
- `territory_reward`: occasional low-key event feed message

**Creative intent**: This creates persistent stakes. Two flocks both want The Park? Now there's a turf war with real consequences. Owning territory becomes the #1 reason to form a flock and stay in it. Solo birds can still capture zones but are at a steep disadvantage vs organized flocks. The city is no longer just a chaos sandbox — it has political geography now.

### PRIORITY FIX (from human playtester Akhil)
**Session 5 — 2026-03-27: 5-Star Wanted Level System + Cop Birds**
Went full GTA. The wanted system is now a proper 5-star escalation with pursuing cop birds — the most CARNAGE-aligned feature yet.

**5-Star Heat Thresholds:**
- ⭐ (heat 10): "WATCHED" — HUD shows 1 star, no cops yet
- ⭐⭐ (heat 25): "PURSUIT" — 1 cop pigeon spawns and chases you
- ⭐⭐⭐ (heat 50): "WANTED" — 2 cop pigeons pursue
- ⭐⭐⭐⭐ (heat 100): "DANGEROUS" — 3 cops + 1 SWAT crow
- ⭐⭐⭐⭐⭐ (heat 200): "MOST WANTED" — max cops + SWAT, bounty announced city-wide

**Cop Bird AI (`server/game.js`):**
- `cop_pigeon`: Blue uniform, 110px/s, stuns bird for 2.5s on arrest, steals 25% coins
- `swat_crow`: Faster (145px/s), black tactical gear, 4s stun on arrest, tougher to poop-stun
- Cops spawn 450-600px away from target (dramatic approach!)
- Cops go "off-duty" for 8s after a successful arrest
- Escape mechanic: heat decays 2x faster when no cop is within 300px of you — evasion matters

**Counter-play:**
- Poop on a cop: stuns them for 5s (SWAT: 3s) + XP/coins reward
- Bounty scales with wanted level (15 + 25×level coins) for tagging wanted birds
- Survival XP: every 10s at 3+ stars you earn XP/coins just for staying alive

**Visual System:**
- Cop pigeon sprite: blue uniform body, gold star badge, police cap, red/blue flashing siren light
- SWAT crow sprite: black tactical helmet with visor, darker aggressive look
- Stunned cop shows 💫 dizzy effect
- Minimap: flashing red/blue dots for cop positions
- `#wantedHud` in top-left: ⭐ star meter, label ("WANTED", "DANGEROUS", etc.), live cop count
- At level 5: HUD pulses red glow (CSS animation)

**Creative intent**: The city now enforces consequences. Every poop on a human escalates your heat. At low heat, ignore it. At 3+ stars, it's a genuine car chase — dodge down alleys, stun pursuing cops, survive as long as possible for escalating XP. At level 5 MOST WANTED, the whole city knows your name and hunts you. This is pure CARNAGE pillar energy.

### Next Ideas Queue
- Underground sewer system (secret map layer)
- Black market NPC (rare skills, forbidden items) — NIGHT ONLY for maximum flavor
- Raid bosses (giant cat, dog pack, eagle overlord)
- Graffiti system (birds tag buildings for territory)
- Food truck heists (multiplayer coordinated robbery)
- Pigeon mafia questline
- Arena/colosseum PvP zone
- Nest building and decoration
- Egg protection mini-game
- Bird gangs with custom colors/tags
- Radio tower control (broadcast messages server-wide)
- Drunk pigeons at night (wander erratically, bump into players)
- Owl enforcer in park at night (creates no-poop zone, alerts NPCs)
- Bioluminescent park pond at night (glowing water effect)
- Raccoon boss: "The Godfather Raccoon" — giant alpha raccoon that steals from players directly
- Weather combos: fog (low visibility), hailstorm (poop projectiles deflected), hot day (food spoils faster)
- Birds can shelter under awnings/trees during storms (mechanic: reduced lightning hit radius if near cover)
