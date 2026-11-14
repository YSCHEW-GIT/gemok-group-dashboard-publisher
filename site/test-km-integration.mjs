import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("site/canonical-index.html", "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

assert.ok(scripts.length, "dashboard inline script is missing");
for (const script of scripts) new Function(script);

assert.match(html, /KM:\s*\{ company: 'Bagus Tayar', sales: Array\(10\)\.fill\(null\)/);
assert.match(html, /const colors = \['var\(--si\)', 'var\(--sr\)', 'var\(--st\)', 'var\(--sk\)', 'var\(--km\)'\]/);
assert.match(html, /targetMonth\.value = currentBusinessMonth\(\)/);
assert.doesNotMatch(html, /id="target-month"[^>]*value="2026-10"/);
assert.doesNotMatch(html, /join\(''\) \+ `<article class="store-tile"[^`]*<span class="store-code">KM<\/span>/);
assert.match(html, /const available = sales !== null && sales !== undefined && documents !== null && documents !== undefined/);
assert.doesNotMatch(html, /KM is waiting for its connection source|KMは接続先待ち/);

console.log("KM dashboard integration and current target-month initialization validated");
