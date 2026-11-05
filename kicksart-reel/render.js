// Renders reel.html frame by frame with Playwright and encodes with ffmpeg.
//
//   node render.js video  [--w 1920 --h 1080 --fps 60 --out kicksart-reel-16x9.mp4]
//   node render.js frames --times 0.6,2.2,4.0 [--w 1920 --h 1080 --dir frames]
//
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const args = process.argv.slice(2);
const mode = args[0] || "video";
const opt = (name, def) => { const i = args.indexOf("--" + name); return i > -1 ? args[i + 1] : def; };
const W = +opt("w", 1920), H = +opt("h", 1080), FPS = +opt("fps", 60), DUR = +opt("dur", 15);
const url = "file://" + path.join(__dirname, "reel.html") + "?capture";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on("pageerror", e => console.error("page error:", e.message));
  await page.goto(url);
  await page.evaluate(() => window.ready);

  if (mode === "frames"){
    const dir = opt("dir", path.join(__dirname, "frames"));
    fs.mkdirSync(dir, { recursive: true });
    const times = opt("times", "0.6,2.2,4.0").split(",").map(Number);
    for (const t of times){
      await page.evaluate(t => window.render(t), t);
      const file = path.join(dir, "frame-" + t.toFixed(2).padStart(5, "0").replace(".", "_") + ".png");
      await page.screenshot({ path: file });
      console.log(file);
    }
  } else {
    const out = opt("out", path.join(__dirname, "kicksart-reel-" + W + "x" + H + ".mp4"));
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
    const total = Math.round(DUR * FPS);
    for (let f = 0; f < total; f++){
      await page.evaluate(t => window.render(t), f / FPS);
      const buf = await page.screenshot({ type: "jpeg", quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
      if (f % 60 === 0) process.stdout.write("frame " + f + "/" + total + "\n");
    }
    ff.stdin.end();
    await new Promise(r => ff.on("close", r));
    console.log("wrote " + out);
  }
  await browser.close();
})();
