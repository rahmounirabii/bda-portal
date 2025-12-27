-- Migration: Création de la table des rôles
-- Date: 2024-11-26
-- Description: Table pour gérer les différents rôles dans le portail BDA

-- Activer l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Créer un type ENUM pour les rôles
CREATE TYPE user_role AS ENUM (
    'individual',     -- Professionnel individuel
    'admin',         -- Administrateur BDA
    'ecp',           -- Partenaire ECP (Formation et examens)
    'pdp',           -- Partenaire PDP (Développement professionnel)
    'super_admin'    -- Super administrateur
);

-- Créer la table des rôles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name user_role NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les rôles de base
INSERT INTO public.roles (name, display_name, description, permissions) VALUES
(
    'individual',
    'Professional Individual',
    'Individual professional seeking certifications and professional development',
    '["view_own_profile", "manage_own_certifications", "submit_pdcs", "take_exams", "access_materials"]'::jsonb
),
(
    'ecp',
    'ECP Partner',
    'Examination and Certification Partner - Authorized training provider',
    '["view_own_profile", "manage_trainees", "conduct_exams", "view_exam_results", "access_training_materials"]'::jsonb
),
(
    'pdp',
    'PDP Partner',
    'Professional Development Partner - Authorized PDC provider',
    '["view_own_profile", "manage_programs", "validate_pdcs", "view_participants"]'::jsonb
),
(
    'admin',
    'BDA Administrator',
    'BDA staff member with administrative privileges',
    '["manage_users", "manage_certifications", "validate_pdcs", "generate_reports", "manage_partners"]'::jsonb
),
(
    'super_admin',
    'Super Administrator',
    'Full system access and control',
    '["*"]'::jsonb
);

-- Créer les index
CREATE INDEX idx_roles_name ON public.roles(name);
CREATE INDEX idx_roles_is_active ON public.roles(is_active);

-- Activer RLS (Row Level Security)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Tout le monde peut lire les rôles actifs
CREATE POLICY "Anyone can view active roles" ON public.roles
    FOR SELECT USING (is_active = true);

-- Politique RLS : Seuls les super_admin peuvent modifier les rôles
CREATE POLICY "Only super admins can modify roles" ON public.roles
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'super_admin'
    );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();