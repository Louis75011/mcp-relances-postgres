import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Db } from "./db.js";
import { aujourdhui, estDateValide, relancesDues, resumeParCanal } from "./relances.js";

export interface ServerOptions {
  /** Plafond de lignes par appel (configuration `MAX_ROWS`). */
  maxRows?: number;
  /** Date du jour, injectable pour les tests. */
  today?: () => string;
}

const dateSchema = z
  .string()
  .refine(estDateValide, "Date attendue au format AAAA-MM-JJ.")
  .optional()
  .describe("Date de référence (AAAA-MM-JJ). Par défaut : aujourd'hui.");

function texte(valeur: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(valeur, null, 2) }] };
}

export function createServer(db: Db, options: ServerOptions = {}): McpServer {
  const today = options.today ?? aujourdhui;
  const server = new McpServer({ name: "mcp-relances-postgres", version: "0.1.0" });

  server.registerTool(
    "relances_dues",
    {
      title: "Relances dues",
      description:
        "Liste les relances à faire dont l'échéance est atteinte ou dépassée (lecture seule). " +
        "Triées de la plus ancienne à la plus récente, avec le nombre de jours de retard.",
      inputSchema: {
        date: dateSchema,
        limite: z
          .number()
          .int()
          .min(1)
          .max(200)
          .default(20)
          .describe("Nombre maximal de relances renvoyées."),
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ date, limite }) =>
      texte(await relancesDues(db, { date: date ?? today(), limite, maxRows: options.maxRows })),
  );

  server.registerTool(
    "resume_relances",
    {
      title: "Résumé des relances dues",
      description:
        "Compte les relances dues par canal (email, telephone, courrier) à une date donnée (lecture seule).",
      inputSchema: { date: dateSchema },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ date }) => {
      const jour = date ?? today();
      return texte({ date: jour, canaux: await resumeParCanal(db, jour) });
    },
  );

  return server;
}
