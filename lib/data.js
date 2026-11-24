// Motor de datos: descarga licencias activas de Chicago, enriquece con inspecciones
// y calcula prospectos (negocios de comida SIN licencia de licor) con un puntaje 0-100.
import fs from "node:fs";
import path from "node:path";

const LICENSES_URL = "https://data.cityofchicago.org/resource/uupf-x98q.json";
const INSPECTIONS_URL = "https://data.cityofchicago.org/resource/4ijn-s7e5.json";
const CACHE_FILE = path.resolve("data", "cache.json");
const PAGE = 50000;

const LIQUOR_LICENSES = new Set([
  "Consumption on Premises - Incidental Activity",
  "Tavern",
  "Package Goods",
  "Caterer's Liquor License",
  "Special Event Liquor",
  "Late Hour",
]);
const FOOD_LICENSE = "Retail Food Establishment";

const CHAINS = ["MCDONALD", "SUBWAY", "DUNKIN", "STARBUCKS", "BURGER KING", "WENDY'S", "WENDYS", "TACO BELL", "POPEYES", "KFC", "KENTUCKY FRIED", "DOMINO", "PAPA JOHN", "JIMMY JOHN", "CHIPOTLE", "POTBELLY", "7-ELEVEN", "7 ELEVEN", "WALGREENS", "CVS", "JEWEL", "MARIANO", "WHOLE FOODS", "TARGET", "PANDA EXPRESS", "CHICK-FIL-A", "DOLLAR", "FIVE GUYS", "PORTILLO", "WINGSTOP", "SWEETGREEN", "PANERA", "AUNTIE ANNE", "CINNABON", "BASKIN", "DAIRY QUEEN", "JERSEY MIKE", "FIREHOUSE SUBS", "QDOBA", "SHAKE SHACK", "SBARRO", "WHITE CASTLE", "HAROLD'S CHICKEN", "JJ FISH", "J & J FISH", "ALDI", "TRADER JOE", "PETE'S FRESH", "FOOD 4 LESS", "SHELL", "BP ", "MOBIL", "CITGO", "MARATHON", "SPEEDWAY", "AMAZON", "COSTCO", "GREAT CLIPS"];
const INSTITUTIONAL = /\b(SCHOOL|ACADEMY|HOSPITAL|DAYCARE|DAY CARE|CHURCH|CHILDREN|CHILD CARE|NURSING|HEALTH CENTER|UNIVERSITY|COLLEGE|PRESCHOOL|MONTESSORI|LEARNING CENTER|YMCA|SENIOR|REHAB|CLINIC|PARK DISTRICT|PRISON|JAIL|SHELTER)\b/;
const INSTITUTIONAL_FACILITY = /school|daycare|children|hospital|long term care|charter|assisted|nursing|church|college|university|shelter|rehab/i;

const CUISINES = [
  ["Mexicana", /TAQUER|TACO|MEXICAN|CANTINA|TORTA|MARISCO|BIRRIA|POZOLE|CARNITAS|BURRITO|ENCHILAD|AGAVE|TAMAL|MOLE|ANTOJITO|JALISCO|MICHOACAN|OAXACA|GUADALAJARA|PUEBLA|EL MEZCAL|TEQUILA/],
  ["Italiana / Pizza", /PIZZ|ITALIAN|TRATTORIA|PASTA|RISTORANTE|OSTERIA|CUCINA|GELATO|CALZONE|NAPOLI|ROMA\b/],
  ["Asiática", /SUSHI|RAMEN|THAI|CHINESE|WOK|PHO\b|KOREAN|JAPANESE|NOODLE|DUMPLING|ASIAN|VIETNAM|HIBACHI|TERIYAKI|DIM SUM|SZECHUAN|SICHUAN|HOT POT|HOTPOT|BOBA|BANH MI|IZAKAYA|TOKYO|SEOUL|BANGKOK|CURRY|INDIA|TANDOOR|NEPAL|HIMALAYA|FILIPINO|BIBIMBAP/],
  ["Steak / Grill / BBQ", /STEAK|GRILL|BBQ|BARBEQUE|BARBECUE|SMOKEHOUSE|CHOPHOUSE|BRASA|ASADOR|ROTISSERIE/],
  ["Mediterránea / Medio Oriente", /GYRO|KEBAB|KABOB|GREEK|MEDITERRANEAN|SHAWARMA|FALAFEL|HUMMUS|LEBANESE|TURKISH|PERSIAN|MOROCCAN|HALAL|PITA|ATHENS/],
  ["Latinoamericana", /CUBAN|PERU|COLOMBIA|PUERTO|VENEZUEL|AREPA|PUPUS|SALVADOR|GUATEMAL|HONDUR|EMPANADA|BRAZIL|ARGENTIN|ECUADOR|DOMINICAN|CARIBBEAN|JAMAICA|JIBARITO|LATIN/],
  ["Americana / Comfort", /BURGER|DINER|WINGS|CHICKEN|HOT DOG|BEEF|FRIES|SANDWICH|BRUNCH|BREAKFAST|PANCAKE|SOUL FOOD|SOUTHERN|FISH|SHRIMP|SEAFOOD|CRAB|LOBSTER|OYSTER|KITCHEN/],
  ["Africana / Etíope", /ETHIOP|AFRICAN|NIGERIA|SENEGAL|GHANA|ERITRE/],
  ["Europea / Bistro", /BISTRO|BRASSERIE|FRENCH|CAFE DE|CREPE|POLISH|GERMAN|IRISH|SPANISH|TAPAS|PUB\b|TAVERN|GASTRO/],
  ["Café / Postres", /CAFE|COFFEE|ESPRESSO|TEA\b|JUICE|SMOOTHIE|DONUT|BAKERY|PANADERIA|PASTELERIA|DESSERT|ICE CREAM|PALETER|CUPCAKE|CHOCOLAT|BAKE/],
];
const HIGH_AFFINITY = new Set(["Mexicana", "Italiana / Pizza", "Asiática", "Steak / Grill / BBQ", "Mediterránea / Medio Oriente", "Latinoamericana", "Europea / Bistro"]);
const RESTAURANT_NAME = /RESTAURANT|RESTAURANTE|GRILL|KITCHEN|BISTRO|EATERY|CANTINA|TAQUER|PIZZ|SUSHI|STEAK|TRATTORIA|BBQ|DINER|CUCINA|BRASSERIE|LOUNGE|TAP\b|PUB\b|CAFE|RAMEN|THAI|MARISCOS|FONDA|COMEDOR/;

const titleCase = (s = "") =>
  s.toLowerCase().replace(/\b([a-záéíóúñ])/g, (m) => m.toUpperCase()).replace(/\bLlc\b/g, "LLC").replace(/\bInc\b/g, "Inc.");
const normAddr = (a = "") => a.toUpperCase().replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").trim().split(" ").slice(0, 4).join(" ");

async function fetchAll(url, params, label, onProgress) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const qs = new URLSearchParams({ ...params, $limit: String(PAGE), $offset: String(offset), $order: ":id" });
    let res;
    for (let attempt = 0; attempt < 4; attempt++) {
      res = await fetch(`${url}?${qs}`, { headers: { Accept: "application/json" } });
      if (res.ok) break;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
    if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
    const page = await res.json();
    rows.push(...page);
    onProgress?.(`${label}: ${rows.length.toLocaleString()} registros`);
    if (page.length < PAGE) break;
  }
  return rows;
}

function classifyCuisine(name) {
  for (const [label, re] of CUISINES) if (re.test(name)) return label;
  return "Otra / Sin identificar";
}

function classifySegment(acts, name, facility) {
  const a = acts.join(" | ");
  if (INSTITUTIONAL.test(name) || INSTITUTIONAL_FACILITY.test(facility || "")) return "Institucional";
  if (/Dining Area|Dining on Premises|With Seating/i.test(a) || /restaurant/i.test(facility || "")) return "Restaurante con comedor";
  if (/Coffee|Drinks/i.test(a) || /CAFE|COFFEE|TEA\b|JUICE|BOBA|SMOOTHIE/.test(name)) return "Café y bebidas";
  if (/Deli|Butcher|Bakery/i.test(a) || /BAKERY|PANADERIA|DELI\b|CARNICERIA|MEAT/.test(name) || /bakery/i.test(facility || "")) return "Panadería / Deli";
  if (/Without Dining|Offsite/i.test(a)) return "Comida para llevar";
  if (/Perishable|Fruits|Merchandise|Non-Perishable/i.test(a) || /grocery|convenience|liquor/i.test(facility || "") || /FOOD MART|MARKET|GROCER|MINI MART|FOODS\b|SUPERMERCADO|MERCADO/.test(name)) return "Tienda / Grocery";
  if (RESTAURANT_NAME.test(name)) return "Restaurante con comedor";
  return "Otro alimento";
}

function recommendLicense(segment) {
  switch (segment) {
    case "Tienda / Grocery": return "Package Goods (venta para llevar)";
    case "Comida para llevar": return "Package Goods o Incidental Activity";
    case "Panadería / Deli": return "Consumption on Premises – Incidental Activity / Package Goods";
    default: return "Consumption on Premises – Incidental Activity";
  }
}

export function buildDataset(licenses, inspections) {
  // Última inspección por número de licencia
  const insp = new Map();
  for (const r of inspections) {
    const k = r.license_;
    if (!k) continue;
    const prev = insp.get(k);
    if (!prev || (r.inspection_date || "") > (prev.inspection_date || "")) insp.set(k, r);
  }

  // Agrupar por ubicación de negocio (cuenta + sitio)
  const groups = new Map();
  for (const r of licenses) {
    const key = `${r.account_number}-${r.site_number}`;
    let g = groups.get(key);
    if (!g) {
      g = { key, licenses: new Set(), acts: new Set(), rows: [], firstIssued: null };
      groups.set(key, g);
    }
    g.licenses.add(r.license_description);
    (r.business_activity || "").split("|").map((s) => s.trim()).filter(Boolean).forEach((s) => g.acts.add(s));
    g.rows.push(r);
    const iss = r.application_type === "ISSUE" ? r.license_start_date || r.date_issued : null;
    if (iss && (!g.firstIssued || iss < g.firstIssued)) g.firstIssued = iss;
  }

  // Direcciones con alguna licencia de licor (para excluir locales ya cubiertos)
  const liquorAddr = new Set();
  for (const g of groups.values()) {
    if ([...g.licenses].some((l) => LIQUOR_LICENSES.has(l))) liquorAddr.add(normAddr(g.rows[0].address));
  }

  // Densidad de licor por área comunitaria (restaurantes con licor / restaurantes)
  const areaFood = new Map(), areaLiquor = new Map();
  for (const g of groups.values()) {
    if (!g.licenses.has(FOOD_LICENSE)) continue;
    const area = g.rows[0].community_area_name || "DESCONOCIDA";
    areaFood.set(area, (areaFood.get(area) || 0) + 1);
    if ([...g.licenses].some((l) => LIQUOR_LICENSES.has(l))) areaLiquor.set(area, (areaLiquor.get(area) || 0) + 1);
  }
  let totFood = 0, totLiq = 0;
  for (const [a, n] of areaFood) { totFood += n; totLiq += areaLiquor.get(a) || 0; }
  const cityRate = totLiq / Math.max(totFood, 1);

  const now = Date.now();
  const prospects = [];
  let foodBusinesses = 0, withLiquor = 0, sameAddressCovered = 0;

  for (const g of groups.values()) {
    if (!g.licenses.has(FOOD_LICENSE)) continue;
    foodBusinesses++;
    if ([...g.licenses].some((l) => LIQUOR_LICENSES.has(l))) { withLiquor++; continue; }
    const r = g.rows.find((x) => x.license_description === FOOD_LICENSE) || g.rows[0];
    if (liquorAddr.has(normAddr(r.address))) { sameAddressCovered++; continue; }

    const dba = (r.doing_business_as_name || r.legal_name || "").toUpperCase();
    const ins = insp.get(r.license_number);
    const facility = ins?.facility_type || "";
    const acts = [...g.acts];
    const segment = classifySegment(acts, dba, facility);
    const cuisine = classifyCuisine(dba);
    const chain = CHAINS.some((c) => dba.includes(c) || (r.legal_name || "").toUpperCase().includes(c));
    const area = r.community_area_name || "DESCONOCIDA";
    const areaRate = (areaLiquor.get(area) || 0) / Math.max(areaFood.get(area) || 1, 1);
    const ageMonths = g.firstIssued ? (now - Date.parse(g.firstIssued)) / (30.4 * 864e5) : null;

    const reasons = [];
    let score = 20;
    if (segment === "Restaurante con comedor") { score += 30; reasons.push("Tiene comedor / servicio en sitio"); }
    else if (segment === "Café y bebidas") { score += 12; reasons.push("Café/bebidas: candidato a vino y cerveza"); }
    else if (segment === "Tienda / Grocery") { score += 10; reasons.push("Tienda: candidata a Package Goods"); }
    else if (segment === "Comida para llevar" || segment === "Panadería / Deli") { score += 8; }
    if (RESTAURANT_NAME.test(dba)) { score += 10; reasons.push("El nombre indica restaurante/bar"); }
    if (HIGH_AFFINITY.has(cuisine)) { score += 15; reasons.push(`Cocina ${cuisine}: alta afinidad con bebidas`); }
    if (g.licenses.has("Outdoor Patio")) { score += 10; reasons.push("Tiene patio exterior sin licencia de licor"); }
    if (g.licenses.has("Public Place of Amusement") || g.licenses.has("Music and Dance")) { score += 8; reasons.push("Tiene entretenimiento / música"); }
    if (ageMonths !== null && ageMonths <= 24) { score += 10; reasons.push("Negocio nuevo (≤ 24 meses)"); }
    if (areaRate > cityRate * 1.2) { score += 7; reasons.push("Zona con alta densidad de restaurantes con licor"); }
    if (ins && /pass/i.test(ins.results || "")) { score += 5; reasons.push("Última inspección aprobada"); }
    if (/risk 1/i.test(ins?.risk || "") && segment === "Restaurante con comedor") score += 3;
    if (chain) { score -= 45; reasons.push("Cadena / franquicia (gestión corporativa)"); }
    if (segment === "Institucional") { score -= 70; reasons.push("Institución (escuela, hospital, etc.)"); }
    score = Math.max(0, Math.min(100, Math.round(score)));
    const tier = score >= 75 ? "A" : score >= 50 ? "B" : "C";

    const lat = parseFloat(r.latitude), lon = parseFloat(r.longitude);
    prospects.push({
      id: g.key,
      name: titleCase(r.doing_business_as_name || r.legal_name),
      legal: titleCase(r.legal_name),
      address: titleCase(r.address),
      zip: r.zip_code || "",
      ward: r.ward || "",
      area: titleCase(area),
      neighborhood: titleCase(r.neighborhood || area),
      lat: isFinite(lat) ? +lat.toFixed(5) : null,
      lon: isFinite(lon) ? +lon.toFixed(5) : null,
      segment,
      cuisine,
      chain,
      score,
      tier,
      reasons,
      recommended: recommendLicense(segment),
      licenses: [...g.licenses],
      activities: acts,
      facility,
      risk: ins?.risk || "",
      lastInspection: ins?.inspection_date?.slice(0, 10) || "",
      lastResult: ins?.results || "",
      since: g.firstIssued?.slice(0, 10) || "",
      expires: r.expiration_date?.slice(0, 10) || "",
      licenseNumber: r.license_number || "",
      areaLiquorRate: +(areaRate * 100).toFixed(1),
    });
  }

  prospects.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return {
    updatedAt: new Date().toISOString(),
    summary: {
      totalLicenses: licenses.length,
      totalBusinesses: groups.size,
      foodBusinesses,
      withLiquor,
      sameAddressCovered,
      prospects: prospects.length,
      cityLiquorRate: +(cityRate * 100).toFixed(1),
      inspectionsUsed: inspections.length,
    },
    prospects,
  };
}

export async function loadFromCity(onProgress) {
  const licenses = await fetchAll(
    LICENSES_URL,
    { $select: "account_number,site_number,legal_name,doing_business_as_name,address,zip_code,ward,community_area_name,neighborhood,license_description,business_activity,license_number,application_type,license_start_date,date_issued,expiration_date,latitude,longitude" },
    "Licencias",
    onProgress,
  );
  let inspections = [];
  try {
    const since = new Date(Date.now() - 3 * 365 * 864e5).toISOString().slice(0, 10);
    inspections = await fetchAll(
      INSPECTIONS_URL,
      { $select: "license_,facility_type,risk,results,inspection_date", $where: `inspection_date > '${since}'` },
      "Inspecciones",
      onProgress,
    );
  } catch (e) {
    onProgress?.(`Inspecciones no disponibles: ${e.message}`);
  }
  const ds = buildDataset(licenses, inspections);
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(ds));
  } catch {}
  return ds;
}

export function loadFromCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return null;
  }
}
