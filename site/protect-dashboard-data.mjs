import fs from "node:fs/promises";

const dashboardPath = new URL("../dist/dashboard-data.json", import.meta.url);
const recoveryPath = new URL("./data-recovery.json", import.meta.url);
const publishedUrl = "https://yschew-git.github.io/gemok-group-dashboard-publisher/dashboard-data.json";

function malaysiaDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function valueAt(snapshot, store, date, field) {
  if (!snapshot?.month || !date.startsWith(`${snapshot.month}-`)) return undefined;
  const index = Number(date.slice(-2)) - 1;
  return snapshot.stores?.[store]?.[field]?.[index];
}

function setValue(snapshot, store, date, field, value) {
  if (!snapshot?.month || !date.startsWith(`${snapshot.month}-`)) return false;
  const index = Number(date.slice(-2)) - 1;
  const values = snapshot.stores?.[store]?.[field];
  if (!Array.isArray(values) || index < 0 || index >= values.length) return false;
  values[index] = value;
  return true;
}

function applyCorrection(snapshot, correction) {
  const salesSet = setValue(snapshot, correction.store, correction.date, "sales", correction.sales);
  const documentsSet = setValue(snapshot, correction.store, correction.date, "documents", correction.documents);
  if (!salesSet || !documentsSet) {
    throw new Error(`Recovery target is missing: ${correction.store} ${correction.date}`);
  }
  console.warn(`Applied verified recovery: ${correction.store} ${correction.date} = RM ${correction.sales} / ${correction.documents} documents`);
}

function protectHistoricalRegressions(incoming, published, today) {
  if (!published || incoming.month !== published.month) return 0;
  let protectedCount = 0;
  for (const store of Object.keys(incoming.stores || {})) {
    const dayCount = incoming.stores?.[store]?.sales?.length || 0;
    for (let day = 1; day <= dayCount; day += 1) {
      const date = `${incoming.month}-${String(day).padStart(2, "0")}`;
      if (date >= today) continue;
      const incomingSales = Number(valueAt(incoming, store, date, "sales"));
      const incomingDocuments = Number(valueAt(incoming, store, date, "documents"));
      const publishedSales = Number(valueAt(published, store, date, "sales"));
      const publishedDocuments = Number(valueAt(published, store, date, "documents"));
      const incomingIsZero = incomingSales === 0 && incomingDocuments === 0;
      const publishedHasData = publishedSales !== 0 || publishedDocuments !== 0;
      if (!incomingIsZero || !publishedHasData) continue;
      setValue(incoming, store, date, "sales", publishedSales);
      setValue(incoming, store, date, "documents", publishedDocuments);
      protectedCount += 1;
      console.warn(`Protected historical value: ${store} ${date} = RM ${publishedSales} / ${publishedDocuments} documents`);
    }
  }
  return protectedCount;
}

async function loadPublishedSnapshot() {
  try {
    const response = await fetch(`${publishedUrl}?guard=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`Published snapshot unavailable; verified corrections will still be applied: ${error.message}`);
    return null;
  }
}

const incoming = JSON.parse(await fs.readFile(dashboardPath, "utf8"));
const recovery = JSON.parse(await fs.readFile(recoveryPath, "utf8"));
const published = await loadPublishedSnapshot();

protectHistoricalRegressions(incoming, published, malaysiaDate());
for (const correction of recovery.corrections || []) applyCorrection(incoming, correction);

await fs.writeFile(dashboardPath, `${JSON.stringify(incoming, null, 2)}\n`, "utf8");
