#!/usr/bin/env node
/** Validate js/data.js: known methods, known metrics, sane value ranges. */
"use strict";
const fs = require("fs");
const vm = require("vm");
const path = require("path");

global.window = {};
vm.runInThisContext(fs.readFileSync(path.join(__dirname, "..", "js", "data.js"), "utf8"));
const D = global.window.LEADERBOARD_DATA;

const errors = [];
const known = new Set(Object.keys(D.methods));
for (const b of D.benchmarks) {
  const mids = new Set(b.metrics.map((m) => m.id));
  if (!b.metrics.some((m) => m.primary)) errors.push(`${b.id}: no primary metric`);
  for (const r of b.rows) {
    if (!known.has(r.method)) errors.push(`${b.id}: unknown method ${r.method}`);
    for (const [k, v] of Object.entries(r.values)) {
      if (!mids.has(k)) errors.push(`${b.id}/${r.method}: unknown metric ${k}`);
      if (typeof v !== "number" || v < 0 || v > 100) errors.push(`${b.id}/${r.method}: bad value ${k}=${v}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
const rows = D.benchmarks.reduce((n, b) => n + b.rows.length, 0);
console.log(`DATA OK: ${D.benchmarks.length} benchmarks, ${rows} rows`);
