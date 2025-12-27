-- =====================================================
-- SYSTÈME RLS PROFESSIONNEL - VERSION CORRIGÉE
-- =====================================================
-- Remplace les RLS récursifs par un système basé sur les fonctions
-- Compatible avec le schéma existant (ENUM user_role)
-- =====================================================

-- =====================================================
-- 1. NETTOYAGE DES ANCIENS RLS
-- =====================================================

-- Supprimer les anciennes politiques RLS pour éviter les conflits
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON public.users;

-- =====================================================
-- 2. FONCTIONS DE SÉCURITÉ
-- =====================================================

-- Fonction pour obtenir le rôle de l'utilisateur actuel
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role
        FROM public.users
        WHERE id = auth.uid()
        LIMIT 1
    );
EXCEPTION WHEN OTHERS THEN
    RETURN 'individual'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN public.get_user_role() IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur est super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
    RETURN public.get_user_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier une permission spécifique
CREATE OR REPLACE FUNCTION public.has_permission(required_permission text)
RETURNS boolean AS $$
DECLARE
    user_role_val user_role;
BEGIN
    user_role_val := public.get_user_role();

    -- Permissions basées sur les rôles
    CASE user_role_val
        WHEN 'super_admin' THEN
            RETURN true; -- Super admin a toutes les permissions
        WHEN 'admin' THEN
            RETURN required_permission IN (
                'view_profile', 'edit_profile', 'manage_users',
                'view_all_users', 'view_analytics', 'manage_content'
            );
        WHEN 'ecp' THEN
            RETURN required_permission IN (
                'view_profile', 'edit_profile', 'manage_content',
                'view_analytics', 'manage_candidates'
            );
        WHEN 'pdp' THEN
            RETURN required_permission IN (
                'view_profile', 'edit_profile', 'view_analytics', 'manage_programs'
            );
        WHEN 'individual' THEN
            RETURN required_permission IN ('view_profile', 'edit_profile');
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FONCTIONS MÉTIER SÉCURISÉES
-- =====================================================

-- Fonction pour promouvoir un utilisateur (super admin seulement)
CREATE OR REPLACE FUNCTION public.promote_user(
    target_user_id uuid,
    new_role user_role
)
RETURNS json AS $$
DECLARE
    current_user_role user_role;
    super_admin_count integer;
BEGIN
    -- Vérifier que l'utilisateur actuel est super admin
    current_user_role := auth.get_user_role();
    IF current_user_role != 'super_admin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions: Only super admins can promote users'
        );
    END IF;

    -- Si on veut rétrograder un super admin, vérifier qu'il ne soit pas le dernier
    IF new_role != 'super_admin' THEN
        SELECT COUNT(*) INTO super_admin_count
        FROM public.users
        WHERE role = 'super_admin' AND id != target_user_id;

        IF super_admin_count = 0 THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Cannot demote the last super admin'
            );
        END IF;
    END IF;

    -- Effectuer la promotion
    UPDATE public.users
    SET
        role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'User role updated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. NOUVELLES POLITIQUES RLS SÉCURISÉES
-- =====================================================

-- Activer RLS sur la table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politique pour voir son propre profil
CREATE POLICY "users_view_own_profile" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Politique pour modifier son propre profil
CREATE POLICY "users_update_own_profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Politique pour que les admins voient tous les utilisateurs
CREATE POLICY "admins_view_all_users" ON public.users
    FOR SELECT
    USING (public.is_admin());

-- Politique pour que les super admins gèrent tous les utilisateurs
CREATE POLICY "super_admins_manage_all_users" ON public.users
    FOR ALL
    USING (public.is_super_admin());

-- Politique pour l'insertion de nouveaux utilisateurs (signup)
CREATE POLICY "allow_signup" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- 5. VUES ET FONCTIONS UTILITAIRES
-- =====================================================

-- Vue pour les détails utilisateur (sécurisée)
CREATE OR REPLACE VIEW public.users_with_details AS
SELECT
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    profile_completed,
    created_at,
    last_login_at,
    CASE
        WHEN role = 'individual' THEN 'Membre Individual'
        WHEN role = 'ecp' THEN 'Professionnel ECP'
        WHEN role = 'pdp' THEN 'Professionnel PDP'
        WHEN role = 'admin' THEN 'Administrateur'
        WHEN role = 'super_admin' THEN 'Super Administrateur'
        ELSE 'Inconnu'
    END as role_display_name
FROM public.users;

-- Vue pour les statistiques admin
CREATE OR REPLACE VIEW public.admin_user_stats AS
SELECT
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN profile_completed = true THEN 1 END) as completed_profiles,
    AVG(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1.0 ELSE 0.0 END) as recent_signups_ratio
FROM public.users
GROUP BY role;

-- Politique RLS pour les vues
ALTER VIEW public.users_with_details SET (security_invoker = true);
ALTER VIEW public.admin_user_stats SET (security_invoker = true);

-- =====================================================
-- 6. FONCTIONS RPC POUR LE FRONTEND
-- =====================================================

-- Fonction RPC pour vérifier les permissions depuis le frontend
CREATE OR REPLACE FUNCTION public.check_permission(required_permission text)
RETURNS json AS $$
BEGIN
    RETURN json_build_object(
        'hasPermission', public.has_permission(required_permission),
        'role', public.get_user_role()::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction RPC pour obtenir les informations utilisateur enrichies
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS json AS $$
DECLARE
    user_data record;
BEGIN
    SELECT * INTO user_data
    FROM public.users_with_details
    WHERE id = auth.uid();

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'User not found');
    END IF;

    RETURN row_to_json(user_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS ET VALIDATIONS
-- =====================================================

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger s'il n'existe pas déjà
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. PERMISSIONS SUR LES FONCTIONS
-- =====================================================

-- Donner accès aux fonctions RPC pour les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.check_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_user(uuid, user_role) TO authenticated;

-- Accès aux vues pour les utilisateurs authentifiés
GRANT SELECT ON public.users_with_details TO authenticated;
GRANT SELECT ON public.admin_user_stats TO authenticated;

-- =====================================================
-- COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.get_user_role() IS 'Obtient le rôle de l''utilisateur actuel de manière sécurisée';
COMMENT ON FUNCTION public.has_permission(text) IS 'Vérifie si l''utilisateur actuel a une permission spécifique';
COMMENT ON FUNCTION public.promote_user(uuid, user_role) IS 'Promeut un utilisateur (super admin seulement)';
COMMENT ON FUNCTION public.check_permission(text) IS 'Fonction RPC pour vérifier les permissions depuis le frontend';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
-- Ce système RLS professionnel élimine la récursion
-- et fournit une base solide pour la gestion des permissions
-- =====================================================