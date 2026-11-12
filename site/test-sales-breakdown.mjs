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
assert.match(html, /store-focus-donut-label/, "Donut chart must display percentage labels");
assert.match(html, /\.store-focus-donut-label \{[^}]*background:transparent;/, "Donut percentage labels must have a transparent background");
assert.match(html, /const percentage = total \? Math\.round\(ratio \* 100\) : 0;/, "Donut percentage labels must calculate a zero value when sales are zero");
assert.match(html, /if \(percentage > 0\) donutLabels\.push/, "Zero-percent donut labels must not be rendered");
assert.match(html, /const midAngle = \(start \+ position\) \/ 2 \* 3\.6 - 90/, "Each percentage label must convert its category midpoint from percent to degrees");
assert.match(html, /Math\.cos\(angle\) \* 36/, "Percentage labels must sit inside the enlarged donut on each segment's radial center line");
assert.match(html, /<small>\$\{copy\.salesRM\}<\/small><strong>\$\{focusAmount\(data\.totals\.sales\)\}/, "Donut center must show RM in the label and omit it from the amount");
assert.match(html, /store-focus-category-margin/, "Category cards must display gross margin");
assert.match(html, /id="store-focus-item-search"/, "Item details must provide keyword search");
for (const key of ['itemName','quantity','sales','grossProfit','margin']) assert.ok(html.includes(`storeFocusSortHeader('${key}'`), `Item details must be sortable by ${key}`);
assert.match(html, /store-focus-item-negative/, "Negative gross profit or margin rows must be highlighted");
assert.match(html, /store-focus-table-wrap/, "Item table must have a responsive scroll container");
assert.match(html, /function storeFocusPeriodLabel\(period\)/, "Store focus periods must include date labels");
assert.match(html, /`\$\{format\(start\)\}〜本日まで`/, "Current Japanese month range must run from month start through today");
assert.match(html, /storeFocusPeriodLabel\(period\)/, "Period buttons must render their corresponding dates");
assert.match(html, /Number\(row\.grossMarginRate\) < 0 \? 'store-focus-negative'/, "Negative category gross margins must be red");
assert.match(html, /Number\(data\.totals\.grossMarginRate\) < 0 \? 'store-focus-negative'/, "Negative total gross margin must be red");
assert.match(html, /\.store-focus-search \{[^}]*grid-template-columns:max-content minmax\(0,1fr\)/, "Product keyword label and input must be side by side");

assert.match(html, /minimumFractionDigits:2, maximumFractionDigits:2 \}\)\}M/, "Inventory million totals must use two decimal places");
assert.match(html, /minimumFractionDigits:2, maximumFractionDigits:2 \}\)\}K/, "Inventory thousand totals must use two decimal places");
assert.match(html, /return inventoryGroups\[key\]\?\.name \|\| key;/, "Inventory breakdown names must use the WEBMAX product group name");
assert.match(html, /filter\(\(group\) => group\.value !== 0\)\.sort\(\(a,b\) => b\.value - a\.value\)/, "Inventory breakdown must sort groups by descending value");
assert.match(html, /positiveGroups\.slice\(0,8\)/, "Inventory donut must display the eight highest-value groups");
assert.match(html, /positiveGroups\.slice\(8\)/, "Inventory donut must aggregate groups after the top eight into Other");
assert.match(html, /inventoryValueGroupColor\(group\.key\)/, "Inventory breakdown colors must be fixed by product group key");
assert.match(html, /const inventoryValueOtherColor = '#94a3b8';/, "Aggregated Other must retain a dedicated color");

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
