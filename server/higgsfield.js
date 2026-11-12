// Tracker's connection to Higgsfield.
//
// The admin signs in once on Higgsfield's own page. Tracker keeps the access
// it is given in its local database (never a password) and uses it to check
// the credit balance and to create videos.
"use strict";
const crypto = require("node:crypto");
const { McpClient, McpError } = require("./mcp");

const MCP_URL = () => process.env.HIGGSFIELD_MCP_URL || "https://mcp.higgsfield.ai/mcp";
const b64 = (buf) => buf.toString("base64url");
const form = (obj) => new URLSearchParams(obj).toString();

async function json(url, opts = {}) {
  let res;
  try { res = await fetch(url, { ...opts, signal: AbortSignal.timeout(20_000) }); }
  catch { throw new Error("Couldn't reach Higgsfield. Check the internet connection and try again."); }
  let body = null;
  try { body = await res.json(); } catch {}
  if (!res.ok) throw new Error((body && (body.error_description || body.error)) || `Higgsfield answered with an error (${res.status}).`);
  return body || {};
}

function create(db) {
  const saved = () => db.setting("higgsfield", null);
  const save = (v) => db.setSetting("higgsfield", v);
  const connected = () => !!(saved() && saved().access_token);
  const flag = (on) => db.setSetting("connections", { ...db.setting("connections", { slack: false, euka: false, higgsfield: false, claude: false }), higgsfield: on });

  // Where Higgsfield's sign-in lives. Read from the service itself, so it keeps working if they move it.
  async function discover() {
    const origin = new URL(MCP_URL()).origin;
    try { const m = await json(origin + "/.well-known/oauth-authorization-server"); if (m.authorization_endpoint && m.token_endpoint) return m; } catch {}
    const prm = await json(origin + "/.well-known/oauth-protected-resource");
    const as = (prm.authorization_servers || [])[0];
    if (!as) throw new Error("Higgsfield didn't say where to sign in.");
    return json(as.replace(/\/$/, "") + "/.well-known/oauth-authorization-server");
  }

  // Step 1: returns the Higgsfield page the admin must visit.
  async function startConnect(redirectUri) {
    const meta = await discover();
    let cfg = saved() || {};
    if (!cfg.client_id || cfg.redirect_uri !== redirectUri) {
      if (!meta.registration_endpoint) throw new Error("Higgsfield isn't accepting new app connections right now.");
      const reg = await json(meta.registration_endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_name: "Tracker (agency dashboard)", redirect_uris: [redirectUri], grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none", scope: "openid email offline_access" }),
      });
      cfg = { client_id: reg.client_id, redirect_uri: redirectUri };
    }
    const verifier = b64(crypto.randomBytes(32)), state = b64(crypto.randomBytes(16));
    save({ ...cfg, token_endpoint: meta.token_endpoint, pending: { state, verifier, expires: Date.now() + 15 * 60_000 } });
    const q = form({ response_type: "code", client_id: cfg.client_id, redirect_uri: redirectUri, scope: "openid email offline_access", state, code_challenge: b64(crypto.createHash("sha256").update(verifier).digest()), code_challenge_method: "S256", resource: MCP_URL() });
    return meta.authorization_endpoint + "?" + q;
  }

  // Step 2: Higgsfield sends the admin back with a one-time code; swap it for access.
  async function finishConnect({ code, state }) {
    const cfg = saved();
    if (!cfg || !cfg.pending || cfg.pending.state !== state || cfg.pending.expires < Date.now()) throw new Error("That sign-in attempt expired. Press Connect Higgsfield again.");
    const tok = await json(cfg.token_endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ grant_type: "authorization_code", code, redirect_uri: cfg.redirect_uri, client_id: cfg.client_id, code_verifier: cfg.pending.verifier, resource: MCP_URL() }) });
    if (!tok.access_token) throw new Error("Higgsfield didn't complete the sign-in.");
    storeTokens({ ...cfg, pending: null }, tok);
    client = null;
    flag(true);
    await refreshBalance(true);
    await detectRenewal();
  }
  function storeTokens(cfg, tok) {
    save({ ...cfg, access_token: tok.access_token, refresh_token: tok.refresh_token || cfg.refresh_token || null, expires_at: tok.expires_in ? Date.now() + tok.expires_in * 1000 : null });
  }

  let refreshing = null;
  async function getToken({ forceRefresh = false } = {}) {
    const cfg = saved();
    if (!cfg || !cfg.access_token) throw new McpError("Higgsfield isn't connected.", { auth: true });
    const stale = forceRefresh || (cfg.expires_at && cfg.expires_at - Date.now() < 60_000);
    if (!stale) return cfg.access_token;
    if (!cfg.refresh_token) { if (forceRefresh) needsReconnect(); return cfg.access_token; }
    if (!refreshing) {
      refreshing = (async () => {
        try {
          const tok = await json(cfg.token_endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ grant_type: "refresh_token", refresh_token: cfg.refresh_token, client_id: cfg.client_id, resource: MCP_URL() }) });
          storeTokens(saved(), tok);
          return tok.access_token;
        } catch (e) { needsReconnect(); throw new McpError("Higgsfield's sign-in expired. An admin needs to connect it again in Connections.", { auth: true }); }
        finally { refreshing = null; }
      })();
    }
    return refreshing;
  }
  // The saved access stopped working: forget it and show Higgsfield as not connected.
  function needsReconnect() {
    const cfg = saved() || {};
    save({ client_id: cfg.client_id, redirect_uri: cfg.redirect_uri, token_endpoint: cfg.token_endpoint });
    client = null; flag(false);
  }
  function disconnect() { needsReconnect(); db.setSetting("higgsfield_balance", null); }

  let client = null;
  const mcp = () => (client = client || new McpClient({ url: MCP_URL(), getToken }));

  // ----- what Tracker asks Higgsfield for -----
  async function refreshBalance(force = false) {
    const cached = db.setting("higgsfield_balance", null);
    if (!connected()) return null;
    if (!force && cached && Date.now() - cached.at < 60_000) return cached;
    try {
      const b = await mcp().call("balance");
      const fresh = { credits: Number(b.credits) || 0, plan: b.subscription_plan_type || "", at: Date.now() };
      db.setSetting("higgsfield_balance", fresh);
      return fresh;
    } catch { return cached; } // keep showing the last known balance if Higgsfield is briefly unreachable
  }
  // Learn the day credits renew, and how many arrive, from the account's own history.
  async function detectRenewal() {
    try {
      const t = await mcp().call("transactions", { size: 100 });
      const grant = (t.items || []).find((i) => i.action === "grant" && /subscription/i.test(i.display_name || ""));
      if (!grant) return;
      const budget = db.setting("budget", {});
      if (!budget.setByAdmin) db.setSetting("budget", { ...budget, renewDay: new Date(grant.created_at).getDate(), monthly: Math.round(grant.credits) });
    } catch {}
  }
  async function quote(params) {
    const out = await mcp().call("generate_video", { params: { ...params, get_cost: true } });
    const credits = out && out.cost && Number(out.cost.credits_exact ?? out.cost.credits);
    if (!Number.isFinite(credits)) throw new Error("Higgsfield didn't give a price for this video.");
    return credits;
  }
  async function generate(params) {
    // A clear refusal means nothing was spent. Anything else (a dropped connection, an answer
    // Tracker can't read) means we don't know, so the caller must not retry or promise a refund.
    let out;
    try { out = await mcp().call("generate_video", { params: { ...params, use_unlim: false }, context: "Agency dashboard video request" }); }
    catch (e) { if (!e.refused && !e.auth) e.uncertain = true; throw e; }
    const ids = ((out && out.results) || []).map((r) => r.id).filter(Boolean);
    if (!ids.length) { const e = new Error("Higgsfield answered in a way Tracker didn't understand."); e.uncertain = true; throw e; }
    return ids;
  }
  async function status(ids) {
    const out = await mcp().call("jobs_wait", { jobs: ids.map((job_id, index) => ({ index, job_id })), timeout_seconds: 0 });
    return (out.jobs || []).map((j) => ({ id: j.job_id, status: j.status, url: j.result_url || null, error: j.error || null }));
  }

  return { connected, startConnect, finishConnect, disconnect, refreshBalance, quote, generate, status };
}

module.exports = { create };
