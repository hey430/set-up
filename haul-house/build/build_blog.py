import os, re
from common import *

os.makedirs("site/blog", exist_ok=True)

BODIES = {}

BODIES["tiktok-shop-fees"] = dict(
    desc="TikTok Shop fees in 2026 go far beyond the 6% referral fee. The full cost stack on a $40 product, and the gross margin you need before you launch.",
    keywords="TikTok Shop fees 2026, TikTok Shop referral fee, TikTok Shop cost, Fulfilled by TikTok fee, TikTok Shop margin",
    toc=[("five-costs", "The five costs you actually pay"), ("fulfillment", "Why cheap products die"),
         ("margin", "The 60% margin rule"), ("levers", "Where margin comes from"), ("before-launch", "Before you launch")],
    cta="Want your real number? We build your TikTok Shop unit P&L on the first call, using your price, product cost and category.",
    html='''<p class="lead"><strong>Every founder has heard the same number: TikTok Shop takes 6%.</strong> Cheaper than Amazon, cheaper than paid social, practically free. It isn't. The 6% is the cover charge. The bill arrives later.</p>

<h2 id="five-costs">The five costs you actually pay</h2>
<p>On a $40 product in your first year, this is where the money goes before you've paid for the product itself:</p>
<div class="table-wrap">
<table>
  <thead><tr><th scope="col">Cost</th><th scope="col">Typical first-year range</th><th scope="col">Why it exists</th></tr></thead>
  <tbody>
    <tr><td>Referral fee</td><td>6% (5% jewelry)</td><td>TikTok's cut of every sale</td></tr>
    <tr><td>Fulfilled by TikTok</td><td>~$3.58 per single-unit order (~9% of $40)</td><td>US sellers now ship through TikTok logistics</td></tr>
    <tr><td>Creator commission</td><td>10–20%</td><td>Creators sell, creators get paid</td></tr>
    <tr><td>GMV Max ad spend</td><td>8–20%</td><td>Paid visibility that keeps volume steady</td></tr>
    <tr><td>Returns and refunds</td><td>2–6%</td><td>Higher in fashion, lower in beauty</td></tr>
  </tbody>
</table>
</div>
<p>Add it up and a first-year brand gives away roughly <strong>38–52 cents of every dollar</strong> before product cost. In the middle case, about 53 cents survives to cover your product and your profit.</p>
<div class="stat-row">
  <div><b>6%</b><span>The fee everyone quotes</span></div>
  <div><b>38–52%</b><span>Real year-one channel cost</span></div>
  <div><b>28–35%</b><span>Well-run shops, year two</span></div>
</div>

<h2 id="fulfillment">The fulfillment fee is why cheap products die</h2>
<p>Fulfillment is a flat dollar amount, not a percentage. That's the trap. On a $40 product it's about 9% of the sale. On a $15 product it's nearly a quarter of it. Same fee, very different business.</p>
<blockquote><p>Under $25, the math almost never works unless your margin is exceptional. At $40 and up with strong margin, it's comfortable.</p></blockquote>

<h2 id="margin">The number that decides everything: 60% gross margin</h2>
<p>If your product doesn't carry about 60% gross margin before TikTok's costs, year one will probably lose money. At 50% it's tight and you need above-average creators. Below that, don't launch yet. Fix your pricing or your product cost first.</p>

<h2 id="levers">Where the margin actually comes from</h2>
<p>The referral fee and fulfillment are fixed. You can't negotiate them. Only two lines move: what you pay creators, and how hard you lean on ads.</p>
<p>Same product, same price, same volume: a brand with a tight group of proven creators and low returns keeps about <strong>35% contribution margin</strong>. A brand with no creator relationships, heavy ad dependence and high returns keeps about <strong>9%</strong>. That gap is the entire game, and it's the part an operator controls.</p>

<h2 id="before-launch">What to do before you launch</h2>
<ul>
  <li><strong>Model at 45–50% channel cost.</strong> If your P&amp;L only works at 30%, you don't have a plan yet.</li>
  <li><strong>Use your category's real return rate.</strong> Apparel returns run far higher than beauty.</li>
  <li><strong>Budget for settlement cash.</strong> New sellers often wait 30 days or more for payouts.</li>
  <li><strong>Plan the year-two number.</strong> Get to 28–35% through creator concentration, not by hoping ads get cheaper.</li>
</ul>
<p class="source-note">Cost ranges reflect published 2026 TikTok Shop fee schedules and the Eightx cost model. TikTok changes fees often; we re-check them for every client model.</p>
''')

BODIES["tiktok-shop-affiliate-strategy"] = dict(
    desc="Most TikTok Shop GMV comes from a handful of creators. A two-phase TikTok Shop affiliate strategy to find the 10 who sell and stop paying for content that doesn't.",
    keywords="TikTok Shop affiliate strategy, TikTok Shop affiliate marketing, TikTok Shop creators, TikTok Shop samples, TikTok Shop affiliate agency",
    toc=[("math", "The math nobody shows you"), ("why-fails", "Why mass sampling fails"),
         ("two-phases", "Discover, then concentrate"), ("metrics", "Four numbers per creator")],
    cta="We build your creator shortlist in the first 30 days, then put your budget behind the ones who sell.",
    html='''<p class="lead"><strong>The most expensive sentence in TikTok Shop is "let's send product to everyone and see what sticks."</strong> It feels like a strategy. It's a donation.</p>

<h2 id="math">The math nobody shows you</h2>
<p>Affiliate content drives about <strong>42% of US TikTok Shop GMV</strong>. So creators matter. But which creators matters far more than how many.</p>
<p>In most shops, 5–10 creators drive 80%+ of monthly sales. One analysis compared two sellers. The first earned about $7,552 per creator across roughly 2,900 creators. The second spread itself across 85,300 creators and earned about $773 each.</p>
<div class="stat-row">
  <div><b>$7,552</b><span>GMV per creator · 2,900 creators</span></div>
  <div><b>$773</b><span>GMV per creator · 85,300 creators</span></div>
  <div><b>5–10</b><span>Creators behind 80%+ of GMV</span></div>
</div>
<p>Nearly thirty times the creators. A tenth of the return per creator.</p>

<h2 id="why-fails">Why mass sampling fails</h2>
<ul>
  <li>Many creators take the product and never post.</li>
  <li>Most of the ones who post don't sell.</li>
  <li>Random creators say things about your product you'd never approve.</li>
  <li>Every sample costs product, packing, shipping and time.</li>
</ul>
<p>There is a real counter-argument. Some very large brands send thousands of samples a month on purpose, hunting for rare breakout creators at scale, and they can afford the waste. Most brands can't.</p>

<h2 id="two-phases">Sampling is a test, not a strategy</h2>
<h3>Phase 1 · Discover (weeks 1–6)</h3>
<p>Sample wider, but only to creators who pass a filter: their audience matches your buyer, they've sold similar products, and they post consistently. Every sample is tracked from request to video to orders.</p>
<h3>Phase 2 · Concentrate (week 7 onward)</h3>
<p>Cut the list to the creators who actually converted. Raise their commission, give them exclusive offers, send them new products first, and turn their best videos into GMV Max ads.</p>
<blockquote><p>A small roster that sells beats a big roster that posts.</p></blockquote>

<h2 id="metrics">The four numbers to track per creator</h2>
<div class="table-wrap">
<table>
  <thead><tr><th scope="col">Metric</th><th scope="col">What it tells you</th></tr></thead>
  <tbody>
    <tr><td>Post rate</td><td>Did they actually make the video?</td></tr>
    <tr><td>GMV per video</td><td>Can they sell, or only entertain?</td></tr>
    <tr><td>GMV per sample sent</td><td>Was the free product worth it?</td></tr>
    <tr><td>Repeat posting</td><td>Will they keep selling without being chased?</td></tr>
  </tbody>
</table>
</div>
<p>If you're not tracking these, you're not running a creator program. You're running a giveaway.</p>
<p class="source-note">Sources: SmartScout, TikTok Shop statistics 2026; Eightx analysis of FastMoss seller data; Flywheel on affiliate-led TikTok Shop strategy.</p>
''')

BODIES["launch-tiktok-shop"] = dict(
    desc="How to launch on TikTok Shop: what happens in your first 90 days, what to expect at each stage, and the mistake that kills most launches.",
    keywords="how to launch on TikTok Shop, TikTok Shop launch, TikTok Shop setup service, TikTok Shop first 90 days, GMV Max learning",
    toc=[("d1", "Days 1–14: Build the machine"), ("d15", "Days 15–30: First sales"),
         ("d31", "Days 31–60: The ugly middle"), ("d61", "Days 61–90: Find the shape"), ("rule", "The one rule")],
    cta="We run a fixed 90-day launch with a written plan for every stage. Book a call to see yours.",
    html='''<p class="lead"><strong>Most brands don't fail on TikTok Shop because the channel doesn't work. They fail because they judge it at the wrong time.</strong> They run ads for two weeks, see a bad return and pull the plug. That's planting a tree, checking it on day 14, and deciding trees don't grow.</p>

<h2 id="d1">Days 1–14: Build the machine</h2>
<p>Nothing sells yet, and that's fine. This is where the shop gets set up, listings are rebuilt for mobile, commission tiers are set and creator briefs are written. We line up 20–30 short videos before launch. Content made for other platforms won't work here: TikTok Shop has its own pace and its own style.</p>
<div class="callout"><p><strong>The mistake:</strong> launching ads before you have creators and content. You're paying to show people an empty store.</p></div>

<h2 id="d15">Days 15–30: First sales</h2>
<p>Creator videos start going live. The first orders come from creators, not ads, because creators don't need a learning period. Ads start small.</p>
<p><strong>What to watch:</strong> which creators posted, which videos got sales, which products moved.</p>

<h2 id="d31">Days 31–60: The ugly middle</h2>
<p>This is where most brands quit. GMV Max needs roughly <strong>50–100 conversions</strong> to learn who your buyer is. Until then, your ad return looks bad. It's learning, not failing.</p>
<p>Meanwhile the creator data gets clear. A small group is doing most of the selling, and budget and commission start moving toward them.</p>

<h2 id="d61">Days 61–90: Find the shape</h2>
<p>By now you know three things: which creators sell, which products sell, and what an ad dollar returns once the system has learned. This is when you scale what works and cut what doesn't.</p>
<div class="stat-row">
  <div><b>Wk 3–4</b><span>First creator-driven sales</span></div>
  <div><b>50–100</b><span>Conversions for GMV Max to learn</span></div>
  <div><b>60–90</b><span>Days to repeatable revenue</span></div>
</div>

<h2 id="rule">The one rule</h2>
<p>Don't judge TikTok Shop on a 30-day window. Commit to 90 days of real execution: enough content, enough creators, and enough budget for the ads to learn. Then decide with data. For most brands the first 60–90 days are an investment phase, not a profit phase. Anyone promising otherwise is guessing.</p>
<p class="source-note">GMV Max learning thresholds per Darkroom and TikTok's GMV Max guidance.</p>
''')

BODIES["choose-tiktok-shop-agency"] = dict(
    desc="How to choose a TikTok Shop agency: seven questions to ask on the sales call, and the red flags that tell you in ten minutes.",
    keywords="how to choose a TikTok Shop agency, TikTok Shop agency, TikTok Shop management services, TikTok Shop partner agency",
    toc=[("questions", "The seven questions"), ("red-flags", "Red flags in one list")],
    cta="Ask us all seven. We'll answer on the first call, with numbers.",
    html='''<p class="lead"><strong>A lot of agencies sell TikTok Shop now. Very few run it.</strong> The difference is easy to spot if you ask the right questions. A good agency answers each of these with a number or a name. A bad one answers with an adjective.</p>

<h2 id="questions">The seven questions</h2>
<h3>1. "Show me a shop you took from zero. What did month three look like?"</h3>
<p>You want a before, an after and a timeline. If they only show their best month, ask what it took to get there. Real operators are happy to show the ugly months.</p>
<h3>2. "How many creators in my category can you activate in week one?"</h3>
<p>An agency with an existing creator network saves you months. If they plan to find creators after you sign, you're paying them to learn.</p>
<h3>3. "Who will actually run my account, and how many other brands do they run?"</h3>
<p>The person on the sales call is rarely the person doing the work. Ask for the name and their client load.</p>
<h3>4. "What do I own if I leave?"</h3>
<p>The right answer is everything: shop, ad account, content rights, creator relationships and data. If they hesitate, walk.</p>
<h3>5. "What's my channel cost going to be in year one?"</h3>
<p>If they say "6%", they don't know the channel. A real operator walks you through fees, fulfillment, commissions, ads and returns, and gives you a range. (Ours is in <a href="tiktok-shop-fees.html">the real cost of TikTok Shop</a>.)</p>
<h3>6. "When will this lose money, and for how long?"</h3>
<p>An honest agency admits the first 60–90 days are an investment. An agency that promises profit in month one is either lying or planning to cut corners.</p>
<h3>7. "What will you say no to?"</h3>
<p>Good agencies turn down bad-fit brands. If they've never said no to anyone, they'll say yes to you whether it will work or not.</p>

<h2 id="red-flags">The red flags, in one list</h2>
<ul>
  <li>Case studies with no starting point or time frame</li>
  <li>Reports full of views and likes, light on GMV and margin</li>
  <li>No named person running your account</li>
  <li>Long lock-in contracts with no performance clause</li>
  <li>They can't explain GMV Max in one sentence</li>
</ul>
''')


def crumbs_ld(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [{"@type": "ListItem", "position": n, "name": nm, "item": u}
                                for n, (nm, u) in enumerate(items, 1)]}


def doc(inner_head, body):
    return ('<!doctype html>\n<html lang="en">\n<head>\n'
            + inner_head + '</head>\n<body>\n' + body + '<script src="../assets/main.js" defer></script>\n</body>\n</html>\n')


def cta_block():
    return f'''      <div class="cta-card" style="margin-top:clamp(48px,7vw,80px)">
        <div>
          <h2>Find out if TikTok Shop fits your product</h2>
          <p>On the first call we model your real unit economics and tell you honestly whether the channel works for you.</p>
        </div>
        <a class="btn" href="../index.html#contact">Book a Call {svg(I["arrow"])}</a>
      </div>
'''


for p in POSTS:
    b = BODIES[p["slug"]]
    url = f"{DOMAIN}/blog/{p['slug']}.html"
    words = len(re.sub(r"<[^>]+>", " ", b["html"]).split())
    post_ld = {"@context": "https://schema.org", "@type": "BlogPosting", "headline": p["title"],
               "description": b["desc"], "datePublished": p["date"], "dateModified": "2026-09-30",
               "mainEntityOfPage": {"@type": "WebPage", "@id": url}, "url": url,
               "image": DOMAIN + "/assets/og-image.png",
               "author": {"@type": "Organization", "name": "Haul House", "url": DOMAIN + "/"},
               "publisher": {"@id": DOMAIN + "/#organization"}, "articleSection": p["cat"],
               "keywords": b["keywords"], "wordCount": words, "inLanguage": "en-US"}
    toc = "\n".join(f'          <li><a href="#{i}">{e(t)}</a></li>' for i, t in b["toc"])
    related = "\n".join(post_card(q, q["slug"] + ".html") for q in [q for q in POSTS if q is not p][:3])
    body = header("../", "blog") + f'''
<main id="main">
  <div class="article-shell">
    <div class="wrap">
      <div class="page-hero" style="padding-bottom:0">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><a href="../index.html">Home</a></li>
            <li><a href="index.html">Blog</a></li>
            <li><span aria-current="page">{e(p["cat"])}</span></li>
          </ol>
        </nav>
        <header class="article-head">
          <p class="eyebrow">{e(p["cat"])}</p>
          <h1>{e(p["title"])}</h1>
          <ul class="article-meta">
            <li>{svg(I["cal"])}<time datetime="{p["date"]}">{fmt_date(p["date"])}</time></li>
            <li>{svg(I["clock"])}{p["mins"]} min read</li>
            <li>{svg(I["pen"])}Haul House</li>
          </ul>
        </header>
        <div class="article-cover" aria-hidden="true">{svg(I[p["icon"]])}</div>
      </div>

      <div class="article-layout">
        <article class="prose">
{b["html"]}
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
            <p>{e(b["cta"])}</p>
            <a class="btn btn--primary" href="../index.html#contact">Book a Call</a>
          </div>
        </aside>
      </div>

{cta_block()}
      <section class="related" aria-labelledby="related-title" style="padding:0">
        <h2 id="related-title">Keep reading</h2>
        <ul class="blog-grid">
{related}
        </ul>
      </section>
    </div>
  </div>
</main>

''' + footer("../")
    h = head(p["title"] + " | Haul House", b["desc"], url, "../",
             [post_ld, crumbs_ld([("Home", DOMAIN + "/"), ("Blog", DOMAIN + "/blog/"), (p["title"], url)])])
    open(f"site/blog/{p['slug']}.html", "w").write(doc(h, body))

# blog index
blog_ld = {"@context": "https://schema.org", "@type": "Blog", "name": "Haul House Blog", "url": DOMAIN + "/blog/",
           "description": "Operator notes on TikTok Shop: unit economics, affiliate creator programs, launch plans and case studies.",
           "publisher": {"@id": DOMAIN + "/#organization"},
           "blogPost": [{"@type": "BlogPosting", "headline": p["title"], "url": f"{DOMAIN}/blog/{p['slug']}.html",
                         "datePublished": p["date"]} for p in POSTS]}
cards = "\n".join(post_card(p, p["slug"] + ".html", "h2") for p in POSTS)
body = header("../", "blog") + f'''
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
      <h1>Operator Notes on <span class="grad-text">TikTok Shop</span></h1>
      <p class="lede">Unit economics, creator programs and launch plans, written for founders deciding where their next dollar goes. Every post has at least one number you can put in a spreadsheet.</p>
    </div>
  </div>
  <section style="padding-top:clamp(24px,4vw,40px)" aria-label="All articles">
    <div class="wrap">
      <ul class="blog-grid">
{cards}
      </ul>
{cta_block()}    </div>
  </section>
</main>

''' + footer("../")
h = head("TikTok Shop Blog: Operator Notes on Fees, Affiliates and Launch | Haul House",
         "Operator notes on TikTok Shop: real fees, affiliate creator strategy, 90-day launch plans and case studies from Haul House.",
         DOMAIN + "/blog/", "../", [blog_ld, crumbs_ld([("Home", DOMAIN + "/"), ("Blog", DOMAIN + "/blog/")])])
open("site/blog/index.html", "w").write(doc(h, body))
print("blog ok", sorted(os.listdir("site/blog")))
