-- Migration: Create Role Mapping Table
-- Date: 2024-11-27
-- Description: Allows admin to map WordPress roles to Supabase roles

-- Create table for role mappings
CREATE TABLE IF NOT EXISTS public.wordpress_role_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wordpress_role TEXT NOT NULL,
    wordpress_role_display TEXT,
    supabase_role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority = preferred mapping
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(wordpress_role, supabase_role),
    CONSTRAINT valid_wordpress_role CHECK (wordpress_role != ''),
    CONSTRAINT valid_priority CHECK (priority >= 0)
);

-- Index for performance
CREATE INDEX idx_wp_role_mappings_wp_role ON public.wordpress_role_mappings(wordpress_role);
CREATE INDEX idx_wp_role_mappings_supabase_role ON public.wordpress_role_mappings(supabase_role);
CREATE INDEX idx_wp_role_mappings_active ON public.wordpress_role_mappings(is_active);
CREATE INDEX idx_wp_role_mappings_priority ON public.wordpress_role_mappings(priority DESC);

-- Enable RLS
ALTER TABLE public.wordpress_role_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin can manage role mappings" ON public.wordpress_role_mappings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "All authenticated users can view role mappings" ON public.wordpress_role_mappings
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Function to get mapped Supabase role from WordPress role
CREATE OR REPLACE FUNCTION public.get_supabase_role_from_wp(wp_role TEXT)
RETURNS user_role AS $$
DECLARE
    mapped_role user_role;
BEGIN
    -- Get the highest priority active mapping for this WordPress role
    SELECT supabase_role INTO mapped_role
    FROM public.wordpress_role_mappings
    WHERE wordpress_role = wp_role
      AND is_active = true
    ORDER BY priority DESC, created_at ASC
    LIMIT 1;

    -- If no mapping found, return default
    IF mapped_role IS NULL THEN
        -- Default mapping logic
        CASE wp_role
            WHEN 'administrator' THEN mapped_role := 'admin';
            WHEN 'editor' THEN mapped_role := 'admin';
            WHEN 'author' THEN mapped_role := 'ecp';
            WHEN 'contributor' THEN mapped_role := 'pdp';
            WHEN 'subscriber' THEN mapped_role := 'individual';
            WHEN 'customer' THEN mapped_role := 'individual';
            ELSE mapped_role := 'individual';
        END CASE;
    END IF;

    RETURN mapped_role;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to create or update role mapping
CREATE OR REPLACE FUNCTION public.upsert_role_mapping(
    p_wordpress_role TEXT,
    p_wordpress_role_display TEXT,
    p_supabase_role user_role,
    p_priority INTEGER DEFAULT 0
) RETURNS JSON AS $$
DECLARE
    v_mapping_id UUID;
    v_result JSON;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;

    -- Insert or update mapping
    INSERT INTO public.wordpress_role_mappings (
        wordpress_role,
        wordpress_role_display,
        supabase_role,
        priority,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        p_wordpress_role,
        p_wordpress_role_display,
        p_supabase_role,
        p_priority,
        auth.uid(),
        NOW(),
        NOW()
    )
    ON CONFLICT (wordpress_role, supabase_role)
    DO UPDATE SET
        wordpress_role_display = EXCLUDED.wordpress_role_display,
        priority = EXCLUDED.priority,
        updated_at = NOW()
    RETURNING id INTO v_mapping_id;

    v_result := json_build_object(
        'success', true,
        'mapping_id', v_mapping_id,
        'action', 'upserted'
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default mappings
INSERT INTO public.wordpress_role_mappings (
    wordpress_role,
    wordpress_role_display,
    supabase_role,
    priority,
    is_active
) VALUES
    ('administrator', 'Administrator', 'admin', 100, true),
    ('super_admin', 'Super Admin', 'super_admin', 100, true),
    ('editor', 'Editor', 'admin', 80, true),
    ('author', 'Author', 'ecp', 60, true),
    ('contributor', 'Contributor', 'pdp', 50, true),
    ('subscriber', 'Subscriber', 'individual', 40, true),
    ('customer', 'Customer', 'individual', 30, true),
    ('shop_manager', 'Shop Manager', 'admin', 70, true)
ON CONFLICT (wordpress_role, supabase_role) DO NOTHING;

-- Comments
COMMENT ON TABLE public.wordpress_role_mappings IS 'Maps WordPress roles to Supabase roles for transparent authentication';
COMMENT ON COLUMN public.wordpress_role_mappings.wordpress_role IS 'WordPress role slug (e.g., administrator, customer)';
COMMENT ON COLUMN public.wordpress_role_mappings.wordpress_role_display IS 'Human-readable WordPress role name';
COMMENT ON COLUMN public.wordpress_role_mappings.supabase_role IS 'Mapped Supabase user_role enum value';
COMMENT ON COLUMN public.wordpress_role_mappings.priority IS 'Higher number = higher priority when multiple mappings exist';
COMMENT ON COLUMN public.wordpress_role_mappings.is_active IS 'Whether this mapping is currently active';