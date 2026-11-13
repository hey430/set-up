// A stand-in for Higgsfield used only by the tests. It behaves like the real
// service where Tracker touches it: app registration, sign-in with a one-time
// code, expiring access, and the balance / price / video tools. Its shapes were
// copied from real Higgsfield answers on 12 Nov 2026.
"use strict";
const http = require("node:http");
const crypto = require("node:crypto");

const PER_SEC = { seedance_2_0_mini: 1, seedance_2_0: 2.5, marketing_studio_video: 5 };

function createMock({ credits = 600, grantDay = new Date().getDate(), pollsToFinish = 2 } = {}) {
  const state = { credits, pollsToFinish, failNext: false, garbleNext: false, videoFile: null, clients: new Set(), codes: new Map(), tokens: new Set(), refresh: new Set(), jobs: new Map(), calls: [], origin: "" };
  const sendJson = (res, status, body, headers = {}) => { res.writeHead(status, { "Content-Type": "application/json", ...headers }); res.end(JSON.stringify(body)); };
  const read = (req) => new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(b)); });
  const issue = () => { const access = "at_" + crypto.randomBytes(8).toString("hex"), refresh = "rt_" + crypto.randomBytes(8).toString("hex"); state.tokens.add(access); state.refresh.add(refresh); return { access_token: access, refresh_token: refresh, token_type: "Bearer", expires_in: 3600 }; };

  function tool(name, args) {
    state.calls.push(name);
    if (name === "balance") return { credits: state.credits, subscription_plan_type: "pro" };
    if (name === "transactions") {
      const d = new Date(); d.setDate(grantDay);
      return { items: [{ display_name: "Kling 4.0", credits: -82.5, action: "spend", created_at: new Date().toISOString() }, { display_name: "Subscription Credits", credits: 600, action: "grant", created_at: d.toISOString() }], next_cursor: null };
    }
    if (name === "generate_video") {
      const p = args.params, one = (PER_SEC[p.model] || 7) * p.duration, count = p.count || 1;
      if (p.get_cost) return { cost: { credits: one, credits_exact: one } };
      if (one * count > state.credits) return { __error: "Not enough credits" };
      state.credits = Math.round((state.credits - one * count) * 10) / 10;
      const results = [];
      for (let i = 0; i < count; i++) {
        const id = crypto.randomUUID();
        state.jobs.set(id, { polls: 0, fail: state.failNext, cost: one, prompt: p.prompt });
        results.push({ id, type: "video", status: "pending", model: p.model, params: p });
      }
      state.failNext = false;
      if (state.garbleNext) { state.garbleNext = false; return { message: "Your video is on its way!" }; } // charged, but not in the usual shape
      return { results };
    }
    if (name === "jobs_wait") {
      const jobs = args.jobs.map(({ index, job_id }) => {
        const j = state.jobs.get(job_id);
        if (!j) return { index, job_id, status: "failed" };
        j.polls++;
        if (j.polls < state.pollsToFinish) return { index, job_id, status: "in_progress", type: "video" };
        if (j.fail) { if (!j.refunded) { j.refunded = true; state.credits += j.cost; } return { index, job_id, status: "failed", type: "video" }; }
        return { index, job_id, status: "completed", type: "video", result_url: `${state.origin}/files/${job_id}.mp4` };
      });
      return { jobs, all_terminal: jobs.every((j) => j.status !== "in_progress") };
    }
    return { __error: "Unknown tool " + name };
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, state.origin);
    if (url.pathname === "/.well-known/oauth-authorization-server") return sendJson(res, 200, { issuer: state.origin, authorization_endpoint: state.origin + "/oauth2/authorize", token_endpoint: state.origin + "/oauth2/token", registration_endpoint: state.origin + "/oauth2/register", code_challenge_methods_supported: ["S256"] });
    if (url.pathname === "/oauth2/register") { const b = JSON.parse(await read(req)); const id = "client_" + crypto.randomBytes(4).toString("hex"); state.clients.add(id); return sendJson(res, 201, { client_id: id, redirect_uris: b.redirect_uris, token_endpoint_auth_method: "none" }); }
    if (url.pathname === "/oauth2/authorize") {
      // The real page asks the person to sign in; the stand-in says yes straight away.
      const q = url.searchParams;
      if (!state.clients.has(q.get("client_id")) || q.get("code_challenge_method") !== "S256") return sendJson(res, 400, { error: "invalid_request" });
      const code = "code_" + crypto.randomBytes(6).toString("hex");
      state.codes.set(code, { challenge: q.get("code_challenge"), redirect: q.get("redirect_uri"), client: q.get("client_id") });
      res.writeHead(302, { Location: `${q.get("redirect_uri")}?code=${code}&state=${encodeURIComponent(q.get("state"))}` }); return res.end();
    }
    if (url.pathname === "/oauth2/token") {
      const f = new URLSearchParams(await read(req));
      if (f.get("grant_type") === "authorization_code") {
        const c = state.codes.get(f.get("code")); state.codes.delete(f.get("code"));
        const proof = crypto.createHash("sha256").update(f.get("code_verifier") || "").digest("base64url");
        if (!c || c.challenge !== proof || c.redirect !== f.get("redirect_uri") || c.client !== f.get("client_id")) return sendJson(res, 400, { error: "invalid_grant" });
        return sendJson(res, 200, issue());
      }
      if (f.get("grant_type") === "refresh_token" && state.refresh.has(f.get("refresh_token"))) { state.refresh.delete(f.get("refresh_token")); return sendJson(res, 200, issue()); }
      return sendJson(res, 400, { error: "invalid_grant", error_description: "Sign in again." });
    }
    if (url.pathname.startsWith("/files/")) {
      res.writeHead(200, { "Content-Type": "video/mp4" });
      return res.end(state.videoFile ? require("node:fs").readFileSync(state.videoFile) : Buffer.from("fake mp4 bytes for " + url.pathname)); // a real clip when a test provides one
    }
    if (url.pathname === "/mcp") {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (!state.tokens.has(token)) return sendJson(res, 401, { error: "Unauthorized" }, { "WWW-Authenticate": "Bearer" });
      const msg = JSON.parse(await read(req));
      if (msg.id === undefined) { res.writeHead(202); return res.end(); }
      let result;
      if (msg.method === "initialize") result = { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "mock-higgsfield", version: "1" } };
      else if (msg.method === "tools/call") {
        const out = tool(msg.params.name, msg.params.arguments || {});
        result = out.__error ? { isError: true, content: [{ type: "text", text: out.__error }] } : { content: [{ type: "text", text: JSON.stringify(out) }] };
      } else return sendJson(res, 200, { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: "Method not found" } });
      // Answer as an event stream, the harder of the two formats the real service may use.
      res.writeHead(200, { "Content-Type": "text/event-stream", "Mcp-Session-Id": "sess_1" });
      return res.end(`event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", id: msg.id, result })}\n\n`);
    }
    sendJson(res, 404, { error: "not found" });
  });

  return {
    state,
    expireAccess() { state.tokens.clear(); },        // access runs out; the refresh still works
    revokeEverything() { state.tokens.clear(); state.refresh.clear(); },
    async listen() { await new Promise((r) => server.listen(0, "127.0.0.1", r)); state.origin = "http://127.0.0.1:" + server.address().port; return state.origin; },
    close: () => new Promise((r) => server.close(r)),
  };
}

module.exports = { createMock };
