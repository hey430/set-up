#!/usr/bin/env python3
"""Build the Haul House static site into ../site.

Usage:  python3 site-src/build.py

- Edit SITE_URL below once you know your live domain, then re-run.
- Add a blog post by dropping an .html file in site-src/posts/ with a
  <!--meta { ... } --> JSON header (copy an existing post), then re-run.
  The blog index, home-page blog cards, sitemap and structured data update automatically.
"""
import html
import json
import re
from pathlib import Path

# ────────────────────────────────────────────────────────────────────────────
SITE_URL = "https://YOUR-DOMAIN.com"   # ← replace with your live domain (no trailing slash)
# ────────────────────────────────────────────────────────────────────────────

BRAND = "Haul House"
EMAIL = "hey@socialbros.co"
PHONE_DISPLAY = "+1 (307) 443-6063"
PHONE_E164 = "+13074436063"
TAGLINE = "UGC & TikTok Shop Growth Agency"
DEFAULT_DESC = ("Haul House is a UGC and TikTok Shop growth agency. We recruit high-converting "
                "affiliate creators and produce UGC ads for TikTok, Meta and Instagram that turn views into sales.")
KEYWORDS = ("UGC agency, TikTok Shop agency, TikTok Shop affiliate marketing, UGC ads, user-generated content, "
            "TikTok ads agency, TikTok Shop growth, affiliate creators, Meta ads creative, Instagram Reels ads, "
            "creator marketing, short-form video ads")

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / "site"

# Lucide-style stroke icons (24×24)
ICONS = {
    "clapperboard": '<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    "smartphone": '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    "target": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    "sparkles": '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3v4"/><path d="M3 5h4"/>',
    "shopping-bag": '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    "lightbulb": '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    "heart": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    "message": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    "share": '<path d="m15 17 5-5-5-5"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/>',
    "disc": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/>',
    "play": '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    "menu": '<path d="M4 6h16M4 12h16M4 18h16"/>',
    "x": '<path d="M18 6 6 18M6 6l12 12"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    "check": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
    "alert": '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    "calendar": '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "trending-up": '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    "zap": '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    "pen": '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
}


def icon(name, cls="", fill=False):
    attrs = 'fill="currentColor" stroke="none"' if fill else 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'
    c = f' class="{cls}"' if cls else ""
    return f'<svg{c} viewBox="0 0 24 24" {attrs} aria-hidden="true" focusable="false">{ICONS[name]}</svg>'


def esc(s):
    return html.escape(s, quote=True)


def jsonld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, indent=2, ensure_ascii=False).replace("</", "<\\/") + "\n</script>"


def org_ref():
    return {"@id": f"{SITE_URL}/#organization"}


def organization():
    return {
        "@context": "https://schema.org",
        "@type": ["Organization", "ProfessionalService"],
        "@id": f"{SITE_URL}/#organization",
        "name": BRAND,
        "alternateName": f"{BRAND} — {TAGLINE}",
        "url": f"{SITE_URL}/",
        "logo": {"@type": "ImageObject", "url": f"{SITE_URL}/assets/logo.png", "width": 154, "height": 268},
        "image": f"{SITE_URL}/assets/og-image.png",
        "description": DEFAULT_DESC,
        "email": EMAIL,
        "telephone": PHONE_E164,
        "areaServed": {"@type": "Country", "name": "United States"},
        "knowsAbout": ["User-generated content", "UGC ads", "TikTok Shop", "TikTok Shop affiliate marketing",
                       "TikTok ads", "Meta ads", "Instagram Reels", "Creator marketing", "Short-form video"],
        "contactPoint": {"@type": "ContactPoint", "contactType": "sales", "email": EMAIL,
                         "telephone": PHONE_E164, "availableLanguage": ["English"]},
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "UGC & TikTok Shop growth services",
            "itemListElement": [
                {"@type": "Offer", "itemOffered": {"@type": "Service", "name": n, "description": d}}
                for n, d in [
                    ("UGC Ads", "Authentic, creator-led video ads that read as genuine recommendations."),
                    ("TikTok Ads", "Native, sound-on TikTok creative optimised for watch time and conversion."),
                    ("Meta & Facebook Ads", "Direct-response video creative for the Meta ad stack."),
                    ("Instagram Reels", "Polished, aspirational Reels built for the feed."),
                    ("TikTok Shop & Affiliate Growth", "Recruiting and briefing high-converting TikTok Shop affiliates."),
                    ("Creative Strategy & Scripting", "Data-informed hooks, angles and shot lists."),
                ]
            ],
        },
    }


def head(*, title, desc, path, og_type="website", extra_ld=(), prefix="", published=None, modified=None, section=None):
    url = f"{SITE_URL}{path}"
    article_meta = ""
    if og_type == "article":
        article_meta = (f'\n<meta property="article:published_time" content="{published}">'
                        f'\n<meta property="article:modified_time" content="{modified or published}">'
                        f'\n<meta property="article:section" content="{esc(section)}">'
                        f'\n<meta property="article:author" content="{BRAND}">')
    ld = "\n".join(jsonld(o) for o in extra_ld)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="keywords" content="{esc(KEYWORDS)}">
<meta name="author" content="{BRAND}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#08060d">
<meta name="color-scheme" content="dark">

<!-- Open Graph / social sharing -->
<meta property="og:site_name" content="{BRAND}">
<meta property="og:type" content="{og_type}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE_URL}/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{BRAND} — {TAGLINE}">
<meta property="og:locale" content="en_US">{article_meta}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{SITE_URL}/assets/og-image.png">

<link rel="icon" href="{prefix}assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="{prefix}assets/apple-touch-icon.png">
<link rel="manifest" href="{prefix}site.webmanifest">
<link rel="alternate" type="application/rss+xml" title="{BRAND} Blog" href="{SITE_URL}/blog/feed.xml">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="{prefix}assets/styles.css">
{ld}
</head>'''


def header(*, prefix, home, current=None):
    """home: '' on the home page (links are #anchors), '../index.html' elsewhere."""
    h = home
    items = [("Services", f"{h}#services"), ("Process", f"{h}#process"), ("Results", f"{h}#performances"),
             ("Case Files", f"{h}#work"), ("Blog", f"{prefix}blog/index.html" if prefix else "blog/index.html"),
             ("FAQ", f"{h}#faq")]
    if not prefix:  # home page: blog link is an anchor to the section
        items[4] = ("Blog", "#blog")
    cur = ' aria-current="page"'
    lis = "\n".join(
        f'        <li><a href="{href}"{cur if current == label else ""}>{label}</a></li>'
        for label, href in items)
    return f'''<body>
<a class="skip-link" href="#main">Skip to content</a>

<div class="glow-field" aria-hidden="true">
  <div class="blob blob--1"></div>
  <div class="blob blob--2"></div>
  <div class="blob blob--3"></div>
</div>

<header class="site-header">
  <nav class="nav" aria-label="Primary">
    <a href="{h or '#top'}" class="brand" aria-label="{BRAND} — home">
      <img src="{prefix}assets/logo.png" alt="" width="20" height="34">
      <span class="brand-word">HAUL HOUSE</span>
    </a>
    <ul class="nav-links" id="primary-menu">
{lis}
    </ul>
    <div class="nav-actions">
      <a href="{h}#contact" class="btn btn--primary">Start a Project</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-menu" aria-label="Open menu">
        {icon("menu", "icon-open")}{icon("x", "icon-close")}
      </button>
    </div>
  </nav>
</header>
'''


def footer(*, prefix, home):
    h = home
    blog = f"{prefix}blog/index.html"
    return f'''
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a class="footer-brand" href="{h or '#top'}">
          <img src="{prefix}assets/logo.png" alt="" width="16" height="28" loading="lazy">
          <span>HAUL HOUSE</span>
        </a>
        <p class="footer-about">A UGC and TikTok Shop growth agency. We pair brands with affiliate creators and produce short-form video that sells.</p>
      </div>
      <div class="footer-col">
        <h2>Services</h2>
        <ul>
          <li><a href="{h}#services">UGC Ads</a></li>
          <li><a href="{h}#services">TikTok Shop Growth</a></li>
          <li><a href="{h}#services">TikTok &amp; Meta Ads</a></li>
          <li><a href="{h}#services">Creative Strategy</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2>Company</h2>
        <ul>
          <li><a href="{h}#work">Case Files</a></li>
          <li><a href="{blog}">Blog</a></li>
          <li><a href="{h}#process">How We Work</a></li>
          <li><a href="{h}#faq">FAQ</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2>Contact</h2>
        <ul>
          <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
          <li><a href="tel:{PHONE_E164}">{PHONE_DISPLAY}</a></li>
          <li><a href="{h}#contact">Start a project</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-base">
      <p class="fine">© <span data-year>2026</span> {BRAND}. All rights reserved.</p>
      <p class="fine">{TAGLINE}</p>
    </div>
  </div>
</footer>

<script src="{prefix}assets/main.js" defer></script>
</body>
</html>
'''


# ─── posts ──────────────────────────────────────────────────────────────────
def load_posts():
    posts = []
    for f in sorted((ROOT / "posts").glob("*.html")):
        raw = f.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->\s*", raw, re.S)
        if not m:
            raise SystemExit(f"{f.name}: missing <!--meta {{...}} --> header")
        meta = json.loads(m.group(1))
        meta["body"] = raw[m.end():]
        meta["slug"] = f.stem
        words = len(re.sub(r"<[^>]+>", " ", meta["body"]).split())
        meta["words"] = words
        meta["minutes"] = max(1, round(words / 225))
        meta["toc"] = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', meta["body"])
        posts.append(meta)
    posts.sort(key=lambda p: p["date"], reverse=True)
    return posts


def human_date(iso):
    import datetime
    d = datetime.date.fromisoformat(iso)
    return d.strftime("%b %-d, %Y")


def post_card(p, prefix, heading="h3"):
    return f'''      <li>
        <article class="post-card">
          <div class="post-cover" style="--cover:var(--{p.get("accent", "pink")})" aria-hidden="true">
            <span class="post-cat">{esc(p["category"])}</span>
            {icon(p["icon"])}
          </div>
          <div class="post-body">
            <p class="post-meta"><time datetime="{p["date"]}">{human_date(p["date"])}</time> · {p["minutes"]} min read</p>
            <{heading}><a href="{prefix}{p["slug"]}.html">{esc(p["title"])}</a></{heading}>
            <p class="post-excerpt">{esc(p["excerpt"])}</p>
            <span class="post-more" aria-hidden="true">Read article {icon("arrow-right")}</span>
          </div>
        </article>
      </li>'''


def build_post(p, posts):
    path = f"/blog/{p['slug']}.html"
    url = f"{SITE_URL}{path}"
    ld = [
        organization(),
        {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": p["title"],
            "description": p["description"],
            "datePublished": p["date"],
            "dateModified": p.get("updated", p["date"]),
            "mainEntityOfPage": {"@type": "WebPage", "@id": url},
            "url": url,
            "image": f"{SITE_URL}/assets/og-image.png",
            "author": {"@type": "Organization", "name": f"{BRAND} Team", "url": f"{SITE_URL}/"},
            "publisher": org_ref(),
            "articleSection": p["category"],
            "keywords": p["keywords"],
            "wordCount": p["words"],
            "inLanguage": "en-US",
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE_URL}/"},
                {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{SITE_URL}/blog/"},
                {"@type": "ListItem", "position": 3, "name": p["title"], "item": url},
            ],
        },
    ]
    toc = "\n".join(f'          <li><a href="#{i}">{t}</a></li>' for i, t in p["toc"])
    related = [q for q in posts if q["slug"] != p["slug"]][:3]
    rel = "\n".join(post_card(q, "", heading="h3") for q in related)
    out = head(title=f'{p["title"]} | {BRAND}', desc=p["description"], path=path, og_type="article",
               extra_ld=ld, prefix="../", published=p["date"], modified=p.get("updated"), section=p["category"])
    out += header(prefix="../", home="../index.html", current="Blog")
    out += f'''
<main id="main">
  <div class="article-shell">
    <div class="wrap">
      <div class="page-hero" style="padding-bottom:0">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><a href="../index.html">Home</a></li>
            <li><a href="index.html">Blog</a></li>
            <li><span aria-current="page">{esc(p["category"])}</span></li>
          </ol>
        </nav>
        <header class="article-head">
          <p class="eyebrow">{esc(p["category"])}</p>
          <h1>{esc(p["title"])}</h1>
          <ul class="article-meta">
            <li>{icon("calendar")}<time datetime="{p["date"]}">{human_date(p["date"])}</time></li>
            <li>{icon("clock")}{p["minutes"]} min read</li>
            <li>{icon("pen")}{BRAND} Team</li>
          </ul>
        </header>
        <div class="article-cover" aria-hidden="true">{icon(p["icon"])}</div>
      </div>

      <div class="article-layout">
        <article class="prose">
{p["body"].strip()}
        </article>

        <aside class="article-aside" aria-label="Article tools">
          <nav class="aside-card" aria-label="On this page">
            <h2>On this page</h2>
            <ol class="toc">
{toc}
            </ol>
          </nav>
          <div class="aside-card aside-cta">
            <h2>Work with us</h2>
            <p>Want this running for your brand? Tell us what you sell and we'll map out the first campaign.</p>
            <a class="btn btn--primary" href="../index.html#contact">Start a Project</a>
          </div>
        </aside>
      </div>

      <div class="cta-card" style="margin-top:clamp(48px,7vw,80px)">
        <div>
          <h2>Turn views into verified sales</h2>
          <p>Haul House pairs your products with affiliate creators and produces the UGC that makes them sell.</p>
        </div>
        <a class="btn" href="../index.html#contact">Start a Project {icon("arrow-right")}</a>
      </div>

      <section class="related" aria-labelledby="related-title" style="padding:0">
        <h2 id="related-title">Keep reading</h2>
        <ul class="blog-grid">
{rel}
        </ul>
      </section>
    </div>
  </div>
</main>
'''
    out += footer(prefix="../", home="../index.html")
    (OUT / "blog" / f"{p['slug']}.html").write_text(out, encoding="utf-8")


def build_blog_index(posts):
    path = "/blog/"
    title = f"Blog — UGC, TikTok Shop & Creator Marketing Insights | {BRAND}"
    desc = ("Practical guides on UGC ads, TikTok Shop affiliate growth, hooks and creative strategy — "
            f"plus case studies from the {BRAND} team.")
    ld = [
        organization(),
        {
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": f"{BRAND} Blog",
            "url": f"{SITE_URL}/blog/",
            "description": desc,
            "publisher": org_ref(),
            "blogPost": [{"@type": "BlogPosting", "headline": p["title"], "url": f"{SITE_URL}/blog/{p['slug']}.html",
                          "datePublished": p["date"]} for p in posts],
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE_URL}/"},
                {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{SITE_URL}/blog/"},
            ],
        },
    ]
    cards = "\n".join(post_card(p, "", heading="h2") for p in posts)
    out = head(title=title, desc=desc, path=path, extra_ld=ld, prefix="../")
    out += header(prefix="../", home="../index.html", current="Blog")
    out += f'''
<main id="main">
  <div class="page-hero">
    <div class="wrap">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li><a href="../index.html">Home</a></li>
          <li><span aria-current="page">Blog</span></li>
        </ol>
      </nav>
      <p class="eyebrow">The Haul House Blog</p>
      <h1>Notes From the <span class="grad-text">Studio Floor</span></h1>
      <p class="lede">How we think about UGC, TikTok Shop affiliates, hooks and creative strategy — written for brands that want short-form video to show up in the sales report.</p>
    </div>
  </div>
  <section style="padding-top:clamp(24px,4vw,40px)" aria-label="All articles">
    <div class="wrap">
      <ul class="blog-grid">
{cards}
      </ul>
    </div>
  </section>
</main>
'''
    out += footer(prefix="../", home="../index.html")
    (OUT / "blog" / "index.html").write_text(out, encoding="utf-8")


def build_home(posts):
    tpl = (ROOT / "index.template.html").read_text(encoding="utf-8")
    faq = json.loads((ROOT / "faq.json").read_text(encoding="utf-8"))

    faq_html = "\n".join(f'''          <details class="faq-item"{" open" if i == 0 else ""}>
            <summary>{esc(q["q"])}<span class="faq-icon" aria-hidden="true">{icon("plus")}</span></summary>
            <div class="faq-answer">{q["a"]}</div>
          </details>''' for i, q in enumerate(faq))

    ld = [
        organization(),
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": f"{SITE_URL}/#website",
            "name": BRAND,
            "url": f"{SITE_URL}/",
            "description": DEFAULT_DESC,
            "publisher": org_ref(),
            "inLanguage": "en-US",
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": q["q"],
                            "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", q["a"]).strip()}}
                           for q in faq],
        },
    ]
    out = head(title=f"{BRAND} | {TAGLINE} for TikTok, Meta & Instagram",
               desc=DEFAULT_DESC, path="/", extra_ld=ld, prefix="")
    out += header(prefix="", home="")
    body = tpl
    body = body.replace("{{BLOG_CARDS}}", "\n".join(post_card(p, "blog/") for p in posts[:3]))
    body = body.replace("{{FAQ}}", faq_html)
    body = body.replace("{{EMAIL}}", EMAIL).replace("{{PHONE_DISPLAY}}", PHONE_DISPLAY).replace("{{PHONE_E164}}", PHONE_E164)
    body = re.sub(r"\{\{icon:([a-z-]+)(?::fill)?\}\}",
                  lambda m: icon(m.group(1), fill=m.group(0).endswith(":fill}}")), body)
    out += body
    out += footer(prefix="", home="")
    (OUT / "index.html").write_text(out, encoding="utf-8")


def build_meta_files(posts):
    import datetime
    today = datetime.date.today().isoformat()
    urls = [(f"{SITE_URL}/", today, "weekly", "1.0"), (f"{SITE_URL}/blog/", posts[0]["date"], "weekly", "0.8")]
    urls += [(f"{SITE_URL}/blog/{p['slug']}.html", p.get("updated", p["date"]), "monthly", "0.7") for p in posts]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, mod, freq, pri in urls:
        sm.append(f"  <url><loc>{loc}</loc><lastmod>{mod}</lastmod><changefreq>{freq}</changefreq><priority>{pri}</priority></url>")
    sm.append("</urlset>")
    (OUT / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8")

    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n", encoding="utf-8")

    items = "\n".join(f'''    <item>
      <title>{esc(p["title"])}</title>
      <link>{SITE_URL}/blog/{p["slug"]}.html</link>
      <guid>{SITE_URL}/blog/{p["slug"]}.html</guid>
      <pubDate>{datetime.date.fromisoformat(p["date"]).strftime("%a, %d %b %Y")} 09:00:00 +0000</pubDate>
      <description>{esc(p["excerpt"])}</description>
    </item>''' for p in posts)
    (OUT / "blog" / "feed.xml").write_text(f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>{BRAND} Blog</title>
    <link>{SITE_URL}/blog/</link>
    <description>UGC, TikTok Shop and creator-marketing insights from {BRAND}.</description>
    <language>en-us</language>
{items}
  </channel>
</rss>
''', encoding="utf-8")

    (OUT / "site.webmanifest").write_text(json.dumps({
        "name": f"{BRAND} — {TAGLINE}", "short_name": BRAND, "start_url": "/", "display": "standalone",
        "background_color": "#08060d", "theme_color": "#08060d",
        "icons": [{"src": "/assets/apple-touch-icon.png", "sizes": "180x180", "type": "image/png"},
                  {"src": "/assets/icon-512.png", "sizes": "512x512", "type": "image/png"}],
    }, indent=2) + "\n", encoding="utf-8")


def main():
    (OUT / "blog").mkdir(parents=True, exist_ok=True)
    posts = load_posts()
    for p in posts:
        build_post(p, posts)
    build_blog_index(posts)
    build_home(posts)
    build_meta_files(posts)
    print(f"Built home + blog index + {len(posts)} posts → {OUT}  (SITE_URL={SITE_URL})")


if __name__ == "__main__":
    main()
