import json, html, re
from common import *
from dash import dashboard_html

VIDEOS = [
    dict(id="7657638719805000990", handle="@watenest", product="Audien Atom hearing aids",
         url="https://www.tiktok.com/@watenest/video/7657638719805000990"),
    dict(id="7635997074701520142", handle="@mamabear7134", product="The Uzzle",
         url="https://www.tiktok.com/@mamabear7134/video/7635997074701520142"),
    dict(id="7618270208574147854", handle=None, product="Audien Atom hearing aids", url=None),
    dict(id="7616154090346728718", handle=None, product="The Uzzle", url=None),
    dict(id="7584578757109812535", handle=None, product="Audien Atom hearing aids", url=None),
]
MORE_LINKS = [
    ("@aneesajahna", "https://www.tiktok.com/@aneesajahna/video/7650697376612584717"),
    ("@nocapdeals3", "https://www.tiktok.com/@nocapdeals3/video/7614053397343309069"),
    ("@gregdawsonbiz", "https://www.tiktok.com/@gregdawsonbiz/video/7565271854101843214"),
    ("@austinfindss", "https://www.tiktok.com/@austinfindss/video/7638852933349674253"),
    ("@neverenoughnovels", "https://www.tiktok.com/@neverenoughnovels/video/7662182815571741982"),
    ("@kmarie1388", "https://www.tiktok.com/@kmarie1388/video/7652150761480113439"),
    ("@olivianus2", "https://www.tiktok.com/@olivianus2/video/7630127662232636685"),
]

FAQ = [
    ("How fast will I see sales?",
     "<p>Creator-driven sales usually start in weeks 3–4. Real, repeatable revenue takes 60–90 days. Anyone promising a profitable month one is selling you the pitch, not the channel. We plan a build phase, a proof phase and a scale phase, and show you the numbers at every step. <a href=\"blog/launch-tiktok-shop.html\">See the 90-day plan</a>.</p>"),
    ("What does TikTok Shop actually cost me?",
     "<p>The 6% referral fee is the entry price, not the exit price. Once you add fulfillment, creator commissions and ad spend, a first-year brand should budget roughly 38–52% of GMV for channel costs before product cost. Well-run shops bring that down to 28–35% by year two. We model your real number before you spend a dollar. <a href=\"blog/tiktok-shop-fees.html\">Read the full cost breakdown</a>.</p>"),
    ("Do I need thousands of creators?",
     "<p>No. In most shops, 5–10 creators drive 80%+ of monthly GMV. We sample wide at the start to find them, then concentrate budget, commission and attention on the ones who actually convert. A small roster that sells beats a big roster that posts.</p>"),
    ("What do I need to give you?",
     "<p>Three things: inventory that won't run out, fast approvals and one decision-maker. We handle shop setup, creator recruitment, briefs, ads, LIVE and reporting. If you can't commit stock and a 48-hour approval window, we're not a fit yet.</p>"),
    ("Will TikTok Shop cannibalize my Amazon or website sales?",
     "<p>The opposite is more common. 97% of US TikTok Shop buyers also shop on Amazon, and brands regularly see Amazon and DTC search lift during a TikTok push. We track that halo so you see the full return, not just last-click GMV.</p>"),
    ("What happens if we stop working together?",
     "<p>You keep everything: the shop, the creator relationships, the content rights, the ad account and the data. We build on your accounts from day one. An agency that holds your assets hostage can't keep you on results.</p>"),
    ("Who do you not work with?",
     "<p>Brands with under 50% gross margin, no inventory depth, or a plan to judge the channel in 30 days. We'd rather say no on the call than take your money and fail slowly.</p>"),
]

FAQ_LD = {
    "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": [{"@type": "Question", "name": q,
                    "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a).strip()}}
                   for q, a in FAQ],
}
WEBSITE_LD = {"@context": "https://schema.org", "@type": "WebSite", "@id": DOMAIN + "/#website",
              "name": "Haul House", "url": DOMAIN + "/", "description": SITE_DESC,
              "publisher": {"@id": DOMAIN + "/#organization"}, "inLanguage": "en-US"}


def vid_label(v):
    return v["handle"] or "Creator video"


def reel_phone(i, v, hidden):
    attrs = ' aria-hidden="true" tabindex="-1"' if hidden else f' aria-label="Play {e(vid_label(v))} video for {e(v["product"])}"'
    return f'''      <button class="reel-phone" type="button" data-video="{i}"{attrs}>
        <span class="phone-body">
          <span class="phone-screen">
            <video muted playsinline loop preload="none" poster="assets/video/{v["id"]}.jpg" data-src="assets/video/{v["id"]}-loop.mp4"></video>
            <span class="reel-speed">2×</span>
            <span class="reel-cap"><b>{e(vid_label(v))}</b>{e(v["product"])}</span>
          </span>
          <span class="phone-notch"></span>
        </span>
      </button>'''


def vid_card(i, v):
    return f'''        <li class="vid-card">
          <button class="vid-open" type="button" data-video="{i}" aria-label="Play {e(vid_label(v))} video for {e(v["product"])}">
            <span class="vid-thumb">
              <img src="assets/video/{v["id"]}.jpg" alt="" width="360" height="640" loading="lazy">
              <video muted playsinline loop preload="none" data-src="assets/video/{v["id"]}-loop.mp4"></video>
              <span class="perf-tag">TikTok Shop</span>
              <span class="vid-play">{svg(I["play"])}</span>
            </span>
            <span class="perf-meta"><span class="perf-handle">{e(vid_label(v))}</span><span class="vid-product">{e(v["product"])}</span></span>
          </button>
        </li>'''


videos_json = html.escape(json.dumps([
    {"src": f"assets/video/{v['id']}.mp4", "poster": f"assets/video/{v['id']}.jpg",
     "loop": f"assets/video/{v['id']}-loop.mp4", "handle": vid_label(v), "product": v["product"], "url": v["url"]}
    for v in VIDEOS]), quote=True)

services_html = "\n".join(f'''        <article class="reel-card">
          <div class="reel-top"><span class="reel-index">{n:02d}</span><span class="rec-dot">LIVE</span></div>
          <div class="reel-icon">{svg(I[ic])}</div>
          <div class="reel-body">
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
          <div class="reel-bottom"><div class="reel-bar" style="--fill:{f}%"><span></span></div></div>
        </article>''' for n, (ic, t, d, f) in enumerate(SERVICES, 1))

PROCESS = [
    ("Days 1–14", "Build the machine",
     "Shop setup, listings rebuilt for mobile, commission tiers and creator briefs. We line up 20–30 videos before launch, because ads pointed at an empty store only burn money."),
    ("Days 15–30", "First sales",
     "Creator videos go live and the first orders arrive from creators, not ads: creators need no learning period. Ads start small. We watch which creators post, which videos sell and which products move."),
    ("Days 31–60", "The ugly middle",
     "GMV Max needs roughly 50–100 conversions to learn who your buyer is, so ad returns look weak here. It's learning, not failing. Meanwhile we shift budget and commission to the small group doing most of the selling."),
    ("Days 61–90", "Find the shape",
     "By now we know which creators sell, which products sell and what an ad dollar returns once the system has learned. We scale what works, cut what doesn't, and plan the next quarter from data."),
]
process_html = "\n".join(f'''        <li class="process-row">
          <span class="process-num" aria-hidden="true">{n:02d}</span>
          <div><p class="process-days">{days}</p><h3>{t}</h3><p>{d}</p></div>
        </li>''' for n, (days, t, d) in enumerate(PROCESS, 1))

WHY = [
    ("$11.8B", "US TikTok Shop GMV in the first half of 2026, up 103% year over year", "Net Influencer"),
    ("5,700+", "US shops crossed $1M in GMV in the first half of 2026", "SmartScout"),
    ("50%+", "of US shops recorded no sales at all in the same period", "SmartScout"),
    ("42%", "of US TikTok Shop GMV comes from affiliate creator content", "SmartScout"),
]
why_html = "\n".join(f'''        <div class="why-stat"><b>{n}</b><p>{t}</p><small>Source: {s}</small></div>''' for n, t, s in WHY)

faq_html = "\n".join(f'''          <details class="faq-item"{" open" if k == 0 else ""}>
            <summary>{e(q)}<span class="faq-icon" aria-hidden="true">{svg(I["plus"])}</span></summary>
            <div class="faq-answer">{a}</div>
          </details>''' for k, (q, a) in enumerate(FAQ))

blog_html = "\n".join(post_card(p, "blog/" + p["slug"] + ".html") for p in POSTS[:3])

DOCK = [("#top", "Home", "", '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
        ("#services", "Services", "", I["bag"]),
        ("#performances", "Results", "", I["play"].replace(' fill="currentColor"', "")),
        ("#work", "Case Files", "", '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
        ("#blog", "Blog", "", '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
        ("#faq", "FAQ", " dock-item--hide-sm", I["q"]),
        ("#contact", "Book a Call", " dock-item--cta", '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>')]
dock_html = "\n".join(f'  <a class="dock-item{c}" href="{h}"><span class="dock-tile">{svg(p)}</span><span class="dock-label">{l}</span></a>'
                      for h, l, c, p in DOCK)

marq = '<span class="marquee-item">' + "".join(
    f'<b>{w}</b><span class="marquee-dot">✦</span>' for w in
    ["TikTok Shop", "Affiliate Creators", "GMV Max", "TikTok LIVE", "Shoppable Video", "Shop Management"]) + '</span>'

page = head("Haul House | TikTok Shop Agency for Brands That Want to Scale", SITE_DESC, DOMAIN + "/", "",
            [WEBSITE_LD, FAQ_LD]) + header("") + f'''
<main id="main">
  <span id="top"></span>

  <section class="hero" aria-labelledby="hero-title">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <h1 id="hero-title">
          <span class="eyebrow">TikTok Shop Growth Agency</span>
          We grow brands on TikTok Shop. <span class="grad-text">That's the whole job.</span>
        </h1>
        <p class="hero-lede">Haul House builds and runs TikTok Shops. We launch your shop, recruit the affiliate creators who actually sell, and scale their best videos with GMV Max. TikTok Shop is the only channel we work in.</p>
        <div class="hero-ctas">
          <a href="#contact" class="btn btn--primary">Book a Call {svg(I["arrow"])}</a>
          <a href="#performances" class="btn btn--ghost">See the Numbers</a>
        </div>
        <ul class="hero-trust" aria-label="Highlights">
          <li>{svg(I["check"])}19.18K affiliates activated</li>
          <li>{svg(I["check"])}10.6M impressions for one brand</li>
          <li>{svg(I["check"])}TikTok Shop only</li>
        </ul>
      </div>

      <div class="hero-visual">
        <div class="phone-mock" aria-hidden="true">
          <div class="phone-glow"></div>
          <div class="phone-body">
            <div class="phone-screen">
              <div class="tt-video"><div class="tt-shimmer"></div><video class="tt-feed" muted playsinline preload="metadata" poster="assets/video/{VIDEOS[0]["id"]}.jpg"></video></div>
              <div class="tt-header"><span>Following</span><span class="tt-active">For You</span></div>
              <span class="tt-speed">2×</span>
              <div class="tt-caption">
                <p class="tt-handle">{e(vid_label(VIDEOS[0]))}</p>
                <p class="tt-text">Unbox, try, tap the bag. <span class="tt-product">{e(VIDEOS[0]["product"])}</span></p>
                <p class="tt-sound">♪ original sound · TikTok Shop</p>
              </div>
              <div class="tt-rail">
                <div class="tt-avatar"></div>
                <div class="tt-icon">{svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>', True)}<span>128K</span></div>
                <div class="tt-icon">{svg('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>', True)}<span>2,431</span></div>
                <div class="tt-icon">{svg(I["bag"])}<span>Shop</span></div>
                <div class="tt-icon spin">{svg('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/>')}</div>
              </div>
              <div class="tt-progress"><span></span></div>
            </div>
            <div class="phone-notch"></div>
            <div class="phone-home"></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      {marq}
      {marq}
    </div>
  </div>

  <section id="reel" class="reel-section" aria-labelledby="reel-title">
    <div class="wrap">
      <div class="section-head section-head--row">
        <div>
          <p class="eyebrow">Live on the Feed</p>
          <h2 id="reel-title">Videos That Move Product</h2>
          <p>Real TikTok Shop videos from our creator network, playing at 2× so you can see more of them. Tap any phone to watch one properly.</p>
        </div>
      </div>
    </div>
    <div class="reel" data-reel data-videos="{videos_json}">
      <div class="reel-track">
{chr(10).join(reel_phone(i, v, False) for i, v in enumerate(VIDEOS))}
{chr(10).join(reel_phone(i, v, True) for i, v in enumerate(VIDEOS))}
      </div>
    </div>
  </section>

  <div class="results-band" role="region" aria-label="Results from client programs">
    <div class="wrap">
      <div class="results-grid">
        <div class="result"><b>19.18K</b><span>Affiliates activated</span><small>Pete's Pasta · 6 months</small></div>
        <div class="result"><b>10.6M</b><span>Impressions</span><small>Pete's Pasta · 6 months</small></div>
        <div class="result"><b>$223.8K</b><span>Total GMV</span><small>Pure Instinct · 2025</small></div>
        <div class="result"><b>4.6/5</b><span>Shop score</span><small>Pure Instinct · 2025</small></div>
      </div>
    </div>
  </div>

  <section id="why" aria-labelledby="why-title">
    <div class="wrap why-layout">
      <div class="section-head" style="margin:0">
        <p class="eyebrow">Why TikTok Shop, Why Now</p>
        <h2 id="why-title">The Channel Works. Just Not on Its Own.</h2>
        <p>TikTok Shop is the fastest-growing commerce channel in the US, and most shops on it still sell nothing. The gap between those two numbers is operators: the right creators, the right videos and ads that have been given time to learn.</p>
      </div>
      <div class="why-grid">
{why_html}
      </div>
    </div>
  </section>

  <section id="services" class="section-alt" aria-labelledby="services-title">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">What We Run</p>
        <h2 id="services-title">One Channel. Run End to End.</h2>
        <p>Everything a brand needs to sell on TikTok Shop, run by one team on your own accounts. No side channels, no generic social packages.</p>
      </div>

      <div class="services-grid">
{services_html}
      </div>
    </div>
  </section>

  <section id="process" aria-labelledby="process-title">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">How We Work</p>
        <h2 id="process-title">Your First 90 Days</h2>
        <p>Most brands fail on TikTok Shop because they judge it at the wrong time. We commit to 90 days of real execution, with a written plan for every stage.</p>
      </div>

      <ol class="process-list">
{process_html}
      </ol>
    </div>
  </section>

{dashboard_html()}
  <section id="work" aria-labelledby="work-title">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Selected Work</p>
        <h2 id="work-title">Case Files</h2>
        <p>Two brands we've built inside TikTok Shop. The numbers come straight from their Seller Center reports.</p>
      </div>

      <div class="case-grid">
        <article class="case-card">
          <span class="case-tag">TikTok Shop · Affiliate Growth</span>
          <div>
            <p class="case-label">Case File 01</p>
            <h3>Pete's Pasta</h3>
            <p class="case-meta">Six-month TikTok Shop build-out in the food category, April–September 2025</p>
          </div>
          <dl class="case-stats">
            <div><dt>Affiliates</dt><dd>19.18K</dd></div>
            <div><dt>Impressions</dt><dd>10.6M</dd></div>
            <div><dt>Build-out</dt><dd>6 mo.</dd></div>
          </dl>
        </article>

        <article class="case-card">
          <span class="case-tag">TikTok Shop · GMV Max</span>
          <div>
            <p class="case-label">Case File 02</p>
            <h3>Pure Instinct</h3>
            <p class="case-meta">Affiliate and GMV Max growth program, 2025</p>
          </div>
          <dl class="case-stats">
            <div><dt>Total GMV</dt><dd>$223.8K</dd></div>
            <div><dt>Shop score</dt><dd>4.6/5</dd></div>
            <div><dt>Program</dt><dd>2025</dd></div>
          </dl>
        </article>
      </div>
    </div>
  </section>

  <section id="blog" class="section-alt" aria-labelledby="blog-title">
    <div class="wrap">
      <div class="section-head section-head--row">
        <div>
          <p class="eyebrow">Operator Notes</p>
          <h2 id="blog-title">Inside the Haul House</h2>
          <p>Unit economics, creator programs and launch plans for TikTok Shop. Every post has at least one number you can put in a spreadsheet.</p>
        </div>
        <a class="btn btn--ghost" href="blog/index.html">View all articles {svg(I["arrow"])}</a>
      </div>
      <ul class="blog-grid">
{blog_html}
      </ul>
    </div>
  </section>

  <section id="faq" aria-labelledby="faq-title">
    <div class="wrap faq-layout">
      <div class="section-head" style="margin:0">
        <p class="eyebrow">FAQ</p>
        <h2 id="faq-title">Questions Founders Ask Us</h2>
        <p>Ordered the way founders actually worry: will it work, what does it cost, what do I have to do. Anything else? Email <a href="mailto:{EMAIL}" style="color:var(--pink)">{EMAIL}</a>.</p>
      </div>
      <div class="faq-list">
{faq_html}
      </div>
    </div>
  </section>

  <section id="contact" aria-labelledby="contact-title">
    <div class="wrap">
      <div class="contact-shell contact-shell--solo">
        <div class="contact-left">
          <div>
            <h2 id="contact-title">Let's Build Your TikTok Shop</h2>
            <p>Tell us what you sell, your price point and your margin. On the first call we model your real TikTok Shop unit economics and tell you honestly whether the channel fits.</p>
          </div>
          <ul class="contact-promises">
            <li>{svg(I["shield"])}<span><b>You own everything.</b> Shop, ad account, creator relationships, content rights and data stay yours if you leave.</span></li>
            <li>{svg(I["x"])}<span><b>We say no.</b> Under 50% gross margin, thin inventory or a 30-day verdict means we're not the right fit yet.</span></li>
          </ul>
          <div class="contact-cta">
            <a class="btn btn--light" href="mailto:{EMAIL}?subject=Book%20a%20call%20with%20Haul%20House">Book a Call {svg(I["arrow"])}</a>
            <p>We reply within one business day.</p>
          </div>
          <ul class="contact-direct">
            <li><span class="k">Email</span><a href="mailto:{EMAIL}">{svg(I["mail"])}{EMAIL}</a></li>
            <li><span class="k">Quick questions</span><a href="tel:{PHONE}">{svg(I["phone"])}{PHONE_H}</a></li>
          </ul>
        </div>
      </div>
    </div>
  </section>

</main>

''' + footer("") + f'''
<nav class="dock" aria-label="Quick navigation">
{dock_html}
</nav>

<dialog class="vbox" aria-label="Video player">
  <div class="vbox-stage">
    <button class="vbox-nav vbox-prev" type="button" aria-label="Previous video">{svg('<path d="m15 18-6-6 6-6"/>')}</button>
    <div class="vbox-phone">
      <div class="vbox-screen">
        <video class="vbox-video" playsinline preload="none"></video>
        <button class="vbox-toggle" type="button" aria-label="Pause">{svg('<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>')}</button>
        <div class="vbox-info">
          <p class="vbox-handle"></p>
          <p class="vbox-product"></p>
          <a class="vbox-link" target="_blank" rel="noopener noreferrer">Watch on TikTok {svg(I["out"])}</a>
        </div>
        <button class="vbox-mute" type="button" aria-label="Mute" aria-pressed="false">{svg('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>')}</button>
        <div class="vbox-progress" aria-hidden="true"><span></span></div>
      </div>
    </div>
    <button class="vbox-nav vbox-next" type="button" aria-label="Next video">{svg('<path d="m9 18 6-6-6-6"/>')}</button>
    <button class="vbox-close" type="button" aria-label="Close video">{svg(I["x"])}</button>
  </div>
</dialog>

<script src="assets/main.js" defer></script>
'''

open("site/index.html", "w").write(page)
print("index ok", len(page))
