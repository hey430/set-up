// Passwords, sign-in sessions and one-time sign-in links.
"use strict";
const crypto = require("node:crypto");

const SESSION_DAYS = 14;
const LINK_DAYS = 7;
const COOKIE = "tracker_session";

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const newToken = () => crypto.randomBytes(32).toString("base64url");
const newId = (prefix) => prefix + "_" + crypto.randomBytes(6).toString("hex");

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
function checkPassword(password, stored) {
  if (!stored) return false;
  const [kind, saltHex, hashHex] = stored.split("$");
  if (kind !== "scrypt" || !saltHex || !hashHex) return false;
  const want = Buffer.from(hashHex, "hex");
  const got = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), want.length);
  return crypto.timingSafeEqual(want, got);
}
function passwordProblem(password) {
  if (typeof password !== "string" || password.length < 8) return "Use at least 8 characters for the password.";
  if (password.length > 200) return "That password is too long.";
  return null;
}

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

function startSession(db, res, userId) {
  const token = newToken();
  const expires = Date.now() + SESSION_DAYS * 864e5;
  db.run("INSERT INTO sessions (token_hash, user_id, expires) VALUES (?, ?, ?)", sha(token), userId, expires);
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}`);
}
function endSession(db, req, res) {
  const token = readCookie(req, COOKIE);
  if (token) db.run("DELETE FROM sessions WHERE token_hash = ?", sha(token));
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}
function currentUser(db, req) {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const s = db.get("SELECT user_id, expires FROM sessions WHERE token_hash = ?", sha(token));
  if (!s) return null;
  if (s.expires < Date.now()) { db.run("DELETE FROM sessions WHERE token_hash = ?", sha(token)); return null; }
  const u = db.get("SELECT * FROM users WHERE id = ? AND status = 'active'", s.user_id);
  return u ? parseUser(u) : null;
}

// One-time link an admin hands to an employee so they can choose a password.
function makeLink(db, userId) {
  const token = newToken();
  db.run("UPDATE users SET link_hash = ?, link_expires = ? WHERE id = ?", sha(token), Date.now() + LINK_DAYS * 864e5, userId);
  return token;
}
function userForLink(db, token) {
  if (typeof token !== "string" || token.length < 20) return null;
  const u = db.get("SELECT * FROM users WHERE link_hash = ? AND status != 'removed'", sha(token));
  if (!u || !u.link_expires || u.link_expires < Date.now()) return null;
  return parseUser(u);
}

function parseUser(row) {
  return { ...row, brands: JSON.parse(row.brands), perms: JSON.parse(row.perms) };
}

// Slow down password guessing: 5 wrong tries locks that email + address for a minute.
const attempts = new Map();
function loginBlocked(key) {
  const a = attempts.get(key);
  return a && a.until > Date.now();
}
function loginFailed(key) {
  const a = attempts.get(key) || { count: 0, until: 0 };
  a.count++;
  if (a.count >= 5) { a.until = Date.now() + 60_000; a.count = 0; }
  attempts.set(key, a);
}
const loginOk = (key) => attempts.delete(key);

module.exports = { sha, newToken, newId, hashPassword, checkPassword, passwordProblem, startSession, endSession, currentUser, makeLink, userForLink, parseUser, loginBlocked, loginFailed, loginOk };
