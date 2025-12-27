-- Migration: Création de la table des utilisateurs
-- Date: 2024-11-26
-- Description: Table principale pour les utilisateurs du portail BDA

-- Créer la table des utilisateurs (étend auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'individual',

    -- Informations personnelles
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    country_code TEXT, -- Pour les IDs de certification (ex: EG, US, FR)

    -- Informations professionnelles
    job_title TEXT,
    company_name TEXT,
    industry TEXT,
    experience_years INTEGER,

    -- Préférences
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),
    timezone TEXT DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT true,

    -- Métadonnées
    profile_completed BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_country_code CHECK (country_code ~* '^[A-Z]{2}$'),
    CONSTRAINT valid_experience CHECK (experience_years >= 0 AND experience_years <= 70)
);

-- Créer les index pour optimiser les requêtes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_country_code ON public.users(country_code);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_profile_completed ON public.users(profile_completed);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Activer RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- 1. Les utilisateurs peuvent voir et modifier leur propre profil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 2. Les administrateurs peuvent voir tous les utilisateurs
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- 3. Les super_admin peuvent tout faire
CREATE POLICY "Super admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'super_admin'
        )
    );

-- 4. Permettre l'insertion lors de l'inscription (via fonction sécurisée)
CREATE POLICY "Allow insert during signup" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger pour updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil utilisateur lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer le profil utilisateur avec le rôle par défaut 'individual'
    INSERT INTO public.users (id, role, email, first_name, last_name)
    VALUES (
        NEW.id,
        'individual', -- Rôle par défaut
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement le profil lors de l'inscription
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vue pour joindre les utilisateurs avec leurs rôles (pour simplifier les requêtes)
CREATE VIEW public.users_with_roles AS
SELECT
    u.*,
    r.name as role_name,
    r.display_name as role_display_name,
    r.permissions as role_permissions
FROM public.users u
JOIN public.roles r ON u.role = r.name;

-- Politique RLS pour la vue
ALTER VIEW public.users_with_roles SET (security_invoker = true);