-- Données de démonstration entièrement fictives.
-- Noms inventés ; adresses en example.com / example.org (domaines réservés, RFC 2606).

INSERT INTO contacts (id, nom, organisation, email) VALUES
  (1, 'Camille Exemple',   'Atelier Fictif',        'camille@example.com'),
  (2, 'Dominique Modèle',  'Maison Imaginaire',     'dominique@example.com'),
  (3, 'Alex Témoin',       'Studio Hypothétique',   'alex@example.org'),
  (4, 'Sacha Factice',     'Coopérative Générique', NULL),
  (5, 'Robin Échantillon', 'Bureau de Démonstration', 'robin@example.org'),
  (6, 'Morgan Plausible',  'Fabrique Anonyme',      'morgan@example.com');

SELECT setval('contacts_id_seq', 6);

INSERT INTO relances (id, contact_id, canal, echeance, statut, note) VALUES
  (1,  1, 'email',     '2026-10-20', 'a_faire',    'Relancer après l''envoi du devis'),
  (2,  2, 'telephone', '2026-10-26', 'a_faire',    'Proposer un créneau de visio'),
  (3,  3, 'email',     '2026-10-27', 'a_faire',    'Demander un retour sur la maquette'),
  (4,  4, 'courrier',  '2026-10-27', 'a_faire',    NULL),
  (5,  5, 'email',     '2026-10-28', 'a_faire',    'Rappel de la réunion de jeudi'),
  (6,  6, 'telephone', '2026-11-03', 'a_faire',    'Point trimestriel'),
  (7,  1, 'telephone', '2026-10-10', 'faite',      'Déjà traitée : exclue de la vue'),
  (8,  3, 'email',     '2026-10-15', 'abandonnee', 'Abandonnée : exclue de la vue');

SELECT setval('relances_id_seq', 8);
