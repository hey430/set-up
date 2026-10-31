/*
 * SAMPLE DATA — every brand, ad, number and message below is made up.
 *
 * When the real Euka and Slack data is ready, this file is the only thing
 * that changes: a small sync script (see README) will write the same shape
 * from the live APIs. The page itself never needs to know where it came from.
 */
(function () {
  // Small seeded random so the sample charts look the same on every load.
  function rng(seed) {
    let s = seed;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  // 30 days of GMV and ad spend for the sample charts.
  function series(seed, gmvBase, spendBase, trend) {
    const r = rng(seed);
    const out = [];
    const end = new Date("2026-10-30T00:00:00");
    for (let i = 29; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      const t = (29 - i) / 29;
      const lift = 1 + trend * t;
      const weekend = d.getDay() === 0 || d.getDay() === 6 ? 1.18 : 1;
      out.push({
        date: d.toISOString().slice(0, 10),
        gmv: Math.round(gmvBase * lift * weekend * (0.82 + r() * 0.36)),
        spend: Math.round(spendBase * (0.9 + t * 0.2) * (0.85 + r() * 0.3)),
      });
    }
    return out;
  }

  window.DASHBOARD_DATA = {
    agency: "Your Agency",
    lastSync: { euka: "2026-10-31T09:42:00", slack: "2026-10-31T09:45:00" },

    brands: [
      {
        id: "lumora-skin",
        name: "Lumora Skin",
        category: "Beauty · Skincare",
        lead: "Priya N.",
        status: "on-track",
        statusNote: "ROAS above target for 3 weeks",
        retainerStart: "2025-03-01",
        monthlyBudget: 42000,
        goal: "Grow TikTok Shop GMV to $250K/mo by Q1",
        kpis: { gmv: 186400, gmvPrev: 151200, spend: 38900, spendPrev: 35100, roas: 4.79, roasPrev: 4.31, ctr: 2.84, ctrPrev: 2.51, creators: 64, creatorsPrev: 51, videos: 212, videosPrev: 168 },
        series: series(11, 5600, 1250, 0.35),
        products: [
          { name: "Barrier Repair Serum 30ml", gmv: 78200, units: 2790, share: 42 },
          { name: "Overnight Glow Mask", gmv: 51100, units: 1640, share: 27 },
          { name: "SPF 50 Daily Fluid", gmv: 33600, units: 1490, share: 18 },
          { name: "Mini Routine Kit", gmv: 23500, units: 940, share: 13 },
        ],
        ads: [
          { id: "LS-1042", title: "Morning routine in 30 seconds", creator: "@glowwithmaya", status: "live", launched: "2026-10-27", format: "Spark Ad · UGC video", duration: 31, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Barrier Repair Serum 30ml", hook: "\"I stopped using 5 products and switched to one\"", cta: "Shop now", audience: "Women 18–34 · Skincare interest · US", budget: 600, spend: 3420, impressions: 412000, ctr: 3.4, cvr: 4.1, roas: 5.6, gmv: 19150, hue: 336 },
          { id: "LS-1039", title: "Dermatologist reacts", creator: "@drkellyskin", status: "live", launched: "2026-10-22", format: "Spark Ad · Stitch", duration: 46, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "SPF 50 Daily Fluid", hook: "\"Is this SPF actually good? Let's check the label\"", cta: "Shop now", audience: "All 21–44 · Beauty & personal care · US", budget: 450, spend: 4100, impressions: 388000, ctr: 2.9, cvr: 3.6, roas: 4.4, gmv: 18040, hue: 18 },
          { id: "LS-1035", title: "Mask before / after", creator: "@itsjuliacho", status: "paused", launched: "2026-10-16", format: "In-feed video", duration: 22, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Overnight Glow Mask", hook: "\"Night 1 vs night 7\"", cta: "Shop now", audience: "Women 18–30 · US", budget: 300, spend: 2650, impressions: 301000, ctr: 2.2, cvr: 2.4, roas: 2.9, gmv: 7690, hue: 268 },
          { id: "LS-1031", title: "Kit unboxing ASMR", creator: "@quietunbox", status: "ended", launched: "2026-10-09", format: "Spark Ad · UGC video", duration: 18, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Mini Routine Kit", hook: "No voiceover, packaging sounds only", cta: "Shop now", audience: "All 18–34 · Gifting · US", budget: 250, spend: 1980, impressions: 266000, ctr: 2.6, cvr: 3.1, roas: 4.1, gmv: 8120, hue: 196 },
          { id: "LS-1046", title: "LIVE replay: serum Q&A", creator: "@lumoraskin", status: "review", launched: "2026-10-30", format: "LIVE Shopping clip", duration: 58, ratio: "9:16", resolution: "1080×1920", placement: "TikTok LIVE + feed", objective: "LIVE shopping", product: "Barrier Repair Serum 30ml", hook: "\"Your top 5 questions, answered live\"", cta: "Watch LIVE", audience: "Followers + lookalike · US", budget: 400, spend: 0, impressions: 0, ctr: 0, cvr: 0, roas: 0, gmv: 0, hue: 300 },
        ],
        slack: [
          { channel: "#client-lumora", author: "Priya N.", time: "2026-10-31T09:12:00", text: "Serum Spark Ad from @glowwithmaya passed 5x ROAS. Raising daily budget to $800 from Monday unless the client objects." },
          { channel: "#client-lumora", author: "Lumora (Hannah)", time: "2026-10-30T16:40:00", text: "Approved the LIVE replay clip. Can we push the SPF more going into November?" },
          { channel: "#client-lumora", author: "Marco R.", time: "2026-10-30T11:05:00", text: "Paused the mask before/after. CVR dropped under 2.5% after day 10. Briefing two new hooks." },
        ],
      },
      {
        id: "fernhollow-coffee",
        name: "Fernhollow Coffee",
        category: "Food & drink · Coffee",
        lead: "Marco R.",
        status: "attention",
        statusNote: "Spend up 22%, ROAS down",
        retainerStart: "2025-08-15",
        monthlyBudget: 18000,
        goal: "Hold ROAS above 3.5 while scaling subscriptions",
        kpis: { gmv: 54800, gmvPrev: 58900, spend: 17900, spendPrev: 14700, roas: 3.06, roasPrev: 4.01, ctr: 1.92, ctrPrev: 2.2, creators: 22, creatorsPrev: 24, videos: 71, videosPrev: 80 },
        series: series(23, 1950, 560, -0.1),
        products: [
          { name: "Single Origin Sampler", gmv: 21400, units: 1070, share: 39 },
          { name: "Cold Brew Bags (12)", gmv: 17900, units: 1190, share: 33 },
          { name: "Monthly Subscription", gmv: 11300, units: 377, share: 21 },
          { name: "Pour-over Kit", gmv: 4200, units: 84, share: 7 },
        ],
        ads: [
          { id: "FC-0418", title: "Cold brew in 3 steps", creator: "@brewedbysam", status: "live", launched: "2026-10-25", format: "Spark Ad · UGC video", duration: 24, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Cold Brew Bags (12)", hook: "\"Stop paying $7 for cold brew\"", cta: "Shop now", audience: "All 21–40 · Coffee · US", budget: 350, spend: 2910, impressions: 244000, ctr: 2.1, cvr: 3.0, roas: 3.4, gmv: 9890, hue: 28 },
          { id: "FC-0412", title: "Blind taste test", creator: "@officehours.tv", status: "live", launched: "2026-10-18", format: "In-feed video", duration: 39, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Single Origin Sampler", hook: "\"Can my coworkers tell the $40 bag apart?\"", cta: "Shop now", audience: "All 22–45 · US", budget: 400, spend: 4800, impressions: 410000, ctr: 1.7, cvr: 2.1, roas: 2.6, gmv: 12480, hue: 40 },
          { id: "FC-0405", title: "Subscription unboxing", creator: "@kaylabrews", status: "ended", launched: "2026-10-04", format: "Spark Ad · UGC video", duration: 27, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Monthly Subscription", hook: "\"What $22 of coffee looks like\"", cta: "Shop now", audience: "Women 25–44 · US", budget: 250, spend: 2200, impressions: 198000, ctr: 2.3, cvr: 2.8, roas: 3.8, gmv: 8360, hue: 12 },
        ],
        slack: [
          { channel: "#client-fernhollow", author: "Marco R.", time: "2026-10-31T08:30:00", text: "Taste-test ad is fatiguing. Frequency 3.9. Proposing we cap it and move budget to the cold brew creative." },
          { channel: "#client-fernhollow", author: "Fernhollow (Leo)", time: "2026-10-29T14:22:00", text: "Holiday bundle lands Nov 10. Can we line up 6 creators for it?" },
        ],
      },
      {
        id: "pawsome-pantry",
        name: "Pawsome Pantry",
        category: "Pets · Treats",
        lead: "Dana K.",
        status: "on-track",
        statusNote: "New creator cohort performing",
        retainerStart: "2026-01-10",
        monthlyBudget: 24000,
        goal: "Launch freeze-dried line to 100 creators",
        kpis: { gmv: 97300, gmvPrev: 80100, spend: 22400, spendPrev: 21000, roas: 4.34, roasPrev: 3.81, ctr: 3.12, ctrPrev: 2.95, creators: 88, creatorsPrev: 61, videos: 164, videosPrev: 129 },
        series: series(37, 2900, 720, 0.28),
        products: [
          { name: "Freeze-dried Salmon Bites", gmv: 41200, units: 2290, share: 42 },
          { name: "Dental Chews (30)", gmv: 30100, units: 1500, share: 31 },
          { name: "Puppy Starter Pack", gmv: 26000, units: 650, share: 27 },
        ],
        ads: [
          { id: "PP-2207", title: "Picky eater test", creator: "@bentleythecorgi", status: "live", launched: "2026-10-28", format: "Spark Ad · UGC video", duration: 19, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Freeze-dried Salmon Bites", hook: "\"He refuses everything. Except this.\"", cta: "Shop now", audience: "Dog owners 22–45 · US", budget: 500, spend: 1760, impressions: 290000, ctr: 4.2, cvr: 4.8, roas: 6.1, gmv: 10740, hue: 160 },
          { id: "PP-2201", title: "Vet tech explains chews", creator: "@vettechval", status: "live", launched: "2026-10-20", format: "In-feed video", duration: 44, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Dental Chews (30)", hook: "\"3 signs your dog's teeth need help\"", cta: "Shop now", audience: "Pet owners 25–54 · US", budget: 400, spend: 3550, impressions: 340000, ctr: 2.8, cvr: 3.3, roas: 4.0, gmv: 14200, hue: 204 },
          { id: "PP-2195", title: "New puppy haul", creator: "@milo.and.me", status: "ended", launched: "2026-10-08", format: "Spark Ad · UGC video", duration: 33, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Puppy Starter Pack", hook: "\"Everything I bought for week one\"", cta: "Shop now", audience: "New pet owners 20–35 · US", budget: 300, spend: 2700, impressions: 255000, ctr: 3.0, cvr: 2.9, roas: 3.5, gmv: 9450, hue: 48 },
          { id: "PP-2209", title: "Cat version: salmon bites", creator: "@luna.the.void", status: "review", launched: "2026-10-31", format: "Spark Ad · UGC video", duration: 16, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Freeze-dried Salmon Bites", hook: "\"Cats can have these too?\"", cta: "Shop now", audience: "Cat owners 20–40 · US", budget: 300, spend: 0, impressions: 0, ctr: 0, cvr: 0, roas: 0, gmv: 0, hue: 250 },
        ],
        slack: [
          { channel: "#client-pawsome", author: "Dana K.", time: "2026-10-31T10:02:00", text: "27 new creators onboarded through Euka this week. Samples ship Monday." },
          { channel: "#client-pawsome", author: "Pawsome (Rita)", time: "2026-10-30T09:15:00", text: "Loving the corgi video. More of that energy please!" },
        ],
      },
      {
        id: "tidewell-hydration",
        name: "Tidewell Hydration",
        category: "Health · Supplements",
        lead: "Priya N.",
        status: "at-risk",
        statusNote: "Two ads rejected in review",
        retainerStart: "2026-05-02",
        monthlyBudget: 15000,
        goal: "Reach break-even ROAS of 2.5 on the starter pack",
        kpis: { gmv: 29800, gmvPrev: 33400, spend: 13600, spendPrev: 12100, roas: 2.19, roasPrev: 2.76, ctr: 1.41, ctrPrev: 1.66, creators: 14, creatorsPrev: 17, videos: 38, videosPrev: 49 },
        series: series(53, 1100, 430, -0.15),
        products: [
          { name: "Electrolyte Sticks (30)", gmv: 18200, units: 760, share: 61 },
          { name: "Starter Pack", gmv: 11600, units: 390, share: 39 },
        ],
        ads: [
          { id: "TW-0311", title: "Gym bag essentials", creator: "@liftwithjo", status: "live", launched: "2026-10-24", format: "Spark Ad · UGC video", duration: 21, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Electrolyte Sticks (30)", hook: "\"What's actually in my gym bag\"", cta: "Shop now", audience: "All 18–34 · Fitness · US", budget: 300, spend: 2240, impressions: 210000, ctr: 1.6, cvr: 2.2, roas: 2.7, gmv: 6050, hue: 190 },
          { id: "TW-0308", title: "Hangover myth busting", creator: "@nursebex", status: "paused", launched: "2026-10-15", format: "In-feed video", duration: 37, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Starter Pack", hook: "\"Electrolytes won't fix that, but here's what helps\"", cta: "Learn more", audience: "All 21–35 · US", budget: 250, spend: 1890, impressions: 176000, ctr: 1.2, cvr: 1.5, roas: 1.6, gmv: 3020, hue: 214 },
        ],
        slack: [
          { channel: "#client-tidewell", author: "Priya N.", time: "2026-10-30T17:48:00", text: "Two creatives rejected for health claims. Rewriting scripts with compliance-safe wording." },
        ],
      },
      {
        id: "ridgeline-active",
        name: "Ridgeline Active",
        category: "Apparel · Activewear",
        lead: "Dana K.",
        status: "on-track",
        statusNote: "Leggings restock selling through",
        retainerStart: "2025-11-20",
        monthlyBudget: 36000,
        goal: "Make leggings the #1 activewear SKU on TikTok Shop US",
        kpis: { gmv: 142900, gmvPrev: 128300, spend: 33200, spendPrev: 31800, roas: 4.3, roasPrev: 4.03, ctr: 2.47, ctrPrev: 2.39, creators: 71, creatorsPrev: 66, videos: 190, videosPrev: 177 },
        series: series(71, 4400, 1080, 0.12),
        products: [
          { name: "Contour Leggings", gmv: 79300, units: 1980, share: 55 },
          { name: "Seamless Sports Bra", gmv: 38600, units: 1290, share: 27 },
          { name: "Trail Shorts", gmv: 25000, units: 830, share: 18 },
        ],
        ads: [
          { id: "RA-0907", title: "Squat-proof test", creator: "@coachameliaf", status: "live", launched: "2026-10-26", format: "Spark Ad · UGC video", duration: 15, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Contour Leggings", hook: "\"Testing $38 leggings vs $120 ones\"", cta: "Shop now", audience: "Women 18–34 · Fitness · US", budget: 700, spend: 5100, impressions: 560000, ctr: 2.9, cvr: 3.5, roas: 5.1, gmv: 26010, hue: 280 },
          { id: "RA-0902", title: "Fit check: 5 body types", creator: "@ridgelineactive", status: "live", launched: "2026-10-19", format: "Carousel", duration: 0, ratio: "9:16", resolution: "1080×1920 · 6 images", placement: "TikTok For You feed", objective: "Product sales", product: "Seamless Sports Bra", hook: "Same set, five team members", cta: "Shop now", audience: "Women 18–44 · US", budget: 400, spend: 3800, impressions: 402000, ctr: 2.2, cvr: 2.7, roas: 3.9, gmv: 14820, hue: 8 },
          { id: "RA-0896", title: "Trail run POV", creator: "@milesmorgan", status: "ended", launched: "2026-10-05", format: "In-feed video", duration: 28, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Trail Shorts", hook: "\"6am, 8 miles, zero chafing\"", cta: "Shop now", audience: "All 20–40 · Running · US", budget: 300, spend: 2900, impressions: 280000, ctr: 2.0, cvr: 2.3, roas: 3.2, gmv: 9280, hue: 140 },
        ],
        slack: [
          { channel: "#client-ridgeline", author: "Dana K.", time: "2026-10-31T07:55:00", text: "Restock is live. Squat-proof ad already at 5.1 ROAS. Asking Amelia for two more variations." },
          { channel: "#client-ridgeline", author: "Ridgeline (Tom)", time: "2026-10-29T12:10:00", text: "Black Friday pricing locked. Sending the brief Friday." },
        ],
      },
      {
        id: "marigold-home",
        name: "Marigold Home",
        category: "Home · Candles & decor",
        lead: "Marco R.",
        status: "attention",
        statusNote: "Creator posting slowed",
        retainerStart: "2026-07-01",
        monthlyBudget: 12000,
        goal: "Build a gifting creator roster before holidays",
        kpis: { gmv: 38200, gmvPrev: 36900, spend: 11400, spendPrev: 10200, roas: 3.35, roasPrev: 3.62, ctr: 2.05, ctrPrev: 2.18, creators: 19, creatorsPrev: 26, videos: 44, videosPrev: 63 },
        series: series(89, 1250, 370, 0.04),
        products: [
          { name: "Fig & Amber Candle", gmv: 19800, units: 660, share: 52 },
          { name: "Linen Room Spray", gmv: 11100, units: 555, share: 29 },
          { name: "Gift Trio", gmv: 7300, units: 146, share: 19 },
        ],
        ads: [
          { id: "MH-0128", title: "Cozy apartment reset", creator: "@slowsundays", status: "live", launched: "2026-10-23", format: "Spark Ad · UGC video", duration: 34, ratio: "9:16", resolution: "1080×1920", placement: "TikTok For You feed", objective: "Product sales", product: "Fig & Amber Candle", hook: "\"Making my place smell like a boutique hotel\"", cta: "Shop now", audience: "Women 22–40 · Home decor · US", budget: 250, spend: 2100, impressions: 215000, ctr: 2.4, cvr: 2.9, roas: 3.9, gmv: 8190, hue: 34 },
          { id: "MH-0124", title: "Gift guide under $50", creator: "@giftsbygrace", status: "review", launched: "2026-10-30", format: "Carousel", duration: 0, ratio: "9:16", resolution: "1080×1920 · 5 images", placement: "TikTok For You feed", objective: "Product sales", product: "Gift Trio", hook: "\"Gifts that look expensive but aren't\"", cta: "Shop now", audience: "All 25–54 · Gifting · US", budget: 300, spend: 0, impressions: 0, ctr: 0, cvr: 0, roas: 0, gmv: 0, hue: 350 },
        ],
        slack: [
          { channel: "#client-marigold", author: "Marco R.", time: "2026-10-30T15:30:00", text: "7 creators haven't posted since samples arrived. Sending reminders through Euka today." },
        ],
      },
    ],
  };
})();
