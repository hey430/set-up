// Checks the editing step (MoviePy) on a real clip, end to end.
// Run with:  node --test tests/editing.test.js
// Needs Python with MoviePy; the checks are skipped where that isn't installed.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { createMock } = require("./mock-higgsfield");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tracker-edit-"));
const source = path.join(dir, "source.mp4");
// A 3-second vertical clip with sound, standing in for what Higgsfield delivers.
const made = spawnSync("python3", ["-c", `
import sys, numpy as np
from moviepy import ColorClip, AudioClip
tone = AudioClip(lambda t: 0.2*np.sin(2*np.pi*440*t), duration=3, fps=44100)
ColorClip(size=(360, 640), color=(30, 120, 90), duration=3).with_audio(tone).write_videofile(sys.argv[1], fps=24, logger=None)
AudioClip(lambda t: 0.3*np.sin(2*np.pi*220*t), duration=1.5, fps=44100).write_audiofile(sys.argv[2], logger=None)
`, source, path.join(dir, "bed.mp3")], { encoding: "utf8" });
const skip = made.status !== 0 ? "Python with MoviePy isn't installed here" : false;

const duration = (file) => Number(spawnSync("python3", ["-c", "import sys\nfrom moviepy import VideoFileClip\nc=VideoFileClip(sys.argv[1]); print(c.duration); print(c.audio is not None)", file], { encoding: "utf8" }).stdout.split("\n")[0]);

let base, app, mock;
const jar = {};
async function call(who, method, url, body) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (jar[who]) headers.Cookie = jar[who];
  const res = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
  const set = res.headers.get("set-cookie");
  if (set) jar[who] = set.split(";")[0];
  let json = null;
  try { json = await res.clone().json(); } catch {}
  return { status: res.status, json, res };
}
async function finished(id) {
  for (let i = 0; i < 2000; i++) {
    const job = (await call("admin", "GET", "/api/jobs")).json.jobs.find((j) => j.id === id);
    if (job.status !== "running") return job;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("job never finished");
}
const request = (edit) => call("admin", "POST", "/api/jobs", { brand: "lumora-skin", brief: "Morning routine", product: "Serum", tier: "draft", seconds: 5, variations: 1, edit });
const bytes = async (url) => Buffer.from(await (await fetch(base + url, { headers: { Cookie: jar.admin } })).arrayBuffer());

test.before(async () => {
  if (skip) return;
  mock = createMock({ credits: 600 });
  mock.state.videoFile = source;
  process.env.HIGGSFIELD_MCP_URL = (await mock.listen()) + "/mcp";
  const { createApp } = require("../server/server");
  app = createApp({ dbFile: path.join(dir, "data", "tracker.db"), tickMs: 5, pollMs: 10 });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  base = "http://127.0.0.1:" + app.server.address().port;
  await call("admin", "POST", "/api/setup", { agency: "Test Agency", name: "Ada Admin", email: "ada@test.co", password: "correct horse" });
  const start = await call("admin", "POST", "/api/higgsfield/connect", {});
  const back = new URL((await fetch(start.json.url, { redirect: "manual" })).headers.get("location"));
  await call("admin", "GET", back.pathname + back.search);
  fs.mkdirSync(path.join(dir, "data", "music"), { recursive: true });
  fs.copyFileSync(path.join(dir, "bed.mp3"), path.join(dir, "data", "music", "calm-bed.mp3"));
});
test.after(async () => { if (skip) return; await new Promise((r) => app.server.close(r)); await mock.close(); });

test("Tracker knows the editor is ready and which music it can use", { skip }, async () => {
  const s = (await call("admin", "GET", "/api/session")).json.state;
  assert.equal(s.editing.available, true);
  assert.match(s.editing.version, /^\d+\.\d+/);
  assert.deepEqual(s.editing.music, ["calm-bed.mp3"]);
});

test("a caption, an end card and music are added to the Higgsfield clip", { skip }, async () => {
  const made = await request({ caption: "I stopped using 5 products and switched to one", endCard: true, cta: "Shop now", music: "calm-bed.mp3" });
  assert.equal(made.status, 200);
  const job = await finished(made.json.id);
  assert.equal(job.status, "review");
  assert.equal(job.video.edited.length, 1);
  assert.ok(job.video.edited[0], "an edited file exists");
  assert.match(job.outputs.edit, /1 clip edited with MoviePy: caption, end card, music/);
  const edited = await bytes(`/api/jobs/${job.id}/video/0`), original = await bytes(`/api/jobs/${job.id}/video/0?raw=1`);
  assert.equal(original.length, fs.statSync(source).size, "the original clip is kept untouched");
  assert.notEqual(edited.length, original.length);
  const out = path.join(dir, "check.mp4"); fs.writeFileSync(out, edited);
  assert.equal(duration(out), 5, "3 seconds of clip plus a 2-second end card");
  assert.equal(mock.state.credits, 595, "editing costs no credits; only the 5-credit clip was paid for");
});

test("with nothing to add, the clip is passed through untouched", { skip }, async () => {
  const job = await finished((await request({ endCard: false })).json.id);
  assert.equal(job.status, "review");
  assert.equal(job.video.edited, undefined);
  assert.match(job.outputs.edit, /No edits were asked for/);
});

test("music that isn't in the music folder is ignored", { skip }, async () => {
  const job = await finished((await request({ endCard: true, music: "../../tracker.db" })).json.id);
  assert.equal(job.edit.music, "");
  assert.match(job.outputs.edit, /end card$/);
});

test("if a clip can't be edited, the original is kept and the request still finishes", { skip }, async () => {
  mock.state.videoFile = null; // Higgsfield now "delivers" a file that isn't a real video
  const job = await finished((await request({ caption: "Hello", endCard: true })).json.id);
  assert.equal(job.status, "review");
  assert.deepEqual(job.video.edited, [null]);
  assert.match(job.outputs.edit, /original clips are kept/);
  assert.ok(job.log.some((l) => /Couldn't edit clip 1/.test(l.text)));
  assert.match((await bytes(`/api/jobs/${job.id}/video/0`)).toString(), /fake mp4 bytes/);
  mock.state.videoFile = source;
});
