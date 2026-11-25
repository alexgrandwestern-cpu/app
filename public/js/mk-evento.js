// Seguimiento de la solicitud de evento por parte del cliente (enlace privado).
(() => {
  const { esc, api, date } = MK;
  MK.chrome();
  const tok = location.pathname.split("/").pop();
  const isNew = new URLSearchParams(location.search).has("nueva");
  const ST = { new: "Recibida", proposal: "Propuesta enviada", accepted: "Aceptada", declined: "Rechazada", completed: "Completada", cancelled: "Cancelada" };
  const STCLS = { new: "requested", proposal: "accepted", accepted: "completed", completed: "completed", declined: "declined", cancelled: "cancelled" };
  const CAT = { liquors: "Licores", wines: "Vinos", beers: "Cervezas", mixers: "Mixers y suministros de bar" };

  async function load() {
    let e;
    try { e = await api(`/api/ev/request/${encodeURIComponent(tok)}`); }
    catch { document.getElementById("root").innerHTML = '<div class="empty">Solicitud no encontrada.</div>'; return; }
    const steps = ["new", "proposal", "accepted"];
    const idx = ["declined", "cancelled"].includes(e.status) ? -1 : e.status === "completed" ? 2 : steps.indexOf(e.status);
    const p = e.proposal;
    document.getElementById("root").innerHTML = `
      ${isNew ? `<div class="msg-ok">✅ <b>¡Solicitud enviada!</b> Guarda este enlace para ver tu propuesta:<div class="linkbox"><input readonly value="${esc(location.origin + location.pathname)}" id="lnk" aria-label="Enlace privado"><button class="btn btn-ghost btn-sm" id="cp" type="button">Copiar</button></div></div>` : ""}
      <h1>${esc(e.eventType)} · ${e.guests} invitados</h1>
      <p style="color:var(--muted)">${esc(e.date || "Fecha por definir")}${e.startTime ? " · " + esc(e.startTime) : ""} · ${e.hours} h · ${esc(e.serviceLevel)}</p>
      <div class="panel"><h2>Estado: <span class="st st-${STCLS[e.status]}">${esc(ST[e.status])}</span></h2>
        ${idx >= 0 ? `<div class="timeline">${["Recibida", "Propuesta enviada", "Aceptada"].map((l, i) => `<div class="${i <= idx ? "on" : ""}">${l}</div>`).join("")}</div>` : ""}
        <p style="margin:14px 0 0;color:var(--muted)">${{ new: "Alex está revisando tu evento y te enviará una propuesta con precio aquí mismo.", proposal: "¡Tu propuesta está lista! Revísala abajo y acéptala o recházala.", accepted: "¡Propuesta aceptada! Alex se pondrá en contacto contigo para confirmar los detalles.", declined: "Rechazaste la propuesta. Si quieres ajustarla, escríbenos desde la página de contacto.", completed: "¡Evento completado! Gracias por confiar en Alex Solutions.", cancelled: "Cancelaste esta solicitud." }[e.status]}</p>
      </div>
      ${p ? `<div class="panel"><h2>Propuesta</h2>
        ${p.total ? `<p style="font:700 32px var(--display);color:var(--brand);margin:0 0 8px">${esc(p.total)}</p>` : ""}
        ${p.message ? `<p style="white-space:pre-line;margin:0 0 10px">${esc(p.message)}</p>` : ""}
        <p class="muted small" style="margin:0">Enviada ${date(p.sentAt)}${p.validUntil ? ` · válida hasta ${esc(p.validUntil)}` : ""}</p>
        ${e.status === "proposal" ? `<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn btn-primary" id="acc" type="button">✅ Aceptar propuesta</button><button class="btn btn-ghost" id="dec" type="button">Rechazar</button></div>` : ""}
      </div>` : ""}
      <div class="panel"><h2>Tu solicitud</h2>
        <dl style="display:grid;grid-template-columns:160px 1fr;gap:6px 12px;margin:0">
          <dt style="color:var(--muted)">Paquete</dt><dd style="margin:0">${esc(e.packageName || "A la medida")}</dd>
          <dt style="color:var(--muted)">Lugar</dt><dd style="margin:0">${esc(e.venue || "—")}</dd>
          <dt style="color:var(--muted)">Presupuesto</dt><dd style="margin:0">${esc(e.budget || "—")}</dd>
          ${e.estimate ? `<dt style="color:var(--muted)">Estimación</dt><dd style="margin:0">${e.estimate.drinks} bebidas · ${e.estimate.beer} cervezas · ${e.estimate.wine} botellas de vino · ${e.estimate.spirits} botellas de licor</dd>` : ""}
          ${e.message ? `<dt style="color:var(--muted)">Detalles</dt><dd style="margin:0;white-space:pre-line">${esc(e.message)}</dd>` : ""}
        </dl>
        ${e.products.length ? `<h3 class="sub-h" style="font:700 15px var(--font);margin:16px 0 8px">Productos elegidos</h3><ul style="margin:0;padding-left:18px">${e.products.map((x) => `<li>${x.qty} × ${esc(x.name)}${x.brand ? " (" + esc(x.brand) + ")" : ""} <span class="muted small">· ${esc(CAT[x.cat] || x.cat)}${x.price ? " · " + esc(x.price) : ""}</span></li>`).join("")}</ul>` : ""}
        ${["new", "proposal"].includes(e.status) ? '<div style="margin-top:16px"><button class="btn btn-ghost btn-sm" id="cancel" type="button">Cancelar solicitud</button></div>' : ""}
      </div>`;
    document.getElementById("cp")?.addEventListener("click", () => navigator.clipboard?.writeText(document.getElementById("lnk").value).then(() => (document.getElementById("cp").textContent = "¡Copiado!")));
    const act = async (action, msg) => { if (msg && !confirm(msg)) return; try { await api(`/api/ev/request/${encodeURIComponent(tok)}/respond`, { method: "POST", body: JSON.stringify({ action }) }); load(); } catch (err) { alert(err.message); } };
    document.getElementById("acc")?.addEventListener("click", () => act("accept", "¿Aceptar esta propuesta?"));
    document.getElementById("dec")?.addEventListener("click", () => act("decline", "¿Rechazar esta propuesta?"));
    document.getElementById("cancel")?.addEventListener("click", () => act("cancel", "¿Cancelar esta solicitud?"));
  }
  load();
})();
