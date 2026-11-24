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
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
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
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { attribution: "© OpenStreetMap · © CARTO", maxZoom: 19 }).addTo(map);
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

// ---------- Ficha ----------
function callScript(p) {
  return `Hola, ¿hablo con el dueño o gerente de ${p.name}?
Mi nombre es Alex Zavala. Ayudo a restaurantes aquí en ${p.area} a obtener su licencia de licor con la Ciudad de Chicago.
Vi que ${p.name} todavía no tiene licencia para servir alcohol${p.licenses.includes("Outdoor Patio") ? ", y que ya tienen patio exterior — es la combinación perfecta" : ""}.
Muchos negocios de ${p.cuisine !== "Otra / Sin identificar" ? "cocina " + p.cuisine.toLowerCase() : "comida"} aumentan su ticket promedio al ofrecer cerveza, vino o cocteles.
Yo me encargo de todo el trámite (${p.recommended}): documentos, zonificación, seguro, BASSET e inspecciones.
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
      <div class="d-section"><h4>Licencia recomendada</h4><div><b>${esc(p.recommended)}</b></div></div>
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
  const run = { overview: loadOverview, list: loadList, map: loadMap, pipeline: async () => renderPipeline() }[state.tab];
  run().catch((e) => console.error(e));
}
function refreshAll() {
  refreshTab();
  if (state.tab !== "list") api(`/api/prospects?${params({ limit: 1 })}`).then((d) => ($("#count-list").textContent = fmt(d.total))).catch(() => {});
}

// ---------- Asistente ----------
const chat = [];
function md(text) {
  let h = esc(text).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<i>$2</i>").replace(/_(.+?)_/g, "<i>$1</i>").replace(/`(.+?)`/g, "<code>$1</code>");
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
    const d = await api("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: chat }) });
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
  await waitForData();
  await loadFacets();
  refreshAll();
})();
