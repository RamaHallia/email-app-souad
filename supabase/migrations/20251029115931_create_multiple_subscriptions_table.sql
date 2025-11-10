/*
  # Create multiple subscriptions support

  1. New Tables
    - `stripe_user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `customer_id` (text, foreign key to stripe_customers)
      - `subscription_id` (text, Stripe subscription ID)
      - `subscription_type` (text, 'premier' or 'additional_account')
      - `status` (text, Stripe subscription status)
      - `price_id` (text, Stripe price ID)
      - `current_period_start` (bigint, Unix timestamp)
      - `current_period_end` (bigint, Unix timestamp)
      - `cancel_at_period_end` (boolean)
      - `payment_method_brand` (text)
      - `payment_method_last4` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `deleted_at` (timestamptz)

  2. Security
    - Enable RLS on `stripe_user_subscriptions` table
    - Add policy for authenticated users to read their own subscriptions

  3. Notes
    - This table supports multiple subscriptions per user
    - The old `stripe_subscriptions` table will remain for backward compatibility
    - Each subscription is tracked separately with its own type
*/

-- Create the new table for multiple subscriptions
CREATE TABLE IF NOT EXISTS stripe_user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id text REFERENCES stripe_customers(customer_id) ON DELETE CASCADE NOT NULL,
  subscription_id text UNIQUE NOT NULL,
  subscription_type text NOT NULL CHECK (subscription_type IN ('premier', 'additional_account')),
  status text NOT NULL,
  price_id text,
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text,
  payment_method_last4 text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stripe_user_subscriptions_user_id
  ON stripe_user_subscriptions(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_user_subscriptions_customer_id
  ON stripe_user_subscriptions(customer_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_user_subscriptions_subscription_id
  ON stripe_user_subscriptions(subscription_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_user_subscriptions_type
  ON stripe_user_subscriptions(subscription_type)
  WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE stripe_user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON stripe_user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for service role to manage all subscriptions
CREATE POLICY "Service role can manage all subscriptions"
  ON stripe_user_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
