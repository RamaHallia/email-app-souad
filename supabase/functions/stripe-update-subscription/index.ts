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
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Failed to authenticate user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { additional_accounts } = await req.json();

    if (typeof additional_accounts !== 'number' || additional_accounts < 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid additional_accounts parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: emailAccounts } = await supabaseAdmin
      .from('email_configurations')
      .select('email, is_primary')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false });

    const primaryEmailAddress = emailAccounts?.find(e => e.is_primary)?.email || user.email || '';
    const additionalEmails = emailAccounts?.filter(e => !e.is_primary).map(e => e.email) || [];

    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customerError || !customerData) {
      return new Response(
        JSON.stringify({ error: 'No customer found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: subData, error: subError } = await supabaseAdmin
      .from('stripe_subscriptions')
      .select('subscription_id, status, additional_accounts')
      .eq('customer_id', customerData.customer_id)
      .maybeSingle();

    if (subError || !subData) {
      return new Response(
        JSON.stringify({ error: 'No subscription found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!['active', 'trialing'].includes(subData.status)) {
      return new Response(
        JSON.stringify({ error: 'Subscription is not active' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!subData.subscription_id) {
      return new Response(
        JSON.stringify({ error: 'No subscription ID found' }),
        {
          status: 400,
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

    const subscription = await stripe.subscriptions.retrieve(subData.subscription_id);

    const existingItem = subscription.items.data.find(
      (item) => item.price.id === additionalAccountPriceId
    );

    if (additional_accounts === 0) {
      if (existingItem) {
        await stripe.subscriptionItems.del(existingItem.id, {
          proration_behavior: 'always_invoice',
        });
        console.log(`Removed additional account item for subscription ${subData.subscription_id}`);
      }
    } else {
      if (existingItem) {
        await stripe.subscriptionItems.update(existingItem.id, {
          quantity: additional_accounts,
          proration_behavior: 'always_invoice',
        });
        console.log(`Updated additional accounts to ${additional_accounts} for subscription ${subData.subscription_id}`);
      } else {
        await stripe.subscriptionItems.create({
          subscription: subData.subscription_id,
          price: additionalAccountPriceId,
          quantity: additional_accounts,
          proration_behavior: 'always_invoice',
        });
        console.log(`Added ${additional_accounts} additional account(s) to subscription ${subData.subscription_id}`);
      }
    }

    const updatedSubscription = await stripe.subscriptions.retrieve(subData.subscription_id, {
      expand: ['items'],
    });

    const updatedAdditionalAccounts = updatedSubscription.items.data.find(
      (item) => item.price.id === additionalAccountPriceId
    )?.quantity || 0;

    const subscriptionDescription = primaryEmailAddress ? `Plan Premier - ${primaryEmailAddress}${additionalEmails.length > 0 ? ` + ${additionalEmails.length} compte(s) supplémentaire(s): ${additionalEmails.join(', ')}` : ''}` : undefined;

    await stripe.subscriptions.update(subData.subscription_id, {
      metadata: {
        user_id: user.id,
        primary_email: primaryEmailAddress,
        additional_emails: additionalEmails.join(', '),
        total_accounts: emailAccounts?.length || 0,
      },
      description: subscriptionDescription,
    });

    await supabaseAdmin
      .from('stripe_subscriptions')
      .update({
        additional_accounts: updatedAdditionalAccounts,
        updated_at: new Date().toISOString(),
      })
      .eq('customer_id', customerData.customer_id);

    return new Response(
      JSON.stringify({
        success: true,
        additional_accounts: updatedAdditionalAccounts,
        message: 'Subscription updated successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
