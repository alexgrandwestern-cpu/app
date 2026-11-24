// Filtros, estadísticas y búsquedas sobre la lista de prospectos.
const strip = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filterProspects(list, f = {}) {
  const q = f.q ? strip(f.q) : "";
  const minScore = Number(f.minScore || 0);
  const includeExcluded = f.includeExcluded === true || f.includeExcluded === "true" || f.includeExcluded === "1";
  const arr = (v) => (Array.isArray(v) ? v : v ? String(v).split(",") : []).filter(Boolean);
  const segments = arr(f.segment), tiers = arr(f.tier), areas = arr(f.area).map(strip), cuisines = arr(f.cuisine), zips = arr(f.zip), wards = arr(f.ward);
  let out = list.filter((p) => {
    if (!includeExcluded && (p.chain || p.segment === "Institucional")) return false;
    if (p.score < minScore) return false;
    if (segments.length && !segments.includes(p.segment)) return false;
    if (tiers.length && !tiers.includes(p.tier)) return false;
    if (areas.length && !areas.includes(strip(p.area))) return false;
    if (cuisines.length && !cuisines.includes(p.cuisine)) return false;
    if (zips.length && !zips.includes(p.zip)) return false;
    if (wards.length && !wards.includes(String(p.ward))) return false;
    if (f.newOnly === true || f.newOnly === "true") { if (!p.reasons.some((r) => r.startsWith("Negocio nuevo"))) return false; }
    if (f.patio === true || f.patio === "true") { if (!p.licenses.includes("Outdoor Patio")) return false; }
    if (q && !strip(`${p.name} ${p.legal} ${p.address} ${p.area} ${p.zip} ${p.cuisine}`).includes(q)) return false;
    return true;
  });
  const sort = f.sort || "score";
  if (sort === "name") out = out.slice().sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "area") out = out.slice().sort((a, b) => a.area.localeCompare(b.area) || b.score - a.score);
  else if (sort === "new") out = out.slice().sort((a, b) => (b.since || "").localeCompare(a.since || ""));
  return out;
}

export function countBy(list, key, limit = 100) {
  const m = new Map();
  for (const p of list) {
    const k = p[key] || "—";
    const e = m.get(k) || { name: k, count: 0, a: 0, scoreSum: 0 };
    e.count++; e.scoreSum += p.score; if (p.tier === "A") e.a++;
    m.set(k, e);
  }
  return [...m.values()]
    .map((e) => ({ name: e.name, count: e.count, tierA: e.a, avgScore: Math.round(e.scoreSum / e.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function stats(ds, filters = {}) {
  const list = filterProspects(ds.prospects, filters);
  return {
    summary: ds.summary,
    updatedAt: ds.updatedAt,
    filtered: list.length,
    tiers: { A: list.filter((p) => p.tier === "A").length, B: list.filter((p) => p.tier === "B").length, C: list.filter((p) => p.tier === "C").length },
    bySegment: countBy(list, "segment"),
    byCuisine: countBy(list, "cuisine"),
    byArea: countBy(list, "area", 80),
    byZip: countBy(list, "zip", 60),
    byWard: countBy(list, "ward", 50),
    excluded: {
      chains: ds.prospects.filter((p) => p.chain).length,
      institutional: ds.prospects.filter((p) => p.segment === "Institucional").length,
    },
  };
}

export function facets(ds) {
  const uniq = (k) => [...new Set(ds.prospects.map((p) => p[k]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "es", { numeric: true }));
  return { segments: uniq("segment"), cuisines: uniq("cuisine"), areas: uniq("area"), zips: uniq("zip"), wards: uniq("ward") };
}

export function toCSV(list) {
  const cols = ["score", "tier", "name", "legal", "address", "zip", "area", "ward", "segment", "cuisine", "recommended", "facility", "lastInspection", "lastResult", "since", "licenseNumber", "reasons"];
  const esc = (v) => `"${String(Array.isArray(v) ? v.join("; ") : v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...list.map((p) => cols.map((c) => esc(p[c])).join(","))].join("\n");
}
