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
      const best = rowsForBenchmark(b).reduce((acc, r) =>
        (r.values[pm.id] != null && r.values[pm.id] > (acc ? acc.values[pm.id] : -1) ? r : acc), null);
      leaders[b.id] = { row: best, bench: b, metric: pm };
    }
    return leaders;
  }

  function paperLink(p) {
    if (!p) return "";
    const id = p.arxiv ? `arXiv:${p.arxiv}` : "";
    const venue = p.venue ? `${p.venue} ${p.year || ""}`.trim() : String(p.year || "");
    const bits = [venue, id].filter(Boolean);
    return bits.join(" · ");
  }

  function paperSourceLink(p) {
    if (!p) return "";
    if (p.arxiv) return `<a href="https://arxiv.org/abs/${esc(p.arxiv)}" target="_blank" rel="noopener">open paper ↗</a>`;
    const url = safeHttpUrl(p.url);
    return url ? `<a href="${esc(url)}" target="_blank" rel="noopener">open source ↗</a>` : "";
  }

  const MANUAL_STORAGE_KEY = "momentboard-manual-results";
  let manualReturnFocus = null;
  let manualEditingId = null;
  let toastTimer = null;

  function safeHttpUrl(raw) {
    if (!raw || typeof raw !== "string") return "";
    try {
      const url = new URL(raw.trim());
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch (e) {
      return "";
    }
  }

  function readManualEntries() {
    try {
      const raw = localStorage.getItem(MANUAL_STORAGE_KEY);
      const entries = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(entries)) return [];
      return entries.filter((entry) => entry && typeof entry.id === "string" &&
        typeof entry.benchmark === "string" && typeof entry.name === "string" &&
        entry.name.trim() && entry.values && typeof entry.values === "object");
    } catch (e) {
      return [];
    }
  }

  function writeManualEntries(entries) {
    try {
      localStorage.setItem(MANUAL_STORAGE_KEY, JSON.stringify(entries));
      return true;
    } catch (e) {
      return false;
    }
  }

  function methodSlug(name) {
    const slug = String(name).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return `manual-${slug || "result"}`;
  }

  function manualRow(entry, bench) {
    const values = {};
    const metricIds = new Set(bench.metrics.map((m) => m.id));
    for (const [id, value] of Object.entries(entry.values || {})) {
      if (metricIds.has(id) && typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100) {
        values[id] = value;
      }
    }
    const paperTitle = entry.paperTitle || `${entry.name} — manually recorded result`;
    return {
      method: entry.method || methodSlug(entry.name),
      name: entry.name,
      values,
      size: entry.size || "",
      setting: entry.setting || "",
      note: entry.notes || "",
      manual: true,
      manualId: entry.id,
      paper: {
        title: paperTitle,
        venue: entry.venue || "",
        year: Number.isInteger(entry.year) ? entry.year : "",
        url: safeHttpUrl(entry.sourceUrl)
      }
    };
  }

  function rowsForBenchmark(bench) {
    return bench.rows.concat(readManualEntries()
      .filter((entry) => entry.benchmark === bench.id)
      .map((entry) => manualRow(entry, bench)));
  }

  function currentBenchmarkId() {
    const match = location.hash.match(/^#\/?benchmark\/([\w-]+)/);
    return match ? match[1] : null;
  }

  function showToast(message, tone) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast is-visible${tone ? ` ${tone}` : ""}`;
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 4200);
  }

  function manualFieldError(input, error, message) {
    input.setAttribute("aria-invalid", "true");
    error.textContent = message;
  }

  function clearManualErrors() {
    const form = document.getElementById("manual-entry-form");
    if (!form) return;
    form.querySelectorAll(".field-error").forEach((el) => { el.textContent = ""; });
    form.querySelectorAll("[aria-invalid=\"true\"]").forEach((el) => el.removeAttribute("aria-invalid"));
    const summary = document.getElementById("manual-entry-summary");
    if (summary) {
      summary.hidden = true;
      summary.textContent = "";
    }
  }

  function updateManualMetricFields(benchmarkId, values) {
    const fieldset = document.getElementById("manual-metric-fields");
    const context = document.getElementById("manual-entry-context");
    if (!fieldset || !context) return;
    const bench = DATA.benchmarks.find((item) => item.id === benchmarkId);
    if (!bench) {
      context.innerHTML = `<span class="dialog-context-empty">Choose a benchmark to load its metric columns.</span>`;
      fieldset.innerHTML = `<p class="metric-empty">Select a benchmark above to enter its scores.</p>`;
      return;
    }
    context.innerHTML = `<span class="dialog-context-label">Recording for</span><strong>${esc(bench.name)}</strong><span class="dialog-context-split">${esc(bench.split)}</span>`;
    fieldset.innerHTML = bench.metrics.map((metric) => {
      const inputId = `manual-metric-${metric.id}`;
      return `<div class="metric-entry">
        <label for="${esc(inputId)}">${esc(metric.label)}<span class="metric-group">${esc(metric.group)}</span></label>
        <input id="${esc(inputId)}" name="${esc(metric.id)}" type="number" min="0" max="100" step="any" inputmode="decimal" placeholder="—" aria-describedby="${esc(inputId)}-error">
        <p class="field-error" id="${esc(inputId)}-error" aria-live="polite"></p>
      </div>`;
    }).join("");
    for (const metric of bench.metrics) {
      const input = document.getElementById(`manual-metric-${metric.id}`);
      if (input && values && values[metric.id] != null) input.value = values[metric.id];
    }
  }

  function populateManualBenchmarks() {
    const select = document.getElementById("manual-benchmark");
    if (!select) return;
    select.innerHTML = `<option value="">Choose a benchmark…</option>` + DATA.benchmarks.map((bench) =>
      `<option value="${esc(bench.id)}">${esc(bench.name)} · ${esc(bench.split)}</option>`).join("");
  }

  function restoreManualFocus() {
    const target = manualReturnFocus;
    manualReturnFocus = null;
    manualEditingId = null;
    const benchmark = document.getElementById("manual-benchmark");
    if (benchmark) benchmark.disabled = false;
    if (target && target.isConnected) target.focus();
  }

  function closeManualEntryModal() {
    const dialog = document.getElementById("manual-entry-modal");
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      if (dialog.open) dialog.close();
    } else {
      dialog.removeAttribute("open");
      restoreManualFocus();
    }
  }

  function openManualEntryModal(benchmarkId, entryId) {
    const dialog = document.getElementById("manual-entry-modal");
    const form = document.getElementById("manual-entry-form");
    if (!dialog || !form) return;
    const entry = entryId ? readManualEntries().find((item) => item.id === entryId) : null;
    manualEditingId = entry ? entry.id : null;
    manualReturnFocus = document.activeElement;
    form.reset();
    clearManualErrors();

    const title = document.getElementById("manual-entry-title");
    const intro = document.getElementById("manual-entry-intro");
    const save = document.getElementById("manual-entry-save");
    const benchmark = document.getElementById("manual-benchmark");
    title.textContent = entry ? "Update result" : "Record a result";
    intro.textContent = entry
      ? "Correct the values or source details for this local result."
      : "Capture a paper’s reported scores while you read. Your entry stays in this browser until you remove it.";
    save.textContent = entry ? "Save changes" : "Save result";
    benchmark.disabled = !!entry;
    benchmark.value = entry ? entry.benchmark : (benchmarkId || "");
    updateManualMetricFields(benchmark.value, entry ? entry.values : {});

    if (entry) {
      document.getElementById("manual-method").value = entry.name || "";
      document.getElementById("manual-setting").value = entry.setting || "";
      document.getElementById("manual-size").value = entry.size || "";
      document.getElementById("manual-paper-title").value = entry.paperTitle || "";
      document.getElementById("manual-venue").value = entry.venue || "";
      document.getElementById("manual-year").value = entry.year || "";
      document.getElementById("manual-source-url").value = entry.sourceUrl || "";
      document.getElementById("manual-notes").value = entry.notes || "";
    }

    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    window.requestAnimationFrame(() => document.getElementById("manual-method").focus());
  }

  function submitManualEntry(event) {
    event.preventDefault();
    clearManualErrors();
    const method = document.getElementById("manual-method");
    const benchmark = document.getElementById("manual-benchmark");
    const year = document.getElementById("manual-year");
    const sourceUrl = document.getElementById("manual-source-url");
    const summary = document.getElementById("manual-entry-summary");
    let firstInvalid = null;
    let errorCount = 0;
    const invalidate = (input, error, message) => {
      errorCount += 1;
      if (!firstInvalid) firstInvalid = input;
      manualFieldError(input, error, message);
    };

    if (!method.value.trim()) invalidate(method, document.getElementById("manual-method-error"), "Enter a method name.");
    if (!benchmark.value) invalidate(benchmark, document.getElementById("manual-benchmark-error"), "Choose the benchmark for these scores.");

    const bench = DATA.benchmarks.find((item) => item.id === benchmark.value);
    const values = {};
    let hasValue = false;
    if (bench) {
      for (const metric of bench.metrics) {
        const input = document.getElementById(`manual-metric-${metric.id}`);
        const error = document.getElementById(`manual-metric-${metric.id}-error`);
        const raw = input ? input.value.trim() : "";
        if (!raw) continue;
        const value = Number(raw);
        if (!Number.isFinite(value) || value < 0 || value > 100) {
          invalidate(input, error, "Use a number from 0 to 100.");
        } else {
          values[metric.id] = value;
          hasValue = true;
        }
      }
    }
    if (bench && !hasValue) {
      errorCount += 1;
      const valuesError = document.getElementById("manual-values-error");
      valuesError.textContent = "Enter at least one performance value.";
      if (!firstInvalid) firstInvalid = document.getElementById(`manual-metric-${bench.metrics[0].id}`);
    }

    const yearRaw = year.value.trim();
    if (yearRaw && (!Number.isInteger(Number(yearRaw)) || Number(yearRaw) < 1900 || Number(yearRaw) > 2100)) {
      invalidate(year, document.getElementById("manual-year-error"), "Use a four-digit year from 1900 to 2100.");
    }
    const sourceRaw = sourceUrl.value.trim();
    if (sourceRaw && (!sourceUrl.checkValidity() || !safeHttpUrl(sourceRaw))) {
      invalidate(sourceUrl, document.getElementById("manual-source-url-error"), "Use a valid http:// or https:// URL.");
    }

    if (errorCount) {
      summary.hidden = false;
      summary.textContent = errorCount === 1 ? "Check the highlighted field." : `Check the ${errorCount} highlighted fields.`;
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const entry = {
      id: manualEditingId || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      benchmark: benchmark.value,
      method: methodSlug(method.value),
      name: method.value.trim(),
      setting: document.getElementById("manual-setting").value,
      size: document.getElementById("manual-size").value.trim(),
      values,
      paperTitle: document.getElementById("manual-paper-title").value.trim(),
      venue: document.getElementById("manual-venue").value.trim(),
      year: yearRaw ? Number(yearRaw) : "",
      sourceUrl: sourceRaw ? safeHttpUrl(sourceRaw) : "",
      notes: document.getElementById("manual-notes").value.trim(),
      updatedAt: new Date().toISOString()
    };
    const entries = readManualEntries();
    const existing = entries.findIndex((item) => item.id === entry.id);
    if (existing >= 0) entries[existing] = entry;
    else entries.push(entry);
    if (!writeManualEntries(entries)) {
      summary.hidden = false;
      summary.textContent = "This browser could not save local data. Check storage permissions and try again.";
      return;
    }

    const wasEditing = !!manualEditingId;
    closeManualEntryModal();
    const destination = `#/benchmark/${entry.benchmark}`;
    if (currentBenchmarkId() === entry.benchmark) route();
    else location.hash = destination;
    showToast(wasEditing ? "Result updated" : "Result saved");
  }

  function setupManualEntry() {
    const dialog = document.getElementById("manual-entry-modal");
    const form = document.getElementById("manual-entry-form");
    const benchmark = document.getElementById("manual-benchmark");
    if (!dialog || !form || dialog.dataset.ready) return;
    dialog.dataset.ready = "true";
    populateManualBenchmarks();
    benchmark.addEventListener("change", () => {
      clearManualErrors();
      updateManualMetricFields(benchmark.value, {});
    });
    form.addEventListener("submit", submitManualEntry);
    document.getElementById("manual-entry-close").addEventListener("click", closeManualEntryModal);
    document.getElementById("manual-entry-cancel").addEventListener("click", closeManualEntryModal);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeManualEntryModal();
    });
    dialog.addEventListener("close", restoreManualFocus);
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-open-manual]");
      if (!trigger) return;
      openManualEntryModal(trigger.dataset.benchmarkId || currentBenchmarkId());
    });
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
      l.row && l.row.method === (bestRow && bestRow.method)).length;

    const cards = DATA.benchmarks.map((b) => {
      const pm = primaryMetric(b);
      const benchmarkRows = rowsForBenchmark(b);
      const best = benchmarkRows.reduce((acc, r) =>
        (r.values[pm.id] != null && r.values[pm.id] > (acc ? acc.values[pm.id] : -1) ? r : acc), null);
      const maxV = Math.max(...benchmarkRows.map((r) => r.values[pm.id] || 0));
      const ticks = benchmarkRows
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
          <span class="card-sota-name">${esc(methodName(best))}${best.manual ? ' <span class="tag manual">manual</span>' : ""} <span class="card-sota-score">${fmt(best.values[pm.id])} ${esc(pm.label)}</span></span>
          <span class="card-count">${benchmarkRows.length} results</span>
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
            the number, or record a result as you read.
          </p>
          <div class="hero-stats">
            <div class="stat"><div class="stat-value">${DATA.benchmarks.length}</div><div class="stat-label">Benchmarks</div></div>
            <div class="stat"><div class="stat-value">${countMethods()}</div><div class="stat-label">Methods</div></div>
            <div class="stat"><div class="stat-value">${countRows()}</div><div class="stat-label">Results on board</div></div>
            <div class="stat"><div class="stat-value">${esc(fmtDate(DATA.updated))}</div><div class="stat-label">Last updated</div></div>
          </div>
          <div class="sota">
            <span class="sota-label">Current moment</span>
            <span class="sota-model">${esc(methodName(bestRow))}${bestRow.manual ? ' <span class="tag manual">manual</span>' : ""}</span>
            <span class="sota-score">${fmt(bestRow.values[bestMetric.id])} ${esc(bestMetric.label)}</span>
            <span class="sota-meta">leads ${leadCount} of ${DATA.benchmarks.length} benchmarks · ${esc(bestBench.name)} · ${esc(bestBench.split)}</span>
          </div>
        </section>
        <section>
          <div class="section-head">
            <div>
              <h2 class="section-title">Benchmarks</h2>
              <span class="section-note">Ranked by primary metric</span>
            </div>
            <button type="button" class="button-secondary section-action" data-open-manual>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              Record a result
            </button>
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
    return new Set(DATA.benchmarks.flatMap((b) => rowsForBenchmark(b).map((r) => r.method))).size;
  }
  function tagCountAll(tag) {
    return DATA.benchmarks.reduce((n, b) => n + rowsForBenchmark(b).filter((r) => methodTags(r.method).includes(tag)).length, 0);
  }
  function countRows() {
    return DATA.benchmarks.reduce((n, b) => n + rowsForBenchmark(b).length, 0);
  }

  /* ---------------------------------------------------------- benchmark */

  function renderBenchmark(id) {
    const bench = DATA.benchmarks.find((b) => b.id === id);
    if (!bench) return renderHome();

    const pm = primaryMetric(bench);
    const st = state[id] || { sortMetric: pm.id, dir: "desc", tag: null };
    state[id] = st;
    const metricById = Object.fromEntries(bench.metrics.map((m) => [m.id, m]));

    const benchmarkRows = rowsForBenchmark(bench);
    // unavailable papers (not yet extracted) appear as rows at the bottom (non-mutating)
    const gapRows = (DATA.unavailable || [])
      .filter((u) => u.benchmarks.includes(id))
      .map((u) => ({ method: u.id, values: {}, failed: u.code, note: u.failReason }));
    let rows = sortRows(benchmarkRows.concat(gapRows), st.sortMetric, st.dir);
    const gapCount = gapRows.length;
    let searchTerm = "";
    const imported = (DATA.imported || []).filter((r) => r.benchmark === id);

    /* ---- timeline ---- */
    const maxV = Math.max(...benchmarkRows.map((r) => r.values[pm.id] || 0));
    const sorted = sortRows(benchmarkRows, pm.id, "desc").filter((r) => r.values[pm.id] != null);
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
            <span class="result-count" id="result-count"></span>
            <button type="button" class="button-primary" data-open-manual data-benchmark-id="${esc(bench.id)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              Record result
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
        const paper = r.paper || methodPaper(r.method);
        const rank = i + 1;
        const tags = [];
        if (r.size) tags.push(esc(r.size));
        if (r.setting) tags.push(`<span class="tag ${esc(r.setting)}">${esc(r.setting)}</span>`);
        if (paper && (paper.venue || paper.year)) tags.push(`<span class="tag venue">${esc(paper.venue || "")} ${paper.year || ""}</span>`);
        if (r.manual) tags.push(`<span class="tag manual">manual</span>`);
        if (r.failed) tags.push(`<span class="tag failed">⚠ no numbers — pending</span>`);
        const sourceLink = paperSourceLink(paper);
        const paperMeta = [paperLink(paper), r.note].filter(Boolean).map((item) => esc(item));
        if (sourceLink) paperMeta.push(sourceLink);
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
        return `
        <tr class="row-method" role="button" tabindex="0" aria-expanded="false" data-idx="${i}">
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
          <td colspan="${metricCols}">
            <div class="paper">
              <div class="paper-title">${esc(paper ? paper.title : "Paper details unavailable")}</div>
              <div class="paper-meta">${paperMeta.join(" · ")}</div>
              ${r.manual ? `<div class="paper-actions"><span class="tag manual">saved in this browser</span><button type="button" class="paper-action" data-manual-edit="${esc(r.manualId)}">Edit</button><button type="button" class="paper-action is-danger" data-manual-remove="${esc(r.manualId)}">Remove</button></div>` : ""}
            </div>
          </td>
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
      const edit = e.target.closest("[data-manual-edit]");
      if (edit) {
        e.stopPropagation();
        openManualEntryModal(bench.id, edit.dataset.manualEdit);
        return;
      }
      const remove = e.target.closest("[data-manual-remove]");
      if (remove) {
        e.stopPropagation();
        const entry = readManualEntries().find((item) => item.id === remove.dataset.manualRemove);
        if (!entry || !window.confirm(`Remove the manual result for ${entry.name}?`)) return;
        const remaining = readManualEntries().filter((item) => item.id !== entry.id);
        if (writeManualEntries(remaining)) {
          renderBenchmark(bench.id);
          showToast("Result removed");
        } else {
          showToast("Could not remove result", "error");
        }
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
        rows = sortRows(benchmarkRows.concat(gapRows), st.sortMetric, st.dir);
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
    for (const r of benchmarkRows) {
      for (const t of methodTags(r.method)) {
        if (TAG_ORDER.includes(t)) tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
    const present = TAG_ORDER.filter((t) => tagCounts[t]);
    if (present.length) {
      const chip = (t, active) =>
        `<button class="tagchip${active ? " active" : ""}" data-tag="${t || ""}" aria-pressed="${active}">` +
        `<span class="tagchip-label">${t ? esc(TAG_LABELS[t] || t) : "All"}</span>` +
        `<span class="tagchip-count">${t ? tagCounts[t] : benchmarkRows.length}</span></button>`;
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
          cited papers; local entries are marked manual and remain in your browser.
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
          <li>The published dataset tracks reported results, not live submissions; local manual entries are clearly marked and remain private to this browser.</li>
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
          Use <b>Record result</b> to capture a paper while you read. Manual
          entries are stored locally in this browser, marked <span class="tag manual">manual</span>,
          and can be edited or removed from their expanded row. To publish a
          result for everyone, edit <code>js/data.js</code> or run the
          extraction pipeline in <code>benchmark-extractor/</code> and import its
          <code>summary.csv</code> with <code>tools/import_from_extractor.py</code>.
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

  setupManualEntry();
  navState();
  route();
})();
