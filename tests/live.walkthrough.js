// Drives Tracker through its local server in a real browser: first-time setup,
// sign-in, adding an employee, their one-time link, a video request, approval,
// admin preview, and restarts. Run with:  node tests/live.walkthrough.js
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("playwright");
const { createApp } = require("../server/server");

const shots = process.argv[2]; // optional folder for screenshots
const issues = [];
const check = (ok, msg) => { if (!ok) { issues.push(msg); console.log("ISSUE:", msg); } };

(async () => {
  const dbFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "tracker-test-")), "tracker.db");
  let app = createApp({ dbFile, tickMs: 40 });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  const port = app.server.address().port, U = "http://127.0.0.1:" + port;

  const browser = await chromium.launch();
  const errors = [];
  const newPage = async (ctx, w = 1440, h = 950) => {
    const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: h });
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
    return p;
  };
  const snap = (p, name) => shots && p.screenshot({ path: path.join(shots, name + ".png") });

  // ----- admin: first-time setup -----
  const adminCtx = await browser.newContext();
  const a = await newPage(adminCtx);
  await a.goto(U); await a.waitForSelector("#gate-form");
  check((await a.textContent(".gate-card h1")) === "Set up Tracker", "first visit should show setup");
  await snap(a, "live-1-setup");
  await a.fill("#g-agency", "Social Test Co"); await a.fill("#g-name", "Ada Admin"); await a.fill("#g-email", "ada@test.co"); await a.fill("#g-pass", "correct horse");
  await a.click("#gate-form button[type=submit]");
  await a.waitForSelector(".kpis");
  check(await a.isVisible("text=Agency overview"), "home should show after setup");
  check(await a.isVisible(".sample-pill"), "sample data must be labelled");
  check(!(await a.$("#viewer")), "the demo person-switcher must not exist on the server");
  await snap(a, "live-2-home");

  // ----- admin adds an employee -----
  await a.goto(U + "/#employees"); await a.waitForSelector('[data-action="add-employee"]');
  await a.click('[data-action="add-employee"]');
  await a.fill("#emp-name", "Sara Malik"); await a.fill("#emp-title", "Content editor"); await a.fill("#emp-email", "sara@test.co");
  await a.click("#emp-form button[type=submit]");
  await a.check('[name=brand][value="lumora-skin"]');
  for (const perm of ["results", "news", "create"]) await a.check(`[name=perm][value=${perm}]`);
  await a.click("#perm-form button[type=submit]");
  await a.waitForSelector("#link-out");
  const link = await a.inputValue("#link-out");
  check(/\/#link-[\w-]{20,}$/.test(link), "adding an employee should give a sign-in link");
  await snap(a, "live-3-link");
  await a.click("[data-close]");
  check(await a.isVisible("text=Hasn't signed in yet"), "new employee should show as not signed in yet");

  // ----- employee opens the link on their own computer -----
  const saraCtx = await browser.newContext();
  const s = await newPage(saraCtx);
  await s.goto(U); await s.waitForSelector("#gate-form");
  check((await s.textContent(".gate-card h1")) === "Sign in", "a visitor should see the sign-in screen");
  check(!(await s.content()).includes("Lumora"), "no brand data before sign-in");
  await s.fill("#g-email", "sara@test.co"); await s.fill("#g-pass", "guess guess"); await s.click("#gate-form button[type=submit]");
  await s.waitForSelector("#gate-error:not([hidden])");
  await s.goto(link); await s.waitForSelector("#g-pass");
  check((await s.textContent(".gate-card h1")).includes("Welcome, Sara"), "link should greet the employee");
  await s.fill("#g-pass", "sara password"); await s.click("#gate-form button[type=submit]");
  await s.waitForSelector(".kpis");
  check(!s.url().includes("link-"), "the link should be cleared from the address bar");
  check((await s.$$(".br")).length === 1, "Sara should see exactly one brand");
  check(!(await s.$('a[href="#employees"]')), "Sara must not see Employees");
  check(!(await s.isVisible("text=Ad spend")), "Sara must not see ad spend");
  await s.goto(U + "/#employees"); await s.waitForTimeout(300);
  check((await s.evaluate(() => location.hash)) !== "#employees", "Sara must be sent away from the admin page");
  await snap(s, "live-4-employee-home");

  // ----- employee requests a video; admin approves -----
  await s.goto(U + "/#brand-lumora-skin"); await s.waitForSelector('[data-action="post-more"]');
  await s.click('[data-action="post-more"]'); await s.click("#job-form button[type=submit]");
  await s.waitForSelector('[data-job-act="send"]', { timeout: 30000 });
  check(await s.isVisible("text=Simulation: Higgsfield"), "the run must be labelled as a simulation");
  check(!(await s.$('[data-job-act="approve"]')), "Sara can't approve");
  await snap(s, "live-5-pipeline");
  await s.click('[data-job-act="send"]'); await s.waitForSelector("text=Waiting for approval");
  await s.keyboard.press("Escape");

  await a.goto(U + "/#brand-lumora-skin"); await a.waitForSelector(".req");
  await a.click(".req"); await a.waitForSelector('[data-job-act="approve"]');
  await a.click('[data-job-act="approve"]'); await a.waitForSelector(".result .pill.good");
  await a.keyboard.press("Escape");

  // ----- admin previews Sara's view, read-only -----
  await a.click('[data-action="account"]'); await a.selectOption("#preview-pick", { index: 1 });
  await a.waitForSelector('[data-action="exit-preview"]');
  check((await a.$$(".br")).length === 1 && !(await a.$('a[href="#employees"]')), "preview should show exactly what Sara sees");
  await snap(a, "live-6-preview");
  await a.click('[data-action="exit-preview"]'); await a.waitForSelector('[data-action="add-employee"]');

  // ----- everything survives a restart -----
  await new Promise((r) => app.server.close(r));
  app = createApp({ dbFile, tickMs: 40 });
  await new Promise((r) => app.server.listen(port, "127.0.0.1", r));
  await a.goto(U + "/#employees"); await a.waitForSelector("table");
  check(await a.isVisible("text=Sara Malik"), "employees must survive a restart");
  check(await a.isVisible("tr:has-text('Sara Malik') .pill.good"), "Sara should now be Active");
  await s.goto(U + "/#brand-lumora-skin"); await s.reload(); await s.waitForSelector(".req");
  check(await s.isVisible(".req .pill.good"), "Sara's request should still be there, published, after a restart");

  // ----- admin tightens permissions, then removes Sara -----
  await a.click('[data-action="edit-perms"]'); await a.uncheck("[name=perm][value=results]"); await a.click("#perm-form button[type=submit]");
  await a.waitForSelector("#modal", { state: "hidden" });
  await s.goto(U + "/#home"); await s.reload(); await s.waitForSelector(".locked");
  check(!(await s.$(".kpis")), "results should be hidden after the permission was removed");
  await a.click('[data-action="remove-emp"]'); await a.click("#confirm-remove");
  await a.waitForSelector("tr:has-text('Sara Malik')", { state: "detached" });
  await s.reload(); await s.waitForSelector("#gate-form");
  check((await s.textContent(".gate-card h1")) === "Sign in", "a removed employee must be signed out");

  // ----- admin: add brand, clear sample data, sign out and back in -----
  await a.goto(U + "/#brands"); await a.click('[data-action="add-brand"]'); await a.fill("#b-name", "Solstice Sun Care"); await a.click("#brand-form button[type=submit]");
  await a.waitForSelector("h1:has-text('Solstice Sun Care')");
  await a.goto(U + "/#connections"); await a.click('[data-action="clear-sample"]'); await a.click("#confirm-clear");
  await a.waitForSelector(".brand-tile:has-text('Solstice Sun Care')");
  check((await a.$$("a.brand-tile")).length === 1, "only the real brand should remain after clearing sample data");
  check(!(await a.$(".sample-pill")), "sample label should be gone");
  for (const r of ["home", "news", "brands", "employees", "connections", "brand-solstice-sun-care"]) { await a.goto(U + "/#" + r); await a.waitForTimeout(200); check((await a.evaluate(() => document.querySelector("#work").innerText.trim().length)) > 20, `blank page with no data: ${r}`); }
  await a.click('[data-action="account"]'); await a.click("#sign-out"); await a.waitForSelector("#gate-form");
  await a.fill("#g-email", "ada@test.co"); await a.fill("#g-pass", "correct horse"); await a.click("#gate-form button[type=submit]");
  await a.waitForSelector('[data-action="account"]');

  // ----- phone width -----
  const ph = await newPage(adminCtx, 400, 860);
  for (const r of ["home", "brands", "employees", "connections"]) {
    await ph.goto(U + "/#" + r); await ph.waitForTimeout(250);
    const sw = await ph.evaluate(() => document.documentElement.scrollWidth);
    check(sw <= 400, `phone ${r}: page scrolls sideways (${sw})`);
  }

  check(errors.length === 0, "script errors: " + [...new Set(errors)].join(" | "));
  console.log(issues.length ? `\n${issues.length} issue(s) found` : "\nNo issues found");
  await browser.close();
  await new Promise((r) => app.server.close(r));
  process.exit(issues.length ? 1 : 0);
})().catch((e) => { console.error("TEST CRASHED:", e.message.split("\n")[0], (e.stack.match(/live\.walkthrough\.js:\d+/) || [""])[0]); process.exit(2); });
