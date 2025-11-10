/*
  # Add Personal Information Fields to Profiles

  1. Changes
    - Add civility (title: Mr/Mrs/etc)
    - Add first_name
    - Add last_name
    - Add street_address
    - Add address_complement
    - Add postal_code
    - Add city
    - Add country
    - Add password_updated_at (to track password changes)

  2. Notes
    - All fields are optional
    - Default values for common fields
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'civility'
  ) THEN
    ALTER TABLE profiles ADD COLUMN civility text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'street_address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN street_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address_complement'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address_complement text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country text DEFAULT 'France';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'password_updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_updated_at timestamptz;
  END IF;
END $$;