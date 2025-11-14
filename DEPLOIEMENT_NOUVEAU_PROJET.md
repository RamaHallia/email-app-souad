# 🚀 Guide de déploiement des fonctions Supabase sur un nouveau projet

## ⚠️ Problème actuel
L'erreur CORS indique que les fonctions Edge Functions ne sont **pas déployées** sur ton nouveau projet Supabase (`bgvknwdjlrhzcitdfvwq`).

## 📋 Étapes à suivre

### 1. Se connecter à Supabase CLI

```bash
npx supabase login
```

Cela va ouvrir ton navigateur pour t'authentifier.

### 2. Lier le projet local au nouveau projet Supabase

```bash
npx supabase link --project-ref bgvknwdjlrhzcitdfvwq
```

Tu auras besoin de ton **Database Password** (trouvable dans le dashboard Supabase > Settings > Database).

### 3. Configurer les variables d'environnement

Les fonctions Stripe ont besoin de ces variables d'environnement. Va dans ton **dashboard Supabase** :

1. **Settings** > **Edge Functions** > **Secrets**
2. Ajoute ces secrets :

```
STRIPE_SECRET_KEY=sk_live_... (ou sk_test_... pour le test)
STRIPE_WEBHOOK_SECRET=whsec_... (pour le webhook)
```

### 4. Déployer toutes les fonctions

```bash
# Déployer toutes les fonctions d'un coup
npx supabase functions deploy

# OU déployer fonction par fonction (recommandé pour voir les erreurs)
npx supabase functions deploy stripe-checkout
npx supabase functions deploy stripe-webhook
npx supabase functions deploy stripe-add-account-checkout
npx supabase functions deploy stripe-update-subscription
npx supabase functions deploy stripe-download-invoice
npx supabase functions deploy stripe-force-sync
npx supabase functions deploy stripe-cancel-subscription
npx supabase functions deploy stripe-reactivate-subscription
npx supabase functions deploy stripe-sync-invoices
npx supabase functions deploy get-stripe-prices
npx supabase functions deploy gmail-oauth-init
npx supabase functions deploy gmail-oauth-callback
npx supabase functions deploy gmail-refresh-token
npx supabase functions deploy get-gmail-token
npx supabase functions deploy outlook-oauth-init
npx supabase functions deploy outlook-oauth-callback
npx supabase functions deploy verify-email-connection
npx supabase functions deploy delete-email-account
npx supabase functions deploy delete-user-account
npx supabase functions deploy cancel-duplicate-subscriptions
npx supabase functions deploy cleanup-orphan-subscriptions
```

### 5. Vérifier que les fonctions sont déployées

Va dans ton **dashboard Supabase** > **Edge Functions** et vérifie que toutes les fonctions apparaissent.

### 6. Configurer le webhook Stripe

1. Va dans ton **dashboard Stripe** > **Developers** > **Webhooks**
2. Crée un nouveau webhook pointant vers :
   ```
   https://bgvknwdjlrhzcitdfvwq.supabase.co/functions/v1/stripe-webhook
   ```
3. Sélectionne les événements à écouter (tous les événements liés aux subscriptions)
4. Copie le **Signing Secret** et ajoute-le dans Supabase comme `STRIPE_WEBHOOK_SECRET`

### 7. Vérifier les variables d'environnement du frontend

Assure-toi que ton fichier `.env.local` contient :

```env
NEXT_PUBLIC_SUPABASE_URL=https://bgvknwdjlrhzcitdfvwq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ton_anon_key
```

## ✅ Vérification

Après le déploiement, teste en créant une session de checkout. L'erreur CORS devrait disparaître.

## 🔍 Si ça ne marche toujours pas

1. Vérifie que l'URL dans `.env.local` correspond bien au nouveau projet
2. Vérifie que les secrets sont bien configurés dans Supabase
3. Vérifie les logs des fonctions dans le dashboard Supabase > Edge Functions > Logs

