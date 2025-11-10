import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';

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
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const duplicateSubIds = [
      'sub_1SO2uP14zZqoQtSCGYvLDo9z',
      'sub_1SO2tK14zZqoQtSCgABbtrQM'
    ];

    const results = [];

    for (const subId of duplicateSubIds) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subId);

        if (['active', 'trialing'].includes(subscription.status)) {
          await stripe.subscriptions.cancel(subId);
          results.push({ subscription_id: subId, status: 'canceled', action: 'canceled' });
        } else {
          results.push({ subscription_id: subId, status: subscription.status, action: 'already_inactive' });
        }
      } catch (error: any) {
        results.push({ subscription_id: subId, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
