-- Migration: Création des tables pour le système de Support Tickets
-- Date: 2025-10-01
-- Description: Tables pour tickets, messages, attachements et historique

-- =============================================================================
-- TYPES ENUM
-- =============================================================================

CREATE TYPE ticket_category AS ENUM (
    'certification',
    'exam',
    'pdc',
    'account',
    'partnership',
    'technical',
    'other'
);

CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high');

CREATE TYPE ticket_status AS ENUM (
    'new',
    'in_progress',
    'waiting_user',
    'resolved',
    'closed'
);

-- =============================================================================
-- TABLE: support_tickets
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Numéro de ticket unique (auto-généré)
    ticket_number TEXT UNIQUE NOT NULL,

    -- Relations
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Informations
    category ticket_category NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,

    -- État
    priority ticket_priority NOT NULL DEFAULT 'normal',
    status ticket_status NOT NULL DEFAULT 'new',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,

    -- Contraintes
    CONSTRAINT valid_resolved_at CHECK (resolved_at IS NULL OR resolved_at >= created_at),
    CONSTRAINT valid_closed_at CHECK (closed_at IS NULL OR closed_at >= created_at)
);

-- Index
CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX idx_support_tickets_created ON public.support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_number ON public.support_tickets(ticket_number);

-- =============================================================================
-- TABLE: ticket_messages
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Contenu
    message TEXT NOT NULL,
    is_internal_note BOOLEAN NOT NULL DEFAULT false, -- Notes internes admins

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_user ON public.ticket_messages(user_id);
CREATE INDEX idx_ticket_messages_created ON public.ticket_messages(created_at);
CREATE INDEX idx_ticket_messages_internal ON public.ticket_messages(is_internal_note);

-- =============================================================================
-- TABLE: ticket_attachments
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Informations fichier
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Chemin dans Supabase Storage
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760) -- Max 10MB
);

-- Index
CREATE INDEX idx_ticket_attachments_ticket ON public.ticket_attachments(ticket_id);
CREATE INDEX idx_ticket_attachments_message ON public.ticket_attachments(message_id);
CREATE INDEX idx_ticket_attachments_uploader ON public.ticket_attachments(uploaded_by);

-- =============================================================================
-- TABLE: ticket_status_history
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ticket_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Changement
    old_status ticket_status,
    new_status ticket_status NOT NULL,
    change_reason TEXT,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_ticket_history_ticket ON public.ticket_status_history(ticket_id);
CREATE INDEX idx_ticket_history_created ON public.ticket_status_history(created_at);

-- =============================================================================
-- TABLE: ticket_templates (Pour admins)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ticket_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Informations
    title TEXT NOT NULL,
    category ticket_category,
    content TEXT NOT NULL,

    -- État
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Audit
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_ticket_templates_category ON public.ticket_templates(category);
CREATE INDEX idx_ticket_templates_active ON public.ticket_templates(is_active);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger pour updated_at sur support_tickets
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour updated_at sur ticket_messages
CREATE TRIGGER update_ticket_messages_updated_at
    BEFORE UPDATE ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour updated_at sur ticket_templates
CREATE TRIGGER update_ticket_templates_updated_at
    BEFORE UPDATE ON public.ticket_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour générer ticket_number automatiquement
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    year_str TEXT;
    sequence_num INTEGER;
BEGIN
    -- Obtenir l'année courante
    year_str := TO_CHAR(CURRENT_DATE, 'YYYY');

    -- Obtenir le prochain numéro de séquence pour cette année
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(ticket_number FROM 'TICK-' || year_str || '-(\d+)')
            AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM public.support_tickets
    WHERE ticket_number LIKE 'TICK-' || year_str || '-%';

    -- Générer le ticket_number
    NEW.ticket_number := 'TICK-' || year_str || '-' || LPAD(sequence_num::TEXT, 4, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number
    BEFORE INSERT ON public.support_tickets
    FOR EACH ROW
    WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
    EXECUTE FUNCTION generate_ticket_number();

-- Trigger pour logger les changements de statut
CREATE OR REPLACE FUNCTION log_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.ticket_status_history (
            ticket_id,
            changed_by,
            old_status,
            new_status
        ) VALUES (
            NEW.id,
            auth.uid(),
            OLD.status,
            NEW.status
        );

        -- Mettre à jour resolved_at si passage à 'resolved'
        IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
            NEW.resolved_at := NOW();
        END IF;

        -- Mettre à jour closed_at si passage à 'closed'
        IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
            NEW.closed_at := NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_ticket_status_change
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION log_ticket_status_change();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Activer RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_templates ENABLE ROW LEVEL SECURITY;

-- Policies: support_tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "Admins can view all tickets" ON public.support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can create tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Users can update their own tickets" ON public.support_tickets
    FOR UPDATE USING (
        user_id = auth.uid()
    ) WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Admins can update all tickets" ON public.support_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Only super admins can delete tickets" ON public.support_tickets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Policies: ticket_messages
CREATE POLICY "Users can view their ticket messages" ON public.ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_messages.ticket_id
            AND user_id = auth.uid()
            AND NOT ticket_messages.is_internal_note
        )
    );

CREATE POLICY "Admins can view all messages including internal" ON public.ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can create messages on their tickets" ON public.ticket_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_messages.ticket_id
            AND (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                    AND role IN ('admin', 'super_admin')
                )
            )
        )
    );

CREATE POLICY "Users can update their own messages" ON public.ticket_messages
    FOR UPDATE USING (
        user_id = auth.uid()
    ) WITH CHECK (
        user_id = auth.uid()
    );

-- Policies: ticket_attachments
CREATE POLICY "Users can view attachments of their tickets" ON public.ticket_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_attachments.ticket_id
            AND user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can upload attachments" ON public.ticket_attachments
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid()
    );

CREATE POLICY "Users can delete their own attachments" ON public.ticket_attachments
    FOR DELETE USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies: ticket_status_history
CREATE POLICY "Users can view history of their tickets" ON public.ticket_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id = ticket_status_history.ticket_id
            AND user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policies: ticket_templates
CREATE POLICY "Admins can manage templates" ON public.ticket_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- =============================================================================
-- FONCTIONS HELPER
-- =============================================================================

-- Fonction pour obtenir les statistiques d'un ticket
CREATE OR REPLACE FUNCTION get_ticket_stats(ticket_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'message_count', (
            SELECT COUNT(*)
            FROM public.ticket_messages
            WHERE ticket_id = ticket_uuid
            AND NOT is_internal_note
        ),
        'attachment_count', (
            SELECT COUNT(*)
            FROM public.ticket_attachments
            WHERE ticket_id = ticket_uuid
        ),
        'response_time_hours', (
            SELECT EXTRACT(EPOCH FROM (
                MIN(tm.created_at) - t.created_at
            )) / 3600
            FROM public.support_tickets t
            LEFT JOIN public.ticket_messages tm ON tm.ticket_id = t.id
            WHERE t.id = ticket_uuid
            AND tm.user_id != t.user_id
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ Support tickets tables created successfully!' as status;
