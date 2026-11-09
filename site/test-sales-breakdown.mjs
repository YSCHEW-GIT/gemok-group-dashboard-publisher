import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync("site/canonical-index.html", "utf8");
for (const [index, match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries()) {
  assert.doesNotThrow(() => new Function(match[1]), `Inline script ${index + 1} must parse`);
}
assert.match(html, /\.\/sales-breakdown\/v1\//, "GitHub Pages must load the published sales breakdown JSON");
assert.doesNotMatch(html, /if \(githubPagesMode\) \{\s*body = `<div class="store-focus-state"/, "GitHub Pages must not redirect store focus to the private Site");
assert.match(html, /title:'売上詳細＆粗利'/, "Japanese store focus title must use the requested wording");
assert.match(html, /foreman_item:'Foreman Item'/, "Japanese Foreman Item label must include a space");
for (const title of ['Sales details & gross profit','Butiran jualan & untung kasar','売上詳細＆粗利','销售明细与毛利']) assert.ok(html.includes(title), `Store focus translation is required: ${title}`);
assert.match(html, /if \(activeKey === 'storeFocus'\) renderStoreFocus\(\)/, "Language switching must re-render store focus");
assert.match(html, /latestSuccessfulAt \? `\$\{copy\.updated\}/, "Store focus must display the sales dashboard update timestamp");
assert.match(html, /store-focus-donut-label/, "Donut chart must display outside percentage labels");
assert.match(html, /const midAngle = \(start \+ position\) \/ 2 - 90/, "Each percentage label must use the center angle of its category segment");
assert.match(html, /Math\.cos\(angle\) \* 44/, "Percentage labels must follow the radial center line of each segment");
assert.match(html, /<small>\$\{copy\.salesRM\}<\/small><strong>\$\{focusAmount\(data\.totals\.sales\)\}/, "Donut center must show RM in the label and omit it from the amount");
assert.match(html, /store-focus-category-margin/, "Category cards must display gross margin");
assert.match(html, /id="store-focus-item-search"/, "Item details must provide keyword search");
for (const key of ['itemName','quantity','sales','grossProfit','margin']) assert.ok(html.includes(`storeFocusSortHeader('${key}'`), `Item details must be sortable by ${key}`);
assert.match(html, /store-focus-item-negative/, "Negative gross profit or margin rows must be highlighted");
assert.match(html, /store-focus-table-wrap/, "Item table must have a responsive scroll container");

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
