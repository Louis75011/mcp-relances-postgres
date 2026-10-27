-- Schéma de démonstration : contacts à relancer et leurs relances.
-- Aucune donnée réelle : voir seed.sql.

DROP VIEW  IF EXISTS v_relances_a_faire;
DROP TABLE IF EXISTS relances;
DROP TABLE IF EXISTS contacts;

CREATE TABLE contacts (
  id           serial PRIMARY KEY,
  nom          text NOT NULL,
  organisation text NOT NULL,
  email        text
);

CREATE TABLE relances (
  id         serial PRIMARY KEY,
  contact_id integer NOT NULL REFERENCES contacts (id),
  canal      text    NOT NULL CHECK (canal IN ('email', 'telephone', 'courrier')),
  echeance   date    NOT NULL,
  statut     text    NOT NULL DEFAULT 'a_faire'
             CHECK (statut IN ('a_faire', 'faite', 'abandonnee')),
  note       text
);

-- La vue exposée au serveur MCP : seules les relances encore à faire,
-- jointes à leur contact. Le serveur n'a besoin de rien d'autre.
CREATE VIEW v_relances_a_faire AS
SELECT r.id AS relance_id,
       c.nom,
       c.organisation,
       c.email,
       r.canal,
       r.echeance,
       r.note
FROM relances r
JOIN contacts c ON c.id = r.contact_id
WHERE r.statut = 'a_faire';
