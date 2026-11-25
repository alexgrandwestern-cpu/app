// Planificación de eventos con servicio completo: paquetes, solicitudes de clientes con selección
// de productos del catálogo, propuestas de Alex y aceptación por el cliente con enlace privado.
import crypto from "node:crypto";
import express from "express";
import * as db from "./db.js";

const EVENT_TYPES = ["Boda", "Cumpleaños / fiesta privada", "Evento corporativo", "Quinceañera", "Graduación", "Cena o degustación", "Festival / evento público", "Otro"];
const SERVICE_LEVELS = ["Servicio completo (bebidas, bartenders, barra y montaje)", "Bebidas y bartenders", "Solo bebidas (entrega)", "Solo asesoría y planificación"];
const STATUS = ["new", "proposal", "accepted", "declined", "completed", "cancelled"];
const DEFAULT_PACKAGES = [
  { id: "esencial", name: "Esencial", pricePerPerson: null, includes: ["Cerveza nacional e importada", "Vino tinto y blanco de la casa", "Refrescos, agua y hielo", "Vasos desechables de calidad"] },
  { id: "clasico", name: "Clásico", pricePerPerson: null, includes: ["Todo lo del paquete Esencial", "Licores estándar (tequila, vodka, ron, whisky, gin)", "2 cócteles de la casa", "Mixers, jarabes y garnish", "Cristalería"] },
  { id: "premium", name: "Premium", pricePerPerson: null, includes: ["Todo lo del paquete Clásico", "Licores premium / top shelf", "Menú de cócteles de autor", "Espumoso para el brindis", "Barra decorada y bartender líder"] },
];

const s = (v, n = 200) => String(v ?? "").trim().slice(0, n);
const int = (v, min, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null; };
const isEmail = (x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
const token = () => crypto.randomBytes(24).toString("base64url");

async function packages() {
  const saved = await db.get("meta", "evpackages");
  return saved?.items?.length ? saved.items : DEFAULT_PACKAGES;
}
async function eventProducts() {
  return (await db.list("catalog")).filter((p) => p.events).map((p) => ({ id: p.id, cat: p.cat, name: p.name, brand: p.brand, type: p.type, size: p.size, price: p.price }));
}
const publicReq = (r) => ({ ...r, token: undefined, adminNotes: undefined });

export function eventsRouter(requireAuth) {
  const r = express.Router();
  r.use(async (req, res, next) => { await db.initDb().catch(() => {}); next(); });
  const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

  // ----- Público -----
  r.get("/options", wrap(async (req, res) => res.json({ types: EVENT_TYPES, levels: SERVICE_LEVELS, packages: await packages(), products: await eventProducts() })));

  r.post("/requests", wrap(async (req, res) => {
    const b = req.body || {};
    const name = s(b.name, 80), email = s(b.email, 120);
    if (!name || !isEmail(email)) return res.status(400).json({ error: "Escribe tu nombre y un correo válido" });
    const guests = int(b.guests, 1, 5000), hours = int(b.hours, 1, 24);
    if (!guests || !hours) return res.status(400).json({ error: "Indica el número de invitados y las horas del evento" });
    const pk = await packages(), prods = await eventProducts();
    const pkg = pk.find((p) => p.id === b.packageId) || null;
    const selected = (Array.isArray(b.products) ? b.products : []).slice(0, 60)
      .map((x) => { const p = prods.find((q) => q.id === x.id); const qty = int(x.qty, 1, 9999); return p && qty ? { id: p.id, name: p.name, brand: p.brand, cat: p.cat, size: p.size, price: p.price, qty } : null; })
      .filter(Boolean);
    const now = new Date().toISOString();
    const reqDoc = {
      id: crypto.randomBytes(9).toString("base64url"), token: token(), status: "new", createdAt: now, updatedAt: now,
      name, email, phone: s(b.phone, 40), company: s(b.company, 100),
      eventType: EVENT_TYPES.includes(b.eventType) ? b.eventType : "Otro", serviceLevel: SERVICE_LEVELS.includes(b.serviceLevel) ? b.serviceLevel : SERVICE_LEVELS[0],
      date: /^\d{4}-\d{2}-\d{2}$/.test(b.date || "") ? b.date : "", startTime: /^\d{2}:\d{2}$/.test(b.startTime || "") ? b.startTime : "",
      guests, hours, venue: s(b.venue, 200), budget: s(b.budget, 60), message: s(b.message, 2000),
      packageId: pkg?.id || "", packageName: pkg?.name || "", products: selected,
      estimate: b.estimate && typeof b.estimate === "object" ? { drinks: int(b.estimate.drinks, 0, 1e6), beer: int(b.estimate.beer, 0, 1e6), wine: int(b.estimate.wine, 0, 1e6), spirits: int(b.estimate.spirits, 0, 1e6) } : null,
      proposal: null, history: [{ at: now, status: "new", by: "cliente" }],
    };
    await db.put("events", reqDoc);
    res.json({ ok: true, link: `/evento/${reqDoc.token}` });
  }));

  r.get("/request/:token", wrap(async (req, res) => {
    const e = (await db.list("events")).find((x) => x.token === req.params.token);
    if (!e) return res.status(404).json({ error: "Solicitud no encontrada" });
    res.json(publicReq(e));
  }));
  r.post("/request/:token/respond", wrap(async (req, res) => {
    const e = (await db.list("events")).find((x) => x.token === req.params.token);
    if (!e) return res.status(404).json({ error: "Solicitud no encontrada" });
    const a = req.body?.action;
    if (a === "cancel" && ["new", "proposal"].includes(e.status)) e.status = "cancelled";
    else if ((a === "accept" || a === "decline") && e.status === "proposal") e.status = a === "accept" ? "accepted" : "declined";
    else return res.status(400).json({ error: "Acción no válida para el estado actual" });
    const now = new Date().toISOString();
    e.updatedAt = now; e.history.push({ at: now, status: e.status, by: "cliente", note: s(req.body?.note, 500) });
    await db.put("events", e);
    res.json({ ok: true });
  }));

  // ----- Administración (Alex) -----
  r.get("/admin", requireAuth, wrap(async (req, res) => {
    const list = (await db.list("events")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ requests: list.map((e) => ({ ...e, token: undefined, link: `/evento/${e.token}` })), packages: await packages(), types: EVENT_TYPES, levels: SERVICE_LEVELS });
  }));
  r.put("/admin/request/:id", requireAuth, wrap(async (req, res) => {
    const e = await db.get("events", req.params.id);
    if (!e) return res.status(404).json({ error: "No encontrado" });
    const b = req.body || {}, now = new Date().toISOString();
    if (typeof b.adminNotes === "string") e.adminNotes = s(b.adminNotes, 3000);
    if (b.proposal) {
      const total = s(b.proposal.total, 40), message = s(b.proposal.message, 4000);
      if (!total && !message) return res.status(400).json({ error: "Escribe el precio o el detalle de la propuesta" });
      e.proposal = { total, message, validUntil: /^\d{4}-\d{2}-\d{2}$/.test(b.proposal.validUntil || "") ? b.proposal.validUntil : "", sentAt: now };
      e.status = "proposal"; e.history.push({ at: now, status: "proposal", by: "Alex" });
    }
    if (b.status && STATUS.includes(b.status) && b.status !== e.status) { e.status = b.status; e.history.push({ at: now, status: b.status, by: "Alex" }); }
    e.updatedAt = now;
    await db.put("events", e);
    res.json({ ok: true });
  }));
  r.put("/admin/packages", requireAuth, wrap(async (req, res) => {
    const items = (Array.isArray(req.body?.items) ? req.body.items : []).slice(0, 8).map((p, i) => ({
      id: s(p.id, 30).replace(/[^\w-]/g, "") || `pkg${i + 1}`, name: s(p.name, 60),
      pricePerPerson: p.pricePerPerson === "" || p.pricePerPerson == null ? null : int(p.pricePerPerson, 0, 100000),
      includes: (Array.isArray(p.includes) ? p.includes : String(p.includes || "").split("\n")).map((x) => s(x, 120)).filter(Boolean).slice(0, 12),
    })).filter((p) => p.name);
    if (!items.length) return res.status(400).json({ error: "Agrega al menos un paquete" });
    await db.put("meta", { id: "evpackages", items });
    res.json({ ok: true, items });
  }));
  return r;
}
