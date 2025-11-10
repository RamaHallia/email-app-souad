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
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: activeSubscriptions } = await supabaseAdmin
      .from('stripe_user_subscriptions')
      .select('id, subscription_id, subscription_type, created_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    const orphansToCancel = [];

    if (activeSubscriptions) {
      const premierSubs = activeSubscriptions.filter(s => s.subscription_type === 'premier');

      if (premierSubs.length > 1) {
        for (let i = 1; i < premierSubs.length; i++) {
          orphansToCancel.push(premierSubs[i]);
        }
      }

      const additionalSubs = activeSubscriptions.filter(s => s.subscription_type === 'additional_account');

      for (const sub of additionalSubs) {
        const { count } = await supabaseAdmin
          .from('email_configurations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_primary', false)
          .eq('is_active', true);

        if (count === 0) {
          orphansToCancel.push(sub);
        }
      }
    }

    if (orphansToCancel.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No orphan subscriptions found',
          canceled: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const canceledSubscriptions = [];
    for (const orphan of orphansToCancel) {
      try {
        await stripe.subscriptions.cancel(orphan.subscription_id);

        await supabaseAdmin
          .from('stripe_user_subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: true,
            deleted_at: new Date().toISOString(),
          })
          .eq('id', orphan.id);

        canceledSubscriptions.push({
          subscription_id: orphan.subscription_id,
          status: 'canceled',
        });
      } catch (error: any) {
        console.error(`Failed to cancel subscription ${orphan.subscription_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Canceled ${canceledSubscriptions.length} orphan subscription(s)`,
        canceled: canceledSubscriptions,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Cleanup orphan subscriptions error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});