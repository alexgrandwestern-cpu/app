    const e = new URLSearchParams(location.search).get("e");
    if (e) document.getElementById("err").innerHTML = '<div class="alert">' + (e === "limit" ? "Demasiados intentos. Espera 15 minutos." : "Usuario o contraseña incorrectos.") + "</div>";
  
