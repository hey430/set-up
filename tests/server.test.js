// Checks Tracker's server rules: sign-in, admin-only actions, and what each
// person is allowed to receive. Run with:  node --test tests/server.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../server/server");

let base, app;
const jar = {}; // one cookie per person

async function call(who, method, path, body) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (who && jar[who]) headers.Cookie = jar[who];
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const set = res.headers.get("set-cookie");
  if (who && set) jar[who] = set.split(";")[0];
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

test.before(async () => {
  app = createApp({ dbFile: ":memory:", tickMs: 5 });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
});
test.after(() => new Promise((r) => app.server.close(r)));

test("a new install asks for setup and serves no data", async () => {
  assert.deepEqual((await call(null, "GET", "/api/session")).json, { needsSetup: true });
  const data = await (await fetch(base + "/data.js")).text();
  assert.ok(!data.includes("Lumora"), "sample data file must not be served");
});

test("setup creates the admin, once", async () => {
  assert.equal((await call("admin", "POST", "/api/setup", { agency: "Test Agency", name: "Ada Admin", email: "ada@test.co", password: "short" })).status, 400);
  assert.equal((await call("admin", "POST", "/api/setup", { agency: "Test Agency", name: "Ada Admin", email: "ada@test.co", password: "correct horse" })).status, 200);
  assert.equal((await call(null, "POST", "/api/setup", { agency: "X", name: "Mallory", email: "m@test.co", password: "another pass" })).status, 409);
  const s = (await call("admin", "GET", "/api/session")).json.state;
  assert.equal(s.me.role, "admin");
  assert.equal(s.brands.length, 6);
  assert.equal(s.sample, true);
});

test("nobody gets data without signing in", async () => {
  const s = (await call(null, "GET", "/api/session")).json;
  assert.equal(s.user, null);
  assert.equal(s.state, undefined);
  assert.equal((await call(null, "GET", "/api/jobs")).status, 401);
  assert.equal((await call(null, "POST", "/api/brands", { name: "Sneaky" })).status, 401);
});

test("wrong passwords are refused, then slowed down", async () => {
  for (let i = 0; i < 5; i++) assert.equal((await call(null, "POST", "/api/login", { email: "ada@test.co", password: "nope" })).status, 401);
  assert.equal((await call(null, "POST", "/api/login", { email: "ada@test.co", password: "correct horse" })).status, 429);
});

let saraLink, saraId;
test("admin adds an employee only with permissions chosen", async () => {
  const none = await call("admin", "POST", "/api/employees", { name: "Sara M", email: "sara@test.co", brands: [], perms: [] });
  assert.equal(none.status, 400);
  const ok = await call("admin", "POST", "/api/employees", { name: "Sara M", title: "Editor", email: "sara@test.co", brands: ["lumora-skin", "not-a-brand"], perms: ["results", "news", "create", "admin"] });
  assert.equal(ok.status, 200);
  saraLink = new URL(ok.json.link).hash; saraId = ok.json.id;
  assert.equal((await call("admin", "POST", "/api/employees", { name: "Sara Two", email: "sara@test.co", brands: "all", perms: ["news"] })).status, 409);
  const sara = (await call("admin", "GET", "/api/session")).json.state.employees.find((e) => e.id === saraId);
  assert.deepEqual(sara.brands, ["lumora-skin"]);
  assert.deepEqual(sara.perms, ["results", "news", "create"]);
  assert.equal(sara.status, "invited");
});

test("the employee signs in with a one-time link", async () => {
  const token = saraLink.replace("#link-", "");
  assert.equal((await call(null, "GET", "/api/link/" + token)).json.email, "sara@test.co");
  assert.equal((await call("sara", "POST", "/api/link/" + token, { password: "sara password" })).status, 200);
  assert.equal((await call(null, "GET", "/api/link/" + token)).status, 404, "link works once");
});

test("the employee only receives what they were granted", async () => {
  const s = (await call("sara", "GET", "/api/session")).json.state;
  assert.deepEqual(s.brands.map((b) => b.id), ["lumora-skin"]);
  const b = s.brands[0];
  assert.ok(b.kpis.gmv > 0, "results are included");
  assert.equal(b.kpis.spend, 0); assert.equal(b.kpis.roas, 0); assert.equal(b.monthlyBudget, 0);
  assert.ok(b.series.every((d) => d.spend === 0));
  assert.ok(b.ads.every((a) => a.spend === 0 && a.roas === 0 && a.budget === 0));
  assert.ok(s.news.length > 0 && s.news.every((n) => n.brand === "lumora-skin"));
  assert.ok(s.news.every((n) => n.metrics.every(([l]) => !/spend|roas/i.test(l))));
  assert.deepEqual(s.employees.map((e) => e.id), [saraId], "employees can't list other people");
  assert.ok(!JSON.stringify(s).includes("password"));
});

test("the employee can't use admin actions or preview others", async () => {
  assert.equal((await call("sara", "POST", "/api/brands", { name: "Mine" })).status, 403);
  assert.equal((await call("sara", "POST", "/api/employees", { name: "Friend", email: "f@test.co", brands: "all", perms: ["news"] })).status, 403);
  assert.equal((await call("sara", "PATCH", "/api/employees/" + saraId, { brands: "all", perms: ["results", "spend", "approve"] })).status, 403);
  assert.equal((await call("sara", "POST", "/api/sample/clear", {})).status, 403);
  assert.equal((await call("sara", "GET", "/api/session?as=someone")).status, 403);
});

test("video requests follow brand access and publish rights", async () => {
  assert.equal((await call("sara", "POST", "/api/jobs", { brand: "ridgeline-active", brief: "x" })).status, 404, "no access to that brand");
  const accounts = (await call("sara", "GET", "/api/session")).json.state.accounts["lumora-skin"];
  const made = await call("sara", "POST", "/api/jobs", { brand: "lumora-skin", brief: "Morning routine", product: "Serum", tier: "draft", seconds: 15, variations: 2, accounts: [accounts[0].id] });
  assert.equal(made.status, 200);
  const id = made.json.id;
  assert.equal((await call("sara", "POST", `/api/jobs/${id}/action`, { action: "send" })).status, 409, "not ready yet");
  let job;
  for (let i = 0; i < 200; i++) { job = (await call("sara", "GET", "/api/jobs")).json.jobs.find((j) => j.id === id); if (job.status === "review") break; await new Promise((r) => setTimeout(r, 20)); }
  assert.equal(job.status, "review");
  assert.equal(job.simulated, true);
  assert.equal((await call("sara", "POST", `/api/jobs/${id}/action`, { action: "approve" })).status, 403, "Sara can't publish");
  assert.equal((await call("sara", "POST", `/api/jobs/${id}/action`, { action: "send" })).status, 200);
  assert.equal((await call("admin", "POST", `/api/jobs/${id}/action`, { action: "approve" })).status, 200);
  assert.equal((await call("admin", "GET", "/api/jobs")).json.jobs.find((j) => j.id === id).status, "posted");
});

test("admin can preview an employee, read-only", async () => {
  const s = (await call("admin", "GET", "/api/session?as=" + saraId)).json.state;
  assert.equal(s.me.id, saraId);
  assert.equal(s.preview.name, "Sara M");
  assert.deepEqual(s.brands.map((b) => b.id), ["lumora-skin"]);
  assert.equal((await call("admin", "POST", "/api/brands?as=" + saraId, { name: "While Previewing" })).status, 403);
});

test("changing permissions and removing an employee take effect at once", async () => {
  assert.equal((await call("admin", "PATCH", "/api/employees/" + saraId, { brands: ["lumora-skin"], perms: ["news"] })).status, 200);
  const s = (await call("sara", "GET", "/api/session")).json.state;
  assert.equal(s.brands[0].kpis.gmv, 0, "results are now withheld");
  assert.equal(s.brands[0].products.length, 0);
  assert.equal((await call("sara", "POST", "/api/jobs", { brand: "lumora-skin", brief: "x" })).status, 403);
  assert.equal((await call("admin", "DELETE", "/api/employees/" + saraId, {})).status, 200);
  assert.equal((await call("sara", "GET", "/api/session")).json.user, null, "signed out immediately");
  assert.equal((await call(null, "POST", "/api/login", { email: "sara@test.co", password: "sara password" })).status, 401);
});

test("brands: admin only, no duplicates; sample data can be cleared", async () => {
  assert.equal((await call("admin", "POST", "/api/brands", { name: "Lumora Skin" })).status, 409);
  assert.equal((await call("admin", "POST", "/api/brands", { name: "Solstice Sun Care", monthlyBudget: 5000 })).status, 200);
  assert.equal((await call("admin", "POST", "/api/sample/clear", {})).status, 200);
  const s = (await call("admin", "GET", "/api/session")).json.state;
  assert.deepEqual(s.brands.map((b) => b.id), ["solstice-sun-care"]);
  assert.equal(s.sample, false);
  assert.equal(s.news.length, 0);
});

test("requests from another site and path tricks are refused", async () => {
  const res = await fetch(base + "/api/logout", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://evil.example", Cookie: jar.admin }, body: "{}" });
  assert.equal(res.status, 403);
  assert.equal((await fetch(base + "/api/logout", { method: "POST", headers: { Cookie: jar.admin } })).status, 415);
  assert.equal((await fetch(base + "/..%2Fserver%2Fauth.js")).status, 404);
  assert.equal((await fetch(base + "/%2e%2e/package.json")).status, 404);
});
