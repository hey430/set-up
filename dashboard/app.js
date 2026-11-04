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
  const svg = (p) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    updown: svg('<path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>'),
    bell: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    panel: svg('<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16"/>'),
    download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    calendar: svg('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    dots: svg('<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>'),
    filter: svg('<path d="M4 6h16M7 12h10M10 18h4"/>'),
    cart: svg('<path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>'),
    dollar: svg('<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.5-1-1.6-1.6-2.8-1.6-1.6 0-2.8.9-2.8 2.1 0 2.9 5.8 1.6 5.8 4.5 0 1.2-1.3 2.2-3 2.2-1.3 0-2.5-.6-3-1.7M12 6v1.6M12 16.4V18"/>'),
    target: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
    percent: svg('<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.3"/><circle cx="17" cy="17" r="2.3"/>'),
    video: svg('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.5l5-3v9l-5-3"/>'),
    image: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-9 8.5"/>'),
    radio: svg('<circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>'),
    help: svg('<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.5a2.4 2.4 0 0 1 4.6.9c0 1.6-2.3 2-2.3 3.4M12 17h.01"/>'),
    info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>'),
    chevL: svg('<path d="M14.5 6l-6 6 6 6"/>'),
    chevR: svg('<path d="M9.5 6l6 6-6 6"/>'),
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
    homeBrand: "all",
    homeTab: "overview",
    chartMode: "daily",
    tableQuery: "",
    tableStatus: "all",
    tableSearch: false,
    tablePage: 1,
    pendingVideo: null,
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

  /* ================= sidebar + top bar ================= */
  function navKey() { return state.route.startsWith("brand-") ? "brands" : state.route; }
  function renderSide() {
    const r = navKey();
    const link = (id, icon, label, extra = "") => `<a class="nav-link" href="#${id}" aria-current="${r === id ? "page" : "false"}" title="${label}">${icon}<span class="lbl">${label}</span>${extra}</a>`;
    const fresh = D.news.filter((n) => brandOk(n.brand)).length;
    const people = D.employees.filter((e) => e.status === "active");
    const c = D.credits, pct = Math.round((c.used / c.total) * 100), u = me();
    $("#side").innerHTML = `
      <div class="brandmark"><span class="brandmark-ic">${I.logo}</span><b>tracker</b></div>
      <div class="ws"><span class="ws-ic">${esc(initials(D.agency) || "A")}</span><div><b>${esc(D.agency)}</b><span>${isAdmin() ? "Admin access" : "Team access"}</span></div>${I.updown}</div>
      <nav class="nav-group" aria-label="Workspace"><span class="eyebrow">Workspace</span>
        ${link("home", I.home, "Home")}
        ${can("news") ? link("news", I.news, "News", `<span class="count">${fresh}</span>`) : ""}
        ${link("brands", I.brands, "Brands", `<span class="count">${myBrands().length}</span>`)}
      </nav>
      ${isAdmin() ? `<nav class="nav-group" aria-label="Manage"><span class="eyebrow">Manage</span>
        ${link("employees", I.people, "Employees", `<span class="count">${D.employees.filter((e) => e.status !== "removed").length}</span>`)}
        ${link("connections", I.plug, "Connections")}
      </nav>` : ""}
      <div class="side-foot">
        ${isAdmin() || can("create") ? `<div class="usage">
          <div class="usage-top"><span>${esc(c.label)} this month</span>${I.info}</div>
          <div class="usage-val num">${c.used.toLocaleString("en-US")}<small>/ ${count(c.total)}</small></div>
          <div class="track"><i style="width:${pct}%"></i></div>
          ${isAdmin() ? '<a href="#connections">Manage credits</a>' : `<span class="sub">${100 - pct}% left</span>`}
        </div>` : ""}
        ${can("assistant") ? `<button class="nav-link plain-btn" data-action="help">${I.help}<span class="lbl">Help & resources</span></button>` : ""}
        <div class="me" title="Switch person (demo)">
          <span class="avatar">${esc(initials(u.name))}</span>
          <div><b>${esc(u.role === "admin" ? D.agency + " admin" : u.name)}</b><span>${esc(u.role === "admin" ? "Workspace admin" : u.title)}</span></div>${I.updown}
          <select id="viewer" aria-label="Viewing as (demo)">${people.map((e) => `<option value="${e.id}" ${e.id === state.user ? "selected" : ""}>${e.role === "admin" ? "Admin" : esc(e.name) + " · " + esc(e.title)}</option>`).join("")}</select>
        </div>
      </div>`;
  }
  function crumbs() {
    const r = state.route;
    if (r.startsWith("brand-")) return ["Brands", brandById(r.slice(6))?.name || "Brand"];
    return { home: ["Workspace", "Home"], news: ["Workspace", "News"], brands: ["Workspace", "Brands"], employees: ["Manage", "Employees"], connections: ["Manage", "Connections"] }[r];
  }
  function renderTop() {
    const [section, page] = crumbs();
    const alerts = D.news.filter((n) => brandOk(n.brand) && n.verdict === "fix").length;
    $("#topbar").innerHTML = `
      <button class="icon-btn" id="toggle-side" aria-label="Show or hide the sidebar">${I.panel}</button>
      <div class="crumbs"><span class="ws-crumb">${section}</span><span class="sep">/</span><b>${esc(page)}</b></div>
      <div class="top-right">
        <div class="search">${I.search}<input id="search" type="search" placeholder="Search anything..." autocomplete="off" aria-label="Search brands, videos and news"><span class="kbd">⌘ K</span><div class="search-results" id="search-results" hidden></div></div>
        <span class="synced" title="Euka ${stamp(D.lastSync.euka)} · Slack ${stamp(D.lastSync.slack)}"><span class="dot"></span><span>All data synced</span></span>
        ${can("news") ? `<a class="icon-btn" href="#news" aria-label="News${alerts ? `: ${alerts} need action` : ""}">${I.bell}${alerts ? '<span class="badge"></span>' : ""}</a>` : ""}
      </div>`;
  }
  function searchResults(q) {
    q = q.trim().toLowerCase();
    const box = $("#search-results");
    if (!q) { box.hidden = true; return; }
    const out = [];
    myBrands().forEach((b) => { if (b.name.toLowerCase().includes(q)) out.push({ href: "#brand-" + b.id, label: b.name, kind: "Brand" }); });
    myBrands().forEach((b) => b.ads.forEach((a) => { if ((a.title + " " + a.creator).toLowerCase().includes(q)) out.push({ href: "#brand-" + b.id, video: a.id, label: a.title, kind: "Video · " + b.name }); }));
    if (can("news")) D.news.filter((n) => brandOk(n.brand) && n.title.toLowerCase().includes(q)).forEach((n) => out.push({ href: "#news", label: n.title, kind: "News" }));
    box.innerHTML = out.slice(0, 8).map((o) => `<a href="${o.href}" ${o.video ? `data-open-video="${o.video}"` : ""}>${esc(o.label)}<span>${esc(o.kind)}</span></a>`).join("") || '<span class="sub" style="padding:8px">No matches.</span>';
    box.hidden = false;
  }

  /* ================= shared bits ================= */
  const topline = () => "";
  function delta(cur, prev, neutral, abs) {
    if (!prev) return `<span class="delta flat"><b>New</b> no prior data</span>`;
    const diff = cur - prev, pct = (diff / prev) * 100;
    const dir = Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "up" : "down";
    const val = abs ? (diff >= 0 ? "+" : "−") + Math.abs(diff).toFixed(2) + "×" : (pct >= 0 ? "+" : "−") + Math.abs(pct).toFixed(1) + "%";
    return `<span class="delta ${neutral ? "flat" : dir}"><b>${dir === "down" ? "↘" : "↗"} ${val}</b> vs. previous month</span>`;
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  // Smooth line through points (Catmull-Rom to Bezier).
  function smooth(pts) {
    if (pts.length < 2) return "";
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }
  function miniSpark(vals) {
    const W = 84, H = 30, max = Math.max(...vals), min = Math.min(...vals);
    const pts = vals.map((v, i) => [(i * W) / (vals.length - 1), 3 + (1 - (v - min) / (max - min || 1)) * (H - 6)]);
    const l = pts[pts.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${smooth(pts)}" fill="none" stroke="#a98bfa" stroke-width="1.6"/><circle cx="${l[0]}" cy="${l[1]}" r="2.2" fill="#a98bfa"/></svg>`;
  }
  function spark(series) {
    const W = 300, H = 40, vals = series.map((d) => d.gmv), max = Math.max(...vals), min = Math.min(...vals);
    const pts = vals.map((v, i) => [(i * W) / (vals.length - 1), 4 + (1 - (v - min) / (max - min || 1)) * (H - 8)]);
    const p = smooth(pts);
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${p}L${W},${H}L0,${H}Z" fill="rgba(139,92,246,.12)"/><path d="${p}" fill="none" stroke="#a98bfa" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
  }
  const weekly = (vals) => { const n = Math.max(1, Math.floor(vals.length / 7)); return Array.from({ length: Math.ceil(vals.length / n) }, (_, i) => vals.slice(i * n, i * n + n)).map((w) => w.reduce((a, b) => a + b, 0) / w.length); };
  function kpiCards(k, series) {
    if (!can("results")) return locked("Your account can't see results. Ask an admin for the “See results” permission.");
    const s = can("spend"), has = series && series.length;
    const sp = (f) => has ? miniSpark(weekly(series.map(f))) : "";
    const cards = s ? [
      ["GMV", moneyFull(k.gmv), delta(k.gmv, k.gmvPrev), I.cart, sp((d) => d.gmv)],
      ["Ad spend", moneyFull(k.spend), delta(k.spend, k.spendPrev, true), I.dollar, sp((d) => d.spend)],
      ["ROAS", k.roas.toFixed(2) + "×", delta(k.roas, k.roasPrev, false, true), I.target, sp((d) => d.gmv / (d.spend || 1))],
      ["Videos posted", k.videos.toLocaleString("en-US"), delta(k.videos, k.videosPrev), I.video, ""],
    ] : [
      ["GMV", moneyFull(k.gmv), delta(k.gmv, k.gmvPrev), I.cart, sp((d) => d.gmv)],
      ["Click-through rate", k.ctr.toFixed(2) + "%", delta(k.ctr, k.ctrPrev), I.percent, ""],
      ["Active creators", k.creators.toLocaleString("en-US"), delta(k.creators, k.creatorsPrev), I.people, ""],
      ["Videos posted", k.videos.toLocaleString("en-US"), delta(k.videos, k.videosPrev), I.video, ""],
    ];
    return `<section class="kpis" aria-label="Key numbers">${cards.map(([l, v, d, ic, spk]) => `
      <div class="kpi"><span class="kpi-label">${l}</span><span class="kpi-ic">${ic}</span>
        <span class="kpi-val">${v}</span><span class="kpi-spark">${spk}</span>${d}</div>`).join("")}</section>`;
  }
  function combined(brands) {
    const sum = (f) => brands.reduce((a, b) => a + f(b), 0);
    const k = {
      gmv: sum((b) => b.kpis.gmv), gmvPrev: sum((b) => b.kpis.gmvPrev),
      spend: sum((b) => b.kpis.spend), spendPrev: sum((b) => b.kpis.spendPrev),
      creators: sum((b) => b.kpis.creators), creatorsPrev: sum((b) => b.kpis.creatorsPrev),
      videos: sum((b) => b.kpis.videos), videosPrev: sum((b) => b.kpis.videosPrev),
      budget: sum((b) => b.monthlyBudget || 0),
    };
    k.roas = k.spend ? k.gmv / k.spend : 0; k.roasPrev = k.spendPrev ? k.gmvPrev / k.spendPrev : 0;
    k.ctr = sum((b) => b.kpis.ctr * b.kpis.spend) / (k.spend || 1); k.ctrPrev = sum((b) => b.kpis.ctrPrev * b.kpis.spendPrev) / (k.spendPrev || 1);
    const ref = brands.find((b) => b.series.length), days = ref ? ref.series.length : 0;
    k.series = Array.from({ length: days }, (_, i) => ({ date: ref.series[i].date, gmv: sum((b) => b.series[i]?.gmv || 0), gmvLast: sum((b) => b.series[i]?.gmvLast || 0), spend: sum((b) => b.series[i]?.spend || 0) }));
    return k;
  }

  /* ================= HOME ================= */
  function gmvChart(series) {
    const avg = state.chartMode === "avg";
    const roll = (key) => series.map((_, i) => { const w = series.slice(Math.max(0, i - 6), i + 1); return w.reduce((a, d) => a + d[key], 0) / w.length; });
    const cur = avg ? roll("gmv") : series.map((d) => d.gmv), last = avg ? roll("gmvLast") : series.map((d) => d.gmvLast);
    const W = 720, H = 300, L = 44, R = 10, T = 10, B = 26, n = series.length - 1;
    const max = niceMax(Math.max(...cur, ...last));
    const x = (i) => L + (i * (W - L - R)) / n, y = (v) => T + (1 - v / max) * (H - T - B);
    const ticks = [0, 1 / 3, 2 / 3, 1].map((f) => f * max);
    const xt = [0, 4, 9, 14, 19, 24, n].filter((v, i, a) => v <= n && a.indexOf(v) === i);
    const lp = [x(n), y(cur[n])];
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily GMV this month compared with last month">
      ${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="#222229"/><text x="${L - 10}" y="${y(t) + 3.5}" text-anchor="end">${money(t)}</text>`).join("")}
      ${xt.map((i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === n ? "end" : "middle"}">${shortDate(series[i].date)}</text>`).join("")}
      <path d="${smooth(last.map((v, i) => [x(i), y(v)]))}" fill="none" stroke="#6b6977" stroke-width="1.5" stroke-dasharray="3 4"/>
      <path d="${smooth(cur.map((v, i) => [x(i), y(v)]))}" fill="none" stroke="#a98bfa" stroke-width="2.2"/>
      <circle cx="${lp[0]}" cy="${lp[1]}" r="4" fill="#a98bfa" stroke="#111116" stroke-width="2"/>
    </svg>`;
  }
  function weekBars(series) {
    const weeks = [[0, 6], [7, 13], [14, 20], [21, series.length - 1]].filter(([a]) => a < series.length);
    const vals = weeks.map(([a, b]) => series.slice(a, b + 1).reduce((s, d) => s + d.gmv, 0));
    const W = 400, H = 210, T = 22, B = 26, max = niceMax(Math.max(...vals)) , gap = 22, bw = (W - gap * (vals.length + 1)) / vals.length;
    const day = (i) => new Date(series[i].date + "T00:00:00");
    const lab = ([a, b]) => `${day(a).toLocaleDateString("en-US", { month: "short" })} ${day(a).getDate()}–${day(b).getDate()}`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="GMV per week">
      ${vals.map((v, i) => { const h = (v / max) * (H - T - B), xx = gap + i * (bw + gap), yy = H - B - h, last = i === vals.length - 1;
        return `<rect x="${xx}" y="${yy}" width="${bw}" height="${h}" rx="4" fill="${last ? "#a98bfa" : "#6a45c2"}"/>
          <text x="${xx + bw / 2}" y="${yy - 7}" text-anchor="middle" style="fill:#9b99a8">${money(v)}</text>
          <text x="${xx + bw / 2}" y="${H - 7}" text-anchor="middle">${lab(weeks[i])}</text>`; }).join("")}
    </svg>`;
  }
  function homeRows(brands) {
    const q = state.tableQuery.trim().toLowerCase();
    return brands.flatMap((b) => b.ads.map((a) => ({ a, b })))
      .filter(({ a, b }) => (state.tableStatus === "all" || a.status === state.tableStatus) && (!q || (a.title + " " + a.creator + " " + b.name).toLowerCase().includes(q)))
      .sort((x, z) => z.a.gmv - x.a.gmv || z.a.launched.localeCompare(x.a.launched));
  }
  function videoTable(brands) {
    const rows = homeRows(brands), per = 5, pages = Math.max(1, Math.ceil(rows.length / per));
    state.tablePage = Math.min(state.tablePage, pages);
    const page = rows.slice((state.tablePage - 1) * per, state.tablePage * per), s = can("spend");
    const icon = (a) => /carousel/i.test(a.format) ? I.image : /live/i.test(a.format) ? I.radio : I.video;
    return `
      <div class="table-head">
        <div><h2>Video performance</h2><span class="pill plain">${rows.length} video${rows.length === 1 ? "" : "s"}</span></div>
        <div>
          ${state.tableSearch ? `<input class="table-search" id="table-q" placeholder="Search videos" value="${esc(state.tableQuery)}" aria-label="Search videos">` : ""}
          <button class="icon-btn" data-action="table-search" aria-label="Search videos">${I.search}</button>
          <label class="field-btn" style="padding:5px 8px">${I.filter}<select id="table-status" aria-label="Filter by status" style="background:none;border:0;color:inherit;font-size:12.5px">
            ${[["all", "Filter"], ["live", "Live"], ["paused", "Paused"], ["review", "In review"], ["ended", "Ended"]].map(([v, l]) => `<option value="${v}" ${state.tableStatus === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th style="width:34px"><input type="checkbox" aria-label="Select all"></th><th>Video</th><th>Status</th>${s ? '<th class="r">Spend</th>' : ""}<th class="r">Views</th><th class="r">GMV ↓</th><th class="r">CTR</th>${s ? '<th class="r">ROAS</th>' : ""}<th style="width:36px"></th></tr></thead>
        <tbody>${page.map(({ a, b }) => `<tr class="clickable" data-video="${a.id}" data-brand="${b.id}">
          <td><input type="checkbox" aria-label="Select ${esc(a.title)}"></td>
          <td><div class="cell-main"><span class="cell-ic">${icon(a)}</span><div><b>${esc(a.title)}</b><span>${esc(b.name)} · ${esc(a.creator)}</span></div></div></td>
          <td><span class="status ${a.status}">${VSTATUS[a.status]}</span></td>
          ${s ? `<td class="r">${a.spend ? moneyFull(a.spend) : "–"}</td>` : ""}
          <td class="r">${a.impressions ? a.impressions.toLocaleString("en-US") : "–"}</td>
          <td class="r"><b style="font-weight:600">${a.gmv ? moneyFull(a.gmv) : "–"}</b></td>
          <td class="r">${a.ctr ? a.ctr.toFixed(2) + "%" : "–"}</td>
          ${s ? `<td class="r" style="color:${a.roas >= 4 ? "var(--purple-hi)" : "inherit"}">${a.roas ? a.roas.toFixed(1) + "×" : "–"}</td>` : ""}
          <td class="r" style="color:var(--dim)">${I.dots}</td></tr>`).join("") || `<tr><td colspan="9" class="muted" style="text-align:center;padding:24px">No videos match.</td></tr>`}</tbody>
      </table></div>
      <div class="table-foot"><span>Showing ${page.length} of ${rows.length} videos</span>
        <div class="pager"><button class="icon-btn" data-page="prev" aria-label="Previous page" ${state.tablePage <= 1 ? "disabled" : ""}>${I.chevL}</button><span class="num">${state.tablePage} / ${pages}</span><button class="icon-btn" data-page="next" aria-label="Next page" ${state.tablePage >= pages ? "disabled" : ""}>${I.chevR}</button></div></div>`;
  }
  function homeBrands() {
    const all = myBrands().filter((b) => b.series && b.series.length);
    if (state.homeBrand !== "all" && !all.some((b) => b.id === state.homeBrand)) state.homeBrand = "all";
    return { all, brands: state.homeBrand === "all" ? all : all.filter((b) => b.id === state.homeBrand) };
  }
  function viewHome() {
    const { all, brands } = homeBrands();
    const head = (sub) => `<div class="page-head"><div><h1>Agency overview</h1><p>${sub}</p></div>
      <div class="head-actions">${can("results") ? `<button class="btn" data-action="export">${I.download} Export report</button>` : ""}${can("create") ? `<button class="btn primary" data-action="new-video">${I.plus} New video</button>` : ""}</div></div>`;
    if (!all.length) return head("No brands are assigned to you yet.") + '<div class="empty">Ask an admin to give you access to a brand.</div>';
    const k = combined(brands), r = can("results"), s = can("spend");
    const ser = k.series, first = new Date(ser[0].date + "T00:00:00"), last = new Date(ser[ser.length - 1].date + "T00:00:00");
    const range = `${first.toLocaleDateString("en-US", { month: "short" })} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
    const monthName = first.toLocaleDateString("en-US", { month: "long" });
    const prevMonth = new Date(first.getFullYear(), first.getMonth() - 1, 1).toLocaleDateString("en-US", { month: "long" });
    const up = ((k.gmv - k.gmvPrev) / k.gmvPrev) * 100;
    const scope = state.homeBrand === "all" ? (isAdmin() || me().brands === "all" ? "all brands" : `your ${all.length} brands`) : brands[0].name;
    const total = brands.reduce((a, b) => a + b.kpis.gmv, 0);
    const single = brands.length === 1;
    const rankRows = single
      ? brands[0].products.map((p) => [p.name, p.gmv, p.share])
      : [...brands].sort((a, z) => z.kpis.gmv - a.kpis.gmv).map((b) => [b.name, b.kpis.gmv, Math.round((b.kpis.gmv / total) * 100)]);
    const lastNews = (id) => D.news.filter((n) => n.brand === id).sort((a, z) => z.time.localeCompare(a.time))[0];
    return `
      ${head(`Your brands, videos and results. All in one tracker.`)}
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Jump to section">
          ${[["overview", "Overview"], ["videos", "Videos"], ["brand-by-brand", "Brand by brand"]].map(([v, l]) => `<button class="chip" data-jump="${v}" aria-pressed="${state.homeTab === v}">${l}</button>`).join("")}
        </div>
        <div class="toolbar-right">
          <select class="select" id="home-brand" aria-label="Brands shown">
            <option value="all">All brands</option>${all.map((b) => `<option value="${b.id}" ${state.homeBrand === b.id ? "selected" : ""}>${esc(b.name)}</option>`).join("")}
          </select>
          <span class="field-btn">${I.calendar}<span class="num">${range}</span></span>
        </div>
      </div>
      <div id="overview" style="scroll-margin-top:70px;display:flex;flex-direction:column;gap:16px">
      ${kpiCards(k, ser)}
      ${r ? `
      <div class="grid-2">
        <section class="card">
          <div class="card-head">
            <div><h2>GMV overview</h2><span class="sub">Daily GMV across ${esc(scope)}</span></div>
            <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
              <div class="legend"><span><i style="background:#a98bfa"></i>This month</span><span><i style="background:#6b6977"></i>Last month</span></div>
              <select class="select" id="chart-mode" aria-label="Chart detail" style="padding:4px 8px">
                <option value="daily" ${state.chartMode !== "avg" ? "selected" : ""}>Daily</option><option value="avg" ${state.chartMode === "avg" ? "selected" : ""}>7-day average</option>
              </select>
            </div>
          </div>
          <div class="chart">${gmvChart(ser)}</div>
          <div class="sub" style="display:flex;gap:6px;align-items:center;color:var(--purple-hi)">${up >= 0 ? "↗" : "↘"} <span style="color:var(--muted)">GMV is ${up >= 0 ? "up" : "down"} ${Math.abs(up).toFixed(1)}% compared to ${prevMonth}.</span></div>
        </section>
        <section class="card">
          <div class="card-head"><div><h2>Weekly GMV</h2><span class="sub">GMV per week in ${monthName}</span></div></div>
          <div class="big-val"><strong>${moneyFull(k.gmv)}</strong>${delta(k.gmv, k.gmvPrev)}</div>
          <div class="chart">${weekBars(ser)}</div>
          <div class="foot-note">${s && k.budget ? `<span>Monthly ad budget: ${moneyFull(k.budget)}</span><b>${Math.round((k.spend / k.budget) * 100)}% used</b>` : `<span>${brands.reduce((a, b) => a + b.ads.filter((x) => x.status === "live").length, 0)} videos live now</span><b>${brands.length} brand${brands.length === 1 ? "" : "s"}</b>`}</div>
        </section>
      </div>` : ""}
      </div>
      ${r ? `
      <div class="grid-2 wide-right" id="videos" style="scroll-margin-top:70px">
        <section class="card">
          <div class="card-head"><div><h2>${single ? "Top products" : "Top brands"}</h2><span class="sub">${single ? "What sells for " + esc(brands[0].name) : "Where your GMV comes from"}</span></div></div>
          <div class="rank">${rankRows.map(([n, v, p]) => `<div class="rank-row"><span>${esc(n)}</span><b>${moneyFull(v)}</b><small>${p}%</small><div class="track"><i style="width:${p}%"></i></div></div>`).join("")}</div>
          <a href="#brands" style="margin-top:auto;font-size:12.5px;display:flex;justify-content:space-between;align-items:center">View all brands <span aria-hidden="true">↗</span></a>
        </section>
        <section class="card flush" id="vt">${videoTable(brands)}</section>
      </div>` : ""}
      <div class="section-head" id="brand-by-brand" style="scroll-margin-top:70px;margin-top:8px"><div><h2>Brand by brand</h2><span class="sub">Each brand's results for the last 30 days</span></div><a class="btn sm" href="#brands">Open Brands</a></div>
      <div class="brand-results">${brands.map((b) => {
        const n = lastNews(b.id); const [st, tone] = STATUS[b.status];
        return `<article class="br">
          <div class="br-head"><span class="mono" style="${monoBg(b.name)}">${esc(initials(b.name))}</span>
            <div><div class="br-name">${esc(b.name)}</div><div class="sub">${esc(b.category)} · ${esc(b.lead)}</div></div>
            <span class="pill ${tone}">${st}</span></div>
          ${r ? `<div class="br-stats" style="grid-template-columns:repeat(${s ? 4 : 2},minmax(0,1fr))">
            <div><b>${money(b.kpis.gmv)}</b><span>GMV</span></div>
            ${s ? `<div><b>${b.kpis.roas.toFixed(1)}×</b><span>ROAS</span></div><div><b>${money(b.kpis.spend)}</b><span>Spend</span></div>` : ""}
            <div><b>${b.ads.filter((a) => a.status === "live").length}</b><span>Live</span></div>
          </div>
          <div class="spark">${spark(b.series)}</div>
          ${delta(b.kpis.gmv, b.kpis.gmvPrev)}` : locked("Results hidden for your account.")}
          ${n && can("news") ? `<div class="br-news"><span class="pill ${VERDICT[n.verdict][1]}">${n.type === "result" ? "Result" : "News"}</span><b>${esc(n.title)}</b></div>` : ""}
          <a class="btn sm" href="#brand-${b.id}" style="align-self:flex-start">Open ${esc(b.name)}</a>
        </article>`;
      }).join("")}</div>`;
  }
  function exportReport() {
    const { brands } = homeBrands(), s = can("spend");
    const rows = [["Brand", "Status", "GMV (30d)", ...(s ? ["Ad spend", "ROAS"] : []), "CTR %", "Creators", "Videos"]]
      .concat(brands.map((b) => [b.name, STATUS[b.status][0], b.kpis.gmv, ...(s ? [b.kpis.spend, b.kpis.roas] : []), b.kpis.ctr, b.kpis.creators, b.kpis.videos]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    if (window.TRACKER_PREVIEW) return toast("Export downloads a CSV in the installed version. The web preview can't save files.");
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "tracker-report.csv";
      document.body.appendChild(a); a.click(); a.remove();
      toast("Report exported as tracker-report.csv");
    } catch (_) { toast("Export works in the installed version."); }
  }
  function pickBrandForVideo() {
    openModal(`
      <div class="modal-head"><div><h2>New video</h2><p>Which brand is this video for?</p></div><button class="x" data-close aria-label="Close">×</button></div>
      <div class="pick-list">${myBrands().map((b) => `<button class="pick" data-pick-brand="${b.id}"><span class="mono" style="${monoBg(b.name)}">${esc(initials(b.name))}</span><div><b style="font-weight:600">${esc(b.name)}</b><div class="sub">${esc(b.category)}</div></div>${I.chevR}</button>`).join("")}</div>`);
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
      <div class="grid-2 top">
        <section class="feed" aria-label="News feed">
          ${list.length ? Object.entries(days).map(([d, items]) => `
            <div class="day">${new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
            ${items.map(newsPost).join("")}`).join("") : '<div class="empty">No posts match these filters.</div>'}
        </section>
        <aside class="card" style="position:sticky;top:72px">
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
      ${b.series && b.series.length ? kpiCards(b.kpis, b.series) : '<div class="callout">Waiting for the first Euka sync. Results and videos appear here once this brand\'s data comes in.</div>'}
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
      <div class="grid-2 top">
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
      <div class="thumb-top"><span class="v-pill v-${a.status}">${VSTATUS[a.status]}</span><span class="tag">${len}</span></div>
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
  function openVideo(id, brandId) {
    const b = brandById(brandId || state.route.slice(6)); const a = b && b.ads.find((x) => x.id === id);
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
      <div class="table-wrap boxed"><table>
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
      <div class="table-wrap boxed"><table>
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
    if (/how do i use|help|what is tracker|how does tracker/.test(t)) return `Tracker has these areas:\n• **Home**: combined results for ${isAdmin() || me().brands === "all" ? "all brands" : "your brands"}, then each brand below.\n${can("news") ? "• **News**: results and updates from Slack, with an evaluation for each.\n" : ""}• **Brands**: open a brand to see its running videos and their specs.${can("create") ? " Press **Post more** to have the agents make a new video." : ""}\n${isAdmin() ? "• **Employees** and **Connections**: manage people, permissions and accounts.\n" : ""}Use the search bar (⌘K) to jump to any brand or video.`;
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
    renderSide();
    renderTop();
    const r = state.route;
    $("#work").innerHTML = r === "news" ? viewNews() : r === "brands" ? viewBrands() : r === "employees" ? viewEmployees() : r === "connections" ? viewConnections() : r.startsWith("brand-") ? viewBrand(r.slice(6)) : viewHome();
    const b = r.startsWith("brand-") && brandById(r.slice(6));
    document.title = (b ? b.name : { home: "Home", news: "News", brands: "Brands", employees: "Employees", connections: "Connections" }[r]) + " · Tracker";
    renderAssistant();
    if (state.pendingVideo && r.startsWith("brand-")) { const v = state.pendingVideo; state.pendingVideo = null; openVideo(v); }
  }

  function setNavOpen(open) { document.body.classList.toggle("nav-open", open); $("#nav-scrim").hidden = !open; }
  function refreshTable() {
    const vt = $("#vt"); if (!vt) return;
    vt.innerHTML = videoTable(homeBrands().brands);
    const q = $("#table-q"); if (q && state.tableSearch) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  try { if (localStorage.getItem("tracker-collapsed") === "1") document.body.classList.add("collapsed"); } catch (_) {}

  window.addEventListener("hashchange", () => { state.videoFilter = "all"; state.tablePage = 1; setNavOpen(false); closeOverlays(); render(); window.scrollTo({ top: 0 }); });
  document.addEventListener("change", (e) => {
    const id = e.target.id;
    if (id === "viewer") { state.user = e.target.value; state.chat = []; state.homeBrand = "all"; render(); toast(`Now viewing as ${me().name}.`); }
    if (id === "news-brand") { state.newsBrand = e.target.value; render(); }
    if (id === "home-brand") { state.homeBrand = e.target.value; state.tablePage = 1; render(); }
    if (id === "chart-mode") { state.chartMode = e.target.value; render(); }
    if (id === "table-status") { state.tableStatus = e.target.value; state.tablePage = 1; refreshTable(); }
    if (e.target.name === "brand-all") $$("[name=brand]").forEach((i) => (i.checked = e.target.checked));
    if (e.target.name === "brand" && !e.target.checked) { const a = $("[name=brand-all]"); if (a) a.checked = false; }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "search") searchResults(e.target.value);
    if (e.target.id === "table-q") { state.tableQuery = e.target.value; state.tablePage = 1; refreshTable(); }
  });
  document.addEventListener("focusout", (e) => {
    if (e.target.id === "search") setTimeout(() => { const box = $("#search-results"); if (box && !box.contains(document.activeElement)) box.hidden = true; }, 150);
  });
  document.addEventListener("click", (e) => {
    const sv = e.target.closest("[data-open-video]");
    if (sv) state.pendingVideo = sv.dataset.openVideo;
    const sr = e.target.closest("#search-results a");
    if (sr) { $("#search-results").hidden = true; if (location.hash === sr.getAttribute("href")) { e.preventDefault(); render(); } return; }
    const row = e.target.closest("tr[data-video]");
    if (row && !e.target.closest("input")) return openVideo(row.dataset.video, row.dataset.brand);
    const t = e.target.closest("button, [data-close]"); if (!t) return;
    if (t.matches("[data-close]")) return closeOverlays();
    if (t.id === "toggle-side") {
      if (window.matchMedia("(max-width: 900px)").matches) return setNavOpen(!document.body.classList.contains("nav-open"));
      const c = document.body.classList.toggle("collapsed");
      try { localStorage.setItem("tracker-collapsed", c ? "1" : "0"); } catch (_) {}
      return;
    }
    if (t.dataset.jump) {
      state.homeTab = t.dataset.jump;
      $$("[data-jump]").forEach((c) => c.setAttribute("aria-pressed", c === t));
      const el = document.getElementById(t.dataset.jump);
      if (el) el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      return;
    }
    if (t.dataset.page) { state.tablePage += t.dataset.page === "next" ? 1 : -1; return refreshTable(); }
    if (t.dataset.pickBrand) return postMore(t.dataset.pickBrand);
    if (t.dataset.newsType) { state.newsType = t.dataset.newsType; return render(); }
    if (t.dataset.vfilter) { state.videoFilter = t.dataset.vfilter; return render(); }
    if (t.dataset.video) return openVideo(t.dataset.video, t.dataset.brand);
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
    else if (act === "new-video") pickBrandForVideo();
    else if (act === "export") exportReport();
    else if (act === "help") { setNavOpen(false); ask("How do I use Tracker?"); }
    else if (act === "table-search") { state.tableSearch = !state.tableSearch; if (!state.tableSearch) state.tableQuery = ""; refreshTable(); }
    else if (act === "toggle-acct") { const a = D.accounts[t.dataset.brand][+t.dataset.i]; a.connected = !a.connected; render(); toast(`${a.platform} ${a.handle} ${a.connected ? "connected" : "disconnected"} (demo).`); }
  });
  $("#scrim").addEventListener("click", closeOverlays);
  $("#nav-scrim").addEventListener("click", () => setNavOpen(false));
  document.addEventListener("submit", (e) => { if (e.target.id === "as-form") { e.preventDefault(); const i = $("#as-input"); const q = i.value; i.value = ""; ask(q); } });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); const s = $("#search"); if (s) s.focus(); return; }
    if (e.key === "Enter" && e.target.id === "search") { const f = $("#search-results a"); if (f) { e.preventDefault(); f.click(); } return; }
    if (e.key !== "Escape") return;
    if (e.target.id === "search") { e.target.value = ""; $("#search-results").hidden = true; return; }
    if (document.body.classList.contains("nav-open")) setNavOpen(false);
    else if (!$("#modal").hidden || !$("#drawer").hidden) closeOverlays();
    else if (state.chatOpen) { state.chatOpen = false; renderAssistant(); }
  });

  render();
})();
