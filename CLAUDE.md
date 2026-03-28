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
- **BOSS/PREDATOR BEHAVIOR RULE (from human playtester — READ THIS):** Hawks, mega cats, eagle overlords, and ANY large predator must NEVER randomly attack players. Instead: (1) Give them their own TERRITORY on the map with clear warning signs like "⚠️ HAWK TERRITORY — BEWARE" (2) Only attack if the player ENTERS their territory AND stays after being warned (3) If attacked, the player either dies in 3 hits OR gets a 1-on-1 street-fighter style duel option. Currently these encounters are GLITCHY — the enemy doesn't die, the player doesn't die, it lasts 1+ minutes, and the game gets stuck. THIS IS THE #1 FUN-KILLER. Fix existing boss code to follow this territory model before adding anything new.

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

**Session 6 — 2026-03-27: The Black Market — Night-Only Contraband Shop**
A hooded raccoon fence sets up in a dark alley behind the Cafe District at dusk, vanishes at dawn. Fly within 110px at night and press B to shop. Five contraband items:
- 💉 **Speed Serum** (50c): +60% speed for 30 seconds
- 💣 **Mega Poop** (75c): next 3 poops are AOE blasts — the black market variant of the power-up
- 🎭 **Disguise Kit** (100c): instantly wipes all wanted heat + despawns every cop pursuing you
- 💨 **Smoke Bomb** (80c): cops lose your scent for 15 seconds (wander confused instead of chasing)
- 🍀 **Lucky Charm** (150c): 2× XP multiplier on all poop hits for 5 full minutes

**Server**: All effects server-authoritative. Speed stored as `bmSpeedUntil` timestamp, mega poop as `bmMegaPoops` count, smoke bomb as `bmSmokeBombUntil`, double XP as `bmDoubleXpUntil`. Smoke bomb modifies the cop pursuit loop — cops enter confused-wander mode instead. Disguise Kit has instant effect, wiping the heat map and clearing cop spawns.

**Visual**: Animated hooded raccoon sprite with glowing purple eyes, a coin bag, and a flickering "BLACK MKT" neon sign with a purple radial glow. Purple dot on minimap when open. Active items shown as buff pills in bottom-right HUD with live countdown timers. Shop popup has dark neon-purple theme.

**Creative intent**: Night was already *dangerous*. Now it's also *profitable*. The Disguise Kit is the game-changer — a Level 5 Most Wanted bird spending 100c to vanish into the shadows is a cinematic moment. The Lucky Charm turns poop sprints into XP explosions. Pure DISCOVERY + PROGRESSION energy. The city now has a shadow economy.

**Session 7 — 2026-03-28: Drunk Pigeons at Night — Pickpocket & Lightning Coin Shower**
Night is now even more chaotic. Up to 6 drunk pigeons stumble around the city after dark, loaded with coins. Fly near them to pickpocket their wallets. And when a storm rolls in... lightning + drunk pigeon = explosive coin shower.

**Drunk Pigeon NPC (`server/game.js`):**
- Up to 6 spawn at dusk (one every 20–35s), vanish at dawn with a message
- Movement: erratic stagger walk — direction changes every 0.8–2.5s with ±100° random swings + sine-wave side-to-side sway. Genuinely looks drunk
- Each pigeon carries 18–45 coins and bounces off world edges
- **Pickpocket mechanic**: Fly within 45px to steal 8–20 coins + 12 XP. 8s per-bird cooldown prevents farming the same pigeon
- After being pickpocketed: pigeon stumbles away with a sharp direction change (emergent chase behavior)

**Lightning Interaction (the killer feature):**
- When storm lightning strikes within 150px of a drunk pigeon: `_explodeDrunkPigeon()` fires
- All birds within 250px of the zapped pigeon instantly receive a windfall coin share + 30 XP
- Event announces winners city-wide: "⚡ Lightning zapped a drunk pigeon! Coins scattered: PlayerA (+22c), PlayerB (+18c)"
- Creates a risk-reward loop: hover near drunk pigeons during storms = maximum reward, but lightning can stun YOU too

**Visual Spectacle (`public/js/sprites.js`):**
- Custom `drawDrunkPigeon()` sprite: fatter pigeon body, drooped wings, bloodshot red eyes with half-closed lids, rosy cheeks, coin-badge label (🍺 Xc)
- 3 yellow stars orbit the head continuously (screen-space, no body-rotation snap)
- Body sways with sine-wave wobble + vertical bob (each pigeon independently phased)
- Coin badge updates live as pickpockets drain them

**Event Feed & Announcements:**
- Spawn: "🍺 DRUNK PIGEONS ARE OUT TONIGHT!"
- Pickpocket: shows floating "+Xc" at pigeon position, event feed shoutout
- Coin shower: full screen shake + "⚡🍺 DRUNK PIGEON ZAPPED — COIN SHOWER!" + individual winner callouts
- Dawn: "The drunk pigeons passed out and went home."

**Creative intent**: Night was already dangerous (cats, raccoons, cops, black market). Now it's also PROFITABLE in a new way. Drunk pigeons create a risk-reward economy: do you risk getting close during a storm for the coin shower windfall? Or play it safe and pickpocket slowly? Lightning is no longer just a hazard — it's an opportunity if you're near the right target. Pure DISCOVERY + CARNAGE energy. The emergent behavior of birds chasing drunk pigeons during storms while also dodging lightning is peak Bird City chaos.

**Session 8 — 2026-03-28: Eagle Overlord Raid Boss**
The apex predator of Bird City has arrived. The Eagle Overlord is a massive aerial raid boss that the entire playerbase must cooperate to bring down — or it steals your coins and flies away laughing.

**Eagle Overlord mechanics (`server/game.js`):**
- Spawns as one of three boss types (25% chance vs MEGA_CAT/MEGA_HAWK) from the map edge, initially swooping toward the city center
- 300 HP (vs 100 for the cat) — requires real player cooperation to kill
- **Swooping arc movement**: doesn't just chase birds. Steers toward the nearest bird while oscillating perpendicular to its heading (sine wave), creating dramatic dive-bomb flight patterns that bounce off world edges
- **Snatch mechanic**: flies within 50px of a bird → grabs them and carries them for 5 seconds, stealing 12% of their coins. Snatched bird is locked in the eagle's talons, stunned — shown with a 😱 indicator on the eagle sprite
- **Rescue mechanic**: another player hits the eagle with poop while it's carrying someone → immediate release! Creates cooperative counter-play
- **Passive flanking damage**: birds within 60px deal 0.4 HP/s passive damage, incentivising brave proximity
- **Poop hits**: deal 8 HP each (24 for Mega Poop) — damage tracked per bird for proportional rewards
- **90-second escape timer**: if the eagle survives 90 seconds, it robs the richest bird of 30% of their coins and flies off. Failure has consequences
- **Defeat rewards**: all contributors get XP and coins scaled by their damage share (60–300 XP, 25–200 coins). Top contributors get enormous payouts

**Visual (`public/js/sprites.js`, `public/js/main.js`):**
- Custom `drawEagleOverlord()` sprite at 3× scale: massive wingspan with layered feather depth, golden wing tips, hooked beak, glowing pulsing orange eyes with shadow blur
- Ground shadow ellipse drawn beneath the eagle (suggesting high altitude)
- Snatched bird shown as 😱 in the eagle's talons
- Wide orange HP bar (120px vs 60px) labeled "🦅 EAGLE OVERLORD" with HP numbers
- Escape countdown timer above the boss that turns red at <20 seconds ("ESCAPES IN Xs")
- Orange pulsing dot on minimap (larger than normal boss dot) with 🦅 emoji
- Event announcements for: spawn, snatch, rescue, release, eagle rob, eagle escape, defeat

**Creative intent**: The Eagle Overlord hits every pillar at once. CARNAGE: it snatches players mid-flight. SOCIAL: requires coordinated poop bombardment to defeat — and rescuing a snatched teammate is a heroic moment. SPECTACLE: the 3× scale sprite swooping across the city with a 90-second countdown is thrilling. PROGRESSION: reward scaling means high-effort players get huge payouts. DISCOVERY: seeing it appear for the first time from the map edge is genuinely surprising. This is Bird City's first true RAID event.

**Session 9 — 2026-03-28: Poop Combo Streak System**
Every mechanic now rewards aggressive, uninterrupted play. Chain poop hits within 8 seconds to build a combo streak with escalating XP multipliers. The longer your streak, the bigger the payout — and the more you have to lose.

**Combo Multiplier Tiers (`server/game.js`):**
- x1 (1-2 hits): no bonus
- x1.5 (3-4 hits): 50% XP boost
- x2.0 (5-6 hits): double XP
- x2.5 (7-9 hits): 2.5× XP
- x3.0 (10-14 hits): triple XP
- x4.0 (15+ hits): quadruple XP — god-tier rampage

**Combo mechanics:**
- 8-second window to land the next hit before streak resets
- Hits on ANY target extend the combo: NPCs, cars, cops, raccoons, the eagle, statues, laundry — everything counts
- Stacks multiplicatively with Lucky Charm (Black Market double XP buff) — a 4× combo + Lucky Charm = 8× XP per hit
- **Combo breakers**: getting arrested by cops, stunned by lightning, snatched by the eagle, or caught by a cat all instantly wipe your streak — adds real consequences to those systems
- City-wide milestone broadcasts at x5, x10, x15, x20 combos

**Visual (`public/js/main.js`, `public/css/style.css`):**
- Floating `🔥 x5` text on each hit when combo ≥ 3 (color intensifies from orange → red → magenta as streak climbs)
- Combo HUD pill in top-right corner: `🔥 COMBO x7  2.5× XP` with orange border glow
- At combo 10+: HUD goes `mega` class — magenta color, pulsing box-shadow animation
- Personal screen shake on milestone achievements (scaled to combo level)
- Event feed shouts like "🔥🔥 PlayerName is ON FIRE! x10 combo!" visible to all players

**Creative intent**: This makes EVERY existing mechanic more exciting. Instead of pooping casually, you're now chasing a streak, keeping it alive, and terrified of getting caught. The cat, cops, eagle, and lightning all now have a second layer of threat: they don't just hurt you — they ERASE your streak. High-combo play is visible to all players (city-wide broadcasts), creating a social spectacle. Lucky Charm + high combo creates explosive XP moments that feel genuinely earned. Pure PROGRESSION + CARNAGE energy.

**Session 10 — 2026-03-28: The Godfather Raccoon — Night Crime Boss**
A slow-moving crime lord stalks Bird City's wealthiest birds once per night, demanding tribute and rewarding the brave birds who take him down.

**Godfather Raccoon mechanics (`server/game.js`):**
- Spawns once per night phase, randomly (0.3% chance per tick ≈ ~1 per 17s average window), requiring ≥1 player online
- 220 HP, moves at 50px/s — slower than regular raccoons, but relentlessly stalks the richest bird
- **Tribute mechanic**: Any bird that flies within 75px gets shaken down for 18% of their coins (max 180c), with a 15s per-bird cooldown. Displays "💰 Xc collected" label showing total haul
- **Poop damage**: 12 HP per hit (36 for Mega Poop). Rewards tracker ensures proportional payouts to all contributors
- **3-minute escape timer**: If not defeated, he grabs 25% of the top 2 richest birds' coins and flees at 170px/s
- **Dawn escape**: If night ends first, he slips away with a 15% tax on the 2 richest birds
- **Defeat rewards**: All contributors split a pot of 200c + all tribute coins collected. Top contributors earn 80–430 XP and massive coin shares

**Visual (`public/js/sprites.js`):**
- Custom `drawGodfatherRaccoon()` at 2.2× scale: pinstripe suit body with subtle white stripes, white shirt front + dark red tie, fedora hat with cream band, gold glowing eyes with glow blur, cigar with animated smoke puff
- Purple menace aura (pulsing glow ellipse behind body)
- 80px HP bar labeled "🎩 GODFATHER" in gold
- Live "💰 Xc collected" tribute counter below sprite
- Pulsing gold/purple 🎩 dot on minimap

**Events & announcements:**
- Spawn: massive city-wide announcement + screen shake
- Tribute: "The Godfather shook down [Bird] for Xc. 'Nice coins ya got there.'" + floating coin loss indicator
- Hit: floating damage number (−12 HP) for the shooter
- Defeated: screen shake + "THE GODFATHER IS DOWN! THE CITY IS FREE!" + reward callouts
- Escaped: "THE GODFATHER ESCAPED — robbing [victims] on his way out"

**Creative intent**: The Godfather fills a gap in the night economy. Until now, night had dangerous threats (cats, cops) and profitable opportunities (raccoon thieves, drunk pigeons, black market). The Godfather is BOTH: a dangerous passive threat that drains your coins just for being nearby, AND a lucrative cooperative target. Low-coin birds can try to free-ride on the fight. Rich birds must decide: flee and survive, or stand your ground and earn the big payout. "The richest bird gets targeted" creates instant social drama — the night's whale suddenly has a crime boss hunting them while everyone else decides whether to help or watch. Pure CARNAGE + SOCIAL energy.

### URGENT PRIORITY FIX (from human playtester Akhil — 2026-03-28)
**Boss/predator encounters are STILL broken and glitchy.** Hawks, mega cats, eagle overlord, Godfather Raccoon — they all have the same problem:
1. They randomly attack players who are just trying to play
2. The fight doesn't resolve — enemy doesn't die, player doesn't die, it just loops for 1+ minutes
3. The game gets stuck during the encounter — player can't do anything

**THE FIX — Territory-based predators (NOT random ambushes):**
- Give each predator (hawk, mega cat, eagle) their OWN territory zone on the map
- Mark it clearly: "⚠️ HAWK TERRITORY — ENTER AT YOUR OWN RISK" warning signs
- When a player enters: show a warning popup/banner. If they stay, THEN the predator attacks
- If attacked: player dies in 3 hits OR gets a 1-on-1 street-fighter style duel (player choice)
- Duels should have a clear win/lose condition that resolves in 15-30 seconds MAX
- If the player wins: big rewards. If they lose: they respawn with some penalty
- **NO random spawning of predators anywhere on the map. They stay in their territory.**

This applies to: hawk, mega cat, eagle overlord, AND the Godfather Raccoon.
Regular small threats (cops, normal raccoons, normal cats) can still roam freely.

**Do this BEFORE adding any new features. The game is currently unplayable when a boss spawns.**

### URGENT PRIORITY FIX #2 (from human playtester Akhil — 2026-03-28)
**UI/UX is broken in multiple places. Fix ALL of these before building new features:**

**1. Skill Shop is not accessible / unusable:**
- Players can't easily find or open the skill shop
- No close/X button to dismiss the shop UI
- Buying and equipping skills is confusing and not user-friendly
- You can apparently equip more than one skill but then only one shows — this is broken and misleading
- Make the shop intuitive: clear buy button, clear equip/unequip, show ALL equipped skills visibly
- Poop powers need to feel more exciting — better names, better descriptions, visual preview of what they do

**2. Flock Lobby overlaps Mission Board:**
- When you open the Mission Board, the Flock Lobby UI overlaps on top of it
- You can't read or interact with the missions because the flock UI is covering it
- Fix z-index / visibility so only one panel shows at a time, or add proper close buttons to each

**3. General UI cleanup needed:**
- Every popup/overlay/panel MUST have a visible close/X button
- Only one panel should be visible at a time (skill shop, mission board, flock lobby, bird home)
- Opening one panel should close any other open panel

**These are basic usability issues that make the game frustrating. Fix them.**

### Next Ideas Queue
- Underground sewer system (secret map layer)
- Eagle Overlord rare drop: "Eagle Feather" cosmetic badge
- Graffiti system (birds tag buildings for territory)
- Food truck heists (multiplayer coordinated robbery)
- Pigeon mafia questline
- Arena/colosseum PvP zone
- Nest building and decoration
- Egg protection mini-game
- Bird gangs with custom colors/tags
- Radio tower control (broadcast messages server-wide)
- Owl enforcer in park at night (creates no-poop zone, alerts NPCs)
- Bioluminescent park pond at night (glowing water effect)
- Weather combos: fog (low visibility), hailstorm (poop projectiles deflected), hot day (food spoils faster)
- Birds can shelter under awnings/trees during storms (mechanic: reduced lightning hit radius if near cover)
- ~~Combo multiplier: chain actions (poop→steal→pickpocket) for escalating XP bonuses~~ (DONE Session 9)
- ~~Raccoon boss: "The Godfather Raccoon" — giant alpha raccoon that steals from players directly~~ (DONE Session 10)
