import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadFromCity, loadFromCache } from "./lib/data.js";
import { filterProspects, stats, facets, toCSV } from "./lib/query.js";
import { ask, aiEnabled } from "./lib/assistant.js";
import { marketplaceRouter } from "./lib/marketplace.js";
import { distributorsRouter } from "./lib/distributors.js";
import { tradeRouter, syncTrade } from "./lib/trade.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const ADMIN_USER = (process.env.ADMIN_USER || "alex").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "cambiar-esta-clave";
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const REFRESH_HOURS = Number(process.env.REFRESH_HOURS || 24);

// ---------- Datos ----------
let ds = loadFromCache();
let status = { state: ds ? "ready" : "loading", message: ds ? "Datos en caché" : "Iniciando descarga", lastError: null };

async function refresh() {
  if (status.state === "refreshing") return;
  status = { ...status, state: ds ? "refreshing" : "loading", message: "Descargando datos de la Ciudad de Chicago…" };
  try {
    const next = await loadFromCity((msg) => (status.message = msg));
    ds = next;
    status = { state: "ready", message: `Actualizado: ${next.summary.totalLicenses.toLocaleString()} licencias analizadas`, lastError: null };
    console.log(status.message, "→", next.summary.prospects, "prospectos");
  } catch (e) {
    console.error("Error al actualizar:", e);
    status = { state: ds ? "ready" : "error", message: ds ? "Usando datos anteriores" : "No se pudieron descargar los datos", lastError: String(e.message || e) };
  }
}
refresh();
setInterval(refresh, REFRESH_HOURS * 3600 * 1000);

// ---------- Sesión ----------
const sign = (v) => crypto.createHmac("sha256", SECRET).update(v).digest("base64url");
function makeToken(user) {
  const payload = Buffer.from(JSON.stringify({ u: user, exp: Date.now() + 7 * 864e5 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
function readToken(req) {
  const raw = (req.headers.cookie || "").split(";").map((c) => c.trim()).find((c) => c.startsWith("lp_session="));
  if (!raw) return null;
  const [payload, sig] = raw.slice(11).split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}
const safeEq = (a, b) => {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

const attempts = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  attempts.set(ip, list);
  return list.length >= 10;
}

// ---------- App ----------
const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const requireAuth = (req, res, next) => {
  const s = readToken(req);
  if (s) { req.user = s.u; return next(); }
  if (req.originalUrl.startsWith("/api/")) return res.status(401).json({ error: "No autorizado" });
  return res.redirect("/login");
};

app.get("/healthz", (req, res) => res.json({ ok: true }));
app.get("/api/public-stats", (req, res) => {
  if (!ds) return res.json({ ready: false, status });
  const s = ds.summary;
  res.json({ ready: true, totalLicenses: s.totalLicenses, foodBusinesses: s.foodBusinesses, prospects: s.prospects, tierA: ds.prospects.filter((p) => p.tier === "A" && !p.chain).length, updatedAt: ds.updatedAt });
});

// ---------- Tarjeta de contacto (datos desde variables de entorno) ----------
function contactInfo(req) {
  const e = process.env;
  return {
    name: e.CONTACT_NAME || "Alex Zavala",
    title: e.CONTACT_TITLE || "Licencias de licor y layout para restaurantes y tiendas de vinos y licores",
    company: e.CONTACT_COMPANY || "Alex Solutions, Inc",
    phone: e.CONTACT_PHONE || "",
    whatsapp: (e.CONTACT_WHATSAPP || "").replace(/[^\d]/g, ""),
    email: e.CONTACT_EMAIL || "",
    city: e.CONTACT_CITY || "Chicago, IL",
    website: e.CONTACT_WEBSITE || `${req.protocol}://${req.get("host")}`,
    instagram: e.CONTACT_INSTAGRAM || "",
    linkedin: e.CONTACT_LINKEDIN || "",
  };
}
const vcEsc = (s = "") => String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
function vcard(c) {
  const [first, ...rest] = c.name.split(" ");
  return [
    "BEGIN:VCARD", "VERSION:3.0",
    `N:${vcEsc(rest.join(" "))};${vcEsc(first)};;;`, `FN:${vcEsc(c.name)}`,
    `ORG:${vcEsc(c.company)}`, `TITLE:${vcEsc(c.title)}`,
    c.phone && `TEL;TYPE=CELL:${c.phone}`,
    c.email && `EMAIL;TYPE=INTERNET:${c.email}`,
    c.city && `ADR;TYPE=WORK:;;;${vcEsc(c.city)};;;`,
    c.website && `URL:${c.website}`,
    "END:VCARD",
  ].filter(Boolean).join("\r\n");
}
app.get("/api/contact", (req, res) => { const c = contactInfo(req); res.json({ ...c, vcard: vcard(c) }); });
app.get("/contacto.vcf", (req, res) => {
  const c = contactInfo(req);
  res.setHeader("Content-Type", "text/vcard; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${c.name.replace(/[^\w ]/g, "").replace(/ /g, "-") || "contacto"}.vcf"`);
  res.send(vcard(c));
});

app.get("/login", (req, res) => {
  if (readToken(req)) return res.redirect("/app");
  res.sendFile(path.join(__dirname, "views", "login.html"));
});
app.post("/login", (req, res) => {
  const ip = req.ip;
  if (rateLimited(ip)) return res.redirect("/login?e=limit");
  const user = String(req.body.user || "").trim().toLowerCase();
  const pass = String(req.body.password || "");
  if (safeEq(user, ADMIN_USER) && safeEq(pass, ADMIN_PASSWORD)) {
    attempts.delete(ip);
    res.setHeader("Set-Cookie", `lp_session=${makeToken(user)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}${req.secure ? "; Secure" : ""}`);
    return res.redirect("/app");
  }
  attempts.get(ip).push(Date.now());
  res.redirect("/login?e=1");
});
app.post("/logout", (req, res) => {
  res.setHeader("Set-Cookie", "lp_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  res.redirect("/");
});

app.get("/app", requireAuth, (req, res) => res.sendFile(path.join(__dirname, "views", "app.html")));

const api = express.Router();
api.use(requireAuth);
api.use((req, res, next) => {
  if (req.path === "/status") return next();
  if (!ds) return res.status(503).json({ error: "Los datos se están cargando", status });
  next();
});
api.get("/status", (req, res) => res.json({ status, user: req.user, ai: aiEnabled(), updatedAt: ds?.updatedAt || null }));
api.get("/facets", (req, res) => res.json(facets(ds)));
api.get("/stats", (req, res) => res.json(stats(ds, req.query)));
api.get("/prospects", (req, res) => {
  const list = filterProspects(ds.prospects, req.query);
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const page = Math.max(Number(req.query.page) || 1, 1);
  res.json({ total: list.length, page, limit, items: list.slice((page - 1) * limit, page * limit) });
});
api.get("/map", (req, res) => {
  const list = filterProspects(ds.prospects, req.query).filter((p) => p.lat && p.lon).slice(0, 2500);
  res.json(list.map((p) => [p.id, p.lat, p.lon, p.score, p.name, p.tier]));
});
api.get("/prospect/:id", (req, res) => {
  const p = ds.prospects.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "No encontrado" });
  const nearby = p.lat ? ds.prospects.filter((x) => x.id !== p.id && x.lat && Math.abs(x.lat - p.lat) < 0.006 && Math.abs(x.lon - p.lon) < 0.008 && !x.chain && x.segment !== "Institucional").slice(0, 6) : [];
  res.json({ ...p, nearby: nearby.map((x) => ({ id: x.id, name: x.name, address: x.address, score: x.score, tier: x.tier })) });
});
api.get("/export.csv", (req, res) => {
  const list = filterProspects(ds.prospects, req.query);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="prospectos-licor-chicago-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send("﻿" + toCSV(list));
});
api.post("/assistant", async (req, res) => {
  try {
    res.json(await ask(ds, Array.isArray(req.body?.messages) ? req.body.messages : []));
  } catch (e) {
    console.error(e);
    res.status(500).json({ answer: "Ocurrió un error con el asistente." });
  }
});
api.post("/refresh", (req, res) => {
  refresh();
  res.json({ ok: true, status });
});
app.use("/api/mk", marketplaceRouter(requireAuth));
app.use("/api/dist", distributorsRouter(requireAuth));
app.use("/api/trade", tradeRouter(requireAuth, () => ds));
setTimeout(syncTrade, 15000);
setInterval(syncTrade, 24 * 3600 * 1000);
app.use("/api", api);

// Páginas del marketplace con parámetros en la URL
const page = (f) => (req, res) => res.sendFile(path.join(__dirname, "public", f));
app.get("/experto/:slug", page("mk-experto.html"));
app.get("/reserva/:token", page("mk-reserva.html"));
app.get("/experto-panel/:token", page("mk-panel.html"));

app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"], maxAge: "5m" }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`LicenciaPro escuchando en :${PORT}`));
