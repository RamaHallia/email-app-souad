/*
  # Add SMTP columns to email_configurations

  1. Changes
    - Add smtp_host (text)
    - Add smtp_port (integer)
    - Add smtp_username (text)
    - Add smtp_password (text)

  2. Notes
    - These columns are needed for IMAP/SMTP email account configuration
*/

-- Add smtp_host column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'smtp_host'
  ) THEN
    ALTER TABLE email_configurations ADD COLUMN smtp_host text;
  END IF;
END $$;

-- Add smtp_port column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'smtp_port'
  ) THEN
    ALTER TABLE email_configurations ADD COLUMN smtp_port integer;
  END IF;
END $$;

-- Add smtp_username column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'smtp_username'
  ) THEN
    ALTER TABLE email_configurations ADD COLUMN smtp_username text;
  END IF;
END $$;

-- Add smtp_password column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'smtp_password'
  ) THEN
    ALTER TABLE email_configurations ADD COLUMN smtp_password text;
  END IF;
END $$;
