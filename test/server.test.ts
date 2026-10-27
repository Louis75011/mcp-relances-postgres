import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../src/server.js";
import type { Db } from "../src/db.js";
import { baseDeDemo } from "./helpers.js";

let db: Db;
let client: Client;

beforeAll(async () => {
  db = await baseDeDemo();
  const server = createServer(db, { today: () => "2026-10-27" });
  const [cote_client, cote_serveur] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([server.connect(cote_serveur), client.connect(cote_client)]);
});

afterAll(async () => {
  await client.close();
  await db.close();
});

function lire(resultat: Awaited<ReturnType<Client["callTool"]>>) {
  const bloc = (resultat.content as { type: string; text: string }[])[0];
  return JSON.parse(bloc?.text ?? "null");
}

describe("serveur MCP", () => {
  it("expose deux outils, tous deux en lecture seule", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["relances_dues", "resume_relances"]);
    for (const outil of tools) expect(outil.annotations?.readOnlyHint).toBe(true);
  });

  it("relances_dues utilise la date du jour par défaut", async () => {
    const r = lire(await client.callTool({ name: "relances_dues", arguments: {} }));
    expect(r.date).toBe("2026-10-27");
    expect(r.total).toBe(4);
  });

  it("relances_dues accepte une date et une limite", async () => {
    const r = lire(
      await client.callTool({
        name: "relances_dues",
        arguments: { date: "2026-10-26", limite: 1 },
      }),
    );
    expect(r.total).toBe(2);
    expect(r.relances).toHaveLength(1);
  });

  it("relances_dues refuse une date invalide", async () => {
    const r = await client.callTool({ name: "relances_dues", arguments: { date: "2026-02-30" } });
    expect(r.isError).toBe(true);
  });

  it("resume_relances compte par canal", async () => {
    const r = lire(await client.callTool({ name: "resume_relances", arguments: {} }));
    expect(r.canaux.map((c: { canal: string }) => c.canal)).toEqual([
      "courrier",
      "email",
      "telephone",
    ]);
  });

  it("n'expose aucun outil d'écriture", async () => {
    const r = await client.callTool({ name: "supprimer_relance", arguments: {} });
    expect(r.isError).toBe(true);
  });
});
