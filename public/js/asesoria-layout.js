(() => {
  const $ = s => document.querySelector(s);
  const store = {
    get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } },
    set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  };

  /* theme */
  const root = document.documentElement;
  const savedTheme = store.get('cl-theme');
  if (savedTheme) root.dataset.theme = savedTheme;
  $('#themeBtn').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    store.set('cl-theme', root.dataset.theme);
  });

  /* hero paths */
  document.querySelectorAll('.path').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.path').forEach(x => x.setAttribute('aria-pressed', x === b));
    setTab(b.dataset.path);
    $('#reqForm [name=tipo]').selectedIndex = b.dataset.path === 'nuevo' ? 0 : 1;
    $(b.dataset.path === 'nuevo' ? '#plano' : '#diagnostico').scrollIntoView();
  }));

  /* zones */
  const Z = {
    1:{t:'Entrada y zona de descompresión', why:'Los primeros 2–3 metros el cliente se está adaptando al espacio y casi no mira productos. Lo que pongas aquí se pierde.', what:['Piso despejado y buena iluminación','Un solo elemento de bienvenida: pizarra con la promoción de la semana','Canastas o carritos a mano'], err:'Llenar la entrada de cajas y exhibidores: el cliente los esquiva y no los ve.'},
    2:{t:'Muro de poder (a la derecha)', why:'La mayoría de los clientes gira a la derecha al entrar. Es el primer estante que realmente miran.', what:['Novedades y productos de temporada','Promociones de alta rotación','Vinos con alto margen y buena historia'], err:'Usar este muro para inventario lento o producto "de relleno".'},
    3:{t:'Vinos por país y región', why:'El cliente de vino busca primero por origen (Chile, Argentina, España, Francia, Italia, EE. UU.). Organizar así reduce el tiempo de búsqueda.', what:['Dentro de cada país: tintos → blancos → rosados','Dentro de cada estilo: precio de menor a mayor','Señalización grande con el país arriba del estante'], err:'Mezclar orden por varietal y por país en la misma sección: confunde.'},
    4:{t:'Sala de vinos finos', why:'Los vinos de alto valor necesitan temperatura controlada y una sensación de exclusividad que justifique el precio.', what:['Botellas acostadas, poca luz directa, 12–16 °C','Madera, iluminación cálida y pocas etiquetas por estante','Fichas con añada, puntaje y maridaje'], err:'Poner vinos de colección junto a la ventana o bajo luz fluorescente fuerte.'},
    5:{t:'Refrigerados al fondo', why:'Cerveza fría, espumosos y blancos fríos son "productos destino": el cliente va a buscarlos sí o sí. Al fondo, recorre toda la tienda para llegar.', what:['Cerveza, sidras y bebidas listas para tomar','Espumosos y blancos fríos para consumo inmediato','Hielo y mixers cerca'], err:'Poner los refrigeradores junto a la puerta: el cliente compra y se va sin ver nada más.'},
    6:{t:'Destilados por categoría', why:'En licores el cliente piensa primero en la categoría (whisky, tequila, ron, vodka, gin) y después en la marca.', what:['Una sección por categoría con señalización clara','Escalera de precios: económico a la izquierda, premium a la derecha','Mixers y cristalería al lado (venta cruzada)'], err:'Ordenar por proveedor o distribuidor en lugar de por lo que busca el cliente.'},
    7:{t:'Góndolas centrales y cabeceras', why:'Las cabeceras (los extremos de cada góndola) se ven desde los pasillos principales y venden varias veces más que el centro del pasillo.', what:['Cabeceras: una sola idea por cabecera ("Vinos para asado", "Top 10 menos de $15")','Góndolas: categorías de volumen y vino de precio medio','Pasillos de al menos 1.2 m para circular cómodo'], err:'Cabeceras saturadas con muchas marcas diferentes y sin mensaje.'},
    8:{t:'Vitrina premium cerrada', why:'Los destilados de alto valor necesitan seguridad, pero deben seguir visibles. Cerca de la caja el personal puede atenderlos.', what:['Whiskies de malta, cognac, tequilas extra añejo, ediciones limitadas','Iluminación LED dentro de la vitrina','Precio visible: el cliente no pregunta lo que cree que no puede pagar'], err:'Guardarlos en bodega o detrás del mostrador sin exhibir: no se venden.'},
    9:{t:'Caja y compras de impulso', why:'Mientras esperan, los clientes agregan productos pequeños y baratos. Es la última oportunidad de subir el ticket.', what:['Miniaturas, chocolates, sacacorchos, bolsas de regalo','Vino de la semana a precio especial','Tarjetas de regalo y programa de lealtad'], err:'Dejar la caja vacía o llena de papeles: es espacio de venta perdido.'},
    10:{t:'Cata, experiencia y regalos', why:'Probar un vino aumenta mucho la probabilidad de compra y crea clientes fieles. Los regalos aumentan el ticket promedio.', what:['Mesa de degustación (si la ley local lo permite)','Estuches, cajas de regalo y kits armados','Calendario de catas y eventos visible'], err:'Una zona de cata sin personal ni producto disponible para comprar al lado.'}
  };
  const legend = $('#legend');
  Object.keys(Z).forEach(k => {
    const b = document.createElement('button'); b.textContent = k + ' · ' + Z[k].t.split(' (')[0].split(',')[0];
    b.dataset.z = k; b.addEventListener('click', () => showZone(k)); legend.appendChild(b);
  });
  function showZone(k){
    const z = Z[k];
    document.querySelectorAll('.zone').forEach(g => g.classList.toggle('active', g.dataset.z === String(k)));
    legend.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.z === String(k)));
    $('#zonePanel').innerHTML = `<h3><span class="n">${k}</span>${z.t}</h3>
      <dl><dt>Por qué</dt><dd>${z.why}</dd>
      <dt>Qué colocar</dt><dd><ul>${z.what.map(w=>`<li>${w}</li>`).join('')}</ul></dd></dl>
      <div class="err"><b>Error común:</b> ${z.err}</div>`;
  }
  document.querySelectorAll('.zone').forEach(g => {
    g.addEventListener('click', () => showZone(g.dataset.z));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showZone(g.dataset.z); } });
  });
  showZone(2);

  /* shelf */
  const L = [
    {n:'Superior', h:'> 1.6 m', pct:'~15%', d:'Zona de "estirarse". Se ve de lejos, pero cuesta alcanzarla.', items:['Botellas de exhibición y marca','Formatos especiales y estuches','Señalización de la categoría'], c:'var(--gold)', b:[30,36,30,40,30,36]},
    {n:'Ojos', h:'1.2–1.6 m', pct:'~35%', d:'El nivel que más vende. Es tu espacio más valioso: úsalo para lo que deja más ganancia.', items:['Productos de mayor margen','Recomendaciones del equipo','Marcas que quieres impulsar'], c:'var(--accent)', b:[38,42,38,42,38,42]},
    {n:'Manos', h:'0.9–1.2 m', pct:'~30%', d:'Fácil de tomar sin esfuerzo. Ideal para lo que el cliente ya conoce y busca.', items:['Los más vendidos','Marcas líderes reconocidas','Precio medio'], c:'#9B4A5E', b:[36,36,40,36,36,40]},
    {n:'Inferior', h:'< 0.9 m', pct:'~20%', d:'Hay que agacharse. Lo compra quien ya sabe lo que quiere.', items:['Formatos grandes y magnum','Cajas y packs','Productos económicos y de volumen'], c:'var(--muted)', b:[44,44,44,44,44,44]}
  ];
  const shelf = $('#shelf');
  L.forEach((l,i) => {
    const b = document.createElement('button'); b.className = 'lvl';
    b.innerHTML = `<div><b>${l.n}</b><br><small>${l.h}</small></div><div class="bottles">${l.b.map(h=>`<i style="height:${h}px;--c:${l.c}"></i>`).join('')}</div>`;
    b.addEventListener('click', () => showLvl(i)); shelf.appendChild(b);
  });
  function showLvl(i){
    const l = L[i];
    shelf.querySelectorAll('.lvl').forEach((b,j) => b.classList.toggle('active', i===j));
    $('#lvlInfo').innerHTML = `<div class="eyebrow">Nivel ${l.n.toLowerCase()} · ${l.h}</div><div class="pct">${l.pct}</div><p class="note" style="margin-top:4px">de las ventas de la sección (referencia aproximada)</p><p>${l.d}</p><ul class="chips">${l.items.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  }
  showLvl(1);

  /* calculator */
  const defaults = [
    ['Vino tinto',30,35,14],['Vino blanco y rosado',14,35,8],['Espumosos',8,38,5],['Vinos finos (+$50)',6,42,4],
    ['Whisky',14,30,8],['Tequila / mezcal',10,30,7],['Vodka / gin',7,28,6],['Ron / otros',5,28,5],['Cerveza y RTD',6,22,3]
  ];
  let rows = store.get('cl-calc') || defaults.map(r => ({n:r[0],s:r[1],m:r[2],c:r[3]}));
  if (store.get('cl-total')) $('#totalM').value = store.get('cl-total');
  const body = $('#calcBody');
  function drawCalc(){
    body.innerHTML = rows.map((r,i) => `<tr data-i="${i}"><td>${r.n}</td>
      <td><input type="number" min="0" step="0.5" data-f="s" value="${r.s}" aria-label="% ventas ${r.n}"></td>
      <td><input type="number" min="0" max="100" step="1" data-f="m" value="${r.m}" aria-label="% margen ${r.n}"></td>
      <td><input type="number" min="0" step="0.5" data-f="c" value="${r.c}" aria-label="Metros actuales ${r.n}"></td>
      <td class="num rec"></td><td class="num delta"></td><td><div class="bar"><span class="cur"></span><span class="rec"></span></div></td></tr>`).join('');
    calc();
  }
  function calc(){
    const total = +$('#totalM').value || 0;
    const w = +$('#marginW').value / 100;
    $('#marginWv').textContent = `${Math.round(w*100)}% margen · ${Math.round((1-w)*100)}% ventas`;
    const sumS = rows.reduce((a,r)=>a+(+r.s||0),0);
    const sumGP = rows.reduce((a,r)=>a+(+r.s||0)*(+r.m||0),0);
    const sumC = rows.reduce((a,r)=>a+(+r.c||0),0);
    const recs = rows.map(r => {
      const sShare = sumS ? (+r.s||0)/sumS : 0;
      const gShare = sumGP ? (+r.s||0)*(+r.m||0)/sumGP : 0;
      return total * ((1-w)*sShare + w*gShare);
    });
    const max = Math.max(...recs, ...rows.map(r=>+r.c||0), 1);
    body.querySelectorAll('tr').forEach((tr,i) => {
      const cur = +rows[i].c||0, rec = recs[i], d = rec - cur;
      tr.querySelector('.rec').textContent = rec.toFixed(1) + ' m';
      const dEl = tr.querySelector('.delta');
      const pct = cur ? Math.round(d/cur*100) : 0;
      dEl.textContent = Math.abs(d) < 0.25 ? '✓ OK' : (d>0?'+':'') + d.toFixed(1) + ' m' + (cur ? ` (${pct>0?'+':''}${pct}%)` : '');
      dEl.className = 'num delta ' + (Math.abs(d) < 0.25 ? '' : d>0 ? 'up' : 'down');
      tr.querySelector('.bar .cur').style.width = (cur/max*100) + '%';
      tr.querySelector('.bar .rec').style.width = (rec/max*100) + '%';
    });
    $('#sumSales').innerHTML = Math.abs(sumS-100) < 0.01 ? '100%' : `<span class="warnmsg">${sumS}%</span>`;
    $('#sumSales').title = Math.abs(sumS-100) < 0.01 ? '' : 'Los porcentajes no suman 100; se normalizan automáticamente';
    $('#sumCur').innerHTML = Math.abs(sumC-total) < 0.01 ? sumC + ' m' : `<span class="warnmsg" title="No coincide con el total">${sumC} m</span>`;
    $('#sumRec').textContent = total.toFixed(1) + ' m';
    store.set('cl-calc', rows); store.set('cl-total', total);
  }
  body.addEventListener('input', e => {
    const tr = e.target.closest('tr'); if (!tr || !e.target.dataset.f) return;
    rows[+tr.dataset.i][e.target.dataset.f] = e.target.value; calc();
  });
  $('#totalM').addEventListener('input', calc);
  $('#marginW').addEventListener('input', calc);
  drawCalc();

  /* diagnostic */
  const D = [
    {g:'Recorrido y zonas', items:[
      ['entrada','La entrada está despejada (sin cajas ni exhibidores en los primeros 2 m)','Despeja los primeros 2–3 m de la entrada.'],
      ['derecha','El muro a la derecha de la entrada tiene novedades o promociones','Convierte el muro derecho en tu "muro de poder" con novedades.'],
      ['fondo','Los refrigerados/cerveza están al fondo de la tienda','Mueve los refrigerados al fondo para que recorran la tienda.'],
      ['pasillos','Los pasillos miden al menos 1.2 m y no tienen obstáculos','Amplía pasillos a 1.2 m mínimo y retira obstáculos.']]},
    {g:'Organización del producto', items:[
      ['pais','Los vinos están organizados por país/región con señalización clara','Organiza los vinos por país/región y pon letreros grandes.'],
      ['categoria','Los destilados están agrupados por categoría (whisky, tequila…)','Agrupa los destilados por categoría, no por proveedor.'],
      ['escalera','Dentro de cada sección hay escalera de precios (menor → mayor)','Ordena cada sección de menor a mayor precio.'],
      ['ojos','El nivel de los ojos tiene los productos de mayor margen','Sube los productos de mayor margen al nivel de los ojos.']]},
    {g:'Visibilidad y venta', items:[
      ['talkers','Uso shelf talkers con puntajes, maridajes o recomendaciones','Agrega shelf talkers en tus 20 productos clave.'],
      ['premium','Los productos premium están exhibidos (no guardados) y con precio visible','Exhibe los premium en vitrina iluminada con precio visible.'],
      ['cabeceras','Cada cabecera tiene un solo mensaje y cambia cada 4–6 semanas','Define un tema por cabecera y un calendario de rotación.'],
      ['caja','La caja tiene productos de impulso (miniaturas, accesorios)','Aprovecha la caja con miniaturas y accesorios.']]},
    {g:'Gestión', items:[
      ['espacio','Reviso que el espacio de cada categoría corresponda a sus ventas','Usa la calculadora de espacio y ajusta cada trimestre.'],
      ['agotados','Reviso agotados y huecos en el estante al menos una vez por semana','Haz un recorrido semanal de agotados y huecos.'],
      ['cuidado','El vino fino está lejos de luz directa y calor, acostado si tiene corcho','Protege el vino fino de luz y calor; acuéstalo.']]}
  ];
  const all = D.flatMap(g => g.items);
  let ans = store.get('cl-diag') || {};
  $('#diagForm').innerHTML = D.map(g => `<fieldset><legend>${g.g}</legend>${g.items.map(([id,txt]) =>
    `<label class="check"><input type="checkbox" data-id="${id}" ${ans[id]?'checked':''}><span>${txt}</span></label>`).join('')}</fieldset>`).join('');
  function score(){
    const done = all.filter(([id]) => ans[id]).length;
    const pct = Math.round(done/all.length*100);
    $('#ringFg').style.strokeDashoffset = 389.6 * (1 - pct/100);
    $('#ringTxt').textContent = pct;
    $('#lvlName').textContent = pct >= 85 ? 'Tienda optimizada' : pct >= 60 ? 'Buen camino' : pct >= 30 ? 'Con potencial' : 'Gran oportunidad de mejora';
    const todo = all.filter(([id]) => !ans[id]).slice(0,3);
    $('#prio').innerHTML = todo.length ? todo.map(t => `<li>${t[2]}</li>`).join('') : '<li>¡Excelente! Mantén la rotación y mide resultados cada mes.</li>';
    store.set('cl-diag', ans);
    return {pct, done};
  }
  $('#diagForm').addEventListener('change', e => { if (e.target.dataset.id) { ans[e.target.dataset.id] = e.target.checked; score(); } });
  $('#resetDiag').addEventListener('click', () => { ans = {}; $('#diagForm').querySelectorAll('input').forEach(i => i.checked = false); score(); });
  score();

  /* roadmap */
  const R = {
    nuevo:[
      {w:'Semana 1–2', t:'Descubrimiento', i:['Perfil del cliente de tu zona y competencia','Medidas del local, entrada, luz y tomas eléctricas','Presupuesto y metas de ventas']},
      {w:'Semana 3–4', t:'Diseño del layout', i:['Plano con zonas y recorrido','Mobiliario: estantes, refrigeradores, vitrina premium','Plan de iluminación y señalización']},
      {w:'Semana 5–6', t:'Surtido y planograma', i:['Mezcla de categorías y escalera de precios','Asignación de espacio por categoría','Planograma estante por estante']},
      {w:'Apertura +30 días', t:'Lanzamiento y ajuste', i:['Montaje y capacitación del equipo','Medir ventas por zona las primeras semanas','Primer ajuste de espacio y cabeceras']}
    ],
    actual:[
      {w:'Semana 1', t:'Diagnóstico', i:['Autodiagnóstico de esta página','Reporte de ventas y margen por categoría','Fotos de cada sección y recorrido actual']},
      {w:'Semana 2', t:'Victorias rápidas', i:['Despejar entrada y activar muro de poder','Shelf talkers en productos clave','Subir alto margen al nivel de los ojos']},
      {w:'Semana 3–6', t:'Reorganización', i:['Reasignar espacio con la calculadora','Reordenar vinos por país y destilados por categoría','Crear o mejorar la vitrina premium']},
      {w:'Mes 2–3', t:'Medir y mantener', i:['Comparar ventas antes vs. después','Calendario de rotación de cabeceras','Revisión trimestral de espacio y surtido']}
    ]
  };
  function setTab(k){
    document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === k));
    $('#steps').setAttribute('aria-labelledby', 'tab-' + k);
    $('#steps').innerHTML = R[k].map(s => `<li class="card"><div class="when">${s.w}</div><h3>${s.t}</h3><ul>${s.i.map(x=>`<li>${x}</li>`).join('')}</ul></li>`).join('');
  }
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  setTab('nuevo');

  /* request form */
  $('#reqForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const s = score();
    const prios = [...$('#prio').querySelectorAll('li')].map(li => '  • ' + li.textContent).join('\n');
    const txt = `SOLICITUD DE ASESORÍA · LAYOUT FINE WINE & SPIRITS
Tienda: ${f.tienda}${f.ciudad ? ' — ' + f.ciudad : ''}
Tipo de cliente: ${f.tipo}
Tamaño: ${f.m2 ? f.m2 + ' m²' : 'no indicado'} · Productos: ${f.sku || 'no indicado'} SKU
Mayor reto: ${f.reto}
Puntaje de autodiagnóstico: ${s.pct}/100 (${s.done} de ${all.length} prácticas)
Prioridades sugeridas:
${prios}
${f.notas ? 'Notas: ' + f.notas : ''}`.trim();
    const box = $('#summary'); box.textContent = txt; box.hidden = false;
    $('#copyBtn').hidden = false; $('#printBtn').hidden = false;
  });
  $('#copyBtn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#summary').textContent); $('#copyBtn').textContent = 'Copiado ✓'; }
    catch(e){ $('#copyBtn').textContent = 'Selecciona y copia manualmente'; }
    setTimeout(() => $('#copyBtn').textContent = 'Copiar', 2000);
  });
  $('#printBtn').addEventListener('click', () => print());
})();
