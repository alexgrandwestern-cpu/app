    const { esc, api } = MK;
    MK.chrome();
    let cats = [];
    (async () => {
      const m = await api("/api/mk/meta"); cats = m.categories;
      document.getElementById("fee").textContent = `La plataforma cobra una comisión del ${m.feePct}% sobre los servicios completados.`;
      SVC.mount(document.getElementById("svcs"), cats, [{}]);
    })();
    document.getElementById("add").addEventListener("click", () => SVC.add(document.getElementById("svcs"), cats, {}));
    document.getElementById("af").addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      data.services = SVC.read(document.getElementById("svcs"));
      try {
        const r = await api("/api/mk/apply", { method: "POST", body: JSON.stringify(data) });
        const url = location.origin + r.link;
        e.target.remove();
        document.getElementById("done").innerHTML = `<div class="msg-ok"><b>¡Solicitud recibida!</b> Este es tu <b>enlace privado</b> para administrar tu perfil y tus reservas. Guárdalo: es tu llave de acceso.
          <div class="linkbox"><input readonly value="${esc(url)}" id="lnk"><button class="btn btn-ghost btn-sm" id="cp">Copiar</button><a class="btn btn-primary btn-sm" href="${esc(r.link)}">Abrir mi panel</a></div></div>`;
        document.getElementById("cp").addEventListener("click", () => navigator.clipboard?.writeText(url).then(() => (document.getElementById("cp").textContent = "¡Copiado!")));
      } catch (err) { document.getElementById("err").innerHTML = `<div class="msg-err">${esc(err.message)}</div>`; window.scrollTo(0, 0); }
    });
  
