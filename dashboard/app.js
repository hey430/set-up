/*
 * Tracker: front-end prototype.
 *
 * Everything runs in the browser on sample data from data.js. Places where the
 * real system plugs in (Slack, Euka, Higgsfield, Claude agents, social posting,
 * logins) are marked "LIVE:" so they are easy to find later.
 */
(function () {
  "use strict";
  const D = window.DASHBOARD_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* ================= icons ================= */
  const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    logo: svg('<path d="M4 18l5-6 4 3 7-9" stroke="#fff" stroke-width="2.4"/><circle cx="20" cy="6" r="1.6" fill="#fff" stroke="none"/>'),
    home: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    news: svg('<path d="M4 5h12v14H6a2 2 0 0 1-2-2z"/><path d="M16 9h4v8a2 2 0 0 1-2 2"/><path d="M8 9h4M8 13h4"/>'),
    brands: svg('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
    people: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.5 3.5 5.2"/>'),
    plug: svg('<path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>'),
    lock: svg('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    spark: svg('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
    back: svg('<path d="M15 18l-6-6 6-6"/>'),
    script: svg('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>'),
    film: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'),
    cut: svg('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5L20 18M8.5 16.5L20 6"/>'),
    shield: svg('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    send: svg('<path d="M4 12l16-8-6 16-2.5-6.5z"/>'),
    rocket: svg('<path d="M5 15c-1.5 1.5-2 4-2 6 2 0 4.5-.5 6-2"/><path d="M9 15l-3-3c2-6 7-9 14-9 0 7-3 12-9 14z"/><circle cx="15" cy="9" r="1.6"/>'),
  };

  /* ================= state ================= */
  const state = {
    user: "admin",
    route: "home",
    newsType: "all",
    newsBrand: "all",
    videoFilter: "all",
    chat: [],
    chatOpen: false,
    jobs: [],
    openJob: null,
  };

  const PERMS = [
    { key: "results", label: "See results", desc: "Home page numbers, brand performance and video stats" },
    { key: "spend", label: "See ad spend and budgets", desc: "Spend, budgets and ROAS inputs" },
    { key: "news", label: "Read News", desc: "Performance news and evaluations from Slack" },
    { key: "create", label: "Request new videos", desc: "Use “Post more” to start the agent pipeline" },
    { key: "approve", label: "Approve and publish", desc: "Publish finished videos to the brand's social accounts" },
    { key: "assistant", label: "Use Tracker AI", desc: "Ask the assistant about brands and the dashboard" },
  ];
  const PERM_SHORT = { results: "Results", spend: "Spend", news: "News", create: "Create", approve: "Publish", assistant: "AI" };

  /* ================= helpers ================= */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => {
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
    if (n >= 1e4) return "$" + Math.round(n / 1e3) + "K";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return "$" + Math.round(n).toLocaleString("en-US");
  };
  const moneyFull = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const count = (n) => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n);
  const shortDate = (s) => new Date(s.length === 10 ? s + "T00:00:00" : s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const clock = (s) => new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const stamp = (s) => shortDate(s) + ", " + clock(s);
  const initials = (n) => n.replace(/[^A-Za-z\s]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const hueOf = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const monoBg = (name) => { const h = (hueOf(name) % 80) + 230; return `background:linear-gradient(140deg,hsl(${h} 70% 62%),hsl(${h + 20} 60% 34%))`; };
  const thumbBg = (hue) => `background:linear-gradient(165deg,hsl(${hue} 65% 52%),hsl(${(hue + 50) % 360} 55% 22%))`;
  const BRAND_COLORS = ["#b69cff", "#8b5cf6", "#f472b6", "#6d3ee0", "#d8b4fe", "#c026d3", "#a78bfa", "#7c3aed"];
  const STATUS = { "on-track": ["On track", "good"], attention: ["Needs attention", "warn"], "at-risk": ["At risk", "bad"] };
  const VSTATUS = { live: "Live", paused: "Paused", review: "In review", ended: "Ended" };
  const VERDICT = { scale: ["Scale it", "good"], watch: ["Watch", "warn"], fix: ["Fix now", "bad"], info: ["Update", "purple"] };

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2800);
  }

  /* ================= permissions ================= */
  const me = () => D.employees.find((e) => e.id === state.user) || D.employees[0];
  const isAdmin = () => me().role === "admin";
  const can = (p) => isAdmin() || me().perms.includes(p);
  const brandOk = (id) => isAdmin() || me().brands === "all" || me().brands.includes(id);
  const myBrands = () => D.brands.filter((b) => brandOk(b.id));
  const brandById = (id) => D.brands.find((b) => b.id === id);
  const locked = (text) => `<div class="locked">${I.lock}<span>${text}</span></div>`;

  /* ================= routing ================= */
  const ROUTES = ["home", "news", "brands", "employees", "connections"];
  function parseRoute() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h.startsWith("brand-")) return h;
    return ROUTES.includes(h) ? h : "home";
  }
  function allowed(route) {
    if (route === "employees" || route === "connections") return isAdmin();
    if (route === "news") return can("news");
    if (route.startsWith("brand-")) return brandOk(route.slice(6)) && !!brandById(route.slice(6));
    return true;
  }
  function go(route) { if (location.hash.slice(1) === route) render(); else location.hash = route; }

  /* ================= navigation ================= */
  function renderNav() {
    const r = state.route.startsWith("brand-") ? "brands" : state.route;
    const link = (id, icon, label, extra = "") => `<a href="#${id}" aria-current="${r === id ? "page" : "false"}">${icon}<span class="lbl">${label}</span>${extra}</a>`;
    const fresh = D.news.filter((n) => brandOk(n.brand)).length;
    const people = D.employees.filter((e) => e.status === "active" || e.status === "invited");
    $("#nav").innerHTML = `
      <div class="logo"><span class="logo-mark">${I.logo}</span><span class="logo-name">${esc(D.product || "Tracker")}</span></div>
      <div class="nav-group">
        <span class="eyebrow nav-label">Workspace</span>
        ${link("home", I.home, "Home")}
        ${can("news") ? link("news", I.news, "News", `<span class="count">${fresh}</span>`) : ""}
        ${link("brands", I.brands, "Brands")}
      </div>
      ${isAdmin() ? `<div class="nav-group">
        <span class="eyebrow nav-label">Admin</span>
        ${link("employees", I.people, "Employees")}
        ${link("connections", I.plug, "Connections")}
      </div>` : ""}
      <div class="nav-foot">
        <div class="viewer">
          <label class="eyebrow" for="viewer">Viewing as</label>
          <select id="viewer">${people.filter((e) => e.status === "active").map((e) => `<option value="${e.id}" ${e.id === state.user ? "selected" : ""}>${e.role === "admin" ? "Admin" : esc(e.name) + " · " + esc(e.title)}</option>`).join("")}</select>
          <small>Demo only: switch people to see how permissions change the dashboard.</small>
        </div>
      </div>`;
  }

  /* ================= shared bits ================= */
  function topline() {
    return `<div class="topline">
      <span class="source"><span class="dot"></span><b>Euka</b> synced ${stamp(D.lastSync.euka)}</span>
      <span class="source"><span class="dot"></span><b>Slack</b> synced ${stamp(D.lastSync.slack)}</span>
      <span class="sample" title="Every brand, number and message is a placeholder">Sample data</span>
    </div>`;
  }
  function delta(cur, prev, neutral) {
    if (!prev) return `<span class="delta flat">No prior data</span>`;
    const pct = ((cur - prev) / prev) * 100;
    const dir = Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "up" : "down";
    const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "•";
    return `<span class="delta ${neutral ? "flat" : dir}">${arrow} ${Math.abs(pct).toFixed(1)}% <span>vs prior 30d</span></span>`;
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  function lineChart(series, showSpend) {
    const W = 700, H = 240, L = 52, R = 14, T = 12, B = 26;
    const max = niceMax(Math.max(...series.map((d) => Math.max(d.gmv, showSpend ? d.spend : 0))));
    const x = (i) => L + (i * (W - L - R)) / (series.length - 1);
    const y = (v) => T + (1 - v / max) * (H - T - B);
    const line = (k) => series.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join("");
    const n = series.length - 1, last = series[n];
    const ticks = [0, .25, .5, .75, 1].map((f) => f * max);
    const xt = [0, 7, 14, 21, n];
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily GMV${showSpend ? " and ad spend" : ""}, last 30 days">
      <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".45"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="#262036" ${t ? 'stroke-dasharray="2 5"' : ""}/><text x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${money(t)}</text>`).join("")}
      ${xt.map((i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === n ? "end" : "middle"}">${shortDate(series[i].date)}</text>`).join("")}
      <path d="${line("gmv")}L${x(n)},${y(0)}L${x(0)},${y(0)}Z" fill="url(#ga)"/>
      <path d="${line("gmv")}" fill="none" stroke="#b69cff" stroke-width="2.4" stroke-linejoin="round"/>
      ${showSpend ? `<path d="${line("spend")}" fill="none" stroke="#f472b6" stroke-width="2" stroke-linejoin="round"/><circle cx="${x(n)}" cy="${y(last.spend)}" r="4" fill="#f472b6" stroke="#0f0d16" stroke-width="2"/>` : ""}
      <circle cx="${x(n)}" cy="${y(last.gmv)}" r="5" fill="#b69cff" stroke="#0f0d16" stroke-width="2"/>
    </svg>`;
  }
  function spark(series) {
    const W = 300, H = 44, max = Math.max(...series.map((d) => d.gmv)), min = Math.min(...series.map((d) => d.gmv));
    const x = (i) => (i * W) / (series.length - 1), y = (v) => 4 + (1 - (v - min) / (max - min || 1)) * (H - 8);
    const p = series.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.gmv).toFixed(1)}`).join("");
    const n = series.length - 1;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${p}L${W},${H}L0,${H}Z" fill="rgba(139,92,246,.16)"/><path d="${p}" fill="none" stroke="#b69cff" stroke-width="1.8" vector-effect="non-scaling-stroke"/><circle cx="${x(n) - 3}" cy="${y(series[n].gmv)}" r="3" fill="#b69cff"/></svg>`;
  }
  function kpiGrid(k, hero) {
    const tiles = [];
    if (can("results")) {
      tiles.push(["GMV · 30 days", money(k.gmv), delta(k.gmv, k.gmvPrev), true]);
      if (can("spend")) {
        tiles.push(["Ad spend", money(k.spend), delta(k.spend, k.spendPrev, true)]);
        tiles.push(["ROAS", k.roas.toFixed(2) + "×", delta(k.roas, k.roasPrev)]);
      }
      tiles.push(["Click-through rate", k.ctr.toFixed(2) + "%", delta(k.ctr, k.ctrPrev)]);
      tiles.push(["Active creators", k.creators, delta(k.creators, k.creatorsPrev)]);
      tiles.push(["Videos posted", k.videos, delta(k.videos, k.videosPrev)]);
    }
    if (!tiles.length) return locked("Your account can't see results. Ask an admin for the “See results” permission.");
    return `<section class="kpis" aria-label="Key numbers">${tiles.map(([l, v, d, h]) => `<div class="kpi ${h && hero ? "hero" : ""}"><span class="eyebrow">${l}</span><span class="kpi-val">${v}</span>${d}</div>`).join("")}</section>`;
  }
  function combined(brands) {
    const sum = (f) => brands.reduce((a, b) => a + f(b), 0);
    const k = {
      gmv: sum((b) => b.kpis.gmv), gmvPrev: sum((b) => b.kpis.gmvPrev),
      spend: sum((b) => b.kpis.spend), spendPrev: sum((b) => b.kpis.spendPrev),
      creators: sum((b) => b.kpis.creators), creatorsPrev: sum((b) => b.kpis.creatorsPrev),
      videos: sum((b) => b.kpis.videos), videosPrev: sum((b) => b.kpis.videosPrev),
    };
    k.roas = k.spend ? k.gmv / k.spend : 0; k.roasPrev = k.spendPrev ? k.gmvPrev / k.spendPrev : 0;
    const imp = (b) => b.kpis.ctr * b.kpis.spend;
    k.ctr = sum(imp) / (k.spend || 1); k.ctrPrev = sum((b) => b.kpis.ctrPrev * b.kpis.spendPrev) / (k.spendPrev || 1);
    const days = brands[0] ? brands[0].series.length : 0;
    k.series = Array.from({ length: days }, (_, i) => ({ date: brands[0].series[i].date, gmv: sum((b) => b.series[i] ? b.series[i].gmv : 0), spend: sum((b) => b.series[i] ? b.series[i].spend : 0) }));
    return k;
  }

  /* ================= HOME ================= */
  function viewHome() {
    const brands = myBrands().filter((b) => b.series && b.series.length);
    const scope = isAdmin() || me().brands === "all" ? "every brand" : `your ${brands.length} brand${brands.length === 1 ? "" : "s"}`;
    if (!brands.length) return `${topline()}<div class="page-head"><div><span class="eyebrow">Home</span><h1>Welcome, ${esc(me().name.split(" ")[0])}</h1></div></div><div class="empty">No brands are assigned to you yet. Ask an admin to give you access.</div>`;
    const k = combined(brands);
    const live = brands.reduce((a, b) => a + b.ads.filter((x) => x.status === "live").length, 0);
    const total = brands.reduce((a, b) => a + b.kpis.gmv, 0);
    const lastNews = (id) => D.news.filter((n) => n.brand === id).sort((a, z) => z.time.localeCompare(a.time))[0];
    return `
      ${topline()}
      <div class="page-head">
        <div><span class="eyebrow">Home · last 30 days</span><h1>All brands at a glance</h1><p>Combined results for ${scope}. Scroll down for each brand on its own.</p></div>
        <div class="chips"><span class="pill purple">${brands.length} brands</span><span class="pill good">${live} live videos</span></div>
      </div>
      ${kpiGrid(k, true)}
      ${can("results") ? `
      <div class="grid-2">
        <section class="card">
          <div class="section-head"><h2>Combined GMV${can("spend") ? " and ad spend" : ""}</h2>
            <div class="legend"><span><i style="background:#b69cff"></i>GMV</span>${can("spend") ? '<span><i style="background:#f472b6"></i>Ad spend</span>' : ""}</div></div>
          <div class="chart">${lineChart(k.series, can("spend"))}</div>
        </section>
        <section class="card">
          <div class="section-head"><h2>Share of GMV</h2><span class="eyebrow num">${money(total)}</span></div>
          <div class="share">${brands.map((b, i) => `<i style="width:${(b.kpis.gmv / total) * 100}%;background:${BRAND_COLORS[i % BRAND_COLORS.length]}" title="${esc(b.name)}"></i>`).join("")}</div>
          <div class="share-legend">${brands.map((b, i) => `<div><i style="background:${BRAND_COLORS[i % BRAND_COLORS.length]}"></i><span>${esc(b.name)}</span><b class="num">${Math.round((b.kpis.gmv / total) * 100)}%</b></div>`).join("")}</div>
          <div class="section-head" style="margin-top:6px"><h3>Needs a look</h3></div>
          <div class="side-list">${brands.filter((b) => b.status !== "on-track").map((b) => `<div><span style="display:flex;gap:8px;align-items:center;min-width:0"><span class="sdot s-${b.status}"></span><a href="#brand-${b.id}">${esc(b.name)}</a></span><span class="muted" style="font-size:12.5px;text-align:right">${esc(b.statusNote)}</span></div>`).join("") || '<span class="muted">Every brand is on track.</span>'}</div>
        </section>
      </div>` : ""}
      <div class="section-head"><h2>Brand by brand</h2><a class="btn sm" href="#brands">Open Brands</a></div>
      <div class="brand-results">${brands.map((b) => {
        const n = lastNews(b.id); const [st, tone] = STATUS[b.status];
        return `<article class="br">
          <div class="br-head"><span class="mono" style="${monoBg(b.name)}">${esc(initials(b.name))}</span>
            <div><div class="br-name">${esc(b.name)}</div><div class="muted" style="font-size:12.5px">${esc(b.category)} · ${esc(b.lead)}</div></div>
            <span class="pill ${tone}">${st}</span></div>
          ${can("results") ? `<div class="br-stats" style="grid-template-columns:repeat(${can("spend") ? 4 : 2},minmax(0,1fr))">
            <div><b>${money(b.kpis.gmv)}</b><span>GMV</span></div>
            ${can("spend") ? `<div><b>${b.kpis.roas.toFixed(1)}×</b><span>ROAS</span></div><div><b>${money(b.kpis.spend)}</b><span>Spend</span></div>` : ""}
            <div><b>${b.ads.filter((a) => a.status === "live").length}</b><span>Live</span></div>
          </div>
          <div class="spark">${spark(b.series)}</div>
          ${delta(b.kpis.gmv, b.kpis.gmvPrev)}` : locked("Results hidden for your account.")}
          ${n && can("news") ? `<div class="br-news"><span class="pill ${VERDICT[n.verdict][1]}">${n.type === "result" ? "Result" : "News"}</span><b>${esc(n.title)}</b></div>` : ""}
          <a class="btn sm" href="#brand-${b.id}" style="align-self:flex-start">Open ${esc(b.name)}</a>
        </article>`;
      }).join("")}</div>`;
  }

  /* ================= NEWS ================= */
  function viewNews() {
    const all = D.news.filter((n) => brandOk(n.brand)).sort((a, z) => z.time.localeCompare(a.time));
    const list = all.filter((n) => (state.newsType === "all" || n.type === state.newsType) && (state.newsBrand === "all" || n.brand === state.newsBrand));
    const days = {};
    list.forEach((n) => { (days[n.time.slice(0, 10)] = days[n.time.slice(0, 10)] || []).push(n); });
    const cnt = (t) => all.filter((n) => t === "all" || n.type === t).length;
    const verdicts = Object.keys(VERDICT).map((v) => [v, all.filter((n) => n.verdict === v).length]);
    const channels = [...new Set(all.map((n) => n.channel))];
    return `
      ${topline()}
      <div class="page-head">
        <div><span class="eyebrow">News</span><h1>Performance news</h1><p>The News agent reads your Slack channels and Euka results, evaluates what happened, and posts it here under the brand's name.</p></div>
      </div>
      <div class="section-head">
        <div class="chips" role="group" aria-label="Filter by type">
          ${[["all", "All"], ["result", "Results"], ["news", "News"]].map(([v, l]) => `<button class="chip" data-news-type="${v}" aria-pressed="${state.newsType === v}">${l}<span class="num">${cnt(v)}</span></button>`).join("")}
        </div>
        <select class="select" id="news-brand" aria-label="Filter by brand">
          <option value="all">All brands</option>
          ${myBrands().map((b) => `<option value="${b.id}" ${state.newsBrand === b.id ? "selected" : ""}>${esc(b.name)}</option>`).join("")}
        </select>
      </div>
      <div class="grid-2">
        <section class="feed" aria-label="News feed">
          ${list.length ? Object.entries(days).map(([d, items]) => `
            <div class="day">${new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
            ${items.map(newsPost).join("")}`).join("") : '<div class="empty">No posts match these filters.</div>'}
        </section>
        <aside class="card" style="position:sticky;top:20px">
          <h2>At a glance</h2>
          <div class="side-list">${verdicts.map(([v, c]) => `<div><span class="pill ${VERDICT[v][1]}">${VERDICT[v][0]}</span><b class="num">${c}</b></div>`).join("")}</div>
          <div class="section-head" style="margin-top:4px"><h3>Listening to</h3></div>
          <div class="side-list">${channels.map((c) => `<div><span style="font:500 12.5px var(--font-mono);color:var(--purple-hi)">${esc(c)}</span><span class="dot"></span></div>`).join("")}</div>
          <p class="muted" style="margin:0;font-size:12.5px">New posts appear automatically after each Slack and Euka sync.</p>
        </aside>
      </div>`;
  }
  function newsPost(n) {
    const b = brandById(n.brand); const [vl, vt] = VERDICT[n.verdict];
    return `<article class="post">
      <span class="bot">${I.spark}</span>
      <div class="post-body">
        <div class="post-top"><b>News agent</b><span class="pill ${n.type === "result" ? "purple" : "plain"}">${n.type === "result" ? "Result" : "News"}</span><span class="pill plain">${esc(b ? b.name : n.brand)}</span><time datetime="${n.time}">${clock(n.time)}</time></div>
        <div class="post-title">${esc(n.title)}</div>
        <p>${esc(n.body)}</p>
        <div class="eval">
          <div class="eval-top"><span class="eyebrow">Evaluation</span><span class="pill ${vt}">${vl}</span></div>
          <p>${esc(n.evaluation)}</p>
          ${n.metrics.length && can("results") ? `<div class="metrics">${n.metrics.filter(([l]) => can("spend") || !/spend|roas/i.test(l)).map(([l, v]) => `<span><b>${esc(v)}</b>${esc(l)}</span>`).join("")}</div>` : ""}
        </div>
        <div class="post-actions">
          <a class="btn sm" href="#brand-${n.brand}">Open brand</a>
          ${can("assistant") ? `<button class="btn sm ghost" data-ask="${esc("Tell me more about this: " + n.title + " (" + (b ? b.name : "") + ")")}">${I.spark} Ask AI</button>` : ""}
          <span class="src">${esc(n.channel)} · Slack</span>
        </div>
      </div>
    </article>`;
  }

  /* ================= BRANDS ================= */
  function viewBrands() {
    const brands = myBrands();
    return `
      ${topline()}
      <div class="page-head">
        <div><span class="eyebrow">Brands</span><h1>Brands</h1><p>Pick a brand to see the videos running for it, their specs, and to request new ones.</p></div>
        ${isAdmin() ? `<button class="btn primary" data-action="add-brand">${I.plus} Add brand</button>` : ""}
      </div>
      <div class="brand-grid">
        ${brands.map((b) => {
          const live = b.ads.filter((a) => a.status === "live").length; const [st, tone] = STATUS[b.status];
          return `<a class="brand-tile" href="#brand-${b.id}">
            <div class="row"><span class="mono" style="${monoBg(b.name)}">${esc(initials(b.name))}</span><div><div class="br-name">${esc(b.name)}</div><div class="muted" style="font-size:12.5px">${esc(b.category)}</div></div></div>
            <span class="pill ${tone}" style="align-self:flex-start">${st}</span>
            <div class="stats"><span><b>${live}</b> live video${live === 1 ? "" : "s"}</span>${can("results") ? `<span><b class="num">${money(b.kpis.gmv)}</b> GMV</span>` : ""}</div>
          </a>`;
        }).join("")}
        ${isAdmin() ? `<button class="brand-tile add-tile" data-action="add-brand">${I.plus}<span>Add a brand</span><span class="hint">Only admins can add brands</span></button>` : ""}
      </div>
      ${!brands.length ? '<div class="empty">No brands are assigned to you yet.</div>' : ""}`;
  }

  function viewBrand(id) {
    const b = brandById(id);
    const [st, tone] = STATUS[b.status];
    const vids = b.ads.filter((a) => state.videoFilter === "all" || a.status === state.videoFilter).sort((a, z) => z.launched.localeCompare(a.launched));
    const cnt = (f) => f === "all" ? b.ads.length : b.ads.filter((a) => a.status === f).length;
    const accounts = D.accounts[b.id] || [];
    return `
      ${topline()}
      <a class="back" href="#brands">${I.back.replace("<svg", '<svg width="16" height="16"')} All brands</a>
      <section class="brand-head">
        <span class="mono" style="${monoBg(b.name)}">${esc(initials(b.name))}</span>
        <div><h1>${esc(b.name)}</h1>
          <div class="brand-sub"><span>${esc(b.category)}</span><span>Lead: ${esc(b.lead)}</span><span>Goal: ${esc(b.goal)}</span></div></div>
        <div class="brand-actions">
          <span class="pill ${tone}"><span class="sdot s-${b.status}"></span>${st} · ${esc(b.statusNote)}</span>
        </div>
      </section>
      ${b.series && b.series.length ? kpiGrid(b.kpis, false) : '<div class="callout">Waiting for the first Euka sync. Results and videos appear here once this brand\'s data comes in.</div>'}
      <section class="card">
        <div class="section-head">
          <div style="display:flex;flex-direction:column;gap:4px"><h2>Videos running</h2><span class="muted" style="font-size:13px">Pulled from Euka. Click a video for its full specs.</span></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <div class="chips" role="group" aria-label="Filter videos">${["all", "live", "paused", "review", "ended"].map((f) => `<button class="chip" data-vfilter="${f}" aria-pressed="${state.videoFilter === f}">${f === "all" ? "All" : VSTATUS[f]}<span class="num">${cnt(f)}</span></button>`).join("")}</div>
            ${can("create") ? `<button class="btn primary" data-action="post-more" data-brand="${b.id}">${I.rocket} Post more</button>` : `<button class="btn" disabled title="Ask an admin for the “Request new videos” permission">${I.lock} Post more</button>`}
          </div>
        </div>
        ${vids.length ? `<div class="videos">${vids.map((a) => videoCard(a)).join("")}</div>` : `<div class="empty">No ${state.videoFilter === "all" ? "" : VSTATUS[state.videoFilter].toLowerCase() + " "}videos for ${esc(b.name)} yet.</div>`}
      </section>
      <div class="grid-2">
        <section class="card">
          <div class="section-head"><h2>Video requests</h2><span class="muted" style="font-size:13px">Agent pipeline progress</span></div>
          <div class="requests" id="requests">${requestsList(b.id)}</div>
        </section>
        <section class="card">
          <h2>Posting accounts</h2>
          <div class="side-list">${accounts.map((a) => `<div><span><b style="font-weight:600">${esc(a.platform)}</b> <span class="muted">${esc(a.handle)}</span></span>${a.connected ? '<span class="pill good">Connected</span>' : '<span class="pill plain">Not connected</span>'}</div>`).join("") || '<span class="muted">No accounts yet.</span>'}</div>
          <p class="muted" style="margin:0;font-size:12.5px">${isAdmin() ? 'Manage these in <a href="#connections">Connections</a>.' : "Only an admin can connect accounts."}</p>
        </section>
      </div>`;
  }
  function thumb(a) {
    const len = a.duration ? `0:${String(a.duration).padStart(2, "0")}` : "Carousel";
    return `<div class="thumb" style="${thumbBg(a.hue)}">
      <div class="thumb-top"><span class="pill v-${a.status}">${VSTATUS[a.status]}</span><span class="tag">${len}</span></div>
      ${a.duration ? '<span class="play" aria-hidden="true"></span>' : ""}
      <div class="thumb-hook">${esc(a.hook)}</div></div>`;
  }
  function videoCard(a) {
    const r = can("results"), s = can("spend");
    return `<button class="video" data-video="${a.id}" aria-label="Open specs for ${esc(a.title)}">
      ${thumb(a)}
      <div class="video-body">
        <div class="video-title">${esc(a.title)}</div>
        <div class="video-meta"><span>${esc(a.creator)}</span><span>${shortDate(a.launched)}</span></div>
        <div class="video-stats">
          <div><b>${r && a.impressions ? count(a.impressions) : "–"}</b><span>Views</span></div>
          <div><b>${r && s && a.roas ? a.roas.toFixed(1) + "×" : "–"}</b><span>ROAS</span></div>
          <div><b>${r && a.ctr ? a.ctr.toFixed(1) + "%" : "–"}</b><span>CTR</span></div>
        </div>
      </div></button>`;
  }

  /* ================= video specs drawer ================= */
  let lastFocus = null;
  function openVideo(id) {
    const b = brandById(state.route.slice(6)); const a = b && b.ads.find((x) => x.id === id);
    if (!a) return;
    lastFocus = document.activeElement;
    const r = can("results"), s = can("spend"), pending = !a.impressions;
    const spec = (rows) => `<dl class="specs">${rows.map(([k, v, t]) => `<dt>${k}</dt><dd class="${t ? "text" : ""}">${v}</dd>`).join("")}</dl>`;
    const perf = [["Impressions", a.impressions.toLocaleString("en-US")], ["CTR", a.ctr.toFixed(1) + "%"], ["Conversion rate", a.cvr.toFixed(1) + "%"], ["GMV", moneyFull(a.gmv)]];
    if (s) perf.unshift(["Spend", moneyFull(a.spend)]), perf.push(["ROAS", a.roas.toFixed(2) + "×"]);
    $("#drawer").innerHTML = `
      <div class="modal-head"><div><span class="eyebrow">${esc(b.name)} · ${a.id}</span><h2 id="drawer-title" style="font-size:22px">${esc(a.title)}</h2><span class="muted">${esc(a.creator)} · launched ${shortDate(a.launched)}</span></div><button class="x" data-close aria-label="Close">×</button></div>
      <div class="preview-wrap"><div class="preview">${thumb(a)}</div>
        ${r ? `<div class="hs-grid">
          <div class="hs"><b>${pending ? "–" : money(a.gmv)}</b><span>GMV</span></div>
          <div class="hs"><b>${pending || !s ? "–" : a.roas.toFixed(1) + "×"}</b><span>ROAS</span></div>
          <div class="hs"><b>${pending ? "–" : count(a.impressions)}</b><span>Views</span></div>
          <div class="hs"><b>${pending ? "–" : a.ctr.toFixed(1) + "%"}</b><span>CTR</span></div></div>` : locked("Results hidden for your account.")}
      </div>
      <div class="spec-group"><span class="eyebrow">Creative</span>${spec([["Format", esc(a.format)], ["Length", a.duration ? a.duration + " sec" : "Static carousel"], ["Aspect ratio", a.ratio], ["Resolution", esc(a.resolution)], ["Hook", esc(a.hook), 1], ["Call to action", esc(a.cta), 1]])}</div>
      <div class="spec-group"><span class="eyebrow">Delivery</span>${spec([["Placement", esc(a.placement), 1], ["Objective", esc(a.objective), 1], ["Audience", esc(a.audience), 1], ...(s ? [["Daily budget", moneyFull(a.budget)]] : []), ["Product", esc(a.product), 1]])}</div>
      ${r ? `<div class="spec-group"><span class="eyebrow">Performance to date</span>${pending ? '<p class="muted" style="margin:0">Still in review. Results appear once it starts delivering.</p>' : spec(perf)}</div>` : ""}
      ${can("create") ? `<button class="btn primary" data-action="post-more" data-brand="${b.id}" data-ref="${a.id}">${I.rocket} Make more like this</button>` : ""}`;
    $("#drawer").hidden = false; $("#scrim").hidden = false;
    $("#drawer [data-close]").focus();
  }

  /* ================= EMPLOYEES (admin) ================= */
  function viewEmployees() {
    const list = D.employees.filter((e) => e.status !== "removed");
    const brandNames = (e) => e.role === "admin" || e.brands === "all" ? "All brands" : e.brands.map((id) => brandById(id)?.name || id).join(", ") || "None";
    return `
      ${topline()}
      <div class="page-head">
        <div><span class="eyebrow">Admin · Employees</span><h1>Employees</h1><p>Add people, decide exactly what each person can see and do, or remove them. Nobody gets in until you set their permissions.</p></div>
        <button class="btn primary" data-action="add-employee">${I.plus} Add employee</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Person</th><th>Brands</th><th>Permissions</th><th>Status</th><th></th></tr></thead>
        <tbody>${list.map((e) => `<tr>
          <td><div class="person"><span class="avatar">${esc(initials(e.name))}</span><div><b style="font-weight:600">${esc(e.name)}</b><div class="muted" style="font-size:12.5px">${esc(e.title)} · ${esc(e.email)}</div></div></div></td>
          <td style="max-width:220px">${esc(brandNames(e))}</td>
          <td><div class="perm-list">${e.role === "admin" ? '<span class="pill purple">Full access</span>' : e.perms.length ? e.perms.map((p) => `<span class="pill plain">${PERM_SHORT[p]}</span>`).join("") : '<span class="muted">None</span>'}</div></td>
          <td>${e.status === "active" ? '<span class="pill good">Active</span>' : '<span class="pill warn">Invite sent</span>'}</td>
          <td><div class="row-actions">${e.role === "admin" ? '<span class="hint">Owner</span>' : `<button class="btn sm" data-action="edit-perms" data-emp="${e.id}">Permissions</button><button class="btn sm danger" data-action="remove-emp" data-emp="${e.id}">Remove</button>`}</div></td>
        </tr>`).join("")}</tbody>
      </table></div>
      <div class="callout">Only admins can add brands, connect accounts, and manage employees. These rights can't be given to other people.</div>`;
  }

  /* ================= CONNECTIONS (admin) ================= */
  function viewConnections() {
    const svc = [
      ["S", "Slack", true, "Reads client channels for the News agent. Posts approvals and alerts."],
      ["E", "Euka", true, "Brands, creators, videos, specs and TikTok Shop results."],
      ["H", "Higgsfield", true, "Generates new videos from the scripts the agents write."],
      ["AI", "Claude", true, "Runs the AI assistant and the script, editing and supervisor agents."],
    ];
    return `
      ${topline()}
      <div class="page-head"><div><span class="eyebrow">Admin · Connections</span><h1>Connections</h1><p>Connected once by an admin and shared by everyone, so employees never log in to these services or see the passwords.</p></div></div>
      <div class="conn-grid">${svc.map(([l, n, on, d]) => `<div class="conn"><div class="conn-top"><span class="conn-logo">${l}</span><b style="flex:1">${n}</b>${on ? '<span class="pill good">Connected</span>' : '<span class="pill plain">Off</span>'}</div><p>${d}</p></div>`).join("")}</div>
      <div class="section-head"><h2>Social accounts for posting</h2></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Brand</th><th>Platform</th><th>Account</th><th>Status</th><th></th></tr></thead>
        <tbody>${D.brands.flatMap((b) => (D.accounts[b.id] || []).map((a, i) => `<tr>
          <td>${esc(b.name)}</td><td>${esc(a.platform)}</td><td class="muted">${esc(a.handle)}</td>
          <td>${a.connected ? '<span class="pill good">Connected</span>' : '<span class="pill plain">Not connected</span>'}</td>
          <td><div class="row-actions"><button class="btn sm" data-action="toggle-acct" data-brand="${b.id}" data-i="${i}">${a.connected ? "Disconnect" : "Connect"}</button></div></td>
        </tr>`)).join("")}</tbody>
      </table></div>`;
  }

  /* ================= modals ================= */
  function openModal(html, wide) {
    lastFocus = document.activeElement;
    const m = $("#modal");
    m.innerHTML = `<div class="modal ${wide ? "wide" : ""}">${html}</div>`;
    m.hidden = false; $("#scrim").hidden = false;
    const f = m.querySelector("input, select, textarea, button:not(.x)"); if (f) f.focus();
  }
  function closeOverlays() {
    $("#modal").hidden = true; $("#drawer").hidden = true; $("#scrim").hidden = true; state.openJob = null;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  function permsForm(e) {
    const brandsAll = e && e.brands === "all";
    return `
      <div class="field full"><span class="label">Brand access</span>
        <div class="checks cols">
          <label class="check"><input type="checkbox" name="brand-all" ${brandsAll ? "checked" : ""}><div><b>All brands</b><span>Including brands added later</span></div></label>
          ${D.brands.map((b) => `<label class="check"><input type="checkbox" name="brand" value="${b.id}" ${e && (brandsAll || (e.brands !== "all" && e.brands.includes(b.id))) ? "checked" : ""}><div><b>${esc(b.name)}</b><span>${esc(b.category)}</span></div></label>`).join("")}
        </div></div>
      <div class="field full"><span class="label">What they can do</span>
        <div class="checks">${PERMS.map((p) => `<label class="check"><input type="checkbox" name="perm" value="${p.key}" ${e && e.perms.includes(p.key) ? "checked" : ""}><div><b>${p.label}</b><span>${p.desc}</span></div></label>`).join("")}</div></div>`;
  }
  function readPerms(root) {
    const all = $("[name=brand-all]", root).checked;
    return { brands: all ? "all" : $$("[name=brand]:checked", root).map((i) => i.value), perms: $$("[name=perm]:checked", root).map((i) => i.value) };
  }

  function addEmployeeStep1(draft = {}) {
    openModal(`
      <div class="modal-head"><div><div class="steps-ind"><b>Step 1 of 2</b><span>Details</span></div><h2>Add employee</h2><p>Next you'll choose exactly what they can access.</p></div><button class="x" data-close aria-label="Close">×</button></div>
      <form class="form" id="emp-form">
        <div class="field"><label for="emp-name">Full name</label><input id="emp-name" required value="${esc(draft.name || "")}" placeholder="e.g. Alex Morgan"></div>
        <div class="field"><label for="emp-title">Job title</label><input id="emp-title" value="${esc(draft.title || "")}" placeholder="e.g. Media buyer"></div>
        <div class="field full"><label for="emp-email">Work email</label><input id="emp-email" type="email" required value="${esc(draft.email || "")}" placeholder="name@youragency.com"><span class="hint">They get an invite to sign in to Tracker on their computer.</span></div>
        <div class="modal-foot span"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn primary" type="submit">Next: set permissions</button></div>
      </form>`);
    $("#emp-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      addEmployeeStep2({ name: $("#emp-name").value.trim(), title: $("#emp-title").value.trim() || "Team member", email: $("#emp-email").value.trim() });
    });
  }
  function addEmployeeStep2(draft) {
    openModal(`
      <div class="modal-head"><div><div class="steps-ind"><span>Step 2 of 2</span><b>Permissions</b></div><h2>What can ${esc(draft.name.split(" ")[0])} access?</h2><p>Nothing is turned on until you choose it.</p></div><button class="x" data-close aria-label="Close">×</button></div>
      <form class="form" id="perm-form">${permsForm(null)}
        <div class="field full"><div class="callout warn" id="perm-warn" hidden>Pick at least one brand and one permission, or the employee won't be able to see anything.</div></div>
        <div class="modal-foot span"><button type="button" class="btn ghost" id="perm-back">Back</button><button class="btn primary" type="submit">Add ${esc(draft.name.split(" ")[0])} and send invite</button></div>
      </form>`);
    $("#perm-back").addEventListener("click", () => addEmployeeStep1(draft));
    $("#perm-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const p = readPerms($("#perm-form"));
      if ((p.brands !== "all" && !p.brands.length) || !p.perms.length) { $("#perm-warn").hidden = false; return; }
      const id = draft.email.split("@")[0].replace(/\W/g, "") + Date.now().toString(36).slice(-3);
      // LIVE: create the user in the local database and email the invite.
      D.employees.push({ id, ...draft, role: "employee", status: "invited", ...p });
      closeOverlays(); render(); toast(`${draft.name} added. Invite sent to ${draft.email}.`);
    });
  }
  function editPerms(id) {
    const e = D.employees.find((x) => x.id === id);
    openModal(`
      <div class="modal-head"><div><span class="eyebrow">${esc(e.title)}</span><h2>${esc(e.name)}'s permissions</h2><p>Changes apply the next time they open Tracker.</p></div><button class="x" data-close aria-label="Close">×</button></div>
      <form class="form" id="perm-form">${permsForm(e)}
        <div class="modal-foot span"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn primary" type="submit">Save permissions</button></div>
      </form>`);
    $("#perm-form").addEventListener("submit", (ev) => {
      ev.preventDefault(); Object.assign(e, readPerms($("#perm-form"))); closeOverlays(); render(); toast(`Saved ${e.name}'s permissions.`);
    });
  }
  function removeEmp(id) {
    const e = D.employees.find((x) => x.id === id);
    openModal(`
      <div class="modal-head"><div><h2>Remove ${esc(e.name)}?</h2><p>They lose access to Tracker straight away. Their past video requests stay in the history.</p></div><button class="x" data-close aria-label="Close">×</button></div>
      <div class="modal-foot"><button class="btn ghost" data-close>Keep</button><button class="btn danger" id="confirm-remove">Remove ${esc(e.name.split(" ")[0])}</button></div>`);
    $("#confirm-remove").addEventListener("click", () => { e.status = "removed"; closeOverlays(); render(); toast(`${e.name} was removed.`); });
  }
  function addBrand() {
    openModal(`
      <div class="modal-head"><div><span class="eyebrow">Admin only</span><h2>Add a brand</h2><p>Tracker starts pulling its Euka data and Slack messages at the next sync.</p></div><button class="x" data-close aria-label="Close">×</button></div>
      <form class="form" id="brand-form">
        <div class="field"><label for="b-name">Brand name</label><input id="b-name" required placeholder="e.g. Solstice Sun Care"></div>
        <div class="field"><label for="b-cat">Category</label><input id="b-cat" placeholder="e.g. Beauty · Sun care"></div>
        <div class="field"><label for="b-euka">Euka brand</label><select id="b-euka"><option>Solstice Sun Care (found in Euka)</option><option>Northfield Snacks (found in Euka)</option><option>Enter Euka ID manually</option></select></div>
        <div class="field"><label for="b-slack">Slack channel</label><input id="b-slack" placeholder="#client-solstice"></div>
        <div class="field"><label for="b-lead">Account lead</label><select id="b-lead">${D.employees.filter((e) => e.status === "active").map((e) => `<option>${esc(e.name)}</option>`).join("")}</select></div>
        <div class="field"><label for="b-budget">Monthly ad budget (USD)</label><input id="b-budget" type="number" min="0" step="500" placeholder="20000"></div>
        <div class="field full"><label for="b-goal">Current goal</label><input id="b-goal" placeholder="e.g. Reach $100K GMV a month by spring"></div>
        <div class="modal-foot span"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn primary" type="submit">Add brand</button></div>
      </form>`);
    $("#brand-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const name = $("#b-name").value.trim();
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brand-" + Date.now();
      const z = { gmv: 0, gmvPrev: 0, spend: 0, spendPrev: 0, roas: 0, roasPrev: 0, ctr: 0, ctrPrev: 0, creators: 0, creatorsPrev: 0, videos: 0, videosPrev: 0 };
      // LIVE: save to the database; the next sync fills Euka data and Slack messages.
      D.brands.push({ id, name, category: $("#b-cat").value.trim() || "New brand", lead: $("#b-lead").value, status: "on-track", statusNote: "Waiting for first sync", monthlyBudget: +$("#b-budget").value || 0, goal: $("#b-goal").value.trim() || "Not set yet", kpis: z, series: [], products: [], ads: [], slack: [] });
      D.accounts[id] = [];
      closeOverlays(); go("brand-" + id); toast(`${name} added. Data arrives at the next sync.`);
    });
  }

  /* ================= POST MORE: agent pipeline ================= */
  const AGENTS = [
    { key: "script", name: "Script agent", role: "Writes the hook, script and shot list", icon: I.script, ticks: 6 },
    { key: "video", name: "Higgsfield video agent", role: "Generates the video clips in Higgsfield", icon: I.film, ticks: 9 },
    { key: "edit", name: "Editing agent", role: "Cuts, captions, music and brand end card", icon: I.cut, ticks: 7 },
    { key: "supervisor", name: "Supervisor agent", role: "Checks every step and signs off", icon: I.shield, ticks: 4 },
  ];
  function postMore(brandId, refId) {
    const b = brandById(brandId); const ref = refId && b.ads.find((a) => a.id === refId);
    const accts = D.accounts[b.id] || [];
    closeOverlays();
    openModal(`
      <div class="modal-head"><div><span class="eyebrow">${esc(b.name)} · Post more</span><h2>Request a new video</h2><p>Describe what you want. The agents write the script, create the video in Higgsfield, edit it, and the supervisor reports progress here.</p></div><button class="x" data-close aria-label="Close">×</button></div>
      <form class="form" id="job-form">
        <div class="field"><label for="j-product">Product</label><select id="j-product">${(b.products.length ? b.products.map((p) => p.name) : ["Main product"]).map((p) => `<option ${ref && ref.product === p ? "selected" : ""}>${esc(p)}</option>`).join("")}</select></div>
        <div class="field"><label for="j-style">Style</label><select id="j-style"><option>UGC talking to camera</option><option>Product demo</option><option>Before and after</option><option>Unboxing</option><option>Trend remix</option></select></div>
        <div class="field full"><label for="j-brief">What do you want?</label><textarea id="j-brief" required placeholder="e.g. A 30-second video showing the serum in a morning routine, aimed at women 18–34, ending with the November offer.">${ref ? esc(`Same idea as "${ref.title}" (${ref.hook.replace(/"/g, "")}) with a fresh hook and a different creator look.`) : esc(`A ${b.products[0] ? b.products[0].name : "product"} video for ${b.name}: show it in a real daily routine, keep the hook under 3 seconds, and end on "Shop now".`)}</textarea></div>
        <div class="field"><label for="j-len">Length</label><select id="j-len"><option>15 sec</option><option selected>30 sec</option><option>45 sec</option><option>60 sec</option></select></div>
        <div class="field"><label for="j-var">Variations</label><select id="j-var"><option>1</option><option selected>2</option><option>3</option></select></div>
        <div class="field full"><span class="label">Post to</span>
          <div class="checks cols">${accts.map((a, i) => `<label class="check"><input type="checkbox" name="acct" value="${i}" ${a.connected ? (i === 0 ? "checked" : "") : "disabled"}><div><b>${esc(a.platform)}</b><span>${esc(a.handle)}${a.connected ? "" : " · admin must connect"}</span></div></label>`).join("") || '<span class="muted">No accounts connected for this brand. Ask an admin.</span>'}</div>
          <span class="hint">Accounts are connected by an admin, so you never type social media passwords here.</span></div>
        <div class="modal-foot span"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn primary" type="submit">${I.rocket} Start agents</button></div>
      </form>`, true);
    $("#job-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const job = {
        id: "VR-" + (101 + state.jobs.length), brand: b.id, by: me().name, created: new Date().toISOString(),
        product: $("#j-product").value, style: $("#j-style").value, brief: $("#j-brief").value.trim(), length: $("#j-len").value, variations: +$("#j-var").value,
        accounts: $$("[name=acct]:checked").map((i) => accts[+i.value]), steps: AGENTS.map((a) => ({ key: a.key, status: "queued", progress: 0 })),
        log: [], status: "running", revision: 0, hue: (hueOf(b.name) % 80) + 240,
      };
      job.hook = makeHook(job);
      logLine(job, "Supervisor", `Brief received from ${job.by}. ${job.variations} variation${job.variations > 1 ? "s" : ""}, ${job.length}, ${job.style.toLowerCase()}.`);
      state.jobs.unshift(job);
      openJob(job.id);
      startTicker();
    });
  }
  function makeHook(job) {
    const hooks = { "UGC talking to camera": `"I didn't expect ${job.product.split(" ")[0]} to work this fast"`, "Product demo": `"Watch what happens in 10 seconds"`, "Before and after": `"Day 1 vs day 14"`, Unboxing: `"Opening the one everyone keeps asking about"`, "Trend remix": `"POV: you finally found the one"` };
    return hooks[job.style] || `"You need to see this"`;
  }
  function logLine(job, who, text) { job.log.push({ t: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }), who, text }); }
  function agentOutput(job, key) {
    const n = job.variations, sec = parseInt(job.length, 10);
    return {
      script: `<ul><li>Hook: ${esc(job.hook)}</li><li>3 beats: problem, ${esc(job.product)} in use, result</li><li>CTA: Shop now · ${n} variation${n > 1 ? "s" : ""}</li></ul>`,
      video: `${n * 4} clips generated in Higgsfield · 9:16 · 1080×1920`,
      edit: `${n} cut${n > 1 ? "s" : ""} at ${sec}s with captions, licensed music and brand end card`,
      supervisor: "Checked brand safety, claims, length, captions and platform specs",
    }[key];
  }
  const SUP_NOTES = {
    script: ["Script agent is writing hooks based on the brand's best videos.", "Script approved: hook is under 3 seconds and the CTA matches the product."],
    video: ["Sent the shot list to Higgsfield.", "Higgsfield returned all clips. Two takes regenerated for lighting."],
    edit: ["Editing agent is assembling the cuts.", "Edit done: captions are readable and the music is licensed."],
    supervisor: ["Running final quality checks.", "All checks passed. Ready for review."],
  };
  let ticker = null;
  function startTicker() {
    if (ticker) return;
    ticker = setInterval(() => {
      let active = false;
      state.jobs.forEach((job) => {
        if (job.status !== "running") return;
        active = true;
        const i = job.steps.findIndex((s) => s.status !== "done");
        if (i < 0) return;
        const s = job.steps[i], a = AGENTS[i];
        if (s.status === "queued") { s.status = "working"; logLine(job, "Supervisor", SUP_NOTES[a.key][0]); }
        s.progress = Math.min(100, s.progress + 100 / a.ticks * (0.7 + Math.random() * 0.6));
        if (a.key === "video" && s.progress > 45 && !s.mid) { s.mid = 1; logLine(job, "Higgsfield", `Rendering clip ${Math.ceil(job.variations * 2)} of ${job.variations * 4}…`); }
        if (s.progress >= 100) {
          s.status = "done"; s.progress = 100; logLine(job, a.name.replace(" agent", ""), "Finished.");
          logLine(job, "Supervisor", SUP_NOTES[a.key][1]);
          if (i === job.steps.length - 1) job.status = "review";
        }
      });
      refreshJobs();
      if (!active) { clearInterval(ticker); ticker = null; }
    }, 650);
  }
  function stepClass(s) { return s.status === "done" ? "done" : s.status === "working" ? "working" : ""; }
  function pipelineHtml(job) {
    const b = brandById(job.brand);
    const statusPill = { running: '<span class="pill purple">Agents working</span>', review: '<span class="pill warn">Ready for review</span>', approval: '<span class="pill warn">Waiting for approval</span>', posted: '<span class="pill good">Published</span>' }[job.status];
    return `
      <div class="agents">${job.steps.map((s, i) => { const a = AGENTS[i]; return `
        <div class="agent ${stepClass(s)}"><span class="agent-ic">${a.icon}</span>
          <div class="agent-main">
            <div class="agent-top"><b>${a.name}</b><span class="pill ${s.status === "done" ? "good" : s.status === "working" ? "purple" : "plain"}">${s.status === "done" ? "Done" : s.status === "working" ? "Working" : "Queued"}</span></div>
            <span class="agent-out">${s.status === "done" ? agentOutput(job, a.key) : a.role}</span>
            ${s.status === "working" ? `<div class="bar"><i style="width:${s.progress.toFixed(0)}%"></i></div>` : ""}
          </div></div>`; }).join("")}</div>
      <div style="display:flex;flex-direction:column;gap:8px"><span class="eyebrow">Supervisor log</span>
        <div class="log" id="job-log">${job.log.map((l) => `<div>${l.t} <span>${esc(l.who)}</span> ${esc(l.text)}</div>`).join("")}</div></div>
      ${job.status !== "running" ? `
      <div class="result">
        <div class="preview">${thumb({ hue: job.hue, status: job.status === "posted" ? "live" : "review", duration: parseInt(job.length, 10), hook: job.hook })}</div>
        <div class="result-main">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>${esc(job.product)} · ${esc(job.length)}</b>${statusPill}</div>
          <div class="script">${esc(`Hook: ${job.hook}\nBeat 1: Show the everyday problem in a quick close-up.\nBeat 2: ${job.product} in use, real hands, natural light.\nBeat 3: The result, then "Shop now" with the brand end card.`)}</div>
          ${job.status === "posted" ? `<span class="muted" style="font-size:13px">Published to ${job.accounts.map((a) => esc(a.platform + " " + a.handle)).join(", ") || "no accounts"}. Results appear in News once Euka picks it up.</span>`
            : job.status === "approval" ? `<span class="muted" style="font-size:13px">Sent to an approver. They'll see it in this brand's video requests.</span>${can("approve") ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-job-act="approve">${I.send} Approve and publish</button></div>` : ""}`
            : `<div style="display:flex;gap:8px;flex-wrap:wrap">
                ${can("approve") ? `<button class="btn primary" data-job-act="approve" ${job.accounts.length ? "" : "disabled"}>${I.send} Approve and publish</button>` : `<button class="btn primary" data-job-act="send">${I.send} Send for approval</button>`}
                <button class="btn" data-job-act="revise">Request changes</button></div>
              ${job.accounts.length ? "" : '<span class="hint">No posting account was selected for this request.</span>'}`}
        </div></div>` : ""}
      <span class="hint">${esc(b.name)} · ${job.id} · requested by ${esc(job.by)}</span>`;
  }
  function openJob(id) {
    const job = state.jobs.find((j) => j.id === id); if (!job) return;
    const b = brandById(job.brand);
    openModal(`
      <div class="modal-head"><div><span class="eyebrow">${esc(b.name)} · ${job.id}</span><h2>Agents at work</h2><p>Live progress from the agent pipeline. You can close this; it keeps running.</p></div><button class="x" data-close aria-label="Close">×</button></div>
      <div class="studio">
        <div class="brief-summary card" style="background:var(--panel-2)">
          <span class="eyebrow">Your brief</span>
          <p style="margin:0">${esc(job.brief)}</p>
          <dl class="specs"><dt>Product</dt><dd class="text">${esc(job.product)}</dd><dt>Style</dt><dd class="text">${esc(job.style)}</dd><dt>Length</dt><dd>${esc(job.length)}</dd><dt>Variations</dt><dd>${job.variations}</dd><dt>Post to</dt><dd class="text">${job.accounts.map((a) => esc(a.platform)).join(", ") || "Not selected"}</dd></dl>
        </div>
        <div id="pipeline" style="display:flex;flex-direction:column;gap:14px">${pipelineHtml(job)}</div>
      </div>`, true);
    state.openJob = id;
    scrollLog();
  }
  function scrollLog() { const l = $("#job-log"); if (l) l.scrollTop = l.scrollHeight; }
  function refreshJobs() {
    if (state.openJob) { const job = state.jobs.find((j) => j.id === state.openJob); const p = $("#pipeline"); if (job && p) { p.innerHTML = pipelineHtml(job); scrollLog(); } }
    const r = $("#requests"); if (r && state.route.startsWith("brand-")) r.innerHTML = requestsList(state.route.slice(6));
  }
  function requestsList(brandId) {
    const jobs = state.jobs.filter((j) => j.brand === brandId);
    if (!jobs.length) return `<span class="muted">No requests yet.${can("create") ? " Use “Post more” to start one." : ""}</span>`;
    const label = { running: ["Agents working", "purple"], review: ["Ready for review", "warn"], approval: ["Waiting for approval", "warn"], posted: ["Published", "good"] };
    return jobs.map((j) => `<button class="req" data-job="${j.id}">
      <span><b style="font-weight:600">${esc(j.product)}</b> <span class="muted">· ${esc(j.style)} · ${esc(j.length)}</span></span>
      <span class="pill ${label[j.status][1]}">${label[j.status][0]}</span>
      <span class="req-steps">${j.steps.map((s) => `<i><span style="width:${s.progress}%"></span></i>`).join("")}</span>
    </button>`).join("");
  }
  function jobAction(act) {
    const job = state.jobs.find((j) => j.id === state.openJob); if (!job) return;
    if (act === "approve") {
      // LIVE: publish through the brand's connected social accounts.
      job.status = "posted"; logLine(job, "Supervisor", `Approved by ${me().name}. Published to ${job.accounts.map((a) => a.platform).join(", ")}.`); toast("Video published (demo).");
    } else if (act === "send") {
      job.status = "approval"; logLine(job, "Supervisor", `${me().name} sent this for approval.`); toast("Sent for approval.");
    } else if (act === "revise") {
      job.revision++; job.status = "running"; job.hook = `"Okay, I have to talk about ${job.product.split(" ")[0]}"`;
      job.steps.forEach((s, i) => { if (i !== 1) { s.status = "queued"; s.progress = 0; } });
      logLine(job, "Supervisor", `Changes requested (revision ${job.revision}). Re-running script and edit; reusing the Higgsfield clips.`);
      startTicker();
    }
    refreshJobs();
  }

  /* ================= AI assistant ================= */
  // LIVE: replace answer() with a call to the local server, which asks Claude
  // using the same data and the signed-in person's permissions.
  function answer(q) {
    const t = q.toLowerCase();
    const brands = myBrands().filter((b) => b.series.length);
    const r = can("results"), s = can("spend");
    const brand = D.brands.find((b) => t.includes(b.name.toLowerCase()) || t.includes(b.name.toLowerCase().split(" ")[0]));
    if (brand && !brandOk(brand.id)) return `You don't have access to **${brand.name}**. An admin can add it to your brands.`;
    if (/^(hi|hello|hey)\b/.test(t)) return `Hi ${me().name.split(" ")[0]}! Ask me about any of your brands, today's news, or how to use Tracker.`;
    if (/permission|access|what can i|my role/.test(t)) {
      if (isAdmin()) return "You're an **admin**: you can see everything, add brands, connect accounts and manage employees.";
      const p = me().perms.map((k) => PERMS.find((x) => x.key === k).label.toLowerCase());
      return `You can: **${p.join(", ") || "nothing yet"}**.\nBrands: ${me().brands === "all" ? "all brands" : me().brands.map((id) => brandById(id).name).join(", ")}.\nAsk an admin if you need more.`;
    }
    if (/add (an )?employee|invite|remove (an )?employee/.test(t)) return isAdmin() ? "Go to **Employees** → **Add employee**. Enter their details, then pick their brands and permissions. Nothing is turned on until you choose it." : "Only an admin can add or remove employees.";
    if (/add (a )?brand|new brand/.test(t)) return isAdmin() ? "Go to **Brands** → **Add brand**, pick it from Euka, set the Slack channel and lead. Data arrives at the next sync." : "Only an admin can add brands.";
    if (/post|new video|higgsfield|create (a )?video|agent/.test(t)) return can("create")
      ? "Open a brand in **Brands** and press **Post more**. Describe the video, choose length, style and accounts, then **Start agents**.\nThe script agent writes it, Higgsfield creates the clips, the editing agent cuts it, and the supervisor reports each step. You'll then approve it or request changes."
      : "You don't have permission to request videos yet. Ask an admin for “Request new videos”.";
    if (!r && /roas|gmv|sales|spend|result|perform|best|worst/.test(t)) return "Your account can't see results. Ask an admin for the “See results” permission.";
    if (brand) {
      const b = brand, k = b.kpis, best = b.ads.filter((a) => a.roas).sort((a, z) => z.roas - a.roas)[0];
      if (!b.series.length) return `**${b.name}** was just added. Its data arrives at the next Euka sync.`;
      const n = D.news.filter((x) => x.brand === b.id).sort((a, z) => z.time.localeCompare(a.time))[0];
      return `**${b.name}** (${STATUS[b.status][0].toLowerCase()}): ${money(k.gmv)} GMV in 30 days, ${k.gmv >= k.gmvPrev ? "up" : "down"} ${Math.abs(((k.gmv - k.gmvPrev) / k.gmvPrev) * 100).toFixed(0)}%.${s ? ` ROAS ${k.roas.toFixed(2)}× on ${money(k.spend)} spend.` : ""}\n${b.ads.filter((a) => a.status === "live").length} live videos.${best ? ` Best: “${best.title}”${s ? ` at ${best.roas.toFixed(1)}×` : ""}.` : ""}${n ? `\nLatest: ${n.title}.` : ""}`;
    }
    if (/best|top|highest/.test(t)) {
      const top = [...brands].sort((a, z) => (s ? z.kpis.roas - a.kpis.roas : z.kpis.gmv - a.kpis.gmv)).slice(0, 3);
      return `Top brands by ${s ? "ROAS" : "GMV"}:\n${top.map((b, i) => `${i + 1}. **${b.name}**: ${s ? b.kpis.roas.toFixed(2) + "×" : money(b.kpis.gmv)}`).join("\n")}`;
    }
    if (/worst|lowest|risk|attention|problem|struggl/.test(t)) {
      const bad = brands.filter((b) => b.status !== "on-track");
      return bad.length ? `These need a look:\n${bad.map((b) => `• **${b.name}**: ${b.statusNote}`).join("\n")}` : "All your brands are on track.";
    }
    if (/total|overall|combined|all brands|summary/.test(t)) {
      const k = combined(brands);
      return `Across ${brands.length} brands: **${money(k.gmv)}** GMV in 30 days (${k.gmv >= k.gmvPrev ? "up" : "down"} ${Math.abs(((k.gmv - k.gmvPrev) / k.gmvPrev) * 100).toFixed(0)}%).${s ? ` Spend ${money(k.spend)}, ROAS ${k.roas.toFixed(2)}×.` : ""}`;
    }
    if (/news|slack|today|latest|update/.test(t)) {
      if (!can("news")) return "You don't have access to News. Ask an admin.";
      const latest = D.news.filter((n) => brandOk(n.brand)).sort((a, z) => z.time.localeCompare(a.time)).slice(0, 3);
      return `Latest from News:\n${latest.map((n) => `• **${brandById(n.brand).name}**: ${n.title}`).join("\n")}`;
    }
    return "In this demo I can answer about brands, results, news, permissions and how to use Tracker. Try “How is Lumora Skin doing?” or “Which brands need attention?”. The full version answers anything using live data.";
  }
  function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>"); }
  function renderAssistant() {
    $("#fab").innerHTML = `${I.spark}<span>Ask Tracker AI</span>`;
    $("#fab").hidden = state.chatOpen || !can("assistant");
    const a = $("#assistant");
    a.hidden = !state.chatOpen || !can("assistant");
    if (a.hidden) return;
    if (!state.chat.length) state.chat.push({ who: "ai", text: `Hi ${me().name.split(" ")[0]}, I'm Tracker AI. Ask me about your brands, results, news, or how anything in the dashboard works.` });
    a.innerHTML = `
      <div class="as-head"><span class="bot" style="width:34px;height:34px">${I.spark}</span><div><b>Tracker AI</b><small>Answers from your dashboard · demo</small></div><button class="x" id="as-close" aria-label="Close assistant">×</button></div>
      <div class="as-msgs" id="as-msgs">${state.chat.map((m) => `<div class="bubble ${m.who === "me" ? "me" : "ai"} ${m.typing ? "typing" : ""}">${m.typing ? "Thinking…" : fmt(m.text)}</div>`).join("")}</div>
      ${state.chat.length < 3 ? `<div class="as-sugg">${["How are all brands doing?", "Which brands need attention?", "How do I post a new video?", "What can I access?"].map((x) => `<button data-sugg="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : ""}
      <form class="as-form" id="as-form"><input id="as-input" placeholder="Ask about brands, results or the dashboard" autocomplete="off" aria-label="Message Tracker AI"><button class="btn primary" aria-label="Send">${I.send}</button></form>`;
    const m = $("#as-msgs"); m.scrollTop = m.scrollHeight;
  }
  function ask(q) {
    if (!q.trim()) return;
    state.chatOpen = true;
    state.chat.push({ who: "me", text: q }, { who: "ai", typing: true });
    renderAssistant();
    setTimeout(() => {
      state.chat.pop(); state.chat.push({ who: "ai", text: answer(q) }); renderAssistant();
      const i = $("#as-input"); if (i) i.focus();
    }, 650);
  }

  /* ================= render + events ================= */
  function render() {
    state.route = parseRoute();
    if (!allowed(state.route)) { location.hash = "home"; return; }
    renderNav();
    const r = state.route;
    $("#work").innerHTML = r === "news" ? viewNews() : r === "brands" ? viewBrands() : r === "employees" ? viewEmployees() : r === "connections" ? viewConnections() : r.startsWith("brand-") ? viewBrand(r.slice(6)) : viewHome();
    const b = r.startsWith("brand-") && brandById(r.slice(6));
    document.title = (b ? b.name : { home: "Home", news: "News", brands: "Brands", employees: "Employees", connections: "Connections" }[r]) + " · Tracker";
    renderAssistant();
  }

  window.addEventListener("hashchange", () => { state.videoFilter = "all"; closeOverlays(); render(); window.scrollTo({ top: 0 }); });
  document.addEventListener("change", (e) => {
    if (e.target.id === "viewer") { state.user = e.target.value; state.chat = []; render(); toast(`Now viewing as ${me().name}.`); }
    if (e.target.id === "news-brand") { state.newsBrand = e.target.value; render(); }
    if (e.target.name === "brand-all") $$("[name=brand]").forEach((i) => (i.checked = e.target.checked));
    if (e.target.name === "brand" && !e.target.checked) { const a = $("[name=brand-all]"); if (a) a.checked = false; }
  });
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-close]"); if (!t) return;
    if (t.matches("[data-close]") || t.id === "scrim") return closeOverlays();
    if (t.dataset.newsType) { state.newsType = t.dataset.newsType; return render(); }
    if (t.dataset.vfilter) { state.videoFilter = t.dataset.vfilter; return render(); }
    if (t.dataset.video) return openVideo(t.dataset.video);
    if (t.dataset.job) return openJob(t.dataset.job);
    if (t.dataset.jobAct) return jobAction(t.dataset.jobAct);
    if (t.dataset.ask) return ask(t.dataset.ask);
    if (t.dataset.sugg) return ask(t.dataset.sugg);
    if (t.id === "fab") { state.chatOpen = true; renderAssistant(); const i = $("#as-input"); if (i) i.focus(); return; }
    if (t.id === "as-close") { state.chatOpen = false; renderAssistant(); $("#fab").focus(); return; }
    const act = t.dataset.action;
    if (act === "add-employee") addEmployeeStep1();
    else if (act === "edit-perms") editPerms(t.dataset.emp);
    else if (act === "remove-emp") removeEmp(t.dataset.emp);
    else if (act === "add-brand") addBrand();
    else if (act === "post-more") postMore(t.dataset.brand, t.dataset.ref);
    else if (act === "toggle-acct") { const a = D.accounts[t.dataset.brand][+t.dataset.i]; a.connected = !a.connected; render(); toast(`${a.platform} ${a.handle} ${a.connected ? "connected" : "disconnected"} (demo).`); }
  });
  $("#scrim").addEventListener("click", closeOverlays);
  document.addEventListener("submit", (e) => { if (e.target.id === "as-form") { e.preventDefault(); const i = $("#as-input"); const q = i.value; i.value = ""; ask(q); } });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("#modal").hidden || !$("#drawer").hidden) closeOverlays();
    else if (state.chatOpen) { state.chatOpen = false; renderAssistant(); }
  });

  render();
})();
