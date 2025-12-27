-- Migration: Création du bucket Supabase Storage pour les pièces jointes des tickets
-- Date: 2025-10-01
-- Description: Bucket et policies RLS pour les fichiers attachés aux tickets de support

-- =============================================================================
-- CRÉER LE BUCKET STORAGE
-- =============================================================================

-- Créer le bucket pour les pièces jointes des tickets de support
INSERT INTO storage.buckets (id, name)
VALUES ('support-attachments', 'support-attachments')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- RLS POLICIES POUR LE BUCKET
-- =============================================================================

-- Note: RLS est déjà activé par défaut sur storage.objects par Supabase

-- ====================================
-- POLICY 1: SELECT (Téléchargement/Lecture)
-- ====================================

-- Les utilisateurs peuvent voir les fichiers de leurs propres tickets
-- Les admins peuvent voir tous les fichiers
CREATE POLICY "Users can view attachments from their own tickets"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'support-attachments'
    AND (
        -- User is the ticket owner
        EXISTS (
            SELECT 1
            FROM public.ticket_attachments ta
            JOIN public.support_tickets st ON st.id = ta.ticket_id
            WHERE ta.file_path = storage.objects.name
            AND st.user_id = auth.uid()
        )
        OR
        -- User is an admin or super_admin
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
        OR
        -- User uploaded the file themselves
        EXISTS (
            SELECT 1
            FROM public.ticket_attachments ta
            WHERE ta.file_path = storage.objects.name
            AND ta.uploaded_by = auth.uid()
        )
    )
);

-- ====================================
-- POLICY 2: INSERT (Upload)
-- ====================================

-- Les utilisateurs peuvent uploader dans leurs propres tickets
-- Les admins peuvent uploader dans n'importe quel ticket
CREATE POLICY "Users can upload attachments to their own tickets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'support-attachments'
    AND (
        -- Extract ticket_id from path (format: {ticket_id}/{timestamp}-{filename})
        -- User is the owner of the ticket they're uploading to
        EXISTS (
            SELECT 1
            FROM public.support_tickets st
            WHERE st.id::text = split_part(storage.objects.name, '/', 1)
            AND st.user_id = auth.uid()
        )
        OR
        -- User is an admin or super_admin (can upload to any ticket)
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    )
);

-- ====================================
-- POLICY 3: UPDATE (Modification)
-- ====================================

-- Personne ne peut modifier les fichiers uploadés (immutables)
-- Si un fichier doit être changé, il faut le supprimer et en uploader un nouveau
CREATE POLICY "Attachments are immutable"
ON storage.objects FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- ====================================
-- POLICY 4: DELETE (Suppression)
-- ====================================

-- Les utilisateurs peuvent supprimer leurs propres uploads dans leurs propres tickets
-- Les admins peuvent supprimer n'importe quel fichier
CREATE POLICY "Users can delete their own attachments from their own tickets"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'support-attachments'
    AND (
        -- User uploaded the file AND owns the ticket
        EXISTS (
            SELECT 1
            FROM public.ticket_attachments ta
            JOIN public.support_tickets st ON st.id = ta.ticket_id
            WHERE ta.file_path = storage.objects.name
            AND ta.uploaded_by = auth.uid()
            AND st.user_id = auth.uid()
        )
        OR
        -- User is an admin or super_admin (can delete any attachment)
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    )
);

-- =============================================================================
-- NOTE
-- =============================================================================
-- Les commentaires sur les policies sont documentés ci-dessus dans les commentaires SQL
