#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPgDb } from "./db.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL est requis (voir .env.example).");
    process.exit(1);
  }

  const maxRows = Number(process.env.MAX_ROWS ?? 50);
  const db = createPgDb(url);
  const server = createServer(db, { maxRows: Number.isFinite(maxRows) ? maxRows : 50 });

  process.on("SIGINT", () => void db.close().finally(() => process.exit(0)));
  await server.connect(new StdioServerTransport());
  // stdout est réservé au protocole MCP : tout message va sur stderr.
  console.error("mcp-relances-postgres prêt (stdio, lecture seule).");
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
