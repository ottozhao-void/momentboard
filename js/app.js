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
    "xml": "XML", "unloc": "UnLoc"
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
  };
  const TAG_ORDER = ["training-free", "zero-shot", "vision-llm", "detr", "diffusion", "rl",
    "clip-similarity", "video-retrieval", "input-token-optimization", "codebook", "survey", "vmr"];

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

    let rows = sortRows(bench.rows, st.sortMetric, st.dir);
    let searchTerm = "";
    const imported = (DATA.imported || []).filter((r) => r.benchmark === id);

    /* ---- timeline ---- */
    const maxV = Math.max(...bench.rows.map((r) => r.values[pm.id] || 0));
    const sorted = sortRows(bench.rows, pm.id, "desc").filter((r) => r.values[pm.id] != null);
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
          <span class="result-count" id="result-count"></span>
        </section>
        <section class="tagbar" id="tagbar" aria-label="Filter by tag"></section>

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
        for (const t of TAG_ORDER) {
          if (!methodTags(r.method).includes(t)) continue;
          if (t === "zero-shot" && r.setting === "zero-shot") continue; // already shown as setting
          tags.push(tagChip(t));
        }
        const metricCells = bench.metrics.map((m) => {
          const v = r.values[m.id];
          if (v == null) return `<td class="cell-metric empty">—</td>`;
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
              <div class="paper-meta">${esc(paperLink(paper))}${r.note ? " · " + esc(r.note) : ""}${paper && paper.arxiv ? ` · <a href="https://arxiv.org/abs/${esc(paper.arxiv)}" target="_blank" rel="noopener">open paper ↗</a>` : ""}</div>
            </div>
          </td>
        </tr>`;
      }).join("");
    }
    drawTable();

    /* ---- interactions ---- */
    tbody.addEventListener("click", (e) => {
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
        rows = sortRows(bench.rows, st.sortMetric, st.dir);
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

    $view.innerHTML = `
      <div class="wrap about">
        <p class="eyebrow">About this board</p>
        <h1>Every number points to a paper.</h1>
        <p class="lede">
          Momentboard ranks methods on temporal sentence grounding and video
          moment retrieval benchmarks. All scores are as reported by the
          authors of the cited papers — nothing here is re-run or estimated.
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

        <h2>Adding results</h2>
        <p>
          Edit <code>js/data.js</code> (single source of truth), or run the
          extraction pipeline in <code>benchmark-extractor/</code> and import its
          <code>summary.csv</code> with <code>tools/import_from_extractor.py</code> —
          imported rows appear on the benchmark page marked as pending review.
        </p>

        <h2>Sources</h2>
        <p>
          Seed data was compiled from the research paper library and from the
          primary papers listed below — every row on the benchmark pages links
          back to its paper:
        </p>
        <ul>
          <li>VideoMind — <a href="https://github.com/yeliudev/VideoMind/blob/main/docs/BENCHMARK.md" target="_blank" rel="noopener">benchmark tables</a> (arXiv:2503.13444)</li>
          <li>R2-Tuning — <a href="https://arxiv.org/abs/2404.00801" target="_blank" rel="noopener">arXiv:2404.00801</a>, Table 2</li>
          <li>TFVTG (arXiv:2408.16219) · TAG (arXiv:2508.07925) · ED-VTG (arXiv:2510.17023)</li>
          <li>Moment Quantization (arXiv:2504.02286) · LD-DETR (arXiv:2501.10787) · UniTime (arXiv:2506.18883)</li>
          <li>OmniVTG (arXiv:2604.25276) · GroundVTS (arXiv:2604.02093) · UniVTG (arXiv:2307.16715)</li>
        </ul>
      </div>`;
    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------- boot */

  navState();
  route();
})();
