import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token received:', token.substring(0, 20) + '...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('User authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('User authenticated:', user.id);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customerError || !customerData) {
      console.error('Customer not found:', customerError?.message);
      return new Response(
        JSON.stringify({ error: 'No customer found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const additionalAccountPriceId = Deno.env.get('STRIPE_ADDITIONAL_ACCOUNT_PRICE_ID');

    if (!additionalAccountPriceId) {
      return new Response(
        JSON.stringify({ error: 'Additional account price ID not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerData.customer_id,
      mode: 'subscription',
      line_items: [
        {
          price: additionalAccountPriceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}/settings?upgrade=success`,
      cancel_url: `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}/settings?upgrade=cancelled`,
      customer_update: {
        name: 'auto',
        address: 'auto',
      },
      tax_id_collection: {
        enabled: true,
      },
      billing_address_collection: 'required',
      automatic_tax: {
        enabled: true,
      },
      subscription_data: {
        metadata: {
          type: 'additional_account',
          user_id: user.id,
        },
      },
    });

    console.log(`Created separate checkout session for additional account: ${session.id}`);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating additional account checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});