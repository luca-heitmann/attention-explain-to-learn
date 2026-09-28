// Shared logic: compute progress and render the overview and topic pages from data/progress.js.
(function () {
  const D = window.PROGRESS;
  const root = document.body.dataset.root || "";
  const VALUE = { open: 0, wrong: 0, partial: 0.5, mastered: 1 };
  const LABEL = { open: "open", wrong: "misconception", partial: "partial", mastered: "mastered" };
  const URGENCY = { wrong: 3, partial: 2, open: 1, mastered: 0 };

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const $ = (sel) => document.querySelector(sel);
  const pct = (x) => Math.round(x * 100);

  // ---------- Theme ----------
  const saved = localStorage.getItem("etl-theme");
  if (saved) document.documentElement.dataset.theme = saved;
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-action=theme]")) return;
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("etl-theme", next);
  });

  // ---------- Progress ----------
  function progress(t) {
    const kps = t.keypoints || [];
    const sum = kps.reduce((a, k) => a + k.weight, 0);
    if (!sum) return { p: 0, mastered: 0, partial: 0, ready: false };
    const w = (st) => kps.filter((k) => k.status === st).reduce((a, k) => a + k.weight, 0) / sum;
    const mastered = w("mastered"), partial = w("partial");
    return { p: mastered + partial * VALUE.partial, mastered, partial, ready: true };
  }
  function aggregate(topics) {
    const rel = topics.filter((t) => t.importance > 0);
    const s = rel.reduce((a, t) => a + t.importance, 0);
    return s ? rel.reduce((a, t) => a + t.importance * progress(t).p, 0) / s : 0;
  }
  const topic = (id) => D.topics.find((t) => t.id === id);
  const link = (t) => (t.page ? root + t.page : null);

  function nextTopics(n = 3) {
    return D.topics
      .filter((t) => t.importance > 0)
      .map((t) => {
        const f = progress(t);
        const started = f.p > 0 && f.p < 1;
        return { t, f, score: t.importance * (1 - f.p) + (started ? 1.5 : 0) + (t.page && f.p < 1 ? 0.25 : 0) };
      })
      .filter((x) => x.f.p < 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  }
  function nextKeypoints(n = 5) {
    const out = [];
    for (const t of D.topics) for (const k of t.keypoints || []) {
      const u = URGENCY[k.status];
      if (u) out.push({ t, k, score: u * 10 + k.weight * t.importance });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, n);
  }

  // ---------- Building blocks ----------
  const stars = (r) => r === 0 ? '<span class="stars">optional</span>'
    : `<span class="stars" title="Importance ${r}/3"><b>${"★".repeat(r)}</b>${"☆".repeat(3 - r)}</span>`;
  const badge = (st) => `<span class="st ${st}">${LABEL[st]}</span>`;
  function meter(f, cls = "") {
    const a = pct(f.mastered ?? f.p), b = pct(f.partial ?? 0);
    return `<div class="meter stack ${cls}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct(f.p)}"
      aria-label="Progress ${pct(f.p)} %" title="mastered: ${a} % · partial: ${b} %">
      ${a ? `<i style="width:${a}%"></i>` : ""}${b ? `<i class="part" style="width:${b}%"></i>` : ""}<i class="rest"></i></div>`;
  }
  function topicRow(t) {
    const f = progress(t), href = link(t), tag = href ? "a" : "div";
    return `<${tag} class="topic ${href ? "" : "disabled"}" ${href ? `href="${href}"` : ""} data-rel="${t.importance}">
      <span class="tid">${t.id}</span><span class="ttl">${esc(t.title)}</span>${stars(t.importance)}
      <span class="meta">${meter(f)}<span class="pct">${f.ready ? pct(f.p) + " %" : "—"}</span>
        ${href ? "" : '<span class="pill">no page yet</span>'}</span>
    </${tag}>`;
  }
  function logEntry(e, withTopic) {
    const t = topic(e.topic);
    const res = (e.results || []).map((r) =>
      `<li><b>${r.kp}</b> ${r.from ? `${badge(r.from)} → ` : ""}${badge(r.to)} ${esc(r.comment || "")}</li>`).join("");
    return `<div class="entry">
      <h4>${esc(e.date)} · ${withTopic && t ? `<a href="${link(t) || "#"}">${t.id} ${esc(t.title)}</a> · ` : ""}${esc(e.title || "Check")}</h4>
      ${e.summary ? `<p class="small">${esc(e.summary)}</p>` : ""}
      ${res ? `<ul>${res}</ul>` : ""}
      ${e.feedback ? `<p class="small"><b>Feedback:</b> ${esc(e.feedback)}</p>` : ""}
      ${e.next ? `<p class="small"><b>Next:</b> ${esc(e.next)}</p>` : ""}
    </div>`;
  }

  // ---------- Overview ----------
  function renderIndex() {
    const total = aggregate(D.topics);
    const all = D.topics.flatMap((t) => t.keypoints || []);
    const cnt = (st) => all.filter((k) => k.status === st).length;
    const pages = D.topics.filter((t) => t.page).length;

    $("#hero").innerHTML = `
      <div class="card">
        <p class="label">Overall progress</p>
        <div class="hero-figure">${pct(total)}<small>%</small></div>
        <div style="margin-top:1rem">${meter({ p: total, mastered: total, partial: 0 }, "lg")}</div>
        <div class="stats">
          <div class="stat"><b>${cnt("mastered")}</b><span>mastered</span></div>
          <div class="stat"><b>${cnt("partial") + cnt("wrong")}</b><span>with gaps</span></div>
          <div class="stat"><b>${cnt("open")}</b><span>open</span></div>
          <div class="stat"><b>${pages}/${D.topics.length}</b><span>topic pages</span></div>
        </div>
        <p class="small muted" style="margin-bottom:0">Weighted by importance. Goal: ${esc(D.goal)}</p>
      </div>
      <div class="grid two">
        <div class="card next"><p class="label">Next topics</p><ol>
          ${nextTopics().map((x, i) => `<li><span class="rank">${i + 1}</span><div>
            ${link(x.t) ? `<a href="${link(x.t)}"><b>${x.t.id}</b> ${esc(x.t.title)}</a>` : `<b>${x.t.id}</b> ${esc(x.t.title)}`}
            <div class="why">${stars(x.t.importance)} · ${x.f.ready ? `${pct(x.f.p)} % done` : `say “Prepare topic ${x.t.id}”`}</div>
          </div></li>`).join("")}
        </ol></div>
        <div class="card next"><p class="label">Next key points</p>
          ${(() => { const l = nextKeypoints(); return l.length ? `<ol>${l.map((x, i) => `<li><span class="rank">${i + 1}</span><div>
            <a href="${link(x.t)}#kp-${x.k.id}"><b>${x.k.id}</b> ${esc(x.k.title)}</a>
            <div class="why">${badge(x.k.status)} · weight ${x.k.weight}</div></div></li>`).join("")}</ol>`
            : '<p class="empty">No key points yet.</p>'; })()}
        </div>
      </div>`;

    $("#topics").innerHTML = D.groups.map((g) => {
      const ts = D.topics.filter((t) => t.id.split(".")[0] === g.id);
      return `<section class="komplex" id="g${g.id}">
        <div class="komplex-head"><h2><span class="num">${g.id}</span>${esc(g.title)}</h2><span class="pct">${pct(aggregate(ts))} %</span></div>
        ${g.source ? `<p class="small muted" style="margin:-.3rem 0 .7rem">Source: <a href="${esc(g.source)}">${esc(g.source)}</a></p>` : ""}
        <div class="topics">${ts.map(topicRow).join("")}</div></section>`;
    }).join("");

    const log = [...D.log].reverse().slice(0, 8);
    $("#log").innerHTML = log.length ? `<div class="log">${log.map((e) => logEntry(e, true)).join("")}</div>`
      : '<p class="empty">No checks yet. Open a topic, read it, then tell your agent: “Check me on 2.1”.</p>';
  }

  // ---------- Topic page ----------
  function renderTopic(id) {
    const t = topic(id);
    if (!t) return;
    const f = progress(t);
    const st = $("#tp-status");
    if (st) st.innerHTML = `<p class="label">Progress ${t.id}</p>
      <div class="hero-figure" style="font-size:2.4rem">${pct(f.p)}<small>%</small></div>
      <div style="margin:.8rem 0">${meter(f, "lg")}</div>
      <div class="small muted">${stars(t.importance)} · ${t.keypoints.filter((k) => k.status === "mastered").length}/${t.keypoints.length} key points mastered</div>`;

    const q = $("#tp-questions");
    if (q) q.innerHTML = t.questions.length ? `<ul>${t.questions.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : '<p class="empty">No questions yet.</p>';

    const kp = $("#tp-keypoints");
    if (kp) kp.innerHTML = t.keypoints.map((k) => `
      <details class="kp" id="kp-${k.id}">
        <summary><span class="kid">${k.id}</span><span>${esc(k.title)} <span class="stars">· weight ${k.weight}</span></span>${badge(k.status)}</summary>
        <div class="body">
          <p><b>A complete answer covers:</b> <span class="reveal">${esc(k.target)}</span></p>
          ${k.note ? `<p class="notiz"><b>Feedback:</b> ${esc(k.note)}</p>` : ""}
          <p class="small muted">${k.checked ? `Last checked: ${esc(k.checked)}` : "Not checked yet"}</p>
        </div>
      </details>`).join("");

    const lg = $("#tp-log");
    if (lg) {
      const log = D.log.filter((e) => e.topic === id).reverse();
      lg.innerHTML = log.length ? `<div class="log">${log.map((e) => logEntry(e, false)).join("")}</div>`
        : '<p class="empty">No checks for this topic yet.</p>';
    }

    const open = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      const d = h && document.getElementById(h);
      document.querySelectorAll(".kp.target").forEach((x) => x.classList.remove("target"));
      if (d && d.classList.contains("kp")) { d.open = true; d.classList.add("target"); d.scrollIntoView({ block: "center" }); }
    };
    addEventListener("hashchange", open); open();
  }

  window.ETL = { D, progress, topic, badge, esc,
    keypoint: (id) => D.topics.flatMap((t) => t.keypoints || []).find((k) => k.id === id) };

  if (document.body.dataset.page === "index") renderIndex();
  if (document.body.dataset.topic) renderTopic(document.body.dataset.topic);
})();
