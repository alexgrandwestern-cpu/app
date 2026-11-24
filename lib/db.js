// Almacenamiento de documentos: Postgres (DATABASE_URL) o archivo JSON local como respaldo.
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const FILE = path.resolve("data", "marketplace.json");
let pool = null;
let mem = { experts: {}, bookings: {}, reviews: {} };

export async function initDb() {
  if (process.env.DATABASE_URL) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes("render.com") ? { rejectUnauthorized: false } : undefined, max: 5 });
    await pool.query(`CREATE TABLE IF NOT EXISTS docs (
      collection text NOT NULL, id text NOT NULL, data jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (collection, id))`);
    console.log("Marketplace: usando Postgres");
  } else {
    try { mem = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
    console.log("Marketplace: usando archivo local (no persistente en Render)");
  }
}
export const dbKind = () => (pool ? "postgres" : "archivo");

function saveFile() {
  try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(mem)); } catch {}
}

export async function list(collection) {
  if (pool) return (await pool.query("SELECT data FROM docs WHERE collection=$1 ORDER BY created_at", [collection])).rows.map((r) => r.data);
  return Object.values(mem[collection] || {});
}
export async function get(collection, id) {
  if (pool) return (await pool.query("SELECT data FROM docs WHERE collection=$1 AND id=$2", [collection, id])).rows[0]?.data || null;
  return mem[collection]?.[id] || null;
}
export async function put(collection, doc) {
  if (pool) {
    await pool.query(
      `INSERT INTO docs (collection, id, data) VALUES ($1,$2,$3)
       ON CONFLICT (collection, id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()`,
      [collection, doc.id, doc],
    );
  } else {
    (mem[collection] ||= {})[doc.id] = doc;
    saveFile();
  }
  return doc;
}
export async function remove(collection, id) {
  if (pool) await pool.query("DELETE FROM docs WHERE collection=$1 AND id=$2", [collection, id]);
  else { delete mem[collection]?.[id]; saveFile(); }
}
