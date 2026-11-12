// Checks the credit budget and the Higgsfield connection.
// Run with:  node --test tests/credits.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const budget = require("../server/budget");
const { createMock } = require("./mock-higgsfield");

// ---------- the budget sums, with plain numbers ----------
test("the credit cycle runs from one renewal day to the next", () => {
  const c = budget.cycle(new Date(2026, 10, 12, 15), 5); // 12 Nov, credits renew on the 5th
  assert.equal(c.start.toDateString(), new Date(2026, 10, 5).toDateString());
  assert.equal(c.end.toDateString(), new Date(2026, 11, 5).toDateString());
  assert.equal(c.days, 30);
  assert.equal(c.weekStart.toDateString(), new Date(2026, 10, 12).toDateString(), "second week starts on the 12th");
  assert.equal(c.daysLeftAtWeekStart, 23);
  assert.equal(budget.cycle(new Date(2026, 10, 3), 5).start.toDateString(), new Date(2026, 9, 5).toDateString(), "before the 5th belongs to last month's cycle");
  assert.equal(budget.cycle(new Date(2027, 1, 28, 12), 31).start.toDateString(), new Date(2027, 1, 28).toDateString(), "a 31st renewal lands on the last day of short months");
});

test("each week gets its fair share of what is left, and a reserve is kept", () => {
  // The agency's real position on 12 Nov 2026: 373.3 credits left, 23 days to go.
  const p = budget.pace({ left: 373.3, reserve: 60, spentWeek: 0, daysLeftAtWeekStart: 23 });
  assert.equal(p.teamLeft, 313.3);
  assert.equal(p.weekAllowance, 95.3);
  assert.equal(p.weekLeft, 95.3);
  // After spending 75 this week the balance is 298.3; the week's allowance stays the same.
  assert.equal(budget.pace({ left: 298.3, reserve: 60, spentWeek: 75, daysLeftAtWeekStart: 23 }).weekLeft, 20.3);
  // Credits spent directly in Higgsfield shrink the allowance by themselves.
  assert.ok(budget.pace({ left: 200, reserve: 60, spentWeek: 0, daysLeftAtWeekStart: 23 }).weekAllowance < 45);
  // In the final days everything that is left (minus the reserve) is available.
  assert.equal(budget.pace({ left: 100, reserve: 60, spentWeek: 0, daysLeftAtWeekStart: 2 }).weekLeft, 40);
  assert.equal(budget.pace({ left: 50, reserve: 60, spentWeek: 0, daysLeftAtWeekStart: 9 }).weekLeft, 0, "only the reserve is left");
});

test("paced this way, a month of credits lasts the month", () => {
  // Spend the full allowance every week of a 30-day cycle and see what is left at the end.
  let left = 600; const reserve = 60;
  for (const daysLeftAtWeekStart of [30, 23, 16, 9]) {
    const { weekLeft } = budget.pace({ left, reserve, spentWeek: 0, daysLeftAtWeekStart });
    assert.ok(weekLeft >= 120 && weekLeft <= 130, `about a quarter each week, got ${weekLeft}`);
    left -= weekLeft;
  }
  assert.ok(left > 90 && left < 100, `the last two days still have credits, plus the 60 reserve; got ${left}`);
});

test("requests are checked against the cap, the week and the reserve", () => {
  const sum = { left: 373.3, teamLeft: 313.3, weekLeft: 95.3, requestCap: 75, weekResets: new Date(2026, 10, 19).toISOString() };
  assert.equal(budget.check(sum, { cost: 75 }).ok, true);
  assert.match(budget.check(sum, { cost: 112.5 }).reason, /75 credits at most/);
  assert.match(budget.check({ ...sum, weekLeft: 20.3 }, { cost: 37.5 }).reason, /20.3 credits are left in this week's allowance.*Thursday, Nov 19/);
  assert.match(budget.check({ ...sum, teamLeft: 10, weekLeft: 10 }, { cost: 15 }).reason, /admin's reserve/);
  assert.match(budget.check({ ...sum, left: 10 }, { cost: 15, isAdmin: true }).reason, /only 10 credits are left/);
  assert.equal(budget.check({ ...sum, weekLeft: 0, teamLeft: 0 }, { cost: 112.5, isAdmin: true }).ok, true, "an admin may use the reserve");
});

test("prices match what Higgsfield quoted", () => {
  assert.equal(budget.estimate(budget.tier("draft"), 15, 1), 15);
  assert.equal(budget.estimate(budget.tier("standard"), 15, 1), 37.5);
  assert.equal(budget.estimate(budget.tier("ad"), 15, 1), 75);
  assert.equal(budget.estimate(budget.tier("draft"), 10, 3), 30);
});

// ---------- the whole thing, against a stand-in Higgsfield ----------
let base, app, mock, saraId;
const jar = {};
async function call(who, method, path, body, extra = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (who && jar[who]) headers.Cookie = jar[who];
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual", ...extra });
  const set = res.headers.get("set-cookie");
  if (who && set) jar[who] = set.split(";")[0];
  let json = null;
  try { json = await res.clone().json(); } catch {}
  return { status: res.status, json, res };
}
const credits = async (who) => (await call(who, "GET", "/api/session")).json.state.credits;
async function finished(who, id) {
  for (let i = 0; i < 400; i++) {
    const job = (await call(who, "GET", "/api/jobs")).json.jobs.find((j) => j.id === id);
    if (job.status !== "running") return job;
    await new Promise((r) => setTimeout(r, 15));
  }
  throw new Error("job never finished");
}
const request = (who, extra = {}) => call(who, "POST", "/api/jobs", { brand: "lumora-skin", brief: "Morning routine with the serum", product: "Barrier Repair Serum 30ml", tier: "draft", seconds: 15, variations: 1, ...extra });

test.before(async () => {
  mock = createMock({ credits: 600, grantDay: new Date().getDate() }); // credits renewed today: a fresh cycle
  process.env.HIGGSFIELD_MCP_URL = (await mock.listen()) + "/mcp";
  const { createApp } = require("../server/server");
  app = createApp({ dbFile: ":memory:", tickMs: 5, pollMs: 10 });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
  await call("admin", "POST", "/api/setup", { agency: "Test Agency", name: "Ada Admin", email: "ada@test.co", password: "correct horse" });
  const made = await call("admin", "POST", "/api/employees", { name: "Sara M", email: "sara@test.co", brands: ["lumora-skin"], perms: ["results", "create"] });
  saraId = made.json.id;
  await call("sara", "POST", "/api/link/" + new URL(made.json.link).hash.replace("#link-", ""), { password: "sara password" });
});
test.after(async () => { await new Promise((r) => app.server.close(r)); await mock.close(); });

test("before Higgsfield is connected, requests are practice runs that spend nothing real", async () => {
  const c = await credits("sara");
  assert.equal(c.connected, false);
  assert.equal(c.monthly, 600);
  assert.deepEqual(c.tiers.map((t) => t.key), ["draft", "standard", "ad"]);
  const made = await request("sara");
  assert.equal(made.status, 200);
  assert.equal(made.json.cost, 15);
  const job = await finished("sara", made.json.id);
  assert.equal(job.simulated, true);
  assert.equal(job.status, "review");
  assert.equal(mock.state.calls.length, 0, "Higgsfield was never contacted");
  assert.equal((await credits("sara")).spentCycle, 15, "the practice budget still counts it");
});

test("people without the right don't receive the budget", async () => {
  await call("admin", "PATCH", "/api/employees/" + saraId, { brands: ["lumora-skin"], perms: ["results"] });
  assert.equal(await credits("sara"), null);
  assert.equal((await request("sara")).status, 403);
  await call("admin", "PATCH", "/api/employees/" + saraId, { brands: ["lumora-skin"], perms: ["results", "create"] });
});

test("only an admin, on the host computer, can connect Higgsfield", async () => {
  assert.equal((await call("sara", "POST", "/api/higgsfield/connect", {})).status, 403);
  // The same admin, but reaching Tracker from another computer on the office network.
  const away = await new Promise((resolve) => {
    const u = new URL(base);
    const req = http.request({ host: u.hostname, port: u.port, path: "/api/higgsfield/connect", method: "POST", headers: { "Content-Type": "application/json", Cookie: jar.admin, Host: "192.168.1.20:4400" } }, (res) => {
      let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => resolve({ status: res.statusCode, json: JSON.parse(b) }));
    });
    req.end("{}");
  });
  assert.equal(away.status, 400);
  assert.match(away.json.error, /computer that runs Tracker/);
});

test("the admin signs in on Higgsfield and Tracker reads the real balance", async () => {
  const start = await call("admin", "POST", "/api/higgsfield/connect", {});
  assert.equal(start.status, 200);
  const page = new URL(start.json.url);
  assert.equal(page.pathname, "/oauth2/authorize");
  assert.equal(page.searchParams.get("code_challenge_method"), "S256");
  assert.ok(!start.json.url.includes("password"));
  const signedIn = await fetch(start.json.url, { redirect: "manual" });           // Higgsfield's page…
  const backTo = new URL(signedIn.headers.get("location"));                       // …sends the browser back to Tracker
  assert.equal(backTo.pathname, "/oauth/higgsfield/callback");
  // Someone who isn't the signed-in admin can't finish the connection.
  assert.match((await call(null, "GET", backTo.pathname + backTo.search)).res.headers.get("location"), /hf=signin/);
  const done = await call("admin", "GET", backTo.pathname + backTo.search);
  assert.equal(done.status, 302);
  assert.match(done.res.headers.get("location"), /hf=ok/);

  const c = await credits("admin");
  assert.equal(c.connected, true);
  assert.equal(c.balance, 600);
  assert.equal(c.plan, "pro");
  assert.equal(c.renewDay, new Date().getDate(), "renewal day learned from the account's history");
  assert.equal(c.spentCycle, 0, "practice runs don't count against real credits");
  assert.equal(c.reserve, 60);
  assert.ok(c.weekLeft > 110 && c.weekLeft < 140, `first week's allowance, got ${c.weekLeft}`);
  const s = (await call("admin", "GET", "/api/session")).json.state;
  assert.equal(s.connections.higgsfield, true);
  assert.ok(!JSON.stringify(s).includes("at_") && !JSON.stringify(s).includes("rt_"), "the saved access never reaches a browser");
});

let firstJob;
test("a real request creates the video, saves it here and spends real credits", async () => {
  const made = await request("sara");
  assert.equal(made.json.cost, 15);
  const job = await finished("sara", made.json.id);
  firstJob = job;
  assert.equal(job.simulated, false);
  assert.equal(job.status, "review");
  assert.equal(job.video.files.length, 1);
  assert.match(job.outputs.video, /1 clip created in Higgsfield/);
  assert.match([...mock.state.jobs.values()][0].prompt, /Barrier Repair Serum 30ml by Lumora Skin.*Morning routine with the serum/);
  assert.equal(mock.state.credits, 585);
  const c = await credits("sara");
  assert.equal(c.balance, 585);
  assert.equal(c.spentWeek, 15);
  const video = await fetch(base + `/api/jobs/${job.id}/video/0`, { headers: { Cookie: jar.sara } });
  assert.equal(video.status, 200);
  assert.equal(video.headers.get("content-type"), "video/mp4");
  assert.match(await video.text(), /fake mp4 bytes/);
  assert.equal((await fetch(base + `/api/jobs/${job.id}/video/0`)).status, 401, "videos need a sign-in too");
});

test("the limit per request and the weekly allowance are enforced", async () => {
  const tooBig = await request("sara", { tier: "standard", variations: 3 });       // 112.5 credits
  assert.equal(tooBig.status, 402);
  assert.match(tooBig.json.error, /75 credits at most/);
  const ad = await request("sara", { tier: "ad" });                                 // 75 credits
  assert.equal(ad.status, 200);
  const c = await credits("sara");
  assert.equal(c.spentWeek, 90);
  assert.equal(c.left, 510, "credits promised to a video that hasn't started yet are already set aside");
  const overWeek = await request("sara", { tier: "ad" });
  assert.equal(overWeek.status, 402);
  assert.match(overWeek.json.error, /left in this week's allowance/);
  const small = await request("sara", { tier: "draft", seconds: 5 });
  assert.equal(small.status, 200, "a small draft still fits");
  assert.equal((await request("sara", { tier: "draft", seconds: 7 })).status, 400, "only offered lengths");
  await finished("sara", ad.json.id); await finished("sara", small.json.id);
  assert.equal(mock.state.credits, 505);
});

test("an admin can go past the weekly pace, but never past the real balance", async () => {
  const big = await request("admin", { tier: "standard", variations: 3 });         // 112.5, over cap and week
  assert.equal(big.status, 200);
  const job = await finished("admin", big.json.id);
  assert.equal(job.video.files.length, 3, "three variations, three clips");
  mock.state.credits = 20;
  const broke = await request("admin", { tier: "ad" });
  assert.equal(broke.status, 402);
  assert.match(broke.json.error, /only 20 credits are left/);
  const team = await request("sara", { tier: "draft" });
  assert.equal(team.status, 402);
  assert.match(team.json.error, /admin's reserve/);
  mock.state.credits = 500;
});

test("a new version costs credits again and is checked the same way", async () => {
  const before = mock.state.credits;
  const blocked = await call("sara", "POST", `/api/jobs/${firstJob.id}/action`, { action: "revise" });
  assert.equal(blocked.status, 402, "this week's allowance is used up, so Sara can't order a new version");
  assert.match(blocked.json.error, /this week's allowance/);
  const again = await call("admin", "POST", `/api/jobs/${firstJob.id}/action`, { action: "revise" });
  assert.equal(again.status, 200);
  const job = await finished("admin", firstJob.id);
  assert.equal(job.revision, 1);
  assert.equal(job.status, "review");
  assert.equal(mock.state.credits, before - 15);
});

test("if Higgsfield can't make the video, nothing is charged", async () => {
  const before = (await credits("admin")).spentCycle;
  mock.state.failNext = true;
  const made = await request("admin");
  const job = await finished("admin", made.json.id);
  assert.equal(job.status, "failed");
  assert.match(job.error, /couldn't make this video/);
  assert.equal((await credits("admin")).spentCycle, before, "the charge was released");
});

test("an unclear answer from Higgsfield is never reported as free", async () => {
  const before = (await credits("admin")).spentCycle;
  mock.state.garbleNext = true;
  const made = await request("admin", { seconds: 5 });
  const job = await finished("admin", made.json.id);
  assert.equal(job.status, "failed");
  assert.match(job.error, /couldn't confirm.*Check your Higgsfield account/);
  assert.ok(!job.log.some((l) => /No credits were used/.test(l.text)));
  assert.equal((await credits("admin")).spentCycle, before + 5, "the charge is kept, not released");
});

test("expired access is renewed quietly; revoked access asks the admin to reconnect", async () => {
  mock.expireAccess();
  const made = await request("admin");
  assert.equal(made.status, 200);
  assert.equal((await finished("admin", made.json.id)).status, "review");
  mock.revokeEverything();
  const refused = await request("admin");
  assert.equal(refused.status, 502);
  assert.match(refused.json.error, /connect it again/);
  const s = (await call("admin", "GET", "/api/session")).json.state;
  assert.equal(s.connections.higgsfield, false);
  assert.equal(s.credits.connected, false);
});

test("the admin can change the budget; nobody else can", async () => {
  assert.equal((await call("sara", "POST", "/api/budget", { monthly: 9999, reservePct: 0, requestCap: 9999, renewDay: 1 })).status, 403);
  assert.equal((await call("admin", "POST", "/api/budget", { monthly: 0, reservePct: 10, requestCap: 75, renewDay: 5 })).status, 400);
  assert.equal((await call("admin", "POST", "/api/budget", { monthly: 1200, reservePct: 20, requestCap: 150, renewDay: 5 })).status, 200);
  const c = await credits("admin");
  assert.equal(c.monthly, 1200); assert.equal(c.reserve, 240); assert.equal(c.requestCap, 150); assert.equal(c.renewDay, 5);
  assert.ok(Array.isArray(c.byBrand), "the admin sees spending by brand");
  assert.equal((await credits("sara")).byBrand, undefined);
});

test("nothing was written outside the test's own folders", () => {
  assert.ok(!fs.existsSync(require("node:path").join(__dirname, "..", "data", "videos", "VR-102-r0-0.mp4")));
});
