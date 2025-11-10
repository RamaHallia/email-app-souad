/*
  # Remove old unique constraints on user_id
  
  1. Changes
    - Drop unique constraint on gmail_tokens(user_id) to allow multiple Gmail accounts per user
    - Drop unique constraint on outlook_tokens(user_id) to allow multiple Outlook accounts per user
    - The new constraints gmail_tokens(user_id, email) and outlook_tokens(user_id, email) are already in place
    
  2. Security
    - No security changes needed - RLS policies remain the same
*/

-- Drop old unique constraint on gmail_tokens(user_id)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'gmail_tokens_user_id_key'
  ) THEN
    ALTER TABLE gmail_tokens
      DROP CONSTRAINT gmail_tokens_user_id_key;
  END IF;
END $$;

-- Drop old unique constraint on outlook_tokens(user_id)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'outlook_tokens_user_id_key'
  ) THEN
    ALTER TABLE outlook_tokens
      DROP CONSTRAINT outlook_tokens_user_id_key;
  END IF;
END $$;
