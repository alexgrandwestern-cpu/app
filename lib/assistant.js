// Asistente de IA: usa Claude (si hay ANTHROPIC_API_KEY) con herramientas sobre los datos;
// si no hay clave, responde con un motor local basado en reglas.
import Anthropic from "@anthropic-ai/sdk";
import { filterProspects, stats } from "./query.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
export const aiEnabled = () => Boolean(client);

const SYSTEM = `Eres "Copiloto Licor", el asistente de IA de LicenciaPro Chicago, la plataforma de Alex Zavala.
Alex ayuda a restaurantes y negocios de comida en Chicago a obtener su licencia de licor (Consumption on Premises – Incidental Activity, Package Goods, Tavern, etc.).
Tu trabajo: ayudar a Alex a encontrar, priorizar y contactar prospectos usando la base de datos de licencias activas de la Ciudad de Chicago.
- Un "prospecto" es un negocio con licencia Retail Food Establishment que NO tiene licencia de licor en su ubicación.
- Puntaje 0-100 (A ≥ 75, B 50-74, C < 50) basado en comedor, tipo de cocina, patio, negocio nuevo, densidad de licor en la zona e inspecciones.
- Usa siempre las herramientas para dar cifras y nombres reales; no inventes negocios ni números.
- Responde en español (o en inglés si te escriben en inglés), claro y breve, con listas cuando ayuden.
- Para trámites, da orientación general (BACP de Chicago, zonificación, posibles moratorias por distrito, capacitación BASSET, seguro de responsabilidad, verificación de antecedentes) y recomienda confirmar requisitos y costos vigentes con la ciudad.
- Puedes sugerir guiones de llamada, correos y estrategias de prospección.
- Alex también ofrece, con su empresa Alex Solutions, Inc, asesoría de layout y merchandising para tiendas de Fine Wine & Spirits y barras de restaurantes (guía en /asesoria-layout): muro de poder a la derecha de la entrada, vinos por país/región con escalera de precios, sala de vinos finos (12–16 °C), refrigerados al fondo, destilados por categoría, cabeceras con un solo mensaje, vitrina premium con precio visible, compras de impulso en caja, mayor margen a la altura de los ojos y espacio por categoría según ventas y margen. Sugiere este segundo servicio sobre todo a tiendas (Package Goods) y restaurantes que van a abrir barra.
- La tarjeta de contacto de Alex está en /contacto.`;

const TOOLS = [
  {
    name: "search_prospects",
    description: "Busca prospectos (negocios de comida sin licencia de licor) con filtros. Devuelve total y los primeros resultados ordenados por puntaje.",
    input_schema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Texto libre: nombre, dirección, barrio, código postal" },
        area: { type: "string", description: "Área comunitaria de Chicago, p. ej. 'Lower West Side' (Pilsen), 'Logan Square', 'West Town'" },
        segment: { type: "string", enum: ["Restaurante con comedor", "Café y bebidas", "Panadería / Deli", "Comida para llevar", "Tienda / Grocery", "Otro alimento"] },
        cuisine: { type: "string", description: "Mexicana, Italiana / Pizza, Asiática, Steak / Grill / BBQ, Mediterránea / Medio Oriente, Latinoamericana, Americana / Comfort, Africana / Etíope, Europea / Bistro, Café / Postres" },
        tier: { type: "string", enum: ["A", "B", "C"] },
        zip: { type: "string" },
        ward: { type: "string" },
        minScore: { type: "number" },
        newOnly: { type: "boolean", description: "Solo negocios con ≤ 24 meses" },
        patio: { type: "boolean", description: "Solo negocios con licencia de patio exterior" },
        limit: { type: "number", description: "Máximo de resultados (por defecto 10, máximo 40)" },
      },
    },
  },
  {
    name: "get_stats",
    description: "Estadísticas agregadas de prospectos: totales, por nivel, segmento, cocina, área comunitaria, código postal y distrito (ward). Acepta los mismos filtros que search_prospects.",
    input_schema: {
      type: "object",
      properties: { area: { type: "string" }, segment: { type: "string" }, cuisine: { type: "string" }, tier: { type: "string" }, zip: { type: "string" } },
    },
  },
];

function slim(p) {
  return { id: p.id, nombre: p.name, direccion: `${p.address}, ${p.zip}`, area: p.area, ward: p.ward, segmento: p.segment, cocina: p.cuisine, puntaje: p.score, nivel: p.tier, licencia_recomendada: p.recommended, razones: p.reasons, ultima_inspeccion: p.lastInspection ? `${p.lastInspection} (${p.lastResult})` : "" };
}

function runTool(ds, name, input = {}) {
  if (name === "search_prospects") {
    const list = filterProspects(ds.prospects, input);
    const limit = Math.min(Number(input.limit) || 10, 40);
    return { total: list.length, resultados: list.slice(0, limit).map(slim) };
  }
  if (name === "get_stats") {
    const s = stats(ds, input);
    return { ...s, byArea: s.byArea.slice(0, 25), byZip: s.byZip.slice(0, 20), byWard: s.byWard.slice(0, 20) };
  }
  return { error: "herramienta desconocida" };
}

export async function ask(ds, history) {
  const messages = history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") return { answer: "Escribe una pregunta 🙂", engine: "local" };

  if (!client) return { answer: localAnswer(ds, messages[messages.length - 1].content), engine: "local" };

  const system = `${SYSTEM}\n\nDatos actuales (${ds.updatedAt?.slice(0, 10)}): ${JSON.stringify(ds.summary)}`;
  for (let i = 0; i < 6; i++) {
    let response;
    try {
      response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system,
        tools: TOOLS,
        messages,
        output_config: { effort: "low" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return { answer: "El asistente está ocupado (límite de uso). Intenta en unos segundos.", engine: "claude" };
      if (e instanceof Anthropic.AuthenticationError) return { answer: localAnswer(ds, messages[messages.length - 1].content), engine: "local" };
      console.error("Claude error:", e?.status, e?.message);
      return { answer: localAnswer(ds, messages[messages.length - 1].content) + "\n\n_(Respuesta del motor local: la IA no respondió.)_", engine: "local" };
    }
    if (response.stop_reason === "refusal") return { answer: "No puedo ayudar con esa solicitud. Pregúntame sobre prospectos o licencias.", engine: "claude" };
    messages.push({ role: "assistant", content: response.content });
    if (response.stop_reason === "pause_turn") continue;
    const uses = response.content.filter((b) => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || !uses.length) {
      const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      return { answer: text || "No encontré una respuesta.", engine: "claude" };
    }
    messages.push({
      role: "user",
      content: uses.map((u) => ({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(runTool(ds, u.name, u.input)) })),
    });
  }
  return { answer: "La consulta fue demasiado larga. Intenta hacerla más específica.", engine: "claude" };
}

// ---------- Motor local (sin clave de IA) ----------
const strip = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const AREA_ALIASES = { pilsen: "Lower West Side", "little village": "South Lawndale", wicker: "West Town", "wicker park": "West Town", bucktown: "Logan Square", "ukrainian village": "West Town", "river north": "Near North Side", "gold coast": "Near North Side", "west loop": "Near West Side", "little italy": "Near West Side", chinatown: "Armour Square", "back of the yards": "New City", "andersonville": "Edgewater", "wrigleyville": "Lake View", lakeview: "Lake View", "boystown": "Lake View", "south loop": "Near South Side", "hyde park": "Hyde Park", "humboldt": "Humboldt Park" };
const CUISINE_WORDS = { mexica: "Mexicana", taco: "Mexicana", taquer: "Mexicana", birria: "Mexicana", mariscos: "Mexicana", italian: "Italiana / Pizza", pizza: "Italiana / Pizza", asia: "Asiática", sushi: "Asiática", china: "Asiática", chino: "Asiática", thai: "Asiática", steak: "Steak / Grill / BBQ", grill: "Steak / Grill / BBQ", bbq: "Steak / Grill / BBQ", medite: "Mediterránea / Medio Oriente", griega: "Mediterránea / Medio Oriente", latin: "Latinoamericana", cubana: "Latinoamericana", perua: "Latinoamericana", american: "Americana / Comfort", hamburg: "Americana / Comfort", etiop: "Africana / Etíope", african: "Africana / Etíope", cafe: "Café / Postres", postre: "Café / Postres", bistro: "Europea / Bistro" };

function localAnswer(ds, question) {
  const q = strip(question);
  const filters = {};
  const areas = [...new Set(ds.prospects.map((p) => p.area))];
  for (const [alias, area] of Object.entries(AREA_ALIASES)) if (q.includes(alias)) filters.area = area;
  if (!filters.area) for (const a of areas) if (a.length > 3 && q.includes(strip(a))) filters.area = a;
  for (const [w, c] of Object.entries(CUISINE_WORDS)) if (q.includes(w)) { filters.cuisine = c; break; }
  const zip = q.match(/\b606\d\d\b/); if (zip) filters.zip = zip[0];
  if (/tienda|grocery|package|supermerc|mercado/.test(q)) filters.segment = "Tienda / Grocery";
  else if (/comedor|restaurante|restaurant/.test(q) && !filters.cuisine) filters.segment = "Restaurante con comedor";
  if (/\bnivel a\b|tier a|mejores|top|prioridad|alta/.test(q)) filters.tier = "A";
  if (/nuevo|reciente|abrieron/.test(q)) filters.newOnly = true;
  if (/patio|terraza/.test(q)) filters.patio = true;
  const n = Math.min(parseInt(q.match(/\b(\d{1,2})\b/)?.[1] || "8", 10) || 8, 25);

  if (/requisito|tramite|como (se )?(saca|obtiene)|proceso|pasos|basset|cuanto cuesta|costo/.test(q) && !filters.area && !filters.cuisine) {
    return `**Guía general para una licencia de licor en Chicago** (confirma requisitos y costos vigentes con BACP):
1. **Licencia de comida vigente** (Retail Food Establishment) en la misma ubicación.
2. **Zonificación** y revisión de que el distrito/precinto no tenga **moratoria** de licor.
3. **Tipo de licencia**: *Consumption on Premises – Incidental Activity* (restaurantes), *Package Goods* (tiendas), *Tavern* (bares).
4. **Documentos**: estructura legal, contrato de arrendamiento, planos, seguro de responsabilidad (dram shop), huellas/antecedentes de dueños y gerente.
5. **Capacitación BASSET** para quien sirve o vende alcohol.
6. **Aviso público / revisión del concejal** en ciertos casos, inspecciones y pago de cuotas.
👉 Aquí es donde Alex aporta valor: arma el expediente, coordina inspecciones y evita rechazos.`;
  }

  if (/layout|acomod|estante|anaquel|exhibi|merchandis|planograma|vitrina/.test(q)) {
    return `**Asesoría de layout · Alex Solutions, Inc** (guía completa en [/asesoria-layout](/asesoria-layout)):
- **Muro de poder** a la derecha de la entrada: novedades y alto margen.
- **Vinos por país/región**, con escalera de precios de menor a mayor.
- **Refrigerados al fondo** para que el cliente recorra toda la tienda.
- **Destilados por categoría** y **vitrina premium** con precio visible.
- **Altura de los ojos** para lo de mayor margen; abajo, formatos grandes.
- **Caja** con miniaturas y accesorios de impulso.
Ideal para ofrecerlo a tiendas que sacan *Package Goods* y a restaurantes que abren barra.`;
  }

  const list = filterProspects(ds.prospects, filters);
  const label = Object.entries(filters).map(([k, v]) => `${k}: ${v}`).join(", ") || "todos los filtros por defecto";
  if (/cuant|how many|total|numero/.test(q)) {
    const s = stats(ds, filters);
    return `Con ${label}: **${list.length.toLocaleString()} prospectos** — A: ${s.tiers.A}, B: ${s.tiers.B}, C: ${s.tiers.C}.\nÁreas principales: ${s.byArea.slice(0, 5).map((a) => `${a.name} (${a.count})`).join(", ")}.`;
  }
  if (/zona|area|barrio|donde|mejor(es)? (zona|area)/.test(q) && !filters.area) {
    const s = stats({ ...ds }, { ...filters, tier: undefined });
    return `**Áreas con más prospectos de nivel A:**\n${s.byArea.sort((a, b) => b.tierA - a.tierA).slice(0, 10).map((a, i) => `${i + 1}. ${a.name}: ${a.tierA} nivel A de ${a.count} prospectos`).join("\n")}`;
  }
  if (!list.length) return `No encontré prospectos con ${label}. Prueba con otra zona o tipo de cocina.`;
  return `Encontré **${list.length.toLocaleString()} prospectos** (${label}). Los ${Math.min(n, list.length)} mejores:\n${list.slice(0, n).map((p, i) => `${i + 1}. **${p.name}** — ${p.address}, ${p.area} · ${p.cuisine} · puntaje ${p.score} (${p.tier})`).join("\n")}\n\n_Consejo: configura ANTHROPIC_API_KEY para respuestas con IA completa._`;
}
