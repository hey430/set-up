"""Shared pieces for the Haul House site build."""
import html, json

DOMAIN = "https://YOUR-DOMAIN.com"
EMAIL = "hey@socialbros.co"
PHONE = "+13074436063"
PHONE_H = "+1 (307) 443-6063"
SITE_DESC = ("Haul House is a TikTok Shop growth agency. We launch and run TikTok Shops, "
             "build affiliate creator programs and scale winning videos with GMV Max.")
KEYWORDS = ("TikTok Shop agency, TikTok Shop management services, TikTok Shop affiliate agency, "
            "TikTok Shop ads agency, GMV Max agency, TikTok Shop setup service, TikTok LIVE shopping agency, "
            "TikTok Shop agency USA, TikTok Shop affiliate marketing")


def e(s):
    return html.escape(s, quote=True)


def svg(d, fill=False):
    if fill:
        return ('<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" '
                'focusable="false">' + d + '</svg>')
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + d + '</svg>')


I = {
    "arrow": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "out": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    "check": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
    "bag": '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "clap": '<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    "target": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    "live": '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
    "chart": '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
    "trend": '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    "coins": '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
    "cal": '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "pen": '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    "shield": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    "err": '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    "menu": '<path d="M4 6h16M4 12h16M4 18h16"/>',
    "x": '<path d="M18 6 6 18M6 6l12 12"/>',
    "play": '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>',
    "q": '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
}

ORG_LD = {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "@id": DOMAIN + "/#organization",
    "name": "Haul House",
    "alternateName": "Haul House — TikTok Shop Growth Agency",
    "url": DOMAIN + "/",
    "logo": {"@type": "ImageObject", "url": DOMAIN + "/assets/logo.png", "width": 154, "height": 268},
    "image": DOMAIN + "/assets/og-image.png",
    "description": SITE_DESC,
    "email": EMAIL,
    "telephone": PHONE,
    "areaServed": {"@type": "Country", "name": "United States"},
    "knowsAbout": ["TikTok Shop", "TikTok Shop affiliate marketing", "TikTok Shop management",
                   "GMV Max", "TikTok LIVE shopping", "Creator marketing", "Shoppable video"],
    "contactPoint": {"@type": "ContactPoint", "contactType": "sales", "email": EMAIL,
                     "telephone": PHONE, "availableLanguage": ["English"]},
}

SERVICES = [
    ("bag", "Shop Launch &amp; Setup",
     "Shop build, mobile-first listings, commission tiers and 20–30 videos lined up before day one, so no ad ever points at an empty store.", 70),
    ("users", "Affiliate Creator Program",
     "We sample wide to find the 5–10 creators who drive most of your GMV, then put commission, product and paid spend behind them.", 85),
    ("clap", "Shoppable Video",
     "Creator-led videos scripted for TikTok Shop: a hook in the first frame, the product working on camera, a clear reason to tap the bag.", 65),
    ("target", "GMV Max Ads",
     "We run GMV Max on your proven creator videos and feed it the 50–100 conversions it needs to learn who your buyer is.", 75),
    ("live", "TikTok LIVE",
     "Live selling where it moves the needle: product launches, restocks and the big sale days on TikTok's calendar.", 55),
    ("chart", "Shop Management &amp; Reporting",
     "One weekly report, the same five numbers every time: GMV, contribution margin, active creators, converting videos and ad ROI.", 60),
]
ORG_LD["hasOfferCatalog"] = {
    "@type": "OfferCatalog", "name": "TikTok Shop growth services",
    "itemListElement": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": html.unescape(t), "description": d}}
                        for _, t, d, _ in SERVICES],
}

NAV = [("services", "Services"), ("process", "Process"), ("performances", "Results"),
       ("work", "Case Files"), ("blog", "Blog"), ("faq", "FAQ")]


def ld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, indent=2, ensure_ascii=False) + '\n</script>\n'


def head(title, desc, canonical, root, extra_ld=()):
    t, d = e(title), e(desc)
    out = f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{t}</title>
<meta name="description" content="{d}">
<meta name="keywords" content="{KEYWORDS}">
<meta name="author" content="Haul House">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="{canonical}">
<meta name="theme-color" content="#08060d">
<meta name="color-scheme" content="dark">
<meta property="og:site_name" content="Haul House">
<meta property="og:type" content="website">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{DOMAIN}/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Haul House — TikTok Shop Growth Agency">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="{DOMAIN}/assets/og-image.png">
<link rel="icon" href="{root}assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="{root}assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="{root}assets/styles.css">
'''
    out += ld(ORG_LD)
    for x in extra_ld:
        out += ld(x)
    return out


def header(root, current=None):
    home = root + "index.html" if root else ""
    rows = []
    for i, l in NAV:
        href = "index.html" if (root and i == "blog") else f"{home}#{i}"
        cur = ' aria-current="page"' if current == i else ""
        rows.append(f'        <li><a href="{href}"{cur}>{l}</a></li>')
    items = "\n".join(rows)
    return f'''<a class="skip-link" href="#main">Skip to content</a>

<div class="glow-field" aria-hidden="true">
  <div class="blob blob--1"></div>
  <div class="blob blob--2"></div>
  <div class="blob blob--3"></div>
</div>

<header class="site-header">
  <nav class="nav" aria-label="Primary">
    <a href="{home or '#top'}" class="brand" aria-label="Haul House — home">
      <img src="{root}assets/logo.png" alt="" width="20" height="34">
      <span class="brand-word">HAUL HOUSE</span>
    </a>
    <ul class="nav-links" id="primary-menu">
{items}
    </ul>
    <div class="nav-actions">
      <a href="{home}#contact" class="btn btn--primary">Book a Call</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-menu" aria-label="Open menu">
        {svg(I["menu"]).replace("<svg ", '<svg class="icon-open" ', 1)}{svg(I["x"]).replace("<svg ", '<svg class="icon-close" ', 1)}
      </button>
    </div>
  </nav>
</header>
'''


def footer(root):
    home = root + "index.html" if root else ""
    blog = "index.html" if root else "blog/index.html"
    return f'''<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a class="footer-brand" href="{home or '#top'}">
          <img src="{root}assets/logo.png" alt="" width="16" height="28" loading="lazy">
          <span>HAUL HOUSE</span>
        </a>
        <p class="footer-about">A TikTok Shop growth agency. We launch shops, build affiliate creator programs and scale the videos that sell. TikTok Shop is all we do.</p>
      </div>
      <div class="footer-col">
        <h2>Services</h2>
        <ul>
          <li><a href="{home}#services">Shop Launch &amp; Setup</a></li>
          <li><a href="{home}#services">Affiliate Creators</a></li>
          <li><a href="{home}#services">GMV Max Ads</a></li>
          <li><a href="{home}#services">TikTok LIVE</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2>Company</h2>
        <ul>
          <li><a href="{home}#work">Case Files</a></li>
          <li><a href="{blog}">Blog</a></li>
          <li><a href="{home}#process">The First 90 Days</a></li>
          <li><a href="{home}#faq">FAQ</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2>Contact</h2>
        <ul>
          <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
          <li><a href="tel:{PHONE}">{PHONE_H}</a></li>
          <li><a href="{home}#contact">Book a call</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-base">
      <p class="fine">© <span data-year>2026</span> Haul House. All rights reserved.</p>
      <p class="fine">TikTok Shop Growth Agency</p>
    </div>
  </div>
</footer>
'''


# ---------------- blog data ----------------
POSTS = [
    dict(slug="tiktok-shop-fees", date="2026-09-22", cat="Unit Economics", icon="coins", cover="var(--pink)", mins=5,
         title="TikTok Shop Fees 2026: The Real Cost Beyond the 6%",
         excerpt="The 6% referral fee gets you in the door. Here's the full cost stack on a $40 product, and the margin you need before you launch."),
    dict(slug="tiktok-shop-affiliate-strategy", date="2026-09-15", cat="Affiliates", icon="users", cover="var(--violet)", mins=4,
         title="TikTok Shop Affiliate Strategy: Find the 10 Creators Who Sell",
         excerpt="Most TikTok Shop GMV comes from a handful of creators. Here's how to find them fast and stop paying for content that never sells."),
    dict(slug="launch-tiktok-shop", date="2026-09-08", cat="Launch", icon="cal", cover="var(--magenta)", mins=4,
         title="How to Launch on TikTok Shop: Your First 90 Days",
         excerpt="What actually happens in your first three months on TikTok Shop, what to expect at each stage, and the mistake that kills most launches."),
    dict(slug="choose-tiktok-shop-agency", date="2026-08-28", cat="Hiring an Agency", icon="search", cover="var(--pink)", mins=3,
         title="How to Choose a TikTok Shop Agency: 7 Questions to Ask",
         excerpt="Most agencies added TikTok Shop to their menu last year. Ask these seven questions on the sales call and you'll know in ten minutes."),
]


def fmt_date(d):
    import datetime
    x = datetime.date.fromisoformat(d)
    return x.strftime("%b ") + str(x.day) + x.strftime(", %Y")


def post_card(p, href, h="h3"):
    return f'''      <li>
        <article class="post-card">
          <div class="post-cover" style="--cover:{p["cover"]}" aria-hidden="true">
            <span class="post-cat">{e(p["cat"])}</span>
            {svg(I[p["icon"]])}
          </div>
          <div class="post-body">
            <p class="post-meta"><time datetime="{p["date"]}">{fmt_date(p["date"])}</time> · {p["mins"]} min read</p>
            <{h}><a href="{href}">{e(p["title"])}</a></{h}>
            <p class="post-excerpt">{e(p["excerpt"])}</p>
            <span class="post-more" aria-hidden="true">Read article {svg(I["arrow"])}</span>
          </div>
        </article>
      </li>'''
