import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the user's customer ID
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch all paid invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: customer.customer_id,
      status: 'paid',
      limit: 100,
    });

    // Save each invoice to the database
    let syncedCount = 0;
    for (const invoice of invoices.data) {
      const { error: invoiceError } = await supabase.from('stripe_invoices').upsert(
        {
          customer_id: customer.customer_id,
          invoice_id: invoice.id,
          subscription_id: typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          invoice_pdf: invoice.invoice_pdf,
          invoice_number: invoice.number,
          status: invoice.status,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
          paid_at: invoice.status_transitions?.paid_at,
          user_id: user.id,
        },
        {
          onConflict: 'invoice_id',
        }
      );

      if (!invoiceError) {
        syncedCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount,
        message: `${syncedCount} facture(s) synchronisée(s)` 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error syncing invoices:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
