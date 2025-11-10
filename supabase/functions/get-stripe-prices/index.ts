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
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: getUserError } = await supabaseClient.auth.getUser();

    if (getUserError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const basePlanPriceId = Deno.env.get('STRIPE_PRICE_ID');
    const additionalAccountPriceId = Deno.env.get('STRIPE_ADDITIONAL_ACCOUNT_PRICE_ID');

    if (!basePlanPriceId || !additionalAccountPriceId) {
      console.error('Missing price IDs - STRIPE_PRICE_ID:', basePlanPriceId ? 'set' : 'missing', 'STRIPE_ADDITIONAL_ACCOUNT_PRICE_ID:', additionalAccountPriceId ? 'set' : 'missing');
      return new Response(
        JSON.stringify({ error: 'Price IDs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [basePlanPrice, additionalAccountPrice] = await Promise.all([
      stripe.prices.retrieve(basePlanPriceId, { expand: ['product'] }),
      stripe.prices.retrieve(additionalAccountPriceId, { expand: ['product'] })
    ]);

    const formatPrice = (price: Stripe.Price) => {
      const amount = price.unit_amount ? price.unit_amount / 100 : 0;
      const currency = price.currency.toUpperCase();
      const interval = price.recurring?.interval || 'month';

      return {
        id: price.id,
        amount,
        currency,
        interval,
        product: typeof price.product === 'string' ? price.product : {
          id: price.product.id,
          name: price.product.name,
          description: price.product.description
        }
      };
    };

    return new Response(
      JSON.stringify({
        basePlan: formatPrice(basePlanPrice),
        additionalAccount: formatPrice(additionalAccountPrice)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Get Stripe prices error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});