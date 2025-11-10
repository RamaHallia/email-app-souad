/*
  # Backfill email column in tracking tables

  1. Purpose
    - Populate the email column in existing records
    - Match email from email_configurations based on email_account_id
    - Ensures all existing data has the correct email assigned

  2. Changes
    - Updates email_traite table
    - Updates email_info table
    - Updates email_pub table

  3. Logic
    - For each record with a non-null email_account_id, fetch the corresponding email
    - Update the email column with the fetched value
    - Skip records where email_account_id is NULL

  4. Security
    - Only updates existing records, doesn't create new data
    - Maintains data integrity
*/

-- Update email_traite table
UPDATE email_traite et
SET email = ec.email
FROM email_configurations ec
WHERE et.email_account_id = ec.id
AND et.email IS NULL;

-- Update email_info table
UPDATE email_info ei
SET email = ec.email
FROM email_configurations ec
WHERE ei.email_account_id = ec.id
AND ei.email IS NULL;

-- Update email_pub table
UPDATE email_pub ep
SET email = ec.email
FROM email_configurations ec
WHERE ep.email_account_id = ec.id
AND ep.email IS NULL;
