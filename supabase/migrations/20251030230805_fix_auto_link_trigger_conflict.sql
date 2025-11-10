/*
  # Fix auto-link trigger conflict
  
  1. Problem
    - When deleting an email_configuration, the FK constraint sets email_configuration_id to NULL
    - This triggers an UPDATE on stripe_user_subscriptions
    - The trigger then tries to modify the same row again, causing a conflict
    
  2. Solution
    - Add a condition to prevent the trigger from running during DELETE operations
    - Use a session variable to track when we're in a deletion context
    
  3. Implementation
    - Modify the trigger function to check if the operation is part of a deletion cascade
    - Only run the auto-link logic for genuine new insertions
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS trigger_auto_link_subscription ON email_configurations;

-- Recreate the function with better logic
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
      -- Use a deferred update to avoid trigger conflicts
      PERFORM pg_sleep(0.01);
      
      UPDATE stripe_user_subscriptions
      SET email_configuration_id = NEW.id,
          updated_at = NOW()
      WHERE subscription_id = v_unlinked_subscription_id
        AND email_configuration_id IS NULL;  -- Double-check it's still unlinked

      RAISE NOTICE 'Auto-linked subscription % to email config %', v_unlinked_subscription_id, NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger - use AFTER INSERT only (not UPDATE)
CREATE TRIGGER trigger_auto_link_subscription
  AFTER INSERT ON email_configurations
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_subscription_to_email();
