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

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: getUserError,
    } = await supabaseClient.auth.getUser();

    if (getUserError || !user) {
      console.error('Failed to authenticate user:', getUserError);
      return corsResponse({ error: 'User not found' }, 404);
    }

    const { subscription_id, subscription_type } = await req.json();

    if (!subscription_id) {
      return corsResponse({ error: 'Missing subscription_id' }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: subscription, error: getSubscriptionError } = await supabaseAdmin
      .from('stripe_user_subscriptions')
      .select('subscription_id, status, cancel_at_period_end')
      .eq('subscription_id', subscription_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (getSubscriptionError || !subscription) {
      return corsResponse({ error: 'Subscription not found' }, 404);
    }

    if (!subscription.cancel_at_period_end) {
      return corsResponse({ error: 'Subscription is not scheduled for cancellation' }, 400);
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.subscription_id,
      {
        cancel_at_period_end: false,
      }
    );

    const { error: updateDbError } = await supabaseAdmin
      .from('stripe_user_subscriptions')
      .update({
        cancel_at_period_end: false,
      })
      .eq('subscription_id', subscription.subscription_id);

    if (updateDbError) {
      console.error('Failed to update subscription in database:', updateDbError);
      return corsResponse({ error: 'Failed to update subscription' }, 500);
    }

    if (subscription_type === 'premier') {
      const { data: primaryAccount } = await supabaseAdmin
        .from('email_configurations')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();

      if (primaryAccount) {
        await supabaseAdmin
          .from('email_configurations')
          .update({ is_active: true })
          .eq('id', primaryAccount.id);
      }
    }

    return corsResponse({
      success: true,
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
      current_period_end: updatedSubscription.current_period_end,
    });
  } catch (error: any) {
    console.error(`Reactivate subscription error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});
