// Checks the Slack connection: who can connect it, what gets read, and who
// may see which channel's messages. Run with:  node --test tests/slack.test.js
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createMockSlack, fakeToken } = require("./mock-slack");

let base, app, mock, saraId;
const jar = {};
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
const slackOf = async (who) => (await call(who, "GET", "/api/session")).json.state.slack;

test.before(async () => {
  mock = createMockSlack();
  process.env.SLACK_API_URL = await mock.listen();
  const { createApp } = require("../server/server");
  app = createApp({ dbFile: ":memory:", slackEveryMs: 3_600_000 });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
  await call("admin", "POST", "/api/setup", { agency: "Test Agency", name: "Ada Admin", email: "ada@test.co", password: "correct horse" });
  const made = await call("admin", "POST", "/api/employees", { name: "Sara M", email: "sara@test.co", brands: ["lumora-skin"], perms: ["results", "news"] });
  saraId = made.json.id;
  await call("sara", "POST", "/api/link/" + new URL(made.json.link).hash.replace("#link-", ""), { password: "sara password" });
});
test.after(async () => { await new Promise((r) => app.server.close(r)); await mock.close(); });

test("before connecting, there is nothing from Slack", async () => {
  const s = await slackOf("admin");
  assert.equal(s.connected, false);
  assert.deepEqual(s.messages, []);
  assert.equal(mock.state.calls.length, 0);
});

test("only the admin, on the host computer, with a real bot token, can connect Slack", async () => {
  assert.equal((await call("sara", "POST", "/api/slack/connect", { token: mock.state.token })).status, 403);
  const away = await new Promise((resolve) => {
    const u = new URL(base);
    const req = http.request({ host: u.hostname, port: u.port, path: "/api/slack/connect", method: "POST", headers: { "Content-Type": "application/json", Cookie: jar.admin, Host: "192.168.1.20:4400" } }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => resolve({ status: res.statusCode, json: JSON.parse(b) })); });
    req.end(JSON.stringify({ token: mock.state.token }));
  });
  assert.equal(away.status, 400);
  assert.match(away.json.error, /computer that runs Tracker/);
  const user = await call("admin", "POST", "/api/slack/connect", { token: fakeToken("p", 1, 2, "abcdefgh") });
  assert.equal(user.status, 400);
  assert.match(user.json.error, /starts with xoxb-/);
  const wrong = await call("admin", "POST", "/api/slack/connect", { token: fakeToken("b", 9, 0, "zz") });
  assert.equal(wrong.status, 400);
  assert.match(wrong.json.error, /didn't accept that token/);
  assert.equal((await slackOf("admin")).connected, false);
});

test("connecting lists the workspace's channels and never shows the token again", async () => {
  assert.equal((await call("admin", "POST", "/api/slack/connect", { token: mock.state.token })).status, 200);
  const state = (await call("admin", "GET", "/api/session")).json.state;
  assert.equal(state.slack.connected, true);
  assert.equal(state.slack.team, "Test Agency");
  assert.equal(state.connections.slack, true);
  assert.deepEqual(state.slack.channels.map((c) => c.name).sort(), ["client-lumora", "client-pawsome", "random", "team-internal"], "all pages of channels are read");
  assert.equal(state.slack.channels.find((c) => c.name === "random").member, false);
  assert.ok(state.slack.channels.every((c) => !c.watched), "nothing is read until the admin chooses");
  assert.ok(!JSON.stringify(state).includes("xoxb-"), "the token never reaches a browser");
  assert.deepEqual(state.slack.messages, []);
});

test("the admin chooses channels; Tracker reads the last two weeks and tidies the text", async () => {
  const saved = await call("admin", "POST", "/api/slack/channels", { channels: [
    { id: "C1", watched: true, brand: "lumora-skin" }, { id: "C2", watched: true, brand: "pawsome-pantry" },
    { id: "C3", watched: true, brand: null }, { id: "C4", watched: true, brand: "not-a-brand" },
  ] });
  assert.equal(saved.status, 200);
  assert.equal(saved.json.added, 8);
  const s = await slackOf("admin");
  assert.equal(s.messages.length, 8);
  const first = s.messages.find((m) => m.text.startsWith("Serum Spark Ad"));
  assert.equal(first.text, "Serum Spark Ad passed 5x ROAS. Raising budget, @Marco Rossi can you brief two more hooks? See the video & the #client-pawsome notes");
  assert.equal(first.author, "Priya");
  assert.equal(first.channel, "#client-lumora");
  assert.equal(first.brand, "lumora-skin");
  assert.equal(s.messages.find((m) => m.text.startsWith("Approved the LIVE")).replies, 3);
  assert.match(s.messages.find((m) => m.text.startsWith("Approved the LIVE")).text, /@here$/);
  assert.ok(!s.messages.some((m) => /has joined/.test(m.text)), "join notices are left out");
  assert.ok(!s.messages.some((m) => /Too old/.test(m.text)), "first sync goes back two weeks only");
  assert.equal(s.messages.find((m) => m.author === "Euka alerts").text, "Sample request approved");
  assert.equal(s.messages.find((m) => /shared a file/.test(m.text)).text, "(shared a file: November brief)");
  const random = s.channels.find((c) => c.name === "random");
  assert.match(random.error, /\/invite @Tracker/, "a channel the app isn't in says how to fix it");
  assert.equal(random.brand, null, "an unknown brand falls back to admins only");
});

test("reading again adds only what is new", async () => {
  assert.equal((await call("admin", "POST", "/api/slack/sync", {})).json.added, 0);
  mock.state.messages.C1.push({ type: "message", user: "U3", ts: (Date.now() / 1000).toFixed(6), text: "Can we push the SPF more in November?" });
  assert.equal((await call("admin", "POST", "/api/slack/sync", {})).json.added, 1);
  assert.equal((await slackOf("admin")).messages[0].text, "Can we push the SPF more in November?");
  assert.equal((await slackOf("admin")).messages.length, 9);
});

test("an employee sees only channels mapped to their brands, and only with the News permission", async () => {
  const s = await slackOf("sara");
  assert.ok(s.messages.length > 0 && s.messages.every((m) => m.brand === "lumora-skin"));
  assert.ok(!JSON.stringify(s).includes("Margins"), "admin-only channels stay with the admin");
  assert.ok(!JSON.stringify(s).includes("creators onboarded"), "other brands' channels are hidden");
  assert.equal(s.channels, undefined, "the channel list is for the admin");
  assert.deepEqual(s.activity.channels.map((c) => c.name), ["#client-lumora"]);
  await call("admin", "PATCH", "/api/employees/" + saraId, { brands: ["lumora-skin"], perms: ["results"] });
  assert.equal(await slackOf("sara"), null, "without News there is no Slack at all");
  for (const path of ["/api/slack/sync", "/api/slack/channels", "/api/slack/disconnect"]) assert.equal((await call("sara", "POST", path, {})).status, 403);
  await call("admin", "PATCH", "/api/employees/" + saraId, { brands: ["lumora-skin"], perms: ["results", "news"] });
});

test("the activity summary counts this week against last week", async () => {
  const a = (await slackOf("admin")).activity;
  assert.equal(a.week, 8);       // everything from the last 7 days
  assert.equal(a.prevWeek, 1);   // the weekly report from 9 days ago
  assert.equal(a.people, 4);       // Priya, Marco, Hannah and the Euka alerts app
  assert.deepEqual(a.channels[0], { name: "#client-lumora", brand: "lumora-skin", count: 4 });
  assert.equal(a.top[0].name, "Priya");
});

test("Tracker waits and retries when Slack says slow down", async () => {
  mock.state.limitNext = 2;
  assert.equal((await call("admin", "POST", "/api/slack/sync", {})).status, 200);
});

test("unwatching a channel hides its messages; a revoked token asks the admin to reconnect", async () => {
  await call("admin", "POST", "/api/slack/channels", { channels: [{ id: "C3", watched: false, brand: null }] });
  assert.ok(!JSON.stringify(await slackOf("admin")).includes("Margins"));
  mock.state.revoked = true;
  const failed = await call("admin", "POST", "/api/slack/sync", {});
  assert.equal(failed.status, 400);
  assert.match(failed.json.error, /revoked/);
  const state = (await call("admin", "GET", "/api/session")).json.state;
  assert.equal(state.slack.connected, false);
  assert.equal(state.connections.slack, false);
  assert.ok(state.slack.messages.length > 0, "messages already collected stay");
});
