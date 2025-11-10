/*
  # Create Stripe invoices table

  1. New Tables
    - `stripe_invoices`
      - `id` (bigint, primary key) - Auto-incrementing ID
      - `customer_id` (text, not null) - Stripe customer ID
      - `invoice_id` (text, unique, not null) - Stripe invoice ID
      - `subscription_id` (text) - Stripe subscription ID
      - `amount_paid` (integer, not null) - Amount paid in cents
      - `currency` (text, not null) - Currency code (e.g., 'eur')
      - `invoice_pdf` (text) - URL to Stripe-hosted PDF
      - `invoice_number` (text) - Stripe invoice number
      - `status` (text, not null) - Invoice status (paid, open, void, etc.)
      - `period_start` (bigint) - Billing period start timestamp
      - `period_end` (bigint) - Billing period end timestamp
      - `created_at` (timestamptz) - When invoice was created
      - `paid_at` (bigint) - When invoice was paid (timestamp)
      - `user_id` (uuid, not null) - User who owns this invoice
      - `updated_at` (timestamptz) - Last update timestamp
      - `deleted_at` (timestamptz) - Soft delete timestamp

  2. Security
    - Enable RLS on `stripe_invoices` table
    - Add policy for users to read their own invoices only

  3. Indexes
    - Index on customer_id for fast lookups
    - Index on user_id for fast user-specific queries
    - Index on invoice_id for unique constraint
*/

CREATE TABLE IF NOT EXISTS stripe_invoices (
  id bigserial PRIMARY KEY,
  customer_id text NOT NULL,
  invoice_id text UNIQUE NOT NULL,
  subscription_id text,
  amount_paid integer NOT NULL,
  currency text NOT NULL DEFAULT 'eur',
  invoice_pdf text,
  invoice_number text,
  status text NOT NULL,
  period_start bigint,
  period_end bigint,
  created_at timestamptz DEFAULT now(),
  paid_at bigint,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Enable RLS
ALTER TABLE stripe_invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own invoices
CREATE POLICY "Users can view own invoices"
  ON stripe_invoices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_customer_id ON stripe_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user_id ON stripe_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_paid_at ON stripe_invoices(paid_at DESC);
