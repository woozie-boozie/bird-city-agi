const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
// Priority: FIREBASE_CONFIG env var > ./firebase-key.json > GOOGLE_APPLICATION_CREDENTIALS (ADC)
let app;
if (process.env.FIREBASE_CONFIG) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  const keyPath = path.join(__dirname, '..', 'firebase-key.json');
  if (fs.existsSync(keyPath)) {
    const serviceAccount = require(keyPath);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fall back to GOOGLE_APPLICATION_CREDENTIALS / ADC
    app = admin.initializeApp();
  }
}

const firestore = admin.firestore();

const birdsCol = firestore.collection('birds');
const poopsCol = firestore.collection('poops');
const gangsCol = firestore.collection('gangs');

const db = {
  /**
   * Get a bird document by id. Returns object with SQLite-compatible field names, or null.
   */
  async getBird(id) {
    const doc = await birdsCol.doc(id).get();
    if (!doc.exists) return null;
    return doc.data();
  },

  /**
   * Upsert (set with merge) a bird document.
   * Data should include { id, name, type, xp, food, shiny_things, ... }
   */
  async upsertBird(data) {
    const id = data.id;
    const docData = {
      name: data.name,
      type: data.type,
      xp: data.xp,
      food: data.food,
      shiny_things: data.shiny_things,
      total_poops: data.total_poops,
      total_steals: data.total_steals,
      total_hits: data.total_hits,
      humans_cried: data.humans_cried,
      last_x: data.last_x,
      last_y: data.last_y,
      coins: data.coins,
      owned_skills: data.owned_skills,
      equipped_skills: data.equipped_skills,
      bird_color: data.bird_color,
      mafia_rep: data.mafia_rep || 0,
      daily_date: data.daily_date || '',
      daily_progress: data.daily_progress || '{}',
      daily_completed: data.daily_completed || '[]',
      daily_streak: data.daily_streak || 0,
      daily_streak_date: data.daily_streak_date || '',
      gang_id: data.gang_id || null,
      gang_name: data.gang_name || null,
      gang_tag: data.gang_tag || null,
      gang_color: data.gang_color || null,
      gang_role: data.gang_role || null,
      last_seen: Math.floor(Date.now() / 1000),
    };
    await birdsCol.doc(id).set(docData, { merge: true });
  },

  /**
   * Save a poop document.
   */
  async savePoop(id, birdId, x, y, hitTarget, createdAt) {
    await poopsCol.doc(id).set({
      bird_id: birdId,
      x: x,
      y: y,
      hit_target: hitTarget || null,
      created_at: createdAt,
    });
  },

  /**
   * Get all poops.
   */
  async getPoops() {
    const snapshot = await poopsCol.get();
    const poops = [];
    snapshot.forEach(doc => {
      poops.push({ id: doc.id, ...doc.data() });
    });
    return poops;
  },

  /**
   * Delete a poop by id.
   */
  async deletePoop(id) {
    await poopsCol.doc(id).delete();
  },

  /**
   * Gang CRUD — persistent named criminal gangs.
   */
  async getGang(id) {
    const doc = await gangsCol.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async upsertGang(data) {
    await gangsCol.doc(data.id).set({
      name: data.name,
      tag: data.tag,
      color: data.color,
      leader_id: data.leaderId,
      leader_name: data.leaderName,
      treasury: data.treasury || 0,
      member_names: data.memberNames || {},
      created_at: data.createdAt || Date.now(),
    }, { merge: true });
  },

  async getAllGangs() {
    const snapshot = await gangsCol.get();
    const gangs = [];
    snapshot.forEach(doc => {
      gangs.push({ id: doc.id, ...doc.data() });
    });
    return gangs;
  },

  async deleteGang(id) {
    await gangsCol.doc(id).delete();
  },

  /**
   * Get top 20 birds by XP (leaderboard).
   */
  async getLeaderboard() {
    const snapshot = await birdsCol.orderBy('xp', 'desc').limit(20).get();
    const results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      results.push({
        name: data.name,
        type: data.type,
        total_poops: data.total_poops || 0,
        total_steals: data.total_steals || 0,
        total_hits: data.total_hits || 0,
        humans_cried: data.humans_cried || 0,
        xp: data.xp || 0,
      });
    });
    return results;
  },

  /**
   * Delete poops older than 24 hours.
   */
  async cleanOldPoops() {
    const cutoff = Math.floor(Date.now() / 1000) - 86400;
    const snapshot = await poopsCol.where('created_at', '<', cutoff).get();
    const batch = firestore.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    if (!snapshot.empty) {
      await batch.commit();
    }
  },
};

module.exports = { db };
