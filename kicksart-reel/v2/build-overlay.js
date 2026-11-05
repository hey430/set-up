// Renders the motion-graphics layer (overlay.html) to transparent 1920x1080 PNGs.
//   node build-overlay.js <outDir> [lastFrame=276]
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const out = process.argv[2] || path.join(__dirname, "build", "overlay");
const last = +(process.argv[3] || 276);
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("pageerror", e => console.error("page error:", e.message));
  await page.goto("file://" + path.join(__dirname, "overlay.html"));
  await page.evaluate(() => window.ready);
  if (process.env.NOHUD) await page.evaluate(() => { window.NOHUD = true; });   // clean frames for stills
  const canvas = await page.$("#c");
  const w = await page.evaluate(() => window.drawEmber());
  console.log("EMBER width on plate:", Math.round(w));
  await canvas.screenshot({ path: path.join(out, "ember.png"), omitBackground: true });
  for (let n = 1; n <= last; n++){
    await page.evaluate(n => window.drawFrame(n), n);
    await canvas.screenshot({ path: path.join(out, String(n).padStart(3, "0") + ".png"), omitBackground: true });
  }
  console.log("overlay frames:", last);
  await browser.close();
})();
