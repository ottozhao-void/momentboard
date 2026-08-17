#!/usr/bin/env node
/**
 * Merge server/entries.json back into js/data.js (publish overrides + manual
 * entries). Corrections replace the published row's values; manual entries
 * become new rows with generated method ids.
 *
 * Usage:
 *   node tools/merge_entries.js            # merge + validate + write
 *   node tools/merge_entries.js --dry-run  # report without writing
 *
 * Note: the file is re-serialized with 1-space indent, so whole values that
 * were written as "35.0" normalize to "35" (semantically identical).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execSync } = require("child_process");

const DATA_PATH = path.join(__dirname, "..", "js", "data.js");
const ENTRIES_PATH = path.join(__dirname, "..", "server", "entries.json");
const DRY_RUN = process.argv.includes("--dry-run");

global.window = {};
vm.runInThisContext(fs.readFileSync(DATA_PATH, "utf8"));
const D = global.window.LEADERBOARD_DATA;

let entries = [];
try {
  entries = (JSON.parse(fs.readFileSync(ENTRIES_PATH, "utf8")).entries || []);
} catch (e) {
  console.error("no server/entries.json to merge (run the server and record entries first)");
  process.exit(0);
}

const benchById = Object.fromEntries(D.benchmarks.map((b) => [b.id, b]));

function slugify(name) {
  return String(name).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "method";
}

let changed = 0;
let skipped = 0;

function applyOverride(entry) {
  const b = benchById[entry.benchmark];
  const t = entry.target || {};
  if (!b) { skipped++; console.log(`  skip: unknown benchmark ${entry.benchmark}`); return; }
  const row = b.rows.find((r) => r.method === t.method && (r.name || "") === (t.name || ""));
  if (!row) { skipped++; console.log(`  skip: no row for ${entry.benchmark} / ${t.method}${t.name ? " (" + t.name + ")" : ""}`); return; }
  const mid = new Set(b.metrics.map((m) => m.id));
  const values = {};
  for (const [k, v] of Object.entries(entry.values || {})) if (mid.has(k)) values[k] = v;
  row.values = values;
  changed++;
  console.log(`  override: ${entry.benchmark} / ${t.method}${t.name ? " (" + t.name + ")" : ""}${entry.note ? "  · note: " + entry.note : ""}`);
}

function addManual(entry) {
  const b = benchById[entry.benchmark];
  if (!b) { skipped++; console.log(`  skip: unknown benchmark ${entry.benchmark}`); return; }
  let id = slugify(entry.method);
  let i = 1;
  while (id in D.methods) id = `${slugify(entry.method)}-${++i}`;
  const meta = { title: entry.method, venue: "", year: null, tags: [] };
  const paper = String(entry.paper || "").trim();
  const arxiv = paper.match(/^(?:arxiv\s*[:#]?\s*)?(\d{4}\.\d{4,5})$/i);
  if (arxiv) meta.arxiv = arxiv[1];
  else if (/^https?:\/\//i.test(paper)) meta.url = paper;
  D.methods[id] = meta;
  const mid = new Set(b.metrics.map((m) => m.id));
  const values = {};
  for (const [k, v] of Object.entries(entry.values || {})) if (mid.has(k)) values[k] = v;
  const row = { method: id, values };
  if (entry.setting === "zero-shot" || entry.setting === "fine-tuned") row.setting = entry.setting;
  b.rows.push(row);
  changed++;
  console.log(`  add: ${entry.method} -> ${id} (${entry.benchmark})`);
}

console.log("Merging entries:");
for (const entry of entries) {
  if (entry.kind === "override") applyOverride(entry);
  else addManual(entry);
}
console.log(`${changed} applied, ${skipped} skipped (of ${entries.length} entries).`);

if (DRY_RUN) { console.log("dry-run — no file written."); process.exit(0); }

if (changed === 0) { console.log("Nothing to merge."); process.exit(0); }

// write with the same 1-space format used by js/data.js
const out = "window.LEADERBOARD_DATA = " + JSON.stringify(D, null, 1) + ";\n";
const tmp = DATA_PATH + ".tmp";
fs.writeFileSync(tmp, out, "utf8");
fs.renameSync(tmp, DATA_PATH);

try {
  const v = execSync("node tools/validate_data.js", { encoding: "utf8" });
  console.log("validate:", v.trim());
} catch (e) {
  console.error(e.stdout || e.message);
  process.exit(1);
}
console.log("Wrote " + DATA_PATH);
