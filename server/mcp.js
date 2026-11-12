// A small client for services that speak MCP over HTTPS (Higgsfield does).
// It signs requests with a token, starts a session, and calls tools.
"use strict";

class McpError extends Error {
  constructor(message, { status, auth = false, refused = false } = {}) { super(message); this.status = status; this.auth = auth; this.refused = refused; }
}

class McpClient {
  constructor({ url, getToken, name = "tracker", version = "0.3", timeoutMs = 60_000 }) {
    Object.assign(this, { url, getToken, name, version, timeoutMs });
    this.sessionId = null; this.ready = null; this.nextId = 1; this.protocol = "2025-06-18";
  }

  async post(body, { forceRefresh = false } = {}) {
    const token = await this.getToken({ forceRefresh });
    const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Authorization: "Bearer " + token };
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;
    if (this.ready) headers["MCP-Protocol-Version"] = this.protocol;
    let res;
    try { res = await fetch(this.url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(this.timeoutMs) }); }
    catch (e) { throw new McpError("Couldn't reach Higgsfield. Check the internet connection and try again."); }
    if (res.status === 401 || res.status === 403) throw new McpError("Higgsfield didn't accept the sign-in.", { status: res.status, auth: true });
    if (res.status === 404 && this.sessionId) throw new McpError("session expired", { status: 404 });
    if (!res.ok) throw new McpError(`Higgsfield answered with an error (${res.status}).`, { status: res.status });
    const sid = res.headers.get("mcp-session-id");
    if (sid) this.sessionId = sid;
    if (body.id === undefined) return null; // a notification has no answer
    const type = res.headers.get("content-type") || "";
    const raw = await res.text();
    let message = null;
    if (type.includes("text/event-stream")) {
      // The answer arrives as a stream of events; find the one that answers this request.
      for (const block of raw.split(/\r?\n\r?\n/)) {
        const data = block.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trimStart()).join("\n");
        if (!data) continue;
        try { const m = JSON.parse(data); if (m.id === body.id) message = m; } catch {}
      }
    } else {
      try { message = JSON.parse(raw); } catch {}
    }
    if (!message) throw new McpError("Higgsfield sent an answer Tracker couldn't read.");
    if (message.error) throw new McpError(message.error.message || "Higgsfield reported an error.");
    return message.result;
  }

  // One retry with a fresh token if the sign-in was refused; one fresh session if it expired.
  async rpc(method, params, attempt = 0) {
    try { return await this.post({ jsonrpc: "2.0", id: this.nextId++, method, params }, { forceRefresh: attempt === 1 }); }
    catch (e) {
      if (e.auth && attempt === 0) return this.rpc(method, params, 1);
      if (e.status === 404 && attempt < 2 && method !== "initialize") { this.sessionId = null; this.ready = null; await this.start(); return this.rpc(method, params, 2); }
      throw e;
    }
  }

  start() {
    if (!this.ready) {
      this.ready = (async () => {
        const out = await this.rpc("initialize", { protocolVersion: this.protocol, capabilities: {}, clientInfo: { name: this.name, version: this.version } });
        if (out && out.protocolVersion) this.protocol = out.protocolVersion;
        await this.post({ jsonrpc: "2.0", method: "notifications/initialized" });
      })().catch((e) => { this.ready = null; throw e; });
    }
    return this.ready;
  }

  // Calls one tool and returns its answer as plain data.
  async call(tool, args = {}) {
    await this.start();
    const out = await this.rpc("tools/call", { name: tool, arguments: args });
    const text = ((out && out.content) || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
    if (out && out.isError) throw new McpError(text.slice(0, 300) || `Higgsfield couldn't run ${tool}.`, { refused: true }); // a clear "no"
    if (out && out.structuredContent && typeof out.structuredContent === "object") return out.structuredContent;
    try { return JSON.parse(text); } catch { return { text }; }
  }
}

module.exports = { McpClient, McpError };
