import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../src/db.js";
import { aujourdhui, estDateValide, relancesDues, resumeParCanal } from "../src/relances.js";
import { baseDeDemo } from "./helpers.js";

let db: Db;
beforeAll(async () => {
  db = await baseDeDemo();
});
afterAll(async () => {
  await db.close();
});

describe("relancesDues", () => {
  it("renvoie les relances échues, de la plus ancienne à la plus récente", async () => {
    const r = await relancesDues(db, { date: "2026-10-27", limite: 20 });
    expect(r.total).toBe(4);
    expect(r.relances.map((x) => x.relance_id)).toEqual([1, 2, 3, 4]);
    expect(r.relances.map((x) => x.jours_de_retard)).toEqual([7, 1, 0, 0]);
    expect(r.relances[0]?.echeance).toBe("2026-10-20");
  });

  it("inclut l'échéance du jour même", async () => {
    const r = await relancesDues(db, { date: "2026-10-20", limite: 20 });
    expect(r.relances.map((x) => x.relance_id)).toEqual([1]);
  });

  it("ne renvoie rien avant la première échéance", async () => {
    const r = await relancesDues(db, { date: "2026-10-19", limite: 20 });
    expect(r).toMatchObject({ total: 0, renvoyees: 0, relances: [] });
  });

  it("exclut les relances faites ou abandonnées", async () => {
    const r = await relancesDues(db, { date: "2027-01-01", limite: 200 });
    expect(r.total).toBe(6);
    expect(r.relances.map((x) => x.relance_id)).not.toContain(7);
    expect(r.relances.map((x) => x.relance_id)).not.toContain(8);
  });

  it("respecte la limite tout en donnant le total", async () => {
    const r = await relancesDues(db, { date: "2026-10-27", limite: 2 });
    expect(r.renvoyees).toBe(2);
    expect(r.total).toBe(4);
  });

  it("plafonne la limite à MAX_ROWS", async () => {
    const r = await relancesDues(db, { date: "2027-01-01", limite: 100, maxRows: 3 });
    expect(r.renvoyees).toBe(3);
    expect(r.total).toBe(6);
  });

  it("garde un email absent à null", async () => {
    const r = await relancesDues(db, { date: "2026-10-27", limite: 20 });
    expect(r.relances.find((x) => x.relance_id === 4)?.email).toBeNull();
  });
});

describe("resumeParCanal", () => {
  it("compte par canal avec l'échéance la plus ancienne", async () => {
    expect(await resumeParCanal(db, "2026-10-27")).toEqual([
      { canal: "courrier", nombre: 1, plus_ancienne: "2026-10-27" },
      { canal: "email", nombre: 2, plus_ancienne: "2026-10-20" },
      { canal: "telephone", nombre: 1, plus_ancienne: "2026-10-26" },
    ]);
  });
});

describe("dates", () => {
  it("accepte une vraie date", () => {
    expect(estDateValide("2026-10-27")).toBe(true);
    expect(estDateValide("2028-02-29")).toBe(true);
  });

  it.each(["2026-02-30", "2026-13-01", "27/10/2026", "2026-1-5", "", "demain"])(
    "refuse %j",
    (valeur) => {
      expect(estDateValide(valeur)).toBe(false);
    },
  );

  it("formate le jour au format AAAA-MM-JJ", () => {
    expect(aujourdhui(new Date(2026, 9, 27, 12))).toBe("2026-10-27");
  });
});
