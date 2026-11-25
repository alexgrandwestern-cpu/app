// LicenciaPro Chicago — panel de prospectos
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => Number(n || 0).toLocaleString("en-US");

const state = { page: 1, limit: 50, tab: "overview", filters: { tier: [] }, total: 0 };
const store = {
  get() { try { return JSON.parse(localStorage.getItem("lp_pipeline") || "{}"); } catch { return {}; } },
  set(v) { try { localStorage.setItem("lp_pipeline", JSON.stringify(v)); } catch {} },
};
const STATUSES = [["", "Nuevo"], ["contactado", "Contactado"], ["interesado", "Interesado"], ["cliente", "Cliente"], ["descartado", "Descartado"]];

async function api(path, opts) {
  const r = await fetch(path, opts);
  if (r.status === 401) { location.href = "/login"; throw new Error("auth"); }
  if (r.status === 503) { const d = await r.json(); throw Object.assign(new Error("loading"), { status: d.status }); }
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || `HTTP ${r.status}`); }
  return r.json();
}

function params(extra = {}) {
  const f = state.filters, p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  for (const k of ["segment", "cuisine", "area", "zip", "ward"]) if (f[k]) p.set(k, f[k]);
  if (f.tier.length) p.set("tier", f.tier.join(","));
  if (f.minScore) p.set("minScore", f.minScore);
  if (f.newOnly) p.set("newOnly", "true");
  if (f.patio) p.set("patio", "true");
  if (f.includeExcluded) p.set("includeExcluded", "true");
  for (const [k, v] of Object.entries(extra)) p.set(k, v);
  return p.toString();
}

// ---------- Estado de datos ----------
async function waitForData() {
  const loading = $("#loading");
  for (;;) {
    const s = await api("/api/status");
    $("#ai-engine").textContent = s.ai ? "IA: Claude · datos en vivo" : "Motor local · agrega ANTHROPIC_API_KEY para IA completa";
    if (s.updatedAt) {
      loading.classList.remove("show");
      $("#data-status").textContent = `Datos: ${new Date(s.updatedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}${s.status.state === "refreshing" ? " · actualizando…" : ""}`;
      return;
    }
    loading.classList.add("show");
    $("#loading-msg").textContent = s.status.message + (s.status.lastError ? ` (${s.status.lastError})` : "");
    $("#data-status").textContent = "Cargando…";
    await new Promise((r) => setTimeout(r, 2500));
  }
}

// ---------- Filtros ----------
async function loadFacets() {
  const f = await api("/api/facets");
  const fill = (id, arr) => { const el = $(id); el.innerHTML = el.options[0].outerHTML + arr.map((v) => `<option>${esc(v)}</option>`).join(""); };
  fill("#f-segment", f.segments.filter((s) => s !== "Institucional"));
  fill("#f-cuisine", f.cuisines); fill("#f-area", f.areas); fill("#f-zip", f.zips); fill("#f-ward", f.wards);
}
function syncFilterUI() {
  const f = state.filters;
  $("#f-segment").value = f.segment || ""; $("#f-cuisine").value = f.cuisine || ""; $("#f-area").value = f.area || "";
  $("#f-zip").value = f.zip || ""; $("#f-ward").value = f.ward || ""; $("#f-min").value = f.minScore || 0; $("#f-min-v").textContent = f.minScore || 0;
  $("#f-new").checked = !!f.newOnly; $("#f-patio").checked = !!f.patio; $("#f-excl").checked = !!f.includeExcluded;
  $$("#f-tier .chip").forEach((c) => c.classList.toggle("on", f.tier.includes(c.dataset.v)));
  $("#q").value = f.q || "";
}
function setFilter(k, v) { state.filters[k] = v; state.page = 1; syncFilterUI(); refreshAll(); }

function bindFilters() {
  for (const [id, k] of [["#f-segment", "segment"], ["#f-cuisine", "cuisine"], ["#f-area", "area"], ["#f-zip", "zip"], ["#f-ward", "ward"]]) $(id).addEventListener("change", (e) => setFilter(k, e.target.value));
  $("#f-min").addEventListener("input", (e) => ($("#f-min-v").textContent = e.target.value));
  $("#f-min").addEventListener("change", (e) => setFilter("minScore", Number(e.target.value)));
  $("#f-new").addEventListener("change", (e) => setFilter("newOnly", e.target.checked));
  $("#f-patio").addEventListener("change", (e) => setFilter("patio", e.target.checked));
  $("#f-excl").addEventListener("change", (e) => setFilter("includeExcluded", e.target.checked));
  $$("#f-tier .chip").forEach((c) => c.addEventListener("click", () => {
    const t = state.filters.tier, v = c.dataset.v;
    setFilter("tier", t.includes(v) ? t.filter((x) => x !== v) : [...t, v]);
  }));
  let timer; $("#q").addEventListener("input", (e) => { clearTimeout(timer); timer = setTimeout(() => setFilter("q", e.target.value.trim()), 300); });
  $("#btn-clear").addEventListener("click", () => { state.filters = { tier: [] }; state.page = 1; syncFilterUI(); refreshAll(); });
  $("#btn-export").addEventListener("click", () => (location.href = `/api/export.csv?${params()}`));
  $("#btn-filters").addEventListener("click", () => $("#filters").classList.toggle("show"));
  $("#sort").addEventListener("change", () => { state.page = 1; loadList(); });
  $("#btn-refresh").addEventListener("click", async () => { await api("/api/refresh", { method: "POST" }); $("#data-status").textContent = "Actualizando…"; setTimeout(() => waitForData(), 3000); });
}

// ---------- Resumen ----------
function bars(el, rows, key, onClick) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  el.innerHTML = rows.slice(0, 10).map((r) => `<div class="bar" data-v="${esc(r.name)}"><span class="bar-name" title="${esc(r.name)}">${esc(r.name)}</span><span class="bar-track"><span class="bar-fill a" style="width:${(r.tierA / max) * 100}%"></span><span class="bar-fill" style="width:${((r.count - r.tierA) / max) * 100}%"></span></span><span class="bar-val">${fmt(r.count)}</span></div>`).join("");
  $$(".bar", el).forEach((b) => b.addEventListener("click", () => onClick(b.dataset.v)));
}
async function loadOverview() {
  const s = await api(`/api/stats?${params()}`);
  const sm = s.summary;
  $("#kpis").innerHTML = `
    <div class="kpi"><div class="v">${fmt(sm.totalLicenses)}</div><div class="l">licencias activas analizadas (${fmt(sm.totalBusinesses)} ubicaciones)</div></div>
    <div class="kpi"><div class="v">${fmt(sm.foodBusinesses)}</div><div class="l">negocios de comida · ${fmt(sm.withLiquor)} ya tienen licor (${sm.cityLiquorRate}%)</div></div>
    <div class="kpi hl"><div class="v">${fmt(s.filtered)}</div><div class="l">prospectos en el filtro actual</div></div>
    <div class="kpi"><div class="v" style="color:var(--tierA)">${fmt(s.tiers.A)}</div><div class="l">prioridad alta (A) · ${fmt(s.tiers.B)} media (B)</div></div>`;
  bars($("#ch-segment"), s.bySegment, "segment", (v) => setFilter("segment", v));
  bars($("#ch-cuisine"), s.byCuisine, "cuisine", (v) => setFilter("cuisine", v));
  const areas = s.byArea.slice().sort((a, b) => b.tierA - a.tierA || b.count - a.count).slice(0, 15);
  $("#tbl-areas tbody").innerHTML = areas.map((a) => `<tr data-v="${esc(a.name)}"><td><b>${esc(a.name)}</b></td><td class="num">${fmt(a.count)}</td><td class="num" style="color:var(--tierA);font-weight:700">${fmt(a.tierA)}</td><td class="num">${a.avgScore}</td><td class="num muted">→</td></tr>`).join("");
  $$("#tbl-areas tbody tr").forEach((tr) => tr.addEventListener("click", () => setFilter("area", tr.dataset.v)));
  const top = await api(`/api/prospects?${params({ limit: 10, page: 1 })}`);
  $("#top10").innerHTML = top.items.map((p) => `<div class="topitem" data-id="${esc(p.id)}"><span class="tier tier-${p.tier}">${p.score}</span><div class="t"><b>${esc(p.name)}</b><span class="muted small">${esc(p.cuisine)} · ${esc(p.area)}</span></div></div>`).join("") || '<p class="muted">Sin resultados.</p>';
  $$("#top10 .topitem").forEach((el) => el.addEventListener("click", () => openProspect(el.dataset.id)));
}

// ---------- Lista ----------
async function loadList() {
  const d = await api(`/api/prospects?${params({ page: state.page, limit: state.limit, sort: $("#sort").value })}`);
  state.total = d.total;
  const pipe = store.get();
  $("#count-list").textContent = fmt(d.total);
  $("#list-summary").textContent = `${fmt(d.total)} prospectos encontrados`;
  $("#tbl-list tbody").innerHTML = d.items.map((p) => {
    const st = pipe[p.id]?.status || "";
    return `<tr data-id="${esc(p.id)}"><td><span class="tier tier-${p.tier}">${p.tier}</span></td>
      <td class="biz">${esc(p.name)}<small>${esc(p.address)} · ${esc(p.zip)}</small></td>
      <td class="hide-sm">${esc(p.area)}</td><td class="hide-md">${esc(p.segment)}</td><td class="hide-md">${esc(p.cuisine)}</td>
      <td class="num"><span class="score">${p.score}<span class="meter"><i style="width:${p.score}%"></i></span></span></td>
      <td class="hide-sm"><span class="status st-${st}">${STATUSES.find((s) => s[0] === st)[1]}</span></td></tr>`;
  }).join("") || `<tr><td colspan="7" class="muted" style="padding:30px;text-align:center">Sin resultados con estos filtros.</td></tr>`;
  $$("#tbl-list tbody tr[data-id]").forEach((tr) => tr.addEventListener("click", () => openProspect(tr.dataset.id)));
  const pages = Math.max(1, Math.ceil(d.total / state.limit));
  $("#pageinfo").textContent = `Página ${state.page} de ${fmt(pages)}`;
  $("#prev").disabled = state.page <= 1; $("#next").disabled = state.page >= pages;
}
$("#prev").addEventListener("click", () => { state.page--; loadList(); window.scrollTo(0, 0); });
$("#next").addEventListener("click", () => { state.page++; loadList(); window.scrollTo(0, 0); });

// ---------- Mapa ----------
let map, layer;
async function loadMap() {
  if (!window.L) { $("#map").innerHTML = '<p class="muted" style="padding:20px">No se pudo cargar el mapa.</p>'; return; }
  if (!map) {
    map = L.map("map", { preferCanvas: true }).setView([41.8781, -87.6798], 11);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>", maxZoom: 19 }).addTo(map);
  }
  setTimeout(() => map.invalidateSize(), 50);
  const pts = await api(`/api/map?${params()}`);
  if (layer) layer.remove();
  layer = L.layerGroup(pts.map(([id, lat, lon, score, name, tier]) => {
    const color = tier === "A" ? "#2f7d4f" : tier === "B" ? "#c48a1c" : "#8a8178";
    return L.circleMarker([lat, lon], { radius: tier === "A" ? 7 : 5, color: "#fff", weight: 1, fillColor: color, fillOpacity: .85 })
      .bindTooltip(`${esc(name)} · ${score}`).on("click", () => openProspect(id));
  })).addTo(map);
}

// ---------- Pipeline ----------
function renderPipeline() {
  const pipe = store.get();
  const entries = Object.entries(pipe).filter(([, v]) => v.status);
  $("#count-pipe").textContent = entries.length || "";
  $("#kanban").innerHTML = STATUSES.slice(1).map(([k, label]) => {
    const items = entries.filter(([, v]) => v.status === k);
    return `<div class="kcol"><h4>${label}<span class="muted">${items.length}</span></h4>${items.map(([id, v]) => `<div class="kcard" data-id="${esc(id)}"><b>${esc(v.name || id)}</b><span class="muted small">${esc(v.area || "")}${v.note ? " · 📝" : ""}</span></div>`).join("") || '<p class="muted small">Vacío</p>'}</div>`;
  }).join("");
  $$("#kanban .kcard").forEach((el) => el.addEventListener("click", () => openProspect(el.dataset.id)));
}

// ---------- Marketplace (admin) ----------
const MK_ST = { requested: "Solicitada", accepted: "Aceptada", declined: "Rechazada", completed: "Completada", cancelled: "Cancelada" };
const EX_ST = { pending: "⏳ Pendiente", approved: "✅ Publicado", rejected: "✖ Rechazado", paused: "⏸ Pausado" };
async function loadMarket() {
  const d = await api("/api/mk/admin");
  const s = d.stats, money = (n) => "$" + fmt(n);
  $("#mk-db").textContent = d.db === "postgres" ? "· Base de datos: Postgres" : "· ⚠️ Sin base de datos: los datos se borran al redeploy";
  $("#count-mk").textContent = s.pending || s.open || "";
  $("#mk-kpis").innerHTML = `
    <div class="kpi"><div class="v">${s.experts}</div><div class="l">expertos publicados · ${s.pending} pendientes</div></div>
    <div class="kpi"><div class="v">${s.bookings}</div><div class="l">reservas · ${s.open} abiertas</div></div>
    <div class="kpi hl"><div class="v">${money(s.commission)}</div><div class="l">comisión ganada (${d.feePct}% de ${money(s.gmv)})</div></div>
    <div class="kpi"><div class="v">${s.completed}</div><div class="l">servicios completados · ${s.reviews} reseñas</div></div>`;
  $("#mk-experts tbody").innerHTML = d.experts.map((e) => `<tr>
    <td class="biz">${esc(e.name)}${e.featured ? " 🏅" : ""}<small>${esc(e.email || "")} ${e.phone ? "· " + esc(e.phone) : ""}</small></td>
    <td>${EX_ST[e.status] || e.status}</td><td class="num">${e.rating ? "★ " + e.rating + " (" + e.reviewsCount + ")" : "—"}</td><td class="num">${e.bookings}</td>
    <td><div class="actions">
      ${e.status !== "approved" ? `<button class="btn btn-primary btn-sm" data-ex="${esc(e.id)}" data-a="approve">Aprobar</button>` : `<button class="btn btn-ghost btn-sm" data-ex="${esc(e.id)}" data-a="pause">Pausar</button>`}
      ${e.status === "pending" ? `<button class="btn btn-ghost btn-sm" data-ex="${esc(e.id)}" data-a="reject">Rechazar</button>` : ""}
      <button class="btn btn-ghost btn-sm" data-ex="${esc(e.id)}" data-a="${e.featured ? "unfeature" : "feature"}">${e.featured ? "Quitar destacado" : "Destacar"}</button>
      <a class="btn btn-ghost btn-sm" href="${esc(e.manageLink)}" target="_blank" rel="noopener">Panel del experto ↗</a>
      ${e.status === "approved" ? `<a class="btn btn-ghost btn-sm" href="/experto/${esc(e.slug)}" target="_blank" rel="noopener">Perfil ↗</a>` : ""}
    </div></td></tr>`).join("");
  $$("#mk-experts [data-ex]").forEach((b) => b.addEventListener("click", async () => {
    await api(`/api/mk/admin/expert/${b.dataset.ex}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: b.dataset.a }) });
    loadMarket();
  }));
  $("#mk-bookings tbody").innerHTML = d.bookings.map((b) => `<tr><td>${new Date(b.createdAt).toLocaleDateString("es-MX")}</td>
    <td class="biz">${esc(b.business)}<small>${esc(b.contactName)} · ${esc(b.email)}</small></td><td>${esc(b.expertName)}<br><span class="muted small">${esc(b.serviceName)}</span></td>
    <td><span class="status">${MK_ST[b.status]}</span></td><td class="num">${b.price != null ? money(b.price) : "—"}</td><td class="num">${b.fee != null ? money(b.fee) : "—"}</td></tr>`).join("")
    || `<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">Aún no hay reservas. Comparte tu perfil con prospectos desde su ficha (botón "Invitar a reservar").</td></tr>`;
}

// ---------- Distribuidores ----------
let distMeta = null;
const jpost = (url, method, body) => api(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
function distCard(e, editable = true) {
  const ok = e.status === "verified";
  const conf = { alta: "🟢 alta", media: "🟡 media", baja: "🔴 baja" }[e.confidence] || "";
  return `<div class="card dist-card" data-id="${esc(e.id)}">
    <div class="list-head" style="margin:0"><h3 style="margin:0">${esc(e.brand)} <span class="muted small">· ${esc(e.category)}</span></h3>
      <span class="status ${ok ? "st-cliente" : "st-interesado"}">${ok ? "✅ Verificado" : "⚠️ Sin verificar"}</span></div>
    <dl class="kv" style="margin-top:12px">
      <dt>Distribuidor(es) en IL</dt><dd>${e.distributors.length ? e.distributors.map((d) => `<b>${esc(d.name)}</b>${d.territory ? ` · ${esc(d.territory)}` : ""}${d.notes ? `<br><span class="muted small">${esc(d.notes)}</span>` : ""}`).join("<br>") : '<span class="muted">No identificado</span>'}</dd>
      <dt>Proveedor / dueño</dt><dd>${esc(e.supplier || "—")}</dd>
      ${e.summary ? `<dt>Resumen</dt><dd>${esc(e.summary)}</dd>` : ""}
      ${e.source === "ia" ? `<dt>Confianza IA</dt><dd>${conf} · investigado ${new Date(e.researchedAt).toLocaleDateString("es-MX")}</dd>` : ""}
      ${e.sources.length ? `<dt>Fuentes</dt><dd>${e.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title || s.url)}</a>`).join("<br>")}</dd>` : ""}
      ${e.notes ? `<dt>Mis notas</dt><dd>${esc(e.notes)}</dd>` : ""}
    </dl>
    ${editable ? `<div class="actions" style="margin-top:12px">
      ${ok ? `<button class="btn btn-ghost btn-sm" data-d="unverify">Quitar verificación</button>` : `<button class="btn btn-primary btn-sm" data-d="verify">✅ Confirmar como verificado</button>`}
      <button class="btn btn-ghost btn-sm" data-d="edit">✏️ Editar</button>
      ${distMeta?.ai ? `<button class="btn btn-ghost btn-sm" data-d="reresearch">🔄 Investigar de nuevo</button>` : ""}
      <button class="btn btn-ghost btn-sm" data-d="delete">Eliminar</button></div>` : ""}
  </div>`;
}
function distEditForm(e = {}) {
  const cats = distMeta?.categories || [];
  const ds = e.distributors?.length ? e.distributors : [{}];
  return `<div class="card"><h3>${e.id ? "Editar" : "Agregar"} marca</h3><form id="dist-edit">
    <div class="frow"><div class="fgroup"><label>Marca</label><input name="brand" value="${esc(e.brand || "")}" required class="inp"></div>
    <div class="fgroup"><label>Categoría</label><select name="category">${cats.map((c) => `<option ${c === e.category ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div></div>
    <div class="fgroup"><label>Proveedor / dueño de la marca</label><input name="supplier" value="${esc(e.supplier || "")}" class="inp"></div>
    <div class="fgroup"><label>Distribuidores (uno por línea: nombre | territorio)</label><textarea name="dists" rows="3" class="inp">${esc(ds.filter((d) => d.name).map((d) => `${d.name}${d.territory ? " | " + d.territory : ""}`).join("\n"))}</textarea></div>
    <div class="fgroup"><label>Mis notas (contacto del distribuidor, representante, etc.)</label><textarea name="notes" rows="2" class="inp">${esc(e.notes || "")}</textarea></div>
    <label class="check"><input type="checkbox" name="verify" ${e.status === "verified" || !e.id ? "checked" : ""}> Marcar como verificado</label>
    <div class="actions" style="margin-top:10px"><button class="btn btn-primary btn-sm">Guardar</button><button type="button" class="btn btn-ghost btn-sm" id="dist-cancel">Cancelar</button></div>
  </form></div>`;
}
function bindDistCards(root, onChange) {
  $$(".dist-card [data-d]", root).forEach((b) => b.addEventListener("click", async () => {
    const card = b.closest(".dist-card"), id = card.dataset.id, a = b.dataset.d;
    try {
      if (a === "verify" || a === "unverify") await jpost(`/api/dist/entry/${id}`, "PUT", { verify: a === "verify" });
      else if (a === "delete") { if (!confirm("¿Eliminar esta marca del directorio?")) return; await api(`/api/dist/entry/${id}`, { method: "DELETE" }); }
      else if (a === "reresearch") { const brand = card.querySelector("h3").firstChild.textContent.trim(); $("#dist-status").textContent = "Investigando…"; await jpost("/api/dist/research", "POST", { brand, force: true }); $("#dist-status").textContent = ""; }
      else if (a === "edit") { const all = await api("/api/dist/list"); openDistEdit(all.find((x) => x.id === id)); return; }
      onChange();
    } catch (err) { alert(err.message); }
  }));
}
function openDistEdit(e) {
  $("#dist-results").innerHTML = distEditForm(e || {});
  $("#dist-results").scrollIntoView({ behavior: "smooth" });
  $("#dist-cancel").addEventListener("click", () => ($("#dist-results").innerHTML = ""));
  $("#dist-edit").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const body = { brand: f.brand.value, category: f.category.value, supplier: f.supplier.value, notes: f.notes.value, verify: f.verify.checked,
      distributors: f.dists.value.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((x) => x[0]).map(([name, territory = ""]) => ({ name, territory, notes: "" })) };
    try {
      if (e?.id) await jpost(`/api/dist/entry/${e.id}`, "PUT", body); else await jpost("/api/dist/entry", "POST", body);
      $("#dist-results").innerHTML = ""; loadDist();
    } catch (err) { alert(err.message); }
  });
}
async function loadDist() {
  if (!distMeta) {
    distMeta = await api("/api/dist/meta");
    $("#dist-form").addEventListener("submit", searchDist);
    $("#dist-add").addEventListener("click", () => openDistEdit({ brand: $("#dist-q").value.trim() }));
  }
  if (!distMeta.ai) $("#dist-status").innerHTML = "ℹ️ La investigación con IA se activa al agregar <b>ANTHROPIC_API_KEY</b> en Render. Mientras, busca en tu directorio o agrega marcas manualmente.";
  const all = await api("/api/dist/list");
  $("#dist-all").innerHTML = all.length ? `<div class="table-wrap"><table class="tbl hover"><thead><tr><th>Marca</th><th>Categoría</th><th>Distribuidor(es)</th><th>Estado</th></tr></thead><tbody>${all.map((e) => `<tr data-id="${esc(e.id)}"><td><b>${esc(e.brand)}</b></td><td>${esc(e.category)}</td><td>${esc(e.distributors.map((d) => d.name).join(", ") || "—")}</td><td>${e.status === "verified" ? "✅" : "⚠️"}</td></tr>`).join("")}</tbody></table></div>` : '<p class="muted">Aún no hay marcas. Busca una arriba para empezar.</p>';
  $$("#dist-all tr[data-id]").forEach((tr) => tr.addEventListener("click", () => { const e = all.find((x) => x.id === tr.dataset.id); $("#dist-results").innerHTML = distCard(e); bindDistCards($("#dist-results"), loadDist); $("#dist-results").scrollIntoView({ behavior: "smooth" }); }));
}
async function searchDist(ev) {
  ev.preventDefault();
  const q = $("#dist-q").value.trim();
  if (q.length < 2) return;
  const out = $("#dist-results");
  const local = await api(`/api/dist/list?q=${encodeURIComponent(q)}`);
  if (local.length) {
    out.innerHTML = local.slice(0, 5).map((e) => distCard(e)).join("") + (distMeta.ai ? `<p class="muted small">¿No es lo que buscabas? <button class="link" id="dist-force">Investigar "${esc(q)}" con IA</button></p>` : "");
    bindDistCards(out, loadDist);
    $("#dist-force")?.addEventListener("click", () => runResearch(q));
    return;
  }
  if (!distMeta.ai) { out.innerHTML = `<div class="card"><p style="margin:0">"${esc(q)}" no está en tu directorio.</p><button class="btn btn-primary btn-sm" style="margin-top:10px" id="dist-man">+ Agregarla manualmente</button></div>`; $("#dist-man").addEventListener("click", () => openDistEdit({ brand: q })); return; }
  runResearch(q);
}
async function runResearch(q) {
  const out = $("#dist-results");
  out.innerHTML = `<div class="loading-card show"><div class="spinner"></div><div><b>Investigando "${esc(q)}" en internet…</b><div class="muted">Buscando proveedor y distribuidor actual en Illinois. Puede tardar 20–60 segundos.</div></div></div>`;
  try { const e = await jpost("/api/dist/research", "POST", { brand: q }); out.innerHTML = distCard(e); bindDistCards(out, loadDist); loadDist(); }
  catch (err) { out.innerHTML = `<div class="card"><p style="margin:0">${esc(err.message)}</p></div>`; }
}

// ---------- Red de distribuidores de Illinois (TTB) ----------
let netMap, netLayer, netBound = false, netData = [];
async function loadNetwork() {
  if (!netBound) {
    netBound = true;
    let t; $("#net-q").addEventListener("input", () => { clearTimeout(t); t = setTimeout(renderNetwork, 250); });
  }
  const d = await api("/api/trade/distributors");
  netData = d.items;
  $("#net-meta").textContent = d.permitsAt ? `· ${fmt(d.total)} empresas con permiso federal de mayorista (TTB, ${new Date(d.permitsAt).toLocaleDateString("es-MX")})` : "· descargando datos de la TTB…";
  if (window.L && !netMap) {
    netMap = L.map("net-map", { preferCanvas: true }).setView([41.88, -87.9], 9);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>", maxZoom: 19 }).addTo(netMap);
  }
  setTimeout(() => netMap?.invalidateSize(), 50);
  renderNetwork();
}
function renderNetwork() {
  const q = $("#net-q").value.trim().toLowerCase();
  const list = q ? netData.filter((g) => `${g.company} ${g.owner} ${g.sites.map((s) => s.city).join(" ")} ${g.brands.map((b) => b.brand).join(" ")}`.toLowerCase().includes(q)) : netData;
  if (netMap) {
    netLayer?.remove();
    netLayer = L.layerGroup(list.flatMap((g) => g.sites.filter((s) => s.lat).map((s) => L.circleMarker([s.lat, s.lon], { radius: g.brands.length ? 8 : 5, color: "#fff", weight: 1, fillColor: g.brands.length ? "#7a1f2b" : "#6b4fa0", fillOpacity: .85 })
      .bindPopup(`<b>${esc(g.company)}</b><br>${esc(s.street)}, ${esc(s.city)} ${esc(s.zip)}<br><span style="color:#6b6359">Permiso ${esc(s.permit)}</span>${g.brands.length ? `<br>Marcas: ${g.brands.map((b) => esc(b.brand)).join(", ")}` : ""}`)))).addTo(netMap);
  }
  $("#net-list").innerHTML = `<table class="tbl"><thead><tr><th>Empresa</th><th>Sedes en IL</th><th>Marcas en tu directorio</th><th></th></tr></thead><tbody>${list.slice(0, 150).map((g) => `<tr>
    <td class="biz">${esc(g.company)}${g.owner && g.owner !== g.company ? `<small>${esc(g.owner)}</small>` : ""}</td>
    <td>${g.sites.slice(0, 3).map((s) => esc(s.city)).join(", ")}${g.sites.length > 3 ? ` +${g.sites.length - 3}` : ""}</td>
    <td>${g.brands.map((b) => `${b.status === "verified" ? "✅" : "⚠️"} ${esc(b.brand)}`).join(", ") || '<span class="muted">—</span>'}</td>
    <td><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(g.company + " Illinois distributor contact")}">🔎 Contacto</a></td></tr>`).join("")}</tbody></table>${list.length > 150 ? `<p class="muted small">Mostrando 150 de ${fmt(list.length)}. Usa el filtro para encontrar más.</p>` : ""}`;
}

// ---------- Radar de productos nuevos (TTB COLA) ----------
const radar = { page: 1, group: "", bound: false };
async function loadRadar() {
  if (!radar.bound) {
    radar.bound = true;
    let t; $("#radar-q").addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { radar.page = 1; loadRadar(); }, 300); });
    $("#radar-days").addEventListener("change", () => { radar.page = 1; loadRadar(); });
    $("#radar-imp").addEventListener("change", () => { radar.page = 1; loadRadar(); });
    $("#radar-prev").addEventListener("click", () => { radar.page--; loadRadar(); });
    $("#radar-next").addEventListener("click", () => { radar.page++; loadRadar(); });
  }
  const p = new URLSearchParams({ q: $("#radar-q").value.trim(), days: $("#radar-days").value, imported: $("#radar-imp").checked, group: radar.group, page: radar.page });
  const [d, s] = await Promise.all([api(`/api/trade/products?${p}`), api("/api/trade/status")]);
  $("#radar-meta").innerHTML = s.colaAt ? `Última actualización: <b>${new Date(s.colaAt).toLocaleString("es-MX")}</b>.` : `⏳ ${esc(s.message || "Descargando etiquetas de la TTB… la primera vez tarda unos minutos.")}`;
  const groups = Object.entries(d.counts).sort((a, b) => b[1] - a[1]);
  $("#radar-groups").innerHTML = [["", Object.values(d.counts).reduce((a, b) => a + b, 0)], ...groups].map(([g, n]) => `<button class="chip ${g === radar.group ? "on" : ""}" data-g="${esc(g)}">${esc(g || "Todos")} <span class="muted">${fmt(n)}</span></button>`).join("");
  $$("#radar-groups .chip").forEach((c) => c.addEventListener("click", () => { radar.group = c.dataset.g; radar.page = 1; loadRadar(); }));
  $("#radar-tbl tbody").innerHTML = d.items.map((x) => `<tr data-id="${esc(x.id)}"><td>${esc(x.date)}</td>
    <td class="biz">${esc(x.brand)}<small>${esc(x.fanciful)}</small></td><td class="hide-sm">${esc(x.group)}<br><span class="muted small">${esc(x.classDesc)}</span></td>
    <td class="hide-md">${esc(x.origin)}</td><td class="hide-sm">${x.supplier ? esc(x.supplier) + `<br><span class="muted small">${esc(x.supplierCity)}</span>` : `<span class="muted small">Permiso ${esc(x.permit)}</span>`}</td></tr>`).join("")
    || `<tr><td colspan="5" class="muted" style="text-align:center;padding:24px">${s.colaAt ? "Sin productos con estos filtros." : "Cargando el radar por primera vez…"}</td></tr>`;
  $$("#radar-tbl tbody tr[data-id]").forEach((tr) => tr.addEventListener("click", () => openProduct(tr.dataset.id)));
  const pages = Math.max(1, Math.ceil(d.total / 50));
  $("#radar-page").textContent = `${fmt(d.total)} productos · página ${radar.page} de ${fmt(pages)}`;
  $("#radar-prev").disabled = radar.page <= 1; $("#radar-next").disabled = radar.page >= pages;
}
async function openProduct(id) {
  const d = await api(`/api/trade/product/${encodeURIComponent(id)}`);
  const p = d.product, dir = d.directory, acc = d.accounts;
  const distHtml = dir ? `${dir.distributors.map((x) => `<b>${esc(x.name)}</b>${x.territory ? " · " + esc(x.territory) : ""}`).join("<br>") || "No identificado"}<br><span class="status ${dir.status === "verified" ? "st-cliente" : "st-interesado"}">${dir.status === "verified" ? "✅ Verificado" : "⚠️ Sin verificar"}</span>`
    : `<span class="muted">Aún no sabemos quién la distribuye en Illinois.</span><br><button class="btn btn-primary btn-sm" id="p-research" style="margin-top:8px">🔍 Investigar distribuidor</button>`;
  $("#drawer-body").innerHTML = `
    <div class="d-hero"><button class="close" id="d-close" aria-label="Cerrar">✕</button>
      <span class="pill" style="background:rgba(255,255,255,.15);color:#fff">${esc(p.group)} · ${esc(p.origin)}</span>
      <h2>${esc(p.brand)}</h2><div style="opacity:.85">${esc(p.fanciful)}</div>
      <div style="opacity:.75;margin-top:6px;font-size:13px">Etiqueta aprobada ${esc(p.date)} · ${esc(p.classDesc)}</div></div>
    <div class="d-body">
      <div class="d-section"><h4>Mapa de conexiones</h4>
        <div class="chain">
          <div class="node"><span>🏭 Proveedor / importador</span><b>${esc(p.supplier || "—")}</b><small>${p.supplier ? esc(p.supplierCity) : "Permiso " + esc(p.permit)}</small></div>
          <div class="arrow">↓</div>
          <div class="node"><span>🚚 Distribuidor en Illinois</span><div>${distHtml}</div></div>
          <div class="arrow">↓</div>
          <div class="node"><span>🍽️ Cuentas sugeridas en Chicago</span><b>${fmt(acc.total)} negocios con licencia de licor</b><small>Encajan por tipo: ${esc([...acc.fit.cuisines, ...acc.fit.types].join(", ") || "bares y tiendas")}</small></div>
        </div>
      </div>
      <div class="d-section"><h4>Cuentas para presentar este producto</h4>
        ${acc.items.slice(0, 15).map((a) => `<div class="topitem" style="margin-bottom:6px"><span class="tier tier-B" style="font-size:11px">${a.type.startsWith("Tienda") ? "🛒" : a.type.startsWith("Bar") ? "🍸" : "🍽️"}</span><div class="t"><b>${esc(a.name)}</b><span class="muted small">${esc(a.address)} · ${esc(a.area)} · ${esc(a.cuisine)}</span></div></div>`).join("") || '<p class="muted">Sin cuentas que encajen.</p>'}
        <p class="muted small">Ideas: preséntale estas cuentas al distribuidor o al importador como oportunidad de colocación, o lleva el producto a tus clientes con licencia.</p>
      </div>
      <div class="d-section actions">
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${esc(d.colaUrl)}">📄 Ver etiqueta en TTB</a>
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(`${p.brand} ${p.fanciful} ${p.supplier}`)}">🔎 Buscar en Google</a>
      </div><div class="d-section"><h4>Buscar precio y disponibilidad</h4><div class="small">${shopLinks(`${p.brand} ${p.fanciful}`)} · <a href="https://www.wine-searcher.com/find/${encodeURIComponent(`${p.brand} ${p.fanciful}`)}/1/usa-il" target="_blank" rel="noopener">Wine-Searcher (IL)</a></div>
      </div>
    </div>`;
  $("#d-close").addEventListener("click", closeDrawer);
  $("#p-research")?.addEventListener("click", async () => {
    const b = $("#p-research"); b.disabled = true; b.textContent = "Investigando… (20–60 s)";
    try { await api("/api/dist/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brand: p.brand }) }); openProduct(id); }
    catch (err) { b.disabled = false; b.textContent = "🔍 Investigar distribuidor"; alert(err.message); }
  });
  $("#drawer").classList.add("show"); $("#drawer-bg").classList.add("show"); $("#drawer").scrollTop = 0;
}

// ---------- Catálogo de productos del mercado ----------
const catState = { cat: "liquors", bound: false, mixerTypes: [] };
const CAT_LABEL = { liquors: "licores", wines: "vinos", beers: "cervezas", mixers: "mixers y suministros de bar" };
function shopLinks(name) {
  const q = encodeURIComponent(name);
  return `<a href="https://www.google.com/search?tbm=shop&q=${q}" target="_blank" rel="noopener">Google Shopping</a> · <a href="https://www.webstaurantstore.com/search/${q}.html" target="_blank" rel="noopener">WebstaurantStore</a> · <a href="https://www.amazon.com/s?k=${q}" target="_blank" rel="noopener">Amazon</a>`;
}
function catOwnHtml(own) {
  const isMix = catState.cat === "mixers";
  return `<div class="card"><div class="list-head" style="margin:0 0 10px"><h3 style="margin:0">${isMix ? "Mi catálogo de mixers y suministros" : "Mis productos guardados"}</h3><button class="btn btn-ghost btn-sm" id="cat-add">+ Agregar producto</button></div>
    ${own.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Producto</th><th>Tipo</th><th>Proveedor / distribuidor</th><th class="num">Precio</th><th></th></tr></thead><tbody>${own.map((p) => `<tr>
      <td class="biz">${esc(p.name)}${p.events ? ' <span class="pill">🎉 Eventos</span>' : ""}<small>${esc([p.brand, p.size].filter(Boolean).join(" · "))}${p.notes ? " · " + esc(p.notes) : ""}</small></td><td>${esc(p.type || "—")}</td>
      <td>${esc(p.supplier || "—")}${p.url ? `<br><a class="small" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Ver producto ↗</a>` : ""}</td><td class="num">${esc(p.price || "—")}</td>
      <td><div class="actions"><button class="btn btn-ghost btn-sm" data-ce="${esc(p.id)}">✏️</button><button class="btn btn-ghost btn-sm" data-cd="${esc(p.id)}">✕</button></div></td></tr>`).join("")}</tbody></table></div>`
      : `<p class="muted" style="margin:0">${isMix ? "Aún no hay productos. Agrega los mixers, jarabes, cristalería y herramientas que vendes o recomiendas." : "Guarda aquí productos que vendes o recomiendas, con su proveedor y precio."}</p>`}
    <div id="cat-edit"></div></div>`;
}
function catEditForm(p = {}) {
  const isMix = catState.cat === "mixers";
  return `<form id="cat-edit-form" style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px">
    <div class="frow"><div class="fgroup"><label>Producto</label><input name="name" class="inp" required value="${esc(p.name || "")}"></div><div class="fgroup"><label>Marca</label><input name="brand" class="inp" value="${esc(p.brand || "")}"></div></div>
    <div class="frow"><div class="fgroup"><label>Tipo</label>${isMix ? `<select name="type" class="inp">${catState.mixerTypes.map((t) => `<option ${t === p.type ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>` : `<input name="type" class="inp" value="${esc(p.type || "")}">`}</div><div class="fgroup"><label>Tamaño / presentación</label><input name="size" class="inp" value="${esc(p.size || "")}" placeholder="Ej.: 750 ml, caja de 24"></div></div>
    <div class="frow"><div class="fgroup"><label>Proveedor / distribuidor</label><input name="supplier" class="inp" value="${esc(p.supplier || "")}"></div><div class="fgroup"><label>Precio</label><input name="price" class="inp" value="${esc(p.price || "")}" placeholder="Ej.: $12.50"></div></div>
    <div class="fgroup"><label>Enlace (https)</label><input name="url" class="inp" value="${esc(p.url || "")}"></div>
    <div class="fgroup"><label>Notas</label><input name="notes" class="inp" value="${esc(p.notes || "")}"></div>
    <label class="check"><input type="checkbox" name="events" ${p.events ? "checked" : ""}> 🎉 Ofrecer este producto en eventos (aparece en /eventos con su precio)</label>
    <div class="actions"><button class="btn btn-primary btn-sm">Guardar</button><button type="button" class="btn btn-ghost btn-sm" id="cat-cancel">Cancelar</button></div></form>`;
}
async function loadCatalog(ev) {
  ev?.preventDefault?.();
  if (!catState.bound) {
    catState.bound = true;
    catState.mixerTypes = (await api("/api/trade/catalog/meta")).mixerTypes;
    $("#cat-form").addEventListener("submit", loadCatalog);
    $$("#cat-tabs .chip").forEach((c) => c.addEventListener("click", () => { catState.cat = c.dataset.c; $$("#cat-tabs .chip").forEach((x) => x.classList.toggle("on", x === c)); loadCatalog(); }));
  }
  const q = $("#cat-q").value.trim(), isMix = catState.cat === "mixers";
  $("#cat-status").textContent = q.length >= 2 && !isMix ? "Buscando en el registro de la TTB…" : "";
  let d;
  try { d = await api(`/api/trade/catalog/search?cat=${catState.cat}&q=${encodeURIComponent(q)}`); }
  catch (err) { $("#cat-status").textContent = err.message; return; }
  $("#cat-own").innerHTML = catOwnHtml(d.own);
  $("#cat-add").addEventListener("click", () => openCatEdit({}));
  $$("#cat-own [data-ce]").forEach((b) => b.addEventListener("click", () => openCatEdit(d.own.find((p) => p.id === b.dataset.ce))));
  $$("#cat-own [data-cd]").forEach((b) => b.addEventListener("click", async () => { if (!confirm("¿Eliminar este producto del catálogo?")) return; await api(`/api/trade/catalog/${b.dataset.cd}`, { method: "DELETE" }); loadCatalog(); }));
  const tbl = $("#cat-tbl").closest(".card");
  if (isMix) {
    tbl.style.display = q ? "" : "none";
    $("#cat-tbl tbody").innerHTML = q ? `<tr><td colspan="5" style="padding:16px">Buscar "<b>${esc(q)}</b>" en proveedores: ${shopLinks(q)}</td></tr>` : "";
    $("#cat-status").textContent = q ? "" : "Los mixers y suministros no tienen registro público: arma aquí tu catálogo y busca precios en proveedores.";
    return;
  }
  tbl.style.display = "";
  $("#cat-status").innerHTML = d.source === "ttb" ? `${fmt(d.items.length)} ${CAT_LABEL[catState.cat]} encontrados en la TTB${d.totalAll > d.items.length ? ` (de ${fmt(d.totalAll)} productos con ese nombre en todas las categorías)` : ""}. Clic en uno para ver distribuidor y cuentas.` : `Mostrando los ${CAT_LABEL[catState.cat]} más recientes del radar. Escribe una marca para buscar en todo el registro.`;
  $("#cat-tbl tbody").innerHTML = d.items.map((x) => `<tr data-id="${esc(x.id)}"><td class="biz">${esc(x.brand)}<small>${esc(x.fanciful)}</small></td>
    <td class="hide-sm">${esc(x.group)}<br><span class="muted small">${esc(x.classDesc)}</span></td><td class="hide-md">${esc(x.origin)}</td>
    <td class="hide-sm">${x.supplier ? esc(x.supplier) : `<span class="muted small">Permiso ${esc(x.permit)}</span>`}</td><td>${esc(x.date)}</td></tr>`).join("")
    || `<tr><td colspan="5" class="muted" style="text-align:center;padding:24px">Sin resultados. Prueba con otra marca o revisa la ortografía.</td></tr>`;
  $$("#cat-tbl tbody tr[data-id]").forEach((tr) => tr.addEventListener("click", () => openProduct(tr.dataset.id)));
}
function openCatEdit(p) {
  $("#cat-edit").innerHTML = catEditForm(p);
  $("#cat-cancel").addEventListener("click", () => ($("#cat-edit").innerHTML = ""));
  $("#cat-edit-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const body = { ...Object.fromEntries(new FormData(ev.target)), cat: catState.cat, id: p.id, events: ev.target.events.checked };
    try { await api("/api/trade/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); loadCatalog(); }
    catch (err) { alert(err.message); }
  });
}

// ---------- Eventos ----------
const EV_ST = { new: "🆕 Nueva", proposal: "📨 Propuesta enviada", accepted: "✅ Aceptada", declined: "✖ Rechazada", completed: "🎉 Completada", cancelled: "Cancelada" };
const EV_CAT = { liquors: "Licores", wines: "Vinos", beers: "Cervezas", mixers: "Mixers y suministros de bar" };
let evData = null, pkBound = false;
async function loadEvents() {
  evData = await api("/api/ev/admin");
  const r = evData.requests, n = (st) => r.filter((x) => x.status === st).length;
  $("#count-ev").textContent = n("new") || "";
  $("#ev-kpis").innerHTML = `
    <div class="kpi hl"><div class="v">${n("new")}</div><div class="l">solicitudes nuevas</div></div>
    <div class="kpi"><div class="v">${n("proposal")}</div><div class="l">propuestas esperando respuesta</div></div>
    <div class="kpi"><div class="v">${n("accepted")}</div><div class="l">eventos confirmados</div></div>
    <div class="kpi"><div class="v">${r.reduce((a, x) => a + (["accepted", "completed"].includes(x.status) ? x.guests : 0), 0).toLocaleString("en-US")}</div><div class="l">invitados en eventos confirmados</div></div>`;
  $("#ev-tbl tbody").innerHTML = r.map((e) => `<tr data-ev="${esc(e.id)}"><td>${esc(e.date || "Por definir")}</td>
    <td class="biz">${esc(e.name)}<small>${esc(e.email)}${e.phone ? " · " + esc(e.phone) : ""}</small></td>
    <td class="hide-sm">${esc(e.eventType)}<br><span class="muted small">${e.guests} invitados · ${e.hours} h</span></td>
    <td class="hide-md">${esc(e.packageName || "A la medida")}${e.products.length ? `<br><span class="muted small">${e.products.length} productos</span>` : ""}</td>
    <td><span class="status">${EV_ST[e.status]}</span></td></tr>`).join("")
    || `<tr><td colspan="5" class="muted" style="text-align:center;padding:24px">Aún no hay solicitudes. Comparte tu página <a href="/eventos" target="_blank" rel="noopener">/eventos</a> con tus clientes.</td></tr>`;
  $$("#ev-tbl tr[data-ev]").forEach((tr) => { tr.tabIndex = 0; tr.addEventListener("click", () => openEvent(tr.dataset.ev)); tr.addEventListener("keydown", (k) => { if (k.key === "Enter") openEvent(tr.dataset.ev); }); });
  renderPackages(evData.packages);
}
function pkRow(p = {}) {
  return `<div class="svc pk-row"><div class="frow"><div class="fgroup"><label>Nombre</label><input class="inp" data-k="name" value="${esc(p.name || "")}" maxlength="60"></div>
    <div class="fgroup"><label>Precio por persona (USD, opcional)</label><input class="inp" data-k="pricePerPerson" type="number" min="0" value="${p.pricePerPerson ?? ""}"></div></div>
    <input type="hidden" data-k="id" value="${esc(p.id || "")}">
    <div class="fgroup"><label>Incluye (uno por línea)</label><textarea class="inp" data-k="includes" rows="4">${esc((p.includes || []).join("\n"))}</textarea></div>
    <button type="button" class="link" data-pk-del>Quitar paquete</button></div>`;
}
function renderPackages(list) {
  $("#pk-list").innerHTML = list.map(pkRow).join("");
  $$("#pk-list [data-pk-del]").forEach((b) => b.addEventListener("click", () => b.closest(".pk-row").remove()));
  if (pkBound) return;
  pkBound = true;
  $("#pk-add").addEventListener("click", () => { $("#pk-list").insertAdjacentHTML("beforeend", pkRow({})); const last = $$("#pk-list .pk-row").pop(); last.querySelector("[data-pk-del]").addEventListener("click", () => last.remove()); });
  $("#pk-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const items = $$("#pk-list .pk-row").map((row) => Object.fromEntries([...row.querySelectorAll("[data-k]")].map((i) => [i.dataset.k, i.dataset.k === "includes" ? i.value.split("\n") : i.value])));
    try { const r = await api("/api/ev/admin/packages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) }); renderPackages(r.items); $("#pk-msg").textContent = "Paquetes guardados ✓"; }
    catch (err) { $("#pk-msg").textContent = err.message; }
  });
}
function openEvent(id) {
  const e = evData.requests.find((x) => x.id === id);
  if (!e) return;
  const link = location.origin + e.link, p = e.proposal || {};
  $("#drawer-body").innerHTML = `
    <div class="d-hero"><button class="close" id="d-close" aria-label="Cerrar">✕</button>
      <span class="pill" style="background:rgba(255,255,255,.15);color:#fff">${esc(EV_ST[e.status])}</span>
      <h2>${esc(e.eventType)} · ${e.guests} invitados</h2><div style="opacity:.85">${esc(e.date || "Fecha por definir")}${e.startTime ? " · " + esc(e.startTime) : ""} · ${e.hours} h</div></div>
    <div class="d-body">
      <div class="d-section"><h4>Cliente</h4><dl class="kv"><dt>Nombre</dt><dd>${esc(e.name)}${e.company ? " · " + esc(e.company) : ""}</dd>
        <dt>Correo</dt><dd><a href="mailto:${esc(e.email)}">${esc(e.email)}</a></dd>${e.phone ? `<dt>Teléfono</dt><dd><a href="tel:${esc(e.phone)}">${esc(e.phone)}</a></dd>` : ""}</dl></div>
      <div class="d-section"><h4>Evento</h4><dl class="kv"><dt>Servicio</dt><dd>${esc(e.serviceLevel)}</dd><dt>Lugar</dt><dd>${esc(e.venue || "—")}</dd><dt>Presupuesto</dt><dd>${esc(e.budget || "—")}</dd>
        <dt>Paquete</dt><dd>${esc(e.packageName || "A la medida")}</dd>${e.estimate ? `<dt>Estimación</dt><dd>${e.estimate.drinks} bebidas · ${e.estimate.beer} cervezas · ${e.estimate.wine} vinos · ${e.estimate.spirits} licores</dd>` : ""}
        ${e.message ? `<dt>Detalles</dt><dd style="white-space:pre-line">${esc(e.message)}</dd>` : ""}</dl>
        ${e.products.length ? `<ul class="reasons" style="margin-top:10px">${e.products.map((x) => `<li>${x.qty} × ${esc(x.name)} <span class="muted small">${esc(EV_CAT[x.cat] || x.cat)}${x.price ? " · " + esc(x.price) : ""}</span></li>`).join("")}</ul>` : ""}</div>
      <div class="d-section"><h4>Propuesta para el cliente</h4>
        <form id="ev-prop">
          <div class="fgroup"><label>Precio total</label><input class="inp" name="total" value="${esc(p.total || "")}" placeholder="Ej.: $4,800 (impuestos incluidos)"></div>
          <div class="fgroup"><label>Detalle (qué incluye, condiciones, anticipo)</label><textarea class="inp" name="message" rows="6">${esc(p.message || "")}</textarea></div>
          <div class="fgroup"><label>Válida hasta</label><input class="inp" type="date" name="validUntil" value="${esc(p.validUntil || "")}"></div>
          <button class="btn btn-primary btn-sm">${p.sentAt ? "Actualizar y reenviar propuesta" : "📨 Enviar propuesta"}</button>
        </form>
        <p class="muted small">El cliente la ve en su enlace privado y puede aceptarla o rechazarla. Avísale por WhatsApp o correo:</p>
        <div class="actions"><button class="btn btn-ghost btn-sm" id="ev-copy" type="button">🔗 Copiar enlace del cliente</button>
          ${e.phone ? `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/${esc(e.phone.replace(/[^\d]/g, ""))}?text=${encodeURIComponent((EN() ? `Hi ${e.name}, your event proposal from Alex Solutions is ready: ` : `Hola ${e.name}, tu propuesta de evento de Alex Solutions está lista: `) + link)}">💬 WhatsApp</a>` : ""}
          <a class="btn btn-ghost btn-sm" href="mailto:${esc(e.email)}?subject=${encodeURIComponent(EN() ? "Your event proposal — Alex Solutions" : "Tu propuesta de evento — Alex Solutions")}&body=${encodeURIComponent(link)}">✉️ Correo</a></div>
      </div>
      <div class="d-section"><h4>Estado y notas internas</h4>
        <select class="inp" id="ev-status">${Object.entries(EV_ST).map(([k, l]) => `<option value="${k}" ${k === e.status ? "selected" : ""}>${l}</option>`).join("")}</select>
        <textarea class="inp" id="ev-notes" rows="3" style="margin-top:8px" placeholder="Notas internas (el cliente no las ve)">${esc(e.adminNotes || "")}</textarea>
        <button class="btn btn-ghost btn-sm" id="ev-save" type="button" style="margin-top:8px">Guardar</button>
      </div>
    </div>`;
  $("#d-close").addEventListener("click", closeDrawer);
  $("#ev-copy").addEventListener("click", () => navigator.clipboard?.writeText(link).then(() => ($("#ev-copy").textContent = "¡Enlace copiado!")));
  const put = async (body) => { await api(`/api/ev/admin/request/${e.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); await loadEvents(); openEvent(id); };
  $("#ev-prop").addEventListener("submit", async (ev) => { ev.preventDefault(); try { await put({ proposal: Object.fromEntries(new FormData(ev.target)) }); } catch (err) { alert(err.message); } });
  $("#ev-save").addEventListener("click", async () => { try { await put({ status: $("#ev-status").value, adminNotes: $("#ev-notes").value }); } catch (err) { alert(err.message); } });
  $("#drawer").classList.add("show"); $("#drawer-bg").classList.add("show"); $("#drawer").scrollTop = 0;
}

// ---------- Ficha ----------
function inviteLink(p) {
  const q = new URLSearchParams({ negocio: p.name, direccion: `${p.address}, Chicago ${p.zip}`, p: p.id });
  return `${location.origin}/experto/alex-zavala?${q}`;
}
const EN = () => window.I18N?.lang === "en";
const tt = (s) => (window.I18N ? I18N.t(s) : s);
function layoutPitch(p) {
  if (EN()) {
    if (p.segment === "Tienda / Grocery") return "With Package Goods: store floor plan, power wall, coolers in the back and a price ladder for wine and spirits.";
    if (p.segment === "Restaurante con comedor") return "Bar and back-bar design, visible drink menu and premium bottle display.";
    if (p.segment === "Café y bebidas") return "Wine and craft beer display by the counter and a pairing menu.";
    return "Bottle display, coolers and impulse buys at checkout.";
  }
  if (p.segment === "Tienda / Grocery") return "Con Package Goods: plano de tienda, muro de poder, refrigerados al fondo y escalera de precios para vinos y licores.";
  if (p.segment === "Restaurante con comedor") return "Diseño de barra y contrabarra, carta de bebidas visible y exhibición de botellas premium.";
  if (p.segment === "Café y bebidas") return "Exhibición de vino y cerveza artesanal junto al mostrador y menú de maridajes.";
  return "Exhibición de botellas, refrigeradores y compras de impulso en caja.";
}
function callScript(p) {
  if (EN()) return `Hi, am I speaking with the owner or manager of ${p.name}?
My name is Alex Zavala. I help restaurants here in ${p.area} get their liquor license from the City of Chicago.
I noticed ${p.name} doesn't have a license to serve alcohol yet${p.licenses.includes("Outdoor Patio") ? ", and you already have an outdoor patio — that's the perfect combination" : ""}.
Many ${p.cuisine !== "Otra / Sin identificar" ? tt(p.cuisine) : "food"} businesses raise their average check by offering beer, wine or cocktails.
I handle the entire process (${tt(p.recommended)}): documents, zoning, insurance, BASSET and inspections.
And with Alex Solutions I can also help you set up ${p.segment === "Tienda / Grocery" ? "the store" : "the bar"} so drinks sell themselves.
Could I stop by this week for 15 minutes to give you a free assessment?`;
  return `Hola, ¿hablo con el dueño o gerente de ${p.name}?
Mi nombre es Alex Zavala. Ayudo a restaurantes aquí en ${p.area} a obtener su licencia de licor con la Ciudad de Chicago.
Vi que ${p.name} todavía no tiene licencia para servir alcohol${p.licenses.includes("Outdoor Patio") ? ", y que ya tienen patio exterior — es la combinación perfecta" : ""}.
Muchos negocios de ${p.cuisine !== "Otra / Sin identificar" ? "cocina " + p.cuisine.toLowerCase() : "comida"} aumentan su ticket promedio al ofrecer cerveza, vino o cocteles.
Yo me encargo de todo el trámite (${p.recommended}): documentos, zonificación, seguro, BASSET e inspecciones.
Y con Alex Solutions también le ayudo a acomodar ${p.segment === "Tienda / Grocery" ? "la tienda" : "la barra"} para que las bebidas se vendan solas.
¿Le parece si paso esta semana 15 minutos para hacerle un diagnóstico gratis?`;
}
async function openProspect(id) {
  const p = await api(`/api/prospect/${encodeURIComponent(id)}`);
  const pipe = store.get(), mine = pipe[id] || {};
  const qAddr = encodeURIComponent(`${p.address}, Chicago, IL ${p.zip}`);
  const qName = encodeURIComponent(`${p.name} ${p.address} Chicago`);
  $("#drawer-body").innerHTML = `
    <div class="d-hero"><button class="close" id="d-close" aria-label="Cerrar">✕</button>
      <span class="pill" style="background:rgba(255,255,255,.15);color:#fff">${esc(p.segment)} · ${esc(p.cuisine)}</span>
      <h2>${esc(p.name)}</h2><div style="opacity:.85">${esc(p.address)}, Chicago ${esc(p.zip)} · ${esc(p.area)}</div>
      <div style="display:flex;align-items:end;gap:12px;margin-top:12px"><span class="big">${p.score}</span><span style="padding-bottom:10px">puntaje · prioridad <b>${p.tier === "A" ? "alta" : p.tier === "B" ? "media" : "baja"}</b></span></div>
    </div>
    <div class="d-body">
      <div class="d-section actions">
        <a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${qAddr}">📍 Google Maps</a>
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.google.com/search?q=${qName}">🔎 Buscar teléfono</a>
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.yelp.com/search?find_desc=${encodeURIComponent(p.name)}&find_loc=${qAddr}">⭐ Yelp</a>
      </div>
      <div class="d-section"><h4>¿Por qué es buen prospecto?</h4><ul class="reasons">${p.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>
      <div class="d-section"><h4>Servicios para ofrecer</h4>
        <div class="svc"><b>1 · Licencia de licor</b><span>${esc(p.recommended)}</span></div>
        <div class="svc"><b>2 · Layout y merchandising</b><span>${esc(layoutPitch(p))}</span> <a href="/asesoria-layout" target="_blank" rel="noopener">Ver guía →</a></div>
      </div>
      <div class="d-section"><h4>Datos de la ciudad</h4><dl class="kv">
        <dt>Razón social</dt><dd>${esc(p.legal)}</dd>
        <dt>Licencias actuales</dt><dd>${p.licenses.map(esc).join(", ")}</dd>
        ${p.activities.length ? `<dt>Actividades</dt><dd>${p.activities.map(esc).join("; ")}</dd>` : ""}
        <dt>Ward / ZIP</dt><dd>${esc(p.ward)} / ${esc(p.zip)}</dd>
        ${p.facility ? `<dt>Tipo (inspección)</dt><dd>${esc(p.facility)} ${p.risk ? "· " + esc(p.risk) : ""}</dd>` : ""}
        ${p.lastInspection ? `<dt>Última inspección</dt><dd>${esc(p.lastInspection)} · ${esc(p.lastResult)}</dd>` : ""}
        ${p.since ? `<dt>Licencia desde</dt><dd>${esc(p.since)}</dd>` : ""}
        <dt>Vence</dt><dd>${esc(p.expires)}</dd>
        <dt>Licor en la zona</dt><dd>${p.areaLiquorRate}% de restaurantes de ${esc(p.area)} tienen licencia</dd>
        <dt>No. licencia</dt><dd>${esc(p.licenseNumber)}</dd>
      </dl></div>
      <div class="d-section"><h4>Mi pipeline</h4>
        <select id="d-status">${STATUSES.map(([k, l]) => `<option value="${k}" ${k === (mine.status || "") ? "selected" : ""}>${l}</option>`).join("")}</select>
        <textarea id="d-note" rows="3" placeholder="Notas: teléfono, con quién hablaste, próxima cita…" style="margin-top:8px">${esc(mine.note || "")}</textarea>
      </div>
      <div class="d-section"><h4>Invitar a reservar en el marketplace</h4>
        <p class="muted small" style="margin:0 0 8px">Envía este enlace por WhatsApp o correo: abre tu perfil con el nombre y la dirección del negocio ya llenos.</p>
        <div class="actions"><button class="btn btn-primary btn-sm" id="d-invite">🔗 Copiar enlace de reserva</button>
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(EN() ? `Hi, this is Alex Zavala. I help ${p.name} get its liquor license. Book an assessment here: ${inviteLink(p)}` : `Hola, soy Alex Zavala. Le ayudo a ${p.name} a obtener su licencia de licor. Reserve un diagnóstico aquí: ${inviteLink(p)}`)}">💬 Enviar por WhatsApp</a></div>
      </div>
      <div class="d-section"><h4>Guion de llamada sugerido</h4><div class="script">${esc(callScript(p))}</div>
        <button class="btn btn-ghost btn-sm" id="d-copy" style="margin-top:8px">Copiar guion</button></div>
      ${p.nearby.length ? `<div class="d-section"><h4>Otros prospectos cerca (ruta de visita)</h4>${p.nearby.map((n) => `<div class="topitem" data-id="${esc(n.id)}" style="margin-bottom:6px"><span class="tier tier-${n.tier}">${n.score}</span><div class="t"><b>${esc(n.name)}</b><span class="muted small">${esc(n.address)}</span></div></div>`).join("")}</div>` : ""}
    </div>`;
  const save = () => {
    const all = store.get();
    all[id] = { status: $("#d-status").value, note: $("#d-note").value, name: p.name, area: p.area, updated: Date.now() };
    if (!all[id].status && !all[id].note) delete all[id];
    store.set(all); renderPipeline();
  };
  $("#d-status").addEventListener("change", () => { save(); if (state.tab === "list") loadList(); });
  $("#d-note").addEventListener("input", save);
  $("#d-copy").addEventListener("click", () => navigator.clipboard?.writeText(callScript(p)).then(() => ($("#d-copy").textContent = "¡Copiado!")));
  $("#d-close").addEventListener("click", closeDrawer);
  $("#d-invite").addEventListener("click", () => navigator.clipboard?.writeText(inviteLink(p)).then(() => ($("#d-invite").textContent = "¡Enlace copiado!")));
  $$("#drawer-body .topitem").forEach((el) => el.addEventListener("click", () => openProspect(el.dataset.id)));
  $("#drawer").classList.add("show"); $("#drawer-bg").classList.add("show"); $("#drawer").scrollTop = 0;
}
function closeDrawer() { $("#drawer").classList.remove("show"); $("#drawer-bg").classList.remove("show"); }
$("#drawer-bg").addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

// ---------- Tabs ----------
$$(".tab").forEach((t) => t.addEventListener("click", () => {
  state.tab = t.dataset.tab;
  $$(".tab").forEach((x) => x.classList.toggle("active", x === t));
  $$(".tabpane").forEach((p) => p.classList.toggle("active", p.id === `tab-${state.tab}`));
  refreshTab();
}));
function refreshTab() {
  const run = { overview: loadOverview, list: loadList, map: loadMap, pipeline: async () => renderPipeline(), market: loadMarket, dist: async () => { await loadDist(); await loadNetwork(); }, radar: loadRadar, catalog: loadCatalog, events: loadEvents }[state.tab];
  run().then(hideError).catch((e) => { if (e.message === "loading") { $("#loading").classList.add("show"); waitForData().then(() => refreshTab()); return; } console.error(e); showError(); });
}
// Mensaje de error visible con opción de reintentar
function showError(msg = "Hubo un problema al cargar los datos. Revisa tu conexión e intenta de nuevo.") {
  let el = $("#app-error");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-error"; el.className = "app-error"; el.setAttribute("role", "alert");
    $(".main").prepend(el);
  }
  el.innerHTML = `<span>⚠️ ${esc(msg)}</span><button class="btn btn-ghost btn-sm" type="button">Reintentar</button>`;
  el.querySelector("button").addEventListener("click", () => { hideError(); refreshTab(); });
}
function hideError() { $("#app-error")?.remove(); }
// Teclado: las filas y tarjetas clicables se pueden enfocar con Tab y abrir con Enter
const CLICKABLE = "tr[data-id], .topitem[data-id], .kcard[data-id], .bar[data-v], #tbl-areas tr[data-v]";
new MutationObserver(() => $$(CLICKABLE).forEach((el) => { if (!el.hasAttribute("tabindex")) { el.tabIndex = 0; el.setAttribute("role", "button"); } })).observe(document.body, { childList: true, subtree: true });
document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches?.(CLICKABLE)) { e.preventDefault(); e.target.click(); } });
function refreshAll() {
  refreshTab();
  if (state.tab !== "list") api(`/api/prospects?${params({ limit: 1 })}`).then((d) => ($("#count-list").textContent = fmt(d.total))).catch(() => {});
}

// ---------- Asistente ----------
const chat = [];
function md(text) {
  let h = esc(text).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<i>$2</i>").replace(/_(.+?)_/g, "<i>$1</i>").replace(/`(.+?)`/g, "<code>$1</code>").replace(/\[([^\]]+)\]\((\/[\w\-\/#]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lines = h.split("\n"); let out = "", list = null;
  for (const l of lines) {
    const ol = l.match(/^\s*\d+\.\s+(.*)/), ul = l.match(/^\s*[-•]\s+(.*)/);
    if (ol || ul) { const t = ol ? "ol" : "ul"; if (list !== t) { if (list) out += `</${list}>`; out += `<${t}>`; list = t; } out += `<li>${(ol || ul)[1]}</li>`; }
    else { if (list) { out += `</${list}>`; list = null; } out += l.replace(/^#+\s*/, "") + "<br>"; }
  }
  if (list) out += `</${list}>`;
  return out.replace(/(<br>)+$/, "");
}
function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role === "user" ? "user" : "bot"}`;
  div.innerHTML = role === "user" ? esc(text) : md(text);
  $("#ai-msgs").appendChild(div); $("#ai-msgs").scrollTop = 1e9;
  return div;
}
async function send(text) {
  if (!text.trim()) return;
  $("#ai-suggest")?.remove();
  addMsg("user", text); chat.push({ role: "user", content: text });
  const t = addMsg("bot", "Pensando…"); t.classList.add("typing");
  try {
    const d = await api("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: chat, lang: window.I18N?.lang || "es" }) });
    t.classList.remove("typing"); t.innerHTML = md(d.answer); chat.push({ role: "assistant", content: d.answer });
  } catch (e) { t.textContent = e.message === "loading" ? "Los datos aún se están cargando, intenta en un momento." : "Error al contactar al asistente."; }
  $("#ai-msgs").scrollTop = 1e9;
}
$("#ai-fab").addEventListener("click", () => { $("#ai-panel").classList.add("show"); $("#ai-fab").style.display = "none"; $("#ai-text").focus(); });
$("#ai-close").addEventListener("click", () => { $("#ai-panel").classList.remove("show"); $("#ai-fab").style.display = ""; });
$("#ai-form").addEventListener("submit", (e) => { e.preventDefault(); const v = $("#ai-text").value; $("#ai-text").value = ""; send(v); });
$$("#ai-suggest button").forEach((b) => b.addEventListener("click", () => send(b.textContent)));

// ---------- Inicio ----------
(async function init() {
  bindFilters(); renderPipeline();
  try {
    await waitForData();
    await loadFacets();
    refreshAll();
  } catch (e) { if (e.message !== "auth") { console.error(e); showError(); } }
})();
