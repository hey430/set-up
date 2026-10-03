"""Results dashboard: totals, growth and challenge charts, one card per shop."""
from common import e

BRANDS = [
    dict(n="01", cat="Hearing health · US", name="Audien", note="Run brand-side by our partner",
         desc="As Head of TikTok Shop, our partner scaled Audien's affiliate program past 2,000 creators and took the product to a #1 Best Seller spot. That playbook sits behind how we run every client account.",
         hero=("$1.5M", "GMV in 6 weeks", 1.5, 1, "$", "M"),
         stats=[("15.6K", "orders"), ("2,000+", "affiliates"), ("#1", "Best Seller")],
         viz=("rank", 1)),
    dict(n="02", cat="Beauty · UK", name="Cosmetics brand", note="Launched from zero",
         desc="We brought 2,000 creators on board in the first 15 days and approved every sample by hand. Our best performers went onto retainers. Then we ran an 11-day Black Friday challenge that brought in £74K by itself.",
         hero=("£188K", "GMV in first 60 days", 188, 0, "£", "K"),
         stats=[("2,000", "creators in 15 days"), ("862", "challenge videos"), ("£74K", "Black Friday challenge")],
         viz=("lift", 75)),
    dict(n="03", cat="Food · US", name="Pete's Pasta", note="Affiliates plus paid",
         desc="We ran Manual and GMV Max campaigns side by side. We tested creatives in a set structure and only put more budget behind what had already sold.",
         hero=("$468K+", "revenue", 468, 0, "$", "K+"),
         stats=[("13,081", "orders"), ("$8.73", "cost per order"), ("$114K", "ad spend")],
         viz=("roi", 3.41)),
    dict(n="04", cat="US", name="Pure Instinct", note="Affiliates plus GMV Max",
         desc="We ran an affiliate program and paid growth together, and kept shop health strong the whole time we scaled.",
         hero=("$223.8K", "total GMV", 223.8, 1, "$", "K"),
         stats=[("4.6/5", "shop score")],
         viz=("gauge", 4.6)),
]
USD_SALES = [("Audien", 1500000), ("Pete's Pasta", 468000), ("Pure Instinct", 223800)]
USD_TOTAL = sum(v for _, v in USD_SALES)
ORDERS_TOTAL = 15600 + 13081
CREATORS = [("Pete's Pasta", 19180, "var(--magenta)", "19,180"),
            ("Audien", 2000, "var(--violet)", "2,000+"),
            ("Cosmetics brand", 2000, "var(--pink)", "2,000")]
UK_MONTHS = [("Sep", 496, "£496"), ("Oct", 62000, "£62K"), ("Nov", 126000, "£126K"),
             ("Dec", 168000, "£168K"), ("Jan", 187599, "£188K")]
ROI = [("Creator challenge", 3.6, True), ("With TikTok co-funding", 4.3, True), ("Paid ads, same 11 days", 1.91, False)]


def count(text, to, dec, pre, suf):
    return f'<span class="count" data-to="{to}" data-dec="{dec}" data-pre="{pre}" data-suf="{suf}">{text}</span>'


def money(v):
    if v >= 1e6:
        return "$" + f"{v / 1e6:.2f}".rstrip("0").rstrip(".") + "M"
    return f"${v / 1e3:.0f}K" if v % 1000 == 0 else f"${v / 1e3:.1f}K"


def _bars():
    top = USD_SALES[0][1]
    return "\n".join(f'''            <li class="dash-bar{' is-top' if k == 0 else ''}" style="--h:{v / top * 100:.1f}%;--i:{k}">
              <span class="dash-bar-val">{money(v)}</span>
              <span class="dash-bar-col"></span>
              <span class="dash-bar-name">{e(nm)}</span>
            </li>''' for k, (nm, v) in enumerate(USD_SALES))


def _growth_chart():
    # 600x220 plot; x evenly spaced, y scaled to the January peak
    W, H, pad_t, pad_b = 600, 220, 34, 26
    top = UK_MONTHS[-1][1]
    pts = []
    for k, (_, v, _) in enumerate(UK_MONTHS):
        x = 24 + k * (W - 48) / (len(UK_MONTHS) - 1)
        y = pad_t + (H - pad_t - pad_b) * (1 - v / top)
        pts.append((x, y))
    line = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    base = H - pad_b
    area = line + f" L{pts[-1][0]:.1f} {base} L{pts[0][0]:.1f} {base} Z"
    grid = "".join(f'<line x1="0" x2="{W}" y1="{pad_t + (base - pad_t) * f:.1f}" y2="{pad_t + (base - pad_t) * f:.1f}"/>' for f in (0, 0.5, 1))
    dots, labels, months = [], [], []
    for k, ((x, y), (m, _, lab)) in enumerate(zip(pts, UK_MONTHS)):
        last = k == len(pts) - 1
        dots.append(f'<circle class="dash-dot{" is-last" if last else ""}" cx="{x:.1f}" cy="{y:.1f}" r="{5 if last else 3.5}" style="--k:{k}"/>')
        labels.append(f'<text class="dash-pt{" is-last" if last else ""}" x="{x:.1f}" y="{y - 12:.1f}" style="--k:{k}">{lab}</text>')
        months.append(f'<text class="dash-month" x="{x:.1f}" y="{H - 6}">{m}</text>')
    return f'''<svg class="dash-line" viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label="UK beauty brand monthly GMV: £496 in September, £62K October, £126K November, £168K December, £187,599 in January">
              <defs><linearGradient id="dash-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff3d74" stop-opacity="0.45"/><stop offset="1" stop-color="#8347ea" stop-opacity="0"/></linearGradient>
              <linearGradient id="dash-stroke" x1="0" x2="1"><stop offset="0" stop-color="#8347ea"/><stop offset="0.6" stop-color="#c33ac9"/><stop offset="1" stop-color="#ff3d74"/></linearGradient></defs>
              <g class="dash-grid">{grid}</g>
              <path class="dash-area" d="{area}" fill="url(#dash-area)"/>
              <path class="dash-path" d="{line}" pathLength="100" stroke="url(#dash-stroke)"/>
              {"".join(dots)}{"".join(labels)}{"".join(months)}
            </svg>'''


def _roi_rows():
    top = max(v for _, v, _ in ROI)
    return "\n".join(f'''            <li style="--i:{k}"><span class="dash-roi-name">{e(nm)}</span>
              <span class="dash-track{'' if hot else ' dash-track--dim'}"><span style="--w:{v / top * 100:.1f}%"></span></span>
              <b>{v:g}x</b></li>''' for k, (nm, v, hot) in enumerate(ROI))


def _donut():
    total = sum(c[1] for c in CREATORS)
    offset, segs, legend = 0.0, [], []
    for nm, v, col, label in CREATORS:
        pct = v / total * 100
        segs.append(f'<circle class="dash-seg" r="15.915" cx="21" cy="21" pathLength="100" '
                    f'style="--p:{pct:.2f};--o:{-offset:.2f};stroke:{col}"/>')
        legend.append(f'<li><i style="background:{col}"></i><span>{e(nm)}</span><b>{label}</b></li>')
        offset += pct
    return "".join(segs), "".join(legend), total


def _viz(b):
    kind, val = b["viz"]
    if kind == "rank":
        return '''<div class="dash-viz dash-viz--rank"><span class="dash-rank">#1</span><div><b>Best Seller</b><span>reached in 6 weeks</span></div></div>'''
    if kind == "share":
        pct = val / USD_TOTAL * 100
        return f'''<div class="dash-viz"><div class="dash-viz-head"><span>Share of US sales</span><b>{pct:.0f}%</b></div>
            <div class="dash-track"><span style="--w:{pct:.1f}%"></span></div></div>'''
    if kind == "lift":
        base = 100 / (100 + val) * 100
        return f'''<div class="dash-viz"><div class="dash-viz-head"><span>Daily GMV in challenge</span><b>+{val}%</b></div>
            <div class="dash-lift"><span class="dash-lift-row"><em>Before</em><span class="dash-track dash-track--dim"><span style="--w:{base:.1f}%"></span></span></span><span class="dash-lift-row"><em>During</em><span class="dash-track"><span style="--w:100%"></span></span></span></div></div>'''
    if kind == "roi":
        return f'''<div class="dash-viz"><div class="dash-viz-head"><span>ROI on $114K spend</span><b>{val}x</b></div>
            <div class="dash-lift"><span class="dash-lift-row"><em>Spend</em><span class="dash-track dash-track--dim"><span style="--w:{100 / val:.1f}%"></span></span></span><span class="dash-lift-row"><em>Return</em><span class="dash-track"><span style="--w:100%"></span></span></span></div></div>'''
    pct = val / 5 * 100
    return f'''<div class="dash-viz dash-viz--gauge"><svg viewBox="0 0 100 56" aria-hidden="true"><path class="dash-gauge-bg" d="M8 50a42 42 0 0 1 84 0" pathLength="100"/><path class="dash-gauge" d="M8 50a42 42 0 0 1 84 0" pathLength="100" style="--p:{pct:.0f}"/></svg>
            <div class="dash-gauge-val"><b>{val}</b><span>/ 5 shop score</span></div></div>'''


def _card(k, b):
    h = b["hero"]
    stats = "\n".join(f'            <div><dt>{e(l)}</dt><dd>{e(v)}</dd></div>' for v, l in b["stats"])
    return f'''        <article class="dash-card dash-brand" style="--i:{k + 4}">
          <p class="dash-cat">{b["n"]} · {e(b["cat"])}</p>
          <h3>{e(b["name"])}</h3>
          <p class="dash-note">{e(b["note"])}</p>
          <p class="dash-hero">{count(h[0], h[2], h[3], h[4], h[5])}<span>{e(h[1])}</span></p>
          {_viz(b)}
          <p class="dash-desc">{e(b["desc"])}</p>
          <dl class="dash-stats">
{stats}
          </dl>
        </article>'''


def dashboard_html():
    segs, legend, creator_total = _donut()
    cards = "\n".join(_card(k, b) for k, b in enumerate(BRANDS))
    return f'''  <section id="performances" class="section-alt dash-section" aria-labelledby="perf-title">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Proof, Not Promises</p>
        <h2 id="perf-title">Four Shops, in Their Own Numbers</h2>
        <p>Taken from Seller Center and ads dashboards. Where a client asked us not to use their name, we've listed the category instead.</p>
      </div>

      <div class="dash" data-dash>
        <article class="dash-card dash-total" style="--i:0">
          <div class="dash-total-head">
            <div>
              <p class="dash-label"><span class="dash-live"></span>Revenue by shop</p>
              <h3 class="dash-card-title">Each brand, in its own numbers.</h3>
            </div>
            <span class="dash-chip">UK · Cosmetics brand · £188K in 60 days</span>
          </div>
          <ol class="dash-bars" aria-label="Revenue by US shop in US dollars">
{_bars()}
          </ol>
        </article>

        <article class="dash-card dash-creators" style="--i:1">
          <p class="dash-label">Creators &amp; affiliates by shop</p>
          <div class="dash-donut-wrap">
            <svg class="dash-donut" viewBox="0 0 42 42" aria-hidden="true">
              <circle class="dash-donut-bg" r="15.915" cx="21" cy="21"/>
              {segs}
            </svg>
            <div class="dash-donut-center"><span class="dash-donut-big">3</span><span>shops</span></div>
          </div>
          <ul class="dash-legend">{legend}</ul>
        </article>

        <article class="dash-card dash-growth" style="--i:2">
          <div class="dash-total-head">
            <div>
              <p class="dash-label">UK beauty brand · monthly GMV</p>
              <p class="dash-mid">£496 <span class="dash-arrow">→</span> {count("£187,599", 187599, 0, "£", "")}</p>
            </div>
            <span class="dash-chip">TikTok Shop</span>
          </div>
          {_growth_chart()}
          <p class="dash-foot">We started on 24 September with an empty shop. GMV grew every month after that.</p>
        </article>

        <article class="dash-card dash-challenge" style="--i:3">
          <p class="dash-label">Black Friday 2025 · 11 days</p>
          <h3 class="dash-card-title">161 creators competed for 11 days. It beat the ads.</h3>
          <ol class="dash-roi">
{_roi_rows()}
          </ol>
          <dl class="dash-stats">
            <div><dt>GMV</dt><dd>£74K</dd></div>
            <div><dt>videos</dt><dd>862</dd></div>
            <div><dt>content volume</dt><dd>+71%</dd></div>
          </dl>
          <p class="dash-foot">766 creators signed up and 161 posted. Creator videos drove 80% of GMV that week. For every pound paid to creators, the brand made £3.60 back.</p>
        </article>

{cards}
      </div>
    </div>
  </section>
'''
