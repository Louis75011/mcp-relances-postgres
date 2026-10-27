import type { Db } from "./db.js";

export const MAX_ROWS_LIMIT = 200;

export interface Relance {
  relance_id: number;
  nom: string;
  organisation: string;
  email: string | null;
  canal: "email" | "telephone" | "courrier";
  echeance: string;
  jours_de_retard: number;
  note: string | null;
}

export interface RelancesDues {
  date: string;
  total: number;
  renvoyees: number;
  relances: Relance[];
}

export interface ResumeCanal {
  canal: string;
  nombre: number;
  plus_ancienne: string;
}

/** Date locale du jour au format AAAA-MM-JJ. */
export function aujourdhui(maintenant: Date = new Date()): string {
  return maintenant.toLocaleDateString("sv-SE");
}

/** Vérifie qu'une chaîne est une vraie date AAAA-MM-JJ (le 30 février est refusé). */
export function estDateValide(valeur: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const [annee, mois, jour] = valeur.split("-").map(Number) as [number, number, number];
  const d = new Date(Date.UTC(annee, mois - 1, jour));
  return d.getUTCFullYear() === annee && d.getUTCMonth() === mois - 1 && d.getUTCDate() === jour;
}

function borner(limite: number, maximum: number): number {
  return Math.max(1, Math.min(Math.trunc(limite), maximum, MAX_ROWS_LIMIT));
}

/** Relances à faire dont l'échéance est atteinte ou dépassée à la date donnée. */
export async function relancesDues(
  db: Db,
  options: { date: string; limite: number; maxRows?: number },
): Promise<RelancesDues> {
  const limite = borner(options.limite, options.maxRows ?? MAX_ROWS_LIMIT);

  const relances = await db.query<Relance>(
    `SELECT relance_id,
            nom,
            organisation,
            email,
            canal,
            to_char(echeance, 'YYYY-MM-DD') AS echeance,
            ($1::date - echeance)::int      AS jours_de_retard,
            note
       FROM v_relances_a_faire
      WHERE echeance <= $1::date
      ORDER BY echeance, relance_id
      LIMIT $2`,
    [options.date, limite],
  );

  const [compte] = await db.query<{ total: number }>(
    `SELECT count(*)::int AS total FROM v_relances_a_faire WHERE echeance <= $1::date`,
    [options.date],
  );

  return {
    date: options.date,
    total: compte?.total ?? 0,
    renvoyees: relances.length,
    relances,
  };
}

/** Nombre de relances dues par canal, avec l'échéance la plus ancienne. */
export async function resumeParCanal(db: Db, date: string): Promise<ResumeCanal[]> {
  return db.query<ResumeCanal>(
    `SELECT canal,
            count(*)::int                         AS nombre,
            to_char(min(echeance), 'YYYY-MM-DD')  AS plus_ancienne
       FROM v_relances_a_faire
      WHERE echeance <= $1::date
      GROUP BY canal
      ORDER BY canal`,
    [date],
  );
}
