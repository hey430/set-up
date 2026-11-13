// Tracker's connection to Slack.
//
// The admin creates a small Slack app inside the agency's own workspace and
// pastes its bot token into Tracker once. Tracker then reads the channels the
// admin picks (and that the app has been invited to), on a timer. It only
// reads; it never posts. The token stays in the local database.
"use strict";

const API = () => process.env.SLACK_API_URL || "https://slack.com/api";
const DAY = 864e5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class SlackError extends Error { constructor(code, message) { super(message); this.code = code; } }
const DEAD_TOKEN = ["invalid_auth", "token_revoked", "account_inactive", "not_authed", "token_expired"];
const FRIENDLY = {
  invalid_auth: "Slack didn't accept that token. Copy the Bot User OAuth Token from your Slack app again.",
  not_authed: "Slack didn't accept that token. Copy the Bot User OAuth Token from your Slack app again.",
  token_revoked: "That Slack token was revoked. Reinstall the Slack app and paste the new token.",
  account_inactive: "That Slack token no longer works. Reinstall the Slack app and paste the new token.",
  missing_scope: "The Slack app is missing a permission. Create it from the manifest in the README, reinstall it, and try again.",
  ratelimited: "Slack asked Tracker to slow down. Try again in a minute.",
};
// Housekeeping messages that say nothing about the work.
const SKIP = new Set(["channel_join", "channel_leave", "channel_topic", "channel_purpose", "channel_name", "channel_archive", "channel_unarchive", "pinned_item", "unpinned_item", "bot_add", "bot_remove", "group_join", "group_leave", "joiner_notification", "reminder_add", "ekm_access_denied"]);

function create(db) {
  const saved = () => db.setting("slack", null);
  const connected = () => !!(saved() && saved().token);
  const flag = (on) => db.setSetting("connections", { ...db.setting("connections", { slack: false, euka: false, higgsfield: false, claude: false }), slack: on });

  async function call(method, params = {}, token = (saved() || {}).token, attempt = 0) {
    let res;
    try { res = await fetch(`${API()}/${method}?${new URLSearchParams(params)}`, { headers: { Authorization: "Bearer " + token }, signal: AbortSignal.timeout(20_000) }); }
    catch { throw new SlackError("unreachable", "Couldn't reach Slack. Check the internet connection and try again."); }
    if (res.status === 429 && attempt < 2) {
      await sleep(Math.min(30, Number(res.headers.get("retry-after")) || 0) * 1000 + 50);
      return call(method, params, token, attempt + 1);
    }
    let body = null;
    try { body = await res.json(); } catch {}
    if (!body) throw new SlackError("unreadable", `Slack answered with an error (${res.status}).`);
    if (!body.ok) {
      if (DEAD_TOKEN.includes(body.error) && saved() && token === saved().token) forget(); // the saved token stopped working
      throw new SlackError(body.error, FRIENDLY[body.error] || `Slack reported a problem (${body.error}).`);
    }
    return body;
  }
  function forget() { db.setSetting("slack", null); flag(false); }

  async function connect(token) {
    token = String(token || "").trim();
    if (!/^xoxb-[A-Za-z0-9-]{20,}$/.test(token)) throw new SlackError("bad_token", "That isn't a bot token. In your Slack app, open “OAuth & Permissions” and copy the Bot User OAuth Token; it starts with xoxb-.");
    const who = await call("auth.test", {}, token);
    db.setSetting("slack", { token, team: who.team || "your workspace", teamId: who.team_id || "", botUserId: who.user_id || "", connectedAt: Date.now() });
    flag(true);
    await refreshChannels();
  }
  // Stops reading Slack and forgets the token. Messages already collected stay in Tracker.
  function disconnect() { forget(); }

  // The channels the app can see, kept in step with Slack. Choices the admin made are preserved.
  async function refreshChannels() {
    const seen = new Set();
    let cursor = "";
    for (let page = 0; page < 10; page++) {
      const out = await call("conversations.list", { types: "public_channel,private_channel", exclude_archived: "true", limit: "200", ...(cursor ? { cursor } : {}) });
      for (const c of out.channels || []) {
        seen.add(c.id);
        db.run(`INSERT INTO slack_channels (id, name, private, member, members) VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET name = excluded.name, private = excluded.private, member = excluded.member, members = excluded.members`,
          c.id, c.name, c.is_private ? 1 : 0, c.is_member ? 1 : 0, c.num_members || 0);
      }
      cursor = (out.response_metadata || {}).next_cursor || "";
      if (!cursor) break;
    }
    for (const row of db.all("SELECT id FROM slack_channels")) if (!seen.has(row.id)) db.run("UPDATE slack_channels SET member = 0, error = 'This channel is archived or no longer visible to the Slack app.' WHERE id = ?", row.id);
    db.run("UPDATE slack_channels SET error = NULL WHERE member = 1");
  }

  // The admin's choice: which channels to read, and who may see each one's messages.
  function setChannels(list, brandExists) {
    for (const c of Array.isArray(list) ? list : []) {
      if (!c || typeof c.id !== "string" || !db.get("SELECT 1 AS x FROM slack_channels WHERE id = ?", c.id)) continue;
      const brand = typeof c.brand === "string" && brandExists(c.brand) ? c.brand : null; // null = admins only
      db.run("UPDATE slack_channels SET watched = ?, brand_id = ? WHERE id = ?", c.watched ? 1 : 0, brand, c.id);
    }
  }

  async function userName(id) {
    const hit = db.get("SELECT name FROM slack_users WHERE id = ?", id);
    if (hit) return hit.name;
    let name = "Someone";
    try {
      const u = (await call("users.info", { user: id })).user || {};
      name = (u.profile && (u.profile.display_name || u.profile.real_name)) || u.real_name || u.name || name;
    } catch (e) { if (DEAD_TOKEN.includes(e.code)) throw e; }
    db.run("INSERT OR REPLACE INTO slack_users (id, name) VALUES (?, ?)", id, name);
    return name;
  }
  // Slack writes mentions and links in its own shorthand; turn it into plain text.
  async function clean(text) {
    let out = String(text || "");
    for (const id of new Set([...out.matchAll(/<@([UW][A-Z0-9]+)(?:\|[^>]*)?>/g)].map((m) => m[1]))) {
      out = out.replaceAll(new RegExp(`<@${id}(?:\\|[^>]*)?>`, "g"), "@" + (await userName(id)));
    }
    out = out
      .replace(/<#(C[A-Z0-9]+)\|([^>]*)>/g, (_, id, n) => "#" + (n || (db.get("SELECT name FROM slack_channels WHERE id = ?", id) || {}).name || "channel"))
      .replace(/<#(C[A-Z0-9]+)>/g, (_, id) => "#" + ((db.get("SELECT name FROM slack_channels WHERE id = ?", id) || {}).name || "channel"))
      .replace(/<!subteam\^[A-Z0-9]+\|([^>]*)>/g, "$1")
      .replace(/<!(here|channel|everyone)(?:\|[^>]*)?>/g, "@$1")
      .replace(/<(?:mailto:)?([^|>\s]+)\|([^>]*)>/g, "$2")
      .replace(/<((?:https?|mailto):[^>\s]+)>/g, (_, u) => u.replace(/^mailto:/, ""))
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    return out.trim().slice(0, 2000);
  }

  let running = null;
  // Reads what is new in every watched channel. Safe to call often; it never stores a message twice.
  function sync() {
    if (!connected()) return Promise.resolve({ added: 0, channels: 0 });
    if (!running) running = (async () => {
      let added = 0;
      const channels = db.all("SELECT * FROM slack_channels WHERE watched = 1");
      for (const ch of channels) {
        try {
          let cursor = "", newest = ch.last_ts || "0";
          const oldest = ch.last_ts || String((Date.now() - 14 * DAY) / 1000); // first time: the last two weeks
          for (let page = 0; page < 5; page++) {
            const out = await call("conversations.history", { channel: ch.id, oldest, limit: "200", ...(cursor ? { cursor } : {}) });
            for (const m of out.messages || []) {
              if (m.type !== "message" || SKIP.has(m.subtype) || !m.ts) continue;
              const body = (await clean(m.text)) || ((m.files || []).length ? `(shared ${m.files.length === 1 ? "a file: " + (m.files[0].title || m.files[0].name || "file") : m.files.length + " files"})` : "");
              if (!body) continue;
              const author = m.user ? await userName(m.user) : m.username || (m.bot_profile && m.bot_profile.name) || "An app";
              const r = db.run("INSERT OR IGNORE INTO slack_messages (channel_id, ts, user_id, author, text, replies, time) VALUES (?, ?, ?, ?, ?, ?, ?)", ch.id, m.ts, m.user || "", author, body, m.reply_count || 0, Math.round(Number(m.ts) * 1000));
              added += Number(r.changes) || 0;
              if (Number(m.ts) > Number(newest)) newest = m.ts;
            }
            cursor = (out.response_metadata || {}).next_cursor || "";
            if (!out.has_more || !cursor) break;
          }
          db.run("UPDATE slack_channels SET last_ts = ?, error = NULL WHERE id = ?", newest === "0" ? ch.last_ts : newest, ch.id);
        } catch (e) {
          if (DEAD_TOKEN.includes(e.code)) throw e;
          const why = e.code === "not_in_channel" ? "Tracker's Slack app isn't in this channel yet. In Slack, open the channel and type /invite @Tracker." : e.message;
          db.run("UPDATE slack_channels SET error = ? WHERE id = ?", why, ch.id);
        }
      }
      db.setSetting("slack_sync", { at: Date.now(), added });
      return { added, channels: channels.length };
    })().finally(() => { running = null; });
    return running;
  }

  let timer = null;
  return {
    connected, connect, disconnect, refreshChannels, setChannels, sync, clean,
    start(everyMs = 10 * 60_000) { timer = setInterval(() => sync().catch(() => {}), everyMs); timer.unref(); },
    stop() { clearInterval(timer); },
  };
}

// What one person may see of Slack: only watched channels mapped to a brand they
// have (admins see all), and only with the News permission.
function viewFor(db, viewer, { isAdmin, can, brandOk }) {
  if (!isAdmin(viewer) && !can(viewer, "news")) return null;
  const cfg = db.setting("slack", null), admin = isAdmin(viewer);
  const all = db.all("SELECT * FROM slack_channels ORDER BY watched DESC, name");
  const visible = all.filter((c) => c.watched && (admin || (c.brand_id && brandOk(viewer, c.brand_id))));
  const byId = Object.fromEntries(visible.map((c) => [c.id, c]));
  const ids = visible.map((c) => c.id), marks = ids.map(() => "?").join(",");
  const rows = ids.length ? db.all(`SELECT * FROM slack_messages WHERE channel_id IN (${marks}) ORDER BY time DESC LIMIT 150`, ...ids) : [];
  const now = Date.now(), recent = ids.length ? db.all(`SELECT channel_id, author, time FROM slack_messages WHERE channel_id IN (${marks}) AND time >= ?`, ...ids, now - 14 * DAY) : [];
  const week = recent.filter((m) => m.time >= now - 7 * DAY), prev = recent.length - week.length;
  const tally = (list, key) => Object.entries(list.reduce((a, m) => ((a[m[key]] = (a[m[key]] || 0) + 1), a), {})).sort((a, z) => z[1] - a[1]);
  const out = {
    connected: !!(cfg && cfg.token), team: cfg ? cfg.team : "", lastSync: (db.setting("slack_sync", null) || {}).at || null,
    messages: rows.map((m) => ({ id: m.channel_id + "-" + m.ts, channel: "#" + byId[m.channel_id].name, brand: byId[m.channel_id].brand_id, author: m.author, text: m.text, replies: m.replies, time: new Date(m.time).toISOString() })),
    activity: {
      week: week.length, prevWeek: prev, people: new Set(week.map((m) => m.author)).size,
      channels: tally(week, "channel_id").map(([id, n]) => ({ name: "#" + byId[id].name, brand: byId[id].brand_id, count: n })),
      top: tally(week, "author").slice(0, 5).map(([name, count]) => ({ name, count })),
    },
  };
  if (admin) out.channels = all.map((c) => ({ id: c.id, name: c.name, private: !!c.private, member: !!c.member, members: c.members, watched: !!c.watched, brand: c.brand_id, error: c.error }));
  return out;
}

module.exports = { create, viewFor, SlackError };
