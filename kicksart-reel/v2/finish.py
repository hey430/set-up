"""Finishing pass for the Kicksart v2 reel.

Takes the 1280x720 source plate frames and the overlay PNGs, fixes the source's
mistakes, upscales to 1920x1080 and writes the final frame sequence.

  python3 -I finish.py <plateDir> <overlayDir> <outDir>

Fixes:
  * EMBER shot (frames 154-163): the source spells it "EMER". The word is removed
    using the clean teal shot (same camera, shoe aligned to ~1 px), then the
    correct word is composited behind the shoe.
  * Exploded view (frames 183-200): the source's label words are unreadable.
    They are painted out; overlay.html draws real labels on the same leader lines.
  * Ending (frame 218 on): replaced by the end card. Background is the source's
    own end-shot backdrop with the misspelled logo painted out.
"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter

plate_dir, overlay_dir, out_dir = sys.argv[1:4]
os.makedirs(out_dir, exist_ok=True)
W, H = 1920, 1080
LAST_PLATE, LAST = 217, 276


def load(f):
    return np.asarray(Image.open(os.path.join(plate_dir, f"{f:03d}.png")).convert("RGB")).astype(np.float32)


def fill_vertical(a, x0, y0, x1, y1, rng):
    """Paint a box with a vertical blend of the rows just above and below it (smooth backdrop)."""
    top = a[y0 - 3:y0, x0:x1].mean(axis=0)
    bot = a[y1:y1 + 3, x0:x1].mean(axis=0)
    # soften column-to-column variation
    k = np.ones(9) / 9
    for arr in (top, bot):
        for ch in range(3):
            arr[:, ch] = np.convolve(np.pad(arr[:, ch], 4, mode="edge"), k, mode="valid")
    t = np.linspace(0, 1, y1 - y0)[:, None, None]
    a[y0:y1, x0:x1] = top[None] * (1 - t) + bot[None] * t + rng.normal(0, .7, (y1 - y0, x1 - x0, 1))
    return a


def up(a):
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))


rng = np.random.default_rng(7)

# ---- Shoe mask from the clean teal shot (frames 84-88, before the words start) ----
teal = np.median(np.stack([load(f) for f in range(84, 89)]), axis=0)
hsv = np.asarray(Image.fromarray(teal.astype(np.uint8)).convert("HSV")).astype(np.float32)
sat, val = hsv[..., 1], hsv[..., 2]
# Solid silhouette: everything not reachable from the frame edge through low-saturation backdrop
from PIL import ImageDraw
bgish = Image.fromarray(((sat < 32) * 255).astype(np.uint8)).copy()   # writable copy for floodfill
ImageDraw.floodfill(bgish, (0, 0), 128)
ImageDraw.floodfill(bgish, (1279, 0), 128)
solid = (np.asarray(bgish) != 128).astype(np.uint8) * 255
m_im = Image.fromarray(solid).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))  # drop specks
soft = m_im.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.0))              # for the word behind the shoe
keep = m_im.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(1.0))              # pixels kept from the EMBER shot
shoe720 = np.asarray(keep).astype(np.float32)[..., None] / 255
shoe1080 = np.asarray(soft.resize((W, H), Image.LANCZOS)).astype(np.float32)[..., None] / 255
Image.fromarray(np.asarray(soft)).save(os.path.join(out_dir, "_shoe_mask.png"))

ember_txt = np.asarray(Image.open(os.path.join(overlay_dir, "ember.png")).convert("RGBA")).astype(np.float32)
ember_rgb, ember_a = ember_txt[..., :3], ember_txt[..., 3:] / 255
ember_a = ember_a * (1 - shoe1080)                         # the word sits behind the shoe

# ---- Exploded-view label boxes (source word positions, padded; leader lines left intact) ----
LABEL_BOXES = [(182, 102, 287, 142), (786, 76, 896, 115), (1030, 234, 1144, 276), (118, 334, 235, 374),
               (1029, 358, 1116, 398), (134, 455, 224, 496), (1040, 460, 1108, 500)]

# ---- Clean end backdrop: source end shot with the logo painted out ----
end = load(241)
hsv_e = np.asarray(Image.fromarray(end.astype(np.uint8)).convert("HSV")).astype(np.float32)
region = (end.min(axis=2) > 236) | (hsv_e[..., 2] < 70)
region[:260] = False; region[500:] = False; region[:, :380] = False; region[:, 900:] = False
ys, xs = np.nonzero(region)
bx0, bx1, by0, by1 = xs.min() - 14, xs.max() + 14, ys.min() - 14, ys.max() + 14
print("end logo box", bx0, by0, bx1, by1)
end = fill_vertical(end, bx0, by0, bx1, by1, rng)
end_up = up(end)

for n in range(1, LAST + 1):
    if n <= LAST_PLATE:
        a = load(n)
        if 154 <= n <= 163:                                # EMBER shot: remove "EMER"
            y0, y1, x0, x1 = 188, 488, 150, 1120
            a[y0:y1, x0:x1] = shoe720[y0:y1, x0:x1] * a[y0:y1, x0:x1] + (1 - shoe720[y0:y1, x0:x1]) * teal[y0:y1, x0:x1]
        if 183 <= n <= 200:                                # exploded view: remove label words
            for bx in LABEL_BOXES:
                a = fill_vertical(a, *bx, rng)
        im = up(a)
        if 154 <= n <= 163:
            arr = np.asarray(im).astype(np.float32)
            arr = arr * (1 - ember_a) + ember_rgb * ember_a
            im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    else:
        im = end_up.copy()
    ov = Image.open(os.path.join(overlay_dir, f"{n:03d}.png")).convert("RGBA")
    im = im.convert("RGBA"); im.alpha_composite(ov)
    im.convert("RGB").save(os.path.join(out_dir, f"{n:03d}.png"))
    if n % 24 == 0:
        print("frame", n)
print("done", LAST, "frames")
