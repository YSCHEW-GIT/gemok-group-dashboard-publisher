import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync("site/canonical-index.html", "utf8");
for (const [index, match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries()) {
  assert.doesNotThrow(() => new Function(match[1]), `Inline script ${index + 1} must parse`);
}
assert.match(html, /\.\/sales-breakdown\/v1\//, "GitHub Pages must load the published sales breakdown JSON");
assert.doesNotMatch(html, /if \(githubPagesMode\) \{\s*body = `<div class="store-focus-state"/, "GitHub Pages must not redirect store focus to the private Site");

const directory = "dist/sales-breakdown/v1";
const files = fs.readdirSync(directory).filter((file) => /^\d{4}-\d{2}\.json$/.test(file)).sort();
assert.ok(files.length, "At least one published sales breakdown month is required");
const payload = JSON.parse(fs.readFileSync(path.join(directory, files.at(-1)), "utf8"));
assert.equal(payload.schemaVersion, 1);
assert.match(payload.month, /^\d{4}-\d{2}$/);
assert.ok(Object.keys(payload.stores || {}).length, "Published sales breakdown must contain stores");
for (const [store, storeData] of Object.entries(payload.stores)) {
  assert.match(store, /^(SI|SR|ST|SK|KM)$/);
  const days = Object.values(storeData.days || {});
  assert.ok(days.length, `${store} must contain daily sales breakdown data`);
  for (const day of days) assert.deepEqual((day.categories || []).map((row) => row.key), ["passenger_tire", "sport_rim", "foreman_item", "other"]);
}
console.log(`Direct GitHub sales breakdown validated: ${files.at(-1)}`);
