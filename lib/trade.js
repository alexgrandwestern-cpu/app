// Inteligencia comercial: distribuidores de Illinois (TTB), radar de productos nuevos (TTB COLA)
// y mapa de conexiones producto → proveedor → distribuidor → cuentas con licencia en Chicago.
import crypto from "node:crypto";
import express from "express";
import * as db from "./db.js";

const TTB_FILES = "https://www.ttb.gov/system/files/2025-04/";
const COLA_BASE = "https://www.ttbonline.gov/colasonline/";
const UA = { "User-Agent": "Mozilla/5.0 (compatible; LicenciaPro/1.0)" };
const COLA_KEEP_DAYS = 60;

const st = {
  wholesalers: [], importers: new Map(), cola: [], permitsAt: null, colaAt: null,
  status: "iniciando", message: "", syncing: false,
};
export const tradeStatus = () => ({ status: st.status, message: st.message, permitsAt: st.permitsAt, colaAt: st.colaAt, wholesalers: st.wholesalers.length, products: st.cola.length });

// ---------- CSV ----------
function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}
const title = (s = "") => s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bLlc\b/g, "LLC").replace(/\bInc\b/g, "Inc.").replace(/'S\b/g, "'s");
const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Permisos TTB ----------
async function loadPermits() {
  const get = async (f) => { const r = await fetch(TTB_FILES + f, { headers: UA }); if (!r.ok) throw new Error(`TTB ${f}: HTTP ${r.status}`); return parseCSV(await r.text()); };
  const [whole, imp] = await Promise.all([get("FRL_Alcohol_Wholesaler_Permit_List.csv"), get("FRL_Alcohol_Importer_Permit_List.csv")]);
  st.importers = new Map(imp.map((r) => [r.Permit_Number, { owner: title(r.Owner_Name), operating: title(r.Operating_Name), city: title(r.City), state: r.State }]));
  st.wholesalers = whole.filter((r) => r.State === "IL").map((r) => ({
    permit: r.Permit_Number, owner: title(r.Owner_Name), operating: title(r.Operating_Name), company: title(r.Operating_Name || r.Owner_Name),
    street: title(r.Street), city: title(r.City), zip: String(r.Prem_Zip || "").slice(0, 5), county: title(r.Prem_County), isNew: r.New_Permit_Flag === "1",
    lat: null, lon: null,
  }));
  st.permitsAt = new Date().toISOString();
  await geocodeWholesalers();
}

async function geocodeWholesalers() {
  const cache = new Map((await db.list("geo")).map((g) => [g.id, g]));
  const missing = [];
  for (const w of st.wholesalers) {
    const c = cache.get(w.permit);
    if (c) { w.lat = c.lat; w.lon = c.lon; } else if (w.street) missing.push(w);
  }
  for (let i = 0; i < missing.length; i += 1000) {
    const chunk = missing.slice(i, i + 1000);
    const csv = chunk.map((w, j) => [j, w.street, w.city, "IL", w.zip].map((v) => `"${String(v).replace(/"/g, "")}"`).join(",")).join("\n");
    const fd = new FormData();
    fd.append("addressFile", new Blob([csv], { type: "text/csv" }), "a.csv");
    fd.append("benchmark", "Public_AR_Current");
    try {
      const r = await fetch("https://geocoding.geo.census.gov/geocoder/locations/addressbatch", { method: "POST", body: fd, signal: AbortSignal.timeout(180000) });
      const out = parseCSV("id,input,match,exact,addr,coords,tiger,side\n" + (await r.text()));
      for (const row of out) {
        const w = chunk[Number(row.id)];
        if (!w) continue;
        const [lon, lat] = (row.coords || "").split(",").map(Number);
        const g = { id: w.permit, lat: isFinite(lat) && lat ? +lat.toFixed(5) : null, lon: isFinite(lon) && lon ? +lon.toFixed(5) : null };
        w.lat = g.lat; w.lon = g.lon;
        await db.put("geo", g);
      }
    } catch (e) { console.error("Geocoder:", e.message); }
  }
}

// ---------- COLA (etiquetas aprobadas) ----------
const GROUPS = [
  ["Tequila / Mezcal", /TEQUILA|MEZCAL|AGAVE/], ["Whisky / Bourbon", /WHISK|BOURBON|SCOTCH|\bRYE\b/], ["Vodka", /VODKA/], ["Gin", /\bGIN\b/],
  ["Ron", /\bRUM\b/], ["Coñac / Brandy", /BRANDY|COGNAC|ARMAGNAC|GRAPPA|PISCO/], ["Sake", /SAKE/], ["Espumoso", /SPARKLING|CHAMPAGNE|CARBONATED/],
  ["Sidra", /CIDER|PERRY/], ["Cerveza", /MALT|BEER|\bALE\b|LAGER|STOUT|PORTER/], ["Cóctel / RTD", /COCKTAIL|HIGHBALL|SELTZER|MIXED/],
  ["Licor", /LIQUEUR|CORDIAL|SCHNAPPS|CREME|SPECIALT|AMARETTO|TRIPLE SEC|ABSINTHE|BITTER/], ["Vino", /WINE|MEAD|VERMOUTH|SHERRY|PORT\b/],
];
const groupOf = (desc = "") => (GROUPS.find(([, re]) => re.test(desc.toUpperCase())) || ["Otro"])[0];
const fmtDate = (d) => `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;

const fetchColaDay = (day) => colaQuery({ from: day, to: day });
async function colaQuery({ from, to, name = "" }) {
  const jar = new Map();
  const keep = (res) => { for (const c of res.headers.getSetCookie?.() || []) { const [kv] = c.split(";"); const [k, ...v] = kv.split("="); jar.set(k.trim(), v.join("=")); } };
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  let r = await fetch(COLA_BASE + "publicSearchColasAdvanced.do", { headers: UA }); keep(r); await r.text();
  const body = new URLSearchParams({ "searchCriteria.dateCompletedFrom": fmtDate(from), "searchCriteria.dateCompletedTo": fmtDate(to), "searchCriteria.productOrFancifulName": name, "searchCriteria.productNameSearchType": "E", "searchCriteria.classTypeDesired": "desc" });
  r = await fetch(COLA_BASE + "publicSearchColasAdvancedProcess.do?action=search", { method: "POST", headers: { ...UA, Cookie: cookie(), "Content-Type": "application/x-www-form-urlencoded" }, body }); keep(r); await r.text();
  r = await fetch(COLA_BASE + "publicSaveSearchResultsToFile.do?path=/publicSearchColasAdvancedProcess", { headers: { ...UA, Cookie: cookie() } });
  if (!r.ok) throw new Error(`COLA HTTP ${r.status}`);
  return parseCSV(await r.text()).map((x) => {
    const [mm, dd, yy] = (x["Completed Date"] || "").split("/");
    const permit = x["Permit No."] || "";
    const imp = st.importers.get(permit);
    return {
      id: (x["TTB ID"] || "").replace(/'/g, ""), permit, date: yy ? `${yy}-${mm}-${dd}` : "", fanciful: title(x["Fanciful Name"]), brand: title(x["Brand Name"]),
      origin: title(x["Origin Desc"]), classDesc: title(x["Class/Type Desc"]), group: groupOf(x["Class/Type Desc"]),
      imported: /^[A-Z]{2}-I-/.test(permit), supplier: imp ? imp.operating || imp.owner : "", supplierCity: imp ? `${imp.city}, ${imp.state}` : "",
    };
  }).filter((x) => x.id);
}

async function syncCola({ days } = {}) {
  const meta = (await db.get("meta", "cola")) || { id: "cola", lastDay: null };
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const start = new Date(today);
  if (days) start.setDate(start.getDate() - days);
  else if (meta.lastDay && st.cola.length >= 1000) { const l = new Date(meta.lastDay + "T12:00:00"); l.setDate(l.getDate() - 2); start.setTime(Math.max(l.getTime(), today.getTime() - 30 * 864e5)); }
  else start.setDate(start.getDate() - 21);
  const byId = new Map(st.cola.map((c) => [c.id, c]));
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    st.message = `Etiquetas TTB del ${d.toISOString().slice(0, 10)}…`;
    try {
      const items = await fetchColaDay(new Date(d));
      for (const it of items) { if (!byId.has(it.id)) await db.put("cola", it); byId.set(it.id, it); }
    } catch (e) { console.error("COLA", d.toISOString().slice(0, 10), e.message, e.cause?.code || e.cause?.message || ""); }
    await sleep(1500);
  }
  const cutoff = new Date(Date.now() - COLA_KEEP_DAYS * 864e5).toISOString().slice(0, 10);
  st.cola = [...byId.values()].filter((c) => c.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date) || a.brand.localeCompare(b.brand));
  meta.lastDay = today.toISOString().slice(0, 10);
  await db.put("meta", meta);
  st.colaAt = new Date().toISOString();
}

export async function syncTrade() {
  if (st.syncing) return;
  st.syncing = true; st.status = "sincronizando";
  try {
    await db.initDb();
    if (!st.cola.length) {
      const cutoff = new Date(Date.now() - COLA_KEEP_DAYS * 864e5).toISOString().slice(0, 10);
      st.cola = (await db.list("cola")).filter((c) => c.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date));
    }
    st.message = "Descargando permisos de la TTB…";
    await loadPermits();
    await syncCola();
    st.status = "listo"; st.message = "";
  } catch (e) {
    console.error("Trade sync:", e); st.status = st.wholesalers.length ? "listo" : "error"; st.message = String(e.message || e);
  } finally { st.syncing = false; }
}

// ---------- Conexiones ----------
const FIT = {
  "Tequila / Mezcal": { cuisines: ["Mexicana", "Latinoamericana"], types: ["Bar / Tavern", "Tienda (Package Goods)"] },
  "Vino": { cuisines: ["Italiana / Pizza", "Europea / Bistro", "Steak / Grill / BBQ", "Mediterránea / Medio Oriente"], types: ["Tienda (Package Goods)"] },
  "Espumoso": { cuisines: ["Italiana / Pizza", "Europea / Bistro", "Steak / Grill / BBQ"], types: ["Tienda (Package Goods)", "Bar / Tavern"] },
  "Whisky / Bourbon": { cuisines: ["Steak / Grill / BBQ", "Americana / Comfort", "Europea / Bistro"], types: ["Bar / Tavern", "Tienda (Package Goods)"] },
  "Sake": { cuisines: ["Asiática"], types: ["Tienda (Package Goods)"] },
  "Ron": { cuisines: ["Latinoamericana", "Mexicana"], types: ["Bar / Tavern"] },
  "Cerveza": { cuisines: ["Mexicana", "Americana / Comfort", "Steak / Grill / BBQ", "Asiática", "Latinoamericana"], types: ["Bar / Tavern", "Tienda (Package Goods)"] },
};
function suggestAccounts(ds, group, limit = 30) {
  const fit = FIT[group] || { cuisines: [], types: ["Bar / Tavern", "Tienda (Package Goods)"] };
  const scored = (ds?.licensed || []).map((a) => ({ a, s: (fit.cuisines.includes(a.cuisine) ? 2 : 0) + (fit.types.includes(a.type) ? 1 : 0) })).filter((x) => x.s > 0);
  scored.sort((x, y) => y.s - x.s || x.a.name.localeCompare(y.a.name));
  return { total: scored.length, fit, items: scored.slice(0, limit).map((x) => x.a) };
}
async function directoryMatch(brand) {
  const n = norm(brand);
  if (!n) return null;
  return (await db.list("distributors")).find((e) => e.brandNorm === n || norm(e.brand) === n) || null;
}

export function tradeRouter(requireAuth, getDs) {
  const r = express.Router();
  r.use(requireAuth);
  const wrap = (fn) => (req, res) => fn(req, res).catch((e) => { console.error(e); res.status(500).json({ error: "Error interno" }); });

  r.get("/status", (req, res) => res.json(tradeStatus()));
  r.post("/sync", (req, res) => { syncTrade(); res.json(tradeStatus()); });

  r.get("/distributors", wrap(async (req, res) => {
    const q = norm(String(req.query.q || ""));
    const dir = await db.list("distributors");
    const groups = new Map();
    for (const w of st.wholesalers) {
      const key = norm(w.company);
      const g = groups.get(key) || { company: w.company, owner: w.owner, sites: [], brands: [] };
      g.sites.push({ permit: w.permit, street: w.street, city: w.city, zip: w.zip, county: w.county, lat: w.lat, lon: w.lon, isNew: w.isNew });
      groups.set(key, g);
    }
    for (const g of groups.values()) {
      const n = norm(g.company), o = norm(g.owner);
      g.brands = dir.filter((e) => e.distributors.some((d) => { const dn = norm(d.name); return dn && (n.includes(dn) || dn.includes(n) || o.includes(dn)); })).map((e) => ({ brand: e.brand, status: e.status }));
    }
    let list = [...groups.values()];
    if (q) list = list.filter((g) => norm(`${g.company} ${g.owner} ${g.sites.map((s) => s.city).join(" ")} ${g.brands.map((b) => b.brand).join(" ")}`).includes(q));
    list.sort((a, b) => b.brands.length - a.brands.length || b.sites.length - a.sites.length || a.company.localeCompare(b.company));
    res.json({ total: list.length, permitsAt: st.permitsAt, items: list });
  }));

  r.get("/products", (req, res) => {
    const q = norm(String(req.query.q || "")), group = String(req.query.group || ""), days = Number(req.query.days || 30);
    const cutoff = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
    let list = st.cola.filter((c) => c.date >= cutoff);
    if (group) list = list.filter((c) => c.group === group);
    if (req.query.imported === "true") list = list.filter((c) => c.imported);
    if (q) list = list.filter((c) => norm(`${c.brand} ${c.fanciful} ${c.supplier} ${c.origin} ${c.classDesc}`).includes(q));
    const counts = {};
    for (const c of st.cola.filter((c) => c.date >= cutoff)) counts[c.group] = (counts[c.group] || 0) + 1;
    const page = Math.max(1, Number(req.query.page) || 1), limit = 50;
    res.json({ total: list.length, counts, colaAt: st.colaAt, page, items: list.slice((page - 1) * limit, page * limit) });
  });

  r.get("/product/:id", wrap(async (req, res) => {
    const p = st.cola.find((c) => c.id === req.params.id) || [...cache.values()].flatMap((h) => h.items).find((c) => c.id === req.params.id);
    if (!p) return res.status(404).json({ error: "No encontrado" });
    const dir = await directoryMatch(p.brand);
    const accounts = suggestAccounts(getDs(), p.group);
    res.json({ product: p, directory: dir, accounts, colaUrl: `${COLA_BASE}viewColaDetails.do?action=publicDisplaySearchAdvanced&ttbid=${encodeURIComponent(p.id)}` });
  }));

  r.get("/accounts", (req, res) => res.json(suggestAccounts(getDs(), String(req.query.group || ""), 300)));

  // ----- Catálogo de productos del mercado -----
  // Licores / Vinos / Cervezas: búsqueda en vivo en el registro federal de etiquetas (TTB COLA) + radar.
  // Mixers y suministros de bar: catálogo propio que Alex administra (no tienen registro público).
  const CAT_GROUPS = {
    liquors: ["Tequila / Mezcal", "Whisky / Bourbon", "Vodka", "Gin", "Ron", "Coñac / Brandy", "Licor", "Cóctel / RTD", "Otro"],
    wines: ["Vino", "Espumoso", "Sake", "Sidra"],
    beers: ["Cerveza"],
  };
  const MIXER_TYPES = ["Mixer / refresco", "Jarabe / sirope", "Bitters", "Garnish / fruta", "Cristalería", "Herramientas de bar", "Desechables", "Hielo", "Otro"];
  const cache = new Map();
  r.get("/catalog/meta", (req, res) => res.json({ mixerTypes: MIXER_TYPES }));
  r.get("/catalog/search", wrap(async (req, res) => {
    const cat = ["liquors", "wines", "beers", "mixers"].includes(req.query.cat) ? req.query.cat : "liquors";
    const q = String(req.query.q || "").trim().slice(0, 60);
    const own = (await db.list("catalog")).filter((p) => p.cat === cat && (!q || norm(`${p.name} ${p.brand} ${p.type} ${p.supplier}`).includes(norm(q))));
    if (cat === "mixers" || q.length < 2) {
      const recent = cat === "mixers" ? [] : st.cola.filter((c) => CAT_GROUPS[cat].includes(c.group)).slice(0, 60);
      return res.json({ source: cat === "mixers" ? "catalog" : "radar", own, items: recent });
    }
    const key = `${cat}|${norm(q)}`;
    let hit = cache.get(key);
    if (!hit || Date.now() - hit.at > 3600e3) {
      const to = new Date(), from = new Date(); from.setFullYear(from.getFullYear() - 6);
      let items = [];
      try { items = await colaQuery({ from, to, name: q }); }
      catch (e) { console.error("COLA search", e.message, e.cause?.code || ""); return res.status(502).json({ error: "El registro de la TTB no respondió. Intenta de nuevo en un momento." }); }
      // un resultado por producto (marca + nombre), el más reciente
      const seen = new Map();
      for (const it of items.sort((a, b) => b.date.localeCompare(a.date))) { const k = norm(`${it.brand} ${it.fanciful}`); if (!seen.has(k)) seen.set(k, it); }
      hit = { at: Date.now(), items: [...seen.values()] };
      cache.set(key, hit);
      if (cache.size > 300) cache.delete(cache.keys().next().value);
    }
    res.json({ source: "ttb", own, items: hit.items.filter((c) => CAT_GROUPS[cat].includes(c.group)).slice(0, 200), totalAll: hit.items.length });
  }));
  r.post("/catalog", wrap(async (req, res) => {
    const b = req.body || {}, s = (v, n = 200) => String(v ?? "").trim().slice(0, n);
    const cat = ["liquors", "wines", "beers", "mixers"].includes(b.cat) ? b.cat : "mixers";
    if (!s(b.name)) return res.status(400).json({ error: "El nombre del producto es obligatorio" });
    const item = { id: b.id && (await db.get("catalog", b.id)) ? b.id : crypto.randomUUID(), cat, name: s(b.name, 120), brand: s(b.brand, 80), type: s(b.type, 60), size: s(b.size, 40),
      supplier: s(b.supplier, 120), price: s(b.price, 30), url: /^https?:\/\//.test(b.url || "") ? s(b.url, 500) : "", notes: s(b.notes, 500), updatedAt: new Date().toISOString() };
    await db.put("catalog", item);
    res.json(item);
  }));
  r.delete("/catalog/:id", wrap(async (req, res) => { await db.remove("catalog", req.params.id); res.json({ ok: true }); }));
  return r;
}
