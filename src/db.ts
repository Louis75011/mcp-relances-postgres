import pg from "pg";

/** Accès minimal à la base : une requête paramétrée, des lignes en retour. */
export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  close(): Promise<void>;
}

/**
 * Connexion Postgres dont chaque requête s'exécute dans une transaction
 * `READ ONLY` toujours annulée : même avec un rôle trop permissif, rien n'est écrit.
 */
export function createPgDb(connectionString: string): Db {
  const pool = new pg.Pool({ connectionString, max: 4 });

  return {
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const client = await pool.connect();
      try {
        await client.query("BEGIN READ ONLY");
        const result = await client.query(sql, params);
        return result.rows as T[];
      } finally {
        try {
          await client.query("ROLLBACK");
        } finally {
          client.release();
        }
      }
    },
    close: () => pool.end(),
  };
}
