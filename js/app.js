/**
 * Momentboard — single-file view layer (no dependencies, file:// friendly).
 * Hash routing: #/ (home) · #/benchmark/<id> · #/about
 */
(function () {
  "use strict";

  const DATA = window.LEADERBOARD_DATA;

  // display names; falls back to the raw method id in data.js
  const METHOD_NAMES = {
    "2d-tan": "2D-TAN", "vslnet": "VSLNet", "mmn": "MMN",
    "moment-detr": "Moment-DETR", "umt": "UMT", "momentdiff": "MomentDiff",
    "qd-detr": "QD-DETR", "cg-detr": "CG-DETR", "tr-detr": "TR-DETR",
    "bam-detr": "BAM-DETR", "ld-detr": "LD-DETR", "sg-detr": "SG-DETR",
    "univtg": "UniVTG", "r2-tuning": "R2-Tuning", "flashvtg": "FlashVTG",
    "sds": "SDS-Tuner", "mqvtg": "MQVTG", "augmr": "Aug. MR",
    "tfvtg": "TFVTG", "tag": "TAG", "vtg-gpt": "VTG-GPT", "luo-zt": "Luo et al.",
    "pzvmr": "PZVMR", "ed-vtg": "ED-VTG", "unitime": "UniTime",
    "time-r1": "Time-R1", "omnivtg": "OmniVTG", "groundvts": "GroundVTS",
    "numpro": "NumPro", "timesuite": "TimeSuite", "trace": "TRACE",
    "llava-mr": "LLaVA-MR", "mr-blip": "Mr.BLIP", "emb": "EMB", "vdi": "VDI",
    "snag": "SnAG", "videomind": "VideoMind", "vtime-llm": "VTimeLLM",
    "timechat": "TimeChat", "momentor": "Momentor", "hawkeye": "HawkEye",
    "chatvtg": "ChatVTG", "videochat-tpo": "VideoChat-TPO", "et-chat": "E.T. Chat",
    "videochat": "VideoChat", "video-llama": "Video-LLaMA",
    "video-chatgpt": "Video-ChatGPT", "valley": "Valley", "videochat2": "VideoChat2",
    "xml": "XML", "unloc": "UnLoc",
    "diffvmr": "DiffusionVMR", "shotdetect": "ShotDetect+CLIP+SW",
    "scanet": "SCANet", "sscs": "2D-TAN + SS", "hem": "HEM",
    "mitig-gap": "Mitigating Modality Gap",
    "moment-gpt": "Moment-GPT", "point-to-span": "Point to Span", "markit": "MarkIt",
    "t2sgrid": "T2SGrid", "self-sims": "Self-SiMS", "semvid": "SemVID",
    "hitea": "HiTeA", "zs-blip": "ZS-BLIP",
    "diffusionvmr": "DiffusionVMR", "td-detr": "TD-DETR", "vlg-net": "VLG-Net",
    "timeexpert": "TimeExpert", "timelens": "TimeLens", "hieramamba": "HieraMamba",
    "eart": "EaTR", "scanet": "SCANet", "weakly-sup-div": "Weak-Sup Div.",
    "cva": "CVA", "distime": "DisTime", "g2l": "G2L", "frozen-vlm": "Frozen VLM"
  };

  const fmt = (n) => n.toFixed(1);

  // tag taxonomy mirrors the Obsidian/WebSiting library tags (topic/*)
  const TAG_LABELS = {
    "vmr": "VMR",
    "training-free": "training-free",
    "zero-shot": "zero-shot",
    "vision-llm": "Vision-LLM",
    "detr": "DETR",
    "diffusion": "diffusion",
    "rl": "RL",
    "clip-similarity": "CLIP-sim",
    "video-retrieval": "video-retrieval",
    "input-token-optimization": "token-opt",
    "codebook": "codebook",
    "survey": "survey",
    "weakly-supervised": "weak-sup",
    "long-video": "long-video",
    "mamba": "Mamba",
    "ssm": "SSM",
  };
  const TAG_ORDER = ["training-free", "zero-shot", "vision-llm", "detr", "diffusion", "rl",
    "clip-similarity", "video-retrieval", "input-token-optimization", "codebook", "survey",
    "weakly-supervised", "long-video", "mamba", "ssm", "vmr"];

  function methodTags(methodId) {
    const m = DATA.methods[methodId];
    return m && Array.isArray(m.tags) ? m.tags : [];
  }
  function tagChip(tag) {
    return `<span class="tag topic" data-tag="${esc(tag)}">${esc(TAG_LABELS[tag] || tag)}</span>`;
  }
  const fmtDate = (iso) => {
    const [y, m, d] = iso.split("-");
    return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1]} ${+d}, ${y}`;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const $view = document.getElementById("view");
  const state = {}; // benchmarkId -> { sortMetric, dir }

  /* ---------------------------------------------------------- helpers */

  function methodName(row) {
    return row.name || METHOD_NAMES[row.method] || row.method;
  }

  function methodPaper(methodId) {
    return DATA.methods[methodId] || null;
  }

  function sortRows(rows, metricId, dir) {
    const get = (r) => (r.values[metricId] != null ? r.values[metricId] : -Infinity);
    return rows.slice().sort((a, b) => (get(a) - get(b)) * (dir === "asc" ? 1 : -1));
  }

  function primaryMetric(bench) {
    return bench.metrics.find((m) => m.primary) || bench.metrics[0];
  }

  function sotaSummary() {
    let leaders = {};
    for (const b of DATA.benchmarks) {
      const pm = primaryMetric(b);
      const best = b.rows.reduce((acc, r) =>
        (r.values[pm.id] != null && r.values[pm.id] > (acc ? acc.values[pm.id] : -1) ? r : acc), null);
      leaders[b.id] = { row: best, bench: b, metric: pm };
    }
    return leaders;
  }

  function paperLink(p) {
    if (!p) return "";
    const id = p.arxiv ? `arXiv:${p.arxiv}` : "";
    const venue = p.venue ? `${p.venue} ${p.year}`.trim() : String(p.year || "");
    const bits = [venue, id].filter(Boolean);
    return bits.join(" · ");
  }

  /* ---------------------------------------------------------- router */

  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const m = h.match(/^benchmark\/([\w-]+)/);
    if (m) return renderBenchmark(m[1]);
    if (h === "about") return renderAbout();
    return renderHome();
  }

  function navState() {
    document.querySelectorAll(".nav-link").forEach((a) => {
      const active = a.dataset.route === "home" ? !location.hash.includes("benchmark") && !location.hash.includes("about")
        : location.hash.includes(a.dataset.route);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  window.addEventListener("hashchange", () => { navState(); route(); });

  /* ---------------------------------------------------------- theme toggle */

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const root = document.documentElement;
      const dark = root.getAttribute("data-theme") !== "dark";
      if (dark) root.setAttribute("data-theme", "dark");
      else root.removeAttribute("data-theme");
      try { localStorage.setItem("momentboard-theme", dark ? "dark" : "light"); } catch (e) {}
    });
  }

  /* ---------------------------------------------------------- manual entry + server sync */

  const MANUAL_KEY = "momentboard:manual:v2";

  // Where the persistence server lives:
  //   ""   -> same origin: site served by server/server.js on openclaw:8080
  //           (http://openclaw:8080 or https://openclaw.tailda1b50.ts.net/momentboard)
  //   https://openclaw.tailda1b50.ts.net/momentboard -> GitHub Pages copy (HTTPS)
  //   null -> file:// / unknown: local only
  // Override at any time: window.MOMENTBOARD_API = "http://…";
  const TAILNET_FQDN = "openclaw.tailda1b50.ts.net";
  const API_BASE = (() => {
    try {
      if (window.MOMENTBOARD_API) return window.MOMENTBOARD_API;
      if (location.protocol === "file:") return null;
      const local = ["localhost", "127.0.0.1", "::1", "openclaw", TAILNET_FQDN].includes(location.hostname);
      return local ? "" : "https://" + TAILNET_FQDN + "/momentboard";
    } catch (e) { return null; }
  })();

  async function apiFetch(path, options) {
    // same-origin (API_BASE === "") uses a RELATIVE path so sub-path hosting
    // (e.g. /momentboard on the tailnet) resolves correctly; otherwise absolute.
    const url = API_BASE === "" ? path.replace(/^\/+/, "") : (API_BASE || "") + path;
    const init = Object.assign({ signal: AbortSignal.timeout(3000) }, options || {});
    const res = await fetch(url, init);
    if (!res.ok) throw new Error("api " + res.status);
    return res.json();
  }

  // identity of a published row within a benchmark (name disambiguates XML / XML+)
  const rowKey = (benchId, method, name) => `${benchId}|${method || ""}|${name || ""}`;
  const decodeRowKey = (key) => {
    const parts = String(key).split("|");
    return [parts[0] || "", parts[1] || "", parts[2] || ""];
  };
  const benchInfo = (benchId) => {
    const b = DATA.benchmarks.find((x) => x.id === benchId);
    return b ? { name: b.name, split: b.split } : { name: benchId, split: "" };
  };
  const findPublishedRow = (benchId, method, name) => {
    const b = DATA.benchmarks.find((x) => x.id === benchId);
    return b ? b.rows.find((r) => r.method === method && (r.name || "") === (name || "")) || null : null;
  };

  const STORE = {
    entries: [],
    mode: "local", // "server" | "local"
    async init() {
      if (API_BASE === null) { this.loadLocal(); return this.mode; }
      try {
        const data = await apiFetch("/api/entries", { method: "GET" });
        this.entries = Array.isArray(data.entries) ? data.entries : [];
        this.mode = "server";
      } catch (e) {
        this.mode = "local";
        this.loadLocal();
      }
      return this.mode;
    },
    loadLocal() {
      try {
        const raw = JSON.parse(localStorage.getItem(MANUAL_KEY) || "null");
        this.entries = raw && Array.isArray(raw.entries) ? raw.entries : [];
      } catch (e) { this.entries = []; }
    },
    persistLocal() {
      try { localStorage.setItem(MANUAL_KEY, JSON.stringify({ version: 2, entries: this.entries })); } catch (e) {}
    },
    async add(entry) {
      const full = Object.assign(
        { id: "m-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6) },
        entry, { updated: new Date().toISOString() });
      if (this.mode === "server") {
        const data = await apiFetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(full) });
        this.entries = data.entries || this.entries;
      } else {
        this.entries.push(full);
        this.persistLocal();
      }
      return full.id;
    },
    async update(id, patch) {
      if (this.mode === "server") {
        const data = await apiFetch("/api/entries/" + encodeURIComponent(id), {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
        this.entries = data.entries || this.entries;
      } else {
        const i = this.entries.findIndex((e) => e.id === id);
        if (i >= 0) { this.entries[i] = Object.assign({}, this.entries[i], patch, { updated: new Date().toISOString() }); this.persistLocal(); }
      }
    },
    async remove(id) {
      if (this.mode === "server") {
        const data = await apiFetch("/api/entries/" + encodeURIComponent(id), { method: "DELETE" });
        this.entries = data.entries || this.entries;
      } else {
        this.entries = this.entries.filter((e) => e.id !== id);
        this.persistLocal();
      }
    },
    overrideFor(benchId, method, name) {
      const key = rowKey(benchId, method, name);
      return this.entries.find((e) => e.kind === "override"
        && rowKey(e.benchmark, e.target && e.target.method, e.target && e.target.name) === key) || null;
    }
  };

  // manual entries (kind: manual) -> brand-new table rows
  function manualRowsFor(benchId) {
    const bench = DATA.benchmarks.find((b) => b.id === benchId);
    const ids = new Set((bench ? bench.metrics : []).map((m) => m.id));
    return STORE.entries
      .filter((e) => e.kind === "manual" && e.benchmark === benchId)
      .map((e) => ({
        method: e.id,
        name: e.method,
        values: Object.fromEntries(Object.entries(e.values || {})
          .filter(([k, v]) => ids.has(k) && typeof v === "number")),
        setting: e.setting === "zero-shot" || e.setting === "fine-tuned" ? e.setting : "",
        note: e.note || "",
        paper: e.paper || "",
        added: e.added || (e.updated || "").slice(0, 10),
        manual: true
      }));
  }

  // corrections (kind: override) layered on top of published rows
  function applyOverrides(benchId, baseRows) {
    return baseRows.map((r) => {
      const o = STORE.overrideFor(benchId, r.method, r.name);
      if (!o) return r;
      return Object.assign({}, r, {
        values: Object.assign({}, o.values || {}),
        corrected: true,
        overrideId: o.id,
        correctionNote: o.note || "",
        correctedAt: (o.updated || "").slice(0, 10)
      });
    });
  }

  // bare arXiv ids ("2404.00801" / "arXiv:2404.00801") become links
  function manualPaperLink(paper) {
    const m = String(paper).trim().match(/^(?:arxiv\s*[:#]?\s*)?(\d{4}\.\d{4,5})$/i);
    return m
      ? `<a href="https://arxiv.org/abs/${m[1]}" target="_blank" rel="noopener">arXiv:${m[1]} ↗</a>`
      : esc(paper);
  }

  function exportManualEntries() {
    const payload = {
      app: "momentboard",
      version: 2,
      exported: new Date().toISOString().slice(0, 10),
      note: "Entries from the Add result / edit forms. Merge with tools/merge_entries.js into js/data.js to publish.",
      entries: STORE.entries
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "momentboard-entries.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function updateSyncStatus() {
    const el = document.getElementById("sync-status");
    if (!el) return;
    if (STORE.mode === "server") {
      el.innerHTML = `<span class="dot ok"></span>synced · server`;
      el.title = "Entries persist on the momentboard server";
    } else {
      el.innerHTML = `<span class="dot warn"></span>local only`;
      el.title = "Server unreachable — entries stay in this browser only";
    }
  }

  function updateExportBtn() {
    const btn = document.getElementById("export-json");
    if (btn) btn.hidden = STORE.entries.length === 0;
  }

  let refreshCurrent = null; // set by renderBenchmark; redraws the live table
  let manualDialog = null;
  let modalMode = "add";     // "add" | "edit" | "override"
  let modalId = null;        // entry id for "edit"
  let modalTarget = null;    // {bench, method, name} for "override"

  function buildManualDialog() {
    const dlg = document.createElement("dialog");
    dlg.className = "modal";
    dlg.setAttribute("aria-labelledby", "manual-title");
    dlg.innerHTML = `
    <div class="modal-card">
      <header class="modal-head">
        <div>
          <p class="modal-eyebrow">Manual entry · this browser only</p>
          <h2 class="modal-title" id="manual-title">Add a result</h2>
        </div>
        <button type="button" class="modal-close" aria-label="Close">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </header>
      <form class="modal-body" id="manual-form" novalidate>
        <div class="field" id="m-method-field">
          <label for="m-method">Method name <span class="req">*</span></label>
          <input id="m-method" placeholder="e.g. MyMethod-7B" autocomplete="off">
        </div>
        <div class="field-row" id="m-row-field">
          <div class="field">
            <label for="m-bench">Benchmark</label>
            <select id="m-bench">
              ${DATA.benchmarks.map((b) => `<option value="${esc(b.id)}">${esc(b.name)} · ${esc(b.split)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <span class="field-label" id="m-seg-label">Setting</span>
            <div class="seg" role="group" aria-labelledby="m-seg-label">
              <button type="button" aria-pressed="true" data-setting="fine-tuned">fine-tuned</button>
              <button type="button" aria-pressed="false" data-setting="zero-shot">zero-shot</button>
            </div>
          </div>
        </div>
        <div class="override-banner" id="m-banner" hidden></div>
        <div class="field" id="m-paper-field">
          <label for="m-paper">Paper / source <span class="opt">optional</span></label>
          <input id="m-paper" placeholder="arXiv:XXXX.XXXXX, a title or a URL" autocomplete="off">
        </div>
        <div class="field">
          <label for="m-note">Note <span class="opt">optional</span></label>
          <input id="m-note" placeholder="e.g. Table 3 · val split · CLIP backbone" autocomplete="off">
        </div>
        <div class="scores">
          <div class="scores-head">
            <p class="scores-label" id="m-scores-title"></p>
            <p class="scores-hint">blank = not reported</p>
          </div>
          <div class="scores-grid" id="m-scores-grid"></div>
        </div>
        <p class="form-error" id="m-error" hidden></p>
      </form>
      <footer class="modal-foot">
        <button type="button" class="btn btn-ghost" id="m-cancel">Cancel</button>
        <button type="submit" class="btn btn-primary" id="m-save" form="manual-form">Save entry</button>
      </footer>
    </div>`;
    document.body.appendChild(dlg);

    const form = dlg.querySelector("#manual-form");
    const methodField = form.querySelector("#m-method-field");
    const methodInput = form.querySelector("#m-method");
    const rowField = form.querySelector("#m-row-field");
    const benchSel = form.querySelector("#m-bench");
    const seg = form.querySelector(".seg");
    const paperField = form.querySelector("#m-paper-field");
    const paperInput = form.querySelector("#m-paper");
    const noteInput = form.querySelector("#m-note");
    const banner = form.querySelector("#m-banner");
    const scoresTitle = form.querySelector("#m-scores-title");
    const scoresGrid = form.querySelector("#m-scores-grid");
    const errorEl = form.querySelector("#m-error");
    const titleEl = dlg.querySelector("#manual-title");
    const eyebrowEl = dlg.querySelector(".modal-eyebrow");
    const saveBtn = dlg.querySelector("#m-save");

    function renderScores(benchId, values) {
      const bench = DATA.benchmarks.find((b) => b.id === benchId);
      if (!bench) { scoresTitle.textContent = ""; scoresGrid.innerHTML = ""; return; }
      scoresTitle.textContent = `Scores · ${bench.name} (${bench.split})`;
      const groups = [];
      for (const m of bench.metrics) if (!groups.includes(m.group)) groups.push(m.group);
      scoresGrid.innerHTML = groups.map((g) => `
        <p class="score-group">${esc(g)}</p>
        ${bench.metrics.filter((m) => m.group === g).map((m) => `
          <label class="score-field">
            <span>${esc(m.label)}</span>
            <input type="text" inputmode="decimal" placeholder="–" data-metric="${esc(m.id)}" autocomplete="off">
          </label>`).join("")}
      `).join("");
      for (const [mid, v] of Object.entries(values || {})) {
        const inp = scoresGrid.querySelector(`input[data-metric="${esc(mid)}"]`);
        if (inp && typeof v === "number") inp.value = v;
      }
    }
    dlg._renderScores = renderScores;

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
    }

    function resetForm() {
      form.reset();
      errorEl.hidden = true;
      errorEl.textContent = "";
      methodInput.removeAttribute("aria-invalid");
      seg.querySelectorAll("button").forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.setting === "fine-tuned")));
      // restore default visibility for next open
      methodField.hidden = false;
      rowField.hidden = false;
      paperField.hidden = false;
      banner.hidden = true;
      benchSel.disabled = false;
      renderScores(benchSel.value, {});
    }

    const closeDialog = () => {
      if (typeof dlg.close === "function" && dlg.open) dlg.close();
      else dlg.removeAttribute("open");
    };

    benchSel.addEventListener("change", () => { errorEl.hidden = true; renderScores(benchSel.value, {}); });

    seg.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-setting]");
      if (!btn) return;
      seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    });

    dlg.querySelector(".modal-close").addEventListener("click", closeDialog);
    dlg.querySelector("#m-cancel").addEventListener("click", closeDialog);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDialog(); });
    dlg.addEventListener("close", resetForm);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const values = {};
      let bad = null;
      for (const inp of scoresGrid.querySelectorAll("input[data-metric]")) {
        const raw = inp.value.trim();
        if (!raw) continue;
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0 || n > 100) {
          bad = inp;
          inp.setAttribute("aria-invalid", "true");
          continue;
        }
        inp.removeAttribute("aria-invalid");
        values[inp.dataset.metric] = n;
      }
      if (bad) {
        showError(`“${bad.closest(".score-field").querySelector("span").textContent}” must be a number from 0 to 100.`);
        bad.focus();
        return;
      }

      const note = noteInput.value.trim();
      let entryId = null;
      try {
        if (modalMode === "override") {
          const o = STORE.overrideFor(modalTarget.bench, modalTarget.method, modalTarget.name);
          if (o) { await STORE.update(o.id, { values, note }); entryId = null; }
          else {
            entryId = await STORE.add({ kind: "override", benchmark: modalTarget.bench,
              target: { method: modalTarget.method, name: modalTarget.name || "" }, values, note });
          }
        } else {
          if (!methodInput.value.trim()) {
            showError("Give the method a name.");
            methodInput.setAttribute("aria-invalid", "true");
            methodInput.focus();
            return;
          }
          methodInput.removeAttribute("aria-invalid");
          const base = {
            benchmark: benchSel.value,
            setting: seg.querySelector("button[aria-pressed='true']").dataset.setting,
            paper: paperInput.value.trim(),
            note,
            values
          };
          if (modalMode === "edit") {
            await STORE.update(modalId, Object.assign({ method: methodInput.value.trim() }, base));
            entryId = modalId;
          } else {
            entryId = await STORE.add(Object.assign(
              { kind: "manual", method: methodInput.value.trim(), added: new Date().toISOString().slice(0, 10) }, base));
          }
        }
      } catch (err) {
        showError("Could not save — the server is unreachable. Check the sync status and try again.");
        return;
      }

      closeDialog(); // triggers resetForm via the close event
      if (modalMode === "override") route();          // re-render: timeline shows corrected values
      else if (refreshCurrent) refreshCurrent();      // manual add/edit: table refresh is enough
      updateSyncStatus();
      updateExportBtn();
      const key = modalMode === "override"
        ? rowKey(modalTarget.bench, modalTarget.method, modalTarget.name)
        : (entryId ? `|${entryId}|` : "");
      const sel = modalMode === "override" ? `[data-key="${esc(key)}"]` : `[data-method="${esc(entryId)}"]`;
      const tr = document.querySelector(`tr.row-method${sel}`);
      if (tr) { tr.classList.add("flash"); tr.scrollIntoView({ block: "center" }); }
    });

    return dlg;
  }

  function openManualDialog(benchId, opts) {
    opts = opts || {};
    if (!manualDialog) manualDialog = buildManualDialog();
    const dlg = manualDialog;
    modalMode = opts.mode || "add";
    modalId = opts.id || null;
    modalTarget = opts.target || null;

    const form = dlg.querySelector("#manual-form");
    const methodField = form.querySelector("#m-method-field");
    const methodInput = form.querySelector("#m-method");
    const rowField = form.querySelector("#m-row-field");
    const benchSel = form.querySelector("#m-bench");
    const seg = form.querySelector(".seg");
    const paperField = form.querySelector("#m-paper-field");
    const paperInput = form.querySelector("#m-paper");
    const noteInput = form.querySelector("#m-note");
    const banner = form.querySelector("#m-banner");
    const titleEl = dlg.querySelector("#manual-title");
    const eyebrowEl = dlg.querySelector(".modal-eyebrow");
    const saveBtn = dlg.querySelector("#m-save");
    const errorEl = form.querySelector("#m-error");

    errorEl.hidden = true;
    errorEl.textContent = "";
    methodInput.removeAttribute("aria-invalid");

    if (modalMode === "override") {
      titleEl.textContent = "Correct result";
      eyebrowEl.textContent = "Correction · overrides the published value";
      saveBtn.textContent = "Save correction";
      const info = benchInfo(modalTarget.bench);
      const row = findPublishedRow(modalTarget.bench, modalTarget.method, modalTarget.name);
      const o = STORE.overrideFor(modalTarget.bench, modalTarget.method, modalTarget.name);
      const effective = (o ? o.values : (row ? row.values : {}));
      methodField.hidden = true;
      rowField.hidden = true;
      paperField.hidden = true;
      banner.hidden = false;
      banner.innerHTML = `Correcting the published result for <b>${esc(methodName(row || { method: modalTarget.method, name: modalTarget.name }))}</b> · ${esc(info.name)} (${esc(info.split)})`;
      benchSel.value = modalTarget.bench;
      dlg._renderScores(modalTarget.bench, effective);
      noteInput.value = (o && o.note) || "";
    } else {
      const isEdit = modalMode === "edit";
      titleEl.textContent = isEdit ? "Edit entry" : "Add a result";
      eyebrowEl.textContent = "Manual entry · synced to your server";
      saveBtn.textContent = isEdit ? "Save changes" : "Save entry";
      methodField.hidden = false;
      rowField.hidden = false;
      paperField.hidden = false;
      banner.hidden = true;
      benchSel.disabled = isEdit;
      if (isEdit) {
        const e = STORE.entries.find((x) => x.id === modalId) || {};
        benchSel.value = e.benchmark || benchId;
        methodInput.value = e.method || "";
        seg.querySelectorAll("button").forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.setting === ((e.setting || "fine-tuned")))));
        paperInput.value = e.paper || "";
        noteInput.value = e.note || "";
        dlg._renderScores(benchSel.value, e.values || {});
      } else {
        benchSel.value = benchId;
        dlg._renderScores(benchId, {});
      }
    }

    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
    if (modalMode === "override") noteInput.focus();
    else methodInput.focus();
  }

  /* ---------------------------------------------------------- home */

  function renderHome() {
    const leaders = sotaSummary();
    let bestBench = null, bestScore = -1;
    for (const id in leaders) {
      const { row, bench, metric } = leaders[id];
      if (row.values[metric.id] > bestScore) { bestScore = row.values[metric.id]; bestBench = bench; }
    }
    const bestRow = bestBench ? leaders[bestBench.id].row : null;
    const bestMetric = bestBench ? leaders[bestBench.id].metric : null;
    const leadCount = Object.values(leaders).filter((l) =>
      l.row.method === (bestRow && bestRow.method) && !l.row.name).length;

    const cards = DATA.benchmarks.map((b) => {
      const pm = primaryMetric(b);
      const best = b.rows.reduce((acc, r) =>
        (r.values[pm.id] != null && r.values[pm.id] > (acc ? acc.values[pm.id] : -1) ? r : acc), null);
      const maxV = Math.max(...b.rows.map((r) => r.values[pm.id] || 0));
      const ticks = b.rows
        .filter((r) => r.values[pm.id] != null)
        .map((r) => `<span class="timeline-tick${r === best ? " is-sota" : ""}" title="${esc(methodName(r))}: ${fmt(r.values[pm.id])}" style="left:${((r.values[pm.id] / maxV) * 100).toFixed(1)}%"></span>`)
        .join("");
      return `
      <a class="card" href="#/benchmark/${b.id}">
        <div class="card-top">
          <span class="card-name">${esc(b.name)}</span>
          <span class="card-split">${esc(b.split)}</span>
        </div>
        <div class="card-task">${esc(b.task)}</div>
        <div class="timeline" aria-hidden="true">
          <span class="timeline-track"></span>${ticks}
        </div>
        <div class="card-bottom">
          <span class="card-sota-name">${esc(methodName(best))} <span class="card-sota-score">${fmt(best.values[pm.id])} ${esc(pm.label)}</span></span>
          <span class="card-count">${b.rows.length} methods</span>
        </div>
      </a>`;
    }).join("");

    $view.innerHTML = `
      <div class="wrap">
        <section class="hero">
          <p class="eyebrow">Temporal sentence grounding · Video moment retrieval</p>
          <h1>Who grounds the <span class="hl">moment</span> best?</h1>
          <p class="hero-sub">
            Method rankings for temporal sentence grounding and video moment
            retrieval, compiled from published results across ${DATA.benchmarks.length}
            benchmarks. Sort any column, expand any row for the paper behind
            the number.
          </p>
          <div class="hero-stats">
            <div class="stat"><div class="stat-value">${DATA.benchmarks.length}</div><div class="stat-label">Benchmarks</div></div>
            <div class="stat"><div class="stat-value">${countMethods()}</div><div class="stat-label">Methods</div></div>
            <div class="stat"><div class="stat-value">${countRows()}</div><div class="stat-label">Reported results</div></div>
            <div class="stat"><div class="stat-value">${esc(fmtDate(DATA.updated))}</div><div class="stat-label">Last updated</div></div>
          </div>
          <div class="sota">
            <span class="sota-label">Current moment</span>
            <span class="sota-model">${esc(methodName(bestRow))}</span>
            <span class="sota-score">${fmt(bestRow.values[bestMetric.id])} ${esc(bestMetric.label)}</span>
            <span class="sota-meta">leads ${leadCount} of ${DATA.benchmarks.length} benchmarks · ${esc(bestBench.name)} · ${esc(bestBench.split)}</span>
          </div>
        </section>
        <section>
          <div class="section-head">
            <h2 class="section-title">Benchmarks</h2>
            <span class="section-note">Ranked by primary metric</span>
          </div>
          <div class="cards">${cards}</div>
          <div class="taxonomy">
            <p class="taxonomy-label">Method tags · from the research library taxonomy</p>
            <p class="taxonomy-tags">${TAG_ORDER.filter((t) => tagCountAll(t) > 0)
              .map((t) => `<span class="taxonomy-pair"><span class="tag topic">${esc(TAG_LABELS[t] || t)}</span> <span class="taxonomy-n">${tagCountAll(t)}</span></span>`)
              .join('<span class="taxonomy-sep"></span>')}</p>
          </div>
        </section>
      </div>`;
    window.scrollTo(0, 0);
  }

  function countMethods() {
    return new Set(DATA.benchmarks.flatMap((b) => b.rows.map((r) => r.method))).size;
  }
  function tagCountAll(tag) {
    return DATA.benchmarks.reduce((n, b) => n + b.rows.filter((r) => methodTags(r.method).includes(tag)).length, 0);
  }
  function countRows() {
    return DATA.benchmarks.reduce((n, b) => n + b.rows.length, 0);
  }

  /* ---------------------------------------------------------- benchmark */

  function renderBenchmark(id) {
    const bench = DATA.benchmarks.find((b) => b.id === id);
    if (!bench) return renderHome();

    const pm = primaryMetric(bench);
    const st = state[id] || { sortMetric: pm.id, dir: "desc", tag: null };
    state[id] = st;
    const metricById = Object.fromEntries(bench.metrics.map((m) => [m.id, m]));

    // unavailable papers (not yet extracted) appear as rows at the bottom (non-mutating)
    const gapRows = (DATA.unavailable || [])
      .filter((u) => u.benchmarks.includes(id))
      .map((u) => ({ method: u.id, values: {}, failed: u.code, note: u.failReason }));
    const computeRows = () => sortRows(applyOverrides(id, bench.rows).concat(gapRows, manualRowsFor(id)), st.sortMetric, st.dir);
    let rows = computeRows();
    const gapCount = gapRows.length;
    let searchTerm = "";
    const imported = (DATA.imported || []).filter((r) => r.benchmark === id);
    refreshCurrent = () => { rows = computeRows(); drawTable(); };

    /* ---- timeline (published rows + corrections, not manual scratch) ---- */
    const timelineRows = applyOverrides(id, bench.rows);
    const maxV = Math.max(...timelineRows.map((r) => r.values[pm.id] || 0));
    const sorted = sortRows(timelineRows, pm.id, "desc").filter((r) => r.values[pm.id] != null);
    const top3 = sorted.slice(0, 3);
    const pct = (v) => Math.min(99.4, (v / maxV) * 100);
    const pctL = (v) => Math.max(8, Math.min(92, (v / maxV) * 100));

    // collision-aware labels: rank 1 above the track (amber); ranks 2-3 below;
    // if the two below-labels overlap, the left one drops to a second tier.
    const wrapW = Math.min(window.innerWidth - 56, 1116);
    const measure = (() => {
      const c = document.createElement("canvas").getContext("2d");
      c.font = '10.5px "IBM Plex Mono", monospace';
      return (t) => c.measureText(t).width;
    })();
    const belowLabels = top3.slice(1).map((r, i) => {
      const txt = methodName(r) + " " + fmt(r.values[pm.id]);
      return { r, x: (pctL(r.values[pm.id]) / 100) * wrapW, w: measure(txt), txt, idx: i };
    });
    const tier2 = new Set();
    if (belowLabels.length === 2) {
      const [a, b] = belowLabels; // a is the lower-ranked (left), b the better (right)
      if (a.x + a.w / 2 + 16 > b.x - b.w / 2) tier2.add(a.idx);
    }
    const ticks = sorted.map((r) => {
      const isTop = top3.includes(r);
      let cls = "";
      if (isTop && r === sorted[0]) cls = " is-sota";
      let label = "";
      if (isTop) {
        const txt = methodName(r) + " " + fmt(r.values[pm.id]);
        if (r === sorted[0]) {
          label = `<span class="tick-label is-sota" style="left:${pctL(r.values[pm.id]).toFixed(1)}%">${esc(txt)}</span>`;
        } else {
          const b = belowLabels.find((bl) => bl.r === r);
          const extra = b && tier2.has(b.idx) ? " below2" : " below";
          label = `<span class="tick-label${extra}" style="left:${pctL(r.values[pm.id]).toFixed(1)}%">${esc(txt)}</span>`;
        }
      }
      return `<span class="timeline-tick${cls}" title="${esc(methodName(r))}: ${fmt(r.values[pm.id])}" style="left:${pct(r.values[pm.id]).toFixed(1)}%"></span>${label}`;
    }).join("");

    /* ---- header ---- */
    const ds = bench.dataset;
    const dsLink = ds.arxiv ? `<a href="https://arxiv.org/abs/${esc(ds.arxiv)}" target="_blank" rel="noopener">${esc(ds.title)}</a>`
      : (ds.url ? `<a href="${esc(ds.url)}" target="_blank" rel="noopener">${esc(ds.title)}</a>` : esc(ds.title));

    /* ---- table header ---- */
    const groups = [];
    for (const m of bench.metrics) {
      if (!groups.includes(m.group)) groups.push(m.group);
    }
    const groupRow = `<tr class="group-row">
      <th rowspan="2" class="col-rank group-left">#</th>
      <th colspan="2" class="group-left">Method</th>
      ${groups.map((g, gi) => {
        const span = bench.metrics.filter((m) => m.group === g).length;
        return `<th colspan="${span}"${gi > 0 ? ' class="gdiv"' : ""}>${esc(g)}</th>`;
      }).join("")}
    </tr>`;
    const metricRow = `<tr class="metric-row">
      <th colspan="2" class="col-method">Method</th>
      ${bench.metrics.map((m) => {
        const isSort = st.sortMetric === m.id;
        const arrow = isSort ? `<span class="sort-arrow">${st.dir === "desc" ? "▼" : "▲"}</span>` : "";
        const firstOfGroup = bench.metrics.findIndex((x) => x.group === m.group) === bench.metrics.indexOf(m);
        const gdiv = (firstOfGroup && m !== bench.metrics[0]) || (m === bench.metrics[0]) ? " gdiv" : "";
        const sorted = isSort ? " sorted" : "";
        return `<th data-metric="${m.id}" class="${sorted}${gdiv}" aria-sort="${isSort ? (st.dir === "desc" ? "descending" : "ascending") : "none"}">${esc(m.label)}${arrow}</th>`;
      }).join("")}
    </tr>`;

    const metricCols = bench.metrics.length + 3;

    $view.innerHTML = `
      <div class="wrap">
        <section class="bench-head">
          <p class="crumb"><a href="#/">Benchmarks</a> / ${esc(bench.name)}</p>
          <h1 class="bench-title">${esc(bench.name)} <span class="split">${esc(bench.split)}</span></h1>
          <p class="bench-dataset">${dsLink} <span class="metric-legend">· ${esc(ds.venue)}</span></p>
          <div class="timeline timeline-lg" aria-hidden="true">
            <span class="timeline-track"></span>${ticks}
          </div>
          <div class="timeline-scale"><span>0</span><span>${esc(pm.label)} · relative to best</span><span>best</span></div>
        </section>

        <section class="toolbar">
          <div class="search">
            <span class="search-icon" aria-hidden="true">⌕</span>
            <input type="search" id="search" placeholder="Filter methods…" aria-label="Filter methods">
          </div>
          <div class="toolbar-actions">
            <span class="sync-status" id="sync-status" role="status"></span>
            <span class="result-count" id="result-count"></span>
            <button type="button" class="btn btn-ghost" id="export-json" hidden>export JSON</button>
            <button type="button" class="btn btn-primary" id="add-result">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              Add result
            </button>
          </div>
        </section>
        <section class="tagbar" id="tagbar" aria-label="Filter by tag"></section>
        <div class="gaps" id="gaps"></div>

        <div class="table-wrap">
          <table class="leaderboard" id="board">
            <thead>${groupRow}${metricRow}</thead>
            <tbody id="board-body"></tbody>
          </table>
        </div>

        <div id="imported"></div>
      </div>`;

    /* ---- table body ---- */
    const tbody = document.getElementById("board-body");
    const resultCount = document.getElementById("result-count");
    const searchInput = document.getElementById("search");

    function drawTable() {
      const term = searchTerm.toLowerCase();
      let visible = rows.filter((r) => !term || methodName(r).toLowerCase().includes(term));
      if (st.tag) {
        visible = visible.filter((r) => methodTags(r.method).includes(st.tag));
      }
      // best per metric column, computed on visible rows
      const bestPer = {};
      for (const m of bench.metrics) {
        bestPer[m.id] = Math.max(...visible.map((r) => r.values[m.id] != null ? r.values[m.id] : -1));
      }
      resultCount.textContent = `${visible.length} of ${rows.length} results`;

      tbody.innerHTML = visible.map((r, i) => {
        const paper = methodPaper(r.method);
        const rank = i + 1;
        const tags = [];
        if (r.size) tags.push(esc(r.size));
        if (r.setting) tags.push(`<span class="tag ${esc(r.setting)}">${esc(r.setting)}</span>`);
        if (paper) tags.push(`<span class="tag venue">${esc(paper.venue)} ${paper.year}</span>`);
        if (r.manual) tags.push(`<span class="tag manual">manual</span>`);
        if (r.corrected) tags.push(`<span class="tag corrected">corrected</span>`);
        if (r.failed) tags.push(`<span class="tag failed">⚠ no numbers — pending</span>`);
        for (const t of TAG_ORDER) {
          if (!methodTags(r.method).includes(t)) continue;
          if (t === "zero-shot" && r.setting === "zero-shot") continue; // already shown as setting
          tags.push(tagChip(t));
        }
        const metricCells = bench.metrics.map((m) => {
          const v = r.values[m.id];
          if (v == null) return `<td class="cell-metric empty">-</td>`;
          const best = v === bestPer[m.id] ? " best" : "";
          return `<td class="cell-metric${best}" data-metric="${m.id}">${fmt(v)}</td>`;
        }).join("");
        const rankBadge = rank <= 3
          ? `<span class="rank-badge rank-${rank}">${rank}</span>`
          : `<span class="rank-badge">${rank}</span>`;
        const rowActions = r.manual
          ? `<div class="paper-actions">
              <button type="button" class="row-action" data-edit-manual="${esc(r.method)}">edit</button>
              <button type="button" class="row-action is-danger" data-remove-manual="${esc(r.method)}">remove</button>
            </div>`
          : `<div class="paper-actions">
              <button type="button" class="row-action" data-edit-override="${esc(rowKey(id, r.method, r.name))}">${r.corrected ? "edit correction" : "edit"}</button>
              ${r.corrected ? `<button type="button" class="row-action is-danger" data-revert-override="${esc(r.overrideId)}">revert</button>` : ""}
            </div>`;
        const corrNote = r.corrected
          ? `<div class="correction-note">overrides the published value${r.correctedAt ? " · " + esc(fmtDate(r.correctedAt)) : ""}${r.correctionNote ? " · " + esc(r.correctionNote) : ""}</div>`
          : "";
        const paperHtml = r.manual
          ? `<div class="paper">
              <div class="paper-title">${esc(methodName(r))} — manual entry</div>
              <div class="paper-meta">${r.paper ? manualPaperLink(r.paper) + " · " : ""}added ${esc(fmtDate(r.added))}${r.note ? " · " + esc(r.note) : ""}</div>
              ${rowActions}
            </div>`
          : `<div class="paper">
              <div class="paper-title">${esc(paper ? paper.title : "Paper details unavailable")}</div>
              <div class="paper-meta">${esc(paperLink(paper))}${r.note ? " · " + esc(r.note) : ""}${paper && paper.arxiv ? ` · <a href="https://arxiv.org/abs/${esc(paper.arxiv)}" target="_blank" rel="noopener">open paper ↗</a>` : ""}</div>
              ${corrNote}
              ${rowActions}
            </div>`;
        return `
        <tr class="row-method" role="button" tabindex="0" aria-expanded="false" data-idx="${i}" data-method="${esc(r.method)}" data-key="${esc(rowKey(id, r.method, r.name))}">
          <td class="col-rank">${rankBadge}</td>
          <td class="col-method" colspan="2">
            <div class="cell-method">
              <span class="method-name">${esc(methodName(r))}</span>
              <span class="method-tags">${tags.join("")}</span>
              <span class="chevron" aria-hidden="true">▶</span>
            </div>
          </td>
          ${metricCells}
        </tr>
        <tr class="row-paper" hidden>
          <td colspan="${metricCols}">${paperHtml}</td>
        </tr>`;
      }).join("");
    }

    /* ---- gaps banner: papers not yet extracted ---- */
    const gapsEl = document.getElementById("gaps");
    if (gapCount) {
      gapsEl.innerHTML = `
        <div class="gaps-banner" role="note">
          <span class="gaps-head">⚠ ${gapCount} paper${gapCount > 1 ? "s" : ""} — no performance data yet</span>
          <span class="gaps-sub">expand a <span class="tag failed">pending</span> row for its reason · <a href="#/about" class="gaps-link">full list</a> · <span class="gaps-manual">needs manual review</span></span>
        </div>`;
    }

    drawTable();

    /* ---- interactions ---- */
    tbody.addEventListener("click", (e) => {
      const editMan = e.target.closest("[data-edit-manual]");
      if (editMan) {
        e.stopPropagation();
        openManualDialog(id, { mode: "edit", id: editMan.dataset.editManual });
        return;
      }
      const rmMan = e.target.closest("[data-remove-manual]");
      if (rmMan) {
        e.stopPropagation();
        STORE.remove(rmMan.dataset.removeManual).then(() => {
          if (refreshCurrent) refreshCurrent();
          updateSyncStatus();
          updateExportBtn();
        });
        return;
      }
      const editOv = e.target.closest("[data-edit-override]");
      if (editOv) {
        e.stopPropagation();
        const [b, m, n] = decodeRowKey(editOv.dataset.editOverride);
        openManualDialog(b || id, { mode: "override", target: { bench: b, method: m, name: n } });
        return;
      }
      const revOv = e.target.closest("[data-revert-override]");
      if (revOv) {
        e.stopPropagation();
        STORE.remove(revOv.dataset.revertOverride).then(() => {
          route(); // re-render so the timeline also reflects the reverted value
          updateSyncStatus();
          updateExportBtn();
        });
        return;
      }
      const tr = e.target.closest("tr.row-method");
      if (tr) toggleRow(tr);
    });
    tbody.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const tr = e.target.closest("tr.row-method");
        if (tr) { e.preventDefault(); toggleRow(tr); }
      }
    });

    function toggleRow(tr) {
      const paperRow = tr.nextElementSibling;
      const open = tr.classList.toggle("open");
      paperRow.hidden = !open;
      tr.setAttribute("aria-expanded", open ? "true" : "false");
    }

    document.querySelectorAll("th[data-metric]").forEach((th) => {
      th.addEventListener("click", () => {
        const m = th.dataset.metric;
        st.dir = st.sortMetric === m && st.dir === "desc" ? "asc" : "desc";
        st.sortMetric = m;
        rows = computeRows();
        drawTable();
        // update aria-sort markers
        document.querySelectorAll("th[data-metric]").forEach((h) => {
          const active = h.dataset.metric === st.sortMetric;
          h.setAttribute("aria-sort", active ? (st.dir === "desc" ? "descending" : "ascending") : "none");
          h.classList.toggle("sorted", active);
          const arrow = h.querySelector(".sort-arrow");
          if (arrow) arrow.remove();
          if (active) h.insertAdjacentHTML("beforeend", `<span class="sort-arrow">${st.dir === "desc" ? "▼" : "▲"}</span>`);
        });
      });
    });

    searchInput.addEventListener("input", () => {
      searchTerm = searchInput.value;
      drawTable();
    });

    /* ---- tag filter bar ---- */
    const tagbar = document.getElementById("tagbar");
    const tagCounts = {};
    for (const r of bench.rows) {
      for (const t of methodTags(r.method)) {
        if (TAG_ORDER.includes(t)) tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
    const present = TAG_ORDER.filter((t) => tagCounts[t]);
    if (present.length) {
      const chip = (t, active) =>
        `<button class="tagchip${active ? " active" : ""}" data-tag="${t || ""}" aria-pressed="${active}">` +
        `<span class="tagchip-label">${t ? esc(TAG_LABELS[t] || t) : "All"}</span>` +
        `<span class="tagchip-count">${t ? tagCounts[t] : bench.rows.length}</span></button>`;
      tagbar.innerHTML = chip("", !st.tag) + present.map((t) => chip(t, st.tag === t)).join("");
      tagbar.querySelectorAll(".tagchip").forEach((b) => {
        b.addEventListener("click", () => {
          st.tag = b.dataset.tag || null;
          tagbar.querySelectorAll(".tagchip").forEach((x) => {
            const on = x.dataset.tag === (st.tag || "");
            x.classList.toggle("active", on && !!st.tag);
            x.setAttribute("aria-pressed", on && !!st.tag);
          });
          if (!st.tag) tagbar.querySelector('.tagchip[data-tag=""]').classList.add("active");
          drawTable();
        });
      });
    }

    /* ---- imported rows ---- */
    const impEl = document.getElementById("imported");
    if (imported.length) {
      impEl.innerHTML = `
        <div class="imported-note">
          <b>${imported.length} result${imported.length > 1 ? "s" : ""} imported from paper extraction</b> — added
          via <code>tools/import_from_extractor.py</code>, pending manual review:
          <ul>${imported.map((r) => `<li>${esc(r.method)} · ${esc(r.metric || pm.label)} = ${fmt(r.value)} · from ${esc(r.source_paper || "unknown paper")}</li>`).join("")}</ul>
        </div>`;
    }

    /* ---- manual entry controls ---- */
    document.getElementById("add-result").addEventListener("click", () => openManualDialog(id));
    document.getElementById("export-json").addEventListener("click", exportManualEntries);
    updateSyncStatus();
    updateExportBtn();

    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------- about */

  function renderAbout() {
    const benchList = DATA.benchmarks.map((b) => {
      const src = b.id === "charades-sta"
        ? "R2-Tuning, Table 2 (arXiv:2404.00801) and VideoMind benchmark tables"
        : b.id === "qvhighlights"
          ? "VideoMind benchmark tables (docs/BENCHMARK.md)"
          : "VideoMind benchmark tables (docs/BENCHMARK.md)";
      return `<li><b>${esc(b.name)}</b> (${esc(b.split)}) — ${esc(src)}.</li>`;
    }).join("");

    // extraction gaps (methods listed but number-less), for the About page
    const gapList = (DATA.unavailable || []).map((u) => {
      const p = methodPaper(u.id);
      const link = p && p.arxiv
        ? `<a href="https://arxiv.org/abs/${esc(p.arxiv)}" target="_blank" rel="noopener">${esc(methodName(u.id))}</a>`
        : `<span style="text-decoration:none;color:var(--ink)">${esc(methodName(u.id))}</span>`;
      const where = (u.benchmarks && u.benchmarks.length)
        ? `in <b>${u.benchmarks.map((b) => esc(DATA.benchmarks.find((x) => x.id === b)?.name || b)).join(", ")}</b>`
        : "excluded (no table row yet)";
      return `<li><span class="tag failed">${esc(u.code)}</span> ${link} — ${where}. ${esc(u.failReason)}</li>`;
    }).join("");

    $view.innerHTML = `
      <div class="wrap about">
        <p class="eyebrow">About this board</p>
        <h1>Every number points to a paper.</h1>
        <p class="lede">
          Momentboard ranks methods on temporal sentence grounding and video
          moment retrieval benchmarks. Published scores are as reported by the
          authors of the cited papers — nothing here is re-run or estimated.
          Numbers you enter by hand are tagged
          <span class="tag manual">manual</span> and sync to your server;
          corrections of published values are tagged
          <span class="tag corrected">corrected</span>.
        </p>

        <h2>Where the numbers come from</h2>
        <p>Per-benchmark comparison tables are compiled from:</p>
        <ul class="sources-list">
          ${benchList}
        </ul>
        <p style="margin-top:12px">
          Seed rows were added from the papers archived in the research vault
          (Library/Paper), matching each benchmark's own comparison tables.
        </p>
        <p style="margin-top:12px">
          Rows and metric groups follow the original papers: QVHighlights
          reports moment-retrieval recall (R1@0.5 / R1@0.7) and highlight-detection
          mAP; Charades-STA, ActivityNet-Captions, TACoS and Ego4D-NLQ report
          recall at IoU thresholds and mIoU. Values with “—” were not reported.
        </p>

        <h2>Caveats</h2>
        <ul>
          <li>Numbers come from different papers, settings and feature backbones; small differences for the same method across papers (e.g. R2-Tuning) reflect evaluation variants.</li>
          <li>LLM-based methods (TimeChat, VTimeLLM, VideoMind, …) are often evaluated zero-shot on these benchmarks, while classic methods are fine-tuned — the tag on each row shows the setting, so comparisons are fair.</li>
          <li>This board tracks published results, not live submissions.</li>
        </ul>

        <h2>Tags</h2>
        <p>
          Every method carries tags from the same taxonomy used in the
          Obsidian research library (<code>topic/*</code>): <b>training-free</b>,
          <b>zero-shot</b>, <b>Vision-LLM</b>, <b>DETR</b>, <b>diffusion</b>,
          <b>RL</b>, <b>CLIP-sim</b>, <b>video-retrieval</b>, <b>token-opt</b>,
          <b>codebook</b>, <b>survey</b> and <b>VMR</b>. Use the chip bar above
          each table to filter methods by tag; filters combine with search and
          column sorting.
        </p>

        <h2>Data gaps — awaiting extraction</h2>
        <p>
          These are real VMR/TSG papers whose performance numbers could not be
          machine-extracted yet. They still appear on their benchmark tables
          marked <span class="tag failed">⚠ no numbers — pending</span> with
          “-” where scores would go. Close a gap by fetching the venue page or
          running <code>describe_image</code> on the paper's table image, then
          add the row to <code>js/data.js</code>.
        </p>
        <ul class="gaps-list" style="margin-top:4px">${gapList}</ul>
        <p><span class="gaps-manual">needs manual review</span></p>

        <h2>Adding results</h2>
        <p>
          <b>While reading</b> — the <b>Add result</b> button on any benchmark
          page opens a form for typing scores by hand. Entries sync to the
          momentboard server (this machine on your Tailscale network) and
          appear on the table tagged <span class="tag manual">manual</span>.
          If the server is unreachable the toolbar shows
          <span class="sync-status"><span class="dot warn"></span>local only</span>
          and entries stay in this browser until it is reachable again.
        </p>
        <p style="margin-top:12px">
          <b>Fixing extraction errors</b> — expand any row and choose
          <b>edit</b> to correct its scores. The fix is stored as an
          <em>override</em> on the server, layered on top of the published
          value and tagged <span class="tag corrected">corrected</span>; use
          <b>revert</b> to go back to the published number. Manual entries can
          be edited or removed the same way.
        </p>
        <p style="margin-top:12px">
          <b>Where to edit</b> — use the tailnet URL
          <code>https://openclaw.tailda1b50.ts.net/momentboard</code> (or
          <code>http://openclaw:8080</code>) for full syncing. The public
          GitHub Pages copy also syncs when the browser permits it; Chrome's
          local-network security may block it, in which case the toolbar shows
          <span class="sync-status"><span class="dot warn"></span>local only</span>
          and edits stay in that browser.
        </p>
        <p style="margin-top:12px">
          To publish for everyone, run
          <code>tools/merge_entries.js</code> — it folds server overrides and
          manual entries back into <code>js/data.js</code>. You can also add a
          published result directly by editing <code>js/data.js</code> (single
          source of truth), or run the extraction pipeline in
          <code>benchmark-extractor/</code> and import its
          <code>summary.csv</code> with
          <code>tools/import_from_extractor.py</code>.
        </p>

        <h2>Sources</h2>
        <p>
          Seed data was compiled from the research paper library (Library/Paper)
          and the primary papers listed below — every row on the benchmark pages
          links back to its paper. Methods whose notes carry the library's
          <code>topic/*</code> tags are included here (training-free, zero-shot,
          Vision-LLM, DETR, diffusion, RL, …), covering the zero-shot VMR family
          (Moment-GPT, Self-SiMS, ShotDetect, TAG, TFVTG, VTG-GPT, …) and the
          training-free token-pruning line (MarkIt, T2SGrid, SemVID, GroundVTS).
        </p>
        <ul>
          <li>VideoMind — <a href="https://github.com/yeliudev/VideoMind/blob/main/docs/BENCHMARK.md" target="_blank" rel="noopener">benchmark tables</a> (arXiv:2503.13444)</li>
          <li>R2-Tuning — <a href="https://arxiv.org/abs/2404.00801" target="_blank" rel="noopener">arXiv:2404.00801</a>, Table 2</li>
          <li>TFVTG (arXiv:2408.16219) · TAG (arXiv:2508.07925) · Moment-GPT (arXiv:2501.07972) · Self-SiMS (arXiv:2607.19027)</li>
          <li>MarkIt (arXiv:2604.25886) · T2SGrid (arXiv:2603.06973) · SemVID (arXiv:2603.05663) · ShotDetect (arXiv:2211.02178)</li>
          <li>Moment Quantization (arXiv:2504.02286) · LD-DETR (arXiv:2501.10787) · UniTime (arXiv:2506.18883) · CVA (arXiv:2603.24934)</li>
          <li>OmniVTG (arXiv:2604.25276) · GroundVTS (arXiv:2604.02093) · UniVTG (arXiv:2307.16715)</li>
          <li>Point to Span (arXiv:2512.10363) · HiTeA (ICLR 2026, OpenReview) · PZVMR (ACM MM 2022)</li>
        </ul>
      </div>`;
    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------- boot */

  navState();
  route();
  // load server/local entries asynchronously; re-render once synced
  STORE.init().then(() => {
    updateSyncStatus();
    if (refreshCurrent) refreshCurrent();
  });
})();
