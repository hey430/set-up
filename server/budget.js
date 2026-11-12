// Tracker's credit budget: makes a month of Higgsfield credits last the month.
//
// The rules (defaults chosen for a 600-credit plan; an admin can change them):
//   1. Budget against the REAL Higgsfield balance when connected, because
//      credits also get spent directly in Higgsfield, outside Tracker.
//   2. Keep a reserve (10%) that only an admin can use, for urgent re-dos.
//   3. Pace the rest week by week: each week may use its fair share of what is
//      left until the credits renew. Unused credits roll into later weeks.
//   4. No single request may cost more than the cap (75 credits = one
//      ad-quality 15-second video).
"use strict";

const DAY = 864e5;
const DEFAULTS = { monthly: 600, renewDay: 1, reservePct: 10, requestCap: 75 };

// Prices were read from Higgsfield on 12 Nov 2026 for vertical 720p video.
// When Higgsfield is connected, Tracker asks for the real price before charging.
const TIERS = [
  { key: "draft", label: "Draft", perSec: 1, lengths: [5, 10, 15], model: "seedance_2_0_mini", params: { resolution: "720p" }, note: "Cheapest. Good for testing an idea before spending more." },
  { key: "standard", label: "Standard", perSec: 2.5, lengths: [5, 10, 15], model: "seedance_2_0", params: { resolution: "720p", mode: "fast" }, note: "Better motion and detail. A sensible default for posts." },
  { key: "ad", label: "Ad quality", perSec: 5, lengths: [15], model: "marketing_studio_video", params: { resolution: "720p" }, note: "Higgsfield's ad model, made for TikTok and Reels." },
];
const tier = (key) => TIERS.find((t) => t.key === key) || null;
const estimate = (t, seconds, variations) => Math.round(t.perSec * seconds * variations * 10) / 10;

function settings(db) {
  const s = { ...DEFAULTS, ...db.setting("budget", {}) };
  s.reserve = Math.round((s.monthly * s.reservePct) / 100);
  return s;
}

// The current credit cycle: from the last renewal day to the next one.
function cycle(now, renewDay) {
  const d = new Date(now);
  const at = (y, m) => new Date(y, m, Math.min(renewDay, new Date(y, m + 1, 0).getDate()));
  let start = at(d.getFullYear(), d.getMonth());
  if (start > d) start = at(d.getFullYear(), d.getMonth() - 1);
  const end = at(start.getFullYear(), start.getMonth() + 1);
  const days = Math.round((end - start) / DAY);
  const week = Math.floor((d - start) / (7 * DAY));
  const weekStart = new Date(start.getTime() + week * 7 * DAY);
  const weekEnd = new Date(Math.min(end.getTime(), weekStart.getTime() + 7 * DAY));
  return { start, end, days, weekStart, weekEnd, daysLeft: Math.max(1, Math.ceil((end - d) / DAY)), daysLeftAtWeekStart: Math.max(1, Math.round((end - weekStart) / DAY)) };
}

// The pacing sum on its own, so it can be checked with plain numbers.
//   left         credits available right now (real balance, or budget minus Tracker's spending)
//   spentWeek    what Tracker has already spent in the current week
function pace({ left, reserve, spentWeek, daysLeftAtWeekStart }) {
  const teamLeft = Math.max(0, left - reserve);
  const share = Math.min(1, 7 / daysLeftAtWeekStart);       // this week's fair share of what remains
  const weekAllowance = (teamLeft + spentWeek) * share;      // judged as of the start of the week
  const weekLeft = Math.max(0, Math.min(teamLeft, weekAllowance - spentWeek));
  const round = (n) => Math.floor(n * 10) / 10;
  return { teamLeft: round(teamLeft), weekAllowance: round(weekAllowance), weekLeft: round(weekLeft) };
}

function summary(db, { now = Date.now(), balance = null, connected = balance !== null } = {}) {
  const s = settings(db), c = cycle(now, s.renewDay);
  // Practice runs made before Higgsfield was connected don't count against real credits.
  const sim = connected ? 0 : 1;
  const sum = (since) => db.get("SELECT COALESCE(SUM(credits), 0) AS n FROM charges WHERE status != 'released' AND simulated = ? AND created_at >= ?", sim, since.getTime()).n;
  const spentCycle = sum(c.start), spentWeek = sum(c.weekStart);
  const pending = db.get("SELECT COALESCE(SUM(credits), 0) AS n FROM charges WHERE status = 'reserved' AND simulated = 0").n;
  const left = balance !== null ? Math.max(0, balance - pending) : Math.max(0, s.monthly - spentCycle);
  const p = pace({ left, reserve: s.reserve, spentWeek, daysLeftAtWeekStart: c.daysLeftAtWeekStart });
  return {
    connected, balance, left: Math.round(left * 10) / 10,
    monthly: s.monthly, reserve: s.reserve, reservePct: s.reservePct, requestCap: s.requestCap, renewDay: s.renewDay,
    renewsOn: c.end.toISOString(), daysLeft: c.daysLeft, weekResets: c.weekEnd.toISOString(),
    spentCycle: Math.round(spentCycle * 10) / 10, spentWeek: Math.round(spentWeek * 10) / 10, ...p,
  };
}

// Can this person spend `cost` credits now? Returns { ok } or { ok: false, reason }.
function check(sum, { cost, isAdmin }) {
  const c = (n) => `${Math.round(n * 10) / 10} credit${Math.round(n * 10) / 10 === 1 ? "" : "s"}`;
  const when = new Date(sum.weekResets).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  if (cost > sum.left) return { ok: false, reason: `This costs ${c(cost)} and only ${c(sum.left)} are left until the credits renew.` };
  if (isAdmin) return { ok: true }; // an admin may go past the weekly pace and into the reserve
  if (cost > sum.requestCap) return { ok: false, reason: `This costs ${c(cost)}. One request can use ${c(sum.requestCap)} at most. Pick a lower quality, a shorter length or fewer variations.` };
  if (cost > sum.teamLeft) return { ok: false, reason: `This costs ${c(cost)}. The team's credits for this month are used up; the remaining ${c(sum.left)} are the admin's reserve.` };
  if (cost > sum.weekLeft) return { ok: false, reason: `This costs ${c(cost)} and ${c(sum.weekLeft)} are left in this week's allowance. Pick a lower quality or shorter length, or wait until ${when} when the next week's credits unlock.` };
  return { ok: true };
}

function byBrand(db, { now = Date.now(), connected }) {
  const c = cycle(now, settings(db).renewDay);
  return db.all("SELECT brand_id AS brand, ROUND(SUM(credits), 1) AS credits, COUNT(*) AS requests FROM charges WHERE status != 'released' AND simulated = ? AND created_at >= ? GROUP BY brand_id ORDER BY credits DESC", connected ? 0 : 1, c.start.getTime());
}

module.exports = { DEFAULTS, TIERS, tier, estimate, settings, cycle, pace, summary, check, byBrand };
