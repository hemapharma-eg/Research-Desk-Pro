const Database = require('better-sqlite3');
const path = require('node:path');
const { app } = require('electron');
const fs = require('fs');
const crypto = require('crypto');

let db = null;

function initAppDatabase() {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'app_global.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS license_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      mode TEXT DEFAULT 'demo',
      license_id TEXT,
      customer_name TEXT,
      organization TEXT,
      tier TEXT DEFAULT 'demo',
      activation_date DATETIME,
      last_verified_at DATETIME,
      offline_grace_days INTEGER DEFAULT 7,
      reverify_after_hours INTEGER DEFAULT 72,
      entitlement_token TEXT
    );

    CREATE TABLE IF NOT EXISTS demo_usage (
      key TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0
    );

    INSERT OR IGNORE INTO license_state (id) VALUES (1);
  `);

  // Ensure stable device UUID exists
  let uuidRow = db.prepare(`SELECT value FROM app_settings WHERE key = 'device_uuid'`).get();
  if (!uuidRow) {
    const newUuid = crypto.randomUUID();
    db.prepare(`INSERT INTO app_settings (key, value) VALUES ('device_uuid', ?)`).run(newUuid);
  }

  // Ensure default demo usage counters exist
  const counters = ['projects_created', 'saves_performed', 'graphs_exported', 'documents_exported'];
  const insertCounter = db.prepare(`INSERT OR IGNORE INTO demo_usage (key, count) VALUES (?, 0)`);
  counters.forEach(c => insertCounter.run(c));

  return db;
}

function getDb() {
  if (!db) {
    return initAppDatabase();
  }
  return db;
}

module.exports = {
  initAppDatabase,
  getDb
};
