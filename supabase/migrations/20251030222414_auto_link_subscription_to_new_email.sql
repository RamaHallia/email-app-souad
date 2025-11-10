/*
  # Auto-link subscription to new email configuration

  1. Purpose
    - Automatically link unlinked additional_account subscriptions to newly created email configurations
    - This ensures that when a user adds a new email account after purchasing an additional subscription,
      the subscription gets automatically linked to the email account

  2. Implementation
    - Create a trigger function that runs after INSERT on email_configurations
    - The function finds the first unlinked additional_account subscription for the user
    - Links it to the newly created email configuration by updating email_configuration_id

  3. Logic
    - Only runs for non-primary email accounts
    - Only links subscriptions with status 'active' or 'trialing'
    - Only links if no email_configuration_id is set yet
    - Takes the oldest unlinked subscription first (FIFO)
*/

-- Create function to auto-link subscription when new email config is created
CREATE OR REPLACE FUNCTION auto_link_subscription_to_email()
RETURNS TRIGGER AS $$
DECLARE
  v_unlinked_subscription_id text;
BEGIN
  -- Only process non-primary email accounts
  IF NEW.is_primary = false THEN
    -- Find the oldest unlinked additional_account subscription for this user
    SELECT subscription_id INTO v_unlinked_subscription_id
    FROM stripe_user_subscriptions
    WHERE user_id = NEW.user_id
      AND subscription_type = 'additional_account'
      AND email_configuration_id IS NULL
      AND status IN ('active', 'trialing')
      AND deleted_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1;

    -- If found, link it to this email configuration
    IF v_unlinked_subscription_id IS NOT NULL THEN
      UPDATE stripe_user_subscriptions
      SET email_configuration_id = NEW.id,
          updated_at = NOW()
      WHERE subscription_id = v_unlinked_subscription_id;

      RAISE NOTICE 'Auto-linked subscription % to email config %', v_unlinked_subscription_id, NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after INSERT on email_configurations
DROP TRIGGER IF EXISTS trigger_auto_link_subscription ON email_configurations;

CREATE TRIGGER trigger_auto_link_subscription
  AFTER INSERT ON email_configurations
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_subscription_to_email();
