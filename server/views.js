// Decides what each person is allowed to receive. The browser only ever gets
// data that has already been filtered here, so hiding something in the
// interface is never the only thing protecting it.
"use strict";

const PERMS = ["results", "spend", "news", "create", "approve", "assistant"];

const isAdmin = (u) => u.role === "admin";
const can = (u, perm) => isAdmin(u) || u.perms.includes(perm);
const brandOk = (u, brandId) => isAdmin(u) || u.brands === "all" || u.brands.includes(brandId);

function publicUser(u) {
  return { id: u.id, name: u.name, title: u.title, email: u.email, role: u.role, status: u.status, brands: u.brands, perms: u.perms };
}

function brandFor(u, b) {
  const results = can(u, "results"), spend = can(u, "spend");
  if (results && spend) return b;
  const out = JSON.parse(JSON.stringify(b));
  if (!spend || !results) {
    Object.assign(out.kpis, { spend: 0, spendPrev: 0, roas: 0, roasPrev: 0 });
    out.monthlyBudget = 0;
    out.series.forEach((d) => (d.spend = 0));
    out.ads.forEach((a) => Object.assign(a, { spend: 0, roas: 0, budget: 0 }));
  }
  if (!results) {
    Object.keys(out.kpis).forEach((k) => (out.kpis[k] = 0));
    out.series.forEach((d) => Object.assign(d, { gmv: 0, gmvLast: 0 }));
    out.products = [];
    out.statusNote = "";
    out.ads.forEach((a) => Object.assign(a, { impressions: 0, ctr: 0, cvr: 0, gmv: 0 }));
  }
  return out;
}

function newsFor(u, n) {
  if (can(u, "results") && can(u, "spend")) return n;
  const out = { ...n };
  out.metrics = can(u, "results") ? n.metrics.filter(([label]) => !/spend|roas/i.test(label)) : [];
  return out;
}

function jobsFor(db, u) {
  return db.all("SELECT data FROM jobs ORDER BY created_at DESC").map((r) => JSON.parse(r.data)).filter((j) => brandOk(u, j.brand));
}

// `viewer` is whose eyes we look through; `actor` is who is really signed in.
// They differ only when an admin previews what an employee sees.
function stateFor(db, viewer, actor, extras = {}) {
  const brands = db.all("SELECT data FROM brands ORDER BY position, rowid").map((r) => JSON.parse(r.data)).filter((b) => brandOk(viewer, b.id));
  const ids = new Set(brands.map((b) => b.id));
  const accounts = {};
  brands.forEach((b) => (accounts[b.id] = []));
  db.all("SELECT * FROM accounts ORDER BY id").forEach((a) => { if (ids.has(a.brand_id)) accounts[a.brand_id].push({ id: a.id, platform: a.platform, handle: a.handle, connected: !!a.connected }); });
  const news = can(viewer, "news")
    ? db.all("SELECT data FROM news ORDER BY time DESC").map((r) => JSON.parse(r.data)).filter((n) => ids.has(n.brand)).map((n) => newsFor(viewer, n))
    : [];
  const employees = isAdmin(viewer)
    ? db.all("SELECT * FROM users WHERE status != 'removed' ORDER BY created_at").map((r) => publicUser({ ...r, brands: JSON.parse(r.brands), perms: JSON.parse(r.perms) }))
    : [publicUser(viewer)];
  return {
    live: true,
    me: publicUser(viewer),
    preview: viewer.id !== actor.id ? { name: viewer.name } : null,
    // An admin can open the dashboard as any employee, read-only.
    previewable: isAdmin(actor) ? db.all("SELECT id, name, title FROM users WHERE role = 'employee' AND status != 'removed' ORDER BY created_at") : [],
    agency: db.setting("agency", "Your Agency"),
    product: "Tracker",
    sample: !!db.setting("sample", false),
    lastSync: db.setting("lastSync", null),
    credits: extras.credits || null, // the credit budget, for people who can request videos
    connections: db.setting("connections", { slack: false, euka: false, higgsfield: false, claude: false }),
    brands: brands.map((b) => brandFor(viewer, b)),
    accounts,
    news,
    employees,
    jobs: jobsFor(db, viewer),
  };
}

module.exports = { PERMS, isAdmin, can, brandOk, publicUser, stateFor, jobsFor };
