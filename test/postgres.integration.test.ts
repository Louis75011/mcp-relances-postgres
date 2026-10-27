import { afterAll, describe, expect, it } from "vitest";
import { createPgDb } from "../src/db.js";
import { relancesDues } from "../src/relances.js";

// Exécuté seulement avec un vrai Postgres chargé (npm run seed) : en CI, ou en local avec DATABASE_URL.
const url = process.env.DATABASE_URL;

describe.skipIf(!url)("Postgres réel", () => {
  const db = createPgDb(url ?? "");
  afterAll(() => db.close());

  it("lit la vue de démonstration", async () => {
    const r = await relancesDues(db, { date: "2026-10-27", limite: 20 });
    expect(r.total).toBe(4);
    expect(r.relances[0]?.echeance).toBe("2026-10-20");
  });

  it("refuse toute écriture, même avec un rôle permissif", async () => {
    await expect(db.query("DELETE FROM relances")).rejects.toThrow(/read-only/i);
    await expect(db.query("INSERT INTO contacts (nom, organisation) VALUES ('x', 'y')")).rejects.toThrow(
      /read-only/i,
    );
  });
});
