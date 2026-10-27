# mcp-relances-postgres

[![CI](https://github.com/Louis75011/mcp-relances-postgres/actions/workflows/ci.yml/badge.svg)](https://github.com/Louis75011/mcp-relances-postgres/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Français](#français) · [English](#english)

---

## Français

Un petit serveur [MCP](https://modelcontextprotocol.io) en TypeScript qui répond, en **lecture seule**, à la question : **« quelles relances sont dues aujourd'hui ? »**. Il interroge une vue Postgres et expose deux outils à Claude (ou à tout client MCP). Une base de démonstration entièrement fictive est fournie.

### But

Donner à un assistant l'accès à un besoin précis (les relances à traiter) sans lui ouvrir toute la base : une vue, deux outils, aucune écriture possible.

| Outil | Rôle |
|---|---|
| `relances_dues` | Liste les relances à faire dont l'échéance est atteinte ou dépassée, de la plus ancienne à la plus récente, avec les jours de retard. Paramètres : `date` (AAAA-MM-JJ, aujourd'hui par défaut), `limite` (20 par défaut). |
| `resume_relances` | Compte les relances dues par canal (`email`, `telephone`, `courrier`). Paramètre : `date`. |

### Installation

Prérequis : Node.js 20 ou plus, un Postgres, `psql`.

```bash
git clone https://github.com/Louis75011/mcp-relances-postgres.git
cd mcp-relances-postgres
npm ci
npm run build

# Base de démonstration (fictive) : crée les tables, la vue et les données
export DATABASE_URL="postgresql://utilisateur:motdepasse@localhost:5432/relances_demo"
npm run seed
```

Pour une base réelle, créez le rôle de `sql/lecteur-lecture-seule.sql` : il ne peut lire que la vue `v_relances_a_faire`. Le serveur ouvre en plus chaque requête dans une transaction `READ ONLY` toujours annulée.

Variables d'environnement : `DATABASE_URL` (obligatoire), `MAX_ROWS` (facultatif, 50 par défaut, 200 au plus).

Tests et contrôles : `npm run lint`, `npm run typecheck`, `npm test`. Les tests tournent sur Postgres en mémoire ([PGlite](https://pglite.dev)) ; avec `DATABASE_URL` défini, deux tests d'intégration s'exécutent aussi sur un vrai Postgres.

### Exemple d'appel depuis Claude

Déclarer le serveur dans Claude Code :

```bash
claude mcp add relances \
  -e DATABASE_URL="postgresql://utilisateur:motdepasse@localhost:5432/relances_demo" \
  -- node /chemin/vers/mcp-relances-postgres/dist/index.js
```

ou dans la configuration de Claude Desktop (`claude_desktop_config.json`) :

```json
{
  "mcpServers": {
    "relances": {
      "command": "node",
      "args": ["/chemin/vers/mcp-relances-postgres/dist/index.js"],
      "env": { "DATABASE_URL": "postgresql://utilisateur:motdepasse@localhost:5432/relances_demo" }
    }
  }
}
```

Puis, dans la conversation : *« Quelles relances sont dues aujourd'hui ? »* Claude appelle `relances_dues` ; avec la base de démonstration et la date du 27 octobre 2026, `relances_dues` avec `{"date": "2026-10-27", "limite": 2}` renvoie :

```json
{
  "date": "2026-10-27",
  "total": 4,
  "renvoyees": 2,
  "relances": [
    {
      "relance_id": 1,
      "nom": "Camille Exemple",
      "organisation": "Atelier Fictif",
      "email": "camille@example.com",
      "canal": "email",
      "echeance": "2026-10-20",
      "jours_de_retard": 7,
      "note": "Relancer après l'envoi du devis"
    },
    {
      "relance_id": 2,
      "nom": "Dominique Modèle",
      "organisation": "Maison Imaginaire",
      "email": "dominique@example.com",
      "canal": "telephone",
      "echeance": "2026-10-26",
      "jours_de_retard": 1,
      "note": "Proposer un créneau de visio"
    }
  ]
}
```

### Architecture en cinq lignes

1. `src/index.ts` démarre le serveur MCP sur stdio (stdout réservé au protocole, journaux sur stderr).
2. `src/server.ts` déclare les deux outils, avec validation des entrées par zod et l'annotation `readOnlyHint`.
3. `src/relances.ts` contient les requêtes SQL paramétrées sur la vue `v_relances_a_faire`, sans aucune écriture.
4. `src/db.ts` isole l'accès Postgres derrière une interface minimale ; chaque requête passe dans une transaction `READ ONLY` annulée.
5. `sql/` fournit le schéma, le seed fictif et le rôle en lecture seule ; les tests Vitest utilisent PGlite, la CI GitHub Actions ajoute un vrai Postgres et gitleaks.

### Licence

[MIT](LICENSE).

---

## English

A small [MCP](https://modelcontextprotocol.io) server in TypeScript that answers, **read-only**, the question: **"which follow-ups are due today?"**. It queries a Postgres view and exposes two tools to Claude (or any MCP client). A fully fictional demo database is included.

### Purpose

Give an assistant access to one precise need (the follow-ups to handle) without opening the whole database: one view, two tools, no write path.

| Tool | Role |
|---|---|
| `relances_dues` | Lists follow-ups still to do whose due date is reached or past, oldest first, with days overdue. Parameters: `date` (YYYY-MM-DD, today by default), `limite` (limit, 20 by default). |
| `resume_relances` | Counts due follow-ups per channel (`email`, `telephone`, `courrier`). Parameter: `date`. |

Tool names and data fields are in French, as in the demo schema.

### Installation

Requirements: Node.js 20 or later, a Postgres database, `psql`.

```bash
git clone https://github.com/Louis75011/mcp-relances-postgres.git
cd mcp-relances-postgres
npm ci
npm run build

# Demo database (fictional): creates the tables, the view and the data
export DATABASE_URL="postgresql://user:password@localhost:5432/relances_demo"
npm run seed
```

For a real database, create the role from `sql/lecteur-lecture-seule.sql`: it can only read the `v_relances_a_faire` view. On top of that, the server runs every query inside a `READ ONLY` transaction that is always rolled back.

Environment variables: `DATABASE_URL` (required), `MAX_ROWS` (optional, 50 by default, 200 at most).

Checks: `npm run lint`, `npm run typecheck`, `npm test`. Tests run on in-memory Postgres ([PGlite](https://pglite.dev)); when `DATABASE_URL` is set, two integration tests also run against a real Postgres.

### Example call from Claude

Register the server in Claude Code:

```bash
claude mcp add relances \
  -e DATABASE_URL="postgresql://user:password@localhost:5432/relances_demo" \
  -- node /path/to/mcp-relances-postgres/dist/index.js
```

or in the Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "relances": {
      "command": "node",
      "args": ["/path/to/mcp-relances-postgres/dist/index.js"],
      "env": { "DATABASE_URL": "postgresql://user:password@localhost:5432/relances_demo" }
    }
  }
}
```

Then ask: *"Which follow-ups are due today?"* Claude calls `relances_dues`; with the demo database and the date 27 October 2026, `relances_dues` with `{"date": "2026-10-27", "limite": 2}` returns the same JSON as shown in the French section above (4 due in total, the 2 oldest returned).

### Architecture in five lines

1. `src/index.ts` starts the MCP server over stdio (stdout is reserved for the protocol, logs go to stderr).
2. `src/server.ts` declares the two tools, with zod input validation and the `readOnlyHint` annotation.
3. `src/relances.ts` holds the parameterized SQL queries on the `v_relances_a_faire` view, with no write statement.
4. `src/db.ts` hides Postgres behind a minimal interface; every query runs in a rolled-back `READ ONLY` transaction.
5. `sql/` provides the schema, the fictional seed and the read-only role; Vitest tests use PGlite, and the GitHub Actions CI adds a real Postgres and gitleaks.

### License

[MIT](LICENSE).
