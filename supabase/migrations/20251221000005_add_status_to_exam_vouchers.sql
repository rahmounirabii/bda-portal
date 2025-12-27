-- Add status column to exam_vouchers table
-- This column tracks the lifecycle of vouchers

-- Create the enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE voucher_status AS ENUM ('available', 'assigned', 'used', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column with default value 'available'
ALTER TABLE public.exam_vouchers
  ADD COLUMN IF NOT EXISTS status voucher_status NOT NULL DEFAULT 'available';

-- Set initial status based on used_at
UPDATE public.exam_vouchers
SET status = CASE
  WHEN used_at IS NOT NULL THEN 'used'::voucher_status
  WHEN expires_at < NOW() THEN 'expired'::voucher_status
  ELSE 'available'::voucher_status
END
WHERE status = 'available'; -- Only update if still default

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_exam_vouchers_status ON public.exam_vouchers(status);

-- Comment
COMMENT ON COLUMN public.exam_vouchers.status IS 'Lifecycle status of the voucher: available, assigned, used, expired, cancelled';
