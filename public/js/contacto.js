    const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    function drawQR(el, text) {
      if (!window.qrcode) { el.textContent = "No se pudo generar el QR."; return; }
      const q = qrcode(0, "M");
      q.addData(unescape(encodeURIComponent(text)));
      q.make();
      el.innerHTML = q.createImgTag(8, 16, "Código QR");
    }
    fetch("/api/contact").then((r) => r.json()).then((c) => {
      document.getElementById("name").textContent = c.name;
      document.getElementById("title").textContent = c.title;
      document.getElementById("company").textContent = `${c.company} · ${c.city}`;
      document.getElementById("av").textContent = c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
      document.title = `${c.name} — ${c.company}`;
      const acts = [];
      if (c.phone) acts.push(`<a href="tel:${esc(c.phone)}">📞 Llamar</a>`);
      if (c.whatsapp) acts.push(`<a href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">💬 WhatsApp</a>`);
      if (c.email) acts.push(`<a href="mailto:${esc(c.email)}">✉️ Correo</a>`);
      acts.push(`<a href="/asesoria-layout">🍷 Asesoría</a>`);
      acts.push(`<a class="gold" href="/contacto.vcf">⬇ Guardar contacto</a>`);
      document.getElementById("acts").innerHTML = acts.join("");
      const lines = [];
      if (c.phone) lines.push(`📱 <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`);
      if (c.email) lines.push(`✉️ <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`);
      if (c.website) lines.push(`🌐 <a href="${esc(c.website)}">${esc(c.website.replace(/^https?:\/\//, ""))}</a>`);
      if (c.instagram) lines.push(`📸 <a href="https://instagram.com/${esc(c.instagram.replace(/^@/, ""))}" target="_blank" rel="noopener">${esc(c.instagram)}</a>`);
      if (c.linkedin) lines.push(`💼 <a href="${esc(c.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`);
      lines.push(`📍 ${esc(c.city)}`);
      document.getElementById("lines").innerHTML = lines.map((l) => `<li>${l}</li>`).join("");
      document.getElementById("pending").hidden = !!(c.phone || c.email);
      drawQR(document.getElementById("qr-link"), `${location.origin}/contacto`);
      drawQR(document.getElementById("qr-vcard"), c.vcard);
    });
    document.querySelectorAll(".dl").forEach((b) => b.addEventListener("click", () => {
      const img = document.querySelector(`#${b.dataset.target} img`);
      if (!img) return;
      const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 1024;
      const ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = b.dataset.name; a.click();
    }));
  
