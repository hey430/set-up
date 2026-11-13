"""Tracker's editing step, built on MoviePy.

Takes one clip from Higgsfield and can add:
  - an opening caption (large on-screen text for the first seconds)
  - an end card with the brand's name and a call to action
  - background music under the clip's own sound

Called by the server, which sends a JSON description on standard input:
  {"input": "...mp4", "output": "...mp4", "caption": "text", "end_card": true,
   "brand": "Lumora Skin", "cta": "Shop now", "hue": 280, "music": "...mp3", "fonts": "folder"}
It prints one line of JSON describing the result (or the error).
"""
import colorsys
import json
import os
import sys


def find_font(folder):
    """A bold font for captions: the agency's own if provided, else a common system font."""
    candidates = []
    if folder and os.path.isdir(folder):
        candidates += sorted(os.path.join(folder, f) for f in os.listdir(folder) if f.lower().endswith((".ttf", ".otf")))
    candidates += [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf",
    ]
    return next((f for f in candidates if os.path.isfile(f)), None)  # None = MoviePy's built-in font


def wrap(text, font, font_size, max_width):
    """Break text into lines between words only (MoviePy's own wrapping can split a word)."""
    from PIL import ImageFont
    f = ImageFont.truetype(font, font_size) if font else ImageFont.load_default(font_size)
    lines, line = [], ""
    for word in text.split():
        trial = (line + " " + word).strip()
        if line and f.getlength(trial) > max_width:
            lines.append(line)
            line = word
        else:
            line = trial
    return "\n".join(lines + [line])


def edit(spec):
    from moviepy import (AudioFileClip, ColorClip, CompositeAudioClip, CompositeVideoClip, TextClip,
                         VideoFileClip, afx, concatenate_videoclips, vfx)

    clip = VideoFileClip(spec["input"])
    w, h = clip.size
    font = find_font(spec.get("fonts"))
    done = []
    parts = [clip]

    caption = (spec.get("caption") or "").strip()
    if caption:
        seconds = min(3.0, clip.duration)
        size = max(28, int(w * 0.075))
        text = TextClip(text=wrap(caption, font, size, w * 0.82), font=font, font_size=size, color="white", stroke_color="black",
                        stroke_width=max(2, int(w * 0.006)), method="label", text_align="center", margin=(14, 14), duration=seconds)
        text = text.with_position(("center", int(h * 0.62))).with_effects([vfx.CrossFadeOut(0.3)])
        parts[0] = CompositeVideoClip([clip, text], size=(w, h)).with_duration(clip.duration).with_audio(clip.audio)
        done.append("caption")

    if spec.get("end_card"):
        r, g, b = colorsys.hls_to_rgb((spec.get("hue", 265) % 360) / 360, 0.24, 0.55)
        seconds = 2.0
        layers = [ColorClip(size=(w, h), color=(int(r * 255), int(g * 255), int(b * 255)), duration=seconds)]
        size = int(w * 0.095)
        brand = TextClip(text=wrap(spec.get("brand") or "", font, size, w * 0.84), font=font, font_size=size, color="white", method="label",
                         text_align="center", margin=(10, 10), duration=seconds)
        cta = (spec.get("cta") or "").strip()
        pill = TextClip(text=cta, font=font, font_size=int(w * 0.06), color="black", bg_color="white", margin=(int(w * 0.06), int(w * 0.03)), duration=seconds) if cta else None
        # Stack the name and the button as one block in the middle, whatever the name's length.
        gap = int(h * 0.04)
        top = (h - (brand.h + (gap + pill.h if pill else 0))) // 2
        layers.append(brand.with_position(("center", top)))
        if pill:
            layers.append(pill.with_position(("center", top + brand.h + gap)))
        card = CompositeVideoClip(layers, size=(w, h)).with_duration(seconds).with_effects([vfx.FadeIn(0.25)])
        parts.append(card)
        done.append("end card")

    final = concatenate_videoclips(parts, method="compose") if len(parts) > 1 else parts[0]

    music = spec.get("music")
    if music:
        bed = AudioFileClip(music).with_effects([afx.AudioLoop(duration=final.duration), afx.MultiplyVolume(0.18), afx.AudioFadeOut(0.6)])
        final = final.with_audio(CompositeAudioClip([final.audio, bed]) if final.audio is not None else bed)
        done.append("music")

    final.write_videofile(spec["output"], codec="libx264", audio_codec="aac", fps=clip.fps or 24, preset="medium", logger=None)
    result = {"ok": True, "done": done, "duration": round(final.duration, 2), "size": [w, h]}
    clip.close()
    return result


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        import moviepy
        print(json.dumps({"ok": True, "version": moviepy.__version__}))
        sys.exit(0)
    try:
        out = edit(json.load(sys.stdin))
    except Exception as e:  # report every failure to the server in plain words
        out = {"ok": False, "error": f"{type(e).__name__}: {e}"[:400]}
    print(json.dumps(out))
