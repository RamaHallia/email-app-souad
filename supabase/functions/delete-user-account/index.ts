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
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
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
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: customer, error: getCustomerError } = await supabaseAdmin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (customer?.customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.customer_id,
          status: 'all',
        });

        for (const subscription of subscriptions.data) {
          if (['active', 'trialing', 'past_due'].includes(subscription.status)) {
            await stripe.subscriptions.cancel(subscription.id);
            console.log(`Cancelled Stripe subscription: ${subscription.id}`);
          }
        }

        const userSubscriptions = await stripe.subscriptions.list({
          customer: customer.customer_id,
        });
        for (const sub of userSubscriptions.data) {
          if (['active', 'trialing', 'past_due'].includes(sub.status)) {
            await stripe.subscriptions.cancel(sub.id);
            console.log(`Cancelled user subscription: ${sub.id}`);
          }
        }
      } catch (stripeError) {
        console.error('Error canceling Stripe subscriptions:', stripeError);
      }
    }

    await supabaseAdmin
      .from('stripe_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        deleted_at: new Date().toISOString()
      })
      .eq('customer_id', customer?.customer_id || '');

    await supabaseAdmin
      .from('stripe_user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        deleted_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    const { data: emailConfigs } = await supabaseAdmin
      .from('email_configurations')
      .select('id, gmail_token_id, outlook_token_id')
      .eq('user_id', user.id);

    if (emailConfigs) {
      for (const config of emailConfigs) {
        if (config.gmail_token_id) {
          await supabaseAdmin
            .from('gmail_tokens')
            .delete()
            .eq('id', config.gmail_token_id);
        }
        if (config.outlook_token_id) {
          await supabaseAdmin
            .from('outlook_tokens')
            .delete()
            .eq('id', config.outlook_token_id);
        }
      }
    }

    await supabaseAdmin
      .from('email_configurations')
      .delete()
      .eq('user_id', user.id);

    await supabaseAdmin
      .from('processed_emails')
      .delete()
      .eq('user_id', user.id);

    await supabaseAdmin
      .from('email_classifications')
      .delete()
      .eq('user_id', user.id);

    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      throw deleteAuthError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Account deleted and all subscriptions cancelled'
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error(`Delete user account error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
