// Editor de servicios reutilizable (formulario de alta y panel del experto)
window.SVC = (() => {
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function row(cats, s) {
    const d = document.createElement("div");
    d.className = "svc-edit";
    d.dataset.id = s.id || "";
    d.innerHTML = `
      <div class="f3">
        <div class="f"><label>Servicio</label><input data-k="name" maxlength="80" value="${esc(s.name || "")}" placeholder="Ej.: Licencia Incidental Activity" /></div>
        <div class="f"><label>Categoría</label><select data-k="category">${cats.map((c) => `<option ${c === s.category ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
        <div class="f"><label>Precio</label><select data-k="unit"><option value="cotizar">Cotizar</option><option value="desde">Desde</option><option value="fijo">Fijo</option></select></div>
        <div class="f"><label>USD</label><input data-k="price" type="number" min="0" value="${s.price ?? ""}" /></div>
      </div>
      <div class="f2"><div class="f"><label>Duración</label><input data-k="duration" maxlength="40" value="${esc(s.duration || "")}" placeholder="Ej.: 4–8 semanas" /></div>
      <div class="f"><label>Descripción</label><input data-k="description" maxlength="500" value="${esc(s.description || "")}" /></div></div>
      <div><button type="button" class="link" data-del>Quitar servicio</button></div>`;
    d.querySelector('[data-k="unit"]').value = s.unit || "cotizar";
    d.querySelector("[data-del]").addEventListener("click", () => d.remove());
    return d;
  }
  return {
    mount(el, cats, list) { el.innerHTML = ""; (list.length ? list : [{}]).forEach((s) => el.appendChild(row(cats, s))); },
    add(el, cats, s) { el.appendChild(row(cats, s)); },
    read(el) {
      return [...el.querySelectorAll(".svc-edit")].map((d) => {
        const o = { id: d.dataset.id || undefined };
        d.querySelectorAll("[data-k]").forEach((i) => (o[i.dataset.k] = i.value));
        return o;
      }).filter((s) => s.name && s.name.trim());
    },
  };
})();
