import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Db } from "../src/db.js";

const lireSql = (nom: string) =>
  readFileSync(new URL(`../sql/${nom}`, import.meta.url), "utf-8");

/** Base Postgres en mémoire (PGlite) chargée avec le schéma et le seed de démonstration. */
export async function baseDeDemo(): Promise<Db> {
  const pglite = new PGlite();
  await pglite.exec(lireSql("schema.sql"));
  await pglite.exec(lireSql("seed.sql"));

  return {
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const resultat = await pglite.query<T>(sql, params);
      return resultat.rows;
    },
    close: () => pglite.close(),
  };
}
