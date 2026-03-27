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

### Next Ideas Queue
- Territory control system (flocks claim zones, defend them)
- Underground sewer system (secret map layer)
- Wanted level escalation (police birds, SWAT hawks)
- Raid bosses (giant cat, dog pack, eagle overlord)
- Black market NPC (rare skills, forbidden items) — NIGHT ONLY for maximum flavor
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
