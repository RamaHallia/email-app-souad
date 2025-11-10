/*
  # Ajout de la colonne email_account_id aux tables de tracking

  1. Modifications
    - Ajout de la colonne `email_account_id` (text) à la table `email_traite`
    - Ajout de la colonne `email_account_id` (text) à la table `email_info`
    - Ajout de la colonne `email_account_id` (text) à la table `email_pub`
  
  2. Notes
    - Cette colonne permet de filtrer les statistiques par compte email
    - Les données existantes auront NULL comme valeur par défaut
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_traite' AND column_name = 'email_account_id'
  ) THEN
    ALTER TABLE email_traite ADD COLUMN email_account_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_info' AND column_name = 'email_account_id'
  ) THEN
    ALTER TABLE email_info ADD COLUMN email_account_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_pub' AND column_name = 'email_account_id'
  ) THEN
    ALTER TABLE email_pub ADD COLUMN email_account_id text;
  END IF;
END $$;
