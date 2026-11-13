// The video request pipeline: script → video → edit → supervisor.
//
// What is real depends on what is connected:
//   • Higgsfield connected: the VIDEO step really creates the clips, spends
//     real credits and saves the files on this computer.
//     The EDIT step then adds a caption, an end card and music with MoviePy,
//     on this computer, if the request asked for any of them.
//   • Not connected: every step only advances a progress bar (a practice run).
// The script and supervisor steps are still placeholders. Each place
// where a real service will plug in is marked LIVE.
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const STEPS = [
  { key: "script", name: "Script", ticks: 6 },      // LIVE: Claude writes the script
  { key: "video", name: "Higgsfield video", ticks: 9 },
  { key: "edit", name: "Editing", ticks: 7 },
  { key: "supervisor", name: "Supervisor", ticks: 4 }, // LIVE: Claude reviews the result
];
const PRACTICE_NOTES = {
  script: ["Script agent is writing hooks based on the brand's best videos.", "Script approved: hook is under 3 seconds and the CTA matches the product."],
  video: ["Sent the shot list to Higgsfield.", "Higgsfield returned all clips. Two takes regenerated for lighting."],
  edit: ["Editing agent is assembling the cuts.", "Edit done: captions are readable and the music is licensed."],
  supervisor: ["Running final quality checks.", "All checks passed. Ready for review."],
};
const REAL_NOTES = {
  script: ["Turning the brief into a video prompt.", "Prompt ready."],
  edit: ["Editing isn't connected yet, so the Higgsfield clip is used as it is.", "Clip passed through unchanged."],
  supervisor: ["Checking that every clip arrived.", "Ready for review."],
};

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
// Until Claude writes real scripts, the prompt is assembled from what the employee typed.
function buildPrompt(job) {
  return `${job.style} video for TikTok, vertical 9:16. Product: ${job.product} by ${job.brandName}. ${job.brief} Natural handheld phone footage with an authentic creator feel. No on-screen text or logos.`.slice(0, 1800);
}

function newJob(fields) {
  const job = {
    ...fields, created: new Date().toISOString(), length: `${fields.seconds} sec`,
    steps: STEPS.map((s) => ({ key: s.key, status: "queued", progress: 0 })),
    log: [], status: "running", revision: 0, outputs: {}, video: null, error: null,
  };
  job.hook = makeHook(job);
  log(job, "Supervisor", `Brief received from ${job.by}. ${job.variations} variation${job.variations > 1 ? "s" : ""}, ${job.length}, ${job.tierLabel} quality, ${job.cost} credits${job.simulated ? " (practice run, nothing is spent)" : ""}.`);
  return job;
}

function finishStep(job, i, note) {
  const s = job.steps[i];
  s.status = "done"; s.progress = 100;
  log(job, STEPS[i].name, "Finished.");
  if (note) log(job, "Supervisor", note);
  if (i === job.steps.length - 1) job.status = "review";
}

// A placeholder step: only moves the progress bar.
function tickPlaceholder(job, i) {
  const s = job.steps[i], def = STEPS[i];
  const notes = (job.simulated ? PRACTICE_NOTES : REAL_NOTES)[def.key] || PRACTICE_NOTES[def.key];
  if (s.status === "queued") { s.status = "working"; log(job, "Supervisor", notes[0]); }
  s.progress = Math.min(100, s.progress + (100 / def.ticks) * (0.7 + Math.random() * 0.6));
  if (def.key === "video" && s.progress > 45 && !s.mid) { s.mid = 1; log(job, "Higgsfield", `Rendering clip ${job.variations * 2} of ${job.variations * 4}…`); }
  if (s.progress >= 100) {
    if (!job.simulated) job.outputs[def.key] = { script: "Prompt built from the brief. No script was written because Claude isn't connected yet.", supervisor: "Checked that every clip arrived." }[def.key];
    finishStep(job, i, notes[1]);
  }
}

function create({ db, hf, budget, editor, videoDir, pollMs = 8000 }) {
  const busy = new Set();
  const save = (job) => db.run("UPDATE jobs SET status = ?, data = ? WHERE id = ?", job.status, JSON.stringify(job), job.id);
  const charge = (job, status, credits) => {
    if (!job.chargeId) return;
    if (credits === undefined) db.run("UPDATE charges SET status = ? WHERE id = ?", status, job.chargeId);
    else db.run("UPDATE charges SET status = ?, credits = ? WHERE id = ?", status, credits, job.chargeId);
  };
  function fail(job, message, { refund = false } = {}) {
    job.status = "failed"; job.error = message;
    const s = job.steps.find((x) => x.status === "working"); if (s) s.status = "failed";
    log(job, "Supervisor", message);
    if (refund) { charge(job, "released"); log(job, "Supervisor", "No credits were used for this request."); }
  }

  // The real video step: ask Higgsfield for the clips, wait, then save them here.
  async function advanceVideo(job) {
    const s = job.steps[1];
    const t = budget.tier(job.tier);
    if (s.status === "queued") {
      s.status = "working"; s.progress = 3;
      log(job, "Supervisor", `Asking Higgsfield for ${job.variations} ${job.length} clip${job.variations > 1 ? "s" : ""}.`);
      save(job);
      try {
        const ids = await hf.generate({ model: t.model, prompt: buildPrompt(job), aspect_ratio: "9:16", duration: job.seconds, count: job.variations, ...t.params });
        job.video = { ids, startedAt: Date.now(), polledAt: 0, errors: 0, urls: [], files: [] };
        charge(job, "spent");
        log(job, "Higgsfield", `Rendering started (${ids.length} clip${ids.length > 1 ? "s" : ""}). This usually takes a few minutes.`);
      } catch (e) {
        if (e.uncertain) { charge(job, "spent"); fail(job, `Tracker couldn't confirm whether Higgsfield started this video (${e.message}) Check your Higgsfield account before trying again, so you don't pay twice.`); }
        else fail(job, `Higgsfield didn't start the video: ${e.message}`, { refund: true });
      }
      hf.refreshBalance(true);
      return save(job);
    }
    const v = job.video;
    if (!v || Date.now() - v.polledAt < pollMs) return;
    v.polledAt = Date.now();
    const elapsed = Date.now() - v.startedAt, expected = 60_000 + 12_000 * job.seconds;
    s.progress = Math.max(s.progress, Math.min(95, (elapsed / expected) * 100));
    let list;
    try { list = await hf.status(v.ids); v.errors = 0; }
    catch (e) {
      v.errors++;
      if (e.auth) fail(job, "Higgsfield needs to be connected again (Connections). The video may still be rendering in your Higgsfield account.");
      else if (v.errors >= 10) fail(job, "Lost contact with Higgsfield. The video may still appear in your Higgsfield account.");
      return save(job);
    }
    const done = list.filter((j) => j.status === "completed" && j.url), failed = list.filter((j) => /fail|error|cancel|nsfw/i.test(j.status));
    if (done.length + failed.length < v.ids.length) {
      if (elapsed > 25 * 60_000) fail(job, "Higgsfield is taking too long. Check your Higgsfield account; the video may still finish there.");
      return save(job);
    }
    if (!done.length) {
      fail(job, "Higgsfield couldn't make this video. Its credits are returned by Higgsfield. Try different wording.", { refund: true });
      hf.refreshBalance(true);
      return save(job);
    }
    if (failed.length) { charge(job, "spent", Math.round(((job.cost * done.length) / v.ids.length) * 10) / 10); log(job, "Supervisor", `${failed.length} of ${v.ids.length} clips failed; Higgsfield returns their credits.`); }
    v.urls = done.map((j) => j.url);
    // Keep a copy on this computer so the video stays available.
    fs.mkdirSync(videoDir, { recursive: true });
    for (let n = 0; n < v.urls.length; n++) {
      try {
        const res = await fetch(v.urls[n], { signal: AbortSignal.timeout(120_000) });
        if (!res.ok) throw new Error(String(res.status));
        const file = `${job.id}-r${job.revision}-${n}.mp4`;
        fs.writeFileSync(path.join(videoDir, file), Buffer.from(await res.arrayBuffer()));
        v.files[n] = file;
      } catch { v.files[n] = null; log(job, "Supervisor", `Couldn't save clip ${n + 1} on this computer; it will play from Higgsfield instead.`); }
    }
    job.outputs.video = `${done.length} clip${done.length > 1 ? "s" : ""} created in Higgsfield · 9:16 · ${job.length}`;
    finishStep(job, 1, `Higgsfield delivered ${done.length} clip${done.length > 1 ? "s" : ""}.`);
    hf.refreshBalance(true);
    save(job);
  }

  // The real editing step: MoviePy adds what the request asked for to each saved clip.
  async function advanceEdit(job) {
    const s = job.steps[2], v = job.video, e = job.edit || {};
    const wants = [e.caption && "a caption", e.endCard && "an end card", e.music && "music"].filter(Boolean);
    const skip = (output, note) => { job.outputs.edit = output; finishStep(job, 2, note); save(job); };
    s.status = "working"; s.progress = 5;
    if (!wants.length) return skip("No edits were asked for, so the Higgsfield clip is used as it is.", "No editing needed.");
    if (!(await editor.status()).ok) return skip("MoviePy isn't installed on the Tracker computer, so the clip is used without edits.", "Editing was skipped: MoviePy isn't installed on this computer.");
    log(job, "Supervisor", `Editing agent is adding ${wants.join(", ").replace(/, ([^,]*)$/, " and $1")} with MoviePy.`);
    save(job);
    v.edited = [];
    for (let n = 0; n < v.files.length; n++) {
      v.edited[n] = null;
      if (!v.files[n]) { log(job, "Editing", `Clip ${n + 1} isn't saved on this computer, so it can't be edited.`); continue; }
      const out = v.files[n].replace(/\.mp4$/, "-edit.mp4");
      try {
        await editor.edit({ input: path.join(videoDir, v.files[n]), output: path.join(videoDir, out), caption: e.caption, endCard: e.endCard, brand: job.brandName, cta: e.cta, hue: job.hue, music: e.music });
        v.edited[n] = out;
      } catch (err) { log(job, "Editing", `Couldn't edit clip ${n + 1} (${String(err.message).slice(0, 160)}). The original is kept.`); }
      s.progress = 5 + (95 * (n + 1)) / v.files.length;
      save(job);
    }
    const ok = v.edited.filter(Boolean).length;
    job.outputs.edit = ok ? `${ok} clip${ok > 1 ? "s" : ""} edited with MoviePy: ${wants.join(", ").replace(/\ba |\ban /g, "")}` : "Editing didn't work, so the original clips are kept.";
    finishStep(job, 2, ok ? "Edit done." : "Editing failed; using the original clips.");
    save(job);
  }

  function tickAll() {
    for (const row of db.all("SELECT id, data FROM jobs WHERE status = 'running'")) {
      if (busy.has(row.id)) continue;
      const job = JSON.parse(row.data);
      const i = job.steps.findIndex((s) => s.status !== "done");
      if (i < 0) { job.status = "review"; save(job); continue; }
      if (STEPS[i].key === "video" && !job.simulated) {
        busy.add(job.id);
        advanceVideo(job).catch((e) => { console.error(e); try { fail(job, "Something went wrong while making the video."); save(job); } catch {} }).finally(() => busy.delete(job.id));
      } else if (STEPS[i].key === "edit" && !job.simulated) {
        busy.add(job.id);
        advanceEdit(job).catch((e) => { console.error(e); try { job.outputs.edit = "Editing didn't work, so the original clips are kept."; finishStep(job, 2, "Editing failed; using the original clips."); save(job); } catch {} }).finally(() => busy.delete(job.id));
      } else { tickPlaceholder(job, i); save(job); }
    }
  }

  function act(job, action, user) {
    if (action === "approve") {
      job.status = "posted";
      // LIVE: publish through the brand's connected social accounts.
      log(job, "Supervisor", job.simulated
        ? `Approved by ${user.name}. Marked as published to ${job.accounts.map((a) => a.platform).join(", ")}.`
        : `Approved by ${user.name}. Posting isn't connected yet, so download the video and post it to ${job.accounts.map((a) => a.platform).join(", ") || "the brand's account"}.`);
    } else if (action === "send") {
      job.status = "approval";
      log(job, "Supervisor", `${user.name} sent this for approval.`);
    } else if (action === "revise") {
      job.revision++; job.status = "running"; job.error = null;
      if (job.simulated) {
        job.hook = `"Okay, I have to talk about ${job.product.split(" ")[0]}"`;
        job.steps.forEach((s, i) => { if (i !== 1) { s.status = "queued"; s.progress = 0; } });
        log(job, "Supervisor", `Changes requested by ${user.name} (revision ${job.revision}). Re-running script and edit; reusing the Higgsfield clips.`);
      } else {
        job.steps.forEach((s) => { s.status = "queued"; s.progress = 0; delete s.mid; });
        job.video = null;
        log(job, "Supervisor", `New version requested by ${user.name} (revision ${job.revision}). This makes new clips and costs ${job.cost} credits.`);
      }
    }
  }

  let timer = null;
  return {
    newJob, act, tickAll,
    start(everyMs = 650) { timer = setInterval(tickAll, everyMs); timer.unref(); return timer; },
    stop() { clearInterval(timer); },
  };
}

module.exports = { create };
