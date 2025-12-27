-- Migration: Création de la table de mapping des rôles WordPress ↔ Supabase
-- Date: 2024-11-26
-- Description: Table pour lier les rôles Supabase aux rôles WordPress

-- Créer la table de mapping des rôles
CREATE TABLE IF NOT EXISTS public.roles_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_role user_role NOT NULL,
    wordpress_role TEXT NOT NULL,
    description TEXT, -- Description optionnelle du mapping
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT unique_role_mapping UNIQUE(supabase_role, wordpress_role),
    CONSTRAINT valid_wordpress_role CHECK (LENGTH(wordpress_role) > 0)
);

-- Créer les index pour optimiser les requêtes
CREATE INDEX idx_roles_mapping_supabase_role ON public.roles_mapping(supabase_role);
CREATE INDEX idx_roles_mapping_wordpress_role ON public.roles_mapping(wordpress_role);
CREATE INDEX idx_roles_mapping_is_active ON public.roles_mapping(is_active);

-- Activer RLS
ALTER TABLE public.roles_mapping ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- 1. Tous les utilisateurs authentifiés peuvent voir les mappings actifs
CREATE POLICY "Authenticated users can view active mappings" ON public.roles_mapping
    FOR SELECT USING (
        auth.role() = 'authenticated' AND is_active = true
    );

-- 2. Seuls les super_admin peuvent modifier les mappings
CREATE POLICY "Super admins can manage mappings" ON public.roles_mapping
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
        )
    );

-- Trigger pour updated_at
CREATE TRIGGER update_roles_mapping_updated_at
    BEFORE UPDATE ON public.roles_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer des mappings par défaut
INSERT INTO public.roles_mapping (supabase_role, wordpress_role, description) VALUES
    ('super_admin', 'administrator', 'Super administrateur - accès complet'),
    ('admin', 'administrator', 'Administrateur - gestion du contenu'),
    ('admin', 'editor', 'Administrateur - édition avancée'),
    ('ecp', 'contributor', 'ECP - contribution de contenu'),
    ('pdp', 'contributor', 'PDP - contribution de contenu'),
    ('individual', 'subscriber', 'Utilisateur individuel - lecture seule');

-- Vue pour faciliter les jointures
CREATE VIEW public.users_with_wordpress_roles AS
SELECT
    u.*,
    ARRAY_AGG(rm.wordpress_role) as wordpress_roles,
    ARRAY_AGG(rm.description) as wordpress_roles_descriptions
FROM public.users u
LEFT JOIN public.roles_mapping rm ON u.role = rm.supabase_role AND rm.is_active = true
GROUP BY u.id, u.role, u.email, u.first_name, u.last_name, u.phone, u.country_code,
         u.job_title, u.company_name, u.industry, u.experience_years, u.preferred_language,
         u.timezone, u.notifications_enabled, u.profile_completed, u.last_login_at,
         u.is_active, u.created_at, u.updated_at;

-- Politique RLS pour la vue
ALTER VIEW public.users_with_wordpress_roles SET (security_invoker = true);