/*
  # Nettoyage des enregistrements orphelins et ajout de contraintes

  1. Nettoyage
    - Suppression des enregistrements avec email_account_id NULL dans les 3 tables de tracking
    - Suppression des enregistrements avec email NULL dans les 3 tables de tracking

  2. Contraintes
    - Ajout de contrainte NOT NULL sur email_account_id
    - Ajout de contrainte NOT NULL sur email
    
  Note: Assure l'intégrité des données et empêche les insertions futures sans ces champs obligatoires
*/

-- Suppression des enregistrements orphelins dans email_info
DELETE FROM email_info 
WHERE email_account_id IS NULL OR email IS NULL;

-- Suppression des enregistrements orphelins dans email_traite
DELETE FROM email_traite 
WHERE email_account_id IS NULL OR email IS NULL;

-- Suppression des enregistrements orphelins dans email_pub
DELETE FROM email_pub 
WHERE email_account_id IS NULL OR email IS NULL;

-- Ajout des contraintes NOT NULL sur email_info
ALTER TABLE email_info 
  ALTER COLUMN email_account_id SET NOT NULL,
  ALTER COLUMN email SET NOT NULL;

-- Ajout des contraintes NOT NULL sur email_traite
ALTER TABLE email_traite 
  ALTER COLUMN email_account_id SET NOT NULL,
  ALTER COLUMN email SET NOT NULL;

-- Ajout des contraintes NOT NULL sur email_pub
ALTER TABLE email_pub 
  ALTER COLUMN email_account_id SET NOT NULL,
  ALTER COLUMN email SET NOT NULL;
