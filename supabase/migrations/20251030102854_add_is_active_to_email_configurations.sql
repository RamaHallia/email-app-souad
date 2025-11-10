/*
  # Add is_active column to email_configurations

  1. Changes
    - Add `is_active` boolean column to `email_configurations` table
    - Default value is `true` (all existing accounts remain active)
    - This allows accounts to be deactivated when subscription is cancelled instead of being deleted
    
  2. Notes
    - Deactivated accounts will appear greyed out in the configuration UI
    - Users can reactivate accounts by resubscribing
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_configurations' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE email_configurations ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;