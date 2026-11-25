    const { esc, money, api, date, STATUS } = MK;
    MK.chrome();
    const tok = location.pathname.split("/").pop();
    const isNew = new URLSearchParams(location.search).has("nueva");
    async function load() {
      let d;
      try { d = await api(`/api/mk/booking/${encodeURIComponent(tok)}`); }
      catch { document.getElementById("root").innerHTML = '<div class="empty">Reserva no encontrada.</div>'; return; }
      const b = d.booking, e = d.expert || {};
      const steps = ["requested", "accepted", "completed"];
      const idx = b.status === "declined" || b.status === "cancelled" ? -1 : steps.indexOf(b.status);
      document.getElementById("root").innerHTML = `
        ${isNew ? `<div class="msg-ok">✅ <b>¡Solicitud enviada!</b> Guarda este enlace para seguir tu reserva:<div class="linkbox"><input readonly value="${esc(location.origin + location.pathname)}" id="lnk"><button class="btn btn-ghost btn-sm" id="cp">Copiar</button></div></div>` : ""}
        <h1>Reserva con ${esc(e.name || b.expertName)}</h1>
        <p style="color:var(--muted)">${esc(b.serviceName)} · ${esc(b.business)}</p>
        <div class="panel">
          <h2>Estado: <span class="st st-${b.status}">${STATUS[b.status]}</span></h2>
          ${idx >= 0 ? `<div class="timeline">${["Solicitada", "Aceptada", "Completada"].map((l, i) => `<div class="${i <= idx ? "on" : ""}">${l}</div>`).join("")}</div>` : ""}
          <p style="margin:14px 0 0;color:var(--muted)">${{ requested: "El experto revisará tu solicitud y la aceptará o te propondrá otra fecha.", accepted: "¡Confirmada! Ya puedes contactar directamente al experto.", completed: "Servicio completado. ¡Cuéntanos cómo te fue!", declined: "El experto no pudo tomar esta reserva. Busca otro experto disponible.", cancelled: "Cancelaste esta reserva." }[b.status]}</p>
        </div>
        <div class="panel"><h2>Detalles</h2>
          <dl class="kv" style="display:grid;grid-template-columns:150px 1fr;gap:6px 12px;margin:0">
            <dt style="color:var(--muted)">Servicio</dt><dd style="margin:0">${esc(b.serviceName)}</dd>
            <dt style="color:var(--muted)">Precio</dt><dd style="margin:0">${b.price != null ? money(b.price) + (b.priceUnit === "desde" && b.status === "requested" ? " (desde)" : "") : "Por cotizar"}</dd>
            <dt style="color:var(--muted)">Fecha preferida</dt><dd style="margin:0">${esc(b.date || "Flexible")}</dd>
            <dt style="color:var(--muted)">Negocio</dt><dd style="margin:0">${esc(b.business)}${b.address ? " · " + esc(b.address) : ""}</dd>
            <dt style="color:var(--muted)">Solicitada</dt><dd style="margin:0">${date(b.createdAt)}</dd>
            ${e.phone || e.email ? `<dt style="color:var(--muted)">Contacto</dt><dd style="margin:0">${e.phone ? `📞 <a href="tel:${esc(e.phone)}">${esc(e.phone)}</a> ` : ""}${e.email ? `✉️ <a href="mailto:${esc(e.email)}">${esc(e.email)}</a>` : ""}</dd>` : ""}
          </dl>
          <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
            ${e.slug ? `<a class="btn btn-ghost btn-sm" href="/experto/${esc(e.slug)}">Ver perfil</a>` : ""}
            ${["requested", "accepted"].includes(b.status) ? '<button class="btn btn-ghost btn-sm" id="cancel">Cancelar reserva</button>' : ""}
            ${b.status === "declined" ? '<a class="btn btn-primary btn-sm" href="/expertos">Buscar otro experto</a>' : ""}
          </div>
        </div>
        ${b.status === "completed" ? (d.review ? `<div class="panel"><h2>Tu reseña</h2><p style="margin:0">${"★".repeat(d.review.rating)}${"☆".repeat(5 - d.review.rating)}</p><p>${esc(d.review.text)}</p></div>` : `
        <div class="panel"><h2>Califica el servicio</h2><div id="rerr"></div>
          <div class="star-pick" id="stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}" aria-label="${n} estrellas">★</button>`).join("")}</div>
          <div class="f" style="margin-top:10px"><textarea id="rtext" rows="3" maxlength="1500" placeholder="¿Cómo fue tu experiencia?"></textarea></div>
          <button class="btn btn-primary btn-sm" id="rsend" style="margin-top:10px">Publicar reseña</button></div>`) : ""}`;
      document.getElementById("cp")?.addEventListener("click", () => navigator.clipboard?.writeText(document.getElementById("lnk").value).then(() => (document.getElementById("cp").textContent = "¡Copiado!")));
      document.getElementById("cancel")?.addEventListener("click", async () => { if (confirm("¿Cancelar esta reserva?")) { await api(`/api/mk/booking/${tok}/cancel`, { method: "POST" }); load(); } });
      let rating = 0;
      document.querySelectorAll("#stars button").forEach((s) => s.addEventListener("click", () => { rating = +s.dataset.n; document.querySelectorAll("#stars button").forEach((x) => x.classList.toggle("on", +x.dataset.n <= rating)); }));
      document.getElementById("rsend")?.addEventListener("click", async () => {
        try { await api(`/api/mk/booking/${tok}/review`, { method: "POST", body: JSON.stringify({ rating, text: document.getElementById("rtext").value }) }); load(); }
        catch (err) { document.getElementById("rerr").innerHTML = `<div class="msg-err">${esc(err.message)}</div>`; }
      });
    }
    load();
  
