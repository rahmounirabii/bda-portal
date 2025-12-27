-- Migration: Corriger la récursion infinie dans les politiques RLS
-- Date: 2024-11-26
-- Description: Supprime les politiques problématiques et les remplace par des versions sécurisées

-- 1. Supprimer toutes les politiques problématiques
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON public.users;

-- 2. Créer des politiques simples sans récursion
-- Les utilisateurs peuvent voir et modifier leur propre profil
-- (Cette politique existe déjà et fonctionne)

-- 3. Pour l'admin, on va utiliser une approche différente
-- Les super_admin peuvent tout voir et modifier
CREATE POLICY "Super admins full access" ON public.users
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'rahmounirabii.me@gmail.com'
        OR
        (auth.jwt() ->> 'email') = 'admin@bda-global.org'
    );

-- 4. Politique simple pour les admins via JWT claims
-- On peut ajouter des claims dans le JWT pour les rôles
CREATE POLICY "JWT admin access" ON public.users
    FOR SELECT USING (
        (auth.jwt() ->> 'role') = 'super_admin'
        OR
        (auth.jwt() ->> 'role') = 'admin'
        OR
        auth.uid() = id  -- L'utilisateur peut toujours voir son propre profil
    );

-- 5. Politique pour mise à jour par les admins
CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (
        (auth.jwt() ->> 'email') = 'rahmounirabii.me@gmail.com'
        OR
        (auth.jwt() ->> 'email') = 'admin@bda-global.org'
        OR
        auth.uid() = id  -- L'utilisateur peut toujours modifier son propre profil
    );

-- 6. Mise à jour de la vue pour éviter les problèmes
DROP VIEW IF EXISTS public.users_with_roles;

-- 7. Créer une vue simplifiée
CREATE VIEW public.users_with_roles AS
SELECT
    u.*,
    u.role as role_name,
    CASE
        WHEN u.role = 'individual' THEN 'Membre Individual'
        WHEN u.role = 'admin' THEN 'Administrateur'
        WHEN u.role = 'super_admin' THEN 'Super Administrateur'
        WHEN u.role = 'ecp' THEN 'Professionnel ECP'
        WHEN u.role = 'pdp' THEN 'Professionnel PDP'
        ELSE u.role::text
    END as role_display_name
FROM public.users u;

-- Politique RLS pour la vue
ALTER VIEW public.users_with_roles SET (security_invoker = true);