// Buscador de distribuidores por marca (Illinois): directorio verificado + investigación con IA (web search).
// Illinois no publica qué distribuidor tiene cada marca, así que la IA investiga con fuentes
// y el resultado queda "sin verificar" hasta que Alex lo confirma.
import crypto from "node:crypto";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import * as db from "./db.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
const STATE = "Illinois";
const COL = "distributors";

const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const str = (v, max = 300) => String(v ?? "").trim().slice(0, max);
const id = () => crypto.randomBytes(8).toString("base64url");

const CATEGORIES = ["Vino", "Espumoso", "Tequila / Mezcal", "Whisky / Bourbon", "Vodka", "Gin", "Ron", "Coñac / Brandy", "Licor", "Cerveza", "Sidra / Seltzer / RTD", "Otro"];

function clean(b, base = {}) {
  const arr = (v, f) => (Array.isArray(v) ? v : []).slice(0, 10).map(f).filter(Boolean);
  return {
    ...base,
    brand: str(b.brand ?? base.brand, 100),
    category: CATEGORIES.includes(b.category) ? b.category : base.category || "Otro",
    supplier: str(b.supplier ?? base.supplier, 150),
    distributors: b.distributors ? arr(b.distributors, (d) => (str(d.name, 120) ? { name: str(d.name, 120), territory: str(d.territory, 120), notes: str(d.notes, 300) } : null)) : base.distributors || [],
    sources: b.sources ? arr(b.sources, (s) => (/^https?:\/\//.test(s.url || "") ? { title: str(s.title, 150), url: str(s.url, 500) } : null)) : base.sources || [],
    summary: str(b.summary ?? base.summary, 1500),
    confidence: ["alta", "media", "baja"].includes(b.confidence) ? b.confidence : base.confidence || "baja",
    notes: str(b.notes ?? base.notes, 1000),
  };
}

const REPORT_TOOL = {
  name: "report_distributor",
  description: "Entrega el resultado final de la investigación sobre quién distribuye la marca en Illinois. Llámala una sola vez al terminar de buscar.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["brand", "category", "supplier", "distributors", "sources", "summary", "confidence"],
    properties: {
      brand: { type: "string", description: "Nombre oficial de la marca" },
      category: { type: "string", enum: CATEGORIES },
      supplier: { type: "string", description: "Dueño de la marca / proveedor / importador (vacío si no se encontró)" },
      distributors: {
        type: "array",
        description: "Distribuidores mayoristas en Illinois encontrados (vacío si no hay evidencia)",
        items: { type: "object", additionalProperties: false, required: ["name", "territory", "notes"], properties: { name: { type: "string" }, territory: { type: "string", description: "Territorio en Illinois, p. ej. 'Todo el estado' o 'Chicago y área metropolitana'" }, notes: { type: "string" } } },
      },
      sources: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "url"], properties: { title: { type: "string" }, url: { type: "string" } } } },
      summary: { type: "string", description: "Resumen en español, 2-4 frases, indicando qué tan reciente es la evidencia" },
      confidence: { type: "string", enum: ["alta", "media", "baja"] },
    },
  },
};

const SYSTEM = `Eres un investigador del mercado de bebidas alcohólicas en ${STATE} (EE. UU.) para Alex Solutions, Inc.
Objetivo: dada una marca (vino, tequila, cerveza, whisky, etc.), identificar quién es su distribuidor mayorista ACTUAL en ${STATE} (sistema de tres niveles: proveedor → distribuidor → minorista) y el dueño/proveedor de la marca.
Reglas:
- Usa la búsqueda web. Prioriza fuentes primarias y recientes: sitio del proveedor ("where to buy", "distributors", "find a distributor"), comunicados de prensa, noticias del sector (Beverage Dynamics, Shanken News Daily, Brewbound, Wine Business, Beer Business Daily), sitios de distribuidores de Illinois y la ILCC.
- Las marcas cambian de distribuidor: indica la fecha de la evidencia en el resumen y baja la confianza si es antigua (más de 2 años) o indirecta.
- No inventes. Si no encuentras evidencia clara, deja la lista de distribuidores vacía y explica qué buscaste.
- Incluye solo URLs que realmente consultaste.
- Al terminar, llama a la herramienta report_distributor exactamente una vez.`;

async function research(brand) {
  const messages = [{ role: "user", content: `Marca a investigar: "${brand}". ¿Quién la distribuye actualmente en ${STATE}?` }];
  for (let i = 0; i < 8; i++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }, REPORT_TOOL],
      messages,
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    if (response.stop_reason === "refusal") throw new Error("La IA no pudo investigar esta marca.");
    const report = response.content.find((b) => b.type === "tool_use" && b.name === "report_distributor");
    if (report) return report.input;
    messages.push({ role: "assistant", content: response.content });
    if (response.stop_reason === "pause_turn") continue;
    if (response.stop_reason === "end_turn" || response.stop_reason === "max_tokens") {
      messages.push({ role: "user", content: "Entrega ahora tu resultado llamando a report_distributor." });
      continue;
    }
    const other = response.content.filter((b) => b.type === "tool_use");
    if (other.length) messages.push({ role: "user", content: other.map((u) => ({ type: "tool_result", tool_use_id: u.id, content: "Herramienta no disponible", is_error: true })) });
  }
  throw new Error("La investigación no terminó. Intenta de nuevo.");
}

export function distributorsRouter(requireAuth) {
  const r = express.Router();
  r.use(requireAuth);
  r.use(async (req, res, next) => { await db.initDb().catch(() => {}); next(); });
  const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
    console.error("Distribuidores:", e?.status, e?.message);
    res.status(e instanceof Anthropic.RateLimitError ? 429 : 500).json({ error: e instanceof Anthropic.APIError ? "La IA no respondió. Intenta en un momento." : e.message || "Error interno" });
  });

  r.get("/meta", (req, res) => res.json({ ai: Boolean(client), state: STATE, categories: CATEGORIES }));
  r.get("/list", wrap(async (req, res) => {
    const q = norm(str(req.query.q));
    let list = await db.list(COL);
    if (q) list = list.filter((e) => norm(`${e.brand} ${e.supplier} ${e.distributors.map((d) => d.name).join(" ")}`).includes(q));
    list.sort((a, b) => (b.status === "verified") - (a.status === "verified") || (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    res.json(list.slice(0, 200));
  }));
  r.post("/research", wrap(async (req, res) => {
    const brand = str(req.body?.brand, 100);
    if (brand.length < 2) return res.status(400).json({ error: "Escribe el nombre de la marca" });
    if (!client) return res.status(400).json({ error: "Para investigar con IA agrega ANTHROPIC_API_KEY en Render. Mientras, puedes agregar el distribuidor manualmente." });
    const existing = (await db.list(COL)).find((e) => norm(e.brand) === norm(brand));
    if (existing?.status === "verified" && !req.body?.force) return res.json(existing);
    const found = await research(brand);
    const now = new Date().toISOString();
    const entry = { ...clean(found, existing || {}), id: existing?.id || id(), brandNorm: norm(found.brand || brand), query: brand, status: "unverified", source: "ia", researchedAt: now, updatedAt: now, createdAt: existing?.createdAt || now };
    await db.put(COL, entry);
    res.json(entry);
  }));
  r.post("/entry", wrap(async (req, res) => {
    const e = clean(req.body || {});
    if (!e.brand) return res.status(400).json({ error: "La marca es obligatoria" });
    const now = new Date().toISOString();
    const entry = { ...e, id: id(), brandNorm: norm(e.brand), status: req.body?.verify ? "verified" : "unverified", source: "manual", createdAt: now, updatedAt: now, verifiedAt: req.body?.verify ? now : null };
    await db.put(COL, entry);
    res.json(entry);
  }));
  r.put("/entry/:id", wrap(async (req, res) => {
    const base = await db.get(COL, req.params.id);
    if (!base) return res.status(404).json({ error: "No encontrado" });
    const now = new Date().toISOString();
    const e = { ...clean(req.body || {}, base), updatedAt: now };
    if (req.body?.verify === true) { e.status = "verified"; e.verifiedAt = now; }
    if (req.body?.verify === false) { e.status = "unverified"; e.verifiedAt = null; }
    e.brandNorm = norm(e.brand);
    await db.put(COL, e);
    res.json(e);
  }));
  r.delete("/entry/:id", wrap(async (req, res) => { await db.remove(COL, req.params.id); res.json({ ok: true }); }));
  return r;
}

// Para el asistente: buscar en el directorio
export async function lookupDistributor(q) {
  const n = norm(q);
  return (await db.list(COL)).filter((e) => norm(`${e.brand} ${e.supplier}`).includes(n)).slice(0, 5)
    .map((e) => ({ marca: e.brand, categoria: e.category, proveedor: e.supplier, distribuidores: e.distributors, estado: e.status === "verified" ? "verificado" : "sin verificar", resumen: e.summary }));
}
