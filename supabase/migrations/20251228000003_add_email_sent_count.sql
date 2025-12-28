-- Migration: Add email_sent_count to bulk_upload_jobs
-- Purpose: Track email sending progress separately from user creation

-- Add email_sent_count column
ALTER TABLE bulk_upload_jobs
ADD COLUMN IF NOT EXISTS email_sent_count INT NOT NULL DEFAULT 0;

-- Add email_status to items for more granular tracking
ALTER TABLE bulk_upload_items
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending'
CHECK (email_status IN ('pending', 'sending', 'sent', 'failed', 'skipped'));

-- Update existing items to have correct email_status based on email_queued
UPDATE bulk_upload_items
SET email_status = CASE
  WHEN email_queued = true THEN 'sent'
  WHEN status = 'skipped' THEN 'skipped'
  WHEN status = 'error' THEN 'failed'
  ELSE 'pending'
END
WHERE email_status IS NULL OR email_status = 'pending';
