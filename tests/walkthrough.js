// Full walkthrough of Tracker as the admin and as every employee.
const { chromium } = require("playwright");
const U = "file://" + require("path").resolve(__dirname, "../dashboard/index.html");
const issues = [];
const note = (m) => { issues.push(m); console.log("ISSUE:", m); };

(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1440, 950], [400, 860]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));
    p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    await p.goto(U + "#home"); await p.waitForTimeout(500);
    const users = await p.$$eval("#viewer option", (o) => o.map((x) => [x.value, x.textContent]));
    for (const [uid, label] of users) {
      await p.selectOption("#viewer", uid); await p.waitForTimeout(150);
      const brands = await p.evaluate(() => window.DASHBOARD_DATA.brands.map((x) => x.id));
      for (const r of ["home", "news", "brands", "employees", "connections", ...brands.map((x) => "brand-" + x)]) {
        await p.goto(U + "#" + r); await p.waitForTimeout(120);
        const got = await p.evaluate(() => location.hash.slice(1));
        const sw = await p.evaluate(() => document.documentElement.scrollWidth);
        if (sw > w) note(`${w}px ${label} ${r}: page scrolls sideways (${sw})`);
        const empty = await p.evaluate(() => document.querySelector("#work").innerText.trim().length < 20);
        if (empty) note(`${w}px ${label} ${r}: blank page`);
        if (uid !== "admin" && ["employees", "connections"].includes(r) && got === r) note(`${label} reached admin page ${r}`);
        if (uid !== "admin" && (await p.$('[data-action="add-brand"]'))) note(`${label} sees Add brand on ${r}`);
      }
    }
    if (errs.length) note(`${w}px script errors: ${[...new Set(errs)].join(" | ")}`);
    await p.close();
  }

  // ---- behaviour checks on desktop ----
  const p = await b.newPage({ viewport: { width: 1440, height: 950 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(U + "#news"); await p.waitForTimeout(300);

  // News brand filter must not stick when switching to someone without that brand
  await p.selectOption("#news-brand", "lumora-skin");
  await p.selectOption("#viewer", "marco"); await p.waitForTimeout(200);
  await p.goto(U + "#news"); await p.waitForTimeout(200);
  if ((await p.$$(".post")).length === 0) note("News is empty for Marco after admin filtered by a brand he can't see");

  // Employee without publish rights sends for approval; admin then approves
  await p.selectOption("#viewer", "sara"); await p.waitForTimeout(150);
  await p.goto(U + "#brand-lumora-skin"); await p.waitForTimeout(200);
  if (await p.$(".kpis .kpi-label >> text=Ad spend")) note("Sara (no spend permission) sees Ad spend");
  await p.click('[data-action="post-more"]'); await p.waitForTimeout(150);
  await p.uncheck('[name=acct] >> nth=0');
  await p.click("#job-form button[type=submit]");
  await p.waitForSelector('[data-job-act="send"]', { timeout: 40000 });
  if (await p.$('[data-job-act="approve"]')) note("Sara can approve without the permission");
  await p.click('[data-job-act="send"]'); await p.waitForTimeout(150);
  await p.keyboard.press("Escape");
  await p.selectOption("#viewer", "admin"); await p.waitForTimeout(150);
  await p.goto(U + "#brand-lumora-skin"); await p.waitForTimeout(200);
  await p.click(".req"); await p.waitForTimeout(200);
  const ap = await p.$('[data-job-act="approve"]');
  if (ap && !(await ap.isDisabled())) note("Admin can publish a request that has no posting account selected");
  await p.keyboard.press("Escape");

  // Request changes re-runs and finishes
  await p.click('[data-action="post-more"]'); await p.waitForTimeout(150);
  await p.click("#job-form button[type=submit]");
  await p.waitForSelector('[data-job-act="revise"]', { timeout: 40000 });
  await p.click('[data-job-act="revise"]');
  await p.waitForSelector('[data-job-act="approve"]', { timeout: 40000 });
  await p.click('[data-job-act="approve"]'); await p.waitForTimeout(200);
  if (!(await p.$(".result .pill.good"))) note("Publishing did not mark the request as published");
  await p.keyboard.press("Escape");

  // Duplicate brand and duplicate employee
  await p.goto(U + "#brands"); await p.waitForTimeout(150);
  await p.click('[data-action="add-brand"]'); await p.fill("#b-name", "Lumora Skin");
  await p.click("#brand-form button[type=submit]"); await p.waitForTimeout(250);
  const dup = await p.evaluate(() => window.DASHBOARD_DATA.brands.filter((x) => x.id === "lumora-skin").length);
  if (dup > 1) note("Adding a brand with an existing name creates a duplicate");
  await p.keyboard.press("Escape");
  await p.goto(U + "#employees"); await p.waitForTimeout(150);
  await p.click('[data-action="add-employee"]');
  await p.fill("#emp-name", "Priya Again"); await p.fill("#emp-email", "priya@youragency.com");
  await p.click("#emp-form button[type=submit]"); await p.waitForTimeout(200);
  if (await p.$("#perm-form")) note("Adding an employee with an email already in use is allowed");
  await p.keyboard.press("Escape");

  // New employee: add, then check they can be previewed
  await p.click('[data-action="add-employee"]');
  await p.fill("#emp-name", "Alex Morgan"); await p.fill("#emp-email", "alex@youragency.com");
  await p.click("#emp-form button[type=submit]"); await p.waitForTimeout(150);
  await p.check('[name=brand][value="tidewell-hydration"]'); await p.check('[name=perm][value=news]');
  await p.click("#perm-form button[type=submit]"); await p.waitForTimeout(200);
  const opts = await p.$$eval("#viewer option", (o) => o.map((x) => x.textContent).join(","));
  if (!/Alex/.test(opts)) note("A newly added employee can't be previewed in 'Viewing as'");

  // New brand with no data yet: every page still works
  await p.goto(U + "#brands"); await p.click('[data-action="add-brand"]'); await p.fill("#b-name", "Solstice Sun Care");
  await p.click("#brand-form button[type=submit]"); await p.waitForTimeout(300);
  for (const r of ["home", "news", "brands", "brand-solstice-sun-care", "employees", "connections"]) { await p.goto(U + "#" + r); await p.waitForTimeout(150); }
  await p.goto(U + "#brand-solstice-sun-care"); await p.click('[data-action="post-more"]'); await p.waitForTimeout(150);
  await p.keyboard.press("Escape");

  // Remove an employee
  await p.goto(U + "#employees"); await p.waitForTimeout(150);
  await p.click('[data-action="remove-emp"][data-emp="dana"]'); await p.click("#confirm-remove"); await p.waitForTimeout(150);
  if (/Dana/.test(await p.$$eval("#viewer option", (o) => o.map((x) => x.textContent).join(",")))) note("Removed employee still selectable");

  // Assistant respects permissions
  await p.selectOption("#viewer", "sara"); await p.waitForTimeout(150);
  await p.click("#fab"); await p.fill("#as-input", "How is Fernhollow Coffee doing?"); await p.keyboard.press("Enter"); await p.waitForTimeout(900);
  const last = await p.$$eval(".bubble.ai", (x) => x[x.length - 1].textContent);
  if (/\$\d/.test(last)) note("Assistant gave Sara numbers for a brand she can't access");
  await p.fill("#as-input", "What is the total spend?"); await p.keyboard.press("Enter"); await p.waitForTimeout(900);
  const last2 = await p.$$eval(".bubble.ai", (x) => x[x.length - 1].textContent);
  if (/spend \$/i.test(last2)) note("Assistant told Sara the ad spend");

  if (errs.length) note("script errors in flows: " + [...new Set(errs)].join(" | "));
  console.log(issues.length ? `\n${issues.length} issue(s) found` : "\nNo issues found");
  await b.close();
})();
