-- Migration: Add exam_language to vouchers
-- Date: 2025-12-28
-- Description: Add exam_language field to track EN/AR for vouchers per spec

-- =============================================================================
-- ADD EXAM LANGUAGE TO VOUCHERS
-- =============================================================================

-- Create enum for exam language if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_language') THEN
        CREATE TYPE exam_language AS ENUM ('en', 'ar');
    END IF;
END$$;

-- Add exam_language column to exam_vouchers
ALTER TABLE public.exam_vouchers
ADD COLUMN IF NOT EXISTS exam_language exam_language NOT NULL DEFAULT 'en';

-- Add index for language filtering
CREATE INDEX IF NOT EXISTS idx_exam_vouchers_language ON public.exam_vouchers(exam_language);

-- Update voucher code generation to include language
CREATE OR REPLACE FUNCTION generate_voucher_code(cert_type certification_type, lang exam_language DEFAULT 'en')
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    lang_suffix TEXT;
    random_suffix TEXT;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    -- Set prefix based on certification type
    prefix := CASE
        WHEN cert_type = 'CP' THEN 'CERT-CP-'
        WHEN cert_type = 'SCP' THEN 'CERT-SCP-'
        ELSE 'CERT-'
    END;

    -- Add language identifier
    lang_suffix := CASE
        WHEN lang = 'ar' THEN 'AR-'
        ELSE 'EN-'
    END;

    -- Generate unique code
    LOOP
        -- Generate random 6-character alphanumeric suffix
        random_suffix := upper(substring(md5(random()::text) from 1 for 6));
        new_code := prefix || lang_suffix || random_suffix;

        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.exam_vouchers WHERE code = new_code) INTO code_exists;

        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON COLUMN public.exam_vouchers.exam_language IS 'Language for the exam: en (English) or ar (Arabic)';
