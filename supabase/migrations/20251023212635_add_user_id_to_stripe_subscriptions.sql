/*
  # Add user_id to stripe_subscriptions table

  1. Changes
    - Add `user_id` column to `stripe_subscriptions` table with foreign key to `auth.users`
    - Populate `user_id` for existing subscriptions by joining with `stripe_customers`
    - Make `user_id` NOT NULL after population
    - Update RLS policies to use direct `user_id` check instead of subquery
    - Add index on `user_id` for faster queries

  2. Benefits
    - Direct link between subscriptions and users
    - Simplified queries (no need to join stripe_customers)
    - Better performance with direct user_id lookups
    - Easier to manage user subscriptions
*/

-- Step 1: Add user_id column (nullable first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Step 2: Populate user_id from stripe_customers
UPDATE stripe_subscriptions s
SET user_id = c.user_id
FROM stripe_customers c
WHERE s.customer_id = c.customer_id
AND s.user_id IS NULL;

-- Step 3: Make user_id NOT NULL
DO $$
BEGIN
  ALTER TABLE stripe_subscriptions ALTER COLUMN user_id SET NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not set user_id as NOT NULL. There may be subscriptions without matching customers.';
END $$;

-- Step 4: Add index for performance
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);

-- Step 5: Drop old RLS policy
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;

-- Step 6: Create new simplified RLS policy using direct user_id
CREATE POLICY "Users can view their own subscription data"
    ON stripe_subscriptions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);