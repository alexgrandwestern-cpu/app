// Utilidades compartidas del marketplace
window.MK = (() => {
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const money = (n) => "$" + Number(n).toLocaleString("en-US");
  const initials = (n = "") => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const stars = (r, n) => (r ? `★ ${r.toFixed(2)} <span style="color:var(--muted);font-weight:400">(${n})</span>` : `<span style="color:var(--muted);font-weight:500">Nuevo</span>`);
  const priceTxt = (s) => (s.unit === "cotizar" || s.price == null ? "Cotización gratis" : `${s.unit === "desde" ? "Desde " : ""}${money(s.price)}`);
  const CAT_ICON = { "Licencia de licor": "🍷", "Layout y merchandising": "🗺️", "Capacitación BASSET": "🎓", "Permisos y zonificación": "🏛️", "Seguro / dram shop": "🛡️", Otro: "✨" };
  const STATUS = { requested: "Solicitada", accepted: "Aceptada", declined: "Rechazada", completed: "Completada", cancelled: "Cancelada" };
  async function api(path, opts = {}) {
    const r = await fetch(path, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
    return d;
  }
  const date = (s) => (s ? new Date(s).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "");
  const nav = `<header class="nav"><div class="container"><a href="/" class="logo"><span class="logo-mark">🍷</span> Alex Solutions <span style="color:var(--muted);font-weight:500">Expertos</span></a>
    <nav class="nav-links"><a href="/eventos">Eventos</a><a href="/expertos">Buscar expertos</a><a href="/unete">Ofrece tus servicios</a><a href="/contacto">Contacto</a><a href="/login" class="btn btn-ghost btn-sm">Entrar</a></nav></div></header>`;
  const footer = `<footer class="site"><div class="container"><span>© ${new Date().getFullYear()} <b>Alex Solutions, Inc</b> · Marketplace de expertos en licencias de licor y layout · Chicago</span><span><a href="/">Inicio</a> · <a href="/asesoria-layout">Guía de layout</a> · <a href="/contacto">Contacto</a> · <a href="/privacidad">Privacidad</a> · <a href="/terminos">Términos</a></span></div></footer>`;
  function chrome() {
    document.body.insertAdjacentHTML("afterbegin", nav);
    document.body.insertAdjacentHTML("beforeend", footer);
  }
  return { esc, money, initials, stars, priceTxt, CAT_ICON, STATUS, api, date, chrome };
})();
