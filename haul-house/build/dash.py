"""Results dashboard: one card per shop plus animated totals."""
from common import e

BRANDS = [
    dict(n="01", cat="Hearing health · US", name="Audien", note="Run brand-side by our partner",
         hero=("$1.5M", "GMV in 6 weeks", 1.5, 1, "$", "M"),
         stats=[("15.6K", "orders"), ("2,000+", "affiliates"), ("#1", "Best Seller")],
         viz=("share", 1500000)),
    dict(n="02", cat="Beauty · UK", name="Cosmetics brand", note="Launched from zero",
         hero=("£188K", "GMV in first 60 days", 188, 0, "£", "K"),
         stats=[("2,000", "creators in 15 days"), ("862", "challenge videos"), ("£74K", "Black Friday challenge")],
         viz=("lift", 75)),
    dict(n="03", cat="Food · US", name="Pete's Pasta", note="Affiliate-led build-out",
         hero=("$468K+", "GMV", 468, 0, "$", "K+"),
         stats=[("19.18K", "affiliates"), ("10.6M", "impressions"), ("6 mo.", "build-out")],
         viz=("share", 468000)),
    dict(n="04", cat="Wellness · US", name="Pure Instinct", note="Affiliates + GMV Max",
         hero=("$223.8K", "total GMV", 223.8, 1, "$", "K"),
         stats=[("4.6/5", "shop score"), ("2025", "program")],
         viz=("gauge", 4.6)),
]
USD_GMV = [("Audien", 1500000), ("Pete's Pasta", 468000), ("Pure Instinct", 223800)]
USD_TOTAL = sum(v for _, v in USD_GMV)
CREATORS = [("Pete's Pasta", 19180, "var(--pink)", "19,180"),
            ("Audien", 2000, "var(--violet)", "2,000+"),
            ("Cosmetics brand", 2000, "var(--magenta)", "2,000")]
CREATOR_TOTAL = sum(c[1] for c in CREATORS)


def count(text, to, dec, pre, suf):
    return f'<span class="count" data-to="{to}" data-dec="{dec}" data-pre="{pre}" data-suf="{suf}">{text}</span>'


def money(v):
    if v >= 1e6:
        return "$" + f"{v / 1e6:.2f}".rstrip("0").rstrip(".") + "M"
    return f"${v / 1e3:.0f}K" if v % 1000 == 0 else f"${v / 1e3:.1f}K"


def _bars():
    out = []
    top = USD_GMV[0][1]
    for k, (nm, v) in enumerate(USD_GMV):
        cls = " is-top" if k == 0 else ""
        out.append(f'''            <li class="dash-bar{cls}" style="--h:{v / top * 100:.1f}%;--i:{k}">
              <span class="dash-bar-val">{money(v)}</span>
              <span class="dash-bar-col"></span>
              <span class="dash-bar-name">{e(nm)}</span>
            </li>''')
    return "\n".join(out)


def _donut():
    offset, segs, legend = 0.0, [], []
    for nm, v, col, label in CREATORS:
        pct = v / CREATOR_TOTAL * 100
        segs.append(f'<circle class="dash-seg" r="15.915" cx="21" cy="21" pathLength="100" '
                    f'style="--p:{pct:.2f};--o:{-offset:.2f};stroke:{col}"/>')
        legend.append(f'<li><i style="background:{col}"></i><span>{e(nm)}</span><b>{label}</b></li>')
        offset += pct
    return "".join(segs), "".join(legend)


def _viz(b):
    kind, val = b["viz"]
    if kind == "share":
        pct = val / USD_TOTAL * 100
        return f'''<div class="dash-viz"><div class="dash-viz-head"><span>Share of US GMV</span><b>{pct:.0f}%</b></div>
            <div class="dash-track"><span style="--w:{pct:.1f}%"></span></div></div>'''
    if kind == "lift":
        base = 100 / (100 + val) * 100
        return f'''<div class="dash-viz"><div class="dash-viz-head"><span>Daily GMV in challenge</span><b>+{val}%</b></div>
            <div class="dash-lift"><span class="dash-lift-row"><em>Before</em><span class="dash-track dash-track--dim"><span style="--w:{base:.1f}%"></span></span></span><span class="dash-lift-row"><em>During</em><span class="dash-track"><span style="--w:100%"></span></span></span></div></div>'''
    pct = val / 5 * 100
    return f'''<div class="dash-viz dash-viz--gauge"><svg viewBox="0 0 100 56" aria-hidden="true"><path class="dash-gauge-bg" d="M8 50a42 42 0 0 1 84 0" pathLength="100"/><path class="dash-gauge" d="M8 50a42 42 0 0 1 84 0" pathLength="100" style="--p:{pct:.0f}"/></svg>
            <div class="dash-gauge-val"><b>{val}</b><span>/ 5 shop score</span></div></div>'''


def _card(k, b):
    h = b["hero"]
    stats = "\n".join(f'            <div><dt>{e(l)}</dt><dd>{e(v)}</dd></div>' for v, l in b["stats"])
    return f'''        <article class="dash-card dash-brand" style="--i:{k + 2}">
          <p class="dash-cat">{b["n"]} · {e(b["cat"])}</p>
          <h3>{e(b["name"])}</h3>
          <p class="dash-note">{e(b["note"])}</p>
          <p class="dash-hero">{count(h[0], h[2], h[3], h[4], h[5])}<span>{e(h[1])}</span></p>
          {_viz(b)}
          <dl class="dash-stats">
{stats}
          </dl>
        </article>'''


def dashboard_html():
    segs, legend = _donut()
    cards = "\n".join(_card(k, b) for k, b in enumerate(BRANDS))
    total = count(money(USD_TOTAL) + "+", round(USD_TOTAL / 1e6, 2), 2, "$", "M+")
    creators = count(f"{CREATOR_TOTAL:,}+", CREATOR_TOTAL, 0, "", "+")
    return f'''  <section id="performances" class="section-alt dash-section" aria-labelledby="perf-title">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Proof, Not Promises</p>
        <h2 id="perf-title">Four Shops, in Their Own Numbers</h2>
        <p>Results from TikTok Shop programs run by us and our partners, straight from Seller Center.</p>
      </div>

      <div class="dash" data-dash>
        <article class="dash-card dash-total" style="--i:0">
          <div class="dash-total-head">
            <div>
              <p class="dash-label"><span class="dash-live"></span>Combined GMV · US shops</p>
              <p class="dash-big">{total}</p>
              <p class="dash-sub">Across Audien, Pete's Pasta and Pure Instinct, plus <b>£188K</b> from a UK beauty launch.</p>
            </div>
            <span class="dash-chip">4 shops · US + UK</span>
          </div>
          <ol class="dash-bars" aria-label="GMV by shop in US dollars">
{_bars()}
          </ol>
        </article>

        <article class="dash-card dash-creators" style="--i:1">
          <p class="dash-label">Creators activated</p>
          <div class="dash-donut-wrap">
            <svg class="dash-donut" viewBox="0 0 42 42" aria-hidden="true">
              <circle class="dash-donut-bg" r="15.915" cx="21" cy="21"/>
              {segs}
            </svg>
            <div class="dash-donut-center">{creators}<span>across 3 shops</span></div>
          </div>
          <ul class="dash-legend">{legend}</ul>
        </article>

{cards}
      </div>
    </div>
  </section>
'''
