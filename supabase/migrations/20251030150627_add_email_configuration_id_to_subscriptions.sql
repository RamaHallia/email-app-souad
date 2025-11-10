/*
  # Add email_configuration_id to stripe_user_subscriptions

  1. Changes
    - Add `email_configuration_id` column to `stripe_user_subscriptions` table
    - Add foreign key constraint to link subscriptions to email configurations
    - This allows tracking which subscription belongs to which email account
  
  2. Purpose
    - Link each Stripe subscription (premier or additional_account) to a specific email configuration
    - Enable proper display of subscription status per email account
    - Allow canceling/reactivating specific email accounts
*/

-- Add email_configuration_id column
ALTER TABLE stripe_user_subscriptions 
ADD COLUMN IF NOT EXISTS email_configuration_id uuid REFERENCES email_configurations(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_user_subscriptions_email_configuration_id 
ON stripe_user_subscriptions(email_configuration_id);

-- Add comment
COMMENT ON COLUMN stripe_user_subscriptions.email_configuration_id IS 'Links subscription to specific email configuration';