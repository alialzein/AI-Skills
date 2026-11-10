#!/usr/bin/env node
// modern-design - contrast on glass.
// Glass makes the colour behind text vary across one card. This composites a translucent surface over each
// ground colour (and over each glow on that ground) and reports the WORST contrast for every ink.
//
// Run:  node scripts/contrast.mjs path/to/spec.json
// Spec: {
//   "themes": {
//     "light": {
//       "bg": "#f3f4fb",
//       "glows": ["rgba(124,140,255,0.30)", "rgba(64,200,180,0.24)"],     // optional; each is tried over bg, and all together
//       "surfaces": { "card": "rgba(255,255,255,0.66)", "bar": "rgba(255,255,255,0.80)" },
//       "inks": { "ink": "#12163a", "ink-2": "#3f4670", "ink-3": "#5d6490" },
//       "min": 4.5                                                         // optional, default 4.5
//     }
//   }
// }
// It prints one line per surface x ink with the worst ratio and exits 1 if any is under `min`.
// Limits (say them in a review): it does not model `saturate()`, blur mixing neighbouring colours, or content
// scrolling behind a surface - treat a pass under ~5:1 as "check by eye on the real page".

import { readFileSync } from "node:fs";

function parse(c) {
  c = c.trim();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join("");
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const m = c.match(/rgba?\(([^)]+)\)/i);
  if (!m) throw new Error("Unsupported colour: " + c + " (use #hex or rgb()/rgba())");
  const p = m[1].split(/[\s,\/]+/).filter(Boolean).map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v)));
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
}
const over = (top, under) => {
  const a = top[3];
  return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1);
};
const lum = (c) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/contrast.mjs spec.json   (see the header of this file for the spec)");
  process.exit(2);
}
const spec = JSON.parse(readFileSync(file, "utf8"));
let failed = 0;
for (const [themeName, t] of Object.entries(spec.themes)) {
  const min = t.min ?? 4.5;
  const bg = parse(t.bg);
  const glows = (t.glows ?? []).map(parse);
  // grounds: plain bg, bg under each glow, bg under all glows stacked
  const grounds = [["bg", bg], ...glows.map((g, i) => ["glow " + (i + 1), over(g, bg)])];
  if (glows.length > 1) grounds.push(["all glows", glows.reduce((acc, g) => over(g, acc), bg)]);
  console.log(`\n${themeName}  (min ${min}:1)`);
  for (const [sName, sCol] of Object.entries(t.surfaces)) {
    for (const [iName, iCol] of Object.entries(t.inks)) {
      let worst = Infinity, where = "";
      for (const [gName, g] of grounds) {
        const behind = over(parse(sCol), g);
        const r = ratio(over(parse(iCol), behind), behind);
        if (r < worst) { worst = r; where = gName; }
      }
      const ok = worst >= min;
      if (!ok) failed++;
      console.log(`  ${ok ? "pass" : "FAIL"}  ${iName.padEnd(10)} on ${sName.padEnd(8)} ${worst.toFixed(2)}:1  (worst over ${where})`);
    }
  }
}
process.exit(failed ? 1 : 0);
