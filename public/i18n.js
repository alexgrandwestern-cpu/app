// Selector de idioma Español / English para toda la plataforma.
// Traduce el texto de la página (incluido el que se carga después) con un diccionario y patrones.
(function () {
  const KEY = "lp_lang";
  let lang = "es";
  try { lang = new URLSearchParams(location.search).get("lang") || localStorage.getItem(KEY) || "es"; } catch {}
  if (lang !== "en") lang = "es";
  try { localStorage.setItem(KEY, lang); } catch {}
  document.documentElement.lang = lang;

  const D = {
    // ---------- Navegación y comunes ----------
    "Cómo funciona": "How it works", "Plataforma": "Platform", "Servicio": "Service", "Layout de tiendas": "Store layout", "Expertos": "Experts",
    "Contacto": "Contact", "Entrar": "Log in", "Salir": "Log out", "Inicio": "Home", "Inicio →": "Home →", "Guía de layout": "Layout guide",
    "Buscar": "Search", "🔍 Buscar": "🔍 Search", "Cargando…": "Loading…", "Copiar": "Copy", "¡Copiado!": "Copied!", "Cerrar": "Close", "Guardar": "Save",
    "Cancelar": "Cancel", "Eliminar": "Delete", "Enviar": "Send", "Nuevo": "New", "Todos": "All", "Todas": "All", "Estado": "Status", "Precio": "Price",
    "Fecha": "Date", "Negocio": "Business", "Nombre": "Name", "Teléfono": "Phone", "Correo": "Email", "Mensaje": "Message", "Detalles": "Details",
    "Acerca de": "About", "Servicios": "Services", "Reservar": "Book", "Reservas": "Bookings", "Reseñas": "Reviews", "Acciones": "Actions",
    "Idiomas": "Languages", "Zonas": "Areas", "Titular": "Headline", "Descripción": "Description", "Duración": "Duration", "Categoría": "Category",
    "Marca": "Brand", "Tipo": "Type", "Origen": "Origin", "Resumen": "Overview", "Fuentes": "Sources", "Empresa": "Company", "Comisión": "Commission",
    "Experto": "Expert", "Desde": "From", "Fijo": "Fixed", "Cotizar": "Quote", "Cotización gratis": "Free quote", "Ver todos": "See all",
    "Alex Solutions, Inc": "Alex Solutions, Inc", "Datos:": "Data:", "Datos en vivo": "Live data", "Español, English": "Spanish, English",

    // ---------- Página principal ----------
    "Alex Solutions, Inc — Licencias de licor para restaurantes en Chicago | Alex Zavala": "Alex Solutions, Inc — Liquor licenses for Chicago restaurants | Alex Zavala",
    "Alex Solutions, Inc · Por Alex Zavala · Chicago": "Alex Solutions, Inc · By Alex Zavala · Chicago",
    "Tu restaurante merece": "Your restaurant deserves", "servir una copa.": "to pour a drink.",
    "Ayudo a restaurantes de Chicago a obtener su licencia de licor sin vueltas: expediente, zonificación, inspecciones y BASSET. Y con inteligencia artificial encuentro a los negocios que más la necesitan.": "I help Chicago restaurants get their liquor license without the runaround: application, zoning, inspections and BASSET. And with artificial intelligence I find the businesses that need it most.",
    "Abrir la plataforma →": "Open the platform →", "Reservar un experto": "Book an expert",
    "licencias de negocio analizadas en Chicago": "business licenses analyzed in Chicago", "establecimientos de comida evaluados": "food establishments evaluated",
    "negocios de comida": "food businesses", "sin": "without", "licencia de licor": "a liquor license", "prospectos de prioridad alta (nivel A)": "high-priority prospects (tier A)",
    "El servicio": "The service", "Una licencia de licor sube tu ticket promedio y atrae más clientes.": "A liquor license raises your average check and brings in more customers.",
    "Pero el trámite en Chicago asusta: zonificación, moratorias por distrito, seguros, huellas, capacitación y revisiones. Alex lo resuelve de principio a fin.": "But the process in Chicago is intimidating: zoning, district moratoriums, insurance, fingerprints, training and reviews. Alex handles it from start to finish.",
    "Diagnóstico gratis": "Free assessment", "Revisamos tu ubicación, zonificación y el tipo de licencia ideal: Incidental Activity, Package Goods o Tavern.": "We review your location, zoning and the right license type: Incidental Activity, Package Goods or Tavern.",
    "Expediente completo": "Complete application", "Preparamos documentos, seguro de responsabilidad, antecedentes y la capacitación BASSET de tu equipo.": "We prepare documents, liability insurance, background checks and BASSET training for your team.",
    "Seguimiento hasta la aprobación": "Follow-up until approval", "Coordinamos inspecciones y respondemos a la ciudad para que abras la barra lo antes posible.": "We coordinate inspections and respond to the city so you can open your bar as soon as possible.",
    "La plataforma": "The platform", "Inteligencia de prospectos con datos oficiales de la ciudad.": "Prospect intelligence built on official city data.",
    "Cada día, Alex Solutions descarga todas las licencias activas de Chicago, las cruza con las inspecciones sanitarias y detecta qué restaurantes todavía no tienen licencia de licor.": "Every day, Alex Solutions downloads all active Chicago licenses, cross-checks them with health inspections and detects which restaurants still lack a liquor license.",
    "+50,000 negocios evaluados": "50,000+ businesses evaluated", "Cruce automático de licencias por cuenta y ubicación para encontrar a quién le falta la licencia de licor.": "Automatic matching of licenses by account and location to find who is missing a liquor license.",
    "Puntaje de oportunidad": "Opportunity score", "Cada prospecto recibe 0–100 según comedor, tipo de cocina, patio, antigüedad, inspecciones y zona.": "Each prospect gets a 0–100 score based on dining room, cuisine, patio, age, inspections and area.",
    "Segmentos y mapa": "Segments and map", "Filtra por barrio, código postal, ward, tipo de cocina y segmento. Míralo todo en un mapa interactivo.": "Filter by neighborhood, ZIP code, ward, cuisine and segment. See it all on an interactive map.",
    "Asistente con IA": "AI assistant", "Pregunta “¿qué taquerías nuevas en Pilsen no tienen licencia?” y recibe la lista al instante.": "Ask “which new taquerias in Pilsen don't have a license?” and get the list instantly.",
    "Pipeline de ventas": "Sales pipeline", "Marca cada prospecto como contactado, interesado o cliente, agrega notas y genera guiones de llamada.": "Mark each prospect as contacted, interested or client, add notes and generate call scripts.",
    "Exporta a CSV": "Export to CSV", "Descarga cualquier lista filtrada para tu CRM, campañas de correo o rutas de visita.": "Download any filtered list for your CRM, email campaigns or visit routes.",
    "De datos abiertos a clientes reales.": "From open data to real clients.", "Descarga automática": "Automatic download",
    "Portal de Datos de Chicago: Business Licenses (activas) + Food Inspections, actualizado cada 24 horas.": "Chicago Data Portal: Business Licenses (active) + Food Inspections, updated every 24 hours.",
    "Enriquecimiento": "Enrichment", "Clasificamos segmento y cocina, detectamos cadenas e instituciones y medimos la densidad de licor por barrio.": "We classify segment and cuisine, detect chains and institutions and measure liquor density by neighborhood.",
    "Acción": "Action", "Alex prioriza los nivel A, llama, visita y convierte. Todo desde un solo panel.": "Alex prioritizes tier A, calls, visits and converts. All from one dashboard.",
    "Segundo servicio · Alex Solutions, Inc": "Second service · Alex Solutions, Inc", "Ya tienes la licencia. Ahora haz que cada botella se venda sola.": "You have the license. Now make every bottle sell itself.",
    "Asesoría de layout y merchandising para tiendas de Fine Wine & Spirits y para la barra de tu restaurante: dónde va cada categoría, qué poner a la altura de los ojos y cuánto espacio darle a cada producto según sus ventas.": "Layout and merchandising consulting for Fine Wine & Spirits stores and for your restaurant's bar: where each category goes, what to put at eye level and how much space each product deserves based on its sales.",
    "🗺️ Plano ideal interactivo": "🗺️ Interactive ideal floor plan", "10 zonas: muro de poder, vinos por país, sala de vinos finos, refrigerados al fondo, vitrina premium y caja.": "10 zones: power wall, wines by country, fine wine room, coolers in the back, premium case and checkout.",
    "📏 Calculadora de espacio vs. ventas": "📏 Space vs. sales calculator", "Reasigna metros de estante por categoría según ventas y margen.": "Reallocate shelf space by category based on sales and margin.",
    "✅ Autodiagnóstico de 15 prácticas": "✅ 15-practice self-assessment", "Puntaje de 0 a 100 y tus 3 prioridades, más un plan paso a paso.": "A 0–100 score and your top 3 priorities, plus a step-by-step plan.",
    "Ver la guía de layout →": "See the layout guide →", "Hablar con Alex": "Talk to Alex", "¿Listo para encontrar tus próximos clientes?": "Ready to find your next clients?",
    "Entra a la plataforma y descubre los restaurantes que te están esperando.": "Log in to the platform and discover the restaurants waiting for you.", "Entrar a Alex Solutions →": "Log in to Alex Solutions →",
    "· Chicago · Creado por": "· Chicago · Created by", "Datos en vivo": "Live data",
    "Comedor de restaurante con clientes": "Restaurant dining room with guests", "Skyline de Chicago": "Chicago skyline", "Restaurante con mesas": "Restaurant with tables",
    "Platillo servido en restaurante": "Dish served at a restaurant", "Brindis con copas de vino tinto": "Toast with glasses of red wine",
    "Información orientativa; confirma requisitos con BACP.": "Guidance only; confirm requirements with BACP.",

    // ---------- Login ----------
    "Entrar — Alex Solutions, Inc": "Log in — Alex Solutions, Inc", "“Cada restaurante sin licencia de licor es una conversación esperando a suceder.”": "“Every restaurant without a liquor license is a conversation waiting to happen.”",
    "Datos oficiales de la Ciudad de Chicago · actualizados a diario": "Official City of Chicago data · updated daily", "Bienvenido, Alex": "Welcome, Alex",
    "Entra para ver tus prospectos.": "Log in to see your prospects.", "Usuario": "Username", "Contraseña": "Password", "← Volver al inicio": "← Back to home",
    "Demasiados intentos. Espera 15 minutos.": "Too many attempts. Wait 15 minutes.", "Usuario o contraseña incorrectos.": "Incorrect username or password.",

    // ---------- Panel ----------
    "Panel — Alex Solutions, Inc": "Dashboard — Alex Solutions, Inc", "🍷 Layout": "🍷 Layout", "🪪 Mi tarjeta": "🪪 My card", "↻ Actualizar": "↻ Refresh", "☰ Filtros": "☰ Filters",
    "Filtros": "Filters", "Limpiar": "Clear", "Prioridad": "Priority", "Alta": "High", "Media": "Medium", "Baja": "Low", "Segmento": "Segment",
    "Tipo de cocina": "Cuisine", "Área comunitaria": "Community area", "Puntaje mínimo:": "Minimum score:", "Solo negocios nuevos (≤ 24 meses)": "New businesses only (≤ 24 months)",
    "Con patio exterior": "With outdoor patio", "Incluir cadenas e instituciones": "Include chains and institutions", "⬇ Exportar CSV": "⬇ Export CSV",
    "Prospecto = negocio con licencia": "Prospect = business with a", "sin licencia de licor en su ubicación.": "license and no liquor license at its location.",
    "Prospectos": "Prospects", "Mapa": "Map", "Pipeline": "Pipeline", "Marketplace": "Marketplace", "Radar de productos": "Product radar", "Distribuidores": "Distributors",
    "Analizando la base de datos de Chicago…": "Analyzing the Chicago database…", "Descargando licencias activas": "Downloading active licenses",
    "Prospectos por segmento": "Prospects by segment", "Por tipo de cocina": "By cuisine", "Mejores zonas": "Top areas", "(clic para filtrar)": "(click to filter)",
    "Nivel A": "Tier A", "Puntaje prom.": "Avg. score", "Prospectos": "Prospects", "Top 10 prospectos ahora": "Top 10 prospects now", "Ordenar:": "Sort:",
    "Puntaje": "Score", "Más recientes": "Most recent", "Área": "Area", "Cocina": "Cuisine", "← Anterior": "← Previous", "Siguiente →": "Next →",
    "Se muestran hasta 2,500 prospectos del filtro actual. Verde = A, ámbar = B, gris = C.": "Up to 2,500 prospects from the current filter are shown. Green = A, amber = B, gray = C.",
    "Tu pipeline se guarda en este navegador. Cambia el estado desde la ficha de cada prospecto.": "Your pipeline is saved in this browser. Change the status from each prospect's card.",
    "Sin resultados.": "No results.", "Sin resultados con estos filtros.": "No results with these filters.", "No se pudo cargar el mapa.": "Could not load the map.", "Vacío": "Empty",
    "Buscar nombre, dirección, barrio, ZIP…": "Search name, address, neighborhood, ZIP…", "Estado de los datos": "Data status", "Volver a descargar datos de la ciudad": "Download city data again",
    "Abrir asistente": "Open assistant", "Asistente de IA": "AI assistant", "Escribe tu pregunta…": "Type your question…",
    "prospectos en el filtro actual": "prospects in the current filter", "Contactado": "Contacted", "Interesado": "Interested", "Cliente": "Client", "Descartado": "Discarded",
    // ficha
    "📍 Google Maps": "📍 Google Maps", "🔎 Buscar teléfono": "🔎 Find phone", "⭐ Yelp": "⭐ Yelp", "¿Por qué es buen prospecto?": "Why is it a good prospect?",
    "Servicios para ofrecer": "Services to offer", "1 · Licencia de licor": "1 · Liquor license", "2 · Layout y merchandising": "2 · Layout and merchandising", "Ver guía →": "See guide →",
    "Datos de la ciudad": "City data", "Razón social": "Legal name", "Licencias actuales": "Current licenses", "Actividades": "Activities", "Ward / ZIP": "Ward / ZIP",
    "Tipo (inspección)": "Type (inspection)", "Última inspección": "Last inspection", "Licencia desde": "Licensed since", "Vence": "Expires", "Licor en la zona": "Liquor in the area",
    "No. licencia": "License no.", "Mi pipeline": "My pipeline", "Notas: teléfono, con quién hablaste, próxima cita…": "Notes: phone, who you talked to, next appointment…",
    "Invitar a reservar en el marketplace": "Invite to book on the marketplace", "Envía este enlace por WhatsApp o correo: abre tu perfil con el nombre y la dirección del negocio ya llenos.": "Send this link via WhatsApp or email: it opens your profile with the business name and address already filled in.",
    "🔗 Copiar enlace de reserva": "🔗 Copy booking link", "¡Enlace copiado!": "Link copied!", "💬 Enviar por WhatsApp": "💬 Send via WhatsApp", "Guion de llamada sugerido": "Suggested call script",
    "Copiar guion": "Copy script", "Otros prospectos cerca (ruta de visita)": "Other prospects nearby (visit route)", "puntaje · prioridad": "score · priority",
    // asistente
    "Copiloto IA": "AI Copilot", "Copiloto Licor": "Liquor Copilot", "Asistente de prospección": "Prospecting assistant",
    "¡Hola Alex! 👋 Pregúntame por prospectos, zonas, tipos de cocina o cómo funciona el trámite de licencia.": "Hi Alex! 👋 Ask me about prospects, areas, cuisines or how the license process works.",
    "¿Cuáles son las 10 mejores taquerías sin licencia en Pilsen?": "What are the top 10 taquerias without a license in Pilsen?", "¿Qué zonas tienen más prospectos nivel A?": "Which areas have the most tier A prospects?",
    "Restaurantes nuevos con patio sin licencia": "New restaurants with a patio and no license", "¿Qué requisitos tiene la licencia Incidental Activity?": "What are the requirements for the Incidental Activity license?",
    "Pensando…": "Thinking…", "Error al contactar al asistente.": "Error contacting the assistant.", "Los datos aún se están cargando, intenta en un momento.": "Data is still loading, try again in a moment.",
    "IA: Claude · datos en vivo": "AI: Claude · live data", "Motor local · agrega ANTHROPIC_API_KEY para IA completa": "Local engine · add ANTHROPIC_API_KEY for full AI",
    // marketplace admin
    "Marketplace de expertos: aprueba perfiles, sigue reservas y comisiones.": "Expert marketplace: approve profiles, track bookings and commissions.", "Ver marketplace ↗": "View marketplace ↗",
    "Formulario de alta ↗": "Sign-up form ↗", "Experto · servicio": "Expert · service", "Aprobar": "Approve", "Pausar": "Pause", "Rechazar": "Reject", "Destacar": "Feature",
    "Quitar destacado": "Unfeature", "Panel del experto ↗": "Expert dashboard ↗", "Perfil ↗": "Profile ↗", "⏳ Pendiente": "⏳ Pending", "✅ Publicado": "✅ Published",
    "✖ Rechazado": "✖ Rejected", "⏸ Pausado": "⏸ Paused", "Solicitada": "Requested", "Aceptada": "Accepted", "Rechazada": "Declined", "Completada": "Completed", "Cancelada": "Cancelled",
    "Aún no hay reservas. Comparte tu perfil con prospectos desde su ficha (botón \"Invitar a reservar\").": "No bookings yet. Share your profile with prospects from their card (\"Invite to book\" button).",
    "· Base de datos: Postgres": "· Database: Postgres", "· ⚠️ Sin base de datos: los datos se borran al redeploy": "· ⚠️ No database: data is erased on redeploy",
    // distribuidores
    "¿Quién distribuye esta bebida en Illinois?": "Who distributes this beverage in Illinois?", "sin verificar": "unverified", "hasta que tú la confirmes.": "until you confirm it.",
    "Escribe cualquier marca: vino, tequila, cerveza, whisky… Primero se busca en tu directorio; si no está, la IA la investiga en internet con fuentes y la deja": "Type any brand: wine, tequila, beer, whisky… It searches your directory first; if it's not there, the AI researches it online with sources and marks it",
    "Ej.: Don Julio, Modelo Especial, Josh Cellars, Tito's…": "E.g.: Don Julio, Modelo Especial, Josh Cellars, Tito's…", "Red de distribuidores de Illinois": "Illinois distributor network",
    "Filtrar por nombre, ciudad o marca": "Filter by name, city or brand", "Directorio de marcas": "Brand directory", "+ Agregar manualmente": "+ Add manually",
    "Distribuidor(es) en IL": "Distributor(s) in IL", "No identificado": "Not identified", "Proveedor / dueño": "Supplier / owner", "Confianza IA": "AI confidence", "Mis notas": "My notes",
    "Quitar verificación": "Remove verification", "✅ Confirmar como verificado": "✅ Confirm as verified", "✏️ Editar": "✏️ Edit", "🔄 Investigar de nuevo": "🔄 Research again",
    "✅ Verificado": "✅ Verified", "⚠️ Sin verificar": "⚠️ Unverified", "Proveedor / dueño de la marca": "Brand supplier / owner", "Distribuidores (uno por línea: nombre | territorio)": "Distributors (one per line: name | territory)",
    "Mis notas (contacto del distribuidor, representante, etc.)": "My notes (distributor contact, rep, etc.)", "Marcar como verificado": "Mark as verified", "Distribuidor(es)": "Distributor(s)",
    "Aún no hay marcas. Busca una arriba para empezar.": "No brands yet. Search for one above to get started.", "¿No es lo que buscabas?": "Not what you were looking for?", "+ Agregarla manualmente": "+ Add it manually",
    "Buscando proveedor y distribuidor actual en Illinois. Puede tardar 20–60 segundos.": "Looking for the supplier and current distributor in Illinois. It may take 20–60 seconds.",
    "Sedes en IL": "IL locations", "Marcas en tu directorio": "Brands in your directory", "🔎 Contacto": "🔎 Contact", "Editar marca": "Edit brand", "Agregar marca": "Add brand",
    // radar
    "Radar de productos nuevos": "New product radar", "Etiquetas aprobadas por la TTB (COLA) en los últimos días: cada producto nuevo o etiqueta nueva que se venderá en EE. UU. Haz clic en uno para ver su mapa de conexiones: proveedor → distribuidor en Illinois → cuentas en Chicago.": "Labels approved by the TTB (COLA) in recent days: every new product or new label that will be sold in the U.S. Click one to see its connection map: supplier → Illinois distributor → Chicago accounts.",
    "7 días": "7 days", "30 días": "30 days", "60 días": "60 days", "Solo importados": "Imports only", "Marca · producto": "Brand · product", "Importador / proveedor": "Importer / supplier",
    "Buscar marca, producto, importador, país…": "Search brand, product, importer, country…", "Mapa de conexiones": "Connection map", "🏭 Proveedor / importador": "🏭 Supplier / importer",
    "🚚 Distribuidor en Illinois": "🚚 Illinois distributor", "🍽️ Cuentas sugeridas en Chicago": "🍽️ Suggested Chicago accounts", "Cuentas para presentar este producto": "Accounts to pitch this product",
    "Sin cuentas que encajen.": "No matching accounts.", "Aún no sabemos quién la distribuye en Illinois.": "We don't know yet who distributes it in Illinois.", "🔍 Investigar distribuidor": "🔍 Research distributor",
    "Ideas: preséntale estas cuentas al distribuidor o al importador como oportunidad de colocación, o lleva el producto a tus clientes con licencia.": "Ideas: present these accounts to the distributor or importer as placement opportunities, or bring the product to your licensed clients.",
    "📄 Ver etiqueta en TTB": "📄 View label on TTB", "🔎 Buscar en Google": "🔎 Search on Google",

    // ---------- Datos ----------
    "Productos": "Products", "Buscador de productos del mercado": "Market product search", "🥃 Licores": "🥃 Liquors", "🍷 Vinos": "🍷 Wines", "🍺 Cervezas": "🍺 Beers",
    "🍋 Mixers y suministros de bar": "🍋 Mixers & bar supplies", "Busca por marca o nombre del producto…": "Search by brand or product name…", "Aprobada": "Approved",
    "Licores, vinos y cervezas: búsqueda en vivo en el registro federal de etiquetas de la TTB (todo lo aprobado para venderse en EE. UU. en los últimos 6 años). Mixers y suministros de bar: tu propio catálogo.": "Liquors, wines and beers: live search of the TTB federal label registry (everything approved for sale in the U.S. in the last 6 years). Mixers & bar supplies: your own catalog.",
    "Mi catálogo de mixers y suministros": "My mixers & supplies catalog", "Mis productos guardados": "My saved products", "+ Agregar producto": "+ Add product", "Producto": "Product",
    "Proveedor / distribuidor": "Supplier / distributor", "Ver producto ↗": "View product ↗", "Tamaño / presentación": "Size / pack", "Ej.: 750 ml, caja de 24": "E.g.: 750 ml, case of 24",
    "Ej.: $12.50": "E.g.: $12.50", "Enlace (https)": "Link (https)", "Notas": "Notes", "Buscando en el registro de la TTB…": "Searching the TTB registry…",
    "Aún no hay productos. Agrega los mixers, jarabes, cristalería y herramientas que vendes o recomiendas.": "No products yet. Add the mixers, syrups, glassware and tools you sell or recommend.",
    "Guarda aquí productos que vendes o recomiendas, con su proveedor y precio.": "Save products you sell or recommend here, with their supplier and price.",
    "Los mixers y suministros no tienen registro público: arma aquí tu catálogo y busca precios en proveedores.": "Mixers and supplies have no public registry: build your catalog here and look up prices with suppliers.",
    "Sin resultados. Prueba con otra marca o revisa la ortografía.": "No results. Try another brand or check the spelling.", "Buscar precio y disponibilidad": "Find price and availability",
    "Mixer / refresco": "Mixer / soda", "Jarabe / sirope": "Syrup", "Bitters": "Bitters", "Garnish / fruta": "Garnish / fruit", "Cristalería": "Glassware", "Herramientas de bar": "Bar tools",
    "Desechables": "Disposables", "Hielo": "Ice", "El registro de la TTB no respondió. Intenta de nuevo en un momento.": "The TTB registry didn't respond. Try again in a moment.",
    "¿Eliminar este producto del catálogo?": "Delete this product from the catalog?",
    "Restaurante con comedor": "Restaurant with dining room", "Café y bebidas": "Café and drinks", "Panadería / Deli": "Bakery / Deli", "Comida para llevar": "Takeout",
    "Tienda / Grocery": "Store / Grocery", "Otro alimento": "Other food", "Institucional": "Institutional",
    "Mexicana": "Mexican", "Italiana / Pizza": "Italian / Pizza", "Asiática": "Asian", "Steak / Grill / BBQ": "Steak / Grill / BBQ", "Mediterránea / Medio Oriente": "Mediterranean / Middle Eastern",
    "Latinoamericana": "Latin American", "Americana / Comfort": "American / Comfort", "Africana / Etíope": "African / Ethiopian", "Europea / Bistro": "European / Bistro",
    "Café / Postres": "Café / Desserts", "Otra / Sin identificar": "Other / Unidentified",
    "Tiene comedor / servicio en sitio": "Has a dining room / on-site service", "Café/bebidas: candidato a vino y cerveza": "Café/drinks: beer and wine candidate",
    "Tienda: candidata a Package Goods": "Store: Package Goods candidate", "El nombre indica restaurante/bar": "Name suggests restaurant/bar",
    "Tiene patio exterior sin licencia de licor": "Has an outdoor patio with no liquor license", "Tiene entretenimiento / música": "Has entertainment / music",
    "Negocio nuevo (≤ 24 meses)": "New business (≤ 24 months)", "Zona con alta densidad de restaurantes con licor": "Area with a high density of licensed restaurants",
    "Última inspección aprobada": "Passed last inspection", "Cadena / franquicia (gestión corporativa)": "Chain / franchise (corporate managed)", "Institución (escuela, hospital, etc.)": "Institution (school, hospital, etc.)",
    "Package Goods (venta para llevar)": "Package Goods (take-out sales)", "Package Goods o Incidental Activity": "Package Goods or Incidental Activity",
    "Restaurante con licencia": "Licensed restaurant", "Bar / Tavern": "Bar / Tavern", "Tienda (Package Goods)": "Store (Package Goods)",
    "Licencia de licor": "Liquor license", "Layout y merchandising": "Layout and merchandising", "Capacitación BASSET": "BASSET training", "Permisos y zonificación": "Permits and zoning",
    "Seguro / dram shop": "Insurance / dram shop", "Otro": "Other", "Vino": "Wine", "Espumoso": "Sparkling", "Whisky / Bourbon": "Whisky / Bourbon", "Ron": "Rum",
    "Coñac / Brandy": "Cognac / Brandy", "Licor": "Liqueur", "Cerveza": "Beer", "Sidra": "Cider", "Sidra / Seltzer / RTD": "Cider / Seltzer / RTD", "Cóctel / RTD": "Cocktail / RTD",

    // ---------- Marketplace público ----------
    "Expertos en licencias de licor — Alex Solutions": "Liquor license experts — Alex Solutions", "Encuentra al experto ideal para tu licencia": "Find the right expert for your license",
    "Gestores verificados en licencias de licor, layout, BASSET y permisos en Chicago. Compara, reserva y califica.": "Verified liquor license, layout, BASSET and permit specialists in Chicago. Compare, book and review.",
    "Qué necesitas": "What you need", "Cualquier servicio": "Any service", "Dónde": "Where", "Barrio o zona (ej. Pilsen)": "Neighborhood or area (e.g. Pilsen)", "Nombre o palabra clave": "Name or keyword",
    "¿Eres gestor o consultor?": "Are you a consultant?", "Publica tus servicios, recibe reservas de restaurantes y tiendas de Chicago y crece con reseñas verificadas.": "List your services, get bookings from Chicago restaurants and stores, and grow with verified reviews.",
    "Ofrece tus servicios →": "Offer your services →", "Ofrece tus servicios": "Offer your services", "Buscar expertos": "Find experts", "🏅 Experto destacado": "🏅 Featured expert",
    "No hay expertos con esos filtros todavía.": "No experts match those filters yet.", "¿Quieres ser el primero?": "Want to be the first?",
    "· Marketplace de expertos en licencias de licor y layout · Chicago": "· Liquor license and layout expert marketplace · Chicago",
    "Experto — Alex Solutions": "Expert — Alex Solutions", "Este experto no está disponible.": "This expert is not available.",
    "Aún no hay reseñas. Solo los clientes con un servicio completado pueden reseñar (reseñas verificadas).": "No reviews yet. Only clients with a completed service can leave a review (verified reviews).",
    "Solicita una reserva": "Request a booking", "Fecha preferida": "Preferred date", "Tu nombre": "Your name", "Dirección del local": "Business address", "Solicitar reserva": "Request booking",
    "Nombre de tu restaurante o tienda": "Your restaurant or store name", "Cuéntanos sobre tu negocio y lo que necesitas": "Tell us about your business and what you need",
    "No se cobra nada ahora. Recibirás un enlace privado para seguir tu reserva.": "Nothing is charged now. You'll get a private link to track your booking.", "Enviando…": "Sending…",
    "Tu reserva — Alex Solutions": "Your booking — Alex Solutions", "Reserva no encontrada.": "Booking not found.", "¡Solicitud enviada!": "Request sent!",
    "Guarda este enlace para seguir tu reserva:": "Save this link to track your booking:", "Estado:": "Status:", "Ver perfil": "View profile", "Cancelar reserva": "Cancel booking",
    "Buscar otro experto": "Find another expert", "Tu reseña": "Your review", "Califica el servicio": "Rate the service", "Publicar reseña": "Post review",
    "¿Cómo fue tu experiencia?": "How was your experience?", "Por cotizar": "To be quoted", "Flexible": "Flexible",
    "El experto revisará tu solicitud y la aceptará o te propondrá otra fecha.": "The expert will review your request and accept it or propose another date.",
    "¡Confirmada! Ya puedes contactar directamente al experto.": "Confirmed! You can now contact the expert directly.", "Servicio completado. ¡Cuéntanos cómo te fue!": "Service completed. Tell us how it went!",
    "El experto no pudo tomar esta reserva. Busca otro experto disponible.": "The expert couldn't take this booking. Find another available expert.", "Cancelaste esta reserva.": "You cancelled this booking.",
    "Ofrece tus servicios — Alex Solutions Expertos": "Offer your services — Alex Solutions Experts", "Para gestores y consultores": "For consultants and specialists",
    "Ofrece tus servicios en Alex Solutions": "Offer your services on Alex Solutions",
    "Publica tu perfil, recibe solicitudes de restaurantes y tiendas de Chicago que necesitan licencia de licor, layout o capacitación, y construye tu reputación con reseñas verificadas. Tu perfil se publica después de que Alex lo revise.": "Publish your profile, receive requests from Chicago restaurants and stores that need a liquor license, layout or training, and build your reputation with verified reviews. Your profile goes live after Alex reviews it.",
    "Tu perfil": "Your profile", "Nombre completo *": "Full name *", "Correo *": "Email *", "Años de experiencia": "Years of experience", "Titular (una línea)": "Headline (one line)",
    "Acerca de ti": "About you", "Zonas que atiendes (separadas por coma)": "Areas you serve (comma-separated)", "Foto (URL https, opcional)": "Photo (https URL, optional)",
    "Servicios *": "Services *", "+ Agregar servicio": "+ Add service", "Enviar solicitud": "Submit application", "¡Solicitud recibida!": "Application received!", "Este es tu": "This is your",
    "enlace privado": "private link", "para administrar tu perfil y tus reservas. Guárdalo: es tu llave de acceso.": "to manage your profile and bookings. Save it: it's your access key.",
    "Abrir mi panel": "Open my dashboard", "Ej.: Gestor de licencias de licor en el South Side": "E.g.: Liquor license consultant on the South Side", "Quitar servicio": "Remove service",
    "Ej.: Licencia Incidental Activity": "E.g.: Incidental Activity license", "Ej.: 4–8 semanas": "E.g.: 4–8 weeks", "USD": "USD",
    "Mi panel de experto — Alex Solutions": "My expert dashboard — Alex Solutions", "Enlace inválido.": "Invalid link.",
    "⏳ Tu perfil está en revisión. Alex lo aprobará pronto; mientras, puedes completarlo.": "⏳ Your profile is under review. Alex will approve it soon; meanwhile, you can complete it.",
    "Tu solicitud no fue aprobada.": "Your application was not approved.", "Tu perfil está pausado y no aparece en búsquedas.": "Your profile is paused and doesn't appear in searches.",
    "✅ Tu perfil está publicado:": "✅ Your profile is live:", "ver mi perfil público →": "view my public profile →", "solicitudes nuevas": "new requests", "en curso": "in progress",
    "Aceptar": "Accept", "Marcar como completada": "Mark as completed", "Aún no tienes reservas.": "You don't have bookings yet.", "Mi perfil": "My profile",
    "Correo (visible al aceptar)": "Email (visible once accepted)", "Teléfono (visible al aceptar)": "Phone (visible once accepted)", "Foto (URL https)": "Photo (https URL)",
    "Guardar perfil": "Save profile", "Perfil guardado ✓": "Profile saved ✓", "Precio final USD": "Final price USD",
    "Licencias de licor y layout para restaurantes y tiendas en Chicago": "Liquor licenses and layout for restaurants and stores in Chicago",
    "Fundador de Alex Solutions, Inc. Acompaño a restaurantes, taquerías, cafés y tiendas de Chicago en todo el trámite de su licencia de licor: diagnóstico de la ubicación, expediente, seguro, capacitación BASSET e inspecciones. También diseño el layout de tiendas de Fine Wine & Spirits y barras para que cada botella se venda sola.": "Founder of Alex Solutions, Inc. I guide Chicago restaurants, taquerias, cafés and stores through the entire liquor license process: location assessment, application, insurance, BASSET training and inspections. I also design the layout of Fine Wine & Spirits stores and bars so every bottle sells itself.",
    "Toda la ciudad de Chicago": "All of Chicago", "Español": "Spanish", "Diagnóstico de ubicación": "Location assessment",
    "Revisamos zonificación, posibles moratorias y el tipo de licencia ideal para tu negocio.": "We review zoning, possible moratoriums and the right license type for your business.",
    "Licencia Consumption on Premises – Incidental Activity": "Consumption on Premises – Incidental Activity license", "Para restaurantes: expediente, documentos, seguro, BASSET y seguimiento hasta la aprobación.": "For restaurants: application, documents, insurance, BASSET and follow-up until approval.",
    "Licencia Package Goods": "Package Goods license", "Para tiendas y groceries que quieren vender vino, cerveza y licores para llevar.": "For stores and groceries that want to sell wine, beer and spirits to go.",
    "Layout de tienda Fine Wine & Spirits": "Fine Wine & Spirits store layout", "Plano con zonas, planograma, escalera de precios y vitrina premium.": "Floor plan with zones, planogram, price ladder and premium case.",
    "Trámite completo": "Full process", "2–6 semanas": "2–6 weeks",

    // ---------- Contacto y QR ----------
    "Contacto — Alex Solutions, Inc": "Contact — Alex Solutions, Inc", "Teléfono y correo aún no configurados.": "Phone and email not set up yet.", "Licencias de licor": "Liquor licenses",
    "Gestión completa del trámite en Chicago": "Full license management in Chicago", "Fine Wine & Spirits: plano, estantería y diagnóstico": "Fine Wine & Spirits: floor plan, shelving and assessment",
    "Abrir esta tarjeta": "Open this card", "Escanea para ver la tarjeta en tu celular": "Scan to see the card on your phone", "⬇ Descargar PNG": "⬇ Download PNG",
    "Guardar contacto": "Save contact", "Escanea para agregarlo a tus contactos (sin internet)": "Scan to add it to your contacts (no internet needed)", "📞 Llamar": "📞 Call",
    "✉️ Correo": "✉️ Email", "🍷 Asesoría": "🍷 Consulting", "⬇ Guardar contacto": "⬇ Save contact", "Tarjeta de contacto": "Contact card",
    "Licencias de licor y layout para restaurantes y tiendas de vinos y licores": "Liquor licenses and layout for restaurants and wine & spirits stores",
    "Abrir en el teléfono — Alex Solutions": "Open on your phone — Alex Solutions", "Escanea con la cámara de tu teléfono": "Scan with your phone's camera",
    "Apunta la cámara al código y toca el enlace que aparece.": "Point the camera at the code and tap the link that appears.", "Mi panel": "My dashboard",
    "Prospectos, marketplace, distribuidores y asistente (pide usuario y contraseña)": "Prospects, marketplace, distributors and assistant (requires username and password)",
    "Página principal": "Home page", "La página pública de Alex Solutions, Inc": "Alex Solutions, Inc's public page", "Buscar y reservar expertos": "Find and book experts", "Mi tarjeta": "My card",
    "Tarjeta de contacto para compartir": "Contact card to share",

    // ---------- Guía de layout ----------
    "Asesoría de layout — Alex Solutions, Inc": "Layout consulting — Alex Solutions, Inc", "Plano": "Floor plan", "Estantería": "Shelving", "Principios": "Principles",
    "Espacio vs. ventas": "Space vs. sales", "Diagnóstico": "Assessment", "Plan de acción": "Action plan", "Solicitar asesoría": "Request consulting",
    "Layout & merchandising · Fine Wine & Spirits": "Layout & merchandising · Fine Wine & Spirits", "Cada botella donde": "Every bottle where", "se vende sola": "it sells itself",
    "Transformamos tu tienda de vinos y licores en un espacio que atrae, guía y vende. Zonas estratégicas, estantes que destacan tus productos premium y cada metro trabajando para ti.": "We turn your wine and spirits store into a space that attracts, guides and sells. Strategic zones, shelves that showcase your premium products and every foot working for you.",
    "Ver el plano ideal": "See the ideal floor plan", "Clientes nuevos y actuales": "New and existing clients", "Plano interactivo": "Interactive floor plan",
    "Derecha": "Right", "Hacia donde gira la mayoría de clientes al entrar: ahí van las novedades.": "Where most customers turn when they walk in: that's where new arrivals go.",
    "Altura de los ojos: el estante que más vende. Pon ahí lo de mayor margen.": "Eye level: the best-selling shelf. Put your highest-margin items there.",
    "Lo que un cliente le dedica a un estante. La señalización tiene que ser clara.": "How long a customer spends on a shelf. Signage has to be clear.", "Al fondo": "In the back",
    "Los productos que el cliente siempre busca (frío, cerveza) para que recorra toda la tienda.": "The products customers always look for (cold drinks, beer) so they walk the whole store.",
    "Empieza aquí": "Start here", "¿Cuál es tu situación?": "What's your situation?", "Cliente nuevo": "New client", "Voy a abrir o remodelar mi tienda": "I'm opening or remodeling my store",
    "Diseñemos el layout desde cero: flujo del cliente, zonas, mobiliario y surtido inicial.": "Let's design the layout from scratch: customer flow, zones, fixtures and initial assortment.",
    "Cliente actual": "Existing client", "Ya tengo tienda y quiero vender más": "I already have a store and want to sell more",
    "Diagnostiquemos lo que tienes, reubiquemos categorías y recuperemos espacio que no está rindiendo.": "Let's assess what you have, relocate categories and recover underperforming space.",
    "1 · El plano de la tienda": "1 · The store floor plan", "Diseña el recorrido antes de llenar los estantes": "Design the path before filling the shelves",
    "Toca cada zona del plano para ver qué colocar ahí, por qué funciona y el error más común. La línea dorada es el recorrido ideal del cliente.": "Tap each zone on the plan to see what to place there, why it works and the most common mistake. The gold line is the ideal customer path.",
    "Entrada": "Entrance", "Muro de": "Power", "poder": "wall", "Vinos": "Wines", "por país": "by country", "Sala de vinos finos": "Fine wine room",
    "Refrigerados · cerveza · espumosos": "Coolers · beer · sparkling", "Destilados": "Spirits", "por": "by", "categoría": "category", "Góndolas + cabeceras": "Gondolas + endcaps",
    "Premium": "Premium", "Caja · impulso": "Checkout · impulse", "Cata y": "Tasting &", "regalos": "gifts",
    "Por qué": "Why", "Qué colocar": "What to place", "Error común:": "Common mistake:",
    "2 · La estantería": "2 · Shelving", "\"A la altura de los ojos, a la altura de la compra\"": "\"Eye level is buy level\"",
    "No todos los niveles de un estante venden igual. Toca cada nivel para ver qué colocar y qué parte aproximada de las ventas de esa sección suele generar.": "Not every shelf level sells the same. Tap each level to see what to place and roughly what share of that section's sales it usually generates.",
    "de las ventas de la sección (referencia aproximada)": "of the section's sales (approximate reference)",
    "3 · Reglas de oro": "3 · Golden rules", "Seis principios que aplican a cualquier tienda": "Six principles that apply to any store",
    "Bloques verticales de marca": "Vertical brand blocks", "Coloca cada marca o variedad en una columna de arriba a abajo, no en filas horizontales. El ojo recorre el estante de izquierda a derecha y así ve más opciones en menos tiempo.": "Place each brand or variety in a top-to-bottom column, not in horizontal rows. The eye scans the shelf left to right and sees more options in less time.",
    "Escalera de precios": "Price ladder", "Dentro de cada categoría, ordena de menor a mayor precio en el sentido del recorrido (bueno → mejor → excelente). El cliente \"sube\" de precio sin darse cuenta.": "Within each category, order from lowest to highest price along the path (good → better → best). Customers \"trade up\" without noticing.",
    "Shelf talkers que venden": "Shelf talkers that sell", "Tarjetas cortas con puntaje, maridaje o \"recomendado por el equipo\". Una buena nota en el estante puede subir notablemente las ventas de ese producto.": "Short cards with scores, pairings or \"staff pick\". A good shelf note can noticeably lift that product's sales.",
    "Rotación por temporada": "Seasonal rotation", "Cambia cabeceras y el muro de poder cada 4–6 semanas: rosados en verano, tintos robustos y espumosos en fin de año, regalos en fechas especiales.": "Change endcaps and the power wall every 4–6 weeks: rosés in summer, bold reds and sparkling at year-end, gifts on special dates.",
    "Frentes según ventas": "Facings by sales", "Los productos que más venden merecen más frentes (botellas visibles de cara). Un producto con un solo frente que nunca se agota está ocupando espacio de más.": "Top sellers deserve more facings (bottles facing forward). A product with one facing that never sells out is taking up too much space.",
    "Cuida el producto y la ley": "Protect the product and follow the law", "Vino fino lejos de luz directa y calor; botellas acostadas si tienen corcho. Revisa las normas locales de exhibición, venta y verificación de edad para alcohol.": "Keep fine wine away from direct light and heat; lay corked bottles down. Check local rules on alcohol display, sales and age verification.",
    "4 · Calculadora de espacio": "4 · Space calculator", "¿Cada categoría tiene el espacio que se gana?": "Does each category get the space it earns?",
    "Escribe qué porcentaje de tus ventas genera cada categoría y cuántos metros lineales de estante ocupa hoy. La calculadora te dice cuánto espacio le corresponde según lo que vende. Los números de ejemplo son ilustrativos: reemplázalos con los tuyos.": "Enter what percentage of your sales each category generates and how many linear meters of shelf it uses today. The calculator tells you how much space it deserves based on what it sells. The sample numbers are illustrative: replace them with yours.",
    "Metros lineales totales": "Total linear meters", "Peso del margen (0 = solo ventas)": "Margin weight (0 = sales only)", "% ventas": "% sales", "% margen bruto": "% gross margin",
    "Metros hoy": "Meters today", "Recomendado": "Recommended", "Cambio": "Change", "Hoy vs. recomendado": "Today vs. recommended", "Total": "Total",
    "Barra gris = espacio actual · línea de color = espacio recomendado. Se recomienda mover espacio de forma gradual (no más de 20–30% por categoría a la vez) y medir ventas 4–8 semanas después.": "Gray bar = current space · colored line = recommended space. Move space gradually (no more than 20–30% per category at a time) and measure sales 4–8 weeks later.",
    "Vino tinto": "Red wine", "Vino blanco y rosado": "White and rosé wine", "Espumosos": "Sparkling", "Vinos finos (+$50)": "Fine wines ($50+)", "Whisky": "Whisky",
    "Tequila / mezcal": "Tequila / mezcal", "Vodka / gin": "Vodka / gin", "Ron / otros": "Rum / other", "Cerveza y RTD": "Beer and RTD",
    "5 · Autodiagnóstico": "5 · Self-assessment", "¿Qué tan optimizada está tu tienda?": "How optimized is your store?",
    "Marca lo que ya haces. Tus respuestas se guardan en este navegador para que puedas volver y ver tu avance.": "Check what you already do. Your answers are saved in this browser so you can come back and see your progress.",
    "Empecemos": "Let's start", "Tus 3 prioridades:": "Your top 3 priorities:", "Reiniciar": "Reset", "Tienda optimizada": "Optimized store", "Buen camino": "On the right track",
    "Con potencial": "Has potential", "Gran oportunidad de mejora": "Big room for improvement", "¡Excelente! Mantén la rotación y mide resultados cada mes.": "Excellent! Keep rotating and measure results every month.",
    "Recorrido y zonas": "Path and zones", "Organización del producto": "Product organization", "Visibilidad y venta": "Visibility and sales", "Gestión": "Management",
    "La entrada está despejada (sin cajas ni exhibidores en los primeros 2 m)": "The entrance is clear (no boxes or displays in the first 2 m)",
    "El muro a la derecha de la entrada tiene novedades o promociones": "The wall to the right of the entrance has new arrivals or promotions",
    "Los refrigerados/cerveza están al fondo de la tienda": "Coolers/beer are in the back of the store", "Los pasillos miden al menos 1.2 m y no tienen obstáculos": "Aisles are at least 1.2 m wide and free of obstacles",
    "Los vinos están organizados por país/región con señalización clara": "Wines are organized by country/region with clear signage", "Los destilados están agrupados por categoría (whisky, tequila…)": "Spirits are grouped by category (whisky, tequila…)",
    "Dentro de cada sección hay escalera de precios (menor → mayor)": "Each section has a price ladder (low → high)", "El nivel de los ojos tiene los productos de mayor margen": "Eye level holds the highest-margin products",
    "Uso shelf talkers con puntajes, maridajes o recomendaciones": "I use shelf talkers with scores, pairings or recommendations", "Los productos premium están exhibidos (no guardados) y con precio visible": "Premium products are displayed (not stored away) with visible prices",
    "Cada cabecera tiene un solo mensaje y cambia cada 4–6 semanas": "Each endcap has one message and changes every 4–6 weeks", "La caja tiene productos de impulso (miniaturas, accesorios)": "Checkout has impulse items (minis, accessories)",
    "Reviso que el espacio de cada categoría corresponda a sus ventas": "I check that each category's space matches its sales", "Reviso agotados y huecos en el estante al menos una vez por semana": "I check out-of-stocks and shelf gaps at least once a week",
    "El vino fino está lejos de luz directa y calor, acostado si tiene corcho": "Fine wine is away from direct light and heat, lying down if corked",
    "Despeja los primeros 2–3 m de la entrada.": "Clear the first 2–3 m of the entrance.", "Convierte el muro derecho en tu \"muro de poder\" con novedades.": "Turn the right wall into your \"power wall\" with new arrivals.",
    "Mueve los refrigerados al fondo para que recorran la tienda.": "Move the coolers to the back so customers walk the store.", "Amplía pasillos a 1.2 m mínimo y retira obstáculos.": "Widen aisles to at least 1.2 m and remove obstacles.",
    "Organiza los vinos por país/región y pon letreros grandes.": "Organize wines by country/region and add large signs.", "Agrupa los destilados por categoría, no por proveedor.": "Group spirits by category, not by supplier.",
    "Ordena cada sección de menor a mayor precio.": "Order each section from lowest to highest price.", "Sube los productos de mayor margen al nivel de los ojos.": "Move the highest-margin products to eye level.",
    "Agrega shelf talkers en tus 20 productos clave.": "Add shelf talkers to your 20 key products.", "Exhibe los premium en vitrina iluminada con precio visible.": "Display premium items in a lit case with visible prices.",
    "Define un tema por cabecera y un calendario de rotación.": "Set one theme per endcap and a rotation calendar.", "Aprovecha la caja con miniaturas y accesorios.": "Use checkout for minis and accessories.",
    "Usa la calculadora de espacio y ajusta cada trimestre.": "Use the space calculator and adjust every quarter.", "Haz un recorrido semanal de agotados y huecos.": "Do a weekly walk for out-of-stocks and gaps.",
    "Protege el vino fino de luz y calor; acuéstalo.": "Protect fine wine from light and heat; lay it down.",
    "6 · Plan de acción": "6 · Action plan", "Paso a paso según tu situación": "Step by step for your situation",
    "Semana 1–2": "Week 1–2", "Semana 3–4": "Week 3–4", "Semana 5–6": "Week 5–6", "Apertura +30 días": "Opening +30 days", "Semana 1": "Week 1", "Semana 2": "Week 2", "Semana 3–6": "Week 3–6", "Mes 2–3": "Month 2–3",
    "Descubrimiento": "Discovery", "Diseño del layout": "Layout design", "Surtido y planograma": "Assortment and planogram", "Lanzamiento y ajuste": "Launch and adjustment",
    "Victorias rápidas": "Quick wins", "Reorganización": "Reorganization", "Medir y mantener": "Measure and maintain",
    "Perfil del cliente de tu zona y competencia": "Customer profile for your area and competition", "Medidas del local, entrada, luz y tomas eléctricas": "Store measurements, entrance, lighting and outlets",
    "Presupuesto y metas de ventas": "Budget and sales goals", "Plano con zonas y recorrido": "Floor plan with zones and path", "Mobiliario: estantes, refrigeradores, vitrina premium": "Fixtures: shelves, coolers, premium case",
    "Plan de iluminación y señalización": "Lighting and signage plan", "Mezcla de categorías y escalera de precios": "Category mix and price ladder", "Asignación de espacio por categoría": "Space allocation by category",
    "Planograma estante por estante": "Shelf-by-shelf planogram", "Montaje y capacitación del equipo": "Setup and team training", "Medir ventas por zona las primeras semanas": "Measure sales by zone in the first weeks",
    "Primer ajuste de espacio y cabeceras": "First adjustment of space and endcaps", "Autodiagnóstico de esta página": "This page's self-assessment", "Reporte de ventas y margen por categoría": "Sales and margin report by category",
    "Fotos de cada sección y recorrido actual": "Photos of each section and the current path", "Despejar entrada y activar muro de poder": "Clear the entrance and activate the power wall",
    "Shelf talkers en productos clave": "Shelf talkers on key products", "Subir alto margen al nivel de los ojos": "Move high margin to eye level", "Reasignar espacio con la calculadora": "Reallocate space with the calculator",
    "Reordenar vinos por país y destilados por categoría": "Reorder wines by country and spirits by category", "Crear o mejorar la vitrina premium": "Create or improve the premium case",
    "Comparar ventas antes vs. después": "Compare sales before vs. after", "Calendario de rotación de cabeceras": "Endcap rotation calendar", "Revisión trimestral de espacio y surtido": "Quarterly space and assortment review",
    "7 · Siguiente paso": "7 · Next step", "Prepara tu solicitud de asesoría": "Prepare your consulting request",
    "Completa los datos de tu tienda. Generamos un resumen (incluye tu puntaje del diagnóstico) que puedes copiar, imprimir o enviar a tu asesor.": "Fill in your store details. We generate a summary (including your assessment score) you can copy, print or send to your consultant.",
    "Nombre de la tienda": "Store name", "Ciudad": "City", "Tipo de cliente": "Client type", "Nuevo (apertura/remodelación)": "New (opening/remodel)", "Actual (optimización)": "Existing (optimization)",
    "Tamaño aproximado (m²)": "Approximate size (m²)", "N.º aproximado de productos (SKU)": "Approximate number of products (SKU)", "Mayor reto": "Biggest challenge",
    "Poca visibilidad de productos premium": "Low visibility of premium products", "Tienda desordenada / difícil de recorrer": "Cluttered store / hard to navigate", "Inventario que no rota": "Inventory that doesn't turn",
    "Ticket promedio bajo": "Low average check", "Falta de espacio": "Lack of space", "Notas adicionales": "Additional notes",
    "Ej.: queremos una sala de vinos finos, tenemos 3 refrigeradores, la entrada está a la izquierda…": "E.g.: we want a fine wine room, we have 3 coolers, the entrance is on the left…",
    "Generar resumen": "Generate summary", "Imprimir": "Print", "Copiado ✓": "Copied ✓", "Selecciona y copia manualmente": "Select and copy manually",
    "Asesoría de layout y merchandising para Fine Wine & Spirits. © 2026.": "Layout and merchandising consulting for Fine Wine & Spirits. © 2026.",
    "Guía orientativa de merchandising. Los porcentajes son referencias generales de la industria minorista; los resultados dependen de cada tienda. Verifica siempre la normativa local sobre venta y exhibición de bebidas alcohólicas.": "Merchandising guidance only. Percentages are general retail industry references; results depend on each store. Always check local regulations on alcohol sales and display.",
    "Licencias de licor": "Liquor licenses", "Cambiar tema claro u oscuro": "Toggle light or dark theme", "Secciones": "Sections",
    // zonas del plano
    "Entrada y zona de descompresión": "Entrance and decompression zone", "Los primeros 2–3 metros el cliente se está adaptando al espacio y casi no mira productos. Lo que pongas aquí se pierde.": "In the first 2–3 meters customers are adjusting to the space and barely look at products. Whatever you put here gets lost.",
    "Piso despejado y buena iluminación": "Clear floor and good lighting", "Un solo elemento de bienvenida: pizarra con la promoción de la semana": "A single welcome element: a chalkboard with the weekly promo",
    "Canastas o carritos a mano": "Baskets or carts at hand", "Llenar la entrada de cajas y exhibidores: el cliente los esquiva y no los ve.": "Filling the entrance with boxes and displays: customers walk around them and don't see them.",
    "Muro de poder (a la derecha)": "Power wall (on the right)", "La mayoría de los clientes gira a la derecha al entrar. Es el primer estante que realmente miran.": "Most customers turn right when they enter. It's the first shelf they really look at.",
    "Novedades y productos de temporada": "New arrivals and seasonal products", "Promociones de alta rotación": "Fast-moving promotions", "Vinos con alto margen y buena historia": "High-margin wines with a good story",
    "Usar este muro para inventario lento o producto \"de relleno\".": "Using this wall for slow inventory or \"filler\" products.", "Vinos por país y región": "Wines by country and region",
    "El cliente de vino busca primero por origen (Chile, Argentina, España, Francia, Italia, EE. UU.). Organizar así reduce el tiempo de búsqueda.": "Wine shoppers search by origin first (Chile, Argentina, Spain, France, Italy, U.S.). Organizing this way cuts search time.",
    "Dentro de cada país: tintos → blancos → rosados": "Within each country: reds → whites → rosés", "Dentro de cada estilo: precio de menor a mayor": "Within each style: price from low to high",
    "Señalización grande con el país arriba del estante": "Large signage with the country above the shelf", "Mezclar orden por varietal y por país en la misma sección: confunde.": "Mixing varietal and country order in the same section: it's confusing.",
    "Los vinos de alto valor necesitan temperatura controlada y una sensación de exclusividad que justifique el precio.": "High-value wines need controlled temperature and a sense of exclusivity that justifies the price.",
    "Botellas acostadas, poca luz directa, 12–16 °C": "Bottles lying down, little direct light, 12–16 °C", "Madera, iluminación cálida y pocas etiquetas por estante": "Wood, warm lighting and few labels per shelf",
    "Fichas con añada, puntaje y maridaje": "Cards with vintage, score and pairing", "Poner vinos de colección junto a la ventana o bajo luz fluorescente fuerte.": "Putting collectible wines next to the window or under harsh fluorescent light.",
    "Refrigerados al fondo": "Coolers in the back", "Cerveza fría, espumosos y blancos fríos son \"productos destino\": el cliente va a buscarlos sí o sí. Al fondo, recorre toda la tienda para llegar.": "Cold beer, sparkling and chilled whites are \"destination products\": customers will go get them no matter what. In the back, they walk the whole store to reach them.",
    "Cerveza, sidras y bebidas listas para tomar": "Beer, ciders and ready-to-drink beverages", "Espumosos y blancos fríos para consumo inmediato": "Sparkling and chilled whites for immediate consumption", "Hielo y mixers cerca": "Ice and mixers nearby",
    "Poner los refrigeradores junto a la puerta: el cliente compra y se va sin ver nada más.": "Putting coolers by the door: customers buy and leave without seeing anything else.",
    "Destilados por categoría": "Spirits by category", "En licores el cliente piensa primero en la categoría (whisky, tequila, ron, vodka, gin) y después en la marca.": "With spirits, customers think category first (whisky, tequila, rum, vodka, gin) and brand second.",
    "Una sección por categoría con señalización clara": "One section per category with clear signage", "Escalera de precios: económico a la izquierda, premium a la derecha": "Price ladder: value on the left, premium on the right",
    "Mixers y cristalería al lado (venta cruzada)": "Mixers and glassware next to it (cross-selling)", "Ordenar por proveedor o distribuidor en lugar de por lo que busca el cliente.": "Ordering by supplier or distributor instead of by what customers look for.",
    "Góndolas centrales y cabeceras": "Center gondolas and endcaps", "Las cabeceras (los extremos de cada góndola) se ven desde los pasillos principales y venden varias veces más que el centro del pasillo.": "Endcaps (the ends of each gondola) are visible from the main aisles and sell several times more than mid-aisle.",
    "Cabeceras: una sola idea por cabecera (\"Vinos para asado\", \"Top 10 menos de $15\")": "Endcaps: one idea per endcap (\"Wines for BBQ\", \"Top 10 under $15\")", "Góndolas: categorías de volumen y vino de precio medio": "Gondolas: volume categories and mid-priced wine",
    "Pasillos de al menos 1.2 m para circular cómodo": "Aisles at least 1.2 m wide for comfortable flow", "Cabeceras saturadas con muchas marcas diferentes y sin mensaje.": "Endcaps crowded with many different brands and no message.",
    "Vitrina premium cerrada": "Locked premium case", "Los destilados de alto valor necesitan seguridad, pero deben seguir visibles. Cerca de la caja el personal puede atenderlos.": "High-value spirits need security but must stay visible. Near checkout, staff can assist customers.",
    "Whiskies de malta, cognac, tequilas extra añejo, ediciones limitadas": "Single malts, cognac, extra añejo tequilas, limited editions", "Iluminación LED dentro de la vitrina": "LED lighting inside the case",
    "Precio visible: el cliente no pregunta lo que cree que no puede pagar": "Visible price: customers don't ask about what they think they can't afford", "Guardarlos en bodega o detrás del mostrador sin exhibir: no se venden.": "Keeping them in the stockroom or behind the counter without display: they don't sell.",
    "Caja y compras de impulso": "Checkout and impulse buys", "Mientras esperan, los clientes agregan productos pequeños y baratos. Es la última oportunidad de subir el ticket.": "While they wait, customers add small, inexpensive items. It's the last chance to raise the check.",
    "Miniaturas, chocolates, sacacorchos, bolsas de regalo": "Minis, chocolates, corkscrews, gift bags", "Vino de la semana a precio especial": "Wine of the week at a special price", "Tarjetas de regalo y programa de lealtad": "Gift cards and loyalty program",
    "Dejar la caja vacía o llena de papeles: es espacio de venta perdido.": "Leaving checkout empty or cluttered with paper: it's lost selling space.", "Cata, experiencia y regalos": "Tasting, experience and gifts",
    "Probar un vino aumenta mucho la probabilidad de compra y crea clientes fieles. Los regalos aumentan el ticket promedio.": "Tasting a wine greatly increases the likelihood of purchase and builds loyal customers. Gifts raise the average check.",
    "Mesa de degustación (si la ley local lo permite)": "Tasting table (if local law allows)", "Estuches, cajas de regalo y kits armados": "Gift sets, gift boxes and pre-made kits", "Calendario de catas y eventos visible": "Visible tasting and event calendar",
    "Una zona de cata sin personal ni producto disponible para comprar al lado.": "A tasting area with no staff or product available to buy nearby.",
    // niveles
    "Superior": "Top", "Ojos": "Eye level", "Manos": "Hand level", "Inferior": "Bottom", "Zona de \"estirarse\". Se ve de lejos, pero cuesta alcanzarla.": "\"Reach\" zone. Visible from afar but hard to reach.",
    "Botellas de exhibición y marca": "Display and brand bottles", "Formatos especiales y estuches": "Special formats and gift sets", "Señalización de la categoría": "Category signage",
    "El nivel que más vende. Es tu espacio más valioso: úsalo para lo que deja más ganancia.": "The best-selling level. It's your most valuable space: use it for what earns the most.",
    "Productos de mayor margen": "Highest-margin products", "Recomendaciones del equipo": "Staff recommendations", "Marcas que quieres impulsar": "Brands you want to push",
    "Fácil de tomar sin esfuerzo. Ideal para lo que el cliente ya conoce y busca.": "Easy to grab. Ideal for what customers already know and look for.", "Los más vendidos": "Best sellers", "Marcas líderes reconocidas": "Recognized leading brands", "Precio medio": "Mid price",
    "Hay que agacharse. Lo compra quien ya sabe lo que quiere.": "You have to bend down. Bought by people who already know what they want.", "Formatos grandes y magnum": "Large formats and magnums",
    "Cajas y packs": "Cases and packs", "Productos económicos y de volumen": "Value and volume products",
  };

  const P = [
    [/^([\d,]+) (licores|vinos|cervezas) encontrados en la TTB(?: \(de ([\d,]+) productos con ese nombre en todas las categorías\))?\. Clic en uno para ver distribuidor y cuentas\.$/, (m, n, c, all) => `${n} ${{ licores: "liquors", vinos: "wines", cervezas: "beers" }[c]} found in the TTB registry${all ? ` (of ${all} products with that name across all categories)` : ""}. Click one to see distributor and accounts.`],
    [/^Mostrando los (licores|vinos|cervezas) más recientes del radar\. Escribe una marca para buscar en todo el registro\.$/, (m, c) => `Showing the most recent ${{ licores: "liquors", vinos: "wines", cervezas: "beers" }[c]} from the radar. Type a brand to search the whole registry.`],
    [/^Buscar "(.+)" en proveedores:$/, 'Search "$1" with suppliers:'],
    [/^Página (\d+) de ([\d,]+)$/, "Page $1 of $2"], [/^([\d,]+) prospectos encontrados$/, "$1 prospects found"],
    [/^([\d,]+) productos · página (\d+) de ([\d,]+)$/, "$1 products · page $2 of $3"], [/^Cocina (.+): alta afinidad con bebidas$/, (m, c) => `${t(c)} cuisine: high drink affinity`],
    [/^Datos: (.+?)( · actualizando…)?$/, (m, d, u) => `Data: ${d}${u ? " · updating…" : ""}`], [/^licencias activas analizadas \(([\d,]+) ubicaciones\)$/, "active licenses analyzed ($1 locations)"],
    [/^negocios de comida · ([\d,]+) ya tienen licor \(([\d.]+)%\)$/, "food businesses · $1 already have liquor ($2%)"], [/^prioridad alta \(A\) · ([\d,]+) media \(B\)$/, "high priority (A) · $1 medium (B)"],
    [/^de restaurantes de (.+) tienen licencia$/, "of restaurants in $1 are licensed"], [/^% de restaurantes de (.+) tienen licencia$/, "% of restaurants in $1 are licensed"],
    [/^expertos publicados · (\d+) pendientes$/, "published experts · $1 pending"], [/^reservas · (\d+) abiertas$/, "bookings · $1 open"],
    [/^comisión ganada \((\d+)% de (.+)\)$/, "commission earned ($1% of $2)"], [/^servicios completados · (\d+) reseñas$/, "completed services · $1 reviews"],
    [/^ganado \(neto, después del (\d+)%\)$/, "earned (net, after $1%)"], [/^(\d+) reseñas$/, "$1 reviews"], [/^Hola, (.+) 👋$/, "Hi, $1 👋"],
    [/^Reserva con (.+)$/, "Booking with $1"], [/^(\d+) años de experiencia$/, "$1 years of experience"], [/^Desde (\$[\d,]+)$/, "From $1"],
    [/^(\d+) negocios con licencia de licor$/, "$1 businesses with a liquor license"], [/^([\d,]+) negocios con licencia de licor$/, "$1 businesses with a liquor license"],
    [/^Encajan por tipo: (.+)$/, (m, l) => "Fit by type: " + l.split(", ").map(t).join(", ")], [/^Etiqueta aprobada (.+) · (.+)$/, "Label approved $1 · $2"],
    [/^Permiso (.+)$/, "Permit $1"], [/^Investigando "(.+)" en internet…$/, 'Researching "$1" online…'], [/^Investigar "(.+)" con IA$/, 'Research "$1" with AI'],
    [/^"(.+)" no está en tu directorio\.$/, '"$1" is not in your directory.'], [/^Mostrando 150 de ([\d,]+)\. Usa el filtro para encontrar más\.$/, "Showing 150 of $1. Use the filter to find more."],
    [/^· ([\d,]+) empresas con permiso federal de mayorista \(TTB, (.+)\)$/, "· $1 companies with a federal wholesaler permit (TTB, $2)"],
    [/^Última actualización: (.+)\.$/, "Last update: $1."], [/^Sin compromiso: (.+) confirma disponibilidad y precio\.$/, "No commitment: $1 confirms availability and price."],
    [/^Nivel (.+) · (.+)$/, (m, a, b) => `${t(a.charAt(0).toUpperCase() + a.slice(1))}${/ojos|manos/i.test(a) ? "" : " level"} · ${b}`], [/^(\d+)% margen · (\d+)% ventas$/, "$1% margin · $2% sales"],
    [/^Hola, ¿hablo con el dueño o gerente de ([\s\S]+)$/, null],
  ];

  function t(s) {
    if (lang !== "en" || !s) return s;
    const k = s.trim();
    if (!k) return s;
    let r = D[k];
    if (r === undefined) {
      for (const [re, f] of P) {
        const m = k.match(re);
        if (m) { if (f === null) return s; r = typeof f === "function" ? f(...m) : k.replace(re, f); break; }
      }
    }
    return r === undefined ? s : s.replace(k, r);
  }

  const ATTRS = ["placeholder", "title", "aria-label", "alt"];
  function walk(root) {
    if (root.nodeType === 3) { if (root.parentElement?.closest("[data-noi18n]")) return; const v = t(root.nodeValue); if (v !== root.nodeValue) root.nodeValue = v; return; }
    if (root.nodeType !== 1 || root.tagName === "SCRIPT" || root.tagName === "STYLE" || root.closest?.("[data-noi18n]")) return;
    for (const a of ATTRS) if (root.hasAttribute?.(a)) { const v = t(root.getAttribute(a)); if (v !== root.getAttribute(a)) root.setAttribute(a, v); }
    if (root.tagName === "INPUT" && /^(button|submit)$/i.test(root.type) && root.value) root.value = t(root.value);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n; while ((n = w.nextNode())) {
      if (n.nodeType === 3) { const p = n.parentElement; if (p && !/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.tagName) && !p.closest("[data-noi18n]")) { const v = t(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } }
      else for (const a of ATTRS) if (n.hasAttribute(a)) { const v = t(n.getAttribute(a)); if (v !== n.getAttribute(a)) n.setAttribute(a, v); }
    }
  }

  function switcher() {
    const box = document.createElement("div");
    box.setAttribute("data-noi18n", "");
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Idioma / Language");
    box.style.cssText = "position:fixed;left:14px;bottom:14px;z-index:9999;display:flex;background:#fff;border:1px solid #e7dfd2;border-radius:999px;padding:3px;box-shadow:0 6px 20px rgba(0,0,0,.18);font:600 13px Inter,system-ui,sans-serif";
    for (const [code, label] of [["es", "Español"], ["en", "English"]]) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      b.setAttribute("aria-pressed", String(code === lang));
      b.style.cssText = `border:0;border-radius:999px;padding:7px 14px;cursor:pointer;font:inherit;${code === lang ? "background:#7a1f2b;color:#fff" : "background:transparent;color:#1d1a16"}`;
      b.addEventListener("click", () => { if (code === lang) return; try { localStorage.setItem(KEY, code); } catch {} const u = new URL(location.href); u.searchParams.delete("lang"); location.href = u.toString(); });
      box.appendChild(b);
    }
    document.body.appendChild(box);
  }

  window.I18N = { lang, t };
  if (lang === "en") {
    const _c = window.confirm.bind(window), _a = window.alert.bind(window);
    window.confirm = (m) => _c(t(m)); window.alert = (m) => _a(t(m));
    Object.assign(D, { "¿Cancelar esta reserva?": "Cancel this booking?", "¿Eliminar esta marca del directorio?": "Delete this brand from the directory?" });
  }
  function start() {
    switcher();
    if (lang !== "en") return;
    document.title = t(document.title);
    walk(document.body);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "characterData") { const v = t(m.target.nodeValue); if (v !== m.target.nodeValue) m.target.nodeValue = v; }
        else if (m.type === "attributes") { const el = m.target, v = t(el.getAttribute(m.attributeName)); if (v !== el.getAttribute(m.attributeName)) el.setAttribute(m.attributeName, v); }
        else m.addedNodes.forEach(walk);
      }
      if (document.title !== t(document.title)) document.title = t(document.title);
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
