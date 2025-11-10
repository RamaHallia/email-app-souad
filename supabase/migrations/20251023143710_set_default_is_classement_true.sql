/*
  # Change default value of is_classement to TRUE

  1. Changes
    - Modify `is_classement` column default value from `false` to `true`
    - New email accounts will automatically have `is_classement = true`

  2. Notes
    - Existing rows keep their current value (`false`)
    - Only new accounts created after this migration will have `true` by default
*/

ALTER TABLE email_configurations ALTER COLUMN is_classement SET DEFAULT true;