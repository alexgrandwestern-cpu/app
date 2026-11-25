    const { esc, stars, money, initials, CAT_ICON, api } = MK;
    MK.chrome();
    let state = { category: "", area: "", q: "" };
    async function load() {
      const p = new URLSearchParams(Object.entries(state).filter(([, v]) => v));
      const list = await api(`/api/mk/experts?${p}`);
      document.getElementById("grid").innerHTML = list.map((e) => `
        <a class="xcard" href="/experto/${esc(e.slug)}">
          <div class="img">${e.photo ? `<img src="${esc(e.photo)}" alt="${esc(e.name)}" loading="lazy">` : `<span class="initials">${esc(initials(e.name))}</span>`}
            ${e.featured ? '<span class="badge">🏅 Experto destacado</span>' : ""}</div>
          <div class="row"><span>${esc(e.name)}</span><span class="stars">${stars(e.rating, e.reviewsCount)}</span></div>
          <div class="sub">${esc(e.headline)}</div>
          <div class="sub">${e.categories.map((c) => CAT_ICON[c] || "").join(" ")} ${esc(e.areas.slice(0, 2).join(" · "))}</div>
          <div class="price">${e.minPrice != null ? `<b>Desde ${money(e.minPrice)}</b>` : "<b>Cotización gratis</b>"}</div>
        </a>`).join("") || `<div class="empty" style="grid-column:1/-1">No hay expertos con esos filtros todavía. <a href="/unete">¿Quieres ser el primero?</a></div>`;
    }
    (async () => {
      const meta = await api("/api/mk/meta");
      document.getElementById("s-cat").innerHTML += meta.categories.map((c) => `<option>${esc(c)}</option>`).join("");
      document.getElementById("cats").innerHTML = [["", "✨", "Todos"], ...meta.categories.map((c) => [c, CAT_ICON[c], c])].map(([v, i, l]) => `<button data-v="${esc(v)}" class="${v === "" ? "on" : ""}"><span>${i}</span>${esc(l)}</button>`).join("");
      document.querySelectorAll("#cats button").forEach((b) => b.addEventListener("click", () => {
        document.querySelectorAll("#cats button").forEach((x) => x.classList.toggle("on", x === b));
        state.category = b.dataset.v; document.getElementById("s-cat").value = b.dataset.v; load();
      }));
      const qs = new URLSearchParams(location.search);
      if (qs.get("category")) { state.category = qs.get("category"); document.getElementById("s-cat").value = state.category; }
      load();
    })();
    document.getElementById("sf").addEventListener("submit", (e) => {
      e.preventDefault();
      state = { category: document.getElementById("s-cat").value, area: document.getElementById("s-area").value.trim(), q: document.getElementById("s-q").value.trim() };
      document.querySelectorAll("#cats button").forEach((x) => x.classList.toggle("on", x.dataset.v === state.category));
      load();
    });
  
