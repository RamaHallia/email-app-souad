/*
  # Changer le défaut de is_classement à false

  1. Changements
    - Modifier la colonne `is_classement` pour avoir `DEFAULT false` au lieu de `true`
    - Le tri automatique ne sera activé qu'après validation du formulaire entreprise
  
  2. Impact
    - Tous les nouveaux comptes email auront is_classement = false par défaut
    - Les comptes existants gardent leur valeur actuelle
*/

-- Modifier le défaut de is_classement à false
ALTER TABLE email_configurations 
ALTER COLUMN is_classement SET DEFAULT false;
