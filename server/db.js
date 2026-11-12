// Tracker's local database. One SQLite file on the agency's own computer.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { DatabaseSync } = require("node:sqlite");

function open(file) {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',      -- admin | employee
      status TEXT NOT NULL DEFAULT 'invited',     -- invited | active | removed
      brands TEXT NOT NULL DEFAULT '[]',          -- JSON: "all" or a list of brand ids
      perms TEXT NOT NULL DEFAULT '[]',           -- JSON list of permission keys
      password_hash TEXT,
      link_hash TEXT,                             -- sha256 of the one-time sign-in link token
      link_expires INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, sample INTEGER NOT NULL DEFAULT 0, position INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      platform TEXT NOT NULL, handle TEXT NOT NULL, connected INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS news (id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE, time TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS charges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL, brand_id TEXT NOT NULL, user_id TEXT NOT NULL, user_name TEXT NOT NULL, tier TEXT NOT NULL,
      credits REAL NOT NULL,
      status TEXT NOT NULL,                 -- reserved | spent | released
      simulated INTEGER NOT NULL DEFAULT 0, -- 1 = practice run made while Higgsfield wasn't connected
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE, status TEXT NOT NULL, created_at INTEGER NOT NULL, data TEXT NOT NULL);
  `);

  const api = {
    raw: db,
    get: (sql, ...a) => db.prepare(sql).get(...a),
    all: (sql, ...a) => db.prepare(sql).all(...a),
    run: (sql, ...a) => db.prepare(sql).run(...a),
    setting(key, fallback = null) {
      const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
      return row ? JSON.parse(row.value) : fallback;
    },
    setSetting(key, value) {
      db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, JSON.stringify(value));
    },
    tx(fn) {
      db.exec("BEGIN");
      try { const out = fn(); db.exec("COMMIT"); return out; } catch (e) { db.exec("ROLLBACK"); throw e; }
    },
    close: () => db.close(),
  };
  return api;
}

// Loads the made-up brands, videos and news from dashboard/data.js so a new
// install isn't empty. Everything it adds is flagged as sample and can be
// removed in one click from Connections.
function seedSample(db, dataFile) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(dataFile, "utf8"), sandbox, { timeout: 2000 });
  const data = sandbox.window.DASHBOARD_DATA;
  db.tx(() => {
    data.brands.forEach((b, i) => {
      db.run("INSERT OR REPLACE INTO brands (id, sample, position, data) VALUES (?, 1, ?, ?)", b.id, i, JSON.stringify(b));
      (data.accounts[b.id] || []).forEach((a) => db.run("INSERT INTO accounts (brand_id, platform, handle, connected) VALUES (?, ?, ?, ?)", b.id, a.platform, a.handle, a.connected ? 1 : 0));
    });
    data.news.forEach((n) => db.run("INSERT OR REPLACE INTO news (id, brand_id, time, data) VALUES (?, ?, ?, ?)", n.id, n.brand, n.time, JSON.stringify(n)));
    db.setSetting("sample", true);
    db.setSetting("lastSync", data.lastSync);
  });
}

function clearSample(db) {
  db.tx(() => {
    db.run("DELETE FROM brands WHERE sample = 1"); // accounts, news and jobs go with them
    db.setSetting("sample", false);
    db.setSetting("lastSync", null);
  });
}

module.exports = { open, seedSample, clearSample };
