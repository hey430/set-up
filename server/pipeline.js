// The video request pipeline: script → video → edit → supervisor.
//
// Today every step is a SIMULATION that only advances a progress bar, so the
// rest of Tracker (requests, approvals, permissions, history) can be used and
// tested. Each step has one place where the real service plugs in, marked LIVE.
"use strict";

const STEPS = [
  { key: "script", name: "Script", ticks: 6, notes: ["Script agent is writing hooks based on the brand's best videos.", "Script approved: hook is under 3 seconds and the CTA matches the product."] }, // LIVE: Claude writes the script
  { key: "video", name: "Higgsfield video", ticks: 9, notes: ["Sent the shot list to Higgsfield.", "Higgsfield returned all clips. Two takes regenerated for lighting."] }, // LIVE: Higgsfield generates the clips
  { key: "edit", name: "Editing", ticks: 7, notes: ["Editing agent is assembling the cuts.", "Edit done: captions are readable and the music is licensed."] }, // LIVE: captions, music, end card
  { key: "supervisor", name: "Supervisor", ticks: 4, notes: ["Running final quality checks.", "All checks passed. Ready for review."] }, // LIVE: Claude reviews the result
];

const stamp = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
const log = (job, who, text) => job.log.push({ t: stamp(), who, text });

function makeHook(job) {
  const first = job.product.split(" ")[0];
  const hooks = {
    "UGC talking to camera": `"I didn't expect ${first} to work this fast"`,
    "Product demo": `"Watch what happens in 10 seconds"`,
    "Before and after": `"Day 1 vs day 14"`,
    Unboxing: `"Opening the one everyone keeps asking about"`,
    "Trend remix": `"POV: you finally found the one"`,
  };
  return hooks[job.style] || `"You need to see this"`;
}

function newJob({ id, brand, by, product, style, brief, length, variations, accounts, hue }) {
  const job = {
    id, brand, by, created: new Date().toISOString(), product, style, brief, length, variations, accounts,
    steps: STEPS.map((s) => ({ key: s.key, status: "queued", progress: 0 })),
    log: [], status: "running", revision: 0, hue, simulated: true,
  };
  job.hook = makeHook(job);
  log(job, "Supervisor", `Brief received from ${by}. ${variations} variation${variations > 1 ? "s" : ""}, ${length}, ${style.toLowerCase()}.`);
  return job;
}

// Moves one running job forward a little. Returns true if it changed.
function tick(job) {
  if (job.status !== "running") return false;
  const i = job.steps.findIndex((s) => s.status !== "done");
  if (i < 0) { job.status = "review"; return true; }
  const s = job.steps[i], def = STEPS[i];
  if (s.status === "queued") { s.status = "working"; log(job, "Supervisor", def.notes[0]); }
  s.progress = Math.min(100, s.progress + (100 / def.ticks) * (0.7 + Math.random() * 0.6));
  if (def.key === "video" && s.progress > 45 && !s.mid) { s.mid = 1; log(job, "Higgsfield", `Rendering clip ${job.variations * 2} of ${job.variations * 4}…`); }
  if (s.progress >= 100) {
    s.status = "done"; s.progress = 100;
    log(job, def.name, "Finished.");
    log(job, "Supervisor", def.notes[1]);
    if (i === job.steps.length - 1) job.status = "review";
  }
  return true;
}

function act(job, action, user) {
  if (action === "approve") {
    job.status = "posted"; // LIVE: publish through the brand's connected social accounts
    log(job, "Supervisor", `Approved by ${user.name}. Marked as published to ${job.accounts.map((a) => a.platform).join(", ")}.`);
  } else if (action === "send") {
    job.status = "approval";
    log(job, "Supervisor", `${user.name} sent this for approval.`);
  } else if (action === "revise") {
    job.revision++; job.status = "running";
    job.hook = `"Okay, I have to talk about ${job.product.split(" ")[0]}"`;
    job.steps.forEach((s, i) => { if (i !== 1) { s.status = "queued"; s.progress = 0; } });
    log(job, "Supervisor", `Changes requested by ${user.name} (revision ${job.revision}). Re-running script and edit; reusing the Higgsfield clips.`);
  }
}

function start(db, everyMs = 650) {
  const timer = setInterval(() => {
    for (const row of db.all("SELECT id, data FROM jobs WHERE status = 'running'")) {
      const job = JSON.parse(row.data);
      if (tick(job)) db.run("UPDATE jobs SET status = ?, data = ? WHERE id = ?", job.status, JSON.stringify(job), row.id);
    }
  }, everyMs);
  timer.unref();
  return timer;
}

module.exports = { newJob, act, start };
