// Marketplace de expertos (modelo tipo Airbnb): expertos publican servicios, negocios reservan,
// el experto acepta/rechaza/completa, el cliente deja reseña verificada y la plataforma cobra comisión.
import crypto from "node:crypto";
import express from "express";
import * as db from "./db.js";

export const FEE_PCT = Number(process.env.PLATFORM_FEE_PCT || 15);
export const CATEGORIES = ["Licencia de licor", "Layout y merchandising", "Capacitación BASSET", "Permisos y zonificación", "Seguro / dram shop", "Otro"];
const STATUS_LABEL = { requested: "Solicitada", accepted: "Aceptada", declined: "Rechazada", completed: "Completada", cancelled: "Cancelada" };

const id = (n = 9) => crypto.randomBytes(n).toString("base64url");
const token = () => crypto.randomBytes(24).toString("base64url");
const str = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "experto";
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const num = (v) => (v === "" || v == null || isNaN(Number(v)) ? null : Math.max(0, Math.round(Number(v))));

function cleanServices(arr) {
  return (Array.isArray(arr) ? arr : []).slice(0, 12).map((s) => ({
    id: str(s.id, 20) || id(5),
    name: str(s.name, 80),
    category: CATEGORIES.includes(s.category) ? s.category : "Otro",
    price: num(s.price),
    unit: ["fijo", "desde", "cotizar"].includes(s.unit) ? s.unit : "cotizar",
    duration: str(s.duration, 40),
    description: str(s.description, 500),
  })).filter((s) => s.name);
}
function cleanProfile(b, base = {}) {
  return {
    ...base,
    name: str(b.name ?? base.name, 80),
    headline: str(b.headline ?? base.headline, 120),
    bio: str(b.bio ?? base.bio, 2000),
    photo: /^https:\/\//.test(b.photo ?? "") ? str(b.photo, 500) : b.photo === "" ? "" : base.photo || "",
    areas: (Array.isArray(b.areas) ? b.areas : String(b.areas ?? (base.areas || []).join(",")).split(",")).map((x) => str(x, 40)).filter(Boolean).slice(0, 15),
    languages: (Array.isArray(b.languages) ? b.languages : String(b.languages ?? (base.languages || []).join(",")).split(",")).map((x) => str(x, 20)).filter(Boolean).slice(0, 6),
    yearsExp: num(b.yearsExp ?? base.yearsExp),
    email: str(b.email ?? base.email, 120),
    phone: str(b.phone ?? base.phone, 40),
    services: b.services ? cleanServices(b.services) : base.services || [],
  };
}

async function ratingFor(expertId, reviews) {
  const rs = (reviews || (await db.list("reviews"))).filter((r) => r.expertId === expertId);
  return { rating: rs.length ? +(rs.reduce((a, r) => a + r.rating, 0) / rs.length).toFixed(2) : null, reviewsCount: rs.length };
}
function publicExpert(e, rating) {
  const prices = e.services.filter((s) => s.price != null && s.unit !== "cotizar").map((s) => s.price);
  return {
    id: e.id, slug: e.slug, name: e.name, headline: e.headline, bio: e.bio, photo: e.photo, areas: e.areas, languages: e.languages,
    yearsExp: e.yearsExp, featured: !!e.featured, services: e.services, categories: [...new Set(e.services.map((s) => s.category))],
    minPrice: prices.length ? Math.min(...prices) : null, joined: e.createdAt?.slice(0, 7), ...rating,
  };
}
const feeOf = (price) => (price == null ? null : Math.round((price * FEE_PCT) / 100));
const publicBooking = (b) => ({ ...b, clientToken: undefined, statusLabel: STATUS_LABEL[b.status] });

async function seed() {
  const experts = await db.list("experts");
  if (experts.length) return;
  const now = new Date().toISOString();
  await db.put("experts", {
    id: id(), slug: "alex-zavala", token: token(), status: "approved", featured: true, createdAt: now,
    name: "Alex Zavala",
    headline: "Licencias de licor y layout para restaurantes y tiendas en Chicago",
    bio: "Fundador de Alex Solutions, Inc. Acompaño a restaurantes, taquerías, cafés y tiendas de Chicago en todo el trámite de su licencia de licor: diagnóstico de la ubicación, expediente, seguro, capacitación BASSET e inspecciones. También diseño el layout de tiendas de Fine Wine & Spirits y barras para que cada botella se venda sola.",
    photo: "", areas: ["Toda la ciudad de Chicago"], languages: ["Español", "English"], yearsExp: null, email: "", phone: "",
    services: [
      { id: id(5), name: "Diagnóstico de ubicación", category: "Permisos y zonificación", price: null, unit: "cotizar", duration: "45 min", description: "Revisamos zonificación, posibles moratorias y el tipo de licencia ideal para tu negocio." },
      { id: id(5), name: "Licencia Consumption on Premises – Incidental Activity", category: "Licencia de licor", price: null, unit: "cotizar", duration: "Trámite completo", description: "Para restaurantes: expediente, documentos, seguro, BASSET y seguimiento hasta la aprobación." },
      { id: id(5), name: "Licencia Package Goods", category: "Licencia de licor", price: null, unit: "cotizar", duration: "Trámite completo", description: "Para tiendas y groceries que quieren vender vino, cerveza y licores para llevar." },
      { id: id(5), name: "Layout de tienda Fine Wine & Spirits", category: "Layout y merchandising", price: null, unit: "cotizar", duration: "2–6 semanas", description: "Plano con zonas, planograma, escalera de precios y vitrina premium." },
    ],
  });
  console.log("Marketplace: perfil de Alex Zavala creado");
}

// ---------- Rate limit sencillo para formularios públicos ----------
const hits = new Map();
function limited(ip, max = 20) {
  const now = Date.now();
  const l = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  l.push(now); hits.set(ip, l);
  return l.length > max;
}

export function marketplaceRouter(requireAuth) {
  const r = express.Router();
  const ready = db.initDb().then(seed).catch((e) => console.error("Marketplace DB error:", e));
  r.use(async (req, res, next) => { await ready; next(); });
  const wrap = (fn) => (req, res) => fn(req, res).catch((e) => { console.error(e); res.status(500).json({ error: "Error interno" }); });

  // ----- Público -----
  r.get("/meta", (req, res) => res.json({ categories: CATEGORIES, feePct: FEE_PCT }));
  r.get("/experts", wrap(async (req, res) => {
    const [experts, reviews] = await Promise.all([db.list("experts"), db.list("reviews")]);
    const q = str(req.query.q).toLowerCase(), cat = str(req.query.category), area = str(req.query.area).toLowerCase();
    const out = [];
    for (const e of experts.filter((e) => e.status === "approved")) {
      if (cat && !e.services.some((s) => s.category === cat)) continue;
      if (area && !e.areas.some((a) => a.toLowerCase().includes(area) || a.toLowerCase().includes("toda"))) continue;
      if (q && !`${e.name} ${e.headline} ${e.bio} ${e.services.map((s) => s.name).join(" ")}`.toLowerCase().includes(q)) continue;
      out.push(publicExpert(e, await ratingFor(e.id, reviews)));
    }
    out.sort((a, b) => b.featured - a.featured || (b.rating || 0) - (a.rating || 0) || b.reviewsCount - a.reviewsCount);
    res.json(out);
  }));
  r.get("/experts/:slug", wrap(async (req, res) => {
    const e = (await db.list("experts")).find((x) => x.slug === req.params.slug && x.status === "approved");
    if (!e) return res.status(404).json({ error: "Experto no encontrado" });
    const reviews = (await db.list("reviews")).filter((x) => x.expertId === e.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ ...publicExpert(e, await ratingFor(e.id, reviews)), reviews: reviews.map((x) => ({ rating: x.rating, text: x.text, business: x.business, createdAt: x.createdAt, service: x.serviceName })) });
  }));
  r.post("/bookings", wrap(async (req, res) => {
    if (limited(req.ip)) return res.status(429).json({ error: "Demasiadas solicitudes. Intenta más tarde." });
    const b = req.body || {};
    const e = await db.get("experts", str(b.expertId, 30));
    if (!e || e.status !== "approved") return res.status(400).json({ error: "Experto no disponible" });
    const svc = e.services.find((s) => s.id === b.serviceId);
    if (!svc) return res.status(400).json({ error: "Elige un servicio" });
    const business = str(b.business, 100), contactName = str(b.contactName, 80), email = str(b.email, 120);
    if (!business || !contactName || !isEmail(email)) return res.status(400).json({ error: "Completa negocio, nombre y un correo válido" });
    const price = svc.unit === "cotizar" ? null : svc.price;
    const booking = {
      id: id(), clientToken: token(), expertId: e.id, expertName: e.name, serviceId: svc.id, serviceName: svc.name, category: svc.category,
      price, priceUnit: svc.unit, fee: feeOf(price), business, contactName, email, phone: str(b.phone, 40), address: str(b.address, 160),
      date: str(b.date, 20), message: str(b.message, 1500), prospectId: str(b.prospectId, 40), status: "requested",
      createdAt: new Date().toISOString(), history: [{ at: new Date().toISOString(), status: "requested", by: "cliente" }],
    };
    await db.put("bookings", booking);
    res.json({ ok: true, link: `/reserva/${booking.clientToken}` });
  }));
  r.get("/booking/:token", wrap(async (req, res) => {
    const b = (await db.list("bookings")).find((x) => x.clientToken === req.params.token);
    if (!b) return res.status(404).json({ error: "Reserva no encontrada" });
    const e = await db.get("experts", b.expertId);
    const review = (await db.list("reviews")).find((x) => x.bookingId === b.id) || null;
    res.json({ booking: publicBooking(b), expert: e ? { name: e.name, slug: e.slug, photo: e.photo, headline: e.headline, phone: b.status === "accepted" || b.status === "completed" ? e.phone : "", email: b.status === "accepted" || b.status === "completed" ? e.email : "" } : null, review });
  }));
  r.post("/booking/:token/cancel", wrap(async (req, res) => {
    const b = (await db.list("bookings")).find((x) => x.clientToken === req.params.token);
    if (!b || !["requested", "accepted"].includes(b.status)) return res.status(400).json({ error: "No se puede cancelar" });
    b.status = "cancelled"; b.history.push({ at: new Date().toISOString(), status: "cancelled", by: "cliente" });
    await db.put("bookings", b); res.json({ ok: true });
  }));
  r.post("/booking/:token/review", wrap(async (req, res) => {
    const b = (await db.list("bookings")).find((x) => x.clientToken === req.params.token);
    if (!b || b.status !== "completed") return res.status(400).json({ error: "Solo puedes reseñar un servicio completado" });
    if ((await db.list("reviews")).some((x) => x.bookingId === b.id)) return res.status(400).json({ error: "Ya dejaste una reseña" });
    const rating = Math.min(5, Math.max(1, Math.round(Number(req.body?.rating) || 0)));
    if (!rating) return res.status(400).json({ error: "Elige de 1 a 5 estrellas" });
    await db.put("reviews", { id: id(), bookingId: b.id, expertId: b.expertId, rating, text: str(req.body?.text, 1500), business: b.business, serviceName: b.serviceName, createdAt: new Date().toISOString() });
    res.json({ ok: true });
  }));
  r.post("/apply", wrap(async (req, res) => {
    if (limited(req.ip, 5)) return res.status(429).json({ error: "Demasiadas solicitudes. Intenta más tarde." });
    const p = cleanProfile(req.body || {});
    if (!p.name || !isEmail(p.email) || !p.services.length) return res.status(400).json({ error: "Completa nombre, correo válido y al menos un servicio" });
    const experts = await db.list("experts");
    let slug = slugify(p.name); if (experts.some((e) => e.slug === slug)) slug = `${slug}-${id(3).toLowerCase()}`;
    const e = { ...p, id: id(), slug, token: token(), status: "pending", featured: false, createdAt: new Date().toISOString() };
    await db.put("experts", e);
    res.json({ ok: true, link: `/experto-panel/${e.token}` });
  }));

  // ----- Panel privado del experto (enlace con token) -----
  const byToken = async (t) => (await db.list("experts")).find((e) => e.token === t);
  r.get("/manage/:token", wrap(async (req, res) => {
    const e = await byToken(req.params.token);
    if (!e) return res.status(404).json({ error: "Enlace inválido" });
    const bookings = (await db.list("bookings")).filter((b) => b.expertId === e.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const reviews = (await db.list("reviews")).filter((x) => x.expertId === e.id);
    res.json({ expert: { ...e, token: undefined }, bookings: bookings.map(publicBooking), reviews, feePct: FEE_PCT, categories: CATEGORIES });
  }));
  r.put("/manage/:token/profile", wrap(async (req, res) => {
    const e = await byToken(req.params.token);
    if (!e) return res.status(404).json({ error: "Enlace inválido" });
    const updated = cleanProfile(req.body || {}, e);
    if (!updated.name || !updated.services.length) return res.status(400).json({ error: "Nombre y al menos un servicio son obligatorios" });
    await db.put("experts", { ...e, ...updated });
    res.json({ ok: true });
  }));
  r.post("/manage/:token/booking/:id", wrap(async (req, res) => {
    const e = await byToken(req.params.token);
    const b = await db.get("bookings", req.params.id);
    if (!e || !b || b.expertId !== e.id) return res.status(404).json({ error: "No encontrado" });
    const action = req.body?.action;
    const next = { accept: ["requested", "accepted"], decline: ["requested", "declined"], complete: ["accepted", "completed"] }[action];
    if (!next || b.status !== next[0]) return res.status(400).json({ error: "Acción no válida para el estado actual" });
    if (action === "accept" && req.body.price !== undefined && req.body.price !== "") { b.price = num(req.body.price); b.fee = feeOf(b.price); }
    b.status = next[1]; b.history.push({ at: new Date().toISOString(), status: b.status, by: "experto", note: str(req.body?.note, 300) });
    await db.put("bookings", b); res.json({ ok: true });
  }));

  // ----- Administración (Alex) -----
  r.get("/admin", requireAuth, wrap(async (req, res) => {
    const [experts, bookings, reviews] = await Promise.all([db.list("experts"), db.list("bookings"), db.list("reviews")]);
    const done = bookings.filter((b) => b.status === "completed");
    const out = [];
    for (const e of experts) out.push({ ...e, manageLink: `/experto-panel/${e.token}`, token: undefined, ...(await ratingFor(e.id, reviews)), bookings: bookings.filter((b) => b.expertId === e.id).length });
    res.json({
      db: db.dbKind(), feePct: FEE_PCT, experts: out,
      bookings: bookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicBooking),
      stats: {
        experts: experts.filter((e) => e.status === "approved").length, pending: experts.filter((e) => e.status === "pending").length,
        bookings: bookings.length, open: bookings.filter((b) => ["requested", "accepted"].includes(b.status)).length, completed: done.length,
        gmv: done.reduce((a, b) => a + (b.price || 0), 0), commission: done.reduce((a, b) => a + (b.fee || 0), 0), reviews: reviews.length,
      },
    });
  }));
  r.post("/admin/expert/:id", requireAuth, wrap(async (req, res) => {
    const e = await db.get("experts", req.params.id);
    if (!e) return res.status(404).json({ error: "No encontrado" });
    const a = req.body?.action;
    if (a === "approve") e.status = "approved"; else if (a === "reject") e.status = "rejected"; else if (a === "pause") e.status = "paused";
    else if (a === "feature") e.featured = true; else if (a === "unfeature") e.featured = false;
    else return res.status(400).json({ error: "Acción no válida" });
    await db.put("experts", e); res.json({ ok: true });
  }));
  return r;
}
