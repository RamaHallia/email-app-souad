/*
  # Suppression des tables inutilisées

  ## Tables supprimées
  
  1. `emails` - Table obsolète jamais utilisée dans le code (0 lignes)
  2. `subscriptions` - Table obsolète remplacée par stripe_subscriptions et stripe_user_subscriptions (0 lignes)

  ## Raison
  
  Ces tables ne sont plus utilisées dans l'application et peuvent être supprimées en toute sécurité.
*/

-- Drop tables if they exist
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;