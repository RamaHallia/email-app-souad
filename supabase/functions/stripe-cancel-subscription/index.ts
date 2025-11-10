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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const { subscription_id, subscription_type } = body;

    if (subscription_id) {
      const { data: subRecord, error: subRecordError } = await supabaseAdmin
        .from('stripe_user_subscriptions')
        .select('subscription_id, status, subscription_type')
        .eq('user_id', user.id)
        .eq('subscription_id', subscription_id)
        .is('deleted_at', null)
        .maybeSingle();

      if (subRecordError || !subRecord) {
        return corsResponse({ error: 'Subscription not found' }, 404);
      }

      console.log(`Current subscription status: ${subRecord.status} for subscription: ${subscription_id}`);

      if (!['active', 'trialing', 'past_due'].includes(subRecord.status)) {
        return corsResponse({
          error: `Cannot cancel subscription with status: ${subRecord.status}. Only active, trialing, or past_due subscriptions can be canceled.`
        }, 400);
      }

      const updatedSubscription = await stripe.subscriptions.update(
        subscription_id,
        {
          cancel_at_period_end: true,
        }
      );

      const { error: updateError } = await supabaseAdmin
        .from('stripe_user_subscriptions')
        .update({
          cancel_at_period_end: true,
        })
        .eq('subscription_id', subscription_id);

      if (updateError) {
        console.error('Failed to update subscription in database:', updateError);
        return corsResponse({ error: 'Failed to update subscription' }, 500);
      }

      return corsResponse({
        success: true,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        current_period_end: updatedSubscription.current_period_end,
      });
    }

    const { data: customer, error: getCustomerError } = await supabaseAdmin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (getCustomerError || !customer?.customer_id) {
      return corsResponse({ error: 'Customer not found' }, 404);
    }

    const { data: subscription, error: getSubscriptionError } = await supabaseAdmin
      .from('stripe_subscriptions')
      .select('subscription_id, status')
      .eq('customer_id', customer.customer_id)
      .maybeSingle();

    if (getSubscriptionError || !subscription?.subscription_id) {
      return corsResponse({ error: 'No active subscription found' }, 404);
    }

    if (!['active', 'trialing'].includes(subscription.status)) {
      return corsResponse({ error: 'Subscription is not active' }, 400);
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    const { error: updateError } = await supabaseAdmin
      .from('stripe_subscriptions')
      .update({
        cancel_at_period_end: true,
      })
      .eq('subscription_id', subscription.subscription_id);

    if (updateError) {
      console.error('Failed to update subscription in database:', updateError);
      return corsResponse({ error: 'Failed to update subscription' }, 500);
    }

    const { data: primaryAccount } = await supabaseAdmin
      .from('email_configurations')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle();

    if (primaryAccount) {
      await supabaseAdmin
        .from('email_configurations')
        .update({ is_primary: false, is_active: false })
        .eq('id', primaryAccount.id);

      const { data: nextAccount } = await supabaseAdmin
        .from('email_configurations')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_primary', false)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextAccount) {
        await supabaseAdmin
          .from('email_configurations')
          .update({ is_primary: true })
          .eq('id', nextAccount.id);
      }
    }

    return corsResponse({
      success: true,
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
      current_period_end: updatedSubscription.current_period_end,
    });
  } catch (error: any) {
    console.error(`Cancel subscription error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});
