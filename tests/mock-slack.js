// A stand-in for Slack's Web API, used only by the tests. It follows Slack's
// documented shapes for the five things Tracker asks for: who am I, list
// channels, read a channel's history, look up a person, and "slow down".
"use strict";
const http = require("node:http");

// Builds a made-up token in Slack's format. These are never real: they only work against this stand-in.
const fakeToken = (kind, a, b, tail) => ["xox" + kind, String(a).repeat(10), String(b).repeat(10), tail.repeat(24 / tail.length)].join("-");

function createMockSlack() {
  const now = Date.now() / 1000;
  const ago = (days) => (now - days * 86400).toFixed(6);
  const state = {
    token: fakeToken("b", 1, 2, "abcdefgh"),
    revoked: false, limitNext: 0, calls: [], pageSize: 2,
    users: { U1: { real_name: "Priya Nair", profile: { display_name: "Priya" } }, U2: { real_name: "Marco Rossi", profile: { display_name: "" } }, U3: { real_name: "Hannah Lee", profile: { display_name: "Hannah (Lumora)" } } },
    channels: [
      { id: "C1", name: "client-lumora", is_private: false, is_member: true, num_members: 6 },
      { id: "C2", name: "client-pawsome", is_private: false, is_member: true, num_members: 5 },
      { id: "C3", name: "team-internal", is_private: true, is_member: true, num_members: 4 },
      { id: "C4", name: "random", is_private: false, is_member: false, num_members: 12 },
    ],
    messages: {
      C1: [
        { type: "message", user: "U1", ts: ago(0.2), text: "Serum Spark Ad passed 5x ROAS. Raising budget, <@U2> can you brief two more hooks? See <https://euka.example/v/1|the video> &amp; the <#C2|client-pawsome> notes" },
        { type: "message", user: "U3", ts: ago(1), text: "Approved the LIVE replay clip <!here>", reply_count: 3 },
        { type: "message", subtype: "channel_join", user: "U2", ts: ago(2), text: "<@U2> has joined the channel" },
        { type: "message", user: "U2", ts: ago(3), text: "Paused the mask before/after. CVR under 2.5%." },
        { type: "message", user: "U1", ts: ago(9), text: "Weekly report sent to the client." },
        { type: "message", user: "U1", ts: ago(30), text: "Too old to be read on the first sync." },
      ],
      C2: [
        { type: "message", user: "U2", ts: ago(0.5), text: "27 new creators onboarded. Samples ship Monday." },
        { type: "message", subtype: "bot_message", username: "Euka alerts", ts: ago(4), text: "Sample request approved" },
        { type: "message", user: "U1", ts: ago(5), text: "", files: [{ name: "brief.pdf", title: "November brief" }] },
      ],
      C3: [{ type: "message", user: "U1", ts: ago(0.1), text: "Margins on Lumora are thin this month, keep this internal." }],
      C4: [{ type: "message", user: "U2", ts: ago(1), text: "Lunch?" }],
    },
  };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const method = url.pathname.replace(/^\/api\//, ""), q = url.searchParams;
    state.calls.push(method);
    const send = (body, status = 200, headers = {}) => { res.writeHead(status, { "Content-Type": "application/json", ...headers }); res.end(JSON.stringify(body)); };
    if (state.limitNext > 0) { state.limitNext--; return send({ ok: false, error: "ratelimited" }, 429, { "Retry-After": "0" }); }
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (token !== state.token) return send({ ok: false, error: "invalid_auth" });
    if (state.revoked) return send({ ok: false, error: "token_revoked" });

    if (method === "auth.test") return send({ ok: true, url: "https://testagency.slack.com/", team: "Test Agency", user: "tracker", team_id: "T1", user_id: "UBOT", bot_id: "B1" });
    if (method === "conversations.list") {
      const start = Number(q.get("cursor") || 0), page = state.channels.slice(start, start + state.pageSize), next = start + state.pageSize;
      return send({ ok: true, channels: page, response_metadata: { next_cursor: next < state.channels.length ? String(next) : "" } });
    }
    if (method === "conversations.history") {
      const ch = state.channels.find((c) => c.id === q.get("channel"));
      if (!ch) return send({ ok: false, error: "channel_not_found" });
      if (!ch.is_member) return send({ ok: false, error: "not_in_channel" });
      const all = (state.messages[ch.id] || []).filter((m) => Number(m.ts) > Number(q.get("oldest") || 0)).sort((a, z) => Number(z.ts) - Number(a.ts));
      const start = Number(q.get("cursor") || 0), page = all.slice(start, start + state.pageSize), next = start + state.pageSize;
      return send({ ok: true, messages: page, has_more: next < all.length, response_metadata: { next_cursor: next < all.length ? String(next) : "" } });
    }
    if (method === "users.info") {
      const u = state.users[q.get("user")];
      return u ? send({ ok: true, user: { id: q.get("user"), ...u } }) : send({ ok: false, error: "user_not_found" });
    }
    send({ ok: false, error: "unknown_method" });
  });

  return {
    state, ago,
    async listen() { await new Promise((r) => server.listen(0, "127.0.0.1", r)); return "http://127.0.0.1:" + server.address().port + "/api"; },
    close: () => new Promise((r) => server.close(r)),
  };
}

module.exports = { createMockSlack, fakeToken };
