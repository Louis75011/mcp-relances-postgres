-- Rôle recommandé pour le serveur MCP : il ne peut lire que la vue.
-- À adapter (mot de passe, nom de base) puis à exécuter avec un compte administrateur.

CREATE ROLE mcp_lecteur LOGIN PASSWORD 'a-remplacer';
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM mcp_lecteur;
GRANT USAGE ON SCHEMA public TO mcp_lecteur;
GRANT SELECT ON v_relances_a_faire TO mcp_lecteur;
ALTER ROLE mcp_lecteur SET default_transaction_read_only = on;
