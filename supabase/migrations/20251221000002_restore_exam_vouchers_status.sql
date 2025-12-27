-- Restore status column to exam_vouchers table
-- The ECP migration dropped this column when recreating the voucher_status enum

-- First, update the check_voucher_expiration function to use new enum values
CREATE OR REPLACE FUNCTION check_voucher_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-expire if past expiration date and still available
    IF NEW.status = 'available' AND NEW.expires_at < NOW() THEN
        NEW.status := 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add status column back to exam_vouchers
ALTER TABLE public.exam_vouchers
ADD COLUMN IF NOT EXISTS status voucher_status NOT NULL DEFAULT 'available';

-- Update existing vouchers based on usage
UPDATE public.exam_vouchers
SET status = CASE
  WHEN used_at IS NOT NULL THEN 'used'::voucher_status
  WHEN expires_at < NOW() THEN 'expired'::voucher_status
  ELSE 'available'::voucher_status
END;

-- Add constraint to ensure status matches usage
ALTER TABLE public.exam_vouchers
DROP CONSTRAINT IF EXISTS valid_usage;

ALTER TABLE public.exam_vouchers
ADD CONSTRAINT valid_usage CHECK (
  (status = 'used' AND used_at IS NOT NULL AND attempt_id IS NOT NULL) OR
  (status != 'used')
);

COMMENT ON COLUMN public.exam_vouchers.status IS 'Voucher status: available, assigned, used, expired, or cancelled';
