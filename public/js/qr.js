    const items = [
      ["/app", "Mi panel", "Prospectos, marketplace, distribuidores y asistente (pide usuario y contraseña)", true],
      ["/", "Página principal", "La página pública de Alex Solutions, Inc"],
      ["/expertos", "Marketplace", "Buscar y reservar expertos"],
      ["/contacto", "Mi tarjeta", "Tarjeta de contacto para compartir"],
    ];
    document.getElementById("grid").innerHTML = items.map(([p, t, d, main]) => {
      const url = location.origin + p;
      const q = qrcode(0, "M"); q.addData(url); q.make();
      return `<div class="q${main ? " main" : ""}"><h2>${t}</h2><p>${d}</p>${q.createImgTag(8, 8, t)}<a href="${p}">${url.replace(/^https?:\/\//, "")}</a></div>`;
    }).join("");
  
