    document.getElementById("yr").textContent = new Date().getFullYear();
    fetch("/api/public-stats").then((r) => r.json()).then((d) => {
      if (!d.ready) return;
      const f = (n) => n.toLocaleString("en-US");
      document.getElementById("s-lic").textContent = f(d.totalLicenses);
      document.getElementById("s-food").textContent = f(d.foodBusinesses);
      document.getElementById("s-pros").textContent = f(d.prospects);
      document.getElementById("s-a").textContent = f(d.tierA);
    }).catch(() => {});
  
