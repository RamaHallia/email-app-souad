/*
  # Migrate NULL email_account_id to first user configuration

  1. Purpose
    - Associates old tracking data (with NULL email_account_id) to user's first email configuration
    - This is a one-time migration for existing data created before multi-account support

  2. Changes
    - Updates email_traite table: Sets email_account_id to first user configuration where NULL
    - Updates email_info table: Sets email_account_id to first user configuration where NULL
    - Updates email_pub table: Sets email_account_id to first user configuration where NULL

  3. Important Notes
    - Only updates rows where email_account_id IS NULL
    - Uses each user's oldest (first) email configuration by created_at
    - Skips users who don't have any email configurations
    - This migration is idempotent and safe to run multiple times
*/

-- Update email_traite table
UPDATE email_traite
SET email_account_id = (
  SELECT ec.id
  FROM email_configurations ec
  WHERE ec.user_id = email_traite.user_id
  ORDER BY ec.created_at ASC
  LIMIT 1
)
WHERE email_account_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM email_configurations ec
    WHERE ec.user_id = email_traite.user_id
  );

-- Update email_info table
UPDATE email_info
SET email_account_id = (
  SELECT ec.id
  FROM email_configurations ec
  WHERE ec.user_id = email_info.user_id
  ORDER BY ec.created_at ASC
  LIMIT 1
)
WHERE email_account_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM email_configurations ec
    WHERE ec.user_id = email_info.user_id
  );

-- Update email_pub table
UPDATE email_pub
SET email_account_id = (
  SELECT ec.id
  FROM email_configurations ec
  WHERE ec.user_id = email_pub.user_id
  ORDER BY ec.created_at ASC
  LIMIT 1
)
WHERE email_account_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM email_configurations ec
    WHERE ec.user_id = email_pub.user_id
  );
