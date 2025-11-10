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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    const { data: { user }, error: getUserError } = await supabaseClient.auth.getUser();

    if (getUserError || !user) {
      console.error('Failed to authenticate user:', getUserError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email_configuration_id } = await req.json();

    if (!email_configuration_id) {
      return new Response(JSON.stringify({ error: 'email_configuration_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get email configuration details
    const { data: emailConfig, error: getConfigError } = await supabaseAdmin
      .from('email_configurations')
      .select('id, email, provider, user_id, gmail_token_id, outlook_token_id, is_primary')
      .eq('id', email_configuration_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (getConfigError || !emailConfig) {
      console.error('Email configuration not found:', getConfigError);
      return new Response(JSON.stringify({ error: 'Email configuration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.info(`Deleting email account ${emailConfig.email} for user ${user.id}`);

    // Find and cancel the associated subscription
    const { data: linkedSubscription } = await supabaseAdmin
      .from('stripe_user_subscriptions')
      .select('subscription_id, customer_id, subscription_type')
      .eq('email_configuration_id', email_configuration_id)
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .is('deleted_at', null)
      .maybeSingle();

    if (linkedSubscription) {
      console.info(`Found linked subscription: ${linkedSubscription.subscription_id}`);

      // Cancel the subscription on Stripe
      try {
        await stripe.subscriptions.cancel(linkedSubscription.subscription_id, {
          prorate: true,
        });
        console.info(`Cancelled Stripe subscription: ${linkedSubscription.subscription_id}`);
      } catch (stripeError: any) {
        console.error('Error canceling Stripe subscription:', stripeError);
        // Continue with deletion even if Stripe cancellation fails
      }

      // Update subscription in database
      await supabaseAdmin
        .from('stripe_user_subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          deleted_at: new Date().toISOString(),
        })
        .eq('subscription_id', linkedSubscription.subscription_id);

      console.info(`Updated subscription status in database`);
    } else {
      console.info(`No active subscription found for email configuration ${email_configuration_id}`);
    }

    // Delete OAuth tokens based on provider
    if (emailConfig.provider === 'gmail' && emailConfig.gmail_token_id) {
      const { error: deleteGmailError } = await supabaseAdmin
        .from('gmail_tokens')
        .delete()
        .eq('id', emailConfig.gmail_token_id);

      if (deleteGmailError) {
        console.error('Error deleting Gmail token:', deleteGmailError);
      } else {
        console.info(`Deleted Gmail token: ${emailConfig.gmail_token_id}`);
      }
    } else if (emailConfig.provider === 'outlook' && emailConfig.outlook_token_id) {
      const { error: deleteOutlookError } = await supabaseAdmin
        .from('outlook_tokens')
        .delete()
        .eq('id', emailConfig.outlook_token_id);

      if (deleteOutlookError) {
        console.error('Error deleting Outlook token:', deleteOutlookError);
      } else {
        console.info(`Deleted Outlook token: ${emailConfig.outlook_token_id}`);
      }
    }

    // Delete email configuration
    const { error: deleteConfigError } = await supabaseAdmin
      .from('email_configurations')
      .delete()
      .eq('id', email_configuration_id)
      .eq('user_id', user.id);

    if (deleteConfigError) {
      console.error('Error deleting email configuration:', deleteConfigError);
      throw deleteConfigError;
    }

    console.info(`Successfully deleted email configuration: ${email_configuration_id}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email account deleted successfully',
      deleted_email: emailConfig.email,
      subscription_cancelled: !!linkedSubscription,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error(`Delete email account error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
