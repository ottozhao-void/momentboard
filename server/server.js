#!/usr/bin/env node
/**
 * Momentboard — zero-dependency persistence server.
 *
 * Serves the static site AND a small REST API for manual performance entries
 * and corrections. Data is persisted to server/entries.json (atomic writes).
 *
 *   GET    /api/health            -> { ok, entries }
 *   GET    /api/entries           -> { version, entries }
 *   POST   /api/entries           -> create (keeps client-provided id)
 *   PUT    /api/entries/:id       -> update
 *   DELETE /api/entries/:id       -> delete
 *
 * Mutations return the full entries array so clients can stay in sync.
 *
 * Env:
 *   PORT          listen port (default 8787)
 *   HOST          bind host (default 0.0.0.0 — Tailscale reachable)
 *   CORS_ORIGINS  comma-separated allowed origins (default "*")
 *
 * Run:  node server/server.js        (from the repo root)
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(__dirname, "entries.json");
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "*")
  .split(",").map((s) => s.trim()).filter(Boolean);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".ico": "image/x-icon"
};

/* ---------------------------------------------------------- persistence */

let entries = [];

function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    entries = Array.isArray(raw.entries) ? raw.entries : [];
  } catch (e) {
    entries = [];
  }
}

function save() {
  const payload = JSON.stringify({ version: 2, updated: new Date().toISOString(), entries }, null, 2);
  const tmp = DATA_FILE + ".tmp";
  try {
    if (fs.existsSync(DATA_FILE)) fs.copyFileSync(DATA_FILE, DATA_FILE + ".bak");
    fs.writeFileSync(tmp, payload, "utf8");
    fs.renameSync(tmp, DATA_FILE);
    return true;
  } catch (e) {
    try { fs.rmSync(tmp, { force: true }); } catch (_) {}
    return false;
  }
}

/* ---------------------------------------------------------- helpers */

function corsHeaders(req) {
  const origin = req.headers.origin;
  let allow;
  if (CORS_ORIGINS.includes("*")) {
    // echo the caller's origin so PNA preflights never see a wildcard
    allow = origin || "*";
  } else {
    allow = (origin && CORS_ORIGINS.includes(origin)) ? origin : "";
  }
  const headers = {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store"
  };
  // Private Network Access: a public origin (GitHub Pages) calling this
  // Tailscale/private address must pass a PNA preflight; permit it.
  if (req.headers["access-control-request-private-network"] === "true") {
    headers["Access-Control-Allow-Private-Network"] = "true";
  }
  return headers;
}

function sendJson(res, status, obj, cors) {
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign({ "Content-Type": "application/json; charset=utf-8" }, cors));
  res.end(body);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error("body too large"), { code: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function validateEntry(e) {
  if (!e || typeof e !== "object") return "entry must be an object";
  if (typeof e.benchmark !== "string" || !e.benchmark) return "benchmark is required";
  if (!e.kind) e.kind = "manual";
  if (e.kind === "manual") {
    if (typeof e.method !== "string" || !e.method.trim()) return "method is required";
    e.method = e.method.trim();
  } else if (e.kind === "override") {
    if (!e.target || typeof e.target !== "object") return "override requires a target";
    if (typeof e.target.method !== "string" || !e.target.method) return "override target.method is required";
  } else {
    return "unknown kind: " + e.kind;
  }
  if (!e.values || typeof e.values !== "object") e.values = {};
  for (const [k, v] of Object.entries(e.values)) {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100) {
      delete e.values[k];
    }
  }
  return null;
}

/* ---------------------------------------------------------- api */

function api(req, res, pathname) {
  const cors = corsHeaders(req);
  const m = pathname.match(/^\/api\/entries(?:\/([^/]+))?$/);
  const isHealth = pathname === "/api/health";

  if (isHealth) {
    sendJson(res, 200, { ok: true, mode: "server", entries: entries.length }, cors);
    return;
  }
  if (!m) { sendJson(res, 404, { error: "not found" }, cors); return; }

  const id = m[1];

  if (req.method === "OPTIONS") {
    res.writeHead(204, cors); res.end(); return;
  }

  if (req.method === "GET" && !id) {
    sendJson(res, 200, { version: 2, entries }, cors);
    return;
  }

  if (req.method === "POST" && !id) {
    readBody(req, 1 << 20).then((text) => {
      let body;
      try { body = JSON.parse(text || "{}"); } catch (e) { return sendJson(res, 400, { error: "invalid JSON" }, cors); }
      if (!body.id || typeof body.id !== "string") return sendJson(res, 400, { error: "id is required" }, cors);
      const err = validateEntry(body);
      if (err) return sendJson(res, 400, { error: err }, cors);
      body.updated = new Date().toISOString();
      entries = entries.filter((e) => e.id !== body.id);
      entries.push(body);
      if (!save()) return sendJson(res, 500, { error: "write failed" }, cors);
      console.log(`[entry] + ${body.kind} ${body.id} (${body.benchmark})`);
      sendJson(res, 200, { ok: true, entry: body, entries }, cors);
    }).catch((e) => sendJson(res, e.code === 413 ? 413 : 500, { error: e.message }, cors));
    return;
  }

  if ((req.method === "PUT" || req.method === "DELETE") && id) {
    const idx = entries.findIndex((e) => e.id === id);
    if (idx < 0) return sendJson(res, 404, { error: "no such entry" }, cors);

    if (req.method === "DELETE") {
      entries.splice(idx, 1);
      if (!save()) return sendJson(res, 500, { error: "write failed" }, cors);
      console.log(`[entry] - ${id}`);
      sendJson(res, 200, { ok: true, entries }, cors);
      return;
    }

    readBody(req, 1 << 20).then((text) => {
      let patch;
      try { patch = JSON.parse(text || "{}"); } catch (e) { return sendJson(res, 400, { error: "invalid JSON" }, cors); }
      const merged = Object.assign({}, entries[idx], patch, { id, updated: new Date().toISOString() });
      const err = validateEntry(merged);
      if (err) return sendJson(res, 400, { error: err }, cors);
      entries[idx] = merged;
      if (!save()) return sendJson(res, 500, { error: "write failed" }, cors);
      console.log(`[entry] ~ ${id} (${merged.benchmark})`);
      sendJson(res, 200, { ok: true, entry: merged, entries }, cors);
    }).catch((e) => sendJson(res, e.code === 413 ? 413 : 500, { error: e.message }, cors));
    return;
  }

  sendJson(res, 405, { error: "method not allowed" }, cors);
}

/* ---------------------------------------------------------- static */

function serveStatic(req, res, pathname) {
  let p;
  if (pathname === "/" || pathname === "") p = "/index.html";
  else p = pathname;
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end("forbidden"); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("not found"); return; }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------------------------------------------------------- boot */

load();

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (pathname.startsWith("/api/")) { api(req, res, pathname); return; }
  serveStatic(req, res, pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`Momentboard server → http://${HOST}:${PORT}  (${entries.length} entries, CORS ${CORS_ORIGINS.join(",")})`);
});
