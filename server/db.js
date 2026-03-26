const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'birdcity.db'));

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS birds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'pigeon',
    xp INTEGER DEFAULT 0,
    food INTEGER DEFAULT 0,
    shiny_things INTEGER DEFAULT 0,
    total_poops INTEGER DEFAULT 0,
    total_steals INTEGER DEFAULT 0,
    total_hits INTEGER DEFAULT 0,
    humans_cried INTEGER DEFAULT 0,
    nest_x REAL,
    nest_y REAL,
    last_x REAL DEFAULT 1500,
    last_y REAL DEFAULT 1500,
    created_at INTEGER DEFAULT (unixepoch()),
    last_seen INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS poops (
    id TEXT PRIMARY KEY,
    bird_id TEXT,
    x REAL NOT NULL,
    y REAL NOT NULL,
    hit_target TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_poops_pos ON poops(x, y);
`);

// Add new columns for skill system
try { db.exec('ALTER TABLE birds ADD COLUMN coins INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec('ALTER TABLE birds ADD COLUMN owned_skills TEXT DEFAULT \'["poop_barrage"]\''); } catch(e) {}
try { db.exec('ALTER TABLE birds ADD COLUMN equipped_skills TEXT DEFAULT \'["poop_barrage"]\''); } catch(e) {}
try { db.exec('ALTER TABLE birds ADD COLUMN bird_color TEXT DEFAULT NULL'); } catch(e) {}

const stmts = {
  getBird: db.prepare('SELECT * FROM birds WHERE id = ?'),
  upsertBird: db.prepare(`
    INSERT INTO birds (id, name, type, xp, food, shiny_things, total_poops, total_steals, total_hits, humans_cried, last_x, last_y, coins, owned_skills, equipped_skills, bird_color, last_seen)
    VALUES (@id, @name, @type, @xp, @food, @shiny_things, @total_poops, @total_steals, @total_hits, @humans_cried, @last_x, @last_y, @coins, @owned_skills, @equipped_skills, @bird_color, unixepoch())
    ON CONFLICT(id) DO UPDATE SET
      name=@name, type=@type, xp=@xp, food=@food, shiny_things=@shiny_things,
      total_poops=@total_poops, total_steals=@total_steals, total_hits=@total_hits,
      humans_cried=@humans_cried, last_x=@last_x, last_y=@last_y,
      coins=@coins, owned_skills=@owned_skills, equipped_skills=@equipped_skills, bird_color=@bird_color,
      last_seen=unixepoch()
  `),
  savePoop: db.prepare('INSERT OR IGNORE INTO poops (id, bird_id, x, y, hit_target, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
  getPoopsInArea: db.prepare('SELECT * FROM poops WHERE x BETWEEN ? AND ? AND y BETWEEN ? AND ?'),
  getLeaderboard: db.prepare('SELECT name, type, total_poops, total_steals, total_hits, humans_cried, xp FROM birds ORDER BY xp DESC LIMIT 20'),
  getPoopCount: db.prepare('SELECT COUNT(*) as count FROM poops'),
  cleanOldPoops: db.prepare('DELETE FROM poops WHERE created_at < unixepoch() - 86400'), // clean poops older than 24h
  deletePoop: db.prepare('DELETE FROM poops WHERE id = ?'),
};

module.exports = { db, stmts };
