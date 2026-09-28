// Consistency check for site/data/progress.js. Run: node site/tools/check.js
const fs = require("fs");
const path = require("path");
const base = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(base, "data/progress.js"), "utf8");
const m = src.match(/^window\.PROGRESS\s*=/m);
let D;
try { D = JSON.parse(m ? src.slice(m.index + m[0].length).trim().replace(/;\s*$/, "") : ""); }
catch (e) { console.error("✕ Not valid JSON after 'window.PROGRESS =':", e.message); process.exit(1); }

const errors = [];
const STATUS = ["open", "wrong", "partial", "mastered"];
const ids = new Set();
for (const t of D.topics) {
  if (ids.has(t.id)) errors.push(`topic ${t.id} duplicated`);
  ids.add(t.id);
  if (!D.groups.some((g) => t.id.split(".")[0] === g.id)) errors.push(`${t.id}: no matching group`);
  if (![0, 1, 2, 3].includes(t.importance)) errors.push(`${t.id}: importance must be 0–3`);
  if (t.page && !fs.existsSync(path.join(base, t.page))) errors.push(`${t.id}: page ${t.page} missing`);
  for (const k of t.keypoints) {
    if (ids.has(k.id)) errors.push(`key point ${k.id} duplicated`);
    ids.add(k.id);
    if (!k.id.startsWith(t.id + ".")) errors.push(`${k.id} does not belong to topic ${t.id}`);
    if (!STATUS.includes(k.status)) errors.push(`${k.id}: unknown status '${k.status}'`);
    if (![1, 2, 3].includes(k.weight)) errors.push(`${k.id}: weight must be 1–3`);
    if (!k.target) errors.push(`${k.id}: 'target' missing`);
  }
}
for (const e of D.log) {
  if (!ids.has(e.topic)) errors.push(`log ${e.date}: unknown topic ${e.topic}`);
  for (const r of e.results || []) {
    if (!ids.has(r.kp)) errors.push(`log ${e.date}: unknown key point ${r.kp}`);
    if (!STATUS.includes(r.to)) errors.push(`log ${e.date}: unknown status '${r.to}'`);
  }
}
if (errors.length) { errors.forEach((f) => console.error("✕ " + f)); process.exit(1); }

const value = { open: 0, wrong: 0, partial: 0.5, mastered: 1 };
for (const t of D.topics.filter((t) => t.keypoints.length)) {
  const s = t.keypoints.reduce((a, k) => a + k.weight, 0);
  const p = t.keypoints.reduce((a, k) => a + k.weight * value[k.status], 0) / s;
  console.log(`  ${t.id} ${t.title}: ${Math.round(p * 100)} %`);
}
console.log(`✓ progress.js ok (${D.topics.length} topics, ${D.log.length} log entries)`);
