# Rameesha Fatima: Portfolio

A single-page 3D portfolio for **Rameesha Fatima**, HR Strategy Lead and People & Culture specialist in Karachi, Pakistan.

Built with React + Vite, Three.js (React Three Fiber + drei), GSAP + ScrollTrigger + SplitText, Lenis and Tailwind CSS.

---

## 1. Design rationale

**Concept: "The Thriving Network."** Rameesha's work and research are about people, connection, and helping employees thrive. The site uses one quiet 3D idea from top to bottom: a field of **250 soft, pearl-like nodes**, one for each employee in her TalentX programme. When the cursor passes, thin lines draw between nearby people, like friendships forming, and fade gently when it moves on. The page scroll moves the network through her story:

| Section    | Formation                                                                    |
| ---------- | ---------------------------------------------------------------------------- |
| Hero       | Scattered, individual people floating in depth                               |
| About      | Small connected clusters (teams)                                             |
| Impact     | A rising band, the "thriving curve" (it widens as it grows)                  |
| Experience | A globe with glowing hubs in Pakistan, Canada, the USA and Indonesia, joined by arcs that draw themselves |
| Contact    | A calm, connected ring around the call to action                             |

Motion is slow and damped. The network also fades back in reading-heavy sections (`data-dim`) so text always comes first.

**Palette** (warm editorial, not tech-dark):

| Token             | Hex       | Use and reasoning                                                                 |
| ----------------- | --------- | --------------------------------------------------------------------------------- |
| `paper`           | `#F6F2EC` | Warm off-white background. Calm, premium, lots of breathing room                   |
| `ink`             | `#1E1E1E` | Soft charcoal text. Kinder than pure black, 16:1 on paper                          |
| `muted`           | `#655E57` | Secondary text, refined from warm grey to pass AA (5.7:1)                          |
| `stone`           | `#D9D6D1` | Warm grey that echoes her turtleneck. Rules, borders, nodes                        |
| `terracotta`      | `#C8473A` | Accent that echoes the warm red in her portrait. Large numbers, cursor, nodes      |
| `terracotta-deep` | `#A63A2F` | **Refinement:** `#C8473A` is only 4.3:1 on paper, so small text and button fills use this AA-safe shade (5.3:1, white text 6.3:1) |
| `teal`            | `#1F4E4F` | Deep contrast for the Research section and case-study outcomes                     |

**Typography.** *Fraunces* (variable display serif with optical sizing and a soft, human "wonk") for headings, paired with *Inter* for body text. Every size uses a fluid `clamp()` scale. The hero name is 10vw on desktop (12rem cap) and 17vw on mobile.

**Why horizontal scroll for Key Initiatives (not fanned 3D cards).** It reads like turning the pages of a magazine, which suits the editorial style. Every card stays flat and fully legible, with no skewed text. It also degrades naturally into a vertical stack on mobile and with reduced motion.

**Taglines**

- Primary: *People strategy that helps teams thrive.*
- Alternative 1: *Strategic HR, human at heart.*
- Alternative 2: *Building workplaces where people grow, and businesses follow.*

(To swap one in, set `hero.tagline` in `src/data/content.js`.)

---

## 2. Project structure

```
├── index.html                  # SEO meta, Open Graph, Person JSON-LD, static first-paint preloader
├── public/
│   ├── favicon.svg / apple-touch-icon.png
│   ├── og-image.jpg            # 1200×630 social card (portrait + name)
│   ├── robots.txt / sitemap.xml
│   └── images/
│       ├── rameesha-portrait-900.webp   # background-removed cut-out (64 KB)
│       ├── rameesha-portrait-560.webp   # mobile size (31 KB)
│       └── network-fallback.svg         # static network shown without WebGL
├── src/
│   ├── main.jsx / App.jsx      # app shell: preloader, Lenis, scroll → scene wiring
│   ├── index.css               # Tailwind layers, cursor, marquee, reduced-motion rules
│   ├── config/site.js          # contact details, feature flags, form endpoint, node counts
│   ├── data/content.js         # ALL copy (edit text here, not in components)
│   ├── lib/
│   │   ├── gsap.js             # plugin registration + easing/duration tokens
│   │   ├── animations.js       # shared reveal helpers (items, SplitText lines)
│   │   ├── scroll.js           # Lenis ⇄ ScrollTrigger sync, scrollTo, lock
│   │   ├── sceneState.js       # shared state between DOM and WebGL loop
│   │   └── env.js              # reduced motion / pointer / WebGL detection
│   ├── hooks/                  # useMediaQuery, useFocusTrap
│   └── components/
│       ├── three/
│       │   ├── NetworkCanvas.jsx     # fixed canvas, DPR clamp, pause off-screen/hidden, fallback
│       │   ├── ThrivingNetwork.jsx   # instanced nodes, single line buffer, choreography
│       │   ├── formations.js         # the five layouts + structural links
│       │   ├── shaders.js            # pearl-impostor + depth-of-field GLSL
│       │   └── NetworkFallback.jsx
│       ├── ui/                 # Preloader, Header (+menu), Cursor, Magnetic, RipplePortrait,
│       │                       # SectionHeading, ExpertiseIcon
│       └── sections/           # Hero, About, Impact, Initiatives (+CaseStudyOverlay),
│                               # Experience, Expertise, Research, Recognition,
│                               # Testimonials, Contact (+ContactForm), Footer
├── tailwind.config.js / postcss.config.js / vite.config.js
├── netlify.toml / vercel.json
```

### Technical notes

- **Nodes:** one `InstancedMesh` of camera-facing quads. The fragment shader draws a pearl sphere impostor (diffuse, sheen and rim) and softens its edge with distance from the focal plane. That gives real-looking depth of field in one draw call, with no post-processing.
- **Lines:** a single preallocated `LineSegments` buffer (1,800 segments) rewritten each frame for structural links and cursor "friendships".
- **Scroll:** each formation change is scrubbed by a ScrollTrigger on the section that introduces it. The render loop then damps toward that value, with a per-node stagger.
- **Performance:**
  - DPR is clamped (2 on desktop, 1.5 on mobile) and adapted by drei's `PerformanceMonitor`.
  - Rendering pauses when the tab is hidden, the canvas is off-screen, or the opaque Research section covers it.
  - Three.js is code-split, so HTML text paints first.
  - Mobile uses 80 nodes, no hover lines (a slow automatic "wandering" connection instead), and no custom cursor.
- **Portrait ripple:** a tiny raw-WebGL shader (no second three.js scene). It only runs while hovered, and its amplitude is capped at a few pixels so her face is never visibly distorted.
- **Accessibility:**
  - All text is real HTML, and the heading order is h1 → h2 → h3.
  - Skip link, visible focus states, and 44px tap targets.
  - The menu and case studies are focus-trapped dialogs that close with Escape and restore focus.
  - Count-ups expose their final value to screen readers.
  - `prefers-reduced-motion` turns on:
    - a static network on an on-demand render loop
    - native scrolling
    - no reveals, no marquee, no cursor
  - Without WebGL, a static image of the network is shown instead.

---

## 3. Run locally

Requires Node 18+ (tested on Node 22).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build at http://localhost:4173
```

## 4. Deploy

**Vercel:** import the repository at vercel.com/new. `vercel.json` already sets the build command (`npm run build`), the output directory (`dist`) and long-cache headers. Or run `npx vercel --prod`.

**Netlify:** "Add new site → Import an existing project", or drag `dist/` onto app.netlify.com/drop. `netlify.toml` already sets the build command, the publish directory and cache headers. Or run `npx netlify deploy --prod --dir=dist`.

After the first deploy, update the domain (see the swap list below), then check the social card with the LinkedIn Post Inspector.

---

## 5. Swap list: what to replace before launch

| What | Where |
| --- | --- |
| **Live domain** (canonical, OG URLs, JSON-LD, sitemap) | `index.html` (search `rameeshafatima.com`), `public/robots.txt`, `public/sitemap.xml`, `src/config/site.js → SITE.url` |
| **Portrait** | Replace `public/images/rameesha-portrait-900.webp` (900 px wide) and `-560.webp` (560 px wide) with transparent-background WebP, under 200 KB. Update `width`/`height` in `src/components/ui/RipplePortrait.jsx` if the ratio changes. Alt text: `about.portraitAlt` in `src/data/content.js` |
| **Social card** | `public/og-image.jpg` (1200×630) |
| **Testimonials** | Replace the `[PLACEHOLDER]` entries in `testimonials` in `src/data/content.js` with real, approved quotes, then set `FLAGS.SHOW_TESTIMONIALS = true` in `src/config/site.js` |
| **"Road to 100" (CONFIRM)** | `initiatives` → `road-to-100` in `src/data/content.js`. Confirm the target figure and scope, and replace the outcome text "(Target figure and results to be confirmed.)" |
| **Contact form delivery** | `FORM_ENDPOINT` in `src/config/site.js`. Empty means it opens the visitor's email app with the message pre-filled. Paste a Formspree (or similar) JSON endpoint to receive messages directly |
| **Contact details** | `SITE` in `src/config/site.js` (email, LinkedIn, location, availability) |
| **Copy that should be checked by Rameesha** | `src/data/content.js`:<br>• `experience[].detail`: which AMZ One Step role led the FlowHCM rollout, and the duties listed for the Engagement Specialist and HR Generalist roles<br>• `initiatives[].caseStudy`: the problem/approach wording is written from the summary provided<br>• `expertise[].body` |
| **Taglines** | `hero.tagline` / `hero.alternativeTaglines` in `src/data/content.js` |

Information deliberately **not** displayed anywhere: CNIC, date of birth, father's name, phone number, student IDs, GPA or grades.
