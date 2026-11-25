// Página pública de eventos: paquetes, calculadora de bebidas, selección de productos y solicitud.
(() => {
  const { esc, api } = MK;
  MK.chrome();
  const $ = (s) => document.querySelector(s);
  const CAT_NAMES = { liquors: "🥃 Licores", wines: "🍷 Vinos", beers: "🍺 Cervezas", mixers: "🍋 Mixers y suministros de bar" };
  let opts = null, estimate = null;

  function calc() {
    const g = Math.max(1, +$("#c-guests").value || 0), h = Math.max(1, +$("#c-hours").value || 0);
    let b = Math.max(0, +$("#c-beer").value || 0), w = Math.max(0, +$("#c-wine").value || 0), sp = Math.max(0, +$("#c-spirits").value || 0);
    const sum = b + w + sp || 1; b /= sum; w /= sum; sp /= sum;
    const drinks = Math.round(g * (2 + (h - 1)));
    estimate = { drinks, beer: Math.ceil(drinks * b), wine: Math.ceil((drinks * w) / 5), spirits: Math.ceil((drinks * sp) / 16) };
    $("#c-out").innerHTML = `
      <div><b>${estimate.drinks.toLocaleString("en-US")}</b><span>bebidas en total</span></div>
      <div><b>${estimate.beer.toLocaleString("en-US")}</b><span>cervezas</span></div>
      <div><b>${estimate.wine.toLocaleString("en-US")}</b><span>botellas de vino</span></div>
      <div><b>${estimate.spirits.toLocaleString("en-US")}</b><span>botellas de licor (750 ml)</span></div>
      <div><b>${Math.ceil(g).toLocaleString("en-US")}</b><span>lb de hielo</span></div>`;
    // sincroniza con el formulario si el usuario no lo ha llenado
    if (!$("#guests").dataset.touched) $("#guests").value = g;
    if (!$("#hours").dataset.touched) $("#hours").value = h;
  }
  ["#c-guests", "#c-hours", "#c-beer", "#c-wine", "#c-spirits"].forEach((s) => $(s).addEventListener("input", calc));
  ["#guests", "#hours"].forEach((s) => $(s).addEventListener("input", (e) => (e.target.dataset.touched = "1")));

  function priceTxt(p) { return p.pricePerPerson != null ? `Desde $${Number(p.pricePerPerson).toLocaleString("en-US")} por persona` : "Precio según tu evento"; }

  (async () => {
    try { opts = await api("/api/ev/options"); }
    catch { $("#pkgs").innerHTML = '<div class="empty">No se pudieron cargar los paquetes. Recarga la página.</div>'; return; }
    $("#eventType").innerHTML = opts.types.map((t) => `<option>${esc(t)}</option>`).join("");
    $("#serviceLevel").innerHTML = opts.levels.map((t) => `<option>${esc(t)}</option>`).join("");
    $("#pkgs").innerHTML = opts.packages.map((p, i) => `<div class="pkg${i === 1 ? " featured" : ""}"><h3>${esc(p.name)}</h3><div class="price">${esc(priceTxt(p))}</div>
      <ul>${p.includes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><a class="btn btn-ghost btn-sm" href="#solicitar" data-pick="${esc(p.id)}">Elegir ${esc(p.name)}</a></div>`).join("");
    $("#pkgPick").innerHTML = opts.packages.map((p, i) => `<label><input type="radio" name="packageId" value="${esc(p.id)}" ${i === 1 ? "checked" : ""}><b>${esc(p.name)}</b><small>${esc(priceTxt(p))}</small></label>`).join("")
      + `<label><input type="radio" name="packageId" value=""><b>A la medida</b><small>Lo armamos contigo</small></label>`;
    document.querySelectorAll("[data-pick]").forEach((a) => a.addEventListener("click", () => { const r = document.querySelector(`input[name=packageId][value="${a.dataset.pick}"]`); if (r) r.checked = true; }));
    if (!opts.products.length) {
      $("#prodPick").innerHTML = '<div class="prod-empty">Muy pronto podrás elegir productos específicos aquí. Mientras, cuéntanos tus marcas y cócteles favoritos en "Detalles".</div>';
    } else {
      const groups = {};
      for (const p of opts.products) (groups[p.cat] ||= []).push(p);
      $("#prodPick").innerHTML = Object.entries(groups).map(([cat, list]) => `<div class="prod-group"><h4>${esc(CAT_NAMES[cat] || cat)}</h4>${list.map((p) => `
        <div class="prod-row"><div class="t"><b>${esc(p.name)}</b><small>${esc([p.brand, p.type, p.size].filter(Boolean).join(" · "))}${p.price ? " · " + esc(p.price) : ""}</small></div>
        <label class="sr-only" for="q-${esc(p.id)}">Cantidad de ${esc(p.name)}</label><input id="q-${esc(p.id)}" type="number" min="0" max="9999" placeholder="0" data-prod="${esc(p.id)}"></div>`).join("")}</div>`).join("")
        + '<p class="fine" style="text-align:left">Escribe la cantidad (botellas, cajas o unidades). Usa la calculadora como guía.</p>';
    }
    calc();
  })();

  $("#evf").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, data = Object.fromEntries(new FormData(f));
    data.products = [...document.querySelectorAll("[data-prod]")].map((i) => ({ id: i.dataset.prod, qty: +i.value || 0 })).filter((x) => x.qty > 0);
    data.estimate = estimate;
    const btn = f.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Enviando…";
    try { const r = await api("/api/ev/requests", { method: "POST", body: JSON.stringify(data) }); location.href = r.link + "?nueva=1"; }
    catch (err) { $("#err").innerHTML = `<div class="msg-err">${esc(err.message)}</div>`; btn.disabled = false; btn.textContent = "Solicitar propuesta"; $("#err").scrollIntoView({ behavior: "smooth", block: "center" }); }
  });
})();
