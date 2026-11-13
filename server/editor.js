// Runs Tracker's editing step (server/edit.py, built on MoviePy) as a separate
// Python program. Editing happens on this computer and costs no credits.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

function run(cmd, args, input, timeoutMs) {
  return new Promise((resolve) => {
    let out = "", err = "", done = false;
    let child;
    try { child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"], windowsHide: true }); }
    catch { return resolve({ code: -1, out, err: "not found" }); }
    const finish = (code) => { if (!done) { done = true; clearTimeout(timer); resolve({ code, out, err }); } };
    const timer = setTimeout(() => { try { child.kill(); } catch {} finish(-2); }, timeoutMs);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", () => finish(-1));
    child.on("close", finish);
    child.stdin.on("error", () => {});
    child.stdin.end(input || "");
  });
}
const lastJson = (text) => { for (const line of text.trim().split(/\r?\n/).reverse()) { try { return JSON.parse(line); } catch {} } return null; };

function create({ script = path.join(__dirname, "edit.py"), musicDir, fontDir }) {
  let found = null, checkedAt = 0, checking = null;
  const pythons = [process.env.TRACKER_PYTHON, "python3", "python", "py"].filter(Boolean);

  // Is Python with MoviePy available on this computer? Checked at start, and again every few minutes while it isn't.
  function status(force = false) {
    if (!force && found && (found.ok || Date.now() - checkedAt < 5 * 60_000)) return Promise.resolve(found);
    if (!checking) {
      checking = (async () => {
        let result = { ok: false };
        for (const py of pythons) {
          const r = await run(py, [script, "--check"], "", 30_000);
          const j = r.code === 0 && lastJson(r.out);
          if (j && j.ok) { result = { ok: true, version: j.version, python: py }; break; }
        }
        found = result; checkedAt = Date.now(); checking = null;
        return found;
      })();
    }
    return checking;
  }
  const known = () => found || { ok: false };

  // Music the admin has put in data/music. Only the file names are ever shown or accepted.
  function music() {
    try { return fs.readdirSync(musicDir).filter((f) => /\.(mp3|wav|m4a|aac|ogg)$/i.test(f)).sort(); } catch { return []; }
  }

  async function edit({ input, output, caption, endCard, brand, cta, hue, music: track }) {
    const st = await status();
    if (!st.ok) throw new Error("MoviePy isn't installed on this computer.");
    const spec = { input, output, caption: caption || "", end_card: !!endCard, brand, cta, hue, fonts: fontDir };
    if (track && music().includes(track)) spec.music = path.join(musicDir, track);
    const r = await run(st.python, [script], JSON.stringify(spec), 10 * 60_000);
    const j = lastJson(r.out);
    if (r.code === -2) throw new Error("Editing took too long and was stopped.");
    if (!j || !j.ok) throw new Error((j && j.error) || "The editor stopped unexpectedly.");
    return j;
  }

  status(); // find out early, without holding anything up
  return { status, known, music, edit };
}

module.exports = { create };
