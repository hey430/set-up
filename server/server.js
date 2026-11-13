#!/usr/bin/env node
// Tracker's local server. No installs needed beyond Node.js 22.13 or newer.
//
//   node server/server.js             only this computer can open Tracker
//   node server/server.js --office    other computers on the office network can too
//   node server/server.js --reset-admin   print a new sign-in link for the admin
"use strict";

// The built-in database module still prints an "experimental" notice; hide just that one.
const emitWarning = process.emitWarning;
process.emitWarning = (w, ...rest) => (String(w).includes("SQLite") ? undefined : emitWarning.call(process, w, ...rest));

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`Tracker needs Node.js 22.13 or newer. This computer has ${process.versions.node}. Download the current version from https://nodejs.org and try again.`);
  process.exit(1);
}

const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { open, seedSample, clearSample } = require("./db");
const auth = require("./auth");
const views = require("./views");
const pipeline = require("./pipeline");
const budget = require("./budget");
const higgsfield = require("./higgsfield");
const editorLib = require("./editor");

const ROOT = path.resolve(__dirname, "..");
const STATIC = path.join(ROOT, "dashboard");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".ico": "image/x-icon" };

const lanAddresses = () => Object.values(os.networkInterfaces()).flat().filter((n) => n && n.family === "IPv4" && !n.internal).map((n) => n.address);

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new HttpError(status, message); };

const text = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function createApp({ dbFile = path.join(ROOT, "data", "tracker.db"), dataFile = path.join(STATIC, "data.js"), tickMs = 650, pollMs = 8000, office = false } = {}) {
  const db = open(dbFile);
  const videoDir = dbFile === ":memory:" ? path.join(os.tmpdir(), "tracker-videos-" + process.pid) : path.join(path.dirname(dbFile), "videos");
  const dataDir = path.dirname(videoDir);
  const hf = higgsfield.create(db);
  const editor = editorLib.create({ musicDir: path.join(dataDir, "music"), fontDir: path.join(dataDir, "fonts") });
  const pipe = pipeline.create({ db, hf, budget, editor, videoDir, pollMs });
  // What the editing step can do on this computer, for people who can request videos.
  const editingFor = (viewer) => (views.isAdmin(viewer) || views.can(viewer, "create") ? { available: editor.known().ok, version: editor.known().version || "", music: editor.music() } : null);
  const ticker = pipe.start(tickMs);

  const hasAdmin = () => !!db.get("SELECT 1 AS x FROM users WHERE role = 'admin' AND status != 'removed'");
  const brandExists = (id) => !!db.get("SELECT 1 AS x FROM brands WHERE id = ?", id);

  function cleanAccess(body) {
    const brands = body.brands === "all" ? "all" : Array.isArray(body.brands) ? [...new Set(body.brands.filter((id) => typeof id === "string" && brandExists(id)))] : [];
    const perms = Array.isArray(body.perms) ? views.PERMS.filter((p) => body.perms.includes(p)) : [];
    return { brands, perms };
  }

  // ---------- API ----------
  const routes = [];
  const route = (method, pattern, handler, opts = {}) => routes.push({ method, pattern, handler, ...opts });

  // Who is asking, and (for admins previewing an employee) whose view to show.
  function context(req, url) {
    const actor = auth.currentUser(db, req);
    if (!actor) return { actor: null, viewer: null };
    let viewer = actor;
    const as = url.searchParams.get("as");
    if (as && as !== actor.id) {
      if (!views.isAdmin(actor)) fail(403, "Only an admin can preview another person's view.");
      const row = db.get("SELECT * FROM users WHERE id = ? AND status != 'removed'", as);
      if (!row) fail(404, "That person no longer exists.");
      viewer = auth.parseUser(row);
    }
    return { actor, viewer };
  }

  route("GET", /^\/api\/session$/, async ({ req, url }) => {
    if (!hasAdmin()) return { needsSetup: true };
    const { actor, viewer } = context(req, url);
    if (!actor) return { user: null, agency: db.setting("agency", "Your Agency") };
    await hf.refreshBalance(); // at most once a minute
    await editor.status();
    return { state: views.stateFor(db, viewer, actor, { credits: creditsFor(viewer), editing: editingFor(viewer) }) };
  }, { open: true });

  route("POST", /^\/api\/setup$/, ({ body, res }) => {
    if (hasAdmin()) fail(409, "Tracker is already set up. Sign in instead.");
    const name = text(body.name, 80), email = text(body.email, 120).toLowerCase(), agency = text(body.agency, 80);
    if (!name || !agency) fail(400, "Enter your name and your agency's name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail(400, "Enter a valid email address.");
    const problem = auth.passwordProblem(body.password);
    if (problem) fail(400, problem);
    const id = auth.newId("u");
    db.run("INSERT INTO users (id, name, title, email, role, status, brands, perms, password_hash, created_at) VALUES (?, ?, 'Owner', ?, 'admin', 'active', '\"all\"', '[]', ?, ?)", id, name, email, auth.hashPassword(body.password), Date.now());
    db.setSetting("agency", agency);
    if (body.sample !== false) seedSample(db, dataFile);
    auth.startSession(db, res, id);
    return { ok: true };
  }, { open: true });

  route("POST", /^\/api\/login$/, ({ body, req, res }) => {
    const email = text(body.email, 120).toLowerCase();
    const key = (req.socket.remoteAddress || "") + "|" + email;
    if (auth.loginBlocked(key)) fail(429, "Too many wrong tries. Wait a minute and try again.");
    const row = db.get("SELECT * FROM users WHERE email = ? AND status = 'active'", email);
    if (!row || !auth.checkPassword(String(body.password || ""), row.password_hash)) {
      auth.loginFailed(key);
      fail(401, "That email and password don't match.");
    }
    auth.loginOk(key);
    auth.startSession(db, res, row.id);
    return { ok: true };
  }, { open: true });

  route("POST", /^\/api\/logout$/, ({ req, res }) => { auth.endSession(db, req, res); return { ok: true }; }, { open: true });

  route("GET", /^\/api\/link\/([\w-]+)$/, ({ params }) => {
    const u = auth.userForLink(db, params[0]);
    if (!u) fail(404, "This sign-in link has expired or was already used. Ask your admin for a new one.");
    return { name: u.name, email: u.email, agency: db.setting("agency", "Your Agency") };
  }, { open: true });

  route("POST", /^\/api\/link\/([\w-]+)$/, ({ params, body, res }) => {
    const u = auth.userForLink(db, params[0]);
    if (!u) fail(404, "This sign-in link has expired or was already used. Ask your admin for a new one.");
    const problem = auth.passwordProblem(body.password);
    if (problem) fail(400, problem);
    db.tx(() => {
      db.run("UPDATE users SET password_hash = ?, status = 'active', link_hash = NULL, link_expires = NULL WHERE id = ?", auth.hashPassword(body.password), u.id);
      db.run("DELETE FROM sessions WHERE user_id = ?", u.id);
    });
    auth.startSession(db, res, u.id);
    return { ok: true };
  }, { open: true });

  route("POST", /^\/api\/password$/, ({ actor, body }) => {
    const row = db.get("SELECT password_hash FROM users WHERE id = ?", actor.id);
    if (!auth.checkPassword(String(body.current || ""), row.password_hash)) fail(400, "Your current password is not right.");
    const problem = auth.passwordProblem(body.next);
    if (problem) fail(400, problem);
    db.run("UPDATE users SET password_hash = ? WHERE id = ?", auth.hashPassword(body.next), actor.id);
    return { ok: true };
  });

  // ----- employees (admin) -----
  // Builds the sign-in link an admin sends to an employee. If the admin is using
  // Tracker on the server computer itself ("localhost"), swap in the office
  // network address so the link also works on the employee's computer.
  function linkFor(req, token) {
    let host = req.headers.host || "localhost";
    let reachable = true;
    if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) {
      const ip = office && lanAddresses()[0];
      if (ip) host = ip + (host.match(/:\d+$/) || [""])[0];
      else reachable = false; // only this computer can open it
    }
    return { link: `http://${host}/#link-${token}`, reachable };
  }

  route("POST", /^\/api\/employees$/, ({ body, req }) => {
    const name = text(body.name, 80), title = text(body.title, 80) || "Team member", email = text(body.email, 120).toLowerCase();
    if (!name) fail(400, "Enter the employee's name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail(400, "Enter a valid email address.");
    if (db.get("SELECT 1 AS x FROM users WHERE email = ? AND status != 'removed'", email)) fail(409, "Someone in Tracker already uses that email.");
    const { brands, perms } = cleanAccess(body);
    if ((brands !== "all" && !brands.length) || !perms.length) fail(400, "Pick at least one brand and one permission before adding the employee.");
    const id = auth.newId("u");
    db.run("INSERT INTO users (id, name, title, email, role, status, brands, perms, created_at) VALUES (?, ?, ?, ?, 'employee', 'invited', ?, ?, ?)", id, name, title, email, JSON.stringify(brands), JSON.stringify(perms), Date.now());
    return { id, ...linkFor(req, auth.makeLink(db, id)) };
  }, { admin: true });

  const employee = (id) => {
    const row = db.get("SELECT * FROM users WHERE id = ? AND status != 'removed'", id);
    if (!row) fail(404, "That person no longer exists.");
    if (row.role === "admin") fail(403, "The admin account can't be changed here.");
    return row;
  };

  route("PATCH", /^\/api\/employees\/([\w-]+)$/, ({ params, body }) => {
    const row = employee(params[0]);
    const { brands, perms } = cleanAccess(body);
    db.run("UPDATE users SET brands = ?, perms = ? WHERE id = ?", JSON.stringify(brands), JSON.stringify(perms), row.id);
    return { ok: true };
  }, { admin: true });

  route("DELETE", /^\/api\/employees\/([\w-]+)$/, ({ params }) => {
    const row = employee(params[0]);
    db.tx(() => {
      db.run("UPDATE users SET status = 'removed', link_hash = NULL, password_hash = NULL WHERE id = ?", row.id);
      db.run("DELETE FROM sessions WHERE user_id = ?", row.id);
    });
    return { ok: true };
  }, { admin: true });

  route("POST", /^\/api\/employees\/([\w-]+)\/link$/, ({ params, req }) => {
    const row = employee(params[0]);
    return { ...linkFor(req, auth.makeLink(db, row.id)), name: row.name };
  }, { admin: true });

  // ----- brands, accounts, sample data (admin) -----
  route("POST", /^\/api\/brands$/, ({ body }) => {
    const name = text(body.name, 80);
    if (!name) fail(400, "Enter the brand's name.");
    const id = slug(name) || auth.newId("b");
    const all = db.all("SELECT id, data FROM brands");
    if (all.some((r) => r.id === id || JSON.parse(r.data).name.toLowerCase() === name.toLowerCase())) fail(409, `${name} is already in Tracker.`);
    const zero = { gmv: 0, gmvPrev: 0, spend: 0, spendPrev: 0, roas: 0, roasPrev: 0, ctr: 0, ctrPrev: 0, creators: 0, creatorsPrev: 0, videos: 0, videosPrev: 0 };
    const brand = {
      id, name, category: text(body.category, 80) || "New brand", lead: text(body.lead, 80), status: "on-track", statusNote: "Waiting for first sync",
      monthlyBudget: Math.max(0, Number(body.monthlyBudget) || 0), goal: text(body.goal, 200) || "Not set yet", eukaBrand: text(body.eukaBrand, 120), slackChannel: text(body.slackChannel, 80),
      kpis: zero, series: [], products: [], ads: [], slack: [],
    };
    db.run("INSERT INTO brands (id, sample, position, data) VALUES (?, 0, ?, ?)", id, all.length, JSON.stringify(brand));
    return { id };
  }, { admin: true });

  route("POST", /^\/api\/accounts\/(\d+)\/toggle$/, ({ params }) => {
    const a = db.get("SELECT * FROM accounts WHERE id = ?", Number(params[0]));
    if (!a) fail(404, "That account no longer exists.");
    db.run("UPDATE accounts SET connected = ? WHERE id = ?", a.connected ? 0 : 1, a.id);
    return { platform: a.platform, handle: a.handle, connected: !a.connected };
  }, { admin: true });

  route("POST", /^\/api\/sample\/clear$/, () => { clearSample(db); return { ok: true }; }, { admin: true });

  // ----- credits, budget and Higgsfield -----
  // Anything that talks to Higgsfield can fail for reasons outside Tracker; say why.
  const upstream = async (fn) => { try { return await fn(); } catch (e) { if (e instanceof HttpError) throw e; fail(502, e.message || "Higgsfield didn't answer."); } };

  function budgetNow() {
    const connected = hf.connected();
    const bal = connected ? db.setting("higgsfield_balance", null) : null;
    return { connected, plan: bal ? bal.plan : "", sum: budget.summary(db, { connected, balance: bal ? bal.credits : null }) };
  }
  function creditsFor(viewer) {
    if (!views.isAdmin(viewer) && !views.can(viewer, "create")) return null;
    const { connected, plan, sum } = budgetNow();
    const out = { ...sum, plan, tiers: budget.TIERS.map(({ key, label, perSec, lengths, note }) => ({ key, label, perSec, lengths, note })) };
    if (views.isAdmin(viewer)) {
      const names = Object.fromEntries(db.all("SELECT id, data FROM brands").map((r) => [r.id, JSON.parse(r.data).name]));
      out.byBrand = budget.byBrand(db, { connected }).map((r) => ({ ...r, name: names[r.brand] || "Removed brand" }));
    }
    return out;
  }

  route("POST", /^\/api\/budget$/, ({ body }) => {
    const n = (v, lo, hi, what) => { const x = Number(v); if (!Number.isFinite(x) || x < lo || x > hi) fail(400, `${what} must be between ${lo} and ${hi}.`); return x; };
    db.setSetting("budget", {
      monthly: Math.round(n(body.monthly, 1, 1_000_000, "Monthly credits")),
      reservePct: Math.round(n(body.reservePct, 0, 50, "The admin reserve")),
      requestCap: n(body.requestCap, 1, 1_000_000, "The limit per request"),
      renewDay: Math.round(n(body.renewDay, 1, 31, "The renewal day")),
      setByAdmin: true,
    });
    return { ok: true };
  }, { admin: true });

  route("POST", /^\/api\/higgsfield\/connect$/, ({ req }) => {
    const host = req.headers.host || "";
    // Higgsfield only sends the sign-in back to "localhost", which means the computer running Tracker.
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) fail(400, "Do this on the computer that runs Tracker: open Tracker there at http://localhost and press Connect Higgsfield.");
    return upstream(async () => ({ url: await hf.startConnect(`http://${host}/oauth/higgsfield/callback`) }));
  }, { admin: true });

  route("POST", /^\/api\/higgsfield\/disconnect$/, () => { hf.disconnect(); return { ok: true }; }, { admin: true });

  // ----- video requests -----
  route("GET", /^\/api\/jobs$/, ({ viewer }) => ({ jobs: views.jobsFor(db, viewer), credits: creditsFor(viewer) }), { preview: true });

  // Works out the price and checks it against the budget. Throws with a plain reason if it doesn't fit.
  async function priceAndCheck(actor, t, seconds, variations) {
    const real = hf.connected();
    let cost = budget.estimate(t, seconds, variations);
    if (real) {
      const one = await upstream(() => hf.quote({ model: t.model, prompt: "price check", aspect_ratio: "9:16", duration: seconds, ...t.params }));
      cost = Math.round(one * variations * 10) / 10;
      await hf.refreshBalance(true);
    }
    const verdict = budget.check(budgetNow().sum, { cost, isAdmin: views.isAdmin(actor) });
    if (!verdict.ok) fail(402, verdict.reason);
    return { cost, real };
  }
  const addCharge = (job, actor, cost, real) =>
    Number(db.run("INSERT INTO charges (job_id, brand_id, user_id, user_name, tier, credits, status, simulated, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", job.id, job.brand, actor.id, actor.name, job.tier, cost, real ? "reserved" : "spent", real ? 0 : 1, Date.now()).lastInsertRowid);

  route("POST", /^\/api\/jobs$/, async ({ actor, body }) => {
    const brandId = text(body.brand, 120);
    const row = db.get("SELECT data FROM brands WHERE id = ?", brandId);
    if (!row || !views.brandOk(actor, brandId)) fail(404, "That brand isn't available to you.");
    if (!views.can(actor, "create")) fail(403, "You don't have permission to request videos.");
    const brief = text(body.brief, 2000);
    if (!brief) fail(400, "Describe the video you want.");
    const t = budget.tier(body.tier);
    if (!t) fail(400, "Choose a quality for the video.");
    const seconds = Number(body.seconds);
    if (!t.lengths.includes(seconds)) fail(400, `${t.label} videos can be ${t.lengths.join(", ")} seconds long.`);
    const variations = Math.min(3, Math.max(1, Math.round(Number(body.variations) || 1)));
    const { cost, real } = await priceAndCheck(actor, t, seconds, variations);
    const e = body.edit && typeof body.edit === "object" ? body.edit : {};
    const edit = { caption: text(e.caption, 90), endCard: !!e.endCard, cta: text(e.cta, 30) || "Shop now", music: editor.music().includes(e.music) ? e.music : "" };

    const brand = JSON.parse(row.data);
    const wanted = Array.isArray(body.accounts) ? body.accounts.map(Number) : [];
    const accounts = db.all("SELECT * FROM accounts WHERE brand_id = ? AND connected = 1", brandId).filter((a) => wanted.includes(a.id)).map((a) => ({ platform: a.platform, handle: a.handle }));
    let hue = 0; for (const c of brand.name) hue = (hue * 31 + c.charCodeAt(0)) % 360;
    const n = db.get("SELECT COUNT(*) AS n FROM jobs").n;
    const job = pipe.newJob({
      id: "VR-" + (101 + n), brand: brandId, brandName: brand.name, by: actor.name, product: text(body.product, 120) || "Main product", style: text(body.style, 60) || "UGC talking to camera",
      brief, tier: t.key, tierLabel: t.label, seconds, variations, accounts, cost, simulated: !real, hue: (hue % 80) + 240,
      edit,
    });
    job.chargeId = addCharge(job, actor, cost, real);
    db.run("INSERT INTO jobs (id, brand_id, status, created_at, data) VALUES (?, ?, ?, ?, ?)", job.id, brandId, job.status, Date.now(), JSON.stringify(job));
    return { id: job.id, cost };
  });

  route("POST", /^\/api\/jobs\/([\w-]+)\/action$/, async ({ actor, params, body }) => {
    const row = db.get("SELECT data FROM jobs WHERE id = ?", params[0]);
    const job = row && JSON.parse(row.data);
    if (!job || !views.brandOk(actor, job.brand)) fail(404, "That video request isn't available to you.");
    const action = body.action;
    if (action === "approve") {
      if (!views.can(actor, "approve")) fail(403, "You don't have permission to approve and publish.");
      if (!["review", "approval"].includes(job.status)) fail(409, "This request isn't ready to publish.");
      if (!job.accounts.length) fail(400, "No posting account was selected for this request.");
    } else if (action === "send" || action === "revise") {
      if (!views.can(actor, "create") && !views.can(actor, "approve")) fail(403, "You don't have permission to change video requests.");
      const ready = action === "revise" ? ["review", "approval", "failed"] : ["review", "approval"];
      if (!ready.includes(job.status)) fail(409, "This request is still being worked on.");
      if (action === "revise" && !job.simulated) {
        // A new version makes new clips, so it is paid for and checked like a new request.
        if (!hf.connected()) fail(409, "Higgsfield isn't connected, so a new version can't be made.");
        const { cost } = await priceAndCheck(actor, budget.tier(job.tier), job.seconds, job.variations);
        job.cost = cost;
        job.chargeId = addCharge(job, actor, cost, true);
      }
    } else fail(400, "Unknown action.");
    pipe.act(job, action, actor);
    db.run("UPDATE jobs SET status = ?, data = ? WHERE id = ?", job.status, JSON.stringify(job), job.id);
    return { ok: true };
  });

  // Plays or downloads a finished clip. Same brand rules as everything else.
  route("GET", /^\/api\/jobs\/([\w-]+)\/video\/(\d)$/, ({ viewer, params, url }) => {
    const row = db.get("SELECT data FROM jobs WHERE id = ?", params[0]);
    const job = row && JSON.parse(row.data);
    if (!job || !views.brandOk(viewer, job.brand) || !job.video) fail(404, "That video isn't available.");
    // The edited version is shown unless the original is asked for with ?raw=1.
    const n = Number(params[1]), edited = !url.searchParams.get("raw") && job.video.edited && job.video.edited[n];
    const name = edited || job.video.files[n], file = name && path.join(videoDir, path.basename(name));
    if (file && fs.existsSync(file)) return { __file: file, type: "video/mp4", name: `${job.id}-${n + 1}.mp4` };
    if (job.video.urls[n]) return { __redirect: job.video.urls[n] };
    fail(404, "That video isn't available.");
  }, { preview: true });

  // ---------- request handling ----------
  function readBody(req) {
    return new Promise((resolve, reject) => {
      let size = 0; const chunks = [];
      req.on("data", (c) => { size += c.length; if (size > 100_000) { reject(new HttpError(413, "That request is too large.")); req.destroy(); } else chunks.push(c); });
      req.on("end", () => {
        if (!chunks.length) return resolve({});
        try { const v = JSON.parse(Buffer.concat(chunks).toString("utf8")); resolve(v && typeof v === "object" ? v : {}); } catch { reject(new HttpError(400, "That request couldn't be read.")); }
      });
      req.on("error", reject);
    });
  }
  function send(res, status, payload) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify(payload));
  }

  async function api(req, res, url) {
    const match = routes.map((r) => ({ r, m: r.method === req.method && url.pathname.match(r.pattern) })).find((x) => x.m);
    if (!match) fail(404, "Not found.");
    const { r, m } = match;
    let body = {};
    if (req.method !== "GET") {
      // Changes must come from Tracker's own pages, as JSON.
      if (!String(req.headers["content-type"] || "").startsWith("application/json")) fail(415, "Send JSON.");
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) fail(403, "That request came from another site.");
      body = await readBody(req);
    }
    const { actor, viewer } = context(req, url);
    if (!r.open) {
      if (!actor) fail(401, "Sign in to continue.");
      if (r.admin && !views.isAdmin(actor)) fail(403, "Only an admin can do that.");
      if (viewer.id !== actor.id && !r.preview) fail(403, "Preview is read-only.");
    }
    const out = await r.handler({ req, res, url, body, actor, viewer, params: m.slice(1) });
    if (out && out.__redirect) { res.writeHead(302, { Location: out.__redirect, "Cache-Control": "no-store" }); return res.end(); }
    if (out && out.__file) {
      res.writeHead(200, { "Content-Type": out.type, "Content-Length": fs.statSync(out.__file).size, "Content-Disposition": `inline; filename="${out.name}"`, "Cache-Control": "private, max-age=3600" });
      return fs.createReadStream(out.__file).pipe(res);
    }
    send(res, 200, out || { ok: true });
  }

  function staticFile(req, res, url) {
    if (req.method !== "GET" && req.method !== "HEAD") fail(405, "Not allowed.");
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/") rel = "/index.html";
    // The sample data file is never sent by the server; real data comes from the API after sign-in.
    if (rel === "/data.js") { res.writeHead(200, { "Content-Type": TYPES[".js"], "Cache-Control": "no-store" }); return res.end("window.TRACKER_LIVE = true;\n"); }
    const file = path.resolve(STATIC, "." + rel);
    const type = TYPES[path.extname(file)];
    if (!file.startsWith(STATIC + path.sep) || !type || !fs.existsSync(file) || !fs.statSync(file).isFile()) fail(404, "Not found.");
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  }

  // Higgsfield sends the admin's browser back here after they sign in on Higgsfield's page.
  async function higgsfieldCallback(req, res, url) {
    const back = (result) => { res.writeHead(302, { Location: `/?hf=${result}#connections`, "Cache-Control": "no-store" }); res.end(); };
    const actor = auth.currentUser(db, req);
    if (!actor || !views.isAdmin(actor)) return back("signin");
    if (url.searchParams.get("error") || !url.searchParams.get("code")) return back("cancelled");
    try { await hf.finishConnect({ code: url.searchParams.get("code"), state: url.searchParams.get("state") }); back("ok"); }
    catch (e) { console.error("Higgsfield sign-in failed:", e.message); back("failed"); }
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname.startsWith("/api/")) await api(req, res, url);
      else if (url.pathname === "/oauth/higgsfield/callback") await higgsfieldCallback(req, res, url);
      else staticFile(req, res, url);
    } catch (e) {
      if (!(e instanceof HttpError)) console.error(e);
      if (!res.headersSent) send(res, e instanceof HttpError ? e.status : 500, { error: e instanceof HttpError ? e.message : "Something went wrong on the server." });
      else res.end();
    }
  });
  server.on("close", () => { clearInterval(ticker); try { db.close(); } catch {} });
  return { server, db, hf, pipe };
}

// ---------- command line ----------
if (require.main === module) {
  const office = process.argv.includes("--office");
  const port = Number(process.env.PORT) || 4400;
  const host = process.env.HOST || (office ? "0.0.0.0" : "127.0.0.1");
  const { server, db } = createApp({ dbFile: process.env.TRACKER_DB || undefined, office: host === "0.0.0.0" });

  if (process.argv.includes("--reset-admin")) {
    const admin = db.get("SELECT id, name FROM users WHERE role = 'admin' AND status != 'removed'");
    if (!admin) { console.log("Tracker has no admin yet. Start the server and open it to set one up."); process.exit(0); }
    console.log(`\nNew sign-in link for ${admin.name} (works once, for 7 days):\n  http://localhost:${port}/#link-${auth.makeLink(db, admin.id)}\n\nStart Tracker, then open that link to choose a new password.\n`);
    process.exit(0);
  }

  server.listen(port, host, () => {
    console.log(`\nTracker is running.\n  On this computer:      http://localhost:${port}`);
    if (host === "0.0.0.0") {
      lanAddresses().forEach((ip) => console.log(`  On the office network: http://${ip}:${port}`));
    } else console.log("  Other computers can't reach it. Start with --office to share it on your network.");
    console.log("\nPress Ctrl+C to stop.\n");
  });
}

module.exports = { createApp };
