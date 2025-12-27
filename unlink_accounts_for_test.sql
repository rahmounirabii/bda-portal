-- Script pour délier les comptes Portal et Store
-- Utilisé pour tester le Cas 4 : comptes existants non liés

-- 1. Délier le compte Portal du Store
UPDATE public.users
SET
  wp_user_id = NULL,
  wp_sync_status = 'not_synced',
  wp_last_sync = NULL,
  signup_type = 'portal-only',
  updated_at = NOW()
WHERE email = 'r94466441@gmail.com';

-- 2. Vérifier le résultat
SELECT
  'Compte déliée pour test Cas 4' as status,
  id,
  email,
  first_name,
  last_name,
  wp_user_id,
  wp_sync_status,
  signup_type
FROM public.users
WHERE email = 'r94466441@gmail.com';

-- 3. Vérifier l'état des comptes
SELECT '✅ Prêt pour test Cas 4' as info;
SELECT '📌 Portal: Compte existe avec wp_user_id = NULL' as portal_status;
SELECT '📌 Store: Compte WordPress ID=33 existe toujours' as store_status;
SELECT '🎯 Maintenant: Faire signup avec cet email devrait détecter les deux comptes et demander liaison' as next_step;
