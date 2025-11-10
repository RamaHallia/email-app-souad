/*
  # Add additional accounts tracking to subscriptions

  1. Changes
    - Add `additional_accounts` column to `stripe_subscriptions` table
      - Type: integer
      - Default: 0
      - Tracks the number of paid additional email accounts
  
  2. Notes
    - Base plan includes 1 email account
    - Each additional account costs 19€/month
    - This column stores the number of additional accounts the user has paid for
*/

-- Add additional_accounts column
ALTER TABLE stripe_subscriptions 
ADD COLUMN IF NOT EXISTS additional_accounts integer DEFAULT 0 NOT NULL;

-- Add a check constraint to ensure the value is not negative
ALTER TABLE stripe_subscriptions 
ADD CONSTRAINT additional_accounts_non_negative 
CHECK (additional_accounts >= 0);
