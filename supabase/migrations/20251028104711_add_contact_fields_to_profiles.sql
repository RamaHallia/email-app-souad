/*
  # Ajouter les champs de contact à la table profiles

  1. Modifications
    - Ajouter `contact_email` (text) - Adresse email de contact
    - Ajouter `invoice_email` (text) - Adresse email supplémentaire pour la réception des factures
    - Ajouter `phone` (text) - Numéro de téléphone

  2. Sécurité
    - Les politiques RLS existantes s'appliquent automatiquement à ces nouveaux champs
*/

-- Ajouter les champs de contact
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN contact_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'invoice_email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invoice_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;
