    const { esc, stars, priceTxt, initials, CAT_ICON, api, date, money } = MK;
    MK.chrome();
    const slug = location.pathname.split("/").pop();
    const qs = new URLSearchParams(location.search);
    (async () => {
      let e;
      try { e = await api(`/api/mk/experts/${encodeURIComponent(slug)}`); }
      catch { document.getElementById("root").innerHTML = '<div class="empty">Este experto no está disponible. <a href="/expertos">Ver todos</a></div>'; return; }
      document.title = `${e.name} — Alex Solutions Expertos`;
      document.getElementById("root").innerHTML = `
      <div class="profile">
        <div>
          <div class="p-head">
            <div class="p-avatar">${e.photo ? `<img src="${esc(e.photo)}" alt="">` : esc(initials(e.name))}</div>
            <div><h1>${esc(e.name)}</h1>
              <div class="meta"><span class="stars">${stars(e.rating, e.reviewsCount)}</span>${e.featured ? "<span>🏅 Experto destacado</span>" : ""}
              ${e.yearsExp ? `<span>${e.yearsExp} años de experiencia</span>` : ""}<span>📍 ${esc(e.areas.join(", "))}</span>${e.languages.length ? `<span>🗣️ ${esc(e.languages.join(", "))}</span>` : ""}</div></div>
          </div>
          <p style="font-size:18px;margin:0 0 10px"><b>${esc(e.headline)}</b></p>
          <div class="p-sec"><h2>Acerca de</h2><p style="white-space:pre-line;margin:0">${esc(e.bio)}</p></div>
          <div class="p-sec"><h2>Servicios</h2><div class="svc-list">${e.services.map((s) => `
            <div class="svc-item"><div><h3>${CAT_ICON[s.category] || ""} ${esc(s.name)}</h3><p>${esc(s.description)}</p><p style="margin-top:6px"><small>${esc(s.category)}${s.duration ? " · " + esc(s.duration) : ""}</small></p></div>
            <div class="pr">${esc(priceTxt(s))}<button class="btn btn-ghost btn-sm" data-svc="${esc(s.id)}" style="margin-top:8px">Reservar</button></div></div>`).join("")}</div></div>
          <div class="p-sec"><h2>${e.reviewsCount ? `★ ${e.rating.toFixed(2)} · ${e.reviewsCount} reseña${e.reviewsCount > 1 ? "s" : ""}` : "Reseñas"}</h2>
            ${e.reviews.length ? `<div class="reviews">${e.reviews.map((r) => `<div class="review"><b>${esc(r.business)}</b><small>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} · ${date(r.createdAt)} · ${esc(r.service || "")}</small><p>${esc(r.text)}</p></div>`).join("")}</div>`
              : '<p style="color:var(--muted);margin:0">Aún no hay reseñas. Solo los clientes con un servicio completado pueden reseñar (reseñas verificadas).</p>'}</div>
        </div>
        <aside class="book" id="book">
          <h3>Solicita una reserva</h3><p style="color:var(--muted);margin:0 0 14px;font-size:14px">Sin compromiso: ${esc(e.name.split(" ")[0])} confirma disponibilidad y precio.</p>
          <form id="bf">
            <div id="berr"></div>
            <div class="f"><label>Servicio</label><select name="serviceId" required>${e.services.map((s) => `<option value="${esc(s.id)}">${esc(s.name)} — ${esc(priceTxt(s))}</option>`).join("")}</select></div>
            <div class="f"><label>Fecha preferida</label><input type="date" name="date" /></div>
            <div class="f"><label>Negocio</label><input name="business" required maxlength="100" placeholder="Nombre de tu restaurante o tienda" /></div>
            <div class="f2"><div class="f"><label>Tu nombre</label><input name="contactName" required maxlength="80" /></div><div class="f"><label>Teléfono</label><input name="phone" maxlength="40" /></div></div>
            <div class="f"><label>Correo</label><input type="email" name="email" required maxlength="120" /></div>
            <div class="f"><label>Dirección del local</label><input name="address" maxlength="160" /></div>
            <div class="f"><label>Mensaje</label><textarea name="message" rows="3" maxlength="1500" placeholder="Cuéntanos sobre tu negocio y lo que necesitas"></textarea></div>
            <button class="btn btn-primary btn-block" type="submit">Solicitar reserva</button>
            <p class="fine">No se cobra nada ahora. Recibirás un enlace privado para seguir tu reserva.</p>
            <p class="fine">Al enviar aceptas los <a href="/terminos">términos de uso</a> y el <a href="/privacidad">aviso de privacidad</a>.</p>
          </form>
        </aside>
      </div>`;
      const f = document.getElementById("bf");
      if (qs.get("negocio")) f.business.value = qs.get("negocio");
      if (qs.get("direccion")) f.address.value = qs.get("direccion");
      if (qs.get("servicio")) f.serviceId.value = qs.get("servicio");
      document.querySelectorAll("[data-svc]").forEach((b) => b.addEventListener("click", () => { f.serviceId.value = b.dataset.svc; document.getElementById("book").scrollIntoView({ behavior: "smooth", block: "start" }); f.business.focus(); }));
      f.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const data = Object.fromEntries(new FormData(f));
        data.expertId = e.id; data.prospectId = qs.get("p") || "";
        const btn = f.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Enviando…";
        try { const r = await api("/api/mk/bookings", { method: "POST", body: JSON.stringify(data) }); location.href = r.link + "?nueva=1"; }
        catch (err) { document.getElementById("berr").innerHTML = `<div class="msg-err">${esc(err.message)}</div>`; btn.disabled = false; btn.textContent = "Solicitar reserva"; }
      });
    })();
  
